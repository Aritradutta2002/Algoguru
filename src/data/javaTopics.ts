import { Topic } from "./topics";

/* -------------------------------------------------------------------------- */
/*  Java theory is split into three categories:                              */
/*                                                                            */
/*    1. core          — language fundamentals every Java dev must know       */
/*    2. advanced      — deeper internals (JVM, concurrency, modern Java)     */
/*    3. spring-boot   — Spring / Spring Boot ecosystem                       */
/*                                                                            */
/*  Every existing topic keeps its `id` so the route table (`/:topicId`), the */
/*  search index, `javaContentMap`, and the JavaTreeBanner all keep working.  */
/*                                                                            */
/*  Theory for the new Spring Boot topics is added incrementally — each new   */
/*  subtopic ships with an entry in `springBootContent.ts` marked as a        */
/*  placeholder. Replace the placeholder `theory` array with the real writeup */
/*  when you're ready to add it.                                              */
/* -------------------------------------------------------------------------- */

export type JavaCategoryId = "core" | "advanced" | "spring-boot";

export interface JavaCategory {
  id: JavaCategoryId;
  title: string;
  subtitle: string;
  description: string;
  topics: Topic[];
}

/* ========================================================================== */
/*                              CORE JAVA                                     */
/* ========================================================================== */

const coreJavaTopics: Topic[] = [
  {
    id: "java-basics",
    category: "core",
    title: "Java Fundamentals",
    icon: "☕",
    color: "primary",
    description: "Variables, data types, operators & control flow",
    subtopics: [
      { id: "java-intro", title: "Introduction to Java" },
      { id: "java-setup", title: "JDK Setup & First Program" },
      { id: "java-variables", title: "Variables & Data Types" },
      { id: "java-operators", title: "Operators & Expressions" },
      { id: "java-control", title: "Control Flow (if/else, switch)" },
      { id: "java-loops", title: "Loops (for, while, do-while)" },
      { id: "java-arrays", title: "Arrays & Multi-dimensional Arrays" },
      { id: "java-strings", title: "Strings & String Methods" },
      { id: "java-input", title: "Scanner & User Input" },
      { id: "java-typecasting", title: "Type Casting & Conversion" },
    ],
  },
  {
    id: "java-oop",
    category: "core",
    title: "Object-Oriented Programming",
    icon: "◈",
    color: "accent",
    description: "Classes, inheritance, polymorphism & encapsulation",
    subtopics: [
      { id: "oop-classes", title: "Classes & Objects" },
      { id: "oop-constructors", title: "Constructors & this Keyword" },
      { id: "oop-encapsulation", title: "Encapsulation & Access Modifiers" },
      { id: "oop-inheritance", title: "Inheritance & super Keyword" },
      { id: "oop-polymorphism", title: "Polymorphism (Overloading/Overriding)" },
      { id: "oop-abstraction", title: "Abstract Classes & Interfaces" },
      { id: "oop-static", title: "Static Members & Methods" },
      { id: "oop-inner", title: "Inner & Anonymous Classes" },
      { id: "oop-enums", title: "Enums & Annotations" },
      { id: "oop-solid", title: "SOLID Principles" },
    ],
  },
  {
    id: "java-exceptions",
    category: "core",
    title: "Exception Handling",
    icon: "⚡",
    color: "warning",
    description: "Try-catch, custom exceptions & best practices",
    subtopics: [
      { id: "exc-intro", title: "Exception Hierarchy" },
      { id: "exc-trycatch", title: "Try-Catch-Finally" },
      { id: "exc-checked", title: "Checked vs Unchecked Exceptions" },
      { id: "exc-throw", title: "Throw & Throws" },
      { id: "exc-custom", title: "Custom Exception Classes" },
      { id: "exc-trywith", title: "Try-With-Resources" },
      { id: "exc-best", title: "Best Practices & Anti-patterns" },
    ],
  },
  {
    id: "java-collections",
    category: "core",
    title: "Collections Framework",
    icon: "▤",
    color: "success",
    description: "List, Set, Map, Queue & their implementations",
    subtopics: [
      { id: "col-intro", title: "Collections Overview & Hierarchy" },
      { id: "col-list", title: "ArrayList & LinkedList" },
      { id: "col-set", title: "HashSet, LinkedHashSet & TreeSet" },
      { id: "col-map", title: "HashMap, LinkedHashMap & TreeMap" },
      { id: "col-hashmap-internals", title: "HashMap Internals — How Hashing Works" },
      { id: "col-queue", title: "Queue, Deque & PriorityQueue" },
      { id: "col-stack", title: "Stack & ArrayDeque" },
      { id: "col-iterator", title: "Iterators & ListIterator" },
      { id: "col-comparable", title: "Comparable & Comparator" },
      { id: "col-collections", title: "Collections Utility Class" },
      { id: "col-performance", title: "Performance Comparison & When to Use What" },
      { id: "col-cp-patterns", title: "Collections in Competitive Programming" },
      { id: "col-concurrent", title: "Concurrent Collections" },
    ],
  },
  {
    id: "java-generics",
    category: "core",
    title: "Generics",
    icon: "⟨T⟩",
    color: "info",
    description: "Type parameters, bounds, wildcards & type erasure",
    subtopics: [
      { id: "gen-intro", title: "Why Generics?" },
      { id: "gen-classes", title: "Generic Classes & Interfaces" },
      { id: "gen-methods", title: "Generic Methods" },
      { id: "gen-bounded", title: "Bounded Type Parameters" },
      { id: "gen-wildcards", title: "Wildcards (?, extends, super)" },
      { id: "gen-erasure", title: "Type Erasure & Limitations" },
    ],
  },
  {
    id: "java-streams",
    category: "core",
    title: "Streams & Lambdas",
    icon: "λ",
    color: "heap",
    description: "Functional programming, Stream API & method references",
    subtopics: [
      { id: "stream-lambda", title: "Lambda Expressions" },
      { id: "stream-funcint", title: "Functional Interfaces" },
      { id: "stream-methodref", title: "Method References" },
      { id: "stream-intro", title: "Stream API Introduction" },
      { id: "stream-intermediate", title: "Intermediate Operations" },
      { id: "stream-terminal", title: "Terminal Operations" },
      { id: "stream-collectors", title: "Collectors & Grouping" },
      { id: "stream-parallel", title: "Parallel Streams" },
      { id: "stream-optional", title: "Optional Class" },
    ],
  },
  {
    id: "java-io",
    category: "core",
    title: "I/O & File Handling",
    icon: "📁",
    color: "accent",
    description: "Streams, readers, NIO, serialization & file operations",
    subtopics: [
      { id: "io-streams", title: "Byte & Character Streams" },
      { id: "io-buffered", title: "Buffered Streams" },
      { id: "io-file", title: "File & Path Operations" },
      { id: "io-nio", title: "NIO & NIO.2" },
      { id: "io-serial", title: "Serialization & Deserialization" },
      { id: "io-properties", title: "Properties & Configuration" },
    ],
  },
  {
    id: "java-jdbc",
    category: "core",
    title: "JDBC & Database",
    icon: "🗄️",
    color: "info",
    description: "Database connectivity, CRUD, transactions & DAO pattern",
    subtopics: [
      { id: "jdbc-intro", title: "JDBC Architecture & Drivers" },
      { id: "jdbc-crud", title: "CRUD Operations with JDBC" },
      { id: "jdbc-transactions", title: "Transactions & Error Handling" },
      { id: "jdbc-dao", title: "DAO Pattern & Best Practices" },
      { id: "jdbc-advanced", title: "Advanced JDBC — Metadata & Pooling" },
    ],
  },
  {
    id: "java-sql",
    category: "core",
    title: "SQL Interview Mastery",
    icon: "📊",
    color: "success",
    description: "A-Z SQL theories — joins, window functions, optimization & interview patterns",
    subtopics: [
      { id: "sql-intro", title: "SQL — Introduction & History" },
      { id: "sql-select", title: "SELECT, WHERE, ORDER BY & LIMIT" },
      { id: "sql-aggregates", title: "Aggregate Functions & GROUP BY" },
      { id: "sql-joins", title: "Joins — INNER, OUTER, CROSS, SELF" },
      { id: "sql-subqueries", title: "Subqueries — Scalar, Correlated & Derived" },
      { id: "sql-window", title: "Window Functions — ROW_NUMBER, RANK, LAG" },
      { id: "sql-cte", title: "CTEs & Recursive Queries" },
      { id: "sql-indexes", title: "Indexes — B-Tree, Hash & Covering" },
      { id: "sql-optimization", title: "Query Optimization & EXPLAIN" },
      { id: "sql-normalization", title: "Normalization — 1NF to BCNF" },
      { id: "sql-transactions", title: "Transactions, ACID & Isolation" },
      { id: "sql-constraints", title: "Constraints & Referential Integrity" },
      { id: "sql-views", title: "Views & Materialized Views" },
      { id: "sql-procedures", title: "Stored Procedures & Triggers" },
      { id: "sql-set-ops", title: "Set Operations — UNION, INTERSECT, EXCEPT" },
      { id: "sql-case-null", title: "CASE, COALESCE & NULL Handling" },
      { id: "sql-functions", title: "String, Date & Numeric Functions" },
      { id: "sql-advanced", title: "Advanced — PIVOT, LATERAL, JSON" },
      { id: "sql-interview-patterns", title: "Top Interview Patterns & Problems" },
    ],
  },
];

