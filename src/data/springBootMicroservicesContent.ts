import { ContentSection } from "./recursionContent";
import { attachDiagrams } from "./diagramAttach";
import { springBootMicroservicesVisualizations } from "./springBootMicroservicesVisualizations";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Microservices — Complete In-Depth Theory                      */
/*  Covers Architecture, Eureka, Spring Cloud Gateway, Config Server,         */
/*  Resilience4j Circuit Breaker, Feign/WebClient, Tracing, Saga, and Mesh.  */
/*  Written against Spring Boot 3.x / Spring Cloud 2023+ / Java 17+.          */
/* -------------------------------------------------------------------------- */

const springBootMicroservicesRaw: ContentSection[] = [
  {
    id: "ms-intro",
    title: "Monolith vs Microservices",
    difficulty: "Easy",
    theory: [
      "In enterprise software architecture, choosing between a **Monolith** and a **Microservices Architecture** involves fundamental trade-offs in operational complexity, team velocity, and scalability.",
      "**Monolithic Architecture**:",
      "All business domains (User Management, Catalog, Ordering, Billing, Notifications) are compiled and packaged into a single executable artifact (e.g. one fat JAR or WAR) deployed to a single runtime environment and sharing a single central database.",
      "- *Pros*: Simple development, straightforward transactional guarantees (ACID), zero network latency between modules, simple debugging and deployment.",
      "- *Cons*: Tight coupling, single point of failure, scaling requires scaling the entire application, slow build pipelines as codebases grow, tech-stack lock-in.",
      "**Microservices Architecture**:",
      "The application is decomposed into small, independently deployable services organized around **Business Capabilities (Domain-Driven Design / Bounded Contexts)**. Each microservice manages its own private database (**Database-Per-Service pattern**) and communicates over lightweight network protocols (HTTP/REST, gRPC, or Kafka).",
      "- *Pros*: Independent scaling, autonomous deployment cycles per team, fault isolation, heterogeneous tech stacks.",
      "- *Cons*: Distributed system complexities (network latency, partial failures, data consistency/eventual consistency), complex monitoring, distributed transactions."
    ],
    keyPoints: [
      "Monoliths package all capabilities into one artifact sharing one database.",
      "Microservices enforce Bounded Contexts and the Database-Per-Service pattern.",
      "Conway's Law: System architectures mirror team communication structures.",
      "Microservices trade operational simplicity for team autonomy and independent horizontal scaling."
    ],
    diagram: {
      type: "flow",
      title: "Monolith vs Microservices Architecture",
      direction: "horizontal",
      data: [
        { label: "Monolith: All Modules in 1 Artifact -> Single Database", color: "warning" },
        { label: "Microservices: API Gateway -> User Service / Order Service / Payment Service -> Dedicated DBs", color: "success" }
      ]
    },
    code: [
      {
        title: "Spring Cloud Release Train Bill of Materials (BOM)",
        language: "xml",
        content: `<!-- In pom.xml: Spring Cloud BOM dependency management -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.0</version> <!-- Spring Cloud release train -->
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>`
      }
    ],
    note: "Do not adopt microservices prematurely. Martin Fowler's 'MonolithFirst' rule advises starting with a well-modularized monolith until domain boundaries and operational scale genuinely justify distributed systems."
  },
  {
    id: "ms-discovery",
    title: "Service Discovery — Eureka, Consul",
    difficulty: "Medium",
    theory: [
      "In cloud environments, microservice instances dynamically spin up, scale horizontally, and shut down, meaning their IP addresses and ephemeral ports are constantly changing. Hardcoding IP addresses into client configuration is impossible.",
      "**Service Discovery** solves this by maintaining a live, real-time registry of all active microservice instances.",
      "**Netflix Eureka Internals**:",
      "1. **Eureka Server**: Acts as the centralized phonebook registry. Annotated with **`@EnableEurekaServer`**.",
      "2. **Eureka Client**: Each microservice includes `spring-cloud-starter-netflix-eureka-client`. Upon startup, the client automatically registers itself with its `spring.application.name`, hostname, IP, and port.",
      "3. **Heartbeats**: Every 30 seconds, each client sends an HTTP heartbeat to the server. If the Eureka server fails to receive heartbeats for 90 seconds, the instance is evicted from the registry.",
      "4. **Client-Side Load Balancing**: When Service A calls Service B, it fetches the list of healthy Service B instances from Eureka, caches it locally, and uses client-side load balancing (Spring Cloud LoadBalancer) to distribute traffic across instances.",
      "**Consul**: An enterprise alternative from HashiCorp that combines service discovery with health checking, key-value configuration storage, and service mesh capabilities."
    ],
    keyPoints: [
      "Service Discovery dynamically tracks instance IP addresses and ports.",
      "Eureka Server maintains the registry (`@EnableEurekaServer`).",
      "Clients register their `spring.application.name` and transmit heartbeats every 30s.",
      "Spring Cloud LoadBalancer uses the registry to load-balance calls across healthy instances."
    ],
    code: [
      {
        title: "Eureka Server Application and Client Configuration",
        language: "java",
        content: `// === 1. Eureka Server Application ===
package com.algoguru.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer // Activates Eureka Service Registry
public class ServiceRegistryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceRegistryApplication.class, args);
    }
}

// === 2. Microservice Client (application.yml) ===
// spring:
//   application:
//     name: order-service
// eureka:
//   client:
//     service-url:
//       defaultZone: http://localhost:8761/eureka/`
      }
    ],
    tip: "In modern Kubernetes deployments, Kubernetes native DNS and Services (`kube-dns` / CoreDNS) often replace Eureka, allowing microservices to discover each other via cluster DNS names."
  },
  {
    id: "ms-gateway",
    title: "API Gateway — Spring Cloud Gateway",
    difficulty: "Medium",
    theory: [
      "In a microservices ecosystem, client applications (mobile apps, web SPAs) should never communicate with dozens of backend microservices directly. Doing so exposes internal network topology, requires opening multiple firewall ports, and complicates CORS and authentication.",
      "An **API Gateway** acts as the single unified entry point for all external traffic. In the Spring ecosystem, **Spring Cloud Gateway** (built on non-blocking Spring WebFlux and Project Reactor) is the modern replacement for legacy Netflix Zuul 1.",
      "**Core Concepts in Spring Cloud Gateway**:",
      "1. **Route**: The basic building block. Defined by an ID, a destination URI, a collection of Predicates, and a collection of Filters.",
      "2. **Predicate**: Matches incoming HTTP requests based on conditions (path, HTTP method, headers, query parameters, host). E.g. `Path=/api/orders/**`.",
      "3. **GatewayFilter**: Intercepts requests and responses before or after proxying. Used for: Authentication (validating JWTs), rate limiting (Redis Token Bucket), header enrichment, request transformation, and path rewriting.",
      "4. **Dynamic Routing via Service Discovery**: Using the `lb://service-name` URI syntax (e.g. `lb://ORDER-SERVICE`), the gateway dynamically routes requests to instances discovered via Eureka."
    ],
    keyPoints: [
      "Spring Cloud Gateway is built on non-blocking Spring WebFlux and Netty.",
      "Acts as a reverse proxy providing a single entry point for all clients.",
      "Route = Destination URI + Predicates (matching) + Filters (interception).",
      "Dynamic routing using `lb://SERVICE-NAME` integrates with Service Discovery."
    ],
    code: [
      {
        title: "Spring Cloud Gateway Configuration in application.yml",
        language: "yaml",
        content: `server:
  port: 8080 # Unified gateway port

spring:
  cloud:
    gateway:
      routes:
        # Route to Order Service via Eureka Load Balancer
        - id: order-service-route
          uri: lb://ORDER-SERVICE
          predicates:
            - Path=/api/orders/**
          filters:
            - AddRequestHeader=X-Gateway-Source, AlgoGuruGateway
            - RewritePath=/api/orders/(?<segment>.*), /\${segment}

        # Route to User Service
        - id: user-service-route
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/users/**`
      }
    ],
    warning: "Spring Cloud Gateway is built on Project Reactor / WebFlux. Do not include `spring-boot-starter-web` (Tomcat) on its classpath; doing so causes classpath conflicts."
  },
  {
    id: "ms-config",
    title: "Config Server",
    difficulty: "Medium",
    theory: [
      "Managing configuration files across dozens of microservices individually is error-prone. **Spring Cloud Config** provides centralized, externalized configuration management across all environments.",
      "**Architecture**:",
      "1. **Config Server**: A dedicated microservice annotated with **`@EnableConfigServer`**. It connects to a centralized storage backend (Git repository, HashiCorp Vault, or SVN).",
      "2. **Config Clients**: Microservices connect to the Config Server during startup (via `spring.config.import=configserver:http://localhost:8888`) to download their profile-specific configuration.",
      "3. **Dynamic Configuration Refresh**: When configuration values change in Git, you can update running microservices without restarting them by making an HTTP POST request to **`/actuator/refresh`** (on beans annotated with **`@RefreshScope`**) or broadcasting a message across a message bus using **Spring Cloud Bus**."
    ],
    keyPoints: [
      "Centralizes configuration for all microservices in a single Git or Vault repository.",
      "Server uses `@EnableConfigServer` to expose settings over HTTP.",
      "Clients fetch settings on startup via `spring.config.import=configserver:...`.",
      "`@RefreshScope` enables dynamic runtime property reloading via `/actuator/refresh` without server restarts."
    ],
    code: [
      {
        title: "Spring Cloud Config Server Setup and @RefreshScope Usage",
        language: "java",
        content: `// 1. Config Server Main Class
package com.algoguru.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}

// 2. In client microservice: Dynamically reloadable property
@RestController
@RefreshScope // Reloads 'welcomeMessage' when /actuator/refresh is called
class MessageController {
    @Value("\${app.welcome.message:Default Welcome}")
    private String welcomeMessage;

    @GetMapping("/welcome")
    public String getMessage() { return welcomeMessage; }
}`
      }
    ],
    tip: "In modern cloud platforms like Kubernetes, ConfigMaps and Secrets are often used directly in place of a separate Spring Cloud Config Server."
  },
  {
    id: "ms-circuit-breaker",
    title: "Circuit Breaker — Resilience4j",
    difficulty: "Hard",
    theory: [
      "In distributed microservices, network latency and remote service outages are inevitable. If Service A makes synchronous HTTP calls to a failing Service B, threads in Service A will block waiting for timeouts, quickly causing **cascading failures** across the entire platform.",
      "The **Circuit Breaker Pattern** prevents cascading failure by wrapping remote calls in a state machine inspired by electrical circuit breakers. In modern Spring Boot 3, **Resilience4j** is the standard circuit breaker library (replacing legacy Netflix Hystrix).",
      "**The Three Circuit States**:",
      "1. **`CLOSED` (Normal)**: Requests flow freely to the downstream service. The circuit tracks success and failure rates.",
      "2. **`OPEN` (Tripped)**: When the failure rate exceeds a configured threshold (e.g. 50% errors over a sliding window of 10 calls), the circuit trips OPEN. Requests immediately fail-fast without calling the downstream service, invoking a fallback method instantly.",
      "3. **`HALF_OPEN` (Probing)**: After a configured wait duration (e.g. 10 seconds), the circuit transitions to HALF_OPEN. It allows a limited number of trial requests through. If they succeed, the circuit resets to CLOSED; if they fail, it trips OPEN again."
    ],
    keyPoints: [
      "Prevents cascading service failures in distributed microservices.",
      "Three states: `CLOSED` (healthy), `OPEN` (fail-fast), `HALF_OPEN` (probing recovery).",
      "Resilience4j is the modern replacement for deprecated Netflix Hystrix.",
      "Annotate methods with `@CircuitBreaker(name = \"...\", fallbackMethod = \"...\")`."
    ],
    code: [
      {
        title: "Resilience4j Circuit Breaker with Fallback Method",
        language: "java",
        content: `package com.algoguru.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class PaymentClientService {

    private final RestClient restClient = RestClient.create();

    @CircuitBreaker(name = "paymentService", fallbackMethod = "processPaymentFallback")
    public String processRemotePayment(String orderId, double amount) {
        // Synchronous call to external payment gateway
        return restClient.post()
            .uri("https://payment.internal/api/charge")
            .body(new ChargeRequest(orderId, amount))
            .retrieve()
            .body(String.class);
    }

    // Fallback executed instantly when circuit is OPEN or exception is thrown
    public String processPaymentFallback(String orderId, double amount, Throwable ex) {
        // Log warning and queue transaction for asynchronous retry
        return "FALLBACK: Payment queued for offline batch processing. Error: " + ex.getMessage();
    }

    record ChargeRequest(String orderId, double amount) {}
}`
      }
    ],
    warning: "The fallback method signature must match the original method's return type and arguments, plus accept an additional `Throwable` parameter at the end."
  },
  {
    id: "ms-communication",
    title: "Inter-Service Communication — REST, Feign, WebClient",
    difficulty: "Medium",
    theory: [
      "Microservices collaborate via synchronous or asynchronous inter-service communication.",
      "**Client Options in Spring Boot**:",
      "1. **Spring Cloud OpenFeign (Declarative REST Client)**: Define a Java interface annotated with **`@FeignClient(name = \"order-service\")`** and standard Spring MVC annotations (`@GetMapping`, `@PathVariable`). Spring Cloud automatically generates the HTTP client implementation, handles serialization, and integrates with Eureka service discovery and Resilience4j out of the box.",
      "2. **`RestClient` (Spring 6 / Boot 3)**: A modern, synchronous HTTP client that offers a fluent, functional API similar to WebClient without requiring non-blocking reactive dependencies.",
      "3. **`WebClient`**: The non-blocking, reactive HTTP client from `spring-boot-starter-webflux`. Essential for high-concurrency reactive pipelines.",
      "4. **`RestTemplate`**: The legacy synchronous client (in maintenance mode since Spring 5; new projects should use `RestClient` or OpenFeign)."
    ],
    keyPoints: [
      "OpenFeign generates declarative HTTP clients from annotated interfaces.",
      "Feign integrates seamlessly with Eureka (`@FeignClient(\"service-name\")`) and Resilience4j.",
      "Spring 6 introduced `RestClient` as the modern replacement for `RestTemplate`.",
      "Use `WebClient` for reactive, non-blocking asynchronous communication."
    ],
    code: [
      {
        title: "Declarative OpenFeign Client Interface",
        language: "java",
        content: `package com.algoguru.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Automatically discovers instance IP/port from Eureka registry for 'catalog-service'
@FeignClient(name = "catalog-service", fallback = CatalogClientFallback.class)
public interface CatalogServiceClient {

    record ProductDto(Long id, String name, double price) {}

    @GetMapping("/api/products/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);
}

// Fallback implementation
class CatalogClientFallback implements CatalogServiceClient {
    @Override
    public ProductDto getProductById(Long id) {
        return new ProductDto(id, "Default Product (Cached)", 0.0);
    }
}`
      }
    ],
    tip: "Add `@EnableFeignClients` to your main configuration class to enable scanning for `@FeignClient` interfaces."
  },
  {
    id: "ms-tracing",
    title: "Distributed Tracing — Sleuth, Zipkin",
    difficulty: "Hard",
    theory: [
      "In a microservices architecture, a single user click may trigger a chain of calls: Gateway -> Order Service -> Inventory Service -> Payment Service -> Notification Service. If a call fails or takes 5 seconds, locating the root cause across distributed logs is impossible without **Distributed Tracing**.",
      "**Core Concepts (W3C TraceContext)**:",
      "- **Trace ID**: A unique identifier assigned at the gateway that stays identical across the entire distributed request journey across all microservices.",
      "- **Span ID**: A unique identifier representing a single segment of work within an individual service.",
      "- Spans form a directed acyclic graph (DAG) of parent-child relationships.",
      "**Major Transition in Spring Boot 3**:",
      "Spring Cloud Sleuth has been **deprecated and removed** in Spring Boot 3. It has been replaced by **Micrometer Tracing** (part of the core Micrometer project), which bridges into industry-standard **OpenTelemetry (OTel)**.",
      "Traces are collected and exported to visualization backends like **Zipkin**, Jaeger, or Grafana Tempo to inspect latency flame graphs."
    ],
    keyPoints: [
      "Trace ID tracks the overall request journey across all services.",
      "Span ID tracks individual units of work inside a single service.",
      "Spring Boot 3 replaced Spring Cloud Sleuth with Micrometer Tracing + OpenTelemetry.",
      "Visualized in Zipkin or Jaeger to analyze latency bottlenecks."
    ],
    code: [
      {
        title: "Dependencies for Micrometer Tracing with Zipkin in Spring Boot 3",
        language: "xml",
        content: `<!-- Micrometer Tracing Bridge to OpenTelemetry -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>

<!-- Exporter to send traces to Zipkin server -->
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-zipkin</artifactId>
</dependency>

<!-- In application.yml:
management:
  tracing:
    sampling:
      probability: 1.0 # Sample 100% of requests in dev
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
-->`
      }
    ],
    tip: "Include `[${spring.application.name:},%X{traceId:-},%X{spanId:-}]` in your SLF4J logging pattern to automatically correlate log lines with distributed traces."
  },
  {
    id: "ms-logging",
    title: "Centralized Logging",
    difficulty: "Medium",
    theory: [
      "In a production microservices environment with hundreds of ephemeral container instances running in Kubernetes, SSHing into individual servers to grep log files is impossible.",
      "**Centralized Logging Architecture** aggregates logs from all containers into a searchable data store in real time.",
      "**Standard Stacks**:",
      "1. **ELK / Elastic Stack**: Filebeat (log shipper on host) -> Logstash (parser/filter) -> Elasticsearch (indexing engine) -> Kibana (dashboard visualization).",
      "2. **PLG Stack**: Promtail -> Grafana Loki -> Grafana.",
      "**Structured JSON Logging**:",
      "Rather than emitting unstructured text strings, microservices should emit single-line **structured JSON** to standard output (stdout). JSON logs natively capture metadata: `timestamp`, `log.level`, `service.name`, `traceId`, `spanId`, `thread`, and `message`.",
      "Libraries like `logstash-logback-encoder` format logs as JSON automatically."
    ],
    keyPoints: [
      "Centralized logging aggregates logs from all microservices into Elasticsearch or Loki.",
      "Applications must write structured JSON to standard output (`stdout`).",
      "Docker and Kubernetes automatically harvest stdout streams.",
      "Trace IDs embedded in logs allow querying all log lines for a specific user request."
    ],
    code: [
      {
        title: "Logback JSON Encoder Configuration (logback-spring.xml)",
        language: "xml",
        content: `<configuration>
    <appender name="jsonConsole" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <!-- Automatically includes MDC variables: traceId, spanId -->
            <includeMdcKeyName>traceId</includeMdcKeyName>
            <includeMdcKeyName>spanId</includeMdcKeyName>
            <customFields>{"app_name":"order-service","env":"production"}</customFields>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="jsonConsole"/>
    </root>
</configuration>`
      }
    ],
    tip: "Never write log files directly to local container filesystems. Containers are ephemeral; always output logs to stdout so container engines can handle log shipping."
  },
  {
    id: "ms-saga",
    title: "Saga Pattern",
    difficulty: "Hard",
    theory: [
      "In a microservices architecture with a Database-Per-Service, executing a traditional two-phase commit (2PC / XA) distributed database transaction across network boundaries is fragile, slow, and not supported by most modern databases (NoSQL, Kafka).",
      "The **Saga Pattern** manages distributed transactions as a sequence of local transactions across multiple services. Each local transaction updates the database and publishes an event or message triggering the next step.",
      "**Compensating Transactions**:",
      "If a step in the saga fails (e.g. Payment Declined or Out of Stock), the saga executes a series of **Compensating Transactions** that run in reverse order to undo the changes made by previous successful steps (e.g. Cancel Order, Refund Credit, Unreserve Inventory).",
      "**Two Saga Coordination Approaches**:",
      "1. **Choreography (Event-Driven)**: Decentralized. Services publish domain events to a broker (Kafka), and other services listen and react. Simple for small workflows, but hard to trace as complexity grows.",
      "2. **Orchestration (Centralized Coordinator)**: A central Saga Orchestrator tells participants what local transactions to execute via command/reply messaging. Easier to maintain and visualize complex business workflows."
    ],
    keyPoints: [
      "Replaces distributed 2PC transactions in Database-Per-Service architectures.",
      "A Saga is a sequence of local transactions coordinated via events or commands.",
      "Failures trigger Compensating Transactions that semantically undo previous steps.",
      "Implemented via Choreography (event-driven) or Orchestration (central state machine)."
    ],
    code: [
      {
        title: "Saga Orchestrator State Machine Flow (Conceptual)",
        language: "java",
        content: `package com.algoguru.saga;

import org.springframework.stereotype.Service;

@Service
public class OrderSagaOrchestrator {

    public void executeOrderSaga(OrderContext ctx) {
        try {
            // Step 1: Create pending order
            orderService.createPendingOrder(ctx);

            // Step 2: Reserve inventory
            inventoryService.reserveItems(ctx);

            // Step 3: Process payment
            paymentService.chargeCard(ctx);

            // Success: Finalize order
            orderService.markConfirmed(ctx);
        } catch (PaymentFailedException ex) {
            // Compensating Transaction: Roll back inventory
            inventoryService.cancelReservation(ctx);
            orderService.markCancelled(ctx);
        } catch (Exception ex) {
            orderService.markCancelled(ctx);
        }
    }
}`
      }
    ],
    note: "Sagas provide **Eventual Consistency**, not instantaneous ACID consistency. Domain entities must support intermediate pending states (e.g. `ORDER_PENDING`, `PAYMENT_PROCESSING`)."
  },
  {
    id: "ms-event-driven",
    title: "Event-Driven Architecture",
    difficulty: "Hard",
    theory: [
      "Synchronous HTTP REST communication couples microservices in time and availability: if the target service is down, the caller fails. **Event-Driven Architecture (EDA)** decouples services through asynchronous messaging.",
      "**Core Concepts**:",
      "- **Producer**: Emits a domain event (e.g. `OrderCreatedEvent`) when a state change occurs.",
      "- **Event Broker**: Stores and distributes events (Apache Kafka, RabbitMQ, AWS SQS/SNS).",
      "- **Consumer**: Subscribes to events and processes them independently at its own pace.",
      "**Spring Support**:",
      "1. **Spring Cloud Stream**: An abstraction framework that binds business logic to message brokers using standard Java `Consumer`, `Supplier`, and `Function` functional interfaces.",
      "2. **Spring for Apache Kafka (`spring-kafka`)**: Native, high-throughput integration providing `KafkaTemplate` for publishing and `@KafkaListener` for consuming topics.",
      "**Transactional Outbox Pattern**:",
      "Guarantees that database updates and event publishing occur atomically without two-phase commit: save both the business entity and an outbox message in the same local database transaction, then use a tool like Debezium (CDC) to publish outbox records to Kafka reliably."
    ],
    keyPoints: [
      "Decouples microservices in time, availability, and throughput.",
      "Producers publish domain events; consumers process them asynchronously.",
      "Apache Kafka provides partitioned, replayable, distributed event logs.",
      "Transactional Outbox Pattern guarantees at-least-once message delivery without 2PC."
    ],
    code: [
      {
        title: "Spring Kafka Producer and Listener",
        language: "java",
        content: `package com.algoguru.messaging;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

public record OrderPlacedEvent(String orderId, String customerEmail, double amount) {}

@Service
public class OrderEventService {

    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;

    public OrderEventService(KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // Producer
    public void publishOrderPlaced(OrderPlacedEvent event) {
        kafkaTemplate.send("order-placed-topic", event.orderId(), event);
    }

    // Consumer in Notification Service
    @KafkaListener(topics = "order-placed-topic", groupId = "notification-group")
    public void handleOrderPlaced(OrderPlacedEvent event) {
        // Send order confirmation email asynchronously
        System.out.println("Sending confirmation email to: " + event.customerEmail());
    }
}`
      }
    ],
    tip: "Always ensure your consumers are **idempotent** (can safely process the exact same message twice), because distributed message brokers guarantee at-least-once delivery."
  },
  {
    id: "ms-api-composition",
    title: "API Composition",
    difficulty: "Medium",
    theory: [
      "When domain data is split across multiple microservices with separate databases, retrieving a consolidated view (e.g. an Order Details page displaying Order info, Customer info, Product details, and Shipping status) requires combining data from four separate services.",
      "**API Composition (Aggregator Pattern)**:",
      "An API Composer service invokes each individual microservice concurrently over HTTP/gRPC, gathers their partial responses, and in-memory combines them into a consolidated composite DTO for the client.",
      "**Implementation Strategies**:",
      "1. **Parallel Execution**: Using Java `CompletableFuture.allOf()` or Project Reactor `Mono.zip()` to query services in parallel, reducing total latency to $\\max(t_1, t_2, \\dots)$ instead of $\\sum t_i$.",
      "2. **Backend-For-Frontend (BFF)**: Providing separate composition layers tailored to specific client devices (e.g. mobile app BFF returning minimal data vs desktop web BFF returning rich data).",
      "3. **CQRS Alternative**: For read operations requiring complex multi-table joins or queries across services, use CQRS (Command Query Responsibility Segregation) with materialized read views updated via Kafka domain events."
    ],
    keyPoints: [
      "Combines data from multiple microservices into a single composite DTO.",
      "Execute calls in parallel using `CompletableFuture` or `Mono.zip()` to minimize latency.",
      "Backend-For-Frontend (BFF) tailors composition to specific client form factors.",
      "CQRS materialized views serve as a high-performance alternative for complex querying."
    ],
    code: [
      {
        title: "Parallel API Composition Using CompletableFuture",
        language: "java",
        content: `package com.algoguru.aggregator;

import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class OrderDetailAggregatorService {

    public record ConsolidatedOrderView(OrderDto order, CustomerDto customer, DeliveryDto delivery) {}

    public ConsolidatedOrderView getFullOrderDetails(Long orderId) {
        // Execute calls to Order, Customer, and Delivery services in parallel!
        CompletableFuture<OrderDto> orderFuture = 
            CompletableFuture.supplyAsync(() -> fetchOrder(orderId));

        CompletableFuture<CustomerDto> customerFuture = orderFuture
            .thenCompose(order -> CompletableFuture.supplyAsync(() -> fetchCustomer(order.customerId())));

        CompletableFuture<DeliveryDto> deliveryFuture = 
            CompletableFuture.supplyAsync(() -> fetchDeliveryStatus(orderId));

        // Wait for all parallel queries to complete
        CompletableFuture.allOf(orderFuture, customerFuture, deliveryFuture).join();

        return new ConsolidatedOrderView(orderFuture.join(), customerFuture.join(), deliveryFuture.join());
    }

    private OrderDto fetchOrder(Long id) { return new OrderDto(id, 101L, 250.0); }
    private CustomerDto fetchCustomer(Long id) { return new CustomerDto(id, "Aritra"); }
    private DeliveryDto fetchDeliveryStatus(Long id) { return new DeliveryDto("In Transit"); }

    record OrderDto(Long id, Long customerId, double total) {}
    record CustomerDto(Long id, String name) {}
    record DeliveryDto(String status) {}
}`
      }
    ],
    warning: "Avoid cascading sequential API calls in API composition. Always compose calls concurrently to prevent catastrophic latency degradation."
  },
  {
    id: "ms-service-mesh",
    title: "Service Mesh Overview",
    difficulty: "Hard",
    theory: [
      "In massive microservices deployments with hundreds of services written in different programming languages (Java, Go, Python, Node.js), embedding discovery, mTLS, circuit breakers, and distributed tracing directly into application code via Spring Cloud libraries creates language lock-in and maintenance overhead.",
      "A **Service Mesh** is a dedicated infrastructure layer that handles service-to-service communication transparently outside the application code.",
      "**Architecture**:",
      "1. **Data Plane**: High-performance lightweight network proxies (such as **Envoy Proxy**) deployed as **Sidecar Containers** alongside each application container in Kubernetes pods. All incoming and outgoing network traffic flows through the sidecar proxy.",
      "2. **Control Plane** (e.g. **Istio**, **Linkerd**): Manages and configures the sidecar proxies centrally (routing rules, traffic shifting, canary releases, rate limits, and cryptographic certificate issuance).",
      "**Features Provided by Service Mesh**:",
      "- **Zero-Trust Security**: Automatic mutual TLS (mTLS) encryption and certificate rotation between all microservices without changing a single line of Java code.",
      "- **Traffic Management**: Canary rollouts (e.g. route 90% of traffic to v1 and 10% to v2), fault injection, and circuit breaking.",
      "- **Observability**: Automatic collection of golden metrics (latency, traffic, errors, saturation) and distributed tracing headers."
    ],
    keyPoints: [
      "Service Mesh offloads networking, security, and observability to sidecar proxies (Envoy).",
      "Popular implementations: Istio, Linkerd, Consul Connect.",
      "Provides automatic mutual TLS (mTLS) encryption without application code changes.",
      "Enables advanced traffic routing (canary deployments, blue-green shifting) at the network layer."
    ],
    code: [
      {
        title: "Istio VirtualService Canary Traffic Routing (90% v1, 10% v2)",
        language: "yaml",
        content: `apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service-routing
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 90
        - destination:
            host: order-service
            subset: v2
          weight: 10`
      }
    ],
    note: "When using a Service Mesh like Istio, you can eliminate Spring Cloud Netflix Eureka, Ribbon, and Zuul from your Java applications, keeping your Spring Boot microservices lightweight and focused purely on business logic."
  }
];

export const springBootMicroservicesContent: ContentSection[] = attachDiagrams(
  springBootMicroservicesRaw,
  springBootMicroservicesVisualizations,
);
