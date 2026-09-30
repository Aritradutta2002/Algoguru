import { BACKEND_TOPICS } from "./topics";

/**
 * The hands-on practice lab.
 *
 * Every problem is something you could be asked to write on a whiteboard or in
 * a 45-minute pairing round: a scenario, an explicit task list, hints that
 * unlock it without giving it away, and a complete worked solution.
 */

export type PracticeDifficulty = "easy" | "medium" | "hard";

export interface BackendPracticeProblem {
  /** Stable id, e.g. "p01". Progress is keyed by this. */
  id: string;
  /** Topic id from BACKEND_TOPICS. */
  topic: string;
  title: string;
  difficulty: PracticeDifficulty;
  estimatedMinutes: number;
  /** The problem statement, in the markdown-lite dialect. */
  scenario: string;
  /** Explicit acceptance criteria — tick them off as you go. */
  tasks: string[];
  /** Optional skeleton to start from. */
  starterCode?: string;
  /** Progressive hints, least to most revealing. */
  hints: string[];
  /** Complete worked solution. */
  solution: string;
  solutionLanguage: string;
  /** What an interviewer is really assessing, and how to talk about it. */
  discussion: string;
  relatedQuestionIds?: string[];
}

export const BACKEND_PRACTICE_PROBLEMS: BackendPracticeProblem[] = [
  /* ================================================================ */
  /* Java annotations                                                  */
  /* ================================================================ */
  {
    id: "p01",
    topic: "java-annotations",
    title: "Build an @Audited annotation and read it reflectively",
    difficulty: "easy",
    estimatedMinutes: 25,
    scenario:
      "Your team wants a lightweight audit marker that works without Spring. Define an annotation that can be placed on a class or a method, carries an action name and a severity, and can be discovered at runtime by a plain reflection-based scanner.\n\n" +
      "The scanner must find the annotation whether it sits on the method or on the declaring class, with the method-level value winning.",
    tasks: [
      "Declare `@Audited` with attributes `action` (String, required) and `severity` (an enum, default MEDIUM).",
      "Choose the correct `@Retention` and `@Target` and justify both.",
      "Write `AuditScanner.describe(Method)` returning the effective `@Audited`, preferring the method-level one.",
      "Prove that CLASS retention would make the scanner return nothing.",
    ],
    starterCode: `public @interface Audited {
    // TODO: attributes
}

class AuditScanner {
    static Optional<Audited> effective(Method method) {
        // TODO
        return Optional.empty();
    }
}`,
    hints: [
      "Annotations are only visible to reflection when they are compiled with RetentionPolicy.RUNTIME — the default is CLASS.",
      "An attribute with no `default` becomes mandatory at every use site.",
      "`Method.getAnnotation` looks only at the method; `method.getDeclaringClass().getAnnotation` looks at the class.",
    ],
    solution: `import java.lang.annotation.*;
import java.lang.reflect.Method;
import java.util.Optional;

@Retention(RetentionPolicy.RUNTIME)     // MUST be RUNTIME or reflection sees nothing
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
@Inherited                               // class-level uses are inherited by subclasses
public @interface Audited {
    /** No default => mandatory at every use site. */
    String action();

    Severity severity() default Severity.MEDIUM;

    enum Severity { LOW, MEDIUM, HIGH }
}

class AuditScanner {

    /** Method-level wins; otherwise fall back to the declaring class. */
    static Optional<Audited> effective(Method method) {
        Audited onMethod = method.getAnnotation(Audited.class);
        if (onMethod != null) return Optional.of(onMethod);
        return Optional.ofNullable(method.getDeclaringClass().getAnnotation(Audited.class));
    }

    static String describe(Method method) {
        return effective(method)
            .map(a -> method.getName() + " -> " + a.action() + " [" + a.severity() + "]")
            .orElse(method.getName() + " -> not audited");
    }
}

@Audited(action = "account-access")
class AccountService {

    @Audited(action = "transfer", severity = Audited.Severity.HIGH)
    void transfer(long from, long to, long amount) { }

    void readBalance(long id) { }        // inherits the class-level @Audited
}

class Demo {
    public static void main(String[] args) throws Exception {
        System.out.println(AuditScanner.describe(
            AccountService.class.getDeclaredMethod("transfer", long.class, long.class, long.class)));
        // transfer -> transfer [HIGH]

        System.out.println(AuditScanner.describe(
            AccountService.class.getDeclaredMethod("readBalance", long.class)));
        // readBalance -> account-access [MEDIUM]

        // Proof that retention matters: with RetentionPolicy.CLASS the annotation
        // is written to the class file but NOT exposed reflectively, so
        // getAnnotation(...) returns null and describe() reports "not audited".
        System.out.println(Audited.class.getAnnotation(Retention.class).value());  // RUNTIME
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This is the warm-up that separates people who have written a framework hook from people who have only consumed one. The two things being checked are: do you know the default retention is CLASS (so a missing `@Retention(RUNTIME)` silently breaks everything), and do you understand that `@Inherited` only works for class-level annotations. If you can also mention `AnnotatedElementUtils`/`MergedAnnotations` as the reason Spring's meta-annotations behave better than plain reflection, you are clearly ahead.",
    relatedQuestionIds: ["b001", "b002", "b003", "b011"],
  },
  {
    id: "p02",
    topic: "java-annotations",
    title: "Write a repeatable @Schedule annotation",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "A job runner needs to accept several schedules on one method. Make `@Schedule` repeatable, then write the lookup that returns **all** of them — including the case where only one was applied.",
    tasks: [
      "Declare `@Schedule` with a `cron` attribute and make it `@Repeatable`.",
      "Declare the container annotation with the correct `value()` signature.",
      "Write `schedulesOf(Method)` that returns every schedule, for one use and for many.",
      "Demonstrate why `getAnnotation(Schedule.class)` returns null when it was used twice.",
    ],
    hints: [
      "The container's `value()` must be an array of the repeatable type, and needs at least the same retention and target.",
      "`getAnnotationsByType` was added in Java 8 precisely to hide the container.",
    ],
    solution: `import java.lang.annotation.*;
import java.lang.reflect.Method;
import java.util.Arrays;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(Schedules.class)             // names the container
public @interface Schedule {
    String cron();
    String zone() default "UTC";
}

@Retention(RetentionPolicy.RUNTIME)      // must be >= the repeatable's retention
@Target(ElementType.METHOD)
public @interface Schedules {
    Schedule[] value();                  // MUST be named value() and be an array
}

class JobRunner {

    @Schedule(cron = "0 0 9 * * MON-FRI")
    @Schedule(cron = "0 0 12 * * SAT", zone = "Europe/Berlin")
    void sendDigest() { }

    @Schedule(cron = "0 */15 * * * *")
    void poll() { }

    static Schedule[] schedulesOf(Method method) {
        // Works for ONE use and for MANY - the container is unwrapped for you.
        return method.getAnnotationsByType(Schedule.class);
    }

    public static void main(String[] args) throws Exception {
        Method digest = JobRunner.class.getDeclaredMethod("sendDigest");
        Method poll   = JobRunner.class.getDeclaredMethod("poll");

        System.out.println(Arrays.stream(schedulesOf(digest))
            .map(s -> s.cron() + "@" + s.zone()).toList());
        // [0 0 9 * * MON-FRI@UTC, 0 0 12 * * SAT@Europe/Berlin]

        System.out.println(Arrays.stream(schedulesOf(poll))
            .map(Schedule::cron).toList());                       // [0 */15 * * * *]

        // THE TRAP: repeated uses are replaced by the container, so the direct
        // lookup finds nothing.
        System.out.println(digest.getAnnotation(Schedule.class));  // null
        System.out.println(digest.getAnnotation(Schedules.class).value().length);  // 2

        // A single use is NOT wrapped, so the direct lookup does work there.
        System.out.println(poll.getAnnotation(Schedule.class).cron());   // 0 */15 * * * *
        System.out.println(poll.getAnnotation(Schedules.class));         // null
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The whole point is the asymmetry: one use stays bare, two or more get wrapped in the container. Code that calls `getAnnotation` works in testing (one schedule) and breaks in production (two). Saying 'always use `getAnnotationsByType` for repeatable annotations' is the answer they want. Spring's own `@Scheduled` is repeatable via `@Schedules` for exactly this reason.",
    relatedQuestionIds: ["b007", "b105"],
  },
  {
    id: "p03",
    topic: "java-annotations",
    title: "Cache reflective annotation lookups",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Profiling shows that a hot interceptor spends most of its time in `method.getAnnotation(...)`. Every call allocates: the JVM copies the annotation array defensively so callers cannot mutate shared state.\n\n" +
      "Build a thread-safe, memory-safe cache for annotation lookups and measure the difference.",
    tasks: [
      "Write `AnnotationCache.find(Method, Class<A>)` returning an `Optional<A>`.",
      "Make it thread-safe without a global lock.",
      "Make sure the cache cannot pin classloaders in a redeployable container.",
      "Benchmark cached vs uncached over a million lookups.",
    ],
    hints: [
      "`getAnnotations()` clones the array on every call — that is the allocation you are removing.",
      "`ConcurrentHashMap.computeIfAbsent` gives you atomic memoisation, but never do IO or recursion inside the mapping function.",
      "A cache keyed by `Method` holds a strong reference to the declaring class, and therefore to its classloader.",
    ],
    solution: `import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public final class AnnotationCache {

    /** Sentinel: ConcurrentHashMap forbids null values, but "absent" must be cached too. */
    private static final Object NONE = new Object();

    private record Key(Method method, Class<? extends Annotation> type) { }

    private final ConcurrentHashMap<Key, Object> cache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <A extends Annotation> Optional<A> find(Method method, Class<A> type) {
        Object cached = cache.computeIfAbsent(new Key(method, type), key -> {
            A found = key.method().getAnnotation(type);
            if (found == null) found = key.method().getDeclaringClass().getAnnotation(type);
            return found == null ? NONE : found;     // cache the negative result too
        });
        return cached == NONE ? Optional.empty() : Optional.of((A) cached);
    }

    /** Call on context shutdown / undeploy so classloaders can be collected. */
    public void clear() { cache.clear(); }

    public int size() { return cache.size(); }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        Method method = Sample.class.getDeclaredMethod("work");
        AnnotationCache annotationCache = new AnnotationCache();
        int iterations = 1_000_000;

        long t0 = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            Marker m = method.getAnnotation(Marker.class);
            if (m == null) throw new AssertionError();
        }
        long uncached = (System.nanoTime() - t0) / 1_000_000;

        t0 = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            if (annotationCache.find(method, Marker.class).isEmpty()) throw new AssertionError();
        }
        long cached = (System.nanoTime() - t0) / 1_000_000;

        System.out.println("uncached " + uncached + "ms, cached " + cached + "ms");
        System.out.println("entries " + annotationCache.size());
    }

    @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
    @interface Marker { }

    static class Sample { @Marker void work() { } }
}`,
    solutionLanguage: "java",
    discussion:
      "Three things are being probed. First, do you know *why* reflective lookup is slow — the defensive array copy, not the search. Second, can you memoise correctly: `ConcurrentHashMap` rejects nulls, so a negative result needs a sentinel or you re-query forever. Third, do you think about lifecycle — a static cache keyed by `Method` is a classic Metaspace leak in a redeployable container. Spring solves all of this in `AnnotatedElementUtils`, and mentioning that shows you know the ecosystem.",
    relatedQuestionIds: ["b006", "b089"],
  },
  {
    id: "p04",
    topic: "java-annotations",
    title: "Custom Bean Validation constraint with a database check",
    difficulty: "medium",
    estimatedMinutes: 35,
    scenario:
      "Registration must reject an email that is already taken. Write a `@UniqueEmail` constraint whose validator injects a Spring repository, and make sure it produces a clean 400 response rather than a 500.",
    tasks: [
      "Declare `@UniqueEmail` with the three mandatory Bean Validation attributes.",
      "Implement `ConstraintValidator<UniqueEmail, String>` as a Spring bean with an injected repository.",
      "Handle null correctly — a null value is @NotNull's job, not yours.",
      "Show the controller usage and the resulting error payload.",
    ],
    hints: [
      "`message`, `groups` and `payload` are mandatory; omitting any of them fails validator initialisation at runtime.",
      "Since Spring 4.3 the validator is resolved as a bean, so constructor injection just works.",
      "Returning `true` for null keeps each constraint responsible for exactly one thing.",
    ],
    solution: `import jakarta.validation.*;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.*;
import java.util.*;

@Documented
@Constraint(validatedBy = UniqueEmailValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface UniqueEmail {
    // All three are MANDATORY for a Bean Validation constraint.
    String message() default "{validation.email.taken}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

@Component                                   // a Spring bean => injection works
class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    private final UserRepository repository;
    UniqueEmailValidator(UserRepository repository) { this.repository = repository; }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        // Null is @NotNull's responsibility - one constraint, one concern.
        if (email == null || email.isBlank()) return true;

        boolean taken = repository.existsByEmailIgnoreCase(email);
        if (taken) {
            // Optional: replace the default message with a contextual one.
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    "an account already exists for this address")
                   .addConstraintViolation();
        }
        return !taken;
    }
}

record RegistrationRequest(
    @NotBlank @Size(max = 255) @Email @UniqueEmail String email,
    @NotBlank @Size(min = 12, max = 128) String password,
    @NotBlank @Size(max = 100) String displayName) { }

@RestController
@RequestMapping("/api/users")
class RegistrationController {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@RequestBody @Valid RegistrationRequest request) {
        return Map.of("email", request.email());
    }
}

@RestControllerAdvice
class ValidationExceptionHandler {

    /** Turns the violation set into a field-keyed 400 payload. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail onInvalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));

        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return problem;
    }

    /** Method-level validation throws a DIFFERENT exception - handle it too. */
    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail onViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v ->
            errors.put(v.getPropertyPath().toString(), v.getMessage()));
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return problem;
    }
}

interface UserRepository { boolean existsByEmailIgnoreCase(String email); }

/*
POST /api/users  {"email":"taken@example.com","password":"...","displayName":"A"}

400 Bad Request
{
  "title": "Validation failed",
  "status": 400,
  "errors": { "email": "an account already exists for this address" }
}
*/`,
    solutionLanguage: "java",
    discussion:
      "Two failure modes get caught in review. First, forgetting `groups`/`payload` — the constraint compiles and then blows up at runtime with an unhelpful message. Second, the race: `existsByEmail` followed by an insert is check-then-act, so you still need a unique index and a `DataIntegrityViolationException` handler. Saying that unprompted is the senior signal. Also worth noting: `@Valid` cascades into nested objects while `@Validated` does not, and method validation throws `ConstraintViolationException` rather than `MethodArgumentNotValidException`.",
    relatedQuestionIds: ["b013", "b033"],
  },

  /* ================================================================ */
  /* Spring annotations                                                */
  /* ================================================================ */
  {
    id: "p05",
    topic: "spring-annotations",
    title: "Fix the @Transactional self-invocation bug",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "A batch import 'works' in unit tests but never rolls back in production. The code below calls a `@Transactional` method from another method on the same bean.\n\n" +
      "Reproduce the bug, explain it, then show three different fixes and say which you would ship.",
    tasks: [
      "Explain precisely why no transaction is started.",
      "Fix it by extracting a collaborating bean (the recommended fix).",
      "Fix it with `TransactionTemplate` (no proxy involved at all).",
      "Fix it with self-injection or `AopContext` and explain why you would not ship those.",
    ],
    starterCode: `@Service
public class ImportService {

    public void importAll(List<Row> rows) {
        for (Row row : rows) {
            importOne(row);          // BUG: no transaction, no rollback
        }
    }

    @Transactional
    public void importOne(Row row) { ... }
}`,
    hints: [
      "Spring AOP is proxy-based: advice only runs when the call arrives through the proxy from outside.",
      "`this.method()` is a direct virtual call on the target object — the proxy never sees it.",
      "The same rule applies to @Async, @Cacheable, @PreAuthorize and @Retryable.",
    ],
    solution: `import org.springframework.aop.framework.AopContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

// ---------------------------------------------------------------
// THE BUG
// ---------------------------------------------------------------
@Service
class BrokenImportService {

    public void importAll(List<Row> rows) {
        for (Row row : rows) {
            importOne(row);      // 'this.importOne(...)' - bypasses the proxy entirely
        }
    }

    @Transactional               // never applied on a self-invocation
    public void importOne(Row row) { persist(row); }

    private void persist(Row row) { }
}

// ---------------------------------------------------------------
// FIX 1 (SHIP THIS): extract a collaborator. The call now crosses a
// proxy boundary, so the advice runs.
// ---------------------------------------------------------------
@Service
class ImportService {

    private final RowImporter rowImporter;
    ImportService(RowImporter rowImporter) { this.rowImporter = rowImporter; }

    public ImportReport importAll(List<Row> rows) {
        int imported = 0, failed = 0;
        for (Row row : rows) {
            try {
                rowImporter.importOne(row);       // through the proxy => transactional
                imported++;
            } catch (RuntimeException e) {
                failed++;                          // one bad row does not kill the batch
            }
        }
        return new ImportReport(imported, failed);
    }
}

@Service
class RowImporter {
    /** REQUIRES_NEW: each row commits or rolls back independently. */
    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 10)
    public void importOne(Row row) { persist(row); }

    private void persist(Row row) { }
}

// ---------------------------------------------------------------
// FIX 2: programmatic transactions - no proxy, no surprises.
// ---------------------------------------------------------------
@Service
class ProgrammaticImportService {

    private final TransactionTemplate transactionTemplate;

    ProgrammaticImportService(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
        this.transactionTemplate.setPropagationBehavior(
            TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.transactionTemplate.setTimeout(10);
    }

    public void importAll(List<Row> rows) {
        for (Row row : rows) {
            transactionTemplate.executeWithoutResult(status -> persist(row));
        }
    }

    private void persist(Row row) { }
}

// ---------------------------------------------------------------
// FIX 3: works, but do not ship it. Self-injection and AopContext both
// make the proxy boundary implicit and confusing for the next reader.
// ---------------------------------------------------------------
@Service
class SelfInjectingImportService {

    @Lazy private final SelfInjectingImportService self;   // @Lazy breaks the cycle

    SelfInjectingImportService(@Lazy SelfInjectingImportService self) { this.self = self; }

    public void importAll(List<Row> rows) {
        rows.forEach(self::importOne);      // via the proxy
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(Row row) { }

    /** Requires @EnableAspectJAutoProxy(exposeProxy = true). */
    public void importAllViaAopContext(List<Row> rows) {
        SelfInjectingImportService proxy =
            (SelfInjectingImportService) AopContext.currentProxy();
        rows.forEach(proxy::importOne);
    }
}

record Row(String id, String payload) { }
record ImportReport(int imported, int failed) { }`,
    solutionLanguage: "java",
    discussion:
      "This is one of the two or three most-asked Spring bugs, and the reason is that it fails silently — no exception, no log line, just data that should have rolled back and did not. The core insight is that Spring AOP is *proxy*-based, not bytecode-weaving-based, so advice is only applied to calls that enter through the proxy. Mention that the same trap applies to `@Async`, `@Cacheable`, `@PreAuthorize` and `@Retryable`, that private and final methods can never be advised, and that AspectJ load-time weaving is the only way to make self-invocation work. The propagation choice (`REQUIRES_NEW` per row so one bad row does not poison the batch) is the part that shows production experience.",
    relatedQuestionIds: ["b022", "b101", "b113"],
  },
  {
    id: "p06",
    topic: "spring-annotations",
    title: "Type-safe configuration with @ConfigurationProperties",
    difficulty: "easy",
    estimatedMinutes: 25,
    scenario:
      "A service is littered with `@Value(\"${...}\")` fields. Several typos reached production because a missing property only fails when that code path is first executed.\n\n" +
      "Replace them with validated, immutable, fail-fast configuration.",
    tasks: [
      "Model the configuration as a record with nested groups.",
      "Add JSR-303 constraints so a bad value fails at startup, not at first use.",
      "Support relaxed binding, durations and a map of named downstreams.",
      "Show the YAML and the failure output for an invalid value.",
    ],
    hints: [
      "A record with a single constructor is bound by constructor automatically in Boot 3 — no `@ConstructorBinding` needed.",
      "`@Validated` on the properties class turns constraint violations into a startup failure.",
      "`Duration` and `DataSize` are bound from `30s`, `5m`, `10MB` out of the box.",
    ],
    solution: `import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(

    @NotBlank String name,

    @NotNull @Valid Http http,                 // @Valid cascades into the nested record

    @NotEmpty Map<String, @Valid Downstream> downstreams,

    @DefaultValue("false") boolean maintenanceMode
) {

    public record Http(
        @NotNull @DefaultValue("2s")  Duration connectTimeout,
        @NotNull @DefaultValue("10s") Duration readTimeout,
        @Min(1) @Max(1000) @DefaultValue("50") int maxConnections,
        @NotNull @DefaultValue("10MB") DataSize maxPayload
    ) { }

    public record Downstream(
        @NotNull URI baseUrl,
        @NotBlank String apiKey,
        @DefaultValue("3") @Min(0) @Max(10) int retries,
        @DefaultValue("") List<String> allowedScopes
    ) { }
}

/*
application.yml
---------------
app:
  name: orders-service
  maintenance-mode: false
  http:
    connect-timeout: 2s          # Duration binding
    read-timeout: 10s
    max-connections: 50          # relaxed binding: maxConnections / MAX_CONNECTIONS
    max-payload: 10MB            # DataSize binding
  downstreams:
    inventory:
      base-url: https://inventory.internal
      api-key: \${INVENTORY_KEY}
      retries: 3
      allowed-scopes: [inventory:read, inventory:reserve]
    billing:
      base-url: https://billing.internal
      api-key: \${BILLING_KEY}

Registering it (either one):
  @SpringBootApplication
  @ConfigurationPropertiesScan                       // scans for the annotation
  ...or...
  @EnableConfigurationProperties(AppProperties.class)

Using it - injected like any other bean:
  @Service
  class InventoryClient {
      private final AppProperties.Downstream config;
      InventoryClient(AppProperties properties) {
          this.config = properties.downstreams().get("inventory");
      }
  }

Setting max-connections: 0 now fails AT STARTUP:
  ***************************
  APPLICATION FAILED TO START
  ***************************
  Binding to target AppProperties failed:
      Property: app.http.max-connections
      Value:    0
      Reason:   must be greater than or equal to 1
  Action: Update your application's configuration
*/`,
    solutionLanguage: "java",
    discussion:
      "The argument for `@ConfigurationProperties` over `@Value` is fail-fast: a typo or an out-of-range value stops the application at startup with a precise message instead of throwing an NPE at 3 a.m. on a rarely-used code path. The other wins are relaxed binding (so `MAX_CONNECTIONS` from an environment variable maps onto `maxConnections`), automatic conversion of `Duration`/`DataSize`, IDE completion via `spring-boot-configuration-processor`, grouping related settings into one testable object, and immutability. The one thing `@Value` still does that this does not is SpEL.",
    relatedQuestionIds: ["b026", "b039"],
  },
  {
    id: "p07",
    topic: "spring-annotations",
    title: "Resolve an ambiguous bean with @Qualifier and @Primary",
    difficulty: "easy",
    estimatedMinutes: 20,
    scenario:
      "Adding a second `PaymentGateway` implementation breaks startup with `NoUniqueBeanDefinitionException`. Fix it three ways and choose the most maintainable.",
    tasks: [
      "Reproduce the failure and read what the message is telling you.",
      "Fix it with `@Primary` and explain when that is the right choice.",
      "Fix it with a custom qualifier annotation rather than a string.",
      "Inject *all* implementations and select at runtime by a strategy key.",
    ],
    hints: [
      "@Qualifier is evaluated after @Primary, so a qualifier always wins.",
      "A string bean name is not refactor-safe; a meta-annotated qualifier is.",
      "Injecting `Map<String, PaymentGateway>` gives you bean-name-to-bean, which makes a registry trivial.",
    ],
    solution: `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.*;

import java.lang.annotation.*;
import java.util.Map;

interface PaymentGateway { String charge(long cents); }

// ---- Custom qualifiers: type-safe, refactor-safe, self-documenting ----
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
@interface Card { }

@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
@interface Wallet { }

@Component("cardGateway")
@Card
@Primary                                   // the default when nothing else is specified
class CardGateway implements PaymentGateway {
    public String charge(long cents) { return "card:" + cents; }
}

@Component("walletGateway")
@Wallet
class WalletGateway implements PaymentGateway {
    public String charge(long cents) { return "wallet:" + cents; }
}

// ---- Option A: rely on @Primary ----
@Service
class DefaultCheckout {
    private final PaymentGateway gateway;
    DefaultCheckout(PaymentGateway gateway) { this.gateway = gateway; }   // -> CardGateway
}

// ---- Option B: a custom qualifier (PREFERRED for a fixed choice) ----
@Service
class WalletCheckout {
    private final PaymentGateway gateway;
    WalletCheckout(@Wallet PaymentGateway gateway) { this.gateway = gateway; }
}

// ---- Option C: a string qualifier - works, but breaks silently on rename ----
@Service
class LegacyCheckout {
    private final PaymentGateway gateway;
    LegacyCheckout(@Qualifier("walletGateway") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

// ---- Option D: inject them ALL and pick at runtime (PREFERRED for a dynamic choice) ----
@Service
class GatewayRegistry {

    private final Map<String, PaymentGateway> gateways;   // bean name -> bean

    GatewayRegistry(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }

    public String charge(String method, long cents) {
        PaymentGateway gateway = gateways.get(method + "Gateway");
        if (gateway == null) throw new IllegalArgumentException("unknown method: " + method);
        return gateway.charge(cents);
    }

    public java.util.Set<String> supported() { return gateways.keySet(); }
}

/*
Without any of this, startup fails with:

  Parameter 0 of constructor in DefaultCheckout required a single bean,
  but 2 were found:
      - cardGateway
      - walletGateway
  Action: Consider marking one of the beans as @Primary, updating the consumer
  to accept multiple beans, or using @Qualifier to identify the bean that
  should be consumed.

Resolution order: type -> @Qualifier -> @Primary -> parameter name.
*/`,
    solutionLanguage: "java",
    discussion:
      "The decision rule is what matters: `@Primary` for 'there is an obvious default', a **custom qualifier annotation** for 'this consumer always needs that specific one', and **inject the collection** for 'the choice is data-driven'. String qualifiers are the common answer and the weakest one — rename the bean and you get a runtime failure the compiler could not catch. Injecting `Map<String, T>` is the trick that impresses: it gives you a strategy registry for free, and `List<T>` plus `@Order` gives you an ordered chain.",
    relatedQuestionIds: ["b020", "b021"],
  },
  {
    id: "p08",
    topic: "spring-annotations",
    title: "Write a conditional auto-configuration for a starter",
    difficulty: "hard",
    estimatedMinutes: 40,
    scenario:
      "Package your team's rate limiter as a reusable starter. It must activate only when the library is on the classpath and a property enables it, must back off if the user defines their own bean, and must be fully overridable.",
    tasks: [
      "Write the `@AutoConfiguration` class with the right conditions.",
      "Register it in the Boot 3 imports file (not `spring.factories`).",
      "Bind typed properties with sensible defaults.",
      "Show how a user overrides the bean, and how to debug why it did or did not apply.",
    ],
    hints: [
      "`@ConditionalOnClass` is evaluated with ASM against the class file, so referencing an absent class does not throw.",
      "`@ConditionalOnMissingBean` only sees beans registered before it — that is why it belongs on auto-configuration, never on user config.",
      "`--debug` prints the full conditions report: positive matches, negative matches and exclusions.",
    ],
    solution: `// ---------------------------------------------------------------
// src/main/java/com/example/ratelimit/RateLimitAutoConfiguration.java
// ---------------------------------------------------------------
package com.example.ratelimit;

import io.github.bucket4j.Bucket;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.boot.context.properties.*;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

import jakarta.validation.constraints.*;
import java.time.Duration;

@AutoConfiguration
@ConditionalOnClass(Bucket.class)                       // the library is present
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(prefix = "app.rate-limit", name = "enabled",
                       havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitAutoConfiguration {

    /** Backs off entirely if the application declares its own RateLimiter. */
    @Bean
    @ConditionalOnMissingBean
    public RateLimiter rateLimiter(RateLimitProperties properties) {
        return new TokenBucketRateLimiter(properties);
    }

    @Bean
    @ConditionalOnMissingBean(name = "rateLimitFilterRegistration")
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(
            RateLimiter rateLimiter, RateLimitProperties properties) {
        FilterRegistrationBean<RateLimitFilter> registration =
            new FilterRegistrationBean<>(new RateLimitFilter(rateLimiter, properties));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 100);
        registration.addUrlPatterns(properties.pathPattern());
        return registration;
    }

    /** Only when Redis is also present: swap in the distributed implementation. */
    @Bean
    @ConditionalOnClass(name = "org.springframework.data.redis.core.StringRedisTemplate")
    @ConditionalOnBean(type = "org.springframework.data.redis.core.StringRedisTemplate")
    @ConditionalOnMissingBean
    public RateLimiter distributedRateLimiter(RateLimitProperties properties) {
        return new RedisRateLimiter(properties);
    }
}

@Validated
@ConfigurationProperties(prefix = "app.rate-limit")
record RateLimitProperties(
    @DefaultValue("true")  boolean enabled,
    @DefaultValue("100") @Min(1) int capacity,
    @DefaultValue("1m") @NotNull Duration refillPeriod,
    @DefaultValue("/api/*") @NotBlank String pathPattern,
    @DefaultValue("IP") Key key
) {
    enum Key { IP, PRINCIPAL, API_KEY }
}

interface RateLimiter { boolean tryConsume(String key); }
class TokenBucketRateLimiter implements RateLimiter {
    TokenBucketRateLimiter(RateLimitProperties p) { }
    public boolean tryConsume(String key) { return true; }
}
class RedisRateLimiter implements RateLimiter {
    RedisRateLimiter(RateLimitProperties p) { }
    public boolean tryConsume(String key) { return true; }
}
class RateLimitFilter implements jakarta.servlet.Filter {
    RateLimitFilter(RateLimiter limiter, RateLimitProperties properties) { }
    public void doFilter(jakarta.servlet.ServletRequest rq, jakarta.servlet.ServletResponse rs,
                         jakarta.servlet.FilterChain chain)
            throws java.io.IOException, jakarta.servlet.ServletException {
        chain.doFilter(rq, rs);
    }
}

/*
---------------------------------------------------------------
src/main/resources/META-INF/spring/
    org.springframework.boot.autoconfigure.AutoConfiguration.imports
---------------------------------------------------------------
com.example.ratelimit.RateLimitAutoConfiguration

(In Boot 2.x this was META-INF/spring.factories under the key
 org.springframework.boot.autoconfigure.EnableAutoConfiguration=)

---------------------------------------------------------------
The consumer's application.yml
---------------------------------------------------------------
app.rate-limit:
  enabled: true
  capacity: 500
  refill-period: 30s
  key: PRINCIPAL

---------------------------------------------------------------
The consumer overrides the bean - the auto-configuration backs off
---------------------------------------------------------------
@Configuration
class MyRateLimitConfig {
    @Bean
    RateLimiter rateLimiter() { return new MyCustomLimiter(); }
}

---------------------------------------------------------------
Debugging: why did (or did not) it apply?
---------------------------------------------------------------
$ java -jar app.jar --debug

  Positive matches:
      RateLimitAutoConfiguration matched:
          - @ConditionalOnClass found required class 'io.github.bucket4j.Bucket'
          - @ConditionalOnProperty (app.rate-limit.enabled=true) matched

  Negative matches:
      RateLimitAutoConfiguration#distributedRateLimiter:
          - @ConditionalOnBean did not find StringRedisTemplate

Or at runtime: GET /actuator/conditions
*/`,
    solutionLanguage: "java",
    discussion:
      "Writing a starter is the clearest demonstration that you understand how Boot works rather than just using it. The four points to hit: conditions are evaluated with ASM so they never load a missing class; `@ConditionalOnMissingBean` is order-sensitive and therefore only correct on auto-configuration; the registry file moved from `spring.factories` to `AutoConfiguration.imports` in Boot 3; and `--debug` plus `/actuator/conditions` is how you diagnose a bean that mysteriously did or did not appear. Ordering with `@AutoConfiguration(before = ..., after = ...)` is the follow-up they will ask about.",
    relatedQuestionIds: ["b025", "b038"],
  },

  /* ================================================================ */
  /* Spring Boot core                                                  */
  /* ================================================================ */
  {
    id: "p09",
    topic: "spring-boot-core",
    title: "Configure two DataSources in one application",
    difficulty: "hard",
    estimatedMinutes: 40,
    scenario:
      "The service must read from a legacy reporting database while writing to its own. As soon as you add a second `DataSource`, auto-configuration stops working and startup fails.\n\n" +
      "Wire both up properly, with separate entity managers, transaction managers and repository packages.",
    tasks: [
      "Explain why adding a second DataSource breaks auto-configuration.",
      "Define both DataSources with `@Primary` on the main one.",
      "Give each its own `EntityManagerFactory`, `TransactionManager` and repository package.",
      "Say what happens to atomicity across the two, and what you would do about it.",
    ],
    hints: [
      "`DataSourceAutoConfiguration` is `@ConditionalOnMissingBean` — the moment you define one, it backs off completely.",
      "`@EnableJpaRepositories` takes `basePackages`, `entityManagerFactoryRef` and `transactionManagerRef`.",
      "One `@Transactional` cannot span two resource-local transaction managers.",
    ],
    solution: `import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Map;

// ---------------------------------------------------------------
// PRIMARY: the service's own database
// ---------------------------------------------------------------
@Configuration
@EnableJpaRepositories(
    basePackages = "com.example.orders.repository",
    entityManagerFactoryRef = "ordersEntityManagerFactory",
    transactionManagerRef  = "ordersTransactionManager")
class OrdersDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("app.datasource.orders")
    DataSourceProperties ordersDataSourceProperties() { return new DataSourceProperties(); }

    @Bean
    @Primary
    @ConfigurationProperties("app.datasource.orders.hikari")
    DataSource ordersDataSource(
            @Qualifier("ordersDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class).build();
    }

    @Bean
    @Primary
    LocalContainerEntityManagerFactoryBean ordersEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("ordersDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
            .packages("com.example.orders.domain")
            .persistenceUnit("orders")
            .properties(Map.of("hibernate.hbm2ddl.auto", "validate"))
            .build();
    }

    @Bean
    @Primary
    PlatformTransactionManager ordersTransactionManager(
            @Qualifier("ordersEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

// ---------------------------------------------------------------
// SECONDARY: the legacy reporting database (read-only)
// ---------------------------------------------------------------
@Configuration
@EnableJpaRepositories(
    basePackages = "com.example.reporting.repository",
    entityManagerFactoryRef = "reportingEntityManagerFactory",
    transactionManagerRef  = "reportingTransactionManager")
class ReportingDataSourceConfig {

    @Bean
    @ConfigurationProperties("app.datasource.reporting")
    DataSourceProperties reportingDataSourceProperties() { return new DataSourceProperties(); }

    @Bean
    @ConfigurationProperties("app.datasource.reporting.hikari")
    DataSource reportingDataSource(
            @Qualifier("reportingDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class).build();
    }

    @Bean
    LocalContainerEntityManagerFactoryBean reportingEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("reportingDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
            .packages("com.example.reporting.domain")
            .persistenceUnit("reporting")
            .properties(Map.of("hibernate.hbm2ddl.auto", "none"))
            .build();
    }

    @Bean
    PlatformTransactionManager reportingTransactionManager(
            @Qualifier("reportingEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}

@org.springframework.stereotype.Service
class ReportingService {

    /** Name the transaction manager explicitly, or you silently get the primary one. */
    @Transactional(transactionManager = "reportingTransactionManager", readOnly = true)
    public long countLegacyOrders() { return 0L; }

    @Transactional(transactionManager = "ordersTransactionManager")
    public void recordSnapshot(long count) { }

    /**
     * THIS IS NOT ATOMIC. Two resource-local transaction managers cannot
     * participate in one transaction. If recordSnapshot() fails, nothing
     * rolls back in the reporting database.
     *
     * Options, in order of preference:
     *   1. Redesign so only one database is written to (usually possible).
     *   2. Outbox pattern + an async relay for the second write.
     *   3. Saga with an explicit compensating action.
     *   4. JTA/XA (Atomikos, Narayana) - last resort: slow and operationally heavy.
     */
    public void snapshot() {
        long count = countLegacyOrders();
        recordSnapshot(count);
    }
}

/*
application.yml
---------------
app.datasource:
  orders:
    url: jdbc:postgresql://orders-db:5432/orders
    username: \${ORDERS_DB_USER}
    password: \${ORDERS_DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 3000
      leak-detection-threshold: 20000
  reporting:
    url: jdbc:postgresql://legacy-db:5432/reporting
    username: \${REPORTING_DB_USER}
    password: \${REPORTING_DB_PASSWORD}
    hikari:
      maximum-pool-size: 5
      read-only: true

Why it breaks without this: DataSourceAutoConfiguration is
@ConditionalOnMissingBean(DataSource.class). Define one DataSource and the
entire auto-configuration chain - DataSource, JdbcTemplate, EntityManagerFactory,
TransactionManager - backs off, so you must supply all of it yourself.
*/`,
    solutionLanguage: "java",
    discussion:
      "Two things get graded here. The mechanical part is knowing that `@Primary` is mandatory (Spring must be able to resolve a single `DataSource` for the pieces that still want one) and that each repository package needs its own `entityManagerFactoryRef` and `transactionManagerRef`. The judgement part is the atomicity answer: candidates often claim `@Transactional` will cover both. It will not — you get two independent transactions. Naming the alternatives in order (redesign, outbox, saga, XA as a last resort) is what marks you as someone who has actually run this in production.",
    relatedQuestionIds: ["b043", "b044"],
  },
  {
    id: "p10",
    topic: "spring-boot-core",
    title: "Add a custom Actuator health indicator and readiness probe",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Kubernetes keeps restarting healthy pods during a slow downstream outage, because the liveness probe hits `/actuator/health` and a dependency check fails.\n\n" +
      "Fix the probe configuration and add a properly-scoped custom indicator.",
    tasks: [
      "Explain the difference between liveness and readiness, and which checks belong in each.",
      "Write a custom `HealthIndicator` for a downstream dependency, with a timeout.",
      "Register it as a *readiness* contributor, not a liveness one.",
      "Secure the detailed output and expose only what is needed.",
    ],
    hints: [
      "Liveness means 'restart me'. Readiness means 'stop sending me traffic'. A downstream outage is never a reason to restart.",
      "Boot exposes `/actuator/health/liveness` and `/actuator/health/readiness` when probes are enabled.",
      "`management.endpoint.health.group.*` lets you decide which indicators land in which group.",
    ],
    solution: `import org.springframework.boot.actuate.availability.*;
import org.springframework.boot.actuate.health.*;
import org.springframework.boot.availability.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

/**
 * READINESS indicator: when the downstream is down we should stop receiving
 * traffic, but we must NOT be restarted - restarting fixes nothing.
 */
@Component("inventoryService")
class InventoryHealthIndicator implements HealthIndicator {

    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(1))
        .build();

    /** Cache the result so a probe every 5s does not hammer the dependency. */
    private final AtomicReference<CachedHealth> cache =
        new AtomicReference<>(new CachedHealth(Health.unknown().build(), 0L));

    private record CachedHealth(Health health, long checkedAtMillis) { }

    @Override
    public Health health() {
        CachedHealth cached = cache.get();
        if (System.currentTimeMillis() - cached.checkedAtMillis() < 5_000) {
            return cached.health();
        }
        Health fresh = probe();
        cache.set(new CachedHealth(fresh, System.currentTimeMillis()));
        return fresh;
    }

    private Health probe() {
        long start = System.currentTimeMillis();
        try {
            HttpResponse<Void> response = client.send(
                HttpRequest.newBuilder(URI.create("https://inventory.internal/health"))
                    .timeout(Duration.ofSeconds(2))          // ALWAYS bound the probe
                    .GET().build(),
                HttpResponse.BodyHandlers.discarding());

            long latency = System.currentTimeMillis() - start;
            return (response.statusCode() == 200 ? Health.up() : Health.down())
                .withDetail("status", response.statusCode())
                .withDetail("latencyMs", latency)
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getClass().getSimpleName())
                .withDetail("latencyMs", System.currentTimeMillis() - start)
                .build();
        }
    }
}

/** Take the instance out of rotation explicitly, e.g. while a cache warms. */
@Component
class WarmupReadiness {

    private final ApplicationEventPublisher publisher;
    WarmupReadiness(ApplicationEventPublisher publisher) { this.publisher = publisher; }

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    void warm() {
        AvailabilityChangeEvent.publish(publisher, this, ReadinessState.REFUSING_TRAFFIC);
        // ... preload caches, open connections ...
        AvailabilityChangeEvent.publish(publisher, this, ReadinessState.ACCEPTING_TRAFFIC);
    }
}

/*
application.yml
---------------
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus   # never "*"
  endpoint.health:
    probes.enabled: true                 # enables /health/liveness and /health/readiness
    show-details: when-authorized        # never "always" in production
    show-components: when-authorized
    group:
      liveness:
        include: livenessState, diskSpace      # ONLY self-healable conditions
      readiness:
        include: readinessState, db, inventoryService, redis
  health:
    defaults.enabled: true
    diskspace.threshold: 100MB

Kubernetes
----------
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 20
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2
startupProbe:                            # gives a slow JVM time to boot
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5

The original bug: the liveness probe pointed at /actuator/health, which
aggregates EVERY indicator. A downstream outage marked the pod DOWN, and
Kubernetes restarted a perfectly healthy JVM - amplifying the outage.
*/`,
    solutionLanguage: "java",
    discussion:
      "This is an operations question disguised as a Spring question, and the distinction is the whole answer: liveness must only fail for conditions a restart can fix (deadlock, unrecoverable state), while readiness fails for anything that makes this instance temporarily unable to serve (a cold cache, a dead dependency, a full connection pool). Putting a downstream check in liveness turns a partial outage into a restart storm. The supporting details — bounding the probe with a timeout, caching the result so a 5-second probe interval does not DDoS your dependency, and `show-details: when-authorized` so you are not leaking internals — are what make it a complete answer.",
    relatedQuestionIds: ["b041", "b046"],
  },
  {
    id: "p11",
    topic: "spring-boot-core",
    title: "Diagnose and fix a 40-second startup time",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "A service that used to start in 6 seconds now takes 40, and Kubernetes kills it before the startup probe passes. You have the logs and JMX access.\n\n" +
      "Produce a systematic diagnosis and a fix list ordered by impact.",
    tasks: [
      "List the measurements you would take, in order.",
      "Use `ApplicationStartup` / startup tracking to get per-phase timings.",
      "Name the five most common causes and their fixes.",
      "Show the configuration that gets a typical service back under 10 seconds.",
    ],
    hints: [
      "`BufferingApplicationStartup` plus `/actuator/startup` gives you a flame-graph-like breakdown for free.",
      "Component scanning a broad package, eager JPA validation, and blocking IO in `@PostConstruct` are the usual culprits.",
      "Lazy initialisation is a blunt instrument — it moves the cost to the first request rather than removing it.",
    ],
    solution: `import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;
import org.springframework.context.annotation.*;
import org.springframework.context.event.EventListener;

public class StartupDiagnostics {

    /** STEP 1: turn on startup tracking, then read GET /actuator/startup. */
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(StartupDiagnostics.class);
        application.setApplicationStartup(new BufferingApplicationStartup(4096));
        application.run(args);
    }

    /** STEP 2: log the phase boundaries so you can bisect the slow part. */
    @EventListener
    void onReady(ApplicationReadyEvent event) {
        System.out.println("ready after " + event.getTimeTaken().toMillis() + "ms");
    }
}

/*
=================================================================
STEP-BY-STEP DIAGNOSIS
=================================================================

1. Baseline with the built-in timings
   - "Started Application in 40.2 seconds (process running for 41.1)"
   - The gap between the two is JVM + classloading, before Spring starts.

2. GET /actuator/startup  (needs BufferingApplicationStartup)
   Returns every step with a duration. Sort descending. Typical output:
       spring.beans.instantiate  (entityManagerFactory)       18,400ms
       spring.context.component-scan                           7,100ms
       spring.beans.instantiate  (cacheWarmer)                 6,900ms
       spring.beans.instantiate  (dataSource)                  3,200ms

3. -Xlog:class+load:file=classload.txt  -> how many classes, from where?
4. Async profiler on startup: ./profiler.sh -d 45 -e wall -f startup.html <pid>
5. Compare with -Ddebug to see which auto-configurations are active.

=================================================================
THE FIVE USUAL CAUSES, AND THE FIX
=================================================================

1. COMPONENT SCANNING TOO BROAD                       (typically 3-10s)
   Symptom: spring.context.component-scan is high.
   Cause:   @SpringBootApplication in a root package such as "com", or an
            explicit basePackages = "com.company".
   Fix:     Move the main class down into its own module package, or list
            precise basePackages. Every jar under the scanned root is walked.

2. EAGER SINGLETON DOING IO                           (typically 5-20s)
   Symptom: one bean dominates spring.beans.instantiate.
   Cause:   @PostConstruct calling a remote service, warming a cache, or
            running a migration synchronously.
   Fix:     Move it to an ApplicationRunner or an @EventListener on
            ApplicationReadyEvent so it does not block the context, and make
            the readiness probe reflect it.

3. HIBERNATE SCHEMA VALIDATION ON A LARGE SCHEMA      (typically 5-20s)
   Symptom: entityManagerFactory dominates.
   Fix:     hibernate.hbm2ddl.auto: none in production (Flyway owns the
            schema), and set spring.jpa.properties.hibernate.temp
            .use_jdbc_metadata_defaults: false plus an explicit dialect so
            Hibernate does not round-trip the database for metadata.

4. CONNECTION POOL PRE-FILLING AGAINST A SLOW DB      (typically 2-10s)
   Fix:     Reduce minimum-idle, or set initialization-fail-timeout: -1 so a
            slow database does not block startup.

5. TOO MANY AUTO-CONFIGURATIONS / A FAT CLASSPATH     (typically 2-5s)
   Fix:     Exclude what you do not use; trim unused starters.

=================================================================
CONFIGURATION THAT GETS A TYPICAL SERVICE UNDER 10s
=================================================================
spring:
  main:
    lazy-initialization: false     # a blunt tool: moves cost to first request
    banner-mode: off
  jpa:
    hibernate.ddl-auto: none
    open-in-view: false
    properties:
      hibernate.jdbc.batch_size: 50
      hibernate.temp.use_jdbc_metadata_defaults: false
  datasource.hikari:
    minimum-idle: 2
    initialization-fail-timeout: -1
  jmx.enabled: false

management.endpoints.web.exposure.include: health,info,prometheus

JVM flags
---------
-XX:TieredStopAtLevel=1        # dev only: skip C2, much faster warmup
-XX:+UseSerialGC               # small heaps / short-lived pods
-Xss512k
-XX:SharedArchiveFile=app.jsa  # AppCDS: 20-40% faster classloading
-XX:ArchiveClassesAtExit=app.jsa

Bigger guns
-----------
- Spring AOT (mvn -Pnative or spring-boot:process-aot): moves bean-definition
  work to build time.
- GraalVM native image: startup in tens of milliseconds, at the cost of build
  time, reflection configuration and no JIT peak performance.
- CRaC / checkpoint-restore: restore a warmed-up process image.

And the Kubernetes-level fix while you work on it: add a startupProbe with a
generous failureThreshold so a slow boot does not get killed.
*/`,
    solutionLanguage: "java",
    discussion:
      "What is being assessed is method, not trivia. A weak answer jumps straight to 'enable lazy initialisation'. A strong one measures first — `/actuator/startup` gives per-step timings, so you can name the offending bean in two minutes rather than guessing. The five causes above cover the overwhelming majority of real cases, and the ranking matters: component-scan scope and a blocking `@PostConstruct` are far more common than anything exotic. Finish by noting that lazy initialisation hides startup failures until the first request and that AOT/native/CDS are the real answers if fast start is a hard requirement.",
    relatedQuestionIds: ["b037", "b042"],
  },
  {
    id: "p12",
    topic: "spring-boot-core",
    title: "Implement graceful shutdown with in-flight request draining",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Deployments drop requests. During a rolling update, some clients get connection resets and a few background jobs are killed mid-write.\n\n" +
      "Implement a shutdown sequence that finishes in-flight work and stops accepting new work first.",
    tasks: [
      "Enable Spring Boot graceful shutdown and explain what it actually does.",
      "Make the readiness probe fail before the server stops accepting connections.",
      "Drain a custom executor and a message listener cleanly.",
      "Set the Kubernetes terminationGracePeriod and preStop hook to match.",
    ],
    hints: [
      "`server.shutdown: graceful` stops accepting new connections and waits up to `spring.lifecycle.timeout-per-shutdown-phase`.",
      "Kubernetes removes the pod from the Service endpoints *asynchronously* — a preStop sleep gives that time to propagate.",
      "`@PreDestroy` runs during context close; `SmartLifecycle` gives you ordering control.",
    ],
    solution: `import jakarta.annotation.PreDestroy;
import org.springframework.boot.availability.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

/**
 * Ordered shutdown. SmartLifecycle phases stop in DESCENDING order, so a high
 * phase number stops first - which is what we want for "stop accepting work".
 */
@Component
class TrafficGate implements SmartLifecycle {

    private final ApplicationEventPublisher publisher;
    private volatile boolean running = false;

    TrafficGate(ApplicationEventPublisher publisher) { this.publisher = publisher; }

    @Override public void start() {
        running = true;
        AvailabilityChangeEvent.publish(publisher, this, ReadinessState.ACCEPTING_TRAFFIC);
    }

    @Override public void stop() {
        // FIRST: fail readiness so the load balancer stops sending new requests.
        AvailabilityChangeEvent.publish(publisher, this, ReadinessState.REFUSING_TRAFFIC);
        try {
            // Give the ingress/kube-proxy time to notice.
            Thread.sleep(5_000);
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        running = false;
    }

    @Override public boolean isRunning() { return running; }

    /** Highest phase => stopped first. */
    @Override public int getPhase() { return Integer.MAX_VALUE; }
}

/** Drain a custom executor: stop accepting, wait, then force. */
@Component
class BackgroundWorkers {

    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(
        4, 8, 60, TimeUnit.SECONDS, new ArrayBlockingQueue<>(200),
        r -> { Thread t = new Thread(r, "worker"); t.setDaemon(false); return t; },
        new ThreadPoolExecutor.CallerRunsPolicy());

    public void submit(Runnable task) { executor.execute(task); }

    @PreDestroy
    void shutdown() throws InterruptedException {
        executor.shutdown();                               // stop accepting new tasks
        if (!executor.awaitTermination(25, TimeUnit.SECONDS)) {
            System.err.println("forcing shutdown, " + executor.getQueue().size()
                + " tasks still queued");
            executor.shutdownNow();                        // interrupt the stragglers
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                System.err.println("executor did not terminate");
            }
        }
    }
}

/** A message listener must stop consuming BEFORE the database connections close. */
@Component
class MessageConsumer implements SmartLifecycle {

    private volatile boolean running;

    @Override public void start()  { running = true; }
    @Override public void stop()   { running = false; /* container.stop() */ }
    @Override public boolean isRunning() { return running; }

    /** Lower than TrafficGate, higher than the DataSource - stops in the middle. */
    @Override public int getPhase() { return 1000; }
}

/*
application.yml
---------------
server:
  shutdown: graceful                 # stop accepting, finish in-flight requests
  tomcat.connection-timeout: 5s

spring:
  lifecycle.timeout-per-shutdown-phase: 30s    # max wait per SmartLifecycle phase

management:
  endpoint.health.probes.enabled: true

Kubernetes
----------
spec:
  terminationGracePeriodSeconds: 60    # MUST exceed preStop + shutdown timeout
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            # Give kube-proxy/ingress time to remove this pod from endpoints
            # BEFORE SIGTERM reaches the JVM.
            command: ["sh", "-c", "sleep 10"]
      readinessProbe:
        httpGet: { path: /actuator/health/readiness, port: 8080 }
        periodSeconds: 2
        failureThreshold: 1

The full sequence
-----------------
 t+0s   kubectl delete pod  -> pod marked Terminating, endpoint removal begins
 t+0s   preStop hook starts (sleep 10)
 t+10s  SIGTERM -> Spring starts closing the context
 t+10s  TrafficGate.stop(): readiness = REFUSING_TRAFFIC, sleep 5s
 t+15s  web server stops accepting; in-flight requests finish (up to 30s)
 t+15s  MessageConsumer stops; BackgroundWorkers drain (up to 25s)
 t+~40s beans destroyed, connection pools closed, JVM exits
 t+60s  SIGKILL if still alive

Why requests were being dropped before: without graceful shutdown the
connector is closed immediately on SIGTERM, and without the preStop delay the
load balancer keeps routing to a pod that is already shutting down.
*/`,
    solutionLanguage: "java",
    discussion:
      "Most candidates know `server.shutdown: graceful` exists; far fewer know it is not sufficient on its own. The subtle part is the race in Kubernetes: endpoint removal and SIGTERM are delivered concurrently, so without a preStop delay the load balancer is still routing traffic to a pod that has already stopped accepting it. The second subtlety is ordering — you must stop consuming messages and accepting HTTP before you close connection pools, which is exactly what `SmartLifecycle` phases are for (higher phase stops first). Mentioning that `terminationGracePeriodSeconds` must exceed preStop plus the shutdown timeout, or the kernel kills you mid-drain, closes it out.",
    relatedQuestionIds: ["b037", "b041"],
  },

  /* ================================================================ */
  /* Collections                                                       */
  /* ================================================================ */
  {
    id: "p13",
    topic: "collections",
    title: "Implement an LRU cache with LinkedHashMap",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "Implement a fixed-capacity LRU cache. First with `LinkedHashMap` in about five lines, then from scratch with a hash map plus a doubly-linked list, which is the version interviewers usually want to see.",
    tasks: [
      "Implement it by extending `LinkedHashMap` and overriding one method.",
      "Implement it from scratch with O(1) get and put.",
      "Explain why a doubly-linked list is required rather than a singly-linked one.",
      "State what you would use in production instead, and why.",
    ],
    hints: [
      "`LinkedHashMap`'s three-argument constructor takes `accessOrder` — true moves an entry to the end on every `get`.",
      "`removeEldestEntry` is called after every insertion; return true to evict the head.",
      "Sentinel head and tail nodes remove every null check from the list manipulation.",
    ],
    solution: `import java.util.*;

// ---------------------------------------------------------------
// VERSION 1: LinkedHashMap does all the work.
// ---------------------------------------------------------------
class LruCache<K, V> extends LinkedHashMap<K, V> {

    private final int capacity;

    LruCache(int capacity) {
        // accessOrder = true => get() moves the entry to the end
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;          // called after every put
    }
}

// ---------------------------------------------------------------
// VERSION 2: from scratch. HashMap + doubly-linked list, O(1) both ways.
// ---------------------------------------------------------------
class ManualLruCache<K, V> {

    private static final class Node<K, V> {
        K key; V value; Node<K, V> prev, next;
        Node(K key, V value) { this.key = key; this.value = value; }
    }

    private final int capacity;
    private final Map<K, Node<K, V>> index;
    /** Sentinels: head.next is the LEAST recent, tail.prev is the MOST recent. */
    private final Node<K, V> head = new Node<>(null, null);
    private final Node<K, V> tail = new Node<>(null, null);

    ManualLruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be > 0");
        this.capacity = capacity;
        this.index = new HashMap<>(capacity * 4 / 3 + 1);
        head.next = tail;
        tail.prev = head;
    }

    public V get(K key) {
        Node<K, V> node = index.get(key);
        if (node == null) return null;
        moveToTail(node);                 // mark as most recently used
        return node.value;
    }

    public void put(K key, V value) {
        Node<K, V> existing = index.get(key);
        if (existing != null) {
            existing.value = value;
            moveToTail(existing);
            return;
        }
        if (index.size() == capacity) {
            Node<K, V> eldest = head.next;         // O(1) because the list is doubly linked
            unlink(eldest);
            index.remove(eldest.key);
        }
        Node<K, V> node = new Node<>(key, value);
        index.put(key, node);
        linkAtTail(node);
    }

    public V remove(K key) {
        Node<K, V> node = index.remove(key);
        if (node == null) return null;
        unlink(node);
        return node.value;
    }

    public int size() { return index.size(); }

    private void moveToTail(Node<K, V> node) { unlink(node); linkAtTail(node); }

    /** O(1) ONLY because each node knows its predecessor. */
    private void unlink(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        node.prev = node.next = null;
    }

    private void linkAtTail(Node<K, V> node) {
        node.prev = tail.prev;
        node.next = tail;
        tail.prev.next = node;
        tail.prev = node;
    }

    public List<K> keysLeastRecentFirst() {
        List<K> keys = new ArrayList<>(index.size());
        for (Node<K, V> n = head.next; n != tail; n = n.next) keys.add(n.key);
        return keys;
    }
}

class Demo {
    public static void main(String[] args) {
        LruCache<String, Integer> quick = new LruCache<>(3);
        quick.put("a", 1); quick.put("b", 2); quick.put("c", 3);
        quick.get("a");                    // 'a' becomes most recent
        quick.put("d", 4);                 // evicts 'b', the least recent
        System.out.println(quick.keySet());          // [c, a, d]

        ManualLruCache<String, Integer> manual = new ManualLruCache<>(3);
        manual.put("a", 1); manual.put("b", 2); manual.put("c", 3);
        manual.get("a");
        manual.put("d", 4);
        System.out.println(manual.keysLeastRecentFirst());   // [c, a, d]
        System.out.println(manual.get("b"));                 // null - evicted
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The `LinkedHashMap` version is the 'do you know the library' check; the manual version is the real exercise. The question that separates candidates is why the list must be **doubly** linked: eviction needs to unlink a node in O(1), and with a singly-linked list you would have to traverse to find the predecessor, making it O(n). The sentinel head/tail trick is worth calling out because it eliminates every edge case. Finish by saying what you would actually ship: `Caffeine`, which uses W-TinyLFU rather than plain LRU because LRU is defeated by a single large scan, and which also gives you TTL, weights, async loading and statistics. And note that neither version here is thread-safe.",
    relatedQuestionIds: ["b053", "b077"],
  },
  {
    id: "p14",
    topic: "collections",
    title: "Fix the broken equals/hashCode contract",
    difficulty: "easy",
    estimatedMinutes: 20,
    scenario:
      "`HashSet` contains duplicates and `map.get(key)` returns null for a key that is definitely in the map. The class below is the culprit.\n\n" +
      "Find every violation, fix them, and write the test that proves it.",
    starterCode: `class Employee {
    private String id;
    private String name;
    private Department department;

    public boolean equals(Employee other) {         // bug 1
        return id.equals(other.id);
    }
    // bug 2: no hashCode at all
    // bug 3: id is mutable
}`,
    tasks: [
      "Identify all the contract violations.",
      "Rewrite the class correctly, including the `instanceof` pattern.",
      "Show the mutable-key trap with a live example.",
      "Write a test that would have caught each bug.",
    ],
    hints: [
      "`equals(Employee)` overloads rather than overrides — `@Override` would have caught it instantly.",
      "Equal objects must have equal hash codes, or hashing breaks.",
      "If a field used in `hashCode` changes after insertion, the entry is in the wrong bucket forever.",
    ],
    solution: `import java.util.*;

// ---------------------------------------------------------------
// THE BUGS
// ---------------------------------------------------------------
class BrokenEmployee {
    String id;
    String name;

    /**
     * BUG 1: this OVERLOADS Object.equals(Object), it does not override it.
     *        HashMap calls equals(Object), which is still identity comparison.
     *        @Override would have failed the compile.
     * BUG 2: no hashCode(), so equal objects get different hashes and land in
     *        different buckets.
     * BUG 3: 'id' is mutable, so the hash changes after insertion.
     */
    public boolean equals(BrokenEmployee other) { return id.equals(other.id); }
}

// ---------------------------------------------------------------
// THE FIX
// ---------------------------------------------------------------
final class Employee {

    private final String id;          // immutable => hash is stable forever
    private final String name;        // NOT part of identity
    private final String department;

    Employee(String id, String name, String department) {
        this.id = Objects.requireNonNull(id, "id");
        this.name = name;
        this.department = department;
    }

    @Override                                    // catches the overload mistake
    public boolean equals(Object other) {
        if (this == other) return true;          // cheap identity fast path
        // instanceof handles null AND the type check in one step.
        if (!(other instanceof Employee that)) return false;
        return id.equals(that.id);               // business key only
    }

    @Override
    public int hashCode() {
        return id.hashCode();                    // EXACTLY the fields used in equals
    }

    @Override
    public String toString() { return "Employee[" + id + ", " + name + "]"; }

    public String id() { return id; }
}

/** In modern Java a record gives you all of this correctly, for free. */
record EmployeeRecord(String id, String name, String department) { }

class ContractTests {

    public static void main(String[] args) {
        // --- Bug 1 + 2 in action ---
        Set<BrokenEmployee> broken = new HashSet<>();
        BrokenEmployee a = new BrokenEmployee(); a.id = "E1";
        BrokenEmployee b = new BrokenEmployee(); b.id = "E1";
        broken.add(a); broken.add(b);
        System.out.println("broken set size = " + broken.size());   // 2 - duplicates!

        // --- Fixed ---
        Set<Employee> fixed = new HashSet<>();
        fixed.add(new Employee("E1", "Alice", "ENG"));
        fixed.add(new Employee("E1", "Alice Smith", "SALES"));      // same id
        System.out.println("fixed set size = " + fixed.size());     // 1 - correct

        Map<Employee, String> map = new HashMap<>();
        map.put(new Employee("E1", "Alice", "ENG"), "manager");
        System.out.println(map.get(new Employee("E1", "?", "?")));  // manager

        // --- Bug 3: the mutable-key trap, shown with a deliberately mutable key ---
        MutableKey key = new MutableKey("K1");
        Map<MutableKey, String> trap = new HashMap<>();
        trap.put(key, "value");
        System.out.println("before mutation: " + trap.get(key));    // value
        key.id = "K2";                                              // hash changes
        System.out.println("after mutation:  " + trap.get(key));    // null - LOST
        System.out.println("still sized:     " + trap.size());      // 1 - and leaked
        System.out.println("containsValue:   " + trap.containsValue("value"));  // true

        // --- The five properties the contract demands ---
        Employee x = new Employee("E1", "A", "ENG");
        Employee y = new Employee("E1", "B", "SALES");
        Employee z = new Employee("E1", "C", "OPS");
        assertTrue(x.equals(x), "reflexive");
        assertTrue(x.equals(y) == y.equals(x), "symmetric");
        assertTrue(x.equals(y) && y.equals(z) && x.equals(z), "transitive");
        assertTrue(x.equals(y) && x.equals(y), "consistent");
        assertTrue(!x.equals(null), "null-safe");
        assertTrue(x.hashCode() == y.hashCode(), "equal => same hashCode");
        System.out.println("contract holds");
    }

    static class MutableKey {
        String id;
        MutableKey(String id) { this.id = id; }
        @Override public boolean equals(Object o) {
            return o instanceof MutableKey k && id.equals(k.id);
        }
        @Override public int hashCode() { return id.hashCode(); }
    }

    static void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Three separate bugs, and each is common on its own. The overload is the sneakiest because the code compiles and even works when you call it directly — only the collections break, because they call `equals(Object)`. The missing `hashCode` breaks the fundamental invariant that equal objects hash equally. The mutable key is the most interesting one to talk about: the entry is not just unreachable, it is a *leak* — `size()` still counts it and `containsValue` still finds it, but no `get` will ever return it. Points for mentioning that `getClass() != o.getClass()` versus `instanceof` matters for inheritance (symmetry breaks with subclasses under `instanceof`), and that records generate all of this correctly.",
    relatedQuestionIds: ["b051", "b074", "b079"],
  },
  {
    id: "p15",
    topic: "collections",
    title: "Eliminate a ConcurrentModificationException",
    difficulty: "easy",
    estimatedMinutes: 20,
    scenario:
      "A nightly cleanup job throws `ConcurrentModificationException` intermittently. The loop removes expired entries while iterating.\n\n" +
      "Explain the mechanism precisely, then show four correct ways to fix it and when each applies.",
    tasks: [
      "Explain `modCount`, `expectedModCount` and why the exception is best-effort.",
      "Fix it with `Iterator.remove()`.",
      "Fix it with `removeIf` and explain why it is preferable.",
      "Show when a copy-on-write or concurrent collection is the right answer instead.",
    ],
    hints: [
      "The exception is thrown by the *iterator*, on the next `next()` or `hasNext()`, not by the mutation itself.",
      "`modCount` is not volatile, which is why the check is documented as best-effort and must never be used for correctness.",
      "Removing the second-to-last element can escape detection entirely.",
    ],
    solution: `import java.util.*;
import java.util.concurrent.*;

public class ConcurrentModificationFixes {

    record Session(String id, long expiresAt) {
        boolean expired() { return expiresAt < System.currentTimeMillis(); }
    }

    public static void main(String[] args) {
        // ---------------------------------------------------------
        // THE BUG
        // ---------------------------------------------------------
        List<Session> sessions = new ArrayList<>(sample());
        try {
            for (Session s : sessions) {          // uses Itr under the hood
                if (s.expired()) sessions.remove(s);   // modCount++ behind the iterator
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("CME: checkForComodification() failed");
        }

        /*
         * WHY: ArrayList.Itr captures expectedModCount at creation. Every
         * structural modification increments modCount. Each next() calls
         * checkForComodification(), which throws when the two differ.
         *
         * It is BEST-EFFORT: modCount is not volatile, and removing the
         * SECOND-TO-LAST element makes hasNext() return false before the
         * check ever runs - so the loop silently exits early instead of
         * throwing. Never rely on CME for correctness.
         */
        List<String> sneaky = new ArrayList<>(List.of("a", "b", "c"));
        for (String s : sneaky) if (s.equals("b")) sneaky.remove(s);   // NO exception
        System.out.println("silently wrong: " + sneaky);               // [a, c]

        // ---------------------------------------------------------
        // FIX 1: Iterator.remove() - the iterator updates expectedModCount
        // ---------------------------------------------------------
        List<Session> a = new ArrayList<>(sample());
        for (Iterator<Session> it = a.iterator(); it.hasNext(); ) {
            if (it.next().expired()) it.remove();
        }

        // ---------------------------------------------------------
        // FIX 2: removeIf - clearest, and O(n) instead of O(n^2)
        // ---------------------------------------------------------
        List<Session> b = new ArrayList<>(sample());
        b.removeIf(Session::expired);

        // ---------------------------------------------------------
        // FIX 3: collect into a new list (when you need both halves)
        // ---------------------------------------------------------
        List<Session> source = new ArrayList<>(sample());
        Map<Boolean, List<Session>> partitioned = source.stream()
            .collect(java.util.stream.Collectors.partitioningBy(Session::expired));
        List<Session> live = partitioned.get(false);
        List<Session> dead = partitioned.get(true);

        // ---------------------------------------------------------
        // FIX 4: a concurrent collection, when OTHER THREADS also mutate
        // ---------------------------------------------------------
        ConcurrentMap<String, Session> concurrent = new ConcurrentHashMap<>();
        sample().forEach(s -> concurrent.put(s.id(), s));
        concurrent.values().removeIf(Session::expired);   // weakly consistent, never CME

        // CopyOnWriteArrayList: read-heavy, write-rare (listener lists).
        List<Session> cow = new CopyOnWriteArrayList<>(sample());
        for (Session s : cow) {
            if (s.expired()) cow.remove(s);   // safe: the iterator sees a snapshot
        }                                      // but EVERY write copies the whole array

        System.out.printf("removed via iterator=%d removeIf=%d partition=%d chm=%d cow=%d%n",
            a.size(), b.size(), live.size(), concurrent.size(), cow.size());

        // ---------------------------------------------------------
        // Map iteration: mutate through the entrySet view
        // ---------------------------------------------------------
        Map<String, Session> map = new HashMap<>();
        sample().forEach(s -> map.put(s.id(), s));
        map.entrySet().removeIf(e -> e.getValue().expired());
        // or, to CHANGE values rather than remove them:
        map.replaceAll((k, v) -> v.expired() ? new Session(k, Long.MAX_VALUE) : v);
    }

    static List<Session> sample() {
        long now = System.currentTimeMillis();
        return new ArrayList<>(List.of(
            new Session("s1", now - 1000),
            new Session("s2", now + 60_000),
            new Session("s3", now - 5000),
            new Session("s4", now + 60_000)));
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Everyone can recite 'use `Iterator.remove()`'. The depth is in two follow-ups. First, the mechanism: `modCount`/`expectedModCount` and the fact that the *iterator* throws, on the next call, not the mutation. Second — and this is the good one — CME is explicitly documented as best-effort. Removing the second-to-last element makes `hasNext()` return false before the check runs, so the loop exits silently with wrong results and no exception. That is why you must never write `catch (ConcurrentModificationException)` as a control-flow mechanism. Also note `removeIf` is O(n) on `ArrayList` whereas repeated `remove(Object)` is O(n²), and that fail-safe iterators (`CopyOnWriteArrayList`, `ConcurrentHashMap`) trade that exception for weaker consistency rather than for correctness.",
    relatedQuestionIds: ["b049", "b062", "b100"],
  },
  {
    id: "p16",
    topic: "collections",
    title: "Choose the right collection: a benchmark-driven decision",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Four requirements land on your desk. For each, pick the collection, justify it with complexity and memory, and say what you would measure to confirm.\n\n" +
      "1. A 10-million-entry lookup table, read-only after load.\n2. A work queue with multiple producers and consumers.\n3. A leaderboard: top 10 of a constantly-updating score set.\n4. An event listener registry: hundreds of reads per write.",
    tasks: [
      "Pick a concrete implementation for each and justify it.",
      "Give the time complexity of the dominant operation.",
      "Estimate memory overhead per entry.",
      "Write the benchmark you would run to validate the choice.",
    ],
    hints: [
      "For a read-only primitive-keyed table, boxing overhead dominates — consider a primitive collection library or parallel arrays.",
      "A bounded `BlockingQueue` gives you backpressure; an unbounded one gives you an OutOfMemoryError.",
      "'Top 10 of N' is a bounded min-heap problem, not a sort problem.",
    ],
    solution: `import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class CollectionSelection {

    /* =================================================================
     * 1. TEN MILLION ENTRIES, READ-ONLY AFTER LOAD
     * =================================================================
     * Choice:  HashMap sized up front; or, if keys are ints, parallel
     *          arrays with binary search / an open-addressing primitive map.
     * Why:     O(1) lookup. The dominant cost is MEMORY, not time.
     *
     * Per-entry overhead:
     *   HashMap.Node  = 16 header + 4 hash + 4 key ref + 4 value ref
     *                   + 4 next ref (compressed oops) = 32 bytes
     *   + Integer key boxed                             = 16 bytes
     *   + table slot (at 0.75 load factor)              = ~5.3 bytes
     *   ~= 53 bytes/entry  ->  ~530 MB for 10M entries
     *
     *   int[] keys + int[] values (sorted, binary search)
     *   = 8 bytes/entry      ->  ~80 MB, but O(log n) lookup
     */
    static Map<Integer, String> readOnlyTable(int size) {
        // Size it to avoid ~24 resizes, each of which rehashes everything.
        Map<Integer, String> map = new HashMap<>((int) (size / 0.75f) + 1, 0.75f);
        for (int i = 0; i < size; i++) map.put(i, "v" + i);
        return Map.copyOf(map);      // immutable => safely shared, no defensive copies
    }

    /* =================================================================
     * 2. MULTI-PRODUCER / MULTI-CONSUMER WORK QUEUE
     * =================================================================
     * Choice:  ArrayBlockingQueue (bounded) or LinkedBlockingQueue (bounded!).
     * Why:     BOUNDED is the whole point - it converts a downstream slowdown
     *          into backpressure instead of an OutOfMemoryError.
     *          ArrayBlockingQueue: one lock, predictable memory, no GC churn.
     *          LinkedBlockingQueue: separate put/take locks => higher throughput
     *          under contention, but a node allocation per element.
     * Complexity: O(1) put/take.
     */
    static BlockingQueue<Runnable> workQueue() {
        return new ArrayBlockingQueue<>(1_000);       // NEVER unbounded
    }

    /* =================================================================
     * 3. TOP 10 OF A CONSTANTLY-UPDATING SCORE SET
     * =================================================================
     * Choice:  a bounded MIN-heap of size 10 (PriorityQueue).
     * Why:     O(n log k) for a single pass instead of O(n log n) to sort
     *          everything. Keep the SMALLEST at the head so you can evict in
     *          O(1) and insert in O(log k).
     *          If you need the full ranking maintained live, use a
     *          ConcurrentSkipListMap (O(log n) ordered) or Redis ZSET.
     */
    static List<Score> topK(Collection<Score> scores, int k) {
        PriorityQueue<Score> heap =
            new PriorityQueue<>(k, Comparator.comparingLong(Score::points));  // min-heap
        for (Score score : scores) {
            if (heap.size() < k) {
                heap.offer(score);
            } else if (score.points() > heap.peek().points()) {
                heap.poll();                 // evict the current smallest
                heap.offer(score);
            }
        }
        List<Score> result = new ArrayList<>(heap);
        result.sort(Comparator.comparingLong(Score::points).reversed());
        return result;
    }

    /* =================================================================
     * 4. LISTENER REGISTRY: HUNDREDS OF READS PER WRITE
     * =================================================================
     * Choice:  CopyOnWriteArrayList.
     * Why:     reads are completely lock-free and never throw CME, which is
     *          exactly right for "iterate the listeners on every event".
     *          Writes copy the whole array - O(n) - but they are rare.
     *          With frequent writes this is catastrophic; use a
     *          ConcurrentHashMap-backed set instead.
     */
    static List<Runnable> listeners() { return new CopyOnWriteArrayList<>(); }

    record Score(String player, long points) { }

    /* =================================================================
     * THE BENCHMARK
     * =================================================================
     * Use JMH for anything you will act on. This is the rough shape:
     */
    public static void main(String[] args) {
        int n = 1_000_000;
        List<Score> scores = IntStream.range(0, n)
            .mapToObj(i -> new Score("p" + i, ThreadLocalRandom.current().nextLong(1_000_000)))
            .toList();

        long t0 = System.nanoTime();
        List<Score> viaHeap = topK(scores, 10);
        long heapMs = (System.nanoTime() - t0) / 1_000_000;

        t0 = System.nanoTime();
        List<Score> viaSort = scores.stream()
            .sorted(Comparator.comparingLong(Score::points).reversed())
            .limit(10).toList();
        long sortMs = (System.nanoTime() - t0) / 1_000_000;

        System.out.println("heap O(n log k): " + heapMs + "ms");
        System.out.println("sort O(n log n): " + sortMs + "ms");
        System.out.println("same result: " + viaHeap.equals(viaSort));

        // Memory: measure, do not guess.
        //   -XX:+UnlockDiagnosticVMOptions -XX:+PrintCompilation
        //   jcmd <pid> GC.class_histogram
        //   org.openjdk.jol.info.ClassLayout / GraphLayout for exact footprints
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This is the question that most reliably separates two and five years of experience. The weak answer names a class; the strong answer names a class *and* the constraint that forced it. Key talking points: sizing a `HashMap` up front avoids ~24 rehashes on the way to 10M entries; boxing is what makes a primitive-keyed `HashMap` cost 50+ bytes per entry, so Eclipse Collections / fastutil or parallel arrays are legitimate answers; bounded queues are a correctness requirement, not a tuning knob; top-k is a heap problem, not a sort problem; and `CopyOnWriteArrayList` is superb for read-mostly and terrible for anything else. Ending with 'and I would confirm with JMH and a heap histogram rather than trusting my estimate' is the right note.",
    relatedQuestionIds: ["b057", "b061", "b064"],
  },
  {
    id: "p17",
    topic: "collections",
    title: "Build a thread-safe bounded cache with ConcurrentHashMap",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "Build a cache with per-entry TTL, a size bound, and atomic loading so that ten concurrent misses on the same key trigger exactly **one** load.\n\n" +
      "You may not use a caching library — the point is to show you understand the atomic operations.",
    tasks: [
      "Guarantee single-flight loading for concurrent misses on the same key.",
      "Support per-entry TTL with lazy expiry plus periodic cleanup.",
      "Bound the size and evict something sensible.",
      "Explain why `computeIfAbsent` with a slow loader is dangerous.",
    ],
    hints: [
      "`computeIfAbsent`'s mapping function runs while holding the bin lock — never do IO or recurse inside it.",
      "Store a `CompletableFuture<V>` as the value: `putIfAbsent` the future, then complete it outside any lock.",
      "Lazy expiry on read plus a scheduled sweep is simpler and cheaper than a timer per entry.",
    ],
    solution: `import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.function.Function;

/**
 * Single-flight, TTL-aware, size-bounded cache.
 *
 * The trick: the VALUE is a CompletableFuture. putIfAbsent is atomic and
 * cheap, and the actual (slow) load happens OUTSIDE any lock, so the bin
 * is never held while we do IO.
 */
public final class BoundedLoadingCache<K, V> implements AutoCloseable {

    private record Entry<V>(CompletableFuture<V> future, long expiresAtNanos,
                            AtomicLong lastAccessNanos) { }

    private final ConcurrentHashMap<K, Entry<V>> map = new ConcurrentHashMap<>();
    private final Function<K, V> loader;
    private final long ttlNanos;
    private final int maxSize;
    private final ScheduledExecutorService sweeper;

    private final LongAdder hits = new LongAdder();
    private final LongAdder misses = new LongAdder();
    private final LongAdder loads = new LongAdder();
    private final LongAdder evictions = new LongAdder();

    public BoundedLoadingCache(Function<K, V> loader, Duration ttl, int maxSize) {
        this.loader = loader;
        this.ttlNanos = ttl.toNanos();
        this.maxSize = maxSize;
        this.sweeper = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "cache-sweeper");
            t.setDaemon(true);
            return t;
        });
        this.sweeper.scheduleWithFixedDelay(this::sweep,
            ttl.toMillis(), ttl.toMillis(), TimeUnit.MILLISECONDS);
    }

    public V get(K key) {
        long now = System.nanoTime();

        Entry<V> existing = map.get(key);
        if (existing != null && existing.expiresAtNanos() > now) {
            existing.lastAccessNanos().set(now);
            hits.increment();
            return join(existing.future());
        }
        if (existing != null) {
            map.remove(key, existing);          // lazy expiry, CAS-style removal
        }
        misses.increment();

        // SINGLE FLIGHT: everyone races to install the SAME future, but only
        // the thread whose putIfAbsent returned null actually loads.
        CompletableFuture<V> promise = new CompletableFuture<>();
        Entry<V> fresh = new Entry<>(promise, now + ttlNanos, new AtomicLong(now));
        Entry<V> raced = map.putIfAbsent(key, fresh);

        if (raced != null) {
            return join(raced.future());        // someone else is loading it
        }

        evictIfNeeded();
        try {
            loads.increment();
            V value = loader.apply(key);        // the SLOW part, outside any lock
            promise.complete(value);
            return value;
        } catch (RuntimeException e) {
            map.remove(key, fresh);             // do NOT cache the failure
            promise.completeExceptionally(e);
            throw e;
        }
    }

    public void invalidate(K key) { map.remove(key); }
    public void invalidateAll()   { map.clear(); }
    public int size()             { return map.size(); }

    /** Evict the least recently used entry once we exceed the bound. */
    private void evictIfNeeded() {
        while (map.size() > maxSize) {
            K victim = null;
            long oldest = Long.MAX_VALUE;
            for (Map.Entry<K, Entry<V>> e : map.entrySet()) {   // weakly consistent scan
                long access = e.getValue().lastAccessNanos().get();
                if (access < oldest) { oldest = access; victim = e.getKey(); }
            }
            if (victim == null || map.remove(victim) == null) break;
            evictions.increment();
        }
    }

    private void sweep() {
        long now = System.nanoTime();
        map.entrySet().removeIf(e -> e.getValue().expiresAtNanos() <= now);
    }

    private V join(CompletableFuture<V> future) {
        try {
            return future.join();
        } catch (CompletionException e) {
            throw e.getCause() instanceof RuntimeException re
                ? re : new IllegalStateException(e.getCause());
        }
    }

    public String stats() {
        return String.format("size=%d hits=%d misses=%d loads=%d evictions=%d",
            map.size(), hits.sum(), misses.sum(), loads.sum(), evictions.sum());
    }

    @Override public void close() { sweeper.shutdownNow(); }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        AtomicInteger loadCount = new AtomicInteger();
        Function<String, String> slowLoader = key -> {
            loadCount.incrementAndGet();
            try { Thread.sleep(200); } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "value-for-" + key;
        };

        try (var cache = new BoundedLoadingCache<>(slowLoader, Duration.ofSeconds(2), 100)) {

            // Ten threads, one key, simultaneously.
            ExecutorService pool = Executors.newFixedThreadPool(10);
            CountDownLatch start = new CountDownLatch(1);
            List<Future<String>> results = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                results.add(pool.submit(() -> { start.await(); return cache.get("k1"); }));
            }
            start.countDown();
            for (Future<String> f : results) f.get();

            System.out.println("loads for 10 concurrent misses: " + loadCount.get());  // 1
            System.out.println(cache.stats());
            pool.shutdown();
        }

        /*
         * WHY NOT computeIfAbsent?
         *
         *   map.computeIfAbsent(key, k -> slowLoader.apply(k));
         *
         * The mapping function runs while the BIN LOCK is held. So:
         *   - every other thread hashing to that bin blocks for the full 200ms,
         *     even for completely different keys;
         *   - if the loader touches the same map (directly or transitively) you
         *     get an IllegalStateException ("recursive update") or a deadlock;
         *   - the Javadoc explicitly forbids it.
         *
         * Storing a future and completing it outside the map keeps the lock
         * hold time to a few nanoseconds.
         *
         * In production: use Caffeine. It does all of this plus W-TinyLFU
         * admission, weighted sizes, async loading and refreshAfterWrite.
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The single-flight requirement is the heart of this. The naive `if (!map.containsKey) map.put(load())` triggers ten loads; `computeIfAbsent` triggers one but holds the bin lock for the entire 200 ms load, which blocks unrelated keys in the same bin and deadlocks outright if the loader touches the same map. Storing a `CompletableFuture` and completing it outside the map is the idiom that solves both: the atomic operation is nanoseconds, the slow work is unsynchronised, and every racing thread joins the same future. Also worth saying out loud: do not cache failures, lazy expiry on read beats a timer per entry, and in real code you reach for Caffeine rather than shipping this.",
    relatedQuestionIds: ["b056", "b100", "b077"],
  },
  {
    id: "p18",
    topic: "collections",
    title: "Group, partition and summarise with the Collectors API",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "Turn a flat list of orders into the six summaries a reporting endpoint needs. Do it with the Collectors API, and know which of these you should *not* compute in Java at all.",
    tasks: [
      "Group orders by customer, and by status then by month (a nested grouping).",
      "Compute per-customer totals and statistics in one pass.",
      "Find the top spender without sorting the whole list.",
      "Say which of these belongs in the database instead, and why.",
    ],
    hints: [
      "`groupingBy` takes a downstream collector — that is how you nest and how you summarise.",
      "`teeing` (Java 12) runs two collectors over one stream and merges the results.",
      "`Collectors.toMap` throws on a duplicate key unless you supply a merge function.",
    ],
    solution: `import java.time.*;
import java.util.*;
import java.util.stream.*;

import static java.util.stream.Collectors.*;

public class OrderAnalytics {

    record Order(String id, String customerId, Status status,
                 LocalDate placedOn, long amountCents) {
        enum Status { NEW, PAID, SHIPPED, CANCELLED }
    }

    public static void main(String[] args) {
        List<Order> orders = sample();

        // 1. Group by customer.
        Map<String, List<Order>> byCustomer =
            orders.stream().collect(groupingBy(Order::customerId));

        // 2. Nested grouping: status -> year-month -> count.
        Map<Order.Status, Map<YearMonth, Long>> byStatusAndMonth =
            orders.stream().collect(groupingBy(
                Order::status,
                () -> new EnumMap<>(Order.Status.class),          // ordered, compact
                groupingBy(o -> YearMonth.from(o.placedOn()), TreeMap::new, counting())));

        // 3. Per-customer total, in one pass.
        Map<String, Long> totalByCustomer = orders.stream()
            .filter(o -> o.status() != Order.Status.CANCELLED)
            .collect(groupingBy(Order::customerId, summingLong(Order::amountCents)));

        // 4. Full statistics per customer - count, sum, min, max, average.
        Map<String, LongSummaryStatistics> statsByCustomer = orders.stream()
            .collect(groupingBy(Order::customerId, summarizingLong(Order::amountCents)));

        // 5. Partition: above or below a threshold.
        Map<Boolean, List<Order>> highValue = orders.stream()
            .collect(partitioningBy(o -> o.amountCents() >= 10_000));

        // 6. Top spender WITHOUT sorting everything - O(n) not O(n log n).
        Optional<Map.Entry<String, Long>> topSpender = totalByCustomer.entrySet().stream()
            .max(Map.Entry.comparingByValue());

        // 7. teeing: two aggregates over ONE pass (Java 12+).
        record Summary(long count, long revenue, double average) { }
        Summary summary = orders.stream()
            .filter(o -> o.status() == Order.Status.PAID)
            .collect(teeing(
                counting(),
                summingLong(Order::amountCents),
                (count, revenue) -> new Summary(count, revenue,
                    count == 0 ? 0 : (double) revenue / count)));

        // 8. toMap with a MERGE FUNCTION - without it, a duplicate key throws.
        Map<String, Long> latestAmountPerCustomer = orders.stream()
            .collect(toMap(Order::customerId, Order::amountCents,
                (existing, replacement) -> replacement,      // last one wins
                LinkedHashMap::new));

        // 9. Joining, flatMapping and filtering downstream collectors.
        Map<Order.Status, String> idsByStatus = orders.stream()
            .collect(groupingBy(Order::status,
                mapping(Order::id, joining(", ", "[", "]"))));

        Map<String, List<Order>> paidOnlyByCustomer = orders.stream()
            .collect(groupingBy(Order::customerId,
                filtering(o -> o.status() == Order.Status.PAID, toList())));

        // ---- output ----
        byStatusAndMonth.forEach((status, months) ->
            System.out.println(status + " -> " + months));
        System.out.println("totals      " + totalByCustomer);
        System.out.println("stats c1    " + statsByCustomer.get("c1"));
        System.out.println("high value  " + highValue.get(true).size());
        System.out.println("top spender " + topSpender.orElse(null));
        System.out.println("summary     " + summary);
        System.out.println("ids         " + idsByStatus);
        System.out.println("paid only   " + paidOnlyByCustomer.keySet());
        System.out.println("latest      " + latestAmountPerCustomer);

        /*
         * WHICH OF THESE BELONG IN THE DATABASE?
         *
         * Almost all of them. Streaming a million rows into the JVM to
         * GROUP BY customer is the classic performance mistake: you pay
         * network transfer, deserialisation and heap for work the database
         * does with an index.
         *
         *   SELECT customer_id, SUM(amount_cents), COUNT(*)
         *   FROM orders WHERE status <> 'CANCELLED'
         *   GROUP BY customer_id;
         *
         * Use the Collectors API when:
         *   - the data is already in memory for another reason,
         *   - the set is small and bounded,
         *   - the grouping logic is genuinely not expressible in SQL,
         *   - or the source is not a database at all.
         *
         * And never use parallel() here: these are cheap per-element
         * operations, so the fork/join overhead dominates, and the shared
         * common pool means one slow stream starves the whole JVM.
         */
    }

    static List<Order> sample() {
        return List.of(
            new Order("o1", "c1", Order.Status.PAID,      LocalDate.of(2026, 1, 12),  4_500),
            new Order("o2", "c1", Order.Status.PAID,      LocalDate.of(2026, 1, 20), 12_000),
            new Order("o3", "c2", Order.Status.SHIPPED,   LocalDate.of(2026, 2,  3),  8_000),
            new Order("o4", "c2", Order.Status.CANCELLED, LocalDate.of(2026, 2,  9),  3_000),
            new Order("o5", "c3", Order.Status.PAID,      LocalDate.of(2026, 2, 27), 25_000),
            new Order("o6", "c1", Order.Status.NEW,       LocalDate.of(2026, 3,  1),  1_500));
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Fluency with downstream collectors is the marker here — `groupingBy(f, groupingBy(g, counting()))` should be something you write without thinking. Three specific traps are worth volunteering: `toMap` throws `IllegalStateException` on a duplicate key unless you pass a merge function; `Collectors.toMap` also rejects null values while `groupingBy` does not; and the grouped map has no defined order unless you supply a factory such as `TreeMap::new` or `EnumMap::new`. The answer that actually impresses, though, is the last one — recognising that most of this should be a `GROUP BY` in the database, and that `parallel()` on cheap per-element work is usually a pessimisation that also monopolises the shared common pool.",
    relatedQuestionIds: ["b059", "b066"],
  },

  /* ================================================================ */
  /* HashMap internals                                                 */
  /* ================================================================ */
  {
    id: "p19",
    topic: "hashmap-internals",
    title: "Implement a HashMap from scratch",
    difficulty: "hard",
    estimatedMinutes: 45,
    scenario:
      "Write a working hash map with separate chaining: power-of-two capacity, hash spreading, load-factor-driven resize, and correct `null` key handling.\n\n" +
      "This is the classic whiteboard exercise. Aim for something you could actually run.",
    tasks: [
      "Implement `put`, `get`, `remove`, `size` and `containsKey`.",
      "Use `h ^ (h >>> 16)` spreading and `(n - 1) & hash` indexing, and explain both.",
      "Resize at the load-factor threshold, preserving correctness.",
      "Support exactly one null key, as `java.util.HashMap` does.",
    ],
    hints: [
      "Power-of-two capacity lets you replace the modulo with a bitmask, which is far cheaper.",
      "Spreading XORs the high 16 bits down so they influence the low-order index bits.",
      "During resize, a node either stays at index `i` or moves to `i + oldCapacity` — you can split the chain without rehashing.",
    ],
    solution: `import java.util.*;

/**
 * A working hash map with separate chaining, faithful to the parts of
 * java.util.HashMap that get asked about.
 */
public class MiniHashMap<K, V> {

    static final int DEFAULT_CAPACITY = 16;
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    static final int MAXIMUM_CAPACITY = 1 << 30;

    static final class Node<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;

        Node(int hash, K key, V value, Node<K, V> next) {
            this.hash = hash; this.key = key; this.value = value; this.next = next;
        }
    }

    private Node<K, V>[] table;
    private int size;
    private int threshold;
    private final float loadFactor;
    private int modCount;

    public MiniHashMap() { this(DEFAULT_CAPACITY, DEFAULT_LOAD_FACTOR); }

    @SuppressWarnings("unchecked")
    public MiniHashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity <= 0) throw new IllegalArgumentException("capacity");
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("load factor");
        int capacity = tableSizeFor(initialCapacity);
        this.loadFactor = loadFactor;
        this.table = (Node<K, V>[]) new Node[capacity];
        this.threshold = (int) (capacity * loadFactor);
    }

    /** Round up to the next power of two - exactly HashMap's algorithm. */
    static int tableSizeFor(int c) {
        int n = c - 1;
        n |= n >>> 1; n |= n >>> 2; n |= n >>> 4; n |= n >>> 8; n |= n >>> 16;
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY ? MAXIMUM_CAPACITY : n + 1);
    }

    /**
     * SPREAD. The index is (n-1) & hash, which for n = 16 uses only the low 4
     * bits. XOR-ing the high 16 bits down means the high bits still influence
     * the bucket, so a hashCode that differs only in its high bits does not
     * collide on every key.
     */
    static int spread(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

    public V put(K key, V value) {
        int hash = spread(key);
        int index = (table.length - 1) & hash;      // bitmask, not modulo

        for (Node<K, V> node = table[index]; node != null; node = node.next) {
            // Compare hash FIRST - it is an int compare and usually short-circuits.
            if (node.hash == hash && (node.key == key
                    || (key != null && key.equals(node.key)))) {
                V old = node.value;
                node.value = value;                 // replace, size unchanged
                return old;
            }
        }

        table[index] = new Node<>(hash, key, value, table[index]);   // prepend
        modCount++;
        if (++size > threshold) resize();
        return null;
    }

    public V get(Object key) {
        Node<K, V> node = findNode(key);
        return node == null ? null : node.value;
    }

    public boolean containsKey(Object key) { return findNode(key) != null; }

    private Node<K, V> findNode(Object key) {
        int hash = spread(key);
        for (Node<K, V> node = table[(table.length - 1) & hash];
             node != null; node = node.next) {
            if (node.hash == hash && (node.key == key
                    || (key != null && key.equals(node.key)))) {
                return node;
            }
        }
        return null;
    }

    public V remove(Object key) {
        int hash = spread(key);
        int index = (table.length - 1) & hash;
        Node<K, V> previous = null;
        for (Node<K, V> node = table[index]; node != null; node = node.next) {
            if (node.hash == hash && (node.key == key
                    || (key != null && key.equals(node.key)))) {
                if (previous == null) table[index] = node.next;
                else previous.next = node.next;
                size--; modCount++;
                return node.value;
            }
            previous = node;
        }
        return null;
    }

    /**
     * RESIZE. Doubling the capacity means the index changes by exactly one bit:
     * a node either stays at j or moves to j + oldCapacity. Testing
     * (hash & oldCapacity) tells you which, so we split each chain into a
     * "low" and a "high" list without recomputing any hash.
     */
    @SuppressWarnings("unchecked")
    private void resize() {
        Node<K, V>[] oldTable = table;
        int oldCapacity = oldTable.length;
        if (oldCapacity >= MAXIMUM_CAPACITY) { threshold = Integer.MAX_VALUE; return; }

        int newCapacity = oldCapacity << 1;
        Node<K, V>[] newTable = (Node<K, V>[]) new Node[newCapacity];

        for (int j = 0; j < oldCapacity; j++) {
            Node<K, V> node = oldTable[j];
            if (node == null) continue;
            oldTable[j] = null;

            Node<K, V> loHead = null, loTail = null, hiHead = null, hiTail = null;
            while (node != null) {
                Node<K, V> next = node.next;
                if ((node.hash & oldCapacity) == 0) {        // stays at j
                    if (loTail == null) loHead = node; else loTail.next = node;
                    loTail = node;
                } else {                                      // moves to j + oldCapacity
                    if (hiTail == null) hiHead = node; else hiTail.next = node;
                    hiTail = node;
                }
                node = next;
            }
            if (loTail != null) { loTail.next = null; newTable[j] = loHead; }
            if (hiTail != null) { hiTail.next = null; newTable[j + oldCapacity] = hiHead; }
        }

        table = newTable;
        threshold = (int) (newCapacity * loadFactor);
    }

    public int size() { return size; }
    public int capacity() { return table.length; }

    /** Diagnostic: how well is the hash distributing? */
    public String distribution() {
        int used = 0, longest = 0;
        for (Node<K, V> bucket : table) {
            if (bucket == null) continue;
            used++;
            int length = 0;
            for (Node<K, V> n = bucket; n != null; n = n.next) length++;
            longest = Math.max(longest, length);
        }
        return String.format("size=%d capacity=%d usedBuckets=%d longestChain=%d",
            size, table.length, used, longest);
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) {
        MiniHashMap<String, Integer> map = new MiniHashMap<>();
        for (int i = 0; i < 100; i++) map.put("key" + i, i);

        System.out.println(map.distribution());        // capacity grew 16 -> 256
        System.out.println(map.get("key42"));          // 42
        System.out.println(map.remove("key42"));       // 42
        System.out.println(map.get("key42"));          // null

        map.put(null, -1);                             // exactly one null key
        System.out.println(map.get(null));             // -1
        map.put(null, -2);
        System.out.println(map.get(null) + " size=" + map.size());   // -2, unchanged

        // Worst case: every key collides.
        MiniHashMap<Bad, String> collisions = new MiniHashMap<>();
        for (int i = 0; i < 20; i++) collisions.put(new Bad(i), "v" + i);
        System.out.println(collisions.distribution());  // longestChain=20 => O(n)
        // java.util.HashMap would TREEIFY this chain at 8 nodes (table >= 64),
        // turning the worst case from O(n) into O(log n).
    }

    record Bad(int id) {
        @Override public int hashCode() { return 1; }   // pathological
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The three details interviewers actually listen for. **Power-of-two capacity**: it lets `(n-1) & hash` replace `hash % n`, and a bitmask is dramatically cheaper than integer division. **Spreading**: with a 16-slot table only the low 4 bits of the hash are used, so `h ^ (h >>> 16)` folds the high bits down — without it, hash codes that differ only above bit 4 all collide. **The resize split**: because capacity doubles, an entry's new index differs from the old by exactly the `oldCapacity` bit, so `(hash & oldCapacity)` partitions each chain into two without recomputing a single hash. If you can also explain treeification (chain ≥ 8 *and* table ≥ 64 → red-black tree, untreeify at 6) and why the thresholds differ to avoid thrashing, you have covered essentially everything that gets asked.",
    relatedQuestionIds: ["b067", "b068", "b069", "b072"],
  },
  {
    id: "p20",
    topic: "hashmap-internals",
    title: "Demonstrate and explain HashMap treeification",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "Prove that `HashMap` converts a bucket to a red-black tree, and show the performance difference. Then explain the exact thresholds and why there are two of them.",
    tasks: [
      "Construct keys that all collide and measure lookup time as the chain grows.",
      "State the exact treeify and untreeify conditions.",
      "Explain why the table must be at least 64 before treeifying.",
      "Explain why untreeify uses 6 rather than 8.",
    ],
    hints: [
      "`TREEIFY_THRESHOLD = 8`, `UNTREEIFY_THRESHOLD = 6`, `MIN_TREEIFY_CAPACITY = 64`.",
      "Under a good hash the Poisson probability of a bucket reaching 8 is about 0.00000006 — treeification is an attack mitigation, not an optimisation.",
      "A small table with a long chain is better fixed by resizing than by building a tree.",
    ],
    solution: `import java.util.*;
import java.lang.reflect.*;

public class TreeificationDemo {

    /** Every instance hashes to the same bucket, but they are not equal. */
    record CollidingKey(int id) implements Comparable<CollidingKey> {
        @Override public int hashCode() { return 42; }     // pathological
        @Override public int compareTo(CollidingKey o) { return Integer.compare(id, o.id); }
    }

    /** Same, but NOT Comparable - the tree then falls back to identity ordering. */
    static final class UncomparableKey {
        final int id;
        UncomparableKey(int id) { this.id = id; }
        @Override public int hashCode() { return 42; }
        @Override public boolean equals(Object o) {
            return o instanceof UncomparableKey k && k.id == id;
        }
    }

    public static void main(String[] args) throws Exception {
        /*
         * THE CONSTANTS (java.util.HashMap)
         *   TREEIFY_THRESHOLD     = 8    chain length that triggers treeify
         *   UNTREEIFY_THRESHOLD   = 6    tree size that reverts to a list
         *   MIN_TREEIFY_CAPACITY  = 64   table must be at least this big
         *
         * treeifyBin() is called when a bin reaches 8 nodes. If the table is
         * smaller than 64 it RESIZES INSTEAD - because in a small table a long
         * chain usually means "too few buckets", not "a bad hash", and resizing
         * is cheaper and fixes the real problem.
         */

        // ---- Measure lookup cost as the chain grows ----
        for (int n : new int[]{4, 8, 64, 512, 4096, 32768}) {
            Map<CollidingKey, Integer> map = new HashMap<>(128);   // start >= 64
            for (int i = 0; i < n; i++) map.put(new CollidingKey(i), i);

            CollidingKey worst = new CollidingKey(n - 1);
            long t0 = System.nanoTime();
            for (int i = 0; i < 100_000; i++) map.get(worst);
            long ns = (System.nanoTime() - t0) / 100_000;

            System.out.printf("n=%-6d lookup=%4dns  %s%n", n, ns,
                n >= 8 ? "TREE  O(log n)" : "list  O(n)");
        }
        /*
         * Without treeification the last row would be ~4000x slower than the
         * first. With it, growth is logarithmic: from 8 to 32768 entries the
         * lookup cost roughly triples rather than growing 4000-fold.
         */

        // ---- Prove it reflectively: the node type changes ----
        Map<CollidingKey, Integer> map = new HashMap<>(128);
        for (int i = 0; i < 7; i++) map.put(new CollidingKey(i), i);
        System.out.println("\\n7 nodes  -> " + nodeTypeOf(map));   // HashMap$Node
        map.put(new CollidingKey(7), 7);                           // the 8th
        System.out.println("8 nodes  -> " + nodeTypeOf(map));      // HashMap$TreeNode

        for (int i = 7; i >= 2; i--) map.remove(new CollidingKey(i));
        System.out.println("2 nodes  -> " + nodeTypeOf(map));      // back to Node

        // ---- The small-table case: resize instead of treeify ----
        Map<CollidingKey, Integer> small = new HashMap<>(16);
        for (int i = 0; i < 8; i++) small.put(new CollidingKey(i), i);
        System.out.println("\\ncapacity 16, 8 collisions -> " + nodeTypeOf(small)
            + " (resized rather than treeified)");

        // ---- Non-Comparable keys still work, just less efficiently ----
        Map<UncomparableKey, Integer> uncomparable = new HashMap<>(128);
        for (int i = 0; i < 20; i++) uncomparable.put(new UncomparableKey(i), i);
        System.out.println("non-Comparable keys treeify too, using "
            + "System.identityHashCode as a tie-break - correct, but the tree "
            + "is less balanced, so implement Comparable on keys you expect to collide.");

        /*
         * WHY 8 AND 6, NOT 8 AND 8?
         *
         * Hysteresis. If both thresholds were 8, a bin oscillating around
         * exactly 8 entries would convert list->tree->list->tree on every
         * put/remove pair, and each conversion is O(n) with allocation. The
         * two-value gap means you must drop two below the trigger before
         * reverting, which makes thrashing impossible.
         *
         * WHY 8 AT ALL?
         *
         * The Javadoc quotes the Poisson distribution for a well-distributed
         * hash at load factor 0.75:
         *      k=0: 0.60653066    k=4: 0.00038050
         *      k=1: 0.30326533    k=5: 0.00001523
         *      k=2: 0.07581633    k=6: 0.00000050
         *      k=3: 0.01263606    k=7: 0.00000001
         *      k=8: less than 1 in 10 million
         * So reaching 8 essentially never happens by chance. Treeification is
         * a DEFENCE against a bad hashCode or a deliberate collision attack,
         * not a general-purpose optimisation.
         */
    }

    static String nodeTypeOf(Map<?, ?> map) throws Exception {
        Field tableField = HashMap.class.getDeclaredField("table");
        tableField.setAccessible(true);
        Object[] table = (Object[]) tableField.get(map);
        if (table == null) return "table not allocated";
        for (Object bin : table) {
            if (bin != null) return bin.getClass().getSimpleName();
        }
        return "empty";
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The numbers 8, 6 and 64 come up constantly and most candidates can recite them without explaining them. The explanations are what count. **Why 64**: in a small table a long chain almost always means too few buckets, so resizing is both cheaper and a better fix than building a tree. **Why 6 for untreeify**: hysteresis — equal thresholds would cause list↔tree thrashing around the boundary, and each conversion is O(n) with allocation. **Why 8**: the Poisson table in the Javadoc shows a probability below 1 in 10 million under a decent hash, which tells you treeification exists to bound the worst case (a bad `hashCode` or a deliberate collision DoS), not to speed up the common case. Bonus point: `TreeNode` is roughly twice the size of `Node`, and non-`Comparable` keys fall back to `identityHashCode` for tie-breaking, which produces a less balanced tree.",
    relatedQuestionIds: ["b071", "b078", "b073"],
  },
  {
    id: "p21",
    topic: "hashmap-internals",
    title: "Reproduce the HashMap infinite loop under concurrency",
    difficulty: "hard",
    estimatedMinutes: 30,
    scenario:
      "A legacy Java 7 service pegged one CPU core at 100% and stopped responding. The thread dump showed several threads inside `HashMap.get`.\n\n" +
      "Explain the mechanism, show what Java 8 changed, and demonstrate that the map is still unsafe.",
    tasks: [
      "Explain the Java 7 resize cycle that produced an infinite loop.",
      "Explain what Java 8 changed and why it is still not thread-safe.",
      "Write a program that reliably produces lost updates on a shared HashMap.",
      "List the correct alternatives and their trade-offs.",
    ],
    hints: [
      "Java 7 `transfer()` reversed each chain while rehashing, because it prepended nodes to the new bucket.",
      "Java 8 preserves order by splitting each chain into a low and a high list — no reversal, no cycle.",
      "Lost updates, a corrupted size, and a resize that drops entries are all still possible in Java 8.",
    ],
    solution: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class HashMapConcurrencyFailure {

    /*
     * =============================================================
     * JAVA 7: THE INFINITE LOOP
     * =============================================================
     * void transfer(Entry[] newTable) {
     *     for (Entry<K,V> e : table) {
     *         while (e != null) {
     *             Entry<K,V> next = e.next;          // (1)
     *             int i = indexFor(e.hash, newTable.length);
     *             e.next = newTable[i];              // (2) PREPEND -> reverses order
     *             newTable[i] = e;                   // (3)
     *             e = next;                          // (4)
     *         }
     *     }
     * }
     *
     * Two threads resize the same map concurrently. Chain A -> B:
     *
     *   T1 executes (1): e = A, next = B.  T1 is then descheduled.
     *   T2 runs the whole transfer. Because of the prepend, T2's new table
     *     holds the REVERSED chain B -> A.
     *   T1 resumes with its stale local variables and re-links A -> B.
     *
     *   Result: A.next = B and B.next = A. A CYCLE.
     *
     * Any later get() that hashes into that bucket walks the cycle forever:
     * 100% CPU on one core, and a thread dump showing HashMap.getEntry.
     *
     * =============================================================
     * JAVA 8: THE CYCLE IS GONE, THE DANGER IS NOT
     * =============================================================
     * resize() splits each chain into a "lo" list (stays at j) and a "hi" list
     * (moves to j + oldCap), APPENDING to each, so relative order is preserved
     * and no reversal can occur. The infinite loop is therefore impossible.
     *
     * Still broken under concurrency:
     *   - LOST UPDATES: two puts into the same bucket, one overwrites the other
     *   - CORRUPTED size: size++ is read-modify-write
     *   - LOST ENTRIES during a concurrent resize
     *   - a get() can observe a half-built table
     *   - infinite loops are still reported in some resize interleavings
     */

    public static void main(String[] args) throws Exception {
        demonstrateLostUpdates();
        demonstrateCorruptSize();
        showAlternatives();
    }

    /** Reliably loses entries with 8 threads writing to a plain HashMap. */
    static void demonstrateLostUpdates() throws Exception {
        int threads = 8, perThread = 10_000;
        Map<Integer, Integer> unsafe = new HashMap<>();
        Map<Integer, Integer> safe = new ConcurrentHashMap<>();

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);

        for (int t = 0; t < threads; t++) {
            final int offset = t * perThread;
            pool.submit(() -> {
                try {
                    start.await();
                    for (int i = 0; i < perThread; i++) {
                        int key = offset + i;
                        unsafe.put(key, key);        // RACE
                        safe.put(key, key);
                    }
                } catch (Exception ignored) {
                } finally { done.countDown(); }
            });
        }
        start.countDown();
        done.await(30, TimeUnit.SECONDS);
        pool.shutdown();

        int expected = threads * perThread;
        System.out.printf("expected %d | HashMap %d (lost %d) | ConcurrentHashMap %d%n",
            expected, unsafe.size(), expected - unsafe.size(), safe.size());
        // typical: expected 80000 | HashMap 73412 (lost 6588) | ConcurrentHashMap 80000
    }

    /** size() can disagree with the actual entry count. */
    static void demonstrateCorruptSize() throws Exception {
        Map<Integer, Integer> map = new HashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch done = new CountDownLatch(4);
        AtomicInteger inserted = new AtomicInteger();

        for (int t = 0; t < 4; t++) {
            final int offset = t * 5_000;
            pool.submit(() -> {
                for (int i = 0; i < 5_000; i++) {
                    if (map.put(offset + i, i) == null) inserted.incrementAndGet();
                }
                done.countDown();
            });
        }
        done.await(30, TimeUnit.SECONDS);
        pool.shutdown();

        int counted = 0;
        try { for (var ignored : map.entrySet()) counted++; }
        catch (ConcurrentModificationException e) { counted = -1; }

        System.out.printf("size()=%d  actually iterated=%d  successful puts=%d%n",
            map.size(), counted, inserted.get());
    }

    static void showAlternatives() {
        /*
         * 1. ConcurrentHashMap                      <- the default answer
         *      lock-free reads, bin-level locking for writes, cooperative
         *      resize, atomic compute/merge/putIfAbsent.
         *      Cost: no null keys or values; size() is an estimate.
         *
         * 2. Collections.synchronizedMap(new HashMap<>())
         *      one global lock. Correct but serialises everything, and
         *      compound operations still need external synchronisation:
         *          synchronized (map) { if (!map.containsKey(k)) map.put(k, v); }
         *      Iteration must be inside a synchronized block or it throws.
         *
         * 3. Hashtable
         *      legacy, every method synchronized on the whole table. No reason
         *      to choose it in new code.
         *
         * 4. Immutable + copy-on-write (Map.copyOf, volatile reference)
         *      perfect for config reloaded rarely and read constantly.
         *
         * 5. Confinement
         *      give each thread its own HashMap and merge at the end. Often
         *      the fastest option of all - no synchronisation at all.
         */
        Map<String, Integer> concurrent = new ConcurrentHashMap<>();
        concurrent.merge("hits", 1, Integer::sum);                  // atomic
        concurrent.computeIfAbsent("k", k -> 0);                    // atomic

        Map<String, Integer> synchronised =
            Collections.synchronizedMap(new HashMap<>());
        synchronized (synchronised) {                                // compound op
            if (!synchronised.containsKey("k")) synchronised.put("k", 1);
        }
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This is a favourite because it rewards genuine understanding of the resize algorithm. The Java 7 loop comes from one specific detail: `transfer()` **prepended** nodes to the new bucket, which reverses the chain, and two threads interleaving mid-reversal can produce `A.next = B` and `B.next = A`. Java 8's lo/hi split **appends**, preserving order, so that particular cycle cannot form. The crucial follow-up — and the part that separates a memorised answer from a real one — is that Java 8 is still completely unsafe: lost updates, a corrupted `size`, entries dropped during a concurrent resize. Never say 'Java 8 fixed HashMap concurrency'. Finish with the alternatives ranked, and mention that thread confinement plus a final merge is frequently faster than any shared structure.",
    relatedQuestionIds: ["b072", "b056", "b100"],
  },
  {
    id: "p22",
    topic: "hashmap-internals",
    title: "Write a correct hashCode and measure its distribution",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "A `HashMap` keyed by a composite object performs terribly. Profiling shows every lookup walking a long chain.\n\n" +
      "Diagnose the hash function, rewrite it, and measure the improvement objectively.",
    tasks: [
      "Write a bucket-distribution histogram for an arbitrary key set.",
      "Compare a bad hash, a naive hash and the standard 31-based recipe.",
      "Explain why 31 was chosen.",
      "Show the effect of the spread function on a hash with poor low bits.",
    ],
    hints: [
      "`31 * i == (i << 5) - i`, which the JIT compiles to a shift and a subtract.",
      "A hash whose low bits are always zero collides catastrophically, because the bucket index uses only the low bits.",
      "Measure: bucket occupancy, longest chain, and standard deviation from the ideal.",
    ],
    solution: `import java.util.*;
import java.util.function.ToIntFunction;

public class HashQuality {

    record Point(int x, int y, String label) { }

    // ---- Four hash strategies, from terrible to correct ----

    /** TERRIBLE: constant. Every key in one bucket -> O(n) lookups. */
    static int constantHash(Point p) { return 1; }

    /** BAD: addition is commutative, so (1,2) and (2,1) collide. */
    static int additiveHash(Point p) { return p.x() + p.y(); }

    /** BAD IN A DIFFERENT WAY: multiplying by 16 zeroes the low 4 bits, and
     *  the bucket index uses exactly those bits. */
    static int lowBitsHash(Point p) { return (p.x() * 16) ^ (p.y() * 16); }

    /** CORRECT: the standard 31-based recipe. */
    static int standardHash(Point p) {
        int result = Integer.hashCode(p.x());
        result = 31 * result + Integer.hashCode(p.y());
        result = 31 * result + Objects.hashCode(p.label());
        return result;
    }

    /** Equivalent, and what a record generates for you. */
    static int objectsHash(Point p) { return Objects.hash(p.x(), p.y(), p.label()); }

    /** HashMap's spread: fold the high bits down into the index bits. */
    static int spread(int h) { return h ^ (h >>> 16); }

    // ------------------------------------------------------------------
    record Distribution(int keys, int buckets, int used, int longest,
                        double averageChain, double standardDeviation) {
        @Override public String toString() {
            return String.format(
                "used=%4d/%4d (%.1f%%)  longest=%-5d avgChain=%.2f  stdDev=%.2f",
                used, buckets, 100.0 * used / buckets, longest,
                averageChain, standardDeviation);
        }
    }

    static Distribution analyse(List<Point> keys, ToIntFunction<Point> hash,
                                boolean applySpread, int buckets) {
        int[] counts = new int[buckets];
        for (Point key : keys) {
            int h = hash.applyAsInt(key);
            if (applySpread) h = spread(h);
            counts[(buckets - 1) & h]++;          // exactly HashMap's indexing
        }
        int used = 0, longest = 0;
        for (int count : counts) {
            if (count > 0) used++;
            longest = Math.max(longest, count);
        }
        double ideal = (double) keys.size() / buckets;
        double variance = 0;
        for (int count : counts) variance += Math.pow(count - ideal, 2);
        return new Distribution(keys.size(), buckets, used, longest,
            used == 0 ? 0 : (double) keys.size() / used,
            Math.sqrt(variance / buckets));
    }

    public static void main(String[] args) {
        List<Point> keys = new ArrayList<>();
        for (int x = 0; x < 100; x++)
            for (int y = 0; y < 100; y++)
                keys.add(new Point(x, y, "p" + x + "-" + y));

        int buckets = 16_384;     // a power of two, as HashMap always uses

        System.out.println("10,000 composite keys into " + buckets + " buckets\\n");
        System.out.println("constant        " + analyse(keys, HashQuality::constantHash, true, buckets));
        System.out.println("additive        " + analyse(keys, HashQuality::additiveHash, true, buckets));
        System.out.println("low-bits-zero   " + analyse(keys, HashQuality::lowBitsHash, false, buckets));
        System.out.println("low-bits+spread " + analyse(keys, HashQuality::lowBitsHash, true, buckets));
        System.out.println("31-based        " + analyse(keys, HashQuality::standardHash, true, buckets));
        System.out.println("Objects.hash    " + analyse(keys, HashQuality::objectsHash, true, buckets));

        /*
         * Typical output:
         *   constant        used=   1/16384 (0.0%)   longest=10000 avgChain=10000.00
         *   additive        used= 199/16384 (1.2%)   longest=100   avgChain=50.25
         *   low-bits-zero   used= 625/16384 (3.8%)   longest=32    avgChain=16.00
         *   low-bits+spread used=4021/16384 (24.5%)  longest=8     avgChain=2.49
         *   31-based        used=7899/16384 (48.2%)  longest=5     avgChain=1.27
         *   Objects.hash    used=7899/16384 (48.2%)  longest=5     avgChain=1.27
         *
         * Note how much the SPREAD alone rescues the low-bits-zero hash - that
         * is exactly the defensive job h ^ (h >>> 16) is doing inside HashMap.
         */

        // ---- Real lookup cost ----
        for (var entry : Map.of(
                "constant",  (ToIntFunction<Point>) HashQuality::constantHash,
                "additive",  HashQuality::additiveHash,
                "31-based",  HashQuality::standardHash).entrySet()) {

            Map<Wrapper, Integer> map = new HashMap<>(32_768);
            for (int i = 0; i < keys.size(); i++) {
                map.put(new Wrapper(keys.get(i), entry.getValue()), i);
            }
            Wrapper probe = new Wrapper(keys.get(keys.size() - 1), entry.getValue());
            long t0 = System.nanoTime();
            for (int i = 0; i < 100_000; i++) map.get(probe);
            System.out.printf("%-10s lookup %6dns%n",
                entry.getKey(), (System.nanoTime() - t0) / 100_000);
        }

        /*
         * WHY 31?
         *
         * 1. It is ODD. An even multiplier loses a bit on every multiply; after
         *    enough rounds the low bits are all zero - and the low bits ARE the
         *    bucket index.
         * 2. It is PRIME, which spreads patterned inputs well.
         * 3. 31 * i == (i << 5) - i, so the JIT emits a shift and a subtract
         *    instead of a multiply. (Largely historical now - modern CPUs
         *    multiply in one cycle - but it is why the constant was chosen.)
         * 4. It is small enough that intermediate values do not overflow too
         *    quickly, and large enough to move bits meaningfully.
         *
         * THE RULES
         *   - equal objects MUST have equal hash codes
         *   - use exactly the fields used in equals(), no more, no less
         *   - use only IMMUTABLE fields
         *   - do not include collections whose contents change
         *   - caching the value is worthwhile for expensive keys (String does it)
         */
    }

    /** Wrapper that lets us plug in an arbitrary hash function. */
    record Wrapper(Point point, ToIntFunction<Point> hasher) {
        @Override public int hashCode() { return hasher.applyAsInt(point); }
        @Override public boolean equals(Object o) {
            return o instanceof Wrapper w && point.equals(w.point);
        }
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Being able to *measure* hash quality rather than assert it is the differentiator. Three insights to land. First, the most instructive failure is not the constant hash — it is `lowBitsHash`, where the hash values are well spread in absolute terms but the low bits are always zero, and the bucket index uses only the low bits; the spread function alone lifts occupancy from 3.8% to 24.5%, which is precisely the defensive job it exists to do. Second, the reason for 31 is that it is odd (an even multiplier progressively zeroes low bits), prime, and historically cheap as `(i << 5) - i`. Third, the field rules: exactly the `equals` fields, only immutable ones, and never a mutable collection. Mentioning that `String` caches its hash and that records generate the correct recipe for you rounds it out.",
    relatedQuestionIds: ["b068", "b079", "b051"],
  },
  {
    id: "p23",
    topic: "hashmap-internals",
    title: "Size a HashMap correctly and measure the cost of getting it wrong",
    difficulty: "easy",
    estimatedMinutes: 20,
    scenario:
      "A service loads a one-million-entry lookup table at startup and it takes far longer than expected. The map is created with `new HashMap<>()`.\n\n" +
      "Quantify the cost of the default sizing and show the correct initial capacity calculation.",
    tasks: [
      "Count how many resizes occur when inserting 1,000,000 entries into a default map.",
      "Derive the correct initial capacity from an expected entry count.",
      "Benchmark default vs pre-sized insertion.",
      "Explain why `new HashMap<>(1_000_000)` is still not quite right.",
    ],
    hints: [
      "The default capacity is 16 and the threshold is `capacity * 0.75`; each resize doubles and re-links every entry.",
      "Capacity must exceed `expected / loadFactor`, and it is rounded up to a power of two.",
      "Java 19 added `HashMap.newHashMap(int numMappings)`, which does the arithmetic for you.",
    ],
    solution: `import java.util.*;

public class SizingHashMaps {

    public static void main(String[] args) {
        int entries = 1_000_000;

        /*
         * =============================================================
         * HOW MANY RESIZES DOES THE DEFAULT MAP DO?
         * =============================================================
         * capacity 16, threshold 12 -> resize at 13
         * Each resize DOUBLES the table and re-links every existing entry.
         */
        int capacity = 16, resizes = 0;
        long totalRelinked = 0;
        for (int size = 1; size <= entries; size++) {
            if (size > capacity * 0.75) {
                totalRelinked += size - 1;       // every existing entry is moved
                capacity <<= 1;
                resizes++;
            }
        }
        System.out.printf("default sizing: %d resizes, final capacity %d, "
            + "%,d node re-links%n", resizes, capacity, totalRelinked);
        // default sizing: 17 resizes, final capacity 2097152, 1,048,558 node re-links

        /*
         * =============================================================
         * THE CORRECT INITIAL CAPACITY
         * =============================================================
         * We need:   capacity * loadFactor  >  expectedEntries
         * therefore: capacity > expectedEntries / loadFactor
         *
         * and HashMap rounds UP to a power of two, so:
         */
        int expected = entries;
        int correct = (int) (expected / 0.75f) + 1;      // 1,333,334 -> rounds to 2^21
        System.out.println("correct initial capacity argument: " + correct);

        // Java 19+ does the arithmetic for you:
        // Map<Integer, String> m = HashMap.newHashMap(expected);

        /*
         * WHY new HashMap<>(1_000_000) IS STILL WRONG
         *
         * That argument is the CAPACITY, not the expected entry count. It
         * rounds up to 2^20 = 1,048,576, whose threshold is 786,432 - LESS
         * than the million entries we are about to insert. So it still
         * resizes once, at three-quarters full, copying 786k entries.
         */
        System.out.println("\\n1_000_000 as capacity -> table " + tableSizeFor(1_000_000)
            + ", threshold " + (int) (tableSizeFor(1_000_000) * 0.75f)
            + "  (still resizes!)");
        System.out.println(correct + " as capacity        -> table " + tableSizeFor(correct)
            + ", threshold " + (int) (tableSizeFor(correct) * 0.75f)
            + "  (no resize)");

        // =============================================================
        // BENCHMARK
        // =============================================================
        System.out.println();
        benchmark("default        ", () -> new HashMap<>(), entries);
        benchmark("capacity=1M    ", () -> new HashMap<>(1_000_000), entries);
        benchmark("capacity=1.33M ", () -> new HashMap<>(correct), entries);
        benchmark("loadFactor=1.0 ", () -> new HashMap<>(1_048_576, 1.0f), entries);

        /*
         * Typical result: pre-sizing is roughly 1.5-2x faster for the load, and
         * avoids allocating (and garbage-collecting) every intermediate table -
         * 17 arrays, the largest of which are megabytes.
         *
         * THE LOAD FACTOR TRADE-OFF
         *   0.75 (default) - the documented sweet spot: ~1.25 average probes,
         *                    25% wasted slots
         *   1.0            - less memory, longer chains, more collisions
         *   0.5            - fewer collisions, double the wasted space
         * Leave it at 0.75 unless you have measured a reason not to.
         *
         * ALSO WORTH KNOWING
         *   - the table is allocated LAZILY, on the first put, not in the
         *     constructor - so an empty HashMap is cheap
         *   - a resize is O(n) and single-threaded; for very large maps it is a
         *     visible latency spike
         *   - Map.of(...) / Map.copyOf(...) produce compact immutable maps with
         *     no resize behaviour at all - ideal for a read-only lookup table
         */
    }

    static int tableSizeFor(int c) {
        int n = c - 1;
        n |= n >>> 1; n |= n >>> 2; n |= n >>> 4; n |= n >>> 8; n |= n >>> 16;
        return (n < 0) ? 1 : n + 1;
    }

    static void benchmark(String label,
                          java.util.function.Supplier<Map<Integer, String>> factory,
                          int entries) {
        System.gc();
        long t0 = System.nanoTime();
        Map<Integer, String> map = factory.get();
        for (int i = 0; i < entries; i++) map.put(i, "v");
        long ms = (System.nanoTime() - t0) / 1_000_000;
        System.out.printf("%s %,10d entries in %4d ms%n", label, map.size(), ms);
    }
}`,
    solutionLanguage: "java",
    discussion:
      "A small question that reveals whether you understand the internals. Two things get missed. First, the resize cost is not just the allocation — every existing entry is re-linked, so loading a million entries into a default map performs roughly a million extra node operations spread over 17 doublings, plus it allocates and then discards 17 arrays, the last few of which are megabytes. Second, and this is the good part: `new HashMap<>(1_000_000)` is the *intuitive* fix and it is still wrong, because the argument is capacity, not expected size — it rounds to 2²⁰ whose threshold is 786,432, so you still resize. The correct argument is `expected / loadFactor + 1`, and Java 19's `HashMap.newHashMap(n)` exists precisely because everyone got this wrong.",
    relatedQuestionIds: ["b069", "b070", "b064"],
  },

  /* ================================================================ */
  /* Multithreading                                                    */
  /* ================================================================ */
  {
    id: "p24",
    topic: "multithreading",
    title: "Build a thread-safe counter five different ways",
    difficulty: "easy",
    estimatedMinutes: 25,
    scenario:
      "Show that `count++` loses updates, then fix it five ways and benchmark them under 16 threads. Be able to say which you would ship and why.",
    tasks: [
      "Demonstrate lost updates with a plain and with a `volatile` field.",
      "Fix with `synchronized`, `AtomicLong`, `LongAdder`, `ReentrantLock` and a striped approach.",
      "Benchmark all of them under contention.",
      "Explain when `LongAdder` beats `AtomicLong` and when it does not.",
    ],
    hints: [
      "`count++` is read-modify-write: three operations, not one. `volatile` makes each visible but does not make the sequence atomic.",
      "`AtomicLong` is a CAS retry loop — under heavy contention threads spin and the cache line ping-pongs.",
      "`LongAdder` stripes across padded cells; `sum()` is not an atomic snapshot.",
    ],
    solution: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.ReentrantLock;

public class CounterImplementations {

    interface Counter { void increment(); long get(); }

    /** 1. BROKEN: read-modify-write is not atomic. */
    static class PlainCounter implements Counter {
        private long count;
        public void increment() { count++; }
        public long get() { return count; }
    }

    /** 2. STILL BROKEN: volatile gives visibility, never atomicity. */
    static class VolatileCounter implements Counter {
        private volatile long count;
        public void increment() { count++; }     // load, add, store - interleavable
        public long get() { return count; }
    }

    /** 3. CORRECT: mutual exclusion. Simple, and fast when uncontended. */
    static class SynchronizedCounter implements Counter {
        private long count;
        public synchronized void increment() { count++; }
        public synchronized long get() { return count; }   // READS need it too
    }

    /** 4. CORRECT: a CAS retry loop, no blocking. */
    static class AtomicCounter implements Counter {
        private final AtomicLong count = new AtomicLong();
        public void increment() { count.incrementAndGet(); }
        public long get() { return count.get(); }
    }

    /** 5. CORRECT: striped cells - the best write throughput under contention. */
    static class AdderCounter implements Counter {
        private final LongAdder count = new LongAdder();
        public void increment() { count.increment(); }
        public long get() { return count.sum(); }          // NOT an atomic snapshot
    }

    /** 6. CORRECT: explicit lock - only worth it if you need tryLock/Condition. */
    static class LockCounter implements Counter {
        private final ReentrantLock lock = new ReentrantLock();
        private long count;
        public void increment() {
            lock.lock();
            try { count++; } finally { lock.unlock(); }    // finally is mandatory
        }
        public long get() {
            lock.lock();
            try { return count; } finally { lock.unlock(); }
        }
    }

    /** 7. FASTEST OF ALL: no sharing. Per-thread accumulation, merged at the end. */
    static class ConfinedCounter implements Counter {
        private final ThreadLocal<long[]> local = ThreadLocal.withInitial(() -> new long[1]);
        private final java.util.List<long[]> all =
            java.util.Collections.synchronizedList(new java.util.ArrayList<>());

        public void increment() {
            long[] cell = local.get();
            if (cell[0] == 0) all.add(cell);               // register on first use
            cell[0]++;                                      // no synchronisation at all
        }
        public long get() {
            synchronized (all) { return all.stream().mapToLong(c -> c[0]).sum(); }
        }
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        int threads = 16, perThread = 1_000_000;
        long expected = (long) threads * perThread;

        for (Counter counter : java.util.List.of(
                new PlainCounter(), new VolatileCounter(), new SynchronizedCounter(),
                new AtomicCounter(), new AdderCounter(), new LockCounter(),
                new ConfinedCounter())) {

            long ms = hammer(counter, threads, perThread);
            long actual = counter.get();
            System.out.printf("%-20s %6dms  result=%,12d  %s%n",
                counter.getClass().getSimpleName(), ms, actual,
                actual == expected ? "CORRECT" : "LOST " + (expected - actual));
        }

        /*
         * Typical output on 8 cores:
         *
         *   PlainCounter          142ms  result=   3,217,883  LOST 12782117
         *   VolatileCounter       891ms  result=   4,109,442  LOST 11890558
         *   SynchronizedCounter  1840ms  result=  16,000,000  CORRECT
         *   AtomicCounter         623ms  result=  16,000,000  CORRECT
         *   AdderCounter           94ms  result=  16,000,000  CORRECT
         *   LockCounter          1655ms  result=  16,000,000  CORRECT
         *   ConfinedCounter        38ms  result=  16,000,000  CORRECT
         *
         * Note that VolatileCounter is both WRONG and SLOWER than plain - the
         * memory barriers cost real time and buy no correctness here.
         */
    }

    static long hammer(Counter counter, int threads, int perThread) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);       // start gate
        CountDownLatch done  = new CountDownLatch(threads);

        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                try { start.await(); } catch (InterruptedException e) { return; }
                for (int i = 0; i < perThread; i++) counter.increment();
                done.countDown();
            });
        }
        long t0 = System.nanoTime();
        start.countDown();                                   // all threads collide
        done.await();
        long ms = (System.nanoTime() - t0) / 1_000_000;
        pool.shutdown();
        return ms;
    }
}

/*
WHICH WOULD I SHIP?

  - a hot metric counter, read occasionally      -> LongAdder
  - a value read on every write (a sequence, an
    id generator, a CAS state machine)           -> AtomicLong
  - a counter guarded alongside other state      -> synchronized on that state
  - per-request accumulation, merged at the end  -> thread confinement
  - need tryLock, a timeout, or a Condition      -> ReentrantLock

WHEN LongAdder LOSES
  - low contention: it is slower than AtomicLong and uses more memory
  - you need an exact instantaneous value: sum() is not atomic
  - you need compareAndSet: LongAdder has no CAS API
*/`,
    solutionLanguage: "java",
    discussion:
      "The setup is deliberately simple so the depth has to come from you. Three points earn marks. First, `volatile` on the counter is not just insufficient — it is actively worse than the plain field, because you pay for memory barriers and still lose updates; that surprises people and demonstrates you understand that visibility and atomicity are orthogonal. Second, `LongAdder`'s advantage is specifically **write** throughput under contention: it stripes across `@Contended`-padded cells so cores stop fighting over one cache line, at the cost of a non-atomic `sum()` and more memory. Third, the fastest correct answer is usually 'do not share at all' — per-thread accumulation with a final merge, which is exactly the design `LongAdder` generalises. Mentioning the start-gate `CountDownLatch` matters too: without it the threads run sequentially and the benchmark measures nothing.",
    relatedQuestionIds: ["b083", "b087", "b090"],
  },
  {
    id: "p25",
    topic: "multithreading",
    title: "Reproduce, detect and fix a deadlock",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Two threads transferring money between the same two accounts in opposite directions hang forever.\n\n" +
      "Reproduce it reliably, detect it programmatically, then fix it two ways.",
    tasks: [
      "Write code that deadlocks on essentially every run.",
      "Detect it with `ThreadMXBean` and read the equivalent `jstack` output.",
      "Fix it with global lock ordering.",
      "Fix it with `tryLock` plus randomised backoff, and say which you would ship.",
    ],
    hints: [
      "All four Coffman conditions must hold; break any one and deadlock is impossible.",
      "A small sleep between acquiring the first and second lock makes the race deterministic.",
      "`System.identityHashCode` gives you a total order when there is no natural business key — but beware of collisions.",
    ],
    solution: `import java.lang.management.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

public class DeadlockLab {

    static class Account {
        final int id;
        final ReentrantLock lock = new ReentrantLock();
        long balance;
        Account(int id, long balance) { this.id = id; this.balance = balance; }
    }

    /* =============================================================
     * 1. THE BUG - deadlocks on virtually every run
     * ============================================================= */
    static void unsafeTransfer(Account from, Account to, long amount) {
        synchronized (from) {
            sleep(50);                       // widen the window; the race is real without it
            synchronized (to) {              // CIRCULAR WAIT
                from.balance -= amount;
                to.balance += amount;
            }
        }
    }

    /* =============================================================
     * 2. FIX A - GLOBAL LOCK ORDERING (breaks circular wait)
     * ============================================================= */
    static void orderedTransfer(Account a, Account b, long amount) {
        Account first  = a.id < b.id ? a : b;
        Account second = a.id < b.id ? b : a;
        synchronized (first) {
            synchronized (second) {
                a.balance -= amount;
                b.balance += amount;
            }
        }
    }

    /** When there is no natural ordering key, fall back to identity hash. */
    private static final Object TIE_BREAK = new Object();

    static void identityOrderedTransfer(Account a, Account b, long amount) {
        int ha = System.identityHashCode(a), hb = System.identityHashCode(b);
        if (ha < hb) {
            synchronized (a) { synchronized (b) { move(a, b, amount); } }
        } else if (ha > hb) {
            synchronized (b) { synchronized (a) { move(a, b, amount); } }
        } else {
            // identityHashCode collision: serialise on a single global lock
            synchronized (TIE_BREAK) {
                synchronized (a) { synchronized (b) { move(a, b, amount); } }
            }
        }
    }

    /* =============================================================
     * 3. FIX B - tryLock + BACKOFF (breaks hold-and-wait)
     * ============================================================= */
    static boolean tryTransfer(Account a, Account b, long amount, Duration_ timeout)
            throws InterruptedException {
        long deadline = System.nanoTime() + timeout.nanos();
        while (System.nanoTime() < deadline) {
            if (a.lock.tryLock(50, TimeUnit.MILLISECONDS)) {
                try {
                    if (b.lock.tryLock(50, TimeUnit.MILLISECONDS)) {
                        try {
                            if (a.balance < amount) return false;
                            move(a, b, amount);
                            return true;
                        } finally { b.lock.unlock(); }
                    }
                } finally { a.lock.unlock(); }      // release EVERYTHING before retrying
            }
            // Randomised backoff: without jitter both threads retry in lockstep
            // and livelock instead of deadlocking.
            Thread.sleep(ThreadLocalRandom.current().nextInt(10, 60));
        }
        return false;
    }

    record Duration_(long nanos) {
        static Duration_ ofSeconds(long s) { return new Duration_(s * 1_000_000_000L); }
    }

    /* =============================================================
     * 4. DETECTION
     * ============================================================= */
    static Optional<String> findDeadlock() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        long[] ids = mx.findDeadlockedThreads();     // includes ownable synchronizers
        if (ids == null) return Optional.empty();

        StringBuilder report = new StringBuilder("DEADLOCK DETECTED\\n");
        for (ThreadInfo info : mx.getThreadInfo(ids, true, true)) {
            report.append("  thread '").append(info.getThreadName())
                  .append("' state=").append(info.getThreadState())
                  .append("\\n    waiting on: ").append(info.getLockName())
                  .append("\\n    owned by:   ").append(info.getLockOwnerName())
                  .append("\\n");
            for (MonitorInfo m : info.getLockedMonitors()) {
                report.append("    holds: ").append(m).append('\\n');
            }
        }
        return Optional.of(report.toString());
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        Account a = new Account(1, 1000), b = new Account(2, 1000);

        Thread t1 = new Thread(() -> unsafeTransfer(a, b, 100), "transfer-a-to-b");
        Thread t2 = new Thread(() -> unsafeTransfer(b, a, 200), "transfer-b-to-a");
        t1.start(); t2.start();

        Thread.sleep(500);
        System.out.println(findDeadlock().orElse("no deadlock"));

        /*
         * jstack <pid> prints the same thing, and the JVM names it explicitly:
         *
         *   Found one Java-level deadlock:
         *   =============================
         *   "transfer-a-to-b":
         *     waiting to lock monitor 0x00007f8 (object 0x000000076ab, Account),
         *     which is held by "transfer-b-to-a"
         *   "transfer-b-to-a":
         *     waiting to lock monitor 0x00007f9 (object 0x000000076ac, Account),
         *     which is held by "transfer-a-to-b"
         */

        t1.interrupt(); t2.interrupt();       // note: does NOT break a synchronized wait

        // ---- Both fixes, hammered ----
        Account x = new Account(1, 1_000_000), y = new Account(2, 1_000_000);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch done = new CountDownLatch(8);
        for (int i = 0; i < 8; i++) {
            final boolean forward = i % 2 == 0;
            pool.submit(() -> {
                for (int k = 0; k < 10_000; k++) {
                    if (forward) orderedTransfer(x, y, 1); else orderedTransfer(y, x, 1);
                }
                done.countDown();
            });
        }
        System.out.println("ordered transfers completed: "
            + done.await(30, TimeUnit.SECONDS));
        System.out.println("conserved: " + (x.balance + y.balance == 2_000_000));
        pool.shutdown();
        System.exit(0);
    }

    static void move(Account from, Account to, long amount) {
        from.balance -= amount; to.balance += amount;
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Reproducing it is easy; the discussion is where the marks are. Frame it with the four Coffman conditions and be explicit about which one each fix breaks — lock ordering kills circular wait, `tryLock` kills hold-and-wait. Then give the trade-off: **global ordering is what I would ship** because it is deterministic, has no retry cost and no livelock risk; `tryLock` with backoff is the right answer only when a total order genuinely cannot be defined, and it *must* have randomised jitter or the two threads retry in lockstep and you have swapped a deadlock for a livelock. Two details that stand out: `identityHashCode` can collide, so you need a tie-break lock for correctness, and `interrupt()` does not break a thread blocked on `synchronized` — only `lockInterruptibly` responds. Finish with the prevention rule: never call foreign or blocking code while holding a lock.",
    relatedQuestionIds: ["b086", "b084", "b094"],
  },
  {
    id: "p26",
    topic: "multithreading",
    title: "Implement a bounded blocking queue from scratch",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Implement a bounded blocking queue twice: once with `synchronized`/`wait`/`notifyAll`, and once with `ReentrantLock` and two `Condition`s.\n\n" +
      "Then explain why the second version is more efficient.",
    tasks: [
      "Implement `put` and `take` with the intrinsic monitor.",
      "Implement the same with a lock and separate `notFull`/`notEmpty` conditions.",
      "Explain why the wait must be in a `while` loop, not an `if`.",
      "Show a scenario where `notify()` instead of `notifyAll()` hangs the system.",
    ],
    hints: [
      "`wait()` releases the monitor; `sleep()` does not.",
      "With one monitor, producers and consumers share a wait set — `notify()` may wake the wrong group.",
      "Two `Condition`s let you signal exactly the group that can make progress.",
    ],
    solution: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.*;

public class BoundedQueues {

    /* =============================================================
     * VERSION 1: intrinsic monitor
     * ============================================================= */
    static class MonitorQueue<T> {
        private final Object[] items;
        private int head, tail, count;

        MonitorQueue(int capacity) { items = new Object[capacity]; }

        public synchronized void put(T item) throws InterruptedException {
            // WHILE, never IF. Three independent reasons:
            //   1. spurious wakeups are permitted by the JLS
            //   2. a stolen wakeup: another thread can grab the lock between
            //      the notify and our re-acquisition, and consume the space
            //   3. notifyAll() wakes producers AND consumers from one wait set
            while (count == items.length) {
                wait();                       // RELEASES the monitor (sleep would not)
            }
            items[tail] = item;
            tail = (tail + 1) % items.length;
            count++;
            notifyAll();                      // must be All: mixed wait set
        }

        @SuppressWarnings("unchecked")
        public synchronized T take() throws InterruptedException {
            while (count == 0) {
                wait();
            }
            T item = (T) items[head];
            items[head] = null;               // avoid the loitering-object leak
            head = (head + 1) % items.length;
            count--;
            notifyAll();
            return item;
        }

        public synchronized int size() { return count; }
    }

    /* =============================================================
     * VERSION 2: ReentrantLock + two Conditions
     * ============================================================= */
    static class ConditionQueue<T> {
        private final Object[] items;
        private int head, tail, count;

        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notFull  = lock.newCondition();   // producers wait here
        private final Condition notEmpty = lock.newCondition();   // consumers wait here

        ConditionQueue(int capacity) { items = new Object[capacity]; }

        public void put(T item) throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (count == items.length) notFull.await();
                items[tail] = item;
                tail = (tail + 1) % items.length;
                count++;
                notEmpty.signal();            // wake exactly ONE consumer
            } finally { lock.unlock(); }
        }

        @SuppressWarnings("unchecked")
        public T take() throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (count == 0) notEmpty.await();
                T item = (T) items[head];
                items[head] = null;
                head = (head + 1) % items.length;
                count--;
                notFull.signal();             // wake exactly ONE producer
                return item;
            } finally { lock.unlock(); }
        }

        /** Bounded wait, which the intrinsic version cannot express cleanly. */
        public boolean offer(T item, long timeout, TimeUnit unit)
                throws InterruptedException {
            long nanos = unit.toNanos(timeout);
            lock.lockInterruptibly();
            try {
                while (count == items.length) {
                    if (nanos <= 0) return false;
                    nanos = notFull.awaitNanos(nanos);   // returns the REMAINING time
                }
                items[tail] = item;
                tail = (tail + 1) % items.length;
                count++;
                notEmpty.signal();
                return true;
            } finally { lock.unlock(); }
        }
    }

    /* =============================================================
     * WHY notify() CAN HANG THE SYSTEM
     * ============================================================= */
    static class BrokenQueue<T> {
        private final Object[] items;
        private int head, tail, count;
        BrokenQueue(int capacity) { items = new Object[capacity]; }

        public synchronized void put(T item) throws InterruptedException {
            while (count == items.length) wait();
            items[tail] = item; tail = (tail + 1) % items.length; count++;
            notify();      // BUG: may wake another PRODUCER, which sees a full
        }                  //      queue and waits again. The consumer is never
                           //      woken. Everyone sleeps. Deadlock.

        @SuppressWarnings("unchecked")
        public synchronized T take() throws InterruptedException {
            while (count == 0) wait();
            T item = (T) items[head]; items[head] = null;
            head = (head + 1) % items.length; count--;
            notify();      // same bug in the other direction
            return item;
        }
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        ConditionQueue<Integer> queue = new ConditionQueue<>(10);
        int producers = 3, consumers = 3, perProducer = 5_000;

        ExecutorService pool = Executors.newFixedThreadPool(producers + consumers);
        CountDownLatch done = new CountDownLatch(producers + consumers);
        java.util.concurrent.atomic.AtomicInteger consumed =
            new java.util.concurrent.atomic.AtomicInteger();

        for (int p = 0; p < producers; p++) {
            pool.submit(() -> {
                try { for (int i = 0; i < perProducer; i++) queue.put(i); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                finally { done.countDown(); }
            });
        }
        int total = producers * perProducer;
        for (int c = 0; c < consumers; c++) {
            pool.submit(() -> {
                try {
                    while (consumed.get() < total) {
                        queue.take();
                        consumed.incrementAndGet();
                    }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                finally { done.countDown(); }
            });
        }

        long t0 = System.currentTimeMillis();
        done.await(30, TimeUnit.SECONDS);
        pool.shutdownNow();
        System.out.printf("consumed %d/%d in %dms%n",
            consumed.get(), total, System.currentTimeMillis() - t0);

        /*
         * WHY THE CONDITION VERSION IS FASTER
         *
         * With one monitor, notifyAll() wakes EVERY waiting thread. Suppose 10
         * producers and 10 consumers are blocked and one item arrives: all 20
         * wake, all 20 contend for the monitor, 19 re-check their predicate and
         * go straight back to sleep. That is a "thundering herd" - 20 context
         * switches to make one thread's progress.
         *
         * With two Conditions, signal() wakes exactly one thread from exactly
         * the right group: one context switch. That is why
         * java.util.concurrent.ArrayBlockingQueue is written this way.
         *
         * IN PRODUCTION: use ArrayBlockingQueue or LinkedBlockingQueue. This
         * exercise is about understanding what they do, not replacing them.
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This is the classic monitor exercise and it has three checkpoints. **`while` not `if`** — and you should be able to name all three reasons (spurious wakeups are explicitly allowed by the JLS; a third thread can steal the condition between the notify and your re-acquisition; `notifyAll` wakes producers and consumers from a shared wait set). **`wait` releases the monitor, `sleep` does not** — the single most common confusion in this area. **Why two `Condition`s beat one monitor**: `notifyAll` on a mixed wait set is a thundering herd where N threads wake, contend, and N−1 immediately re-sleep, whereas `notEmpty.signal()` wakes exactly one thread that can definitely make progress. Constructing the `notify()` hang scenario out loud — producer wakes producer, sees a full queue, sleeps again, consumer never woken — is what demonstrates real understanding rather than memorisation.",
    relatedQuestionIds: ["b085", "b084", "b099"],
  },
  {
    id: "p27",
    topic: "multithreading",
    title: "Compose parallel service calls with CompletableFuture",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "A product page needs data from four services. Sequentially it takes 800 ms. Two of the calls are independent, one depends on the first, and one is optional.\n\n" +
      "Build the async pipeline with proper timeouts, fallbacks and error handling.",
    tasks: [
      "Fan out the independent calls and combine them.",
      "Chain the dependent call with `thenCompose`, not `thenApply`.",
      "Give the optional call a timeout and a fallback so it can never fail the page.",
      "Use a dedicated executor and explain why not the common pool.",
    ],
    hints: [
      "`thenApply` with a function returning a future gives you `CompletableFuture<CompletableFuture<T>>` — use `thenCompose`.",
      "`allOf` returns `Void`; re-map afterwards with `join` on each future, which cannot block because they are all complete.",
      "`orTimeout` fails the stage; `completeOnTimeout` supplies a default instead.",
    ],
    solution: `import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

public class ProductPageAggregator {

    record Product(String id, String name, long priceCents) { }
    record Inventory(String productId, int available) { }
    record Review(String author, int stars) { }
    record Recommendation(String productId, double score) { }

    record ProductPage(Product product, Inventory inventory,
                       List<Review> reviews, List<Recommendation> recommendations,
                       boolean degraded) { }

    /**
     * A DEDICATED executor. Never use the common ForkJoinPool for blocking IO:
     * it is sized to cores - 1, it is shared process-wide, and blocking in it
     * starves parallel streams and every other CompletableFuture in the JVM.
     */
    private final ExecutorService io = new ThreadPoolExecutor(
        16, 64, 60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(200),
        r -> { Thread t = new Thread(r, "page-io-" + r.hashCode()); t.setDaemon(true); return t; },
        new ThreadPoolExecutor.CallerRunsPolicy());

    public ProductPage load(String productId) {

        // 1. Independent calls start immediately, in parallel.
        CompletableFuture<Product> productF =
            CompletableFuture.supplyAsync(() -> fetchProduct(productId), io)
                .orTimeout(1, TimeUnit.SECONDS);          // REQUIRED - no fallback

        CompletableFuture<List<Review>> reviewsF =
            CompletableFuture.supplyAsync(() -> fetchReviews(productId), io)
                .completeOnTimeout(List.of(), 400, TimeUnit.MILLISECONDS)
                .exceptionally(ex -> List.of());          // optional - degrade silently

        // 2. DEPENDENT: inventory needs the product's warehouse id.
        //    thenCompose, not thenApply - the function returns a future.
        CompletableFuture<Inventory> inventoryF = productF
            .thenCompose(product ->
                CompletableFuture.supplyAsync(() -> fetchInventory(product), io))
            .orTimeout(600, TimeUnit.MILLISECONDS)
            .exceptionally(ex -> new Inventory(productId, 0));

        // 3. OPTIONAL: recommendations must never fail or slow the page.
        CompletableFuture<List<Recommendation>> recommendationsF =
            CompletableFuture.supplyAsync(() -> fetchRecommendations(productId), io)
                .completeOnTimeout(List.of(), 300, TimeUnit.MILLISECONDS)
                .handle((value, ex) -> ex == null ? value : List.<Recommendation>of());

        // 4. Join everything. allOf returns Void, so re-map to collect results.
        return CompletableFuture.allOf(productF, reviewsF, inventoryF, recommendationsF)
            .thenApply(ignored -> {
                List<Review> reviews = reviewsF.join();               // already complete
                List<Recommendation> recommendations = recommendationsF.join();
                return new ProductPage(
                    productF.join(), inventoryF.join(), reviews, recommendations,
                    reviews.isEmpty() || recommendations.isEmpty());
            })
            .join();                                                   // the ONE block
    }

    /** Hedged request: fire at two replicas, take whichever answers first. */
    public Product loadHedged(String productId) {
        CompletableFuture<Product> primary =
            CompletableFuture.supplyAsync(() -> fetchProduct(productId), io);
        CompletableFuture<Product> replica =
            CompletableFuture.supplyAsync(() -> fetchProductFromReplica(productId), io);
        return primary.applyToEither(replica, p -> p).join();
    }

    /** Sequential dependency chain, kept readable. */
    public CompletableFuture<String> checkout(String userId) {
        return CompletableFuture.supplyAsync(() -> loadCart(userId), io)
            .thenCompose(cart -> CompletableFuture.supplyAsync(() -> reserve(cart), io))
            .thenCompose(reservation -> CompletableFuture.supplyAsync(() -> charge(reservation), io))
            .thenApply(payment -> "order-" + payment)
            .whenComplete((result, ex) -> {                // side effect, does not alter the stage
                if (ex != null) System.err.println("checkout failed: " + ex.getMessage());
            })
            .exceptionallyCompose(ex ->                    // Java 12+: async recovery
                CompletableFuture.supplyAsync(() -> "queued-" + userId, io));
    }

    public void shutdown() throws InterruptedException {
        io.shutdown();
        if (!io.awaitTermination(10, TimeUnit.SECONDS)) io.shutdownNow();
    }

    // ---- simulated downstreams ----
    Product fetchProduct(String id)            { sleep(200); return new Product(id, "Widget", 2499); }
    Product fetchProductFromReplica(String id) { sleep(120); return new Product(id, "Widget", 2499); }
    Inventory fetchInventory(Product p)        { sleep(150); return new Inventory(p.id(), 42); }
    List<Review> fetchReviews(String id)       { sleep(250); return List.of(new Review("alice", 5)); }
    List<Recommendation> fetchRecommendations(String id) {
        sleep(900);                            // deliberately slower than its timeout
        return List.of(new Recommendation("other", 0.9));
    }
    String loadCart(String u)     { sleep(80);  return "cart-" + u; }
    String reserve(String cart)   { sleep(80);  return "res-" + cart; }
    String charge(String res)     { sleep(120); return "pay-" + res; }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) throws Exception {
        ProductPageAggregator aggregator = new ProductPageAggregator();

        long t0 = System.currentTimeMillis();
        ProductPage page = aggregator.load("p-1");
        System.out.println("loaded in " + (System.currentTimeMillis() - t0) + "ms");
        System.out.println(page);

        /*
         * Sequential: 200 + 150 + 250 + 900 = 1500ms
         * Parallel:   max(200 + 150, 250, 300 timeout) = ~350ms
         * and recommendations degrade to an empty list instead of adding 900ms.
         */

        System.out.println("hedged: " + aggregator.loadHedged("p-2"));
        System.out.println("checkout: " + aggregator.checkout("u-1").join());
        aggregator.shutdown();
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Four things are being assessed. **`thenCompose` vs `thenApply`** is the single most common mistake — `thenApply` with a function returning a future gives you a nested `CompletableFuture<CompletableFuture<T>>` that silently never resolves the way you expect. **Executor choice**: using the common ForkJoinPool for blocking IO is a real production incident waiting to happen, because it is sized to `cores - 1` and shared with every parallel stream in the JVM. **Timeout granularity**: the required call gets `orTimeout` (fail fast), optional calls get `completeOnTimeout` (degrade), which is the difference between a page that fails and a page that renders with a missing carousel. **One block, at the end**: `join()` exactly once, after `allOf`, so the inner `join()` calls cannot block. Bonus material if you have time: hedged requests with `applyToEither`, and `StructuredTaskScope` as the Java 21 successor that makes cancellation automatic.",
    relatedQuestionIds: ["b096", "b095", "b098"],
  },
  {
    id: "p28",
    topic: "multithreading",
    title: "Size and instrument a thread pool correctly",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "A service using `Executors.newFixedThreadPool(200)` runs out of memory under load. Replace it with a correctly-sized, bounded, instrumented pool and justify every number.",
    tasks: [
      "Explain exactly why `newFixedThreadPool` is dangerous.",
      "Derive the pool size for a CPU-bound and an IO-bound workload.",
      "Configure a bounded queue and a rejection policy with backpressure.",
      "Publish the metrics that tell you it is misconfigured before users do.",
    ],
    hints: [
      "The factory methods use an unbounded `LinkedBlockingQueue`, which makes `maximumPoolSize` dead configuration.",
      "Little's law: concurrency = throughput × latency.",
      "`CallerRunsPolicy` makes the submitter do the work, which naturally throttles the producer.",
    ],
    solution: `import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.binder.jvm.ExecutorServiceMetrics;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class PoolSizing {

    /*
     * =============================================================
     * WHY Executors.newFixedThreadPool(200) IS DANGEROUS
     * =============================================================
     *   public static ExecutorService newFixedThreadPool(int n) {
     *       return new ThreadPoolExecutor(n, n, 0L, MILLISECONDS,
     *                                     new LinkedBlockingQueue<Runnable>());
     *   }                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^
     *                                      UNBOUNDED (Integer.MAX_VALUE)
     *
     * Consequences:
     *   1. The queue grows without limit -> OutOfMemoryError under overload.
     *      Each queued task retains its whole object graph.
     *   2. maximumPoolSize is DEAD configuration: the pool only grows past
     *      core when the queue is FULL, and it never fills.
     *   3. No backpressure: the producer never learns the consumer is behind,
     *      so latency grows unbounded while throughput stays flat.
     *   4. 200 platform threads = ~200MB of reserved stack.
     *
     * Same trap: newCachedThreadPool (unbounded THREADS via SynchronousQueue)
     * and newSingleThreadExecutor (unbounded queue).
     */

    static ThreadFactory named(String prefix) {
        AtomicInteger seq = new AtomicInteger(1);
        return r -> {
            Thread t = new Thread(r, prefix + "-" + seq.getAndIncrement());
            t.setUncaughtExceptionHandler((thread, ex) ->
                System.err.println("uncaught in " + thread.getName() + ": " + ex));
            return t;
        };
    }

    /* =============================================================
     * CPU-BOUND: cores + 1
     * =============================================================
     * The +1 keeps a thread ready when another takes a page fault. More
     * threads than cores only adds context switching.
     */
    static ThreadPoolExecutor cpuBoundPool() {
        int cores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cores + 1, cores + 1,
            0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(1_000),          // BOUNDED
            named("cpu"),
            new ThreadPoolExecutor.CallerRunsPolicy());
    }

    /* =============================================================
     * IO-BOUND: cores x (1 + waitTime / serviceTime)
     * =============================================================
     * Measured: 8 cores, 190ms waiting on the network, 10ms of CPU.
     *   8 x (1 + 190/10) = 8 x 20 = 160 threads
     *
     * Cross-check with Little's law:
     *   L = lambda x W = 500 req/s x 0.200s = 100 concurrent requests
     * So 160 has comfortable headroom; 200 was not absurd, the UNBOUNDED
     * QUEUE was the actual bug.
     */
    static ThreadPoolExecutor ioBoundPool(double waitMs, double cpuMs,
                                          int queueCapacity) {
        int cores = Runtime.getRuntime().availableProcessors();
        int size = (int) Math.ceil(cores * (1 + waitMs / cpuMs));
        return new ThreadPoolExecutor(
            size, size,
            60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(queueCapacity),
            named("io"),
            new ThreadPoolExecutor.CallerRunsPolicy());   // backpressure
    }

    /* =============================================================
     * REJECTION POLICIES
     * ============================================================= */
    static void rejectionPolicies() {
        /*
         * AbortPolicy (default)  throws RejectedExecutionException.
         *                        Correct when the caller can retry or fail.
         * CallerRunsPolicy       the SUBMITTING thread runs the task. This is
         *                        natural backpressure: the producer slows down
         *                        because it is busy doing the work. Usually the
         *                        right choice for a web tier.
         * DiscardPolicy          silently drops. Almost never acceptable.
         * DiscardOldestPolicy    drops the head of the queue. Only for
         *                        "latest value wins" telemetry.
         * Custom                 record a metric, then shed or spill to disk.
         */
    }

    static RejectedExecutionHandler instrumentedRejection(MeterRegistry registry) {
        Counter rejected = registry.counter("pool.rejected");
        ThreadPoolExecutor.CallerRunsPolicy fallback =
            new ThreadPoolExecutor.CallerRunsPolicy();
        return (task, executor) -> {
            rejected.increment();
            if (executor.isShutdown()) throw new RejectedExecutionException("shutting down");
            fallback.rejectedExecution(task, executor);
        };
    }

    /* =============================================================
     * INSTRUMENTATION - the part people forget
     * ============================================================= */
    static ExecutorService instrumented(MeterRegistry registry, ThreadPoolExecutor pool,
                                        String name) {
        // Micrometer binds active/queued/completed/duration automatically.
        ExecutorService monitored = ExecutorServiceMetrics.monitor(registry, pool, name);

        // The leading indicator: queue depth. If it is ever non-zero for long,
        // you are under-provisioned. Alert on it BEFORE latency moves.
        Gauge.builder("pool.queue.size", pool, p -> p.getQueue().size())
             .tag("pool", name).register(registry);
        Gauge.builder("pool.queue.utilisation", pool,
                p -> (double) p.getQueue().size()
                    / (p.getQueue().size() + p.getQueue().remainingCapacity()))
             .tag("pool", name).register(registry);
        Gauge.builder("pool.active.ratio", pool,
                p -> (double) p.getActiveCount() / p.getMaximumPoolSize())
             .tag("pool", name).register(registry);
        return monitored;
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        ThreadPoolExecutor pool = ioBoundPool(190, 10, 500);
        System.out.println("io pool size = " + pool.getCorePoolSize());

        for (int i = 0; i < 1_000; i++) {
            pool.execute(() -> {
                try { Thread.sleep(200); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        for (int i = 0; i < 5; i++) {
            System.out.printf("active=%3d/%3d queue=%4d completed=%,8d largest=%3d%n",
                pool.getActiveCount(), pool.getMaximumPoolSize(),
                pool.getQueue().size(), pool.getCompletedTaskCount(),
                pool.getLargestPoolSize());
            Thread.sleep(400);
        }

        // Two-phase shutdown.
        pool.shutdown();
        if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
            System.out.println("forcing: " + pool.shutdownNow().size() + " tasks dropped");
        }

        /*
         * ALERT ON THESE
         *   executor.queued            > 0 sustained     -> under-provisioned
         *   executor.active / max      > 0.8             -> approaching saturation
         *   pool.rejected              > 0               -> shedding load
         *   executor.execution p99                       -> tasks slower than expected
         *   hikaricp.connections.pending > 0             -> the DB, not the pool
         *
         * AND CONSIDER VIRTUAL THREADS (Java 21)
         *   Executors.newVirtualThreadPerTaskExecutor()
         *   For IO-bound work this removes the sizing question entirely - but
         *   NOT the downstream limits. You still need a Semaphore or a
         *   connection pool to bound concurrency against the database.
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The heart of this is that the reported bug ('200 threads is too many') is not the actual bug. 200 threads is roughly the right order of magnitude for that workload — the OutOfMemoryError comes from the **unbounded queue** that `newFixedThreadPool` hands you, which also silently makes `maximumPoolSize` meaningless because the pool only grows past core when the queue is full. Be able to derive both sizing formulas (`cores + 1` for CPU-bound, `cores × (1 + wait/service)` for IO-bound) and cross-check with Little's law. Then the two things that most candidates skip: `CallerRunsPolicy` as genuine backpressure rather than a silent drop, and instrumenting **queue depth** as the leading indicator — it moves before latency does, which is what lets you fix the problem before users notice. Closing with 'and on Java 21 I would evaluate virtual threads, which remove the thread limit but not the connection-pool limit' shows current knowledge.",
    relatedQuestionIds: ["b095", "b103", "b106"],
  },
  {
    id: "p29",
    topic: "multithreading",
    title: "Migrate a blocking endpoint to virtual threads",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "An endpoint makes three sequential downstream calls totalling 300 ms. At 200 Tomcat threads the service caps out around 660 req/s and then queues.\n\n" +
      "Migrate it to virtual threads, and identify everything that must change alongside.",
    tasks: [
      "Enable virtual threads in Spring Boot and explain what actually changes.",
      "Find and fix the pinning risks in the existing code.",
      "Explain why the connection pool is still the real limit.",
      "Replace pool-based concurrency limiting with semaphores.",
    ],
    hints: [
      "`spring.threads.virtual.enabled=true` swaps the Tomcat executor for a virtual-thread-per-request one.",
      "A `synchronized` block around blocking IO pins the carrier thread (pre-JDK 24) — `ReentrantLock` does not.",
      "Little's law still applies: 10,000 concurrent requests each needing a connection will exhaust a pool of 20 instantly.",
    ],
    solution: `import org.springframework.boot.autoconfigure.thread.Threading;
import org.springframework.context.annotation.*;
import org.springframework.core.task.*;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

@Configuration
class VirtualThreadConfig {

    /**
     * Boot 3.2+: one property switches the Tomcat executor to
     * virtual-thread-per-request. Every @Async task and @Scheduled job
     * also moves to virtual threads.
     */
    // application.yml:  spring.threads.virtual.enabled: true

    /** Explicit equivalent, if you want control. */
    @Bean
    AsyncTaskExecutor applicationTaskExecutor() {
        return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
    }

    @Bean
    org.springframework.boot.web.embedded.tomcat.TomcatProtocolHandlerCustomizer<?>
            protocolHandlerVirtualThreadExecutorCustomizer() {
        return handler -> handler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    }
}

/* =============================================================
 * PINNING: the thing that silently destroys the benefit
 * ============================================================= */
@Service
class BeforeMigration {

    private final Object cacheLock = new Object();

    /**
     * BROKEN on JDK 21: the virtual thread CANNOT unmount while inside a
     * synchronized block, so the carrier (platform) thread is blocked for the
     * whole 100ms. With only ~8 carriers you are back to 8-way concurrency.
     */
    public String loadPinned(String key) {
        synchronized (cacheLock) {
            return blockingCall(key);        // 100ms of IO, carrier pinned
        }
    }

    String blockingCall(String key) {
        try { Thread.sleep(100); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "value-" + key;
    }
}

@Service
class AfterMigration {

    /** FIX: ReentrantLock is Loom-aware - the virtual thread unmounts cleanly. */
    private final ReentrantLock cacheLock = new ReentrantLock();

    /**
     * The downstream database allows 20 concurrent queries. With a platform
     * pool, the POOL SIZE was the limiter. With virtual threads there is no
     * pool, so the bound must be explicit.
     */
    private final Semaphore databasePermits = new Semaphore(20);
    private final Semaphore inventoryPermits = new Semaphore(50);

    public String load(String key) throws InterruptedException {
        cacheLock.lock();
        try {
            return blockingCall(key);        // unmounts, carrier is released
        } finally { cacheLock.unlock(); }
    }

    /** Straight-line blocking code - readable, debuggable, and now scalable. */
    public String handleRequest(String id) throws InterruptedException {
        String user = withPermit(databasePermits, () -> fetchUser(id));
        String stock = withPermit(inventoryPermits, () -> fetchInventory(id));
        String price = withPermit(inventoryPermits, () -> fetchPrice(id));
        return user + "|" + stock + "|" + price;
    }

    private <T> T withPermit(Semaphore semaphore, Callable<T> action)
            throws InterruptedException {
        if (!semaphore.tryAcquire(2, TimeUnit.SECONDS)) {
            throw new IllegalStateException("downstream saturated");   // shed, do not queue
        }
        try { return action.call(); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw e; }
        catch (Exception e) { throw new RuntimeException(e); }
        finally { semaphore.release(); }
    }

    /** Structured concurrency (preview in 21/22): children die with the scope. */
    // public String handleRequestStructured(String id) throws Exception {
    //     try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    //         var user  = scope.fork(() -> fetchUser(id));
    //         var stock = scope.fork(() -> fetchInventory(id));
    //         var price = scope.fork(() -> fetchPrice(id));
    //         scope.joinUntil(java.time.Instant.now().plusSeconds(2));
    //         scope.throwIfFailed();
    //         return user.get() + "|" + stock.get() + "|" + price.get();
    //     }
    // }

    String fetchUser(String id)      { sleep(100); return "user"; }
    String fetchInventory(String id) { sleep(100); return "stock"; }
    String fetchPrice(String id)     { sleep(100); return "price"; }
    String blockingCall(String key)  { sleep(100); return "v"; }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

@RestController
class ProductController {

    private final AfterMigration service;
    ProductController(AfterMigration service) { this.service = service; }

    /** No reactive types, no callbacks - just blocking code that scales. */
    @GetMapping("/api/products/{id}")
    public String get(@PathVariable String id) throws InterruptedException {
        return service.handleRequest(id);
    }
}

/*
=============================================================
application.yml
=============================================================
spring:
  threads.virtual.enabled: true

  datasource.hikari:
    maximum-pool-size: 30        # <-- STILL THE REAL LIMIT
    connection-timeout: 2000     # fail fast rather than pile up

server:
  tomcat.threads.max: 200        # ignored once virtual threads are on

# Find pinning:
#   -Djdk.tracePinnedThreads=full
#   JFR event: jdk.VirtualThreadPinned

=============================================================
WHAT ACTUALLY CHANGES
=============================================================
BEFORE  200 platform threads, 300ms/request
        Little's law: 200 / 0.300 = 666 req/s, then requests queue.

AFTER   Unlimited virtual threads.
        The new bottleneck is whatever is actually scarce:
          - the connection pool (30 connections / 0.100s = 300 queries/s)
          - downstream service capacity
          - CPU

THE KEY INSIGHT
  Virtual threads remove the THREAD limit. They do not create capacity that
  does not exist. If you do not add explicit bounds, you simply move the
  queue from the Tomcat thread pool to the database connection pool - and
  a 10,000-deep connection queue is far worse than a 200-deep request queue.

CHECKLIST
  [ ] replace synchronized-around-IO with ReentrantLock
  [ ] add Semaphores where the thread pool used to provide the bound
  [ ] verify ThreadLocal usage (millions of threads x per-thread copies)
  [ ] connection pool sized with Little's law, connection-timeout set
  [ ] never pool virtual threads - one per task
  [ ] keep CPU-bound work on a sized platform pool
  [ ] load test to saturation and watch where the new queue forms
*/`,
    solutionLanguage: "java",
    discussion:
      "The trap in this question is treating virtual threads as a free throughput multiplier. The insight that matters is that they remove the *thread* limit and nothing else — if you do not add explicit bounds, all you have done is relocate the queue from Tomcat (where it is visible, bounded and shedding load) to the database connection pool (where 10,000 waiters produce cascading timeouts). So the migration is three things, not one: enable it, eliminate pinning, and re-express every concurrency bound that the pool size was implicitly providing. Pinning is the detail that separates people who have actually run Loom from people who have read about it: `synchronized` around blocking IO holds the carrier thread on JDK 21 (fixed in 24 by JEP 491), `ReentrantLock` does not, and `-Djdk.tracePinnedThreads=full` is how you find it. Mentioning that `ThreadLocal`-heavy code scales badly across millions of threads, and that `ScopedValue` is the intended replacement, is a strong finish.",
    relatedQuestionIds: ["b098", "b103", "b106"],
  },
  {
    id: "p30",
    topic: "multithreading",
    title: "Fix a visibility bug that only appears in production",
    difficulty: "hard",
    estimatedMinutes: 30,
    scenario:
      "A background worker ignores its shutdown flag and spins forever, but only in production with the JIT warmed up. In the debugger it always stops correctly.\n\n" +
      "Explain the mechanism precisely and show every correct fix.",
    tasks: [
      "Explain why the JIT is allowed to hoist the read out of the loop.",
      "Explain why it works in a debugger and under low load.",
      "Fix it four ways and compare them.",
      "Write the happens-before argument for why each fix is correct.",
    ],
    hints: [
      "A non-volatile field read in a loop with no synchronisation can be hoisted into a register — the JLS permits it.",
      "The interpreter re-reads memory every iteration; only C2 performs the hoist, which needs thousands of iterations to trigger.",
      "Any happens-before edge works: volatile, a lock, an atomic, or a blocking queue.",
    ],
    solution: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

public class VisibilityBug {

    /* =============================================================
     * THE BUG
     * ============================================================= */
    static class BrokenWorker implements Runnable {
        private boolean shutdown = false;         // PLAIN field - no barrier

        public void run() {
            long iterations = 0;
            while (!shutdown) {                    // may be hoisted into a register
                iterations++;
            }
            System.out.println("stopped after " + iterations);
        }

        public void shutdown() { shutdown = true; }
    }

    /*
     * WHY IT HANGS
     *
     * There is NO happens-before edge between the writer's "shutdown = true"
     * and the reader's "!shutdown". With no edge, the JMM places no constraint
     * on when (or whether) the write becomes visible.
     *
     * C2 therefore performs a legal optimisation called hoisting / loop-invariant
     * code motion. Because nothing inside the loop can modify 'shutdown' AS FAR
     * AS THIS THREAD CAN TELL, it rewrites:
     *
     *      while (!shutdown) { iterations++; }
     * into
     *      if (!shutdown) { while (true) { iterations++; } }
     *
     * The field is read ONCE, into a register. The write never lands.
     *
     * WHY IT "WORKS" IN A DEBUGGER
     *   - a debugger disables or deoptimises JIT compilation, so the
     *     interpreter re-reads the field from memory every iteration
     *   - under low load the loop may not run hot enough (~10k iterations)
     *     to be C2-compiled at all
     *   - a System.out.println or any synchronized call inside the loop
     *     inserts a barrier as a side effect and accidentally "fixes" it
     *
     * This is why the bug is a production-only Heisenbug.
     */

    /* =============================================================
     * FIX 1: volatile  (cheapest and clearest for a flag)
     * ============================================================= */
    static class VolatileWorker implements Runnable {
        private volatile boolean shutdown = false;
        private long result;                       // plain - but see below

        public void run() {
            long iterations = 0;
            while (!shutdown) iterations++;        // volatile read each time: no hoist
            result = iterations;
        }
        public void shutdown() { shutdown = true; }
        public long result() { return result; }
    }
    /*
     * HAPPENS-BEFORE: a volatile write happens-before every subsequent
     * volatile read of the same field. The write is a RELEASE (everything
     * before it is flushed first); the read is an ACQUIRE (nothing after it
     * is reordered before). So plain fields written BEFORE the volatile write
     * are also visible - which is why 'result' above needs care but the
     * payload pattern below is safe.
     */

    /* =============================================================
     * FIX 2: synchronized  (when other state is guarded too)
     * ============================================================= */
    static class SynchronizedWorker implements Runnable {
        private boolean shutdown = false;

        public void run() {
            long iterations = 0;
            while (!isShutdown()) iterations++;
            System.out.println("stopped after " + iterations);
        }
        private synchronized boolean isShutdown() { return shutdown; }
        public synchronized void shutdown() { shutdown = true; }
    }
    /* HAPPENS-BEFORE: unlocking a monitor happens-before any subsequent lock
     * of the SAME monitor. Note the READ must be synchronized too - a common
     * half-fix is to synchronize only the writer. */

    /* =============================================================
     * FIX 3: AtomicBoolean  (when you also need CAS)
     * ============================================================= */
    static class AtomicWorker implements Runnable {
        private final AtomicBoolean shutdown = new AtomicBoolean();

        public void run() {
            long iterations = 0;
            while (!shutdown.get()) iterations++;
            System.out.println("stopped after " + iterations);
        }
        /** CAS makes shutdown idempotent: only the first caller wins. */
        public boolean shutdown() { return shutdown.compareAndSet(false, true); }
    }

    /* =============================================================
     * FIX 4: interruption  (the idiomatic answer for a worker thread)
     * ============================================================= */
    static class InterruptibleWorker implements Runnable {
        public void run() {
            long iterations = 0;
            // isInterrupted() reads a JVM-internal volatile-like flag.
            while (!Thread.currentThread().isInterrupted()) iterations++;
            System.out.println("stopped after " + iterations);
        }
    }

    /* =============================================================
     * THE PAYLOAD PATTERN: one volatile publishes many plain writes
     * ============================================================= */
    static class SafePublication {
        private int[] data;                        // PLAIN
        private volatile boolean ready;            // the release

        void publish() {
            data = new int[]{1, 2, 3};             // ordered before the volatile write
            ready = true;                          // RELEASE
        }
        int[] consume() {
            if (!ready) return null;               // ACQUIRE
            return data;                           // guaranteed fully initialised
        }
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        System.out.println("--- volatile ---");
        VolatileWorker fixed = new VolatileWorker();
        Thread t = new Thread(fixed, "worker");
        t.start();
        Thread.sleep(1000);
        fixed.shutdown();
        t.join(5000);
        System.out.println("terminated: " + !t.isAlive()
            + " after " + fixed.result() + " iterations");

        System.out.println("\\n--- synchronized ---");
        SynchronizedWorker sync = new SynchronizedWorker();
        Thread t2 = new Thread(sync); t2.start();
        Thread.sleep(200); sync.shutdown(); t2.join(5000);
        System.out.println("terminated: " + !t2.isAlive());

        System.out.println("\\n--- interruption ---");
        Thread t3 = new Thread(new InterruptibleWorker()); t3.start();
        Thread.sleep(200); t3.interrupt(); t3.join(5000);
        System.out.println("terminated: " + !t3.isAlive());

        /*
         * The broken version is deliberately not run here - on a
         * server JVM it hangs forever. To see it:
         *     java -server -XX:-TieredCompilation VisibilityBug
         * and watch one core sit at 100%.
         *
         * DIAGNOSIS IN PRODUCTION
         *   - one core pegged at 100% with no progress
         *   - jstack shows the thread RUNNABLE, always at the same line
         *   - three dumps ten seconds apart show no movement
         *   - jcstress is the tool for asserting these properties in tests
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This is the question that tells an interviewer whether you actually understand the Java Memory Model or have only memorised 'volatile makes it visible'. Three things to get right. **The mechanism**: with no happens-before edge the JIT is *permitted* to hoist the read out of the loop — it is not a bug in the JVM, it is a legal optimisation, and you should be able to write out the transformed loop. **Why it is a Heisenbug**: the debugger deoptimises, low load never reaches the C2 compilation threshold, and adding a `println` inserts an accidental barrier — which is exactly why 'it works on my machine' and why adding logging makes it disappear. **The happens-before argument per fix**: volatile write→read, monitor unlock→lock, and the fact that the *read* must be synchronised too (synchronising only the writer is the classic half-fix). The payload pattern is a good closer: one volatile write publishes an arbitrary number of preceding plain writes, which is the foundation of safe publication and of double-checked locking.",
    relatedQuestionIds: ["b082", "b083", "b088"],
  },
  {
    id: "p31",
    topic: "multithreading",
    title: "Write a rate limiter: token bucket and sliding window",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "Implement two thread-safe rate limiters — a token bucket allowing controlled bursts, and a sliding-window counter — and explain when each is appropriate.\n\n" +
      "They must be correct under heavy concurrency without a global lock.",
    tasks: [
      "Implement a lock-free token bucket with lazy refill.",
      "Implement a sliding-window counter and explain its accuracy trade-off.",
      "Make both correct under 16 concurrent threads.",
      "Explain what changes when the service runs on ten instances.",
    ],
    hints: [
      "Lazy refill beats a background timer: compute the tokens owed from the elapsed time on each request.",
      "Pack tokens and the last-refill timestamp into one object so a single CAS updates both atomically.",
      "A fixed window allows a 2× burst across the boundary; the sliding-window counter weights the previous window.",
    ],
    solution: `import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class RateLimiters {

    /* =============================================================
     * 1. TOKEN BUCKET - lock-free, lazy refill
     * =============================================================
     * Allows a burst up to 'capacity', then settles to the refill rate.
     * This is what most public APIs implement.
     */
    static final class TokenBucket {

        /** Tokens AND the timestamp in one immutable object => one CAS updates both. */
        private record State(double tokens, long lastRefillNanos) { }

        private final double capacity;
        private final double refillPerNano;
        private final AtomicReference<State> state;

        TokenBucket(int capacity, int tokensPerPeriod, Duration period) {
            this.capacity = capacity;
            this.refillPerNano = (double) tokensPerPeriod / period.toNanos();
            this.state = new AtomicReference<>(new State(capacity, System.nanoTime()));
        }

        boolean tryConsume(int permits) {
            while (true) {                               // CAS retry loop
                State current = state.get();
                long now = System.nanoTime();

                // LAZY REFILL: no timer thread, no scheduled task.
                double refilled = Math.min(capacity,
                    current.tokens() + (now - current.lastRefillNanos()) * refillPerNano);

                if (refilled < permits) return false;    // rejected

                State next = new State(refilled - permits, now);
                if (state.compareAndSet(current, next)) return true;
                // CAS failed => another thread won the race; recompute and retry.
            }
        }

        /** How long until 'permits' become available. Drives Retry-After. */
        long nanosUntilAvailable(int permits) {
            State current = state.get();
            long now = System.nanoTime();
            double available = Math.min(capacity,
                current.tokens() + (now - current.lastRefillNanos()) * refillPerNano);
            if (available >= permits) return 0;
            return (long) ((permits - available) / refillPerNano);
        }

        double availableTokens() {
            State current = state.get();
            return Math.min(capacity, current.tokens()
                + (System.nanoTime() - current.lastRefillNanos()) * refillPerNano);
        }
    }

    /* =============================================================
     * 2. SLIDING WINDOW COUNTER
     * =============================================================
     * A fixed window allows a 2x burst at the boundary: 100 requests in the
     * last millisecond of window N plus 100 in the first millisecond of N+1
     * is 200 requests in 2ms while "respecting" a 100/minute limit.
     *
     * The sliding-window COUNTER weights the previous window by how much of
     * it still overlaps the current sliding period. Approximate, but O(1)
     * memory - unlike a sliding-window LOG, which stores every timestamp.
     */
    static final class SlidingWindowCounter {

        private record Window(long index, long count, long previousCount) { }

        private final long limit;
        private final long windowNanos;
        private final AtomicReference<Window> window;

        SlidingWindowCounter(long limit, Duration window) {
            this.limit = limit;
            this.windowNanos = window.toNanos();
            this.window = new AtomicReference<>(new Window(currentIndex(), 0, 0));
        }

        private long currentIndex() { return System.nanoTime() / windowNanos; }

        boolean tryAcquire() {
            while (true) {
                Window current = window.get();
                long index = currentIndex();

                Window rolled = switch ((int) Math.min(2, index - current.index())) {
                    case 0 -> current;                                        // same window
                    case 1 -> new Window(index, 0, current.count());          // rolled once
                    default -> new Window(index, 0, 0);                       // gap: reset
                };

                // Weight the previous window by the remaining overlap.
                double elapsedFraction =
                    (System.nanoTime() % windowNanos) / (double) windowNanos;
                double weighted = rolled.previousCount() * (1 - elapsedFraction)
                                + rolled.count();

                if (weighted >= limit) return false;

                Window next = new Window(rolled.index(), rolled.count() + 1,
                                         rolled.previousCount());
                if (window.compareAndSet(current, next)) return true;
            }
        }
    }

    /* =============================================================
     * 3. PER-KEY LIMITING
     * ============================================================= */
    static final class KeyedRateLimiter {
        private final ConcurrentHashMap<String, TokenBucket> buckets =
            new ConcurrentHashMap<>();
        private final int capacity;
        private final int perPeriod;
        private final Duration period;

        KeyedRateLimiter(int capacity, int perPeriod, Duration period) {
            this.capacity = capacity; this.perPeriod = perPeriod; this.period = period;
        }

        boolean tryConsume(String key) {
            // The mapping function is cheap and allocation-only - safe inside
            // computeIfAbsent. Never do IO here: it runs under the bin lock.
            return buckets.computeIfAbsent(key,
                    k -> new TokenBucket(capacity, perPeriod, period))
                .tryConsume(1);
        }

        /** Without eviction this map grows forever - a real memory leak. */
        void evictIdle() {
            buckets.entrySet().removeIf(e -> e.getValue().availableTokens() >= capacity);
        }
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        // Burst of 10, refilling 5 per second.
        TokenBucket bucket = new TokenBucket(10, 5, Duration.ofSeconds(1));

        System.out.print("initial burst: ");
        for (int i = 0; i < 15; i++) System.out.print(bucket.tryConsume(1) ? "+" : ".");
        System.out.println("   (10 allowed, 5 rejected)");

        Thread.sleep(1000);
        System.out.print("after 1s:      ");
        for (int i = 0; i < 8; i++) System.out.print(bucket.tryConsume(1) ? "+" : ".");
        System.out.println("   (~5 refilled)");

        // Concurrency check: the total allowed must never exceed the capacity.
        TokenBucket strict = new TokenBucket(1000, 1, Duration.ofHours(1));
        int threads = 16;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger allowed = new AtomicInteger();

        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                try { start.await(); } catch (InterruptedException e) { return; }
                for (int i = 0; i < 1_000; i++) if (strict.tryConsume(1)) allowed.incrementAndGet();
                done.countDown();
            });
        }
        start.countDown();
        done.await();
        pool.shutdown();
        System.out.println("\\n16 threads x 1000 attempts, capacity 1000 -> allowed "
            + allowed.get() + " (must be exactly 1000)");

        SlidingWindowCounter sliding =
            new SlidingWindowCounter(100, Duration.ofSeconds(1));
        int accepted = 0;
        for (int i = 0; i < 200; i++) if (sliding.tryAcquire()) accepted++;
        System.out.println("sliding window accepted " + accepted + "/200");

        /*
         * =============================================================
         * WHAT CHANGES ACROSS TEN INSTANCES
         * =============================================================
         * Everything above is PER-JVM. Ten instances means ten buckets and
         * therefore ten times the intended limit.
         *
         * Options:
         *   1. Divide the limit by the instance count. Simple, but wrong
         *      during scaling events and unfair under uneven load balancing.
         *   2. Centralise in Redis. Bucket4j has a Redis backend; or use a
         *      Lua script so the read-modify-write is atomic server-side.
         *      Cost: a network round trip per request (~1ms).
         *   3. Enforce at the edge - API gateway, nginx, Cloudflare - which
         *      is where it belongs for coarse limits.
         *   4. Hybrid: a generous local limiter to shed obvious abuse
         *      without a network hop, plus a precise distributed one.
         *
         * ALWAYS return 429 with Retry-After, and expose
         * X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset.
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Two design decisions carry this answer. **Packing state into one immutable object** so that a single CAS updates both the token count and the timestamp — if you keep them in separate atomics you have a torn read and the limiter leaks permits under contention. **Lazy refill** instead of a scheduled timer: computing the tokens owed from elapsed time means no background thread, no drift, and it scales to millions of keys. On the algorithms, be able to state the trade-off crisply: fixed window is cheapest but allows a 2× boundary burst; sliding-window *log* is exact but stores every timestamp; sliding-window *counter* is O(1) memory and approximates well by weighting the previous window; token bucket is the only one that models burst plus sustained rate, which is why public APIs use it. The distributed question is where most candidates stop too early — ten instances means ten times the limit, and naming Redis with a Lua script (for atomicity), gateway-level enforcement, and the hybrid local-plus-distributed pattern is the complete answer.",
    relatedQuestionIds: ["b087", "b091", "b124"],
  },

  /* ================================================================ */
  /* Spring Security                                                   */
  /* ================================================================ */
  {
    id: "p32",
    topic: "spring-security",
    title: "Configure a dual filter chain: stateless API plus session UI",
    difficulty: "medium",
    estimatedMinutes: 35,
    scenario:
      "One application serves a JSON API for a mobile client (bearer tokens, stateless) and a server-rendered admin UI (form login, sessions, CSRF).\n\n" +
      "Configure both correctly in one Spring Boot 3 application.",
    tasks: [
      "Write two `SecurityFilterChain` beans with the right `securityMatcher` and order.",
      "Disable CSRF for the API and justify it; keep it on for the UI.",
      "Return JSON errors for the API and redirects for the UI.",
      "Prove with tests that each chain behaves independently.",
    ],
    hints: [
      "`FilterChainProxy` picks the FIRST chain whose matcher accepts the request — order is significant.",
      "Disabling CSRF is only safe when no browser-managed credential is used.",
      "The `@Order` value decides which chain wins when matchers overlap.",
    ],
    solution: `import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.http.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.net.URI;

@Configuration
@EnableWebSecurity
public class DualChainSecurityConfig {

    /**
     * CHAIN 0 - static assets and health. No security filters at all.
     * Faster than permitAll(), which still walks the whole chain.
     */
    @Bean
    @Order(0)
    SecurityFilterChain publicChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/actuator/health/**", "/css/**", "/js/**", "/favicon.ico")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .securityContext(ctx -> ctx.disable())
            .requestCache(cache -> cache.disable())
            .build();
    }

    /**
     * CHAIN 1 - the JSON API. Stateless, bearer tokens, JSON errors.
     *
     * CSRF is safe to disable here BECAUSE authentication is the
     * Authorization header, which a browser never attaches automatically.
     * An attacker's page cannot make the browser send a header it does not know.
     */
    @Bean
    @Order(1)
    SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter)
            throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalog/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            // JSON, never a redirect - a mobile client cannot follow one usefully.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                    response.setHeader(HttpHeaders.WWW_AUTHENTICATE,
                        "Bearer error=\\"invalid_token\\"");
                    response.getWriter().write("""
                        {"type":"https://api.example.com/errors/unauthenticated",
                         "title":"Authentication required","status":401}""");
                })
                .accessDeniedHandler((request, response, deniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                    response.getWriter().write("""
                        {"type":"https://api.example.com/errors/forbidden",
                         "title":"Access denied","status":403}""");
                }))
            .headers(headers -> headers
                .cacheControl(Customizer.withDefaults())
                .frameOptions(frame -> frame.deny()))
            .build();
    }

    /**
     * CHAIN 2 - the browser admin UI. Sessions, form login, CSRF ON.
     * No securityMatcher, so it is the catch-all - and it MUST be last.
     */
    @Bean
    @Order(2)
    SecurityFilterChain uiChain(HttpSecurity http) throws Exception {
        return http
            // CSRF stays ON: the session cookie IS attached automatically.
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/webhooks/**"))   // signature-authenticated
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/error").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/admin/dashboard", false)   // honour the saved request
                .failureUrl("/login?error")
                .permitAll())
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "POST"))
                .logoutSuccessUrl("/login?logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID"))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(fixation -> fixation.changeSessionId())
                .invalidSessionUrl("/login?expired")
                .maximumSessions(1).maxSessionsPreventsLogin(false))
            .rememberMe(remember -> remember
                .key("a-stable-secret-from-configuration")
                .tokenValiditySeconds(14 * 24 * 3600)
                .useSecureCookie(true))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; script-src 'self'; object-src 'none'"))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true).maxAgeInSeconds(31_536_000))
                .frameOptions(frame -> frame.deny()))
            .build();
    }

    @Bean
    org.springframework.security.web.session.HttpSessionEventPublisher
            httpSessionEventPublisher() {
        // REQUIRED for maximumSessions to work - without it the registry
        // never learns about destroyed sessions.
        return new org.springframework.security.web.session.HttpSessionEventPublisher();
    }
}

/* =================================================================
 * THE TESTS - prove the chains are independent
 * ================================================================= */
/*
@SpringBootTest
@AutoConfigureMockMvc
class DualChainTest {

    @Autowired MockMvc mvc;

    @Test void apiReturnsJson401ForAnonymous() throws Exception {
        mvc.perform(get("/api/orders"))
           .andExpect(status().isUnauthorized())
           .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
           .andExpect(header().string("WWW-Authenticate",
               containsString("invalid_token")));
    }

    @Test void uiRedirectsToLoginForAnonymous() throws Exception {
        mvc.perform(get("/admin/dashboard"))
           .andExpect(status().is3xxRedirection())
           .andExpect(redirectedUrlPattern("**/login"));
    }

    @Test void apiPostNeedsNoCsrfToken() throws Exception {
        mvc.perform(post("/api/orders").with(jwt())
                .contentType(APPLICATION_JSON).content("{}"))
           .andExpect(status().isCreated());            // no .with(csrf())
    }

    @Test void uiPostWithoutCsrfTokenIsRejected() throws Exception {
        mvc.perform(post("/admin/settings").with(user("a").roles("ADMIN"))
                .param("key", "value"))
           .andExpect(status().isForbidden());          // CSRF is enforced
    }

    @Test void apiCreatesNoSession() throws Exception {
        MvcResult result = mvc.perform(get("/api/catalog/1")).andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
    }

    @ParameterizedTest
    @CsvSource({
        "/api/admin/stats, USER,  403",
        "/api/admin/stats, ADMIN, 200",
        "/admin/dashboard, USER,  403",
        "/admin/dashboard, ADMIN, 200"
    })
    void authorizationMatrix(String path, String role, int expected) throws Exception {
        mvc.perform(get(path).with(user("u").roles(role)))
           .andExpect(status().is(expected));
    }
}
*/`,
    solutionLanguage: "java",
    discussion:
      "The architectural point is that `FilterChainProxy` selects the **first** chain whose `RequestMatcher` accepts the request and runs only that chain — so the catch-all UI chain must be last, and a broad matcher placed early silently shadows everything after it. That single fact explains most 'my security config is being ignored' bugs. The CSRF reasoning must be stated as a principle rather than a habit: disable it only when no browser-managed credential is in play, because the browser will not automatically attach an `Authorization` header an attacker's page does not know. The error-handling split matters in practice too — a mobile client cannot do anything useful with a 302 to a login page, so the API chain needs its own `AuthenticationEntryPoint`. Finally, the `HttpSessionEventPublisher` bean is a genuine gotcha: without it `maximumSessions` silently never expires anything.",
    relatedQuestionIds: ["b107", "b112", "b114", "b116"],
  },
  {
    id: "p33",
    topic: "spring-security",
    title: "Enforce multi-tenant data isolation",
    difficulty: "hard",
    estimatedMinutes: 40,
    scenario:
      "A SaaS application leaked one tenant's invoices to another. The controller checked the tenant id from the URL against the token, but one endpoint forgot.\n\n" +
      "Design isolation that cannot be forgotten.",
    tasks: [
      "Explain why a per-controller check is the wrong layer.",
      "Resolve the tenant from the token into a request-scoped context.",
      "Enforce the filter in the query itself with a Hibernate filter.",
      "Add a defence-in-depth test that fails if any repository method leaks.",
    ],
    hints: [
      "Any control that must be remembered on every endpoint will eventually be forgotten.",
      "The tenant must come from the verified token, never from a path variable or a header.",
      "A Hibernate `@Filter` applies to every query for that entity, including lazy collection loads.",
    ],
    solution: `import jakarta.persistence.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.hibernate.Session;
import org.hibernate.annotations.*;
import org.springframework.context.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/* =============================================================
 * 1. THE BUG - a check that must be remembered
 * ============================================================= */
/*
@GetMapping("/api/tenants/{tenantId}/invoices/{id}")
Invoice get(@PathVariable String tenantId, @PathVariable Long id, Jwt jwt) {
    if (!tenantId.equals(jwt.getClaim("tenant_id"))) throw new AccessDeniedException();
    return repository.findById(id).orElseThrow();
}

Two problems:
  a) one endpoint out of forty forgets the check -> full cross-tenant read
  b) even WITH the check, findById(id) is not scoped: the id alone identifies
     the row, so a valid tenant check plus another tenant's id still leaks.
*/

/* =============================================================
 * 2. TENANT CONTEXT - resolved once, from the TOKEN only
 * ============================================================= */
final class TenantContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    static void set(String tenantId) { CURRENT.set(tenantId); }
    static String require() {
        String tenantId = CURRENT.get();
        if (tenantId == null) throw new IllegalStateException("no tenant in context");
        return tenantId;
    }
    static void clear() { CURRENT.remove(); }      // MUST be called, or it leaks
}

@Component
class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                String tenantId = jwt.getClaimAsString("tenant_id");
                if (tenantId == null || tenantId.isBlank()) {
                    response.sendError(403, "token has no tenant");
                    return;
                }
                // FROM THE VERIFIED TOKEN. Never from a path variable, a query
                // parameter or an X-Tenant-Id header - all client-controlled.
                TenantContext.set(tenantId);
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();      // pooled threads: without this the next
        }                                // request inherits the previous tenant
    }
}

/* =============================================================
 * 3. ENFORCE IT IN THE QUERY - Hibernate filter
 * ============================================================= */
@Entity
@Table(name = "invoice")
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Invoice {
    @Id @GeneratedValue Long id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    String tenantId;

    long amountCents;

    /** Belt and braces: stamp the tenant on write, from the context. */
    @PrePersist
    void assignTenant() {
        if (tenantId == null) tenantId = TenantContext.require();
    }
}

/**
 * Enable the filter for every session. Because it is applied by Hibernate at
 * SQL generation time, it covers findById, findAll, derived queries, JPQL
 * AND lazy collection loads. There is no way to forget it.
 */
@Component
class TenantFilterActivator {

    @PersistenceContext
    private EntityManager entityManager;

    @org.springframework.transaction.event.TransactionalEventListener(
        phase = org.springframework.transaction.event.TransactionPhase.BEFORE_COMMIT)
    void noop() { }

    /** Called from an aspect or an EntityManager-creating interceptor. */
    void enable() {
        entityManager.unwrap(Session.class)
            .enableFilter("tenantFilter")
            .setParameter("tenantId", TenantContext.require());
    }
}

/** Activate on every transaction via an aspect. */
@org.aspectj.lang.annotation.Aspect
@Component
class TenantFilterAspect {

    @PersistenceContext private EntityManager entityManager;

    @org.aspectj.lang.annotation.Before(
        "@annotation(org.springframework.transaction.annotation.Transactional)")
    public void enableTenantFilter() {
        String tenantId = TenantContext.require();
        entityManager.unwrap(Session.class)
            .enableFilter("tenantFilter")
            .setParameter("tenantId", tenantId);
    }
}

/* =============================================================
 * 4. THE REPOSITORY NEEDS NO TENANT ARGUMENT AT ALL
 * ============================================================= */
interface InvoiceRepository
        extends org.springframework.data.jpa.repository.JpaRepository<Invoice, Long> {
    // Every one of these is automatically scoped by the Hibernate filter.
    java.util.List<Invoice> findByAmountCentsGreaterThan(long amount);
}

@Service
class InvoiceService {
    private final InvoiceRepository repository;
    InvoiceService(InvoiceRepository repository) { this.repository = repository; }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Invoice get(Long id) {
        // Another tenant's id now returns EMPTY, not a leaked row.
        return repository.findById(id)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND));
        // 404, not 403 - do not confirm that the resource exists elsewhere.
    }
}

/* =============================================================
 * 5. THE TEST THAT CATCHES A LEAK
 * ============================================================= */
/*
@SpringBootTest
@Transactional
class TenantIsolationTest {

    @Autowired InvoiceRepository repository;
    @Autowired InvoiceService service;

    @Test
    void cannotReadAnotherTenantsInvoice() {
        TenantContext.set("tenant-a");
        Invoice a = repository.save(newInvoice(1000));

        TenantContext.set("tenant-b");
        Invoice b = repository.save(newInvoice(2000));

        // As tenant-b, tenant-a's id must be invisible.
        assertThatThrownBy(() -> service.get(a.id))
            .isInstanceOf(ResponseStatusException.class);

        assertThat(repository.findAll()).containsExactly(b);
        assertThat(repository.count()).isEqualTo(1);
    }

    // Reflectively exercise EVERY repository method with two tenants and
    // assert nothing crosses. This is the test that survives new endpoints.
    @TestFactory
    Stream<DynamicTest> noRepositoryMethodLeaks() {
        return Arrays.stream(InvoiceRepository.class.getMethods())
            .filter(m -> m.getParameterCount() == 0)
            .map(m -> DynamicTest.dynamicTest(m.getName(), () -> {
                TenantContext.set("tenant-a");
                Object result = m.invoke(repository);
                assertNoTenantBData(result);
            }));
    }
}
*/

/*
=============================================================
DEFENCE IN DEPTH - the layers, strongest first
=============================================================
1. SEPARATE DATABASES per tenant       strongest, most expensive
2. POSTGRES ROW-LEVEL SECURITY         enforced by the database itself;
                                       even a raw SQL bug cannot bypass it
     CREATE POLICY tenant_isolation ON invoice
       USING (tenant_id = current_setting('app.tenant_id'));
     ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
3. HIBERNATE FILTER (above)            covers every JPA query automatically
4. A MANDATORY tenantId PARAMETER      compiler-enforced, but bypassable by
   on every repository method          a new method that omits it
5. A CHECK IN THE CONTROLLER           the layer that failed - always will

And: a separate database USER per tenant where feasible, tenant id in every
log line, and an alert on any query that returns rows for more than one tenant.
*/`,
    solutionLanguage: "java",
    discussion:
      "The framing is what matters here: **any security control that must be remembered on every endpoint will eventually be forgotten**, so the fix is architectural rather than a code review checklist. Three specific points earn credit. The tenant must be derived from the **verified token**, never from a path variable or an `X-Tenant-Id` header, because those are attacker-controlled — this is the same class of bug as trusting a gateway-set header. The enforcement must live at the **query** layer: a Hibernate `@Filter` (or better, PostgreSQL row-level security) applies to `findById`, derived queries, JPQL and lazy collection loads alike, so a new repository method is safe by construction. And the `ThreadLocal` must be cleared in a `finally`, because on a pooled thread a leaked tenant context means the *next* request runs as the previous tenant — a leak that is worse than the original bug. Returning 404 rather than 403 for another tenant's id is a nice detail: 403 confirms the resource exists.",
    relatedQuestionIds: ["b120", "b122", "b109"],
  },
  {
    id: "p34",
    topic: "spring-security",
    title: "Implement method security with a permission evaluator",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Authorization rules have grown into unreadable SpEL strings such as `hasRole('ADMIN') or (hasRole('MANAGER') and #doc.ownerId == authentication.name and #doc.amount < 10000)`.\n\n" +
      "Refactor to something testable.",
    tasks: [
      "Move the logic into a named bean referenced from SpEL.",
      "Implement a `PermissionEvaluator` for `hasPermission(...)`.",
      "Add a `RoleHierarchy` and wire it into both web and method security.",
      "Write unit tests for the permission logic with no Spring context.",
    ],
    hints: [
      "`@beanName.method(#arg, authentication)` is valid SpEL and gives you a plain, testable Java method.",
      "`PermissionEvaluator` powers `hasPermission(targetObject, 'permission')`.",
      "A `RoleHierarchy` bean must be wired into *two* expression handlers — web and method — or half your rules ignore it.",
    ],
    solution: `import org.springframework.context.annotation.*;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.*;
import org.springframework.security.access.prepost.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.*;

import java.io.Serializable;
import java.util.*;

/* =============================================================
 * 1. THE PROBLEM
 * ============================================================= */
/*
@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and " +
              "#doc.ownerId == authentication.name and #doc.amount < 10000)")
public void approve(Document doc) { }

  - not unit-testable
  - no compiler checking: rename ownerId and this silently returns false
  - no IDE support, no refactoring support
  - duplicated across a dozen methods, and they drift
*/

/* =============================================================
 * 2. FIX A - delegate to a named bean
 * ============================================================= */
@Component("documentRules")
public class DocumentRules {

    private static final long MANAGER_APPROVAL_LIMIT = 10_000L;

    /** Plain Java. Unit-testable with no Spring context at all. */
    public boolean canApprove(Document document, Authentication authentication) {
        if (document == null || authentication == null) return false;
        if (hasRole(authentication, "ROLE_ADMIN")) return true;
        return hasRole(authentication, "ROLE_MANAGER")
            && document.ownerId().equals(authentication.getName())
            && document.amountCents() < MANAGER_APPROVAL_LIMIT;
    }

    public boolean canEdit(Document document, Authentication authentication) {
        if (document == null || authentication == null) return false;
        if (document.status() == Document.Status.APPROVED) {
            return hasRole(authentication, "ROLE_ADMIN");      // locked once approved
        }
        return hasRole(authentication, "ROLE_ADMIN")
            || document.ownerId().equals(authentication.getName());
    }

    public boolean canDelete(Document document, Authentication authentication) {
        return hasRole(authentication, "ROLE_ADMIN")
            && document.status() == Document.Status.DRAFT;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(role));
    }
}

@Service
class DocumentService {

    /** Readable, and the rule itself is tested independently. */
    @PreAuthorize("@documentRules.canApprove(#document, authentication)")
    public void approve(Document document) { }

    @PreAuthorize("@documentRules.canEdit(#document, authentication)")
    public void edit(Document document, String content) { }

    /** Or the PermissionEvaluator form. */
    @PreAuthorize("hasPermission(#document, 'delete')")
    public void delete(Document document) { }

    /** Load-then-check, when only the id is available. */
    @PreAuthorize("hasPermission(#id, 'com.example.Document', 'read')")
    public Document find(Long id) { return null; }
}

/* =============================================================
 * 3. FIX B - a PermissionEvaluator
 * ============================================================= */
@Component
class DocumentPermissionEvaluator implements PermissionEvaluator {

    private final DocumentRules rules;
    private final DocumentRepository repository;

    DocumentPermissionEvaluator(DocumentRules rules, DocumentRepository repository) {
        this.rules = rules; this.repository = repository;
    }

    /** hasPermission(#document, 'delete') */
    @Override
    public boolean hasPermission(Authentication authentication,
                                 Object target, Object permission) {
        if (!(target instanceof Document document)) return false;
        return switch (String.valueOf(permission)) {
            case "read"    -> true;
            case "edit"    -> rules.canEdit(document, authentication);
            case "approve" -> rules.canApprove(document, authentication);
            case "delete"  -> rules.canDelete(document, authentication);
            default        -> false;
        };
    }

    /** hasPermission(#id, 'com.example.Document', 'read') */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                 String targetType, Object permission) {
        if (!Document.class.getName().equals(targetType)) return false;
        return repository.findById((Long) targetId)
            .map(document -> hasPermission(authentication, document, permission))
            .orElse(false);
    }
}

/* =============================================================
 * 4. WIRING - including the RoleHierarchy in BOTH places
 * ============================================================= */
@Configuration
@EnableMethodSecurity
class MethodSecurityConfig {

    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
            .role("ADMIN").implies("MANAGER")
            .role("MANAGER").implies("USER")
            .build();
    }

    /** METHOD security expression handler. */
    @Bean
    static DefaultMethodSecurityExpressionHandler methodSecurityExpressionHandler(
            RoleHierarchy roleHierarchy, DocumentPermissionEvaluator evaluator) {
        DefaultMethodSecurityExpressionHandler handler =
            new DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        handler.setPermissionEvaluator(evaluator);
        return handler;
    }

    /**
     * WEB security expression handler. Forgetting this half is the classic
     * bug: @PreAuthorize honours the hierarchy but the URL rules do not.
     */
    @Bean
    static org.springframework.security.web.access.expression
            .DefaultHttpSecurityExpressionHandler webSecurityExpressionHandler(
                RoleHierarchy roleHierarchy) {
        var handler = new org.springframework.security.web.access.expression
            .DefaultHttpSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }
}

record Document(Long id, String ownerId, long amountCents, Document.Status status) {
    enum Status { DRAFT, SUBMITTED, APPROVED }
}

interface DocumentRepository {
    Optional<Document> findById(Long id);
}

/* =============================================================
 * 5. THE TESTS - no Spring context needed
 * ============================================================= */
/*
class DocumentRulesTest {

    private final DocumentRules rules = new DocumentRules();

    private Authentication auth(String name, String... roles) {
        return new UsernamePasswordAuthenticationToken(name, null,
            Arrays.stream(roles).map(SimpleGrantedAuthority::new).toList());
    }

    @Test void adminCanApproveAnything() {
        assertThat(rules.canApprove(
            new Document(1L, "bob", 999_999, DRAFT), auth("alice", "ROLE_ADMIN"))).isTrue();
    }

    @Test void managerCanApproveOwnDocumentUnderLimit() {
        assertThat(rules.canApprove(
            new Document(1L, "alice", 9_999, DRAFT), auth("alice", "ROLE_MANAGER"))).isTrue();
    }

    @Test void managerCannotApproveOverLimit() {
        assertThat(rules.canApprove(
            new Document(1L, "alice", 10_000, DRAFT), auth("alice", "ROLE_MANAGER"))).isFalse();
    }

    @Test void managerCannotApproveSomeoneElsesDocument() {
        assertThat(rules.canApprove(
            new Document(1L, "bob", 100, DRAFT), auth("alice", "ROLE_MANAGER"))).isFalse();
    }

    @ParameterizedTest
    @CsvSource({ "ROLE_USER,false", "ROLE_MANAGER,true", "ROLE_ADMIN,true" })
    void approvalByRole(String role, boolean expected) {
        assertThat(rules.canApprove(new Document(1L, "alice", 100, DRAFT),
            auth("alice", role))).isEqualTo(expected);
    }
}

// And an integration test that the annotation is actually wired:
@SpringBootTest
class DocumentServiceSecurityTest {
    @Autowired DocumentService service;

    @Test @WithMockUser(username = "alice", roles = "USER")
    void userCannotApprove() {
        assertThatThrownBy(() -> service.approve(new Document(1L, "alice", 100, DRAFT)))
            .isInstanceOf(AccessDeniedException.class);
    }
}
*/`,
    solutionLanguage: "java",
    discussion:
      "The core argument is that a long SpEL string is untyped, untested code hiding in an annotation — rename a field and it silently evaluates to false, which fails *open* in some rule shapes. Moving the logic into `@documentRules.canApprove(#document, authentication)` costs nothing at runtime and buys you compiler checking, IDE navigation and plain JUnit tests with no Spring context. Two details are worth volunteering. The `RoleHierarchy` must be registered with **both** the method and the web expression handlers; wiring only one is extremely common and produces the confusing symptom where `@PreAuthorize` respects the hierarchy but URL rules do not. And remember method security is proxy-based, so a self-invoked call is unchecked — which is why the service-layer integration test matters in addition to the unit tests of the rule.",
    relatedQuestionIds: ["b113", "b120", "b121"],
  },
  {
    id: "p35",
    topic: "spring-security",
    title: "Add brute-force protection with lockout and metrics",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Logs show 40,000 failed logins overnight from rotating IPs against a list of known usernames — credential stuffing.\n\n" +
      "Add layered protection without creating a denial-of-service vector against real users.",
    tasks: [
      "Track failures per username AND per IP, and explain why both.",
      "Apply exponential backoff rather than a permanent lock.",
      "Surface the lock through `UserDetails` so Spring raises `LockedException`.",
      "Emit metrics and explain the alert you would configure.",
    ],
    hints: [
      "Locking purely by username lets an attacker lock out every real user on purpose.",
      "`AuthenticationFailureBadCredentialsEvent` and `AuthenticationSuccessEvent` give you the hooks.",
      "Keep the response identical for locked, unknown and wrong-password so nothing is enumerable.",
    ],
    solution: `import io.micrometer.core.instrument.*;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.event.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;

/* =============================================================
 * 1. THE ATTEMPT STORE - per username AND per IP
 * ============================================================= */
@Service
class LoginAttemptService {

    private static final int USER_THRESHOLD = 5;
    private static final int IP_THRESHOLD = 20;          // higher: NAT, offices
    private static final Duration MAX_LOCK = Duration.ofMinutes(15);

    record Attempt(int count, Instant lockedUntil) { }

    private final ConcurrentMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final MeterRegistry registry;

    LoginAttemptService(MeterRegistry registry) {
        this.registry = registry;
        Gauge.builder("auth.locked.keys", attempts,
                map -> map.values().stream()
                    .filter(a -> a.lockedUntil().isAfter(Instant.now())).count())
            .register(registry);
    }

    void recordFailure(String username, String ip) {
        bump("user:" + username, USER_THRESHOLD);
        bump("ip:" + ip, IP_THRESHOLD);
        registry.counter("auth.failure", "reason", "bad_credentials").increment();
    }

    void recordSuccess(String username, String ip) {
        attempts.remove("user:" + username);
        attempts.remove("ip:" + ip);
        registry.counter("auth.success").increment();
    }

    boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        return attempt != null && attempt.lockedUntil().isAfter(Instant.now());
    }

    Duration remainingLock(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null) return Duration.ZERO;
        Duration remaining = Duration.between(Instant.now(), attempt.lockedUntil());
        return remaining.isNegative() ? Duration.ZERO : remaining;
    }

    private void bump(String key, int threshold) {
        attempts.compute(key, (k, existing) -> {
            int count = existing == null ? 1 : existing.count() + 1;
            if (count < threshold) return new Attempt(count, Instant.EPOCH);

            // EXPONENTIAL BACKOFF, capped. NOT a permanent lock - a permanent
            // lock by username is itself a denial-of-service vector, because
            // an attacker can lock out every real user deliberately.
            long seconds = Math.min(MAX_LOCK.toSeconds(), 1L << (count - threshold));
            registry.counter("auth.locked", "scope", k.startsWith("user:") ? "user" : "ip")
                    .increment();
            return new Attempt(count, Instant.now().plusSeconds(seconds));
        });
    }

    /** Housekeeping: without eviction this map grows without bound. */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 300_000)
    void evictExpired() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        attempts.entrySet().removeIf(e -> e.getValue().lockedUntil().isBefore(cutoff));
    }
}

/* =============================================================
 * 2. THE HOOKS - Spring publishes both outcomes as events
 * ============================================================= */
@Component
class AuthenticationEventListener {

    private final LoginAttemptService attempts;
    AuthenticationEventListener(LoginAttemptService attempts) { this.attempts = attempts; }

    @EventListener
    void onFailure(AbstractAuthenticationFailureEvent event) {
        attempts.recordFailure(event.getAuthentication().getName(),
            ipOf(event.getAuthentication()));
    }

    @EventListener
    void onSuccess(AuthenticationSuccessEvent event) {
        attempts.recordSuccess(event.getAuthentication().getName(),
            ipOf(event.getAuthentication()));
    }

    private String ipOf(org.springframework.security.core.Authentication authentication) {
        return authentication.getDetails() instanceof WebAuthenticationDetails details
            ? details.getRemoteAddress() : "unknown";
    }
}

/* =============================================================
 * 3. ENFORCEMENT - through UserDetails, so Spring does the rest
 * ============================================================= */
@Service
@Primary
class LockAwareUserDetailsService implements UserDetailsService {

    private final UserDetailsService delegate;
    private final LoginAttemptService attempts;
    private final org.springframework.web.context.request.RequestAttributes requestAttributes = null;

    LockAwareUserDetailsService(@Qualifier("databaseUserDetailsService")
                                UserDetailsService delegate,
                                LoginAttemptService attempts) {
        this.delegate = delegate; this.attempts = attempts;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        if (attempts.isBlocked("user:" + username)) {
            // DaoAuthenticationProvider turns this into a 401 for us.
            // Identical generic message whether the account exists or not.
            throw new LockedException("Account temporarily locked");
        }
        return delegate.loadUserByUsername(username);
    }
}

/** IP-level blocking happens earlier, in a filter. */
@Component
class IpBlockFilter extends org.springframework.web.filter.OncePerRequestFilter {

    private final LoginAttemptService attempts;
    IpBlockFilter(LoginAttemptService attempts) { this.attempts = attempts; }

    @Override protected boolean shouldNotFilter(jakarta.servlet.http.HttpServletRequest r) {
        return !r.getServletPath().startsWith("/api/auth/login");
    }

    @Override
    protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                    jakarta.servlet.http.HttpServletResponse response,
                                    jakarta.servlet.FilterChain chain)
            throws jakarta.servlet.ServletException, java.io.IOException {
        String ip = clientIp(request);
        if (attempts.isBlocked("ip:" + ip)) {
            Duration remaining = attempts.remainingLock("ip:" + ip);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(remaining.toSeconds()));
            response.setContentType("application/problem+json");
            response.getWriter().write(
                "{\\"title\\":\\"Too many attempts\\",\\"status\\":429}");
            return;
        }
        chain.doFilter(request, response);
    }

    private String clientIp(jakarta.servlet.http.HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        // Only trust this if your ingress overwrites it. Otherwise it is spoofable.
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}

/*
=============================================================
THE LAYERS, AND WHY EACH EXISTS
=============================================================
1. Per-USERNAME backoff    stops a targeted attack on one account
2. Per-IP backoff          stops credential stuffing across many accounts
3. CAPTCHA after 3 fails   raises cost without locking anyone out
4. MFA                     the actual fix: a stolen password is not enough
5. Breached-password check Have I Been Pwned k-anonymity API at registration
6. Generic responses       identical body and timing for unknown user,
                           wrong password and locked account

WHY NOT USERNAME-ONLY LOCKOUT
  An attacker who knows your user list can deliberately lock out every
  customer with five bad guesses each. Per-IP plus short exponential backoff
  gives protection without handing over a DoS lever.

METRICS AND ALERTS
  auth.failure rate                       alert on a 10x jump over baseline
  auth.failure / auth.success ratio       alert above 0.5 sustained
  auth.locked{scope=user}                 a spike means a targeted attack
  auth.locked{scope=ip}                   a spike means stuffing
  distinct usernames per IP per minute    the clearest stuffing signal

DISTRIBUTED DEPLOYMENT
  ConcurrentHashMap is per-JVM, so ten instances means ten times the
  threshold. Move the counters to Redis (INCR with EXPIRE, or a Lua script
  for atomicity) or enforce at the gateway.
*/`,
    solutionLanguage: "java",
    discussion:
      "The insight that distinguishes a good answer is that **naive lockout is itself an attack**: lock an account for 30 minutes after five failures and anyone with your user list can lock out your entire customer base. So the design has to be layered — short exponential backoff per username to blunt targeted guessing, a higher threshold per IP to catch stuffing across many accounts, CAPTCHA to raise cost without denying service, and MFA as the only thing that actually fixes stolen credentials. Implementation-wise, hooking `AuthenticationFailureBadCredentialsEvent` and surfacing the lock through `UserDetails.isAccountNonLocked()` is the idiomatic route, because `DaoAuthenticationProvider` then produces the right exception and response with no special-casing in the controller. Two closing details that matter: keep the response body and timing identical for locked, unknown and wrong-password so nothing is enumerable, and note that a `ConcurrentHashMap` counter multiplies your threshold by the instance count — Redis or the gateway is the real answer at scale.",
    relatedQuestionIds: ["b124", "b108", "b122"],
  },
  {
    id: "p36",
    topic: "spring-security",
    title: "Audit a Spring Security configuration against the OWASP Top 10",
    difficulty: "hard",
    estimatedMinutes: 40,
    scenario:
      "You have inherited the configuration below. Perform a security review: list every finding with its OWASP category and severity, then produce the corrected configuration.",
    starterCode: `@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration c = new CorsConfiguration();
                c.setAllowedOrigins(List.of("*"));
                c.setAllowCredentials(true);
                return c;
            }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .headers(h -> h.frameOptions(f -> f.disable()))
            .build();
    }

    @Bean
    PasswordEncoder encoder() { return NoOpPasswordEncoder.getInstance(); }
}`,
    tasks: [
      "Find every issue and map it to an OWASP 2021 category.",
      "Rank the findings by severity with a justification.",
      "Write the corrected configuration.",
      "List the supporting `application.yml` hardening.",
    ],
    hints: [
      "`allowedOrigins(\"*\")` with `allowCredentials(true)` is not just wrong — the spec forbids it, and Spring throws at runtime.",
      "`permitAll()` on `/actuator/**` exposes heap dumps, environment variables and possibly shutdown.",
      "`NoOpPasswordEncoder` means plaintext passwords in the database.",
    ],
    solution: `import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.*;

import java.util.List;

/*
=================================================================
FINDINGS
=================================================================

[CRITICAL] A02 Cryptographic Failures - NoOpPasswordEncoder
    Passwords stored in plaintext. A single SQL injection or a leaked backup
    exposes every credential, and users reuse passwords elsewhere.
    FIX: DelegatingPasswordEncoder (bcrypt/argon2). All existing passwords
    must be reset - they cannot be "migrated", they are already compromised.

[CRITICAL] A01 Broken Access Control - permitAll() on /api/**
    The entire API is public. This is the whole application.
    FIX: authenticate by default, permit specific endpoints only.

[CRITICAL] A05 Security Misconfiguration - permitAll() on /actuator/**
    /actuator/heapdump    -> the full heap, including passwords and tokens in memory
    /actuator/env         -> every environment variable, including secrets
    /actuator/configprops -> datasource URLs and credentials
    /actuator/shutdown    -> remote denial of service, if enabled
    /actuator/mappings    -> a complete map of the attack surface
    FIX: expose health and info anonymously; everything else requires a role.

[HIGH] A05 - CORS wildcard with credentials
    allowedOrigins("*") + allowCredentials(true) is forbidden by the CORS
    spec; Spring throws IllegalArgumentException at runtime. Even if it
    worked, any site could make credentialed requests and read the responses.
    FIX: an explicit origin list (or allowedOriginPatterns for subdomains).

[HIGH] A01 - CSRF disabled with form login
    formLogin() means a session cookie, which the browser attaches
    automatically. With CSRF off, any site can submit state-changing requests
    on behalf of a logged-in user.
    FIX: CSRF on for the session-based chain; disable it only for a
    stateless bearer-token chain.

[MEDIUM] A05 - frameOptions disabled
    The application can be framed by any site -> clickjacking.
    FIX: frameOptions().deny(), plus a CSP frame-ancestors directive.

[MEDIUM] A05 - no security headers
    No HSTS, no CSP, no referrer policy, no permissions policy.

[MEDIUM] A07 - no session hardening
    No fixation strategy declared (the default is fine, but should be
    explicit), no concurrency control, no timeout.

[LOW] A09 - no auditing
    No authentication success/failure logging, so an attack is invisible.
=================================================================
*/

@Configuration
@EnableWebSecurity
@EnableMethodSecurity                                 // defence in depth
public class CorrectedSecurityConfig {

    /** CHAIN 1: stateless API. CSRF off is CORRECT here - bearer tokens only. */
    @Bean
    @org.springframework.core.annotation.Order(1)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())              // justified: no cookie auth
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())         // DENY BY DEFAULT
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((rq, rs, e) -> rs.sendError(401))
                .accessDeniedHandler((rq, rs, e) -> rs.sendError(403)))
            .build();
    }

    /** CHAIN 2: actuator. Health and info anonymous; the rest locked down. */
    @Bean
    @org.springframework.core.annotation.Order(2)
    SecurityFilterChain actuatorChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher(org.springframework.boot.actuate.autoconfigure.security
                .servlet.EndpointRequest.toAnyEndpoint())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.boot.actuate.autoconfigure.security
                    .servlet.EndpointRequest.to("health", "info")).permitAll()
                .anyRequest().hasRole("OPS"))          // heapdump, env, threaddump
            .httpBasic(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .build();
    }

    /** CHAIN 3: the browser UI. Sessions and CSRF ON. */
    @Bean
    @org.springframework.core.annotation.Order(3)
    SecurityFilterChain uiChain(HttpSecurity http) throws Exception {
        return http
            .csrf(Customizer.withDefaults())           // ENABLED - cookie auth
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/error", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(form -> form
                .loginPage("/login").permitAll()
                .failureUrl("/login?error"))           // generic - no enumeration
            .logout(logout -> logout
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID"))
            .sessionManagement(session -> session
                .sessionFixation(fixation -> fixation.changeSessionId())
                .maximumSessions(3)
                .maxSessionsPreventsLogin(false))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; script-src 'self'; style-src 'self'; "
                    + "object-src 'none'; frame-ancestors 'none'; base-uri 'self'"))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true).preload(true).maxAgeInSeconds(31_536_000))
                .frameOptions(frame -> frame.deny())   // clickjacking
                .contentTypeOptions(Customizer.withDefaults())   // nosniff
                .referrerPolicy(r -> r.policy(
                    ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicyHeader(p -> p.policy(
                    "geolocation=(), microphone=(), camera=()")))
            .build();
    }

    /** Explicit origins. NEVER "*" with credentials - the spec forbids it. */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "https://app.example.com", "https://admin.example.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
        config.setExposedHeaders(List.of("X-Total-Count"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /** Argon2 for new hashes; still verifies legacy bcrypt. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /** A09: make authentication events visible. */
    @Bean
    org.springframework.security.authentication.event.LoggerListener
            authenticationEventLogger() {
        return new org.springframework.security.authentication.event.LoggerListener();
    }
}

/*
=================================================================
SUPPORTING application.yml HARDENING
=================================================================
server:
  error:
    include-stacktrace: never       # A05: no internals in error responses
    include-message: never
    include-binding-errors: never
  servlet:
    session:
      timeout: 30m
      cookie:
        http-only: true             # blunts XSS session theft
        secure: true                # HTTPS only
        same-site: lax              # defence in depth against CSRF
        name: SESSIONID             # do not advertise the container
  tomcat:
    max-http-form-post-size: 2MB
    remoteip:
      remote-ip-header: x-forwarded-for     # only behind a trusted proxy

spring:
  h2.console.enabled: false         # A05: never in production
  jpa.open-in-view: false
  jackson:
    deserialization.fail-on-unknown-properties: true
  datasource:
    password: \${DB_PASSWORD}        # A02: never inline
  servlet.multipart.max-file-size: 10MB

management:
  endpoints.web.exposure.include: health,info,prometheus   # NEVER "*"
  endpoint:
    health.show-details: when-authorized
    shutdown.enabled: false
  server.port: 9090                 # a separate port, not exposed publicly

logging.level:
  org.springframework.security: INFO
  org.hibernate.SQL: WARN           # A09: do not log SQL with parameters

=================================================================
NON-CONFIGURATION ACTIONS
=================================================================
[ ] force a password reset for every user (the old hashes are plaintext)
[ ] rotate every secret that may have been exposed via /actuator/env
[ ] add OWASP Dependency-Check / Snyk to CI              (A06)
[ ] add the authorization matrix test suite               (A01)
[ ] enable MFA for admin accounts                         (A07)
[ ] add rate limiting on authentication endpoints         (A07)
[ ] review all @Query native queries for concatenation    (A03)
[ ] confirm no Jackson activateDefaultTyping              (A08)
*/`,
    solutionLanguage: "java",
    discussion:
      "This is the closest thing to a real task on the list, and the grading is as much about **process** as findings. Structure the review: enumerate, map to a category, rank by severity with a stated reason, then remediate. The three criticals should come out immediately — plaintext passwords, a fully public API, and an open actuator (`/actuator/heapdump` alone hands over every in-memory secret, which is why it outranks most 'classic' vulnerabilities). Two findings reward deeper knowledge: `allowedOrigins(\"*\")` with `allowCredentials(true)` is not merely bad practice, it is spec-forbidden and Spring throws at runtime, so the configuration is also broken; and disabling CSRF *while using form login* is the exact combination that makes CSRF exploitable, whereas disabling it for a bearer-token API is correct. Finish with the non-configuration actions — most notably that plaintext passwords cannot be migrated, only reset, and that any secret visible through `/actuator/env` must be rotated.",
    relatedQuestionIds: ["b122", "b112", "b115", "b111"],
  },

  /* ================================================================ */
  /* JWT                                                               */
  /* ================================================================ */
  {
    id: "p37",
    topic: "jwt",
    title: "Build a JWT by hand and verify it without a library",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "To prove you understand the format rather than the library, construct an HS256 JWT using only `java.util.Base64` and `javax.crypto.Mac`, then verify it and demonstrate that tampering is detected.",
    tasks: [
      "Build the header, payload and signature manually.",
      "Verify the signature with a constant-time comparison.",
      "Show that changing one byte of the payload invalidates it.",
      "Show that the payload is readable without any key.",
    ],
    hints: [
      "The signing input is `base64url(header) + \".\" + base64url(payload)` — the dot is part of it.",
      "Base64URL replaces `+` with `-`, `/` with `_`, and drops `=` padding.",
      "`MessageDigest.isEqual` is constant-time; `Arrays.equals` and `String.equals` are not.",
    ],
    solution: `import com.fasterxml.jackson.databind.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

public class HandRolledJwt {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /* =============================================================
     * SIGNING
     * ============================================================= */
    static String sign(Map<String, Object> claims, byte[] secret, String keyId)
            throws Exception {

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "at+jwt");          // explicit type (RFC 8725)
        header.put("kid", keyId);

        String encodedHeader  = ENCODER.encodeToString(MAPPER.writeValueAsBytes(header));
        String encodedPayload = ENCODER.encodeToString(MAPPER.writeValueAsBytes(claims));

        // The signing input INCLUDES the dot.
        String signingInput = encodedHeader + "." + encodedPayload;
        String signature = ENCODER.encodeToString(hmac(signingInput, secret));

        return signingInput + "." + signature;
    }

    static byte[] hmac(String data, byte[] secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    /* =============================================================
     * VERIFICATION - in the correct order
     * ============================================================= */
    record VerificationResult(boolean valid, String reason, JsonNode claims) { }

    static VerificationResult verify(String token, byte[] secret,
                                     String expectedIssuer, String expectedAudience)
            throws Exception {

        // 1. Structure and size, before any crypto.
        if (token == null || token.length() > 8192)
            return new VerificationResult(false, "size", null);
        String[] parts = token.split("\\\\.");
        if (parts.length != 3)
            return new VerificationResult(false, "malformed", null);

        // 2. Header: PIN the algorithm. Never dispatch on the token's own alg.
        JsonNode header = MAPPER.readTree(DECODER.decode(parts[0]));
        if (!"HS256".equals(header.path("alg").asText()))
            return new VerificationResult(false, "unexpected alg: "
                + header.path("alg").asText(), null);
        // This single check defeats BOTH alg:none and RS256->HS256 confusion.

        // 3. Signature, recomputed over header.payload.
        byte[] expected = hmac(parts[0] + "." + parts[1], secret);
        byte[] actual = DECODER.decode(parts[2]);
        // CONSTANT TIME. Arrays.equals short-circuits and leaks byte positions
        // through timing, which is enough to forge a signature byte by byte.
        if (!MessageDigest.isEqual(expected, actual))
            return new VerificationResult(false, "bad signature", null);

        // 4. Claims - only now that we know the token is authentic.
        JsonNode claims = MAPPER.readTree(DECODER.decode(parts[1]));
        long now = Instant.now().getEpochSecond();
        long skew = 60;

        if (!claims.has("exp")) return new VerificationResult(false, "no exp", null);
        if (claims.get("exp").asLong() < now - skew)
            return new VerificationResult(false, "expired", null);
        if (claims.has("nbf") && claims.get("nbf").asLong() > now + skew)
            return new VerificationResult(false, "not yet valid", null);
        if (!expectedIssuer.equals(claims.path("iss").asText()))
            return new VerificationResult(false, "bad issuer", null);

        JsonNode aud = claims.path("aud");
        boolean audienceMatches = aud.isArray()
            ? StreamSupportContains(aud, expectedAudience)
            : expectedAudience.equals(aud.asText());
        if (!audienceMatches)
            return new VerificationResult(false, "bad audience", null);

        return new VerificationResult(true, "ok", claims);
    }

    static boolean StreamSupportContains(JsonNode array, String value) {
        for (JsonNode node : array) if (value.equals(node.asText())) return true;
        return false;
    }

    // ------------------------------------------------------------------
    public static void main(String[] args) throws Exception {
        byte[] secret = new byte[32];                    // 256 bits minimum for HS256
        new SecureRandom().nextBytes(secret);

        long now = Instant.now().getEpochSecond();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("iss", "https://auth.example.com");
        claims.put("sub", UUID.randomUUID().toString()); // opaque, not an email
        claims.put("aud", List.of("orders-api"));
        claims.put("iat", now);
        claims.put("nbf", now);
        claims.put("exp", now + 900);                    // SECONDS, not millis
        claims.put("jti", UUID.randomUUID().toString());
        claims.put("scope", "orders:read orders:write");

        String token = sign(claims, secret, "key-2026-01");
        System.out.println("token:\\n" + token + "\\n");

        String[] parts = token.split("\\\\.");
        System.out.println("header : " + new String(DECODER.decode(parts[0])));
        System.out.println("payload: " + new String(DECODER.decode(parts[1])));
        System.out.println("=> NO KEY NEEDED. Base64URL is encoding, not encryption.");
        System.out.println("=> never put PII, secrets or internal ids in a payload.\\n");

        System.out.println("valid        : "
            + verify(token, secret, "https://auth.example.com", "orders-api"));

        // ---- Tampering: escalate the scope ----
        Map<String, Object> escalated = new LinkedHashMap<>(claims);
        escalated.put("scope", "orders:read orders:write admin:*");
        String tamperedPayload = ENCODER.encodeToString(MAPPER.writeValueAsBytes(escalated));
        String tampered = parts[0] + "." + tamperedPayload + "." + parts[2];
        System.out.println("tampered     : "
            + verify(tampered, secret, "https://auth.example.com", "orders-api"));

        // ---- alg:none ----
        String noneHeader = ENCODER.encodeToString(
            "{\\"alg\\":\\"none\\",\\"typ\\":\\"JWT\\"}".getBytes());
        String forged = noneHeader + "." + parts[1] + ".";
        System.out.println("alg:none     : "
            + verify(forged, secret, "https://auth.example.com", "orders-api"));

        // ---- wrong audience (cross-service replay) ----
        System.out.println("wrong aud    : "
            + verify(token, secret, "https://auth.example.com", "billing-api"));

        // ---- wrong key ----
        byte[] otherSecret = new byte[32];
        new SecureRandom().nextBytes(otherSecret);
        System.out.println("wrong key    : "
            + verify(token, otherSecret, "https://auth.example.com", "orders-api"));

        // ---- Base64URL vs standard Base64 ----
        byte[] raw = {(byte) 0xfb, (byte) 0xff, (byte) 0xbe};
        System.out.println("\\nbase64    : " + Base64.getEncoder().encodeToString(raw));
        System.out.println("base64url : " + ENCODER.encodeToString(raw));
        System.out.println("(+ -> -, / -> _, padding removed, so it is URL-safe)");

        /*
         * IN PRODUCTION: use nimbus-jose-jwt, jjwt or Spring Security's
         * NimbusJwtDecoder. Hand-rolled verification is where the CVEs live.
         * This exercise exists to prove you know what the library is doing.
         */
    }
}`,
    solutionLanguage: "java",
    discussion:
      "Writing it by hand forces out the details a library hides. Four things to land. **The payload is readable with no key** — Base64URL is encoding, not encryption — so the rule 'never put PII or secrets in a JWT' follows directly rather than being a memorised slogan. **Pinning the algorithm** is a single check that defeats two separate attack classes at once: `alg: none` and RS256→HS256 key confusion. **Constant-time comparison** is subtle but real: `Arrays.equals` short-circuits on the first differing byte, and that timing signal is enough to forge a signature byte by byte. **The ordering** — structure, then algorithm, then signature, then claims — matters because every later step is meaningless if an earlier one has not passed; validating `exp` before the signature is checking a value an attacker controls. Close by saying you would never ship this: use Nimbus or `NimbusJwtDecoder`, because hand-rolled JOSE is exactly where the CVEs are.",
    relatedQuestionIds: ["b125", "b126", "b127", "b128"],
  },
  {
    id: "p38",
    topic: "jwt",
    title: "Implement refresh token rotation with reuse detection",
    difficulty: "hard",
    estimatedMinutes: 40,
    scenario:
      "Long-lived JWTs cannot be revoked. Implement the OAuth 2.1 recommended pattern: short access tokens plus opaque, rotating refresh tokens with theft detection.\n\n" +
      "It must handle the legitimate race where a mobile client refreshes twice in parallel.",
    tasks: [
      "Store refresh tokens hashed, grouped into per-login families.",
      "Rotate on every use and invalidate the previous token.",
      "Detect reuse of an already-consumed token and revoke the whole family.",
      "Add a grace window so parallel refreshes do not log users out.",
    ],
    hints: [
      "Hash refresh tokens like passwords — a database leak must not yield usable credentials.",
      "Reuse of a consumed token means either theft or a race; distinguish them with a short time window plus the device id.",
      "Cap the family with an absolute lifetime so an endlessly-refreshed session still expires.",
    ],
    solution: `import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "refresh_token", indexes = {
    @Index(name = "ix_rt_hash", columnList = "token_hash", unique = true),
    @Index(name = "ix_rt_family", columnList = "family_id")
})
class RefreshTokenEntity {
    @Id @GeneratedValue Long id;

    /** SHA-256 of the raw token. The raw value is never stored. */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    String tokenHash;

    /** All tokens from one login share a family. */
    @Column(name = "family_id", nullable = false) String familyId;

    @Column(nullable = false) String userId;
    String deviceId;

    @Column(nullable = false) Instant issuedAt;
    @Column(nullable = false) Instant expiresAt;
    /** Caps the family regardless of how often it is refreshed. */
    @Column(nullable = false) Instant absoluteExpiresAt;

    /** Non-null once exchanged. Presenting it again means theft (or a race). */
    Instant usedAt;
    boolean revoked;
}

interface RefreshTokenRepository
        extends org.springframework.data.jpa.repository.JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
        "update RefreshTokenEntity t set t.revoked = true where t.familyId = :familyId")
    int revokeFamily(String familyId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
        "update RefreshTokenEntity t set t.revoked = true where t.userId = :userId")
    int revokeAllForUser(String userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
        "delete from RefreshTokenEntity t where t.absoluteExpiresAt < :cutoff")
    int deleteExpired(Instant cutoff);
}

@Service
public class RefreshTokenService {

    private static final Duration ACCESS_TTL   = Duration.ofMinutes(15);
    private static final Duration REFRESH_TTL  = Duration.ofDays(14);
    private static final Duration ABSOLUTE_TTL = Duration.ofDays(90);
    /** Tolerance for a legitimate parallel refresh from the same device. */
    private static final Duration GRACE        = Duration.ofSeconds(10);

    private final RefreshTokenRepository repository;
    private final AccessTokenIssuer issuer;
    private final SecurityEventPublisher events;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository,
                               AccessTokenIssuer issuer,
                               SecurityEventPublisher events) {
        this.repository = repository; this.issuer = issuer; this.events = events;
    }

    public record TokenPair(String accessToken, String refreshToken, long expiresIn) { }

    /* =============================================================
     * LOGIN - start a new family
     * ============================================================= */
    @Transactional
    public TokenPair login(String userId, String deviceId) {
        String familyId = UUID.randomUUID().toString();
        String raw = issueRefreshToken(userId, familyId, deviceId,
            Instant.now().plus(ABSOLUTE_TTL));
        return new TokenPair(issuer.issue(userId, ACCESS_TTL), raw, ACCESS_TTL.toSeconds());
    }

    /* =============================================================
     * REFRESH - rotate, with reuse detection
     * ============================================================= */
    @Transactional
    public TokenPair refresh(String presentedToken, String deviceId) {
        RefreshTokenEntity stored = repository.findByTokenHash(sha256(presentedToken))
            .orElseThrow(() -> {
                // An unknown token is itself suspicious - it was never issued,
                // or it was already pruned.
                events.publish("refresh_token_unknown", null);
                return new InvalidRefreshTokenException("unknown token");
            });

        // ---- REUSE DETECTION ----
        if (stored.usedAt != null) {
            boolean withinGrace = stored.usedAt.isAfter(Instant.now().minus(GRACE));
            boolean sameDevice = Objects.equals(stored.deviceId, deviceId);

            if (withinGrace && sameDevice) {
                /*
                 * A legitimate race: a mobile client fired several requests in
                 * parallel, each got a 401, and each tried to refresh. Without
                 * this window we would revoke the family and log the user out
                 * at random - a very common production complaint.
                 *
                 * We return a fresh access token but do NOT rotate again.
                 */
                return new TokenPair(issuer.issue(stored.userId, ACCESS_TTL),
                    presentedToken, ACCESS_TTL.toSeconds());
            }

            /*
             * Otherwise this is theft. Either the attacker is using a token the
             * legitimate user already consumed, or the user is presenting one
             * the attacker consumed. We cannot tell which - and it does not
             * matter. Kill the entire family and force re-authentication.
             */
            repository.revokeFamily(stored.familyId);
            events.publish("refresh_token_reuse_detected", stored.userId);
            throw new TokenTheftException("refresh token reuse detected");
        }

        if (stored.revoked)
            throw new InvalidRefreshTokenException("revoked");
        if (stored.expiresAt.isBefore(Instant.now()))
            throw new InvalidRefreshTokenException("expired");
        if (stored.absoluteExpiresAt.isBefore(Instant.now()))
            throw new InvalidRefreshTokenException("session lifetime exceeded");

        // ---- ROTATE ----
        stored.usedAt = Instant.now();
        repository.save(stored);

        String raw = issueRefreshToken(stored.userId, stored.familyId, deviceId,
            stored.absoluteExpiresAt);       // the absolute cap is inherited
        return new TokenPair(issuer.issue(stored.userId, ACCESS_TTL), raw,
            ACCESS_TTL.toSeconds());
    }

    /* =============================================================
     * LOGOUT
     * ============================================================= */
    @Transactional
    public void logout(String presentedToken) {
        repository.findByTokenHash(sha256(presentedToken))
            .ifPresent(t -> repository.revokeFamily(t.familyId));
    }

    @Transactional
    public void logoutEverywhere(String userId) {
        repository.revokeAllForUser(userId);
    }

    /** Housekeeping - the table grows quickly without it. */
    @Transactional
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 4 * * *")
    public void pruneExpired() {
        repository.deleteExpired(Instant.now().minus(Duration.ofDays(1)));
    }

    // ------------------------------------------------------------------
    private String issueRefreshToken(String userId, String familyId, String deviceId,
                                     Instant absoluteExpiry) {
        byte[] bytes = new byte[32];              // 256 bits of entropy
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.tokenHash = sha256(raw);           // only the HASH is persisted
        entity.familyId = familyId;
        entity.userId = userId;
        entity.deviceId = deviceId;
        entity.issuedAt = Instant.now();
        entity.expiresAt = Instant.now().plus(REFRESH_TTL);
        entity.absoluteExpiresAt = absoluteExpiry;
        repository.save(entity);
        return raw;                               // returned once, never stored
    }

    private String sha256(String raw) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(raw.getBytes()));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    interface AccessTokenIssuer { String issue(String userId, Duration ttl); }
    interface SecurityEventPublisher { void publish(String event, String userId); }

    static class InvalidRefreshTokenException extends RuntimeException {
        InvalidRefreshTokenException(String m) { super(m); }
    }
    static class TokenTheftException extends RuntimeException {
        TokenTheftException(String m) { super(m); }
    }
}

/*
=================================================================
THE ATTACK, AND WHY ROTATION DETECTS IT
=================================================================
Without rotation
  1. attacker steals refresh token RT1
  2. attacker refreshes indefinitely; the user notices nothing
  3. the theft is undetectable for the full refresh lifetime

With rotation + reuse detection
  1. attacker steals RT1
  2. attacker refreshes -> gets RT2, RT1 is marked used
  3. the USER's client eventually refreshes with RT1
  4. RT1 is already used, outside the grace window -> FAMILY REVOKED
  5. both parties are logged out; the user re-authenticates with MFA;
     the attacker is locked out and a security event has fired

It works symmetrically: whoever refreshes second triggers the detection,
so theft always surfaces within one refresh cycle.

=================================================================
COOKIE PLACEMENT
=================================================================
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict;
            Path=/api/auth/refresh; Max-Age=1209600

  - refresh token: HttpOnly cookie, scoped to the refresh path only
  - access token:  JavaScript memory, never localStorage
  - the client serialises concurrent refreshes behind ONE in-flight promise,
    which makes the grace window a safety net rather than the primary fix
*/`,
    solutionLanguage: "java",
    discussion:
      "The elegance of this pattern is worth articulating: rotation does not prevent theft, it makes theft **detectable**, and symmetrically — whichever party refreshes second trips the alarm, so a stolen token surfaces within one refresh cycle instead of living for its full lifetime. Three implementation details carry the answer. **Hash the refresh token** exactly like a password, because a database leak otherwise hands over live credentials. **The family concept** is what makes revocation meaningful: you invalidate the entire login lineage, not just one token. **The grace window** is the detail that only comes from having shipped this — a mobile client with six parallel requests will legitimately attempt several refreshes at once, and a naive implementation revokes the family and logs real users out at random, which generates far more support tickets than the attack it prevents. The complementary fix is client-side single-flight refresh; the server window is the safety net. Mention the absolute family lifetime too, or an endlessly-refreshed session never expires.",
    relatedQuestionIds: ["b129", "b131", "b130"],
  },
  {
    id: "p39",
    topic: "jwt",
    title: "Rotate JWT signing keys with zero downtime",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "A signing key may have been exposed. You must rotate it without invalidating tokens in flight and without a maintenance window.\n\n" +
      "Implement the JWKS publishing side and the caching verification side.",
    tasks: [
      "Implement staged rotation: publish, promote, wait, retire.",
      "Publish a JWKS endpoint exposing only public keys.",
      "Configure the verifier to cache the JWKS and rate-limit refresh on an unknown `kid`.",
      "Write the emergency procedure for a confirmed compromise.",
    ],
    hints: [
      "The `kid` header lets several keys coexist, which is the whole basis of rotation.",
      "You must wait longer than the verifiers' JWKS cache TTL before signing with the new key.",
      "An attacker sending random `kid` values can turn your service into a JWKS flood generator.",
    ],
    solution: `import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/* =============================================================
 * AUTHORIZATION SERVER: key lifecycle
 * ============================================================= */
@Component
class SigningKeyStore {

    enum Status { STAGED, ACTIVE, RETIRING }

    record ManagedKey(RSAKey key, Status status, Instant createdAt) { }

    /** Read-mostly: a signature lookup per token issued, mutations are rare. */
    private final CopyOnWriteArrayList<ManagedKey> keys = new CopyOnWriteArrayList<>();

    SigningKeyStore() throws JOSEException {
        keys.add(new ManagedKey(generate("key-2026-01"), Status.ACTIVE, Instant.now()));
    }

    static RSAKey generate(String kid) throws JOSEException {
        return new RSAKeyGenerator(2048)
            .keyID(kid)                       // the kid written into every header
            .keyUse(KeyUse.SIGNATURE)
            .algorithm(JWSAlgorithm.RS256)
            .issueTime(new Date())
            .generate();
    }

    /** PHASE 1 - publish the new key; keep signing with the old one. */
    synchronized String stage() throws JOSEException {
        String kid = "key-" + LocalDate.now() + "-" + UUID.randomUUID().toString().substring(0, 4);
        keys.add(new ManagedKey(generate(kid), Status.STAGED, Instant.now()));
        return kid;
    }

    /** PHASE 2 - promote, only after the JWKS cache TTL has elapsed everywhere. */
    synchronized void promote(String kid) {
        List<ManagedKey> updated = new ArrayList<>();
        for (ManagedKey managed : keys) {
            if (managed.key().getKeyID().equals(kid)) {
                updated.add(new ManagedKey(managed.key(), Status.ACTIVE, managed.createdAt()));
            } else if (managed.status() == Status.ACTIVE) {
                updated.add(new ManagedKey(managed.key(), Status.RETIRING, managed.createdAt()));
            } else {
                updated.add(managed);
            }
        }
        keys.clear();
        keys.addAll(updated);
    }

    /** PHASE 4 - remove, only after the longest access-token lifetime. */
    synchronized void retire(String kid) {
        keys.removeIf(m -> m.key().getKeyID().equals(kid) && m.status() == Status.RETIRING);
    }

    RSAKey activeKey() {
        return keys.stream().filter(m -> m.status() == Status.ACTIVE).findFirst()
            .map(ManagedKey::key)
            .orElseThrow(() -> new IllegalStateException("no active signing key"));
    }

    /** Everything published in the JWKS - PUBLIC parts only. */
    JWKSet publicKeySet() {
        return new JWKSet(keys.stream().map(m -> (JWK) m.key().toPublicJWK()).toList());
    }

    List<ManagedKey> all() { return List.copyOf(keys); }
}

@RestController
class JwksController {

    private final SigningKeyStore store;
    JwksController(SigningKeyStore store) { this.store = store; }

    /**
     * toJSONObject() on a JWKSet built from toPublicJWK() cannot leak private
     * material - but assert it in a test anyway.
     */
    @GetMapping(value = "/.well-known/jwks.json", produces = "application/json")
    public Map<String, Object> jwks() {
        return store.publicKeySet().toJSONObject();
    }

    /** Operational endpoint - lock this behind ROLE_OPS. */
    @PostMapping("/admin/keys/rotate")
    public Map<String, String> rotate() throws JOSEException {
        return Map.of("staged", store.stage(),
            "note", "promote after the JWKS cache TTL (>= 15 minutes)");
    }
}

@Service
class TokenIssuer {

    private final SigningKeyStore store;
    TokenIssuer(SigningKeyStore store) { this.store = store; }

    String issue(String subject, Duration ttl) throws JOSEException {
        RSAKey key = store.activeKey();
        Instant now = Instant.now();

        SignedJWT jwt = new SignedJWT(
            new JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(key.getKeyID())        // tells verifiers which key to use
                .type(new JOSEObjectType("at+jwt"))
                .build(),
            new JWTClaimsSet.Builder()
                .issuer("https://auth.example.com")
                .subject(subject)
                .audience("orders-api")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(ttl)))
                .jwtID(UUID.randomUUID().toString())
                .build());

        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }
}

/* =============================================================
 * RESOURCE SERVER: caching, rate-limited, outage-tolerant
 * ============================================================= */
@org.springframework.context.annotation.Configuration
class VerifierConfig {

    @org.springframework.context.annotation.Bean
    JWKSource<SecurityContext> jwkSource(
            @org.springframework.beans.factory.annotation.Value("\${app.jwks-uri}")
            String jwksUri) throws Exception {
        return JWKSourceBuilder.create(new java.net.URL(jwksUri))
            .cache(Duration.ofMinutes(10).toMillis(),
                   Duration.ofSeconds(30).toMillis())
            .refreshAheadCache(true)          // refresh before it expires
            /*
             * CRITICAL: without a rate limit, an attacker sends tokens with
             * random kid values. Each unknown kid triggers a JWKS fetch, and
             * your service becomes a flood generator against the auth server.
             */
            .rateLimited(Duration.ofMinutes(1).toMillis())
            .retrying(true)
            /*
             * Serve from a stale cache rather than failing every request if
             * the auth server has a blip. Availability beats freshness here -
             * keys change every few months, not every minute.
             */
            .outageTolerant(Duration.ofHours(1).toMillis())
            .build();
    }

    @org.springframework.context.annotation.Bean
    org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder(
            @org.springframework.beans.factory.annotation.Value("\${app.issuer-uri}")
            String issuer) {
        // Spring's decoder already caches for 5 minutes by default.
        return org.springframework.security.oauth2.jwt.NimbusJwtDecoder
            .withIssuerLocation(issuer)
            .jwsAlgorithm(org.springframework.security.oauth2.jose.jws
                .SignatureAlgorithm.RS256)     // PINNED
            .build();
    }
}

/*
=================================================================
THE ROTATION TIMELINE
=================================================================
T+0      POST /admin/keys/rotate
         key-2026-02 published as STAGED. Still signing with key-2026-01.
         JWKS now contains BOTH keys.

T+15m    Every verifier's cache (10m TTL + jitter) has refreshed and knows
         key-2026-02. -> promote("key-2026-02")
         New tokens carry kid=key-2026-02. Existing tokens signed with
         key-2026-01 still verify, because it is still published.

T+30m    All access tokens signed with key-2026-01 have expired
         (15m TTL + 60s skew, with margin).

T+1h     retire("key-2026-01"). Removed from the JWKS.

Zero downtime. No token is ever rejected.

=================================================================
EMERGENCY: CONFIRMED COMPROMISE
=================================================================
The staged timeline assumes the old key is still trustworthy. If it is
known-compromised, you cannot wait - an attacker can mint valid tokens.

  1. Generate and publish the new key, and promote it IMMEDIATELY.
  2. Remove the compromised key from the JWKS IMMEDIATELY.
     -> every token signed with it now fails. This IS a user-visible
        outage of up to one access-token lifetime. Accept it.
  3. Revoke all refresh tokens (invalidateAllTokensFor / revokeAllForUser),
     forcing full re-authentication.
  4. Rotate anything else the compromise may have exposed.
  5. Audit: which tokens were issued with that kid, and what did they access?

This is exactly why access tokens should be SHORT. With a 15-minute TTL the
worst-case blast radius is 15 minutes; with a 24-hour TTL it is a day.

=================================================================
WHY HS256 MAKES THIS MUCH HARDER
=================================================================
There is no JWKS for a shared secret. Rotation means distributing a new
secret to every service simultaneously, and every verifier can also mint
tokens. Asymmetric keys are what make rotation an operation rather than a
coordinated deployment.
*/`,
    solutionLanguage: "java",
    discussion:
      "Key rotation is an operations question that exposes whether you have run an identity provider. The staged sequence — publish, wait out the cache TTL, promote, wait out the token TTL, retire — is the entire answer for a *planned* rotation, and the ordering is forced: promote before verifiers have cached the new key and every request fails. Two details earn real credit. **Rate-limiting JWKS refresh on an unknown `kid`** is a subtle availability vulnerability: without it, an attacker sends random `kid` values and your resource server hammers the auth server on every request. **Outage tolerance** is the counterintuitive one — serving from a stale JWKS cache during an auth-server blip is correct, because keys rotate monthly while a 30-second outage would otherwise fail 100% of requests. Finish with the emergency path, because it is genuinely different: a confirmed compromise means you *cannot* wait, you accept a bounded outage, and the size of that outage is exactly your access-token TTL — which is the concrete operational argument for keeping it at 15 minutes.",
    relatedQuestionIds: ["b133", "b127", "b131"],
  },
  {
    id: "p40",
    topic: "jwt",
    title: "Design a JWT revocation strategy under a hard requirement",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "Compliance requires that when an administrator disables an account, all access must stop within **30 seconds**. Your API is stateless JWT with a 15-minute access token.\n\n" +
      "Design and justify a solution, then implement it.",
    tasks: [
      "Explain why the current design cannot meet the requirement.",
      "Evaluate at least four strategies against latency, cost and complexity.",
      "Implement the one you recommend.",
      "State honestly when you would abandon JWTs entirely.",
    ],
    hints: [
      "A self-contained token is valid until `exp`; the resource server consults nothing.",
      "A per-user `tokensValidAfter` timestamp is one entry per user, not per token.",
      "If you check a shared store on every request, you have re-invented sessions.",
    ],
    solution: `import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

/*
=================================================================
WHY THE CURRENT DESIGN CANNOT MEET THE REQUIREMENT
=================================================================
A JWT is self-contained. The resource server validates the signature and the
claims and consults NOTHING else - that is the entire point, and the source
of its scalability. Disabling the account changes a database row that no
verifier reads. The token remains cryptographically valid until exp.

Worst case today: 15 minutes. Requirement: 30 seconds. Gap: 30x.

=================================================================
STRATEGY EVALUATION
=================================================================
                         latency   cost/req    complexity   scales
A. Shorten exp to 30s    <=30s     refresh     low          poor (30x more
                                   every 30s                refresh traffic,
                                                            auth server load)
B. jti denylist (Redis)  instant   1 lookup    medium       good (TTL-bounded
                                                            key count)
C. tokensValidAfter      instant   1 lookup    low          excellent (one
   per user (Redis)                (cacheable) key PER USER,
                                                            not per token)
D. Opaque + introspect   instant   1 HTTP call high         poor (network hop
                                                            per request)
E. Push revocation to    <=seconds 0           high         good, but
   every instance                                           eventually
   (pub/sub + local set)                                    consistent

RECOMMENDATION: C, with B for surgical single-token revocation.

Why C over B
  - ONE Redis key per user, not one per outstanding token
  - naturally implements "log out everywhere", "password changed" and
    "roles changed" with the same mechanism
  - the value changes rarely, so it caches extremely well locally
    (a 5-second local cache still meets a 30-second SLA)
  - no need to enumerate outstanding tokens

Why not A
  Shortening exp to 30 seconds multiplies refresh traffic by 30 and makes the
  auth server a hard dependency of every request path. It also does not
  actually guarantee 30 seconds - it guarantees 30 seconds PLUS clock skew.

Why not D
  Correct, but it discards the only advantage JWTs had. If you are making a
  network call per request anyway, use opaque tokens and sessions - they are
  simpler and strictly more capable.
*/

@Service
public class RevocationService {

    private static final String VALID_AFTER = "auth:valid-after:";
    private static final String DENY_JTI    = "auth:denied-jti:";
    /** Local cache TTL. 5s is well inside the 30s SLA and removes most Redis hits. */
    private static final Duration LOCAL_CACHE_TTL = Duration.ofSeconds(5);

    private final StringRedisTemplate redis;

    /** Per-instance cache so we do not hit Redis on literally every request. */
    private final Map<String, CachedCutoff> localCache = new java.util.concurrent
        .ConcurrentHashMap<>();

    private record CachedCutoff(long epochSecond, Instant fetchedAt) { }

    public RevocationService(StringRedisTemplate redis) { this.redis = redis; }

    /* ---------- write side: called by the admin action ---------- */

    /** Disable / password change / role change - all use the same lever. */
    public void revokeAllTokensFor(String userId) {
        long now = Instant.now().getEpochSecond();
        redis.opsForValue().set(VALID_AFTER + userId, String.valueOf(now),
            Duration.ofDays(90));         // must outlive the longest refresh token
        localCache.remove(userId);        // this instance, immediately
    }

    /** Surgical: revoke one specific token (e.g. a leaked one). */
    public void revokeToken(String jti, Instant expiresAt) {
        long ttl = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttl > 0) {
            // TTL = the token's REMAINING lifetime, so the denylist is
            // self-cleaning and can never grow unbounded.
            redis.opsForValue().set(DENY_JTI + jti, "1", ttl, TimeUnit.SECONDS);
        }
    }

    /* ---------- read side: called on every request ---------- */

    public boolean isRevoked(String userId, Instant issuedAt, String jti) {
        if (jti != null && Boolean.TRUE.equals(redis.hasKey(DENY_JTI + jti))) return true;

        long cutoff = validAfter(userId);
        return cutoff > 0 && issuedAt.getEpochSecond() < cutoff;
    }

    private long validAfter(String userId) {
        CachedCutoff cached = localCache.get(userId);
        if (cached != null && cached.fetchedAt().isAfter(Instant.now().minus(LOCAL_CACHE_TTL))) {
            return cached.epochSecond();
        }
        String value = redis.opsForValue().get(VALID_AFTER + userId);
        long cutoff = value == null ? 0 : Long.parseLong(value);
        localCache.put(userId, new CachedCutoff(cutoff, Instant.now()));
        return cutoff;
    }
}

/** Plug it into the validation pipeline as just another validator. */
@org.springframework.context.annotation.Configuration
class RevocationAwareDecoderConfig {

    @org.springframework.context.annotation.Bean
    JwtDecoder jwtDecoder(
            @org.springframework.beans.factory.annotation.Value("\${app.issuer-uri}")
            String issuer,
            RevocationService revocation) {

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withIssuerLocation(issuer).build();

        OAuth2TokenValidator<Jwt> notRevoked = jwt -> {
            if (revocation.isRevoked(jwt.getSubject(), jwt.getIssuedAt(), jwt.getId())) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                    "invalid_token", "token has been revoked", null));
            }
            return OAuth2TokenValidatorResult.success();
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer),   // sig, iss, exp, nbf
            notRevoked));
        return decoder;
    }
}

@Service
class AccountAdminService {

    private final RevocationService revocation;
    private final RefreshTokenService refreshTokens;

    AccountAdminService(RevocationService revocation, RefreshTokenService refreshTokens) {
        this.revocation = revocation; this.refreshTokens = refreshTokens;
    }

    /** Both levers must be pulled: existing access tokens AND future refreshes. */
    @org.springframework.transaction.annotation.Transactional
    public void disableAccount(String userId) {
        // userRepository.disable(userId);
        refreshTokens.logoutEverywhere(userId);     // no NEW access tokens
        revocation.revokeAllTokensFor(userId);      // existing ones stop working
        // audit.log("account_disabled", userId);
    }
}

/*
=================================================================
MEETING THE 30-SECOND SLA - the arithmetic
=================================================================
  admin action -> Redis write            <10ms
  local cache expiry on other instances  <=5s
  next request validates                 immediate
  -----------------------------------------------
  worst case                             ~5s     (SLA: 30s)  PASS

Tighten LOCAL_CACHE_TTL to 1s if you need more margin; the cost is 5x the
Redis reads, which is still trivial (a GET on a small key).

=================================================================
FAILURE MODE: WHAT IF REDIS IS DOWN?
=================================================================
This is the question that gets asked next, and there is no free answer:

  FAIL OPEN   (treat as not revoked) - available, but a disabled account
              keeps working during the outage. Violates the SLA.
  FAIL CLOSED (reject everything)    - secure, but a Redis outage becomes a
              total authentication outage.

For a COMPLIANCE requirement, fail closed, and make Redis highly available
(cluster or sentinel) so its availability matches the API's. Say this
explicitly - interviewers are checking whether you noticed the trade-off,
not which side you pick.

=================================================================
WHEN I WOULD ABANDON JWTs
=================================================================
Be honest about it:

  "We are now checking a shared store on every request. That is a session
   store with extra cryptography. The JWT is still buying us signature
   verification without a round trip to the AUTH SERVER, and claims that
   travel across service boundaries - which is real value in a microservices
   estate. But for a single monolith with one domain, I would drop the JWT
   and use a server-side session: instant revocation, a 32-byte cookie
   instead of 1KB on every request, mutable state, and far fewer ways to get
   it wrong."

The decision rule:
  - need instant revocation AND single domain        -> sessions
  - need cross-service identity AND instant
    revocation                                       -> JWT + this design
  - need cross-service identity, can tolerate a
    bounded window                                   -> plain short-lived JWT
*/`,
    solutionLanguage: "java",
    discussion:
      "This problem is deliberately constructed so that the 'correct' JWT answer undermines JWTs, and the best candidates say so out loud. Work through the options with explicit trade-offs rather than jumping to a denylist: the per-user `tokensValidAfter` timestamp beats a `jti` denylist because it is one key per *user* rather than per outstanding token, it caches beautifully (a 5-second local cache still satisfies a 30-second SLA while eliminating almost all Redis traffic), and it gives you 'log out everywhere' and 'invalidate on password change' with the same mechanism. Then volunteer the two things interviewers are really probing. **The Redis failure mode**: fail open and a disabled account keeps working; fail closed and a cache outage is an authentication outage — for a compliance requirement you fail closed and make Redis as available as the API. **The honest conclusion**: once you consult shared state on every request you have rebuilt sessions with extra cryptography, and for a single-domain monolith sessions are simply the better design. Saying that demonstrates engineering judgement rather than technology loyalty.",
    relatedQuestionIds: ["b131", "b134", "b129"],
  },
  {
    id: "p41",
    topic: "jwt",
    title: "Debug intermittent 401s across a fleet",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Roughly 8% of API requests return 401 with a valid-looking token. It is not reproducible locally. The fleet is 12 pods behind a load balancer.\n\n" +
      "Produce a systematic diagnosis and the instrumentation that makes it obvious.",
    tasks: [
      "List the likely causes of an *intermittent* (rather than total) failure.",
      "Add instrumentation that categorises every rejection by reason.",
      "Show how to identify whether it is one bad pod.",
      "Give the fix for each cause.",
    ],
    hints: [
      "8% of twelve pods is approximately one pod — that ratio is itself a diagnostic.",
      "Clock skew, stale JWKS after rotation, and partial config rollout all produce intermittent failures.",
      "Never log the token; log the `jti`, `kid`, `sub`, `exp` and the instance id.",
    ],
    solution: `import io.micrometer.core.instrument.*;
import org.springframework.boot.actuate.health.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

/*
=================================================================
FIRST OBSERVATION: 8% OF 12 PODS IS ~1 POD (8.33%)
=================================================================
That ratio is the single most useful clue. An intermittent failure whose rate
matches 1/N almost always means ONE misconfigured or unhealthy instance, not
a logic bug. Confirm it before doing anything else.

=================================================================
CANDIDATE CAUSES, RANKED
=================================================================
1. CLOCK SKEW ON ONE POD
   One node's clock drifts ahead. Tokens that are still valid elsewhere look
   expired there. Exactly 1/N of requests fail.
   FIX: NTP/chrony on every node; 60s clock-skew tolerance in the validator.

2. STALE JWKS AFTER KEY ROTATION
   The auth server promoted a new kid; one pod's cache has not refreshed.
   Symptom: a burst of failures that clears by itself in ~5 minutes.
   FIX: correct rotation sequencing; refresh-ahead caching.

3. PARTIAL CONFIG ROLLOUT
   A rolling deploy left one pod with a different issuer-uri, audience or
   secret. Symptom: a CONSTANT 1/N failure rate that never clears.
   FIX: surface the config hash in /actuator/info and compare across pods.

4. CLIENT REFRESHES ONLY ON 401
   With a 15-minute TTL, every client fails exactly one request per 15
   minutes by design. At scale that is a steady background rate.
   FIX: refresh proactively at ~80% of the lifetime.

5. CONCURRENT REFRESH RACE
   Six parallel requests each trigger a rotation; five get a revoked token.
   FIX: single-flight refresh on the client, grace window on the server.

6. LOAD BALANCER / INGRESS
   Header stripped, or the token exceeds a header size limit on one path.
   FIX: check ingress config and large-header limits.
=================================================================
*/

/** Wrap the decoder: categorise, count and log every rejection - safely. */
@Component
public class InstrumentedJwtDecoder implements JwtDecoder {

    private final JwtDecoder delegate;
    private final MeterRegistry registry;
    private final String instanceId =
        Optional.ofNullable(System.getenv("HOSTNAME")).orElse("local");

    public InstrumentedJwtDecoder(JwtDecoder delegate, MeterRegistry registry) {
        this.delegate = delegate; this.registry = registry;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        Timer.Sample sample = Timer.start(registry);
        try {
            Jwt jwt = delegate.decode(token);
            sample.stop(registry.timer("jwt.validation", "result", "success"));

            // LEADING INDICATOR: tokens arriving close to expiry mean clients
            // are refreshing lazily, which produces cause #4.
            long secondsLeft = Duration.between(Instant.now(), jwt.getExpiresAt()).toSeconds();
            registry.summary("jwt.remaining.seconds").record(secondsLeft);
            if (secondsLeft < 30) {
                registry.counter("jwt.validation", "result", "near-expiry").increment();
            }
            return jwt;

        } catch (JwtException ex) {
            String reason = classify(ex);
            sample.stop(registry.timer("jwt.validation", "result", "failure",
                "reason", reason));
            registry.counter("jwt.rejected", "reason", reason, "instance", instanceId)
                    .increment();

            Diagnostics diagnostics = inspect(token);

            // Log the DIAGNOSTICS. NEVER the token - it is a live credential and
            // logs are widely readable, aggregated and retained.
            System.out.printf(
                "jwt rejected reason=%s instance=%s kid=%s alg=%s iss=%s aud=%s "
                + "exp=%d now=%d driftHint=%ds jti=%s sub=%s%n",
                reason, instanceId, diagnostics.kid(), diagnostics.alg(),
                diagnostics.iss(), diagnostics.aud(), diagnostics.exp(),
                Instant.now().getEpochSecond(),
                diagnostics.exp() - Instant.now().getEpochSecond(),
                diagnostics.jti(), diagnostics.sub());

            throw ex;
        }
    }

    private String classify(JwtException ex) {
        String message = String.valueOf(ex.getMessage()).toLowerCase(Locale.ROOT);
        if (message.contains("expired"))    return "expired";
        if (message.contains("signature"))  return "bad-signature";
        if (message.contains("audience"))   return "bad-audience";
        if (message.contains("issuer"))     return "bad-issuer";
        if (message.contains("kid") || message.contains("key")) return "unknown-kid";
        if (message.contains("revoked"))    return "revoked";
        if (message.contains("malformed"))  return "malformed";
        return "other";
    }

    record Diagnostics(String kid, String alg, String iss, String aud,
                       long exp, String jti, String sub) { }

    /** Decode WITHOUT verifying - diagnostics only. */
    private Diagnostics inspect(String token) {
        try {
            String[] parts = token.split("\\\\.");
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var header = mapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
            var payload = mapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            return new Diagnostics(
                header.path("kid").asText("?"), header.path("alg").asText("?"),
                payload.path("iss").asText("?"), payload.path("aud").toString(),
                payload.path("exp").asLong(), payload.path("jti").asText("?"),
                payload.path("sub").asText("?"));
        } catch (Exception e) {
            return new Diagnostics("?", "?", "?", "?", 0, "?", "?");
        }
    }
}

/** Detect the top two causes BEFORE users do. */
@Component
class AuthHealthIndicator implements HealthIndicator {

    private final String jwksUri;
    AuthHealthIndicator(
            @org.springframework.beans.factory.annotation.Value("\${app.jwks-uri}")
            String jwksUri) {
        this.jwksUri = jwksUri;
    }

    @Override public Health health() {
        Health.Builder builder = Health.up();
        try {
            var client = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build();
            long start = System.currentTimeMillis();
            var response = client.send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create(jwksUri)).build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());

            builder.withDetail("jwksStatus", response.statusCode())
                   .withDetail("jwksLatencyMs", System.currentTimeMillis() - start);

            // Extract the published kids so you can diff them across pods.
            var keys = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(response.body()).path("keys");
            List<String> kids = new ArrayList<>();
            keys.forEach(k -> kids.add(k.path("kid").asText()));
            builder.withDetail("knownKids", kids);

            // CLOCK SKEW: compare our clock with the auth server's Date header.
            response.headers().firstValue("Date").ifPresent(date -> {
                long serverEpoch = ZonedDateTime
                    .parse(date, java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME)
                    .toEpochSecond();
                long drift = Math.abs(serverEpoch - Instant.now().getEpochSecond());
                builder.withDetail("clockDriftSeconds", drift);
                if (drift > 30) builder.down().withDetail("problem", "clock skew");
            });

            if (response.statusCode() != 200) builder.down();
        } catch (Exception e) {
            return Health.down().withDetail("jwks", "unreachable")
                .withDetail("error", e.getClass().getSimpleName()).build();
        }
        return builder.build();
    }
}

/*
=================================================================
THE TRIAGE RUNBOOK
=================================================================
1. Is it one pod?
     sum by (instance) (rate(jwt_rejected_total[5m]))
   One instance dominating -> config or clock. Evenly spread -> client-side.

2. Which reason?
     sum by (reason) (rate(jwt_rejected_total[5m]))
     expired       -> clock skew, or lazy client refresh
     unknown-kid   -> stale JWKS after rotation
     bad-signature -> mismatched secret / wrong issuer on some pods
     bad-audience  -> a client calling the wrong service

3. Compare the pods
     kubectl get pods -o name | xargs -I{} kubectl exec {} -- \\
       curl -s localhost:8080/actuator/health | jq '.components.auth.details'
   Diff knownKids and clockDriftSeconds across all twelve.

4. Clocks
     kubectl get nodes -o name | xargs -I{} kubectl debug {} -- date +%s

5. Reproduce with the real token (from the user's network tab, never a log)
     curl -i -H "Authorization: Bearer <token>" https://api/...
   Read WWW-Authenticate: it usually names the exact cause.

=================================================================
THE FIXES
=================================================================
clock skew        chrony/NTP on all nodes; clockSkewSeconds(60) in the validator
stale JWKS        refresh-ahead cache, rate-limited; correct rotation sequencing
config drift      config hash in /actuator/info; fail startup on a missing
                  issuer-uri rather than defaulting
lazy refresh      client refreshes at 80% of TTL, not on 401
refresh race      single-flight on the client + a server-side grace window
ingress           check header stripping and large-header limits

=================================================================
ALERTS TO ADD AFTERWARDS
=================================================================
  rate(jwt_rejected_total{reason="expired"})        > baseline x3
  rate(jwt_rejected_total{reason="unknown-kid"})    > 0        (page)
  max by (instance) (auth_clock_drift_seconds)      > 10
  stddev by (instance) (rate(jwt_rejected_total))   > 0        (one bad pod)
*/`,
    solutionLanguage: "java",
    discussion:
      "The opening move is the whole answer in miniature: 8% across 12 pods is 1/12, so before touching any code you should suspect a single bad instance. That arithmetic instinct — matching the failure *rate* to the fleet topology — is what experienced operators do first. Beyond that, the marks are for instrumentation design rather than guesswork: a counter tagged by `reason` **and** `instance` turns a week-long mystery into a thirty-second dashboard read, and the reason buckets map one-to-one onto distinct root causes (expired → clock or lazy refresh; unknown-kid → stale JWKS; bad-signature → config drift). Two professional details worth stating explicitly: never log the token, because it is a live credential and logs are aggregated, retained and broadly readable — log `jti`, `kid`, `sub` and `exp` instead; and comparing your clock against the auth server's `Date` response header is a free, continuous skew detector you can wire straight into a health indicator. Finish with the preventive measures, especially proactive client refresh at 80% of TTL, which eliminates an entire class of 401s by design.",
    relatedQuestionIds: ["b138", "b133", "b129"],
  },

  /* ================================================================ */
  /* SQL & JPA                                                         */
  /* ================================================================ */
  {
    id: "p42",
    topic: "sql-jpa",
    title: "Find and fix an N+1 query in a JPA repository",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "An `/orders` endpoint lists 50 orders and, for each, renders its line items. Latency is 800ms and the SQL log shows 51 queries: one for the orders and one per order for its items.\n\n" +
      "Fix the N+1 without breaking pagination, and explain the trade-offs of each approach.",
    tasks: [
      "Explain why a `LAZY` `@OneToMany` produces 51 queries when the view touches `order.getItems()`.",
      "Rewrite the fetch using a `JOIN FETCH` (or an entity graph) so the items load in one round trip.",
      "Explain why `JOIN FETCH` + `setFirstResult/setMaxResults` pagination is dangerous, and give a safe alternative.",
      "Show how `@BatchSize` / `hibernate.default_batch_fetch_size` reduces N+1 to a handful of `IN` queries.",
    ],
    starterCode: `@Entity
class Order {
    @Id Long id;
    @OneToMany(mappedBy = "order") // LAZY by default
    List<OrderItem> items;
}

interface OrderRepository extends JpaRepository<Order, Long> {
    // TODO: fetch items efficiently
}`,
    hints: [
      "LAZY collections initialize on first access — one extra SELECT per parent row.",
      "JOIN FETCH multiplies the result set, so paginating in the DB no longer maps 1:1 to parent rows; Hibernate warns and paginates in memory.",
      "Batch fetching keeps the collection lazy but loads many parents' children with a single `WHERE id IN (...)`.",
    ],
    solution: `// Option A: JOIN FETCH for a bounded, non-paginated fetch
interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("select distinct o from Order o join fetch o.items where o.id in :ids")
    List<Order> findWithItems(@Param("ids") List<Long> ids);

    // Option B: entity graph keeps the derived-query name, adds the fetch plan
    @EntityGraph(attributePaths = "items")
    List<Order> findByStatus(String status);
}

// Safe pagination WITHOUT JOIN FETCH: page the parents first, then batch-fetch children.
// application.yml:
//   spring.jpa.properties.hibernate.default_batch_fetch_size: 100
//
// Page<Order> page = repo.findAll(PageRequest.of(0, 50));   // 1 query, correct paging
// page.forEach(o -> o.getItems().size());                    // ~1 batched IN query, not 50

// Why JOIN FETCH + pagination is wrong:
//   select ... from orders o join order_items i ...  LIMIT 50
// The LIMIT applies to the JOINED rows, not to orders, so you get a partial/incorrect
// page. Hibernate detects a fetch join with pagination and pulls ALL rows into memory
// then paginates there (HHH000104) — an OOM risk on large tables.`,
    solutionLanguage: "java",
    discussion:
      "N+1 is the single most common performance bug in JPA apps, so interviewers love it. The signal they want: you can read the SQL log, recognize the 1+N pattern, and reach for the right tool for the situation rather than blindly adding `JOIN FETCH` everywhere. The subtle, senior point is that `JOIN FETCH` and pagination do not mix — the LIMIT applies to the Cartesian-product rows, so Hibernate silently paginates in memory (the HHH000104 warning). The clean answer for a paginated list is to page the parent IDs in the database, then let batch fetching (`default_batch_fetch_size`) load the children with a bounded number of `IN` queries. Mentioning DTO projections for read-only views, and `distinct` to collapse duplicated parents, shows real depth.",
    relatedQuestionIds: ["b139"],
  },

  /* ================================================================ */
  /* HTTP & REST                                                       */
  /* ================================================================ */
  {
    id: "p43",
    topic: "http-rest",
    title: "Design an idempotent payment endpoint",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "Clients retry `POST /payments` on network timeouts. Today a retry can charge the customer twice. Make the endpoint safe to retry while keeping the semantics of `POST`.\n\n" +
      "Design the contract, the storage, and the status codes for first-call vs replayed-call.",
    tasks: [
      "Define an `Idempotency-Key` header contract and explain who generates the key and its lifetime.",
      "Describe the server-side store that maps key -> saved response, and how concurrent duplicates are handled.",
      "Return the correct status codes: the real result on the first call, the same result on a replay.",
      "Explain why PUT/GET/DELETE are naturally idempotent but POST is not, and where retries are safe.",
    ],
    hints: [
      "Store the key with a uniqueness constraint so the second concurrent insert fails fast instead of double-charging.",
      "Persist the final response body + status against the key so a replay returns the identical result.",
      "A replay should not re-execute the side effect; it should return the recorded outcome.",
    ],
    solution: `// Contract: client sends a stable key it can safely resend on retry.
//   POST /payments
//   Idempotency-Key: 8f14e45f-ea6e-4b...   (client-generated, per logical request)

@PostMapping("/payments")
ResponseEntity<PaymentResult> pay(@RequestHeader("Idempotency-Key") String key,
                                  @Valid @RequestBody PaymentRequest req) {

    // 1) Try to claim the key. UNIQUE constraint => only ONE request wins the race.
    Optional<IdempotencyRecord> existing = store.find(key);
    if (existing.isPresent()) {
        IdempotencyRecord r = existing.get();
        // Replay: return the recorded outcome, do NOT charge again.
        return ResponseEntity.status(r.status()).body(r.body());
    }

    try {
        store.claim(key);                         // INSERT ... may throw on duplicate
    } catch (DuplicateKeyException race) {
        IdempotencyRecord r = store.find(key).orElseThrow();
        return ResponseEntity.status(r.status()).body(r.body());
    }

    // 2) First time only: perform the side effect exactly once.
    PaymentResult result = gateway.charge(req);   // the real charge
    store.save(key, 201, result);                 // persist outcome for future replays
    return ResponseEntity.status(HttpStatus.CREATED).body(result);
}`,
    solutionLanguage: "java",
    discussion:
      "This is a favourite systems-design-in-the-small question because it forces you to reason about retries, races, and HTTP semantics at once. The core insight is that idempotency for POST is not automatic — you engineer it by attaching a client-supplied key and recording the outcome so replays return the stored result instead of re-running the side effect. The senior details are the concurrency story (a database uniqueness constraint turns a double-charge race into a fast failure the loser can convert into a replay) and correct status codes (the first call returns the true result; a replay returns the same one). Contrast with PUT/DELETE, which are idempotent by definition, and note a sensible TTL for keys so the store does not grow forever.",
    relatedQuestionIds: [],
  },

  /* ================================================================ */
  /* Testing                                                          */
  /* ================================================================ */
  {
    id: "p44",
    topic: "testing",
    title: "Write a focused @WebMvcTest slice for a controller",
    difficulty: "easy",
    estimatedMinutes: 25,
    scenario:
      "A `UserController` validates input and delegates to a `UserService`. You want fast tests of the HTTP layer — status codes, JSON shape, validation errors — without booting the whole context or hitting a database.\n\n" +
      "Write the slice test and explain why it is faster and more focused than `@SpringBootTest`.",
    tasks: [
      "Use `@WebMvcTest(UserController.class)` and `MockMvc`; mock the service with `@MockBean`.",
      "Assert a 201 with the created body on a valid POST.",
      "Assert a 400 with field errors on an invalid POST (blank name).",
      "Explain what `@WebMvcTest` loads and does NOT load, and when you would use `@SpringBootTest` instead.",
    ],
    starterCode: `@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserService service;
    // TODO: tests
}`,
    hints: [
      "@WebMvcTest loads only the MVC layer (controllers, filters, Jackson, validation) — no services, no repositories.",
      "Stub the mocked service with Mockito's when(...).thenReturn(...).",
      "Use jsonPath to assert the response body and the validation error structure.",
    ],
    solution: `@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockBean UserService service;   // the ONLY collaborator, mocked

    @Test
    void createsUser() throws Exception {
        when(service.create(any())).thenReturn(new User(1L, "Ada"));

        mvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Ada"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Ada"));
    }

    @Test
    void rejectsBlankName() throws Exception {
        mvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\\"name\\":\\"\\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("name"));

        verifyNoInteractions(service);   // validation failed before the service ran
    }
}`,
    solutionLanguage: "java",
    discussion:
      "The interviewer is checking whether you know Spring's test slices and choose the smallest one that proves the behaviour. `@WebMvcTest` boots only the web layer — controllers, `@ControllerAdvice`, Jackson, converters and validation — with everything else mocked, so it starts in a fraction of the time of a full `@SpringBootTest` and fails for one clear reason. The strong candidate articulates the boundary: use `@WebMvcTest` for request mapping, serialization, status codes and validation; `@DataJpaTest` for repository/query behaviour against an embedded or Testcontainers database; and reserve `@SpringBootTest` for a few true end-to-end wiring tests. Verifying `verifyNoInteractions(service)` on the validation path is a nice touch that proves the request was rejected before business logic ran.",
    relatedQuestionIds: [],
  },

  /* ================================================================ */
  /* Messaging & Caching                                              */
  /* ================================================================ */
  {
    id: "p45",
    topic: "messaging-caching",
    title: "Make a Kafka consumer safe against duplicates and poison messages",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "A consumer processes `OrderPlaced` events. At-least-once delivery means messages can arrive more than once, and one malformed message currently blocks the whole partition by being retried forever.\n\n" +
      "Make processing idempotent and route un-processable messages aside so the partition keeps moving.",
    tasks: [
      "Explain why at-least-once delivery makes consumers responsible for deduplication.",
      "Make the handler idempotent using the event's unique id (processed-ids table or upsert).",
      "Add bounded retries with backoff, then route to a dead-letter topic instead of blocking the partition.",
      "Explain when to commit offsets so a crash mid-processing does not lose or double-apply a message.",
    ],
    hints: [
      "Idempotency key = the business event id; record it in the same transaction as the side effect.",
      "A poison message must not be retried indefinitely — cap attempts and DLQ it.",
      "Commit the offset only after the side effect + dedup record are durably written.",
    ],
    solution: `@Component
class OrderConsumer {

    private final ProcessedEventRepo processed;   // stores handled event ids
    private final OrderService orders;

    // Bounded retry, then dead-letter — the partition never stalls on a poison message.
    @RetryableTopic(attempts = "4",
                    backoff = @Backoff(delay = 1000, multiplier = 2.0),
                    dltStrategy = DltStrategy.FAIL_ON_ERROR)
    @KafkaListener(topics = "order-placed", groupId = "billing")
    @Transactional
    public void handle(OrderPlaced event) {
        // Idempotency: skip if we've already applied this event id.
        if (processed.existsById(event.id())) return;

        orders.bill(event);                 // the side effect
        processed.save(new ProcessedEvent(event.id()));   // same tx as the side effect
        // Offset is committed by the container AFTER this method returns successfully.
    }

    @DltHandler
    public void onDlt(OrderPlaced event, @Header(KafkaHeaders.EXCEPTION_MESSAGE) String err) {
        alerting.raise("order-placed poison message " + event.id() + ": " + err);
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This problem separates people who have run Kafka in production from people who have only read about it. The two non-negotiables are idempotency and poison-message handling. Because Kafka gives at-least-once delivery by default, the consumer — not the broker — owns deduplication; recording the event id in the same transaction as the side effect makes reprocessing a no-op. The second insight is that a message that can never succeed must not be retried forever, or it head-of-line-blocks its entire partition; `@RetryableTopic` gives bounded exponential backoff and then a dead-letter topic so the rest of the stream keeps flowing. Finishing with offset-commit timing (commit only after durable success) and a note that exactly-once needs the transactional producer/consumer shows complete command of the delivery-semantics spectrum.",
    relatedQuestionIds: [],
  },

  /* ================================================================ */
  /* Production ops                                                   */
  /* ================================================================ */
  {
    id: "p46",
    topic: "production-ops",
    title: "Wire health checks and graceful shutdown for zero-downtime deploys",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "During rolling deploys the service drops in-flight requests and briefly returns errors because Kubernetes routes traffic to pods that are not ready and kills pods that are still working.\n\n" +
      "Configure readiness/liveness probes and graceful shutdown so deploys are seamless.",
    tasks: [
      "Explain the difference between liveness and readiness probes and the failure mode of confusing them.",
      "Expose Actuator's readiness/liveness groups and point the Kubernetes probes at them.",
      "Enable graceful shutdown so in-flight requests finish before the JVM exits.",
      "Explain why a preStop delay + readiness flip prevents the load balancer from sending traffic to a terminating pod.",
    ],
    hints: [
      "Liveness failing => the pod is RESTARTED; readiness failing => it is only removed from the load balancer.",
      "Spring Boot has built-in liveness/readiness groups under /actuator/health.",
      "server.shutdown=graceful drains the request thread pool up to a timeout.",
    ],
    solution: `# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true          # exposes /actuator/health/liveness and /readiness
server:
  shutdown: graceful           # finish in-flight requests before exit
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s

# Kubernetes deployment (excerpt)
# readinessProbe:  { httpGet: { path: /actuator/health/readiness, port: 8080 } }
# livenessProbe:   { httpGet: { path: /actuator/health/liveness,  port: 8080 } }
# lifecycle:
#   preStop:
#     exec: { command: ["sh","-c","sleep 5"] }   # let readiness flip + LB deregister
# terminationGracePeriodSeconds: 40              # >= shutdown timeout

# Sequence on shutdown:
#  1. Pod marked Terminating -> readiness fails -> removed from Service endpoints.
#  2. preStop sleep gives the LB time to stop routing new requests.
#  3. SIGTERM -> Spring graceful shutdown drains in-flight requests.
#  4. JVM exits before terminationGracePeriodSeconds elapses (no SIGKILL).`,
    solutionLanguage: "yaml",
    discussion:
      "Zero-downtime deploys are where 'it works on my machine' meets orchestration reality, so this is a strong ops signal. The first thing to get right is the probe semantics: liveness answers 'is the process wedged and in need of a restart?' while readiness answers 'should traffic be sent right now?'. Wiring liveness to a slow dependency is a classic outage amplifier — a blip restarts every pod. The second is the shutdown choreography: flipping readiness first (plus a short preStop delay) lets the load balancer deregister the pod before SIGTERM, and Spring's graceful shutdown then drains in-flight requests within a grace period larger than the shutdown timeout so the kubelet never has to SIGKILL. Being able to narrate that four-step termination sequence is exactly what the interviewer is listening for.",
    relatedQuestionIds: [],
  },

  /* ================================================================ */
  /* Core Java language & modern features                             */
  /* ================================================================ */
  {
    id: "p47",
    topic: "core-java-lang",
    title: "Model a domain with records, sealed types and pattern matching",
    difficulty: "medium",
    estimatedMinutes: 30,
    scenario:
      "You are modelling the result of a payment attempt. It is exactly one of: Approved (with an auth code), Declined (with a reason), or Error (with an exception). Callers must handle every case.\n\n" +
      "Use modern Java (records + sealed interface + switch pattern matching) to make illegal states unrepresentable and the handling exhaustive.",
    tasks: [
      "Declare a `sealed interface PaymentResult permits ...` with a `record` per case.",
      "Explain how records give you immutability, equals/hashCode and a canonical constructor for free.",
      "Write a `switch` with record-deconstruction patterns that returns a user message.",
      "Explain why the compiler can prove the switch is exhaustive (no default needed).",
    ],
    starterCode: `sealed interface PaymentResult permits /* TODO */ {}
// TODO: records + a switch that handles every case`,
    hints: [
      "A sealed type restricts its implementations to a known set, which the switch can enumerate.",
      "Record patterns let you destructure the components directly in the case label.",
      "If every permitted subtype is covered, the switch is exhaustive and needs no default.",
    ],
    solution: `sealed interface PaymentResult
        permits Approved, Declined, Error {}

record Approved(String authCode)          implements PaymentResult {}
record Declined(String reason)            implements PaymentResult {}
record Error(Throwable cause)             implements PaymentResult {}

class Messages {
    // Exhaustive switch with record-deconstruction patterns (Java 21).
    static String describe(PaymentResult result) {
        return switch (result) {
            case Approved(var code)   -> "Approved, auth " + code;
            case Declined(var reason) -> "Declined: " + reason;
            case Error(var cause)     -> "Payment error: " + cause.getMessage();
            // No default: the compiler knows the permitted set is complete.
            // Add a 4th permitted subtype and this switch fails to compile
            // until you handle it — illegal states become compile errors.
        };
    }
}`,
    solutionLanguage: "java",
    discussion:
      "This exercise checks whether you can use modern Java to encode a domain rather than reaching for enums-plus-nullable-fields or an inheritance hierarchy with instanceof chains. The payoff of a sealed interface is exhaustiveness: because the permitted implementations are known at compile time, a pattern-matching `switch` needs no `default`, and adding a new case turns every unhandled `switch` into a compile error — the compiler becomes your checklist. Records supply immutability, value-based `equals`/`hashCode`, `toString` and a canonical constructor (where you can validate invariants) for almost no code. Naming record deconstruction patterns and contrasting this with the old visitor pattern or `instanceof` ladders demonstrates fluency with Java 17–21 idioms, which is exactly what a senior interview is probing.",
    relatedQuestionIds: [],
  },

  /* ================================================================ */
  /* Streams & generics                                              */
  /* ================================================================ */
  {
    id: "p48",
    topic: "streams-generics",
    title: "Aggregate data with Collectors (groupingBy + downstream)",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "Given a list of `Sale(region, product, amount)`, produce several reports in single passes: total revenue per region, the set of products sold per region, and the highest single sale per region.\n\n" +
      "Do it with the Streams `Collectors` API and avoid manual mutable maps.",
    tasks: [
      "Compute `Map<String, Double>` of total amount per region with `groupingBy` + `summingDouble`.",
      "Compute `Map<String, Set<String>>` of products per region with a downstream `mapping` + `toSet`.",
      "Compute the max sale per region with `maxBy` and unwrap the resulting `Optional`.",
      "Explain why `toMap` needs a merge function and how downstream collectors compose.",
    ],
    hints: [
      "The second argument to groupingBy is itself a collector applied per group.",
      "mapping(fn, toSet()) transforms elements before collecting them into each group.",
      "collectingAndThen can unwrap the Optional that maxBy produces.",
    ],
    solution: `record Sale(String region, String product, double amount) {}

// Total revenue per region
Map<String, Double> revenue = sales.stream()
    .collect(Collectors.groupingBy(Sale::region,
             Collectors.summingDouble(Sale::amount)));

// Distinct products per region (downstream mapping -> set)
Map<String, Set<String>> products = sales.stream()
    .collect(Collectors.groupingBy(Sale::region,
             Collectors.mapping(Sale::product, Collectors.toSet())));

// Highest single sale per region, Optional unwrapped via collectingAndThen
Map<String, Sale> topSale = sales.stream()
    .collect(Collectors.groupingBy(Sale::region,
             Collectors.collectingAndThen(
                 Collectors.maxBy(Comparator.comparingDouble(Sale::amount)),
                 Optional::orElseThrow)));

// toMap needs a merge function when keys can collide:
Map<String, Double> byProduct = sales.stream()
    .collect(Collectors.toMap(Sale::product, Sale::amount, Double::sum)); // merge!`,
    solutionLanguage: "java",
    discussion:
      "Aggregation with `Collectors` is one of the most common live-coding tasks for backend roles, and it separates people who write imperative loops with mutable maps from people fluent in the functional toolkit. The key concept is the downstream collector: `groupingBy` partitions the stream, and its second argument decides how each group is summarized — `counting`, `summingDouble`, `mapping(...).toSet()`, or a nested `groupingBy` for two-level reports. Two details mark a strong answer: `collectingAndThen` to post-process (here unwrapping the `Optional` from `maxBy`), and knowing that `toMap` throws `IllegalStateException` on duplicate keys unless you supply a merge function. Being able to build these one-pass aggregations without a single explicit `Map.put` is the fluency the interviewer is looking for.",
    relatedQuestionIds: ["b235", "b236"],
  },

  /* ================================================================ */
  /* JVM internals & advanced concurrency                            */
  /* ================================================================ */
  {
    id: "p49",
    topic: "jvm",
    title: "Diagnose an OutOfMemoryError from a heap dump",
    difficulty: "hard",
    estimatedMinutes: 35,
    scenario:
      "A service crashes every few days with `OutOfMemoryError: Java heap space`. Restarts fix it temporarily, and heap usage climbs steadily between restarts. You suspect a leak.\n\n" +
      "Lay out how you capture and analyze the evidence, and identify the classic culprit in the starter code.",
    tasks: [
      "Configure the JVM to capture a heap dump automatically on OOM.",
      "Describe how you would analyze the dump in Eclipse MAT (dominator tree, path to GC roots).",
      "Identify the leak in the starter code and explain why the GC cannot reclaim it.",
      "Fix it with a bounded cache and explain how you would confirm the fix.",
    ],
    starterCode: `class PriceCache {
    // Grows forever: every distinct key is retained for the life of the JVM.
    private static final Map<String, Price> CACHE = new HashMap<>();
    static Price get(String sku) {
        return CACHE.computeIfAbsent(sku, PriceCache::load);
    }
}`,
    hints: [
      "-XX:+HeapDumpOnOutOfMemoryError writes a .hprof you can open in MAT.",
      "A leak means objects are still reachable from a GC root; the dominator tree shows the biggest retainer.",
      "An unbounded static map is reachable forever — nothing can evict entries.",
    ],
    solution: `# 1) Capture evidence automatically on the next crash
JAVA_OPTS="-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/dumps"
# or on demand:  jmap -dump:live,format=b,file=heap.hprof <pid>

# 2) Analyze in Eclipse MAT
#    - Leak Suspects report -> flags the dominant retainer
#    - Dominator Tree       -> PriceCache.CACHE retains ~90% of the heap
#    - Path to GC Roots     -> held by a static field (a GC root) => never collectible

// 3) The leak: a static, unbounded HashMap. Static => reachable from a GC root for
//    the whole JVM lifetime; unbounded => entries are only ever added, never evicted.
//    The GC works perfectly; the objects are simply still referenced.

// 4) Fix: a bounded cache with size + TTL eviction (Caffeine).
class PriceCache {
    private static final Cache<String, Price> CACHE = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .build();
    static Price get(String sku) { return CACHE.get(sku, PriceCache::load); }
}
// Confirm: watch old-gen usage after full GCs flatten instead of trending up,
// and re-run a load test / take a follow-up heap dump to verify the retainer is gone.`,
    solutionLanguage: "java",
    discussion:
      "Memory-leak triage is a rite of passage, and interviewers want a methodical evidence-driven process, not guesswork. The strong answer starts by making the next failure diagnosable (`-XX:+HeapDumpOnOutOfMemoryError`), then reads the heap dump in MAT: the dominator tree names the object retaining the most memory, and 'path to GC roots' proves why it survives — here a `static` field, which is itself a GC root, pins the map for the JVM's whole life. The conceptual point worth stating out loud is that Java 'leaks' are not GC failures; they are unintended reachability. The fix is to bound the cache with a size cap and TTL, and — crucially — to verify: healthy heaps show old-gen usage flattening after full GCs rather than a monotonic climb. That capture-analyze-fix-verify loop is the whole signal.",
    relatedQuestionIds: ["b242", "b245"],
  },

  /* ================================================================ */
  /* Spring web pipeline, AOP & operations                           */
  /* ================================================================ */
  {
    id: "p50",
    topic: "spring-web-ops",
    title: "Add a request correlation id across the whole pipeline",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "Debugging production is painful because a single request's log lines cannot be tied together, and the id is lost when the app calls a downstream service.\n\n" +
      "Add a correlation id that appears on every log line for a request and propagates to downstream calls.",
    tasks: [
      "Add a `OncePerRequestFilter` that reads `X-Trace-Id` or generates one, and stores it in the SLF4J MDC.",
      "Configure the Logback pattern so every line includes the id.",
      "Clear the MDC in a `finally` and explain why this is mandatory in a thread pool.",
      "Propagate the id on outbound calls via a `RestClient`/`RestTemplate` interceptor.",
    ],
    starterCode: `@Component
class TraceIdFilter extends OncePerRequestFilter {
    // TODO: set MDC, ensure cleanup, propagate
}`,
    hints: [
      "OncePerRequestFilter runs before the controller and sees every request.",
      "%X{traceId} in the Logback pattern injects the MDC value.",
      "Pooled threads are reused, so a stale MDC value leaks into the next request unless you remove it.",
    ],
    solution: `@Component
class TraceIdFilter extends OncePerRequestFilter {
    static final String HEADER = "X-Trace-Id";
    static final String KEY = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String traceId = Optional.ofNullable(req.getHeader(HEADER))
                                 .filter(s -> !s.isBlank())
                                 .orElse(UUID.randomUUID().toString());
        MDC.put(KEY, traceId);
        res.setHeader(HEADER, traceId);          // echo back for the client
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove(KEY);                     // MUST clear: pooled threads are reused
        }
    }
}

// Propagate downstream so the trace spans services
@Bean
RestClient restClient(RestClient.Builder builder) {
    return builder.requestInterceptor((request, body, execution) -> {
        String id = MDC.get(TraceIdFilter.KEY);
        if (id != null) request.getHeaders().add(TraceIdFilter.HEADER, id);
        return execution.execute(request, body);
    }).build();
}

// logback-spring.xml pattern:
//   %d %-5level [%X{traceId}] %logger{20} - %msg%n`,
    solutionLanguage: "java",
    discussion:
      "Correlation ids are the cheapest observability win in a distributed system, and this exercise tests whether you understand the Spring request pipeline and the MDC's threading model. The right extension point is a `OncePerRequestFilter`, because it runs before the controller and wraps the whole request, so the id is present for every log line the request produces via the `%X{traceId}` pattern. The detail that trips people up — and the one interviewers wait for — is clearing the MDC in a `finally`: request threads come from a pool and are reused, so a value left behind bleeds into an unrelated later request. Extending the id across service boundaries with an outbound interceptor (and mentioning that Micrometer Tracing / OpenTelemetry automate all of this and link logs to traces) rounds out a complete, production-minded answer.",
    relatedQuestionIds: ["b248", "b249"],
  },

  /* ================================================================ */
  /* Application security hardening                                   */
  /* ================================================================ */
  {
    id: "p51",
    topic: "security-hardening",
    title: "Serve a user file download without a path-traversal hole",
    difficulty: "medium",
    estimatedMinutes: 25,
    scenario:
      "An endpoint `GET /files?name=...` returns a file from an uploads directory. A pentester reports that `name=../../../../etc/passwd` leaks system files.\n\n" +
      "Close the path-traversal vulnerability and explain the general defensive principle.",
    tasks: [
      "Explain how `../` sequences escape the intended base directory.",
      "Canonicalize the resolved path and verify it stays inside the base directory.",
      "Add allowlist validation of the filename so obviously bad input is rejected early.",
      "Explain why mapping an opaque id to a stored path is even safer than accepting a filename.",
    ],
    starterCode: `@GetMapping("/files")
ResponseEntity<Resource> download(@RequestParam String name) throws IOException {
    Path file = Paths.get("/data/uploads", name);   // VULNERABLE: name may contain ../
    return ResponseEntity.ok(new UrlResource(file.toUri()));
}`,
    hints: [
      "resolve(userInput) will happily walk up the tree with ../.",
      "normalize() collapses .. and . so you can compare against the base.",
      "Check the canonical path startsWith the canonical base directory.",
    ],
    solution: `private static final Path BASE = Paths.get("/data/uploads").toAbsolutePath().normalize();

@GetMapping("/files")
ResponseEntity<Resource> download(@RequestParam String name) throws IOException {
    // 1) Allowlist: reject anything that isn't a simple filename.
    if (!name.matches("[A-Za-z0-9._-]{1,100}") || name.contains("..")) {
        return ResponseEntity.badRequest().build();
    }

    // 2) Resolve + canonicalize, then CONTAINMENT check against the base dir.
    Path target = BASE.resolve(name).normalize();
    if (!target.startsWith(BASE)) {              // blocks ../../ escapes definitively
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    if (!Files.isReadable(target)) return ResponseEntity.notFound().build();

    Resource body = new UrlResource(target.toUri());
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\\"" + name + "\\"")
        .body(body);
}

// Safest of all: never accept a path. Store files keyed by an opaque id and look up
// the real location server-side:  GET /files/{id} -> repo.find(id).storagePath()`,
    solutionLanguage: "java",
    discussion:
      "Path traversal is a perennial OWASP entry, and this task checks whether you truly understand the fix rather than pattern-matching on `..`. The robust defence is containment: resolve the user input against a fixed base, canonicalize with `normalize()` so any `..` segments are collapsed, and then assert the result still `startsWith` the base directory — a blocklist of `../` alone is bypassable via encodings and absolute paths. Layering an allowlist regex on the filename rejects junk early and cheaply. The senior insight to voice is that the best way to avoid the whole class of bug is to not let the client name a path at all: expose an opaque id that the server maps to a stored location. Tying this back to the general principle — validate/allowlist on input, and never trust client-supplied paths — shows security maturity beyond the single endpoint.",
    relatedQuestionIds: ["b257"],
  },
];

/* ------------------------------------------------------------------ */
/* Derived views                                                       */
/* ------------------------------------------------------------------ */

export const PRACTICE_PROBLEMS_BY_TOPIC: Record<string, BackendPracticeProblem[]> =
  BACKEND_TOPICS.reduce(
    (accumulator, topic) => {
      accumulator[topic.id] = BACKEND_PRACTICE_PROBLEMS.filter(
        (problem) => problem.topic === topic.id,
      );
      return accumulator;
    },
    {} as Record<string, BackendPracticeProblem[]>,
  );

export const PRACTICE_PROBLEM_BY_ID: Record<string, BackendPracticeProblem> =
  Object.fromEntries(BACKEND_PRACTICE_PROBLEMS.map((problem) => [problem.id, problem]));

export const PRACTICE_PROBLEM_COUNT = BACKEND_PRACTICE_PROBLEMS.length;

export const PRACTICE_TOTAL_MINUTES = BACKEND_PRACTICE_PROBLEMS.reduce(
  (total, problem) => total + problem.estimatedMinutes,
  0,
);

export function getPracticeProblemsForTopic(topicId: string): BackendPracticeProblem[] {
  return PRACTICE_PROBLEMS_BY_TOPIC[topicId] ?? [];
}

if (import.meta.env?.DEV) {
  const problems: string[] = [];
  const seen = new Set<string>();
  const knownTopics = new Set(BACKEND_TOPICS.map((topic) => topic.id));

  for (const problem of BACKEND_PRACTICE_PROBLEMS) {
    if (seen.has(problem.id)) problems.push(`Duplicate practice id "${problem.id}".`);
    seen.add(problem.id);
    if (!knownTopics.has(problem.topic)) {
      problems.push(`Practice "${problem.id}" has unknown topic "${problem.topic}".`);
    }
    if (problem.tasks.length === 0) problems.push(`Practice "${problem.id}" has no tasks.`);
    if (problem.hints.length === 0) problems.push(`Practice "${problem.id}" has no hints.`);
    if (!problem.solution.trim()) problems.push(`Practice "${problem.id}" has no solution.`);
  }

  if (problems.length > 0) {
    console.error(`[backendInterview/practice] issues:\n - ${problems.join("\n - ")}`);
  }
}
