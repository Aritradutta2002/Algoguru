import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  REST APIs with Spring Boot — Diagram Data                                */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springBootRestVisualizations: Record<string, Diagram> = {
  /* ── @RestController & @RequestMapping ── */
  "rest-controller": {
    type: "flow",
    title: "DispatcherServlet Invocation Chain",
    direction: "vertical",
    data: [
      { label: "HTTP request\nGET /api/v1/courses", color: "primary" },
      {
        label: "DispatcherServlet + HandlerMapping",
        color: "info",
        children: [{ label: "@RequestMapping path + verb matched to a handler method" }],
      },
      {
        label: "HandlerAdapter invokes the method",
        color: "accent",
        children: [{ label: "Class-level prefix + method-level sub-path" }],
      },
      {
        label: "HttpMessageConverter serialises the return value",
        color: "warning",
        children: [{ label: "MappingJackson2HttpMessageConverter → JSON" }],
      },
      {
        label: "Response body written — no view resolution",
        color: "success",
        children: [{ label: "@RestController implies @ResponseBody on every method" }],
      },
    ],
  },

  /* ── HTTP Methods ── */
  "rest-http-methods": {
    type: "table-visual",
    title: "HTTP Verbs — Safety & Idempotency",
    data: [
      {
        label: "GET / HEAD / OPTIONS",
        color: "success",
        children: [{ label: "@GetMapping" }, { label: "Safe + Idempotent" }, { label: "Read only" }],
      },
      {
        label: "POST",
        color: "warning",
        children: [
          { label: "@PostMapping" },
          { label: "Not safe, NOT idempotent" },
          { label: "Creates a new resource" },
        ],
      },
      {
        label: "PUT",
        color: "info",
        children: [
          { label: "@PutMapping" },
          { label: "Idempotent" },
          { label: "Full replacement — omitted fields cleared" },
        ],
      },
      {
        label: "PATCH",
        color: "accent",
        children: [
          { label: "@PatchMapping" },
          { label: "Partial modification (delta)" },
          { label: "Unmentioned fields untouched" },
        ],
      },
      {
        label: "DELETE",
        color: "primary",
        children: [{ label: "@DeleteMapping" }, { label: "Idempotent — repeating == once" }],
      },
    ],
  },

  /* ── Path Variables & Query Parameters ── */
  "rest-path-query": {
    type: "table-visual",
    title: "@PathVariable vs @RequestParam",
    data: [
      {
        label: "@PathVariable — identify",
        color: "primary",
        children: [
          { label: "GET /products/{id}" },
          { label: "Part of the resource path" },
          { label: "Required by definition" },
        ],
      },
      {
        label: "@RequestParam — filter",
        color: "info",
        children: [
          { label: "GET /products?category=books&page=1" },
          { label: "required = true by default" },
          { label: "defaultValue avoids 400 Bad Request" },
        ],
      },
      {
        label: "Both convert types automatically",
        color: "accent",
        children: [
          { label: "Integer, Long, UUID, LocalDate, Enum" },
          { label: "@RequestParam Map<String,String> for all params" },
        ],
      },
    ],
  },

  /* ── @RequestBody & @ResponseBody ── */
  "rest-request-body": {
    type: "flow",
    title: "JSON ⇄ Java Object Conversion",
    direction: "horizontal",
    data: [
      { label: "JSON payload", color: "primary", children: [{ label: "POST /courses body" }] },
      {
        label: "HttpMessageConverter",
        color: "info",
        children: [{ label: "Jackson ObjectMapper" }],
      },
      {
        label: "@RequestBody\nCourseRequest record / DTO",
        color: "accent",
        children: [{ label: "Never bind entities → over-posting risk" }],
      },
      {
        label: "@ResponseBody\nDTO back to JSON",
        color: "success",
        children: [{ label: "@RestController adds it to every method" }],
      },
    ],
  },

  /* ── ResponseEntity & HttpStatus ── */
  "rest-response-entity": {
    type: "layers",
    title: "ResponseEntity<T> — Status + Headers + Body",
    data: [
      {
        label: "ResponseEntity builder",
        color: "primary",
        children: [
          { label: "ok(body) → 200" },
          { label: "created(uri) → 201 + Location" },
          { label: "noContent() → 204" },
        ],
      },
      {
        label: "Explicit composition",
        color: "info",
        children: [
          { label: "ResponseEntity.status(HttpStatus.CREATED).header(...).body(dto)" },
          { label: "Return raw objects only when 200 + default headers are enough" },
        ],
      },
      {
        label: "Why it matters",
        color: "success",
        children: [
          { label: "REST standards: 201 Created, Location header" },
          { label: "Custom headers, caching, ETag" },
        ],
      },
    ],
  },
  /* ── Exception Handling ── */
  "rest-exception": {
    type: "flow",
    title: "@RestControllerAdvice — One Place for Failures",
    direction: "vertical",
    data: [
      { label: "Controller / service throws", color: "warning" },
      {
        label: "DispatcherServlet → HandlerExceptionResolver chain",
        color: "info",
        children: [{ label: "ExceptionHandlerExceptionResolver first" }],
      },
      {
        label: "@RestControllerAdvice + @ExceptionHandler(OrderNotFoundException.class)",
        color: "primary",
        children: [{ label: "Centralised across all controllers" }],
      },
      {
        label: "ProblemDetail (RFC 7807)",
        color: "accent",
        children: [{ label: "type, title, status, detail, instance" }],
      },
      { label: "Structured error response\n400 / 404 / 409 / 500", color: "success" },
    ],
  },

  /* ── Bean Validation ── */
  "rest-validation": {
    type: "flow",
    title: "@Valid — Request Body Validation",
    direction: "horizontal",
    data: [
      {
        label: "spring-boot-starter-validation",
        color: "info",
        children: [{ label: "Hibernate Validator (Jakarta Bean Validation)" }],
      },
      {
        label: "@Valid @RequestBody\nCreateOrderRequest",
        color: "primary",
        children: [
          { label: "@NotBlank — null, empty, whitespace" },
          { label: "@NotNull, @Size, @Min, @Email, @Pattern" },
        ],
      },
      {
        label: "Failure → MethodArgumentNotValidException",
        color: "warning",
        children: [{ label: "FieldError list from BindingResult" }],
      },
      {
        label: "400 Bad Request\nwith field-level messages",
        color: "success",
        children: [{ label: "Mapped once in @RestControllerAdvice" }],
      },
    ],
  },

  /* ── Content Negotiation ── */
  "rest-content-negotiation": {
    type: "table-visual",
    title: "Content Negotiation — Accept & Content-Type",
    data: [
      {
        label: "Request headers",
        color: "info",
        children: [
          { label: "Accept: application/json | application/xml" },
          { label: "Content-Type: what the client sent" },
        ],
      },
      {
        label: "Server-side declaration",
        color: "primary",
        children: [
          { label: "consumes = MediaType.APPLICATION_JSON_VALUE" },
          { label: "produces = APPLICATION_JSON_VALUE" },
        ],
      },
      {
        label: "Converters do the work",
        color: "accent",
        children: [
          { label: "Jackson for JSON" },
          { label: "jackson-dataformat-xml for XML" },
        ],
      },
      {
        label: "Mismatch status codes",
        color: "warning",
        children: [
          { label: "415 Unsupported Media Type (request)" },
          { label: "406 Not Acceptable (response)" },
        ],
      },
    ],
  },

  /* ── HATEOAS ── */
  "rest-hateoas": {
    type: "layers",
    title: "Richardson Maturity Model — HATEOAS Is Level 3",
    data: [
      {
        label: "Level 0 — one endpoint, one verb",
        color: "muted",
        children: [{ label: "Plain RPC over HTTP" }],
      },
      {
        label: "Level 1 — resources",
        color: "info",
        children: [{ label: "Many URIs, one verb" }],
      },
      {
        label: "Level 2 — HTTP verbs + status codes",
        color: "primary",
        children: [{ label: "GET/POST/PUT/DELETE, 200/201/404" }],
      },
      {
        label: "Level 3 — HATEOAS / hypermedia",
        color: "success",
        children: [
          { label: "HAL: _links and _embedded" },
          { label: "WebMvcLinkBuilder.linkTo(methodOn(...)) — compile-safe" },
          { label: "Clients discover allowed next transitions" },
        ],
      },
    ],
  },

  /* ── API Versioning ─ */
  "rest-versioning": {
    type: "table-visual",
    title: "Four Versioning Strategies",
    data: [
      {
        label: "URI Path — /api/v1/courses",
        color: "success",
        children: [
          { label: "Industry standard" },
          { label: "Simple, cache/CDN friendly" },
          { label: "Recommended default" },
        ],
      },
      {
        label: "Request parameter — ?version=1",
        color: "info",
        children: [{ label: "@GetMapping(params = \"version=1\")" }, { label: "Invisible in the path" }],
      },
      {
        label: "Custom header — X-API-VERSION: 1",
        color: "accent",
        children: [{ label: "@GetMapping(headers = \"X-API-VERSION=1\")" }, { label: "URI stays clean" }],
      },
      {
        label: "Media type — Accept with version",
        color: "primary",
        children: [{ label: "produces = \"application/vnd...v1+json\"" }, { label: "Most RESTful, least obvious" }],
      },
    ],
  },
  /* ── OpenAPI / Swagger ── */
  "rest-openapi": {
    type: "layers",
    title: "springdoc-openapi — Live API Contract",
    data: [
      {
        label: "springdoc-openapi-starter-webmvc-ui",
        color: "primary",
        children: [
          { label: "Spring Boot 3 replacement for Springfox" },
          { label: "Scans controllers, DTOs and validation annotations" },
        ],
      },
      {
        label: "Generated artifacts",
        color: "info",
        children: [
          { label: "/v3/api-docs — raw OpenAPI JSON" },
          { label: "/swagger-ui.html — interactive try-it-out UI" },
        ],
      },
      {
        label: "Customisation",
        color: "accent",
        children: [
          { label: "OpenAPI bean — contact, license, servers" },
          { label: "JWT SecurityScheme for authorised calls" },
          { label: "@Operation / @Schema for descriptions" },
        ],
      },
    ],
  },

  /* ── CORS ── */
  "rest-cors": {
    type: "flow",
    title: "CORS Preflight Dance",
    direction: "horizontal",
    data: [
      {
        label: "Cross-origin fetch\nfrom browser",
        color: "primary",
        children: [{ label: "Origin: https://app.example.com" }],
      },
      {
        label: "Preflight OPTIONS\n+ Access-Control-Request-*",
        color: "warning",
        children: [{ label: "Browser-enforced, not server-enforced" }],
      },
      {
        label: "Server answers\nAccess-Control-Allow-Origin/Methods",
        color: "info",
        children: [{ label: "WebMvcConfigurer.addCorsMappings(...)" }],
      },
      {
        label: "Real request proceeds",
        color: "success",
        children: [{ label: "cURL / Postman bypass CORS entirely" }],
      },
    ],
  },

  /* ── File Upload & Download ── */
  "rest-file-upload": {
    type: "flow",
    title: "Multipart Upload & Streaming Download",
    direction: "vertical",
    data: [
      {
        label: "Upload: multipart/form-data → MultipartFile",
        color: "primary",
        children: [
          { label: "spring.servlet.multipart.max-file-size" },
          { label: "max-request-size caps the whole request" },
        ],
      },
      {
        label: "Validate type, size, name",
        color: "warning",
        children: [{ label: "Never trust the client-supplied filename" }],
      },
      {
        label: "Persist — disk, object storage, DB",
        color: "info",
      },
      {
        label: "Download: Resource or StreamingResponseBody",
        color: "accent",
        children: [{ label: "Streams without loading into heap" }],
      },
      {
        label: "Content-Disposition: attachment; filename=...",
        color: "success",
        children: [{ label: "Triggers the browser save dialog" }],
      },
    ],
  },

  /* ── Async REST ── */
  "rest-async": {
    type: "table-visual",
    title: "Async Endpoint Options",
    data: [
      {
        label: "Callable<T> / DeferredResult<T>",
        color: "info",
        children: [{ label: "Servlet async — container thread released" }, { label: "Response written later" }],
      },
      {
        label: "CompletableFuture<T>",
        color: "primary",
        children: [
          { label: "Runs on a separate executor" },
          { label: "@EnableAsync + configured ThreadPoolTaskExecutor" },
        ],
      },
      {
        label: "SseEmitter",
        color: "accent",
        children: [{ label: "Server-Sent Events stream" }, { label: "One-way server → client push" }],
      },
      {
        label: "Virtual threads (Java 21)",
        color: "success",
        children: [
          { label: "spring.threads.virtual.enabled=true" },
          { label: "Massive concurrency, blocking style code" },
        ],
      },
    ],
  },
};
