import { defineBackendChunk } from "./contract";

/**
 * Spring Boot internals & auto-configuration (b037–b046).
 */
export const chunk03SpringBootCore = defineBackendChunk({
  topic: "spring-boot-core",
  questions: [
    {
      id: "b037",
      question: "Walk me through what happens between main() and 'Started Application in 2.4 seconds'.",
      answer:
        "`SpringApplication.run()` is a well-defined sequence. Being able to narrate it is a strong senior signal.\n\n" +
        "1. **Create the `SpringApplication`** — deduce the application type (SERVLET, REACTIVE or NONE) by probing the classpath for `DispatcherServlet` / `WebFluxHandler`; load `ApplicationContextInitializer`s and `ApplicationListener`s from the `spring.factories` mechanism; find the main class from the stack trace.\n" +
        "2. **`SpringApplicationRunListeners.starting()`** — `EventPublishingRunListener` fires `ApplicationStartingEvent`.\n" +
        "3. **Prepare the `Environment`** — merge property sources in precedence order (command line > `SPRING_APPLICATION_JSON` > OS env > system properties > `application-{profile}.yml` > `application.yml` > `@PropertySource` > defaults), bind `spring.profiles.active`, fire `ApplicationEnvironmentPreparedEvent`.\n" +
        "4. **Print the banner**, then **create the `ApplicationContext`** (`AnnotationConfigServletWebServerApplicationContext` for a typical web app).\n" +
        "5. **Prepare the context** — apply initializers, register the primary source (your `@SpringBootApplication` class), fire `ApplicationContextInitializedEvent` and `ApplicationPreparedEvent`.\n" +
        "6. **`refresh()`** — the heart of it: run `BeanFactoryPostProcessor`s (`ConfigurationClassPostProcessor` parses `@Configuration`, performs component scanning and runs auto-configuration import selection), register `BeanPostProcessor`s, **create the embedded web server**, then instantiate all non-lazy singletons and apply AOP proxies.\n" +
        "7. **`ApplicationStartedEvent`**, then `ApplicationRunner` and `CommandLineRunner` beans execute in `@Order`, then **`ApplicationReadyEvent`** — the point at which the app is genuinely serving traffic.\n" +
        "8. Any failure funnels through `SpringApplication.handleRunFailure`, which reports via `FailureAnalyzer`s (that is why 'Port 8080 was already in use' is a readable message rather than a stack trace).\n\n" +
        "**Debug tools:** `--debug` prints the Condition Evaluation Report; `spring.main.lazy-initialization=true` defers bean creation; `ApplicationStartup`/`BufferingApplicationStartup` gives per-step startup timings.",
      code: `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.*;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;
import org.springframework.context.ApplicationListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ShopApplication.class);
        app.setBannerMode(Banner.Mode.OFF);
        app.setApplicationStartup(new BufferingApplicationStartup(2048)); // step timings
        app.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) e ->
            System.out.println("profiles: " +
                String.join(",", e.getEnvironment().getActiveProfiles())));
        app.run(args);
    }
}

@Component
@Order(1)
class SchemaCheckRunner implements ApplicationRunner {        // before ApplicationReadyEvent
    @Override public void run(ApplicationArguments args) {
        if (args.containsOption("verify-schema")) { /* ... */ }
    }
}

@Component
class ReadyListener {
    @org.springframework.context.event.EventListener(ApplicationReadyEvent.class)
    void onReady(ApplicationReadyEvent e) {
        long ms = e.getTimeTaken().toMillis();
        System.out.println("serving traffic after " + ms + " ms");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Environment → context creation → refresh (post-processors, scanning, auto-config, web server, singletons) → runners → ApplicationReadyEvent.",
      followUps: [
        "At which step are AOP proxies created?",
        "What does BufferingApplicationStartup let you diagnose?",
      ],
    },
    {
      id: "b038",
      question: "How does auto-configuration actually find and apply configuration classes?",
      answer:
        "Auto-configuration is `@Import(AutoConfigurationImportSelector.class)` plus a discovery file plus conditions.\n\n" +
        "Discovery:\n\n" +
        "- **Boot 3**: every jar contributes `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — a plain newline-delimited list of class names.\n" +
        "- **Boot 2.x**: the same list lived under the `EnableAutoConfiguration` key in `META-INF/spring.factories`. Boot 3 still reads it but logs a deprecation.\n\n" +
        "Filtering, in order:\n\n" +
        "1. Remove anything listed in `spring.autoconfigure.exclude` or `@SpringBootApplication(exclude = ...)`.\n" +
        "2. Apply **`AutoConfigurationImportFilter`s** — notably `OnClassCondition`, which uses **ASM to read class bytes** and eliminate candidates whose `@ConditionalOnClass` types are absent, without loading anything. This is the big startup optimisation.\n" +
        "3. Sort with `@AutoConfiguration(before=, after=)` / `@AutoConfigureOrder`.\n" +
        "4. Register the survivors as configuration classes, **after** all user configuration — which is what makes `@ConditionalOnMissingBean` mean 'the developer did not already provide one'.\n" +
        "5. Evaluate the remaining conditions per `@Bean` method during parsing.\n\n" +
        "A starter is therefore just: a POM that pulls in the right dependencies, an autoconfiguration class guarded by conditions, `@ConfigurationProperties` for its settings, and the `.imports` file. `spring-boot-starter-web` itself contains almost no code — it is a dependency aggregator.\n\n" +
        "**How to debug it:** `--debug` prints the Condition Evaluation Report with Positive matches, Negative matches, Exclusions and Unconditional classes, each with the reason. When someone asks 'why is my bean not there?', that report is the answer.",
      code: `// ---- library: acme-audit-spring-boot-starter -----------------------------
// src/main/java/com/acme/audit/AuditAutoConfiguration.java
package com.acme.audit;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.boot.context.properties.*;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@EnableConfigurationProperties(AuditProperties.class)
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", matchIfMissing = true)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                      // user-defined bean wins
    public AuditClient auditClient(AuditProperties props) {
        return new AuditClient(props.getEndpoint());
    }
}

@ConfigurationProperties("acme.audit")
class AuditProperties {
    private String endpoint = "http://localhost:9000";
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String e) { this.endpoint = e; }
}

// src/main/resources/META-INF/spring/
//     org.springframework.boot.autoconfigure.AutoConfiguration.imports
// -------------------------------------------------------------------------
// com.acme.audit.AuditAutoConfiguration
//
// Boot 2.x equivalent (src/main/resources/META-INF/spring.factories):
// org.springframework.boot.autoconfigure.EnableAutoConfiguration=\\
//   com.acme.audit.AuditAutoConfiguration
//
// Debug it:  java -jar app.jar --debug
//   -> CONDITIONS EVALUATION REPORT
//        Positive matches: AuditAutoConfiguration matched
//        Negative matches: ... did not match (@ConditionalOnClass ... not found)`,
      codeLanguage: "java",
      explanation:
        "An imports file lists candidates, ASM-based OnClassCondition filters them cheaply, and they register after user config so @ConditionalOnMissingBean backs off.",
      followUps: [
        "Why does Boot use ASM rather than Class.forName for @ConditionalOnClass?",
        "How would you package your team's shared config as a starter?",
      ],
    },
    {
      id: "b039",
      question: "What is the full property precedence order in Spring Boot, and how does relaxed binding work?",
      answer:
        "Boot composes an ordered list of `PropertySource`s; **earlier wins**. The list you should be able to recite (highest first):\n\n" +
        "1. Devtools global settings (`~/.config/spring-boot`)\n" +
        "2. `@TestPropertySource` and test `properties` attributes\n" +
        "3. Command line arguments (`--server.port=9090`)\n" +
        "4. `SPRING_APPLICATION_JSON` (inline JSON in an env var)\n" +
        "5. `ServletConfig` / `ServletContext` init parameters, JNDI\n" +
        "6. Java System properties (`-Dserver.port=9090`)\n" +
        "7. OS environment variables\n" +
        "8. **Profile-specific** `application-{profile}.yml` outside the jar, then inside the jar\n" +
        "9. `application.yml` outside the jar, then inside the jar\n" +
        "10. `@PropertySource` on a `@Configuration` class\n" +
        "11. Default properties (`SpringApplication.setDefaultProperties`)\n\n" +
        "Config data can also come from `spring.config.import` — `optional:configtree:/etc/secrets/` for Kubernetes secrets, `optional:file:./override.yml`, Consul, Vault. The `optional:` prefix stops a missing source from failing startup.\n\n" +
        "**Relaxed binding** applies to `@ConfigurationProperties` (not to `@Value`). For the property `acme.api.readTimeout`, all of these bind:\n\n" +
        "- `acme.api.read-timeout` — kebab case, the **canonical** form to use in files\n" +
        "- `acme.api.readTimeout` — camel case\n" +
        "- `acme.api.read_timeout` — underscore\n" +
        "- `ACME_API_READTIMEOUT` — upper snake, how you set it as an environment variable\n\n" +
        "List indices use `acme.hosts[0]` or the env form `ACME_HOSTS_0_`. Types are converted automatically: `Duration` (`30s`, `5m`, `PT1H`), `DataSize` (`10MB`), `Period`, enums (case-insensitive), `Resource`, `Charset`.\n\n" +
        "**Twelve-factor implication:** environment variables outrank bundled files, which is exactly what lets one image run in every environment.",
      code: `# application.yml  (inside the jar - the lowest-priority file source)
server:
  port: 8080
acme:
  api:
    base-url: http://localhost:9000
    read-timeout: 10s          # canonical kebab-case
    pool-size: 8
  hosts:
    - a.internal
    - b.internal
spring:
  config:
    import:
      - optional:file:./config/override.yml
      - optional:configtree:/etc/secrets/     # k8s: one file per property
---
spring:
  config:
    activate:
      on-profile: prod
acme:
  api:
    base-url: https://api.acme.io
    pool-size: 32

# Overriding, highest priority first:
#   java -jar app.jar --acme.api.pool-size=64          <- command line wins
#   SPRING_APPLICATION_JSON='{"acme":{"api":{"pool-size":48}}}'
#   java -Dacme.api.pool-size=40 -jar app.jar
#   export ACME_API_POOL_SIZE=24                        <- relaxed binding
#   export ACME_HOSTS_0_=c.internal                     <- list index form`,
      codeLanguage: "yaml",
      explanation:
        "Command line > env > profile files > base files; relaxed binding is what lets ACME_API_READ_TIMEOUT hit a camelCase field.",
      followUps: [
        "How do you mount Kubernetes secrets as Spring properties?",
        "Why does relaxed binding not apply to @Value?",
      ],
    },
    {
      id: "b040",
      question: "What is an embedded server, how do you tune it, and Tomcat vs Undertow vs Jetty vs Netty?",
      answer:
        "Boot ships the servlet container **inside** the fat jar, so deployment becomes `java -jar` instead of dropping a WAR into an app server. `ServletWebServerApplicationContext` creates the `WebServer` during `refresh()` and the `DispatcherServlet` is registered on it.\n\n" +
        "Choices:\n\n" +
        "- **Tomcat** (default) — thread-per-request, the most battle-tested, best documented, widest ecosystem support.\n" +
        "- **Jetty** — similar model, historically lighter, strong WebSocket support.\n" +
        "- **Undertow** — NIO-based, low memory footprint, good for many idle connections.\n" +
        "- **Netty** — event-loop based, used by **WebFlux**. Not a servlet container; a completely different, non-blocking programming model.\n\n" +
        "To switch, exclude `spring-boot-starter-tomcat` from `spring-boot-starter-web` and add the alternative starter.\n\n" +
        "The settings that matter in production:\n\n" +
        "- `server.tomcat.threads.max` (default 200) — the real concurrency limit for a blocking app. If every request waits 100 ms on a database, 200 threads caps you near 2000 rps.\n" +
        "- `server.tomcat.accept-count` — the OS accept queue once all threads are busy; beyond it, connections are refused.\n" +
        "- `server.tomcat.max-connections`, `server.tomcat.connection-timeout`, `server.tomcat.keep-alive-timeout`.\n" +
        "- `server.compression.enabled`, `server.http2.enabled`.\n" +
        "- **`server.shutdown=graceful`** plus `spring.lifecycle.timeout-per-shutdown-phase=30s` — in-flight requests finish before the JVM exits. Essential for rolling deployments in Kubernetes.\n\n" +
        "**Java 21 angle:** `spring.threads.virtual.enabled=true` backs the request pool with virtual threads, so blocking calls no longer pin a platform thread and the max-threads ceiling largely stops mattering. That is the modern alternative to rewriting in WebFlux.",
      code: `<!-- Swap Tomcat for Undertow -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>

<!--
application.yml

server:
  port: 8080
  shutdown: graceful                  # finish in-flight requests on SIGTERM
  compression:
    enabled: true
    mime-types: application/json,text/html
  http2:
    enabled: true
  tomcat:
    threads:
      max: 200                        # the real concurrency ceiling
      min-spare: 20
    accept-count: 100                 # OS queue once all threads are busy
    max-connections: 8192
    connection-timeout: 5s
    keep-alive-timeout: 20s

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
  threads:
    virtual:
      enabled: true                   # Java 21: blocking calls stop pinning threads
-->`,
      codeLanguage: "xml",
      explanation:
        "Thread-per-request means max-threads is your concurrency ceiling; graceful shutdown and virtual threads are the two production settings people forget.",
      followUps: [
        "How do you size server.tomcat.threads.max from a latency budget?",
        "When would virtual threads be a better answer than WebFlux?",
      ],
    },
    {
      id: "b041",
      question: "What does Spring Boot Actuator give you and how do you expose it safely?",
      answer:
        "Actuator adds production-readiness endpoints under `/actuator`. The ones that matter:\n\n" +
        "- **`/health`** — aggregated from `HealthIndicator` beans (DB, disk, Redis, Kafka…). `show-details: when-authorized` hides internals from anonymous callers. Boot 2.3+ splits it into **`/health/liveness`** (am I broken — restart me) and **`/health/readiness`** (can I take traffic — add/remove from the load balancer). Mapping these correctly to Kubernetes probes is the question behind the question.\n" +
        "- **`/metrics`** and **`/prometheus`** — Micrometer. Micrometer is a vendor-neutral facade (the SLF4J of metrics) with registries for Prometheus, Datadog, CloudWatch, OTLP.\n" +
        "- **`/info`**, **`/env`**, **`/configprops`**, **`/beans`**, **`/mappings`**, **`/conditions`** — introspection, all sensitive.\n" +
        "- **`/loggers`** — change a log level at runtime with a POST. Genuinely valuable during an incident.\n" +
        "- **`/threaddump`**, **`/heapdump`** — dangerous and extremely useful.\n" +
        "- **`/httpexchanges`**, **`/scheduledtasks`**, **`/caches`**, **`/shutdown`** (disabled by default).\n\n" +
        "Securing it — say all four:\n\n" +
        "1. Expose only what you need: `management.endpoints.web.exposure.include=health,info,prometheus`. By default only `health` is exposed over HTTP.\n" +
        "2. Move it to a **separate port** (`management.server.port=9090`) that is not routed from the internet.\n" +
        "3. Protect it with Spring Security using `EndpointRequest.toAnyEndpoint()` and require a role.\n" +
        "4. Never expose `/env`, `/heapdump` or `/shutdown` publicly — `/env` leaks credentials, `/heapdump` leaks everything in memory.\n\n" +
        "Custom `HealthIndicator` and `@Endpoint` beans let you publish domain-specific signals; `@Timed` and a `MeterRegistry` publish business metrics.",
      code: `import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.boot.actuate.endpoint.annotation.*;
import org.springframework.boot.actuate.health.*;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
class PaymentGatewayHealth implements HealthIndicator {
    private final PricingClient client;
    PaymentGatewayHealth(PricingClient c) { this.client = c; }

    @Override public Health health() {
        try {
            long ms = client.ping();
            return ms < 300 ? Health.up().withDetail("latencyMs", ms).build()
                            : Health.status("DEGRADED").withDetail("latencyMs", ms).build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}

@Component
@Endpoint(id = "featureflags")                     // -> /actuator/featureflags
class FeatureFlagEndpoint {
    @ReadOperation Map<String, Boolean> flags() { return Map.of("newCheckout", true); }
    @WriteOperation void set(String name, boolean value) { }
}

class ActuatorSecurity {
    @Bean SecurityFilterChain actuatorChain(HttpSecurity http) throws Exception {
        http.securityMatcher(EndpointRequest.toAnyEndpoint())
            .authorizeHttpRequests(a -> a
                .requestMatchers(EndpointRequest.to("health", "info")).permitAll()
                .anyRequest().hasRole("OPS"))
            .httpBasic(org.springframework.security.config.Customizer.withDefaults());
        return http.build();
    }
}

// management:
//   server.port: 9090
//   endpoints.web.exposure.include: health,info,prometheus,loggers
//   endpoint.health:
//     show-details: when-authorized
//     probes.enabled: true          # /health/liveness and /health/readiness`,
      codeLanguage: "java",
      explanation:
        "Liveness vs readiness mapped to k8s probes, Micrometer for metrics, and a separate secured port — exposing /env or /heapdump publicly is the failure.",
      followUps: [
        "What is the difference between a liveness and a readiness failure?",
        "How do you publish a business metric through Micrometer?",
      ],
    },
    {
      id: "b042",
      question: "How would you diagnose and fix slow Spring Boot startup?",
      answer:
        "Measure first, then act. A structured answer beats a list of tips.\n\n" +
        "Measure:\n\n" +
        "- `BufferingApplicationStartup` + `/actuator/startup` gives a per-step timeline: which bean, which auto-configuration, how long.\n" +
        "- `--debug` shows how many auto-configurations matched.\n" +
        "- `-verbose:class` or JFR shows classloading volume, which usually dominates.\n\n" +
        "The usual causes and fixes:\n\n" +
        "1. **Too many beans / too broad a component scan.** Narrow `scanBasePackages`; avoid scanning a package containing thousands of classes.\n" +
        "2. **Unused auto-configurations.** Exclude the ones you never use; each one costs condition evaluation and sometimes classloading.\n" +
        "3. **Eager connection pools and clients.** Hikari opens its minimum-idle connections at startup; a slow DNS lookup or DB handshake shows up directly. Tune `minimum-idle` and `initialization-fail-timeout`.\n" +
        "4. **Hibernate entity scanning and DDL validation** on a large schema — cache the metamodel, avoid `ddl-auto=update` in production entirely.\n" +
        "5. **Classpath scanning for everything** — `spring-context-indexer` generates `META-INF/spring.components` at build time so scanning becomes a file read.\n" +
        "6. **`spring.main.lazy-initialization=true`** — a blunt but very effective tool: beans are created on first use. Great for local development; in production it moves latency to the first request, so combine it with a warm-up call.\n\n" +
        "The structural answers:\n\n" +
        "- **Spring 6 AOT + GraalVM native image** — beans are resolved at build time; startup drops from seconds to tens of milliseconds. The cost is build time and reflection configuration.\n" +
        "- **CDS / AppCDS** archives cut classloading meaningfully with almost no code change (Boot 3.3 has first-class support).\n" +
        "- Checkpoint/restore (CRaC) for extreme cases.",
      code: `import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;

@SpringBootApplication(
    scanBasePackages = "com.acme.shop.api",              // 1. narrow the scan
    exclude = {                                          // 2. drop unused auto-config
        org.springframework.boot.autoconfigure.security.oauth2.client
            .servlet.OAuth2ClientAutoConfiguration.class,
        org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration.class
    })
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ShopApplication.class);
        app.setApplicationStartup(new BufferingApplicationStartup(4096)); // /actuator/startup
        app.run(args);
    }
}

// build.gradle - build-time component index instead of runtime scanning
// annotationProcessor 'org.springframework:spring-context-indexer'

// application.yml
// spring:
//   main:
//     lazy-initialization: true      # dev only, or pair with a warm-up request
//   jpa:
//     hibernate.ddl-auto: validate   # never 'update' in production
//     open-in-view: false
//   datasource:
//     hikari:
//       minimum-idle: 2
//       initialization-fail-timeout: 0

// Native image (startup in ~50 ms):
//   ./mvnw -Pnative native:compile
// CDS (Boot 3.3):
//   java -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh -jar app.jar
//   java -XX:SharedArchiveFile=app.jsa -jar app.jar`,
      codeLanguage: "java",
      explanation:
        "Measure with /actuator/startup first; then narrow scanning, exclude auto-config, lazy-init for dev, and AOT/CDS for a structural fix.",
      followUps: [
        "What is the downside of lazy-initialization in production?",
        "What does AOT processing precompute that saves startup time?",
      ],
    },
    {
      id: "b043",
      question: "How do you configure multiple DataSources in one Spring Boot application?",
      answer:
        "Once you add a second `DataSource`, Boot's auto-configuration backs off (it is `@ConditionalOnSingleCandidate`) and **you must wire everything explicitly**. That is exactly why interviewers ask it.\n\n" +
        "The full checklist for each data source:\n\n" +
        "1. A `DataSourceProperties` bean bound to its own prefix, and a `DataSource` built from it.\n" +
        "2. Mark **one** of everything `@Primary`, otherwise every injection point becomes ambiguous.\n" +
        "3. An `EntityManagerFactory` per source, each with its own `packagesToScan` — entities must live in **disjoint packages** or Hibernate will map them twice.\n" +
        "4. A `PlatformTransactionManager` per source; reference the non-primary one explicitly with `@Transactional(\"secondaryTxManager\")`.\n" +
        "5. `@EnableJpaRepositories(basePackages, entityManagerFactoryRef, transactionManagerRef)` per source, again with disjoint repository packages.\n" +
        "6. Separate Flyway/Liquibase configuration if both schemas are migrated.\n\n" +
        "**The critical caveat:** `@Transactional` gives you **one** transaction manager, so a method that writes to both databases is **not atomic**. Options:\n\n" +
        "- Accept it and design for idempotency and reconciliation (the usual, pragmatic answer).\n" +
        "- Use a JTA/XA transaction manager (Atomikos, Narayana) — two-phase commit, slow, operationally painful, and out of fashion.\n" +
        "- Restructure: transactional outbox plus an async consumer, which is what most teams actually do.\n\n" +
        "Mentioning the atomicity problem unprompted is what separates a senior answer from a copy-pasted configuration class.",
      code: `import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import javax.sql.DataSource;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.acme.shop.orders.repo",              // disjoint packages
    entityManagerFactoryRef = "ordersEmf",
    transactionManagerRef  = "ordersTxManager")
class OrdersDataSourceConfig {

    @Bean @Primary @ConfigurationProperties("app.datasource.orders")
    DataSource ordersDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean @Primary
    org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean ordersEmf(
            EntityManagerFactoryBuilder builder,
            @Qualifier("ordersDataSource") DataSource ds) {
        return builder.dataSource(ds)
                      .packages("com.acme.shop.orders.domain")
                      .persistenceUnit("orders").build();
    }

    @Bean @Primary
    PlatformTransactionManager ordersTxManager(@Qualifier("ordersEmf") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

@Configuration
@EnableJpaRepositories(
    basePackages = "com.acme.shop.reporting.repo",
    entityManagerFactoryRef = "reportingEmf",
    transactionManagerRef  = "reportingTxManager")
class ReportingDataSourceConfig {

    @Bean @ConfigurationProperties("app.datasource.reporting")
    DataSource reportingDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean reportingEmf(
            EntityManagerFactoryBuilder builder,
            @Qualifier("reportingDataSource") DataSource ds) {
        return builder.dataSource(ds)
                      .packages("com.acme.shop.reporting.domain")
                      .persistenceUnit("reporting").build();
    }

    @Bean PlatformTransactionManager reportingTxManager(
            @Qualifier("reportingEmf") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

// Usage: @Transactional("reportingTxManager")
// WARNING: a method writing to BOTH sources is NOT atomic without JTA/XA.`,
      codeLanguage: "java",
      explanation:
        "Everything must be declared twice with one @Primary — and the senior point is that two transaction managers means no cross-database atomicity.",
      followUps: [
        "How would you make a two-database write eventually consistent?",
        "Why must entity packages be disjoint?",
      ],
    },
    {
      id: "b044",
      question: "Explain HikariCP tuning: pool size, timeouts, and the symptoms of getting it wrong.",
      answer:
        "HikariCP is Boot's default pool. The parameters are few and each maps to a visible production symptom.\n\n" +
        "- **`maximum-pool-size`** (default 10) — the hard ceiling on concurrent database work. Hikari's own guidance is that **small pools outperform large ones**: a common starting formula is `connections = cores * 2 + effective_spindles`. A 100-connection pool against an 8-core database usually makes throughput *worse* through context switching and lock contention.\n" +
        "- **`minimum-idle`** — set it equal to `maximum-pool-size` for a fixed-size pool; that is Hikari's recommendation and it removes latency spikes from pool growth.\n" +
        "- **`connection-timeout`** (30s) — how long `getConnection()` waits before throwing `SQLTransientConnectionException: Connection is not available, request timed out`. That message is the single most common pool symptom; it means demand exceeds the pool, usually because of long transactions rather than too few connections.\n" +
        "- **`idle-timeout`** (10m) and **`max-lifetime`** (30m) — `max-lifetime` must be **shorter than any database or network idle timeout** (MySQL `wait_timeout`, an AWS NLB idle timeout), otherwise you hand out dead connections and see random 'connection reset'.\n" +
        "- **`leak-detection-threshold`** (off) — set it to ~30s in non-production to get a stack trace for a connection held too long. Best tool for finding a missing `close()` or an over-long `@Transactional`.\n" +
        "- **`validation-timeout`**, **`keepalive-time`**, **`connection-test-query`** (only for drivers without JDBC4 `isValid`).\n\n" +
        "**The sizing insight to state:** pool size must be considered together with `server.tomcat.threads.max`. 200 request threads and a 10-connection pool means 190 threads can be blocked waiting. The real fix is usually to shorten transactions — never open a transaction around an HTTP call — not to raise the number.\n\n" +
        "Monitor `hikaricp.connections.pending`, `.active` and `.usage` through Micrometer.",
      code: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/shop?ApplicationName=shop-api
    username: shop
    password: \${DB_PASSWORD}
    hikari:
      pool-name: shop-pool
      maximum-pool-size: 20          # cores*2 + spindles - NOT 200
      minimum-idle: 20               # fixed-size pool, no growth latency
      connection-timeout: 3000       # fail fast (ms) instead of queueing 30s
      validation-timeout: 2000
      idle-timeout: 600000           # 10m
      max-lifetime: 900000           # 15m - MUST be < db wait_timeout / LB idle timeout
      keepalive-time: 300000         # 5m - ping idle connections
      leak-detection-threshold: 30000  # stack trace for a 30s-held connection
      auto-commit: false             # let Spring manage transaction boundaries
      data-source-properties:
        reWriteBatchedInserts: true
        prepareThreshold: 0

  jpa:
    open-in-view: false              # stop holding a connection for view rendering
    properties:
      hibernate:
        jdbc.batch_size: 50
        order_inserts: true
        order_updates: true

# Symptoms -> cause
#   "Connection is not available, request timed out"  -> long transactions, not small pool
#   random "connection reset by peer"                 -> max-lifetime > db idle timeout
#   latency spikes after idle periods                 -> minimum-idle < maximum-pool-size
#   pool exhausted under load                         -> open-in-view: true, or HTTP call inside @Transactional`,
      codeLanguage: "yaml",
      explanation:
        "Small fixed pools beat large ones; max-lifetime must undercut the DB/LB idle timeout, and pool exhaustion is nearly always long transactions.",
      followUps: [
        "Why is open-in-view: false recommended?",
        "How do request threads and pool size interact under load?",
      ],
    },
    {
      id: "b045",
      question: "How do you design REST API versioning and pagination in Spring Boot?",
      answer:
        "Versioning — four strategies, with honest trade-offs:\n\n" +
        "1. **URI path** (`/api/v1/orders`) — most common, trivially cacheable, visible in logs and dashboards. Purists object that the resource identity should not change; in practice this is what most teams ship.\n" +
        "2. **Query parameter** (`/api/orders?version=2`) — easy to add, easy to forget, messy caching.\n" +
        "3. **Custom header** (`X-API-Version: 2`) — keeps URLs clean, but is invisible in a browser and harder to test and cache.\n" +
        "4. **Content negotiation** (`Accept: application/vnd.acme.order.v2+json`) — the most 'correct' REST answer and the least operationally convenient. Spring supports it directly with `produces`.\n\n" +
        "Whatever you pick: version the **contract**, not every class; keep N and N-1 alive; publish a deprecation window with a `Sunset` header; never make a breaking change inside a version. Additive changes (new optional fields) do not need a new version if clients ignore unknown properties.\n\n" +
        "Pagination:\n\n" +
        "- **Offset pagination** with `Pageable` is the default: `?page=0&size=20&sort=createdAt,desc`. Spring Data resolves it automatically. The problems are that `OFFSET 100000` forces the database to scan and discard 100k rows, and that concurrent inserts cause items to shift between pages.\n" +
        "- **Keyset / cursor pagination** (`where (created_at, id) < (:lastCreatedAt, :lastId) order by created_at desc, id desc limit 20`) has constant cost at any depth and is stable under concurrent writes. This is the answer for large or infinite-scroll datasets.\n" +
        "- Always cap the page size server-side (`spring.data.web.pageable.max-page-size`), never return an unbounded list, and return a DTO page rather than an entity page.",
      code: `import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")                              // 1. URI versioning
class OrderV1Controller {
    @GetMapping OrderV1 get(@PathVariable String id) { return null; }
}

@RestController
@RequestMapping("/api/orders")
class OrderContentNegotiatedController {
    @GetMapping(value = "/{id}", produces = "application/vnd.acme.order.v1+json")
    OrderV1 v1(@PathVariable String id) { return null; }

    @GetMapping(value = "/{id}", produces = "application/vnd.acme.order.v2+json")
    OrderV2 v2(@PathVariable String id) { return null; }        // 4. same URI, new media type
}

@RestController
@RequestMapping("/api/v2/orders")
class OrderV2Controller {

    private final OrderRepository repo;
    OrderV2Controller(OrderRepository repo) { this.repo = repo; }

    // Offset pagination - fine for shallow pages, degrades at high offsets.
    @GetMapping
    Page<OrderDto> list(@PageableDefault(size = 20, sort = "createdAt",
                                         direction = Sort.Direction.DESC) Pageable pageable) {
        return repo.findAll(pageable).map(OrderDto::from);
    }

    // Keyset pagination - constant cost at any depth, stable under inserts.
    @GetMapping("/cursor")
    CursorPage<OrderDto> byCursor(@RequestParam(required = false) Instant afterCreatedAt,
                                  @RequestParam(required = false) Long afterId,
                                  @RequestParam(defaultValue = "20") int limit) {
        int capped = Math.min(limit, 100);                      // always cap server-side
        List<OrderDto> rows = repo.keyset(afterCreatedAt, afterId, capped);
        return CursorPage.of(rows, capped);
    }
}

// spring.data.web.pageable.max-page-size: 100
// spring.data.web.pageable.one-indexed-parameters: false`,
      codeLanguage: "java",
      explanation:
        "URI versioning wins on operability; keyset pagination is the correct answer for deep pages because OFFSET cost grows linearly.",
      followUps: [
        "Why does offset pagination produce duplicate rows under concurrent inserts?",
        "How do you deprecate v1 without breaking clients?",
      ],
    },
    {
      id: "b046",
      question: "How do you set up observability — logging, metrics and tracing — in a Boot 3 service?",
      answer:
        "Three pillars, and a senior answer connects them.\n\n" +
        "Logging:\n\n" +
        "- Logback by default via `spring-boot-starter-logging` behind the SLF4J facade.\n" +
        "- **Structured JSON logs** so a log platform can index fields; Boot 3.4 has built-in structured logging (`logging.structured.format.console=ecs`), otherwise use `logstash-logback-encoder`.\n" +
        "- **MDC** carries `traceId`, `spanId`, `tenantId` and `userId` into every line. Populate it in a filter and **always clear it in a `finally`** — thread pools reuse threads and a stale MDC attributes one user's logs to another.\n" +
        "- Never log secrets, tokens, card numbers or full request bodies.\n\n" +
        "Metrics:\n\n" +
        "- **Micrometer** is the facade; add `micrometer-registry-prometheus` and expose `/actuator/prometheus`.\n" +
        "- Instrument the **RED** signals (Rate, Errors, Duration) and business counters. `@Timed`, `Counter`, `Timer`, `Gauge`, `DistributionSummary`.\n" +
        "- **Cardinality discipline**: never use a user id, order id or raw URL as a tag. Unbounded label values are how teams take down Prometheus.\n\n" +
        "Tracing:\n\n" +
        "- Boot 3 replaced Spring Cloud Sleuth with **Micrometer Tracing**, bridged to OpenTelemetry or Brave, exporting to Zipkin, Tempo or an OTLP collector.\n" +
        "- Context propagates over `RestClient`/`WebClient`/`RestTemplate` and messaging automatically; `@NewSpan`/`@SpanTag` (or `Observation`) add custom spans.\n" +
        "- Sample aggressively in production (`management.tracing.sampling.probability=0.1`) but always keep error traces.\n\n" +
        "**The connective tissue is the `Observation` API**: one instrumentation produces a metric, a span and a log context together, so a slow trace links to the exact log lines and the metric that alerted you.",
      code: `import io.micrometer.core.instrument.*;
import io.micrometer.observation.annotation.Observed;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.stereotype.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;

@Component
class CorrelationIdFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest req,
            jakarta.servlet.http.HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String cid = java.util.Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                                       .orElseGet(() -> UUID.randomUUID().toString());
        MDC.put("correlationId", cid);
        res.setHeader("X-Correlation-Id", cid);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();                       // MUST clear - pooled threads are reused
        }
    }
}

@Service
class OrderService {
    private final Counter placed;
    private final Timer   latency;

    OrderService(MeterRegistry registry) {
        this.placed  = Counter.builder("orders.placed")
                              .tag("channel", "web")       // LOW cardinality tags only
                              .register(registry);
        this.latency = Timer.builder("orders.place.latency")
                            .publishPercentiles(0.5, 0.95, 0.99)
                            .register(registry);
    }

    @Observed(name = "order.place",            // one call -> metric + span + log context
              contextualName = "place-order")
    public void place(String ref) {
        latency.record(() -> {
            placed.increment();
            // ... do the work
        });
    }
}

// management:
//   endpoints.web.exposure.include: health,prometheus,metrics
//   tracing.sampling.probability: 0.1
//   otlp.tracing.endpoint: http://otel-collector:4318/v1/traces
// logging:
//   structured.format.console: ecs
//   pattern.level: "%5p [\${spring.application.name},%X{traceId:-},%X{spanId:-}]"`,
      codeLanguage: "java",
      explanation:
        "Micrometer Observation unifies metric, span and log context; the failure modes are unbounded tag cardinality and an uncleared MDC on pooled threads.",
      followUps: [
        "Why is a user id a dangerous metric tag?",
        "What replaced Spring Cloud Sleuth in Boot 3?",
      ],
    },
  ],
  meta: {
    b037: { difficulty: "hard", priority: "high", tags: ["startup", "lifecycle", "refresh"], readMinutes: 5 },
    b038: { difficulty: "hard", priority: "very-high", tags: ["autoconfiguration", "starter", "asm"], readMinutes: 5 },
    b039: { difficulty: "medium", priority: "very-high", tags: ["properties", "precedence", "relaxed-binding"], readMinutes: 4 },
    b040: { difficulty: "medium", priority: "high", tags: ["tomcat", "embedded", "virtual-threads"], readMinutes: 4 },
    b041: { difficulty: "medium", priority: "high", tags: ["actuator", "health", "kubernetes"], readMinutes: 5 },
    b042: { difficulty: "hard", priority: "medium", tags: ["startup", "performance", "aot"], readMinutes: 5 },
    b043: { difficulty: "hard", priority: "high", tags: ["datasource", "jpa", "transactions"], readMinutes: 5 },
    b044: { difficulty: "hard", priority: "very-high", tags: ["hikari", "connection-pool", "tuning"], readMinutes: 5 },
    b045: { difficulty: "medium", priority: "high", tags: ["rest", "versioning", "pagination"], readMinutes: 5 },
    b046: { difficulty: "medium", priority: "high", tags: ["observability", "micrometer", "tracing"], readMinutes: 5 },
  },
});
