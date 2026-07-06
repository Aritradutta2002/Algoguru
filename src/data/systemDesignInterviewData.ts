import type { Diagram } from "./recursionContent";

export interface SystemDesignQuestion {
  id: string;
  question: string;
  answer: string;
  code?: string;
  codeLanguage?: string;
  explanation: string;
  diagram?: Diagram;
}

export interface SystemDesignTopic {
  id: string;
  title: string;
  icon: string;
  questions: SystemDesignQuestion[];
}

// ─────────────────────────────────────────────
// TOPIC 1 — SCALABILITY & CORE CONCEPTS
// ─────────────────────────────────────────────
const scalabilityTopic: SystemDesignTopic = {
  id: "scalability",
  title: "Scalability & Core Concepts",
  icon: "📈",
  questions: [
    {
      id: "sd-s1",
      question: "What is scalability and why does it matter in system design?",
      answer:
        "Scalability is the ability of a system to handle a growing amount of work by adding resources. Think of it like a restaurant: a small kitchen works fine for 10 customers, but when 1000 customers arrive, you need a bigger kitchen or multiple kitchens.\n\n**Why it matters:** Every successful product grows. Twitter started with 1000 users and now serves 500 million. If the system wasn't designed to scale, it would collapse under load.\n\n**Two dimensions of scale:**\n- **Load scaling:** Handle more requests per second (users, traffic)\n- **Data scaling:** Store and query more data efficiently\n\n**The golden rule:** Don't over-engineer early. Scale when you have evidence of the bottleneck. Premature optimization is the root of all evil — but ignoring scale entirely is just as dangerous.\n\n**Key insight:** A system is only as scalable as its weakest component. You must identify and address bottlenecks — the slowest part of any pipeline limits the throughput of the whole system (Little's Law).",
      explanation:
        "Scalability = ability to grow. Two dimensions: load (more requests) and data (more storage). Find and fix the weakest link.",
      diagram: {
        type: "flow",
        title: "System Bottleneck — The Weakest Link",
        direction: "horizontal",
        data: [
          { label: "Client\nRequests", color: "primary" },
          { label: "Load\nBalancer", color: "info" },
          { label: "App\nServers", color: "success" },
          { label: "⚠ Database\n(Bottleneck)", color: "warning" },
          { label: "Storage", color: "muted" },
        ],
      },
    },
    {
      id: "sd-s2",
      question: "Vertical scaling vs horizontal scaling — what's the difference and when do you use each?",
      answer:
        "**Vertical Scaling (Scale Up):** Add more power to a single machine — more CPU cores, more RAM, faster disk. Like upgrading your laptop from 8GB to 64GB RAM.\n\n**Horizontal Scaling (Scale Out):** Add more machines to the pool and distribute the load across them. Like hiring more cashiers at a supermarket instead of making one cashier work faster.\n\n**Vertical scaling pros:** Simple — no code changes needed, no distributed system complexity. Works great up to a point.\n\n**Vertical scaling cons:** Hard physical limits (you can't add infinite RAM to one machine). Single point of failure — if that machine dies, everything dies. Very expensive at the high end.\n\n**Horizontal scaling pros:** Virtually unlimited capacity, fault-tolerant (one server dies, others handle traffic), cost-effective with commodity hardware.\n\n**Horizontal scaling cons:** Requires your application to be stateless (no local session state), needs a load balancer, distributed systems complexity (consistency, coordination).\n\n**In practice:** Most systems start vertical (simpler), then move horizontal as they grow. Databases often remain vertical longest because horizontal distribution (sharding) is hard.",
      explanation:
        "Vertical = bigger machine (simple, limited). Horizontal = more machines (complex, unlimited). Most systems start vertical, go horizontal at scale.",
      diagram: {
        type: "table-visual",
        title: "Vertical vs Horizontal Scaling",
        data: [
          {
            label: "Vertical Scaling (Scale Up)",
            color: "info",
            children: [
              { label: "Add CPU / RAM / Disk to one server" },
              { label: "Simple — no code changes" },
              { label: "Hard upper limit exists" },
              { label: "Single point of failure" },
              { label: "Best for: Databases early stage" },
            ],
          },
          {
            label: "Horizontal Scaling (Scale Out)",
            color: "success",
            children: [
              { label: "Add more servers to the pool" },
              { label: "Complex — needs load balancer" },
              { label: "Virtually unlimited capacity" },
              { label: "High fault tolerance" },
              { label: "Best for: Stateless app servers" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-s3",
      question: "What is a Load Balancer and how does it work?",
      answer:
        "A Load Balancer sits in front of your servers and distributes incoming requests across them so no single server gets overwhelmed. Think of it as a traffic cop at a busy intersection directing cars to different lanes.\n\n**How it works:** The client sends a request to the load balancer's IP address. The load balancer picks one of the available backend servers based on an algorithm, forwards the request, gets the response, and returns it to the client. The client never knows which backend server handled the request.\n\n**Common algorithms:**\n- **Round Robin:** Sends requests to servers in rotation (1→2→3→1→2→3). Simple and fair when all servers have equal capacity.\n- **Least Connections:** Sends to the server with fewest active connections. Better when requests vary in processing time.\n- **IP Hash:** The same client IP always goes to the same server. Useful for sticky sessions.\n- **Weighted Round Robin:** Servers get requests proportional to their capacity (powerful server gets more).\n\n**Layer 4 vs Layer 7:**\n- **L4 (Transport):** Routes based on IP/TCP port. Fast but dumb — can't inspect content.\n- **L7 (Application):** Routes based on HTTP content (URL path, headers, cookies). Smarter — can route `/api` to API servers and `/images` to image servers.\n\n**Health checks:** Load balancers continuously ping backend servers. If a server fails to respond, it's removed from rotation automatically.",
      explanation:
        "Load balancer distributes traffic across servers. Algorithms: Round Robin, Least Connections, IP Hash. L7 is smarter than L4.",
      diagram: {
        type: "flow",
        title: "Load Balancer Request Flow",
        direction: "vertical",
        data: [
          { label: "Client Request", color: "primary" },
          { label: "Load Balancer\n(L7 — inspects HTTP)", color: "info" },
          { label: "Server Pool\n[S1] [S2] [S3] [S4]", color: "success" },
          { label: "Database / Cache", color: "accent" },
          { label: "Response → Client", color: "primary" },
        ],
      },
    },
    {
      id: "sd-s4",
      question: "What is caching and what are the different caching layers?",
      answer:
        "Caching stores the result of expensive operations so future requests can be served faster from memory instead of recomputing or re-fetching from a slow source. It's the single most impactful optimization in system design.\n\n**The simple analogy:** When you memorize your friend's phone number instead of looking it up in the contacts every time, you're caching.\n\n**Cache levels (from fastest to slowest):**\n\n**L1 — CPU Cache (nanoseconds):** Built into the processor. Holds recently accessed memory addresses. You don't control this directly.\n\n**L2 — In-Process Cache (microseconds):** Stored in application memory (e.g., a Java HashMap). Fastest software cache. Limited by single server's RAM. Lost on restart.\n\n**L3 — Distributed Cache (milliseconds):** Redis or Memcached. Shared across all app servers. Survives individual server restarts. The workhorse of production caching.\n\n**L4 — Database Query Cache:** DB engines cache frequent query results internally.\n\n**L5 — CDN (tens of milliseconds):** Geographically distributed cache for static assets (images, JS, CSS). Serves from the closest edge server.\n\n**Cache eviction policies:**\n- **LRU (Least Recently Used):** Evict the item not accessed for the longest time. Most common.\n- **LFU (Least Frequently Used):** Evict the item accessed fewest times overall.\n- **TTL (Time To Live):** Items expire after a fixed duration regardless of access.\n\n**The cache invalidation problem:** One of the hardest problems in CS — knowing when cached data is stale and needs to be refreshed.",
      explanation:
        "Cache stores expensive results for fast reuse. Layers: CPU → In-process → Redis → DB cache → CDN. LRU eviction is most common.",
      diagram: {
        type: "layers",
        title: "Caching Tiers — Fastest to Slowest",
        data: [
          {
            label: "L1: CPU Cache (nanoseconds) — hardware managed",
            color: "success",
            children: [
              {
                label: "L2: In-Process Cache (microseconds) — HashMap in app memory",
                color: "primary",
                children: [
                  {
                    label: "L3: Distributed Cache — Redis / Memcached (milliseconds)",
                    color: "info",
                    children: [
                      {
                        label: "L4: Database Query Cache",
                        color: "accent",
                        children: [
                          {
                            label: "L5: CDN Edge Cache — static assets (tens of ms)",
                            color: "warning",
                            children: [
                              { label: "Origin Database / Storage (slowest)", color: "muted" },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "sd-s5",
      question: "What is a CDN and when should you use one?",
      answer:
        "A Content Delivery Network (CDN) is a geographically distributed network of servers (called edge servers or Points of Presence — PoPs) that cache and serve content from locations physically close to users.\n\n**The problem it solves:** If your server is in New York and a user is in Mumbai, every request travels ~14,000 km round trip adding 200–300ms of latency just from physics (speed of light). A CDN edge server in Mumbai serves that user instead.\n\n**What CDNs cache:** Static assets — images, videos, CSS, JavaScript, HTML, fonts. Anything that doesn't change per-user.\n\n**CDN modes:**\n- **Pull CDN:** CDN fetches content from your origin server on first request, caches it. Easy to set up. Slightly slow on first request (cache miss).\n- **Push CDN:** You proactively push content to CDN before users request it. Better for large files (videos). More control, more maintenance.\n\n**When to use a CDN:**\n- Global user base (users far from your servers)\n- Serving media-heavy content (images, video)\n- High traffic static assets\n- Want to reduce load on origin servers\n- DDoS protection (CDN absorbs traffic)\n\n**Popular CDNs:** Cloudflare, AWS CloudFront, Akamai, Fastly.\n\n**Advanced — dynamic CDN:** Modern CDNs can also cache API responses with short TTLs and route dynamic requests via optimized network paths.",
      explanation:
        "CDN = geographically distributed cache. Pull CDN fetches on demand. Push CDN is pre-loaded. Use for static assets and global users.",
    },
    {
      id: "sd-s6",
      question: "Explain the CAP Theorem in simple terms.",
      answer:
        "CAP Theorem states that a distributed system can guarantee at most 2 of these 3 properties simultaneously:\n\n**C — Consistency:** Every read gets the most recent write. All nodes see the same data at the same time. Think of a bank balance — if you deposit $100, you must immediately see $100 everywhere.\n\n**A — Availability:** Every request gets a response (not necessarily the latest data). The system never refuses a request.\n\n**P — Partition Tolerance:** The system continues working even when network communication between nodes breaks (network partition — packets get lost or delayed).\n\n**The hard truth:** Network partitions are unavoidable in distributed systems. Networks fail. So you ALWAYS need P. This means the real choice is between C and A during a partition:\n\n- **CP systems (Consistency + Partition Tolerance):** During a network split, the system refuses to answer rather than give stale data. Example: HBase, Zookeeper, etcd. Good for banking, inventory.\n\n- **AP systems (Availability + Partition Tolerance):** During a network split, the system answers but may give stale data. Example: Cassandra, DynamoDB, CouchDB. Good for social feeds, DNS.\n\n**Common misconception:** CA (Consistency + Availability, no Partition Tolerance) only works for single-node systems. The moment you have multiple nodes, you must handle partitions.\n\n**PACELC extension:** Even without partitions, there's a tradeoff between Latency and Consistency. Lower latency often means weaker consistency.",
      explanation:
        "CAP: pick 2 of Consistency, Availability, Partition Tolerance. P is mandatory in distributed systems. Real choice: CP (banks) vs AP (social apps).",
      diagram: {
        type: "table-visual",
        title: "CAP Theorem — CP vs AP Systems",
        data: [
          {
            label: "CP — Consistency + Partition Tolerance",
            color: "info",
            children: [
              { label: "Returns error rather than stale data" },
              { label: "All nodes agree on same value" },
              { label: "Examples: HBase, Zookeeper, etcd" },
              { label: "Use for: Banking, inventory, payments" },
            ],
          },
          {
            label: "AP — Availability + Partition Tolerance",
            color: "success",
            children: [
              { label: "Always responds, may be stale" },
              { label: "Nodes may temporarily disagree" },
              { label: "Examples: Cassandra, DynamoDB" },
              { label: "Use for: Social feeds, DNS, shopping cart" },
            ],
          },
          {
            label: "CA — Consistency + Availability",
            color: "muted",
            children: [
              { label: "Only possible on single node" },
              { label: "Impossible in distributed systems" },
              { label: "Network partitions always happen" },
              { label: "Example: Single-node RDBMS" },
            ],
          },
          {
            label: "PACELC Extension",
            color: "accent",
            children: [
              { label: "Even without partitions:" },
              { label: "Tradeoff: Latency vs Consistency" },
              { label: "Lower latency → eventual consistency" },
              { label: "Strong consistency → higher latency" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-s7",
      question: "What is eventual consistency and how does it differ from strong consistency?",
      answer:
        "**Strong Consistency:** After a write completes, any subsequent read from any node returns that new value. The system behaves as if there's only one copy of the data. Every client sees the same, most up-to-date view.\n\n**Eventual Consistency:** After a write, it may take some time before all nodes reflect the new value. But if no new writes happen, eventually all nodes will converge to the same value. During the window of inconsistency, different clients may see different versions.\n\n**Real-world example:** You post a photo on Instagram. Strong consistency → every friend sees it instantly. Eventual consistency → your friend in Tokyo might see it 500ms later than your friend in New York. Both eventually see it.\n\n**Why eventual consistency exists:** Achieving strong consistency across geographically distributed nodes requires coordination (locks, two-phase commit) which adds latency and reduces availability. For many use cases (social feeds, likes, view counts), slightly stale data is perfectly acceptable.\n\n**Consistency models spectrum (weakest to strongest):**\n1. **Eventual** — will converge, no timing guarantee\n2. **Monotonic Read** — once you read a value, future reads won't be older\n3. **Read-your-writes** — you always see your own writes\n4. **Causal** — causally related operations seen in order by all\n5. **Linearizability (Strong)** — all ops appear instantaneous and in real-time order\n\n**Practical guidance:** Use strong consistency for financial transactions. Use eventual consistency for analytics, social content, and anywhere human perception tolerates short delays.",
      explanation:
        "Strong consistency: reads always return latest write. Eventual: data converges over time. Use strong for money, eventual for social content.",
    },
    {
      id: "sd-s8",
      question: "What is database replication and why is it important?",
      answer:
        "Database replication is the process of copying data from one database server (primary/master) to one or more other servers (replicas/slaves) in real-time or near-real-time.\n\n**Why replicate?**\n- **High Availability:** If the primary crashes, a replica can take over (failover). No data loss, minimal downtime.\n- **Read Scaling:** Direct all write traffic to primary, distribute reads across replicas. If 90% of your traffic is reads, this is a huge win.\n- **Geographic Distribution:** Put a replica close to users in each region for low-latency reads.\n- **Backup:** Replicas serve as live backups.\n\n**Replication types:**\n\n**Master-Slave (Primary-Replica):** One primary accepts all writes. Changes are streamed to one or more replicas. Replicas are read-only. Simple and widely used.\n\n**Master-Master (Multi-Primary):** Multiple nodes accept writes. Changes sync bidirectionally. More complex — write conflicts are possible (what if two users update the same row on different primaries simultaneously?).\n\n**Synchronous vs Asynchronous:**\n- **Synchronous:** Write is confirmed only after all replicas acknowledge. Zero data loss but higher write latency.\n- **Asynchronous:** Write confirmed after primary writes. Replicas catch up later. Lower latency but potential data loss if primary crashes before replication.\n\n**Replication lag:** The delay between a write on primary and it appearing on replicas. In high-write systems this can be seconds. Reads from lagging replicas return stale data — this is the source of many subtle bugs.",
      explanation:
        "Replication copies data to multiple servers. Master-slave for read scaling. Synchronous = no data loss but slow. Async = fast but risk of lag.",
      diagram: {
        type: "flow",
        title: "Master-Slave Replication",
        direction: "horizontal",
        data: [
          { label: "App Server\n(Writes)", color: "primary" },
          { label: "Primary DB\n(Master)", color: "success" },
          { label: "Replica 1\n(Read Only)", color: "info" },
          { label: "Replica 2\n(Read Only)", color: "info" },
          { label: "App Server\n(Reads)", color: "accent" },
        ],
      },
    },
    {
      id: "sd-s9",
      question: "What is stateless vs stateful architecture and why does it matter for scaling?",
      answer:
        "**Stateful architecture:** The server stores information about the client session in its own memory. Subsequent requests from the same client must go to the same server (sticky sessions) because only that server knows about their session.\n\n**Problem with stateful:** You can't freely distribute requests across servers. If Server A crashes, all sessions stored there are lost. You can't easily add or remove servers.\n\n**Stateless architecture:** The server stores no client-specific state in memory. Every request contains all the information needed to process it (via tokens, cookies, request parameters). Any server can handle any request.\n\n**How to move state out of servers:**\n- **Sessions:** Store in Redis (shared cache) instead of server memory\n- **User data:** Database\n- **Auth:** JWT tokens (self-contained — carry user info)\n- **Files:** Object storage (S3)\n\n**Why stateless enables horizontal scaling:** Since any server can handle any request, the load balancer can distribute freely using round-robin. Adding a new server is trivial — it just joins the pool. Removing a server doesn't lose any state.\n\n**The stateless rule:** Treat servers as cattle, not pets. Any individual server should be replaceable without disruption. This is the foundation of cloud-native, auto-scaling architectures.\n\n**Where state must exist:** State doesn't disappear — it gets pushed to shared, scalable storage layers (Redis, databases). Those layers are then independently scaled and made highly available.",
      explanation:
        "Stateless: no session in server memory. Any server handles any request. Enables free horizontal scaling. Push state to Redis/DB.",
    },
    {
      id: "sd-s10",
      question: "How do you estimate system capacity? Walk through back-of-envelope calculation.",
      answer:
        "Back-of-envelope (BOE) estimation is a quick mental math technique to size infrastructure requirements before designing a system. Interviewers love this — it shows you think practically.\n\n**Numbers every engineer should memorize:**\n- 1 million seconds ≈ 11.5 days\n- 1 day = 86,400 seconds ≈ 100,000 seconds\n- Typical read from RAM: ~100 nanoseconds\n- Typical SSD read: ~100 microseconds (1000× slower than RAM)\n- Typical network round trip (same datacenter): ~1 millisecond\n- Typical network round trip (cross-continent): ~100 milliseconds\n\n**Example — Design Twitter:**\n- 500M daily active users, each tweets 2×/day = **1 billion tweets/day**\n- Tweets per second: 1B / 86,400 ≈ **~12,000 writes/second** (writes)\n- Reads: assume 100× read-heavy = ~1.2 million reads/second\n- Tweet size: ~280 chars + metadata ≈ **1 KB**\n- Storage per day: 1B × 1KB = **1 TB/day**\n- Storage for 5 years: 1TB × 365 × 5 = **~1.8 PB**\n\n**Estimation framework:**\n1. Identify daily active users and core actions per user\n2. Compute reads/writes per second (divide by 86,400)\n3. Estimate data size per record\n4. Compute storage growth per day/year\n5. Estimate bandwidth = requests/sec × data per request\n6. Factor in peak traffic = 2–5× average\n\n**In interviews:** Always state assumptions out loud. Round aggressively. The goal is order-of-magnitude accuracy, not precision.",
      explanation:
        "BOE estimation: DAU × actions = daily ops. Divide by 86,400 for QPS. Size × volume = storage. Always state assumptions. Round aggressively.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 2 — DATABASES
// ─────────────────────────────────────────────
const databasesTopic: SystemDesignTopic = {
  id: "databases",
  title: "Databases & Storage",
  icon: "🗄️",
  questions: [
    {
      id: "sd-db1",
      question: "SQL vs NoSQL — what's the difference and when do you choose each?",
      answer:
        "**SQL (Relational Databases):** Data is stored in tables with rows and columns. Schema is defined upfront. Relationships between tables use foreign keys. Query language is SQL. Examples: PostgreSQL, MySQL, Oracle.\n\n**NoSQL (Non-Relational Databases):** Flexible data models — documents, key-value pairs, wide columns, or graphs. Schema is dynamic or schema-less. Designed for specific access patterns. Examples: MongoDB (documents), Redis (key-value), Cassandra (wide column), Neo4j (graph).\n\n**When to choose SQL:**\n- Data has clear relationships (users → orders → products)\n- Need ACID transactions (money transfers, inventory)\n- Complex queries with joins and aggregations\n- Schema is stable and well-understood\n- Reporting and analytics queries\n\n**When to choose NoSQL:**\n- Massive scale (millions of writes/second)\n- Flexible or evolving schema (user-generated content)\n- Specific access patterns (always read by user ID)\n- Need horizontal scaling from day one\n- Simple read/write patterns without complex joins\n\n**The nuance:** Modern SQL databases (PostgreSQL, CockroachDB) can scale horizontally and handle JSON. Modern NoSQL databases (MongoDB) support transactions. The line has blurred — choose based on data model fit, not hype.",
      explanation:
        "SQL: structured, ACID, joins. NoSQL: flexible schema, horizontal scale, specific patterns. Modern databases blur the line — choose by data model fit.",
      diagram: {
        type: "table-visual",
        title: "SQL vs NoSQL Comparison",
        data: [
          {
            label: "SQL (Relational)",
            color: "primary",
            children: [
              { label: "Structured tables, fixed schema" },
              { label: "ACID transactions" },
              { label: "Complex joins and queries" },
              { label: "Vertical scaling primarily" },
              { label: "Examples: PostgreSQL, MySQL" },
            ],
          },
          {
            label: "Document (NoSQL)",
            color: "success",
            children: [
              { label: "JSON documents, flexible schema" },
              { label: "Nested data, no joins needed" },
              { label: "Horizontal scaling native" },
              { label: "Good for user profiles, catalogs" },
              { label: "Example: MongoDB, Firestore" },
            ],
          },
          {
            label: "Key-Value (NoSQL)",
            color: "info",
            children: [
              { label: "Simple get/set by key" },
              { label: "Extremely fast (nanoseconds)" },
              { label: "In-memory or disk-backed" },
              { label: "Sessions, caching, counters" },
              { label: "Example: Redis, DynamoDB" },
            ],
          },
          {
            label: "Wide Column (NoSQL)",
            color: "accent",
            children: [
              { label: "Rows with variable columns" },
              { label: "Optimized for time-series" },
              { label: "Petabyte-scale writes" },
              { label: "IoT, logs, analytics" },
              { label: "Example: Cassandra, HBase" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-db2",
      question: "What are ACID properties in databases?",
      answer:
        "ACID is a set of properties that guarantee database transactions are processed reliably. These are the bedrock of relational databases and are critical for any system handling money, inventory, or legal records.\n\n**A — Atomicity:** A transaction is all-or-nothing. Either ALL operations in the transaction succeed, or NONE of them happen. No partial states.\n\n*Example:* Bank transfer — debit $100 from Account A AND credit $100 to Account B. If the credit fails mid-way, the debit must be rolled back. You can't have the debit happen without the credit.\n\n**C — Consistency:** A transaction brings the database from one valid state to another valid state. All rules, constraints, and cascades are enforced. The database is never left in a contradictory state.\n\n*Example:* If a constraint says `balance >= 0`, a transaction that would make balance negative is rejected entirely.\n\n**I — Isolation:** Concurrent transactions execute as if they ran sequentially. One transaction's partial changes are not visible to others until committed.\n\n*Example:* Two users booking the last concert ticket simultaneously — isolation ensures only one succeeds.\n\n**D — Durability:** Once a transaction is committed, it stays committed even if the system crashes immediately after. Changes are persisted to durable storage (write-ahead log).\n\n*Example:* After your payment is confirmed, a server crash doesn't lose your transaction.\n\n**Isolation levels (weakest to strongest):** Read Uncommitted → Read Committed → Repeatable Read → Serializable. Stronger isolation = fewer anomalies but lower performance.",
      explanation:
        "ACID: Atomicity (all or nothing), Consistency (valid states), Isolation (concurrent = sequential), Durability (persists after crash). Foundation of reliable transactions.",
    },
    {
      id: "sd-db3",
      question: "What is the BASE model and how does it differ from ACID?",
      answer:
        "BASE is the consistency model followed by most NoSQL and highly distributed databases. It's the opposite end of the spectrum from ACID, trading strict correctness for availability and performance.\n\n**BA — Basically Available:** The system guarantees availability (responses) even during partial failures. Some data may be stale or unavailable, but the system continues operating.\n\n**S — Soft State:** The state of the system may change over time even without new input — because of replication and convergence processes running in the background. Data is not rigidly consistent at all times.\n\n**E — Eventually Consistent:** Given enough time without new updates, all replicas will converge to the same value. Consistency is a property that holds eventually, not instantly.\n\n**ACID vs BASE trade-off:**\n- ACID: correctness over availability (banks, payments)\n- BASE: availability over correctness (social networks, DNS, shopping carts)\n\n**Real example:** Amazon's shopping cart uses a BASE model. If two devices add items to the same cart concurrently, both are kept (merge, don't reject). Occasional duplicate items are acceptable — losing items (unavailability) is not.\n\n**DNS is BASE:** When you update a DNS record, it propagates globally over minutes to hours. Different DNS servers may return different IPs temporarily — that's eventual consistency in action.\n\n**Choosing:** Don't treat ACID vs BASE as a religious war. Many modern systems use ACID for critical paths (checkout) and BASE for non-critical paths (view counts, recommendations).",
      explanation:
        "BASE: Basically Available, Soft State, Eventually Consistent. Trades correctness for availability. NoSQL DBs (Cassandra, DynamoDB) follow BASE.",
    },
    {
      id: "sd-db4",
      question: "How does database indexing work? What's the difference between B-tree and Hash indexes?",
      answer:
        "A database index is a separate data structure that maintains a sorted copy of one or more columns, allowing the database to find rows without scanning the entire table. Like a book's index — instead of reading every page, you look up the term in the back.\n\n**Without index:** Full table scan — O(n) rows checked. For a table with 10 million rows, every query reads all 10 million.\n\n**With index:** O(log n) lookup for B-tree, O(1) for hash. For 10 million rows, B-tree finds in ~23 comparisons.\n\n**B-Tree Index (default in most databases):**\n- Self-balancing tree where each node contains sorted keys\n- Supports: equality (=), range queries (<, >, BETWEEN), ORDER BY, LIKE 'prefix%'\n- Depth is O(log n), so even billion-row tables need only ~30 node reads\n- Updates are O(log n) — tree rebalances on insert/delete\n- Use for: most general-purpose indexing\n\n**Hash Index:**\n- Hash table mapping key → row location\n- O(1) lookup for exact equality: `WHERE id = 42`\n- Cannot support range queries (hashed values lose ordering)\n- Great for caching layers (Redis uses hash tables)\n- Use for: exact lookups only\n\n**Index trade-offs:**\n- Read speed: dramatically faster\n- Write speed: slower (index must be updated on every insert/update/delete)\n- Storage: indexes take additional disk space\n- Over-indexing: too many indexes slow down writes and waste space\n\n**Composite index:** Index on multiple columns `(last_name, first_name)`. Order matters — the index supports queries on `last_name` alone or `(last_name, first_name)` together, but NOT `first_name` alone.",
      explanation:
        "Index = sorted data structure for fast lookups. B-tree: O(log n), supports ranges. Hash: O(1), equality only. Indexes speed reads, slow writes.",
      diagram: {
        type: "hierarchy",
        title: "B-Tree Index Structure",
        data: [
          {
            label: "Root Node [50]",
            color: "primary",
            children: [
              {
                label: "Internal [25, 37]",
                color: "info",
                children: [
                  { label: "Leaf [10, 18, 25]", color: "success" },
                  { label: "Leaf [30, 35, 37]", color: "success" },
                ],
              },
              {
                label: "Internal [62, 75]",
                color: "info",
                children: [
                  { label: "Leaf [50, 55, 62]", color: "success" },
                  { label: "Leaf [70, 75, 88]", color: "success" },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "sd-db5",
      question: "What is database sharding and what are the different sharding strategies?",
      answer:
        "Sharding is a database scaling technique that horizontally partitions data across multiple database servers (shards). Each shard holds a subset of the data. Together, all shards hold the complete dataset. When a single database can no longer handle the data volume or write throughput, sharding is the solution.\n\n**Why shard?** A single PostgreSQL instance typically maxes out at a few TB and a few thousand writes/second. Instagram, WhatsApp, and Uber needed to handle far beyond those limits.\n\n**Sharding strategies:**\n\n**Range-Based Sharding:** Divide data by range of a key. Users A–M go to Shard 1, N–Z to Shard 2. Simple to implement. Problem: hotspots — if most users are in A–M, Shard 1 is overloaded while Shard 2 sits idle.\n\n**Hash-Based Sharding:** Apply a hash function to the shard key (e.g., user_id % number_of_shards). Distributes data uniformly. Problem: resharding is painful — adding a shard requires remapping all existing data.\n\n**Consistent Hashing:** A smarter hash approach using a ring. Adding/removing shards only requires remapping a fraction of keys (not all). Used by Cassandra, DynamoDB, Redis Cluster.\n\n**Directory-Based Sharding:** A lookup service maps keys to shards. Most flexible — shards can be reassigned without data movement. Adds latency (one extra lookup) and the directory itself becomes a bottleneck.\n\n**Challenges of sharding:**\n- **Cross-shard queries:** Joining data across shards requires scatter-gather (query all shards, merge results)\n- **Cross-shard transactions:** ACID across shards is very hard — needs two-phase commit\n- **Hotspots:** Celebrity users, popular keys get disproportionate traffic\n- **Schema changes:** Must be rolled out across all shards\n\n**Choose your shard key carefully:** It determines data distribution and query patterns. A bad shard key causes hotspots that defeat the purpose of sharding.",
      explanation:
        "Sharding splits data across multiple DB servers. Range (simple, hotspots), Hash (uniform, resharding pain), Consistent Hash (ring, minimal resharding). Choose shard key carefully.",
      diagram: {
        type: "table-visual",
        title: "Sharding Strategies Comparison",
        data: [
          {
            label: "Range-Based Sharding",
            color: "warning",
            children: [
              { label: "Keys A–M → Shard 1, N–Z → Shard 2" },
              { label: "Simple to implement and reason about" },
              { label: "Risk: uneven distribution (hotspots)" },
              { label: "Good for: time-series, ordered data" },
            ],
          },
          {
            label: "Hash-Based Sharding",
            color: "success",
            children: [
              { label: "hash(user_id) % num_shards" },
              { label: "Even distribution of data" },
              { label: "Risk: resharding moves all data" },
              { label: "Good for: user data by ID" },
            ],
          },
          {
            label: "Consistent Hashing",
            color: "primary",
            children: [
              { label: "Virtual ring of shard slots" },
              { label: "Adding shard: only neighbors affected" },
              { label: "Minimal data movement on rescale" },
              { label: "Used by: Cassandra, DynamoDB" },
            ],
          },
          {
            label: "Directory-Based",
            color: "accent",
            children: [
              { label: "Lookup table: key → shard ID" },
              { label: "Most flexible — reassign freely" },
              { label: "Extra latency for lookup" },
              { label: "Directory = single point of failure" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-db6",
      question: "What is connection pooling and why is it critical at scale?",
      answer:
        "Opening a new database connection is expensive — it involves TCP handshake, authentication, and session setup, typically taking 20–100ms. If every database query opened a new connection, the overhead would dominate query time.\n\n**Connection pooling** maintains a pool of pre-opened, reusable database connections. When your app needs to query the database, it borrows a connection from the pool, uses it, and returns it. No teardown and re-establishment on every request.\n\n**How it works:**\n1. Application starts → pool creates N connections upfront (e.g., 10)\n2. Request arrives → borrows a connection from the pool\n3. Query executes\n4. Request done → connection returned to pool (not closed)\n5. Next request reuses the same connection\n\n**Pool sizing:** Too small → requests wait for available connections (queue builds up). Too large → database gets overwhelmed (PostgreSQL typically supports 100–500 concurrent connections before degrading).\n\n**Rule of thumb for pool size:**\n`pool_size = (core_count × 2) + effective_spindle_count`\nFor most web apps, 10–20 connections per app server instance is a good starting point.\n\n**PgBouncer:** A popular connection pooler for PostgreSQL that sits between app and database, multiplexing thousands of client connections onto a small pool of real DB connections.\n\n**Connection pool in distributed systems:** With 100 app servers each holding 20 connections, you're already at 2000 connections to the database. At scale, you often need a dedicated connection pooler (PgBouncer, RDS Proxy) to manage this.\n\n**Java connection pooling:** HikariCP is the standard for Java/Spring applications — highly optimized and production-hardened.",
      explanation:
        "Connection pooling reuses DB connections to avoid expensive setup overhead. Size correctly: too small = queuing, too large = DB overload. Use PgBouncer at scale.",
    },
    {
      id: "sd-db7",
      question: "What is the Write-Ahead Log (WAL) and how does it ensure durability?",
      answer:
        "The Write-Ahead Log (WAL) is a fundamental mechanism in databases that ensures durability (the D in ACID) and enables crash recovery.\n\n**The problem:** Databases store data on disk, but writing to disk is slow. To speed things up, databases buffer writes in memory before flushing to disk. If the server crashes before the flush, data is lost.\n\n**The WAL solution:** Before any data page is modified in the main database files, the change is first written to a sequential log file (the WAL). Sequential writes to disk are 10–100× faster than random writes because the disk head doesn't need to seek.\n\n**Write flow with WAL:**\n1. Transaction begins\n2. **Change is written to WAL first** (sequential, fast)\n3. WAL write confirmed → transaction is committed to the client\n4. Data pages are updated in memory (buffer pool)\n5. In the background, dirty pages are flushed to the main database files\n\n**Crash recovery:** If the server crashes after step 2 but before step 5, on restart the database reads the WAL and replays the uncommitted changes. Nothing is lost.\n\n**WAL enables replication:** In PostgreSQL, replicas subscribe to the WAL stream and replay the same log to stay in sync. This is how streaming replication works.\n\n**WAL enables point-in-time recovery:** By archiving WAL files, you can restore a database to any specific point in the past — not just the last backup.\n\n**Performance note:** WAL writes are synchronous by default (fsync). This guarantees durability but adds latency. You can tune `synchronous_commit = off` for higher throughput at the risk of losing the last few milliseconds of transactions on crash.",
      explanation:
        "WAL: write changes to a sequential log before data pages. Ensures crash recovery. Sequential writes = fast. Also enables replication and point-in-time recovery.",
    },
    {
      id: "sd-db8",
      question: "What is MVCC (Multi-Version Concurrency Control)?",
      answer:
        "MVCC is a concurrency control technique used by PostgreSQL, Oracle, and MySQL InnoDB to allow multiple transactions to read and write simultaneously without blocking each other.\n\n**The fundamental insight:** Instead of locking a row when it's being written, keep multiple versions of each row. Readers see a consistent snapshot of the database as of when their transaction started. Writers create new versions without overwriting old ones.\n\n**How it works:**\n- Every row has hidden system columns: `xmin` (transaction ID that created this version) and `xmax` (transaction ID that deleted/updated this version, or 0 if still live)\n- When a transaction updates a row, it marks the old version with `xmax` = current transaction ID, and inserts a new version with `xmin` = current transaction ID\n- A reader sees only rows where `xmin` ≤ their snapshot transaction ID and `xmax` is 0 or > their snapshot ID\n\n**Benefits:**\n- **Readers never block writers** and **writers never block readers** — maximum concurrency\n- Each transaction sees a consistent snapshot — no dirty reads\n- Long-running queries don't block hot update paths\n\n**Trade-offs:**\n- **Storage bloat:** Old versions accumulate (called dead tuples in PostgreSQL)\n- **Vacuum process:** PostgreSQL periodically runs VACUUM to reclaim space from dead tuples\n- **Transaction ID wraparound:** 32-bit transaction IDs wrap around every ~2 billion transactions — must monitor in high-write systems\n\n**Isolation levels in MVCC:** Read Committed sees the latest committed version per statement. Repeatable Read sees a snapshot from transaction start. Serializable adds predicate locking to prevent all anomalies.",
      explanation:
        "MVCC: multiple row versions so readers don't block writers. Each transaction sees a consistent snapshot. Trade-off: storage bloat requires VACUUM in PostgreSQL.",
    },
    {
      id: "sd-db9",
      question: "How do you choose between SQL and NoSQL for a new system? Give a framework.",
      answer:
        "This is one of the most common system design interview questions. Here's a structured decision framework:\n\n**Step 1 — Understand your data model:**\n- Is data highly relational with complex joins? → SQL\n- Is data document-like (nested, self-contained)? → Document NoSQL (MongoDB)\n- Is data accessed purely by key? → Key-Value (Redis, DynamoDB)\n- Is data time-series or append-heavy logs? → Wide Column (Cassandra, InfluxDB)\n- Is data a graph of relationships? → Graph DB (Neo4j)\n\n**Step 2 — Understand your access patterns:**\n- What queries will you run? If 80% of queries are `SELECT * FROM users WHERE id = ?`, NoSQL is fine.\n- If you need `JOIN users, orders, products WHERE ...`, SQL handles this naturally.\n\n**Step 3 — Scale requirements:**\n- Millions of writes/second across global regions? → NoSQL (Cassandra)\n- Moderate scale with complex queries? → SQL with read replicas\n- Need multi-region active-active writes? → Distributed SQL (CockroachDB, Spanner) or NoSQL\n\n**Step 4 — Consistency requirements:**\n- Financial transactions, inventory → Strong consistency → SQL (ACID)\n- Social content, analytics, recommendations → Eventual consistency acceptable → NoSQL\n\n**Step 5 — Team familiarity and operational overhead:**\n- SQL has 50 years of tooling, monitoring, and expertise\n- NoSQL requires operational knowledge specific to each system\n\n**Practical answer for interviews:** Start with PostgreSQL for most systems. It handles JSON natively, scales to tens of millions of users with good indexing and read replicas. Add Redis for caching. Migrate to specialized stores only when PostgreSQL becomes a proven bottleneck.",
      explanation:
        "Choose by: data model shape, access patterns, scale needs, consistency requirements. Default: PostgreSQL + Redis. Migrate to specialized stores only under proven bottleneck.",
    },
    {
      id: "sd-db10",
      question: "What are database indexes at a deep level — covering indexes, partial indexes, and index-only scans?",
      answer:
        "Beyond basic B-tree indexes, production database optimization requires understanding advanced index types and behaviors.\n\n**Covering Index:** An index that contains all columns needed to answer a query — the database never needs to touch the main table rows. This is called an index-only scan and is dramatically faster.\n\n*Example:* Query: `SELECT email FROM users WHERE created_at > '2024-01-01'`\nCovering index: `CREATE INDEX ON users (created_at, email)` — both `created_at` (filter) and `email` (select) are in the index. Zero table lookups.\n\n**Partial Index:** An index that only covers rows matching a condition. Smaller, faster to update, more targeted.\n\n*Example:* `CREATE INDEX ON orders (user_id) WHERE status = 'pending'` — only pending orders are indexed. If 99% of orders are completed, this index is tiny and focuses exactly on the hot query path.\n\n**Composite Index Column Order:** The leading column in a composite index is critical. Index `(a, b, c)` supports queries on `a`, `(a, b)`, `(a, b, c)` — but NOT `b` alone or `c` alone.\n\n**Index Selectivity:** High selectivity = few matching rows per value (good for indexes). A `gender` column with 2 values has low selectivity — a full table scan may be faster. A UUID column has maximum selectivity — always benefit from an index.\n\n**Bloat and maintenance:** Indexes bloat over time as rows are inserted/updated/deleted. PostgreSQL's `REINDEX CONCURRENTLY` rebuilds without locking. Monitor index bloat with `pg_stat_user_indexes`.\n\n**The rule of thumb:** Index columns used in WHERE, JOIN ON, and ORDER BY. Don't index columns with low cardinality. Monitor `EXPLAIN ANALYZE` output to verify index usage.",
      explanation:
        "Covering index: all query columns in index → index-only scan. Partial index: covers subset of rows. Composite index: leading column matters. Monitor with EXPLAIN ANALYZE.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 3 — COMMUNICATION & APIs
// ─────────────────────────────────────────────
const communicationTopic: SystemDesignTopic = {
  id: "communication",
  title: "Communication & APIs",
  icon: "🔌",
  questions: [
    {
      id: "sd-c1",
      question: "What is REST and what are its core constraints?",
      answer:
        "REST (Representational State Transfer) is an architectural style for designing networked APIs. It was defined by Roy Fielding in 2000 and has become the dominant API style for web services.\n\n**The simple view:** REST uses standard HTTP methods (GET, POST, PUT, DELETE, PATCH) to perform operations on resources identified by URLs. If you can reach it with a browser URL, it's RESTful.\n\n**Six REST constraints:**\n\n**1. Stateless:** Every request from client to server must contain all information needed to understand the request. The server stores no client session state. This is what makes REST horizontally scalable.\n\n**2. Client-Server:** Clear separation — client handles UI, server handles data. They evolve independently.\n\n**3. Cacheable:** Responses must declare whether they're cacheable. Cacheable responses reduce server load dramatically.\n\n**4. Uniform Interface:** All resources accessed via consistent URLs, standard HTTP methods, and standard status codes. This simplicity is REST's greatest strength.\n\n**5. Layered System:** Client doesn't know if it's talking to origin server or a CDN/proxy. Enables transparent load balancers and caches.\n\n**6. Code on Demand (optional):** Server can send executable code (JavaScript) to the client.\n\n**HTTP Methods semantics:**\n- GET: Read (idempotent, safe)\n- POST: Create (not idempotent)\n- PUT: Full update/replace (idempotent)\n- PATCH: Partial update\n- DELETE: Remove (idempotent)\n\n**Status codes to know:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Internal Server Error, 503 Service Unavailable.",
      explanation:
        "REST: stateless, resource-based URLs, standard HTTP methods. Statelessness enables horizontal scaling. Know HTTP methods and status codes cold.",
    },
    {
      id: "sd-c2",
      question: "What is GraphQL and when should you use it over REST?",
      answer:
        "GraphQL is a query language for APIs and a runtime for executing those queries. Developed by Facebook in 2012, open-sourced in 2015. It lets clients ask for exactly the data they need — no more, no less.\n\n**The problem GraphQL solves:**\n\n**Over-fetching:** REST endpoints return fixed data. `GET /users/1` returns the full user object with 50 fields, but the mobile app only needs name and avatar. Wasted bandwidth.\n\n**Under-fetching (N+1 problem):** To show a list of posts with author names, REST requires: 1 request for posts + N requests for each author = N+1 total requests. GraphQL fetches it all in one query.\n\n**How GraphQL works:**\n- Single endpoint: `POST /graphql`\n- Client sends a query describing the exact shape of data it wants\n- Server resolves the query through resolver functions\n- Response matches the query shape exactly\n\n**GraphQL query example:**\n```graphql\nquery {\n  user(id: \"1\") {\n    name\n    avatar\n    posts(last: 3) {\n      title\n      createdAt\n    }\n  }\n}\n```\nOne request, exactly the fields needed, nested relationships included.\n\n**When to use GraphQL:**\n- Multiple clients (mobile, web, TV) with different data needs\n- Rapidly evolving frontend requirements\n- Complex nested/relational data\n- Reducing mobile bandwidth\n\n**When NOT to use GraphQL:**\n- Simple CRUD APIs with few clients\n- File uploads (REST is simpler)\n- Public APIs where caching is critical (REST CDN caching is easier)\n- Small teams — GraphQL adds complexity\n\n**Challenges:** N+1 resolver problem (use DataLoader for batching), complex authorization per field, query complexity attacks (clients can craft expensive queries).",
      explanation:
        "GraphQL: client specifies exact data shape. Solves over-fetching and N+1. Use for multiple clients with different needs. Adds complexity — don't use for simple APIs.",
    },
    {
      id: "sd-c3",
      question: "What is gRPC and how does it differ from REST?",
      answer:
        "gRPC is a high-performance Remote Procedure Call (RPC) framework developed by Google. Instead of REST's resource-based URLs and JSON, gRPC uses Protocol Buffers (Protobuf) for serialization and HTTP/2 for transport.\n\n**The core idea:** Define your API in a `.proto` schema file. gRPC generates client and server code in any language. You call remote methods as if they were local functions.\n\n**Why gRPC is faster than REST:**\n- **Protobuf vs JSON:** Protobuf is a binary format — 3–10× smaller and faster to serialize/deserialize than JSON text\n- **HTTP/2 vs HTTP/1.1:** HTTP/2 multiplexes multiple requests on a single connection, eliminates head-of-line blocking, and supports bidirectional streaming\n- **Code generation:** No manual JSON parsing — generated code is type-safe\n\n**gRPC streaming modes:**\n- Unary: Single request, single response (like REST)\n- Server streaming: Single request, stream of responses (live scores, stock prices)\n- Client streaming: Stream of requests, single response (file upload)\n- Bidirectional streaming: Both sides stream simultaneously (real-time chat, gaming)\n\n**When to use gRPC:**\n- Internal microservice-to-microservice communication (same datacenter)\n- High-throughput, low-latency requirements\n- Polyglot environments (services in Go, Java, Python — all share one .proto contract)\n- Real-time streaming data\n\n**When NOT to use gRPC:**\n- Browser clients (limited gRPC-Web support)\n- Public APIs (developers expect REST+JSON)\n- Simple CRUD services where REST is sufficient",
      explanation:
        "gRPC: binary Protobuf + HTTP/2. Faster than REST. Supports streaming. Best for internal microservice communication. Not ideal for browser or public APIs.",
      diagram: {
        type: "table-visual",
        title: "REST vs GraphQL vs gRPC",
        data: [
          {
            label: "REST",
            color: "primary",
            children: [
              { label: "Multiple endpoints, JSON" },
              { label: "HTTP/1.1 or HTTP/2" },
              { label: "Easy CDN caching" },
              { label: "Universal browser support" },
              { label: "Best for: Public APIs, CRUD" },
            ],
          },
          {
            label: "GraphQL",
            color: "accent",
            children: [
              { label: "Single endpoint, flexible queries" },
              { label: "Client defines response shape" },
              { label: "Solves over/under-fetching" },
              { label: "Complex authorization per field" },
              { label: "Best for: Multi-client apps" },
            ],
          },
          {
            label: "gRPC",
            color: "success",
            children: [
              { label: "Binary Protobuf, HTTP/2" },
              { label: "3-10x faster than JSON" },
              { label: "Bidirectional streaming" },
              { label: "Code generation, type-safe" },
              { label: "Best for: Internal microservices" },
            ],
          },
          {
            label: "When to Choose",
            color: "info",
            children: [
              { label: "Public API → REST" },
              { label: "Multiple frontends → GraphQL" },
              { label: "Internal services → gRPC" },
              { label: "Real-time streaming → gRPC or WS" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-c4",
      question: "WebSockets vs Long Polling vs Server-Sent Events — what's the difference?",
      answer:
        "These are three techniques for pushing data from server to client in real-time, solving the fundamental limitation of HTTP: by default HTTP is request-response — the client must ask first.\n\n**Short Polling (baseline):** Client sends a request every N seconds asking 'anything new?' Wasteful — most responses are empty. Creates unnecessary load. Not truly real-time.\n\n**Long Polling:** Client sends request. Server holds the connection open until new data is available (or a timeout). When data arrives, server responds and client immediately sends another request. Simulates push with regular HTTP. Works everywhere but inefficient — new HTTP connection per message.\n\n**Server-Sent Events (SSE):** Client opens one HTTP connection. Server streams a sequence of events over it. One-directional: server → client only. Built into browsers via `EventSource` API. Auto-reconnects. Excellent for: live feeds, notifications, dashboards. Simple and underrated.\n\n**WebSockets:** Full-duplex, persistent TCP connection upgraded from HTTP. Both client and server can send messages at any time. True bidirectional real-time communication. More complex — requires different infrastructure (sticky sessions or session store), harder to proxy through firewalls.\n\n**Choosing the right technique:**\n- Chat app, multiplayer game, collaborative editing → **WebSocket** (both sides send)\n- Live dashboard, news feed, notifications → **SSE** (server pushes only)\n- Compatibility-critical, simple updates → **Long Polling** (works everywhere)\n- Predictable polling interval, non-critical → **Short Polling**",
      explanation:
        "Polling: client asks repeatedly. Long polling: server holds connection. SSE: server streams to client (one-way). WebSocket: full-duplex, persistent. Match to use case.",
      diagram: {
        type: "table-visual",
        title: "Real-Time Communication Techniques",
        data: [
          {
            label: "Short Polling",
            color: "muted",
            children: [
              { label: "Client asks every N seconds" },
              { label: "Wasteful, not real-time" },
              { label: "Simple to implement" },
              { label: "Use for: non-critical updates" },
            ],
          },
          {
            label: "Long Polling",
            color: "warning",
            children: [
              { label: "Server holds request until data" },
              { label: "Works with regular HTTP" },
              { label: "New connection per message" },
              { label: "Use for: legacy compatibility" },
            ],
          },
          {
            label: "Server-Sent Events",
            color: "info",
            children: [
              { label: "Persistent HTTP, server → client only" },
              { label: "Auto-reconnect built-in" },
              { label: "Simple EventSource API" },
              { label: "Use for: feeds, dashboards, notifications" },
            ],
          },
          {
            label: "WebSockets",
            color: "success",
            children: [
              { label: "Full-duplex persistent connection" },
              { label: "Both sides send anytime" },
              { label: "Needs special infra (sticky sessions)" },
              { label: "Use for: chat, gaming, collaboration" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-c5",
      question: "What is a Message Queue and why is it used in distributed systems?",
      answer:
        "A message queue is a form of asynchronous communication between services. Instead of Service A calling Service B directly (synchronously), A places a message onto a queue and returns immediately. B reads from the queue and processes the message when it's ready.\n\n**The real-world analogy:** Email. You write an email and send it — you don't stand there waiting for the recipient to read it. You go do other things. When they're ready, they read and respond.\n\n**Why use message queues?**\n\n**Decoupling:** Services don't need to know about each other. The producer only knows the queue name. The consumer only knows the queue name. They can evolve independently.\n\n**Durability:** Messages persist in the queue even if the consumer is down. When the consumer restarts, it processes the backlog. No messages lost.\n\n**Load leveling:** A sudden spike of 10,000 requests hits your API. Instead of crashing your processing service, messages queue up. The consumer processes at its own pace — no dropped requests.\n\n**Retry and error handling:** Failed message processing can be retried automatically. Dead letter queues (DLQ) hold messages that fail after N retries for investigation.\n\n**Fan-out:** One message published to a topic is delivered to all subscribers simultaneously (pub/sub pattern).\n\n**Common patterns:**\n- **Point-to-point:** One producer, one consumer (task queues)\n- **Pub/Sub:** One publisher, multiple subscriber groups each get a copy\n- **Competing consumers:** Multiple consumers read from the same queue — first one to pick up the message processes it (horizontal scaling of workers)\n\n**Popular queues:** RabbitMQ (flexible routing, AMQP protocol), Amazon SQS (managed, simple), Apache Kafka (high-throughput event streaming — not just a queue).",
      explanation:
        "Message queue: async communication via persistent buffer. Decouples services, handles spikes, enables retry. Patterns: point-to-point, pub/sub, competing consumers.",
    },
    {
      id: "sd-c6",
      question: "Kafka vs RabbitMQ — when do you use each?",
      answer:
        "Kafka and RabbitMQ are both messaging systems but built for fundamentally different use cases.\n\n**RabbitMQ — Traditional Message Broker:**\nRabbitMQ is a message broker — it routes, filters, and delivers messages. Built around the concept of queues. Messages are pushed to consumers. Once a consumer acknowledges a message, it's deleted.\n\nStrengths: Complex routing (topic exchanges, fanout, direct), per-message acknowledgement, dead letter queues, low latency (sub-millisecond), easy to reason about. Use for: task queues, job processing, RPC patterns, complex routing logic.\n\n**Apache Kafka — Distributed Event Log:**\nKafka is fundamentally a distributed, ordered, immutable log. Messages (events) are appended to topic partitions and retained for a configurable period (days/weeks). Consumers maintain their own offset (position) in the log — they control how fast they read and can replay from any point.\n\nStrengths: Massive throughput (millions of events/second), message replay, multiple independent consumer groups each reading the full stream, excellent for event sourcing and audit logs.\n\n**The key differences:**\n- **Message retention:** RabbitMQ deletes after ack. Kafka retains for days/weeks (replayable)\n- **Consumer model:** RabbitMQ pushes to consumers. Kafka consumers pull at their own pace\n- **Ordering:** RabbitMQ per-queue, no partition. Kafka ordered within a partition\n- **Throughput:** Kafka wins by orders of magnitude for high-volume streams\n- **Complexity:** Kafka requires more operational knowledge (ZooKeeper/KRaft, partitioning strategy)\n\n**Interview answer:** Use RabbitMQ for task queues and complex routing. Use Kafka for event streaming, audit logs, real-time analytics pipelines, and anywhere you need message replay.",
      explanation:
        "RabbitMQ: message broker, push, delete-after-ack, complex routing. Kafka: event log, pull, replay, massive throughput. RabbitMQ for tasks, Kafka for event streams.",
      diagram: {
        type: "flow",
        title: "Kafka Pub/Sub — Event Streaming",
        direction: "horizontal",
        data: [
          { label: "Producers\n(Services)", color: "primary" },
          { label: "Kafka\nBroker\n(Topic Partitions)", color: "warning" },
          { label: "Consumer\nGroup A\n(Analytics)", color: "success" },
          { label: "Consumer\nGroup B\n(Notifications)", color: "info" },
          { label: "Consumer\nGroup C\n(Audit Log)", color: "accent" },
        ],
      },
    },
    {
      id: "sd-c7",
      question: "What is an API Gateway and what responsibilities does it handle?",
      answer:
        "An API Gateway is a server that acts as the single entry point for all client requests into a microservices architecture. Instead of clients knowing about and calling 10 different microservices directly, they call the API Gateway, which routes and orchestrates internally.\n\n**Core responsibilities:**\n\n**Request Routing:** Maps incoming URLs/paths to the appropriate backend service. `/api/users` → User Service, `/api/orders` → Order Service.\n\n**Authentication & Authorization:** Verifies JWT tokens or API keys on every request before it reaches any service. Services don't need to implement auth themselves.\n\n**Rate Limiting:** Throttles requests per client/IP/API key. Protects backend services from abuse and ensures fair usage.\n\n**Request/Response Transformation:** Translate between external API format and internal service formats. Aggregate multiple service calls into one response for the client.\n\n**SSL Termination:** Handles HTTPS at the gateway. Internal services communicate over plain HTTP within the trusted network.\n\n**Load Balancing:** Distributes requests across multiple instances of each service.\n\n**Logging & Monitoring:** Centralized access logs, metrics, and tracing for all API traffic.\n\n**Request Aggregation (BFF pattern):** For mobile clients needing data from User + Order + Product services, the gateway can fan out three calls and merge the responses into one.\n\n**Popular API Gateways:** AWS API Gateway, Kong, NGINX, Traefik, Envoy.\n\n**Caution — Gateway as bottleneck:** The API Gateway becomes a critical path — all traffic flows through it. It must be highly available (multiple instances), low latency, and never a bottleneck. Avoid putting heavy business logic in the gateway.",
      explanation:
        "API Gateway: single entry point for microservices. Handles routing, auth, rate limiting, SSL, logging. Critical path — must be highly available and low latency.",
    },
    {
      id: "sd-c8",
      question: "Synchronous vs asynchronous communication — when do you choose each?",
      answer:
        "This is one of the most important architectural decisions in distributed systems design.\n\n**Synchronous communication:** Caller sends a request and waits for the response before proceeding. Examples: REST HTTP calls, gRPC unary calls.\n\nPros: Simple to reason about, immediate feedback, natural request-response semantics, easy error handling (HTTP status codes).\n\nCons: Tight temporal coupling — both caller and callee must be available simultaneously. Latency chains — if Service A calls B which calls C which calls D, the total latency is A+B+C+D. Cascading failures — if D is slow, it makes C slow, which makes B slow, which makes A slow.\n\n**Asynchronous communication:** Caller sends a message and moves on. The receiver processes it later. Examples: message queues, events.\n\nPros: Loose coupling — services don't need to be up simultaneously. Better resilience — producer works even when consumer is down. Natural load leveling — queue absorbs spikes. Enables event-driven architectures.\n\nCons: Harder to reason about — no immediate feedback, eventual processing. Debugging is harder — distributed tracing required. Eventual consistency — the state change propagates with a delay.\n\n**Decision framework:**\n- Need an immediate answer? → Synchronous (REST/gRPC)\n- Fire and forget, or result not needed immediately? → Asynchronous (queue)\n- Long-running processing (video encoding, report generation)? → Async with callback/webhook\n- Multiple services need to react to an event? → Async pub/sub\n- Critical path where failure = transaction rollback? → Synchronous or Saga pattern\n\n**In practice:** Most systems use both. Synchronous for user-facing real-time paths. Asynchronous for background processing, notifications, analytics, and inter-service events.",
      explanation:
        "Sync: immediate, coupled, latency chains. Async: decoupled, resilient, eventual. User-facing critical paths → sync. Background work → async. Most systems need both.",
    },
    {
      id: "sd-c9",
      question: "What is event-driven architecture and what are its benefits and challenges?",
      answer:
        "Event-driven architecture (EDA) is a design paradigm where services communicate by producing and consuming events — records of things that happened. Instead of Service A calling Service B directly, A emits an event ('UserRegistered') and any interested service (B, C, D) reacts independently.\n\n**Core concepts:**\n\n**Event:** An immutable record of something that happened. 'OrderPlaced', 'PaymentCompleted', 'UserSignedUp'. Always in past tense. Contains enough context to be useful without fetching more data.\n\n**Event Producer:** The service that emits the event. Doesn't know or care who consumes it.\n\n**Event Consumer:** A service that subscribes to events it cares about and reacts accordingly.\n\n**Event Broker:** The infrastructure that routes events from producers to consumers (Kafka, SNS, EventBridge).\n\n**Benefits:**\n- **Maximum decoupling:** Producers and consumers are completely independent. Add new consumers without changing producers.\n- **Scalability:** Each consumer scales independently based on its event processing load.\n- **Resilience:** Consumer downtime doesn't affect producer. Events queue up and are processed when consumer recovers.\n- **Audit log:** Event log is a complete history of everything that happened in the system.\n- **Temporal decoupling:** Producer and consumer don't need to be available at the same time.\n\n**Challenges:**\n- **Eventual consistency:** State changes propagate asynchronously — services may be temporarily out of sync.\n- **Duplicate events:** Network issues can cause events to be delivered more than once. Consumers must be idempotent.\n- **Event ordering:** Events can arrive out of order. Kafka guarantees order within a partition only.\n- **Debugging:** Tracing a request across 10 event-driven services requires distributed tracing (Jaeger, Zipkin).\n- **Schema evolution:** Changing event format breaks consumers. Use schema registry (Confluent) and versioning.\n- **Testing:** Harder to write integration tests for async flows.",
      explanation:
        "EDA: services communicate via immutable events. Maximum decoupling, resilient, scalable. Challenges: eventual consistency, duplicates, ordering, complex debugging.",
    },
    {
      id: "sd-c10",
      question: "What is idempotency and why is it critical in distributed systems?",
      answer:
        "An operation is idempotent if performing it multiple times produces the same result as performing it once. This is critical in distributed systems because networks are unreliable — messages get duplicated, retried, and delivered more than once.\n\n**The problem without idempotency:**\nUser clicks 'Pay' → request sent → network times out → user retries → payment charged twice. This is catastrophic for financial systems.\n\n**HTTP methods and idempotency:**\n- GET: Idempotent (read doesn't change state)\n- PUT: Idempotent (setting a value to X twice = same as once)\n- DELETE: Idempotent (deleting twice = same result — resource is gone)\n- POST: NOT idempotent by default (submitting twice = two records)\n- PATCH: Depends on implementation\n\n**Idempotency keys pattern:**\nFor POST operations that must be idempotent, the client generates a unique key (UUID) for each logical request and sends it in a header: `Idempotency-Key: abc-123`. The server stores the result of the first execution against that key. If the same key arrives again, it returns the stored result without re-executing.\n\n**Where idempotency matters most:**\n- Payment processing (Stripe uses idempotency keys)\n- Order creation\n- Email/notification sending (don't send twice)\n- Message queue consumers (Kafka, SQS can deliver duplicates)\n- Webhook handlers (webhooks may be retried on timeout)\n\n**Making consumers idempotent:** Before processing a message, check if you've seen its ID before. Store processed message IDs in Redis with TTL. If already processed, skip and acknowledge.\n\n**At-least-once vs exactly-once:** Most message queues guarantee at-least-once delivery (may duplicate). Exactly-once is very expensive to achieve across distributed systems. Design consumers to be idempotent instead.",
      explanation:
        "Idempotent: same result regardless of how many times called. Critical for retries and duplicates. Use idempotency keys for POST. Make message consumers idempotent.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 4 — RELIABILITY & RESILIENCE
// ─────────────────────────────────────────────
const reliabilityTopic: SystemDesignTopic = {
  id: "reliability",
  title: "Reliability & Resilience",
  icon: "🛡️",
  questions: [
    {
      id: "sd-r1",
      question: "What is availability and how is it measured? What does 99.9% uptime mean?",
      answer:
        "Availability is the percentage of time a system is operational and able to serve requests. It's one of the most important non-functional requirements in system design.\n\n**The formula:**\n`Availability = Uptime / (Uptime + Downtime) × 100%`\n\n**The 'nines' of availability — what they mean in practice:**\n\n| SLA | Annual Downtime | Monthly Downtime |\n|---|---|---|\n| 99% (two nines) | 3.65 days | 7.2 hours |\n| 99.9% (three nines) | 8.7 hours | 43.8 minutes |\n| 99.99% (four nines) | 52.6 minutes | 4.4 minutes |\n| 99.999% (five nines) | 5.26 minutes | 26.3 seconds |\n\n**What five nines means operationally:** You have 5 minutes of downtime allowed per year. Any deployment or maintenance must happen without taking the system down (rolling deploys, blue-green deployments).\n\n**Availability in series:** If Service A (99.9%) calls Service B (99.9%), combined availability = 99.9% × 99.9% = 99.8%. Dependencies multiply downtime. This is why microservices need circuit breakers.\n\n**Availability in parallel (redundancy):** If two independent systems each have 99% availability and only both failing at once causes an outage: 1 - (0.01 × 0.01) = 99.99%. Redundancy dramatically improves availability.\n\n**SLA vs SLO vs SLI:**\n- **SLI (Service Level Indicator):** The actual metric measured (e.g., request success rate)\n- **SLO (Service Level Objective):** The target for the SLI (e.g., 99.9% success rate)\n- **SLA (Service Level Agreement):** The contract with consequences if SLO is breached (e.g., credits to customers)",
      explanation:
        "99.9% = 8.7 hrs downtime/year. 99.99% = 52 mins. Dependencies in series multiply downtime. Redundancy (parallel) dramatically improves availability.",
    },
    {
      id: "sd-r2",
      question: "What is the Circuit Breaker pattern and how does it work?",
      answer:
        "The Circuit Breaker pattern prevents a failing service from being called repeatedly when it's clearly down or degraded. It's named after the electrical circuit breaker — when there's a short circuit, the breaker trips to protect the rest of the circuit.\n\n**The problem without Circuit Breaker:**\nService A calls Service B. Service B starts failing with 5-second timeouts. Service A makes 100 req/sec. Each request waits 5 seconds → A's thread pool exhausts → A starts failing → Service C which calls A starts failing. One slow service cascades and brings down the whole system. This is a cascading failure.\n\n**Circuit Breaker states:**\n\n**CLOSED (normal operation):** Requests flow through normally. The circuit breaker counts failures in a rolling window.\n\n**OPEN (service is failing):** After the failure threshold is exceeded (e.g., 50% failure rate in last 10 seconds), the circuit opens. All calls immediately return an error (or fallback) without calling the failing service. This is called fast-failing — it protects both the caller and the overwhelmed downstream service.\n\n**HALF-OPEN (testing recovery):** After a configured timeout (e.g., 30 seconds), the circuit allows a small number of test requests through. If they succeed → circuit closes. If they fail → circuit opens again.\n\n**Benefits:**\n- Prevents cascading failures\n- Allows downstream service time to recover\n- Fast failure is better than slow timeout — frees threads immediately\n- Enables graceful degradation (show cached data, default response)\n\n**Libraries:** Netflix Hystrix (deprecated), Resilience4j (Java), Polly (.NET), Hystrix successor in Spring Cloud.\n\n**Tuning:** Set thresholds carefully. Too sensitive → false trips on normal variance. Too loose → doesn't protect fast enough.",
      explanation:
        "Circuit breaker: CLOSED (normal) → OPEN (fail fast after threshold) → HALF-OPEN (test recovery). Prevents cascading failures. Fast fail > slow timeout.",
      diagram: {
        type: "flow",
        title: "Circuit Breaker State Transitions",
        direction: "vertical",
        data: [
          {
            label: "CLOSED\n(Normal — requests pass through)",
            color: "success",
            children: [{ label: "Failure count exceeds threshold" }],
          },
          {
            label: "OPEN\n(Fast fail — no calls to service)",
            color: "warning",
            children: [{ label: "After timeout period (e.g. 30s)" }],
          },
          {
            label: "HALF-OPEN\n(Probe — limited test requests)",
            color: "info",
            children: [{ label: "Success → CLOSED  |  Failure → OPEN" }],
          },
        ],
      },
    },
    {
      id: "sd-r3",
      question: "What is Rate Limiting and what algorithms implement it?",
      answer:
        "Rate limiting controls how many requests a client can make in a given time window. It protects your system from abuse, DDoS attacks, and runaway clients — and ensures fair usage for all consumers.\n\n**Why rate limit?**\n- Prevent a single client from monopolizing server resources\n- Protect against DDoS and brute-force attacks\n- Enforce API tier limits (free: 100 req/day, paid: 10,000 req/day)\n- Protect downstream services from traffic spikes\n\n**Rate limiting algorithms:**\n\n**Fixed Window Counter:** Count requests in fixed time windows (e.g., 0–60s, 60–120s). Simple. Problem: boundary bursting — a client can send 100 requests at 0:59 and 100 more at 1:01, effectively 200 in 2 seconds.\n\n**Sliding Window Log:** Store timestamp of each request. Count requests in the last N seconds relative to now. Accurate but memory-intensive for high traffic.\n\n**Sliding Window Counter:** Hybrid — combines fixed window with a weighted fraction of the previous window. Memory-efficient and accurate. Used by Redis rate limiter.\n\n**Token Bucket:** A bucket holds tokens (capacity = burst limit). Tokens are added at a fixed rate. Each request consumes one token. If bucket is empty, request is rejected. Allows controlled bursts up to bucket capacity.\n\n**Leaky Bucket:** Requests enter a queue (bucket) and are processed at a fixed output rate. Smooths traffic into a steady stream. Drops requests when queue overflows. Used for output rate control.\n\n**Where to rate limit:** API Gateway (most common), reverse proxy (NGINX), application code, or distributed store (Redis + Lua scripts for atomic operations).\n\n**Rate limit responses:** Return HTTP 429 Too Many Requests with `Retry-After` header indicating when the client can retry.",
      explanation:
        "Rate limiting: control request frequency per client. Algorithms: Fixed Window (simple), Token Bucket (bursts allowed), Sliding Window (accurate), Leaky Bucket (smooth output). Return 429.",
      diagram: {
        type: "flow",
        title: "Token Bucket Algorithm",
        direction: "horizontal",
        data: [
          { label: "Token Refill\n(N tokens/sec)", color: "success" },
          { label: "Token Bucket\n(max capacity B)", color: "info" },
          { label: "Incoming\nRequest", color: "primary" },
          { label: "Token\nAvailable?\n✓ Allow  ✗ Reject", color: "warning" },
          { label: "Service\nHandles Request", color: "accent" },
        ],
      },
    },
    {
      id: "sd-r4",
      question: "What is the Retry pattern and how should you implement it correctly?",
      answer:
        "The Retry pattern automatically re-attempts a failed operation, under the assumption that many failures are transient — temporary network hiccups, momentary resource exhaustion, or brief service restarts.\n\n**When to retry:**\n- Network timeouts\n- HTTP 503 Service Unavailable\n- HTTP 429 Too Many Requests (with Retry-After header)\n- Transient database connection errors\n\n**When NOT to retry:**\n- HTTP 400 Bad Request (your request is wrong — retrying won't fix it)\n- HTTP 401/403 (auth failures — credentials won't change)\n- Business logic errors\n- Non-idempotent operations without idempotency keys\n\n**Naive retry — the thundering herd problem:**\nIf a service goes down and all clients retry at the same time in perfect synchrony, they all hit the recovering service simultaneously, overloading it again. The service goes down again. Cycle repeats.\n\n**Exponential Backoff:** Each retry waits exponentially longer: 1s, 2s, 4s, 8s, 16s... This spaces out retry storms and gives the downstream service time to recover.\n\n**Jitter:** Add random variation to the backoff. Instead of all clients waiting exactly 4s, they wait 3.2s, 4.7s, 3.8s... This desynchronizes retry storms even further.\n\n**Full Jitter formula:** `sleep = random_between(0, min(cap, base × 2^attempt))`\n\n**Max retries and total timeout:** Set a maximum number of retries (e.g., 3) and a maximum total time budget. Don't retry indefinitely — eventually return an error to the caller.\n\n**Retry budgets:** In microservices, if every service layer retries 3×, a single client request can trigger 3^N requests (N = service depth). Track retry rate as a metric and alert on anomalies.",
      explanation:
        "Retry transient failures only. Exponential backoff: 1s→2s→4s. Add jitter to prevent thundering herd. Max 3 retries. Never retry non-idempotent ops without idempotency keys.",
    },
    {
      id: "sd-r5",
      question: "What is the Bulkhead pattern?",
      answer:
        "The Bulkhead pattern is a resilience design that isolates different parts of your system into pools so that a failure in one pool doesn't drain resources from another. It's named after the watertight compartments on a ship — if one compartment floods, the others remain sealed and the ship stays afloat.\n\n**The problem without bulkheads:**\nYour service makes calls to three downstream services: Payment, Inventory, and Recommendations. A shared thread pool of 100 threads handles all three. Recommendations service gets slow — 100 threads all get stuck waiting. Payment and Inventory calls now have no threads available. Critical payment processing is blocked by the non-critical recommendations service.\n\n**Bulkhead implementation:**\n\n**Thread pool isolation:** Allocate separate, fixed thread pools for each downstream dependency. Payment: 30 threads. Inventory: 30 threads. Recommendations: 10 threads. Even if Recommendations pool saturates, Payment and Inventory pools are unaffected.\n\n**Semaphore isolation:** Limit concurrent calls to a service with a semaphore. Lighter weight than thread pools — no new threads created, just a counter. Better for local in-memory operations.\n\n**Service-level bulkhead:** Deploy multiple isolated instances of a service for different customer tiers. Premium customers get dedicated instances; free tier customers share separate instances. Premium is never impacted by free tier load spikes.\n\n**Connection pool bulkhead:** Separate database connection pools for critical (payments) and non-critical (analytics) workloads.\n\n**Trade-off:** Bulkheads consume more resources upfront (reserved thread pools may be idle). The cost is worth it for critical system paths where isolation is non-negotiable.\n\n**Combine with Circuit Breaker:** Bulkhead limits concurrent calls; circuit breaker prevents calls when the service is failing. Together they provide comprehensive resilience.",
      explanation:
        "Bulkhead: isolate resource pools so one failing dependency can't starve others. Separate thread pools per downstream service. Combine with circuit breaker for full resilience.",
    },
    {
      id: "sd-r6",
      question: "What are timeouts and why must every network call have one?",
      answer:
        "A timeout is a maximum amount of time a caller waits for a response before giving up and returning an error. Every single network call in a distributed system must have a timeout. No exceptions.\n\n**Why timeouts are mandatory:**\nWithout a timeout, a slow or unresponsive downstream service will hold your thread indefinitely. Threads are a finite resource. If 100 threads are all waiting forever, no new requests can be processed. Your service effectively hangs — not from crashes, but from waiting.\n\n**Types of timeouts:**\n\n**Connection timeout:** Time allowed to establish the TCP connection to the server. Typically short (1–5 seconds). If the server is unreachable, fail fast.\n\n**Read timeout (socket timeout):** Time allowed to wait for data after the connection is established. This is the timeout that catches slow servers that accept your connection but then hang before responding.\n\n**Request timeout:** Total end-to-end time for the complete request-response cycle.\n\n**Setting timeout values:**\n- Start with your 99th percentile latency as your read timeout\n- Add a small buffer (1.5–2× P99)\n- Never set timeouts longer than your caller's timeout — if your caller times out before you do, your work is wasted\n\n**Deadline propagation:** In a chain A → B → C → D, each service passes the remaining time budget downstream. If A has a 5-second budget, it passes 4.9s to B, which passes 4.8s to C. When the deadline expires, all services abort their work immediately. gRPC supports deadline propagation natively.\n\n**The timeout dilemma:** Too short → false timeouts on legitimately slow requests. Too long → threads held too long on real failures. Use metrics and percentile-based tuning.",
      explanation:
        "Every network call needs a timeout — no exceptions. Connection timeout: can't connect. Read timeout: server connected but slow. Propagate deadlines downstream through the call chain.",
    },
    {
      id: "sd-r7",
      question: "What are health checks and how do they enable self-healing systems?",
      answer:
        "Health checks are periodic probes that monitoring systems, load balancers, and orchestration platforms (Kubernetes) use to determine if a service instance is alive and able to serve traffic.\n\n**Types of health checks:**\n\n**Liveness probe:** Is the process alive? A simple TCP connection or HTTP ping. If this fails, the process has crashed and should be restarted.\n\n**Readiness probe:** Is the service ready to receive traffic? More nuanced — the process is running, but is it warmed up? Has it loaded its configuration? Can it connect to its dependencies? If readiness fails, the load balancer removes this instance from rotation but doesn't restart it.\n\n**Startup probe:** Is the application done with initialization? Allows slow-starting services to fully initialize before liveness/readiness checks begin.\n\n**Kubernetes integration:**\n```yaml\nlivenessProbe:\n  httpGet:\n    path: /health/live\n    port: 8080\n  initialDelaySeconds: 10\n  periodSeconds: 5\n  failureThreshold: 3\n\nreadinessProbe:\n  httpGet:\n    path: /health/ready\n    port: 8080\n  periodSeconds: 5\n```\n\n**What readiness should check:**\n- Database connection reachable\n- Required caches warmed up\n- Dependent services accessible\n- No critical config missing\n\n**Self-healing:** When a pod's liveness probe fails 3 consecutive times, Kubernetes automatically kills and restarts it. When readiness fails, traffic is redirected to healthy instances. The system heals without human intervention.\n\n**Health endpoint best practices:** Expose `/health/live` and `/health/ready` separately. Health checks should be lightweight — don't run full DB queries on every probe. Use a simple connection ping instead.",
      explanation:
        "Liveness: is process alive? Readiness: is it ready to serve? Kubernetes uses these to restart failed pods and route traffic to healthy ones only. Self-healing infrastructure.",
    },
    {
      id: "sd-r8",
      question: "What is chaos engineering and why do companies like Netflix practice it?",
      answer:
        "Chaos engineering is the practice of intentionally injecting failures into a running system to proactively discover weaknesses before they cause unplanned outages. It was pioneered by Netflix with their Chaos Monkey tool.\n\n**The philosophy:** If failures will eventually happen in production (and they will — hardware dies, networks partition, software has bugs), you should discover how your system behaves under failure on your own terms, not during a critical event at 3 AM.\n\n**Netflix's story:** Netflix runs on AWS. AWS has outages. When a region fails, Netflix needs to survive. Rather than hoping their resilience patterns work, they run Chaos Monkey in production to randomly kill virtual machine instances during business hours. Engineers are present to observe and fix weaknesses found.\n\n**The Chaos Engineering process:**\n1. **Define steady state:** What does normal look like? (metrics: requests/sec, error rate, P99 latency)\n2. **Hypothesize:** 'The system will maintain steady state even when X fails'\n3. **Introduce failure:** Kill a server, inject latency, disconnect a database, exhaust disk space\n4. **Observe:** Does the system return to steady state? What degraded? What broke?\n5. **Fix weaknesses:** Address gaps in resilience, then repeat\n\n**Tools:** Netflix Chaos Monkey (kills EC2 instances), Chaos Gorilla (kills availability zones), Chaos Kong (kills whole AWS regions), Gremlin (commercial platform), Chaos Mesh (Kubernetes chaos).\n\n**Game Days:** Structured chaos experiments with a full team, predefined scope, and clear rollback plans.\n\n**Start small:** Begin in staging, not production. Test one failure at a time. Graduate to production only after confidence is established.\n\n**The key insight:** A resilience pattern that isn't tested is a hypothesis, not a fact. Chaos engineering turns hypotheses into verified guarantees.",
      explanation:
        "Chaos engineering: intentionally inject failures to find weaknesses before real outages do. Netflix's Chaos Monkey kills VMs in production. Test resilience patterns or they're just hypotheses.",
    },
    {
      id: "sd-r9",
      question: "What is graceful degradation and how do you design for it?",
      answer:
        "Graceful degradation means a system continues to provide partial functionality when some of its components fail, rather than failing completely. Users experience reduced functionality, not a total outage. The goal is to never show a blank screen when you can show something useful.\n\n**Netflix example:** If the personalization service is down, show generic popular content instead of personalized recommendations. Users still see movies — just not their personalized list. The core function (watching movies) is unaffected.\n\n**Amazon example:** If the recommendations engine fails, the product page still loads without the 'Customers also bought' section. The user can still purchase.\n\n**Strategies for graceful degradation:**\n\n**Feature flags / kill switches:** Toggle features off in real-time without deployment. When a service is struggling, flip a flag to hide that feature entirely.\n\n**Fallback responses:** When a service call fails, return a cached response, a default value, or a simplified response instead of propagating the error.\n\n**Circuit breaker + fallback:** When the circuit opens, the fallback function runs — return cached data, static content, or a default.\n\n**Read from cache when DB is slow:** If primary database is overloaded, serve slightly stale data from Redis rather than failing.\n\n**Progressive enhancement:** Build the critical path (core feature) to work without optional services. Optional services enhance the experience but aren't required.\n\n**Priority queues:** Under load, drop low-priority requests (analytics, recommendations) and preserve capacity for high-priority operations (checkout, authentication).\n\n**Design principle:** Identify your system's critical path (the minimum set of functionality that must work). Everything outside the critical path should be designed to fail gracefully without affecting it.",
      explanation:
        "Graceful degradation: partial functionality beats total failure. Use fallbacks, feature flags, cached responses, and circuit breakers. Identify and protect the critical path.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 5 — CLASSIC SYSTEM DESIGN PROBLEMS
// ─────────────────────────────────────────────
const classicProblemsTopic: SystemDesignTopic = {
  id: "classic-problems",
  title: "Classic System Design Problems",
  icon: "🏗️",
  questions: [
    {
      id: "sd-p1",
      question: "How do you approach any system design interview question? Give a framework.",
      answer:
        "System design interviews are open-ended. Without a framework you'll wander. Here's a battle-tested 6-step approach:\n\n**Step 1 — Clarify Requirements (5 min):**\nNever start designing immediately. Ask: What are the functional requirements (what must the system do)? What are the non-functional requirements (scale, latency, availability, consistency)? Who are the users? What's the expected scale (DAU, QPS, data volume)?\n\n**Step 2 — Back-of-Envelope Estimation (3 min):**\nEstimate QPS (reads and writes separately), storage per day/year, bandwidth. This tells you what tier of solution you need and where bottlenecks will be.\n\n**Step 3 — Define the API / Data Model (5 min):**\nWhat are the key API endpoints? What data do they take and return? What are the core entities (tables/documents) and their relationships?\n\n**Step 4 — High-Level Design (10 min):**\nDraw the big boxes: client → API Gateway → services → databases → caches. Don't over-engineer yet. Cover the happy path end-to-end.\n\n**Step 5 — Deep Dive into Components (15 min):**\nPick the hardest or most interesting part. The interviewer often guides this. Database schema, sharding strategy, cache invalidation, feed generation algorithm — go deep on one area.\n\n**Step 6 — Address Bottlenecks & Trade-offs (5 min):**\nWhere will this system fail at 10× scale? What are you trading off? Single points of failure? Consistency vs availability decisions?\n\n**Golden rules:** Talk out loud continuously. State assumptions explicitly. Draw diagrams. Ask for feedback. Show you understand trade-offs — there are no perfect answers, only justified decisions.",
      explanation:
        "Framework: Clarify → Estimate → API/Data Model → High-level design → Deep dive → Bottlenecks. Talk out loud, state assumptions, show trade-offs.",
      diagram: {
        type: "flow",
        title: "System Design Interview Framework",
        direction: "vertical",
        data: [
          { label: "1. Clarify Requirements\n(Functional + Non-Functional)", color: "primary" },
          { label: "2. Estimate Scale\n(QPS, Storage, Bandwidth)", color: "info" },
          { label: "3. Define API & Data Model\n(Endpoints, Entities)", color: "accent" },
          { label: "4. High-Level Design\n(Big boxes end-to-end)", color: "success" },
          { label: "5. Deep Dive\n(Hardest component)", color: "warning" },
          { label: "6. Bottlenecks & Trade-offs\n(Failure modes, scaling)", color: "heap" },
        ],
      },
    },
    {
      id: "sd-p2",
      question: "Design a URL Shortener (like bit.ly)",
      answer:
        "**Functional requirements:** Given a long URL, generate a short alias. Redirect short URL to original. (Optional: custom alias, expiry, analytics)\n\n**Scale estimation:** 100M URLs created/day = ~1,200 writes/sec. Reads are 10× writes = 12,000 redirects/sec. Each URL record ~500 bytes → 100M × 500B = 50GB/day storage.\n\n**API:**\n- `POST /shorten` body: `{longUrl, customAlias?, expiry?}` → returns `{shortUrl}`\n- `GET /{shortCode}` → 301/302 redirect to longUrl\n\n**Short code generation:**\n- Need ~7 characters from base62 (a-z, A-Z, 0-9) = 62^7 = 3.5 trillion combinations\n- **Option 1 — Hash:** MD5/SHA256 the long URL, take first 7 characters. Fast. Collision risk (handle with retry or append user ID).\n- **Option 2 — Counter + Base62 encode:** Auto-increment counter in DB, encode to base62. Simple, no collisions. But sequential codes are predictable.\n- **Option 3 — Pre-generated codes:** Background worker pre-generates codes, stores in a 'used_keys' table. Service picks one at creation time. No collision possible.\n\n**Database:** SQL works at this scale. Table: `{id, short_code, long_url, user_id, created_at, expires_at, click_count}`\n\n**Caching:** Cache `short_code → long_url` in Redis (TTL = expiry or 24h). 80% of traffic is to 20% of URLs (power law). Cache hit rate will be very high.\n\n**Redirect type:** 301 Permanent (browser caches, fewer server hits, analytics loses accuracy) vs 302 Temporary (every redirect hits server, enables accurate analytics). Choose 302 for analytics use cases.\n\n**Scaling writes:** With 1,200 writes/sec, a single PostgreSQL is fine. At 10× scale, shard by short_code first 2 characters.",
      explanation:
        "URL Shortener: base62 7-char codes, hash or counter approach. Cache short→long in Redis. 302 redirect for analytics. Single DB handles this scale; shard later.",
      diagram: {
        type: "flow",
        title: "URL Shortener — Request Flow",
        direction: "vertical",
        data: [
          { label: "Client visits\nshort.ly/abc1234", color: "primary" },
          { label: "Load Balancer", color: "info" },
          { label: "App Server\n→ Check Redis cache", color: "accent" },
          { label: "Cache HIT → long URL\nCache MISS → query DB", color: "warning" },
          { label: "302 Redirect\nto Original URL", color: "success" },
        ],
      },
    },
    {
      id: "sd-p3",
      question: "Design a Twitter/News Feed system",
      answer:
        "**Core feature:** User sees a timeline of tweets from people they follow, ordered by recency (or relevance).\n\n**Scale:** 500M DAU, 300M tweets/day (~3,500 writes/sec). Reading timelines is 10,000× more frequent than writing tweets.\n\n**The fundamental challenge:** When user A posts a tweet, 10 million followers each need to see it in their feed. How?\n\n**Approach 1 — Fan-out on Write (Push model):**\nWhen a tweet is created, immediately write it to every follower's timeline cache (Redis sorted set, scored by timestamp). Timeline reads are O(1) — just read from cache.\n\n**Pros:** Reads are instant. Cache is always ready.\n**Cons:** Writing to 10M follower feeds takes time and resources. Celebrity problem — Kim Kardashian has 300M followers. One tweet = 300M Redis writes.\n\n**Approach 2 — Fan-out on Read (Pull model):**\nTimeline is computed at read time. Fetch the latest tweets from all people the user follows, merge and sort. No write amplification.\n\n**Pros:** No celebrity problem. Write is simple — just store the tweet.\n**Cons:** Read is expensive — must query all N followees and merge. Very slow for users who follow 10,000 accounts.\n\n**Twitter's hybrid approach (the real answer):**\n- Regular users: fan-out on write (most people have <1,000 followers)\n- Celebrity users (>1M followers): excluded from fan-out. Their tweets are injected at read time.\n- At read time: merge pre-built feed from cache + real-time celebrity tweets\n\n**Data storage:**\n- Tweets: Sharded by `tweet_id` (time-ordered ID like Snowflake)\n- User graph (follow relationships): Redis sorted sets or graph DB\n- Timeline cache: Redis sorted set per user, `{tweet_id: timestamp}`, keep last 800 tweets",
      explanation:
        "News feed: fan-out on write for regular users (O(1) read), fan-out on read for celebrities. Twitter uses hybrid. Timeline stored as Redis sorted set per user.",
      diagram: {
        type: "table-visual",
        title: "Fan-out on Write vs Fan-out on Read",
        data: [
          {
            label: "Fan-out on Write (Push)",
            color: "success",
            children: [
              { label: "Write tweet → push to all follower caches" },
              { label: "Read timeline: O(1) from cache" },
              { label: "Write cost: O(followers)" },
              { label: "Problem: celebrities (300M followers)" },
            ],
          },
          {
            label: "Fan-out on Read (Pull)",
            color: "info",
            children: [
              { label: "Write tweet → store only once" },
              { label: "Read: fetch all followee tweets, merge" },
              { label: "Read cost: O(followees)" },
              { label: "Problem: heavy readers, slow timeline" },
            ],
          },
          {
            label: "Hybrid (Twitter's approach)",
            color: "primary",
            children: [
              { label: "Regular users: fan-out on write" },
              { label: "Celebrities: excluded from fan-out" },
              { label: "Read time: cache + inject celebrity tweets" },
              { label: "Best of both worlds" },
            ],
          },
          {
            label: "Storage",
            color: "accent",
            children: [
              { label: "Tweets: sharded DB by tweet_id" },
              { label: "Follow graph: Redis sorted sets" },
              { label: "Timeline cache: Redis sorted set/user" },
              { label: "Keep last ~800 tweets per user" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-p4",
      question: "Design a Chat System like WhatsApp",
      answer:
        "**Functional requirements:** 1-1 messaging, group messaging (up to 500 members), online/offline status, message delivery receipts (sent, delivered, read), media sharing.\n\n**Scale:** 2 billion users, 100 billion messages/day (~1.2M messages/second).\n\n**Connection layer — WebSockets:**\nHTTP is request-response. Chat needs server-to-client push. Each user maintains a persistent WebSocket connection to a Chat Server. When you send a message, it goes to your Chat Server over WebSocket. The Chat Server delivers to recipient's Chat Server (if different), which pushes to recipient over their WebSocket.\n\n**1-1 messaging flow:**\n1. User A sends message to User B\n2. Chat Server A receives message, assigns `message_id` (Snowflake ID)\n3. Stores message in DB (Cassandra — optimized for high write throughput)\n4. Looks up which Chat Server User B is connected to (via Service Discovery / Redis)\n5. Forwards message to Chat Server B\n6. Chat Server B pushes to User B via WebSocket\n7. Delivery receipt sent back\n\n**Offline users:**\nIf User B is offline, message queues in a push notification service. When B comes online, undelivered messages are fetched from DB.\n\n**Message storage — Cassandra:**\n- Partition key: `(conversation_id)` — all messages for a conversation on the same node\n- Clustering key: `message_id` (time-ordered) — messages sorted by time\n- Why Cassandra: massive write throughput, time-ordered reads within partition\n\n**Group messaging:**\nFan-out to all group members. For large groups (up to 500), use a message queue to fan out asynchronously. Store group membership in a separate service.\n\n**Presence (online/offline):**\nUsers send a heartbeat every 5 seconds. Last seen timestamp stored in Redis. If no heartbeat in 30 seconds → offline. Redis pub/sub broadcasts status changes to friends.",
      explanation:
        "WhatsApp: WebSocket for real-time push. Cassandra for message storage (high write throughput). Service discovery routes between chat servers. Heartbeat for presence.",
    },
    {
      id: "sd-p5",
      question: "Design a Rate Limiter as a service",
      answer:
        "**Requirements:** Limit each user/API key to N requests per window. Return 429 when exceeded. Distributed — must work across many API servers. Low latency (<5ms overhead).\n\n**Why distributed rate limiting is hard:**\nWith 10 API servers each maintaining their own counters, a user can send 100 requests to each server = 1000 total requests while each server thinks they've only sent 100. Local rate limiting fails in distributed environments.\n\n**Solution: Centralized counter in Redis:**\nAll API servers share a Redis instance for rate limit state. Redis is single-threaded — atomic operations prevent race conditions.\n\n**Sliding window with Redis:**\n```\nkey = \"rate_limit:{user_id}:{current_minute}\"\nATOMIC:\n  count = INCR key\n  if count == 1: EXPIRE key 60\n  if count > limit: return 429\n```\n\n**Token bucket in Redis:**\n- Store `{tokens, last_refill_time}` per user in Redis\n- Use Lua script (atomic execution) to check-and-update atomically\n- Lua runs atomically on Redis — no race condition\n\n**Architecture:**\n- Rate limiter middleware in API Gateway (centralized) or as a sidecar\n- Redis Cluster for the counter store (sharded by user_id)\n- Fallback: if Redis is unavailable, allow requests through (fail open) rather than blocking all traffic\n\n**Response headers (important for API clients):**\n```\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 47\nX-RateLimit-Reset: 1623456000\nRetry-After: 30\n```\n\n**Multi-tier rate limiting:** Limit by IP (DDoS protection) + by user ID (fair use) + by API key (tier enforcement). Apply in order — reject at the first exceeded limit.",
      explanation:
        "Distributed rate limiter: shared Redis counter with atomic INCR. Lua scripts for token bucket. Fail open if Redis unavailable. Return X-RateLimit headers. Layer IP + user + API key limits.",
    },
    {
      id: "sd-p6",
      question: "Design a notification system (push, email, SMS)",
      answer:
        "**Requirements:** Send notifications via push (iOS/Android), email, and SMS. Triggered by system events (new message, order shipped, payment failed). High throughput, reliable delivery, user preferences respected.\n\n**High-level architecture:**\n\n**Event ingestion:** Various services (Order Service, Payment Service, Chat Service) publish events to Kafka topics: `order.shipped`, `payment.failed`, `new.message`.\n\n**Notification Service:** Subscribes to Kafka topics. For each event:\n1. Look up notification rules (which event → which notification types)\n2. Look up user preferences (user opted out of email? use push only)\n3. Look up user contact info (email address, device tokens)\n4. Route to the appropriate delivery channel\n\n**Delivery channels:**\n- **Push notifications:** Call Apple APNs (iOS) or Google FCM (Android) APIs. Store device tokens per user in DB.\n- **Email:** Send via third-party service (SendGrid, AWS SES). Never send directly from your own SMTP server (deliverability issues).\n- **SMS:** Twilio or AWS SNS. Expensive — only for critical notifications.\n\n**Reliability patterns:**\n- Each channel has its own queue (Kafka topic or SQS queue). Failures in SMS don't affect email.\n- Retry with exponential backoff on delivery failure\n- Dead letter queue for permanently failed notifications\n- Idempotency key per notification — never send twice even if event replayed\n\n**User preferences:** Store `{user_id, channel, event_type, enabled}` in DB. Check before sending. Honor opt-outs and unsubscribes immediately (legal requirement for email).\n\n**Rate limiting notifications:** Don't spam. Batch similar notifications (5 likes → '5 people liked your post'). Respect quiet hours.",
      explanation:
        "Notification system: Kafka ingests events → Notification Service → routes to push/email/SMS channels. Each channel independent. Idempotency keys prevent duplicates. Honor user preferences.",
      diagram: {
        type: "flow",
        title: "Notification System Architecture",
        direction: "vertical",
        data: [
          { label: "Services emit events\n(Order, Payment, Chat)", color: "primary" },
          { label: "Kafka\n(Event Bus)", color: "warning" },
          { label: "Notification Service\n(Rules + Preferences + Routing)", color: "info" },
          { label: "Push Queue  |  Email Queue  |  SMS Queue", color: "accent" },
          { label: "APNs/FCM  |  SendGrid  |  Twilio", color: "success" },
        ],
      },
    },
    {
      id: "sd-p7",
      question: "Design a search autocomplete / typeahead system",
      answer:
        "**Requirements:** As user types in search box, return top 5 matching suggestions in <100ms. Support millions of queries/second.\n\n**Why this is hard:** At 100M DAU × 5 keystrokes per search = 500M autocomplete requests/day = ~6,000 req/sec. Each must respond in <100ms.\n\n**Data structure — Trie:**\nA trie (prefix tree) maps prefixes to their completions. For 'tw' → ['twitter', 'twitch', 'twilight']. Query time: O(prefix length). Classic computer science answer.\n\n**Problem with naive trie:** In practice, a trie with all English words is large (GBs). Traversing to find top-K completions requires visiting many nodes.\n\n**Production approach — Aggregated prefix table:**\nPre-compute the top 10 suggestions for every prefix up to length N, store in a key-value store.\n```\n\"t\"   → [\"twitter\", \"twitch\", \"the\", ...]\n\"tw\"  → [\"twitter\", \"twitch\", \"twilio\", ...]\n\"twi\" → [\"twitter\", \"twitch\", \"twilight\", ...]\n```\nLookup: O(1) — just fetch the row for the typed prefix. This is how Google actually works.\n\n**How to build and update the table:**\n1. Log all search queries with frequency\n2. MapReduce / Spark job runs hourly: count frequencies, compute top-K per prefix\n3. Write results to the prefix store (Cassandra or Redis)\n4. No real-time updates (popular searches are stable enough)\n\n**Frontend optimizations:**\n- Debounce: don't fire API call on every keystroke — wait 100ms after user stops typing\n- Client-side cache: cache results for prefixes already fetched this session\n- Prefix filtering: if 'tw' results are already returned, filter locally for 'twi' before next API call\n\n**CDN/edge caching:** Popular prefixes ('the', 'a', 'in') can be cached at CDN edge — they change only hourly.",
      explanation:
        "Autocomplete: pre-compute top-K suggestions per prefix in key-value store. O(1) lookup. Update via batch job hourly. Debounce on frontend. CDN-cache popular prefixes.",
    },
    {
      id: "sd-p8",
      question: "Design a distributed key-value store (like Redis)",
      answer:
        "**Requirements:** `get(key)`, `put(key, value)`, `delete(key)`. Low latency (<10ms P99). Highly available. Horizontally scalable. Optional: TTL, persistence.\n\n**Single node foundation:**\nIn-memory hash table for O(1) reads/writes. For persistence: write-ahead log (WAL) on every mutation. On restart, replay WAL to rebuild state. Optional: periodic snapshots (like Redis RDB).\n\n**Consistent Hashing for distribution:**\nSpread keys across N nodes using consistent hashing ring. Each node is responsible for a range of the ring. Adding/removing nodes only requires remapping keys from neighbors — not all keys.\n\n**Data partitioning:**\nVirtual nodes (vnodes): each physical node owns multiple positions on the ring. Ensures more even distribution and smoother rebalancing.\n\n**Replication for availability:**\nEach key is replicated on R nodes (e.g., R=3 — the key's primary node + 2 clockwise neighbors). Reads/writes can be served by any replica.\n\n**Consistency tuning (quorum):**\n- `W` = number of nodes that must confirm a write\n- `R` = number of nodes that must respond to a read\n- If `W + R > N` → strong consistency (overlap guaranteed)\n- Common setting: N=3, W=2, R=2 → strong consistency\n- For high availability: W=1, R=1 → eventual consistency, maximum throughput\n\n**Failure detection — Gossip protocol:**\nNodes periodically exchange state with random neighbors. Information about failures propagates through the cluster in O(log N) rounds. No central coordinator needed. This is how Cassandra and DynamoDB detect failures.\n\n**Handling failures — Hinted Handoff:**\nIf a node is temporarily down, another node stores writes intended for it with a hint. When the failed node recovers, the hints are forwarded. No data loss during short outages.",
      explanation:
        "Distributed KV store: consistent hashing for partitioning, quorum reads/writes for consistency tuning, gossip protocol for failure detection, hinted handoff for availability.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 6 — MICROSERVICES & ARCHITECTURE
// ─────────────────────────────────────────────
const microservicesTopic: SystemDesignTopic = {
  id: "microservices",
  title: "Microservices & Architecture Patterns",
  icon: "🧩",
  questions: [
    {
      id: "sd-m1",
      question: "Monolith vs Microservices vs SOA — what are the real trade-offs?",
      answer:
        "**Monolith:** All application components (UI, business logic, data access) are packaged and deployed as a single unit. One codebase, one deployment, one process.\n\n**Pros:** Simple to develop, test, debug, and deploy. No network latency between components. No distributed system complexity. Ideal for small teams and early-stage products.\n\n**Cons:** As it grows — long build/deploy cycles, team coordination hell, one bug can take down everything, hard to scale individual components independently.\n\n**Microservices:** Application is decomposed into small, independently deployable services, each responsible for a specific business capability. Each service has its own codebase, database, and deployment pipeline.\n\n**Pros:** Independent scaling (scale only the bottleneck), independent deployment (no coordination), technology heterogeneity (each service chooses its stack), team autonomy.\n\n**Cons:** Distributed system complexity — network failures, latency, partial failures. Data consistency across services is hard. Operational overhead — each service needs monitoring, logging, deployment pipeline. Performance overhead — network calls replace in-process function calls.\n\n**SOA (Service-Oriented Architecture):** Similar to microservices but typically uses a centralized Enterprise Service Bus (ESB) for communication. Services tend to be larger ('macro-services'). Popular in enterprise Java world (2000s). The ESB becomes a bottleneck and single point of failure.\n\n**The uncomfortable truth:** Microservices are not inherently better. They trade one set of problems for another. Start with a well-structured monolith. Extract services only when you have a proven need — team scaling, independent deployment requirements, or specific performance constraints.",
      explanation:
        "Monolith: simple, great for small teams. Microservices: independently scalable, complex distributed system. SOA: like microservices with central ESB. Start monolith, extract services when needed.",
      diagram: {
        type: "table-visual",
        title: "Monolith vs SOA vs Microservices",
        data: [
          {
            label: "Monolith",
            color: "info",
            children: [
              { label: "Single deployable unit" },
              { label: "Simple dev, test, debug" },
              { label: "Scales as a whole" },
              { label: "Best for: startups, small teams" },
            ],
          },
          {
            label: "SOA",
            color: "warning",
            children: [
              { label: "Services + central ESB" },
              { label: "ESB = bottleneck + SPOF" },
              { label: "Large coarse-grained services" },
              { label: "Enterprise Java legacy" },
            ],
          },
          {
            label: "Microservices",
            color: "success",
            children: [
              { label: "Small, independently deployed" },
              { label: "Own DB per service" },
              { label: "High operational overhead" },
              { label: "Best for: large teams, proven scale" },
            ],
          },
          {
            label: "When to Migrate",
            color: "primary",
            children: [
              { label: "Team > 50 engineers" },
              { label: "Deploy cycles are painful" },
              { label: "Proven performance bottleneck" },
              { label: "Clear bounded contexts exist" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-m2",
      question: "What is the Database-per-Service pattern and why does it matter?",
      answer:
        "In microservices, each service owns its data exclusively. No other service can access its database directly. Data is exposed only through the service's API.\n\n**Why database-per-service?**\n\n**Loose coupling:** If Service A can query Service B's database directly, changing B's schema breaks A. With API-only access, B can change its internal storage freely as long as the API contract is maintained.\n\n**Independent scaling:** The Order Service database can be scaled independently from the User Service database. Use the right database type per service — User Service uses PostgreSQL, Product Catalog uses Elasticsearch, Session Service uses Redis.\n\n**Independent deployments:** If services share a database, a schema migration must coordinate across all services simultaneously. Database-per-service removes this coordination.\n\n**The hard problem — data consistency across services:**\nTransaction A spans Order Service and Payment Service. If payment fails after order is created, how do you roll back the order? You can't use a database transaction — they're in different databases.\n\n**Solution 1 — Saga Pattern:** Break the transaction into a sequence of local transactions, each with a compensating transaction for rollback. (Covered in the next question.)\n\n**Solution 2 — Event-based eventual consistency:** Services emit events when data changes. Other services listen and update their own state. Accept that data will be temporarily inconsistent.\n\n**The shared database anti-pattern:** Some teams use a shared database for simplicity but call it 'microservices'. This is the worst of both worlds — distributed system complexity without the benefits of loose coupling. Avoid it.",
      explanation:
        "Database-per-service: each service owns its DB exclusively, access only via API. Enables loose coupling and independent scaling. Hard problem: cross-service consistency — use Saga or events.",
    },
    {
      id: "sd-m3",
      question: "What is the Saga pattern for distributed transactions?",
      answer:
        "The Saga pattern manages long-running business transactions that span multiple microservices, where each service has its own database and traditional ACID transactions are impossible.\n\n**The problem:** Place an order requires: (1) Create order, (2) Reserve inventory, (3) Process payment, (4) Schedule delivery. These span 4 different services with 4 different databases. What if step 3 fails? You need to undo steps 1 and 2.\n\n**Saga approach:** Break the transaction into a sequence of local transactions. Each local transaction updates its service's database and publishes an event or message. If a step fails, execute compensating transactions to undo previous steps.\n\n**Choreography-based Saga:**\nNo central coordinator. Each service publishes events and listens for events from others.\n- Order Service creates order → publishes `OrderCreated`\n- Inventory Service listens → reserves stock → publishes `InventoryReserved`\n- Payment Service listens → charges card → publishes `PaymentProcessed`\n- Delivery Service listens → schedules delivery\n- If payment fails → publishes `PaymentFailed` → Inventory Service listens and releases stock → Order Service cancels order\n\n**Pros:** Simple, decoupled, no SPOF\n**Cons:** Hard to track overall state, circular dependencies, difficult to debug\n\n**Orchestration-based Saga:**\nA central Saga Orchestrator controls the flow. It calls each service in sequence and handles failures by calling compensating transactions.\n\n**Pros:** Clear flow, easy to monitor, centralized error handling\n**Cons:** Orchestrator can become a bottleneck, tighter coupling\n\n**Compensating transactions:** Must be idempotent and commutative. They undo the effect of a previous step. Example: `Cancel order` compensates `Create order`.\n\n**When to use:** Any multi-step process spanning multiple services where consistency matters but eventual consistency is acceptable (e-commerce checkout, travel booking).",
      explanation:
        "Saga: sequence of local transactions with compensating rollbacks. Choreography: event-driven, decoupled. Orchestration: central coordinator. Compensating transactions must be idempotent.",
      diagram: {
        type: "flow",
        title: "Orchestration-Based Saga — Order Flow",
        direction: "vertical",
        data: [
          { label: "Saga Orchestrator\n(Controls the flow)", color: "primary" },
          { label: "1. Create Order\n(Order Service)", color: "success" },
          { label: "2. Reserve Inventory\n(Inventory Service)", color: "info" },
          { label: "3. Process Payment\n(Payment Service)", color: "accent" },
          { label: "4. Schedule Delivery\n(Delivery Service)  ✓ Complete", color: "success" },
        ],
      },
    },
    {
      id: "sd-m4",
      question: "What is CQRS (Command Query Responsibility Segregation)?",
      answer:
        "CQRS separates the write model (commands — change state) from the read model (queries — read state). Instead of a single model that handles both reads and writes, you have two distinct models optimized for their specific purpose.\n\n**The problem CQRS solves:**\nIn a complex domain, the model needed to correctly enforce business rules during writes (rich domain objects, validations, invariants) is often very different from the model needed for reads (flat DTOs, denormalized views, projections). Trying to use one model for both creates a compromise that does neither well.\n\n**How CQRS works:**\n- **Command side:** Commands (Create, Update, Delete) go through the domain model, enforce business rules, and write to the write database (normalized, consistent)\n- **Query side:** Queries read from a separate read database (denormalized, pre-projected, optimized for specific queries)\n- **Synchronization:** Events emitted by the command side are consumed by projectors that update the read models asynchronously\n\n**Benefits:**\n- Read and write sides scale independently (reads are often 10× more frequent)\n- Read models can be denormalized for performance without compromising write consistency\n- Read models can be materialized views — no joins needed at query time\n- Multiple specialized read models for different use cases (search, reporting, UI)\n\n**CQRS + Event Sourcing:** Often combined. The write store is an immutable event log. Read models are built by replaying events. Any read model can be rebuilt from scratch at any time.\n\n**When to use:** Complex domains with heavy read load, different scaling needs for reads/writes, need for multiple views of the same data. Overkill for simple CRUD applications.",
      explanation:
        "CQRS: separate write model (domain logic) from read model (denormalized views). Independent scaling. Sync via events. Combine with Event Sourcing. Overkill for simple CRUD.",
      diagram: {
        type: "flow",
        title: "CQRS Architecture",
        direction: "horizontal",
        data: [
          { label: "Client", color: "primary" },
          { label: "Commands\n→ Domain Model\n→ Write DB", color: "warning" },
          { label: "Event\nProjector\n(async)", color: "accent" },
          { label: "Queries\n→ Read Model\n→ Read DB", color: "success" },
        ],
      },
    },
    {
      id: "sd-m5",
      question: "What is Event Sourcing?",
      answer:
        "Event Sourcing is a persistence pattern where instead of storing the current state of an entity, you store the sequence of events that led to that state. The current state is derived by replaying all events from the beginning.\n\n**Traditional persistence:** Store the current state. `Account balance: $450`. If it changes, overwrite. History is lost.\n\n**Event Sourcing:** Store every event. `[AccountCreated($0), MoneyDeposited($500), MoneyWithdrawn($50)]`. Current state = replay: $0 + $500 - $50 = $450. Full history preserved.\n\n**Benefits:**\n\n**Complete audit log:** Every state change is recorded with who did it, when, and why. Critical for financial, healthcare, and legal systems. Regulators love it.\n\n**Time travel:** Reconstruct the state of any entity at any point in the past. What was the user's account balance on January 15th at 2:30 PM?\n\n**Replay for new features:** Build a new read model or fix a bug in a projection? Replay all events from the beginning to rebuild. No ETL needed.\n\n**Debugging:** When something goes wrong, you have the full event history. No mystery about how you got to the current state.\n\n**Challenges:**\n\n**Snapshots:** For entities with thousands of events, replaying from the beginning is slow. Periodically snapshot the current state and replay only events after the snapshot.\n\n**Event schema evolution:** Events are immutable and permanent. Changing an event's format requires versioning (V1, V2) and upcasting (upgrading old events to new format when reading).\n\n**Eventual read consistency:** Read models are updated asynchronously — slight delay between write and read visibility.\n\n**Storage growth:** Events accumulate forever. With snapshots, old events can be archived but not deleted (defeats the purpose).",
      explanation:
        "Event Sourcing: store events not state. Replay to get current state. Benefits: audit log, time travel, replay. Challenges: schema evolution, slow replay (use snapshots), eventual read consistency.",
    },
    {
      id: "sd-m6",
      question: "What is service discovery in microservices?",
      answer:
        "In a microservices architecture, services need to find each other to communicate. With dynamic environments (containers starting/stopping, auto-scaling), you can't hardcode IP addresses. Service discovery solves this.\n\n**The problem:** Service A needs to call Service B. Service B runs on 5 instances across 3 servers, and those instances change constantly as Kubernetes scales them up and down. How does A know where to send requests?\n\n**Client-side discovery:**\nThe service registry (Eureka, Consul) maintains a list of available instances for each service. Service A queries the registry directly, gets the list, and load-balances itself (chooses one instance using round-robin or random). Used in Netflix's microservice stack.\n\n**Pros:** Client has full control over load balancing strategy\n**Cons:** Every service must implement discovery client library. Polyglot environments get complex.\n\n**Server-side discovery:**\nService A sends request to a load balancer or API Gateway. The load balancer queries the service registry and forwards to an available instance. A doesn't know about discovery at all.\n\n**Pros:** Discovery logic centralized, clients are dumb\n**Cons:** Load balancer is an additional hop and potential bottleneck\n\n**Kubernetes approach:**\nKubernetes has built-in service discovery via DNS. Each service gets a stable DNS name (`http://payment-service:8080`). Kubernetes routes to healthy pods automatically. You don't need a separate service registry.\n\n**Service registry options:** Consul (multi-datacenter, health checking), Eureka (Netflix, Java-focused), etcd (distributed KV used by Kubernetes), Zookeeper (Kafka, legacy systems).",
      explanation:
        "Service discovery: dynamic registry of service instances. Client-side (Eureka): client queries and load-balances. Server-side (API Gateway): LB queries registry. Kubernetes: DNS-based, built-in.",
      diagram: {
        type: "hierarchy",
        title: "Service Discovery — Options",
        data: [
          {
            label: "Service Registry",
            color: "primary",
            children: [
              {
                label: "Client-side Discovery",
                color: "info",
                children: [
                  { label: "Eureka (Netflix)", color: "success" },
                  { label: "Consul", color: "success" },
                ],
              },
              {
                label: "Server-side Discovery",
                color: "accent",
                children: [
                  { label: "AWS ALB + ECS", color: "success" },
                  { label: "Kubernetes DNS", color: "success" },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "sd-m7",
      question: "What is the Strangler Fig pattern for migrating a monolith?",
      answer:
        "The Strangler Fig pattern is a strategy for incrementally migrating a monolith to microservices without a dangerous big-bang rewrite. Named after the strangler fig tree, which grows around a host tree until it eventually replaces it.\n\n**The problem with big-bang rewrites:** Rewriting everything from scratch simultaneously takes years, delivers no value during the rewrite, and introduces massive risk. The new system and old system diverge. This is famously how Netscape died — they rewrote Netscape 4 as Netscape 5, it took 3 years, the market had moved on.\n\n**How Strangler Fig works:**\n1. Put a facade/proxy in front of the monolith (could be an API Gateway or reverse proxy like NGINX)\n2. Identify a bounded context to extract (e.g., User Authentication)\n3. Build the new microservice for that capability\n4. Switch the facade to route that traffic to the new service\n5. Delete the corresponding code from the monolith\n6. Repeat for the next capability\n\n**Benefits:**\n- Continuous delivery of value throughout the migration\n- Risk is contained — each extraction is small and reversible\n- Old and new systems co-exist during migration\n- Team learns microservices patterns gradually\n\n**Choosing what to extract first:**\n- Start with independently deployable, well-bounded capabilities\n- Avoid tightly coupled, shared-database areas initially\n- Good first candidates: authentication, notifications, file storage\n- Hard last: anything touching the core transaction tables\n\n**The data migration challenge:** When extracting a service, you must also migrate its data out of the shared monolith database. Use event-based dual-writes to sync during transition, then cut over.",
      explanation:
        "Strangler Fig: route traffic via facade, extract one service at a time, delete from monolith. Incremental, reversible, low risk. Better than big-bang rewrites. Start with well-bounded capabilities.",
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 7 — STORAGE, CDN & INFRASTRUCTURE
// ─────────────────────────────────────────────
const storageTopic: SystemDesignTopic = {
  id: "storage",
  title: "Storage, CDN & Infrastructure",
  icon: "💾",
  questions: [
    {
      id: "sd-st1",
      question: "Block storage vs Object storage vs File storage — when do you use each?",
      answer:
        "These are three fundamentally different storage paradigms, each optimized for different use cases.\n\n**Block Storage:**\nData is stored as fixed-size blocks (e.g., 512 bytes or 4KB). The OS sees it as a raw disk — you format it with a filesystem (ext4, NTFS). Very low-level, very fast random access. Used as the underlying storage for databases and virtual machine disks.\n\n**Examples:** AWS EBS (Elastic Block Store), Azure Managed Disks\n**Use for:** Database data files, VM boot disks, anything needing random read/write with low latency\n\n**File Storage (NAS):**\nData organized as a hierarchical tree of files and folders. Accessed via network protocols: NFS (Linux) or SMB/CIFS (Windows). Multiple machines can mount the same filesystem simultaneously.\n\n**Examples:** AWS EFS (Elastic File System), NFS servers\n**Use for:** Shared configuration files, legacy applications expecting a filesystem, content that multiple servers write to simultaneously\n\n**Object Storage:**\nData stored as objects — each object has an ID (key), the data (value), and metadata. No hierarchy (though key naming convention can simulate it). Access via HTTP API: `PUT object`, `GET object`. Massively scalable, highly durable, cheap. No random writes — objects are replaced entirely.\n\n**Examples:** AWS S3, Google Cloud Storage, Cloudflare R2\n**Use for:** Media files (images, videos), backups, static website assets, data lake storage, logs\n\n**The rule of thumb:** Databases → Block. Shared config/legacy → File. Everything else at scale (media, backups, assets) → Object.",
      explanation:
        "Block: raw disk, low-latency random I/O, for DBs and VMs. File: hierarchical, network-mounted, shared access. Object: HTTP API, massively scalable, media and backups. Know which for each use case.",
      diagram: {
        type: "table-visual",
        title: "Storage Types Comparison",
        data: [
          {
            label: "Block Storage",
            color: "primary",
            children: [
              { label: "Fixed-size blocks, raw disk" },
              { label: "Lowest latency, random I/O" },
              { label: "One client at a time" },
              { label: "AWS EBS, Azure Disk" },
              { label: "Use: databases, VMs" },
            ],
          },
          {
            label: "File Storage (NAS)",
            color: "info",
            children: [
              { label: "Hierarchical files/folders" },
              { label: "NFS/SMB network protocols" },
              { label: "Multiple clients simultaneously" },
              { label: "AWS EFS, NFS servers" },
              { label: "Use: shared config, legacy apps" },
            ],
          },
          {
            label: "Object Storage",
            color: "success",
            children: [
              { label: "Flat key-value, HTTP API" },
              { label: "Massively scalable, cheap" },
              { label: "No random writes (replace whole obj)" },
              { label: "AWS S3, GCS, R2" },
              { label: "Use: media, backups, assets, datalake" },
            ],
          },
        ],
      },
    },
    {
      id: "sd-st2",
      question: "How does object storage (S3) work internally?",
      answer:
        "Object storage like Amazon S3 appears simple from the outside — PUT and GET by key — but internally it's a sophisticated distributed system.\n\n**Key design goals:** 11 nines durability (99.999999999%), high availability, unlimited scale, low cost.\n\n**How S3 achieves 11 nines durability:**\nWhen you upload an object, S3 automatically replicates it across minimum 3 Availability Zones (physically separate data centers in a region). Each AZ writes to multiple servers within it. The data is also protected by erasure coding — the file is split into chunks, parity chunks are added, and the file can be reconstructed even if several chunks are lost.\n\n**Internal architecture:**\n- **Front-end layer:** Handles authentication (IAM), request parsing, routing\n- **Index service:** Maps bucket+key to the physical location of the data. Stored in a distributed metadata store.\n- **Storage nodes:** Actual data is stored on disk. Each node runs a simple key-value store.\n- **Background processes:** Integrity checking (checksums verified continuously), replication monitoring (if a replica falls below 3, recreate it), garbage collection\n\n**Consistency model:** S3 is now strongly consistent (as of December 2020). Previously it was eventually consistent — this caused subtle bugs for years.\n\n**S3 performance tips:**\n- Random key prefixes prevent hotspots (S3 partitions by key prefix)\n- Multipart upload for files > 100MB — parallel uploads of chunks\n- S3 Transfer Acceleration uses CloudFront edge locations as upload endpoints\n- Pre-signed URLs: grant temporary access to private objects without exposing credentials",
      explanation:
        "S3: replicates across 3+ AZs with erasure coding for 11 nines durability. Index maps key to location. Strong consistency since 2020. Use multipart upload and random prefixes for performance.",
    },
    {
      id: "sd-st3",
      question: "How does a CDN work in detail? Push vs Pull CDN?",
      answer:
        "A CDN (Content Delivery Network) distributes content across a global network of edge servers (Points of Presence — PoPs). Users are served from the geographically nearest PoP, reducing latency from potentially hundreds of milliseconds to single-digit milliseconds for cached content.\n\n**CDN Request Flow:**\n1. User's browser resolves `cdn.example.com` via DNS\n2. CDN's DNS returns the IP of the nearest edge server (using Anycast or geolocation)\n3. Browser requests content from edge server\n4. Cache HIT: edge serves directly (ultra-fast)\n5. Cache MISS: edge fetches from origin, caches, serves to user (first visitor slow, all subsequent fast)\n\n**Pull CDN (most common):**\nContent is lazily pulled from origin on first cache miss. You configure your CDN with the origin URL. When a user requests an asset, if it's not cached, the CDN fetches from origin and caches it for subsequent requests.\n\n**Pros:** Zero setup — just point CDN at origin. Self-managing.\n**Cons:** First visitor after TTL expiry experiences origin latency. High traffic assets may hit origin repeatedly if not cached on all edge nodes.\n\n**Push CDN:**\nYou proactively upload content to the CDN before any user requests it. You control exactly what's on every edge node.\n\n**Pros:** No cold-start latency. Full control over content on CDN.\n**Cons:** Manual management — you must push updates. Storage costs on CDN proportional to content size. Best for content with predictable access patterns (game assets, large software downloads).\n\n**Cache-Control headers:**\n`Cache-Control: public, max-age=86400` — cache for 1 day\n`Cache-Control: no-cache` — revalidate with origin on every request\n`ETag: abc123` — revalidate efficiently using conditional GET\n\n**CDN beyond static assets:** Modern CDNs run serverless functions at the edge (Cloudflare Workers, Lambda@Edge) for dynamic logic with minimal latency.",
      explanation:
        "CDN: Anycast DNS routes to nearest PoP. Pull: lazy cache on miss (self-managing). Push: pre-loaded (predictable access). Use Cache-Control headers to control TTL. Modern CDNs run edge functions.",
    },
    {
      id: "sd-st4",
      question: "How would you design media upload and storage for a platform like YouTube or Instagram?",
      answer:
        "**Requirements:** Users upload videos/images. Content is processed (transcoded, resized). Content is served at scale globally with low latency.\n\n**Upload flow:**\n\n**Step 1 — Pre-signed URL:**\nClient requests an upload URL from the API server. API server generates a pre-signed S3 URL (valid for 15 min) and returns it. Client uploads directly to S3 — the file never touches your API servers. This avoids your servers becoming an I/O bottleneck for large files.\n\n**Step 2 — Upload completion event:**\nS3 emits an event (`ObjectCreated`) to a message queue (SQS or Kafka) when upload completes. This triggers the media processing pipeline.\n\n**Step 3 — Transcoding / Processing:**\n- **Video:** FFmpeg transcodes to multiple resolutions (1080p, 720p, 480p, 360p) and formats (MP4/H.264, WebM/VP9). Adaptive Bitrate Streaming (HLS, MPEG-DASH) — player selects quality based on network speed.\n- **Image:** Resize to multiple dimensions (thumbnail, medium, large), convert to WebP for smaller file size, strip EXIF metadata\n- Processing runs on worker servers consuming from the queue. Scale workers independently based on queue depth.\n\n**Step 4 — Storage:**\n- Original upload: S3 (Glacier for long-term archival)\n- Processed variants: S3 with intelligent tiering\n- Metadata (title, description, user_id, views): PostgreSQL\n- Processing status: Redis\n\n**Step 5 — Delivery via CDN:**\nProcessed files served from S3 via CloudFront CDN. Edge servers cache popular content globally. For video: CDN serves HLS segments from edge, player assembles them.\n\n**Handling failures:** If transcoding fails, message goes to dead letter queue, alert fires, and original file is preserved for retry.",
      explanation:
        "Media upload: pre-signed S3 URL (client uploads direct). S3 event → processing queue → FFmpeg transcoding workers. Multiple resolutions → CDN delivery. Never route uploads through app servers.",
      diagram: {
        type: "flow",
        title: "Media Upload & Processing Pipeline",
        direction: "vertical",
        data: [
          { label: "Client uploads via\npre-signed S3 URL", color: "primary" },
          { label: "S3 ObjectCreated\nevent → Kafka/SQS", color: "warning" },
          { label: "Transcoding Workers\n(FFmpeg — multiple resolutions)", color: "accent" },
          { label: "Processed variants\nstored in S3", color: "info" },
          { label: "Served via CDN\n(CloudFront edge nodes)", color: "success" },
        ],
      },
    },
  ],
};

// ─────────────────────────────────────────────
// TOPIC 8 — SECURITY & AUTHENTICATION
// ─────────────────────────────────────────────
const securityTopic: SystemDesignTopic = {
  id: "security",
  title: "Security & Authentication",
  icon: "🔐",
  questions: [
    {
      id: "sd-sec1",
      question: "Session-based vs Token-based authentication — what's the difference?",
      answer:
        "Authentication is the process of verifying who a user is. The two main approaches for web applications are sessions and tokens.\n\n**Session-based authentication (stateful):**\n1. User logs in with credentials\n2. Server validates, creates a session record in a session store (database or Redis)\n3. Server returns a session ID (opaque random string) in a cookie\n4. On every request, browser sends the cookie\n5. Server looks up the session ID in the store to get user info\n6. Logout: server deletes the session record\n\n**Pros:** Easy to invalidate (delete session). No sensitive data on client.\n**Cons:** Session store is a shared dependency — all servers must access it. Scales horizontally only with a shared Redis or sticky sessions.\n\n**Token-based authentication (stateless):**\n1. User logs in\n2. Server creates and signs a JWT token containing user claims\n3. Server returns the token (usually stored in memory or localStorage)\n4. On every request, client sends token in `Authorization: Bearer <token>` header\n5. Server validates the signature — no database lookup needed\n6. Logout: token is valid until it expires (client discards token, but server can't invalidate it)\n\n**Pros:** Stateless — any server can validate without shared store. Perfect for horizontal scaling and microservices.\n**Cons:** Can't easily invalidate a token before expiry. Token size larger than session cookie. Sensitive data visible if not encrypted.\n\n**Hybrid approach:** Short-lived JWT (15 min) + long-lived refresh token (stored in HttpOnly cookie, stored in DB). Logout = delete refresh token from DB. Balances statelessness with invalidation capability.",
      explanation:
        "Sessions: server stores state, easy to invalidate. Tokens (JWT): stateless, any server validates, hard to invalidate early. Hybrid: short JWT + long refresh token in DB = best of both.",
    },
    {
      id: "sd-sec2",
      question: "What is OAuth2 and how does the Authorization Code flow work?",
      answer:
        "OAuth2 is an authorization framework that allows a user to grant a third-party application limited access to their resources on another service, without sharing their credentials.\n\n**Real example:** You use 'Sign in with Google' on a new app. The app never sees your Google password — it only receives a token that allows it to read your name and email from Google.\n\n**Key roles:**\n- **Resource Owner:** The user (you)\n- **Client:** The application wanting access (the new app)\n- **Authorization Server:** Issues tokens (Google's OAuth2 server)\n- **Resource Server:** Holds the protected resource (Google APIs)\n\n**Authorization Code Flow (most secure, for server-side apps):**\n1. User clicks 'Sign in with Google'\n2. Client redirects user to Google's authorization endpoint with `client_id`, `redirect_uri`, `scope`, and a random `state` parameter\n3. User logs into Google (if not already) and consents to the requested permissions\n4. Google redirects back to `redirect_uri` with an `authorization_code` and the `state` parameter\n5. Client verifies `state` (prevents CSRF), then exchanges `authorization_code` + `client_secret` for `access_token` and `refresh_token` — this exchange happens server-to-server, never in the browser\n6. Client uses `access_token` to call Google APIs on behalf of the user\n7. When `access_token` expires, use `refresh_token` to get a new one\n\n**PKCE (Proof Key for Code Exchange):** Extension for public clients (mobile apps, SPAs) that can't safely store a `client_secret`. Adds a `code_verifier` and `code_challenge` to prevent authorization code interception attacks.",
      explanation:
        "OAuth2: user grants app limited access without sharing credentials. Authorization Code flow: redirect → consent → code → exchange for token (server-to-server). Use PKCE for mobile/SPA clients.",
      diagram: {
        type: "flow",
        title: "OAuth2 Authorization Code Flow",
        direction: "vertical",
        data: [
          { label: "1. User clicks\n'Sign in with Google'", color: "primary" },
          { label: "2. Redirect to Google\nauthorization endpoint", color: "info" },
          { label: "3. User logs in & consents\nat Google", color: "accent" },
          { label: "4. Google redirects back\nwith authorization_code", color: "warning" },
          { label: "5. Server exchanges code\nfor access_token (server-to-server)", color: "success" },
          { label: "6. Access token used\nto call protected APIs", color: "primary" },
        ],
      },
    },
    {
      id: "sd-sec3",
      question: "How does JWT work? What's inside a token?",
      answer:
        "A JSON Web Token (JWT) is a self-contained, signed token that carries user claims (data about the user). The receiver can verify the token's authenticity and read its contents without querying a database.\n\n**JWT structure — three Base64URL-encoded parts separated by dots:**\n`header.payload.signature`\n\n**Header:** Metadata about the token — type and signing algorithm\n```json\n{ \"alg\": \"RS256\", \"typ\": \"JWT\" }\n```\n\n**Payload:** Claims — user data and token metadata\n```json\n{\n  \"sub\": \"user_123\",\n  \"email\": \"user@example.com\",\n  \"roles\": [\"admin\"],\n  \"iat\": 1723000000,\n  \"exp\": 1723003600\n}\n```\nStandard claims: `sub` (subject/user ID), `iat` (issued at), `exp` (expiry), `iss` (issuer), `aud` (audience)\n\n**Signature:** Cryptographic proof that the token hasn't been tampered with\n```\nRS256_sign(base64(header) + '.' + base64(payload), private_key)\n```\nVerifier uses the public key to verify the signature. Only the auth server with the private key can create valid tokens.\n\n**Important:** JWT payload is Base64URL encoded, NOT encrypted. Anyone can decode and read it. Never put sensitive data (passwords, PII) in JWT payload. Use JWE (JSON Web Encryption) if you need payload encryption.\n\n**Algorithm choice:** Prefer RS256 (asymmetric — private key signs, public key verifies). Avoid HS256 (symmetric — same secret for signing and verifying) in distributed systems — all services need the secret.\n\n**JWT security pitfalls:**\n- `alg: none` attack: some libraries accepted unsigned tokens — always validate the algorithm\n- Short expiry: use 15-minute access tokens. Long-lived tokens are dangerous if leaked.\n- Never store in localStorage (XSS vulnerable). Use HttpOnly cookies or in-memory only.",
      explanation:
        "JWT: header.payload.signature. Payload carries user claims, readable by anyone. Signature proves authenticity. RS256 for distributed systems. Short expiry. Never store sensitive data in payload.",
      diagram: {
        type: "layers",
        title: "JWT Structure",
        data: [
          {
            label: "Header — Algorithm & Type",
            color: "info",
            children: [
              {
                label: "Payload — Claims (user data, expiry, issuer)",
                color: "primary",
                children: [
                  {
                    label: "Signature — Cryptographic proof (private key signed)",
                    color: "success",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "sd-sec4",
      question: "What is HTTPS and TLS? How does the TLS handshake work?",
      answer:
        "HTTPS is HTTP over TLS (Transport Layer Security). TLS provides three guarantees: **encryption** (data private in transit), **authentication** (server is who it claims to be), and **integrity** (data wasn't tampered with).\n\n**TLS Handshake (simplified TLS 1.3):**\n\n**1. Client Hello:** Client sends: TLS version, supported cipher suites, a random value (client_random).\n\n**2. Server Hello:** Server selects cipher suite, sends: server certificate (contains public key, signed by a Certificate Authority), server_random.\n\n**3. Certificate verification:** Client verifies the server's certificate is signed by a trusted CA (stored in OS/browser). This proves the server is authentic and not a man-in-the-middle.\n\n**4. Key exchange:** Using the server's public key and Diffie-Hellman parameters, both sides independently derive the same symmetric session key. The private key never travels over the network.\n\n**5. Finished:** Both sides confirm they've derived the same key. All subsequent data is encrypted with the symmetric session key (much faster than asymmetric).\n\n**Certificate Authorities (CA):** Trusted third parties (DigiCert, Let's Encrypt) that sign server certificates. Browser trusts CAs → trusts certificates signed by them. Let's Encrypt provides free automated certificates — no excuse for plain HTTP.\n\n**Perfect Forward Secrecy (PFS):** TLS 1.3 requires ephemeral key exchange — a new session key is generated per connection. If the server's private key is compromised in the future, past sessions can't be decrypted.\n\n**HSTS (HTTP Strict Transport Security):** Response header telling browsers to only connect via HTTPS for the next N seconds, even if user types `http://`. Prevents downgrade attacks.",
      explanation:
        "TLS: encryption + authentication + integrity. Handshake: exchange random values → verify certificate → derive session key via Diffie-Hellman. TLS 1.3 with PFS: each session key is unique.",
    },
    {
      id: "sd-sec5",
      question: "What is API security — rate limiting, input validation, and common vulnerabilities?",
      answer:
        "Building a secure API requires defense in depth — multiple layers of protection, because any single layer can be bypassed.\n\n**Authentication & Authorization:**\n- Authentication: prove who you are (JWT, OAuth2, API keys)\n- Authorization: prove you're allowed to do this (RBAC, ABAC)\n- Always check authorization on every request — don't assume authenticated = authorized\n- Broken Object Level Authorization (BOLA/IDOR): the #1 API vulnerability. `GET /orders/12345` — does the authenticated user own order 12345? Always check ownership.\n\n**Input validation:**\n- Validate all inputs server-side (client-side is UX, server-side is security)\n- Type check, length limits, format validation (email regex, UUID format)\n- Never trust user input in SQL queries — use parameterized queries (prevents SQL injection)\n- Escape user input in HTML responses — prevents XSS\n- Validate content-type headers — don't process JSON as XML or vice versa\n\n**Rate limiting (anti-abuse):**\n- Per-IP rate limiting: prevent brute-force and DDoS\n- Per-user rate limiting: prevent API abuse from authenticated users\n- Per-endpoint rate limiting: sensitive endpoints (login, password reset) get stricter limits\n\n**Common API vulnerabilities (OWASP API Top 10):**\n- **Broken Object Level Authorization:** Access other users' data via ID manipulation\n- **Broken Authentication:** Weak JWT, no expiry, secrets in URLs\n- **Excessive Data Exposure:** Returning full objects when only some fields needed\n- **Mass Assignment:** Accepting all fields in request body including privileged ones (`isAdmin: true`)\n- **Security Misconfiguration:** Debug endpoints in production, permissive CORS (`*`), stack traces exposed\n\n**HTTPS everywhere, HSTS, CORS properly configured, secrets in environment variables (not code).**",
      explanation:
        "API security: always verify authorization per request (BOLA is #1 vuln). Parameterized queries prevent SQL injection. Rate limit per IP + user. Validate all input server-side. HTTPS everywhere.",
    },
    {
      id: "sd-sec6",
      question: "What is CORS and how does it work?",
      answer:
        "CORS (Cross-Origin Resource Sharing) is a browser security mechanism that controls which cross-origin HTTP requests are allowed. It's a browser policy — it doesn't apply to server-to-server communication.\n\n**The Same-Origin Policy:** Browsers block JavaScript from making requests to a different origin (protocol + domain + port) than the page's origin. This prevents malicious sites from using a logged-in user's cookies to make requests to other sites on their behalf (CSRF attacks).\n\n**How CORS relaxes this:**\nThe server explicitly opts in to allowing specific origins by including CORS headers in responses.\n\n**Simple requests** (GET, POST with standard headers): Browser sends request with `Origin: https://myapp.com`. Server checks if origin is allowed and responds with `Access-Control-Allow-Origin: https://myapp.com`. Browser allows JavaScript to read the response.\n\n**Preflight requests** (PUT, DELETE, custom headers): Before the actual request, browser sends an OPTIONS preflight asking 'Can I make this request?'\n```\nOPTIONS /api/data\nOrigin: https://myapp.com\nAccess-Control-Request-Method: DELETE\n```\nServer responds:\n```\nAccess-Control-Allow-Origin: https://myapp.com\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\nAccess-Control-Max-Age: 86400\n```\nIf approved, browser sends the actual request.\n\n**Security mistakes:**\n- `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` — **invalid and insecure**. Wildcard origin cannot be combined with credentials.\n- Dynamically reflecting `Origin` header back without validation — allows any origin\n- Trusting origin header for authorization — it can be spoofed in non-browser contexts",
      explanation:
        "CORS: browser blocks cross-origin requests unless server allows via headers. Preflight OPTIONS checks permission. Never use wildcard origin with credentials. Validate origin against whitelist.",
    },
  ],
};

// ─────────────────────────────────────────────
// EXPORT — All 8 Topics
// ─────────────────────────────────────────────
export const systemDesignTopics: SystemDesignTopic[] = [
  scalabilityTopic,
  databasesTopic,
  communicationTopic,
  reliabilityTopic,
  classicProblemsTopic,
  microservicesTopic,
  storageTopic,
  securityTopic,
];
