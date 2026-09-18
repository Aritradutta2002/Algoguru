import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Collections - global questions 145-155.
 * LinkedList, Set family, SortedSet, NavigableSet, HashSet/LinkedHashSet/TreeSet,
 * Queue and its related interfaces.
 */
export const chunk15CollectionsB = defineChunk({
  topic: "collections",
  questions: [
    {
      id: "q145",
      question: "What is linkedList? What interfaces does it implement? How is it different from an ArrayList?",
      answer:
        "`java.util.LinkedList` is a doubly-linked list implementation of the `List` and `Deque` interfaces. Each node holds the value, a pointer to the previous node and a pointer to the next one. `LinkedList` also implements `Queue`, which means it can serve as a FIFO queue, a stack (LIFO via push/pop) or a deque.\n\n**LinkedList vs ArrayList:**\n\n- **Random access**: ArrayList is O(1) — you index directly into the array. LinkedList is O(n) — you walk the chain. Indexing a LinkedList near the middle is genuinely slow.\n- **Insertions and removals at the ends**: LinkedList is O(1). ArrayList is amortised O(1) at the end but O(n) in the middle because elements must be shifted.\n- **Memory**: each LinkedList node has two extra object references plus a node object header. ArrayList is a single contiguous array, so its memory footprint is much smaller.\n- **Iterator behaviour**: both implement `ListIterator`, but LinkedList's iterator can insert and remove cheaply in the middle.\n- **Nulls**: LinkedList allows multiple nulls. ArrayList allows nulls too.\n\n**When to prefer LinkedList**: when you need constant-time insertion or removal at known iterator positions, when you need a deque or queue and do not want a separate class, or when the working set is small enough that the memory overhead is irrelevant. For nearly every other list use case, ArrayList wins.",
      code: `import java.util.*;

public class LinkedListDemo {
    public static void main(String[] args) {
        // Acts as a list, a queue, and a stack all at once.
        Deque<String> stack = new LinkedList<>();
        stack.push(\"first\");
        stack.push(\"second\");
        System.out.println(stack.pop()); // second

        Queue<Integer> queue = new LinkedList<>();
        queue.offer(1); queue.offer(2); queue.offer(3);
        while (!queue.isEmpty()) System.out.print(queue.poll() + \" \");
        System.out.println(); // 1 2 3

        List<String> fruits = new LinkedList<>(List.of(\"apple\", \"pear\", \"plum\"));
        fruits.add(1, \"kiwi\");                 // O(n) traversal
        for (String f : fruits) System.out.print(f + \" \"); // apple kiwi pear plum
    }
}`,
      codeLanguage: "java",
      explanation:
        "LinkedList is doubly-linked, implements List+Deque+Queue; better at ends, slower at random access; prefer ArrayList unless you specifically need deque or middle-iterator edits.",
    },
    {
      id: "q146",
      question: "Can you briefly explain about the Set interface?",
      answer:
        "`Set` is a `Collection` that does not allow duplicates. Two elements `e1` and `e2` are duplicates when `e1.equals(e2)`. Set adds no methods beyond `Collection`; it is a pure behavioural contract. Most sets are unordered, but the `SortedSet` and `NavigableSet` subinterfaces add ordering guarantees.\n\n**Why a Set matters:**\n\n- **Uniqueness**: deduplicating a stream (`Stream.distinct`) or a list.\n- **Membership tests**: `contains` is the headline operation. HashSet is O(1) average, TreeSet is O(log n), LinkedHashSet matches HashSet but preserves insertion order.\n- **Set algebra**: `addAll` (union), `retainAll` (intersection), `removeAll` (difference) work on sets the way you would expect.\n\n**Implementations you will meet:**\n\n- `HashSet` — backed by a `HashMap<E, Object>`; constant-time operations; permits one null.\n- `LinkedHashSet` — same as HashSet but iterates in insertion order.\n- `TreeSet` — backed by a `TreeMap`; sorted by natural order or a Comparator.\n- `EnumSet` — bit-set over enums; the fastest set for enum keys.\n- `CopyOnWriteArraySet` — read-mostly set for listeners and similar workloads.\n- `ConcurrentSkipListSet` — concurrent sorted set.\n\n**Rules**: the equals and hashCode contract of the element class determine correctness. If two elements are `equals`, only one will be retained. If they have different `hashCode`, they will land in different buckets and the Set will silently hold duplicates.",
      code: `import java.util.*;

public class SetDemo {
    public static void main(String[] args) {
        Set<String> visited = new HashSet<>();
        visited.add(\"homepage\");
        visited.add(\"about\");
        visited.add(\"homepage\");              // duplicate -> ignored
        System.out.println(visited.size());    // 2

        Set<Integer> a = new HashSet<>(List.of(1, 2, 3, 4));
        Set<Integer> b = new HashSet<>(List.of(3, 4, 5, 6));
        a.addAll(b);                            // union
        System.out.println(a);                  // [1, 2, 3, 4, 5, 6]

        Set<Integer> small = new HashSet<>(List.of(2, 3, 4));
        small.retainAll(List.of(3, 4, 5));      // intersection
        System.out.println(small);              // [3, 4]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Set = Collection without duplicates; depends on equals/hashCode; pick HashSet for speed, TreeSet for order, EnumSet for enums.",
    },
    {
      id: "q147",
      question: "What are the important interfaces related to the Set interface?",
      answer:
        "The Set hierarchy extends `Collection` and adds the following important sub-interfaces:\n\n- **`SortedSet<E>`**: guarantees iteration in ascending element order, either by natural order or by a `Comparator`. Provides `first`, `last`, `headSet`, `tailSet`, `subSet`.\n- **`NavigableSet<E>`**: extends SortedSet with navigation methods — `lower`, `floor`, `ceiling`, `higher`, `descendingIterator`, `pollFirst`, `pollLast`. Useful for \"find the smallest element greater than X\" lookups.\n- **`Set<E>`**: the root, no order guarantee, only the uniqueness contract from `Collection`.\n\n**Concrete implementations worth knowing:**\n\n- `HashSet<E>` — backed by a `HashMap`, O(1) average, permits one null.\n- `LinkedHashSet<E>` — HashSet with insertion-order iteration.\n- `TreeSet<E>` — backed by a `TreeMap`, sorted, O(log n).\n- `EnumSet<E extends Enum<E>>` — bit-set over an enum's values.\n- `CopyOnWriteArraySet<E>` — read-mostly, snapshot iteration.\n- `ConcurrentSkipListSet<E>` — concurrent sorted set.\n\n**Which to use**:\n\n- Random lookups and no order: HashSet.\n- Insertion order with the same speed: LinkedHashSet.\n- Sorted iteration or range queries: TreeSet.\n- Enum keys: EnumSet (very fast, compact).\n- High concurrency reads: CopyOnWriteArraySet or ConcurrentSkipListSet.",
      code: `import java.util.*;

public class SetHierarchy {
    public static void main(String[] args) {
        NavigableSet<Integer> nav = new TreeSet<>(List.of(5, 1, 8, 2, 9, 3));
        System.out.println(nav);          // [1, 2, 3, 5, 8, 9]
        System.out.println(nav.ceiling(4)); // 5
        System.out.println(nav.floor(4));   // 3
        System.out.println(nav.descendingSet()); // [9, 8, 5, 3, 2, 1]

        EnumSet<Day> weekend = EnumSet.of(Day.SATURDAY, Day.SUNDAY);
        System.out.println(weekend);
    }

    enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }
}`,
      codeLanguage: "java",
      explanation:
        "Set → SortedSet → NavigableSet is the order; HashSet/LinkedHashSet/TreeSet/EnumSet are the everyday implementations.",
    },
    {
      id: "q148",
      question: "What is the difference between Set and sortedSet interfaces?",
      answer:
        "Plain `Set` has only the uniqueness contract. `SortedSet` is a sub-interface that adds a **total ordering** over its elements — either by natural order (the elements implement `Comparable`) or by a `Comparator` supplied at construction time.\n\n**Concretely, SortedSet adds:**\n\n- Iteration in ascending order, regardless of insertion order.\n- `first()`, `last()` — endpoints.\n- `headSet(toElement)`, `tailSet(fromElement)`, `subSet(from, to)` — range views (the returned sets are backed by the original).\n- Guaranteed `add`, `remove` and `contains` of O(log n) rather than O(1).\n\n**Why SortedSet matters:**\n\n- You need ordered iteration without sorting manually.\n- You need range views (`subSet`).\n- You are feeding a sorted structure (e.g. a sliding-window of events by timestamp).\n\n**Sub-interface `NavigableSet`** adds ceiling/floor/higher/lower lookups plus `pollFirst`/`pollLast`, which is what you usually want in practice.\n\n**Why the distinction matters for interviews:** many developers reach for HashSet without thinking. If you ever need to iterate in order, fetch the smallest element, or query \"what is the smallest key >= X\", a SortedSet (TreeSet or ConcurrentSkipListSet) is the right tool.",
      code: `import java.util.*;

public class SortedVsSet {
    public static void main(String[] args) {
        // Plain Set: HashSet has no order guarantee.
        Set<Integer> plain = new HashSet<>(List.of(3, 1, 4, 1, 5, 9, 2, 6));
        System.out.println(plain); // arbitrary order, e.g. [1, 2, 3, 4, 5, 6, 9]

        // SortedSet: TreeSet orders ascending.
        SortedSet<Integer> sorted = new TreeSet<>(List.of(3, 1, 4, 1, 5, 9, 2, 6));
        System.out.println(sorted); // [1, 2, 3, 4, 5, 6, 9]
        System.out.println(sorted.first() + \"..\" + sorted.last()); // 1..9
        System.out.println(sorted.subSet(3, 7)); // [3, 4, 5, 6]
    }
}`,
      codeLanguage: "java",
      explanation:
        "SortedSet adds ordering, first/last, range views and O(log n) ops; Set has none of these.",
    },
    {
      id: "q149",
      question: "Can you give examples of classes that implement the Set interface?",
      answer:
        "Common implementations of `Set`:\n\n- **`HashSet`** — backed by a `HashMap`, O(1) average, no order.\n- **`LinkedHashSet`** — backed by a `LinkedHashMap`, iterates in insertion order.\n- **`TreeSet`** — backed by a `TreeMap`, sorted.\n- **`EnumSet`** — bit-set over enum constants, very fast and compact.\n- **`CopyOnWriteArraySet`** — backed by a `CopyOnWriteArrayList`, optimised for read-heavy concurrent access.\n- **`ConcurrentSkipListSet`** — concurrent sorted set built on a skip list.\n- **`BitSet`** is NOT a Set — it is a separate utility for fixed-size bit flags. People often confuse the two.\n- **`Collections.newSetFromMap(new ConcurrentHashMap<>())`** — build any set semantics from a Map.\n\n**Specialised uses**:\n\n- **Listeners**: `CopyOnWriteArraySet` is the safe choice because iterating while listeners are added does not throw.\n- **Enum-keyed membership**: `EnumSet.of(...)` is much faster and smaller than a HashSet.\n- **Idempotent processing**: a HashSet of seen identifiers.\n- **Sorted sliding window**: a `TreeSet` of timestamps with `subSet` for the active window.\n\n**How to pick**: pick the simplest one that gives you the iteration order and concurrency you need. Default to HashSet for a bag of unique things; reach for LinkedHashSet when you want stable iteration; TreeSet when you need ordering.",
      code: `import java.util.*;

public class SetImpls {
    public static void main(String[] args) {
        // HashSet — speed, no order
        Set<String> hash = new HashSet<>();
        hash.add(\"b\"); hash.add(\"a\"); hash.add(\"c\");
        System.out.println(\"HashSet: \" + hash);

        // LinkedHashSet — insertion order
        Set<String> linked = new LinkedHashSet<>();
        linked.add(\"b\"); linked.add(\"a\"); linked.add(\"c\");
        System.out.println(\"LinkedHashSet: \" + linked);

        // TreeSet — sorted
        Set<String> tree = new TreeSet<>(Comparator.reverseOrder());
        tree.add(\"b\"); tree.add(\"a\"); tree.add(\"c\");
        System.out.println(\"TreeSet rev: \" + tree);

        // EnumSet — fast + compact
        Set<Day> weekend = EnumSet.of(Day.SATURDAY, Day.SUNDAY);
        System.out.println(\"EnumSet: \" + weekend);
    }

    enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }
}`,
      codeLanguage: "java",
      explanation:
        "HashSet/LinkedHashSet/TreeSet/EnumSet/CopyOnWriteArraySet cover almost every realistic use; choose by order + concurrency needs.",
    },
    {
      id: "q150",
      question: "What is a HashSet?",
      answer:
        "`HashSet` is the workhorse implementation of `Set`. Internally it is a `HashMap<E, Object>` whose values are a constant `PRESENT` placeholder; the elements are the map's keys. Because of that, every property of `HashMap` carries over: O(1) average for `add`, `remove`, `contains`; one permitted null element; iteration order not guaranteed; fail-fast iterators that throw `ConcurrentModificationException` on structural modification during iteration.\n\n**Performance characteristics:**\n\n- **Initial capacity** (default 16) and **load factor** (default 0.75) determine when the table resizes. Resize rehashes every key, which is expensive on large sets.\n- **Bad hash distribution** collapses performance to O(n). Always provide a good `hashCode` for your element types.\n- **Capacity tuning**: if you know how many elements you will hold, `new HashSet<>(expectedSize, 0.75f)` lets you skip the resizes.\n\n**What HashSet is good for:**\n\n- Deduplication of streams and lists.\n- Membership tests on a large bag of objects.\n- Tracking visited nodes in graph algorithms.\n\n**What HashSet is not good for:**\n\n- Sorted iteration (use TreeSet).\n- Predictable iteration order (use LinkedHashSet).\n- Concurrent access from many threads (use ConcurrentHashMap.newKeySet() or ConcurrentSkipListSet).\n\n**Memory note**: HashSet's overhead is dominated by the backing table and the per-entry node. If you have very small sets, the constant overhead can be more than the data itself.",
      code: `import java.util.HashSet;
import java.util.Set;

public class HashSetDemo {
    public static void main(String[] args) {
        Set<String> tags = new HashSet<>(16, 0.75f);
        tags.add(\"java\"); tags.add(\"core\"); tags.add(\"java\");   // duplicate
        System.out.println(tags.size());                              // 2
        System.out.println(tags.contains(\"core\"));                  // true -- O(1)

        for (String t : tags) System.out.print(t + \" \");              // order not guaranteed
        System.out.println();
        tags.remove(\"core\");
        System.out.println(tags);                                       // [java]
    }
}`,
      codeLanguage: "java",
      explanation:
        "HashSet = HashMap with a constant value; O(1) add/contains/remove, no order, fail-fast iterators, supports one null.",
    },
    {
      id: "q151",
      question: "What is a linkedHashSet? How is different from a HashSet?",
      answer:
        "`LinkedHashSet` extends `HashSet` and adds a doubly-linked list that threads through every entry in insertion order. The performance profile is the same as HashSet — O(1) average for `add`, `remove`, `contains` — but iteration follows insertion order rather than hash bucket order.\n\n**Why this matters:** when you want a Set that is also predictable to iterate — e.g. for logging, for deterministic test outputs, or for feeding a downstream pipeline — `LinkedHashSet` is the right tool. The cost is one extra reference per entry (the `before`/`after` pointers in the linked list), which is usually negligible.\n\n**Operations that change order**:\n\n- `add` of an element that already exists does **not** re-insert it; the original insertion position is preserved.\n- `remove` removes the element from the linked list as expected.\n\n**Use cases:**\n\n- Maintaining the order of distinct log lines.\n- Caching LRU-like data (although LinkedHashMap does that better with `accessOrder`).\n- Deduplication of ordered inputs while preserving the original ordering.\n\n**When NOT to use LinkedHashSet**: when you need sorted iteration (use TreeSet), when you need a concurrent set (use ConcurrentHashMap.newKeySet()), or when you do not care about order and want the absolute lowest memory footprint.",
      code: `import java.util.LinkedHashSet;
import java.util.Set;

public class LinkedHashSetDemo {
    public static void main(String[] args) {
        Set<String> ordered = new LinkedHashSet<>();
        ordered.add(\"banana\"); ordered.add(\"apple\"); ordered.add(\"cherry\");
        ordered.add(\"apple\");                                  // duplicate, not re-added
        for (String s : ordered) System.out.print(s + \" \");      // banana apple cherry
        System.out.println();

        Set<Integer> dedupe = new LinkedHashSet<>();
        for (int n : new int[]{3, 1, 4, 1, 5, 9, 2, 6, 5, 3}) dedupe.add(n);
        System.out.println(dedupe);                              // [3, 1, 4, 5, 9, 2, 6]
    }
}`,
      codeLanguage: "java",
      explanation:
        "LinkedHashSet = HashSet plus insertion-order linked list; same O(1) performance, predictable iteration.",
    },
    {
      id: "q152",
      question: "What is a TreeSet? How is different from a HashSet?",
      answer:
        "`TreeSet` is a `NavigableSet` backed by a `TreeMap`. Elements are kept in ascending order — by natural order if they implement `Comparable`, or by a `Comparator` supplied to the constructor. Because the backing structure is a red-black tree, every operation is O(log n) rather than O(1).\n\n**Trade-offs vs HashSet:**\n\n- **Speed**: HashSet wins on pure `add`/`contains`/`remove`. TreeSet pays for ordering.\n- **Order**: TreeSet iterates ascending. HashSet has no order guarantee.\n- **Range queries**: TreeSet supports `headSet`, `tailSet`, `subSet`, `ceiling`, `floor`, `higher`, `lower`.\n- **Nulls**: HashSet allows one null. TreeSet does not allow nulls unless the Comparator explicitly handles them.\n- **Element contract**: TreeSet needs `Comparable` or a `Comparator`; HashSet only needs `equals` and `hashCode`.\n\n**When TreeSet is the right answer:**\n\n- You need sorted iteration (e.g. leaderboards, dictionary).\n- You need \"smallest element greater than X\" (`higher`/`ceiling`).\n- You need to query \"elements in range [a, b]\" (`subSet`).\n- You want to enumerate elements in a deterministic order in tests.\n\n**Interview gotcha**: if you compare an element with another via `compareTo`, that comparison must be consistent with `equals` if you also use `Set` semantics. Otherwise `Set` will say two equal elements are different (`TreeSet` will say they are equal — `compareTo == 0` — while `HashSet` will say they are equal — `equals` is true). Mixing the two is the source of many subtle bugs.",
      code: `import java.util.*;

public class TreeSetDemo {
    public static void main(String[] args) {
        NavigableSet<Integer> scores = new TreeSet<>();
        for (int s : new int[]{85, 92, 73, 92, 60}) scores.add(s);
        System.out.println(scores);                  // [60, 73, 85, 92]
        System.out.println(scores.ceiling(80));      // 85
        System.out.println(scores.higher(80));       // 85
        System.out.println(scores.subSet(70, 90));   // [73, 85]
        System.out.println(scores.descendingSet());  // [92, 85, 73, 60]
    }
}`,
      codeLanguage: "java",
      explanation:
        "TreeSet = sorted NavigableSet backed by TreeMap; O(log n) ops, range views, requires Comparable or Comparator; compareTo must agree with equals.",
    },
    {
      id: "q153",
      question: "Can you give examples of implementations of navigableSet?",
      answer:
        "`NavigableSet<E>` is the sub-interface of `SortedSet` that adds navigation methods (`lower`, `floor`, `ceiling`, `higher`), reverse iteration (`descendingIterator`, `descendingSet`) and queue-style operations (`pollFirst`, `pollLast`).\n\n**Implementations of NavigableSet in the JDK:**\n\n- **`TreeSet<E>`** — the classic general-purpose choice. Backed by a red-black tree. Not thread-safe.\n- **`ConcurrentSkipListSet<E>`** — concurrent, lock-free reads, comparable to a TreeSet in ordering guarantees. Backed by a skip list rather than a red-black tree.\n\n**Typical use cases:**\n\n- `TreeSet`: scoring systems, sorted windows, dictionary lookups, anything that needs `subSet`/`ceiling`.\n- `ConcurrentSkipListSet`: sorted set shared between threads — e.g. a sorted log of events across services.\n\n**Why use NavigableSet over SortedSet**: NavigableSet's methods let you find the closest match without scanning. `ceiling(x)` returns the smallest element `>= x`; `floor(x)` returns the largest `<= x`. If the only thing you need is ascending iteration, `SortedSet` is enough — but `NavigableSet` is more useful in practice.\n\n**Note on Guava**: Guava's `TreeMultiset` and `RangeSet` build on top of TreeSet concepts. They are useful when you need ordered multiset semantics or disjoint ranges.",
      code: `import java.util.*;
import java.util.concurrent.ConcurrentSkipListSet;

public class NavigableSetImpls {
    public static void main(String[] args) {
        NavigableSet<String> tree = new TreeSet<>(List.of(\"c\", \"a\", \"b\", \"e\", \"d\"));
        System.out.println(tree.floor(\"c\"));                  // c
        System.out.println(tree.ceiling(\"c\"));               // c
        System.out.println(tree.lower(\"c\"));                 // b
        System.out.println(tree.higher(\"c\"));                // d

        NavigableSet<String> concurrent = new ConcurrentSkipListSet<>();
        concurrent.add(\"alpha\"); concurrent.add(\"beta\"); concurrent.add(\"gamma\");
        System.out.println(concurrent.pollFirst());            // alpha
        System.out.println(concurrent.pollLast());             // gamma
        System.out.println(concurrent);                        // [beta]
    }
}`,
      codeLanguage: "java",
      explanation:
        "TreeSet and ConcurrentSkipListSet are the two NavigableSet implementations in the JDK; pick the concurrent one for shared access.",
    },
    {
      id: "q154",
      question: "Explain briefly about Queue interface?",
      answer:
        "`Queue<E>` is a `Collection` that holds elements prior to processing. It models a FIFO (first-in, first-out) ordering with explicit insertion (`offer`/`add`), extraction (`poll`/`remove`) and inspection (`peek`/`element`) methods. The interface was designed to throw exceptions when capacity is exceeded or when the queue is empty, but each method has a non-throwing variant — pick whichever fits your error model.\n\n**The two-method matrix:**\n\n- **Throws**:\n  - `add(e)` — `IllegalStateException` if the queue is bounded and full.\n  - `remove()` — `NoSuchElementException` if empty.\n  - `element()` — `NoSuchElementException` if empty.\n- **Returns null/false**:\n  - `offer(e)` — returns `false` on capacity failure.\n  - `poll()` — returns `null` if empty.\n  - `peek()` — returns `null` if empty.\n\n**Implementations:**\n\n- **`LinkedList`** — also implements `Deque`.\n- **`ArrayDeque`** — array-backed, faster than `LinkedList` for both ends.\n- **`PriorityQueue`** — orders by priority rather than insertion.\n- **`ArrayBlockingQueue`** / **`LinkedBlockingQueue`** — bounded concurrent queues.\n- **`PriorityBlockingQueue`** / **`DelayQueue`** / **`SynchronousQueue`** — special-purpose concurrent queues.\n\n**What Queue is for**: producer/consumer pipelines, breadth-first searches, task schedulers, anything where order of processing matters.\n\n**Why not always use a List?** Lists allow random access and `list.add(0, x)` is allowed, but they are slow for queue semantics and lack the queue-specific method pairs.",
      code: `import java.util.*;

public class QueueDemo {
    public static void main(String[] args) {
        Queue<Integer> q = new ArrayDeque<>();
        q.offer(1); q.offer(2); q.offer(3);
        System.out.println(q.element()); // 1 -- throws if empty
        System.out.println(q.peek());    // 1 -- null if empty
        while (!q.isEmpty()) {
            System.out.print(q.poll() + \" \"); // 1 2 3
        }
        System.out.println(\"\\nsize after: \" + q.size()); // 0
    }
}`,
      codeLanguage: "java",
      explanation:
        "Queue = FIFO with explicit offer/poll/peek; non-throwing variants exist; pick ArrayDeque as the default, PriorityQueue when order is by priority.",
    },
    {
      id: "q155",
      question: "What are the important interfaces related to the Queue interface?",
      answer:
        "`Queue` is the abstract parent of several specialised interfaces. Knowing them is essential for picking the right structure in production code:\n\n- **`Deque<E>` (double-ended queue)**: insert/remove/examine at both ends. Methods like `addFirst`, `addLast`, `offerFirst`, `offerLast`, `pollFirst`, `pollLast`. Implements both queue and stack semantics. Implementations: `ArrayDeque` (best general-purpose), `LinkedList`, `ConcurrentLinkedDeque`.\n- **`BlockingQueue<E>`**: thread-safe queue with blocking operations — `put` blocks until space is available; `take` blocks until an element is available; timed variants `offer(timeout, unit)` and `poll(timeout, unit)`. Implementations: `ArrayBlockingQueue` (bounded, array), `LinkedBlockingQueue` (optionally bounded, node), `PriorityBlockingQueue`, `DelayQueue`, `SynchronousQueue` (zero capacity hand-off).\n- **`TransferQueue<E>`**: extension of `BlockingQueue` where producers can wait until a consumer receives the item (`transfer`). Implementation: `LinkedTransferQueue`.\n- **`BlockingDeque<E>`**: combines `BlockingQueue` and `Deque`. Implementation: `LinkedBlockingDeque`.\n- **`ConcurrentLinkedQueue<E>` / `ConcurrentLinkedDeque<E>`**: non-blocking lock-free queues. Excellent for throughput when blocking is undesirable.\n\n**Decision tree for a queue task:**\n\n- Single thread, FIFO, no priority → `ArrayDeque`.\n- Producer/consumer with bounded capacity → `ArrayBlockingQueue` or `LinkedBlockingQueue`.\n- Priority ordered → `PriorityQueue` (single thread) or `PriorityBlockingQueue` (concurrent).\n- Hand-off between threads → `SynchronousQueue` or `LinkedTransferQueue`.",
      code: `import java.util.concurrent.*;

public class QueueInterfaces {
    public static void main(String[] args) {
        // BlockingQueue with bounded capacity
        BlockingQueue<Integer> bounded = new ArrayBlockingQueue<>(10);
        bounded.offer(1); bounded.offer(2);

        // Deque acts as both stack and queue
        Deque<String> deque = new ArrayDeque<>();
        deque.push(\"a\"); deque.push(\"b\");
        System.out.println(deque.pop());   // b
        System.out.println(deque.peek());  // a

        // ConcurrentLinkedQueue is non-blocking
        ConcurrentLinkedQueue<String> concurrent = new ConcurrentLinkedQueue<>();
        concurrent.offer(\"x\"); concurrent.offer(\"y\");
        System.out.println(concurrent.poll()); // x
    }
}`,
      codeLanguage: "java",
      explanation:
        "Queue branches into Deque (double-ended), BlockingQueue (producer/consumer with put/take), TransferQueue (wait-for-consumer); pick by concurrency needs.",
    },
  ],
  meta: {
    q145: { difficulty: "medium", priority: "high", tags: ["linkedlist", "deque"], relatedQuestionIds: ["q144", "q138"], estimatedReadMinutes: 3 },
    q146: { difficulty: "easy", priority: "very-high", tags: ["set", "collection"], relatedQuestionIds: ["q147", "q150"], estimatedReadMinutes: 2 },
    q147: { difficulty: "easy", priority: "high", tags: ["set", "hierarchy"], relatedQuestionIds: ["q146", "q148"], estimatedReadMinutes: 2 },
    q148: { difficulty: "easy", priority: "high", tags: ["set", "sortedset"], relatedQuestionIds: ["q147", "q152"], estimatedReadMinutes: 2 },
    q149: { difficulty: "easy", priority: "high", tags: ["set", "implementations"], relatedQuestionIds: ["q150", "q151"], estimatedReadMinutes: 2 },
    q150: { difficulty: "easy", priority: "very-high", tags: ["hashset", "set"], relatedQuestionIds: ["q151", "q162"], estimatedReadMinutes: 2 },
    q151: { difficulty: "easy", priority: "high", tags: ["linkedhashset", "set"], relatedQuestionIds: ["q150", "q164"], estimatedReadMinutes: 2 },
    q152: { difficulty: "medium", priority: "very-high", tags: ["treeset", "sortedset"], relatedQuestionIds: ["q148", "q153"], estimatedReadMinutes: 3 },
    q153: { difficulty: "medium", priority: "high", tags: ["navigableset", "treeset"], relatedQuestionIds: ["q152", "q156"], estimatedReadMinutes: 3 },
    q154: { difficulty: "easy", priority: "high", tags: ["queue", "interface"], relatedQuestionIds: ["q155", "q156"], estimatedReadMinutes: 2 },
    q155: { difficulty: "medium", priority: "very-high", tags: ["queue", "deque", "blocking"], relatedQuestionIds: ["q154", "q156"], estimatedReadMinutes: 3 },
  },
});