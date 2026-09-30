import { defineBackendChunk } from "./contract";

/**
 * Messaging & Caching (b207–b216).
 *
 * Maps to Chapter 9 of the master interview plan (Q186–Q195). Kafka/broker
 * fundamentals, delivery semantics, and Redis caching patterns — the
 * asynchronous and performance building blocks of a real backend.
 */
export const chunk13MessagingCaching = defineBackendChunk({
  topic: "messaging-caching",
  questions: [
    {
      id: "b207",
      question: "Queue vs topic — explain point-to-point and publish/subscribe.",
      answer:
        "Two fundamental messaging shapes:\n\n" +
        "- **Queue (point-to-point)** — a message is delivered to **exactly one** consumer among many competing consumers. Used for **work distribution**: N workers pull tasks, each task handled once. Scales horizontally by adding consumers. (RabbitMQ queue, SQS.)\n" +
        "- **Topic (publish/subscribe)** — a message is **broadcast to all** interested subscribers. Used for **event notification/fan-out**: one 'OrderPlaced' event, many independent consumers (email, analytics, inventory) each get their own copy.\n\n" +
        "**Kafka blends both** with **consumer groups**: a topic is pub/sub across *groups*, but within one group each partition goes to exactly one consumer (queue-like load balancing). So adding consumers to the same group shares the load; adding a new group gives another full copy of the stream.\n\n" +
        "Choose queue semantics for 'do this once' work; topic semantics for 'tell everyone this happened'. This distinction drives whether adding consumers splits or duplicates the work.",
      code: `// Kafka: SAME group id -> load-balanced (queue-like); each record handled once
@KafkaListener(topics = "orders", groupId = "inventory-service")
void updateStock(OrderEvent e) { /* one group member processes each record */ }

// DIFFERENT group id -> independent full copy of the stream (pub/sub)
@KafkaListener(topics = "orders", groupId = "analytics-service")
void track(OrderEvent e) { /* also receives every record */ }`,
      codeLanguage: "java",
      explanation:
        "Messaging fundamentals — queue = handled once by one consumer, topic = broadcast to all; Kafka consumer groups combine both.",
      followUps: [
        "How do Kafka consumer groups give both models?",
        "When do you want fan-out vs work distribution?",
        "What happens if you add a consumer to an existing group?",
      ],
    },
    {
      id: "b208",
      question: "Explain Kafka topics, partitions and consumer groups.",
      answer:
        "**Topic** — a named, append-only log of records. **Partitions** split a topic into ordered, independent logs — the unit of **parallelism and ordering**. Each record has an **offset** (its position in a partition).\n\n" +
        "**Ordering is per-partition only.** Records with the same **key** hash to the same partition, so all events for one entity (e.g. `orderId`) are ordered relative to each other; there's no global order across partitions. Choose the partition key to match your ordering requirement.\n\n" +
        "**Consumer group** — consumers sharing a `group.id`. Kafka assigns each partition to **exactly one** consumer in the group, so **max useful parallelism = partition count**. More consumers than partitions leaves some idle. **Offsets** are committed per group, so each group tracks its own progress and can replay independently.\n\n" +
        "**Rebalancing** — when a consumer joins/leaves, partitions are reassigned (briefly pausing consumption). Replication (`replication.factor`) gives durability; the leader handles reads/writes, followers replicate.",
      code: `// Partitioning by key guarantees per-order ordering
kafkaTemplate.send("orders", order.id(), event);   // key = order id -> same partition

// Parallelism: 6 partitions -> up to 6 active consumers in the group
@KafkaListener(topics = "orders", groupId = "billing", concurrency = "6")
void handle(ConsumerRecord<String, OrderEvent> rec) {
    // rec.partition(), rec.offset() -> position in the log
}

// Topic with 6 partitions and 3 replicas (durability)
// kafka-topics --create --topic orders --partitions 6 --replication-factor 3`,
      codeLanguage: "java",
      explanation:
        "Kafka core mental model — partitions as the unit of ordering/parallelism, key-based routing, and per-group offset tracking.",
      followUps: [
        "Why is ordering only guaranteed within a partition?",
        "What limits consumer parallelism in a group?",
        "What triggers a rebalance and why does it hurt?",
      ],
    },
    {
      id: "b209",
      question: "Explain the message delivery semantics: at-most-once, at-least-once, exactly-once.",
      answer:
        "The guarantee depends on **when you commit the offset/ack relative to processing**:\n\n" +
        "- **At-most-once** — commit the offset **before** processing. If you crash mid-process, the message is lost (never redelivered). No duplicates, but data loss. Rarely acceptable.\n" +
        "- **At-least-once** — commit **after** successful processing. If you crash before committing, the message is redelivered → possible **duplicates**, never loss. The common, practical default.\n" +
        "- **Exactly-once** — no loss, no duplicates. Hard in general. Kafka offers exactly-once *within Kafka* via idempotent producers + transactions (read-process-write atomically). But when a side effect touches an external system (DB, email), true exactly-once needs **idempotent consumers** — the pragmatic answer is 'at-least-once delivery + idempotent processing = effectively exactly-once'.\n\n" +
        "So: prefer at-least-once and make consumers **idempotent** (dedupe on a message/business id, or use upserts). Don't claim exactly-once without qualifying it.",
      code: `// At-least-once + idempotent consumer = effectively exactly-once
@KafkaListener(topics = "payments", groupId = "ledger")
@Transactional
void onPayment(PaymentEvent e, Acknowledgment ack) {
    // Dedupe on the event id (unique constraint) so redelivery is a no-op
    if (processedRepo.existsById(e.eventId())) { ack.acknowledge(); return; }
    ledger.apply(e);
    processedRepo.save(new Processed(e.eventId()));  // same tx as the side effect
    ack.acknowledge();                               // commit offset AFTER work
}`,
      codeLanguage: "java",
      explanation:
        "Reliability design — commit-timing defines the guarantee; at-least-once + idempotent consumers is the realistic 'exactly-once'.",
      followUps: [
        "Why is true exactly-once hard with external side effects?",
        "How does commit timing change the guarantee?",
        "How do you make a consumer idempotent?",
      ],
    },
    {
      id: "b210",
      question: "How do you handle ordering, retries and poison messages (DLQ)?",
      answer:
        "**Ordering** — guaranteed only within a partition, so route records that must stay ordered to the same partition via a **key** (e.g. `accountId`). Beware: concurrent processing or retries can reorder within a consumer — keep per-key handling single-threaded.\n\n" +
        "**Retries** — transient failures (downstream 503, timeout) should retry with **backoff**. But blocking retries on one record **stall the whole partition** (head-of-line blocking). Options: a bounded in-memory retry, or Spring Kafka's **non-blocking retry topics** (retry-500ms, retry-5s...) so other records keep flowing.\n\n" +
        "**Poison message** — a record that always fails (bad data, unhandled case) will otherwise be retried forever and block the partition. After N attempts, send it to a **Dead-Letter Queue/Topic** with the failure metadata, then continue. Someone inspects/repairs/replays the DLQ later.\n\n" +
        "Combine: retry transient errors a few times → on exhaustion, DLQ → alert. Keep consumers idempotent because retries imply reprocessing.",
      code: `@Configuration
class KafkaRetryConfig {

    // Non-blocking retries then a DLT, so one bad record doesn't block the partition
    @Bean
    DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template);   // -> orders.DLT
        var backoff = new ExponentialBackOffWithMaxRetries(3);
        backoff.setInitialInterval(500);
        backoff.setMultiplier(2.0);
        return new DefaultErrorHandler(recoverer, backoff);
    }
}

@KafkaListener(topics = "orders", groupId = "billing")
void handle(OrderEvent e) { /* throws -> retried, then routed to orders.DLT */ }`,
      codeLanguage: "java",
      explanation:
        "Robust consumer design — key-based ordering, non-blocking retries to avoid head-of-line blocking, and a DLQ for poison messages.",
      followUps: [
        "Why can blocking retries stall a whole partition?",
        "What is a poison message and how do you contain it?",
        "How do you replay from a DLQ safely?",
      ],
    },
    {
      id: "b211",
      question: "Explain offset commits, consumer lag and rebalancing.",
      answer:
        "**Offsets** track how far a consumer group has read each partition. Commit strategy matters:\n\n" +
        "- **Auto-commit** (`enable.auto.commit=true`) commits periodically on a timer — convenient but risks committing records you haven't finished processing (data loss on crash) or reprocessing. \n" +
        "- **Manual commit** — commit **after** processing (`ack`/`commitSync`) for at-least-once control. This is the recommended default in Spring Kafka (`AckMode.MANUAL`/`RECORD`).\n\n" +
        "**Consumer lag** = latest offset − committed offset: how far behind the consumer is. Rising lag means consumers can't keep up (too slow, too few partitions/consumers, a stuck record). It's the **key health metric** to alert on.\n\n" +
        "**Rebalancing** — when consumers join/leave or partitions change, Kafka reassigns partitions across the group. During a rebalance consumption pauses ('stop the world'); frequent rebalances (from long processing exceeding `max.poll.interval.ms`, or flapping consumers) hurt throughput. Mitigate with cooperative-sticky assignment, tuning poll intervals, and keeping processing fast (or `pause()`ing).",
      code: `# application.yml: manual commit for at-least-once control
spring:
  kafka:
    consumer:
      enable-auto-commit: false
      max-poll-records: 100
      properties:
        max.poll.interval.ms: 300000     # must exceed worst-case batch processing
    listener:
      ack-mode: manual

# Monitor lag (alert when it grows without bound):
# kafka-consumer-groups --describe --group billing --bootstrap-server ...
#   TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG`,
      codeLanguage: "yaml",
      explanation:
        "Operational Kafka skill — manual vs auto commit trade-offs, consumer lag as the health signal, and what causes/mitigates rebalances.",
      followUps: [
        "Why prefer manual commit over auto-commit?",
        "What does rising consumer lag tell you?",
        "How does slow processing trigger rebalances?",
      ],
    },
    {
      id: "b212",
      question: "What are the core Redis data structures and their uses?",
      answer:
        "Redis is an in-memory key/value store with rich types, so you pick the structure to fit the access pattern:\n\n" +
        "- **String** — caching (serialized objects/JSON), counters (`INCR`), flags, rate-limit tokens. Supports TTL (`SETEX`).\n" +
        "- **Hash** — a map per key; store an object's fields (`user:42 -> {name, email}`) and update fields individually.\n" +
        "- **List** — ordered; simple queues/stacks (`LPUSH`/`RPOP`), recent-items feeds.\n" +
        "- **Set** — unique members; tags, unique visitors, membership tests, set algebra (intersect/union).\n" +
        "- **Sorted set (ZSet)** — members with scores, kept ordered; **leaderboards**, priority queues, time-ordered indexes, sliding-window rate limiters.\n" +
        "- Plus **streams** (log/consumer groups), **HyperLogLog** (approx cardinality), **bitmaps**, **geo**, and pub/sub.\n\n" +
        "Everything is single-threaded for commands (atomic per command), supports **TTL/expiry** and eviction policies. Model your problem to a native structure rather than fetching-and-recomputing in the app.",
      code: `// Counter with expiry (e.g. daily API usage)
redis.opsForValue().increment("usage:42:2026-09-30");
redis.expire("usage:42:2026-09-30", Duration.ofDays(2));

// Leaderboard with a sorted set
redis.opsForZSet().add("leaderboard", "player:7", 1500);
Set<String> top10 = redis.opsForZSet().reverseRange("leaderboard", 0, 9);

// Object fields in a hash
redis.opsForHash().put("user:42", "email", "a@x.com");`,
      codeLanguage: "java",
      explanation:
        "Practical Redis usage — matching strings/hashes/sets/sorted-sets to counters, objects, membership and leaderboards, with TTL.",
      followUps: [
        "When a sorted set vs a list?",
        "How do you use Redis for counters/rate limits?",
        "What eviction policies does Redis offer?",
      ],
    },
    {
      id: "b213",
      question: "Explain the cache-aside pattern and cache invalidation.",
      answer:
        "**Cache-aside (lazy loading)** — the app manages the cache: on read, check the cache; on **miss**, load from the DB, populate the cache (with TTL), and return. On write, update the DB and **invalidate/update** the cache entry. It's the most common pattern; the cache only holds what's actually requested.\n\n" +
        "Other patterns: **read-through/write-through** (the cache library loads/writes to the DB for you) and **write-behind** (async write, risk of loss).\n\n" +
        "**Invalidation** is the hard part ('one of the two hard things in CS'). On update, either **evict** the key (simplest, next read repopulates) or **update** it (risk of races). Set **TTLs** as a safety net so stale data self-heals. Watch the **stale-read race**: reader loads old value, writer updates DB + evicts, reader writes old value back — mitigate by writing DB→then→evict, short TTLs, or versioning.\n\n" +
        "In Spring, `@Cacheable`/`@CacheEvict`/`@CachePut` implement cache-aside declaratively over a `CacheManager` (Redis/Caffeine).",
      code: `@Service
class ProductService {

    @Cacheable(cacheNames = "products", key = "#id")     // read-through cache-aside
    public Product get(long id) {
        return repo.findById(id).orElseThrow();          // only runs on a cache miss
    }

    @CacheEvict(cacheNames = "products", key = "#p.id")  // invalidate on write
    @Transactional
    public Product update(Product p) {
        return repo.save(p);
    }
}

# Redis TTL as a safety net for staleness
spring.cache.redis.time-to-live: 600000   # 10 min`,
      codeLanguage: "java",
      explanation:
        "Common caching pattern — cache-aside read/populate/evict, TTL as a staleness safety net, and the DB-then-evict ordering to reduce races.",
      followUps: [
        "Evict vs update on write — trade-offs?",
        "Describe the stale-read race and how to avoid it.",
        "cache-aside vs write-through?",
      ],
    },
    {
      id: "b214",
      question: "What is a cache stampede and how do you prevent it?",
      answer:
        "A **cache stampede (thundering herd)** happens when a hot key expires (or the cache is cold) and **many concurrent requests miss at once**, all hitting the database simultaneously to recompute the same value — a spike that can overload the DB and cascade.\n\n" +
        "**Mitigations:**\n\n" +
        "- **Locking / request coalescing** — the first miss acquires a lock (or a single-flight guard) and recomputes; others wait for it or briefly serve stale. Only one DB hit per key.\n" +
        "- **TTL jitter** — randomize expiry (`ttl ± random`) so keys don't all expire at the same instant.\n" +
        "- **Early/probabilistic recomputation** — refresh a key *before* it expires (background refresh, or XFetch-style probabilistic early expiry) so it's never simultaneously cold for everyone.\n" +
        "- **Cache warming** — preload known-hot keys after a deploy/restart.\n" +
        "- **Negative caching** — cache 'not found' briefly so misses don't repeatedly hit the DB.\n\n" +
        "The core idea: ensure at most one recomputation per key at a time, and never let many keys expire together.",
      code: `// Single-flight with a short Redis lock: only one loader recomputes
public Product get(long id) {
    String key = "product:" + id, lock = "lock:" + key;
    Product cached = redisGet(key);
    if (cached != null) return cached;

    // SET NX EX: only the first caller wins the lock
    boolean got = redis.opsForValue().setIfAbsent(lock, "1", Duration.ofSeconds(5));
    if (got) {
        Product p = repo.findById(id).orElseThrow();
        redisSet(key, p, ttlWithJitter());          // jittered TTL avoids sync expiry
        redis.delete(lock);
        return p;
    }
    sleepBriefly();                                  // others wait, then read cache
    return get(id);
}`,
      codeLanguage: "java",
      explanation:
        "Scalability protection — coalesce concurrent misses with a lock/single-flight, jitter TTLs and refresh early so a hot key never storms the DB.",
      followUps: [
        "How does TTL jitter help?",
        "What is request coalescing / single-flight?",
        "When is negative caching useful?",
      ],
    },
    {
      id: "b215",
      question: "How do you implement a distributed lock with Redis, and what are the caveats?",
      answer:
        "A distributed lock coordinates work across instances (e.g. only one node runs a scheduled job). Basic Redis lock: `SET key value NX PX <ttl>` — atomic 'set if not exists' with an expiry so a crashed holder's lock auto-releases.\n\n" +
        "**Critical details:**\n\n" +
        "- **Unique token** — store a random value; on release, only delete if the value still matches (via a Lua script), so you don't delete someone else's lock after your TTL expired.\n" +
        "- **TTL is a guess** — if work outruns the TTL, the lock expires and a second worker starts → two holders. Mitigate with a **watchdog** that renews the lease while working.\n" +
        "- **Redlock** (multi-node quorum) exists but is **contested** (Kleppmann's critique): clock drift, GC pauses and network delays mean Redis locks are **not safe for strict correctness**. Treat them as an **optimization** (reduce duplicate work), not a guarantee.\n\n" +
        "For real correctness, use a fencing token + a system that checks it, or a proper coordinator (ZooKeeper/etcd) or a DB unique constraint. Redisson implements these patterns with lease renewal.",
      code: `// Acquire with NX + TTL and a unique token; release only if still ours (atomic Lua)
String token = UUID.randomUUID().toString();
boolean locked = redis.opsForValue()
        .setIfAbsent("lock:job", token, Duration.ofSeconds(30));   // SET NX PX
if (locked) {
    try {
        runJobOnce();                    // single instance executes
    } finally {
        // Compare-and-delete so we never release another holder's lock
        redis.execute(RELEASE_LUA, List.of("lock:job"), token);
    }
}
// RELEASE_LUA: if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) end`,
      codeLanguage: "java",
      explanation:
        "Coordination nuance without overclaiming — SET NX PX + unique-token release, watchdog renewal, and why Redis locks are best-effort not strict.",
      followUps: [
        "Why must release be a compare-and-delete?",
        "What breaks if work outlives the TTL?",
        "Why is Redlock contested for correctness?",
      ],
    },
    {
      id: "b216",
      question: "How do you handle message serialization and schema evolution?",
      answer:
        "Producers and consumers deploy independently, so the **message format must evolve without breaking either side**.\n\n" +
        "**Formats:**\n\n" +
        "- **JSON** — human-readable, flexible, no schema enforcement (easy to break silently). Fine for low volume; be a **tolerant reader** (ignore unknown fields).\n" +
        "- **Avro / Protobuf** — compact binary with an explicit schema and defined evolution rules; far better for high-throughput, long-lived event streams.\n\n" +
        "**Schema Registry** (Confluent) stores schemas and enforces **compatibility** on publish:\n\n" +
        "- **Backward** — new schema can read old data (consumers upgrade first).\n" +
        "- **Forward** — old schema can read new data (producers upgrade first).\n" +
        "- **Full** — both.\n\n" +
        "**Safe changes:** add optional/defaulted fields; **breaking:** remove/rename a field, change a type, remove a default. Never reuse Protobuf field numbers. Version the schema, keep changes additive, and **DLQ** un-deserializable ('poison') messages instead of crashing the consumer. Design events as immutable facts with a stable id and version.",
      code: `// Protobuf: additive, backward/forward-compatible evolution
message OrderPlaced {
  string order_id = 1;
  double amount   = 2;
  // v2: NEW optional field with a fresh number (never reuse 1/2)
  string currency = 3;          // old consumers ignore it; new ones default it
}

# Kafka + Schema Registry enforces compatibility at publish time
spring:
  kafka:
    producer:
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
    properties:
      schema.registry.url: http://schema-registry:8081`,
      codeLanguage: "bash",
      explanation:
        "Messaging contract maturity — JSON vs Avro/Protobuf, Schema Registry compatibility modes, additive-only changes and DLQ for poison messages.",
      followUps: [
        "Backward vs forward compatibility — who upgrades first?",
        "Which schema changes are breaking?",
        "Why never reuse a Protobuf field number?",
      ],
    },
  ],
  meta: {
    b207: { difficulty: "easy", priority: "high", tags: ["messaging", "queue", "pubsub"], readMinutes: 4 },
    b208: { difficulty: "medium", priority: "very-high", tags: ["kafka", "partitions", "consumer-groups"], readMinutes: 5 },
    b209: { difficulty: "hard", priority: "very-high", tags: ["delivery", "exactly-once", "idempotency"], readMinutes: 5 },
    b210: { difficulty: "hard", priority: "high", tags: ["ordering", "retry", "dlq"], readMinutes: 5 },
    b211: { difficulty: "medium", priority: "high", tags: ["offsets", "lag", "rebalance"], readMinutes: 5 },
    b212: { difficulty: "easy", priority: "high", tags: ["redis", "data-structures", "ttl"], readMinutes: 4 },
    b213: { difficulty: "medium", priority: "very-high", tags: ["cache-aside", "invalidation", "ttl"], readMinutes: 5 },
    b214: { difficulty: "hard", priority: "high", tags: ["stampede", "thundering-herd", "jitter"], readMinutes: 4 },
    b215: { difficulty: "hard", priority: "medium", tags: ["distributed-lock", "redis", "redlock"], readMinutes: 5 },
    b216: { difficulty: "medium", priority: "high", tags: ["serialization", "avro", "schema-evolution"], readMinutes: 5 },
  },
});
