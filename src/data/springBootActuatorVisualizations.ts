import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Actuator & Monitoring — Diagram Data                         */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springBootActuatorVisualizations: Record<string, Diagram> = {
  /* ── Introduction to Actuator ── */
  "act-intro": {
    type: "flow",
    title: "Exposing Actuator Endpoints",
    direction: "vertical",
    data: [
      {
        label: "spring-boot-starter-actuator on the classpath",
        color: "primary",
        children: [{ label: "Auto-configured at startup" }],
      },
      {
        label: "Default exposure: only /actuator/health over HTTP",
        color: "warning",
        children: [{ label: "Everything else is registered but hidden" }],
      },
      {
        label: "management.endpoints.web.exposure.include",
        color: "info",
        children: [
          { label: "health,info,metrics,prometheus,loggers" },
          { label: "exclude wins over include for sensitive ones" },
        ],
      },
      {
        label: "management.endpoints.web.base-path",
        color: "accent",
        children: [{ label: "Default /actuator — move it, and secure it" }],
      },
      {
        label: "management.server.port — isolate on another port",
        color: "success",
        children: [{ label: "Keep admin traffic off the public port" }],
      },
    ],
  },

  /* ── Built-in Endpoints ── */
  "act-builtin": {
    type: "table-visual",
    title: "Built-in Endpoint Map",
    data: [
      {
        label: "/actuator/health",
        color: "success",
        children: [{ label: "Aggregated UP / DOWN" }, { label: "200 vs 503" }],
      },
      {
        label: "/actuator/info",
        color: "info",
        children: [{ label: "Build + git + app metadata" }, { label: "Driven by info.*" }],
      },
      {
        label: "/actuator/metrics",
        color: "primary",
        children: [{ label: "Counters, timers, gauges" }, { label: "Filterable by tag" }],
      },
      {
        label: "/actuator/loggers",
        color: "accent",
        children: [{ label: "GET current levels" }, { label: "POST to change at runtime" }],
      },
      {
        label: "/threaddump · /heapdump",
        color: "warning",
        children: [{ label: "JVM diagnostics" }, { label: "heapdump pauses the JVM" }],
      },
      {
        label: "/env · /configprops · /beans",
        color: "muted",
        children: [{ label: "Sensitive — sanitize or exclude in prod" }],
      },
    ],
  },

  /* ── Custom Endpoints ── */
  "act-custom": {
    type: "layers",
    title: "Custom Actuator Endpoint",
    data: [
      {
        label: "@Endpoint(id = \"features\")",
        color: "primary",
        children: [{ label: "@Component or @Bean registration" }],
      },
      {
        label: "Operation annotations",
        color: "info",
        children: [
          { label: "@ReadOperation → HTTP GET" },
          { label: "@WriteOperation → HTTP POST" },
          { label: "@DeleteOperation → HTTP DELETE" },
        ],
      },
      {
        label: "@Selector — dynamic path segment",
        color: "accent",
        children: [{ label: "/actuator/features/{name}" }],
      },
      {
        label: "Must be enabled AND exposed",
        color: "warning",
        children: [
          { label: "@Endpoint(enableByDefault = true)" },
          { label: "management.endpoint.features.enabled" },
          { label: "…endpoint.features.access — UNRESTRICTED / READ_ONLY" },
        ],
      },
    ],
  },

  /* ── Health Checks ─ */
  "act-health": {
    type: "hierarchy",
    title: "Health Aggregation",
    data: [
      {
        label: "/actuator/health — overall status",
        color: "primary",
        children: [
          {
            label: "Aggregate UP → HTTP 200",
            color: "success",
            children: [{ label: "Every component reports UP" }],
          },
          {
            label: "Any DOWN → HTTP 503",
            color: "warning",
            children: [
              { label: "db, redis, diskSpace, ping" },
              { label: "Load balancer removes the instance" },
            ],
          },
          {
            label: "Kubernetes probes",
            color: "info",
            children: [
              { label: "/health/liveness — should the pod be restarted?" },
              { label: "/health/readiness — may traffic be routed?" },
            ],
          },
        ],
      },
      {
        label: "management.endpoint.health.show-details",
        color: "accent",
        children: [
          { label: "never (default) · when-authorized · always" },
          { label: "show-components controls the component list" },
        ],
      },
    ],
  },
  /* ── Metrics with Micrometer ── */
  "act-metrics": {
    type: "table-visual",
    title: "Micrometer — SLF4J for Metrics",
    data: [
      {
        label: "Counter",
        color: "primary",
        children: [
          { label: "Monotonically increasing" },
          { label: "orders.created.total" },
          { label: "counter.increment()" },
        ],
      },
      {
        label: "Timer",
        color: "info",
        children: [
          { label: "Count + total time + max" },
          { label: "MeterRegistry.timer(\"http.server.requests\")" },
          { label: "@Timed on methods" },
        ],
      },
      {
        label: "Gauge",
        color: "accent",
        children: [
          { label: "Instantaneous value" },
          { label: "queue.size, cache.entries" },
          { label: "Holds a weak ref to the observed object" },
        ],
      },
      {
        label: "DistributionSummary",
        color: "success",
        children: [
          { label: "Size of events, not time" },
          { label: "payload bytes, batch size" },
          { label: "Percentiles / histogram buckets" },
        ],
      },
      {
        label: "Tags = dimensions",
        color: "warning",
        children: [
          { label: "registry.counter(\"orders\", \"status\", \"ok\")" },
          { label: "High-cardinality tag values are a common outage cause" },
        ],
      },
    ],
  },

  /* ── Prometheus Integration ─ */
  "act-prometheus": {
    type: "flow",
    title: "Pull-Based Metrics Pipeline",
    direction: "horizontal",
    data: [
      {
        label: "App + micrometer-registry-prometheus",
        color: "primary",
        children: [{ label: "/actuator/prometheus exposition format" }],
      },
      {
        label: "Prometheus server scrapes every 15s",
        color: "info",
        children: [{ label: "PULL model — the server controls the rate" }],
      },
      {
        label: "Time-series database\n(TSDB)",
        color: "accent",
        children: [{ label: "metric{tag=\"value\"} @ timestamp" }],
      },
      {
        label: "Grafana dashboards + Alertmanager",
        color: "success",
        children: [
          { label: "Rate, percentile, saturation panels" },
          { label: "Alerts routed to PagerDuty / Slack" },
        ],
      },
    ],
  },

  /* ── Distributed Tracing ─ */
  "act-tracing": {
    type: "flow",
    title: "Metrics ↔ Traces with Exemplars",
    data: [
      {
        label: "Micrometer Tracing in the app",
        color: "primary",
        children: [{ label: "traceId / spanId in MDC and logs" }],
      },
      {
        label: "Sampling probability",
        color: "info",
        children: [
          { label: "management.tracing.sampling.probability=0.1" },
          { label: "100% in dev, sampled in prod" },
        ],
      },
      {
        label: "Exemplars attach a traceId to a histogram bucket",
        color: "accent",
      },
      {
        label: "Grafana → Zipkin / Jaeger waterfall",
        color: "success",
        children: [
          { label: "Jump from a latency spike straight to the slow trace" },
          { label: "OpenTelemetry is the wire format" },
        ],
      },
    ],
  },

  /* ── Custom Health Indicators ─ */
  "act-custom-health": {
    type: "flow",
    title: "Custom HealthIndicator",
    direction: "vertical",
    data: [
      {
        label: "class PaymentGatewayHealthIndicator implements HealthIndicator",
        color: "info",
        children: [{ label: "Bean name determines the component key" }],
      },
      {
        label: "health() performs a cheap probe",
        color: "primary",
        children: [{ label: "No heavy query on every scrape — cache it" }],
      },
      {
        label: "Fluent result building",
        color: "accent",
        children: [
          { label: "Health.up().withDetail(\"latencyMs\", 12).build()" },
          { label: "Health.down(exception).withDetail(...)" },
          { label: "Health.status(\"DEGRADED\") for custom states" },
        ],
      },
      {
        label: "Aggregation",
        color: "warning",
        children: [
          { label: "Any DOWN component → overall DOWN (503)" },
          { label: "management.endpoint.health.group.* to customise" },
        ],
      },
      {
        label: "Guard the details",
        color: "success",
        children: [{ label: "show-details=when-authorized keeps internals private" }],
      },
    ],
  },
  /* ── Application Info & Git Info ── */
  "act-info": {
    type: "flow",
    title: "How /actuator/info Gets Populated",
    direction: "vertical",
    data: [
      {
        label: "Static values: info.* in application.yml",
        color: "info",
        children: [{ label: "info.app.name, info.app.description" }],
      },
      {
        label: "spring-boot-maven-plugin build-info goal",
        color: "primary",
        children: [
          { label: "Generates META-INF/build-info.properties" },
          { label: "info.build.version / time / artifact" },
        ],
      },
      {
        label: "git-commit-id-maven-plugin",
        color: "accent",
        children: [
          { label: "Generates git.properties" },
          { label: "commit id, branch, tags, dirty flag" },
          { label: "management.info.git.mode=full|simple" },
        ],
      },
      {
        label: "Why it matters in production",
        color: "success",
        children: [
          { label: "Confirm exactly which build is running" },
          { label: "Correlate a deploy with a regression" },
        ],
      },
    ],
  },

  /* ── Loggers Endpoint ─ */
  "act-loggers": {
    type: "flow",
    title: "Runtime Log Level Control",
    direction: "horizontal",
    data: [
      {
        label: "GET /actuator/loggers",
        color: "info",
        children: [{ label: "All configured + effective levels" }],
      },
      {
        label: "GET /actuator/loggers/com.shop.order",
        color: "primary",
        children: [{ label: "configuredLevel + effectiveLevel" }],
      },
      {
        label: "POST {\"configuredLevel\":\"DEBUG\"}",
        color: "accent",
        children: [{ label: "Applies instantly, no restart" }],
      },
      {
        label: "POST {\"configuredLevel\":null}",
        color: "warning",
        children: [{ label: "Revert to the inherited level" }],
      },
      {
        label: "Temporary by default",
        color: "success",
        children: [
          { label: "Lost on restart unless persisted" },
          { label: "Secure it — DEBUG logs leak PII" },
        ],
      },
    ],
  },

  /* ── Thread Dump & Heap Dump ─ */
  "act-dumps": {
    type: "table-visual",
    title: "Thread Dump vs Heap Dump",
    data: [
      {
        label: "/actuator/threaddump",
        color: "info",
        children: [
          { label: "All threads, states, stack traces" },
          { label: "Cheap — safe on a live node" },
          { label: "Finds deadlocks & runaway loops" },
        ],
      },
      {
        label: "/actuator/heapdump",
        color: "warning",
        children: [
          { label: "Compressed HPROF snapshot" },
          { label: "Triggers a Stop-the-World GC pause" },
          { label: "Remove the node from the load balancer first" },
        ],
      },
      {
        label: "Analysis tools",
        color: "accent",
        children: [
          { label: "Eclipse MAT — dominator tree, leak suspects" },
          { label: "VisualVM / JProfiler" },
          { label: "jstack / jmap equivalents" },
        ],
      },
      {
        label: "Diagnose",
        color: "success",
        children: [
          { label: "Memory leaks, unbounded caches" },
          { label: "Thread pool exhaustion" },
          { label: "Locks held during I/O" },
        ],
      },
    ],
  },
};