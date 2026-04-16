import { ContentSection } from "./recursionContent";

export const javaStreamsContent: ContentSection[] = [
  {
    id: "stream-lambda",
    title: "Lambda Expressions",
    difficulty: "Easy",
    theory: [
      "A **lambda expression** is an anonymous function — a concise way to represent a single-method interface implementation. Introduced in Java 8, lambdas are the foundation of functional programming in Java.",
      "**Syntax:** `(parameters) -> expression` for single expressions, or `(parameters) -> { statements; }` for multi-line bodies. If there's exactly one parameter and its type is inferred, parentheses are optional: `x -> x * 2`.",
      "**How Lambdas Work Internally:** Lambdas are NOT anonymous inner classes. The compiler generates a private static method and uses `invokedynamic` bytecode instruction to create the functional interface instance at runtime. This makes lambdas **more efficient** than anonymous classes — no extra `.class` file, no object allocation overhead.",
      "**Variable Capture:** Lambdas can access variables from their enclosing scope, but those variables must be **effectively final** (assigned only once). This restriction ensures thread-safety — since lambdas may execute in different threads, mutable captured variables would create race conditions.",
      "**`this` in Lambdas:** Unlike anonymous inner classes, `this` inside a lambda refers to the **enclosing class instance**, not the lambda itself. This is because lambdas don't create a new scope — they're syntactic sugar within the enclosing method.",
      "**Common Functional Patterns:** Lambdas replaced verbose anonymous inner classes for: event handlers (`button.onClick(e -> handleClick(e))`), comparators (`list.sort((a, b) -> a.compareTo(b))`), callbacks, strategy pattern implementations, and stream operations.",
      "**Type Inference:** The compiler infers lambda parameter types from the **target type** (the functional interface). You rarely need to specify types: `(String a, String b) -> a.compareTo(b)` can be simplified to `(a, b) -> a.compareTo(b)`."
    ],
    code: [
      {
        title: "Lambda Syntax & Usage",
        language: "java",
        content: `import java.util.*;

public class LambdaDemo {
    public static void main(String[] args) {
        // Before lambdas — anonymous inner class
        Comparator<String> oldWay = new Comparator<String>() {
            @Override
            public int compare(String a, String b) {
                return a.length() - b.length();
            }
        };
        
        // ✅ With lambda — concise
        Comparator<String> newWay = (a, b) -> a.length() - b.length();
        
        // No parameters
        Runnable task = () -> System.out.println("Running!");
        
        // One parameter (parentheses optional)
        List<String> names = Arrays.asList("Charlie", "Alice", "Bob");
        names.forEach(name -> System.out.println(name));
        
        // Multiple statements — need braces
        names.sort((a, b) -> {
            int diff = a.length() - b.length();
            if (diff != 0) return diff;
            return a.compareTo(b);
        });
        
        System.out.println(names); // [Bob, Alice, Charlie]
    }
}`
      }
    ],
    tip: "Lambdas don't create a new scope — `this` inside a lambda refers to the enclosing class, not the lambda itself."
  },
  {
    id: "stream-funcint",
    title: "Functional Interfaces",
    difficulty: "Medium",
    theory: [
      "A **functional interface** has exactly **one abstract method** (SAM — Single Abstract Method)",
      "The `@FunctionalInterface` annotation is optional but recommended — compiler enforces the SAM rule",
      "**Built-in functional interfaces** in `java.util.function`:",
      "**Predicate<T>** — takes T, returns boolean. Used for filtering: `t -> t > 5`",
      "**Function<T, R>** — takes T, returns R. Used for transformation: `s -> s.length()`",
      "**Consumer<T>** — takes T, returns void. Used for actions: `s -> System.out.println(s)`",
      "**Supplier<T>** — takes nothing, returns T. Used for factories: `() -> new ArrayList<>()`",
      "**UnaryOperator<T>** — takes T, returns T. Special Function: `s -> s.toUpperCase()`",
      "**BiFunction<T, U, R>**, **BiPredicate<T, U>**, **BiConsumer<T, U>** — two-argument versions"
    ],
    code: [
      {
        title: "Built-in Functional Interfaces",
        language: "java",
        content: `import java.util.function.*;
import java.util.*;

public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // Predicate — test (returns boolean)
        Predicate<Integer> isEven = n -> n % 2 == 0;
        System.out.println(isEven.test(4));   // true
        System.out.println(isEven.test(3));   // false
        
        // Predicate composition
        Predicate<Integer> isPositive = n -> n > 0;
        Predicate<Integer> isPositiveEven = isEven.and(isPositive);
        System.out.println(isPositiveEven.test(4));  // true
        System.out.println(isPositiveEven.test(-2)); // false
        
        // Function — apply (T -> R)
        Function<String, Integer> strLen = String::length;
        System.out.println(strLen.apply("Hello")); // 5
        
        // Function composition
        Function<Integer, Integer> doubleIt = n -> n * 2;
        Function<Integer, Integer> addTen = n -> n + 10;
        Function<Integer, Integer> doubleThenAdd = doubleIt.andThen(addTen);
        System.out.println(doubleThenAdd.apply(5)); // 20
        
        // Consumer — accept (T -> void)
        Consumer<String> printer = System.out::println;
        printer.accept("Hello!"); // Hello!
        
        // Supplier — get (() -> T)
        Supplier<List<String>> listFactory = ArrayList::new;
        List<String> newList = listFactory.get();
        
        // UnaryOperator — (T -> T)
        UnaryOperator<String> toUpper = String::toUpperCase;
        System.out.println(toUpper.apply("hello")); // HELLO
    }
}`
      }
    ],
    note: "Runnable and Comparator are also functional interfaces — that's why they work with lambdas."
  },
  {
    id: "stream-methodref",
    title: "Method References",
    difficulty: "Easy",
    theory: [
      "**Method references** are shorthand for lambdas that just call an existing method",
      "Syntax uses `::` operator — cleaner and more readable than equivalent lambda",
      "**Four types of method references:**",
      "**Static method:** `ClassName::staticMethod` → `x -> ClassName.staticMethod(x)`",
      "**Instance method of object:** `object::method` → `x -> object.method(x)`",
      "**Instance method of type:** `ClassName::method` → `(obj, x) -> obj.method(x)`",
      "**Constructor:** `ClassName::new` → `x -> new ClassName(x)`"
    ],
    code: [
      {
        title: "Method Reference Types",
        language: "java",
        content: `import java.util.*;
import java.util.function.*;

public class MethodRefDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Charlie", "alice", "Bob");
        
        // 1. Static method reference
        // Lambda: s -> System.out.println(s)
        names.forEach(System.out::println);
        
        // 2. Instance method of a particular object
        String prefix = "Hello, ";
        // Lambda: s -> prefix.concat(s)
        Function<String, String> greeter = prefix::concat;
        System.out.println(greeter.apply("World")); // Hello, World
        
        // 3. Instance method of the type (first arg is the object)
        // Lambda: (s1, s2) -> s1.compareToIgnoreCase(s2)
        names.sort(String::compareToIgnoreCase);
        System.out.println(names); // [alice, Bob, Charlie]
        
        // 4. Constructor reference
        // Lambda: s -> new StringBuilder(s)
        Function<String, StringBuilder> sbFactory = StringBuilder::new;
        StringBuilder sb = sbFactory.apply("Hello");
        
        // With streams
        List<String> upper = names.stream()
            .map(String::toUpperCase)    // instance method of type
            .toList();
        System.out.println(upper); // [ALICE, BOB, CHARLIE]
    }
}`
      }
    ],
    tip: "Use method references when the lambda just passes its arguments directly to a method — they're more readable."
  },
  {
    id: "stream-intro",
    title: "Stream API Introduction",
    difficulty: "Medium",
    theory: [
      "The **Stream API** (Java 8) is a declarative, functional-style abstraction for processing sequences of elements. It lets you express complex data transformations as a pipeline of operations — filter, transform, aggregate — without manual loops or temporary variables.",
      "**Streams vs Collections:** Collections are about **storing** data (data structures). Streams are about **processing** data (computation pipelines). A collection is an in-memory data structure that holds all its elements. A stream is a sequence of elements computed on demand — it doesn't store anything.",
      "**Streams are LAZY:** Intermediate operations (filter, map, sorted) are not executed until a **terminal operation** (collect, forEach, reduce) triggers the pipeline. This enables powerful optimizations — for example, `stream.filter(...).findFirst()` stops as soon as the first match is found, without processing the entire collection.",
      "**Streams are ONE-USE:** Once a terminal operation is called, the stream is consumed and cannot be reused. Attempting to reuse throws `IllegalStateException`. Create a new stream from the source each time.",
      "**Pipeline Architecture:** Source (collection, array, generator, file) → Zero or more **intermediate operations** (return new Stream, chainable, lazy) → One **terminal operation** (triggers computation, produces result or side-effect).",
      "**Internal Iteration:** Unlike external iteration (for-each loops where YOU control iteration), streams use **internal iteration** — the library handles iteration, enabling parallel execution, short-circuiting, and optimization transparently.",
      "**Primitive Streams:** `IntStream`, `LongStream`, `DoubleStream` avoid autoboxing overhead. Use `mapToInt()`, `mapToLong()`, `mapToDouble()` to convert. They provide sum(), average(), min(), max() directly.",
      "**Streams promote DECLARATIVE code:** Instead of 'create list, loop through items, check condition, add to new list' (imperative), you write 'filter matching items and collect' (declarative). This is more readable, less error-prone, and easier to parallelize."
    ],
    diagram: {
      type: "flow",
      title: "Stream Pipeline — Data Flow",
      direction: "horizontal",
      data: [
        { label: "Source", color: "muted", children: [{ label: "Collection, Array, Generator" }] },
        { label: "filter()", color: "info" },
        { label: "map()", color: "primary" },
        { label: "sorted()", color: "accent" },
        { label: "collect()", color: "success", children: [{ label: "Terminal Operation" }] }
      ]
    },
    code: [
      {
        title: "Stream Basics — Creating & Using Streams",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class StreamIntro {
    public static void main(String[] args) {
        // Create streams
        Stream<String> fromList = List.of("A", "B", "C").stream();
        Stream<Integer> fromOf = Stream.of(1, 2, 3, 4, 5);
        IntStream range = IntStream.rangeClosed(1, 10); // 1 to 10
        Stream<Double> generated = Stream.generate(Math::random).limit(5);
        Stream<Integer> iterated = Stream.iterate(0, n -> n + 2).limit(5); // 0,2,4,6,8
        
        // Basic pipeline: source → intermediate → terminal
        List<String> names = Arrays.asList("Charlie", "Alice", "Bob", "Dave", "Eve");
        
        List<String> result = names.stream()       // source
            .filter(n -> n.length() > 3)           // intermediate: filter
            .map(String::toUpperCase)               // intermediate: transform
            .sorted()                               // intermediate: sort
            .collect(Collectors.toList());           // terminal: collect
        
        System.out.println(result); // [ALICE, CHARLIE, DAVE]
        
        // Count
        long count = names.stream().filter(n -> n.length() <= 3).count();
        System.out.println("Short names: " + count); // 2
        
        // Chaining is expressive
        names.stream()
            .filter(n -> n.startsWith("A") || n.startsWith("B"))
            .map(n -> n + "!")
            .forEach(System.out::println); // Alice! Bob!
    }
}`
      }
    ],
    note: "Streams are lazy: `stream.filter(x -> ...).map(x -> ...)` does nothing until a terminal operation like `.collect()` is called."
  },
  {
    id: "stream-intermediate",
    title: "Intermediate Operations",
    difficulty: "Medium",
    theory: [
      "**Intermediate operations** transform a stream into another stream — they are **lazy** and **chainable**",
      "**filter(Predicate)** — keeps elements that match the condition",
      "**map(Function)** — transforms each element. mapToInt/mapToDouble for primitives",
      "**flatMap(Function)** — flattens nested structures (Stream<List<T>> → Stream<T>)",
      "**sorted()** — natural order, or `sorted(Comparator)` for custom order",
      "**distinct()** — removes duplicates (uses equals/hashCode)",
      "**limit(n)** — takes first n elements. **skip(n)** — skips first n elements",
      "**peek(Consumer)** — performs action on each element without consuming (useful for debugging)"
    ],
    code: [
      {
        title: "All Intermediate Operations",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class IntermediateOps {
    public static void main(String[] args) {
        List<Integer> nums = Arrays.asList(5, 3, 8, 1, 3, 9, 5, 2, 8);
        
        // filter — keep only even numbers
        nums.stream().filter(n -> n % 2 == 0).forEach(n -> System.out.print(n + " ")); // 8 2 8
        System.out.println();
        
        // map — square each number
        nums.stream().map(n -> n * n).forEach(n -> System.out.print(n + " ")); // 25 9 64 1 9 81 25 4 64
        System.out.println();
        
        // distinct — remove duplicates
        nums.stream().distinct().forEach(n -> System.out.print(n + " ")); // 5 3 8 1 9 2
        System.out.println();
        
        // sorted — ascending then descending
        nums.stream().sorted().forEach(n -> System.out.print(n + " ")); // 1 2 3 3 5 5 8 8 9
        System.out.println();
        nums.stream().sorted(Comparator.reverseOrder()).limit(3)
            .forEach(n -> System.out.print(n + " ")); // 9 8 8
        System.out.println();
        
        // limit & skip — pagination
        nums.stream().sorted().skip(2).limit(3)
            .forEach(n -> System.out.print(n + " ")); // 3 3 5
        System.out.println();
        
        // peek — debug
        long count = nums.stream()
            .peek(n -> System.out.print("[" + n + "] "))
            .filter(n -> n > 5)
            .count();
        System.out.println("\\nCount > 5: " + count); // 3
    }
}`
      },
      {
        title: "flatMap — Flattening Nested Structures",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class FlatMapDemo {
    public static void main(String[] args) {
        // Flatten list of lists
        List<List<Integer>> nested = Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(4, 5),
            Arrays.asList(6, 7, 8, 9)
        );
        
        List<Integer> flat = nested.stream()
            .flatMap(Collection::stream) // List<List<Int>> → Stream<Int>
            .collect(Collectors.toList());
        System.out.println(flat); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
        
        // Split words from sentences
        List<String> sentences = Arrays.asList("Hello World", "Java Streams", "Are Cool");
        List<String> words = sentences.stream()
            .flatMap(s -> Arrays.stream(s.split(" ")))
            .map(String::toLowerCase)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        System.out.println(words); // [are, cool, hello, java, streams, world]
    }
}`
      }
    ],
    tip: "Use **flatMap** whenever you have a stream of collections/arrays and want a single flat stream."
  },
  {
    id: "stream-terminal",
    title: "Terminal Operations",
    difficulty: "Medium",
    theory: [
      "**Terminal operations** trigger the processing of the stream pipeline and produce a result",
      "After a terminal operation, the stream is **consumed** and cannot be reused",
      "**forEach(Consumer)** — performs action on each element (void)",
      "**collect(Collector)** — accumulates elements into a collection or value",
      "**reduce(identity, BinaryOperator)** — combines all elements into a single value",
      "**count()** — returns number of elements. **min()/max(Comparator)** — returns Optional",
      "**findFirst()** / **findAny()** — returns Optional of first/any matching element",
      "**anyMatch / allMatch / noneMatch(Predicate)** — boolean short-circuit tests",
      "**toArray()** — converts to array. **toList()** (Java 16+) — to unmodifiable list"
    ],
    code: [
      {
        title: "Terminal Operations — reduce, collect, find, match",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class TerminalOps {
    public static void main(String[] args) {
        List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5);
        
        // reduce — combine into single value
        int sum = nums.stream().reduce(0, Integer::sum);
        System.out.println("Sum: " + sum); // 15
        
        Optional<Integer> product = nums.stream().reduce((a, b) -> a * b);
        System.out.println("Product: " + product.orElse(0)); // 120
        
        // min & max
        Optional<Integer> max = nums.stream().max(Integer::compareTo);
        System.out.println("Max: " + max.orElse(-1)); // 5
        
        // findFirst & findAny
        Optional<Integer> firstEven = nums.stream().filter(n -> n % 2 == 0).findFirst();
        System.out.println("First even: " + firstEven.orElse(-1)); // 2
        
        // anyMatch, allMatch, noneMatch
        boolean hasEven = nums.stream().anyMatch(n -> n % 2 == 0);
        boolean allPositive = nums.stream().allMatch(n -> n > 0);
        boolean noneNegative = nums.stream().noneMatch(n -> n < 0);
        System.out.println("Has even: " + hasEven);         // true
        System.out.println("All positive: " + allPositive); // true
        System.out.println("None negative: " + noneNegative); // true
        
        // count
        long evenCount = nums.stream().filter(n -> n % 2 == 0).count();
        System.out.println("Even count: " + evenCount); // 2
        
        // toArray
        Integer[] arr = nums.stream().filter(n -> n > 2).toArray(Integer[]::new);
        System.out.println(Arrays.toString(arr)); // [3, 4, 5]
    }
}`
      }
    ],
    warning: "Don't use **forEach** for accumulating results — use **reduce** or **collect** instead. forEach is for side-effects only."
  },
  {
    id: "stream-collectors",
    title: "Collectors & Grouping",
    difficulty: "Hard",
    theory: [
      "**Collectors** is a utility class with factory methods for common collection operations",
      "**toList(), toSet(), toMap()** — collect into standard collections",
      "**joining(delimiter)** — concatenates strings with a delimiter",
      "**groupingBy(classifier)** — groups elements by a key into Map<K, List<V>>",
      "**partitioningBy(predicate)** — splits into two groups: true and false",
      "**counting(), summingInt(), averagingInt()** — downstream aggregations",
      "**toMap(keyMapper, valueMapper)** — create a map from stream elements",
      "**groupingBy** with downstream collectors is extremely powerful for analytics"
    ],
    code: [
      {
        title: "Collectors — Collecting Results",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class CollectorsDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "Dave", "Eve", "Alice");
        
        // toList, toSet
        List<String> list = names.stream().filter(n -> n.length() > 3).collect(Collectors.toList());
        Set<String> set = names.stream().collect(Collectors.toSet()); // removes duplicates
        
        // joining
        String joined = names.stream().collect(Collectors.joining(", "));
        System.out.println(joined); // Alice, Bob, Charlie, Dave, Eve, Alice
        
        String wrapped = names.stream().distinct()
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println(wrapped); // [Alice, Bob, Charlie, Dave, Eve]
        
        // toMap
        Map<String, Integer> nameLengths = names.stream().distinct()
            .collect(Collectors.toMap(n -> n, String::length));
        System.out.println(nameLengths); // {Alice=5, Bob=3, ...}
        
        // counting & summarizing
        long count = names.stream().collect(Collectors.counting());
        IntSummaryStatistics stats = names.stream()
            .collect(Collectors.summarizingInt(String::length));
        System.out.println("Count: " + stats.getCount());
        System.out.println("Avg length: " + stats.getAverage());
    }
}`
      },
      {
        title: "groupingBy & partitioningBy — Powerful Analytics",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class GroupingDemo {
    record Student(String name, String grade, int score) {}

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Alice", "A", 95), new Student("Bob", "B", 82),
            new Student("Charlie", "A", 90), new Student("Dave", "B", 78),
            new Student("Eve", "A", 88), new Student("Frank", "C", 65)
        );
        
        // Group by grade
        Map<String, List<Student>> byGrade = students.stream()
            .collect(Collectors.groupingBy(Student::grade));
        byGrade.forEach((g, s) -> System.out.println(g + ": " + s.size() + " students"));
        
        // Group by grade, count each group
        Map<String, Long> gradeCounts = students.stream()
            .collect(Collectors.groupingBy(Student::grade, Collectors.counting()));
        System.out.println("Counts: " + gradeCounts); // {A=3, B=2, C=1}
        
        // Group by grade, average score
        Map<String, Double> avgScores = students.stream()
            .collect(Collectors.groupingBy(Student::grade,
                Collectors.averagingInt(Student::score)));
        System.out.println("Avg: " + avgScores);
        
        // Partition — split by predicate
        Map<Boolean, List<Student>> partition = students.stream()
            .collect(Collectors.partitioningBy(s -> s.score() >= 80));
        System.out.println("Passed: " + partition.get(true).size());  // 4
        System.out.println("Failed: " + partition.get(false).size()); // 2
        
        // Group by grade, get max scorer
        Map<String, Optional<Student>> toppers = students.stream()
            .collect(Collectors.groupingBy(Student::grade,
                Collectors.maxBy(Comparator.comparingInt(Student::score))));
        toppers.forEach((g, s) -> 
            System.out.println(g + " topper: " + s.map(Student::name).orElse("none")));
    }
}`
      }
    ],
    tip: "**groupingBy** with downstream collectors can replace complex loops — think of it as SQL GROUP BY with aggregate functions."
  },
  {
    id: "stream-parallel",
    title: "Parallel Streams",
    difficulty: "Hard",
    theory: [
      "**Parallel streams** split the workload across multiple threads using the **ForkJoin pool**",
      "Convert with `.parallelStream()` or `.stream().parallel()`",
      "Useful for **CPU-intensive** operations on **large datasets** (>10,000 elements)",
      "The operation must be **stateless**, **non-interfering**, and **associative** for correct results",
      "**NOT always faster** — thread overhead, synchronization, and unboxing can make it slower for small data",
      "**Avoid** parallel streams for: I/O operations, small collections, order-dependent operations, shared mutable state",
      "Use **forEachOrdered** instead of forEach if order matters in parallel streams",
      "Parallel reduce requires an **associative** combiner: `(a op b) op c == a op (b op c)`"
    ],
    code: [
      {
        title: "Parallel Streams — Usage & Caution",
        language: "java",
        content: `import java.util.*;
import java.util.stream.*;

public class ParallelStreamDemo {
    public static void main(String[] args) {
        List<Integer> nums = IntStream.rangeClosed(1, 1_000_000)
            .boxed().collect(Collectors.toList());
        
        // Sequential
        long start = System.nanoTime();
        long seqSum = nums.stream().mapToLong(n -> (long) n * n).sum();
        long seqTime = System.nanoTime() - start;
        
        // Parallel
        start = System.nanoTime();
        long parSum = nums.parallelStream().mapToLong(n -> (long) n * n).sum();
        long parTime = System.nanoTime() - start;
        
        System.out.println("Sequential: " + seqTime / 1_000_000 + "ms");
        System.out.println("Parallel: " + parTime / 1_000_000 + "ms");
        System.out.println("Same result? " + (seqSum == parSum));
        
        // ❌ WRONG — shared mutable state with parallel
        List<Integer> unsafeList = new ArrayList<>();
        // nums.parallelStream().forEach(unsafeList::add); // RACE CONDITION!
        
        // ✅ CORRECT — use collect
        List<Integer> safeList = nums.parallelStream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
        
        // Order matters? Use forEachOrdered
        List.of(1, 2, 3, 4, 5).parallelStream()
            .forEachOrdered(System.out::print); // 12345 (guaranteed order)
    }
}`
      }
    ],
    warning: "Parallel streams are NOT thread-safe by default — never modify shared mutable state inside a parallel stream operation."
  },
  {
    id: "stream-optional",
    title: "Optional Class",
    difficulty: "Medium",
    theory: [
      "**Optional<T>** is a container that may or may not contain a non-null value",
      "Designed to **prevent NullPointerException** by forcing explicit handling of absent values",
      "**Creating:** `Optional.of(value)` (not null), `Optional.ofNullable(value)` (maybe null), `Optional.empty()`",
      "**Checking:** `isPresent()`, `isEmpty()` (Java 11+)",
      "**Getting:** `get()` (throws if empty), `orElse(default)`, `orElseGet(supplier)`, `orElseThrow()`",
      "**Transforming:** `map()`, `flatMap()`, `filter()` — chainable operations",
      "**Do NOT** use Optional for: fields, method parameters, collections. Use it primarily for **return types**",
      "Stream terminal operations like `findFirst()`, `min()`, `max()`, `reduce()` all return Optional"
    ],
    code: [
      {
        title: "Optional — Creating, Checking & Extracting",
        language: "java",
        content: `import java.util.*;

public class OptionalDemo {
    public static void main(String[] args) {
        // Creating
        Optional<String> present = Optional.of("Hello");
        Optional<String> nullable = Optional.ofNullable(null);
        Optional<String> empty = Optional.empty();
        
        // Checking
        System.out.println(present.isPresent()); // true
        System.out.println(empty.isPresent());   // false
        
        // Getting values safely
        String val1 = present.orElse("default");         // "Hello"
        String val2 = empty.orElse("default");           // "default"
        String val3 = empty.orElseGet(() -> "computed"); // "computed"
        // String val4 = empty.orElseThrow();            // throws NoSuchElementException
        
        // ifPresent — execute action if value exists
        present.ifPresent(v -> System.out.println("Got: " + v)); // Got: Hello
        empty.ifPresent(v -> System.out.println("Never prints"));
        
        // ifPresentOrElse (Java 9+)
        empty.ifPresentOrElse(
            v -> System.out.println("Got: " + v),
            () -> System.out.println("Empty!") // Empty!
        );
        
        // Chaining — map, filter, flatMap
        Optional<Integer> length = present.map(String::length);
        System.out.println(length.orElse(0)); // 5
        
        Optional<String> filtered = present.filter(s -> s.startsWith("H"));
        System.out.println(filtered.orElse("no match")); // Hello
        
        // Real-world: find user and get email
        Optional<String> email = findUser("alice")
            .map(u -> u.toUpperCase())
            .filter(u -> u.length() > 3);
        System.out.println(email.orElse("not found")); // ALICE
    }
    
    static Optional<String> findUser(String name) {
        Map<String, String> users = Map.of("alice", "alice", "bob", "bob");
        return Optional.ofNullable(users.get(name));
    }
}`
      }
    ],
    warning: "Never call `.get()` without checking `.isPresent()` first — or better, use `.orElse()` / `.orElseThrow()` instead."
  }
];