/* ========================================================================== */
/*                           ADVANCED JAVA                                    */
/* ========================================================================== */

const advancedJavaTopics: Topic[] = [
  {
    id: "java-multithreading",
    category: "advanced",
    title: "Multithreading & Concurrency",
    icon: "⇶",
    color: "primary",
    description: "Threads, synchronization, executors & concurrent utilities",
    subtopics: [
      { id: "mt-intro", title: "Threads & Runnable" },
      { id: "mt-lifecycle", title: "Thread Lifecycle" },
      { id: "mt-sync", title: "Synchronization & Locks" },
      { id: "mt-volatile", title: "Volatile & Atomic Variables" },
      { id: "mt-executor", title: "Executor Framework" },
      { id: "mt-callable", title: "Callable & Future" },
      { id: "mt-concurrent", title: "Concurrent Data Structures" },
      { id: "mt-completable", title: "CompletableFuture" },
      { id: "mt-forkjoin", title: "Fork/Join Framework" },
      { id: "mt-patterns", title: "Concurrency Patterns" },
    ],
  },
  {
    id: "java-advanced",
    category: "advanced",
    title: "Advanced Java",
    icon: "🔥",
    color: "warning",
    description: "Reflection, JVM internals, design patterns & more",
    subtopics: [
      { id: "adv-reflection", title: "Reflection API" },
      { id: "adv-annotations", title: "Custom Annotations" },
      { id: "adv-jvm", title: "JVM Architecture & Memory" },
      { id: "adv-gc", title: "Garbage Collection" },
      { id: "adv-classloader", title: "ClassLoader & Dynamic Loading" },
      { id: "adv-patterns", title: "Design Patterns in Java" },
      { id: "adv-records", title: "Records & Sealed Classes (Java 17+)" },
      { id: "adv-modules", title: "Java Module System (JPMS)" },
      { id: "adv-performance", title: "Performance Tuning & Profiling" },
    ],
  },
];

