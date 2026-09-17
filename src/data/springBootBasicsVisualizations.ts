import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Basics — Diagram Data                                        */
/*  Keyed by ContentSection `id`; rendered by the shared DiagramRenderer.     */
/* -------------------------------------------------------------------------- */

export const springBootBasicsVisualizations: Record<string, Diagram> = {
  /* ── Spring Boot vs Spring Framework ── */
  "sb-vs-spring": {
    type: "table-visual",
    title: "Spring Framework vs Spring Boot",
    data: [
      {
        label: "Spring Framework",
        color: "info",
        children: [
          { label: "IoC/DI container, AOP, abstractions" },
          { label: "Manual DispatcherServlet, DataSource" },
          { label: "WAR on an external server" },
        ],
      },
      {
        label: "Spring Boot",
        color: "primary",
        children: [
          { label: "Auto-configuration + starters" },
          { label: "Embedded Tomcat/Jetty/Undertow" },
          { label: "Executable fat JAR + Actuator" },
        ],
      },
      {
        label: "Override rule",
        color: "success",
        children: [
          { label: "Your @Bean always wins" },
          { label: "@ConditionalOnMissingBean backs off" },
        ],
      },
    ],
  },

  /* ── Auto-Configuration Internals ── */
  "sb-autoconfig": {
    type: "flow",
    title: "How Auto-Configuration Decides",
    direction: "vertical",
    data: [
      {
        label: "AutoConfiguration.imports on the classpath",
        color: "info",
        children: [{ label: "META-INF/spring/...AutoConfiguration.imports" }],
      },
      {
        label: "@Import(AutoConfigurationImportSelector) via @EnableAutoConfiguration",
        color: "primary",
        children: [{ label: "Candidate configurations collected & sorted" }],
      },
      {
        label: "@ConditionalOnClass · @ConditionalOnBean · @ConditionalOnProperty",
        color: "warning",
        children: [{ label: "Evaluated before the class is loaded" }],
      },
      {
        label: "@ConditionalOnMissingBean → back off",
        color: "accent",
        children: [{ label: "You declared your own bean → Boot stays out" }],
      },
      {
        label: "Bean definitions registered during refresh()",
        color: "success",
        children: [{ label: "Not compile-time code generation" }],
      },
    ],
  },

  /* ── @SpringBootApplication ── */
  "sb-springbootapp": {
    type: "layers",
    title: "@SpringBootApplication — Meta-Annotation Composition",
    data: [
      {
        label: "@SpringBootApplication",
        color: "primary",
        children: [
          { label: "@SpringBootConfiguration — a @Configuration class" },
          { label: "@EnableAutoConfiguration — @Import(AutoConfigurationImportSelector)" },
          { label: "@ComponentScan — + TypeExcludeFilter, AutoConfigurationExcludeFilter" },
        ],
      },
      {
        label: "Placed in the ROOT package",
        color: "info",
        children: [
          { label: "Scan base package = the main class's package" },
          { label: "Sub-packages are scanned recursively" },
        ],
      },
      {
        label: "Tuning knobs",
        color: "accent",
        children: [
          { label: "exclude = { SecurityAutoConfiguration.class }" },
          { label: "scanBasePackages / scanBasePackageClasses" },
          { label: "@Bean factory methods allowed on the main class" },
        ],
      },
    ],
  },
  /* ── Starters ── */
  "sb-starters": {
    type: "flow",
    title: "Anatomy of a Starter",
    direction: "horizontal",
    data: [
      { label: "spring-boot-starter-web", color: "primary" },
      {
        label: "Transitive dependencies",
        color: "info",
        children: [
          { label: "spring-webmvc" },
          { label: "tomcat-embed-core" },
          { label: "jackson-databind" },
        ],
      },
      {
        label: "spring-boot-dependencies BOM",
        color: "warning",
        children: [{ label: "Tested, compatible versions" }],
      },
      { label: "No <version> in your POM", color: "success" },
    ],
  },

  /* ── application.properties vs application.yml ── */
  "sb-config-files": {
    type: "table-visual",
    title: "properties vs YAML — Same Environment",
    data: [
      {
        label: "application.properties",
        color: "info",
        children: [
          { label: "Flat key=value pairs" },
          { label: "Prefixes repeated per line" },
          { label: "Wins when both exist beside each other" },
        ],
      },
      {
        label: "application.yml",
        color: "primary",
        children: [
          { label: "Hierarchical, no repeated prefixes" },
          { label: "Indentation is significant — 2 spaces, never tabs" },
          { label: "Multi-document with --- separators" },
        ],
      },
      {
        label: "Both produce",
        color: "success",
        children: [
          { label: "One spring Environment property set" },
          { label: "Same relaxed-binding rules" },
        ],
      },
    ],
  },

  /* ── Externalized Configuration ── */
  "sb-externalized": {
    type: "flow",
    title: "Externalised Config Precedence (first wins)",
    direction: "vertical",
    data: [
      { label: "Command-line arguments", color: "primary", children: [{ label: "--server.port=9090" }] },
      { label: "OS environment variables", color: "info", children: [{ label: "SERVER_PORT / SPRING_PROFILES_ACTIVE" }] },
      { label: "Profile-specific config", color: "warning", children: [{ label: "application-prod.yml" }] },
      { label: "application.yml / .properties", color: "accent", children: [{ label: "Bundled defaults inside the JAR" }] },
      {
        label: "Relaxed binding normalises all of them",
        color: "success",
        children: [{ label: "kebab-case · camelCase · UPPER_SNAKE_CASE" }, { label: "One artifact, every environment" }],
      },
    ],
  },

  /* ── @ConfigurationProperties ── */
  "sb-configuration-props": {
    type: "layers",
    title: "@ConfigurationProperties — Type-Safe Binding",
    data: [
      {
        label: "prefix = \"shop.pricing\"",
        color: "primary",
        children: [
          { label: "Java 17 immutable record + @ConstructorBinding" },
          { label: "Nested objects, List/Map, Duration, DataSize" },
          { label: "Relaxed binding — no exact-key strings" },
        ],
      },
      {
        label: "@Validated + Jakarta Validation",
        color: "warning",
        children: [{ label: "@NotNull, @Min, @Pattern → fail-fast at startup" }],
      },
      {
        label: "spring-boot-configuration-processor",
        color: "accent",
        children: [{ label: "IDE autocompletion + metadata JSON" }],
      },
    ],
  },

  /* ── Profiles in Spring Boot ── */
  "sb-profiles": {
    type: "table-visual",
    title: "One Artifact, Many Environments",
    data: [
      {
        label: "application.yml",
        color: "muted",
        children: [{ label: "Shared, environment-neutral defaults" }],
      },
      {
        label: "application-dev.yml",
        color: "success",
        children: [{ label: "@Profile(\"dev\") beans" }, { label: "Local H2 / verbose logging" }],
      },
      {
        label: "application-qa.yml",
        color: "info",
        children: [{ label: "@Profile(\"qa\") beans" }, { label: "Test doubles, seeded data" }],
      },
      {
        label: "application-prod.yml",
        color: "warning",
        children: [{ label: "@Profile(\"prod\") beans" }, { label: "Secrets via placeholder references" }],
      },
      {
        label: "Activation",
        color: "primary",
        children: [
          { label: "spring.profiles.active" },
          { label: "SPRING_PROFILES_ACTIVE" },
          { label: "spring.profiles.group" },
        ],
      },
    ],
  },
  /* ── Logging ── */
  "sb-logging": {
    type: "layers",
    title: "Logging Stack — Facade over Implementation",
    data: [
      {
        label: "Your code logs through SLF4J",
        color: "primary",
        children: [{ label: "Logger logger = LoggerFactory.getLogger(OrderService.class)" }],
      },
      {
        label: "Implementation: Logback (default)",
        color: "info",
        children: [
          { label: "Swap to Log4j2 by excluding spring-boot-starter-logging" },
          { label: "logback-spring.xml for profile-aware config" },
        ],
      },
      {
        label: "Runtime control",
        color: "accent",
        children: [
          { label: "logging.level.<package>=DEBUG in application.yml" },
          { label: "Structured JSON logging for ELK / Datadog" },
        ],
      },
    ],
  },

  /* ── Building & Running ── */
  "sb-build-run": {
    type: "flow",
    title: "From Source to Executable Fat JAR",
    direction: "horizontal",
    data: [
      { label: "mvn package\n(or gradle build)", color: "primary" },
      {
        label: "spring-boot-maven-plugin\nrepackage",
        color: "info",
        children: [{ label: "Nested JARs under BOOT-INF/lib/" }],
      },
      { label: "app.jar\nfat JAR", color: "accent" },
      {
        label: "java -jar app.jar",
        color: "success",
        children: [{ label: "JarLauncher loads nested JARs" }, { label: "Embedded Tomcat starts" }],
      },
    ],
  },

  /* ── DevTools ─ */
  "sb-devtools": {
    type: "layers",
    title: "DevTools — Dual ClassLoader Restart",
    data: [
      {
        label: "Base class loader",
        color: "info",
        children: [{ label: "Third-party JARs — loaded once, never reloaded" }],
      },
      {
        label: "Restart class loader",
        color: "primary",
        children: [
          { label: "Your application classes" },
          { label: "Recreated on classpath change → fast restart" },
        ],
      },
      {
        label: "Development-only conveniences",
        color: "success",
        children: [
          { label: "Template & static resource caching disabled" },
          { label: "LiveReload server" },
          { label: "Disabled automatically in a packaged JAR" },
        ],
      },
    ],
  },

  /* ── Spring Boot CLI ── */
  "sb-cli": {
    type: "flow",
    title: "Spring Boot CLI — Prototype in One Command",
    direction: "horizontal",
    data: [
      { label: "app.groovy", color: "primary", children: [{ label: "@RestController + @RequestMapping" }] },
      { label: "spring run app.groovy", color: "info", children: [{ label: "Dependencies inferred from annotations" }] },
      { label: "Embedded server boots", color: "accent" },
      { label: "spring init\n(Spring Initializr)", color: "success", children: [{ label: "Full project skeleton for real apps" }] },
    ],
  },
};
