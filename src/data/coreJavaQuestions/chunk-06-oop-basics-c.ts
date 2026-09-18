import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Object Oriented Programming Basics - global questions 46-54.
 * Covers abstract class vs interface, constructors, constructor chaining
 * (this/super), and two "will this compile?" constructor puzzles.
 */
export const chunk06OopBasicsC = defineChunk({
  topic: "oop-basics",
  questions: [
    {
      id: "q046",
      question: "Compare abstract class vs interface?",
      answer:
        "An abstract class and an interface are both incomplete types you cannot instantiate, but they solve different design problems. **An abstract class is a partial implementation**: it can own instance fields, constructors, protected members, and a mix of abstract and concrete methods. **An interface is a contract**: it declares what a type can do, holds no per-instance state, and gives unrelated classes a common supertype.\n\n" +
        "**What each one may contain:**\n\n" +
        "- **State**: an abstract class has instance fields, so subclasses genuinely share state; an interface may declare only `public static final` constants.\n" +
        "- **Constructors**: an abstract class has them, invoked from the subclass with `super(...)`; an interface cannot declare one at all.\n" +
        "- **Method bodies**: abstract classes supply concrete methods; interfaces supply `default` and `static` methods (Java 8) and `private` helper methods (Java 9).\n" +
        "- **Modifiers**: interface members are implicitly `public`, and `abstract` unless default, static or private, so `protected` is impossible there; an abstract class can use any access modifier.\n" +
        "- **Inheritance**: a class `extends` exactly one class but `implements` many interfaces, so interfaces give multiple inheritance of type, while `default` methods add a limited inheritance of behaviour that a clashing class must resolve explicitly.\n\n" +
        "**Modern guidance:** pick an interface when unrelated types share a capability (`Comparable`, `AutoCloseable`) or when you need multiple inheritance of type; pick an abstract class when closely related types share code and state, as `AbstractList` and `HttpServlet` do. Publish the interface as the public type and keep the abstract class as a partial implementation detail. Adding an abstract method breaks every subclass, whereas an interface can be evolved with a `default` method — a real reason to prefer interfaces for published APIs.",
      code: `interface Auditable {                   // contract: no instance state, many types
    String auditId();
    default String auditLine() { return "audit:" + auditId(); }
}

abstract class BaseEntity {             // partial implementation: state + constructor
    private final String id;
    protected BaseEntity(String id) { this.id = id; }
    public final String id() { return id; }
    public abstract String describe();
}

class Invoice extends BaseEntity implements Auditable {
    private final long amountInPaise;

    Invoice(String id, long amountInPaise) {
        super(id);                      // abstract classes participate in construction
        this.amountInPaise = amountInPaise;
    }
    @Override public String auditId() { return id(); }
    @Override public String describe() { return "INV " + id() + " = " + amountInPaise; }
}

class OopContractDemo {
    public static void main(String[] args) {
        Invoice invoice = new Invoice("INV-9", 25000L);
        System.out.println(invoice.describe() + " | " + invoice.auditLine());
    }
}`,
      codeLanguage: "java",
      explanation:
        "They test whether you know interfaces cannot hold instance state, and the capability-versus-shared-state rule for choosing between the two.",
    },
    {
      id: "q047",
      question: "What is a constructor?",
      answer:
        "**A constructor is the special code block that initialises a new object before any caller can use it.** It is not a method: it shares the class name, declares no return type at all (not even `void`), and the JVM invokes it only through object creation rather than normal method dispatch.\n\n" +
        "**Rules worth stating out loud:**\n\n" +
        "- **Name and return type**: the constructor must match the class name; adding any return type turns it into an ordinary method, which is a favourite trick question.\n" +
        "- **Not inherited, not overridden**: a subclass never inherits its parent's constructors, it can only reach them with `super(...)`, so constructor signatures take no part in polymorphism or overriding.\n" +
        "- **Modifiers**: constructors cannot be `abstract`, `static`, `final`, `synchronized` or `native`. They may be `private` (singletons, static factories, utility classes), carry any access modifier, declare `throws`, and be overloaded freely.\n" +
        "- **Internal order**: after the `super(...)` call, the class's field initialisers and instance initialiser blocks run in textual order and then the constructor body executes.\n\n" +
        "**How a constructor is invoked:** only via `new`, via `this(...)` or `super(...)` from another constructor, or reflectively through `Constructor.newInstance()`. You can never run one as a statement against an object that already exists. Visibility matters as well: `new` compiles only when the constructor is accessible from the calling code, which is exactly how a `private` constructor enforces controlled instantiation — for example `Collections.unmodifiableList(...)` or an enum-style singleton.",
      code: `class Order {
    private final String id;
    private final int quantity;
    // Field initialisers run after super() and before the constructor body
    private final long createdAt = System.currentTimeMillis();

    Order(String id) {                 // same name as class, no return type
        this(id, 1);                   // overload chaining
    }

    Order(String id, int quantity) {
        super();                       // explicit here for clarity; javac inserts it anyway
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        this.id = id;
        this.quantity = quantity;
    }

    // Not a constructor: a declared return type makes it an ordinary method
    void Order() {
        System.out.println("method named like the class");
    }

    public static void main(String[] args) {
        Order order = new Order("ORD-1", 3);   // only 'new' creates and initialises
        System.out.println(order.id + " x" + order.quantity + " @" + order.createdAt);
        order.Order();                         // method call, not a constructor call
    }
}`,
      codeLanguage: "java",
      explanation:
        "The trap is that a constructor has no return type and is never inherited; say that before listing the invocation paths.",
    },
    {
      id: "q048",
      question: "What is a default constructor?",
      answer:
        "**A default constructor is a no-argument constructor that the compiler inserts for you when, and only when, a class declares no constructor at all.** Its body is effectively a single implicit `super()` call, and its access modifier matches the class's own modifier, so a public class receives a public default constructor and a package-private class receives a package-private one.\n\n" +
        "**The precise rule interviewers probe:**\n\n" +
        "- **Any declared constructor suppresses it**: writing just `Order(String id)` removes the default no-arg constructor, so `new Order()` stops compiling.\n" +
        "- **Framework consequence**: reflective tools such as Hibernate, Jackson and Java serialization often require a no-arg constructor, which is why entities frequently declare one explicitly.\n" +
        "- **Superclass dependency**: the inserted constructor calls `super()`, so a subclass fails to compile until it chains to a valid superclass constructor whenever the parent has no accessible no-arg constructor.\n" +
        "- **Not the same as a written no-arg constructor**: a hand-written one is not a default constructor, and records and enums follow their own synthesised rules rather than this one.\n\n" +
        "**Practical takeaway:** if you add a parameterised constructor to a class that frameworks instantiate reflectively, add an explicit no-arg constructor in the same commit. The failure mode there is a runtime `NoSuchMethodException` rather than a compile error, because the reflective lookup is resolved dynamically at startup.",
      code: `class Report {
    // No constructor declared, so javac inserts the default one:
    //     Report() { super(); }
}

class WeeklyReport extends Report {
    private final java.time.LocalDate weekStart;

    WeeklyReport(java.time.LocalDate weekStart) {   // default ctor now suppressed
        this.weekStart = weekStart;
    }
    // new WeeklyReport() would not compile: no no-arg constructor exists
}

class DefaultConstructorDemo {
    public static void main(String[] args) {
        Report report = new Report();               // implicit default constructor
        WeeklyReport weekly = new WeeklyReport(java.time.LocalDate.of(2026, 9, 14));
        System.out.println(report.getClass().getSimpleName() + " ready");
        System.out.println("week starting " + weekly.weekStart);

        // Frameworks resolve this reflectively, so failures appear at run time
        try {
            Report other = Report.class.getDeclaredConstructor().newInstance();
            System.out.println("reflective: " + other.getClass().getSimpleName());
        } catch (ReflectiveOperationException e) {
            System.out.println("no usable constructor: " + e);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "They check the exact trigger: the compiler inserts a no-arg constructor only when no constructor is declared at all.",
    },
    {
      id: "q049",
      question: "Will this code compile?",
      answer:
        "**No — this snippet does not compile.** In `Car()` the first statement is `this(\"sedan\")`, which is fine on its own, but the following `super(\"base\")` is a second constructor invocation, and Java allows exactly one constructor call per constructor, strictly as the first statement.\n\n" +
        "**Exact compiler error:** `call to super must be first statement in constructor`. The same diagnostic family covers `this(...)` and `super(...)` whenever either appears anywhere but the first statement. The rule exists because object storage must be fully allocated and the superclass part initialised before the constructor body runs; a second delegation would try to initialise an object that is already partly initialised, and it would make the delegation order ambiguous.\n\n" +
        "**How to fix it:** choose a single entry point. Either delegate inside the class and let the target constructor call the superclass:\n\n" +
        "- `Car() { this(\"sedan\"); }` together with `Car(String model) { super(model); }` — the pattern shown in the next question.\n" +
        "- `Car() { super(\"base\"); }` — call the superclass directly and do not delegate.\n\n" +
        "**Related traps in the same family:** a `super(...)` call wrapped in an `if` or a `try` block fails with the same message, using an instance method as a `super(...)` argument fails with `cannot reference this before supertype constructor has been called`, and a `this(...)` call placed in an ordinary method is rejected because constructor delegation is only legal inside a constructor.",
      code: `// WILL NOT COMPILE - a constructor may contain only ONE constructor
// invocation, and it must be the first statement.
class Vehicle {
    private final String model;
    Vehicle() { this("generic"); }
    Vehicle(String model) { this.model = model; }
    String model() { return model; }
}

class Car extends Vehicle {
    Car() {
        this("sedan");          // legal: first statement delegates inside Car
        super("base");          // ERROR: call to super must be first statement in constructor
    }

    Car(String model) {
        super(model);           // the only legal placement for super(...)
    }
}

// javac output:
// Car.java:13: error: call to super must be first statement in constructor
//         super("base");
//              ^
// 1 error`,
      codeLanguage: "java",
      explanation:
        "One constructor call, first statement only — quoting the exact javac wording for a misplaced super() shows real debugging experience.",
    },
    {
      id: "q050",
      question: "How do you call a super class constructor from a constructor?",
      answer:
        "**Write `super(...)` as the very first statement of the subclass constructor.** Java permits exactly one constructor invocation per constructor, and the argument list selects which superclass constructor runs, including overloaded ones.\n\n" +
        "**The mechanics:**\n\n" +
        "- **Explicit form**: `super(iban, currency)` invokes the matching superclass constructor; it must be the first statement and can only appear inside a constructor, never in a method.\n" +
        "- **Implicit form**: if the constructor body does not begin with `this(...)` or `super(...)`, the compiler inserts a call to the superclass no-arg constructor.\n" +
        "- **No accessible no-arg constructor**: the implicit `super()` cannot resolve, so the code fails to compile with a no-suitable-constructor message until you chain explicitly.\n" +
        "- **Arguments**: expressions are allowed, but they must not use `this`. Calling an instance method or reading an instance field before the superclass part exists is rejected with `cannot reference this before supertype constructor has been called`; static calls and constructor parameters are safe.\n\n" +
        "**Execution order** for `new SavingsAccount(\"DE89\")`: `Object`'s constructor, then each superclass constructor top-down, then the subclass's field and instance initialisers, then the constructor body. That ordering explains why an overridable method invoked from a superclass constructor sees uninitialised subclass fields — nulls, zeros and false — which is one of the most common subtle bugs in Java codebases.",
      code: `class Account {
    private final String iban;
    private final String currency;

    Account(String iban, String currency) {
        this.iban = iban;
        this.currency = currency;
        System.out.println("Account(" + iban + ", " + currency + ")");
    }
}

class SavingsAccount extends Account {
    private final double rate;

    SavingsAccount(String iban) {
        this(iban, "EUR", 0.03);        // chains inside the class; super() runs there
    }

    SavingsAccount(String iban, String currency, double rate) {
        super(iban, currency);          // first statement: picks the 2-arg super ctor
        this.rate = rate;               // subclass state assigned after second here
        System.out.println("SavingsAccount rate=" + rate);
    }
}

class SuperCallDemo {
    public static void main(String[] args) {
        System.out.println(new SavingsAccount("DE89").rate);
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want super(...) as the first statement, the implicit super() rule, and the full top-down constructor order that follows.",
    },
    {
      id: "q051",
      question: "Will this code compile?",
      answer:
        "**Yes — this compiles and runs cleanly.** `Rectangle()` begins with `this(4, 3)`, which is a legal first statement, and the target constructor `Rectangle(int width, int height)` contains no explicit `super(...)`, so the compiler inserts `super()` for it. Instance initialisers run only once, inside the constructor that performs the `super()` call, not again when control returns to `Rectangle()`.\n\n" +
        "**Exact output:** `Shape() -> state initialised`, then `Rectangle(4, 3) -> fields set`, then `Rectangle() -> default 4x3`, and finally `area = 12`.\n\n" +
        "**Why the order looks like that:** the superclass constructor completes first, then the two `final` fields are assigned and their constructor body runs, and only then does the delegating constructor continue with its own body. Chaining gives one authoritative initialisation path, so `new Rectangle()` and `new Rectangle(4, 3)` share identical field-assignment code instead of duplicating it.\n\n" +
        "**Contrast with the usual trap:** overloaded constructors that each repeat the same assignment logic drift apart over time, and one of them eventually forgets validation. Let one constructor do the real work and have the others forward to it with defaults, assigning `final` fields exactly once. If you also need cached instances or named construction — `Rectangle.unitSquare()` — a `private` constructor plus a `static` factory method delivers the same single path.",
      code: `// COMPILES FINE - this(4, 3) is the first statement, and Rectangle(int, int)
// receives an implicit super() inserted by the compiler.
class Shape {
    Shape() {
        System.out.println("Shape() -> state initialised");
    }
}

class Rectangle extends Shape {
    private final int width;
    private final int height;

    Rectangle() {
        this(4, 3);                     // legal first statement: chain inside Rectangle
        System.out.println("Rectangle() -> default 4x3");
    }

    Rectangle(int width, int height) {
        // no this(...) or super(...) here, so javac inserts super()
        this.width = width;
        this.height = height;
        System.out.println("Rectangle(" + width + ", " + height + ") -> fields set");
    }

    int area() { return width * height; }

    public static void main(String[] args) {
        System.out.println("area = " + new Rectangle().area());
    }
}
// Output:
// Shape() -> state initialised
// Rectangle(4, 3) -> fields set
// Rectangle() -> default 4x3
// area = 12`,
      codeLanguage: "java",
      explanation:
        "Interviewers contrast this with the failing snippet: this(...) is legal when it is first, and the chained constructor supplies super() implicitly.",
    },
    {
      id: "q052",
      question: "What is the use of this()?",
      answer:
        "**`this(...)` invokes another constructor of the same class, so constructor logic is written once and reused.** It is constructor chaining, the intra-class counterpart of `super(...)`, and it must be the first statement of the constructor that uses it. Because each constructor may chain through at most one such call, chains are linear and always end in a constructor that calls `super(...)`, explicitly or implicitly.\n\n" +
        "**Why you use it:**\n\n" +
        "- **Remove duplication**: give one constructor the full parameter list and let shorter overloads forward to it with defaults, so field assignment and validation live in exactly one place.\n" +
        "- **Validate once**: the canonical constructor can enforce invariants before every other path returns, which prevents overloads that silently skip checks.\n" +
        "- **Model optional arguments**: `this(to, body, false)` gives default-argument behaviour without a builder, keeping the constructor count small.\n\n" +
        "**How it differs from `super(...)`**: `this(...)` stays inside the class and never touches the superclass chain directly, yet the chained constructor still runs every superclass constructor — the hierarchy is initialised exactly once. Note also the difference between the call `this(...)` and the reference `this`: `this` is the current object, `this(...)` is a constructor invocation.\n\n" +
        "**Restrictions**: legal only inside a constructor, only as the first statement, and it cannot coexist with a `super(...)` call in the same constructor. A `this(...)` call from a method is rejected by the compiler.",
      code: `class SmsMessage {
    private final String to;
    private final String body;
    private final boolean unicode;

    SmsMessage(String to) {
        this(to, "(empty)", false);       // short overload forwards to the canonical one
    }

    SmsMessage(String to, String body) {
        this(to, body, false);            // this() cannot coexist with super() here
    }

    SmsMessage(String to, String body, boolean unicode) {
        if (to == null || to.isBlank()) throw new IllegalArgumentException("to required");
        this.to = to;                     // validation and assignment happen once
        this.body = body;
        this.unicode = unicode;
    }

    @Override public String toString() {
        return "SMS to=" + to + " body=" + body + " unicode=" + unicode;
    }

    public static void main(String[] args) {
        System.out.println(new SmsMessage("+49123"));
        System.out.println(new SmsMessage("+49123", "hello"));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Chaining avoids duplicated initialisation, must be the first statement, and cannot coexist with super(...) in the same constructor.",
    },
    {
      id: "q053",
      question: "Can a constructor be called directly from a method?",
      answer:
        "**No. A constructor cannot be called like an ordinary method.** It declares no return type, it owns no independent existence on an already-created object, and the JVM's internal `<init>` method runs on freshly allocated, uninitialised storage — only the object-creation machinery may invoke it.\n\n" +
        "**The only ways a constructor ever runs:**\n\n" +
        "- **`new`**: `new Order(\"ORD-1\")` — the compiler emits `new`, `dup` and `invokespecial <init>` to allocate and initialise.\n" +
        "- **`this(...)` or `super(...)`**: constructor delegation from within another constructor, always as the first statement.\n" +
        "- **Reflection**: `Order.class.getDeclaredConstructor(String.class).newInstance(\"ORD-1\")`, the path Spring, Hibernate and test frameworks use. `Class.newInstance()` has been deprecated since Java 9 because it rethrows checked exceptions unchecked.\n\n" +
        "**What people usually mean by the question** is re-running initialisation on an existing object. Java offers no such call, so provide an explicit method such as `reset()` or `init(Customer)` and make it idempotent. Writing `order.Order()` compiles only when `Order` is a method that happens to share the class name and declares a return type — a constructor with a return type has stopped being a constructor, which is exactly why the syntax is legal yet meaningless. A `private` constructor is unreachable through `new` outside the class, but reflection can still reach it unless module access or a security manager forbids it.",
      code: `class CacheEntry {
    private String key;
    private int hits;

    CacheEntry(String key) { this.key = key; }

    // Legal, but this is a METHOD sharing the class name - not a constructor.
    void CacheEntry() {
        System.out.println("method named like the class: " + key);
    }

    // The supported way to re-initialise an existing object
    void reset(String newKey) {
        this.key = newKey;
        this.hits = 0;
    }

    void recordHit() { hits++; }

    public static void main(String[] args) throws ReflectiveOperationException {
        CacheEntry entry = new CacheEntry("user:42");   // only 'new' runs <init>
        entry.recordHit();
        entry.CacheEntry();                             // ordinary call, not a constructor
        entry.reset("user:43");                         // explicit re-initialisation

        CacheEntry reflected = CacheEntry.class
                .getDeclaredConstructor(String.class)
                .newInstance("user:44");                // reflection path
        System.out.println(entry.key + " hits=" + entry.hits
                + ", reflected=" + reflected.key);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Only new, this(...), super(...) and reflection run a constructor; a method can only re-initialise through an explicit reset or init method.",
    },
    {
      id: "q054",
      question: "Is a super class constructor called even when there is no explicit call from a sub class constructor?",
      answer:
        "**Yes — the superclass constructor always runs, whether or not the subclass constructor mentions it.** When a constructor body does not begin with `this(...)` or `super(...)`, the compiler inserts `super()`, a call to the superclass no-arg constructor, as the first statement. Every object therefore has its entire chain of superclass constructors executed before the subclass constructor body starts, terminating at `Object`.\n\n" +
        "**Consequences worth memorising:**\n\n" +
        "- **Order**: static initialisers run once when the class is loaded; then, per object, superclass constructors run top-down, followed by the subclass's field and instance initialisers, and finally the constructor body.\n" +
        "- **Compile failure**: if no superclass no-arg constructor is accessible, the inserted `super()` cannot resolve and the class will not compile until you chain explicitly — the standard cost of adding a parameterised constructor to a widely extended base class.\n" +
        "- **Overridable methods**: a superclass constructor that calls an overridable method dispatches to the subclass override before subclass fields are assigned, so it observes `null`, `0` and `false`. Never call overridable methods from constructors.\n" +
        "- **Abstract classes count too**: their constructors still execute, which is how they initialise the state they share with subclasses.\n\n" +
        "**Interview framing:** `no explicit call` in source still means an explicit call in bytecode. That is why deleting an argument-free constructor from a base class breaks subclasses that never wrote `super()`, and why immediate superclass initialisation is guaranteed by the language rather than by convention.",
      code: `class Component {                        // declares no no-arg constructor
    protected final String name;

    Component(String name) {
        this.name = name;
        System.out.println("1 Component(" + name + ")");
    }
}

class Button extends Component {
    private final String label = "OK";    // runs after super(), before Button body

    Button() {
        this("default");                  // delegates; this ctor never calls super()
        System.out.println("4 Button() done");
    }

    Button(String name) {
        super(name);                      // must be explicit: no no-arg super ctor
        System.out.println("3 Button body, label=" + label + ", name=" + name);
    }
}

class EveryLevelRunsDemo {
    public static void main(String[] args) {
        System.out.println("0 before new");
        new Button();
    }
}
// Output:
// 0 before new
// 1 Component(default)
// 3 Button body, label=OK, name=default
// 4 Button() done`,
      codeLanguage: "java",
      explanation:
        "They want implicit super() insertion, the guarantee that Object's constructor always runs, and the overridable-method-in-constructor hazard.",
    },
  ],
  meta: {
    q046: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["abstract-class", "interface", "inheritance"],
      relatedQuestionIds: ["q047", "q052", "q055"],
      estimatedReadMinutes: 4,
    },
    q047: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["constructor", "object-creation", "overloading"],
      relatedQuestionIds: ["q048", "q050", "q053"],
      estimatedReadMinutes: 3,
    },
    q048: {
      difficulty: "easy",
      priority: "high",
      tags: ["constructor", "default-constructor", "reflection"],
      relatedQuestionIds: ["q047", "q054", "q050"],
      estimatedReadMinutes: 3,
    },
    q049: {
      difficulty: "medium",
      priority: "high",
      tags: ["constructor", "this-super", "compilation-error"],
      relatedQuestionIds: ["q051", "q052", "q050"],
      estimatedReadMinutes: 3,
    },
    q050: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["super", "constructor-chaining", "inheritance"],
      relatedQuestionIds: ["q052", "q054", "q047"],
      estimatedReadMinutes: 4,
    },
    q051: {
      difficulty: "medium",
      priority: "high",
      tags: ["constructor-chaining", "this", "execution-order"],
      relatedQuestionIds: ["q049", "q052", "q054"],
      estimatedReadMinutes: 3,
    },
    q052: {
      difficulty: "medium",
      priority: "high",
      tags: ["this", "constructor-chaining", "overloading"],
      relatedQuestionIds: ["q050", "q051", "q047"],
      estimatedReadMinutes: 3,
    },
    q053: {
      difficulty: "medium",
      priority: "medium",
      tags: ["constructor", "reflection", "methods"],
      relatedQuestionIds: ["q047", "q048", "q052"],
      estimatedReadMinutes: 3,
    },
    q054: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["super", "constructor-chaining", "initialisation-order"],
      relatedQuestionIds: ["q050", "q047", "q048"],
      estimatedReadMinutes: 4,
    },
  },
});