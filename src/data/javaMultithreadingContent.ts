import { ContentSection } from "./recursionContent";

export const javaMultithreadingContent: ContentSection[] = [
  {
    id: "mt-intro",
    title: "Threads & Runnable",
    difficulty: "Easy",
    theory: [
      "A **thread** is the smallest unit of execution within a process",
      "Java supports multithreading natively — every Java program has at least one thread: the **main thread**",
      "**Two ways to create threads:** extend `Thread` class or implement `Runnable` interface",
      "**Runnable is preferred** — it separates the task from the thread mechanism and allows extending other classes",
      "**start()** creates a new OS thread and calls run(). Never call **run()** directly — it won't create a new thread",
      "**Thread.sleep(ms)** pauses the current thread. **Thread.currentThread()** returns the current thread",
      "Threads share the same memory space within a process — this enables communication but causes concurrency issues"
    ],
    code: [
      {
        title: "Creating Threads — Two Approaches",
        language: "java",
        content: `public class ThreadDemo {
    // Approach 1: Extend Thread
    static class MyThread extends Thread {
        @Override
        public void run() {
            for (int i = 0; i < 3; i++) {
                System.out.println(getName() + ": " + i);
                try { Thread.sleep(100); } catch (InterruptedException e) {}
            }
        }
    }
    
    // Approach 2: Implement Runnable (preferred)
    static class MyRunnable implements Runnable {
        @Override
        public void run() {
            for (int i = 0; i < 3; i++) {
                System.out.println(Thread.currentThread().getName() + ": " + i);
                try { Thread.sleep(100); } catch (InterruptedException e) {}
            }
        }
    }
    
    public static void main(String[] args) throws InterruptedException {
        // Using Thread subclass
        MyThread t1 = new MyThread();
        t1.setName("Thread-A");
        t1.start(); // creates new thread
        
        // Using Runnable
        Thread t2 = new Thread(new MyRunnable(), "Thread-B");
        t2.start();
        
        // Using lambda (simplest)
        Thread t3 = new Thread(() -> {
            System.out.println("Lambda thread running!");
        }, "Thread-C");
        t3.start();
        
        // Wait for threads to finish
        t1.join();
        t2.join();
        t3.join();
        System.out.println("All threads done!");
    }
}`
      }
    ],
    warning: "Calling `thread.run()` executes the code in the **current** thread — always use `thread.start()` to actually create a new thread."
  },
  {
    id: "mt-lifecycle",
    title: "Thread Lifecycle",
    difficulty: "Medium",
    theory: [
      "A thread goes through **6 states** defined in `Thread.State` enum:",
      "**NEW** — created but not yet started (`new Thread()`)",
      "**RUNNABLE** — running or ready to run after `start()` is called",
      "**BLOCKED** — waiting to acquire a monitor lock (trying to enter a synchronized block)",
      "**WAITING** — waiting indefinitely for another thread (`wait()`, `join()`, `LockSupport.park()`)",
      "**TIMED_WAITING** — waiting with a timeout (`sleep(ms)`, `wait(ms)`, `join(ms)`)",
      "**TERMINATED** — run() has completed or an uncaught exception occurred",
      "**Thread priority** (1-10, default 5) is a hint to the scheduler — not guaranteed",
      "**Daemon threads** run in background and don't prevent JVM shutdown. Set with `setDaemon(true)` before start()"
    ],
    diagram: {
      type: "flow",
      title: "Thread Lifecycle — State Transitions",
      direction: "horizontal",
      data: [
        { label: "NEW", color: "muted" },
        { label: "RUNNABLE", color: "success" },
        { label: "RUNNING", color: "primary" },
        { label: "BLOCKED / WAITING", color: "warning", children: [{ label: "TIMED_WAITING" }] },
        { label: "TERMINATED", color: "accent" }
      ]
    },
    code: [
      {
        title: "Thread Lifecycle & States",
        language: "java",
        content: `public class ThreadLifecycle {
    public static void main(String[] args) throws Exception {
        Object lock = new Object();
        
        Thread t = new Thread(() -> {
            synchronized (lock) {
                try {
                    lock.wait(); // WAITING
                } catch (InterruptedException e) {}
            }
        });
        
        System.out.println("After new: " + t.getState()); // NEW
        t.start();
        Thread.sleep(100);
        System.out.println("After wait: " + t.getState()); // WAITING
        
        synchronized (lock) { lock.notify(); } // wake it up
        t.join();
        System.out.println("After join: " + t.getState()); // TERMINATED
        
        // Daemon thread
        Thread daemon = new Thread(() -> {
            while (true) {
                try { Thread.sleep(500); } catch (InterruptedException e) { break; }
                System.out.println("Daemon running...");
            }
        });
        daemon.setDaemon(true); // must set before start
        daemon.start();
        
        // Thread priority
        Thread high = new Thread(() -> {}, "HighPriority");
        high.setPriority(Thread.MAX_PRIORITY); // 10
        
        Thread low = new Thread(() -> {}, "LowPriority");
        low.setPriority(Thread.MIN_PRIORITY); // 1
        
        System.out.println("Main done — daemon will stop with JVM");
    }
}`
      }
    ],
    note: "Daemon threads are useful for background tasks like garbage collection, logging, or monitoring. They stop when all non-daemon threads finish."
  },
  {
    id: "mt-sync",
    title: "Synchronization & Locks",
    difficulty: "Hard",
    theory: [
      "**Race condition** — when two threads access shared data simultaneously, leading to unpredictable results",
      "**synchronized** keyword ensures only one thread can execute a block/method at a time",
      "**synchronized method** — locks on `this` (instance) or `ClassName.class` (static)",
      "**synchronized block** — locks on a specific object. Finer control, better performance",
      "Every object in Java has an intrinsic **monitor lock** (mutex)",
      "**ReentrantLock** — explicit lock with more features: tryLock, timed lock, fairness, interruptible",
      "**ReadWriteLock** — allows multiple concurrent readers OR one exclusive writer",
      "**Deadlock** — two threads each waiting for a lock the other holds. Avoid by consistent lock ordering"
    ],
    code: [
      {
        title: "synchronized — Method & Block",
        language: "java",
        content: `public class SyncDemo {
    private int count = 0;
    
    // Synchronized method — locks on 'this'
    public synchronized void incrementSync() {
        count++;
    }
    
    // Synchronized block — finer control
    private final Object lock = new Object();
    
    public void incrementBlock() {
        synchronized (lock) {
            count++;
        }
    }
    
    public int getCount() { return count; }
    
    public static void main(String[] args) throws Exception {
        SyncDemo demo = new SyncDemo();
        
        // Without sync — race condition!
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) demo.incrementSync();
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) demo.incrementSync();
        });
        
        t1.start(); t2.start();
        t1.join(); t2.join();
        
        System.out.println("Count: " + demo.getCount()); // 200000 (correct with sync)
    }
}`
      },
      {
        title: "ReentrantLock — Explicit Locking",
        language: "java",
        content: `import java.util.concurrent.locks.*;

public class LockDemo {
    private int balance = 1000;
    private final ReentrantLock lock = new ReentrantLock();
    
    public void withdraw(int amount) {
        lock.lock(); // acquire lock
        try {
            if (balance >= amount) {
                Thread.sleep(1); // simulate processing
                balance -= amount;
                System.out.println(Thread.currentThread().getName() 
                    + " withdrew " + amount + ", balance: " + balance);
            } else {
                System.out.println("Insufficient funds!");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock(); // ALWAYS unlock in finally
        }
    }
    
    // tryLock — non-blocking attempt
    public boolean tryWithdraw(int amount) {
        if (lock.tryLock()) {
            try {
                if (balance >= amount) {
                    balance -= amount;
                    return true;
                }
            } finally {
                lock.unlock();
            }
        }
        return false; // couldn't acquire lock
    }
    
    public static void main(String[] args) throws Exception {
        LockDemo bank = new LockDemo();
        Thread t1 = new Thread(() -> bank.withdraw(700), "Alice");
        Thread t2 = new Thread(() -> bank.withdraw(500), "Bob");
        t1.start(); t2.start();
        t1.join(); t2.join();
    }
}`
      }
    ],
    warning: "Always unlock in a **finally** block — otherwise an exception will leave the lock held forever, causing deadlock."
  },
  {
    id: "mt-volatile",
    title: "Volatile & Atomic Variables",
    difficulty: "Hard",
    theory: [
      "**volatile** keyword ensures a variable is always read from and written to **main memory**, not a thread's cache",
      "Without volatile, threads may see **stale values** due to CPU caching",
      "volatile guarantees **visibility** but NOT **atomicity** — `count++` on a volatile int is still not thread-safe",
      "**Atomic classes** (java.util.concurrent.atomic) provide lock-free, thread-safe operations on single variables",
      "**AtomicInteger**, **AtomicLong**, **AtomicBoolean**, **AtomicReference** — common atomic types",
      "Atomics use **CAS (Compare-And-Swap)** — a CPU instruction that atomically compares and updates a value",
      "Use volatile for **flags** (stop signals). Use Atomics for **counters** and **accumulators**"
    ],
    code: [
      {
        title: "volatile & Atomic Variables",
        language: "java",
        content: `import java.util.concurrent.atomic.*;

public class VolatileAtomicDemo {
    // volatile — visibility guarantee
    private static volatile boolean running = true;
    
    // AtomicInteger — thread-safe counter
    private static AtomicInteger counter = new AtomicInteger(0);
    
    public static void main(String[] args) throws Exception {
        // volatile flag — stop signal
        Thread worker = new Thread(() -> {
            int count = 0;
            while (running) { // reads from main memory
                count++;
            }
            System.out.println("Worker stopped after " + count + " iterations");
        });
        worker.start();
        Thread.sleep(100);
        running = false; // visible to worker immediately
        worker.join();
        
        // AtomicInteger — thread-safe increment
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) counter.incrementAndGet();
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) counter.incrementAndGet();
        });
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println("Counter: " + counter.get()); // 200000 (always correct)
        
        // Atomic operations
        AtomicInteger ai = new AtomicInteger(10);
        System.out.println(ai.getAndAdd(5));       // 10 (returns old)
        System.out.println(ai.addAndGet(5));       // 20 (returns new)
        System.out.println(ai.compareAndSet(20, 30)); // true
        System.out.println(ai.get());               // 30
        ai.updateAndGet(x -> x * 2);               // 60
    }
}`
      }
    ],
    tip: "Rule of thumb: Use **volatile** for simple flags. Use **AtomicXxx** for counters. Use **synchronized/Lock** for compound operations."
  },
  {
    id: "mt-executor",
    title: "Executor Framework",
    difficulty: "Medium",
    theory: [
      "The **Executor Framework** decouples task submission from thread management",
      "Instead of creating threads manually, submit tasks to an **ExecutorService** — a managed thread pool",
      "**Executors factory methods:** `newFixedThreadPool(n)`, `newCachedThreadPool()`, `newSingleThreadExecutor()`, `newScheduledThreadPool(n)`",
      "**Fixed pool** — fixed number of threads, excess tasks queue up. Best for predictable workload",
      "**Cached pool** — creates threads as needed, reuses idle ones. Good for short-lived tasks",
      "**Scheduled pool** — run tasks after delay or periodically (like cron)",
      "Always **shutdown()** the executor when done — otherwise the JVM won't exit",
      "submit() returns a **Future** — lets you get the result or handle exceptions later"
    ],
    code: [
      {
        title: "ExecutorService — Thread Pools",
        language: "java",
        content: `import java.util.concurrent.*;

public class ExecutorDemo {
    public static void main(String[] args) throws Exception {
        // Fixed thread pool — 3 threads handle all tasks
        ExecutorService pool = Executors.newFixedThreadPool(3);
        
        // Submit Runnable tasks
        for (int i = 1; i <= 5; i++) {
            final int task = i;
            pool.submit(() -> {
                System.out.println("Task " + task + " on " 
                    + Thread.currentThread().getName());
                try { Thread.sleep(500); } catch (InterruptedException e) {}
            });
        }
        
        // Submit Callable — returns a result
        Future<Integer> future = pool.submit(() -> {
            Thread.sleep(1000);
            return 42;
        });
        System.out.println("Result: " + future.get()); // blocks until done → 42
        
        // Shutdown
        pool.shutdown(); // no new tasks, finish existing
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("Pool shut down");
        
        // Scheduled executor
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(
            () -> System.out.println("Tick!"),
            0, 1, TimeUnit.SECONDS  // initial delay, period
        );
        Thread.sleep(3500);
        scheduler.shutdown();
    }
}`
      }
    ],
    warning: "Always call **shutdown()** on an ExecutorService — forgetting it prevents JVM from exiting."
  },
  {
    id: "mt-callable",
    title: "Callable & Future",
    difficulty: "Medium",
    theory: [
      "**Callable<V>** is like Runnable but **returns a value** and can **throw checked exceptions**",
      "**Future<V>** represents the result of an async computation — get it when ready",
      "**future.get()** blocks until the result is available. Use `get(timeout, unit)` to avoid indefinite blocking",
      "**future.isDone()** checks if computation is complete. **future.cancel()** attempts to cancel",
      "**invokeAll(Collection<Callable>)** — submits all tasks, waits for all to complete",
      "**invokeAny(Collection<Callable>)** — returns the result of the first completed task",
      "Callable + Future is the foundation for async programming in Java"
    ],
    code: [
      {
        title: "Callable & Future — Async Results",
        language: "java",
        content: `import java.util.*;
import java.util.concurrent.*;

public class CallableDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        
        // Single Callable
        Callable<String> task = () -> {
            Thread.sleep(1000);
            return "Hello from " + Thread.currentThread().getName();
        };
        Future<String> future = pool.submit(task);
        System.out.println("Doing other work...");
        System.out.println("Result: " + future.get()); // blocks until ready
        
        // Multiple Callables — invokeAll
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            final int num = i;
            tasks.add(() -> {
                Thread.sleep(num * 200);
                return num * num;
            });
        }
        
        List<Future<Integer>> futures = pool.invokeAll(tasks);
        for (Future<Integer> f : futures) {
            System.out.print(f.get() + " "); // 1 4 9 16 25
        }
        System.out.println();
        
        // invokeAny — first to finish
        String fastest = pool.invokeAny(List.of(
            () -> { Thread.sleep(300); return "Slow"; },
            () -> { Thread.sleep(100); return "Fast"; },
            () -> { Thread.sleep(200); return "Medium"; }
        ));
        System.out.println("Fastest: " + fastest); // Fast
        
        pool.shutdown();
    }
}`
      }
    ],
    note: "Future.get() can throw **ExecutionException** (wrapping the Callable's exception) or **TimeoutException** (with timed get)."
  },
  {
    id: "mt-concurrent",
    title: "Concurrent Data Structures",
    difficulty: "Hard",
    theory: [
      "Standard collections are NOT thread-safe — concurrent reads/writes cause corruption",
      "**ConcurrentHashMap** — segmented locking, high concurrency, no null keys/values",
      "**CopyOnWriteArrayList** — copies array on every write. Best when reads >> writes",
      "**ConcurrentLinkedQueue/Deque** — non-blocking using CAS operations",
      "**BlockingQueue** implementations: ArrayBlockingQueue (bounded), LinkedBlockingQueue (optionally bounded)",
      "**ConcurrentSkipListMap/Set** — concurrent sorted collections based on skip lists",
      "Choose based on: read/write ratio, ordering needs, blocking requirements, and contention level"
    ],
    code: [
      {
        title: "Thread-Safe Collections in Action",
        language: "java",
        content: `import java.util.*;
import java.util.concurrent.*;

public class ConcurrentCollections {
    public static void main(String[] args) throws Exception {
        // ConcurrentHashMap — safe concurrent access
        ConcurrentHashMap<String, Integer> cmap = new ConcurrentHashMap<>();
        
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 4; i++) {
            pool.submit(() -> {
                for (int j = 0; j < 1000; j++) {
                    cmap.merge("count", 1, Integer::sum); // atomic merge
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("Count: " + cmap.get("count")); // 4000
        
        // CopyOnWriteArrayList — safe iteration
        CopyOnWriteArrayList<String> cowl = new CopyOnWriteArrayList<>();
        cowl.add("A"); cowl.add("B"); cowl.add("C");
        // Safe: iterator sees snapshot, modifications don't affect it
        for (String s : cowl) {
            cowl.add(s + "!"); // doesn't throw ConcurrentModificationException
        }
        System.out.println(cowl); // [A, B, C, A!, B!, C!]
        
        // BlockingQueue
        BlockingQueue<String> bq = new ArrayBlockingQueue<>(3);
        bq.put("X"); // blocks if full
        bq.put("Y");
        String item = bq.take(); // blocks if empty
        System.out.println("Took: " + item); // X
    }
}`
      }
    ],
    tip: "**ConcurrentHashMap** should be your default choice for concurrent maps — it's faster than synchronizedMap in almost all cases."
  },
  {
    id: "mt-completable",
    title: "CompletableFuture",
    difficulty: "Hard",
    theory: [
      "**CompletableFuture** is an advanced Future that supports **chaining**, **combining**, and **exception handling**",
      "It implements both **Future** and **CompletionStage** — enabling async pipeline composition",
      "**supplyAsync(supplier)** — run async task that returns a value",
      "**thenApply(fn)** — transform result (like map). **thenAccept(consumer)** — consume result",
      "**thenCompose(fn)** — chain dependent async tasks (like flatMap)",
      "**thenCombine(other, fn)** — combine two independent futures",
      "**allOf(futures...)** — wait for all. **anyOf(futures...)** — wait for any one",
      "**exceptionally(fn)** — handle exceptions. **handle(fn)** — handle both result and exception"
    ],
    code: [
      {
        title: "CompletableFuture — Async Pipelines",
        language: "java",
        content: `import java.util.concurrent.*;

public class CompletableFutureDemo {
    public static void main(String[] args) throws Exception {
        // Basic async computation
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "Hello";
        });
        
        // Chain transformations
        CompletableFuture<String> result = future
            .thenApply(s -> s + " World")       // transform
            .thenApply(String::toUpperCase);     // transform again
        System.out.println(result.get()); // HELLO WORLD
        
        // thenCompose — chain dependent async tasks
        CompletableFuture<String> composed = CompletableFuture
            .supplyAsync(() -> "user123")
            .thenCompose(userId -> fetchUser(userId));
        System.out.println(composed.get());
        
        // thenCombine — combine two independent results
        CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> { sleep(300); return 100; });
        CompletableFuture<Integer> qty = CompletableFuture.supplyAsync(() -> { sleep(200); return 5; });
        CompletableFuture<Integer> total = price.thenCombine(qty, (p, q) -> p * q);
        System.out.println("Total: " + total.get()); // 500
        
        // Exception handling
        CompletableFuture<String> safe = CompletableFuture
            .supplyAsync(() -> { throw new RuntimeException("Oops!"); })
            .exceptionally(ex -> "Fallback: " + ex.getMessage());
        System.out.println(safe.get()); // Fallback: ...Oops!
        
        // allOf — wait for multiple
        CompletableFuture<Void> all = CompletableFuture.allOf(price, qty);
        all.get(); // blocks until both done
        System.out.println("All done!");
    }
    
    static CompletableFuture<String> fetchUser(String id) {
        return CompletableFuture.supplyAsync(() -> "User:" + id);
    }
    
    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
}`
      }
    ],
    tip: "Use **thenApply** for sync transformations, **thenCompose** for chaining async operations (like flatMap for futures)."
  },
  {
    id: "mt-forkjoin",
    title: "Fork/Join Framework",
    difficulty: "Hard",
    theory: [
      "**Fork/Join** is designed for **divide-and-conquer** parallelism — split a task into subtasks, solve in parallel, combine results",
      "Uses a **work-stealing** algorithm — idle threads steal tasks from busy threads' queues",
      "**ForkJoinPool** — the thread pool that manages fork/join tasks. Parallel streams use this internally",
      "**RecursiveTask<V>** — fork/join task that returns a result",
      "**RecursiveAction** — fork/join task with no return value",
      "**fork()** — submit subtask for async execution. **join()** — wait for result",
      "Best for **CPU-bound** tasks that can be recursively decomposed (merge sort, array processing, tree traversal)"
    ],
    code: [
      {
        title: "Fork/Join — Parallel Sum",
        language: "java",
        content: `import java.util.concurrent.*;

public class ForkJoinDemo {
    // RecursiveTask — returns a result
    static class SumTask extends RecursiveTask<Long> {
        private final int[] arr;
        private final int lo, hi;
        private static final int THRESHOLD = 1000;
        
        SumTask(int[] arr, int lo, int hi) {
            this.arr = arr; this.lo = lo; this.hi = hi;
        }
        
        @Override
        protected Long compute() {
            if (hi - lo <= THRESHOLD) {
                // Base case — compute directly
                long sum = 0;
                for (int i = lo; i < hi; i++) sum += arr[i];
                return sum;
            }
            // Fork — split into two subtasks
            int mid = (lo + hi) / 2;
            SumTask left = new SumTask(arr, lo, mid);
            SumTask right = new SumTask(arr, mid, hi);
            
            left.fork();  // submit left to pool
            long rightResult = right.compute(); // compute right in current thread
            long leftResult = left.join();      // wait for left
            
            return leftResult + rightResult;
        }
    }
    
    public static void main(String[] args) {
        int[] arr = new int[10_000_000];
        for (int i = 0; i < arr.length; i++) arr[i] = i + 1;
        
        ForkJoinPool pool = new ForkJoinPool();
        long sum = pool.invoke(new SumTask(arr, 0, arr.length));
        System.out.println("Sum: " + sum);
        
        pool.shutdown();
    }
}`
      }
    ],
    note: "Parallel streams use the **common ForkJoinPool** internally — so Fork/Join is already working behind the scenes when you use `.parallelStream()`."
  },
  {
    id: "mt-patterns",
    title: "Concurrency Patterns",
    difficulty: "Hard",
    theory: [
      "**Producer-Consumer** — producers put items into a shared buffer, consumers take items. Use BlockingQueue",
      "**CountDownLatch** — one or more threads wait until a set of operations complete. Count decrements to zero",
      "**CyclicBarrier** — threads wait for each other at a barrier point. Reusable (unlike CountDownLatch)",
      "**Semaphore** — controls access to a resource with a limited number of permits",
      "**Phaser** — flexible synchronization barrier, can vary the number of parties dynamically",
      "**Thread-local** — each thread gets its own copy of a variable. No sharing, no synchronization needed",
      "These patterns solve common coordination problems in concurrent applications"
    ],
    code: [
      {
        title: "CountDownLatch, CyclicBarrier & Semaphore",
        language: "java",
        content: `import java.util.concurrent.*;

public class ConcurrencyPatterns {
    public static void main(String[] args) throws Exception {
        // CountDownLatch — wait for N tasks to complete
        CountDownLatch latch = new CountDownLatch(3);
        for (int i = 1; i <= 3; i++) {
            final int task = i;
            new Thread(() -> {
                System.out.println("Task " + task + " done");
                latch.countDown();
            }).start();
        }
        latch.await(); // blocks until count reaches 0
        System.out.println("All tasks completed!");
        
        // CyclicBarrier — threads wait for each other
        CyclicBarrier barrier = new CyclicBarrier(3, () -> 
            System.out.println("All threads reached barrier!"));
        for (int i = 0; i < 3; i++) {
            new Thread(() -> {
                try {
                    System.out.println(Thread.currentThread().getName() + " working...");
                    Thread.sleep((long)(Math.random() * 1000));
                    barrier.await(); // wait for others
                } catch (Exception e) {}
            }).start();
        }
        
        Thread.sleep(2000);
        
        // Semaphore — limit concurrent access
        Semaphore semaphore = new Semaphore(2); // max 2 concurrent
        for (int i = 1; i <= 5; i++) {
            final int id = i;
            new Thread(() -> {
                try {
                    semaphore.acquire();
                    System.out.println("Thread " + id + " acquired permit");
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                } finally {
                    semaphore.release();
                    System.out.println("Thread " + id + " released permit");
                }
            }).start();
        }
    }
}`
      },
      {
        title: "ThreadLocal — Per-Thread Data",
        language: "java",
        content: `public class ThreadLocalDemo {
    // Each thread gets its own copy
    private static ThreadLocal<Integer> threadId = ThreadLocal.withInitial(() -> 0);
    private static ThreadLocal<StringBuilder> buffer = ThreadLocal.withInitial(StringBuilder::new);
    
    public static void main(String[] args) throws Exception {
        for (int i = 1; i <= 3; i++) {
            final int id = i;
            Thread t = new Thread(() -> {
                threadId.set(id);
                buffer.get().append("Thread-").append(id);
                
                System.out.println("Thread " + threadId.get() 
                    + " buffer: " + buffer.get());
                
                // Clean up to prevent memory leaks
                threadId.remove();
                buffer.remove();
            });
            t.start();
            t.join();
        }
    }
}`
      }
    ],
    warning: "Always call **ThreadLocal.remove()** when done — especially in thread pools, where threads are reused and stale data can leak."
  }
];
