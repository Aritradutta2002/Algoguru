import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Java Platform — global questions 1-6.
 * Reference chunk: authored first and used as the style/quality gold standard
 * for the remaining chunks.
 */
export const chunk01Platform = defineChunk({
  topic: "java-platform",
  questions: [
    {
      id: "q001",
      question: "Why is Java so popular?",
      answer:
        "Java is popular because it solved the portability problem at exactly the moment the industry needed it, and it kept evolving afterwards. Source code is compiled to platform-neutral bytecode, and a JVM on each operating system executes that bytecode. This is the **Write Once, Run Anywhere (WORA)** promise: a single build artifact runs on Windows, Linux, macOS and mainframes without recompilation.\n\n**The features interviewers expect you to name:**\n\n- **Platform independence**: Bytecode plus the JVM abstract away OS and CPU differences.\n- **Object-oriented**: Classes, encapsulation, inheritance, polymorphism and abstraction out of the box.\n- **Automatic memory management**: Garbage collection removes manual free() calls and the whole class of dangling-pointer bugs.\n- **Robust and strongly typed**: No pointer arithmetic, array bounds checking, compile-time type checks, and a bytecode verifier that inspects classes before they run.\n- **Multithreaded by design**: Thread API, plus `java.util.concurrent` for higher-level concurrency.\n- **Huge ecosystem**: The JVM is a multi-language platform (Kotlin, Scala, Groovy) with mature libraries, tooling and a 30-year support record.\n\n**Why it endures commercially:** enterprise-grade stability, a massive talent pool, and long-term backward compatibility. Code written for Java 8 still compiles on modern JDKs, which is why banks and large enterprises keep betting on it.",
      code: `public class PopularityDemo {
    public static void main(String[] args) {
        // Compiled once to bytecode, executed by any JVM
        System.out.println("Java version : " + System.getProperty("java.version"));
        System.out.println("Vendor       : " + System.getProperty("java.vendor"));
        System.out.println("OS           : " + System.getProperty("os.name"));
        System.out.println("Arch         : " + System.getProperty("os.arch"));

        // Fixed primitive sizes make behaviour identical across platforms
        System.out.println("int bytes    : " + Integer.BYTES); // always 4
        System.out.println("double bytes : " + Double.BYTES);  // always 8

        // GC means no manual memory release
        for (int i = 0; i < 1_000_000; i++) {
            String temp = "object-" + i; // unreferenced objects are collected
        }
        System.out.println("GC handled " + "1,000,000 temporary objects");
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want WORA, bytecode plus JVM, GC, strong typing and the ecosystem — not a vague 'it is easy to learn' answer.",
    },
    {
      id: "q002",
      question: "What is platform independence?",
      answer:
        "Platform independence means the same compiled program runs unchanged on different operating systems and CPU architectures. Java achieves this by inserting a virtual machine between the program and the hardware, so the program never targets a real CPU directly.\n\n**The two halves of the idea:**\n\n- **Bytecode is the portable artifact**: `javac` turns `.java` into `.class` files containing JVM instructions, not x86 or ARM machine code. One artifact, every platform.\n- **The JVM is the platform-specific half**: each OS gets its own JVM implementation that translates the same bytecode into native instructions. The non-portable part is written once per platform by the JVM vendor, not once per platform by every application developer.\n\n**Why this matters in practice:** build once on CI, deploy the identical artifact to Linux containers, Windows servers and developer laptops. Contrast this with C or C++, where the same source must be recompiled per platform and per architecture, and where the resulting binary will not run elsewhere.\n\n**Important nuance for interviews**: platform independence is not absolute. Native code via JNI, hard-coded file separators, default character encodings, OS-specific line endings, and relying on undocumented JVM details can all break portability. The fixed sizes of Java primitives — `int` is always 32 bits — remove a whole class of portability bugs that C programmers fight with.",
      code: `// Written once, compiled once: ArchitectureNeutral.java -> ArchitectureNeutral.class
public class ArchitectureNeutral {
    public static void main(String[] args) {
        // Primitive sizes are fixed by the language spec, not the platform
        System.out.println("int    bits: " + (Integer.SIZE));   // 32 everywhere
        System.out.println("char   bits: " + (Character.SIZE)); // 16 everywhere

        // Same bytecode, different JVM per OS
        System.out.println("Running on  : " + System.getProperty("os.name"));

        // Watch out: this IS platform dependent
        System.out.println("File sep    : " + java.io.File.separator);
        System.out.println("Line sep    : " + System.lineSeparator().length());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Bytecode is portable, the JVM is written per platform — and JNI, file separators and default charsets are the classic portability leaks.",
    },
    {
      id: "q003",
      question: "What is bytecode?",
      answer:
        "Bytecode is the intermediate, platform-independent instruction set produced by the Java compiler and consumed by the JVM. It sits deliberately between human-readable source and machine-specific native code.\n\n**What a .class file actually contains**: a constant pool of literals and references, field and method metadata (including descriptors and access flags), and the opcodes themselves. A typical `iadd` or `invokevirtual` instruction works on an operand stack rather than on named CPU registers, which is why bytecode is CPU-agnostic.\n\n**The execution pipeline:**\n\n1. `javac` compiles `.java` source into `.class` bytecode.\n2. The classloader loads the class into the method area.\n3. The bytecode verifier statically proves the code is safe — no illegal jumps, no type confusion, no stack mismanagement.\n4. The interpreter executes instructions one at a time.\n5. The JIT compiler profiles hot methods and recompiles them to native code, so long-running programs approach native performance.\n\n**Why the extra layer is worth it**: portability, a verifiable security boundary, and adaptive optimisation that a static ahead-of-time compiler cannot do (speculative inlining, escape analysis, on-stack replacement). You can inspect your own bytecode with `javap -c ClassName` — a great answer when asked how you would debug an unexpected overload resolution.",
      code: `public class BytecodeDemo {
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(2, 3);
        System.out.println("Result: " + result);
    }
}
/*
 Compile: javac BytecodeDemo.java   -> BytecodeDemo.class
 Inspect: javap -c BytecodeDemo
   public static int add(int, int);
      0: iload_0        load first parameter onto operand stack
      1: iload_1        load second parameter
      2: iadd           pop two, push sum
      3: ireturn        return int
*/
// The same .class runs on any JVM: Windows, Linux, macOS, ARM, x86.`,
      codeLanguage: "java",
      explanation:
        "Name the operand-stack model, the verify-then-interpret-then-JIT pipeline, and mention javap -c to show hands-on familiarity.",
    },
    {
      id: "q004",
      question: "Compare JDK vs JVM vs JRE",
      answer:
        "These three are nested layers of the Java platform. The relationship is **JDK ⊃ JRE ⊃ JVM**, and interviewers ask this to check you know which layer is missing when a build or a run fails.\n\n**JVM (Java Virtual Machine)** — the execution engine. It is platform specific (a Windows JVM is not a Linux JVM) and is responsible for class loading, bytecode verification, memory management across heap and stacks, garbage collection, JIT compilation and thread scheduling. A JVM alone is not enough to run a program because it ships no standard library.\n\n**JRE (Runtime Environment)** — JVM plus the core class libraries (`java.lang`, `java.util`, `java.io`, and so on) needed to **run** compiled Java applications. It has no compiler, so `javac` is unavailable inside a bare JRE.\n\n**JDK (Development Kit)** — JRE plus the development tools required to **build**: `javac`, `jar`, `javadoc`, `javap`, `jdb`, `jlink` and `jpackage`.\n\n**Practical diagnosis**: `'javac' is not recognized` means PATH points at a JRE or at nothing — you installed the runtime, not the kit. `ClassNotFoundException` or `NoClassDefFoundError` is a classpath or module-path problem at run time, so it is a JRE-level lookup failure rather than a missing JDK. Historically you installed a JRE separately; since Java 11 Oracle stopped shipping a standalone JRE at all, so you install a JDK and use `jlink` to build a trimmed runtime image when you need one.",
      code: `public class PlatformLayers {
    public static void main(String[] args) {
        // Development flow requires the JDK anyway:
        //   javac PlatformLayers.java   -> PlatformLayers.class
        //   java  PlatformLayers        -> JVM loads and executes main

        // JDK = JRE + javac, jar, javadoc, javap, jdb, jlink
        // JRE = JVM + core libraries (java.lang, java.util, ...)
        // JVM = class loader + verifier + interpreter + JIT + GC

        System.out.println("Runtime : " + System.getProperty("java.runtime.name"));
        System.out.println("Version : " + System.getProperty("java.version"));
        System.out.println("Home    : " + System.getProperty("java.home"));
        System.out.println("Boot CL : " + Object.class.getClassLoader()); // null
    }
}`,
      codeLanguage: "java",
      explanation:
        "Nesting is JDK over JRE over JVM: map javac-not-found to a missing JDK and ClassNotFoundException to a classpath problem at run time.",
    },
    {
      id: "q005",
      question: "What are the important differences between C++ and Java?",
      answer:
        "C++ and Java look similar syntactically but make opposite trade-offs: C++ gives the programmer full control with manual lifetime management, while Java trades some control for safety, portability and a managed runtime.\n\n**Memory management**: Java garbage collects; C++ requires `new`/`delete` or RAII with smart pointers. This is the single biggest source of bugs in C++ that Java removes.\n\n**Pointers and memory safety**: C++ has raw pointers and pointer arithmetic; Java has references only, with no arithmetic, plus array bounds checking and no buffer overrun into adjacent object state.\n\n**Compilation and execution**: C++ compiles straight to native machine code per platform. Java compiles to bytecode executed by a JVM, which is why Java is portable and C++ typically is not.\n\n**Multiple inheritance**: C++ permits multiple class inheritance with the diamond problem solved via virtual inheritance. Java allows single class inheritance plus multiple interface implementation.\n\n**Platform-specific features**: C++ has preprocessor macros, templates with non-type parameters, `goto`, operator overloading, structs and unions. Java deliberately omits the preprocessor, operator overloading and `goto`.\n\n**Object model**: C++ supports both stack-allocated and heap-allocated objects and non-object-oriented code. Java is almost fully object-oriented — everything except primitives lives in a class — and all objects are heap allocated.\n\n**Defaults and determinism**: Java initialises fields to zero values and leaves locals uninitialised-but-checked; C++ leaves many variables indeterminate. C++ offers deterministic destruction (RAII), which Java approximates with `try`-with-resources rather than guaranteed finalisation.",
      code: `// C++ style: manual, deterministic lifetime
//   int* p = new int[10];
//   std::unique_ptr<int[]> safe(new int[10]); // RAII
//   delete[] p;                                // easy to forget

public class JavaVsCpp {
    public static void main(String[] args) {
        // No manual delete anywhere — GC reclaims unreachable objects
        int[] values = new int[10];       // bounds-checked, heap allocated
        values[9] = 42;
        // values[10] = 1;                // throws ArrayIndexOutOfBoundsException

        // No pointer arithmetic: references only
        JavaVsCpp ref = new JavaVsCpp();
        System.out.println(ref);          // identity, not an address

        // No preprocessor, no operator overloading, no goto.
        // try-with-resources replaces deterministic destructors.
        try (var reader = new java.io.StringReader("data")) {
            System.out.println("read: " + (char) reader.read());
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Contrast managed GC and no pointer arithmetic against RAII and raw pointers, then mention single inheritance plus interfaces.",
    },
    {
      id: "q006",
      question: "What is the role for a classloader in Java?",
      answer:
        "A classloader is the component that finds a class's compiled bytes at run time and defines them inside the JVM, producing the `Class` object that every static initialiser and instance depends on. Loading is lazy — a class is materialised the first time it is actively used, not when the program starts.\n\n**The three built-in loaders, arranged in a hierarchy:**\n\n- **Bootstrap classloader**: written in native code, loads the core platform (`java.lang`, `java.util`). It returns `null` from `getClassLoader()`, which is why `String.class.getClassLoader()` prints null.\n- **Platform classloader** (the extension loader before Java 9): loads JDK-supplied modules that are not part of `java.base`.\n- **Application classloader**: loads your classes plus everything on the classpath, and is the parent of most custom loaders.\n\n**The parent delegation model**: a loader first asks its parent for the class. Only if the parent cannot supply it does the child attempt the load itself. This guarantees that `java.lang.String` always resolves to the trusted bootstrap version and cannot be spoofed by a class of the same name on the application classpath — a real security property.\n\n**What a classloader does, step by step**: loading (read the bytes), linking (verify bytecode, prepare static fields, resolve symbolic references), and initialisation (run static initialisers exactly once, in a thread-safe manner).\n\n**Why interviewers care**: duplicate classes loaded by different loaders are different types, so a `ClassCastException` can occur even when the fully-qualified names match — the classic cause of confusing plugin and application-server errors.",
      code: `public class ClassLoaderDemo {
    public static void main(String[] args) throws Exception {
        // Bootstrap loader is native; it reports null
        System.out.println("String  loader: " + String.class.getClassLoader());
        System.out.println("int[]   loader: " + int[].class.getClassLoader());

        // Application loader: your own classes
        Class<?> me = ClassLoaderDemo.class;
        System.out.println("Demo    loader: " + me.getClassLoader());

        ClassLoader child = me.getClassLoader();
        while (child != null) {
            System.out.println("  in chain: " + child);
            child = child.getParent(); // parent delegation chain
        }

        // Same name, two loaders -> two distinct Class objects -> CCE risk
        System.out.println("Platform: " + ClassLoader.getPlatformClassLoader());
        System.out.println("App     : " + ClassLoader.getSystemClassLoader());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Cover loading, linking and initialisation plus parent delegation, and note that identical class names from different loaders are different types.",
    },
  ],
  meta: {
    q001: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["platform", "wora", "jvm"],
      relatedQuestionIds: ["q002", "q003", "q004"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q002: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["platform", "bytecode", "portability"],
      relatedQuestionIds: ["q003", "q004"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q003: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["bytecode", "jvm", "jit"],
      relatedQuestionIds: ["q002", "q006"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q004: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["jdk", "jre", "jvm", "tooling"],
      relatedQuestionIds: ["q003", "q006"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q005: {
      difficulty: "medium",
      priority: "high",
      tags: ["comparison", "cpp", "memory"],
      relatedQuestionIds: ["q001", "q002"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
    q006: {
      difficulty: "medium",
      priority: "high",
      tags: ["classloader", "jvm", "delegation"],
      relatedQuestionIds: ["q003", "q004"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+", "Java 9+"],
    },
  },
});