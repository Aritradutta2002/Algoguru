import { defineBackendChunk } from "./contract";

/**
 * Streams & Generics — Advanced (b234–b238).
 *
 * Fills the senior-level Chapter 2 gaps the basic bank misses: raw types &
 * heap pollution, the map/flatMap/filter/reduce toolkit, Collectors in
 * practice, stream pitfalls, and the streams-vs-loops trade-off.
 */
export const chunk16StreamsGenerics = defineBackendChunk({
  topic: "streams-generics",
  questions: [
    {
      id: "b234",
      question: "What are raw types and heap pollution, and why avoid them?",
      answer:
        "A **raw type** is a generic type used without its type argument — `List` instead of `List<String>`. It exists only for pre-generics backward compatibility. Using it disables generic type checking: the compiler emits *unchecked* warnings and defers type errors to runtime.\n\n" +
        "**Heap pollution** is when a variable of a parameterized type refers to an object that is **not** of that type — e.g. a `List<String>` variable actually holding an `Integer`. It happens when you mix raw and generic types (or misuse generic varargs), and because of **type erasure** the JVM can't catch it at the point of the bad store; instead you get a `ClassCastException` later, at an unrelated read — hard to debug.\n\n" +
        "**Generic varargs** (`T...`) are a common source, which is why `@SafeVarargs` exists to assert a method doesn't pollute the heap. Rule: never use raw types in new code, don't ignore unchecked warnings, and prefer `List<?>` when you need a 'any list' type safely.",
      code: `List<String> strings = new ArrayList<>();
List raw = strings;              // raw type: unchecked warning
raw.add(42);                     // heap pollution: an Integer in a List<String>!
String s = strings.get(0);       // ClassCastException HERE, far from the real bug

// Safe alternative when you truly need "some list":
void printAll(List<?> anyList) { anyList.forEach(System.out::println); }`,
      codeLanguage: "java",
      explanation:
        "Prevents hidden runtime ClassCastExceptions — raw types disable checking; erasure defers the failure to a distant read.",
      followUps: [
        "Why does the ClassCastException surface far from the bad store?",
        "What does @SafeVarargs assert?",
        "When use List<?> vs List<Object>?",
      ],
    },
    {
      id: "b235",
      question: "Explain map, flatMap, filter and reduce.",
      answer:
        "The core stream operations:\n\n" +
        "- **`filter(Predicate)`** — keep elements matching a condition (intermediate, lazy).\n" +
        "- **`map(Function)`** — transform each element 1:1 (`String` → its length).\n" +
        "- **`flatMap(Function)`** — transform each element into a **stream** and flatten all of them into one stream. Use it to flatten nested collections (`List<List<T>>` → stream of `T`) or one-to-many expansions. This is the operation people forget — `map` would give you a `Stream<Stream<T>>`; `flatMap` collapses it.\n" +
        "- **`reduce`** — fold the elements into a single value with an identity and an associative accumulator (sum, concatenation). For most aggregations `collect(...)` / `Collectors` is preferred over manual `reduce`.\n\n" +
        "Streams are **lazy**: intermediate ops build a pipeline and nothing runs until a terminal op (`collect`, `reduce`, `forEach`, `count`). The identity in `reduce` matters for correctness and for the empty-stream and parallel cases — with no elements `reduce` returns the identity, and in a parallel stream the accumulator must be associative so partial results from different threads combine correctly. A common mistake is using `map` where you need `flatMap`: `map(o -> o.items().stream())` produces a `Stream<Stream<String>>` that you then can't iterate directly, whereas `flatMap` collapses it into a single `Stream<String>`. Prefer `mapToInt`/`mapToLong` when reducing numbers to avoid boxing overhead.",
      code: `record Order(String customer, List<String> items) {}

// filter + map + reduce: total item count of PAID-customer orders
int totalItems = orders.stream()
        .filter(o -> o.customer().startsWith("A"))
        .map(o -> o.items().size())
        .reduce(0, Integer::sum);          // identity 0, associative accumulator

// flatMap: all items across all orders, deduped and sorted
List<String> allItems = orders.stream()
        .flatMap(o -> o.items().stream())  // Stream<List<String>> -> Stream<String>
        .distinct()
        .sorted()
        .toList();`,
      codeLanguage: "java",
      explanation:
        "Common live-coding building blocks — 1:1 map vs flattening flatMap, filtering, and reduce with an identity; laziness until terminal op.",
      followUps: [
        "When do you need flatMap instead of map?",
        "Why does reduce require an identity and associativity?",
        "What triggers a stream to actually execute?",
      ],
    },
    {
      id: "b236",
      question: "How do you use Collectors in practice?",
      answer:
        "`Collectors` supply the recipe for the terminal `collect(...)` — how to accumulate stream elements. The ones you use constantly:\n\n" +
        "- **`toList()` / `toSet()` / `toUnmodifiableList()`** — gather into a collection.\n" +
        "- **`toMap(keyFn, valueFn, mergeFn)`** — build a map; **always supply a merge function** if keys can collide (otherwise `IllegalStateException`).\n" +
        "- **`groupingBy(classifier, downstream)`** — the workhorse: group elements by a key, with a **downstream collector** to summarize each group (`counting()`, `summingInt`, `mapping`, `averagingDouble`, nested `groupingBy`).\n" +
        "- **`partitioningBy(predicate)`** — split into true/false groups.\n" +
        "- **`joining(delimiter, prefix, suffix)`** — concatenate strings.\n\n" +
        "The power is composing downstream collectors to compute aggregates in one pass. This is the most common 'aggregate this data' interview task.\n\n" +
        "Two more worth knowing: **`collectingAndThen(collector, finisher)`** post-processes the result (e.g. wrap in an unmodifiable map, or unwrap the `Optional` from `maxBy`), and **`teeing(down1, down2, merger)`** (Java 12+) runs two collectors over the same stream and merges their results — handy for computing, say, a count and a sum together. For custom accumulation you can implement the `Collector` interface (supplier, accumulator, combiner, finisher), but you rarely need to: the built-ins compose to cover almost everything. Remember `groupingBy` returns a `HashMap` and its groups are unordered — use `groupingBy(fn, TreeMap::new, downstream)` or `LinkedHashMap` if order matters.",
      code: `record Emp(String dept, String name, int salary) {}

// Count per department
Map<String, Long> headcount = emps.stream()
    .collect(Collectors.groupingBy(Emp::dept, Collectors.counting()));

// Total salary per department (downstream summing)
Map<String, Integer> payroll = emps.stream()
    .collect(Collectors.groupingBy(Emp::dept, Collectors.summingInt(Emp::salary)));

// Names per department (downstream mapping -> list)
Map<String, List<String>> names = emps.stream()
    .collect(Collectors.groupingBy(Emp::dept,
             Collectors.mapping(Emp::name, Collectors.toList())));

// toMap with merge function to survive duplicate keys
Map<String, Integer> maxByName = emps.stream()
    .collect(Collectors.toMap(Emp::name, Emp::salary, Integer::max));`,
      codeLanguage: "java",
      explanation:
        "Aggregation is a common interview task — groupingBy with downstream collectors and toMap's mandatory merge function.",
      followUps: [
        "Why does toMap need a merge function?",
        "How do downstream collectors compose?",
        "groupingBy vs partitioningBy?",
      ],
    },
    {
      id: "b237",
      question: "What are the common stream pitfalls?",
      answer:
        "- **Side effects in lambdas** — mutating external state inside `map`/`filter`/`forEach` (adding to a list, incrementing a counter) breaks with parallelism and hides intent. Use a collector to produce the result instead of a side-effecting `forEach`.\n" +
        "- **Stateful lambdas** — a lambda whose result depends on external mutable state is not safe, especially in parallel streams; results become non-deterministic.\n" +
        "- **Reusing a stream** — a stream is single-use; a second terminal op throws `IllegalStateException`. Create a new stream (or use a `Supplier<Stream>`).\n" +
        "- **`peek` for logic** — `peek` is for debugging only; it may be skipped by optimizations and shouldn't carry behaviour.\n" +
        "- **Infinite streams without a limit** (`Stream.iterate(...)` needs `limit`/short-circuit).\n" +
        "- **Boxing overhead** — use `IntStream`/`LongStream` for numeric work to avoid autoboxing.\n" +
        "- **Overuse** — a deeply chained stream can be less readable and harder to debug than a plain loop.\n\n" +
        "Guiding principle: streams should be **pure and stateless**; the pipeline computes a value, it doesn't mutate the world.",
      code: `// PITFALL: side effect + not parallel-safe
List<String> out = new ArrayList<>();
names.stream().filter(n -> n.length() > 3).forEach(out::add);   // avoid
// BETTER: let a collector build the result (pure)
List<String> good = names.stream().filter(n -> n.length() > 3).toList();

// PITFALL: reusing a stream
Stream<String> s = names.stream();
s.count();
// s.forEach(...);   // IllegalStateException: stream already operated upon

// Numeric: avoid boxing with IntStream
int total = orders.stream().mapToInt(Order::qty).sum();`,
      codeLanguage: "java",
      explanation:
        "Distinguishes stream fluency from abuse — keep pipelines pure/stateless, don't reuse streams, avoid peek-for-logic and boxing.",
      followUps: [
        "Why are side effects in streams dangerous with parallelism?",
        "What happens if you reuse a stream?",
        "When use IntStream over Stream<Integer>?",
      ],
    },
    {
      id: "b238",
      question: "Streams vs loops — when do you use each?",
      answer:
        "Both are valid; choose for **readability and fit**, not dogma.\n\n" +
        "**Streams shine** for declarative data pipelines: filter → map → group → collect reads like the intent, composes well, parallelizes easily, and avoids mutable accumulators. Great for transformations and aggregations.\n\n" +
        "**Loops are better** when:\n\n" +
        "- You need **control flow** — `break`/`continue`, early return, or index-based access (streams can only short-circuit via `findFirst`/`anyMatch`/`limit`).\n" +
        "- You must throw/handle **checked exceptions** — lambdas can't propagate them cleanly, forcing ugly wrapping.\n" +
        "- The logic is **simple** — a plain `for` is clearer than a one-element stream.\n" +
        "- **Hot, performance-critical** paths — a simple loop can avoid stream/lambda overhead and boxing (measure, don't guess).\n" +
        "- You need to **mutate** an existing structure in place.\n\n" +
        "Rule of thumb: streams for transformation/aggregation where they read cleaner; loops for imperative control flow, checked exceptions, and micro-optimized paths. Never force a stream that needs try/catch on every element.\n\n" +
        "On **parallel streams**: `parallelStream()` is not a free speed-up — it only helps for large datasets with CPU-bound, stateless, independent work and a cheap-to-split source (arrays, `ArrayList`). It uses the shared fork-join common pool, so a blocking task inside one can starve the whole JVM. For most business code a plain sequential stream or loop is faster and more predictable, so measure before reaching for parallelism.",
      code: `// Stream: clear declarative aggregation
Map<String, Long> byStatus = orders.stream()
        .collect(Collectors.groupingBy(Order::status, Collectors.counting()));

// Loop: needs break + checked exception -> a stream would be awkward
Order firstBad = null;
for (Order o : orders) {
    if (!validator.check(o)) {        // check() throws a checked exception
        firstBad = o;
        break;                        // early exit
    }
}`,
      codeLanguage: "java",
      explanation:
        "Pragmatic engineering trade-off — streams for declarative transforms; loops for control flow, checked exceptions and hot paths.",
      followUps: [
        "How do you short-circuit a stream?",
        "Why are checked exceptions awkward in streams?",
        "Is a stream always slower than a loop?",
      ],
    },
  ],
  meta: {
    b234: { difficulty: "medium", priority: "high", tags: ["generics", "raw-types", "heap-pollution"], readMinutes: 4 },
    b235: { difficulty: "medium", priority: "very-high", tags: ["streams", "flatmap", "reduce"], readMinutes: 4, versions: ["Java 8+"] },
    b236: { difficulty: "medium", priority: "very-high", tags: ["collectors", "groupingby", "tomap"], readMinutes: 5, versions: ["Java 8+"] },
    b237: { difficulty: "medium", priority: "high", tags: ["streams", "pitfalls", "side-effects"], readMinutes: 4 },
    b238: { difficulty: "easy", priority: "high", tags: ["streams", "loops", "readability"], readMinutes: 4 },
  },
});
