import { defineBackendChunk } from "./contract";

/**
 * Deployment, Observability & Production Troubleshooting (b217–b221).
 *
 * Maps to Chapter 10 of the master interview plan (Q196–Q200). Containerizing
 * and operating a Spring Boot service: Docker, health checks & graceful
 * shutdown, the three pillars of observability, JVM resource incidents, and
 * how to run an incident.
 */
export const chunk14Ops = defineBackendChunk({
  topic: "production-ops",
  questions: [
    {
      id: "b217",
      question: "How do you containerize a Spring Boot app well?",
      answer:
        "Goals: small, secure, fast-starting, cache-friendly images.\n\n" +
        "- **Multi-stage build** — build the jar in a JDK stage, run it on a slim **JRE** (or distroless) stage so the image doesn't ship the compiler/build tools.\n" +
        "- **Layered jars** — Spring Boot can split the jar into layers (dependencies, snapshot deps, resources, app classes). Copy dependencies (rarely change) before app code so Docker layer caching makes rebuilds fast and pushes small.\n" +
        "- **Slim base** — `eclipse-temurin:21-jre` or distroless; fewer packages = smaller attack surface.\n" +
        "- **Run as non-root**, expose the port, and set sensible JVM flags.\n" +
        "- **Container-aware JVM** — modern JVMs read cgroup limits; prefer `-XX:MaxRAMPercentage` over a fixed `-Xmx` so the heap scales with the container memory.\n\n" +
        "Alternatives to a Dockerfile: Spring Boot's `bootBuildImage` (Cloud Native Buildpacks) or Jib produce optimized, layered images without hand-writing one.",
      code: `# Multi-stage + Spring Boot layered jar for fast, cache-friendly rebuilds
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar && java -Djarmode=layertools -jar build/libs/app.jar extract

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r app && chown app /app
USER app                                  # non-root
# Copy least-changing layers first for better caching
COPY --from=build /app/dependencies/ ./
COPY --from=build /app/spring-boot-loader/ ./
COPY --from=build /app/snapshot-dependencies/ ./
COPY --from=build /app/application/ ./
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"   # scale heap to container memory
ENTRYPOINT ["sh","-c","java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]`,
      codeLanguage: "bash",
      explanation:
        "Deployment baseline — multi-stage + layered jars + slim JRE, non-root, and container-aware heap sizing via MaxRAMPercentage.",
      followUps: [
        "Why layered jars for Docker caching?",
        "Why MaxRAMPercentage over -Xmx in a container?",
        "Dockerfile vs buildpacks/Jib?",
      ],
    },
    {
      id: "b218",
      question: "How do health checks and graceful shutdown work in Kubernetes?",
      answer:
        "**Probes** let the orchestrator manage the pod:\n\n" +
        "- **Liveness** — 'is the app alive?' Failing it **restarts** the container. Keep it cheap and independent of downstreams (don't fail liveness because the DB is down, or K8s restart-loops).\n" +
        "- **Readiness** — 'can it serve traffic *now*?' Failing it removes the pod from the Service load balancer **without** killing it. Depend on critical downstreams here (DB reachable, caches warm).\n" +
        "- **Startup** — for slow starters; disables the others until the app is up.\n\n" +
        "Spring Boot Actuator exposes `/actuator/health/liveness` and `/readiness` (via `management.endpoint.health.probes.enabled`).\n\n" +
        "**Graceful shutdown** — on deploy/scale-down K8s sends **SIGTERM**, waits `terminationGracePeriodSeconds`, then SIGKILLs. Spring Boot's `server.shutdown=graceful` stops accepting new requests and lets in-flight ones finish within a timeout. Combine with readiness flipping to 'down' (so traffic drains) *before* the app stops — otherwise you drop requests mid-deploy.",
      code: `# application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
management:
  endpoint:
    health:
      probes:
        enabled: true

# Kubernetes probes (separate concerns!)
# livenessProbe:  httpGet: { path: /actuator/health/liveness,  port: 8080 }
# readinessProbe: httpGet: { path: /actuator/health/readiness, port: 8080 }
# terminationGracePeriodSeconds: 40   # > graceful shutdown timeout`,
      codeLanguage: "yaml",
      explanation:
        "Kubernetes readiness reality — liveness vs readiness (restart vs drain), startup probes, and SIGTERM graceful shutdown that drains in-flight requests.",
      followUps: [
        "Why must liveness NOT depend on the database?",
        "How do you drain traffic before shutdown?",
        "What happens after the grace period expires?",
      ],
    },
    {
      id: "b219",
      question: "Explain the three pillars of observability — logs, metrics, tracing.",
      answer:
        "Observability = understanding a system's internal state from its outputs. Three complementary pillars:\n\n" +
        "- **Logs** — discrete, timestamped events. Use **structured** (JSON) logs with a **correlation/trace id** (via MDC) so you can stitch a request across services. Great for detail/forensics; expensive at high volume, so log at the right level and sample.\n" +
        "- **Metrics** — cheap numeric time series, aggregatable, ideal for dashboards and **alerting**. The **RED** method for request-driven services: **R**ate, **E**rrors, **D**uration; **USE** (Utilization, Saturation, Errors) for resources. Micrometer exposes these to Prometheus.\n" +
        "- **Tracing** — follows one request across services as a tree of spans with timings, showing where latency goes and which hop failed. OpenTelemetry/Micrometer Tracing + a backend (Jaeger/Tempo/Zipkin).\n\n" +
        "They interlock: an alert (metric) → find the slow trace (tracing) → read the exact error (logs), all tied by the trace id. **Cardinality** is the metrics trap — never put unbounded values (user id, request id) in metric tags; put those in logs/traces.",
      code: `// Micrometer: a timer + counter on a business operation
@Timed(value = "orders.place", description = "Time to place an order")
public Order place(CreateOrder cmd) { ... }

meterRegistry.counter("orders.placed", "channel", cmd.channel()).increment(); // low-cardinality tag

// Structured logging with a trace id on every line (MDC)
MDC.put("traceId", currentTraceId());
log.info("order placed id={} amount={}", order.id(), order.amount());

# Actuator + Prometheus
# management.endpoints.web.exposure.include: health,info,prometheus,metrics`,
      codeLanguage: "java",
      explanation:
        "Observability expectation — logs (detail+traceId), metrics (RED/USE for alerting), tracing (cross-service latency), and the cardinality trap.",
      followUps: [
        "What are the RED and USE methods?",
        "Why is metric cardinality dangerous?",
        "How do the three pillars work together during an incident?",
      ],
    },
    {
      id: "b220",
      question: "How do you troubleshoot OOM, GC pressure and thread exhaustion?",
      answer:
        "**OutOfMemoryError** — first read the message: `Java heap space` (heap too small or a **leak**), `Metaspace` (classloader leak — often redeploys), `unable to create native thread` (too many threads / ulimit). For heap: enable `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...`, open the dump in **Eclipse MAT**, and use *Leak Suspects* / dominator tree to find what's retaining memory (common culprits: unbounded caches, `ThreadLocal`s in a pool, static collections, listeners). In containers, an **OOMKilled** (exit 137) means the *container* memory limit was hit — check `MaxRAMPercentage`, off-heap/native memory, and metaspace, not just heap.\n\n" +
        "**GC pressure** — high allocation rate → frequent pauses. Turn on GC logging (`-Xlog:gc*`), look at pause times/frequency and whether the live set keeps growing (leak) vs high churn (allocation). Fix allocations, size the heap, or switch collector (G1 default; ZGC for low pause).\n\n" +
        "**Thread exhaustion** — requests hang, pools full. Take a **thread dump** (`jstack`/`jcmd Thread.print`), look for many threads `BLOCKED`/`WAITING` on the same lock or on a slow downstream (missing timeout). Root cause is usually blocking IO without timeouts, an undersized/starved pool, or a deadlock.",
      code: `# Capture a heap dump on OOM automatically, analyze in Eclipse MAT
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps
jcmd <pid> GC.heap_dump /dumps/manual.hprof   # on demand

# GC behaviour
-Xlog:gc*:file=/logs/gc.log:time,uptime:filecap=5,filesize=20m

# Thread exhaustion: dump and grep for contention
jcmd <pid> Thread.print > td.txt
grep -c '"http-nio' td.txt          # how many web worker threads
grep -A3 'BLOCKED' td.txt | head    # who is blocked on what

# Container OOMKilled? exit code 137 -> raise limit or fix native/metaspace usage`,
      codeLanguage: "bash",
      explanation:
        "JVM production diagnosis — read the OOM type, heap dump + MAT for leaks, GC logs for pauses, thread dumps for pool exhaustion/deadlock.",
      followUps: [
        "OutOfMemoryError vs container OOMKilled (137)?",
        "How do you find a leak in a heap dump?",
        "What does a thread dump reveal about pool exhaustion?",
      ],
    },
    {
      id: "b221",
      question: "Walk me through how you run a production incident.",
      answer:
        "A senior answer emphasizes **restore service first, root-cause second**, with clear communication.\n\n" +
        "1. **Detect & declare** — an alert or report; declare an incident, assign an **incident commander**, open a channel. Assess severity/impact (users, revenue, data).\n" +
        "2. **Mitigate fast** — the priority is stopping the bleeding, not understanding it: **roll back** the last deploy, toggle a **feature flag**, scale out, fail over, shed load, or divert traffic. 'What changed recently?' resolves most incidents.\n" +
        "3. **Communicate** — regular, honest status updates to stakeholders/status page; keep a timeline.\n" +
        "4. **Diagnose** — once stable (or in parallel with a second responder), use logs/metrics/traces, dumps, and `EXPLAIN` to find the cause.\n" +
        "5. **Resolve & verify** — apply the real fix, confirm metrics recover, monitor for recurrence.\n" +
        "6. **Blameless post-mortem** — timeline, root cause, contributing factors, and concrete action items (better alerts, tests, guardrails, runbooks). Blameless so people surface facts, not hide them.\n\n" +
        "Key signals: calm prioritization, mitigate-before-diagnose, rollback/feature-flag instincts, and turning the incident into prevention.",
      code: `# Incident muscle-memory: mitigate first
kubectl rollout undo deployment/order-service          # roll back the bad deploy
curl -XPOST /admin/flags/new-pricing -d 'enabled=false' # kill the risky feature
kubectl scale deployment/order-service --replicas=10    # absorb load

# Then diagnose with evidence, correlated by trace id
kubectl logs -l app=order-service --since=15m | grep ERROR
# metrics: error rate, p99 latency, saturation; traces: slowest failing spans
# Afterwards: blameless post-mortem -> action items (alerts, tests, runbook)`,
      codeLanguage: "bash",
      explanation:
        "Senior production behaviour — declare/assign, mitigate (rollback/flags/scale) before diagnosing, communicate, then blameless post-mortem with actions.",
      followUps: [
        "Why mitigate before root-causing?",
        "What is the value of a blameless post-mortem?",
        "Why is 'what changed?' the first question?",
      ],
    },
  ],
  meta: {
    b217: { difficulty: "medium", priority: "high", tags: ["docker", "layered-jar", "image"], readMinutes: 4 },
    b218: { difficulty: "medium", priority: "very-high", tags: ["kubernetes", "probes", "graceful-shutdown"], readMinutes: 5 },
    b219: { difficulty: "medium", priority: "very-high", tags: ["observability", "metrics", "tracing"], readMinutes: 5 },
    b220: { difficulty: "hard", priority: "high", tags: ["oom", "gc", "thread-dump"], readMinutes: 5 },
    b221: { difficulty: "medium", priority: "very-high", tags: ["incident", "rollback", "post-mortem"], readMinutes: 5 },
  },
});
