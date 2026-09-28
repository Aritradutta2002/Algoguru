/**
 * The annotation reference catalogue.
 *
 * Every annotation a 3–4 year Java / Spring Boot engineer is expected to know,
 * with what it does, how it works internally, a minimal example and the trap
 * that gets asked about in interviews.
 *
 * Grouped by `ANNOTATION_CATEGORIES` (order matters — it is the render order).
 */

export interface AnnotationCategory {
  id: string;
  title: string;
  icon: string;
  blurb: string;
}

export interface AnnotationEntry {
  /** Display name including the `@`. */
  name: string;
  /** Category id from `ANNOTATION_CATEGORIES`. */
  category: string;
  /** Where it may be placed, in plain words. */
  target: string;
  /** One line: what it is for. */
  purpose: string;
  /** How the compiler / container / framework actually processes it. */
  howItWorks: string;
  /** Minimal, realistic snippet. */
  example: string;
  /** The trap, the misconception, or the production failure mode. */
  gotcha?: string;
  /** Version it arrived in, when that is worth knowing. */
  since?: string;
  /** Question ids in the bank that go deeper. */
  relatedQuestionIds?: string[];
}

export const ANNOTATION_CATEGORIES: AnnotationCategory[] = [
  {
    id: "java-builtin",
    title: "Java Built-in Annotations",
    icon: "☕",
    blurb: "The handful that live in java.lang and are processed by the compiler itself.",
  },
  {
    id: "java-meta",
    title: "Meta-Annotations",
    icon: "🧬",
    blurb: "The annotations you put on your own annotations — the machinery every framework builds on.",
  },
  {
    id: "spring-stereotype",
    title: "Spring Stereotypes",
    icon: "🌱",
    blurb: "Class-level markers that turn a plain class into a managed bean.",
  },
  {
    id: "spring-di",
    title: "Dependency Injection & Wiring",
    icon: "🔌",
    blurb: "How the container selects, orders and injects collaborators.",
  },
  {
    id: "spring-config",
    title: "Configuration & Conditions",
    icon: "⚙️",
    blurb: "Bean definitions, property binding, profiles and conditional auto-configuration.",
  },
  {
    id: "spring-boot",
    title: "Spring Boot",
    icon: "🚀",
    blurb: "Bootstrapping, auto-configuration and the annotations unique to Boot.",
  },
  {
    id: "spring-web",
    title: "Spring MVC / REST",
    icon: "🌐",
    blurb: "Request mapping, binding, content negotiation and error handling.",
  },
  {
    id: "spring-tx",
    title: "Transactions & AOP",
    icon: "🔁",
    blurb: "Declarative transactions and the aspect model they are built on.",
  },
  {
    id: "spring-async",
    title: "Async, Scheduling, Caching & Resilience",
    icon: "⏱️",
    blurb: "Everything that puts work on another thread, a timer, or behind a cache or breaker.",
  },
  {
    id: "spring-data",
    title: "Spring Data & JPA",
    icon: "🗄️",
    blurb: "Repository queries, auditing, locking and fetch control.",
  },
  {
    id: "jpa-mapping",
    title: "Jakarta Persistence Mapping",
    icon: "🧩",
    blurb: "Entity, identity, relationship and inheritance mapping.",
  },
  {
    id: "validation",
    title: "Bean Validation",
    icon: "✅",
    blurb: "Declarative constraints and where they are actually enforced.",
  },
  {
    id: "spring-security",
    title: "Spring Security",
    icon: "🔐",
    blurb: "Enabling the filter chain and expressing authorization rules in code.",
  },
  {
    id: "testing",
    title: "Testing",
    icon: "🧪",
    blurb: "Slices, mocks, JUnit 5 lifecycle and security test support.",
  },
  {
    id: "jackson",
    title: "Jackson / JSON",
    icon: "📦",
    blurb: "Controlling exactly what the wire format looks like.",
  },
  {
    id: "lombok",
    title: "Lombok",
    icon: "🪄",
    blurb: "Compile-time code generation — convenient, and the source of several classic bugs.",
  },
];

