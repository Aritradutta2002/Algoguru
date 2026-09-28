import { defineBackendChunk } from "./contract";

/**
 * Multithreading part B — executors, async composition, virtual threads (b095–b106).
 */
export const chunk07MultithreadingB = defineBackendChunk({
  topic: "multithreading",
  questions: [
    {
      id: "b095",
      question: "Explain ThreadPoolExecutor: every constructor parameter and the exact task-submission algorithm.",
      answer:
        "The seven parameters:\n\n" +
        "- **corePoolSize** — threads kept alive even when idle (unless `allowCoreThreadTimeOut(true)`).\n" +
        "- **maximumPoolSize** — the hard ceiling.\n" +
        "- **keepAliveTime / unit** — how long threads **above** the core size idle before dying.\n" +
        "- **workQueue** — a `BlockingQueue<Runnable>`.\n" +
        "- **threadFactory** — **always supply one**: meaningful names make thread dumps readable, and it is where you set daemon status, priority and the `UncaughtExceptionHandler`.\n" +
        "- **rejectedExecutionHandler** — what happens when the pool is saturated.\n\n" +
        "The submission algorithm — the part most candidates get wrong:\n\n" +
        "1. If `poolSize < corePoolSize` → **create a new thread**, even if other threads are idle.\n" +
        "2. Else → **try to queue** the task.\n" +
        "3. Only if the **queue is full** → create a new thread up to `maximumPoolSize`.\n" +
        "4. If the queue is full **and** the pool is at maximum → **reject**.\n\n" +
        "**The consequence:** with an unbounded `LinkedBlockingQueue`, step 3 never happens, so `maximumPoolSize` is dead configuration — the pool never grows past core, and the queue grows until you hit `OutOfMemoryError`. That is precisely why `Executors.newFixedThreadPool` is dangerous in production.\n\n" +
        "The four rejection policies: **AbortPolicy** (default, throws `RejectedExecutionException`), **CallerRunsPolicy** (the submitting thread runs the task — natural backpressure, and usually the right choice), **DiscardPolicy** (silently drops), **DiscardOldestPolicy** (drops the head of the queue).\n\n" +
        "Sizing: **CPU-bound** → `cores + 1`. **IO-bound** → `cores × (1 + waitTime/serviceTime)`, or just use virtual threads. Always measure.\n\n" +
        "Finally: `Executors.newFixedThreadPool`/`newCachedThreadPool`/`newSingleThreadExecutor` are all unbounded in one dimension. Construct `ThreadPoolExecutor` explicitly.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ThreadPoolExecutorDeepDive {

    static ThreadFactory namedFactory(String prefix) {
        AtomicInteger seq = new AtomicInteger(1);
        return r -> {
            Thread t = new Thread(r, prefix + "-" + seq.getAndIncrement());
            t.setDaemon(false);
            t.setUncaughtExceptionHandler((thread, ex) ->
                System.err.println("uncaught in " + thread.getName() + ": " + ex));
            return t;
        };
    }

    public static void main(String[] args) throws Exception {
        int cores = Runtime.getRuntime().availableProcessors();

        ThreadPoolExecutor pool = new ThreadPoolExecutor(
            cores,                                   // corePoolSize
            cores * 4,                               // maximumPoolSize
            60L, TimeUnit.SECONDS,                   // keepAlive for non-core threads
            new ArrayBlockingQueue<>(100),           // BOUNDED - or max is ignored
            namedFactory("order-worker"),            // readable thread dumps
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure, never silent loss
        );
        pool.allowCoreThreadTimeOut(false);
        pool.prestartAllCoreThreads();

        // Demonstrating the growth order: core -> queue -> max -> reject.
        ThreadPoolExecutor tiny = new ThreadPoolExecutor(
            1, 2, 0L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1), namedFactory("tiny"),
            new ThreadPoolExecutor.AbortPolicy());

        Runnable slow = () -> { try { Thread.sleep(300); } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); } };

        tiny.execute(slow);                          // 1: starts core thread
        tiny.execute(slow);                          // 2: queued (queue capacity 1)
        tiny.execute(slow);                          // 3: queue full -> 2nd thread
        try { tiny.execute(slow); }                  // 4: full + at max -> rejected
        catch (RejectedExecutionException e) { System.out.println("rejected as expected"); }

        // Observability: these are the metrics to publish.
        System.out.printf("pool=%d active=%d queue=%d completed=%d largest=%d%n",
            tiny.getPoolSize(), tiny.getActiveCount(), tiny.getQueue().size(),
            tiny.getCompletedTaskCount(), tiny.getLargestPoolSize());

        // submit() swallows exceptions into the Future - always inspect it.
        Future<?> f = pool.submit(() -> { throw new IllegalStateException("boom"); });
        try { f.get(); } catch (ExecutionException e) {
            System.out.println("task failed: " + e.getCause().getMessage());
        }

        // Two-phase shutdown.
        for (ExecutorService svc : java.util.List.of(pool, tiny)) {
            svc.shutdown();
            if (!svc.awaitTermination(5, TimeUnit.SECONDS)) svc.shutdownNow();
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Core threads first, then the queue, then up to max, then reject — so an unbounded queue makes maximumPoolSize meaningless.",
      followUps: [
        "Why is Executors.newFixedThreadPool considered dangerous?",
        "When is CallerRunsPolicy the wrong choice?",
      ],
    },
    {
      id: "b096",
      question: "Runnable vs Callable vs Future vs CompletableFuture — what problem does each solve?",
      answer:
        "**Runnable** (Java 1.0) — `void run()`, cannot throw checked exceptions. Fire-and-forget work. A `@FunctionalInterface`.\n\n" +
        "**Callable&lt;V&gt;** (Java 5) — `V call() throws Exception`. Returns a value and may throw checked exceptions, which is why `ExecutorService.submit` prefers it. Convert with `Executors.callable(runnable)`.\n\n" +
        "**Future&lt;V&gt;** (Java 5) — a handle to a pending result: `get()` (blocking), `get(timeout)`, `cancel(mayInterruptIfRunning)`, `isDone()`, `isCancelled()`.\n\n" +
        "Its limitations are the reason `CompletableFuture` exists:\n\n" +
        "- `get()` **blocks** — there is no callback.\n" +
        "- You cannot **chain** or **combine** futures.\n" +
        "- No way to complete it manually or to handle errors functionally.\n" +
        "- `isDone()` polling is the only non-blocking option.\n\n" +
        "**CompletableFuture&lt;V&gt;** (Java 8) implements `Future` **and** `CompletionStage`, giving a full async pipeline:\n\n" +
        "- Create: `supplyAsync`, `runAsync`, `completedFuture`, or `new CompletableFuture<>()` completed manually.\n" +
        "- Transform: `thenApply` (sync fn), `thenCompose` (flat-map, for a function returning another stage), `thenAccept`, `thenRun`.\n" +
        "- Combine: `thenCombine` (both), `allOf`, `anyOf`, `applyToEither`.\n" +
        "- Handle errors: `exceptionally`, `handle`, `whenComplete`; Java 12 added `exceptionallyCompose`.\n" +
        "- Timeouts (Java 9): `orTimeout`, `completeOnTimeout`.\n\n" +
        "**Java 19+ `StructuredTaskScope`** is the next step: scoped concurrency where child tasks are guaranteed to finish or be cancelled when the scope closes.\n\n" +
        "**The `Async` suffix rule:** `thenApply` may run on the completing thread; `thenApplyAsync` always dispatches to the common ForkJoinPool (or an explicit executor). In a server, pass your own executor — never block the common pool.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class FutureEvolution {

    record User(long id, String name) { }
    record Order(long id, long userId, long total) { }

    public static void main(String[] args) throws Exception {
        ExecutorService io = Executors.newFixedThreadPool(8);

        // Runnable: no result, no checked exceptions.
        Runnable r = () -> System.out.println("side effect only");

        // Callable: result + checked exceptions.
        Callable<String> c = () -> { Thread.sleep(10); return "value"; };

        // Future: blocking handle, no composition.
        Future<String> future = io.submit(c);
        System.out.println(future.get(1, TimeUnit.SECONDS));

        // CompletableFuture: non-blocking composition.
        CompletableFuture<User> userF =
            CompletableFuture.supplyAsync(() -> fetchUser(1L), io);

        // thenCompose = flatMap (the function itself returns a stage).
        CompletableFuture<List<Order>> ordersF =
            userF.thenCompose(u -> CompletableFuture.supplyAsync(() -> fetchOrders(u.id()), io));

        // thenCombine = zip two independent stages.
        CompletableFuture<String> summary = userF.thenCombine(ordersF, (u, orders) -> {
            long total = orders.stream().mapToLong(Order::total).sum();
            return u.name() + " spent " + total + " across " + orders.size() + " orders";
        });

        // Error handling + timeout + fallback.
        String result = summary
            .orTimeout(2, TimeUnit.SECONDS)
            .exceptionally(ex -> "fallback: " + ex.getClass().getSimpleName())
            .join();
        System.out.println(result);

        // Fan-out then join: allOf returns Void, so re-map to collect results.
        List<CompletableFuture<User>> futures = List.of(1L, 2L, 3L).stream()
            .map(id -> CompletableFuture.supplyAsync(() -> fetchUser(id), io))
            .toList();
        CompletableFuture<List<User>> all = CompletableFuture
            .allOf(futures.toArray(CompletableFuture[]::new))
            .thenApply(v -> futures.stream().map(CompletableFuture::join).toList());
        System.out.println(all.join());

        // anyOf: first one wins (hedged requests).
        CompletableFuture<Object> fastest = CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(() -> slow("replica-a", 200), io),
            CompletableFuture.supplyAsync(() -> slow("replica-b", 50),  io));
        System.out.println("winner: " + fastest.join());

        // Manual completion - bridging a callback API into CompletableFuture.
        CompletableFuture<String> manual = new CompletableFuture<>();
        io.submit(() -> manual.complete("pushed in later"));
        System.out.println(manual.join());

        io.shutdown();
        io.awaitTermination(5, TimeUnit.SECONDS);
    }

    static User fetchUser(long id) { sleep(50); return new User(id, "user-" + id); }
    static List<Order> fetchOrders(long userId) {
        sleep(50); return List.of(new Order(1, userId, 120), new Order(2, userId, 80));
    }
    static String slow(String name, long ms) { sleep(ms); return name; }
    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Future only blocks; CompletableFuture adds composition, combination, error handling and timeouts — always pass your own executor.",
      followUps: [
        "What is the difference between thenApply and thenCompose?",
        "Why should you avoid the common ForkJoinPool for IO?",
      ],
    },
    {
      id: "b097",
      question: "How does ForkJoinPool work and what is work stealing?",
      answer:
        "`ForkJoinPool` (Java 7) is designed for **divide-and-conquer** CPU-bound work, not for blocking IO.\n\n" +
        "**Work stealing** is the core idea. Each worker thread owns a **double-ended queue (deque)**:\n\n" +
        "- A worker pushes and pops its **own** subtasks at the **head** (LIFO). LIFO is deliberate: the most recently forked subtask is the hottest in cache and the smallest, which keeps locality high.\n" +
        "- When a worker's deque is empty, it **steals from the tail** (FIFO) of a random victim's deque. Tail stealing takes the *oldest, largest* task, which minimises stealing frequency and contention with the owner.\n" +
        "- The result is automatic load balancing with almost no central coordination.\n\n" +
        "Usage: extend `RecursiveTask<V>` (returns a value) or `RecursiveAction` (void) and write `compute()` as 'if small enough, solve directly; else split, `fork()` one half, `compute()` the other, then `join()`'. **Fork one and compute the other** — forking both and joining both wastes a thread.\n\n" +
        "**Threshold choice matters.** Too small and the fork/join bookkeeping dominates; too large and you lose parallelism. Aim for a few thousand operations per leaf, and roughly 10× more tasks than cores.\n\n" +
        "**The common pool** (`ForkJoinPool.commonPool()`) backs parallel streams and `CompletableFuture.*Async` by default. Its size is `cores - 1`, and it is **shared process-wide**. Blocking in it — a JDBC call inside a `parallelStream()` — starves every other user in the JVM. Either pass your own pool or wrap blocking code in a `ManagedBlocker`.\n\n" +
        "In Java 21 virtual threads are the better answer for blocking work; ForkJoinPool remains the right tool for CPU-bound recursive decomposition (and is the scheduler underneath virtual threads).",
      code: `import java.util.concurrent.*;
import java.util.stream.LongStream;

public class ForkJoinDemo {

    /** Divide and conquer: sum a large array. */
    static class SumTask extends RecursiveTask<Long> {
        private static final int THRESHOLD = 10_000;
        private final long[] data; private final int lo, hi;

        SumTask(long[] data, int lo, int hi) { this.data = data; this.lo = lo; this.hi = hi; }

        @Override protected Long compute() {
            if (hi - lo <= THRESHOLD) {              // small enough: solve directly
                long sum = 0;
                for (int i = lo; i < hi; i++) sum += data[i];
                return sum;
            }
            int mid = (lo + hi) >>> 1;
            SumTask left = new SumTask(data, lo, mid);
            SumTask right = new SumTask(data, mid, hi);
            left.fork();                              // push onto THIS worker's deque
            long rightResult = right.compute();       // compute one half inline
            return left.join() + rightResult;         // join the forked half
        }
    }

    /** RecursiveAction: no result, e.g. an in-place parallel transform. */
    static class SquareAction extends RecursiveAction {
        private static final int THRESHOLD = 10_000;
        private final long[] data; private final int lo, hi;
        SquareAction(long[] data, int lo, int hi) { this.data = data; this.lo = lo; this.hi = hi; }

        @Override protected void compute() {
            if (hi - lo <= THRESHOLD) {
                for (int i = lo; i < hi; i++) data[i] *= data[i];
            } else {
                int mid = (lo + hi) >>> 1;
                invokeAll(new SquareAction(data, lo, mid), new SquareAction(data, mid, hi));
            }
        }
    }

    public static void main(String[] args) {
        long[] data = LongStream.rangeClosed(1, 20_000_000).toArray();

        // Use a DEDICATED pool, not the common pool, for application work.
        ForkJoinPool pool = new ForkJoinPool(Runtime.getRuntime().availableProcessors());
        long t0 = System.nanoTime();
        long parallel = pool.invoke(new SumTask(data, 0, data.length));
        long parallelMs = (System.nanoTime() - t0) / 1_000_000;

        t0 = System.nanoTime();
        long sequential = 0;
        for (long v : data) sequential += v;
        long seqMs = (System.nanoTime() - t0) / 1_000_000;

        System.out.println("parallel   " + parallel   + " in " + parallelMs + "ms");
        System.out.println("sequential " + sequential + " in " + seqMs + "ms");
        System.out.println("steals=" + pool.getStealCount()
            + " parallelism=" + pool.getParallelism());

        pool.invoke(new SquareAction(data, 0, 1_000));

        // Parallel streams silently use the SHARED common pool:
        //   long s = LongStream.of(data).parallel().sum();
        // To confine it, submit the stream to your own pool:
        long confined = pool.submit(() ->
            java.util.Arrays.stream(data).parallel().sum()).join();
        System.out.println("confined " + confined);

        pool.shutdown();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Workers push/pop their own deque LIFO and steal from others' tails FIFO; never block in the shared common pool.",
      followUps: [
        "Why steal from the tail rather than the head?",
        "What is ForkJoinPool.ManagedBlocker for?",
      ],
    },
    {
      id: "b098",
      question: "What are virtual threads and when should you use them?",
      answer:
        "Virtual threads (Project Loom, final in **Java 21**, JEP 444) are **lightweight threads scheduled by the JVM** rather than the OS.\n\n" +
        "Platform threads: 1:1 with an OS thread, ~1 MB of reserved stack, creation costs ~1 ms, context switches go through the kernel. Practical ceiling: a few thousand.\n\n" +
        "Virtual threads: a heap-allocated **continuation** plus a `Thread` object, a few hundred bytes, creation in microseconds. Millions are feasible. They are **mounted** onto a small pool of carrier platform threads (a `ForkJoinPool` sized to the core count). When a virtual thread blocks on a JDK blocking call, its stack is **unmounted** to the heap and the carrier is freed for another virtual thread. When the call completes it is remounted — possibly on a different carrier.\n\n" +
        "What this changes: the classic 'thread-per-request' model becomes viable again. You write straight-line blocking code — no reactive callbacks, no `CompletableFuture` chains — and still get high throughput. Debuggers, profilers, stack traces and try/finally all work normally, unlike reactive stacks.\n\n" +
        "**Pinning** — the thing to know. A virtual thread cannot unmount while:\n\n" +
        "- Inside a **`synchronized`** block (fixed in JDK 24/JEP 491, but interviewers still expect the JDK 21 answer: use `ReentrantLock` instead), or\n" +
        "- Executing a **native frame** / JNI call.\n\n" +
        "Detect with `-Djdk.tracePinnedThreads=full`.\n\n" +
        "**Do not pool virtual threads** — they are cheap and disposable; use `Executors.newVirtualThreadPerTaskExecutor()`. **Do not use them for CPU-bound work** — there is no gain; use a sized platform pool. And avoid `ThreadLocal`-heavy code (prefer `ScopedValue`), and switch semaphores in for pool-based rate limiting, because the pool no longer bounds concurrency.\n\n" +
        "In Spring Boot 3.2+ it is one property: `spring.threads.virtual.enabled=true`.",
      code: `import java.time.Duration;
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class VirtualThreadsDemo {

    public static void main(String[] args) throws Exception {

        // 1. Create one directly.
        Thread vt = Thread.ofVirtual().name("vt-demo").start(() ->
            System.out.println(Thread.currentThread() + " isVirtual=" +
                Thread.currentThread().isVirtual()));
        vt.join();

        // 2. The idiomatic executor: one virtual thread PER TASK, never pooled.
        long t0 = System.currentTimeMillis();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var futures = IntStream.range(0, 100_000)
                .mapToObj(i -> executor.submit(() -> {
                    Thread.sleep(Duration.ofMillis(100));    // simulated IO
                    return i;
                }))
                .toList();
            long sum = 0;
            for (var f : futures) sum += f.get();
            System.out.println("100k blocking tasks, sum=" + sum
                + " in " + (System.currentTimeMillis() - t0) + "ms");
        }   // close() waits for all tasks - ExecutorService is AutoCloseable in 19+

        // 3. PINNING: synchronized blocks the carrier thread (pre-JDK 24).
        Object monitor = new Object();
        Runnable pinned = () -> {
            synchronized (monitor) {                        // carrier cannot be released
                try { Thread.sleep(10); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt(); }
            }
        };
        // FIX: use a ReentrantLock, which is Loom-aware.
        var lock = new java.util.concurrent.locks.ReentrantLock();
        Runnable notPinned = () -> {
            lock.lock();
            try { Thread.sleep(10); } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally { lock.unlock(); }
        };
        Thread.ofVirtual().start(pinned).join();
        Thread.ofVirtual().start(notPinned).join();
        // Run with -Djdk.tracePinnedThreads=full to see pinning reports.

        // 4. Bound concurrency with a Semaphore, NOT with the pool size.
        Semaphore downstream = new Semaphore(50);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1_000; i++) executor.submit(() -> {
                downstream.acquire();
                try { Thread.sleep(Duration.ofMillis(5)); }
                finally { downstream.release(); }
                return null;
            });
        }

        // 5. Structured concurrency (preview): children are cancelled with the scope.
        // try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        //     var user  = scope.fork(() -> fetchUser(1));
        //     var order = scope.fork(() -> fetchOrder(1));
        //     scope.join().throwIfFailed();
        //     System.out.println(user.get() + " " + order.get());
        // }

        // Spring Boot 3.2+:  spring.threads.virtual.enabled=true
    }
}`,
      codeLanguage: "java",
      explanation:
        "Virtual threads unmount on blocking IO so thread-per-request scales to millions — never pool them, never use them for CPU-bound work.",
      followUps: [
        "What is pinning and how do you detect it?",
        "Why does a connection pool still matter with virtual threads?",
      ],
    },
    {
      id: "b099",
      question: "Explain the producer-consumer pattern and the BlockingQueue implementations.",
      answer:
        "Producer-consumer decouples the rate of work creation from the rate of consumption through a bounded buffer. **Bounded** is the operative word: an unbounded buffer converts a downstream slowdown into an `OutOfMemoryError` instead of backpressure.\n\n" +
        "`BlockingQueue` gives four behaviour families per operation, which is the table to recite:\n\n" +
        "- **Throws**: `add` / `remove` / `element`\n" +
        "- **Returns special value**: `offer` / `poll` / `peek`\n" +
        "- **Blocks**: `put` / `take`\n" +
        "- **Times out**: `offer(e, t, u)` / `poll(t, u)`\n\n" +
        "The implementations:\n\n" +
        "- **ArrayBlockingQueue** — bounded circular array, **one lock** for both ends, optional fairness. Predictable memory, simplest choice.\n" +
        "- **LinkedBlockingQueue** — optionally bounded (default `Integer.MAX_VALUE` — the dangerous default), **two locks** (putLock/takeLock) so producers and consumers do not contend. Higher throughput, more allocation.\n" +
        "- **SynchronousQueue** — zero capacity; each `put` waits for a matching `take`. Direct handoff. This is what `newCachedThreadPool` uses so every task forces a thread.\n" +
        "- **PriorityBlockingQueue** — unbounded heap ordered by comparator. Note: **unbounded**, so no backpressure.\n" +
        "- **DelayQueue** — elements become available only after their delay expires. Scheduling, retry backoff.\n" +
        "- **LinkedTransferQueue** — `transfer()` blocks until a consumer receives the element; the most flexible/fastest.\n" +
        "- **LinkedBlockingDeque** — both-ends blocking, for work stealing.\n\n" +
        "**Shutdown** is the practical trap: use a **poison pill** (one per consumer) or `shutdown()` + `awaitTermination` + `shutdownNow()`. Never rely on a `while(true)` consumer with no exit condition.\n\n" +
        "Memory-model bonus: a `put` **happens-before** the matching `take`, so objects handed through the queue are safely published.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public class ProducerConsumer {

    record Job(int id, String payload) { }
    /** Poison pill: a sentinel that tells a consumer to stop. */
    private static final Job POISON = new Job(-1, "POISON");

    public static void main(String[] args) throws Exception {
        // BOUNDED: producers block when consumers fall behind = backpressure.
        BlockingQueue<Job> queue = new ArrayBlockingQueue<>(100);
        int producers = 2, consumers = 3;
        AtomicLong processed = new AtomicLong();

        ExecutorService pool = Executors.newFixedThreadPool(producers + consumers);

        for (int p = 0; p < producers; p++) {
            final int pid = p;
            pool.submit(() -> {
                try {
                    for (int i = 0; i < 500; i++) {
                        queue.put(new Job(pid * 1000 + i, "payload"));   // blocks when full
                    }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            });
        }

        for (int c = 0; c < consumers; c++) {
            pool.submit(() -> {
                try {
                    while (true) {
                        Job job = queue.take();                          // blocks when empty
                        if (job == POISON) { queue.put(POISON); break; } // pass it on
                        processed.incrementAndGet();
                    }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            });
        }

        Thread.sleep(1000);
        queue.put(POISON);                       // one pill, relayed by each consumer
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("processed " + processed.get());

        // The four operation families.
        BlockingQueue<String> q = new ArrayBlockingQueue<>(1);
        System.out.println(q.offer("a"));                       // true  - special value
        System.out.println(q.offer("b"));                       // false - no exception
        try { q.add("c"); } catch (IllegalStateException e) {    // throws
            System.out.println("add throws when full");
        }
        System.out.println(q.offer("d", 50, TimeUnit.MILLISECONDS));  // times out -> false
        System.out.println(q.take());                                  // blocks -> "a"

        // SynchronousQueue: direct handoff, zero capacity.
        BlockingQueue<String> handoff = new SynchronousQueue<>();
        new Thread(() -> {
            try { System.out.println("received " + handoff.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }).start();
        handoff.put("direct");                                   // waits for the taker

        // DelayQueue: retry with backoff.
        record Retry(String key, long readyAt) implements Delayed {
            public long getDelay(TimeUnit u) {
                return u.convert(readyAt - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
            }
            public int compareTo(Delayed o) {
                return Long.compare(getDelay(TimeUnit.MILLISECONDS),
                                    o.getDelay(TimeUnit.MILLISECONDS));
            }
        }
        DelayQueue<Retry> retries = new DelayQueue<>();
        retries.put(new Retry("order-1", System.currentTimeMillis() + 100));
        System.out.println("retry ready: " + retries.take().key());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use a bounded queue for backpressure, pick the implementation by locking strategy, and shut down with poison pills.",
      followUps: [
        "Why is LinkedBlockingQueue's default capacity dangerous?",
        "How does a SynchronousQueue change a thread pool's behaviour?",
      ],
    },
    {
      id: "b100",
      question: "How does ConcurrentHashMap achieve thread safety without locking the whole map?",
      answer:
        "Java 7 used **segment locking**: the map was split into 16 `Segment` objects, each an independent `ReentrantLock`. Concurrency was fixed at the segment count and every segment carried overhead.\n\n" +
        "**Java 8 rewrote it completely.** There are no segments. The structure is a single `Node[] table`, identical in shape to `HashMap`, plus:\n\n" +
        "- **Lock striping at bin granularity** — `synchronized` on the **first node of a bin**. Two threads writing to different bins never interact. Effective concurrency equals the number of bins, which is far higher than 16.\n" +
        "- **CAS for empty bins** — inserting into an empty bin uses `casTabAt`, no lock at all. The common case is completely lock-free.\n" +
        "- **Lock-free reads** — `Node.val` and `Node.next` are `volatile`, and `tabAt` uses a volatile array read. `get()` **never locks**, so readers never block and never block writers.\n" +
        "- **Treeification** — bins with more than 8 nodes (and table ≥ 64) become red-black trees, exactly as in `HashMap`.\n" +
        "- **Cooperative resize** — a resizing thread installs a `ForwardingNode` in each migrated bin; any other thread that touches a forwarded bin **helps transfer** instead of blocking. This is why CHM resizes without a stop-the-world pause.\n" +
        "- **Striped size counting** — `baseCount` plus a `CounterCell[]` (`@Contended`) rather than one contended counter, so `size()` is an estimate summed over cells.\n\n" +
        "Semantics to know: **no null keys or values** (so `get` returning null is unambiguous for a lock-free reader); **weakly consistent iterators** that never throw `ConcurrentModificationException`; **atomic compound operations** `putIfAbsent`, `compute`, `computeIfAbsent`, `merge`, `replace`.\n\n" +
        "**The trap:** the mapping function inside `computeIfAbsent` runs **while holding the bin lock**. Recursive updates to the same map, or slow IO inside it, will deadlock or stall the bin.",
      code: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class ConcurrentHashMapDemo {

    public static void main(String[] args) throws Exception {
        ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

        // Atomic compound operations - never get-then-put.
        counters.computeIfAbsent("hits", k -> new AtomicLong()).incrementAndGet();

        ConcurrentHashMap<String, Integer> tally = new ConcurrentHashMap<>();
        tally.merge("a", 1, Integer::sum);          // atomic read-modify-write
        tally.putIfAbsent("b", 0);                  // atomic check-then-act
        tally.compute("a", (k, v) -> v == null ? 1 : v + 1);
        tally.computeIfPresent("b", (k, v) -> v + 10);

        // WRONG: two separate calls are not atomic.
        Integer current = tally.get("a");
        tally.put("a", current == null ? 1 : current + 1);   // lost update under contention

        // Concurrent hammering: correctness under 16 threads.
        ExecutorService pool = Executors.newFixedThreadPool(16);
        CountDownLatch done = new CountDownLatch(16);
        for (int t = 0; t < 16; t++) pool.submit(() -> {
            for (int i = 0; i < 50_000; i++) tally.merge("shared", 1, Integer::sum);
            done.countDown();
        });
        done.await();
        System.out.println("merge total: " + tally.get("shared"));   // exactly 800000

        // Weakly consistent iteration: never throws ConcurrentModificationException.
        ConcurrentHashMap<Integer, String> live = new ConcurrentHashMap<>();
        for (int i = 0; i < 1000; i++) live.put(i, "v" + i);
        pool.submit(() -> { for (int i = 1000; i < 2000; i++) live.put(i, "v" + i); });
        int seen = 0;
        for (Map.Entry<Integer, String> e : live.entrySet()) seen++;   // safe
        System.out.println("iterated " + seen + " entries while writing");

        // No nulls - unlike HashMap.
        try { live.put(1, null); }
        catch (NullPointerException e) { System.out.println("null values rejected"); }

        // TRAP: computeIfAbsent holds the bin lock; do not do IO or recurse inside it.
        ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();
        // cache.computeIfAbsent("k", k -> cache.computeIfAbsent("k2", x -> "v")); // DEADLOCK
        String value = cache.get("k");
        if (value == null) {                         // safe pattern for slow loaders
            String loaded = slowLoad("k");
            value = cache.putIfAbsent("k", loaded) == null ? loaded : cache.get("k");
        }
        System.out.println(value);

        // Bulk parallel operations (Java 8).
        System.out.println(live.reduceValues(1000, v -> 1, Integer::sum) + " values");
        System.out.println(live.search(1000, (k, v) -> k > 1500 ? k : null));

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }

    static String slowLoad(String key) { return "loaded-" + key; }
}`,
      codeLanguage: "java",
      explanation:
        "Java 8 CHM locks only the first node of a bin, CASes empty bins, reads lock-free via volatile nodes, and lets threads help resize.",
      followUps: [
        "Why does ConcurrentHashMap forbid null values?",
        "What happens if computeIfAbsent's function updates the same map?",
      ],
    },
    {
      id: "b101",
      question: "Explain @Async in Spring Boot: configuration, pitfalls and exception handling.",
      answer:
        "`@Async` makes a method return immediately and run on a task executor. Enable it with **`@EnableAsync`** on a `@Configuration` class — without it the annotation is silently ignored, which is the single most common bug.\n\n" +
        "**How it works:** Spring creates a proxy (JDK dynamic or CGLIB) and `AsyncExecutionInterceptor` submits the invocation to an `AsyncTaskExecutor`. Because it is **proxy-based**, the same rules as `@Transactional` apply:\n\n" +
        "- **Self-invocation does not work.** Calling `this.asyncMethod()` from inside the same bean bypasses the proxy and runs synchronously.\n" +
        "- The method must be **public** and the bean must be a Spring bean.\n" +
        "- `final` methods/classes cannot be CGLIB-proxied.\n\n" +
        "**Return types:** `void` (fire and forget), `Future<T>`, `CompletableFuture<T>` (preferred — composable), or `ListenableFuture`. A method returning a plain value runs async but the caller gets `null`.\n\n" +
        "**Exception handling** is the second big trap:\n\n" +
        "- For `void` methods the exception **vanishes** unless you register an `AsyncUncaughtExceptionHandler` via `AsyncConfigurer`.\n" +
        "- For `CompletableFuture` returns, the exception is captured in the future — the caller sees it only if it inspects the result.\n\n" +
        "**Never rely on the default executor.** Before Boot 3 it was a `SimpleAsyncTaskExecutor` that creates **a new thread per call** — unbounded. Define a named `ThreadPoolTaskExecutor` bean (or set `spring.task.execution.*`) with a bounded queue and `CallerRunsPolicy`.\n\n" +
        "**Context propagation** is the third trap: the async thread has no `SecurityContext`, no `RequestAttributes`, no MDC and no transaction. Use `DelegatingSecurityContextAsyncTaskExecutor`, a `TaskDecorator` for MDC, and remember `@Transactional` does **not** span the async boundary.",
      code: `import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.*;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.slf4j.MDC;

import java.util.Map;
import java.util.concurrent.*;

@SpringBootApplication
@EnableAsync                                   // REQUIRED, or @Async is ignored
public class AsyncApplication { }

@Configuration
class AsyncConfig implements AsyncConfigurer {

    @Bean("taskExecutor")                      // the default-by-name executor
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(32);
        executor.setQueueCapacity(200);        // BOUNDED
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.setTaskDecorator(mdcDecorator());   // carry the trace id across
        executor.initialize();
        return executor;
    }

    /** Copy MDC (traceId, userId) onto the async thread and clear it afterwards. */
    private TaskDecorator mdcDecorator() {
        return runnable -> {
            Map<String, String> context = MDC.getCopyOfContextMap();
            return () -> {
                if (context != null) MDC.setContextMap(context);
                try { runnable.run(); } finally { MDC.clear(); }
            };
        };
    }

    /** Without this, exceptions from void @Async methods disappear silently. */
    @Override public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            System.err.println("async failure in " + method.getName() + ": " + ex.getMessage());
    }
}

@Service
class NotificationService {

    @Async                                     // uses "taskExecutor"
    public void sendEmail(String to) {
        // exception here goes to AsyncUncaughtExceptionHandler, NOT to the caller
        throw new IllegalStateException("smtp down");
    }

    @Async("taskExecutor")                     // explicit executor by bean name
    public CompletableFuture<String> fetchProfile(long id) {
        sleep(100);
        return CompletableFuture.completedFuture("profile-" + id);
    }

    /** BROKEN: self-invocation bypasses the proxy and runs synchronously. */
    public void brokenCaller() {
        this.sendEmail("a@b.c");               // NOT async
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

@Service
class ProfileAggregator {
    private final NotificationService service;
    ProfileAggregator(NotificationService service) { this.service = service; }

    /** Fan out three async calls and join them - total latency = the slowest one. */
    public String aggregate() {
        CompletableFuture<String> a = service.fetchProfile(1);
        CompletableFuture<String> b = service.fetchProfile(2);
        CompletableFuture<String> c = service.fetchProfile(3);
        return CompletableFuture.allOf(a, b, c)
            .thenApply(v -> a.join() + "|" + b.join() + "|" + c.join())
            .orTimeout(2, TimeUnit.SECONDS)
            .exceptionally(ex -> "degraded")
            .join();
    }
}`,
      codeLanguage: "java",
      explanation:
        "@EnableAsync plus a bounded named executor; self-invocation breaks it, void exceptions vanish without an AsyncUncaughtExceptionHandler.",
      followUps: [
        "Why does @Transactional not span an @Async call?",
        "How do you propagate SecurityContext to an async thread?",
      ],
    },
    {
      id: "b102",
      question: "How do you handle concurrency at the database level — optimistic vs pessimistic locking?",
      answer:
        "Application-level `synchronized` is worthless in a multi-instance deployment. Concurrency control has to live where the shared state lives: the database.\n\n" +
        "**Optimistic locking** — assume conflicts are rare.\n\n" +
        "- JPA: a **`@Version`** column (int/long/timestamp). On update Hibernate emits `UPDATE ... SET version = 3 WHERE id = ? AND version = 2`. If zero rows are affected, it throws `OptimisticLockException` / `ObjectOptimisticLockingFailureException`.\n" +
        "- No locks held, so no deadlocks and maximum throughput.\n" +
        "- The caller must **retry** — usually with `@Retryable` or a small loop with backoff.\n" +
        "- `LockModeType.OPTIMISTIC_FORCE_INCREMENT` bumps the version even on a read, for aggregate-root consistency.\n" +
        "- Best for: low-contention, read-heavy, long user 'think time' between read and write (a web form).\n\n" +
        "**Pessimistic locking** — take the lock up front.\n\n" +
        "- `LockModeType.PESSIMISTIC_WRITE` → `SELECT ... FOR UPDATE`; `PESSIMISTIC_READ` → `FOR SHARE`.\n" +
        "- Serialises access, so no retries — but holds a database lock for the whole transaction, risking **lock waits, deadlocks and reduced throughput**. Always set `jakarta.persistence.lock.timeout`.\n" +
        "- Best for: high contention on a hot row (inventory, seat booking, account balance) where a retry storm would be worse.\n\n" +
        "Also be ready to mention:\n\n" +
        "- **Isolation levels** — READ_COMMITTED (the usual default) allows non-repeatable reads and phantoms; REPEATABLE_READ and SERIALIZABLE cost more.\n" +
        "- **Atomic SQL** — `UPDATE inventory SET qty = qty - 1 WHERE id = ? AND qty >= 1` needs no lock at all and is often the best answer.\n" +
        "- **Distributed locks** — Redis (Redisson/SET NX PX with a fencing token) or a `SELECT FOR UPDATE` on a lock table, plus **idempotency keys** so retries are safe.\n" +
        "- **Outbox pattern** for atomic 'write + publish event'.",
      code: `import jakarta.persistence.*;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.jpa.repository.*;
import org.springframework.retry.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Entity
class Product {
    @Id private Long id;
    private int stock;

    @Version                                    // optimistic lock column
    private long version;

    public void reserve(int qty) {
        if (stock < qty) throw new IllegalStateException("insufficient stock");
        stock -= qty;
    }
    public int getStock() { return stock; }
}

interface ProductRepository extends JpaRepository<Product, Long> {

    /** Pessimistic: SELECT ... FOR UPDATE with a bounded wait. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select p from Product p where p.id = :id")
    java.util.Optional<Product> findByIdForUpdate(Long id);

    /** Best of all: one atomic statement, no lock, no retry. */
    @Modifying
    @Query("update Product p set p.stock = p.stock - :qty " +
           "where p.id = :id and p.stock >= :qty")
    int decrementStock(Long id, int qty);
}

@Service
class InventoryService {
    private final ProductRepository repository;
    InventoryService(ProductRepository repository) { this.repository = repository; }

    /** Optimistic + retry: high throughput when conflicts are rare. */
    @Retryable(retryFor = OptimisticLockingFailureException.class,
               maxAttempts = 4, backoff = @Backoff(delay = 50, multiplier = 2))
    @Transactional
    public void reserveOptimistic(Long id, int qty) {
        Product p = repository.findById(id).orElseThrow();
        p.reserve(qty);                         // version check happens at flush
    }

    @Recover
    public void recover(OptimisticLockingFailureException ex, Long id, int qty) {
        throw new IllegalStateException("could not reserve after retries for " + id, ex);
    }

    /** Pessimistic: serialise access to a hot row. */
    @Transactional
    public void reservePessimistic(Long id, int qty) {
        Product p = repository.findByIdForUpdate(id).orElseThrow();
        p.reserve(qty);
    }

    /** Atomic UPDATE: no entity load, no lock, no retry - usually the winner. */
    @Transactional
    public boolean reserveAtomic(Long id, int qty) {
        return repository.decrementStock(id, qty) == 1;
    }

    /** Isolation level when you genuinely need repeatable reads. */
    @Transactional(isolation = Isolation.REPEATABLE_READ, timeout = 5)
    public int auditedRead(Long id) {
        return repository.findById(id).orElseThrow().getStock();
    }
}`,
      codeLanguage: "java",
      explanation:
        "@Version plus retry for low contention, SELECT FOR UPDATE for hot rows — and a single atomic UPDATE beats both when it fits.",
      followUps: [
        "Why is application-level synchronized useless across multiple instances?",
        "How does a fencing token make a Redis lock safe?",
      ],
    },
    {
      id: "b103",
      question: "What is the difference between concurrency and parallelism, and what do Amdahl's and Little's laws tell you?",
      answer:
        "**Concurrency** is *dealing with* many things at once — a structuring concern. Tasks are interleaved; one CPU is enough. **Parallelism** is *doing* many things at once — an execution concern, requiring multiple cores. Rob Pike's line: 'concurrency is about structure, parallelism is about execution.' A single-core machine running a web server is concurrent but not parallel.\n\n" +
        "**Amdahl's law** bounds the speedup from parallelism: `S = 1 / (s + p/N)` where `s` is the serial fraction. The brutal implication: with **5% serial** work the maximum speedup is **20×**, no matter how many cores you add. With 10% serial, 10×. So:\n\n" +
        "- Adding cores has sharply diminishing returns.\n" +
        "- The work that matters is **shrinking the serial fraction** — lock contention, single-threaded IO, synchronised sections.\n" +
        "- Gustafson's law is the optimistic counterpart: if the problem grows with the machine, scaling is better than Amdahl suggests.\n\n" +
        "**Little's law** — `L = λ × W`: the average number of in-flight requests equals arrival rate × average latency. Enormously practical:\n\n" +
        "- 1000 req/s × 200 ms latency = **200 concurrent requests** in flight, so you need at least 200 threads (or virtual threads) and a matching connection-pool budget.\n" +
        "- Halving latency halves the required concurrency.\n" +
        "- It tells you when a pool is undersized *before* you see timeouts.\n\n" +
        "Round it out with the **USE / queueing** view: as utilisation approaches 100%, queueing delay grows without bound (`W = S / (1 - ρ)`), which is why a system at 95% CPU has terrible tail latency even though it 'has headroom'. Target 60–70%.\n\n" +
        "**The senior framing:** most backend services are IO-bound, so the lever is concurrency and backpressure, not parallelism. Reach for parallel streams only for CPU-bound work on large data sets, after measuring.",
      code: `import java.util.concurrent.*;
import java.util.stream.*;

public class ConcurrencyVsParallelism {

    /** Amdahl: maximum speedup given a serial fraction and N processors. */
    static double amdahl(double serialFraction, int processors) {
        return 1.0 / (serialFraction + (1 - serialFraction) / processors);
    }

    /** Little's law: required concurrency = throughput x latency. */
    static double requiredConcurrency(double requestsPerSecond, double latencySeconds) {
        return requestsPerSecond * latencySeconds;
    }

    /** Queueing: response time explodes as utilisation approaches 1. */
    static double responseTime(double serviceTime, double utilisation) {
        return serviceTime / (1 - utilisation);
    }

    public static void main(String[] args) throws Exception {
        for (int n : new int[]{2, 4, 8, 16, 64, 1024}) {
            System.out.printf("N=%-5d 5%% serial -> %.2fx   10%% serial -> %.2fx%n",
                n, amdahl(0.05, n), amdahl(0.10, n));
        }

        System.out.printf("%n1000 rps x 200ms  => %.0f concurrent requests%n",
            requiredConcurrency(1000, 0.200));
        System.out.printf("1000 rps x 50ms   => %.0f concurrent requests%n",
            requiredConcurrency(1000, 0.050));

        System.out.printf("%n60%% utilisation -> %.2fx service time%n", responseTime(1, 0.60));
        System.out.printf("95%% utilisation -> %.2fx service time%n", responseTime(1, 0.95));
        System.out.printf("99%% utilisation -> %.2fx service time%n", responseTime(1, 0.99));

        // CONCURRENCY (IO-bound): interleaving wins, cores are irrelevant.
        try (var vt = Executors.newVirtualThreadPerTaskExecutor()) {
            long t0 = System.currentTimeMillis();
            var futures = IntStream.range(0, 1000)
                .mapToObj(i -> vt.submit(() -> { Thread.sleep(100); return i; })).toList();
            for (var f : futures) f.get();
            System.out.println("\\n1000 x 100ms IO tasks: "
                + (System.currentTimeMillis() - t0) + "ms (concurrency)");
        }

        // PARALLELISM (CPU-bound): needs real cores, bounded by Amdahl.
        long[] data = LongStream.rangeClosed(1, 50_000_000).toArray();
        long t0 = System.nanoTime();
        long seq = LongStream.of(data).map(ConcurrencyVsParallelism::work).sum();
        long seqMs = (System.nanoTime() - t0) / 1_000_000;

        t0 = System.nanoTime();
        long par = LongStream.of(data).parallel().map(ConcurrencyVsParallelism::work).sum();
        long parMs = (System.nanoTime() - t0) / 1_000_000;

        System.out.printf("CPU-bound: sequential %dms, parallel %dms on %d cores (%.2fx)%n",
            seqMs, parMs, Runtime.getRuntime().availableProcessors(), (double) seqMs / parMs);
        System.out.println(seq == par);
    }

    static long work(long v) { return (v * 31) ^ (v >>> 7); }
}`,
      codeLanguage: "java",
      explanation:
        "Concurrency is structure, parallelism is execution; Amdahl caps speedup by the serial fraction and Little's law sizes your pools.",
      followUps: [
        "Why does tail latency explode at 95% utilisation?",
        "Use Little's law to size a connection pool for 500 rps at 80 ms.",
      ],
    },
    {
      id: "b104",
      question: "How do you test concurrent code?",
      answer:
        "Concurrency bugs are non-deterministic, so a passing test proves very little. The strategy is to make failures **more likely**, not to hope.\n\n" +
        "1. **Design for testability first.** Extract the pure logic from the threading. A function you can call sequentially needs no concurrent test. Inject the `ExecutorService` so a test can pass a deterministic (same-thread) one.\n\n" +
        "2. **Stress tests.** Run N threads (more than cores) × M iterations against the shared object and assert an invariant at the end. Use a `CountDownLatch` **start gate** so all threads begin simultaneously — otherwise they run sequentially and never collide. Use a completion gate plus `awaitTermination`. Repeat the test 100+ times (`@RepeatedTest`).\n\n" +
        "3. **jcstress** — the OpenJDK harness for JMM-level tests. It runs billions of iterations, records every observed outcome and labels them ACCEPTABLE / FORBIDDEN. This is the only serious way to test happens-before assumptions.\n\n" +
        "4. **Lincheck** (JetBrains) — generates random concurrent scenarios and verifies **linearisability** against a sequential specification, then minimises a failing interleaving. Excellent for lock-free data structures.\n\n" +
        "5. **Widen the race window** — insert random `Thread.yield()`/`sleep` at suspected interleaving points (a `TestDecorator`), or run with `-XX:+UnlockDiagnosticVMOptions -XX:+StressLCM -XX:+StressGCM`.\n\n" +
        "6. **Deterministic tests where possible** — `Awaitility` for async assertions instead of `Thread.sleep`; a same-thread executor to make `@Async` synchronous; a fake clock for scheduling.\n\n" +
        "7. **Static and runtime analysis** — SpotBugs' multithreaded-correctness detectors, ErrorProne's `@GuardedBy` enforcement, and `ThreadMXBean.findDeadlockedThreads()` in an `@AfterEach`.\n\n" +
        "**Say this out loud:** 'A green concurrency test means the bug did not reproduce this time. I also rely on review against a checklist and on jcstress for anything memory-model sensitive.'",
      code: `import org.junit.jupiter.api.*;
import org.awaitility.Awaitility;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

import static org.junit.jupiter.api.Assertions.*;

class ConcurrencyTest {

    /** The class under test. */
    static class Counter {
        private final AtomicLong value = new AtomicLong();
        void increment() { value.incrementAndGet(); }
        long get() { return value.get(); }
    }

    /** 1. Stress test with a start gate so threads really collide. */
    @RepeatedTest(20)
    void incrementsAreAtomicUnderContention() throws Exception {
        Counter counter = new Counter();
        int threads = Runtime.getRuntime().availableProcessors() * 4;
        int perThread = 50_000;

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate  = new CountDownLatch(threads);
        List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());

        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                try {
                    startGate.await();                       // all start together
                    for (int i = 0; i < perThread; i++) counter.increment();
                } catch (Throwable e) { failures.add(e); }
                finally { doneGate.countDown(); }
            });
        }
        startGate.countDown();
        assertTrue(doneGate.await(30, TimeUnit.SECONDS), "workers did not finish");
        pool.shutdown();

        assertTrue(failures.isEmpty(), () -> "worker failures: " + failures);
        assertEquals((long) threads * perThread, counter.get());
    }

    /** 2. Deterministic async test: a same-thread executor removes the race. */
    @Test
    void asyncLogicIsTestedSynchronously() {
        Executor sameThread = Runnable::run;                 // no threads at all
        CompletableFuture<String> result =
            CompletableFuture.supplyAsync(() -> "value", sameThread);
        assertEquals("value", result.join());
    }

    /** 3. Awaitility instead of Thread.sleep for eventual state. */
    @Test
    void eventuallyReachesTargetState() {
        AtomicBoolean done = new AtomicBoolean(false);
        CompletableFuture.runAsync(() -> {
            try { Thread.sleep(200); } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); }
            done.set(true);
        });
        Awaitility.await()
            .atMost(Duration.ofSeconds(2))
            .pollInterval(Duration.ofMillis(20))
            .untilTrue(done);
    }

    /** 4. Fail the build if any test left a deadlock behind. */
    @AfterEach
    void assertNoDeadlock() {
        long[] ids = java.lang.management.ManagementFactory
            .getThreadMXBean().findDeadlockedThreads();
        assertNull(ids, "deadlocked threads detected");
    }

    // 5. For memory-model guarantees use jcstress:
    //    @JCStressTest
    //    @Outcome(id = "1, 1", expect = ACCEPTABLE)
    //    @Outcome(id = "0, 0", expect = FORBIDDEN)
    //    @State public static class Volatility { ... }
}`,
      codeLanguage: "java",
      explanation:
        "Start gates, repetition and stress raise collision odds; jcstress and Lincheck are the real tools for memory-model and linearisability bugs.",
      followUps: [
        "Why does a stress test without a start gate often run sequentially?",
        "What does Lincheck verify that a stress test cannot?",
      ],
    },
    {
      id: "b105",
      question: "Explain ScheduledExecutorService and how Spring's @Scheduled works in a clustered deployment.",
      answer:
        "`ScheduledExecutorService` (Java 5) replaced the broken `Timer`:\n\n" +
        "- `schedule(task, delay, unit)` — run once.\n" +
        "- `scheduleAtFixedRate(task, initialDelay, period, unit)` — start every `period`, **regardless of duration**. If a run overruns, the next starts immediately after (they never overlap on the same scheduler, but they bunch up).\n" +
        "- `scheduleWithFixedDelay(...)` — wait `delay` **after each completion**. Safer for variable-duration work.\n\n" +
        "**Why not `Timer`:** a single thread for all tasks, one long task delays everything, and an **uncaught exception kills the timer thread** and silently cancels every task. `ScheduledThreadPoolExecutor` uses a pool — but it has the same silent-death trap: **if a scheduled task throws, that task is cancelled forever and nothing is logged.** Always wrap the body in try/catch.\n\n" +
        "Spring's `@Scheduled` (requires **`@EnableScheduling`**):\n\n" +
        "- `fixedRate`, `fixedDelay`, `initialDelay`, `cron = \"0 0 3 * * *\"`, plus the `String` variants that resolve properties (`fixedRateString = \"${job.rate}\"`), and `zone`.\n" +
        "- **The default `TaskScheduler` has a pool size of 1** — one slow job blocks every other job. Configure `spring.task.scheduling.pool.size` or define a `ThreadPoolTaskScheduler` bean.\n" +
        "- The method must take **no arguments** and normally return void.\n\n" +
        "**The clustering problem** — this is what the interviewer is really after. With N instances, a `@Scheduled` job runs **N times**. Solutions:\n\n" +
        "1. **ShedLock** — `@SchedulerLock` with a shared JDBC/Redis/Mongo lock table. Simple and the usual answer.\n" +
        "2. **Quartz in clustered mode** — persistent job store, misfire handling, dynamic scheduling.\n" +
        "3. **Leader election** — Spring Integration, Kubernetes lease, or ZooKeeper/Consul.\n" +
        "4. **External trigger** — a Kubernetes CronJob or a scheduler service calling an endpoint.\n\n" +
        "Also make jobs **idempotent** and give them a timeout, since 'exactly once' is never truly guaranteed.",
      code: `import net.javacrumbs.shedlock.spring.annotation.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

@Configuration
@EnableScheduling                               // REQUIRED for @Scheduled
@EnableSchedulerLock(defaultLockAtMostFor = "10m")   // ShedLock across the cluster
class SchedulingConfig {

    /** The default scheduler has ONE thread - always override it. */
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(8);
        scheduler.setThreadNamePrefix("sched-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(30);
        scheduler.setErrorHandler(t -> System.err.println("scheduled job failed: " + t));
        return scheduler;
    }
}

@Component
class ReportJobs {

    /** fixedDelay: waits 60s AFTER each run finishes - safe for variable duration. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 10_000)
    public void reconcile() {
        try {
            // ... work ...
        } catch (Exception e) {                 // NEVER let it escape: the task
            System.err.println("reconcile failed: " + e);   // would be cancelled forever
        }
    }

    /** Cron + cluster lock: runs on exactly one instance. */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    @SchedulerLock(name = "nightlyBilling", lockAtLeastFor = "1m", lockAtMostFor = "30m")
    public void nightlyBilling() {
        // idempotent by design: safe even if it somehow runs twice
    }

    /** Externalised rate so it is tunable per environment. */
    @Scheduled(fixedRateString = "\${jobs.cache-refresh-ms:300000}")
    public void refreshCache() { }
}

class RawSchedulerDemo {
    public static void main(String[] args) throws Exception {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(
            2, r -> { Thread t = new Thread(r, "raw-sched"); t.setDaemon(true); return t; });

        // fixedRate: every 100ms from the START of each run.
        ScheduledFuture<?> rate = scheduler.scheduleAtFixedRate(
            wrap(() -> System.out.println("fixedRate tick")), 0, 100, TimeUnit.MILLISECONDS);

        // fixedDelay: 100ms AFTER each run completes.
        scheduler.scheduleWithFixedDelay(
            wrap(() -> System.out.println("fixedDelay tick")), 0, 100, TimeUnit.MILLISECONDS);

        Thread.sleep(500);
        rate.cancel(false);
        scheduler.shutdown();
        scheduler.awaitTermination(2, TimeUnit.SECONDS);
    }

    /** Swallowing exceptions here is what keeps the schedule alive. */
    static Runnable wrap(Runnable task) {
        return () -> {
            try { task.run(); }
            catch (Throwable t) { System.err.println("task threw: " + t); }
        };
    }
}`,
      codeLanguage: "java",
      explanation:
        "fixedRate vs fixedDelay, a one-thread default scheduler, tasks silently cancelled on exception — and ShedLock or Quartz for clusters.",
      followUps: [
        "What happens if a scheduleAtFixedRate task takes longer than its period?",
        "How does ShedLock guarantee single execution across instances?",
      ],
    },
    {
      id: "b106",
      question: "Walk me through diagnosing and fixing thread pool exhaustion in a Spring Boot service.",
      answer:
        "**The symptom:** requests time out, latency climbs, CPU is low. Low CPU with high latency is the signature — threads are **blocked**, not busy.\n\n" +
        "**Step 1 — confirm which pool.** Three separate pools can starve:\n\n" +
        "- The **HTTP pool** (`server.tomcat.threads.max`, default 200). Metric: `tomcat.threads.busy` vs `tomcat.threads.config.max`.\n" +
        "- The **connection pool** (HikariCP, default 10). Metrics: `hikaricp.connections.pending`, `hikaricp.connections.acquire`, and the log line `HikariPool-1 - Connection is not available, request timed out after 30000ms`.\n" +
        "- Application executors (`@Async`, scheduler, HTTP client pools).\n\n" +
        "**Step 2 — take three thread dumps ten seconds apart.** If 200 Tomcat threads all show the same stack — typically `SocketInputStream.read` inside a `RestTemplate` call, or `HikariPool.getConnection` — you have your answer.\n\n" +
        "**Step 3 — find the root cause.** Almost always one of:\n\n" +
        "1. **A downstream call with no timeout.** The JDK default is *infinite*. One slow dependency consumes every thread. **Fix: connect + read timeouts on every client, always.**\n" +
        "2. **Connection-pool leak** — a `Connection`/`EntityManager` not closed. Set `leakDetectionThreshold`.\n" +
        "3. **Long transactions** — `@Transactional` spanning an HTTP call holds a connection for the whole call. Fix: never do IO inside a transaction.\n" +
        "4. **Pool smaller than the concurrency Little's law demands** (`λ × W`).\n" +
        "5. **Nested pool use** — a task in pool A waiting on a task in pool A. Guaranteed deadlock.\n\n" +
        "**Step 4 — fix, in order:** timeouts everywhere → bulkheads (a separate bounded pool per dependency) → circuit breakers with fallbacks → right-size pools using `λ × W` → bounded queues with `CallerRunsPolicy` → consider virtual threads (which remove the *thread* limit but **not** the connection-pool limit).\n\n" +
        "**Step 5 — prevent recurrence:** alert on `hikaricp.connections.pending > 0` and on `tomcat.threads.busy / max > 0.8`; load test to saturation; add a health indicator that fails when pools are exhausted.",
      code: `import com.zaxxer.hikari.HikariDataSource;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.actuate.health.*;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.concurrent.*;

@Configuration
class ResilienceConfig {

    /** FIX 1: a client with NO timeout will exhaust the HTTP pool. Always set both. */
    @Bean
    public RestTemplate paymentClient(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(2))
            .setReadTimeout(Duration.ofSeconds(3))
            .build();
    }

    /** FIX 2: bulkhead - a dedicated bounded pool per dependency. */
    @Bean("paymentExecutor")
    public ThreadPoolExecutor paymentExecutor() {
        return new ThreadPoolExecutor(
            10, 10, 0L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(50),
            r -> new Thread(r, "payment-"),
            new ThreadPoolExecutor.CallerRunsPolicy());   // backpressure, not silent loss
    }
}

@Service
class PaymentService {
    private final RestTemplate client;
    PaymentService(RestTemplate client) { this.client = client; }

    /** Bulkhead + circuit breaker + fallback: one sick dependency cannot sink the app. */
    @Bulkhead(name = "payments", type = Bulkhead.Type.THREADPOOL)
    @CircuitBreaker(name = "payments", fallbackMethod = "fallback")
    public String charge(String orderId) {
        return client.postForObject("/charge/" + orderId, null, String.class);
    }

    @SuppressWarnings("unused")
    private String fallback(String orderId, Throwable t) {
        return "QUEUED";                      // degrade, do not block
    }
}

/** FIX 3: surface exhaustion as a health check instead of discovering it in tickets. */
@Component
class PoolHealthIndicator implements HealthIndicator {
    private final HikariDataSource dataSource;
    PoolHealthIndicator(HikariDataSource dataSource) { this.dataSource = dataSource; }

    @Override public Health health() {
        var pool = dataSource.getHikariPoolMXBean();
        int pending = pool.getThreadsAwaitingConnection();
        int active  = pool.getActiveConnections();
        int total   = pool.getTotalConnections();
        Health.Builder status = pending > 0 ? Health.down() : Health.up();
        return status.withDetail("active", active)
                     .withDetail("total", total)
                     .withDetail("pending", pending)
                     .build();
    }
}

@Component
class PoolMetrics {
    /** Alert on these: pending > 0 and busy/max > 0.8 are the leading indicators. */
    PoolMetrics(MeterRegistry registry, ThreadPoolExecutor paymentExecutor) {
        registry.gauge("payment.pool.queue", paymentExecutor, e -> e.getQueue().size());
        registry.gauge("payment.pool.active", paymentExecutor, ThreadPoolExecutor::getActiveCount);
    }
}

/*
application.yml
---------------
server.tomcat.threads.max: 200
spring.datasource.hikari:
  maximum-pool-size: 30            # Little's law: rps x latency
  connection-timeout: 3000         # fail fast instead of piling up
  leak-detection-threshold: 20000  # find unclosed connections
  validation-timeout: 1000
spring.threads.virtual.enabled: true   # removes the THREAD limit, not the DB limit
management.endpoint.health.show-details: always
*/`,
      codeLanguage: "java",
      explanation:
        "Low CPU plus high latency means blocked threads: dump three times, find the untimed downstream call, then add timeouts, bulkheads and right-sized pools.",
      followUps: [
        "Why do virtual threads not solve connection-pool exhaustion?",
        "What does hikaricp.connections.pending greater than zero tell you?",
      ],
    },
  ],
  meta: {
    b095: { difficulty: "medium", priority: "very-high", tags: ["threadpool", "executor", "rejection"], readMinutes: 6 },
    b096: { difficulty: "medium", priority: "very-high", tags: ["future", "completablefuture", "async"], readMinutes: 5 },
    b097: { difficulty: "hard", priority: "medium", tags: ["forkjoin", "work-stealing", "parallel"], readMinutes: 5 },
    b098: { difficulty: "medium", priority: "very-high", tags: ["virtual-threads", "loom", "java-21"], readMinutes: 5, versions: ["Java 21"] },
    b099: { difficulty: "medium", priority: "high", tags: ["blockingqueue", "producer-consumer", "backpressure"], readMinutes: 5 },
    b100: { difficulty: "hard", priority: "very-high", tags: ["concurrenthashmap", "lock-striping", "cas"], readMinutes: 6 },
    b101: { difficulty: "medium", priority: "very-high", tags: ["spring", "async", "executor"], readMinutes: 5 },
    b102: { difficulty: "hard", priority: "very-high", tags: ["optimistic-locking", "pessimistic-locking", "jpa"], readMinutes: 6 },
    b103: { difficulty: "medium", priority: "medium", tags: ["amdahl", "little-law", "capacity"], readMinutes: 5 },
    b104: { difficulty: "medium", priority: "high", tags: ["testing", "jcstress", "stress-test"], readMinutes: 5 },
    b105: { difficulty: "medium", priority: "high", tags: ["scheduling", "cron", "shedlock"], readMinutes: 5 },
    b106: { difficulty: "hard", priority: "very-high", tags: ["thread-pool-exhaustion", "diagnostics", "resilience"], readMinutes: 6 },
  },
});
