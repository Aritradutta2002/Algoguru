import { ContentSection } from "./recursionContent";

export const javaCollectionsContent: ContentSection[] = [
  {
    id: "col-intro",
    title: "Collections Overview & Hierarchy",
    difficulty: "Easy",
    theory: [
      "The **Java Collections Framework (JCF)** is a unified architecture introduced in Java 2 for representing and manipulating groups of objects. It provides **interfaces** (abstract data types), **implementations** (concrete data structures), and **algorithms** (sorting, searching, shuffling) — all in `java.util`.",
      "**Why Collections over Arrays?** Arrays have fixed size (can't grow/shrink), no built-in search/sort/insert/delete, no type-safe generics before Java 5, and no utility methods. Collections are **dynamic**, **type-safe with generics**, and come with powerful built-in algorithms.",
      "The root interface is **Iterable<E>** (enables for-each loops) → **Collection<E>** (basic operations: add, remove, contains, size) → three main sub-interfaces:",
      "**List<E>** — Ordered (maintains insertion order), indexed (0-based random access), allows duplicates. Implementations: ArrayList (dynamic array), LinkedList (doubly-linked list), Vector (legacy, synchronized).",
      "**Set<E>** — No duplicates allowed, uses `equals()` and `hashCode()` for uniqueness. Implementations: HashSet (O(1) lookup, unordered), LinkedHashSet (insertion order), TreeSet (sorted, Red-Black Tree).",
      "**Queue<E>** — FIFO ordering (or priority-based). Implementations: PriorityQueue (min-heap), ArrayDeque (resizable circular array — fastest stack/queue), LinkedList (also implements Deque).",
      "**Map<K,V>** — Separate hierarchy (does NOT extend Collection). Stores key-value pairs with unique keys. Implementations: HashMap (O(1) lookup, unordered), LinkedHashMap (insertion/access order), TreeMap (sorted keys, Red-Black Tree).",
      "**Generics & Type Safety:** All collections are generic — `List<String>` ensures only String objects can be added. Without generics (raw types), you'd need unsafe casting: `String s = (String) list.get(0)`. Always specify the type parameter.",
      "**Fail-fast vs Fail-safe Iterators:** Standard collections (ArrayList, HashMap) use **fail-fast** iterators that throw `ConcurrentModificationException` if the collection is modified during iteration (except via the iterator's own `remove()`). Concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList) use **fail-safe** iterators that work on a snapshot.",
      "**Choosing the Right Collection:** This is a critical skill. Consider: Do you need ordering? Uniqueness? Key-value mapping? Random access? Sorted iteration? Thread safety? The answer determines which collection to use."
    ],
    diagram: {
      type: "hierarchy",
      title: "Collections Framework Hierarchy",
      data: [
        {
          label: "Iterable<E>",
          color: "muted",
          children: [
            {
              label: "Collection<E>",
              color: "primary",
              children: [
                {
                  label: "List<E> — ordered, duplicates",
                  color: "info",
                  children: [
                    { label: "ArrayList", color: "info" },
                    { label: "LinkedList", color: "info" },
                    { label: "Vector → Stack", color: "info" }
                  ]
                },
                {
                  label: "Set<E> — no duplicates",
                  color: "success",
                  children: [
                    { label: "HashSet", color: "success" },
                    { label: "LinkedHashSet", color: "success" },
                    { label: "TreeSet (SortedSet → NavigableSet)", color: "success" }
                  ]
                },
                {
                  label: "Queue<E> — FIFO",
                  color: "accent",
                  children: [
                    { label: "PriorityQueue", color: "accent" },
                    { label: "ArrayDeque (Deque)", color: "accent" },
                    { label: "LinkedList (Deque)", color: "accent" }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: "Map<K,V> — separate hierarchy",
          color: "warning",
          children: [
            { label: "HashMap", color: "warning" },
            { label: "LinkedHashMap", color: "warning" },
            { label: "TreeMap (SortedMap → NavigableMap)", color: "warning" },
            { label: "Hashtable → Properties", color: "warning" },
            { label: "EnumMap", color: "warning" }
          ]
        }
      ]
    },
    keyPoints: [
      "Collection is the root interface; Map is separate",
      "Use generics (Collection<String>) for type safety",
      "Collections store object references, not primitives",
      "Choose the right implementation based on your access pattern"
    ],
    code: [
      {
        title: "Collections Hierarchy — Basic Usage",
        language: "java",
        content: `import java.util.*;

public class CollectionsDemo {
    public static void main(String[] args) {
        // List — ordered, allows duplicates
        List<String> list = new ArrayList<>();
        list.add("Apple");
        list.add("Banana");
        list.add("Apple"); // duplicates OK
        System.out.println("List: " + list); // [Apple, Banana, Apple]

        // Set — no duplicates
        Set<String> set = new HashSet<>();
        set.add("Apple");
        set.add("Banana");
        set.add("Apple"); // ignored
        System.out.println("Set: " + set); // [Apple, Banana]

        // Map — key-value pairs
        Map<String, Integer> map = new HashMap<>();
        map.put("Apple", 3);
        map.put("Banana", 5);
        System.out.println("Map: " + map); // {Apple=3, Banana=5}

        // Queue — FIFO
        Queue<String> queue = new LinkedList<>();
        queue.offer("First");
        queue.offer("Second");
        System.out.println("Poll: " + queue.poll()); // First
    }
}`
      },
      {
        title: "Collection Interface — Common Methods",
        language: "java",
        content: `import java.util.*;

public class CollectionMethods {
    public static void main(String[] args) {
        Collection<Integer> col = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        
        // Size & empty check
        System.out.println("Size: " + col.size());        // 5
        System.out.println("Empty: " + col.isEmpty());    // false
        
        // Contains
        System.out.println("Has 3: " + col.contains(3));  // true
        System.out.println("Has all [1,2]: " + col.containsAll(Arrays.asList(1, 2))); // true
        
        // Add & Remove
        col.add(6);                            // [1,2,3,4,5,6]
        col.remove(3);                         // removes first occurrence of 3
        col.removeAll(Arrays.asList(4, 5));    // removes 4 and 5
        col.retainAll(Arrays.asList(1, 2, 6)); // keeps only 1, 2, 6
        
        // Convert to array
        Object[] arr = col.toArray();
        Integer[] typed = col.toArray(new Integer[0]);
        
        // Stream (Java 8+)
        col.stream().filter(n -> n > 1).forEach(System.out::println);
        
        // Clear
        col.clear();
        System.out.println("After clear: " + col); // []
    }
}`
      }
    ],
    tip: "When in doubt: **ArrayList** for lists, **HashSet** for unique elements, **HashMap** for key-value, **ArrayDeque** for stacks/queues."
  },
  {
    id: "col-list",
    title: "ArrayList & LinkedList",
    difficulty: "Easy",
    theory: [
      "**ArrayList** is backed by a **dynamic array** (internally an `Object[]`). It provides O(1) amortized random access via index and O(1) amortized append. Insert/delete in the middle is O(n) because elements must be shifted.",
      "**ArrayList Internals:** Default initial capacity is **10**. When the array is full, it grows by **50%** (new capacity = old × 1.5). Growth involves creating a new larger array and copying all elements via `Arrays.copyOf()` — an O(n) operation. Pre-sizing with `new ArrayList<>(expectedSize)` avoids repeated resizing.",
      "**LinkedList** is a **doubly-linked list** — each node stores the element plus pointers to the previous and next nodes. Insert/delete at either end is O(1), but random access by index is O(n) because you must traverse from head or tail.",
      "**LinkedList** also implements **Deque<E>** (double-ended queue), so it can function as a stack (`push`/`pop`) or queue (`offer`/`poll`). However, **ArrayDeque** is faster for both use cases due to better cache locality.",
      "**Memory comparison:** ArrayList uses ~40% less memory than LinkedList. Each LinkedList node has ~40 bytes of overhead (two pointers + object header), while ArrayList stores only the element references contiguously. This also means ArrayList has better **CPU cache locality** — sequential elements are adjacent in memory, making iteration significantly faster.",
      "**When to use ArrayList (almost always):** Random access by index, iteration, appending at the end, sorting, binary search. ArrayList is the **default choice** in 95%+ of cases.",
      "**When to use LinkedList (rarely):** Frequent insertion/deletion at the beginning (ArrayList would shift all elements), implementing a queue/deque (though ArrayDeque is usually better), or when you need a node-based structure for algorithmic reasons.",
      "**Important Gotchas:** `Arrays.asList()` returns a fixed-size list backed by the array — you can modify elements but cannot add/remove. Use `new ArrayList<>(Arrays.asList(...))` for a mutable copy. `List.of()` (Java 9+) returns an **immutable** list. `subList()` returns a **view**, not a copy — modifications to the sublist affect the original.",
      "**Thread Safety:** Neither ArrayList nor LinkedList is thread-safe. Use `Collections.synchronizedList()` for simple thread safety, or `CopyOnWriteArrayList` for concurrent read-heavy workloads."
    ],
    code: [
      {
        title: "ArrayList — Common Operations",
        language: "java",
        content: `import java.util.*;

public class ArrayListDemo {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        
        // Add elements
        list.add(10);          // [10]
        list.add(20);          // [10, 20]
        list.add(1, 15);       // [10, 15, 20] — insert at index 1
        
        // Access
        int val = list.get(0);         // 10
        int size = list.size();        // 3
        boolean has = list.contains(15); // true
        int idx = list.indexOf(20);    // 2
        
        // Modify
        list.set(0, 5);               // [5, 15, 20]
        list.remove(Integer.valueOf(15)); // [5, 20] — remove by value
        list.remove(0);                // [20] — remove by index
        
        // Bulk operations
        list.addAll(Arrays.asList(1, 2, 3)); // [20, 1, 2, 3]
        
        // Sort
        Collections.sort(list);       // [1, 2, 3, 20]
        list.sort(Comparator.reverseOrder()); // [20, 3, 2, 1]
        
        // Iterate
        for (int x : list) System.out.print(x + " ");
        
        // Convert to array
        Integer[] arr = list.toArray(new Integer[0]);
        
        // SubList (returns a VIEW, not a copy)
        List<Integer> sub = list.subList(0, 2); // [20, 3]
        // sub modifications reflect in original list!
    }
}`
      },
      {
        title: "LinkedList — Deque Operations",
        language: "java",
        content: `import java.util.*;

public class LinkedListDemo {
    public static void main(String[] args) {
        LinkedList<String> ll = new LinkedList<>();
        
        // List operations
        ll.add("B");
        ll.add("C");
        
        // Deque operations — add at both ends
        ll.addFirst("A");    // [A, B, C]
        ll.addLast("D");     // [A, B, C, D]
        
        // Peek without removing
        String first = ll.getFirst(); // A
        String last = ll.getLast();   // D
        
        // Remove from ends
        ll.removeFirst();    // [B, C, D]
        ll.removeLast();     // [B, C]
        
        // Stack operations (LIFO)
        ll.push("X");       // [X, B, C]
        String top = ll.pop(); // X, list = [B, C]
        
        // Queue operations (FIFO)
        ll.offer("Y");      // [B, C, Y]
        String head = ll.poll(); // B, list = [C, Y]
        
        // Descending iterator
        Iterator<String> desc = ll.descendingIterator();
        while (desc.hasNext()) System.out.print(desc.next() + " "); // Y C
        
        System.out.println(ll); // [C, Y]
    }
}`
      },
      {
        title: "ArrayList Internals — Capacity & Growth",
        language: "java",
        content: `import java.util.*;

public class ArrayListInternals {
    public static void main(String[] args) {
        // Default capacity = 10
        ArrayList<Integer> list = new ArrayList<>();
        
        // Pre-allocate capacity (avoids resizing)
        ArrayList<Integer> optimized = new ArrayList<>(1000);
        
        // When size > capacity:
        // 1. New capacity = old * 1.5 (roughly)
        // 2. Arrays.copyOf() copies all elements to new array
        // 3. Old array becomes garbage
        
        // Tip: If you know the size, pre-allocate!
        int n = 100000;
        List<Integer> fast = new ArrayList<>(n);
        for (int i = 0; i < n; i++) fast.add(i);
        
        // Trim to exact size (frees unused capacity)
        ((ArrayList<Integer>) fast).trimToSize();
        
        // ensureCapacity — pre-grow before bulk add
        ArrayList<Integer> bulk = new ArrayList<>();
        bulk.ensureCapacity(50000);
        
        // Arrays.asList returns FIXED-SIZE list (backed by array)
        List<String> fixed = Arrays.asList("A", "B", "C");
        fixed.set(0, "X");    // OK — modifies underlying array
        // fixed.add("D");    // ❌ UnsupportedOperationException
        
        // To get a modifiable list:
        List<String> mutable = new ArrayList<>(Arrays.asList("A", "B", "C"));
        mutable.add("D"); // ✅ works
    }
}`
      }
    ],
    note: "**ArrayList** uses ~40% less memory than LinkedList because LinkedList stores two extra pointers per node."
  },
  {
    id: "col-set",
    title: "HashSet, LinkedHashSet & TreeSet",
    difficulty: "Easy",
    theory: [
      "**Set** stores **unique elements** only — duplicates are silently ignored",
      "**HashSet** — backed by HashMap, O(1) add/remove/contains, **no ordering guarantee**",
      "**LinkedHashSet** — maintains **insertion order**, slightly slower than HashSet",
      "**TreeSet** — backed by Red-Black Tree, elements stored in **sorted order**, O(log n) operations",
      "HashSet uses **hashCode()** and **equals()** to detect duplicates",
      "TreeSet requires elements to be **Comparable** or provide a **Comparator**",
      "**EnumSet** — specialized Set for enum types. Uses bit vector internally — **extremely fast** and memory efficient",
      "**When to use:** HashSet for fastest lookups, LinkedHashSet to preserve order, TreeSet when you need sorted iteration, EnumSet for enums",
      "Sets are perfect for: removing duplicates, membership testing, set operations (union, intersection)",
      "**TreeSet navigation:** `first()`, `last()`, `floor()`, `ceiling()`, `lower()`, `higher()`, `subSet()`, `headSet()`, `tailSet()`"
    ],
    code: [
      {
        title: "HashSet vs LinkedHashSet vs TreeSet",
        language: "java",
        content: `import java.util.*;

public class SetDemo {
    public static void main(String[] args) {
        // HashSet — no order guarantee
        Set<Integer> hashSet = new HashSet<>();
        hashSet.add(30); hashSet.add(10); hashSet.add(20);
        System.out.println("HashSet: " + hashSet); // unpredictable order

        // LinkedHashSet — insertion order
        Set<Integer> linkedSet = new LinkedHashSet<>();
        linkedSet.add(30); linkedSet.add(10); linkedSet.add(20);
        System.out.println("LinkedHashSet: " + linkedSet); // [30, 10, 20]

        // TreeSet — sorted order
        Set<Integer> treeSet = new TreeSet<>();
        treeSet.add(30); treeSet.add(10); treeSet.add(20);
        System.out.println("TreeSet: " + treeSet); // [10, 20, 30]

        // Duplicate handling
        boolean added = hashSet.add(10); // false — already exists
        System.out.println("Added duplicate? " + added);
    }
}`
      },
      {
        title: "Set Operations — Union, Intersection, Difference",
        language: "java",
        content: `import java.util.*;

public class SetOperations {
    public static void main(String[] args) {
        Set<Integer> a = new HashSet<>(Arrays.asList(1, 2, 3, 4));
        Set<Integer> b = new HashSet<>(Arrays.asList(3, 4, 5, 6));

        // Union (A ∪ B)
        Set<Integer> union = new HashSet<>(a);
        union.addAll(b);
        System.out.println("Union: " + union); // [1, 2, 3, 4, 5, 6]

        // Intersection (A ∩ B)
        Set<Integer> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        System.out.println("Intersection: " + intersection); // [3, 4]

        // Difference (A - B)
        Set<Integer> difference = new HashSet<>(a);
        difference.removeAll(b);
        System.out.println("Difference: " + difference); // [1, 2]

        // Symmetric Difference (A △ B) — in one but not both
        Set<Integer> symDiff = new HashSet<>(a);
        symDiff.addAll(b);
        Set<Integer> common = new HashSet<>(a);
        common.retainAll(b);
        symDiff.removeAll(common);
        System.out.println("Symmetric Diff: " + symDiff); // [1, 2, 5, 6]

        // Check subset
        Set<Integer> sub = new HashSet<>(Arrays.asList(1, 2));
        System.out.println("Is subset? " + a.containsAll(sub)); // true
        
        // Check disjoint (no common elements)
        System.out.println("Disjoint? " + Collections.disjoint(a, Set.of(7, 8))); // true
    }
}`
      },
      {
        title: "TreeSet — NavigableSet Operations",
        language: "java",
        content: `import java.util.*;

public class TreeSetNav {
    public static void main(String[] args) {
        TreeSet<Integer> ts = new TreeSet<>(Arrays.asList(10, 20, 30, 40, 50, 60));
        
        // Navigation
        System.out.println("First: " + ts.first());          // 10
        System.out.println("Last: " + ts.last());            // 60
        System.out.println("Floor(35): " + ts.floor(35));    // 30 (≤ 35)
        System.out.println("Ceiling(35): " + ts.ceiling(35)); // 40 (≥ 35)
        System.out.println("Lower(30): " + ts.lower(30));    // 20 (< 30)
        System.out.println("Higher(30): " + ts.higher(30));  // 40 (> 30)
        
        // Sub views
        System.out.println("HeadSet(<30): " + ts.headSet(30));        // [10, 20]
        System.out.println("TailSet(>=30): " + ts.tailSet(30));       // [30, 40, 50, 60]
        System.out.println("SubSet[20,50): " + ts.subSet(20, 50));    // [20, 30, 40]
        System.out.println("SubSet[20,50]: " + ts.subSet(20, true, 50, true)); // [20,30,40,50]
        
        // Poll (retrieve and remove)
        System.out.println("PollFirst: " + ts.pollFirst()); // 10
        System.out.println("PollLast: " + ts.pollLast());   // 60
        
        // Descending
        NavigableSet<Integer> desc = ts.descendingSet();
        System.out.println("Descending: " + desc); // [50, 40, 30, 20]
        
        // Custom comparator TreeSet
        TreeSet<String> byLen = new TreeSet<>(
            Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())
        );
        byLen.addAll(Arrays.asList("cat", "elephant", "dog", "ant"));
        System.out.println(byLen); // [ant, cat, dog, elephant]
    }
}`
      },
      {
        title: "EnumSet — Ultra-Fast Enum Collections",
        language: "java",
        content: `import java.util.*;

public class EnumSetDemo {
    enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }
    enum Permission { READ, WRITE, EXECUTE, DELETE }
    
    public static void main(String[] args) {
        // EnumSet — backed by bit vector, blazing fast
        EnumSet<Day> weekdays = EnumSet.of(Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI);
        EnumSet<Day> weekend = EnumSet.complementOf(weekdays);
        EnumSet<Day> allDays = EnumSet.allOf(Day.class);
        EnumSet<Day> noDays = EnumSet.noneOf(Day.class);
        EnumSet<Day> range = EnumSet.range(Day.TUE, Day.THU); // [TUE, WED, THU]
        
        System.out.println("Weekdays: " + weekdays);
        System.out.println("Weekend: " + weekend); // [SAT, SUN]
        
        // Permission flags — classic use case
        EnumSet<Permission> userPerms = EnumSet.of(Permission.READ, Permission.WRITE);
        EnumSet<Permission> adminPerms = EnumSet.allOf(Permission.class);
        
        if (userPerms.contains(Permission.DELETE)) {
            System.out.println("Can delete");
        } else {
            System.out.println("No delete permission");
        }
        
        // EnumMap — optimized Map for enum keys
        EnumMap<Day, String> schedule = new EnumMap<>(Day.class);
        schedule.put(Day.MON, "Math");
        schedule.put(Day.TUE, "Physics");
        schedule.put(Day.WED, "Chemistry");
        System.out.println(schedule); // maintains enum declaration order
    }
}`
      }
    ],
    tip: "Always override **hashCode()** when you override **equals()** — otherwise HashSet won't detect duplicates correctly."
  },
  {
    id: "col-map",
    title: "HashMap, LinkedHashMap & TreeMap",
    difficulty: "Medium",
    theory: [
      "**Map<K, V>** stores **key-value pairs** where each key is unique. It's the most-used data structure in real-world Java applications — used for caching, indexing, configuration, frequency counting, and much more.",
      "**HashMap** — The workhorse. O(1) average-case for `get()`/`put()`/`remove()`. Backed by an array of buckets with linked lists (or Red-Black Trees for long chains). Unordered — iteration order is unpredictable. Allows **one null key** and multiple null values.",
      "**HashMap Internal Mechanics:** When you call `map.put(key, value)`: (1) Compute `key.hashCode()`, (2) Apply perturbation: `h ^ (h >>> 16)` to spread bits, (3) Find bucket: `hash & (capacity - 1)`, (4) If bucket empty → insert. If occupied → traverse chain, check `equals()`, update or append. Default capacity is 16, load factor is 0.75 → rehash (double capacity, re-bucket all entries) when size exceeds `capacity × loadFactor`.",
      "**LinkedHashMap** — Extends HashMap, adds a **doubly-linked list** through all entries to maintain **insertion order** (default) or **access order** (if constructed with `accessOrder=true`). Slightly slower than HashMap due to linked list maintenance. With access order and `removeEldestEntry()` override, it becomes a perfect **LRU Cache** implementation.",
      "**TreeMap** — Backed by a **Red-Black Tree** (self-balancing BST). All operations are O(log n). Keys are stored in **sorted order** (natural ordering via Comparable, or custom Comparator). Does NOT allow null keys. Implements **NavigableMap** with powerful navigation: `floorKey()`, `ceilingKey()`, `subMap()`, `headMap()`, `tailMap()`.",
      "**Java 8+ Map Methods:** `getOrDefault(key, default)` — avoids null checks. `putIfAbsent(key, value)` — insert only if key is absent. `compute(key, remappingFunction)` — compute new value based on key and existing value. `merge(key, value, remappingFunction)` — elegantly handles frequency counting: `map.merge(key, 1, Integer::sum)`. `replaceAll()` — transform all values in-place.",
      "**HashMap vs TreeMap vs LinkedHashMap:** Need fastest lookup? → HashMap. Need sorted keys? → TreeMap. Need insertion order? → LinkedHashMap. Need thread safety? → ConcurrentHashMap.",
      "**Performance Tip:** If you know the number of entries upfront, pre-size the HashMap: `new HashMap<>((int)(expectedSize / 0.75f) + 1)`. This avoids costly rehashing operations.",
      "**Common Pitfall:** Never use **mutable objects** as HashMap keys. If a key's `hashCode()` changes after insertion, the entry becomes unreachable — effectively a memory leak. Use String, Integer, or other immutable types as keys."
    ],
    code: [
      {
        title: "HashMap — Essential Operations",
        language: "java",
        content: `import java.util.*;

public class HashMapDemo {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        
        // Put key-value pairs
        map.put("Alice", 90);
        map.put("Bob", 85);
        map.put("Charlie", 92);
        
        // Get value by key
        int score = map.get("Alice");             // 90
        int def = map.getOrDefault("Dave", 0);    // 0 (key not found)
        
        // Check existence
        boolean hasKey = map.containsKey("Bob");      // true
        boolean hasVal = map.containsValue(85);       // true
        
        // Update
        map.put("Alice", 95);                     // overwrite
        map.putIfAbsent("Alice", 100);            // no change — key exists
        
        // Remove
        map.remove("Charlie");
        map.remove("Bob", 999);    // conditional — only if value matches (no-op here)
        
        // Replace
        map.replace("Alice", 95, 100);  // conditional replace
        map.replaceAll((k, v) -> v + 5); // transform all values
        
        // Iterate
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " = " + entry.getValue());
        }
        
        // forEach (Java 8+)
        map.forEach((k, v) -> System.out.println(k + " -> " + v));
        
        // Keys and values
        Set<String> keys = map.keySet();
        Collection<Integer> values = map.values();
    }
}`
      },
      {
        title: "Frequency Count — Most Common Pattern",
        language: "java",
        content: `import java.util.*;

public class FrequencyCount {
    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 2, 1, 3, 3, 4};
        
        // Method 1: Traditional
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) {
            freq.put(n, freq.getOrDefault(n, 0) + 1);
        }
        
        // Method 2: merge (Java 8+) — most elegant
        Map<Integer, Integer> freq2 = new HashMap<>();
        for (int n : nums) {
            freq2.merge(n, 1, Integer::sum);
        }
        
        // Method 3: compute
        Map<Integer, Integer> freq3 = new HashMap<>();
        for (int n : nums) {
            freq3.compute(n, (k, v) -> v == null ? 1 : v + 1);
        }
        
        System.out.println(freq); // {1=2, 2=2, 3=3, 4=1}
        
        // Find max frequency element
        int maxKey = Collections.max(freq.entrySet(), 
            Map.Entry.comparingByValue()).getKey();
        System.out.println("Most frequent: " + maxKey); // 3
        
        // Group by frequency
        Map<Integer, List<Integer>> byFreq = new HashMap<>();
        freq.forEach((num, count) -> 
            byFreq.computeIfAbsent(count, k -> new ArrayList<>()).add(num));
        System.out.println("By frequency: " + byFreq);
    }
}`
      },
      {
        title: "TreeMap — Sorted Map with Navigation",
        language: "java",
        content: `import java.util.*;

public class TreeMapDemo {
    public static void main(String[] args) {
        TreeMap<Integer, String> map = new TreeMap<>();
        map.put(30, "C"); map.put(10, "A"); map.put(20, "B"); map.put(40, "D");
        
        System.out.println(map);  // {10=A, 20=B, 30=C, 40=D} — sorted by key
        
        // Navigation methods
        System.out.println("First: " + map.firstKey());     // 10
        System.out.println("Last: " + map.lastKey());       // 40
        System.out.println("Floor(25): " + map.floorKey(25));   // 20 (≤ 25)
        System.out.println("Ceiling(25): " + map.ceilingKey(25)); // 30 (≥ 25)
        System.out.println("Lower(20): " + map.lowerKey(20));    // 10 (< 20)
        System.out.println("Higher(20): " + map.higherKey(20));  // 30 (> 20)
        
        // First/Last Entry
        Map.Entry<Integer, String> first = map.firstEntry();  // 10=A
        Map.Entry<Integer, String> last = map.lastEntry();    // 40=D
        
        // Poll (retrieve + remove)
        Map.Entry<Integer, String> polled = map.pollFirstEntry(); // removes 10=A
        
        // Submaps
        SortedMap<Integer, String> sub = map.subMap(15, 35);
        System.out.println("SubMap [15,35): " + sub); // {20=B, 30=C}
        
        // Descending
        NavigableMap<Integer, String> desc = map.descendingMap();
        System.out.println("Descending: " + desc);
    }
}`
      },
      {
        title: "LinkedHashMap — LRU Cache Implementation",
        language: "java",
        content: `import java.util.*;

// LRU Cache using LinkedHashMap with access order
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    
    public LRUCache(int capacity) {
        // accessOrder=true → most recently accessed moves to end
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity; // remove oldest when over capacity
    }
}

public class LRUDemo {
    public static void main(String[] args) {
        LRUCache<String, Integer> cache = new LRUCache<>(3);
        
        cache.put("A", 1);
        cache.put("B", 2);
        cache.put("C", 3);
        System.out.println(cache); // {A=1, B=2, C=3}
        
        cache.get("A"); // access A → moves to end
        System.out.println(cache); // {B=2, C=3, A=1}
        
        cache.put("D", 4); // exceeds capacity → evicts B (eldest)
        System.out.println(cache); // {C=3, A=1, D=4}
        
        cache.put("E", 5); // evicts C
        System.out.println(cache); // {A=1, D=4, E=5}
        
        // Useful for: caching API responses, database queries,
        // memoization in algorithms, session management
    }
}`
      }
    ],
    warning: "Never modify a map while iterating with a for-each loop — use **Iterator.remove()** or **removeIf()** instead."
  },
  {
    id: "col-hashmap-internals",
    title: "HashMap Internals — How Hashing Works",
    difficulty: "Hard",
    theory: [
      "**HashMap** internally uses an **array of buckets** (called `table`). Each bucket is a linked list or tree",
      "**Hashing process:** `hashCode()` → perturbed hash → `hash & (n-1)` to find bucket index",
      "Java applies a **perturbation function:** `h ^ (h >>> 16)` to spread bits and reduce collisions",
      "**Default initial capacity** is 16, **load factor** is 0.75 → rehash when size > 12",
      "**Rehashing (resize):** capacity doubles, ALL entries are re-bucketed — O(n) operation",
      "**Collision chain:** bucket stores a linked list. Java 8+ converts to **Red-Black Tree** when chain length ≥ 8 (TREEIFY_THRESHOLD)",
      "Tree reverts to linked list when chain shrinks to ≤ 6 (UNTREEIFY_THRESHOLD)",
      "**hashCode() contract:** equal objects MUST have equal hash codes. Unequal objects SHOULD have different hash codes for performance",
      "**Worst case:** all keys hash to same bucket → O(n) with linked list, O(log n) with tree (Java 8+)",
      "**Immutable keys are best:** if a key's hashCode changes after insertion, the entry becomes unreachable (memory leak!)",
      "**HashMap allows 1 null key** (stored in bucket 0) and multiple null values. TreeMap does NOT allow null keys"
    ],
    diagram: {
      type: "flow",
      title: "HashMap Internal Structure",
      data: [
        { label: "key.hashCode() → compute hash", color: "primary" },
        { label: "hash ^ (hash >>> 16) → perturbation", color: "primary" },
        { label: "hash & (capacity - 1) → bucket index", color: "info" },
        { label: "Bucket empty? → insert new Node", color: "success" },
        { label: "Bucket has entries → check equals()", color: "warning" },
        { label: "Key matches → update value", color: "success" },
        { label: "Key doesn't match → chain (list/tree)", color: "accent" },
        { label: "Chain length ≥ 8 → treeify to Red-Black Tree", color: "heap" }
      ]
    },
    code: [
      {
        title: "Understanding hashCode & equals Contract",
        language: "java",
        content: `import java.util.*;

class Employee {
    String name;
    int id;
    
    Employee(String name, int id) {
        this.name = name;
        this.id = id;
    }
    
    // ✅ MUST override both hashCode and equals together
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee emp = (Employee) o;
        return id == emp.id && Objects.equals(name, emp.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, id); // consistent with equals
    }
    
    @Override
    public String toString() { return name + "#" + id; }
}

public class HashCodeDemo {
    public static void main(String[] args) {
        Employee e1 = new Employee("Alice", 101);
        Employee e2 = new Employee("Alice", 101);
        
        System.out.println("equals: " + e1.equals(e2));         // true
        System.out.println("hashCode same: " + (e1.hashCode() == e2.hashCode())); // true
        
        // Without hashCode override, HashMap treats them as different keys!
        Map<Employee, String> map = new HashMap<>();
        map.put(e1, "Engineering");
        System.out.println(map.get(e2)); // "Engineering" — works because hashCode+equals
        
        Set<Employee> set = new HashSet<>();
        set.add(e1);
        set.add(e2); // duplicate — ignored
        System.out.println("Set size: " + set.size()); // 1
    }
}`
      },
      {
        title: "HashMap Performance — Capacity & Load Factor",
        language: "java",
        content: `import java.util.*;

public class HashMapPerformance {
    public static void main(String[] args) {
        // Default: capacity=16, loadFactor=0.75
        // Rehash when size > 16 * 0.75 = 12
        Map<Integer, String> defaultMap = new HashMap<>();
        
        // Pre-size for known number of entries
        // Formula: expectedSize / loadFactor + 1
        int expected = 1000;
        Map<Integer, String> preSized = new HashMap<>(
            (int) (expected / 0.75f) + 1
        );
        
        // Custom load factor (higher = more memory efficient, more collisions)
        Map<Integer, String> denseMap = new HashMap<>(16, 0.9f);
        
        // Custom load factor (lower = less collisions, more memory)
        Map<Integer, String> sparseMap = new HashMap<>(16, 0.5f);
        
        // Benchmark: pre-sized vs default for 100K entries
        long start = System.nanoTime();
        Map<Integer, Integer> m1 = new HashMap<>();
        for (int i = 0; i < 100_000; i++) m1.put(i, i);
        long t1 = System.nanoTime() - start;
        
        start = System.nanoTime();
        Map<Integer, Integer> m2 = new HashMap<>(150_000);
        for (int i = 0; i < 100_000; i++) m2.put(i, i);
        long t2 = System.nanoTime() - start;
        
        System.out.println("Default: " + t1 / 1_000_000 + "ms");
        System.out.println("Pre-sized: " + t2 / 1_000_000 + "ms");
        // Pre-sized is faster — no rehashing!
    }
}`
      },
      {
        title: "Bad hashCode — Demonstrating Collisions",
        language: "java",
        content: `import java.util.*;

class BadKey {
    int value;
    BadKey(int v) { this.value = v; }
    
    // ❌ TERRIBLE hashCode — all keys go to same bucket!
    @Override
    public int hashCode() { return 1; }
    
    @Override
    public boolean equals(Object o) {
        return o instanceof BadKey && ((BadKey)o).value == value;
    }
}

class GoodKey {
    int value;
    GoodKey(int v) { this.value = v; }
    
    // ✅ GOOD hashCode — well-distributed
    @Override
    public int hashCode() { return Integer.hashCode(value); }
    
    @Override
    public boolean equals(Object o) {
        return o instanceof GoodKey && ((GoodKey)o).value == value;
    }
}

public class CollisionDemo {
    public static void main(String[] args) {
        int n = 10000;
        
        // Bad: all entries in one bucket → O(n) per operation
        long start = System.nanoTime();
        Map<BadKey, Integer> bad = new HashMap<>();
        for (int i = 0; i < n; i++) bad.put(new BadKey(i), i);
        long tBad = System.nanoTime() - start;
        
        // Good: evenly distributed → O(1) per operation
        start = System.nanoTime();
        Map<GoodKey, Integer> good = new HashMap<>();
        for (int i = 0; i < n; i++) good.put(new GoodKey(i), i);
        long tGood = System.nanoTime() - start;
        
        System.out.println("Bad hashCode: " + tBad / 1_000_000 + "ms");
        System.out.println("Good hashCode: " + tGood / 1_000_000 + "ms");
        // Bad is dramatically slower!
    }
}`
      }
    ],
    tip: "**Rule of thumb:** When creating HashMap for N known entries, initialize with capacity `N * 4 / 3 + 1` to avoid rehashing."
  },
  {
    id: "col-queue",
    title: "Queue, Deque & PriorityQueue",
    difficulty: "Medium",
    theory: [
      "**Queue<E>** — FIFO (First-In, First-Out) data structure",
      "**Deque<E>** — Double-ended queue, supports insertion/removal at both ends",
      "**PriorityQueue** — elements are ordered by priority (min-heap by default), NOT FIFO",
      "**Key Queue methods:** offer(e) — add, poll() — remove head, peek() — view head",
      "offer/poll/peek return null on failure. add/remove/element throw exceptions",
      "**PriorityQueue** gives you the **smallest** element first (natural ordering)",
      "For **max-heap**, use `new PriorityQueue<>(Collections.reverseOrder())`",
      "**PriorityQueue internal:** backed by a binary heap (array-based). offer/poll are O(log n), peek is O(1)",
      "PriorityQueue does NOT guarantee sorted iteration — only `poll()` order is sorted",
      "PriorityQueue is essential in competitive programming — Dijkstra, K-th largest, merge K lists, scheduling"
    ],
    code: [
      {
        title: "Queue & Deque Operations",
        language: "java",
        content: `import java.util.*;

public class QueueDemo {
    public static void main(String[] args) {
        // Queue (FIFO) — use LinkedList or ArrayDeque
        Queue<String> queue = new LinkedList<>();
        queue.offer("A");
        queue.offer("B");
        queue.offer("C");
        System.out.println(queue.poll()); // A (first in, first out)
        System.out.println(queue.peek()); // B (view without removing)
        
        // Deque — double-ended
        Deque<Integer> deque = new ArrayDeque<>();
        deque.offerFirst(1);  // [1]
        deque.offerLast(2);   // [1, 2]
        deque.offerFirst(0);  // [0, 1, 2]
        
        System.out.println(deque.pollFirst()); // 0
        System.out.println(deque.pollLast());  // 2
        System.out.println(deque.peekFirst()); // 1
        
        // Queue vs throwing methods:
        // offer → returns false on failure | add → throws IllegalStateException
        // poll → returns null on empty     | remove → throws NoSuchElementException
        // peek → returns null on empty     | element → throws NoSuchElementException
    }
}`
      },
      {
        title: "PriorityQueue — Min Heap & Max Heap",
        language: "java",
        content: `import java.util.*;

public class PQDemo {
    public static void main(String[] args) {
        // Min-Heap (default)
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(30); minHeap.offer(10); minHeap.offer(20);
        System.out.println(minHeap.poll()); // 10 (smallest first)
        System.out.println(minHeap.poll()); // 20
        
        // Max-Heap
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        maxHeap.offer(30); maxHeap.offer(10); maxHeap.offer(20);
        System.out.println(maxHeap.poll()); // 30 (largest first)
        
        // Custom comparator — sort by string length
        PriorityQueue<String> pq = new PriorityQueue<>(Comparator.comparingInt(String::length));
        pq.offer("banana"); pq.offer("fig"); pq.offer("apple");
        System.out.println(pq.poll()); // fig (shortest)
        
        // K-th Largest Element — O(n log k)
        int[] nums = {3, 1, 4, 1, 5, 9, 2, 6};
        int k = 3;
        PriorityQueue<Integer> kHeap = new PriorityQueue<>();
        for (int n : nums) {
            kHeap.offer(n);
            if (kHeap.size() > k) kHeap.poll(); // remove smallest
        }
        System.out.println("K-th largest: " + kHeap.peek()); // 5
    }
}`
      },
      {
        title: "PriorityQueue — Advanced CP Patterns",
        language: "java",
        content: `import java.util.*;

public class PQAdvanced {
    // Merge K Sorted Arrays
    static List<Integer> mergeKSorted(int[][] arrays) {
        List<Integer> result = new ArrayList<>();
        // {value, arrayIndex, elementIndex}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        
        for (int i = 0; i < arrays.length; i++) {
            if (arrays[i].length > 0) {
                pq.offer(new int[]{arrays[i][0], i, 0});
            }
        }
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            result.add(curr[0]);
            int nextIdx = curr[2] + 1;
            if (nextIdx < arrays[curr[1]].length) {
                pq.offer(new int[]{arrays[curr[1]][nextIdx], curr[1], nextIdx});
            }
        }
        return result;
    }
    
    // Running Median using two heaps
    static PriorityQueue<Integer> maxLeft = new PriorityQueue<>(Collections.reverseOrder());
    static PriorityQueue<Integer> minRight = new PriorityQueue<>();
    
    static void addNum(int num) {
        maxLeft.offer(num);
        minRight.offer(maxLeft.poll());
        if (minRight.size() > maxLeft.size()) {
            maxLeft.offer(minRight.poll());
        }
    }
    
    static double getMedian() {
        if (maxLeft.size() > minRight.size()) return maxLeft.peek();
        return (maxLeft.peek() + minRight.peek()) / 2.0;
    }
    
    public static void main(String[] args) {
        // Merge K sorted
        int[][] arrays = {{1, 4, 7}, {2, 5, 8}, {3, 6, 9}};
        System.out.println(mergeKSorted(arrays)); // [1,2,3,4,5,6,7,8,9]
        
        // Running median
        for (int n : new int[]{5, 15, 1, 3}) {
            addNum(n);
            System.out.println("Median after " + n + ": " + getMedian());
        }
    }
}`
      }
    ],
    tip: "Prefer **ArrayDeque** over LinkedList for stack/queue usage — it's faster and uses less memory."
  },
  {
    id: "col-stack",
    title: "Stack & ArrayDeque",
    difficulty: "Easy",
    theory: [
      "**Stack** class exists in Java but is **legacy** — it extends Vector and is synchronized (slow)",
      "Use **ArrayDeque** as a stack instead — it's faster and not synchronized",
      "**Stack operations:** push(e) → addFirst(e), pop() → removeFirst(), peek() → peekFirst()",
      "ArrayDeque is backed by a **resizable circular array** — very cache-friendly",
      "Common stack problems: balanced parentheses, next greater element, expression evaluation, undo operations, monotonic stack",
      "Stack is LIFO — Last In, First Out",
      "**ArrayDeque** has no capacity limit (auto-resizes). Initial capacity is 16 by default"
    ],
    code: [
      {
        title: "ArrayDeque as Stack",
        language: "java",
        content: `import java.util.*;

public class StackDemo {
    public static void main(String[] args) {
        // ✅ Recommended — ArrayDeque as Stack
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);  // [1]
        stack.push(2);  // [2, 1]
        stack.push(3);  // [3, 2, 1]
        
        System.out.println(stack.peek()); // 3 (top)
        System.out.println(stack.pop());  // 3
        System.out.println(stack.pop());  // 2
        System.out.println(stack.isEmpty()); // false
        
        // ❌ Avoid — Legacy Stack class
        // Stack<Integer> old = new Stack<>(); // synchronized, slow
    }
}`
      },
      {
        title: "Balanced Parentheses — Classic Stack Problem",
        language: "java",
        content: `public class BalancedParentheses {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(isValid("({[]})")); // true
        System.out.println(isValid("({[}])"));  // false
        System.out.println(isValid("(("));      // false
    }
}`
      },
      {
        title: "Monotonic Stack — Next Greater Element",
        language: "java",
        content: `import java.util.*;

public class MonotonicStack {
    // Find next greater element for each position
    public static int[] nextGreater(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);
        
        Deque<Integer> stack = new ArrayDeque<>(); // stores indices
        
        for (int i = 0; i < n; i++) {
            // Pop all elements smaller than current
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
                result[stack.pop()] = nums[i];
            }
            stack.push(i);
        }
        return result;
    }
    
    // Evaluate Reverse Polish Notation (postfix)
    public static int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            switch (t) {
                case "+": stack.push(stack.pop() + stack.pop()); break;
                case "-": int b = stack.pop(), a = stack.pop();
                          stack.push(a - b); break;
                case "*": stack.push(stack.pop() * stack.pop()); break;
                case "/": int d = stack.pop(), c = stack.pop();
                          stack.push(c / d); break;
                default:  stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }
    
    public static void main(String[] args) {
        int[] arr = {4, 5, 2, 25, 7, 8};
        System.out.println(Arrays.toString(nextGreater(arr)));
        // [5, 25, 25, -1, 8, -1]
        
        String[] rpn = {"2", "1", "+", "3", "*"};
        System.out.println(evalRPN(rpn)); // 9 = (2+1)*3
    }
}`
      }
    ],
    note: "In competitive programming, ArrayDeque is the go-to for both stack and queue operations."
  },
  {
    id: "col-iterator",
    title: "Iterators & ListIterator",
    difficulty: "Medium",
    theory: [
      "**Iterator<E>** provides a standard way to traverse any collection one element at a time",
      "Methods: **hasNext()** — checks if more elements, **next()** — returns next element, **remove()** — removes last returned element",
      "**ListIterator<E>** extends Iterator — supports bidirectional traversal and modification",
      "ListIterator adds: **hasPrevious()**, **previous()**, **add()**, **set()**, **nextIndex()**, **previousIndex()**",
      "**ConcurrentModificationException** — thrown if you modify a collection while iterating with for-each",
      "Safe removal during iteration: use **iterator.remove()** or **collection.removeIf()**",
      "The **for-each loop** internally uses an Iterator — it's syntactic sugar",
      "**Spliterator** (Java 8+) — splits a collection for parallel processing, used internally by streams"
    ],
    code: [
      {
        title: "Iterator & Safe Removal",
        language: "java",
        content: `import java.util.*;

public class IteratorDemo {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        
        // Basic iteration
        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            int val = it.next();
            System.out.print(val + " "); // 1 2 3 4 5
        }
        System.out.println();
        
        // ✅ Safe removal — remove even numbers
        it = list.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) {
                it.remove(); // safe!
            }
        }
        System.out.println(list); // [1, 3, 5]
        
        // ✅ Even simpler — removeIf (Java 8+)
        List<Integer> list2 = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        list2.removeIf(n -> n % 2 == 0);
        System.out.println(list2); // [1, 3, 5]
        
        // ❌ This throws ConcurrentModificationException!
        // for (int n : list) { if (n == 3) list.remove(n); }
    }
}`
      },
      {
        title: "ListIterator — Bidirectional Traversal",
        language: "java",
        content: `import java.util.*;

public class ListIteratorDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D"));
        
        ListIterator<String> lit = list.listIterator();
        
        // Forward
        while (lit.hasNext()) {
            int idx = lit.nextIndex();
            String val = lit.next();
            System.out.println(idx + ": " + val);
        }
        
        // Backward
        System.out.println("--- Reverse ---");
        while (lit.hasPrevious()) {
            String val = lit.previous();
            System.out.print(val + " "); // D C B A
        }
        System.out.println();
        
        // Modify during iteration
        lit = list.listIterator();
        while (lit.hasNext()) {
            String val = lit.next();
            lit.set(val.toLowerCase()); // replace current
        }
        System.out.println(list); // [a, b, c, d]
        
        // Add during iteration
        lit = list.listIterator();
        while (lit.hasNext()) {
            String val = lit.next();
            if (val.equals("b")) {
                lit.add("b2"); // inserts after "b"
            }
        }
        System.out.println(list); // [a, b, b2, c, d]
    }
}`
      }
    ],
    warning: "Never call **iterator.remove()** without first calling **next()** — it throws IllegalStateException."
  },
  {
    id: "col-comparable",
    title: "Comparable & Comparator",
    difficulty: "Medium",
    theory: [
      "**Comparable<T>** — defines the **natural ordering** of a class. Implement `compareTo(T o)` in the class itself",
      "**Comparator<T>** — defines an **external/custom ordering**. Pass it to sort methods or collections",
      "**compareTo contract:** return negative if this < other, 0 if equal, positive if this > other",
      "**Comparable** = single default sorting. **Comparator** = multiple different sortings",
      "Java 8 Comparator helpers: `Comparator.comparing()`, `thenComparing()`, `reversed()`",
      "TreeSet, TreeMap, PriorityQueue, Collections.sort, Arrays.sort all use Comparable/Comparator",
      "If your class implements Comparable, it works with all sorted collections automatically",
      "**Important:** `compareTo` should be consistent with `equals` — if `a.equals(b)` then `a.compareTo(b) == 0`",
      "Avoid `a - b` for compareTo with integers — can **overflow**! Use `Integer.compare(a, b)` instead"
    ],
    code: [
      {
        title: "Comparable — Natural Ordering",
        language: "java",
        content: `import java.util.*;

class Student implements Comparable<Student> {
    String name;
    int grade;
    
    Student(String name, int grade) {
        this.name = name;
        this.grade = grade;
    }
    
    @Override
    public int compareTo(Student other) {
        // ✅ Safe — no overflow risk
        return Integer.compare(this.grade, other.grade);
        
        // ❌ DANGEROUS — can overflow for extreme values!
        // return this.grade - other.grade;
    }
    
    @Override
    public String toString() {
        return name + "(" + grade + ")";
    }
}

public class ComparableDemo {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Alice", 90));
        students.add(new Student("Bob", 75));
        students.add(new Student("Charlie", 85));
        
        Collections.sort(students); // uses compareTo
        System.out.println(students); // [Bob(75), Charlie(85), Alice(90)]
        
        // Works with TreeSet too
        TreeSet<Student> sorted = new TreeSet<>(students);
        System.out.println(sorted.first()); // Bob(75)
    }
}`
      },
      {
        title: "Comparator — Custom & Multiple Sortings",
        language: "java",
        content: `import java.util.*;

public class ComparatorDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Charlie", "Alice", "Bob", "Dave");
        
        // Sort by length
        names.sort(Comparator.comparingInt(String::length));
        System.out.println(names); // [Bob, Dave, Alice, Charlie]
        
        // Sort by length, then alphabetically
        names.sort(Comparator.comparingInt(String::length)
                             .thenComparing(Comparator.naturalOrder()));
        System.out.println(names); // [Bob, Dave, Alice, Charlie]
        
        // Reverse order
        names.sort(Comparator.reverseOrder());
        System.out.println(names); // [Dave, Charlie, Bob, Alice]
        
        // Complex: sort int[][] by first element desc, then second asc
        int[][] intervals = {{3,5}, {1,4}, {3,2}, {1,7}};
        Arrays.sort(intervals, (a, b) -> {
            if (a[0] != b[0]) return Integer.compare(b[0], a[0]); // desc
            return Integer.compare(a[1], b[1]);                     // asc
        });
        
        // Null-safe comparator
        List<String> withNulls = Arrays.asList("B", null, "A", null, "C");
        withNulls.sort(Comparator.nullsLast(Comparator.naturalOrder()));
        System.out.println(withNulls); // [A, B, C, null, null]
        
        // Comparing by extracted key
        // Comparator.comparing(Student::getName)
        //           .thenComparingInt(Student::getGrade)
        //           .reversed()
    }
}`
      },
      {
        title: "Comparator — CP Contest Patterns",
        language: "java",
        content: `import java.util.*;

public class ComparatorCP {
    public static void main(String[] args) {
        // Sort 2D array — intervals by start, then by end
        int[][] intervals = {{1,3}, {2,4}, {1,2}, {3,5}};
        Arrays.sort(intervals, (a, b) -> 
            a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]
        );
        // [[1,2], [1,3], [2,4], [3,5]]
        
        // Sort strings: by length desc, then lexicographic
        String[] words = {"apple", "fig", "banana", "kiwi"};
        Arrays.sort(words, (a, b) -> 
            a.length() != b.length() ? b.length() - a.length() : a.compareTo(b)
        );
        // [banana, apple, fig, kiwi] → wait, kiwi is 4 chars
        // Actually: [banana, apple, kiwi, fig]
        
        // Custom object sorting with multiple criteria
        int[][] people = {{7,0}, {4,4}, {7,1}, {5,0}, {6,1}, {5,2}};
        // Sort by height desc, then by k asc
        Arrays.sort(people, (a, b) -> 
            a[0] != b[0] ? b[0] - a[0] : a[1] - b[1]
        );
        
        // PriorityQueue with custom comparator
        PriorityQueue<int[]> pq = new PriorityQueue<>(
            Comparator.comparingInt((int[] a) -> a[0])
                      .thenComparingInt(a -> a[1])
        );
        pq.offer(new int[]{3, 1});
        pq.offer(new int[]{1, 5});
        pq.offer(new int[]{3, 0});
        // Polls: [1,5], [3,0], [3,1]
    }
}`
      }
    ],
    tip: "In competitive programming, lambda comparators are the fastest way to define custom sort: `Arrays.sort(arr, (a, b) -> a[0] - b[0])`"
  },
  {
    id: "col-collections",
    title: "Collections Utility Class",
    difficulty: "Easy",
    theory: [
      "**Collections** (with 's') is a utility class with static methods for operating on collections",
      "**Sorting:** `sort()`, `reverseOrder()`, `shuffle()`",
      "**Searching:** `binarySearch()` — list must be sorted first",
      "**Min/Max:** `min()`, `max()` — with natural or custom comparator",
      "**Unmodifiable:** `unmodifiableList()`, `unmodifiableMap()` — returns read-only view",
      "**Synchronized:** `synchronizedList()`, `synchronizedMap()` — thread-safe wrappers",
      "**Fill/Copy/Swap:** `fill()`, `copy()`, `swap()`, `rotate()`, `frequency()`",
      "Java 9+: `List.of()`, `Set.of()`, `Map.of()` create immutable collections directly",
      "Java 10+: `List.copyOf()`, `Set.copyOf()`, `Map.copyOf()` create immutable copies",
      "**singletonList**, **emptyList**, **nCopies** — factory methods for special collections"
    ],
    code: [
      {
        title: "Collections Utility Methods",
        language: "java",
        content: `import java.util.*;

public class CollectionsUtilDemo {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9, 3));
        
        // Sort & Reverse
        Collections.sort(list);
        System.out.println("Sorted: " + list);     // [1, 2, 3, 5, 8, 9]
        Collections.reverse(list);
        System.out.println("Reversed: " + list);    // [9, 8, 5, 3, 2, 1]
        
        // Min & Max
        Collections.sort(list);
        System.out.println("Min: " + Collections.min(list)); // 1
        System.out.println("Max: " + Collections.max(list)); // 9
        
        // Binary Search (list must be sorted)
        int idx = Collections.binarySearch(list, 5);
        System.out.println("Index of 5: " + idx); // 3
        
        // Frequency
        List<Integer> nums = Arrays.asList(1, 2, 3, 2, 2, 4);
        System.out.println("Freq of 2: " + Collections.frequency(nums, 2)); // 3
        
        // Shuffle
        Collections.shuffle(list);
        System.out.println("Shuffled: " + list);
        
        // Rotate
        List<Integer> r = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        Collections.rotate(r, 2);
        System.out.println("Rotated by 2: " + r); // [4, 5, 1, 2, 3]
        
        // Swap
        Collections.swap(r, 0, 4);
        
        // Fill
        Collections.fill(r, 0);
        System.out.println("Filled: " + r); // [0, 0, 0, 0, 0]
        
        // nCopies — immutable list of N same elements
        List<String> fiveHellos = Collections.nCopies(5, "Hello");
        System.out.println(fiveHellos); // [Hello, Hello, Hello, Hello, Hello]
    }
}`
      },
      {
        title: "Immutable Collections — Java 9+ Factory Methods",
        language: "java",
        content: `import java.util.*;

public class ImmutableCollections {
    public static void main(String[] args) {
        // ✅ Java 9+: Immutable factories
        List<String> list = List.of("A", "B", "C");
        Set<Integer> set = Set.of(1, 2, 3);
        Map<String, Integer> map = Map.of("x", 1, "y", 2);
        
        // All throw UnsupportedOperationException on modification
        // list.add("D"); ❌
        // set.remove(1);  ❌
        // map.put("z", 3); ❌
        
        // Map.ofEntries for >10 entries
        Map<String, Integer> bigMap = Map.ofEntries(
            Map.entry("a", 1),
            Map.entry("b", 2),
            Map.entry("c", 3)
        );
        
        // ✅ Java 10+: copyOf — immutable copy
        List<String> mutable = new ArrayList<>(Arrays.asList("X", "Y"));
        List<String> immCopy = List.copyOf(mutable);
        mutable.add("Z"); // original changes
        System.out.println(immCopy); // [X, Y] — copy unchanged
        
        // ❌ These do NOT allow null elements
        // List.of(null); → NullPointerException
        // Set.of(null);  → NullPointerException
        
        // For null-friendly unmodifiable, use:
        List<String> withNull = Collections.unmodifiableList(
            Arrays.asList("A", null, "B")
        );
    }
}`
      }
    ],
    note: "**Collections.unmodifiableList()** returns a view — changes to the original list are reflected. For a true copy, use `List.copyOf()` (Java 10+)."
  },
  {
    id: "col-performance",
    title: "Performance Comparison & When to Use What",
    difficulty: "Medium",
    theory: [
      "**Choosing the right collection** is one of the most impactful decisions for performance",
      "**ArrayList** vs **LinkedList:** ArrayList wins in almost every scenario except frequent head insertions",
      "**HashSet** vs **TreeSet:** HashSet O(1) for contains, TreeSet O(log n) but keeps elements sorted",
      "**HashMap** vs **TreeMap:** HashMap O(1) lookup, TreeMap O(log n) but supports range queries",
      "**ArrayDeque** vs **LinkedList:** ArrayDeque is faster for both stack and queue operations (cache-friendly)",
      "**PriorityQueue:** O(log n) insert/remove, O(1) peek — best for scheduling and top-K problems",
      "**Memory overhead:** ArrayList < ArrayDeque < HashSet < LinkedList < TreeSet < LinkedHashSet",
      "**Thread safety:** None of the standard collections are thread-safe. Use ConcurrentHashMap, CopyOnWriteArrayList, etc.",
      "**Rule:** Start with ArrayList/HashMap/HashSet. Switch only when you need specific properties (ordering, navigation, thread-safety)"
    ],
    diagram: {
      type: "table-visual",
      title: "Collection Performance Cheat Sheet",
      data: [
        { label: "ArrayList — O(1) add, O(n) remove, O(1) get — General purpose", color: "info" },
        { label: "LinkedList — O(1) add, O(1) remove*, O(n) get — Deque ops", color: "info" },
        { label: "ArrayDeque — O(1) add/remove, O(n) search — Stack & Queue", color: "accent" },
        { label: "HashSet — O(1) add/remove/contains — Unique lookups", color: "success" },
        { label: "LinkedHashSet — O(1) ops + insertion order", color: "success" },
        { label: "TreeSet — O(log n) all ops — Sorted unique, ranges", color: "success" },
        { label: "HashMap — O(1) put/get/remove — Key-value lookups", color: "warning" },
        { label: "LinkedHashMap — O(1) ops + insertion order — LRU cache", color: "warning" },
        { label: "TreeMap — O(log n) all ops — Sorted keys, ranges", color: "warning" },
        { label: "PriorityQueue — O(log n) add/poll, O(1) peek — Top-K", color: "heap" }
      ]
    },
    code: [
      {
        title: "Choosing the Right Collection — Decision Guide",
        language: "java",
        content: `import java.util.*;

public class CollectionChoice {
    public static void main(String[] args) {
        // QUESTION: Do you need key-value pairs?
        // YES → Map
        //   Need sorted keys? → TreeMap
        //   Need insertion order? → LinkedHashMap
        //   Need LRU eviction? → LinkedHashMap(accessOrder=true)
        //   Default? → HashMap
        
        // QUESTION: Do you need unique elements only?
        // YES → Set
        //   Need sorted? → TreeSet
        //   Need insertion order? → LinkedHashSet
        //   Using enums? → EnumSet
        //   Default? → HashSet
        
        // QUESTION: Do you need a queue?
        // YES →
        //   Priority-based? → PriorityQueue
        //   FIFO? → ArrayDeque
        //   LIFO (stack)? → ArrayDeque
        //   Thread-safe? → ConcurrentLinkedQueue / BlockingQueue
        
        // QUESTION: Ordered sequence with duplicates?
        // YES → List
        //   Need random access? → ArrayList
        //   Frequent head insertions? → LinkedList (rare!)
        //   Default? → ArrayList
        
        // ===== COMMON MISTAKES =====
        
        // ❌ Using LinkedList as a general-purpose list
        // ✅ ArrayList is almost always faster
        
        // ❌ Using Vector/Stack (legacy, synchronized)
        // ✅ ArrayList + ArrayDeque
        
        // ❌ Using Hashtable (legacy, synchronized)
        // ✅ HashMap or ConcurrentHashMap
        
        // ❌ Sorting a list then using indexOf to search
        // ✅ Use HashSet.contains() — O(1) vs O(n)
        
        // ❌ Using HashMap when you need sorted iteration
        // ✅ Use TreeMap
        
        System.out.println("Choose wisely!");
    }
}`
      },
      {
        title: "Performance Benchmark — ArrayList vs LinkedList vs ArrayDeque",
        language: "java",
        content: `import java.util.*;

public class PerfBenchmark {
    static final int N = 100_000;
    
    public static void main(String[] args) {
        // 1. Sequential add
        long t1 = bench(() -> {
            List<Integer> list = new ArrayList<>();
            for (int i = 0; i < N; i++) list.add(i);
        });
        long t2 = bench(() -> {
            List<Integer> list = new LinkedList<>();
            for (int i = 0; i < N; i++) list.add(i);
        });
        System.out.println("Sequential add — AL: " + t1 + "ms, LL: " + t2 + "ms");
        
        // 2. Random access
        List<Integer> al = new ArrayList<>();
        List<Integer> ll = new LinkedList<>();
        for (int i = 0; i < N; i++) { al.add(i); ll.add(i); }
        
        t1 = bench(() -> { for (int i = 0; i < 1000; i++) al.get(N/2); });
        t2 = bench(() -> { for (int i = 0; i < 1000; i++) ll.get(N/2); });
        System.out.println("Random access — AL: " + t1 + "ms, LL: " + t2 + "ms");
        // ArrayList is DRAMATICALLY faster for random access
        
        // 3. Stack operations — ArrayDeque vs Stack
        t1 = bench(() -> {
            Deque<Integer> stack = new ArrayDeque<>();
            for (int i = 0; i < N; i++) stack.push(i);
            while (!stack.isEmpty()) stack.pop();
        });
        t2 = bench(() -> {
            Stack<Integer> stack = new Stack<>();
            for (int i = 0; i < N; i++) stack.push(i);
            while (!stack.isEmpty()) stack.pop();
        });
        System.out.println("Stack ops — ArrayDeque: " + t1 + "ms, Stack: " + t2 + "ms");
    }
    
    static long bench(Runnable task) {
        long start = System.currentTimeMillis();
        task.run();
        return System.currentTimeMillis() - start;
    }
}`
      }
    ],
    tip: "**Interview tip:** When asked 'which collection would you use?', always explain the **why** — time complexity, ordering needs, thread-safety, and memory."
  },
  {
    id: "col-cp-patterns",
    title: "Collections in Competitive Programming",
    difficulty: "Hard",
    theory: [
      "**Frequency map** — the most common pattern: count occurrences with `HashMap<T, Integer>`",
      "**Two-sum pattern** — use HashMap to find complement in O(1): `map.containsKey(target - num)`",
      "**Sliding window + HashMap** — track element counts in a moving window",
      "**Coordinate compression** — use TreeSet + HashMap to compress large coordinates to [0, n)",
      "**Ordered set tricks** — TreeSet's `floor/ceiling` for finding nearest elements",
      "**Multi-map pattern** — `HashMap<K, List<V>>` for grouping, use `computeIfAbsent`",
      "**Stack-based patterns** — monotonic stack for next greater/smaller element, histogram problems",
      "**Two heaps** — max-heap + min-heap for running median",
      "**Sweep line + TreeMap** — process events in sorted order, track active intervals",
      "**Deque for sliding window max/min** — maintain a monotonic deque for O(1) window queries"
    ],
    code: [
      {
        title: "Two Sum & Subarray Sum — HashMap Patterns",
        language: "java",
        content: `import java.util.*;

public class HashMapPatterns {
    // Two Sum — O(n)
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>(); // value → index
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }
    
    // Count subarrays with sum = k using prefix sum + HashMap
    static int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // empty prefix
        int sum = 0, count = 0;
        for (int n : nums) {
            sum += n;
            count += prefixCount.getOrDefault(sum - k, 0);
            prefixCount.merge(sum, 1, Integer::sum);
        }
        return count;
    }
    
    // Group anagrams — HashMap<sorted_key, list>
    static List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }
    
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9))); // [0,1]
        System.out.println(subarraySum(new int[]{1,1,1}, 2)); // 2
        System.out.println(groupAnagrams(new String[]{"eat","tea","tan","ate","nat","bat"}));
    }
}`
      },
      {
        title: "Sliding Window Max — Monotonic Deque",
        language: "java",
        content: `import java.util.*;

public class SlidingWindowMax {
    // Find maximum in every window of size k — O(n)
    static int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>(); // stores indices
        
        for (int i = 0; i < n; i++) {
            // Remove elements outside window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }
            
            // Remove smaller elements (maintain decreasing order)
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }
            
            deque.offerLast(i);
            
            // Window is complete
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }
        return result;
    }
    
    // Sliding window with HashMap — longest substring with at most K distinct
    static int longestKDistinct(String s, int k) {
        Map<Character, Integer> freq = new HashMap<>();
        int left = 0, maxLen = 0;
        
        for (int right = 0; right < s.length(); right++) {
            freq.merge(s.charAt(right), 1, Integer::sum);
            
            while (freq.size() > k) {
                char c = s.charAt(left);
                freq.merge(c, -1, Integer::sum);
                if (freq.get(c) == 0) freq.remove(c);
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
    
    public static void main(String[] args) {
        int[] nums = {1, 3, -1, -3, 5, 3, 6, 7};
        System.out.println(Arrays.toString(maxSlidingWindow(nums, 3)));
        // [3, 3, 5, 5, 6, 7]
        
        System.out.println(longestKDistinct("eceba", 2)); // 3 ("ece")
    }
}`
      },
      {
        title: "TreeMap/TreeSet — Sweep Line & Ordered Queries",
        language: "java",
        content: `import java.util.*;

public class OrderedPatterns {
    // Count overlapping intervals at any point (sweep line)
    static int maxOverlap(int[][] intervals) {
        TreeMap<Integer, Integer> events = new TreeMap<>();
        for (int[] iv : intervals) {
            events.merge(iv[0], 1, Integer::sum);   // interval start
            events.merge(iv[1], -1, Integer::sum);  // interval end
        }
        int max = 0, active = 0;
        for (int delta : events.values()) {
            active += delta;
            max = Math.max(max, active);
        }
        return max;
    }
    
    // Find closest value in a sorted set
    static int closestValue(TreeSet<Integer> set, int target) {
        Integer floor = set.floor(target);
        Integer ceil = set.ceiling(target);
        if (floor == null) return ceil;
        if (ceil == null) return floor;
        return (target - floor <= ceil - target) ? floor : ceil;
    }
    
    // Coordinate compression
    static Map<Integer, Integer> compress(int[] coords) {
        TreeSet<Integer> sorted = new TreeSet<>();
        for (int c : coords) sorted.add(c);
        Map<Integer, Integer> map = new HashMap<>();
        int idx = 0;
        for (int c : sorted) map.put(c, idx++);
        return map;
    }
    
    public static void main(String[] args) {
        int[][] intervals = {{1,4}, {2,5}, {3,6}, {5,8}};
        System.out.println("Max overlap: " + maxOverlap(intervals)); // 3
        
        TreeSet<Integer> set = new TreeSet<>(Arrays.asList(1, 5, 10, 15, 20));
        System.out.println("Closest to 12: " + closestValue(set, 12)); // 10
        
        int[] coords = {100, 500, 200, 100, 300};
        System.out.println("Compressed: " + compress(coords));
        // {100=0, 200=1, 300=2, 500=3}
    }
}`
      }
    ],
    warning: "In contests, always use **HashMap** over **TreeMap** unless you explicitly need sorted keys — HashMap is 5-10x faster."
  },
  {
    id: "col-concurrent",
    title: "Concurrent Collections",
    difficulty: "Hard",
    theory: [
      "Standard collections are **NOT thread-safe** — concurrent access causes data corruption or ConcurrentModificationException",
      "**ConcurrentHashMap** — thread-safe HashMap, uses fine-grained locking (lock striping), much faster than synchronizedMap",
      "**CopyOnWriteArrayList** — thread-safe List, creates a new copy on every write. Great for read-heavy, write-rare scenarios",
      "**ConcurrentLinkedQueue** — non-blocking thread-safe queue using CAS (Compare-And-Swap)",
      "**BlockingQueue** — thread-safe queue that blocks on take() when empty and put() when full. Used in producer-consumer pattern",
      "**ConcurrentSkipListMap** — thread-safe sorted map (like TreeMap but concurrent)",
      "**Collections.synchronizedXxx()** wraps with a single lock — works but has poor performance under contention",
      "Rule: prefer **java.util.concurrent** classes over synchronized wrappers"
    ],
    code: [
      {
        title: "ConcurrentHashMap & Thread-Safe Collections",
        language: "java",
        content: `import java.util.*;
import java.util.concurrent.*;

public class ConcurrentDemo {
    public static void main(String[] args) throws Exception {
        // ConcurrentHashMap — thread-safe, high performance
        ConcurrentHashMap<String, Integer> cmap = new ConcurrentHashMap<>();
        cmap.put("A", 1);
        cmap.put("B", 2);
        
        // Atomic operations
        cmap.putIfAbsent("C", 3);
        cmap.compute("A", (k, v) -> v + 10);      // A=11
        cmap.merge("B", 5, Integer::sum);           // B=7
        
        // CopyOnWriteArrayList — safe for iteration
        CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
        cowList.add("X"); cowList.add("Y"); cowList.add("Z");
        // Safe to iterate while other threads modify
        for (String s : cowList) {
            System.out.print(s + " "); // X Y Z
        }
        System.out.println();
        
        // BlockingQueue — producer/consumer
        BlockingQueue<Integer> bq = new ArrayBlockingQueue<>(5);
        bq.put(1); // blocks if full
        bq.put(2);
        int val = bq.take(); // blocks if empty
        System.out.println("Took: " + val); // 1
    }
}`
      },
      {
        title: "Producer-Consumer with BlockingQueue",
        language: "java",
        content: `import java.util.concurrent.*;

public class ProducerConsumer {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(10);
        
        // Producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    queue.put(i);
                    System.out.println("Produced: " + i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        // Consumer thread
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 5; i++) {
                    int val = queue.take(); // blocks if empty
                    System.out.println("Consumed: " + val);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        producer.start();
        consumer.start();
    }
}`
      }
    ],
    warning: "ConcurrentHashMap does **not** allow null keys or values — unlike HashMap. This prevents ambiguity in concurrent scenarios."
  }
];
