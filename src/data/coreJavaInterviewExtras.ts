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

/** Extra high-frequency interview questions appended to existing topics. */
export const extraQuestionsByTopic: Record<string, InterviewQuestion[]> = {
  basics: [
    q(
      "b11",
      "Is Java pass-by-value or pass-by-reference?",
      "Java is **always pass-by-value**. The confusion comes from object parameters: what is copied is the **reference value**, not the object itself.\n\n**Primitives**: The actual value is copied. Changing the parameter does not change the caller's variable.\n\n**Objects**: The method receives a **copy of the reference**. Both copies point to the same heap object, so mutating fields is visible to the caller. Reassigning the parameter (`obj = new Thing()`) only changes the local copy — the caller's reference is unchanged.\n\nThere is no C++-style pass-by-reference (`&`) and no way to swap the caller's object by reassignment inside a method.",
      "Java copies the argument. For objects that copy is the reference, so mutations are visible but reassignment is not.",
      `void bump(int n) { n++; }          // caller's int unchanged\nvoid rename(User u) { u.name = "Ada"; } // caller's User mutated\nvoid replace(User u) { u = new User(); } // caller's User unchanged`
    ),
    q(
      "b12",
      "What methods does java.lang.Object provide?",
      "Every class inherits from **Object**. The methods you are expected to know:\n\n- **equals(Object)** — logical equality (override with hashCode).\n- **hashCode()** — hash for HashMap/HashSet; must be consistent with equals.\n- **toString()** — human-readable form (override for debugging).\n- **getClass()** — runtime Class object (final).\n- **clone()** — shallow copy if Cloneable (protected; prefer copy constructors).\n- **wait / notify / notifyAll** — monitor methods; must hold the object's lock.\n- **finalize()** — deprecated GC hook; never use.\n\nInterview follow-up: you almost always override equals, hashCode, and toString together for value types.",
      "Object is the root type. Know equals, hashCode, toString, getClass, and wait/notify. Override equals and hashCode together.",
      `class Point {\n    int x, y;\n    @Override public boolean equals(Object o) {\n        return o instanceof Point p && x == p.x && y == p.y;\n    }\n    @Override public int hashCode() { return Objects.hash(x, y); }\n    @Override public String toString() { return "Point(" + x + "," + y + ")"; }\n}`
    ),
    q(
      "b13",
      "What is a constructor? Constructor vs method?",
      "A **constructor** initializes a new instance. It has the **same name as the class**, no return type (not even void), and is invoked with `new`.\n\n**Types**: default (compiler-generated no-arg if you write none), no-arg, parameterized, copy constructor (convention).\n\n**Vs method**: Methods have a return type and can be called anytime. Constructors cannot be inherited, overridden, or made abstract/static/synchronized in the usual sense (they can be private — used for singletons/factories).\n\nIf you define any constructor, Java **does not** generate the default no-arg constructor.",
      "Constructors initialize objects, share the class name, and have no return type. Defining any constructor suppresses the default no-arg constructor.",
      `class User {\n    final String name;\n    User(String name) { this.name = name; }  // parameterized\n    User(User other) { this.name = other.name; } // copy\n}\n// new User();  // compile error — no no-arg constructor`
    ),
    q(
      "b14",
      "What is the JIT compiler?",
      "The **Just-In-Time (JIT)** compiler is part of HotSpot JVM. Bytecode starts in the **interpreter**. Hot methods (executed often) are compiled to **native machine code** and cached.\n\n**Why it matters**: Java can outperform naive interpretation and sometimes rival C++ on hot paths because JIT sees **runtime profiles** (branch frequencies, types) that a static compiler cannot.\n\n**Tiers (HotSpot)**: interpreter → C1 (client, fast compile) → C2 (server, heavy optimization). Flags like `-XX:+PrintCompilation` show JIT activity.\n\n**Related**: AOT compilation (`jaotc`, GraalVM native-image) compiles ahead of time — different trade-off (faster startup, less profile-guided optimization).",
      "JIT compiles hot bytecode to native code at runtime using profiling. That is why Java is fast after warmup.",
      `// Hot loop is a JIT candidate\nint sum = 0;\nfor (int i = 0; i < 1_000_000; i++) sum += i;\n// After warmup, this may run as optimized native code`
    ),
    q(
      "b15",
      "What is a package in Java? Why use packages?",
      "A **package** is a namespace for related classes (maps to a directory). Declaration: `package com.algoguru.java;` as the first statement in a file.\n\n**Benefits**:\n- Avoid name collisions (`java.util.Date` vs `java.sql.Date`).\n- Access control (package-private default).\n- Organize APIs (java.lang is auto-imported).\n\n**import** brings types into scope. `import static` imports static members. Wildcard `import java.util.*` does not import nested packages.\n\n**Java 9+**: packages live inside **modules** (`module-info.java`) for stronger encapsulation.",
      "Packages namespace classes, enable access control, and organize APIs. java.lang is imported automatically.",
      `package com.algoguru.core;\n\nimport java.util.List;\nimport static java.lang.Math.max;\n\npublic class Stats {\n    public int bigger(int a, int b) { return max(a, b); }\n}`
    ),
    q(
      "b16",
      "Compile-time error vs runtime error vs exception?",
      "**Compile-time errors**: Caught by `javac` — syntax errors, type mismatches, missing returns, using an uninitialized local, failing to handle a checked exception. The program never starts.\n\n**Runtime errors (Error)**: JVM-level failures after start — `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError`. Usually not recoverable.\n\n**Exceptions**: Application-level events represented by `Exception`. Checked exceptions must be declared/handled; unchecked (`RuntimeException`) are typically programming bugs (`NPE`, `IllegalArgumentException`).\n\nInterview phrasing: compilers catch **static** mistakes; the JVM reports **dynamic** failures.",
      "Compile-time = javac rejects the code. Runtime Error = JVM is unhealthy. Exception = recoverable (or bug) application event.",
      `int x; System.out.println(x);     // compile error — local not initialized\nint[] a = new int[0]; a[1] = 2;  // runtime: ArrayIndexOutOfBoundsException\n// OutOfMemoryError — heap exhausted (Error, not Exception)`
    ),
  ],

  oops: [
    q(
      "o11",
      "What is constructor chaining?",
      "Constructor chaining is calling one constructor from another so initialization logic is not duplicated.\n\n**Same class**: `this(args)` — must be the **first** statement.\n\n**Parent class**: `super(args)` — also first statement. You cannot write both `this()` and `super()` in the same constructor.\n\nIf you omit `super()`, the compiler inserts `super()`. If the parent has no no-arg constructor, you must call `super(...)` explicitly.\n\nChain order: `Object` → ... → parent → current class.",
      "Use this() to chain in the same class and super() to initialize the parent. Either must be the first statement.",
      `class Employee {\n    String name; int id;\n    Employee() { this("Unknown", 0); }\n    Employee(String name, int id) {\n        this.name = name;\n        this.id = id;\n    }\n}\nclass Manager extends Employee {\n    Manager(String name) { super(name, 1); }\n}`
    ),
    q(
      "o12",
      "What is a marker interface?",
      "A **marker (tag) interface** declares **no methods**. It only **marks** a class so the JVM or libraries can treat instances specially.\n\nClassic examples: `Serializable`, `Cloneable`, `RandomAccess`.\n\nThe JVM checks `instanceof Serializable` before allowing `ObjectOutputStream.writeObject`. `Cloneable` permits `Object.clone()`; otherwise `CloneNotSupportedException`.\n\n**Modern alternative**: annotations (`@FunctionalInterface`, `@Deprecated`) carry metadata without occupying the type hierarchy. Marker interfaces still matter for `instanceof` and historical APIs.",
      "Marker interfaces have no methods; they tag types (Serializable, Cloneable). Annotations are the modern metadata alternative.",
      `class User implements Serializable { }  // marker — no methods to implement\n\n// JVM / ObjectOutputStream checks:\nif (!(obj instanceof Serializable))\n    throw new NotSerializableException();`
    ),
    q(
      "o13",
      "Can you override a private or final method?",
      "**private**: Not inherited in the subclass's API. A same-signature method in the child is a **new method**, not an override. `@Override` fails to compile. Dynamic dispatch never sees the child's method through a parent reference.\n\n**final**: Explicitly **cannot** be overridden — compile error. Used to lock behavior (security, invariants).\n\n**static**: Hidden, not overridden (compile-time binding).\n\nOnly **instance** methods that are visible (not private) and non-final participate in runtime polymorphism.",
      "private methods are not overridden (new method). final methods cannot be overridden. static methods are hidden.",
      `class Parent {\n    private void hide() { System.out.println("P"); }\n    final void locked() { }\n}\nclass Child extends Parent {\n    // @Override void hide() {}  // compile error — not overriding\n    void hide() { System.out.println("C"); } // unrelated method\n    // void locked() {}          // compile error — final\n}`
    ),
    q(
      "o14",
      "What are default methods in interfaces? Why were they added?",
      "**Default methods** (Java 8) are interface methods with a body (`default void foo() { ... }`). Classes inherit the implementation unless they override it.\n\n**Why**: Adding a new abstract method to an existing interface (e.g. `Collection.stream()`) would break every implementor. Default methods let the JDK evolve APIs **without breaking binary compatibility**.\n\n**Rules**: A class method wins over an interface default. If two interfaces provide the same default, the class **must** override and may call `Interface.super.method()`.\n\n**static** methods in interfaces are allowed but not inherited by implementors.",
      "Default methods add implementation to interfaces so APIs can grow without breaking implementors. Conflicts must be resolved in the class.",
      `interface Logger {\n    default void log(String m) { System.out.println(m); }\n    static Logger noOp() { return m -> {}; }\n}\nclass AppLog implements Logger {\n    @Override public void log(String m) { System.out.println("[APP] " + m); }\n}`
    ),
    q(
      "o15",
      "What is coupling vs cohesion?",
      "**Coupling** is how tightly one class depends on another. **Low coupling** is the goal: depend on abstractions, not concrete classes; inject collaborators.\n\n**Cohesion** is how focused a class is. **High cohesion**: one class, one responsibility (SRP). Low cohesion: a god class that mixes persistence, UI, and business rules.\n\nInterview link: inheritance increases coupling (fragile base class). Composition + interfaces lowers coupling. High cohesion + low coupling is the OOP design target.",
      "Low coupling = few, abstract dependencies. High cohesion = one clear responsibility per class.",
      `// High coupling — OrderService constructs MySqlOrderRepo directly\n// Low coupling — depend on OrderRepository, inject implementation\nclass OrderService {\n    private final OrderRepository repo;\n    OrderService(OrderRepository repo) { this.repo = repo; }\n}`
    ),
  ],

  strings: [
    q(
      "s6",
      "Why store passwords in char[] instead of String?",
      "Security interview classic:\n\n1. **Strings are immutable** — you cannot wipe the contents after use. The password stays in the heap until GC (and may remain in dumps/intern pool).\n2. **char[] is mutable** — overwrite with zeros after authentication (`Arrays.fill(pwd, '\\0')`).\n3. **String may be interned or copied** in logs, exceptions, and substring (older JDKs shared the backing array).\n4. APIs like `Console.readPassword()` and `KeyStore` use `char[]` for this reason.\n\nStill wipe as soon as possible; GC is not a security boundary.",
      "String cannot be cleared; char[] can be overwritten. Prefer char[] for secrets and wipe after use.",
      `char[] password = System.console().readPassword();\ntry {\n    authenticate(password);\n} finally {\n    Arrays.fill(password, '\\0');  // wipe\n}`
    ),
    q(
      "s7",
      "What does String.intern() do?",
      "`intern()` returns the canonical **pool** reference for this character sequence. If the pool already has an equal string, that reference is returned; otherwise this string is added.\n\nLiterals are interned automatically. `new String(\"a\")` is **not** pooled until you call intern.\n\n**Use sparingly**: the pool lives for the JVM lifetime (historically PermGen; now heap). Interning huge unique strings can cause memory pressure. Prefer intern for a **small, repeated** set of tokens.",
      "intern() returns the unique pooled String. Literals are interned; new String() is not until intern() is called.",
      `String a = new String("java");\nString b = "java";\nSystem.out.println(a == b);          // false\nSystem.out.println(a.intern() == b); // true`
    ),
    q(
      "s8",
      "How many String objects does new String(\"Hello\") create?",
      "Typically **two** objects may be involved:\n\n1. The **literal** `\"Hello\"` is interned in the string pool (created once per unique literal in the class).\n2. `new String(...)` always allocates a **new heap String** that copies the content (Java 7+ copies; it does not share the pool object as the result of `new`).\n\nIf `\"Hello\"` was already pooled from an earlier literal, only **one additional** object is created by `new`. The interview answer: **one new heap object plus the pool entry if it did not already exist**.\n\n`String s = \"Hello\"` creates **zero or one** pool object and no extra heap wrapper.",
      "new String(\"Hello\") creates a new heap String. The literal also occupies the pool if not already present.",
      `String s1 = "Hello";                 // pool\nString s2 = new String("Hello");     // extra heap object\nSystem.out.println(s1 == s2);        // false\nSystem.out.println(s1.equals(s2));   // true`
    ),
    q(
      "s9",
      "What is compact strings (Java 9+)?",
      "Until Java 8, String stored `char[]` (UTF-16, 2 bytes per char). **JEP 254 Compact Strings** (Java 9) uses `byte[]` plus a **coder** flag:\n\n- **LATIN1** (coder=0): one byte per char when all characters are ≤ 255.\n- **UTF16** (coder=1): two bytes per char otherwise.\n\nMost English/ASCII strings use **half the memory**. APIs (`charAt`, `length`) still expose 16-bit chars. Interviewers ask this for JVM/memory rounds.",
      "Java 9+ Strings use byte[] with LATIN1 or UTF16 coder, saving memory for Latin-1 text.",
      `// Conceptual (not public API):\n// byte[] value;  byte coder; // LATIN1=0, UTF16=1\nString ascii = "Hello";   // typically LATIN1 compact\nString emoji = "Hi 😀";   // UTF16`
    ),
  ],

  "inheritance-polymorphism": [
    q(
      "ip6",
      "What is dynamic method dispatch?",
      "Dynamic method dispatch is how Java implements **runtime polymorphism** for instance methods. The JVM looks up the method in the **actual object's** class (vtable / itable), not the compile-time reference type.\n\n**Applies to**: overridable instance methods.\n**Does not apply to**: static methods, private methods, final methods, fields (fields are resolved on the reference type — field hiding).\n\nThis is why `Animal a = new Dog(); a.speak();` prints Dog's speak.",
      "The JVM picks the overridden instance method from the runtime object type. Fields and static methods are not dispatched this way.",
      `Animal a = new Dog();\na.speak();           // Dog.speak — dynamic dispatch\nSystem.out.println(a.kind); // Animal's field if hidden — static resolution`
    ),
    q(
      "ip7",
      "What is the Liskov Substitution Principle?",
      "LSP (Barbara Liskov): objects of a **subtype** must be usable anywhere a **supertype** is expected without breaking the program's correctness.\n\nIn Java terms: a `Square extends Rectangle` that overrides `setWidth` to also set height **violates LSP** if clients assume independent width/height.\n\n**Interview use**: prefer composition when the subclass cannot honor the parent's contract. Override without strengthening preconditions or weakening postconditions. Related to polymorphism and 'is-a' honesty.",
      "Subtypes must honor the parent contract. If they cannot, do not inherit — use composition.",
      `// Violates LSP: Square changing one side changes both\n// Better: Shape { double area(); } with Rectangle and Square as siblings`
    ),
    q(
      "ip8",
      "Difference between upcasting and downcasting?",
      "**Upcasting**: subclass → superclass (`Animal a = new Dog()`). Always safe; implicit. You can only call Animal methods unless you override (runtime dispatch still hits Dog).\n\n**Downcasting**: superclass → subclass (`Dog d = (Dog) a`). Explicit cast. Throws **ClassCastException** if the runtime type is wrong. Check with `instanceof` (pattern matching in Java 16+: `if (a instanceof Dog d)`).\n\nUpcast to write generic code; downcast only when you truly need subclass API.",
      "Upcasting is implicit and safe. Downcasting is explicit and can throw ClassCastException — use instanceof first.",
      `Animal a = new Dog();          // upcast\nif (a instanceof Dog d) {      // pattern matching (Java 16+)\n    d.bark();                  // safe downcast\n}`
    ),
  ],

  "exception-handling": [
    q(
      "e11",
      "Explain the Java exception hierarchy.",
      "`Throwable` is the root.\n\n- **Error**: JVM/system — `VirtualMachineError`, `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError`. Do not catch in app code.\n- **Exception**: application.\n  - **RuntimeException** (unchecked): `NPE`, `IllegalArgumentException`, `IndexOutOfBoundsException`, `ClassCastException`.\n  - **Checked** (other Exception subclasses): `IOException`, `SQLException`, `InterruptedException`.\n\n`throws` on methods is required for checked exceptions that are not caught. Errors and RuntimeExceptions are unchecked.",
      "Throwable → Error (don't catch) and Exception. RuntimeException is unchecked; other Exceptions are checked.",
      `// Throwable\n//  ├─ Error (OOM, StackOverflow)\n//  └─ Exception\n//       ├─ RuntimeException (unchecked)\n//       └─ IOException, ... (checked)`
    ),
    q(
      "e12",
      "What is multi-catch? Can catch blocks be reordered?",
      "Java 7 **multi-catch**: `catch (IOException | SQLException e)`. `e` is **effectively final**. Types must be siblings — you cannot catch both a type and its subtype in one multi-catch.\n\n**Order**: more **specific** catch blocks must come **before** more general ones. `catch (Exception e)` before `catch (IOException e)` is a compile error (unreachable).\n\nNever catch `Throwable`/`Error` unless you rethrow after logging in a framework boundary.",
      "Multi-catch uses |. More specific catch clauses must appear before general ones.",
      `try {\n    readAndQuery();\n} catch (IOException | SQLException e) {\n    log(e);\n} catch (Exception e) {\n    throw new IllegalStateException(e);  // wrap\n}`
    ),
    q(
      "e13",
      "Can a constructor throw an exception?",
      "Yes. Constructors may throw checked or unchecked exceptions. If checked, every constructor that calls `super(...)`/`this(...)` must declare or handle them. Callers of `new` must handle checked exceptions.\n\nIf a constructor throws, the object is **not** assigned to the variable — partially constructed objects can still be visible via `this` leaked from the constructor (anti-pattern).\n\nFactories often wrap construction exceptions into a single application exception.",
      "Constructors can throw. A thrown constructor means new did not complete; avoid leaking this.",
      `class Config {\n    Config(String path) throws IOException {\n        if (path == null) throw new IllegalArgumentException("path");\n        Files.readString(Path.of(path));  // checked\n    }\n}`
    ),
    q(
      "e14",
      "What is exception wrapping / chained exceptions?",
      "When you catch a low-level exception and throw a higher-level one, **chain the cause**: `throw new ServiceException(\"pay failed\", e)`.\n\n**Why**: callers see a domain exception; logs still have the root `SQLException` via `getCause()` and the stack. Never empty-catch and throw a new exception without the cause — you lose the original stack.\n\n`Throwable` constructors accept `(message, cause)`. `initCause` exists but constructor chaining is preferred.",
      "Wrap lower-level exceptions as the cause so context is preserved. Always pass the original exception.",
      `try {\n    repo.save(order);\n} catch (SQLException e) {\n    throw new OrderException("Could not save order " + order.id(), e);\n}`
    ),
  ],

  collections: [
    q(
      "c11",
      "Collection vs Collections?",
      "**Collection** is the **interface** (root of List, Set, Queue). It defines `add`, `remove`, `size`, `iterator`, etc.\n\n**Collections** is a **utility class** of static methods: `sort`, `binarySearch`, `reverse`, `shuffle`, `unmodifiableList`, `synchronizedList`, `emptyList`, `frequency`.\n\nInterview trap: `Collections.sort(list)` vs `list.sort(comparator)` (Java 8). Map is **not** a Collection; it has its own hierarchy.",
      "Collection is the interface. Collections is a helper class of static algorithms and wrappers.",
      `List<String> list = new ArrayList<>(List.of("c", "a", "b"));\nCollections.sort(list);                 // utility class\nlist.sort(Comparator.naturalOrder());   // instance method (Java 8+)`
    ),
    q(
      "c12",
      "Array vs ArrayList?",
      "**Array**: fixed length, can hold primitives, `arr.length` field, fastest random access, not a Collection.\n\n**ArrayList**: resizable, objects only (primitives autoboxed), `size()`, implements List, grows ~1.5×.\n\nUse arrays for tight primitive loops and JNI-sized buffers. Use ArrayList for almost all application lists. Convert with `Arrays.asList` (fixed-size view) vs `new ArrayList<>(List.of(...))` (real resizable list). `List.of` is unmodifiable.",
      "Arrays are fixed-size and can store primitives. ArrayList is resizable and stores objects.",
      `int[] nums = {1, 2, 3};                 // primitive array\nList<Integer> list = new ArrayList<>();\nlist.add(1);                            // autobox\nList<Integer> frozen = List.of(1, 2);   // immutable`
    ),
    q(
      "c13",
      "Why must equals() and hashCode() be overridden together?",
      "Hash-based collections (`HashMap`, `HashSet`) place keys in buckets using **hashCode**, then confirm identity with **equals**.\n\n**Contract**: if `a.equals(b)` then `a.hashCode() == b.hashCode()`. The reverse need not hold (collisions).\n\nIf you override only equals: two equal objects land in **different buckets** → duplicates, failed lookups.\nIf you override only hashCode: unequal objects may collide and confuse logic, but the equals bug is the classic interview failure.\n\nAlso: hashCode must be **stable** while the object is in a HashMap — do not mutate key fields after insert.",
      "Equal objects must share hashCode or HashMap/HashSet break. Never mutate keys after insertion.",
      `record UserId(String value) {}  // equals + hashCode generated\nMap<UserId, User> users = new HashMap<>();\nusers.put(new UserId("u1"), user);\nusers.get(new UserId("u1"));     // works because both methods match`
    ),
    q(
      "c14",
      "How do you iterate a Map? Which way is fastest?",
      "Common ways:\n1. `for (var e : map.entrySet())` — **best** when you need key and value (one lookup).\n2. `for (K k : map.keySet())` then `get(k)` — extra lookup; avoid on large maps.\n3. `values()` when you only need values.\n4. `forEach((k,v) -> ...)` / streams.\n\n**Java 8+**: `forEach`, `computeIfAbsent`, `merge`.\n**Fail-fast**: HashMap iterators throw CME if structurally modified (except iterator.remove).",
      "Prefer entrySet when you need keys and values. Avoid keySet + get on large maps.",
      `for (Map.Entry<String, Integer> e : map.entrySet()) {\n    System.out.println(e.getKey() + "=" + e.getValue());\n}\nmap.forEach((k, v) -> System.out.println(k + "=" + v));`
    ),
    q(
      "c15",
      "What is CopyOnWriteArrayList?",
      "A **thread-safe List** that copies the entire backing array on every **write** (`add`/`set`/`remove`). Iterators traverse a **snapshot** — never throw CME, never see writes that happen after iterator creation.\n\n**Good**: many readers, rare writers (listener lists, config snapshots).\n**Bad**: write-heavy workloads (O(n) copy each write).\n\nContrast: `Collections.synchronizedList` locks every op; `ConcurrentLinkedQueue` for concurrent queues.",
      "COWAL copies on write; iterators are snapshot-based. Use for read-heavy concurrent lists.",
      `List<Listener> listeners = new CopyOnWriteArrayList<>();\nlisteners.add(l);\nfor (Listener x : listeners) x.onEvent();  // safe without extra locking`
    ),
    q(
      "c16",
      "What is PriorityQueue? Is it a FIFO queue?",
      "**PriorityQueue** is a **binary heap**, not FIFO. The head is the **least** element by natural order or Comparator (`poll` is O(log n)).\n\nIt does **not** allow null. Not thread-safe (`PriorityBlockingQueue` is). Iterator is **not** sorted order — only `poll`/`peek` honor priority.\n\nUse for Dijkstra, scheduling, 'top K' problems. For FIFO use `ArrayDeque` or `LinkedList` as Queue.",
      "PriorityQueue is a heap ordered by priority, not insertion order. Iterator is unordered.",
      `PriorityQueue<Integer> pq = new PriorityQueue<>();\npq.offer(5); pq.offer(1); pq.offer(3);\nSystem.out.println(pq.poll()); // 1`
    ),
  ],

  multithreading: [
    q(
      "mt11",
      "What are the states in a thread's lifecycle?",
      "From `Thread.State`:\n\n- **NEW** — created, `start()` not called.\n- **RUNNABLE** — executing or ready (includes waiting for CPU; Java does not expose RUNNING separately).\n- **BLOCKED** — waiting to enter a `synchronized` monitor.\n- **WAITING** — `Object.wait()`, `join()`, `LockSupport.park()` without timeout.\n- **TIMED_WAITING** — `sleep`, `wait(timeout)`, `join(timeout)`.\n- **TERMINATED** — `run()` finished.\n\nYou cannot restart a terminated thread. `start()` on NEW only; second `start()` throws `IllegalThreadStateException`.",
      "NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED. start() only once.",
      `Thread t = new Thread(() -> {});\nSystem.out.println(t.getState()); // NEW\nt.start();\nt.join();\nSystem.out.println(t.getState()); // TERMINATED`
    ),
    q(
      "mt12",
      "What is Thread.join()? What are daemon threads?",
      "**join()**: current thread waits until the target thread **dies**. Overloads with timeout exist. Used to wait for workers before aggregating results.\n\n**Daemon threads**: background (GC is daemon). JVM **exits when only daemon threads remain**. Set `setDaemon(true)` **before** `start()`. Don't run critical I/O on daemons — the JVM may kill them mid-write.\n\nUser (non-daemon) threads keep the JVM alive.",
      "join waits for another thread to finish. Daemon threads do not prevent JVM exit.",
      `Thread worker = new Thread(task);\nworker.start();\nworker.join();  // main waits\n\nThread bg = new Thread(heartbeat);\nbg.setDaemon(true);\nbg.start();`
    ),
    q(
      "mt13",
      "What is a race condition? How do you prevent it?",
      "A **race condition** is when correctness depends on **uncontrolled interleaving**. Classic: `count++` (read-modify-write) on a shared int from two threads loses updates.\n\n**Prevention**:\n- `synchronized` / `ReentrantLock` around the critical section.\n- **Atomics** (`AtomicInteger.incrementAndGet`) for single variables.\n- **Immutability** + thread confinement (don't share mutable state).\n- Concurrent collections instead of unsynchronized HashMap.\n\n**volatile** alone does **not** fix `count++` (visibility ≠ atomicity).",
      "Races happen on unsynchronized shared mutation. Fix with locks, atomics, or don't share.",
      `AtomicInteger count = new AtomicInteger();\nIntStream.range(0, 1000).parallel().forEach(i -> count.incrementAndGet());`
    ),
    q(
      "mt14",
      "synchronized vs ReentrantLock?",
      "**synchronized**: language keyword, implicit monitor, auto-release, JVM-optimized (biased/lock coarsening historically). Cannot try-lock, cannot interrupt a waiter, no multiple condition queues.\n\n**ReentrantLock**: API lock. `tryLock`, `lockInterruptibly`, fairness option, multiple `Condition` objects. Must `unlock()` in `finally` — easy to leak if forgotten.\n\n**Rule**: start with synchronized; switch to ReentrantLock when you need tryLock, interruptible lock, or multiple conditions.",
      "synchronized is simpler. ReentrantLock adds tryLock, interruptibility, and Conditions — always unlock in finally.",
      `ReentrantLock lock = new ReentrantLock();\nlock.lock();\ntry {\n    // critical section\n} finally {\n    lock.unlock();\n}`
    ),
    q(
      "mt15",
      "What is ThreadLocal?",
      "`ThreadLocal<T>` stores a value **per thread** (like a hidden map keyed by thread). Used for request IDs, JDBC connections in old patterns, SimpleDateFormat (not thread-safe) isolation.\n\n**Must remove** in thread pools: `try { ... } finally { threadLocal.remove(); }` — otherwise pooled threads leak previous request data (memory + security).\n\nJava 8: `ThreadLocal.withInitial(Supplier)`. InheritableThreadLocal copies to child threads (use carefully).",
      "ThreadLocal is per-thread storage. Always remove() when using executor thread pools.",
      `static final ThreadLocal<String> USER = new ThreadLocal<>();\nUSER.set("ada");\ntry {\n    service.handle();\n} finally {\n    USER.remove();\n}`
    ),
    q(
      "mt16",
      "What is CompletableFuture?",
      "`CompletableFuture` (Java 8) is a **composable async result** (like JS Promise). Create with `supplyAsync`/`runAsync` (ForkJoinPool.commonPool by default — pass your Executor in production).\n\nChain: `thenApply` (map), `thenCompose` (flatMap async), `thenCombine` (join two), `exceptionally` / `handle` for errors. Block with `join()`/`get()`.\n\nPrefer it over raw `Future` when you need pipelines without blocking a thread per stage.",
      "CompletableFuture composes async work. Use a dedicated Executor in servers, not only the common pool.",
      `CompletableFuture.supplyAsync(() -> fetchUser(id))\n    .thenApply(User::email)\n    .thenAccept(System.out::println)\n    .exceptionally(ex -> { log(ex); return null; });`
    ),
    q(
      "mt17",
      "CountDownLatch vs CyclicBarrier vs Semaphore?",
      "**CountDownLatch**: one-shot; waiters block until count hits 0. Workers only `countDown`. Cannot reset.\n\n**CyclicBarrier**: all parties `await()`; when N arrive, optional barrier action runs, then **resets** for the next cycle (parallel phased algorithms).\n\n**Semaphore**: pool of **permits** (limit concurrent access to 10 DB connections). `acquire`/`release`. Not a one-time event.\n\nPick latch for 'start when all ready', barrier for 'everyone meet then repeat', semaphore for throttling.",
      "Latch = one-shot countdown. Barrier = reusable meetup. Semaphore = permit pool / throttle.",
      `Semaphore db = new Semaphore(10);\ndb.acquire();\ntry { query(); } finally { db.release(); }`
    ),
  ],

  "inner-classes": [
    q(
      "ic6",
      "What does 'effectively final' mean for lambdas?",
      "Lambdas and anonymous/local classes may capture local variables only if they are **final or effectively final** (assigned exactly once).\n\n**Why**: the lambda may run later on another thread; capturing a copy of a mutable local would be confusing. The compiler copies the value into the lambda.\n\nWorkaround for counters: use `AtomicInteger`, an array of size 1, or a field — not a reassigned local `int`.",
      "Lambdas can capture locals only if they are never reassigned after initialization.",
      `int factor = 2;                    // effectively final\nlist.forEach(x -> System.out.println(x * factor));\n// factor = 3;                     // would break the lambda`
    ),
    q(
      "ic7",
      "this inside a lambda vs anonymous class?",
      "In an **anonymous class**, `this` is the **anonymous instance**.\n\nIn a **lambda**, `this` is the **enclosing class** instance (lambda is not a new type with its own this).\n\nThat is why lambdas cannot shadow instance state the same way and why they don't generate a synthetic class per lambda (invokedynamic).\n\nIf you need a new object identity, use an anonymous class or a named nested class.",
      "Lambda this = enclosing object. Anonymous class this = the anonymous object.",
      `class Outer {\n    void demo() {\n        Runnable anon = new Runnable() {\n            public void run() { System.out.println(this.getClass()); }\n        };\n        Runnable lambda = () -> System.out.println(this.getClass()); // Outer\n    }\n}`
    ),
  ],

  generics: [
    q(
      "g6",
      "What is the diamond operator? What are raw types?",
      "**Diamond** `<>` (Java 7): compiler infers the generic type from the left side — `List<String> x = new ArrayList<>();`\n\n**Raw type**: `List list = new ArrayList();` — pre-generics. The compiler warns; you lose type safety and get unchecked casts. Avoid except when interoperating with ancient APIs.\n\nJava 10+ `var list = new ArrayList<String>();` also infers.",
      "<> infers generics from the declaration. Raw types drop generics — do not use them in new code.",
      `List<String> names = new ArrayList<>();  // diamond\n// List raw = new ArrayList();            // raw type — avoid`
    ),
    q(
      "g7",
      "What is a generic method? How is it different from a generic class?",
      "A **generic class** parameterizes the whole type (`class Box<T>`). A **generic method** declares its own type parameters **on the method**: `<T> void copy(List<T> from, List<T> to)`.\n\nThe method can live on a non-generic class (`Collections.sort`). Type parameters can be inferred from arguments; you can also pass them explicitly: `this.<String>copy(...)`.\n\nBounds work the same: `<T extends Comparable<T>>`.",
      "Generic methods have their own <T> on the method, independent of whether the class is generic.",
      `public static <T> T first(List<T> list) {\n    return list.isEmpty() ? null : list.get(0);\n}\nString s = first(List.of("a", "b"));  // T inferred as String`
    ),
  ],

  io: [
    q(
      "io6",
      "java.io vs NIO (java.nio)?",
      "**java.io**: stream-oriented, blocking, one byte/char at a time (with buffers). Simple for files and sockets in textbooks.\n\n**NIO** (Java 1.4+): **buffers**, **channels**, optional **non-blocking** sockets, **Selectors** for many connections in few threads. `Path`/`Files` (NIO.2, Java 7) is the modern file API (`Files.readString`, `walk`).\n\nUse `Files` + streams for most file work. Use NIO channels/selectors for high-concurrency servers (or just use Netty). IO streams still wrap well with try-with-resources.",
      "Classic IO is blocking streams. NIO adds buffers, channels, selectors, and the Files API.",
      `Path p = Path.of("data.txt");\nString text = Files.readString(p);\nFiles.writeString(p, text + "\\n", StandardOpenOption.APPEND);`
    ),
    q(
      "io7",
      "What is serialVersionUID and why does it matter?",
      "`serialVersionUID` is a **version stamp** for `Serializable` classes. On deserialize, JVM compares the stream's UID with the class's UID; mismatch → `InvalidClassException`.\n\nIf you omit it, the compiler/JVM **computes** one from class shape — **any** field/method change can break old files.\n\n**Practice**: declare `private static final long serialVersionUID = 1L;` and bump when you make incompatible changes. Prefer JSON/Protobuf for public APIs; Java serialization is a security hazard if you deserialize untrusted bytes.",
      "Declare serialVersionUID yourself so compatible class changes do not break old serialized data.",
      `class User implements Serializable {\n    private static final long serialVersionUID = 1L;\n    String name;\n}`
    ),
  ],

  memory: [
    q(
      "mem6",
      "ClassNotFoundException vs NoClassDefFoundError?",
      "**ClassNotFoundException** (checked): you asked to load a class by name (`Class.forName`, custom classloader) and it was **not found**. Recoverable if the name is user input.\n\n**NoClassDefFoundError** (Error): the class **was present at compile time** but the JVM **cannot find/initialize** it at runtime (missing JAR, failed static initializer, wrong classpath). The original failure is often `ExceptionInInitializerError`.\n\nInterview: CNFE = explicit lookup failed. NCDFE = linkage broken after compile.",
      "ClassNotFoundException = dynamic load missed. NoClassDefFoundError = class existed at compile, missing or failed at runtime.",
      `try {\n    Class.forName("com.mysql.cj.jdbc.Driver");\n} catch (ClassNotFoundException e) {\n    throw new IllegalStateException("Driver JAR missing", e);\n}`
    ),
    q(
      "mem7",
      "Strong vs soft vs weak vs phantom references?",
      "**Strong**: ordinary `obj = new X()` — GC cannot collect while reachable.\n\n**SoftReference**: GC may collect when **memory is low** (caches that should yield under pressure).\n\n**WeakReference**: GC collects when **only weakly reachable** (canonical mappings: `WeakHashMap` keys).\n\n**PhantomReference**: after finalization, used with a **ReferenceQueue** for post-mortem cleanup (safer than finalize). Must be registered with a queue; `get()` returns null.\n\nInterview: WeakHashMap is not a general cache — entries vanish when keys are only weakly held.",
      "Strong keeps alive. Soft yields under memory pressure. Weak dies when only weakly reachable. Phantom is for cleanup queues.",
      `WeakReference<byte[]> weak = new WeakReference<>(new byte[1024]);\nSystem.gc();\nbyte[] gone = weak.get(); // often null after GC`
    ),
    q(
      "mem8",
      "OutOfMemoryError vs StackOverflowError?",
      "**OutOfMemoryError**: heap (or native/metaspace) exhausted — too many objects, leak, `-Xmx` too small, or `OutOfMemoryError: Metaspace` from classloader leaks.\n\n**StackOverflowError**: thread stack exhausted — typically **unbounded recursion**, or huge local arrays. Fix the algorithm or `-Xss` (rarely the real fix).\n\nBoth are **Errors**. Catching them is almost never the right production strategy.",
      "OOM = heap/metaspace. SOE = call stack (usually recursion). Both are Errors.",
      `void recurse() { recurse(); }  // StackOverflowError\nList<byte[]> leak = new ArrayList<>();\nwhile (true) leak.add(new byte[1_000_000]); // heap OOM`
    ),
  ],

  "streams-api": [
    q(
      "st6",
      "When should you use parallel streams?",
      "`parallelStream()` splits work on the **common ForkJoinPool**. Good for **CPU-heavy, independent** operations on **large, in-memory, splittable** sources (ArrayList, arrays).\n\n**Avoid** when: tiny lists, blocking I/O (starves FJP), shared mutable state, order-sensitive side effects, or already-running inside another FJP task. `forEach` on parallel streams is unordered.\n\nMeasure. Sequential is the default for a reason. For I/O concurrency use your own Executor / virtual threads (Java 21).",
      "Parallel streams help CPU-bound, large, stateless pipelines. Do not use them for I/O or tiny data.",
      `long sum = IntStream.rangeClosed(1, 10_000_000)\n    .parallel()\n    .asLongStream()\n    .sum();`
    ),
    q(
      "st7",
      "reduce() vs collect()?",
      "**reduce**: immutable fold — `(a,b) -> a+b`, Optional result. Associative functions only for parallel correctness.\n\n**collect**: mutable reduction into a container (List, Map, StringBuilder) via **Collector** (`supplier`, `accumulator`, `combiner`, `finisher`). This is how `Collectors.toList/groupingBy` work.\n\nUse reduce for numeric/optional folds. Use collect for building collections. Don't `reduce` into a shared mutable list in parallel — that's a bug; use collect.",
      "reduce folds immutably. collect mutates a container via a Collector — prefer collect for lists/maps.",
      `int sum = list.stream().reduce(0, Integer::sum);\nMap<Integer, List<String>> byLen =\n    list.stream().collect(Collectors.groupingBy(String::length));`
    ),
    q(
      "st8",
      "Stream vs Collection?",
      "A **Collection** is a **data structure** — you can traverse it many times, add/remove, it holds elements.\n\nA **Stream** is a **pipeline** over a source: lazy, possibly infinite, **consumed once**, does not store elements (except when collected). Operations are internal iteration.\n\nYou cannot add to a stream. `collection.stream()` does not copy; mutating the collection while streaming is undefined (except concurrent sources).",
      "Collections store data and are reusable. Streams are one-shot lazy pipelines.",
      `List<String> data = List.of("a", "bb", "ccc");\nStream<String> s = data.stream().filter(x -> x.length() > 1);\nList<String> out = s.toList();  // terminal; s cannot be reused`
    ),
    q(
      "st9",
      "What are short-circuiting stream operations?",
      "They can finish **without consuming the whole source**:\n\n**Intermediate**: `limit`, `takeWhile` (Java 9).\n**Terminal**: `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`.\n\nEssential for **infinite streams** (`Stream.iterate`, `generate`) — without limit/find, they never terminate.\n\n`findFirst` respects encounter order (slower in parallel). `findAny` is cheaper in parallel.",
      "Short-circuit ops stop early. Required to terminate infinite streams.",
      `int firstEven = Stream.iterate(1, n -> n + 1)\n    .filter(n -> n % 2 == 0)\n    .findFirst()\n    .orElseThrow();`
    ),
  ],

  misc: [
    q(
      "m22",
      "How do you create an immutable class in Java?",
      "Checklist (Effective Java):\n1. **final class** (or private constructors + no subclassing).\n2. **private final** fields.\n3. **No setters**; initialize in constructor.\n4. **Defensive copies** of mutable inputs/outputs (`new ArrayList<>(list)`).\n5. Don't leak `this` during construction.\n\nRecords (Java 16) give immutability of the **component references**, not deep immutability of nested mutables. String, Integer, LocalDate are immutable examples.",
      "final class, private final fields, no mutators, copy mutable parts. Records help but are shallow.",
      `public final class Money {\n    private final int cents;\n    private final String currency;\n    public Money(int cents, String currency) {\n        this.cents = cents;\n        this.currency = Objects.requireNonNull(currency);\n    }\n    public int cents() { return cents; }\n}`
    ),
    q(
      "m23",
      "How do you implement Singleton in Java? What are the pitfalls?",
      "Goal: **one instance** per JVM (or per classloader).\n\n**Enum singleton** (best): `enum Holder { INSTANCE; }` — serialization and reflection safe.\n\n**Lazy holder (Bill Pugh)**: inner class loaded on first `getInstance()`; thread-safe without synchronized on the fast path.\n\n**Double-checked locking**: needs `volatile` instance; easy to get wrong.\n\nPitfalls: reflection can invoke a private constructor (unless enum), serialization creates a new instance (unless `readResolve`), multiple classloaders create multiple 'singletons', hard to test.",
      "Prefer enum singleton or lazy inner class. Watch reflection, serialization, and classloaders.",
      `enum AppConfig { INSTANCE;\n    public String region() { return "in"; }\n}\nclass Lazy {\n    private Lazy() {}\n    private static class H { static final Lazy I = new Lazy(); }\n    static Lazy get() { return H.I; }\n}`
    ),
    q(
      "m24",
      "What is an enum? Can it have methods and constructors?",
      "`enum` is a **final class** with a **fixed set of instances** (constants). It can have fields, methods, constructors (**private** implicitly), and implement interfaces. Cannot extend a class (already extends `Enum`).\n\n`switch` on enums is exhaustive in modern Java. `EnumSet`/`EnumMap` are efficient. Each constant can have a **constant-specific body**.\n\nSerialization of enums uses the name; you cannot create new instances via `new`.",
      "Enums are typed constants that can hold state and behavior. Constructors are private; instances are fixed.",
      `enum Status {\n    OPEN(1), CLOSED(0);\n    private final int code;\n    Status(int code) { this.code = code; }\n    public int code() { return code; }\n}`
    ),
    q(
      "m25",
      "What is reflection? When should you avoid it?",
      "Reflection (`java.lang.reflect`) inspects and invokes classes, methods, and fields **at runtime** — even private ones (`setAccessible`). Frameworks (Spring, Hibernate, Jackson) rely on it.\n\n**Costs**: slower than direct calls, breaks encapsulation, skipped compile-time checks, JPMS may deny access (`InaccessibleObjectException`).\n\n**Avoid** in application business logic. Prefer interfaces, ServiceLoader, or compile-time annotation processors. Java 9+ needs `--add-opens` for deep reflection into JDK modules.",
      "Reflection is runtime introspection used by frameworks. Avoid it in normal app code — it is slow and brittle.",
      `Class<?> c = Class.forName("java.time.LocalDate");\nMethod m = c.getMethod("now");\nObject today = m.invoke(null);`
    ),
    q(
      "m26",
      "What are annotations? Built-in vs custom?",
      "Annotations are **metadata** on declarations (`@Override`, `@Deprecated`, `@FunctionalInterface`, `@SuppressWarnings`). They can target types, methods, fields, parameters (`@Target`) and be retained SOURCE/CLASS/RUNTIME (`@Retention`).\n\n**Runtime** annotations are readable via reflection. **Compile-time** processors generate code (Lombok, Dagger).\n\nCustom: `@interface Team { String owner(); }`.\nJava 8+ **repeatable** annotations and type-use annotations (`List<@NonNull String>`).",
      "Annotations attach metadata. Retention decides if they live at runtime. @Override is a compiler check, not runtime logic.",
      `@Retention(RetentionPolicy.RUNTIME)\n@Target(ElementType.METHOD)\npublic @interface Timed { }\n\n@Timed public void serve() {}`
    ),
    q(
      "m27",
      "What is the var keyword (Java 10)?",
      "`var` is **local-variable type inference**. The compiler still has a **static type** — `var` is not dynamic like JS.\n\n**Allowed**: local variables with initializer, try-with-resources, lambda params (later versions in some forms).\n**Not allowed**: fields, method parameters, return types, `var x;` without initializer, `var x = null`.\n\nUse when the type is obvious (`var list = new ArrayList<String>()`). Avoid when it hides an important interface (`var x = getService()`).",
      "var infers a still-static local type. It is not a field/parameter keyword and cannot be initialized to null alone.",
      `var names = new ArrayList<String>();  // ArrayList<String>\nvar first = names.get(0);            // String\n// var x = null;                      // compile error`
    ),
    q(
      "m28",
      "What is the Java Memory Model (happens-before)?",
      "The **JMM** defines when a write by one thread becomes **visible** to another. Without synchronization, compilers/CPUs may reorder and cache aggressively.\n\n**happens-before** examples: unlock of monitor HB subsequent lock of same monitor; write to **volatile** HB subsequent read of that volatile; start of a thread HB actions in that thread; last action in a thread HB successful `join`.\n\nThis is why double-checked locking needs `volatile`, and why `synchronized` provides both mutual exclusion **and** visibility.",
      "JMM visibility is happens-before, not wall-clock order. volatile, locks, and thread start/join create those edges.",
      `volatile boolean ready;\nint data;\n// thread A:\ndata = 42; ready = true;\n// thread B:\nif (ready) use(data);  // sees 42`
    ),
    q(
      "m29",
      "What are virtual threads (Java 21)?",
      "**Virtual threads** (Project Loom, JEP 444) are JVM-scheduled lightweight threads. You can create **millions**; blocking I/O **unmounts** them from carrier platform threads instead of pinning an OS thread (most cases).\n\n**API**: `Thread.ofVirtual().start(task)`, `Executors.newVirtualThreadPerTaskExecutor()`.\n\n**Still**: no magic for CPU-bound work; `synchronized` on long blocks can **pin** carriers (use ReentrantLock if needed). ThreadLocal is more expensive at huge scale — prefer scoped values where possible.\n\nInterview: virtual threads make the thread-per-request model viable again for I/O servers.",
      "Virtual threads are cheap, JVM-scheduled threads for massive concurrency on blocking I/O. Java 21+.",
      `try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i ->\n        exec.submit(() -> fetch(i)));\n}`
    ),
    q(
      "m30",
      "hashCode() contract — what can go wrong in HashMap?",
      "**hashCode must stay consistent with equals** while a key lives in a HashMap.\n\nWhat goes wrong:\n- **Mutating a key** after insert: the key sits in the old bucket; `get` uses the new hash → **lost entry**.\n- **Poor hashCode** (always 0): everything in one bucket → O(n) (treeified after Java 8 is still slower than a good hash).\n- **Inconsistent equals** (asymmetric): HashMap behavior is undefined.\n\nUse immutable keys (`String`, records of immutables). `Objects.hash(...)` is convenient, not the fastest.",
      "Never mutate HashMap keys. Keep equals and hashCode consistent. Prefer immutable keys.",
      `class BadKey {\n    int id;\n    public int hashCode() { return id; }\n    public boolean equals(Object o) { return o instanceof BadKey b && id == b.id; }\n}\n// put, then key.id++  → get() fails`
    ),
  ],
};
