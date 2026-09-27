import { defineBackendChunk } from "./contract";

/**
 * Java Annotations — theory and internals (b001–b016).
 *
 * Everything a framework author needs: what the compiler emits, retention,
 * targets, meta-annotations, reflection lookup cost, annotation processors,
 * repeatable/type annotations and the built-in annotation set.
 */
export const chunk01JavaAnnotations = defineBackendChunk({
  topic: "java-annotations",
  questions: [
    {
      id: "b001",
      question: "What is an annotation in Java and what does the compiler actually generate for it?",
      answer:
        "An annotation is **metadata attached to a program element** — a class, method, field, parameter, constructor, local variable, package, module or (since Java 8) a type use. It has no behaviour of its own. It is a passive marker that something else — the compiler, an annotation processor, a bytecode weaver or a runtime framework — chooses to read and act on.\n\n" +
        "Under the hood an annotation type is a **special kind of interface**. When you write `public @interface Loggable { ... }` the compiler emits a normal interface that implicitly extends `java.lang.annotation.Annotation`. Its methods are the annotation's attributes: the return type is the attribute type, the method name is the attribute name, and `default` supplies the default value.\n\n" +
        "What ends up in the class file:\n\n" +
        "- **SOURCE retention** — nothing. The annotation is discarded after the compiler (and any annotation processor) has seen it. `@Override` is the classic example.\n" +
        "- **CLASS retention** (the default) — written into a `RuntimeInvisibleAnnotations` attribute. It is in the `.class` file so bytecode tools like Lombok, JaCoCo or a Gradle plugin can read it, but the JVM does not expose it to reflection.\n" +
        "- **RUNTIME retention** — written into a `RuntimeVisibleAnnotations` attribute and exposed through `AnnotatedElement.getAnnotation(...)`. This is the only policy Spring, JPA, Jackson and JUnit can use.\n\n" +
        "**The interview point:** annotations do nothing by themselves. `@Transactional` on a method is inert until a Spring `BeanPostProcessor` finds it and wraps the bean in a proxy. If you can say that sentence you have said the thing they are listening for.",
      code: `import java.lang.annotation.*;

// A custom annotation is compiled to an interface extending Annotation.
@Retention(RetentionPolicy.RUNTIME)     // keep it readable via reflection
@Target({ElementType.METHOD, ElementType.TYPE})
@Documented
@Inherited                              // subclasses inherit it (TYPE only)
public @interface Audited {
    String value() default "";          // 'value' can be set positionally
    String actor() default "system";
    AuditLevel level() default AuditLevel.INFO;
    String[] tags() default {};
}

enum AuditLevel { INFO, WARN, CRITICAL }

class PaymentService {
    @Audited("refund")                                    // uses value()
    void refund(String orderId) { /* ... */ }

    @Audited(value = "capture", level = AuditLevel.CRITICAL, tags = {"money", "pci"})
    void capture(String orderId) { /* ... */ }
}

class AuditScanner {
    static void scan(Class<?> type) {
        for (var m : type.getDeclaredMethods()) {
            Audited a = m.getAnnotation(Audited.class);   // null unless RUNTIME
            if (a != null) {
                System.out.printf("%s -> %s [%s]%n", m.getName(), a.value(), a.level());
            }
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Annotations are inert metadata compiled into an interface; a processor, weaver or runtime proxy is what gives them meaning.",
      followUps: [
        "Where exactly does @Transactional stop being metadata and start being behaviour?",
        "Why can't reflection see a CLASS-retention annotation?",
      ],
    },
    {
      id: "b002",
      question: "Explain all three RetentionPolicy values and when you would deliberately pick each one.",
      answer:
        "`@Retention` decides how long the annotation survives in the toolchain. There are exactly three values and each one exists for a different consumer.\n\n" +
        "SOURCE:\n\n" +
        "- Discarded by `javac` after compilation; never written to the class file.\n" +
        "- The consumer is the **compiler itself or an annotation processor** running in the same javac invocation.\n" +
        "- Use it for compile-time-only contracts: `@Override`, `@SuppressWarnings`, Lombok's `@Getter`, Dagger's `@Component`, and any `@NonNull` you only use for static analysis.\n" +
        "- Zero runtime footprint — nothing to load, nothing to scan.\n\n" +
        "CLASS (the default when you omit @Retention):\n\n" +
        "- Written to the class file under `RuntimeInvisibleAnnotations` but **not** visible to reflection.\n" +
        "- The consumer is a **bytecode-level tool**: ASM/ByteBuddy weavers, coverage agents, AspectJ compile-time weaving, ProGuard/R8 rules, static analysers reading `.class` files.\n" +
        "- People pick CLASS accidentally far more often than deliberately. Forgetting `@Retention(RUNTIME)` on a custom Spring annotation is one of the most common self-inflicted bugs — the annotation is simply never found and no error is raised.\n\n" +
        "RUNTIME:\n\n" +
        "- Written under `RuntimeVisibleAnnotations` and readable through the `AnnotatedElement` API.\n" +
        "- The consumer is a **framework at runtime**: Spring, Hibernate, Jackson, JUnit, Bean Validation, your own reflective scanner.\n" +
        "- It costs a little metadata space and reflective lookup time, so do not make everything RUNTIME by reflex.\n\n" +
        "**Rule of thumb:** if a framework must find it while the JVM is running, RUNTIME. If a build tool reads bytecode, CLASS. If only javac needs it, SOURCE.",
      code: `import java.lang.annotation.*;
import java.lang.reflect.Method;

@Retention(RetentionPolicy.SOURCE)  @Target(ElementType.METHOD)
@interface CompileOnly {}

@Retention(RetentionPolicy.CLASS)   @Target(ElementType.METHOD)
@interface BytecodeOnly {}

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
@interface ReflectiveOnly {}

public class RetentionDemo {
    @CompileOnly @BytecodeOnly @ReflectiveOnly
    public void target() {}

    public static void main(String[] args) throws Exception {
        Method m = RetentionDemo.class.getMethod("target");
        System.out.println("declared at runtime: " + m.getAnnotations().length);
        // prints 1 -> only @ReflectiveOnly survives into reflection.
        // @CompileOnly never reached the class file.
        // @BytecodeOnly IS in the class file (javap -v shows
        // RuntimeInvisibleAnnotations) but reflection cannot see it.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Pick retention by consumer: javac (SOURCE), bytecode tooling (CLASS), reflection-driven frameworks (RUNTIME) — the default is CLASS, which silently breaks scanners.",
      followUps: [
        "What happens if you forget @Retention on a custom Spring annotation?",
        "How do you verify what retention an annotation ended up with?",
      ],
    },
    {
      id: "b003",
      question: "What is @Target and what are all the ElementType values?",
      answer:
        "`@Target` restricts **where** an annotation may legally be written. If you omit it, the annotation is applicable to every declaration context (but notably **not** to type uses). Adding `@Target` turns a whole class of mistakes into compile errors instead of silent no-ops.\n\n" +
        "Declaration targets:\n\n" +
        "- **TYPE** — class, interface, enum, record, or another annotation type.\n" +
        "- **FIELD** — instance and static fields, including enum constants.\n" +
        "- **METHOD** — any method declaration.\n" +
        "- **PARAMETER** — a formal parameter of a method or constructor.\n" +
        "- **CONSTRUCTOR** — a constructor declaration.\n" +
        "- **LOCAL_VARIABLE** — a local variable; only useful with SOURCE retention because locals are not in the reflective model.\n" +
        "- **ANNOTATION_TYPE** — the annotation may be placed on other annotations, i.e. it becomes a meta-annotation. `@Retention`, `@Target` and Spring's `@Transactional` all allow this.\n" +
        "- **PACKAGE** — written in `package-info.java`. Hibernate's `@TypeDef` and JPA's `@NamedQuery` sets are the common uses.\n" +
        "- **TYPE_PARAMETER** (Java 8) — the `T` in `class Box<@Immutable T>`.\n" +
        "- **TYPE_USE** (Java 8) — anywhere a type appears: `List<@NonNull String>`, `(@Valid Order) o`, `new @Interned String()`, `throws @Critical IOException`. This is what pluggable type checkers such as Checker Framework are built on.\n" +
        "- **MODULE** (Java 9) — in `module-info.java`.\n" +
        "- **RECORD_COMPONENT** (Java 16) — a record component; note the annotation may then be *propagated* to the field, the accessor and the constructor parameter depending on the other targets it declares.\n\n" +
        "**Records are the subtle one.** Annotating a record component with an annotation that also targets FIELD and PARAMETER causes it to appear in all of those places, which is exactly why `record User(@NotBlank String name)` validates correctly.",
      code: `import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@interface ApiEndpoint { String path(); }

// Legal: TYPE and METHOD are both declared targets.
@ApiEndpoint(path = "/orders")
class OrderController {
    @ApiEndpoint(path = "/orders/{id}")
    String byId(String id) { return id; }

    // void bad(@ApiEndpoint(path = "/x") String p) {}  // compile error: PARAMETER not allowed
}

// Because ANNOTATION_TYPE is a target, this can become a meta-annotation:
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@ApiEndpoint(path = "/admin")
@interface AdminApi {}

// TYPE_USE lives in a different world - it annotates the *use* of a type.
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
@interface NonNull {}

class Repo {
    java.util.List<@NonNull String> ids = new java.util.ArrayList<>();
    @NonNull String find(@NonNull String id) { return id; }
}`,
      codeLanguage: "java",
      explanation:
        "@Target turns misplacement into a compile error; TYPE_USE and RECORD_COMPONENT are the two modern values interviewers probe for.",
      followUps: [
        "Why does @NotBlank work on a record component?",
        "What is the difference between TYPE and TYPE_USE?",
      ],
    },
    {
      id: "b004",
      question: "What are meta-annotations and how does Spring's annotation 'inheritance' actually work?",
      answer:
        "A **meta-annotation** is an annotation placed on another annotation type. Java ships five: `@Retention`, `@Target`, `@Documented`, `@Inherited` and `@Repeatable`. Spring adds a large ecosystem on top, and this is where candidates usually get tripped up.\n\n" +
        "**Plain Java `@Inherited` is extremely narrow.** It only applies to `@Target(TYPE)` annotations and only propagates from a **superclass to a subclass**. It does not work for interfaces, does not work for methods, and does not affect `getDeclaredAnnotations()`. So `@Inherited` alone explains almost none of what Spring does.\n\n" +
        "**Spring implements its own model** in `MergedAnnotations` / `AnnotatedElementUtils`. Spring searches the whole *annotation hierarchy*: the element itself, its meta-annotations, their meta-annotations and so on, plus superclasses and interfaces. That is why `@RestController` works everywhere `@Component` works — `@RestController` is meta-annotated with `@Controller`, which is meta-annotated with `@Component`.\n\n" +
        "**@AliasFor is the second half of the story.** It lets a composed annotation expose an attribute that is really the meta-annotation's attribute. `@RequestMapping(path = ...)` and `@GetMapping(path = ...)` share the same underlying attribute through `@AliasFor`. Spring's attribute *merging* means the outer value overrides the meta-annotation's default.\n\n" +
        "This is the mechanism behind composed annotations, and building one is a favourite senior-level task: fold `@Transactional`, `@Retryable` and `@Timed` into one `@BusinessOperation` so a team applies a consistent policy in a single place.",
      code: `import java.lang.annotation.*;
import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

// A composed annotation: one marker, three behaviours, consistent policy.
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Service                                            // meta: makes it a bean
@Transactional(isolation = Isolation.READ_COMMITTED) // meta: tx policy
public @interface DomainService {

    // Expose the bean name through the meta-annotation's attribute.
    @AliasFor(annotation = Service.class, attribute = "value")
    String value() default "";

    @AliasFor(annotation = Transactional.class, attribute = "timeout")
    int timeoutSeconds() default 30;
}

@DomainService(value = "ledger", timeoutSeconds = 5)
class LedgerService {
    public void post(String entry) { /* runs in a READ_COMMITTED tx, 5s timeout */ }
}

// Spring resolves the hierarchy like this:
//   LedgerService -> @DomainService -> @Service -> @Component  (bean detected)
//                                   -> @Transactional          (proxy applied)`,
      codeLanguage: "java",
      explanation:
        "Java's @Inherited only walks superclasses for TYPE annotations; Spring's MergedAnnotations walks the whole meta-annotation graph and merges @AliasFor attributes.",
      followUps: [
        "Write a composed annotation that combines @Transactional and @PreAuthorize.",
        "Why does @Inherited not work for interfaces?",
      ],
    },
    {
      id: "b005",
      question: "What types are legal as annotation attributes, and why is that list so restrictive?",
      answer:
        "An annotation attribute may only be one of:\n\n" +
        "- a **primitive** (`int`, `long`, `boolean`, `double`, …)\n" +
        "- `String`\n" +
        "- `Class` or a bounded wildcard `Class<? extends Something>`\n" +
        "- an **enum** type\n" +
        "- another **annotation** type\n" +
        "- a **one-dimensional array** of any of the above\n\n" +
        "That is the complete list. No `List`, no `Map`, no arbitrary object, no nested arrays, no generic type variables.\n\n" +
        "**Why:** annotation values must be **compile-time constants** that can be encoded directly in the class file's constant pool and reconstructed by the JVM without running user code. If attributes could be arbitrary objects, reading an annotation would mean executing a constructor, which breaks the guarantee that metadata is inert and side-effect-free.\n\n" +
        "Practical consequences you should be able to name:\n\n" +
        "- **`null` is illegal** as a default or a supplied value. The idiom is a sentinel: `String value() default \"\";` or `Class<?> using() default Void.class`.\n" +
        "- **Arrays are mutable**, so `getAnnotation(...).tags()` returns a **fresh clone on every call**. Cache it in a hot loop.\n" +
        "- A single-element array can be written without braces: `@Tags(\"a\")` is `@Tags({\"a\"})`.\n" +
        "- An attribute named `value` may be supplied positionally: `@Audited(\"refund\")`.\n" +
        "- Referencing a `Class` in an annotation does **not** initialise it, but it does require it on the classpath when the annotation is read reflectively — otherwise you get `TypeNotPresentException`.",
      code: `import java.lang.annotation.*;

enum Strategy { EAGER, LAZY }

@Retention(RetentionPolicy.RUNTIME)
@interface Column { String name(); boolean nullable() default true; }

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Entity {
    String table();                             // String
    int version() default 1;                    // primitive
    Class<?> idType() default Long.class;       // Class literal
    Strategy fetch() default Strategy.LAZY;     // enum
    Column[] columns() default {};              // array of annotations
    String[] indexes() default {};              // array of String
    // List<String> nope();                     // ILLEGAL - not a constant type
    // String bad() default null;               // ILLEGAL - null is not allowed
}

@Entity(
    table = "orders",
    idType = java.util.UUID.class,
    fetch = Strategy.EAGER,
    columns = { @Column(name = "id", nullable = false), @Column(name = "total") },
    indexes = "idx_orders_customer"             // single element, braces optional
)
class Order {}

class Reader {
    static void show() {
        Entity e = Order.class.getAnnotation(Entity.class);
        String[] a = e.indexes();
        String[] b = e.indexes();
        System.out.println(a == b);  // false - arrays are defensively cloned each call
    }
}`,
      codeLanguage: "java",
      explanation:
        "Attributes must be compile-time constants encodable in the constant pool; hence no null, no collections, and defensively cloned arrays on every read.",
      followUps: [
        "How do you model an 'absent' value if null is illegal?",
        "Why is calling an array-valued attribute in a loop a performance smell?",
      ],
    },
    {
      id: "b006",
      question: "How does a framework read annotations at runtime, and what does that cost?",
      answer:
        "Everything goes through `java.lang.reflect.AnnotatedElement`, implemented by `Class`, `Method`, `Field`, `Constructor`, `Parameter`, `Package` and `Module`. The core methods are:\n\n" +
        "- `getAnnotation(Class<A>)` — the annotation if present, honouring `@Inherited` on classes.\n" +
        "- `getDeclaredAnnotation(Class<A>)` — same but ignores inheritance.\n" +
        "- `getAnnotations()` / `getDeclaredAnnotations()` — everything.\n" +
        "- `isAnnotationPresent(Class<A>)` — cheap-ish boolean check.\n" +
        "- `getAnnotationsByType(Class<A>)` — the repeatable-aware variant that unwraps container annotations.\n\n" +
        "**What you get back is a dynamic proxy.** The JVM synthesises an implementation of your annotation interface (`sun.reflect.annotation.AnnotationInvocationHandler`) backed by a `Map<String, Object>` of attribute values parsed from the class file. That is why `a.getClass()` is not your annotation type and why `a.toString()` prints the `@Anno(attr=value)` form. `equals`, `hashCode` and `annotationType()` all have specified semantics.\n\n" +
        "Cost, which is what the interviewer is really after:\n\n" +
        "- The first read on a class **parses the annotation bytes and builds the proxies**, then caches them per `Class` in the JVM's reflection data. Subsequent reads are map lookups but still allocate for array attributes.\n" +
        "- Doing this **per request** is a classic performance bug. Frameworks avoid it: Spring resolves annotations once at bean-definition time, Hibernate at `SessionFactory` build, JUnit at discovery.\n" +
        "- Classpath scanning at startup is annotation reading at scale; Spring uses ASM to read `.class` files **without loading them** precisely to keep startup cheap, and `spring-boot-configuration-processor` / AOT processing pushes more of it to build time.\n\n" +
        "**The right pattern:** resolve reflective metadata once into a plain data structure, then use that on the hot path.",
      code: `import java.lang.annotation.*;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
@interface RateLimit { int permitsPerSecond() default 10; }

/** Resolve once, reuse forever - the pattern every framework uses. */
final class RateLimitRegistry {
    private static final Map<Class<?>, Map<String, Integer>> CACHE = new ConcurrentHashMap<>();

    static Map<String, Integer> limitsFor(Class<?> type) {
        return CACHE.computeIfAbsent(type, t -> {
            Map<String, Integer> found = new HashMap<>();
            for (Method m : t.getDeclaredMethods()) {          // reflective pass: ONCE
                RateLimit rl = m.getAnnotation(RateLimit.class);
                if (rl != null) found.put(m.getName(), rl.permitsPerSecond());
            }
            return Map.copyOf(found);                          // immutable snapshot
        });
    }
}

class SearchApi {
    @RateLimit(permitsPerSecond = 50) public void query() {}
    @RateLimit                         public void suggest() {}

    public static void main(String[] args) {
        var limits = RateLimitRegistry.limitsFor(SearchApi.class);
        System.out.println(limits);            // {query=50, suggest=10}

        RateLimit a = SearchApi.class.getDeclaredMethods()[0].getAnnotation(RateLimit.class);
        System.out.println(a.getClass().getName()); // com.sun.proxy.$ProxyN - a JDK proxy
    }
}`,
      codeLanguage: "java",
      explanation:
        "Reflection returns a synthesised JDK proxy; frameworks resolve annotations once at startup and cache, never per request.",
      followUps: [
        "Why does Spring use ASM instead of Class.forName during component scanning?",
        "How would you make annotation-driven dispatch allocation-free?",
      ],
    },
    {
      id: "b007",
      question: "What is @Repeatable and how are repeatable annotations stored in the class file?",
      answer:
        "Before Java 8 you could not write the same annotation twice on one element; the workaround was an explicit container: `@Schedules({@Schedule(...), @Schedule(...)})`. Java 8's `@Repeatable` keeps that container but hides it behind **compiler sugar**.\n\n" +
        "You declare two types:\n\n" +
        "1. The repeatable annotation, meta-annotated `@Repeatable(Container.class)`.\n" +
        "2. The container annotation, which must declare `value()` returning an **array of the repeatable type**, and must have retention at least as long and targets at least as wide as the repeatable one.\n\n" +
        "**What the compiler emits:** if the annotation appears once, it is stored directly. If it appears two or more times, javac silently wraps them in the container. There is no new class-file format — only sugar. This is exactly why the API distinction matters:\n\n" +
        "- `getAnnotation(Schedule.class)` returns **null** when the annotation was repeated, because what is stored is a `Schedules`.\n" +
        "- `getAnnotationsByType(Schedule.class)` is repeatable-aware: it unwraps the container and returns all occurrences, and also works when there is exactly one.\n\n" +
        "**Always use `getAnnotationsByType` (or Spring's `MergedAnnotations`) for anything that might be repeatable.** Writing a scanner with `getAnnotation` and then making the annotation repeatable later is a silent, hard-to-find regression.\n\n" +
        "Real examples you can name: `@Schedules`/`@Scheduled`, JPA's `@JoinColumn`/`@JoinColumns`, Bean Validation constraints, JUnit 5's `@ExtendWith`, and Spring's `@PropertySource`/`@PropertySources`.",
      code: `import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(Schedules.class)                 // <- points at the container
@interface Schedule { String cron(); String zone() default "UTC"; }

@Retention(RetentionPolicy.RUNTIME)          // must be >= Schedule's retention
@Target(ElementType.METHOD)
@interface Schedules { Schedule[] value(); } // must expose value() as an array

class ReportJob {
    @Schedule(cron = "0 0 2 * * *")
    @Schedule(cron = "0 0 14 * * *", zone = "Asia/Kolkata")
    void nightlyAndAfternoon() {}

    @Schedule(cron = "0 */5 * * * *")        // single occurrence - NOT wrapped
    void everyFiveMinutes() {}

    public static void main(String[] args) throws Exception {
        var repeated = ReportJob.class.getDeclaredMethod("nightlyAndAfternoon");
        System.out.println(repeated.getAnnotation(Schedule.class));        // null!
        System.out.println(repeated.getAnnotation(Schedules.class).value().length); // 2
        System.out.println(repeated.getAnnotationsByType(Schedule.class).length);   // 2

        var single = ReportJob.class.getDeclaredMethod("everyFiveMinutes");
        System.out.println(single.getAnnotation(Schedule.class) != null);           // true
        System.out.println(single.getAnnotationsByType(Schedule.class).length);     // 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "@Repeatable is compiler sugar over a container annotation — getAnnotation returns null once repeated, so always use getAnnotationsByType.",
      followUps: [
        "What are the compile-time constraints on the container annotation?",
        "How does Spring's MergedAnnotations handle repeatables?",
      ],
    },
    {
      id: "b008",
      question: "What is an annotation processor and how does it differ from runtime reflection?",
      answer:
        "An **annotation processor** is a plug-in to `javac` that implements `javax.annotation.processing.Processor` (usually by extending `AbstractProcessor`). It runs **during compilation**, in rounds, over the abstract syntax model exposed by the `javax.lang.model` API, and its main power is that it can **generate new source files** (and emit errors and warnings).\n\n" +
        "How it runs:\n\n" +
        "1. javac parses and enters the sources, then asks each registered processor whether it claims any annotations present in this round.\n" +
        "2. A claiming processor inspects `RoundEnvironment.getElementsAnnotatedWith(...)` and may write files via `Filer`.\n" +
        "3. Generated sources are compiled in the **next round**; rounds repeat until no new files appear.\n" +
        "4. Processors are discovered through `META-INF/services/javax.annotation.processing.Processor` — Google's `@AutoService` generates that file for you.\n\n" +
        "Processing versus reflection:\n\n" +
        "- **When**: compile time versus runtime.\n" +
        "- **Failure mode**: a processor can `Messager.printMessage(ERROR, ...)` and **fail the build**; reflection can only throw at runtime, usually in production.\n" +
        "- **Cost**: generated code is plain Java, so there is zero runtime reflection, no proxy allocation, and it is fully compatible with GraalVM native image.\n" +
        "- **Power**: a processor cannot modify existing sources through the public API (Lombok does it anyway by reaching into javac internals, which is why Lombok breaks on JDK upgrades).\n\n" +
        "Real-world processors you should be able to name: MapStruct, Dagger, Immutables, Micronaut and Quarkus (which do their DI at build time), `spring-boot-configuration-processor` (generates `spring-configuration-metadata.json` for IDE autocomplete), Hibernate's JPA static metamodel generator, and Spring 6's AOT engine.",
      code: `// --- the annotation -------------------------------------------------------
import java.lang.annotation.*;
@Retention(RetentionPolicy.SOURCE)          // SOURCE is enough: only javac reads it
@Target(ElementType.TYPE)
public @interface GenerateBuilder {}

// --- the processor --------------------------------------------------------
import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import javax.tools.Diagnostic;
import java.io.Writer;
import java.util.Set;

@SupportedAnnotationTypes("GenerateBuilder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {

    @Override public boolean process(Set<? extends TypeElement> annotations,
                                     RoundEnvironment round) {
        for (Element e : round.getElementsAnnotatedWith(GenerateBuilder.class)) {
            TypeElement type = (TypeElement) e;
            if (type.getModifiers().contains(Modifier.FINAL)) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.ERROR, "@GenerateBuilder cannot target a final class", e);
                continue;                                  // build fails - at COMPILE time
            }
            String pkg = processingEnv.getElementUtils().getPackageOf(type).toString();
            String name = type.getSimpleName() + "Builder";
            try (Writer w = processingEnv.getFiler()
                    .createSourceFile(pkg + "." + name, e).openWriter()) {
                w.write("package " + pkg + ";\\n");
                w.write("public final class " + name + " { /* generated */ }\\n");
            } catch (Exception ex) { throw new RuntimeException(ex); }
        }
        return true;                                       // annotations claimed
    }
}`,
      codeLanguage: "java",
      explanation:
        "Processors run inside javac, generate code and can fail the build — reflection only discovers problems at runtime and costs proxies and startup time.",
      followUps: [
        "Why do Micronaut and Quarkus prefer compile-time DI over Spring's runtime DI?",
        "Why does Lombok break on JDK upgrades when MapStruct does not?",
      ],
    },
    {
      id: "b009",
      question: "Walk through the built-in java.lang annotations: @Override, @Deprecated, @SuppressWarnings, @FunctionalInterface, @SafeVarargs.",
      answer:
        "These five live in `java.lang` and are all consumed by the **compiler**, not by a framework.\n\n" +
        "@Override (SOURCE, METHOD):\n\n" +
        "- Asserts the method overrides a supertype method or implements an interface method. If it does not, compile error.\n" +
        "- Its whole value is catching typos and signature drift — renaming `equals(Object)` to `equals(MyType)` is the classic bug it prevents.\n\n" +
        "@Deprecated (RUNTIME, almost every target):\n\n" +
        "- Marks API that should not be used. Since Java 9 it has `since` and `forRemoval`; `forRemoval = true` produces a stronger *removal* warning.\n" +
        "- Pair it with the Javadoc `@deprecated` tag — the annotation warns the compiler, the tag tells the human what to use instead.\n\n" +
        "@SuppressWarnings (SOURCE):\n\n" +
        "- Silences named compiler warnings: `\"unchecked\"`, `\"rawtypes\"`, `\"deprecation\"`, `\"serial\"`, `\"this-escape\"` (Java 21).\n" +
        "- **Apply it on the narrowest possible element** — a local variable, not the class. A class-level suppression hides future real problems.\n\n" +
        "@FunctionalInterface (RUNTIME, TYPE):\n\n" +
        "- Documents intent and makes the compiler enforce **exactly one abstract method**. `default`, `static` and private methods do not count, and public methods of `Object` (`equals`, `hashCode`, `toString`) do not count either.\n" +
        "- Lambdas work without it; the annotation only protects the contract from a future edit adding a second abstract method.\n\n" +
        "@SafeVarargs (RUNTIME, METHOD/CONSTRUCTOR):\n\n" +
        "- Suppresses the *heap pollution* warning for a generic varargs parameter, asserting the method never writes into the array or leaks it.\n" +
        "- Only legal on `static`, `final`, `private` (Java 9+) methods and constructors — anything that cannot be overridden, because the guarantee cannot be inherited.",
      code: `import java.util.*;

@FunctionalInterface
interface Validator<T> {
    boolean test(T value);                        // exactly ONE abstract method
    default Validator<T> and(Validator<T> o) {    // defaults do not break it
        return v -> test(v) && o.test(v);
    }
    // boolean other(T v);                        // would break @FunctionalInterface
}

class Legacy {
    @Deprecated(since = "3.2", forRemoval = true)
    static String oldFormat(Object o) { return String.valueOf(o); }
}

class Builtins {
    @Override public String toString() { return "Builtins"; }  // enforced override

    @SafeVarargs                                   // static => cannot be overridden
    static <T> List<T> listOf(T... items) {
        return new ArrayList<>(Arrays.asList(items));  // never writes to 'items'
    }

    static int lengths(List<?> raw) {
        @SuppressWarnings("unchecked")             // narrowest possible scope
        List<String> typed = (List<String>) raw;
        return typed.stream().mapToInt(String::length).sum();
    }

    @SuppressWarnings("removal")
    static String call() { return Legacy.oldFormat(42); }
}`,
      codeLanguage: "java",
      explanation:
        "All five are compiler contracts; the senior signal is scoping @SuppressWarnings narrowly and knowing why @SafeVarargs requires a non-overridable method.",
      followUps: [
        "Why is @SafeVarargs illegal on a public non-final instance method?",
        "What exactly is heap pollution?",
      ],
    },
    {
      id: "b010",
      question: "How do you build a custom annotation plus an AOP aspect that acts on it in Spring Boot?",
      answer:
        "This is the standard 'show me you can extend the framework' task. It has four parts.\n\n" +
        "1. Declare the annotation:\n\n" +
        "- `@Retention(RUNTIME)` — non-negotiable, Spring reads it reflectively.\n" +
        "- `@Target({METHOD, TYPE})` — method-level for one operation, type-level to cover a whole class.\n" +
        "- `@Documented`, and `@Inherited` only if you want subclasses of an annotated class to pick it up.\n\n" +
        "2. Write the aspect:\n\n" +
        "- `@Aspect @Component` on the class.\n" +
        "- `@Around(\"@annotation(myAnno)\")` binds the annotation instance as a parameter so you can read its attributes. Use `@within(...)` for the type-level form.\n" +
        "- Call `pjp.proceed()` exactly once and be careful to let `Throwable` propagate.\n\n" +
        "3. Enable AOP:\n\n" +
        "- `spring-boot-starter-aop` pulls in AspectJ weaving support; `@EnableAspectJAutoProxy` is applied automatically by Boot's auto-configuration.\n\n" +
        "4. Know the proxy limits — this is where interviews are won or lost:\n\n" +
        "- Spring AOP is **proxy based**, so the advice only fires on calls that cross the proxy boundary. A **self-invocation** (`this.method()` inside the same bean) bypasses it entirely. Same trap as `@Transactional`.\n" +
        "- `private`, `static` and `final` methods cannot be advised; `final` classes cannot be CGLIB-proxied.\n" +
        "- Order matters when several aspects stack — control it with `@Order` or `Ordered`.\n" +
        "- The fix for self-invocation is to extract the method into another bean, self-inject, or use `AopContext.currentProxy()` (ugly, requires `exposeProxy = true`).",
      code: `import java.lang.annotation.*;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
@Documented
public @interface Timed {
    String value() default "";
    long warnAboveMs() default 500L;
}

@Aspect
@Component
@Order(20)                                   // runs inside @Transactional (order 100 default)
class TimedAspect {

    @Around("@annotation(timed)")            // binds the annotation instance
    public Object aroundMethod(ProceedingJoinPoint pjp, Timed timed) throws Throwable {
        String name = timed.value().isBlank()
                ? pjp.getSignature().toShortString()
                : timed.value();
        long start = System.nanoTime();
        try {
            return pjp.proceed();            // exactly once
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            if (ms > timed.warnAboveMs()) {
                System.out.printf("SLOW %s took %d ms%n", name, ms);
            }
        }
    }

    @Around("@within(timed)")                // class-level form
    public Object aroundType(ProceedingJoinPoint pjp, Timed timed) throws Throwable {
        return aroundMethod(pjp, timed);
    }
}

@Service
class ReportService {
    @Timed(value = "report.build", warnAboveMs = 200)
    public String build() { return "report"; }

    public String buildTwice() {
        return build() + build();            // SELF-INVOCATION: aspect does NOT fire
    }
}`,
      codeLanguage: "java",
      explanation:
        "Runtime retention plus an @Around aspect — and the senior detail is that self-invocation bypasses the proxy, exactly like @Transactional.",
      followUps: [
        "How would you make the aspect fire on a self-invocation?",
        "What is the ordering relationship between your aspect and @Transactional?",
      ],
    },
    {
      id: "b011",
      question: "What is the difference between @Inherited, interface annotations, and Spring's @AliasFor?",
      answer:
        "Three different mechanisms that candidates routinely blur together.\n\n" +
        "@Inherited (plain Java):\n\n" +
        "- Meta-annotation with a very narrow contract: only affects annotations whose target includes `TYPE`, and only propagates from a **class to its subclasses**.\n" +
        "- It changes what `getAnnotation` returns, **not** `getDeclaredAnnotation`.\n" +
        "- It does **not** work for interfaces, methods, fields or constructors. `@Inherited` on a method-level annotation is silently useless.\n\n" +
        "Annotations on interfaces:\n\n" +
        "- Plain Java reflection **never** inherits annotations from an implemented interface, no matter what you write.\n" +
        "- Yet `@Transactional` on a repository interface works. That is Spring, not Java: `AnnotatedElementUtils.findMergedAnnotation` explicitly walks interfaces and superclasses. Hibernate Validator does something similar for constraints.\n" +
        "- The practical consequence: an annotation on an interface method works under Spring but is invisible to a hand-rolled `method.getAnnotation(...)` scanner.\n\n" +
        "@AliasFor (Spring only):\n\n" +
        "- Declares that two attributes are the same attribute. Two flavours:\n" +
        "- **Explicit alias within one annotation** — `value` and `path` in `@RequestMapping` are mutual aliases; setting either sets both, setting both to different values throws.\n" +
        "- **Alias to a meta-annotation attribute** — a composed annotation overrides an attribute of the annotation it is meta-annotated with, which is how `@GetMapping(\"/x\")` sets `@RequestMapping`'s path.\n" +
        "- Enforced by `AnnotationTypeMappings` at read time, not by the compiler. Misconfigured aliases fail with `AnnotationConfigurationException` at startup.\n\n" +
        "**Summary line for the interview:** Java gives you almost nothing; Spring's `MergedAnnotations` engine gives you hierarchy search plus attribute merging, and that is why Spring annotations feel 'inherited' when Java's are not.",
      code: `import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Inherited                                // only classes, only TYPE
@interface Monitored {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Inherited                                // ignored - methods are never inherited
@interface Traced {}

@Monitored
class BaseService { @Traced void run() {} }

class ChildService extends BaseService { @Override void run() {} }

interface Contract { @Traced void execute(); }
class Impl implements Contract { public void execute() {} }

public class InheritanceDemo {
    public static void main(String[] args) throws Exception {
        // @Inherited works: class -> subclass
        System.out.println(ChildService.class.isAnnotationPresent(Monitored.class)); // true
        System.out.println(ChildService.class.getDeclaredAnnotations().length);      // 0

        // Method annotations are NEVER inherited by plain reflection
        System.out.println(ChildService.class.getDeclaredMethod("run")
                .isAnnotationPresent(Traced.class));                                 // false

        // Interface annotations are NEVER inherited by plain reflection
        System.out.println(Impl.class.getDeclaredMethod("execute")
                .isAnnotationPresent(Traced.class));                                 // false

        // Spring WOULD find both:
        // AnnotatedElementUtils.findMergedAnnotation(method, Traced.class) != null
    }
}`,
      codeLanguage: "java",
      explanation:
        "Java inherits TYPE annotations down class hierarchies only; everything else that 'feels inherited' in Spring is MergedAnnotations doing a hierarchy search.",
      followUps: [
        "Why can @Transactional on a JpaRepository interface still work?",
        "What exception does Spring throw for a bad @AliasFor pair?",
      ],
    },
    {
      id: "b012",
      question: "What are type annotations (TYPE_USE) and what problem do they solve?",
      answer:
        "Java 8 added two new `ElementType` values — `TYPE_PARAMETER` and `TYPE_USE` — that let annotations attach to a **type** rather than a **declaration**. That sounds like a small change but it is what makes pluggable type systems possible.\n\n" +
        "Before Java 8 you could write `@NonNull String name;` and the annotation described the *field*. With `TYPE_USE` you can write annotations in places where no declaration exists at all:\n\n" +
        "- `List<@NonNull String>` — the elements are non-null, which is different from the list being non-null.\n" +
        "- `@NonNull List<@Nullable String>` — the list itself is non-null but may contain nulls.\n" +
        "- `new @Interned String(\"x\")` — a constructor invocation.\n" +
        "- `(@Immutable Order) obj` — a cast.\n" +
        "- `void f() throws @Critical IOException` — a thrown type.\n" +
        "- `Map.@NonNull Entry<K,V>` — a nested type (the annotation goes right before the simple name).\n\n" +
        "Storage and reflection:\n\n" +
        "- They are written into `RuntimeVisibleTypeAnnotations` with a `target_type` and `type_path` describing exactly where in the type they sit.\n" +
        "- The reflective API is `AnnotatedType`: `Method.getAnnotatedReturnType()`, `Field.getAnnotatedType()`, `getAnnotatedParameterTypes()`, and `AnnotatedParameterizedType.getAnnotatedActualTypeArguments()`.\n\n" +
        "**Who uses it:** Checker Framework (`@Nullable`, `@Tainted`, `@GuardedBy` checked at compile time), JSR-380 Bean Validation (`List<@Email String> recipients` is validated element-wise), and JetBrains/JSpecify nullability annotations. Spring 6 and Kotlin interop both lean on nullability metadata expressed this way.\n\n" +
        "The interview answer: **TYPE_USE moved annotations from 'describing declarations' to 'describing types', which is the prerequisite for compile-time null-safety and generic element constraints.**",
      code: `import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE_USE, ElementType.TYPE_PARAMETER})
@interface NonNull {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
@interface Nullable {}

class Inbox<@NonNull T> {                                 // TYPE_PARAMETER

    @NonNull List<@Nullable String> messages = new ArrayList<>();   // two distinct claims

    @NonNull String first(@NonNull List<@NonNull String> src) throws @Nullable Exception {
        return src.get(0);
    }

    public static void main(String[] args) throws Exception {
        Field f = Inbox.class.getDeclaredField("messages");
        AnnotatedType t = f.getAnnotatedType();
        System.out.println(t.getAnnotations().length);                 // 1 -> @NonNull on List
        AnnotatedParameterizedType p = (AnnotatedParameterizedType) t;
        System.out.println(p.getAnnotatedActualTypeArguments()[0]
                .getAnnotations()[0]);                                  // @Nullable on String
    }
}`,
      codeLanguage: "java",
      explanation:
        "TYPE_USE annotates types rather than declarations, enabling element-level constraints and pluggable compile-time null-checking.",
      followUps: [
        "How does Bean Validation validate List<@Email String>?",
        "How does Kotlin interop use nullability annotations?",
      ],
    },
    {
      id: "b013",
      question: "Explain the Bean Validation annotations and how @Valid differs from @Validated.",
      answer:
        "Jakarta Bean Validation (JSR-380, `jakarta.validation` in Spring Boot 3) is a declarative constraint model. Hibernate Validator is the reference implementation that Boot pulls in via `spring-boot-starter-validation`.\n\n" +
        "The constraint set you should be able to reel off:\n\n" +
        "- **Nullability**: `@NotNull`, `@Null`.\n" +
        "- **Emptiness**: `@NotEmpty` (not null and size > 0), `@NotBlank` (String only — not null and contains non-whitespace).\n" +
        "- **Size and range**: `@Size(min,max)`, `@Min`/`@Max`, `@DecimalMin`/`@DecimalMax`, `@Positive`, `@PositiveOrZero`, `@Negative`, `@Digits`.\n" +
        "- **Temporal**: `@Past`, `@PastOrPresent`, `@Future`, `@FutureOrPresent`.\n" +
        "- **Format**: `@Email`, `@Pattern(regexp=...)`, `@AssertTrue`, `@AssertFalse`.\n" +
        "- **Cascade**: `@Valid` on a nested object or collection element validates it too.\n\n" +
        "@Valid versus @Validated:\n\n" +
        "- `@Valid` is the **Jakarta standard** annotation. It triggers validation of a `@RequestBody`/`@ModelAttribute` in a controller and cascades into nested objects. It has no group support.\n" +
        "- `@Validated` is **Spring's** annotation. It supports **validation groups** (`@Validated(OnCreate.class)`), and — crucially — placed on a class it enables **method-level validation** via an AOP proxy, so constraints on method parameters and return values of any Spring bean are enforced.\n" +
        "- Failure modes differ: a failed `@Valid` on a controller body throws `MethodArgumentNotValidException` (400); a failed method-level constraint throws `ConstraintViolationException` (500 unless you handle it).\n\n" +
        "**Senior detail:** write a custom constraint by pairing a `@Constraint(validatedBy = X.class)` annotation with a `ConstraintValidator` — and know that cross-field rules belong at class level, not on a single field.",
      code: `import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.lang.annotation.*;
import java.time.LocalDate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Service;

record Address(@NotBlank String city, @Pattern(regexp = "\\\\d{6}") String pin) {}

record SignupRequest(
        @NotBlank @Size(max = 60)        String name,
        @NotBlank @Email                 String email,
        @Min(18) @Max(120)               int age,
        @Past                            LocalDate dob,
        @Valid @NotNull                  Address address,      // cascades
        @Size(min = 1) List<@Email String> contacts) {}

// ---- custom constraint ---------------------------------------------------
@Documented
@Constraint(validatedBy = TenantIdValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@interface TenantId {
    String message() default "invalid tenant id";
    Class<?>[] groups() default {};                      // REQUIRED by the spec
    Class<? extends Payload>[] payload() default {};     // REQUIRED by the spec
}

class TenantIdValidator implements ConstraintValidator<TenantId, String> {
    @Override public boolean isValid(String v, ConstraintValidatorContext ctx) {
        return v != null && v.startsWith("tnt_") && v.length() == 16;
    }
}

@RestController
class SignupController {
    @PostMapping("/signup")                               // @Valid -> 400 on failure
    String signup(@Valid @RequestBody SignupRequest req) { return "ok"; }
}

@Service
@Validated                                                // enables METHOD validation
class TenantService {
    public void activate(@TenantId String tenantId) { }   // ConstraintViolationException
}`,
      codeLanguage: "java",
      explanation:
        "@Valid is the Jakarta cascade annotation; @Validated is Spring's and adds validation groups plus AOP-driven method-parameter validation.",
      followUps: [
        "How do you return a clean 400 body for a ConstraintViolationException?",
        "When is @NotEmpty wrong and @NotBlank right?",
      ],
    },
    {
      id: "b014",
      question: "Which JPA / Hibernate annotations matter most, and what are the classic traps?",
      answer:
        "Mapping annotations (`jakarta.persistence`):\n\n" +
        "- **Identity**: `@Entity`, `@Table(name, indexes, uniqueConstraints)`, `@Id`, `@GeneratedValue(strategy)`, `@EmbeddedId`/`@IdClass` for composite keys.\n" +
        "- **Columns**: `@Column(name, nullable, length, unique, precision, scale)`, `@Transient`, `@Lob`, `@Enumerated(EnumType.STRING)`, `@Temporal` (legacy), `@Version` for optimistic locking.\n" +
        "- **Relationships**: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`, with `@JoinColumn`, `@JoinTable`, `mappedBy`, `cascade` and `orphanRemoval`.\n" +
        "- **Reuse**: `@Embeddable`/`@Embedded`, `@MappedSuperclass`, `@Inheritance(strategy)` with `@DiscriminatorColumn`.\n" +
        "- **Lifecycle**: `@PrePersist`, `@PostPersist`, `@PreUpdate`, `@PostLoad`, `@PreRemove`; Spring's `@CreatedDate`/`@LastModifiedDate` with `@EntityListeners(AuditingEntityListener.class)` and `@EnableJpaAuditing`.\n\n" +
        "The traps interviewers look for:\n\n" +
        "- **`@ManyToOne` and `@OneToOne` are EAGER by default**; `@OneToMany` and `@ManyToMany` are LAZY. Almost every N+1 problem starts with an accidental eager `@ManyToOne`. Set `fetch = LAZY` and fetch explicitly with a join fetch or an entity graph.\n" +
        "- **`@Enumerated` defaults to ORDINAL**, so reordering the enum silently corrupts data. Always write `EnumType.STRING`.\n" +
        "- **Bidirectional relationships need `mappedBy` on the inverse side**, otherwise Hibernate creates a second join table or an extra FK column.\n" +
        "- **`equals`/`hashCode` on entities** must not use a generated `@Id` (it is null before persist) and must not use all fields. Use a business key, or `getClass()` plus a natural id.\n" +
        "- **`@Transactional(readOnly = true)`** on queries lets Hibernate skip dirty checking and flushes.\n" +
        "- **`CascadeType.REMOVE` plus `@ManyToMany`** is how people delete production data by accident.",
      code: `import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "orders", indexes = @Index(name = "ix_orders_customer", columnList = "customer_id"))
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40, unique = true)
    private String reference;

    @Enumerated(EnumType.STRING)                 // never ORDINAL
    @Column(nullable = false, length = 20)
    private Status status = Status.NEW;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)   // override EAGER default
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> lines = new ArrayList<>();

    @Version private long version;                // optimistic locking
    @org.springframework.data.annotation.CreatedDate private Instant createdAt;

    // Business-key equality - safe before and after persist.
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order other)) return false;
        return reference != null && reference.equals(other.reference);
    }
    @Override public int hashCode() { return Order.class.hashCode(); }

    public void addLine(OrderLine l) { lines.add(l); l.setOrder(this); }  // keep both sides
}

enum Status { NEW, PAID, SHIPPED }`,
      codeLanguage: "java",
      explanation:
        "The trap list is the answer: EAGER *ToOne defaults, ORDINAL enums, missing mappedBy, and id-based equals on unsaved entities.",
      followUps: [
        "How do you fix an N+1 caused by a lazy collection?",
        "Why is hashCode() returning a constant acceptable for an entity?",
      ],
    },
    {
      id: "b015",
      question: "Which annotations drive JUnit 5 and Spring Boot testing, and what does each slice do?",
      answer:
        "JUnit 5 (Jupiter) core:\n\n" +
        "- `@Test`, `@BeforeEach`/`@AfterEach`, `@BeforeAll`/`@AfterAll` (static unless the class is `@TestInstance(PER_CLASS)`).\n" +
        "- `@DisplayName`, `@Nested`, `@Tag`, `@Disabled`, `@RepeatedTest`, `@Timeout`, `@Order` with `@TestMethodOrder`.\n" +
        "- Parameterised: `@ParameterizedTest` plus `@ValueSource`, `@CsvSource`, `@MethodSource`, `@EnumSource`, `@NullAndEmptySource`.\n" +
        "- `@ExtendWith` registers an extension — this is how Mockito (`MockitoExtension`) and Spring (`SpringExtension`) hook in.\n\n" +
        "Spring Boot test slices — each one starts the **minimum** context:\n\n" +
        "- **`@SpringBootTest`** — full application context. Add `webEnvironment = RANDOM_PORT` plus `TestRestTemplate`/`WebTestClient` for a real HTTP test. Slowest; use sparingly.\n" +
        "- **`@WebMvcTest(XController.class)`** — MVC layer only: controllers, `@ControllerAdvice`, converters, `MockMvc`. No services or repositories, so collaborate with `@MockBean` (`@MockitoBean` in Boot 3.4+).\n" +
        "- **`@DataJpaTest`** — JPA layer only, with an in-memory database by default, `TestEntityManager`, and **transactional and rolled back per test**. `@AutoConfigureTestDatabase(replace = NONE)` keeps your real DB (use with Testcontainers).\n" +
        "- **`@JsonTest`**, **`@RestClientTest`**, **`@DataRedisTest`**, **`@WebFluxTest`** — the same idea for other layers.\n\n" +
        "Supporting cast:\n\n" +
        "- `@MockBean`/`@SpyBean` replace a bean **in the context** (and invalidate the context cache — a real test-suite performance issue); `@Mock`/`@InjectMocks` are plain Mockito with no Spring at all.\n" +
        "- `@ActiveProfiles(\"test\")`, `@TestPropertySource`, `@DynamicPropertySource` (essential for Testcontainers), `@Sql` for fixture scripts, `@Transactional` on a test for automatic rollback.\n\n" +
        "**The performance point:** Spring caches contexts by configuration key. Every unique combination of slices, properties and mock beans creates another context — keeping the set small is what keeps a suite fast.",
      code: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)          // MVC slice only - fast
@ActiveProfiles("test")
class OrderControllerTest {

    @Autowired MockMvc mvc;
    @MockBean OrderService orderService;    // service layer is NOT loaded

    @Test
    @DisplayName("GET /orders/{id} returns 200 with the order payload")
    void returnsOrder() throws Exception {
        given(orderService.findByRef(anyString())).willReturn(new OrderDto("A-1", 250));

        mvc.perform(get("/orders/A-1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.reference").value("A-1"))
           .andExpect(jsonPath("$.total").value(250));
    }

    @ParameterizedTest
    @CsvSource({ "'', 400", "unknown, 404" })
    void rejectsBadInput(String ref, int expectedStatus) throws Exception {
        mvc.perform(get("/orders/" + ref)).andExpect(status().is(expectedStatus));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Slices exist to avoid booting the whole app; the senior signal is knowing @MockBean busts the context cache and slows the suite.",
      followUps: [
        "How does Spring decide whether to reuse a cached application context?",
        "When would you choose @SpringBootTest over @WebMvcTest?",
      ],
    },
    {
      id: "b016",
      question: "How do Lombok annotations work, and what are the real risks of using them?",
      answer:
        "Lombok is an **annotation processor that cheats**. A normal processor may only *generate new files*; Lombok reaches into javac's internal AST (`com.sun.tools.javac.tree`) and **modifies the class being compiled**, inserting getters, constructors and so on before bytecode generation. That is the source of both its power and its fragility.\n\n" +
        "The annotations you must know:\n\n" +
        "- `@Getter`/`@Setter` — per field or per class.\n" +
        "- `@ToString(exclude = ...)`, `@EqualsAndHashCode(of = ...)`, `@Data` (getter + setter + toString + equals/hashCode + required-args constructor).\n" +
        "- `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor` (final and `@NonNull` fields).\n" +
        "- `@Builder`/`@SuperBuilder`, `@Value` (immutable: final class, final fields, no setters).\n" +
        "- `@Slf4j` — injects `private static final Logger log`.\n" +
        "- `@SneakyThrows`, `@Cleanup`, `@With`.\n\n" +
        "The risks a senior engineer is expected to raise:\n\n" +
        "- **`@Data` on a JPA entity is a bug.** The generated `equals`/`hashCode` touches every field, which forces lazy collections to initialise and can trigger `StackOverflowError` on a bidirectional relationship; the generated `toString` does the same.\n" +
        "- **`@EqualsAndHashCode` including a generated id** breaks `Set` semantics before and after persist.\n" +
        "- **`@Builder` silently skips field initialisers** unless you add `@Builder.Default`, so `List<X> items = new ArrayList<>()` becomes `null`.\n" +
        "- **`@AllArgsConstructor` couples callers to field order**; adding a field of the same type silently reorders arguments with no compile error.\n" +
        "- **Toolchain fragility**: Lombok must be upgraded in lockstep with the JDK; it complicates GraalVM native image, JaCoCo coverage and IDE support without a plugin.\n\n" +
        "**The balanced answer:** use Lombok for DTOs and Spring components (`@RequiredArgsConstructor` for constructor injection is genuinely excellent), avoid `@Data` on entities, prefer Java `record` for immutable carriers now that it exists.",
      code: `import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

// GOOD: constructor injection with zero boilerplate, final fields.
@Service
@RequiredArgsConstructor
@Slf4j
class OrderService {
    private final OrderRepository repository;      // injected via generated ctor
    private final PricingClient pricing;

    void place(String ref) { log.info("placing {}", ref); }
}

// GOOD: an immutable DTO with a safe builder.
@Value
@Builder
class OrderDto {
    String reference;
    long total;
    @Builder.Default List<String> tags = new ArrayList<>();  // without this -> null
}

// BAD: @Data on an entity. equals/hashCode/toString touch every field,
// initialising lazy collections and recursing across the bidirectional link.
// @Data
// @Entity
// class Order {
//     @Id @GeneratedValue Long id;
//     @OneToMany(mappedBy = "order") List<OrderLine> lines;  // toString -> N+1 / SOE
// }

// FIXED: narrow the generated members explicitly.
@Getter @Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
class SafeEntity {
    Long id;
    @ToString.Include @EqualsAndHashCode.Include String businessKey;
    List<String> children = new ArrayList<>();
}`,
      codeLanguage: "java",
      explanation:
        "Lombok mutates javac's AST rather than generating files; the interview signal is naming @Data-on-entity and missing @Builder.Default as concrete production bugs.",
      followUps: [
        "Why does @Data on a bidirectional entity cause StackOverflowError?",
        "When would a record be a better choice than @Value?",
      ],
    },
  ],
  meta: {
    b001: { difficulty: "easy", priority: "very-high", tags: ["annotations", "reflection", "bytecode"], readMinutes: 4 },
    b002: { difficulty: "easy", priority: "very-high", tags: ["retention", "annotations", "classfile"], readMinutes: 3 },
    b003: { difficulty: "medium", priority: "high", tags: ["target", "elementtype", "records"], readMinutes: 4 },
    b004: { difficulty: "hard", priority: "very-high", tags: ["meta-annotation", "spring", "aliasfor"], readMinutes: 4 },
    b005: { difficulty: "medium", priority: "medium", tags: ["attributes", "constants", "arrays"], readMinutes: 3 },
    b006: { difficulty: "hard", priority: "high", tags: ["reflection", "proxy", "performance"], readMinutes: 4 },
    b007: { difficulty: "medium", priority: "medium", tags: ["repeatable", "container", "java8"], readMinutes: 3, versions: ["Java 8+"] },
    b008: { difficulty: "hard", priority: "high", tags: ["apt", "codegen", "compile-time"], readMinutes: 5 },
    b009: { difficulty: "easy", priority: "high", tags: ["builtin", "compiler", "generics"], readMinutes: 3 },
    b010: { difficulty: "medium", priority: "very-high", tags: ["aop", "custom-annotation", "proxy"], readMinutes: 5 },
    b011: { difficulty: "hard", priority: "high", tags: ["inherited", "aliasfor", "spring"], readMinutes: 4 },
    b012: { difficulty: "hard", priority: "low", tags: ["type-use", "null-safety", "java8"], readMinutes: 4, versions: ["Java 8+"] },
    b013: { difficulty: "medium", priority: "very-high", tags: ["validation", "jakarta", "spring"], readMinutes: 5 },
    b014: { difficulty: "medium", priority: "very-high", tags: ["jpa", "hibernate", "mapping"], readMinutes: 5 },
    b015: { difficulty: "medium", priority: "high", tags: ["junit5", "testing", "slices"], readMinutes: 5 },
    b016: { difficulty: "easy", priority: "high", tags: ["lombok", "boilerplate", "pitfalls"], readMinutes: 4 },
  },
});
