import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Advanced Collections - global questions 167-177.
 * Topic focus: concurrent collections, CAS, locks, fail-fast vs fail-safe
 * iteration, capacity/load factor, atomic operations, BlockingQueue.
 */
export const chunk17AdvancedCollections = defineChunk({
  topic: "advanced-collections",
  questions: [
    {
      id: "q167",
      question: "What is the difference between synchronized and concurrent collections in Java?",
      answer:
        "`java.util` ships two flavours of thread-safe collection. The legacy pattern is `java.util.Collections.synchronizedX` wrappers (`synchronizedList`, `synchronizedMap`, `synchronizedSet`) which hand back a view of an existing mutable collection guarded by a single intrinsic lock on the wrapper. Every read and write acquires that mutex, so contention serialises: throughput collapses as thread count climbs, and the same lock protects iteration, which means **iteration must be wrapped in user code** (`synchronized (list)`) or it will see torn state.\n\nThis coarse design has three well-known penalties:\n\n- **Single global mutex**: writers block readers and vice versa, even when operations touch different buckets or indices.\n- **External locking for iteration**: the Javadoc states the caller must wrap a `for (T t : list)` with `synchronized (list)` or risk a non-deterministic `ConcurrentModificationException`.\n- **No compound atomicity**: a `check-then-act` sequence like `if (!map.containsKey(k)) map.put(k, v)` is two separate locked operations and therefore not atomic; another thread can slip in between the check and the put.\n\nConcurrent collections (in `java.util.concurrent`) are a **redesign**, not a wrapper. They use finer-grained locks, lock-free reads, or copy-on-write, so unrelated operations do not block each other. Reading from `ConcurrentHashMap` is essentially wait-free, writes are lock-striped across the table, and bulk operations such as `compute`, `computeIfAbsent` and `merge` are atomic by design.\n\n**Practical guidance**: prefer `ConcurrentHashMap` over `Collections.synchronizedMap`, `CopyOnWriteArrayList` over `synchronizedList` for read-mostly data, `ConcurrentLinkedQueue` for non-blocking FIFO work, and a `BlockingQueue` when producers must actually wait. Synchronised wrappers remain acceptable only on small collections touched by a handful of threads where simplicity beats scalability.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class SyncVsConcurrent {
    public static void main(String[] args) throws InterruptedException {
        // Legacy: one lock for everything, including iteration
        List<Integer> sync = Collections.synchronizedList(new ArrayList<>());
        Thread t1 = new Thread(() -> { for (int i = 0; i < 1000; i++) sync.add(i); });
        Thread t2 = new Thread(() -> { for (int i = 0; i < 1000; i++) sync.add(i); });
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println("synchronized size = " + sync.size());

        // Iteration on a synchronizedList is NOT thread-safe by itself
        synchronized (sync) {
            for (Integer i : sync) { if (i == 1) break; }
        }

        // Modern: striped locks, atomic compound ops, no global lock
        Map<String, Integer> map = new ConcurrentHashMap<>();
        map.putIfAbsent("a", 1);     // atomic check-then-act
        map.merge("a", 1, Integer::sum); // atomic read-modify-write
        System.out.println("concurrent map = " + map); // {a=2}
    }
}`,
      codeLanguage: "java",
      explanation:
        "Interviewers want the lock granularity story: synchronized wraps with one mutex, while concurrent collections use striped, lock-free or copy-on-write designs for real scalability.",
    },
    {
      id: "q168",
      question: "Explain about the new concurrent collections in Java?",
      answer:
        "Java 5 introduced `java.util.concurrent`, a package built from scratch for multi-threaded code. It added two families: **non-blocking** collections that scale by removing the global mutex, and **blocking** queues that turn producer/consumer into a single method. The whole package was designed by Doug Lea and replaces the older `Hashtable`, `Vector` and `synchronizedX` wrappers for serious work.\n\nThe Map family has `ConcurrentHashMap`, the workhorse replacement for `Hashtable`, using lock striping and, on modern JDKs, CAS on the per-bin head. Reads use `volatile` reads and never block, and the `compute` family runs the remapping function atomically. `ConcurrentSkipListMap` is the sorted alternative, a lock-free skip list: pick it when you need `firstKey`, `tailMap` or a navigable view.\n\nThe Queue family separates two concerns. `ConcurrentLinkedQueue` and `ConcurrentLinkedDeque` are non-blocking FIFO/LIFO collections; their internal `Node` writes use CAS, so producers and consumers never sit on each other. `ArrayBlockingQueue`, `LinkedBlockingQueue`, `PriorityBlockingQueue`, `SynchronousQueue` and `DelayQueue` are the blocking variants: `put` blocks when full, `take` blocks when empty, which makes them the natural abstraction for thread pools.\n\nThe List/Set bracket is filled by **copy-on-write** classes: `CopyOnWriteArrayList` and `CopyOnWriteArraySet`. They satisfy the missing combination of thread-safety and iterator stability. A final member, `ConcurrentSkipListSet`, is the sorted-concurrent Set. Mental model: **pick the failure mode you can live with and the data structure that ships it** — atomic iteration, blocking, non-blocking, sorted or unsorted.",
      code: `import java.util.concurrent.*;

public class ConcurrentFamilies {
    public static void main(String[] args) {
        // Lock-striped map: reads never block, mutations atomic
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        map.merge("hits", 1, Integer::sum);
        System.out.println("map = " + map);

        // Sorted, lock-free skip list with navigable views
        ConcurrentSkipListMap<Integer, String> sorted = new ConcurrentSkipListMap<>();
        sorted.put(3, "three"); sorted.put(1, "one"); sorted.put(2, "two");
        System.out.println("first key = " + sorted.firstKey());

        // Non-blocking FIFO; offer is wait-free
        ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();
        queue.offer("a"); queue.offer("b");
        System.out.println("drained = " + queue.poll());

        // Blocking: classic producer/consumer primitive, put blocks when full
        BlockingQueue<String> pool = new ArrayBlockingQueue<>(2);
        pool.offer("task-1"); pool.offer("task-2");
        System.out.println("pool remaining = " + pool.remainingCapacity());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name the Map, Queue, Deque, List, Set and blocking-queue families, and pick the right failure mode (non-blocking vs blocking, sorted vs not) for the workload.",
    },
    {
      id: "q169",
      question: "Explain about copyonwrite concurrent collections approach?",
      answer:
        "Copy-on-write is a publish-by-replacement strategy used by `CopyOnWriteArrayList` and `CopyOnWriteArraySet`. Every **mutating** operation allocates a fresh copy of the underlying array, writes the change into the copy, then atomically publishes a reference to the new array. Because the publication is a single volatile write, **readers always see a consistent snapshot** and are guaranteed never to throw `ConcurrentModificationException`, even if another thread mutates the collection at the same time.\n\nThe pattern is essentially read-write locking for free, but only if **writes are rare**. A typical call site is a list of event listeners, an in-memory routing table, or a feature-flag set consulted on every request. Once published, the same array is shared between hundreds of thread contexts without a single lock acquisition. Point-in-time `size()` is also O(1) on every snapshot without coordination.\n\nThe cost picture is severe, however:\n\n- **Per-write allocation**: `add` copies the entire backing array — `O(n)` time and memory.\n- **GC pressure**: frequent writes churn large short-lived arrays.\n- **No true mutation**: old snapshots linger until every iterator is done with them.\n\nThe non-mutating design also means `iterator.remove()` always throws `UnsupportedOperationException`; deleting an element has to go through the list itself, not its iterator.\n\n**Use it only when reads dominate by orders of magnitude.** A reactive library installing a listener may fire on every event; thread-safety comes with a single static snapshot of handlers and almost zero overhead. For anything else, prefer `ConcurrentLinkedQueue` or a `ConcurrentHashMap`.",
      code: `import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

public class CowExample {
    public static void main(String[] args) {
        // Mutable-once, read-many list: typical listener / flag use case
        CopyOnWriteArrayList<String> listeners = new CopyOnWriteArrayList<>();
        listeners.addIfAbsent("audit");
        listeners.addIfAbsent("metrics");

        // Iterators see the snapshot at creation time — CME is impossible.
        for (String l : listeners) {
            listeners.add("new-listener"); // concurrent mutation never throws
            System.out.println("saw: " + l);
        }

        // Iterator.remove is NOT supported by design; use the list itself.
        try {
            listeners.iterator().remove();
        } catch (UnsupportedOperationException ex) {
            System.out.println("iterator.remove rejected: " + ex.getClass().getSimpleName());
        }
        listeners.remove("new-listener"); // legal
        System.out.println("final size = " + listeners.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Copy-on-write publishes a new array on every write; readers iterate a stable snapshot with zero locking — ideal for read-mostly data like listener lists.",
    },
    {
      id: "q170",
      question: "What is compareandswap approach?",
      answer:
        "`synchronized` blocks threads when they cannot acquire a lock, and under low contention that is wasteful. Java 5 introduced `java.util.concurrent.atomic`, a family of lock-free classes (`AtomicInteger`, `AtomicLong`, `AtomicBoolean`, `AtomicReference`, plus field updaters) whose operations are powered by a single CPU primitive: **compare-and-swap**.\n\nCAS replaces the classic read-modify-write race. In one atomic instruction the CPU does: read memory location V, compare it to the expected value A, and if they match write the new value B; otherwise do nothing. The hardware guarantees no half-step is visible — the operation either committed or it did not. Java exposes this as `AtomicInteger.compareAndSet(expect, update)`, plus higher-level helpers like `incrementAndGet`, `getAndSet`, `updateAndGet`, and `accumulateAndGet`. Higher-level data structures — `ConcurrentLinkedQueue`'s node pointer, the striping inside `ConcurrentHashMap`, and `AtomicStampedReference` — are all built on it.\n\nCAS eliminates the kernel-mode overhead of lock acquisition and lets multiple writers retry in user space. Performance is excellent when **contention is low**: a couple of threads clashing once in a thousand calls pay nothing more than a retry loop, with no context switch.\n\nThe classic hazard is **ABA**: a value changes from A to B and back to A between the read and the CAS, so the check passes but the world has moved on around it. Sequence-stamped or versioned references fix this — `AtomicStampedReference` and `AtomicMarkableReference` carry a version alongside the value, and any lock-free structure that mutates a pointer needs extra care to handle the same pattern (deleting a node and reinserting it, for example).",
      code: `import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicStampedReference;

public class CasDemo {
    public static void main(String[] args) {
        // Lock-free counter used by everything from Striped64 to Stream pipelines
        AtomicInteger tickets = new AtomicInteger(0);
        tickets.updateAndGet(n -> n + 1);          // atomic CAS loop
        tickets.incrementAndGet();                  // convenience form
        System.out.println("tickets: " + tickets);  // 2

        // ABA-safe: version + value travel together
        String initial = "free";
        AtomicStampedReference<String> slot = new AtomicStampedReference<>(initial, 0);
        int[] stampHolder = new int[1];
        String current = slot.get(stampHolder);
        boolean ok = slot.compareAndSet(current, "taken",
                                        stampHolder[0], stampHolder[0] + 1);
        System.out.println("CAS ok=" + ok + " slot=" + slot.getReference()
                + " stamp=" + stampHolder[0]);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lock-free atomic primitives implement a single compare-and-swap on the CPU — faster than locking at low contention, but watch out for ABA without versioning.",
    },
    {
      id: "q171",
      question: "What is a lock? How is it different from using synchronized approach?",
      answer:
        "`synchronized` is the language-level built-in: every object has an intrinsic monitor, and a `synchronized (lock)` block or `synchronized` instance method acquires it. It is **always reentrant** on a per-thread basis, the simplest model in the language, and the JVM can biased-lock and lock-coarsen it. The catch: once a thread is parked, you cannot ask it to give up — no timed acquisition, no interruptible wait, no fairness knob, and a single implicit condition variable per monitor.\n\n`java.util.concurrent.locks.Lock` is the expressive counterpart. `ReentrantLock` adds `tryLock()`, `tryLock(timeout, unit)`, `lockInterruptibly()`, a configurable fairness policy, and multiple `Condition` variables per lock — useful when one wait-set is too coarse. Internally it parks the thread via `LockSupport`, so its cost is comparable to `synchronized` under heavy contention.\n\nThe framework also offers **specialised** locks:\n\n- `ReadWriteLock` (and `ReentrantReadWriteLock`) lets multiple readers proceed concurrently; writers still exclude everyone.\n- `StampedLock` (Java 8) adds **optimistic reads** that do not lock at all and validate the stamp afterwards — the fastest choice for read-heavy caches.\n- `Semaphore`, `CountDownLatch`, and `CyclicBarrier` are synchronisers built on the same parking primitives.\n\n**Default to `synchronized`** for new code: the JVM optimises it well and the surface is smaller. Reach for `ReentrantLock` when you need timed, interruptible or fair acquisition; pick `ReentrantReadWriteLock` when reads dominate but writes still need to mutate shared state; consider `StampedLock` only after profiling proves the lock is a bottleneck and you accept its non-reentrant, no-condition API.",
      code: `import java.util.concurrent.locks.*;

public class LockVsSync {
    public static void main(String[] args) throws InterruptedException {
        // ReentrantLock: timed try, fairness, multiple conditions
        ReentrantLock lock = new ReentrantLock(true); // fair queue order
        boolean acquired = lock.tryLock();
        System.out.println("tryLock ok? " + acquired);
        if (acquired) {
            try {
                System.out.println("held by: " + Thread.currentThread().getName());
            } finally {
                lock.unlock();
            }
        }

        // ReadWriteLock: many readers, exclusive writer
        ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
        if (rw.readLock().tryLock()) {
            try { System.out.println("read acquired"); } finally { rw.readLock().unlock(); }
        }

        // Stamped optimistic read — try the cheap path first
        StampedLock stamped = new StampedLock();
        long stamp = stamped.tryOptimisticRead();
        Object value = readSnapshot();
        if (!stamped.validate(stamp)) stamp = stamped.readLock(); // upgrade if dirty
        stamped.unlock(stamp);

        // For comparison: a synchronized cache line is mutual exclusion only.
        Object monitor = new Object();
        synchronized (monitor) { /* only reentrant, blocking, implicit lock */ }
    }

    private static Object readSnapshot() { return new Object(); }
}`,
      codeLanguage: "java",
      explanation:
        "Synchronized is reentrant but cannot time out, try or interrupt; Lock, ReadWriteLock and StampedLock give timed, interruptible, optimistic and read-shared acquisition.",
    },
    {
      id: "q172",
      question: "What is initial capacity of a Java collection?",
      answer:
        "Initial capacity is the size of the backing array a collection allocates when it is first constructed. For `HashMap` it is the **bucket count** — `new HashMap<>()` reserves 16 slots before a single key is inserted. For `ArrayList` it is the length of the internal `Object[]`. The value is a sizing hint: it controls memory layout and when the next resize is triggered.\n\nBecause a resize copies the entire backing array and **rehashes** every element, a too-small starting capacity causes expensive cascading reallocations during bulk loads. The cost is multiplicative: each doubling roughly quadruples the work to grow again, while every rehash invalidates cache lines the working set had stopped touching. The default 16 buckets is sensible for tens of entries; ten thousand entries inserted into the default HashMap trigger several resizes and many wasted threads on cache-resident slots.\n\nThe canonical rule is to **pre-size** when the eventual size is known: `new HashMap<>(expected)` (rounded up to the next power of two automatically), `new HashMap<>((int)(expected/0.75f) + 1)` when you want to avoid load-factor boundary resizes, and `new ArrayList<>(expected)` for the same reason on lists. Performance-sensitive code benefits measurably — a cache loader hitting a 10,000-entry map usually doubles throughput when the map is pre-sized versus default-constructed.\n\nCollections that are not array-backed (`TreeMap`, `TreeSet`, `LinkedList`) talk about capacity in different terms, but the same principle holds: tell the implementation what is coming so it does not rebalance in your hot path.",
      code: `import java.util.*;

public class InitialCapacity {
    public static void main(String[] args) {
        // Default: 16 buckets; cascades through several resizes under bulk load
        Map<Integer, String> def = new HashMap<>();
        for (int i = 0; i < 10_000; i++) def.put(i, "v");

        // Pre-sized: one allocation, no resize, fewer wasted buckets
        Map<Integer, String> primed = new HashMap<>(16_000);

        // ArrayList rule: 10 -> 20 -> 40 resize chain disappears
        List<Integer> sized = new ArrayList<>(10_000);

        // HashMap sizing maths: capacity * loadFactor = threshold, so
        // expected / loadFactor covers the target without crossing it.
        Map<String, Integer> tuned = new HashMap<>((int)(10_000/0.75f) + 1);

        System.out.println("size match: " + (def.size() == primed.size()));
        System.out.println("bucket count (primed): " + tableLength(primed));
        System.out.println("bucket count (tuned):  " + tableLength(tuned));
    }

    // Reflection only to inspect capacity for the demo.
    private static int tableLength(Map<?, ?> m) {
        try {
            var f = AbstractMap.class.getDeclaredField("table");
            // HashMap in JDK 11+ also has a 'table' via HashMap.Node[]
            // but the simplest cross-version probe is via size + load factor:
            return m.size();
        } catch (Exception e) { return -1; }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Initial capacity is the backing-array size at construction — pre-size when you know the eventual count to skip the cascade of resize and rehash cycles.",
    },
    {
      id: "q173",
      question: "What is load factor?",
      answer:
        "Load factor is a float between 0 and 1 that tells a hashed collection **when to grow**. It is the ratio of current element count to bucket count at which the collection doubles its internal array and rehashes. The HashMap default is **0.75** — chosen empirically as a good trade-off between collision frequency and memory waste.\n\nMechanically: `threshold = capacity * loadFactor`. A HashMap with 16 buckets and load factor 0.75 rehashes when the 12th element is inserted. The resize doubles the bucket count to 32, the new threshold becomes 24, and the cycle repeats. Choosing 1.0 means fewer allocations and more collisions in the tail; choosing 0.5 means half-empty tables but very uniform distribution.\n\n**Tuning guidance:**\n\n- The default 0.75 suits almost everyone.\n- Larger datasets served by a fixed-size cache may pick 0.6 to 0.7 for tighter distribution at the cost of more memory.\n- A cache that already scales horizontally via a consistent-hashing layer above usually prefers 0.9 to minimise memory.\n- `LinkedHashMap` and `LinkedHashSet` expose the load factor in the same constructor; `ConcurrentHashMap` accepts it only in the legacy 3-arg form, not in Java 8+, where sizing is fixed by the parallel level.\n\n`TreeMap`, `TreeSet`, `ArrayList`, and the linked structures do not carry a load factor — they grow on a different rule (red-black rebalance, 1.5x array grow, node allocation), so the concept simply does not apply there.",
      code: `import java.util.HashMap;

public class LoadFactor {
    public static void main(String[] args) {
        // Default: capacity 16, load 0.75 -> rehash when 13th element arrives
        HashMap<Integer, String> def = new HashMap<>();
        for (int i = 1; i <= 12; i++) def.put(i, "v");
        System.out.println("before threshold, size = " + def.size());

        // Tighter distribution: half-empty tables, fewer collision chains
        HashMap<Integer, String> tight = new HashMap<>(64, 0.5f);

        // Memory-friendly: more collisions, far fewer resizes for a static cache
        HashMap<Integer, String> loose = new HashMap<>(64, 0.9f);

        // threshold = capacity * loadFactor decides the next grow.
        System.out.println("threshold @ 64 buckets:");
        System.out.println("  load 0.5f -> grow at " + (int)(64 * 0.5f));
        System.out.println("  load 0.75 -> grow at " + (int)(64 * 0.75f));
        System.out.println("  load 0.9f -> grow at " + (int)(64 * 0.9f));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Load factor is the resize threshold ratio; HashMap's 0.75 default balances collisions and memory, and tuning swings toward either distribution or density.",
    },
    {
      id: "q174",
      question: "When does a Java collection throw UnsupportedOperationException?",
      answer:
        "`UnsupportedOperationException` is a runtime exception a Java collection throws when an operation is **rejected by design**. It signals: the collection does not support that mutator. It is not a bug — the collection framework uses it as a deliberate marker, and almost every immutable or fixed-size view in the JDK leans on it to keep `add`, `set`, `remove` and `clear` forbidden.\n\nThe classic triggers:\n\n- `Arrays.asList(array)` returns a fixed-size wrapper: `add`, `remove` throw, `set` works because the size stays the same.\n- `Collections.unmodifiableList(list)` and its `Set` and `Map` siblings reject every mutation.\n- `List.of(...)`, `Set.of(...)`, `Map.of(...)` and `Map.ofEntries(...)` are fully immutable and reject every change.\n- `Collections.singletonList`, `singleton` and `singletonMap` likewise reject mutations.\n- Calling `Iterator.remove()` on a collection whose iterator does not support removal (for example, `Arrays.asList`'s iterator, or a `keySet().iterator()` on an immutable map view).\n\nProgrammers hit it most often when an unsuspecting `List<T>` reference actually points at one of these wrappers, typically because an API accepts a `List` in its signature and the caller passes in `List.of(...)`. A clean defence is to assert mutability up front by storing the value behind an interface type that exposes only the operations you actually use, or to convert explicitly with `new ArrayList<>(Arrays.asList(...))`. In tests, `assertThrows(UnsupportedOperationException.class, () -> list.add(x))` documents the contract.\n\n`Collections.checkedList` is the inverse trick: it throws `ClassCastException` instead, in case the wrapper itself is the surprise.",
      code: `import java.util.*;

public class UnsupportedExample {
    public static void main(String[] args) {
        // Fixed-size view of an array: set works, add throws
        List<Integer> fixed = Arrays.asList(1, 2, 3);
        fixed.set(0, 99);                              // OK, same size
        try {
            fixed.add(4);
        } catch (UnsupportedOperationException ex) {
            System.out.println("Arrays.asList rejects add");
        }

        // Fully immutable: every mutation throws
        List<Integer> immutable = List.of(1, 2, 3);
        try {
            immutable.remove(0);
        } catch (UnsupportedOperationException ex) {
            System.out.println("List.of rejects remove");
        }

        // Iterator.remove is forbidden on immutable iterators
        try {
            immutable.iterator().remove();
        } catch (UnsupportedOperationException ex) {
            System.out.println("iterator.remove rejected");
        }

        // Wrap into a mutable list if you need real mutators
        List<Integer> mutable = new ArrayList<>(List.of(1, 2, 3));
        mutable.add(4);
        System.out.println("mutable size = " + mutable.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Immutable collection wrappers, Arrays.asList and List/Set/Map.of throw this exception to reject mutators — test it explicitly when an API accepts a List.",
    },
    {
      id: "q175",
      question: "What is difference between fail-safe and fail-fast iterators?",
      answer:
        "`java.util` iterators are **fail-fast**: `ArrayList`, `HashMap`, `HashSet`, `LinkedList`, `TreeMap`. Each collection keeps a `modCount` counter that every structural operation (`add`, `remove`, `clear`) bumps by one. The iterator stores the modCount value at creation time and, on every `next()` or `remove()`, asserts the live count still matches — a mismatch means another thread has modified the structure, so it throws `ConcurrentModificationException` and bails out.\n\n`ConcurrentModificationException` is therefore a **best-effort detection** of concurrent mutation, not a guarantee. Two threads incrementing modCount alternately can leave the iterator blind; relying on it for correctness is unsafe. The safe pattern is to use `Iterator.remove()` instead of the collection's `remove` while iterating, since the iterator updates the expected modCount itself.\n\n`java.util.concurrent` iterators are **weakly consistent** — loosely fail-safe. `CopyOnWriteArrayList` iterates the snapshot reference captured at creation, so mutations in another thread never throw. `ConcurrentHashMap` iterators return elements reflecting the state at some point during the traversal and tolerate concurrent modifications without throwing. They are free of the surprise exception but make no strong ordering guarantee beyond that — a deletion may or may not be reflected.\n\nThe decision is sharp: fail-fast catches accidental shared mutation by **crashing loudly during development**; fail-safe iterators let production code survive concurrent reads, at the cost of delivering data that may be mildly out of date. Pick `CopyOnWriteArrayList`, `ConcurrentHashMap`, or `ConcurrentSkipListMap` whenever there is realistic concurrency.",
      code: `import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class FailFastVsSafe {
    public static void main(String[] args) {
        // Fail-fast: mutating during iteration throws CME
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
        try {
            for (Integer i : list) {
                if (i == 2) list.add(99); // mutates while iterating
            }
        } catch (ConcurrentModificationException cme) {
            System.out.println("fail-fast caught: " + cme.getClass().getSimpleName());
        }

        // Iterator.remove() is the legal way to delete during iteration
        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            if (it.next() == 1) it.remove();
        }
        System.out.println("after Iterator.remove: " + list);

        // Weakly consistent: concurrent mutation is allowed, no exception
        CopyOnWriteArrayList<Integer> safe = new CopyOnWriteArrayList<>(list);
        for (Integer i : safe) {
            safe.add(100); // tolerated; iterator already captured its snapshot
        }
        System.out.println("snapshot was 4 elements; live size now "
                + safe.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Fail-fast iterators throw ConcurrentModificationException when modified mid-traversal; concurrent collections are weakly consistent and tolerate updates by iterating from a snapshot.",
    },
    {
      id: "q176",
      question: "What are atomic operations in Java?",
      answer:
        "An atomic operation is one that **either completes fully or not at all**, with no intermediate state visible to other threads. Java's `java.util.concurrent.atomic` package delivers this guarantee for single variables via CPU-level compare-and-swap (see the CAS answer). The classes — `AtomicBoolean`, `AtomicInteger`, `AtomicLong`, `AtomicReference`, `AtomicIntegerArray`, plus the field updaters (`AtomicIntegerFieldUpdater`, `AtomicReferenceFieldUpdater`) — let shared counters, flags and references advance without `synchronized` blocks.\n\nThe API surfaces what CAS can express:\n\n- **Read-modify-write** in one step: `incrementAndGet`, `addAndGet`, `getAndSet`, `getAndUpdate`, `updateAndGet`, `accumulateAndGet`.\n- **CAS directly**: `compareAndSet(expect, update)` returns a boolean; `weakCompareAndSet` is its weaker variant.\n- **Lazy initialisation**: `AtomicReference` + `compareAndSet(null, value)` is the canonical pattern for lock-free singletons.\n- Java 9 adds `VarHandle` for the same semantics over arbitrary fields and array elements, the modern replacement for the field-updater classes.\n\nAtomics are **single-variable only**. If two fields need to move together — for example, `if (balance >= amount) { balance -= amount; ledger.add(...); }` — the atomicity stops at the boundary. Without an outer `synchronized` or a `ReentrantLock`, a race window opens between the two mutations. Likewise, an atomic reference does not by itself enforce visibility of unrelated state, so reaching for `volatile` or locks is still required when other variables participate in the same invariant.",
      code: `import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public class AtomicUsage {
    public static void main(String[] args) throws InterruptedException {
        // Lock-free hit counter for a metrics endpoint
        AtomicLong hits = new AtomicLong();
        Thread[] workers = new Thread[8];
        for (int i = 0; i < workers.length; i++) {
            workers[i] = new Thread(() -> {
                for (int n = 0; n < 10_000; n++) hits.incrementAndGet();
            });
            workers[i].start();
        }
        for (Thread w : workers) w.join();
        System.out.println("hits = " + hits.get()); // exactly 80_000

        // CAS-driven lazy initialisation pattern (lock-free singleton)
        AtomicReference<Object> instance = new AtomicReference<>();
        Object mine = instance.updateAndGet(prev ->
                prev != null ? prev : new Object());
        System.out.println("singleton? " + (mine == instance.get()));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Atomics give lock-free single-variable CAS-based mutation — perfect for counters and flags, useless the moment two fields must move together.",
    },
    {
      id: "q177",
      question: "What is BlockingQueue in Java?",
      answer:
        "`java.util.concurrent.BlockingQueue` is a thread-safe queue with **blocking** semantics: `put` blocks the producer when the queue is full, `take` blocks the consumer when the queue is empty. The interface was added in Java 5 specifically to subsume the producer/consumer pattern that used to require manual `wait`/`notify` plumbing on top of a `LinkedList`.\n\nThe combined API:\n\n- `put(e)` and `take()` — blocking variants.\n- `offer(e, timeout, unit)` and `poll(timeout, unit)` — bounded waits with a deadline.\n- `add(e)` and `remove()` — non-blocking forms, throwing on failure.\n- `peek()`, `size()`, `remainingCapacity()` — status checks.\n- Java 8 adds stream-style `drainTo(Collection)` and `drainTo(Collection, max)` for bulk draining.\n\nThe five canonical implementations cover different shapes:\n\n- `ArrayBlockingQueue` — bounded FIFO backed by a fixed-capacity array.\n- `LinkedBlockingQueue` — optionally bounded FIFO via linked nodes; the workhorse used inside `ThreadPoolExecutor`.\n- `PriorityBlockingQueue` — unbounded, with priority ordering on `Comparable` elements or a `Comparator`.\n- `SynchronousQueue` — zero capacity; a hand-off rendezvous between producer and consumer.\n- `DelayQueue` — elements become `take`-able only after their individual delay expires.\n\n**Producer/consumer pattern in practice**: `ThreadPoolExecutor` itself uses a `LinkedBlockingQueue` as its work queue. With your own thread pair the producer calls `put` and sleeps when the buffer fills, the consumer calls `take` and sleeps when empty, and termination is triggered by a sentinel value or an `AtomicBoolean` flag — no `wait`/`notifyAll` and no lost wake-ups.",
      code: `import java.util.concurrent.*;

public class ProducerConsumer {
    public static void main(String[] args) {
        BlockingQueue<String> pool = new LinkedBlockingQueue<>(2);
        Runnable producer = () -> {
            for (int i = 1; i <= 5; i++) {
                try {
                    pool.put("work-" + i);            // blocks if queue full
                    System.out.println("produced " + i);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        };
        Runnable consumer = () -> {
            for (int i = 1; i <= 5; i++) {
                try {
                    String task = pool.take();         // blocks if queue empty
                    System.out.println("consumed " + task);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        };
        new Thread(producer, "producer").start();
        new Thread(consumer, "consumer").start();
    }
}`,
      codeLanguage: "java",
      explanation:
        "BlockingQueue encodes producer/consumer on top of put and take; pick ArrayBlockingQueue for bounded FIFO, LinkedBlockingQueue for the workhorse, SynchronousQueue for hand-off.",
    },
  ],
  meta: {
    q167: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "concurrency", "thread-safety"],
      relatedQuestionIds: ["q168", "q169", "q171"],
      estimatedReadMinutes: 4,
    },
    q168: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "concurrency", "java5"],
      relatedQuestionIds: ["q167", "q170", "q177"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+"],
    },
    q169: {
      difficulty: "medium",
      priority: "high",
      tags: ["collections", "concurrency", "copy-on-write"],
      relatedQuestionIds: ["q167", "q175"],
      estimatedReadMinutes: 3,
    },
    q170: {
      difficulty: "hard",
      priority: "very-high",
      tags: ["concurrency", "cas", "atomics"],
      relatedQuestionIds: ["q176", "q167"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+"],
    },
    q171: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["concurrency", "locks", "reentrant"],
      relatedQuestionIds: ["q167", "q170"],
      estimatedReadMinutes: 4,
    },
    q172: {
      difficulty: "easy",
      priority: "high",
      tags: ["collections", "performance", "capacity"],
      relatedQuestionIds: ["q173"],
      estimatedReadMinutes: 3,
    },
    q173: {
      difficulty: "easy",
      priority: "high",
      tags: ["collections", "performance", "hashing"],
      relatedQuestionIds: ["q172"],
      estimatedReadMinutes: 3,
    },
    q174: {
      difficulty: "medium",
      priority: "high",
      tags: ["collections", "immutability", "exceptions"],
      relatedQuestionIds: ["q175"],
      estimatedReadMinutes: 3,
    },
    q175: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "iterators", "concurrency"],
      relatedQuestionIds: ["q174", "q167"],
      estimatedReadMinutes: 3,
    },
    q176: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["concurrency", "atomics", "cas"],
      relatedQuestionIds: ["q170", "q167"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 5+"],
    },
    q177: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "concurrency", "producers-consumers"],
      relatedQuestionIds: ["q167", "q168"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
  },
});
