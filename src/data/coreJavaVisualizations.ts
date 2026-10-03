import type { Diagram } from "@/data/recursionContent";

/**
 * Scoped visualization data for Core Java interview questions.
 * Reuses the existing DiagramRenderer component (layers/hierarchy/flow/table-visual/graph).
 * All content is derived from the existing question answers — no fabricated facts.
 */
export const coreJavaVisualizations: Record<string, Diagram> = {
  // ── Java Basics ──
  b2: {
    type: "layers",
    title: "JDK ⊃ JRE ⊃ JVM",
    data: [
      {
        label: "JDK — Java Development Kit",
        color: "primary",
        children: [
          {
            label: "Development Tools — javac, jar, javadoc, jdb",
            color: "info",
          },
          {
            label: "JRE — Java Runtime Environment",
            color: "accent",
            children: [
              {
                label: "Core Libraries — java.lang, java.util, java.io",
                color: "success",
              },
              {
                label: "JVM — Java Virtual Machine",
                color: "warning",
                children: [
                  {
                    label: "Class Loader → Bytecode Verifier → Execution Engine (Interpreter + JIT)",
                    color: "heap",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  b3: {
    type: "flow",
    title: "Java Execution Flow",
    direction: "horizontal",
    data: [
      { label: "Source .java", color: "primary" },
      { label: "javac compiler", color: "info" },
      { label: "Bytecode .class", color: "accent" },
      { label: "JVM (interpreter + JIT)", color: "warning" },
      { label: "Native machine code", color: "success" },
    ],
  },
  b7: {
    type: "flow",
    title: "Widening vs Narrowing",
    direction: "horizontal",
    data: [
      { label: "byte", color: "success" },
      { label: "short", color: "success" },
      { label: "int", color: "success" },
      { label: "long", color: "success" },
      { label: "float", color: "success" },
      { label: "double", color: "success" },
    ],
  },
  // ── OOP ──
  o1: {
    type: "table-visual",
    title: "The Four Pillars of OOP",
    data: [
      {
        label: "Encapsulation",
        color: "primary",
        children: [{ label: "Private fields + public getters/setters" }, { label: "Protects data, hides internals" }],
      },
      {
        label: "Inheritance",
        color: "accent",
        children: [{ label: "Child class extends parent" }, { label: "'is-a' relationship" }],
      },
      {
        label: "Polymorphism",
        color: "info",
        children: [{ label: "Overloading (compile-time)" }, { label: "Overriding (runtime)" }],
      },
      {
        label: "Abstraction",
        color: "success",
        children: [{ label: "Abstract classes & interfaces" }, { label: "Show what, hide how" }],
      },
    ],
  },
  o2: {
    type: "table-visual",
    title: "Overloading vs Overriding",
    data: [
      {
        label: "Overloading",
        color: "primary",
        children: [
          { label: "Same class" },
          { label: "Different parameters" },
          { label: "Compile-time (static binding)" },
        ],
      },
      {
        label: "Overriding",
        color: "accent",
        children: [
          { label: "Parent ↔ child classes" },
          { label: "Same signature" },
          { label: "Runtime (dynamic binding)" },
        ],
      },
    ],
  },
  o5: {
    type: "table-visual",
    title: "Abstract Class vs Interface",
    data: [
      {
        label: "Abstract Class",
        color: "primary",
        children: [
          { label: "Abstract + concrete methods" },
          { label: "Can have instance state" },
          { label: "Single inheritance (extends)" },
          { label: "Use for shared 'is-a' state" },
        ],
      },
      {
        label: "Interface",
        color: "accent",
        children: [
          { label: "Abstract + default/static (Java 8+)" },
          { label: "Constants only, no instance state" },
          { label: "Multiple implementation" },
          { label: "Use for 'can-do' contracts" },
        ],
      },
    ],
  },
  o4: {
    type: "hierarchy",
    title: "Inheritance Types in Java",
    data: [
      {
        label: "Animal",
        color: "primary",
        children: [
          {
            label: "Dog (single: extends Animal)",
            color: "info",
            children: [{ label: "Puppy (multilevel)", color: "muted" }],
          },
          { label: "Cat (hierarchical sibling)", color: "success" },
        ],
      },
      {
        label: "Duck implements Flyable, Swimmable (multiple via interfaces)",
        color: "accent",
      },
    ],
  },
  o9: {
    type: "table-visual",
    title: "Access Modifier Visibility",
    data: [
      {
        label: "private",
        color: "destructive",
        children: [{ label: "Same class only" }],
      },
      {
        label: "default (package-private)",
        color: "warning",
        children: [{ label: "Same package" }],
      },
      {
        label: "protected",
        color: "info",
        children: [{ label: "Same package + subclasses" }],
      },
      {
        label: "public",
        color: "success",
        children: [{ label: "Everywhere" }],
      },
    ],
  },
  // ── Strings ──
  s1: {
    type: "flow",
    title: "String Pool",
    direction: "vertical",
    data: [
      { label: '"Hello" literal → pool', color: "primary" },
      { label: 'new String("Hello") → new heap object (not pooled)', color: "warning" },
      { label: "intern() → returns pool reference", color: "success" },
    ],
  },
  // ── Exception Handling ──
  e1: {
    type: "hierarchy",
    title: "Exception Hierarchy",
    data: [
      {
        label: "Throwable",
        color: "primary",
        children: [
          {
            label: "Exception (recoverable)",
            color: "success",
            children: [
              {
                label: "IOException — checked",
                color: "info",
              },
              {
                label: "RuntimeException — unchecked",
                color: "warning",
                children: [
                  { label: "NullPointerException", color: "muted" },
                  { label: "ArithmeticException", color: "muted" },
                ],
              },
            ],
          },
          {
            label: "Error — JVM-level, don't catch",
            color: "destructive",
            children: [{ label: "OutOfMemoryError, StackOverflowError", color: "muted" }],
          },
        ],
      },
    ],
  },
  e7: {
    type: "table-visual",
    title: "Error vs Exception",
    data: [
      {
        label: "Error",
        color: "destructive",
        children: [
          { label: "JVM-level (OutOfMemoryError)" },
          { label: "Unrecoverable" },
          { label: "Don't catch — fix root cause" },
        ],
      },
      {
        label: "Exception",
        color: "success",
        children: [
          { label: "Application-level (IOException, NPE)" },
          { label: "Recoverable" },
          { label: "Catch and handle" },
        ],
      },
    ],
  },
  // ── Collections ──
  c1: {
    type: "hierarchy",
    title: "Collections Framework Overview",
    data: [
      {
        label: "Iterable",
        color: "primary",
        children: [
          {
            label: "Collection",
            color: "info",
            children: [
              {
                label: "List — ArrayList, LinkedList",
                color: "success",
              },
              {
                label: "Set — HashSet, TreeSet",
                color: "accent",
              },
              {
                label: "Queue — PriorityQueue, ArrayDeque",
                color: "warning",
              },
            ],
          },
          {
            label: "Map — HashMap, TreeMap (separate branch)",
            color: "heap",
          },
        ],
      },
    ],
  },
  c2: {
    type: "table-visual",
    title: "ArrayList vs LinkedList",
    data: [
      {
        label: "ArrayList",
        color: "primary",
        children: [
          { label: "Dynamic array" },
          { label: "get(i): O(1)" },
          { label: "Insert/delete middle: O(n)" },
          { label: "Better cache locality" },
        ],
      },
      {
        label: "LinkedList",
        color: "accent",
        children: [
          { label: "Doubly-linked nodes" },
          { label: "get(i): O(n)" },
          { label: "Insert/delete at head/tail: O(1)" },
          { label: "Higher per-node overhead" },
        ],
      },
    ],
  },
  c3: {
    type: "table-visual",
    title: "HashMap vs TreeMap vs LinkedHashMap",
    data: [
      {
        label: "HashMap",
        color: "primary",
        children: [{ label: "Hash table" }, { label: "O(1) average" }, { label: "No ordering" }],
      },
      {
        label: "TreeMap",
        color: "success",
        children: [{ label: "Red-black tree" }, { label: "O(log n)" }, { label: "Sorted keys" }],
      },
      {
        label: "LinkedHashMap",
        color: "accent",
        children: [{ label: "Hash table + linked list" }, { label: "O(1) average" }, { label: "Insertion order" }],
      },
    ],
  },
  c4: {
    type: "table-visual",
    title: "HashSet vs TreeSet vs LinkedHashSet",
    data: [
      {
        label: "HashSet",
        color: "primary",
        children: [{ label: "Hash table" }, { label: "O(1) average" }, { label: "Allows null" }],
      },
      {
        label: "TreeSet",
        color: "success",
        children: [{ label: "Red-black tree" }, { label: "O(log n)" }, { label: "Sorted, no null" }],
      },
      {
        label: "LinkedHashSet",
        color: "accent",
        children: [{ label: "Hash table + linked list" }, { label: "O(1) average" }, { label: "Insertion order" }],
      },
    ],
  },
  c6: {
    type: "flow",
    title: "HashMap put(key, value) — Step by Step",
    direction: "vertical",
    data: [
      { label: "1. hash = key.hashCode(), spread bits: hash ^ (hash >>> 16)", color: "primary" },
      { label: "2. index = hash & (capacity - 1) — selects bucket", color: "info" },
      { label: "3. Bucket empty → place new Node", color: "success" },
      { label: "4. Collision → compare with equals() along chain", color: "warning" },
      { label: "5. Chain > 8 nodes AND capacity ≥ 64 → treeify to Red-Black Tree", color: "accent" },
      { label: "6. size > capacity × 0.75 → double array, rehash entries", color: "heap" },
    ],
  },
  c7: {
    type: "table-visual",
    title: "ConcurrentHashMap vs Hashtable vs synchronizedMap",
    data: [
      {
        label: "ConcurrentHashMap",
        color: "success",
        children: [
          { label: "CAS + per-bucket locking (Java 8+)" },
          { label: "Lock-free reads" },
          { label: "No null keys/values" },
          { label: "High concurrency throughput" },
        ],
      },
      {
        label: "Hashtable",
        color: "destructive",
        children: [
          { label: "One lock for the entire map" },
          { label: "Every read also locks" },
          { label: "No null keys/values" },
          { label: "Legacy — avoid" },
        ],
      },
      {
        label: "Collections.synchronizedMap",
        color: "warning",
        children: [
          { label: "Wraps HashMap with a mutex" },
          { label: "Whole-map lock per operation" },
          { label: "Allows null" },
          { label: "Functional but coarse-grained" },
        ],
      },
    ],
  },
  c9: {
    type: "table-visual",
    title: "List vs Set",
    data: [
      {
        label: "List",
        color: "primary",
        children: [
          { label: "Ordered, insertion order" },
          { label: "Duplicates allowed" },
          { label: "Index access: get(i)" },
          { label: "ArrayList, LinkedList" },
        ],
      },
      {
        label: "Set",
        color: "accent",
        children: [
          { label: "Order depends on implementation" },
          { label: "No duplicates — add() returns false" },
          { label: "No index access" },
          { label: "HashSet, TreeSet, LinkedHashSet" },
        ],
      },
    ],
  },
  // ── Multithreading ──
  mt4: {
    type: "table-visual",
    title: "wait() vs sleep()",
    data: [
      {
        label: "wait()",
        color: "primary",
        children: [
          { label: "Object method" },
          { label: "Releases the lock" },
          { label: "Must be called in synchronized block" },
          { label: "Wakes via notify()/notifyAll()" },
        ],
      },
      {
        label: "sleep()",
        color: "accent",
        children: [
          { label: "Thread method" },
          { label: "Keeps the lock" },
          { label: "No synchronized required" },
          { label: "Wakes after time elapses" },
        ],
      },
    ],
  },
  mt6: {
    type: "graph",
    title: "Deadlock — Circular Wait",
    data: {
      directed: true,
      nodes: [
        { id: "t1", label: "Thread 1", x: 20, y: 20, color: "primary" },
        { id: "t2", label: "Thread 2", x: 80, y: 20, color: "accent" },
        { id: "lockA", label: "Lock A", x: 20, y: 70, color: "warning" },
        { id: "lockB", label: "Lock B", x: 80, y: 70, color: "info" },
      ],
      edges: [
        { from: "t1", to: "lockA", color: "success" },
        { from: "t2", to: "lockB", color: "success" },
        { from: "t1", to: "lockB", color: "destructive" },
        { from: "t2", to: "lockA", color: "destructive" },
      ],
    },
  },
  mt7: {
    type: "table-visual",
    title: "volatile vs synchronized",
    data: [
      {
        label: "volatile",
        color: "primary",
        children: [
          { label: "Visibility guarantee only" },
          { label: "No atomicity for compound ops" },
          { label: "Reads/writes go to main memory" },
        ],
      },
      {
        label: "synchronized",
        color: "accent",
        children: [
          { label: "Visibility + mutual exclusion" },
          { label: "Atomic compound operations" },
          { label: "One thread holds the lock at a time" },
        ],
      },
    ],
  },
  mt8: {
    type: "flow",
    title: "ExecutorService — Task → Thread Pool",
    direction: "horizontal",
    data: [
      { label: "submit(task)", color: "primary" },
      { label: "BlockingQueue", color: "info" },
      { label: "Worker thread 1..n", color: "accent" },
      { label: "Future<T> result", color: "success" },
    ],
  },
  // ── Generics ──
  g2: {
    type: "flow",
    title: "Type Erasure — Compile Time → Runtime",
    direction: "horizontal",
    data: [
      { label: "List<String>", color: "primary" },
      { label: "Compiler checks + casts", color: "info" },
      { label: "Erasure → List", color: "warning" },
      { label: "Runtime sees raw List", color: "accent" },
    ],
  },
  g4: {
    type: "table-visual",
    title: "<? extends T> vs <? super T>",
    data: [
      {
        label: "? extends T",
        color: "primary",
        children: [
          { label: "Upper-bounded wildcard" },
          { label: "Read from it (producer)" },
          { label: "Can't add safely" },
        ],
      },
      {
        label: "? super T",
        color: "accent",
        children: [
          { label: "Lower-bounded wildcard" },
          { label: "Write into it (consumer)" },
          { label: "Reads return Object" },
        ],
      },
    ],
  },
  // ── Memory & JVM ──
  mem1: {
    type: "layers",
    title: "JVM Runtime Memory Areas",
    data: [
      {
        label: "JVM Memory",
        color: "primary",
        children: [
          {
            label: "Heap — objects & arrays (shared by all threads)",
            color: "accent",
            children: [
              { label: "Young Generation → Eden + Survivor spaces", color: "info" },
              { label: "Old Generation", color: "warning" },
            ],
          },
          {
            label: "Stack — one per thread: local variables, method frames",
            color: "success",
          },
          {
            label: "Metaspace — class metadata (native memory, since Java 8)",
            color: "heap",
          },
        ],
      },
    ],
  },
  mem3: {
    type: "table-visual",
    title: "Stack vs Heap",
    data: [
      {
        label: "Stack",
        color: "success",
        children: [
          { label: "Per-thread, LIFO frames" },
          { label: "Local variables & references" },
          { label: "Fast access" },
          { label: "StackOverflowError when full" },
        ],
      },
      {
        label: "Heap",
        color: "accent",
        children: [
          { label: "Shared by all threads" },
          { label: "All objects & arrays" },
          { label: "Managed by Garbage Collector" },
          { label: "OutOfMemoryError when exhausted" },
        ],
      },
    ],
  },
  mem2: {
    type: "flow",
    title: "Garbage Collection Lifecycle",
    direction: "horizontal",
    data: [
      { label: "Object created (new)", color: "primary" },
      { label: "Eden (Young Gen)", color: "info" },
      { label: "Minor GC → Survivor", color: "accent" },
      { label: "Old Generation", color: "warning" },
      { label: "Major GC reclaims", color: "success" },
    ],
  },
  // ── Streams ──
  st1: {
    type: "flow",
    title: "Stream Pipeline",
    direction: "horizontal",
    data: [
      { label: "source.stream()", color: "primary" },
      { label: "filter / map (intermediate, lazy)", color: "info" },
      { label: "sorted / distinct", color: "accent" },
      { label: "collect / forEach (terminal)", color: "success" },
    ],
  },
  st5: {
    type: "table-visual",
    title: "Intermediate vs Terminal Operations",
    data: [
      {
        label: "Intermediate",
        color: "primary",
        children: [
          { label: "filter, map, sorted, distinct, flatMap" },
          { label: "Lazy — nothing runs yet" },
          { label: "Return another Stream" },
        ],
      },
      {
        label: "Terminal",
        color: "accent",
        children: [
          { label: "collect, forEach, reduce, count" },
          { label: "Triggers the whole pipeline" },
          { label: "Return a result or side effect" },
        ],
      },
    ],
  },
  st2: {
    type: "table-visual",
    title: "map() vs flatMap()",
    data: [
      {
        label: "map(Function<T,R>)",
        color: "primary",
        children: [
          { label: "1 input → 1 output" },
          { label: "Stream<Stream<R>> if R is a Stream" },
        ],
      },
      {
        label: "flatMap(Function<T,Stream<R>>)",
        color: "accent",
        children: [
          { label: "1 input → many outputs" },
          { label: "Flattens nested streams into one" },
        ],
      },
    ],
  },
  // ── Misc ──
  m6: {
    type: "hierarchy",
    title: "Class Loader Hierarchy (Parent Delegation)",
    data: [
      {
        label: "Bootstrap — loads java.lang.* (rt.jar / java.base)",
        color: "primary",
        children: [
          {
            label: "Platform — JDK extensions (Java 9+ modules)",
            color: "info",
            children: [
              {
                label: "Application — your classpath classes",
                color: "success",
              },
            ],
          },
        ],
      },
    ],
  },
  m12: {
    type: "table-visual",
    title: "HashMap vs Hashtable",
    data: [
      {
        label: "HashMap",
        color: "success",
        children: [
          { label: "Not thread-safe (fast)" },
          { label: "Allows null key & values" },
          { label: "Tree-optimized buckets (Java 8+)" },
          { label: "Modern default choice" },
        ],
      },
      {
        label: "Hashtable",
        color: "destructive",
        children: [
          { label: "Synchronized (slow)" },
          { label: "No null keys/values" },
          { label: "No tree optimization" },
          { label: "Legacy — use ConcurrentHashMap" },
        ],
      },
    ],
  },
  m8: {
    type: "table-visual",
    title: "Records — What the Compiler Generates",
    data: [
      {
        label: "You write",
        color: "primary",
        children: [{ label: "record Point(int x, int y) { }" }],
      },
      {
        label: "Compiler generates",
        color: "success",
        children: [
          { label: "Canonical constructor" },
          { label: "Accessors x(), y()" },
          { label: "equals(), hashCode(), toString()" },
        ],
      },
      {
        label: "Constraints",
        color: "warning",
        children: [{ label: "final & immutable" }, { label: "Cannot extend other classes" }, { label: "No instance fields beyond components" }],
      },
    ],
  },
  m11: {
    type: "table-visual",
    title: "Stack vs Queue",
    data: [
      {
        label: "Stack (LIFO)",
        color: "primary",
        children: [
          { label: "push / pop / peek" },
          { label: "Last in → first out" },
          { label: "Use ArrayDeque, not legacy Stack" },
        ],
      },
      {
        label: "Queue (FIFO)",
        color: "accent",
        children: [
          { label: "offer / poll / peek" },
          { label: "First in → first out" },
          { label: "ArrayDeque, LinkedList, PriorityQueue" },
        ],
      },
    ],
  },
  m15: {
    type: "table-visual",
    title: "Aggregation vs Composition",
    data: [
      {
        label: "Aggregation (has-a)",
        color: "primary",
        children: [
          { label: "Parts can exist independently" },
          { label: "Department has Teachers" },
          { label: "Parts survive container deletion" },
        ],
      },
      {
        label: "Composition (part-of)",
        color: "accent",
        children: [
          { label: "Parts owned exclusively" },
          { label: "House has Rooms" },
          { label: "Parts die with container" },
        ],
      },
    ],
  },
  m4: {
    type: "flow",
    title: "Optional — Safe Value Handling",
    direction: "vertical",
    data: [
      { label: "Optional.ofNullable(value)", color: "primary" },
      { label: "isPresent() / ifPresent()", color: "info" },
      { label: "orElse(default) / orElseGet(supplier)", color: "accent" },
      { label: "orElseThrow() when absence is an error", color: "warning" },
    ],
  },
  // ── OOP (continued) ──
  o3: {
    type: "flow",
    title: "Encapsulation — Guarded State",
    direction: "vertical",
    data: [
      { label: "private fields — hidden state", color: "primary", children: [{ label: "No direct access from outside" }] },
      { label: "public getters — controlled reads", color: "info" },
      { label: "validated setters — enforced invariants", color: "accent", children: [{ label: "setAge rejects negatives" }] },
      { label: "Internal refactor invisible to callers", color: "success" },
    ],
  },
  o6: {
    type: "flow",
    title: "Polymorphism — Overload vs Override",
    direction: "horizontal",
    data: [
      { label: "log(String)", color: "primary" },
      { label: "log(String, int) — overload", color: "info", children: [{ label: "Compile-time • reference type decides" }] },
      { label: "Payment p = new UPI()", color: "accent" },
      { label: "p.pay(50) — override", color: "success", children: [{ label: "Runtime • object type decides" }] },
    ],
  },
  o12: {
    type: "flow",
    title: "super() — Parent First",
    direction: "vertical",
    data: [
      { label: "Child constructor called", color: "primary" },
      { label: "super(args) MUST be first statement", color: "warning", children: [{ label: "No implicit super() if parent lacks no-arg ctor" }] },
      { label: "Parent fields initialized", color: "info" },
      { label: "Child fields initialized", color: "success" },
    ],
  },
  io3: {
    type: "flow",
    title: "Serialization — Object ↔ Bytes",
    direction: "horizontal",
    data: [
      { label: "Object (heap)", color: "primary" },
      { label: "ObjectOutputStream", color: "info" },
      { label: "Byte stream (file/network)", color: "accent" },
      { label: "ObjectInputStream", color: "info" },
      { label: "Object (restored)", color: "success" },
    ],
  },
  // ── Strings (continued) ──
  s2: {
    type: "flow",
    title: "Why String Is Immutable",
    direction: "vertical",
    data: [
      { label: "char[] / byte[] is final + private", color: "primary" },
      { label: "No method mutates the array in place", color: "info", children: [{ label: "All ops return a NEW String" }] },
      { label: "class String is final — no subclass can break it", color: "accent" },
      {
        label: "Benefits",
        color: "success",
        children: [{ label: "Safe String Pool sharing" }, { label: "Thread-safety • cached hashCode" }],
      },
    ],
  },
  s3: {
    type: "table-visual",
    title: "String vs StringBuilder vs StringBuffer",
    data: [
      {
        label: "String — immutable",
        color: "primary",
        children: [{ label: "Every + creates a new object — O(n²) in loops" }, { label: "Best for constants and keys" }],
      },
      {
        label: "StringBuilder — mutable, fast",
        color: "success",
        children: [{ label: "Resizable buffer, starts at capacity 16" }, { label: "NOT thread-safe — single-thread default" }],
      },
      {
        label: "StringBuffer — mutable, synchronized",
        color: "warning",
        children: [{ label: "Same API, lock overhead on every method" }, { label: "Only when threads share one builder" }],
      },
    ],
  },
  // ── Exceptions (continued) ──
  e2: {
    type: "table-visual",
    title: "throw vs throws",
    data: [
      {
        label: "throw — the action",
        color: "primary",
        children: [{ label: "Inside a method body" }, { label: "throw new IOException — raises it now" }],
      },
      {
        label: "throws — the declaration",
        color: "info",
        children: [{ label: "In the method signature" }, { label: "void read() throws IOException — warns callers" }, { label: "Caller must catch or re-declare" }],
      },
    ],
  },
  e3: {
    type: "flow",
    title: "finally — Cleanup That Always Runs",
    direction: "vertical",
    data: [
      { label: "try { work }", color: "primary" },
      { label: "catch — optional, handles failure", color: "info" },
      { label: "finally — always executes", color: "accent", children: [{ label: "Skipped only by System.exit() / JVM crash" }] },
      { label: "Gotcha: return in finally overrides try/catch", color: "warning", children: [{ label: "Never return from finally" }] },
      { label: "Modern alternative: try-with-resources", color: "success" },
    ],
  },
  e8: {
    type: "flow",
    title: "Exception Propagation Up the Stack",
    direction: "vertical",
    data: [
      { label: "level3() throws", color: "primary" },
      { label: "level2() — no catch, unwinds", color: "info" },
      { label: "level1() catches ArithmeticException", color: "success", children: [{ label: "e.printStackTrace() shows level3 → level2 → level1" }] },
      { label: "Unchecked: auto • Checked: throws at each level", color: "accent" },
    ],
  },
  // ── Inheritance & Polymorphism traps ──
  ip1: {
    type: "table-visual",
    title: "Overriding vs Static Hiding",
    data: [
      {
        label: "Instance method — true override",
        color: "success",
        children: [{ label: "Parent p = new Child(); p.greet() runs Child" }, { label: "@Override compiles • runtime dispatch" }],
      },
      {
        label: "static method — hiding, NOT overriding",
        color: "warning",
        children: [{ label: "Parent p = new Child(); p.greet() runs Parent" }, { label: "@Override fails • compile-time binding" }, { label: "Call via ClassName.method()" }],
      },
    ],
  },
  ip5: {
    type: "table-visual",
    title: "Inheritance vs Composition",
    data: [
      {
        label: "Inheritance — is-a",
        color: "info",
        children: [{ label: "Dog extends Animal" }, { label: "Fragile base class • one parent only" }],
      },
      {
        label: "Composition — has-a",
        color: "success",
        children: [{ label: "Car has an Engine" }, { label: "Flexible • testable • preferred default" }],
      },
    ],
  },
  // ── Threads (continued) ──
  mt1: {
    type: "flow",
    title: "Three Ways to Start a Thread",
    direction: "horizontal",
    data: [
      { label: "new Thread(task).start()", color: "primary", children: [{ label: "start() creates the thread • run() does not" }] },
      { label: "Runnable / lambda (preferred)", color: "info" },
      { label: "Callable + ExecutorService", color: "success", children: [{ label: "Returns Future<T> • pool.shutdown()" }] },
    ],
  },
  // ── Generics (continued) ──
  g1: {
    type: "flow",
    title: "Before vs After Generics",
    direction: "horizontal",
    data: [
      { label: "List + cast at runtime", color: "warning", children: [{ label: "ClassCastException at runtime" }] },
      { label: "List<String> — compile-time", color: "success", children: [{ label: "Wrong add() = compile error" }, { label: "No casts • self-documenting" }] },
    ],
  },
  // ── Advanced OOP ──
  // Keyed by the live question id (q226) rather than the legacy short keys used
  // above; the lookup in CoreJavaVisualizationBlock is by question id.
  q226: {
    type: "flow",
    title: "Singleton — The getInstance() Guard Path",
    direction: "vertical",
    data: [
      {
        label: "getInstance() called",
        color: "primary",
        children: [{ label: "Read the static volatile field — no lock taken" }],
      },
      {
        label: "instance != null → fast path",
        color: "info",
        children: [
          { label: "Return the cached instance immediately" },
          { label: "Monitor never acquired • later calls never contend" },
        ],
      },
      {
        label: "instance == null → first call only",
        color: "warning",
        children: [
          { label: "synchronized (ConfigService.class) — acquire the class monitor" },
          { label: "A thread that queued here may already have built it — hence the second check" },
        ],
      },
      {
        label: "Still null → construct",
        color: "accent",
        children: [
          { label: "Private constructor runs • the settings map is loaded once" },
          { label: "volatile write publishes the fully built object, never a half-built one" },
        ],
      },
      {
        label: "Release the lock and return",
        color: "success",
        children: [{ label: "Every caller from now on sees the same reference" }],
      },
    ],
  },
  q001: {
    type: "layers",
    title: "Java Platform Architecture",
    data: [
      {
        label: "Java Language (.java Source)",
        color: "primary",
        children: [
          {
            label: "javac Compiler (Source -> Bytecode)",
            color: "info",
            children: [
              {
                label: "Class File (.class Bytecode)",
                color: "accent",
                children: [
                  {
                    label: "JVM (Classloader -> Verifier -> JIT Engine)",
                    color: "warning",
                    children: [
                      { label: "Host OS & CPU Architecture (Windows, Linux, macOS)", color: "success" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  q005: {
    type: "table-visual",
    title: "Java vs C++ Core Architecture",
    data: [
      {
        label: "Memory Management",
        color: "primary",
        children: [
          { label: "Java: Automatic GC (No dangling pointers, no manual delete)" },
          { label: "C++: Manual / RAII (delete, unique_ptr, shared_ptr)" },
        ],
      },
      {
        label: "Execution Model",
        color: "info",
        children: [
          { label: "Java: Bytecode on JVM (WORA, platform-neutral)" },
          { label: "C++: Direct native compilation per OS/CPU" },
        ],
      },
      {
        label: "Pointers & Safety",
        color: "accent",
        children: [
          { label: "Java: Strongly-typed references, bounds-checked arrays" },
          { label: "C++: Raw pointers, pointer arithmetic, buffer overruns possible" },
        ],
      },
      {
        label: "Multiple Inheritance",
        color: "success",
        children: [
          { label: "Java: Single class inheritance + multiple interfaces (No diamond problem)" },
          { label: "C++: Multiple class inheritance (Virtual inheritance required)" },
        ],
      },
    ],
  },
  q011: {
    type: "table-visual",
    title: "Autoboxing & The Wrapper Cache Trap",
    data: [
      {
        label: "Integer Cache Range [-128..127]",
        color: "primary",
        children: [
          { label: "Integer.valueOf(100) returns cached object -> == is TRUE" },
          { label: "Integer.valueOf(1000) creates new instance -> == is FALSE" },
          { label: "Rule: ALWAYS use .equals() for wrapper object comparison" },
        ],
      },
      {
        label: "Unboxing Null Trap",
        color: "warning",
        children: [
          { label: "Integer count = null;" },
          { label: "int total = count; // Throws runtime NullPointerException!" },
        ],
      },
      {
        label: "Loop Performance Overhead",
        color: "accent",
        children: [
          { label: "Long sum = 0L; sum += i; inside 1M loop" },
          { label: "Allocates 1M temporary heap objects -> GC thrashing" },
        ],
      },
    ],
  },
  q029: {
    type: "flow",
    title: "equals() and hashCode() Contract Flow",
    direction: "vertical",
    data: [
      {
        label: "Are objects equal via a.equals(b)?",
        color: "primary",
        children: [{ label: "Reflexive, symmetric, transitive, consistent, non-null" }],
      },
      {
        label: "YES -> a.hashCode() MUST equal b.hashCode()",
        color: "success",
        children: [{ label: "Enables HashMap to find the identical bucket index" }],
      },
      {
        label: "NO -> Hash codes MAY be equal or different",
        color: "info",
        children: [{ label: "Equal hash codes for unequal objects = Hash Collision (chained)" }],
      },
      {
        label: "CRITICAL: Fields used in equals() MUST be immutable",
        color: "warning",
        children: [{ label: "Mutating key after put() results in lost entries & memory leaks" }],
      },
    ],
  },
  q065: {
    type: "table-visual",
    title: "Java Access Modifiers Scope Matrix",
    data: [
      {
        label: "private",
        color: "warning",
        children: [{ label: "Same Class: YES" }, { label: "Same Package: NO" }, { label: "Subclass (diff pkg): NO" }, { label: "World (everywhere): NO" }],
      },
      {
        label: "default (package-private)",
        color: "info",
        children: [{ label: "Same Class: YES" }, { label: "Same Package: YES" }, { label: "Subclass (diff pkg): NO" }, { label: "World (everywhere): NO" }],
      },
      {
        label: "protected",
        color: "accent",
        children: [{ label: "Same Class: YES" }, { label: "Same Package: YES" }, { label: "Subclass (diff pkg): YES" }, { label: "World (everywhere): NO" }],
      },
      {
        label: "public",
        color: "success",
        children: [{ label: "Same Class: YES" }, { label: "Same Package: YES" }, { label: "Subclass (diff pkg): YES" }, { label: "World (everywhere): YES" }],
      },
    ],
  },
  q091: {
    type: "flow",
    title: "Exception Handling Execution Pipeline",
    direction: "vertical",
    data: [
      { label: "try block executes risky I/O or business operation", color: "primary" },
      { label: "Exception thrown? Stack begins unwinding", color: "warning" },
      { label: "catch blocks evaluated top-to-bottom (subclasses first)", color: "info", children: [{ label: "Catches matching type, executes recovery logic" }] },
      { label: "finally block executes unconditionally", color: "accent", children: [{ label: "Always runs (unless System.exit() or JVM crash)" }] },
      { label: "Modern replacement: try-with-resources on AutoCloseable", color: "success" },
    ],
  },
  q190: {
    type: "flow",
    title: "Thread Life Cycle (6 JVM States)",
    direction: "horizontal",
    data: [
      { label: "NEW", color: "primary", children: [{ label: "Thread instantiated, before start()" }] },
      { label: "RUNNABLE", color: "success", children: [{ label: "Ready to run or executing on CPU" }] },
      { label: "BLOCKED / WAITING", color: "warning", children: [{ label: "BLOCKED: waiting for monitor lock" }, { label: "WAITING: wait(), join(), park()" }, { label: "TIMED_WAITING: sleep(), wait(timeout)" }] },
      { label: "TERMINATED", color: "info", children: [{ label: "run() finished or uncaught exception" }] },
    ],
  },
  q200: {
    type: "table-visual",
    title: "volatile vs synchronized vs Atomics",
    data: [
      {
        label: "volatile",
        color: "info",
        children: [{ label: "Visibility: YES (Direct main memory flush)" }, { label: "Atomicity: NO (count++ still causes race)" }, { label: "Lock Overhead: None (Memory barriers only)" }],
      },
      {
        label: "synchronized",
        color: "warning",
        children: [{ label: "Visibility: YES (Monitor exit releases to memory)" }, { label: "Atomicity: YES (Exclusive mutual exclusion)" }, { label: "Lock Overhead: Monitor acquire/release" }],
      },
      {
        label: "AtomicInteger (CAS)",
        color: "success",
        children: [{ label: "Visibility: YES (volatile value field)" }, { label: "Atomicity: YES (Hardware CAS instruction)" }, { label: "Lock Overhead: Lock-free optimistic retry" }],
      },
    ],
  },
  q225: {
    type: "layers",
    title: "Modern Java Evolution Pipeline",
    data: [
      {
        label: "Java 21 LTS (2023)",
        color: "primary",
        children: [
          { label: "Virtual Threads (Project Loom)", color: "info" },
          { label: "Pattern Matching for switch & Record Patterns", color: "info" },
          { label: "Sequenced Collections (addFirst, reversed)", color: "info" },
          {
            label: "Java 17 LTS (2021)",
            color: "accent",
            children: [
              { label: "Sealed Classes & Interfaces (permits)", color: "warning" },
              { label: "Java Records (Immutable data carriers)", color: "warning" },
              {
                label: "Java 8 LTS (2014)",
                color: "success",
                children: [
                  { label: "Lambdas, Stream API & CompletableFuture" },
                  { label: "Default & Static interface methods" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Mapping table from legacy question IDs to current Core Java Question IDs (q001..q226).
 * This enables all diagrams to render on the Question Detail Page and Table of Contents.
 */
const LEGACY_TO_QUESTION_ID_MAP: Record<string, string[]> = {
  b2: ["q004"],
  b3: ["q003"],
  b7: ["q013", "q014"],
  o1: ["q023"],
  o2: ["q033", "q034"],
  o3: ["q059"],
  o4: ["q032"],
  o5: ["q046"],
  o6: ["q055"],
  o9: ["q065"],
  o12: ["q050"],
  s1: ["q017"],
  s2: ["q016"],
  s3: ["q020", "q021"],
  ip1: ["q037"],
  ip5: ["q057"],
  e1: ["q098"],
  e2: ["q101"],
  e3: ["q093"],
  e7: ["q099"],
  e8: ["q102"],
  c1: ["q135"],
  c2: ["q145"],
  c3: ["q164"],
  c4: ["q152"],
  c6: ["q162"],
  c7: ["q167"],
  c9: ["q146"],
  mt1: ["q186"],
  mt4: ["q204"],
  mt6: ["q202"],
  mt7: ["q077"],
  mt8: ["q192"],
  g1: ["q178"],
  g2: ["q181"],
  g4: ["q182", "q183"],
  io3: ["q127"],
  mem1: ["q110"],
  mem2: ["q118", "q120"],
  mem3: ["q111", "q119"],
  st1: ["q210"],
  st2: ["q211"],
  st5: ["q212", "q213"],
  m4: ["q219"],
  m6: ["q006"],
  m8: ["q223"],
  m11: ["q156"],
  m12: ["q162"],
  m15: ["q057"],
};

for (const [legacyKey, qIds] of Object.entries(LEGACY_TO_QUESTION_ID_MAP)) {
  const diag = coreJavaVisualizations[legacyKey];
  if (diag) {
    for (const qId of qIds) {
      if (!coreJavaVisualizations[qId]) {
        coreJavaVisualizations[qId] = diag;
      }
    }
  }
}