export const ANNOTATION_CATALOGUE: AnnotationEntry[] = [
  /* ---------------------------------------------------------------- */
  /* Java built-in                                                     */
  /* ---------------------------------------------------------------- */
  {
    name: "@Override",
    category: "java-builtin",
    target: "Method",
    purpose: "Asserts that the method overrides a supertype method.",
    howItWorks:
      "SOURCE retention — it never reaches the class file. The compiler verifies the signature genuinely overrides or implements something and fails the build otherwise. It catches typos and signature drift when a superclass changes.",
    example: "@Override\npublic boolean equals(Object other) { ... }",
    gotcha:
      "Since Java 6 it is also valid on interface implementations. Omitting it on equals/hashCode is how `equals(MyType)` silently overloads instead of overriding.",
    relatedQuestionIds: ["b001", "b051"],
  },
  {
    name: "@Deprecated",
    category: "java-builtin",
    target: "Any declaration",
    purpose: "Marks an API as discouraged.",
    howItWorks:
      "RUNTIME retention, so it is visible reflectively and to tooling. Java 9 added `since` and `forRemoval`; `forRemoval = true` upgrades the compiler note to a stronger warning.",
    example: '@Deprecated(since = "3.2", forRemoval = true)\npublic void oldApi() { }',
    gotcha:
      "Pair it with `@deprecated` in Javadoc explaining the replacement — the annotation alone tells callers nothing about what to use instead.",
    relatedQuestionIds: ["b009"],
  },
  {
    name: "@SuppressWarnings",
    category: "java-builtin",
    target: "Any declaration",
    purpose: "Silences named compiler warnings.",
    howItWorks:
      "SOURCE retention. Common values are `unchecked`, `rawtypes`, `deprecation`, `serial`, `this-escape`. Applies to the annotated element and everything inside it.",
    example: '@SuppressWarnings("unchecked")\nList<String> values = (List<String>) raw;',
    gotcha:
      "Apply it to the narrowest scope possible — a local variable, not a class. A class-level suppression hides real problems for years.",
    relatedQuestionIds: ["b009", "b063"],
  },
  {
    name: "@FunctionalInterface",
    category: "java-builtin",
    target: "Interface",
    purpose: "Declares an interface as having exactly one abstract method.",
    howItWorks:
      "SOURCE retention. The compiler fails the build if the interface has zero or more than one abstract method. It is documentation enforced by the compiler; lambdas work without it.",
    example: "@FunctionalInterface\ninterface Validator { boolean test(String input); }",
    gotcha:
      "`default` and `static` methods do not count, and neither do public methods of Object such as `equals` or `toString`.",
    since: "Java 8",
    relatedQuestionIds: ["b009"],
  },
  {
    name: "@SafeVarargs",
    category: "java-builtin",
    target: "static / final / private method, constructor",
    purpose: "Suppresses heap-pollution warnings for a generic varargs method.",
    howItWorks:
      "Asserts that the method does not store anything unsafe into the varargs array or expose it. The compiler cannot prove it; you are taking responsibility.",
    example: "@SafeVarargs\nstatic <T> List<T> listOf(T... items) { return List.of(items); }",
    gotcha:
      "Only allowed on methods that cannot be overridden. Lying about it reintroduces the `ArrayStoreException`/`ClassCastException` it was meant to prevent.",
    since: "Java 7",
    relatedQuestionIds: ["b063"],
  },
  {
    name: "@Serial",
    category: "java-builtin",
    target: "Field, Method",
    purpose: "Validates serialization-related members.",
    howItWorks:
      "SOURCE retention. The compiler checks that `serialVersionUID`, `writeObject`, `readObject`, `readResolve` and friends have exactly the right signature — a class of bug that used to fail silently at runtime.",
    example: "@Serial\nprivate static final long serialVersionUID = 1L;",
    since: "Java 14",
  },

  /* ---------------------------------------------------------------- */
  /* Meta-annotations                                                  */
  /* ---------------------------------------------------------------- */
  {
    name: "@Retention",
    category: "java-meta",
    target: "Annotation type",
    purpose: "Decides how long the annotation survives.",
    howItWorks:
      "SOURCE means it is discarded after compilation; CLASS (the default) writes it into the class file as RuntimeInvisibleAnnotations but hides it from reflection; RUNTIME writes it as RuntimeVisibleAnnotations so `getAnnotation` can find it.",
    example: "@Retention(RetentionPolicy.RUNTIME)\npublic @interface Audited { }",
    gotcha:
      "The default is CLASS, not RUNTIME. Forgetting `@Retention(RUNTIME)` is the single most common reason a custom annotation is silently ignored by a framework.",
    relatedQuestionIds: ["b002"],
  },
  {
    name: "@Target",
    category: "java-meta",
    target: "Annotation type",
    purpose: "Restricts where the annotation may be placed.",
    howItWorks:
      "Takes ElementType values: TYPE, FIELD, METHOD, PARAMETER, CONSTRUCTOR, LOCAL_VARIABLE, ANNOTATION_TYPE, PACKAGE, TYPE_PARAMETER, TYPE_USE, MODULE, RECORD_COMPONENT. The compiler enforces it.",
    example: "@Target({ElementType.METHOD, ElementType.TYPE})\npublic @interface Audited { }",
    gotcha:
      "Omitting @Target allows it almost everywhere except TYPE_USE contexts. TYPE_USE (Java 8) is what makes `List<@NonNull String>` possible.",
    relatedQuestionIds: ["b003", "b012"],
  },
  {
    name: "@Documented",
    category: "java-meta",
    target: "Annotation type",
    purpose: "Includes the annotation in generated Javadoc.",
    howItWorks: "Purely a Javadoc tool directive; it has no runtime effect whatsoever.",
    example: "@Documented\n@Retention(RetentionPolicy.RUNTIME)\npublic @interface Audited { }",
  },
  {
    name: "@Inherited",
    category: "java-meta",
    target: "Annotation type",
    purpose: "Makes a class-level annotation visible on subclasses.",
    howItWorks:
      "Affects only `Class.getAnnotation`, and only for annotations on classes. It walks up the superclass chain.",
    example: "@Inherited\n@Retention(RetentionPolicy.RUNTIME)\npublic @interface Auditable { }",
    gotcha:
      "It does NOT work for interfaces, methods or fields. Spring sidesteps the limitation entirely with `AnnotatedElementUtils`/`MergedAnnotations`, which is why Spring's own meta-annotations behave more intuitively.",
    relatedQuestionIds: ["b011"],
  },
  {
    name: "@Repeatable",
    category: "java-meta",
    target: "Annotation type",
    purpose: "Allows the same annotation more than once on one element.",
    howItWorks:
      "You declare a container annotation holding an array, and the compiler automatically wraps repeated uses into it. `getAnnotationsByType` unwraps them again.",
    example:
      "@Repeatable(Schedules.class)\npublic @interface Schedule { String cron(); }\n\n@Schedule(cron = \"0 0 * * * *\")\n@Schedule(cron = \"0 30 * * * *\")\nvoid job() { }",
    gotcha:
      "`getAnnotation(Schedule.class)` returns null when it was used twice — the compiler replaced them with the container. Always use `getAnnotationsByType`.",
    since: "Java 8",
    relatedQuestionIds: ["b007"],
  },
  {
    name: "@AliasFor",
    category: "java-meta",
    target: "Annotation attribute (Spring)",
    purpose: "Declares two attributes as synonyms, within or across annotations.",
    howItWorks:
      "Spring's `MergedAnnotations` engine resolves the aliases when it reads the annotation, which is how `@RestController`'s `value` maps to `@Component`'s `value` and how `@GetMapping(\"/x\")` is really `@RequestMapping(path = \"/x\")`.",
    example: '@RequestMapping(method = RequestMethod.GET)\npublic @interface GetMapping {\n    @AliasFor(annotation = RequestMapping.class) String[] path() default {};\n}',
    gotcha: "It is a Spring feature, not a Java one — plain reflection sees the raw attributes.",
    relatedQuestionIds: ["b004"],
  },

  /* ---------------------------------------------------------------- */
  /* Spring stereotypes                                                */
  /* ---------------------------------------------------------------- */
  {
    name: "@Component",
    category: "spring-stereotype",
    target: "Class",
    purpose: "Marks a class as a candidate for component scanning.",
    howItWorks:
      "`ClassPathBeanDefinitionScanner` finds it via ASM class-file scanning (no class loading), registers a `BeanDefinition`, and the bean name defaults to the decapitalised simple class name.",
    example: "@Component\npublic class PriceCalculator { }",
    gotcha:
      "Only found if the class is inside a scanned package. Boot scans the package of the `@SpringBootApplication` class and below — a component in a sibling package is silently absent.",
    relatedQuestionIds: ["b018", "b019"],
  },
  {
    name: "@Service",
    category: "spring-stereotype",
    target: "Class",
    purpose: "A @Component that marks business logic.",
    howItWorks:
      "Technically identical to @Component today. Its value is intent-revealing naming and giving AOP pointcuts something semantic to match on.",
    example: "@Service\npublic class OrderService { }",
    relatedQuestionIds: ["b019"],
  },
  {
    name: "@Repository",
    category: "spring-stereotype",
    target: "Class",
    purpose: "A @Component for persistence, with exception translation.",
    howItWorks:
      "`PersistenceExceptionTranslationPostProcessor` proxies @Repository beans and converts provider-specific exceptions (Hibernate, JDBC vendor codes) into Spring's `DataAccessException` hierarchy.",
    example: "@Repository\npublic class JdbcOrderRepository { }",
    gotcha:
      "This is the one stereotype with real extra behaviour. Spring Data repositories get it automatically, so you do not annotate those interfaces.",
    relatedQuestionIds: ["b019"],
  },
  {
    name: "@Controller",
    category: "spring-stereotype",
    target: "Class",
    purpose: "A @Component handling web requests and returning view names.",
    howItWorks:
      "`RequestMappingHandlerMapping` scans @Controller beans for @RequestMapping methods. Return values are resolved as view names unless the method is annotated @ResponseBody.",
    example: '@Controller\npublic class PageController {\n    @GetMapping("/home") String home() { return "home"; }\n}',
    relatedQuestionIds: ["b028"],
  },
  {
    name: "@RestController",
    category: "spring-stereotype",
    target: "Class",
    purpose: "@Controller + @ResponseBody on every method.",
    howItWorks:
      "A composed annotation. Return values go through `HttpMessageConverter`s (Jackson for JSON) instead of view resolution.",
    example: '@RestController\n@RequestMapping("/api/orders")\npublic class OrderController { }',
    relatedQuestionIds: ["b028"],
  },
  {
    name: "@ControllerAdvice",
    category: "spring-stereotype",
    target: "Class",
    purpose: "Cross-cutting handlers shared by many controllers.",
    howItWorks:
      "Holds @ExceptionHandler, @InitBinder and @ModelAttribute methods applied globally. Can be narrowed with `basePackages`, `assignableTypes` or `annotations`.",
    example:
      "@ControllerAdvice\npublic class GlobalExceptionHandler {\n    @ExceptionHandler(NotFoundException.class)\n    ResponseEntity<?> handle(NotFoundException e) { ... }\n}",
    gotcha:
      "It cannot see exceptions thrown inside servlet filters — including the whole Spring Security filter chain.",
    relatedQuestionIds: ["b033", "b119"],
  },
  {
    name: "@RestControllerAdvice",
    category: "spring-stereotype",
    target: "Class",
    purpose: "@ControllerAdvice + @ResponseBody.",
    howItWorks: "Handler return values are serialised to the response body — the usual choice for REST APIs.",
    example:
      "@RestControllerAdvice\npublic class ApiExceptionHandler {\n    @ExceptionHandler(Exception.class)\n    ProblemDetail handle(Exception e) { ... }\n}",
    relatedQuestionIds: ["b033"],
  },
  {
    name: "@Configuration",
    category: "spring-stereotype",
    target: "Class",
    purpose: "Declares a class as a source of @Bean definitions.",
    howItWorks:
      "By default `proxyBeanMethods = true`, so Spring CGLIB-subclasses the class and intercepts @Bean method calls, returning the singleton instead of executing the method again.",
    example:
      "@Configuration\npublic class AppConfig {\n    @Bean DataSource dataSource() { ... }\n}",
    gotcha:
      "Set `proxyBeanMethods = false` (lite mode) for faster startup — but then calling one @Bean method from another creates a NEW instance rather than returning the singleton.",
    relatedQuestionIds: ["b018", "b023"],
  },

  /* ---------------------------------------------------------------- */
  /* Dependency injection                                              */
  /* ---------------------------------------------------------------- */
  {
    name: "@Autowired",
    category: "spring-di",
    target: "Constructor, Method, Field, Parameter",
    purpose: "Requests dependency injection by type.",
    howItWorks:
      "`AutowiredAnnotationBeanPostProcessor` resolves candidates by type, then narrows by @Qualifier, @Primary, and finally parameter name. `required = false` makes it optional; `Optional<T>` and `ObjectProvider<T>` express the same thing more cleanly.",
    example: "private final OrderRepository repository;\n\npublic OrderService(OrderRepository repository) {\n    this.repository = repository;\n}",
    gotcha:
      "Since Spring 4.3 it is optional on a single constructor. Prefer constructor injection: it makes dependencies final, testable without reflection, and fails fast on a circular dependency instead of hiding it.",
    relatedQuestionIds: ["b020"],
  },
  {
    name: "@Qualifier",
    category: "spring-di",
    target: "Field, Parameter, Type",
    purpose: "Disambiguates between multiple beans of the same type.",
    howItWorks:
      "Matched against the bean name or against a custom qualifier annotation. Evaluated after @Primary, so it wins over it.",
    example: '@Autowired\npublic OrderService(@Qualifier("primaryDataSource") DataSource ds) { }',
    gotcha:
      "A string bean name is refactor-hostile. A custom qualifier annotation (`@Primary DataSource` → `@PrimaryDb`) is type-safe and survives renames.",
    relatedQuestionIds: ["b021"],
  },
  {
    name: "@Primary",
    category: "spring-di",
    target: "Class, Method",
    purpose: "Marks the default bean when several candidates match.",
    howItWorks: "Used by the resolver as a tie-breaker. Only one @Primary per type, or resolution fails again.",
    example: "@Bean\n@Primary\nDataSource mainDataSource() { ... }",
    relatedQuestionIds: ["b021"],
  },
  {
    name: "@Value",
    category: "spring-di",
    target: "Field, Parameter, Method",
    purpose: "Injects a property value or SpEL expression.",
    howItWorks:
      "`${...}` is resolved against the `Environment` by a property placeholder configurer; `#{...}` is a SpEL expression. Type conversion goes through `ConversionService`.",
    example: '@Value("${app.timeout:5000}")\nprivate long timeoutMs;',
    gotcha:
      "No relaxed binding, no validation, no IDE completion, and it fails at runtime rather than startup. Prefer @ConfigurationProperties for anything beyond a single value.",
    relatedQuestionIds: ["b026"],
  },
  {
    name: "@Lazy",
    category: "spring-di",
    target: "Class, Method, Field, Parameter",
    purpose: "Defers bean creation until first use.",
    howItWorks:
      "On a bean definition it skips eager singleton instantiation. On an injection point Spring injects a proxy that resolves the real bean on first call — which is the standard escape hatch for a circular dependency.",
    example: "@Lazy\n@Autowired\nprivate ExpensiveService service;",
    gotcha:
      "Lazy beans hide startup failures until the first request. Use it deliberately, not as a default.",
    relatedQuestionIds: ["b022"],
  },
  {
    name: "@Scope",
    category: "spring-di",
    target: "Class, Method",
    purpose: "Sets the bean's lifecycle scope.",
    howItWorks:
      "singleton (default), prototype, request, session, application, websocket. `proxyMode = TARGET_CLASS` injects a scoped proxy so a shorter-lived bean can be injected into a singleton.",
    example: '@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)\n@Component\npublic class RequestContext { }',
    gotcha:
      "Injecting a prototype into a singleton gives you ONE instance forever. You need a scoped proxy, `ObjectProvider`, or a @Lookup method.",
    relatedQuestionIds: ["b022"],
  },
  {
    name: "@Order",
    category: "spring-di",
    target: "Class, Method, Field",
    purpose: "Orders beans in an injected collection or a chain.",
    howItWorks:
      "Lower values come first. Read by `AnnotationAwareOrderComparator`, which also honours the `Ordered` interface and `@Priority`.",
    example: "@Component\n@Order(1)\npublic class ValidationFilter implements Filter { }",
    gotcha:
      "It does NOT influence bean creation order — use @DependsOn for that. It only orders lists, aspects, filters and post-processors.",
    relatedQuestionIds: ["b021"],
  },
  {
    name: "@DependsOn",
    category: "spring-di",
    target: "Class, Method",
    purpose: "Forces another bean to be created first.",
    howItWorks: "Adds an explicit initialisation edge in the dependency graph, by bean name.",
    example: '@Bean\n@DependsOn("flywayMigrator")\nCacheWarmer cacheWarmer() { ... }',
    gotcha: "A code smell when overused — it usually means a hidden side-effect dependency that should be explicit.",
  },
  {
    name: "@Resource",
    category: "spring-di",
    target: "Field, Method",
    purpose: "JSR-250 injection, by name first.",
    howItWorks:
      "Resolves by name (the field name or the declared `name`), falling back to type. The opposite default of @Autowired, which is by type first.",
    example: '@Resource(name = "auditDataSource")\nprivate DataSource dataSource;',
  },
  {
    name: "@Lookup",
    category: "spring-di",
    target: "Method",
    purpose: "Method injection for obtaining a fresh prototype each call.",
    howItWorks:
      "Spring CGLIB-overrides the annotated abstract or concrete method to return a newly resolved bean on every invocation.",
    example: "@Lookup\nprotected abstract Task createTask();",
    gotcha: "Requires a proxyable (non-final) class and a non-private method.",
  },
  {
    name: "@PostConstruct",
    category: "spring-di",
    target: "Method",
    purpose: "Callback after dependency injection completes.",
    howItWorks:
      "`CommonAnnotationBeanPostProcessor` invokes it after all properties are set and before the bean is put into service. Runs before `InitializingBean.afterPropertiesSet`.",
    example: "@PostConstruct\nvoid warmCache() { cache.preload(); }",
    gotcha:
      "In Boot 3 it lives in `jakarta.annotation`, not `javax.annotation`. Long work here delays startup and blocks readiness — prefer `ApplicationReadyEvent`.",
    relatedQuestionIds: ["b032"],
  },
  {
    name: "@PreDestroy",
    category: "spring-di",
    target: "Method",
    purpose: "Callback before the bean is destroyed.",
    howItWorks: "Invoked on context close for singletons. Prototype beans never receive it — the container does not track them.",
    example: "@PreDestroy\nvoid shutdown() { executor.shutdownNow(); }",
    relatedQuestionIds: ["b032"],
  },

  /* ---------------------------------------------------------------- */
  /* Configuration & conditions                                        */
  /* ---------------------------------------------------------------- */
  {
    name: "@Bean",
    category: "spring-config",
    target: "Method",
    purpose: "Registers the method's return value as a bean.",
    howItWorks:
      "The method name becomes the bean name unless overridden. Method parameters are themselves injected. Use it for third-party classes you cannot annotate.",
    example: "@Bean(initMethod = \"start\", destroyMethod = \"close\")\nRestTemplate restTemplate(RestTemplateBuilder builder) {\n    return builder.build();\n}",
    gotcha:
      "In a @Configuration class with `proxyBeanMethods = true`, calling another @Bean method returns the singleton. In lite mode it creates a new object — a classic source of duplicate connection pools.",
    relatedQuestionIds: ["b018"],
  },
  {
    name: "@Import",
    category: "spring-config",
    target: "Class",
    purpose: "Pulls in additional configuration classes, selectors or registrars.",
    howItWorks:
      "Accepts @Configuration classes, `ImportSelector` implementations (which return class names dynamically) or `ImportBeanDefinitionRegistrar` implementations (which register definitions programmatically). Every `@EnableXxx` annotation is built on this.",
    example: "@Configuration\n@Import({SecurityConfig.class, CacheConfig.class})\npublic class AppConfig { }",
    relatedQuestionIds: ["b023", "b038"],
  },
  {
    name: "@ComponentScan",
    category: "spring-config",
    target: "Class",
    purpose: "Defines which packages to scan for stereotypes.",
    howItWorks:
      "Configures `ClassPathBeanDefinitionScanner`. `includeFilters`/`excludeFilters` accept ANNOTATION, ASSIGNABLE_TYPE, ASPECTJ, REGEX and CUSTOM filter types.",
    example: '@ComponentScan(basePackages = "com.example",\n    excludeFilters = @Filter(type = FilterType.ANNOTATION, classes = Legacy.class))',
    gotcha: "Scanning a very broad package (or the default package) slows startup and can pull in unexpected beans.",
    relatedQuestionIds: ["b017"],
  },
  {
    name: "@PropertySource",
    category: "spring-config",
    target: "Class",
    purpose: "Adds a properties file to the Environment.",
    howItWorks: "Registers a `PropertySource` at a defined precedence. Supports `ignoreResourceNotFound` and an explicit encoding.",
    example: '@PropertySource("classpath:integration.properties")',
    gotcha: "It does not support YAML. Boot's `application.yml` is loaded by a different mechanism entirely.",
    relatedQuestionIds: ["b039"],
  },
  {
    name: "@Profile",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Activates a bean only for named profiles.",
    howItWorks:
      "Implemented as a @Conditional with `ProfileCondition`. Supports expressions: `!prod`, `dev | test`, `prod & eu`.",
    example: '@Bean\n@Profile("!prod")\nDataSource h2DataSource() { ... }',
    gotcha:
      "Profile-based bean swapping means your test profile exercises different code than production. Prefer @ConditionalOnProperty where you can.",
    relatedQuestionIds: ["b027"],
  },
  {
    name: "@Conditional",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Registers a bean only when a `Condition` returns true.",
    howItWorks:
      "`matches(ConditionContext, AnnotatedTypeMetadata)` is evaluated during configuration-class parsing, with access to the bean factory, environment, classloader and resource loader.",
    example: "@Bean\n@Conditional(OnKubernetesCondition.class)\nServiceDiscovery discovery() { ... }",
    relatedQuestionIds: ["b025", "b038"],
  },
  {
    name: "@ConditionalOnProperty",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Enables a bean based on a configuration property.",
    howItWorks: "Checks `name`/`prefix` against `havingValue`; `matchIfMissing` decides the default when the property is absent.",
    example: '@ConditionalOnProperty(prefix = "feature", name = "new-pricing",\n    havingValue = "true", matchIfMissing = false)',
    gotcha: "The most operationally useful condition — it makes a feature flag work without a redeploy of different code.",
    relatedQuestionIds: ["b025"],
  },
  {
    name: "@ConditionalOnClass",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Only when a class is on the classpath.",
    howItWorks:
      "Evaluated with ASM against the class file, never by loading the class — which is why referencing an absent class here does not throw `NoClassDefFoundError`.",
    example: "@ConditionalOnClass(name = \"com.zaxxer.hikari.HikariDataSource\")",
    gotcha: "Must be used on an auto-configuration class, not on a @Bean method that also references the type in its signature.",
    relatedQuestionIds: ["b038"],
  },
  {
    name: "@ConditionalOnMissingBean",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Back off if the user already defined the bean.",
    howItWorks:
      "Checks the bean factory at the time the condition runs. This is the mechanism that makes every Spring Boot default overridable simply by declaring your own bean.",
    example: "@Bean\n@ConditionalOnMissingBean\nObjectMapper objectMapper() { ... }",
    gotcha:
      "Order-sensitive — it only sees beans registered before it. Always place it on auto-configuration, never on user configuration.",
    relatedQuestionIds: ["b038"],
  },
  {
    name: "@ConditionalOnBean",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Only when another bean exists.",
    howItWorks: "The mirror of @ConditionalOnMissingBean, with the same ordering caveat.",
    example: "@Bean\n@ConditionalOnBean(DataSource.class)\nJdbcTemplate jdbcTemplate(DataSource ds) { ... }",
  },
  {
    name: "@ConditionalOnWebApplication",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Only in a servlet or reactive web context.",
    howItWorks: "`type = SERVLET | REACTIVE | ANY` selects which flavour. Siblings: @ConditionalOnNotWebApplication, @ConditionalOnCloudPlatform.",
    example: "@ConditionalOnWebApplication(type = Type.SERVLET)",
  },
  {
    name: "@ConfigurationProperties",
    category: "spring-config",
    target: "Class, Method",
    purpose: "Binds a whole tree of properties onto a typed object.",
    howItWorks:
      "Uses relaxed binding (`app.readTimeout`, `app.read-timeout`, `APP_READTIMEOUT` all match), type conversion, nested objects, lists and maps, plus JSR-303 validation when @Validated is present.",
    example:
      '@ConfigurationProperties(prefix = "app.mail")\n@Validated\npublic record MailProperties(@NotBlank String host, @Min(1) int port) { }',
    gotcha:
      "Needs @EnableConfigurationProperties, @ConfigurationPropertiesScan, or a stereotype on the class — otherwise it is never bound and every field is null.",
    relatedQuestionIds: ["b026", "b039"],
  },
  {
    name: "@EnableConfigurationProperties",
    category: "spring-config",
    target: "Class",
    purpose: "Registers @ConfigurationProperties classes as beans.",
    howItWorks: "Imports `EnableConfigurationPropertiesRegistrar`, which registers each listed class as a bound bean.",
    example: "@Configuration\n@EnableConfigurationProperties(MailProperties.class)\npublic class MailConfig { }",
  },
  {
    name: "@ConstructorBinding",
    category: "spring-config",
    target: "Constructor",
    purpose: "Binds properties through a constructor, enabling immutable config.",
    howItWorks:
      "In Boot 3 it is only needed to disambiguate when a class has several constructors — a single-constructor class (or a record) binds by constructor automatically.",
    example: "@ConfigurationProperties(\"app\")\npublic record AppProperties(String name, Duration timeout) { }",
    since: "Spring Boot 2.2",
  },

  /* ---------------------------------------------------------------- */
  /* Spring Boot                                                       */
  /* ---------------------------------------------------------------- */
  {
    name: "@SpringBootApplication",
    category: "spring-boot",
    target: "Class",
    purpose: "The single entry-point annotation.",
    howItWorks:
      "Composes @SpringBootConfiguration, @EnableAutoConfiguration and @ComponentScan. Supports `exclude`, `scanBasePackages` and `proxyBeanMethods`.",
    example: "@SpringBootApplication\npublic class Application {\n    public static void main(String[] a) { SpringApplication.run(Application.class, a); }\n}",
    gotcha: "Component scanning starts at this class's package — put it at the root of your package tree.",
    relatedQuestionIds: ["b017", "b037"],
  },
  {
    name: "@EnableAutoConfiguration",
    category: "spring-boot",
    target: "Class",
    purpose: "Turns on classpath-driven configuration.",
    howItWorks:
      "Imports `AutoConfigurationImportSelector`, which reads every `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` file, filters by @Conditional, and orders with @AutoConfigureBefore/@AutoConfigureAfter.",
    example: '@EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)',
    gotcha: "In Boot 2.x the registry file was `META-INF/spring.factories`; it moved in 3.0.",
    relatedQuestionIds: ["b038"],
  },
  {
    name: "@SpringBootConfiguration",
    category: "spring-boot",
    target: "Class",
    purpose: "A @Configuration that tests can discover automatically.",
    howItWorks:
      "`SpringBootTestContextBootstrapper` walks up the package tree looking for exactly one @SpringBootConfiguration to use as the default test context.",
    example: "@SpringBootConfiguration\npublic class TestApplication { }",
    gotcha: "Having two in scope makes every @SpringBootTest fail with an ambiguity error.",
    relatedQuestionIds: ["b017"],
  },
  {
    name: "@AutoConfiguration",
    category: "spring-boot",
    target: "Class",
    purpose: "Declares an auto-configuration class in a starter.",
    howItWorks:
      "A @Configuration with `proxyBeanMethods = false` plus `before`/`after` ordering attributes. Must be listed in the `AutoConfiguration.imports` file.",
    example: '@AutoConfiguration(after = DataSourceAutoConfiguration.class)\npublic class MyAutoConfiguration { }',
    since: "Spring Boot 2.7",
    relatedQuestionIds: ["b038"],
  },
  {
    name: "@ConfigurationPropertiesScan",
    category: "spring-boot",
    target: "Class",
    purpose: "Scans for @ConfigurationProperties classes.",
    howItWorks: "Removes the need to list each properties class in @EnableConfigurationProperties.",
    example: '@SpringBootApplication\n@ConfigurationPropertiesScan("com.example.config")',
  },
  {
    name: "@ServletComponentScan",
    category: "spring-boot",
    target: "Class",
    purpose: "Registers @WebServlet, @WebFilter and @WebListener classes.",
    howItWorks: "Only applies when running in an embedded container; a deployed WAR is scanned by the container itself.",
    example: "@SpringBootApplication\n@ServletComponentScan",
  },

  /* ---------------------------------------------------------------- */
  /* Spring MVC                                                        */
  /* ---------------------------------------------------------------- */
  {
    name: "@RequestMapping",
    category: "spring-web",
    target: "Class, Method",
    purpose: "Maps requests to handler methods.",
    howItWorks:
      "`RequestMappingHandlerMapping` builds a `RequestMappingInfo` from path, method, params, headers, consumes and produces, then matches each request against it.",
    example: '@RequestMapping(value = "/orders", method = RequestMethod.GET,\n    produces = MediaType.APPLICATION_JSON_VALUE)',
    relatedQuestionIds: ["b028"],
  },
  {
    name: "@GetMapping",
    category: "spring-web",
    target: "Method",
    purpose: "Shortcut for @RequestMapping(method = GET).",
    howItWorks: "A composed annotation using @AliasFor to forward `path`, `params`, `headers`, `consumes` and `produces`.",
    example: '@GetMapping("/{id}")\nOrder get(@PathVariable Long id) { ... }',
    relatedQuestionIds: ["b028"],
  },
  {
    name: "@PostMapping",
    category: "spring-web",
    target: "Method",
    purpose: "Shortcut for @RequestMapping(method = POST).",
    howItWorks: "Typically paired with @RequestBody and a 201 response carrying a Location header.",
    example: '@PostMapping\n@ResponseStatus(HttpStatus.CREATED)\nOrder create(@RequestBody @Valid CreateOrder body) { ... }',
  },
  {
    name: "@PutMapping",
    category: "spring-web",
    target: "Method",
    purpose: "Shortcut for @RequestMapping(method = PUT).",
    howItWorks: "PUT is idempotent and replaces the whole resource; use PATCH for partial updates.",
    example: '@PutMapping("/{id}")\nOrder replace(@PathVariable Long id, @RequestBody Order body) { ... }',
  },
  {
    name: "@PatchMapping",
    category: "spring-web",
    target: "Method",
    purpose: "Shortcut for @RequestMapping(method = PATCH).",
    howItWorks: "Usually consumes `application/merge-patch+json` or `application/json-patch+json`.",
    example: '@PatchMapping("/{id}")\nOrder patch(@PathVariable Long id, @RequestBody Map<String, Object> changes) { ... }',
  },
  {
    name: "@DeleteMapping",
    category: "spring-web",
    target: "Method",
    purpose: "Shortcut for @RequestMapping(method = DELETE).",
    howItWorks: "Conventionally returns 204 No Content, and should be idempotent.",
    example: '@DeleteMapping("/{id}")\n@ResponseStatus(HttpStatus.NO_CONTENT)\nvoid delete(@PathVariable Long id) { ... }',
  },
  {
    name: "@RequestParam",
    category: "spring-web",
    target: "Parameter",
    purpose: "Binds a query string or form parameter.",
    howItWorks: "`required` defaults to true; `defaultValue` implies optional. Binds to `List`, `Map`, `Optional` and enums via `ConversionService`.",
    example: '@GetMapping\nList<Order> list(@RequestParam(defaultValue = "0") int page,\n                 @RequestParam(required = false) String status) { ... }',
    gotcha:
      "Since Spring 6.1 parameter names are no longer inferred unless you compile with `-parameters` — always name the parameter explicitly in library code.",
  },
  {
    name: "@PathVariable",
    category: "spring-web",
    target: "Parameter",
    purpose: "Binds a URI template variable.",
    howItWorks: "Extracted from the path pattern; supports regex segments such as `/{id:[0-9]+}`.",
    example: '@GetMapping("/{orderId}/items/{itemId}")\nItem get(@PathVariable Long orderId, @PathVariable Long itemId) { ... }',
  },
  {
    name: "@RequestBody",
    category: "spring-web",
    target: "Parameter",
    purpose: "Deserialises the request body into an object.",
    howItWorks: "Delegates to `HttpMessageConverter`s selected by Content-Type — `MappingJackson2HttpMessageConverter` for JSON.",
    example: "@PostMapping\nOrder create(@RequestBody @Valid CreateOrderRequest request) { ... }",
    gotcha: "Only one @RequestBody per method — the stream can be read once.",
  },
  {
    name: "@ResponseBody",
    category: "spring-web",
    target: "Class, Method",
    purpose: "Serialises the return value into the response body.",
    howItWorks: "Implied by @RestController. Bypasses view resolution entirely.",
    example: "@GetMapping(\"/ping\")\n@ResponseBody\nString ping() { return \"pong\"; }",
  },
  {
    name: "@ResponseStatus",
    category: "spring-web",
    target: "Class, Method",
    purpose: "Sets the HTTP status for a handler or an exception type.",
    howItWorks: "On an exception class, `ResponseStatusExceptionResolver` maps it to that status automatically.",
    example: '@ResponseStatus(value = HttpStatus.NOT_FOUND, reason = "Order not found")\npublic class OrderNotFoundException extends RuntimeException { }',
    gotcha: "Using `reason` triggers `HttpServletResponse.sendError`, which discards any response body you set.",
  },
  {
    name: "@RequestHeader",
    category: "spring-web",
    target: "Parameter",
    purpose: "Binds an HTTP header.",
    howItWorks: "Binds a single header, or the whole set into a `Map`/`HttpHeaders`/`MultiValueMap`.",
    example: '@GetMapping\nvoid handle(@RequestHeader("X-Request-Id") String requestId) { ... }',
  },
  {
    name: "@CookieValue",
    category: "spring-web",
    target: "Parameter",
    purpose: "Binds a cookie value.",
    howItWorks: "Binds to `String` or `jakarta.servlet.http.Cookie`.",
    example: '@PostMapping("/refresh")\nvoid refresh(@CookieValue(name = "refresh_token", required = false) String token) { }',
    relatedQuestionIds: ["b130"],
  },
  {
    name: "@ModelAttribute",
    category: "spring-web",
    target: "Method, Parameter",
    purpose: "Binds form data to an object, or pre-populates the model.",
    howItWorks: "On a method it runs before every handler in the controller; on a parameter it binds request parameters onto a POJO.",
    example: '@PostMapping("/save")\nString save(@ModelAttribute @Valid UserForm form) { ... }',
    gotcha: "Mass-assignment risk — restrict bindable fields with @InitBinder's `setAllowedFields`.",
  },
  {
    name: "@ExceptionHandler",
    category: "spring-web",
    target: "Method",
    purpose: "Handles exceptions from controller methods.",
    howItWorks:
      "Resolved by `ExceptionHandlerExceptionResolver`. The most specific exception type wins. Local handlers take priority over @ControllerAdvice.",
    example: "@ExceptionHandler(OrderNotFoundException.class)\nProblemDetail handle(OrderNotFoundException e) { ... }",
    relatedQuestionIds: ["b033", "b119"],
  },
  {
    name: "@InitBinder",
    category: "spring-web",
    target: "Method",
    purpose: "Customises data binding and validation per controller.",
    howItWorks: "Receives a `WebDataBinder` where you can register `PropertyEditor`s, `Formatter`s, validators or field allowlists.",
    example: '@InitBinder\nvoid init(WebDataBinder binder) { binder.setAllowedFields("name", "email"); }',
  },
  {
    name: "@CrossOrigin",
    category: "spring-web",
    target: "Class, Method",
    purpose: "Enables CORS for a controller or handler.",
    howItWorks: "Contributes a `CorsConfiguration` for the mapped handler; the `CorsFilter`/`CorsProcessor` writes the response headers.",
    example: '@CrossOrigin(origins = "https://app.example.com", maxAge = 3600)',
    gotcha:
      "With Spring Security you must ALSO enable `http.cors(...)`, or the unauthenticated preflight is rejected before it reaches the controller.",
    relatedQuestionIds: ["b115"],
  },
  {
    name: "@RequestPart",
    category: "spring-web",
    target: "Parameter",
    purpose: "Binds one part of a multipart request.",
    howItWorks: "Unlike @RequestParam it runs the part through an `HttpMessageConverter`, so a JSON part deserialises into an object.",
    example: "void upload(@RequestPart(\"meta\") Metadata meta,\n            @RequestPart(\"file\") MultipartFile file) { }",
  },
  {
    name: "@SessionAttributes",
    category: "spring-web",
    target: "Class",
    purpose: "Stores model attributes in the HTTP session across requests.",
    howItWorks: "Names or types listed here are copied into the session and removed by `SessionStatus.setComplete()`.",
    example: '@SessionAttributes("checkout")\n@Controller\npublic class CheckoutController { }',
  },

  /* ---------------------------------------------------------------- */
  /* Transactions & AOP                                                */
  /* ---------------------------------------------------------------- */
  {
    name: "@Transactional",
    category: "spring-tx",
    target: "Class, Method",
    purpose: "Declarative transaction demarcation.",
    howItWorks:
      "A proxy (`TransactionInterceptor`) opens a transaction before the call and commits or rolls back after. Attributes: `propagation`, `isolation`, `timeout`, `readOnly`, `rollbackFor`, `noRollbackFor`.",
    example: "@Transactional(propagation = Propagation.REQUIRED, timeout = 5, readOnly = false)\npublic void placeOrder(Order order) { ... }",
    gotcha:
      "Rolls back on unchecked exceptions ONLY by default — a checked exception commits. Self-invocation bypasses the proxy entirely, and private/final methods are never advised.",
    relatedQuestionIds: ["b022", "b102"],
  },
  {
    name: "@EnableTransactionManagement",
    category: "spring-tx",
    target: "Class",
    purpose: "Turns on @Transactional processing.",
    howItWorks: "Registers the transaction advisor and post-processors. Spring Boot enables it automatically when a `PlatformTransactionManager` is present.",
    example: "@Configuration\n@EnableTransactionManagement(proxyTargetClass = true)",
  },
  {
    name: "@Aspect",
    category: "spring-tx",
    target: "Class",
    purpose: "Declares a class as an AspectJ aspect.",
    howItWorks:
      "Spring AOP uses proxy-based weaving (JDK dynamic proxies for interfaces, CGLIB otherwise) and supports method execution join points only.",
    example: "@Aspect\n@Component\npublic class AuditAspect { }",
    gotcha: "The class must ALSO be a Spring bean — @Aspect alone registers nothing.",
    relatedQuestionIds: ["b010"],
  },
  {
    name: "@Around",
    category: "spring-tx",
    target: "Method",
    purpose: "The most powerful advice: wraps the join point.",
    howItWorks:
      "Receives a `ProceedingJoinPoint`; you decide whether and when to call `proceed()`, may modify arguments and the return value, and can swallow exceptions.",
    example:
      '@Around("@annotation(Timed)")\nObject time(ProceedingJoinPoint pjp) throws Throwable {\n    long start = System.nanoTime();\n    try { return pjp.proceed(); }\n    finally { record(System.nanoTime() - start); }\n}',
    relatedQuestionIds: ["b010"],
  },
  {
    name: "@Before / @After / @AfterReturning / @AfterThrowing",
    category: "spring-tx",
    target: "Method",
    purpose: "Advice that runs at a specific point around the join point.",
    howItWorks:
      "@After is a finally block; @AfterReturning can bind the return value; @AfterThrowing can bind the exception. None of them can prevent the call.",
    example: '@AfterThrowing(pointcut = "execution(* com.example..*(..))", throwing = "ex")\nvoid onError(JoinPoint jp, Exception ex) { ... }',
  },
  {
    name: "@Pointcut",
    category: "spring-tx",
    target: "Method",
    purpose: "Names a reusable join-point expression.",
    howItWorks: "Designators include `execution`, `within`, `@annotation`, `bean`, `args`, `this`, `target`.",
    example: '@Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")\nvoid transactionalMethods() { }',
  },
  {
    name: "@EnableAspectJAutoProxy",
    category: "spring-tx",
    target: "Class",
    purpose: "Enables @Aspect processing.",
    howItWorks: "Registers `AnnotationAwareAspectJAutoProxyCreator`. `proxyTargetClass = true` forces CGLIB; `exposeProxy = true` makes `AopContext.currentProxy()` available for self-invocation.",
    example: "@EnableAspectJAutoProxy(proxyTargetClass = true, exposeProxy = true)",
  },

  /* ---------------------------------------------------------------- */
  /* Async / scheduling / caching / resilience                         */
  /* ---------------------------------------------------------------- */
  {
    name: "@Async",
    category: "spring-async",
    target: "Method, Class",
    purpose: "Runs the method on a task executor.",
    howItWorks:
      "`AsyncExecutionInterceptor` submits the invocation to an `AsyncTaskExecutor`. Supported return types: void, `Future`, `CompletableFuture`.",
    example: "@Async(\"taskExecutor\")\npublic CompletableFuture<Report> generate(long id) { ... }",
    gotcha:
      "Needs @EnableAsync. Self-invocation is not async. Exceptions from void methods vanish unless you register an `AsyncUncaughtExceptionHandler`. The default executor before Boot 3 created an unbounded thread per call.",
    relatedQuestionIds: ["b101"],
  },
  {
    name: "@EnableAsync",
    category: "spring-async",
    target: "Class",
    purpose: "Activates @Async processing.",
    howItWorks: "Registers the async advisor. Implement `AsyncConfigurer` to supply the executor and the uncaught-exception handler.",
    example: "@Configuration\n@EnableAsync\npublic class AsyncConfig implements AsyncConfigurer { }",
    relatedQuestionIds: ["b101"],
  },
  {
    name: "@Scheduled",
    category: "spring-async",
    target: "Method",
    purpose: "Runs a method on a timer or cron schedule.",
    howItWorks:
      "`ScheduledAnnotationBeanPostProcessor` registers the task with a `TaskScheduler`. Options: `fixedRate`, `fixedDelay`, `initialDelay`, `cron`, `zone`, plus String variants that resolve properties.",
    example: '@Scheduled(cron = "0 0 3 * * *", zone = "UTC")\npublic void nightlyJob() { }',
    gotcha:
      "The default scheduler pool size is ONE. An uncaught exception cancels that task forever. In a cluster it runs on every instance — use ShedLock or Quartz.",
    relatedQuestionIds: ["b105"],
  },
  {
    name: "@EnableScheduling",
    category: "spring-async",
    target: "Class",
    purpose: "Activates @Scheduled processing.",
    howItWorks: "Registers the scheduled-task post-processor. Configure the pool via `spring.task.scheduling.pool.size` or a `ThreadPoolTaskScheduler` bean.",
    example: "@Configuration\n@EnableScheduling\npublic class SchedulingConfig { }",
    relatedQuestionIds: ["b105"],
  },
  {
    name: "@Cacheable",
    category: "spring-async",
    target: "Method, Class",
    purpose: "Caches the method result.",
    howItWorks:
      "`CacheInterceptor` builds a key (`SimpleKeyGenerator` or your SpEL `key`), returns the cached value on a hit and stores the result on a miss. `condition` is evaluated before the call, `unless` after.",
    example: '@Cacheable(cacheNames = "orders", key = "#id", unless = "#result == null")\npublic Order find(Long id) { ... }',
    gotcha: "Self-invocation bypasses it, and caching a null (or a mutable object shared across callers) causes subtle bugs.",
    relatedQuestionIds: ["b030"],
  },
  {
    name: "@CachePut",
    category: "spring-async",
    target: "Method",
    purpose: "Always executes and updates the cache.",
    howItWorks: "Unlike @Cacheable it never short-circuits — use it on an update method so the cache stays fresh.",
    example: '@CachePut(cacheNames = "orders", key = "#order.id")\npublic Order update(Order order) { ... }',
  },
  {
    name: "@CacheEvict",
    category: "spring-async",
    target: "Method",
    purpose: "Removes entries from a cache.",
    howItWorks: "`allEntries = true` clears the cache; `beforeInvocation = true` evicts even if the method throws.",
    example: '@CacheEvict(cacheNames = "orders", key = "#id", beforeInvocation = true)\npublic void delete(Long id) { ... }',
  },
  {
    name: "@Caching",
    category: "spring-async",
    target: "Method",
    purpose: "Combines several cache operations on one method.",
    howItWorks: "Groups multiple @Cacheable, @CachePut and @CacheEvict declarations that would otherwise conflict.",
    example: '@Caching(evict = {@CacheEvict("orders"), @CacheEvict(value = "summary", allEntries = true)})',
  },
  {
    name: "@EnableCaching",
    category: "spring-async",
    target: "Class",
    purpose: "Activates the caching annotations.",
    howItWorks: "Registers the cache advisor. Boot auto-configures a `CacheManager` from the classpath (Caffeine, Redis, Hazelcast).",
    example: "@Configuration\n@EnableCaching\npublic class CacheConfig { }",
  },
  {
    name: "@Retryable",
    category: "spring-async",
    target: "Method, Class",
    purpose: "Retries a failed call (Spring Retry).",
    howItWorks: "`retryFor`, `maxAttempts` and `@Backoff` configure the policy; a matching @Recover method handles final failure.",
    example: "@Retryable(retryFor = TransientException.class, maxAttempts = 4,\n    backoff = @Backoff(delay = 100, multiplier = 2, random = true))",
    gotcha: "Only retry idempotent operations, and always add jitter — synchronised retries cause a thundering herd.",
    relatedQuestionIds: ["b034", "b102"],
  },
  {
    name: "@Recover",
    category: "spring-async",
    target: "Method",
    purpose: "Fallback invoked when all retries are exhausted.",
    howItWorks: "Must take the exception as its first parameter, followed by the original arguments, and return a compatible type.",
    example: "@Recover\npublic Order recover(TransientException e, Long id) { return Order.unavailable(id); }",
  },
  {
    name: "@CircuitBreaker",
    category: "spring-async",
    target: "Method",
    purpose: "Stops calling a failing dependency (Resilience4j).",
    howItWorks:
      "Tracks a sliding window of failures; opens after the threshold, rejects calls for `waitDurationInOpenState`, then half-opens to probe.",
    example: '@CircuitBreaker(name = "payments", fallbackMethod = "fallback")\npublic String charge(String id) { ... }',
    relatedQuestionIds: ["b034", "b106"],
  },
  {
    name: "@Bulkhead / @RateLimiter / @TimeLimiter",
    category: "spring-async",
    target: "Method",
    purpose: "Bound concurrency, request rate and call duration (Resilience4j).",
    howItWorks:
      "@Bulkhead isolates a dependency behind a semaphore or its own thread pool; @RateLimiter caps calls per period; @TimeLimiter needs a `CompletionStage` return type.",
    example: '@Bulkhead(name = "payments", type = Bulkhead.Type.THREADPOOL)',
    relatedQuestionIds: ["b106"],
  },
  {
    name: "@EventListener",
    category: "spring-async",
    target: "Method",
    purpose: "Handles an application event.",
    howItWorks:
      "Registered by `EventListenerMethodProcessor`. Synchronous by default and inside the publisher's transaction; add @Async to move it off-thread. `condition` accepts SpEL.",
    example: "@EventListener\nvoid on(OrderPlaced event) { ... }",
    relatedQuestionIds: ["b034"],
  },
  {
    name: "@TransactionalEventListener",
    category: "spring-async",
    target: "Method",
    purpose: "Handles an event at a specific transaction phase.",
    howItWorks: "Phases: BEFORE_COMMIT, AFTER_COMMIT (default), AFTER_ROLLBACK, AFTER_COMPLETION.",
    example: "@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)\nvoid publish(OrderPlaced event) { ... }",
    gotcha:
      "AFTER_COMMIT runs outside the transaction, so a database write there needs `REQUIRES_NEW` — and it can still be lost if the process dies. Use the outbox pattern when it must not be.",
    relatedQuestionIds: ["b034"],
  },

  /* ---------------------------------------------------------------- */
  /* Spring Data                                                       */
  /* ---------------------------------------------------------------- */
  {
    name: "@Query",
    category: "spring-data",
    target: "Method",
    purpose: "Declares an explicit JPQL or native query.",
    howItWorks: "`nativeQuery = true` switches to SQL. Supports named (`:name`) and positional (`?1`) parameters and SpEL entity names.",
    example: '@Query("select o from Order o where o.status = :status")\nList<Order> byStatus(@Param("status") Status status);',
    gotcha: "Never build a native query by string concatenation — it is SQL-injectable exactly like JDBC.",
    relatedQuestionIds: ["b031", "b122"],
  },
  {
    name: "@Modifying",
    category: "spring-data",
    target: "Method",
    purpose: "Marks a @Query as an UPDATE or DELETE.",
    howItWorks: "`clearAutomatically` and `flushAutomatically` keep the persistence context consistent with the bulk statement.",
    example: '@Modifying(clearAutomatically = true)\n@Query("update Order o set o.status = :s where o.id = :id")\nint updateStatus(Long id, Status s);',
    gotcha: "Bulk statements bypass the persistence context and entity lifecycle callbacks — stale entities remain in the first-level cache.",
  },
  {
    name: "@Param",
    category: "spring-data",
    target: "Parameter",
    purpose: "Names a query parameter.",
    howItWorks: "Required unless the code is compiled with `-parameters`.",
    example: '@Query("select u from User u where u.email = :email")\nUser byEmail(@Param("email") String email);',
  },
  {
    name: "@EntityGraph",
    category: "spring-data",
    target: "Method",
    purpose: "Controls what is eagerly fetched for one query.",
    howItWorks: "`FETCH` overrides the mapping to eager for the listed paths; `LOAD` leaves unlisted attributes at their mapped default.",
    example: '@EntityGraph(attributePaths = {"items", "customer"})\nList<Order> findAll();',
    gotcha: "The standard fix for the N+1 select problem without writing a JOIN FETCH query.",
  },
  {
    name: "@Lock",
    category: "spring-data",
    target: "Method",
    purpose: "Applies a JPA lock mode to a query.",
    howItWorks: "PESSIMISTIC_WRITE emits `SELECT ... FOR UPDATE`; OPTIMISTIC_FORCE_INCREMENT bumps the @Version even on a read.",
    example: "@Lock(LockModeType.PESSIMISTIC_WRITE)\nOptional<Product> findById(Long id);",
    relatedQuestionIds: ["b102"],
  },
  {
    name: "@QueryHints",
    category: "spring-data",
    target: "Method",
    purpose: "Passes JPA hints to a query.",
    howItWorks: "Typical hints: lock timeout, fetch size, read-only, query cache.",
    example: '@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))',
  },
  {
    name: "@EnableJpaAuditing",
    category: "spring-data",
    target: "Class",
    purpose: "Activates auditing annotations.",
    howItWorks: "Registers `AuditingEntityListener`. Supply an `AuditorAware<T>` bean so @CreatedBy/@LastModifiedBy can resolve the current user.",
    example: '@Configuration\n@EnableJpaAuditing(auditorAwareRef = "auditorProvider")',
  },
  {
    name: "@CreatedDate / @LastModifiedDate / @CreatedBy / @LastModifiedBy",
    category: "spring-data",
    target: "Field",
    purpose: "Automatically populated audit columns.",
    howItWorks: "Filled by `AuditingEntityListener` on persist and update. The entity needs `@EntityListeners(AuditingEntityListener.class)`.",
    example: "@CreatedDate\nprivate Instant createdAt;\n\n@LastModifiedBy\nprivate String modifiedBy;",
  },
  {
    name: "@NoRepositoryBean",
    category: "spring-data",
    target: "Interface",
    purpose: "Excludes an intermediate repository interface from instantiation.",
    howItWorks: "Used on shared base interfaces so Spring Data does not try to create a proxy for them.",
    example: "@NoRepositoryBean\ninterface BaseRepository<T, ID> extends Repository<T, ID> { }",
  },

  /* ---------------------------------------------------------------- */
  /* JPA mapping                                                       */
  /* ---------------------------------------------------------------- */
  {
    name: "@Entity",
    category: "jpa-mapping",
    target: "Class",
    purpose: "Marks a class as a persistent entity.",
    howItWorks: "Requires a no-arg constructor and an @Id. The class must not be final, and neither may any lazily-loaded property accessor.",
    example: "@Entity\npublic class Order { @Id Long id; }",
    gotcha:
      "Never use a record — entities must be mutable and proxyable. Also avoid Lombok's @Data on entities: the generated equals/hashCode touches lazy fields.",
    relatedQuestionIds: ["b014", "b016"],
  },
  {
    name: "@Table",
    category: "jpa-mapping",
    target: "Class",
    purpose: "Customises the table name, schema and constraints.",
    howItWorks: "Also carries `@Index` and `@UniqueConstraint` declarations used by schema generation.",
    example: '@Table(name = "orders", indexes = @Index(columnList = "customer_id"))',
  },
  {
    name: "@Id / @GeneratedValue",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Declares the primary key and its generation strategy.",
    howItWorks:
      "Strategies: AUTO, IDENTITY (database auto-increment), SEQUENCE (recommended — allows JDBC batching), TABLE (slow, avoid).",
    example: "@Id\n@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = \"order_seq\")\nprivate Long id;",
    gotcha: "IDENTITY forces an INSERT per persist and disables batch inserts. SEQUENCE with an allocation size is nearly always faster.",
  },
  {
    name: "@Column",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Maps a field to a column.",
    howItWorks: "Attributes: `name`, `nullable`, `unique`, `length`, `precision`, `scale`, `insertable`, `updatable`, `columnDefinition`.",
    example: '@Column(name = "total_cents", nullable = false, precision = 19, scale = 2)',
    gotcha: "`nullable = false` only affects schema generation — it is NOT runtime validation. Add @NotNull for that.",
  },
  {
    name: "@Transient",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Excludes a field from persistence.",
    howItWorks: "The JPA `jakarta.persistence.Transient` is unrelated to the Java `transient` keyword, which affects Java serialization.",
    example: "@Transient\nprivate BigDecimal displayTotal;",
  },
  {
    name: "@OneToMany / @ManyToOne / @OneToOne / @ManyToMany",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Maps entity relationships.",
    howItWorks:
      "`fetch` defaults to LAZY for the to-many sides and EAGER for the to-one sides. `mappedBy` names the owning side; `cascade` propagates operations; `orphanRemoval` deletes detached children.",
    example: '@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)\nprivate List<OrderItem> items = new ArrayList<>();',
    gotcha:
      "Always set @ManyToOne to LAZY explicitly — the EAGER default is the leading cause of accidental N+1 queries and huge object graphs.",
  },
  {
    name: "@JoinColumn / @JoinTable",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Names the foreign key column or the join table.",
    howItWorks: "@JoinColumn lives on the owning side; @JoinTable describes the association table for a many-to-many.",
    example: '@ManyToOne(fetch = FetchType.LAZY)\n@JoinColumn(name = "customer_id", nullable = false)\nprivate Customer customer;',
  },
  {
    name: "@Version",
    category: "jpa-mapping",
    target: "Field",
    purpose: "Enables optimistic locking.",
    howItWorks:
      "Hibernate adds the version to the WHERE clause on update and increments it. Zero rows updated means a concurrent modification, which raises `OptimisticLockException`.",
    example: "@Version\nprivate long version;",
    relatedQuestionIds: ["b102"],
  },
  {
    name: "@Enumerated",
    category: "jpa-mapping",
    target: "Field, Method",
    purpose: "Controls how an enum is persisted.",
    howItWorks: "ORDINAL (the default) stores the position; STRING stores the name.",
    example: "@Enumerated(EnumType.STRING)\nprivate OrderStatus status;",
    gotcha: "ALWAYS use STRING. With ORDINAL, reordering or inserting an enum constant silently corrupts every existing row.",
  },
  {
    name: "@Embeddable / @Embedded / @EmbeddedId",
    category: "jpa-mapping",
    target: "Class, Field",
    purpose: "Maps a value object into the owning table.",
    howItWorks: "The embeddable's columns are inlined. @AttributeOverride renames them when the same type is embedded twice.",
    example: "@Embeddable\npublic record Address(String street, String city) { }\n\n@Embedded\nprivate Address shippingAddress;",
  },
  {
    name: "@MappedSuperclass",
    category: "jpa-mapping",
    target: "Class",
    purpose: "Shares mapping state without being an entity itself.",
    howItWorks: "Fields are inherited by subclasses but the class has no table and cannot be queried or targeted by an association.",
    example: "@MappedSuperclass\npublic abstract class Auditable { @CreatedDate Instant createdAt; }",
  },
  {
    name: "@Inheritance / @DiscriminatorColumn",
    category: "jpa-mapping",
    target: "Class",
    purpose: "Maps an entity hierarchy to tables.",
    howItWorks:
      "SINGLE_TABLE (fast, but nullable columns), JOINED (normalised, needs joins), TABLE_PER_CLASS (union queries, avoid).",
    example: '@Inheritance(strategy = InheritanceType.SINGLE_TABLE)\n@DiscriminatorColumn(name = "payment_type")',
  },
  {
    name: "@PrePersist / @PreUpdate / @PostLoad",
    category: "jpa-mapping",
    target: "Method",
    purpose: "Entity lifecycle callbacks.",
    howItWorks: "Invoked by the persistence provider around flush and load. @EntityListeners moves them to a separate class.",
    example: "@PrePersist\nvoid onCreate() { createdAt = Instant.now(); }",
    gotcha: "Never call the EntityManager from inside a callback — the behaviour is undefined and Hibernate may deadlock.",
  },
  {
    name: "@NamedEntityGraph",
    category: "jpa-mapping",
    target: "Class",
    purpose: "Declares a reusable fetch plan on the entity.",
    howItWorks: "Referenced by name from @EntityGraph on a repository method.",
    example: '@NamedEntityGraph(name = "Order.withItems",\n    attributeNodes = @NamedAttributeNode("items"))',
  },

  /* ---------------------------------------------------------------- */
  /* Bean Validation                                                   */
  /* ---------------------------------------------------------------- */
  {
    name: "@Valid",
    category: "validation",
    target: "Parameter, Field, Method",
    purpose: "Triggers Bean Validation, and cascades into nested objects.",
    howItWorks:
      "Part of Jakarta Bean Validation. On a controller parameter it produces `MethodArgumentNotValidException` (400); on a field it cascades validation into the nested object.",
    example: "@PostMapping\nvoid create(@RequestBody @Valid CreateOrder request) { }",
    gotcha: "Only @Valid cascades — @Validated does not. You often need both: @Validated on the class, @Valid on the parameter.",
    relatedQuestionIds: ["b013"],
  },
  {
    name: "@Validated",
    category: "validation",
    target: "Class, Method, Parameter",
    purpose: "Spring's variant, adding validation groups and method validation.",
    howItWorks:
      "On a class it enables `MethodValidationPostProcessor`, so constraints on parameters and return values of any bean method are enforced, throwing `ConstraintViolationException`.",
    example: "@Service\n@Validated\npublic class OrderService {\n    void ship(@NotNull Long id, @Min(1) int qty) { }\n}",
    gotcha: "Method validation throws `ConstraintViolationException` (500 by default), not `MethodArgumentNotValidException` — handle it explicitly.",
    relatedQuestionIds: ["b013"],
  },
  {
    name: "@NotNull / @NotEmpty / @NotBlank",
    category: "validation",
    target: "Field, Parameter",
    purpose: "Three distinct emptiness checks.",
    howItWorks:
      "@NotNull rejects null only; @NotEmpty additionally rejects an empty String, Collection, Map or array; @NotBlank rejects a String that is null, empty or whitespace-only.",
    example: "@NotBlank private String name;\n@NotEmpty private List<Item> items;\n@NotNull private Long customerId;",
    gotcha: "@NotBlank applies to CharSequence only. Using it on a collection is a compile-time error you will hit at least once.",
  },
  {
    name: "@Size / @Min / @Max / @Positive / @Negative",
    category: "validation",
    target: "Field, Parameter",
    purpose: "Range and length constraints.",
    howItWorks: "@Size works on String, Collection, Map and array; @Min/@Max on numeric types; @Positive/@Negative with `OrZero` variants.",
    example: "@Size(min = 2, max = 100) private String name;\n@Positive private long amount;",
  },
  {
    name: "@Email / @Pattern",
    category: "validation",
    target: "Field, Parameter",
    purpose: "Format constraints.",
    howItWorks: "@Email applies a permissive RFC-ish regex; @Pattern takes your own regex and optional flags.",
    example: '@Email private String email;\n@Pattern(regexp = "^[A-Z]{3}$") private String currency;',
    gotcha: "@Email is deliberately loose — the only real validation of an email address is sending one.",
  },
  {
    name: "@Past / @Future / @PastOrPresent / @FutureOrPresent",
    category: "validation",
    target: "Field, Parameter",
    purpose: "Temporal constraints.",
    howItWorks: "Works with `java.time` types and legacy `Date`. The reference time comes from the validator's `ClockProvider`, which is what makes it testable.",
    example: "@Past private LocalDate dateOfBirth;",
  },
  {
    name: "@Constraint",
    category: "validation",
    target: "Annotation type",
    purpose: "Declares a custom validation annotation.",
    howItWorks:
      "Points at a `ConstraintValidator<A, T>` implementation. The validator is a Spring bean, so it can inject repositories for database-backed rules.",
    example:
      "@Constraint(validatedBy = UniqueEmailValidator.class)\n@Target(FIELD) @Retention(RUNTIME)\npublic @interface UniqueEmail {\n    String message() default \"already registered\";\n    Class<?>[] groups() default {};\n    Class<? extends Payload>[] payload() default {};\n}",
    gotcha: "The `message`, `groups` and `payload` attributes are mandatory — omitting them fails validator initialisation at runtime.",
    relatedQuestionIds: ["b013"],
  },

  /* ---------------------------------------------------------------- */
  /* Spring Security                                                   */
  /* ---------------------------------------------------------------- */
  {
    name: "@EnableWebSecurity",
    category: "spring-security",
    target: "Class",
    purpose: "Activates the Spring Security filter chain.",
    howItWorks:
      "Imports the web security configuration and registers `springSecurityFilterChain`. `debug = true` logs the whole filter list at startup.",
    example: "@Configuration\n@EnableWebSecurity\npublic class SecurityConfig { }",
    gotcha: "In Spring Security 6 you configure it by exposing a `SecurityFilterChain` bean, not by extending `WebSecurityConfigurerAdapter` (removed).",
    relatedQuestionIds: ["b107", "b112"],
  },
  {
    name: "@EnableMethodSecurity",
    category: "spring-security",
    target: "Class",
    purpose: "Activates method-level authorization.",
    howItWorks: "`prePostEnabled` defaults to true in Spring Security 6; `securedEnabled` and `jsr250Enabled` are opt-in.",
    example: "@Configuration\n@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)",
    gotcha: "Replaces the removed @EnableGlobalMethodSecurity.",
    relatedQuestionIds: ["b113"],
  },
  {
    name: "@PreAuthorize",
    category: "spring-security",
    target: "Method, Class",
    purpose: "Authorization check evaluated before the method runs.",
    howItWorks:
      "Full SpEL with access to `authentication`, `principal`, method arguments via `#name`, and beans via `@beanName`.",
    example: "@PreAuthorize(\"hasRole('ADMIN') or #ownerId == authentication.name\")\npublic Document find(String ownerId) { ... }",
    gotcha: "Proxy-based — self-invocation bypasses it entirely, just like @Transactional.",
    relatedQuestionIds: ["b113"],
  },
  {
    name: "@PostAuthorize",
    category: "spring-security",
    target: "Method",
    purpose: "Authorization check evaluated after the method returns.",
    howItWorks: "The return value is available as `returnObject`.",
    example: '@PostAuthorize("returnObject.ownerId == authentication.name")\npublic Document find(Long id) { ... }',
    gotcha: "The method has ALREADY executed — never use it on anything with side effects.",
    relatedQuestionIds: ["b113"],
  },
  {
    name: "@PreFilter / @PostFilter",
    category: "spring-security",
    target: "Method",
    purpose: "Filters elements out of a collection argument or return value.",
    howItWorks: "Each element is bound to `filterObject` and removed when the expression is false.",
    example: '@PostFilter("filterObject.ownerId == authentication.name")\npublic List<Document> findAll() { ... }',
    gotcha: "In-memory filtering after the query has already loaded everything — never use it on a large result set.",
    relatedQuestionIds: ["b113"],
  },
  {
    name: "@Secured / @RolesAllowed",
    category: "spring-security",
    target: "Method, Class",
    purpose: "Simple role-list authorization.",
    howItWorks: "@Secured is Spring's legacy form and needs the full `ROLE_` prefix; @RolesAllowed is the JSR-250 equivalent.",
    example: '@Secured({"ROLE_ADMIN", "ROLE_OPS"})\npublic void adminOnly() { }',
    gotcha: "Neither supports SpEL. Prefer @PreAuthorize unless portability matters.",
  },
  {
    name: "@AuthenticationPrincipal",
    category: "spring-security",
    target: "Parameter",
    purpose: "Injects the current principal into a handler method.",
    howItWorks: "Resolved by `AuthenticationPrincipalArgumentResolver`; `expression` can navigate into the principal object.",
    example: "@GetMapping(\"/me\")\nString me(@AuthenticationPrincipal UserDetails user) { return user.getUsername(); }",
    gotcha: "Cleaner than reaching for `SecurityContextHolder` inside the controller, and far easier to test.",
    relatedQuestionIds: ["b109"],
  },
  {
    name: "@WithMockUser / @WithUserDetails / @WithAnonymousUser",
    category: "spring-security",
    target: "Method, Class (test)",
    purpose: "Populates a SecurityContext for a test.",
    howItWorks:
      "`WithSecurityContextTestExecutionListener` sets the context before the test. @WithMockUser fabricates a principal; @WithUserDetails loads through the real `UserDetailsService`.",
    example: '@Test\n@WithMockUser(username = "alice", roles = "ADMIN")\nvoid adminCanDelete() { }',
    gotcha: "`roles = \"ADMIN\"` becomes `ROLE_ADMIN`, but `authorities = \"ROLE_ADMIN\"` must include the prefix yourself.",
    relatedQuestionIds: ["b121"],
  },

  /* ---------------------------------------------------------------- */
  /* Testing                                                           */
  /* ---------------------------------------------------------------- */
  {
    name: "@SpringBootTest",
    category: "testing",
    target: "Class",
    purpose: "Loads the full application context for an integration test.",
    howItWorks:
      "`webEnvironment` selects MOCK (default), RANDOM_PORT, DEFINED_PORT or NONE. Contexts are cached and reused across test classes with identical configuration.",
    example: "@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)\nclass OrderApiTest { }",
    gotcha: "Every distinct combination of @MockBean, properties or profiles creates a NEW cached context — the main cause of slow test suites.",
    relatedQuestionIds: ["b015"],
  },
  {
    name: "@WebMvcTest",
    category: "testing",
    target: "Class",
    purpose: "Slice test for the web layer only.",
    howItWorks:
      "Loads controllers, `@ControllerAdvice`, converters, `WebMvcConfigurer`s and filters — but no services or repositories. Auto-configures `MockMvc`.",
    example: "@WebMvcTest(OrderController.class)\nclass OrderControllerTest { @Autowired MockMvc mvc; }",
    gotcha: "Your security configuration is NOT picked up automatically unless it is in a scanned location — @Import it.",
    relatedQuestionIds: ["b121"],
  },
  {
    name: "@DataJpaTest",
    category: "testing",
    target: "Class",
    purpose: "Slice test for the persistence layer.",
    howItWorks:
      "Loads entities and repositories, replaces the DataSource with an embedded one by default, and wraps each test in a transaction that is rolled back.",
    example: "@DataJpaTest\n@AutoConfigureTestDatabase(replace = Replace.NONE)\nclass OrderRepositoryTest { }",
    gotcha: "Testing against H2 when production runs PostgreSQL hides dialect bugs — use Testcontainers plus `replace = NONE`.",
  },
  {
    name: "@MockBean / @SpyBean",
    category: "testing",
    target: "Field, Class",
    purpose: "Replaces or wraps a bean in the test context with a Mockito mock.",
    howItWorks: "Registers the mock in the context and resets it between tests.",
    example: "@MockBean\nprivate PaymentGateway gateway;",
    gotcha:
      "Deprecated in Spring Boot 3.4 in favour of `@MockitoBean`/`@MockitoSpyBean`. Each distinct set of mocks also invalidates the cached context.",
  },
  {
    name: "@TestConfiguration",
    category: "testing",
    target: "Class",
    purpose: "Extra beans for tests, without replacing the main configuration.",
    howItWorks: "Unlike a plain @Configuration it is not picked up by component scanning — it must be nested in the test or explicitly imported.",
    example: "@TestConfiguration\nstatic class Clocks { @Bean Clock clock() { return Clock.fixed(...); } }",
  },
  {
    name: "@ActiveProfiles / @TestPropertySource / @DynamicPropertySource",
    category: "testing",
    target: "Class, Method",
    purpose: "Controls configuration for a test context.",
    howItWorks: "@DynamicPropertySource is the one that matters for Testcontainers — it registers properties computed at runtime.",
    example:
      '@DynamicPropertySource\nstatic void props(DynamicPropertyRegistry registry) {\n    registry.add("spring.datasource.url", postgres::getJdbcUrl);\n}',
  },
  {
    name: "@Test / @BeforeEach / @AfterEach / @BeforeAll / @AfterAll",
    category: "testing",
    target: "Method",
    purpose: "JUnit 5 lifecycle.",
    howItWorks:
      "@BeforeAll and @AfterAll must be static unless the class uses `@TestInstance(PER_CLASS)`. JUnit 5 annotations live in `org.junit.jupiter.api`.",
    example: "@BeforeEach\nvoid setUp() { repository.deleteAll(); }",
  },
  {
    name: "@ParameterizedTest / @ValueSource / @CsvSource / @MethodSource",
    category: "testing",
    target: "Method",
    purpose: "Runs one test with many inputs.",
    howItWorks: "@MethodSource references a static factory returning a `Stream<Arguments>` — the right tool for an authorization matrix.",
    example: '@ParameterizedTest\n@CsvSource({"/api/admin, USER, 403", "/api/admin, ADMIN, 200"})\nvoid matrix(String path, String role, int status) { }',
    relatedQuestionIds: ["b121"],
  },
  {
    name: "@Nested / @DisplayName / @Tag / @Disabled",
    category: "testing",
    target: "Class, Method",
    purpose: "Organises and documents a test suite.",
    howItWorks: "@Nested groups related tests with shared setup; @Tag drives inclusion/exclusion in CI.",
    example: '@Nested\n@DisplayName("when the order is already shipped")\nclass WhenShipped { }',
  },
  {
    name: "@Testcontainers / @Container",
    category: "testing",
    target: "Class, Field",
    purpose: "Manages Docker containers for integration tests.",
    howItWorks: "A static @Container is started once per class; an instance field restarts per test. Combine with @DynamicPropertySource to wire the URL.",
    example: '@Testcontainers\nclass RepositoryTest {\n    @Container static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");\n}',
  },

  /* ---------------------------------------------------------------- */
  /* Jackson                                                           */
  /* ---------------------------------------------------------------- */
  {
    name: "@JsonProperty",
    category: "jackson",
    target: "Field, Method, Parameter",
    purpose: "Renames a property or marks it required.",
    howItWorks: "Also used on constructor parameters (with @JsonCreator) when the class is not compiled with `-parameters`.",
    example: '@JsonProperty("order_id")\nprivate Long orderId;',
    relatedQuestionIds: ["b036"],
  },
  {
    name: "@JsonIgnore / @JsonIgnoreProperties",
    category: "jackson",
    target: "Field, Method, Class",
    purpose: "Excludes properties from serialization.",
    howItWorks: "@JsonIgnoreProperties(ignoreUnknown = true) also makes deserialization tolerant of extra fields.",
    example: "@JsonIgnore\nprivate String passwordHash;",
    gotcha: "Relying on @JsonIgnore to hide sensitive data is fragile — prefer a dedicated DTO over exposing the entity.",
    relatedQuestionIds: ["b036"],
  },
  {
    name: "@JsonFormat",
    category: "jackson",
    target: "Field, Method, Class",
    purpose: "Controls date, number and enum formatting.",
    howItWorks: "`shape`, `pattern` and `timezone` drive the serializer. For `java.time` you need the JSR-310 module, which Boot registers automatically.",
    example: '@JsonFormat(shape = Shape.STRING, pattern = "yyyy-MM-dd\'T\'HH:mm:ssXXX")\nprivate Instant createdAt;',
  },
  {
    name: "@JsonInclude",
    category: "jackson",
    target: "Field, Class",
    purpose: "Omits values from output.",
    howItWorks: "NON_NULL, NON_EMPTY, NON_DEFAULT and NON_ABSENT (for `Optional`).",
    example: "@JsonInclude(JsonInclude.Include.NON_NULL)\npublic class OrderResponse { }",
  },
  {
    name: "@JsonCreator / @JsonValue",
    category: "jackson",
    target: "Constructor, Method",
    purpose: "Custom construction and single-value serialization.",
    howItWorks: "@JsonCreator marks the constructor or factory to deserialise with; @JsonValue makes one method the entire serialised form.",
    example: "@JsonCreator\npublic Money(@JsonProperty(\"amount\") long amount) { ... }\n\n@JsonValue\npublic String toString() { return code; }",
  },
  {
    name: "@JsonTypeInfo / @JsonSubTypes",
    category: "jackson",
    target: "Class",
    purpose: "Polymorphic serialization with a type discriminator.",
    howItWorks: "Writes a type property and uses it to pick the concrete class on the way back.",
    example:
      '@JsonTypeInfo(use = Id.NAME, property = "type")\n@JsonSubTypes({@Type(value = CardPayment.class, name = "card")})\npublic sealed interface Payment { }',
    gotcha:
      "NEVER enable Jackson's `activateDefaultTyping` on untrusted input — it is a remote code execution vector (OWASP A08).",
    relatedQuestionIds: ["b122"],
  },
  {
    name: "@JsonView",
    category: "jackson",
    target: "Field, Method",
    purpose: "Serialises different subsets of a class per endpoint.",
    howItWorks: "Spring MVC honours @JsonView on a controller method and filters the properties accordingly.",
    example: "@JsonView(Views.Public.class)\nprivate String name;",
  },

  /* ---------------------------------------------------------------- */
  /* Lombok                                                            */
  /* ---------------------------------------------------------------- */
  {
    name: "@Data",
    category: "lombok",
    target: "Class",
    purpose: "Generates getters, setters, equals, hashCode, toString and a required-args constructor.",
    howItWorks:
      "An annotation processor mutates the AST during compilation, so the generated members exist in the class file but not in your source.",
    example: "@Data\npublic class OrderDto { private Long id; private String status; }",
    gotcha:
      "Never on a JPA entity: the generated equals/hashCode touch every field (triggering lazy loading) and change as the id is assigned, breaking Set membership. Never on a mutable class used as a HashMap key.",
    relatedQuestionIds: ["b016", "b074"],
  },
  {
    name: "@Builder",
    category: "lombok",
    target: "Class, Constructor, Method",
    purpose: "Generates a fluent builder.",
    howItWorks: "`@Builder.Default` preserves field initialisers; `toBuilder = true` allows copy-and-modify.",
    example: "@Builder(toBuilder = true)\npublic record Order(Long id, String status) { }",
    gotcha: "It silently bypasses constructor validation — validate inside a private constructor or the build method.",
  },
  {
    name: "@Getter / @Setter",
    category: "lombok",
    target: "Class, Field",
    purpose: "Generates accessors.",
    howItWorks: "Can be scoped per field and given an access level, e.g. `@Setter(AccessLevel.PRIVATE)`.",
    example: "@Getter\n@Setter(AccessLevel.PROTECTED)\nprivate String status;",
  },
  {
    name: "@NoArgsConstructor / @AllArgsConstructor / @RequiredArgsConstructor",
    category: "lombok",
    target: "Class",
    purpose: "Generates constructors.",
    howItWorks: "@RequiredArgsConstructor covers `final` and `@NonNull` fields — the idiomatic pairing with Spring constructor injection.",
    example: "@Service\n@RequiredArgsConstructor\npublic class OrderService { private final OrderRepository repository; }",
    gotcha: "@AllArgsConstructor on a class with several same-typed fields makes argument transposition trivially easy and invisible.",
  },
  {
    name: "@Slf4j",
    category: "lombok",
    target: "Class",
    purpose: "Generates a static SLF4J logger field.",
    howItWorks: "Adds `private static final Logger log = LoggerFactory.getLogger(Type.class);`.",
    example: '@Slf4j\npublic class OrderService { void go() { log.info("started"); } }',
  },
  {
    name: "@Value (Lombok)",
    category: "lombok",
    target: "Class",
    purpose: "Makes an immutable class: final fields, getters, no setters.",
    howItWorks: "Equivalent to `@Getter @FieldDefaults(makeFinal = true) @AllArgsConstructor @ToString @EqualsAndHashCode`.",
    example: "@Value\npublic class Money { long amount; String currency; }",
    gotcha: "Easily confused with Spring's `@Value` for property injection — a Java `record` is usually the better choice today.",
  },
  {
    name: "@SneakyThrows",
    category: "lombok",
    target: "Method, Constructor",
    purpose: "Throws a checked exception without declaring it.",
    howItWorks: "Exploits the fact that the JVM does not enforce checked exceptions — only the compiler does.",
    example: "@SneakyThrows\npublic String read(Path path) { return Files.readString(path); }",
    gotcha: "Callers cannot see or handle what they cannot compile against. Use sparingly, and never across an API boundary.",
  },
];

/** Grouped view used by the reference page. */
export const ANNOTATIONS_BY_CATEGORY: Record<string, AnnotationEntry[]> = ANNOTATION_CATEGORIES.reduce(
  (accumulator, category) => {
    accumulator[category.id] = ANNOTATION_CATALOGUE.filter((entry) => entry.category === category.id);
    return accumulator;
  },
  {} as Record<string, AnnotationEntry[]>,
);

export const ANNOTATION_COUNT = ANNOTATION_CATALOGUE.length;

if (import.meta.env?.DEV) {
  const known = new Set(ANNOTATION_CATEGORIES.map((category) => category.id));
  const unknown = ANNOTATION_CATALOGUE.filter((entry) => !known.has(entry.category));
  if (unknown.length > 0) {
    console.error(
      `[backendInterview/annotations] unknown categories: ${unknown.map((e) => `${e.name}:${e.category}`).join(", ")}`,
    );
  }
}
