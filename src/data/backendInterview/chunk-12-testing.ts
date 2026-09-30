import { defineBackendChunk } from "./contract";

/**
 * Testing, Debugging & Coding Exercises (b194–b206).
 *
 * Maps to Chapter 8 of the master interview plan (Q173–Q185). Testing strategy,
 * JUnit 5 / Mockito, Spring test slices and Testcontainers, plus the small
 * live-coding exercises that come up in a backend screen.
 */
export const chunk12Testing = defineBackendChunk({
  topic: "testing",
  questions: [
    {
      id: "b194",
      question: "Explain the testing pyramid for a backend service.",
      answer:
        "The pyramid describes the right **mix** of tests by cost and speed:\n\n" +
        "- **Unit tests (base, many)** — a single class/method in isolation, collaborators mocked. Milliseconds, no Spring context, no DB. Where most business-logic coverage lives.\n" +
        "- **Integration tests (middle, some)** — several components together, or a real dependency: repository against a real DB (Testcontainers), a controller through the web layer. Slower; verify wiring, SQL, serialization, transactions.\n" +
        "- **End-to-end (top, few)** — the whole system through its public API. Slowest and most brittle; keep to critical happy paths.\n\n" +
        "**Anti-patterns:** the **ice-cream cone** (mostly slow E2E, few units) — fragile and slow feedback; and testing everything with `@SpringBootTest` (loads the full context each time). \n\n" +
        "Aim for fast feedback: many fast unit tests, targeted integration tests for the risky seams (persistence, external calls), a thin E2E layer. Coverage is a signal, not a goal — 100% line coverage of trivial getters is worthless; test behaviour and edge cases.",
      code: `// UNIT: pure logic, no Spring, collaborator mocked
class PriceCalculatorTest {
    @Test void appliesBulkDiscount() {
        var repo = mock(DiscountRepository.class);
        when(repo.findRate(anyInt())).thenReturn(0.10);
        var calc = new PriceCalculator(repo);
        assertThat(calc.total(100, 20)).isEqualByComparingTo("1800.00");
    }
}
// INTEGRATION: @DataJpaTest + Testcontainers hits real SQL (see later question)
// E2E: @SpringBootTest(webEnvironment=RANDOM_PORT) drives the real HTTP API`,
      codeLanguage: "java",
      explanation:
        "Testing strategy maturity — many fast unit tests, targeted integration, thin E2E; avoid the ice-cream-cone and @SpringBootTest-for-everything.",
      followUps: [
        "What's the ice-cream-cone anti-pattern?",
        "When is @SpringBootTest the wrong choice?",
        "Why is line coverage a weak goal?",
      ],
    },
    {
      id: "b195",
      question: "What are the JUnit 5 fundamentals you use daily?",
      answer:
        "JUnit 5 (Jupiter) essentials:\n\n" +
        "- **Lifecycle:** `@Test`, `@BeforeEach`/`@AfterEach` (per test), `@BeforeAll`/`@AfterAll` (static, once). `@DisplayName` for readable names; `@Disabled` to skip.\n" +
        "- **Assertions:** `assertEquals`, `assertThrows` (returns the exception to assert on its message), `assertAll` (group soft assertions), `assertTimeout`. Most teams use **AssertJ** (`assertThat(x).isEqualTo(...)`) for fluent, readable chains.\n" +
        "- **Parameterized tests:** `@ParameterizedTest` with `@ValueSource`, `@CsvSource`, `@MethodSource`, `@EnumSource` — one test body, many inputs; great for edge cases.\n" +
        "- **Nested/structure:** `@Nested` groups related cases; `@Tag` filters (e.g. `slow`).\n" +
        "- **Assumptions:** `assumeTrue(...)` skips rather than fails when a precondition isn't met.\n" +
        "- **Extensions:** `@ExtendWith` replaces JUnit 4 runners/rules (e.g. `MockitoExtension`, `SpringExtension`).\n\n" +
        "Follow **Arrange-Act-Assert**, one logical assertion per test, deterministic (no real time/random/network), and name tests by behaviour.",
      code: `class DiscountTest {

    @ParameterizedTest(name = "qty {0} -> rate {1}")
    @CsvSource({ "5, 0.00", "10, 0.05", "100, 0.10" })
    void ratesByQuantity(int qty, BigDecimal expected) {
        assertThat(Discount.rateFor(qty)).isEqualByComparingTo(expected);
    }

    @Test
    void rejectsNegativeQuantity() {
        var ex = assertThrows(IllegalArgumentException.class,
                              () -> Discount.rateFor(-1));
        assertThat(ex).hasMessageContaining("quantity");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Baseline testing skill — lifecycle, assertThrows, parameterized tests, AssertJ, and behaviour-focused, deterministic tests.",
      followUps: [
        "How does @ParameterizedTest reduce duplication?",
        "assertThrows vs try/catch — why prefer it?",
        "@BeforeAll vs @BeforeEach?",
      ],
    },
    {
      id: "b196",
      question: "What are the Mockito fundamentals — mock, stub, spy, verify?",
      answer:
        "Mockito isolates the unit under test by replacing collaborators.\n\n" +
        "- **Mock** — a fake object; every method returns a default (null/0/empty) until stubbed.\n" +
        "- **Stub** — define behaviour: `when(repo.find(1)).thenReturn(x)`; `thenThrow(...)` for error paths; for void methods `doThrow(...).when(mock).m()`.\n" +
        "- **Spy** — wraps a **real** object; real methods run unless stubbed (use `doReturn().when(spy)` to avoid calling the real method while stubbing).\n" +
        "- **Verify** — assert interactions happened: `verify(repo).save(order)`, `verify(x, times(2))`, `never()`, `verifyNoMoreInteractions()`.\n" +
        "- **Argument matchers** — `any()`, `eq()`, `argThat(...)`; **ArgumentCaptor** captures the exact argument passed for assertions.\n\n" +
        "Set up with `@ExtendWith(MockitoExtension.class)` + `@Mock`/`@InjectMocks`. Mock the direct collaborators of the class under test, assert on its outputs and (where behaviour is defined by interaction) on the calls it makes.",
      code: `@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository repo;
    @Mock PaymentClient payments;
    @InjectMocks OrderService service;

    @Test
    void chargesAndSaves() {
        when(payments.charge(any())).thenReturn(new Receipt("ok"));

        service.place(new Order(42, new BigDecimal("19.99")));

        var captor = ArgumentCaptor.forClass(Order.class);
        verify(repo).save(captor.capture());               // capture the real arg
        assertThat(captor.getValue().status()).isEqualTo("PAID");
        verify(payments, times(1)).charge(any());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Unit isolation skill — mock/stub/spy/verify, argument matchers and ArgumentCaptor to assert on real arguments.",
      followUps: [
        "mock vs spy — when each?",
        "How do you stub a void method?",
        "When do you use ArgumentCaptor over an eq() matcher?",
      ],
    },
    {
      id: "b197",
      question: "What are the common Mockito pitfalls?",
      answer:
        "- **Over-mocking** — mocking value objects/DTOs or your own logic makes tests assert implementation, not behaviour, and they break on every refactor. Mock only true collaborators (repos, clients, gateways); use real objects for the rest.\n" +
        "- **Testing mocks, not code** — a test that only stubs then verifies the same call tests nothing. Assert on the *result* of the unit.\n" +
        "- **Stubbing a spy the wrong way** — `when(spy.method())` actually **calls the real method**; use `doReturn(x).when(spy).method()`.\n" +
        "- **Unnecessary stubbings** — with strict stubs (default in `MockitoExtension`), an unused `when(...)` fails the test — a good signal to remove it.\n" +
        "- **Static/final/constructor mocking** — historically impossible; now `mockStatic`/`mockConstruction` exist but are a smell. Prefer refactoring to inject a dependency.\n" +
        "- **`equals`/`hashCode` in matchers** — argument matching relies on `equals`; a broken/identity `equals` makes `verify(x).save(order)` fail mysteriously.\n" +
        "- **Deep stubs** (`RETURNS_DEEP_STUBS`) — convenient but hide Law-of-Demeter violations.\n\n" +
        "Rule: mock at the boundaries, assert behaviour, keep tests refactor-resilient.",
      code: `// PITFALL: stubbing a spy calls the real method
List<String> spy = spy(new ArrayList<>());
// when(spy.get(0)).thenReturn("x");     // throws: real get(0) on empty list!
doReturn("x").when(spy).get(0);          // correct: no real call

// PITFALL: verifying the mock you just stubbed proves nothing.
// Instead, assert the OUTPUT of the class under test:
var result = service.summarize(input);
assertThat(result.total()).isEqualTo(expected);  // behaviour, not interaction`,
      codeLanguage: "java",
      explanation:
        "Prevents brittle test suites — mock only collaborators, assert behaviour, stub spies with doReturn, and treat static mocking as a smell.",
      followUps: [
        "Why does when(spy.x()) call the real method?",
        "What do strict stubs catch?",
        "Why is mockStatic usually a design smell?",
      ],
    },
    {
      id: "b198",
      question: "What are Spring Boot test slices and when do you use each?",
      answer:
        "Slices load **only the part of the context** a test needs, so they're far faster than the full app.\n\n" +
        "- **`@WebMvcTest(Controller.class)`** — loads the web layer (controllers, filters, Jackson, validation) only; service/repo beans are `@MockBean`s. Test request mapping, validation, status codes, JSON, error handling via `MockMvc`.\n" +
        "- **`@DataJpaTest`** — loads JPA/repositories + an embedded or Testcontainers DB, wraps each test in a rolled-back transaction. Test queries, mappings, constraints.\n" +
        "- **`@JsonTest`** — Jackson serialization/deserialization only.\n" +
        "- **`@RestClientTest`** — test an HTTP client with a mock server.\n" +
        "- **`@SpringBootTest`** — the **full** context; use sparingly for true integration/E2E (add `webEnvironment=RANDOM_PORT` + `TestRestTemplate`/`WebTestClient` to hit real HTTP).\n\n" +
        "`@MockBean` swaps a bean in the context with a Mockito mock. Prefer the narrowest slice that exercises what you're testing; reserve `@SpringBootTest` for wiring you can't cover otherwise (it's slow and reloads context on config changes).",
      code: `@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockBean OrderService service;                 // service is mocked, not loaded

    @Test
    void returns404WhenMissing() throws Exception {
        when(service.find(7)).thenThrow(new OrderNotFound(7));
        mvc.perform(get("/api/orders/7"))
           .andExpect(status().isNotFound());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Efficient Spring testing — pick the narrowest slice (@WebMvcTest/@DataJpaTest) and reserve @SpringBootTest for real integration.",
      followUps: [
        "@WebMvcTest vs @SpringBootTest — context size?",
        "What does @MockBean do to the context?",
        "How do you test the full HTTP stack on a random port?",
      ],
    },
    {
      id: "b199",
      question: "How do you test repositories, and why Testcontainers over H2?",
      answer:
        "`@DataJpaTest` spins up just the JPA layer. By default Spring Boot uses an **embedded H2**, but H2 is a *different database*: it doesn't behave like PostgreSQL for JSONB, arrays, sequences, upserts, specific SQL, locking, or constraint error messages. Tests can pass on H2 and fail in production — false confidence.\n\n" +
        "**Testcontainers** runs the **real** database (the same PostgreSQL/MySQL version as prod) in a throwaway Docker container for the test. You get true SQL behaviour, real migrations (Flyway), real constraints and error codes.\n\n" +
        "Use `@ServiceConnection` (Boot 3.1+) or `@DynamicPropertySource` to point the datasource at the container. Share one container across the suite (static / singleton) for speed. Run Flyway migrations against it so you test the actual schema. This is the standard for trustworthy persistence tests.",
      code: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // no H2
@Testcontainers
class OrderRepositoryTest {

    @Container
    @ServiceConnection                       // wires datasource to this container
    static PostgreSQLContainer<?> db =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired OrderRepository repo;

    @Test
    void enforcesUniqueEmail() {
        repo.save(new Customer("a@x.com"));
        assertThatThrownBy(() -> repo.saveAndFlush(new Customer("a@x.com")))
            .isInstanceOf(DataIntegrityViolationException.class);   // real PG constraint
    }
}`,
      codeLanguage: "java",
      explanation:
        "Realistic persistence testing — Testcontainers runs the real DB so JSONB/sequences/constraints behave like prod, unlike H2.",
      followUps: [
        "What breaks when you test on H2 but run PostgreSQL?",
        "How do you share one container across the suite?",
        "How does @ServiceConnection wire the datasource?",
      ],
    },
    {
      id: "b200",
      question: "Why can @Transactional in tests give false positives?",
      answer:
        "Spring wraps each `@Transactional` test (and `@DataJpaTest`) in a transaction that is **rolled back** at the end — great for isolation and a clean DB between tests. But it changes behaviour and can hide bugs:\n\n" +
        "- **Nothing is committed**, so `@PostCommit` logic, DB triggers on commit, and code that spans multiple transactions aren't exercised.\n" +
        "- **No flush by default** — the persistence context may satisfy a `find` from the L1 cache without ever hitting the DB, so a broken mapping or constraint isn't caught. Call `flush()`/`saveAndFlush` (or `TestEntityManager.flush()`) to force SQL and surface constraint violations.\n" +
        "- **Lazy loading 'works'** in the test because the session stays open — masking `LazyInitializationException` that would happen in production.\n" +
        "- Auto-generated ids/sequences behave differently under rollback.\n\n" +
        "Fixes: flush to force SQL, `@Commit` when you need real commit semantics, and complement rolled-back slice tests with a few Testcontainers integration tests that actually commit.",
      code: `@DataJpaTest
class MappingTest {
    @Autowired TestEntityManager em;

    @Test
    void notNullConstraintIsEnforced() {
        Order o = new Order();      // required field left null
        em.persist(o);
        // Without flush, the INSERT may never run and the test wrongly passes:
        assertThatThrownBy(em::flush)               // force SQL now
            .isInstanceOf(PersistenceException.class);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Subtle persistence test issue — rollback + no-flush + open session hide missing SQL, constraints and LazyInit; flush to make them real.",
      followUps: [
        "Why does a test pass without hitting the DB?",
        "Why does lazy loading 'work' only in tests?",
        "When do you use @Commit?",
      ],
    },
    {
      id: "b201",
      question: "How do you test a controller (MockMvc / WebTestClient)?",
      answer:
        "Controller tests verify the **web contract**: routing, request binding, validation, status codes, headers, JSON body, and error handling — without a browser or the full service.\n\n" +
        "- **`@WebMvcTest` + `MockMvc`** (Spring MVC) — perform requests against the dispatcher, mock the service with `@MockBean`, assert with `status()`, `jsonPath()`, `header()`. Fast and focused.\n" +
        "- **`WebTestClient`** — the reactive/WebFlux equivalent; also usable end-to-end against a running server.\n\n" +
        "Cover: happy path (200/201 + body), validation failures (400/422 + error shape from your `@ControllerAdvice`), not-found (404), and auth (with `@WithMockUser`/`spring-security-test` when the security filter is in the slice). Assert the **JSON structure** (`jsonPath`), not just the status, so response-shape regressions are caught. For request bodies, test binding and `@Valid` rejection.\n\n" +
        "Keep business assertions in service unit tests; the controller test's job is the HTTP boundary.",
      code: `@WebMvcTest(OrderController.class)
class OrderControllerWebTest {
    @Autowired MockMvc mvc;
    @MockBean OrderService service;

    @Test
    void validationReturns400WithErrorShape() throws Exception {
        mvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\\"amount\\": -5}"))            // invalid: @Positive
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
           .andExpect(jsonPath("$.errors[0].field").value("amount"));
    }

    @Test
    void createsOrder() throws Exception {
        when(service.create(any())).thenReturn(new Order(1L));
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\\"amount\\": 10}"))
           .andExpect(status().isCreated())
           .andExpect(header().string("Location", "/api/orders/1"));
    }
}`,
      codeLanguage: "java",
      explanation:
        "API behaviour verification — MockMvc for routing/validation/status/JSON and error contract, with the service mocked at the boundary.",
      followUps: [
        "How do you test a secured endpoint in a slice?",
        "Why assert jsonPath, not just status?",
        "MockMvc vs WebTestClient — when each?",
      ],
    },
    {
      id: "b202",
      question: "Walk me through how you debug an issue in production.",
      answer:
        "Show a calm, structured method:\n\n" +
        "1. **Assess impact & mitigate first** — scope (which users/endpoints), severity, error rate. If it's an incident, mitigate now (roll back the recent deploy, disable the feature flag, scale out) *before* root-causing. Communicate status.\n" +
        "2. **Gather evidence** — logs (filter by the correlation/trace id), metrics (latency/error/saturation — the RED/USE signals), traces, recent deploys/config/traffic changes. 'What changed?' is the highest-value question.\n" +
        "3. **Form a hypothesis** — narrow to a component (DB, downstream, GC, thread pool). Reproduce in staging with the same input if possible.\n" +
        "4. **Deep tools** — thread dump (`jstack`) for hangs/deadlocks, heap dump for OOM/leaks, `EXPLAIN` for slow queries, DB lock views.\n" +
        "5. **Fix & verify** — smallest safe change, add a test that reproduces the bug, confirm metrics recover.\n" +
        "6. **Follow up** — blameless post-mortem, add monitoring/alerts so it's caught earlier next time.\n\n" +
        "The interviewer wants **mitigate-then-diagnose**, evidence over guessing, and 'what changed?' instincts.",
      code: `# Correlate everything by trace id (logged via MDC on every line)
grep "traceId=8f3c..." app.log | less

# Hung/slow threads: capture a thread dump and look for BLOCKED / lock cycles
jcmd <pid> Thread.print > threads.txt

# JVM at a glance: GC, heap, threads while it's misbehaving
jcmd <pid> GC.heap_info
jcmd <pid> VM.native_memory summary   # if NMT enabled

# Slow endpoint? confirm the query plan
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;`,
      codeLanguage: "bash",
      explanation:
        "Senior troubleshooting behaviour — mitigate first, gather evidence, ask 'what changed?', use dumps/EXPLAIN, then fix with a regression test.",
      followUps: [
        "What do you do first in an active incident?",
        "Which metrics tell you where to look (RED/USE)?",
        "How does a correlation id speed up debugging?",
      ],
    },
    {
      id: "b203",
      question: "Coding: count word frequencies from a log/text and return the top N.",
      answer:
        "A classic warm-up testing maps, streams and edge cases. Steps:\n\n" +
        "1. Tokenize — split on non-letters, lowercase, drop empties.\n" +
        "2. Count — `Map<String,Long>` via `groupingBy(counting())` (or `merge(w,1,Integer::sum)`).\n" +
        "3. Top N — sort entries by count descending (tie-break alphabetically for determinism) and take N — ideally with a bounded **min-heap** of size N for `O(m log N)` instead of sorting everything `O(m log m)`.\n\n" +
        "**Edge cases to mention:** null/empty input, punctuation and case, Unicode, ties (define an order), N larger than the vocabulary, and huge input (stream line-by-line rather than loading all text). Talk through complexity: counting is `O(total tokens)`; top-N heap is `O(m log N)` where m is distinct words.",
      code: `static List<Map.Entry<String, Long>> topWords(String text, int n) {
    if (text == null || text.isBlank() || n <= 0) return List.of();

    Map<String, Long> counts = Arrays.stream(text.toLowerCase().split("[^\\\\p{L}]+"))
            .filter(w -> !w.isEmpty())
            .collect(Collectors.groupingBy(w -> w, Collectors.counting()));

    // Bounded min-heap of size n: O(m log n)
    PriorityQueue<Map.Entry<String, Long>> heap = new PriorityQueue<>(
            Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue)
                      .thenComparing(Map.Entry::getKey, Comparator.reverseOrder()));
    for (var e : counts.entrySet()) {
        heap.offer(e);
        if (heap.size() > n) heap.poll();          // evict smallest
    }
    var result = new ArrayList<>(heap);
    result.sort(Comparator.comparingLong(Map.Entry<String,Long>::getValue).reversed()
                          .thenComparing(Map.Entry::getKey));
    return result;
}`,
      codeLanguage: "java",
      explanation:
        "Common coding task — grouping/counting with streams, a bounded heap for top-N, and articulating edge cases + complexity.",
      followUps: [
        "Why a bounded heap instead of full sort?",
        "How do you break ties deterministically?",
        "How would you handle a file too big for memory?",
      ],
    },
    {
      id: "b204",
      question: "Coding: group and summarize a list of objects with streams.",
      answer:
        "Interviewers use this to test Stream/Collectors fluency on realistic data (e.g. orders). Show:\n\n" +
        "- **groupingBy** with a **downstream collector**: count, sum, average, or map to another shape.\n" +
        "- `summingDouble`/`averagingInt`, `mapping(...)`, `toMap` with a **merge function** to avoid `IllegalStateException` on duplicate keys.\n" +
        "- Sorting a grouped result, finding max per group (`maxBy`), partitioning.\n\n" +
        "**Pitfalls to call out:** `Collectors.toMap` throws on duplicate keys unless you pass a merge function; streams shouldn't mutate external state (no side effects in `forEach` for logic); null keys break `groupingBy` (guard them); and prefer readable pipelines over one giant unreadable chain. Mention time complexity is `O(n)` for the grouping pass.",
      code: `record Order(String customer, String status, BigDecimal amount) {}

// Revenue per customer, only PAID orders, sorted high -> low
Map<String, BigDecimal> revenue = orders.stream()
    .filter(o -> "PAID".equals(o.status()))
    .collect(Collectors.groupingBy(Order::customer,
             Collectors.reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add)));

var ranked = revenue.entrySet().stream()
    .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
    .toList();

// Count orders per status
Map<String, Long> byStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status, Collectors.counting()));

