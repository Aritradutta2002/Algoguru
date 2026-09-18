import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Wrapper Classes — global questions 7-15.
 * Covers the eight wrapper types, why they exist, how instances are created,
 * constructor versus factory identity, autoboxing, and casting.
 */
export const chunk02Wrappers = defineChunk({
  topic: "wrapper-classes",
  questions: [
    {
      id: "q007",
      question: "What are Wrapper classes?",
      answer:
        "**Wrapper classes** are the eight classes in `java.lang` that turn each primitive into an object: `Boolean`, `Byte`, `Character`, `Short`, `Integer`, `Long`, `Float` and `Double`. They are the bridge between Java's small set of non-object types and its otherwise fully object-oriented type system.\n\nThe mapping is one-to-one and strict:\n\n- **boolean** is wrapped by `Boolean`, **char** by `Character`.\n- **byte, short, int, long, float, double** are wrapped by `Byte`, `Short`, `Integer`, `Long`, `Float`, `Double`.\n\nAll eight are `final` and immutable, so they are safe to share and are valid map keys. Six of them extend `Number`, which declares `intValue()`, `longValue()`, `doubleValue()` and friends, so a single `Number` parameter or `List<Number>` accepts every numeric wrapper; `Character` and `Boolean` are the two that do not.\n\n**What the classes give you:**\n\n- **Conversion**: `Integer.parseInt(...)`, `Double.valueOf(...)`, `Character.digit(...)`.\n- **Constants**: `Integer.MAX_VALUE`, `Integer.SIZE`, `Double.NaN`, `Boolean.TRUE`.\n- **Utility logic**: `Integer.toBinaryString(255)`, `Integer.compare(a, b)`, `Long.sum(a, b)`.\n- **A null state**: an `Integer` field can hold null, so it can mean 'not set' where an `int` would silently mean zero.\n\nSince Java 5 the compiler performs most conversions for you through autoboxing, so `Integer count = 42;` compiles, but the classes themselves date back to Java 1.0 and are the reason generic collections can hold numbers at all.",
      code: `public class WrapperBasics {
    public static void main(String[] args) {
        // Every primitive has a matching wrapper in java.lang
        Integer count = Integer.valueOf(42);
        Boolean flag = Boolean.TRUE;
        Character grade = Character.valueOf('A');
        Double ratio = Double.valueOf(0.75);

        // Wrapper constants and static helpers
        System.out.println("max int   : " + Integer.MAX_VALUE);
        System.out.println("int bytes : " + Integer.BYTES);
        System.out.println("parse     : " + Integer.parseInt("2048"));
        System.out.println("binary    : " + Integer.toBinaryString(255));

        // Immutable and Comparable: safe as keys, value based ordering
        System.out.println("equals    : " + count.equals(42));
        System.out.println("compare   : " + count.compareTo(7));

        // Six wrappers extend Number, so one type covers them all
        Number[] metrics = { Integer.valueOf(1), Long.valueOf(2L), Double.valueOf(3.5) };
        for (Number metric : metrics) {
            System.out.println("as double : " + metric.doubleValue());
        }

        System.out.println("flag      : " + flag + ", grade " + grade + ", ratio " + ratio);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name all eight classes, note that they are final and immutable, and that six extend Number while Character and Boolean do not.",
    },
    {
      id: "q008",
      question: "Why do we need Wrapper classes in Java?",
      answer:
        "Wrapper classes exist because Java has two parallel worlds: primitives for speed and objects for API compatibility. Generics, the Collections Framework, reflection and virtually every framework are built on reference types, so a primitive has to be wrapped before it can travel through them. `List<Integer>` is legal, `List<int>` will not compile.\n\n**Where wrappers are mandatory:**\n\n- **Generics**: type parameters must be reference types, so `Map<Integer, String>` boxes every key.\n- **Collections**: lists and maps store references, boxing on the way in and unboxing on the way out.\n- **Nullability**: null is a meaningful 'no value' state for a database column or a JSON field, whereas an `int` zero is indistinguishable from a real zero.\n- **Comparison and lookup**: sorting, `equals`/`hashCode` based lookup and generic algorithms need `Comparable` objects.\n- **Framework boundaries**: ORMs, JSON mappers, bean validation and DI containers reflect over objects and treat primitives as a special case.\n\n**Object-style helpers** are the second reason: wrappers carry the static machinery a primitive cannot have - `parseInt`, `valueOf`, `compare`, `toHexString`, `toUnsignedString`, plus range constants such as `Long.MAX_VALUE`. Without them every project would reimplement number parsing and range checks.\n\n**The trade-off to state**: boxing costs an allocation or at least a cache lookup, and an unboxed null throws `NullPointerException`. That is why performance-sensitive numeric code stays on `int` and only boxes at the API boundary.",
      code: `import java.util.HashMap;
import java.util.Map;

public class WhyWrappers {
    public static void main(String[] args) {
        // Generics only accept reference types: Map<Integer, String> is legal
        Map<Integer, String> seats = new HashMap<>();
        seats.put(101, "Alice");
        seats.put(102, "Bob");
        System.out.println("seat 101 : " + seats.get(101));
        System.out.println("seat 999 : " + seats.get(999)); // null, no exception

        // Nullability carries meaning that a primitive cannot express
        Integer rating = null;        // not rated yet
        int defaultRating = 0;        // a genuine zero
        System.out.println("rated?   : " + (rating != null));
        System.out.println("default  : " + defaultRating);

        // Reflection style APIs take Object arguments: autoboxing bridges
        Object[] payload = { Integer.valueOf(7), Boolean.TRUE };
        for (Object item : payload) {
            System.out.println(item.getClass().getSimpleName() + " = " + item);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want generics and collections plus the null sentinel, then the honest caveat that boxing costs allocations and can throw on unboxing.",
    },
    {
      id: "q009",
      question: "What are the different ways of creating Wrapper class instances?",
      answer:
        "Wrapper instances can be produced by constructors, by static factory methods, or implicitly by autoboxing. Only the last two are idiomatic in modern Java.\n\n**The available routes:**\n\n- **Constructor**: `new Integer(5)`, `new Double(1.5)`, `new Character('a')`, plus the String-taking overloads such as `new Integer(valueAsText)`, and `new Boolean(...)`.\n- **Static factory**: `Integer.valueOf(5)`, `Character.valueOf('a')`, `Boolean.valueOf(true)`, `Long.valueOf(9L)` - and the parsing overloads that take a radix, for example `Integer.valueOf(text, 16)`.\n- **Autoboxing**: `Integer count = 5;`, or passing an `int` to a method that declares an `Integer`. The compiler inserts `valueOf` for you, so this is the same mechanism as the factory method.\n- **Decoding helpers**: `Integer.decode(...)` and `Long.decode(...)` recognise decimal, `0x` hexadecimal, `0` octal and `#` prefixes in one call.\n\n**The deprecation you must mention**: the primitive constructors on all eight wrappers are deprecated for removal since Java 9. They always allocate, whereas `valueOf` may return a shared instance.\n\n**What the cache covers**: `Boolean` already has its `TRUE` and `FALSE` constants, `Byte` caches all 256 values, `Character` caches 0 to 127, and `Short`, `Integer` and `Long` cache -128 to 127. `Float` and `Double` never cache, so their `valueOf` always allocates. The `Integer` cache ceiling is tunable with `-XX:AutoBoxCacheMax=<size>`.",
      code: `public class CreationRoutes {
    public static void main(String[] args) {
        // Route 1: constructor - deprecated for removal since Java 9,
        // because it always allocates a fresh object.
        // Integer fromCtor = new Integer(5);

        // Route 2: static factory - preferred, may return a cached instance
        Integer fromFactory = Integer.valueOf(5);
        Character letter = Character.valueOf('A');
        Boolean accepted = Boolean.valueOf(true);
        Integer fromRadix = Integer.valueOf("1f", 16);
        Long decoded = Long.decode("0x2a");

        // Route 3: autoboxing - the compiler inserts valueOf
        Integer boxed = 5;
        Double sum = 1.5 + 2.5;

        // Route 4: decode understands 0x, 0 and # prefixes
        System.out.println("factory : " + fromFactory + " " + letter + " " + accepted);
        System.out.println("radix   : " + fromRadix);
        System.out.println("decoded : " + decoded);
        System.out.println("boxed   : " + boxed + ", sum " + sum);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Mention constructors, valueOf factories and autoboxing, then the Java 9 constructor deprecation and the -128..127 cached range.",
    },
    {
      id: "q010",
      question: "What are differences in the two ways of creating Wrapper classes?",
      answer:
        "Both `new Integer(5)` and `Integer.valueOf(5)` hand you an `Integer` holding 5, and `equals` reports them equal. Everything else is different.\n\n**How they differ:**\n\n- **Identity**: the constructor allocates a brand-new object on every call, so two constructor calls are never `==`. `valueOf` returns a shared, pre-created instance whenever the value falls inside the wrapper cache.\n- **Cache range**: `Byte` caches all 256 values, `Character` caches 0 to 127, and `Short`, `Integer` and `Long` cache -128 to 127; `Float` and `Double` cache nothing. Outside the range `valueOf` allocates exactly like the constructor does.\n- **Performance**: inside the cache, boxing becomes a field read instead of an allocation, which matters in loops over large collections of small numbers.\n- **Deprecation**: the constructors are deprecated for removal since Java 9, so new code should use the factory - and `valueOf` is precisely what the compiler itself generates for autoboxing.\n- **Tuning**: the `Integer` cache ceiling can be raised with `-XX:AutoBoxCacheMax=<size>`, but relying on identity is still a bug waiting to happen.\n\n**The classic trap**: `==` on wrappers compares references, not values. `Integer a = 127; Integer b = 127;` makes `a == b` true, while the same code with 128 makes it false, because the second pair sits outside the cache. Use `equals`, `Objects.equals` or `compareTo` for value comparison - interviewers ask this to see whether you know the cache exists and know not to depend on it.",
      code: `public class ConstructorVsFactory {
    public static void main(String[] args) {
        // Deprecated since Java 9: every call allocates a fresh object
        Integer oldA = new Integer(5);
        Integer oldB = new Integer(5);
        System.out.println("ctor   == : " + (oldA == oldB));      // false
        System.out.println("ctor equals: " + oldA.equals(oldB));  // true

        // valueOf reuses the cache for the range -128..127
        Integer smallA = Integer.valueOf(127);
        Integer smallB = Integer.valueOf(127);
        System.out.println("cached == : " + (smallA == smallB));  // true

        Integer bigA = Integer.valueOf(128);
        Integer bigB = Integer.valueOf(128);
        System.out.println("outside ==: " + (bigA == bigB));      // false

        // Autoboxing goes through the same cache
        Integer boxedA = 100;
        Integer boxedB = 100;
        System.out.println("boxed  == : " + (boxedA == boxedB));  // true

        // Value comparison is always safe
        System.out.println("equals    : " + bigA.equals(bigB));
    }
}`,
      codeLanguage: "java",
      explanation:
        "The constructor always allocates while valueOf reuses the -128..127 cache, so == on wrappers is a reference test and equals is mandatory.",
    },
    {
      id: "q011",
      question: "What is auto boxing?",
      answer:
        "**Autoboxing** is the compiler's automatic conversion from a primitive to its wrapper type, and **unboxing** is the reverse conversion. Both arrived in Java 5 and are compile-time conveniences only: the JVM has no boxing instruction. The compiler simply inserts `Integer.valueOf(x)` where an object is required and `x.intValue()` where a primitive is required, which you can confirm with `javap -c`.\n\n**Where it applies:**\n\n- **Assignment**: `Integer count = 10;` and `int n = count;`.\n- **Method arguments and returns**: passing an `int` to a method that declares an `Integer`, or returning an `int` from a method declared to return `Long`.\n- **Generics and collections**: `List<Integer> ids = new ArrayList<>(); ids.add(7);` boxes on the way in, and a `for (int id : ids)` loop unboxes each element.\n- **Arithmetic and comparison**: `ids.get(0) + 1` unboxes, computes, and boxes again if the result is stored as an object.\n- **Conditional expressions**: a ternary that mixes `Integer` and `int` promotes the whole expression to `int`, so it can unbox a null.\n\n**The traps to name**: unboxing a null wrapper throws `NullPointerException`, the most common boxing bug in production; `==` between two wrappers compares references rather than values; and overload resolution prefers primitive widening over boxing, so a call with an `int` argument binds to `f(long)` rather than `f(Integer)`. Boxing in a tight loop also creates garbage, so hot numeric code should stay primitive with `int[]` and `IntStream`.",
      code: `import java.util.ArrayList;
import java.util.List;

public class AutoboxingDemo {
    public static void main(String[] args) {
        List<Integer> ids = new ArrayList<>();
        ids.add(7);                        // boxes: add(Integer.valueOf(7))
        ids.add(42);

        int total = 0;
        for (int id : ids) total += id;    // unboxes each element
        System.out.println("total = " + total);

        // Widening beats boxing during overload resolution
        print(5);                          // prints primitive: 5
        print(Long.valueOf(6));            // exact type match wins

        // Unboxing a null wrapper is the classic NullPointerException
        Integer missing = null;
        try {
            int bad = missing;
            System.out.println(bad);
        } catch (NullPointerException e) {
            System.out.println("unboxing null failed");
        }
    }

    static void print(long value) { System.out.println("primitive: " + value); }
    static void print(Long value) { System.out.println("wrapper  : " + value); }
}`,
      codeLanguage: "java",
      explanation:
        "Autoboxing is compiler inserted valueOf and intValue calls, so flag the unboxing NPE, reference comparison and widening over boxing.",
    },
    {
      id: "q012",
      question: "What are the advantages of auto boxing?",
      answer:
        "Autoboxing's real advantage is readability: it removes the manual `Integer.valueOf(...)` and `.intValue()` calls that made pre-Java 5 code noisy, without changing the type system. It is a compiler-level transformation applied consistently wherever a reference type is expected, so collections, generics and framework APIs stop needing hand-written conversions.\n\n**What it buys you:**\n\n- **Cleaner collection code**: `ids.add(10)` and `for (int id : ids)` instead of `iterator.next().intValue()` chains.\n- **Practical generics**: type parameters must be reference types, so autoboxing is what makes `List<Integer>`, `Map<Long, Double>` and `Optional<Integer>` pleasant to use.\n- **Streams and functional APIs**: `List<Integer>` interoperates with `mapToInt`, `IntStream::sum` and collectors without explicit conversion - and `mapToInt` is exactly how you escape boxing when the numbers dominate.\n- **Framework integration**: bean setters, JPA entities, JSON mappers and reflection-based APIs work with object properties while your business logic stays primitive.\n- **A free null sentinel**: an `Integer` field can express 'absent', which is exactly what nullable database columns and optional JSON fields need.\n- **Fewer conversion bugs**: hand-written code frequently mixes up `Integer.parseInt` and `Integer.valueOf`, or forgets the radix argument.\n\n**What it does not buy you** is performance. Boxing still allocates or at least hits the cache, and unboxing a null wrapper throws `NullPointerException`. Treat autoboxing as an API-boundary convenience and keep numeric hot loops primitive.",
      code: `import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class BoxingBenefits {
    public static void main(String[] args) {
        List<Integer> scores = new ArrayList<>();
        scores.add(88);   // no explicit Integer.valueOf needed
        scores.add(95);

        // Streams interoperate without manual conversion
        int total = scores.stream().mapToInt(Integer::intValue).sum();
        List<Integer> bumped = scores.stream()
                .map(s -> s + 5)                    // unbox, add, rebox
                .collect(Collectors.toList());

        System.out.println("total  : " + total);
        System.out.println("bumped : " + bumped);

        // Wrapper null as an 'absent' sentinel, never as arithmetic input
        Integer highScore = null;
        int fallback = (highScore != null) ? highScore : 0; // ternary unboxes
        System.out.println("high   : " + fallback);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lead with cleaner collection and generics code, then add the essential caveat that boxing still allocates and null unboxing throws.",
    },
    {
      id: "q013",
      question: "What is casting?",
      answer:
        "**Casting** is the instruction to the compiler to treat an expression as a different type: `(double) 7`, `(int) 9.99`, `(Dog) animal`. Java has two entirely separate casting worlds, and a complete answer covers both.\n\n**Primitive casting** converts a value between the numeric types.\n\n- **Widening (implicit)**: a narrower type is assigned to a wider one - `byte` to `short` to `int` to `long` to `float` to `double`, and `char` to `int`. No cast is required.\n- **Narrowing (explicit)**: a wider type is squeezed into a narrower one. `(int) 9.99` truncates to 9 and `(byte) 200` wraps to -56, because the low-order bits survive and the rest are discarded.\n\n**Reference casting** changes only the static type the compiler sees; it never touches the object.\n\n- **Upcast (implicit)**: treating a `Dog` as an `Animal` or as `Object`. Always safe, and it is what makes polymorphism possible.\n- **Downcast (explicit)**: treating an `Animal` reference as a `Dog`. The compiler allows it when the conversion is plausible and the JVM verifies the real object at run time, throwing `ClassCastException` on a mismatch.\n\n**Two rules worth stating**: a primitive cast changes the value, while a reference cast changes only what the compiler lets you call. And a cast between provably unrelated classes is a compile-time error, whereas a cast to an interface is always allowed because some subclass could implement it. Since Java 16, pattern matching for `instanceof` makes safe downcasting a one-liner.",
      code: `public class CastingDemo {
    static class Animal {
        String describe() { return "animal"; }
    }

    static class Dog extends Animal {
        String fetch() { return "ball"; }
    }

    public static void main(String[] args) {
        // Primitive: widening is implicit, narrowing needs a cast
        double wide = 7;             // int -> double, nothing to write
        int narrow = (int) 9.99;     // truncates toward zero -> 9
        byte wrapped = (byte) 200;   // low 8 bits -> -56

        // Reference: upcast implicit and safe, downcast explicit and checked
        Animal pet = new Dog();      // upcast
        Dog dog = (Dog) pet;         // downcast, verified at run time
        System.out.println("dog fetches " + dog.fetch());

        Animal plain = new Animal();
        if (plain instanceof Dog d) {          // Java 16+ safe downcast
            System.out.println(d.fetch());
        } else {
            System.out.println("not a Dog: (Dog) here would throw ClassCastException");
        }

        System.out.println(wide + " " + narrow + " " + wrapped + " " + pet.describe());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Separate primitive widening and narrowing from reference upcasting and downcasting, and note that reference casts are checked at run time.",
    },
    {
      id: "q014",
      question: "What is implicit casting?",
      answer:
        "**Implicit casting**, also called automatic type conversion or widening, is a conversion the compiler performs with no cast operator because it cannot lose the value's range. It happens silently in assignments, method arguments, arithmetic and reference assignment.\n\n**The primitive widening hierarchy:**\n\n- `byte` to `short` to `int` to `long` to `float` to `double`.\n- `char` to `int`, `long`, `float` or `double` - `char` is an unsigned 16-bit code unit, so it widens to `int` but never to `short`.\n- An `int` may also widen to a `float`, and a `long` to a `float` or `double`, without a cast.\n\n**Where you meet it daily**: binary numeric promotion widens both operands of `a + b` to the wider type, which is why `byte b = 1; b = b + 1;` does not compile while `b += 1;` does - the compound assignment operator inserts the implicit narrowing cast back to `byte`.\n\n**Reference widening (upcasting)** is implicit too and never fails: assigning a subtype to a supertype or interface reference, as in `Object value = new ArrayList<String>();`. The static type limits which methods you may call; the dynamic type decides which override actually runs.\n\n**The one caveat**: widening is range-safe, not precision-safe. `int big = Integer.MAX_VALUE; float f = big;` compiles, but a `float` keeps only about 24 bits of mantissa and a `double` about 53, so large integers lose low-order digits.",
      code: `import java.util.ArrayList;
import java.util.List;

public class ImplicitCasting {
    public static void main(String[] args) {
        // Primitive widening chain: no cast in any of these lines
        byte b = 10;
        short s = b;
        int i = s;
        long l = i;
        float f = l;
        double d = f;

        char letter = 'A';
        int ascii = letter;                  // char -> int, implicit
        System.out.println("ascii of A : " + ascii);

        // Range safe but not precision safe
        int big = Integer.MAX_VALUE;
        float rounded = big;                 // compiles, digits are lost
        System.out.println("exact      : " + big);
        System.out.println("as float   : " + rounded);

        // Reference upcast is implicit as well
        List<String> names = new ArrayList<>();
        Object asObject = names;             // upcast to Object
        System.out.println("is a List  : " + (asObject instanceof List));

        // b = b + 1 would not compile; += adds the implicit cast
        b += 1;
        System.out.println("b / d      : " + b + " / " + d);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Cover widening order, char to int, implicit upcasting, and that compound assignment secretly narrows back while float conversion loses precision.",
    },
    {
      id: "q015",
      question: "What is explicit casting?",
      answer:
        "**Explicit casting** is a conversion you request yourself with the cast operator, `(Type) expression`. It is required whenever the compiler cannot guarantee the conversion is safe: all primitive narrowing and every reference downcast. The compiler accepts your promise and the runtime behaviour is defined precisely.\n\n**Primitive narrowing - the bits decide:**\n\n- `(int) 9.99` gives 9, because floating-point narrowing truncates toward zero, so `(int) -9.99` gives -9, not -10.\n- `(byte) 200` gives -56 and `(short) 70000` gives 4464: integral narrowing keeps the low-order bits, so it wraps in two's complement instead of throwing.\n- `(char) 65` gives 'A', interpreting the number as a UTF-16 code unit.\n- When silent truncation would be a bug, use `Math.round`, `BigDecimal` or an explicit range check instead.\n\n**Reference downcasting - verified at run time:**\n\n- The cast compiles only if the compiler believes it is possible, which for `(Dog) animal` means `Dog` is a subtype of the reference type.\n- The JVM then checks the real class of the object and throws `ClassCastException` on a mismatch.\n- Casting to an interface is always allowed, because any class might implement it later.\n- Guard the cast with `instanceof`, or since Java 16 use pattern matching: `if (o instanceof Dog d) d.fetch();`.\n\nCasting a null reference never throws - only a non-null object of the wrong class does - which is why `(Dog) null` passes and the real problem surfaces later.",
      code: `public class ExplicitCasting {
    static class Shape {
        String kind() { return "shape"; }
    }

    static class Circle extends Shape {
        double radius() { return 2.0; }
    }

    public static void main(String[] args) {
        // Primitive narrowing truncates and wraps, it never throws
        int truncated = (int) 9.99;
        byte wrapped = (byte) 200;
        char code = (char) 65;
        System.out.println(truncated + " " + wrapped + " " + code);

        // Reference downcast: allowed by the compiler, checked by the JVM
        Shape shape = new Circle();
        if (shape instanceof Circle c) {        // Java 16+ pattern matching
            System.out.println("radius = " + c.radius());
        }

        Shape plain = new Shape();
        try {
            Circle bad = (Circle) plain;        // ClassCastException here
            System.out.println(bad.radius());
        } catch (ClassCastException e) {
            System.out.println("rejected: " + e.getMessage());
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "State that narrowing truncates or wraps by bits while reference downcasts are run-time verified, and prefer instanceof pattern matching over blind casts.",
    },
  ],
  meta: {
    q007: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["wrapper-classes", "primitives", "java-lang", "immutability"],
      relatedQuestionIds: ["q008", "q009", "q011"],
      estimatedReadMinutes: 3,
    },
    q008: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["wrapper-classes", "generics", "collections"],
      relatedQuestionIds: ["q007", "q009", "q012"],
      estimatedReadMinutes: 3,
    },
    q009: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["wrapper-classes", "valueof", "caching"],
      relatedQuestionIds: ["q010", "q011", "q007"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 9+"],
    },
    q010: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["wrapper-classes", "caching", "identity"],
      relatedQuestionIds: ["q009", "q011", "q007"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 9+"],
    },
    q011: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["autoboxing", "unboxing", "generics"],
      relatedQuestionIds: ["q012", "q009", "q010"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q012: {
      difficulty: "easy",
      priority: "high",
      tags: ["autoboxing", "collections", "streams"],
      relatedQuestionIds: ["q011", "q008", "q010"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q013: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["casting", "primitives", "polymorphism"],
      relatedQuestionIds: ["q014", "q015", "q011"],
      estimatedReadMinutes: 3,
    },
    q014: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["casting", "widening", "upcasting"],
      relatedQuestionIds: ["q013", "q015", "q008"],
      estimatedReadMinutes: 3,
    },
    q015: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["casting", "narrowing", "downcasting"],
      relatedQuestionIds: ["q013", "q014", "q010"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 16+"],
    },
  },
});