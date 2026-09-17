import type { Diagram } from "./recursionContent";

/**
 * Diagram data for Java language / SQL topic content — keyed by ContentSection id.
 * Rendered by the shared DiagramRenderer (layers/hierarchy/flow/table-visual/graph).
 * Attached via `attachDiagrams()` in each content file.
 */
export const javaTopicVisualizations: Record<string, Diagram> = {
  // ══════════════════════════════════════════════════════════════
  // javaCollectionsContent.ts
  // ═════════════════════════════════════════════════════════════
  "col-list": {
    type: "table-visual",
    title: "ArrayList vs LinkedList — Internals",
    data: [
      {
        label: "ArrayList (dynamic array)",
        color: "primary",
        children: [
          { label: "Backed by Object[] — contiguous memory" },
          { label: "Random access O(1), append O(1) amortized" },
          { label: "Insert/delete in the middle O(n) — shifts elements" },
          { label: "Default capacity 10, grows 50% via Arrays.copyOf()" },
          { label: "~40% less memory, better CPU cache locality" },
        ],
      },
      {
        label: "LinkedList (doubly-linked)",
        color: "accent",
        children: [
          { label: "Each node: element + prev/next pointers" },
          { label: "Insert/delete at head or tail O(1)" },
          { label: "Index access O(n) — traverse from head or tail" },
          { label: "Also implements Deque — push/pop, offer/poll" },
          { label: "~40 bytes overhead per node" },
        ],
      },
    ],
  },
  "col-set": {
    type: "table-visual",
    title: "HashSet vs LinkedHashSet vs TreeSet",
    data: [
      {
        label: "HashSet",
        color: "primary",
        children: [
          { label: "Backed by HashMap" },
          { label: "O(1) add/remove/contains" },
          { label: "No ordering guarantee" },
          { label: "Uses hashCode() and equals()" },
        ],
      },
      {
        label: "LinkedHashSet",
        color: "accent",
        children: [
          { label: "Maintains insertion order" },
          { label: "Hash table + doubly-linked list" },
          { label: "Slightly slower than HashSet" },
        ],
      },
      {
        label: "TreeSet",
        color: "info",
        children: [
          { label: "Red-Black Tree — sorted order" },
          { label: "O(log n) operations" },
          { label: "Needs Comparable or a Comparator" },
          { label: "Navigation: floor, ceiling, higher, lower" },
        ],
      },
      {
        label: "EnumSet",
        color: "success",
        children: [
          { label: "Bit-vector specialized for enum types" },
          { label: "Extremely fast and memory efficient" },
        ],
      },
    ],
  },
  "col-map": {
    type: "table-visual",
    title: "HashMap vs LinkedHashMap vs TreeMap",
    data: [
      {
        label: "HashMap",
        color: "primary",
        children: [
          { label: "Array of buckets + collision chains" },
          { label: "O(1) average get/put/remove" },
          { label: "Unordered iteration, one null key allowed" },
          { label: "Perturbs the hash: h ^ (h >>> 16)" },
          { label: "Pre-size to avoid rehashing" },
        ],
      },
      {
        label: "LinkedHashMap",
        color: "accent",
        children: [
          { label: "Extends HashMap + doubly-linked list" },
          { label: "Insertion order, or access order" },
          { label: "LRU cache via removeEldestEntry()" },
        ],
      },
      {
        label: "TreeMap",
        color: "info",
        children: [
          { label: "Red-Black Tree — O(log n)" },
          { label: "Keys in sorted order, no null keys" },
          { label: "NavigableMap: floorKey, ceilingKey, subMap" },
        ],
      },
      {
        label: "Java 8+ Map methods",
        color: "success",
        children: [
          { label: "getOrDefault(key, default)" },
          { label: "putIfAbsent(key, value)" },
          { label: "merge(key, 1, Integer::sum)" },
        ],
      },
    ],
  },
  "col-queue": {
    type: "table-visual",
    title: "Queue, Deque & PriorityQueue",
    data: [
      {
        label: "Queue (FIFO)",
        color: "primary",
        children: [
          { label: "offer(e) / poll() / peek()" },
          { label: "Return null instead of throwing" },
          { label: "add / remove / element throw exceptions" },
        ],
      },
      {
        label: "Deque (double-ended)",
        color: "accent",
        children: [
          { label: "Insert and remove at both ends" },
          { label: "ArrayDeque — resizable circular array" },
          { label: "Fastest stack and queue implementation" },
        ],
      },
      {
        label: "PriorityQueue (binary heap)",
        color: "info",
        children: [
          { label: "Min-heap by default, not FIFO" },
          { label: "offer/poll O(log n), peek O(1)" },
          { label: "Max-heap via Collections.reverseOrder()" },
          { label: "Iteration order is NOT sorted" },
        ],
      },
    ],
  },
  "col-stack": {
    type: "table-visual",
    title: "Stack vs ArrayDeque",
    data: [
      {
        label: "java.util.Stack (legacy)",
        color: "warning",
        children: [
          { label: "Extends Vector" },
          { label: "Synchronized — slow" },
          { label: "LIFO: push, pop, peek" },
        ],
      },
      {
        label: "ArrayDeque (preferred)",
        color: "success",
        children: [
          { label: "Resizable circular array" },
          { label: "Not synchronized — faster" },
          { label: "push / pop / peek map to the front" },
          { label: "Initial capacity 16, auto-resizes" },
        ],
      },
      {
        label: "Classic stack problems",
        color: "info",
        children: [
          { label: "Balanced parentheses" },
          { label: "Next greater element (monotonic stack)" },
          { label: "Expression evaluation, undo operations" },
        ],
      },
    ],
  },
  "col-iterator": {
    type: "table-visual",
    title: "Iterator, ListIterator & Fail-Fast",
    data: [
      {
        label: "Iterator<E>",
        color: "primary",
        children: [
          { label: "hasNext() — more elements?" },
          { label: "next() — advance one element" },
          { label: "remove() — delete last returned" },
          { label: "The for-each loop uses it internally" },
        ],
      },
      {
        label: "ListIterator<E>",
        color: "accent",
        children: [
          { label: "Extends Iterator — bidirectional" },
          { label: "hasPrevious() / previous()" },
          { label: "add() and set() during traversal" },
          { label: "nextIndex() / previousIndex()" },
        ],
      },
      {
        label: "Fail-fast",
        color: "warning",
        children: [
          { label: "ArrayList, HashMap iterators" },
          { label: "Throw ConcurrentModificationException" },
          { label: "Safe removal: iterator.remove() or removeIf()" },
        ],
      },
      {
        label: "Fail-safe",
        color: "success",
        children: [
          { label: "ConcurrentHashMap, CopyOnWriteArrayList" },
          { label: "Iterate over a snapshot" },
          { label: "Spliterator (Java 8+) feeds parallel streams" },
        ],
      },
    ],
  },
  "col-comparable": {
    type: "table-visual",
    title: "Comparable vs Comparator",
    data: [
      {
        label: "Comparable<T>",
        color: "primary",
        children: [
          { label: "Implement compareTo(T o) in the class" },
          { label: "Defines the natural ordering" },
          { label: "Negative / 0 / positive contract" },
          { label: "Should be consistent with equals()" },
        ],
      },
      {
        label: "Comparator<T>",
        color: "accent",
        children: [
          { label: "External, custom ordering" },
          { label: "Allows multiple different sortings" },
          { label: "comparing, thenComparing, reversed" },
          { label: "Passed to sort methods and collections" },
        ],
      },
      {
        label: "Gotcha",
        color: "warning",
        children: [
          { label: "a - b can overflow for ints" },
          { label: "Use Integer.compare(a, b) instead" },
          { label: "Used by TreeSet, TreeMap, PriorityQueue" },
        ],
      },
    ],
  },
  "col-collections": {
    type: "layers",
    title: "Collections Utility Class — Operations",
    data: [
      {
        label: "Collections — java.util utility class",
        color: "primary",
        children: [
          { label: "Sorting — sort, reverseOrder, shuffle" },
          { label: "Searching — binarySearch on a sorted list" },
          { label: "Views — unmodifiableList, synchronizedList" },
          { label: "Bulk — fill, copy, swap, rotate, frequency" },
          { label: "Factories — List.of, Set.of, Map.of, List.copyOf" },
        ],
      },
    ],
  },
  "col-cp-patterns": {
    type: "table-visual",
    title: "Competitive Programming Collection Patterns",
    data: [
      {
        label: "Frequency Map",
        color: "primary",
        children: [
          { label: "HashMap<T, Integer> counts" },
          { label: "merge(key, 1, Integer::sum)" },
          { label: "Most common CP pattern" },
        ],
      },
      {
        label: "Two-Sum / Complement",
        color: "accent",
        children: [
          { label: "map.containsKey(target - num)" },
          { label: "O(1) complement lookup" },
        ],
      },
      {
        label: "Sliding Window",
        color: "info",
        children: [
          { label: "HashMap counts in a moving window" },
          { label: "Monotonic deque for window max/min O(1)" },
        ],
      },
      {
        label: "Ordered Queries",
        color: "success",
        children: [
          { label: "TreeSet floor/ceiling — nearest element" },
          { label: "TreeMap sweep line over intervals" },
          { label: "Coordinate compression: TreeSet + HashMap" },
        ],
      },
      {
        label: "Two Heaps",
        color: "warning",
        children: [
          { label: "Max-heap + min-heap" },
          { label: "Running median in O(log n)" },
        ],
      },
    ],
  },
  "col-concurrent": {
    type: "table-visual",
    title: "Concurrent Collections",
    data: [
      {
        label: "ConcurrentHashMap",
        color: "primary",
        children: [
          { label: "Fine-grained locking (lock striping)" },
          { label: "No null keys or values" },
          { label: "Much faster than synchronizedMap" },
        ],
      },
      {
        label: "CopyOnWriteArrayList",
        color: "accent",
        children: [
          { label: "New copy on every write" },
          { label: "Best when reads >> writes" },
          { label: "Fail-safe iteration over a snapshot" },
        ],
      },
      {
        label: "Concurrent queues",
        color: "info",
        children: [
          { label: "ConcurrentLinkedQueue — non-blocking CAS" },
          { label: "BlockingQueue — put/take block" },
          { label: "Producer-consumer building block" },
        ],
      },
      {
        label: "Sorted & wrappers",
        color: "success",
        children: [
          { label: "ConcurrentSkipListMap / Set" },
          { label: "Collections.synchronizedXxx() — single lock" },
          { label: "Prefer java.util.concurrent classes" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // javaStreamsContent.ts
  // ════════════════════════════════════════════════════════════
  "stream-lambda": {
    type: "flow",
    title: "Lambda — From Syntax to Bytecode",
    direction: "horizontal",
    data: [
      { label: "(a, b) -> a.length() - b.length()", color: "info" },
      { label: "Private static method\ncompiler-generated", color: "accent" },
      { label: "invokedynamic\nbootstrap links the call site", color: "warning" },
      { label: "Functional interface instance\nno extra .class file", color: "success" },
      { label: "Captures effectively final\nenclosing variables", color: "primary" },
    ],
  },
  "stream-funcint": {
    type: "table-visual",
    title: "Built-in Functional Interfaces",
    data: [
      {
        label: "Predicate<T>",
        color: "primary",
        children: [
          { label: "T -> boolean" },
          { label: "test(T) — used by filter" },
          { label: "and / or / negate composition" },
        ],
      },
      {
        label: "Function<T, R>",
        color: "accent",
        children: [
          { label: "T -> R" },
          { label: "apply(T) — used by map" },
          { label: "andThen / compose" },
        ],
      },
      {
        label: "Consumer<T>",
        color: "info",
        children: [
          { label: "T -> void" },
          { label: "accept(T) — used by forEach" },
        ],
      },
      {
        label: "Supplier<T>",
        color: "success",
        children: [
          { label: "() -> T" },
          { label: "get() — factories like ArrayList::new" },
        ],
      },
      {
        label: "UnaryOperator<T>",
        color: "warning",
        children: [
          { label: "T -> T, a special Function" },
          { label: "e.g. String::toUpperCase" },
        ],
      },
    ],
  },
  "stream-methodref": {
    type: "table-visual",
    title: "Four Types of Method References",
    data: [
      {
        label: "Static method",
        color: "primary",
        children: [
          { label: "ClassName::staticMethod" },
          { label: "Equivalent to x -> ClassName.staticMethod(x)" },
        ],
      },
      {
        label: "Instance method of an object",
        color: "accent",
        children: [
          { label: "object::method" },
          { label: "Equivalent to x -> object.method(x)" },
        ],
      },
      {
        label: "Instance method of a type",
        color: "info",
        children: [
          { label: "ClassName::method" },
          { label: "Equivalent to (obj, x) -> obj.method(x)" },
        ],
      },
      {
        label: "Constructor",
        color: "success",
        children: [
          { label: "ClassName::new" },
          { label: "Equivalent to x -> new ClassName(x)" },
        ],
      },
    ],
  },
  "stream-intermediate": {
    type: "flow",
    title: "Intermediate Operations — Lazy Chain",
    direction: "horizontal",
    data: [
      { label: "Source\ncollection, array, generator, file", color: "muted" },
      { label: "filter(Predicate)\nkeep matching elements", color: "info" },
      { label: "map(Function)\nflatMap flattens nested", color: "accent" },
      { label: "sorted / distinct()", color: "warning" },
      { label: "limit(n) / skip(n)\npeek(Consumer) for debug", color: "primary" },
    ],
  },
  "stream-terminal": {
    type: "table-visual",
    title: "Terminal Operations",
    data: [
      {
        label: "Trigger & consume",
        color: "primary",
        children: [
          { label: "Nothing runs before this" },
          { label: "The stream cannot be reused" },
          { label: "Reuse throws IllegalStateException" },
        ],
      },
      {
        label: "Collect & reduce",
        color: "accent",
        children: [
          { label: "collect(Collector)" },
          { label: "reduce(identity, BinaryOperator)" },
          { label: "count() — number of elements" },
        ],
      },
      {
        label: "Find & test",
        color: "info",
        children: [
          { label: "min() / max(Comparator) — Optional" },
          { label: "findFirst() / findAny() — Optional" },
          { label: "anyMatch / allMatch / noneMatch" },
        ],
      },
      {
        label: "Convert",
        color: "success",
        children: [
          { label: "toArray()" },
          { label: "toList() — Java 16+, unmodifiable" },
          { label: "forEach(Consumer) — side effects only" },
        ],
      },
    ],
  },
  "stream-collectors": {
    type: "table-visual",
    title: "Collectors — Grouping & Downstream",
    data: [
      {
        label: "To collections",
        color: "primary",
        children: [
          { label: "toList(), toSet()" },
          { label: "toMap(keyMapper, valueMapper)" },
        ],
      },
      {
        label: "Strings",
        color: "accent",
        children: [
          { label: "joining(delimiter)" },
          { label: "Concatenates elements into one String" },
        ],
      },
      {
        label: "Grouping",
        color: "info",
        children: [
          { label: "groupingBy(classifier)" },
          { label: "Returns Map<K, List<V>>" },
          { label: "Downstream collectors nest inside" },
        ],
      },
      {
        label: "Partitioning",
        color: "success",
        children: [
          { label: "partitioningBy(predicate)" },
          { label: "Two groups: true and false" },
        ],
      },
      {
        label: "Downstream aggregations",
        color: "warning",
        children: [
          { label: "counting()" },
          { label: "summingInt(), averagingInt()" },
          { label: "Like SQL GROUP BY with aggregates" },
        ],
      },
    ],
  },
  "stream-parallel": {
    type: "table-visual",
    title: "Parallel Streams — When It Helps",
    data: [
      {
        label: "Good fit",
        color: "success",
        children: [
          { label: "CPU-intensive work" },
          { label: "Large datasets (> 10,000 elements)" },
          { label: "Stateless, non-interfering, associative ops" },
        ],
      },
      {
        label: "Avoid",
        color: "warning",
        children: [
          { label: "I/O operations" },
          { label: "Small collections" },
          { label: "Order-dependent work, shared mutable state" },
        ],
      },
      {
        label: "Mechanics",
        color: "info",
        children: [
          { label: "Splits work over the common ForkJoinPool" },
          { label: "parallelStream() or stream().parallel()" },
          { label: "Use forEachOrdered if order matters" },
        ],
      },
      {
        label: "Reduce rule",
        color: "primary",
        children: [
          { label: "Combiner must be associative" },
          { label: "(a op b) op c == a op (b op c)" },
        ],
      },
    ],
  },
  "stream-optional": {
    type: "flow",
    title: "Optional — Create, Check, Extract, Transform",
    direction: "vertical",
    data: [
      { label: "Create\nOptional.of / ofNullable / empty", color: "info" },
      { label: "Check\nisPresent() / isEmpty()", color: "accent" },
      { label: "Extract\nget / orElse / orElseGet / orElseThrow", color: "warning" },
      { label: "Transform\nmap / flatMap / filter", color: "success" },
      { label: "Return types only\nnot fields, parameters or collections", color: "muted" },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // javaMultithreadingContent.ts
  // ═════════════════════════════════════════════════════════════
  "mt-basics": {
    type: "table-visual",
    title: "Process vs Thread",
    data: [
      {
        label: "Process",
        color: "primary",
        children: [
          { label: "A running program" },
          { label: "Own isolated memory space" },
          { label: "Heavyweight to create" },
        ],
      },
      {
        label: "Thread",
        color: "accent",
        children: [
          { label: "Smallest unit of execution" },
          { label: "Shares heap and static variables" },
          { label: "Own stack per thread" },
          { label: "Every program has a main thread" },
        ],
      },
      {
        label: "Concurrency",
        color: "info",
        children: [
          { label: "Tasks make progress in overlapping periods" },
          { label: "May not run at the exact same instant" },
        ],
      },
      {
        label: "Parallelism",
        color: "success",
        children: [
          { label: "Tasks run at the exact same instant" },
          { label: "Requires multiple CPU cores" },
        ],
      },
    ],
  },
  "mt-intro": {
    type: "table-visual",
    title: "Extend Thread vs Implement Runnable",
    data: [
      {
        label: "extends Thread",
        color: "warning",
        children: [
          { label: "Override run()" },
          { label: "Consumes the single inheritance slot" },
        ],
      },
      {
        label: "implements Runnable",
        color: "success",
        children: [
          { label: "Preferred approach" },
          { label: "Separates the task from the thread" },
          { label: "Can still extend another class" },
        ],
      },
      {
        label: "start() vs run()",
        color: "primary",
        children: [
          { label: "start() creates a new OS thread" },
          { label: "run() executes in the calling thread" },
          { label: "Never call run() directly" },
        ],
      },
    ],
  },
  "mt-sync": {
    type: "table-visual",
    title: "Synchronization & Lock Tools",
    data: [
      {
        label: "synchronized method",
        color: "primary",
        children: [
          { label: "Locks this, or ClassName.class if static" },
          { label: "Uses the object's intrinsic monitor lock" },
        ],
      },
      {
        label: "synchronized block",
        color: "accent",
        children: [
          { label: "Locks one specific object" },
          { label: "Finer control, better performance" },
        ],
      },
      {
        label: "ReentrantLock",
        color: "info",
        children: [
          { label: "tryLock, timed lock, fairness" },
          { label: "Interruptible acquisition" },
          { label: "Always unlock in a finally block" },
        ],
      },
      {
        label: "ReadWriteLock",
        color: "success",
        children: [
          { label: "Many concurrent readers" },
          { label: "OR one exclusive writer" },
        ],
      },
    ],
  },
  "mt-deadlock": {
    type: "graph",
    title: "Deadlock — Circular Wait Between Two Locks",
    data: {
      directed: true,
      nodes: [
        { id: "t1", label: "Thread 1", x: 20, y: 18, color: "primary" },
        { id: "lockA", label: "Lock A", x: 80, y: 18, color: "warning" },
        { id: "t2", label: "Thread 2", x: 80, y: 72, color: "accent" },
        { id: "lockB", label: "Lock B", x: 20, y: 72, color: "info" },
      ],
      edges: [
        { from: "t1", to: "lockA" },
        { from: "lockA", to: "t2" },
        { from: "t2", to: "lockB" },
        { from: "lockB", to: "t1" },
      ],
      highlightPath: ["t1", "lockA", "t2", "lockB", "t1"],
    },
  },
  "mt-memory-model": {
    type: "flow",
    title: "happens-before — Visibility Chain",
    direction: "horizontal",
    data: [
      { label: "Thread A\nwrites volatile x", color: "info" },
      { label: "Write flushed\nmain memory", color: "accent" },
      {
        label: "happens-before edge\nsource of ordering",
        color: "warning",
        children: [
          { label: "synchronized unlock → lock" },
          { label: "Thread.start() / join()" },
          { label: "countDown() → await()" },
        ],
      },
      { label: "Thread B\nreads x", color: "success" },
      { label: "Sees A's write\nno stale cached value", color: "primary" },
    ],
  },
  "mt-volatile": {
    type: "table-visual",
    title: "volatile vs Atomic vs synchronized",
    data: [
      {
        label: "volatile",
        color: "primary",
        children: [
          { label: "Visibility guarantee only" },
          { label: "Reads/writes go to main memory" },
          { label: "count++ is still not atomic" },
          { label: "Use for flags and stop signals" },
        ],
      },
      {
        label: "Atomic classes",
        color: "accent",
        children: [
          { label: "AtomicInteger, AtomicLong, AtomicBoolean, AtomicReference" },
          { label: "Lock-free CAS operations" },
          { label: "Use for counters and accumulators" },
        ],
      },
      {
        label: "synchronized / Lock",
        color: "info",
        children: [
          { label: "Visibility + mutual exclusion" },
          { label: "Protects compound operations" },
        ],
      },
    ],
  },
  "mt-executor": {
    type: "flow",
    title: "Executor Framework — Task to Thread Pool",
    direction: "horizontal",
    data: [
      { label: "Task\nRunnable or Callable", color: "info" },
      { label: "submit() / execute()\nsubmit returns a Future", color: "accent" },
      {
        label: "ExecutorService\nmanaged thread pool",
        color: "warning",
        children: [
          { label: "newFixedThreadPool(n)" },
          { label: "newCachedThreadPool()" },
          { label: "newSingleThreadExecutor()" },
          { label: "newScheduledThreadPool(n)" },
        ],
      },
      { label: "Worker thread\nruns the task", color: "success" },
      {
        label: "Future\nresult or exception",
        color: "primary",
        children: [{ label: "shutdown() or the JVM will not exit" }],
      },
    ],
  },
  "mt-callable": {
    type: "table-visual",
    title: "Callable, Future & invokeAll",
    data: [
      {
        label: "Callable<V>",
        color: "primary",
        children: [
          { label: "Like Runnable but returns a value" },
          { label: "Can throw checked exceptions" },
          { label: "call() instead of run()" },
        ],
      },
      {
        label: "Future<V>",
        color: "accent",
        children: [
          { label: "get() blocks until the result is ready" },
          { label: "get(timeout, unit) avoids indefinite blocking" },
          { label: "isDone() / cancel()" },
        ],
      },
      {
        label: "invokeAll / invokeAny",
        color: "info",
        children: [
          { label: "invokeAll waits for all tasks" },
          { label: "invokeAny returns the first completed result" },
        ],
      },
      {
        label: "Exception handling",
        color: "warning",
        children: [
          { label: "ExecutionException wraps the Callable's error" },
          { label: "TimeoutException from the timed get" },
        ],
      },
    ],
  },
  "mt-concurrent": {
    type: "table-visual",
    title: "Concurrent Data Structures",
    data: [
      {
        label: "ConcurrentHashMap",
        color: "primary",
        children: [
          { label: "Segmented, high-concurrency locking" },
          { label: "No null keys or values" },
          { label: "Default choice for concurrent maps" },
        ],
      },
      {
        label: "CopyOnWriteArrayList",
        color: "accent",
        children: [
          { label: "Copies the array on every write" },
          { label: "Best when reads >> writes" },
        ],
      },
      {
        label: "BlockingQueue",
        color: "info",
        children: [
          { label: "ArrayBlockingQueue — bounded" },
          { label: "LinkedBlockingQueue — optionally bounded" },
          { label: "Blocks on put/take" },
        ],
      },
      {
        label: "Skip lists & CAS queues",
        color: "success",
        children: [
          { label: "ConcurrentSkipListMap / Set — sorted" },
          { label: "ConcurrentLinkedQueue / Deque — non-blocking CAS" },
        ],
      },
    ],
  },
  "mt-completable": {
    type: "flow",
    title: "CompletableFuture — Async Pipeline",
    direction: "horizontal",
    data: [
      { label: "supplyAsync(supplier)\nstarts the async task", color: "info" },
      { label: "thenApply(fn)\ntransform the result", color: "accent" },
      { label: "thenCompose(fn)\nchain async — flatMap", color: "warning" },
      { label: "thenCombine(other, fn)\nmerge two futures", color: "success" },
      {
        label: "exceptionally / handle\nrecover from failure",
        color: "primary",
        children: [
          { label: "allOf waits for all" },
          { label: "anyOf waits for one" },
          { label: "thenAccept consumes the result" },
        ],
      },
    ],
  },
  "mt-forkjoin": {
    type: "hierarchy",
    title: "Fork/Join — Task Types & Work Stealing",
    data: [
      {
        label: "ForkJoinPool — divide and conquer",
        color: "primary",
        children: [
          { label: "RecursiveTask<V> — fork() subtasks, join() combines", color: "info" },
          { label: "RecursiveAction — no return value", color: "accent" },
          { label: "Work stealing — idle threads steal from busy queues", color: "warning" },
          { label: "Common pool — parallel streams use it internally", color: "success" },
          { label: "Best for CPU-bound decomposable work", color: "muted" },
        ],
      },
    ],
  },
  "mt-patterns": {
    type: "table-visual",
    title: "Concurrency Coordination Patterns",
    data: [
      {
        label: "Producer-Consumer",
        color: "primary",
        children: [
          { label: "Producers put, consumers take" },
          { label: "Shared buffer is a BlockingQueue" },
        ],
      },
      {
        label: "CountDownLatch",
        color: "accent",
        children: [
          { label: "Counts down to zero" },
          { label: "Waiters are released at zero" },
          { label: "One-shot — cannot be reset" },
        ],
      },
      {
        label: "CyclicBarrier",
        color: "info",
        children: [
          { label: "Threads wait for each other" },
          { label: "Reusable, unlike CountDownLatch" },
        ],
      },
      {
        label: "Semaphore & Phaser",
        color: "success",
        children: [
          { label: "Semaphore limits permits" },
          { label: "Phaser varies the party count dynamically" },
        ],
      },
      {
        label: "ThreadLocal",
        color: "warning",
        children: [
          { label: "Per-thread copy — no sharing" },
          { label: "Call remove() in thread pools" },
        ],
      },
    ],
  },
  "mt-virtual-threads": {
    type: "flow",
    title: "Virtual Threads — Cheap Blocking on I/O",
    direction: "horizontal",
    data: [
      { label: "Virtual thread\nscheduled on a carrier", color: "info" },
      { label: "Blocks on I/O\nunmounts from the carrier", color: "accent" },
      { label: "Carrier thread free\nruns other virtual threads", color: "warning" },
      { label: "I/O completes\nvirtual thread resumes", color: "success" },
      {
        label: "Millions of threads\nJVM-managed, not 1:1 with OS",
        color: "primary",
        children: [
          { label: "Thread.ofVirtual().start(task)" },
          { label: "newVirtualThreadPerTaskExecutor()" },
          { label: "I/O-bound only — not CPU-bound" },
        ],
      },
    ],
  },
  "mt-structured-concurrency": {
    type: "hierarchy",
    title: "StructuredTaskScope — Joiners",
    data: [
      {
        label: "StructuredTaskScope — one unit of work",
        color: "primary",
        children: [
          { label: "fork() subtasks — each on a virtual thread", color: "info" },
          { label: "join() before reading results", color: "accent" },
          { label: "ShutdownOnFailure — cancels siblings on any failure", color: "warning" },
          { label: "ShutdownOnSuccess — cancels siblings on first success", color: "success" },
          { label: "Fixes allOf() — which never cancels siblings", color: "muted" },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // javaIOContent.ts
  // ═════════════════════════════════════════════════════════════
  "io-buffered": {
    type: "table-visual",
    title: "Buffered Streams — Wrappers",
    data: [
      {
        label: "BufferedReader",
        color: "primary",
        children: [
          { label: "Wraps any Reader" },
          { label: "readLine() reads text line by line" },
        ],
      },
      {
        label: "BufferedWriter",
        color: "accent",
        children: [
          { label: "Wraps any Writer" },
          { label: "newLine() — platform-independent break" },
        ],
      },
      {
        label: "Buffered byte streams",
        color: "info",
        children: [
          { label: "BufferedInputStream" },
          { label: "BufferedOutputStream" },
        ],
      },
      {
        label: "PrintWriter",
        color: "success",
        children: [
          { label: "Buffering + formatting + auto-flush" },
          { label: "println() and printf()" },
        ],
      },
      {
        label: "Why buffering helps",
        color: "warning",
        children: [
          { label: "Default buffer 8192 bytes (8 KB)" },
          { label: "Unbuffered = one system call per read/write" },
          { label: "Buffered = data moved in chunks" },
        ],
      },
    ],
  },
  "io-file": {
    type: "table-visual",
    title: "java.io.File vs Path & Files",
    data: [
      {
        label: "java.io.File (legacy)",
        color: "warning",
        children: [
          { label: "Since Java 1.0" },
          { label: "Limited, inconsistent error reporting" },
        ],
      },
      {
        label: "java.nio.file.Path",
        color: "primary",
        children: [
          { label: "Modern replacement — Java 7+" },
          { label: "resolve, relativize, normalize" },
          { label: "getParent, getFileName" },
        ],
      },
      {
        label: "java.nio.file.Files",
        color: "success",
        children: [
          { label: "read, write, copy, move, delete" },
          { label: "readAllLines() into List<String>" },
          { label: "walk() traverses a directory tree" },
        ],
      },
    ],
  },
  "io-nio": {
    type: "flow",
    title: "NIO — Buffer Lifecycle",
    direction: "vertical",
    data: [
      { label: "put(data)\nwrite mode — fill the buffer", color: "info" },
      { label: "flip()\nswitch write to read mode", color: "accent" },
      { label: "get()\nread mode — drain the buffer", color: "warning" },
      { label: "clear() / compact()\nready to write again", color: "success" },
      {
        label: "Channels & Selectors\nnon-blocking I/O",
        color: "primary",
        children: [
          { label: "One thread manages many channels" },
          { label: "WatchService monitors file changes" },
        ],
      },
    ],
  },
  "io-serial": {
    type: "table-visual",
    title: "Serialization — Rules & Pitfalls",
    data: [
      {
        label: "Mechanics",
        color: "primary",
        children: [
          { label: "Class implements Serializable marker" },
          { label: "ObjectOutputStream writes objects" },
          { label: "ObjectInputStream reads them back" },
        ],
      },
      {
        label: "serialVersionUID",
        color: "accent",
        children: [
          { label: "Version identifier for the class" },
          { label: "Generated by the JVM if omitted" },
          { label: "Always declare it explicitly" },
        ],
      },
      {
        label: "transient & static",
        color: "info",
        children: [
          { label: "transient fields are excluded" },
          { label: "Use it for passwords and caches" },
          { label: "static fields are not serialized" },
        ],
      },
      {
        label: "Security",
        color: "warning",
        children: [
          { label: "Never deserialize untrusted data" },
          { label: "Prefer JSON or Protocol Buffers" },
        ],
      },
    ],
  },
  "io-properties": {
    type: "flow",
    title: "Properties — Config Lifecycle",
    direction: "vertical",
    data: [
      { label: "app.properties\nkey=value, comments start with #", color: "info" },
      { label: "load(InputStream)\nreads the file", color: "accent" },
      { label: "getProperty(key, default)\nvalue or fallback", color: "warning" },
      { label: "store(OutputStream, comment)\nwrites it back", color: "success" },
      {
        label: "Classpath loading\nworks inside a JAR",
        color: "primary",
        children: [{ label: "getClass().getResourceAsStream()" }],
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // javaJDBCContent.ts
  // ═════════════════════════════════════════════════════════════
  "jdbc-crud": {
    type: "table-visual",
    title: "Statement vs PreparedStatement",
    data: [
      {
        label: "Statement",
        color: "warning",
        children: [
          { label: "Static SQL without parameters" },
          { label: "Vulnerable to SQL injection" },
          { label: "Use only for DDL commands" },
        ],
      },
      {
        label: "PreparedStatement",
        color: "success",
        children: [
          { label: "Parameterized SQL with ? placeholders" },
          { label: "Parameters escaped automatically" },
          { label: "Database caches the execution plan" },
          { label: "Always use it for user input" },
        ],
      },
      {
        label: "Execution methods",
        color: "info",
        children: [
          { label: "executeQuery() returns a ResultSet" },
          { label: "executeUpdate() returns affected rows" },
          { label: "execute() returns a boolean" },
        ],
      },
      {
        label: "Batch operations",
        color: "primary",
        children: [
          { label: "addBatch() then executeBatch()" },
          { label: "Fewer round-trips, 10-100x faster" },
        ],
      },
    ],
  },
  "jdbc-transactions": {
    type: "flow",
    title: "JDBC Transaction — All or Nothing",
    direction: "vertical",
    data: [
      { label: "setAutoCommit(false)\nstart the transaction", color: "info" },
      { label: "Execute the statements\ndebit + credit as one unit", color: "accent" },
      { label: "Success\ncommit() — changes durable", color: "success" },
      { label: "Failure\nrollback() undoes everything", color: "warning" },
      {
        label: "Savepoints\npartial rollback",
        color: "primary",
        children: [
          { label: "setSavepoint(name) marks a point" },
          { label: "rollback(savepoint) keeps earlier work" },
          { label: "Isolation: READ_COMMITTED is the common default" },
        ],
      },
    ],
  },
  "jdbc-dao": {
    type: "layers",
    title: "DAO Pattern — Layered Data Access",
    data: [
      {
        label: "DAO Pattern — one entity, one DAO",
        color: "primary",
        children: [
          { label: "Model / Entity — one row, plain Java object" },
          { label: "DAO interface — findById, findAll, save, update, delete" },
          { label: "DAO implementation — JDBC and ResultSet mapping" },
          { label: "Connection pool — HikariCP borrows and returns" },
        ],
      },
    ],
  },
  "jdbc-advanced": {
    type: "table-visual",
    title: "Advanced JDBC — Metadata, RowSet & Pooling",
    data: [
      {
        label: "DatabaseMetaData",
        color: "primary",
        children: [
          { label: "Access via conn.getMetaData()" },
          { label: "Version and supported features" },
          { label: "Inspect table structures" },
        ],
      },
      {
        label: "ResultSetMetaData",
        color: "accent",
        children: [
          { label: "Access via rs.getMetaData()" },
          { label: "Column count, names and types" },
          { label: "Powers dynamic query tools" },
        ],
      },
      {
        label: "Scrollable & updatable",
        color: "info",
        children: [
          { label: "TYPE_SCROLL_INSENSITIVE" },
          { label: "CONCUR_UPDATABLE" },
          { label: "absolute, relative, previous" },
        ],
      },
      {
        label: "RowSet",
        color: "success",
        children: [
          { label: "CachedRowSet — disconnected, serializable" },
          { label: "JdbcRowSet — connected wrapper" },
        ],
      },
      {
        label: "HikariCP",
        color: "warning",
        children: [
          { label: "maximumPoolSize 10, minimumIdle" },
          { label: "connectionTimeout 30s" },
          { label: "idleTimeout 10min, maxLifetime 30min" },
        ],
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════
  // javaGenericsContent.ts
  // ════════════════════════════════════════════════════════════
  "gen-intro": {
    type: "table-visual",
    title: "Raw Types vs Generics",
    data: [
      {
        label: "Before generics",
        color: "warning",
        children: [
          { label: "Collections stored Object" },
          { label: "Manual casts required" },
          { label: "ClassCastException at runtime" },
        ],
      },
      {
        label: "With generics",
        color: "success",
        children: [
          { label: "List<String> — type argument declared" },
          { label: "Type errors caught at compile time" },
          { label: "No casts needed on read" },
        ],
      },
      {
        label: "Type parameter conventions",
        color: "primary",
        children: [
          { label: "T type, E element" },
          { label: "K key, V value, N number" },
          { label: "S, U for extra types" },
        ],
      },
      {
        label: "Compile-time only",
        color: "info",
        children: [
          { label: "Type information is erased at runtime" },
          { label: "Enables type safety and reusability" },
        ],
      },
    ],
  },
  "gen-classes": {
    type: "table-visual",
    title: "Generic Classes & Interfaces",
    data: [
      {
        label: "Box<T>",
        color: "primary",
        children: [
          { label: "Field, constructor parameter and return type use T" },
          { label: "Box<String> box = new Box<>()" },
        ],
      },
      {
        label: "Pair<K, V>",
        color: "accent",
        children: [
          { label: "Multiple type parameters" },
          { label: "getKey() returns K, getValue() returns V" },
        ],
      },
      {
        label: "Repository<T>",
        color: "info",
        children: [
          { label: "Generic interface: save, findById, findAll" },
          { label: "Implemented concretely or generically" },
        ],
      },
      {
        label: "Diamond operator",
        color: "success",
        children: [
          { label: "Java 7+ infers the type argument" },
          { label: "Less boilerplate on the right-hand side" },
        ],
      },
    ],
  },
  "gen-methods": {
    type: "table-visual",
    title: "Generic Method Rules",
    data: [
      {
        label: "Declaration",
        color: "primary",
        children: [
          { label: "Type parameter before the return type" },
          { label: "public <T> void printArray(T[] array)" },
        ],
      },
      {
        label: "Inference",
        color: "accent",
        children: [
          { label: "Compiler infers T from the arguments" },
          { label: "Rarely need to specify it explicitly" },
        ],
      },
      {
        label: "Static methods",
        color: "warning",
        children: [
          { label: "Cannot use the class type parameter" },
          { label: "Must declare their own type parameter" },
        ],
      },
      {
        label: "Explicit type witness",
        color: "info",
        children: [
          { label: "ClassName.<String>methodName(args)" },
          { label: "Use when inference is not enough" },
        ],
      },
    ],
  },
  // __APPEND_ANCHOR__
};