/* ========================================================================== */
/*                              SPRING BOOT                                   */
/* ========================================================================== */

const springBootTopics: Topic[] = [
  {
    id: "spring-core",
    category: "spring-boot",
    title: "Spring Core Fundamentals",
    icon: "🌱",
    color: "primary",
    description: "IoC, DI, bean lifecycle, scopes & the ApplicationContext",
    subtopics: [
      { id: "spring-intro", title: "Introduction to Spring Framework" },
      { id: "spring-ioc", title: "Inversion of Control (IoC) Container" },
      { id: "spring-di", title: "Dependency Injection — Constructor, Setter, Field" },
      { id: "spring-bean-lifecycle", title: "Bean Lifecycle" },
      { id: "spring-bean-scopes", title: "Bean Scopes — Singleton, Prototype, Request, Session" },
      { id: "spring-autowiring", title: "Autowiring Modes" },
      { id: "spring-java-config", title: "Java-based Configuration (@Configuration, @Bean)" },
      { id: "spring-annotation-config", title: "Annotation-based Configuration" },
      { id: "spring-component-scan", title: "Component Scanning" },
      { id: "spring-profiles", title: "Profiles & Environment Abstraction" },
      { id: "spring-value", title: "@Value & Property Sources" },
      { id: "spring-context-vs-factory", title: "ApplicationContext vs BeanFactory" },
      { id: "spring-postprocessor", title: "BeanPostProcessor & BeanFactoryPostProcessor" },
      { id: "spring-spel", title: "SpEL — Spring Expression Language" },
    ],
  },
  {
    id: "spring-boot-basics",
    category: "spring-boot",
    title: "Spring Boot Basics",
    icon: "🚀",
    color: "accent",
    description: "Auto-configuration, starters, profiles & the Spring Boot CLI",
    subtopics: [
      { id: "sb-intro", title: "What is Spring Boot?" },
      { id: "sb-vs-spring", title: "Spring Boot vs Spring Framework" },
      { id: "sb-autoconfig", title: "Auto-Configuration Internals" },
      { id: "sb-springbootapp", title: "@SpringBootApplication Deep Dive" },
      { id: "sb-starters", title: "Spring Boot Starters" },
      { id: "sb-config-files", title: "application.properties vs application.yml" },
      { id: "sb-externalized", title: "Externalized Configuration" },
      { id: "sb-configuration-props", title: "@ConfigurationProperties" },
      { id: "sb-profiles", title: "Profiles in Spring Boot" },
      { id: "sb-logging", title: "Logging — Logback, Log4j2" },
      { id: "sb-build-run", title: "Building & Running (Maven, Gradle)" },
      { id: "sb-devtools", title: "Spring Boot DevTools" },
      { id: "sb-cli", title: "Spring Boot CLI" },
    ],
  },
  {
    id: "spring-boot-rest",
    category: "spring-boot",
    title: "REST APIs with Spring Boot",
    icon: "🌐",
    color: "info",
    description: "Controllers, validation, exception handling, OpenAPI & versioning",
    subtopics: [
      { id: "rest-controller", title: "@RestController & @RequestMapping" },
      { id: "rest-http-methods", title: "HTTP Methods — GET, POST, PUT, DELETE, PATCH" },
      { id: "rest-path-query", title: "Path Variables & Query Parameters" },
      { id: "rest-request-body", title: "@RequestBody & @ResponseBody" },
      { id: "rest-response-entity", title: "ResponseEntity & HttpStatus" },
      { id: "rest-exception", title: "Exception Handling — @ControllerAdvice" },
      { id: "rest-validation", title: "Bean Validation (@Valid, @NotNull, @Size)" },
      { id: "rest-content-negotiation", title: "Content Negotiation" },
      { id: "rest-hateoas", title: "HATEOAS" },
      { id: "rest-versioning", title: "API Versioning Strategies" },
      { id: "rest-openapi", title: "OpenAPI / Swagger Integration" },
      { id: "rest-cors", title: "CORS Configuration" },
      { id: "rest-file-upload", title: "File Upload & Download" },
      { id: "rest-async", title: "Async REST Endpoints" },
    ],
  },
  {
    id: "spring-data-jpa",
    category: "spring-boot",
    title: "Spring Data JPA",
    icon: "💾",
    color: "success",
    description: "Entities, relationships, repositories, transactions & migrations",
    subtopics: [
      { id: "jpa-intro", title: "JPA & Hibernate Overview" },
      { id: "jpa-entity-mapping", title: "Entity Mapping (@Entity, @Id, @GeneratedValue)" },
      { id: "jpa-column-mapping", title: "Column Mapping & Lifecycle Annotations" },
      { id: "jpa-relationships", title: "Relationships — @OneToOne, @OneToMany, @ManyToOne, @ManyToMany" },
      { id: "jpa-cascade", title: "Cascade Types" },
      { id: "jpa-fetch", title: "Fetch Types — LAZY vs EAGER" },
      { id: "jpa-repository", title: "Repository Hierarchy (CrudRepository, JpaRepository)" },
      { id: "jpa-derived-queries", title: "Derived Query Methods" },
      { id: "jpa-query-annotation", title: "@Query Annotation" },
      { id: "jpa-native-queries", title: "Native & Named Queries" },
      { id: "jpa-pagination", title: "Pagination & Sorting" },
      { id: "jpa-transactions", title: "Transaction Management (@Transactional)" },
      { id: "jpa-n-plus-1", title: "N+1 Problem & Solutions" },
      { id: "jpa-migrations", title: "Database Migrations — Flyway, Liquibase" },
      { id: "jpa-auditing", title: "Auditing — @CreatedDate, @LastModifiedDate" },
    ],
  },
  {
    id: "spring-security",
    category: "spring-boot",
    title: "Spring Security",
    icon: "🔒",
    color: "warning",
    description: "Authentication, authorization, JWT, OAuth2 & method-level security",
    subtopics: [
      { id: "sec-intro", title: "Security Fundamentals" },
      { id: "sec-auth-vs-authz", title: "Authentication vs Authorization" },
      { id: "sec-filter-chain", title: "SecurityFilterChain" },
      { id: "sec-in-memory", title: "In-Memory Authentication" },
      { id: "sec-jdbc", title: "JDBC Authentication" },
      { id: "sec-user-details", title: "UserDetailsService & UserDetailsManager" },
      { id: "sec-password", title: "Password Encoding — BCrypt, Argon2" },
      { id: "sec-jwt", title: "JWT Authentication" },
      { id: "sec-oauth2", title: "OAuth 2.0 & OpenID Connect" },
      { id: "sec-method", title: "Method-Level Security — @PreAuthorize, @Secured" },
      { id: "sec-csrf", title: "CSRF Protection" },
      { id: "sec-cors", title: "CORS in Security" },
      { id: "sec-rbac", title: "Role-Based Access Control" },
      { id: "sec-ldap", title: "LDAP Authentication" },
    ],
  },
  {
    id: "spring-boot-testing",
    category: "spring-boot",
    title: "Spring Boot Testing",
    icon: "🧪",
    color: "heap",
    description: "JUnit 5, Mockito, slice tests, Testcontainers & coverage",
    subtopics: [
      { id: "test-intro", title: "Testing in Spring Boot" },
      { id: "test-junit5", title: "Unit Testing with JUnit 5" },
      { id: "test-mockito", title: "Mockito & Mocking" },
      { id: "test-springboottest", title: "@SpringBootTest" },
      { id: "test-webmvctest", title: "@WebMvcTest" },
      { id: "test-datajpatest", title: "@DataJpaTest" },
      { id: "test-mockbean", title: "@MockBean vs @MockitoBean" },
      { id: "test-testcontainers", title: "Testcontainers" },
      { id: "test-integration", title: "Integration Testing" },
      { id: "test-profiles", title: "Test Profiles" },
      { id: "test-coverage", title: "Code Coverage — JaCoCo" },
      { id: "test-slice", title: "Slice Annotations Overview" },
    ],
  },
  {
    id: "spring-boot-microservices",
    category: "spring-boot",
    title: "Spring Boot Microservices",
    icon: "🧩",
    color: "primary",
    description: "Service discovery, gateways, circuit breakers & event-driven flows",
    subtopics: [
      { id: "ms-intro", title: "Monolith vs Microservices" },
      { id: "ms-discovery", title: "Service Discovery — Eureka, Consul" },
      { id: "ms-gateway", title: "API Gateway — Spring Cloud Gateway" },
      { id: "ms-config", title: "Config Server" },
      { id: "ms-circuit-breaker", title: "Circuit Breaker — Resilience4j" },
      { id: "ms-communication", title: "Inter-Service Communication — REST, Feign, WebClient" },
      { id: "ms-tracing", title: "Distributed Tracing — Sleuth, Zipkin" },
      { id: "ms-logging", title: "Centralized Logging" },
      { id: "ms-saga", title: "Saga Pattern" },
      { id: "ms-event-driven", title: "Event-Driven Architecture" },
      { id: "ms-api-composition", title: "API Composition" },
      { id: "ms-service-mesh", title: "Service Mesh Overview" },
    ],
  },
  {
    id: "spring-boot-actuator",
    category: "spring-boot",
    title: "Spring Boot Actuator & Monitoring",
    icon: "📈",
    color: "info",
    description: "Endpoints, health checks, Micrometer, Prometheus & tracing",
    subtopics: [
      { id: "act-intro", title: "Introduction to Actuator" },
      { id: "act-builtin", title: "Built-in Endpoints" },
      { id: "act-custom", title: "Custom Endpoints" },
      { id: "act-health", title: "Health Checks" },
      { id: "act-metrics", title: "Metrics with Micrometer" },
      { id: "act-prometheus", title: "Prometheus Integration" },
      { id: "act-tracing", title: "Distributed Tracing — Sleuth, Zipkin" },
      { id: "act-custom-health", title: "Custom Health Indicators" },
      { id: "act-info", title: "Application Info & Git Info" },
      { id: "act-loggers", title: "Loggers Endpoint" },
      { id: "act-dumps", title: "Thread Dump & Heap Dump" },
    ],
  },
];

