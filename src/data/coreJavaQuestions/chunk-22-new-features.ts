import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * New Features - global questions 222-225.
 * One question per Java release (Java 5, 6, 7, 8).
 */
export const chunk22NewFeatures = defineChunk({
  topic: "new-features",
  questions: [
    {
      id: "q222",
      question: "What are the new features in Java 5?",
      answer:
        "Java 5 (codename **Tiger**, 2004) is the single biggest language-level upgrade Java had seen until Java 8. Almost every API in production today relies on something added in this release, which is why interviewers use the question to check whether you actually know which features belong to which era, not just 'modern Java' as a vague blob.\n\n" +
        "**The headline language features:**\n\n" +
        "- **Generics with type parameters and the diamond operator**: compile-time type safety for collections and reusable algorithms, written as `List<String> names = new ArrayList<>()` instead of repeating the type on the right.\n" +
        "- **Enhanced for-each loop**: `for (String s : list)` over arrays and `Iterable`s, removing manual index bookkeeping and `Iterator` plumbing.\n" +
        "- **Autoboxing and unboxing**: seamless conversion between primitives and their wrapper types, so an `int` can be passed where an `Integer` is required and back again.\n" +
        "- **Varargs**: `void log(String... lines)` for methods that accept any number of arguments of the same type.\n" +
        "- **Typesafe enums**: the modern `enum` keyword with fields, methods and per-constant behaviour, replacing the old int-constant pattern.\n" +
        "- **Annotations**: `@Override`, `@Deprecated`, `@SuppressWarnings`, custom annotations, and the annotation-processing tool (`apt`) for compile-time code generation.\n" +
        "- **Static imports**: `import static java.lang.Math.PI` so static members can be used unqualified.\n" +
        "- **Covariant return types**: an overriding method may now declare a return type that is more specific than the overridden method's.\n\n" +
        "**Concurrency and utility additions in `java.util.concurrent`**: `ConcurrentHashMap`, `BlockingQueue`, `CopyOnWriteArrayList`, the atomics (`AtomicInteger`, `AtomicLong`), plus the executor framework with `Executors`, `ExecutorService` and `Future`. `StringBuilder`, the unsynchronised sibling of `StringBuffer`, also lands here and becomes the default choice whenever a single thread is building a string.",
      code:
        "import java.util.ArrayList;\n" +
        "import java.util.List;\n" +
        "import java.util.concurrent.ConcurrentHashMap;\n" +
        "import java.util.concurrent.atomic.AtomicInteger;\n" +
        "\n" +
        "public class Java5Features {\n" +
        "    // Varargs + generics + diamond operator + autoboxing\n" +
        "    public static <T> List<T> asList(T... items) {\n" +
        "        List<T> list = new ArrayList<>(); // diamond: type inferred\n" +
        "        for (T item : items) {             // enhanced for-each\n" +
        "            list.add(item);\n" +
        "        }\n" +
        "        return list;\n" +
        "    }\n" +
        "\n" +
        "    public static void main(String[] args) {\n" +
        "        // Autoboxing: ints are wrapped to Integer for List<Integer>\n" +
        "        List<Integer> nums = asList(1, 2, 3, 4);\n" +
        "\n" +
        "        // AtomicInteger: lock-free thread-safe counter\n" +
        "        AtomicInteger counter = new AtomicInteger();\n" +
        "        int sum = 0;\n" +
        "        for (Integer n : nums) {\n" +
        "            sum += counter.addAndGet(n);\n" +
        "        }\n" +
        "\n" +
        "        // ConcurrentHashMap: thread-safe map without external locking\n" +
        "        ConcurrentHashMap<String, Integer> tallies = new ConcurrentHashMap<>();\n" +
        "        tallies.merge(\"total\", sum, Integer::sum);\n" +
        "        System.out.println(\"tally: \" + tallies);\n" +
        "    }\n" +
        "}",
      codeLanguage: "java",
      explanation:
        "Java 5 introduced the syntax every modern codebase still relies on: generics, for-each, autoboxing, varargs, enums, annotations and the executor framework.",
    },
    {
      id: "q223",
      question: "What are the new features in Java 6?",
      answer:
        "Java 6 (codename **Mustang**, 2006) shipped almost no new syntax. Sun positioned it as a release for the people who maintain Java - performance, diagnostics and integration. Interviewers ask about it to separate candidates who actually track JDK evolution from those who only know the headline language features.\n\n" +
        "**Diagnostics and tooling:**\n\n" +
        "- **Java Compiler API (JSR 199)**: programmatic access to `javac`, so IDEs, build tools and annotation processors can compile code in-process instead of shelling out.\n" +
        "- **Scripting API (JSR 223)**: `ScriptEngineManager` plus `javax.script` lets Java host JavaScript, Groovy, Ruby and other languages through a uniform interface; Java 6 shipped the Rhino engine.\n" +
        "- **VisualVM**: bundled monitoring and profiling tool that surfaces heap dumps, thread dumps, CPU sampling and per-method flame graphs, replacing earlier separate tools.\n" +
        "- **Improved JConsole, jstack, jmap and jhat** workflow that became the standard JVM diagnostics toolkit.\n\n" +
        "**Library additions:**\n\n" +
        "- **JDBC 4.0**: auto-loading of drivers via `META-INF/services`, annotations on driver configuration (`@DriverRegister`), the new `RowSet` hierarchy and improved connection management.\n" +
        "- **`NavigableSet` / `NavigableMap`**: closest-match navigation (`floor`, `ceiling`, `lower`, `higher`, `descendingIterator`) on sorted collections.\n" +
        "- **`Deque`**: a double-ended queue interface that subsumes the role of stacks and work-stealing buffers.\n\n" +
        "**Performance work under the hood**: lock coarsening, biased locking for uncontended monitors, escape-analysis tweaks, and improvements to the HotSpot JIT - mostly invisible but measurable on long-running servers. Java 6 also consolidated the Swing look-and-feels, added the `java.io.Console` class for password input, and shipped the JAXB 2.x reference implementation as part of the JDK.",
      code:
        "import javax.script.ScriptEngine;\n" +
        "import javax.script.ScriptEngineManager;\n" +
        "import java.util.ArrayDeque;\n" +
        "import java.util.Deque;\n" +
        "import java.util.NavigableMap;\n" +
        "import java.util.concurrent.ConcurrentSkipListMap;\n" +
        "\n" +
        "public class Java6Features {\n" +
        "    public static void main(String[] args) throws Exception {\n" +
        "        // Scripting API (JSR 223): Java 6 ships the Rhino engine\n" +
        "        ScriptEngine js = new ScriptEngineManager().getEngineByName(\"js\");\n" +
        "        Object result = js.eval(\"1 + 2 + 3 + 4 + 5\");\n" +
        "        System.out.println(\"Rhino eval: \" + result);\n" +
        "\n" +
        "        // NavigableMap: floor / ceiling / descending on a sorted map\n" +
        "        NavigableMap<Integer, String> tail = new ConcurrentSkipListMap<>();\n" +
        "        tail.put(10, \"ten\"); tail.put(20, \"twenty\"); tail.put(30, \"thirty\");\n" +
        "        System.out.println(\"floor(25): \" + tail.floorEntry(25));\n" +
        "        System.out.println(\"descending: \" + tail.descendingMap());\n" +
        "\n" +
        "        // Deque: double-ended queue used for stacks and work buffers\n" +
        "        Deque<String> deque = new ArrayDeque<>();\n" +
        "        deque.push(\"a\"); deque.push(\"b\"); deque.push(\"c\");\n" +
        "        System.out.println(\"pop order: \" + deque.pop() + deque.pop() + deque.pop());\n" +
        "    }\n" +
        "}",
      codeLanguage: "java",
      explanation:
        "Java 6 had almost no new syntax; the release focused on performance, the Compiler and Scripting APIs, JDBC 4.0 and the Navigable collections.",
    },
    {
      id: "q224",
      question: "What are the new features in Java 7?",
      answer:
        "Java 7 (codename **Dolphin**, 2011) was a long-delayed release; some features planned for it ended up in Java 8 after the project split. It is the version that finally modernised everyday syntax and brought production-grade fine-grained concurrency to the JDK.\n\n" +
        "**Language changes that cleaned up daily code:**\n\n" +
        "- **Diamond operator `<>`**: `Map<String, List<Integer>> map = new HashMap<>();` lets the compiler infer the generic types.\n" +
        "- **Try-with-resources**: any `AutoCloseable` resource is closed automatically, with suppressed exceptions attached to the primary one.\n" +
        "- **Switch on `String`**: cases can match string literals directly, not just integral types and enums.\n" +
        "- **Multi-catch**: `catch (IOException | SQLException e)` handles several exception types in one block, with the variable typed as their common supertype.\n" +
        "- **Binary literals and underscores in numeric literals**: `0b1010`, `0xCAFE_BABE`, `1_000_000` for readability of large or bitwise constants.\n" +
        "- **More precise rethrow**: `catch (final Exception e)` followed by a rethrow that the compiler proves can only throw the checked types the method declares.\n\n" +
        "**Library and NIO additions:**\n\n" +
        "- **`java.util.Objects`**: null-safe helpers such as `requireNonNull`, `equals`, `hash` and `toString`.\n" +
        "- **NIO.2 file API**: `Path`, `Paths` and `Files` for symbolic-link-aware, scalable file access.\n" +
        "- **Fork/Join framework**: `ForkJoinPool` with `RecursiveTask<T>` and `RecursiveAction` for divide-and-conquer parallelism using work stealing.\n\n" +
        "**Concurrency and GC additions**: `Phaser` (a more flexible cyclic barrier), `TransferQueue` and `ConcurrentLinkedDeque` for new producer-consumer patterns. **G1** became the default collector in later releases and is still what most servers run today.",
      code:
        "import java.nio.file.Files;\n" +
        "import java.nio.file.Path;\n" +
        "import java.nio.file.Paths;\n" +
        "import java.util.Objects;\n" +
        "\n" +
        "public class Java7Features {\n" +
        "    public static void main(String[] args) throws Exception {\n" +
        "        // Binary literal + underscore separator for readability\n" +
        "        int flags = 0b1010_0001;\n" +
        "        long million = 1_000_000L;\n" +
        "\n" +
        "        // Diamond operator + try-with-resources on AutoCloseable\n" +
        "        Path log = Paths.get(\"app.log\");\n" +
        "        try (var reader = Files.newBufferedReader(log)) {\n" +
        "            String line = reader.readLine();\n" +
        "            Objects.requireNonNull(line, \"log must not be empty\");\n" +
        "\n" +
        "            // switch on String (Java 7)\n" +
        "            String kind = line.startsWith(\"ERR\") ? \"err\"\n" +
        "                       : line.startsWith(\"WRN\") ? \"warn\"\n" +
        "                       : \"info\";\n" +
        "            switch (kind) {\n" +
        "                case \"err\":  System.out.println(\"severe: \" + line); break;\n" +
        "                case \"warn\": System.out.println(\"caution: \" + line); break;\n" +
        "                default:     System.out.println(\"info: \" + line);\n" +
        "            }\n" +
        "        } catch (java.io.IOException | RuntimeException ex) {\n" +
        "            // multi-catch: same handler for several exception types\n" +
        "            System.out.println(\"read failed: \" + ex);\n" +
        "        }\n" +
        "\n" +
        "        System.out.println(\"flags=\" + flags + \" million=\" + million);\n" +
        "    }\n" +
        "}",
      codeLanguage: "java",
      explanation:
        "Java 7 cleaned up daily Java code with try-with-resources, switch on String, the diamond operator and multi-catch, and shipped NIO.2 plus the Fork/Join framework.",
    },
    {
      id: "q225",
      question: "What are the new features in Java 8?",
      answer:
        "Java 8 (2014) is the single biggest update in modern Java history. It brought functional-style programming into the language and reshaped almost every Java API written before 2014. Interviewers expect you to name the headline features and at least one concrete API change in detail, because the rest of the modern JDK is layered on top of these decisions.\n\n" +
        "**Language features:**\n\n" +
        "- **Lambda expressions**: `(x) -> x.length()` lets you pass behaviour as data, replacing single-method anonymous inner classes for most callbacks.\n" +
        "- **Method references**: `String::length`, `Integer::parseInt`, `instance::method` as a compact lambda form.\n" +
        "- **Default and static methods on interfaces**: interfaces can now ship `default` (concrete, inheritable) and `static` methods, which is how the Collections API was retrofitted for streams.\n" +
        "- **Functional interfaces in `java.util.function`**: `Predicate`, `Function`, `Supplier`, `Consumer`, plus primitive-specialised variants like `IntFunction` and `LongPredicate`.\n\n" +
        "**Stream and time APIs:**\n\n" +
        "- **Stream API**: `list.stream().filter(...).map(...).collect(toList())` for declarative bulk data pipelines, with parallel via `parallelStream()`.\n" +
        "- **`java.time`**: immutable `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant`, `ZonedDateTime`, plus `Duration` and `Period`, replacing the mutable and buggy `java.util.Date` and `Calendar`.\n" +
        "- **`Optional<T>`**: an explicit container that forces callers to handle 'no value' instead of NPE.\n\n" +
        "**Other notable additions**: **`CompletableFuture`** chains async tasks without blocking. Annotations can now be **repeated** on the same element, appear on type uses, and declare default element values. **`Arrays.parallelSort`** uses fork/join under the hood. `Map` gained `getOrDefault`, `putIfAbsent`, `compute`, `computeIfAbsent`, `computeIfPresent` and `merge`, killing a generation of idioms. Nashorn replaced Rhino as the in-JDK JavaScript engine.",
      code:
        "import java.time.LocalDate;\n" +
        "import java.time.Period;\n" +
        "import java.util.Arrays;\n" +
        "import java.util.HashMap;\n" +
        "import java.util.List;\n" +
        "import java.util.Map;\n" +
        "import java.util.Optional;\n" +
        "\n" +
        "public class Java8Features {\n" +
        "    public static void main(String[] args) {\n" +
        "        // Stream + lambda + method reference + Optional\n" +
        "        List<String> names = Arrays.asList(\"Ada\", \"Bob\", \"Charlie\", \"Anna\");\n" +
        "        Optional<String> firstA = names.stream()\n" +
        "                .filter(n -> n.startsWith(\"A\")) // lambda\n" +
        "                .map(String::toUpperCase)        // method reference\n" +
        "                .sorted()\n" +
        "                .findFirst();\n" +
        "        System.out.println(\"first A: \" + firstA.orElse(\"none\"));\n" +
        "\n" +
        "        // New Date/Time API: immutable, fluent, no Calendar weirdness\n" +
        "        LocalDate today = LocalDate.now();\n" +
        "        LocalDate deadline = today.plusDays(7);\n" +
        "        Period remaining = Period.between(today, deadline);\n" +
        "        System.out.println(\"deadline in \" + remaining.getDays() + \" days\");\n" +
        "\n" +
        "        // Map merge(): default-via-method-reference API added in Java 8\n" +
        "        Map<String, Integer> counts = new HashMap<>();\n" +
        "        counts.merge(\"hits\", 1, Integer::sum); // inserted\n" +
        "        counts.merge(\"hits\", 1, Integer::sum); // now 2\n" +
        "        System.out.println(\"counts: \" + counts);\n" +
        "    }\n" +
        "}",
      codeLanguage: "java",
      explanation:
        "Java 8 is the biggest single JDK release: lambdas, streams, Optional, the new Date/Time API, CompletableFuture and default methods define every modern Java codebase.",
    },
  ],
  meta: {
    q222: {
      difficulty: "medium",
      priority: "high",
      tags: ["java5", "generics", "concurrency"],
      relatedQuestionIds: ["g1", "mt8"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5"],
    },
    q223: {
      difficulty: "medium",
      priority: "medium",
      tags: ["java6", "performance", "scripting"],
      relatedQuestionIds: ["mt8"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 6"],
    },
    q224: {
      difficulty: "medium",
      priority: "high",
      tags: ["java7", "nio", "try-with-resources"],
      relatedQuestionIds: ["e4", "mt14"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 7"],
    },
    q225: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["java8", "lambda", "streams"],
      relatedQuestionIds: ["ic3", "st1"],
      estimatedReadMinutes: 5,
      javaVersions: ["Java 8+"],
    },
  },
});