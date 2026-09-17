import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Microservices — Diagram Data                                 */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springBootMicroservicesVisualizations: Record<string, Diagram> = {
  /* ─ Service Discovery ── */
  "ms-discovery": {
    type: "flow",
    title: "Eureka — Register, Heartbeat, Resolve",
    direction: "vertical",
    data: [
      {
        label: "Eureka Server (@EnableEurekaServer)",
        color: "primary",
        children: [{ label: "The registry — service name → instance addresses" }],
      },
      {
        label: "Client registers spring.application.name + host:port",
        color: "info",
        children: [{ label: "@EnableDiscoveryClient / auto-configuration" }],
      },
      {
        label: "Heartbeat every 30s",
        color: "accent",
        children: [
          { label: "lease-renewal-interval-in-seconds" },
          { label: "Missed leases evicted from the registry" },
        ],
      },
      {
        label: "Caller resolves via Spring Cloud LoadBalancer",
        color: "warning",
        children: [{ label: "Round-robin / random over healthy instances" }],
      },
      {
        label: "lb://ORDER-SERVICE — logical name, no hard-coded host",
        color: "success",
      },
    ],
  },

  /* ── API Gateway ── */
  "ms-gateway": {
    type: "layers",
    title: "Spring Cloud Gateway Route Anatomy",
    data: [
      {
        label: "Route",
        color: "primary",
        children: [
          { label: "id: orders-route" },
          { label: "uri: lb://ORDER-SERVICE" },
        ],
      },
      {
        label: "Predicates — does this route match?",
        color: "info",
        children: [
          { label: "Path=/api/orders/**" },
          { label: "Method, Header, Host, Query, Cookie, After/Before" },
        ],
      },
      {
        label: "Filters — mutate request/response",
        color: "accent",
        children: [
          { label: "StripPrefix, AddRequestHeader, RewritePath" },
          { label: "CircuitBreaker, Retry, RequestRateLimiter" },
        ],
      },
      {
        label: "Runtime — non-blocking WebFlux on Netty",
        color: "success",
        children: [
          { label: "Single entry point for all clients" },
          { label: "Cross-cutting: auth, rate limiting, CORS" },
        ],
      },
    ],
  },

  /* ── Config Server ── */
  "ms-config": {
    type: "flow",
    title: "Centralised Configuration",
    direction: "horizontal",
    data: [
      {
        label: "Git / Vault repo\napplication-prod.yml, order-service.yml",
        color: "primary",
      },
      {
        label: "Config Server\n@EnableConfigServer",
        color: "info",
        children: [{ label: "Exposes {application}/{profile}" }],
      },
      {
        label: "Client bootstrap\nspring.config.import=configserver:...",
        color: "accent",
        children: [{ label: "Fail-fast if the import is optional and missing" }],
      },
      {
        label: "@RefreshScope beans",
        color: "warning",
        children: [{ label: "POST /actuator/refresh re-binds properties" }],
      },
      {
        label: "No restart needed\n(Spring Cloud Bus broadcasts)",
        color: "success",
      },
    ],
  },

  /* ── Circuit Breaker ─ */
  "ms-circuit-breaker": {
    type: "graph",
    title: "Resilience4j Circuit Breaker States",
    data: {
      nodes: [
        { id: "closed", label: "CLOSED", x: 50, y: 10, color: "success" },
        { id: "open", label: "OPEN", x: 88, y: 55, color: "warning" },
        { id: "half", label: "HALF_OPEN", x: 12, y: 55, color: "info" },
        { id: "fallback", label: "fallbackMethod()", x: 50, y: 92, color: "primary" },
      ],
      edges: [
        { from: "closed", to: "open", weight: 50 },
        { from: "open", to: "half", weight: 60 },
        { from: "half", to: "closed" },
        { from: "half", to: "open" },
        { from: "open", to: "fallback" },
      ],
      directed: true,
      weighted: false,
      highlightPath: ["closed", "open", "fallback"],
    },
  },

  /* ── Inter-Service Communication ─ */
  "ms-communication": {
    type: "table-visual",
    title: "Choosing an HTTP Client",
    data: [
      {
        label: "OpenFeign",
        color: "primary",
        children: [
          { label: "Declarative @FeignClient(\"order-service\")" },
          { label: "Interface only — no implementation" },
          { label: "Integrates with Eureka + Resilience4j" },
        ],
      },
      {
        label: "RestClient (Spring 6.1+)",
        color: "success",
        children: [
          { label: "Modern synchronous replacement for RestTemplate" },
          { label: "Fluent API, request factories" },
        ],
      },
      {
        label: "WebClient",
        color: "info",
        children: [
          { label: "Reactive, non-blocking (WebFlux)" },
          { label: "Streaming and back-pressure" },
          { label: "Blocking .block() is a smell in reactive code" },
        ],
      },
      {
        label: "RestTemplate",
        color: "muted",
        children: [{ label: "Legacy — maintenance mode" }],
      },
    ],
  },
  /* ── Distributed Tracing ─ */
  "ms-tracing": {
    type: "flow",
    title: "One Trace ID, Many Spans",
    direction: "horizontal",
    data: [
      {
        label: "API Gateway\nspan: gw",
        color: "primary",
        children: [{ label: "traceId propagated in headers" }],
      },
      {
        label: "Order Service\nspan: order",
        color: "info",
        children: [{ label: "W3C traceparent / B3 injected" }],
      },
      {
        label: "Payment Service\nspan: pay",
        color: "accent",
        children: [{ label: "child span of order" }],
      },
      {
        label: "Zipkin / Jaeger\nwaterfall view",
        color: "success",
        children: [
          { label: "Latency per span, per service" },
          { label: "Micrometer Tracing + OpenTelemetry replaced Sleuth" },
          { label: "management.tracing.sampling.probability" },
        ],
      },
    ],
  },

  /* ── Centralized Logging ── */
  "ms-logging": {
    type: "flow",
    title: "Aggregated Structured Logs",
    direction: "vertical",
    data: [
      {
        label: "Each service logs structured JSON to stdout",
        color: "primary",
        children: [{ label: "traceId + spanId embedded in every line" }],
      },
      {
        label: "Container runtime captures stdout",
        color: "info",
        children: [{ label: "Docker / Kubernetes log driver" }],
      },
      { label: "Shipper: Filebeat / Fluentd / Promtail", color: "accent" },
      {
        label: "Store: Elasticsearch or Loki",
        color: "warning",
        children: [{ label: "Indexed by service, level, correlation id" }],
      },
      {
        label: "Kibana / Grafana dashboards",
        color: "success",
        children: [
          { label: "One query returns the whole request across services" },
          { label: "Never log secrets or PII" },
        ],
      },
    ],
  },

  /* ── Saga Pattern ─ */
  "ms-saga": {
    type: "flow",
    title: "Orchestrated Saga with Compensations",
    direction: "vertical",
    data: [
      {
        label: "Step 1 — Order Service creates the order (PENDING)",
        color: "primary",
        children: [{ label: "Local transaction 1" }],
      },
      {
        label: "Step 2 — Payment Service charges the card",
        color: "info",
        children: [{ label: "Local transaction 2" }],
      },
      {
        label: "Step 3 — Inventory Service reserves stock",
        color: "accent",
        children: [{ label: "Local transaction 3 — FAILS (out of stock)" }],
      },
      {
        label: "Compensating transactions run in reverse",
        color: "warning",
        children: [
          { label: "Refund payment (idempotent)" },
          { label: "Cancel the order" },
        ],
      },
      {
        label: "Orchestration vs Choreography",
        color: "success",
        children: [
          { label: "Orchestrator = central state machine" },
          { label: "Choreography = services react to each other's events" },
          { label: "Replaces distributed 2PC with Database-Per-Service" },
        ],
      },
    ],
  },
  /* ── Event-Driven Architecture ─ */
  "ms-event-driven": {
    type: "flow",
    title: "Kafka Topics + Transactional Outbox",
    direction: "horizontal",
    data: [
      {
        label: "Order Service\ndomain event",
        color: "primary",
        children: [
          { label: "Write order + outbox row in ONE local tx" },
          { label: "No 2PC needed" },
        ],
      },
      {
        label: "Outbox relay / CDC\npublishes to Kafka",
        color: "accent",
        children: [{ label: "At-least-once delivery" }],
      },
      {
        label: "Kafka topic\norders.created",
        color: "warning",
        children: [
          { label: "Partitioned & replayable log" },
          { label: "Ordering per partition key" },
        ],
      },
      {
        label: "Consumers react",
        color: "success",
        children: [
          { label: "Inventory · Notification · Analytics" },
          { label: "Decoupled in time, availability and throughput" },
          { label: "Idempotent consumers — duplicates expected" },
        ],
      },
    ],
  },

  /* ── API Composition ─ */
  "ms-api-composition": {
    type: "flow",
    title: "Aggregating Without a Distributed Query",
    direction: "vertical",
    data: [
      { label: "Client asks for one screen of data", color: "primary" },
      {
        label: "BFF / API Composer",
        color: "info",
        children: [
          { label: "Calls Order, Customer, Shipping" },
          { label: "In parallel: CompletableFuture.allOf / Mono.zip" },
        ],
      },
      {
        label: "Latency = slowest call, not the sum",
        color: "accent",
        children: [{ label: "Per-call timeouts + partial-failure fallbacks" }],
      },
      {
        label: "Composite DTO assembled",
        color: "success",
        children: [{ label: "Backend-For-Frontend tailors it per client form factor" }],
      },
      {
        label: "Alternative: CQRS read model",
        color: "warning",
        children: [{ label: "Materialised view avoids runtime joins entirely" }],
      },
    ],
  },

  /* ── Service Mesh ─ */
  "ms-service-mesh": {
    type: "layers",
    title: "Sidecar Proxy Offloads Networking",
    data: [
      {
        label: "Control plane",
        color: "primary",
        children: [
          { label: "Istio / Linkerd / Consul Connect" },
          { label: "Policy, certificates, traffic rules" },
        ],
      },
      {
        label: "Data plane — Envoy sidecar per pod",
        color: "info",
        children: [
          { label: "mTLS encryption without app changes" },
          { label: "Retries, timeouts, circuit breaking" },
          { label: "Golden metrics: latency, error rate, saturation" },
        ],
      },
      {
        label: "Traffic management",
        color: "accent",
        children: [
          { label: "Canary / blue-green at the network layer" },
          { label: "Traffic splitting by percentage or header" },
        ],
      },
      {
        label: "What it replaces",
        color: "success",
        children: [
          { label: "Eureka, Ribbon, Zuul — app stays business-only" },
          { label: "Cost: one more proxy per hop + a control plane to run" },
        ],
      },
    ],
  },
};