/* ========================================================================== */
/*                              EXPORTS                                       */
/* ========================================================================== */

/**
 * Flat list — kept for every existing consumer (AppSidebar, TopicPage, App.tsx
 * search index, JavaTreeBanner). Order matches the user-facing grouping:
 * Core Java → Advanced Java → Spring Boot.
 */
export const javaTopics: Topic[] = [
  ...coreJavaTopics,
  ...advancedJavaTopics,
  ...springBootTopics,
];

/**
 * Grouped view — for UIs that want to render Java theory as three sections
 * (Core / Advanced / Spring Boot) instead of one flat list.
 */
export const JAVA_CATEGORIES: JavaCategory[] = [
  {
    id: "core",
    title: "Core Java",
    subtitle: "Language fundamentals",
    description: "Every Java developer must know these — syntax, OOP, collections, streams, I/O, JDBC & SQL.",
    topics: coreJavaTopics,
  },
  {
    id: "advanced",
    title: "Advanced Java",
    subtitle: "Internals & deep dives",
    description: "Multithreading, JVM internals, reflection, design patterns & modern Java features.",
    topics: advancedJavaTopics,
  },
  {
    id: "spring-boot",
    title: "Spring Boot",
    subtitle: "Framework & ecosystem",
    description: "Spring Core, Boot, REST, Data JPA, Security, Testing, Microservices & Actuator — theory added one topic at a time.",
    topics: springBootTopics,
  },
];

/** Convenience: a topic's category id → the matching JavaCategory record. */
export const JAVA_CATEGORY_BY_ID: Record<JavaCategoryId, JavaCategory> =
  JAVA_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<JavaCategoryId, JavaCategory>,
  );
