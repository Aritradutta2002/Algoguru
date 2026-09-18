import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Collections - global questions 134-144.
 * Covers the introduction to the Collection hierarchy and a deep dive into
 * the List family, ArrayList mechanics, iteration, sorting and the legacy
 * Vector class.
 */
export const chunk14CollectionsA = defineChunk({
  topic: "collections",
  questions: [
    {
      id: "q134",
      question: "Why do we need collections in Java?",
      answer:
        "Collections replace fixed-size arrays and hand-rolled linked lists with resizable, generic, well-tested containers. Arrays give you O(1) random access but cannot grow without manual copying, and reinventing a linked list per project is error-prone and untested. The framework gives you both for free.\n\n" +
        "What collections give you over raw arrays or homemade code:\n\n" +
        "- **Resizing on demand**: `ArrayList`, `HashMap` and friends grow as elements are added, so capacity tracking is no longer the caller's problem.\n" +
        "- **Type safety through generics**: `List<String>` is checked at compile time, removing the casts and surprise `ClassCastException`s that pre-Java-5 raw `List` code produced.\n" +
        "- **One consistent API**: every container exposes `add`, `remove`, `iterator`, `size` and `contains`; you learn it once and apply it everywhere.\n" +
        "- **Algorithms in the box**: sorting, searching, shuffling, frequency counting, min/max are one-liners via `Collections` and stream collectors.\n" +
        "- **Fail-fast iteration**: structural modification mid-loop throws `ConcurrentModificationException`, surfacing bugs that arrays would silently corrupt.\n\n" +
        "Beyond the basics, the framework ships thread-safe variants (`ConcurrentHashMap`, `CopyOnWriteArrayList`), immutable factories (`List.of`, `Map.of`, `Set.copyOf`) and live views such as sublists and key sets, so you compose containers instead of reinventing them.",
      code: `import java.util.ArrayList;
import java.util.List;

public class CollectionsNeedDemo {
    public static void main(String[] args) {
        // Old way: fixed-size array, manual resize, no type safety
        String[] fixed = new String[2];
        fixed[0] = "alpha";
        fixed[1] = "beta";
        // fixed[2] = "gamma";   // ArrayIndexOutOfBoundsException

        // Modern way: resizable, generic, type-safe
        List<String> list = new ArrayList<>();
        list.add("alpha");
        list.add("beta");
        list.add("gamma");          // grows on demand
        list.add(null);             // nulls allowed
        list.add("alpha");          // duplicates allowed

        System.out.println("size  : " + list.size());         // 5
        System.out.println("first : " + list.get(0));         // alpha
        System.out.println("sorted: " + list.stream().sorted().toList());
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want resizable containers, generics, a unified API, free algorithms and fail-fast iteration - not 'arrays are hard'.",
    },
    {
      id: "q135",
      question: "What are the important interfaces in the collection hierarchy?",
      answer:
        "At the root sits `Iterable<T>`, the supertype of anything that exposes an `iterator()`, a `forEach(Consumer)` and a `spliterator()`. Extending it is `Collection<T>`, the common parent of the three sequence-like branches; below it, every concrete container falls under `List`, `Set` or `Queue`.\n\n" +
        "The three branches of `Collection<T>`:\n\n" +
        "- **`List<T>`**: ordered, allows duplicates, supports positional `get`/`set`/`add(int, E)` and bidirectional `listIterator()`.\n" +
        "- **`Set<T>`**: no duplicate elements; equality uses `equals` (and for sorted variants also `compareTo`).\n" +
        "- **`Queue<T>`**: holds elements for processing - typically FIFO, with `Deque` extending it for double-ended and `PriorityQueue` for priority ordering.\n\n" +
        "`Map<K,V>` is parallel to `Collection`, not a child. A map stores key-value pairs, cannot be iterated as a single sequence, and instead exposes `keySet()`, `values()` and `entrySet()` views that are themselves collections. Real systems layer further interfaces on top - `SortedSet` / `NavigableSet`, `BlockingQueue`, `ConcurrentMap` - and the same applies to maps. The takeaway: learn `Iterable` -> `Collection` -> `List` / `Set` / `Queue`, plus `Map` as a sibling, and every concrete class is just a specialisation of one of those.",
      code: `import java.util.*;

public class CollectionHierarchyDemo {
    public static void main(String[] args) {
        // Root: Iterable<T> -> Collection<T>
        Iterable<String> iterable = List.of("a", "b", "c");
        iterable.forEach(System.out::println);

        // Collection<T> branches into List, Set, Queue
        Collection<String> list  = new ArrayList<>(List.of("a", "b"));
        Collection<String> set   = new HashSet<>(List.of("a", "b"));
        Collection<String> queue = new ArrayDeque<>(List.of("a", "b"));

        // Map<K,V> is parallel to Collection, not a child
        Map<String, Integer> ages = Map.of("Ada", 36, "Ben", 42);
        ages.keySet().forEach(System.out::println);    // collection view

        // SortedSet / NavigableSet extend Set
        NavigableSet<Integer> ordered = new TreeSet<>(List.of(3, 1, 2));
        System.out.println("first : " + ordered.first());         // 1
        System.out.println("desc  : " + ordered.descendingSet());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Map Iterable -> Collection -> List / Set / Queue, with Map as a sibling and Sorted/Navigable/Blocking variants on top.",
    },
    {
      id: "q136",
      question: "What are the important methods that are declared in the collection interface?",
      answer:
        "`Collection<E>` declares roughly fifteen methods that every concrete implementation must honour, either by direct support or by throwing `UnsupportedOperationException` for fixed-size or read-only views. They fall into three groups.\n\n" +
        "Bulk mutation methods:\n\n" +
        "- **add(E)**: ensures the collection contains the element; returns true on a structural change.\n" +
        "- **remove(Object)**: removes a single occurrence matching by `equals`.\n" +
        "- **addAll / removeAll / retainAll / clear**: bulk forms used everywhere.\n\n" +
        "Query methods:\n\n" +
        "- **size()**, **isEmpty()**, **contains(Object)**, **containsAll(Collection)**.\n\n" +
        "Iteration and array conversion:\n\n" +
        "- **iterator()**: returns an `Iterator<E>`, normally fail-fast.\n" +
        "- **toArray()** and **toArray(T[] a)**: bridge between collection and array APIs; the typed overload lets you presize the destination.\n\n" +
        "Java 8 added default methods on top: **removeIf(Predicate)**, **stream()**, **parallelStream()** and **spliterator()**. Implementations that cannot mutate (immutable lists, `Collections.unmodifiableList` views) override mutators to throw `UnsupportedOperationException` - the standard escape hatch for read-only contracts.",
      code: `import java.util.*;

public class CollectionInterfaceDemo {
    public static void main(String[] args) {
        // Start with the most general interface
        Collection<String> c = new ArrayList<>();

        // Bulk mutation
        c.add("red");
        c.addAll(List.of("green", "blue"));
        c.remove("red");
        c.retainAll(List.of("green"));

        // Query
        System.out.println("size     : " + c.size());             // 1
        System.out.println("isEmpty  : " + c.isEmpty());          // false
        System.out.println("contains : " + c.contains("green"));  // true

        // Iteration (fail-fast)
        for (String s : c) System.out.println("iter: " + s);

        // Bridge to array
        String[] arr = c.toArray(new String[0]);
        System.out.println("array len: " + arr.length);

        // Java 8+ defaults
        c.removeIf(s -> s.startsWith("x"));
        c.forEach(System.out::println);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Three buckets: mutation, query, iteration/conversion - plus Java 8 defaults and UnsupportedOperationException for read-only views.",
    },
    {
      id: "q137",
      question: "Can you explain briefly about the List interface?",
      answer:
        "`List<E>` extends `Collection<E>` and models an **ordered sequence that allows duplicates**. Unlike a `Set`, it guarantees a stable iteration order (insertion order for `ArrayList`/`LinkedList`, or whatever order a sorted list imposes) and gives you positional access to elements by integer index.\n\n" +
        "Members beyond what `Collection` provides:\n\n" +
        "- **Positional get/set**: `get(int)`, `set(int, E)`, `add(int, E)` and `remove(int)` for index-based access.\n" +
        "- **Search**: `indexOf(Object)` and `lastIndexOf(Object)`, matching by `equals`.\n" +
        "- **Range view**: `subList(int, int)` returns a live view backed by the original list - mutations to the sublist are visible in the parent and vice versa.\n" +
        "- **Iterators**: `listIterator()` and `listIterator(int)` add bidirectional traversal - `hasPrevious`, `previous`, `set` and `add` - on top of the basic `Iterator`.\n\n" +
        "The three implementations you must know: `ArrayList` (array-backed, fast random access, slow middle insertions), `LinkedList` (doubly linked nodes, fast middle insertions, slow random access) and the legacy `Vector` (a synchronized `ArrayList` equivalent, essentially obsolete today). For most production code `ArrayList` is the default; reach for `LinkedList` only when you do heavy insertions at the head or known positions, and prefer `ArrayDeque` for queue/deque behaviour.",
      code: `import java.util.*;

public class ListInterfaceDemo {
    public static void main(String[] args) {
        List<String> tasks = new ArrayList<>();
        tasks.add("design");
        tasks.add("code");
        tasks.add("test");
        tasks.add(1, "review");    // positional add keeps duplicates and order

        // Positional access
        System.out.println("get(0)  : " + tasks.get(0));
        tasks.set(0, "plan");
        System.out.println("indexOf : " + tasks.indexOf("code"));

        // Live sublist view
        List<String> middle = tasks.subList(1, 3);
        middle.clear();             // mutating sublist mutates parent
        System.out.println("after  : " + tasks);   // [plan, test]

        // Bidirectional iteration
        ListIterator<String> it = tasks.listIterator(tasks.size());
        while (it.hasPrevious()) System.out.print(it.previous() + " ");
        System.out.println();
    }
}`,
      codeLanguage: "java",
      explanation:
        "Ordered, duplicates allowed, positional get/set, live subList view, listIterator - backed by ArrayList, LinkedList or legacy Vector.",
    },
    {
      id: "q138",
      question: "Explain about ArrayList with an example?",
      answer:
        "`ArrayList<E>` is the workhorse resizable-array implementation of `List<E>`. Internally it keeps an `Object[] elementData` plus a `size` field; the array grows automatically whenever `add` exceeds the current capacity, so callers never juggle capacity themselves.\n\n" +
        "Key properties to know in an interview:\n\n" +
        "- **Capacity growth**: the backing array starts empty (`DEFAULTCAPACITY_EMPTY_ELEMENTDATA`); on the first `add` it allocates a 10-element array, and from then on grows by roughly **50%** (`oldCapacity + (oldCapacity >> 1)`).\n" +
        "- **Random access is O(1)**; `get(i)` is a plain array index, no bounds-checked branch.\n" +
        "- **Middle insertions and removals are O(n)** because elements to the right are shifted via `System.arraycopy`.\n" +
        "- **nulls and duplicates are allowed**; the list is **not thread-safe**.\n" +
        "- **Fail-fast iterators** throw `ConcurrentModificationException` if the list is structurally modified mid-loop.\n" +
        "- **Bulk helpers**: `addAll`, `removeIf`, `replaceAll`, `sort` (all Java 8+ defaults), plus a stream view via `stream()`.\n\n" +
        "Use `ArrayList` whenever you have a mostly-append, mostly-read workload with occasional random access. Avoid it if you do heavy insertions or removals in the middle, or if you need concurrency - then look at `LinkedList`, `CopyOnWriteArrayList` or a plain array.",
      code: `import java.lang.reflect.Field;
import java.util.ArrayList;

public class ArrayListGrowthDemo {
    public static void main(String[] args) throws Exception {
        ArrayList<Integer> list = new ArrayList<>();
        System.out.println("start size   : " + backingSize(list)); // 0
        for (int i = 0; i < 25; i++) list.add(i);
        // Capacity grows ~50% on overflow (10 -> 15 -> 22 -> 33)
        System.out.println("after 25     : " + backingSize(list));
        System.out.println("size         : " + list.size());

        // O(1) random access
        System.out.println("get(10)      : " + list.get(10));

        // removeIf is a Java 8 default on Collection
        list.removeIf(n -> n % 2 == 0);
        System.out.println("after filter : " + list);
    }

    // Reflectively peek at the private elementData length
    @SuppressWarnings("unchecked")
    static int backingSize(ArrayList<?> list) throws Exception {
        Field f = ArrayList.class.getDeclaredField("elementData");
        f.setAccessible(true);
        Object[] data = (Object[]) f.get(list);
        return data.length;
    }
}`,
      codeLanguage: "java",
      explanation:
        "Know 50% growth, O(1) random access, O(n) middle shifts, nulls allowed, not thread-safe and fail-fast iterators.",
    },
    {
      id: "q139",
      question: "Can an ArrayList have duplicate elements?",
      answer:
        "**Yes - `ArrayList` allows duplicates.** A duplicate is any element `e2` such that `e1.equals(e2)` returns true, where `e1` is already in the list. The list does not deduplicate on the way in; it stores every `add` and lets you decide downstream.\n\n" +
        "Why this matters in practice:\n\n" +
        "- **Order is preserved**: duplicates appear at the position they were added, and `indexOf` returns the lowest index of any equal element, `lastIndexOf` the highest.\n" +
        "- **Equality rule**: two elements are equal if their `equals` method says so - which is why overriding `equals` (and `hashCode`) is the only way to control what 'duplicate' means for your domain objects.\n" +
        "- **null counts as a value**: you can store any number of `null` entries, because `null.equals(...)` is never called - the iterator and `indexOf` short-circuit on `null` first.\n\n" +
        "If you need uniqueness, use a `Set<E>` (typically `HashSet` for O(1) membership, or `LinkedHashSet` to preserve insertion order). If you need ordered and unique, build a `LinkedHashSet` and copy it back, sort, or just call `stream().distinct().toList()` on the original list.",
      code: `import java.util.*;

public class ArrayListDuplicatesDemo {
    public static void main(String[] args) {
        List<String> tags = new ArrayList<>();
        tags.add("java");
        tags.add("collections");
        tags.add("java");          // duplicate by String.equals
        tags.add(null);            // null is a valid element
        tags.add(null);            // and can appear multiple times

        System.out.println("size        : " + tags.size());              // 5
        System.out.println("indexOf     : " + tags.indexOf("java"));     // 0 (first)
        System.out.println("lastIndexOf : " + tags.lastIndexOf("java"));// 2
        System.out.println("contains    : " + tags.contains("java"));

        // Need unique? Deduplicate with a Set or a stream
        Set<String> unique = new LinkedHashSet<>(tags);
        System.out.println("unique      : " + unique);   // [java, collections, null]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Yes - duplicates by equals are stored, nulls are valid, and a Set or distinct() stream is the way to dedupe.",
    },
    {
      id: "q140",
      question: "How do you iterate around an ArrayList using iterator?",
      answer:
        "You iterate with the `Iterator<E>` returned by `iterator()`. The basic pattern is `hasNext` plus `next`; you should always advance with `next`, never with a positional `get`, so the loop works for any `Iterable` and stays fail-fast safe.\n\n" +
        "The canonical form:\n\n" +
        "- **Acquire the iterator** with `Iterator<T> it = list.iterator();`.\n" +
        "- **Walk** with `while (it.hasNext()) { T item = it.next(); ... }`.\n" +
        "- **Remove safely** with `it.remove()` if you need to delete the current element; calling `list.remove(i)` from inside the loop is a `ConcurrentModificationException` waiting to happen.\n\n" +
        "Variants worth knowing:\n\n" +
        "- **`ListIterator<E>`** is the bidirectional version: `previous`, `hasPrevious`, `set` and `add` let you walk and mutate in either direction.\n" +
        "- **`forEach(Consumer)`** and **`forEachRemaining(Consumer)`** take a lambda and remove the boilerplate.\n" +
        "- **`Spliterator`** is the parallel-friendly workhorse used internally by `stream()` and `parallelStream()`.\n" +
        "- **Enhanced for-loop** (`for (T t : list)`) compiles to `Iterator` use behind the scenes, so it has the same fail-fast behaviour.\n\n" +
        "If you mutate the list outside the iterator mid-loop, expect `ConcurrentModificationException` - the structural-modification counter (`modCount`) is checked on every `next()` call.",
      code: `import java.util.*;

public class ArrayListIteratorDemo {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(List.of(10, 20, 30, 40, 50));

        // 1. Classic Iterator with safe removal
        Iterator<Integer> it = numbers.iterator();
        while (it.hasNext()) {
            int n = it.next();
            if (n % 20 == 0) it.remove();   // safe - goes through iterator
        }
        System.out.println("after it.remove : " + numbers);   // [10, 30, 50]

        // 2. ListIterator: bidirectional
        ListIterator<Integer> bit = numbers.listIterator(numbers.size());
        while (bit.hasPrevious()) {
            System.out.print(bit.previous() + " ");
        }
        System.out.println();

        // 3. forEach lambda (Java 8+)
        numbers.forEach(n -> System.out.println("forEach : " + n));

        // 4. Spliterator via stream()
        numbers.stream().filter(n -> n > 10).forEach(System.out::println);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use Iterator.next/hasNext, it.remove for safe deletion, listIterator for bidirectional, stream for parallel work.",
    },
    {
      id: "q141",
      question: "How do you sort an ArrayList?",
      answer:
        "Sort an `ArrayList` in place with either `Collections.sort(list)` or, the modern equivalent, `list.sort(comparator)`. Both use **TimSort**, a stable, adaptive merge-insertion sort with O(n log n) worst-case and far better performance on partially-ordered data than classic mergesort.\n\n" +
        "How to invoke it:\n\n" +
        "- **Natural order**: `Collections.sort(list)` or `list.sort(Comparator.naturalOrder())` - elements must implement `Comparable` and be mutually comparable, otherwise a `ClassCastException` is thrown.\n" +
        "- **Custom order**: pass a `Comparator`, e.g. `list.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()))`.\n" +
        "- **In-place and stable**: equal elements keep their relative order; no extra array is allocated beyond TimSort's working buffer.\n" +
        "- **Null handling**: `Collections.sort(list)` with a `null` element throws `NullPointerException`; `Comparator.nullsFirst(...)` or `Comparator.nullsLast(...)` is the safe wrapper.\n\n" +
        "For arrays use `Arrays.sort(array)` (also TimSort for object arrays, dual-pivot quicksort for primitive arrays). To sort without mutating, use `list.stream().sorted(comparator).collect(Collectors.toList())`. Since Java 8, `list.sort(Comparator)` is preferred - it reads as instance behaviour and avoids the static-import.",
      code: `import java.util.*;

public class ArrayListSortDemo {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Charlie", "alice", "Bob"));

        // Natural order via Comparable<String>
        Collections.sort(names);
        System.out.println("natural : " + names);   // [Bob, Charlie, alice]
        // Note: default sort is case-sensitive

        // list.sort(Comparator) - modern equivalent
        names.sort(String.CASE_INSENSITIVE_ORDER);
        System.out.println("ci      : " + names);   // [alice, Bob, Charlie]

        // ClassCastException if elements aren't mutually Comparable
        List<Object> mixed = new ArrayList<>(List.of(1, "two"));
        try {
            mixed.sort(Comparator.naturalOrder());  // Integer vs String -> CCE
        } catch (ClassCastException e) {
            System.out.println("caught  : " + e.getMessage());
        }

        // Non-mutating sort via stream
        List<String> sorted = names.stream().sorted().toList();
        System.out.println("stream  : " + sorted);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Both Collections.sort and list.sort use TimSort: stable, O(n log n), throws CCE on non-comparable elements - use nullsFirst/Last.",
    },
    {
      id: "q142",
      question: "How do you sort elements in an ArrayList using comparable interface?",
      answer:
        "`Comparable<T>` defines a class's **natural ordering** via a single method, `int compareTo(T other)`. Implementing it lets a list sort itself with no external strategy, which is also how `TreeSet`, `TreeMap`, `PriorityQueue` and `Arrays.sort` choose an order when no comparator is supplied.\n\n" +
        "How the contract works:\n\n" +
        "- **Negative return**: this object is less than `other`.\n" +
        "- **Zero return**: equal for ordering; for sorted sets and maps this **must** be consistent with `equals`.\n" +
        "- **Positive return**: this object is greater than `other`.\n\n" +
        "Consistency with `equals` is mandatory for sorted sets and maps: `a.equals(b)` must imply `a.compareTo(b) == 0`. Violating this contract breaks `TreeSet.contains` (which uses `compareTo`, not `equals`) and you will get duplicate-looking elements that are not equal by `equals`. Always override `equals` and `hashCode` together with `compareTo` on the same fields.\n\n" +
        "In practice, implement `Comparable` for value-like types you control (`Person`, `BigDecimal`, `LocalDate`, `String`) and let the framework sort them with `Collections.sort(list)` or `list.sort(null)`. When you do not control the type or need multiple orderings, reach for `Comparator` instead - covered in the next question.",
      code: `import java.util.*;

public class Person implements Comparable<Person> {
    private final String name;
    private final int age;

    public Person(String name, int age) { this.name = name; this.age = age; }

    // Natural order: age ASC, ties broken by name ASC
    @Override
    public int compareTo(Person other) {
        int byAge = Integer.compare(this.age, other.age);
        return byAge != 0 ? byAge : this.name.compareTo(other.name);
    }

    // MUST be consistent with compareTo == 0 for sorted sets/maps
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Person p)) return false;
        return age == p.age && name.equals(p.name);
    }

    @Override
    public int hashCode() { return Objects.hash(name, age); }

    @Override
    public String toString() { return name + "(" + age + ")"; }

    public static void main(String[] args) {
        List<Person> team = new ArrayList<>(List.of(
            new Person("Ada", 36),
            new Person("Ben", 28),
            new Person("Cleo", 36)));
        Collections.sort(team);     // natural order
        System.out.println(team);   // [Ben(28), Ada(36), Cleo(36)]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Comparable.compareTo defines natural order; it must agree with equals, otherwise TreeSet/TreeMap containment silently breaks.",
    },
    {
      id: "q143",
      question: "How do you sort elements in an ArrayList using comparator interface?",
      answer:
        "`Comparator<T>` is an **external strategy** for ordering - a separate object you pass to `sort`, so you do not have to (or cannot) change the element's own class. It is the right tool when the type is not yours, when you need multiple orderings, or when you want to encode `null` handling, reverse order or chained criteria.\n\n" +
        "How to use it:\n\n" +
        "- **Pass to sort**: `list.sort(Comparator.comparing(Person::getLastName).thenComparing(Person::getAge))`.\n" +
        "- **Building blocks**: `Comparator.comparing(keyExtractor)`, `comparingInt`, `comparingDouble`, `reversed()`, `thenComparing`, `nullsFirst`, `nullsLast`.\n" +
        "- **Lambda form**: `(a, b) -> Integer.compare(a.getAge(), b.getAge())`, or a method reference where possible.\n\n" +
        "Rules to remember:\n\n" +
        "- **A `compare` returning zero must be consistent with `equals`** if the ordered stream ever feeds a `TreeSet`, `TreeMap` or `Collectors.toMap` - otherwise lookups silently miss.\n" +
        "- **Sort is stable**, so chaining `byX.thenComparing(byY)` preserves `byX` order for ties.\n" +
        "- **Throw no exceptions** other than `ClassCastException` for incompatible types; never throw for valid inputs.\n\n" +
        "Use `Comparable` for the one natural order of a value type you control; use `Comparator` for everything else - view orderings, dynamic sort keys, multi-criteria sorts and null-safe chains.",
      code: `import java.util.*;

public class ComparatorDemo {
    record Job(String title, int salary, String city) {}

    public static void main(String[] args) {
        List<Job> jobs = new ArrayList<>(List.of(
            new Job("Dev",    90000,  "Paris"),
            new Job("Dev",    90000,  "Berlin"),
            new Job("Senior", 120000, "Paris"),
            new Job("Intern", 30000,  "Paris")));

        // Comparator chain: salary DESC, then city ASC
        Comparator<Job> bySalaryDesc = Comparator.comparingInt(Job::salary).reversed();
        Comparator<Job> byCity       = Comparator.comparing(Job::city);
        jobs.sort(bySalaryDesc.thenComparing(byCity));

        jobs.forEach(j -> System.out.println(
            j.salary() + " " + j.city() + " " + j.title()));

        // Nulls handling: place nulls last
        jobs.add(null);
        jobs.sort(Comparator.nullsLast(bySalaryDesc));
        System.out.println("nullsLast : ok");
    }
}`,
      codeLanguage: "java",
      explanation:
        "Comparator is an external strategy - chain with thenComparing, handle nulls with nullsFirst/Last, keep zero consistent with equals.",
    },
    {
      id: "q144",
      question: "What is vector class? How is it different from an ArrayList?",
      answer:
        "`java.util.Vector` is a **legacy** dynamic-array class that dates from Java 1.0 - before the Collections Framework existed. Internally it is essentially an `ArrayList` with two extra traits: every public method is `synchronized`, and the capacity growth strategy is different from the modern 50% rule.\n\n" +
        "The key differences:\n\n" +
        "- **Thread safety**: every `add`, `get`, `set` and `size` call grabs the same intrinsic monitor, so `Vector` is safe for concurrent reads and writes of single elements, but offers **no compound-action guarantees** - `if (!v.contains(x)) v.add(x)` is still a race.\n" +
        "- **Capacity growth**: `Vector` doubles (`capacity * 2`) by default - settable via `capacityIncrement`; `ArrayList` grows by 50%. In bursty workloads doubling wastes more memory but avoids frequent reallocations.\n" +
        "- **Legacy iterators**: `Vector` exposes an `Enumeration` via `elements()` alongside a modern `Iterator`. The `Iterator` is fail-fast, just like `ArrayList`'s.\n" +
        "- **Footprint**: synchronisation adds a small per-call cost even in single-threaded code, and JIT can less aggressively optimise the methods.\n\n" +
        "Today, prefer `ArrayList` for new code. It is faster (no monitor enter/exit on every call), has the same random-access semantics, and pairs cleanly with `Collections.synchronizedList(arrayList)` if you genuinely need synchronisation, or with `CopyOnWriteArrayList` for read-mostly workloads. Reserve `Vector` for ancient codebases and APIs you cannot change.",
      code: `import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class VectorVsArrayList {
    public static void main(String[] args) {
        // Vector: every method is synchronized, capacity doubles on overflow
        Vector<String> v = new Vector<>();
        for (int i = 0; i < 20; i++) v.add("v" + i);
        System.out.println("Vector size     : " + v.size());
        System.out.println("Vector capacity : " + v.capacity()); // grew by doubling

        // ArrayList: not synchronized, grows ~50%
        ArrayList<String> a = new ArrayList<>();
        for (int i = 0; i < 20; i++) a.add("a" + i);
        System.out.println("ArrayList size  : " + a.size());

        // Modern equivalent when you DO need synchronization
        List<String> sync = Collections.synchronizedList(new ArrayList<>());
        sync.add("safe under explicit external lock");
        System.out.println("synchronizedList: " + sync);

        // Or CopyOnWriteArrayList for read-mostly workloads
        List<String> cow = new CopyOnWriteArrayList<>();
        cow.add("reads are lock-free");
        System.out.println("copy-on-write   : " + cow);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Vector is legacy: synchronized methods and doubling growth - prefer ArrayList, plus synchronizedList or CopyOnWriteArrayList if needed.",
    },
  ],
  meta: {
    q134: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["collections", "framework", "generics"],
      relatedQuestionIds: ["q135", "q138", "q145"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q135: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["collections", "hierarchy", "interfaces"],
      relatedQuestionIds: ["q134", "q136", "q137"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q136: {
      difficulty: "easy",
      priority: "high",
      tags: ["collections", "interface", "api"],
      relatedQuestionIds: ["q135", "q137", "q140"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+"],
    },
    q137: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["collections", "list", "interface"],
      relatedQuestionIds: ["q135", "q138", "q146"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q138: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "arraylist", "internals"],
      relatedQuestionIds: ["q137", "q139", "q144"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 8+"],
    },
    q139: {
      difficulty: "easy",
      priority: "medium",
      tags: ["collections", "arraylist", "duplicates"],
      relatedQuestionIds: ["q138", "q140"],
      estimatedReadMinutes: 2,
      javaVersions: ["Java 1+"],
    },
    q140: {
      difficulty: "medium",
      priority: "high",
      tags: ["collections", "iterator", "fail-fast"],
      relatedQuestionIds: ["q136", "q138", "q141"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+"],
    },
    q141: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["collections", "sorting", "timsort"],
      relatedQuestionIds: ["q142", "q143", "q140"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+"],
    },
    q142: {
      difficulty: "medium",
      priority: "high",
      tags: ["collections", "comparable", "natural-order"],
      relatedQuestionIds: ["q141", "q143"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q143: {
      difficulty: "medium",
      priority: "high",
      tags: ["collections", "comparator", "sorting"],
      relatedQuestionIds: ["q141", "q142"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+"],
    },
    q144: {
      difficulty: "easy",
      priority: "medium",
      tags: ["collections", "vector", "legacy"],
      relatedQuestionIds: ["q138", "q145"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
  },
});
