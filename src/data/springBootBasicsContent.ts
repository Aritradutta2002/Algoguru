import { ContentSection } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  Spring Boot Basics — Complete In-Depth Theory                             */
/*  Covers Auto-Configuration, @SpringBootApplication, Starters, Profiles,   */
/*  ConfigurationProperties, Logging, DevTools, and Build plugins.            */
/*  Written against Spring Boot 3.x / Java 17+.                               */
/* -------------------------------------------------------------------------- */

export const springBootBasicsContent: ContentSection[] = [
  {
    id: "sb-intro",
    title: "What is Spring Boot?",
    difficulty: "Easy",
    theory: [
      "**Spring Boot** is an opinionated, production-ready extension of the Spring Framework designed to radically streamline application bootstrapping and development. Created by Pivotal (now VMware Tanzu / Broadcom) and released in 2014, it eliminates the cumbersome XML and boilerplate configuration historically associated with Spring.",
      "At its core, Spring Boot is built on **three foundational pillars**: (1) **Opinionated 'Starter' Dependencies** that aggregate common libraries and handle compatible versioning via the `spring-boot-dependencies` BOM, (2) **Intelligent Auto-Configuration** that dynamically configures beans based on classpath contents and existing definitions, and (3) **Embedded Servlet Containers** (Tomcat, Jetty, Undertow) that allow packaging applications as self-contained executable JARs without external application server deployments.",
      "Spring Boot is **not an alternative framework or code generator**; it is a rapid development orchestration layer sitting directly on top of Spring Core and Spring MVC. It does not generate code behind your back or enforce rigid conventions that cannot be overridden. Every default choice can be modified or disabled by declaring custom beans or properties.",
      "The current **Spring Boot 3.x** baseline requires **Java 17+** (with full support for Java 21 LTS virtual threads), adopts the **Jakarta EE 9/10** namespace (`jakarta.*` replacing `javax.*`), and introduces native compilation via GraalVM AOT (Ahead-of-Time) processing for instant startup and negligible memory footprint."
    ],
    keyPoints: [
      "Spring Boot = Opinionated Starters + Auto-Configuration + Embedded Server + Actuator Production-Ready Features.",
      "Eliminates boilerplate configuration without generating rigid code or replacing Spring Framework.",
      "Spring Boot 3.x baseline is Java 17+ and the Jakarta EE namespace (`jakarta.*`).",
      "Executes as an executable fat JAR with embedded Tomcat/Jetty/Undertow."
    ],
    diagram: {
      type: "layers",
      title: "Spring Boot Ecosystem Architecture",
      data: [
        {
          label: "Your Business Application Code",
          color: "primary",
          children: [
            { label: "@RestController, @Service, @Repository, Domain Entities" }
          ]
        },
        {
          label: "Spring Boot Layer (Opinionated Bootstrapping)",
          color: "accent",
          children: [
            { label: "Starters (BOM Dependency Management)" },
            { label: "Auto-Configuration (@Conditional evaluation)" },
            { label: "Actuator & Embedded Web Server (Tomcat/Jetty)" }
          ]
        },
        {
          label: "Spring Framework 6.x Core",
          color: "info",
          children: [
            { label: "IoC Container (BeanFactory / ApplicationContext)" },
            { label: "AOP, BeanPostProcessors, Transactions, SpEL" }
          ]
        },
        {
          label: "Java 17+ JVM / GraalVM Native Image",
          color: "success",
          children: [
            { label: "LTS Bytecode Execution / Ahead-of-Time Native Binary" }
          ]
        }
      ]
    },
    code: [
      {
        title: "Canonical Spring Boot 3.x Entry Point",
        language: "java",
        content: `package com.algoguru.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class Application {

    @GetMapping("/api/v1/health")
    public String health() {
        return "AlgoGuru Spring Boot 3.x Service is Running!";
    }

    public static void main(String[] args) {
        // Launches the embedded Tomcat, registers Spring context, triggers auto-config
        SpringApplication.run(Application.class, args);
    }
}`
      }
    ],
    note: "Spring Boot applications run as standalone Java processes via `java -jar app.jar`. You do not need to install or configure external Tomcat, WebLogic, or WildFly instances.",
    tip: "Use Spring Initializr (start.spring.io) to generate pre-configured Maven or Gradle projects with compatible dependencies."
  },
  {
    id: "sb-vs-spring",
    title: "Spring Boot vs Spring Framework",
    difficulty: "Medium",
    theory: [
      "A quintessential interview topic is dissecting the architectural differences between **Spring Framework** and **Spring Boot**. The relationship is hierarchical: Spring Framework is the underlying container and ecosystem, whereas Spring Boot is the opinionated packaging and configuration tool built upon it.",
      "**Spring Framework** requires explicit configuration for virtually every subsystem. To build a simple Web MVC app in traditional Spring, a developer historically needed to configure `DispatcherServlet` (via `web.xml` or `WebApplicationInitializer`), `InternalResourceViewResolver`, Jackson `HttpMessageConverters`, database connection pools (`DataSource`), transaction managers (`PlatformTransactionManager`), and deploy the resulting `.war` file to a servlet container.",
      "**Spring Boot** automates this setup through conventions. Adding `spring-boot-starter-web` automatically wires `DispatcherServlet`, Jackson, standard error handling, and boots an embedded Tomcat on port 8080. If an in-memory database like H2 is on the classpath, Spring Boot automatically registers a `DataSource` bean and sets up Hibernate.",
      "Crucially, Spring Boot introduces **zero runtime overhead to dependency injection**. Once auto-configuration completes during startup, the resulting bean definitions live inside standard `DefaultListableBeanFactory` and `ApplicationContext` structures, behaving identically to explicitly configured Spring Framework beans."
    ],
    keyPoints: [
      "Spring Framework provides the core IoC/DI container, AOP, and enterprise abstractions.",
      "Spring Boot provides auto-configuration, starter POMs, embedded servers, and production metrics.",
      "Spring Framework requires manual setup of DispatcherServlet, ViewResolvers, and DataSources; Boot does it automatically.",
      "Deployment in Framework is typically a WAR on an external server; Boot builds an executable fat JAR.",
      "Any auto-configuration in Spring Boot can be overridden simply by declaring your own `@Bean`."
    ],
    code: [
      {
        title: "Traditional Spring 5 vs Spring Boot 3 Configuration Contrast",
        language: "java",
        content: `// === TRADITIONAL SPRING: Explicit Configuration Required ===
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.algoguru")
public class WebMvcConfig implements WebMvcConfigurer {
    @Bean
    public ViewResolver internalResourceViewResolver() {
        InternalResourceViewResolver bean = new InternalResourceViewResolver();
        bean.setPrefix("/WEB-INF/views/");
        bean.setSuffix(".jsp");
        return bean;
    }
    // Also requires configuring DispatcherServlet in WebApplicationInitializer
}

// === SPRING BOOT: Just Add starter-web, everything above is auto-wired! ===
@SpringBootApplication // Includes @Configuration, @EnableAutoConfiguration, @ComponentScan
public class BootApplication {
    public static void main(String[] args) {
        SpringApplication.run(BootApplication.class, args);
    }
}`
      }
    ],
    note: "Spring Boot does not rewrite or replace Spring Framework's IoC or DI engine. It uses the exact same `ApplicationContext` interfaces underneath.",
    warning: "Overriding auto-configuration with manual `@Configuration` beans requires care. Declaring a custom `SecurityFilterChain` bean, for instance, disables Boot's default generated password security."
  },
  {
    id: "sb-autoconfig",
    title: "Auto-Configuration Internals",
    difficulty: "Hard",
    theory: [
      "**Auto-Configuration** is Spring Boot's most sophisticated mechanism. During bootstrap, the container inspects your classpath, environment variables, and existing bean registrations, then intelligently registers missing beans needed to run your workload.",
      "How it works under the hood: The annotation `@EnableAutoConfiguration` imports `AutoConfigurationImportSelector`. In Spring Boot 3.x, this selector reads the file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` located inside `spring-boot-autoconfigure.jar` (in Spring Boot 2.x, it used `spring.factories`). This file lists hundreds of `@AutoConfiguration` candidate classes, such as `DataSourceAutoConfiguration`, `JacksonAutoConfiguration`, and `ServletWebServerFactoryAutoConfiguration`.",
      "Each auto-configuration class is guarded by conditional annotations from the `org.springframework.boot.autoconfigure.condition` package. These conditions evaluate before bean creation:",
      "1. **`@ConditionalOnClass` / `@ConditionalOnMissingClass`**: Evaluates whether specified classes exist on the JVM classpath (e.g., `DataSource.class` or `Tomcat.class`).",
      "2. **`@ConditionalOnBean` / `@ConditionalOnMissingBean`**: Checks if the user has already defined a bean of that type or name. If you register your own `@Bean DataSource dataSource()`, Boot's `@ConditionalOnMissingBean` backs off and yields to yours.",
      "3. **`@ConditionalOnProperty`**: Activates the configuration only if a given application property matches a specific value or exists.",
      "4. **`@ConditionalOnWebApplication`**: Checks if the running application is a reactive, servlet, or non-web application.",
      "Auto-configurations are ordered using `@AutoConfigureOrder`, `@AutoConfigureBefore`, and `@AutoConfigureAfter` to ensure dependencies resolve in the correct topological order (e.g., DataSource must configure before Hibernate JPA)."
    ],
    keyPoints: [
      "Spring Boot 3 uses `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.",
      "`@ConditionalOnMissingBean` is the magic enabling non-invasive overrides: your custom `@Bean` always wins.",
      "Common conditions: `@ConditionalOnClass`, `@ConditionalOnBean`, `@ConditionalOnProperty`, `@ConditionalOnWebApplication`.",
      "Auto-configuration classes are evaluated at startup during context refresh, not compile-time."
    ],
    code: [
      {
        title: "Inside a Real Auto-Configuration Class (Simplified)",
        language: "java",
        content: `package org.springframework.boot.autoconfigure.jdbc;

import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import com.zaxxer.hikari.HikariDataSource;

@AutoConfiguration
@ConditionalOnClass({ DataSource.class, HikariDataSource.class })
@ConditionalOnProperty(name = "spring.datasource.type", havingValue = "com.zaxxer.hikari.HikariDataSource", matchIfMissing = true)
public class DataSourceAutoConfiguration {

    // If the developer defines their own DataSource, this method NEVER runs!
    @Bean
    @ConditionalOnMissingBean(DataSource.class)
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
                         .type(HikariDataSource.class)
                         .build();
    }
}`
      }
    ],
    tip: "Start your application with `--debug` or set `debug=true` in `application.properties` to see the complete Auto-Configuration Conditions Evaluation Report showing exactly which beans matched and which were skipped."
  },
  {
    id: "sb-springbootapp",
    title: "@SpringBootApplication Deep Dive",
    difficulty: "Medium",
    theory: [
      "The `@SpringBootApplication` annotation placed on your main class is a composite meta-annotation that bundles the three core annotations required to configure a Spring Boot application:",
      "1. **`@SpringBootConfiguration`**: A specialized form of Spring's standard `@Configuration`. It identifies the class as a configuration class that can declare `@Bean` methods, and allows test frameworks like `@SpringBootTest` to automatically discover the application's root configuration.",
      "2. **`@EnableAutoConfiguration`**: Enables Spring Boot's auto-configuration machinery by importing `AutoConfigurationImportSelector` to scan `AutoConfiguration.imports`.",
      "3. **`@ComponentScan`**: Configures component scanning with default filters. By default, it scans for `@Component`, `@Service`, `@Repository`, and `@Controller` starting from the package containing the main class and searching all sub-packages recursively.",
      "Because `@ComponentScan` defaults to the package of the annotated class, placing your main class in the root application package (e.g., `com.algoguru`) is a strict best practice. Any class in an unrelated sibling package (e.g., `com.otherlib`) will not be picked up by the container unless explicitly listed in `@ComponentScan(basePackages = {...})`.",
      "You can exclude specific auto-configurations directly on `@SpringBootApplication`: for example, `@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })` prevents database auto-configuration when testing or in non-DB microservices."
    ],
    keyPoints: [
      "`@SpringBootApplication` = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan`.",
      "Always place the main application class in the root package to ensure component scanning covers all sub-packages.",
      "Supports selective exclusion: `@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })`.",
      "Allows declaring `@Bean` factory methods directly inside the main application class."
    ],
    code: [
      {
        title: "Excluding Auto-Configurations and Customizing Component Scan",
        language: "java",
        content: `package com.algoguru;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class, // Exclude DB setup
    SecurityAutoConfiguration.class    // Disable default HTTP Basic Auth
})
@ComponentScan(basePackages = { "com.algoguru", "com.external.utilities" })
public class AlgoGuruServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlgoGuruServiceApplication.class, args);
    }
}`
      }
    ],
    warning: "Never place the main class in the default package (no package statement). Spring Boot will attempt to scan every class on the entire classpath, leading to slow startup and severe classpath conflicts."
  },
  {
    id: "sb-starters",
    title: "Spring Boot Starters",
    difficulty: "Easy",
    theory: [
      "**Spring Boot Starters** are curated sets of convenient dependency descriptors that you can include in your build configuration (Maven `pom.xml` or Gradle `build.gradle`). Instead of searching for compatible versions of dozens of third-party libraries, a single starter provides everything needed to bootstrap a complete capability.",
      "For example, without Spring Boot, creating a REST API with Jackson JSON support and validation required manually adding `spring-web`, `spring-webmvc`, `jackson-databind`, `jackson-core`, `hibernate-validator`, and an embedded server like Tomcat, carefully verifying version compatibility. With Spring Boot, you simply declare `spring-boot-starter-web`.",
      "Starters follow a strict naming convention: official Spring Boot starters are named **`spring-boot-starter-*`** (e.g., `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-test`). Third-party starters (such as MyBatis or Camunda) follow the convention **`*-spring-boot-starter`** (e.g., `mybatis-spring-boot-starter`).",
      "Starters rely on **Transitive Dependencies** and the **Spring Boot Dependencies BOM** (`spring-boot-starter-parent`). When you inherit from `spring-boot-starter-parent`, you omit `<version>` tags for dependencies managed by Spring Boot, eliminating version mismatch bugs ('JAR Hell')."
    ],
    keyPoints: [
      "Starters bundle related dependencies into a single, cohesive artifact.",
      "Official starters: `spring-boot-starter-*`; Third-party: `*-spring-boot-starter`.",
      "Version management is centralized via `spring-boot-starter-parent` or `spring-boot-dependencies` BOM.",
      "You do not need to specify version tags for standard libraries managed by the parent BOM."
    ],
    code: [
      {
        title: "Maven pom.xml Dependency Declarations with Starters",
        language: "xml",
        content: `<!-- Inherit Bill of Materials from Spring Boot -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.3</version>
    <relativePath/>
</parent>

<dependencies>
    <!-- Web REST APIs with embedded Tomcat and Jackson -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- Notice NO <version> tag needed! -->
    </dependency>

    <!-- Spring Data JPA + Hibernate -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Production-ready metrics and health checks -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>`
      }
    ],
    note: "If your project cannot use `spring-boot-starter-parent` (for instance, if you already have a corporate parent POM), import `spring-boot-dependencies` in your `<dependencyManagement>` section with `scope=import`."
  },
  {
    id: "sb-config-files",
    title: "application.properties vs application.yml",
    difficulty: "Easy",
    theory: [
      "Spring Boot supports external configuration through both flat **`.properties`** files and hierarchical **`.yml` / `.yaml`** files. Both formats configure the exact same underlying `Environment` property sources.",
      "`application.properties` uses standard Java key-value syntax (`key=value`) with dot-separated hierarchical keys (e.g., `server.port=8080`, `spring.datasource.url=jdbc:...`). It is familiar, universally supported, and supported by Java's native `java.util.Properties`.",
      "`application.yml` uses YAML (YAML Ain't Markup Language), which relies on indentation and nesting. YAML eliminates repetitive prefixes, supports lists/arrays natively, and is significantly cleaner for deeply nested enterprise configurations.",
      "**Key Differences & Rules**:",
      "1. **YAML requires snakeyaml on the classpath**: Included by default in `spring-boot-starter`.",
      "2. **Precedence**: If both `application.properties` and `application.yml` exist in the same location, `application.properties` takes precedence.",
      "3. **`@PropertySource` Limitation**: Spring's `@PropertySource` annotation cannot load YAML files out of the box without a custom `PropertySourceFactory` implementation. However, Spring Boot's native configuration files (`application.yml`) are fully supported by Boot's `ConfigFileApplicationListener` / `ConfigDataEnvironmentPostProcessor`."
    ],
    keyPoints: [
      "Both files configure the exact same Spring `Environment` properties.",
      "YAML provides hierarchical structure, avoiding repetition of common prefixes.",
      "Indentation matters strictly in YAML (use 2 spaces, never tabs).",
      "If both exist at the same directory level, `.properties` overrides `.yml`."
    ],
    code: [
      {
        title: "Syntax Comparison: properties vs yml",
        language: "yaml",
        content: `# === application.yml (Clean, Hierarchical) ===
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/algogurudb
    username: postgres
    password: secretpassword
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

---
# === Equivalent application.properties (Flat) ===
# server.port=8443
# server.ssl.enabled=true
# server.ssl.key-store=classpath:keystore.p12
# spring.datasource.url=jdbc:postgresql://localhost:5432/algogurudb
# spring.datasource.username=postgres
# spring.datasource.password=secretpassword
# spring.datasource.hikari.maximum-pool-size=20
# spring.datasource.hikari.minimum-idle=5`
      }
    ],
    tip: "Stick to one format consistently across your project. Mixing `.properties` and `.yml` files creates subtle override conflicts that are difficult to debug."
  },
  {
    id: "sb-externalized",
    title: "Externalized Configuration",
    difficulty: "Medium",
    theory: [
      "Spring Boot allows you to externalize your configuration so that you can run the exact same application code in different environments (local development, staging, production, Kubernetes) without recompiling your artifact.",
      "Spring Boot uses a carefully ordered algorithm to resolve property values. A property defined in a higher-priority source **overrides** values defined in lower-priority sources. The most critical order of precedence (from highest to lowest) is:",
      "1. **Command-line arguments** (e.g., `--server.port=9090`).",
      "2. **`SPRING_APPLICATION_JSON`** inline JSON in environment variables.",
      "3. **OS Environment Variables** (e.g., `SERVER_PORT=9090` or `SPRING_DATASOURCE_URL=...`).",
      "4. **Profile-specific application properties outside packaged JAR** (`config/application-{profile}.properties`).",
      "5. **Profile-specific application properties packaged inside JAR** (`application-{profile}.properties`).",
      "6. **Application properties outside packaged JAR** (`config/application.properties`).",
      "7. **Application properties packaged inside JAR** (`src/main/resources/application.properties`).",
      "8. **`@PropertySource`** annotations on `@Configuration` classes.",
      "9. **Default properties** specified via `SpringApplication.setDefaultProperties`.",
      "**Relaxed Binding**: Spring Boot allows flexible matching between environment property names and configuration property beans. For example, `app.user-name`, `app.userName`, `APP_USER_NAME`, and `app.user_name` all bind seamlessly to a Java field named `userName`."
    ],
    keyPoints: [
      "Externalized config enables running the same compiled artifact in Dev, QA, Staging, and Prod.",
      "Precedence: Command line args > OS Env variables > Profile-specific config > Application properties.",
      "Relaxed binding automatically maps kebab-case, camelCase, and UPPER_SNAKE_CASE environment variables.",
      "In cloud/Kubernetes environments, 12-Factor App config is passed via OS Environment Variables or ConfigMaps."
    ],
    code: [
      {
        title: "Overriding Configuration via CLI and Environment Variables",
        language: "bash",
        content: `# 1. Override server port and active profile via Command Line Arguments:
java -jar target/algoguru-app.jar --server.port=9090 --spring.profiles.active=prod

# 2. Override database credentials via OS Environment Variables (ideal for Docker/K8s):
export SPRING_DATASOURCE_URL="jdbc:postgresql://db.prod.internal:5432/algoguru"
export SPRING_DATASOURCE_USERNAME="prod_user"
export SPRING_DATASOURCE_PASSWORD="super_secret_db_password"
java -jar target/algoguru-app.jar`
      }
    ],
    note: "Never commit database passwords, API secrets, or private keys to source control. In modern deployments, inject them via OS Environment Variables or HashiCorp Vault / AWS Secrets Manager."
  },
  {
    id: "sb-configuration-props",
    title: "@ConfigurationProperties",
    difficulty: "Medium",
    theory: [
      "While `@Value` is convenient for injecting individual property values, **`@ConfigurationProperties`** is the recommended enterprise approach for binding strongly-typed, structured configuration into reusable Java objects.",
      "Advantages of `@ConfigurationProperties` over `@Value`:",
      "1. **Type Safety**: Properties are bound to strongly-typed fields (Integer, Duration, DataSize, List, Map, custom POJOs/Records).",
      "2. **Relaxed Binding**: Automatically resolves `server-port`, `serverPort`, and `SERVER_PORT` without needing explicit syntax.",
      "3. **Validation**: Supports JSR-380 / Jakarta Bean Validation (`@Validated`, `@NotNull`, `@Min`, `@Max`, `@Email`). If a required property is missing or invalid, application startup fails immediately with a clear diagnostic message.",
      "4. **IDE Autocompletion**: With `spring-boot-configuration-processor` on the compile classpath, IDEs like IntelliJ IDEA and VS Code provide full autocompletion and documentation tooltips for your custom properties inside `application.yml`.",
      "In **Spring Boot 3 / Java 17+**, `@ConfigurationProperties` works flawlessly with **Java Records** using `@ConstructorBinding`, creating immutable, thread-safe configuration objects."
    ],
    keyPoints: [
      "`@ConfigurationProperties(prefix = \"...\")` groups and binds related properties into structured classes.",
      "Supports Java 17 immutable `record`s with `@ConstructorBinding`.",
      "Integrates with Jakarta Validation via `@Validated` to fail-fast on invalid configuration.",
      "Provides rich IDE autocompletion using `spring-boot-configuration-processor`."
    ],
    code: [
      {
        title: "Type-Safe Immutable Configuration Record with Validation",
        language: "java",
        content: `package com.algoguru.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;
import org.springframework.validation.annotation.Validated;
import java.time.Duration;

@ConfigurationProperties(prefix = "algoguru.security")
@Validated
public record SecurityProperties(
    @NotBlank String jwtSecret,
    @Min(300) @Max(86400) long tokenExpirationSeconds,
    Duration sessionTimeout,
    RateLimit rateLimit
) {
    public record RateLimit(
        boolean enabled,
        int maxRequestsPerMinute
    ) {}
}

// In your application configuration:
// @Configuration
// @EnableConfigurationProperties(SecurityProperties.class)
// public class AppConfig { ... }`
      }
    ],
    tip: "Add `spring-boot-configuration-processor` to your build dependencies as `optional` or `annotationProcessor` to generate configuration metadata automatically."
  },
  {
    id: "sb-profiles",
    title: "Profiles in Spring Boot",
    difficulty: "Easy",
    theory: [
      "**Spring Profiles** provide a way to segregate parts of your application configuration and make it available only in certain runtime environments (e.g., `dev`, `test`, `prod`).",
      "Spring Boot organizes profile configuration using naming conventions. The file `application.properties` (or `application.yml`) contains default, profile-agnostic settings. Profile-specific files follow the pattern **`application-{profile}.properties`** (or `application-{profile}.yml`). When a profile is active, properties from the profile file override those in the base file.",
      "You activate profiles via:",
      "1. Property file: `spring.profiles.active=dev`.",
      "2. Command line: `--spring.profiles.active=prod`.",
      "3. Environment variable: `SPRING_PROFILES_ACTIVE=prod`.",
      "4. Programmatically: `SpringApplication.setAdditionalProfiles(\"test\")`.",
      "You can also restrict beans to specific profiles using the `@Profile` annotation: `@Profile(\"dev\")` on a `@Component` or `@Bean` method ensures that bean is registered in the `ApplicationContext` only when the `dev` profile is active.",
      "In Spring Boot 2.4+, multi-document YAML files can declare profile activation with `spring.config.activate.on-profile: prod`, allowing all environment definitions to reside within a single file separated by `---`."
    ],
    keyPoints: [
      "Profiles isolate configuration for `dev`, `qa`, `staging`, and `prod`.",
      "Profile file naming convention: `application-{profile}.yml`.",
      "`@Profile(\"dev\")` restricts beans to specific runtime profiles.",
      "Activated via `spring.profiles.active` property or `SPRING_PROFILES_ACTIVE` environment variable."
    ],
    code: [
      {
        title: "Multi-Document application.yml with Profile Separation",
        language: "yaml",
        content: `# Base configuration shared by all environments
spring:
  application:
    name: algoguru-backend
  profiles:
    active: dev

---
# DEV Profile Configuration
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
server:
  port: 8080

---
# PROD Profile Configuration
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: jdbc:postgresql://prod-db.internal:5432/algogurudb
    username: dbadmin
    password: \${DB_PROD_PASSWORD}
server:
  port: 8443`
      }
    ],
    tip: "Use `@Profile(\"!prod\")` (not prod) to activate mock services or in-memory fixtures in local and testing environments without repeating declarations for dev and test."
  },
  {
    id: "sb-logging",
    title: "Logging — Logback, Log4j2",
    difficulty: "Medium",
    theory: [
      "Spring Boot uses **Commons Logging** for all internal logging, but keeps the underlying log implementation open. Default configurations are provided for **Java Util Logging (JUL)**, **Log4j2**, and **Logback**.",
      "In all cases, Spring Boot defaults to **SLF4J** (Simple Logging Facade for Java) with **Logback** as the default logging implementation. No manual configuration is required to start logging.",
      "**Default Log Output**: Spring Boot logs output to the console, printing date-time (millisecond precision), log level (FATAL, ERROR, WARN, INFO, DEBUG, TRACE), process ID (PID), thread name, logger name (abbreviated class name), and the log message.",
      "**Log Level Configuration**: You can configure log levels directly in `application.properties` without XML files:",
      "`logging.level.root=WARN` sets the root logger, while `logging.level.com.algoguru=DEBUG` enables debug logging for your package.",
      "`logging.level.org.springframework.web=INFO` controls framework logs.",
      "**Log File Output**: By default, logs write only to standard out (stdout). Setting `logging.file.name=logs/app.log` or `logging.file.path=/var/log` routes logs to a file with automatic daily rotation and size-based archiving (10MB limit per file by default).",
      "For advanced customization, place a `logback-spring.xml` or `log4j2-spring.xml` in `src/main/resources`. The `-spring` suffix allows using Spring Boot's `<springProfile>` tags to adjust log formats based on the active profile."
    ],
    keyPoints: [
      "Default stack: SLF4J facade + Logback implementation.",
      "Configurable directly in `application.yml` via `logging.level.<package>=LEVEL`.",
      "Use `logback-spring.xml` for advanced custom XML logging with profile awareness.",
      "Supports structured JSON logging for cloud observability (ELK, Datadog)."
    ],
    code: [
      {
        title: "SLF4J Logger Usage in a Spring Service",
        language: "java",
        content: `package com.algoguru.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PaymentProcessingService {

    // SLF4J Logger instance
    private static final Logger log = LoggerFactory.getLogger(PaymentProcessingService.class);

    public void processPayment(String transactionId, double amount) {
        log.info("Starting payment processing for TxID: {}, Amount: {}", transactionId, amount);

        try {
            if (amount <= 0) {
                log.warn("Invalid transaction amount: {} for TxID: {}", amount, transactionId);
                throw new IllegalArgumentException("Amount must be positive");
            }
            // Business logic here...
            log.debug("Payment gateway communication succeeded for TxID: {}", transactionId);
        } catch (Exception ex) {
            log.error("Fatal failure processing payment TxID: {}. Reason: {}", transactionId, ex.getMessage(), ex);
            throw ex;
        }
    }
}`
      }
    ],
    note: "Use parameterized logging (`log.info(\"User: {}\", username)`) instead of string concatenation (`\"User: \" + username`). Parameterized logging avoids the CPU cost of string evaluation if the log level is disabled."
  },
  {
    id: "sb-build-run",
    title: "Building & Running (Maven, Gradle)",
    difficulty: "Medium",
    theory: [
      "Spring Boot provides build tool plugins for both **Apache Maven** (`spring-boot-maven-plugin`) and **Gradle** (`org.springframework.boot`). These plugins package your compiled classes and runtime dependencies into an **Executable Fat JAR** (or Über-JAR).",
      "**How Fat JARs Work**: The standard Java JVM `java -jar` command can only read classes from a flat JAR; it cannot natively load nested JAR files inside a JAR archive. The Spring Boot build plugin solves this by repackaging your project with a specialized loader:",
      "1. Your application classes reside in `BOOT-INF/classes/`.",
      "2. All third-party library dependencies reside in `BOOT-INF/lib/`.",
      "3. The archive's `META-INF/MANIFEST.MF` points `Main-Class` to `org.springframework.boot.loader.launch.JarLauncher` (Spring Boot 3.2+).",
      "4. Your actual application class is designated as `Start-Class: com.algoguru.Application`.",
      "5. When launched, `JarLauncher` initializes a custom `LaunchedURLClassLoader` capable of unpacking and loading dependencies directly from the nested JARs in memory.",
      "**AOT & GraalVM Native Compilation**: In Spring Boot 3, the build plugin can also trigger `mvn -Pnative native:compile` to generate a standalone native OS binary via GraalVM, reducing startup times from seconds to single-digit milliseconds."
    ],
    keyPoints: [
      "`spring-boot-maven-plugin` repackages normal JARs into executable fat JARs.",
      "The archive uses `JarLauncher` to load nested JARs inside `BOOT-INF/lib/`.",
      "Run locally with `mvn spring-boot:run` or `./gradlew bootRun`.",
      "Production execution: `java -jar target/app.jar`."
    ],
    code: [
      {
        title: "Maven Build Plugin Configuration",
        language: "xml",
        content: `<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <!-- Exclude Lombok from the final production JAR -->
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>repackage</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>`
      }
    ],
    tip: "Use Docker multi-stage builds with Spring Boot's built-in layering (`java -Djarmode=layertools -jar app.jar extract`) to optimize Docker layer caching, significantly speeding up CI/CD pipeline builds."
  },
  {
    id: "sb-devtools",
    title: "Spring Boot DevTools",
    difficulty: "Easy",
    theory: [
      "The **`spring-boot-devtools`** module aims to improve the developer turnaround time during local development by automating server restarts and client-side browser reloads.",
      "**Two ClassLoader Architecture**: DevTools implements fast restarts using two distinct classloaders: the **Base ClassLoader** (which loads third-party JARs that rarely change) and the **Restart ClassLoader** (which loads your active project classes). When you recompile a file, DevTools discards only the Restart ClassLoader and creates a new one. Because third-party libraries don't need to be reloaded, restart times drop from 10 seconds to less than 1 second.",
      "**Automatic Cache Disabling**: During development, caching templates (Thymeleaf, FreeMarker) or static resources is frustrating because changes don't appear without restarting. DevTools automatically disables template caches and enables debug logging for web requests.",
      "**LiveReload**: DevTools embeds a LiveReload server. When paired with a browser extension, saving a CSS file or HTML template triggers an instant browser refresh without manual intervention.",
      "**Automatic Exclusion in Production**: DevTools is automatically disabled when the application is launched from a repackaged fat JAR via `java -jar`."
    ],
    keyPoints: [
      "DevTools speeds up local inner-loop development with fast in-memory restarts.",
      "Employs two classloaders: Base (static dependencies) + Restart (application code).",
      "Disables template and static file caching automatically in development.",
      "Automatically omitted or deactivated when running from a packaged production JAR."
    ],
    code: [
      {
        title: "Adding DevTools to pom.xml",
        language: "xml",
        content: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional> <!-- Ensures it is NOT passed transitively -->
</dependency>`
      }
    ],
    warning: "In IDEs like IntelliJ IDEA, automatic restart requires enabling 'Build project automatically' in Settings -> Compiler, and enabling 'Allow auto-make to start even if developed application is currently running'."
  },
  {
    id: "sb-cli",
    title: "Spring Boot CLI",
    difficulty: "Easy",
    theory: [
      "The **Spring Boot CLI** (Command Line Interface) is a developer utility used for rapid prototyping with Spring. It enables developers to execute **Groovy scripts**, which provides the full power of Spring Boot with minimal syntax overhead.",
      "The CLI uses Groovy's grape dependency resolver to automatically infer and download required Spring dependencies and starters. For instance, if your script contains a `@RestController` annotation, the CLI automatically downloads `spring-boot-starter-web` and launches an embedded Tomcat server without requiring a `pom.xml`, Gradle script, or build setup.",
      "Commands provided by the CLI:",
      "1. `spring run app.groovy`: Compiles, resolves dependencies, and runs the script.",
      "2. `spring init --dependencies=web,data-jpa my-app`: Generates a new Spring Boot project skeleton directly from the terminal (equivalent to start.spring.io).",
      "3. `spring shell`: Enters an interactive shell with tab completion for commands.",
      "While primarily used for quick proof-of-concept tests, demos, and educational scratchpads, enterprise development almost exclusively uses standard Maven or Gradle builds."
    ],
    keyPoints: [
      "Spring Boot CLI allows running Groovy-based Spring scripts with zero build file setup.",
      "Automatically infers dependencies (e.g. `@RestController` pulls web starter).",
      "`spring init` provides a fast CLI interface to generate projects from Spring Initializr.",
      "Primarily used for prototyping, testing ideas, and demos."
    ],
    code: [
      {
        title: "Complete Single-File Web App with Spring Boot CLI (app.groovy)",
        language: "groovy",
        content: `// app.groovy - Run via: spring run app.groovy
@RestController
class HelloController {

    @GetMapping("/")
    String home() {
        return "Hello from single-file Spring Boot CLI!"
    }

    @GetMapping("/data")
    Map<String, Object> getData() {
        return [framework: "Spring Boot 3", language: "Groovy", status: "Active"]
    }
}`
      }
    ],
    tip: "Use `spring init -d=web,data-jpa,security --build=maven --java-version=17 my-service` to spin up a production-ready starter project in one terminal command."
  }
];