// toMap needs a merge function when keys can collide:
Map<String, BigDecimal> latest = orders.stream()
    .collect(Collectors.toMap(Order::customer, Order::amount,
                              (a, b) -> b));         // keep the last`,
      codeLanguage: "java",
      explanation:
        "Practical Java fluency — groupingBy with downstream collectors, toMap merge functions, and avoiding side effects/null-key traps.",
      followUps: [
        "Why does toMap throw on duplicate keys?",
        "How do you find the max element per group?",
        "Why avoid side effects inside a stream?",
      ],
    },
    {
      id: "b205",
      question: "Coding: implement an LRU cache.",
      answer:
        "**LRU (Least Recently Used)** evicts the entry unused for the longest time when capacity is exceeded. Requirements: `get` and `put` in **O(1)**, and O(1) eviction of the least-recent.\n\n" +
        "Two approaches:\n\n" +
        "1. **`LinkedHashMap` with access order** — pass `accessOrder=true` and override `removeEldestEntry`. It maintains a doubly-linked list in access order for you; eviction is automatic. Simplest correct answer.\n" +
        "2. **Hand-rolled `HashMap` + doubly-linked list** — the map gives O(1) lookup to a node; the list tracks recency (move-to-front on access, remove-from-tail on evict). This is the version interviewers usually want you to code, to prove you understand the O(1) mechanics.\n\n" +
        "**Follow-ups:** thread safety (wrap with locks or use a striped/segment design; `Collections.synchronizedMap` isn't enough for the compound get-then-move), and for production use **Caffeine** (near-optimal hit rate, TTL, size, async). Mention concurrency and TTL to score points.",
      code: `// Simplest: LinkedHashMap in access order with automatic eviction
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LruCache(int capacity) {
        super(16, 0.75f, true);            // accessOrder = true
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;          // evict least-recently-accessed
    }
}

// Usage
var cache = Collections.synchronizedMap(new LruCache<Integer, String>(3));
cache.put(1, "a"); cache.put(2, "b"); cache.put(3, "c");
cache.get(1);                              // 1 now most-recent
cache.put(4, "d");                         // evicts 2 (least-recent)`,
      codeLanguage: "java",
      explanation:
        "Backend-oriented coding problem — O(1) LRU via LinkedHashMap access-order or hashmap+DLL, plus thread-safety/Caffeine follow-ups.",
      followUps: [
        "How does the hashmap + doubly-linked-list version get O(1)?",
        "Why isn't synchronizedMap enough for concurrency?",
        "When would you reach for Caffeine?",
      ],
    },
    {
      id: "b206",
      question: "SQL coding: find duplicates and the second-highest value.",
      answer:
        "Two very common SQL live-coding asks.\n\n" +
        "**Find duplicates** — `GROUP BY` the candidate columns and keep groups with `COUNT(*) > 1` via `HAVING`. To list the actual duplicate rows (not just the keys), use a window function `COUNT(*) OVER (PARTITION BY ...)`.\n\n" +
        "**Second highest** — several correct approaches: `DENSE_RANK()` (handles ties correctly — 'second distinct salary'), a `LIMIT 1 OFFSET 1` over distinct ordered values (simple but ties/edge cases), or a correlated subquery. Prefer `DENSE_RANK` and clarify whether ties count as the same rank.\n\n" +
        "**Edge cases to state:** NULLs (excluded by aggregates; decide handling), ties (RANK vs DENSE_RANK vs ROW_NUMBER), and 'what if there is no second value' (returns no row). Mentioning tie semantics is what separates a strong answer.",
      code: `-- Duplicate emails (the keys)
SELECT email, COUNT(*) AS n
FROM   users
GROUP  BY email
HAVING COUNT(*) > 1;

-- The actual duplicate ROWS
SELECT * FROM (
  SELECT u.*, COUNT(*) OVER (PARTITION BY email) AS c FROM users u
) t
WHERE c > 1;

-- Second-highest DISTINCT salary (ties handled by DENSE_RANK)
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM   employees
) r
WHERE rnk = 2
LIMIT 1;`,
      codeLanguage: "sql",
      explanation:
        "SQL live-coding readiness — GROUP BY/HAVING for duplicates, DENSE_RANK for Nth-highest, and articulating tie/NULL semantics.",
      followUps: [
        "DENSE_RANK vs ROW_NUMBER for 'second highest'?",
        "How do you return the full duplicate rows, not just keys?",
        "What happens with NULLs or when no second value exists?",
      ],
    },
  ],
  meta: {
    b194: { difficulty: "easy", priority: "high", tags: ["testing", "pyramid", "strategy"], readMinutes: 4 },
    b195: { difficulty: "easy", priority: "high", tags: ["junit5", "parameterized", "assertj"], readMinutes: 4 },
    b196: { difficulty: "medium", priority: "very-high", tags: ["mockito", "mock", "verify"], readMinutes: 4 },
    b197: { difficulty: "medium", priority: "high", tags: ["mockito", "pitfalls", "spy"], readMinutes: 4 },
    b198: { difficulty: "medium", priority: "very-high", tags: ["spring-test", "webmvctest", "slices"], readMinutes: 5 },
    b199: { difficulty: "medium", priority: "high", tags: ["testcontainers", "datajpatest", "postgres"], readMinutes: 5 },
    b200: { difficulty: "hard", priority: "high", tags: ["transactional", "flush", "false-positive"], readMinutes: 4 },
    b201: { difficulty: "medium", priority: "high", tags: ["mockmvc", "controller", "validation"], readMinutes: 5 },
    b202: { difficulty: "medium", priority: "very-high", tags: ["debugging", "incident", "triage"], readMinutes: 5 },
    b203: { difficulty: "medium", priority: "high", tags: ["exercise", "streams", "top-n"], readMinutes: 4 },
    b204: { difficulty: "medium", priority: "high", tags: ["exercise", "collectors", "grouping"], readMinutes: 4 },
    b205: { difficulty: "medium", priority: "high", tags: ["exercise", "lru", "linkedhashmap"], readMinutes: 5 },
    b206: { difficulty: "medium", priority: "high", tags: ["exercise", "sql", "window-functions"], readMinutes: 4 },
  },
});
