import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Modifiers - global questions 64-78.
 * Access modifiers, the four-view access matrix, and the final/volatile/static
 * modifiers.
 */
export const chunk08Modifiers = defineChunk({
  topic: "modifiers",
  questions: [
    {
      id: "q064",
      question: "What is default class modifier?",
      answer:
        "When you declare a top-level class without any access modifier, Java gives it **package-private** visibility — sometimes just called **default** access. The class is visible to every other class in the same package and invisible to everything else.\n\n**Rules that come with the default class modifier:**\n\n- **Same package only**: classes in other packages cannot import or reference the class, even by reflection if the module system is blocking it.\n- **No `public` impact**: this is not the same as `public`. `public` makes the class visible to every package; default restricts it.\n- **Member visibility is independent**: fields and methods inside a default class have their own modifiers; a `public` method in a default class is still only callable from inside the package.\n\n**When to use it**: default is a deliberate signal that a class is an implementation detail. Test classes, package-private utilities, internal builders and friend classes are typical users. Putting a class behind default access is one of the simplest ways to enforce encapsulation at the API level.\n\n**One trap**: a non-public top-level class can still expose `public` methods, but those methods are useless to anyone outside the package because the type itself is unreachable.",
      code: `// File: pkg/Helper.java
package pkg;
class Helper {                    // package-private (default)
    public static String greet() { return "hi"; }
}

// File: pkg/Main.java  (same package)
package pkg;
public class Main {
    public static void main(String[] args) {
        // OK: same package, Helper is reachable.
        System.out.println(Helper.greet());
    }
}

// File: other/OtherMain.java  (different package)
//   import pkg.Helper;          // compile error -- not visible
//   class OtherMain { ... }     // can't reach Helper at all.`,
      codeLanguage: "java",
      explanation:
        "Default (package-private) class modifier = visible only inside its own package; useful to hide implementation details.",
    },
    {
      id: "q065",
      question: "What is private access modifier?",
      answer:
        "`private` is the most restrictive access modifier in Java. A `private` member is visible only inside the top-level class that declares it — not in subclasses, not in other classes in the same package, and certainly not in other packages.\n\n**Where private applies:**\n\n- **Fields** — the canonical use. Combined with public getters/setters and validation, it gives you encapsulation.\n- **Methods** — helper methods that nobody outside should call.\n- **Constructors** — used to disable `new` from outside, forcing construction through a static factory.\n- **Nested classes** — `private static class Helper` is invisible to its enclosing class's siblings.\n\n**What private does NOT do:**\n\n- A `private` field is not inherited, although it still exists in the parent's memory layout for each subclass instance.\n- A `private` method can be shadowed by a subclass method with the same signature, but that is not an override (private methods are not visible to subclasses).\n- Reflection can read and modify `private` members via `setAccessible(true)`, which is how libraries like Jackson and JPA populate state.\n\n**Interview note**: a common question is whether `private` members are visible to inner classes. Yes — an inner class can access private members of its enclosing class, and the enclosing class can access private members of its inner class. The compiler synthesises package-private accessor methods to make this work.",
      code: `public class Account {
    private double balance;          // nobody outside can touch this directly
    private static int nextId = 1;
    private final int id;

    public Account(double opening) {
        if (opening < 0) throw new IllegalArgumentException();
        this.balance = opening;
        this.id = nextId++;
    }

    // Validation lives next to the field it protects.
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException();
        balance += amount;
    }
    public double getBalance() { return balance; }

    private static class Ledger {     // private nested type
        void touch(Account a) { System.out.println(\"touched \" + a.id); }
    }

    public static void main(String[] args) {
        Account a = new Account(100);
        a.deposit(50);
        // a.balance = 1_000_000;     // compile error -- private
        System.out.println(a.getBalance());
    }
}`,
      codeLanguage: "java",
      explanation:
        "private = visible only inside the declaring class; combine with public getters/setters for encapsulation and use with static factories to disable `new`.",
    },
    {
      id: "q066",
      question: "What is default or package access modifier?",
      answer:
        "The default access modifier — also called **package-private** — is what you get when you write nothing at all. The member is visible to every class in the same package, and to no one else.\n\n**Practical uses:**\n\n- Sharing helpers within a tightly coupled group of classes without exposing them to the world.\n- Hiding implementation details across closely-related classes.\n- Test fixtures that should not be on the production API surface.\n\n**Default vs `protected`**: they look similar at first because both are visible inside the package. The crucial difference is that `protected` also grants access to subclasses in other packages — even though the subclass must reference the inherited member through a reference of its own type, not the parent's.\n\n**Default vs `public`**: `public` makes the member visible everywhere; default restricts it to the package.\n\n**Default vs `private`**: `private` restricts to the class. Default is the next step outward.\n\n**JLS nuance**: when you write nothing, the member is sometimes called **package-private**. The word \"default\" is short and common in interviews; \"package-private\" is what you will see in the JLS and IDE tooltips.",
      code: `package banking;

class Account {                         // package-private class
    double balance;                     // package-private field
    Account(double opening) { balance = opening; }
    double report() { return balance; } // package-private method
}

package banking; // same package -- OK

public class Teller {
    public static void main(String[] args) {
        Account a = new Account(500);
        a.balance += 10;        // OK: same package, can touch field directly
        System.out.println(a.report());
    }
}

// package other; class Branch { ... } // can NOT import or use Account`,
      codeLanguage: "java",
      explanation:
        "Package-private (default) = same package only; one step wider than private, one step narrower than protected.",
    },
    {
      id: "q067",
      question: "What is protected access modifier?",
      answer:
        "`protected` is the middle-ground access modifier. Inside the same package it behaves exactly like package-private. Outside the package, only subclasses can reach the member — and even then only through a reference of their own type (the same-instance rule).\n\n**What \"subclass access in another package\" means:**\n\n- A subclass in another package can call `protected` methods inherited from the parent — but only on `this` or on objects of the same subclass, not on instances of the parent or sibling subclasses.\n- This is sometimes called the **package-private plus inherited access** rule.\n\n**When to use `protected`:**\n\n- Template method hooks in a base class that subclasses are expected to override.\n- Internal API points intended only for extension, never for direct client use.\n- Fields shared across subclasses but never visible to the outside world.\n\n**Why not just use `public`**: protected documents intent — this is for subclasses only. Public says \"anyone may use this\". Mixing the two tells the reader what they can rely on as part of the contract versus what they may safely ignore.\n\n**Common pitfall**: a subclass in another package can call inherited `protected` methods only through `this` or its own subtype. Calling a protected method on a parent reference from a sibling subclass is illegal.",
      code: `package shapes;

public class Shape {
    protected String name = "shape";   // visible in same package + subclasses

    protected double area() { return 0; }
}

package shapes; // same package
class Demo { static void use(Shape s) { System.out.println(s.name); } }

// package ui;

import shapes.Shape;
class Circle extends Shape {
    @Override protected double area() { return Math.PI * 5 * 5; }

    void useIt() {
        Circle c = new Circle();
        System.out.println(c.name);     // OK -- own subclass reference
        // Shape s = new Shape(); s.name; // ILLEGAL -- not a subclass reference
    }
}`,
      codeLanguage: "java",
      explanation:
        "protected = package-private plus subclass access; outside the package, subclasses may only access through their own type.",
    },
    {
      id: "q068",
      question: "What is public access modifier?",
      answer:
        "`public` is the most permissive access modifier: the member is visible to every class in every package. A `public` top-level class can be imported and instantiated from anywhere; a `public` method can be called by anyone; a `public` field is readable and assignable from anywhere.\n\n**Rules worth remembering:**\n\n- **`public` is sticky and one-way**: if you override a `public` method, you cannot narrow it back down. The contract that the parent promised is part of the API.\n- **Public fields are rarely a good idea**. They expose implementation and break invariants. Prefer `private` fields plus `public` getters and setters with validation.\n- **Public types should be designed as if they were frozen**. Once a class is shipped in a library, anything `public` becomes part of the contract and changing it later will break clients.\n- **Modules add a layer**: in Java 9+ `public` is also gated by `exports` in `module-info.java`. A public class that is not exported is invisible outside the module.\n\n**Interview framing**: the access modifier is part of the design, not just a keyword. Picking `public` is a promise. Picking `private` or default is a deliberate narrowing of the surface area.",
      code: `public final class Money {
    private final long cents;     // private state, validated at construction
    public Money(double amount) {
        if (amount < 0) throw new IllegalArgumentException();
        this.cents = Math.round(amount * 100);
    }
    public Money add(Money other) { return new Money((cents + other.cents) / 100.0); }
    public double amount()        { return cents / 100.0; }

    public static void main(String[] args) {
        Money m = new Money(19.99);
        System.out.println(m.add(new Money(0.01)).amount()); // 20.0
    }
}`,
      codeLanguage: "java",
      explanation:
        "public = visible to everyone; final on the class makes the surface area a frozen contract, private fields keep state encapsulated.",
    },
    {
      id: "q069",
      question: "What access types of variables can be accessed from a class in same package?",
      answer:
        "From a class inside the same package, every access modifier except `private` is reachable. That gives you **default**, **`protected`**, and **`public`** fields and methods. `private` members of another class are off limits — that is the whole point of `private`.\n\n**Practical implication**: when designing for package-level collaboration, you typically use `default` (package-private) for things only same-package classes should see, and reserve `public` for the API surface. `protected` is functionally the same as default within the package, so you only use `protected` when you also want subclass access in other packages.\n\n**Quick matrix (same package, no inheritance context):**\n\n- `private` — **no**.\n- default (package-private) — **yes**.\n- `protected` — **yes**.\n- `public` — **yes**.\n\nThis is the simplest of the four access scenarios.",
      code: `package billing;
public class Invoice {
    public    String customer = \"Ada\";    // same-pkg sees it
    protected long total     = 100;        // same-pkg sees it
    String    currency      = \"USD\";      // default; same-pkg sees it
    private   String taxId   = \"X-42\";     // same-pkg: NOT visible
}

// Same package:
class Auditor {
    void audit(Invoice i) {
        System.out.println(i.customer + \" \" + i.total + \" \" + i.currency);
        // System.out.println(i.taxId); // compile error -- private
    }
}`,
      codeLanguage: "java",
      explanation:
        "Same package: everything except private; default/protected/public all behave the same.",
    },
    {
      id: "q070",
      question: "What access types of variables can be accessed from a class in different package?",
      answer:
        "From a class in a **different package**, only `public` members are accessible — and even then only if the enclosing module exports the package. Neither `private`, `default` nor `protected` is reachable through an instance reference.\n\n**The rule**: cross-package visibility is gated by both modifiers and module `exports`. If the class is in a named module and the package is not exported, `public` members are unreachable from outside the module regardless of the modifier.\n\n**Quick matrix (different package, no inheritance):**\n\n- `private` — **no**.\n- default — **no**.\n- `protected` — **no** for unrelated classes.\n- `public` — **yes** (subject to module exports).\n\n**Exception**: a subclass in another package can still reach inherited `protected` members. That is the inheritance loophole, not the general cross-package rule. See the next two questions for the precise subclass rules.",
      code: `package billing;
public class Invoice {
    public    String customer = \"Ada\";
    protected long total     = 100;
    String    currency      = \"USD\";     // package-private
    private   String taxId   = \"X-42\";
}

// Different package:
import billing.Invoice;
class Outsider {
    void audit(Invoice i) {
        System.out.println(i.customer);   // OK -- public
        // System.out.println(i.total);   // protected -- illegal here (no inheritance)
        // System.out.println(i.currency); // default -- illegal
        // System.out.println(i.taxId);    // private -- illegal
    }
}`,
      codeLanguage: "java",
      explanation:
        "Different package, no inheritance: only public is reachable, and even that needs the package to be exported from a module.",
    },
    {
      id: "q071",
      question: "What access types of variables can be accessed from a sub class in same package?",
      answer:
        "A subclass inside the **same package** sees the same things every other class in the package sees. That is `default`, `protected` and `public` — and notably **`private` is still off limits**. Inheritance does not change visibility rules inside the package.\n\n**Why this matters**: people sometimes assume that a subclass has \"more access\" than its peers. It does not, when the subclass is in the same package. The bonus access kicks in only when the subclass lives in a different package and is accessing inherited members through its own type.\n\n**Quick matrix (subclass, same package):**\n\n- `private` — **no**.\n- default — **yes**.\n- `protected` — **yes**.\n- `public` — **yes**.\n\nSame answer as question 69 — the inheritance dimension only changes things across package boundaries.",
      code: `package billing;
public class Invoice { protected long total = 100; private String taxId = \"X\"; }

package billing; // same package
public class Receipt extends Invoice {
    void print() {
        System.out.println(\"total=\" + total);  // OK: protected, same package
        // System.out.println(taxId);            // still private -- illegal
    }
}`,
      codeLanguage: "java",
      explanation:
        "Subclass in same package: still no access to private; default/protected/public all visible exactly like any other class in the package.",
    },
    {
      id: "q072",
      question: "What access types of variables can be accessed from a sub class in different package?",
      answer:
        "A subclass in a **different package** can reach `protected` and `public` members of its parent, but **only when accessed through a reference of the subclass type or lower**. It cannot touch `default` (package-private) or `private` members, and it cannot touch inherited `protected` members via a parent reference.\n\n**The same-instance rule** (or \"package-private plus inherited\"): a subclass outside the package may call an inherited `protected` method on `this`, on a parameter declared as the subclass, or on a field of the subclass. It may not call it on a `super` reference or on a sibling-subclass reference.\n\n**Quick matrix (subclass, different package):**\n\n- `private` — **no**.\n- default — **no**.\n- `protected` — **yes**, only through `this` or the subclass type.\n- `public` — **yes**, freely.\n\n**Why this rule exists**: it prevents an unrelated class from exploiting a subclass relationship to break encapsulation. The protected members are part of the contract for subclasses, not a backdoor for arbitrary code.",
      code: `package billing;
public class Invoice {
    protected long total = 100;
    private   String taxId = \"X\";
    public    String customer = \"Ada\";
}

package reports;
import billing.Invoice;
public class Receipt extends Invoice {
    void print() {
        System.out.println(customer);        // OK: public
        System.out.println(total);           // OK: protected through the subclass reference
        // System.out.println(taxId);         // illegal: private
    }
    void cross(Invoice other) {
        // System.out.println(other.total);   // illegal: not a Receipt reference
        System.out.println(((Receipt) other).total); // OK after cast
    }
}`,
      codeLanguage: "java",
      explanation:
        "Subclass in different package: protected only through `this` or its own type; private and default remain unreachable.",
    },
    {
      id: "q073",
      question: "What is the use of a final modifier on a class?",
      answer:
        "When a class is declared `final`, no other class can extend it. The JVM does not need a vtable for `final` classes, which lets the JIT perform devirtualisation and inline method calls more aggressively. `final` is the strongest immutability promise you can make at the class level.\n\n**Why mark a class final:**\n\n- **Security**: prevent a malicious subclass from changing the behaviour of a trusted type (`String` is final so an attacker cannot extend it to intercept credentials).\n- **Immutability**: `final` plus `final` fields plus no setters gives you a properly immutable class (e.g. `LocalDate`, `BigDecimal`, `Integer`).\n- **Design clarity**: a final class is a leaf — readers know the inheritance story ends there.\n- **Performance**: the JIT can inline `final` methods without guards because no subclass can change them.\n\n**Drawbacks**:\n\n- You cannot mock `final` classes with most dynamic-proxy-based libraries (Mockito needs the inline mock maker to handle them).\n- You cannot extend the class to add features; you must compose.\n- Inheritance is rarely the right design choice anyway, so `final` is closer to a default than an exception.\n\n**Common interview examples**: `java.lang.String`, `java.lang.Integer`, `java.lang.Math`, all primitives' wrappers, and most `java.time` types.",
      code: `public final class TaxId {
    private final String value;
    public TaxId(String value) {
        if (value == null || value.isBlank())
            throw new IllegalArgumentException(\"invalid tax id\");
        this.value = value;
    }
    public String value() { return value; }
    @Override public String toString() { return \"TaxId[\" + value + \"]\"; }
}

// public class EvilTax extends TaxId {} // compile error -- cannot extend final`,
      codeLanguage: "java",
      explanation:
        "final class = no subclasses, easier JIT optimisation, helps enforce immutability and security; examples: String, Integer, LocalDate.",
    },
    {
      id: "q074",
      question: "What is the use of a final modifier on a method?",
      answer:
        "A `final` method cannot be overridden by any subclass. The compiler can perform devirtualisation on calls to `final` methods — instead of going through the vtable, the call can be inlined at the call site. For non-final instance methods, the JVM has to use dynamic dispatch because the runtime type might be a subclass that has overridden the method.\n\n**Why you would mark a method final:**\n\n- **Lock down a contract**: subclasses cannot change the meaning of a critical algorithm. `Object.getClass` and `Integer.intValue` are examples in the JDK.\n- **Performance**: when the JIT sees a `final` method, it can skip the vtable lookup and inline aggressively. This is one of the few cases where the JIT really can deliver near-C performance.\n- **Security**: prevent subclasses from substituting a malicious implementation. `final` on `String.hashCode` for example makes the hash predictable and tamper-proof.\n\n**Interaction with other modifiers**:\n\n- `private` methods are implicitly `final` because no subclass can see them, but the compiler does not enforce that wording.\n- `static` methods are effectively `final` (you cannot override a static method) — only \"hide\" it.\n- `final` methods can still be `synchronized`; the modifier is independent.\n\n**Drawback**: if you mark every method `final` \"just in case\", you make the class harder to extend for testing (subclasses cannot override helpers). It is usually better to mark only the methods whose semantics must not change.",
      code: `public class FeeCalculator {
    // Lock the contract: no subclass may redefine how fees are computed.
    public final double compute(double amount, double rate) {
        if (amount < 0 || rate < 0) throw new IllegalArgumentException();
        return amount * rate + fixedFee();
    }

    protected double fixedFee() { return 1.50; }  // subclasses may still override this
}

class PremiumFeeCalculator extends FeeCalculator {
    // @Override double compute(...) { ... }   // compile error -- cannot override final

    @Override protected double fixedFee() { return 0.50; }
}`,
      codeLanguage: "java",
      explanation:
        "final method = cannot be overridden, JIT can devirtualise, locks down a contract; private/static methods are already implicitly final.",
    },
    {
      id: "q075",
      question: "What is a final variable?",
      answer:
        "A `final` variable can be assigned exactly once. After that, the compiler refuses any further write. This applies to local variables, instance fields and static fields.\n\n**What the rule means for each kind:**\n\n- **`final` primitive**: the value itself is fixed. The constant cannot be changed after initialisation.\n- **`final` reference**: the reference cannot be reassigned, but the object the reference points to may still be mutated. `final List<String> list = new ArrayList<>()` does not make the list immutable; you can still call `list.add(\"x\")`. Use unmodifiable wrappers (`List.of`, `Collections.unmodifiableList`) for true immutability.\n- **Blank final fields**: a `final` field without an initialiser must be assigned exactly once in every constructor of the class. This lets you compute the value at construction time.\n- **Static final**: combined with a compile-time constant expression, the value is inlined at every call site (`public static final int MAX = 100;` becomes a literal in the bytecode).\n\n**Why use it**:\n\n- Documents that a value is invariant for the lifetime of the object.\n- Enables safe publication through the Java Memory Model — `final` fields are guaranteed to be visible to other threads once the constructor completes, without explicit synchronisation.\n- Captures loop variables and lambda captures in a way that prevents accidental modification.\n\n**Common pitfall**: a `final` field in an object whose state you can still mutate gives you a false sense of immutability. Pair `final` fields with careful API design.",
      code: `public class Circle {
    private final double radius;       // immutable after construction
    private final String name;          // reference cannot change; String is itself immutable

    public Circle(double radius, String name) {
        this.radius = radius;
        this.name   = name;
    }
    public double area() { return Math.PI * radius * radius; }

    public static void main(String[] args) {
        final int limit = 10;
        for (int i = 0; i < limit; i++) {
            // limit = i; // compile error -- final cannot be reassigned
        }
        System.out.println(new Circle(2, \"c\").area());
    }
}`,
      codeLanguage: "java",
      explanation:
        "final variable = assigned once; final references still allow mutation of the object; blank finals must be set in every constructor.",
    },
    {
      id: "q076",
      question: "What is a final argument?",
      answer:
        "A `final` parameter is a method argument that the method body cannot reassign. The caller still passes whatever value they want, but inside the method the parameter behaves like a local constant.\n\n**Why people mark parameters final**:\n\n- **Prevents accidental reassignment**: you cannot accidentally overwrite a parameter halfway through the method.\n- **Self-documenting**: the method contract is \"I treat this as read-only\".\n- **Required for inner-class capture**: an anonymous inner class or lambda can only capture variables that are **effectively final**, which means they are never reassigned. Marking the parameter `final` makes the intent explicit even if you do not change it later.\n\n**What it does not mean**:\n\n- It does not freeze the object the reference points to. `final List<String> list` still allows `list.add(...)` inside the method.\n- It does not provide thread-safety.\n- It does not change the caller's view of the argument.\n\n**Effective finality** since Java 8: if a parameter is never reassigned and never written to, it is *effectively* final and can be used in a lambda. Marking it explicitly `final` makes that visible at the parameter list itself.\n\n**Trade-off**: marking every parameter `final` is verbose. Most style guides prefer to mark only the parameters you intend to capture in a lambda or pass to an anonymous class.",
      code: `import java.util.function.IntFunction;

public class FinalArgDemo {
    // Marking 'base' final makes the intent obvious.
    static int[] scale(final int base, int[] values) {
        IntFunction<Integer> doubler = x -> x * base;  // captures the base parameter
        int[] out = new int[values.length];
        for (int i = 0; i < values.length; i++) out[i] = doubler.apply(values[i]);
        return out;
    }

    public static void main(String[] args) {
        int[] xs   = scale(2, new int[]{1, 2, 3});     // [2, 4, 6]
        int[] xs10 = scale(10, new int[]{1, 2, 3});    // [10, 20, 30]
        for (int v : xs) System.out.print(v + \" \");
        System.out.println();
        for (int v : xs10) System.out.print(v + \" \");
    }
}`,
      codeLanguage: "java",
      explanation:
        "final parameter = cannot be reassigned inside the method, required for clean lambda capture, documents read-only intent.",
    },
    {
      id: "q077",
      question: "What happens when a variable is marked as volatile?",
      answer:
        "Marking a field `volatile` tells the JVM that the field can be written by one thread and read by another, and that the program must observe a single canonical value rather than a thread-local cached copy. Reads and writes of `volatile` fields are atomic and establish a happens-before relationship — writes happen-before every subsequent read of the same field on any thread.\n\n**What volatile guarantees:**\n\n- **Visibility**: a write in one thread is visible to all other threads on the next read.\n- **Atomicity for single reads/writes**: `volatile long` and `volatile double` are guaranteed to be read and written atomically (without this, they could tear on 32-bit JVMs).\n- **No reordering**: the JVM cannot reorder code around a volatile read or write in a way that would break the program order.\n\n**What volatile does NOT guarantee:**\n\n- **Atomicity of compound operations**: `count++` is still three operations (read, add, write). Other threads can still see stale values in the middle. Use `AtomicInteger` or `synchronized` for that.\n- **Mutual exclusion**: two threads can still race on a volatile field if both are doing read-modify-write.\n- **Atomicity across multiple fields**: writing two volatile fields is not atomic as a group.\n\n**When to use it**: simple flags (`private volatile boolean running`), the \"double-checked locking\" pattern with a `volatile` reference (so that other threads never see a partially-constructed object), and `AtomicReference`-style coordination.",
      code: `import java.util.concurrent.atomic.AtomicInteger;

public class VolatileDemo {
    private volatile boolean running = true;   // flag visible across threads
    private volatile int     snapshot = 0;
    private final AtomicInteger counter = new AtomicInteger(0);

    void run() throws InterruptedException {
        Thread worker = new Thread(() -> {
            int i = 0;
            while (running) {                // sees updates from main thread
                i++;
                counter.incrementAndGet();   // atomic compound op
            }
            snapshot = i;                    // visible to main thread
        });
        worker.start();
        Thread.sleep(50);
        running = false;                     // volatile write
        worker.join();
        System.out.println(\"snapshot=\" + snapshot + \" counter=\" + counter.get());
    }

    public static void main(String[] args) throws Exception { new VolatileDemo().run(); }
}`,
      codeLanguage: "java",
      explanation:
        "volatile gives visibility and atomic single reads/writes; compound ops like count++ still need AtomicInteger or synchronisation.",
    },
    {
      id: "q078",
      question: "What is a static variable?",
      answer:
        "A `static` field belongs to the class itself, not to any individual object. There is exactly one copy per classloader, no matter how many instances are created. All instances share the same value; mutating it in one place is visible in every other.\n\n**Why static fields are useful:**\n\n- **Shared state**: a counter, a configuration flag, a cache, a registry of instances.\n- **Constants**: `public static final` constants are the idiomatic way to expose a value (`public static final int MAX_RETRY = 5;`).\n- **Class metadata**: things like the class name, a factory registry, or a logger.\n\n**Pitfalls to be aware of:**\n\n- **Initialisation order**: static initialisers run in source order the first time the class is actively used. Cycles between static initialisers can deadlock or throw `ExceptionInInitializerError`.\n- **Memory leaks**: static collections live for the lifetime of the classloader, which is the lifetime of the application in most JVM setups. Stuffing data into them is a classic source of leaks.\n- **Testability**: static state is global state; it persists across tests, which is why `@BeforeEach` cleanup matters and why pure functions are easier to test.\n- **Thread safety**: shared mutable static state needs explicit synchronisation.\n\n**Static vs instance**: instance fields belong to each object and can vary per instance; static fields do not. `Math.PI` is static; a `BankAccount.balance` is instance.",
      code: `public class Counter {
    public static int instances;        // shared by every Counter

    static { System.out.println(\"Counter class loaded\"); }

    public Counter() { instances++; }
}

class StaticDemo {
    public static void main(String[] args) {
        new Counter(); new Counter(); new Counter();
        System.out.println(\"instances=\" + Counter.instances); // 3
        System.out.println(\"PI=\" + Math.PI);                    // class-level constant
    }
}`,
      codeLanguage: "java",
      explanation:
        "static field = one per class per classloader; shared by all instances; watch out for initialisation order and leaks via static collections.",
    },
  ],
  meta: {
    q064: { difficulty: "easy", priority: "high", tags: ["modifier", "package"], relatedQuestionIds: ["q065", "q066"], estimatedReadMinutes: 2 },
    q065: { difficulty: "easy", priority: "high", tags: ["modifier", "private"], relatedQuestionIds: ["q064", "q066"], estimatedReadMinutes: 2 },
    q066: { difficulty: "easy", priority: "high", tags: ["modifier", "package"], relatedQuestionIds: ["q064", "q067"], estimatedReadMinutes: 2 },
    q067: { difficulty: "easy", priority: "high", tags: ["modifier", "protected"], relatedQuestionIds: ["q066", "q068"], estimatedReadMinutes: 2 },
    q068: { difficulty: "easy", priority: "high", tags: ["modifier", "public"], relatedQuestionIds: ["q067", "q073"], estimatedReadMinutes: 2 },
    q069: { difficulty: "easy", priority: "high", tags: ["access", "matrix"], relatedQuestionIds: ["q070", "q071"], estimatedReadMinutes: 2 },
    q070: { difficulty: "easy", priority: "high", tags: ["access", "matrix"], relatedQuestionIds: ["q069", "q072"], estimatedReadMinutes: 2 },
    q071: { difficulty: "easy", priority: "high", tags: ["access", "matrix"], relatedQuestionIds: ["q069", "q072"], estimatedReadMinutes: 2 },
    q072: { difficulty: "easy", priority: "high", tags: ["access", "matrix"], relatedQuestionIds: ["q070", "q071"], estimatedReadMinutes: 2 },
    q073: { difficulty: "easy", priority: "high", tags: ["final", "immutability"], relatedQuestionIds: ["q074", "q075"], estimatedReadMinutes: 2 },
    q074: { difficulty: "easy", priority: "high", tags: ["final", "performance"], relatedQuestionIds: ["q073", "q075"], estimatedReadMinutes: 2 },
    q075: { difficulty: "medium", priority: "very-high", tags: ["final", "immutability"], relatedQuestionIds: ["q073", "q074"], estimatedReadMinutes: 3 },
    q076: { difficulty: "easy", priority: "medium", tags: ["final", "lambda"], relatedQuestionIds: ["q075", "q215"], estimatedReadMinutes: 2 },
    q077: { difficulty: "medium", priority: "very-high", tags: ["volatile", "concurrency"], relatedQuestionIds: ["q197", "q176"], estimatedReadMinutes: 3 },
    q078: { difficulty: "easy", priority: "high", tags: ["static", "class"], relatedQuestionIds: ["q060", "q061"], estimatedReadMinutes: 2 },
  },
});