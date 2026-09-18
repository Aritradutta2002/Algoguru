import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Generics - global questions 178-184.
 * Type parameters, why we need them, declaration, restrictions, bounds, methods.
 */
export const chunk18Generics = defineChunk({
  topic: "generics",
  questions: [
    {
      id: "q178",
      question: "What are Generics?",
      answer:
        "Generics let you parameterise a class, interface or method by one or more **type parameters**. The compiler checks that the types are used consistently, so most bugs that previously showed up as `ClassCastException` at run time are now caught at compile time.\n\n**The classic example**: instead of writing `Object`-based `List` and casting every time you read, you write `List<String>` and the compiler guarantees every element is a `String`. There is no need to cast at the read site.\n\n**Mechanics:**\n\n- **Type erasure**: the compiler removes the type parameters at run time. `List<String>` and `List<Integer>` are both `List` in the bytecode; the type parameter is replaced by `Object` (or by the upper bound if one is given).\n- **No primitive type arguments**: you must use `Integer` rather than `int`, `Double` rather than `double`. Autoboxing handles the conversion.\n- **Reified at the source level**: the compiler knows the full generic type of every variable and can reject incompatible operations.\n\n**Why Java went this route**: backward compatibility with pre-generics code. The trade-off is that some operations that would be natural with reified generics (asking \"what is the element type of this List at run time?\") do not work — you cannot write `if (list instanceof List<String>)`.",
      code: `import java.util.ArrayList;
import java.util.List;

public class GenericsIntro {
    public static void main(String[] args) {
        // Type parameter T = String. The compiler enforces this.
        List<String> names = new ArrayList<>();
        names.add(\"Ada\");
        // names.add(42);   // compile error -- not a String
        String first = names.get(0);          // no cast needed

        // Pre-generics code would have looked like this:
        List raw = new ArrayList();
        raw.add(\"Grace\");
        Object o = raw.get(0);                // raw type, Object return
        String name = (String) o;             // unchecked cast required
        System.out.println(name);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Generics = type parameters checked at compile time, erased at run time; remove most ClassCastException risk and the cast noise.",
    },
    {
      id: "q179",
      question: "Why do we need Generics? Can you give an example of how Generics make a program more flexible?",
      answer:
        "Generics give you three things at once: stronger compile-time type safety, the elimination of casts, and the ability to write algorithms that work on many element types.\n\n**Before generics**, you wrote `Object` everywhere and cast at every use site:\n\n```\nList list = new ArrayList();\nlist.add(\"Ada\");\nString name = (String) list.get(0);  // unchecked, fragile\n```\n\nThe cast would succeed only at run time, and only if you remembered to do it. A bug far from the insertion site would surface at the cast, which is the wrong place to find it.\n\n**With generics**, the same code reads as:\n\n```\nList<String> list = new ArrayList<>();\nlist.add(\"Ada\");\nString name = list.get(0);  // checked at compile time\n```\n\n**Flexibility through parameterisation** is the second big win. A single `Box<T>` class works for `Box<Integer>`, `Box<String>`, `Box<Order>` and so on — without writing separate `IntBox`, `StringBox`, `OrderBox` classes. The `java.util.Collections` sort algorithm and the Stream API use the same generic machinery to operate on any element type.\n\n**Beyond collections**: generic methods (`<T> T first(List<T>)`), generic interfaces (`Comparable<T>`, `Comparator<T>`) and bounded generics (`<T extends Number>`) all share the same machinery.",
      code: `public class GenericsFlexibility {
    // One generic class, reusable across many element types.
    static class Box<T> {
        private final T value;
        Box(T value) { this.value = value; }
        T value()    { return value; }
    }

    public static void main(String[] args) {
        Box<Integer> age    = new Box<>(37);
        Box<String>  name   = new Box<>(\"Ada\");
        Box<double[]> point = new Box<>(new double[]{1.0, 2.0});

        System.out.println(age.value() + \" \" + name.value() + \" \" + point.value()[0]);
        // Same class, three different element types, fully type-checked.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Generics catch errors at compile time, eliminate casts, and let one class/method handle many element types safely.",
    },
    {
      id: "q180",
      question: "How do you declare a generic class?",
      answer:
        "You declare a generic class by placing one or more **type parameters** in angle brackets after the class name. Conventionally, type parameters use single capital letters — `T` for type, `E` for element, `K` for key, `V` for value, `R` for return type, `S/U/V` for second/third/fourth.\n\n**Simple example**: `class Box<T> { private T value; ... }` — the field is of type `T`, and every `Box` instance carries its own concrete element type. At construction, the compiler infers the type from context: `new Box<String>(\"x\")` or just `new Box<>(\"x\")` with the diamond operator.\n\n**Multiple parameters**: `class Pair<K, V> { K first; V second; }`. The diamond operator still works: `new Pair<>(1, \"Ada\")` infers `Pair<Integer, String>`.\n\n**Static members**: a generic class cannot reference its own type parameter from a `static` context. `static T factory()` is illegal because `T` is not bound to a concrete class at the static level — every instance shares the same static method.\n\n**Inheritance with type parameters**: a generic class can extend another generic class and pass along the parameter (`class StringBox extends Box<String>`), or it can specialise at extension time. A subclass can also introduce its own parameter (`class OrderedBox<T> extends Box<T>`).",
      code: `public class GenericClassDemo {
    static class Pair<K, V> {
        private final K key;
        private final V value;
        Pair(K key, V value) { this.key = key; this.value = value; }
        K key()    { return key; }
        V value()  { return value; }
        @Override public String toString() { return key + \"=\" + value; }
    }

    static class StringBox extends Pair<String, String> {
        StringBox(String k, String v) { super(k, v); }
    }

    public static void main(String[] args) {
        Pair<String, Integer> p = new Pair<>(\"Ada\", 37);
        System.out.println(p); // Ada=37

        // Diamond inference at the construction site
        var q = new Pair<>(\"Lovelace\", true);
        System.out.println(q); // Lovelace=true
    }
}`,
      codeLanguage: "java",
      explanation:
        "Declare type parameters in angle brackets after the class name, use the diamond operator for inference, and remember statics cannot reference the type parameter.",
    },
    {
      id: "q181",
      question: "What are the restrictions in using generic type that is declared in a class declaration?",
      answer:
        "Generics give a lot of power, but erasure imposes real limits on what you can do with the type parameter `T`. The rules are enforced by the compiler.\n\n**You cannot:**\n\n- **Instantiate `T` directly**: `new T()` is a compile error, because the compiler does not know if `T` has a public no-arg constructor. Workarounds: pass a `Supplier<T>` or use `T.class.newInstance()` (with a checked exception).\n- **Create arrays of `T`**: `new T[size]` is a compile error for the same reason. Use `Object[]` and cast, or use an `ArrayList<T>`.\n- **Use primitive type arguments**: `List<int>` is illegal; use `List<Integer>` and rely on autoboxing.\n- **Declare `static` fields of type `T`**: static members are shared across all parameterisations, so the type parameter is not bound.\n- **Throw or catch `T`**: exceptions cannot be generic (since Java 7), and `catch (T e)` is forbidden because erasure removes the type information.\n- **Use `T` in instance-of checks against a parameterised type**: `obj instanceof List<String>` is illegal at compile time.\n\n**You can:**\n\n- Use `T` as a field type, parameter type, return type, or local variable type.\n- Reference static methods on `T` (such as `T.someStatic()`).\n- Reference `Class<T>` for reflection: `MyClass.class.cast(obj)` is well-defined.\n\n**Practical advice**: keep generic classes simple. If you find yourself wanting `new T()`, you almost certainly want to inject a `Supplier<T>`.",
      code: `import java.util.function.Supplier;

public class GenericRestrictions<T> {
    private final T value;

    GenericRestrictions(Supplier<T> factory) {
        this.value = factory.get();    // allowed: factory creates T
    }

    T value()                          { return value; }

    // static T factory() { ... }       // illegal: static cannot reference T

    // void bad() { Object[] arr = new T[10]; }  // illegal: cannot create array of T

    public static void main(String[] args) {
        var n = new GenericRestrictions<>(() -> 42);   // T = Integer
        var s = new GenericRestrictions<>(() -> \"hi\"); // T = String
        System.out.println(n.value() + \" \" + s.value());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Erasure forbids `new T()`, array creation, primitives, static fields, generic exceptions and `instanceof` against parameterised types.",
    },
    {
      id: "q182",
      question: "How can we restrict Generics to a subclass of particular class?",
      answer:
        "Use an **upper bound** with `extends`. `class NumericBox<T extends Number>` means `T` is some unknown subtype of `Number` — Integer, Double, BigDecimal, anything in that hierarchy. The compiler then lets you call any `Number` method (e.g. `doubleValue()`) on a `T` value inside the class.\n\n**Multiple bounds**: `class C<T extends Number & Comparable<T>>` declares that `T` must extend `Number` and implement `Comparable<T>`. The first bound is the erasure target; subsequent bounds must be interfaces.\n\n**Why upper bounds are useful**:\n\n- **Express the contract**: \"I work on any Number\".\n- **Get access to methods of the bound type**: `T.doubleValue()` is callable inside the class because `Number` declares it.\n- **Rejection at compile time**: `NumericBox<String>` is a compile error.\n\n**Method-level bounds**: `<T extends Comparable<T>> T max(T a, T b)` is the classic signature for a generic max function. The bound is required for `a.compareTo(b)` to compile.\n\n**Wildcard bounds**: `List<? extends Number>` accepts `List<Integer>`, `List<Double>` etc. The wildcard is **read-only** for the bound type — you can read `Number` values but cannot add, because the compiler does not know the concrete element type.",
      code: `public class UpperBound<T extends Number> {
    private final T value;
    UpperBound(T value) { this.value = value; }
    double asDouble()  { return value.doubleValue(); }

    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static void main(String[] args) {
        UpperBound<Integer> i = new UpperBound<>(42);
        UpperBound<Double>  d = new UpperBound<>(3.14);
        System.out.println(i.asDouble() + \" \" + d.asDouble());

        System.out.println(max(\"apple\", \"banana\")); // banana
        // UpperBound<String> s = new UpperBound<>(\"x\"); // compile error
    }
}`,
      codeLanguage: "java",
      explanation:
        "Use <T extends X> to bound T to a subtype of X; multiple bounds allowed; wildcards `? extends X` are read-only for the bound type.",
    },
    {
      id: "q183",
      question: "How can we restrict Generics to a super class of particular class?",
      answer:
        "Use a **lower bound** with `super`. Lower bounds only appear on wildcards in method signatures — `? super Integer` means \"some unknown supertype of Integer\" (Number, Object, Comparable, etc.).\n\n**PECS rule** (Producer Extends, Consumer Super):\n\n- Use `? extends T` when the structure **produces** `T` values you read — for example iterating a `List<? extends Number>` and reading its doubles.\n- Use `? super T` when the structure **consumes** `T` values you write — for example a `Consumer<? super Integer>` that can be passed a `Consumer<Number>`.\n\n**Why lower bounds exist**: erasure makes it impossible to read `Integer` from a `List<? super Integer>` because the compiler does not know the exact element type. But you can safely `add` an `Integer` to it: every concrete parameterisation of the list is at least an `Integer`-consumer.\n\n**Lower bounds on type parameters**: you cannot put a lower bound on a class's own type parameter (`class Box<T super Integer>` is illegal). The bound syntax only allows `extends` on declarations. Lower bounds appear on wildcard parameterisations only.\n\n**Practical use**: `Collections.copy(List<? super T> dest, List<? extends T> src)` is the canonical example — read from the source with an upper bound, write to the destination with a lower bound.",
      code: `import java.util.*;

public class LowerBound {
    // Copy from a producer to a consumer.
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T item : src) dest.add(item);
    }

    public static void main(String[] args) {
        List<Integer> src = List.of(1, 2, 3);
        List<Number>  dst = new ArrayList<>();
        copy(dst, src);                               // dst: List<? super Integer>
        System.out.println(dst);                       // [1, 2, 3]

        List<Object> everything = new ArrayList<>();
        copy(everything, src);                        // Object is a super of Integer
        System.out.println(everything);                // [1, 2, 3]

        // Lower bounds are read-only for the bound; you can add but cannot read.
        // Integer x = dst.get(0);                    // compile error
        Number y = dst.get(0);                        // OK -- upper bound
        System.out.println(y);                         // 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lower bounds use `? super T`, only on wildcards; use PECS — extends for producers, super for consumers.",
    },
    {
      id: "q184",
      question: "Can you give an example of a generic method?",
      answer:
        "A generic method declares its own type parameters before the return type. The compiler infers the type argument from the call site, which is why most callers do not write the type parameter explicitly.\n\n**When you need one**: when the method's logic depends on a type that is not declared on the class. A static utility method is the most common case — a `static <T> T first(List<T> list)` cannot rely on the enclosing class's type parameter.\n\n**Bounded generic methods**: `<T extends Comparable<T>> T max(T a, T b)` constrains the input type. The compiler then accepts only types that satisfy the bound.\n\n**Type witness**: if inference fails, you can give the type explicitly with `Type.method(args)` syntax — `Collections.<String>emptyList()`. This is rare but worth knowing when the compiler cannot decide.\n\n**Method references as a generic method**: `Stream.<String>of(\"a\", \"b\")` or `IntFunction.identity()` illustrate how generic methods interact with the rest of the language.\n\n**Why generic methods matter**: they let you write type-safe algorithms that work on any element type without inheriting from a generic class. `Arrays.asList`, `Collections.sort`, `Stream.of` and most static utilities are generic methods.",
      code: `import java.util.*;

public class GenericMethod {
    // A generic method: works on any element type with equals/hashCode.
    static <T> T last(List<T> list) {
        if (list.isEmpty()) throw new IllegalArgumentException(\"empty\");
        return list.get(list.size() - 1);
    }

    // Bounded generic method.
    static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static void main(String[] args) {
        List<String> words = List.of(\"apple\", \"banana\", \"cherry\");
        List<Integer> nums  = List.of(1, 2, 3);

        System.out.println(last(words));    // cherry
        System.out.println(last(nums));     // 3

        System.out.println(max(\"Ada\", \"Grace\"));  // Grace
        System.out.println(max(3, 5));               // 5
    }
}`,
      codeLanguage: "java",
      explanation:
        "Generic methods declare their own type parameters before the return type; bounded generic methods constrain what callers may pass.",
    },
  ],
  meta: {
    q178: { difficulty: "easy", priority: "very-high", tags: ["generics", "erasure"], relatedQuestionIds: ["q179", "q181"], estimatedReadMinutes: 3 },
    q179: { difficulty: "easy", priority: "very-high", tags: ["generics", "flexibility"], relatedQuestionIds: ["q178", "q180"], estimatedReadMinutes: 3 },
    q180: { difficulty: "medium", priority: "very-high", tags: ["generics", "declaration"], relatedQuestionIds: ["q179", "q181"], estimatedReadMinutes: 3 },
    q181: { difficulty: "medium", priority: "high", tags: ["generics", "restrictions"], relatedQuestionIds: ["q180", "q182"], estimatedReadMinutes: 3 },
    q182: { difficulty: "medium", priority: "very-high", tags: ["generics", "upper-bound"], relatedQuestionIds: ["q183", "q181"], estimatedReadMinutes: 3 },
    q183: { difficulty: "medium", priority: "high", tags: ["generics", "lower-bound"], relatedQuestionIds: ["q182", "q184"], estimatedReadMinutes: 3 },
    q184: { difficulty: "easy", priority: "high", tags: ["generics", "methods"], relatedQuestionIds: ["q180", "q183"], estimatedReadMinutes: 2 },
  },
});