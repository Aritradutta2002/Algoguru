import { defineBackendChunk } from "./contract";

/**
 * Core Java Language & Modern Features (b222–b233).
 *
 * Fills the senior-level gaps from Chapter 1 of the master plan that the basic
 * core-java bank does not cover: design choices, records, Optional, the JMM-free
 * value semantics, and the Java 14–21 language features (var, sealed, pattern
 * matching) a 3–4 year backend engineer is expected to use.
 */
export const chunk15CoreJavaLang = defineBackendChunk({
  topic: "core-java-lang",
  questions: [
    {
      id: "b222",
      question: "Composition vs inheritance — which do you favour and why?",
      answer:
        "**Inheritance (is-a)** couples a subclass to its parent's implementation: the subclass can break when the parent changes (the fragile base class problem), you're limited to single inheritance, and it exposes the parent's whole API. It's right only for a genuine, stable is-a relationship where you want subtype polymorphism.\n\n" +
        "**Composition (has-a)** holds a collaborator as a field and delegates to it. It's more flexible: you depend on an interface, can swap implementations, change behaviour at runtime, and it's far easier to test (inject a mock). 'Favour composition over inheritance' (Effective Java) because it avoids the tight coupling and lets behaviour be assembled rather than fixed at compile time.\n\n" +
        "Practical rule: use inheritance for a small, stable type hierarchy you control (or to implement an interface); use composition + delegation for reuse. The decorator, strategy and adapter patterns are all composition. In Spring, injecting collaborators is composition by default.\n\n" +
        "A concrete symptom of misusing inheritance is the classic `Stack extends Vector` / `Properties extends Hashtable` mistake in the JDK itself: subclassing a collection leaks its whole API, so callers can bypass your invariants (for example calling `add()` on something meant to behave only as a stack). The deeper reason to favour composition is the Liskov Substitution Principle — inheritance is sound only when the subtype is a true behavioural substitute for the supertype; if you are inheriting merely to reuse code, that is a has-a relationship in disguise and composition expresses it more honestly and testably.",
      code: `// Inheritance couples Stack to ArrayList's entire API (push/pop AND add/remove!)
class BadStack<E> extends ArrayList<E> { /* leaks add(), get(), etc. */ }

// Composition: expose only what a stack should, delegate internally
class Stack<E> {
    private final Deque<E> items = new ArrayDeque<>();   // has-a
    public void push(E e) { items.push(e); }
    public E pop()        { return items.pop(); }
    public boolean isEmpty() { return items.isEmpty(); }
}`,
      codeLanguage: "java",
      explanation:
        "Reveals maintainability judgement — favour composition/delegation for reuse; reserve inheritance for a stable is-a with real polymorphism.",
      followUps: [
        "What is the fragile base class problem?",
        "How does the decorator pattern use composition?",
        "When is inheritance still the right choice?",
      ],
    },
    {
      id: "b223",
      question: "What are records (Java 16+) and when should you use them?",
      answer:
        "A **record** is a transparent carrier for immutable data. `record Point(int x, int y) {}` generates the private final fields, a canonical constructor, accessors (`x()`, `y()`), and value-based `equals`/`hashCode`/`toString` — eliminating boilerplate for DTOs, value objects and multiple-return results.\n\n" +
        "Key properties: records are **implicitly final and immutable** (components can't be reassigned), and equality is **structural** (two records with equal components are equal).\n\n" +
        "**Compact canonical constructor** lets you validate/normalize without repeating the assignments. You can add methods and static factories, and implement interfaces, but can't extend a class.\n\n" +
        "**When:** DTOs/API request-response, value objects, map keys, tuple-like returns. **When not:** JPA `@Entity` (needs a no-arg constructor, mutable fields, proxies — records don't fit); also avoid if you need mutability or identity semantics. Records make equals/hashCode correct by default, which removes a whole class of bugs.\n\n" +
        "Under the hood a record is still a normal final class extending `java.lang.Record`; you can override any generated member (e.g. a custom `toString`) and declare static fields and static factories, but you cannot add extra *instance* fields beyond the components. Records shine with the other modern features — they deconstruct in pattern-matching switches and pair naturally with sealed interfaces to model closed, algebraic domain types. If you need to 'modify' one, expose a `with`-style method that returns a new instance, keeping the value immutable.",
      code: `public record Money(BigDecimal amount, Currency currency) {
    // Compact canonical constructor: validate + normalize
    public Money {
        Objects.requireNonNull(currency);
        if (amount.signum() < 0) throw new IllegalArgumentException("negative");
        amount = amount.setScale(2, RoundingMode.HALF_EVEN);
    }
    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException();
        return new Money(amount.add(other.amount), currency);
    }
}
// equals/hashCode/toString/accessors are generated; Money is immutable + final`,
      codeLanguage: "java",
      explanation:
        "Modern Java feature — records for immutable value carriers with generated equals/hashCode; not suitable as JPA entities.",
      followUps: [
        "Why is a record a poor fit for a JPA @Entity?",
        "What does the compact constructor let you do?",
        "Are records mutable? Can they extend a class?",
      ],
    },
    {
      id: "b224",
      question: "How do you use Optional correctly?",
      answer:
        "`Optional<T>` models 'a value that may be absent' explicitly, so callers can't ignore the empty case as they would a null. Use it primarily as a **return type** for methods that may find nothing.\n\n" +
        "**Good practice:**\n\n" +
        "- Consume it functionally: `map`, `filter`, `flatMap`, and terminal `orElse`/`orElseGet`/`orElseThrow`.\n" +
        "- Prefer `orElseGet(supplier)` over `orElse(expensive())` — `orElse`'s argument is **always evaluated**, even when a value is present.\n" +
        "- `orElseThrow()` to convert absence into a domain exception.\n\n" +
        "**Anti-patterns:** calling `get()` without `isPresent()` (defeats the purpose, throws `NoSuchElementException`); using `Optional` for **fields** or **method parameters** (it adds cost and doesn't serialize well — use overloads/null there); returning `null` from a method that declares `Optional`; wrapping collections (return an empty collection instead).\n\n" +
        "Also avoid `Optional` in performance-critical hot paths or large arrays — each one is a heap allocation, and there are primitive specializations (`OptionalInt`, `OptionalLong`, `OptionalDouble`) to skip boxing when you need them. `ifPresentOrElse` handles the both-branches case, and `Optional.stream()` (Java 9+) lets you flat-map a stream of optionals into a stream of present values. The mental model: `Optional` is a single-item container that forces the caller to make a conscious decision about absence, not a general-purpose replacement for every nullable reference.",
      code: `public Optional<User> findByEmail(String email) { ... }

// Functional consumption; lazy default via orElseGet
String name = findByEmail(email)
        .map(User::name)
        .filter(n -> !n.isBlank())
        .orElseGet(() -> "anonymous");   // supplier NOT run if present

// Absence -> domain exception
User u = findByEmail(email)
        .orElseThrow(() -> new UserNotFoundException(email));

// Anti-pattern: never do this
// User bad = findByEmail(email).get();  // throws if empty`,
      codeLanguage: "java",
      explanation:
        "Checks mature null-handling — Optional as a return type, functional consumption, orElseGet vs orElse, and avoiding get()/Optional fields.",
      followUps: [
        "Why orElseGet over orElse for a costly default?",
        "Why not use Optional for fields or parameters?",
        "What should a method return instead of Optional<List>?",
      ],
    },
    {
      id: "b225",
      question: "Is Java pass-by-value or pass-by-reference?",
      answer:
        "Java is **always pass-by-value**. For primitives, the value is copied. For objects, the **reference is copied by value** — both the caller's variable and the parameter point to the *same* object, but they are independent references.\n\n" +
        "Consequences:\n\n" +
        "- **Mutating the object** through the parameter is visible to the caller (same object): `list.add(x)` inside a method affects the caller's list.\n" +
        "- **Reassigning the parameter** to a new object does **not** affect the caller — you only changed the copy of the reference. That's why a classic `swap(a, b)` method can't swap two references.\n\n" +
        "So: object *state* changes propagate; *reference* reassignments don't. This trips people who think Java is pass-by-reference. Immutable objects (String, Integer, records) can never be changed through the parameter at all, which is one reason immutability simplifies reasoning.\n\n" +
        "The precise mental model: think of every variable as holding either a primitive value or a *reference value* (an arrow to an object). A method call copies whatever is in the variable into the parameter. Copying an arrow gives you a second arrow to the same object — hence visible state mutations — but overwriting your local arrow to point elsewhere leaves the caller's arrow untouched. This is exactly the same semantics as C's pass-by-value of a pointer; Java simply has no way to pass the variable itself (no `&` / out-parameters), so to 'return' extra values you use a return object, a holder, or a mutable container.",
      code: `static void mutate(List<String> list) { list.add("x"); }   // affects caller
static void reassign(List<String> list) { list = new ArrayList<>(); } // does NOT
static void swap(int[] a) { int t = a[0]; a[0] = a[1]; a[1] = t; }     // works via state

public static void main(String[] a) {
    List<String> l = new ArrayList<>();
    mutate(l);     System.out.println(l);   // [x]  -> same object mutated
    reassign(l);   System.out.println(l);   // [x]  -> caller's ref unchanged
}`,
      codeLanguage: "java",
      explanation:
        "Clears a fundamental misconception — Java copies the reference by value; state changes show, reassignments don't.",
      followUps: [
        "Why can't you write a swap(Object a, Object b) that swaps references?",
        "How does this differ for primitives?",
        "Why does immutability make this simpler to reason about?",
      ],
    },
    {
      id: "b226",
      question: "What does var (local variable type inference) do, and when does it hurt readability?",
      answer:
        "`var` (Java 10) lets the compiler infer a **local variable's** type from its initializer. It's **compile-time only** — Java stays statically typed; `var` is not `Object`, not dynamic, and the inferred type is fixed. It only works for locals with an initializer (not fields, parameters, or `null`/lambda targets without a target type).\n\n" +
        "**Good uses:** removing redundant, noisy type names where the right-hand side already makes the type obvious — `var users = new ArrayList<User>();`, `var entry = map.entrySet().iterator().next();`, loop variables.\n\n" +
        "**Where it hurts:** when the initializer *doesn't* reveal the type — `var result = service.process();` hides what you got; factory methods, chained calls returning surprising types, and diamond-with-var (`var list = new ArrayList<>();` infers `ArrayList<Object>`). Readability is the deciding factor: use `var` when it removes redundancy, spell the type out when it aids understanding.\n\n" +
        "Two more facts worth stating: `var` never changes runtime behaviour or performance — it is pure compile-time inference, so the bytecode is identical to writing the type out. And it can subtly change *which* type you get: `var x = 1` infers `int`, and `var list = List.of(...)` infers the exact (often immutable) implementation type, which can surprise you later. Java 21 adds `var` in lambda parameters and record patterns too. Team convention usually settles the style debate; the Google/JDK guidance is to use it where the initializer's type is obvious to a reader skimming the code.",
      code: `// Good: type is obvious from the right-hand side
var orders = new ArrayList<Order>();
var byId   = new HashMap<Long, Order>();
for (var o : orders) { /* ... */ }

// Bad: reader can't tell what this is
var r = repository.lookup(id);        // Order? Optional<Order>? DTO?

// Trap: infers ArrayList<Object>, not what you meant
var list = new ArrayList<>();          // avoid var with the diamond`,
      codeLanguage: "java",
      explanation:
        "Modern code-style question — var infers at compile time; use it to cut redundancy, avoid it when it hides the type.",
      followUps: [
        "Is var dynamic typing? Why not?",
        "Where can't you use var?",
        "Why is `var x = new ArrayList<>()` a trap?",
      ],
    },
    {
      id: "b227",
      question: "What are sealed classes and interfaces, and what problem do they solve?",
      answer:
        "Sealed types (Java 17) let you **restrict which types may extend/implement** a class or interface via a `permits` clause. The permitted subtypes must be `final`, `sealed`, or `non-sealed`. This gives a **closed, known hierarchy** — the opposite of an open interface anyone can implement.\n\n" +
        "**Why it matters:**\n\n" +
        "- **Exhaustiveness** — with a sealed hierarchy, a `switch` pattern match over it can be checked by the compiler to cover all cases (no `default` needed), so adding a new subtype forces you to handle it everywhere. This is how you model algebraic data types / a domain's finite set of states.\n" +
        "- **Safer API design** — you control and document the full set of implementations; consumers can't inject unexpected subtypes.\n\n" +
        "Great for domain modelling (`sealed interface PaymentResult permits Approved, Declined, Pending`) combined with pattern-matching switches. Sealed is stronger than `final` (which forbids *any* subclass) because it allows a *specific* set.\n\n" +
        "Mechanics to remember: the permitted subtypes must be in the **same module** (or same package for the unnamed module) and each must pick its own openness — `final` (no further extension), `sealed` (continue the closed hierarchy), or `non-sealed` (deliberately re-open it to arbitrary subclasses). You can omit the explicit `permits` clause when all subtypes live in the same file, and the compiler infers it. Sealed types are the enabling feature behind exhaustive pattern-matching switches, so they usually appear together — sealed interface plus records plus a `switch` is the idiomatic way to model a finite set of states in modern Java.",
      code: `sealed interface Shape permits Circle, Rectangle {}
record Circle(double r) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

static double area(Shape s) {
    // Exhaustive: compiler knows the full set -> no default needed.
    return switch (s) {
        case Circle c    -> Math.PI * c.r() * c.r();
        case Rectangle r -> r.w() * r.h();
    };
}
// Add a new permitted type -> this switch fails to compile until handled.`,
      codeLanguage: "java",
      explanation:
        "Java 17 feature for safe modelling — closed hierarchies enabling compiler-checked exhaustive switches over a finite type set.",
      followUps: [
        "final vs sealed — what's the difference?",
        "How do sealed types enable exhaustive switches?",
        "What must permitted subtypes be declared as?",
      ],
    },
    {
      id: "b228",
      question: "Explain pattern matching for instanceof and switch.",
      answer:
        "**Pattern matching for `instanceof`** (Java 16) binds the cast variable in the same test, removing the redundant cast: `if (o instanceof String s)` gives you `s` typed as `String` in that scope — including with `&&` and flow scoping.\n\n" +
        "**Pattern matching for `switch`** (Java 21) lets `case` labels be **type patterns** with optional **guards** (`when`), and supports **record deconstruction**. Combined with sealed types the compiler enforces **exhaustiveness**, so you don't need `default` and can't forget a case.\n\n" +
        "**Null handling** — a traditional `switch` throws on null; the new switch lets you add an explicit `case null` so you handle it deliberately.\n\n" +
        "This replaces verbose `instanceof`-cast chains and the visitor pattern with concise, type-safe, exhaustive dispatch — a big readability and safety win for modelling domain data.\n\n" +
        "The **binding variable respects flow scoping**: in `if (!(o instanceof String s)) return; use(s);` the compiler knows `s` is definitely a `String` after the early return, so it stays in scope for the rest of the method. **Record patterns** nest, so you can destructure deeply — `case Line(Point(var x1, var y1), Point(var x2, var y2))` pulls out all four coordinates at once. Guards (`when`) let two cases of the same type diverge on a runtime condition, and case order matters: a more specific guarded case must come before the unguarded fallback of the same type or the code won't compile.",
      code: `sealed interface Event permits Login, Purchase {}
record Login(String user) implements Event {}
record Purchase(String user, double amount) implements Event {}

static String describe(Event e) {
    return switch (e) {
        case null                       -> "no event";           // explicit null
        case Login l                    -> "login by " + l.user();
        case Purchase p when p.amount() > 1000
                                        -> "BIG purchase by " + p.user();  // guard
        case Purchase p                 -> "purchase by " + p.user();
    };  // exhaustive over the sealed set -> no default
}

// instanceof pattern: no explicit cast
Object o = ...;
if (o instanceof String s && !s.isBlank()) return s.trim();`,
      codeLanguage: "java",
      explanation:
        "Modern Java syntax & safety — binding patterns, guards, record deconstruction, explicit null, and sealed-driven exhaustiveness.",
      followUps: [
        "How does pattern matching remove the redundant cast?",
        "How do guards (when) work in a switch?",
        "How does the new switch handle null?",
      ],
    },
    {
      id: "b229",
      question: "How do you work with the java.time (Date/Time) API?",
      answer:
        "The legacy `Date`/`Calendar` are mutable, not thread-safe, and error-prone (0-based months). Since Java 8 use **`java.time`** (JSR-310), which is immutable and thread-safe:\n\n" +
        "- **`LocalDate` / `LocalTime` / `LocalDateTime`** — date/time **without** a zone (e.g. a birthday, a business date).\n" +
        "- **`Instant`** — a point on the UTC timeline (a timestamp); best for storing 'when something happened'.\n" +
        "- **`ZonedDateTime` / `OffsetDateTime`** — an instant *with* a zone/offset for display or zone-aware math; `ZoneId` for regions.\n" +
        "- **`Duration`** (time-based) and **`Period`** (date-based) for amounts.\n\n" +
        "**Rules that prevent bugs:** store and compute in **UTC** (`Instant`), convert to the user's zone only at the edges; persist as `timestamptz`; use `DateTimeFormatter` (thread-safe, unlike `SimpleDateFormat`) for parsing/formatting; never do date math with millis. JPA maps `Instant`/`LocalDateTime` directly. Most 'time bugs' come from mixing zones or using the legacy API.\n\n" +
        "All `java.time` types are immutable, so 'mutations' return a new instance (`date.plusDays(1)` doesn't change `date`) — assign the result. They're also comparable and expose a fluent API (`isBefore`, `until`, `truncatedTo`, `with(TemporalAdjusters.lastDayOfMonth())`). Prefer `OffsetDateTime` over `LocalDateTime` at API/DB boundaries because a bare local date-time is ambiguous without a zone. And beware daylight-saving edges: adding a `Duration` of 24 hours is not the same as adding a `Period` of one day across a DST transition — use `Period`/`ZonedDateTime` for calendar arithmetic and `Duration`/`Instant` for elapsed-time arithmetic.",
      code: `Instant now = Instant.now();                       // UTC timestamp -> store this
ZonedDateTime local = now.atZone(ZoneId.of("Asia/Kolkata")); // for display

LocalDate due = LocalDate.now().plusDays(30);      // business date, no zone
boolean overdue = due.isBefore(LocalDate.now());

Duration ttl = Duration.between(Instant.now(), expiry);
DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;  // thread-safe
String iso = fmt.format(now);`,
      codeLanguage: "java",
      explanation:
        "Date bugs are common — java.time immutability, Instant/UTC for storage, zones only at the edges, thread-safe DateTimeFormatter.",
      followUps: [
        "Instant vs LocalDateTime — which for a stored event time?",
        "Why is SimpleDateFormat dangerous?",
        "Period vs Duration?",
      ],
    },
    {
      id: "b230",
      question: "Explain the difference between final, finally and finalize.",
      answer:
        "Three unrelated things that share a prefix:\n\n" +
        "- **`final`** — a modifier. A `final` variable can't be reassigned (must be set once), a `final` method can't be overridden, a `final` class can't be extended. `final` fields aid immutability and give safe-publication guarantees under the JMM.\n" +
        "- **`finally`** — a block after `try`/`catch` that **always runs** (whether or not an exception was thrown), used for cleanup. Note: a `return`/`throw` in `finally` can swallow a pending exception — avoid it. `try-with-resources` is the modern replacement for most `finally` cleanup.\n" +
        "- **`finalize()`** — a deprecated (since Java 9, removed for use later) `Object` method the GC *might* call before reclaiming an object. It's **unreliable** (no guarantee it runs, when, or on which thread), hurts GC, and can resurrect objects. Never use it; use `try-with-resources`/`AutoCloseable` or `java.lang.ref.Cleaner` for native resource cleanup.\n\n" +
        "A related subtlety: `final` on a reference makes the *reference* unassignable, not the object it points to — a `final List` can still have elements added; true immutability needs an unmodifiable/immutable collection as well. `final` also enables the compiler and JIT to reason more aggressively and is required for a local/parameter captured by a lambda or anonymous class (it must be final or 'effectively final'). And on `finally`: because it always runs, a `System.exit()` in the `try` is the one thing that skips it, and returning a value from `finally` overrides any earlier return — both are traps worth avoiding.",
      code: `final int MAX = 100;              // cannot be reassigned
// MAX = 200;                     // compile error

try {
    return compute();
} finally {
    releaseResources();           // ALWAYS runs (prefer try-with-resources)
}

// finalize(): don't. Use AutoCloseable / Cleaner instead.
class Resource implements AutoCloseable {
    public void close() { /* deterministic cleanup */ }
}`,
      codeLanguage: "java",
      explanation:
        "Common confusion point — final (modifier), finally (cleanup block), finalize (deprecated, unreliable GC hook to avoid).",
      followUps: [
        "Why is finalize() deprecated and dangerous?",
        "What's the modern replacement for cleanup?",
        "Why avoid return inside finally?",
      ],
    },
    {
      id: "b231",
      question: "What strategies do you use to avoid NullPointerExceptions?",
      answer:
        "NPEs are the most common runtime failure; the goal is a clear **null policy** so nulls don't propagate:\n\n" +
        "- **Fail fast at boundaries** — validate inputs with `Objects.requireNonNull(x, \"msg\")` in constructors/public methods so a null is caught at the source, not three layers deeper.\n" +
        "- **Return `Optional`** (or empty collections) instead of null from methods that may find nothing; never return null for a collection.\n" +
        "- **Prefer immutability** and set all required fields in the constructor so an object is never partially built.\n" +
        "- **Nullability annotations** (`@Nullable`/`@NonNull`, JSpecify) + IDE/static analysis catch many at compile time.\n" +
        "- **Null-safe utilities** — `Objects.equals`, `Objects.requireNonNullElse`, `Map.getOrDefault`, order constants first (`\"X\".equals(s)`).\n" +
        "- Java 14+ **Helpful NullPointerExceptions** tell you exactly which variable was null.\n\n" +
        "The theme: make absence explicit (Optional), reject null at the edges (requireNonNull), and let types/tools enforce it.\n\n" +
        "Complementary tactics: apply the **Null Object pattern** where a benign do-nothing implementation is cleaner than repeated null checks (e.g. a no-op logger); keep nulls out of collections entirely, since `List.of`/`Map.of` and streams reject them and surface the bug early; and normalize external input (JSON, DB, request params) at the boundary so nulls never leak into the domain. In Kotlin-adjacent or annotated codebases, wire the nullability annotations into the build (via the IDE inspections or a checker) so a potential NPE becomes a compile-time error rather than a 2 a.m. page. The goal is that by the time data reaches business logic, its nullability is already guaranteed.",
      code: `public final class Order {
    private final Customer customer;
    private final List<Item> items;

    public Order(Customer customer, List<Item> items) {
        this.customer = Objects.requireNonNull(customer, "customer");  // fail fast
        this.items = List.copyOf(items);                               // NPE if null elem
    }
}

// Return empty, not null
public List<Item> items() { return items; }                 // never null
String code = Objects.requireNonNullElse(input, "DEFAULT"); // null-safe default`,
      codeLanguage: "java",
      explanation:
        "Directly improves reliability — fail-fast requireNonNull at boundaries, Optional/empty returns, immutability and nullability tooling.",
      followUps: [
        "Where do you put requireNonNull and why?",
        "Why return an empty collection instead of null?",
        "How do nullability annotations help?",
      ],
    },
    {
      id: "b232",
      question: "What do backend developers need to know about Unicode and UTF-8?",
      answer:
        "Text is **characters**, encoded into **bytes** by a charset. Confusing the two causes mojibake (garbled text) and off-by-N bugs.\n\n" +
        "- **Unicode** assigns a code point to each character; **UTF-8** is the dominant variable-length encoding (1 byte for ASCII, up to 4 for others). Always use **UTF-8** end to end.\n" +
        "- A Java `char` is a **UTF-16 code unit**, not a full character. Characters outside the BMP (emoji, some CJK) are **surrogate pairs** — two `char`s. So `String.length()` returns code *units*, not visible characters; use `codePointCount`/`codePoints()` when counting real characters, and be careful with `substring` splitting a surrogate pair.\n" +
        "- **Bytes vs length:** `\"€\".length()` is 1 but its UTF-8 encoding is 3 bytes — matters for DB column sizes and byte limits.\n\n" +
        "**Backend hygiene:** set UTF-8 for HTTP (`charset=utf-8`), the DB (`utf8mb4` on MySQL — plain `utf8` can't store emoji!), file IO (`new String(bytes, StandardCharsets.UTF_8)` — never rely on the platform default), and JVM (`-Dfile.encoding=UTF-8`). Most 'weird character' production issues are an encoding mismatch somewhere in that chain.",
      code: `String s = "cafe\\u0301 \\uD83D\\uDE00";       // "café 😀" (é combined, emoji = surrogate pair)
System.out.println(s.length());              // code UNITS (not characters)
System.out.println(s.codePointCount(0, s.length())); // real characters

byte[] utf8 = s.getBytes(StandardCharsets.UTF_8);   // always specify charset
String back = new String(utf8, StandardCharsets.UTF_8);
System.out.println("€".getBytes(StandardCharsets.UTF_8).length); // 3 bytes, length()==1`,
      codeLanguage: "java",
      explanation:
        "Explains international-text production issues — char is a UTF-16 unit, length != characters/bytes, and enforce UTF-8 across the stack.",
      followUps: [
        "Why is String.length() not the character count?",
        "Why utf8mb4 over utf8 in MySQL?",
        "Why always pass StandardCharsets.UTF_8 explicitly?",
      ],
    },
    {
      id: "b233",
      question: "How do cloning and copy constructors compare for making object copies?",
      answer:
        "You copy objects to avoid shared mutable state (defensive copies). Options:\n\n" +
        "- **`Cloneable`/`clone()`** — the classic mechanism, but broken by design (Effective Java): `Cloneable` has no `clone` method, `Object.clone()` is `protected` and does a **shallow** copy (nested mutable objects are shared), it bypasses constructors, doesn't play well with `final` fields, and needs an unchecked cast. Avoid it.\n" +
        "- **Copy constructor / static copy factory** — `new Order(existing)` or `Order.copyOf(existing)`. Explicit, type-safe, works with `final` fields, and you decide shallow vs **deep** per field. The recommended approach.\n\n" +
        "**Shallow vs deep:** a shallow copy shares nested objects (mutating one affects the other); a deep copy recursively copies them. For defensive copying of a field, copy mutable inputs on the way in and out.\n\n" +
        "For records/immutable objects you rarely need copies at all; to 'change' one, construct a new instance (a `with`-style method). Prefer immutability first, copy constructors second, `clone()` never.\n\n" +
        "For arrays, `array.clone()` and `Arrays.copyOf` are the accepted idiom (arrays support a well-defined shallow clone), but note they still copy references for object arrays, so nested elements are shared. For genuine deep copies of complex graphs, options include a hand-written recursive copy, serialization round-tripping (correct but slow and requiring `Serializable`), or a mapping library — each trades performance against convenience. Whichever you choose, decide deliberately per field whether sharing a nested object is safe: the whole point of a defensive copy is to stop a caller mutating your internal state through a leaked reference, so a shallow copy that shares the mutable parts defeats the purpose.",
      code: `public final class Order {
    private final long id;
    private final List<Item> items;

    public Order(long id, List<Item> items) {
        this.id = id;
        this.items = new ArrayList<>(items);     // defensive copy IN
    }
    // Copy constructor: explicit, controls depth, works with final fields
    public Order(Order other) {
        this.id = other.id;
        this.items = new ArrayList<>(other.items); // deep-ish copy of the list
    }
    public List<Item> items() { return List.copyOf(items); } // defensive copy OUT
}`,
      codeLanguage: "java",
      explanation:
        "Defensive API design — prefer copy constructors/factories (and immutability) over the broken Cloneable/clone mechanism.",
      followUps: [
        "Why is Cloneable considered broken?",
        "Shallow vs deep copy — give an example bug.",
        "How do records avoid the need for copies?",
      ],
    },
  ],
  meta: {
    b222: { difficulty: "medium", priority: "very-high", tags: ["oop", "composition", "inheritance"], readMinutes: 4 },
    b223: { difficulty: "medium", priority: "high", tags: ["records", "immutability", "java17"], readMinutes: 4, versions: ["Java 16+"] },
    b224: { difficulty: "medium", priority: "very-high", tags: ["optional", "null-safety", "api"], readMinutes: 4, versions: ["Java 8+"] },
    b225: { difficulty: "easy", priority: "very-high", tags: ["pass-by-value", "references", "fundamentals"], readMinutes: 4 },
    b226: { difficulty: "easy", priority: "high", tags: ["var", "type-inference", "readability"], readMinutes: 3, versions: ["Java 10+"] },
    b227: { difficulty: "medium", priority: "high", tags: ["sealed", "exhaustiveness", "java17"], readMinutes: 4, versions: ["Java 17+"] },
    b228: { difficulty: "medium", priority: "high", tags: ["pattern-matching", "switch", "java21"], readMinutes: 4, versions: ["Java 21"] },
    b229: { difficulty: "medium", priority: "high", tags: ["java-time", "instant", "timezone"], readMinutes: 4, versions: ["Java 8+"] },
    b230: { difficulty: "easy", priority: "high", tags: ["final", "finally", "finalize"], readMinutes: 3 },
    b231: { difficulty: "medium", priority: "very-high", tags: ["npe", "null-safety", "requirenonnull"], readMinutes: 4 },
    b232: { difficulty: "medium", priority: "medium", tags: ["unicode", "utf-8", "encoding"], readMinutes: 4 },
    b233: { difficulty: "medium", priority: "medium", tags: ["clone", "copy-constructor", "defensive-copy"], readMinutes: 4 },
  },
});
