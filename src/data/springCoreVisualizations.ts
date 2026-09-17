import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Core — Diagram Data                                                */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer      */
/*  (layers / hierarchy / flow / table-visual / graph), so the visual style    */
/*  matches every other diagram in the app. Attached via `attachDiagrams()`.   */
/* -------------------------------------------------------------------------- */

export const springCoreVisualizations: Record<string, Diagram> = {
  /* ── Introduction to Spring Framework ── */
  "spring-intro": {
    type: "table-visual",
    title: "What Spring Actually Gives You",
    data: [
      {
        label: "IoC Container",
        color: "primary",
        children: [
          { label: "Creates and wires objects" },
          { label: "BeanFactory / ApplicationContext" },
        ],
      },
      {
        label: "Dependency Injection",
        color: "info",
        children: [
          { label: "Constructor / setter / field" },
          { label: "Resolution by type + qualifiers" },
        ],
      },
      {
        label: "AOP Proxies",
        color: "accent",
        children: [
          { label: "@Transactional, @Async, @Cacheable" },
          { label: "Cross-cutting concerns" },
        ],
      },
      {
        label: "Portable Abstractions",
        color: "success",
        children: [
          { label: "JDBC, ORM, MVC, messaging" },
          { label: "Framework-independent code" },
        ],
      },
    ],
  },

  /* ── Dependency Injection ── */
  "spring-di": {
    type: "table-visual",
    title: "Injection Styles — Trade-offs",
    data: [
      {
        label: "Constructor Injection",
        color: "success",
        children: [
          { label: "Fields can be final" },
          { label: "Mandatory by signature" },
          { label: "Plain `new` in unit tests" },
          { label: "Cycles fail fast at startup" },
        ],
      },
      {
        label: "Setter Injection",
        color: "warning",
        children: [
          { label: "Optional / re-configurable" },
          { label: "Wires after instantiation" },
          { label: "Breaks setter-level cycles" },
          { label: "@Autowired(required = false)" },
        ],
      },
      {
        label: "Field Injection",
        color: "muted",
        children: [
          { label: "Reflection, cannot be final" },
          { label: "Hidden dependency graph" },
          { label: "Nulls in tests" },
          { label: "Discouraged in production" },
        ],
      },
    ],
  },

  /* ── Bean Scopes ── */
  "spring-bean-scopes": {
    type: "table-visual",
    title: "Bean Scopes — Instances & Lifetime",
    data: [
      {
        label: "singleton (default)",
        color: "primary",
        children: [
          { label: "One instance per container" },
          { label: "Created eagerly at refresh()" },
          { label: "Destroyed on context close" },
        ],
      },
      {
        label: "prototype",
        color: "warning",
        children: [
          { label: "New instance per lookup" },
          { label: "Init callbacks run" },
          { label: "Destroy callbacks NEVER run" },
        ],
      },
      {
        label: "request / session",
        color: "info",
        children: [
          { label: "One per HTTP request / HttpSession" },
          { label: "Needs bound RequestAttributes" },
          { label: "Defaults to TARGET_CLASS proxy" },
        ],
      },
      {
        label: "application / websocket",
        color: "accent",
        children: [
          { label: "One per ServletContext" },
          { label: "Stored as scope attributes" },
          { label: "Web-context only" },
        ],
      },
      {
        label: "Custom Scope",
        color: "muted",
        children: [
          { label: "Implements org.springframework...Scope" },
          { label: "registerScope(\"thread\", ...)" },
          { label: "SimpleThreadScope ships built-in" },
        ],
      },
    ],
  },

  /* ── Autowiring ── */
  "spring-autowiring": {
    type: "flow",
    title: "@Autowired Resolution Order",
    direction: "vertical",
    data: [
      {
        label: "Declared type (+ generics via ResolvableType)",
        color: "info",
        children: [{ label: "findAutowireCandidates()" }],
      },
      {
        label: "Multiple candidates → @Primary / @Priority",
        color: "warning",
        children: [{ label: "Default choice" }],
      },
      {
        label: "@Qualifier (string or custom annotation)",
        color: "accent",
        children: [{ label: "Specific bean wins" }],
      },
      {
        label: "Injection-point name == bean name",
        color: "primary",
        children: [{ label: "Implicit byName fallback" }],
      },
      {
        label: "List<T> / Set<T> / Map<String,T>",
        color: "success",
        children: [{ label: "Collect all, sorted by @Order" }],
      },
      {
        label: "NoUniqueBeanDefinitionException",
        color: "muted",
        children: [{ label: "Or NoSuchBeanDefinitionException when 0" }],
      },
    ],
  },
  /* ── Java-based Configuration ── */
  "spring-java-config": {
    type: "table-visual",
    title: "@Configuration — Full Mode vs Lite Mode",
    data: [
      {
        label: "@Configuration (full mode)",
        color: "primary",
        children: [
          { label: "CGLIB-enhanced subclass" },
          { label: "BeanMethodInterceptor intercepts calls" },
          { label: "Inter-@Bean call returns the singleton" },
          { label: "default proxyBeanMethods = true" },
        ],
      },
      {
        label: "proxyBeanMethods = false (lite)",
        color: "success",
        children: [
          { label: "No CGLIB subclass" },
          { label: "Each call really creates an object" },
          { label: "Wire via method parameters" },
          { label: "Used by Boot auto-configurations" },
        ],
      },
      {
        label: "@Import flavours",
        color: "accent",
        children: [
          { label: "plain class" },
          { label: "ImportSelector → class names" },
          { label: "ImportBeanDefinitionRegistrar" },
          { label: "Powers every @EnableXxx" },
        ],
      },
      {
        label: "@Bean metadata",
        color: "info",
        children: [
          { label: "name / aliases" },
          { label: "initMethod" },
          { label: "destroyMethod — INFER close()/shutdown()" },
          { label: "@Scope, @Lazy, @Primary, @Profile" },
        ],
      },
    ],
  },

  /* ── Annotation-based Configuration ── */
  "spring-annotation-config": {
    type: "hierarchy",
    title: "Stereotype Annotations — One Ancestor",
    data: [
      {
        label: "@Component — generic bean",
        color: "primary",
        children: [
          {
            label: "@Service — business layer",
            color: "info",
            children: [{ label: "Semantic only — same detection as @Component" }],
          },
          {
            label: "@Repository — persistence layer",
            color: "warning",
            children: [
              { label: "PersistenceExceptionTranslationPostProcessor" },
              { label: "Vendor exceptions → DataAccessException" },
            ],
          },
          {
            label: "@Controller — web layer",
            color: "success",
            children: [
              { label: "@RestController = @Controller + @ResponseBody" },
              { label: "Also @ControllerAdvice, @RestControllerAdvice" },
            ],
          },
        ],
      },
      {
        label: "Meta-reading — MergedAnnotations / AnnotatedElementUtils",
        color: "accent",
        children: [
          { label: "DIRECT · INHERITED_ANNOTATIONS · META_ANNOTATIONS · TYPE_HIERARCHY" },
          { label: "@AliasFor bridges attributes across the annotation tree" },
        ],
      },
    ],
  },

  /* ── Component Scanning ── */
  "spring-component-scan": {
    type: "flow",
    title: "@ComponentScan — Classpath Walk to BeanDefinition",
    direction: "vertical",
    data: [
      {
        label: "Base package (annotated class package, recursive)",
        color: "info",
        children: [{ label: "basePackageClasses is the refactor-safe form" }],
      },
      {
        label: "PathMatchingResourcePatternResolver",
        color: "primary",
        children: [{ label: "classpath*:com/example/**/*.class — jar & BOOT-INF aware" }],
      },
      {
        label: "SimpleMetadataReader reads bytecode with ASM",
        color: "warning",
        children: [{ label: "No Class.forName → conditions decide before linkage" }],
      },
      {
        label: "isCandidateComponent — concrete + independent + @Component-annotated",
        color: "accent",
        children: [{ label: "includeFilters / excludeFilters narrow the set" }],
      },
      {
        label: "AnnotatedGenericBeanDefinition registered",
        color: "success",
        children: [{ label: "Named by the BeanNameGenerator — @Scope/@Lazy honoured" }],
      },
    ],
  },

  /* ── Profiles ── */
  "spring-profiles": {
    type: "flow",
    title: "Profile Activation & Definition Gating",
    direction: "vertical",
    data: [
      {
        label: "Activation sources (highest wins)",
        color: "primary",
        children: [
          { label: "--spring.profiles.active=prod" },
          { label: "SPRING_PROFILES_ACTIVE env var" },
          { label: "-Dspring.profiles.active=prod" },
          { label: "@ActiveProfiles in tests" },
        ],
      },
      {
        label: "Environment holds active + default profiles",
        color: "info",
        children: [{ label: "spring.profiles.default → used when nothing active" }],
      },
      {
        label: "@Profile(\"prod & !mock\") = OnProfileCondition",
        color: "accent",
        children: [{ label: "Boolean expression since Spring 5.1; array means OR" }],
      },
      {
        label: "Inactive definition is never registered",
        color: "muted",
        children: [{ label: "No class loading, no instance, no startup cost" }],
      },
      {
        label: "Active definition joins the graph",
        color: "success",
        children: [{ label: "Profile-specific application-{profile}.yml values apply" }],
      },
    ],
  },
  /* ── @Value & Property Sources ── */
  "spring-value": {
    type: "table-visual",
    title: "Placeholder vs SpEL — Two Different Machines",
    data: [
      {
        label: "${key:default} — placeholder",
        color: "info",
        children: [
          { label: "PropertySourcesPlaceholderConfigurer (BFPP)" },
          { label: "Bean-definition phase, textual substitution" },
          { label: "Resolved against Environment property sources" },
          { label: "Missing key + no default → startup failure" },
        ],
      },
      {
        label: "#{...} — SpEL expression",
        color: "accent",
        children: [
          { label: "StandardBeanExpressionResolver" },
          { label: "Evaluated at bean creation" },
          { label: "Methods, arithmetic, T(...), @beanName" },
          { label: "Can nest a placeholder inside it" },
        ],
      },
      {
        label: "Property source precedence",
        color: "primary",
        children: [
          { label: "Command-line args → OS env → System props" },
          { label: "profile-specific application-{profile}.*" },
          { label: "@PropertySource files, then defaults" },
        ],
      },
      {
        label: "@Value limits",
        color: "warning",
        children: [
          { label: "No relaxed binding — exact key match" },
          { label: "No static fields, no non-bean classes" },
          { label: "Use @ConfigurationProperties for groups" },
        ],
      },
    ],
  },

  /* ── BeanPostProcessor & BeanFactoryPostProcessor ── */
  "spring-postprocessor": {
    type: "flow",
    title: "Post-Processor Seams Inside refresh()",
    direction: "vertical",
    data: [
      {
        label: "BeanDefinitionRegistryPostProcessor.postProcessBeanDefinitionRegistry",
        color: "accent",
        children: [{ label: "ConfigurationClassPostProcessor — @Configuration, @Import, scan" }],
      },
      {
        label: "BeanFactoryPostProcessor.postProcessBeanFactory",
        color: "warning",
        children: [{ label: "PropertySourcesPlaceholderConfigurer rewrites definition values" }],
      },
      {
        label: "InstantiationAwareBeanPostProcessor.postProcessProperties",
        color: "info",
        children: [{ label: "@Autowired · @Value · @Resource injection happens here" }],
      },
      {
        label: "BeanPostProcessor.postProcessBeforeInitialization",
        color: "primary",
        children: [{ label: "@PostConstruct → afterPropertiesSet → init-method" }],
      },
      {
        label: "BeanPostProcessor.postProcessAfterInitialization",
        color: "success",
        children: [{ label: "AOP proxy returned — getBean() hands out the proxy" }],
      },
      {
        label: "SmartInitializingSingleton.afterSingletonsInstantiated()",
        color: "muted",
        children: [{ label: "Every singleton exists — @Scheduled / @EventListener finalisation" }],
      },
    ],
  },

  /* ── SpEL ── */
  "spring-spel": {
    type: "flow",
    title: "SpEL — Parse Once, Evaluate Anywhere",
    direction: "horizontal",
    data: [
      { label: "Expression string", color: "primary" },
      {
        label: "SpelExpressionParser",
        color: "info",
        children: [{ label: "SpelParseException on syntax error" }],
      },
      { label: "Expression\n(immutable — cache it)", color: "accent" },
      {
        label: "EvaluationContext",
        color: "warning",
        children: [
          { label: "root object + variables" },
          { label: "property accessors, TypeLocator" },
          { label: "BeanResolver — @beanName" },
        ],
      },
      { label: "Result\nconverted via TypeConverter", color: "success" },
    ],
  },
};
