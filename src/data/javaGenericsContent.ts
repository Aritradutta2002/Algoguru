import { ContentSection } from "./recursionContent";

export const javaGenericsContent: ContentSection[] = [
  {
    id: "gen-intro",
    title: "Why Generics?",
    difficulty: "Easy",
    theory: [
      "**Generics** allow you to write code that works with **any type** while maintaining **compile-time type safety**",
      "Before generics (Java < 5), collections stored **Object** — you had to cast manually, risking ClassCastException at runtime",
      "With generics, the compiler catches type errors **at compile time**, not runtime",
      "**Type Parameter** — a placeholder like `<T>`, `<E>`, `<K, V>` that gets replaced with an actual type",
      "Common conventions: **T** (Type), **E** (Element), **K** (Key), **V** (Value), **N** (Number), **S, U** (2nd, 3rd types)",
      "Generics are a **compile-time** feature — the type info is **erased** at runtime (type erasure)",
      "Benefits: type safety, code reusability, eliminates casting, enables generic algorithms"
    ],
    code: [
      {
        title: "Before vs After Generics",
        language: "java",
        content: `import java.util.*;

public class WhyGenerics {
    public static void main(String[] args) {
        // ❌ Without generics — unsafe
        List oldList = new ArrayList();
        oldList.add("Hello");
        oldList.add(42);  // no compile error!
        // String s = (String) oldList.get(1); // ClassCastException at RUNTIME!
        
        // ✅ With generics — type-safe
        List<String> safeList = new ArrayList<>();
        safeList.add("Hello");
        // safeList.add(42);  // COMPILE ERROR! Type mismatch
        String s = safeList.get(0); // no cast needed
        
        System.out.println(s);
    }
}`
      }
    ],
    tip: "Always use generics with collections. Raw types (List without <>) exist only for backward compatibility."
  },
  {
    id: "gen-classes",
    title: "Generic Classes & Interfaces",
    difficulty: "Medium",
    theory: [
      "A **generic class** declares one or more type parameters in angle brackets after the class name",
      "The type parameter can be used as field types, method parameters, and return types",
      "You can have **multiple type parameters**: `class Pair<K, V>`",
      "Generic interfaces work the same way — implementing class specifies the type",
      "You can create generic data structures like Box, Pair, Stack, etc. that work with any type",
      "A class can extend a generic class or implement a generic interface"
    ],
    code: [
      {
        title: "Generic Class — Box & Pair",
        language: "java",
        content: `// Generic class with one type parameter
class Box<T> {
    private T value;
    
    public Box(T value) { this.value = value; }
    public T getValue() { return value; }
    public void setValue(T value) { this.value = value; }
    
    @Override
    public String toString() { return "Box[" + value + "]"; }
}

// Generic class with two type parameters
class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) { this.key = key; this.value = value; }
    public K getKey() { return key; }
    public V getValue() { return value; }
    
    @Override
    public String toString() { return key + " = " + value; }
}

public class GenericClassDemo {
    public static void main(String[] args) {
        Box<String> strBox = new Box<>("Hello");
        Box<Integer> intBox = new Box<>(42);
        
        System.out.println(strBox.getValue()); // Hello
        System.out.println(intBox.getValue()); // 42
        
        Pair<String, Integer> age = new Pair<>("Alice", 25);
        System.out.println(age); // Alice = 25
    }
}`
      },
      {
        title: "Generic Interface — Implementation",
        language: "java",
        content: `// Generic interface
interface Repository<T> {
    void save(T item);
    T findById(int id);
    List<T> findAll();
}

// Concrete implementation
class UserRepository implements Repository<String> {
    private List<String> users = new ArrayList<>();
    
    @Override
    public void save(String user) { users.add(user); }
    
    @Override
    public String findById(int id) { return users.get(id); }
    
    @Override
    public List<String> findAll() { return new ArrayList<>(users); }
}

// Generic implementation
class InMemoryRepo<T> implements Repository<T> {
    private List<T> items = new ArrayList<>();
    
    @Override
    public void save(T item) { items.add(item); }
    
    @Override
    public T findById(int id) { return items.get(id); }
    
    @Override
    public List<T> findAll() { return new ArrayList<>(items); }
}`
      }
    ],
    note: "The diamond operator `<>` (Java 7+) lets the compiler infer the type: `Box<String> b = new Box<>(\"Hi\");`"
  },
  {
    id: "gen-methods",
    title: "Generic Methods",
    difficulty: "Medium",
    theory: [
      "A **generic method** declares its own type parameter(s) **before the return type**",
      "Generic methods can be in both generic and non-generic classes",
      "Syntax: `public <T> ReturnType methodName(T param)`",
      "The compiler **infers** the type from the arguments — you rarely need to specify it explicitly",
      "Static methods **cannot** use the class's type parameter — they must declare their own",
      "Generic methods are useful for utility/helper methods that work with any type"
    ],
    code: [
      {
        title: "Generic Methods — Declaration & Usage",
        language: "java",
        content: `import java.util.*;

public class GenericMethodDemo {
    // Generic method — type declared before return type
    public static <T> void printArray(T[] array) {
        for (T element : array) {
            System.out.print(element + " ");
        }
        System.out.println();
    }
    
    // Generic method returning a value
    public static <T> T getFirst(List<T> list) {
        if (list.isEmpty()) return null;
        return list.get(0);
    }
    
    // Multiple type parameters
    public static <K, V> Map<K, V> mapOf(K key, V value) {
        Map<K, V> map = new HashMap<>();
        map.put(key, value);
        return map;
    }
    
    // Generic swap
    public static <T> void swap(T[] arr, int i, int j) {
        T temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    
    public static void main(String[] args) {
        Integer[] nums = {1, 2, 3};
        String[] words = {"Hello", "World"};
        
        printArray(nums);   // 1 2 3
        printArray(words);  // Hello World
        
        String first = getFirst(Arrays.asList("A", "B", "C"));
        System.out.println(first); // A
        
        Map<String, Integer> m = mapOf("age", 25);
        System.out.println(m); // {age=25}
    }
}`
      }
    ],
    tip: "You can explicitly specify the type: `ClassName.<String>methodName(args)` — but the compiler usually infers it automatically."
  },
  {
    id: "gen-bounded",
    title: "Bounded Type Parameters",
    difficulty: "Medium",
    theory: [
      "**Bounded types** restrict what types can be used as type arguments",
      "**Upper bound:** `<T extends Number>` — T must be Number or its subclass",
      "**Multiple bounds:** `<T extends Comparable<T> & Serializable>` — T must satisfy all bounds",
      "With upper bounds, you can call methods of the bound type on T",
      "Only one class bound is allowed (must come first), but multiple interface bounds are OK",
      "Bounded types are essential for writing generic algorithms that need specific capabilities (like comparison)"
    ],
    code: [
      {
        title: "Bounded Type Parameters",
        language: "java",
        content: `import java.util.*;

public class BoundedDemo {
    // T must extend Number — can call Number methods
    public static <T extends Number> double sum(List<T> list) {
        double total = 0;
        for (T num : list) {
            total += num.doubleValue(); // Number method
        }
        return total;
    }
    
    // T must be Comparable — can compare
    public static <T extends Comparable<T>> T findMax(List<T> list) {
        T max = list.get(0);
        for (T item : list) {
            if (item.compareTo(max) > 0) max = item;
        }
        return max;
    }
    
    // Multiple bounds — class first, then interfaces
    public static <T extends Number & Comparable<T>> T findMaxNumber(List<T> list) {
        T max = list.get(0);
        for (T item : list) {
            if (item.compareTo(max) > 0) max = item;
        }
        return max;
    }
    
    public static void main(String[] args) {
        List<Integer> ints = Arrays.asList(1, 2, 3, 4, 5);
        List<Double> dbls = Arrays.asList(1.5, 2.7, 3.1);
        
        System.out.println("Sum ints: " + sum(ints));   // 15.0
        System.out.println("Sum dbls: " + sum(dbls));   // 7.3
        System.out.println("Max: " + findMax(ints));     // 5
        
        // sum(Arrays.asList("a", "b")); // COMPILE ERROR — String not Number
    }
}`
      }
    ],
    warning: "`<T extends X>` means T is a **subtype** of X — this applies to both classes AND interfaces (we use `extends` for both, not `implements`)."
  },
  {
    id: "gen-wildcards",
    title: "Wildcards (?, extends, super)",
    difficulty: "Hard",
    theory: [
      "**Wildcard `?`** represents an **unknown type** — used when you don't need to reference the type",
      "**`? extends T`** (upper bounded) — accepts T or any **subtype** of T. Can **read** as T, cannot **write**",
      "**`? super T`** (lower bounded) — accepts T or any **supertype** of T. Can **write** T, reading gives Object",
      "**PECS principle:** Producer Extends, Consumer Super",
      "If you **read** from a collection → use `? extends T` (producer of T)",
      "If you **write** to a collection → use `? super T` (consumer of T)",
      "If you both read and write → use exact type `T`, no wildcard",
      "Unbounded `<?>` is equivalent to `<? extends Object>` — read-only as Object"
    ],
    code: [
      {
        title: "Wildcards & PECS Principle",
        language: "java",
        content: `import java.util.*;

public class WildcardDemo {
    // Upper bounded — reads from list (producer)
    public static double sumAll(List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) { // can read as Number
            sum += n.doubleValue();
        }
        // list.add(42); // ❌ COMPILE ERROR — can't write
        return sum;
    }
    
    // Lower bounded — writes to list (consumer)
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);   // ✅ can write Integer
        list.add(2);
        // Integer n = list.get(0); // ❌ can only read as Object
    }
    
    // PECS in action — copy from producer to consumer
    public static <T> void copy(List<? extends T> src, List<? super T> dest) {
        for (T item : src) {
            dest.add(item);
        }
    }
    
    public static void main(String[] args) {
        List<Integer> ints = Arrays.asList(1, 2, 3);
        List<Double> dbls = Arrays.asList(1.5, 2.5);
        
        System.out.println(sumAll(ints)); // 6.0
        System.out.println(sumAll(dbls)); // 4.0
        
        List<Number> numbers = new ArrayList<>();
        addNumbers(numbers); // Integer is subtype of Number ✅
        System.out.println(numbers); // [1, 2]
        
        // Copy
        List<Object> dest = new ArrayList<>();
        copy(ints, dest);
        System.out.println(dest); // [1, 2, 3]
    }
}`
      }
    ],
    tip: "Remember **PECS**: if a method **reads** items from a parameter, use `extends`. If it **writes** items into a parameter, use `super`."
  },
  {
    id: "gen-erasure",
    title: "Type Erasure & Limitations",
    difficulty: "Hard",
    theory: [
      "**Type erasure** — the compiler removes all generic type info at compile time. At runtime, `List<String>` is just `List`",
      "This ensures **backward compatibility** with pre-generics Java code",
      "After erasure, type parameters are replaced with their **bound** (or Object if unbounded)",
      "The compiler inserts **casts** automatically where needed",
      "**Limitations due to erasure:**",
      "Cannot use `new T()` — the type is unknown at runtime",
      "Cannot use `instanceof` with generic types — `obj instanceof List<String>` is illegal",
      "Cannot create generic arrays — `new T[10]` is illegal",
      "Cannot overload methods that differ only in type parameters — they erase to the same signature",
      "**Workaround for `new T()`:** pass a `Class<T>` token or a `Supplier<T>` factory"
    ],
    code: [
      {
        title: "Type Erasure — What Happens at Runtime",
        language: "java",
        content: `import java.util.*;

public class TypeErasureDemo {
    public static void main(String[] args) {
        List<String> strings = new ArrayList<>();
        List<Integer> integers = new ArrayList<>();
        
        // At runtime, both are just ArrayList — type info erased
        System.out.println(strings.getClass() == integers.getClass()); // true!
        System.out.println(strings.getClass().getName()); // java.util.ArrayList
        
        // ❌ Cannot check generic type at runtime
        // if (strings instanceof List<String>) {} // COMPILE ERROR
        
        // ✅ Can check raw type
        if (strings instanceof List) {
            System.out.println("It's a List"); // works
        }
        
        // ❌ Cannot create generic array
        // T[] arr = new T[10]; // COMPILE ERROR
        
        // ✅ Workaround — use Array.newInstance or Object array
        String[] arr = createArray(String.class, 5);
        System.out.println(arr.length); // 5
    }
    
    @SuppressWarnings("unchecked")
    public static <T> T[] createArray(Class<T> clazz, int size) {
        return (T[]) java.lang.reflect.Array.newInstance(clazz, size);
    }
}`
      },
      {
        title: "Workarounds — Class Token & Supplier",
        language: "java",
        content: `import java.util.function.Supplier;

// ❌ Cannot do new T() — type erased
// Workaround 1: Class token
class Factory1<T> {
    private Class<T> type;
    
    Factory1(Class<T> type) { this.type = type; }
    
    T create() throws Exception {
        return type.getDeclaredConstructor().newInstance();
    }
}

// Workaround 2: Supplier (preferred, Java 8+)
class Factory2<T> {
    private Supplier<T> supplier;
    
    Factory2(Supplier<T> supplier) { this.supplier = supplier; }
    
    T create() { return supplier.get(); }
}

public class ErasureWorkaround {
    public static void main(String[] args) throws Exception {
        // Using Class token
        Factory1<StringBuilder> f1 = new Factory1<>(StringBuilder.class);
        StringBuilder sb = f1.create();
        
        // Using Supplier (cleaner)
        Factory2<StringBuilder> f2 = new Factory2<>(StringBuilder::new);
        StringBuilder sb2 = f2.create();
        
        System.out.println(sb.getClass().getName());  // java.lang.StringBuilder
        System.out.println(sb2.getClass().getName()); // java.lang.StringBuilder
    }
}`
      }
    ],
    warning: "Type erasure means **generic type info does not exist at runtime**. Design accordingly — don't rely on runtime type checks for generics."
  }
];
