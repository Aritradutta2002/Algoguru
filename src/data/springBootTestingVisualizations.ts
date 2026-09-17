import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Testing — Diagram Data                                       */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springBootTestingVisualizations: Record<string, Diagram> = {
  /* ── Testing in Spring Boot ── */
  "test-intro": {
    type: "layers",
    title: "The Testing Pyramid",
    data: [
      {
        label: "Unit tests — fastest, most numerous",
        color: "success",
        children: [
          { label: "Plain JUnit 5 + Mockito, no Spring context" },
          { label: "Pure domain logic, algorithms, mappers" },
        ],
      },
      {
        label: "Slice tests — focused Spring context",
        color: "info",
        children: [
          { label: "@WebMvcTest, @DataJpaTest, @JsonTest, @RestClientTest" },
          { label: "Only the beans of one layer are loaded" },
        ],
      },
      {
        label: "Integration tests — full fidelity, slowest",
        color: "warning",
        children: [
          { label: "@SpringBootTest with the whole context" },
          { label: "Testcontainers for real databases and brokers" },
        ],
      },
      {
        label: "spring-boot-starter-test brings",
        color: "accent",
        children: [
          { label: "JUnit 5 (Jupiter)" },
          { label: "Mockito · AssertJ · Hamcrest" },
          { label: "MockMvc · JsonPath · Awaitility" },
        ],
      },
    ],
  },

  /* ── Unit Testing with JUnit 5 ── */
  "test-junit5": {
    type: "table-visual",
    title: "JUnit 5 Jupiter Essentials",
    data: [
      {
        label: "Lifecycle annotations",
        color: "primary",
        children: [
          { label: "@Test, @DisplayName" },
          { label: "@BeforeEach / @AfterEach — per test" },
          { label: "@BeforeAll / @AfterAll — static, per class" },
        ],
      },
      {
        label: "@ParameterizedTest",
        color: "info",
        children: [
          { label: "@ValueSource, @CsvSource, @MethodSource" },
          { label: "One body, many data sets" },
        ],
      },
      {
        label: "@Nested & @Disabled",
        color: "accent",
        children: [{ label: "Grouped scenarios inside one class" }, { label: "@Tag for filtered runs" }],
      },
      {
        label: "Assertions",
        color: "success",
        children: [
          { label: "assertThat(...) — AssertJ fluent style" },
          { label: "assertThrows, assertAll" },
          { label: "No Spring context needed" },
        ],
      },
    ],
  },

  /* ─ Mockito & Mocking ── */
  "test-mockito": {
    type: "flow",
    title: "Mockito Collaborator Isolation",
    direction: "horizontal",
    data: [
      {
        label: "@ExtendWith(MockitoExtension.class)",
        color: "info",
        children: [{ label: "Initialises annotated mocks" }],
      },
      {
        label: "@Mock OrderRepository\n@Mock PaymentGateway",
        color: "primary",
        children: [{ label: "Test doubles, no real I/O" }],
      },
      {
        label: "@InjectMocks OrderService",
        color: "accent",
        children: [{ label: "Mocks injected by type" }],
      },
      {
        label: "Stub → act → verify",
        color: "success",
        children: [
          { label: "when(repo.findById(1L)).thenReturn(Optional.of(order))" },
          { label: "verify(gateway, times(1)).charge(any())" },
        ],
      },
    ],
  },
  /* ── @SpringBootTest ── */
  "test-springboottest": {
    type: "layers",
    title: "@SpringBootTest — Full Context, Real Port",
    data: [
      {
        label: "Whole ApplicationContext is started",
        color: "primary",
        children: [
          { label: "All auto-configurations, all beans" },
          { label: "Context is cached and reused across test classes" },
        ],
      },
      {
        label: "webEnvironment options",
        color: "info",
        children: [
          { label: "MOCK (default) — MockMvc, no real server" },
          { label: "RANDOM_PORT / DEFINED_PORT — real servlet container" },
          { label: "NONE — non-web integration test" },
        ],
      },
      {
        label: "Real HTTP client",
        color: "accent",
        children: [
          { label: "@LocalServerPort int port injects the dynamic port" },
          { label: "TestRestTemplate / WebTestClient" },
          { label: "RestClient + @ServiceConnection" },
        ],
      },
      {
        label: "Trade-off",
        color: "warning",
        children: [{ label: "Highest fidelity, slowest, heaviest feedback loop" }],
      },
    ],
  },

  /* ── @WebMvcTest ── */
  "test-webmvctest": {
    type: "layers",
    title: "@WebMvcTest — The Web Slice",
    data: [
      {
        label: "Loaded",
        color: "success",
        children: [
          { label: "@Controller / @RestController / @ControllerAdvice" },
          { label: "Jackson, Validator, WebMvcConfigurer" },
          { label: "MockMvc infrastructure" },
        ],
      },
      {
        label: "Not loaded",
        color: "warning",
        children: [
          { label: "@Service, @Repository, @Component" },
          { label: "DataSource — no DB connection attempted" },
        ],
      },
      {
        label: "Collaborators replaced",
        color: "accent",
        children: [{ label: "@MockitoBean / @MockBean on required services" }],
      },
      {
        label: "Assertions",
        color: "info",
        children: [
          { label: "mockMvc.perform(get(\"/api/v1/courses\")).andExpect(status().isOk())" },
          { label: "jsonPath(\"$.title\").value(\"DSA\")" },
          { label: "Fast — no network, no DB" },
        ],
      },
    ],
  },

  /* ── @DataJpaTest ─ */
  "test-datajpatest": {
    type: "flow",
    title: "@DataJpaTest — Persistence Slice",
    direction: "vertical",
    data: [
      {
        label: "Loads @Entity, repositories, DataSource, EntityManager",
        color: "primary",
        children: [{ label: "No controllers or services" }],
      },
      {
        label: "Transaction per test — rolled back afterwards",
        color: "info",
        children: [{ label: "Database state never leaks between tests" }],
      },
      {
        label: "TestEntityManager for fixtures",
        color: "accent",
        children: [
          { label: "persist / flush / clear" },
          { label: "Flush-then-clear proves the query really hits the DB" },
        ],
      },
      {
        label: "Embedded DB by default (H2)",
        color: "warning",
        children: [{ label: "@AutoConfigureTestDatabase(replace = NONE) with Testcontainers" }],
      },
    ],
  },

  /* ── @MockBean vs @MockitoBean ─ */
  "test-mockbean": {
    type: "table-visual",
    title: "Replacing Beans in the ApplicationContext",
    data: [
      {
        label: "@MockBean",
        color: "warning",
        children: [
          { label: "Spring Boot 2.x / early 3.x" },
          { label: "Deprecated in Boot 3.4" },
          { label: "Replaces the matching bean definition" },
        ],
      },
      {
        label: "@MockitoBean",
        color: "success",
        children: [
          { label: "Spring Framework 6.2+ / Boot 3.4+" },
          { label: "Framework-level, not Boot-level" },
          { label: "The forward-looking choice" },
        ],
      },
      {
        label: "Both support",
        color: "info",
        children: [
          { label: "Stubbing with when(...)" },
          { label: "verify(...) interactions" },
          { label: "@MockitoSpyBean - wraps the real bean" },
        ],
      },
      {
        label: "Cost",
        color: "accent",
        children: [
          { label: "Each new mock variant invalidates the context cache" },
          { label: "Many bean-mock combinations → slow suites" },
        ],
      },
    ],
  },

  /* ── Testcontainers ─ */
  "test-testcontainers": {
    type: "flow",
    title: "Testcontainers — Real Infrastructure in Docker",
    direction: "vertical",
    data: [
      {
        label: "@Testcontainers + @Container PostgreSQLContainer<?>",
        color: "primary",
        children: [{ label: "docker pull postgres:16-alpine" }],
      },
      {
        label: "Container starts before the context",
        color: "info",
        children: [{ label: "Random mapped port → no clashes with local DB" }],
      },
      {
        label: "@ServiceConnection",
        color: "accent",
        children: [
          { label: "Boot 3.1+ writes spring.datasource.* automatically" },
          { label: "No @DynamicPropertySource boilerplate" },
        ],
      },
      {
        label: "Tests run against the real engine",
        color: "success",
        children: [
          { label: "PostgreSQL / MySQL / Kafka differences disappear" },
          { label: "Containers destroyed after the run (Ryuk)" },
        ],
      },
    ],
  },
  /* ── Integration Testing ── */
  "test-integration": {
    type: "flow",
    title: "End-to-End Integration Test",
    direction: "horizontal",
    data: [
      {
        label: "HTTP client\nTestRestTemplate",
        color: "primary",
        children: [{ label: "@LocalServerPort RANDOM_PORT" }],
      },
      { label: "Controller\n+ @ControllerAdvice", color: "info" },
      { label: "Service layer\n+ transactions", color: "accent" },
      {
        label: "Real database\n(Testcontainers)",
        color: "success",
        children: [{ label: "Isolated & idempotent state" }],
      },
      {
        label: "External services stubbed",
        color: "warning",
        children: [
          { label: "WireMock for third-party HTTP" },
          { label: "@DirtiesContext when state changed" },
        ],
      },
    ],
  },

  /* ── Test Profiles ─ */
  "test-profiles": {
    type: "layers",
    title: "Test Profile Wiring",
    data: [
      {
        label: "@ActiveProfiles(\"test\")",
        color: "primary",
        children: [{ label: "Applied to the test class or the base test class" }],
      },
      {
        label: "src/test/resources/application-test.yml",
        color: "info",
        children: [
          { label: "Overrides the main application.yml" },
          { label: "Test-only datasource, ports, feature flags" },
        ],
      },
      {
        label: "@Profile(\"test\") beans",
        color: "accent",
        children: [
          { label: "Fake notification gateway" },
          { label: "In-memory cache instead of Redis" },
          { label: "Security disabled for endpoint tests" },
        ],
      },
      {
        label: "Isolation rule",
        color: "success",
        children: [{ label: "Production beans stay untouched" }],
      },
    ],
  },

  /* ─ Code Coverage ── */
  "test-coverage": {
    type: "flow",
    title: "JaCoCo — Coverage as a Build Gate",
    direction: "vertical",
    data: [
      {
        label: "Test execution with the JaCoCo agent attached",
        color: "primary",
        children: [{ label: "Bytecode instrumentation records probes" }],
      },
      {
        label: "jacoco.exec (binary coverage data)",
        color: "info",
      },
      {
        label: "Report generation",
        color: "accent",
        children: [
          { label: "HTML + XML + CSV" },
          { label: "target/site/jacoco/index.html" },
        ],
      },
      {
        label: "Metrics",
        color: "warning",
        children: [
          { label: "Line coverage · Branch coverage" },
          { label: "Cyclomatic complexity" },
        ],
      },
      {
        label: "jacoco:check",
        color: "success",
        children: [{ label: "Fails the CI build below the threshold" }],
      },
    ],
  },

  /* ── Slice Annotations Overview ─ */
  "test-slice": {
    type: "table-visual",
    title: "Which Slice Loads What",
    data: [
      {
        label: "@WebMvcTest",
        color: "info",
        children: [
          { label: "Controllers, filters, @ControllerAdvice" },
          { label: "MockMvc, Jackson, Validator" },
          { label: "Services → mocked" },
        ],
      },
      {
        label: "@DataJpaTest",
        color: "primary",
        children: [
          { label: "Entities, repositories, EntityManager" },
          { label: "Rolls back each test" },
          { label: "TestEntityManager fixtures" },
        ],
      },
      {
        label: "@JsonTest",
        color: "accent",
        children: [{ label: "Jackson serialisation only" }, { label: "ObjectMapper configuration" }],
      },
      {
        label: "@RestClientTest",
        color: "success",
        children: [
          { label: "HTTP client beans" },
          { label: "MockRestServiceServer stubs the remote" },
        ],
      },
      {
        label: "Why slices win",
        color: "muted",
        children: [
          { label: "Minimal bean set → seconds not minutes" },
          { label: "Real Spring wiring per layer" },
        ],
      },
    ],
  },
};