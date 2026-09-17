import { ContentSection } from "./recursionContent";
import { attachDiagrams } from "./diagramAttach";
import { springBootActuatorVisualizations } from "./springBootActuatorVisualizations";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Actuator & Monitoring — Complete In-Depth Theory              */
/*  Covers Production-Ready Endpoints, Health Checks, Micrometer Metrics,     */
/*  Prometheus & Grafana, Custom HealthIndicators, Dynamic Loggers, and Dumps. */
/*  Written against Spring Boot 3.x / Java 17+.                               */
/* -------------------------------------------------------------------------- */

const springBootActuatorRaw: ContentSection[] = [
  {
    id: "act-intro",
    title: "Introduction to Actuator",
    difficulty: "Easy",
    theory: [
      "In modern DevOps and SRE (Site Reliability Engineering) workflows, deploying an application to production is only the beginning. Teams need continuous visibility into whether the application is alive, how much memory it consumes, database connection pool saturation, and runtime bottlenecks.",
      "**Spring Boot Actuator** brings production-ready monitoring, auditing, and operational management features to Spring Boot applications via HTTP or JMX endpoints.",
      "To enable Actuator, add the starter dependency **`spring-boot-starter-actuator`**.",
      "**Security Best Practices by Default**:",
      "By default, out of security caution, Spring Boot exposes **only `/actuator/health`** over HTTP. All other sensitive diagnostic endpoints (like `/actuator/env`, `/actuator/beans`, and `/actuator/loggers`) are restricted until explicitly enabled in `application.properties`.",
      "To expose endpoints over HTTP, configure:",
      "`management.endpoints.web.exposure.include=health,info,metrics,prometheus`.",
      "In production, never expose `*` unless all actuator endpoints are locked down behind administrative role-based authentication in Spring Security."
    ],
    keyPoints: [
      "Actuator provides production-grade monitoring, health checks, and metrics.",
      "Requires `spring-boot-starter-actuator` dependency.",
      "Only `/actuator/health` is exposed over HTTP by default for security.",
      "Expose endpoints selectively via `management.endpoints.web.exposure.include`."
    ],
    code: [
      {
        title: "Enabling Actuator and Exposing Endpoints",
        language: "yaml",
        content: `# pom.xml:
# <dependency>
#     <groupId>org.springframework.boot</groupId>
#     <artifactId>spring-boot-starter-actuator</artifactId>
# </dependency>

# application.yml:
management:
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: "health,info,metrics,prometheus,loggers"
  endpoint:
    health:
      show-details: always # Shows database, disk, and custom health components`
      }
    ],
    warning: "Never expose `/actuator/env` or `/actuator/heapdump` publicly without strict authentication. Exposing `/actuator/env` can leak database credentials, secret keys, and environment variables."
  },
  {
    id: "act-builtin",
    title: "Built-in Endpoints",
    difficulty: "Medium",
    theory: [
      "Spring Boot Actuator ships with a comprehensive set of built-in endpoints for inspecting every aspect of the running JVM and application context.",
      "**Key Built-in Endpoints**:",
      "1. **`/actuator/health`**: Shows application health status (`UP`, `DOWN`, `OUT_OF_SERVICE`). Used by Kubernetes liveness and readiness probes.",
      "2. **`/actuator/info`**: Displays arbitrary application information (build timestamp, git commit hash, version).",
      "3. **`/actuator/metrics`**: Exposes multidimensional performance metrics (JVM memory, GC pauses, HTTP request counts/latencies, CPU usage, HikariCP connection pool states).",
      "4. **`/actuator/loggers`**: Inspects and **mutates log levels at runtime** without restarting the application.",
      "5. **`/actuator/beans`**: Displays a complete topological registry of all beans in the `ApplicationContext`.",
      "6. **`/actuator/env`**: Inspects all active Spring `Environment` property sources and configuration values.",
      "7. **`/actuator/mappings`**: Displays all `@RequestMapping` paths, HTTP methods, and controller handler methods.",
      "8. **`/actuator/threaddump`**: Generates a live JVM thread dump to inspect thread states, locks, and deadlocks.",
      "9. **`/actuator/heapdump`**: Downloads a GZip-compressed HPROF heap dump file for memory leak analysis in Eclipse MAT.",
      "10. **`/actuator/prometheus`**: Exposes metrics in standard Prometheus exposition text format for automated scraping."
    ],
    keyPoints: [
      "`/health` tracks status; `/info` displays build/git version metadata.",
      "`/metrics` provides detailed performance counters and timers.",
      "`/loggers` allows changing log levels at runtime via HTTP POST.",
      "`/threaddump` and `/heapdump` provide deep JVM diagnostics for troubleshooting."
    ],
    code: [
      {
        title: "Actuator Health and Metrics Sample Outputs",
        language: "json",
        content: `// GET /actuator/health
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": { "database": "PostgreSQL", "validationQuery": "isValid()" }
    },
    "diskSpace": {
      "status": "UP",
      "details": { "total": 499963174912, "free": 214748364800, "threshold": 10485760 }
    },
    "ping": { "status": "UP" }
  }
}`
      }
    ],
    tip: "You can change the Actuator base path from `/actuator` to something else (e.g. `management.endpoints.web.base-path=/management`) or bind Actuator to an entirely separate management port via `management.server.port=9090`."
  },
  {
    id: "act-custom",
    title: "Custom Endpoints",
    difficulty: "Hard",
    theory: [
      "In addition to built-in endpoints, developers can implement custom management endpoints to expose proprietary operational workflows (e.g. flushing a custom in-memory cache, toggling a feature flag, or querying background worker queue depths).",
      "**Custom Endpoint Annotations (`org.springframework.boot.actuate.endpoint.annotation`)**:",
      "1. **`@Endpoint(id = \"cacheManager\")`**: Marks a class as an Actuator endpoint accessible over both JMX and HTTP (at `/actuator/cacheManager`). Use `@WebEndpoint` to restrict strictly to HTTP.",
      "2. **`@ReadOperation`**: Mapped to **HTTP `GET`**. Returns operational status or data.",
      "3. **`@WriteOperation`**: Mapped to **HTTP `POST`**. Accepts payload parameters to execute an action.",
      "4. **`@DeleteOperation`**: Mapped to **HTTP `DELETE`**. Purges or resets operational state.",
      "5. **`@Selector`**: Maps dynamic path variables into operation parameters (e.g. `/actuator/cacheManager/{cacheName}`)."
    ],
    keyPoints: [
      "`@Endpoint(id = \"...\")` declares a custom Actuator endpoint.",
      "`@ReadOperation` = HTTP GET; `@WriteOperation` = HTTP POST; `@DeleteOperation` = HTTP DELETE.",
      "`@Selector` binds dynamic URI path parameters.",
      "Custom endpoints must be explicitly enabled and exposed in `application.yml`."
    ],
    code: [
      {
        title: "Custom Actuator Endpoint for Cache Eviction",
        language: "java",
        content: `package com.algoguru.actuator;

import org.springframework.boot.actuate.endpoint.annotation.*;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Endpoint(id = "cacheManager") // Exposed at /actuator/cacheManager
public class CacheManagementEndpoint {

    private final Map<String, Integer> cacheStats = new ConcurrentHashMap<>();

    // GET /actuator/cacheManager
    @ReadOperation
    public Map<String, Object> getAllCacheStats() {
        return Map.of("activeCaches", cacheStats.keySet(), "totalEntries", cacheStats.size());
    }

    // GET /actuator/cacheManager/{cacheName}
    @ReadOperation
    public String getCacheDetails(@Selector String cacheName) {
        return "Cache: " + cacheName + " has " + cacheStats.getOrDefault(cacheName, 0) + " items";
    }

    // POST /actuator/cacheManager
    @WriteOperation
    public String clearCache(String cacheName) {
        cacheStats.remove(cacheName);
        return "Cache " + cacheName + " cleared successfully";
    }
}`
      }
    ],
    warning: "Ensure any `@WriteOperation` modifying production state requires administrative authorization."
  },
  {
    id: "act-health",
    title: "Health Checks",
    difficulty: "Medium",
    theory: [
      "The **`/actuator/health`** endpoint provides the health status of the application. It aggregates health data from all registered `HealthIndicator` beans into a single overall status:",
      "- **`UP`**: Everything is healthy and operational.",
      "- **`DOWN`**: A critical dependency (e.g. primary database) has failed. The endpoint returns **HTTP `503 Service Unavailable`**.",
      "- **`OUT_OF_SERVICE`**: The service is alive but temporarily not accepting traffic.",
      "- **`UNKNOWN`**: Health cannot be determined.",
      "**Kubernetes Probes Integration**:",
      "Spring Boot automatically provides dedicated endpoints for Kubernetes container lifecycle probes:",
      "1. **Liveness Probe (`/actuator/health/liveness`)**: Indicates whether the application container is running normally. If this fails, Kubernetes immediately restarts the container.",
      "2. **Readiness Probe (`/actuator/health/readiness`)**: Indicates whether the application is ready to accept live traffic (e.g. database connections established, cache warmed up). If this fails, Kubernetes removes the pod from the Service load balancer until it recovers.",
      "Enable probe support via `management.endpoint.health.probes.enabled=true`."
    ],
    keyPoints: [
      "`/actuator/health` aggregates all subsystem health checks into an overall status.",
      "Returns HTTP 200 for `UP`, and HTTP 503 for `DOWN`.",
      "Natively provides `/actuator/health/liveness` and `/actuator/health/readiness` for Kubernetes.",
      "Configure `management.endpoint.health.show-details=always` to view individual component health."
    ],
    code: [
      {
        title: "Kubernetes Liveness and Readiness Probe Configuration",
        language: "yaml",
        content: `management:
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true # Enables /liveness and /readiness groups

# Kubernetes Pod Spec:
# livenessProbe:
#   httpGet:
#     path: /actuator/health/liveness
#     port: 8080
#   initialDelaySeconds: 15
# readinessProbe:
#   httpGet:
#     path: /actuator/health/readiness
#     port: 8080
#   initialDelaySeconds: 10`
      }
    ],
    tip: "Never perform heavy database queries or external network calls in a Liveness probe. A temporary network hiccup could cause Kubernetes to enter a cascading restart loop."
  },
  {
    id: "act-metrics",
    title: "Metrics with Micrometer",
    difficulty: "Medium",
    theory: [
      "**Micrometer** is the metrics collection facade for Java, functioning for metrics much like SLF4J functions for logging. Spring Boot Actuator uses Micrometer directly to instrument your application.",
      "Micrometer provides a vendor-neutral dimensional metrics API and supports exporting metrics to Prometheus, Datadog, InfluxDB, New Relic, Graphite, and CloudWatch.",
      "**Core Meter Types**:",
      "1. **`Counter`**: A monotonically increasing metric tracking total occurrences (e.g. total user logins, total orders placed). Never decreases.",
      "2. **`Timer`**: Measures both short latencies and request throughput (e.g. HTTP request durations, payment processing time). Automatically generates percentiles (p50, p95, p99).",
      "3. **`Gauge`**: Measures an instantaneous value that can go up and down (e.g. current active WebSocket sessions, thread pool size, queue depth).",
      "4. **`DistributionSummary`**: Measures distribution of events without time units (e.g. payload sizes in bytes).",
      "Metrics can be tagged with dimensions (e.g. `order.placed, tags: [status=success, region=us-east]`), allowing multidimensional querying and filtering in Grafana."
    ],
    keyPoints: [
      "Micrometer is the dimensional metrics facade for Java (the SLF4J of metrics).",
      "Four core meters: Counter, Timer, Gauge, DistributionSummary.",
      "Supports multidimensional tags for granular filtering in monitoring dashboards.",
      "Inject `MeterRegistry` to record custom business metrics."
    ],
    code: [
      {
        title: "Recording Custom Business Metrics using MeterRegistry",
        language: "java",
        content: `package com.algoguru.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

@Service
public class OrderProcessingService {

    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderProcessingService(MeterRegistry registry) {
        // Dimensional Counter with tags
        this.orderCounter = Counter.builder("algoguru.orders.count")
            .description("Total number of successfully placed orders")
            .tag("channel", "web")
            .register(registry);

        // Latency Timer
        this.orderTimer = Timer.builder("algoguru.orders.latency")
            .description("Time taken to process orders")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
    }

    public void placeOrder(String orderId, double amount) {
        orderTimer.record(() -> {
            // Business logic...
            orderCounter.increment();
        });
    }
}`
      }
    ],
    tip: "Use `@Timed(\"metric.name\")` on controller or service methods to automatically measure execution durations with Micrometer."
  },
  {
    id: "act-prometheus",
    title: "Prometheus Integration",
    difficulty: "Medium",
    theory: [
      "**Prometheus** is the open-source industry standard for cloud-native metrics collection and alerting. It uses a **pull-based (scraping) model**, periodically querying HTTP endpoints to gather metrics.",
      "**Integrating Prometheus in Spring Boot**:",
      "1. Add the dependency **`micrometer-registry-prometheus`**.",
      "2. Expose the prometheus endpoint in `application.yml`: `management.endpoints.web.exposure.include=prometheus`.",
      "3. Actuator immediately exposes **`/actuator/prometheus`**, which formats all internal JVM, HikariCP, Tomcat, and custom Micrometer metrics into Prometheus line-protocol format.",
      "4. Configure your Prometheus server `prometheus.yml` to scrape this endpoint every 15 seconds.",
      "5. Connect Prometheus to **Grafana** to visualize real-time dashboards (e.g. the popular JVM Micrometer Grafana Dashboard ID: 4701)."
    ],
    keyPoints: [
      "Prometheus collects metrics using a periodic HTTP pull/scrape model.",
      "Add `micrometer-registry-prometheus` to format metrics into Prometheus exposition format.",
      "Exposed at `/actuator/prometheus`.",
      "Visualized in Grafana for real-time alerting and monitoring."
    ],
    code: [
      {
        title: "Prometheus Dependency and Scrape Configuration",
        language: "yaml",
        content: `# pom.xml:
# <dependency>
#     <groupId>io.micrometer</groupId>
#     <artifactId>micrometer-registry-prometheus</artifactId>
# </dependency>

# prometheus.yml (Prometheus server scraping config):
scrape_configs:
  - job_name: 'algoguru-backend'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 15s
    static_configs:
      - targets: ['host.docker.internal:8080']`
      }
    ],
    tip: "Use Prometheus Alertmanager to define alerting rules based on metric thresholds (e.g. alert if HTTP 5xx error rate exceeds 2% over 5 minutes)."
  },
  {
    id: "act-tracing",
    title: "Distributed Tracing — Sleuth, Zipkin",
    difficulty: "Hard",
    theory: [
      "As discussed in Microservices, distributed tracing correlates log records and traces request journeys across distributed services.",
      "In Spring Boot 3 Actuator, **Micrometer Tracing** is integrated directly into the Actuator metrics ecosystem.",
      "Actuator automatically tags every HTTP request metric in `/actuator/metrics/http.server.requests` with the active `traceId` and `spanId` when tracing is active.",
      "Enabling Actuator tracing observation:",
      "Configure `management.tracing.sampling.probability=1.0` to capture all traces (or lower, e.g. `0.1` for 10% sampling in high-throughput production to conserve storage).",
      "Traces are streamed to OpenTelemetry / Zipkin collectors, allowing SRE teams to drill directly from a Grafana metric spike into the corresponding Zipkin trace waterfall."
    ],
    keyPoints: [
      "Actuator integrates Micrometer Tracing directly into metrics and logging.",
      "Exemplars correlate Prometheus metric histograms directly to Zipkin traces.",
      "Configure `management.tracing.sampling.probability` to control sampling rates.",
      "Provides seamless navigation from Grafana metric alerts to Zipkin trace waterfalls."
    ],
    code: [
      {
        title: "Actuator Tracing Configuration in application.yml",
        language: "yaml",
        content: `management:
  tracing:
    sampling:
      probability: 1.0 # Sample 100% of requests in staging/dev
  zipkin:
    tracing:
      endpoint: http://zipkin:9411/api/v2/spans`
      }
    ],
    tip: "In production with millions of requests per hour, set `sampling.probability: 0.05` (5%) to capture representative performance distributions without saturating Zipkin storage."
  },
  {
    id: "act-custom-health",
    title: "Custom Health Indicators",
    difficulty: "Medium",
    theory: [
      "While Spring Boot automatically registers health indicators for common libraries (DataSource, Redis, DiskSpace, RabbitMQ), real-world systems often depend on third-party APIs, external payment gateways, or custom hardware.",
      "You can implement a custom health check by creating a Spring bean that implements the **`HealthIndicator`** interface.",
      "The `health()` method returns a **`Health`** object constructed via its fluent builder:",
      "- `Health.up().withDetail(\"latencyMs\", 15).build()`",
      "- `Health.down(exception).withDetail(\"error\", \"Timeout reaching gateway\").build()`",
      "If any non-optional `HealthIndicator` reports `DOWN`, the overall `/actuator/health` status flips to `DOWN` and HTTP responses return `503 Service Unavailable`."
    ],
    keyPoints: [
      "Implement `HealthIndicator` interface to create custom health checks.",
      "Use `Health.up()` or `Health.down()` fluent builder methods.",
      "Attach custom diagnostic details via `.withDetail(key, value)`.",
      "Any `DOWN` component flips overall status to `DOWN` (HTTP 503)."
    ],
    code: [
      {
        title: "Custom HealthIndicator for External Payment Gateway",
        language: "java",
        content: `package com.algoguru.actuator;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.net.HttpURLConnection;
import java.net.URL;

@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            long start = System.currentTimeMillis();
            URL url = new URL("https://payment.external.com/health");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.connect();
            long latency = System.currentTimeMillis() - start;

            if (conn.getResponseCode() == 200) {
                return Health.up()
                    .withDetail("gateway", "Stripe API")
                    .withDetail("latencyMs", latency)
                    .build();
            } else {
                return Health.down()
                    .withDetail("httpCode", conn.getResponseCode())
                    .build();
            }
        } catch (Exception ex) {
            return Health.down(ex)
                .withDetail("error", "Unable to contact Payment Gateway")
                .build();
        }
    }
}`
      }
    ],
    warning: "Keep health check logic lightweight and always configure strict socket connection timeouts (e.g. 2 seconds) to avoid hanging the health endpoint."
  },
  {
    id: "act-info",
    title: "Application Info & Git Info",
    difficulty: "Easy",
    theory: [
      "The **`/actuator/info`** endpoint provides descriptive metadata about the running application, such as build version, environment, Java version, and git commit details.",
      "**Populating Info**:",
      "1. **Static Properties**: Add keys under `info.*` in `application.yml` (e.g. `info.app.name=AlgoGuru`, `info.app.version=2.4.0`).",
      "2. **Maven Build Properties**: Enabling `build-info` in `spring-boot-maven-plugin` generates `META-INF/build-info.properties`, which Actuator reads to display build time, version, and artifact name.",
      "3. **Git Commit Info**: Adding the **`git-commit-id-maven-plugin`** creates a `git.properties` file at compile time. Actuator reads this to display git commit hash, branch name, commit message, and commit timestamp in `/actuator/info`.",
      "4. **Custom `InfoContributor`**: Implement the `InfoContributor` interface to inject dynamic information programmatically."
    ],
    keyPoints: [
      "`/actuator/info` exposes build, git, and application metadata.",
      "Static properties are defined in `application.yml` under `info.*`.",
      "Generate build details via `spring-boot-maven-plugin` `build-info` goal.",
      "Generate git commit details via `git-commit-id-maven-plugin`."
    ],
    code: [
      {
        title: "Generating Git and Build Info in pom.xml",
        language: "xml",
        content: `<!-- 1. Generate build-info.properties -->
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>build-info</goal>
            </goals>
        </execution>
    </executions>
</plugin>

<!-- 2. Generate git.properties with commit hash -->
<plugin>
    <groupId>io.github.git-commit-id</groupId>
    <artifactId>git-commit-id-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>revision</goal>
            </goals>
        </execution>
    </executions>
</plugin>`
      }
    ],
    tip: "In production incidents, `/actuator/info` allows engineers to immediately verify whether a server is running the expected git commit hash."
  },
  {
    id: "act-loggers",
    title: "Loggers Endpoint",
    difficulty: "Medium",
    theory: [
      "When diagnosing a production bug, you often need `DEBUG` or `TRACE` logs for a specific package (e.g. `com.algoguru.service.PaymentService`). However, in production, applications run with `INFO` or `WARN` logging to avoid disk exhaustion.",
      "Historically, enabling debug logs required modifying configuration files and restarting the server, which often made transient bugs disappear.",
      "The Actuator **`/actuator/loggers`** endpoint allows **inspecting and modifying log levels at runtime on a live running application without restarting**.",
      "**How to Use**:",
      "1. Inspect active level: `GET /actuator/loggers/com.algoguru`.",
      "2. Change log level to DEBUG: `POST /actuator/loggers/com.algoguru` with JSON `{\"configuredLevel\": \"DEBUG\"}`.",
      "3. Reset back to default: `POST /actuator/loggers/com.algoguru` with `{\"configuredLevel\": null}`."
    ],
    keyPoints: [
      "Allows changing log levels dynamically at runtime without restarting the application.",
      "Query current log levels via HTTP GET `/actuator/loggers/{name}`.",
      "Mutate log levels via HTTP POST with `{\"configuredLevel\": \"DEBUG\"}`.",
      "Revert to inherited default by sending `{\"configuredLevel\": null}`."
    ],
    code: [
      {
        title: "Changing Log Level at Runtime via cURL",
        language: "bash",
        content: `# 1. Query current logging level for our package:
curl -X GET http://localhost:8080/actuator/loggers/com.algoguru

# 2. Dynamically turn on DEBUG logging:
curl -X POST http://localhost:8080/actuator/loggers/com.algoguru \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel": "DEBUG"}'

# 3. Reset back to root inherited level when debugging is finished:
curl -X POST http://localhost:8080/actuator/loggers/com.algoguru \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel": null}'`
      }
    ],
    warning: "Always remember to reset log levels back to INFO or WARN after troubleshooting, otherwise high-frequency DEBUG logging can rapidly fill up server disk space."
  },
  {
    id: "act-dumps",
    title: "Thread Dump & Heap Dump",
    difficulty: "Hard",
    theory: [
      "When production applications experience high CPU utilization, thread deadlocks, or `OutOfMemoryError` heap leaks, standard logs fail to provide answers. Actuator provides deep JVM inspection endpoints:",
      "**1. Thread Dump (`/actuator/threaddump`)**:",
      "Returns a snapshot of all active Java threads in the JVM. For every thread, it reports: thread name, ID, thread state (`RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`), lock information, and full execution stack traces.",
      "Crucial for identifying **Deadlocks** (threads waiting on locks held by each other) and thread starvation.",
      "**2. Heap Dump (`/actuator/heapdump`)**:",
      "Triggers the JVM to generate and download a binary HPROF file (`heapdump.hprof.gz`).",
      "Contains every object currently living on the Java heap, their sizes, references, and GC roots.",
      "Can be loaded into memory profiling tools like **Eclipse MAT (Memory Analyzer Tool)** or VisualVM to perform leak suspects analysis."
    ],
    keyPoints: [
      "`/actuator/threaddump` displays all JVM threads, states, and stack traces.",
      "Identifies deadlocks and CPU-intensive runaway loops.",
      "`/actuator/heapdump` downloads a compressed HPROF heap memory snapshot.",
      "Analyze heap dumps in Eclipse MAT or VisualVM to diagnose memory leaks."
    ],
    code: [
      {
        title: "Capturing Thread Dump and Heap Dump via HTTP",
        language: "bash",
        content: `# Download thread dump as JSON
curl -X GET http://localhost:8080/actuator/threaddump > threaddump.json

# Download compressed HPROF heap dump
curl -X GET http://localhost:8080/actuator/heapdump -o heapdump.hprof.gz

# Decompress and inspect in Eclipse MAT:
gzip -d heapdump.hprof.gz`
      }
    ],
    warning: "Triggering `/actuator/heapdump` causes a full 'Stop-the-World' garbage collection pause on the JVM while the heap is written to disk. In high-traffic production environments, temporarily pull the node out of load balancing before taking a heap dump."
  }
];

export const springBootActuatorContent: ContentSection[] = attachDiagrams(
  springBootActuatorRaw,
  springBootActuatorVisualizations,
);
