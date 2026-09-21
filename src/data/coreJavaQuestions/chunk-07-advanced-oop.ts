import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Advanced Object Oriented Concepts — global questions 55-63, plus q226.
 * Covers polymorphism, instanceof, coupling, cohesion, encapsulation and the
 * four-part inner-class family (member, static nested, local, anonymous), and
 * closes with the design-pattern question q226, which renders as question 64.
 */
export const chunk07AdvancedOop = defineChunk({
  topic: "advanced-oop",
  questions: [
    {
      id: "q055",
      question: "What is polymorphism?",
      answer:
        "Polymorphism is the ability of one reference type to stand in for several concrete types, so a single call site can invoke different behaviour depending on the object actually behind the reference. Java gives you two distinct flavours, and interviewers expect you to keep them apart.\n\n**Compile-time (static) polymorphism:**\n\n- **Overloading**: same name, different parameter lists. The compiler picks the most specific applicable signature from the static types of the arguments, and that choice is fixed in the bytecode. Changing only the reference type can change which overload runs.\n- **Static binding**: `private`, `static` and `final` methods are also resolved at compile time, so they are never polymorphic.\n\n**Runtime (dynamic) polymorphism:**\n\n- **Overriding**: a subclass redeclares the same signature; `@Override` makes the intent compiler-checked.\n- **Dynamic dispatch**: the JVM resolves the call against the receiver's actual class — conceptually a per-class method table (vtable) lookup — so `Vehicle ref = new Car(); ref.start()` executes `Car.start()` even though both the field and the variable are typed `Vehicle`.\n\n**The classic trap:** fields are not polymorphic. Field access is resolved statically from the reference type, so a subclass field with the same name *hides* rather than overrides, and `((Vehicle) ref).label` reads the parent's copy while `((Car) ref).label` reads the child's. Method calls dispatch on the object; field reads dispatch on the reference.",
      code: `class Vehicle {
    String label = "vehicle";                       // field: bound by reference type

    public String describe() { return "a vehicle"; }
}

class Car extends Vehicle {
    String label = "car";                           // hides the parent field

    @Override
    public String describe() { return "a car"; }    // overrides: dynamic dispatch
}

public class PolymorphismDemo {
    public static void main(String[] args) {
        Vehicle ref = new Car();                    // upcast, still one type

        System.out.println(ref.describe());         // "a car"     -> runtime lookup
        System.out.println(ref.label);              // "vehicle"   -> compile-time field
        System.out.println(((Car) ref).label);      // "car"       -> reference type wins

        // Overloading is resolved purely from the static argument types
        System.out.println(sum(1, 2));              // int version
        System.out.println(sum(1, 2L));             // long version
    }

    static int sum(int a, int b) { return a + b; }
    static long sum(long a, long b) { return a + b; }
}`,
      codeLanguage: "java",
      explanation:
        "Separate overloading (static binding) from overriding (dynamic dispatch), then volunteer the trap that fields resolve by reference type.",
    },
    {
      id: "q056",
      question: "What is the use of instanceof operator in Java?",
      answer:
        "`instanceof` is a runtime type-check operator. It answers whether a reference is non-null and the object it points at is an instance of the given type, one of that type's supertypes, or an implementer of the given interface. Its real jobs are safe downcasting, writing a correct `equals`, and branching over heterogeneous collections.\n\n**Rules worth stating precisely:**\n\n- `null instanceof T` is always `false` and never throws, which is why a single `x instanceof Foo` test doubles as a null guard.\n- The check uses the **runtime class**, not the reference type: `Object o = \"text\"; o instanceof CharSequence` is true.\n- If the compiler can prove the types are unrelated, you get a compile error (inconvertible types). A `String` reference tested against `Integer` will not compile, and neither will testing a final class against an interface it cannot implement.\n- Arrays are covariant: `new String[0] instanceof Object[]` is true, and `instanceof String[]` distinguishes array types from other arrays.\n- `getClass() == Foo.class` is stricter than `instanceof`: it rejects subclasses and dynamic proxies.\n\n**Modern usage:** since Java 16, pattern matching removes the redundant cast and the `ClassCastException` risk of long if/else chains: `if (o instanceof String s) { s.length(); }`. The binding variable `s` is flow-scoped — in scope only where the compiler can prove the pattern matched — and it even works inside `&&` conditions.",
      code: `public class InstanceOfDemo {
    static void describe(Object value) {
        // null instanceof anything is false - no NullPointerException
        System.out.println("is String? " + (value instanceof String));

        // Java 16+ pattern matching: the cast is implied by the binding
        if (value instanceof String s && s.length() > 3) {
            System.out.println("long text: " + s.toUpperCase());
        } else if (value instanceof Integer i) {
            System.out.println("number: " + (i + 1));
        } else if (value instanceof int[] numbers) {
            System.out.println("int array of length " + numbers.length);
        } else {
            System.out.println("unmatched: " + value);
        }
    }

    public static void main(String[] args) {
        describe("guru");
        describe(41);
        describe(new int[] { 1, 2, 3 });
        describe(null);

        Object o = "text";
        System.out.println("CharSequence? " + (o instanceof CharSequence)); // true
        // Integer bad = (Integer) "text"; // compile error: inconvertible types
    }
}`,
      codeLanguage: "java",
      explanation:
        "They probe null-safety, the inconvertible-types compile error, and whether you know Java 16 pattern matching replaced the explicit downcast.",
    },
    {
      id: "q057",
      question: "What is coupling?",
      answer:
        "Coupling is the degree of interdependence between software modules — how much one unit of code knows about, depends on, or is affected by the internals of another. Low coupling is the goal: a change in one module then has a small blast radius, and modules stay independently testable and replaceable.\n\n**The spectrum, with concrete examples:**\n\n- **Tight coupling (bad)**: `OrderService` instantiates `new MySqlOrderRepository()` itself, calls its concrete methods, reads its public fields and interprets its error codes. Swapping the database, or unit-testing the service, means editing the service.\n- **Loose coupling (good)**: `OrderService` depends on an `OrderRepository` interface supplied through its constructor. It knows only the contract, so a live repository, an in-memory fake or a mock can be substituted without touching it.\n\n**How you actually reduce it:**\n\n- Depend on abstractions rather than concrete classes — the Dependency Inversion Principle.\n- Inject dependencies instead of constructing them internally.\n- Keep interfaces narrow: a one-method interface couples far less than a 30-method facade, and `java.util.function` types are the narrowest option of all.\n- Avoid global mutable state and static singletons, which couple every caller to shared mutable data.\n- Return immutable data rather than handing out internal objects that callers can mutate.\n\n**The trade-off:** coupling is never zero — some is essential for a program to exist. The craft is choosing which dependencies are stable and abstract, and then checking cohesion alongside coupling, because splitting a class for lower coupling often lowers cohesion inside the new pieces.",
      code: `import java.util.List;

record Order(String customerId, double amount) { }

class MySqlOrderRepository {
    double amountFor(String customerId) { return 42.0; }   // concrete, DB-bound, hard to fake
}

interface OrderRepository {                                // abstraction: the stable contract
    List<Order> findByCustomer(String customerId);
}

class TightOrderService {                                  // TIGHT: builds its own dependency
    private final MySqlOrderRepository repo = new MySqlOrderRepository();

    double total(String customerId) { return repo.amountFor(customerId); }
}

class LooseOrderService {                                  // LOOSE: only knows the interface
    private final OrderRepository repo;

    LooseOrderService(OrderRepository repo) { this.repo = repo; }

    double total(String customerId) {
        return repo.findByCustomer(customerId).stream()
                .mapToDouble(Order::amount).sum();
    }
}

class InMemoryOrderRepository implements OrderRepository {  // test double, no database
    public List<Order> findByCustomer(String customerId) {
        return List.of(new Order(customerId, 25.0));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Low coupling means depending on an injected interface rather than constructing a concrete class — illustrate it with the change the tight version forces.",
    },
    {
      id: "q058",
      question: "What is cohesion?",
      answer:
        "Cohesion is how strongly the responsibilities inside a single class or module belong together — how tightly focused it is on one job. High cohesion means every field and method serves one well-named purpose and every member is used by most operations; low cohesion means unrelated responsibilities are bundled together.\n\n**The spectrum, with concrete examples:**\n\n- **High cohesion (good)**: `PasswordHasher` exposes `hash` and `verify`, holds a salt or pepper setting and nothing else. One reason to change, one small test suite, no unused state.\n- **Low cohesion (bad)**: a `Utility` class that validates email addresses, formats dates, sends mail and builds JSON. Unrelated callers all depend on it, any edit risks unrelated behaviour, and it becomes a de-facto god class.\n\n**How you raise it:**\n\n- Apply the one-sentence test: describe the class without saying \"and\".\n- Split by reason to change, not by line count. Data plus the operations that guard it belong together — that is cohesion's partnership with encapsulation.\n- Extract a class when a field is touched by only one method, or when two groups of methods share no state at all.\n- Watch the usual suspects: god services, static helper grab bags, and fat interfaces implemented with `UnsupportedOperationException`.\n\n**Relationship to coupling:** the two are independent but usually improved together. A god class everyone calls is low cohesion *and* high coupling — the worst quadrant; a focused class behind a narrow interface is high cohesion and low coupling, which is the target. Splitting too aggressively lowers cohesion inside each piece and adds coupling between them, so cohesion is the counterweight telling you a split went too far.",
      code: `// HIGH cohesion: one responsibility, no unused members, one reason to change
class PasswordHasher {
    private final String pepper;

    PasswordHasher(String pepper) { this.pepper = pepper; }

    String hash(String password) {
        return Integer.toHexString((password + pepper).hashCode());
    }

    boolean verify(String password, String expected) {
        return hash(password).equals(expected);
    }
}

// LOW cohesion: four unrelated jobs, four unrelated reasons to change
class Utility {
    boolean isValidEmail(String value) { return value.contains("@"); }
    String formatDate(java.time.LocalDate date) { return date.toString(); }
    void sendMail(String to, String body) { System.out.println(to + ": " + body); }
    String toJson(String key, int value) { return '{' + key + ':' + value + '}'; }
}

public class CohesionDemo {
    public static void main(String[] args) {
        PasswordHasher hasher = new PasswordHasher("s3cr3t-pepper");
        String digest = hasher.hash("hunter2");
        System.out.println("verified: " + hasher.verify("hunter2", digest));
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want the one-sentence, single-responsibility test and the pairing idea that good design is high cohesion with low coupling.",
    },
    {
      id: "q059",
      question: "What is encapsulation?",
      answer:
        "Encapsulation is bundling data together with the operations that act on it, and hiding the internal representation behind a controlled API. The point is not getters and setters by reflex — it is that the object protects its own invariants so no outside code can put it into an invalid state.\n\n**What encapsulation actually buys you:**\n\n- **Invariant enforcement**: a `BankAccount` rejects a negative deposit instead of trusting every caller.\n- **Implementation freedom**: swap an `ArrayList` for a `LinkedList`, or a `double` for `BigDecimal`, without breaking callers.\n- **Lower coupling**: callers depend on behaviour, not on field layout, so refactoring stays local.\n- **Controlled exposure**: `private` fields, with `protected` or package-private seams only where subclasses genuinely need them.\n\n**How to apply it in Java:**\n\n- Keep fields `private` and expose behaviour: `account.deposit(50)` beats `account.balance += 50`.\n- Return defensive copies of arrays and mutable collections, or unmodifiable views.\n- Prefer immutable objects — `final` fields, a validating constructor, no setters — which are encapsulated by construction and safe to share between threads.\n- Never leak `this` from a constructor, and never return a direct reference to an internal mutable collection.\n\n**Interview nuance:** accessors that blindly mirror every field are not encapsulation, they are a public field wearing a costume — they leak the representation. Also, Java's `private` is a compile-time guarantee that reflection can still bypass, and package-private members are visible to the whole package. Hiding is a design discipline, not a security sandbox; JPMS modules and the deprecated `SecurityManager` were the attempted sandbox.",
      code: `public final class BankAccount {
    private final String owner;     // hidden representation, final for safety
    private double balance;         // never exposed for direct assignment

    public BankAccount(String owner, double openingBalance) {
        if (openingBalance < 0) {
            throw new IllegalArgumentException("opening balance cannot be negative");
        }
        this.owner = owner;
        this.balance = openingBalance;
    }

    public void deposit(double amount) {          // behaviour, not a setter
        if (amount <= 0) {
            throw new IllegalArgumentException("deposit must be positive");
        }
        balance += amount;
    }

    public double balance() { return balance; }   // read-only accessor

    public static void main(String[] args) {
        BankAccount account = new BankAccount("Asha", 100);
        account.deposit(50);
        System.out.println(account.owner + " has " + account.balance());
        // account.balance = -1;  // compile error: balance has private access
    }
}`,
      codeLanguage: "java",
      explanation:
        "Encapsulation is invariant protection behind behaviour; say that mirror-every-field accessors leak representation and are not encapsulation.",
    },
    {
      id: "q060",
      question: "What is an inner class?",
      answer:
        "An inner class, precisely a **non-static nested class**, is a class declared inside another class without `static`. It is a member of the outer class, and every instance is bound to one specific enclosing instance through a hidden synthetic field that the syntax spells `Outer.this`.\n\n**Consequences of that hidden link:**\n\n- It reads and writes the enclosing instance's `private` fields and calls its `private` methods directly; the compiler generates synthetic bridge accessors to make that legal at the bytecode level.\n- Instantiation needs an outer instance: `outer.new Inner()`. Inside the outer class `new Inner()` works implicitly on `this`.\n- It **cannot declare static members**, with one exception: `static final` compile-time constants (primitives and `String` literals).\n- Every inner instance keeps its outer instance reachable, which is the classic leak — a long-lived listener registered as an inner class pins the whole outer object, and if the outer object is a UI component or a session, that memory is gone.\n- Its class file is named `Outer$Inner`, so reflection and stack traces show the dollar sign.\n\n**Flavours of nesting** are member inner classes (declared in the class body, the subject here), local classes (declared in a method body) and anonymous classes (declared and instantiated in one expression). All three are non-static and capture an enclosing instance; the static nested class does not.\n\n**When to use it:** when the type is meaningful only in its outer class's context *and* needs genuine access to the outer instance. An `Iterator` walking the outer collection's private array is the canonical case — `java.util.ArrayList.Itr` is exactly that. Change the modifier to `static` the moment the enclosing instance is not needed.",
      code: `public class Outer {
    private int counter = 10;

    // Non-static inner class: implicitly holds a reference to an Outer instance
    class Inner {
        private static final int LIMIT = 5;   // compile-time constant is allowed

        void show() {
            counter++;                        // mutates the enclosing instance state
            System.out.println("Outer.this.counter = " + Outer.this.counter);
            System.out.println("limit = " + LIMIT);
        }
        // static int count = 0;             // compile error: static not allowed here
    }

    Inner create() { return new Inner(); }    // implicit this.new Inner()

    public static void main(String[] args) {
        Outer outer = new Outer();
        Outer.Inner inner = outer.new Inner(); // requires the enclosing instance
        inner.show();
        outer.create().show();

        System.out.println(inner.getClass().getName()); // Outer$Inner
    }
}`,
      codeLanguage: "java",
      explanation:
        "State the hidden Outer.this reference, the outer.new syntax, the no-static-members rule, and the leak it causes in listeners.",
    },
    {
      id: "q061",
      question: "What is a static inner class?",
      answer:
        "A **static nested class** is a class declared inside another class with the `static` modifier. Whatever the loose labelling suggests, it is not an inner class: it holds no reference to an enclosing instance, has no `Outer.this`, and behaves like a top-level class that simply lives inside another class's namespace.\n\n**What that buys you:**\n\n- **Instantiation without an outer object**: `Outer.Nested nested = new Outer.Nested()`, no `outer.new` syntax anywhere.\n- **Static members are legal**: `static` fields, methods and further nested `static` classes all compile, because there is no instance context to contradict.\n- **No leak, by construction**: it cannot touch the outer class's instance state — only its `static` members — so it can never accidentally pin an outer instance in memory.\n\n**Why use one instead of a separate top-level class:**\n\n- **Namespace and discoverability**: `Map.Entry`, a `Builder` living inside the class it builds, `Math.Constants`. The relationship is visible and the name cannot collide in the package.\n- **Tighter access control**: it may be `private`, so only the outer class can use it and it never appears in the public API.\n- **Access to outer privates**: given a reference, it can read the outer class's private members under normal access rules, which is convenient for tightly related helpers.\n\n**Rule of thumb:** default to `static` for every nested type. Remove `static` only when the nested class genuinely needs the enclosing instance — a minority of cases, and the usual source of leaks in listeners, callbacks and iterators.",
      code: `public class Cache {
    private static final int MAX_ENTRIES = 100;

    // static nested class: no reference to any Cache instance
    static class Entry {
        final String key;
        final String value;

        Entry(String key, String value) { this.key = key; this.value = value; }

        static Entry empty() { return new Entry("-", "-"); }  // static is legal here

        @Override
        public String toString() { return key + "=" + value; }
    }

    Entry build(String key, String value) {
        return new Entry(key, value);       // no Outer.this involved
    }

    public static void main(String[] args) {
        Cache.Entry entry = new Cache.Entry("q061", "static nested"); // no outer object
        System.out.println(entry + " / " + Cache.Entry.empty());
        System.out.println(new Cache().build("k", "v"));
        System.out.println("max entries = " + MAX_ENTRIES);
    }
}`,
      codeLanguage: "java",
      explanation:
        "It has no enclosing instance, may declare static members and cannot leak the outer object — a top-level class inside a namespace.",
    },
    {
      id: "q062",
      question: "Can you create an inner class inside a method?",
      answer:
        "Yes — that is a **local class**, and declaring it inside a method body, a constructor, an initialiser block or even a loop is perfectly legal. It is visible only within that block, and the compiler still emits a real class file named something like `Outer$1Local.class`.\n\n**Rules that trip people up:**\n\n- **No modifiers on the class itself**: no `public`/`private`, no `static`, no `final`. You write `class Helper { ... }` and nothing else.\n- **It may only capture effectively final locals**: any local variable or parameter it reads must never be reassigned after initialisation. Before Java 8 that meant `final`; the compiler now infers it, and a later reassignment produces \"local variables referenced from an inner class must be final or effectively final\".\n- **Why that restriction exists**: the captured value is copied into a synthetic field of the local class instance, so if the variable could change later, the copy would silently diverge from the original.\n- **It must be declared before the statement that instantiates it** — local classes are not forward-referenceable the way methods are.\n- **No static members** except compile-time constants, and it still captures the enclosing instance of its method's class.\n\n**Practical value today:** local classes are largely historical. For a one-method interface a lambda is shorter and clearer; for a small reusable helper type a `private static` nested class is easier to test. Local classes remain a reasonable fit when the helper genuinely needs several methods *and* the effectively final locals of that method.",
      code: `import java.util.stream.IntStream;

public class LocalClassDemo {
    public static void main(String[] args) {
        int threshold = 3;                    // effectively final: never reassigned

        // Local class declared inside the method body
        class EvenAbove {
            private final int limit;

            EvenAbove(int limit) { this.limit = limit; }

            boolean test(int value) { return value % 2 == 0 && value > limit; }

            int count(int[] values) {
                return (int) IntStream.of(values).filter(this::test).count();
            }
        }

        EvenAbove rule = new EvenAbove(threshold);       // captures the local variable
        System.out.println("matches = " + rule.count(new int[] { 1, 2, 4, 6, 8 }));
        System.out.println(rule.getClass().getName());   // LocalClassDemo$1EvenAbove

        // threshold++;  // would break: the local must stay effectively final
    }
}`,
      codeLanguage: "java",
      explanation:
        "Local classes may take no modifiers, cannot hold static members, must precede their use, and capture only effectively-final locals.",
    },
    {
      id: "q063",
      question: "What is an anonymous class?",
      answer:
        "An anonymous class is a class with no name, declared and instantiated in a single expression. It either extends one class or implements one interface — never both — and you reach for it when you need exactly one instance of a one-off implementation.\n\n**Syntax and rules:**\n\n- `Runnable task = new Runnable() { public void run() { ... } };` — the `new` target names the supertype, the braces hold the class body.\n- **No constructor is possible**, because there is no name to call. Instance initialiser blocks stand in, and any arguments in the `new` expression are forwarded to the superclass constructor instead.\n- **It cannot be `abstract` or `static`**, and it cannot declare static members other than compile-time constants.\n- **It captures effectively final local variables** from the enclosing method, exactly like a local class, plus the enclosing instance when created in an instance context — so the same listener-leak caveat applies.\n- **`this` inside the body is the anonymous instance**, so reaching the outer object requires `Outer.this.method()`.\n- **It compiles to its own class file**, typically `Outer$1.class`, `Outer$2.class` and so on.\n\n**Where it fits today:** for a single-method interface the lambda is the modern answer — `Runnable task = () -> run();` is shorter, creates no extra class file and carries no `this` confusion. Anonymous classes are still the right tool when you must extend a concrete class, override several methods in one object, add per-instance state (a lambda cannot) or define an abstract-method combination that no functional interface covers.",
      code: `import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class AnonymousClassDemo {
    public static void main(String[] args) {
        // Anonymous class implementing an interface, with its own mutable state
        Runnable reporter = new Runnable() {
            private int runs = 0;          // state a lambda cannot keep

            @Override
            public void run() {
                runs++;
                System.out.println("reported " + runs + " time(s)");
            }
        };
        reporter.run();
        reporter.run();

        // Anonymous class extending a concrete class - a lambda cannot do this
        Comparator<String> byLength = new Comparator<String>() {
            @Override
            public int compare(String a, String b) { return a.length() - b.length(); }
        };
        List<String> sorted = List.of("guru", "algo", "a").stream()
                .sorted(byLength).collect(Collectors.toList());
        System.out.println(sorted);

        // The same comparison as a lambda: no extra class file, no this confusion
        Comparator<String> modern = Comparator.comparingInt(String::length);
        System.out.println(modern.compare("algo", "guru"));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Anonymous classes extend or implement one type, take no constructor and capture effectively-final locals; lambdas replaced them for functional interfaces.",
    },
    {
      id: "q226",
      question: "What is the Singleton design pattern and how do you implement it safely in Java?",
      answer:
        "**Singleton** is a creational design pattern that guarantees a class has exactly one instance and provides a single global access point to it. It earns its place when a resource is genuinely singular — a connection pool, a metrics registry, a thread pool, an application-wide configuration — because a second copy is not merely wasteful but wrong: two caches do not share state, so the program quietly behaves as though it were two programs. It is one of the most frequently asked Java interview questions, and also one of the most frequently implemented badly.\n\n" +
        "The three parts that make a singleton:\n\n" +
        "- **A private constructor** — `private ConfigService() { }`. Outside code cannot call `new`, and Java does not synthesise a default constructor once you declare one, so this closes the only normal door.\n" +
        "- **A private static field** holding the single instance, with the class itself marked `final` so it cannot be subclassed into a second one.\n" +
        "- **A public static accessor** — `getInstance()` — the only way in, which decides when the instance is created and hands the same reference to every caller.\n\n" +
        "The constructor is the load-bearing part, not the field. A static field with a public constructor is not a singleton, it is a shared variable, and any caller can bypass the pattern with `new`. Everything interesting about the pattern follows from construction being private: when it happens, who may trigger it, and how many times it can happen under concurrency.\n\n" +
        "Lazy creation versus eager creation:\n\n" +
        "**Eager** creation initialises the field at class-load time: `private static final ConfigService INSTANCE = new ConfigService();`. It is one line, it is thread-safe for free because the JVM serialises class initialisation, and it is the right default when the object is cheap or always needed. **Lazy** creation defers construction to the first `getInstance()` call, which pays off only when the object is expensive and possibly unused. Eager pays for the object even when nothing uses it, and a heavy constructor turns a class-load into a startup pause; lazy avoids that but makes the concurrency problem yours.\n\n" +
        "Why the naive lazy version breaks under threads:\n\n" +
        "The obvious lazy singleton is a null check followed by an assignment, and that is exactly where it fails. The check and the assignment are two separate steps, and nothing stops the scheduler from interleaving two threads between them.\n\n" +
        "1. Thread A calls `getInstance()`, reads the field, and finds it `null`.\n" +
        "2. Thread A is preempted before it can store the new object.\n" +
        "3. Thread B calls `getInstance()`, reads the same field, still sees `null`, and constructs a second object.\n" +
        "4. Both threads return different references; whichever writes last silently wins, and the other holds a stale object forever.\n\n" +
        "**Marking the accessor synchronized fixes correctness but not the cost.** Every call — including the billions that arrive after the instance exists — now acquires the class monitor, paying for a lock on a read whose value can no longer change. Correct and unnecessarily slow: naming that trade-off out loud is what interviewers are listening for.\n\n" +
        "Double-checked locking, and why volatile is not optional:\n\n" +
        "Double-checked locking takes the common-case read off the lock. Read the field once into a local; if it is non-null, return it and never touch the monitor. Only the first call, where the field really is `null`, enters the `synchronized` block and re-checks — and that second check matters, because a thread that queued on the monitor may have been waiting while another thread finished constructing the object.\n\n" +
        "The detail that separates a good answer from a memorised one is `volatile`. The `new` expression is not atomic: memory is allocated, the constructor runs, and only then is the reference assigned. Without `volatile`, the compiler and the CPU are free to publish the reference before the constructor's writes to the object's fields become visible to other threads. A second thread can then pass the first null check, observe a non-null reference, and return an object whose fields are still default values — a partially constructed singleton that fails much later and far from the cause. `volatile` forbids that reordering and establishes a happens-before edge, so any thread that reads the reference is guaranteed to see a fully built object.\n\n" +
        "**Why the local variable matters:** `ConfigService local = instance;` reads the volatile field exactly once. A volatile read is not free, and reading the field repeatedly inside the method invites the optimiser to eliminate a check you were relying on. One read, one re-check under the lock, one write.\n\n" +
        "The other four ways a singleton can be beaten:\n\n" +
        "- **Reflection**: `setAccessible(true)` walks straight through the private modifier and builds a second instance. A guard in the constructor that throws when the field is already set restores the guarantee for a few lines.\n" +
        "- **Serialization**: deserialization allocates a fresh object and never calls the constructor, so a `Serializable` singleton comes back as a copy. Implement `readResolve()` to return the existing instance, or sidestep the problem with an enum.\n" +
        "- **Cloning**: a singleton that implements `Cloneable` without overriding `clone()` hands out copies. Override it to return the singleton, or do not implement `Cloneable` at all.\n" +
        "- **Multiple class loaders**: the promise is one instance per class loader, not per JVM. Two loaders or two JVMs each get their own singleton, which is why a singleton is not a distributed lock and why hot-reloading applications can briefly hold two.\n\n" +
        "The enum singleton - the answer interviewers are fishing for:\n\n" +
        "Joshua Bloch's recommendation in Effective Java is a single-element enum, and it is short enough to be the whole answer. `enum Registry { INSTANCE; }` gives one instance per class loader with no locking, because the JVM already serialises class initialisation. It defeats the reflection attack, since instantiation of an enum constructor through `newInstance` is rejected. It survives serialization, which returns the same constant rather than a copy. It is a compile-time-checked singleton with none of the boilerplate, and it can still implement interfaces. Two limitations are worth volunteering so the answer sounds measured rather than recited: it cannot be lazy, and being an enum it cannot extend a class.\n\n" +
        "When a singleton is the wrong tool:\n\n" +
        "- **It is hidden global state.** Every caller that reaches for `getInstance()` is coupled to a concrete class and its shared mutable contents — the tightest coupling there is, and the reason the pattern is so often called an anti-pattern.\n" +
        "- **It is untestable by construction.** You cannot inject a fake, and tests inherit whatever state the previous test left behind. Dependency injection — one container-managed instance passed through a constructor — delivers the same single-instance benefit while staying substitutable.\n" +
        "- **Spring's singleton is a different promise.** A `@Component` is singleton-scoped, meaning one instance per container, but it has a public constructor, the container builds it, and you can switch it to prototype scope with `@Scope`. Calling that the Singleton pattern is a common slip.\n" +
        "- **A stateless utility does not need it.** If the object holds no state, static methods are simpler and equally shareable.\n\n" +
        "The 30-second answer:\n\n" +
        "Private constructor, private static field, public static accessor. Lazy creation is not thread-safe until you synchronise the accessor or use double-checked locking with a `volatile` field, and `volatile` is required because the reference can otherwise be published before the constructor's writes are visible. Enums give all of that with no boilerplate and also survive reflection and serialization, which is why they are the recommended form — and dependency injection is the right form whenever the singleton would only be global mutable state.",
      code: `import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class ConfigService {                    // final: no subclass trickery

    private static volatile ConfigService instance;   // volatile publishes safely

    private final Map<String, String> settings;

    private ConfigService() {                         // the only door, and it is shut
        if (instance != null) {                       // blocks the reflection attack
            throw new IllegalStateException("Use ConfigService.getInstance()");
        }
        this.settings = loadFromDisk();               // slow, one-time work
    }

    public static ConfigService getInstance() {
        ConfigService local = instance;               // one volatile read, no lock
        if (local == null) {                          // fast path for every later call
            synchronized (ConfigService.class) {
                local = instance;                     // re-check: we may have lost the race
                if (local == null) {
                    local = new ConfigService();
                    instance = local;                 // volatile write ends the race
                }
            }
        }
        return local;
    }

    public String get(String key) { return settings.get(key); }

    private static Map<String, String> loadFromDisk() {
        return new ConcurrentHashMap<>(Map.of("region", "ap-south-1", "retries", "3"));
    }
}

// Bloch's recommendation: no locking, no readResolve, no reflection loophole.
enum Registry {
    INSTANCE;                                         // one instance per class loader

    private final Map<String, Integer> counters = new ConcurrentHashMap<>();

    void record(String name) { counters.merge(name, 1, Integer::sum); }

    Map<String, Integer> snapshot() { return Map.copyOf(counters); }
}`,
      codeLanguage: "java",
      explanation:
        "Cover the private constructor, then volatile in double-checked locking, and finish with the enum answer and its reflection and serialization guarantees.",
    },
  ],
  meta: {
    q055: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["polymorphism", "dispatch", "overloading"],
      relatedQuestionIds: ["q056", "q057", "q060"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q056: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["instanceof", "type-check", "pattern-matching"],
      relatedQuestionIds: ["q055", "q059", "q063"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+", "Java 16+"],
    },
    q057: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["coupling", "design", "dependency-injection"],
      relatedQuestionIds: ["q058", "q059"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q058: {
      difficulty: "medium",
      priority: "high",
      tags: ["cohesion", "design", "solid"],
      relatedQuestionIds: ["q057", "q059"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q059: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["encapsulation", "oop", "immutability"],
      relatedQuestionIds: ["q057", "q058", "q060"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q060: {
      difficulty: "medium",
      priority: "high",
      tags: ["inner-class", "nesting", "memory-leak"],
      relatedQuestionIds: ["q061", "q062", "q063"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q061: {
      difficulty: "medium",
      priority: "high",
      tags: ["nested-class", "static", "leak"],
      relatedQuestionIds: ["q060", "q062"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q062: {
      difficulty: "hard",
      priority: "high",
      tags: ["local-class", "effectively-final", "closures"],
      relatedQuestionIds: ["q060", "q061", "q063"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q063: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["anonymous-class", "lambda", "functional-interface"],
      relatedQuestionIds: ["q060", "q062", "q208"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q226: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["design-pattern", "singleton", "thread-safety", "double-checked-locking"],
      relatedQuestionIds: ["q057", "q059", "q197"],
      estimatedReadMinutes: 7,
      javaVersions: ["Java 1+", "Java 5+"],
    },
  },
});