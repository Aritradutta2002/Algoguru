import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Miscellaneous Topics - global questions 109-121.
 * Arrays, enums, varargs, asserts, garbage collection.
 */
export const chunk12MiscA = defineChunk({
  topic: "miscellaneous",
  questions: [
    {
      id: "q109",
      question: "What are the default values in an array?",
      answer:
        "Unlike local variables, every array element is automatically initialised when the array is created. The rule is the same as for instance fields: numeric primitives start at 0, floating-point at 0.0, char at `\\u0000`, boolean at `false`, and reference elements at `null`.\n\n**Why this matters:** local primitives are explicitly uninitialised and cannot be read until written, but a `new int[3]` is ready to read immediately. That is why loops like `for (int i = 0; i < arr.length; i++) sum += arr[i];` work without explicit initialisation.\n\n**What about the array reference itself?** The local `int[] arr;` is uninitialised until you write `arr = new int[3]` or `arr = new int[]{1,2,3}`. The rule applies only to the elements once the array exists.\n\n**Multi-dimensional arrays:** each sub-array is also default-initialised to `null` until you allocate it. `new int[3][]` gives you three `null` sub-arrays; you must allocate each one with `new int[3]` before reading from it.\n\n**Common interview trap**: confusing element defaults with `new int[]{1,2,3}` style literals — the literal assigns explicit values that override the defaults. Also note that arrays of `boolean[]` default to `false`, not `0` — a favourite spot for subtle bugs when reading bytes as flags.",
      code: `import java.util.Arrays;

public class ArrayDefaults {
    public static void main(String[] args) {
        int[]      ints     = new int[4];
        boolean[]  flags    = new boolean[4];
        String[]   words    = new String[4];

        System.out.println(Arrays.toString(ints));   // [0, 0, 0, 0]
        System.out.println(Arrays.toString(flags));  // [false, false, false, false]
        System.out.println(Arrays.toString(words));  // [null, null, null, null]

        int[][] jagged = new int[3][];
        // jagged[0][0] would NPE -- sub-array not yet allocated
        jagged[0] = new int[]{1, 2};
        System.out.println(Arrays.deepToString(jagged)); // [[1, 2], null, null]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Array elements default to 0/false/\\u0000/null even when the array is a local; locals that hold the array reference still must be assigned.",
    },
    {
      id: "q110",
      question: "How do you loop around an array using enhanced for loop?",
      answer:
        "The enhanced for loop (sometimes called the \"for-each\" loop) iterates over arrays and any `Iterable<T>` without exposing the index. The compiler lowers the enhanced-for over an array to a plain `for` loop, and the enhanced-for over a collection to an iterator-based loop.\n\n**Syntax:** `for (Type element : arrayOrIterable) { ... }`. The loop variable is **block-scoped**: a new binding per iteration. Iterating does not require the array length to be known in advance, which removes a class of off-by-one bugs.\n\n**Restrictions:**\n\n- You cannot use the enhanced-for when you need the current index — you would need a regular `for (int i = 0; i < arr.length; i++)`.\n- You cannot assign to the loop variable in a way that mutates the array. `for (int x : arr) x = 0;` does nothing to `arr`, because `x` is a copy of the value.\n- Modifying the underlying collection during iteration is illegal in most cases — `ArrayList` will throw `ConcurrentModificationException`; an array is fine because it has no structural-modification tracking.\n\n**When to prefer it**: read-only traversal of arrays, collections or streams. When you need index-aware access, remove elements, or iterate two collections in parallel, fall back to a plain indexed loop or a `ListIterator`.",
      code: `import java.util.List;

public class EnhancedFor {
    public static void main(String[] args) {
        String[] fruits = { \"apple\", \"banana\", \"cherry\" };
        for (String f : fruits) {
            System.out.print(f + \" \");   // apple banana cherry
        }
        System.out.println();

        List<Integer> nums = List.of(10, 20, 30);
        for (Integer n : nums) {
            System.out.print(n + \" \");   // 10 20 30
        }
        System.out.println();

        // for (int x : nums) x = 0;       // does NOT modify the list
    }
}`,
      codeLanguage: "java",
      explanation:
        "Enhanced for hides the index/iterator; great for read-only traversal, no good when you need index, removal, or parallel iteration.",
    },
    {
      id: "q111",
      question: "How do you print the content of an array?",
      answer:
        "You cannot use `System.out.println(array)` and expect a useful result — `Object.toString` on an array returns something like `[I@1b6d3586`, which is the type code (`[I` = int array) plus a hex hash. Use a real helper instead.\n\n**For one-dimensional arrays:**\n\n- `Arrays.toString(int[])` → `[1, 2, 3]`.\n- `Arrays.toString(Object[])` → `[a, b, c]`.\n- The helper prints each element with the element's own `toString`. Elements that are themselves arrays are rendered via the element's `toString` (which is the unhelpful hex form).\n\n**For nested arrays:**\n\n- `Arrays.deepToString(Object[])` → `[[1, 2], [3, 4]]`. It recurses into nested arrays and uses `Objects.toString` on the leaves.\n\n**For primitives wrapped in `List`:** `List.of(1,2,3).toString()` already prints `[1, 2, 3]` because the wrapper's `toString` is reasonable.\n\n**For custom objects:** `Arrays.toString(arrayOfObjects)` will print each element using its `toString`, so a class without an overridden `toString` will still show the unhelpful default. Override `toString` in your own types if you want readable output.\n\n**For debugging large arrays:** use `Arrays.stream(arr).forEach(System.out::println)` or `Arrays.asList(arr).forEach(...)` to print one element per line.",
      code: `import java.util.Arrays;

public class ArrayPrinting {
    public static void main(String[] args) {
        int[]     one   = { 1, 2, 3 };
        int[][]    two   = { {1,2}, {3,4} };
        String[]  strs  = { \"a\", \"b\" };

        System.out.println(one);                   // [I@1b6d3586 (not useful)
        System.out.println(Arrays.toString(one));  // [1, 2, 3]
        System.out.println(Arrays.toString(strs)); // [a, b]
        System.out.println(Arrays.deepToString(two)); // [[1, 2], [3, 4]]

        // Print each element on its own line for large arrays.
        Arrays.stream(one).forEach(System.out::println);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use Arrays.toString for 1-D and Arrays.deepToString for nested arrays; Object.toString on arrays is intentionally useless.",
    },
    {
      id: "q112",
      question: "How do you compare two arrays?",
      answer:
        "Reference equality (`==`) and the default `array.equals` both compare array identities, not contents. Two different arrays with the same elements compare unequal under both, which is rarely what you want.\n\n**For one-dimensional arrays:**\n\n- `Arrays.equals(a, b)` for primitives — element-by-element comparison with `==` for primitives and `equals` for objects.\n- `Arrays.equals(Object[] a, Object[] b)` — element-by-element using `equals`. Each element's `equals` is called, so you need to have implemented it correctly on the element type.\n\n**For nested arrays:**\n\n- `Arrays.deepEquals(Object[] a, Object[] b)` — recurses into nested arrays. Use this for `int[][]`, `String[][]`, etc.\n\n**Watch out for:**\n\n- `Arrays.equals(int[], long[])` is a compile error because the component types differ. The arrays must have the same element type.\n- Comparing arrays of `double` with `==` would compare object references; `Arrays.equals(double[], double[])` handles NaN correctly.\n- If the elements are themselves objects that contain nested state, you need `Arrays.deepEquals` plus correctly written `equals` on the element class.\n\n**Lists vs arrays:** `List.equals(otherList)` already does element-by-element comparison using `equals`, which is why converting to a `List` is sometimes the easiest path (`Arrays.asList(arr).equals(Arrays.asList(other))`).",
      code: `import java.util.Arrays;

public class ArrayCompare {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = {1, 2, 3};
        int[][] g = { {1,2}, {3,4} };
        int[][] h = { {1,2}, {3,4} };

        System.out.println(a == b);                   // false -- references
        System.out.println(a.equals(b));              // false -- array.equals = reference
        System.out.println(Arrays.equals(a, b));      // true
        System.out.println(Arrays.deepEquals(g, h));  // true
        System.out.println(Arrays.equals(g, h));      // false -- shallow compare on inner arrays
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use Arrays.equals for 1-D and Arrays.deepEquals for nested; == and array.equals compare references only.",
    },
    {
      id: "q113",
      question: "What is an enum?",
      answer:
        "An `enum` is a special kind of class that represents a fixed set of named constants. Enums in Java are type-safe — you cannot accidentally pass a `Day.MONDAY` where a `Day` was expected, but the compiler will catch it. Each constant is an instance of the enum type, declared as `public static final`.\n\n**What enums can do:**\n\n- **Carry state**: enums can have fields and constructors. `enum Planet { MERCURY(3.30e23, 2.44e6), ... }` is a classic example.\n- **Have methods**: each enum constant can override abstract methods, giving you constant-specific behaviour (`enum Operation { PLUS { double apply(double a, double b) { return a + b; } } ... }`).\n- **Implement interfaces**: enums can implement one or more interfaces, which is how you add new behaviour to an enum without subclassing.\n\n**Useful built-ins:**\n\n- `values()` returns a new array of all constants in declaration order.\n- `valueOf(name)` throws `IllegalArgumentException` if the name is unknown — never return a null on bad input.\n- `name()` returns the declared name; `toString` defaults to the same but is overridable.\n- `ordinal()` returns the position; do not persist it, because reordering changes the value.\n\n**Comparison with int constants**: enums are far safer than `public static final int STATUS_OK = 0;`. They cannot be combined with `==` against an unrelated integer and they survive debugger inspection well.",
      code: `public enum Operation {
    PLUS  { public double apply(double a, double b) { return a + b; } },
    MINUS { public double apply(double a, double b) { return a - b; } },
    TIMES { public double apply(double a, double b) { return a * b; } },
    DIV   { public double apply(double a, double b) { return a / b; } };

    public abstract double apply(double a, double b);

    public static void main(String[] args) {
        Operation op = Operation.valueOf(\"TIMES\");
        System.out.println(op.apply(3, 4));     // 12.0
        for (Operation o : Operation.values()) {
            System.out.println(o + \" => \" + o.apply(10, 5));
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "enum = type-safe constant set with state, methods and per-constant bodies; use values()/valueOf()/name() but never persist ordinal.",
    },
    {
      id: "q114",
      question: "Can you use a switch statement around an enum?",
      answer:
        "Yes — you can switch on an enum since Java 5. Each `case` label uses the unqualified constant name (not `MyEnum.VALUE`), and the compiler checks that the value can only be one of the declared constants, so an exhaustive switch is usually a compile-time fact.\n\n**Why switch on an enum is nicer than a chain of if/else:**\n\n- No accidental `==` against the wrong constant.\n- No string typos.\n- The compiler can warn about missing cases (with `-Xlint:switch`).\n- The constant set is closed, so the IDE and tools can help with completion.\n\n**Null selector**: switching on a null enum throws NullPointerException. Check for null first if the input is untrusted.\n\n**Default arm**: adding `default` is optional. If the switch is exhaustive, you can omit it; if you want to handle unexpected values gracefully (e.g. for forward compatibility), include it.\n\n**Java 14+ arrow form**: switch expressions (`case X -> result`) and statement arms reduce fall-through surprises and let you return a value. Enums are one of the most common places to use the new switch syntax.\n\n**Common pitfall**: forgetting the `default` arm and then adding a new enum constant later. Code that handles every case via the switch is fragile against enum evolution; consider polymorphism or `EnumSet` membership checks instead.",
      code: `public enum Season { SPRING, SUMMER, AUTUMN, WINTER }

class SwitchEnum {
    static String mood(Season s) {
        return switch (s) {
            case SPRING -> \"growth\";
            case SUMMER -> \"energy\";
            case AUTUMN -> \"reflection\";
            case WINTER -> \"rest\";
        };
    }

    public static void main(String[] args) {
        System.out.println(mood(Season.AUTUMN)); // reflection
        // Mood for a null throws NPE; defensive check:
        System.out.println(mood(Season.SUMMER));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Switch on enums is supported since Java 5; use unqualified names and consider arrow form for exhaustive, fall-through-free dispatch.",
    },
    {
      id: "q115",
      question: "What are variable arguments or varargs?",
      answer:
        "Varargs let a method accept zero or more arguments of a specified type. The compiler turns the varargs parameter into an array, so the method body sees a regular array. The caller can pass individual values, an existing array, or nothing at all.\n\n**Syntax:** `returnType method(Type... name)`. The `...` is the varargs indicator. `Type... name` is exactly equivalent to `Type[] name` inside the method body.\n\n**Rules:**\n\n- Varargs must be the **last** parameter in the signature.\n- There can be only **one** varargs parameter per method.\n- Overloading with varargs can create ambiguity — calling `foo(1)` could match both `foo(int)` and `foo(int...)`. The non-varargs overload wins, but `foo()` with no arguments matches only the varargs overload.\n\n**Common idioms:**\n\n- `String.format(String fmt, Object... args)` — printf-style formatting.\n- `Arrays.asList(T... a)` — convenient list construction.\n- `Path.of(String first, String... more)` — flexible path construction.\n- `ExecutorService.invokeAll(Collection<? extends Callable<T>> tasks)` — wait, that one isn't varargs, but it shows the pattern of \"array of things\".\n\n**Performance note**: every varargs call allocates a new array. In tight loops, prefer an explicit array overload.",
      code: `public class VarargsDemo {
    static int sum(int... nums) {
        int total = 0;
        for (int n : nums) total += n;
        return total;
    }

    static String join(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(sep);
            sb.append(parts[i]);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(sum());               // 0
        System.out.println(sum(1, 2, 3, 4));    // 10
        System.out.println(join(\", \", \"a\", \"b\", \"c\")); // a, b, c
        System.out.println(join(\"-\", new String[]{\"x\", \"y\"})); // x-y
    }
}`,
      codeLanguage: "java",
      explanation:
        "Varargs = sugar for an array parameter; must be last, only one per method, allocates a new array per call.",
    },
    {
      id: "q116",
      question: "What are asserts used for?",
      answer:
        "`assert` is a keyword that lets you check a programmer assumption at run time. If the boolean expression after `assert` evaluates to `false`, the JVM throws an `AssertionError` and (unless assertions are disabled) prints the source location. If the expression is `true`, execution continues with no overhead beyond the check itself.\n\n**Two forms:**\n\n- `assert condition;`\n- `assert condition : message;` — the message is computed lazily and passed to `AssertionError`, which makes the failure self-explanatory.\n\n**Why use them**:\n\n- **Document invariants** that the rest of the code relies on.\n- **Catch programmer bugs early** — they are louder than silent corruption and faster than a customer finding it.\n- **Replace hand-written guard code** in tests and during development.\n\n**Key runtime fact**: assertions are **disabled by default** at run time. To enable them, pass `-ea` (or `-enableassertions`) to the JVM. To disable in a specific package, pass `-da:com.foo.bar`.\n\n**Two failure modes that surprise people**:\n\n- The expression after `assert` is not evaluated when assertions are off — never put side effects there.\n- A common anti-pattern is `assert methodThatLogs(x);` thinking the logging will run; it will not when assertions are disabled.",
      code: `public class AssertDemo {
    public static double sqrt(double x) {
        assert x >= 0 : \"sqrt of negative number: \" + x;
        return Math.sqrt(x);
    }

    public static void main(String[] args) {
        System.out.println(sqrt(9));   // 3.0
        // With assertions enabled (-ea), sqrt(-1) throws AssertionError
        // System.out.println(sqrt(-1));
    }
}`,
      codeLanguage: "java",
      explanation:
        "assert documents programmer assumptions; disabled by default; never put side effects inside the assert expression.",
    },
    {
      id: "q117",
      question: "When should asserts be used?",
      answer:
        "Use asserts for conditions you believe are **always true** in correct code — internal invariants, preconditions on private methods, postconditions after a complex calculation, and loop invariants. They are designed for **programmer errors**, not for validating user input or any condition that could legitimately happen at run time.\n\n**Good candidates for assert:**\n\n- A method's internal precondition (`assert index >= 0;` after you've already checked it).\n- A postcondition that should hold after a calculation (`assert result >= 0;`).\n- An invariant inside a loop body.\n- A switch exhaustiveness check in private code.\n- A check in test code where the test should fail loudly on a bad assumption.\n\n**Bad candidates — use exceptions instead:**\n\n- Validating user input (use `IllegalArgumentException`).\n- Validating data from a file or network (use specific exceptions, log the error).\n- Anything that could happen in production with real users (because assertions may be off).\n\n**Why assertions are off by default**: production code should not pay the cost of checks that should never fire. If you find yourself wanting asserts on in production, that is a signal you should be using a real exception and logging.\n\n**Naming pattern**: when asserts are part of the contract, document them. When in doubt, prefer `Objects.requireNonNull(x)` or `Preconditions.checkArgument(...)` from Guava — these are not stripped and they are exception-throwing, not assert-style.",
      code: `import java.util.Objects;

public class Preconditions {
    // Public API: validate, throw IllegalArgumentException -- never assert.
    public static double sqrt(double x) {
        if (x < 0) throw new IllegalArgumentException(\"x must be >= 0: \" + x);
        return Math.sqrt(x);
    }

    // Private helper: assert an internal invariant.
    private static double[] sorted(double[] in) {
        double[] out = in.clone();
        java.util.Arrays.sort(out);
        // After sort, every neighbour should be in order.
        for (int i = 1; i < out.length; i++) {
            assert out[i - 1] <= out[i] : \"sort broke at \" + i;
        }
        return out;
    }

    public static void main(String[] args) {
        System.out.println(sqrt(2));
        System.out.println(java.util.Arrays.toString(sorted(new double[]{3, 1, 2})));
        Objects.requireNonNull(\"value\"); // non-strippable null check
    }
}`,
      codeLanguage: "java",
      explanation:
        "assert = programmer assumptions / internal invariants; use exceptions for input validation and anything that could fail in production.",
    },
    {
      id: "q118",
      question: "What is garbage collection?",
      answer:
        "Garbage collection is the JVM's automatic memory management. The runtime tracks every object reference and reclaims the memory of objects that can no longer be reached from any live thread — meaning no chain of references leads from a root (local variable on a stack, active thread, JNI reference, or static field) to that object.\n\n**Why the JVM does it for you:**\n\n- **Safety**: removes the entire class of bugs caused by `free()`-ing an object twice or too early.\n- **Duct-tape-freedom**: developers do not have to wire up reference counting or use-after-free workarounds.\n- **Heap compaction**: collectors move live objects together, eliminating fragmentation.\n\n**Modern collectors are generational.** Most objects die young, so the heap is divided into:\n\n- **Young generation**: most allocations happen here. Divided into Eden and two survivor spaces. Minor collections are fast and frequent.\n- **Old generation**: long-lived objects are promoted here. Major collections (full GC) are slower and rarer.\n\n**Common collectors:**\n\n- **G1** is the default since Java 9; it splits the heap into regions and collects them in parallel with mostly-concurrent evacuation.\n- **ZGC** and **Shenandoah** are low-pause collectors targeting sub-millisecond pauses on multi-terabyte heaps.\n\n**What GC cannot do**: it does not fix memory leaks. A static `List<Object>` that keeps growing will keep the heap growing until OOM, even though every element is \"reachable\". GC frees only what is *unreachable*.",
      code: `public class GcDemo {
    public static void main(String[] args) {
        for (int i = 0; i < 100_000; i++) {
            // Each iteration: the previous 'tmp' is unreachable
            String tmp = \"x\" + i;   // eligible for GC right after this line
        }
        // Suggestion only -- JVM may ignore it.
        System.gc();
        System.out.println(\"done\");
    }
}`,
      codeLanguage: "java",
      explanation:
        "GC reclaims unreachable objects automatically, divides heap into generations, but cannot fix leaks caused by lingering references.",
    },
    {
      id: "q119",
      question: "Can you explain garbage collection with an example?",
      answer:
        "Imagine you build a tree of objects: a root `Customer`, with a `Wallet`, which contains a list of `Coin` objects. As the program runs, the root is reachable from a local variable, so the entire tree is live. When the local variable goes out of scope, the entire tree becomes unreachable and the next GC cycle reclaims it.\n\n**The reachability argument in detail:**\n\n- **Strong references**: the ordinary `Customer c = new Customer();` style. The object stays alive as long as the reference is reachable from a GC root.\n- **Soft references**: cleared before OOM, useful for memory-sensitive caches.\n- **Weak references**: cleared on the next GC, useful for canonical maps.\n- **Phantom references**: enqueue after finalisation, useful for cleanup work that needs to know when an object is fully gone.\n\n**When does the JVM collect?**:\n\n- When an allocation request cannot be satisfied by the current heap.\n- When the JVM decides a collection is worthwhile based on internal heuristics.\n- `System.gc()` is only a hint. HotSpot logs a warning if it actually runs, and modern JVMs often ignore the hint entirely.\n\n**Watching it happen:** `-verbose:gc` prints collection events. `-Xlog:gc*` is the modern equivalent. Use `-XX:+PrintGCDetails` only when debugging, because it adds noticeable overhead.",
      code: `import java.lang.ref.WeakReference;
import java.util.WeakHashMap;

public class GcExample {
    public static void main(String[] args) throws InterruptedException {
        Object strong = new Object();
        WeakReference<Object> weak = new WeakReference<>(strong);
        System.out.println(\"before null: \" + weak.get());

        strong = null;       // the strong reference is gone
        System.gc();         // request a GC; not guaranteed to run
        Thread.sleep(50);

        System.out.println(\"after  null: \" + weak.get()); // likely null
        // Strong reference would survive every GC; weak one does not.
        WeakHashMap<Object, String> map = new WeakHashMap<>();
        map.put(new Object(), \"ephemeral\");
        System.gc();
        System.out.println(\"weak map size: \" + map.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Strong refs survive every GC; weak refs are cleared on the next collection; System.gc() is only a hint.",
    },
    {
      id: "q120",
      question: "When is garbage collection run?",
      answer:
        "The JVM runs a collection when it needs to — specifically, when an allocation request cannot be satisfied by the current free space, or when internal heuristics decide a collection is worthwhile. There is no public timer, and you cannot predict the exact moment.\n\n**Triggers for a GC cycle:**\n\n- **Allocation pressure**: `new Object()` triggers a young-gen collection if Eden is full.\n- **Promotion pressure**: full GC may fire if the old generation fills up.\n- **System.gc()**: a hint that the JVM may honour or ignore. HotSpot prints \"Full GC (System.gc())\" in the GC log when it does.\n- **JNI / external allocation**: the JVM may also run a collection if native memory is tight.\n\n**How to influence it (carefully):**\n\n- Tune the collector (`-XX:+UseG1GC`, `-XX:+UseZGC`).\n- Tune the heap (`-Xms`, `-Xmx`, `-XX:MaxNewSize`).\n- Reduce allocation rate, especially short-lived objects inside hot loops.\n- Use `-Xlog:gc*` to actually see what the JVM is doing.\n\n**What you should not do:**\n\n- Call `System.gc()` as a \"fix\" for memory pressure. It is a hint, not a command, and over-using it can hurt throughput.\n- Finalise everything explicitly hoping to free memory faster. `finalize` is deprecated and unreliable.\n- Tune the collector based on a single micro-benchmark without measuring real workload.\n\n**In tests**: to make a test deterministic, do not rely on GC timing. Use `Reference.reachabilityFence(obj)` or hold a strong reference until the assertion is done.",
      code: `import java.util.ArrayList;
import java.util.List;

public class GcTriggers {
    public static void main(String[] args) throws InterruptedException {
        // 1. Pressure-based trigger.
        List<byte[]> sink = new ArrayList<>();
        for (int i = 0; i < 1_000; i++) sink.add(new byte[1024 * 1024]);
        sink.clear();

        // 2. Hint-based trigger (may be ignored by modern JVMs).
        System.gc();
        Thread.sleep(100);

        // 3. JVM ergonomics may pick a collector and run automatically.
        long total = Runtime.getRuntime().totalMemory();
        long free  = Runtime.getRuntime().freeMemory();
        System.out.println(\"used=\" + (total - free));
    }
}`,
      codeLanguage: "java",
      explanation:
        "GC runs when allocation pressure or heuristics demand it; System.gc() is a hint only and modern collectors ignore it often.",
    },
    {
      id: "q121",
      question: "What are best practices on garbage collection?",
      answer:
        "Most Java code never needs to think about GC because the defaults are excellent. But when allocation pressure becomes visible — in a hot loop, a large request/response cycle, or a long-running stream — the following practices matter.\n\n**Reduce allocation in hot paths:**\n\n- Reuse buffers where you can.\n- Prefer primitives over boxed wrappers; avoid `Integer`, `Long` and `String` concatenation in tight loops.\n- Use `StringBuilder` rather than `+` for repeated concatenation.\n- Avoid creating `Iterator` instances where a plain index would do.\n\n**Avoid accidental retention:**\n\n- Keep references scoped to the smallest possible block.\n- Use weak references for caches (`WeakHashMap`, `WeakReference`).\n- Be careful with `ThreadLocal` — thread pools reuse threads, and old values can leak.\n- Watch out for listeners and callbacks that get registered and never removed.\n\n**Tune, don't tweak blindly:**\n\n- Measure first. `-Xlog:gc*` is the cheapest diagnostic.\n- Set `-Xms == -Xmx` for stable latency (otherwise the heap resizes at run time).\n- Pick a collector based on the workload: G1 is general-purpose, ZGC and Shenandoah are low-pause, ParallelGC is throughput-oriented.\n- Avoid finalizers, cleaners that need fast reclamation, and `System.gc()` as a memory relief.\n\n**Profile rather than guess:**\n\n- Use a profiler (VisualVM, async-profiler, JFR) to find allocation hotspots. The cost is usually not in the objects you can see but in ones you do not notice — `Map.entrySet()` iterators, autoboxed loops, exception stack traces.",
      code: `import java.util.ArrayList;
import java.util.List;

public class GcBestPractices {
    // Bad: allocates an Integer every iteration.
    static long sumAutoboxed(List<Integer> xs) {
        long total = 0;
        for (Integer x : xs) total += x;
        return total;
    }

    // Better: stays in primitive land, fewer allocations.
    static long sumPrimitive(int[] xs) {
        long total = 0;
        for (int x : xs) total += x;
        return total;
    }

    public static void main(String[] args) {
        List<Integer> boxed = new ArrayList<>();
        int[] primitive = new int[100_000];
        for (int i = 0; i < 100_000; i++) { boxed.add(i); primitive[i] = i; }

        long t0 = System.nanoTime(); sumAutoboxed(boxed);       long autoboxed = System.nanoTime() - t0;
        t0 = System.nanoTime();       sumPrimitive(primitive); long prim      = System.nanoTime() - t0;

        System.out.println(\"autoboxed ns=\" + autoboxed + \" primitive ns=\" + prim);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Reduce allocation in hot paths, scope references tightly, prefer primitives over boxed wrappers, tune only after measuring.",
    },
  ],
  meta: {
    q109: { difficulty: "easy", priority: "high", tags: ["arrays", "defaults"], relatedQuestionIds: ["q110", "q111"], estimatedReadMinutes: 2 },
    q110: { difficulty: "easy", priority: "high", tags: ["arrays", "loop"], relatedQuestionIds: ["q111", "q087"], estimatedReadMinutes: 2 },
    q111: { difficulty: "easy", priority: "high", tags: ["arrays", "printing"], relatedQuestionIds: ["q112", "q166"], estimatedReadMinutes: 2 },
    q112: { difficulty: "easy", priority: "high", tags: ["arrays", "comparison"], relatedQuestionIds: ["q111", "q029"], estimatedReadMinutes: 2 },
    q113: { difficulty: "medium", priority: "very-high", tags: ["enum", "type-safety"], relatedQuestionIds: ["q114", "q023"], estimatedReadMinutes: 3 },
    q114: { difficulty: "easy", priority: "high", tags: ["enum", "switch"], relatedQuestionIds: ["q113", "q082"], estimatedReadMinutes: 2 },
    q115: { difficulty: "easy", priority: "high", tags: ["varargs", "methods"], relatedQuestionIds: ["q184", "q217"], estimatedReadMinutes: 2 },
    q116: { difficulty: "medium", priority: "medium", tags: ["assert", "jvm"], relatedQuestionIds: ["q117", "q108"], estimatedReadMinutes: 3 },
    q117: { difficulty: "medium", priority: "medium", tags: ["assert", "best-practices"], relatedQuestionIds: ["q116", "q108"], estimatedReadMinutes: 3 },
    q118: { difficulty: "medium", priority: "very-high", tags: ["gc", "memory"], relatedQuestionIds: ["q119", "q120"], estimatedReadMinutes: 3 },
    q119: { difficulty: "medium", priority: "high", tags: ["gc", "reachability"], relatedQuestionIds: ["q118", "q120"], estimatedReadMinutes: 3 },
    q120: { difficulty: "medium", priority: "high", tags: ["gc", "triggers"], relatedQuestionIds: ["q118", "q121"], estimatedReadMinutes: 3 },
    q121: { difficulty: "medium", priority: "high", tags: ["gc", "best-practices"], relatedQuestionIds: ["q118", "q120"], estimatedReadMinutes: 3 },
  },
});