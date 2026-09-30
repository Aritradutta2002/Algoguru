import { defineBackendChunk } from "./contract";

/**
 * JVM Internals & Advanced Concurrency (b239–b247).
 *
 * Fills the Chapter 3 gaps the multithreading bank misses: livelock/starvation
 * and structured concurrency, plus the JVM runtime model (memory areas, GC,
 * leaks, container sizing) and the production-troubleshooting toolkit
 * (triage, thread/heap dumps, class-loading errors, version differences).
 */
export const chunk17Jvm = defineBackendChunk({
  topic: "jvm",
  questions: [
    {
      id: "b239",
      question: "What are livelock and starvation, and how do they differ from deadlock?",
      answer:
        "All three are **liveness** failures — the program can't make progress — but the mechanism differs:\n\n" +
        "- **Deadlock** — threads are permanently **blocked**, each waiting for a lock the other holds. Nothing runs; threads are stuck (e.g. `BLOCKED`).\n" +
        "- **Livelock** — threads are **not blocked and are actively running**, but keep responding to each other and never progress — like two people stepping side to side in a corridor. Often caused by naive retry/backoff where both parties retry in lockstep, or by 'politely' releasing and re-acquiring resources.\n" +
        "- **Starvation** — a thread is perpetually **denied** the resources/CPU it needs because others monopolize them — e.g. low-priority threads never scheduled, or an unfair lock always granted to the same busy threads.\n\n" +
        "**Fixes:** livelock → add **randomized backoff/jitter** so retries desynchronize; starvation → **fair locks** (`new ReentrantLock(true)`), bounded work, avoid priority abuse, ensure the thread pool isn't saturated by one task type (bulkheads). Diagnose with a thread dump: deadlock shows a lock cycle; starvation/livelock show threads running/waiting but no forward progress.",
      code: `// Livelock-prone: both threads keep yielding to each other forever.
// Fix with randomized backoff so they desynchronize:
while (!lock.tryLock(0, TimeUnit.MILLISECONDS)) {
    Thread.sleep(ThreadLocalRandom.current().nextInt(50)); // jitter breaks the cycle
}

// Starvation fix: a FAIR lock grants in arrival order (no thread starves)
private final ReentrantLock fair = new ReentrantLock(true);`,
      codeLanguage: "java",
      explanation:
        "Shows diagnostic maturity — deadlock (blocked cycle) vs livelock (active no-progress) vs starvation (denied resources), and their fixes.",
      followUps: [
        "How does jitter break a livelock?",
        "What does a fair lock cost you?",
        "How does each look in a thread dump?",
      ],
    },
    {
      id: "b240",
      question: "What is structured concurrency (Java 21) and what problem does it solve?",
      answer:
        "Traditional concurrency with an `ExecutorService` treats concurrent subtasks as **independent** — if you fork 3 calls and one fails, the others keep running (leaks), cancellation isn't propagated, and error handling is ad hoc. The relationship between the tasks and their parent is lost.\n\n" +
        "**Structured concurrency** (preview in Java 21 via `StructuredTaskScope`) makes concurrent subtasks a **scoped unit** with a clear lifetime: you fork subtasks inside a scope, then `join()`; the scope guarantees all subtasks complete (or are cancelled) before it exits. Policies like `ShutdownOnFailure` **cancel the siblings** as soon as one fails, and `ShutdownOnSuccess` returns the first success and cancels the rest.\n\n" +
        "Benefits: no leaked threads, automatic cancellation propagation, errors aggregated, and the code's structure mirrors the task hierarchy (like a try-block for concurrency). It pairs naturally with **virtual threads** (cheap to fork many). Still a preview API, so mention that honestly.\n\n" +
        "Contrast with a raw `ExecutorService`: there, `submit` returns independent `Future`s with no parent-child link, so a failure in one task doesn't cancel its siblings, cancellation isn't propagated, and it's easy to leak a running task if you forget to await it or shut the pool down. Structured concurrency enforces that all subtasks are confined to the enclosing scope's lifetime — the scope can't exit until every child has finished or been cancelled — which also makes stack traces and observability far clearer because the concurrency has a visible tree shape rather than a flat pool of orphaned futures.",
      code: `// Java 21 preview: fan out two calls, fail fast, no leaks
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User>  user  = scope.fork(() -> userService.find(id));    // virtual threads
    Subtask<Order> order = scope.fork(() -> orderService.latest(id));

    scope.join();               // wait for both
    scope.throwIfFailed();      // if either failed, the other was cancelled

    return new Profile(user.get(), order.get());
}`,
      codeLanguage: "java",
      explanation:
        "Emerging pattern worth knowing (without overclaiming) — scoped subtasks with propagated cancellation and aggregated errors, preview in 21.",
      followUps: [
        "How does it differ from a raw ExecutorService?",
        "How does ShutdownOnFailure help?",
        "Why does it pair well with virtual threads?",
      ],
    },
    {
      id: "b241",
      question: "What are the JVM memory areas?",
      answer:
        "The JVM runtime data areas:\n\n" +
        "- **Heap** — shared across threads; holds all objects and arrays. Managed by the GC and split into **young** (eden + survivor) and **old** generations. Sized by `-Xms`/`-Xmx`. `OutOfMemoryError: Java heap space` when it's exhausted.\n" +
        "- **Stack** — one **per thread**; holds stack frames (local variables, operands, return addresses) for each method call. Deep/infinite recursion → `StackOverflowError`. Sized by `-Xss`.\n" +
        "- **Metaspace** — off-heap (native memory since Java 8, replacing PermGen); stores class metadata. Grows dynamically; a classloader leak → `OutOfMemoryError: Metaspace`.\n" +
        "- **PC register** — per thread, the address of the current instruction.\n" +
        "- **Native method stack** — for JNI/native calls.\n" +
        "- Plus the **code cache** (JIT-compiled native code) and other native memory (thread stacks, direct byte buffers).\n\n" +
        "Interview point: objects live on the **heap**, references and primitives-in-methods live on the **stack**; understanding this explains GC, `StackOverflowError` vs `OutOfMemoryError`, and why container memory limits must account for heap **plus** metaspace, thread stacks and native memory.",
      code: `class Demo {
    static int shared = 0;         // in the class metadata / heap-referenced
    void method() {
        int local = 5;             // STACK (this frame)
        Object o = new Object();   // 'o' ref on STACK, object on HEAP
        recurse(0);                // deep recursion -> StackOverflowError
    }
    void recurse(int n) { recurse(n + 1); }
}
// -Xmx512m (heap)  -Xss1m (per-thread stack)  -XX:MaxMetaspaceSize=256m`,
      codeLanguage: "java",
      explanation:
        "Basic runtime model for debugging — heap (objects) vs per-thread stack (frames) vs metaspace (class metadata), and their OOM signatures.",
      followUps: [
        "StackOverflowError vs OutOfMemoryError — causes?",
        "What replaced PermGen and why?",
        "Why must a container limit exceed -Xmx?",
      ],
    },
    {
      id: "b242",
      question: "What causes memory leaks in Java, and how do you find them?",
      answer:
        "Java has GC, but you still leak by **holding references to objects you no longer need** — the GC can't collect what's still reachable. Common causes:\n\n" +
        "- **Unbounded caches / static collections** — a `static Map` that only ever grows.\n" +
        "- **`ThreadLocal`s in a thread pool** — pool threads live forever, so an un-removed `ThreadLocal` value is retained; also a classic classloader leak on redeploy. Always `remove()` in a `finally`.\n" +
        "- **Unremoved listeners/callbacks** — registering but never deregistering keeps the observer alive.\n" +
        "- **Classloader leaks** — a redeployed app whose classes are pinned by a reference from the container (metaspace grows each redeploy).\n" +
        "- Objects kept in long-lived scopes (session, singletons).\n\n" +
        "**Find it:** watch heap trend (a leak = old-gen usage climbs after each full GC and never returns). Capture a **heap dump** (`-XX:+HeapDumpOnOutOfMemoryError` or `jmap`), open it in **Eclipse MAT**, use **Leak Suspects** and the **dominator tree** to see what retains the most memory and the GC-root path holding it. Fix by bounding caches (`WeakHashMap`/Caffeine with limits/TTL), removing `ThreadLocal`s, and deregistering listeners.",
      code: `// LEAK: static cache with no bound -> grows forever
static final Map<Key, Value> CACHE = new HashMap<>();   // never evicts

// LEAK: ThreadLocal not cleared in a pooled thread
private static final ThreadLocal<Ctx> CTX = new ThreadLocal<>();
try { CTX.set(ctx); doWork(); }
finally { CTX.remove(); }        // MUST remove or the pool thread retains it

// Bounded alternative
Cache<Key, Value> cache = Caffeine.newBuilder()
        .maximumSize(10_000).expireAfterWrite(Duration.ofMinutes(10)).build();`,
      codeLanguage: "java",
      explanation:
        "Production troubleshooting essential — leaks are lingering references (caches, ThreadLocals, listeners); find via heap dump + MAT dominator tree.",
      followUps: [
        "Why do ThreadLocals leak in a thread pool?",
        "How does MAT's dominator tree help?",
        "How do you bound a cache to prevent leaks?",
      ],
    },
    {
      id: "b243",
      question: "How do you size JVM memory in a container (Kubernetes/Docker)?",
      answer:
        "Older JVMs read the **host's** memory, not the container's cgroup limit, so they'd size the heap for a 64GB host inside a 512MB container and get **OOMKilled**. Modern JVMs (8u191+, 11+) are **container-aware** and read cgroup limits.\n\n" +
        "**Prefer percentage flags over fixed sizes:**\n\n" +
        "- `-XX:MaxRAMPercentage=75.0` sizes the max heap as a fraction of the container limit — so the same image scales across pod sizes. (Also `InitialRAMPercentage`, `MinRAMPercentage` for small containers.)\n" +
        "- Leave headroom: the heap is **not** the whole footprint — metaspace, thread stacks, code cache, direct/native buffers and the GC all use memory *outside* `-Xmx`. Setting `-Xmx` = container limit guarantees an OOMKill. 75% is a common starting point; tune with observation.\n\n" +
        "**Container OOMKilled (exit 137)** means the *kernel* killed the process for exceeding the memory limit — different from a JVM `OutOfMemoryError`. If you see 137 with heap headroom, the leak is in **native/metaspace/thread** memory. Also set CPU requests/limits sensibly since GC and the fork-join common pool size to available processors.",
      code: `# Container-aware heap sizing that scales with the pod's memory limit
JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:MaxMetaspaceSize=256m"

# Kubernetes: give the JVM room BEYOND the heap (metaspace, stacks, native)
# resources:
#   limits:   { memory: "1Gi" }   # heap ~= 768Mi, ~256Mi for non-heap
#   requests: { memory: "1Gi", cpu: "1" }
# exit code 137 = OOMKilled by the kernel (not a Java OutOfMemoryError)`,
      codeLanguage: "bash",
      explanation:
        "Critical in Docker/Kubernetes — container-aware MaxRAMPercentage with headroom for non-heap memory; 137/OOMKilled vs Java OOM.",
      followUps: [
        "Why MaxRAMPercentage instead of -Xmx?",
        "Why leave headroom beyond the heap?",
        "OOMKilled (137) vs OutOfMemoryError — how to tell apart?",
      ],
    },
    {
      id: "b244",
      question: "How do you triage a performance problem in a running service?",
      answer:
        "Work from **symptom → subsystem → evidence**, don't guess:\n\n" +
        "1. **Classify the symptom** with metrics: high latency? low throughput? errors? Which endpoints? Correlate with a recent deploy/traffic change.\n" +
        "2. **Check the four usual suspects:**\n" +
        "   - **CPU saturation** — profile hot methods (async-profiler, JFR flame graphs).\n" +
        "   - **GC pauses** — GC logs; frequent/long pauses or a growing live set (→ leak or undersized heap).\n" +
        "   - **Lock contention / thread starvation** — thread dump shows many threads `BLOCKED`/`WAITING` on one monitor, or an exhausted pool.\n" +
        "   - **Slow I/O / downstream** — DB query plans (`EXPLAIN`), missing timeouts, connection-pool exhaustion, N+1.\n" +
        "3. **Use low-overhead tools first** — metrics dashboards, `jcmd`/JFR (always-on flight recorder), then a profiler for the hot path.\n" +
        "4. **Confirm the hypothesis** — reproduce, change one thing, measure the effect.\n\n" +
        "The interviewer wants a **structured method** (measure, localize, verify) rather than random tuning, and awareness that most 'slow app' issues are DB, GC or contention — not the algorithm.",
      code: `# Always-on, low-overhead profiling with Java Flight Recorder
jcmd <pid> JFR.start name=perf settings=profile duration=120s filename=/tmp/rec.jfr
jcmd <pid> JFR.dump name=perf filename=/tmp/rec.jfr    # open in JDK Mission Control

# Quick JVM vitals
jcmd <pid> GC.heap_info          # heap usage / GC
jcmd <pid> Thread.print | grep -c BLOCKED   # lock contention?

# Slow endpoint -> is it the DB?
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;`,
      codeLanguage: "bash",
      explanation:
        "Structured debugging approach — classify the symptom, check CPU/GC/contention/IO with metrics+JFR, then verify one change at a time.",
      followUps: [
        "What are the four common causes of latency?",
        "Why start with metrics/JFR before a profiler?",
        "How do you confirm GC is the problem?",
      ],
    },
    {
      id: "b245",
      question: "How do you analyze a thread dump and a heap dump?",
      answer:
        "**Thread dump** — a snapshot of every thread's stack and state. Capture with `jstack <pid>`, `jcmd <pid> Thread.print`, or `kill -3`. Read it for:\n\n" +
        "- **Deadlock** — the JVM prints a 'Found one Java-level deadlock' section with the lock cycle.\n" +
        "- **Contention** — many threads `BLOCKED` on the same monitor (`- waiting to lock <0x...>`) point to a hot lock.\n" +
        "- **Pool exhaustion / stuck work** — lots of threads `WAITING`/`TIMED_WAITING` in the same downstream call (missing timeout), or all worker threads busy.\n" +
        "- Take **several** dumps a few seconds apart to see what's stuck vs progressing.\n\n" +
        "**Heap dump** — a snapshot of all objects. Capture with `-XX:+HeapDumpOnOutOfMemoryError` (automatic on OOM) or `jmap -dump:live,format=b,file=heap.hprof <pid>`. Analyze in **Eclipse MAT**: **Leak Suspects** report, the **dominator tree** (who retains the most), and 'path to GC roots' to find what holds a suspected leak. Use it to find the biggest retainers and unbounded collections.\n\n" +
        "Rule: thread dumps for hangs/contention/deadlock; heap dumps for OOM/leaks/memory bloat.",
      code: `# Thread dump (take 2-3, seconds apart, to see what's truly stuck)
jstack <pid> > td1.txt ; sleep 5 ; jstack <pid> > td2.txt
grep -A2 "Found one Java-level deadlock" td1.txt   # deadlock section
grep -c "BLOCKED" td1.txt                          # contention signal

# Heap dump for leak analysis (open heap.hprof in Eclipse MAT)
jmap -dump:live,format=b,file=heap.hprof <pid>
# MAT: Leak Suspects -> Dominator Tree -> Path to GC Roots`,
      codeLanguage: "bash",
      explanation:
        "Direct production debugging — thread dumps for deadlock/contention/pool exhaustion, heap dumps + MAT dominator tree for leaks.",
      followUps: [
        "How does a thread dump reveal a deadlock?",
        "Why take multiple thread dumps?",
        "What does 'path to GC roots' tell you?",
      ],
    },
    {
      id: "b246",
      question: "ClassNotFoundException vs NoClassDefFoundError — what's the difference?",
      answer:
        "Both mean a class couldn't be loaded, but they occur differently:\n\n" +
        "- **`ClassNotFoundException`** (a checked `Exception`) — thrown when code tries to load a class **by name at runtime** (`Class.forName(\"...\")`, `ClassLoader.loadClass`, reflection) and it isn't on the classpath. Typical cause: a missing JAR, or a dynamically-referenced class (JDBC driver, plugin) that isn't present.\n" +
        "- **`NoClassDefFoundError`** (an `Error`) — thrown when the class **was present at compile time** but is **missing/failed at runtime**, or — importantly — when the class's **static initializer previously failed**. The linker successfully compiled against it but can't find/initialize the definition now. Common causes: a dependency present during build but absent at runtime, a version/classpath mismatch, or an earlier `ExceptionInInitializerError` in a static block (subsequent references then throw `NoClassDefFoundError`).\n\n" +
        "Debugging: `ClassNotFoundException` → check the classpath/dependency for the named class. `NoClassDefFoundError` → check for a **failed static initializer** (look earlier in the logs), classpath/version conflicts, or shading/packaging problems. In fat-jar/Spring Boot apps these usually mean a dependency conflict or a missing transitive dependency.",
      code: `// ClassNotFoundException: dynamic load of a class not on the classpath
try {
    Class.forName("com.mysql.cj.jdbc.Driver");   // driver JAR missing -> checked exception
} catch (ClassNotFoundException e) { /* add the dependency */ }

// NoClassDefFoundError: static initializer failed the FIRST time...
class Config {
    static final String URL = System.getenv("URL").trim(); // NPE -> ExceptionInInitializerError
}
// ...every later reference to Config now throws NoClassDefFoundError`,
      codeLanguage: "java",
      explanation:
        "Useful for build/runtime diagnosis — exception (dynamic load missing) vs error (compiled-in but missing/failed static init).",
      followUps: [
        "How can a failed static initializer cause NoClassDefFoundError?",
        "Which points to a dependency-version conflict?",
        "Where do these commonly appear in fat jars?",
      ],
    },
    {
      id: "b247",
      question: "What runtime differences matter when moving from Java 17 to Java 21?",
      answer:
        "Both are LTS. The headline runtime changes in 21 for backend services:\n\n" +
        "- **Virtual threads (JEP 444, final)** — lightweight threads that make blocking IO cheap; a thread-per-request server can scale to huge concurrency without a reactive rewrite. The single biggest reason to move to 21.\n" +
        "- **Generational ZGC** — ZGC (sub-millisecond pauses) becomes generational, improving throughput/efficiency for large heaps; a strong low-latency GC option alongside the default G1.\n" +
        "- **Language:** pattern matching for `switch` and record patterns are **final** (preview in 17), enabling exhaustive, deconstructing switches; plus sequenced collections.\n" +
        "- Preview/incubator: structured concurrency, scoped values, the vector API.\n\n" +
        "**Migration considerations:** it's largely compatible, but watch for **virtual-thread pinning** (synchronized blocks / native calls pin a carrier thread — prefer `ReentrantLock`), libraries/agents that assume platform threads, and re-tuning GC. Roll out behind flags, test on real workloads, and confirm observability tools support 21. Answer with 'virtual threads + generational ZGC + finalized pattern matching' and the pinning caveat.",
      code: `// Java 21: a virtual-thread-per-task executor - blocking code, massive concurrency
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var request : requests) {
        executor.submit(() -> handleBlockingIo(request)); // cheap: millions possible
    }
}
// Caveat: synchronized around blocking IO pins the carrier thread.
// Prefer ReentrantLock to avoid pinning under virtual threads.`,
      codeLanguage: "java",
      explanation:
        "Version awareness without trivia — virtual threads, generational ZGC and finalized pattern matching, plus the pinning migration caveat.",
      followUps: [
        "How do virtual threads change server design?",
        "What is virtual-thread pinning and how do you avoid it?",
        "When would you choose ZGC over G1?",
      ],
    },
  ],
  meta: {
    b239: { difficulty: "medium", priority: "medium", tags: ["livelock", "starvation", "liveness"], readMinutes: 4 },
    b240: { difficulty: "hard", priority: "medium", tags: ["structured-concurrency", "java21", "cancellation"], readMinutes: 4, versions: ["Java 21"] },
    b241: { difficulty: "medium", priority: "very-high", tags: ["jvm", "heap", "stack", "metaspace"], readMinutes: 5 },
    b242: { difficulty: "hard", priority: "very-high", tags: ["memory-leak", "heap-dump", "mat"], readMinutes: 5 },
    b243: { difficulty: "medium", priority: "high", tags: ["jvm-flags", "container", "maxrampercentage"], readMinutes: 4 },
    b244: { difficulty: "hard", priority: "high", tags: ["performance", "triage", "jfr"], readMinutes: 5 },
    b245: { difficulty: "hard", priority: "high", tags: ["thread-dump", "heap-dump", "jstack"], readMinutes: 5 },
    b246: { difficulty: "medium", priority: "medium", tags: ["classnotfound", "noclassdeffound", "classloading"], readMinutes: 4 },
    b247: { difficulty: "medium", priority: "high", tags: ["java21", "virtual-threads", "zgc"], readMinutes: 5, versions: ["Java 21"] },
  },
});
