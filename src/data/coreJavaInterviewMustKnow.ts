import type { InterviewQuestion } from "./coreJavaInterviewData";

function q(
  id: string,
  question: string,
  answer: string,
  explanation: string,
  code: string,
  codeLanguage = "java"
): InterviewQuestion {
  return { id, question, answer, explanation, code, codeLanguage };
}

/** Must-know interview questions — revise these before any Java round. */
export const mustKnowQuestionsByTopic: Record<string, InterviewQuestion[]> = {
  basics: [
    q(
      "b17",
      "What causes NullPointerException and how do you prevent it?",
      "**NullPointerException (NPE)** is thrown when you dereference `null` — calling a method, accessing a field, unboxing, or indexing.\n\n**Common causes**:\n- Forgot to initialize a field or local.\n- Method returns null and you chain calls (`user.getAddress().getCity()`).\n- Autounboxing a null `Integer`.\n- `Map.get(key)` when key is missing (returns null).\n\n**Prevention**:\n- Validate early (`Objects.requireNonNull`).\n- Use **Optional** for absent values (return types, not fields).\n- Null-safe utilities: `Objects.equals`, `Optional.ofNullable`.\n- **Records** + validation in compact constructors.\n- Static analysis / `@NonNull` annotations.\n\nJava 14+ helpful message: `Cannot invoke \"String.length()\" because \"s\" is null`.",
      "NPE = use of null reference. Guard with requireNonNull, Optional, and avoid chained calls on nullable returns.",
      `String city = Optional.ofNullable(user)\n    .map(User::getAddress)\n    .map(Address::getCity)\n    .orElse("Unknown");\n\nObjects.requireNonNull(name, "name must not be null");\n\n// BAD: user.getProfile().getBio()  // NPE if profile is null`
    ),
    q(
      "b18",
      "Difference between == and .equals() for String interview trap?",
      "For **String** specifically, interviewers love this trap:\n\n- **Literals** are interned in the pool: `String a = \"Hi\"; String b = \"Hi\";` → `a == b` is **true** (same pool reference).\n- **`new String(\"Hi\")`** creates a **new heap object**: `==` is false even if content matches; **`.equals()`** is true.\n- **Always use `.equals()`** for content comparison; use `==` only when you intentionally compare identity (rare for Strings).\n\nFor **wrappers**: Integer cache -128..127 makes `==` appear to work — still use `.equals()`.\n\nFor **primitives**: only `==` applies (no `.equals()` on int).",
      "String pool makes == work for literals only. new String() breaks ==. Always equals() for content.",
      `String a = "Java", b = "Java";\nString c = new String("Java");\nSystem.out.println(a == b);       // true (pool)\nSystem.out.println(a == c);       // false\nSystem.out.println(a.equals(c)); // true\n\nInteger x = 127, y = 127;\nSystem.out.println(x == y);       // true (cached)\nInteger p = 128, q = 128;\nSystem.out.println(p == q);       // false`
    ),
    q(
      "b19",
      "What is the difference between JDK 8 and JDK 11+ for interviews?",
      "**JDK 8 (2014)** — still common in legacy systems:\n- Lambdas, Streams, `Optional`, default interface methods.\n- `java.time` API (replace Date/Calendar).\n- Parallel streams, `CompletableFuture`.\n\n**JDK 11 (2018 LTS)** — major baseline today:\n- **No separate JRE** — ship JDK or custom runtime via `jlink`.\n- `var` local inference (actually Java 10).\n- `HttpClient` in standard library.\n- Removed Java EE modules (JAXB, etc. — add deps explicitly).\n\n**JDK 17 LTS**: sealed classes, records, pattern matching for `instanceof`.\n**JDK 21 LTS**: virtual threads, sequenced collections, pattern matching for `switch`.\n\nInterview tip: know which features your project uses and LTS release cadence (8, 11, 17, 21).",
      "Java 8 = lambdas/streams. 11+ = modular JDK, no standalone JRE. 17/21 add records, sealed classes, virtual threads.",
      `// Java 8+\nList<String> names = users.stream()\n    .map(User::name)\n    .filter(n -> !n.isBlank())\n    .toList();  // Java 16+ unmodifiable list\n\n// Java 11 HttpClient\nvar client = HttpClient.newHttpClient();\nvar req = HttpRequest.newBuilder(URI.create(url)).build();`
    ),
    q(
      "b20",
      "What is a static initializer block?",
      "A **static block** runs **once** when the class is **loaded** by the ClassLoader, before any static method or constructor.\n\n```java\nstatic { ... }\n```\n\n**Use cases**: complex static field initialization, loading native libraries (`System.loadLibrary`), registering drivers.\n\n**Order**: static fields (top to bottom) → static blocks → instance fields → instance init blocks → constructor.\n\n**Interview trap**: static blocks can throw exceptions → `ExceptionInInitializerError` on first use of the class.",
      "static { } runs once at class load. Used for heavy static setup. Failure → ExceptionInInitializerError.",
      `class Config {\n    static final Map<String, String> PROPS = new HashMap<>();\n    static {\n        PROPS.put("env", System.getenv("APP_ENV"));\n        PROPS.put("region", "in");\n    }\n}`
    ),
  ],

  oops: [
    q(
      "o16",
      "Can an interface have a constructor?",
      "**No.** Interfaces cannot have constructors. You cannot instantiate an interface with `new`.\n\nInterfaces describe a **contract** (abstract/instance methods, default/static methods, constants). Implementing classes provide constructors.\n\n**Since Java 8**: default and static methods in interfaces reduce the need for abstract adapter classes.\n\n**Abstract class** can have constructors (called via `super()` from subclass) — one reason to pick abstract class over interface when shared initialization logic exists.",
      "Interfaces have no constructors. Only classes (including abstract classes) do.",
      `interface Payable {\n    void pay(double amount);\n    default void log(double amt) { System.out.println(amt); }\n}\n\nabstract class Payment implements Payable {\n    protected final String id;\n    Payment(String id) { this.id = id; }  // abstract class CAN\n}`
    ),
    q(
      "o17",
      "What is method hiding vs method overriding?",
      "**Overriding**: instance method in subclass, same signature, **runtime dispatch** on actual object type. Use `@Override`.\n\n**Hiding (shadowing)**: **static** method in subclass with same signature as parent static method. **Compile-time** binding uses reference type. Not polymorphic.\n\n**Field hiding**: subclass field with same name as parent — access via reference type, not runtime type.\n\nRule: call static methods via `ClassName.method()`, not instance reference.",
      "Override = instance + runtime. Hide = static/fields + compile-time reference type.",
      `class Parent {\n    static void show() { System.out.println("Parent static"); }\n    void speak() { System.out.println("Parent instance"); }\n}\nclass Child extends Parent {\n    static void show() { System.out.println("Child static"); }\n    @Override void speak() { System.out.println("Child instance"); }\n}\nParent p = new Child();\np.show();   // Parent static — hiding\np.speak();  // Child instance — override`
    ),
    q(
      "o18",
      "What is the difference between abstraction and encapsulation?",
      "**Encapsulation**: hide **internal state**, expose controlled API (private fields + public methods). Answers *how do we protect data?*\n\n**Abstraction**: hide **implementation complexity**, show essential behavior. Answers *what can this thing do without caring how?* Achieved via abstract classes and interfaces.\n\nExample: `List` interface (abstraction) — `ArrayList` hides resizing logic (encapsulation of internal array).\n\nYou need both: encapsulation protects invariants; abstraction lets clients depend on stable contracts.",
      "Encapsulation = data hiding. Abstraction = complexity hiding via interfaces/abstract types.",
      `interface Storage {              // abstraction — what\n    void save(String key, byte[] data);\n}\nclass FileStorage implements Storage {\n    private final Path root;       // encapsulation — hidden state\n    public void save(String key, byte[] data) {\n        Files.write(root.resolve(key), data);\n    }\n}`
    ),
    q(
      "o19",
      "What is a nested class? When to use static nested vs inner?",
      "**Nested class**: class defined inside another class.\n\n**Static nested** (`static class Nested`): no reference to outer instance. Like a normal top-level class, just scoped for packaging. Use for helpers (Builder pattern).\n\n**Inner (non-static) member class**: holds implicit reference to outer `Outer.this`. Can access outer private members. Use for iterators/callbacks tightly coupled to one outer instance.\n\n**Local / anonymous**: inside methods; anonymous for one-off listeners (lambdas replace many cases).\n\nMemory: inner class can leak outer if stored longer than outer lives.",
      "static nested = no outer ref. Inner member = needs outer instance. Watch memory leaks with inner classes.",
      `class Outer {\n    private int x = 10;\n    class Inner {\n        int getX() { return x; }  // uses Outer.this.x\n    }\n    static class Helper {\n        static int doubleIt(int n) { return n * 2; }\n    }\n}`
    ),
  ],

  strings: [
    q(
      "s10",
      "Why is String concatenation in a loop slow?",
      "Each `s = s + part` in a loop creates a **new String object** because String is **immutable**. For n iterations this is **O(n²)** character copying.\n\n**Fix**: use `StringBuilder` (single-thread) or `StringBuffer` (synchronized):\n```java\nStringBuilder sb = new StringBuilder();\nfor (...) sb.append(part);\nreturn sb.toString();\n```\n\n**Java 8+**: `String.join`, `Collectors.joining`, or stream `reduce` for list joins.\n\nCompiler may optimize **constant** concatenation at compile time (`\"a\" + \"b\"` → `\"ab\"`), but not variable loops.",
      "Loop concat creates many String objects. Use StringBuilder for dynamic building.",
      `// BAD — O(n²)\nString result = "";\nfor (String w : words) result += w;\n\n// GOOD\nStringBuilder sb = new StringBuilder();\nfor (String w : words) sb.append(w);\nString result = sb.toString();\n\n// Also good\nString joined = String.join("", words);`
    ),
    q(
      "s11",
      "What are common String.split() pitfalls?",
      "`split(regex)` uses **regular expressions**, not plain strings.\n\n**Pitfalls**:\n- `.` matches any char — split on literal dot: `split(\"\\\\.\")`.\n- `|` is OR in regex — escape: `split(\"\\\\|\")`.\n- Trailing empty strings dropped unless limit used: `\"a,,\".split(\",\")` → `[\"a\"]`; use `split(\",\", -1)` to keep empties.\n- `split` on empty string → `[\"\"]`.\n\nFor simple delimiter, consider `StringTokenizer` (legacy) or manual index scan; for complex parsing use regex `Pattern` explicitly.",
      "split takes regex. Escape metacharacters. Use limit -1 to preserve trailing empty tokens.",
      `String csv = "a,b,c,";\nSystem.out.println(Arrays.toString(csv.split(",")));      // [a, b, c]\nSystem.out.println(Arrays.toString(csv.split(\",\", -1))); // [a, b, c, ]\n\nString ip = "192.168.1.1";\nString[] parts = ip.split(\"\\\\.\");  // escape dot`
    ),
  ],

  "inheritance-polymorphism": [
    q(
      "ip9",
      "Can you instantiate an abstract class?",
      "**No.** Abstract classes cannot be instantiated with `new AbstractClass()`. They may contain abstract methods (no body) and/or concrete methods.\n\nSubclasses **must** implement all abstract methods (unless subclass is also abstract).\n\nYou can hold a reference: `Animal a = new Dog();` where `Animal` is abstract and `Dog` is concrete.\n\nAbstract class vs interface: abstract class can have state, constructors, and single inheritance.",
      "Abstract classes are incomplete templates. Only concrete subclasses can be instantiated.",
      `abstract class Shape {\n    abstract double area();\n    void describe() { System.out.println("Shape area=" + area()); }\n}\nclass Circle extends Shape {\n    double r;\n    Circle(double r) { this.r = r; }\n    double area() { return Math.PI * r * r; }\n}\nShape s = new Circle(5);  // OK — concrete subclass`
    ),
    q(
      "ip10",
      "What is instance initializer block?",
      "An **instance initializer block** runs **before each constructor** for every object created:\n\n```java\n{ System.out.println(\"init block\"); }\n```\n\n**Order**: superclass constructors → instance fields → instance init blocks (source order) → constructor body.\n\nRare in modern code; prefer constructor or factory. Used when multiple constructors share setup. Static init is separate (`static { }`).",
      "Instance { } blocks run before every constructor. Order: super() chain, fields, blocks, constructor body.",
      `class Demo {\n    int x;\n    { x = 42; System.out.println("instance init"); }\n    Demo() { System.out.println("constructor"); }\n}\n// new Demo() prints: instance init, then constructor`
    ),
  ],

  "exception-handling": [
    q(
      "e15",
      "What happens if both try and finally throw exceptions?",
      "If **try** throws exception A and **finally** throws exception B:\n- Exception **B propagates** (finally wins).\n- Exception **A is suppressed** (lost in old code).\n\n**try-with-resources** (Java 7+): primary exception from try is kept; close() exceptions are **suppressed** — accessible via `getSuppressed()`. This is the correct behavior.\n\n**Best practice**: never return from finally; never throw from finally unless aborting entirely. Keep finally for cleanup only.",
      "Plain try-finally: finally exception masks try. try-with-resources preserves try exception and suppresses close errors.",
      `try {\n    throw new RuntimeException("try");\n} finally {\n    throw new RuntimeException("finally"); // only this propagates\n}\n\n// try-with-resources keeps try exception as primary`
    ),
    q(
      "e16",
      "Should you catch Exception or Throwable?",
      "**Generally no** in application code.\n\n- **Throwable**: catches **Error** too (OOM, StackOverflow) — you cannot recover meaningfully; masks JVM death.\n- **Exception**: catches checked + unchecked — too broad; hides bugs (`NPE`, `IllegalArgumentException`).\n\n**Do**: catch **specific** exceptions you can handle (`IOException`, `SQLException`).\n\n**Framework boundaries** ( servlet filter, top-level handler): may catch `Exception`, log, return 500 — still avoid `Error`.\n\n**Rule**: catch the most specific type that you can actually recover from.",
      "Catch specific exceptions. Avoid Throwable. Do not catch Exception unless you rethrow or are a top-level handler.",
      `try {\n    processFile(path);\n} catch (FileNotFoundException e) {\n    return Optional.empty();\n} catch (IOException e) {\n    throw new ServiceException("IO failed", e);\n}`
    ),
  ],

  collections: [
    q(
      "c17",
      "What is ConcurrentModificationException?",
      "**CME** is thrown by **fail-fast** iterators when the collection is **structurally modified** (add/remove/clear) after the iterator was created, except via the iterator's own `remove()`.\n\n**Mechanism**: `modCount` on collection vs expected count in iterator.\n\n**Fix**: use `Iterator.remove()`, `removeIf()`, or concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`).\n\n**Not guaranteed** in multithreaded code without sync — best-effort detection in single thread.",
      "Do not modify collection during enhanced for-each. Use iterator.remove or concurrent collections.",
      `List<String> list = new ArrayList<>(List.of("a", "b"));\nfor (String s : list) {\n    // list.remove(s);  // ConcurrentModificationException\n}\nlist.removeIf(s -> s.equals("a"));  // safe`
    ),
    q(
      "c18",
      "What are immutable collections (List.of, Map.of)?",
      "Java 9+ factory methods create **unmodifiable** collections:\n- `List.of(a, b, c)`\n- `Set.of(a, b)`\n- `Map.of(k1, v1, k2, v2)`\n\n**Properties**: no add/remove/set; null elements/keys **not allowed** (`NullPointerException`). Iterators do not support remove.\n\n**Map.of** limited to 10 entries; use `Map.ofEntries` for more.\n\n**vs** `Collections.unmodifiableList(mutableList)` — wraps live list (changes visible). `List.of` is truly immutable snapshot.\n\n**Java 10+** `List.copyOf(collection)` — unmodifiable copy.",
      "List.of/Map.of are fixed-size, null-free, truly immutable. Prefer over Collections.unmodifiable for constants.",
      `List<String> langs = List.of("Java", "Kotlin"); // immutable\n// langs.add("Go");  // UnsupportedOperationException\n\nMap<String, Integer> scores = Map.of("Alice", 95, "Bob", 88);\nList<String> copy = List.copyOf(scores.keySet());`
    ),
    q(
      "c19",
      "How to implement LRU cache with LinkedHashMap?",
      "`LinkedHashMap` with **access-order** (`true` in constructor) moves entries on `get`/`put`.\n\nOverride `removeEldestEntry` to evict when size exceeds capacity — classic **LRU cache** pattern (used internally by many caches).\n\n**Not thread-safe** — wrap with `Collections.synchronizedMap` or use Caffeine/Guava in production.",
      "LinkedHashMap(accessOrder=true) + removeEldestEntry = simple LRU. Use concurrent cache libs in production.",
      `Map<String, String> lru = new LinkedHashMap<>(16, 0.75f, true) {\n    @Override protected boolean removeEldestEntry(Map.Entry<String, String> e) {\n        return size() > 100;\n    }\n};\nlru.put("k1", "v1");\nlru.get("k1");  // marks recently used`
    ),
    q(
      "c20",
      "What is WeakHashMap?",
      "`WeakHashMap` uses **weak keys**: when a key is only weakly reachable, GC can collect it and the entry is **removed** from the map.\n\n**Use case**: canonical mappings (cache keyed by object identity) without memory leaks — e.g. associating metadata with `Class` loaders.\n\n**Not** a general cache — entries disappear unpredictably when GC runs.\n\nValues are strongly referenced unless you also weak-reference values (Guava `MapMaker`).",
      "WeakHashMap keys are collected when no strong refs remain. Good for listener maps, not general caching.",
      `Map<Object, String> meta = new WeakHashMap<>();\nObject key = new Object();\nmeta.put(key, "data");\nkey = null;  // entry may be removed on next GC\nSystem.gc();`
    ),
  ],

  multithreading: [
    q(
      "mt18",
      "AtomicInteger vs synchronized — when to use which?",
      "**AtomicInteger** (and other `java.util.concurrent.atomic` types) use **CAS** (compare-and-swap) for lock-free updates on a **single variable** — very fast for counters, flags, sequence numbers.\n\n**synchronized** / **ReentrantLock**: protect **multiple fields** and **compound invariants** (check-then-act across several variables).\n\n**Rule**: simple increment `count++` on one int → `AtomicInteger`. Transfer money between two accounts → lock or transactional design.\n\n`volatile` alone does not make `count++` atomic (read-modify-write is two steps).",
      "Atomics for single-variable lock-free ops. synchronized/locks for multi-field critical sections.",
      `AtomicInteger counter = new AtomicInteger();\ncounter.incrementAndGet();           // lock-free\n\n// BAD: volatile int count; count++;\n\nsynchronized (this) {\n    balance -= amount;\n    other.balance += amount;         // needs lock\n}`
    ),
    q(
      "mt19",
      "What is BlockingQueue? Give one use case.",
      "`BlockingQueue` extends `Queue` with **blocking** `put`/`take`:\n- **put**: waits if queue is full (bounded queue).\n- **take**: waits if queue is empty.\n\nImplementations: `ArrayBlockingQueue`, `LinkedBlockingQueue`, `PriorityBlockingQueue`, `DelayQueue`.\n\n**Producer-consumer** pattern: producer threads `put` tasks; pool of consumers `take` — decouples rate and smooths bursts.\n\n`ExecutorService` thread pools use internal work queues.",
      "BlockingQueue = thread-safe queue with blocking put/take. Classic producer-consumer.",
      `BlockingQueue<Runnable> queue = new ArrayBlockingQueue<>(100);\nqueue.put(task);           // blocks if full\nRunnable job = queue.take(); // blocks if empty\n\nExecutorService pool = Executors.newFixedThreadPool(4); // uses internal queue`
    ),
    q(
      "mt20",
      "Difference between sleep() and wait()?",
      "| | `Thread.sleep(ms)` | `Object.wait()` |\n|---|---|---|\n| Class | `Thread` static | `Object` instance |\n| Lock | does **not** release monitor | **releases** monitor on object |\n| Where | anywhere | inside `synchronized` block on same object |\n| Wake | time elapsed | `notify`/`notifyAll` or interrupt |\n\n**sleep**: pause current thread without giving up lock.\n**wait**: thread waits until notified; must re-acquire lock after wake.\n\nNever call `wait()` on `Thread` object for coordination — use proper lock object.",
      "sleep keeps lock; wait releases lock and needs synchronized + notify. Different purposes.",
      `synchronized (lock) {\n    while (!ready) lock.wait();   // releases lock\n    doWork();\n}\n\nThread.sleep(1000);  // does NOT release any lock you hold`
    ),
    q(
      "mt21",
      "What is thread starvation?",
      "**Starvation**: a thread never gets CPU or lock access because others monopolize resources.\n\n**Causes**:\n- Unfair lock always granted to same thread.\n- High-priority threads hog CPU.\n- **Live lock** variant: threads keep yielding but make no progress.\n\n**vs Deadlock**: deadlock = circular wait forever; starvation = at least one thread blocked indefinitely while others progress.\n\n**Fix**: fair locks (`new ReentrantLock(true)`), reasonable thread priorities, avoid holding locks during slow I/O.",
      "Starvation = thread cannot progress due to unfair scheduling or resource hogging. Not the same as deadlock.",
      `ReentrantLock fair = new ReentrantLock(true); // FIFO lock acquisition\nfair.lock();\ntry { /* critical */ } finally { fair.unlock(); }`
    ),
    q(
      "mt22",
      "What are virtual threads (Java 21)?",
      "**Virtual threads** (Project Loom, Java 21) are **lightweight** threads managed by the JVM, not 1:1 with OS threads.\n\nCreate: `Thread.startVirtualThread(() -> ...)` or `Executors.newVirtualThreadPerTaskExecutor()`.\n\n**Best for**: massive **blocking I/O** concurrency (HTTP calls, DB) — millions of tasks without thread pool exhaustion.\n\n**Avoid**: CPU-bound work on virtual threads without pinning awareness; synchronized blocks can **pin** carrier thread.\n\n**vs platform threads**: platform = OS thread, expensive (~MB stack). Virtual = cheap, block without blocking OS thread.",
      "Virtual threads = cheap JVM threads for I/O-heavy apps. Java 21+. Use per-task executor for blocking workloads.",
      `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    for (int i = 0; i < 10_000; i++) {\n        executor.submit(() -> httpClient.send(request));\n    }\n}`
    ),
  ],

  "inner-classes": [
    q(
      "ic8",
      "Explain Predicate, Function, Consumer, Supplier.",
      "Core **functional interfaces** in `java.util.function`:\n\n- **Supplier<T>**: `T get()` — no input, produces value (factory, lazy init).\n- **Consumer<T>**: `void accept(T)` — takes input, no return (forEach side effect).\n- **Function<T,R>**: `R apply(T)` — transform T → R (map).\n- **Predicate<T>**: `boolean test(T)` — filter condition.\n\nAll are `@FunctionalInterface` — one abstract method; lambdas and method refs implement them.\n\n**Composition**: `predicate.and()`, `function.andThen()`, `consumer.andThen()`.",
      "Supplier produces, Consumer consumes, Function transforms, Predicate tests. Foundation of Streams and Optional.",
      `Predicate<String> nonBlank = s -> s != null && !s.isBlank();\nFunction<String, Integer> len = String::length;\nConsumer<String> print = System.out::println;\nSupplier<Double> random = Math::random;\n\nlist.stream().filter(nonBlank).map(len).forEach(print);`
    ),
    q(
      "ic9",
      "What is a method reference? Types?",
      "Shorthand lambda when lambda only **calls one method**:\n\n- **Static**: `ClassName::staticMethod` → `x -> ClassName.staticMethod(x)`\n- **Instance on particular object**: `obj::method` → `x -> obj.method(x)`\n- **Instance on arbitrary object**: `Type::instanceMethod` → `(obj, x) -> obj.method(x)` used as `Type::method` with one arg\n- **Constructor**: `ArrayList::new` → `() -> new ArrayList<>()` or `n -> new ArrayList<>(n)`\n\nPrefer method refs when they improve readability; use lambda when logic is more than one call.",
      "Method references are compact lambdas. Four kinds: static, bound instance, unbound instance, constructor.",
      `list.stream().map(String::toUpperCase).forEach(System.out::println);\nlist.sort(String::compareToIgnoreCase);\nSupplier<List<String>> factory = ArrayList::new;`
    ),
  ],

  generics: [
    q(
      "g8",
      "Explain PECS (? extends vs ? super) with example.",
      "**PECS**: Producer **Extends**, Consumer **Super**.\n\n- **`? extends T`**: you **read** (produce) T from collection — upper bound. Cannot add (except null).\n- **`? super T`**: you **write** (consume) T into collection — lower bound. Read as Object.\n\n**Copy example**: copy from `List<? extends Number>` (source produces Numbers) to `List<? super Integer>` (dest consumes Integers).\n\nWrong wildcard → compile error on add/get.",
      "extends = read-only producer. super = write-only consumer. PECS names the collection's role.",
      `void copy(List<? extends Number> src, List<? super Integer> dest) {\n    for (Number n : src) dest.add(n.intValue()); // src read, dest write\n}\n\nList<Number> nums = List.of(1, 2.5);\nList<Object> out = new ArrayList<>();\ncopy(nums, out);`
    ),
    q(
      "g9",
      "Why can't you create new T() in a generic class?",
      "Due to **type erasure**, `T` becomes `Object` (or bound) at runtime — JVM does not know `T` is `String` vs `Integer`.\n\nTherefore illegal:\n```java\nT obj = new T();       // compile error\nT[] arr = new T[10];   // compile error\n```\n\n**Workarounds**:\n- Pass `Class<T>` and use `clazz.getDeclaredConstructor().newInstance()`.\n- Use `Supplier<T>` factory.\n- `ArrayList` uses `Object[]` internally with casts.",
      "Erasure removes type at runtime. Use Class<T> or Supplier<T> to construct generic instances.",
      `class Box<T> {\n    private final Supplier<T> factory;\n    Box(Supplier<T> factory) { this.factory = factory; }\n    T create() { return factory.get(); }\n}\nBox<String> b = new Box<>(String::new);`
    ),
  ],

  io: [
    q(
      "io8",
      "try-with-resources — how does it work?",
      "Java 7+ **try-with-resources** auto-closes resources implementing `AutoCloseable`:\n\n```java\ntry (Resource r = open()) { use(r); }\n```\n\nCompiler generates `finally` that calls `close()` in reverse order. Suppressed exceptions from close are attached to primary exception.\n\n**Java 9+**: effectively final variables can be used: `BufferedReader br = ...; try (br) { }`.\n\nAlways prefer over manual `finally { close() }` — handles null and exception chaining correctly.",
      "AutoCloseable resources closed automatically. Primary exception preserved; close errors suppressed.",
      `try (BufferedReader br = Files.newBufferedReader(path);\n     PrintWriter pw = new PrintWriter(out)) {\n    br.lines().forEach(pw::println);\n} // both closed, even on exception`
    ),
    q(
      "io9",
      "NIO Files API vs old File class?",
      "**java.io.File** (legacy): mutable path string, limited error handling, no symbolic links API.\n\n**java.nio.file** (NIO.2, Java 7): `Path`, `Files` utility class.\n\n**Files** provides: `readString`/`writeString`, `walk`, `copy`, `move`, `createDirectories`, `lines` stream, attributes, `WatchService`.\n\nPaths are immutable; exceptions are proper `IOException`. Prefer `Path.of(...)` and `Files.*` for new code.",
      "Use Path + Files from java.nio.file instead of legacy File for modern I/O.",
      `Path dir = Path.of("logs");\nFiles.createDirectories(dir);\nFiles.writeString(dir.resolve("app.log"), line, StandardOpenOption.APPEND);\nlong size = Files.size(dir.resolve("app.log"));`
    ),
  ],

  memory: [
    q(
      "mem9",
      "Minor GC vs Major GC vs Full GC?",
      "**Young generation** collections = **Minor GC** (Eden + Survivor). Fast, frequent, stop-the-world but short.\n\n**Old generation** collection = **Major GC** (often used loosely).\n\n**Full GC**: collects **entire heap** (young + old + sometimes metaspace). Longer pauses — tune to avoid in latency-sensitive apps.\n\n**G1/ZGC/Shenandoah**: different terminology; focus on pause targets.\n\nInterview: many short-lived objects die in minor GC; promote long-lived to old gen.",
      "Minor = young gen, frequent. Full = whole heap, costly pauses. Most objects die young.",
      `// JVM flags (examples)\n// -Xms512m -Xmx2g -XX:+UseG1GC\n// jcmd <pid> GC.heap_info`
    ),
    q(
      "mem10",
      "What is Metaspace? PermGen vs Metaspace?",
      "**PermGen** (Java 7 and earlier): fixed-size area for class metadata, interned strings (partially), static refs — **OutOfMemoryError: PermGen space** common with hot redeploy.\n\n**Metaspace** (Java 8+): class metadata in **native memory**, grows by default (limited by `-XX:MaxMetaspaceSize`).\n\n**Heap** still holds Class objects and instances; Metaspace holds method bytecode, constant pool structures, etc.\n\nClassloader leaks (holding refs to unloaded app's loader) still cause Metaspace growth.",
      "Java 8+ uses Metaspace (native) instead of PermGen for class metadata. Still can OOM if classloaders leak.",
      `// -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=256m\n// Leak: static Map<ClassLoader, ...> holding old loaders`
    ),
    q(
      "mem11",
      "What is -Xms and -Xmx?",
      "**`-Xms`**: initial **heap** size at JVM start.\n**`-Xmx`**: **maximum** heap size JVM may grow to.\n\nSetting **`-Xms` = `-Xmx`** avoids resize churn but commits memory upfront.\n\nToo small `Xmx` → frequent GC or `OutOfMemoryError`. Too large → long GC pauses on some collectors.\n\n**Not** stack size (`-Xss`) or metaspace (`-XX:MaxMetaspaceSize`). Container/K8s: respect cgroup memory limits.",
      "Xms = starting heap, Xmx = max heap. Tune with profiling; equal values avoid heap resizing.",
      `java -Xms1g -Xmx1g -jar app.jar\n// Container: ensure Xmx < pod memory limit (leave room for metaspace, threads, native)`
    ),
  ],

  "streams-api": [
    q(
      "st10",
      "What is Optional and common anti-patterns?",
      "`Optional<T>` wraps a value that may be absent — **return type** for APIs, not fields/parameters/collections.\n\n**Good**: `return Optional.ofNullable(findUser(id));` caller uses `orElse`, `orElseThrow`, `map`, `flatMap`.\n\n**Anti-patterns**:\n- `optional.get()` without `isPresent()` check.\n- `Optional.of(null)` → NPE; use `ofNullable`.\n- Using Optional as field or method parameter (use overloads or null with docs).\n- `if (opt.isPresent()) opt.get()` — use `ifPresent` or `map`.\n\nJava 9+: `stream()`, `or`, `ifPresentOrElse`.",
      "Optional for return types only. Never get() blindly. Prefer map/flatMap/orElseThrow.",
      `return findByEmail(email)\n    .map(User::getName)\n    .orElse("Guest");\n\nUser user = repo.find(id)\n    .orElseThrow(() -> new NotFoundException(id));`
    ),
    q(
      "st11",
      "Collectors.groupingBy — explain with example.",
      "`Collectors.groupingBy(classifier)` splits stream into `Map<K, List<T>>` by key from classifier function.\n\n**Overload** with **downstream** collector: `groupingBy(classifier, downstream)` — e.g. count per group: `groupingBy(User::dept, counting())`.\n\n**Concurrent** variant for parallel streams.\n\nCommon interview task: frequency map, partition by predicate (`partitioningBy`), nested grouping.",
      "groupingBy builds Map of lists by key. Add downstream collector for counts, sets, etc.",
      `Map<String, Long> countByDept = employees.stream()\n    .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));\n\nMap<String, List<String>> namesByCity = people.stream()\n    .collect(Collectors.groupingBy(Person::city,\n        Collectors.mapping(Person::name, Collectors.toList())));`
    ),
    q(
      "st12",
      "Parallel stream — when is it faster?",
      "**Parallel streams** use `ForkJoinPool.commonPool()` to process spliterator chunks in parallel.\n\n**Faster when**:\n- Large data set (thousands+ elements).\n- **CPU-bound**, **stateless** operations (map/filter).\n- No shared mutable state.\n- Source splittable well (`ArrayList`, arrays, `IntStream.range`).\n\n**Slower when**:\n- Small lists (overhead > gain).\n- I/O inside stream (blocks common pool).\n- `LinkedList`, order-sensitive side effects.\n- Contention on synchronized resources.\n\nMeasure before assuming parallel helps.",
      "Parallel helps large CPU-bound stateless ops. Hurts small data, I/O, or ordered side effects.",
      `long sum = LongStream.range(0, 10_000_000)\n    .parallel()\n    .sum();\n\n// BAD: list.parallelStream().forEach(this::saveToDb); // blocks pool`
    ),
  ],

  misc: [
    q(
      "m31",
      "What is the Builder pattern?",
      "**Builder** constructs complex objects step-by-step when constructor has many optional parameters.\n\nAvoids telescoping constructors and unclear argument order.\n\n**Java**: static nested `Builder` class, fluent `return this` methods, `build()` validates and calls private constructor.\n\n**Lombok** `@Builder` generates boilerplate. **Records** for immutable data with few fields may replace Builder.\n\nThread-safety: build once, then immutable object.",
      "Builder = fluent stepwise construction for objects with many optional fields.",
      `class Pizza {\n    private final String size, crust;\n    private Pizza(Builder b) { size = b.size; crust = b.crust; }\n    static class Builder {\n        String size, crust;\n        Builder size(String s) { size = s; return this; }\n        Builder crust(String c) { crust = c; return this; }\n        Pizza build() { return new Pizza(this); }\n    }\n}\nPizza p = new Pizza.Builder().size("L").crust("thin").build();`
    ),
    q(
      "m32",
      "Record vs class — when to use record?",
      "**Record** (Java 16+): immutable **data carrier** — compiler generates constructor, accessors, `equals`, `hashCode`, `toString`.\n\n```java\nrecord Point(int x, int y) {}\n```\n\n**Use for**: DTOs, value objects, tuple-like returns.\n\n**Cannot**: extend classes (implicitly final), no instance fields beyond components (can have static fields, compact constructor for validation).\n\n**Class** when: mutable state, inheritance, JPA entities (records poor fit), complex behavior.\n\nRecords work great with `switch` pattern matching (Java 21).",
      "Record = concise immutable data class. Class for mutable behavior and inheritance.",
      `record User(String id, String email) {\n    User {  // compact constructor\n        Objects.requireNonNull(id);\n        email = email == null ? "" : email.trim();\n    }\n}\n\nUser u = new User("u1", "a@b.com");\nSystem.out.println(u.email());  // accessor, not getEmail()`
    ),
    q(
      "m33",
      "What is shallow copy vs deep copy?",
      "**Shallow copy**: new object, but **reference fields** point to same nested objects as original. `Object.clone()` default is shallow (if `Cloneable`).\n\n**Deep copy**: recursively copy nested objects so original and copy are fully independent.\n\n**Java approaches**:\n- Copy constructor / factory taking original.\n- Serialization round-trip (slow, needs `Serializable`).\n- Manual clone or libraries (Apache Commons, Jackson `readValue(writeValueAsString)`).\n\n`List.copyOf` / `new ArrayList<>(list)` shallow-copies list structure, not mutable elements inside.",
      "Shallow shares nested refs. Deep clones entire graph. Prefer copy constructors for clarity.",
      `class Team implements Cloneable {\n    List<Player> players;\n    @Override protected Object clone() {\n        Team t = (Team) super.clone();\n        t.players = new ArrayList<>(players); // shallow — same Player refs\n        return t;\n    }\n}`
    ),
    q(
      "m34",
      "How do you implement equals() and hashCode() correctly?",
      "**equals contract**: reflexive, symmetric, transitive, consistent; `null` → false.\n\n**Steps**:\n1. `if (this == o) return true;`\n2. `if (!(o instanceof MyType that)) return false;` (pattern matching)\n3. Compare **significant fields** with `Objects.equals`.\n\n**hashCode**: same fields as equals; use `Objects.hash(f1, f2)`.\n\n**Records** generate both. **IDE** generates. **Never** use mutable fields in hashCode if object used as HashMap key.\n\n**Lombok** `@EqualsAndHashCode`.",
      "Check same class, compare key fields. hashCode must use same fields as equals.",
      `@Override public boolean equals(Object o) {\n    if (this == o) return true;\n    if (!(o instanceof Person p)) return false;\n    return Objects.equals(id, p.id);\n}\n@Override public int hashCode() { return Objects.hash(id); }`
    ),
    q(
      "m35",
      "What is Comparator.comparing?",
      "`Comparator.comparing(keyExtractor)` builds a Comparator from a field/function — null-safe with `nullsFirst`/`nullsLast`.\n\nChain: `.thenComparing` for secondary sort keys.\n\n**vs Comparable**: `Comparable` is natural order **inside** the class (`compareTo`). `Comparator` is **external**, multiple orders per type.\n\nJava 8+ replaces verbose anonymous Comparator classes.",
      "comparing extracts sort key. thenComparing adds tie-breakers. External ordering vs Comparable.",
      `List<Employee> list = ...;\nlist.sort(Comparator\n    .comparing(Employee::dept)\n    .thenComparing(Employee::salary, Comparator.reverseOrder())\n    .thenComparing(Employee::name));`
    ),
    q(
      "m36",
      "What are sealed classes?",
      "**Sealed classes** (Java 17) restrict which classes may **extend** them:\n\n```java\nsealed interface Shape permits Circle, Rectangle {}\n```\n\nSubclasses must be `final`, `sealed`, or `non-sealed`.\n\n**Why**: exhaustive `switch` with pattern matching — compiler checks all permitted subtypes covered.\n\nModels closed hierarchies (AST nodes, payment types) better than open inheritance.",
      "sealed permits controls subclasses. Enables exhaustive pattern matching switches.",
      `sealed interface Expr permits Constant, Add {}\nrecord Constant(int v) implements Expr {}\nrecord Add(Expr left, Expr right) implements Expr {}\n\nint eval(Expr e) {\n    return switch (e) {\n        case Constant(int v) -> v;\n        case Add(var l, var r) -> eval(l) + eval(r);\n    };\n}`
    ),
    q(
      "m37",
      "transient and serialVersionUID?",
      "**Serialization** (`Serializable`): object written to bytes and restored.\n\n**`transient`**: field **skipped** during serialization (passwords, derived/cache fields). Reconstructed as default null/0.\n\n**`serialVersionUID`**: `static final long` version ID. Mismatch on deserialize → `InvalidClassException`. Declare explicitly when class evolves.\n\n**Modern alternative**: JSON (Jackson), records + DTOs, avoid Java serialization (security risks — gadget chains).",
      "transient excludes field from serialization. serialVersionUID versions the class for compatible deserialization.",
      `class User implements Serializable {\n    static final long serialVersionUID = 1L;\n    String name;\n    transient String sessionToken;  // not serialized\n}`
    ),
    q(
      "m38",
      "Big-O of HashMap get/put?",
      "**Average**: **O(1)** for `get` and `put` with good hash distribution.\n\n**Worst**: **O(n)** if all keys collide in same bucket (bad `hashCode` or attack) — Java 8+ converts long buckets to **trees** → **O(log n)** worst per bucket.\n\n**Load factor** default 0.75 triggers resize (rehash) when size > capacity × load factor — amortized O(1).\n\n**Key**: immutable keys with stable `hashCode`. `LinkedHashMap`/`TreeMap` add ordering overhead.",
      "HashMap average O(1). Worst O(log n) with treeified buckets. Resize when load factor exceeded.",
      `Map<String, Integer> map = new HashMap<>(); // initial cap 16, load 0.75\nmap.put("key", 1);   // amortized O(1)\nmap.get("key");      // O(1) average`
    ),
    q(
      "m39",
      "What is default method conflict in interfaces?",
      "When a class implements **two interfaces** with same **default method signature**, compiler error unless class **overrides** the method.\n\n**Resolution**:\n```java\n@Override public void m() { InterfaceA.super.m(); }\n```\n\n**Class vs interface**: class instance method **wins** over interface default.\n\n**Diamond**: one default in super-interface chain — inherited. Two unrelated defaults — must override.\n\nDesigned so Java 8 could add defaults to `Collection` without breaking implementations.",
      "Duplicate default methods from two interfaces require explicit override. Class method beats interface default.",
      `interface A { default void log() { System.out.println("A"); } }\ninterface B { default void log() { System.out.println("B"); } }\nclass C implements A, B {\n    @Override public void log() { A.super.log(); }\n}`
    ),
    q(
      "m40",
      "Switch expressions (Java 14+) vs switch statements?",
      "**Switch expression** yields a value: `var x = switch (n) { case 1 -> \"one\"; default -> \"other\"; };`\n\n**Arrow labels** `case 1 ->` — no fall-through (no break needed).\n\n**Colon form** with `yield` for multi-line blocks.\n\n**Exhaustive** with sealed types + patterns (Java 21): compiler ensures all cases covered.\n\n**Old switch**: fall-through bugs without `break`. Expression form is safer and assignable.",
      "Switch expressions return values. Arrow syntax prevents fall-through. Pattern matching enables exhaustive switches.",
      `String label = switch (day) {\n    case MONDAY, FRIDAY -> "busy";\n    case SATURDAY, SUNDAY -> "rest";\n    default -> {\n        yield "normal";\n    }\n};`
    ),
  ],
};
