import { defineBackendChunk } from "./contract";

/**
 * Spring — Web Pipeline, AOP & Operations (b248–b254).
 *
 * Fills the Chapter 4 gaps the annotation/boot-core banks miss: the
 * filter/interceptor/AOP request pipeline, logging & MDC, diagnosing startup
 * failures and circular dependencies, Boot performance tuning, file
 * upload/streaming, and how to structure a service.
 */
export const chunk18SpringWebOps = defineBackendChunk({
  topic: "spring-web-ops",
  questions: [
    {
      id: "b248",
      question: "Filters vs interceptors vs AOP — what are the request-pipeline extension points?",
      answer:
        "Three layers to hook cross-cutting behaviour, from outermost to innermost:\n\n" +
        "- **Servlet `Filter`** — runs in the servlet container **before** Spring MVC, wrapping the raw `HttpServletRequest`/`Response`. It sees every request (including static resources and errors), can short-circuit, and can modify the raw stream. Use for auth/security (Spring Security is a filter chain), CORS, request/response logging, compression, correlation-id setup. Ordered with `@Order`/`FilterRegistrationBean`.\n" +
        "- **`HandlerInterceptor`** — Spring MVC level, around the controller handler (`preHandle`/`postHandle`/`afterCompletion`). It knows the matched handler/`@Controller`, so it's better for MVC concerns: per-route auth checks, adding model attributes, timing a handler.\n" +
        "- **AOP (`@Aspect`)** — around **any Spring bean method** (service/repository), via proxies. Use for method-level concerns decoupled from HTTP: transactions, `@Cacheable`, custom `@Around` advice (audit, retry, metrics on a service method).\n\n" +
        "Rule of thumb: raw HTTP/security → Filter; MVC/handler-aware → Interceptor; method-level business cross-cutting → AOP.\n\n" +
        "Order matters: the servlet container runs all **filters** first (Spring Security's chain, CORS, your custom filters), then `DispatcherServlet` runs **interceptors** around the matched handler, and finally **AOP** proxies wrap the bean method calls that happen inside the controller/service. A subtle AOP gotcha is **self-invocation**: because advice lives on the proxy, one method in a bean calling another method of the *same* bean bypasses the proxy, so `@Transactional`/`@Cacheable` on the inner call won't fire — a very common bug. Interceptors also can't see anything the framework hasn't parsed yet (raw body), which is another reason security/decoding concerns belong in a filter.",
      code: `// Filter: earliest, sees raw request — set a correlation id for everything
@Component
class CorrelationIdFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws Exception {
        MDC.put("traceId", Optional.ofNullable(req.getHeader("X-Trace-Id"))
                                   .orElse(UUID.randomUUID().toString()));
        try { chain.doFilter(req, res); } finally { MDC.clear(); }
    }
}

// Interceptor: handler-aware timing
class TimingInterceptor implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest r, HttpServletResponse s, Object handler) {
        r.setAttribute("start", System.nanoTime()); return true;
    }
}

// AOP: method-level audit on any service bean
@Aspect @Component
class AuditAspect {
    @Around("@annotation(Audited)")
    Object audit(ProceedingJoinPoint pjp) throws Throwable { /* ... */ return pjp.proceed(); }
}`,
      codeLanguage: "java",
      explanation:
        "Clarifies cross-cutting extension points — Filter (raw HTTP), Interceptor (MVC handler), AOP (any bean method) and when each fits.",
      followUps: [
        "Why is Spring Security implemented as filters, not interceptors?",
        "Which runs first, a filter or an interceptor?",
        "When would you use AOP over an interceptor?",
      ],
    },
    {
      id: "b249",
      question: "How do you set up logging and MDC for correlation across a request?",
      answer:
        "Use **SLF4J** as the facade with **Logback** (Spring Boot's default) behind it — never call a logging implementation directly. Configure levels per package, structured (JSON) output in production for log aggregation, and appropriate appenders.\n\n" +
        "**MDC (Mapped Diagnostic Context)** is a per-thread key/value map Logback can inject into every log line via the pattern (`%X{traceId}`). Set a **correlation/trace id** at the edge (a filter) so *every* log line for that request carries it — essential for tracing one request across many log statements (and, propagated via headers, across services). Always **clear the MDC** in a `finally` because pooled threads are reused and would leak the previous request's id.\n\n" +
        "With Micrometer Tracing / OpenTelemetry the trace and span ids are put into MDC automatically, linking logs to distributed traces. Best practices: log at the right level (don't log-and-throw, don't log sensitive data), use parameterized logging (`log.info(\"id={}\", id)`) to avoid string building, and keep noisy libraries at WARN.",
      code: `// Set the id once at the edge; every line then includes it
MDC.put("traceId", traceId);
try {
    log.info("processing order id={}", orderId);   // parameterized, no string concat
} finally {
    MDC.remove("traceId");     // clear! pooled threads are reused
}

# logback pattern includes the MDC value on every line
# <pattern>%d %-5level [%X{traceId}] %logger{20} - %msg%n</pattern>
# application.yml
# logging.level.org.hibernate.SQL: DEBUG`,
      codeLanguage: "java",
      explanation:
        "Production observability baseline — SLF4J+Logback, MDC correlation id set at the edge and cleared in finally, parameterized logging.",
      followUps: [
        "Why must you clear the MDC in a finally?",
        "How does the trace id get into every log line?",
        "Why use parameterized logging over concatenation?",
      ],
    },
    {
      id: "b250",
      question: "How do you diagnose common Spring Boot startup failures?",
      answer:
        "Boot fails fast with (usually) a clear message; read it before anything else.\n\n" +
        "- **`NoSuchBeanDefinitionException` / 'required a bean ... that could not be found'** — a dependency isn't a bean: missing `@Component`/`@Bean`, not in a scanned package, or the wrong profile is active. Boot's failure analyzer often prints the exact action.\n" +
        "- **`NoUniqueBeanDefinitionException`** — two candidates for one injection point; fix with `@Primary` or `@Qualifier`.\n" +
        "- **Port already in use** — `Web server failed to start. Port 8080 was already in use.` — another process or a leftover instance.\n" +
        "- **Config binding errors** — a bad/absent property for `@ConfigurationProperties`, wrong type, or a missing required env var; check the active profile and property precedence.\n" +
        "- **Auto-config / datasource** — 'Failed to configure a DataSource' means no URL and no embedded DB.\n" +
        "- **Circular dependency** — see the dedicated question.\n\n" +
        "Method: read the **'APPLICATION FAILED TO START'** block and the failure analyzer's *Action*, check the active profile (`--debug` prints the auto-configuration report of what matched), and confirm the bean is scanned. Most startup issues are wiring, profile, port, or a missing property.",
      code: `# Read the failure analyzer output first:
# ***************************
# APPLICATION FAILED TO START
# ***************************
# Description:
#   Field repo in com.app.Service required a bean of type '...Repository' that could not be found.
# Action:
#   Consider defining a bean of type '...Repository' in your configuration.

# See exactly which auto-configurations matched / were excluded and why:
java -jar app.jar --debug           # prints the CONDITIONS EVALUATION REPORT
# Check the active profile (wrong profile = missing beans/props)
# spring.profiles.active=prod`,
      codeLanguage: "bash",
      explanation:
        "Practical debugging ability — read the failure analyzer's Action, check profile/port/property, and use --debug's condition report.",
      followUps: [
        "NoSuchBean vs NoUniqueBean — how do you fix each?",
        "How do you see which auto-configs were applied?",
        "How does the active profile cause missing beans?",
      ],
    },
    {
      id: "b251",
      question: "What are circular dependencies in Spring and how do you fix them?",
      answer:
        "A circular dependency is A → B → A (directly or via a chain). With **constructor injection** Spring can't build either bean first, so it fails at startup with `BeanCurrentlyInCreationException` — and since Boot 2.6, circular refs are **prohibited by default** (previously silently allowed for field injection).\n\n" +
        "A cycle is a **design smell**: two classes are too tightly coupled or a responsibility sits in the wrong place. Preferred fixes:\n\n" +
        "- **Refactor** — extract the shared logic into a third component both depend on, or merge/split responsibilities. This is the right answer.\n" +
        "- **Break the direct call** — use an **`ApplicationEvent`** (publisher/listener) so A doesn't hold a reference to B.\n\n" +
        "Workarounds (last resort, treat as tech debt): `@Lazy` on one dependency (injects a proxy, deferring resolution), setter/field injection, or `spring.main.allow-circular-references=true`. Don't reach for these first — they hide the coupling. Lead with 'I'd refactor to remove the cycle' and mention `@Lazy`/events as fallbacks.",
      code: `// Cycle: A needs B, B needs A -> BeanCurrentlyInCreationException at startup

// BEST: extract shared work into C that both use, breaking the cycle
@Service class A { A(C c) {} }
@Service class B { B(C c) {} }
@Service class C { /* the shared logic that caused the cycle */ }

// FALLBACK: @Lazy injects a proxy so construction can complete
@Service
class OrderService {
    private final BillingService billing;
    OrderService(@Lazy BillingService billing) { this.billing = billing; }
}`,
      codeLanguage: "java",
      explanation:
        "Reveals architectural awareness — a cycle is a coupling smell; fix by refactoring/events first, @Lazy/setter only as tech-debt fallbacks.",
      followUps: [
        "Why does constructor injection expose the cycle at startup?",
        "How does @Lazy break the cycle mechanically?",
        "Why did Boot 2.6 prohibit circular refs by default?",
      ],
    },
    {
      id: "b252",
      question: "How do you approach performance tuning of a Spring Boot service?",
      answer:
        "Measure first, then tune the real bottleneck — usually **I/O and the database**, not Java code.\n\n" +
        "- **Connection pool (HikariCP)** — right-size `maximum-pool-size` to the DB, watch for pool-exhaustion timeouts; a too-large pool overloads the DB.\n" +
        "- **Web server threads** — Tomcat's `server.tomcat.threads.max` bounds concurrency; blocking calls tie up a thread each. On Java 21, enabling **virtual threads** (`spring.threads.virtual.enabled=true`) lets a thread-per-request app handle far more concurrent blocking calls.\n" +
        "- **Kill N+1 and slow queries** — the biggest wins are usually fetch joins/projections, indexes, and caching (`@Cacheable`) hot reads.\n" +
        "- **Don't block request threads** — offload slow work with `@Async`/messaging; set client **timeouts** so a slow downstream doesn't pin threads.\n" +
        "- **GC & heap** — size for the workload; watch pause times.\n" +
        "- **Serialization/DTOs** — avoid over-fetching; return lean DTOs.\n\n" +
        "Use Actuator + Micrometer/JFR to find where time goes, change one thing, and re-measure. The interview signal: latency ownership with a measure-localize-verify loop, and knowing the DB/IO is the usual culprit.",
      code: `# application.yml — the levers that matter most
spring:
  datasource:
    hikari:
      maximum-pool-size: 15          # size to the DB, not to the thread count
  threads:
    virtual:
      enabled: true                  # Java 21: cheap blocking concurrency
server:
  tomcat:
    threads:
      max: 200
    connection-timeout: 3s
# Then: fix N+1 (fetch joins), add indexes, @Cacheable hot reads, set client timeouts`,
      codeLanguage: "yaml",
      explanation:
        "Production latency ownership — measure then tune the DB/IO/pool/threads bottleneck (not the code), one change at a time.",
      followUps: [
        "Why can a bigger connection pool hurt?",
        "How do virtual threads change tuning on Java 21?",
        "What's usually the real bottleneck in a CRUD service?",
      ],
    },
    {
      id: "b253",
      question: "How do you handle file upload and streaming responses without exhausting memory?",
      answer:
        "The danger is loading whole files into heap. For both directions, **stream** instead of buffering.\n\n" +
        "**Upload** — Spring receives multipart as `MultipartFile`. Don't call `getBytes()` on a large file (loads it all into memory); use `getInputStream()` and copy to disk/storage in chunks, or `transferTo(path)`. Set **limits** (`spring.servlet.multipart.max-file-size` / `max-request-size`) and validate content type/size to prevent abuse. For very large uploads, stream directly to object storage (S3) rather than through the app heap.\n\n" +
        "**Download / streaming response** — return a `StreamingResponseBody`, `ResponseEntity<Resource>` (e.g. `InputStreamResource`), or write to the `OutputStream`, so bytes flow to the client incrementally without materializing the whole payload. Set `Content-Disposition` and, where known, `Content-Length`. For generated data (CSV export of millions of rows), stream row-by-row from a DB cursor.\n\n" +
        "**Backpressure** — with blocking MVC the client's read speed naturally paces the write; just don't buffer the whole thing. WebFlux offers reactive backpressure via `Flux`.\n\n" +
        "A few more production details: raise the container/proxy limits too (Tomcat `maxSwallowSize`, and nginx `client_max_body_size` in front of the app), or a large upload is rejected before it reaches Spring. For downloads set `Content-Length` when you know it so clients can show progress and resume, and stream with a sensible buffer size rather than byte-by-byte. Where possible, hand large-object transfer to dedicated infrastructure — pre-signed S3 URLs let the client upload/download straight to object storage, keeping big payloads off your app's heap and network path entirely.",
      code: `# Limit upload sizes
spring.servlet.multipart.max-file-size: 25MB
spring.servlet.multipart.max-request-size: 25MB

// Upload: stream to storage, never getBytes() on a big file
@PostMapping("/files")
ResponseEntity<Void> upload(@RequestParam MultipartFile file) throws IOException {
    try (InputStream in = file.getInputStream()) { storage.save(in); }  // chunked
    return ResponseEntity.ok().build();
}

// Download: stream out incrementally, no full-buffer in heap
@GetMapping("/export")
ResponseEntity<StreamingResponseBody> export() {
    StreamingResponseBody body = out -> reportService.writeCsv(out); // row-by-row
    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report.csv")
            .body(body);
}`,
      codeLanguage: "java",
      explanation:
        "Practical but less universal feature — stream uploads/downloads with size limits instead of buffering whole files in heap.",
      followUps: [
        "Why avoid MultipartFile.getBytes() on large files?",
        "How does StreamingResponseBody help a big CSV export?",
        "How do you cap upload size?",
      ],
    },
    {
      id: "b254",
      question: "How do you structure a Spring Boot service's packages and layers?",
      answer:
        "Aim for clear boundaries so the code stays changeable. Two common structures:\n\n" +
        "- **Layered (technical) packaging** — `controller`, `service`, `repository`, `dto`, `entity`. Familiar, but groups by tech not by feature, so a single feature is scattered and everything tends to be `public`.\n" +
        "- **Package-by-feature / modular** — a package per domain area (`order`, `billing`, `catalog`), each containing its own controller/service/repository. Related code lives together, packages can be **package-private** (enforcing encapsulation), and it's the natural seam if you ever extract a microservice. Preferred for anything non-trivial.\n\n" +
        "**Principles regardless of layout:**\n\n" +
        "- The **service layer** holds business logic and transaction boundaries; controllers stay thin (HTTP mapping/validation); repositories only do persistence.\n" +
        "- **Don't leak entities** across the boundary — map to DTOs at the edge.\n" +
        "- Depend on **interfaces** for cross-feature calls (a `orders` module exposes an API, hides internals) — a **modular monolith** you could later split.\n" +
        "- Keep configuration and cross-cutting concerns separate.\n\n" +
        "The interview signal: you think about coupling, encapsulation and change, not just MVC folders.",
      code: `com.app
├── order/                    # package-by-feature (a bounded context)
│   ├── OrderController.java   # thin: HTTP + validation
│   ├── OrderService.java      # business logic + @Transactional boundary
│   ├── OrderRepository.java   # persistence only
│   ├── OrderApi.java          # interface other features depend on
│   └── Order.java             # entity (not exposed outside the package)
├── billing/                  # depends on order.OrderApi, NOT its internals
├── catalog/
└── common/                   # shared config, error handling, utils`,
      codeLanguage: "bash",
      explanation:
        "Feature design and maintainability — package-by-feature with thin controllers, service-owned transactions, DTOs at the edge, module APIs.",
      followUps: [
        "Package-by-layer vs package-by-feature — trade-offs?",
        "Why keep entities out of the controller layer?",
        "How does this make a future service split cheaper?",
      ],
    },
  ],
  meta: {
    b248: { difficulty: "medium", priority: "high", tags: ["filter", "interceptor", "aop"], readMinutes: 5 },
    b249: { difficulty: "medium", priority: "high", tags: ["logging", "mdc", "slf4j"], readMinutes: 4 },
    b250: { difficulty: "medium", priority: "high", tags: ["startup-failure", "beans", "debugging"], readMinutes: 5 },
    b251: { difficulty: "medium", priority: "high", tags: ["circular-dependency", "refactor", "lazy"], readMinutes: 4 },
    b252: { difficulty: "medium", priority: "high", tags: ["performance", "hikaricp", "virtual-threads"], readMinutes: 5 },
    b253: { difficulty: "medium", priority: "medium", tags: ["file-upload", "streaming", "multipart"], readMinutes: 4 },
    b254: { difficulty: "medium", priority: "high", tags: ["architecture", "package-by-feature", "layers"], readMinutes: 5 },
  },
});
