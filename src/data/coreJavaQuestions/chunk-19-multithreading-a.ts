import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Multi Threading - global questions 185-196.
 * Covers thread fundamentals: why threads exist, how to create and run them,
 * the Thread state machine, priorities and daemons, and the ExecutorService,
 * Future and Callable APIs.
 */
export const chunk19MultithreadingA = defineChunk({
  topic: "multithreading",
  questions: [
    {
      id: "q185",
      question: "What is the need for threads in Java?",
      answer:
        "Java threads exist so the program can do more than one thing at a time. Modern CPUs ship with multiple cores, and almost every real application mixes CPU-bound work with IO-bound waits for disks, networks and user input. Without threads, a single synchronous read freezes the entire program on the calling stack.\n\n" +
        "**Three concrete benefits:**\n\n" +
        "- **Throughput**: CPU work and IO waits can be overlapped, so one thread keeps a socket busy while another is computing. On a multicore box two truly independent tasks actually run in parallel rather than merely interleaved.\n" +
        "- **Responsiveness**: a GUI thread keeps painting and dispatching events while a worker thread crunches data. A web request handler returns control to the pool immediately while an async task processes the payload.\n" +
        "- **Service and pool model**: instead of spawning a raw OS thread per task (expensive and dangerous), Java submits tasks to a fixed pool. The pool schedules many tasks on a small number of OS threads, which fits the multicore reality and gives bounded resource use.\n\n" +
        "**Modern default:** since Java 8 the common `ForkJoinPool` is the default target for parallel streams and for `CompletableFuture` supply chains, so most developers already use thread pools without ever writing `new Thread(...)` themselves.",
      code: `public class WhyThreads {
    public static void main(String[] args) throws Exception {
        // Single-threaded baseline: CPU work, then IO wait, sequentially
        long t0 = System.nanoTime();
        doCpuWork();
        doIoWork(80);                                // simulated network call
        long single = System.nanoTime() - t0;

        // Same work split across two threads, overlapped
        long t1 = System.nanoTime();
        Thread cpu = new Thread(WhyThreads::doCpuWork);
        Thread io  = new Thread(() -> doIoWork(80));
        cpu.start(); io.start();                     // two real OS threads
        cpu.join();  io.join();
        long parallel = System.nanoTime() - t1;

        System.out.println("single   ms: " + single   / 1_000_000);
        System.out.println("parallel ms: " + parallel / 1_000_000);
    }
    static void doCpuWork() {
        long s = 0;
        for (int i = 0; i < 50_000_000; i++) s += i;
        System.out.println("cpu sum = " + s);
    }
    static void doIoWork(long ms) throws InterruptedException {
        Thread.sleep(ms);
        System.out.println("io waited " + ms + " ms");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Throughput, responsiveness and a bounded pool model — modern Java runs on thread pools by default, not on raw Thread objects.",
    },
    {
      id: "q186",
      question: "How do you create a thread?",
      answer:
        "Java gives you exactly two fundamental ways to create a thread, plus a third concise shorthand. The choice matters because Java does not support multiple class inheritance, so extending `Thread` burns your only inheritance slot on a class that mostly carries behaviour, not state.\n\n" +
        "**The two fundamentals:**\n\n" +
        "- **Subclass `Thread` and override `run`**: the subclass becomes both the task and the thread. Quick for tiny demos but couples your work to the threading machinery.\n" +
        "- **Implement `Runnable`**: hand the instance to a `Thread` constructor. The runnable holds the work, the thread holds the scheduling. The same `Runnable` instance can be passed to many threads, so the work is naturally reusable.\n\n" +
        "**The concise shorthand:** a lambda is just a compact `Runnable`. `new Thread(() -> doWork()).start()` is identical in effect to writing an anonymous class implementing `Runnable`. Because most Java code today hands tasks to an `ExecutorService` instead of creating threads directly, lambdas are how you actually write concurrent code in modern projects.\n\n" +
        "**What never works:** calling `Thread.run()` directly and expecting a new thread, extending `Runnable` (it is an interface), or assuming the task object itself is a thread. Always reach for `Runnable` first; reserve subclassing `Thread` for the rare cases where you genuinely need to override thread-level behaviour such as `UncaughtExceptionHandler`.",
      code: `public class CreateThread {
    public static void main(String[] args) throws Exception {
        // (1) extend Thread
        class GreetingThread extends Thread {
            GreetingThread(String name) { super(name); }
            @Override public void run() {
                System.out.println("hello from " + getName());
            }
        }
        Thread t1 = new GreetingThread("extender");

        // (2) implement Runnable (the preferred way)
        Runnable task = () ->
            System.out.println("hello from runnable on " + Thread.currentThread().getName());
        Thread t2 = new Thread(task, "runnable-task");

        // Same Runnable instance reused by many threads
        Thread t3 = new Thread(task, "runnable-task-2");

        t1.start(); t2.start(); t3.start();
        t1.join();  t2.join();  t3.join();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Java has two fundamentals: extend Thread or implement Runnable; lambdas are just a compact Runnable form.",
    },
    {
      id: "q187",
      question: "How do you create a thread by extending thread class?",
      answer:
        "Extending `Thread` is the most direct way to start a new thread and the one you usually see in textbooks. You subclass `java.lang.Thread`, override the `run()` method with the work you want performed, instantiate your subclass, and call `start()`.\n\n" +
        "**The lifecycle in code:**\n\n" +
        "- **Define a subclass** that overrides `run` with the actual work. The inherited constructors `Thread()` and `Thread(String name)` let you name the thread so stack traces are readable.\n" +
        "- **Instantiate it and call `start()`**, not `run()`. `start` registers the new thread with the OS scheduler.\n" +
        "- The scheduler runs your `run()` on a fresh call stack as soon as a core is available. Meanwhile, the calling thread returns from `start()` immediately and keeps running.\n\n" +
        "**Why most teams avoid it:** every domain class that needs to run concurrently is forced to give up its inheritance slot. You cannot extend any other base class, you cannot pass the work object cleanly to an `ExecutorService`, and you cannot share one task across many threads. `Thread` is designed as the worker that runs things, not as the work to be run. That separation is exactly what `Runnable` formalises, which is why implementing the interface is the recommended approach in modern Java.",
      code: `public class ExtendingThread {
    public static void main(String[] args) throws Exception {
        Downloader d1 = new Downloader("report.pdf");
        Downloader d2 = new Downloader("image.png");

        d1.start();              // schedules a fresh OS thread that calls d1.run()
        d2.start();              // independent OS thread runs d2.run() in parallel

        d1.join();               // wait for d1 to finish
        d2.join();               // wait for d2 to finish
        System.out.println("all downloads complete");
    }
}

class Downloader extends Thread {
    Downloader(String file) {
        super("downloader-" + file);
        this.file = file;
    }
    private final String file;

    @Override public void run() {
        System.out.println(getName() + " starting " + file);
        try { Thread.sleep(120); } catch (InterruptedException ignored) {}
        System.out.println(getName() + " finished  " + file);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Subclass Thread, override run, instantiate and call start — coupling work to Thread is the main downside.",
    },
    {
      id: "q188",
      question: "How do you create a thread by implementing runnable interface?",
      answer:
        "Implementing `Runnable` is the idiomatic way to define a unit of work that should run on a thread. You write a class — or, since Java 8, a lambda — whose single method `run()` contains the work, then hand that instance to a `Thread` or to an `ExecutorService`.\n\n" +
        "**The contract in plain terms:**\n\n" +
        "- **Decouples work from worker**: the runnable is just a task (`void run()`). The `Thread` (or the pool worker) is the thing that actually schedules it. This is the Single Responsibility Principle applied to concurrency.\n" +
        "- **Reusable**: the same `Runnable` instance can be submitted to many threads, which is impossible if the work lives inside a `Thread` subclass.\n" +
        "- **Composable with executors**: `ExecutorService.execute(runnable)` and `submit(runnable)` both accept `Runnable`, so your tasks slot into thread pools, `ScheduledExecutorService`, and `ForkJoinPool` without change.\n\n" +
        "**Why it is preferred:** Java has single class inheritance, so if you make your domain class extend `Thread` you can never extend anything else. Implementing `Runnable` keeps your domain hierarchy free and lets the same task be reused by a unit test, a scheduled timer, a parallel stream, or a `CompletableFuture` chain. Lambdas make this so compact that raw thread creation is essentially a teaching exercise today.",
      code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ImplementingRunnable {
    public static void main(String[] args) throws Exception {
        // A task is a Runnable, NOT a Thread
        Runnable job = () -> {
            String name = Thread.currentThread().getName();
            System.out.println(name + " is running the shared job");
            try { Thread.sleep(100); } catch (InterruptedException ignored) {}
        };

        // Submit the SAME Runnable to many workers — reuse, not duplication
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int i = 0; i < 5; i++) pool.execute(job);

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
        System.out.println("done");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Implementing Runnable decouples the task from the worker and lets the same task run on many threads.",
    },
    {
      id: "q189",
      question: "How do you run a thread in Java?",
      answer:
        "Running a thread in Java is a two-step recipe: obtain a `Thread` (or a thread obtained from an executor), then call `start()`. The distinction between `start()` and `run()` is the single most common interview trap on this topic and the one interviewers use to test whether you actually understand the JVM threading model.\n\n" +
        "**Step by step:**\n\n" +
        "- **Construct** a `Thread` directly (`new MyThread()` after extending, or `new Thread(runnable)`) or obtain one from an `ExecutorService` factory.\n" +
        "- **Call `start()`**: this registers a fresh OS-level thread with the scheduler. The new thread's first action is to execute your `run()` method on its own stack. The calling thread returns from `start()` immediately and keeps running.\n" +
        "- **Do not call `run()` directly** unless you want the work to execute synchronously on the current stack, with no new thread involved. Calling `run()` is just an ordinary method call and is a classic beginner bug.\n\n" +
        "**Practical pattern:** in production code you almost never instantiate `Thread` by hand. You submit a `Runnable` or `Callable` to an `ExecutorService`, which owns a pool of `Thread` instances and calls their `start` for you. The outcome is identical — a fresh OS thread runs your `run()` — but the lifecycle, naming, and pool sizing are managed centrally. Always follow `start` with a `join` if you need to wait, or use `Future.get()` on the executor.",
      code: `public class RunningAThread {
    public static void main(String[] args) throws Exception {
        Runnable work = () -> {
            System.out.println("worker started on " + Thread.currentThread().getName());
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
            System.out.println("worker finished");
        };

        Thread worker = new Thread(work, "my-worker");
        System.out.println("before start : " + worker.getState());  // NEW

        worker.start();                                            // schedules OS thread
        System.out.println("just started : " + worker.getState());  // RUNNABLE

        worker.join();                                             // wait for completion
        System.out.println("after join   : " + worker.getState());  // TERMINATED

        // worker.start();                                         // throws IllegalThreadStateException
    }
}`,
      codeLanguage: "java",
      explanation:
        "Call start() to schedule a fresh OS thread; calling run() directly executes synchronously on the caller.",
    },
    {
      id: "q190",
      question: "What are the different states of a thread?",
      answer:
        "The `java.lang.Thread.State` enum lists the six states the JVM tracks for every thread. The current state is observable through `Thread.getState()` and is updated by the runtime as the thread moves between scheduler queues, monitor locks, and timing primitives. Drawing a small state diagram on the whiteboard is a perfectly acceptable interview answer.\n\n" +
        "**The six states and what each means:**\n\n" +
        "- **NEW**: the `Thread` object exists but `start` has not been called yet. No OS thread, no call stack allocated.\n" +
        "- **RUNNABLE**: the thread is either currently executing on a CPU core or is sitting in the OS ready queue waiting for one. Most working code spends most of its time here.\n" +
        "- **BLOCKED**: the thread tried to enter a `synchronized` block whose monitor is held by another thread, and is waiting for the lock. Distinct from waiting on `wait` or `park`.\n" +
        "- **WAITING**: the thread is parked indefinitely on `Object.wait()`, `Thread.join()` without timeout, or `LockSupport.park()`. It wakes only when notified, joined, or unparked.\n" +
        "- **TIMED_WAITING**: same family of waits but with a deadline — `Thread.sleep`, `wait(ms)`, `join(ms)`, `LockSupport.parkNanos`, `Condition.await(ms)`.\n" +
        "- **TERMINATED**: `run` returned or threw an uncaught exception. The `Thread` object is still around but cannot be restarted; calling `start` again throws `IllegalThreadStateException`.",
      code: `public class ThreadStates {
    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            try { Thread.sleep(300); }
            catch (InterruptedException ignored) {}
        }, "demo");

        System.out.println("before start : " + t.getState());  // NEW

        t.start();
        System.out.println("just started : " + t.getState());  // RUNNABLE

        Thread.sleep(80);
        System.out.println("in sleep      : " + t.getState()); // TIMED_WAITING

        t.join();
        System.out.println("after join    : " + t.getState()); // TERMINATED
    }
}`,
      codeLanguage: "java",
      explanation:
        "Six states in Thread.State — NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED; observe via getState().",
    },
    {
      id: "q191",
      question: "What is priority of a thread? How do you change the priority of a thread?",
      answer:
        "Every Java thread has an integer priority between `Thread.MIN_PRIORITY` (1) and `Thread.MAX_PRIORITY` (10), with `Thread.NORM_PRIORITY` (5) as the default for newly created threads. You read it with `getPriority()` and change it with `setPriority(int newPriority)`, passing an `IllegalArgumentException` if you go outside the 1..10 range.\n\n" +
        "**How priorities actually work:**\n\n" +
        "- **Hints, not commands**: the JVM passes the priority to the underlying OS scheduler as a suggestion. On Linux it maps roughly to `nice`, on Windows it influences scheduling class. Do not use priorities to enforce correctness or to compensate for missing locks.\n" +
        "- **Same-priority threads**: the JVM does not guarantee round-robin or time-slicing between threads of equal priority. A long-running CPU loop without yields can starve others even at the same priority; use real blocking or explicit `Thread.yield` if you need fairness.\n" +
        "- **Common uses**: bump a UI repaint thread above the default, or drop a background batch job below it. Anything finer-grained is almost certainly a sign the design is wrong.\n\n" +
        "**Daemon threads:** the concept most interviewers pair with this question. Set `t.setDaemon(true)` **before** `start()`, and the JVM will not wait for that thread to finish when the last non-daemon thread exits. Daemon threads are perfect for background services like a heartbeat logger or an idle connection reaper — but their work can be cut off mid-flight, so they must not own resources that need deterministic cleanup.",
      code: `public class PriorityAndDaemon {
    public static void main(String[] args) throws Exception {
        // Priorities: 1 (MIN) .. 5 (NORM, default) .. 10 (MAX)
        Thread low  = new Thread(() -> System.out.println("low running"),  "low");
        Thread high = new Thread(() -> System.out.println("high running"), "high");
        low.setPriority(Thread.MIN_PRIORITY);     // 1
        high.setPriority(Thread.MAX_PRIORITY);    // 10

        // Daemon threads do NOT block JVM exit
        Thread heartbeat = new Thread(() -> {
            try { Thread.sleep(60_000); }          // still alive when main returns
            catch (InterruptedException ignored) {}
        }, "heartbeat");
        heartbeat.setDaemon(true);

        low.start();  high.start();  heartbeat.start();
        low.join();   high.join();

        System.out.println("low priority  : " + low.getPriority());    // 1
        System.out.println("high priority : " + high.getPriority());   // 10
        System.out.println("daemon flag   : " + heartbeat.isDaemon()); // true
        // main ends -> JVM exits even though heartbeat is still sleeping
    }
}`,
      codeLanguage: "java",
      explanation:
        "Priorities are scheduler hints, not guarantees; daemons do not prevent JVM exit but get cut off mid-flight.",
    },
    {
      id: "q192",
      question: "What is executorservice?",
      answer:
        "An `ExecutorService` is the standard Java abstraction for a pool of worker threads that accepts tasks and runs them asynchronously. Instead of every developer reinventing `Thread` lifecycle, queueing, and shutdown, `java.util.concurrent.Executors` ships ready-made implementations and `ExecutorService` is the interface they all implement.\n\n" +
        "**Why it exists:**\n\n" +
        "- **Decouples task from thread**: callers submit a `Runnable` or `Callable`; the service decides which worker runs it and when. Application code never touches `Thread.start` directly.\n" +
        "- **Pools are cheap and bounded**: a fixed pool of N threads reuses OS threads across many tasks, which is dramatically cheaper than spawning a fresh OS thread per task and gives a hard cap on resource use.\n" +
        "- **Built-in lifecycle**: a proper service can be shut down gracefully, allowing queued tasks to finish before the JVM exits.\n\n" +
        "**Key methods:** `execute(Runnable)` for fire-and-forget, `submit(...)` returning a `Future` for results or cancellation, `invokeAll(Collection)` for batch execution, `invokeAny(...)` for first-success, `shutdown()` to stop accepting new tasks and drain the queue, and `shutdownNow()` to interrupt running workers. Always close an executor in production: leaving it running leaks threads and prevents the JVM from exiting.\n\n" +
        "**Modern default:** since Java 8 the common `ForkJoinPool` backs parallel streams and `CompletableFuture` chains, so you usually get a sensible thread pool without writing any executor code yourself.",
      code: `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ExecutorServiceDemo {
    public static void main(String[] args) throws Exception {
        // Fixed pool of 3 worker threads, shared unbounded queue
        ExecutorService pool = Executors.newFixedThreadPool(3);

        for (int i = 1; i <= 8; i++) {
            final int id = i;
            pool.execute(() -> {
                String name = Thread.currentThread().getName();
                System.out.println("task " + id + " on " + name);
                try { Thread.sleep(100); }
                catch (InterruptedException ignored) {}
            });
        }

        pool.shutdown();                                 // graceful: drain the queue
        boolean drained = pool.awaitTermination(2, TimeUnit.SECONDS);
        System.out.println("drained cleanly: " + drained);
    }
}`,
      codeLanguage: "java",
      explanation:
        "ExecutorService is the standard thread-pool abstraction; submit tasks, retrieve Futures, always shut down.",
    },
    {
      id: "q193",
      question: "Can you give an example for executorservice?",
      answer:
        "The simplest realistic example submits a handful of `Runnable` tasks to a fixed-size pool, waits for them to finish, and prints the results in completion order. The factory method `Executors.newFixedThreadPool(n)` returns an `ExecutorService` that owns N worker threads and an unbounded queue for any overflow.\n\n" +
        "**Pattern:** build the service with a factory, submit work, retrieve futures, and shut down gracefully. The factory takes care of `Thread` construction, naming, and reuse — the caller only writes the task body. `Future.get()` serves two roles: retrieving the value, and acting as a barrier that blocks until completion.\n\n" +
        "**Two non-obvious details:**\n\n" +
        "- `pool.shutdown()` only refuses **new** tasks; it does not interrupt the ones already running or waiting in the queue. Pair it with `awaitTermination` so the main thread waits for the queue to drain.\n" +
        "- The `Future` returned by `submit` is the only safe way to learn whether a specific task finished, what it returned, or whether it failed. Call `future.get()` (or the timeout overload) to wait; it re-throws the original exception wrapped in `ExecutionException` if the task threw.\n\n" +
        "Run the example and you will see all six tasks complete, with at most four of them overlapping because the pool has four workers. That overlap is exactly the throughput gain the executor was created for.",
      code: `import java.util.concurrent.*;
import java.util.*;

public class ExecutorExample {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<String>> futures = new ArrayList<>();

        for (int i = 1; i <= 6; i++) {
            final int taskId = i;
            futures.add(pool.submit(() -> {
                Thread.sleep(50L * taskId);                 // pretend to do work
                return "task " + taskId + " on " + Thread.currentThread().getName();
            }));
        }

        for (Future<String> f : futures) {
            System.out.println(f.get());                     // blocks until that task completes
        }

        pool.shutdown();                                    // no new tasks accepted
        pool.awaitTermination(1, TimeUnit.MINUTES);         // wait for the queue to drain
        System.out.println("pool terminated");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Build a pool, submit tasks, iterate over Futures, then shutdown and awaitTermination for a clean exit.",
    },
    {
      id: "q194",
      question: "Explain different ways of creating executor services.",
      answer:
        "`java.util.concurrent.Executors` is a factory class with one static method per common pool configuration. Choose by answering two questions: how many threads do you want, and when do tasks need to run? The answer points straight at the right factory.\n\n" +
        "**The factory methods:**\n\n" +
        "- **`newFixedThreadPool(n)`**: exactly N threads, an unbounded `LinkedBlockingQueue`. Tasks beyond N wait in the queue. Use when the workload is steady and you want a hard concurrency cap.\n" +
        "- **`newCachedThreadPool()`**: threads are created on demand and reused after 60 seconds of idleness. Scales up for bursts, scales down when idle. There is no upper bound, so it is a poor choice for long-running CPU tasks.\n" +
        "- **`newSingleThreadExecutor()`**: a one-thread pool that guarantees tasks run sequentially in submission order, with an unbounded queue. A drop-in replacement for hand-rolled `synchronized` task queues.\n" +
        "- **`newScheduledThreadPool(n)`**: a fixed pool that supports delayed and periodic execution via `schedule`, `scheduleAtFixedRate`, and `scheduleWithFixedDelay`.\n" +
        "- **`newWorkStealingPool()` (Java 8+)**: backed by a `ForkJoinPool` whose size defaults to `Runtime.getRuntime().availableProcessors()`. Each thread owns a deque and steals from siblings when idle. This is the default target for parallel streams.\n\n" +
        "**Always pair construction with shutdown:** call `shutdown()` (allow queued tasks to finish) or `shutdownNow()` (interrupt running tasks), then `awaitTermination` for a graceful exit. Skipping shutdown leaks worker threads and can prevent the JVM from terminating — a classic reason applications hang on `System.exit`.",
      code: `import java.util.concurrent.*;

public class ExecutorFactories {
    public static void main(String[] args) throws Exception {
        // (1) Fixed pool: exactly N threads, unbounded wait queue
        ExecutorService fixed = Executors.newFixedThreadPool(2);

        // (2) Cached pool: grows on demand, reaps idle threads after 60s
        ExecutorService cached = Executors.newCachedThreadPool();

        // (3) Single thread: serial execution in submission order
        ExecutorService single = Executors.newSingleThreadExecutor();

        // (4) Scheduled: delayed and periodic tasks
        ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(1);

        // (5) Work-stealing: ForkJoinPool, default for parallel streams (Java 8+)
        ExecutorService stealing = Executors.newWorkStealingPool();

        scheduled.schedule(
            () -> System.out.println("delayed ping"), 100, TimeUnit.MILLISECONDS);

        for (ExecutorService p : new ExecutorService[]{fixed, cached, single, stealing}) {
            p.shutdown();
            p.awaitTermination(1, TimeUnit.SECONDS);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Pick a factory by workload — fixed, cached, single, scheduled, or work-stealing — then always shutdown and awaitTermination.",
    },
    {
      id: "q195",
      question: "How do you check whether an executionservice task executed successfully?",
      answer:
        "When you submit a task to an `ExecutorService`, the return value is a `Future` that represents the eventual outcome. The `Future` API is how you ask whether the task ran, what it returned, and whether you can still cancel it. There is no boolean single-call answer; you have to combine the right methods.\n\n" +
        "**Checking success step by step:**\n\n" +
        "- **`isDone()`**: returns `true` once the task finished normally, was cancelled, or failed with an exception. It does **not** tell you which of those three happened, so it is only a coarse liveness check.\n" +
        "- **`get()`**: blocks until the task completes. If the task returned a value, `get` returns it. If the task threw, `get` re-throws the original exception wrapped in an `ExecutionException`; unwrapping it with `getCause()` is how you discover what actually went wrong.\n" +
        "- **`get(long timeout, TimeUnit unit)`**: same as `get()` but throws `TimeoutException` if the deadline passes first. Always prefer this in production code; an unbounded `get()` can hang a request thread forever.\n" +
        "- **`isCancelled()` and `cancel(boolean mayInterrupt)`**: let you stop a task before it completes. `cancel(true)` interrupts the worker thread; `cancel(false)` only flips a flag that cooperative tasks must check themselves.\n\n" +
        "**Batch helpers:** `invokeAll(Collection)` returns a list of futures and waits for all of them. `invokeAny(Collection)` returns the result of the first task that completes successfully and cancels the rest. Both surface the same `ExecutionException` wrapping on failure.",
      code: `import java.util.concurrent.*;

public class CheckingTaskSuccess {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);

        Future<Integer> ok   = pool.submit(() -> 21 * 2);                   // success
        Future<Integer> bad = pool.submit(() -> {
            throw new IllegalStateException("boom");
        });

        for (Future<Integer> f : new Future[]{ok, bad}) {
            System.out.print("isDone=" + f.isDone());
            try {
                Integer value = f.get(500, TimeUnit.MILLISECONDS);           // bounded wait
                System.out.println(" value=" + value);
            } catch (TimeoutException te) {
                System.out.println(" timed out");
            } catch (ExecutionException ee) {                                // wraps the cause
                System.out.println(" failed: "
                    + ee.getCause().getClass().getSimpleName()
                    + ": " + ee.getCause().getMessage());
            }
        }

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use Future.isDone, get with a timeout, and unwrap ExecutionException.getCause() to know what actually failed.",
    },
    {
      id: "q196",
      question: "What is callable? How do you execute a callable from executionservice?",
      answer:
        "`java.util.concurrent.Callable<V>` is the value-returning cousin of `Runnable`. Where `Runnable.run()` returns `void` and cannot throw checked exceptions, `Callable.call()` returns a value of type `V` and is allowed to throw checked exceptions. That is the entire reason both interfaces coexist: pick `Runnable` for fire-and-forget, pick `Callable` when you need a result.\n\n" +
        "**The contract in plain terms:**\n\n" +
        "- **Single method**: `V call() throws Exception`. The generic type tells the executor what the returned `Future` will hold. You can declare narrower checked exceptions in your lambda or method signature.\n" +
        "- **Submitted via `submit`**: `executorService.submit(callable)` returns a `Future<V>`. The future completes when `call` returns, throws, or is cancelled. `Future.get()` then returns the value or unwraps the exception for you.\n" +
        "- **Composable**: the same callable instance can be reused, scheduled, or passed to `invokeAll`. With `Runnable` you would have to capture the result in an external `AtomicReference` and tolerate no checked exceptions.\n\n" +
        "**Typical usage:** a callable that performs a database query and returns a row, hits an HTTP endpoint and parses JSON, or runs a long computation and returns the answer. Pair it with `Future.get(deadline, unit)` so a slow worker cannot hang the caller, and always shut down the executor when the work is done.\n\n" +
        "**One-line differentiator:** prefer `Runnable` for fire-and-forget, prefer `Callable` whenever you need a result or a checked exception path.",
      code: `import java.util.concurrent.*;
import java.util.List;

public class CallableDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);

        // Callable<V> returns a value and may throw checked exceptions
        Callable<Double> fx = () -> Math.sqrt(144);                       // returns 12.0
        Callable<String> slow = () -> {
            Thread.sleep(300);                                              // checked InterruptedException
            return "woke up at " + System.currentTimeMillis();
        };

        Future<Double> f1 = pool.submit(fx);
        Future<String> f2 = pool.submit(slow);

        System.out.println("sqrt(144)    = " + f1.get());                  // 12.0
        System.out.println("slow message = " + f2.get(1, TimeUnit.SECONDS));

        // invokeAny returns the first successful result and cancels the rest
        Double fastest = pool.invokeAny(List.of(fx));
        System.out.println("invokeAny    = " + fastest);

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Callable<V> returns a value and may throw checked exceptions; submit it to get a Future<V> back.",
    },
  ],
  meta: {
    q185: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["threads", "concurrency", "performance"],
      relatedQuestionIds: ["q186", "q189"],
      estimatedReadMinutes: 3,
    },
    q186: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["threads", "creation", "runnable"],
      relatedQuestionIds: ["q187", "q188", "q189"],
      estimatedReadMinutes: 3,
    },
    q187: {
      difficulty: "easy",
      priority: "high",
      tags: ["threads", "inheritance", "thread-class"],
      relatedQuestionIds: ["q186", "q188"],
      estimatedReadMinutes: 3,
    },
    q188: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["threads", "runnable", "lambda"],
      relatedQuestionIds: ["q186", "q187", "q192"],
      estimatedReadMinutes: 3,
    },
    q189: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["threads", "start", "lifecycle"],
      relatedQuestionIds: ["q185", "q190"],
      estimatedReadMinutes: 3,
    },
    q190: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["threads", "states", "lifecycle"],
      relatedQuestionIds: ["q189", "q191"],
      estimatedReadMinutes: 3,
    },
    q191: {
      difficulty: "medium",
      priority: "high",
      tags: ["threads", "priority", "daemon"],
      relatedQuestionIds: ["q190", "q192"],
      estimatedReadMinutes: 3,
    },
    q192: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["executor", "thread-pool", "concurrency"],
      relatedQuestionIds: ["q193", "q194", "q195"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+"],
    },
    q193: {
      difficulty: "easy",
      priority: "high",
      tags: ["executor", "pool", "future"],
      relatedQuestionIds: ["q192", "q194", "q195"],
      estimatedReadMinutes: 3,
    },
    q194: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["executor", "factory", "forkjoinpool"],
      relatedQuestionIds: ["q192", "q195"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+", "Java 8+"],
    },
    q195: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["future", "executor", "concurrency"],
      relatedQuestionIds: ["q192", "q196"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+"],
    },
    q196: {
      difficulty: "medium",
      priority: "high",
      tags: ["callable", "future", "executor"],
      relatedQuestionIds: ["q192", "q195"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
  },
});