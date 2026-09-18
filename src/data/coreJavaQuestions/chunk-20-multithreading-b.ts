import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Multi Threading - global questions 197-207.
 * Synchronization, locks, static synchronized, join, lifecycle, deadlock,
 * wait/notify/notifyAll with a worked producer/consumer example.
 */
export const chunk20MultithreadingB = defineChunk({
  topic: "multithreading",
  questions: [
    {
      id: "q197",
      question: "What is synchronization of threads?",
      answer:
        "Synchronisation is the mechanism that gives mutual exclusion on a shared monitor so that only one thread at a time can execute a critical section. In Java, every object has an **intrinsic lock** (also called a monitor), and `synchronized` is the built-in language feature that acquires and releases that lock.\n\n**Two main uses:**\n\n- **Mutual exclusion**: prevent two threads from running the same critical section at the same time, which protects shared state.\n- **Visibility**: writes made inside a `synchronized` block are flushed to main memory on release, and reads on entry pull fresh values. This is the happens-before edge that threads need to see each other's updates.\n\n**Forms:**\n\n- **Synchronised instance method**: locks `this`. Other instance-synchronised methods on the same object block.\n- **Synchronised static method**: locks the `Class` object. Other static-synchronised methods on the same class block, but instance-synchronised methods are unaffected because they lock `this`.\n- **Synchronised block**: locks a chosen object — typically `this`, `SomeClass.class`, or a private final `Object` you create just to be a lock.\n\n**Why explicit locking is sometimes better**: `java.util.concurrent.locks.Lock` supports timed acquisition (`tryLock`), interruptible waits, multiple wait sets via `Condition`, and fairness policies. `synchronized` is simpler and always reentrant on a per-thread basis but lacks those features.\n\n**Java Memory Model note**: even without `synchronized`, `volatile` provides visibility for single variables, and the `final` field rule guarantees safe publication of immutable objects. Reach for `synchronized` when you need atomicity across multiple operations.",
      code: `public class SynchronizationIntro {
    private int counter = 0;
    private final Object lock = new Object();

    void increment() {
        synchronized (lock) {           // critical section
            counter++;
        }
    }

    synchronized int value() {          // synchronised on this instance
        return counter;
    }

    public static void main(String[] args) throws InterruptedException {
        var s = new SynchronizationIntro();
        Thread t1 = new Thread(() -> { for (int i = 0; i < 10_000; i++) s.increment(); });
        Thread t2 = new Thread(() -> { for (int i = 0; i < 10_000; i++) s.increment(); });
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println(s.value());    // 20000
    }
}`,
      codeLanguage: "java",
      explanation:
        "synchronized acquires the object's monitor; gives mutual exclusion and visibility; for finer control use java.util.concurrent.locks.",
    },
    {
      id: "q198",
      question: "Can you give an example of a synchronized block?",
      answer:
        "A `synchronized` block lets you pick the monitor explicitly and shrink the critical section to the smallest possible code path. This is faster than synchronising a whole method because it lets other threads run the rest of the method in parallel.\n\n**Choosing the monitor**:\n\n- **`this`**: matches synchronising the enclosing instance method. Convenient but exposes the lock to other classes, which can deadlock if they grab it.\n- **`ClassName.class`**: equivalent to a static-synchronised method. Lock on the class object itself.\n- **A `private final` lock object**: best practice. Hidden from the rest of the program, never accidentally released by another class. Idiomatic for production code.\n\n**What to put inside the block**: only the operations that read or mutate the shared state. Reads outside the block may see stale data; writes outside the block may race.\n\n**Pitfalls**:\n\n- **Holding the lock while calling out**: calling a slow external method inside a synchronised block serialises everything that needs the lock. Move long-running operations outside the block when you can.\n- **Lock on a mutable object**: if the field that holds the lock object is reassigned, two threads may end up with different monitors. Always make the lock field `private final`.\n- **Nested locks**: if you grab two locks in different orders from different code paths, you can deadlock. Keep a consistent global lock order.",
      code: `import java.util.ArrayList;
import java.util.List;

public class SyncBlockDemo {
    private final List<String> items = new ArrayList<>();
    private final Object lock = new Object();     // private final -> safe lock

    public void add(String item) {
        synchronized (lock) {                    // only the write is locked
            items.add(item);
        }
    }

    public List<String> snapshot() {
        synchronized (lock) {                     // copy under lock
            return new ArrayList<>(items);
        }
    }

    public boolean contains(String item) {
        // No lock needed for a single read with a thread-safe copy
        return snapshot().contains(item);
    }

    public static void main(String[] args) {
        var s = new SyncBlockDemo();
        s.add(\"alpha\"); s.add(\"beta\");
        System.out.println(s.snapshot());          // [alpha, beta]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use private final lock objects, shrink the block to the critical section only, and never call out while holding the lock.",
    },
    {
      id: "q199",
      question: "Can a static method be synchronized?",
      answer:
        "Yes. A `static synchronized` method locks on the `Class` object rather than on any instance. So if `Foo` has a static synchronised method, the monitor is `Foo.class`. This is a completely separate lock from any instance synchronised on the same class — a thread can run an instance-synchronised method while another thread runs a static-synchronised method on the same class.\n\n**Why this matters**:\n\n- Instance synchronisation protects instance state (`this.balance`).\n- Static synchronisation protects static state (`Foo.COUNT`).\n- Mixing them without thinking is the source of confusing deadlocks and missed mutual exclusion.\n\n**Synchronising a block in a static method** uses the class literal directly: `synchronized (MyClass.class) { ... }`. The class literal is itself a singleton, so the lock is well-defined.\n\n**Alternative with `Lock`**: `ReentrantLock` and `ReentrantReadWriteLock` give you explicit locks without the implicit monitor. They are usually preferred for new code because they support timed acquisition, multiple conditions and the ability to interrupt a thread that is waiting on the lock.",
      code: `public class StaticSyncDemo {
    private static int count = 0;

    public static synchronized void increment() {
        count++;                                  // locks MyClass.class
    }

    public static int value() {
        synchronized (StaticSyncDemo.class) {     // explicit class lock
            return count;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Runnable r = () -> { for (int i = 0; i < 10_000; i++) increment(); };
        Thread t1 = new Thread(r), t2 = new Thread(r);
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println(value());              // 20000
    }
}`,
      codeLanguage: "java",
      explanation:
        "Static synchronised locks the Class object; instance synchronised locks `this`; never assume the two are equivalent.",
    },
    {
      id: "q200",
      question: "What is the use of join method in threads?",
      answer:
        "`t.join()` (and its timed/with-throwable overloads) blocks the calling thread until the target thread `t` terminates. It is the standard way to wait for the result of work done on another thread before continuing, without resorting to busy polling.\n\n**Common uses**:\n\n- **Order of operations**: \"start background work, then join it before printing the result.\"\n- **Joining all workers**: spawn N threads to split a workload, then join each before reading the aggregated results.\n- **Cleanup coordination**: main thread waits for daemon workers to finish current work before shutdown.\n\n**Forms of join**:\n\n- `t.join()` — wait forever (or until interrupted).\n- `t.join(long millis)` — wait at most the given number of milliseconds.\n- `t.join(long millis, int nanos)` — wait with sub-millisecond precision.\n\nAll three throw `InterruptedException` if the calling thread is interrupted while waiting. Handle the interrupt by re-setting the interrupt flag and bailing out.\n\n**Where join sits in the lifecycle**: join does not change the target thread's state. The target continues through NEW → RUNNABLE → TERMINATED; the joining thread simply moves to WAITING or TIMED_WAITING and returns when the target reaches TERMINATED.\n\n**Anti-pattern**: do not join a thread you started with `setDaemon(true)` in a long-running service. Daemons can be killed at any moment by the JVM, which would unblock the join with no guarantee that the work is done.",
      code: `public class JoinDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
            System.out.println(\"worker done\");
        });
        worker.start();
        worker.join(1000);                            // wait up to 1s
        System.out.println(\"main proceeds\");

        Thread[] workers = new Thread[4];
        for (int i = 0; i < 4; i++) {
            final int id = i;
            workers[i] = new Thread(() -> {
                try { Thread.sleep(50L * id); } catch (InterruptedException ignored) {}
                System.out.println(\"task \" + id + \" done\");
            });
            workers[i].start();
        }
        for (Thread t : workers) t.join();           // wait for each
        System.out.println(\"all workers done\");
    }
}`,
      codeLanguage: "java",
      explanation:
        "join blocks the caller until the target terminates; useful for ordering and aggregating worker results; throws InterruptedException.",
    },
    {
      id: "q201",
      question: "Describe a few other important methods in threads?",
      answer:
        "Beyond start, run, sleep and join, a few thread methods are worth knowing in production code:\n\n- **`Thread.sleep(millis)`** — sleeps the current thread for the given duration, does NOT release locks. Throws `InterruptedException`. Used for crude pacing; not for coordination (use wait/notify or `BlockingQueue` for that).\n- **`Thread.yield()`** — a hint to the scheduler that the current thread is willing to give up its time slice. The JVM is free to ignore it. Useful in spin loops where you want to avoid pegging a CPU.\n- **`Thread.interrupt()`** — sets the interrupt flag on the target. The target can check it with `Thread.interrupted()` (clears the flag) or `isInterrupted()` (does not clear). Blocking calls like `sleep`, `wait`, `join` and `BlockingQueue.take` will throw `InterruptedException` in response.\n- **`Thread.setDaemon(boolean)`** — daemon threads do not prevent JVM exit. The JVM terminates when only daemon threads remain. Useful for background workers; dangerous if they hold resources.\n- **`Thread.setName(String)` / `getName()`** — readable thread names are gold in stack traces. `Thread.currentThread().getName()` works everywhere.\n- **`Thread.setUncaughtExceptionHandler(...)`** — receives exceptions that escape a thread's `run`. Set globally with `Thread.setDefaultUncaughtExceptionHandler`.\n- **`Thread.holdsLock(Object)`** — `true` if the current thread holds the monitor on the given object. Useful in assertions.\n- **`Thread.currentThread()`** — the canonical way to get a reference to the thread currently executing.\n\n**Modern alternative**: many of these patterns are now better expressed with `ExecutorService`, `CompletableFuture` and the structured concurrency APIs.",
      code: `public class ThreadMethodsDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread.currentThread().setName(\"main-thread\");

        Thread worker = new Thread(() -> {
            // holdsLock before entering synchronised block
            System.out.println(\"working on \" + Thread.currentThread().getName());
            try { Thread.sleep(50); } catch (InterruptedException e) {
                Thread.currentThread().interrupt();          // re-raise the flag
                return;
            }
            System.out.println(\"isInterrupted? \" + Thread.currentThread().isInterrupted());
        }, \"worker-1\");
        worker.setDaemon(true);                              // JVM can exit without this thread
        worker.setUncaughtExceptionHandler((t, e) -> System.err.println(t.getName() + \" crashed: \" + e));
        worker.start();
        worker.join();
        System.out.println(\"done on \" + Thread.currentThread().getName());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Thread API: sleep/yield for pacing, interrupt for cancellation, setDaemon for background work, holdsLock for assertions.",
    },
    {
      id: "q202",
      question: "What is a deadlock?",
      answer:
        "A deadlock is a situation where two or more threads are each holding a lock the others need, and none of them can proceed. The JVM does not detect or recover from deadlocks — the application simply hangs.\n\n**Coffman conditions** (all four must be true for a deadlock):\n\n1. **Mutual exclusion** — each lock is held by at most one thread at a time.\n2. **Hold and wait** — a thread holds one lock while waiting for another.\n3. **No preemption** — locks are not forcibly taken from a thread.\n4. **Circular wait** — there is a cycle in the wait-for graph: T1 waits for L2 (held by T2), T2 waits for L1 (held by T1).\n\n**How to break deadlocks**:\n\n- **Lock ordering**: pick a global order for acquiring locks (e.g. always lock account with smaller id first) and enforce it everywhere.\n- **Lock timeout**: use `Lock.tryLock(timeout)` so a thread eventually backs off instead of waiting forever.\n- **Avoid nested locks**: use higher-level abstractions (`ExecutorService`, `ConcurrentHashMap.compute`) that lock internally.\n- **Use `Lock` and `Condition`**: the modern API gives you interruptible waits, which make cancellation easier.\n\n**Detecting deadlocks**:\n\n- `ThreadMXBean.findDeadlockedThreads()` returns the threads currently in a deadlock — useful for self-healing services.\n- `jstack <pid>` prints thread dumps; look for threads in `BLOCKED` state on a lock owned by another `BLOCKED` thread.\n\n**Practical advice**: structure your code so a thread holds at most one lock at a time. The hardest deadlocks are the ones that only fire under load.",
      code: `import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class DeadlockDemo {
    public static void main(String[] args) {
        Lock a = new ReentrantLock();
        Lock b = new ReentrantLock();

        // Classic two-lock deadlock if both threads grab in opposite order.
        Thread t1 = new Thread(() -> { a.lock(); try {
            try { Thread.sleep(20); } catch (InterruptedException ignored) {}
            b.lock(); try { System.out.println(\"t1 both locks\"); } finally { b.unlock(); }
        } finally { a.unlock(); } });

        Thread t2 = new Thread(() -> { b.lock(); try {
            try { Thread.sleep(20); } catch (InterruptedException ignored) {}
            a.lock(); try { System.out.println(\"t2 both locks\"); } finally { a.unlock(); }
        } finally { b.unlock(); } });

        t1.start(); t2.start();    // likely deadlocks; jstack will show it
    }
}`,
      codeLanguage: "java",
      explanation:
        "Deadlock = cycle in the wait-for graph; prevent with consistent lock order, timeouts, or higher-level concurrency primitives.",
    },
    {
      id: "q203",
      question: "What are the important methods in Java for inter-thread communication?",
      answer:
        "The classic API for inter-thread communication lives on `java.lang.Object` and consists of three pairs: `wait`/`notify`/`notifyAll` on the one hand, and the `synchronized` mechanism that gives you the lock they coordinate on. Modern code prefers `java.util.concurrent` (BlockingQueue, CountDownLatch, CyclicBarrier, Phaser, CompletableFuture) but you should still know the basics.\n\n**The four cooperating primitives**:\n\n- **`wait()` / `wait(long)` / `wait(long, int)`** — releases the monitor and suspends the current thread until another thread calls `notify` or `notifyAll` on the same object, or the timeout expires. Must be called inside a `synchronized` block on the same monitor.\n- **`notify()`** — wakes one thread that is waiting on the monitor. The chosen thread is implementation-defined. The awakened thread has to re-acquire the monitor before returning from `wait`.\n- **`notifyAll()`** — wakes every thread that is waiting on the monitor. Recommended over `notify` because it avoids lost wake-ups.\n- **`Thread.sleep(long)`** — pauses for a fixed time without releasing the monitor. Use it for pacing, not coordination.\n\n**Conditions for using wait/notify correctly**:\n\n- Always call `wait` inside a `while` loop on the condition you are waiting for — spurious wakeups can happen, and the condition may have changed.\n- Always hold the monitor when you call `notify`/`notifyAll`.\n- Document which object is the signal.\n\n**Modern recommendation**: use `ArrayBlockingQueue` for producer/consumer, `CountDownLatch` for one-shot gates, `CyclicBarrier` for re-usable rendezvous, and `CompletableFuture` for asynchronous pipelines. They are much harder to misuse.",
      code: `import java.util.LinkedList;
import java.util.Queue;

public class CommunicationDemo {
    private final Queue<Integer> buffer = new LinkedList<>();
    private final int capacity = 2;

    synchronized void produce(int item) throws InterruptedException {
        while (buffer.size() == capacity) wait();            // wait until space
        buffer.add(item);
        notifyAll();                                          // tell consumers
    }

    synchronized int consume() throws InterruptedException {
        while (buffer.isEmpty()) wait();                     // wait for item
        int item = buffer.remove();
        notifyAll();                                          // tell producers
        return item;
    }

    public static void main(String[] args) {
        var box = new CommunicationDemo();
        // Use BlockingQueue in real code; this is just the primitive API.
    }
}`,
      codeLanguage: "java",
      explanation:
        "wait/notify/notifyAll coordinate on a monitor; always wrap wait in while; prefer BlockingQueue or CompletableFuture in modern code.",
    },
    {
      id: "q204",
      question: "What is the use of wait method?",
      answer:
        "`wait()` suspends the current thread and releases the monitor it holds. The thread stays in the WAITING state until another thread calls `notify` or `notifyAll` on the same object, or until the optional timeout expires.\n\n**Why you would call wait**:\n\n- **Producer waits for space**: if a bounded buffer is full, the producer cannot add. It calls `wait()` and goes to sleep until a consumer takes an item.\n- **Consumer waits for an item**: if a buffer is empty, the consumer calls `wait()` until a producer arrives.\n- **Waiting for state change**: any condition that the thread cannot make progress on, but another thread will eventually signal.\n\n**Critical rules**:\n\n- `wait` must be called inside a `synchronized` block on the monitor that the caller wants to wait on. Calling `wait` without holding the monitor throws `IllegalMonitorStateException`.\n- `wait` releases the monitor; the thread is suspended; when it wakes, it must re-acquire the monitor before returning.\n- Always guard with a `while` loop: `while (!condition) wait();`. Spurious wakeups are allowed by the JVM, and the condition may have changed since the wakeup.\n- Use `wait(long millis)` if you want a timeout fallback in case the signal never arrives.\n\n**Common bugs**:\n\n- **Lost wakeup**: producer adds an item and then checks if a consumer is waiting, but does not call notify. Always notify under the lock.\n- **Missed notification**: a waiter calls `wait` after the notifier has already called `notify`. Result: the wait hangs forever. The `while` loop helps but the right fix is to call `notifyAll` and to check the condition under the lock.",
      code: `class Waiter extends Thread {
    private final Object lock;
    private final int target;

    Waiter(Object lock, int target) { this.lock = lock; this.target = target; }

    public void run() {
        synchronized (lock) {
            while (target > System.currentTimeMillis() % 100) {
                try { lock.wait(); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt(); return;
                }
            }
            System.out.println(\"target reached\");
        }
    }
}

public class WaitMethod {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();
        new Waiter(lock, 50).start();
        Thread.sleep(100);
        synchronized (lock) { lock.notifyAll(); }
    }
}`,
      codeLanguage: "java",
      explanation:
        "wait releases the monitor and suspends the thread; always inside synchronized; always inside a while-loop guard; the JVM may wake spuriously.",
    },
    {
      id: "q205",
      question: "What is the use of notify method?",
      answer:
        "`notify()` wakes **one** thread that is currently waiting on the same monitor. The chosen thread is implementation-defined — typically the longest-waiting one, but you cannot rely on that. After being woken, the thread must re-acquire the monitor before it can continue.\n\n**When to use notify**:\n\n- **Exactly one waiter can make progress**: e.g. a single-slot handoff where only one consumer can take the next item.\n- **You have proven that any waiter will do**: usually only true when there is a single condition and exactly one thread is waiting.\n\n**When to avoid notify**:\n\n- **Multiple waiters might exist for the same condition**: notify picks one of them, but the wrong one might wake. Use `notifyAll` instead.\n- **You are not sure how many waiters there are**: notify can leave a thread hanging because the wrong one was woken.\n\n**Why notify is dangerous in production**: it is easy to introduce bugs where a notify wakes a thread that is waiting for a different condition. The \"missed signal\" / \"lost wakeup\" pattern is one of the classic pitfalls of low-level concurrency. Most modern code prefers `BlockingQueue` or `CompletableFuture` so that wakeups are paired naturally with puts or completions.\n\n**`notify` vs `notifyAll`**: notify is faster because only one thread wakes. notifyAll is safer because every waiter re-checks its condition. In production code, the safety advantage of `notifyAll` usually outweighs the small performance cost.",
      code: `import java.util.LinkedList;
import java.util.Queue;

public class NotifyDemo {
    private final Queue<Integer> q = new LinkedList<>();

    public synchronized void put(int item) {
        q.add(item);
        notify();                       // wake a single consumer
    }

    public synchronized int take() throws InterruptedException {
        while (q.isEmpty()) wait();
        int head = q.remove();
        notify();                       // wake a single producer
        return head;
    }

    public static void main(String[] args) throws Exception {
        var box = new NotifyDemo();
        new Thread(() -> {
            try { System.out.println(box.take()); } catch (InterruptedException ignored) {}
        }).start();
        Thread.sleep(20);
        box.put(42);
        Thread.sleep(50);
    }
}`,
      codeLanguage: "java",
      explanation:
        "notify wakes one waiter; safe only when you know one thread can make progress; prefer notifyAll when in doubt.",
    },
    {
      id: "q206",
      question: "What is the use of notifyall method?",
      answer:
        "`notifyAll()` wakes **every** thread currently waiting on the monitor. Each awakened thread re-checks its condition and competes for the monitor; the losers go back to waiting. This is the safer alternative to `notify` because no waiter is silently ignored.\n\n**When to use notifyAll**:\n\n- **Multiple conditions on one monitor**: e.g. a queue where producers wait on \"not full\" and consumers wait on \"not empty\". Waking just one thread with `notify` could wake the wrong kind.\n- **You are not 100% sure of the waiters**: when in doubt, notifyAll — the cost is negligible compared to a missed signal.\n\n**The standard pattern** is a guarded block:\n\n```\nsynchronized (lock) {\n    while (!condition) lock.wait();\n    // ... do the work ...\n    lock.notifyAll();\n}\n```\n\nThe `while` loop protects against spurious wakeups and against being notified when the condition has not actually been met for this thread. The `notifyAll` is at the end of the protected block, just before releasing the monitor, so waiters can immediately re-evaluate.\n\n**Why not just use BlockingQueue**:\n\n- `ArrayBlockingQueue` internally uses exactly this pattern (Condition variables on a ReentrantLock).\n- `LinkedBlockingQueue` uses two locks — one for the head and one for the tail — to allow producers and consumers to operate independently.\n- Once you reach for `wait`/`notify`, ask whether `BlockingQueue` would do the job in a tenth of the code.",
      code: `import java.util.LinkedList;
import java.util.Queue;

public class NotifyAllDemo {
    private final Queue<Integer> q = new LinkedList<>();
    private final int capacity = 4;

    public synchronized void put(int item) throws InterruptedException {
        while (q.size() == capacity) wait();
        q.add(item);
        notifyAll();                    // wake everyone; each re-checks its condition
    }

    public synchronized int take() throws InterruptedException {
        while (q.isEmpty()) wait();
        int item = q.remove();
        notifyAll();                    // wake producers too
        return item;
    }

    public static void main(String[] args) throws Exception {
        var box = new NotifyAllDemo();
        for (int i = 0; i < 3; i++) new Thread(() -> {
            try { System.out.println(box.take()); } catch (InterruptedException ignored) {}
        }).start();
        for (int i = 0; i < 3; i++) box.put(i);
        Thread.sleep(50);
    }
}`,
      codeLanguage: "java",
      explanation:
        "notifyAll wakes every waiter; safe even when multiple conditions share the monitor; the cost is negligible.",
    },
    {
      id: "q207",
      question: "Can you write a synchronized program with wait and notify methods?",
      answer:
        "A worked example: a single-slot handoff between a producer and a consumer. The producer fills the slot and waits if it is already full; the consumer empties the slot and waits if it is empty. Both sides use `synchronized`, `wait`, and `notifyAll`.\n\n**Why this is the canonical example**:\n\n- It shows all three methods in context.\n- The condition is symmetric and easy to reason about.\n- It demonstrates the `while`-loop guard against spurious wakeups.\n\n**How it works step by step:**\n\n1. Producer arrives. If `slot != null`, the producer `wait`s. Otherwise it stores the new item and `notifyAll`s.\n2. Consumer arrives. If `slot == null`, the consumer `wait`s. Otherwise it reads the slot, sets it to `null`, and `notifyAll`s.\n3. Either side, after waking, re-checks its condition under the same monitor.\n\n**Modern equivalent**: `SynchronousQueue` does exactly this — a hand-off queue with no capacity. The implementation in the JDK uses a `ReentrantLock` plus `Condition` variables and is essentially the same algorithm.\n\n**How to extend**: replace the single slot with a bounded buffer and you have a full producer/consumer queue; replace the hand-off with priority and you have a `PriorityBlockingQueue`. Most low-level concurrency primitives in the JDK are built from `Lock` + `Condition` exactly the way this example is built from `synchronized` + `wait`/`notifyAll`.",
      code: `public class HandOff {
    private Integer slot;

    public synchronized void produce(int value) throws InterruptedException {
        while (slot != null) wait();           // wait for slot to be empty
        slot = value;
        System.out.println(\"produced \" + value);
        notifyAll();
    }

    public synchronized int consume() throws InterruptedException {
        while (slot == null) wait();           // wait for slot to be full
        int value = slot;
        slot = null;
        System.out.println(\"consumed \" + value);
        notifyAll();
        return value;
    }

    public static void main(String[] args) throws Exception {
        var handOff = new HandOff();
        Thread producer = new Thread(() -> {
            try { for (int i = 1; i <= 3; i++) handOff.produce(i); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try { for (int i = 1; i <= 3; i++) handOff.consume(); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start(); consumer.start();
        producer.join();  consumer.join();
        System.out.println(\"hand-off complete\");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use synchronized + while-loop + wait + notifyAll; modern equivalent is SynchronousQueue or BlockingQueue.",
    },
  ],
  meta: {
    q197: { difficulty: "medium", priority: "very-high", tags: ["synchronized", "monitor"], relatedQuestionIds: ["q198", "q199"], estimatedReadMinutes: 3 },
    q198: { difficulty: "medium", priority: "high", tags: ["synchronized", "block"], relatedQuestionIds: ["q197", "q199"], estimatedReadMinutes: 3 },
    q199: { difficulty: "medium", priority: "high", tags: ["synchronized", "static"], relatedQuestionIds: ["q197", "q198"], estimatedReadMinutes: 3 },
    q200: { difficulty: "easy", priority: "high", tags: ["join", "lifecycle"], relatedQuestionIds: ["q190", "q201"], estimatedReadMinutes: 2 },
    q201: { difficulty: "medium", priority: "high", tags: ["thread", "methods"], relatedQuestionIds: ["q190", "q200"], estimatedReadMinutes: 3 },
    q202: { difficulty: "medium", priority: "very-high", tags: ["deadlock", "concurrency"], relatedQuestionIds: ["q171", "q203"], estimatedReadMinutes: 3 },
    q203: { difficulty: "medium", priority: "very-high", tags: ["inter-thread", "wait"], relatedQuestionIds: ["q204", "q205"], estimatedReadMinutes: 3 },
    q204: { difficulty: "medium", priority: "very-high", tags: ["wait", "monitor"], relatedQuestionIds: ["q205", "q206"], estimatedReadMinutes: 3 },
    q205: { difficulty: "medium", priority: "high", tags: ["notify", "monitor"], relatedQuestionIds: ["q204", "q206"], estimatedReadMinutes: 3 },
    q206: { difficulty: "medium", priority: "high", tags: ["notifyall", "monitor"], relatedQuestionIds: ["q204", "q205"], estimatedReadMinutes: 3 },
    q207: { difficulty: "hard", priority: "high", tags: ["wait-notify", "producer-consumer"], relatedQuestionIds: ["q204", "q206"], estimatedReadMinutes: 4 },
  },
});