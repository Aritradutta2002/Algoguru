import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Object Oriented Programming Basics - global questions 23-34.
 * Class, object, state, behaviour, Object, toString, equals/hashCode,
 * inheritance, overloading and overriding.
 */
export const chunk04OopBasicsA = defineChunk({
  topic: "oop-basics",
  questions: [
    {
      id: "q023",
      question: "What is a class?",
      answer:
        "A class is a blueprint that describes the state and behaviour of every object that will be made from it. State is held in fields, behaviour is held in methods, and initialisation is owned by constructors.\n\nA class declares the contract — what an object exposes — and the implementation — how that contract is satisfied. The JVM holds a single `Class<?>` object for each class, which carries metadata (fields, methods, the constructor list) and acts as the blueprint at run time. New objects created with `new MyClass()` are instances of that `Class<?>` and share its method table but own their own field values.\n\nClasses in Java are reference types. A class is loaded lazily the first time it is actively used, can be declared as `public`, `abstract` or `final`, and may be top-level, nested, anonymous or local. Generic classes take type parameters (`class Box<T>`) which are erased at run time. A source file can declare at most one public top-level class and the file name must match.",
      code: `// Blueprint: describes every Car the program will ever build.
class Car {
    // State: each instance has its own copy of these fields.
    private final String make;
    private final String model;
    private int mileage;

    // Constructor: how new Cars are made.
    Car(String make, String model, int mileage) {
        this.make = make;
        this.model = model;
        this.mileage = mileage;
    }

    // Behaviour: every Car can drive and report its data.
    void drive(int km) { mileage += km; }
    String description() { return make + " " + model + " (" + mileage + " km)"; }

    public static void main(String[] args) {
        Car c1 = new Car("Honda", "City", 12_000);
        Car c2 = new Car("Hyundai", "i20", 8_500);
        c1.drive(500);
        System.out.println(c1.description());
        System.out.println(c2.description());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Class = blueprint combining fields, methods and constructors; one Class object in JVM metadata, many instances with their own field values.",
    },
    {
      id: "q024",
      question: "What is an object?",
      answer:
        "An object is a run-time instance of a class: a chunk of heap memory whose shape is determined by the class, holding the field values that distinguish it from every other object of the same class. The class provides the methods; the object provides the data those methods act on.\n\n**Lifecycle of an object:**\n\n- **Allocation**: `new MyClass(...)` reserves memory on the heap and zero-initialises fields; class-level static fields live in the method area, not on the object.\n- **Initialisation**: the chosen constructor runs, instance initialisers run in source order, and reference assignment completes.\n- **Use**: methods are invoked on the object via a reference (`obj.method(...)`). References may be reassigned and may be shared across threads (at your own risk).\n- **Garbage collection**: when no live reference can reach the object, the GC reclaims its memory; finalisers/runFinalization may run first but are deprecated.\n\n**Identity vs equality**: two references can refer to the same object (`==`) or to different objects whose `equals` says they are equal. Object identity is determined by memory address at run time; logical equality is the class's `equals` contract.",
      code: `public class ObjectDemo {
    String label;
    int id;

    ObjectDemo(String label, int id) { this.label = label; this.id = id; }

    @Override public String toString() { return label + "#" + id; }

    public static void main(String[] args) {
        // 'o1' and 'o2' are two distinct heap objects.
        ObjectDemo o1 = new ObjectDemo("Order", 1);
        ObjectDemo o2 = new ObjectDemo("Order", 2);

        // 'ref' points to the same object as o1 -- changing ref affects o1.
        ObjectDemo ref = o1;
        ref.label = "Order (updated)";
        System.out.println(o1); // Order (updated)#1

        // 'o1' loses its reference -- the original object is GC-eligible.
        o1 = null;
        System.gc(); // hint only; do not rely on this

        System.out.println(o2 == o1);     // false (different references)
        System.out.println(o2.equals(o1)); // false (different ids)
    }
}`,
      codeLanguage: "java",
      explanation:
        "Object = heap-resident instance with fields of its own; created by `new`, referenced by handles, reclaimed by GC when unreachable.",
    },
    {
      id: "q025",
      question: "What is state of an object?",
      answer:
        "The state of an object is the snapshot of values in all of its instance fields at a given moment. If two objects of the same class have different field values, they are in different states even though they share the same structure and behaviour.\n\n**What counts as state:**\n\n- **Instance fields**: declared without `static`. Every non-static field contributes to state; primitives hold their value directly, references point to other heap objects (which themselves have their own state).\n- **Not state**: `static` fields belong to the class and are shared by all instances — they are part of class-level state, not object state.\n- **Not state**: local variables and parameters exist on the JVM stack and are not part of any object's state.\n\n**Why state matters for design**: it is what `equals` and `hashCode` are supposed to summarise, what `toString` prints, and what serialisation captures. Best practice is to make fields `private` and expose behaviour through methods so the state cannot be corrupted by callers.\n\n**Mutable vs immutable objects**: an object's state can change after construction only if its fields are not `final` and the class is not designed for immutability. Immutable objects (String, LocalDate, primitives wrapped in collections) are far easier to reason about because their state is fixed at construction.",
      code: `public class StateDemo {
    private int count;          // instance state
    private final String name;  // instance state, but cannot change after ctor

    public StateDemo(String name, int count) {
        this.name = name;
        this.count = count;
    }

    public void increment() { count++; }  // mutates state

    @Override public String toString() { return name + "=" + count; }

    public static void main(String[] args) {
        StateDemo a = new StateDemo("hits", 0);
        StateDemo b = new StateDemo("hits", 0); // same state
        a.increment(); a.increment();           // state diverges
        System.out.println(a); // hits=2
        System.out.println(b); // hits=0
        System.out.println(a.equals(b)); // false — different state
    }
}`,
      codeLanguage: "java",
      explanation:
        "State = instance-field snapshot; mutable fields change it, final fields and immutability freeze it, statics are class-level not object-level.",
    },
    {
      id: "q026",
      question: "What is behavior of an object?",
      answer:
        "Behaviour is what an object can do — its instance methods. While state is what an object knows, behaviour is what an object does, given its state and any parameters the caller passes. The methods declared on the class define the object's behaviour; the JVM dispatches the call by examining the runtime class of the receiver.\n\n**Important behaviour vs state distinctions:**\n\n- **Methods carry behaviour; fields carry state.** You can have a method on an object that depends on no state, but you cannot have behaviour in a field.\n- **Constructors initialise state** — strictly speaking a constructor is part of object creation rather than the object's everyday behaviour, but it is still defined by the class.\n- **Static methods belong to the class, not to any object**, so they are class-level behaviour rather than object behaviour.\n\n**Why behaviour drives design**: the dominant interview question on OOP design is whether you reason about behaviour or about data. Behaviours are stable in a well-designed API (callers depend on the method signature and contract), so you should expose behaviour and hide state. The classic example is `Map.put` versus exposing the internal array — the first lets you swap the implementation later without breaking callers.\n\n**Polymorphism is behaviour variation**: an object's runtime class decides which overridden method runs, so different objects of the same compile-time type can exhibit different behaviour.",
      code: `class Animal {
    String name;
    Animal(String name) { this.name = name; }
    void speak() { System.out.println(name + ": ..."); }  // default behaviour
}

class Dog extends Animal {
    Dog() { super("Dog"); }
    @Override void speak() { System.out.println(name + ": Woof"); }
}

class Cat extends Animal {
    Cat() { super("Cat"); }
    @Override void speak() { System.out.println(name + ": Meow"); }
}

public class BehaviourDemo {
    public static void main(String[] args) {
        Animal[] zoo = { new Dog(), new Cat(), new Dog() };
        // Same call -> different behaviour per actual object
        for (Animal a : zoo) a.speak();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Behaviour = instance methods; override it to vary behaviour per subtype while keeping the caller-facing type stable.",
    },
    {
      id: "q027",
      question: "What is the super class of every class in Java?",
      answer:
        "`java.lang.Object` is the implicit superclass of every class in Java, whether the class declares a parent or not. If you write `class Foo {}`, the compiler rewrites it as `class Foo extends Object {}`. This is why every object inherits a small core API for free — `toString`, `equals`, `hashCode`, `getClass`, and the multi-thread coordination methods `wait`, `notify`, `notifyAll`.\n\n**Consequences of the single-root hierarchy:**\n\n- **Universal base type**: any reference can be assigned to `Object`, which is the basis for `ArrayList<Object>`, generic erasure, reflection and dynamic dispatch.\n- **Default methods**: if you do not override them, `toString` returns `ClassName@hexHash`, `equals` returns reference equality, `hashCode` returns an identity hash.\n- **Single inheritance of classes**: the chain ends at `Object`. The compiler refuses a class that declares any other class as its superclass.\n- **Multi-typed objects**: an object can also implement any number of interfaces, so its full type set is `(superclass chain)` + `(all implemented interfaces)`.\n\n**Practical tip**: when overriding `equals` it is idiomatic to use `getClass() == obj.getClass()` or `instanceof` (the latter breaks symmetry if the subclass adds significant fields, which is why `getClass` is the safer default).",
      code: `public class RootDemo {
    public static void main(String[] args) {
        // Implicit superclass of every class:
        System.out.println(String.class.getSuperclass());         // class java.lang.Object
        System.out.println(Integer.class.getSuperclass());        // class java.lang.Number
        System.out.println(java.util.ArrayList.class.getSuperclass()); // class java.util.AbstractList

        // toString, equals, hashCode, getClass, wait, notify, notifyAll
        // are all inherited from Object.
        Object anything = "hello";
        System.out.println(anything.getClass().getName()); // java.lang.String
        System.out.println(anything.toString());           // hello

        // Upcast to Object always succeeds.
        Object upcast = new RootDemo();
        // Downcast only succeeds when the type actually matches.
        if (upcast instanceof RootDemo r) {
            System.out.println("downcast OK: " + r.getClass().getSimpleName());
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Object is the root: every class inherits its seven core methods, every reference can be assigned to Object, and `getClass()` is the runtime key.",
    },
    {
      id: "q028",
      question: "Explain about toString method?",
      answer:
        "`toString()` is a method inherited from `Object` that returns a human-readable representation of an object. The default implementation in `Object` is `getClass().getName() + '@' + Integer.toHexString(hashCode())`, which is almost never what you want to see in logs or debug output.\n\n**Why overriding matters**:\n\n- **Logging**: `logger.info(\"user=\" + user)` is unreadable if `user` prints `User@1b6d3586`.\n- **Debugging**: a debugger's display formatter usually calls `toString`.\n- **Frameworks**: libraries like Jackson, Spring and Hibernate occasionally use `toString` for diagnostics.\n- **Assertions**: `assertEquals(expected, actual)` prints both sides via `toString` when it fails.\n\n**The contract is informal**: the Javadoc just says the result should be concise, informative and easy to read. It does not require a particular format. The standard guidance is to include the class name and the key state, e.g. `Person(name=Ada, age=37)`. Java 21 added `String.format` style hints but most teams write `toString` by hand or generate it.\n\n**Common pitfalls**:\n\n- **Calling `toString` on a `null` reference** throws NPE — wrap with `String.valueOf(obj)` if you need a null-safe print.\n- **Recursive `toString`** when a field is the object itself or a back-reference — use `@ToString.Exclude` if you use Lombok, or break the cycle manually.\n- **Mutating state inside `toString`** makes the object non-thread-safe and confuses debuggers.",
      code: `import java.util.Objects;

public class User {
    private final String name;
    private final int age;

    public User(String name, int age) { this.name = name; this.age = age; }

    // Override the default Object.toString so logs are readable.
    @Override public String toString() {
        return "User(name=" + name + ", age=" + age + ")";
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return age == other.age && Objects.equals(name, other.name);
    }

    @Override public int hashCode() {
        return Objects.hash(name, age);
    }

    public static void main(String[] args) {
        User u = new User("Ada", 37);
        System.out.println(u);             // User(name=Ada, age=37)
        System.out.println("null=" + String.valueOf((Object) null)); // null=null
    }
}`,
      codeLanguage: "java",
      explanation:
        "Override toString for readable logs and debugger output, never mutate state inside it, and use String.valueOf for null-safe printing.",
    },
    {
      id: "q029",
      question: "What is the use of equals method in Java?",
      answer:
        "`equals(Object other)` is the method that defines what it means for two objects to be **logically equal** as opposed to the same object in memory. The default in `Object` is reference equality (`this == other`), which is rarely what you want for value-like classes.\n\n**What overriding buys you**:\n\n- `new Integer(42).equals(new Integer(42))` is true; without overriding it would be false.\n- Hash-based collections (HashMap, HashSet, HashTable, ConcurrentHashMap) use `equals` to decide whether a key already exists. Two objects that are `equals` but in different buckets simply are not equal to the collection.\n- Search, deduplication and grouping (`Stream.distinct`, `Collectors.toMap`) all rely on `equals`.\n\n**The equals contract** (from `Object` Javadoc):\n\n- **Reflexive**: `x.equals(x)` is true.\n- **Symmetric**: `x.equals(y)` iff `y.equals(x)`.\n- **Transitive**: if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`.\n- **Consistent**: repeated calls return the same value while the objects are unchanged.\n- **Non-null**: `x.equals(null)` is false.\n\n**How to satisfy the contract in practice**:\n\n- Use `instanceof` (or `getClass()`), compare significant fields in order, prefer `Double.compare`/`Float.compare` for floating-point fields to handle NaN consistently.\n- Override `hashCode` whenever you override `equals`. Otherwise the equal-but-different-hash bug silently breaks HashMap/HashSet.\n- Compare the cheapest, most discriminating fields first.",
      code: `import java.util.*;

public class EqualsDemo {
    static class Point {
        final int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Point p)) return false;
            return x == p.x && y == p.y;
        }
        @Override public int hashCode() { return Objects.hash(x, y); }

        @Override public String toString() { return "(" + x + "," + y + ")"; }
    }

    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        System.out.println(a.equals(b));           // true  -- content equality
        System.out.println(a == b);                // false -- reference inequality

        Set<Point> set = new HashSet<>();
        set.add(a);
        System.out.println(set.contains(b));       // true
        System.out.println(set.contains(new Point(99, 99))); // false
    }
}`,
      codeLanguage: "java",
      explanation:
        "equals defines logical equality for HashMap/HashSet/Stream.distinct; honour the contract and always pair it with a consistent hashCode.",
    },
    {
      id: "q030",
      question: "What are the important things to consider when implementing equals method?",
      answer:
        "Implementing `equals` looks trivial but the contract has subtle requirements; a careless implementation is one of the most common sources of bugs in production code.\n\n**Five contract properties you must satisfy**:\n\n- **Reflexive** — `x.equals(x)` must be true. This is usually automatic unless you do something exotic.\n- **Symmetric** — `x.equals(y)` iff `y.equals(x)`. The classic violation is subclassing a value class (e.g. extending `Color` to `RedColor`) and letting the child break the symmetry.\n- **Transitive** — if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)` must hold.\n- **Consistent** — repeated calls must return the same value as long as the objects do not change.\n- **Non-null** — `x.equals(null)` must return false; never throw.\n\n**Practical implementation rules**:\n\n- Use `==` first as a fast-path identity check.\n- Use `instanceof` to guard the type, but be aware it accepts subclasses; for tight control use `getClass() != obj.getClass()`.\n- Compare significant fields in order, cheapest and most discriminating first.\n- For floating-point fields use `Double.compare` / `Float.compare` so NaN behaves predictably.\n- For array fields use `Arrays.equals` rather than `.equals`.\n- Always override `hashCode` so that equal objects have equal hash codes — otherwise HashMap/HashSet silently misbehave.\n- Consider whether `equals` should be consistent with `compareTo` if the class is also `Comparable` (sorted sets and maps rely on this).\n- Prefer `Objects.equals(a, b)` and `Objects.hash(...)` for terser, null-safe code.",
      code: `import java.util.Arrays;
import java.util.Objects;

public class Order implements Comparable<Order> {
    private final long id;
    private final String customer;
    private final double amount;

    public Order(long id, String customer, double amount) {
        this.id = id; this.customer = customer; this.amount = amount;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order other)) return false;
        return id == other.id
            && Double.compare(amount, other.amount) == 0
            && Objects.equals(customer, other.customer);
    }

    @Override public int hashCode() {
        return Objects.hash(id, customer, amount);
    }

    // equals must be consistent with compareTo for sorted collections.
    @Override public int compareTo(Order o) {
        int c = Long.compare(id, o.id);
        if (c != 0) return c;
        c = Objects.compare(customer, o.customer, String::compareTo);
        if (c != 0) return c;
        return Double.compare(amount, o.amount);
    }

    public static void main(String[] args) {
        Order a = new Order(7, "Ada", 19.99);
        Order b = new Order(7, "Ada", 19.99);
        System.out.println(a.equals(b));                 // true
        System.out.println(Arrays.equals(new int[]{1,2}, new int[]{1,2})); // true -- array helper
    }
}`,
      codeLanguage: "java",
      explanation:
        "Honour reflexive/symmetric/transitive/consistent/non-null, pair with hashCode, prefer Objects.equals/hash, compare doubles with compare().",
    },
    {
      id: "q031",
      question: "What is the Hashcode method used for in Java?",
      answer:
        "`hashCode()` returns an `int` that summarises an object's content for use as a bucket index in hash-based collections. It is not a unique identifier — two different objects may legally share the same hash — but it must be consistent: equal objects must always produce the same hash code.\n\n**Why collections need it**: `HashMap`, `HashSet`, `ConcurrentHashMap` and `Hashtable` all store entries in an array of buckets. To find an object they compute its hash, jump to that bucket, then linearly compare candidates with `equals`. A bad hashCode (returning `1` for every object, for example) collapses everything into one bucket and turns O(1) lookups into O(n).\n\n**The contract** (from `Object` Javadoc):\n\n- Consistent: same hash code on repeated calls if state is unchanged.\n- Equal objects have equal hash codes.\n- Unequal objects should produce distinct hash codes **as much as is practical** — not required, but expected for performance.\n\n**Good implementations**:\n\n- Use `Objects.hash(field1, field2, ...)` for short answers.\n- For hot paths, hand-roll using `31 * result + field.hashCode()` (the multiplier 31 is a small odd prime; using a power of two is a known anti-pattern that destroys randomness).\n- Cache the hash if the object is immutable and the computation is expensive (`String` does this).\n- Arrays use `Arrays.hashCode` rather than the inherited reference-based hash.",
      code: `import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

class Account {
    final String iban;
    final String owner;
    Account(String iban, String owner) { this.iban = iban; this.owner = owner; }

    @Override public int hashCode() {
        // 31 is the classic multiplier; mixing xor of fields spreads bits.
        return Objects.hash(iban, owner);
    }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Account a)) return false;
        return Objects.equals(iban, a.iban) && Objects.equals(owner, a.owner);
    }
    @Override public String toString() { return "Account{" + iban + "}"; }
}

public class HashCodeDemo {
    public static void main(String[] args) {
        Map<Account, Double> balances = new HashMap<>();
        balances.put(new Account("GB29-NWBK-6016-1331", "Ada"), 12_500.50);
        // lookup uses hashCode -> bucket -> equals
        Double b = balances.get(new Account("GB29-NWBK-6016-1331", "Ada"));
        System.out.println(b); // 12500.5
    }
}`,
      codeLanguage: "java",
      explanation:
        "hashCode drives bucket selection in HashMap/HashSet; consistent and well-distributed; always paired with equals.",
    },
    {
      id: "q032",
      question: "Explain inheritance with examples.",
      answer:
        "Inheritance lets a class (the **subclass**) reuse and extend another class (the **superclass**). The subclass inherits accessible fields and methods, can override methods to change behaviour, and can add new fields and methods of its own. The relationship is **is-a** — every `Manager` is an `Employee`, but not every `Employee` is a `Manager`.\n\n**Why Java restricts it to single class inheritance**: multiple class inheritance introduces the diamond problem, where two superclasses both define a method with the same name and the JVM has no rule to pick one. Java avoids this by allowing single class inheritance plus multiple interface implementation. Interfaces since Java 8 can supply `default` methods, which brings back a limited form of the diamond — resolved by explicit override or `Super.super.method()`.\n\n**What is not inherited**:\n\n- **Constructors** — but subclass constructors must call `super(...)` as their first statement, either explicitly or via the compiler-inserted `super()`.\n- **`private` members** exist in the parent but are not visible to the child.\n- **`static` methods** are hidden, not overridden. The child class can declare a method with the same signature, but the JVM dispatches by the reference type, not the runtime type.\n- **`final` methods and `final` classes** cannot be extended/overridden.\n\n**Inheritance vs composition**: prefer composition when the relationship is **has-a** (a `Car` has an `Engine`) and inheritance when it is **is-a** (a `Manager` is an `Employee`). Inheritance breaks encapsulation by exposing the parent class's structure, so the rule of thumb is to extend only when every subclass truly satisfies the parent's contract.",
      code: `class Employee {
    protected String name;
    protected double salary;
    Employee(String name, double salary) { this.name = name; this.salary = salary; }
    double annualPay() { return salary * 12; }
    @Override public String toString() { return name + " (E)"; }
}

class Manager extends Employee {
    private double bonus;
    Manager(String name, double salary, double bonus) {
        super(name, salary);
        this.bonus = bonus;
    }
    @Override double annualPay() { return super.annualPay() + bonus; }
    @Override public String toString() { return name + " (M)"; }
}

public class InheritanceDemo {
    public static void main(String[] args) {
        Employee e = new Manager("Ada", 8_000, 25_000);
        System.out.println(e + " earns " + e.annualPay());
        // superclass reference can hold a subclass instance
        // dispatch picks Manager.annualPay at run time
    }
}`,
      codeLanguage: "java",
      explanation:
        "Inheritance = is-a reuse: subclass inherits fields/methods, constructors are not inherited, prefer composition for has-a.",
    },
    {
      id: "q033",
      question: "What is method overloading?",
      answer:
        "Method overloading means declaring multiple methods with the **same name but different parameter lists** in the same class (or a subclass). The compiler picks the right method at compile time based on the static types of the arguments — this is why overloading is also called compile-time polymorphism.\n\n**What makes two methods different overloads**:\n\n- **Different number of parameters**.\n- **Different types of parameters** (in the order they appear).\n- **Varargs counts as an array**: `foo(int... xs)` is the same signature as `foo(int[] xs)`; declaring both is a compile error.\n\n**What does NOT make a different overload**:\n\n- **Return type alone** — `int foo()` and `String foo()` with the same parameters is a compile error.\n- **Access modifiers** — `public int foo()` and `private int foo()` are not overloads, they conflict.\n- **Only the parameter name** — ignored by the compiler.\n- **Throws clauses** — checked exception differences do not affect overload resolution.\n\n**Common interview trap**: `null` overloads. Calling `foo(null)` with both `foo(String)` and `foo(Integer)` overloads present is ambiguous; the most specific one is chosen, but two equally-specific classes do not compile.\n\n**Overloading across class hierarchies**: a subclass can re-declare a method from the parent with a different parameter list, which overloads independently. If the subclass declares the exact same signature, that is overriding (not overloading) and the rules of runtime dispatch apply.",
      code: `public class OverloadingDemo {
    // Three overloads of 'print' — same name, different parameter lists.
    void print(int x)             { System.out.println("int: " + x); }
    void print(double x)          { System.out.println("double: " + x); }
    void print(String s, int n)   { System.out.println("repeat " + s + " x" + n); }

    public static void main(String[] args) {
        var d = new OverloadingDemo();
        d.print(7);             // int
        d.print(7.5);           // double (not int — decimal literal)
        d.print("hi", 3);       // repeat hi x3
        // compile-time pick: literal 7 is int, 7.5 is double.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Overloading = same name, different parameter lists; resolved at compile time; return-type-only changes are illegal.",
    },
    {
      id: "q034",
      question: "What is method overriding?",
      answer:
        "Method overriding replaces a superclass's method with a new implementation in the subclass. The signature, return type (or a covariant subtype) and access level must be compatible, and the JVM dispatches the call by the runtime class of the receiver — which is why overriding is runtime polymorphism.\n\n**Rules that must be followed**:\n\n- **Same name and parameter list** — otherwise you are overloading, not overriding.\n- **Return type may be narrowed** to a subtype since Java 5 (covariant returns), e.g. overriding `Animal clone()` with `Dog clone()` is legal.\n- **Access modifier may be widened**, never narrowed — `protected` in the parent can become `public` in the child, but never `private`.\n- **Checked exceptions may be reduced or removed** but not added or broadened.\n- **Cannot override `static`, `final` or `private` methods**. `static` methods are hidden, not overridden. Hiding is dispatched by the reference type, not the runtime type, which is the source of the classic `Base.staticMethod()` vs `Derived.staticMethod()` confusion.\n- **Use the `@Override` annotation**: the compiler then refuses the method if it does not actually override anything, which catches typos and signature drift.\n\n**Pitfalls**:\n\n- Overriding `equals`/`hashCode`/`toString` but forgetting to mark `@Override` lets bugs creep in when the parent signature changes.\n- Calling overridable methods from a constructor — a subclass field may not yet be initialised when the parent's constructor runs, leading to surprising NPEs.\n- Field access is **not** polymorphic. If `Parent.value` is shadowed by `Child.value`, the value returned depends on the reference type, not the runtime class.",
      code: `class Animal {
    String sound() { return "..."; }
}

class Dog extends Animal {
    @Override
    String sound() { return "Woof"; } // overrides Animal.sound

    static void whoAmI() { System.out.println("static Dog"); }
}

class Cat extends Animal {
    @Override
    String sound() { return "Meow"; }
    static void whoAmI() { System.out.println("static Cat"); }
}

public class OverrideDemo {
    public static void main(String[] args) {
        Animal a = new Dog();
        System.out.println(a.sound()); // Woof — runtime dispatch
        Animal b = new Cat();
        System.out.println(b.sound()); // Meow
        // static method: dispatch by reference type
        Animal ref = new Dog();
        ref.whoAmI();                  // static Animal, NOT overridden
    }
}`,
      codeLanguage: "java",
      explanation:
        "Overriding = same signature, dispatch by runtime type; static methods are hidden not overridden, and field access is not polymorphic.",
    },
  ],
  meta: {
    q023: { difficulty: "easy", priority: "very-high", tags: ["class", "oop"], relatedQuestionIds: ["q024", "q025"], estimatedReadMinutes: 2 },
    q024: { difficulty: "easy", priority: "very-high", tags: ["object", "heap"], relatedQuestionIds: ["q023", "q027"], estimatedReadMinutes: 2 },
    q025: { difficulty: "easy", priority: "high", tags: ["object", "state"], relatedQuestionIds: ["q024", "q026"], estimatedReadMinutes: 2 },
    q026: { difficulty: "easy", priority: "high", tags: ["object", "behaviour"], relatedQuestionIds: ["q025", "q055"], estimatedReadMinutes: 2 },
    q027: { difficulty: "easy", priority: "very-high", tags: ["object", "inheritance"], relatedQuestionIds: ["q028", "q032"], estimatedReadMinutes: 2 },
    q028: { difficulty: "easy", priority: "very-high", tags: ["object", "tostring"], relatedQuestionIds: ["q029", "q027"], estimatedReadMinutes: 2 },
    q029: { difficulty: "medium", priority: "very-high", tags: ["equals", "contract"], relatedQuestionIds: ["q030", "q031"], estimatedReadMinutes: 3 },
    q030: { difficulty: "medium", priority: "very-high", tags: ["equals", "contract"], relatedQuestionIds: ["q029", "q031"], estimatedReadMinutes: 3 },
    q031: { difficulty: "medium", priority: "very-high", tags: ["hashcode", "collections"], relatedQuestionIds: ["q029", "q030"], estimatedReadMinutes: 3 },
    q032: { difficulty: "medium", priority: "very-high", tags: ["inheritance", "is-a"], relatedQuestionIds: ["q027", "q036"], estimatedReadMinutes: 3 },
    q033: { difficulty: "easy", priority: "high", tags: ["overloading", "compile-time"], relatedQuestionIds: ["q034", "q046"], estimatedReadMinutes: 2 },
    q034: { difficulty: "medium", priority: "very-high", tags: ["overriding", "runtime"], relatedQuestionIds: ["q033", "q055"], estimatedReadMinutes: 3 },
  },
});