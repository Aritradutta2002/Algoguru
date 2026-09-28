import { defineBackendChunk } from "./contract";

/**
 * Multithreading part A — threads, the Java Memory Model, locks (b081–b094).
 */
export const chunk06MultithreadingA = defineBackendChunk({
  topic: "multithreading",
  questions: [
    {
      id: "b081",
      question: "Explain the thread lifecycle and every state in Thread.State.",
      answer:
        "`Thread.State` has exactly six values, and the distinction between the last three is what interviewers probe.\n\n" +
        "- **NEW** — the `Thread` object exists but `start()` has not been called. No OS thread yet.\n" +
        "- **RUNNABLE** — eligible to run. Java deliberately **merges 'running on a CPU' and 'ready in the scheduler queue'** into one state, because the JVM cannot portably see which. Note that a thread blocked in a *native* IO read is still reported as RUNNABLE — a common source of confusion when reading thread dumps.\n" +
        "- **BLOCKED** — waiting to acquire a **monitor lock** to enter or re-enter a `synchronized` block. This is the only state that means 'contending for an intrinsic lock'.\n" +
        "- **WAITING** — waiting **indefinitely** for another thread: `Object.wait()`, `Thread.join()`, `LockSupport.park()`.\n" +
        "- **TIMED_WAITING** — the same but with a deadline: `Thread.sleep(n)`, `wait(n)`, `join(n)`, `LockSupport.parkNanos`, `lock.tryLock(timeout)`, `future.get(timeout)`.\n" +
        "- **TERMINATED** — `run()` has returned or thrown. A thread cannot be restarted; calling `start()` again throws `IllegalThreadStateException`.\n\n" +
        "Key transitions to state out loud:\n\n" +
        "- `start()` → NEW to RUNNABLE. Calling `run()` directly just executes on the **current** thread — the classic trick question.\n" +
        "- `synchronized` contention → RUNNABLE to BLOCKED.\n" +
        "- `wait()` → releases the monitor and moves to WAITING; `notify()` moves it to BLOCKED (it must re-acquire the lock before continuing).\n" +
        "- `sleep()` → TIMED_WAITING and **does not release any lock**. That difference between `sleep` and `wait` is asked constantly.\n\n" +
        "Reading a thread dump is the practical application: many BLOCKED threads on one monitor means lock contention; many WAITING on a pool's queue means starvation upstream.",
      code: `public class ThreadStates {
    private static final Object LOCK = new Object();

    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            synchronized (LOCK) {
                try { LOCK.wait(); } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "worker");

        System.out.println("after construction: " + t.getState());   // NEW
        t.start();
        Thread.sleep(50);
        System.out.println("inside wait():      " + t.getState());   // WAITING

        // A second thread contending for the SAME monitor shows BLOCKED.
        Thread blocker = new Thread(() -> {
            synchronized (LOCK) { /* will not get in while main holds it */ }
        }, "blocker");
        synchronized (LOCK) {
            blocker.start();
            Thread.sleep(50);
            System.out.println("contending:         " + blocker.getState()); // BLOCKED
            LOCK.notifyAll();                       // worker -> BLOCKED, then RUNNABLE
        }

        t.join(); blocker.join();
        System.out.println("after run() returns:" + t.getState());    // TERMINATED

        // Trick question: run() does NOT start a thread.
        Thread direct = new Thread(() ->
            System.out.println("executed on: " + Thread.currentThread().getName()));
        direct.run();                                // prints "main"
        direct.start();                              // prints "Thread-N"
        direct.join();

        // A thread cannot be restarted.
        try { direct.start(); }
        catch (IllegalThreadStateException e) { System.out.println("cannot restart"); }

        // TIMED_WAITING: sleep holds any lock it owns.
        Thread sleeper = new Thread(() -> {
            synchronized (LOCK) {
                try { Thread.sleep(200); }          // still owns LOCK
                catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        });
        sleeper.start(); Thread.sleep(50);
        System.out.println("sleeping:           " + sleeper.getState());  // TIMED_WAITING
        sleeper.join();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Six states; BLOCKED is monitor contention, WAITING/TIMED_WAITING is cooperative — and sleep() keeps the lock while wait() releases it.",
      followUps: [
        "Why does a thread blocked on a socket read show as RUNNABLE?",
        "What does a thread dump full of BLOCKED threads tell you?",
      ],
    },
    {
      id: "b082",
      question: "What is the Java Memory Model and what does happens-before actually guarantee?",
      answer:
        "The JMM (specified by JSR-133, Java 5) defines **when a write by one thread becomes visible to a read by another**. Without it, the compiler, the JIT and the CPU are all free to reorder, cache in registers and buffer writes — and they do.\n\n" +
        "Three distinct problems it addresses:\n\n" +
        "1. **Visibility** — thread B may never see thread A's write because A's value sits in a CPU store buffer or a register.\n" +
        "2. **Reordering** — the compiler and CPU may execute independent instructions out of order; each thread sees its own actions in order, but other threads may not.\n" +
        "3. **Atomicity** — `i++` is read-modify-write, three operations; `long`/`double` writes were not even guaranteed atomic historically (they are for `volatile`).\n\n" +
        "**Happens-before** is a partial order. If action A happens-before action B, then A's effects are **visible and ordered** before B. The edges you must be able to list:\n\n" +
        "- **Program order** — within a single thread, earlier statements happen-before later ones.\n" +
        "- **Monitor lock** — unlocking a monitor happens-before any subsequent lock of the *same* monitor.\n" +
        "- **Volatile** — a write to a volatile field happens-before every subsequent read of that field.\n" +
        "- **Thread start** — `t.start()` happens-before everything in `t`.\n" +
        "- **Thread join** — everything in `t` happens-before `t.join()` returning.\n" +
        "- **Final fields** — correctly constructed final fields are visible without synchronisation (provided `this` did not escape the constructor).\n" +
        "- **Transitivity** — if A hb B and B hb C then A hb C.\n" +
        "- Also: `Executor.submit` hb the task running; the task's completion hb `Future.get()` returning; a `CountDownLatch.countDown()` hb an `await()` returning; a `BlockingQueue.put` hb the matching `take`.\n\n" +
        "**The one-line summary:** 'synchronized and volatile are not just about mutual exclusion — they insert memory barriers that create happens-before edges, and without such an edge there is no visibility guarantee at all.'",
      code: `public class MemoryModelDemo {

    // BROKEN: no happens-before edge - the reader may spin forever.
    static class Unsafe {
        private boolean running = true;              // plain field
        private int payload = 0;
        void writer() { payload = 42; running = false; }
        void reader() {
            while (running) { /* JIT may hoist the read out of the loop */ }
            System.out.println(payload);             // may print 0, or never run
        }
    }

    // FIXED with volatile: write to 'running' hb subsequent read of 'running'.
    static class VolatileFix {
        private int payload = 0;                     // plain, but ordered by the volatile
        private volatile boolean running = true;
        void writer() { payload = 42; running = false; }   // release: payload flushed first
        void reader() {
            while (running) { }
            System.out.println(payload);             // guaranteed 42
        }
    }

    // FIXED with synchronized: unlock hb subsequent lock of the SAME monitor.
    static class LockFix {
        private boolean running = true;
        private int payload = 0;
        synchronized void writer() { payload = 42; running = false; }
        synchronized boolean isRunning() { return running; }
        synchronized int payload() { return payload; }
    }

    // Safe publication via final fields.
    static final class Config {
        final String url;                            // final => visible after construction
        Config(String url) { this.url = url; }       // 'this' must not escape here
    }

    public static void main(String[] args) throws Exception {
        VolatileFix v = new VolatileFix();
        Thread reader = new Thread(v::reader);
        reader.start();                              // start() hb everything in the thread
        Thread.sleep(50);
        v.writer();
        reader.join();                               // thread actions hb join() returning
        System.out.println("joined");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Happens-before is the only visibility guarantee; volatile writes, monitor unlocks, start/join and final fields are the edges that create it.",
      followUps: [
        "Why can the JIT hoist a plain boolean read out of a loop?",
        "What does 'this escaping the constructor' break?",
      ],
    },
    {
      id: "b083",
      question: "What does volatile do, what does it not do, and when is it enough?",
      answer:
        "`volatile` makes a field's reads and writes go **directly to main memory** and inserts memory barriers around them.\n\n" +
        "Three guarantees:\n\n" +
        "1. **Visibility** — a write is immediately visible to every subsequent read by any thread. No caching in registers, no hoisting out of a loop.\n" +
        "2. **Ordering** — a volatile write is a **release** (all prior writes are flushed first) and a volatile read is an **acquire** (no subsequent reads move before it). This is what makes the double-checked-locking fix work: the object is fully constructed before the reference becomes visible.\n" +
        "3. **Atomicity of 64-bit access** — reads and writes of `volatile long`/`double` are atomic; plain ones may be torn into two 32-bit halves on some JVMs.\n\n" +
        "What it does **not** do:\n\n" +
        "- **No atomicity for compound operations.** `count++` is read, add, write; two threads can interleave and lose an update. `volatile` makes each read and each write visible, not the sequence atomic.\n" +
        "- **No mutual exclusion.** Nothing is locked.\n" +
        "- **No help for multi-variable invariants** — if two fields must change together, `volatile` cannot help.\n\n" +
        "When `volatile` is exactly right:\n\n" +
        "- A **status or shutdown flag** written by one thread and read by many.\n" +
        "- **Safe publication** of an immutable object: build it fully, then assign the reference.\n" +
        "- The **double-checked locking** `instance` field.\n" +
        "- A value written by **one** writer and read by many where the new value does not depend on the old.\n\n" +
        "If you need read-modify-write, use `AtomicInteger`/`LongAdder`; if you need a multi-field invariant, use a lock or an immutable snapshot.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class VolatileDemo {

    // 1. CORRECT USE: a shutdown flag.
    static class Worker implements Runnable {
        private volatile boolean shutdown = false;   // without volatile: may never stop
        public void run() {
            while (!shutdown) { /* work */ }
            System.out.println("stopped cleanly");
        }
        void stop() { shutdown = true; }
    }

    // 2. INCORRECT USE: volatile does NOT make ++ atomic.
    static class BrokenCounter {
        volatile int count = 0;
        void increment() { count++; }                // read-modify-write: LOST UPDATES
    }
    static class CorrectCounter {
        private final AtomicInteger count = new AtomicInteger();
        void increment() { count.incrementAndGet(); } // single CAS loop
        int get() { return count.get(); }
    }

    // 3. CORRECT USE: safe publication / double-checked locking.
    static class Singleton {
        private static volatile Singleton instance;   // volatile is REQUIRED here
        private final int[] data = new int[1000];
        private Singleton() { }
        static Singleton getInstance() {
            Singleton local = instance;               // one volatile read
            if (local == null) {
                synchronized (Singleton.class) {
                    local = instance;
                    if (local == null) instance = local = new Singleton();
                }
            }
            return local;
        }
    }

    public static void main(String[] args) throws Exception {
        Worker w = new Worker();
        Thread t = new Thread(w); t.start();
        Thread.sleep(50); w.stop(); t.join();

        BrokenCounter broken = new BrokenCounter();
        CorrectCounter correct = new CorrectCounter();
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch done = new CountDownLatch(8);
        for (int i = 0; i < 8; i++) pool.submit(() -> {
            for (int k = 0; k < 100_000; k++) { broken.increment(); correct.increment(); }
            done.countDown();
        });
        done.await(); pool.shutdown();

        System.out.println("volatile int++ : " + broken.count);   // < 800000, lost updates
        System.out.println("AtomicInteger  : " + correct.get());  // exactly 800000
    }
}`,
      codeLanguage: "java",
      explanation:
        "volatile gives visibility and ordering but never atomicity — it fixes flags and safe publication, not counters.",
      followUps: [
        "Why is volatile required on the double-checked-locking field?",
        "What exactly is a release-store and an acquire-load?",
      ],
    },
    {
      id: "b084",
      question: "synchronized vs ReentrantLock — what does each give you and when do you switch?",
      answer:
        "synchronized (intrinsic / monitor lock):\n\n" +
        "- Language-level; every object has a monitor. On a method it locks `this` (or the `Class` for `static`).\n" +
        "- **Automatically released** when the block exits, including on exception. Impossible to leak.\n" +
        "- **Reentrant** — the owning thread can re-enter.\n" +
        "- Heavily optimised by the JVM: **biased locking** (removed in JDK 15+), **thin/lightweight locks** via CAS, and **lock elision** or **coarsening** when escape analysis proves no contention.\n" +
        "- Limitations: cannot time out, cannot be interrupted while waiting, cannot try-and-fail, always unfair, and lock/unlock must nest within one method scope.\n\n" +
        "ReentrantLock (java.util.concurrent.locks):\n\n" +
        "- Built on `AbstractQueuedSynchronizer`. You must `unlock()` in a **`finally`** block — forgetting it is a permanent deadlock.\n" +
        "- **`tryLock()`** — acquire or fail immediately; **`tryLock(timeout, unit)`** — bounded wait. This is the standard deadlock-avoidance tool.\n" +
        "- **`lockInterruptibly()`** — a waiting thread can be cancelled.\n" +
        "- **Fairness** — `new ReentrantLock(true)` serves the longest waiter first, eliminating starvation at a significant throughput cost.\n" +
        "- **Multiple `Condition`s** per lock — `notFull` and `notEmpty` on one buffer, so you can wake exactly the right group instead of `notifyAll()` waking everyone.\n" +
        "- Introspection: `isLocked()`, `getHoldCount()`, `getQueueLength()`.\n" +
        "- Can be acquired in one method and released in another (hand-over-hand locking).\n\n" +
        "**The rule:** default to `synchronized` — it is simpler, safer and just as fast under low contention. Switch to `ReentrantLock` when you specifically need a timeout, interruptibility, fairness, multiple conditions, or non-block-structured locking. And consider whether you need a lock at all: an immutable object, a `ConcurrentHashMap` or an atomic is often the better answer.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.locks.*;

public class LockComparison {

    // synchronized: simple, auto-released, but no timeout and not interruptible.
    static class SyncAccount {
        private long balance;
        synchronized void deposit(long amount) { balance += amount; }
        synchronized long balance() { return balance; }
    }

    // ReentrantLock: timeout, interruptibility, fairness, conditions.
    static class LockAccount {
        private final ReentrantLock lock = new ReentrantLock();
        private long balance;

        void deposit(long amount) {
            lock.lock();
            try { balance += amount; }
            finally { lock.unlock(); }               // MUST be in finally
        }

        boolean transferWithTimeout(LockAccount to, long amount) throws InterruptedException {
            if (!lock.tryLock(200, TimeUnit.MILLISECONDS)) return false;   // no deadlock
            try {
                if (!to.lock.tryLock(200, TimeUnit.MILLISECONDS)) return false;
                try {
                    if (balance < amount) return false;
                    balance -= amount; to.balance += amount; return true;
                } finally { to.lock.unlock(); }
            } finally { lock.unlock(); }
        }
    }

    // Multiple Conditions: wake exactly the right waiters.
    static class BoundedBuffer<T> {
        private final Object[] items;
        private int head, tail, count;
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition notFull  = lock.newCondition();
        private final Condition notEmpty = lock.newCondition();

        BoundedBuffer(int capacity) { items = new Object[capacity]; }

        void put(T item) throws InterruptedException {
            lock.lock();
            try {
                while (count == items.length) notFull.await();      // always in a loop
                items[tail] = item; tail = (tail + 1) % items.length; count++;
                notEmpty.signal();                                  // wake ONE consumer
            } finally { lock.unlock(); }
        }

        @SuppressWarnings("unchecked")
        T take() throws InterruptedException {
            lock.lock();
            try {
                while (count == 0) notEmpty.await();
                T item = (T) items[head]; items[head] = null;
                head = (head + 1) % items.length; count--;
                notFull.signal();                                   // wake ONE producer
                return item;
            } finally { lock.unlock(); }
        }
    }

    public static void main(String[] args) throws Exception {
        BoundedBuffer<Integer> buffer = new BoundedBuffer<>(4);
        Thread producer = new Thread(() -> {
            try { for (int i = 0; i < 10; i++) buffer.put(i); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try { for (int i = 0; i < 10; i++) System.out.print(buffer.take() + " "); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start(); consumer.start();
        producer.join(); consumer.join();
        System.out.println();
    }
}`,
      codeLanguage: "java",
      explanation:
        "synchronized is simpler and auto-released; ReentrantLock buys tryLock timeouts, interruptibility, fairness and multiple Conditions.",
      followUps: [
        "How does tryLock with a timeout prevent deadlock?",
        "Why is fairness expensive?",
      ],
    },
    {
      id: "b085",
      question: "Explain wait/notify/notifyAll and why wait must always be called in a loop.",
      answer:
        "`wait`, `notify` and `notifyAll` are methods on `Object` — every object is a monitor and a **wait set**.\n\n" +
        "Mechanics:\n\n" +
        "- All three **must** be called while holding the object's monitor, otherwise `IllegalMonitorStateException`.\n" +
        "- `wait()` **atomically releases the monitor** and parks the thread in the wait set. This is the essential difference from `sleep()`, which keeps every lock it holds.\n" +
        "- `notify()` moves **one arbitrary** waiting thread to the entry set; `notifyAll()` moves all of them. Neither releases the monitor — the notifier continues until it exits the synchronized block.\n" +
        "- A woken thread must **re-acquire the monitor** before returning from `wait()`.\n\n" +
        "Why the loop — three independent reasons:\n\n" +
        "1. **Spurious wakeups.** The JLS explicitly permits `wait()` to return without any `notify`. It is rare but real, and the spec says you must tolerate it.\n" +
        "2. **Stolen wakeups.** Between the `notify` and the woken thread re-acquiring the lock, a *third* thread can grab the lock and consume the condition. The woken thread then proceeds on a false premise.\n" +
        "3. **`notifyAll` with multiple conditions.** If producers and consumers wait on the same monitor, a consumer may be woken by a signal meant for a producer.\n\n" +
        "So: **`while (!condition) wait();`** — never `if`.\n\n" +
        "`notify()` vs `notifyAll()`: `notify` is cheaper but only safe when **all waiters are interchangeable and wait for the same condition**; otherwise you can wake the wrong thread and hang the system (a 'missed signal'). Default to `notifyAll()` unless you have proven uniformity.\n\n" +
        "**Modern advice:** prefer `BlockingQueue`, `CountDownLatch`, `Semaphore`, `Phaser` or `Condition`. Raw `wait`/`notify` is still asked because it shows you understand monitors.",
      code: `import java.util.*;

public class WaitNotifyDemo {

    /** Classic bounded buffer using the intrinsic monitor. */
    static class SharedQueue<T> {
        private final Queue<T> items = new ArrayDeque<>();
        private final int capacity;
        SharedQueue(int capacity) { this.capacity = capacity; }

        public synchronized void put(T item) throws InterruptedException {
            while (items.size() == capacity) {       // WHILE, never IF
                wait();                              // releases the monitor
            }
            items.add(item);
            notifyAll();                             // producers AND consumers wait here
        }

        public synchronized T take() throws InterruptedException {
            while (items.isEmpty()) {
                wait();
            }
            T item = items.poll();
            notifyAll();
            return item;
        }
    }

    /** Why 'if' breaks: a stolen wakeup lets a consumer poll an empty queue. */
    static class BrokenQueue<T> {
        private final Queue<T> items = new ArrayDeque<>();
        public synchronized void put(T item) { items.add(item); notifyAll(); }
        public synchronized T take() throws InterruptedException {
            if (items.isEmpty()) wait();             // BUG: single check
            return items.poll();                     // may return null
        }
    }

    public static void main(String[] args) throws Exception {
        SharedQueue<Integer> q = new SharedQueue<>(3);

        Thread producer = new Thread(() -> {
            try { for (int i = 1; i <= 8; i++) { q.put(i); System.out.println("put " + i); } }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }, "producer");

        Runnable consume = () -> {
            try { for (int i = 0; i < 4; i++) System.out.println(
                    Thread.currentThread().getName() + " took " + q.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        };

        Thread c1 = new Thread(consume, "c1"), c2 = new Thread(consume, "c2");
        producer.start(); c1.start(); c2.start();
        producer.join(); c1.join(); c2.join();

        // IllegalMonitorStateException without the monitor:
        Object o = new Object();
        try { o.wait(); }
        catch (IllegalMonitorStateException e) { System.out.println("must hold the monitor"); }
        catch (InterruptedException ignored) { }
    }
}`,
      codeLanguage: "java",
      explanation:
        "wait releases the monitor and may return spuriously or after a stolen signal, so the condition must be re-checked in a while loop.",
      followUps: [
        "Construct a scenario where notify() instead of notifyAll() hangs the system.",
        "How would you rewrite this with a BlockingQueue?",
      ],
    },
    {
      id: "b086",
      question: "What is a deadlock? How do you detect it and how do you prevent it?",
      answer:
        "Deadlock is a cycle of threads each holding a resource the next one needs, so none can proceed. It requires **all four Coffman conditions** simultaneously:\n\n" +
        "1. **Mutual exclusion** — a resource is held exclusively.\n" +
        "2. **Hold and wait** — a thread holds one resource while requesting another.\n" +
        "3. **No preemption** — a resource cannot be forcibly taken away.\n" +
        "4. **Circular wait** — a cycle exists in the wait-for graph.\n\n" +
        "Break any one and deadlock becomes impossible.\n\n" +
        "Prevention, in order of practicality:\n\n" +
        "1. **Global lock ordering** — the most effective technique. Define a total order (for example, by `System.identityHashCode` or a business id) and always acquire in that order. This breaks circular wait.\n" +
        "2. **`tryLock` with a timeout** — acquire what you can, release everything and retry with backoff on failure. Breaks hold-and-wait.\n" +
        "3. **Reduce lock scope** — hold locks for the shortest possible time, and **never call foreign or blocking code while holding a lock** (no HTTP calls, no callbacks, no `synchronized` around IO).\n" +
        "4. **Use one lock** where contention is low, or no locks at all: immutable objects, `ConcurrentHashMap`, atomics, message passing.\n\n" +
        "Detection:\n\n" +
        "- **Thread dump** (`jstack <pid>`, `jcmd <pid> Thread.print`, or `kill -3`). The JVM prints an explicit `Found one Java-level deadlock:` section naming the threads and monitors.\n" +
        "- **Programmatically** with `ThreadMXBean.findDeadlockedThreads()` — worth wiring into a health check.\n" +
        "- VisualVM, JMC, or an APM agent.\n\n" +
        "Also distinguish the neighbours: **livelock** (threads keep responding to each other and make no progress), **starvation** (a thread never gets the resource, often from unfair locks or priority), and **lock convoy** (threads serialise behind a hot lock and throughput collapses).",
      code: `import java.lang.management.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

public class DeadlockDemo {

    static class Account {
        final int id; long balance;
        final ReentrantLock lock = new ReentrantLock();
        Account(int id, long balance) { this.id = id; this.balance = balance; }
    }

    /** BROKEN: two threads transferring in opposite directions deadlock. */
    static void unsafeTransfer(Account from, Account to, long amount) {
        synchronized (from) {
            synchronized (to) {                      // circular wait
                from.balance -= amount; to.balance += amount;
            }
        }
    }

    /** FIX 1 - global lock ordering breaks the cycle. */
    static void orderedTransfer(Account a, Account b, long amount) {
        Account first  = a.id < b.id ? a : b;
        Account second = a.id < b.id ? b : a;
        synchronized (first) {
            synchronized (second) {
                a.balance -= amount; b.balance += amount;
            }
        }
    }

    /** FIX 2 - tryLock with timeout + backoff breaks hold-and-wait. */
    static boolean tryTransfer(Account a, Account b, long amount) throws InterruptedException {
        while (true) {
            if (a.lock.tryLock(50, TimeUnit.MILLISECONDS)) {
                try {
                    if (b.lock.tryLock(50, TimeUnit.MILLISECONDS)) {
                        try { a.balance -= amount; b.balance += amount; return true; }
                        finally { b.lock.unlock(); }
                    }
                } finally { a.lock.unlock(); }
            }
            Thread.sleep(ThreadLocalRandom.current().nextInt(10, 50));  // random backoff
        }
    }

    /** Programmatic detection - wire this into a health indicator. */
    static void detect() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        long[] ids = mx.findDeadlockedThreads();
        if (ids != null) {
            for (ThreadInfo info : mx.getThreadInfo(ids, true, true)) {
                System.out.println("DEADLOCK: " + info.getThreadName()
                    + " blocked on " + info.getLockName()
                    + " owned by " + info.getLockOwnerName());
            }
        } else System.out.println("no deadlock");
    }

    public static void main(String[] args) throws Exception {
        Account a = new Account(1, 1000), b = new Account(2, 1000);
        Thread t1 = new Thread(() -> unsafeTransfer(a, b, 100));
        Thread t2 = new Thread(() -> unsafeTransfer(b, a, 100));
        t1.start(); t2.start();
        Thread.sleep(300);
        detect();                                    // prints the deadlock if it happened
        System.exit(0);                              // jstack <pid> shows it too
    }
}`,
      codeLanguage: "java",
      explanation:
        "Break one Coffman condition — global lock ordering or tryLock with backoff — and detect with jstack or ThreadMXBean.findDeadlockedThreads.",
      followUps: [
        "What is the difference between livelock and deadlock?",
        "Why is calling foreign code while holding a lock dangerous?",
      ],
    },
    {
      id: "b087",
      question: "How do atomic classes and CAS work, and when does LongAdder beat AtomicLong?",
      answer:
        "**CAS (compare-and-swap)** is a single hardware instruction (`LOCK CMPXCHG` on x86, LL/SC on ARM): 'if this memory location still holds the expected value, replace it with the new value, atomically; otherwise fail'. It is the foundation of all lock-free programming in Java, exposed through `Unsafe`/`VarHandle` and wrapped by `java.util.concurrent.atomic`.\n\n" +
        "The atomic classes:\n\n" +
        "- `AtomicInteger`, `AtomicLong`, `AtomicBoolean`, `AtomicReference<V>` — `get`, `set`, `compareAndSet`, `getAndIncrement`, `updateAndGet(fn)`, `accumulateAndGet(x, fn)`.\n" +
        "- `AtomicIntegerArray`/`AtomicLongArray`/`AtomicReferenceArray` — per-element atomicity.\n" +
        "- `AtomicStampedReference` / `AtomicMarkableReference` — the **ABA fix**.\n" +
        "- Field updaters and, since Java 9, `VarHandle` — the modern, supported low-level API.\n\n" +
        "How `incrementAndGet` works: read the current value, compute value+1, `compareAndSet`; if another thread changed it in between, the CAS fails and the loop retries. **Lock-free, not wait-free** — under heavy contention threads spin and burn CPU.\n\n" +
        "**The ABA problem:** a thread reads A, another changes it to B and back to A, the first thread's CAS succeeds even though the state changed underneath. It matters when the value is a reference to a mutable structure (classically a lock-free stack where a popped node is recycled). `AtomicStampedReference` attaches a version counter so A-with-stamp-1 does not match A-with-stamp-3.\n\n" +
        "**LongAdder / DoubleAdder (Java 8):** under high contention, `AtomicLong` becomes a single cache line that every core fights over — false sharing plus constant CAS failures. `LongAdder` keeps a **striped array of cells**, each thread hashing to its own cell, and `sum()` adds them up. Writes scale nearly linearly; the trade-off is that `sum()` is not an atomic snapshot and memory is higher.\n\n" +
        "**Rule:** hot counter with rare reads → `LongAdder`. Need an exact value on every read or CAS-based state transitions → `AtomicLong`/`AtomicReference`.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class AtomicsDemo {

    public static void main(String[] args) throws Exception {
        // CAS retry loop, written by hand - this is what incrementAndGet does.
        AtomicInteger counter = new AtomicInteger();
        int current, next;
        do { current = counter.get(); next = current + 1; }
        while (!counter.compareAndSet(current, next));

        // Higher-level functional forms.
        counter.updateAndGet(v -> v * 2);
        counter.accumulateAndGet(10, Integer::sum);

        // Lock-free state machine with AtomicReference.
        enum State { NEW, RUNNING, DONE }
        AtomicReference<State> state = new AtomicReference<>(State.NEW);
        boolean started = state.compareAndSet(State.NEW, State.RUNNING);   // true
        boolean again   = state.compareAndSet(State.NEW, State.RUNNING);   // false
        System.out.println(started + " " + again + " " + state.get());

        // ABA: the value is A again, so the CAS wrongly succeeds.
        AtomicReference<String> plain = new AtomicReference<>("A");
        plain.set("B"); plain.set("A");
        System.out.println(plain.compareAndSet("A", "C"));                 // true (!)

        AtomicStampedReference<String> stamped = new AtomicStampedReference<>("A", 0);
        int[] holder = new int[1];
        String seen = stamped.get(holder);
        int seenStamp = holder[0];
        stamped.compareAndSet("A", "B", 0, 1);
        stamped.compareAndSet("B", "A", 1, 2);                             // back to A
        System.out.println(stamped.compareAndSet(seen, "C", seenStamp, 3)); // false - ABA caught

        // Contention: AtomicLong vs LongAdder.
        int threads = 16, perThread = 500_000;
        AtomicLong atomic = new AtomicLong();
        LongAdder  adder  = new LongAdder();

        System.out.println("AtomicLong ms " + hammer(threads, perThread, atomic::incrementAndGet));
        System.out.println("LongAdder  ms " + hammer(threads, perThread, adder::increment));
        System.out.println(atomic.get() + " " + adder.sum());
    }

    static long hammer(int threads, int perThread, Runnable op) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1), done = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) pool.submit(() -> {
            try { start.await(); } catch (InterruptedException e) { return; }
            for (int i = 0; i < perThread; i++) op.run();
            done.countDown();
        });
        long t0 = System.nanoTime();
        start.countDown(); done.await(); pool.shutdown();
        return (System.nanoTime() - t0) / 1_000_000;
    }
}`,
      codeLanguage: "java",
      explanation:
        "CAS is a hardware primitive wrapped in a retry loop; LongAdder stripes across cells to avoid the single contended cache line.",
      followUps: [
        "Give a concrete scenario where ABA causes a real bug.",
        "Why is LongAdder.sum() not an atomic snapshot?",
      ],
    },
    {
      id: "b088",
      question: "How does thread interruption work, and what is the correct way to handle InterruptedException?",
      answer:
        "Interruption is **cooperative**. `Thread.interrupt()` does not stop anything; it sets a boolean flag and, if the thread is blocked in an interruptible operation, causes that operation to throw `InterruptedException`.\n\n" +
        "The API:\n\n" +
        "- `t.interrupt()` — set the flag on `t`.\n" +
        "- `Thread.currentThread().isInterrupted()` — read it **without** clearing.\n" +
        "- `Thread.interrupted()` — read **and clear**. The static one. Easy to misuse.\n" +
        "- Blocking methods that throw `InterruptedException` (`sleep`, `wait`, `join`, `BlockingQueue.take`, `Future.get`, `lock.lockInterruptibly`) **clear the flag when they throw**. That is the crucial detail.\n\n" +
        "The two correct responses:\n\n" +
        "1. **Propagate** — declare `throws InterruptedException` and let the caller decide. Best when you are library code.\n" +
        "2. **Restore the flag and return** — `catch (InterruptedException e) { Thread.currentThread().interrupt(); ... }`. Necessary when you cannot change the signature (for example, inside `Runnable.run`), so that code higher up the stack — such as a thread pool — can still see the cancellation.\n\n" +
        "**The cardinal sin** is swallowing it: `catch (InterruptedException e) { }` or logging and continuing. That destroys the only evidence of cancellation and makes shutdown hang.\n\n" +
        "Also know:\n\n" +
        "- **Blocking IO is not interruptible.** A `socket.read()` or a JDBC call ignores the flag entirely; only `InterruptibleChannel` responds (by closing the channel). The practical fix is a socket/query timeout, not interruption.\n" +
        "- `Thread.stop()`, `suspend()` and `resume()` are deprecated and unsafe — `stop()` threw an asynchronous exception anywhere, leaving objects in a broken state.\n" +
        "- `ExecutorService.shutdownNow()` interrupts running tasks; `Future.cancel(true)` interrupts a specific one. Neither works if your task never checks the flag.",
      code: `import java.util.concurrent.*;

public class InterruptionDemo {

    /** Correct: propagate. */
    static void libraryMethod() throws InterruptedException {
        Thread.sleep(100);
    }

    /** Correct: restore the flag when you cannot propagate. */
    static Runnable task() {
        return () -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    doChunkOfWork();
                    Thread.sleep(50);                 // clears the flag when it throws
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();   // RESTORE it
            } finally {
                System.out.println("cleaned up and exiting");
            }
        };
    }

    /** WRONG: swallowing the interrupt makes shutdown hang. */
    static Runnable brokenTask() {
        return () -> {
            while (true) {
                try { Thread.sleep(50); }
                catch (InterruptedException e) { /* swallowed - never stops */ }
            }
        };
    }

    static void doChunkOfWork() { }

    public static void main(String[] args) throws Exception {
        Thread good = new Thread(task(), "good");
        good.start();
        Thread.sleep(200);
        good.interrupt();
        good.join(1000);
        System.out.println("good finished: " + !good.isAlive());

        // Thread.interrupted() CLEARS; isInterrupted() does not.
        Thread probe = new Thread(() -> {
            Thread.currentThread().interrupt();
            System.out.println("isInterrupted  " + Thread.currentThread().isInterrupted()); // true
            System.out.println("interrupted()  " + Thread.interrupted());                   // true
            System.out.println("interrupted()  " + Thread.interrupted());                   // false
        });
        probe.start(); probe.join();

        // Cancelling a Future interrupts the worker if it cooperates.
        ExecutorService pool = Executors.newSingleThreadExecutor();
        Future<?> f = pool.submit(task());
        Thread.sleep(100);
        f.cancel(true);                               // true = interrupt if running
        pool.shutdown();
        System.out.println("terminated: " + pool.awaitTermination(2, TimeUnit.SECONDS));

        // Graceful pool shutdown idiom.
        ExecutorService svc = Executors.newFixedThreadPool(2);
        svc.shutdown();                               // stop accepting new tasks
        if (!svc.awaitTermination(5, TimeUnit.SECONDS)) {
            svc.shutdownNow();                        // interrupt the stragglers
            svc.awaitTermination(5, TimeUnit.SECONDS);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Interruption is a cooperative flag that blocking methods clear when they throw — propagate or restore it, never swallow it.",
      followUps: [
        "Why can't you interrupt a thread blocked in socket.read()?",
        "What is the standard two-phase executor shutdown idiom?",
      ],
    },
    {
      id: "b089",
      question: "What is ThreadLocal, what is it good for, and why does it leak?",
      answer:
        "`ThreadLocal<T>` gives **each thread its own independently initialised copy** of a variable. Internally each `Thread` holds a `ThreadLocalMap`, keyed by the `ThreadLocal` instance — so the storage lives on the thread, not on the `ThreadLocal` object.\n\n" +
        "Legitimate uses:\n\n" +
        "- Making a **non-thread-safe object** usable without synchronisation: the classic `SimpleDateFormat` (though `DateTimeFormatter` is immutable and needs no such trick).\n" +
        "- **Ambient context**: Spring's `SecurityContextHolder`, `RequestContextHolder` and `TransactionSynchronizationManager` are all `ThreadLocal`-based; SLF4J's MDC too.\n" +
        "- Per-thread scratch buffers or random generators (`ThreadLocalRandom`).\n\n" +
        "The memory leak — this is the real question:\n\n" +
        "- The `ThreadLocalMap` **key** is a `WeakReference` to the `ThreadLocal`, but the **value is a strong reference**.\n" +
        "- In a thread pool, threads live for the lifetime of the application. If you `set()` and never `remove()`, the value stays reachable from the thread forever.\n" +
        "- If that value is (or references) a classloader-loaded object, the whole **classloader cannot be collected** — this is the canonical cause of `OutOfMemoryError: Metaspace` after repeated redeploys in Tomcat.\n" +
        "- The map does opportunistic cleanup of stale entries, but only on subsequent `set`/`get` operations, so it is not a guarantee.\n\n" +
        "**The rule: always `remove()` in a `finally`.** In a servlet filter that means `try { chain.doFilter(...) } finally { holder.remove(); }`.\n\n" +
        "Two more traps: `InheritableThreadLocal` copies values to child threads at creation, which surprises people with pooled threads; and with **virtual threads** the `ThreadLocal` idiom scales badly (millions of threads × per-thread copies), which is exactly why Java introduced **`ScopedValue`** (preview) as an immutable, structured replacement.",
      code: `import jakarta.servlet.*;
import java.text.SimpleDateFormat;
import java.util.concurrent.*;

public class ThreadLocalDemo {

    // 1. Wrapping a non-thread-safe object.
    private static final ThreadLocal<SimpleDateFormat> FORMAT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
    // Better in modern Java: DateTimeFormatter is immutable and thread-safe.

    // 2. Ambient request context - the Spring pattern.
    static final class RequestContext {
        private static final ThreadLocal<String> TENANT = new ThreadLocal<>();
        static void set(String tenant) { TENANT.set(tenant); }
        static String get() { return TENANT.get(); }
        static void clear() { TENANT.remove(); }        // MUST be called
    }

    /** The correct filter shape: always clear in finally. */
    static class TenantFilter implements Filter {
        @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws java.io.IOException, ServletException {
            RequestContext.set(req.getParameter("tenant"));
            try {
                chain.doFilter(req, res);
            } finally {
                RequestContext.clear();                  // without this: leak + data bleed
            }
        }
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);

        // LEAK + CORRECTNESS BUG: pooled threads keep the value for the next task.
        for (int i = 0; i < 4; i++) {
            final int n = i;
            pool.submit(() -> {
                String previous = RequestContext.get();   // may be another tenant's value!
                RequestContext.set("tenant-" + n);
                System.out.println(Thread.currentThread().getName()
                    + " saw previous=" + previous);
                // no remove() -> leaked
            });
        }
        Thread.sleep(200);

        // Correct usage.
        pool.submit(() -> {
            RequestContext.set("tenant-safe");
            try { System.out.println("working for " + RequestContext.get()); }
            finally { RequestContext.clear(); }
        });

        pool.shutdown();
        pool.awaitTermination(2, TimeUnit.SECONDS);
        System.out.println(FORMAT.get().format(new java.util.Date()));

        // Java 21+ preview: ScopedValue is immutable and auto-unbinds.
        // ScopedValue.where(TENANT_SV, "acme").run(() -> handle());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Values are strongly held by long-lived pooled threads, so a missing remove() leaks memory and bleeds one request's context into the next.",
      followUps: [
        "How does a ThreadLocal leak cause an OutOfMemoryError in Metaspace?",
        "Why does ScopedValue suit virtual threads better?",
      ],
    },
    {
      id: "b090",
      question: "What is false sharing and how do you avoid it?",
      answer:
        "CPUs do not read individual bytes from memory; they read **cache lines**, typically 64 bytes. Cache coherence (MESI) operates at that granularity.\n\n" +
        "**False sharing** happens when two threads write to two *different* variables that happen to live in the **same cache line**. Logically there is no contention, but physically every write invalidates the other core's copy of the line, forcing a coherence round-trip. Throughput can drop by an order of magnitude — the classic demonstration is two `long` counters in adjacent array slots being 5–10x slower than two counters padded apart.\n\n" +
        "Where it shows up:\n\n" +
        "- Adjacent fields in a hot object written by different threads.\n" +
        "- Adjacent elements of an array updated per-thread (`long[] counters` indexed by thread id).\n" +
        "- Head and tail pointers of a queue, updated by producer and consumer respectively.\n\n" +
        "Fixes:\n\n" +
        "1. **`@Contended`** (`jdk.internal.vm.annotation.Contended`, needs `-XX:-RestrictContended`) — the JVM inserts padding automatically. This is what `LongAdder.Cell`, `ConcurrentHashMap.CounterCell` and `ForkJoinPool` use internally.\n" +
        "2. **Manual padding** — add dummy `long` fields (or subclass with padding fields) so each hot variable occupies its own line. Fragile, because the JIT can reorder or eliminate unused fields.\n" +
        "3. **Index striding** — index a shared array as `i * 8` so per-thread slots land on different lines.\n" +
        "4. **Avoid sharing entirely** — thread-local accumulation followed by a single merge. This is exactly `LongAdder`'s design and usually the best answer.\n\n" +
        "**How you would prove it:** measure with JMH, and look at `perf stat` cache-miss counters or `perf c2c`. Saying 'I would measure before padding' is the senior answer — padding on a cold path just wastes memory.",
      code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

public class FalseSharingDemo {

    /** Two counters in ONE cache line - they fight even though they are separate. */
    static final class Shared {
        volatile long a;
        volatile long b;                       // same 64-byte line as 'a'
    }

    /** Padded: 7 dummy longs push 'b' onto its own cache line. */
    static final class Padded {
        volatile long a;
        long p1, p2, p3, p4, p5, p6, p7;       // 56 bytes of padding
        volatile long b;
    }

    public static void main(String[] args) throws Exception {
        long iterations = 50_000_000L;

        Shared shared = new Shared();
        System.out.println("false sharing  ms " + race(
            () -> { for (long i = 0; i < iterations; i++) shared.a++; },
            () -> { for (long i = 0; i < iterations; i++) shared.b++; }));

        Padded padded = new Padded();
        System.out.println("padded         ms " + race(
            () -> { for (long i = 0; i < iterations; i++) padded.a++; },
            () -> { for (long i = 0; i < iterations; i++) padded.b++; }));

        // Array striding: 8 longs apart = one cache line apart.
        long[] dense  = new long[2];
        long[] strided = new long[16];
        System.out.println("dense array    ms " + race(
            () -> { for (long i = 0; i < iterations; i++) dense[0]++; },
            () -> { for (long i = 0; i < iterations; i++) dense[1]++; }));
        System.out.println("strided array  ms " + race(
            () -> { for (long i = 0; i < iterations; i++) strided[0]++; },
            () -> { for (long i = 0; i < iterations; i++) strided[8]++; }));

        // The idiomatic fix: do not share at all. LongAdder stripes internally
        // and its Cell class is annotated @Contended.
        LongAdder adder = new LongAdder();
        System.out.println("LongAdder      ms " + race(
            () -> { for (long i = 0; i < iterations; i++) adder.increment(); },
            () -> { for (long i = 0; i < iterations; i++) adder.increment(); }));
        System.out.println("total " + adder.sum());
    }

    static long race(Runnable r1, Runnable r2) throws Exception {
        Thread t1 = new Thread(r1), t2 = new Thread(r2);
        long t0 = System.nanoTime();
        t1.start(); t2.start(); t1.join(); t2.join();
        return (System.nanoTime() - t0) / 1_000_000;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Independent variables sharing a 64-byte cache line cause coherence traffic; pad, stride, or stop sharing (LongAdder) — after measuring.",
      followUps: [
        "Which JDK classes use @Contended internally?",
        "How would you prove false sharing with perf or JMH?",
      ],
    },
    {
      id: "b091",
      question: "Explain the concurrency utilities: CountDownLatch, CyclicBarrier, Semaphore, Phaser, Exchanger.",
      answer:
        "All of these are built on `AbstractQueuedSynchronizer`, and each solves a distinct coordination shape.\n\n" +
        "CountDownLatch — a **one-shot gate**.\n\n" +
        "- Constructed with a count; `countDown()` decrements; `await()` blocks until it reaches zero.\n" +
        "- **Cannot be reset.** Once open, always open.\n" +
        "- Two shapes: *start gate* (count 1, everyone awaits, one release) and *completion gate* (count N, main awaits N workers).\n\n" +
        "CyclicBarrier — a **reusable rendezvous**.\n\n" +
        "- N parties call `await()`; when the Nth arrives, they all proceed and the barrier **resets**.\n" +
        "- Supports an optional **barrier action** that runs once per cycle on the last arriving thread.\n" +
        "- If any party leaves or is interrupted the barrier is **broken** and everyone gets `BrokenBarrierException`.\n" +
        "- Use for iterative parallel algorithms: simulation steps, matrix passes.\n\n" +
        "Semaphore — a **permit counter**, i.e. bounded concurrency.\n\n" +
        "- `acquire()`/`release()`, `tryAcquire(timeout)`, multiple permits at once, optional fairness.\n" +
        "- Use to limit concurrent access to a scarce resource: 10 concurrent calls to a fragile downstream service, a connection pool, a rate limiter.\n" +
        "- A binary semaphore is *not* a lock: any thread may release it, and it is not reentrant.\n\n" +
        "Phaser — a **flexible, reusable barrier** where parties can register and deregister dynamically, with multiple phases and `arriveAndAwaitAdvance`. Use it when the number of participants changes over time.\n\n" +
        "Exchanger — a **two-party rendezvous** that swaps objects. Niche: buffer-swapping pipelines.\n\n" +
        "**The differentiator to state:** CountDownLatch counts *events* and is one-shot; CyclicBarrier counts *threads* and recycles.",
      code: `import java.util.concurrent.*;

public class CoordinationUtilities {
    public static void main(String[] args) throws Exception {

        // 1. CountDownLatch - start gate + completion gate.
        int workers = 4;
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate  = new CountDownLatch(workers);
        ExecutorService pool = Executors.newFixedThreadPool(workers);
        for (int i = 0; i < workers; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    startGate.await();                 // all block until released together
                    Thread.sleep(50 * id);
                    System.out.println("worker " + id + " done");
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                finally { doneGate.countDown(); }
            });
        }
        startGate.countDown();                          // fire the starting pistol
        doneGate.await();                               // wait for all four
        System.out.println("all workers finished\\n");

        // 2. CyclicBarrier - reusable, with a barrier action per phase.
        int parties = 3;
        CyclicBarrier barrier = new CyclicBarrier(parties,
            () -> System.out.println("-- phase complete --"));
        for (int i = 0; i < parties; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    for (int phase = 0; phase < 2; phase++) {
                        Thread.sleep(20 * id);
                        System.out.println("thread " + id + " finished phase " + phase);
                        barrier.await();                // rendezvous, then reset
                    }
                } catch (Exception e) { Thread.currentThread().interrupt(); }
            });
        }
        Thread.sleep(500);

        // 3. Semaphore - bound concurrency against a fragile dependency.
        Semaphore permits = new Semaphore(2, true);     // at most 2 concurrent calls
        for (int i = 0; i < 6; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    if (!permits.tryAcquire(1, TimeUnit.SECONDS)) {
                        System.out.println("call " + id + " shed (no permit)"); return;
                    }
                    try { Thread.sleep(100); System.out.println("call " + id + " ran"); }
                    finally { permits.release(); }
                } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            });
        }
        Thread.sleep(700);

        // 4. Phaser - dynamic registration, multiple phases.
        Phaser phaser = new Phaser(1);                  // 'main' registers itself
        for (int i = 0; i < 3; i++) {
            phaser.register();
            final int id = i;
            pool.submit(() -> {
                System.out.println("phaser worker " + id + " phase " + phaser.getPhase());
                phaser.arriveAndDeregister();
            });
        }
        phaser.arriveAndAwaitAdvance();

        pool.shutdown();
        pool.awaitTermination(3, TimeUnit.SECONDS);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Latch counts events once; barrier counts threads and recycles; semaphore bounds concurrency; phaser is a dynamic barrier.",
      followUps: [
        "When would a CyclicBarrier become 'broken'?",
        "Why is a binary semaphore not a substitute for a lock?",
      ],
    },
    {
      id: "b092",
      question: "How do you make a class thread-safe? Give me the strategies in order of preference.",
      answer:
        "In order from best to last resort:\n\n" +
        "1. **Don't share state.** Stateless objects are automatically thread-safe — a Spring `@Service` with only final dependencies and no mutable fields needs no synchronisation at all. Confine state to a thread (`ThreadLocal`, a local variable) or to a single owner.\n\n" +
        "2. **Immutability.** An object whose fields are all `final` and whose referenced objects are themselves immutable cannot be observed in an inconsistent state. The JMM gives you free safe publication for final fields. Records, `String`, `LocalDate`, `List.of(...)` are the model. Defensively copy any mutable input and output.\n\n" +
        "3. **Delegate to a thread-safe component.** `ConcurrentHashMap`, `AtomicLong`, `BlockingQueue`, `CopyOnWriteArrayList`. Your class becomes thread-safe by composition without writing a single `synchronized`.\n\n" +
        "4. **Confinement with a single lock.** If you must have mutable state, guard **all** of it — reads included — with one private lock object (`private final Object lock = new Object()`, never `synchronized(this)` and never a `String` or boxed literal, because external code can lock on those).\n\n" +
        "5. **Fine-grained locking** — lock striping, `ReadWriteLock`, `StampedLock`. Only once you have measured contention, because it multiplies the deadlock risk.\n\n" +
        "Documentation matters: annotate with `@ThreadSafe`/`@NotThreadSafe`/`@GuardedBy(\"lock\")` (JCIP annotations) and state the policy in Javadoc. 'Thread safety is a property you design and document, not one you hope for.'\n\n" +
        "Classic pitfalls to name: publishing `this` from a constructor; a non-final field that is lazily initialised without volatile; check-then-act on a thread-safe collection; and holding a lock while calling foreign code.",
      code: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public class ThreadSafetyStrategies {

    // 1. STATELESS - inherently thread-safe.
    static final class PriceCalculator {
        long total(long unitPrice, int qty) { return unitPrice * qty; }
    }

    // 2. IMMUTABLE - final fields, defensive copies, safe publication for free.
    static final class Money {
        private final long amount;
        private final String currency;
        private final List<String> tags;                    // defensively copied

        Money(long amount, String currency, List<String> tags) {
            this.amount = amount; this.currency = currency;
            this.tags = List.copyOf(tags);                  // no aliasing in
        }
        Money plus(long delta) { return new Money(amount + delta, currency, tags); }
        List<String> tags() { return tags; }                // already immutable out
    }

    // 3. DELEGATION - thread-safe by composition, zero synchronized.
    static final class Metrics {
        private final ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();
        void increment(String name) {
            counters.computeIfAbsent(name, k -> new AtomicLong()).incrementAndGet();
        }
        long get(String name) {
            AtomicLong c = counters.get(name);
            return c == null ? 0 : c.get();
        }
    }

    // 4. ONE PRIVATE LOCK guarding ALL mutable state, reads included.
    static final class Inventory {
        private final Object lock = new Object();           // never 'this', never a String
        // @GuardedBy("lock")
        private final Map<String, Integer> stock = new HashMap<>();
        // @GuardedBy("lock")
        private int totalUnits;

        void add(String sku, int qty) {
            synchronized (lock) {
                stock.merge(sku, qty, Integer::sum);
                totalUnits += qty;                          // the invariant needs one lock
            }
        }
        boolean reserve(String sku, int qty) {
            synchronized (lock) {                            // check-then-act atomically
                Integer available = stock.get(sku);
                if (available == null || available < qty) return false;
                stock.put(sku, available - qty);
                totalUnits -= qty;
                return true;
            }
        }
        int totalUnits() { synchronized (lock) { return totalUnits; } }  // reads too!
    }

    // 5. READ-WRITE LOCK - only after measuring read-heavy contention.
    static final class Config {
        private final java.util.concurrent.locks.ReadWriteLock rw =
            new java.util.concurrent.locks.ReentrantReadWriteLock();
        private Map<String, String> settings = Map.of();

        String get(String key) {
            rw.readLock().lock();
            try { return settings.get(key); } finally { rw.readLock().unlock(); }
        }
        void reload(Map<String, String> fresh) {
            rw.writeLock().lock();
            try { settings = Map.copyOf(fresh); } finally { rw.writeLock().unlock(); }
        }
    }

    public static void main(String[] args) {
        Inventory inv = new Inventory();
        inv.add("sku-1", 10);
        System.out.println(inv.reserve("sku-1", 4) + " " + inv.totalUnits());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Prefer statelessness, then immutability, then delegation to concurrent types; a private lock guarding all state is the fallback, fine-grained locking last.",
      followUps: [
        "Why is synchronized(this) risky in a public class?",
        "What does @GuardedBy buy you if it is not enforced?",
      ],
    },
    {
      id: "b093",
      question: "What is the difference between ReadWriteLock and StampedLock?",
      answer:
        "ReentrantReadWriteLock:\n\n" +
        "- Two views: many concurrent readers **or** one writer.\n" +
        "- **Reentrant**, supports `Condition` on the write lock, and supports **downgrading** (hold the write lock, acquire the read lock, release the write lock) but **not upgrading** (read → write deadlocks).\n" +
        "- Optional fairness; in non-fair mode writers can starve under a constant stream of readers.\n" +
        "- The catch: even a read lock is a **write to shared state** (the AQS counter), so with many cores and short critical sections read locks themselves become a contention point. For very short reads it can be *slower* than plain `synchronized`.\n\n" +
        "StampedLock (Java 8):\n\n" +
        "- Not reentrant, no `Condition` support, and **not** a `Lock` implementation.\n" +
        "- Every acquire returns a `long` **stamp** that you must pass to the matching unlock — forgetting it or reusing a stale stamp is a bug the compiler cannot catch.\n" +
        "- Three modes: `writeLock()`, `readLock()`, and the important one, **`tryOptimisticRead()`**.\n" +
        "- **Optimistic reading** takes no lock at all: read the stamp, read the fields, then call `validate(stamp)`. If no write occurred in between, the read was free — zero contention, zero cache-line writes. If validation fails, fall back to a real read lock.\n" +
        "- Supports `tryConvertToWriteLock` for upgrade attempts.\n\n" +
        "**When to use which:** `ReentrantReadWriteLock` for long read sections where reentrancy or conditions matter. `StampedLock` for very short, read-dominated critical sections over a few fields — the canonical example in the Javadoc is a 2D point.\n\n" +
        "**The caveat to volunteer:** StampedLock is easy to get wrong. The optimistic read must copy fields into locals *before* validating, must not dereference potentially inconsistent state, and must never be used reentrantly. Measure before adopting it.",
      code: `import java.util.concurrent.locks.*;

public class LockVariants {

    /** ReadWriteLock: reentrant, supports downgrade, good for longer reads. */
    static class CachedConfig {
        private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
        private java.util.Map<String, String> data = java.util.Map.of();
        private volatile boolean stale = true;

        String get(String key) {
            rw.readLock().lock();
            try {
                if (!stale) return data.get(key);
            } finally { rw.readLock().unlock(); }

            rw.writeLock().lock();                       // upgrade is NOT allowed:
            try {                                        // release read first, then write
                if (stale) { data = load(); stale = false; }
                rw.readLock().lock();                    // DOWNGRADE: acquire read...
            } finally { rw.writeLock().unlock(); }       // ...then drop write
            try { return data.get(key); } finally { rw.readLock().unlock(); }
        }
        private java.util.Map<String, String> load() { return java.util.Map.of("k", "v"); }
    }

    /** StampedLock: optimistic reads cost nothing when there is no writer. */
    static class Point {
        private final StampedLock sl = new StampedLock();
        private double x, y;

        void move(double dx, double dy) {
            long stamp = sl.writeLock();
            try { x += dx; y += dy; } finally { sl.unlockWrite(stamp); }
        }

        double distanceFromOrigin() {
            long stamp = sl.tryOptimisticRead();          // NO lock acquired
            double cx = x, cy = y;                        // copy to locals FIRST
            if (!sl.validate(stamp)) {                    // a writer intervened?
                stamp = sl.readLock();                    // fall back to a real read lock
                try { cx = x; cy = y; } finally { sl.unlockRead(stamp); }
            }
            return Math.sqrt(cx * cx + cy * cy);
        }

        void moveIfAtOrigin(double nx, double ny) {
            long stamp = sl.readLock();
            try {
                while (x == 0.0 && y == 0.0) {
                    long ws = sl.tryConvertToWriteLock(stamp);   // attempt upgrade
                    if (ws != 0L) { stamp = ws; x = nx; y = ny; break; }
                    sl.unlockRead(stamp);
                    stamp = sl.writeLock();                       // or take it outright
                }
            } finally { sl.unlock(stamp); }
        }
    }

    public static void main(String[] args) {
        Point p = new Point();
        p.move(3, 4);
        System.out.println(p.distanceFromOrigin());       // 5.0
        // StampedLock is NOT reentrant: calling move() inside move() self-deadlocks.
    }
}`,
      codeLanguage: "java",
      explanation:
        "RWLock is reentrant with conditions; StampedLock trades those away for optimistic reads that take no lock and touch no shared counter.",
      followUps: [
        "Why does upgrading a read lock to a write lock deadlock?",
        "What must you never do between tryOptimisticRead and validate?",
      ],
    },
    {
      id: "b094",
      question: "How do you debug a concurrency problem in production?",
      answer:
        "A structured, tool-driven answer beats guesswork.\n\n" +
        "1. Classify the symptom:\n\n" +
        "- **Hang / no progress** → deadlock, livelock, or a thread pool starved by blocked tasks.\n" +
        "- **Wrong data** → a race condition or a visibility problem.\n" +
        "- **High CPU with no throughput** → spin loops, livelock, or CAS contention.\n" +
        "- **Gradual slowdown** → a leak, a lock convoy, or an unbounded queue.\n\n" +
        "2. Take thread dumps — **three of them, ten seconds apart**.\n\n" +
        "- `jcmd <pid> Thread.print` or `jstack -l <pid>`.\n" +
        "- The JVM explicitly reports `Found one Java-level deadlock`.\n" +
        "- Compare the three: threads stuck at the same stack frame across all three are genuinely blocked, not just slow.\n" +
        "- Count states: lots of BLOCKED on one monitor = contention; lots of WAITING on a pool queue = upstream starvation; all pool threads in a JDBC call = pool exhaustion.\n\n" +
        "3. Use the right tool for the symptom:\n\n" +
        "- **JFR** (`jcmd <pid> JFR.start settings=profile`) — low overhead in production; gives Java Monitor Blocked events, Thread Park events and allocation profiles.\n" +
        "- **async-profiler** in wall-clock mode for off-CPU time; lock mode for contention.\n" +
        "- `ThreadMXBean.findDeadlockedThreads()` wired into a health check.\n" +
        "- Micrometer: pool queue depth, active threads, `hikaricp.connections.pending`.\n\n" +
        "4. Find races that dumps cannot show:\n\n" +
        "- **Code review against a checklist**: is every field of shared mutable state guarded by the same lock? Is every lazily initialised field volatile? Any check-then-act?\n" +
        "- **jcstress** for JMM-level tests; **Lincheck** for linearisability; stress tests with more threads than cores; chaos-style random delays to widen windows.\n\n" +
        "5. Prevent recurrence: bound every pool and queue, set timeouts everywhere, use immutable data, prefer `java.util.concurrent` over hand-rolled locking, and add a metric for whatever bit you this time.",
      code: `import java.lang.management.*;
import java.util.concurrent.*;
import java.util.*;

public class ConcurrencyDiagnostics {

    /** Wire this into an Actuator HealthIndicator. */
    static Optional<String> detectDeadlock() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        long[] ids = mx.findDeadlockedThreads();
        if (ids == null) return Optional.empty();
        StringBuilder sb = new StringBuilder("DEADLOCK\\n");
        for (ThreadInfo t : mx.getThreadInfo(ids, true, true)) {
            sb.append(t.getThreadName()).append(" blocked on ").append(t.getLockName())
              .append(" owned by ").append(t.getLockOwnerName()).append('\\n');
            for (StackTraceElement e : t.getStackTrace()) sb.append("    ").append(e).append('\\n');
        }
        return Optional.of(sb.toString());
    }

    /** Snapshot of thread states - the same summary you get from three jstacks. */
    static Map<Thread.State, Long> stateHistogram() {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();
        Map<Thread.State, Long> histogram = new EnumMap<>(Thread.State.class);
        for (ThreadInfo t : mx.getThreadInfo(mx.getAllThreadIds(), 0)) {
            if (t != null) histogram.merge(t.getThreadState(), 1L, Long::sum);
        }
        return histogram;
    }

    /** Expose pool health as metrics - queue depth is the early warning. */
    static String poolHealth(ThreadPoolExecutor pool) {
        return String.format("active=%d/%d queue=%d completed=%d rejected-risk=%s",
            pool.getActiveCount(), pool.getMaximumPoolSize(),
            pool.getQueue().size(), pool.getCompletedTaskCount(),
            pool.getQueue().remainingCapacity() == 0 ? "YES" : "no");
    }

    public static void main(String[] args) throws Exception {
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
            2, 2, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(4),
            new ThreadPoolExecutor.AbortPolicy());

        for (int i = 0; i < 6; i++) pool.submit(() -> {
            try { Thread.sleep(500); } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        System.out.println(poolHealth(pool));
        System.out.println(stateHistogram());
        System.out.println(detectDeadlock().orElse("no deadlock"));

        pool.shutdown();
        pool.awaitTermination(3, TimeUnit.SECONDS);

        // Production commands:
        //   jcmd <pid> Thread.print                       three times, 10s apart
        //   jcmd <pid> JFR.start settings=profile duration=60s filename=app.jfr
        //   jcmd <pid> GC.heap_info
        //   async-profiler: ./profiler.sh -e lock -d 30 <pid>
    }
}`,
      codeLanguage: "java",
      explanation:
        "Classify the symptom, take three thread dumps, use JFR or async-profiler for contention, and use jcstress or review for races dumps cannot show.",
      followUps: [
        "What does a dump with every pool thread inside a JDBC call tell you?",
        "Why take three dumps rather than one?",
      ],
    },
  ],
  meta: {
    b081: { difficulty: "easy", priority: "very-high", tags: ["thread", "lifecycle", "states"], readMinutes: 4 },
    b082: { difficulty: "hard", priority: "very-high", tags: ["jmm", "happens-before", "visibility"], readMinutes: 6 },
    b083: { difficulty: "medium", priority: "very-high", tags: ["volatile", "visibility", "atomicity"], readMinutes: 5 },
    b084: { difficulty: "medium", priority: "very-high", tags: ["synchronized", "reentrantlock", "locking"], readMinutes: 5 },
    b085: { difficulty: "medium", priority: "very-high", tags: ["wait-notify", "monitor", "spurious-wakeup"], readMinutes: 5 },
    b086: { difficulty: "hard", priority: "very-high", tags: ["deadlock", "lock-ordering", "detection"], readMinutes: 5 },
    b087: { difficulty: "hard", priority: "high", tags: ["cas", "atomic", "longadder"], readMinutes: 5 },
    b088: { difficulty: "medium", priority: "high", tags: ["interrupt", "cancellation", "shutdown"], readMinutes: 5 },
    b089: { difficulty: "medium", priority: "high", tags: ["threadlocal", "memory-leak", "context"], readMinutes: 5 },
    b090: { difficulty: "hard", priority: "medium", tags: ["false-sharing", "cache-line", "performance"], readMinutes: 4 },
    b091: { difficulty: "medium", priority: "high", tags: ["latch", "barrier", "semaphore"], readMinutes: 5 },
    b092: { difficulty: "medium", priority: "very-high", tags: ["thread-safety", "immutability", "design"], readMinutes: 5 },
    b093: { difficulty: "hard", priority: "medium", tags: ["readwritelock", "stampedlock", "optimistic"], readMinutes: 4 },
    b094: { difficulty: "hard", priority: "high", tags: ["debugging", "thread-dump", "jfr"], readMinutes: 5 },
  },
});
