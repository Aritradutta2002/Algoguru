import { ContentSection } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Testing — Complete In-Depth Theory                            */
/*  Covers JUnit 5, Mockito, @SpringBootTest, Slice Tests (@WebMvcTest,       */
/*  @DataJpaTest), @MockBean/@MockitoBean, Testcontainers, and JaCoCo.        */
/*  Written against Spring Boot 3.x / Spring Framework 6.x / Java 17+.        */
/* -------------------------------------------------------------------------- */

export const springBootTestingContent: ContentSection[] = [
  {
    id: "test-intro",
    title: "Testing in Spring Boot",
    difficulty: "Easy",
    theory: [
      "Software testing in Spring Boot is organized around the **Test Pyramid**:",
      "1. **Unit Tests (Base)**: Test isolated classes (services, utilities, domain logic) in pure Java without starting a Spring container. Executed with JUnit 5 and Mockito. Fast (milliseconds per test) and numerous.",
      "2. **Slice Tests (Middle)**: Test specific application subsystems (Web MVC controllers, JPA repositories, JSON serialization) by booting a minimal sliced `ApplicationContext`. Fast (hundreds of milliseconds).",
      "3. **Integration Tests (Top)**: Test end-to-end workflows by booting the full `ApplicationContext` with a live server, real database (via Testcontainers), and full filter chains. Slower, highly realistic.",
      "The starter **`spring-boot-starter-test`** is the primary testing dependency. It automatically bundles: JUnit 5 Jupiter, Mockito, AssertJ, Hamcrest, JSONassert, JsonPath, and Spring Test (`MockMvc`, `TestRestTemplate`, `WebTestClient`)."
    ],
    keyPoints: [
      "Follows the Testing Pyramid: Unit Tests -> Slice Tests -> Integration Tests.",
      "`spring-boot-starter-test` includes JUnit 5, Mockito, AssertJ, and MockMvc.",
      "Unit tests run without a Spring context for maximum speed.",
      "Slice tests boot only relevant Spring components for targeted verification."
    ],
    code: [
      {
        title: "Test Starter Dependency in pom.xml",
        language: "xml",
        content: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>`
      }
    ],
    note: "Spring Boot 3 uses JUnit 5 (Jupiter) by default. Legacy JUnit 4 annotations (`@RunWith(SpringRunner.class)`) are replaced by `@ExtendWith(SpringExtension.class)` (which is already included inside `@SpringBootTest`)."
  },
  {
    id: "test-junit5",
    title: "Unit Testing with JUnit 5",
    difficulty: "Easy",
    theory: [
      "**JUnit 5 (Jupiter)** is the modern standard unit testing framework in the Java ecosystem.",
      "**Core Annotations (`org.junit.jupiter.api`)**:",
      "- `@Test`: Marks a test method.",
      "- `@BeforeEach` / `@AfterEach`: Executed before/after every individual test method (replaces JUnit 4 `@Before` / `@After`).",
      "- `@BeforeAll` / `@AfterAll`: Executed once before/after all tests in the class (must be static unless `@TestInstance(PER_CLASS)` is used).",
      "- `@DisplayName(\"...\")`: Provides a readable, descriptive name for the test in IDE and CI test reports.",
      "- `@Disabled`: Skips test execution (replaces `@Ignore`).",
      "- **Parameterized Tests (`@ParameterizedTest`)**: Runs the same test multiple times with varying inputs using `@ValueSource`, `@CsvSource`, or `@MethodSource`.",
      "**Fluent Assertions with AssertJ**:",
      "Spring Boot developers prefer **AssertJ** over basic JUnit assertions for its readable, chainable fluent API: `assertThat(actual).isNotNull().hasSize(3).contains(\"AlgoGuru\");`."
    ],
    keyPoints: [
      "Uses Jupiter annotations: `@Test`, `@BeforeEach`, `@BeforeAll`, `@DisplayName`.",
      "`@ParameterizedTest` allows testing multiple input data sets cleanly.",
      "AssertJ (`assertThat(...)`) provides fluent, expressive assertions with clear failure messages.",
      "No Spring context is needed for pure unit tests."
    ],
    code: [
      {
        title: "JUnit 5 Unit Test with AssertJ and Parameterized Tests",
        language: "java",
        content: `package com.algoguru.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CalculatorServiceTest {

    private CalculatorService service;

    @BeforeEach
    void setUp() {
        service = new CalculatorService();
    }

    @Test
    @DisplayName("Should correctly calculate compound interest")
    void calculateInterestSuccess() {
        double result = service.calculateInterest(1000.0, 0.05, 2);
        assertThat(result).isCloseTo(1102.50, org.assertj.core.data.Offset.offset(0.01));
    }

    @ParameterizedTest
    @ValueSource(doubles = { -10.0, 0.0 })
    @DisplayName("Should throw exception for non-positive principals")
    void invalidPrincipalThrows(double principal) {
        assertThatThrownBy(() -> service.calculateInterest(principal, 0.05, 1))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Principal must be positive");
    }
}`
      }
    ],
    tip: "Write test method names following the `given_when_then` or `shouldDoAction_whenCondition` convention for maximum readability."
  },
  {
    id: "test-mockito",
    title: "Mockito & Mocking",
    difficulty: "Medium",
    theory: [
      "In unit testing, classes rarely operate in complete isolation; they collaborate with external services, repositories, or HTTP clients. **Mockito** is the leading Java mocking framework that creates simulated 'mock' implementations of collaborator classes.",
      "**Core Mockito Features**:",
      "1. **`@Mock`**: Creates a dummy mock instance of an interface or class. By default, mock methods return default values (`null`, `0`, `false`, or empty collections).",
      "2. **`@InjectMocks`**: Instantiates the class under test and automatically injects all annotated `@Mock` fields into its constructor or fields.",
      "3. **Stubbing (`when(...).thenReturn(...)`)**: Defines expected behavior when a mock method is called: `when(repository.findById(1L)).thenReturn(Optional.of(sampleUser))`.",
      "4. **Argument Matchers (`any()`, `eq()`, `anyString()`)**: Allows flexible matching on method invocation arguments.",
      "5. **Verification (`verify(mock, times(1)).methodName(...)`)**: Asserts that a mock method was called a specific number of times with expected arguments.",
      "To enable Mockito annotations in JUnit 5, annotate the test class with **`@ExtendWith(MockitoExtension.class)`**."
    ],
    keyPoints: [
      "`@ExtendWith(MockitoExtension.class)` enables Mockito in JUnit 5 tests.",
      "`@Mock` creates mocks; `@InjectMocks` injects mocks into the test target.",
      "Stub method return values with `when(mock.method()).thenReturn(...)`.",
      "Verify interaction counts using `verify(mock, times(n)).method(...)`."
    ],
    code: [
      {
        title: "Service Unit Test with Mockito Mocking and Verification",
        language: "java",
        content: `package com.algoguru.service;

import com.algoguru.entity.User;
import com.algoguru.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // Initializes @Mock and @InjectMocks
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void findUserByEmailSuccess() {
        // Arrange
        User mockUser = new User("Aritra", "aritra@algoguru.com");
        when(userRepository.findByEmail("aritra@algoguru.com")).thenReturn(Optional.of(mockUser));

        // Act
        User result = userService.getByEmail("aritra@algoguru.com");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("aritra@algoguru.com");

        // Verify that the repository method was called exactly once
        verify(userRepository, times(1)).findByEmail("aritra@algoguru.com");
        verifyNoMoreInteractions(userRepository);
    }
}`
      }
    ],
    warning: "If you use an argument matcher like `any()` for one parameter, **all** parameters in that method call must use argument matchers. Mixing raw literals with matchers throws `InvalidUseOfMatchersException`."
  },
  {
    id: "test-springboottest",
    title: "@SpringBootTest",
    difficulty: "Medium",
    theory: [
      "**`@SpringBootTest`** is the primary annotation for full-context integration testing in Spring Boot. It starts the entire Spring `ApplicationContext`, discovering configuration via `@SpringBootConfiguration` (from `@SpringBootApplication`).",
      "**`webEnvironment` Modes**:",
      "1. `WebEnvironment.MOCK` (Default): Sets up a mock servlet environment. Does not start an embedded server. Controller requests are executed using `MockMvc`.",
      "2. `WebEnvironment.RANDOM_PORT`: Starts a real, live embedded web server (Tomcat/Jetty) listening on an available ephemeral port. Prevents port collision during parallel CI builds. Injected via `@LocalServerPort` and tested using `TestRestTemplate` or `WebTestClient`.",
      "3. `WebEnvironment.DEFINED_PORT`: Starts server on the port defined in `application.properties` (typically 8080). Risky for automated builds.",
      "4. `WebEnvironment.NONE`: Boots non-web Spring context (for testing background services, batch jobs, or messaging)."
    ],
    keyPoints: [
      "`@SpringBootTest` boots the full application context with all registered beans.",
      "Use `webEnvironment = WebEnvironment.RANDOM_PORT` for real HTTP server testing.",
      "Inject the dynamic port with `@LocalServerPort int port`.",
      "Heavier than slice tests, but provides highest fidelity integration verification."
    ],
    code: [
      {
        title: "Full Integration Test on a Live Random Port with TestRestTemplate",
        language: "java",
        content: `package com.algoguru.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HealthEndpointIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void healthCheckReturnsUp() {
        String url = "http://localhost:" + port + "/api/v1/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Running");
    }
}`
      }
    ],
    tip: "Spring caches the `ApplicationContext` across test classes with identical configuration, making subsequent `@SpringBootTest` suites significantly faster."
  },
  {
    id: "test-webmvctest",
    title: "@WebMvcTest",
    difficulty: "Medium",
    theory: [
      "**`@WebMvcTest`** is a specialized test slice annotation used to test the Spring MVC web layer in complete isolation from the database, services, and security infrastructure.",
      "**What it Loads**:",
      "Only Spring MVC infrastructure beans: `@Controller`, `@RestController`, `@ControllerAdvice`, `@JsonComponent`, `WebMvcConfigurer`, `Filter`, and `HttpMessageConverter`.",
      "**What it Skips**:",
      "Component scanning skips `@Service`, `@Repository`, and `@Component` beans. Any service collaborator required by the controller must be mocked in the test using **`@MockBean`** (or `@MockitoBean` in Boot 3.4+).",
      "**`MockMvc`**:",
      "Used to perform simulated HTTP requests against controller endpoints without spinning up an HTTP server. Provides a fluent DSL to verify HTTP status codes, headers, and JSON body values via JsonPath."
    ],
    keyPoints: [
      "`@WebMvcTest(UserController.class)` focuses strictly on the web controller layer.",
      "Does not load services or repositories, resulting in fast execution.",
      "Mock required service dependencies using `@MockBean` / `@MockitoBean`.",
      "Test HTTP behavior using `MockMvc` and JsonPath expressions (`jsonPath(\"$.name\")`)."
    ],
    code: [
      {
        title: "Testing a RestController Slice with @WebMvcTest and MockMvc",
        language: "java",
        content: `package com.algoguru.controller;

import com.algoguru.dto.UserResponse;
import com.algoguru.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class) // Slices only UserController and Spring MVC
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean // Replaces real service with a Mockito mock in the sliced context
    private UserService userService;

    @Test
    void getUserByIdReturnsOkAndJson() throws Exception {
        UserResponse mockResponse = new UserResponse(101L, "aritra", "aritra@algoguru.com", Instant.now());
        when(userService.getUserById(101L)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/users/101")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(101))
            .andExpect(jsonPath("$.username").value("aritra"))
            .andExpect(jsonPath("$.email").value("aritra@algoguru.com"));
    }
}`
      }
    ],
    tip: "Use `@AutoConfigureMockMvc(addFilters = false)` if you want to bypass Spring Security filter chains during controller slice tests."
  },
  {
    id: "test-datajpatest",
    title: "@DataJpaTest",
    difficulty: "Medium",
    theory: [
      "**`@DataJpaTest`** is a test slice annotation designed for testing the JPA persistence layer in isolation.",
      "**Features & Behavior**:",
      "1. **Scans Only Entities and Repositories**: Discovers `@Entity` classes and `@Repository` / `JpaRepository` interfaces, skipping controllers, services, and web infrastructure.",
      "2. **Auto-Configures In-Memory Database**: By default, Spring Boot replaces the application's real database connection with an embedded in-memory database (such as H2, HSQL, or Derby) on the test classpath.",
      "3. **Transactional Rollback**: Every test method annotated with `@DataJpaTest` is automatically wrapped in a transaction that is **rolled back at the end of the test**, ensuring tests never leave dirty state in the database.",
      "4. **`TestEntityManager`**: Injects a specialized helper class with methods (`persist()`, `find()`, `flush()`, `clear()`) designed to set up database fixtures and test persistence context caching directly.",
      "If you wish to run `@DataJpaTest` against a real database or Testcontainer instead of embedded H2, add `@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)`."
    ],
    keyPoints: [
      "`@DataJpaTest` slices only JPA entities, repositories, and EntityManager.",
      "Automatically rolls back transactions after each test method completes.",
      "Provides `TestEntityManager` for configuring test fixtures and flushing caches.",
      "Disable embedded DB replacement via `@AutoConfigureTestDatabase(replace = NONE)` when using Testcontainers."
    ],
    code: [
      {
        title: "Testing Repository with @DataJpaTest and TestEntityManager",
        language: "java",
        content: `package com.algoguru.repository;

import com.algoguru.entity.Student;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class StudentRepositoryTest {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByEmailReturnsPersistedStudent() {
        // Arrange: Persist entity using TestEntityManager
        Student student = new Student("Alice", "alice@algoguru.com");
        entityManager.persistAndFlush(student);
        entityManager.clear(); // Clear L1 cache to force query to hit database

        // Act
        Optional<Student> found = studentRepository.findByEmail("alice@algoguru.com");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Alice");
    }
}`
      }
    ],
    warning: "Remember to call `entityManager.flush()` and `entityManager.clear()` when testing custom queries to ensure your tests verify actual database SQL rather than reading from Hibernate's first-level memory cache."
  },
  {
    id: "test-mockbean",
    title: "@MockBean vs @MockitoBean",
    difficulty: "Hard",
    theory: [
      "When testing Spring applications, it is often necessary to replace a specific Spring bean in the `ApplicationContext` with a Mockito mock.",
      "**The Legacy Approach: `@MockBean` / `@SpyBean`**:",
      "Provided by `org.springframework.boot.test.mock.mockito.MockBean`. It creates a Mockito mock and registers it in the active `ApplicationContext`, replacing any existing bean of that type or creating a new one.",
      "**The Modern Standard in Spring Boot 3.4+ / Spring Framework 6.2: `@MockitoBean`**:",
      "In modern Spring releases, `@MockBean` is deprecated in favor of **`@MockitoBean`** and **`@MockitoSpyBean`** directly from `org.springframework.test.context.bean.override.mockito.MockitoBean`. This transition moved bean overriding from Spring Boot into the core Spring Framework test suite, enabling cleaner lifecycle integration and compatibility with AOT (Ahead-of-Time) compilation.",
      "**Cache Invalidation Warning**:",
      "Every time a test class introduces a new or different set of `@MockBean` / `@MockitoBean` definitions, Spring cannot reuse the cached `ApplicationContext`. It is forced to rebuild a brand new context, which can drastically increase overall CI build times if overused."
    ],
    keyPoints: [
      "`@MockBean` (Spring Boot 2/3) is superseded by `@MockitoBean` (Spring Boot 3.4+ / Framework 6.2).",
      "Replaces the matching bean definition directly inside the Spring `ApplicationContext`.",
      "Supports Mockito stubbing (`when(...)`) and verification (`verify(...)`).",
      "Modifying bean mocks invalidates the Spring test context cache, slowing down test suites."
    ],
    code: [
      {
        title: "Using @MockBean / @MockitoBean in Integration Tests",
        language: "java",
        content: `package com.algoguru.service;

import com.algoguru.client.PaymentGatewayClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
// In Spring Boot 3.4+: import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CheckoutServiceTest {

    @Autowired
    private CheckoutService checkoutService;

    // External payment gateway is mocked inside the Spring ApplicationContext
    @MockBean
    private PaymentGatewayClient paymentGatewayClient;

    @Test
    void successfulCheckoutChargesGateway() {
        when(paymentGatewayClient.charge("card_123", 100.0)).thenReturn(true);

        boolean result = checkoutService.processOrder("card_123", 100.0);
        assertThat(result).isTrue();
    }
}`
      }
    ],
    tip: "To maximize test context caching, group tests with identical mocks into a shared base test class."
  },
  {
    id: "test-testcontainers",
    title: "Testcontainers",
    difficulty: "Hard",
    theory: [
      "A persistent pitfall in enterprise testing is relying on in-memory databases (like H2) for testing code destined for production databases (like PostgreSQL or MySQL). H2 lacks support for native JSONB queries, specific locking clauses, window functions, and dialect-specific behavior.",
      "**Testcontainers** is a Java library that supports JUnit tests by providing lightweight, throwaway instances of real databases, message brokers (Kafka, RabbitMQ), or caches (Redis) running inside **Docker containers**.",
      "**Spring Boot 3.1+ Testcontainers Support**:",
      "Spring Boot 3.1 introduced native support via **`@ServiceConnection`**.",
      "When you annotate a container declaration with `@ServiceConnection` (e.g. `@Container @ServiceConnection static PostgreSQLContainer<?> postgres = ...`), Spring Boot **automatically extracts the dynamic JDBC URL, username, and password from the running Docker container and binds them directly to the `DataSourceProperties` in the Environment**.",
      "This completely eliminates the need for manual, verbose `@DynamicPropertySource` methods."
    ],
    keyPoints: [
      "Testcontainers runs real databases and message brokers in Docker during tests.",
      "Eliminates differences between in-memory H2 and production PostgreSQL/MySQL.",
      "Spring Boot 3.1+ `@ServiceConnection` automatically wires JDBC properties from running containers.",
      "Containers start before tests and are automatically destroyed when test execution finishes."
    ],
    code: [
      {
        title: "Modern Spring Boot 3.1+ Testcontainers Setup with @ServiceConnection",
        language: "java",
        content: `package com.algoguru.integration;

import com.algoguru.entity.User;
import com.algoguru.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers // Manages Docker container lifecycle
class UserPostgresIntegrationTest {

    // Spring Boot 3.1+ @ServiceConnection automatically sets:
    // spring.datasource.url, username, and password!
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Test
    void canPersistToRealPostgresContainer() {
        User user = new User("Aritra", "aritra@algoguru.com");
        userRepository.save(user);

        assertThat(userRepository.findByEmail("aritra@algoguru.com")).isPresent();
    }
}`
      }
    ],
    note: "Running Testcontainers requires a running Docker daemon on the host machine or in the CI/CD runner environment (Docker-in-Docker)."
  },
  {
    id: "test-integration",
    title: "Integration Testing",
    difficulty: "Medium",
    theory: [
      "**Integration Testing** verifies that multiple architectural components—controllers, services, database repositories, transaction managers, and security filters—function correctly together.",
      "**Key Integration Patterns & Strategies**:",
      "1. **Database Isolation**: Tests must be idempotent. If a test inserts data, subsequent tests must not fail due to duplicate key violations. Use `@Transactional` on test classes (auto-rollback) or clean tables in `@BeforeEach` methods.",
      "2. **Handling External Microservices**: For downstream third-party REST APIs (e.g. payment processors, email gateways), use **WireMock** to spin up a mock HTTP server that simulates responses, latency, and 500 error scenarios.",
      "3. **`@DirtiesContext`**: If a test intentionally alters the `ApplicationContext` state (e.g. mutating a singleton bean or clearing a connection pool), annotate the test with `@DirtiesContext` to instruct Spring to evict the context from the cache and rebuild it for the next test class."
    ],
    keyPoints: [
      "Verifies end-to-end interactions across controllers, services, and databases.",
      "Use WireMock to stub external third-party HTTP microservices.",
      "Ensure tests are repeatable and idempotent by isolating database state.",
      "`@DirtiesContext` signals that a test modified context state and forces a rebuild."
    ],
    code: [
      {
        title: "End-to-End User Registration Integration Test",
        language: "java",
        content: `package com.algoguru.integration;

import com.algoguru.dto.RegisterRequest;
import com.algoguru.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserRegistrationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll(); // Ensure clean database state
    }

    @Test
    void registerNewUserEndToEnd() {
        RegisterRequest request = new RegisterRequest("newuser", "user@algoguru.com", 25);
        ResponseEntity<String> response = restTemplate.postForEntity("/api/v1/auth/register", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(userRepository.findByEmail("user@algoguru.com")).isPresent();
    }
}`
      }
    ],
    warning: "Use `@DirtiesContext` sparingly. Rebuilding a Spring application context takes seconds and can drastically slow down large test suites."
  },
  {
    id: "test-profiles",
    title: "Test Profiles",
    difficulty: "Easy",
    theory: [
      "In many applications, tests require configurations that differ from local development or production (e.g. disabling rate limiters, using mock credentials, or connecting to local test databases).",
      "Spring Boot provides the **`@ActiveProfiles`** annotation to activate specific profiles during test execution.",
      "When `@ActiveProfiles(\"test\")` is present on a test class, Spring Boot loads properties from **`src/test/resources/application-test.yml`** (or `application-test.properties`), which override standard settings from `application.yml`.",
      "In addition, any `@Profile(\"test\")` beans in your test sources are activated, and beans marked `@Profile(\"!test\")` are excluded."
    ],
    keyPoints: [
      "Activate test configurations via `@ActiveProfiles(\"test\")`.",
      "Reads settings from `src/test/resources/application-test.yml`.",
      "Allows disabling security, external notifications, or heavy caching during tests.",
      "Beans annotated with `@Profile(\"test\")` are registered only in test runs."
    ],
    code: [
      {
        title: "Activating Test Profile on a Test Suite",
        language: "java",
        content: `package com.algoguru.test;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // Activates application-test.yml
class ConfiguredTestProfileSuite {

    @Test
    void contextLoadsWithTestSettings() {
        // Runs with test database, mock email sender, and disabled rate limiting
    }
}`
      }
    ],
    tip: "Placing an `application.yml` directly in `src/test/resources/` completely overrides the main `application.yml` for all tests in that module."
  },
  {
    id: "test-coverage",
    title: "Code Coverage — JaCoCo",
    difficulty: "Medium",
    theory: [
      "**Code Coverage** measures the proportion of application source code executed when an automated test suite runs. It identifies untested branches, edge cases, and dead code.",
      "**JaCoCo (Java Code Coverage)** is the standard open-source library for Java bytecode coverage analysis. It integrates into Maven (`jacoco-maven-plugin`) and Gradle (`jacoco`).",
      "**Key Metrics**:",
      "1. **Line Coverage**: Ratio of executed lines to total executable lines of code.",
      "2. **Branch Coverage**: Evaluates whether both `true` and `false` branches of `if`, `switch`, and ternary operators were exercised.",
      "3. **Complexity (Cyclomatic)**: Measures the number of linear execution paths through code.",
      "**CI/CD Quality Gates**:",
      "JaCoCo can enforce mandatory build thresholds via `jacoco:check`. If overall line or branch coverage falls below a defined minimum (e.g. 80%), the Maven build fails, preventing pull requests from being merged."
    ],
    keyPoints: [
      "JaCoCo analyzes bytecode during test execution to measure code coverage.",
      "Tracks Line Coverage, Branch Coverage, and Cyclomatic Complexity.",
      "Generates visual HTML reports in `target/site/jacoco/index.html`.",
      "`jacoco:check` enforces minimum coverage rules in CI/CD pipelines."
    ],
    code: [
      {
        title: "JaCoCo Maven Plugin Configuration with Coverage Quality Gate",
        language: "xml",
        content: `<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- Enforce 80% coverage rule -->
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>`
      }
    ],
    tip: "Exclude generated code (MapStruct mappers, DTO getters/setters, configuration classes) from JaCoCo analysis via `<excludes>` configuration to maintain realistic metric scores."
  },
  {
    id: "test-slice",
    title: "Slice Annotations Overview",
    difficulty: "Hard",
    theory: [
      "Spring Boot provides a comprehensive family of **Test Slice Annotations** that customize and restrict the `ApplicationContext` to test specific subsystems in isolation.",
      "**Comprehensive Slice Reference**:",
      "1. **`@WebMvcTest`**: Slices Spring MVC controllers, filters, and advice. Ideal for HTTP endpoint contract tests.",
      "2. **`@DataJpaTest`**: Slices Hibernate and JPA repositories with an in-memory or Testcontainers database.",
      "3. **`@JsonTest`**: Tests JSON serialization and deserialization using Jackson (`JacksonTester<T>`) to ensure custom serializers, `@JsonProperty`, and `@JsonFormat` work correctly.",
      "4. **`@RestClientTest`**: Tests outgoing HTTP clients (`RestClient`, `RestTemplate`) using a mock server (`MockRestServiceServer`) to simulate third-party API responses.",
      "5. **`@DataRedisTest`**: Slices Spring Data Redis repositories and `RedisTemplate`.",
      "6. **`@DataMongoTest`**: Slices MongoDB repositories with embedded or containerized Mongo.",
      "7. **`@JdbcTest`**: Slices raw `JdbcTemplate` without JPA/Hibernate overhead."
    ],
    keyPoints: [
      "Slice annotations load only the minimum beans required for a subsystem.",
      "Drastically faster than `@SpringBootTest` while providing realistic Spring integration.",
      "Use `@JsonTest` for Jackson serialization and `@RestClientTest` for HTTP clients.",
      "Every slice allows mocking unincluded collaborator beans."
    ],
    code: [
      {
        title: "Testing Custom JSON Serialization with @JsonTest",
        language: "java",
        content: `package com.algoguru.dto;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
class UserJsonTest {

    @Autowired
    private JacksonTester<UserResponse> json;

    @Test
    void testSerialization() throws Exception {
        UserResponse response = new UserResponse(42L, "aritra", "aritra@algoguru.com", Instant.parse("2026-01-01T00:00:00Z"));

        assertThat(json.write(response)).hasJsonPathNumberValue("$.id");
        assertThat(json.write(response)).extractingJsonPathStringValue("$.username").isEqualTo("aritra");
    }
}`
      }
    ],
    tip: "Use slice tests wherever possible for day-to-day feature test development, and reserve full `@SpringBootTest` suites for end-to-end smoke verification."
  }
];
