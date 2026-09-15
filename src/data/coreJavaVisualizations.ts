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
};
