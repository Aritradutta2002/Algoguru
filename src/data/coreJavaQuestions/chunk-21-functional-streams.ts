import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Functional Programming: lambda expressions and Streams - global questions 208-221.
 * Includes the user-listed unnumbered "what are intermediate operations in streams?"
 * item, assigned global id q212.
 */
export const chunk21FunctionalStreams = defineChunk({
  topic: "functional-streams",
  questions: [
    {
      id: "q208",
      question: "What is functional programming?",
      answer:
        "Functional programming is a style where computation is the composition of **pure functions** — functions whose output depends only on their inputs and which have no observable side effects. Java supports functional programming as an addition to its imperative and object-oriented roots, primarily through lambda expressions, method references, the Stream API and the functional interfaces in `java.util.function`.\n\n**Core ideas:**\n\n- **First-class functions**: lambda expressions let you pass behaviour around as values. A `Predicate<T>` or `Function<T,R>` is a value just like an `int`.\n- **Immutability**: prefer `record`, `List.of`, `Map.of` and other immutable structures so transformations create new collections rather than mutating existing ones.\n- **Declarative pipelines**: rather than writing `for` loops with mutable accumulators, build a pipeline of `filter`/`map`/`collect` steps.\n- **Lazy evaluation**: streams are lazy; the pipeline does no work until a terminal operation runs.\n- **Parallelism by default**: `parallelStream()` gives you a free concurrency upgrade for embarrassingly parallel problems.\n\n**Functional vs object-oriented**: they are not in opposition. Lambdas fit naturally inside OOP code (you pass a lambda to a method that accepts a `Runnable`), and classes are still how you model state.\n\n**Why functional programming helps in interviews**: it is the default style for modern Java code (Streams, Optional, `CompletableFuture`), and questions on it are everywhere.",
      code: `import java.util.List;

public class FunctionalIntro {
    public static void main(String[] args) {
        // Immutability: build a List.of instead of an ArrayList.
        List<String> names = List.of(\"Ada\", \"Grace\", \"Hedy\");

        // Declarative pipeline: filter + map + collect, no mutable accumulator.
        long vowel = names.stream()
                         .filter(n -> !n.isBlank())
                         .mapToInt(String::length)             // method reference
                         .sum();

        // Parallelism with one method call.
        long parallel = names.parallelStream().mapToInt(String::length).sum();

        System.out.println(\"vowel-aware total length: \" + vowel + \" (parallel=\" + parallel + \")\");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Functional programming = pure functions, immutability, declarative pipelines; Java supports it via lambdas, Streams and java.util.function.",
    },
    {
      id: "q209",
      question: "Can you give an example of functional programming?",
      answer:
        "A canonical example is processing a list of transactions: filter to completed orders, convert each amount to a domain object, sum the totals. The imperative version uses a `for` loop and a mutable accumulator; the functional version is a Stream pipeline.\n\n**Imperative version:**\n\n```\ndouble total = 0;\nfor (Order o : orders) {\n    if (o.status == Status.COMPLETED) {\n        total += o.amount;\n    }\n}\n```\n\n**Functional version:**\n\n```\ndouble total = orders.stream()\n                     .filter(o -> o.status == Status.COMPLETED)\n                     .mapToDouble(Order::amount)\n                     .sum();\n```\n\n**Why this is more than syntactic sugar**:\n\n- The intent is explicit: filter, transform, reduce.\n- The pipeline is reusable: changing `sum()` to `average()` is one method.\n- `parallelStream()` adds parallelism without rewriting the logic.\n- The intermediate state (the filtered collection) never exists; the JVM fuses steps and can short-circuit.\n\n**Functional-friendly Java idioms**:\n\n- Use `record` for value carriers.\n- Use `Optional` for may-be-present values.\n- Use `Comparator.comparing` chains for sort orders.\n- Use `Map.copyOf` / `List.copyOf` to enforce immutability at the boundary.",
      code: `import java.util.*;
import java.util.stream.*;

record Order(String id, double amount, Status status) {}
enum Status { NEW, COMPLETED, CANCELLED }

public class FunctionalExample {
    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order(\"A1\", 199.99, Status.COMPLETED),\n            new Order(\"A2\",  19.50, Status.NEW),\n            new Order(\"A3\",  49.00, Status.COMPLETED)\n        );

        double total = orders.stream()\n                             .filter(o -> o.status == Status.COMPLETED)\n                             .mapToDouble(Order::amount)\n                             .sum();\n        System.out.println(\"completed total = \" + total);     // 248.99

        Map<Status, Double> byStatus = orders.stream()\n            .collect(Collectors.groupingBy(Order::status,\n                                           Collectors.summingDouble(Order::amount)));\n        System.out.println(byStatus);\n    }
}`,
      codeLanguage: "java",
      explanation:
        "Filter/map/reduce pipeline replaces the imperative for-loop; reusable, parallelisable and intent-revealing.",
    },
    {
      id: "q210",
      question: "What is a stream?",
      answer:
        "A `Stream<T>` is a sequence of elements that supports a pipeline of lazy, possibly-parallel aggregate operations. It is not a data structure; it does not store its data. It is more like a view onto a source (`Collection`, array, generator function, I/O channel) with operations layered on top.\n\n**Key properties of a Stream:**\n\n- **Laziness**: intermediate operations (`filter`, `map`, `sorted`, `limit`) do not run until a terminal operation (`collect`, `forEach`, `reduce`) triggers evaluation.\n- **One-shot**: a stream can only be consumed once. After a terminal operation, the stream is closed; reusing it throws `IllegalStateException`.\n- **Non-mutating**: stream operations do not modify the underlying source. (Except for explicitly mutating collectors, which call back into your code.)\n- **Pipeline fusion**: the JVM can fuse multiple intermediate operations into a single pass over the data.\n- **Short-circuiting**: operations like `findFirst`, `anyMatch`, `limit` can stop early.\n- **Optional parallelism**: `parallel()` switches the pipeline to the common `ForkJoinPool`. Use `sequential()` to go back.\n\n**Sources**: `Collection.stream()`, `Collection.parallelStream()`, `Stream.of(...)`, `Arrays.stream(arr)`, `Stream.iterate(...)`, `Stream.generate(...)`, `Pattern.splitAsStream(...)`, `BufferedReader.lines()`.\n\n**Streams vs collections**: a collection holds data and can be iterated many times; a stream is a pipeline that holds no data and is consumed exactly once. Streams give you lazy evaluation, fusion and easy parallelism; collections give you random access, indexed reads and the ability to be inspected at any point.",
      code: `import java.util.stream.IntStream;
import java.util.stream.Stream;

public class StreamIntro {
    public static void main(String[] args) {
        // Stream from values
        Stream<String> values = Stream.of(\"Ada\", \"Grace\", \"Hedy\");

        // Stream from array
        IntStream numbers = IntStream.of(1, 2, 3, 4, 5);

        // Stream from generator
        Stream<Double> random = Stream.generate(Math::random).limit(3);

        // Lazy: nothing prints until a terminal op runs
        numbers.filter(n -> { System.out.println(\"filter \" + n); return n % 2 == 1; })
               .forEach(n -> System.out.println(\"forEach \" + n));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Stream = lazy, one-shot pipeline of operations over a source; not a data structure; can be sequential or parallel.",
    },
    {
      id: "q211",
      question: "Explain about streams with an example?",
      answer:
        "A worked pipeline: take a list of numbers, keep only the positive ones, square each, sort ascending, take the first three, and print. The same pipeline can be written as a series of named intermediate operations or as one fluent chain.\n\n**Walk-through of each step**:\n\n- `numbers` is the source — a `List<Integer>`.\n- `stream()` returns a sequential `Stream<Integer>` view of it.\n- `filter(n -> n > 0)` keeps positives; lazy.\n- `map(n -> n * n)` squares each value; lazy.\n- `sorted()` orders ascending; lazy but requires buffering the input.\n- `limit(3)` takes the first three; short-circuiting.\n- `forEach(System.out::println)` is the terminal operation; runs the pipeline.\n\n**Pipeline fusion** in action: filter, map, sorted, limit and forEach are fused into a single pass where possible. The JVM may decide not to materialise intermediate collections.\n\n**Parallel switch**: replace `stream()` with `parallelStream()` (or insert `.parallel()`) to run the pipeline on the common ForkJoinPool. For tiny data sets the overhead is bigger than the gain; for large numerical work it can be a free speedup.",
      code: `import java.util.List;

public class StreamExample {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(-3, -1, 2, 4, 1, 5, 0, 7);

        numbers.stream()
               .filter(n -> n > 0)         // keep positive
               .map(n -> n * n)            // square
               .sorted()                   // ascending
               .limit(3)                   // top 3
               .forEach(System.out::println);   // 1 4 16
    }
}`,
      codeLanguage: "java",
      explanation:
        "A pipeline is source -> intermediate ops -> terminal op; lazy until the terminal op fires; switch to parallelStream for free concurrency.",
    },
    {
      id: "q212",
      question: "what are intermediate operations in streams?",
      answer:
        "Intermediate operations transform a `Stream<T>` into another `Stream<R>`. They are lazy: the JVM does no work until a terminal operation triggers evaluation. The most common intermediates are `filter`, `map`, `flatMap`, `distinct`, `sorted`, `peek`, `limit`, `skip`, `mapToInt`/`mapToLong`/`mapToDouble`, and (since Java 9) `takeWhile`/`dropWhile`.\n\n**What \"lazy\" really means**: when you call `stream.filter(...).map(...)`, nothing runs yet. Each intermediate operation returns a new Stream with the new behaviour baked in. The moment you call `collect`, `forEach`, `count` or any terminal operation, the JVM walks back through the pipeline and runs everything in one fused pass.\n\n**Stateful vs stateless**: most intermediates are stateless — each element is processed independently. `sorted`, `distinct` and `limit`/`skip` are stateful: they must look at (or buffer) multiple elements. Statefulness affects parallel performance because the pipeline may need to split and merge.\n\n**Specialised primitives**: `mapToInt`, `mapToLong`, `mapToDouble` avoid boxing by returning `IntStream`, `LongStream` or `DoubleStream`, which then expose numeric reductions like `sum`, `average`, `summaryStatistics`.\n\n**takeWhile / dropWhile (Java 9)**: take elements while the predicate is true (stop on the first false) or drop them while the predicate is true. Useful with ordered streams; with unordered streams the result is implementation-defined.",
      code: `import java.util.stream.IntStream;

public class IntermediateOps {
    public static void main(String[] args) {
        IntStream.rangeClosed(1, 20)
                 .filter(n -> n % 2 == 0)             // even
                 .map(n -> n * n)                     // square
                 .limit(5)                            // short-circuiting
                 .forEach(System.out::println);       // 4 16 36 64 100

        // Java 9 takeWhile
        IntStream.rangeClosed(1, 10)
                 .takeWhile(n -> n < 5)
                 .forEach(System.out::print);         // 1234

        // Stateful: sorted, distinct
        IntStream.of(3, 1, 2, 1, 3).distinct().sorted().forEach(System.out::print); // 123
    }
}`,
      codeLanguage: "java",
      explanation:
        "Intermediate ops are lazy and return a new Stream; filter/map/sorted/limit; mapToInt avoids boxing; takeWhile/dropWhile added in Java 9.",
    },
    {
      id: "q213",
      question: "What are terminal operations in streams?",
      answer:
        "Terminal operations consume the stream and produce a result or a side effect. After a terminal operation runs, the stream is closed and cannot be reused. The most common terminals are `forEach`, `forEachOrdered`, `collect`, `reduce`, `count`, `min`/`max`, `anyMatch`/`allMatch`/`noneMatch`, `findFirst`/`findAny` and `toArray`.\n\n**Two categories**:\n\n- **Value-producing**: `collect` returns a `List`/`Map`/`Set`, `reduce` returns a single value, `count` returns a `long`, `findFirst` returns an `Optional`. These can be used inside expressions.\n- **Side-effecting**: `forEach` runs an action for each element. Parallel pipelines may visit elements in any order — use `forEachOrdered` if order matters, but it costs parallelism.\n\n**Reduction patterns**: `reduce(identity, accumulator)` is the canonical fold. `reduce(BinaryOperator)` without identity returns `Optional<T>`. `collect(supplier, accumulator, combiner)` is the mutable equivalent — used internally by `Collectors.toList()` and friends.\n\n**Matchers** (`anyMatch`/`allMatch`/`noneMatch`): short-circuit; great for predicates over large data sets. `findAny` is faster than `findFirst` on parallel streams because any element will do.\n\n**toArray**: returns `Object[]` by default; pass a generator (`String[]::new`) to get a typed array.",
      code: `import java.util.*;
import java.util.stream.*;

public class TerminalOps {
    public static void main(String[] args) {
        List<Integer> nums = List.of(3, 1, 4, 1, 5, 9, 2, 6);

        // collect
        Set<Integer> unique = nums.stream().collect(Collectors.toSet());

        // reduce
        int sum = nums.stream().reduce(0, Integer::sum);

        // matchers
        boolean anyEven  = nums.stream().anyMatch(n -> n % 2 == 0);
        boolean allPos   = nums.stream().allMatch(n -> n > 0);

        // find
        Optional<Integer> firstBig = nums.stream().filter(n -> n > 100).findFirst();
        System.out.println(firstBig.orElse(-1));

        // side-effect (avoid in parallel)
        nums.stream().forEach(System.out::print);
        System.out.println();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Terminal ops consume the stream and close it; use collect/reduce for values, forEach for side effects, matchers/find for short-circuit queries.",
    },
    {
      id: "q214",
      question: "What are method references?",
      answer:
        "A method reference is a compact lambda that refers to an existing method by name. Where a lambda would just call a method, a method reference is shorter and clearer.\n\n**Four flavours**:\n\n- **`Class::staticMethod`** — `Integer::parseInt` is equivalent to `s -> Integer.parseInt(s)`.\n- **`instance::method`** — `System.out::println` is equivalent to `x -> System.out.println(x)`.\n- **`Class::instanceMethod`** — `String::length` is equivalent to `s -> s.length()`. The first parameter becomes the receiver.\n- **`Class::new`** — `ArrayList::new` is equivalent to `() -> new ArrayList()`. A constructor reference.\n\n**Why they are useful**: they make stream pipelines read like English (`list.stream().map(String::trim).filter(String::isEmpty).count()`).\n\n**Limitations**:\n\n- The signature must match the target functional interface. `String::length` only works as a `Function<String, Integer>` or `ToIntFunction<String>`, not as a `Predicate<String>`.\n- Constructor references need an exact match: `int[]::new` is a `IntFunction<int[]>` and only works with one argument.\n\n**Common interview idiom**: distinguishing `String::length` (instance method on a parameter) from `someString::length` (instance method on a fixed receiver).",
      code: `import java.util.*;
import java.util.function.*;

public class MethodReferences {
    public static void main(String[] args) {
        List<String> words = List.of(\"Ada\", \"Grace\", \"Hedy\");

        // Class::instanceMethod
        words.stream().map(String::toUpperCase).forEach(System.out::println);

        // Class::staticMethod
        Function<String, Integer> parse = Integer::parseInt;
        System.out.println(parse.apply(\"42\"));         // 42

        // instance::method
        var sink = new StringBuilder();
        Consumer<String> append = sink::append;
        words.forEach(append);
        System.out.println(sink);                       // AdaGraceHedy

        // Class::new
        Supplier<List<String>> emptyList = ArrayList::new;
        System.out.println(emptyList.get());            // []
    }
}`,
      codeLanguage: "java",
      explanation:
        "Method references are shorthand for lambdas that just call a method; four flavours: static, instance, parameter-as-receiver, constructor.",
    },
    {
      id: "q215",
      question: "What are lambda expressions?",
      answer:
        "A lambda expression is an anonymous function — a piece of behaviour you can pass around as a value. The compiler binds a lambda to a target type that must be a functional interface (an interface with one abstract method).\n\n**Syntax**: `(parameters) -> { body }` or `(parameters) -> expression`. The simplest lambdas omit the parameter types (`n -> n * 2`); the compiler infers them from the target type.\n\n**Examples**:\n\n- `() -> System.out.println(\"hello\")` — zero-arg lambda, like `Runnable.run`.\n- `(int x, int y) -> x + y` — explicit parameter types.\n- `s -> s.length()` — single-parameter lambda, parens optional.\n- `(a, b) -> { int tmp = a; a = b; b = tmp; return a + b; }` — multi-line body with explicit return.\n\n**Why lambdas matter**: they let you replace anonymous inner classes for functional interfaces with much less ceremony. `Runnable r = () -> System.out.println(\"hi\");` instead of `new Runnable() { public void run() { ... } }`.\n\n**Effectively final capture**: a lambda can refer to a local variable only if it is effectively final — never reassigned after initialisation. Marking the variable `final` is one way to satisfy this; the other is to simply never reassign it.\n\n**Method reference shortcut**: `String::length` is sugar for `s -> s.length()`; see the previous question for the four flavours.",
      code: `import java.util.*;
import java.util.function.*;

public class LambdaDemo {
    public static void main(String[] args) {
        Runnable r = () -> System.out.println(\"hi\");
        r.run();

        // Effectively final capture
        int multiplier = 3;
        IntFunction<Integer> triple = n -> n * multiplier;  // captures multiplier
        System.out.println(triple.apply(7));                  // 21

        // Multi-line body
        BiFunction<Integer, Integer, Integer> gcd = (a, b) -> {
            while (b != 0) { int tmp = b; b = a % b; a = tmp; }
            return a;
        };
        System.out.println(gcd.apply(48, 18));               // 6
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lambdas = anonymous functions assigned to a functional interface; capture must be effectively final; replace anonymous classes for one-method interfaces.",
    },
    {
      id: "q216",
      question: "Can you give an example of lambda expression?",
      answer:
        "A simple sorting example: `List<String> names = List.of(\"Hedy\", \"Ada\", \"Grace\");` and then `names.sort((a, b) -> a.compareTo(b));` — the lambda implements `Comparator<String>.compare`.\n\n**What the compiler does**: looks for the target type. `List.sort` accepts a `Comparator<? super E>`, and `Comparator` is a functional interface (`int compare(T, T)`). The lambda's two `String` parameters match; the body returns `int`. The compiler synthesises a hidden class implementing `Comparator`.\n\n**Even shorter** with a method reference: `names.sort(String::compareTo)`.\n\n**Lambdas with checked exceptions**: if the body throws a checked exception, the target interface must declare it. Otherwise the compiler complains. For example, `BiFunction<Integer, Integer, Integer>` cannot throw `IOException` because `apply` does not declare it.\n\n**Common gotchas**:\n\n- **Name conflicts**: lambda parameters cannot shadow local variables in the enclosing scope (`(x -> x + x)` where `x` already exists outside is illegal).\n- **Type inference quirks**: a lambda's target type is determined by context. The same lambda text can be a `Comparator<String>`, a `BiFunction<String,String,Integer>` or a `ToIntBiFunction<String,String>` depending on what the surrounding code expects.\n- **`this` inside a lambda**: refers to the enclosing object, not the lambda itself.",
      code: `import java.util.*;

public class LambdaExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of(\"Hedy\", \"Ada\", \"Grace\"));

        // Lambda implementing Comparator<String>
        names.sort((a, b) -> a.compareTo(b));
        System.out.println(names);                  // [Ada, Grace, Hedy]

        // Equivalent method reference
        List<String> copy = new ArrayList<>(names);
        copy.sort(String::compareTo);

        // Filter and map with lambdas
        long longNames = names.stream()
                              .filter(s -> s.length() > 3)\n                              .count();\n        System.out.println(\"long names: \" + longNames);    // 2
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lambdas compile to a hidden class implementing the target functional interface; show the type, the body and the inference in one worked example.",
    },
    {
      id: "q217",
      question: "Can you explain the relationship between lambda expression and functional interfaces?",
      answer:
        "A lambda expression can only appear where the target type is a **functional interface** — an interface with exactly one abstract method (after counting inherited methods, and excluding `Object` methods and `default`/`static` methods). The compiler synthesises an instance of the interface for the lambda.\n\n**The functional interface rule**:\n\n- One abstract method (SAM type — single abstract method).\n- Any number of `default` or `static` methods is fine.\n- Inherited abstract methods from `Object` (like `toString`) do not count.\n- The annotation `@FunctionalInterface` is optional but recommended; it makes the compiler reject accidental non-SAM interfaces.\n\n**Built-in functional interfaces** in `java.util.function`:\n\n- `Function<T,R>` — `R apply(T)`.\n- `BiFunction<T,U,R>` — `R apply(T,U)`.\n- `Predicate<T>` — `boolean test(T)`.\n- `BiPredicate<T,U>` — `boolean test(T,U)`.\n- `Consumer<T>` — `void accept(T)`.\n- `BiConsumer<T,U>` — `void accept(T,U)`.\n- `Supplier<T>` — `T get()`.\n- `UnaryOperator<T>` — `T apply(T)`.\n- `BinaryOperator<T>` — `T apply(T,T)`.\n\n**Primitive specialisations**: `IntFunction`, `LongFunction`, `DoubleFunction`, `ToIntFunction`, `IntPredicate`, `IntConsumer`, `IntSupplier`, `ObjIntConsumer<T>` and many more — designed to avoid boxing in hot paths.\n\n**Pre-existing SAMs**: `Runnable`, `Callable<V>`, `Comparator<T>`, `ActionListener`, `FileFilter` are all functional interfaces predating Java 8 and now accept lambdas naturally.",
      code: `import java.util.function.*;
import java.util.concurrent.Callable;

public class FunctionalInterfaces {
    public static void main(String[] args) throws Exception {
        Predicate<Integer> isEven  = n -> n % 2 == 0;\n        Function<String, Integer> length = String::length;\n        Consumer<String>  print  = System.out::println;\n        Supplier<Long>   now    = System::currentTimeMillis;\n        BinaryOperator<Integer> add = Integer::sum;

        System.out.println(isEven.test(4));      // true
        System.out.println(length.apply(\"Ada\")); // 3
        print.accept(\"hello\");\n        System.out.println(\"now=\" + now.get());\n        System.out.println(add.apply(2, 3));     // 5

        // Existing SAM interfaces also accept lambdas\n        Runnable r = () -> System.out.println(\"tick\");\n        Callable<Integer> c = () -> 42;\n        r.run();\n        System.out.println(c.call());            // 42
    }
}`,

      codeLanguage: "java",
      explanation:
        "Lambdas need a target type that is a SAM interface; java.util.function covers the standard shapes; many pre-existing SAMs accept lambdas too.",
    },
    {
      id: "q218",
      question: "What is a predicate?",
      answer:
        "`Predicate<T>` is the standard functional interface for a boolean-valued function of one argument: `boolean test(T t)`. The companion `BiPredicate<T,U>` takes two arguments.\n\n**Common uses**:\n\n- **Filtering** streams: `stream.filter(s -> s.startsWith(\"A\"))`.\n- **Validating** inputs: `Person::isAdult` can be passed wherever a `Predicate<Person>` is expected.\n- **Composing**: `Predicate.and(...)`, `Predicate.or(...)`, `Predicate.negate()` chain predicates without writing nested lambdas.\n\n**Default methods**:\n\n- `and(Predicate)` — short-circuits; returns a predicate that is true only if both are true.\n- `or(Predicate)` — short-circuits; returns a predicate that is true if either is true.\n- `negate()` — returns the logical negation.\n- `isEqual(Object)` (static) — a predicate that tests for `Objects.equals(obj, other)`.\n- `not(Predicate)` (static, Java 11) — negation without `negate()`.\n\n**Primitive specialisations**: `IntPredicate`, `LongPredicate`, `DoublePredicate` avoid boxing for primitive inputs.\n\n**Where Predicate shines**: stream filters, validation pipelines, configuration as data, and any place where you want to pass a yes/no test as a value.",
      code: `import java.util.List;\nimport java.util.Objects;\nimport java.util.function.Predicate;\n\npublic class PredicateDemo {
    public static void main(String[] args) {
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPos  = n -> n > 0;

        Predicate<Integer> isPosEven = isPos.and(isEven);
        Predicate<Integer> isOdd     = isEven.negate();

        List<Integer> nums = List.of(-2, -1, 0, 1, 2, 3, 4);
        nums.stream().filter(isPosEven).forEach(System.out::print);   // 24
        System.out.println();
        nums.stream().filter(isOdd).forEach(System.out::print);      // -113

        // isEqual as a predicate
        Predicate<String> isHello = Predicate.isEqual(\"hello\");
        System.out.println(isHello.test(\"hi\"));   // false
        System.out.println(isHello.test(\"hello\")); // true
    }
}`,
      codeLanguage: "java",
      explanation:
        "Predicate = boolean test; chain with and/or/negate; primitive specialisations avoid boxing; use for filtering and validation.",
    },
    {
      id: "q219",
      question: "What is the functional interface - function?",
      answer:
        "`Function<T,R>` is the standard functional interface for a transformation: `R apply(T t)`. It takes one argument and returns a result. The companion `BiFunction<T,U,R>` takes two arguments.\n\n**Default methods for composition**:\n\n- `compose(Function)` — runs the argument function first, then `this`. `f.compose(g)` is `x -> f(g(x))`.\n- `andThen(Function)` — runs `this` first, then the argument. `f.andThen(g)` is `x -> g(f(x))`.\n- `identity()` (static) — returns its input unchanged; useful as a default for generic code.\n\n**Primitive specialisations**: `IntFunction<R>`, `LongFunction<R>`, `DoubleFunction<R>` accept primitive inputs without boxing. `ToIntFunction<T>`, `ToLongFunction<T>`, `ToDoubleFunction<T>` return primitives. `IntToDoubleFunction`, `IntToLongFunction` and similar cover conversions.\n\n**Where Function shines**: map operations on streams (`map`, `flatMap`), key extraction (`Comparator.comparing(Function)`), configuration as data, and any place where you want to convert one value to another.\n\n**What Function does NOT do**: it does not throw checked exceptions. If your transformation may throw, wrap in a `Function<T,R>` that catches and rethrows as `UncheckedIOException`, or use a custom functional interface that declares `throws`.",
      code: `import java.util.List;\nimport java.util.function.Function;\nimport java.util.stream.Collectors;\n\npublic class FunctionDemo {
    public static void main(String[] args) {
        Function<String, Integer> length = String::length;\n        Function<Integer, Integer> doubled = n -> n * 2;\n        Function<String, Integer> doubleLength = length.andThen(doubled);

        System.out.println(doubleLength.apply(\"Ada\"));   // 6

        List<String> words = List.of(\"Ada\", \"Grace\", \"Hedy\");
        List<Integer> sizes = words.stream().map(String::length).collect(Collectors.toList());
        System.out.println(sizes);                          // [3, 5, 4]

        // identity() as a default for generic code
        Function<String, String> id = Function.identity();
        System.out.println(id.apply(\"hi\"));               // hi
    }
}`,
      codeLanguage: "java",
      explanation:
        "Function = T -> R; compose/andThen for chaining; primitive variants avoid boxing; identity() returns input unchanged.",
    },
    {
      id: "q220",
      question: "What is a consumer?",
      answer:
        "`Consumer<T>` is the standard functional interface for an action that takes one argument and returns nothing: `void accept(T t)`. The companion `BiConsumer<T,U>` takes two arguments.\n\n**Common uses**:\n\n- **Stream forEach**: `list.forEach(System.out::println)` — `System.out::println` is a `Consumer<String>`.\n\n**Default method**:\n\n- `andThen(Consumer)` — chains consumers. `c1.andThen(c2)` runs `c1` first, then `c2`. If either throws, the chain stops.\n\n**Primitive specialisations**: `IntConsumer`, `LongConsumer`, `DoubleConsumer` avoid boxing for primitive inputs. `ObjIntConsumer<T>`, `ObjLongConsumer<T>`, `ObjDoubleConsumer<T>` accept a reference plus a primitive (handy for map-reduce style work).\n\n**Where Consumer shines**: stream forEach, Map.forEach, callback registration, building fluent builders, anything that consumes an input and produces a side effect.\n\n**Difference from Function**: a Consumer returns nothing — it is purely side-effecting. A Function returns a value. Use Consumer when you care about the action, Function when you care about the result.\n\n**Anti-pattern**: parallel `forEach` with a Consumer that mutates shared state is a race condition waiting to happen. Use `forEachOrdered` or sequential streams if order or atomicity matters.",
      code: `import java.util.List;\nimport java.util.Map;\nimport java.util.function.Consumer;\nimport java.util.function.ObjIntConsumer;\n\npublic class ConsumerDemo {
    public static void main(String[] args) {
        Consumer<String> print = System.out::println;\n        Consumer<String> greet = s -> System.out.print(\"hello, \" + s + \"! \");\n        Consumer<String> both  = greet.andThen(print);\n        both.accept(\"Ada\");                                 // hello, Ada! Ada

        // Map.forEach takes a BiConsumer
        Map<String, Integer> ages = Map.of(\"Ada\", 37, \"Grace\", 85);\n        ages.forEach((name, age) -> System.out.println(name + \"=\" + age));

        // ObjIntConsumer: one reference plus one primitive
        ObjIntConsumer<String> repeat = (s, n) -> System.out.println(s.repeat(Math.max(0, n)));
        repeat.accept(\"ab\", 3);                              // ababab
    }
}`,
      codeLanguage: "java",
      explanation:
        "Consumer = void accept(T); chains with andThen; primitive specialisations avoid boxing; avoid parallel forEach with shared state.",
    },
    {
      id: "q221",
      question: "Can you give examples of functional interfaces with multiple arguments?",
      answer:
        "Most functional interfaces are unary. When you need two arguments, reach for `BiFunction`, `BiPredicate` or `BiConsumer`. For three or more inputs, the JDK does not provide a built-in — you define your own functional interface, or you curry the call.\n\n**The standard pairs**:\n\n- **`BiFunction<T,U,R>`** — `R apply(T t, U u)`. Useful for map updates (`map.merge(key, value, BiFunction)`), custom reductions, and combining two streams element-wise.\n- **`BiPredicate<T,U>`** — `boolean test(T, U)`. Used in filter chains that need two inputs (rare).\n- **`BiConsumer<T,U>`** — `void accept(T, U)`. Map.forEach uses this; entry processing patterns love it.\n\n**Reference-plus-primitive**:\n\n- `ObjIntConsumer<T>`, `ObjLongConsumer<T>`, `ObjDoubleConsumer<T>` accept one reference plus a primitive. They are the right tool for \"process each element with its index\" patterns.\n\n**For three or more arguments**, you have three options:\n\n- **Define your own** functional interface (`@FunctionalInterface interface TriFunction<A,B,C,R> { R apply(A, B, C); }`).\n- **Curry**: take one argument, return a function that takes the next.\n- **Compose a record**: wrap multiple arguments in a small carrier type.\n\n**`BinaryOperator<T>` and `UnaryOperator<T>`** are special cases of `BiFunction`/`Function` where all types match — handy for `map.replaceAll` and `Stream.reduce`.",
      code: `import java.util.*;\nimport java.util.function.*;

public class MultiArg {
    public static void main(String[] args) {
        // BiFunction: combine two ints via a formula
        BiFunction<Integer, Integer, Integer> add = Integer::sum;\n        System.out.println(add.apply(2, 3));                // 5

        // BiPredicate: a > b
        BiPredicate<Integer, Integer> gt = (a, b) -> a > b;
        System.out.println(gt.test(5, 3));                  // true

        // BiConsumer: map.forEach uses one under the hood
        Map<String, Integer> ages = new HashMap<>(Map.of(\"Ada\", 37, \"Grace\", 85));
        ages.forEach((name, age) -> System.out.println(name + \": \" + age));

        // BinaryOperator: same-type two-arg function
        BinaryOperator<Integer> max = Math::max;
        System.out.println(max.apply(7, 4));                // 7

        // Reference + primitive: ObjIntConsumer
        ObjIntConsumer<String> repeat = (s, n) -> System.out.println(s.repeat(Math.max(0, n)));
        repeat.accept(\"ab\", 3);                            // ababab
    }
}`,
      codeLanguage: "java",
      explanation:
        "BiFunction/BiPredicate/BiConsumer for two args; ObjIntConsumer and friends for ref+primitive; define your own SAM for three or more.",
    },
  ],
  meta: {
    q208: { difficulty: "easy", priority: "very-high", tags: ["functional", "java8"], relatedQuestionIds: ["q209", "q210"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q209: { difficulty: "easy", priority: "high", tags: ["functional", "streams"], relatedQuestionIds: ["q208", "q211"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q210: { difficulty: "easy", priority: "very-high", tags: ["streams", "pipeline"], relatedQuestionIds: ["q211", "q212"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q211: { difficulty: "easy", priority: "very-high", tags: ["streams", "pipeline"], relatedQuestionIds: ["q210", "q212"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q212: { difficulty: "medium", priority: "very-high", tags: ["streams", "intermediate"], relatedQuestionIds: ["q213", "q211"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q213: { difficulty: "medium", priority: "very-high", tags: ["streams", "terminal"], relatedQuestionIds: ["q212", "q210"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q214: { difficulty: "easy", priority: "high", tags: ["method-refs", "java8"], relatedQuestionIds: ["q215", "q216"], estimatedReadMinutes: 2, javaVersions: ["Java 8+"] },
    q215: { difficulty: "easy", priority: "very-high", tags: ["lambda", "java8"], relatedQuestionIds: ["q217", "q214"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q216: { difficulty: "easy", priority: "high", tags: ["lambda", "java8"], relatedQuestionIds: ["q215", "q217"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q217: { difficulty: "medium", priority: "very-high", tags: ["functional-interfaces", "java8"], relatedQuestionIds: ["q215", "q218"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
    q218: { difficulty: "easy", priority: "high", tags: ["predicate", "java8"], relatedQuestionIds: ["q217", "q219"], estimatedReadMinutes: 2, javaVersions: ["Java 8+"] },
    q219: { difficulty: "easy", priority: "high", tags: ["function", "java8"], relatedQuestionIds: ["q217", "q220"], estimatedReadMinutes: 2, javaVersions: ["Java 8+"] },
    q220: { difficulty: "easy", priority: "high", tags: ["consumer", "java8"], relatedQuestionIds: ["q217", "q218"], estimatedReadMinutes: 2, javaVersions: ["Java 8+"] },
    q221: { difficulty: "medium", priority: "high", tags: ["functional-interfaces", "bi"], relatedQuestionIds: ["q217", "q219"], estimatedReadMinutes: 3, javaVersions: ["Java 8+"] },
  },
});