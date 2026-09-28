import { defineBackendChunk } from "./contract";

/**
 * Java Collections Framework (b047–b066).
 */
export const chunk04Collections = defineBackendChunk({
  topic: "collections",
  questions: [
    {
      id: "b047",
      question: "Draw the Java Collections Framework hierarchy and explain why Map is not a Collection.",
      answer:
        "Two independent roots:\n\n" +
        "`java.lang.Iterable` → `Collection` → `List`, `Set`, `Queue`\n\n" +
        "- **List** — ordered, index-addressable, duplicates allowed. `ArrayList`, `LinkedList`, `Vector`, `Stack`, `CopyOnWriteArrayList`.\n" +
        "- **Set** — no duplicates. `HashSet`, `LinkedHashSet`, `TreeSet` (via `SortedSet`/`NavigableSet`), `EnumSet`, `CopyOnWriteArraySet`, `ConcurrentSkipListSet`.\n" +
        "- **Queue** — ordered for processing. `PriorityQueue`, `ArrayDeque`, `LinkedList`; `Deque` extends it for double-ended use; `BlockingQueue` adds blocking operations (`ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`, `DelayQueue`, `PriorityBlockingQueue`).\n\n" +
        "`java.util.Map` is a **separate root**: `HashMap`, `LinkedHashMap`, `TreeMap` (`SortedMap`/`NavigableMap`), `Hashtable`, `EnumMap`, `IdentityHashMap`, `WeakHashMap`, `ConcurrentHashMap`, `ConcurrentSkipListMap`.\n\n" +
        "**Why Map is not a Collection** — the honest, complete answer has three parts:\n\n" +
        "1. **The element type differs.** A `Collection<E>` iterates single elements; a `Map<K,V>` is a set of *pairs*. `Collection`'s contract (`add(E)`, `iterator()` over `E`, `contains(Object)`) has no sensible single meaning for a map — would `add` take a key, a value or an entry?\n" +
        "2. **It would force bad methods.** Making `Map` a `Collection` would require it to support operations whose semantics are ambiguous, so most would throw `UnsupportedOperationException` — exactly the design smell the framework tries to avoid.\n" +
        "3. **The bridge already exists.** `keySet()`, `values()` and `entrySet()` are *views* onto the map, so you get collection behaviour where it makes sense. They are live views: removing from `keySet()` removes from the map.\n\n" +
        "Also name the supporting cast: `Iterator`, `ListIterator`, `Comparable`, `Comparator`, `Spliterator` (Java 8, the basis of parallel streams), and the utility classes `Collections` and `Arrays`.",
      code: `import java.util.*;

public class HierarchyDemo {
    public static void main(String[] args) {
        // Collection branch
        Collection<String> list  = new ArrayList<>(List.of("b", "a", "b"));
        Collection<String> set   = new LinkedHashSet<>(list);        // -> [b, a]
        Deque<String>      deque = new ArrayDeque<>(List.of("x", "y"));
        Queue<Integer>     pq    = new PriorityQueue<>(Comparator.reverseOrder());

        // Map branch - NOT a Collection
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("a", 1); map.put("b", 2); map.put("c", 3);

        // The three VIEWS are the bridge back to the Collection world.
        Set<String>                     keys    = map.keySet();
        Collection<Integer>             values  = map.values();
        Set<Map.Entry<String, Integer>> entries = map.entrySet();

        // Views are LIVE: mutating the view mutates the map.
        keys.remove("a");
        System.out.println(map);                                     // {b=2, c=3}

        // Entry views allow in-place value updates.
        for (Map.Entry<String, Integer> e : entries) e.setValue(e.getValue() * 10);
        System.out.println(map);                                     // {b=20, c=30}

        // But you cannot ADD through a view:
        // keys.add("d");   // UnsupportedOperationException
        System.out.println(set + " " + deque + " " + pq + " " + values);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Two roots — Iterable/Collection and Map — because a map holds pairs; keySet/values/entrySet are live views bridging the two.",
      followUps: [
        "What happens if you add to keySet()?",
        "Why is entrySet() the right way to iterate a map?",
      ],
    },
    {
      id: "b048",
      question: "ArrayList vs LinkedList — complexity, memory and when LinkedList is genuinely better.",
      answer:
        "ArrayList — a growable `Object[]`:\n\n" +
        "- `get(i)` / `set(i)` → **O(1)** true random access.\n" +
        "- `add(e)` at the end → **amortised O(1)**; when full it allocates a new array of `oldCapacity + (oldCapacity >> 1)` (1.5x) and `System.arraycopy`s.\n" +
        "- `add(i, e)` / `remove(i)` in the middle → **O(n)** because of the shift, but the shift is `System.arraycopy`, an intrinsic that moves memory at near memory-bandwidth speed.\n" +
        "- Memory: one object header plus one array; elements are contiguous references, so iteration is **cache friendly**.\n\n" +
        "LinkedList — a doubly-linked list:\n\n" +
        "- `get(i)` → **O(n)**; it walks from whichever end is closer.\n" +
        "- `addFirst` / `addLast` / `removeFirst` / `removeLast` → **O(1)**.\n" +
        "- Insert or remove **at a known `ListIterator` position** → O(1) pointer surgery.\n" +
        "- Memory: each element is a separate `Node` with two references plus a header — roughly **40 bytes per element** versus 4–8 for `ArrayList`. Nodes are scattered, so iteration causes **cache misses**.\n\n" +
        "**The honest modern answer:** `ArrayList` wins almost everywhere, including many cases where the Big-O table says otherwise, because memory locality dominates on real hardware. Even `remove(0)` in a loop is often faster on `ArrayList` for small n.\n\n" +
        "`LinkedList` earns its place only when you need a **`Deque`** — and even then `ArrayDeque` is faster and uses less memory. Joshua Bloch himself has said he would not add `LinkedList` today.\n\n" +
        "**Interview move:** answer with the complexity table, then say 'but in practice I default to `ArrayList` and use `ArrayDeque` for queues'. Add `new ArrayList<>(expectedSize)` to avoid repeated resizing.",
      code: `import java.util.*;

public class ListBenchmarkShape {

    public static void main(String[] args) {
        int n = 200_000;

        // Pre-size when you know the size: avoids ~25 grow+copy cycles.
        List<Integer> arrayList = new ArrayList<>(n);
        List<Integer> linkedList = new LinkedList<>();

        long t0 = System.nanoTime();
        for (int i = 0; i < n; i++) arrayList.add(i);         // amortised O(1)
        long addArray = System.nanoTime() - t0;

        t0 = System.nanoTime();
        for (int i = 0; i < n; i++) linkedList.add(i);        // O(1) but allocates a Node
        long addLinked = System.nanoTime() - t0;

        // Random access: the difference is brutal.
        t0 = System.nanoTime();
        long s1 = 0; for (int i = 0; i < n; i += 97) s1 += arrayList.get(i);   // O(1)
        long getArray = System.nanoTime() - t0;

        t0 = System.nanoTime();
        long s2 = 0; for (int i = 0; i < n; i += 97) s2 += linkedList.get(i);  // O(n) each!
        long getLinked = System.nanoTime() - t0;

        System.out.printf("add   array=%d linked=%d%n", addArray / 1000, addLinked / 1000);
        System.out.printf("get   array=%d linked=%d%n", getArray / 1000, getLinked / 1000);

        // Correct way to remove many elements from an ArrayList: ONE pass, no shifting storm.
        arrayList.removeIf(i -> i % 2 == 0);                  // O(n) total

        // If you need a queue/stack, use ArrayDeque - not LinkedList, not Stack.
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1); stack.push(2);
        System.out.println(stack.pop() + " " + s1 + s2);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Big-O says LinkedList wins at insertion; cache locality says ArrayList wins in practice — and ArrayDeque beats LinkedList as a deque anyway.",
      followUps: [
        "Why is System.arraycopy so much faster than a Java loop?",
        "What is ArrayList's growth factor and why 1.5x not 2x?",
      ],
    },
    {
      id: "b049",
      question: "Explain fail-fast vs fail-safe iterators and the modCount mechanism.",
      answer:
        "Fail-fast iterators:\n\n" +
        "- Used by `ArrayList`, `HashMap`, `HashSet`, `LinkedList`, `TreeMap` — the classic `java.util` collections.\n" +
        "- Each collection keeps an `int modCount` incremented on every **structural** modification (adding or removing an element; changing a value is not structural).\n" +
        "- `iterator()` snapshots it into `expectedModCount`. Every `next()` calls `checkForComodification()`; if they differ it throws **`ConcurrentModificationException`** immediately.\n" +
        "- **This is a bug detector, not a thread-safety mechanism.** The Javadoc is explicit: 'fail-fast behaviour cannot be guaranteed'. `modCount` is a plain non-volatile `int`, so a concurrent modification may go unnoticed. Never write code that *depends* on catching CME.\n" +
        "- It fires most often in **single-threaded** code — a `for-each` loop that calls `list.remove(x)` inside the body.\n\n" +
        "Fail-safe (more precisely 'weakly consistent') iterators:\n\n" +
        "- `CopyOnWriteArrayList`/`CopyOnWriteArraySet` iterate over an **immutable snapshot** of the array taken at `iterator()` time. Later writes are invisible and `iterator.remove()` throws `UnsupportedOperationException`. Reads are lock-free; every write copies the whole array, so it suits read-mostly data such as listener lists.\n" +
        "- `ConcurrentHashMap` and `ConcurrentSkipListMap` are **weakly consistent**: the iterator traverses the live structure, never throws CME, reflects elements present at construction and *may* reflect later changes. `size()` is an estimate.\n\n" +
        "**Correct removal during iteration:** `Iterator.remove()` (which updates `expectedModCount`), `Collection.removeIf(predicate)` (cleanest), or collect-then-remove. In a `Map`, iterate `entrySet()` and use the iterator.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class IteratorSemantics {
    public static void main(String[] args) {
        // ---- fail-fast: single-threaded bug ------------------------------
        List<String> list = new ArrayList<>(List.of("a", "b", "c"));
        try {
            for (String s : list) if (s.equals("b")) list.remove(s);   // CME
        } catch (ConcurrentModificationException e) {
            System.out.println("fail-fast: " + e.getClass().getSimpleName());
        }

        // Fix 1 - Iterator.remove() keeps expectedModCount in sync.
        for (Iterator<String> it = list.iterator(); it.hasNext(); ) {
            if (it.next().equals("b")) it.remove();
        }
        // Fix 2 - the idiomatic one.
        list.removeIf(s -> s.equals("c"));
        System.out.println(list);                                       // [a]

        // Quirk: removing the SECOND-TO-LAST element often escapes detection,
        // because hasNext() is 'cursor != size' and the loop simply ends early.
        List<String> quirk = new ArrayList<>(List.of("a", "b", "c"));
        for (String s : quirk) if (s.equals("b")) quirk.remove(s);      // no CME!
        System.out.println(quirk);                                      // [a, c]

        // ---- fail-safe: snapshot ----------------------------------------
        List<String> cow = new CopyOnWriteArrayList<>(List.of("a", "b"));
        Iterator<String> snapshot = cow.iterator();
        cow.add("c");                                                   // copies the array
        StringBuilder seen = new StringBuilder();
        snapshot.forEachRemaining(seen::append);
        System.out.println(seen);                                       // "ab" - not "abc"

        // ---- weakly consistent -------------------------------------------
        ConcurrentHashMap<String, Integer> chm = new ConcurrentHashMap<>(Map.of("a", 1));
        for (var e : chm.entrySet()) chm.put("b", 2);                   // no CME, ever
        System.out.println(chm.size());                                 // estimate: 2
    }
}`,
      codeLanguage: "java",
      explanation:
        "modCount vs expectedModCount is a best-effort bug detector, not thread safety; COW snapshots and CHM is weakly consistent.",
      followUps: [
        "Why does removing the second-to-last element sometimes not throw?",
        "Why can't you rely on catching ConcurrentModificationException?",
      ],
    },
    {
      id: "b050",
      question: "HashSet vs LinkedHashSet vs TreeSet — internals, ordering and cost.",
      answer:
        "HashSet:\n\n" +
        "- A thin wrapper over a `HashMap` whose values are a shared `PRESENT` sentinel object. `add(e)` is literally `map.put(e, PRESENT) == null`.\n" +
        "- **O(1)** average `add`/`contains`/`remove`; **no order guarantee at all** — iteration order depends on hashes and capacity and can change on resize.\n" +
        "- Requires a correct `hashCode`/`equals`. Permits one `null`.\n\n" +
        "LinkedHashSet:\n\n" +
        "- Extends `HashSet` but backs it with a `LinkedHashMap`, adding a doubly-linked list through the entries.\n" +
        "- **O(1)** operations plus **predictable insertion order**. Slightly more memory (two extra references per entry) and slightly slower writes, but **faster iteration** because it walks the list rather than the bucket array.\n" +
        "- The right default when you want deterministic output — deduplicating while preserving order is the classic use.\n\n" +
        "TreeSet:\n\n" +
        "- A `NavigableSet` backed by a `TreeMap` (a red-black tree). **O(log n)** for everything.\n" +
        "- **Sorted order**, by `Comparable` or a supplied `Comparator`. Does **not** permit `null` (it would need to be compared).\n" +
        "- Gives you `first`, `last`, `floor`, `ceiling`, `higher`, `lower`, `headSet`, `tailSet`, `subSet`, `descendingSet`, `pollFirst`, `pollLast` — the reason to choose it.\n" +
        "- **Critical semantic difference:** uniqueness is decided by `compareTo`/`compare` returning 0, **not** by `equals`. A comparator inconsistent with equals silently changes set semantics — `TreeSet` with `Comparator.comparing(Person::lastName)` treats two different people with the same surname as one element.\n\n" +
        "Also mention **`EnumSet`** — a bit-vector implementation for enum types that is dramatically faster and smaller than any of the above, and always the right choice for a set of enum constants.",
      code: `import java.util.*;

record Person(String first, String last, int age) {}

public class SetComparison {
    public static void main(String[] args) {
        List<String> input = List.of("delta", "alpha", "charlie", "alpha", "bravo");

        System.out.println(new HashSet<>(input));        // arbitrary order
        System.out.println(new LinkedHashSet<>(input));  // [delta, alpha, charlie, bravo]
        System.out.println(new TreeSet<>(input));        // [alpha, bravo, charlie, delta]

        // NavigableSet is the reason to pay O(log n).
        NavigableSet<Integer> t = new TreeSet<>(List.of(10, 20, 30, 40, 50));
        System.out.println(t.floor(35) + " " + t.ceiling(35));   // 30 40
        System.out.println(t.headSet(30, true));                 // [10, 20, 30]
        System.out.println(t.descendingSet());                   // [50, 40, 30, 20, 10]
        System.out.println(t.pollFirst() + " " + t.pollLast());  // 10 50

        // TRAP: TreeSet uniqueness uses compare()==0, NOT equals().
        Set<Person> byLast = new TreeSet<>(Comparator.comparing(Person::last));
        byLast.add(new Person("Ada",  "Lovelace", 36));
        byLast.add(new Person("Alan", "Lovelace", 41));          // rejected as "duplicate"
        System.out.println(byLast.size());                       // 1  (!)

        Set<Person> safe = new TreeSet<>(Comparator.comparing(Person::last)
                                                   .thenComparing(Person::first));
        safe.add(new Person("Ada",  "Lovelace", 36));
        safe.add(new Person("Alan", "Lovelace", 41));
        System.out.println(safe.size());                         // 2

        // EnumSet: a long bit-vector - fastest and smallest for enums.
        EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
        System.out.println(EnumSet.complementOf(weekend));
    }
    enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }
}`,
      codeLanguage: "java",
      explanation:
        "HashSet is a HashMap wrapper, LinkedHashSet adds insertion order, TreeSet is O(log n) and decides uniqueness by compare()==0 not equals().",
      followUps: [
        "Why does a comparator inconsistent with equals break TreeSet?",
        "When is EnumSet strictly better than HashSet?",
      ],
    },
    {
      id: "b051",
      question: "Explain the equals and hashCode contract and what breaks when you violate it.",
      answer:
        "The `equals` contract — it must be:\n\n" +
        "- **Reflexive**: `x.equals(x)` is true.\n" +
        "- **Symmetric**: `x.equals(y) == y.equals(x)`. Broken most often by comparing across a subclass boundary with `instanceof`.\n" +
        "- **Transitive**: if `x.equals(y)` and `y.equals(z)` then `x.equals(z)`. Adding a field in a subclass reliably breaks this.\n" +
        "- **Consistent**: repeated calls give the same result while nothing changes.\n" +
        "- **Non-null**: `x.equals(null)` is false, never an NPE.\n\n" +
        "The `hashCode` contract:\n\n" +
        "- Equal objects **must** have equal hash codes.\n" +
        "- Unequal objects *may* share a hash code (a collision) but a good distribution matters for performance.\n" +
        "- The value must not change while the object is used as a key.\n\n" +
        "What breaks when you violate it:\n\n" +
        "- **Override `equals` but not `hashCode`** — two equal objects land in different buckets, so `map.get(key)` returns `null` for a key that `equals` a stored one, and a `HashSet` happily stores duplicates. This is the number-one Java bug in interviews and in production.\n" +
        "- **Mutate a field used in `hashCode` after insertion** — the object is now in the wrong bucket and is effectively lost: `contains` returns false even though iteration shows it. Use **immutable keys**, or at least immutable key fields.\n" +
        "- **`hashCode` returning a constant** — everything collides; `HashMap` degrades to a list, then to a tree (O(log n)) since Java 8. Correct but slow.\n\n" +
        "**Practical rules:** use `Objects.equals` and `Objects.hash` (or a `record`, which generates both correctly), use `getClass() != o.getClass()` when you need strict symmetry with subclasses, and prefer a small stable business key over every field.",
      code: `import java.util.*;

final class Sku {                                   // GOOD: immutable, consistent
    private final String code;
    private final String variant;
    Sku(String code, String variant) { this.code = code; this.variant = variant; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;  // strict symmetry
        Sku other = (Sku) o;
        return Objects.equals(code, other.code) && Objects.equals(variant, other.variant);
    }
    @Override public int hashCode() { return Objects.hash(code, variant); }
    @Override public String toString() { return code + "/" + variant; }
}

class MutableKey {                                  // BAD: mutable hash field
    String id;
    MutableKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) {
        return o instanceof MutableKey m && Objects.equals(id, m.id);
    }
    @Override public int hashCode() { return Objects.hashCode(id); }
}

class BrokenSku {                                   // BAD: equals without hashCode
    final String code;
    BrokenSku(String code) { this.code = code; }
    @Override public boolean equals(Object o) {
        return o instanceof BrokenSku b && code.equals(b.code);
    }
    // no hashCode() -> identity hash -> lookups fail
}

public class ContractDemo {
    public static void main(String[] args) {
        Map<Sku, Integer> stock = new HashMap<>();
        stock.put(new Sku("TSHIRT", "M"), 12);
        System.out.println(stock.get(new Sku("TSHIRT", "M")));   // 12 - correct

        Map<BrokenSku, Integer> broken = new HashMap<>();
        broken.put(new BrokenSku("TSHIRT"), 12);
        System.out.println(broken.get(new BrokenSku("TSHIRT"))); // null (!)

        Set<MutableKey> set = new HashSet<>();
        MutableKey k = new MutableKey("a");
        set.add(k);
        k.id = "b";                                              // hash changed
        System.out.println(set.contains(k));                     // false (!)
        System.out.println(set.iterator().next().id);            // "b" - still in there

        // record generates a correct equals/hashCode for you.
        record Point(int x, int y) {}
        System.out.println(new HashSet<>(List.of(new Point(1,2), new Point(1,2))).size()); // 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "Equal objects must hash equally; mutating a hash field after insertion loses the entry even though iteration still shows it.",
      followUps: [
        "Why does using instanceof instead of getClass() break symmetry?",
        "Why is a record a safe map key?",
      ],
    },
    {
      id: "b052",
      question: "Comparable vs Comparator — and what makes a comparator contract-violating?",
      answer:
        "Comparable<T> (`java.lang`):\n\n" +
        "- One method, `compareTo(T)`, defining the type's **natural ordering**.\n" +
        "- Intrinsic to the class, so you must own the source and there can be exactly one.\n" +
        "- Required by `TreeSet`/`TreeMap` and `Collections.sort(list)` when no comparator is supplied.\n\n" +
        "Comparator<T> (`java.util`):\n\n" +
        "- `compare(T, T)`, a functional interface, so any number of orderings can exist externally.\n" +
        "- Rich combinators since Java 8: `comparing`, `thenComparing`, `reversed`, `nullsFirst`, `nullsLast`, `comparingInt/Long/Double` (which avoid boxing).\n" +
        "- The only option for classes you do not own, and the right tool whenever the ordering is context-dependent.\n\n" +
        "The contract, which both must satisfy:\n\n" +
        "1. `sgn(compare(x,y)) == -sgn(compare(y,x))` — antisymmetry.\n" +
        "2. Transitivity: `compare(x,y) > 0 && compare(y,z) > 0` implies `compare(x,z) > 0`.\n" +
        "3. `compare(x,y) == 0` implies `sgn(compare(x,z)) == sgn(compare(y,z))`.\n" +
        "4. *Recommended*: consistent with `equals`, i.e. `compare(x,y) == 0` iff `x.equals(y)`. `TreeSet`/`TreeMap` behave surprisingly when this is violated.\n\n" +
        "Real failure modes:\n\n" +
        "- **`return a.value - b.value`** overflows for large or negative ints and silently produces the wrong sign. Use `Integer.compare(a, b)`.\n" +
        "- **A non-transitive comparator** (for example, returning 0 for 'close enough' values) makes `Arrays.sort` throw `IllegalArgumentException: Comparison method violates its general contract!` — TimSort detects the inconsistency. That exception message is a common interview prompt.\n" +
        "- **`Double.compare`** handles `NaN` and `-0.0`; raw `<` does not.\n\n" +
        "Also know that `Collections.sort` / `List.sort` use **TimSort**: stable, adaptive, O(n log n) worst case, O(n) on nearly sorted data.",
      code: `import java.util.*;
import java.util.Comparator;

record Employee(String name, String dept, Integer salary, Integer age) implements Comparable<Employee> {
    @Override public int compareTo(Employee o) {          // natural order: by name
        return name.compareTo(o.name);
    }
}

public class OrderingDemo {
    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(
            new Employee("Ada", "ENG", 180_000, 36),
            new Employee("Bob", "ENG", 180_000, 41),
            new Employee("Cy",  "OPS", null,    29)));

        Collections.sort(staff);                          // Comparable - by name

        // Comparator combinators: dept asc, salary desc (nulls last), then age.
        Comparator<Employee> byPay = Comparator
            .comparing(Employee::dept)
            .thenComparing(Employee::salary,
                           Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparingInt(Employee::age);             // no boxing
        staff.sort(byPay);
        staff.forEach(System.out::println);

        // BROKEN: subtraction overflows.
        Comparator<Integer> bad = (a, b) -> a - b;
        System.out.println(bad.compare(Integer.MIN_VALUE, 1));   // positive (!) - wrong
        Comparator<Integer> good = Integer::compare;
        System.out.println(good.compare(Integer.MIN_VALUE, 1));  // negative - correct

        // BROKEN: non-transitive "close enough" comparator.
        Comparator<Double> fuzzy = (a, b) -> Math.abs(a - b) < 1.0 ? 0 : Double.compare(a, b);
        List<Double> xs = new ArrayList<>();
        for (int i = 0; i < 64; i++) xs.add(i * 0.4);
        try { xs.sort(fuzzy); }
        catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());  // Comparison method violates its general contract!
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Comparable is the single natural order; Comparator is external and composable — and subtraction-based or non-transitive comparators break TimSort.",
      followUps: [
        "Why does TimSort throw rather than produce a wrong order?",
        "When does consistency with equals actually matter?",
      ],
    },
    {
      id: "b053",
      question: "Which Map implementation would you pick for which job — HashMap, LinkedHashMap, TreeMap, EnumMap, WeakHashMap, IdentityHashMap?",
      answer:
        "HashMap — the default. O(1) average, no ordering, one null key, many null values. Use unless you need something specific.\n\n" +
        "LinkedHashMap — a `HashMap` plus a doubly-linked list of entries.\n\n" +
        "- Default is **insertion order**; `new LinkedHashMap<>(cap, loadFactor, true)` gives **access order**.\n" +
        "- Override `removeEldestEntry(eldest)` and you have a **bounded LRU cache in five lines**. This is a classic 'implement an LRU cache' answer — know it.\n" +
        "- Iteration is faster than `HashMap` because it walks the list, not the buckets.\n\n" +
        "TreeMap — red-black tree, O(log n), sorted by `Comparable` or `Comparator`. Choose it for range queries: `headMap`, `tailMap`, `subMap`, `floorKey`, `ceilingKey`, `firstEntry`, `pollFirstEntry`. No null keys.\n\n" +
        "EnumMap — an array indexed by `ordinal()`. Extremely fast and compact, iterates in enum declaration order, no hashing at all. **Always** prefer it to `HashMap<SomeEnum, V>`.\n\n" +
        "WeakHashMap — keys held by weak references, so an entry disappears once the key is unreachable elsewhere. Used for canonicalising caches and metadata keyed by `Class`. **Caveat:** the *value* must not strongly reference the key or the entry never clears.\n\n" +
        "IdentityHashMap — compares keys with `==` rather than `equals`. Used by serialisation frameworks and graph traversal to track visited objects.\n\n" +
        "Also: **`Hashtable`** is legacy (synchronised on every method, no nulls) — use `ConcurrentHashMap`. **`ConcurrentSkipListMap`** is the concurrent sorted map. **`Map.of(...)`** creates a small immutable map (null-hostile, iteration order deliberately randomised per JVM run).",
      code: `import java.util.*;

public class MapChooser {

    /** A bounded LRU cache in one override - the classic interview answer. */
    static class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;
        LruCache(int capacity) {
            super(capacity, 0.75f, true);                 // true = ACCESS order
            this.capacity = capacity;
        }
        @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacity;
        }
    }

    enum Region { NA, EU, APAC }

    public static void main(String[] args) {
        LruCache<String, Integer> lru = new LruCache<>(3);
        lru.put("a", 1); lru.put("b", 2); lru.put("c", 3);
        lru.get("a");                                     // 'a' becomes most-recent
        lru.put("d", 4);                                  // evicts 'b' (least recent)
        System.out.println(lru.keySet());                 // [c, a, d]

        // TreeMap for range queries.
        NavigableMap<Integer, String> tiers = new TreeMap<>();
        tiers.put(0, "bronze"); tiers.put(1000, "silver"); tiers.put(5000, "gold");
        System.out.println(tiers.floorEntry(2500).getValue());   // silver
        System.out.println(tiers.headMap(5000));                 // {0=bronze, 1000=silver}

        // EnumMap - array-backed, ordinal indexed, declaration-ordered.
        EnumMap<Region, Integer> byRegion = new EnumMap<>(Region.class);
        byRegion.put(Region.APAC, 3); byRegion.put(Region.NA, 1);
        System.out.println(byRegion);                            // {NA=1, APAC=3}

        // IdentityHashMap - reference equality.
        Map<String, String> id = new IdentityHashMap<>();
        String x = new String("k"), y = new String("k");
        id.put(x, "1"); id.put(y, "2");
        System.out.println(id.size());                           // 2 (equals says 1)

        // WeakHashMap - entry vanishes when the key is unreachable.
        Map<Object, String> weak = new WeakHashMap<>();
        Object key = new Object();
        weak.put(key, "meta");
        key = null; System.gc();
        System.out.println(weak.size());                         // usually 0
    }
}`,
      codeLanguage: "java",
      explanation:
        "LinkedHashMap access-order plus removeEldestEntry is the five-line LRU; EnumMap beats HashMap for enum keys; IdentityHashMap uses ==.",
      followUps: [
        "Why must a WeakHashMap value not reference its key?",
        "Why is Map.of iteration order randomised between JVM runs?",
      ],
    },
    {
      id: "b054",
      question: "What are the Java 8+ default methods on Map and how do you use them correctly?",
      answer:
        "Java 8 added methods that eliminate most check-then-act boilerplate — and several of them are **atomic** on `ConcurrentHashMap`, which is the real reason to prefer them.\n\n" +
        "- **`getOrDefault(k, def)`** — read with a fallback, no mutation.\n" +
        "- **`putIfAbsent(k, v)`** — insert only if absent; returns the existing value or null. Note it still **evaluates `v` eagerly**.\n" +
        "- **`computeIfAbsent(k, fn)`** — the lazy version: the function only runs on a miss. The canonical way to build a multimap: `map.computeIfAbsent(key, x -> new ArrayList<>()).add(item)`.\n" +
        "- **`computeIfPresent(k, fn)`** — update only if present; returning `null` removes the entry.\n" +
        "- **`compute(k, fn)`** — always runs; sees `null` for a missing key; returning `null` removes.\n" +
        "- **`merge(k, v, fn)`** — insert `v` if absent, otherwise combine old and new. The cleanest counter idiom: `map.merge(word, 1, Integer::sum)`.\n" +
        "- **`forEach(BiConsumer)`**, **`replaceAll(BiFunction)`**, **`remove(k, v)`** and **`replace(k, old, new)`** (conditional, atomic on CHM).\n\n" +
        "The traps:\n\n" +
        "- **Recursive mutation inside `computeIfAbsent`.** On `HashMap` modifying the same map inside the mapping function can corrupt it or throw `ConcurrentModificationException` (Java 9+ detects it). On `ConcurrentHashMap` it can **deadlock** because the bin is locked.\n" +
        "- Returning `null` from `compute`/`merge` **removes** the key — occasionally surprising.\n" +
        "- `computeIfAbsent` holds a bin lock on CHM, so keep the function **short and side-effect free**; never do IO in it.\n\n" +
        "**The atomicity point:** on `ConcurrentHashMap`, `merge`/`compute`/`computeIfAbsent` are atomic, whereas `get`-then-`put` is a race. That is the correct answer to 'how do you increment a concurrent counter'.",
      code: `import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

public class MapDefaults {
    public static void main(String[] args) {
        // Word frequency - three styles, best last.
        String[] words = { "a", "b", "a", "c", "b", "a" };

        Map<String, Integer> old = new HashMap<>();
        for (String w : words) {                                 // pre-Java 8
            Integer n = old.get(w);
            old.put(w, n == null ? 1 : n + 1);
        }

        Map<String, Integer> better = new HashMap<>();
        for (String w : words) better.merge(w, 1, Integer::sum); // one line, atomic on CHM
        System.out.println(better);                              // {a=3, b=2, c=1}

        // Multimap without a library.
        Map<Character, List<String>> byFirst = new HashMap<>();
        for (String w : words) byFirst.computeIfAbsent(w.charAt(0), k -> new ArrayList<>())
                                      .add(w);
        System.out.println(byFirst);

        // Memoisation.
        Map<Integer, Long> memo = new HashMap<>();
        Function<Integer, Long> square = n -> { System.out.println("computing " + n);
                                                return (long) n * n; };
        memo.computeIfAbsent(9, square::apply);
        memo.computeIfAbsent(9, square::apply);                  // not recomputed
        System.out.println(memo);

        // compute / computeIfPresent: returning null REMOVES the key.
        Map<String, Integer> stock = new HashMap<>(Map.of("x", 1));
        stock.computeIfPresent("x", (k, v) -> v - 1 == 0 ? null : v - 1);
        System.out.println(stock.containsKey("x"));              // false

        // Concurrency: get-then-put is a race; merge is atomic.
        ConcurrentHashMap<String, Integer> counters = new ConcurrentHashMap<>();
        counters.merge("hits", 1, Integer::sum);                 // safe
        counters.compute("hits", (k, v) -> v == null ? 1 : v + 1);// safe
        // counters.put("hits", counters.getOrDefault("hits",0)+1); // RACE - do not

        // TRAP: recursive update inside computeIfAbsent.
        Map<String, Integer> m = new HashMap<>();
        try {
            m.computeIfAbsent("a", k -> { m.put("b", 2); return 1; });  // CME on Java 9+
        } catch (ConcurrentModificationException e) {
            System.out.println("recursive update rejected");
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "merge/compute/computeIfAbsent remove check-then-act boilerplate and are atomic on ConcurrentHashMap — but never mutate the map inside the function.",
      followUps: [
        "Why can computeIfAbsent deadlock on a ConcurrentHashMap?",
        "What is the difference between putIfAbsent and computeIfAbsent?",
      ],
    },
    {
      id: "b055",
      question: "How do you create immutable and unmodifiable collections, and what is the difference?",
      answer:
        "**Unmodifiable** means the *view* rejects mutation. **Immutable** means nothing can change the contents. They are not the same thing.\n\n" +
        "`Collections.unmodifiableList(list)`:\n\n" +
        "- Returns a **wrapper view**. Mutating methods throw `UnsupportedOperationException`, but the **underlying list is still mutable** — change it and the view changes too. This is a read-only *view*, not a guarantee.\n\n" +
        "`List.of(...)`, `Set.of(...)`, `Map.of(...)` (Java 9):\n\n" +
        "- Genuinely **immutable**, structurally shared, memory-optimised (specialised classes for 0, 1 and 2 elements).\n" +
        "- **Null-hostile**: `List.of(null)` throws `NullPointerException`, and `list.contains(null)` throws too — a real migration surprise from `Arrays.asList`.\n" +
        "- `Set.of` and `Map.of` **reject duplicates** at construction with `IllegalArgumentException`.\n" +
        "- Iteration order of `Set.of`/`Map.of` is **deliberately randomised per JVM run** so nobody accidentally depends on it.\n" +
        "- `Map.of` supports up to 10 pairs; use `Map.ofEntries(entry(k,v), ...)` beyond that.\n\n" +
        "`List.copyOf(collection)` / `Map.copyOf` (Java 10) — an immutable snapshot copy; returns the argument unchanged if it is already an immutable instance of the same kind.\n\n" +
        "`Arrays.asList(array)` — the odd one out: a **fixed-size view backed by the array**. `set(i, v)` works and writes through to the array; `add`/`remove` throw. `Arrays.asList(intArray)` with a primitive array gives a single-element `List<int[]>`, a classic puzzle.\n\n" +
        "**Shallow vs deep:** an immutable collection of mutable objects is still mutable in practice. `List.of(mutableUser)` prevents replacing the element, not editing the user. Defensive copies or immutable element types are the real answer.\n\n" +
        "Streams: `collect(Collectors.toList())` gives *some* mutable list; `Stream.toList()` (Java 16) gives an **unmodifiable** one; `toUnmodifiableList()` is explicit.",
      code: `import java.util.*;
import java.util.stream.*;

public class ImmutabilityDemo {
    public static void main(String[] args) {
        // 1. Unmodifiable VIEW - the backing list is still live.
        List<String> backing = new ArrayList<>(List.of("a", "b"));
        List<String> view = Collections.unmodifiableList(backing);
        backing.add("c");                                     // allowed!
        System.out.println(view);                             // [a, b, c] - view changed
        try { view.add("d"); } catch (UnsupportedOperationException e) {
            System.out.println("view is read-only");
        }

        // 2. Truly immutable.
        List<String> immutable = List.of("a", "b");
        // immutable.add("c");                                // UnsupportedOperationException
        System.out.println(List.copyOf(backing));             // independent snapshot

        // 3. Null hostility - a real migration trap.
        try { List.of("a", null); } catch (NullPointerException e) {
            System.out.println("List.of rejects null");
        }
        System.out.println(Arrays.asList("a", null));         // [a, null] - allowed

        // 4. Arrays.asList is a fixed-size VIEW over the array.
        String[] arr = { "x", "y" };
        List<String> asList = Arrays.asList(arr);
        asList.set(0, "z");                                   // writes THROUGH
        System.out.println(arr[0]);                           // z
        // asList.add("w");                                   // UnsupportedOperationException

        int[] primitives = { 1, 2, 3 };
        System.out.println(Arrays.asList(primitives).size()); // 1 (!) - List<int[]>
        System.out.println(Arrays.stream(primitives).boxed().toList()); // [1, 2, 3]

        // 5. Shallow immutability.
        StringBuilder sb = new StringBuilder("mutable");
        List<StringBuilder> frozen = List.of(sb);
        sb.append("!");                                       // the ELEMENT still changes
        System.out.println(frozen.get(0));                    // mutable!

        // 6. Streams
        List<Integer> mutableResult   = Stream.of(1,2,3).collect(Collectors.toList());
        List<Integer> unmodifiable    = Stream.of(1,2,3).toList();             // Java 16+
        List<Integer> explicitlyRO    = Stream.of(1,2,3)
                                              .collect(Collectors.toUnmodifiableList());
        System.out.println(mutableResult.size() + unmodifiable.size() + explicitlyRO.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "unmodifiableList wraps a still-mutable list; List.of is truly immutable, null-hostile, and only shallowly so.",
      followUps: [
        "Why is Set.of iteration order randomised per JVM?",
        "How do you make a defensively immutable class with a collection field?",
      ],
    },
    {
      id: "b056",
      question: "Explain ConcurrentHashMap's internals and how it differs from Hashtable and synchronizedMap.",
      answer:
        "Three approaches to a thread-safe map, with very different scalability.\n\n" +
        "Hashtable (legacy) — every method is `synchronized` on the whole object. One writer *or* one reader at a time. No nulls. Effectively obsolete.\n\n" +
        "`Collections.synchronizedMap(map)` — a wrapper that synchronises each method on a single mutex. Same single-lock bottleneck, plus **iteration is not thread-safe**: you must manually `synchronized (map) { for (...) }` or risk `ConcurrentModificationException`.\n\n" +
        "ConcurrentHashMap:\n\n" +
        "- **Java 7**: segment locking — the map was split into 16 `Segment`s, each an independent `ReentrantLock`, giving 16-way write concurrency.\n" +
        "- **Java 8 rewrite**: segments are gone. The table is a plain `Node[]` and writes **lock only the head node of the target bin** using `synchronized`. Empty bins are populated with a lock-free `CAS`. Concurrency now scales with the **number of bins**, not a fixed 16.\n" +
        "- **Reads are completely lock-free**: `Node.val` and `Node.next` are `volatile`, so `get()` never blocks, even during a resize.\n" +
        "- **Resizing is cooperative**: a thread that encounters a `ForwardingNode` helps transfer bins instead of waiting.\n" +
        "- **`size()` uses a striped counter** (`baseCount` plus a `CounterCell[]`, the same idea as `LongAdder`) to avoid a single contended counter — which is why `size()` is an estimate and `mappingCount()` returning `long` is preferred.\n" +
        "- **Null keys and values are forbidden**, because `get()` returning null would be ambiguous between 'absent' and 'mapped to null' with no way to disambiguate atomically.\n" +
        "- Bulk operations `forEach`, `search`, `reduce` accept a parallelism threshold.\n\n" +
        "**The practical rule:** use `ConcurrentHashMap` and its **atomic** methods (`merge`, `compute`, `putIfAbsent`). A `get` followed by a `put` is a race no matter which map you use.",
      code: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

public class ConcurrentMapDemo {
    public static void main(String[] args) throws Exception {
        // synchronizedMap: iteration needs MANUAL synchronisation.
        Map<String, Integer> sync = Collections.synchronizedMap(new HashMap<>());
        sync.put("a", 1);
        synchronized (sync) {                       // required, or risk CME
            for (var e : sync.entrySet()) { /* ... */ }
        }

        ConcurrentHashMap<String, Integer> chm = new ConcurrentHashMap<>();

        // Atomic read-modify-write - no external lock needed.
        chm.merge("hits", 1, Integer::sum);
        chm.compute("hits", (k, v) -> v == null ? 1 : v + 1);
        chm.putIfAbsent("first", 1);
        chm.replace("hits", 2, 20);                 // CAS-style conditional replace

        // NOT atomic even on CHM - two separate operations.
        // chm.put("hits", chm.get("hits") + 1);

        // Nulls are forbidden by design.
        try { chm.put("k", null); }
        catch (NullPointerException e) { System.out.println("CHM forbids null values"); }

        // Hammer it from many threads to show lock-free reads + per-bin writes.
        int threads = 8, perThread = 50_000;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch done = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                for (int i = 0; i < perThread; i++) chm.merge("counter", 1, Integer::sum);
                done.countDown();
            });
        }
        done.await();
        pool.shutdown();
        System.out.println(chm.get("counter"));     // exactly 400000
        System.out.println(chm.mappingCount());     // long, preferred over size()

        // For a pure counter, LongAdder beats a map entry under contention.
        LongAdder adder = new LongAdder();
        adder.increment();
        System.out.println(adder.sum());

        // Bulk parallel operation.
        chm.forEach(1, (k, v) -> { /* parallel when > 1 element per task */ });
    }
}`,
      codeLanguage: "java",
      explanation:
        "Java 8 CHM locks one bin head with synchronized and CASes empty bins; reads are volatile and lock-free, and nulls are banned for disambiguation.",
      followUps: [
        "Why is size() an estimate on ConcurrentHashMap?",
        "How does a resize stay correct while readers are traversing?",
      ],
    },
    {
      id: "b057",
      question: "Deque, ArrayDeque, PriorityQueue and BlockingQueue — what do you use when?",
      answer:
        "ArrayDeque — a **circular array** deque. This should be your default stack **and** queue.\n\n" +
        "- O(1) amortised at both ends, no per-element node allocation, cache friendly.\n" +
        "- Faster than `Stack` (which is synchronised and extends `Vector`) and faster than `LinkedList`.\n" +
        "- Does **not** allow `null` — precisely so that `poll()` returning null unambiguously means empty.\n\n" +
        "PriorityQueue — a **binary min-heap** in an array.\n\n" +
        "- `offer`/`poll` are O(log n); `peek` is O(1); `remove(Object)` and `contains` are **O(n)**.\n" +
        "- **Iteration order is not sorted** — only `poll()` order is. People get this wrong constantly: printing a `PriorityQueue` shows heap order.\n" +
        "- Not stable for equal priorities; add a sequence number to the comparator if you need FIFO among ties.\n" +
        "- Unbounded, so it grows until memory runs out.\n\n" +
        "BlockingQueue — the producer/consumer backbone.\n\n" +
        "- `put`/`take` block; `offer(e, timeout, unit)`/`poll(timeout, unit)` time out; `offer`/`poll` return immediately.\n" +
        "- **`ArrayBlockingQueue`** — bounded, single lock, optional fairness.\n" +
        "- **`LinkedBlockingQueue`** — optionally bounded, **two locks** (head and tail) so producers and consumers contend less.\n" +
        "- **`SynchronousQueue`** — zero capacity, a direct hand-off; what `Executors.newCachedThreadPool` uses.\n" +
        "- **`PriorityBlockingQueue`**, **`DelayQueue`** (elements become available after a delay — scheduling), **`LinkedTransferQueue`** (a producer can wait for a consumer).\n\n" +
        "**The production point: always bound your queue.** An unbounded `LinkedBlockingQueue` in a thread pool turns backpressure into an `OutOfMemoryError`. A bounded queue plus a sensible `RejectedExecutionHandler` is how you shed load deliberately.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class QueueChooser {
    record Task(String name, int priority, long seq) {}

    public static void main(String[] args) throws Exception {
        // Stack and queue: ArrayDeque, not Stack, not LinkedList.
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1); stack.push(2);
        System.out.println(stack.pop());                        // 2 (LIFO)

        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(1); queue.offer(2);
        System.out.println(queue.poll());                       // 1 (FIFO)

        // PriorityQueue: poll order is sorted, ITERATION order is not.
        PriorityQueue<Task> pq = new PriorityQueue<>(
            Comparator.comparingInt(Task::priority).thenComparingLong(Task::seq)); // stable ties
        pq.offer(new Task("low", 5, 0));
        pq.offer(new Task("high", 1, 1));
        pq.offer(new Task("mid", 3, 2));
        System.out.println(pq);                                 // heap order, NOT sorted
        while (!pq.isEmpty()) System.out.print(pq.poll().name() + " ");  // high mid low
        System.out.println();

        // Producer/consumer with a BOUNDED queue -> real backpressure.
        BlockingQueue<String> work = new ArrayBlockingQueue<>(100);
        ExecutorService consumers = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 4; i++) consumers.submit(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    String item = work.poll(1, TimeUnit.SECONDS);
                    if (item == null) break;
                    /* process */
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        for (int i = 0; i < 500; i++) work.put("job-" + i);      // blocks when full
        consumers.shutdown();
        consumers.awaitTermination(5, TimeUnit.SECONDS);

        // Bounded pool + bounded queue + explicit rejection policy.
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
            4, 8, 60, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1000),                      // never unbounded
            new ThreadPoolExecutor.CallerRunsPolicy());          // push back on the caller
        pool.shutdown();
    }
}`,
      codeLanguage: "java",
      explanation:
        "ArrayDeque for stacks and queues, PriorityQueue's iteration order is heap order not sorted, and unbounded queues convert backpressure into OOM.",
      followUps: [
        "How do you make a PriorityQueue stable for equal priorities?",
        "Why does SynchronousQueue suit a cached thread pool?",
      ],
    },
    {
      id: "b058",
      question: "What is the internal working of ArrayList — capacity, growth and the removal cost?",
      answer:
        "`ArrayList` is a managed `Object[] elementData` plus an `int size`.\n\n" +
        "Construction:\n\n" +
        "- `new ArrayList<>()` starts with a **shared empty array** (`DEFAULTCAPACITY_EMPTY_ELEMENTDATA`) and only allocates 10 slots on the first `add`. This lazy allocation makes empty lists nearly free.\n" +
        "- `new ArrayList<>(n)` allocates exactly `n`. Pre-sizing is the single cheapest optimisation available.\n\n" +
        "Growth:\n\n" +
        "- On overflow, `grow()` computes `newCapacity = oldCapacity + (oldCapacity >> 1)` — **1.5x**, not 2x — then `Arrays.copyOf`.\n" +
        "- 1.5x is a deliberate trade-off: less wasted memory than doubling, and (with the classic argument) the freed blocks can be reused by later allocations.\n" +
        "- Growing from 10 to 1,000,000 costs about 35 reallocations and copies **~2x the final element count** in total moves. Amortised O(1) per add, but with real GC pressure.\n\n" +
        "Removal:\n\n" +
        "- `remove(i)` does `System.arraycopy` to shift the tail left and nulls the last slot (so the GC can reclaim it). **Capacity never shrinks automatically** — call `trimToSize()` if you dropped a lot of elements from a large list.\n" +
        "- Removing in a loop from the front is O(n²). `removeIf` does it in **one pass**; so does iterating backwards.\n\n" +
        "Other details worth mentioning:\n\n" +
        "- `subList` returns a **view**; structurally modifying the parent invalidates it (`ConcurrentModificationException`), and `subList(a,b).clear()` is the idiomatic range-delete.\n" +
        "- `toArray()` returns `Object[]`; `toArray(new String[0])` is documented as **faster** than sizing the array yourself on modern JVMs.\n" +
        "- `ensureCapacity(n)` pre-grows before a known bulk insert.",
      code: `import java.util.*;

public class ArrayListInternals {
    public static void main(String[] args) {
        // Lazy allocation: no array until the first add.
        List<Integer> lazy = new ArrayList<>();          // shared empty array
        lazy.add(1);                                     // now capacity 10

        // Pre-size when the count is known - avoids ~35 grow+copy cycles.
        int n = 1_000_000;
        List<Integer> sized = new ArrayList<>(n);
        long t0 = System.nanoTime();
        for (int i = 0; i < n; i++) sized.add(i);
        long presized = System.nanoTime() - t0;

        List<Integer> grown = new ArrayList<>();
        t0 = System.nanoTime();
        for (int i = 0; i < n; i++) grown.add(i);        // 10 -> 15 -> 22 -> ... (1.5x)
        long growing = System.nanoTime() - t0;
        System.out.printf("presized=%dms growing=%dms%n",
                          presized / 1_000_000, growing / 1_000_000);

        // Removal cost: O(n^2) vs O(n).
        List<Integer> a = new ArrayList<>(sized);
        t0 = System.nanoTime();
        a.removeIf(i -> i % 2 == 0);                     // ONE pass
        System.out.println("removeIf ms " + (System.nanoTime() - t0) / 1_000_000);

        // subList is a VIEW - the idiomatic range delete.
        List<Integer> data = new ArrayList<>(List.of(0,1,2,3,4,5,6,7,8,9));
        data.subList(2, 5).clear();                      // removes 2,3,4 in one shift
        System.out.println(data);                        // [0, 1, 5, 6, 7, 8, 9]

        List<Integer> viewed = data.subList(0, 3);
        data.add(99);                                    // structural change to the parent
        try { viewed.get(0); }
        catch (ConcurrentModificationException e) { System.out.println("view invalidated"); }

        // Capacity does not shrink automatically.
        ArrayList<Integer> big = new ArrayList<>(1_000_000);
        big.add(1);
        big.trimToSize();                                // reclaim the unused array

        // Idiomatic toArray.
        String[] arr = new ArrayList<>(List.of("a","b")).toArray(new String[0]);
        System.out.println(Arrays.toString(arr));
    }
}`,
      codeLanguage: "java",
      explanation:
        "1.5x growth with array copies, no automatic shrink, and subList is a view — pre-sizing and removeIf are the two cheap wins.",
      followUps: [
        "Why is toArray(new String[0]) faster than toArray(new String[size])?",
        "Why does ArrayList null the vacated slot on remove?",
      ],
    },
    {
      id: "b059",
      question: "How does the Streams API relate to collections, and when is a parallel stream actually faster?",
      answer:
        "A stream is **not** a data structure. It is a pipeline over a source with three parts: a source (`collection.stream()`, `Arrays.stream`, `Stream.iterate`), zero or more **intermediate** operations (lazy, return a new stream: `filter`, `map`, `flatMap`, `sorted`, `distinct`, `limit`, `peek`, `takeWhile`), and exactly one **terminal** operation (`collect`, `reduce`, `forEach`, `count`, `anyMatch`, `findFirst`).\n\n" +
        "Key properties:\n\n" +
        "- **Lazy**: nothing runs until the terminal operation. This allows **fusion** — `filter().map().findFirst()` makes one pass and stops early.\n" +
        "- **Single use**: consuming a stream twice throws `IllegalStateException`.\n" +
        "- **Non-mutating**: the source is untouched. Mutating the source during traversal is undefined behaviour.\n" +
        "- **Short-circuiting** operations (`findFirst`, `anyMatch`, `limit`) can terminate an infinite stream.\n\n" +
        "Parallel streams — the honest answer:\n\n" +
        "- `parallelStream()` splits the source with a `Spliterator` and runs on the **common `ForkJoinPool`**, whose size is `cores - 1`.\n" +
        "- It pays off only when **all** of these hold: a large N (rule of thumb: tens of thousands of elements), a **CPU-bound** per-element cost, an efficiently **splittable** source (arrays, `ArrayList`, `IntStream.range` split well; `LinkedList`, `Iterator`-based and IO sources do not), and a **stateless, associative, side-effect-free** pipeline.\n" +
        "- **Never do blocking IO in a parallel stream.** It occupies the common pool, which is shared by the whole JVM — including `CompletableFuture` defaults — so one slow pipeline starves everything else.\n" +
        "- Ordered operations (`findFirst`, `limit`, `sorted`, `forEachOrdered`) force extra coordination and can make parallel **slower** than sequential.\n" +
        "- `collect` into a shared mutable container without the right collector is a race; use `Collectors.toConcurrentMap` or `groupingByConcurrent` when it genuinely helps.\n\n" +
        "**The line to deliver:** 'parallel streams are for large CPU-bound work over splittable sources — and I measure before and after.'",
      code: `import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

record Order(String id, String region, long amount, String status) {}

public class StreamsAndCollections {
    public static void main(String[] args) {
        List<Order> orders = IntStream.range(0, 100_000)
            .mapToObj(i -> new Order("o" + i, i % 4 == 0 ? "EU" : "NA",
                                     100L + i % 900, i % 7 == 0 ? "CANCELLED" : "PAID"))
            .toList();

        // Grouping + downstream collectors - the workhorse pattern.
        Map<String, Long> revenueByRegion = orders.stream()
            .filter(o -> "PAID".equals(o.status()))
            .collect(Collectors.groupingBy(Order::region,
                     Collectors.summingLong(Order::amount)));
        System.out.println(revenueByRegion);

        Map<Boolean, List<String>> partitioned = orders.stream()
            .collect(Collectors.partitioningBy(o -> o.amount() > 500,
                     Collectors.mapping(Order::id, Collectors.toList())));

        Map<String, Optional<Order>> biggestPerRegion = orders.stream()
            .collect(Collectors.groupingBy(Order::region,
                     Collectors.maxBy(Comparator.comparingLong(Order::amount))));

        // Laziness + short circuit: ONE pass, stops at the first match.
        Optional<Order> first = orders.stream()
            .filter(o -> o.amount() > 990)
            .map(o -> { System.out.println("mapping " + o.id()); return o; })
            .findFirst();

        // Parallel: CPU-bound, huge N, splittable source -> a genuine win.
        long t0 = System.nanoTime();
        long primes = IntStream.rangeClosed(2, 3_000_000).parallel()
                               .filter(StreamsAndCollections::isPrime).count();
        System.out.printf("%d primes in %d ms%n", primes, (System.nanoTime()-t0)/1_000_000);

        // NEVER do this: blocking IO starves the shared common pool.
        // urls.parallelStream().map(this::httpGet).toList();
        // Do this instead - a dedicated, bounded executor:
        try (ExecutorService io = Executors.newFixedThreadPool(32)) {
            List<Callable<String>> calls = List.of(() -> "a", () -> "b");
            io.invokeAll(calls);
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

        System.out.println(partitioned.size() + biggestPerRegion.size() + first.isPresent());
    }

    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; (long) i * i <= n; i++) if (n % i == 0) return false;
        return true;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Streams are lazy fused pipelines; parallel only wins for big CPU-bound splittable work, and blocking IO on the common pool starves the JVM.",
      followUps: [
        "Why does findFirst hurt parallel performance?",
        "How would you run 500 HTTP calls concurrently in Java 21?",
      ],
    },
    {
      id: "b060",
      question: "What does Collections.synchronizedX give you, and why is it not enough?",
      answer:
        "`Collections.synchronizedList/Map/Set/Collection` wraps the target so **every method acquires one mutex** (the wrapper itself, or a supplied lock object). It gives you *method-level* atomicity and nothing more.\n\n" +
        "Why it is usually not enough:\n\n" +
        "1. **Compound operations are still races.** `if (!map.containsKey(k)) map.put(k, v)` is two atomic calls with a gap. Any check-then-act, read-modify-write or iterate-then-update needs an **external lock over the whole sequence**.\n" +
        "2. **Iteration is explicitly not thread-safe.** The Javadoc requires you to synchronise manually on the wrapper while iterating, otherwise you get `ConcurrentModificationException`.\n" +
        "3. **It serialises everything.** One global lock means zero read concurrency; throughput collapses as threads increase. `ConcurrentHashMap` allows unlimited concurrent reads and per-bin writes.\n" +
        "4. **Lock granularity is invisible to callers**, so it is easy to compose two synchronised collections into a deadlock.\n\n" +
        "What to use instead:\n\n" +
        "- `ConcurrentHashMap` with its atomic `merge`/`compute`/`putIfAbsent` — covers most needs.\n" +
        "- `CopyOnWriteArrayList` for read-mostly lists (listeners, configuration).\n" +
        "- `ConcurrentLinkedQueue` / `BlockingQueue` for hand-off.\n" +
        "- `ConcurrentSkipListMap` when you need a concurrent **sorted** map.\n" +
        "- An explicit `ReentrantReadWriteLock` or `StampedLock` when you genuinely need a multi-step invariant across a structure.\n\n" +
        "**Where synchronized wrappers are still fine:** a collection that is rarely accessed, mutated only under a lock you already hold, or being retrofitted into legacy code. Otherwise reach for `java.util.concurrent`.",
      code: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.*;

public class SynchronizedWrappers {
    public static void main(String[] args) throws Exception {
        Map<String, Integer> sync = Collections.synchronizedMap(new HashMap<>());

        // BROKEN: two atomic calls with a race window between them.
        if (!sync.containsKey("k")) sync.put("k", 1);

        // Fix A - external lock over the whole compound operation.
        synchronized (sync) {
            if (!sync.containsKey("k")) sync.put("k", 1);
        }

        // Fix B - the right tool.
        ConcurrentHashMap<String, Integer> chm = new ConcurrentHashMap<>();
        chm.putIfAbsent("k", 1);                      // single atomic operation

        // Iteration REQUIRES manual synchronisation on the wrapper.
        synchronized (sync) {
            for (var e : sync.entrySet()) { /* ... */ }
        }

        // Throughput comparison sketch: 8 threads hammering both.
        int threads = 8, ops = 100_000;
        System.out.println("sync ms " + hammer(sync, threads, ops));
        System.out.println("chm  ms " + hammer(chm,  threads, ops));

        // Multi-step invariant across a structure -> explicit lock.
        ReadWriteLock rw = new ReentrantReadWriteLock();
        List<String> audit = new ArrayList<>();
        rw.writeLock().lock();
        try { audit.add("a"); audit.add("b"); }       // both-or-neither
        finally { rw.writeLock().unlock(); }

        rw.readLock().lock();
        try { System.out.println(audit.size()); }
        finally { rw.readLock().unlock(); }
    }

    static long hammer(Map<String, Integer> map, int threads, int ops) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        long t0 = System.nanoTime();
        List<Future<?>> futures = new ArrayList<>();
        for (int t = 0; t < threads; t++) {
            futures.add(pool.submit(() -> {
                for (int i = 0; i < ops; i++) map.put("k" + (i % 512), i);
            }));
        }
        for (Future<?> f : futures) f.get();
        pool.shutdown();
        return (System.nanoTime() - t0) / 1_000_000;
    }
}`,
      codeLanguage: "java",
      explanation:
        "One global mutex gives per-method atomicity only — compound operations and iteration still need external locking, and throughput does not scale.",
      followUps: [
        "Give a check-then-act bug that a synchronized wrapper does not prevent.",
        "When is CopyOnWriteArrayList the right choice?",
      ],
    },
    {
      id: "b061",
      question: "How do you choose the right collection? Give me your decision process.",
      answer:
        "A structured answer beats a memorised table. Ask five questions in order.\n\n" +
        "1. Key-value or just values?\n\n" +
        "- Pairs → `Map`. Values only → `Collection`.\n\n" +
        "2. Do duplicates matter and does order matter?\n\n" +
        "- Duplicates allowed, index access → **`ArrayList`**.\n" +
        "- No duplicates, no order → **`HashSet`**.\n" +
        "- No duplicates, insertion order → **`LinkedHashSet`**.\n" +
        "- No duplicates, sorted / range queries → **`TreeSet`**.\n" +
        "- FIFO or LIFO processing → **`ArrayDeque`**.\n" +
        "- Ordered by priority → **`PriorityQueue`**.\n\n" +
        "3. What is the access pattern?\n\n" +
        "- Random index access → array-backed.\n" +
        "- Frequent add/remove at both ends → deque.\n" +
        "- Range or nearest-neighbour queries (`floor`, `ceiling`, `subMap`) → tree-based.\n" +
        "- Membership tests only → hash-based.\n\n" +
        "4. Is it concurrent?\n\n" +
        "- Read-mostly list → `CopyOnWriteArrayList`.\n" +
        "- General concurrent map → `ConcurrentHashMap`.\n" +
        "- Producer/consumer → a **bounded** `BlockingQueue`.\n" +
        "- Concurrent sorted → `ConcurrentSkipListMap`.\n" +
        "- Single-threaded but shared later → prefer an **immutable** collection.\n\n" +
        "5. Is there a specialised type?\n\n" +
        "- Enum keys → **`EnumMap`** / **`EnumSet`** (array/bit-vector, far faster).\n" +
        "- Primitives at scale → Eclipse Collections, fastutil or HPPC. `List<Integer>` boxes every element: ~16 bytes and a pointer chase each, versus 4 bytes in an `int[]`.\n" +
        "- Cache with eviction → Caffeine, not a hand-rolled map.\n\n" +
        "**Close with the trade-off sentence:** 'I default to `ArrayList`, `HashMap` and `ArrayDeque`, pre-size when the count is known, use immutable collections at API boundaries, and only reach for anything else when the access pattern or concurrency demands it.'",
      code: `import java.util.*;
import java.util.concurrent.*;

public class CollectionChoice {

    enum Status { NEW, PAID, SHIPPED, CANCELLED }

    public static void main(String[] args) {
        int expected = 10_000;

        // Default: pre-sized ArrayList / HashMap.
        List<String> ids   = new ArrayList<>(expected);
        Map<String, Long> totals = new HashMap<>(expected * 4 / 3 + 1);   // avoid resizes

        // Dedupe while preserving order.
        Set<String> uniqueInOrder = new LinkedHashSet<>(ids);

        // Range queries -> NavigableMap.
        NavigableMap<Long, String> tiers = new TreeMap<>();
        tiers.put(0L, "bronze"); tiers.put(1_000L, "silver"); tiers.put(10_000L, "gold");
        System.out.println(tiers.floorEntry(3_500L).getValue());          // silver

        // Enum keys -> EnumMap (array indexed by ordinal).
        EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);
        for (Status s : Status.values()) counts.put(s, 0);

        // Hot statuses -> EnumSet (a single long bitmask).
        EnumSet<Status> terminal = EnumSet.of(Status.SHIPPED, Status.CANCELLED);
        System.out.println(terminal.contains(Status.PAID));               // false

        // Concurrency
        Map<String, Integer> shared      = new ConcurrentHashMap<>();
        List<Runnable> listeners         = new CopyOnWriteArrayList<>();  // read-mostly
        BlockingQueue<String> pipeline   = new ArrayBlockingQueue<>(1_000); // bounded!
        NavigableMap<Long, String> sortedConcurrent = new ConcurrentSkipListMap<>();

        // API boundaries -> immutable.
        List<String> exported = List.copyOf(ids);

        // Primitives at scale: prefer int[] / IntStream over List<Integer>.
        int[] raw = new int[expected];
        long sum = java.util.stream.IntStream.of(raw).sum();

        System.out.println(uniqueInOrder.size() + totals.size() + counts.size()
                + shared.size() + listeners.size() + pipeline.size()
                + sortedConcurrent.size() + exported.size() + sum);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Answer with a decision process — pairs/order/access pattern/concurrency/specialisation — rather than reciting a complexity table.",
      followUps: [
        "Why is List<Integer> so much more expensive than int[]?",
        "When would you pre-size a HashMap and with what number?",
      ],
    },
    {
      id: "b062",
      question: "What is the difference between Iterator, ListIterator and Spliterator?",
      answer:
        "Iterator<E> — the base contract: `hasNext()`, `next()`, `remove()` (optional), `forEachRemaining()` (Java 8).\n\n" +
        "- Forward only, one pass.\n" +
        "- `remove()` is the **only** safe way to delete while iterating a fail-fast collection; it updates `expectedModCount`.\n" +
        "- Calling `remove()` before `next()`, or twice in a row, throws `IllegalStateException`.\n\n" +
        "ListIterator<E> — extends `Iterator`, available only on `List`.\n\n" +
        "- **Bidirectional**: `hasPrevious()`, `previous()`.\n" +
        "- **Positional**: `nextIndex()`, `previousIndex()`.\n" +
        "- **Mutating**: `set(e)` replaces the last returned element, `add(e)` inserts at the cursor.\n" +
        "- Obtained with `list.listIterator()` or `list.listIterator(index)`.\n" +
        "- Use it when you must **rewrite elements in place** while walking, which `Iterator` cannot do.\n\n" +
        "Spliterator<T> (Java 8) — the foundation of the Streams API.\n\n" +
        "- `tryAdvance(consumer)` processes one element; `forEachRemaining` bulk-processes; **`trySplit()`** returns a new `Spliterator` covering a prefix — this is what enables parallel decomposition.\n" +
        "- `estimateSize()` and `getExactSizeIfKnown()` let the fork-join framework decide whether to split further.\n" +
        "- **Characteristics** — `ORDERED`, `DISTINCT`, `SORTED`, `SIZED`, `NONNULL`, `IMMUTABLE`, `CONCURRENT`, `SUBSIZED` — let the pipeline optimise: a `SIZED` + `SUBSIZED` source (array, `ArrayList`) splits perfectly in half, while a `LinkedList` splits badly, which is exactly why parallel streams over linked structures disappoint.\n" +
        "- Primitive specialisations `OfInt`, `OfLong`, `OfDouble` avoid boxing.\n\n" +
        "**The line that lands:** 'Spliterator is Iterator plus the ability to split and describe itself, which is precisely what parallelism requires.'",
      code: `import java.util.*;
import java.util.stream.StreamSupport;

public class IteratorFamily {
    public static void main(String[] args) {
        // Iterator - forward only, safe removal.
        List<String> list = new ArrayList<>(List.of("a", "bb", "ccc", "dddd"));
        for (Iterator<String> it = list.iterator(); it.hasNext(); ) {
            if (it.next().length() == 2) it.remove();
        }
        System.out.println(list);                            // [a, ccc, dddd]

        // ListIterator - bidirectional, set() and add() in place.
        for (ListIterator<String> it = list.listIterator(); it.hasNext(); ) {
            int i = it.nextIndex();
            String s = it.next();
            it.set(i + ":" + s.toUpperCase());               // replace in place
            if (s.length() == 3) it.add("<inserted>");       // insert after the cursor
        }
        System.out.println(list);

        // Walk backwards.
        for (ListIterator<String> it = list.listIterator(list.size()); it.hasPrevious(); ) {
            System.out.print(it.previous() + " ");
        }
        System.out.println();

        // Spliterator - characteristics and splitting.
        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < 1000; i++) nums.add(i);
        Spliterator<Integer> s1 = nums.spliterator();
        System.out.println("size=" + s1.estimateSize()
            + " sized="    + s1.hasCharacteristics(Spliterator.SIZED)
            + " subsized=" + s1.hasCharacteristics(Spliterator.SUBSIZED)
            + " ordered="  + s1.hasCharacteristics(Spliterator.ORDERED));

        Spliterator<Integer> s2 = s1.trySplit();             // perfect halves for ArrayList
        System.out.println(s2.estimateSize() + " + " + s1.estimateSize());

        // LinkedList splits badly -> parallel streams over it rarely help.
        Spliterator<Integer> ll = new LinkedList<>(nums).spliterator();
        System.out.println("linked subsized="
            + ll.hasCharacteristics(Spliterator.SUBSIZED));  // false

        // Any Spliterator can become a Stream.
        System.out.println(StreamSupport.stream(nums.spliterator(), true)
                                        .mapToInt(Integer::intValue).sum());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Iterator walks, ListIterator also rewrites and reverses, Spliterator splits and self-describes — which is what makes parallel streams possible.",
      followUps: [
        "Why does a LinkedList spliterator split poorly?",
        "When would you write a custom Spliterator?",
      ],
    },
    {
      id: "b063",
      question: "How do generics and type erasure affect collections in practice?",
      answer:
        "Generics in Java are **compile-time only**. The compiler checks types, inserts casts, and then **erases** the type parameter — `List<String>` and `List<Integer>` are both `List` at runtime with `Object` element storage (or the bound, for `<T extends Number>`).\n\n" +
        "Consequences you must be able to name:\n\n" +
        "- `new T[]` is illegal; `(T[]) new Object[n]` with `@SuppressWarnings` is the standard workaround (it is what `ArrayList` does internally).\n" +
        "- `instanceof List<String>` is illegal; only `instanceof List<?>` compiles.\n" +
        "- You cannot overload on `List<String>` and `List<Integer>` — same erasure.\n" +
        "- Runtime type information is gone, hence `TypeReference`/`ParameterizedTypeReference` in Jackson and Spring.\n" +
        "- **Heap pollution**: an unchecked cast can put the wrong type into a collection, and the `ClassCastException` surfaces far away at the read site.\n\n" +
        "**Bridge methods:** the compiler generates synthetic methods so erased overriding still works — visible in stack traces and with reflection.\n\n" +
        "Variance and PECS:\n\n" +
        "- Generics are **invariant**: `List<String>` is *not* a `List<Object>` — which is what prevents the array-store problem (`Object[] a = new String[1]; a[0] = 1;` compiles and throws `ArrayStoreException`).\n" +
        "- **`? extends T`** — a **producer**: you can read `T`, cannot add (except `null`).\n" +
        "- **`? super T`** — a **consumer**: you can add `T`, reads come back as `Object`.\n" +
        "- **PECS — Producer Extends, Consumer Super.** `Collections.copy(List<? super T> dest, List<? extends T> src)` is the canonical example.\n\n" +
        "Safety tools: `List.of()` and friends are type-safe factories; `Collections.checkedList(list, String.class)` adds a runtime type check to catch heap pollution at the insertion point rather than the read point.",
      code: `import java.util.*;

public class GenericsAndCollections {

    // PECS: src produces T (extends), dest consumes T (super).
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (int i = 0; i < src.size(); i++) dest.set(i, src.get(i));
    }

    static double sum(Collection<? extends Number> numbers) {   // producer -> extends
        double total = 0;
        for (Number n : numbers) total += n.doubleValue();
        return total;
    }

    static void addIntegers(List<? super Integer> sink) {       // consumer -> super
        sink.add(1); sink.add(2);
        Object o = sink.get(0);                                 // reads are Object
    }

    @SuppressWarnings("unchecked")
    static <T> T[] newArray(int n) { return (T[]) new Object[n]; }  // erasure workaround

    public static void main(String[] args) {
        // Erasure: identical runtime class.
        System.out.println(new ArrayList<String>().getClass()
                        == new ArrayList<Integer>().getClass());     // true

        List<Number> numbers = new ArrayList<>(List.of(0, 0, 0));
        copy(numbers, List.of(1, 2, 3));
        System.out.println(numbers + " sum=" + sum(numbers));
        addIntegers(numbers);

        // Invariance prevents the array-store hole.
        Object[] arr = new String[1];
        try { arr[0] = 42; }
        catch (ArrayStoreException e) { System.out.println("ArrayStoreException at runtime"); }
        // List<Object> bad = new ArrayList<String>();          // will not compile

        // Heap pollution: raw type lets the wrong element in.
        List<String> strings = new ArrayList<>();
        List raw = strings;                                     // unchecked
        raw.add(42);
        try { String s = strings.get(0); }                      // CCE far from the cause
        catch (ClassCastException e) { System.out.println("heap pollution: " + e.getMessage()); }

        // checkedList fails at the INSERTION point instead.
        List<String> checked = Collections.checkedList(new ArrayList<>(), String.class);
        List rawChecked = checked;
        try { rawChecked.add(42); }
        catch (ClassCastException e) { System.out.println("caught at insertion"); }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Erasure means no runtime type info, no generic arrays and no overload on type arguments; PECS and invariance are the design consequences.",
      followUps: [
        "Why are generics invariant when arrays are covariant?",
        "What is a bridge method and when would you see one?",
      ],
    },
    {
      id: "b064",
      question: "What are the memory characteristics of Java collections and how do you reduce footprint?",
      answer:
        "Rough per-element costs on a 64-bit JVM with compressed oops:\n\n" +
        "- **`int[]`** — 4 bytes per element, contiguous. The baseline.\n" +
        "- **`ArrayList<Integer>`** — 4 bytes for the reference **plus** an `Integer` object (16 bytes) per element, so **~20 bytes**, five times the cost, with a pointer chase on every access. Values in −128..127 come from the `Integer` cache, so small numbers are cheaper.\n" +
        "- **`LinkedList<Integer>`** — a `Node` (16-byte header + 3 references) plus the `Integer`: **~40+ bytes**.\n" +
        "- **`HashMap`** — each `Node` is header + hash + key ref + value ref + next ref ≈ **32 bytes**, plus the bucket array slot, plus the key and value objects. A `HashMap<Integer,Integer>` with a million entries easily exceeds 80 MB.\n" +
        "- **`TreeMap`** — `Entry` has key, value, left, right, parent and colour ≈ **40 bytes**.\n" +
        "- **`String`** — since Java 9 compact strings store Latin-1 in a `byte[]`, halving ASCII text.\n\n" +
        "Reduction strategies, in the order you would try them:\n\n" +
        "1. **Pre-size** — `new HashMap<>(expected / 0.75f + 1)` and `new ArrayList<>(n)` avoid repeated arrays and reduce garbage.\n" +
        "2. **Use primitive arrays or a primitive collections library** (Eclipse Collections, fastutil, HPPC, Agrona) for large numeric data. A 10x reduction is typical.\n" +
        "3. **`EnumMap`/`EnumSet`** for enum keys — an array and a bitmask.\n" +
        "4. **Deduplicate strings** — `String.intern()` sparingly, or `-XX:+UseStringDeduplication` with G1.\n" +
        "5. **Do not hold what you can stream** — process records rather than materialising a million-element list.\n" +
        "6. **Trim** — `trimToSize()` after bulk removal; capacity never shrinks on its own.\n" +
        "7. **Immutable factories** — `List.of` has specialised compact implementations.\n\n" +
        "**Measure, do not guess:** JOL (`GraphLayout.parseInstance(x).totalSize()`), a heap dump in Eclipse MAT, or `jcmd GC.class_histogram`.",
      code: `import java.util.*;
import java.util.stream.IntStream;

public class CollectionMemory {
    public static void main(String[] args) {
        int n = 1_000_000;

        // 1. Primitive array: ~4 MB.
        int[] primitives = IntStream.range(0, n).toArray();

        // 2. Boxed list: ~20 MB + GC pressure. Pre-size to avoid grow-copy garbage.
        List<Integer> boxed = new ArrayList<>(n);
        for (int i = 0; i < n; i++) boxed.add(i);

        // 3. HashMap sizing: capacity must exceed n / loadFactor, then round to a power of 2.
        Map<Integer, Integer> sized = new HashMap<>((int) (n / 0.75f) + 1);

        // 4. Small-value caching: -128..127 are shared Integer instances.
        System.out.println((Integer.valueOf(127) == Integer.valueOf(127)));   // true
        System.out.println((Integer.valueOf(128) == Integer.valueOf(128)));   // false

        // 5. Enum keys: array-backed, no hashing, no boxing.
        EnumMap<Day, Integer> byDay = new EnumMap<>(Day.class);

        // 6. Reclaim capacity after bulk removal.
        ArrayList<Integer> shrinkable = new ArrayList<>(boxed);
        shrinkable.removeIf(i -> i % 100 != 0);
        shrinkable.trimToSize();

        // 7. Stream instead of materialising.
        long sum = IntStream.range(0, n).filter(i -> i % 3 == 0).asLongStream().sum();

        // 8. Measure, do not guess.
        Runtime rt = Runtime.getRuntime();
        System.gc();
        long used = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        System.out.println("heap used ~" + used + " MB, sum=" + sum
                + ", " + primitives.length + ", " + sized.size() + ", " + byDay.size());
        // Precise: org.openjdk.jol.info.GraphLayout.parseInstance(boxed).totalSize()
    }
    enum Day { MON, TUE, WED }
}`,
      codeLanguage: "java",
      explanation:
        "Boxing costs ~5x and destroys locality; pre-size, use primitive or enum-specialised structures, and measure with JOL or a heap dump.",
      followUps: [
        "What capacity should you pass to new HashMap<>() for 1M entries?",
        "When is String.intern() a good idea and when is it a trap?",
      ],
    },
    {
      id: "b065",
      question: "What are the most common collection bugs you have seen in production code?",
      answer:
        "A list of concrete, recognisable bugs — this is a favourite 'have you actually shipped software' question.\n\n" +
        "1. **`equals` without `hashCode`** — lookups mysteriously return null and sets contain duplicates.\n" +
        "2. **Mutating a key after insertion** — the entry is unreachable but still iterable.\n" +
        "3. **`ConcurrentModificationException`** from removing inside a for-each. Fix with `removeIf` or `Iterator.remove()`.\n" +
        "4. **`List.remove(int)` vs `List.remove(Object)`** — `list.remove(1)` on a `List<Integer>` removes **index 1**, not the value 1. Use `list.remove(Integer.valueOf(1))`.\n" +
        "5. **`Arrays.asList` is fixed size** — `add` throws `UnsupportedOperationException`. Wrap it: `new ArrayList<>(Arrays.asList(...))`.\n" +
        "6. **`Collections.unmodifiableList` is a view**, not a copy — the backing list can still change under you.\n" +
        "7. **Unbounded caches** — a `static Map` used as a cache with no eviction is a textbook memory leak.\n" +
        "8. **Unbounded queues** in a thread pool — backpressure becomes `OutOfMemoryError`.\n" +
        "9. **Integer caching** — `==` works up to 127 and silently fails at 128. Always use `equals` for boxed types.\n" +
        "10. **`TreeSet`/`TreeMap` with a comparator inconsistent with equals** — elements silently disappear.\n" +
        "11. **`HashMap` being written by multiple threads** — in Java 7 an infinite loop on resize; in Java 8 lost updates and corrupted trees. Use `ConcurrentHashMap`.\n" +
        "12. **`Optional` in a collection** — `List<Optional<T>>` is a smell; filter instead.\n" +
        "13. **Returning a live internal collection** from a getter — callers mutate your state. Return a copy or an unmodifiable view.\n" +
        "14. **`size()` on a stream-backed source** or on a `ConcurrentHashMap` treated as exact.\n\n" +
        "Pick two or three and describe how you found and fixed them — the specifics are what convince.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class CollectionBugs {
    public static void main(String[] args) {
        // 4. remove(int) vs remove(Object)
        List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
        nums.remove(1);                               // removes INDEX 1 -> [10, 30]
        System.out.println(nums);
        nums.remove(Integer.valueOf(10));             // removes the VALUE -> [30]
        System.out.println(nums);

        // 5. Arrays.asList is fixed size
        List<String> fixed = Arrays.asList("a", "b");
        try { fixed.add("c"); }
        catch (UnsupportedOperationException e) { System.out.println("fixed-size"); }
        List<String> growable = new ArrayList<>(Arrays.asList("a", "b"));
        growable.add("c");

        // 9. Integer cache boundary
        Integer a = 127, b = 127, c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d));      // true false
        System.out.println(c.equals(d));                    // true - always use equals

        // 13. Leaking internal state
        class Basket {
            private final List<String> items = new ArrayList<>();
            List<String> getItemsBad()  { return items; }                       // leak
            List<String> getItemsGood() { return List.copyOf(items); }          // safe
        }
        Basket basket = new Basket();
        basket.getItemsBad().add("smuggled");               // mutates private state!
        System.out.println(basket.getItemsGood());

        // 7. Unbounded static cache = memory leak. Bound it.
        Map<String, byte[]> leaky = new HashMap<>();                             // grows forever
        Map<String, byte[]> bounded = Collections.synchronizedMap(
            new LinkedHashMap<>(256, 0.75f, true) {
                @Override protected boolean removeEldestEntry(Map.Entry<String, byte[]> e) {
                    return size() > 1_000;
                }
            });

        // 11. HashMap under concurrency -> lost updates
        Map<String, Integer> unsafe = new HashMap<>();
        Map<String, Integer> safe   = new ConcurrentHashMap<>();
        safe.merge("k", 1, Integer::sum);

        System.out.println(leaky.size() + bounded.size() + unsafe.size() + safe.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name concrete bugs with their fix — remove(int) vs remove(Object), the Integer cache boundary, leaked internal collections, unbounded caches.",
      followUps: [
        "How did the Java 7 HashMap resize infinite loop actually happen?",
        "How do you safely expose a collection from a getter?",
      ],
    },
    {
      id: "b066",
      question: "What did Java 9 through 21 add that is relevant to collections?",
      answer:
        "Java 9:\n\n" +
        "- **Immutable factory methods** `List.of`, `Set.of`, `Map.of`, `Map.ofEntries`, `Map.entry` — compact, null-hostile, order-randomised for sets/maps.\n" +
        "- `Stream.ofNullable`, `takeWhile`, `dropWhile`, `iterate` with a predicate.\n" +
        "- `Collectors.flatMapping` and `filtering` as downstream collectors.\n\n" +
        "Java 10:\n\n" +
        "- **`List.copyOf` / `Set.copyOf` / `Map.copyOf`** — immutable snapshot copies.\n" +
        "- `Collectors.toUnmodifiableList/Set/Map`.\n" +
        "- `var` for local variables — noticeably improves readability of nested generic types.\n\n" +
        "Java 11: `Collection.toArray(IntFunction)` (`toArray(String[]::new)`), `String.lines()`, `Predicate.not`.\n\n" +
        "Java 12: `Collectors.teeing` — run two collectors over one stream and merge the results (min and max in a single pass).\n\n" +
        "Java 16: **`Stream.toList()`** — shorter than `collect(Collectors.toList())` and returns an **unmodifiable** list. Also `Stream.mapMulti` for one-to-many without allocating streams.\n\n" +
        "Java 17: `record`s are stable — perfect immutable map keys and DTOs with correct `equals`/`hashCode`. Sealed types enable exhaustive pattern matching over collection elements.\n\n" +
        "Java 21 — the big one:\n\n" +
        "- **Sequenced collections** (JEP 431): the new `SequencedCollection`, `SequencedSet` and `SequencedMap` interfaces add `getFirst`, `getLast`, `addFirst`, `addLast`, `removeFirst`, `removeLast` and **`reversed()`** to `List`, `Deque`, `LinkedHashSet`, `LinkedHashMap`, `SortedSet`, `SortedMap`. It finally removes the 'how do I get the last element of a LinkedHashSet' awkwardness.\n" +
        "- **Virtual threads** change concurrency design: thread-per-task becomes viable, so bounded pools plus queues matter less for IO-bound work.\n" +
        "- **Pattern matching for switch** and record patterns make element processing much cleaner.",
      code: `import java.util.*;
import java.util.stream.*;

public class ModernCollections {
    sealed interface Shape permits Circle, Square {}
    record Circle(double r) implements Shape {}
    record Square(double side) implements Shape {}

    public static void main(String[] args) {
        // Java 9 factories + Java 10 copyOf
        var base = List.of("a", "b", "c");
        var snapshot = List.copyOf(new ArrayList<>(base));

        // Java 11 toArray(IntFunction)
        String[] arr = base.toArray(String[]::new);

        // Java 12 teeing: min and max in ONE pass.
        var minMax = Stream.of(4, 8, 1, 9, 3).collect(
            Collectors.teeing(Collectors.minBy(Integer::compare),
                              Collectors.maxBy(Integer::compare),
                              (min, max) -> min.orElseThrow() + ".." + max.orElseThrow()));
        System.out.println(minMax);                        // 1..9

        // Java 16 Stream.toList() -> unmodifiable
        List<Integer> squares = IntStream.rangeClosed(1, 5).map(i -> i * i).boxed().toList();

        // Java 21 SEQUENCED COLLECTIONS
        SequencedCollection<String> seq = new ArrayList<>(base);
        System.out.println(seq.getFirst() + " " + seq.getLast());     // a c
        seq.addFirst("z");
        System.out.println(seq.reversed());                            // [c, b, a, z]

        SequencedSet<String> lhs = new LinkedHashSet<>(base);
        System.out.println(lhs.getLast());                             // c  (finally!)

        SequencedMap<String, Integer> lhm = new LinkedHashMap<>();
        lhm.put("a", 1); lhm.put("b", 2);
        System.out.println(lhm.firstEntry() + " " + lhm.lastEntry());
        System.out.println(lhm.reversed());                            // {b=2, a=1}
        lhm.putFirst("z", 0);

        // Java 21 record patterns over a collection
        List<Shape> shapes = List.of(new Circle(2), new Square(3));
        double area = shapes.stream().mapToDouble(s -> switch (s) {
            case Circle(double r)    -> Math.PI * r * r;
            case Square(double side) -> side * side;
        }).sum();
        System.out.printf("%s %s %.2f%n", Arrays.toString(arr), squares + "" + snapshot, area);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Sequenced collections in Java 21 finally give first/last/reversed uniformly; Stream.toList, copyOf and teeing are the other everyday additions.",
      followUps: [
        "Which existing types became SequencedCollection in Java 21?",
        "Why does Stream.toList() return an unmodifiable list?",
      ],
    },
  ],
  meta: {
    b047: { difficulty: "easy", priority: "very-high", tags: ["hierarchy", "map", "collection"], readMinutes: 4 },
    b048: { difficulty: "easy", priority: "very-high", tags: ["arraylist", "linkedlist", "complexity"], readMinutes: 4 },
    b049: { difficulty: "medium", priority: "very-high", tags: ["iterator", "modcount", "cme"], readMinutes: 4 },
    b050: { difficulty: "easy", priority: "high", tags: ["set", "treeset", "ordering"], readMinutes: 4 },
    b051: { difficulty: "medium", priority: "very-high", tags: ["equals", "hashcode", "contract"], readMinutes: 5 },
    b052: { difficulty: "medium", priority: "high", tags: ["comparable", "comparator", "sorting"], readMinutes: 4 },
    b053: { difficulty: "medium", priority: "very-high", tags: ["map", "lru", "enummap"], readMinutes: 5 },
    b054: { difficulty: "medium", priority: "high", tags: ["java8", "merge", "computeifabsent"], readMinutes: 4, versions: ["Java 8+"] },
    b055: { difficulty: "easy", priority: "high", tags: ["immutable", "unmodifiable", "list-of"], readMinutes: 4, versions: ["Java 9+"] },
    b056: { difficulty: "hard", priority: "very-high", tags: ["concurrenthashmap", "concurrency", "internals"], readMinutes: 5 },
    b057: { difficulty: "medium", priority: "high", tags: ["queue", "deque", "blockingqueue"], readMinutes: 5 },
    b058: { difficulty: "medium", priority: "high", tags: ["arraylist", "internals", "capacity"], readMinutes: 4 },
    b059: { difficulty: "medium", priority: "high", tags: ["streams", "parallel", "forkjoin"], readMinutes: 5 },
    b060: { difficulty: "medium", priority: "medium", tags: ["synchronized", "concurrency", "wrappers"], readMinutes: 4 },
    b061: { difficulty: "easy", priority: "very-high", tags: ["design", "selection", "tradeoffs"], readMinutes: 4 },
    b062: { difficulty: "medium", priority: "medium", tags: ["iterator", "spliterator", "listiterator"], readMinutes: 4 },
    b063: { difficulty: "hard", priority: "high", tags: ["generics", "erasure", "pecs"], readMinutes: 5 },
    b064: { difficulty: "hard", priority: "medium", tags: ["memory", "boxing", "footprint"], readMinutes: 5 },
    b065: { difficulty: "medium", priority: "very-high", tags: ["bugs", "production", "pitfalls"], readMinutes: 5 },
    b066: { difficulty: "easy", priority: "medium", tags: ["java21", "sequenced", "modern"], readMinutes: 4, versions: ["Java 9+", "Java 21"] },
  },
});
