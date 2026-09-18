import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Collections - global questions 156-166.
 * Focus: Deque, BlockingQueue, PriorityQueue, BlockingQueue implementations,
 * Map / SortedMap, HashMap, HashMap methods, TreeMap, NavigableMap,
 * and the java.util.Collections utility class.
 */
export const chunk16CollectionsC = defineChunk({
  topic: "collections",
  questions: [
    {
      id: "q156",
      question: "Explain about the Deque interface?",
      answer:
        "The Deque interface is a double-ended queue that supports insertion, removal and inspection of elements at both the head and the tail. It is a sub-interface of Queue, is pronounced 'deck', and is the modern replacement for the legacy java.util.Stack class because ArrayDeque implements push and pop with much better performance.\n\n" +
        "**Key methods you should be ready to name in pairs:**\n\n" +
        "- **Insert**: addFirst(e), addLast(e), offerFirst(e), offerLast(e) - the *offer* variants return false instead of throwing when the queue is bounded and full.\n" +
        "- **Remove**: removeFirst(), removeLast(), pollFirst(), pollLast() - the *poll* variants return null instead of throwing when empty.\n" +
        "- **Examine**: getFirst(), getLast(), peekFirst(), peekLast() - the *peek* variants also return null instead of throwing.\n" +
        "- **Stack convenience**: push(e) maps to addFirst, pop() maps to removeFirst.\n\n" +
        "**Implementations and when to use them:**\n\n" +
        "- **ArrayDeque** is the default: a resizable circular array, no null elements, faster than LinkedList for almost every workload and acceptable as either queue or stack.\n" +
        "- **LinkedList** is still a Deque but the per-node allocation and boxing overhead make it slower in practice.\n" +
        "- **ConcurrentLinkedDeque** is the lock-free variant for multi-threaded producers and consumers.\n\n" +
        "A common interview trap is to reach for java.util.Stack, which extends Vector and is therefore synchronised and slow. ArrayDeque replaces it cleanly: push and pop give stack semantics, peek gives the top, and the data structure is not legacy.",
      code: `import java.util.ArrayDeque;
import java.util.Deque;

public class DequeDemo {
    public static void main(String[] args) {
        Deque<String> deck = new ArrayDeque<>();

        // Use it as a queue: FIFO via offerLast / pollFirst
        deck.offerLast("first");          // tail
        deck.offerLast("second");
        System.out.println("Peek head : " + deck.peekFirst());   // first
        System.out.println("Poll head : " + deck.pollFirst());   // first
        System.out.println("Poll head : " + deck.pollFirst());   // second

        // Use the same instance as a stack: LIFO via push / pop
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        while (!stack.isEmpty()) {
            System.out.println("pop : " + stack.pop());          // 3, 2, 1
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Deque is double-ended; use ArrayDeque over legacy Stack for stack semantics because Stack is synchronized and slow.",
    },
    {
      id: "q157",
      question: "Explain the BlockingQueue interface?",
      answer:
        "The BlockingQueue interface is a Queue that adds blocking behaviour to its insert and remove operations, which makes it the canonical structure for the producer/consumer pattern. Threads coordinate work using only the queue API, so they do not need explicit locks or busy-wait loops.\n\n" +
        "**What blocking actually means:**\n\n" +
        "- **put(e)** waits until space is available in a bounded queue, never throwing IllegalStateException on a full queue.\n" +
        "- **take()** waits until an element is available, never returning null on an empty queue.\n" +
        "- **offer(e, timeout, unit)** and **poll(timeout, unit)** are the timed variants that block for at most the given duration and then return false or null instead of waiting forever.\n" +
        "- **add(e)**, **offer(e)**, **poll()**, **peek()** are inherited from Queue and still throw or return immediately when capacity or emptiness is the issue.\n\n" +
        "**Why this matters for interviewers:** a producer and a consumer can coordinate work using only the queue API. The producer calls put to publish work; the consumer calls take to consume it. The JVM parks the waiting thread, so no CPU is burned spinning. This pattern underpins ThreadPoolExecutor with a bounded queue, ExecutorCompletionService and most reactive pipelines.\n\n" +
        "Two rules to remember: BlockingQueue is thread-safe by contract but most implementations forbid null elements, and the bulk operations addAll and remainingCapacity follow the same blocking semantics as the single-element methods.",
      code: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

public class ProducerConsumer {
    public static void main(String[] args) throws InterruptedException {
        // Bounded queue of capacity 2: producer blocks when full
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(2);

        new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    queue.put(i);                        // blocks if queue is full
                    System.out.println("produced " + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "producer").start();

        new Thread(() -> {
            try {
                while (true) {
                    Integer item = queue.take();         // blocks if queue is empty
                    System.out.println("consumed " + item);
                    TimeUnit.MILLISECONDS.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "consumer").start();
    }
}`,
      codeLanguage: "java",
      explanation:
        "BlockingQueue blocks on put and take for producer-consumer coordination; bounded queues prevent runaway memory, and nulls are forbidden.",
    },
    {
      id: "q158",
      question: "What is a priorityQueue?",
      answer:
        "PriorityQueue is an unbounded queue that orders elements according to natural ordering or by a Comparator supplied at construction time. Internally it is a binary min-heap stored as an array, so the head is always the smallest element as defined by the comparator.\n\n" +
        "**Operations and their cost:**\n\n" +
        "- **offer(e)** and **add(e)** insert in O(log n) time, bubbling the new element up to maintain the heap invariant.\n" +
        "- **poll()** removes and returns the head in O(log n), and the heap is reordered.\n" +
        "- **peek()** reads the head in O(1) without removing it.\n" +
        "- **remove(Object)** and **contains(Object)** are O(n) because they scan the underlying array.\n" +
        "- Iteration is **not** sorted: the iterator walks the internal array in heap-storage order, not priority order.\n\n" +
        "**Important rules for interviews:**\n\n" +
        "- Null elements are not permitted because the queue cannot decide the order of null.\n" +
        "- The queue is not thread-safe; use PriorityBlockingQueue when concurrent producers and consumers are involved.\n" +
        "- Size grows automatically - there is no capacity limit, only available memory.\n" +
        "- For a max-heap, supply Comparator.reverseOrder() instead of relying on natural ordering.\n\n" +
        "A common pitfall is iterating and expecting sorted output. The contract guarantees nothing about iteration order; the heap invariant only constrains the head. If you need sorted traversal, drain with poll() or wrap with stream().sorted().toList().",
      code: `import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

public class PriorityQueueDemo {
    public static void main(String[] args) {
        // Min-heap by natural order of Integer
        PriorityQueue<Integer> min = new PriorityQueue<>();
        min.offer(5);
        min.offer(1);
        min.offer(3);
        min.offer(2);

        System.out.println("peek   : " + min.peek());            // 1, the smallest
        System.out.print("drain  : ");
        while (!min.isEmpty()) {
            System.out.print(min.poll() + " ");                   // 1 2 3 5
        }
        System.out.println();

        // Max-heap via reverseOrder
        PriorityQueue<Integer> max = new PriorityQueue<>(Comparator.reverseOrder());
        List.of(5, 1, 3, 2).forEach(max::offer);
        System.out.println("max    : " + max.peek());            // 5
    }
}`,
      codeLanguage: "java",
      explanation:
        "PriorityQueue is a binary min-heap with O(log n) insert and poll; iteration order is not sorted, and nulls are forbidden.",
    },
    {
      id: "q159",
      question: "Can you give example implementations of the BlockingQueue interface?",
      answer:
        "Java ships six mainstream implementations of BlockingQueue, and the choice between them is a classic interview question because each one models a different workload.\n\n" +
        "**Bounded, array-backed:**\n\n" +
        "- **ArrayBlockingQueue** has a fixed capacity set at construction. It uses a single lock for both putters and takers, so contention grows with thread count, but it is the simplest choice when you need a hard upper bound on memory.\n\n" +
        "**Optionally bounded, linked:**\n\n" +
        "- **LinkedBlockingQueue** is the most common producer/consumer choice. Without a capacity it grows without bound; with a capacity it uses two independent locks for putters and takers, giving better throughput under mixed traffic.\n\n" +
        "**Unbounded, ordered:**\n\n" +
        "- **PriorityBlockingQueue** is the concurrent version of PriorityQueue, with an unbounded binary heap.\n\n" +
        "**Specialised queues:**\n\n" +
        "- **DelayQueue** holds Delayed elements that become eligible only after their delay has elapsed, so take() blocks until an element expires. It powers scheduled task execution.\n" +
        "- **SynchronousQueue** has zero capacity: put hands the element directly to a waiting take. It is the default for newFixedThreadPool and gives a true synchronous rendezvous.\n" +
        "- **LinkedTransferQueue** combines LinkedBlockingQueue with the transfer() method that hands an element directly to a waiting consumer instead of enqueuing.\n\n" +
        "Pick ArrayBlockingQueue for a hard memory bound, LinkedBlockingQueue for a typical worker pool, SynchronousQueue for direct hand-offs, and DelayQueue for scheduled or time-based retries.",
      code: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.LinkedTransferQueue;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;

public class BlockingQueueImplementations {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Integer> bounded = new ArrayBlockingQueue<>(2);
        bounded.put(1); bounded.put(2);
        System.out.println("ArrayBlockingQueue     = " + bounded);

        BlockingQueue<Integer> linked = new LinkedBlockingQueue<>();
        linked.put(10); linked.put(20);
        System.out.println("LinkedBlockingQueue    = " + linked);

        BlockingQueue<Integer> prio = new PriorityBlockingQueue<>();
        for (int v : new int[]{3, 1, 2}) prio.offer(v);
        System.out.println("PriorityBlockingQueue  = " + prio.poll()); // 1

        BlockingQueue<String> handOff = new SynchronousQueue<>();
        new Thread(() -> { try { handOff.put("hello"); } catch (InterruptedException ignored) {} }).start();
        System.out.println("SynchronousQueue       = " + handOff.take());

        BlockingQueue<String> transfer = new LinkedTransferQueue<>();
        new Thread(() -> transfer.offer("hi")).start();
        System.out.println("LinkedTransferQueue    = " + transfer.poll(1, TimeUnit.SECONDS));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Pick by workload: ArrayBlockingQueue for bounded memory, LinkedBlockingQueue for pools, SynchronousQueue for direct hand-off, DelayQueue for scheduled work.",
    },
    {
      id: "q160",
      question: "Can you briefly explain about the Map interface?",
      answer:
        "The Map<K,V> interface models a keyed collection where each key maps to at most one value. Keys are unique as defined by their equals and hashCode contract; values are unconstrained and may repeat. Unlike the Collection hierarchy, Map is a separate root that does not extend Iterable directly, because the natural iteration semantics over a single value type do not fit a key/value structure.\n\n" +
        "**The three standard views every interview expects you to know:**\n\n" +
        "- **keySet()** returns a Set of the keys. Mutating the map mutates the set and vice versa.\n" +
        "- **values()** returns a Collection of the values. It is a view, not a copy.\n" +
        "- **entrySet()** returns a Set of Map.Entry<K,V> objects. Iterating entries is the canonical way to walk a map because both key and value are available without an extra lookup.\n\n" +
        "**Other points to mention:**\n\n" +
        "- The default Map implementation is HashMap, which gives constant-time get and put on average.\n" +
        "- IdentityHashMap compares keys by == instead of equals, useful for object-identity semantics in caches.\n" +
        "- SortedMap and its sub-interface NavigableMap add key ordering; ConcurrentMap adds atomic putIfAbsent-style operations.\n" +
        "- The map contains no null elements in some implementations (Hashtable, ConcurrentHashMap) and permits them in others (HashMap).\n\n" +
        "A common interview pitfall is to forget that mutating a view mutates the map. Removing through keySet().remove(k) really removes the entry from the underlying map, which can surprise people who think of the view as a copy.",
      code: `import java.util.HashMap;
import java.util.Map;

public class MapViewsDemo {
    public static void main(String[] args) {
        Map<String, Integer> stock = new HashMap<>();
        stock.put("apple", 5);
        stock.put("pear", 3);
        stock.put("kiwi", 7);

        System.out.println("keySet  : " + stock.keySet());
        System.out.println("values  : " + stock.values());

        // entrySet is the canonical way to iterate both key and value
        int total = 0;
        for (Map.Entry<String, Integer> e : stock.entrySet()) {
            total += e.getValue();
        }
        System.out.println("total   : " + total);

        // View mutations are live: removing through keySet really removes from the map
        stock.keySet().remove("kiwi");
        System.out.println("after rm: " + stock);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Map stores key/value pairs; iterating entrySet is canonical, and view mutations through keySet, values and entrySet propagate to the underlying map.",
    },
    {
      id: "q161",
      question: "What is difference between Map and sortedMap?",
      answer:
        "Map is the generic keyed-collection interface with no ordering guarantee. SortedMap extends Map and adds that its keys are kept in ascending order according to their natural ordering or by a Comparator supplied at construction time. SortedMap is a stepping stone to NavigableMap, which adds richer navigation operations.\n\n" +
        "**Methods SortedMap adds that Map does not have:**\n\n" +
        "- **comparator()** returns the Comparator, or null if natural ordering is used.\n" +
        "- **firstKey()** and **lastKey()** return the smallest and largest keys, throwing NoSuchElementException if the map is empty.\n" +
        "- **headMap(toKey)**, **subMap(fromKey, toKey)**, **tailMap(fromKey)** return range views over the map.\n" +
        "- The keySet() view returned by a SortedMap is a SortedSet and supports ordered iteration.\n\n" +
        "**Why this distinction matters:**\n\n" +
        "- HashMap and Hashtable are implementations of Map and give no ordering. Iterating them returns keys in bucket order, not insertion order, and certainly not in sorted order.\n" +
        "- TreeMap is the canonical SortedMap and NavigableMap implementation. LinkedHashMap preserves insertion order and is a Map, not a SortedMap.\n" +
        "- ConcurrentSkipListMap is a concurrent SortedMap and NavigableMap.\n\n" +
        "A frequent interview trap is to assume that HashMap iterates in insertion order: it does not. Use LinkedHashMap for insertion order and TreeMap for sorted order. Range queries against TreeMap, like `headMap(100)`, are O(log n) at the boundary and live views, so they update as the map changes.",
      code: `import java.util.HashMap;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

public class MapVsSortedMapDemo {
    public static void main(String[] args) {
        // Map: no order guarantee
        Map<String, Integer> raw = new HashMap<>();
        raw.put("banana", 2); raw.put("apple", 1); raw.put("cherry", 3);
        System.out.println("HashMap keys    : " + raw.keySet());

        // SortedMap (via NavigableMap / TreeMap): always ascending by key
        NavigableMap<String, Integer> sorted = new TreeMap<>(raw);
        System.out.println("TreeMap keys    : " + sorted.keySet());

        // Range views are live
        System.out.println("headMap b       : " + sorted.headMap("b"));
        System.out.println("subMap a..c     : " + sorted.subMap("a", "c"));
        System.out.println("firstKey/lastKey: " + sorted.firstKey() + "/" + sorted.lastKey());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Map has no ordering; SortedMap adds comparator, firstKey/lastKey, and range views; TreeMap is the canonical implementation.",
    },
    {
      id: "q162",
      question: "What is a HashMap?",
      answer:
        "HashMap is the default general-purpose Map implementation in the JDK. It is hash-table-based, has constant-time average get and put, allows one null key and any number of null values, and is not thread-safe. Use it as the default unless you need ordering, concurrent access, or sorted navigation.\n\n" +
        "**How it works under the hood, summarised for an interview:**\n\n" +
        "- The map stores entries in an array of buckets whose length is always a power of two.\n" +
        "- Each key's hashCode() is spread with a secondary hash, then masked to a bucket index.\n" +
        "- Each bucket holds either a linked list of nodes or, when the bucket grows past TREEIFY_THRESHOLD = 8, a red-black tree (since Java 8). This bounds the worst-case look-up in a poorly-distributed hash to O(log n) instead of O(n).\n" +
        "- The default initial capacity is 16, the default load factor is 0.75, and the table is resized to double its size when the load factor is exceeded.\n" +
        "- Iteration is best-effort and mod-count-based: ConcurrentModificationException is thrown if the map is structurally modified during iteration, unless the iterator's own remove() is used.\n\n" +
        "**Rules every interviewer expects you to know:**\n\n" +
        "- If two keys are equal by equals(), they must produce the same hashCode() or lookups break.\n" +
        "- Override hashCode() whenever you override equals(), and vice versa.\n" +
        "- Capacity should be set to expectedSize / 0.75 + 1 in performance-sensitive code to avoid resizing.\n" +
        "- HashMap is not thread-safe: use ConcurrentHashMap for concurrent reads and writes.\n\n" +
        "LinkedHashMap is a subclass adding a doubly-linked list of entries, which gives predictable iteration order in insertion or access mode.",
      code: `import java.util.HashMap;
import java.util.Map;

public class HashMapInternalsDemo {
    public static void main(String[] args) {
        // Default capacity 16, load factor 0.75
        Map<String, Integer> map = new HashMap<>();
        map.put("one", 1);
        map.put("two", 2);
        map.put("null-key", 0);              // one null key allowed
        map.put(null, -1);                   // any number of null values allowed

        // Equal keys must produce the same hashCode or lookups break
        Integer v = map.get(new String("one"));
        System.out.println("get new one    : " + v);

        // forEach in Java 8+
        map.forEach((k, val) -> System.out.println(k + " -> " + val));

        // Pre-size to avoid resize: (expected / 0.75) + 1
        Map<Integer, String> sized = new HashMap<>((int) (1_000_000 / 0.75f) + 1);
        sized.put(1, "x");
        System.out.println("sized size     : " + sized.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "HashMap is hash-table based with one null key allowed, average O(1) get/put, and treeified buckets since Java 8 for collision resistance.",
    },
    {
      id: "q163",
      question: "What are the different methods in a Hash Map?",
      answer:
        "The HashMap API is large, but interviews focus on the operations you actually use: lookup, conditional insertion, atomic updates, and view iteration. Naming the right method for the right job is what separates a senior answer from a junior one.\n\n" +
        "**Lookup and basic CRUD:**\n\n" +
        "- **get(key)**, **containsKey(key)**, **containsValue(value)** are O(1) average for the key check, O(n) for the value scan.\n" +
        "- **put(key, value)**, **putAll(other)**, **remove(key)**, **size()**, **isEmpty()**, **clear()** are the basic mutators.\n\n" +
        "**Java 8 default methods worth naming:**\n\n" +
        "- **getOrDefault(key, fallback)** returns the fallback instead of null when the key is missing, eliminating null checks.\n" +
        "- **putIfAbsent(key, value)** inserts only when the key is not already mapped; it is the atomic equivalent of `if (!map.containsKey(k)) map.put(k, v)`.\n" +
        "- **compute(key, BiFunction)** recalculates the value from the key and the current value (or null if absent) and stores the result.\n" +
        "- **computeIfAbsent(key, Function)** computes and stores only when the key is absent, ideal for memoised factories like `computeIfAbsent(k, k2 -> new ArrayList<>()).add(v)`.\n" +
        "- **computeIfPresent(key, BiFunction)** recomputes only when the key exists.\n" +
        "- **merge(key, value, BiFunction)** inserts or merges using the supplied function to resolve collisions, great for counters and accumulators.\n" +
        "- **replace(key, value)** and **replace(key, oldValue, newValue)** swap values conditionally.\n\n" +
        "**Views and bulk iteration:**\n\n" +
        "- **keySet()**, **values()**, **entrySet()** are live views.\n" +
        "- **forEach(BiConsumer)** and **replaceAll(BiFunction)** are the Java 8 iteration helpers.\n\n" +
        "Use putIfAbsent over containsKey-then-put to avoid a race, and use computeIfAbsent to lazily initialise computed values.",
      code: `import java.util.HashMap;
import java.util.Map;

public class HashMapMethodsDemo {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();

        // merge: increment counter or initialise to 1
        for (String word : "the quick brown fox jumps over the lazy dog".split(" ")) {
            counts.merge(word, 1, Integer::sum);
        }

        // computeIfPresent
        counts.computeIfPresent("the", (k, v) -> v * 10);    // multiply by 10
        System.out.println("the         : " + counts.get("the"));

        // getOrDefault avoids null checks
        System.out.println("missing     : " + counts.getOrDefault("nope", 0));

        // putIfAbsent is atomic when the key is missing
        counts.putIfAbsent("fox", 99);
        System.out.println("fox         : " + counts.get("fox"));

        // replaceAll and forEach for bulk iteration
        counts.replaceAll((k, v) -> v + 1);
        counts.forEach((k, v) -> System.out.println(k + "=" + v));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name putIfAbsent, computeIfAbsent, computeIfPresent and merge for thread-safety-aware updates; use getOrDefault to avoid null checks.",
    },
    {
      id: "q164",
      question: "What is a TreeMap? How is different from a HashMap?",
      answer:
        "TreeMap and HashMap are both Map implementations but solve different problems. HashMap gives constant-time average access with no ordering; TreeMap gives log-time access with keys always in sorted order.\n\n" +
        "**HashMap in one line**: hash table, O(1) average get and put, no ordering, permits one null key and any number of null values, not thread-safe.\n\n" +
        "**TreeMap in one line**: red-black tree, O(log n) get, put and remove, sorted by natural order or by a Comparator supplied at construction time, no null keys unless the comparator can accept them, not thread-safe. For concurrent code use ConcurrentSkipListMap, which is the concurrent analogue.\n\n" +
        "**What TreeMap gives you that HashMap does not:**\n\n" +
        "- **firstKey()**, **lastKey()**, **lowerKey(k)**, **floorKey(k)**, **ceilingKey(k)**, **higherKey(k)** for neighbour lookups.\n" +
        "- **headMap(k)**, **tailMap(k)**, **subMap(a, b)** range views, navigable via inclusive flags.\n" +
        "- **descendingMap()** and **descendingKeySet()** for reverse iteration.\n" +
        "- A predictable iteration order that matches the comparator.\n\n" +
        "**Practical guidance:** use HashMap when you do not need order, LinkedHashMap when you need insertion or access order, and TreeMap when you need sorted keys, range queries or nearest-neighbour navigation. Insertion into a TreeMap is more expensive than into a HashMap, and TreeMap allocates a node per entry plus tree-rebalancing overhead.",
      code: `import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class TreeMapVsHashMapDemo {
    public static void main(String[] args) {
        // HashMap: O(1) average, no ordering
        Map<Integer, String> raw = new HashMap<>();
        raw.put(3, "three"); raw.put(1, "one"); raw.put(2, "two");
        System.out.println("HashMap keys   : " + raw.keySet());        // arbitrary

        // TreeMap: O(log n), always sorted
        Map<Integer, String> sorted = new TreeMap<>(raw);
        System.out.println("TreeMap keys   : " + sorted.keySet());     // [1, 2, 3]

        // NavigableMap-style neighbour lookups
        TreeMap<Integer, String> nav = (TreeMap<Integer, String>) sorted;
        System.out.println("firstKey       : " + nav.firstKey());
        System.out.println("higherKey(1)   : " + nav.higherKey(1));
        System.out.println("floorKey(2)    : " + nav.floorKey(2));
        System.out.println("headMap(2)     : " + nav.headMap(2));
    }
}`,
      codeLanguage: "java",
      explanation:
        "HashMap is O(1) unordered with nulls allowed; TreeMap is O(log n) sorted, supports range views and neighbour lookups, and forbids null keys.",
    },
    {
      id: "q165",
      question: "Can you give an example of implementation of navigableMap interface?",
      answer:
        "The two concrete implementations of NavigableMap in the JDK are TreeMap and ConcurrentSkipListMap. TreeMap is the general-purpose, non-concurrent version; ConcurrentSkipListMap is the concurrent, lock-free version based on skip lists, and is the go-to choice when you need sorted keys under multi-threaded load.\n\n" +
        "**TreeMap highlights:**\n\n" +
        "- Backed by a red-black tree, so put, get and remove are O(log n).\n" +
        "- Supports lower, floor, ceiling and higher variants for both keys and entries, plus descendingMap and descendingKeySet.\n" +
        "- Range views like headMap, tailMap and subMap are live and can be inclusive or exclusive on either end.\n" +
        "- Permits null values but not null keys unless the comparator can handle them.\n\n" +
        "**ConcurrentSkipListMap highlights:**\n\n" +
        "- A concurrent NavigableMap with average O(log n) operations, internally a skip list with per-node CAS coordination, so writes do not block reads.\n" +
        "- Implements ConcurrentMap, so putIfAbsent, compute, merge and the replace family are atomic with respect to other threads.\n" +
        "- Slightly slower than ConcurrentHashMap for plain put and get because of the sorted invariant, but irreplaceable when you need sorted concurrent keys.\n\n" +
        "A common interview example is a price-or-time lookup: insert trades keyed by timestamp into a ConcurrentSkipListMap and ask for the highest trade at or before a given moment using floorEntry. TreeMap is the single-threaded counterpart and supports the same call.",
      code: `import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentSkipListMap;

public class NavigableMapDemo {
    public static void main(String[] args) {
        // Single-threaded: TreeMap
        NavigableMap<Long, String> trades = new TreeMap<>();
        trades.put(100L, "buy");
        trades.put(150L, "sell");
        trades.put(120L, "buy");
        trades.put(180L, "sell");

        // Sorted view, inclusive/exclusive range views
        System.out.println("headMap(150,false)  : " + trades.headMap(150L, false));
        System.out.println("subMap 100..150     : " + trades.subMap(100L, true, 150L, true));
        System.out.println("floorEntry(160)     : " + trades.floorEntry(160L));
        System.out.println("descendingKeys      : " + trades.descendingKeySet());

        // Concurrent counterpart with the same API
        NavigableMap<Long, String> concurrent = new ConcurrentSkipListMap<>(trades);
        System.out.println("concurrent floor    : " + concurrent.floorEntry(160L));
    }
}`,
      codeLanguage: "java",
      explanation:
        "TreeMap is the standard NavigableMap, ConcurrentSkipListMap is its concurrent sibling - both support floor/ceiling and inclusive range views.",
    },
    {
      id: "q166",
      question: "What are the static methods present in the collections class?",
      answer:
        "java.util.Collections is a utility class packed with static methods that wrap, query, modify and produce instances of the standard collection interfaces. Its methods fall into a handful of named groups that are worth memorising for interviews.\n\n" +
        "**Querying and mutating lists:**\n\n" +
        "- **sort** and **reverse** for in-place ordering.\n" +
        "- **binarySearch** requires the list to already be sorted and returns the insertion index with a negative value when absent.\n" +
        "- **shuffle**, **swap**, **rotate**, **fill**, **copy**, **replaceAll** rearrange elements in place.\n" +
        "- **min**, **max**, **frequency**, **indexOfSubList**, **lastIndexOfSubList**, **disjoint** answer questions about contents.\n\n" +
        "**Wrapping and producing collections:**\n\n" +
        "- **unmodifiableList / Set / Map / Collection** give read-only views that throw UnsupportedOperationException on mutation.\n" +
        "- **synchronizedList / Set / Map** give thread-safe wrappers built on a single lock - slower than ConcurrentHashMap but interoperable with legacy synchronised APIs.\n" +
        "- **emptyList / emptySet / emptyMap / emptyIterator / emptySortedSet / emptySortedMap** return immutable empty instances, ideal as no-op return values that avoid null.\n" +
        "- **singleton / singletonList / singletonMap** return immutable single-element instances.\n" +
        "- **checkedList / Set / Map / Queue** enforce the element type at runtime, useful when generics are erased and untrusted code can add to a list.\n" +
        "- **asLifoQueue** turns a Deque into a LIFO Queue.\n" +
        "- **newSetFromMap(Map)** builds a Set backed by a given Map, useful for identity or weak-reference sets.\n" +
        "- **enumeration(Collection)** and the Java 8 **replaceAll(List, ...)** close the gap with streams for legacy code.\n\n" +
        "A common confusion to defuse: Collections is the utility class, while Collection is the root interface. They are easy to mix up in conversation.",
      code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CollectionsUtilityDemo {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(5, 1, 4, 2, 3));
        Collections.sort(nums);
        System.out.println("sorted         : " + nums);

        Collections.reverse(nums);
        System.out.println("reversed       : " + nums);

        System.out.println("binarySearch 2 : " + Collections.binarySearch(nums, 2));
        System.out.println("frequency of 2 : " + Collections.frequency(nums, 2));

        // Wrappers
        List<Integer> readOnly = Collections.unmodifiableList(nums);
        List<Integer> safe    = Collections.synchronizedList(new ArrayList<>(nums));
        List<Integer> typed   = Collections.checkedList(new ArrayList<>(), Integer.class);

        // Singletons and empties
        Set<String> single         = Collections.singleton("only");
        Map<String, Integer> emptyM = Collections.emptyMap();

        // newSetFromMap: identity-backed Set (different 'a' and new 'a')
        Set<String> identity = Collections.newSetFromMap(new IdentityHashMap<>());
        identity.add("a"); identity.add(new String("a"));
        System.out.println("identity size  : " + identity.size()); // 2
    }
}`,
      codeLanguage: "java",
      explanation:
        "Collections exposes sort, shuffle, unmodifiable and synchronized wrappers, singleton and empty factories, checkedList, asLifoQueue, and newSetFromMap.",
    },
  ],
  meta: {
    q156: {
      difficulty: "easy",
      priority: "high",
      tags: ["deque", "queue", "stack"],
      relatedQuestionIds: ["q157", "q158"],
      estimatedReadMinutes: 3,
    },
    q157: {
      difficulty: "medium",
      priority: "high",
      tags: ["blockingqueue", "concurrency", "producer-consumer"],
      relatedQuestionIds: ["q156", "q158", "q159"],
      estimatedReadMinutes: 4,
    },
    q158: {
      difficulty: "medium",
      priority: "high",
      tags: ["priorityqueue", "heap", "collection"],
      relatedQuestionIds: ["q157", "q159"],
      estimatedReadMinutes: 3,
    },
    q159: {
      difficulty: "medium",
      priority: "high",
      tags: ["blockingqueue", "concurrency", "implementations"],
      relatedQuestionIds: ["q157", "q158"],
      estimatedReadMinutes: 4,
    },
    q160: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["map", "interface", "collection"],
      relatedQuestionIds: ["q161", "q162", "q163"],
      estimatedReadMinutes: 3,
    },
    q161: {
      difficulty: "easy",
      priority: "high",
      tags: ["map", "sortedmap", "ordering"],
      relatedQuestionIds: ["q160", "q164"],
      estimatedReadMinutes: 3,
    },
    q162: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["hashmap", "hashtable", "collection"],
      relatedQuestionIds: ["q160", "q163"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q163: {
      difficulty: "medium",
      priority: "high",
      tags: ["hashmap", "api", "java8"],
      relatedQuestionIds: ["q162", "q160"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q164: {
      difficulty: "medium",
      priority: "high",
      tags: ["treemap", "hashmap", "comparison"],
      relatedQuestionIds: ["q162", "q161", "q165"],
      estimatedReadMinutes: 4,
    },
    q165: {
      difficulty: "medium",
      priority: "medium",
      tags: ["navigablemap", "treemap", "concurrency"],
      relatedQuestionIds: ["q164", "q161"],
      estimatedReadMinutes: 3,
    },
    q166: {
      difficulty: "easy",
      priority: "high",
      tags: ["collections", "utility", "static-methods"],
      relatedQuestionIds: ["q160", "q162"],
      estimatedReadMinutes: 4,
    },
  },
});