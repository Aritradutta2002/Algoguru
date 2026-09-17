import { ContentSection } from "./recursionContent";
import { attachDiagrams } from "./diagramAttach";
import { springBootRestVisualizations } from "./springBootRestVisualizations";

/* -------------------------------------------------------------------------- */
/*  REST APIs with Spring Boot — Complete In-Depth Theory                     */
/*  Covers Controllers, HTTP methods, Parameters, ResponseEntity, Validation, */
/*  @ControllerAdvice, ProblemDetail, HATEOAS, OpenAPI, CORS, and Async REST.  */
/*  Written against Spring Boot 3.x / Spring Framework 6.x / Java 17+.        */
/* -------------------------------------------------------------------------- */

const springBootRestRaw: ContentSection[] = [
  {
    id: "rest-controller",
    title: "@RestController & @RequestMapping",
    difficulty: "Easy",
    theory: [
      "The foundation of RESTful web services in Spring MVC is the **`@RestController`** annotation. It is a specialized convenience annotation that combines **`@Controller`** and **`@ResponseBody`** into a single meta-annotation.",
      "In a traditional MVC architecture with `@Controller`, handler methods return a `String` representing a logical view name (such as `\"index\"` or `\"user-profile\"`) which is resolved by an `InternalResourceViewResolver` or Thymeleaf engine into an HTML page.",
      "In contrast, `@RestController` implies `@ResponseBody` on every single handler method. Instead of resolving view templates, the return value is serialized directly into the HTTP response body (typically as JSON or XML) via registered `HttpMessageConverter` beans (with Jackson `MappingJackson2HttpMessageConverter` as the default).",
      "**`@RequestMapping`** maps HTTP requests to handler classes or handler methods. Placed at the class level (e.g., `@RequestMapping(\"/api/v1/users\")`), it defines the shared root path for all nested endpoints. Placed at the method level, it defines specific sub-paths, HTTP verbs, content types (`consumes`), and response formats (`produces`)."
    ],
    keyPoints: [
      "`@RestController` = `@Controller` + `@ResponseBody` on every method.",
      "Serializes Java objects directly to HTTP response bodies via `HttpMessageConverter`.",
      "`@RequestMapping` at the class level establishes a common URI prefix for all endpoints.",
      "Supports attributes like `consumes = MediaType.APPLICATION_JSON_VALUE` and `produces`."
    ],
    code: [
      {
        title: "Standard @RestController with Class-Level @RequestMapping",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping(path = "/api/v1/courses", produces = MediaType.APPLICATION_JSON_VALUE)
public class CourseController {

    record Course(Long id, String title, int modules) {}

    @GetMapping
    public List<Course> getAllCourses() {
        return List.of(
            new Course(1L, "Data Structures & Algorithms", 12),
            new Course(2L, "Spring Boot Microservices", 8)
        );
    }
}`
      }
    ],
    note: "If you need a single method to return an HTML view inside a `@RestController`, you cannot easily do so. Keep `@Controller` for server-side HTML rendering and `@RestController` for raw data APIs."
  },
  {
    id: "rest-http-methods",
    title: "HTTP Methods — GET, POST, PUT, DELETE, PATCH",
    difficulty: "Medium",
    theory: [
      "REST relies on the standard HTTP verb semantics to declare the intent of each operation. Spring MVC provides shortcut annotations for each verb: **`@GetMapping`**, **`@PostMapping`**, **`@PutMapping`**, **`@DeleteMapping`**, and **`@PatchMapping`**.",
      "**Idempotency & Safety Definitions**:",
      "1. **Safe**: An HTTP method is safe if it does not alter server state. `GET`, `HEAD`, and `OPTIONS` are safe. Calling them 1,000 times has no side effects.",
      "2. **Idempotent**: An HTTP method is idempotent if the side-effect of multiple identical requests is identical to a single request. `GET`, `PUT`, `DELETE`, and `HEAD` are idempotent. If you execute `DELETE /users/42` five times, the user remains deleted.",
      "3. **Non-Idempotent**: `POST` is neither safe nor idempotent. Repeated identical `POST` calls create multiple duplicate resources (e.g., submitting an order twice).",
      "**PUT vs PATCH**:",
      "- **`PUT`**: Represents **Full Replacement** of the target resource. The client must transmit the entire resource representation. Any field omitted by the client should be cleared or set to null/defaults by the server.",
      "- **`PATCH`**: Represents **Partial Modification**. The client transmits only the fields that need updating (delta update), leaving unmentioned fields untouched on the server."
    ],
    keyPoints: [
      "GET = Read (Safe, Idempotent); POST = Create (Not Safe, Not Idempotent).",
      "PUT = Full Replacement (Idempotent); PATCH = Partial Update (Non-Idempotent).",
      "DELETE = Remove resource (Idempotent: repeating produces the same result).",
      "Use specific shortcut annotations (`@GetMapping`, `@PostMapping`) over generic `@RequestMapping(method = ...)`."
    ],
    code: [
      {
        title: "RESTful Controller Implementing Full CRUD Verbs",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/articles")
public class ArticleController {

    @GetMapping("/{id}") // GET: Safe, Idempotent
    public Map<String, String> getArticle(@PathVariable Long id) {
        return Map.of("id", id.toString(), "title", "Spring Boot Internals");
    }

    @PostMapping // POST: Non-idempotent create
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createArticle(@RequestBody Map<String, String> payload) {
        return Map.of("id", 101L, "status", "Created");
    }

    @PutMapping("/{id}") // PUT: Full replacement
    public Map<String, Object> updateArticle(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return Map.of("id", id, "status", "Replaced");
    }

    @PatchMapping("/{id}") // PATCH: Partial update
    public Map<String, Object> patchArticle(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return Map.of("id", id, "status", "Partially Updated");
    }

    @DeleteMapping("/{id}") // DELETE: Idempotent removal
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteArticle(@PathVariable Long id) {
        // Deletion logic...
    }
}`
      }
    ],
    tip: "Return `201 Created` with a `Location` header containing the URI of the newly created resource on `POST` requests, and return `204 No Content` on successful `DELETE` requests."
  },
  {
    id: "rest-path-query",
    title: "Path Variables & Query Parameters",
    difficulty: "Easy",
    theory: [
      "REST APIs accept dynamic parameters from HTTP request URIs using two distinct mechanisms: **Path Variables** and **Query Parameters**.",
      "**`@PathVariable`**: Extracts dynamic values embedded directly in the URI path template (e.g., `/orders/{orderId}/items/{itemId}`). Path variables identify a specific resource or resource hierarchy. If the path template variable name matches the Java parameter name, no explicit parameter name is needed: `@PathVariable Long id` automatically maps `{id}`. You can specify `required = false` or custom regex constraints (e.g., `@GetMapping(\"/users/{id:[0-9]+}\")`).",
      "**`@RequestParam`**: Extracts values from the URI query string following the `?` delimiter (e.g., `/search?query=java&page=2&size=20`) or `application/x-www-form-urlencoded` form payloads. Query parameters are used for **filtering, sorting, searching, and pagination** rather than direct resource identification.",
      "`@RequestParam` attributes include: `name` (query parameter name), `required` (defaults to `true`; requests missing a required parameter trigger `400 Bad Request`), and `defaultValue` (supplies a fallback, which implicitly sets `required = false`)."
    ],
    keyPoints: [
      "Use `@PathVariable` to identify specific resources (`/products/{id}`).",
      "Use `@RequestParam` for filtering, pagination, and sorting (`/products?category=books&page=1`).",
      "`@RequestParam` defaults to `required = true`; provide `defaultValue` to avoid `400 Bad Request`.",
      "Both support automatic type conversion (String to Integer, UUID, LocalDate, Enum)."
    ],
    code: [
      {
        title: "Combining @PathVariable and @RequestParam with Defaults",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
public class EmployeeSearchController {

    @GetMapping("/{deptId}/employees")
    public String findEmployees(
        @PathVariable("deptId") Long deptId,
        @RequestParam(name = "role", required = false) String role,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "20") int size,
        @RequestParam(name = "sort", defaultValue = "lastName,asc") String sort
    ) {
        return String.format("Dept: %d, Role: %s, Page: %d, Size: %d, Sort: %s",
            deptId, role != null ? role : "ALL", page, size, sort);
    }
}`
      }
    ],
    note: "For complex queries with many parameters, bind parameters directly to a POJO or Record DTO without `@RequestParam`: Spring MVC automatically binds matching query params to DTO fields."
  },
  {
    id: "rest-request-body",
    title: "@RequestBody & @ResponseBody",
    difficulty: "Easy",
    theory: [
      "**`@RequestBody`** indicates that a method parameter should be bound to the body of the incoming HTTP request. Spring uses an `HttpMessageConverter` (by default, Jackson `MappingJackson2HttpMessageConverter`) to resolve the HTTP request body byte stream into a target Java object based on the request's `Content-Type` header (typically `application/json`).",
      "**`@ResponseBody`** indicates that the return value of a method should be serialized directly into the HTTP response body rather than resolved to a model-and-view name. It inspects the client's incoming `Accept` header to format the output as JSON or XML.",
      "When using `@RequestBody`, Jackson handles **deserialization**: mapping JSON fields to class properties via reflection, getters/setters, or canonical record constructors. Deserialization failure (e.g. malformed JSON or type mismatch) automatically raises an `HttpMessageNotReadableException`.",
      "Best practice strongly favors using dedicated **DTOs (Data Transfer Objects)** or **Java 17 Records** with `@RequestBody` rather than exposing JPA database entities directly to avoid over-posting attacks and circular reference serialization errors."
    ],
    keyPoints: [
      "`@RequestBody` maps the incoming JSON payload to a Java object/Record.",
      "`@ResponseBody` writes the return object directly to the response body as JSON/XML.",
      "`@RestController` already includes `@ResponseBody` by default.",
      "Always use DTOs/Records for request bodies to prevent entity over-posting vulnerabilities."
    ],
    code: [
      {
        title: "Using Java 17 Records with @RequestBody",
        language: "java",
        content: `package com.algoguru.dto;

import org.springframework.web.bind.annotation.*;
import java.time.Instant;

// Immutable DTO definition using Java 17 Record
public record CreateUserRequest(
    String username,
    String email,
    String password
) {}

public record UserResponse(
    Long id,
    String username,
    String email,
    Instant createdAt
) {}

@RestController
@RequestMapping("/api/v1/users")
class UserController {

    @PostMapping
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        // In real apps, delegate to UserService
        return new UserResponse(1001L, request.username(), request.email(), Instant.now());
    }
}`
      }
    ],
    warning: "Never expose sensitive fields (like raw passwords, salt, or internal database keys) in objects returned from `@ResponseBody`."
  },
  {
    id: "rest-response-entity",
    title: "ResponseEntity & HttpStatus",
    difficulty: "Medium",
    theory: [
      "While returning a plain POJO from a controller method works well for standard `200 OK` responses, **`ResponseEntity<T>`** represents the entire HTTP response: status code, headers, and body.",
      "By using `ResponseEntity`, you gain fine-grained programmatic control over:",
      "1. **HTTP Status Code**: Return precise semantic statuses (`201 CREATED`, `204 NO_CONTENT`, `400 BAD_REQUEST`, `404 NOT_FOUND`, `409 CONFLICT`).",
      "2. **Custom HTTP Headers**: Add headers such as `Location`, `Cache-Control`, `X-Total-Count`, or `ETag`.",
      "3. **Fluent Builder API**: `ResponseEntity.ok(body)`, `ResponseEntity.created(uri).body(body)`, `ResponseEntity.noContent().build()`, `ResponseEntity.status(HttpStatus.ACCEPTED).headers(headers).body(payload)`.",
      "The `HttpStatus` enum in `org.springframework.http` contains all standard RFC HTTP status codes categorized by class: `1xx Informational`, `2xx Successful`, `3xx Redirection`, `4xx Client Error`, and `5xx Server Error`."
    ],
    keyPoints: [
      "`ResponseEntity<T>` encapsulates status code, HTTP headers, and response body.",
      "Provides a fluent builder pattern: `ResponseEntity.ok()`, `created()`, `noContent()`.",
      "Essential for adhering to REST standards (e.g. returning `201 Created` with `Location` header).",
      "Avoid returning raw strings or objects when non-200 status codes or custom headers are required."
    ],
    code: [
      {
        title: "Fluent ResponseEntity Usage with Headers and Custom Status",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    record Order(Long id, String item, double total) {}

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        Optional<Order> orderOpt = (id == 42L) 
            ? Optional.of(new Order(42L, "MacBook Pro", 2499.0)) 
            : Optional.empty();

        return orderOpt
            .map(order -> ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "max-age=300")
                .body(order))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order orderInput) {
        Order savedOrder = new Order(999L, orderInput.item(), orderInput.total());

        // Build Location header: /api/v1/orders/999
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(savedOrder.id())
            .toUri();

        return ResponseEntity.created(location).body(savedOrder);
    }
}`
      }
    ],
    tip: "When deleting resources, return `ResponseEntity.noContent().build()` (`204 No Content`) with an empty body instead of returning a JSON message like `{\"message\":\"deleted\"}`."
  },
  {
    id: "rest-exception",
    title: "Exception Handling — @ControllerAdvice",
    difficulty: "Medium",
    theory: [
      "In a production REST API, unhandled exceptions must never leak raw stack traces or internal server details to clients. Spring MVC provides a robust, centralized exception handling model using **`@RestControllerAdvice`** and **`@ExceptionHandler`**.",
      "**`@RestControllerAdvice`** is a component specialization that applies intercepting advice across all controllers in the application. Any exception thrown by a controller method that is not caught locally bubbles up to the `@RestControllerAdvice` bean.",
      "Inside the advice class, individual methods annotated with **`@ExceptionHandler(TargetException.class)`** capture specific exception hierarchies and map them to appropriate HTTP status codes and structured error payloads.",
      "**RFC 7807 / RFC 9457 Problem Details (Spring 6 / Boot 3)**: Spring 6 introduced native support for the RFC 7807 specification via the **`ProblemDetail`** class. It standardizes error responses with fields: `type` (URI reference), `title` (short summary), `status` (HTTP code), `detail` (human-readable explanation), `instance` (URI where error occurred), and arbitrary custom properties.",
      "To enable RFC 7807 format globally for all built-in Spring MVC exceptions, set `spring.mvc.problemdetails.enabled=true` in `application.properties`."
    ],
    keyPoints: [
      "`@RestControllerAdvice` centralizes cross-cutting exception handling across all controllers.",
      "`@ExceptionHandler` captures specific exception classes and returns structured responses.",
      "Spring Boot 3 natively implements RFC 7807 via `ProblemDetail`.",
      "Eliminates repetitive try-catch blocks from controller and service methods."
    ],
    code: [
      {
        title: "Modern Global Exception Handler Using RFC 7807 ProblemDetail",
        language: "java",
        content: `package com.algoguru.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import java.net.URI;
import java.time.Instant;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, 
            ex.getMessage()
        );
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://algoguru.com/errors/not-found"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("errorCode", "ALGOGURU_404_01");
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected internal error occurred. Please contact support."
        );
        problem.setTitle("Internal Server Error");
        return problem;
    }
}`
      }
    ],
    warning: "Never expose sensitive internal exception details (such as SQL syntax errors or database table names) in production error payloads. Sanitize error messages before sending them to the client."
  },
  {
    id: "rest-validation",
    title: "Bean Validation (@Valid, @NotNull, @Size)",
    difficulty: "Medium",
    theory: [
      "Input validation is a vital security and correctness requirement. Spring Boot integrates seamlessly with the **Jakarta Bean Validation specification (JSR-380)** using **Hibernate Validator** as the reference implementation via `spring-boot-starter-validation`.",
      "Standard validation annotations from `jakarta.validation.constraints`:",
      "- `@NotNull`: Value cannot be null (can be empty string).",
      "- `@NotEmpty`: Value cannot be null, and size/length must be > 0.",
      "- `@NotBlank`: String cannot be null, and trimmed length must be > 0 (excludes whitespace-only strings).",
      "- `@Size(min = ..., max = ...)`: Constrains length of strings, collections, or arrays.",
      "- `@Min`, `@Max`: Constrains numeric values.",
      "- `@Email`: Validates well-formed email addresses.",
      "- `@Pattern(regexp = ...)`: Validates against a regular expression.",
      "To trigger validation on an incoming payload, add **`@Valid`** (standard Jakarta) or **`@Validated`** (Spring variant supporting validation groups) before the `@RequestBody` parameter. If validation fails, Spring automatically aborts method execution and throws a **`MethodArgumentNotValidException`**, which can be handled in `@RestControllerAdvice` to return a 400 response detailing every invalid field."
    ],
    keyPoints: [
      "Requires starter dependency: `spring-boot-starter-validation`.",
      "`@NotBlank` is best for Strings (checks null, empty, and whitespace).",
      "`@Valid` on `@RequestBody` parameters triggers the validation engine.",
      "Validation failures raise `MethodArgumentNotValidException` (returns 400 Bad Request)."
    ],
    code: [
      {
        title: "Validated DTO and Field Error Mapping in Controller Advice",
        language: "java",
        content: `package com.algoguru.dto;

import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

public record RegisterRequest(
    @NotBlank(message = "Username is mandatory")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    String username,

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Invalid email format")
    String email,

    @Min(value = 18, message = "User must be at least 18 years old")
    int age
) {}

@RestControllerAdvice
class ValidationExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}`
      }
    ],
    tip: "Use `@Validated` at the class level on `@RestController` or `@Service` to validate `@PathVariable` and `@RequestParam` arguments directly on method parameters."
  },
  {
    id: "rest-content-negotiation",
    title: "Content Negotiation",
    difficulty: "Hard",
    theory: [
      "**Content Negotiation** allows a client and server to agree on the format of resource representations transferred between them (e.g., JSON, XML, Protobuf, CSV).",
      "Spring MVC handles content negotiation primarily through HTTP headers:",
      "1. **`Accept` header**: The client indicates which MIME types it can process (e.g., `Accept: application/json` or `Accept: application/xml`).",
      "2. **`Content-Type` header**: Indicates the media type of the payload in the request body.",
      "Spring Boot supports Content Negotiation out of the box via registered `HttpMessageConverter` instances. By default, `spring-boot-starter-web` includes Jackson JSON. If you add `jackson-dataformat-xml` to your dependencies, Spring automatically registers `MappingJackson2XmlHttpMessageConverter`. The exact same controller method can then serve both JSON and XML based on the client's `Accept` header without changing a single line of controller code.",
      "You can also restrict specific controller endpoints using the `consumes` and `produces` attributes on `@RequestMapping`: `@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)` rejects requests that explicitly require XML with `406 Not Acceptable`."
    ],
    keyPoints: [
      "Client requests format via `Accept: application/json` or `application/xml`.",
      "Adding `jackson-dataformat-xml` enables seamless XML support alongside JSON.",
      "`consumes` restricts accepted request media types; `produces` restricts response types.",
      "Returns `415 Unsupported Media Type` if request body type is unacceptable, `406 Not Acceptable` if response type cannot be satisfied."
    ],
    code: [
      {
        title: "Enabling XML & JSON Content Negotiation",
        language: "xml",
        content: `<!-- In pom.xml: Add XML support alongside standard starter-web -->
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
</dependency>

<!-- Controller handles both transparently! -->
// Client sending: Accept: application/json -> Returns JSON
// Client sending: Accept: application/xml  -> Returns XML
@GetMapping("/api/v1/profile")
public UserProfile getProfile() {
    return new UserProfile("Aritra", "Engineer");
}`
      }
    ],
    tip: "Avoid query-parameter or path-extension content negotiation (like `/users.json` or `/users?format=xml`). Standard HTTP `Accept` headers are the RFC-compliant, RESTful approach."
  },
  {
    id: "rest-hateoas",
    title: "HATEOAS",
    difficulty: "Hard",
    theory: [
      "**HATEOAS** (Hypermedia As The Engine Of Application State) is the highest maturity level (Level 3) of the **Richardson Maturity Model** for RESTful APIs. A truly RESTful service provides not only data, but also hypermedia links guiding the client on what actions can be performed next.",
      "Spring Boot provides first-class support for hypermedia through **`spring-boot-starter-hateoas`** (Spring HATEOAS).",
      "Core abstractions in Spring HATEOAS:",
      "1. **`RepresentationModel<T>`**: Base class for DTOs that adds a collection of `Link` objects to the serialized JSON.",
      "2. **`EntityModel<T>`**: A wrapper around a domain object that adds links.",
      "3. **`CollectionModel<T>`**: A wrapper around a collection of entities that adds pagination and navigation links.",
      "4. **`WebMvcLinkBuilder`**: A type-safe utility that builds URI links pointing directly to controller methods using reflection (`linkTo(methodOn(UserController.class).getUser(id)).withSelfRel()`), ensuring links never break when URI paths change.",
      "The standard JSON format produced by Spring HATEOAS is **HAL (Hypertext Application Language)**, which nests links inside a reserved `_links` object."
    ],
    keyPoints: [
      "HATEOAS represents Level 3 of the Richardson Maturity Model.",
      "Responses embed hypermedia links informing clients of allowable next state transitions.",
      "Uses `WebMvcLinkBuilder.linkTo(methodOn(...))` for compile-safe link construction.",
      "Outputs HAL format containing standard `_links` and `_embedded` structures."
    ],
    code: [
      {
        title: "Spring HATEOAS Controller with Self and Collection Links",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;
import org.springframework.web.bind.annotation.*;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    record AccountDto(String accountNumber, double balance) {}

    @GetMapping("/{accNo}")
    public EntityModel<AccountDto> getAccount(@PathVariable String accNo) {
        AccountDto account = new AccountDto(accNo, 50000.0);

        // Build self link and navigational links dynamically
        EntityModel<AccountDto> model = EntityModel.of(account);
        model.add(linkTo(methodOn(AccountController.class).getAccount(accNo)).withSelfRel());
        model.add(linkTo(methodOn(AccountController.class).withdraw(accNo, 0)).withRel("withdraw"));
        model.add(linkTo(methodOn(AccountController.class).deposit(accNo, 0)).withRel("deposit"));

        return model;
    }

    @PostMapping("/{accNo}/withdraw")
    public String withdraw(@PathVariable String accNo, @RequestParam double amount) { return "Withdrawn"; }

    @PostMapping("/{accNo}/deposit")
    public String deposit(@PathVariable String accNo, @RequestParam double amount) { return "Deposited"; }
}`
      }
    ],
    note: "While theoretically pure, HATEOAS introduces payload overhead and client parsing complexity. Many public APIs stop at Richardson Level 2 (HTTP Verbs + URIs + Status Codes)."
  },
  {
    id: "rest-versioning",
    title: "API Versioning Strategies",
    difficulty: "Medium",
    theory: [
      "As production APIs evolve, breaking changes (removing fields, altering types, renaming endpoints) become inevitable. API versioning ensures existing client applications continue functioning while new clients adopt newer feature sets.",
      "There are **four primary strategies** for versioning REST APIs:",
      "1. **URI Path Versioning (Most Popular)**: Embedding the version number directly into the URI path (e.g., `/api/v1/users` vs `/api/v2/users`). It is transparent, easily cacheable by CDNs, and works directly in browsers.",
      "2. **Query Parameter Versioning**: Passing the version as a query parameter (e.g., `/api/users?version=1` vs `/api/users?version=2`). Common in older enterprise systems and Amazon AWS APIs.",
      "3. **Custom Request Header Versioning**: Passing a custom header (e.g., `X-API-VERSION: 2`). Keeps URIs clean, but requires specialized API client configuration and complicates browser testing.",
      "4. **Media Type / Accept Header Versioning ('Content Negotiation')**: Using the standard `Accept` header with a vendor-specific MIME type (e.g., `Accept: application/vnd.algoguru.v2+json`). Recommended by pure REST purists, but hardest to document, test, and cache in proxies.",
      "In Spring MVC, headers and params are filtered using `@GetMapping(headers = \"X-API-VERSION=2\")` or `@GetMapping(params = \"v=2\")`."
    ],
    keyPoints: [
      "Four strategies: URI Path, Request Parameter, Custom Header, and Media Type (Accept).",
      "URI Path (`/api/v1/...`) is the industry standard for simplicity and CDN cache friendliness.",
      "Spring MVC maps header/param versions via `@GetMapping(headers = \"X-API-VERSION=1\")`.",
      "Never introduce breaking changes in the same version; always deprecate gracefully."
    ],
    code: [
      {
        title: "Implementing Different Versioning Strategies in Spring MVC",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.web.bind.annotation.*;

@RestController
public class VersioningController {

    // 1. URI Path Versioning (Recommended)
    @GetMapping("/api/v1/user")
    public String getUserV1() { return "User V1 (Name as single string)"; }

    @GetMapping("/api/v2/user")
    public String getUserV2() { return "User V2 (Name split into first/last)"; }

    // 2. Custom Header Versioning
    @GetMapping(value = "/api/user", headers = "X-API-VERSION=1")
    public String getHeaderV1() { return "Header V1"; }

    @GetMapping(value = "/api/user", headers = "X-API-VERSION=2")
    public String getHeaderV2() { return "Header V2"; }

    // 3. Media Type (Accept Header) Versioning
    @GetMapping(value = "/api/user", produces = "application/vnd.algoguru.v1+json")
    public String getMediaV1() { return "Media Type V1"; }
}`
      }
    ],
    tip: "Document API deprecation timelines clearly using the HTTP `Sunset` and `Deprecation` response headers (RFC 8594)."
  },
  {
    id: "rest-openapi",
    title: "OpenAPI / Swagger Integration",
    difficulty: "Medium",
    theory: [
      "Interactive API documentation is essential for developer ergonomics and API contract testing. In modern Spring Boot 3 applications, the standard tool for OpenAPI 3 documentation is **Springdoc OpenAPI** (`springdoc-openapi-starter-webmvc-ui`), replacing the outdated and unmaintained Springfox / Swagger 2 library.",
      "Springdoc automatically inspects your `@RestController` classes, methods, `@PathVariable`, `@RequestParam`, `@RequestBody`, and validation constraints (`@NotNull`, `@Size`) at runtime, generating a standard **OpenAPI 3.0 specification** at `/v3/api-docs`.",
      "It also serves an embedded **Swagger UI** web dashboard at `/swagger-ui/index.html` (or `/swagger-ui.html`), allowing developers, frontend engineers, and QA to explore endpoints, inspect schemas, and execute live HTTP requests directly from their web browser.",
      "Key annotations from `io.swagger.v3.oas.annotations`:",
      "- `@Tag`: Groups related endpoints under a logical category.",
      "- `@Operation`: Describes the operation, summary, and business purpose.",
      "- `@ApiResponse`: Documents expected HTTP response codes and schema models.",
      "- `@Parameter`: Describes individual query or path parameters.",
      "- `@Schema`: Annotates DTO fields with descriptions, example values, and constraints."
    ],
    keyPoints: [
      "Use `springdoc-openapi-starter-webmvc-ui` for Spring Boot 3 (do NOT use Springfox).",
      "Generates interactive Swagger UI at `/swagger-ui.html` and raw JSON spec at `/v3/api-docs`.",
      "Automatically discovers validation annotations (`@NotNull`, `@Size`, `@Pattern`).",
      "Configurable via `OpenAPI` bean to define contact, license, and JWT SecurityScheme."
    ],
    code: [
      {
        title: "Springdoc OpenAPI Configuration and Documented Controller",
        language: "java",
        content: `package com.algoguru.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("AlgoGuru Learning Platform API")
                .version("1.0.0")
                .description("Production-grade RESTful APIs for AlgoGuru modules")
                .contact(new Contact().name("AlgoGuru Dev Team").email("api@algoguru.com")));
    }
}

// In your controller:
// @Tag(name = "Courses", description = "Course Management APIs")
// @Operation(summary = "Fetch course by ID", description = "Returns full course syllabus")
// @ApiResponse(responseCode = "200", description = "Course found successfully")
// @ApiResponse(responseCode = "404", description = "Course ID not found")`
      }
    ],
    warning: "In production environments, evaluate whether public access to Swagger UI should be disabled or restricted behind administrative authentication via Spring Security."
  },
  {
    id: "rest-cors",
    title: "CORS Configuration",
    difficulty: "Medium",
    theory: [
      "**CORS (Cross-Origin Resource Sharing)** is a browser-enforced security mechanism that prevents web applications running on one origin (e.g., `http://localhost:3000` or `https://frontend.com`) from reading responses from a different origin (e.g., `http://localhost:8080` or `https://api.com`) unless the server explicitly grants permission via HTTP headers.",
      "**Preflight Requests**: For non-simple requests (methods other than GET/POST, or requests with custom headers like `Authorization` or `Content-Type: application/json`), the browser automatically sends an **HTTP `OPTIONS`** preflight request with `Origin` and `Access-Control-Request-Method` headers. The server must respond with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`.",
      "Spring Boot provides two primary ways to configure CORS:",
      "1. **Controller-Level via `@CrossOrigin`**: Placed directly on a `@RestController` class or handler method. Convenient for quick testing, but repetitive and difficult to manage across enterprise codebases.",
      "2. **Global Configuration via `WebMvcConfigurer`**: Implementing `addCorsMappings(CorsRegistry registry)` provides centralized, path-based CORS rules for the entire application.",
      "When Spring Security is active in the project, CORS **must be enabled in both Spring Security's `SecurityFilterChain` and Spring MVC**, because security filters execute before `DispatcherServlet`."
    ],
    keyPoints: [
      "CORS is enforced by browsers, not the server; non-browser clients (cURL, Postman) bypass CORS.",
      "Preflight `OPTIONS` requests verify cross-origin permissions before actual requests execute.",
      "Global configuration via `WebMvcConfigurer.addCorsMappings` is the enterprise best practice.",
      "When using Spring Security, ensure `http.cors(...)` is explicitly configured in `SecurityFilterChain`."
    ],
    code: [
      {
        title: "Global CORS Configuration via WebMvcConfigurer",
        language: "java",
        content: `package com.algoguru.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000", "https://algoguru.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Requested-With", "Accept")
            .exposedHeaders("X-Total-Count", "Location")
            .allowCredentials(true)
            .maxAge(3600); // Cache preflight response for 1 hour
    }
}`
      }
    ],
    warning: "Avoid using wildcard `allowedOrigins(\"*\")` combined with `allowCredentials(true)`. Modern browsers will reject the response with a security error."
  },
  {
    id: "rest-file-upload",
    title: "File Upload & Download",
    difficulty: "Medium",
    theory: [
      "Enterprise web services frequently handle file uploads (avatars, document submissions, CSV bulk imports) and streaming file downloads (PDF receipts, exports, log archives).",
      "**File Uploads with `MultipartFile`**:",
      "Spring Boot auto-configures a `StandardServletMultipartResolver`. To receive a file in a controller, accept a **`MultipartFile`** parameter annotated with `@RequestParam(\"file\")` and configure the endpoint with `consumes = MediaType.MULTIPART_FORM_DATA_VALUE`.",
      "`MultipartFile` provides methods: `getOriginalFilename()`, `getContentType()`, `getSize()`, `getBytes()`, and `transferTo(Path dest)` for saving directly to storage.",
      "Configure upload size limits in `application.properties`:",
      "`spring.servlet.multipart.max-file-size=10MB` (max size per file) and `spring.servlet.multipart.max-request-size=50MB` (max total payload size).",
      "**Streaming File Downloads**:",
      "Loading entire multi-gigabyte files into byte arrays in heap memory causes `OutOfMemoryError`. Instead, return a **`Resource`** (`InputStreamResource` or `UrlResource`) or a **`StreamingResponseBody`**. By setting the HTTP header `Content-Disposition: attachment; filename=\"...\"`, the browser automatically prompts the user to save the file."
    ],
    keyPoints: [
      "Handle uploads via `MultipartFile` with `multipart/form-data` requests.",
      "Configure limits: `spring.servlet.multipart.max-file-size`.",
      "For downloads, return `Resource` or `StreamingResponseBody` to stream directly without heap bloat.",
      "Use `Content-Disposition: attachment; filename=...` header to trigger browser download dialogs."
    ],
    code: [
      {
        title: "File Upload and Streaming Download Controller",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/files")
public class FileManagementController {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        long size = file.getSize();
        // Stream to cloud storage (S3/GCS) or local disk:
        // file.transferTo(new File("/var/storage/" + filename));
        return ResponseEntity.ok("File uploaded successfully: " + filename + " (" + size + " bytes)");
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        byte[] sampleData = "AlgoGuru generated report data...".getBytes();
        ByteArrayResource resource = new ByteArrayResource(sampleData);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(resource);
    }
}`
      }
    ],
    tip: "Always validate uploaded file extensions and magic numbers (MIME sniffing via Apache Tika) to prevent malicious executable files from being uploaded."
  },
  {
    id: "rest-async",
    title: "Async REST Endpoints",
    difficulty: "Hard",
    theory: [
      "In traditional servlet containers, each incoming HTTP request occupies one worker thread from Tomcat's thread pool (`max-threads=200` by default). If a request executes a long-running external API call, database query, or computation, that worker thread is blocked, which can lead to **thread pool exhaustion** under heavy load.",
      "Spring MVC provides multiple mechanisms for asynchronous, non-blocking response handling:",
      "1. **`CompletableFuture<ResponseEntity<T>>`**: The controller method returns immediately, freeing the servlet container thread. When the asynchronous background task completes on a separate executor, the response is written back to the client.",
      "2. **`DeferredResult<ResponseEntity<T>>`**: Useful for event-driven workflows and long-polling. The request remains open until another thread, JMS listener, or queue worker sets a result on the `DeferredResult` object.",
      "3. **`ResponseBodyEmitter` / `SseEmitter`**: Enables **Server-Sent Events (SSE)**, where the server keeps an HTTP connection open and streams real-time text events to client web browsers over a single connection.",
      "In **Spring Boot 3.2+ with Java 21**, setting `spring.threads.virtual.enabled=true` enables Project Loom Virtual Threads. Tomcat assigns each request a lightweight virtual thread, achieving near-reactive scalability with clean, synchronous code."
    ],
    keyPoints: [
      "Async endpoints release container threads while awaiting long-running operations.",
      "Use `CompletableFuture` for asynchronous background task execution.",
      "Use `SseEmitter` for Server-Sent Events real-time event streaming.",
      "Java 21 Virtual Threads (`spring.threads.virtual.enabled=true`) provide massive concurrency without reactive complexity."
    ],
    code: [
      {
        title: "Asynchronous REST via CompletableFuture and Server-Sent Events (SSE)",
        language: "java",
        content: `package com.algoguru.controller;

import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/async")
public class AsyncProcessController {

    // 1. Asynchronous non-blocking computation
    @GetMapping("/compute")
    public CompletableFuture<String> executeLongCalculation() {
        return CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(2000); } catch (InterruptedException e) {}
            return "Heavy computational result ready!";
        });
    }

    // 2. Real-time Server-Sent Events (SSE) Stream
    @GetMapping(value = "/stream-ticks", produces = "text/event-stream")
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(60_000L); // 60s timeout

        CompletableFuture.runAsync(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    emitter.send(SseEmitter.event().name("price-update").data("Tick #" + i));
                    Thread.sleep(1000);
                }
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }
}`
      }
    ],
    note: "To use Spring's `@Async` annotation, you must add `@EnableAsync` to your `@Configuration` class and define a custom `ThreadPoolTaskExecutor`."
  }
];

export const springBootRestContent: ContentSection[] = attachDiagrams(
  springBootRestRaw,
  springBootRestVisualizations,
);
