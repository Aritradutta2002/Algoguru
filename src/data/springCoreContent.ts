import { ContentSection } from "./recursionContent";
import { attachDiagrams } from "./diagramAttach";
import { springCoreVisualizations } from "./springCoreVisualizations";

/* -------------------------------------------------------------------------- */
/*  Spring Core Fundamentals — full theory                                    */
/*                                                                            */
/*  IoC, DI, bean lifecycle, scopes, autowiring, configuration, profiles,     */
/*  @Value, ApplicationContext vs BeanFactory, post-processors and SpEL.      */
/*  Written against Spring Framework 6.x / Spring Boot 3.x / Java 17.         */
/* -------------------------------------------------------------------------- */

const springCoreRaw: ContentSection[] = [
  /* ------------------------------------------------------------------------ */
  {
    id: "spring-intro",
    title: "Introduction to Spring Framework",
    difficulty: "Easy",
    theory: [
      "**Spring Framework** is the de-facto standard for enterprise Java: a lightweight, modular container that manages object creation, wiring and lifecycle so developers write plain business objects instead of infrastructure plumbing.",
      "It exists because EJB 2 forced business logic into heavy, non-testable components (remote interfaces, deployment descriptors, mandatory base classes). Spring's counter-proposal was *POJO-based development with declarative enterprise services*.",
      "Every Spring application rests on one object — the IoC container (`ApplicationContext`) — which reads configuration metadata and produces fully configured **beans**.",
      "The framework is split into independent modules you add selectively: `spring-core`, `spring-beans`, `spring-context` and `spring-expression` form the core container; above them sit `spring-jdbc`, `spring-tx`, `spring-orm`, `spring-web`, `spring-webmvc`, `spring-webflux`, `spring-aop`, `spring-aspects` and `spring-test`.",
      "**Non-intrusiveness** is the core design rule: application classes never implement a Spring interface or extend a Spring base class; annotations are optional and the same object can be wired by XML, Java config or programmatically.",
      "The second pillar is **AOP** — cross-cutting behaviour such as transactions, security, caching and retry is applied by generating proxies around your beans, which is why `@Transactional` needs no commit/rollback code in your method.",
      "Spring does not replace the JVM or the servlet container: a Spring application is an ordinary Java program that either runs **embedded** (Spring Boot starting Tomcat/Jetty/Netty in-process) or is deployed as a WAR to an existing server.",
      "Spring Framework **6.x** is the current line: it requires **Java 17+**, moved to the **Jakarta EE 9/10** namespace (`javax.servlet` → `jakarta.servlet`, `javax.annotation` → `jakarta.annotation`), and ships null-safety annotations, `@NullMarked` support and AOT/CDS-friendly startup.",
      "**Spring Boot 3.x** is the opinionated packaging of Framework 6.x — auto-configuration, starters, embedded server, actuator metrics, executable jar — but the container, bean definition model, DI rules and lifecycle callbacks underneath are pure Spring Core.",
      "Versus the alternatives: Quarkus and Micronaut push wiring to build/compile time with annotation processors, so they start faster and use less heap; Spring resolves most metadata at runtime with reflection and proxies and wins on ecosystem breadth, tooling and hiring pool. Jakarta CDI is a specification, Spring is an implementation plus a very large ecosystem that predates and exceeds CDI's feature set.",
      "Interview angle: answer 'What is Spring?' on three levels — (1) an IoC/DI container that owns object lifecycle, (2) declarative enterprise services through proxy-based AOP, (3) an ecosystem (Boot, Data, Security, Cloud, Integration, AI) built on that container. Saying only 'a web framework' under-sells it."
    ],
    keyPoints: [
      "Spring = IoC container + declarative enterprise services (AOP) + ecosystem; not a web server and not an app-server replacement.",
      "Non-intrusive: beans are POJOs/records, no Spring interfaces required; configuration can be Java, annotations, XML or programmatic.",
      "Core modules: `spring-core`, `spring-beans`, `spring-context`, `spring-expression`; add web/data/tx modules as needed.",
      "Framework 6.x baseline is **Java 17** and the **jakarta** namespace; Boot 3.x runs on Framework 6.x.",
      "`@Transactional`/`@Cacheable`/security work by proxying the bean — self-invocation bypasses the proxy.",
      "Spring Boot only removes boilerplate: starters, auto-configuration, embedded server, externalised config.",
      "A Spring app is either an executable jar with an embedded server or a WAR deployed to a container."
    ],
    code: [
      {
        title: "A minimal standalone Spring Core application",
        language: "java",
        content: `import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Pure Java 17 record - no Spring type is implemented
record PriceCalculator(double taxRate) {
    double gross(double net) { return net * (1 + taxRate); }
}

@Configuration
class AppConfig {
    @Bean
    PriceCalculator priceCalculator() {
        return new PriceCalculator(0.18);
    }
}

public class SpringIntro {
    public static void main(String[] args) {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(AppConfig.class);
        PriceCalculator calc = ctx.getBean(PriceCalculator.class);
        System.out.println("Gross: " + calc.gross(1000)); // Gross: 1180.0
        ((AnnotationConfigApplicationContext) ctx).close();
    }
}`
      },
      {
        title: "The same container under Spring Boot 3.x — you only write the business bean",
        language: "java",
        content: `import jakarta.annotation.Nullable;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final OrderRepository repository;

    // constructor injection - the container supplies the collaborator
    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    @Transactional   // proxy opens/commits the tx, the method body stays clean
    public void confirm(long id, @Nullable String note) {
        repository.findById(id).ifPresent(order -> order.markConfirmed(note));
    }
}

@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}`
      }
    ],
    note: "You can use Spring Core with zero annotations and zero Boot — an `AnnotationConfigApplicationContext` or even plain XML gives you the full container inside a `main` method or a fat client.",
    tip: "Add only the modules you need. `spring-context` pulls `spring-beans` and `spring-core` transitively; in Boot, the starter (`spring-boot-starter-data-jpa`, `spring-boot-starter-web`) is the dependency you declare.",
    warning: "`javax.*` imports do not compile against Spring 6 / Boot 3 — everything moved to `jakarta.*`. A project still importing `javax.annotation.PostConstruct` or `javax.servlet.*` is on Spring 5 and cannot be upgraded by changing the dependency alone."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-ioc",
    title: "Inversion of Control (IoC) Container",
    difficulty: "Medium",
    theory: [
      "IoC is the principle that **a class does not create or locate its own dependencies** — an external authority decides which objects exist and how they connect. The classic phrasing is the Hollywood Principle: *don't call us, we'll call you*.",
      "Control is inverted in four places: **instantiation** (who calls `new`), **composition** (who wires collaborators), **configuration** (who supplies values) and **lifecycle** (who creates, initialises and destroys the object).",
      "**Dependency Injection is Spring's implementation of IoC.** Other flavours exist — Service Locator/JNDI lookup, abstract factory, object mother — but they invert only instantiation, whereas DI keeps the dependency visible in the constructor or setter signature, so the class stays compile-checkable and testable without a container.",
      "The container is **metadata-driven**: configuration (Java `@Bean` methods, stereotype annotations, XML, a Groovy DSL or programmatic registration) is parsed into `BeanDefinition` objects that record the target class, constructor arguments, property values, scope, lazy flag, init/destroy methods, `@Primary`, and dependency edges.",
      "All definitions are built **before any bean is created** (the bean-definition phase), which is why `@Profile`, `@Conditional`, scope and `proxyBeanMethods` decisions can be taken cheaply and why `BeanFactoryPostProcessor`s can still rewrite them.",
      "The runtime engine is `DefaultListableBeanFactory`: it owns the `BeanDefinition` registry, the `singletonObjects` cache (plus the two early-reference caches), the registered `BeanPostProcessor` chain and the by-type dependency resolver `doResolveDependency`.",
      "`ApplicationContext` **is a** `BeanFactory` plus enterprise services: `MessageSource` for i18n, `ResourceLoader`/`ResourcePatternResolver`, `ApplicationEventPublisher`, `Environment`, `Aware`-callback processing and eager pre-instantiation of singletons inside `refresh()`.",
      "Resolution flow for `getBean(OrderService.class)`: find the definition → merge parent definitions → look in the singleton caches (an early reference may be exposed there to break a cycle) → `createBean` → deduce a constructor → instantiate → populate injected members → `Aware` callbacks → post-process before init → init callbacks → post-process after init (AOP proxies appear here) → publish to the cache and return.",
      "In plain Spring you create the container yourself (`new AnnotationConfigApplicationContext(AppConfig.class)`); in **Spring Boot 3.x** `SpringApplication.run` picks an `AnnotationConfigServletWebServerApplicationContext` for servlet apps or `AnnotationConfigReactiveWebServerApplicationContext` for WebFlux, registers a JVM shutdown hook and calls `refresh()`.",
      "Because the container owns creation, **singletons are shared across all threads**. The 'is my bean thread-safe?' question is answered by your mutable state, not by Spring. With Boot 3.2's `spring.threads.virtual.enabled=true`, request handling moves onto many short-lived **virtual threads**, so `ThreadLocal` fields in singleton beans become a leak/unsafe pattern rather than a convenient trick.",
      "Keep `getBean` out of business code: calling the container from a service is Service Locator style, it hides requirements, defeats straightforward unit testing and can throw late. Inject, and restrict container access to framework glue (`ApplicationContextAware`, `ObjectProvider`, `@Bean` factories).",
      "Interview angle: 'What exactly does the container do for you?' — metadata (`BeanDefinition`), instantiation, wiring, configuration, lifecycle callbacks, proxy creation, caching, and orderly shutdown; then be ready to separate IoC (the principle) from DI (the mechanism)."
    ],
    keyPoints: [
      "IoC = the object stops creating/locating its dependencies; DI is Spring's implementation of it.",
      "Container works in two phases: **register `BeanDefinition`s**, then instantiate/wire beans from that metadata.",
      "`BeanDefinition` is the blueprint: class, scope, lazy, constructor args, property values, init/destroy methods.",
      "`DefaultListableBeanFactory` is the engine; `ApplicationContext` = engine + events, i18n, resources, environment, eager singleton creation.",
      "`refresh()` pre-instantiates singletons; a bare `BeanFactory` does not.",
      "Singleton beans are shared → keep them stateless; `ThreadLocal` in a singletons is risky with Boot 3.2 virtual threads.",
      "`getBean` inside business code is Service Locator style — inject instead."
    ],
    diagram: {
      type: "layers",
      title: "Inside the IoC container — from metadata to live beans",
      data: [
        {
          label: "Configuration metadata",
          color: "primary",
          children: [
            { label: "@Configuration / @Bean, @Component, XML, functional registration" },
            { label: "Environment + active profiles" }
          ]
        },
        {
          label: "BeanDefinition registry (no objects yet)",
          color: "info",
          children: [
            { label: "target class, constructor args, property values" },
            { label: "scope, lazy, @Primary, init/destroy methods, depends-on" }
          ]
        },
        {
          label: "BeanFactory engine — DefaultListableBeanFactory",
          color: "accent",
          children: [
            { label: "instantiate → populate → initialise → proxy" },
            { label: "singleton caches + BeanPostProcessor chain" }
          ]
        },
        {
          label: "ApplicationContext (engine + enterprise services)",
          color: "success",
          children: [
            { label: "events, MessageSource, ResourceLoader, Environment" },
            { label: "pre-instantiates singletons during refresh()" }
          ]
        }
      ]
    },
    code: [
      {
        title: "XML configuration — the metadata the container really stores",
        language: "xml",
        content: `<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
           https://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="priceCalculator" class="com.example.PriceCalculator">
        <constructor-arg name="taxRate" value="0.18"/>
    </bean>

    <!-- same information a @Bean + @Autowired setup produces -->
    <bean id="orderService" class="com.example.OrderService"
          scope="singleton" lazy-init="false"
          init-method="warmUp" destroy-method="shutdown">
        <property name="calculator" ref="priceCalculator"/>
    </bean>
</beans>`
      },
      {
        title: "Inspecting the container's metadata at runtime",
        language: "java",
        content: `import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class ContainerIntrospection {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext ctx =
                new AnnotationConfigApplicationContext(AppConfig.class);

        for (String name : ctx.getBeanDefinitionNames()) {
            BeanDefinition bd = ctx.getBeanDefinition(name);
            System.out.println(name
                    + " -> class=" + bd.getBeanClassName()
                    + ", scope=" + bd.getScope()
                    + ", lazy=" + bd.isLazyInit()
                    + ", primary=" + bd.isPrimary());
        }

        Object first = ctx.getBean(ReportService.class);
        Object second = ctx.getBean(ReportService.class);
        System.out.println("singleton shared: " + (first == second)); // true
        ctx.close();
    }
}`
      }
    ],
    note: "The container never needs your source to change: the same `BeanDefinition` can arrive from annotations, XML, Groovy, `ctx.registerBean(...)` or a `BeanDefinitionRegistryPostProcessor` — annotations are simply a convenient, type-safe metadata format.",
    tip: "Log `ctx.getBeanDefinitionCount()` and run with `spring.main.lazy-initialization=true` when startup feels slow — it tells you how many beans the container actually pre-instantiates.",
    warning: "Letting the container create everything does not make singletons safe: a mutable field in a singleton bean is shared by every thread, and prototype beans are **not** destroyed by the container — you must clean them up yourself."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-di",
    title: "Dependency Injection — Constructor, Setter, Field",
    difficulty: "Medium",
    theory: [
      "Spring supports three injection forms: **constructor injection** (dependencies arrive as constructor parameters), **setter injection** (`setX(...)` methods) and **field injection** (`@Autowired` directly on a field). All three are performed by `AutowiredAnnotationBeanPostProcessor` plus the factory's by-type resolver.",
      "Constructor injection makes dependencies **mandatory and immutable** (`private final`), guarantees the object is never in a half-built state, surfaces circular dependencies immediately at startup, and lets you unit-test with `new OrderService(fakeRepo)` — no container, no reflection. It is the recommended default for Spring Framework 6.x and Boot 3.x.",
      "For a bean with **exactly one constructor** since Spring 4.3 the `@Autowired` annotation is optional; with several constructors you must mark one `@Autowired`, or the container falls back to the no-arg constructor and fails if there is none.",
      "Setter injection is the right tool for **optional or re-configurable** collaborators and for breaking a genuine circular dependency: the container can instantiate both objects first and wire them afterwards (`@Autowired(required = false)` or a `java.util.Optional<T>` parameter makes the dependency optional).",
      "Field injection is the shortest to type and the most harmful: it needs reflection, cannot use `final`, hides the dependency graph, allows a bean to be constructed in tests with nulls, and makes 'too many dependencies' invisible because the constructor never grows. Use it in tests (`@InjectMocks`/`@Autowired` in Spring tests) or throwaway code, not in production services.",
      "Resolution is by **type**, then refined: multiple candidates are narrowed by `@Qualifier`, by `@Primary`, by the injection point's field/parameter name, or by generics (`PaymentGateway<Cardless>`). Injecting `List<T>`, `Set<T>` or `Map<String, T>` gives all matching beans, keyed by bean name in the map case.",
      "Constructor cycles fail with `BeanCurrentlyInCreationException` because the container cannot expose a half-built object; only setter/field cycles are solvable by the three-level singleton cache. Spring Boot 2.6+ **disables circular references by default**, so `spring.main.allow-circular-references=true` is a smell flag, not a fix — restructure, or use `@Lazy`/`ObjectProvider` at the edge that genuinely needs deferral.",
      "`ObjectProvider<T>` (and `ObjectProvider.stream()`, `getIfAvailable`, `getIfUnique`) is the modern answer to optional, lazy or per-call dependencies: it defers resolution so a prototype, a request-scoped bean, or an optional collaborator is looked up only when used.",
      "Java **records** are ideal injection targets on Java 17: the canonical constructor is a single constructor, so the container resolves parameters by name/type; Spring Framework 6.1 adds null-safety annotations (`@NonNullApi`, `@Nullable`) that the container respects for optional dependencies.",
      "A **prototype injected into a singleton** is resolved once and then frozen — the singleton keeps the same instance forever. Fix it with `ObjectProvider<T>`/`ObjectFactory<T>`, method injection via `@Lookup`, or a scoped proxy on the injected bean.",
      "Dependencies of objects created outside the container (`new SomeHandler()`) are never injected; use `beanFactory.autowireBean(instance)` / `AutowireCapableBeanFactory` (or `@Configurable` with AspectJ weaving) when you really must inject into manually created objects.",
      "Comparison of the alternatives: manual `new` is simple but couples you to implementations and kills testability; a Service Locator gives laziness at the price of hidden dependencies; CDI `@Inject` is the standards-based equivalent of Spring injection but with `@Named` qualifiers and no `required` flag.",
      "Interview angle: 'Why constructor injection?' — immutability, mandatory dependencies, fail-fast cycles, plain `new` in tests; then 'how do you break a cycle?' — extract the shared behaviour into a third bean, use `@Lazy`, `ObjectProvider`, or setter injection for the optional side."
    ],
    keyPoints: [
      "Three forms: **constructor** (default choice), **setter** (optional/re-wireable), **field** (discouraged in production).",
      "Single constructor → `@Autowired` is optional since Spring 4.3; records work out of the box.",
      "Constructor cycles fail at startup; setter/field cycles are resolved through the early-singleton cache.",
      "Boot 2.6+ rejects circular references unless `spring.main.allow-circular-references=true`.",
      "Ambiguity order: type match → `@Primary` → `@Qualifier` → parameter-name match → `NoUniqueBeanDefinitionException`.",
      "`List<T>` / `Map<String, T>` inject all candidates; `ObjectProvider<T>` gives optional, lazy or per-call lookup.",
      "Prototype-in-singleton is injected once — use `ObjectProvider`, `@Lookup` or a scoped proxy."
    ],
    table: {
      headers: ["Aspect", "Constructor injection", "Setter injection", "Field injection"],
      rows: [
        ["Immutability", "Yes — fields can be final", "No — state can change", "No"],
        ["Mandatory dependency", "Enforced by the signature", "Needs code or @NotNull", "Only fails on first use"],
        ["Partial bean", "Impossible", "Possible", "Possible (half-built)"],
        ["Plain unit test with new", "Yes", "Yes", "No — needs container/reflection"],
        ["Circular dependency", "Fails fast at startup", "Solvable by the container", "Solvable by the container"],
        ["Design feedback", "Long ctor = too many duties", "Silent", "Silent"],
        ["Spring verdict", "Recommended", "For optional collaborators", "Deprecated in practice (still supported)"]
      ]
    },
    code: [
      {
        title: "All three forms side by side",
        language: "java",
        content: `import jakarta.annotation.Nullable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    private final CustomerRepository customers;   // mandatory
    private final TaxProvider taxProvider;        // mandatory
    private AuditSink auditSink = AuditSink.NOOP; // optional, re-configurable

    // 1) constructor injection - @Autowired not needed (single constructor)
    public InvoiceService(CustomerRepository customers,
                          TaxProvider taxProvider,
                          ObjectProvider<AuditSink> auditSink) {
        this.customers = customers;
        this.taxProvider = taxProvider;
        this.auditSink = auditSink.getIfAvailable(() -> AuditSink.NOOP);
    }

    // 2) setter injection for the optional collaborator
    public void setAuditSink(@Nullable AuditSink auditSink) {
        this.auditSink = auditSink == null ? AuditSink.NOOP : auditSink;
    }

    // 3) field injection - concise, but avoid in production classes
    //    @Autowired private CurrencyResolver resolver;
}`
      },
      {
        title: "Record + qualifier + collection injection (Java 17 idiom)",
        language: "java",
        content: `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

public record OrderSummary(long id, String status) {}

@Component
public class SummaryAssembler {

    private final List<OrderEnricher> enrichers;          // all implementations
    private final Map<String, PricingStrategy> pricing;   // bean name -> bean

    public SummaryAssembler(List<OrderEnricher> enrichers,
                            Map<String, PricingStrategy> pricing,
                            @Qualifier("euPricing") PricingStrategy eu) {
        this.enrichers = enrichers;
        this.pricing = pricing;
    }

    public OrderSummary summarise(Order order) {
        OrderSummary base = new OrderSummary(order.id(), order.status().name());
        return enrichers.stream().reduce(base, (s, e) -> e.enrich(s), (a, b) -> a);
    }
}`
      },
      {
        title: "Prototype inside a singleton — the trap and the fix",
        language: "java",
        content: `import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
@Scope("prototype")            // new instance per lookup
class ReportJob {
    void execute() { System.out.println("job " + hashCode()); }
}

@Service
class Scheduler {
    private final ObjectProvider<ReportJob> jobs;   // resolved per call

    Scheduler(ObjectProvider<ReportJob> jobs) { this.jobs = jobs; }

    void runBatch(int n) {
        for (int i = 0; i < n; i++) {
            jobs.getObject().execute();   // fresh prototype every time
        }
    }
}`
      }
    ],
    note: "Injection happens during the *populate properties* phase of the lifecycle — that is why `@Autowired` fields are still null inside a constructor and only usable from `@PostConstruct` onward.",
    tip: "Prefer `ObjectProvider<T>` over `@Autowired(required = false)`: it also supports `stream()`, `getIfUnique()`, and lazy resolution, which is how you keep optional or prototype collaborators without freezing them.",
    warning: "`@Autowired` on a **static** field, or on a class you instantiate with `new`, silently does nothing — no injection occurs outside the container, and the classic NPE in production comes from exactly this."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-bean-lifecycle",
    title: "Bean Lifecycle",
    difficulty: "Hard",
    theory: [
      "The bean lifecycle is the ordered list of steps the container performs between *'I know a bean is needed'* and *'the bean is shut down'*. Knowing it is what makes `@PostConstruct` vs `afterPropertiesSet` vs `@Bean(initMethod)` a non-question.",
      "**Instantiation** comes first: `AbstractAutowireCapableBeanFactory.createBeanInstance` chooses a constructor — the single one, the `@Autowired` one, the `@Autowired` constructor with the most satisfiable parameters, or the default — then uses `BeanUtils.instantiateClass`, a factory method (`@Bean`), a `Supplier` registration or `getInstantiationSuppliers()` from a `SmartInstantiationAwareBeanPostProcessor`.",
      "**Populate properties**: `AutowiredAnnotationBeanPostProcessor` and `CommonAnnotationBeanPostProcessor` resolve `@Autowired`, `@Value`, `@Inject` and `@Resource` through `postProcessProperties`, and XML/`@Bean` property values are applied. Only after this step are injected collaborators usable.",
      "**Aware callbacks** hand container services to the bean: `BeanNameAware.setBeanName`, `BeanClassLoaderAware`, `BeanFactoryAware`, and at the context level `ApplicationContextAware`, `EnvironmentAware`, `ResourceLoaderAware`, `MessageSourceAware`, `ApplicationEventPublisherAware` (plus servlet ones). These are dispatched by `ApplicationContextAwareProcessor`, a `BeanPostProcessor` registered by the context.",
      "**BeanPostProcessor#postProcessBeforeInitialization** runs next, then the three init callbacks in fixed order: `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `init-method` / `@Bean(initMethod = ...)`. All three are valid; the annotation is JSR-250 (`jakarta.annotation`), the interface couples you to Spring, the init-method keeps the class framework-free.",
      "**BeanPostProcessor#postProcessAfterInitialization** is where beans get wrapped: `AnnotationAwareAspectJAutoProxyCreator` returns an AOP proxy, `AsyncAnnotationBeanPostProcessor` builds the executor proxy, `PersistenceExceptionTranslationPostProcessor` wraps `@Repository` classes. Whatever this method returns is what other beans receive — normally.",
      "The bean is then **published to the singleton cache** and used. `SmartInitializingSingleton.afterSingletonsInstantiated()` is the hook for beans that must act only once *every* singleton exists (Boot's `ApplicationRunner`s, event-listener registration and scheduled-task registration all rely on this phase).",
      "**Shutdown** reverses init: `@PreDestroy` → `DisposableBean.destroy()` → custom `destroy-method`. `AbstractApplicationContext.doClose()` publishes `ContextClosedEvent`, stops `SmartLifecycle` beans and then destroys singletons in **reverse dependency order** — the reason you should prefer Spring-managed resources over JVM shutdown hooks.",
      "Setter/field **circular dependencies** are only possible because of the three-level cache: `singletonObjects` (finished beans), `earlySingletonObjects` (partially created, possibly proxied early) and `singletonFactories` (lambdas that produce the early reference via `getEarlyBeanReference`). Constructor cycles cannot use it — no object exists yet to expose — hence the `BeanCurrentlyInCreationException`.",
      "For **prototype** beans the container performs instantiation, population and init callbacks, then **forgets the bean**: no `@PreDestroy`, no `DisposableBean`, no registration in `disposableBeans`. Cleaning up prototypes is your job, or hand them to a singleton that closes them.",
      "`@Lazy` (or Boot's `spring.main.lazy-initialization=true`) defers creation until first use; a lazy `@Bean` also becomes the injection target through a lazy-resolution proxy so cycles can be broken without restructuring.",
      "Proxy timing has a subtle interview follow-up: when a cycle exists, the proxy may be created **early** (`getEarlyBeanReference`) and the *same* proxy is then returned at the after-init step — otherwise two different objects would be published and injected.",
      "Practical rules: open connections/threads and validate configuration in `@PostConstruct`; never call other beans' business methods there (they may not be initialised yet — use `ApplicationReadyEvent`/`SmartInitializingSingleton` instead); release everything in `@PreDestroy`; keep `equals`/`hashCode` safe because the injected object may be a proxy."
    ],
    keyPoints: [
      "Order: instantiate → populate (DI) → `Aware` callbacks → BPP before → **@PostConstruct → afterPropertiesSet → init-method** → BPP after (proxies) → ready.",
      "Shutdown order: **@PreDestroy → DisposableBean.destroy() → destroy-method**, during `context.close()` in reverse dependency order.",
      "`@PostConstruct`/`@PreDestroy` come from `jakarta.annotation` in Spring 6 — no Spring types leak into the class.",
      "AOP proxies are produced by `postProcessAfterInitialization`, so `getBean()` returns the proxy, not the target.",
      "Constructor injection cannot use the early-singleton cache — that is why constructor cycles fail and setter cycles do not.",
      "Prototypes: init callbacks run, **destroy callbacks never do**.",
      "Use `SmartInitializingSingleton` / `ApplicationReadyEvent` for work that needs the whole graph built.",
      "`@Bean` without `destroyMethod` still infers `close()` or `shutdown()` (Boot's default `AbstractBeanDefinition.INFER_METHOD`)."
    ],
    diagram: {
      type: "flow",
      title: "Singleton bean lifecycle (creation → use → destruction)",
      direction: "vertical",
      data: [
        { label: "1. Instantiation — constructor / @Bean factory method / Supplier", color: "primary", children: [{ label: "@Autowired or single-ctor resolution" }] },
        { label: "2. Populate properties — @Autowired, @Value, @Resource, @Inject", color: "primary" },
        { label: "3. Aware callbacks", color: "info", children: [{ label: "BeanNameAware, BeanFactoryAware, ApplicationContextAware, EnvironmentAware" }] },
        { label: "4. BeanPostProcessor.postProcessBeforeInitialization", color: "accent" },
        { label: "5. @PostConstruct", color: "warning", children: [{ label: "InitDestroyAnnotationBeanPostProcessor" }] },
        { label: "6. InitializingBean.afterPropertiesSet()", color: "warning" },
        { label: "7. Custom init-method / @Bean(initMethod=...)", color: "warning" },
        { label: "8. BeanPostProcessor.postProcessAfterInitialization", color: "accent", children: [{ label: "AOP proxy, async proxy, exception-translation proxy created here" }] },
        { label: "9. Bean ready — cached in singletonObjects; SmartInitializingSingleton after all singletons exist", color: "success" },
        { label: "10. @PreDestroy", color: "heap", children: [{ label: "on context.close()" }] },
        { label: "11. DisposableBean.destroy()", color: "heap" },
        { label: "12. Custom destroy-method / @Bean(destroyMethod=...)", color: "heap" }
      ]
    },
    table: {
      headers: ["Phase", "API", "Use it for", "Caveat"],
      rows: [
        ["Metadata", "BeanDefinition / BFPP", "Rewrite definitions before creation", "No bean instances exist yet"],
        ["Instantiate", "ctor, @Bean, Supplier", "Allocate the object", "Nothing injected yet"],
        ["Populate", "@Autowired, @Value", "Receive collaborators", "Fields still null inside the ctor"],
        ["Aware", "ApplicationContextAware …", "Container services", "Couples the class to Spring"],
        ["Init", "@PostConstruct", "Validate config, open resources, warm caches", "Other beans may not be initialised"],
        ["Init", "InitializingBean", "Same, Spring-coupled", "Interface pollutes the class"],
        ["Init", "init-method", "Framework-free POJO init", "String name, no compile safety"],
        ["Proxy", "postProcessAfterInitialization", "AOP, async, translation", "Self-invocation bypasses proxy"],
        ["Destroy", "@PreDestroy / DisposableBean / destroy-method", "Release resources", "Never called for prototypes"]
      ]
    },
    code: [
      {
        title: "Every callback in one bean, in the exact order Spring calls them",
        language: "java",
        content: `import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

@Component
public class CacheLoader implements BeanNameAware, BeanFactoryAware, InitializingBean {

    private final Metrics metrics;                 // mandatory ctor dependency

    public CacheLoader(Metrics metrics) {
        this.metrics = metrics;                    // 1. instantiation
        System.out.println("1 ctor");
    }

    @Override public void setBeanName(String name) { System.out.println("3a aware name=" + name); }
    @Override public void setBeanFactory(BeanFactory bf) throws BeansException {
        System.out.println("3b aware beanFactory");
    }

    @PostConstruct
    void init() {                                  // 5. annotation first
        metrics.gauge("cache.size", 0);
        System.out.println("5 @PostConstruct");
    }

    @Override public void afterPropertiesSet() { System.out.println("6 afterPropertiesSet"); }
    public void customInit() { System.out.println("7 init-method (declared on @Bean)"); }
    public void customDestroy() { System.out.println("12 destroy-method"); }

    @PreDestroy
    void close() { System.out.println("10 @PreDestroy — flush and release"); }
}`
      },
      {
        title: "Lifecycle hooks from the outside — @Bean init/destroy and inferred close()",
        language: "java",
        content: `import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

import javax.sql.DataSource;                       // jakarta-namespace app servers
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class InfraConfig {

    // destroyMethod defaults to AbstractBeanDefinition.INFER_METHOD,
    // so close()/shutdown() on the returned object is called automatically
    @Bean(destroyMethod = "shutdown")
    public ExecutorService taskExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    @Bean(initMethod = "warmUp", destroyMethod = "drain")
    @Scope("singleton")
    public LocalCache localCache(DataSource ds) {
        return new LocalCache(ds);
    }
}`
      }
    ],
    note: "For beans defined through `@Bean` the factory method itself is step 1 — Spring never calls a constructor it does not manage, so a `@Bean`-created object still gets steps 3 to 12 (Aware, BPPs, init, proxy, destroy).",
    tip: "Put 'the whole graph must exist' logic in `@EventListener(ApplicationReadyEvent.class)` (Boot) or `SmartInitializingSingleton` — not in `@PostConstruct`, where a collaborator may still be mid-lifecycle.",
    warning: "`@PostConstruct` and `@PreDestroy` are in `jakarta.annotation` for Spring 6/Boot 3 and **require that artifact on the classpath** (Boot starters include it); a plain `spring-context` module also needs `jakarta.annotation-api`, otherwise the callbacks are silently ignored."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-bean-scopes",
    title: "Bean Scopes — Singleton, Prototype, Request, Session",
    difficulty: "Medium",
    theory: [
      "A **scope** is the container's rule for *how many instances exist and how long they live* for one `BeanDefinition`. It is declared with `@Scope(\"...\")`, the meta-annotations `@Singleton`/`@Prototype`/`@RequestScope`/`@SessionScope`/`@ApplicationScope`, or `scope=` in XML.",
      "`singleton` (the default) means **one instance per container per bean definition** — not per JVM and not per class loader; two contexts in one JVM each have their own singleton. It is created during `refresh()` unless `@Lazy`, cached in `singletonObjects`, and destroyed with the context.",
      "`prototype` means **a new instance for every lookup** (`getBean`, every injection point). The container instantiates, wires and initialises it, then hands it over and forgets it — no destroy callbacks, no size cap, so a prototype in a hot loop is a memory/GC hazard.",
      "`request`, `session` and `application` are **web scopes** available in a `WebApplicationContext`; Spring Boot's servlet/reactive web starters register them automatically (`WebApplicationContextUtils.registerWebApplicationScopes`), so in a plain non-web context they are unknown and the app fails with `IllegalStateException: No ScopeHolder`-style errors.",
      "`request` gives one bean per HTTP request, `session` one per `HttpSession`, `application` one per `ServletContext` — all are stored as attributes in the corresponding scope object and resolved through `RequestContextHolder`'s thread-bound `RequestAttributes`.",
      "A short-lived scope injected into a long-lived singleton is the classic scope bug: the singleton is created once, so it keeps **the first** request's bean forever. The fix is a **scoped proxy** — `@Scope(value = \"session\", proxyMode = ScopedProxyMode.TARGET_CLASS)` — where the singleton receives a proxy that performs a scope lookup on every method call; `@RequestScope` and `@SessionScope` already default to `TARGET_CLASS`.",
      "Scoped proxies have costs and traps: `TARGET_CLASS` needs CGLIB (a non-final class with a default-visible constructor), `INTERFACES` needs an interface, the proxy is not `equals`-identical to the target, and calling it outside a request (async threads, schedulers) throws because no `RequestAttributes` are bound — propagate them with `RequestContextHolder.setRequestAttributes(...)` or a `TaskDecorator`.",
      "Beyond the built-ins you can write a **custom `Scope`** (a `ThreadScope`, `ConversationScope`, tenant scope): implement `org.springframework.beans.factory.config.Scope`, register it with `configurableBeanFactory.registerScope(\"thread\", new SimpleThreadScope())` — a `SimpleThreadScope` ships with the framework — and remember scoped objects there still need `registerDestructionCallback` to be cleaned up.",
      "`prototype` vs `singleton` matters for thread-safety reasoning: a singleton must be stateless or guarded (atomic/concurrent structures, `ThreadLocal` with care under virtual threads), while a prototype avoids shared mutable state at the cost of allocation and lost caching benefits.",
      "Scopes interact with injection semantics: `ObjectProvider<T>`/`ObjectFactory<T>` re-resolve per call so a prototype is refreshed, `@Lookup` method injection is the older equivalent, and `@Scope(proxyMode=...)` keeps the injection site clean but adds a proxy layer.",
      "For **Spring Boot 3.x**: singletons dominate (auto-configuration registers thousands), so `spring.main.lazy-initialization=true` is the usual startup lever; prototype-heavy designs are a code smell in DI and the container will happily let you leak them.",
      "Interview angle: be able to say *why* constructor-injecting a prototype into a singleton yields the same instance every time, and to name all three remedies (`ObjectProvider`, `@Lookup`, scoped proxy) with their trade-offs."
    ],
    keyPoints: [
      "Built-in container scopes: **singleton** (default) and **prototype**; web scopes: **request**, **session**, **application**, **websocket**.",
      "singleton = one per **container**/definition, eagerly created at `refresh()` unless `@Lazy`, destroyed on close.",
      "prototype = new instance per lookup; **destroy callbacks are never invoked** by the container.",
      "Web scopes need a bound request (`RequestContextHolder`); outside a request thread they throw.",
      "Inject a short-lived scope into a singleton → **scoped proxy** (`proxyMode = TARGET_CLASS`), or `ObjectProvider`/`@Lookup`.",
      "`@RequestScope`, `@SessionScope`, `@ApplicationScope`, `@Prototype`, `@Singleton` are meta-annotations combining `@Scope` + `proxyMode`.",
      "Custom scope = implement `Scope` + `registerScope(...)`; `SimpleThreadScope` is provided out of the box."
    ],
    table: {
      headers: ["Property", "singleton", "prototype", "request / session", "application"],
      rows: [
        ["Instances", "1 per container", "1 per lookup", "1 per request / HttpSession", "1 per ServletContext"],
        ["Created", "at refresh() (or on first use if @Lazy)", "on every getBean/injection", "on first access in that request/session", "on first access"],
        ["Destroyed by container", "Yes — @PreDestroy etc.", "No", "Yes (scope object releases it)", "Yes on context shutdown"],
        ["State risk", "Shared across threads", "Isolated", "Shared within one request/user", "Shared, app-wide"],
        ["Needs web context", "No", "No", "Yes", "Yes"],
        ["Injectable into singleton", "Naturally", "Only via proxy/ObjectProvider", "Only via scoped proxy", "Naturally"]
      ]
    },
    code: [
      {
        title: "Prototype injected into a singleton — three correct patterns",
        language: "java",
        content: `import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class ExportTask {
    void run() { System.out.println("export " + Integer.toHexString(hashCode())); }
}

@Service
class ExportService {

    private final ObjectProvider<ExportTask> tasks;

    ExportService(ObjectProvider<ExportTask> tasks) { this.tasks = tasks; }

    // 1) ObjectProvider - explicit, no proxy, works with constructor injection
    void runAll(int count) {
        for (int i = 0; i < count; i++) tasks.getObject().run();
    }

    // 2) @Lookup method injection (requires the class to be CGLIB-proxied)
    //    @Lookup protected abstract ExportTask newTask();

    // 3) inject the prototype with @Scope(proxyMode = TARGET_CLASS) on ExportTask
    //    and hold it in a normal field - Spring re-resolves it per method call
}`
      },
      {
        title: "Web scopes with a scoped proxy (Boot 3.x)",
        language: "java",
        content: `import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequestScope                                     // == @Scope("request") + TARGET_CLASS proxy
class RequestTracer {
    private final AtomicInteger spans = new AtomicInteger();
    public void mark(String name) { spans.incrementAndGet(); }
    public int count() { return spans.get(); }
}

@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION,
       proxyMode = ScopedProxyMode.TARGET_CLASS)  // proxy so a singleton can hold it
class ShoppingCart {
    private final List<String> items = new ArrayList<>();
    public void add(String sku) { items.add(sku); }
    public int size() { return items.size(); }
}

@Service
class CheckoutService {
    private final ShoppingCart cart;              // injected proxy, not a frozen session bean
    private final RequestTracer tracer;

    CheckoutService(ShoppingCart cart, RequestTracer tracer) {
        this.cart = cart; this.tracer = tracer;
    }
}`
      }
    ],
    note: "`singleton` in Spring means *per container*, so two `ApplicationContext`s — for example a parent/child context split or two test contexts cached by `@SpringBootTest` — hold two distinct 'singleton' instances.",
    tip: "Add `-Dspring.main.lazy-initialization=true` in dev to see how many singletons Boot creates for you; usually thousands of beans are built eagerly and only a handful are used by the first request.",
    warning: "`request`/`session` beans accessed from an `@Async` method, a scheduler or a virtual thread have no bound `RequestAttributes` — the scoped proxy throws `IllegalStateException`. Pass needed data explicitly instead of reaching through the proxy."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-autowiring",
    title: "Autowiring Modes",
    difficulty: "Medium",
    theory: [
      "**Autowiring** is the container's ability to satisfy a dependency from its own definitions without being told which bean to use. It exists in two syntaxes: the legacy XML `autowire=` attribute and today's annotation-driven resolution.",
      "The XML modes are `no` (default), `byName` (a setter whose name matches a bean **id**), `byType` (exactly one candidate of that type, otherwise `NoSuchBeanDefinitionException` / `NoUniqueBeanDefinitionException`), `constructor` (greedy constructor matching by type), plus `default-autowire` on the `<beans>` element. `autodetect` was removed in Spring 4.3.",
      "Annotation-driven autowiring is what everyone uses: `@Autowired` on a constructor, field, setter or arbitrary multi-arg method. The XML `byName` idea survives implicitly — after a by-type search finds several candidates, Spring falls back to matching the **injection point's name** against bean names.",
      "Mechanics: `AutowiredAnnotationBeanPostProcessor` collects `InjectionMetadata` for the class (annotated fields, method elements, constructor candidates) during `postProcessMergedBeanDefinition`, then `postProcessProperties` asks `DefaultListableBeanFactory.doResolveDependency` for each `DependencyDescriptor`.",
      "`doResolveDependency` resolves the type (including generics via `ResolvableType`), calls `findAutowireCandidates`, filters by `@Qualifier` and `AutowireCandidate` patterns, then chooses: a single match wins; otherwise `@Primary`, then `jakarta.annotation.Priority`, then the bean whose name equals the injection point name; otherwise it throws. Multi-arg `@Autowired` methods and `@Bean` method parameters are resolved argument by argument.",
      "`required = true` (the default) makes a missing dependency fatal at startup. Make it optional with `@Autowired(required = false)`, a `java.util.Optional<T>` parameter, `org.springframework.lang.Nullable` (respected by default in the `@NullMarked` Framework 6.1 API), or `ObjectProvider<T>`, which defers resolution and never throws on its own.",
      "Injecting **many** candidates: `List<T>` / `Set<T>` / `Map<String, T>` collect all matching beans, with collections ordered by `@Order` / `Ordered` / `PriorityOrdered`. This is the standard plug-in and strategy pattern across Spring and Boot.",
      "`@Resource` (`jakarta.annotation`) is name-first — it uses the field or attribute name and only then the type; `@Inject` (`jakarta.inject`) is type-only, has no `required` flag and pairs with `@Named` for qualifiers. All three work in Boot 3.x, but `@Autowired` + `@Qualifier` stays the most expressive.",
      "`@Primary` declares the default among several candidates; `@Qualifier(\"beanName\")` or a **custom qualifier annotation** (an annotation meta-annotated with `@Qualifier`) declares the specific one. Custom qualifiers can carry attributes, which `AutowireUtils`/`QualifierAnnotationAutowireCandidateResolver` compare, so they scale better than string bean names.",
      "`AutowireCapableBeanFactory` exposes the programmatic modes (`AUTOWIRE_NO`, `AUTOWIRE_BY_NAME`, `AUTOWIRE_BY_TYPE`, `AUTOWIRE_CONSTRUCTOR`) and the methods `autowireBean`, `createBean`, `applyBeanPostProcessorsAfterInitialization` — the API used to inject into objects Spring did not create (servlet-filter beans, legacy singletons, listeners registered by a third-party container).",
      "Autowiring versus explicit wiring: type-based resolution is concise but becomes ambiguous as the graph grows, while `ref=`/`@Qualifier` is verbose but deterministic. In a Boot 3 application with hundreds of auto-configured beans, always qualify infrastructure types that legitimately have several instances (`DataSource`, `HttpClient`, `CacheManager`, `ObjectMapper`).",
      "For `FactoryBean`s the candidate type is `getObjectType()`, so you autowire the product and use the `&`-prefixed bean name only when you need the factory itself — a frequent source of 'no qualifying bean' confusion.",
      "Interview angle: 'What happens when two beans implement one interface?' — `NoUniqueBeanDefinitionException`, then `@Primary`, `@Qualifier`, name matching or `List<T>`; and 'why does `@Autowired` work with no interface at all?' — resolution uses the injection point's declared type plus `ResolvableType`, not a lookup table of interfaces."
    ],
    keyPoints: [
      "XML modes: `no`, `byName`, `byType`, `constructor` (`autodetect` gone since 4.3); annotations are the modern path.",
      "`@Autowired` resolution order: **type → @Primary/@Priority → @Qualifier → injection-point name → exception**.",
      "`required=false`, `Optional<T>`, `@Nullable` or `ObjectProvider<T>` make a dependency optional.",
      "`List<T>`, `Set<T>`, `Map<String,T>` inject all candidates; collections are sorted by `@Order`/`Ordered`.",
      "`@Resource` = name-first (jakarta.annotation); `@Inject` = type-only (jakarta.inject) + `@Named`.",
      "Custom qualifier annotations can carry attributes — better than string bean names in large apps.",
      "`AutowireCapableBeanFactory.autowireBean(obj)` injects into objects Spring did not create."
    ],
    table: {
      headers: ["Aspect", "byName (XML / @Resource)", "byType (@Autowired / @Inject)", "Explicit (@Qualifier / ref)"],
      rows: [
        ["Key used", "property or field name", "declared type (+ generics)", "bean name or qualifier value"],
        ["Fails when", "no bean with that name", "0 or 2+ candidates", "the named bean is missing"],
        ["Refactoring safety", "breaks on rename", "stable", "breaks when the qualifier string changes"],
        ["Readability", "implicit", "implicit", "explicit at the injection site"],
        ["Typical use", "legacy XML, @Resource", "default in Boot", "infrastructure with several instances"]
      ]
    },
    code: [
      {
        title: "Resolution order in practice — primary, qualifier, collections",
        language: "java",
        content: `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.List;

interface PaymentGateway { void pay(long cents); }

@Component("stripeGateway")
class Stripe implements PaymentGateway {
    public void pay(long cents) { /* charge via Stripe */ }
}

@Component
@Primary                                     // default when nothing is specified
class AdyenGateway implements PaymentGateway {
    public void pay(long cents) { /* charge via Adyen */ }
}

class BraintreeGateway implements PaymentGateway {        // plain @Component below
}

@Component
class BraintreeGatewayBean extends BraintreeGateway { }

@Service
class BillingService {
    private final PaymentGateway preferred;            // Adyen (@Primary)
    private final PaymentGateway stripe;               // explicit qualifier
    private final List<PaymentGateway> all;            // all candidates, @Order-sorted

    BillingService(PaymentGateway preferred,
                   @Qualifier("stripeGateway") PaymentGateway stripe,
                   List<PaymentGateway> all) {
        this.preferred = preferred;
        this.stripe = stripe;
        this.all = all;
    }
}`
      },
      {
        title: "Custom qualifier annotation + optional dependency",
        language: "java",
        content: `import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Qualifier                                     // meta-annotation
@Retention(RetentionPolicy.RUNTIME)            // readable reflectively by the resolver
@interface Cache { String value() default "default"; }

interface CacheHandle { Object get(String key); }

@Component @Cache("users")  class UserCache implements CacheHandle {
    public Object get(String key) { return null; }
}
@Component @Cache("orders") class OrderCache implements CacheHandle {
    public Object get(String key) { return null; }
}

@Service
class DashboardService {
    private final CacheHandle users;
    private final ObjectProvider<Metrics> metrics;      // may be absent entirely

    DashboardService(@Cache("users") CacheHandle users,
                     ObjectProvider<Metrics> metrics) {
        this.users = users;
        this.metrics = metrics;
    }

    void render() {
        metrics.ifAvailable(Metrics::trackRender);       // no crash when missing
        users.get("key");
    }
}`
      },
      {
        title: "Legacy XML autowiring modes (still supported, not recommended)",
        language: "xml",
        content: `<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
           https://www.springframework.org/schema/beans/spring-beans.xsd"
       default-autowire="byType">

    <!-- a setter must exist; the candidate is chosen by property type -->
    <bean id="orderService" class="com.example.OrderService"/>

    <!-- byName: the bean id must equal the setter suffix (setInventoryClient) -->
    <bean id="inventoryClient" class="com.example.InventoryClient"/>
    <bean id="invoiceService" class="com.example.InvoiceService" autowire="byName"/>

    <!-- constructor: greedy matching against the widest satisfiable ctor -->
    <bean id="reportEngine" class="com.example.ReportEngine" autowire="constructor"/>
</beans>`
      }
    ],
    note: "Boot's scanned bean names come from `AnnotationBeanNameGenerator` — the decapitalised simple class name (`OrderServiceImpl` → `orderServiceImpl`) — which is why injection-point name matching often resolves ambiguity with no qualifier at all.",
    tip: "If an `@Autowired` type looks missing, check whether it is produced by a `FactoryBean`: the container matches on `getObjectType()`, so autowire the product type and use the `&name` form only when you need the factory.",
    warning: "Autowiring infrastructure types without a qualifier is fragile — the moment a second `DataSource`, `ObjectMapper` or `RestClient` bean appears (often from a starter you added), the application fails to start with `NoUniqueBeanDefinitionException`."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-java-config",
    title: "Java-based Configuration (@Configuration, @Bean)",
    difficulty: "Medium",
    theory: [
      "Java configuration replaces XML `<bean>` elements with `@Configuration` classes whose `@Bean` **methods** are factory methods: the method name is the bean id, the return type is the bean type, and the parameters are its dependencies.",
      "A `@Configuration` class is itself a bean, so it can use constructor injection, `@Value`, `@Profile`, `@Conditional`, lifecycle callbacks and `@DependsOn` like any component — but it is processed **first**, by `ConfigurationClassPostProcessor`, a `BeanDefinitionRegistryPostProcessor`.",
      "The key mechanism is **full mode**: Spring enhances the class with a CGLIB subclass so a call from one `@Bean` method to another is intercepted by `BeanMethodInterceptor` and returns the container's cached singleton instead of executing the factory method again.",
      "`proxyBeanMethods = false` gives **lite mode**: no CGLIB subclass, `@Bean` methods behave like ordinary methods, each call really does create a new object, and dependencies must be expressed as method **parameters**. Boot's own auto-configurations use it — it is measurably faster to start and lighter on memory.",
      "`@Bean` covers the whole `BeanDefinition`: `name` (with aliases), `initMethod`, `destroyMethod` (default `AbstractBeanDefinition.INFER_METHOD`, which finds `close()` or `shutdown()` automatically), `autowireCandidate`, and it composes with `@Scope`, `@Lazy`, `@Primary`, `@Qualifier`, `@Profile`, `@Role`.",
      "`@Import` composes configuration in three flavours: a plain class, an `ImportSelector` (returns **class names** — the engine behind Boot's `@EnableAutoConfiguration`) or an `ImportBeanDefinitionRegistrar` (registers definitions programmatically from `AnnotationMetadata`). Every `@EnableXxx` in Spring is a meta-annotation carrying a selector or registrar.",
      "A `@Bean`-producing class that is not annotated `@Configuration` — a `@Component`, an interface with `default @Bean` methods, or a class reached only via `@Import` — is **lite** configuration: no interception, so cross-method calls create new instances and the bean-name/alias semantics still apply.",
      "Java config versus XML: type-safe, refactor-safe, no string class names, conditional logic in real Java and IDE navigation — while the produced metadata and therefore the lifecycle are equivalent, so the choice is ergonomics, not semantics.",
      "Bean **overriding** has been disabled by default since Boot 2.1: two definitions with one name fail with `BeanDefinitionOverrideException` unless `spring.main.allow-bean-definition-overriding=true`; prefer `@Primary` or a distinct name over switching that flag on.",
      "`@Bean` methods can return `Supplier<T>`, `Optional<T>` or generic types (`@Bean CommandLineRunner ...`) and the generics stay visible to the resolver through `ResolvableType` — that is how Boot collects `List<CommandLineRunner>` and how `@Bean` `ExceptionTranslator`s are picked up.",
      "Boot 3.x specifics: auto-configuration classes are listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (the old `spring.factories` entry for auto-configurations is gone in Boot 3), annotated `@AutoConfiguration`, ordered with `@AutoConfigureBefore`/`@AutoConfigureAfter` and gated by `@ConditionalOn*`.",
      "Under Spring AOT/GraalVM native (Boot 3), `BeanMethodRegistrationFailure`-style reflection is replaced by generated `BeanDefinitionRegistrar` code produced at build time — the same programming model, but it means configuration classes must not rely on runtime classpath tricks that AOT cannot see.",
      "Interview angle: 'What does `proxyBeanMethods=false` change?' — it removes the CGLIB enhancement, so inter-method calls return new objects, forcing parameter wiring; you pay less startup and memory, and Boot recommends it wherever cross-method calls are absent."
    ],
    keyPoints: [
      "Method name = bean id; return type = bean type; parameters = injected dependencies.",
      "**Full mode** (`@Configuration`) is CGLIB-enhanced so inter-`@Bean` calls return the singleton.",
      "**Lite mode** (`proxyBeanMethods=false`, or `@Bean` on a `@Component`/interface) = no interception, new object per call.",
      "`destroyMethod` defaults to **INFER** — `close()`/`shutdown()` are called automatically for singletons.",
      "`@Import` + `ImportSelector` + `ImportBeanDefinitionRegistrar` power every `@EnableXxx` and all Boot auto-configuration.",
      "Duplicate bean names fail in Boot unless `spring.main.allow-bean-definition-overriding=true`.",
      "`@Configuration` classes cannot be `final`/`private`/`local` in full mode; `@Bean` methods cannot be `private`."
    ],
    table: {
      headers: ["Aspect", "proxyBeanMethods = true (full)", "proxyBeanMethods = false (lite)"],
      rows: [
        ["Class is CGLIB enhanced", "Yes", "No"],
        ["Calling one @Bean from another", "returns the cached singleton", "executes the method — new object"],
        ["Depending on another bean", "method call or parameter", "parameter only"],
        ["Startup time / memory", "higher", "lower"],
        ["final/private @Bean methods", "must stay overridable", "more tolerant, still not private"],
        ["Typical place", "app config using cross-method calls", "Boot auto-config, simple factories"]
      ]
    },
    code: [
      {
        title: "Full-mode configuration with inter-bean calls",
        language: "java",
        content: `import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Scope;

import javax.sql.DataSource;                 // javax.sql is JDK-provided, not Jakarta EE

@Configuration                                 // full mode: @Bean calls are intercepted
public class DataConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://localhost:5432/shop");
        ds.setMaximumPoolSize(20);
        return ds;                             // close() is INFERRED on context shutdown
    }

    @Bean
    public TransactionManager transactionManager() {
        // the proxy makes this return the SAME singleton DataSource
        return new TransactionManager(dataSource());
    }

    @Bean
    @Scope("prototype")
    public ReportContext reportContext() {     // new instance per injection point;
        return new ReportContext();            // Spring will NOT destroy it
    }
}`
      },
      {
        title: "Lite mode, @Import composition and an @Enable-style selector",
        language: "java",
        content: `import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.ImportSelector;
import org.springframework.core.type.AnnotationMetadata;

import java.util.function.Predicate;

@Configuration(proxyBeanMethods = false)        // no CGLIB - the Boot default style
@Import({ JacksonConfig.class, MetricsConfig.class })
@ConditionalOnProperty(prefix = "shop.search", name = "enabled", havingValue = "true")
public class SearchConfig {

    @Bean
    @ConditionalOnMissingBean                   // the application may replace it
    public SearchIndexer searchIndexer(IndexWriter writer, RetryPolicy retries) {
        return new SearchIndexer(writer, retries);
    }
}

// @EnableAudit -> selector -> class names registered as configuration
public @interface EnableAudit {
    Class<? extends ImportSelector> mode() default AuditSelector.class;
}

public class AuditSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        return new String[] { "com.shop.audit.JpaAuditConfig",
                              "com.shop.audit.AuditEventConfig" };
    }
}`
      },
      {
        title: "Programmatic registration — when annotations are not enough",
        language: "java",
        content: `import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.RootBeanDefinition;
import org.springframework.context.annotation.ImportBeanDefinitionRegistrar;
import org.springframework.core.annotation.AnnotationAttributes;
import org.springframework.core.type.AnnotationMetadata;

import java.util.Map;

public class TenantRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(AnnotationMetadata metadata,
                                        BeanDefinitionRegistry registry) {
        Map<String, Object> attrs = metadata.getAnnotationAttributes(Tenants.class.getName());
        String[] tenants = attrs == null
                ? new String[0] : (String[]) attrs.getOrDefault("value", new String[0]);

        for (String tenant : tenants) {
            RootBeanDefinition bd = new RootBeanDefinition(TenantStore.class);
            bd.getConstructorArgumentValues().addGenericArgumentValue(tenant);
            bd.setAutowireMode(RootBeanDefinition.AUTOWIRE_CONSTRUCTOR);
            bd.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);   // hidden from tooling
            registry.registerBeanDefinition(tenant + "Store", bd);
        }
    }
}`
      }
    ],
    note: "`ConfigurationClassPostProcessor` parses each `@Configuration` class into a `ConfigurationClass` model, recursively following `@Import`, `@ComponentScan`, `@Bean` methods and imported selectors — that pass is part of the bean-definition phase, before any bean instance exists.",
    tip: "Third-party classes cannot carry your annotations, so a `@Bean` method is the only clean way to register them — and it is also the place to apply conditional or profile-specific construction logic.",
    warning: "In lite mode a call from one `@Bean` method to another silently creates a **second** instance (two pools, two clients). If you set `proxyBeanMethods=false`, wire exclusively through method parameters."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-annotation-config",
    title: "Annotation-based Configuration",
    difficulty: "Medium",
    theory: [
      "Annotation configuration means the wiring metadata lives **on the class itself** — stereotype, injection, lifecycle and conditional annotations — instead of in an external descriptor; the container reads it reflectively and produces exactly the same `BeanDefinition`s it would from XML.",
      "**Stereotypes** express intent: `@Component` (generic), `@Service` (business layer), `@Repository` (persistence), `@Controller`/`@RestController` (web). To the container `@Service` and `@Component` are identical — both are meta-annotated with `@Component` — but the layering pays off in exception translation, tooling and scan filters.",
      "`@Repository` is the stereotype with real behaviour: `PersistenceExceptionTranslationPostProcessor` wraps the bean so vendor exceptions (`SQLException`, Hibernate/JPA errors) become Spring's `DataAccessException` hierarchy — and that only happens for container-managed instances behind a proxy.",
      "**Meta-annotation composition** is the extension mechanism: anything annotated with `@Component` is itself a stereotype (`@RestController` = `@Controller` + `@ResponseBody`), and `@AliasFor` exposes or renames attributes of the annotation you meta-annotate.",
      "Spring does not read annotations with plain `getAnnotation()` — it uses `MergedAnnotations` / `AnnotatedElementUtils.findMergedAnnotation` with a search strategy (DIRECT, INHERITED_ANNOTATIONS, META_ANNOTATIONS, TYPE_HIERARCHY), so attributes declared on meta-annotations and bridged with `@AliasFor` resolve correctly.",
      "Injection annotations (`@Autowired`, `@Value`, `@Qualifier`, `@Resource`, `@Inject`), lifecycle annotations (`@PostConstruct`, `@PreDestroy`) and configuration annotations (`@Configuration`, `@Bean`, `@ComponentScan`, `@Import`) are each handled by a **post-processor**, not by the container core — which is why the 'my annotation does nothing' answer usually lives in the `BeanPostProcessor` list.",
      "Conditional registration is annotation-driven: `@Profile`, `@Conditional(MyCondition.class)`, and Boot's `@ConditionalOnClass`, `@ConditionalOnBean`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`. They are evaluated against **bytecode metadata** read with ASM, before the class is loaded, which keeps auto-configuration cheap.",
      "Boot's entry point is itself annotation composition: `@SpringBootApplication` = `@SpringBootConfiguration` (a `@Configuration`) + `@EnableAutoConfiguration` (`@Import(AutoConfigurationImportSelector.class)`) + `@ComponentScan` carrying `TypeExcludeFilter` and `AutoConfigurationExcludeFilter` — and `scanBasePackages` exists because replacing the meta-`@ComponentScan` with your own loses those default filters.",
      "The Spring 6 migration is a namespace change, not a semantic one: `jakarta.annotation.PostConstruct` / `PreDestroy` / `Resource` / `Priority`, `jakarta.inject.Inject` / `Named`, `jakarta.persistence`, `jakarta.servlet`, `jakarta.validation`. Spring's own `@Autowired`, `@Qualifier`, `@Primary`, `@Value` stay under `org.springframework.*`.",
      "Retention matters: Spring needs `RUNTIME` for annotations it reads from live classes and `CLASS`/`RUNTIME` for the subset it reads from `.class` files during scanning; `AnnotationUtils.isInJavaLangAnnotationPackage` style filtering aside, an annotation without `RUNTIME` retention is simply invisible to injection.",
      "Versus the alternatives: XML keeps configuration outside the code (good for third-party types, weak for refactoring), `@Bean` Java config gives type-safe wiring for classes you do not own, and annotations keep your own classes self-describing — production applications combine all three.",
      "Interview angle: 'Difference between `@Component` and `@Bean`?' — `@Component` annotates a class **you own** and is discovered by scanning; `@Bean` annotates a **method** and is how you register types you do not own or must build conditionally, with constructor arguments resolved by type."
    ],
    keyPoints: [
      "Stereotypes are meta-annotated with `@Component`; only `@Repository` adds behaviour (exception translation).",
      "Custom annotations compose — meta-annotate with `@Component` for detection, use `@AliasFor` to expose attributes.",
      "Metadata is read through `MergedAnnotations`/`AnnotatedElementUtils`, so meta-annotation attributes are honoured.",
      "`@Autowired`, `@Value`, `@PostConstruct` are implemented by `BeanPostProcessor`s, not by the container core.",
      "Conditions (`@Profile`, `@Conditional*`) evaluate on ASM metadata **before** instantiation.",
      "`@SpringBootApplication` = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan` with excludes.",
      "Spring 6/Boot 3 imports are `jakarta.annotation.*` and `jakarta.inject.*`; Spring's own annotations are unchanged."
    ],
    table: {
      headers: ["Annotation", "Layer", "Behaviour beyond @Component", "Use it for"],
      rows: [
        ["@Component", "any", "none", "generic infrastructure beans"],
        ["@Service", "business", "none (semantic, filter-friendly)", "application/domain services"],
        ["@Repository", "persistence", "DataAccessException translation", "DAOs, JDBC/JPA access"],
        ["@Controller", "web", "handler mapping, view resolution", "MVC endpoints"],
        ["@RestController", "web", "= @Controller + @ResponseBody", "JSON/REST APIs"],
        ["@Configuration", "config", "CGLIB-enhanced @Bean factory", "bean definitions"],
        ["@ControllerAdvice", "web", "global exception handling + @ModelAttribute", "cross-controller concerns"]
      ]
    },
    code: [
      {
        title: "A custom stereotype with @AliasFor",
        language: "java",
        content: `import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component                                    // meta-annotation -> it gets scanned
public @interface DomainService {
    @AliasFor(annotation = Component.class)   // value aliases @Component.value
    String value() default "";
}

@DomainService("pricing")                     // bean name = "pricing"
public class PricingEngine { }`
      },
      {
        title: "Conditional + profile composition (Boot 3 idioms)",
        language: "java",
        content: `import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "shop.notifications", name = "mode",
                       havingValue = "email", matchIfMissing = true)
public class NotificationConfig {

    @Bean
    @Profile("prod")
    public Notifier prodNotifier(SmtpClient smtp) { return new SmtpNotifier(smtp); }

    @Bean
    @Profile({ "dev", "test" })
    public Notifier devNotifier() { return new LoggingNotifier(); }

    @Bean
    @ConditionalOnMissingBean(Notifier.class)   // library default loses to app bean
    public Notifier fallback() { return Notifier.NOOP; }

    @Bean
    @Conditional(WeekdayOnlyCondition.class)    // your own Condition impl
    public ReminderScheduler reminderScheduler() { return new ReminderScheduler(); }
}`
      }
    ],
    note: "Annotations are declarative sugar over fixed machinery — `ConfigurationClassPostProcessor`, `AutowiredAnnotationBeanPostProcessor`, `CommonAnnotationBeanPostProcessor`, `PersistenceExceptionTranslationPostProcessor` — so any annotation can be reproduced with explicit post-processor code.",
    tip: "Introduce a composed annotation (`@DomainService`, `@AwsClient`) as soon as the same annotation stack repeats: it standardises naming and gives scan filters something concrete to match.",
    warning: "Annotations only affect **container-managed** instances. An object created by `new`, by Jackson, by JUnit or inside a lambda gets no injection, no proxy and no `@Transactional` — the silent-failure classic."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-component-scan",
    title: "Component Scanning",
    difficulty: "Medium",
    theory: [
      "**Component scanning** lets the container find annotated classes on the classpath and register a `BeanDefinition` for each, so you declare intent once (`@Component`) instead of naming every class in configuration.",
      "With no attributes, `@ComponentScan` uses the **package of the annotated class** as the base package and recurses into sub-packages — which is exactly why a Boot main class must sit at the root package of its own code.",
      "Internal flow: `ClassPathBeanDefinitionScanner.doScan` → `findCandidateComponents` builds a resource pattern (`classpath*:com/example/**/*.class`, overridable via `resourcePattern`) → `PathMatchingResourcePatternResolver` enumerates class files (jar-aware, `BOOT-INF/classes` aware in Boot) → `SimpleMetadataReader` reads **bytecode with ASM** → candidate check → `AnnotatedGenericBeanDefinition` registered under a name produced by the `BeanNameGenerator`.",
      "Because detection works on metadata rather than loaded classes, `@ConditionalOnClass` and `@Profile` can be decided before a class is linked — this is what makes Boot evaluating thousands of candidate configurations affordable at startup.",
      "A class is a candidate when it is **concrete and independent** (not an interface, not abstract unless static-nested-config, not a non-static inner class) and carries an annotation that is `@Component` or meta-annotated with it; `@ControllerAdvice`, `@RestController` and custom stereotypes therefore qualify through their ancestry.",
      "`includeFilters` and `excludeFilters` narrow detection with `FilterType.ANNOTATION` (the default), `ASSIGNABLE_TYPE` (an exact class), `ASPECTJ` (a type pattern, which needs `aspectjweaver` on the classpath), `REGEX` (a class-file path pattern) or a custom `TypeFilter`; `useDefaultFilters = false` turns off the built-in '@Component present' rule so detection is defined purely by your filters.",
      "`basePackageClasses = PricingApi.class` is the type-safe spelling of a base package — the compiler catches a move or rename, which matters in multi-module builds and in libraries that must not hard-code string package names.",
      "`@ComponentScan` is **repeatable** since Spring 5.2, so several scans can be stacked; Boot exposes the common case as `@SpringBootApplication(scanBasePackages = ...)`, and adding your own `@ComponentScan` alongside it replaces the default one including its exclude filters.",
      "Scanned definitions are `AnnotatedGenericBeanDefinition`s, so `@Scope`, `@Lazy`, `@DependsOn`, `@Role`, `@Description` and `proxyMode` are read from the class annotations — the same metadata model a `@Bean` method produces, which makes scanning and explicit configuration interchangeable.",
      "Startup cost is proportional to the number of class files walked; `spring-context-indexer` (an annotation processor writing `META-INF/spring.components`) turns the walk into a lookup, and Boot 3's AOT/`spring-boot-aot` processing goes further by generating bean-registration code so no scanning happens at runtime in a native image.",
      "Versus `@Import`: scanning is convention-based and open-ended — convenient for application code, risky across module boundaries because it can register a class you never intended to expose — while `@Import` is closed-world and explicit, which is why every Boot starter relies on auto-configuration and `@Import` and never scans application packages.",
      "Interview angle: 'How does Spring find my bean?' — resource-pattern resolution, ASM metadata reading, `isCandidateComponent` rules, conditional evaluation and name generation; then contrast the loud failure (a condition throws) with the silent one (the package is simply not scanned)."
    ],
    keyPoints: [
      "Default base package = the annotated class's package, recursive into sub-packages.",
      "Scanning uses `PathMatchingResourcePatternResolver` + **ASM** readers, not `Class.forName`.",
      "Candidate = concrete, independent, annotated with `@Component` or a meta-annotation of it.",
      "Filters: `ANNOTATION`, `ASSIGNABLE_TYPE`, `ASPECTJ` (needs aspectjweaver), `REGEX`, custom `TypeFilter`; `useDefaultFilters=false` to go explicit.",
      "`basePackageClasses` is the refactor-safe way to name a package.",
      "`@ComponentScan` is repeatable (5.2+); `@SpringBootApplication` supplies default exclude filters.",
      "`spring-context-indexer` or Boot 3 AOT removes the classpath walk from startup."
    ],
    table: {
      headers: ["FilterType", "Matches on", "Needs", "Typical use"],
      rows: [
        ["ANNOTATION (default)", "presence of an annotation type", "readable annotation metadata", "custom stereotypes, marker annotations"],
        ["ASSIGNABLE_TYPE", "class or interface identity", "the referenced class on the classpath", "exclude one specific bean"],
        ["ASPECTJ", "AspectJ type expression", "aspectjweaver dependency", "com.shop.service..* minus *Dto"],
        ["REGEX", "class-file path pattern", "nothing extra", "quick package-shaped rules"],
        ["CUSTOM", "your TypeFilter implementation", "your own class", "domain-specific selection logic"]
      ]
    },
    code: [
      {
        title: "Explicit, type-safe scanning with filters",
        language: "java",
        content: `import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;

@Configuration
@ComponentScan(
    basePackageClasses = { PricingApi.class, BillingApi.class },
    useDefaultFilters = false,                        // ignore plain @Component
    includeFilters = {
        @ComponentScan.Filter(type = FilterType.ANNOTATION, value = DomainService.class),
        @ComponentScan.Filter(type = FilterType.REGEX,
                              pattern = "com\\\\.shop\\\\.infra\\\\..*Adapter"),
        @ComponentScan.Filter(type = FilterType.ASPECTJ,
                              pattern = "com.shop.service..*Service")
    },
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                              classes = LegacyFaxGateway.class)
    },
    lazyInit = false,
    resourcePattern = "**/*.class")
public class ShopDomainConfig { }`
      },
      {
        title: "Boot 3 root-package layout and scan overrides",
        language: "java",
        content: `package com.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

// Living in com.shop means the default scan already covers com.shop.** —
// including com.shop.report, com.shop.web and com.shop.domain.

@SpringBootApplication(scanBasePackages = { "com.shop", "com.common.lib" })
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}

// Full control instead: @SpringBootApplication plus an explicit @ComponentScan
// replaces Boot's default filters, so re-add the excludes you still need:
// @SpringBootApplication
// @ComponentScan(basePackages = "com.shop",
//                excludeFilters = @ComponentScan.Filter(InternalTestBean.class))`
      }
    ],
    note: "The default name for a scanned bean is the decapitalised simple class name (`OrderHandler` → `orderHandler`); supply a custom `nameGenerator` implementing `BeanNameGenerator` (for example fully qualified names) if modules produce collisions.",
    tip: "Keep the Boot main class in the **root** package (`com.shop`) and never in a leaf — that one convention removes most 'bean not found' reports in multi-module projects.",
    warning: "Scanning a package you do not own (`basePackages = \"com\"`) registers third-party `@Component`s with unpredictable side effects; scanning too narrowly is the silent failure — the class compiles, the annotation is right, and the bean simply never exists."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-profiles",
    title: "Profiles & Environment Abstraction",
    difficulty: "Medium",
    theory: [
      "**Profiles** register different bean definitions for different deployment targets — dev/test/prod, cloud/on-prem, mock/real — so the **artifact stays identical** and only configuration changes. A profile is a name attached to a definition; the `Environment` decides whether it currently applies.",
      "**`Environment`** carries both halves of that decision: profile state (`acceptsProfiles(Profiles.of(\"prod\"))`, `getActiveProfiles()`, `getDefaultProfiles()`) and an ordered `MutablePropertySources` list used for every `${...}` lookup. It is exposed as `ConfigurableEnvironment` on configurable contexts and as the `environment` variable inside bean-definition SpEL.",
      "`@Profile` works on `@Component`, `@Configuration` **and** `@Bean` methods, and since Spring 5.1 its value is a boolean **expression**: `@Profile(\"prod & !mock\")`, `@Profile(\"kafka | rabbit\")`, `@Profile(\"!default\")`; a plain array `@Profile({\"dev\",\"test\"})` means OR.",
      "`@Profile` is a thin `@Conditional` (`OnProfileCondition` over `Profiles.of(...)`), evaluated while parsing definitions — an inactive definition is never registered, so no class is loaded, no object is created and the startup cost of an inactive profile is effectively zero.",
      "Ways to activate, roughly in the order you will use them: `SPRING_PROFILES_ACTIVE` in the OS environment, `--spring.profiles.active=...` on the command line, `-Dspring.profiles.active=...`, `spring.profiles.active` in `application.properties`, `@ActiveProfiles` in tests, and `env.setActiveProfiles(...)` / `setAdditionalProfiles(...)` on a manually built context.",
      "`spring.profiles.default` names the profile used when nothing is active; Boot's out-of-the-box default profile is literally `default`, so `@Profile(\"default\")` is the idiomatic 'only when the operator chose nothing' bean.",
      "Boot 2.4+ (therefore Boot 3.x) reshaped configuration files: `application.yaml` plus `application-{profile}.yaml`, multi-document YAML separated by `---` gated with `spring.config.activate.on-profile`, **profile groups** (`spring.profiles.group.prod: eu,audit`), and the rule that a profile-specific document may not itself activate a profile.",
      "Property **precedence** is a list where earlier sources win: command-line args, `SPRING_APPLICATION_JSON`, servlet params/context params, JNDI, `java:comp/env`, `SystemProperties`, OS environment, profile-specific `application-{profile}.*`, plain `application.*`, `@PropertySource` files, then default properties added with `addLast`.",
      "In classic Spring the same mechanism covers XML: `<beans profile=\"prod\">` blocks near the end of the descriptor; the profile name `default` is reserved there and cannot be used in a `profile` attribute. It still works on Framework 6.x but `@Profile`/`@ConditionalOnProperty` have replaced it almost everywhere.",
      "Versus the alternatives: `@ConditionalOnProperty` keys off a **property value** rather than an environment name (the right tool for a feature flag that changes independently of environment), a custom `Condition` gives full programmatic control, and `@ConfigurationProperties` records let one bean absorb the differences instead of swapping beans.",
      "Practical rule: keep business beans profile-neutral and let a profile pick the **implementation** (`@Profile(\"gcp\") StorageClient` versus `@Profile(\"aws\") StorageClient`) rather than scattering `if (isProd)` through the code; never bake secrets into profile files inside the jar — reference them with `${...}` placeholders resolved from the platform.",
      "Interview angle: 'Difference between a profile and a property?' — a profile decides **which bean definitions exist**, a property decides **values inside existing definitions** — plus the activation order and the Boot 2.4 config-data constraints."
    ],
    keyPoints: [
      "Profiles gate **bean definitions**; `Environment` = active/default profiles + ordered property sources.",
      "`@Profile` supports expressions since 5.1 (`prod & !mock`); an array value means OR.",
      "Inactive definitions are never registered — no class loading, no instance, no cost.",
      "Activation: `SPRING_PROFILES_ACTIVE`, `-D`/`--spring.profiles.active`, `@ActiveProfiles`, `setAdditionalProfiles`.",
      "`spring.profiles.group.<name>` bundles profiles; groups may only appear in non-profile-specific documents.",
      "`@Profile(\"default\")` matches when no profile was explicitly activated.",
      "`@ConditionalOnProperty` is a value-based alternative; profiles are environment-based."
    ],
    table: {
      headers: ["Source", "Example", "Precedence", "Best for"],
      rows: [
        ["Command line args", "--server.port=9090", "highest", "one-off overrides, CI"],
        ["SPRING_APPLICATION_JSON", "{ \"shop\": { \"tax-rate\": 0.2 } }", "very high", "container/platform injectors"],
        ["OS environment", "SPRING_PROFILES_ACTIVE, SERVER_PORT", "high", "Docker / Kubernetes"],
        ["JVM system properties", "-Dspring.profiles.active=test", "high", "local runs, IDEs"],
        ["application-{profile}.yml", "per-environment datasource", "medium", "environment config"],
        ["application.yml", "shared defaults", "medium-low", "everything common"],
        ["@PropertySource", "extra properties/yaml file", "low", "library-provided defaults"],
        ["Default properties (addLast)", "Map<String,Object> fallbacks", "lowest", "safe in-code defaults"]
      ]
    },
    code: [
      {
        title: "Profile-specific YAML with documents and groups",
        language: "yaml",
        content: `spring:
  application:
    name: shop
  profiles:
    group:
      prod: eu,audit          # activating prod also activates eu and audit
    default: dev              # used when nothing else is set
shop:
  tax-rate: 0.18

---
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:shop
    driver-class-name: org.h2.Driver

---
spring:
  config:
    activate:
      on-profile: prod & !mock
  datasource:
    url: \${DB_URL}             # supplied by the platform, never baked into the jar
    hikari:
      maximum-pool-size: 40
shop:
  tax-rate: 0.20`
      },
      {
        title: "@Profile beans with expressions",
        language: "java",
        content: `import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
public class PaymentConfig {

    public interface Gateway { }
    record StubGateway() implements Gateway { }
    record LiveGateway(String apiKey) implements Gateway { }

    @Bean
    @Profile("test | dev")                    // OR expression
    Gateway stubGateway() { return new StubGateway(); }

    @Bean
    @Profile("prod & !mock")                  // AND / NOT expression
    Gateway liveGateway(@Value("\${shop.gateway.api-key}") String apiKey) {
        return new LiveGateway(apiKey);
    }

    @Bean
    @Profile("default")                       // only when no profile was activated
    Gateway devDefault() { return new StubGateway(); }
}`
      },
      {
        title: "Activating profiles programmatically and in tests",
        language: "java",
        content: `import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;

public class Bootstrap {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext();
        ctx.getEnvironment().setActiveProfiles("prod", "eu");
        ctx.register(PaymentConfig.class);
        ctx.refresh();
        System.out.println(Arrays.toString(
                ctx.getEnvironment().getActiveProfiles()));   // [prod, eu]
        ctx.close();
    }
}

@SpringBootTest(properties = "shop.tax-rate=0.05")
@ActiveProfiles("test")
class TaxCalculationTest {
    // dev/test beans are the ones registered in this context
}`
      }
    ],
    note: "`Environment.getDefaultProperties()` returns a `Map` you can `addLast` into the property sources — that is how libraries ship in-code fallbacks without forcing a properties file on the application.",
    tip: "In tests prefer `@ActiveProfiles` over editing files, and `@DynamicPropertySource` (Boot 3) for values known only at runtime, such as Testcontainer-mapped ports.",
    warning: "Profiles are frozen at `refresh()` — you cannot switch profile per request. And an exception thrown from a `Condition` or from `@Profile` evaluation aborts startup entirely, taking the app down for what looks like a 'small config typo'."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-value",
    title: "@Value & Property Sources",
    difficulty: "Easy",
    theory: [
      "`@Value` injects **one configuration value** into a field, a constructor parameter, a method parameter (including `@Bean` method parameters and multi-arg `@Autowired` setters) or an annotation attribute, and its argument is read as a mixture of property placeholders `${...}` and SpEL `#{...}`.",
      "The two syntaxes are resolved by different machinery: `${...}` is handled by `PropertySourcesPlaceholderConfigurer`, a `BeanFactoryPostProcessor` that walks the string values of every `BeanDefinition` and resolves them against `Environment.getPropertySources()` during the metadata phase; `#{...}` is evaluated later by `StandardBeanExpressionResolver` when the bean is actually created.",
      "Boot registers the placeholder configurer for you (via `SharedMetadataReaderFactoryContextInitializer`), which is why `@Value` works out of the box; in a plain Framework 6 application without it, `${...}` strings are injected **literally** — one of the most common 'why is my property a raw dollar string' causes.",
      "Defaults make values optional: `@Value(\"${shop.tax-rate:0.18}\")` supplies a fallback, and a `@Value` without a default fails at startup with `IllegalArgumentException: Could not resolve placeholder` — which is a virtue for mandatory configuration because the error is loud and immediate.",
      "SpEL form unlocks computed and bean-referencing values: `@Value(\"#{systemProperties['java.version']}\")`, `@Value(\"#{T(java.time.LocalDate).now().year}\")`, `@Value(\"#{ @pricing.defaultRate * 100 }\")` (bean names are addressed with `@name` inside an expression), and collection literals `#{ { 'a', 'b' } }`.",
      "Types are converted by the bean factory's `TypeConverter`/`ConversionService`, so a `String` property binds to `int`, `boolean`, an enum, `List<String>` from a comma-separated value, `URI`, `Duration` or Boot's `DataSize`. **Boot's relaxed binding does not apply to `@Value`** — the key must match exactly, unlike `@ConfigurationProperties`.",
      "Property **sources** are the `Environment` list: `application.properties`/`application.yml`, profile-specific files, `@PropertySource(\"classpath:extra.properties\")`, `SystemProperties`, OS environment, command-line arguments, and Boot's `random` source (`${random.int[1,100]}`, `${random.uuid}`) — looked up in precedence order, first hit wins.",
      "`@Value` on a `static` field does nothing (injection is per-instance) and `@Value` in a class that is not a bean does nothing either; constants are usable in the annotation only as compile-time constants, e.g. `@Value(Prefix.NAME + \".url\")`, because annotation values must be constant expressions.",
      "`Environment env = ...; env.getProperty(\"shop.tax-rate\", \"0.18\")` is the programmatic alternative: it stays dynamic, supports profiles and maps cleanly to `env.requiredProperty(...)` (Framework 6.1 / Boot 3.1) which throws a descriptive `IllegalStateException` instead of returning null.",
      "For more than two or three related settings, use `@ConfigurationProperties` with a Java **record** — type-safe, validated with `@Validated`, relaxed binding, IDE metadata and no scattered strings. `@Value` remains the right tool for one-off values and for expressions that genuinely need SpEL.",
      "`@ConfigurationProperties` beans are instantiated and bound during bean creation, so their values are **not** available to placeholder resolution in other bean definitions' `@Value`s — if another annotation attribute must see the value, keep it as a raw property key.",
      "In tests, override values with `@SpringBootTest(properties = ...)`, `@TestPropertySource`, `@DynamicPropertySource` (Boot 3, for Testcontainers) or OS environment variables; remember that `@TestPropertySource` entries outrank the application's own files.",
      "Interview angle: 'What is the difference between `${}` and `#{}`?' — placeholder against the `Environment` versus SpEL evaluation against a bean expression context — and be able to say why `@Value` does not support relaxed binding while `@ConfigurationProperties` does."
    ],
    keyPoints: [
      "`@Value` accepts `${...}` placeholders, `#{...}` SpEL, or both in one string.",
      "`${}` is resolved by `PropertySourcesPlaceholderConfigurer` in the **bean-definition phase**; `#{}` at bean creation by `StandardBeanExpressionResolver`.",
      "Boot registers the placeholder configurer automatically; plain Spring does not — placeholders then stay unresolved.",
      "`${key:default}` makes a value optional; a missing key without a default fails startup (fail-fast).",
      "No relaxed binding, no static fields, no injection into objects created with `new`.",
      "Lists bind from comma-separated strings; `Duration`/`DataSize`/enums convert automatically.",
      "`@ConfigurationProperties` records are the scalable replacement once you have related settings.",
      "`Environment.requiredProperty(...)` (Boot 3.1+) is the null-safe programmatic form."
    ],
    table: {
      headers: ["Aspect", "@Value", "@ConfigurationProperties"],
      rows: [
        ["Granularity", "a single value / expression", "a whole nested group"],
        ["Syntax", "${...} or #{...}", "binds by property name prefix"],
        ["Relaxed binding", "no — exact key required", "yes (shop.tax-rate, shop.taxRate, SHOP_TAX_RATE)"],
        ["Type conversion", "yes, via ConversionService", "yes, richer (Duration, DataSize, collections, records)"],
        ["Validation", "manual", "@Validated + Jakarta constraints"],
        ["SpEL expressions", "yes", "no"],
        ["IDE metadata", "none", "generated spring-configuration-metadata.json"],
        ["Best for", "one-off values, computed defaults", "structured configuration"]
      ]
    },
    code: [
      {
        title: "application.yml — the property sources",
        language: "yaml",
        content: `shop:
  name: Algoguru Store
  tax-rate: 0.18
  cache-ttl: 30s                    # bound to java.time.Duration
  gateways: stripe,adyen,braintree  # bound to List<String>
  instance-id: \${random.uuid}        # Boot's RandomValuePropertySource
  max-items: \${SHOP_MAX_ITEMS:5000}  # env var with an in-file default

spring:
  config:
    import: classpath:search-defaults.yml`
      },
      {
        title: "Injecting with @Value — constructor params are the idiomatic form",
        language: "java",
        content: `import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class ShopService {

    private final String name;
    private final double taxRate;
    private final Duration cacheTtl;
    private final List<String> gateways;
    private final String javaVersion;

    // constructor injection keeps everything final and test-friendly
    public ShopService(
            @Value("\${shop.name}") String name,
            @Value("\${shop.tax-rate:0.20}") double taxRate,       // with a default
            @Value("\${shop.cache-ttl}") Duration cacheTtl,        // converted
            @Value("\${shop.gateways}") List<String> gateways,     // comma split
            @Value("#{systemProperties['java.version']}") String javaVersion) { // SpEL
        this.name = name;
        this.taxRate = taxRate;
        this.cacheTtl = cacheTtl;
        this.gateways = gateways;
        this.javaVersion = javaVersion;
    }

    public boolean isFast() { return cacheTtl.getSeconds() < 60; }
}`
      },
      {
        title: "@Value vs @ConfigurationProperties (record + validation)",
        language: "java",
        content: `import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "shop")
public record ShopProps(
        @NotBlank String name,
        @PositiveOrZero double taxRate,
        Duration cacheTtl,
        List<String> gateways) { }

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(ShopProps.class)
class Wiring {
    // one structured bean instead of five @Value strings;
    // relaxed binding means SHOP_TAX_RATE or shop.tax-rate both work
}`
      }
    ],
    note: "`@Value(\"${key}\")` on a `@Bean` **method parameter** works exactly like on a constructor, which is the cleanest way to feed a library object a property without making the configuration class itself configurable.",
    tip: "Use `-Dspring.config.location` or `spring.config.import` for extra files, and `@DynamicPropertySource` in tests so Testcontainers ports never need a hardcoded value.",
    warning: "A `@Value` with no default on a missing key stops the application at startup, and `@Value` in a **static** field or in a class you `new` yourself leaves the field silently null or unset — one of the most common NPE sources in Spring code."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-context-vs-factory",
    title: "ApplicationContext vs BeanFactory",
    difficulty: "Hard",
    theory: [
      "`BeanFactory` is the **minimum container contract**: `getBean(String)`, `getBean(String, Class)`, `containsBean`, `isSingleton`, `isTypeMatch`. It is an interface, and its default implementation `DefaultListableBeanFactory` is also the engine that `ApplicationContext` delegates to internally.",
      "`ApplicationContext` **extends** `BeanFactory` (through `ListableBeanFactory` and `HierarchicalBeanFactory`) and adds the enterprise layer: `MessageSource` for i18n, `ResourceLoader`/`ResourcePatternResolver`, `ApplicationEventPublisher`, `EnvironmentCapable`, `Aware`-callback processing for beans, and lifecycle management of singletons.",
      "The behavioural difference that bites people: a plain `BeanFactory` **does not pre-instantiate singletons** — a singleton is created the first time it is requested — whereas `ApplicationContext.refresh()` walks every non-lazy singleton definition and creates it. That is why `@PostConstruct` side effects, `ApplicationRunner`s and startup validation only happen with a context.",
      "`AbstractApplicationContext` is the template: it creates its internal `DefaultListableBeanFactory` in `createBeanFactory()`, then delegates `getBean`/`getBeansOfType` to it, while adding the event multicaster, message source, scope registration (`registerScope(\"singleton\", new SingletonObjectFactory-ish ...)`) and shutdown bookkeeping.",
      "`refresh()` is the interview centrepiece and has a fixed sequence: prepare the context → `prepareBeanFactory` (class loader, SpEL expression resolver, `ApplicationContextAwareProcessor`, ignored-aware interfaces, `environment`/`systemProperties`/`systemEnvironment` singletons) → `postProcessBeanFactory` hook → `invokeBeanFactoryPostProcessors` → `registerBeanPostProcessors` → `initMessageSource` → `initApplicationEventMulticaster` → `onRefresh` (Boot creates the **web server** here) → `registerListeners` → `finishBeanFactoryInitialization` (instantiate the singletons) → `finishRefresh` (start `SmartLifecycle` beans, publish `ContextRefreshedEvent`).",
      "Because the sequence is fixed, ordering consequences follow: `BeanFactoryPostProcessor`s run **before any bean instance exists**, `BeanPostProcessor`s are registered before beans are created (so they can advise every one of them), and listeners registered via `@EventListener` are detected in `registerListeners` so early events are not lost.",
      "Available implementations: `AnnotationConfigApplicationContext` (annotation/Java config, non-web), `GenericApplicationContext` (programmatic registration, the base of Boot's contexts), `ClassPathXmlApplicationContext` / `FileSystemXmlApplicationContext` (XML), `AnnotationConfigServletWebServerApplicationContext` and `AnnotationConfigReactiveWebServerApplicationContext` (Boot 3 web), plus `GenericGroovyApplicationContext`.",
      "`BeanFactory`-only usage is legitimate for constrained environments: a `DefaultListableBeanFactory` fed by `XmlBeanDefinitionReader` or by `registerBean` calls gives you DI without the message source, event and pre-instantiation layer — this is roughly what Android-flavoured, ultra-fast-startup or embedded scenarios used, and `XmlBeanFactory` itself was removed in 5.x for exactly this reason.",
      "**Hierarchical contexts**: `HierarchicalBeanFactory.getParentBeanFactory()` — a child resolves a bean locally first, then delegates to the parent; the parent never sees child beans. Autowiring does **not** cross into the parent's candidates the way `getBean` does, which is why classic Spring MVC (root context + servlet context) produced 'bean not found in the right context' bugs; Spring Security's `DelegatingApplicationContext` filters still lean on the parent/child split.",
      "Shutdown and events: `close()` publishes `ContextClosedEvent`, stops `SmartLifecycle` beans in reverse phase order and destroys singletons; `registerShutdownHook()` wires that to the JVM. With Boot, `SpringApplication.run` registers the hook for you — except in a WAR deployment, where the servlet container owns shutdown.",
      "`ConfigurableApplicationContext` is the practical type to hold in non-web code (`close`, `getEnvironment`, `addBeanFactoryPostProcessor`, `addApplicationListener`), while application code should depend on `ApplicationContext` only — or better, on the specific beans it needs.",
      "Interview angle: 'Difference between `BeanFactory` and `ApplicationContext`?' — lazy singleton creation vs `refresh()`-time eager creation, and plain DI vs i18n + events + resources + environment + lifecycle; follow-up 'what does `refresh()` do?' is answered by the eleven steps above."
    ],
    keyPoints: [
      "`ApplicationContext` **is a** `BeanFactory` + `MessageSource` + `ResourceLoader` + `ApplicationEventPublisher` + `EnvironmentCapable` + lifecycle.",
      "Bare `BeanFactory` creates singletons lazily on request; `ApplicationContext` pre-instantiates non-lazy singletons in `refresh()`.",
      "`DefaultListableBeanFactory` is the engine both use — the context delegates to it rather than duplicating it.",
      "`refresh()` order matters: BFPPs → BPPs → message source → multicaster → `onRefresh` (web server) → listeners → instantiate singletons → finishRefresh + `ContextRefreshedEvent`.",
      "Implementations: `AnnotationConfigApplicationContext`, `GenericApplicationContext`, `ClassPathXmlApplicationContext`, Boot's servlet/reactive web contexts.",
      "Parent/child: child sees parent beans for `getBean`, parent never sees the child; autowiring candidates stay effectively within one context.",
      "`close()` → `ContextClosedEvent` → stop `SmartLifecycle` → destroy singletons in reverse dependency order."
    ],
    diagram: {
      type: "hierarchy",
      title: "BeanFactory vs ApplicationContext — the type hierarchy",
      direction: "vertical",
      data: [
        {
          label: "BeanFactory",
          color: "primary",
          children: [
            { label: "ListableBeanFactory — getBeanNamesForType, getBeansOfType" },
            { label: "HierarchicalBeanFactory — parent access" },
            { label: "AutowireCapableBeanFactory — programmatic injection" },
            { label: "ConfigurableListableBeanFactory — + scopes, aliases, singletons" }
          ]
        },
        {
          label: "ApplicationContext (= BeanFactory + enterprise services)",
          color: "accent",
          children: [
            { label: "MessageSource (i18n)" },
            { label: "ResourceLoader / ResourcePatternResolver" },
            { label: "ApplicationEventPublisher" },
            { label: "EnvironmentCapable + Aware processing" },
            { label: "ConfigurableApplicationContext — refresh(), close(), hooks" }
          ]
        },
        {
          label: "DefaultListableBeanFactory — the engine inside both",
          color: "success",
          children: [
            { label: "BeanDefinition registry, singleton caches, BPP chain" }
          ]
        }
      ]
    },
    code: [
      {
        title: "Bare BeanFactory — metadata only, lazy singletons, no events",
        language: "java",
        content: `import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.xml.XmlBeanDefinitionReader;
import org.springframework.core.io.ClassPathResource;

public class PlainBeanFactoryDemo {
    public static void main(String[] args) {
        DefaultListableBeanFactory bf = new DefaultListableBeanFactory();
        new XmlBeanDefinitionReader(bf).loadBeanDefinitions(
                new ClassPathResource("beans.xml"));

        System.out.println("definitions: " + bf.getBeanDefinitionCount());
        // nothing is instantiated yet - the first getBean triggers the lifecycle
        OrderService svc = bf.getBean(OrderService.class);
        System.out.println("created on demand: " + svc);

        bf.destroySingletons();     // you manage shutdown yourself
    }
}`
      },
      {
        title: "ApplicationContext — eager singletons, events, messages",
        language: "java",
        content: `import org.springframework.context.ApplicationEvent;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
class WarmUp {
    @EventListener
    void onStartup(ApplicationEvent event) {
        if (event instanceof ContextRefreshedEvent) {
            System.out.println("context refreshed - all singletons exist");
        }
    }
}

public class ContextDemo {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext ctx =
                new AnnotationConfigApplicationContext("com.shop");   // scans + refreshes

        System.out.println("eager singletons: " + ctx.getBeanDefinitionCount());
        System.out.println("message: " + ctx.getMessage("welcome", null, "en"));
        ctx.publishEvent(new ShopOpenedEvent("shop-1"));
        ctx.close();                 // destroy + ContextClosedEvent
    }

    record ShopOpenedEvent(String id) { }
}`
      }
    ],
    note: "`ApplicationContext` does not replace the `BeanFactory` — `AbstractApplicationContext` **creates and delegates to** a `DefaultListableBeanFactory`, so all the resolution logic you read about lives in one class either way.",
    tip: "Set `spring.main.web-application-type=none` to get a plain `AnnotationConfigApplicationContext` in Boot when you build a CLI or a batch job — no embedded server, no servlet scopes registered.",
    warning: "Because `refresh()` pre-instantiates singletons, any exception inside a bean's constructor, `@PostConstruct` or a `Condition` stops the **entire application**. Boot logs the failing bean during context startup — read the first error, not the last."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-postprocessor",
    title: "BeanPostProcessor & BeanFactoryPostProcessor",
    difficulty: "Expert",
    theory: [
      "These two interfaces are Spring's **extension seams**: a `BeanFactoryPostProcessor` (BFPP) rewrites bean **definitions** before instantiation, while a `BeanPostProcessor` (BPP) intercepts every bean **instance** around its initialisation. Almost every Spring feature you use is one of the two.",
      "`BeanFactoryPostProcessor.postProcessBeanFactory(ConfigurableListableBeanFactory)` can add, remove or mutate `BeanDefinition`s — Boot's `ApplicationContext` uses it for placeholder resolution, `PropertySourcesPlaceholderConfigurer` rewrites property values, and `@ConfigurationClassBeanDefinitionReader` style processing all happen here.",
      "`BeanDefinitionRegistryPostProcessor` (a BFPP sub-interface) runs **earlier still**, in `postProcessBeanDefinitionRegistry`, and may register further definitions — that is where `ConfigurationClassPostProcessor` parses every `@Configuration` class, follows `@Import`/`@ComponentScan`/`@Bean` and registers the resulting definitions; `MapperScannerConfigurer` in MyBatis and Boot's `AutoConfigurationImportSelector` (via `@Import`) live in the same space.",
      "Invocation order inside `invokeBeanFactoryPostProcessors`: manually-added `BeanDefinitionRegistryPostProcessor`s, then `PriorityOrdered` registry processors, then `Ordered`, then the rest, and only after that `postProcessBeanFactory` on BFPPs in the same three-order waves. A `BeanFactoryPostProcessor` that returns a modified definition therefore still sees `@Conditional` and profile decisions already made.",
      "`BeanPostProcessor` has two callbacks — `postProcessBeforeInitialization(Object bean, String beanName)` and `postProcessAfterInitialization(...)` — and is invoked per bean, per creation, in a chain registered by `registerBeanPostProcessors` sorted as `PriorityOrdered`, `Ordered`, then unordered, with `MergedBeanDefinitionPostProcessor` and `DestructionAwareBeanPostProcessor` specialisations participating in the same list.",
      "The specialised BPP sub-interfaces explain the lifecycle precisely: `InstantiationAwareBeanPostProcessor` adds `postProcessBeforeInstantiation` (can short-circuit creation entirely by returning a proxy) and `postProcessProperties`/`postProcessPropertyValues` (where `@Autowired`, `@Value`, `@Resource` are applied); `SmartInstantiationAwareBeanPostProcessor` adds `getInstantiationSuppliers`, `predictBeanType` and `getEarlyBeanReference` (the early-proxy hook used to break setter cycles); `DestructionAwareBeanPostProcessor` implements `@PostConstruct`/`@PreDestroy` (`InitDestroyAnnotationBeanPostProcessor`).",
      "Feature map to memorise: `ConfigurationClassPostProcessor` (BFPP/BDRPP) → `PropertySourcesPlaceholderConfigurer` (BFPP) → `AutowiredAnnotationBeanPostProcessor`, `CommonAnnotationBeanPostProcessor`, `PersistenceAnnotationBeanPostProcessor` (BPPs for injection/translation) → `AnnotationAwareAspectJAutoProxyCreator`, `AsyncAnnotationBeanPostProcessor`, `InfrastructureAdvisorAutoProxyCreator` (BPPs that return proxies) → `ApplicationListenerDetector`, `ApplicationContextAwareProcessor` (BPPs with side effects).",
      "Registering them correctly is the part people get wrong: a BPP or BFPP declared with `@Bean` **inside a `@Configuration` class that also uses `@Autowired`** should be declared as a **`static` @Bean method**, otherwise Spring instantiates the configuration class too early, logs 'not eligible for getting processed by all BeanPostProcessors' and some of your own annotations silently stop working.",
      "A BPP returning a different object changes what the container publishes — but the original reference may still circulate in an early-singleton injection, which is why AOP uses `getEarlyBeanReference` to produce the same proxy once. A BFPP must never touch bean **instances** (only definitions), because calling `getBean` there defeats the whole ordering and produces premature-initialisation bugs.",
      "Other lifecycle hooks in the same family: `SmartInitializingSingleton.afterSingletonsInstantiated()` (iterate finished beans — how `@Scheduled` registration and `@EventListener` method collection are finalised), `ApplicationListener`/`@EventListener` for `ContextRefreshedEvent`/`ApplicationReadyEvent`, and `InitializingBean`/`DisposableBean` for per-bean callbacks.",
      "Costs and risks: every BPP is called for **every** bean, so a chain of dozens of custom post-processors measurably slows startup and can make profiling confusing; a throwing BFPP aborts startup with `BeanCreationException`, and exceptions inside `postProcessAfterInitialization` are attributed to the bean being created, not to your processor — put the bean name into your exception messages.",
      "Boot 3/AOT specifics: in a native image, reflection-driven post-processing is replaced by generated code (`BeanRegistrationAotProcessor`, `BeanFactoryInitializationAotProcessor`), so a custom processor that scans the classpath at runtime needs an AOT hint or it will simply not run.",
      "Comparison of the alternatives: a `FactoryBean` customises **what object one bean is**, a BPP customises **how every bean is processed**, a BFPP customises **which beans exist** — and CDI's portable extensions or Jakarta Interceptors solve the same problems at the spec level with less power per line."
    ],
    keyPoints: [
      "BFPP = rewrite **definitions** before any instantiation; BPP = intercept every **instance** around init.",
      "`BeanDefinitionRegistryPostProcessor` runs before BFPP; `ConfigurationClassPostProcessor` is the main one (`PriorityOrdered`).",
      "Order in both cases: `PriorityOrdered` → `Ordered` → unordered; manual ones first for BFPPs.",
      "`@Autowired`/`@Value` are applied by `InstantiationAwareBeanPostProcessor.postProcessProperties`.",
      "AOP proxies come from `postProcessAfterInitialization`; early proxies from `getEarlyBeanReference`.",
      "`@Bean` methods returning a BPP/BFPP should be **`static`** to avoid premature configuration-class initialisation.",
      "`@PostConstruct`/`@PreDestroy` are handled by `InitDestroyAnnotationBeanPostProcessor` (a `DestructionAwareBeanPostProcessor`).",
      "`SmartInitializingSingleton.afterSingletonsInstantiated()` = the safe 'whole graph exists' hook."
    ],
    table: {
      headers: ["Aspect", "BeanFactoryPostProcessor", "BeanPostProcessor"],
      rows: [
        ["Operates on", "BeanDefinition metadata", "bean instances"],
        ["When", "bean-definition phase, before any bean exists", "around each bean's init, per instance"],
        ["Can", "add/remove/rename definitions, rewrite values, set flags", "wrap, proxy, inject, validate, reject"],
        ["Sees other beans", "must not (breaks ordering)", "yes, but lazily — beware cycles"],
        ["Sub-interfaces", "BeanDefinitionRegistryPostProcessor", "InstantiationAware / Smart / Merged / DestructionAware"],
        ["Failure impact", "aborts context startup", "aborts that bean (and often startup)"],
        ["Example in Spring", "PropertySourcesPlaceholderConfigurer", "AnnotationAwareAspectJAutoProxyCreator"]
      ]
    },
    code: [
      {
        title: "A BeanFactoryPostProcessor that rewrites definitions",
        language: "java",
        content: `import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.core.Ordered;
import org.springframework.core.PriorityOrdered;
import org.springframework.stereotype.Component;

/**
 * Forces every bean in the com.shop.report package to be lazy so that
 * startup does not pay for reports nobody opened. Definitions only -
 * no getBean() calls, which would defeat the ordering guarantees.
 */
@Component
public class LazyReportPostProcessor implements BeanFactoryPostProcessor, PriorityOrdered {

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory bf) throws BeansException {
        for (String name : bf.getBeanDefinitionNames()) {
            BeanDefinition bd = bf.getBeanDefinition(name);
            String className = bd.getBeanClassName();
            if (className != null && className.startsWith("com.shop.report.")) {
                bd.setLazyInit(true);
                bd.setAttribute("lazy-by-postprocessor", Boolean.TRUE);
            }
        }
    }

    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}`
      },
      {
        title: "A BeanPostProcessor that wraps and validates beans",
        language: "java",
        content: `import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import java.lang.reflect.Proxy;
import java.util.concurrent.atomic.LongAdder;

/** Times every bean that implements Timed and rejects misconfigured ones. */
@Component
public class TimedBeanPostProcessor implements BeanPostProcessor {

    private final LongAdder created = new LongAdder();

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName)
            throws BeansException {
        if (bean instanceof Validatable v) {
            v.validateConfiguration();       // fail fast with the bean name in the message
        }
        return bean;                         // returning null would abort the lifecycle
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName)
            throws BeansException {
        created.increment();
        if (!(bean instanceof Timed) || !bean.getClass().isInterface()) {
            // JDK proxy only for interface-based Timed beans; use CGLIB otherwise
            for (Class<?> iface : bean.getClass().getInterfaces()) {
                if (iface == Timed.class) {
                    return Proxy.newProxyInstance(
                            bean.getClass().getClassLoader(),
                            bean.getClass().getInterfaces(),
                            (proxy, method, args) -> {
                                long start = System.nanoTime();
                                try { return method.invoke(bean, args); }
                                finally {
                                    System.out.println(beanName + "." + method.getName()
                                            + " took " + (System.nanoTime() - start) + "ns");
                                }
                            });
                }
            }
        }
        return bean;
    }
}`
      },
      {
        title: "Registering post-processors the safe way — static @Bean",
        language: "java",
        content: `import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.InstantiationAwareBeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class InfrastructureConfig {

    private final MetricsRegistry metrics;      // ordinary injected collaborator

    public InfrastructureConfig(MetricsRegistry metrics) { this.metrics = metrics; }

    // static: instantiated before this configuration class, so the config class
    // itself is still eligible for full BPP processing (@Autowired, @Value, AOP)
    @Bean
    static BeanFactoryPostProcessor lazyAll() {
        return bf -> { for (String n : bf.getBeanDefinitionNames())
                           bf.getBeanDefinition(n).setLazyInit(true); };
    }

    // non-static here would force early creation of InfrastructureConfig and
    // the metrics collaborator would miss the post-processor chain -> the log
    // line "Bean ... is not eligible for getting processed by all BPPs"
    @Bean
    static InstantiationAwareBeanPostProcessor auditTrail() {
        return new AuditTrailPostProcessor();
    }
}`
      }
    ],
    note: "You can inspect the real chain at runtime: `((ConfigurableApplicationContext) ctx).getBeanFactory().getBeanPostProcessors()` returns the registered BPPs **in call order**, which is the fastest way to understand why one of your beans is wrapped twice.",
    tip: "Prefer `SmartInitializingSingleton` or an `@EventListener(ContextRefreshedEvent.class)` over a BFPP when you merely want to *look at* finished beans — post-processors are for changing the graph, not reporting on it.",
    warning: "Never call `beanFactory.getBean(...)` from a `BeanFactoryPostProcessor`: you force early instantiation, that bean skips the rest of the post-processor chain, and the resulting bug (proxies missing, `@Autowired` ignored) is extremely hard to trace back."
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "spring-spel",
    title: "SpEL — Spring Expression Language",
    difficulty: "Hard",
    theory: [
      "**SpEL** (`spring-expression`, package `org.springframework.expression`) is a runtime expression language: `ExpressionParser parser = new SpelExpressionParser(); Expression exp = parser.parseExpression(\"name.length() > 3\"); Boolean b = exp.getValue(ctx, Boolean.class);` — it is standalone and usable with or without the container.",
      "The three collaborating types are the **parser** (`SpelExpressionParser`), the **expression** (`Expression`, immutable and worth caching because parsing is the expensive step) and the **evaluation context** (`EvaluationContext`, which supplies root object, variables, property accessors, type locator, bean resolver and conversion service).",
      "Syntax highlights: literals (`4.5e3`, `'text'`, `true`, `null`), arithmetic/comparison/logical operators, relational string functions, property access `person.address.city`, method calls, constructors with `new java.awt.Point(1, 2)`, array/list/map construction `{1,2,3}` and `{'a':1,'b':2}`, **safe navigation** `a?.b?.c`, the **elvis** operator `x ?: 'default'`, ternary, `instanceof`, `T(java.util.Collections).emptyList()` for static types/members, and regex with `matches`.",
      "Collection power is what makes it worth learning: **selection** `customers.?[balance > 1000]` (with `^` for first and `$` for last), **projection** `customers.![name]`, nested combinations `customers.![orders.?[status == 'OPEN']].!flatten()`, and indexing `list[0]`, `map['key']`.",
      "Inside bean definitions, XML `value=\"#{...}\"` and `@Value(\"#{...}\")` go through `StandardBeanExpressionResolver`, whose root object is a small `BeanExpressionContext` accessor and whose variables include `_beanName`, `_context`, plus the registered `environment`, `systemProperties` and `systemEnvironment`. The `beanResolver` lets `#{ @pricingService.rate }` reference other beans by name.",
      "`${...}` and `#{...}` are **not** interchangeable: `${}` is a property placeholder resolved textually by `PropertySourcesPlaceholderConfigurer` during the definition phase, `#{}` is evaluated by SpEL during bean creation, so only `#{}` can call methods, do arithmetic or reference beans — and `#{ \${some.property} }` is the legal way to feed a property into an expression.",
      "`SimpleEvaluationContext` versus `StandardEvaluationContext` is the security boundary. `Standard` enables type references, constructors and arbitrary method invocation, so evaluating an attacker-controlled string gives remote code execution through `T(java.lang.Runtime).getRuntime().exec(...)`; `SimpleEvaluationContext.forReadOnlyDataBinding()` restricts the expression to bean property reads with no type locator or bean resolver.",
      "Where SpEL is used across the ecosystem: `@Value`, XML `<property value>`, `@PreAuthorize(\"hasRole('ADMIN') and #id == authentication.name\")` and `@PostAuthorize` (evaluated on **every** invocation, against a `MethodSecurityEvaluationContext` exposing `#root.args`, `#parameterName`, `authentication`, `principal`), `@Cacheable(key = \"#p0\")` and `@CacheEvict(key = \"#user.id\")`, Spring Integration/IP header expressions, Spring Batch `#{stepExecution.reader.count}`, Spring Data's `@EntityFilters`-style extensions, and Thymeleaf's Spring dialect.",
      "Compilation and caching: parse once and reuse the `Expression`; with `new SpelParserConfiguration(SpelCompilerMode.IMMEDIATE, getClass().getClassLoader())` hot expressions are compiled to bytecode after a few interpretations, which matters for `@Cacheable` keys on high-throughput paths and is disabled by default (`OFF`) because mixed-mode compilation can throw `SpelEvaluationException` on unsupported constructs.",
      "Error handling distinguishes phases: `SpelParseException` at parse time (a syntax error, thrown when the definition is evaluated — often at startup for `@Value`), `SpelEvaluationException` at run time (missing property, null root, bad conversion), and `AccessException`/`EvaluationException` subclasses; `ExpressionState` types are checked against the requested result type via the `TypeConverter`.",
      "Practical limits: `@Profile` values are `Profiles.of` expressions, **not** SpEL; `@ConditionalOnProperty` takes plain strings; and SpEL cannot be used where the annotation attribute must be a compile-time constant. Keep expressions side-effect free — a `#{someBean.mutate()}` in a definition is untestable and surprises everyone reading the code.",
      "Comparison: Java's own mechanisms (Stream/`Predicate`, or the deprecated `ScriptEngine`/Nashorn path) are static and require recompiling, Jakarta EL is the standardised JSP/Bean-Validation cousin with weaker Java integration, and MVEL/Aviator are faster but outside the Spring object model. SpEL's niche is 'a safe-ish, Spring-aware mini-language inside metadata'.",
      "Interview angle: 'Difference between `${}` and `#{}`', 'how do you reference a bean inside SpEL' (`@beanName` with the bean resolver available in the container context), and the security one — 'why would you never use `StandardEvaluationContext` on user input?'"
    ],
    keyPoints: [
      "Three types: `ExpressionParser` → `Expression` → `EvaluationContext` (root object + variables + accessors).",
      "`${}` = property placeholder (definition phase, textual); `#{}` = SpEL (creation phase, evaluated).",
      "Container variables: `environment`, `systemProperties`, `systemEnvironment`, `_beanName`, `_context`; `@beanName` references beans.",
      "Operators: `?.` safe navigation, `?:` elvis, `T()` static types, `new`, `instanceof`, `matches`, ternary.",
      "Selection `?[ ... ]` (with `^`/`$`), projection `![ ... ]`, `!flatten()` for nested lists.",
      "`SimpleEvaluationContext` for anything user-supplied — `StandardEvaluationContext` allows `T(Runtime)` = RCE.",
      "Compile with `SpelParserConfiguration(SpelCompilerMode.IMMEDIATE, ...)` and cache `Expression` objects for hot paths.",
      "Used by `@Value`, `@PreAuthorize`, `@Cacheable(key=...)`, Spring Batch/Integration, Thymeleaf."
    ],
    table: {
      headers: ["Construct", "Example", "Evaluates to"],
      rows: [
        ["property access", "customer.name", "the getter result"],
        ["safe navigation", "customer.address?.city", "null instead of NPE"],
        ["elvis / ternary", "name ?: 'anonymous'", "'anonymous' when null"],
        ["static type", "T(Math).max(a, b)", "static method call"],
        ["constructor", "new java.util.Date()", "a new Date"],
        ["selection", "orders.?[total > 100]", "filtered list"],
        ["first / last selection", "orders.^[total > 100] / orders.$[...]", "first / last match"],
        ["projection", "orders.![id]", "list of ids"],
        ["indexing", "list[0], map['k']", "element / entry"],
        ["bean reference", "@pricingService.rate", "another bean's property"],
        ["regex", "ssn matches '\\\\d{3}-\\\\d{2}-\\\\d{4}'", "boolean"]
      ]
    },
    code: [
      {
        title: "SpEL standalone — the language without the container",
        language: "java",
        content: `import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.SpelParserConfiguration;
import org.springframework.expression.spel.SpelCompilerMode;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import java.util.List;

public class SpelDemo {
    record Customer(String name, int balance, List<String> tags) { }

    public static void main(String[] args) {
        // parse once, evaluate many - compilation after a few interpretations
        ExpressionParser parser = new SpelExpressionParser(
                new SpelParserConfiguration(SpelCompilerMode.IMMEDIATE, null));

        List<Customer> customers = List.of(
                new Customer("Ada", 4200, List.of("vip", "eu")),
                new Customer("Bo", 120, List.of("eu")),
                new Customer("Cy", 900, List.of("vip")));

        Expression names = parser.parseExpression(
                "![name].?[#this.startsWith('A')]");          // projection then selection
        StandardEvaluationContext ctx = new StandardEvaluationContext(customers);
        ctx.setVariable("threshold", 500);

        System.out.println(names.getValue(ctx));              // [Ada]
        System.out.println(parser.parseExpression(
                "?[balance > #threshold].![name]")
                .getValue(ctx, List.class));                  // [Ada, Cy]
        System.out.println(parser.parseExpression(
                "^[balance > 1000].name").getValue(ctx));      // Ada  (first match)

        // Safe by construction: read-only property access, no T(), no bean resolver
        Expression readOnly = parser.parseExpression("name.length()");
        System.out.println(readOnly.getValue(
                SimpleEvaluationContext.forReadOnlyDataBinding()
                        .withRootObject(customers.get(0)), Integer.class)); // 3
    }
}`
      },
      {
        title: "SpEL inside the container — @Value and method security/caching",
        language: "java",
        content: `import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReportService {

    private final String envName;
    private final int workers;
    private final List<String> regions;
    private final LocalDate built;

    public ReportService(
            @Value("\${spring.application.name}") String envName,          // placeholder
            @Value("#{ systemEnvironment['SHOP_WORKERS'] ?: 4 }") int workers, // SpEL + elvis
            @Value("#\{ \${shop.regions:eu,us} \}") List<String> regions,  // property into SpEL
            @Value("#{ T(java.time.LocalDate).parse('2026-01-01') }") LocalDate built) {
        this.envName = envName;
        this.workers = workers;
        this.regions = regions;
        this.built = built;
    }

    @Cacheable(cacheNames = "reports", key = "#reportId + '-' + #regions.^[size() > 0]")
    @PreAuthorize("hasRole('REPORT_VIEWER') and #workers >= authentication.principal.quota")
    public Report build(String reportId) {
        return new Report(envName, built);
    }

    record Report(String owner, LocalDate built) { }
}`
      }
    ],
    note: "SpEL is independent of DI: `spring-expression` has no dependency on `spring-beans`, so you can (and occasionally should) use it as a general-purpose, JVM-native mini-language for user-defined rules and filters.",
    tip: "Cache `Expression` objects in a `ConcurrentHashMap` keyed by the source string, or enable `SpelCompilerMode.MIXED`; re-parsing the same literal on every call is the usual SpEL performance complaint in `@Cacheable` hot paths.",
    warning: "Never build a SpEL string from untrusted input and evaluate it with `StandardEvaluationContext` — `T(java.lang.Runtime).getRuntime().exec(...)` makes that a remote-code-execution bug. Use `SimpleEvaluationContext` for read/write data binding, or parameterise instead of interpreting."
  },

];

/* -- end of springCoreContent: 14 sections (IoC, DI, lifecycle, scopes,
      autowiring, configuration, scanning, profiles, @Value, contexts,
      post-processors, SpEL) -- */

export const springCoreContent: ContentSection[] = attachDiagrams(
  springCoreRaw,
  springCoreVisualizations,
);


