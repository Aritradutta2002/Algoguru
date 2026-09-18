import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Object Oriented Programming Basics — global questions 35-45.
 * Covers upcasting and dynamic binding, the multiple-inheritance story
 * (classes versus interfaces, plus the Java 8 default-method diamond), the
 * interface rules including Java 9 private methods, and the abstract
 * class / abstract method split.
 */
export const chunk05OopBasicsB = defineChunk({
  topic: "oop-basics",
  questions: [
    {
      id: "q035",
      question: "Can super class reference variable can hold an object of sub class?",
      answer:
        "Yes — a superclass reference variable can hold an object of a subclass, and this is the foundation of runtime polymorphism. Assigning a subclass instance to a superclass-typed variable is **upcasting**, and the compiler performs it implicitly because every subclass **is-a** superclass. The declared type of the reference decides what the compiler lets you call; the runtime class of the object decides which implementation actually executes.\n\n" +
        "**Why only superclass-visible members are accessible through that reference:**\n\n" +
        "- Member lookup uses the **static type** of the reference, so anything declared only in the subclass is invisible until you narrow the reference with a cast.\n" +
        "- If the subclass overrides a superclass method, the JVM dispatches to the override at run time. That is **dynamic binding**, resolved through the object's method table, and it applies to every overridable instance method.\n" +
        "- Fields behave the opposite way: they are resolved statically, so `sup.value` reads the superclass field even when the subclass hides it. Field hiding looks like overriding but is not polymorphism.\n\n" +
        "**Narrowing is where the risk lives.** Casting back with `(SubClass) supRef` is verified at run time, so a mismatched object throws `ClassCastException`; only provably unrelated types are rejected at compile time. Guard with `instanceof`, or better, use **Java 16 pattern matching**: `if (shape instanceof Circle c) c.area();` performs the test and the binding in one step and removes the redundant cast. The summary an interviewer wants: widening is free, narrowing is checked, methods are virtual and fields are not.",
      code: `// Upcasting: superclass reference, subclass object
class Shape {
    String name = "Shape";
    String describe() { return "generic shape"; }
}

class Circle extends Shape {
    String name = "Circle";
    @Override String describe() { return "circle r=2"; }
    double area() { return Math.PI * 4; }
}

public class UpcastDemo {
    public static void main(String[] args) {
        Shape shape = new Circle();             // implicit upcast
        System.out.println(shape.describe());   // virtual dispatch -> circle r=2
        System.out.println(shape.name);         // field hiding -> Shape
        // shape.area();                        // compile error, not visible on Shape

        if (shape instanceof Circle c) {        // Java 16 pattern matching
            System.out.println(c.area());       // safe narrowing, no extra cast
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Test upcasting, static versus dynamic dispatch, field hiding, and that narrowing needs a runtime check or a Java 16 pattern.",
    },
    {
      id: "q036",
      question: "Is multiple inheritance allowed in Java?",
      answer:
        "**For classes, no.** A Java class has exactly one direct superclass, so the C++ form — `class C extends A, B` — does not exist. The reason is not language laziness, it is the **diamond problem**: if `A` and `B` both derive from `Base` and `C` derives from both, then `Base` becomes reachable by two distinct inheritance paths.\n\n" +
        "**What breaks in that shape:**\n\n" +
        "- **Method ambiguity**: if both parents declare an identical `run()` signature, the compiler cannot know which one `c.run()` means.\n" +
        "- **State duplication**: without virtual inheritance, each diamond path carries its own copy of the base fields, so the two views of the base disagree. That is a real correctness bug, not a cosmetic one.\n" +
        "- **Layout and constructor complexity**: object layout and initialisation order become hard to specify precisely, and hard to verify in bytecode.\n\n" +
        "Java chose the **type-versus-implementation split** instead: inherit implementation from one class, inherit type from many interfaces. Interfaces historically carried no instance state, so the diamond was harmless. **Java 8 default methods reintroduced a limited diamond** — two unrelated interfaces can both supply the same `default` signature. The compiler then refuses to guess: the class must override the conflicting method, or disambiguate explicitly with `Walker.super.move()`. Note the asymmetry: when an inherited class method collides with an interface default, the class method wins silently, with no compile error at all.",
      code: `interface Walker { default String move() { return "walk"; } }
interface Swimmer { default String move() { return "swim"; } }

// Without the override this class inherits unrelated defaults and will not compile
class Amphibian implements Walker, Swimmer {
    @Override
    public String move() {
        // Explicit disambiguation keeps both parent behaviours reachable
        return Walker.super.move() + " and " + Swimmer.super.move();
    }
}

public class MultipleInheritanceDemo {
    public static void main(String[] args) {
        System.out.println(new Amphibian().move()); // walk and swim

        // A class implements many interfaces, but extends only one class:
        //   class Amphibian implements Walker, Swimmer  -> legal
        //   class Amphibian extends Walker, Swimmer     -> illegal
    }
}`,
      codeLanguage: "java",
      explanation:
        "They check whether you can name the diamond problem and its state ambiguity, then explain why interface defaults are the safe subset.",
    },
    {
      id: "q037",
      question: "What is an interface?",
      answer:
        "An interface is a **reference type that declares a contract**: a set of method signatures and constants that an implementing class agrees to provide. It says *what* a type can do and never *how* it does it, which makes it the purest form of abstraction available in Java.\n\n" +
        "**What an interface actually contains:**\n\n" +
        "- **Method declarations** that are implicitly `public abstract`, so the implementing class supplies the bodies.\n" +
        "- **Fields** that are implicitly `public static final` — constants, never state. An interface cannot hold per-object data at all.\n" +
        "- **`default` and `static` methods** since Java 8, plus **`private` helper methods** since Java 9.\n" +
        "- **Nested types** — interfaces, classes, enums and annotations — which are implicitly static.\n\n" +
        "There is no constructor, so an interface can never be instantiated, and it cannot be declared `final` because it exists to be implemented.\n\n" +
        "**Why it matters in design:** because a class may implement many interfaces, an interface is Java's substitute for multiple inheritance of type. Program against `List`, `Runnable` or `PaymentGateway` and the implementation becomes swappable, which is precisely what dependency injection, testing with mocks and API stability depend on. A **functional interface** declares a single abstract method, so it can be satisfied by a lambda, and `@FunctionalInterface` makes the compiler enforce that single-method rule for you.",
      code: `public interface Vehicle {
    int MAX_SPEED = 240;                 // implicitly public static final
    String describe();                   // implicitly public abstract

    default String summary() {           // Java 8 default method carries behaviour
        return describe() + " up to " + MAX_SPEED + " km/h";
    }

    static Vehicle electric() {          // Java 8 static factory on the interface
        return () -> "electric car";     // lambda satisfies the single abstract method
    }
}

class CombustionCar implements Vehicle {
    @Override public String describe() { return "combustion car"; }
}

class InterfaceDemo {
    public static void main(String[] args) {
        Vehicle car = new CombustionCar();
        System.out.println(car.summary());              // combustion car up to 240 km/h
        System.out.println(Vehicle.electric().summary());
        // new Vehicle();                               // compile error, cannot instantiate
    }
}`,
      codeLanguage: "java",
      explanation:
        "Define contract versus implementation, list what an interface may contain, and connect multiple interface implementation to Java's missing multiple inheritance.",
    },
    {
      id: "q038",
      question: "How do you define an interface?",
      answer:
        "Declare it with the `interface` keyword where a class would use `class`: `public interface Flyable extends HasWings { ... }`. The body holds method signatures that end in a semicolon, constants, and optionally `default`, `static` and `private` methods. A top-level interface may be `public` or package-private — never `private` or `protected` — and only one public type may live in a `.java` file.\n\n" +
        "**Rules the compiler applies for you:**\n\n" +
        "- Methods are implicitly `public abstract`; writing those modifiers is legal but redundant, and making one `protected` or package-private is a compile error.\n" +
        "- Fields are implicitly `public static final` and must be initialised in the declaration itself. There is no instance state, so there is no per-object field.\n" +
        "- There are no constructors and no instance initialiser blocks, and `new SomeInterface()` never compiles.\n" +
        "- `final`, `synchronized` and `native` are illegal on interface methods, and a top-level interface cannot be `final` or `static`.\n\n" +
        "**Version-sensitive detail worth stating out loud:** adding a `default` method to a published interface is source- and binary-compatible with existing implementors, whereas adding a plain abstract method breaks every class that does not implement it. That is exactly how `Collection` gained `stream()` and `sort()` without breaking the ecosystem. Since Java 9, `private` methods let two defaults share code without widening the public API.",
      code: `interface HasWings {
    int wingCount();
}

// Definition: modifier + interface + name + optional extends list
public interface Flyable extends HasWings {
    int WING_PAIRS = 1;                  // public static final, initialised in place
    void takeOff();                      // public abstract
    void land();                         // public abstract

    default String status() {            // Java 8 default method
        return "wings=" + wingCount() + ", flying=" + airborne();
    }

    private boolean airborne() {         // Java 9 private helper, not public API
        return true;
    }

    static Flyable displayOnly() {       // static method, not inherited by subinterfaces
        return new Flyable() {           // anonymous implementation, not instantiation
            public int wingCount() { return 0; }
            public void takeOff() { }
            public void land() { }
        };
    }
}

class DefinitionDemo {
    public static void main(String[] args) {
        System.out.println(Flyable.WING_PAIRS + " " + Flyable.displayOnly().status());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Expect the implicit modifiers, the absence of instance state and constructors, and the Java 8 default and Java 9 private method breakpoints.",
    },
    {
      id: "q039",
      question: "How do you implement an interface?",
      answer:
        "Use the `implements` keyword in the class declaration, after any `extends` clause: `class Sparrow extends Bird implements Flyable, Comparable<Sparrow>`. The class supplies a body for every abstract method it inherits, and each implementation must be `public`, because you cannot reduce visibility while fulfilling a public contract.\n\n" +
        "**The obligations that trip people up:**\n\n" +
        "- Every abstract method must be implemented, otherwise the compiler forces the class itself to be declared `abstract`.\n" +
        "- An override may narrow or drop the checked exceptions of the declared method, but never add new ones it did not declare.\n" +
        "- Put `@Override` on each implementation: the compiler then catches typos in the method name or a wrong parameter type that would otherwise silently create an unrelated overload.\n\n" +
        "**What implementing actually buys you** is a second type, not just code. The object can now be referenced through the interface type, so the caller is decoupled from the concrete class and can be handed a different implementation without recompiling. That is the whole basis of dependency injection, strategy objects and mocking frameworks.\n\n" +
        "**Common mistakes:** implementing the interface but leaving the methods package-private, which produces the `attempting to assign weaker access privileges` error; and implementing an interface method with a wider checked exception, which is rejected outright. An interface with no abstract methods can also be implemented with an empty body, which is how marker interfaces and functional registrations work.",
      code: `interface PaymentGateway {
    String charge(long amountInPaise) throws IllegalArgumentException;
}

class UpiGateway implements PaymentGateway {
    @Override
    public String charge(long amountInPaise) {
        if (amountInPaise <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        return "UPI tx:" + amountInPaise;
    }
}

class CardGateway implements PaymentGateway {
    @Override
    public String charge(long amountInPaise) {
        return "CARD tx:" + amountInPaise;
    }
}

public class ImplementDemo {
    public static void main(String[] args) {
        PaymentGateway gateway = new UpiGateway();   // interface-typed reference
        System.out.println(gateway.charge(25_000));  // UPI tx:25000

        gateway = new CardGateway();                 // same type, different implementation
        System.out.println(gateway.charge(25_000));  // CARD tx:25000
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want public overrides, the abstract escape hatch, and the insight that implementing an interface adds a polymorphic type, not just code.",
    },
    {
      id: "q040",
      question: "Can you explain a few tricky things about interfaces?",
      answer:
        "Interfaces look trivial until the edge cases appear, and this question is really a precision test. Here are the facts worth stating cleanly, in the order an interviewer usually probes them.\n\n" +
        "**Implicit modifiers and constants:**\n\n" +
        "- All interface methods are implicitly `public abstract` before Java 8, so `void start();` is exactly `public abstract void start();`. You cannot make one `protected` or package-private.\n" +
        "- All fields are implicitly `public static final`, must be initialised in place, and are inherited into every implementor's namespace, where they can cause accidental name clashes.\n" +
        "- Methods cannot be `final`, `synchronized` or `native`.\n\n" +
        "**Instantiation and obligations:** an interface cannot be instantiated with `new`, yet `new Runnable() { public void run() { } }` is perfectly legal — that is an anonymous class that implements it. A concrete class must implement every abstract method it inherits, or the compiler forces the class to be declared `abstract` itself. **Since Java 8**, `default` methods carry behaviour that implementors inherit and `static` methods live on the interface but are not inherited by subinterfaces. **Since Java 9**, `private` and `private static` methods let two defaults share code without adding public API.\n\n" +
        "**The casting surprise:** `(SomeInterface) someObject` compiles whenever the two types are not provably unrelated, even when the runtime class does not implement the interface. The compiler rejects `(Runnable) new Object()` outright, but allows the same cast through a variable of a non-final type — and you only discover the problem at run time as a `ClassCastException`.",
      code: `interface Config {
    int TIMEOUT_MS = 5_000;                  // implicit public static final

    default String label() { return "config:" + id(); }
    private String id() { return "default"; } // Java 9 helper, not public API
}

// Tricky 1: the constant is inherited into the implementing class
class AppConfig implements Config {
    static void printTimeout() {
        System.out.println("timeout=" + TIMEOUT_MS);
    }
}

public class InterfaceTrickyDemo {
    public static void main(String[] args) {
        AppConfig.printTimeout();

        // Tricky 2: cannot really be instantiated, but an anonymous impl is fine
        Config cfg = new Config() { };
        System.out.println(cfg.label());      // config:default

        // Tricky 3: compiles (types are not provably unrelated) ...
        Object value = "java";
        Config fake = (Config) value;
        System.out.println(fake);             // ... then throws ClassCastException
    }
}`,
      codeLanguage: "java",
      explanation:
        "A precision probe: implicit public abstract methods, constant fields, anonymous implementations, default and private methods, and casts that fail only at run time.",
    },
    {
      id: "q041",
      question: "Can you extend an interface?",
      answer:
        "**Yes.** An interface uses the `extends` keyword to inherit from other interfaces, and it may extend several at once: `interface AuditableRecord extends Identifiable, Timestamped`. This builds a hierarchy of contracts and is Java's mechanism for multiple inheritance of type without inheriting any state.\n\n" +
        "**What is inherited and what is not:**\n\n" +
        "- **Abstract and default methods** are inherited. A subinterface may override an inherited `default` with a new default body, or redeclare it as abstract to force implementors to provide it again.\n" +
        "- **Constants** are inherited, so `DetailedRecord.TIMEOUT_MS` resolves even though the constant was declared somewhere up the hierarchy.\n" +
        "- **`static` interface methods are NOT inherited.** `Sub.header()` does not compile; you must call them on the interface that declares them, and a subinterface declaring the same signature hides rather than overrides.\n" +
        "- **`private` interface methods are not inherited either** — they are reachable only inside the body that declares them.\n\n" +
        "**The distinction to state out loud:** `implements` means a class fulfils the contract and must supply the code, while `extends` on an interface means a narrower contract that inherits the wider one's obligations without adding implementation duties. That is how `List extends Collection extends Iterable` composes. A neat interview trap: the same keyword is used, but an interface may extend many interfaces while a class may extend only one class.",
      code: `interface Identifiable { String id(); }
interface Timestamped { long createdAt(); }

// An interface extends many interfaces: multiple inheritance of type
interface AuditableRecord extends Identifiable, Timestamped {
    default String auditLine() {
        return "id=" + id() + " at=" + createdAt();
    }
    static String header() { return "AUDIT"; }   // static: not inherited below
}

interface DetailedRecord extends AuditableRecord {
    @Override default String auditLine() {       // override an inherited default
        return "[detailed] " + id();
    }
}

public class ExtendInterfaceDemo {
    public static void main(String[] args) {
        DetailedRecord rec = new DetailedRecord() {   // anonymous implementation
            public String id() { return "R-7"; }
            public long createdAt() { return System.currentTimeMillis(); }
        };
        System.out.println(rec.auditLine());          // [detailed] R-7
        System.out.println(AuditableRecord.header());
        // DetailedRecord.header();                   // compile error: not inherited
    }
}`,
      codeLanguage: "java",
      explanation:
        "Interfaces extend many interfaces and inherit default methods but never static methods — mixing up extends and implements is the classic slip.",
    },
    {
      id: "q042",
      question: "Can a class extend multiple interfaces?",
      answer:
        "**Not with `extends`, but yes with `implements`.** The keyword matters: `extends` on a class names at most one superclass, while a class may `implements` an unlimited number of interfaces, separated by commas. So the correct phrasing is that a class cannot extend multiple interfaces — it implements them.\n\n" +
        "**What the compiler then has to resolve:**\n\n" +
        "- If two implemented interfaces declare the same **abstract** method signature, one implementation satisfies both. There is no conflict at all.\n" +
        "- If two unrelated interfaces provide conflicting **`default`** methods, the class must override the method or disambiguate with `InterfaceName.super.method()`.\n" +
        "- If one interface is a subinterface of the other, the most specific default wins silently — no override is required, because the more specific type already overrides the inherited one.\n" +
        "- If an inherited **class method** clashes with an interface default, the class method always wins and no compile error is reported.\n\n" +
        "**Why it matters in practice:** implementing several interfaces is how a domain object exposes several independently consumable roles — `Comparable` plus `Serializable`, or a `Repository` that is both `Readable` and `Writable` — without a class hierarchy that forces unrelated behaviour together. The object simply gains the union of the contracts, and every abstract method must be implemented or the class must be declared abstract.",
      code: `interface Readable { String read(); }
interface Writable { String read(); String write(String data); }

// Legal: implements many interfaces (extends is still limited to one class)
class Buffer implements Readable, Writable {
    private String content = "";

    @Override public String read() { return content; }   // satisfies both interfaces
    @Override public String write(String data) {
        content += data;
        return content;
    }
}

interface A { default String kind() { return "A"; } }
interface B extends A { }                                 // B is the more specific type

class AB implements A, B {
    // No override needed: B inherits A.kind() and the most specific one wins
}

public class MultiInterfaceDemo {
    public static void main(String[] args) {
        Buffer buf = new Buffer();
        buf.write("hello ");
        System.out.println(buf.read());        // hello
        System.out.println(new AB().kind());   // A
    }
}`,
      codeLanguage: "java",
      explanation:
        "Check keyword discipline: one superclass with extends, unlimited interfaces with implements, and how conflicting or most-specific defaults resolve.",
    },
    {
      id: "q043",
      question: "What is an abstract class?",
      answer:
        "An abstract class is a class declared with the `abstract` modifier that exists to be extended rather than instantiated. It can mix abstract declarations with fully implemented methods, and unlike an interface it owns **instance state and constructors**.\n\n" +
        "**The rules that define it:**\n\n" +
        "- It cannot be instantiated with `new`, but it can declare constructors, which subclasses invoke through `super(...)` to initialise inherited state.\n" +
        "- It may contain any combination of abstract and concrete methods, and any field or static member with any visibility — `private`, `protected`, package-private or `public`.\n" +
        "- A subclass must implement every inherited abstract method, or the subclass must itself be declared `abstract`.\n" +
        "- Abstract methods cannot be `private`, `static` or `final`, because each of those would make overriding impossible.\n" +
        "- An abstract class may have **no abstract methods at all** — that is a legitimate pattern when you want constructor-driven initialisation or shared state but no direct instantiation.\n\n" +
        "**Contrast with an interface:** an interface is a pure contract with constants only, while an abstract class is a partial implementation plus state. An abstract class may also implement interfaces without implementing their methods, leaving that work to its concrete subclasses. If you remember one line: an abstract class is what you get when subclasses must share code and data, not just a signature list.",
      code: `public abstract class Account {
    private long balanceInPaise;                    // instance state: interfaces cannot

    protected Account(long openingBalance) {        // constructor, invoked via super()
        this.balanceInPaise = openingBalance;
    }

    long balance() { return balanceInPaise; }       // concrete inherited method

    abstract long monthlyFeeInPaise();              // subclasses must implement this

    void applyMonthlyFee() {                        // template method around the gap
        balanceInPaise -= monthlyFeeInPaise();
    }
}

class SavingsAccount extends Account {
    SavingsAccount(long opening) { super(opening); }
    @Override long monthlyFeeInPaise() { return 0; } // no monthly fee
}

class AbstractDemo {
    public static void main(String[] args) {
        Account account = new SavingsAccount(10_000); // abstract type, concrete object
        account.applyMonthlyFee();
        System.out.println(account.balance());        // 10000
        // new Account(0);                            // compile error: abstract class
    }
}`,
      codeLanguage: "java",
      explanation:
        "An abstract class is about shared state and partial implementation — say it cannot be instantiated, may have zero abstract methods, yet still has constructors.",
    },
    {
      id: "q044",
      question: "When do you use an abstract class?",
      answer:
        "Use an abstract class when related types must **share state and a partial implementation**, and you want to force subclasses to fill in defined gaps. The canonical case is the **Template Method** pattern: the abstract class owns the algorithm skeleton and the state it needs, while each subclass supplies the variable steps.\n\n" +
        "**Decision criteria worth naming:**\n\n" +
        "- Choose an **abstract class** when subclasses share fields, need `protected` helpers or constructors, and the hierarchy is genuinely unified by a common implementation.\n" +
        "- Choose an **interface** when the contract must be implemented by unrelated classes, when a class needs several types at once, or when no state is involved.\n" +
        "- **API evolution**: adding a concrete method to an abstract class is safe for existing subclasses, while adding an abstract method breaks them all. An interface is safer still, because a `default` method breaks nobody.\n" +
        "- **Skeletal implementations** combine both: publish the interface as the type (`List`) and provide an abstract class (`AbstractList`) that carries the boilerplate, so implementors choose which to extend.\n\n" +
        "**The nuance that separates strong candidates:** Java 8 blurred the line, since interfaces can now hold behaviour. What they still cannot hold is instance state. So the moment two implementations must share mutable fields consistently, or need injected constructor values, an abstract class is the correct tool — and the interface should stay as the published type that callers depend on.",
      code: `interface Exporter { String export(String[] rows); }

// Shared skeleton plus state that an interface cannot hold
abstract class CsvExporter implements Exporter {
    protected final String delimiter;               // shared, injected state

    protected CsvExporter(String delimiter) { this.delimiter = delimiter; }

    @Override
    public String export(String[] rows) {           // fixed algorithm, variable steps
        StringBuilder out = new StringBuilder(header());
        for (String row : rows) {
            out.append(System.lineSeparator()).append(formatRow(row));
        }
        return out.toString();
    }

    protected abstract String header();             // steps left to subclasses
    protected abstract String formatRow(String row);
}

class UserCsvExporter extends CsvExporter {
    UserCsvExporter() { super(","); }
    @Override protected String header() { return "id,name"; }
    @Override protected String formatRow(String row) { return row.replace('|', ','); }
}

public class TemplateMethodDemo {
    public static void main(String[] args) {
        Exporter exporter = new UserCsvExporter();  // publish the interface type
        System.out.println(exporter.export(new String[] { "1|Ada", "2|Linus" }));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Decide on shared state plus a common skeleton versus a pure contract, and mention publishing the interface type so callers stay decoupled.",
    },
    {
      id: "q045",
      question: "How do you define an abstract method?",
      answer:
        "Declare it with the `abstract` modifier, a full signature and a semicolon instead of a body: `public abstract double area();`. A method without a body is legal only inside a class that is itself declared `abstract`, because something must eventually supply the implementation.\n\n" +
        "**The rules the compiler enforces:**\n\n" +
        "- The enclosing class must be abstract, even if it contains just one abstract method.\n" +
        "- An abstract method cannot be `private`, `static` or `final`. Each of those would prevent overriding, and overriding is the entire point.\n" +
        "- Subclasses must implement it with the same or **wider** visibility and with a **covariant return type** — a subclass type is allowed, a supertype is not.\n" +
        "- A concrete subclass must implement every inherited abstract method, or be declared abstract itself, which is how multi-level hierarchies distribute work down the chain.\n\n" +
        "**How it differs from an interface declaration:** in an interface, methods without bodies are implicitly abstract, so writing `abstract` there is redundant but legal; interfaces also allow bodies through `default`, while a class needs the `abstract` keyword before the method name. An abstract method is essentially a documented promise: *this operation exists, but only the subclass knows how to perform it*. A useful related fact is that an abstract class may define a concrete method that calls abstract methods — the template pattern — which is what makes abstract methods so useful in frameworks.",
      code: `abstract class Report {
    protected abstract String title();      // signature only, ends with a semicolon

    final String render() {                 // concrete: subclasses cannot change it
        return "== " + title() + " ==";
    }
}

abstract class BaseReport extends Report {
    // Inherits title() but does not implement it, so it must stay abstract
    abstract java.time.Instant generatedAt();
}

class DailyReport extends BaseReport {
    @Override protected String title() { return "Daily sales"; }
    @Override java.time.Instant generatedAt() { return java.time.Instant.now(); }
}

public class AbstractMethodDemo {
    public static void main(String[] args) {
        Report report = new DailyReport();
        System.out.println(report.render());      // == Daily sales ==
        // new Report();                          // compile error: abstract class
    }
}`,
      codeLanguage: "java",
      explanation:
        "An abstract method has no body and forces a subclass contract; name the modifiers it cannot carry and the covariant, non-narrowing override rules.",
    },
  ],
  meta: {
    q035: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["oop", "polymorphism", "casting"],
      relatedQuestionIds: ["q036", "q043"],
      estimatedReadMinutes: 3,
    },
    q036: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["oop", "inheritance", "interfaces"],
      relatedQuestionIds: ["q035", "q041", "q042"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q037: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["oop", "interfaces", "abstraction"],
      relatedQuestionIds: ["q038", "q039", "q043"],
      estimatedReadMinutes: 3,
    },
    q038: {
      difficulty: "easy",
      priority: "high",
      tags: ["oop", "interfaces", "syntax"],
      relatedQuestionIds: ["q037", "q039"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+", "Java 9+"],
    },
    q039: {
      difficulty: "easy",
      priority: "high",
      tags: ["oop", "interfaces", "implement"],
      relatedQuestionIds: ["q037", "q038", "q042"],
      estimatedReadMinutes: 3,
    },
    q040: {
      difficulty: "medium",
      priority: "high",
      tags: ["oop", "interfaces", "edge-cases"],
      relatedQuestionIds: ["q037", "q038", "q044"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+", "Java 9+"],
    },
    q041: {
      difficulty: "easy",
      priority: "high",
      tags: ["oop", "interfaces", "inheritance"],
      relatedQuestionIds: ["q037", "q042"],
      estimatedReadMinutes: 2,
    },
    q042: {
      difficulty: "easy",
      priority: "high",
      tags: ["oop", "interfaces", "multiple-inheritance"],
      relatedQuestionIds: ["q036", "q040", "q041"],
      estimatedReadMinutes: 3,
    },
    q043: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["oop", "abstract-class", "abstraction"],
      relatedQuestionIds: ["q044", "q045", "q037"],
      estimatedReadMinutes: 3,
    },
    q044: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["oop", "abstract-class", "design"],
      relatedQuestionIds: ["q043", "q045", "q037"],
      estimatedReadMinutes: 4,
    },
    q045: {
      difficulty: "easy",
      priority: "high",
      tags: ["oop", "abstract-method", "syntax"],
      relatedQuestionIds: ["q043", "q044"],
      estimatedReadMinutes: 2,
    },
  },
});