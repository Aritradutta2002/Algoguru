import { ContentSection } from "./recursionContent";
import { javaCollectionsContent } from "./javaCollectionsContent";
import { javaGenericsContent } from "./javaGenericsContent";
import { javaStreamsContent } from "./javaStreamsContent";
import { javaMultithreadingContent } from "./javaMultithreadingContent";
import { javaIOContent } from "./javaIOContent";
import { javaAdvancedContent } from "./javaAdvancedContent";
import { javaJDBCContent } from "./javaJDBCContent";
import { javaSQLContent } from "./javaSQLContent";

// Java Fundamentals content
export const javaBasicsContent: ContentSection[] = [
  {
    id: "java-intro",
    title: "Introduction to Java",
    difficulty: "Easy",
    theory: [
      "Java is a **high-level, class-based, object-oriented** programming language designed to have as few implementation dependencies as possible. It was developed by **James Gosling** at Sun Microsystems (now owned by Oracle) and released in **1995**. Java follows the principle of **WORA** — Write Once, Run Anywhere.",
      "Java is one of the most popular programming languages in the world, used for building enterprise applications, Android apps, web servers, big data processing, and much more.",
      "**Key Features of Java:** Platform Independent (bytecode runs on any JVM), Object-Oriented (everything is an object), Strongly Typed (variables must be declared with types), Automatic Memory Management (Garbage Collector), Multithreaded (built-in concurrency support), Secure (no pointers, security manager), Rich Standard Library.",
      "**How Java Achieves Platform Independence:** When you write Java code, the compiler (`javac`) converts it to **bytecode** — an intermediate, platform-neutral representation stored in `.class` files. The JVM (Java Virtual Machine) then interprets or JIT-compiles this bytecode into native machine code specific to the host OS. This is why Java programs can run on Windows, macOS, Linux, etc., without recompilation — you only need a JVM for that platform.",
      "**Java's Memory Model:** Java divides memory into **Stack** (stores local variables, method calls — fast, thread-specific, LIFO) and **Heap** (stores objects and arrays — shared across threads, managed by the Garbage Collector). Understanding this distinction is crucial for writing efficient programs and debugging `StackOverflowError` vs `OutOfMemoryError`.",
      "**Garbage Collection (GC):** Unlike C/C++, Java automatically manages memory. The GC periodically identifies objects on the heap that are no longer referenced and reclaims their memory. You cannot explicitly free memory — instead, set references to `null` and let the GC handle it. Major GC algorithms include Serial GC, Parallel GC, G1 GC (default since Java 9), and ZGC (low-latency).",
      "**Java Editions:** Java SE (Standard Edition) — Core language, collections, I/O, concurrency. Java EE (Enterprise Edition) — Now Jakarta EE, Servlets, JPA, EJB. Java ME (Micro Edition) — For embedded/mobile devices.",
      "**Java Version History Highlights:** Java 5 (Generics, Enums, Autoboxing), Java 8 (Lambdas, Streams, Optional), Java 9 (Modules), Java 10 (var keyword), Java 11 (LTS, new String methods), Java 14 (Switch expressions, Records preview), Java 17 (LTS, Sealed classes), Java 21 (LTS, Virtual threads, Pattern matching)."
    ],
    note: "Java code is compiled into **bytecode** that runs on the **JVM (Java Virtual Machine)**, making it platform-independent."
  },
  {
    id: "java-setup",
    title: "JDK Setup & First Program",
    difficulty: "Easy",
    theory: [
      "To start coding in Java, you need the **JDK (Java Development Kit)** which includes the compiler (`javac`), the runtime (`java`), and standard libraries.",
      "**JDK vs JRE vs JVM:** JVM — Executes bytecode (platform-specific). JRE — JVM + core libraries (runs Java programs). JDK — JRE + development tools like compiler and debugger (develops & runs Java programs).",
      "**Anatomy of a Java Program:** `public class HelloWorld` — Class declaration. `public static void main(String[] args)` — Program entry point. `System.out.println(...)` — Prints to console. Every statement ends with `;`. Code blocks use `{}`.",
      "The file name **must match** the public class name. The compilation flow is: Source (.java) → javac → Bytecode (.class) → JVM → Machine Code."
    ],
    diagram: {
      type: "layers",
      title: "JDK / JRE / JVM Architecture",
      data: [
        {
          label: "JDK (Java Development Kit)",
          color: "primary",
          children: [
            {
              label: "Development Tools — javac, javadoc, jar, jdb",
              color: "info"
            },
            {
              label: "JRE (Java Runtime Environment)",
              color: "accent",
              children: [
                {
                  label: "Core Libraries — java.lang, java.util, java.io, java.net",
                  color: "success"
                },
                {
                  label: "JVM (Java Virtual Machine)",
                  color: "warning",
                  children: [
                    { label: "Class Loader → Bytecode Verifier → Execution Engine (Interpreter + JIT)", color: "heap" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    code: [
      {
        title: "Hello World — Your First Java Program",
        language: "java",
        content: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}

// Compile: javac HelloWorld.java
// Run:     java HelloWorld
// Output:  Hello, World!`
      },
      {
        title: "Compilation & Execution Flow",
        language: "java",
        content: `// Source Code (.java)
//     ↓ javac (compiler)
// Bytecode (.class)
//     ↓ java (JVM)
// Machine Code (execution)

// The JVM interprets bytecode OR uses JIT (Just-In-Time)
// compilation to convert hot bytecode to native machine code.`
      }
    ],
    note: "The file name **must match** the public class name. `HelloWorld.java` contains `public class HelloWorld`."
  },
  {
    id: "java-variables",
    title: "Variables & Data Types",
    difficulty: "Easy",
    theory: [
      "Java is a **statically typed** language — every variable must be declared with a type before use. This means the compiler catches type mismatches at compile time rather than at runtime, making Java programs safer and more predictable.",
      "**Primitive Types (8 total):** These are the building blocks of data in Java. They are stored directly on the **stack** (when local) and are NOT objects — they don't have methods or inherit from Object.",
      "**Integer types:** `byte` (8-bit, -128 to 127, useful for raw binary data), `short` (16-bit, rarely used), `int` (32-bit, most common — range ±2.1 billion), `long` (64-bit, suffix `L`, for large numbers like timestamps or CP problems where values exceed 2×10⁹).",
      "**Floating-point:** `float` (32-bit, ~7 decimal digits precision, suffix `f`), `double` (64-bit, ~15 decimal digits, default for decimal literals). **Important:** Floating-point arithmetic is **not exact** due to IEEE 754 representation — `0.1 + 0.2 ≠ 0.3` exactly. Use `BigDecimal` for financial calculations.",
      "**char** (16-bit Unicode character, range 0-65535, supports international characters). **boolean** (true/false, not convertible to int unlike C/C++).",
      "**Reference types** include String, arrays, and all objects. They are stored on the **heap** and variables hold a reference (pointer) to the object, not the object itself. This means assigning one reference variable to another makes both point to the **same object**.",
      "**Wrapper classes** (Integer, Double, Boolean, etc.) provide object versions of primitives. **Autoboxing** automatically converts `int → Integer` and **unboxing** does the reverse. Wrappers are needed for generics (`List<Integer>` works, `List<int>` doesn't) and provide utility methods like `Integer.parseInt()`, `Integer.MAX_VALUE`.",
      "**Type Inference with `var` (Java 10+):** The `var` keyword lets the compiler infer the type from the right-hand side. It reduces boilerplate but only works for local variables with initializers — not for fields, parameters, or return types.",
      "**Variable scopes:** Instance variables (belong to object, have default values: 0/false/null), Static variables (belong to class, shared across all instances), Local variables (must be initialized before use, no default values), Constants (`final` keyword — immutable once assigned).",
      "**Default Values:** Primitives get defaults only as instance/static fields: `int→0`, `double→0.0`, `boolean→false`, `char→'\\u0000'`. Reference types default to `null`. Local variables have **no defaults** — using them uninitialized causes a compile error."
    ],
    code: [
      {
        title: "Primitive Data Types",
        language: "java",
        content: `public class DataTypes {
    public static void main(String[] args) {
        // Integer types
        byte   b = 127;            // 8-bit,  -128 to 127
        short  s = 32767;          // 16-bit, -32,768 to 32,767
        int    i = 2_147_483_647;  // 32-bit (most common)
        long   l = 9_223_372_036_854_775_807L; // 64-bit (note L suffix)

        // Floating-point types
        float  f = 3.14f;          // 32-bit (note f suffix)
        double d = 3.141592653589; // 64-bit (default for decimals)

        // Character type
        char   c = 'A';            // 16-bit Unicode character

        // Boolean type
        boolean flag = true;       // true or false

        System.out.println("int max: " + Integer.MAX_VALUE);
        System.out.println("long max: " + Long.MAX_VALUE);
    }
}`
      },
      {
        title: "Reference Types, Wrappers & var",
        language: "java",
        content: `public class ReferenceTypes {
    // Instance variable
    int instanceVar = 10;
    // Static variable
    static int staticVar = 20;
    // Constant
    static final double PI = 3.14159265358979;

    public static void main(String[] args) {
        // String (immutable reference type)
        String name = "AlgoGuru";

        // Wrapper classes (autoboxing/unboxing)
        Integer num = 42;          // int → Integer (autoboxing)
        int val = num;             // Integer → int (unboxing)

        // Useful conversions
        int parsed = Integer.parseInt("123");
        String str = String.valueOf(456);

        // null — only for reference types
        String s = null;   // Valid
        // int x = null;   // ❌ Compile error

        // var keyword (Java 10+)
        var list = new java.util.ArrayList<String>();
        var count = 100;   // inferred as int
    }
}`
      }
    ],
    tip: "Use `int` for most integers, `long` for large numbers (like in CP), `double` for decimals, and `boolean` for flags."
  },
  {
    id: "java-operators",
    title: "Operators & Expressions",
    difficulty: "Easy",
    theory: [
      "Java provides a rich set of operators for arithmetic, comparison, logical, bitwise, and assignment operations. Understanding operator behavior — especially **precedence**, **associativity**, and **short-circuit evaluation** — is essential for writing correct and efficient code.",
      "**Arithmetic Operators:** `+`, `-`, `*`, `/`, `%`. Key detail: **integer division** truncates the result (`7/2 = 3`, not `3.5`). To get decimal results, cast at least one operand to `double`. The `%` modulus operator works with negatives: `-7 % 3 = -1` (sign follows the dividend in Java).",
      "**Increment/Decrement:** `++x` (pre: increment then use) vs `x++` (post: use then increment). A common interview trap: `int x = 5; int y = x++ + ++x;` → `y = 5 + 7 = 12` (x becomes 7).",
      "**Comparison Operators:** `==`, `!=`, `<`, `>`, `<=`, `>=`. For primitives, `==` compares values. For objects, `==` compares **references** (memory addresses) — use `.equals()` for content comparison.",
      "**Logical Operators (Short-Circuit):** `&&` (AND) and `||` (OR) are **short-circuit** — they stop evaluating as soon as the result is determined. `&` and `|` are non-short-circuit (evaluate both sides). Short-circuit is safer: `if (s != null && s.length() > 0)` — the second condition is skipped if `s` is null, preventing `NullPointerException`.",
      "**Bitwise Operators:** `&` (AND), `|` (OR), `^` (XOR), `~` (NOT), `<<` (left shift = multiply by 2), `>>` (arithmetic right shift = divide by 2, preserves sign), `>>>` (unsigned right shift). These are crucial in competitive programming for bitmask DP, subset enumeration, and efficient flag manipulation.",
      "**Operator Precedence** (high → low): Unary (`++`, `--`, `!`, `~`) → Multiplicative (`*`, `/`, `%`) → Additive (`+`, `-`) → Shift (`<<`, `>>`) → Relational (`<`, `>`) → Equality (`==`, `!=`) → Bitwise AND → XOR → OR → Logical AND → Logical OR → Ternary (`?:`) → Assignment (`=`, `+=`). **Rule of thumb:** When in doubt, use parentheses to make precedence explicit."
    ],
    code: [
      {
        title: "All Java Operators",
        language: "java",
        content: `public class Operators {
    public static void main(String[] args) {
        // ── Arithmetic ──
        int a = 10, b = 3;
        System.out.println(a + b);   // 13
        System.out.println(a - b);   // 7
        System.out.println(a * b);   // 30
        System.out.println(a / b);   // 3  (integer division)
        System.out.println(a % b);   // 1  (remainder)

        // ── Increment / Decrement ──
        int x = 5;
        System.out.println(x++);     // 5  (post-increment)
        System.out.println(++x);     // 7  (pre-increment)

        // ── Comparison ──
        System.out.println(10 > 5);   // true
        System.out.println(10 == 10); // true
        System.out.println(10 != 5);  // true

        // ── Logical (short-circuit) ──
        boolean p = true, q = false;
        System.out.println(p && q);   // false (AND)
        System.out.println(p || q);   // true  (OR)
        System.out.println(!p);       // false (NOT)

        // ── Assignment ──
        int n = 10;
        n += 5; n -= 3; n *= 2; n /= 4; n %= 4;

        // ── Ternary ──
        int max = (a > b) ? a : b;

        // ── instanceof ──
        String s = "hello";
        System.out.println(s instanceof String); // true

        // ── Bitwise ──
        System.out.println(5 & 3);   // 1  AND
        System.out.println(5 | 3);   // 7  OR
        System.out.println(5 ^ 3);   // 6  XOR
        System.out.println(~5);      // -6 NOT
        System.out.println(5 << 1);  // 10 Left shift
        System.out.println(5 >> 1);  // 2  Right shift
    }
}`
      }
    ],
    note: "Use **parentheses** to make operator precedence explicit and avoid bugs."
  },
  {
    id: "java-control",
    title: "Control Flow (if/else, switch)",
    difficulty: "Easy",
    theory: [
      "Control flow statements determine which code gets executed and when. Java supports **if-else**, **switch** (including enhanced switch expressions in Java 14+), and the **ternary** operator for conditional logic.",
      "**if-else:** The most fundamental branching mechanism. Conditions are evaluated top-down — once a branch matches, the rest are skipped. Best practice: handle the most likely case first for readability, and always use braces `{}` even for single statements to prevent bugs.",
      "**switch Statement:** More readable than chained if-else when comparing a single variable against multiple constant values. Works with `byte`, `short`, `int`, `char`, `String` (Java 7+), and `enum` types. **Fall-through:** without `break`, execution falls through to the next case — this is a common source of bugs.",
      "**Switch Expressions (Java 14+):** A modern, safer alternative using `->` arrow syntax. No fall-through risk, can return values directly, and the compiler ensures all cases are covered (exhaustiveness check). Use `yield` for multi-line cases in switch expressions.",
      "**Ternary Operator:** `condition ? valueIfTrue : valueIfFalse` — a compact inline conditional. Use for simple assignments; avoid nesting ternaries as they become unreadable."
    ],
    code: [
      {
        title: "If-Else & Nested Conditions",
        language: "java",
        content: `public class ControlFlow {
    public static void main(String[] args) {
        int score = 85;

        if (score >= 90) {
            System.out.println("Grade: A");
        } else if (score >= 80) {
            System.out.println("Grade: B");
        } else if (score >= 70) {
            System.out.println("Grade: C");
        } else {
            System.out.println("Grade: F");
        }
        // Output: Grade: B
    }
}`
      },
      {
        title: "Switch Statement & Switch Expressions (Java 14+)",
        language: "java",
        content: `public class SwitchDemo {
    public static void main(String[] args) {
        int day = 3;

        // Traditional switch
        switch (day) {
            case 1: System.out.println("Monday"); break;
            case 2: System.out.println("Tuesday"); break;
            case 3: System.out.println("Wednesday"); break;
            default: System.out.println("Other");
        }

        // Enhanced switch expression (Java 14+)
        String dayName = switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 6, 7 -> "Weekend";
            default -> "Other";
        };

        // Switch with String
        String cmd = "start";
        switch (cmd) {
            case "start" -> System.out.println("Starting...");
            case "stop"  -> System.out.println("Stopping...");
            default      -> System.out.println("Unknown");
        }
    }
}`
      }
    ]
  },
  {
    id: "java-loops",
    title: "Loops (for, while, do-while)",
    difficulty: "Easy",
    theory: [
      "Loops allow you to execute a block of code repeatedly. Choosing the right loop type and understanding loop mechanics is fundamental to programming efficiency.",
      "**for loop:** Best when the number of iterations is known. Consists of three parts: initialization, condition, and update — all in one line. The loop variable's scope is limited to the loop block.",
      "**Enhanced for-each (Java 5+):** Simplified syntax for iterating over arrays and `Iterable` collections. You cannot modify the collection during iteration, and you don't have access to the index — use a regular for loop if you need the index.",
      "**while loop:** Best when the number of iterations is unknown and depends on a condition. The condition is checked **before** each iteration — if initially false, the body never executes.",
      "**do-while loop:** Similar to while, but the body executes **at least once** because the condition is checked **after** each iteration. Useful for menu-driven programs or input validation.",
      "**Loop Control:** `break` exits the loop entirely, `continue` skips to the next iteration. **Labeled break/continue** allows controlling outer loops from inner loops — invaluable for nested loop problems in CP.",
      "**Performance Tips:** Avoid calling methods in the loop condition (e.g., `i < list.size()` — cache the size). Prefer `for` over `while` when possible for clearer scope. In CP, watch out for **infinite loops** — always ensure the loop variable converges toward the termination condition."
    ],
    code: [
      {
        title: "All Loop Types with Break & Continue",
        language: "java",
        content: `public class Loops {
    public static void main(String[] args) {
        // Standard for loop
        for (int i = 0; i < 5; i++) {
            System.out.print(i + " "); // 0 1 2 3 4
        }

        // Enhanced for-each
        int[] arr = {10, 20, 30, 40, 50};
        for (int val : arr) {
            System.out.print(val + " ");
        }

        // While loop
        int n = 5;
        while (n > 0) {
            System.out.print(n-- + " "); // 5 4 3 2 1
        }

        // Do-While (executes at least once)
        int x = 0;
        do {
            System.out.print(x + " "); // 0
            x++;
        } while (x < 0);

        // Break & Continue
        for (int i = 0; i < 10; i++) {
            if (i == 3) continue;  // Skip 3
            if (i == 7) break;     // Stop at 7
            System.out.print(i + " "); // 0 1 2 4 5 6
        }

        // Labeled break (nested loops)
        outer:
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (i == 1 && j == 1) break outer;
                System.out.print("[" + i + "," + j + "] ");
            }
        }
    }
}`
      }
    ],
    tip: "In CP, use `for` loops for known iterations and `while` for condition-based. **Labeled breaks** are handy for nested loops."
  },
  {
    id: "java-arrays",
    title: "Arrays & Multi-dimensional Arrays",
    difficulty: "Easy",
    theory: [
      "An **array** is a fixed-size, indexed collection of elements of the same type. Java arrays are **objects** stored on the heap with a fixed `.length` property that cannot be changed after creation.",
      "**Memory Layout:** Array elements are stored in **contiguous memory**, which enables O(1) random access by index. The array reference lives on the stack, but the actual data lives on the heap. When you pass an array to a method, you pass the reference — the method can modify the original array.",
      "**Initialization:** Arrays can be declared with `new int[n]` (all elements initialized to default: 0 for int, false for boolean, null for objects) or with literal syntax `{1, 2, 3}`. The size is fixed at creation — to resize, you must create a new array and copy elements.",
      "**Arrays Utility Class:** `java.util.Arrays` provides essential static methods: `sort()` (dual-pivot quicksort for primitives, TimSort for objects — both O(n log n)), `binarySearch()` (array must be sorted first), `fill()`, `copyOf()`, `copyOfRange()`, `equals()`, `deepEquals()` (for multi-dimensional), `toString()`, and `stream()`.",
      "**2D Arrays (Matrices):** Declared as `int[][]` — actually an array of arrays. Each row can have a different length (**jagged arrays**). Row-major traversal (row by row) is more cache-friendly than column-major in Java.",
      "**Common Pitfalls:** `ArrayIndexOutOfBoundsException` (accessing index < 0 or ≥ length), confusing `.length` (array property, no parentheses) with `.length()` (String method), and forgetting that `Arrays.sort()` modifies the array in-place."
    ],
    code: [
      {
        title: "1D Arrays — Declaration, Initialization & Utility Methods",
        language: "java",
        content: `import java.util.Arrays;

public class ArrayDemo {
    public static void main(String[] args) {
        int[] arr1 = new int[5];              // [0, 0, 0, 0, 0]
        int[] arr2 = {10, 20, 30, 40, 50};
        int[] arr3 = new int[]{1, 2, 3};

        arr1[0] = 100;
        System.out.println(arr2[2]);           // 30
        System.out.println(arr2.length);       // 5

        // Arrays utility class
        Arrays.sort(arr2);                          // Sort ascending
        System.out.println(Arrays.toString(arr2));
        int idx = Arrays.binarySearch(arr2, 30);
        Arrays.fill(arr1, 7);
        int[] copy = Arrays.copyOf(arr2, 3);
        boolean eq = Arrays.equals(arr2, copy);
    }
}`
      },
      {
        title: "2D Arrays (Matrix) & Jagged Arrays",
        language: "java",
        content: `public class Matrix {
    public static void main(String[] args) {
        int[][] grid = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };

        System.out.println(grid[1][2]); // 6

        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[i].length; j++) {
                System.out.print(grid[i][j] + " ");
            }
            System.out.println();
        }

        // Jagged array (different row lengths)
        int[][] jagged = new int[3][];
        jagged[0] = new int[]{1, 2};
        jagged[1] = new int[]{3, 4, 5};
        jagged[2] = new int[]{6};
    }
}`
      }
    ]
  },
  {
    id: "java-strings",
    title: "Strings & String Methods",
    difficulty: "Easy",
    theory: [
      "Strings in Java are **immutable** reference types backed by a `char[]` (or `byte[]` since Java 9 for compact strings). Any modification creates a **new** String object — the original is never changed. This immutability provides thread-safety, caching benefits (String pool), and security (strings are used for passwords, URLs, class names).",
      "**String Pool (String Interning):** Java maintains a special memory area called the **String Pool** in the heap. When you create a string with a literal (`String s = \"hello\"`), Java first checks the pool — if an identical string exists, it returns the existing reference. This saves memory but means `==` sometimes works for String comparison (when both are from the pool) — however, **always use `.equals()`** for reliability.",
      "**String vs StringBuilder vs StringBuffer:** `String` is immutable — each concatenation creates a new object, making repeated concatenation O(n²). `StringBuilder` is mutable and not synchronized — fastest for single-threaded string building, O(n) for n appends. `StringBuffer` is synchronized (thread-safe) but slower — use only in multi-threaded contexts.",
      "**Essential String Methods:** `charAt()`, `substring()`, `indexOf()`, `lastIndexOf()`, `contains()`, `startsWith()`, `endsWith()`, `replace()`, `replaceAll()` (regex), `split()` (regex), `trim()`, `strip()` (Java 11, Unicode-aware), `toUpperCase()`, `toLowerCase()`, `toCharArray()`, `compareTo()` (lexicographic), `isEmpty()`, `isBlank()` (Java 11).",
      "**CP Tips:** For heavy string manipulation, always use `StringBuilder`. For character frequency counting, use an `int[26]` array (faster than HashMap). `String.toCharArray()` is handy for sorting characters. `compareTo()` returns negative/zero/positive for lexicographic comparison."
    ],
    code: [
      {
        title: "String Methods & Comparison",
        language: "java",
        content: `public class StringDemo {
    public static void main(String[] args) {
        String s = "Hello, World!";

        s.length();              // 13
        s.charAt(0);             // 'H'
        s.substring(7);          // "World!"
        s.substring(0, 5);       // "Hello"
        s.indexOf("World");      // 7
        s.contains("World");     // true
        s.toUpperCase();         // "HELLO, WORLD!"
        s.replace("World", "Java"); // "Hello, Java!"
        s.trim();                // Remove whitespace
        s.startsWith("Hello");   // true
        s.isEmpty();             // false

        // ⚠️ Comparison
        String a = "hello", b = "hello";
        a == b;              // true  (string pool)
        a.equals(b);         // true  (ALWAYS use this!)

        String c = new String("hello");
        a == c;              // false!
        a.equals(c);         // true

        // Split & Join
        String[] parts = "a,b,c".split(",");
        String joined = String.join("-", parts); // "a-b-c"

        // char[] ↔ String
        char[] chars = s.toCharArray();
        String fromChars = new String(chars);
    }
}`
      },
      {
        title: "StringBuilder — Mutable Strings",
        language: "java",
        content: `public class StringBuilderDemo {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello");
        sb.append(" World");
        sb.insert(5, ",");       // "Hello, World"
        sb.delete(5, 6);         // "Hello World"
        sb.reverse();            // "dlroW olleH"

        // ❌ Slow — O(n²) total
        String result = "";
        for (int i = 0; i < 10000; i++) result += i;

        // ✅ Fast — O(n) total
        StringBuilder fast = new StringBuilder();
        for (int i = 0; i < 10000; i++) fast.append(i);
    }
}`
      }
    ],
    warning: "**Never** use `==` to compare Strings! Always use `.equals()`. The `==` operator compares **references**, not content."
  },
  {
    id: "java-input",
    title: "Scanner & User Input",
    difficulty: "Easy",
    theory: [
      "The `Scanner` class (from `java.util`) reads user input from various sources — keyboard (`System.in`), files, or strings. It provides convenient methods like `nextInt()`, `nextLine()`, `nextDouble()`, etc.",
      "**Scanner Pitfalls:** The most common bug is mixing `nextInt()`/`nextDouble()` with `nextLine()` — numeric methods leave the newline character `\\n` in the buffer, causing the next `nextLine()` to read an empty string. Always add an extra `sc.nextLine()` after numeric reads to consume the leftover newline.",
      "**BufferedReader vs Scanner:** For competitive programming, `BufferedReader` + `StringTokenizer` is **5-10x faster** than Scanner. Scanner uses regex internally for parsing, which adds overhead. For large inputs (10⁵+ lines), Scanner can cause TLE (Time Limit Exceeded) on competitive programming judges.",
      "**Fast I/O Pattern for CP:** Use `BufferedReader` for input and `PrintWriter` with `BufferedOutputStream` for output. This minimizes system calls by batching I/O operations. Always call `pw.flush()` at the end to ensure all output is written."
    ],
    code: [
      {
        title: "Scanner & BufferedReader for CP",
        language: "java",
        content: `import java.util.Scanner;
import java.io.*;

public class InputDemo {
    public static void main(String[] args) throws IOException {
        // ── Scanner (simple, slower) ──
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double d = sc.nextDouble();
        sc.nextLine(); // consume leftover newline!
        String line = sc.nextLine();
        sc.close();

        // ── BufferedReader (fast, preferred for CP) ──
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        int x = Integer.parseInt(br.readLine());

        // Multiple integers from one line
        String[] tokens = br.readLine().split(" ");
        int a = Integer.parseInt(tokens[0]);
        int b = Integer.parseInt(tokens[1]);

        // Fast output
        PrintWriter pw = new PrintWriter(new BufferedOutputStream(System.out));
        pw.println("Result: " + (a + b));
        pw.flush();
    }
}`
      }
    ],
    tip: "In competitive programming, always use **BufferedReader + PrintWriter** instead of Scanner + System.out.println for faster I/O."
  },
  {
    id: "java-typecasting",
    title: "Type Casting & Conversion",
    difficulty: "Easy",
    theory: [
      "Type casting converts a value from one type to another. Java distinguishes between **widening** (safe, automatic) and **narrowing** (potentially lossy, requires explicit cast).",
      "**Widening (Implicit) Conversions:** Smaller types are automatically promoted to larger types without data loss. The widening path is: `byte → short → int → long → float → double`. Note: `int → float` and `long → double` may lose **precision** (not magnitude) because floats have only ~7 significant digits.",
      "**Narrowing (Explicit) Conversions:** Larger types must be explicitly cast to smaller types using `(type)` syntax. This can cause **data loss** — truncation for decimals (`(int)3.99 = 3`), and **overflow** for integers (`(byte)256 = 0` because 256 wraps around).",
      "**Object Type Casting:** For objects, you can **upcast** (child → parent) implicitly and **downcast** (parent → child) explicitly. Downcasting can throw `ClassCastException` at runtime if the object isn't actually an instance of the target type. Use `instanceof` to check safely before downcasting.",
      "**Pattern Matching for instanceof (Java 16+):** Combines the type check and cast in one step: `if (obj instanceof String str)` — `str` is automatically cast and available in the block. This eliminates the separate cast line and reduces bugs."
    ],
    code: [
      {
        title: "Type Casting in Java",
        language: "java",
        content: `public class TypeCasting {
    public static void main(String[] args) {
        // Widening (Implicit)
        int i = 100;
        long l = i;        // int → long (automatic)
        double d = l;      // long → double (automatic)

        // Narrowing (Explicit)
        double pi = 3.14159;
        int truncated = (int) pi;     // 3 (decimal lost!)

        // char ↔ int
        char c = 'A';
        int ascii = c;         // 65
        char back = (char) 65; // 'A'

        // String conversions
        String s1 = String.valueOf(42);
        int n = Integer.parseInt("123");
        double f = Double.parseDouble("3.14");

        // Safe casting with instanceof (Java 16+)
        Object obj = "Hello";
        if (obj instanceof String str) {
            System.out.println(str.toUpperCase());
        }
    }
}`
      }
    ],
    warning: "Be careful with **narrowing casts** — they can silently overflow or lose precision."
  }
];

// OOP content — comprehensive and in-depth
export const javaOOPContent: ContentSection[] = [
  {
    id: "oop-classes",
    title: "Classes & Objects",
    difficulty: "Easy",
    theory: [
      "A **class** is a blueprint/template that defines the structure (fields) and behavior (methods) of objects. Think of a class as a cookie cutter and objects as the cookies — the class defines the shape, each cookie is a unique instance.",
      "An **object** is a concrete instance of a class — it occupies memory on the **heap**. Every object has three characteristics: **state** (fields/attributes), **behavior** (methods), and **identity** (unique memory address).",
      "A class can contain: **fields** (instance variables), **methods**, **constructors**, **nested classes**, **static members**, and **initialization blocks**.",
      "**Object Creation Process:** When you write `Student s = new Student()`, four things happen: (1) Memory is allocated on the heap for the object, (2) Instance variables are initialized to defaults (0, null, false), (3) The constructor body executes, (4) The reference is stored in `s` on the stack.",
      "The **reference variable** (like `s`) lives on the **stack** and holds the memory address of the object on the **heap**. It is NOT the object itself — it's a pointer to the object.",
      "If two references point to the same object (`Student s2 = s1`), modifying through one affects the other — they share the same memory. This is called **aliasing** and is a common source of bugs.",
      "**The `equals()` and `hashCode()` Contract:** By default, `equals()` compares **references** (same as `==`). You MUST override both `equals()` and `hashCode()` together for meaningful comparison. The contract states: if `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` must also be true. Violating this breaks HashMap, HashSet, and other hash-based collections.",
      "Every class implicitly extends **java.lang.Object** — the root of all classes. Object provides: `toString()` (string representation), `equals()` (equality check), `hashCode()` (hash code for collections), `getClass()` (runtime type), `clone()` (shallow copy), `finalize()` (deprecated), and `wait()`/`notify()` (thread coordination).",
      "**Pass-by-Value in Java:** Java is ALWAYS pass-by-value. For primitives, the value is copied. For objects, the **reference** (address) is copied — not the object. This means a method can modify an object's fields but cannot make the caller's reference point to a different object."
    ],
    diagram: {
      type: "table-visual",
      title: "Stack vs Heap Memory",
      data: [
        {
          label: "Stack Memory",
          color: "primary",
          children: [
            { label: "Stores local variables & references" },
            { label: "One stack per thread" },
            { label: "LIFO — auto-managed (fast)" },
            { label: "Small size, method-scoped" }
          ]
        },
        {
          label: "Heap Memory",
          color: "accent",
          children: [
            { label: "Stores all objects & arrays" },
            { label: "Shared across all threads" },
            { label: "Managed by Garbage Collector" },
            { label: "Large size, application-scoped" }
          ]
        }
      ]
    },
    keyPoints: [
      "Objects live on the heap; references live on the stack",
      "Always override toString(), equals(), and hashCode() in data classes",
      "new keyword = allocate memory + call constructor + return reference"
    ],
    code: [
      {
        title: "Defining & Using Classes",
        language: "java",
        content: `public class Student {
    // Fields (instance variables)
    String name;
    int age;
    double gpa;

    // Constructor — initializes the object
    public Student(String name, int age, double gpa) {
        this.name = name;  // 'this' refers to current object
        this.age = age;
        this.gpa = gpa;
    }

    // Instance method
    public void display() {
        System.out.println(name + " | Age: " + age + " | GPA: " + gpa);
    }

    // Always override toString() for readable output
    @Override
    public String toString() {
        return "Student{name='" + name + "', age=" + age + ", gpa=" + gpa + "}";
    }

    // Override equals for content-based comparison
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Student student = (Student) o;
        return age == student.age && name.equals(student.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    public static void main(String[] args) {
        Student s1 = new Student("Alice", 20, 3.8);
        Student s2 = new Student("Bob", 22, 3.5);
        s1.display();
        System.out.println(s2);          // calls toString()
        System.out.println(s1.equals(s2)); // false — different content
    }
}`
      },
      {
        title: "References vs Objects — Memory Model",
        language: "java",
        content: `public class ReferenceDemo {
    public static void main(String[] args) {
        // s1 and s2 are different objects
        Student s1 = new Student("Alice", 20, 3.8);
        Student s2 = new Student("Alice", 20, 3.8);
        System.out.println(s1 == s2);       // false (different references)
        System.out.println(s1.equals(s2));  // true  (same content, if overridden)

        // s3 points to SAME object as s1
        Student s3 = s1;
        s3.name = "Modified";
        System.out.println(s1.name); // "Modified" — both point to same object!

        // null reference
        Student s4 = null;
        // s4.display(); // NullPointerException!
        if (s4 != null) s4.display(); // safe check
    }
}`
      }
    ],
    warning: "Using `==` compares **references** (memory addresses), not content. Always use `.equals()` for object comparison."
  },
  {
    id: "oop-constructors",
    title: "Constructors & this Keyword",
    difficulty: "Easy",
    theory: [
      "A **constructor** is a special method that initializes an object when it's created with `new`",
      "Constructor name must **match the class name** exactly and has **no return type** (not even void)",
      "If you don't write any constructor, Java provides a **default no-arg constructor** automatically",
      "But if you write ANY constructor, the default one is **NOT provided** — you must write it yourself if needed",
      "**Constructor types:** Default (no-arg), Parameterized (with arguments), Copy (takes same class instance)",
      "**Constructor chaining:** use `this()` to call another constructor in the same class — must be the **first statement**",
      "**`this` keyword** refers to the current object — used to distinguish fields from parameters with the same name",
      "`this` can also be used to: pass current object to a method, return current object for method chaining",
      "Constructors are **NOT inherited** — a subclass cannot inherit the parent's constructor, but can call it using `super()`"
    ],
    code: [
      {
        title: "Constructor Types & Chaining",
        language: "java",
        content: `public class Rectangle {
    double width, height;

    // Default constructor — chains to parameterized
    public Rectangle() {
        this(1.0, 1.0); // constructor chaining with this()
    }

    // Parameterized constructor
    public Rectangle(double width, double height) {
        this.width = width;   // this.width = field, width = parameter
        this.height = height;
    }

    // Copy constructor
    public Rectangle(Rectangle other) {
        this(other.width, other.height); // chain to parameterized
    }

    public double area() { return width * height; }
    public double perimeter() { return 2 * (width + height); }

    public static void main(String[] args) {
        Rectangle r1 = new Rectangle();          // 1×1 (default)
        Rectangle r2 = new Rectangle(5, 3);      // 5×3
        Rectangle r3 = new Rectangle(r2);        // Copy of r2

        System.out.println(r1.area());       // 1.0
        System.out.println(r2.area());       // 15.0
        System.out.println(r3.perimeter());  // 16.0
    }
}`
      },
      {
        title: "Method Chaining with this — Builder Pattern",
        language: "java",
        content: `public class QueryBuilder {
    private String table;
    private String where;
    private String orderBy;
    private int limit = -1;

    // Each setter returns 'this' for chaining
    public QueryBuilder from(String table) {
        this.table = table;
        return this;  // return current object
    }

    public QueryBuilder where(String condition) {
        this.where = condition;
        return this;
    }

    public QueryBuilder orderBy(String column) {
        this.orderBy = column;
        return this;
    }

    public QueryBuilder limit(int n) {
        this.limit = n;
        return this;
    }

    public String build() {
        StringBuilder sb = new StringBuilder("SELECT * FROM " + table);
        if (where != null) sb.append(" WHERE ").append(where);
        if (orderBy != null) sb.append(" ORDER BY ").append(orderBy);
        if (limit > 0) sb.append(" LIMIT ").append(limit);
        return sb.toString();
    }

    public static void main(String[] args) {
        // Fluent API using method chaining
        String query = new QueryBuilder()
            .from("users")
            .where("age > 18")
            .orderBy("name")
            .limit(10)
            .build();
        System.out.println(query);
        // SELECT * FROM users WHERE age > 18 ORDER BY name LIMIT 10
    }
}`
      }
    ],
    tip: "Use **method chaining** (returning `this`) to create fluent APIs — it makes code more readable and concise."
  },
  {
    id: "oop-encapsulation",
    title: "Encapsulation & Access Modifiers",
    difficulty: "Medium",
    theory: [
      "**Encapsulation** is the most fundamental OOP principle — it bundles data (fields) and the methods that operate on that data into a single unit (class), and restricts direct access to the internals. It's the idea that an object should control how its state is accessed and modified.",
      "**Why Encapsulation Matters:** Without it, any code anywhere can set `account.balance = -1000`, putting the object in an invalid state. With encapsulation, `deposit()` and `withdraw()` methods enforce rules (positive amounts, sufficient funds) before changing the balance.",
      "**Access Modifiers** control visibility at four levels:",
      "**public** — accessible from anywhere, any package, any class. Use for APIs and methods meant for external use.",
      "**private** — accessible only within the **same class**. Most fields should be private. This is the default choice for data protection.",
      "**protected** — accessible within the same **package** AND in **subclasses** (even in different packages). Use for members that subclasses need to access or override.",
      "**default (no modifier, aka package-private)** — accessible only within the same **package**. This is Java's default if you specify no modifier. Useful for internal implementation classes.",
      "**The JavaBean Pattern:** Make all fields **private**, provide **public getters** (read access) and **setters** (write access with validation). This is the standard encapsulation pattern used in almost all Java frameworks (Spring, Hibernate, Jackson).",
      "**Immutable Objects:** Make fields `private final`, provide no setters, set values only in the constructor, and if fields reference mutable objects (List, Date), return **defensive copies** from getters. Examples: String, Integer, LocalDate, BigDecimal. Immutable objects are inherently **thread-safe**.",
      "**Information Hiding:** Encapsulation enables you to change the internal implementation (e.g., switch from ArrayList to LinkedList) without affecting any code that uses the class — as long as the public API stays the same. This is crucial for maintainability in large codebases.",
      "**Defensive Copying:** When a getter returns a mutable object (like a List or Date), return a copy instead of the original — otherwise external code can modify your internal state, breaking encapsulation. Example: `return new ArrayList<>(this.items);`"
    ],
    keyPoints: [
      "private fields + public getters/setters = encapsulation",
      "Validate data in setters to prevent invalid states",
      "Immutable objects are thread-safe and easier to reason about",
      "Access levels: private < default < protected < public"
    ],
    code: [
      {
        title: "Encapsulation with Getters/Setters & Validation",
        language: "java",
        content: `public class BankAccount {
    private String owner;          // private — only accessible in this class
    private double balance;
    private final String accountId; // final — set once, never changed

    public BankAccount(String owner, String accountId, double initialBalance) {
        if (initialBalance < 0) throw new IllegalArgumentException("Balance can't be negative");
        this.owner = owner;
        this.accountId = accountId;
        this.balance = initialBalance;
    }

    // Getter — read access
    public double getBalance() { return balance; }
    public String getOwner() { return owner; }
    public String getAccountId() { return accountId; }

    // No setter for accountId — it's immutable

    // Controlled modification — not raw setter
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Deposit must be positive");
        balance += amount;
        System.out.println("Deposited: " + amount + " | New balance: " + balance);
    }

    public boolean withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Withdrawal must be positive");
        if (amount > balance) {
            System.out.println("Insufficient funds!");
            return false;
        }
        balance -= amount;
        System.out.println("Withdrew: " + amount + " | New balance: " + balance);
        return true;
    }

    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Alice", "ACC001", 1000);
        acc.deposit(500);     // Deposited: 500 | New balance: 1500
        acc.withdraw(200);    // Withdrew: 200 | New balance: 1300
        // acc.balance = -999; // ❌ COMPILE ERROR — balance is private
    }
}`
      },
      {
        title: "Access Modifier Summary",
        language: "java",
        content: `// Access Modifier Visibility Table:
// ┌──────────────┬───────┬─────────┬──────────┬───────┐
// │   Modifier   │ Class │ Package │ Subclass │ World │
// ├──────────────┼───────┼─────────┼──────────┼───────┤
// │ public       │  ✅   │   ✅    │    ✅    │  ✅   │
// │ protected    │  ✅   │   ✅    │    ✅    │  ❌   │
// │ default      │  ✅   │   ✅    │    ❌    │  ❌   │
// │ private      │  ✅   │   ❌    │    ❌    │  ❌   │
// └──────────────┴───────┴─────────┴──────────┴───────┘

package com.example;

public class AccessDemo {
    public int publicField = 1;       // anyone
    protected int protectedField = 2; // package + subclasses
    int defaultField = 3;             // same package only
    private int privateField = 4;     // this class only

    // Best practice: private fields + public methods
    private String secret = "hidden";

    public String getSecret() {
        return secret;  // controlled access
    }
}`
      },
      {
        title: "Immutable Class — Thread-Safe by Design",
        language: "java",
        content: `// Immutable class — all fields are final, no setters
public final class Money {  // final — can't be subclassed
    private final double amount;
    private final String currency;

    public Money(double amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    // Only getters, no setters
    public double getAmount() { return amount; }
    public String getCurrency() { return currency; }

    // Operations return NEW objects instead of modifying
    public Money add(Money other) {
        if (!this.currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
        return new Money(this.amount + other.amount, this.currency);
    }

    public Money multiply(double factor) {
        return new Money(this.amount * factor, this.currency);
    }

    @Override
    public String toString() {
        return String.format("%.2f %s", amount, currency);
    }

    public static void main(String[] args) {
        Money price = new Money(100, "USD");
        Money tax = new Money(8.5, "USD");
        Money total = price.add(tax);           // returns NEW Money
        System.out.println(total);              // 108.50 USD
        System.out.println(price);              // 100.00 USD (unchanged!)
    }
}`
      }
    ],
    warning: "Exposing mutable objects (arrays, lists) through getters breaks encapsulation — return **defensive copies** instead."
  },
  {
    id: "oop-inheritance",
    title: "Inheritance & super Keyword",
    difficulty: "Medium",
    theory: [
      "**Inheritance** is the mechanism by which a child class (subclass) acquires all non-private fields and methods of a parent class (superclass) using the `extends` keyword. It represents an **IS-A** relationship: Dog IS-A Animal, ElectricCar IS-A Car.",
      "**Purpose:** Code reuse (write common logic once in the parent), establishing type hierarchies (polymorphism), and modeling real-world taxonomies.",
      "Java supports only **single inheritance** for classes — a class can extend exactly ONE parent. This avoids the **Diamond Problem** (ambiguity when two parents have the same method). However, a class can implement **multiple interfaces**.",
      "**The `super` keyword** refers to the parent class. Three uses: (1) Call parent constructor: `super(args)` — must be the FIRST line in the child constructor. (2) Call parent method: `super.method()` — useful when overriding but still need the parent's behavior. (3) Access parent field: `super.field` — when child has a field with the same name (shadowing).",
      "**Constructor Chain:** Every constructor implicitly calls `super()` (parent's no-arg constructor) as its first statement if you don't explicitly call `this()` or `super(args)`. If the parent has no no-arg constructor, you MUST explicitly call `super(args)` — otherwise compile error.",
      "**Method Overriding:** The child provides its own version of a parent method with the **exact same signature** (name + parameters). The `@Override` annotation is strongly recommended — the compiler will catch mistakes. Overriding rules: access modifier must be **same or wider** (e.g., protected → public OK, public → private NOT OK), return type must be **same or covariant** (subtype).",
      "**What IS inherited:** public and protected members, default members (if in same package). **What is NOT inherited:** private members (they exist in the object but are not directly accessible), constructors (must be called via `super()`), and static methods (they are hidden, not overridden).",
      "**`final` keyword in inheritance:** `final class` cannot be extended (e.g., String, Integer). `final method` cannot be overridden. `final variable` cannot be reassigned.",
      "**Inheritance vs Composition:** Inheritance creates tight coupling — changes to the parent ripple to all children. **Composition** (HAS-A: Car HAS-A Engine) is more flexible, allows swapping implementations at runtime, and doesn't break when the composed class changes. **Rule of thumb:** 'Is B truly a type of A?' → inheritance. 'B uses A' → composition. When in doubt, prefer composition.",
      "**Inheritance depth:** Avoid chains deeper than 3 levels. Deep hierarchies are hard to understand and maintain. The Java standard library itself rarely goes beyond 3 levels."
    ],
    keyPoints: [
      "super() must be the first statement in a constructor",
      "Private members are inherited but NOT accessible in the subclass",
      "Use @Override annotation to catch override mistakes at compile time",
      "Prefer composition over inheritance when possible"
    ],
    code: [
      {
        title: "Inheritance — IS-A Relationship",
        language: "java",
        content: `class Animal {
    String name;
    int age;

    Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void speak() {
        System.out.println(name + " makes a sound");
    }

    void eat() {
        System.out.println(name + " is eating");
    }

    @Override
    public String toString() {
        return name + " (age " + age + ")";
    }
}

class Dog extends Animal {
    String breed;

    Dog(String name, int age, String breed) {
        super(name, age);  // MUST call parent constructor first
        this.breed = breed;
    }

    @Override  // method overriding
    void speak() {
        System.out.println(name + " barks! 🐕");
    }

    // New method specific to Dog
    void fetch() {
        System.out.println(name + " fetches the ball");
    }
}

class Cat extends Animal {
    Cat(String name, int age) {
        super(name, age);
    }

    @Override
    void speak() {
        System.out.println(name + " meows! 🐱");
    }
}

public class InheritanceDemo {
    public static void main(String[] args) {
        Dog dog = new Dog("Buddy", 3, "Golden Retriever");
        dog.speak();    // Buddy barks! 🐕
        dog.eat();      // Buddy is eating (inherited from Animal)
        dog.fetch();    // Buddy fetches the ball

        // Polymorphic reference — parent type, child object
        Animal animal = new Cat("Whiskers", 2);
        animal.speak(); // Whiskers meows! 🐱 (dynamic dispatch)
        // animal.purr(); // ❌ can't call Cat-specific methods
    }
}`
      },
      {
        title: "Composition over Inheritance (HAS-A)",
        language: "java",
        content: `// ❌ Inheritance can be rigid
// class FlyingCar extends Car, Airplane {} // NOT allowed in Java

// ✅ Composition — flexible and modular
class Engine {
    int horsepower;
    Engine(int hp) { this.horsepower = hp; }
    void start() { System.out.println("Engine started (" + horsepower + " HP)"); }
}

class GPS {
    void navigate(String dest) { System.out.println("Navigating to " + dest); }
}

// Car HAS-A Engine and HAS-A GPS (composition)
class Car {
    private Engine engine;     // HAS-A relationship
    private GPS gps;           // HAS-A relationship
    private String model;

    Car(String model, int hp) {
        this.model = model;
        this.engine = new Engine(hp);  // composed inside
        this.gps = new GPS();
    }

    void start() {
        System.out.println(model + " starting...");
        engine.start();  // delegate to engine
    }

    void goTo(String dest) {
        gps.navigate(dest);  // delegate to GPS
    }
}

public class CompositionDemo {
    public static void main(String[] args) {
        Car car = new Car("Tesla Model 3", 283);
        car.start();         // Tesla Model 3 starting... Engine started (283 HP)
        car.goTo("Airport"); // Navigating to Airport
    }
}`
      }
    ],
    tip: "Ask yourself: 'Is B truly a type of A?' If yes → inheritance. If 'B uses A' → composition. When in doubt, prefer composition."
  },
  {
    id: "oop-polymorphism",
    title: "Polymorphism (Overloading/Overriding)",
    difficulty: "Medium",
    theory: [
      "**Polymorphism** (Greek: 'many forms') is the ability of a single interface to represent different underlying types. It's what makes OOP truly powerful — you can write code that works with the parent type and automatically handles any child type correctly.",
      "**Two types of polymorphism in Java:**",
      "**1. Compile-time (Static) Polymorphism → Method Overloading:** Same method name, different parameter lists in the SAME class. The compiler decides which version to call based on the arguments at compile time. Overloading rules: methods must differ in number, type, or order of parameters. **Return type alone is NOT enough** to distinguish overloaded methods.",
      "**2. Runtime (Dynamic) Polymorphism → Method Overriding:** A subclass provides its own implementation of a parent method with the exact same signature. The JVM decides which version to call at **runtime** based on the actual object type — this is called **dynamic dispatch** or **late binding**.",
      "**How Dynamic Dispatch Works Internally:** The JVM maintains a **vtable** (virtual method table) for each class — a lookup table mapping method signatures to their implementations. When you call `animal.speak()`, the JVM checks the actual object's vtable at runtime to find the correct `speak()` method, not the reference type's.",
      "**Upcasting** (child → parent reference): Always safe, automatic. `Animal a = new Dog()` — you can treat a Dog as an Animal. You lose access to Dog-specific methods but gain flexibility.",
      "**Downcasting** (parent → child reference): Risky, requires explicit cast. `Dog d = (Dog) animal` — can throw `ClassCastException` if the object isn't actually a Dog. **Always check with `instanceof` first.**",
      "**Pattern Matching (Java 16+):** `if (obj instanceof Dog d)` — combines the instanceof check and the cast in one step. The variable `d` is automatically cast and scoped to the block. This eliminates verbose casting boilerplate.",
      "**Polymorphism in Practice:** Design methods to accept the **most general type** possible (e.g., `List<>` instead of `ArrayList<>`). This lets callers pass any implementation — ArrayList, LinkedList, etc. — making your code flexible and testable."
    ],
    code: [
      {
        title: "Method Overloading — Compile-Time Polymorphism",
        language: "java",
        content: `class MathHelper {
    // Same name, different parameters = overloading
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
    int add(int a, int b, int c) { return a + b + c; }
    String add(String a, String b) { return a + b; } // concatenation

    // ❌ This is NOT valid overloading — same params, different return
    // double add(int a, int b) { return a + b; } // COMPILE ERROR

    public static void main(String[] args) {
        MathHelper m = new MathHelper();
        System.out.println(m.add(2, 3));         // 5 (int version)
        System.out.println(m.add(2.5, 3.5));     // 6.0 (double version)
        System.out.println(m.add(1, 2, 3));      // 6 (three-arg version)
        System.out.println(m.add("Hi", " Java")); // Hi Java (String version)
    }
}`
      },
      {
        title: "Method Overriding & Dynamic Dispatch",
        language: "java",
        content: `class Shape {
    String name;
    Shape(String name) { this.name = name; }

    double area() { return 0; }  // default implementation

    void describe() {
        System.out.printf("%s: area = %.2f%n", name, area());
    }
}

class Circle extends Shape {
    double radius;
    Circle(double r) { super("Circle"); this.radius = r; }

    @Override
    double area() { return Math.PI * radius * radius; }
}

class Rectangle extends Shape {
    double w, h;
    Rectangle(double w, double h) { super("Rectangle"); this.w = w; this.h = h; }

    @Override
    double area() { return w * h; }
}

class Triangle extends Shape {
    double base, height;
    Triangle(double b, double h) { super("Triangle"); this.base = b; this.height = h; }

    @Override
    double area() { return 0.5 * base * height; }
}

public class PolymorphismDemo {
    // This method works with ANY shape — polymorphism in action
    static void printArea(Shape s) {
        s.describe(); // calls the ACTUAL type's area() at runtime
    }

    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(5),
            new Rectangle(4, 6),
            new Triangle(3, 8)
        };

        for (Shape s : shapes) {
            printArea(s);  // dynamic dispatch picks correct area()
        }
        // Circle: area = 78.54
        // Rectangle: area = 24.00
        // Triangle: area = 12.00
    }
}`
      },
      {
        title: "Upcasting, Downcasting & instanceof",
        language: "java",
        content: `public class CastingDemo {
    public static void main(String[] args) {
        // Upcasting — always safe (automatic)
        Animal myDog = new Dog("Rex", 4, "Husky"); // Dog → Animal
        myDog.speak(); // Rex barks! (dynamic dispatch)
        // myDog.fetch(); // ❌ COMPILE ERROR — Animal doesn't have fetch()

        // Downcasting — needs explicit cast
        if (myDog instanceof Dog) {
            Dog d = (Dog) myDog;  // safe — we checked first
            d.fetch();            // ✅ Now we can call Dog methods
        }

        // Java 16+ pattern matching — cleaner
        if (myDog instanceof Dog d) {
            d.fetch();  // d is already cast!
        }

        // Polymorphic array
        Animal[] zoo = { new Dog("A", 1, "Lab"), new Cat("B", 2) };
        for (Animal a : zoo) {
            a.speak(); // each animal speaks differently

            if (a instanceof Dog d) {
                d.fetch(); // only dogs fetch
            }
        }
    }
}`
      }
    ],
    warning: "Always check with `instanceof` before downcasting — otherwise you risk **ClassCastException** at runtime."
  },
  {
    id: "oop-abstraction",
    title: "Abstract Classes & Interfaces",
    difficulty: "Medium",
    theory: [
      "**Abstraction** is the process of hiding complex implementation details and exposing only the essential features. You interact with a TV via a remote (abstraction) without knowing the circuitry inside (implementation). In Java, abstraction is achieved through **abstract classes** and **interfaces**.",
      "**Abstract Class** — declared with the `abstract` keyword. Cannot be instantiated with `new`. It serves as a **partial blueprint** — it can have both abstract methods (no body, subclasses MUST implement) and concrete methods (with body, shared behavior). It can also have fields, constructors, and static methods.",
      "**When to use Abstract Classes:** When related classes share common **state** (fields) and **behavior** (methods). Example: `Vehicle` has fields `brand` and `year`, shared method `stop()`, but each subclass (Car, Bike) implements `start()` differently.",
      "**Template Method Pattern:** A powerful design pattern enabled by abstract classes — define the algorithm skeleton in the abstract class with `final` methods (can't be overridden), and let subclasses fill in specific steps via abstract methods.",
      "**Interface** — a **pure contract** that defines WHAT a class must do, not HOW. It represents a **capability** (CAN-DO relationship): Comparable means 'can be compared', Serializable means 'can be serialized', Runnable means 'can be run in a thread'.",
      "**Interface Evolution:** Before Java 8: only abstract methods and constants (`public static final`). Java 8: added **default methods** (with body, for backward compatibility) and **static methods**. Java 9: added **private methods** (helper methods for default methods, reducing code duplication).",
      "**Key Differences:** Abstract class: single inheritance, can have state (fields), constructors, any access modifier. Interface: multiple inheritance, no state (only constants), no constructors, methods are implicitly public. Abstract class = IS-A with shared code. Interface = CAN-DO capability.",
      "A class can extend only **ONE** abstract class but implement **MANY** interfaces. This is how Java achieves a form of multiple inheritance without the diamond problem — if two interfaces have the same default method, the implementing class must override it to resolve the conflict.",
      "**Sealed Classes (Java 17+):** A middle ground — `sealed class Shape permits Circle, Rectangle, Triangle` restricts which classes can extend it. This enables exhaustive pattern matching in switch expressions and provides better control over inheritance hierarchies.",
      "**Interface vs Abstract Class Decision Tree:** Need shared state (fields)? → Abstract class. Need multiple inheritance? → Interface. Need constructors? → Abstract class. Defining a capability for unrelated classes? → Interface. Both? → Abstract class that implements an interface."
    ],
    keyPoints: [
      "Abstract class: single inheritance, can have state (fields), constructors",
      "Interface: multiple inheritance, no state (only constants), no constructors",
      "Java 8+ interfaces can have default and static methods",
      "Prefer interfaces for defining contracts; abstract classes for sharing code"
    ],
    code: [
      {
        title: "Abstract Class — Shared Base with Template Method",
        language: "java",
        content: `abstract class Vehicle {
    String brand;
    int year;

    // Abstract classes CAN have constructors
    Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    // Abstract method — subclasses MUST implement
    abstract void start();
    abstract double fuelEfficiency();

    // Concrete method — shared implementation
    void stop() {
        System.out.println(brand + " stopped");
    }

    // Template method pattern — defines the algorithm skeleton
    final void tripReport(double distance) {
        start();
        double fuel = distance / fuelEfficiency();
        System.out.printf("Trip: %.1f km, Fuel: %.1f liters%n", distance, fuel);
        stop();
    }
}

class Car extends Vehicle {
    Car(String brand, int year) { super(brand, year); }

    @Override
    void start() { System.out.println(brand + " engine roars!"); }

    @Override
    double fuelEfficiency() { return 15.0; } // km per liter
}

class ElectricCar extends Vehicle {
    ElectricCar(String brand, int year) { super(brand, year); }

    @Override
    void start() { System.out.println(brand + " silently starts"); }

    @Override
    double fuelEfficiency() { return 150.0; } // km per "liter equivalent"
}

public class AbstractDemo {
    public static void main(String[] args) {
        // Vehicle v = new Vehicle("X", 2024); // ❌ can't instantiate abstract
        Vehicle car = new Car("BMW", 2024);
        Vehicle ev = new ElectricCar("Tesla", 2024);

        car.tripReport(100);
        System.out.println();
        ev.tripReport(100);
    }
}`
      },
      {
        title: "Interfaces — Multiple Inheritance of Behavior",
        language: "java",
        content: `// Interfaces define capabilities (CAN-DO)
interface Flyable {
    void fly();                       // abstract
    default void land() {             // default method (Java 8+)
        System.out.println("Landing safely");
    }
}

interface Swimmable {
    void swim();
    default void dive() {
        System.out.println("Diving deep");
    }
}

interface Trackable {
    void getLocation();
    // Static method in interface
    static String gpsFormat(double lat, double lon) {
        return String.format("(%.4f, %.4f)", lat, lon);
    }
}

// A class can implement MULTIPLE interfaces
class Duck implements Flyable, Swimmable {
    @Override
    public void fly() { System.out.println("Duck flies! 🦆"); }

    @Override
    public void swim() { System.out.println("Duck swims!"); }
    // land() and dive() are inherited as defaults
}

// Real-world: combining interfaces
class Drone implements Flyable, Trackable {
    @Override
    public void fly() { System.out.println("Drone hovering 🚁"); }

    @Override
    public void getLocation() {
        System.out.println("Location: " + Trackable.gpsFormat(40.7128, -74.0060));
    }
}

public class InterfaceDemo {
    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();    // Duck flies! 🦆
        duck.swim();   // Duck swims!
        duck.land();   // Landing safely (default method)

        // Interface as type — polymorphism
        Flyable flyer = new Drone();
        flyer.fly();   // Drone hovering 🚁
        flyer.land();  // Landing safely

        Drone drone = new Drone();
        drone.getLocation(); // Location: (40.7128, -74.0060)
    }
}`
      },
      {
        title: "Abstract Class vs Interface — When to Use Which",
        language: "java",
        content: `/*
 * ┌─────────────────────┬──────────────────┬──────────────────┐
 * │     Feature         │  Abstract Class  │    Interface     │
 * ├─────────────────────┼──────────────────┼──────────────────┤
 * │ Inheritance         │  Single only     │  Multiple OK     │
 * │ Fields              │  Any type        │  public static   │
 * │                     │                  │  final only      │
 * │ Constructors        │  Yes             │  No              │
 * │ Access modifiers    │  Any             │  public only     │
 * │ Methods             │  Abstract +      │  Abstract +      │
 * │                     │  concrete        │  default + static│
 * │ Speed               │  Slightly faster │  Slightly slower │
 * │ Use when            │  Related classes │  Unrelated       │
 * │                     │  share code      │  classes share   │
 * │                     │                  │  capability      │
 * └─────────────────────┴──────────────────┴──────────────────┘
 *
 * RULE OF THUMB:
 * - Use INTERFACE for: "can do" relationships (Comparable, Serializable)
 * - Use ABSTRACT CLASS for: "is a" with shared state/behavior
 * - Use BOTH: abstract class implements interface for hybrid approach
 */

// Hybrid approach — best of both worlds
interface Printable {
    void print();
}

abstract class Document implements Printable {
    String title;
    Document(String title) { this.title = title; }
    abstract String getContent();

    @Override
    public void print() {
        System.out.println("=== " + title + " ===");
        System.out.println(getContent());
    }
}

class PDFDocument extends Document {
    String text;
    PDFDocument(String title, String text) { super(title); this.text = text; }
    @Override String getContent() { return "[PDF] " + text; }
}

class SpreadsheetDocument extends Document {
    int rows, cols;
    SpreadsheetDocument(String title, int r, int c) { super(title); rows = r; cols = c; }
    @Override String getContent() { return "[Spreadsheet] " + rows + "x" + cols; }
}`
      }
    ],
    tip: "Since Java 8, interfaces are much more powerful with default methods. Many new designs use interfaces exclusively."
  },
  {
    id: "oop-static",
    title: "Static Members & Methods",
    difficulty: "Easy",
    theory: [
      "**Static** members belong to the **class itself**, not to any specific instance — shared across all objects",
      "**Static field:** one copy exists for the entire class, regardless of how many objects are created",
      "**Static method:** can be called without creating an object. Can only access other static members directly",
      "**Static block:** runs once when the class is first loaded into memory — used for complex static initialization",
      "Static methods CANNOT access instance fields/methods directly — they don't have a `this` reference",
      "Instance methods CAN access static members — static belongs to the class, which is always available",
      "Common uses: utility methods (Math.max), factory methods, counters, constants, singleton pattern",
      "**static final** = constant. Convention: `UPPER_SNAKE_CASE` (e.g., `MAX_SIZE`, `PI`)"
    ],
    code: [
      {
        title: "Static Fields, Methods & Blocks",
        language: "java",
        content: `public class Counter {
    // Static field — shared across ALL instances
    private static int totalCount = 0;

    // Instance field — unique to each object
    private int id;
    private String name;

    // Static constant
    public static final int MAX_COUNT = 1000;

    // Static block — runs once when class loads
    static {
        System.out.println("Counter class loaded!");
        // Can do complex static initialization here
    }

    public Counter(String name) {
        if (totalCount >= MAX_COUNT) throw new RuntimeException("Max reached");
        totalCount++;           // shared counter
        this.id = totalCount;   // unique ID
        this.name = name;
    }

    // Static method — access via class name
    public static int getTotalCount() {
        // return name; // ❌ ERROR — can't access instance field
        return totalCount; // ✅ can access static field
    }

    // Instance method — can access both
    public String getInfo() {
        return "ID: " + id + ", Name: " + name + " (Total: " + totalCount + ")";
    }

    public static void main(String[] args) {
        System.out.println(Counter.getTotalCount()); // 0

        Counter c1 = new Counter("Alice");
        Counter c2 = new Counter("Bob");
        Counter c3 = new Counter("Charlie");

        System.out.println(Counter.getTotalCount()); // 3
        System.out.println(c1.getInfo()); // ID: 1, Name: Alice (Total: 3)
        System.out.println(c2.getInfo()); // ID: 2, Name: Bob (Total: 3)
    }
}`
      },
      {
        title: "Static Utility Class — Real-World Pattern",
        language: "java",
        content: `// Utility class — all static, cannot be instantiated
public final class StringUtils {
    // Private constructor prevents instantiation
    private StringUtils() {
        throw new AssertionError("Utility class");
    }

    public static boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static String capitalize(String s) {
        if (isEmpty(s)) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    public static String repeat(String s, int times) {
        return s.repeat(times); // Java 11+
    }

    public static String reverse(String s) {
        return new StringBuilder(s).reverse().toString();
    }

    public static void main(String[] args) {
        // Called via class name — no object needed
        System.out.println(StringUtils.isEmpty(""));        // true
        System.out.println(StringUtils.capitalize("hello")); // Hello
        System.out.println(StringUtils.reverse("Java"));     // avaJ
    }
}`
      }
    ],
    note: "The **Math** class in Java is a perfect example of a utility class — all methods are static: `Math.max()`, `Math.sqrt()`, `Math.PI`."
  },
  {
    id: "oop-inner",
    title: "Inner & Anonymous Classes",
    difficulty: "Medium",
    theory: [
      "Java supports **four types** of nested classes, each with different use cases:",
      "**Inner class (non-static):** declared inside another class. Has access to outer class's private members including `this`",
      "**Static nested class:** declared with `static`. Does NOT need an outer instance. Can only access outer's static members",
      "**Local class:** defined inside a method. Can access method's effectively final variables",
      "**Anonymous class:** a class without a name, defined inline. Used to implement interfaces/abstract classes on the spot",
      "Inner classes are useful for: iterators, event handlers, helper objects that need outer class access",
      "Since Java 8, **lambdas** replace most anonymous class usage for functional interfaces (single method)",
      "Anonymous classes are still needed when: you need to implement multiple methods, or override methods of a concrete class"
    ],
    code: [
      {
        title: "Inner Class & Static Nested Class",
        language: "java",
        content: `public class OuterClass {
    private int x = 10;
    private static int staticVal = 100;

    // Inner class — has access to outer's private members
    class Inner {
        void show() {
            System.out.println("Outer x = " + x);           // ✅ can access
            System.out.println("Outer static = " + staticVal); // ✅ can access
        }
    }

    // Static nested class — no access to instance members
    static class StaticNested {
        void show() {
            // System.out.println("x = " + x); // ❌ can't access instance
            System.out.println("Static val = " + staticVal);  // ✅ static OK
        }
    }

    public static void main(String[] args) {
        // Inner class — needs outer instance
        OuterClass outer = new OuterClass();
        Inner inner = outer.new Inner();
        inner.show();

        // Static nested — no outer instance needed
        StaticNested nested = new StaticNested();
        nested.show();
    }
}`
      },
      {
        title: "Anonymous Classes & Lambda Replacement",
        language: "java",
        content: `import java.util.*;

public class AnonymousDemo {
    // Functional interface (single abstract method)
    interface Greeting {
        void greet(String name);
    }

    public static void main(String[] args) {
        // ❌ Verbose — anonymous class
        Greeting oldWay = new Greeting() {
            @Override
            public void greet(String name) {
                System.out.println("Hello, " + name + "!");
            }
        };
        oldWay.greet("Alice");

        // ✅ Clean — lambda (Java 8+)
        Greeting newWay = name -> System.out.println("Hello, " + name + "!");
        newWay.greet("Bob");

        // Anonymous class still useful for multi-method interfaces
        List<String> names = new ArrayList<>(Arrays.asList("Charlie", "Alice", "Bob"));

        // Lambda for Comparator (single method)
        names.sort((a, b) -> a.length() - b.length());
        System.out.println(names); // [Bob, Alice, Charlie]

        // Anonymous class for complex behavior
        Thread thread = new Thread() {
            @Override
            public void run() {
                System.out.println("Running in: " + getName());
            }
        };
        thread.start();
    }
}`
      }
    ],
    tip: "If an anonymous class implements a **functional interface** (one method), replace it with a **lambda** for cleaner code."
  },
  {
    id: "oop-enums",
    title: "Enums & Annotations",
    difficulty: "Medium",
    theory: [
      "**Enums** represent a fixed set of named constants — type-safe alternative to int/String constants",
      "Enums in Java are much more powerful than in other languages — they can have **fields, methods, constructors**",
      "Each enum constant is an **instance** of the enum class — created once when the class loads",
      "Enum constructors are always **private** (even if you don't specify) — can't create new instances",
      "Built-in methods: `values()` (all constants), `valueOf(String)` (by name), `ordinal()` (position), `name()` (string name)",
      "Enums can implement interfaces — useful for strategy pattern",
      "Enums are the **best way to implement Singleton** in Java — thread-safe, serialization-safe",
      "**Annotations** are metadata tags that provide info to the compiler or runtime: `@Override`, `@Deprecated`, `@SuppressWarnings`",
      "Custom annotations are declared with `@interface` — commonly used in frameworks like Spring and JUnit"
    ],
    code: [
      {
        title: "Enum with Fields, Methods & Constructor",
        language: "java",
        content: `enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6),
    EARTH(5.976e+24, 6.37814e6),
    MARS(6.421e+23, 3.3972e6);

    // Fields
    private final double mass;    // in kg
    private final double radius;  // in meters
    static final double G = 6.67300E-11;

    // Constructor (always private)
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    // Methods
    double surfaceGravity() {
        return G * mass / (radius * radius);
    }

    double surfaceWeight(double otherMass) {
        return otherMass * surfaceGravity();
    }
}

public class EnumDemo {
    public static void main(String[] args) {
        // Iterate all enum values
        for (Planet p : Planet.values()) {
            System.out.printf("Weight on %s: %.2f N%n",
                p.name(), p.surfaceWeight(75.0));
        }

        // Get by name
        Planet mars = Planet.valueOf("MARS");
        System.out.println(mars.ordinal()); // 3 (zero-based position)

        // Enum in switch
        Planet p = Planet.EARTH;
        switch (p) {
            case EARTH -> System.out.println("Home! 🌍");
            case MARS  -> System.out.println("The Red Planet");
            default    -> System.out.println("Space!");
        }
    }
}`
      },
      {
        title: "Enum Implementing Interface — Strategy Pattern",
        language: "java",
        content: `// Enum as strategy — each constant has different behavior
interface MathOperation {
    double apply(double a, double b);
}

enum Operation implements MathOperation {
    ADD      { public double apply(double a, double b) { return a + b; } },
    SUBTRACT { public double apply(double a, double b) { return a - b; } },
    MULTIPLY { public double apply(double a, double b) { return a * b; } },
    DIVIDE   { public double apply(double a, double b) {
        if (b == 0) throw new ArithmeticException("Division by zero");
        return a / b;
    }};

    // Shared method
    public String calculate(double a, double b) {
        return String.format("%.1f %s %.1f = %.1f", a, name(), b, apply(a, b));
    }
}

// Enum Singleton — best singleton in Java
enum Database {
    INSTANCE;  // only one instance ever

    private int connectionCount = 0;

    public void connect() {
        connectionCount++;
        System.out.println("Connected (#" + connectionCount + ")");
    }
}

public class EnumStrategyDemo {
    public static void main(String[] args) {
        for (Operation op : Operation.values()) {
            System.out.println(op.calculate(10, 3));
        }
        // 10.0 ADD 3.0 = 13.0
        // 10.0 SUBTRACT 3.0 = 7.0
        // 10.0 MULTIPLY 3.0 = 30.0
        // 10.0 DIVIDE 3.0 = 3.3

        // Singleton usage
        Database.INSTANCE.connect(); // Connected (#1)
        Database.INSTANCE.connect(); // Connected (#2)
    }
}`
      }
    ],
    note: "Enum-based Singleton is the **recommended** singleton approach by Joshua Bloch (Effective Java) — it handles serialization and reflection attacks automatically."
  },
  {
    id: "oop-solid",
    title: "SOLID Principles",
    difficulty: "Hard",
    theory: [
      "**SOLID** is a set of five design principles that make software more maintainable, flexible, and scalable",
      "**S — Single Responsibility Principle (SRP):** A class should have only **one reason to change**. Each class handles one job",
      "If a class does email sending AND user validation AND logging, it violates SRP — split into separate classes",
      "**O — Open/Closed Principle (OCP):** Classes should be **open for extension, closed for modification**",
      "Add new behavior by creating new classes/implementations, not by modifying existing code",
      "**L — Liskov Substitution Principle (LSP):** Subtype objects must be **substitutable** for their parent type without breaking the program",
      "If Square extends Rectangle but breaks when you set width/height independently, it violates LSP",
      "**I — Interface Segregation Principle (ISP):** No client should be forced to depend on methods it doesn't use. Prefer **many small interfaces** over one large one",
      "**D — Dependency Inversion Principle (DIP):** High-level modules should depend on **abstractions** (interfaces), not on concrete implementations",
      "DIP enables dependency injection — pass dependencies through constructors, making code testable and flexible"
    ],
    keyPoints: [
      "SRP: One class = one responsibility = one reason to change",
      "OCP: Extend behavior with new classes, don't modify existing ones",
      "LSP: Subclasses must honor the parent's contract",
      "ISP: Small focused interfaces > large bloated ones",
      "DIP: Depend on abstractions (interfaces), not concrete classes"
    ],
    code: [
      {
        title: "SRP & OCP — Single Responsibility + Open/Closed",
        language: "java",
        content: `// ❌ Violates SRP — one class doing too many things
class BadUserService {
    void createUser() { /* ... */ }
    void sendEmail() { /* ... */ }
    void generateReport() { /* ... */ }
    void logActivity() { /* ... */ }
}

// ✅ SRP — each class has one job
class UserService { void createUser() { /* ... */ } }
class EmailService { void sendEmail() { /* ... */ } }
class ReportService { void generateReport() { /* ... */ } }

// ✅ OCP — open for extension, closed for modification
interface DiscountStrategy {
    double apply(double price);
}

class NoDiscount implements DiscountStrategy {
    public double apply(double price) { return price; }
}

class PercentDiscount implements DiscountStrategy {
    private double percent;
    PercentDiscount(double p) { this.percent = p; }
    public double apply(double price) { return price * (1 - percent / 100); }
}

class BuyOneGetOneFree implements DiscountStrategy {
    public double apply(double price) { return price / 2; }
}

// Adding new discount = new class, NO changes to existing code
class OrderService {
    private DiscountStrategy strategy;
    OrderService(DiscountStrategy strategy) { this.strategy = strategy; }
    double calculateTotal(double price) { return strategy.apply(price); }
}`
      },
      {
        title: "ISP & DIP — Interface Segregation + Dependency Inversion",
        language: "java",
        content: `// ❌ Violates ISP — too many methods in one interface
interface BadWorker {
    void work();
    void eat();
    void sleep();
    void code();    // not all workers code
    void manage();  // not all workers manage
}

// ✅ ISP — small, focused interfaces
interface Workable { void work(); }
interface Eatable  { void eat(); }
interface Codable  { void code(); }
interface Manageable { void manage(); }

// Each class implements only what it needs
class Developer implements Workable, Eatable, Codable {
    public void work() { System.out.println("Working"); }
    public void eat()  { System.out.println("Eating"); }
    public void code() { System.out.println("Coding in Java"); }
}

class Manager implements Workable, Eatable, Manageable {
    public void work()   { System.out.println("Working"); }
    public void eat()    { System.out.println("Eating"); }
    public void manage() { System.out.println("Managing team"); }
}

// ✅ DIP — depend on abstraction, not concrete
interface NotificationSender {
    void send(String message);
}

class EmailSender implements NotificationSender {
    public void send(String msg) { System.out.println("Email: " + msg); }
}

class SMSSender implements NotificationSender {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}

class PushSender implements NotificationSender {
    public void send(String msg) { System.out.println("Push: " + msg); }
}

// High-level class depends on abstraction (NotificationSender)
class AlertService {
    private NotificationSender sender;  // abstraction, not concrete

    AlertService(NotificationSender sender) {
        this.sender = sender;  // injected via constructor
    }

    void alert(String msg) { sender.send("ALERT: " + msg); }
}

public class SOLIDDemo {
    public static void main(String[] args) {
        // Easy to swap implementations — that's DIP power!
        AlertService emailAlert = new AlertService(new EmailSender());
        AlertService smsAlert = new AlertService(new SMSSender());
        AlertService pushAlert = new AlertService(new PushSender());

        emailAlert.alert("Server down!"); // Email: ALERT: Server down!
        smsAlert.alert("Server down!");   // SMS: ALERT: Server down!
        pushAlert.alert("Server down!");  // Push: ALERT: Server down!
    }
}`
      }
    ],
    tip: "SOLID principles are **interview essentials** and the foundation of clean architecture. Practice applying them in every project."
  }
];

// Exception Handling content
export const javaExceptionsContent: ContentSection[] = [
  {
    id: "exc-intro",
    title: "Exception Hierarchy",
    difficulty: "Easy",
    theory: [
      "Java's exception hierarchy: **Throwable** → **Error** (unrecoverable: OutOfMemoryError, StackOverflowError) and **Exception** (recoverable).",
      "Exceptions divide into **Checked** (must handle: IOException, SQLException) and **Unchecked** (RuntimeException: NullPointerException, ArrayIndexOutOfBoundsException)."
    ],
    diagram: {
      type: "hierarchy",
      title: "Java Exception Hierarchy",
      data: [
        {
          label: "Throwable",
          color: "warning",
          children: [
            {
              label: "Error (DON'T catch!)",
              color: "accent",
              children: [
                { label: "OutOfMemoryError", color: "accent" },
                { label: "StackOverflowError", color: "accent" },
                { label: "VirtualMachineError", color: "accent" }
              ]
            },
            {
              label: "Exception",
              color: "primary",
              children: [
                {
                  label: "Checked (MUST handle)",
                  color: "info",
                  children: [
                    { label: "IOException", color: "info" },
                    { label: "SQLException", color: "info" },
                    { label: "FileNotFoundException", color: "info" }
                  ]
                },
                {
                  label: "RuntimeException (Unchecked)",
                  color: "success",
                  children: [
                    { label: "NullPointerException", color: "success" },
                    { label: "ArrayIndexOutOfBoundsException", color: "success" },
                    { label: "IllegalArgumentException", color: "success" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    code: [{
      title: "Exception Hierarchy Overview",
      language: "java",
      content: `/*
    Throwable
    ├── Error (DON'T catch!)
    │   ├── OutOfMemoryError
    │   ├── StackOverflowError
    │   └── VirtualMachineError
    └── Exception
        ├── Checked (MUST handle)
        │   ├── IOException
        │   ├── SQLException
        │   └── FileNotFoundException
        └── RuntimeException (Unchecked)
            ├── NullPointerException
            ├── ArrayIndexOutOfBoundsException
            ├── ArithmeticException
            └── IllegalArgumentException
*/`
    }]
  },
  {
    id: "exc-trycatch",
    title: "Try-Catch-Finally",
    difficulty: "Easy",
    theory: ["The `try` block contains risky code. `catch` handles specific exceptions. `finally` always executes (cleanup). Multi-catch (Java 7+) handles multiple exception types in one catch."],
    code: [{
      title: "Try-Catch-Finally & Multi-Catch",
      language: "java",
      content: `public class TryCatchDemo {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Error: " + e.getMessage());
        } finally {
            System.out.println("Always executes");
        }

        // Multi-catch (Java 7+)
        try {
            String s = null;
            s.length();
        } catch (NullPointerException | IllegalArgumentException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName());
        }
    }
}`
    }]
  },
  {
    id: "exc-checked",
    title: "Checked vs Unchecked Exceptions",
    difficulty: "Medium",
    theory: ["**Checked** must be caught or declared with `throws`. They represent expected failures. **Unchecked** (RuntimeException) represent programming bugs."],
    code: [{
      title: "Checked vs Unchecked",
      language: "java",
      content: `import java.io.*;

public class CheckedUnchecked {
    // Checked — must declare
    static String readFile(String path) throws IOException {
        return new BufferedReader(new FileReader(path)).readLine();
    }

    // Unchecked — no declaration needed
    static int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("Division by zero");
        return a / b;
    }

    public static void main(String[] args) {
        try {
            readFile("test.txt");
        } catch (IOException e) {
            System.out.println("File error: " + e.getMessage());
        }
    }
}`
    }]
  },
  {
    id: "exc-throw",
    title: "Throw & Throws",
    difficulty: "Easy",
    theory: ["`throw` creates and throws an exception. `throws` declares that a method may throw an exception."],
    code: [{
      title: "Throw & Throws",
      language: "java",
      content: `public class ThrowDemo {
    static void validateAge(int age) {
        if (age < 0 || age > 150)
            throw new IllegalArgumentException("Invalid age: " + age);
        System.out.println("Valid age: " + age);
    }

    public static void main(String[] args) {
        validateAge(25);
        try { validateAge(-5); }
        catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}`
    }]
  },
  {
    id: "exc-custom",
    title: "Custom Exception Classes",
    difficulty: "Medium",
    theory: ["Create custom exceptions by extending `Exception` (checked) or `RuntimeException` (unchecked)."],
    code: [{
      title: "Custom Exceptions",
      language: "java",
      content: `class InsufficientFundsException extends Exception {
    private double amount;
    InsufficientFundsException(double amount) {
        super("Short by: $" + String.format("%.2f", amount));
        this.amount = amount;
    }
    public double getAmount() { return amount; }
}

class Account {
    private double balance;
    Account(double balance) { this.balance = balance; }

    void withdraw(double amount) throws InsufficientFundsException {
        if (amount <= 0) throw new RuntimeException("Negative amount");
        if (amount > balance)
            throw new InsufficientFundsException(amount - balance);
        balance -= amount;
    }
}`
    }]
  },
  {
    id: "exc-trywith",
    title: "Try-With-Resources",
    difficulty: "Medium",
    theory: ["**Try-with-resources** (Java 7+) auto-closes resources implementing `AutoCloseable`. No explicit `finally` needed."],
    code: [{
      title: "Try-With-Resources",
      language: "java",
      content: `import java.io.*;

public class TryWithResources {
    public static void main(String[] args) {
        // Auto-closes reader when done
        try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Multiple resources
        try (
            BufferedReader in = new BufferedReader(new FileReader("input.txt"));
            BufferedWriter out = new BufferedWriter(new FileWriter("output.txt"))
        ) {
            String line;
            while ((line = in.readLine()) != null) {
                out.write(line);
                out.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}`
    }]
  },
  {
    id: "exc-best",
    title: "Best Practices & Anti-patterns",
    difficulty: "Medium",
    theory: [
      "**DO:** Catch specific exceptions, use try-with-resources, include meaningful messages, throw early & catch late, use custom exceptions.",
      "**DON'T:** Catch generic Exception, swallow exceptions (empty catch), use exceptions for flow control, log AND rethrow."
    ],
    code: [{
      title: "Anti-patterns to Avoid",
      language: "java",
      content: `// ❌ Empty catch (swallowing exception)
try { riskyMethod(); }
catch (Exception e) { } // NEVER!

// ❌ Exceptions for flow control
try {
    int i = 0;
    while (true) array[i++]++;
} catch (ArrayIndexOutOfBoundsException e) { }

// ✅ Specific catch + meaningful handling
try {
    connection.execute(query);
} catch (SQLException e) {
    logger.error("Query failed: " + query, e);
    throw new DataAccessException("Failed to execute", e);
}`
    }],
    warning: "Empty catch blocks silently hide bugs. **Always** handle or propagate exceptions."
  }
];

// Content map for all Java topics
export const javaContentMap: Record<string, ContentSection[]> = {
  "java-basics": javaBasicsContent,
  "java-oop": javaOOPContent,
  "java-exceptions": javaExceptionsContent,
  "java-collections": javaCollectionsContent,
  "java-generics": javaGenericsContent,
  "java-streams": javaStreamsContent,
  "java-multithreading": javaMultithreadingContent,
  "java-io": javaIOContent,
  "java-advanced": javaAdvancedContent,
  "java-jdbc": javaJDBCContent,
  "java-sql": javaSQLContent,
};
