import { defineBackendChunk } from "./contract";

/**
 * HTTP, REST APIs & Microservices (b169–b193).
 *
 * Maps to Chapter 6 of the master interview plan (Q136–Q160). Web-facing API
 * design and distributed-systems judgement for the 3–4 year backend engineer:
 * HTTP semantics, resource modelling, idempotency, resilience, and the
 * monolith-vs-microservices trade-offs.
 */
export const chunk11HttpRest = defineBackendChunk({
  topic: "http-rest",
  questions: [
    {
      id: "b169",
      question: "Explain the HTTP methods and their semantics — safe vs idempotent.",
      answer:
        "Each method carries a contract clients and proxies rely on:\n\n" +
        "- **GET** — read a resource. **Safe** (no side effects) and **idempotent**. Cacheable. No body.\n" +
        "- **HEAD** — like GET but headers only.\n" +
        "- **POST** — create/append or 'process this'. **Neither safe nor idempotent** — two POSTs may create two resources.\n" +
        "- **PUT** — replace a resource at a known URI. **Idempotent** — repeating it yields the same state.\n" +
        "- **PATCH** — partial update. **Not guaranteed idempotent** (depends on the patch semantics).\n" +
        "- **DELETE** — remove. **Idempotent** — deleting twice leaves it deleted (second call may 404).\n" +
        "- **OPTIONS** — capabilities / CORS preflight.\n\n" +
        "**Safe** = no observable state change (the server may still log). **Idempotent** = the same request repeated has the same effect as once. This matters because networks retry: a client/proxy/load balancer may safely re-send GET/PUT/DELETE but must **not** blindly retry POST. Design mutations so retries are safe (idempotency keys) rather than assuming the network won't duplicate them.",
      code: `@RestController
@RequestMapping("/api/orders")
class OrderController {

    @GetMapping("/{id}")                     // safe + idempotent, cacheable
    Order get(@PathVariable long id) { ... }

    @PostMapping                             // NOT idempotent: creates a new order
    ResponseEntity<Order> create(@RequestBody CreateOrder cmd) {
        Order o = service.create(cmd);
        return ResponseEntity.created(URI.create("/api/orders/" + o.id())).body(o);
    }

    @PutMapping("/{id}")                      // idempotent: full replace
    Order replace(@PathVariable long id, @RequestBody Order body) { ... }

    @DeleteMapping("/{id}")                   // idempotent: gone stays gone
    ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}`,
      codeLanguage: "java",
      explanation:
        "API fundamentals — mapping each method to safe/idempotent so clients, proxies and load balancers can retry correctly.",
      followUps: [
        "Why can a proxy retry GET but not POST?",
        "Is PATCH idempotent? When?",
        "Why does DELETE twice sometimes return 404?",
      ],
    },
    {
      id: "b170",
      question: "How do you choose the right HTTP status code?",
      answer:
        "Status codes are the API's primary signal — pick the most specific one.\n\n" +
        "**2xx success:**\n\n" +
        "- `200 OK` — general success with a body.\n" +
        "- `201 Created` — a resource was created; return a `Location` header.\n" +
        "- `202 Accepted` — accepted for async processing, not done yet.\n" +
        "- `204 No Content` — success, empty body (e.g. DELETE, PUT with no return).\n\n" +
        "**3xx** — `301`/`308` permanent, `302`/`307` temporary redirect; `304 Not Modified` for conditional GETs.\n\n" +
        "**4xx client errors** (the caller must change something):\n\n" +
        "- `400 Bad Request` — malformed syntax/JSON.\n" +
        "- `401 Unauthorized` — not authenticated.\n" +
        "- `403 Forbidden` — authenticated but not allowed.\n" +
        "- `404 Not Found` — resource doesn't exist.\n" +
        "- `409 Conflict` — state conflict (duplicate, version mismatch).\n" +
        "- `422 Unprocessable Entity` — syntactically valid but fails business/validation rules.\n" +
        "- `429 Too Many Requests` — rate limited (send `Retry-After`).\n\n" +
        "**5xx server errors** — `500` unexpected, `502/503/504` upstream/unavailable/timeout. Never return `200` with an error body — clients and monitoring rely on the code.",
      code: `// 400 vs 422: malformed JSON vs valid-but-invalid business data
@PostMapping("/api/transfers")
ResponseEntity<?> transfer(@Valid @RequestBody TransferRequest req) {
    if (!accounts.exists(req.from())) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();      // 404
    }
    if (balance(req.from()).compareTo(req.amount()) < 0) {
        return ResponseEntity.unprocessableEntity()                     // 422
                .body(new ProblemDetail("Insufficient funds"));
    }
    var t = service.transfer(req);
    return ResponseEntity.created(URI.create("/api/transfers/" + t.id())).body(t); // 201
}`,
      codeLanguage: "java",
      explanation:
        "Clear API communication — 201 vs 200 vs 204, 401 vs 403, and 400 vs 422; never a 200 with an error payload.",
      followUps: [
        "401 vs 403 — what's the difference?",
        "When 400 vs 422?",
        "What must accompany a 429 or a 201?",
      ],
    },
    {
      id: "b171",
      question: "How do you design REST resources — and what makes an API 'RESTful'?",
      answer:
        "Model **resources (nouns)**, not actions. URIs identify things; HTTP methods are the verbs.\n\n" +
        "- Collections and items: `/customers`, `/customers/42`, `/customers/42/orders`.\n" +
        "- Use **plural nouns**, lowercase, hyphens; no verbs in the path (`/getCustomer` is RPC, not REST).\n" +
        "- Nest for ownership one level deep; beyond that, prefer top-level resources with filters (`/orders?customerId=42`).\n" +
        "- Represent state changes as sub-resources or fields, not verbs: `POST /orders/42/cancellation` or `PATCH /orders/42 {status:'CANCELLED'}` rather than `/orders/42/cancel`.\n\n" +
        "**Richardson Maturity Model:** L0 single endpoint (RPC) → L1 resources → L2 HTTP verbs + status codes (where most 'REST' APIs live and that's fine) → L3 HATEOAS (hypermedia links). Real actions that don't map cleanly to CRUD (search, calculations, workflows) are acceptable as controller-style sub-resources — pragmatism over purity. Consistency (naming, error shape, pagination) matters more than dogma.\n\n" +
        "A useful design test is that the URI names *what* the thing is while the method (and status code) says *what happens to it*, so the same path supports multiple verbs. Keep identifiers stable and opaque (prefer surrogate ids or UUIDs over anything that encodes business meaning that might change), and don't leak implementation details like table names or `.json` suffixes into paths — use content negotiation for representation. When you genuinely need a non-CRUD operation, isolating it as a clearly named sub-resource keeps the rest of the API predictable, and documenting one canonical convention for naming, pluralization, pagination and errors is what actually makes an API pleasant for the teams that consume it.",
      code: `GET    /api/customers                 # list (with ?page= &status= filters)
POST   /api/customers                 # create
GET    /api/customers/42              # read one
PUT    /api/customers/42             # replace
PATCH  /api/customers/42             # partial update
DELETE /api/customers/42             # delete
GET    /api/customers/42/orders      # sub-collection (ownership)

# State transition modelled as a resource, not a verb in the path
POST   /api/orders/99/refunds         # create a refund on the order
# avoid: POST /api/orders/99/refund   (RPC-ish verb)`,
      codeLanguage: "bash",
      explanation:
        "API modelling skill — noun-based resources, methods as verbs, sensible nesting, and knowing where the Richardson maturity model matters.",
      followUps: [
        "How would you model 'cancel order' RESTfully?",
        "When is deep nesting a mistake?",
        "Do you need HATEOAS in practice?",
      ],
    },
    {
      id: "b172",
      question: "What is idempotency and how do you build retry-safe endpoints?",
      answer:
        "A distributed client can't tell 'request lost' from 'response lost', so it **retries** — and a naive `POST /payments` could charge twice. Idempotency means a repeated request has the **same effect as one**.\n\n" +
        "**GET/PUT/DELETE** are idempotent by design. The problem is **POST/create** and side-effecting operations. The standard pattern is an **idempotency key**:\n\n" +
        "1. Client generates a unique key (UUID) per logical operation and sends it in an `Idempotency-Key` header.\n" +
        "2. Server stores `key -> result` (in a table/Redis) inside the same transaction.\n" +
        "3. On a first request, do the work and save the response under the key.\n" +
        "4. On a retry with the same key, **return the stored response** without repeating the side effect.\n\n" +
        "Use a `UNIQUE` constraint on the key so concurrent duplicates collide at the DB rather than both executing. Give keys a TTL. This is exactly how Stripe/PayPal-style APIs make payments safe.\n\n" +
        "A robust implementation records the key in a `PENDING` state before doing the work and flips it to `COMPLETED` with the stored response afterwards, all in one transaction; that way a second request arriving while the first is still running can be told to wait or retry rather than double-executing. Decide how strict to be about the request body: many APIs also hash the payload against the key so that reusing a key with *different* content is rejected as a client error rather than silently returning the old result. Note the distinction from ordinary HTTP idempotency — GET/PUT/DELETE are idempotent because repeating them converges on the same state, whereas POST needs this explicit key mechanism because each call would otherwise create a new side effect.",
      code: `@PostMapping("/api/payments")
@Transactional
ResponseEntity<Payment> pay(@RequestHeader("Idempotency-Key") String key,
                            @RequestBody PayRequest req) {
    // UNIQUE(key): a concurrent duplicate throws instead of double-charging
    var existing = idempotencyRepo.findByKey(key);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get().response());   // replay result
    }
    Payment p = paymentService.charge(req);                    // the side effect
    idempotencyRepo.save(new IdempotencyRecord(key, p));       // same tx
    return ResponseEntity.status(HttpStatus.CREATED).body(p);
}`,
      codeLanguage: "java",
      explanation:
        "Critical for reliable distributed APIs — idempotency keys + a unique constraint make retried POSTs safe against double side effects.",
      followUps: [
        "Why store the key in the same transaction as the work?",
        "How do you handle two concurrent requests with the same key?",
        "What TTL do you give idempotency keys?",
      ],
    },
    {
      id: "b173",
      question: "PUT vs PATCH vs POST — when do you use each?",
      answer:
        "- **POST** — create a resource (server assigns the URI) or trigger a process. Not idempotent.\n" +
        "- **PUT** — **full replacement** at a client-known URI. You send the *entire* representation; missing fields are set to defaults/null. Idempotent. Can also create-at-URI (upsert) if the API allows it.\n" +
        "- **PATCH** — **partial update**. You send only the fields that change.\n\n" +
        "Two PATCH formats: **JSON Merge Patch** (`application/merge-patch+json`) — send the fields to change; `null` means 'set to null'. **JSON Patch** (`application/json-patch+json`) — an ordered list of ops (`add`/`remove`/`replace`).\n\n" +
        "**Concurrency:** partial updates race. Use `ETag` + `If-Match` (or a `version` field) so a PATCH/PUT fails with `409/412` if the resource changed since the client read it — the lost-update problem again, now over HTTP.\n\n" +
        "Rule: use PUT when the client owns the full state and the id; PATCH for partial edits; POST for creation and non-CRUD actions.\n\n" +
        "The idempotency contrast is worth stating: PUT is idempotent because sending the same full representation twice leaves the resource in the same final state, whereas PATCH is not necessarily idempotent (a JSON Patch `add`-to-array or an increment op applied twice changes the result differently). That property affects retry safety — a client can safely re-send a timed-out PUT but must be more careful with PATCH. Also mind the success codes: `200` with the updated body, or `204 No Content` when you return nothing; `201` only when a PUT actually created the resource. And validate partial PATCH payloads carefully, since a naive merge that treats a missing field the same as an explicit `null` will silently wipe data the client never intended to touch.",
      code: `// PATCH with optimistic concurrency via ETag / If-Match
@PatchMapping(value = "/api/customers/{id}",
              consumes = "application/merge-patch+json")
ResponseEntity<Customer> patch(@PathVariable long id,
                               @RequestHeader("If-Match") String ifMatch,
                               @RequestBody JsonNode patch) {
    Customer c = repo.findById(id).orElseThrow();
    if (!c.etag().equals(ifMatch)) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build(); // 412
    }
    merge(c, patch);                    // apply only present fields
    return ResponseEntity.ok(repo.save(c));
}`,
      codeLanguage: "java",
      explanation:
        "Common API semantics question — full replace vs partial edit, merge-patch vs json-patch, and ETag/If-Match to prevent lost updates.",
      followUps: [
        "JSON Merge Patch vs JSON Patch?",
        "How do you prevent a lost update on PATCH?",
        "Can PUT create a resource?",
      ],
    },
    {
      id: "b174",
      question: "Explain content negotiation and media types.",
      answer:
        "Content negotiation lets one URI serve different representations. The client states preferences; the server chooses.\n\n" +
        "- **`Accept`** (request) — what the client wants back (`application/json`, `application/xml`), with quality weights (`Accept: application/json;q=0.9, */*;q=0.1`).\n" +
        "- **`Content-Type`** (request/response) — the media type of *this* body. A POST with a JSON body sets `Content-Type: application/json`.\n" +
        "- **`Accept-Language`, `Accept-Encoding`** — locale and compression (gzip/br).\n\n" +
        "Spring maps this automatically: `@RestController` uses `HttpMessageConverter`s (Jackson for JSON) driven by `produces`/`consumes` and the `Accept` header. If the client asks for a type you can't produce, return `406 Not Acceptable`; if it sends a body type you can't read, `415 Unsupported Media Type`.\n\n" +
        "Media types also carry **API versions** (`application/vnd.myapp.v2+json`) — a versioning strategy. Default to JSON; only add XML/others when a consumer genuinely needs them.\n\n" +
        "Understand the difference between **proactive** and **reactive** negotiation: proactive (server-driven) is the common case where the server picks based on the `Accept` header's media types and quality values; reactive (agent-driven) returns a list of options for the client to choose, which is rare in practice. In Spring you tune this via `ContentNegotiationConfigurer` — favour the `Accept` header and disable the legacy path-extension (`.json`) and query-parameter strategies in production, since extension-based negotiation has been a source of security and caching surprises. One caching gotcha to mention: when a URI can return different representations, the server should send `Vary: Accept` so shared caches and CDNs don't hand an XML response to a client that asked for JSON.",
      code: `@RestController
@RequestMapping("/api/reports")
class ReportController {

    // Serve JSON or CSV from ONE endpoint based on Accept
    @GetMapping(value = "/{id}",
                produces = { MediaType.APPLICATION_JSON_VALUE, "text/csv" })
    ResponseEntity<?> get(@PathVariable long id,
                          @RequestHeader(HttpHeaders.ACCEPT) String accept) {
        Report r = service.find(id);
        return accept.contains("text/csv")
                ? ResponseEntity.ok().contentType(MediaType.valueOf("text/csv"))
                                     .body(toCsv(r))
                : ResponseEntity.ok(r);          // Jackson -> JSON
    }
}`,
      codeLanguage: "java",
      explanation:
        "API contract maturity — Accept vs Content-Type, 406 vs 415, and how Spring's message converters implement negotiation.",
      followUps: [
        "406 vs 415 — which is which?",
        "How can media types encode API versions?",
        "What does the q-value in Accept do?",
      ],
    },
    {
      id: "b175",
      question: "What are the API versioning strategies and their trade-offs?",
      answer:
        "You version to evolve without breaking existing consumers. Options:\n\n" +
        "- **URI versioning** — `/api/v1/orders`. Most common: obvious, cache/log friendly, easy to route. Downside: not 'pure REST' (the URI of a resource changes) and can duplicate controllers.\n" +
        "- **Header versioning** — a custom header (`X-API-Version: 2`) or `Accept: application/vnd.app.v2+json` (media-type versioning). Cleaner URIs; harder to test in a browser and easy to forget.\n" +
        "- **Query param** — `/orders?version=2`. Simple but muddies caching and feels hacky.\n\n" +
        "**Better than versioning: don't break.** Additive, backward-compatible changes (new optional fields, new endpoints) need no new version — tolerant readers ignore unknown fields. Reserve a new major version for genuinely breaking changes, keep the old one during a **deprecation window** (announce via `Deprecation`/`Sunset` headers), and give consumers time to migrate.\n\n" +
        "Pragmatic default: **URI versioning for the major version**, plus strict backward compatibility within a version.\n\n" +
        "Whatever scheme you pick, the operational discipline matters more than the mechanism: publish a clear deprecation policy, communicate timelines, and use the standard `Deprecation` and `Sunset` response headers so clients can detect end-of-life programmatically. Keep the number of concurrently supported versions small — every live version is code you must patch, test and secure — and instrument usage per version so you know when it's safe to retire one. Internally, avoid forking whole controllers per version where you can; adapt at the edges (request/response mappers or an anti-corruption layer) so the core domain model stays single-versioned and the version-specific translation lives in one place.",
      code: `// URI versioning: keep v1 alive while v2 rolls out
@RestController
@RequestMapping("/api/v2/orders")
class OrderV2Controller { /* new shape */ }

// Signal deprecation on the old version's responses
@GetMapping("/api/v1/orders/{id}")
ResponseEntity<OrderV1> getV1(@PathVariable long id) {
    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT")
        .header("Link", "</api/v2/orders>; rel=\\"successor-version\\"")
        .body(service.findV1(id));
}`,
      codeLanguage: "java",
      explanation:
        "API evolution planning — URI vs header vs media-type versioning, and preferring backward-compatible change with a deprecation window.",
      followUps: [
        "Which changes are backward compatible (no new version needed)?",
        "How do you communicate deprecation to consumers?",
        "URI vs media-type versioning — trade-offs?",
      ],
    },
    {
      id: "b176",
      question: "How do you design pagination, filtering and sorting for a list endpoint?",
      answer:
        "**Pagination** — never return an unbounded list. Two styles:\n\n" +
        "- **Offset/page** — `?page=2&size=20`. Simple, supports jump-to-page and a total count, but slow on deep pages and can skip/duplicate rows under concurrent writes.\n" +
        "- **Cursor/keyset** — `?limit=20&cursor=<opaque>`. Constant-time at any depth and stable under inserts; best for large data and infinite scroll. Return the next cursor in the body or a `Link` header.\n\n" +
        "**Filtering** — explicit query params (`?status=PAID&minAmount=100`). Validate against an **allowlist** of filterable fields; never build SQL from raw field names (injection). For rich queries, a documented filter grammar (RSQL) beats ad-hoc params.\n\n" +
        "**Sorting** — `?sort=createdAt,desc`; again allowlist the sortable columns and cap the number of sort keys.\n\n" +
        "Always send sane defaults and a **max page size**, return pagination metadata (total or next cursor), and keep params consistent across all list endpoints.\n\n" +
        "The offset-vs-cursor decision usually comes down to the data: offset pagination is fine for small, admin-style lists where users want page numbers and a total count, but it degrades badly at depth because the database still scans and discards all skipped rows (`OFFSET 100000` is expensive), and it can duplicate or drop items when rows are inserted between page fetches. Keyset pagination avoids both problems by remembering the last seen sort key (`WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC LIMIT 20`) and is backed by an index, so it stays fast and stable — at the cost of losing random page access and exact totals. Encode the cursor as an opaque, tamper-resistant token so clients don't build dependencies on its internal structure.",
      code: `@GetMapping("/api/orders")
Page<OrderView> list(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort) {

    size = Math.min(size, 100);                       // enforce a max
    String[] s = sort.split(",");
    if (!SORTABLE.contains(s[0])) s[0] = "createdAt"; // allowlist!
    var pageable = PageRequest.of(page, size,
            Sort.by(Sort.Direction.fromString(s[1]), s[0]));
    return service.search(status, pageable);          // Spring Data Page
}
private static final Set<String> SORTABLE = Set.of("createdAt", "amount", "status");`,
      codeLanguage: "java",
      explanation:
        "Real list-endpoint design — bounded pages, cursor vs offset, allowlisted filter/sort fields, and consistent defaults.",
      followUps: [
        "When cursor over offset pagination?",
        "How do you stop injection via sort params?",
        "What metadata should a paginated response include?",
      ],
    },
    {
      id: "b177",
      question: "How do you design a good error response?",
      answer:
        "Errors are part of the API contract — make them **consistent, machine-readable, and safe**. The modern standard is **RFC 7807 `application/problem+json`**, which Spring 6 supports as `ProblemDetail`:\n\n" +
        "- `type` (a URI identifying the error class), `title`, `status`, `detail`, `instance`.\n" +
        "- Add fields: a stable machine `code`, a `traceId`/correlation id for support, and for validation a list of field errors.\n\n" +
        "**Centralize** with `@RestControllerAdvice` + `@ExceptionHandler` so every endpoint returns the same shape and status mapping (`EntityNotFound → 404`, `Validation → 400/422`, `OptimisticLock → 409`).\n\n" +
        "**Security:** never leak stack traces, SQL, or internal messages to clients — log those server-side with the trace id and return a generic message. The client gets enough to act (which field, what code); the operator gets the detail in logs. Return the correlation id in a header so a user can quote it in a ticket.\n\n" +
        "Get the status-code taxonomy right because it drives client behaviour: `4xx` means 'you (the caller) must change something' and is generally not retryable (`400` malformed, `401` unauthenticated, `403` forbidden, `404` missing, `409` conflict, `422` semantically invalid, `429` rate-limited), while `5xx` means 'the server failed' and may be retryable with backoff. Provide a **stable, documented error `code`** separate from the human `detail`, so clients can branch on it without string-matching messages that you might reword later. For validation, returning the full list of field violations in one response (rather than failing on the first) is far kinder to form-based clients, and `@RestControllerAdvice` with a `MethodArgumentNotValidException` handler is the natural place to assemble that.",
      code: `@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail onValidation(MethodArgumentNotValidException ex) {
        var pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("code", "VALIDATION_ERROR");
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                .toList());
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    @ExceptionHandler(Exception.class)             // last resort: hide internals
    ProblemDetail onUnexpected(Exception ex) {
        log.error("Unhandled", ex);                // detail stays in the logs
        var pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Developer experience + supportability — RFC 7807 ProblemDetail, centralized advice, correlation ids, and never leaking internals.",
      followUps: [
        "What is RFC 7807 / ProblemDetail?",
        "Why put a traceId in errors and logs?",
        "Why must you never return stack traces to clients?",
      ],
    },
    {
      id: "b178",
      question: "How does HTTP caching work — ETag, Cache-Control and conditional requests?",
      answer:
        "Caching cuts latency and load by avoiding redundant work/transfer.\n\n" +
        "**`Cache-Control`** is the main knob: `max-age=60` (fresh for 60s), `no-cache` (revalidate before use), `no-store` (never cache — for sensitive data), `private` (browser only) vs `public` (shared caches/CDN), `s-maxage` for CDNs.\n\n" +
        "**Validators for conditional requests:**\n\n" +
        "- **`ETag`** — an opaque version tag of the representation. The client re-requests with `If-None-Match: <etag>`; if unchanged the server returns **`304 Not Modified`** with no body (cheap). For writes, `If-Match` gives optimistic concurrency (`412` on mismatch).\n" +
        "- **`Last-Modified`** + `If-Modified-Since` — timestamp-based, coarser than ETags.\n\n" +
        "So caching has two wins: **freshness** (don't ask at all while fresh) and **validation** (ask cheaply with a 304 when stale). Spring offers `ShallowEtagHeaderFilter` and `ResponseEntity` cache-control builders. Be careful caching authenticated/personalized responses (`private`/`no-store`).\n\n" +
        "Distinguish **strong** from **weak** ETags (`W/\"...\"`): a strong ETag means byte-for-byte identical, which is required for range requests, while a weak one means semantically equivalent and is cheaper to compute — Spring's shallow filter produces weak-ish hashes of the rendered body, which saves bandwidth but not server work, whereas a real caching win comes from generating the ETag from a version/`updatedAt` so you can return `304` *before* doing the expensive query. Add `Vary` on any header that changes the response (e.g. `Accept`, `Accept-Encoding`, `Authorization`) so shared caches key correctly, and prefer explicit freshness (`max-age`/`s-maxage`) plus a CDN for public, cacheable GETs. For anything user-specific, `Cache-Control: private, no-store` avoids leaking one user's data to another via an intermediary cache.",
      code: `@GetMapping("/api/products/{id}")
ResponseEntity<Product> get(@PathVariable long id,
                            @RequestHeader(value = "If-None-Match", required = false) String inm) {
    Product p = service.find(id);
    String etag = "\\"" + p.version() + "\\"";
    if (etag.equals(inm)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build(); // 304
    }
    return ResponseEntity.ok()
            .eTag(etag)
            .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
            .body(p);
}`,
      codeLanguage: "java",
      explanation:
        "Performance/scalability awareness — freshness (max-age) vs validation (ETag/304), and safe caching of personalized data.",
      followUps: [
        "no-cache vs no-store — difference?",
        "How does a 304 save work?",
        "How does ETag also enable optimistic concurrency on writes?",
      ],
    },
    {
      id: "b179",
      question: "What is CORS and how do you configure it correctly?",
      answer:
        "CORS (Cross-Origin Resource Sharing) is a **browser** security mechanism enforcing the same-origin policy: JavaScript on `https://app.com` can't read a response from `https://api.other.com` unless the server opts in with `Access-Control-Allow-Origin`. It protects users, not the server — non-browser clients ignore it.\n\n" +
        "**Preflight:** for 'non-simple' requests (custom headers, `PUT`/`DELETE`, JSON content type), the browser first sends an **`OPTIONS`** request; the server must answer with `Access-Control-Allow-Origin/-Methods/-Headers`. Only then does the real request go.\n\n" +
        "**Credentials:** to send cookies/Authorization, the server must set `Access-Control-Allow-Credentials: true` **and** echo a specific origin — you **cannot** combine credentials with `Allow-Origin: *`.\n\n" +
        "In Spring, configure a `CorsConfigurationSource` (allowlist real origins, not `*` in production), or `@CrossOrigin` per controller. CORS ≠ CSRF: CORS *relaxes* the same-origin policy for reads; it isn't an authorization control.\n\n" +
        "The most important mental correction to voice is that CORS does not *protect* your server at all — it protects the *user's browser* from letting one site read another's authenticated responses. Your endpoint still executes; the browser merely blocks the calling script from reading the result unless the headers permit it, and any curl/Postman/mobile client bypasses the whole mechanism, so CORS is never a substitute for real authentication and authorization. Two practical tips: order matters — the CORS filter must run early (before Spring Security's checks) so preflight `OPTIONS` requests aren't rejected as unauthenticated; and you can cache preflights with `Access-Control-Max-Age` to cut the extra round trip. In Spring Security, enabling `.cors()` wires your `CorsConfigurationSource` into the filter chain correctly.",
      code: `@Bean
CorsConfigurationSource corsConfig() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://app.example.com")); // allowlist, not *
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cfg.setAllowCredentials(true);          // requires a specific origin (not *)
    cfg.setMaxAge(3600L);                    // cache preflight for 1h
    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/api/**", cfg);
    return src;
}`,
      codeLanguage: "java",
      explanation:
        "Common frontend-backend integration issue — CORS as a browser control, the preflight flow, and the credentials-vs-wildcard rule.",
      followUps: [
        "Why can't you use Allow-Origin:* with credentials?",
        "What triggers a preflight OPTIONS request?",
        "How is CORS different from CSRF?",
      ],
    },
    {
      id: "b180",
      question: "Explain cookies, sessions and the SameSite attribute.",
      answer:
        "A **cookie** is a small key/value the browser stores and auto-sends to its domain on every request. A **session** is server-side state (user id, etc.) keyed by a session-id cookie.\n\n" +
        "**Security attributes (set them all for auth cookies):**\n\n" +
        "- **`HttpOnly`** — JS can't read it (`document.cookie`), mitigating token theft via XSS.\n" +
        "- **`Secure`** — only sent over HTTPS.\n" +
        "- **`SameSite`** — controls cross-site sending: `Strict` (never cross-site — best CSRF defense, but breaks inbound links to logged-in pages), `Lax` (sent on top-level GET navigations — the modern default), `None` (always sent — **requires `Secure`**, needed for cross-site/3rd-party contexts).\n" +
        "- `Domain`/`Path`/`Max-Age`/`Expires` scope and lifetime.\n\n" +
        "`SameSite=Lax/Strict` is a strong, built-in CSRF mitigation because the malicious cross-site request won't carry the cookie. For SPAs on a different origin calling a cookie API you may need `SameSite=None; Secure` plus CORS + CSRF tokens. If you store a JWT in a cookie, apply the same flags; if in `localStorage`, it's exposed to XSS.",
      code: `// A hardened session/auth cookie
ResponseCookie cookie = ResponseCookie.from("SESSION", sessionId)
        .httpOnly(true)          // not readable by JS (XSS mitigation)
        .secure(true)            // HTTPS only
        .sameSite("Lax")         // CSRF mitigation; use "Strict" for pure same-site
        .path("/")
        .maxAge(Duration.ofHours(2))
        .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());`,
      codeLanguage: "java",
      explanation:
        "Web security + auth context — HttpOnly/Secure/SameSite flags and how SameSite mitigates CSRF, plus JWT-in-cookie trade-offs.",
      followUps: [
        "How does SameSite mitigate CSRF?",
        "When must you use SameSite=None?",
        "Cookie vs localStorage for a JWT — which and why?",
      ],
    },
    {
      id: "b181",
      question: "How do you document an API with OpenAPI?",
      answer:
        "**OpenAPI** (formerly Swagger) is a machine-readable spec of your endpoints, schemas, parameters, auth and examples. Value: interactive docs (Swagger UI), client/server code generation, contract sharing with frontend/partners, and contract testing.\n\n" +
        "**Two approaches:**\n\n" +
        "- **Code-first** — generate the spec from the running app. In Spring Boot, add **springdoc-openapi**; it introspects controllers/DTOs and serves `/v3/api-docs` + Swagger UI. Enrich with `@Operation`, `@Schema`, `@Parameter`, validation annotations, and response examples.\n" +
        "- **Design-first** — author the YAML spec first, review it, then generate server stubs and client SDKs (openapi-generator). Better for cross-team contracts and parallel work.\n\n" +
        "Keep the spec in source control, publish it in CI, and version it with the API. Document error shapes (ProblemDetail), auth (bearer/JWT), pagination and examples — a spec without examples is half-useful. Treat the generated docs as part of the deliverable, not an afterthought.\n\n" +
        "The strongest argument for design-first is that the OpenAPI document becomes the **single source of truth and a testable contract**: frontend and backend teams can work in parallel against the same spec, mock servers (Prism, WireMock) can be generated for consumers before the API exists, and CI can assert the running app still conforms to the committed spec so drift is caught automatically. Code-first is faster to start and stays in sync with the implementation by construction, but tends to expose accidental internals unless you curate the annotations. Whichever you choose, keep the spec versioned alongside the code, lint it (Spectral) for consistency, and include realistic request/response examples and error schemas — an accurate, example-rich contract is what makes client SDK generation and third-party onboarding actually work.",
      code: `@Operation(summary = "Get an order by id",
           responses = {
             @ApiResponse(responseCode = "200", description = "Found"),
             @ApiResponse(responseCode = "404", description = "Not found",
                 content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
           })
@GetMapping("/api/orders/{id}")
Order get(@Parameter(description = "Order id") @PathVariable long id) {
    return service.find(id);
}

// build.gradle: implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui")
// UI at /swagger-ui.html, spec at /v3/api-docs`,
      codeLanguage: "java",
      explanation:
        "API collaboration skill — springdoc code-first vs design-first, and why examples/auth/error schemas make a spec actually usable.",
      followUps: [
        "Code-first vs design-first — trade-offs?",
        "How do you generate a typed client from the spec?",
        "How do you keep docs in sync with the code?",
      ],
    },
    {
      id: "b182",
      question: "How do you design an async API for long-running operations?",
      answer:
        "When work takes seconds/minutes (video encode, report, bulk import), don't hold the HTTP connection open. Return **`202 Accepted`** with a **status resource** the client can poll, or notify via webhook.\n\n" +
        "**Polling pattern:**\n\n" +
        "1. `POST /reports` → `202 Accepted`, `Location: /reports/123/status`, body has an operation id.\n" +
        "2. Client polls `GET /reports/123/status` → `{status: RUNNING|SUCCEEDED|FAILED, progress}`; use `Retry-After` to pace it.\n" +
        "3. On success, the status points to the result (`GET /reports/123`).\n\n" +
        "**Webhook/push pattern** — the client registers a callback URL; you `POST` the result when done (sign the payload, retry with backoff, expect the receiver to be idempotent). Push avoids polling but requires the client to expose an endpoint.\n\n" +
        "Persist the operation state so it survives restarts, make submission idempotent (idempotency key), and give operations a TTL. This decouples request latency from processing time and lets you scale workers independently.\n\n" +
        "The `202 Accepted` contract is deliberately non-committal — it means 'I've taken the request but haven't finished (or even necessarily validated) it', so the status resource must clearly distinguish `PENDING`/`RUNNING`/`SUCCEEDED`/`FAILED` and, on failure, carry a machine-readable error the client can act on. Behind the scenes the durable pattern is to enqueue the job (or write it to an outbox) so a worker pool processes it reliably even across restarts, which is what lets you scale processing separately from the web tier. Compare the two notification styles honestly: polling is simple and firewall-friendly but wastes calls and adds latency (mitigate with `Retry-After`), while webhooks are efficient and real-time but shift complexity to delivery — you must sign payloads, retry with backoff, and require the receiver to be idempotent because the same event may arrive more than once.",
      code: `@PostMapping("/api/reports")
ResponseEntity<Void> submit(@RequestBody ReportRequest req) {
    String opId = jobService.enqueue(req);       // returns immediately
    return ResponseEntity.accepted()             // 202
            .location(URI.create("/api/reports/" + opId + "/status"))
            .build();
}

@GetMapping("/api/reports/{id}/status")
ResponseEntity<JobStatus> status(@PathVariable String id) {
    JobStatus s = jobService.status(id);         // RUNNING / SUCCEEDED / FAILED
    return ResponseEntity.ok()
            .header("Retry-After", "5")          // pace the polling
            .body(s);
}`,
      codeLanguage: "java",
      explanation:
        "Modern backend integration — 202 + status resource polling vs signed webhooks, with persisted, idempotent, restartable operations.",
      followUps: [
        "Polling vs webhooks — when each?",
        "Why return 202 and a Location header?",
        "How do you make webhook delivery reliable?",
      ],
    },
    {
      id: "b183",
      question: "Explain timeouts, retries, backoff and jitter for calling other services.",
      answer:
        "Every remote call can hang or fail; without limits one slow dependency exhausts your threads/connections and cascades.\n\n" +
        "- **Timeouts** — always set **connect** and **read** timeouts (and an overall deadline). No timeout = wait forever = thread/pool exhaustion. Budget them so the total stays under the caller's own timeout.\n" +
        "- **Retries** — retry only **idempotent** operations and only **transient** failures (timeouts, `503`, connection reset) — never a `400`/`422`. Cap attempts (2–3).\n" +
        "- **Exponential backoff** — wait 100ms, 200ms, 400ms… so you don't hammer a struggling service.\n" +
        "- **Jitter** — add randomness to the delay so many clients don't retry in lockstep and cause a **retry storm / thundering herd**.\n\n" +
        "Combine with a **circuit breaker** so you stop retrying a dead dependency. Resilience4j provides retry + backoff + jitter declaratively. The failure mode to avoid: naive fixed-interval retries multiplying load on an already-overloaded service.\n\n" +
        "The deeper reason to be conservative with retries is that they turn a partial outage into a full one: when a dependency slows down, every caller retrying amplifies the load 2–3x precisely when the service can least handle it, so retries must be paired with a circuit breaker (stop retrying a dead dependency) and, ideally, a client-side budget that caps the *fraction* of traffic that is retries. Set timeouts from the outside in — the total time across connect, read and any retries must fit inside the caller's own deadline, otherwise the caller times out first and your retry is wasted work. And be honest about idempotency: retrying a non-idempotent POST after a read-timeout can double-apply the effect, which is exactly why the idempotency-key pattern exists.",
      code: `# Resilience4j: retry only transient errors, exponential backoff + jitter
resilience4j:
  retry:
    instances:
      inventory:
        max-attempts: 3
        wait-duration: 100ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        enable-randomized-wait: true      # jitter to avoid retry storms
        retry-exceptions:
          - java.net.SocketTimeoutException
          - org.springframework.web.client.HttpServerErrorException

// @Retry(name = "inventory") on the client method
// RestClient/WebClient: set connect + read timeouts explicitly`,
      codeLanguage: "yaml",
      explanation:
        "Resilience fundamentals — mandatory timeouts, retry only idempotent+transient, and backoff+jitter to prevent retry storms.",
      followUps: [
        "Why is jitter necessary on top of backoff?",
        "Which failures should you never retry?",
        "How do timeouts prevent thread-pool exhaustion?",
      ],
    },
    {
      id: "b184",
      question: "What are the circuit breaker and bulkhead patterns?",
      answer:
        "**Circuit breaker** — stop calling a failing dependency so you fail fast instead of piling up slow/broken calls. States:\n\n" +
        "- **Closed** — calls flow; failures are counted.\n" +
        "- **Open** — once the failure rate crosses a threshold, calls are **rejected immediately** (return a fallback) for a cool-down window, giving the dependency time to recover and protecting your threads.\n" +
        "- **Half-open** — after the window, let a few trial calls through; if they succeed, close; if not, re-open.\n\n" +
        "Pair it with a **fallback** (cached value, default, graceful degradation).\n\n" +
        "**Bulkhead** — isolate resources so one slow dependency can't consume all threads/connections. Give each downstream its own bounded thread pool or semaphore; if dependency A saturates its bulkhead, calls to B still work. Named after ship compartments that stop one flooded section from sinking the whole vessel.\n\n" +
        "Together (plus timeouts + retries) they contain failures. Resilience4j provides `@CircuitBreaker` and `@Bulkhead`.\n\n" +
        "Tuning is where people slip up: the breaker should trip on a **failure *rate*** over a rolling window (and often a separate slow-call-rate threshold), not a raw count, so a burst of traffic doesn't skew it, and the open-state duration should give the dependency real time to recover without flapping. Order the layers deliberately — timeout innermost (so a hung call is counted as a failure), then retry, then circuit breaker, then bulkhead — and always provide a **fallback** that degrades gracefully (serve stale cache, a default, or a clear partial response) rather than propagating the failure to the user. Resilience4j composes these as decorators and, unlike the deprecated Hystrix, is lightweight and integrates with Micrometer so you can alert on breaker state transitions.",
      code: `@Service
class InventoryClient {

    @CircuitBreaker(name = "inventory", fallbackMethod = "fallback")
    @Bulkhead(name = "inventory")                 // isolate its threads
    public Stock check(long productId) {
        return restClient.get()                   // may fail/slow
                .uri("/stock/{id}", productId)
                .retrieve().body(Stock.class);
    }

    // Called when the breaker is OPEN or the call fails: degrade gracefully
    private Stock fallback(long productId, Throwable t) {
        return Stock.unknown(productId);          // don't take the whole request down
    }
}`,
      codeLanguage: "java",
      explanation:
        "Stability under partial failure — breaker states + fallback to fail fast, and bulkheads to stop one dependency starving all threads.",
      followUps: [
        "Explain the closed/open/half-open transitions.",
        "How does a bulkhead differ from a circuit breaker?",
        "What makes a good fallback?",
      ],
    },
    {
      id: "b185",
      question: "How do you handle partial failures in a distributed workflow (saga, outbox)?",
      answer:
        "Across services you can't use one ACID transaction, so a multi-step workflow can fail halfway (payment succeeded, shipping failed). You need **eventual consistency** with explicit compensation.\n\n" +
        "**Saga** — model the workflow as a sequence of local transactions, each publishing an event that triggers the next. If a step fails, run **compensating transactions** to undo prior steps (refund the payment). Two styles: **choreography** (services react to each other's events — decentralized, can get tangled) and **orchestration** (a central coordinator drives the steps — clearer, easier to reason about).\n\n" +
        "**Transactional outbox** — the classic 'save to DB *and* publish an event atomically' problem: you can't reliably do both (dual-write). Instead, write the event to an **outbox table in the same DB transaction** as the business change; a separate relay/CDC (Debezium) reads the outbox and publishes to the broker. This guarantees at-least-once delivery without losing events on a crash.\n\n" +
        "Consumers must be **idempotent** (dedupe on event id) since delivery is at-least-once, and design for out-of-order/duplicate events.",
      code: `// Outbox: business change + event in ONE local transaction (no dual-write)
@Transactional
public void placeOrder(Order order) {
    orderRepo.save(order);
    outboxRepo.save(new OutboxEvent(
            UUID.randomUUID(),                 // event id for consumer dedupe
            "OrderPlaced",
            toJson(order)));                   // committed atomically with the order
}

// A relay/CDC process later reads unpublished outbox rows and sends them to Kafka,
// marking them published. On crash, unpublished rows are simply re-sent -> at-least-once.`,
      codeLanguage: "java",
      explanation:
        "Distributed workflow correctness — sagas with compensation, the outbox pattern for atomic publish, and idempotent consumers.",
      followUps: [
        "Saga choreography vs orchestration?",
        "Why can't you just save to DB and publish to Kafka in the same method?",
        "Why must saga consumers be idempotent?",
      ],
    },
    {
      id: "b186",
      question: "Microservices vs monolith — how do you decide?",
      answer:
        "Neither is 'better' — it's a trade-off between **operational cost** and **independent scaling/deployment**.\n\n" +
        "**Monolith** — one deployable. Simple to build, test, debug, and reason about; in-process calls (no network); ACID across the whole domain; one thing to deploy. Downsides at scale: a large codebase couples teams, you scale the whole app even if one part is hot, and one bug can take everything down.\n\n" +
        "**Microservices** — independently deployable services per bounded context. Benefits: teams ship independently, scale/technology per service, fault isolation. Costs are real: network latency and partial failure, distributed transactions (sagas), eventual consistency, harder debugging (need tracing), data duplication, and heavy ops (CI/CD, service discovery, observability, orchestration).\n\n" +
        "**Guidance:** start with a **well-structured (modular) monolith** with clear module boundaries; extract a service only when a specific driver appears — an independent scaling need, a team-autonomy bottleneck, or a differing availability/technology requirement. Don't adopt microservices for résumé reasons; you pay the distributed-systems tax up front. 'Microservices are a solution to an organizational problem, not a technical one.'",
      code: `// Modular monolith: enforce boundaries in ONE deployable first.
// com.app.orders     -> only exposes OrdersApi (a Java interface)
// com.app.billing    -> depends on OrdersApi, NOT on order internals
// com.app.shipping    -> its own package, own tables

public interface OrdersApi {                 // the seam you could later extract
    OrderView findById(long id);
}
// When 'billing' needs to scale/deploy alone, promote OrdersApi to a REST/gRPC
// contract and split it out - the boundary already exists, so the split is cheap.`,
      codeLanguage: "java",
      explanation:
        "Architectural judgement — modular monolith first, extract services only for a concrete scaling/team/availability driver.",
      followUps: [
        "What's a modular monolith and why start there?",
        "What concrete signals justify splitting out a service?",
        "What's the distributed-systems 'tax' you take on?",
      ],
    },
    {
      id: "b187",
      question: "REST vs gRPC vs messaging — when do you use each?",
      answer:
        "Three integration styles with different shapes:\n\n" +
        "- **REST/HTTP+JSON** — synchronous request/response. Ubiquitous, human-readable, browser/tooling friendly, easy to cache and debug. Best for public APIs and simple service-to-service calls. Cost: verbose payloads, no built-in streaming, weaker contracts.\n" +
        "- **gRPC** — synchronous RPC over HTTP/2 with Protobuf. Compact binary, low latency, strong typed contracts (`.proto`), code-gen in many languages, bidirectional **streaming**. Great for high-throughput internal service-to-service. Cost: not browser-native (needs a proxy), binary is harder to debug, schema evolution discipline required.\n" +
        "- **Messaging (Kafka/RabbitMQ)** — **asynchronous**, event-driven. Decouples producer and consumer in time; buffers load; enables fan-out, retries and replay. Best for events, work queues, and resilience. Cost: eventual consistency, at-least-once/dedup, ordering and operational complexity.\n\n" +
        "Rule of thumb: **REST** for external/simple sync, **gRPC** for chatty internal sync at scale, **messaging** for decoupling, spikes, and event propagation. Real systems mix all three.\n\n" +
        "The most consequential axis is synchronous vs asynchronous, because it dictates your coupling and failure model: with synchronous REST/gRPC the caller's availability is bounded by the callee's (a slow dependency directly degrades you, hence timeouts and circuit breakers), whereas messaging gives temporal decoupling — the consumer can be down and catch up later — at the price of eventual consistency and the need for idempotent, dedup-aware consumers. A common mature pattern is to use synchronous calls for queries that need an immediate answer and events for state changes that others merely need to *know about*, which keeps write paths resilient and read paths responsive. gRPC's streaming and strong Protobuf contracts make it the sweet spot for internal, high-volume, polyglot service meshes, while REST's ubiquity and debuggability keep it the default at the public edge.",
      code: `// gRPC contract (schema-first, code-generated, strongly typed)
service InventoryService {
  rpc CheckStock (StockRequest) returns (StockReply);
  rpc WatchStock (StockRequest) returns (stream StockReply);  // server streaming
}
message StockRequest { int64 product_id = 1; }
message StockReply   { int64 product_id = 1; int32 available = 2; }

// REST equivalent: GET /api/products/{id}/stock  -> JSON  (simpler, cacheable, verbose)
// Messaging equivalent: publish "StockChanged" events; consumers react asynchronously`,
      codeLanguage: "bash",
      explanation:
        "Integration trade-offs — sync JSON vs typed binary RPC vs async events, matched to latency, coupling and streaming needs.",
      followUps: [
        "Why is gRPC not directly usable from a browser?",
        "How do Protobuf and JSON differ on schema evolution?",
        "When do you pick async messaging over sync calls?",
      ],
    },
    {
      id: "b188",
      question: "What are an API gateway and a Backend-for-Frontend (BFF)?",
      answer:
        "**API gateway** — a single entry point in front of many services. It centralizes cross-cutting concerns so each service doesn't re-implement them: routing, authentication/authorization (validate the JWT once), rate limiting, TLS termination, request/response transformation, caching, and observability. It shields internal topology from clients (they see one host). Examples: Spring Cloud Gateway, Kong, AWS API Gateway, Nginx. Risk: it can become a bottleneck or a place where business logic leaks — keep it thin.\n\n" +
        "**BFF (Backend for Frontend)** — a gateway *specialized per client type*. A web app, a mobile app, and a partner API have different needs (payload shape, chattiness, auth). Instead of one generic API forcing compromises, each frontend gets its own tailored backend that **aggregates** downstream calls, trims payloads, and reduces round-trips for that client. Downside: more services to own; risk of duplicated logic across BFFs.\n\n" +
        "Use a gateway for shared edge concerns; add BFFs when different clients need meaningfully different, aggregated APIs.",
      code: `# Spring Cloud Gateway: route + JWT auth + rate limit at the edge
spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter          # token-bucket via Redis
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
# The gateway validates the JWT once; downstream services trust the forwarded identity.`,
      codeLanguage: "yaml",
      explanation:
        "Common distributed component — gateway for shared edge concerns, BFF for client-tailored aggregation; keep both thin.",
      followUps: [
        "What cross-cutting concerns belong at the gateway?",
        "When is a BFF worth the extra service?",
        "How do you keep a gateway from becoming a bottleneck?",
      ],
    },
    {
      id: "b189",
      question: "Walk me through designing a feature end to end (e.g. 'add order cancellation').",
      answer:
        "Show a structured approach, not just code:\n\n" +
        "1. **Clarify requirements** — who can cancel, until when (before shipping?), refunds, notifications, partial cancellation, audit. Nail edge cases early.\n" +
        "2. **API design** — model as a state transition: `POST /api/orders/{id}/cancellation` (or `PATCH` status). Define request/response, status codes (`200`/`409` if already shipped/cancelled), idempotency, auth (owner or admin).\n" +
        "3. **Domain/data** — order status state machine (`PLACED → CANCELLED`), guard illegal transitions, add a `cancelled_at`/reason, version column for concurrency, migration script.\n" +
        "4. **Logic & side effects** — inside a transaction update state; publish a `OrderCancelled` event (outbox) to trigger refund/notification asynchronously so the request stays fast.\n" +
        "5. **Failure & edge cases** — concurrent cancel + ship race (optimistic lock/`409`), refund failure (saga/compensation), idempotent retries.\n" +
        "6. **Cross-cutting** — validation, error contract, authz, logging/metrics, feature flag for rollout.\n" +
        "7. **Testing** — unit (state machine), slice (`@WebMvcTest`), integration (`@DataJpaTest`/Testcontainers), and a contract test.\n\n" +
        "The interviewer wants your **process** and how you surface edge cases and failure modes.",
      code: `@PostMapping("/api/orders/{id}/cancellation")
@Transactional
ResponseEntity<OrderView> cancel(@PathVariable long id,
                                 @RequestBody CancelRequest req,
                                 @AuthenticationPrincipal UserPrincipal user) {
    Order o = orderRepo.findById(id).orElseThrow();     // @Version -> optimistic
    authz.assertCanCancel(user, o);
    if (!o.status().canTransitionTo(CANCELLED)) {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();   // 409: shipped
    }
    o.cancel(req.reason());
    outbox.save(new OrderCancelled(id, req.reason()));  // async refund/notify
    return ResponseEntity.ok(OrderView.from(o));
}`,
      codeLanguage: "java",
      explanation:
        "Practical feature ownership — requirements → API → data → logic → failure modes → cross-cutting → tests, surfacing edge cases.",
      followUps: [
        "How do you handle the cancel-vs-ship race?",
        "Where do refund and notification belong, and why async?",
        "What tests would you write at each layer?",
      ],
    },
    {
      id: "b190",
      question: "Design a URL shortener (a scoped system-design exercise).",
      answer:
        "Scope it, then reason about the pieces:\n\n" +
        "**Requirements** — create short → long mapping; redirect; ~read-heavy (100:1 reads:writes); low-latency redirects; optional custom alias, expiry, analytics.\n\n" +
        "**API** — `POST /urls {longUrl}` → `{shortCode}`; `GET /{code}` → `301/302` redirect to the long URL.\n\n" +
        "**Key generation** — encode an auto-increment id in **base62** (`[0-9A-Za-z]`, ~7 chars covers 3.5T). Deterministic, collision-free, short. Alternatives: random + uniqueness check, or hash(longUrl) truncated with collision handling. For custom aliases, enforce a `UNIQUE` constraint.\n\n" +
        "**Storage** — a simple key-value / relational table `code -> longUrl` (indexed on code). It's a lookup workload, so it shards well.\n\n" +
        "**Scale reads** — the redirect is the hot path: cache `code -> longUrl` in Redis (cache-aside) and/or CDN; DB is the source of truth. `301` (permanent, cacheable) vs `302` (temporary, lets you count clicks).\n\n" +
        "**Extras** — rate limit creation, analytics via async events, TTL/expiry cleanup. Call out consistency (cache invalidation on delete) and the read-heavy caching strategy — that's what they're probing.",
      code: `private static final String B62 =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

static String encode(long id) {                 // auto-increment id -> short code
    StringBuilder sb = new StringBuilder();
    do { sb.append(B62.charAt((int)(id % 62))); id /= 62; } while (id > 0);
    return sb.reverse().toString();
}

@GetMapping("/{code}")                          // hot path: cache-first redirect
ResponseEntity<Void> redirect(@PathVariable String code) {
    String url = cache.get(code, () -> repo.findByCode(code).orElseThrow().url());
    return ResponseEntity.status(HttpStatus.FOUND)  // 302 if counting clicks
            .location(URI.create(url)).build();
}`,
      codeLanguage: "java",
      explanation:
        "Appropriately scoped design — base62 id encoding, read-heavy caching, 301 vs 302, and calling out uniqueness/consistency.",
      followUps: [
        "Base62 of an id vs hashing the URL — trade-offs?",
        "301 vs 302 for the redirect — which and why?",
        "How do you scale the read path?",
      ],
    },
    {
      id: "b191",
      question: "How do you implement rate limiting?",
      answer:
        "Rate limiting protects an API from abuse, accidental hammering, and noisy neighbours. Common algorithms:\n\n" +
        "- **Token bucket** — a bucket refills at a steady rate up to a capacity; each request takes a token. Allows short **bursts** up to capacity while capping the average rate. Most popular; simple and fair.\n" +
        "- **Leaky bucket** — smooths to a constant output rate (no bursts).\n" +
        "- **Fixed window** — count per calendar window; simple but has a boundary-spike problem (2x at the edges).\n" +
        "- **Sliding window (log/counter)** — smooths the fixed-window edge problem.\n\n" +
        "**Key** by user/API-key (fair) or IP (for anonymous — but shared NAT/proxies complicate it). **Distributed** enforcement needs shared state: **Redis** (atomic `INCR`/Lua, or a token-bucket) so all instances agree. Return **`429 Too Many Requests`** with `Retry-After` and `X-RateLimit-Remaining/-Reset` headers so clients back off gracefully. Often applied at the API gateway (Spring Cloud Gateway `RequestRateLimiter`) rather than each service.\n\n" +
        "The reason token bucket dominates is that it decouples **average rate** (the refill speed) from **burst tolerance** (the bucket capacity), so you can allow a legitimate short spike while still capping sustained throughput — a good fit for real user traffic. In a distributed deployment the hard part is agreeing on the count across instances: a naive per-instance limiter lets N instances permit N× the intended rate, so you centralize the counter in Redis and make the check-and-decrement atomic (a Lua script or `INCR`+`EXPIRE`) to avoid races. Layer limits (per-key, per-IP, and a global safety cap), and make the response client-friendly with `429`, `Retry-After`, and the `X-RateLimit-*` headers so well-behaved clients self-throttle instead of retrying blindly. Distinguish rate limiting (smoothing traffic) from quotas (billing/usage caps over long periods), which are enforced differently.",
      code: `// Token-bucket rate limit per user, enforced in Redis (Bucket4j-style)
public boolean allow(String userId) {
    String key = "rl:" + userId;
    // Atomic Lua: refill by elapsed time, consume 1 token if available
    Long allowed = redis.execute(TOKEN_BUCKET_LUA,
            List.of(key),
            "20",    // capacity (burst)
            "10",    // refill tokens per second
            String.valueOf(Instant.now().getEpochSecond()));
    return allowed == 1L;
}

// Controller: reject with 429 + Retry-After when not allowed
if (!limiter.allow(userId))
    return ResponseEntity.status(429).header("Retry-After", "1").build();`,
      codeLanguage: "java",
      explanation:
        "API protection pattern — token bucket for bursty fairness, Redis for distributed enforcement, and 429 + Retry-After for clients.",
      followUps: [
        "Token bucket vs fixed window — the edge-spike problem?",
        "Why does distributed rate limiting need Redis/shared state?",
        "Per-user vs per-IP limiting — trade-offs?",
      ],
    },
    {
      id: "b192",
      question: "How do you build and secure webhooks (outbound and inbound)?",
      answer:
        "A **webhook** is a reverse API: you `POST` an event to a URL the consumer registered, so they don't poll.\n\n" +
        "**Delivering webhooks reliably:**\n\n" +
        "- **Retry with backoff** on non-2xx / timeout; cap attempts, then move to a **dead-letter** queue.\n" +
        "- Deliver from a durable queue/outbox so events aren't lost on crash → **at-least-once**, so include a unique `event_id` and expect the receiver to dedupe (idempotent).\n" +
        "- Include a timestamp; document the payload schema and versioning.\n\n" +
        "**Securing them (both sides):**\n\n" +
        "- **HMAC signature** — sign the raw body with a shared secret and send it in a header (`X-Signature`). The receiver recomputes and compares (constant-time). This authenticates the sender and ensures integrity.\n" +
        "- **Replay protection** — include a timestamp in the signed payload and reject old ones; optionally track seen ids.\n" +
        "- **HTTPS only**, verify TLS, and (receiver side) validate/allowlist and treat the payload as untrusted input.\n\n" +
        "The receiver should respond `2xx` fast and process asynchronously (ack then work), so slow processing doesn't cause sender timeouts/retries.",
      code: `// Receiver: verify the HMAC signature before trusting the payload
@PostMapping("/webhooks/payments")
ResponseEntity<Void> receive(@RequestBody byte[] rawBody,
                             @RequestHeader("X-Signature") String sig,
                             @RequestHeader("X-Timestamp") long ts) {
    if (Math.abs(Instant.now().getEpochSecond() - ts) > 300)   // replay window
        return ResponseEntity.status(400).build();
    String expected = hmacSha256(secret, ts + "." + new String(rawBody));
    if (!MessageDigest.isEqual(expected.getBytes(), sig.getBytes())) // constant-time
        return ResponseEntity.status(401).build();
    queue.enqueue(rawBody);                    // ack fast, process async
    return ResponseEntity.ok().build();
}`,
      codeLanguage: "java",
      explanation:
        "Integration reliability — at-least-once delivery with retries/DLQ, HMAC signatures + replay protection, and fast async acks.",
      followUps: [
        "Why HMAC instead of just HTTPS?",
        "How do you stop webhook replay attacks?",
        "Why must webhook receivers be idempotent?",
      ],
    },
    {
      id: "b193",
      question: "How do you keep API compatibility and use contract testing?",
      answer:
        "Consumers break when a provider changes a response shape they depend on. Manage it with compatibility rules + tests.\n\n" +
        "**Backward-compatible (safe) changes:** add optional fields, add new endpoints, add enum values consumers tolerate, loosen validation. **Breaking changes:** remove/rename a field, change a type, make an optional field required, tighten validation, change status-code semantics. Breaking changes require a **new version** and a deprecation window.\n\n" +
        "**Tolerant reader** — consumers should ignore unknown fields (Jackson `FAIL_ON_UNKNOWN_PROPERTIES=false`) so additive changes don't break them.\n\n" +
        "**Contract testing** — instead of brittle end-to-end tests, verify the provider satisfies what consumers actually use. **Consumer-Driven Contracts** (Pact, Spring Cloud Contract): consumers declare expected request/response pairs; the provider runs generated tests against those contracts in CI, failing the build if it would break a real consumer. This catches incompatibilities *before* deploy without coordinating full-stack test environments.\n\n" +
        "Also validate responses against the versioned OpenAPI spec in CI.\n\n" +
        "The key insight behind consumer-driven contracts is that a provider only needs to keep working for the fields and behaviours its consumers *actually use*, not its entire published surface — so the consumers' expectations become the regression suite. In practice each consumer writes a contract describing the requests it sends and the responses it relies on; those contracts are shared (a Pact broker, or committed stubs with Spring Cloud Contract) and the provider's CI generates tests that fail the build the moment a change would break any real consumer. This shifts breakage detection left, off the shared staging environment and into a fast unit-style test, and as a bonus the same contracts generate stub servers so consumers can develop without the real provider running. It complements rather than replaces schema validation and a handful of true end-to-end smoke tests.",
      code: `// Spring Cloud Contract (provider side): a contract the consumer relies on
Contract.make {
  request  { method 'GET'; url '/api/orders/42' }
  response {
    status 200
    body([ id: 42, total: 19.99, status: 'PAID' ])   // fields consumers depend on
    headers { contentType(applicationJson()) }
  }
}
// The plugin generates a provider test from this. If someone renames 'total',
// the CI build fails BEFORE it breaks the consumer in production.

// Consumer: be a tolerant reader so additive changes don't break you
// spring.jackson.deserialization.fail-on-unknown-properties=false`,
      codeLanguage: "java",
      explanation:
        "Long-term API maintenance — additive-only within a version, tolerant readers, and consumer-driven contracts to catch breaks in CI.",
      followUps: [
        "Which changes are breaking vs backward compatible?",
        "How do consumer-driven contracts differ from E2E tests?",
        "What is a tolerant reader and why does it matter?",
      ],
    },
  ],
  meta: {
    b169: { difficulty: "easy", priority: "very-high", tags: ["http", "methods", "idempotent"], readMinutes: 4 },
    b170: { difficulty: "easy", priority: "very-high", tags: ["http", "status-codes", "rest"], readMinutes: 4 },
    b171: { difficulty: "medium", priority: "very-high", tags: ["rest", "resource-design", "richardson"], readMinutes: 4 },
    b172: { difficulty: "hard", priority: "very-high", tags: ["idempotency", "retry", "distributed"], readMinutes: 5 },
    b173: { difficulty: "medium", priority: "very-high", tags: ["put", "patch", "concurrency"], readMinutes: 4 },
    b174: { difficulty: "medium", priority: "high", tags: ["content-negotiation", "media-type", "accept"], readMinutes: 4 },
    b175: { difficulty: "medium", priority: "high", tags: ["versioning", "compatibility", "sunset"], readMinutes: 5 },
    b176: { difficulty: "medium", priority: "high", tags: ["pagination", "filtering", "sorting"], readMinutes: 5 },
    b177: { difficulty: "medium", priority: "very-high", tags: ["errors", "problem-detail", "rfc7807"], readMinutes: 5 },
    b178: { difficulty: "medium", priority: "high", tags: ["caching", "etag", "cache-control"], readMinutes: 5 },
    b179: { difficulty: "medium", priority: "very-high", tags: ["cors", "preflight", "browser"], readMinutes: 4 },
    b180: { difficulty: "medium", priority: "high", tags: ["cookies", "samesite", "session"], readMinutes: 4 },
    b181: { difficulty: "easy", priority: "high", tags: ["openapi", "swagger", "springdoc"], readMinutes: 4 },
    b182: { difficulty: "hard", priority: "very-high", tags: ["async", "202", "webhooks"], readMinutes: 5 },
    b183: { difficulty: "medium", priority: "very-high", tags: ["timeout", "retry", "backoff"], readMinutes: 5 },
    b184: { difficulty: "medium", priority: "high", tags: ["circuit-breaker", "bulkhead", "resilience4j"], readMinutes: 5 },
    b185: { difficulty: "hard", priority: "high", tags: ["saga", "outbox", "eventual-consistency"], readMinutes: 5 },
    b186: { difficulty: "medium", priority: "very-high", tags: ["microservices", "monolith", "architecture"], readMinutes: 5 },
    b187: { difficulty: "medium", priority: "high", tags: ["rest", "grpc", "messaging"], readMinutes: 5 },
    b188: { difficulty: "medium", priority: "medium", tags: ["api-gateway", "bff", "edge"], readMinutes: 4 },
    b189: { difficulty: "medium", priority: "very-high", tags: ["feature-design", "end-to-end", "edge-cases"], readMinutes: 5 },
    b190: { difficulty: "medium", priority: "high", tags: ["system-design", "url-shortener", "caching"], readMinutes: 5 },
    b191: { difficulty: "medium", priority: "high", tags: ["rate-limiting", "token-bucket", "redis"], readMinutes: 5 },
    b192: { difficulty: "hard", priority: "medium", tags: ["webhooks", "hmac", "reliability"], readMinutes: 5 },
    b193: { difficulty: "medium", priority: "high", tags: ["compatibility", "contract-testing", "pact"], readMinutes: 5 },
  },
});
