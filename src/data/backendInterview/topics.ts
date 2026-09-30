/**
 * Ordered topic registry for the Backend / Spring Boot interview track.
 *
 * Order here is the order rendered on `/interview/java/spring-boot/questions`
 * and the order of the topic cards on the hub. Question numbers ("Question N")
 * are derived from position in the flat index, so this order is significant.
 */

export interface BackendTopicDefinition {
  /** Stable topic id; also the `topic` value used by chunk files. */
  id: string;
  /** Display title. */
  title: string;
  /** Short display title used in chips and breadcrumbs. */
  shortTitle: string;
  /** Emoji shown in topic chips. */
  icon: string;
  /** One-line description shown on the hub cards. */
  blurb: string;
  /** What an interviewer is really probing with this whole area. */
  interviewerIntent: string;
  /** Design-token colour used for the topic accent. */
  accent: string;
}

export const BACKEND_TOPICS: BackendTopicDefinition[] = [
  {
    id: "java-annotations",
    title: "Java Annotations — Theory & Internals",
    shortTitle: "Java Annotations",
    icon: "🏷️",
    blurb:
      "What an annotation really is, retention policies, targets, meta-annotations, repeatable & type annotations, and how frameworks read them at runtime.",
    interviewerIntent:
      "Can you explain the machinery that every framework you use is built on, not just the annotations you type?",
    accent: "hsl(var(--primary))",
  },
  {
    id: "spring-annotations",
    title: "Spring & Spring Boot Annotations",
    shortTitle: "Spring Annotations",
    icon: "🌱",
    blurb:
      "@Component vs @Bean, stereotypes, @Transactional proxying, @Qualifier resolution, @ConditionalOnX, config binding and the full @SpringBootApplication expansion.",
    interviewerIntent:
      "Do you know what Spring actually does when it sees each annotation, and where the proxy boundaries are?",
    accent: "hsl(var(--success))",
  },
  {
    id: "spring-boot-core",
    title: "Spring Boot Internals & Auto-Configuration",
    shortTitle: "Boot Internals",
    icon: "🚀",
    blurb:
      "Startup sequence, auto-configuration resolution, starters, profiles, property precedence, embedded servers, Actuator and graceful shutdown.",
    interviewerIntent:
      "Can you debug a Boot app that behaves differently in prod, and explain why a bean did or did not get created?",
    accent: "hsl(var(--info))",
  },
  {
    id: "collections",
    title: "Java Collections Framework",
    shortTitle: "Collections",
    icon: "📚",
    blurb:
      "The full hierarchy, List/Set/Map/Queue implementations, fail-fast vs fail-safe, comparators, immutability, and how to pick the right structure under load.",
    interviewerIntent:
      "Can you justify a data-structure choice with complexity, memory and concurrency arguments?",
    accent: "hsl(var(--warning))",
  },
  {
    id: "hashmap-internals",
    title: "HashMap — Complete Internal Working",
    shortTitle: "HashMap Internals",
    icon: "🗺️",
    blurb:
      "Buckets, hash spreading, collisions, treeification, resizing, load factor, the equals/hashCode contract, and why HashMap breaks under concurrency.",
    interviewerIntent:
      "The single most-asked deep-dive in Java interviews — they want the data structure, not the API.",
    accent: "hsl(var(--destructive))",
  },
  {
    id: "multithreading",
    title: "Multithreading & Concurrency",
    shortTitle: "Multithreading",
    icon: "🧵",
    blurb:
      "Thread lifecycle, the Java Memory Model, synchronized vs Lock, volatile, executors, CompletableFuture, atomics, deadlock and virtual threads.",
    interviewerIntent:
      "Can you reason about visibility and atomicity — not just call start() on a Thread?",
    accent: "hsl(var(--accent))",
  },
  {
    id: "spring-security",
    title: "Spring Security — Complete Theory",
    shortTitle: "Spring Security",
    icon: "🔐",
    blurb:
      "The filter chain, AuthenticationManager, providers, SecurityContextHolder, authorization, CSRF, CORS, method security and the Boot 3 lambda DSL.",
    interviewerIntent:
      "Can you draw the request path through the filter chain and say exactly where your code plugs in?",
    accent: "hsl(var(--primary))",
  },
  {
    id: "sql-jpa",
    title: "SQL, Transactions, JPA & Hibernate",
    shortTitle: "SQL & JPA",
    icon: "🗄️",
    blurb:
      "Relational fundamentals, indexes and EXPLAIN, ACID and isolation levels, locking, the JPA persistence model, N+1, fetch strategies, pagination and SQL injection.",
    interviewerIntent:
      "Can you keep data correct under concurrency and make Hibernate fast — not just write derived query methods?",
    accent: "hsl(var(--warning))",
  },
  {
    id: "http-rest",
    title: "HTTP, REST APIs & Microservices",
    shortTitle: "HTTP & REST",
    icon: "🌐",
    blurb:
      "HTTP method/status semantics, resource design, idempotency, versioning, pagination, error contracts, caching, CORS, resilience (timeouts, retries, circuit breakers) and monolith-vs-microservices trade-offs.",
    interviewerIntent:
      "Can you design a web API and reason about failure in a distributed system, not just annotate a controller?",
    accent: "hsl(var(--info))",
  },
  {
    id: "jwt",
    title: "JWT, Stateless Auth & OAuth2",
    shortTitle: "JWT & OAuth2",
    icon: "🎫",
    blurb:
      "JWS structure, signing algorithms, claims, refresh-token rotation, revocation strategies, storage, and the JWT filter you will be asked to write on a whiteboard.",
    interviewerIntent:
      "Do you understand the security trade-offs, or did you copy a tutorial filter into production?",
    accent: "hsl(var(--info))",
  },
  {
    id: "testing",
    title: "Testing, Debugging & Coding Exercises",
    shortTitle: "Testing",
    icon: "🧪",
    blurb:
      "The testing pyramid, JUnit 5 & Mockito, Spring test slices and Testcontainers, transactional-test traps, a structured production-debugging approach, and the small live-coding exercises.",
    interviewerIntent:
      "Do you write fast, trustworthy tests and debug production methodically — and can you code the classic exercises cleanly?",
    accent: "hsl(var(--success))",
  },
  {
    id: "messaging-caching",
    title: "Messaging & Caching",
    shortTitle: "Messaging & Cache",
    icon: "📨",
    blurb:
      "Queue vs topic, Kafka partitions/consumer-groups/offsets, delivery semantics and idempotency, DLQs, plus Redis data structures, cache-aside, stampede protection and distributed locks.",
    interviewerIntent:
      "Can you reason about async delivery guarantees and cache correctness — not just call send() and get()?",
    accent: "hsl(var(--accent))",
  },
  {
    id: "production-ops",
    title: "Deployment, Observability & Production Ops",
    shortTitle: "Deploy & Ops",
    icon: "📈",
    blurb:
      "Docker & layered jars, Kubernetes health probes and graceful shutdown, the three pillars of observability, JVM incident triage (OOM/GC/threads) and running an incident.",
    interviewerIntent:
      "Can you ship a service, keep it healthy, and lead the response when it breaks at 3am?",
    accent: "hsl(var(--destructive))",
  },
  {
    id: "core-java-lang",
    title: "Core Java Language & Modern Features",
    shortTitle: "Core Java Lang",
    icon: "☕",
    blurb:
      "The senior language topics: composition vs inheritance, records, Optional, pass-by-value, var, sealed classes, pattern matching, java.time, final/finally/finalize, NPE strategy, Unicode and copying.",
    interviewerIntent:
      "Do you know modern Java (17/21) idioms and the value/reference semantics behind everyday bugs?",
    accent: "hsl(var(--primary))",
  },
  {
    id: "streams-generics",
    title: "Streams & Generics — Advanced",
    shortTitle: "Streams & Generics",
    icon: "🌊",
    blurb:
      "Raw types & heap pollution, map/flatMap/filter/reduce, Collectors in practice, stream pitfalls and the streams-vs-loops trade-off.",
    interviewerIntent:
      "Can you use the functional toolkit correctly — pure pipelines, right collector, no heap pollution?",
    accent: "hsl(var(--warning))",
  },
  {
    id: "jvm",
    title: "JVM Internals & Advanced Concurrency",
    shortTitle: "JVM Internals",
    icon: "⚙️",
    blurb:
      "Livelock/starvation, structured concurrency, JVM memory areas, GC, memory leaks, container-aware sizing, performance triage, thread/heap dumps and class-loading errors.",
    interviewerIntent:
      "Can you reason about the runtime and diagnose OOM/GC/contention with the right tools?",
    accent: "hsl(var(--accent))",
  },
  {
    id: "spring-web-ops",
    title: "Spring — Web Pipeline, AOP & Operations",
    shortTitle: "Spring Web & Ops",
    icon: "🍃",
    blurb:
      "Filters vs interceptors vs AOP, logging & MDC, diagnosing startup failures and circular dependencies, Boot performance tuning, file upload/streaming and service structure.",
    interviewerIntent:
      "Do you understand the Spring request pipeline and how to operate and tune a real service?",
    accent: "hsl(var(--success))",
  },
  {
    id: "security-hardening",
    title: "Application Security Hardening",
    shortTitle: "Security Hardening",
    icon: "🛡️",
    blurb:
      "Transport security (TLS/HTTPS/mTLS), security logging & auditing, and input validation / injection / path-traversal defenses.",
    interviewerIntent:
      "Beyond auth: can you secure transport, keep a safe audit trail and defend the input boundary?",
    accent: "hsl(var(--info))",
  },
];

export const BACKEND_TOPIC_BY_ID: Record<string, BackendTopicDefinition> =
  Object.fromEntries(BACKEND_TOPICS.map((topic) => [topic.id, topic]));
