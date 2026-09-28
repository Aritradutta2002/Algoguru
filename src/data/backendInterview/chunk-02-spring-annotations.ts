import { defineBackendChunk } from "./contract";

/**
 * Spring & Spring Boot annotations (b017–b036).
 *
 * The emphasis is on what the container *does* when it sees each annotation:
 * bean definition, proxy creation, ordering, and the failure modes that follow.
 */
export const chunk02SpringAnnotations = defineBackendChunk({
  topic: "spring-annotations",
  questions: [
    {
      id: "b017",
      question: "What does @SpringBootApplication expand to, and what does each part do?",
      answer:
        "`@SpringBootApplication` is a composed annotation equivalent to three annotations plus some defaults:\n\n" +
        "1. @SpringBootConfiguration:\n\n" +
        "- A specialisation of `@Configuration`, so the annotated class is itself a source of bean definitions.\n" +
        "- The specialisation matters for tests: `SpringBootTestContextBootstrapper` walks **up the package tree** looking for exactly one `@SpringBootConfiguration` to use as the default context. That is why your tests 'just find' the app class.\n\n" +
        "2. @EnableAutoConfiguration:\n\n" +
        "- Imports `AutoConfigurationImportSelector`, which reads every `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` file on the classpath (in Boot 2.x it was `spring.factories`).\n" +
        "- Each candidate class is filtered by its `@Conditional...` annotations and, if it survives, contributes beans **last**, after your own configuration — which is what makes `@ConditionalOnMissingBean` back off correctly.\n\n" +
        "3. @ComponentScan:\n\n" +
        "- Scans the **package of the annotated class and all sub-packages**. This is why the main class belongs at the root of your package tree; a class in a sibling package is invisible.\n" +
        "- Boot adds two `TypeExcludeFilter`s so test-only components and auto-configuration classes are not picked up twice.\n\n" +
        "Useful attributes: `scanBasePackages`, `exclude = {DataSourceAutoConfiguration.class}`, `excludeName`, and `proxyBeanMethods = false` (a small startup win when your `@Bean` methods never call each other).\n\n" +
        "**The trap:** people 'fix' a missing bean by adding `@ComponentScan(\"com.acme\")` to the app class, which **replaces** the default scan of the current package. Prefer `scanBasePackages` or move the class.",
      code: `package com.acme.shop;                         // <- root package matters

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(
    scanBasePackages = { "com.acme.shop", "com.acme.shared" },  // adds, not replaces
    exclude = { DataSourceAutoConfiguration.class },            // opt out of a slice
    proxyBeanMethods = false                                    // lite mode, faster start
)
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}

// Equivalent long form:
//
// @SpringBootConfiguration
// @EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)
// @ComponentScan(basePackages = {"com.acme.shop", "com.acme.shared"},
//     excludeFilters = {
//         @ComponentScan.Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
//         @ComponentScan.Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class)
//     })
// public class ShopApplication { }`,
      codeLanguage: "java",
      explanation:
        "Three annotations in one: configuration source, auto-config import selector, and a component scan rooted at the declaring package.",
      followUps: [
        "Why must the main class sit at the root of the package tree?",
        "What does proxyBeanMethods = false actually change?",
      ],
    },
    {
      id: "b018",
      question: "@Component vs @Bean — when do you use each, and what is the real difference?",
      answer:
        "Both produce a bean definition, but they differ in **who owns the class** and **how the instance is created**.\n\n" +
        "@Component (and its stereotypes @Service, @Repository, @Controller):\n\n" +
        "- A **class-level** annotation discovered by component scanning.\n" +
        "- Spring instantiates the class itself, so you must own the source.\n" +
        "- One bean per annotated class. Configuration comes from `@Value`, `@ConfigurationProperties` or constructor injection.\n" +
        "- Default bean name is the de-capitalised simple class name (`OrderService` → `orderService`).\n\n" +
        "@Bean:\n\n" +
        "- A **method-level** annotation inside a `@Configuration` (or `@Component`) class. **You** write the instantiation code.\n" +
        "- The only option for third-party classes you cannot annotate: `ObjectMapper`, `DataSource`, `RestClient`, a Kafka `ProducerFactory`.\n" +
        "- Lets you create **several beans of the same type** with different configuration, and gives you a natural place for conditional logic.\n" +
        "- Default bean name is the **method name**; `@Bean(name = ...)` overrides it and `@Bean(initMethod=, destroyMethod=)` wires lifecycle callbacks on classes you cannot annotate.\n\n" +
        "**The key mechanic: `proxyBeanMethods`.** In a full `@Configuration` class Spring CGLIB-subclasses the configuration and intercepts `@Bean` method calls, so calling `dataSource()` twice returns the **same singleton**. Set `proxyBeanMethods = false` (or use `@Component`) and the call is a plain Java call producing a **second, unmanaged instance**. The safe pattern is to declare the dependency as a **method parameter** instead of calling the method.\n\n" +
        "**Rule:** your code → `@Component`; someone else's code or multiple variants → `@Bean`.",
      code: `import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.*;
import org.springframework.stereotype.Service;

@Service                                       // your class -> component scanning
class OrderService {
    private final ObjectMapper mapper;
    OrderService(ObjectMapper mapper) { this.mapper = mapper; }
}

@Configuration                                 // proxyBeanMethods = true by default
class JacksonConfig {

    @Bean                                      // third-party class -> @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    ReportWriter reportWriter() {
        // CGLIB intercepts this call -> returns the SINGLETON objectMapper bean.
        return new ReportWriter(objectMapper());
    }

    @Bean                                      // preferred style: inject the parameter
    AuditWriter auditWriter(ObjectMapper mapper) {
        return new AuditWriter(mapper);
    }
}

@Configuration(proxyBeanMethods = false)       // "lite" mode - no CGLIB subclass
class LiteConfig {
    @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }

    @Bean ReportWriter reportWriter() {
        // BUG in lite mode: a plain Java call -> a SECOND, unmanaged ObjectMapper.
        return new ReportWriter(objectMapper());
    }
}`,
      codeLanguage: "java",
      explanation:
        "@Component scans classes you own; @Bean factory-methods wrap classes you do not — and proxyBeanMethods decides whether inter-bean calls stay singletons.",
      followUps: [
        "What breaks if you put @Bean methods in a @Component instead of @Configuration?",
        "How do you register two DataSources safely?",
      ],
    },
    {
      id: "b019",
      question: "Explain the stereotype annotations: @Component, @Service, @Repository, @Controller, @RestController.",
      answer:
        "All five end up as `@Component` through meta-annotation, so they are functionally interchangeable for **bean detection**. Three of them add real behaviour on top.\n\n" +
        "@Component — the generic stereotype. Use it when nothing more specific fits: a converter, a strategy, a validator.\n\n" +
        "@Service — **pure semantics, zero extra behaviour**. Be honest about this in an interview: it marks the business/service layer for humans, tooling and AOP pointcuts (`within(@org.springframework.stereotype.Service *)`). Anyone who claims it adds transactional behaviour is wrong.\n\n" +
        "@Repository — the one that **does** add behaviour. `PersistenceExceptionTranslationPostProcessor` wraps the bean in a proxy that converts vendor-specific exceptions (Hibernate's `ConstraintViolationException`, a raw `SQLException`) into Spring's consistent `DataAccessException` hierarchy — `DuplicateKeyException`, `OptimisticLockingFailureException`, and friends. That gives your service layer a persistence-agnostic contract.\n\n" +
        "@Controller — registers the bean as a Spring MVC handler; `RequestMappingHandlerMapping` scans it for `@RequestMapping` methods. Return values are resolved as **view names** by default.\n\n" +
        "@RestController — `@Controller` + `@ResponseBody`. Every handler's return value goes through an `HttpMessageConverter` (Jackson for JSON) and straight into the response body instead of the view resolver. This is the single most common annotation in a Boot API.\n\n" +
        "**Also worth naming:** `@Configuration` is itself a stereotype, `@ControllerAdvice`/`@RestControllerAdvice` are component-scanned, and `@Component` on a class with a constructor taking one argument gets that argument autowired without `@Autowired` since Spring 4.3.",
      code: `import org.springframework.dao.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;

@Repository                            // adds DataAccessException translation
class OrderRepository {
    Order save(Order o) {
        // A Hibernate ConstraintViolationException or a raw SQLException thrown
        // here is translated to org.springframework.dao.DuplicateKeyException.
        return o;
    }
}

@Service                               // semantic marker only - no added behaviour
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository repo) { this.repo = repo; }   // no @Autowired needed

    Order place(Order o) {
        try {
            return repo.save(o);
        } catch (DuplicateKeyException e) {                    // vendor-agnostic
            throw new IllegalStateException("duplicate order reference", e);
        }
    }
}

@RestController                        // = @Controller + @ResponseBody
@RequestMapping("/api/orders")
class OrderApi {
    private final OrderService service;
    OrderApi(OrderService service) { this.service = service; }

    @PostMapping
    Order create(@RequestBody Order o) { return service.place(o); }   // serialised to JSON
}

@Controller                            // classic MVC - returns a VIEW NAME
class OrderPages {
    @GetMapping("/orders")
    String list() { return "orders/list"; }        // resolved by a ViewResolver
}`,
      codeLanguage: "java",
      explanation:
        "Only @Repository (exception translation) and @RestController (implicit @ResponseBody) add behaviour; @Service is purely semantic.",
      followUps: [
        "Show a case where @Repository's exception translation changes your catch block.",
        "What happens if you put @Service on a controller?",
      ],
    },
    {
      id: "b020",
      question: "@Autowired vs constructor injection vs @Inject vs @Resource — which and why?",
      answer:
        "Three injection styles, and only one of them is right by default.\n\n" +
        "Constructor injection (the recommended default):\n\n" +
        "- Dependencies can be `final`, so the object is **immutable and fully initialised** the moment it exists.\n" +
        "- Impossible to construct an invalid instance, which makes unit testing trivial — just call `new OrderService(mockRepo)`.\n" +
        "- A **circular dependency fails fast at startup** instead of silently working. Since Boot 2.6 circular references are rejected by default.\n" +
        "- Since Spring 4.3, `@Autowired` is **optional** when the class has exactly one constructor.\n\n" +
        "Field injection (`@Autowired` on a field):\n\n" +
        "- Concise but the field cannot be `final`, reflection is required to set it in tests, and it hides a bloated constructor so classes quietly grow ten dependencies.\n" +
        "- IntelliJ literally warns 'Field injection is not recommended'. Say that out loud in the interview.\n\n" +
        "Setter injection:\n\n" +
        "- The right tool for genuinely **optional** or reconfigurable dependencies; also the historical escape hatch for circular references.\n\n" +
        "The annotation variants:\n\n" +
        "- **`@Autowired`** — Spring's own, `required` defaults to `true`; you can also inject `Optional<T>`, `ObjectProvider<T>` or `List<T>`/`Map<String,T>` of all implementations.\n" +
        "- **`@Inject`** — the JSR-330 standard (`jakarta.inject`), behaves like `@Autowired(required = true)` but has no `required` flag. Portable across DI containers.\n" +
        "- **`@Resource`** — JSR-250, resolves **by name first** (field/setter name or the `name` attribute), then falls back to type. Different resolution order is the whole point, and the usual reason it is used deliberately.",
      code: `import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
class ShippingService {

    // 1. PREFERRED - constructor injection, final fields, no @Autowired needed.
    private final RateCalculator rateCalculator;
    private final List<ShippingCarrier> carriers;           // all impls, ordered by @Order
    private final Map<String, ShippingCarrier> byName;      // bean name -> bean

    ShippingService(RateCalculator rateCalculator,
                    List<ShippingCarrier> carriers,
                    Map<String, ShippingCarrier> byName) {
        this.rateCalculator = rateCalculator;
        this.carriers = carriers;
        this.byName = byName;
    }

    // 2. Optional dependency - present only in some profiles.
    @Autowired(required = false)
    private CustomsDeclarationClient customs;

    // 3. Lazy / on-demand lookup without eager wiring.
    @Autowired private ObjectProvider<AuditSink> auditSinks;

    // 4. JSR-330 standard - portable, no 'required' attribute.
    @Inject private TrackingClient tracking;

    // 5. JSR-250 - resolves BY NAME first, then by type.
    @Resource(name = "fedexCarrier") private ShippingCarrier preferred;

    void ship(String orderId) {
        auditSinks.ifAvailable(sink -> sink.record(orderId));
        preferred.dispatch(orderId);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Constructor injection gives final fields, fail-fast cycles and testability; @Resource differs by resolving on name before type.",
      followUps: [
        "Why did Spring Boot 2.6 start rejecting circular references?",
        "When is ObjectProvider better than @Lazy?",
      ],
    },
    {
      id: "b021",
      question: "How does Spring resolve ambiguity — @Primary, @Qualifier, @Order, and generics?",
      answer:
        "When more than one bean matches an injection point Spring throws `NoUniqueBeanDefinitionException`. It resolves the ambiguity in a defined order.\n\n" +
        "Resolution sequence:\n\n" +
        "1. **By type** — collect every candidate.\n" +
        "2. **`@Qualifier`** on the injection point — narrows to a matching qualifier value or bean name. This wins over everything else.\n" +
        "3. **`@Primary`** on a bean definition — the default choice when no qualifier is present. Exactly one per type; two primaries is an error.\n" +
        "4. **Generic type match** — `Repository<Order>` versus `Repository<Customer>` is disambiguated automatically because Spring 4 keeps generic type information in the bean definition.\n" +
        "5. **Field or parameter name** matches a bean name — the last-resort fallback, and a fragile one, since renaming a parameter changes wiring.\n\n" +
        "@Order / Ordered / @Priority:\n\n" +
        "- Do **not** influence which single bean is selected. They control the **order of a collection** when you inject `List<T>`, and the order of filters, aspects and `CommandLineRunner`s. Lower value = higher precedence. `jakarta.annotation.Priority` does affect single-bean selection where `@Primary` is absent.\n\n" +
        "Custom qualifiers are the clean pattern:\n\n" +
        "- Rather than stringly-typed `@Qualifier(\"fast\")`, declare your own annotation meta-annotated with `@Qualifier`. You get compile-time safety and IDE navigation.\n\n" +
        "**Boot's own idiom:** most auto-configured beans are declared `@ConditionalOnMissingBean`, so simply defining your own bean of that type replaces the default — a different, and often better, solution than qualifiers.",
      code: `import java.lang.annotation.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.*;
import java.util.List;

interface PaymentGateway { String charge(long amount); }

@Component @Primary @Order(1)
class StripeGateway implements PaymentGateway {
    public String charge(long a) { return "stripe:" + a; }
}

@Component @Order(2)
@Qualifier("legacy")
class PayPalGateway implements PaymentGateway {
    public String charge(long a) { return "paypal:" + a; }
}

// A typed custom qualifier beats stringly-typed @Qualifier("...").
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
@interface Sandbox {}

@Component @Sandbox
class SandboxGateway implements PaymentGateway {
    public String charge(long a) { return "sandbox:" + a; }
}

@Service
class Checkout {
    private final PaymentGateway defaultGateway;   // -> Stripe   (@Primary)
    private final PaymentGateway legacyGateway;    // -> PayPal   (@Qualifier)
    private final PaymentGateway sandboxGateway;   // -> Sandbox  (typed qualifier)
    private final List<PaymentGateway> all;        // -> [Stripe, PayPal, Sandbox] by @Order

    Checkout(PaymentGateway defaultGateway,
             @Qualifier("legacy") PaymentGateway legacyGateway,
             @Sandbox PaymentGateway sandboxGateway,
             List<PaymentGateway> all) {
        this.defaultGateway = defaultGateway;
        this.legacyGateway = legacyGateway;
        this.sandboxGateway = sandboxGateway;
        this.all = all;
    }
}`,
      codeLanguage: "java",
      explanation:
        "@Qualifier beats @Primary beats generic match beats name match; @Order only sequences injected collections, it never picks the winner.",
      followUps: [
        "How does Spring disambiguate Repository<Order> from Repository<Customer>?",
        "Why is relying on parameter-name matching fragile?",
      ],
    },
    {
      id: "b022",
      question: "Explain @Transactional in depth: propagation, isolation, rollback rules and the self-invocation trap.",
      answer:
        "`@Transactional` is implemented by a **proxy**. `TransactionInterceptor` opens a transaction before the method, commits after a normal return and rolls back on a matching exception. Everything surprising about it follows from that one fact.\n\n" +
        "Propagation (what happens when a transaction already exists):\n\n" +
        "- **REQUIRED** (default) — join the current transaction or start one. A rollback anywhere kills the whole thing.\n" +
        "- **REQUIRES_NEW** — suspend the outer transaction and run in a genuinely independent one; needs a second DB connection.\n" +
        "- **NESTED** — a JDBC savepoint inside the current transaction; the inner part can roll back alone. Not supported by JPA/Hibernate in every setup.\n" +
        "- **SUPPORTS**, **NOT_SUPPORTED**, **MANDATORY**, **NEVER** — join if present / suspend / require / forbid.\n\n" +
        "Isolation: `DEFAULT` (the database's own), `READ_UNCOMMITTED`, `READ_COMMITTED` (Postgres/Oracle default), `REPEATABLE_READ` (MySQL InnoDB default), `SERIALIZABLE`. Know the anomalies each one prevents: dirty read, non-repeatable read, phantom read.\n\n" +
        "Rollback rules — the classic gotcha:\n\n" +
        "- By default Spring rolls back on **`RuntimeException` and `Error` only**. A **checked exception commits the transaction.**\n" +
        "- Override with `rollbackFor = Exception.class` or `noRollbackFor = ...`.\n" +
        "- Once a transaction is marked rollback-only, catching the exception higher up still ends in `UnexpectedRollbackException`.\n\n" +
        "The traps:\n\n" +
        "- **Self-invocation does nothing.** `this.otherTransactionalMethod()` never crosses the proxy.\n" +
        "- **`private`, `final`, `static` methods are not advised** (Spring AOP; AspectJ weaving can do it).\n" +
        "- `readOnly = true` lets Hibernate skip dirty checking and hints the driver/replica routing.\n" +
        "- `timeout` applies to the transaction, not the individual statement.",
      code: `import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
class OrderService {

    private final OrderRepository orders;
    private final AuditService audit;              // separate bean -> proxy IS crossed
    OrderService(OrderRepository o, AuditService a) { this.orders = o; this.audit = a; }

    @Transactional(
        propagation = Propagation.REQUIRED,
        isolation   = Isolation.READ_COMMITTED,
        timeout     = 10,
        rollbackFor = Exception.class)             // roll back on CHECKED exceptions too
    public void place(Order order) throws InsufficientStockException {
        orders.save(order);
        audit.recordAlways(order.getRef());        // commits even if we roll back
        if (order.getQty() > stockOf(order)) {
            throw new InsufficientStockException(); // checked -> would COMMIT without rollbackFor
        }
    }

    @Transactional(readOnly = true)                // no dirty checking, replica-friendly
    public Order find(String ref) { return orders.findByRef(ref); }

    public void placeAll(java.util.List<Order> batch) {
        for (Order o : batch) {
            // BUG: self-invocation - the proxy is bypassed, NO transaction is started.
            try { place(o); } catch (Exception ignored) { }
        }
    }
    private int stockOf(Order o) { return 0; }
}

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)   // independent tx
    public void recordAlways(String ref) { /* survives the caller's rollback */ }
}`,
      codeLanguage: "java",
      explanation:
        "Everything follows from the proxy: checked exceptions commit by default, self-invocation is untransactional, and REQUIRES_NEW needs a second connection.",
      followUps: [
        "Why does catching the exception still produce UnexpectedRollbackException?",
        "How would you make placeAll() transactional per item?",
      ],
    },
    {
      id: "b023",
      question: "What are bean scopes and how do you inject a shorter-lived bean into a singleton?",
      answer:
        "Core scopes:\n\n" +
        "- **singleton** (default) — one instance per container, created eagerly at startup.\n" +
        "- **prototype** — a new instance on **every** lookup or injection. Crucially, Spring does **not** manage the full lifecycle: `@PreDestroy` is never called on a prototype bean, so you own cleanup.\n\n" +
        "Web scopes (only in a web-aware context):\n\n" +
        "- **request** — one instance per HTTP request.\n" +
        "- **session** — one per HTTP session.\n" +
        "- **application** — one per `ServletContext`.\n" +
        "- **websocket** — one per WebSocket session.\n\n" +
        "**The scoped-proxy problem.** A singleton's dependencies are injected exactly once at creation. Inject a prototype or request-scoped bean directly and you capture the **first** instance forever — for a request-scoped bean that is usually a startup failure or, worse, a cross-request data leak.\n\n" +
        "Three correct solutions:\n\n" +
        "1. **`proxyMode = ScopedProxyMode.TARGET_CLASS`** (or `@RequestScope`, which already implies it). Spring injects a CGLIB proxy; every method call resolves the real bean for the current request from the scope. Simplest and the usual choice.\n" +
        "2. **`ObjectProvider<T>` / `Provider<T>`** — call `getObject()` for a fresh instance at the moment you need one. Explicit and proxy-free.\n" +
        "3. **`@Lookup`** — Spring overrides an abstract method to return a new prototype each call. Older style, still valid.\n\n" +
        "**Interview line:** 'scope mismatch is resolved with a scoped proxy or a provider, because a singleton's dependencies are wired once and never re-resolved.'",
      code: `import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Lookup;
import org.springframework.context.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.web.context.annotation.RequestScope;

@Component
@Scope(value = ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class ReportJob {
    @PreDestroy void close() { /* NEVER called - prototypes are not fully managed */ }
}

@Component
@RequestScope                       // implies proxyMode = TARGET_CLASS
class RequestContext {
    private String correlationId;
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String id) { this.correlationId = id; }
}

@Service                            // SINGLETON
class ReportService {

    // (1) scoped proxy: this is a CGLIB proxy, resolved per request on every call
    private final RequestContext requestContext;

    // (2) provider: a fresh prototype on demand
    private final ObjectProvider<ReportJob> jobProvider;

    ReportService(RequestContext requestContext, ObjectProvider<ReportJob> jobProvider) {
        this.requestContext = requestContext;
        this.jobProvider = jobProvider;
    }

    public String run() {
        ReportJob job = jobProvider.getObject();          // new instance each call
        return job + " for " + requestContext.getCorrelationId();
    }

    // (3) @Lookup: Spring overrides this method to return a new prototype.
    @Lookup ReportJob newJob() { return null; }
}`,
      codeLanguage: "java",
      explanation:
        "Singletons wire dependencies once — a scoped proxy or ObjectProvider is what re-resolves a shorter-lived bean per call.",
      followUps: [
        "Why is @PreDestroy never invoked on a prototype bean?",
        "What happens if you inject a @RequestScope bean without a proxy?",
      ],
    },
    {
      id: "b024",
      question: "Explain @Configuration, @Import, @ImportResource and @ComponentScan filters.",
      answer:
        "@Configuration:\n\n" +
        "- Declares a class as a source of `@Bean` definitions. With `proxyBeanMethods = true` (default) Spring creates a **CGLIB subclass** so inter-bean method calls return the managed singleton — 'full' mode. `proxyBeanMethods = false` gives 'lite' mode: no subclass, faster startup, but inter-bean calls create new objects.\n" +
        "- A `@Configuration` class must not be `final` in full mode, and its `@Bean` methods must not be `private` or `final`.\n\n" +
        "@Import:\n\n" +
        "- Pulls in additional configuration **without component scanning**, which is exactly how library starters compose. Three flavours:\n" +
        "- a plain `@Configuration` class,\n" +
        "- an `ImportSelector` — returns class names to import, decided at runtime from the importing class's annotation metadata (this is what `@EnableXxx` annotations use),\n" +
        "- an `ImportBeanDefinitionRegistrar` — registers bean definitions programmatically (how `@MapperScan`, `@EnableJpaRepositories` and Feign register dynamic proxies).\n\n" +
        "@ImportResource: imports legacy XML bean definitions into an annotation-driven context — a real migration tool, occasionally asked about.\n\n" +
        "@ComponentScan filters:\n\n" +
        "- `includeFilters` / `excludeFilters` with `FilterType.ANNOTATION`, `ASSIGNABLE_TYPE`, `ASPECTJ`, `REGEX` or `CUSTOM`.\n" +
        "- Set `useDefaultFilters = false` to scan **only** what your include filter matches — the pattern for narrow, purpose-built contexts and fast tests.\n\n" +
        "**The composition insight:** `@EnableCaching`, `@EnableAsync`, `@EnableWebSecurity` are all just `@Import` of a selector or registrar. Saying that shows you understand the extension model rather than memorising annotations.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.beans.factory.support.*;

@Configuration
@Import({ CacheConfig.class, FeatureSelector.class, MetricsRegistrar.class })
@ImportResource("classpath:legacy-beans.xml")
@ComponentScan(
    basePackages = "com.acme.shop",
    useDefaultFilters = false,                                  // scan ONLY the includes
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ANNOTATION,
        classes = org.springframework.stereotype.Service.class),
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX, pattern = "com\\\\.acme\\\\.shop\\\\.legacy\\\\..*"))
class AppConfig { }

@Configuration(proxyBeanMethods = false)
class CacheConfig {
    @Bean CacheManager cacheManager() { return new CacheManager(); }
}

/** Decides at runtime WHICH configuration classes to import. */
class FeatureSelector implements ImportSelector {
    @Override public String[] selectImports(AnnotationMetadata metadata) {
        boolean cloud = System.getenv("CLOUD") != null;
        return cloud ? new String[]{ "com.acme.shop.CloudConfig" }
                     : new String[]{ "com.acme.shop.LocalConfig" };
    }
}

/** Registers bean definitions programmatically - how @MapperScan works. */
class MetricsRegistrar implements ImportBeanDefinitionRegistrar {
    @Override public void registerBeanDefinitions(AnnotationMetadata meta,
                                                  BeanDefinitionRegistry registry) {
        registry.registerBeanDefinition("meterRegistry",
            BeanDefinitionBuilder.genericBeanDefinition(MeterRegistry.class)
                                 .setLazyInit(true)
                                 .getBeanDefinition());
    }
}`,
      codeLanguage: "java",
      explanation:
        "@Import with a selector or registrar is the extension point behind every @EnableXxx annotation and every third-party starter.",
      followUps: [
        "How would you write your own @EnableFeatureFlags annotation?",
        "Why must a full-mode @Configuration class not be final?",
      ],
    },
    {
      id: "b025",
      question: "How do @Conditional and the @ConditionalOnX family drive auto-configuration?",
      answer:
        "`@Conditional(SomeCondition.class)` registers a bean definition **only if** `Condition.matches(context, metadata)` returns true. It is evaluated during bean-definition parsing, before instantiation, so a non-matching bean never exists at all.\n\n" +
        "Spring Boot ships a large derived family:\n\n" +
        "- **`@ConditionalOnClass` / `@ConditionalOnMissingClass`** — is a type on the classpath? Evaluated by **ASM reading the class bytes**, so a missing class never triggers `NoClassDefFoundError`. This is what makes 'add the dependency and it configures itself' work.\n" +
        "- **`@ConditionalOnBean` / `@ConditionalOnMissingBean`** — the backing-off mechanism. Because auto-configuration runs **after** user configuration, `@ConditionalOnMissingBean` means 'only if the developer did not define their own'.\n" +
        "- **`@ConditionalOnProperty(name, havingValue, matchIfMissing)`** — feature flags from configuration.\n" +
        "- **`@ConditionalOnWebApplication(type = SERVLET|REACTIVE)`** / `@ConditionalOnNotWebApplication`.\n" +
        "- **`@ConditionalOnResource`**, **`@ConditionalOnExpression`** (SpEL), **`@ConditionalOnJava`**, **`@ConditionalOnCloudPlatform`**, **`@ConditionalOnSingleCandidate`**.\n" +
        "- `@Profile` is itself implemented as a `@Conditional(ProfileCondition.class)`.\n\n" +
        "**Ordering is the subtle part.** `@ConditionalOnBean` is order-sensitive: it only sees bean definitions registered **so far**. Inside auto-configuration you control order with `@AutoConfiguration(before=, after=)` (Boot 3) or `@AutoConfigureBefore`/`@AutoConfigureAfter`/`@AutoConfigureOrder`. Never use `@ConditionalOnBean` in your own user configuration — the ordering guarantee does not hold there.\n\n" +
        "**The debugging tool:** run with `--debug` or set `debug=true` to print the **Condition Evaluation Report**, which lists every positive and negative match with the reason. Mentioning that report is a strong signal you have actually debugged Boot in anger.",
      code: `import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(after = org.springframework.boot.autoconfigure.jackson
                             .JacksonAutoConfiguration.class)
@ConditionalOnClass(name = "com.acme.audit.AuditClient")   // ASM check, no class loading
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled",
                       havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                    // back off if the app defined its own
    AuditClient auditClient(AuditProperties props) {
        return new AuditClient(props.endpoint(), props.timeout());
    }

    @Bean
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    @ConditionalOnBean(AuditClient.class)        // order-sensitive: only inside auto-config
    AuditFilter auditFilter(AuditClient client) {
        return new AuditFilter(client);
    }

    @Bean
    @ConditionalOnExpression("\${acme.audit.sampling:1.0} < 1.0")
    SamplingPolicy samplingPolicy() { return new SamplingPolicy(); }
}

// Registered in:
// src/main/resources/META-INF/spring/
//   org.springframework.boot.autoconfigure.AutoConfiguration.imports
//   -> com.acme.audit.AuditAutoConfiguration`,
      codeLanguage: "java",
      explanation:
        "Conditions are evaluated on bean definitions via ASM before any class loads; @ConditionalOnMissingBean works only because auto-config runs last.",
      followUps: [
        "Why is @ConditionalOnBean unsafe in user configuration?",
        "How do you read the Condition Evaluation Report?",
      ],
    },
    {
      id: "b026",
      question: "@Value vs @ConfigurationProperties — which do you use and why?",
      answer:
        "@Value(\"${...}\"):\n\n" +
        "- Injects **one** property, resolved by a `PropertySourcesPlaceholderConfigurer`.\n" +
        "- Supports defaults (`${port:8080}`) and SpEL (`#{...}`), including expressions over other beans.\n" +
        "- No relaxed binding, **no validation**, and a typo fails at **bean creation time** with a placeholder error — or silently uses the default.\n" +
        "- Cannot be used in a constructor of a record cleanly, does not support nested structure, and testing means stubbing the environment.\n\n" +
        "@ConfigurationProperties(prefix = \"...\"):\n\n" +
        "- Binds a **whole tree** of properties onto a typed object: nested objects, `List`, `Map`, `Duration`, `DataSize`, enums, `Resource`.\n" +
        "- **Relaxed binding** — `acme.api.read-timeout`, `acme.api.readTimeout`, `ACME_API_READTIMEOUT` all bind to `readTimeout`. This is what makes environment-variable configuration work in containers.\n" +
        "- **Validation** with `@Validated` plus Jakarta constraints, so a bad value fails **at startup** with a readable message instead of at 3am.\n" +
        "- Constructor binding with `@ConfigurationProperties` on a `record` (or a class with `@ConstructorBinding`) yields a genuinely **immutable** config object.\n" +
        "- `spring-boot-configuration-processor` generates metadata so the IDE autocompletes your own properties.\n\n" +
        "**The answer interviewers want:** `@Value` for a one-off scalar, `@ConfigurationProperties` for anything that is a group of related settings — which is nearly everything in a real service. Then mention fail-fast validation, relaxed binding and immutability as the concrete reasons.",
      code: `import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.util.*;

/** Immutable, validated, relaxed-bound configuration - the preferred style. */
@Validated
@ConfigurationProperties(prefix = "acme.api")
public record ApiProperties(
        @NotBlank String baseUrl,
        @DefaultValue("2s")  Duration connectTimeout,
        @DefaultValue("10s") Duration readTimeout,
        @Min(1) @Max(64) @DefaultValue("8") int poolSize,
        @DefaultValue Map<String, String> headers,
        @NotNull Retry retry) {

    public record Retry(@DefaultValue("3") int maxAttempts,
                        @DefaultValue("500ms") Duration backoff) {}
}

@Component
class LegacyConfigUser {
    // Fine for a genuine one-off scalar.
    @Value("\${acme.api.base-url}")            private String baseUrl;
    @Value("\${acme.feature.beta:false}")      private boolean beta;      // default
    @Value("#{T(java.time.Duration).ofSeconds(30)}") private Duration ttl; // SpEL
    @Value("\${acme.api.allowed-origins}")     private List<String> origins; // comma split
}

// application.yml
// acme:
//   api:
//     base-url: https://api.acme.io
//     read-timeout: 10s
//     pool-size: 16
//     headers: { X-Tenant: acme }
//     retry: { max-attempts: 5, backoff: 250ms }`,
      codeLanguage: "java",
      explanation:
        "@ConfigurationProperties gives typed, relaxed-bound, validated, immutable config that fails at startup; @Value is a single untyped placeholder.",
      followUps: [
        "How does relaxed binding map an environment variable to a nested property?",
        "How do you make a bad property fail startup rather than at first use?",
      ],
    },
    {
      id: "b027",
      question: "Explain @Profile and how Spring decides which beans and property files are active.",
      answer:
        "A profile is a named group of beans and configuration that is only active in certain environments.\n\n" +
        "Activating a profile — the precedence order (later wins):\n\n" +
        "1. `spring.profiles.active` in `application.yml`\n" +
        "2. OS environment variable `SPRING_PROFILES_ACTIVE`\n" +
        "3. JVM system property `-Dspring.profiles.active=prod`\n" +
        "4. Command line argument `--spring.profiles.active=prod`\n" +
        "5. Programmatically via `SpringApplication.setAdditionalProfiles(...)` or `@ActiveProfiles` in tests\n\n" +
        "Use `spring.profiles.include` (or `spring.profiles.group.prod=metrics,tracing` in Boot 2.4+) to compose profiles rather than duplicating lists.\n\n" +
        "What profiles affect:\n\n" +
        "- **Bean registration** — `@Profile(\"prod\")` on a `@Component`, `@Configuration` or `@Bean` method. Expressions are supported: `@Profile(\"!test\")`, `@Profile({\"prod\",\"staging\"})`, `@Profile(\"prod & !legacy\")`.\n" +
        "- **Property files** — `application-{profile}.yml` is loaded **after** and overrides `application.yml`. In a single file, Boot 2.4+ uses `spring.config.activate.on-profile` inside a `---` document separator (the old `spring.profiles` key was removed).\n\n" +
        "If nothing is set, the `default` profile is active and `@Profile(\"default\")` beans are registered.\n\n" +
        "**The senior caveat:** profiles are excellent for *environment-shaped* differences (a mock mail sender in dev, a real one in prod) and dangerous for *feature* differences. Too many profiles means your production configuration is never the one you tested. Prefer `@ConditionalOnProperty` feature flags for behaviour, profiles for environment wiring, and keep the profile count small.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.stereotype.Service;

interface MailSender { void send(String to, String body); }

@Service
@Profile("!prod")                               // dev, test, local, anything but prod
class LoggingMailSender implements MailSender {
    public void send(String to, String body) { System.out.println("MAIL -> " + to); }
}

@Service
@Profile("prod")
class SesMailSender implements MailSender {
    public void send(String to, String body) { /* real AWS SES call */ }
}

@Configuration
class DataSourceConfig {
    @Bean @Profile("prod & !legacy")            // profile EXPRESSION
    DataSource pooledDataSource() { return new HikariDataSource(); }

    @Bean @Profile("default")                   // active when nothing is set
    DataSource h2DataSource() { return new EmbeddedDataSource(); }
}

// application.yml
// spring:
//   profiles:
//     group:
//       prod: [ metrics, tracing, cache ]      # one switch, three profiles
// ---
// spring:
//   config:
//     activate:
//       on-profile: prod                       # Boot 2.4+ syntax
//   datasource:
//     url: jdbc:postgresql://db:5432/shop

// Run:  java -jar app.jar --spring.profiles.active=prod
// Test: @ActiveProfiles("test")`,
      codeLanguage: "java",
      explanation:
        "Profiles gate bean registration and property files; use them for environment wiring and @ConditionalOnProperty for feature toggles.",
      followUps: [
        "What replaced the spring.profiles key in a multi-document YAML file?",
        "Why is a large number of profiles a production risk?",
      ],
    },
    {
      id: "b028",
      question: "Walk through the Spring MVC request annotations: @RequestMapping and its variants.",
      answer:
        "`@RequestMapping` is the general form; `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping` and `@DeleteMapping` are composed annotations that pre-set `method` (and use `@AliasFor` so `value`/`path` still work).\n\n" +
        "Narrowing attributes: `path`, `method`, `params` (`params = \"version=2\"`), `headers`, `consumes` (matched against `Content-Type`), `produces` (matched against `Accept`). Two handlers can share a path and be separated by `produces` — that is content negotiation.\n\n" +
        "Argument annotations:\n\n" +
        "- **`@PathVariable`** — a URI template segment; `@PathVariable(name=\"id\", required=false)` and `Map<String,String>` are both supported.\n" +
        "- **`@RequestParam`** — a query parameter or form field, with `defaultValue` and `required`. A `MultiValueMap` or `List<T>` collects repeats.\n" +
        "- **`@RequestBody`** — deserialise the body with an `HttpMessageConverter`; pair with `@Valid`.\n" +
        "- **`@RequestHeader`**, **`@CookieValue`**, **`@RequestPart`** (multipart), **`@ModelAttribute`** (bind form fields onto an object), **`@SessionAttribute`**, **`@RequestAttribute`**, **`@MatrixVariable`**.\n" +
        "- Unannotated arguments of known types are resolved automatically: `HttpServletRequest`, `Principal`, `Pageable`, `UriComponentsBuilder`, `BindingResult`.\n\n" +
        "Response side: `@ResponseBody` (implied by `@RestController`), `@ResponseStatus(HttpStatus.CREATED)`, or return `ResponseEntity<T>` when you need to set headers and status dynamically.\n\n" +
        "Error handling: `@ExceptionHandler` inside a controller, or globally in a `@RestControllerAdvice` class (optionally scoped with `basePackages` or `assignableTypes`). Boot 3 additionally supports RFC 7807 `ProblemDetail` responses.\n\n" +
        "**Boot 3 note:** trailing-slash matching was removed, so `/orders` and `/orders/` are no longer the same mapping — a classic upgrade bug.",
      code: `import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(path = "/api/v1/orders", produces = MediaType.APPLICATION_JSON_VALUE)
class OrderController {

    private final OrderService service;
    OrderController(OrderService service) { this.service = service; }

    @GetMapping("/{id}")
    OrderDto byId(@PathVariable Long id,
                  @RequestHeader(value = "X-Tenant", defaultValue = "public") String tenant) {
        return service.find(id, tenant);
    }

    @GetMapping                                    // /api/v1/orders?status=PAID&page=0
    List<OrderDto> search(@RequestParam(defaultValue = "ALL") String status,
                          @RequestParam(defaultValue = "0")   int page,
                          @RequestParam(required = false)     List<String> tags) {
        return service.search(status, page, tags);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
        OrderDto created = service.create(req);
        return ResponseEntity.created(URI.create("/api/v1/orders/" + created.id()))
                             .body(created);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void cancel(@PathVariable Long id) { service.cancel(id); }
}

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail notFound(OrderNotFoundException ex) {            // RFC 7807, Boot 3
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,
                                                            ex.getMessage());
        pd.setTitle("Order not found");
        return pd;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Composed shortcuts plus consumes/produces drive content negotiation; @RestControllerAdvice with ProblemDetail is the Boot 3 error idiom.",
      followUps: [
        "How do two handlers on the same path get selected by Accept header?",
        "What changed about trailing slashes in Spring Boot 3?",
      ],
    },
    {
      id: "b029",
      question: "How do @Async, @Scheduled, @EnableAsync and @EnableScheduling work — and what are the traps?",
      answer:
        "Both are **proxy-driven** and both need an explicit enabling annotation (Boot auto-configures the scheduling one when a `@Scheduled` method exists, but `@EnableAsync` you add yourself).\n\n" +
        "@Async:\n\n" +
        "- `AsyncAnnotationBeanPostProcessor` wraps the bean; the call is submitted to a `TaskExecutor` and returns immediately.\n" +
        "- Legal return types: `void` (fire and forget), `Future<T>`, `CompletableFuture<T>`, `ListenableFuture<T>`. Anything else returns `null` — a silent, nasty bug.\n" +
        "- **Traps**: self-invocation does nothing (same proxy rule); exceptions from a `void` method disappear unless you register an `AsyncUncaughtExceptionHandler`; the **default executor** in Boot 3 is a `SimpleAsyncTaskExecutor` that creates an unbounded number of threads unless you define your own or enable virtual threads — always define a bounded pool.\n" +
        "- Context does not propagate automatically: `SecurityContext`, MDC and request-scoped beans are lost. Fix with `DelegatingSecurityContextAsyncTaskExecutor` and a `TaskDecorator`.\n\n" +
        "@Scheduled:\n\n" +
        "- `fixedRate` — start every N ms regardless of duration (they can overlap if the pool allows); `fixedDelay` — N ms **after the previous run finishes**; `cron` — a six-field expression with an optional `zone`; `initialDelay` for warm-up.\n" +
        "- **Traps**: the default scheduler is a **single thread**, so one slow job delays every other job — configure `spring.task.scheduling.pool.size` or a `ThreadPoolTaskScheduler`. The method must take no arguments and normally return `void`.\n" +
        "- **In a multi-instance deployment every instance runs the job.** You need ShedLock, Quartz with a JDBC store, or a database lock. Saying this unprompted is a strong senior signal.\n" +
        "- Use `@Scheduled(cron = \"${app.cleanup.cron}\")` so the schedule is configurable, and `-` disables it entirely.",
      code: `import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import java.util.concurrent.*;

@Configuration
@EnableAsync
@EnableScheduling
class AsyncConfig implements AsyncConfigurer {

    @Bean("appExecutor")
    public Executor taskExecutor() {                       // NEVER rely on the default
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(8);
        ex.setMaxPoolSize(16);
        ex.setQueueCapacity(500);
        ex.setThreadNamePrefix("app-async-");
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.initialize();
        return ex;
    }

    @Override public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            System.err.println("async failure in " + method.getName() + ": " + ex);
    }
}

@Service
class ReportService {

    @Async("appExecutor")
    public CompletableFuture<String> build(String id) {     // typed result
        return CompletableFuture.completedFuture("report-" + id);
    }

    @Async                                                  // void -> exceptions swallowed
    public void fireAndForget(String id) { }

    @Scheduled(fixedDelay = 60_000, initialDelay = 10_000)  // 60s AFTER completion
    void refreshCache() { }

    @Scheduled(cron = "\${app.cleanup.cron:0 0 3 * * *}", zone = "Asia/Kolkata")
    void nightlyCleanup() {
        // Multi-instance deployment? Wrap with ShedLock or a DB advisory lock.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Both are proxies with the self-invocation rule; the production answers are a bounded executor, a scheduler pool size, and cluster-safe locking.",
      followUps: [
        "How do you propagate the SecurityContext into an @Async thread?",
        "How do you stop a @Scheduled job running on all five instances?",
      ],
    },
    {
      id: "b030",
      question: "Explain the caching annotations: @EnableCaching, @Cacheable, @CachePut, @CacheEvict.",
      answer:
        "Spring's cache abstraction is again a **proxy**: `CacheInterceptor` consults a `CacheManager` before or after the method runs. The abstraction is provider-agnostic — Caffeine, Redis, Hazelcast, EhCache or the simple `ConcurrentHashMap` default.\n\n" +
        "@Cacheable:\n\n" +
        "- Look up the key; on a hit **return the cached value without calling the method**; on a miss call it and store the result.\n" +
        "- `key` is a SpEL expression (`#id`, `#user.id`, `#root.methodName`) — supply one explicitly whenever the method has more than one parameter, because the default `SimpleKeyGenerator` combines all arguments.\n" +
        "- `condition` is evaluated **before** invocation (on the arguments), `unless` **after** (it can see `#result`). `unless = \"#result == null\"` is the usual guard.\n" +
        "- `sync = true` makes concurrent misses for the same key wait for one computation — the built-in answer to cache stampede.\n\n" +
        "@CachePut: **always** invokes the method and then updates the cache. Use it on an update path so the cache stays warm. Never put `@Cacheable` and `@CachePut` on the same method.\n\n" +
        "@CacheEvict: removes entries. `allEntries = true` clears the cache; `beforeInvocation = true` evicts even if the method throws (important for deletes).\n\n" +
        "@Caching: groups several of the above when one method must evict from two caches at once.\n\n" +
        "Traps to raise unprompted:\n\n" +
        "- **Self-invocation bypasses the cache**, exactly like `@Transactional`.\n" +
        "- The default `ConcurrentMapCacheManager` has **no TTL and no size limit** — a memory leak in production. Configure Caffeine or Redis.\n" +
        "- Cached values must be **serialisable** for a distributed cache, and changing a DTO's shape invalidates nothing — version your keys.\n" +
        "- Caching a mutable object hands callers a shared reference.",
      code: `import org.springframework.cache.annotation.*;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.*;
import org.springframework.stereotype.Service;
import java.time.Duration;

@Configuration
@EnableCaching
class CacheConfig {
    @Bean CaffeineCacheManager cacheManager() {
        CaffeineCacheManager m = new CaffeineCacheManager("orders", "customers");
        m.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10_000)                       // bounded - unlike the default
                .expireAfterWrite(Duration.ofMinutes(10))
                .recordStats());
        return m;
    }
}

@Service
class OrderService {

    @Cacheable(cacheNames = "orders", key = "#id",
               unless = "#result == null", sync = true)     // sync -> no stampede
    public OrderDto find(Long id) { return loadFromDb(id); }

    @Cacheable(cacheNames = "orders",
               key = "#tenant + ':' + #status",             // explicit multi-arg key
               condition = "#status != 'DRAFT'")            // evaluated BEFORE the call
    public java.util.List<OrderDto> search(String tenant, String status) { return null; }

    @CachePut(cacheNames = "orders", key = "#order.id")      // always runs, refreshes cache
    public OrderDto update(OrderDto order) { return saveToDb(order); }

    @CacheEvict(cacheNames = "orders", key = "#id", beforeInvocation = true)
    public void delete(Long id) { deleteFromDb(id); }

    @Caching(evict = {
        @CacheEvict(cacheNames = "orders",    allEntries = true),
        @CacheEvict(cacheNames = "customers", key = "#customerId")
    })
    public void reindex(Long customerId) { }

    private OrderDto loadFromDb(Long id) { return null; }
    private OrderDto saveToDb(OrderDto o) { return o; }
    private void deleteFromDb(Long id) { }
}`,
      codeLanguage: "java",
      explanation:
        "Proxy-based cache advice with SpEL keys; name sync=true for stampedes and the unbounded default CacheManager as the production trap.",
      followUps: [
        "How does sync = true prevent a cache stampede?",
        "Why is the default ConcurrentMapCacheManager unsafe in production?",
      ],
    },
    {
      id: "b031",
      question: "What do @EnableJpaRepositories, @Query, @Modifying and @EntityGraph do in Spring Data JPA?",
      answer:
        "@EnableJpaRepositories: imports a registrar that scans for interfaces extending `Repository` and registers a **JDK dynamic proxy** for each one. Boot auto-configures it, so you rarely write it — except when you need two data sources, custom `basePackages`, or a custom `repositoryBaseClass`. **There is no implementation class**: `SimpleJpaRepository` plus the query-derivation machinery is what executes your method.\n\n" +
        "Query derivation: `findByStatusAndCreatedAtAfterOrderByTotalDesc` is parsed into a criteria query. It is elegant up to about three predicates and becomes unreadable beyond that — switch to `@Query`.\n\n" +
        "@Query:\n\n" +
        "- JPQL by default, or `nativeQuery = true` for raw SQL (which loses JPQL portability and Hibernate's automatic pagination support).\n" +
        "- Bind with `?1` positional or `:name` plus `@Param`.\n" +
        "- A **projection interface** or DTO constructor expression avoids loading whole entities — a real performance lever.\n" +
        "- `countQuery` is needed when paginating a complex native query.\n\n" +
        "@Modifying:\n\n" +
        "- Required on any `@Query` that is an `UPDATE` or `DELETE`. It switches execution from `getResultList()` to `executeUpdate()`.\n" +
        "- Needs an active transaction. Critically, a bulk update **bypasses the persistence context**, so entities already loaded are stale. `@Modifying(clearAutomatically = true, flushAutomatically = true)` flushes pending changes first and clears the context after.\n\n" +
        "@EntityGraph: the declarative fix for N+1. `@EntityGraph(attributePaths = {\"lines\",\"customer\"})` makes a single query with joins and fetches those associations eagerly **for that method only** — much better than changing the mapping to EAGER globally. The alternatives are `JOIN FETCH` in JPQL or `@BatchSize`.",
      code: `import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

interface OrderRepository extends JpaRepository<Order, Long> {

    // 1. Derived query - readable for 2-3 predicates.
    List<Order> findByStatusAndCreatedAtAfterOrderByTotalDesc(Status s, Instant since);

    // 2. JPQL with a DTO projection - no entity hydration at all.
    @Query("""
           select new com.acme.OrderSummary(o.reference, o.total, c.name)
           from Order o join o.customer c
           where o.status = :status and o.total > :min
           """)
    List<OrderSummary> summaries(@Param("status") Status status, @Param("min") long min);

    // 3. Single query instead of N+1 - the declarative fetch plan.
    @EntityGraph(attributePaths = { "lines", "customer" })
    Optional<Order> findByReference(String reference);

    // 4. Bulk update - bypasses the persistence context, so clear it.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("update Order o set o.status = :to where o.status = :from and o.createdAt < :cut")
    int bulkExpire(@Param("from") Status from, @Param("to") Status to,
                   @Param("cut") Instant cut);

    // 5. Native query with an explicit count query for pagination.
    @Query(value  = "select * from orders where jsonb_extract_path_text(meta,'src') = :src",
           countQuery = "select count(*) from orders where jsonb_extract_path_text(meta,'src') = :src",
           nativeQuery = true)
    Page<Order> bySource(@Param("src") String src, Pageable pageable);

    // 6. Pessimistic lock for a read-modify-write.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);
}`,
      codeLanguage: "java",
      explanation:
        "Repositories are generated proxies; @Modifying bulk updates bypass the persistence context and @EntityGraph is the per-query N+1 fix.",
      followUps: [
        "Why does a bulk @Modifying update leave stale entities in the context?",
        "When is a projection interface better than a DTO constructor expression?",
      ],
    },
    {
      id: "b032",
      question: "Explain the bean lifecycle and the annotations that hook into it.",
      answer:
        "The full singleton lifecycle, in order:\n\n" +
        "1. **Bean definitions loaded** — component scan, `@Bean` methods, imports, registrars.\n" +
        "2. **`BeanFactoryPostProcessor`s run** — they may modify *definitions* (this is where `PropertySourcesPlaceholderConfigurer` and `ConfigurationClassPostProcessor` work).\n" +
        "3. **Instantiation** — the constructor runs; constructor injection happens here.\n" +
        "4. **Populate properties** — field and setter injection, `@Autowired`, `@Value`.\n" +
        "5. **Aware callbacks** — `BeanNameAware`, `BeanFactoryAware`, `ApplicationContextAware`, `EnvironmentAware`.\n" +
        "6. **`BeanPostProcessor.postProcessBeforeInitialization`** — this is where `@PostConstruct` is invoked, by `CommonAnnotationBeanPostProcessor`.\n" +
        "7. **`InitializingBean.afterPropertiesSet()`**, then the `@Bean(initMethod=...)` method.\n" +
        "8. **`BeanPostProcessor.postProcessAfterInitialization`** — **where AOP proxies are created**. Remember this: inside `@PostConstruct` you hold the raw object, so `@Transactional` and `@Async` on your own methods do nothing there.\n" +
        "9. Bean is ready.\n" +
        "10. On shutdown: `@PreDestroy`, then `DisposableBean.destroy()`, then `@Bean(destroyMethod=...)`.\n\n" +
        "Ordering annotations: `@DependsOn(\"flyway\")` forces creation order when there is no injection edge; `@Lazy` defers creation to first use (and on an injection point creates a lazy proxy, one legitimate way to break a cycle).\n\n" +
        "Events as a better hook: `ApplicationReadyEvent` fires when the context is fully refreshed **and** the web server is listening, so it is the right place for warm-up work. `ContextRefreshedEvent`, `ApplicationStartedEvent` and `ContextClosedEvent` round out the set. `CommandLineRunner` and `ApplicationRunner` run just before `ApplicationReadyEvent`.\n\n" +
        "**The interview trap:** 'why doesn't `@Transactional` work when I call it from `@PostConstruct`?' — because the proxy does not exist yet.",
      code: `import jakarta.annotation.*;
import org.springframework.beans.factory.*;
import org.springframework.context.annotation.*;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@DependsOn("flywayInitializer")                 // force ordering without an injection edge
class CacheWarmer implements InitializingBean, DisposableBean {

    private final OrderRepository repo;
    CacheWarmer(OrderRepository repo) { this.repo = repo; }      // 3. constructor

    @PostConstruct                                               // 6. before-init
    void init() {
        // WARNING: the AOP proxy does NOT exist yet.
        // Calling a @Transactional / @Async method on 'this' here is a no-op.
    }

    @Override public void afterPropertiesSet() { }               // 7.

    @EventListener(ApplicationReadyEvent.class)                  // 9. fully started
    @Transactional(readOnly = true)                              // works: proxy exists now
    public void warmUp() { repo.findAll(); }

    @PreDestroy void flush() { }                                 // 10.
    @Override public void destroy() { }
}

@Configuration
class Infra {
    @Bean(initMethod = "start", destroyMethod = "stop")          // third-party lifecycle
    @Lazy                                                        // created on first use
    MessageBroker broker() { return new MessageBroker(); }
}`,
      codeLanguage: "java",
      explanation:
        "AOP proxies are applied in postProcessAfterInitialization — after @PostConstruct — which is why transactional self-calls there silently do nothing.",
      followUps: [
        "Where would you put database warm-up code and why?",
        "What is the difference between ContextRefreshedEvent and ApplicationReadyEvent?",
      ],
    },
    {
      id: "b033",
      question: "What is the difference between @ControllerAdvice, @RestControllerAdvice and @ExceptionHandler?",
      answer:
        "@ExceptionHandler:\n\n" +
        "- A **method-level** annotation mapping one or more exception types to a handler method.\n" +
        "- Inside a controller it only handles exceptions from **that** controller. Inside an advice class it applies globally.\n" +
        "- The method can take the exception, `WebRequest`, `HttpServletRequest`, `HandlerMethod` etc. as parameters and return a body, a `ResponseEntity`, a `ProblemDetail`, or a view name.\n" +
        "- Resolution prefers the **most specific** exception type; a handler for a cause is also considered.\n\n" +
        "@ControllerAdvice:\n\n" +
        "- A component-scanned class that can contribute three things across many controllers: `@ExceptionHandler` methods, `@InitBinder` methods (customise data binding, e.g. register a date format or restrict bindable fields), and `@ModelAttribute` methods (add common model data).\n" +
        "- Can be **scoped**: `@ControllerAdvice(basePackages = \"com.acme.api\")`, `assignableTypes = AdminController.class`, or `annotations = RestController.class`.\n" +
        "- Order several advices with `@Order`.\n\n" +
        "@RestControllerAdvice: `@ControllerAdvice` + `@ResponseBody`, so return values are serialised instead of treated as view names. This is what you want for a JSON API.\n\n" +
        "In Boot 3 the idiomatic pattern is to extend `ResponseEntityExceptionHandler` (which already handles Spring's own MVC exceptions) and return **`ProblemDetail`** (RFC 7807) with `type`, `title`, `status`, `detail`, `instance` plus your own properties. Boot will also produce `ProblemDetail` automatically if you set `spring.mvc.problemdetails.enabled=true`.\n\n" +
        "**Practical advice worth stating:** never leak stack traces or internal messages; log the exception with a correlation id and return that id to the client.",
      code: `import jakarta.validation.ConstraintViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import java.net.URI;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice(basePackages = "com.acme.api")
@org.springframework.core.annotation.Order(0)
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,
                                                            ex.getMessage());
        pd.setType(URI.create("https://api.acme.io/errors/order-not-found"));
        pd.setTitle("Order not found");
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail handleConstraint(ConstraintViolationException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("violations", ex.getConstraintViolations().stream()
                .map(v -> Map.of("field", v.getPropertyPath().toString(),
                                 "message", v.getMessage()))
                .toList());
        return pd;
    }

    // Override Spring's own handler to reshape @Valid @RequestBody failures.
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(fe -> fields.put(fe.getField(), fe.getDefaultMessage()));
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Invalid request body");
        pd.setProperty("fields", fields);
        return ResponseEntity.badRequest().body(pd);
    }

    @ExceptionHandler(Exception.class)                    // last resort - never leak details
    ProblemDetail handleAny(Exception ex) {
        String id = UUID.randomUUID().toString();
        logger.error("unhandled [" + id + "]", ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setDetail("Unexpected error. Reference: " + id);
        return pd;
    }
}`,
      codeLanguage: "java",
      explanation:
        "@ExceptionHandler is the method; @ControllerAdvice makes it global; @RestControllerAdvice serialises the result — Boot 3's idiom is ProblemDetail.",
      followUps: [
        "How do you scope an advice to only one group of controllers?",
        "What else can a @ControllerAdvice class contribute besides exception handlers?",
      ],
    },
    {
      id: "b034",
      question: "How do @EventListener, @TransactionalEventListener and ApplicationEventPublisher work?",
      answer:
        "Spring's event bus decouples publisher from subscriber inside a single application context.\n\n" +
        "Publishing: inject `ApplicationEventPublisher` and call `publishEvent(Object)`. Since Spring 4.2 the event does **not** have to extend `ApplicationEvent` — any POJO (ideally a `record`) works.\n\n" +
        "@EventListener:\n\n" +
        "- Annotate any method of any bean; the parameter type is the event type it listens for.\n" +
        "- **Synchronous by default and runs in the caller's thread and transaction.** A listener that throws will propagate the exception to the publisher and can roll back the caller's transaction.\n" +
        "- `condition = \"#event.amount > 1000\"` filters with SpEL.\n" +
        "- `@Order` sequences multiple listeners.\n" +
        "- Returning a non-null value **publishes that value as another event** — a neat chaining trick.\n" +
        "- Add `@Async` (with `@EnableAsync`) to run it on an executor; then exceptions no longer affect the publisher, and you lose the transaction.\n\n" +
        "@TransactionalEventListener — the important one:\n\n" +
        "- Binds the listener to a **transaction phase**: `AFTER_COMMIT` (default), `AFTER_ROLLBACK`, `AFTER_COMPLETION`, `BEFORE_COMMIT`.\n" +
        "- Solves the classic dual-write bug: publish `OrderPlaced`, a listener sends an email, then the transaction rolls back and the customer has an email for an order that does not exist. `AFTER_COMMIT` guarantees the email only goes out if the data was really committed.\n" +
        "- `fallbackExecution = true` runs the listener even with no transaction present (useful in tests).\n" +
        "- **Caveat**: in an `AFTER_COMMIT` listener the original transaction is finished, so any DB write needs `@Transactional(propagation = REQUIRES_NEW)`.\n\n" +
        "**Scope reminder:** this is an in-process bus, not a message broker. For cross-service events use Kafka/Rabbit, typically with the transactional outbox pattern.",
      code: `import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.event.*;
import java.time.Instant;

record OrderPlaced(String reference, long amount, Instant at) {}   // plain POJO event

@Service
class OrderService {
    private final ApplicationEventPublisher events;
    private final OrderRepository repo;
    OrderService(ApplicationEventPublisher e, OrderRepository r) { events = e; repo = r; }

    @Transactional
    public void place(Order order) {
        repo.save(order);
        // Published inside the transaction; delivery timing is decided by the listener.
        events.publishEvent(new OrderPlaced(order.getRef(), order.getTotal(), Instant.now()));
    }
}

@Component
class OrderListeners {

    @EventListener(condition = "#event.amount() > 1000")     // synchronous, same tx
    @Order(10)
    void flagHighValue(OrderPlaced event) { }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async                                                   // off the request thread
    void sendConfirmation(OrderPlaced event) {
        // Only runs if the transaction actually committed - no phantom emails.
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)   // the old tx is gone
    void writeOutbox(OrderPlaced event) { }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    void recordFailure(OrderPlaced event) { }
}`,
      codeLanguage: "java",
      explanation:
        "@EventListener is synchronous and inside the caller's transaction; @TransactionalEventListener(AFTER_COMMIT) is the fix for side effects on rolled-back work.",
      followUps: [
        "Why does an AFTER_COMMIT listener need REQUIRES_NEW to write to the database?",
        "How does this compare with a transactional outbox to Kafka?",
      ],
    },
    {
      id: "b035",
      question: "What do @Retryable, @CircuitBreaker and the resilience annotations give you?",
      answer:
        "Resilience patterns are proxy-based too, so the same self-invocation rule applies.\n\n" +
        "Spring Retry (`@EnableRetry`):\n\n" +
        "- **`@Retryable`** — retry on listed exceptions. Configure `maxAttempts`, `retryFor`/`noRetryFor`, and `backoff = @Backoff(delay, multiplier, maxDelay, random = true)`. **Always add jitter (`random = true`)**, otherwise every client retries in lockstep and you create a thundering herd.\n" +
        "- **`@Recover`** — the fallback invoked when attempts are exhausted. Its signature must be the exception type followed by the original method's parameters, returning the same type; a mismatch fails at runtime, not compile time.\n" +
        "- Retry only on **transient** failures: timeouts, 503s, deadlocks. Retrying a 400 or a validation error is pointless load, and retrying a non-idempotent POST double-charges customers.\n\n" +
        "Resilience4j (the modern default; Hystrix is dead):\n\n" +
        "- **`@CircuitBreaker(name, fallbackMethod)`** — a state machine CLOSED → OPEN → HALF_OPEN based on a sliding window of failures. Once OPEN it fails fast, protecting both you and the struggling dependency.\n" +
        "- **`@RateLimiter`**, **`@Bulkhead`** (bound concurrent calls so one slow dependency cannot exhaust your threads), **`@TimeLimiter`** (needs a `CompletableFuture` return), **`@Retry`**.\n" +
        "- Default aspect order when stacked: `Retry( CircuitBreaker( RateLimiter( TimeLimiter( Bulkhead( call )))))` — configurable, and worth knowing.\n\n" +
        "**The senior framing:** retries alone make an outage worse by amplifying load. Retry + jitter + circuit breaker + bulkhead + timeout is the complete set, and every one of them needs a metric so you can see it working.",
      code: `import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.retry.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;

@Service
class PricingClient {

    private final RestClient http;
    PricingClient(RestClient http) { this.http = http; }

    @Retryable(
        retryFor   = { ResourceAccessException.class, HttpServerErrorException.class },
        noRetryFor = { HttpClientErrorException.BadRequest.class },   // never retry a 400
        maxAttempts = 4,
        backoff = @Backoff(delay = 200, multiplier = 2.0, maxDelay = 4000, random = true))
    public Price fetch(String sku) {
        return http.get().uri("/prices/{sku}", sku).retrieve().body(Price.class);
    }

    @Recover                                     // signature: (exception, original args...)
    public Price fallbackPrice(ResourceAccessException ex, String sku) {
        return Price.cachedOrDefault(sku);
    }

    @CircuitBreaker(name = "pricing", fallbackMethod = "circuitFallback")
    @Bulkhead(name = "pricing")                  // cap concurrent calls
    @RateLimiter(name = "pricing")
    public Price fetchProtected(String sku) {
        return http.get().uri("/prices/{sku}", sku).retrieve().body(Price.class);
    }

    private Price circuitFallback(String sku, Throwable t) { return Price.cachedOrDefault(sku); }
}

// application.yml
// resilience4j.circuitbreaker.instances.pricing:
//   sliding-window-type: COUNT_BASED
//   sliding-window-size: 50
//   failure-rate-threshold: 50
//   wait-duration-in-open-state: 20s
//   permitted-number-of-calls-in-half-open-state: 5
// resilience4j.bulkhead.instances.pricing.max-concurrent-calls: 20`,
      codeLanguage: "java",
      explanation:
        "Retries without jitter and a breaker amplify outages; the complete answer is timeout + jittered retry + circuit breaker + bulkhead, each with metrics.",
      followUps: [
        "Why must a retried operation be idempotent?",
        "What is the default order when @Retry and @CircuitBreaker are stacked?",
      ],
    },
    {
      id: "b036",
      question: "Which Jackson annotations do you actually need on a Spring Boot API?",
      answer:
        "Jackson is what turns your objects into the JSON your API contract promises, so these are contract-level decisions.\n\n" +
        "Naming and shape:\n\n" +
        "- **`@JsonProperty(\"order_ref\")`** — rename a field, or mark it required. Also needed on constructor parameters for immutable types unless you compile with `-parameters` (Spring Boot sets this by default).\n" +
        "- **`@JsonNaming(SnakeCaseStrategy.class)`** or the global `spring.jackson.property-naming-strategy=SNAKE_CASE`.\n" +
        "- **`@JsonIgnore`** on a field, **`@JsonIgnoreProperties(ignoreUnknown = true)`** on a type. The latter is essential for forward compatibility when consuming someone else's API; Boot sets `FAIL_ON_UNKNOWN_PROPERTIES=false` globally by default.\n" +
        "- **`@JsonInclude(Include.NON_NULL)`** — omit nulls; a very common API style choice.\n\n" +
        "Construction and values:\n\n" +
        "- **`@JsonCreator`** + `@JsonProperty` for immutable classes; a `record` needs neither when parameter names are retained.\n" +
        "- **`@JsonFormat(shape = STRING, pattern = \"yyyy-MM-dd\")`** for dates; add `jackson-datatype-jsr310` (Boot does) and disable `WRITE_DATES_AS_TIMESTAMPS`.\n" +
        "- **`@JsonSerialize`/`@JsonDeserialize(using = ...)`** for custom types such as money.\n" +
        "- **`@JsonValue`/`@JsonEnumDefaultValue`** for enums — `@JsonValue` on a `code()` method serialises an enum as its business code instead of its name.\n\n" +
        "Structure:\n\n" +
        "- **`@JsonUnwrapped`**, **`@JsonAnyGetter`/`@JsonAnySetter`** for dynamic keys, **`@JsonTypeInfo`/`@JsonSubTypes`** for polymorphic payloads, **`@JsonView`** for one entity with several field projections, **`@JsonManagedReference`/`@JsonBackReference`** to break bidirectional cycles.\n\n" +
        "**The advice to give:** do not annotate JPA entities for JSON. Serialising entities leaks your schema, triggers lazy-loading exceptions and couples the API to the database. Map to DTOs and annotate those.",
      code: `import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)                 // forward compatible
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record OrderDto(
        @JsonProperty("order_ref") String reference,
        BigDecimal total,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        OffsetDateTime createdAt,
        Status status,
        @JsonIgnore String internalNote,                    // never serialised
        List<LineDto> lines,
        @JsonAnyGetter Map<String, Object> extras) {}

enum Status {
    NEW("N"), PAID("P"), SHIPPED("S");
    private final String code;
    Status(String code) { this.code = code; }
    @JsonValue public String code() { return code; }        // serialises as "N"/"P"/"S"
}

// Polymorphic payloads.
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = CardPayment.class,   name = "card"),
    @JsonSubTypes.Type(value = WalletPayment.class, name = "wallet")
})
sealed interface Payment permits CardPayment, WalletPayment {}
record CardPayment(String last4, int expiryYear) implements Payment {}
record WalletPayment(String walletId) implements Payment {}

// Immutable non-record class still needs an explicit creator.
final class Money {
    private final BigDecimal amount; private final String currency;
    @JsonCreator Money(@JsonProperty("amount") BigDecimal a,
                       @JsonProperty("currency") String c) { amount = a; currency = c; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
}`,
      codeLanguage: "java",
      explanation:
        "Jackson annotations define your public API contract — the senior point is mapping to DTOs rather than serialising JPA entities.",
      followUps: [
        "What goes wrong when you serialise a JPA entity with a lazy association?",
        "How do you serialise a sealed interface hierarchy?",
      ],
    },
  ],
  meta: {
    b017: { difficulty: "easy", priority: "very-high", tags: ["spring-boot", "autoconfiguration", "component-scan"], readMinutes: 4 },
    b018: { difficulty: "easy", priority: "very-high", tags: ["bean", "component", "configuration"], readMinutes: 4 },
    b019: { difficulty: "easy", priority: "very-high", tags: ["stereotypes", "repository", "restcontroller"], readMinutes: 3 },
    b020: { difficulty: "easy", priority: "very-high", tags: ["di", "autowired", "constructor-injection"], readMinutes: 4 },
    b021: { difficulty: "medium", priority: "high", tags: ["qualifier", "primary", "ambiguity"], readMinutes: 4 },
    b022: { difficulty: "hard", priority: "very-high", tags: ["transactional", "propagation", "proxy"], readMinutes: 6 },
    b023: { difficulty: "medium", priority: "high", tags: ["scopes", "prototype", "scoped-proxy"], readMinutes: 4 },
    b024: { difficulty: "hard", priority: "medium", tags: ["configuration", "import", "registrar"], readMinutes: 5 },
    b025: { difficulty: "hard", priority: "very-high", tags: ["conditional", "autoconfiguration", "starters"], readMinutes: 5 },
    b026: { difficulty: "easy", priority: "very-high", tags: ["value", "configurationproperties", "binding"], readMinutes: 4 },
    b027: { difficulty: "easy", priority: "high", tags: ["profiles", "environment", "config"], readMinutes: 4 },
    b028: { difficulty: "easy", priority: "very-high", tags: ["mvc", "requestmapping", "rest"], readMinutes: 5 },
    b029: { difficulty: "medium", priority: "high", tags: ["async", "scheduled", "executor"], readMinutes: 5 },
    b030: { difficulty: "medium", priority: "high", tags: ["caching", "cacheable", "spel"], readMinutes: 5 },
    b031: { difficulty: "medium", priority: "very-high", tags: ["spring-data", "jpa", "n+1"], readMinutes: 5 },
    b032: { difficulty: "hard", priority: "high", tags: ["lifecycle", "postconstruct", "beanpostprocessor"], readMinutes: 5 },
    b033: { difficulty: "medium", priority: "high", tags: ["exception-handling", "controlleradvice", "problemdetail"], readMinutes: 4 },
    b034: { difficulty: "medium", priority: "medium", tags: ["events", "transactional-events", "decoupling"], readMinutes: 5 },
    b035: { difficulty: "medium", priority: "medium", tags: ["resilience", "retry", "circuit-breaker"], readMinutes: 5 },
    b036: { difficulty: "easy", priority: "medium", tags: ["jackson", "json", "dto"], readMinutes: 4 },
  },
});
