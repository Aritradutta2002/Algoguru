// Enhanced Core Java Interview Questions
// Comprehensive improvements: Better answers, production code, visualizations

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  code?: string;
  codeLanguage?: string;
  explanation: string;
  visualization?: string;
  followUpQuestions?: string[];
}

export interface InterviewTopic {
  id: string;
  title: string;
  icon: string;
  questions: InterviewQuestion[];
}

// ============================================================================
// ENHANCED SECTIONS - Production-Ready with Visualizations
// ============================================================================

export const coreJavaInterviewTopics: InterviewTopic[] = [
  {
    id: "basics",
    title: "Java Basics",
    icon: "☕",
    questions: [
      {
        id: "b1",
        question: "What is Java? What are its main features?",
        answer: `Java is a high-level, object-oriented programming language designed for platform independence through the "Write Once, Run Anywhere" (WORA) principle.

**CORE ARCHITECTURE**
Java source (.java) → Compiler (javac) → Bytecode (.class) → JVM → Native execution
The JVM acts as an abstraction layer, making bytecode executable on any platform with a compatible JVM.

**KEY FEATURES**

1. **Platform Independence** - Bytecode runs on any JVM-equipped system
2. **Object-Oriented** - Everything is an object (except primitives). Supports encapsulation, inheritance, polymorphism, abstraction
3. **Automatic Memory Management** - Garbage collector handles deallocation, preventing memory leaks
4. **Strong Type System** - Compile-time type checking catches errors early
5. **Multithreading** - Built-in support via Thread class and java.util.concurrent
6. **Security** - Bytecode verification, classloader sandbox, no pointer arithmetic
7. **Rich API** - Extensive standard library for I/O, networking, collections, concurrency
8. **High Performance** - JIT compiler optimizes hot code paths to native instructions

**REAL-WORLD APPLICATIONS**
• Enterprise systems (Spring, Jakarta EE)
• Android applications (Android SDK)
• Big data processing (Hadoop, Spark)
• Financial services (trading platforms)
• Web services and microservices`,

        code: `/**
 * Demonstrates Java's platform independence and execution model
 */
public class JavaFeatures {
    public static void main(String[] args) {
        // 1. Platform Independence - Same bytecode runs everywhere
        System.out.println("=== Platform Information ===");
        System.out.println("Java Version: " + System.getProperty("java.version"));
        System.out.println("OS: " + System.getProperty("os.name"));
        System.out.println("Architecture: " + System.getProperty("os.arch"));
        System.out.println("JVM Vendor: " + System.getProperty("java.vm.vendor"));
        
        // 2. Object-Oriented - Everything is an object (except primitives)
        String message = "Hello, Java!"; // String is an object
        Integer count = 42;               // Wrapper for primitive int
        
        // 3. Strong Typing - Compile-time type safety
        // int x = "text";  // Compilation error - type mismatch
        
        // 4. Automatic Memory Management
        createObjects(); // Objects eligible for GC after method returns
        
        // 5. Multithreading Support
        Thread thread = new Thread(() -> 
            System.out.println("Running on: " + Thread.currentThread().getName())
        );
        thread.start();
        
        // 6. Rich Standard Library
        java.util.List<String> list = java.util.Arrays.asList("Java", "Python", "C++");
        list.stream()
            .filter(lang -> lang.startsWith("J"))
            .forEach(System.out::println);
    }
    
    private static void createObjects() {
        // These objects become eligible for GC after method completes
        for (int i = 0; i < 1000; i++) {
            String temp = "Object " + i;
        }
        // No manual memory deallocation needed
    }
}

// Compilation and Execution:
// javac JavaFeatures.java  → Produces JavaFeatures.class (bytecode)
// java JavaFeatures        → JVM loads and executes bytecode`,

        codeLanguage: "java",
        
        visualization: `┌─────────────────────────────────────────────────────────────┐
│              JAVA EXECUTION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Source Code (.java)                                        │
│       │                                                     │
│       │ javac (Compiler)                                    │
│       ▼                                                     │
│  Bytecode (.class)  ◄──── Platform Independent             │
│       │                                                     │
│       │ Loaded by ClassLoader                               │
│       ▼                                                     │
│  ┌─────────────────────────────────┐                       │
│  │         JVM (Runtime)           │                       │
│  ├─────────────────────────────────┤                       │
│  │  • Bytecode Verifier            │                       │
│  │  • Interpreter                  │                       │
│  │  • JIT Compiler ───────► Native Code                    │
│  │  • Garbage Collector            │                       │
│  │  • Security Manager             │                       │
│  └─────────────────────────────────┘                       │
│       │                                                     │
│       ▼                                                     │
│  Operating System (Windows/Linux/macOS)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘`,

        explanation: "Java = Language + Platform + Ecosystem. The JVM abstracts OS differences. JIT compiler converts hot bytecode paths to native code for performance. Key interview insight: Java trades startup cost for runtime optimization.",
        
        followUpQuestions: [
          "How does JIT compilation improve performance?",
          "What's the difference between Java and JavaScript?",
          "Why can't Java be 100% platform independent? (Hardware-dependent features exist)"
        ]
      },
      
      {
        id: "b2",
        question: "Difference between JDK, JRE, and JVM?",
        answer: `These three components form the Java platform stack, each serving a distinct purpose.

**JVM (Java Virtual Machine)** - The Execution Engine
• Executes Java bytecode (.class files)
• Platform-specific (Windows JVM ≠ Linux JVM)
• Core responsibilities:
  - Class loading and bytecode verification
  - Memory management (heap/stack allocation)
  - Garbage collection
  - JIT compilation (bytecode → native code)
  - Thread scheduling

**JRE (Java Runtime Environment)** - JVM + Libraries
• Everything needed to RUN Java applications
• Contains: JVM + core libraries (rt.jar in Java 8, modules in Java 9+)
• Does NOT include development tools (no javac compiler)
• Deprecated as standalone download since Java 11 (now bundled in JDK)

**JDK (Java Development Kit)** - JRE + Development Tools
• Everything needed to DEVELOP and run Java applications
• Includes:
  - javac (compiler)
  - java (launcher)
  - jar (archiver)
  - javadoc (documentation generator)
  - jdb (debugger)
  - javap (disassembler)
  - jconsole, jvisualvm (monitoring tools)

**RELATIONSHIP**: JDK ⊃ JRE ⊃ JVM

**PRACTICAL IMPLICATIONS**
• End users need only JRE (just run applications)
• Developers need JDK (compile and run)
• Servers typically use JRE (production deployments)
• Since Java 11, Oracle only distributes JDK; use jlink to create custom runtime images`,

        code: `/**
 * Understanding JDK, JRE, JVM through practical commands
 */

// ===== DEVELOPMENT WORKFLOW =====

// Step 1: Write source code (requires text editor only)
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}

// Step 2: Compile source to bytecode (requires JDK - uses javac)
// Command: javac HelloWorld.java
// Output: HelloWorld.class (bytecode)

// Step 3: Execute bytecode (requires JRE - uses java launcher + JVM)
// Command: java HelloWorld
// JVM loads class, verifies bytecode, executes main()

// ===== CHECKING YOUR INSTALLATION =====

public class CheckJavaInstallation {
    public static void main(String[] args) {
        // Check JRE/JVM info (available with both JRE and JDK)
        System.out.println("=== JVM Information ===");
        System.out.println("Java Version: " + 
            System.getProperty("java.version"));
        System.out.println("Java Home: " + 
            System.getProperty("java.home"));
        System.out.println("JVM Name: " + 
            System.getProperty("java.vm.name"));
        System.out.println("JVM Vendor: " + 
            System.getProperty("java.vm.vendor"));
        
        // Runtime information
        Runtime runtime = Runtime.getRuntime();
        System.out.println("\n=== Runtime Information ===");
        System.out.println("Available Processors: " + 
            runtime.availableProcessors());
        System.out.println("Max Memory (MB): " + 
            runtime.maxMemory() / (1024 * 1024));
        System.out.println("Total Memory (MB): " + 
            runtime.totalMemory() / (1024 * 1024));
        System.out.println("Free Memory (MB): " + 
            runtime.freeMemory() / (1024 * 1024));
    }
}

// Terminal commands to check installation:
// - Check if JDK installed: javac -version
// - Check if JRE/JVM installed: java -version
// - Find Java home: echo %JAVA_HOME% (Windows) or echo $JAVA_HOME (Unix)`,

        codeLanguage: "java",
        
        visualization: `┌──────────────────────────────────────────────────────────────────┐
│                     JDK (Java Development Kit)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              JRE (Java Runtime Environment)                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │           JVM (Java Virtual Machine)                 │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │ • Class Loader                                 │  │  │  │
│  │  │  │ • Bytecode Verifier                            │  │  │  │
│  │  │  │ • Interpreter                                  │  │  │  │
│  │  │  │ • JIT Compiler                                 │  │  │  │
│  │  │  │ • Garbage Collector                            │  │  │  │
│  │  │  │ • Memory Manager (Heap/Stack)                  │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  │                                                       │  │  │
│  │  │  Core Libraries:                                      │  │  │
│  │  │  • java.lang.* (Object, String, System)              │  │  │
│  │  │  • java.util.* (Collections, Date)                   │  │  │
│  │  │  • java.io.* (Input/Output streams)                  │  │  │
│  │  │  • java.net.* (Networking)                           │  │  │
│  │  └───────────────────────────────────────────────────────┘  │
│  │                                                              │
│  └──────────────────────────────────────────────────────────────┘
│                                                                  │
│  Development Tools:                                              │
│  • javac (Compiler: .java → .class)                             │
│  • jar (Archive creator/extractor)                              │
│  • javadoc (Documentation generator)                            │
│  • jdb (Debugger)                                               │
│  • javap (Class file disassembler)                              │
│  • jconsole, jvisualvm (Monitoring)                             │
│  • keytool, jarsigner (Security)                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Analogy:
JVM  = Car Engine (executes the program)
JRE  = Complete Car (engine + fuel + systems to run)
JDK  = Car + Mechanic Tools (everything to build and run)`,

        explanation: "Key interview point: JVM is abstract specification; HotSpot, OpenJ9, GraalVM are implementations. 'javac not recognized' → PATH/JDK issue. ClassNotFoundException → classpath/module-path issue.",
        
        followUpQuestions: [
          "What are different JVM implementations? (HotSpot, OpenJ9, GraalVM)",
          "Why was standalone JRE discontinued after Java 11?",
          "How does jlink create custom runtime images?"
        ]
      },
      
      {
        id: "b3",
        question: "What is bytecode in Java?",
        answer: `Bytecode is the intermediate, platform-independent instruction set that bridges Java source code and machine code. It's the foundation of Java's WORA (Write Once, Run Anywhere) philosophy.

**WHAT IS BYTECODE?**
• Compiled output from javac compiler (.class files)
• Not human-readable, not CPU-specific
• Consists of 1-byte opcodes (hence "bytecode") + operands
• Example opcodes: iconst_1 (push int 1), iadd (add two ints), invokevirtual (call method)

**EXECUTION PIPELINE**

1. **Compilation**: javac translates .java → .class (bytecode)
2. **Class Loading**: JVM's ClassLoader loads .class into Method Area
3. **Verification**: Bytecode Verifier ensures safety (no stack overflow, type safety)
4. **Interpretation**: Interpreter executes bytecode line-by-line (slow)
5. **JIT Compilation**: HotSpot identifies "hot" code paths → compiles to native machine code (fast)

**WHY BYTECODE EXISTS?**

**Portability**: Same .class file runs on Windows, Linux, macOS - only JVM differs
**Security**: Verification before execution prevents malicious code
**Optimization**: JVM can profile at runtime and optimize based on actual usage patterns
**Dynamic Loading**: Classes loaded on-demand, enabling modularity

**TRADE-OFFS**
❌ Startup cost (interpretation + verification)
✅ Runtime performance (JIT-compiled code rivals native)
❌ Extra layer between source and hardware
✅ Platform independence without recompilation`,

        code: `/**
 * Understanding bytecode through inspection and execution
 */

// Source Code
public class BytecodeExample {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        int result = add(5, 10);
        System.out.println("Result: " + result);
    }
}

// ===== COMPILATION =====
// Command: javac BytecodeExample.java
// Output: BytecodeExample.class (bytecode file)

// ===== INSPECT BYTECODE =====
// Command: javap -c BytecodeExample
// Output shows bytecode instructions:

/*
Compiled from "BytecodeExample.java"
public class BytecodeExample {
  
  public static int add(int, int);
    Code:
       0: iload_0          // Load first parameter (a) onto stack
       1: iload_1          // Load second parameter (b) onto stack
       2: iadd             // Pop two values, add them, push result
       3: ireturn          // Return integer result
  
  public static void main(java.lang.String[]);
    Code:
       0: iconst_5         // Push constant 5 onto stack
       1: bipush 10        // Push constant 10 onto stack
       3: invokestatic  #2 // Call add() method
       6: istore_1         // Store result in local variable
       7: getstatic     #3 // Get System.out field
      10: new           #4 // Create StringBuilder
      13: dup              // Duplicate reference
      14: invokespecial #5 // Call StringBuilder constructor
      17: ldc           #6 // Load constant "Result: "
      19: invokevirtual #7 // Append to StringBuilder
      22: iload_1          // Load result variable
      23: invokevirtual #8 // Append integer
      26: invokevirtual #9 // Call toString()
      29: invokevirtual #10 // Call println()
      32: return           // Return void
}
*/

/**
 * Advanced: Understanding bytecode structure
 */
public class BytecodeStructure {
    public static void main(String[] args) throws Exception {
        // Read bytecode of a class file
        String className = "BytecodeExample.class";
        java.io.InputStream is = 
            BytecodeStructure.class.getResourceAsStream("/" + className);
        
        if (is != null) {
            byte[] bytecode = is.readAllBytes();
            
            // Every .class file starts with magic number: 0xCAFEBABE
            System.out.printf("Magic Number: 0x%02X%02X%02X%02X%n", 
                bytecode[0], bytecode[1], bytecode[2], bytecode[3]);
            // Output: Magic Number: 0xCAFEBABE
            
            // Next 4 bytes: minor and major version
            int minorVersion = ((bytecode[4] & 0xFF) << 8) | (bytecode[5] & 0xFF);
            int majorVersion = ((bytecode[6] & 0xFF) << 8) | (bytecode[7] & 0xFF);
            System.out.println("Java Version: " + majorVersion + "." + minorVersion);
            
            is.close();
        }
    }
}

// ===== BYTECODE OPTIMIZATION EXAMPLE =====
public class JITOptimization {
    // Method called frequently (hot spot) → JIT compiles to native code
    public static long fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        // First few calls: interpreted (slow)
        // After ~10,000 invocations: JIT compiles to native code (fast)
        
        long start = System.nanoTime();
        for (int i = 0; i < 100000; i++) {
            fibonacci(10);
        }
        long duration = System.nanoTime() - start;
        System.out.println("Time: " + duration / 1_000_000 + " ms");
        
        // Observe with JVM flag: -XX:+PrintCompilation
        // Shows when methods are JIT-compiled
    }
}`,

        codeLanguage: "java",
        
        visualization: `┌────────────────────────────────────────────────────────────────┐
│                  BYTECODE EXECUTION FLOW                       │
└────────────────────────────────────────────────────────────────┘

Source Code (.java)
    │
    │ javac (Compile Time)
    ▼
┌────────────────────────────────────┐
│ Bytecode (.class)                  │
│ ┌────────────────────────────────┐ │
│ │ Magic: 0xCAFEBABE              │ │
│ │ Version: Major.Minor           │ │
│ │ Constant Pool                  │ │
│ │ Access Flags                   │ │
│ │ This Class, Super Class        │ │
│ │ Interfaces                     │ │
│ │ Fields                         │ │
│ │ Methods (Bytecode)             │ │
│ │ Attributes                     │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
    │
    │ ClassLoader (Runtime)
    ▼
┌────────────────────────────────────┐
│ JVM Method Area                    │
│ • Class metadata                   │
│ • Method bytecode                  │
│ • Static variables                 │
└────────────────────────────────────┘
    │
    ├──────────────┬─────────────────┐
    │              │                 │
    ▼              ▼                 ▼
Verifier     Interpreter         JIT Compiler
    │              │                 │
    │              │ (Slow)          │ (Fast)
    │              ▼                 ▼
    │         Line-by-line      Native Machine Code
    │         execution         (Cached in Code Cache)
    │              │                 │
    └──────────────┴─────────────────┘
                   │
                   ▼
            CPU Execution

Common Bytecode Instructions:
┌─────────────┬──────────────────────────────────┐
│ Category    │ Examples                         │
├─────────────┼──────────────────────────────────┤
│ Load/Store  │ iload, istore, aload, astore     │
│ Arithmetic  │ iadd, isub, imul, idiv           │
│ Comparison  │ if_icmpeq, if_icmpne, if_icmplt  │
│ Invoke      │ invokevirtual, invokestatic      │
│ Return      │ ireturn, areturn, return         │
│ Object      │ new, newarray, instanceof        │
└─────────────┴──────────────────────────────────┘`,

        explanation: "Key insight: Bytecode verification prevents buffer overflows and type confusion attacks. JIT compilation happens at runtime based on profiling - 'hot' methods get compiled to native code. Use javap -c to inspect bytecode for learning.",
        
        followUpQuestions: [
          "What is the magic number 0xCAFEBABE and why?",
          "How does JIT decide which methods to compile?",
          "Can you run Java bytecode without source code? (Yes, that's the point!)"
        ]
      }
    ]
  }
];

export default coreJavaInterviewTopics;

      {
        id: "b6",
        question: "What are the primitive data types in Java?",
        answer: `Java defines 8 primitive types with fixed sizes across all platforms, ensuring architecture neutrality.

**NUMERIC TYPES**

**Integer Types** (signed)
• byte: 1 byte, -128 to 127
• short: 2 bytes, -32,768 to 32,767
• int: 4 bytes, -2³¹ to 2³¹-1 (default for literals)
• long: 8 bytes, -2⁶³ to 2⁶³-1 (suffix: L or l)

**Floating-Point Types** (IEEE 754)
• float: 4 bytes, ~7 decimal digits precision (suffix: f or F)
• double: 8 bytes, ~15 decimal digits precision (default for decimals)

**Other Types**
• char: 2 bytes, Unicode character (0 to 65,535), UTF-16 code unit
• boolean: true or false (JVM implementation-specific size, typically 1 byte)

**DEFAULT VALUES** (fields only, NOT local variables)
• Numeric types → 0 (byte, short, int, long, float, double)
• char → '\\u0000' (null character)
• boolean → false
• Reference types → null

**KEY POINTS**
✅ Primitives stored on stack (local) or as part of object (instance fields)
✅ Fixed size ensures portability (int is always 32 bits)
✅ Each primitive has wrapper class for object contexts (int → Integer)
❌ Local variables MUST be initialized before use (no defaults)`,

        code: `/**
 * Comprehensive demonstration of Java primitive types
 */
public class PrimitiveTypesDemo {
    
    // Instance variables get default values
    static byte defaultByte;       // 0
    static short defaultShort;     // 0
    static int defaultInt;         // 0
    static long defaultLong;       // 0L
    static float defaultFloat;     // 0.0f
    static double defaultDouble;   // 0.0
    static char defaultChar;       // '\u0000'
    static boolean defaultBoolean; // false
    
    public static void main(String[] args) {
        
        // ===== INTEGER TYPES =====
        byte age = 25;                    // Small integers
        short year = 2024;                // Moderate integers
        int population = 2_000_000_000;   // Underscores for readability (Java 7+)
        long nationalDebt = 31_000_000_000_000L; // L suffix required
        
        // Integer literals in different bases
        int decimal = 42;          // Base 10
        int hexadecimal = 0x2A;    // Base 16 (prefix: 0x)
        int octal = 052;           // Base 8  (prefix: 0)
        int binary = 0b101010;     // Base 2  (prefix: 0b, Java 7+)
        
        System.out.println("All equal: " + (decimal == hexadecimal && 
                                            hexadecimal == octal && 
                                            octal == binary)); // true
        
        // ===== FLOATING-POINT TYPES =====
        float pi = 3.14159f;           // f suffix required
        double e = 2.718281828459045;  // No suffix (default)
        
        // Scientific notation
        double avogadro = 6.022e23;    // 6.022 × 10²³
        float planck = 6.626e-34f;     // 6.626 × 10⁻³⁴
        
        // Precision differences
        float f1 = 0.1f + 0.1f + 0.1f;
        double d1 = 0.1 + 0.1 + 0.1;
        System.out.println("Float:  " + f1);  // 0.3000000119 (less precise)
        System.out.println("Double: " + d1);  // 0.30000000000000004 (more precise)
        
        // Special floating-point values
        double positiveInfinity = 1.0 / 0.0;           // Infinity
        double negativeInfinity = -1.0 / 0.0;          // -Infinity
        double notANumber = 0.0 / 0.0;                 // NaN
        System.out.println("Infinity: " + positiveInfinity);
        System.out.println("NaN: " + notANumber);
        System.out.println("NaN != NaN: " + (notANumber != notANumber)); // true!
        
        // ===== CHARACTER TYPE =====
        char letter = 'A';                 // Single quotes
        char unicode = '\u0041';           // Unicode: A
        char newline = '\n';               // Escape sequence
        char tab = '\t';                   // Tab character
        
        // Unicode supplementary characters (Java 5+)
        String emoji = "\uD83D\uDE00";     // 😀 (surrogate pair)
        System.out.println("Emoji: " + emoji);
        
        // ===== BOOLEAN TYPE =====
        boolean isJavaFun = true;
        boolean isPythonFaster = false;
        
        // Boolean operations
        boolean and = isJavaFun && isPythonFaster;  // false
        boolean or = isJavaFun || isPythonFaster;   // true
        boolean not = !isPythonFaster;              // true
        
        // ===== TYPE RANGES =====
        System.out.println("\n=== Primitive Type Ranges ===");
        System.out.println("byte:   " + Byte.MIN_VALUE + " to " + Byte.MAX_VALUE);
        System.out.println("short:  " + Short.MIN_VALUE + " to " + Short.MAX_VALUE);
        System.out.println("int:    " + Integer.MIN_VALUE + " to " + Integer.MAX_VALUE);
        System.out.println("long:   " + Long.MIN_VALUE + " to " + Long.MAX_VALUE);
        System.out.println("float:  " + Float.MIN_VALUE + " to " + Float.MAX_VALUE);
        System.out.println("double: " + Double.MIN_VALUE + " to " + Double.MAX_VALUE);
        System.out.println("char:   " + (int)Character.MIN_VALUE + " to " + (int)Character.MAX_VALUE);
        
        // ===== MEMORY SIZE =====
        System.out.println("\n=== Memory Sizes (bits) ===");
        System.out.println("byte:    " + Byte.SIZE);      // 8
        System.out.println("short:   " + Short.SIZE);     // 16
        System.out.println("int:     " + Integer.SIZE);   // 32
        System.out.println("long:    " + Long.SIZE);      // 64
        System.out.println("float:   " + Float.SIZE);     // 32
        System.out.println("double:  " + Double.SIZE);    // 64
        System.out.println("char:    " + Character.SIZE); // 16
        
        // ===== OVERFLOW BEHAVIOR =====
        byte maxByte = 127;
        maxByte++;                        // Wraps to -128 (overflow)
        System.out.println("\nByte overflow: " + maxByte);
        
        int maxInt = Integer.MAX_VALUE;
        maxInt++;                         // Wraps to Integer.MIN_VALUE
        System.out.println("Int overflow: " + maxInt);
        
        // ===== DEFAULT VALUES DEMONSTRATION =====
        System.out.println("\n=== Default Values ===");
        System.out.println("byte:    " + defaultByte);
        System.out.println("short:   " + defaultShort);
        System.out.println("int:     " + defaultInt);
        System.out.println("long:    " + defaultLong);
        System.out.println("float:   " + defaultFloat);
        System.out.println("double:  " + defaultDouble);
        System.out.println("char:    [" + defaultChar + "] (null character)");
        System.out.println("boolean: " + defaultBoolean);
        
        // ===== WRAPPER CLASSES =====
        Integer wrappedInt = Integer.valueOf(42);  // Boxing
        int unwrappedInt = wrappedInt.intValue();  // Unboxing
        
        // Auto-boxing (Java 5+)
        Integer autoBoxed = 100;           // Compiler inserts Integer.valueOf(100)
        int autoUnboxed = autoBoxed;       // Compiler inserts autoBoxed.intValue()
    }
}

/**
 * Common primitive type pitfalls and best practices
 */
class PrimitivePitfalls {
    public static void main(String[] args) {
        
        // PITFALL 1: Floating-point precision
        double a = 0.1 + 0.2;
        System.out.println("0.1 + 0.2 = " + a);  // 0.30000000000000004 (not exactly 0.3!)
        // Solution: Use BigDecimal for financial calculations
        
        // PITFALL 2: Integer division
        int result = 5 / 2;                // 2 (not 2.5)
        double result2 = 5 / 2;            // 2.0 (still integer division!)
        double result3 = 5.0 / 2;          // 2.5 (at least one operand must be double)
        double result4 = (double) 5 / 2;   // 2.5 (explicit cast)
        
        // PITFALL 3: Comparing floating-point numbers
        double x = 0.1 + 0.1 + 0.1;
        double y = 0.3;
        System.out.println("Equal? " + (x == y));  // false!
        // Solution: Use epsilon comparison
        double epsilon = 0.00001;
        System.out.println("Equal (epsilon)? " + (Math.abs(x - y) < epsilon));  // true
        
        // PITFALL 4: NaN comparisons
        double nan = Double.NaN;
        System.out.println("NaN == NaN: " + (nan == nan));      // false
        System.out.println("NaN != NaN: " + (nan != nan));      // true (!)
        // Solution: Use Double.isNaN()
        System.out.println("Is NaN: " + Double.isNaN(nan));     // true
        
        // PITFALL 5: Char arithmetic
        char c = 'A';
        c = c + 1;  // Compile error! int cannot be assigned to char
        c = (char)(c + 1);  // OK: explicit cast needed
        c++;        // OK: increment operator
        System.out.println("Next char: " + c);  // B
    }
}`,

        codeLanguage: "java",
        
        visualization: `┌────────────────────────────────────────────────────────────────┐
│              JAVA PRIMITIVE TYPES HIERARCHY                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  NUMERIC TYPES                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  INTEGER TYPES (Signed, 2's Complement)                  │  │
│  │  ┌────────┬─────────┬──────────────┬──────────────────┐  │  │
│  │  │  byte  │  short  │     int      │      long        │  │  │
│  │  │  8-bit │ 16-bit  │   32-bit     │    64-bit        │  │  │
│  │  │  -128  │ -32,768 │ -2,147,483,  │ -9,223,372,036,  │  │  │
│  │  │   to   │   to    │   648 to     │   854,775,808 to │  │  │
│  │  │  127   │ 32,767  │ 2,147,483,647│ 9,223,372,036,   │  │  │
│  │  │        │         │              │   854,775,807    │  │  │
│  │  └────────┴─────────┴──────────────┴──────────────────┘  │  │
│  │                                                           │  │
│  │  FLOATING-POINT TYPES (IEEE 754)                         │  │
│  │  ┌──────────────────────┬──────────────────────────────┐  │  │
│  │  │       float          │         double               │  │  │
│  │  │      32-bit          │         64-bit               │  │  │
│  │  │  ~7 decimal digits   │   ~15 decimal digits         │  │  │
│  │  │  ±3.4 × 10³⁸         │   ±1.7 × 10³⁰⁸               │  │  │
│  │  └──────────────────────┴──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  CHARACTER TYPE                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    char                                   │  │
│  │                   16-bit                                  │  │
│  │            Unicode (UTF-16 code unit)                     │  │
│  │              0 to 65,535 ('\u0000' to '\uFFFF')          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  BOOLEAN TYPE                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   boolean                                 │  │
│  │            true or false (no numeric value)              │  │
│  │         JVM-specific size (typically 1 byte)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

WRAPPER CLASSES (java.lang package)
┌────────────┬─────────────┐
│ Primitive  │   Wrapper   │
├────────────┼─────────────┤
│ byte       │ Byte        │
│ short      │ Short       │
│ int        │ Integer     │
│ long       │ Long        │
│ float      │ Float       │
│ double     │ Double      │
│ char       │ Character   │
│ boolean    │ Boolean     │
└────────────┴─────────────┘

MEMORY LAYOUT (Stack)
┌──────────────────────────┐
│  Local Variables         │
│  ┌────────────────────┐  │
│  │ int x = 42         │  │ ◄── 4 bytes
│  │ long y = 100L      │  │ ◄── 8 bytes
│  │ boolean flag=true  │  │ ◄── 1 byte (typically)
│  │ Object obj=new...  │  │ ◄── Reference (4 or 8 bytes)
│  └────────────────────┘  │
└──────────────────────────┘`,

        explanation: "Key interview insight: Primitives are NOT objects. They're stored directly (value), not as references. Autoboxing enables primitives in collections but adds overhead. Use primitives for performance-critical code; use wrappers for Collections/Generics.",
        
        followUpQuestions: [
          "Why doesn't Java have unsigned types like C/C++? (Java 8 added unsigned methods)",
          "What's the difference between Float.MIN_VALUE and -Float.MAX_VALUE?",
          "How does char store Unicode if it's only 16 bits? (Surrogate pairs for supplementary characters)"
        ]
      },
      
      {
        id: "c6",
        question: "How does HashMap work internally?",
        answer: `HashMap is Java's most-used Map implementation. Understanding its internals is crucial for writing efficient code and acing interviews.

**CORE DATA STRUCTURE**
HashMap uses an array of "buckets" (Node<K,V>[] table), where each bucket stores a linked list (or tree) of entries with the same hash index.

**KEY OPERATIONS**

**1. put(key, value) - Step by Step**

Step 1: **Compute hash**
\`\`\`
int hash = hash(key.hashCode());
// hash() method: (h = key.hashCode()) ^ (h >>> 16)
// This spreads high bits to low bits, reducing collisions
\`\`\`

Step 2: **Find bucket index**
\`\`\`
int index = (n - 1) & hash;  // Equivalent to hash % capacity, but faster
// Works because capacity is always power of 2
// Example: hash=13, capacity=16 → index = 15 & 13 = 13
\`\`\`

Step 3: **Handle collisions**
- If bucket is empty → create new Node, place it there
- If bucket occupied → traverse chain:
  - If key.equals(existingKey) → replace value (update)
  - If no match → append new Node to chain

Step 4: **Treeification** (Java 8+)
- If chain length > 8 (TREEIFY_THRESHOLD) AND capacity ≥ 64:
  - Convert linked list → Red-Black Tree
  - Reduces worst-case from O(n) to O(log n)
- If tree shrinks below 6 nodes (UNTREEIFY_THRESHOLD):
  - Convert back to linked list

Step 5: **Resize**
- When size > capacity × loadFactor (default: 0.75):
  - Double capacity: newCapacity = oldCapacity × 2
  - Rehash ALL entries to new buckets
  - Expensive operation - O(n)

**2. get(key) - Retrieval**
- Compute hash and bucket index (same as put)
- Traverse bucket (list or tree) using equals() to find matching key
- Return value if found, else null

**THE HASHCODE + EQUALS CONTRACT**

**Critical Rule**: If a.equals(b) → a.hashCode() == b.hashCode()
- Violating this breaks HashMap (equal keys end up in different buckets)
- Override both methods together, or neither

**PERFORMANCE CHARACTERISTICS**
- **Best case**: O(1) for get/put (no collisions)
- **Average case**: O(1) for get/put
- **Worst case without trees**: O(n) for get/put (all keys in one bucket)
- **Worst case with trees**: O(log n) for get/put (Java 8+)

**LOAD FACTOR TRADE-OFFS**
- **Low load factor (0.5)**: Less collision, more memory, frequent resizing
- **Default (0.75)**: Good balance
- **High load factor (1.0)**: More collisions, less memory, rare resizing

**NULL HANDLING**
- **One null key** allowed (stored in bucket 0)
- **Multiple null values** allowed
- Unlike Hashtable (no nulls) and ConcurrentHashMap (no nulls)`,

        code: `import java.util.*;

/**
 * Comprehensive HashMap internals demonstration
 */
public class HashMapInternals {
    
    public static void main(String[] args) {
        
        // ===== BASIC USAGE =====
        Map<String, Integer> map = new HashMap<>();
        
        // Initial capacity: 16, load factor: 0.75
        // Resize threshold: 16 × 0.75 = 12
        
        map.put("Alice", 85);    // Compute hash → find bucket → insert
        map.put("Bob", 90);
        map.put("Charlie", 78);
        
        System.out.println("Alice's score: " + map.get("Alice"));  // 85
        
        // ===== CUSTOM CAPACITY AND LOAD FACTOR =====
        // If you know approximate size, set initial capacity to avoid resizing
        Map<String, Integer> optimized = new HashMap<>(100, 0.75f);
        
        // ===== COLLISION DEMONSTRATION =====
        System.out.println("\n=== Hash Collisions ===");
        
        // Create keys that collide (same hash, different values)
        CollisionKey key1 = new CollisionKey("A", 1);
        CollisionKey key2 = new CollisionKey("B", 1);  // Same hash!
        CollisionKey key3 = new CollisionKey("C", 1);  // Same hash!
        
        Map<CollisionKey, String> collisionMap = new HashMap<>();
        collisionMap.put(key1, "Value1");
        collisionMap.put(key2, "Value2");  // Collision → chained in same bucket
        collisionMap.put(key3, "Value3");  // Collision → chained in same bucket
        
        System.out.println("Key1: " + collisionMap.get(key1));
        System.out.println("Key2: " + collisionMap.get(key2));
        System.out.println("Key3: " + collisionMap.get(key3));
        
        // ===== HASHCODE + EQUALS CONTRACT =====
        System.out.println("\n=== HashCode + Equals Contract ===");
        
        Person p1 = new Person("John", 25);
        Person p2 = new Person("John", 25);  // Same content
        
        System.out.println("p1.equals(p2): " + p1.equals(p2));  // true
        System.out.println("p1.hashCode(): " + p1.hashCode());
        System.out.println("p2.hashCode(): " + p2.hashCode());  // Must be same!
        
        Map<Person, String> personMap = new HashMap<>();
        personMap.put(p1, "Engineer");
        
        // Because p1.equals(p2) and same hashCode, p2 retrieves p1's value
        System.out.println("Get with p2: " + personMap.get(p2));  // Engineer
        
        // ===== NULL HANDLING =====
        System.out.println("\n=== Null Handling ===");
        Map<String, String> nullMap = new HashMap<>();
        nullMap.put(null, "NullKey");     // One null key allowed
        nullMap.put("Key1", null);        // Null values allowed
        nullMap.put("Key2", null);        // Multiple null values OK
        
        System.out.println("Null key: " + nullMap.get(null));
        System.out.println("Key1: " + nullMap.get("Key1"));
        
        // ===== ITERATION ORDER (UNORDERED) =====
        System.out.println("\n=== Iteration Order (Unpredictable) ===");
        Map<String, Integer> iterMap = new HashMap<>();
        iterMap.put("Zebra", 1);
        iterMap.put("Apple", 2);
        iterMap.put("Mango", 3);
        
        // Order is NOT guaranteed (depends on hash codes and bucket placement)
        iterMap.forEach((k, v) -> System.out.println(k + ": " + v));
        
        // ===== PERFORMANCE TESTING =====
        System.out.println("\n=== Performance Test ===");
        
        int size = 1_000_000;
        
        // Test with proper initial capacity (no resizing)
        long start = System.nanoTime();
        Map<Integer, Integer> properCapacity = new HashMap<>(size);
        for (int i = 0; i < size; i++) {
            properCapacity.put(i, i * 2);
        }
        long duration1 = System.nanoTime() - start;
        
        // Test with default capacity (multiple resizes)
        start = System.nanoTime();
        Map<Integer, Integer> defaultCapacity = new HashMap<>();
        for (int i = 0; i < size; i++) {
            defaultCapacity.put(i, i * 2);
        }
        long duration2 = System.nanoTime() - start;
        
        System.out.println("With proper capacity: " + duration1 / 1_000_000 + " ms");
        System.out.println("With default capacity: " + duration2 / 1_000_000 + " ms");
        System.out.println("Speedup: " + (duration2 / (double)duration1) + "x");
        
        // ===== TREEIFICATION DEMONSTRATION =====
        System.out.println("\n=== Treeification (Java 8+) ===");
        
        // Create many collisions to trigger treeification
        Map<CollisionKey, Integer> treeMap = new HashMap<>();
        for (int i = 0; i < 20; i++) {
            // All keys have same hash → all go to same bucket
            treeMap.put(new CollisionKey("Key" + i, 42), i);
        }
        
        System.out.println("Map size: " + treeMap.size());
        System.out.println("(Bucket converted to Red-Black Tree after 8 entries)");
    }
}

/**
 * Custom class to demonstrate hash collisions
 */
class CollisionKey {
    private final String name;
    private final int fixedHash;
    
    public CollisionKey(String name, int fixedHash) {
        this.name = name;
        this.fixedHash = fixedHash;
    }
    
    @Override
    public int hashCode() {
        return fixedHash;  // Always returns same hash → collisions!
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof CollisionKey)) return false;
        CollisionKey other = (CollisionKey) obj;
        return Objects.equals(name, other.name);
    }
    
    @Override
    public String toString() {
        return "CollisionKey{" + name + "}";
    }
}

/**
 * Proper hashCode + equals implementation
 */
class Person {
    private final String name;
    private final int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // MUST override both methods together!
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Person)) return false;
        Person other = (Person) obj;
        return age == other.age && Objects.equals(name, other.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, age);  // Combines fields' hash codes
    }
    
    @Override
    public String toString() {
        return "Person{" + name + ", " + age + "}";
    }
}

/**
 * Anti-pattern: Bad hashCode implementation
 */
class BadHashCode {
    private String name;
    private int age;
    
    // WRONG: Always returns same hash
    @Override
    public int hashCode() {
        return 42;  // All objects → same bucket → O(n) performance!
    }
    
    @Override
    public boolean equals(Object obj) {
        // ... proper equals implementation
        return false;
    }
}

/**
 * Anti-pattern: Violates hashCode + equals contract
 */
class BrokenContract {
    private String name;
    
    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof BrokenContract)) return false;
        return name.equals(((BrokenContract) obj).name);
    }
    
    // WRONG: Not overridden, uses Object.hashCode() (memory address)
    // Two equal objects will have different hash codes → HashMap breaks!
}`,

        codeLanguage: "java",
        
        visualization: `┌────────────────────────────────────────────────────────────────┐
│              HASHMAP INTERNAL STRUCTURE                        │
└────────────────────────────────────────────────────────────────┘

HashMap (Default: capacity=16, loadFactor=0.75, threshold=12)
┌─────┬───────────────────────────────────────────────────────┐
│Index│ Bucket (Node<K,V> or TreeNode<K,V>)                  │
├─────┼───────────────────────────────────────────────────────┤
│  0  │ null                                                  │
│  1  │ Node{"Alice",85} → null                               │
│  2  │ null                                                  │
│  3  │ Node{"Bob",90} → Node{"Zoe",88} → null   ◄─ Collision│
│  4  │ null                                                  │
│  5  │ TreeNode{...} ◄──── Tree (if >8 nodes in bucket)     │
│  6  │ null                                                  │
│  7  │ Node{"Charlie",78} → null                             │
│ ... │ ...                                                   │
│ 15  │ null                                                  │
└─────┴───────────────────────────────────────────────────────┘

PUT OPERATION FLOW:
┌────────────┐
│  put(K,V)  │
└──────┬─────┘
       │
       ▼
┌──────────────────────────────┐
│ 1. hash = hash(key.hashCode│
│    Applies secondary hash    │
│    h ^ (h >>> 16)           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 2. index = (n-1) & hash     │
│    Maps to bucket            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 3. Check bucket              │
└──────┬───────────────────────┘
       │
       ├────► Empty? ──► Create Node ──► Done
       │
       ├────► Occupied? ──► Traverse chain/tree
       │                     │
       │                     ├──► Found equals() key? ──► Replace value
       │                     │
       │                     └──► No match? ──► Append Node
       │
       ▼
┌──────────────────────────────┐
│ 4. Check if size > threshold │
└──────┬───────────────────────┘
       │
       └────► Yes? ──► Resize (double capacity + rehash all entries)

TREEIFICATION (Java 8+):
Bucket with 8+ nodes AND capacity ≥ 64:
Linked List → Red-Black Tree
┌─────────────────────────────────────┐
│ Before (Linked List):               │
│ Node → Node → Node → ... → Node     │
│ O(n) search                         │
└─────────────────────────────────────┘
               │
               ▼ Treeify
┌─────────────────────────────────────┐
│ After (Red-Black Tree):             │
│         Node                        │
│        /    \                       │
│     Node    Node                    │
│     / \      / \                    │
│  Node Node Node Node                │
│ O(log n) search                     │
└─────────────────────────────────────┘

HASH DISTRIBUTION (Good vs Bad):
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  Good hashCode()            │  │  Bad hashCode() (always 42) │
│  (Uniform distribution)     │  │  (All in one bucket)        │
├─────────────────────────────┤  ├─────────────────────────────┤
│  [0] Node                   │  │  [0] null                   │
│  [1] null                   │  │  [1] null                   │
│  [2] Node                   │  │  [2] Node → Node → Node     │
│  [3] Node                   │  │      → Node → Node → Node   │
│  [4] null                   │  │      → Node ... (O(n)!)     │
│  [5] Node → Node            │  │  [3] null                   │
│  ...                        │  │  [4] null                   │
│  O(1) average               │  │  ...                        │
└─────────────────────────────┘  └─────────────────────────────┘

HASHCODE + EQUALS CONTRACT:
┌───────────────────────────────────────────────────────────────┐
│ MUST: a.equals(b) → a.hashCode() == b.hashCode()             │
│                                                               │
│ ✓ Correct:                     ✗ Wrong:                      │
│   @Override                      @Override                   │
│   public boolean equals(...)     public boolean equals(...)  │
│   { ... }                        { ... }                     │
│                                                               │
│   @Override                      // hashCode() NOT overridden│
│   public int hashCode()          // Uses Object.hashCode()   │
│   { return Objects.hash(...); }  // BREAKS HashMap!          │
└───────────────────────────────────────────────────────────────┘`,

        explanation: "Critical interview points: (1) HashMap requires proper hashCode()+equals() override, (2) Capacity is always power of 2 for fast modulo via bitwise AND, (3) Treeification (Java 8+) protects against hash collision DoS attacks, (4) Resize is O(n) expensive - set initial capacity when size is known.",
        
        followUpQuestions: [
          "What happens if two keys have the same hashCode() but different equals()? (Collision - stored in same bucket)",
          "Why does HashMap use (n-1) & hash instead of hash % n? (Bitwise AND is faster; works only if n is power of 2)",
          "What is the difference between HashMap and LinkedHashMap? (LinkedHashMap maintains insertion order via doubly-linked list)",
          "How does ConcurrentHashMap differ from HashMap? (Thread-safe via segment/bucket-level locking, no null keys/values)"
        ]
      }
    ]
  }
];


  // ============================================================================
  // OOP CONCEPTS - Core Object-Oriented Programming Principles
  // ============================================================================
  {
    id: "oops",
    title: "OOP Concepts",
    icon: "🧱",
    questions: [
      {
        id: "o1",
        question: "What are the four pillars of OOP?",
        answer: `The four pillars are fundamental principles that structure object-oriented programming, enabling maintainable and extensible software design.

**1. ENCAPSULATION - Bundling Data with Behavior**

Combines data (fields) and methods into a single unit (class) while restricting direct access to internal state. Think of it as a protective capsule.

**Implementation**:
• Private fields + public accessor methods (getters/setters)
• Validation in setters to maintain invariants
• Hide implementation details, expose only necessary API

**Benefits**:
• Data integrity (e.g., balance cannot be negative)
• Flexibility - change internal representation without breaking clients
• Maintainability - invariants enforced in one place

**Real-world**: ATM card shields your balance; you interact through withdraw(), deposit()

**2. INHERITANCE - IS-A Relationship & Code Reuse**

A subclass acquires properties and behaviors from a superclass, establishing specialization. Enables building hierarchies from general to specific.

**Implementation**:
• \`class Dog extends Animal\` - Dog inherits eat(), sleep() from Animal
• Java: Single class inheritance (one extends), multiple interface implementation
• Protected members accessible to subclasses

**Benefits**:
• Code reuse - common behavior in parent, specific in children
• Polymorphic hierarchies
• Natural modeling of domain relationships

**Real-world**: ElectricCar IS-A Car, inherits drive(), adds charge()

**3. POLYMORPHISM - One Interface, Many Forms**

The same method call produces different behavior based on the actual object type at runtime.

**Types**:
• **Compile-time (Overloading)**: Same method name, different parameters
• **Runtime (Overriding)**: Subclass provides specific implementation; JVM dispatches to actual object type via vtable

**Benefits**:
• Write generic code against abstractions
• Add new types without modifying existing code
• Flexibility in system design

**Real-world**: Payment.process() → CreditCard.process(), UPI.process(), Cash.process() - different implementations, same interface

**4. ABSTRACTION - Hiding Complexity**

Focus on WHAT an object does (interface), hide HOW it does it (implementation). Show essential features, hide unnecessary details.

**Mechanisms**:
• **Abstract Classes**: Partial implementation + state + mandatory abstract methods
• **Interfaces**: Pure contracts (all abstract before Java 8, default methods after)

**When to use**:
• Abstract class: Related types share common state/behavior
• Interface: Unrelated types share a capability/contract

**Benefits**:
• Manage complexity
• Change implementation without breaking clients
• Establish contracts for system components

**Real-world**: Car driver interface - start(), stop(), accelerate(). Don't need to know engine internals.

**HOW THEY WORK TOGETHER**

All four pillars reinforce each other:
• Encapsulation protects data while inheritance shares it
• Inheritance enables polymorphism through type hierarchies
• Abstraction defines contracts that polymorphism fulfills
• Together, they create flexible, maintainable systems`,

        code: `/**
 * Comprehensive demonstration of all four OOP pillars
 */

// ============================================
// 1. ENCAPSULATION - Protecting Internal State
// ============================================
class BankAccount {
    // Private fields - cannot be accessed directly
    private String accountNumber;
    private double balance;
    private String accountHolder;
    
    // Constructor with validation
    public BankAccount(String accountNumber, String holder, double initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative");
        }
        this.accountNumber = accountNumber;
        this.accountHolder = holder;
        this.balance = initialBalance;
    }
    
    // Controlled access with validation - ENCAPSULATION
    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        balance += amount;
        System.out.println("Deposited: $" + amount + ", New Balance: $" + balance);
    }
    
    public boolean withdraw(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be positive");
        }
        if (amount > balance) {
            System.out.println("Insufficient funds. Available: $" + balance);
            return false;
        }
        balance -= amount;
        System.out.println("Withdrawn: $" + amount + ", Remaining: $" + balance);
        return true;
    }
    
    // Read-only access - ENCAPSULATION
    public double getBalance() {
        return balance;
    }
    
    public String getAccountHolder() {
        return accountHolder;
    }
    
    // No setter for balance - can only change via deposit/withdraw
    // This maintains the invariant: balance changes are tracked and validated
}

// ============================================
// 2. INHERITANCE - Code Reuse & Specialization
// ============================================

// Base class (Superclass)
abstract class Animal {
    protected String name;
    protected int age;
    
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Common behavior - inherited by all subclasses
    public void eat() {
        System.out.println(name + " is eating");
    }
    
    public void sleep() {
        System.out.println(name + " is sleeping");
    }
    
    // Abstract method - must be implemented by subclasses (ABSTRACTION)
    public abstract void makeSound();
}

// Subclass inherits from Animal
class Dog extends Animal {
    private String breed;
    
    public Dog(String name, int age, String breed) {
        super(name, age);  // Call parent constructor
        this.breed = breed;
    }
    
    // Implement abstract method (POLYMORPHISM via overriding)
    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof! Woof!");
    }
    
    // Dog-specific behavior
    public void fetch() {
        System.out.println(name + " is fetching the ball");
    }
}

class Cat extends Animal {
    public Cat(String name, int age) {
        super(name, age);
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " meows: Meow!");
    }
    
    // Cat-specific behavior
    public void scratch() {
        System.out.println(name + " is scratching");
    }
}

// ============================================
// 3. POLYMORPHISM - One Interface, Many Forms
// ============================================

// Interface defining a contract (ABSTRACTION)
interface Payment {
    void processPayment(double amount);
    boolean validatePayment();
}

class CreditCardPayment implements Payment {
    private String cardNumber;
    private String cvv;
    
    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }
    
    @Override
    public void processPayment(double amount) {
        System.out.println("Processing credit card payment: $" + amount);
        System.out.println("Card ending in: " + cardNumber.substring(cardNumber.length() - 4));
    }
    
    @Override
    public boolean validatePayment() {
        // Validate card number, CVV, expiry
        return cardNumber.length() == 16 && cvv.length() == 3;
    }
}

class UPIPayment implements Payment {
    private String upiId;
    
    public UPIPayment(String upiId) {
        this.upiId = upiId;
    }
    
    @Override
    public void processPayment(double amount) {
        System.out.println("Processing UPI payment: $" + amount);
        System.out.println("UPI ID: " + upiId);
    }
    
    @Override
    public boolean validatePayment() {
        return upiId.contains("@");
    }
}

class CashPayment implements Payment {
    @Override
    public void processPayment(double amount) {
        System.out.println("Processing cash payment: $" + amount);
    }
    
    @Override
    public boolean validatePayment() {
        return true;  // Cash is always valid
    }
}

// ============================================
// 4. ABSTRACTION - Hiding Complexity
// ============================================

// Abstract class with partial implementation
abstract class Shape {
    protected String color;
    
    public Shape(String color) {
        this.color = color;
    }
    
    // Abstract method - subclasses must implement
    public abstract double calculateArea();
    public abstract double calculatePerimeter();
    
    // Concrete method - shared by all shapes
    public void displayInfo() {
        System.out.println("Shape: " + getClass().getSimpleName());
        System.out.println("Color: " + color);
        System.out.println("Area: " + calculateArea());
        System.out.println("Perimeter: " + calculatePerimeter());
    }
}

class Circle extends Shape {
    private double radius;
    
    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    
    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
    
    @Override
    public double calculatePerimeter() {
        return 2 * Math.PI * radius;
    }
}

class Rectangle extends Shape {
    private double width;
    private double height;
    
    public Rectangle(String color, double width, double height) {
        super(color);
        this.width = width;
        this.height = height;
    }
    
    @Override
    public double calculateArea() {
        return width * height;
    }
    
    @Override
    public double calculatePerimeter() {
        return 2 * (width + height);
    }
}

// ============================================
// DEMONSTRATION - All Pillars Working Together
// ============================================
public class OOPPillarsDemo {
    public static void main(String[] args) {
        
        // 1. ENCAPSULATION in action
        System.out.println("=== 1. ENCAPSULATION ===");
        BankAccount account = new BankAccount("ACC001", "John Doe", 1000.0);
        account.deposit(500);
        account.withdraw(200);
        // account.balance = -100;  // Compile error - field is private!
        System.out.println("Final balance: $" + account.getBalance());
        
        // 2. INHERITANCE in action
        System.out.println("\n=== 2. INHERITANCE ===");
        Dog dog = new Dog("Buddy", 3, "Golden Retriever");
        dog.eat();        // Inherited from Animal
        dog.makeSound();  // Overridden in Dog
        dog.fetch();      // Dog-specific method
        
        Cat cat = new Cat("Whiskers", 2);
        cat.sleep();      // Inherited from Animal
        cat.makeSound();  // Overridden in Cat
        cat.scratch();    // Cat-specific method
        
        // 3. POLYMORPHISM in action
        System.out.println("\n=== 3. POLYMORPHISM (Runtime) ===");
        
        // Parent reference, child object (Upcasting)
        Animal animal1 = new Dog("Max", 4, "Labrador");
        Animal animal2 = new Cat("Mittens", 1);
        
        // Same method call, different behavior based on actual object
        animal1.makeSound();  // Woof! Woof!
        animal2.makeSound();  // Meow!
        
        // Array of polymorphic objects
        Animal[] animals = {
            new Dog("Rex", 5, "German Shepherd"),
            new Cat("Felix", 3),
            new Dog("Bella", 2, "Poodle")
        };
        
        for (Animal animal : animals) {
            animal.makeSound();  // Polymorphic call
        }
        
        // Payment system demonstrating polymorphism
        System.out.println("\n=== Payment System (Polymorphism) ===");
        Payment[] payments = {
            new CreditCardPayment("1234567812345678", "123"),
            new UPIPayment("user@bank"),
            new CashPayment()
        };
        
        double amount = 100.0;
        for (Payment payment : payments) {
            if (payment.validatePayment()) {
                payment.processPayment(amount);  // Different implementation for each
            }
            System.out.println();
        }
        
        // 4. ABSTRACTION in action
        System.out.println("=== 4. ABSTRACTION ===");
        Shape circle = new Circle("Red", 5.0);
        Shape rectangle = new Rectangle("Blue", 4.0, 6.0);
        
        // Work with abstraction - don't need to know how area is calculated
        circle.displayInfo();
        System.out.println();
        rectangle.displayInfo();
        
        // Method demonstrating polymorphism with abstraction
        printShapeArea(circle);      // Works with any Shape
        printShapeArea(rectangle);
    }
    
    // Method accepting abstract type (ABSTRACTION + POLYMORPHISM)
    static void printShapeArea(Shape shape) {
        System.out.println("Shape area: " + shape.calculateArea());
    }
}`,

        codeLanguage: "java",
        
        visualization: `┌────────────────────────────────────────────────────────────────┐
│                    FOUR PILLARS OF OOP                         │
└────────────────────────────────────────────────────────────────┘

1. ENCAPSULATION - Data Hiding
┌──────────────────────────────────────────┐
│         BankAccount                      │
│  ┌────────────────────────────────────┐  │
│  │ - accountNumber: String (private) │  │ ◄─ Hidden
│  │ - balance: double (private)       │  │ ◄─ Hidden
│  │ - holder: String (private)        │  │ ◄─ Hidden
│  ├────────────────────────────────────┤  │
│  │ + deposit(amount): void           │  │ ◄─ Controlled access
│  │ + withdraw(amount): boolean       │  │ ◄─ With validation
│  │ + getBalance(): double            │  │ ◄─ Read-only
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘

2. INHERITANCE - IS-A Relationship
                 Animal
        (name, age, eat(), sleep())
                   │
                   │ extends
        ┌──────────┴──────────┐
        │                     │
       Dog                   Cat
  (breed, bark())      (meow(), scratch())
        │
        │ extends
      Puppy
  (play(), learn())

3. POLYMORPHISM - Same Interface, Different Behavior

   Payment Interface
   (processPayment(), validatePayment())
           │
           │ implements
    ┌──────┴──────┬──────────────┐
    │             │              │
CreditCard       UPI          Cash
(card details)  (upiId)    (no details)
    │             │              │
    ▼             ▼              ▼
Different implementations, same method signature

// Client code:
Payment payment = getPaymentMethod();  // Could be any type
payment.processPayment(100);            // Calls correct implementation

4. ABSTRACTION - Essential Features Only

┌────────────────────────────────────────────────────────┐
│           Shape (Abstract Class)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ # color: String                                  │  │
│  │ + displayInfo(): void                            │  │
│  │ + abstract calculateArea(): double               │  │ ◄─ Must implement
│  │ + abstract calculatePerimeter(): double          │  │ ◄─ Must implement
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        ┌─────────────┐       ┌──────────────┐
        │   Circle    │       │  Rectangle   │
        ├─────────────┤       ├──────────────┤
        │ - radius    │       │ - width      │
        │             │       │ - height     │
        ├─────────────┤       ├──────────────┤
        │ + area()    │       │ + area()     │
        │ + perim()   │       │ + perim()    │
        └─────────────┘       └──────────────┘

ALL PILLARS WORKING TOGETHER:

User Code:
    │
    ▼
┌──────────────────────────┐
│  Shape shape;            │ ◄── ABSTRACTION (work with interface)
│  shape = getShape();     │     
│  shape.calculateArea();  │ ◄── POLYMORPHISM (runtime dispatch)
└──────────────────────────┘
         │
         ├─► Circle.calculateArea()    ◄── ENCAPSULATION (π*r² hidden)
         │   (inherited state: color)  ◄── INHERITANCE (reuse)
         │
         └─► Rectangle.calculateArea() ◄── ENCAPSULATION (w*h hidden)
             (inherited state: color)  ◄── INHERITANCE (reuse)

REAL-WORLD ANALOGY:

🏦 Bank ATM System
• ENCAPSULATION: Card hides account details, exposes withdraw/deposit buttons
• INHERITANCE: SavingsAccount IS-A BankAccount, CheckingAccount IS-A BankAccount
• POLYMORPHISM: account.withdraw() works differently for savings vs checking
• ABSTRACTION: User sees "Withdraw Money", not database queries or network calls`,

        explanation: "Interview insight: All four pillars are interconnected. Encapsulation is the foundation (data hiding), Inheritance builds hierarchies, Polymorphism leverages hierarchies for flexible behavior, Abstraction manages complexity. Together they achieve: loose coupling, high cohesion, extensibility without modification (Open-Closed Principle).",
        
        followUpQuestions: [
          "Can you have polymorphism without inheritance? (Yes, via interfaces)",
          "What's the difference between abstract class and interface for abstraction? (Abstract: partial implementation + state; Interface: pure contract)",
          "How does composition differ from inheritance? (Composition: HAS-A, runtime flexibility; Inheritance: IS-A, compile-time)",
          "What is the Diamond Problem and how does Java solve it? (Multiple inheritance ambiguity; Java: single class inheritance, multiple interface implementation)"
        ]
      }
    ]
  },

  // ============================================================================
  // MEMORY & JVM - Understanding Java Memory Management
  // ============================================================================
  {
    id: "memory",
    title: "Memory & JVM",
    icon: "🧠",
    questions: [
      {
        id: "mem1",
        question: "How is memory divided in JVM?",
        answer: `The JVM organizes runtime memory into distinct areas, each serving a specific purpose. Understanding this division is essential for debugging memory issues, performance tuning, and interview success.

**1. HEAP - Shared Object Storage**

The largest memory area where all objects and arrays are allocated. Managed by the Garbage Collector.

**Structure** (Generational GC):
• **Young Generation** (~1/3 of heap)
  - Eden Space: Where new objects are born
  - Survivor Space 0 (S0): First survival area
  - Survivor Space 1 (S1): Second survival area
  
• **Old Generation / Tenured** (~2/3 of heap)
  - Long-lived objects promoted after surviving multiple GC cycles
  - Default promotion threshold: 15 Minor GCs (configurable)

• **MetaSpace** (Java 8+, replaced PermGen)
  - Class metadata: structure, methods, fields
  - Method bytecode
  - Runtime constant pool
  - Static variables
  - Uses native memory (auto-expands, no fixed size)

**Control**: \`-Xms\` (initial), \`-Xmx\` (maximum)
**Error**: OutOfMemoryError: Java heap space

**2. STACK - Per-Thread Method Execution**

Each thread has its own stack for method execution. NOT shared between threads.

**Contains**:
• Method frames (one per method call)
  - Local variable array (primitives, object references)
  - Operand stack (for calculations)
  - Frame data (return address, exception handlers)

**Characteristics**:
• LIFO structure (Last In, First Out)
• Fixed size per thread (default: ~1MB)
• Fast allocation/deallocation (push/pop)

**Control**: \`-Xss\` (stack size per thread)
**Error**: StackOverflowError (deep recursion)

**3. METHOD AREA / METASPACE - Class-Level Information**

Stores class-level data shared across all instances.

**Contains**:
• Class metadata (structure, field types, method signatures)
• Method bytecode
• Runtime constant pool (string literals, symbolic references)
• Static variables
• Just-In-Time (JIT) compiled code cache

**Evolution**:
• Java 7 and earlier: PermGen (fixed size, part of heap)
• Java 8+: MetaSpace (native memory, auto-expands)

**Control**: \`-XX:MetaspaceSize\`, \`-XX:MaxMetaspaceSize\`
**Error**: OutOfMemoryError: Metaspace (Java 8+) or PermGen space (Java 7)

**4. PROGRAM COUNTER (PC) REGISTER - Per Thread**

Stores address of currently executing JVM instruction.
• For Java methods: bytecode instruction address
• For native methods: undefined
• Smallest memory area
• No OutOfMemoryError possible

**5. NATIVE METHOD STACK - Per Thread**

Similar to Java stack but for native (C/C++) methods called via JNI.
• Some JVMs (HotSpot) merge this with the Java stack
• Contains native method frames

**MEMORY ALLOCATION FLOW**

1. **Object creation**: \`new Object()\` → Heap (Eden space)
2. **Local variables**: Method call → Stack frame
3. **Static fields**: Class loading → MetaSpace
4. **Method execution**: JVM instruction → PC Register`,

        code: `/**
 * Demonstrating JVM memory areas through code examples
 */
public class JVMMemoryDemo {
    
    // METASPACE - Class-level data
    private static int staticCounter = 0;        // MetaSpace (static variable)
    private static final String APP_NAME = "Demo"; // MetaSpace (constant)
    
    // Instance variables will be in HEAP (part of object)
    private int instanceCounter = 0;
    private String name;
    
    public static void main(String[] args) {
        
        // ===== 1. HEAP MEMORY =====
        System.out.println("=== HEAP MEMORY ===");
        
        // Objects allocated in Heap (Eden space initially)
        JVMMemoryDemo obj1 = new JVMMemoryDemo();  // Heap
        String str = new String("Hello");          // Heap
        int[] array = new int[1000];               // Heap (arrays are objects)
        
        // After multiple GC cycles, long-lived objects move to Old Generation
        List<String> longLivedList = new ArrayList<>();  // Heap
        
        // ===== 2. STACK MEMORY =====
        System.out.println("\n=== STACK MEMORY ===");
        
        // Local variables in Stack
        int localInt = 42;                    // Stack (primitive value)
        String localRef = "World";            // Stack (reference), "World" in String Pool (Heap)
        JVMMemoryDemo localObj = obj1;        // Stack (reference), object in Heap
        
        // Each method call creates a new frame on Stack
        demonstrateStack(10);
        
        // ===== 3. METASPACE =====
        System.out.println("\n=== METASPACE ===");
        
        // Class metadata loaded in MetaSpace
        System.out.println("Class name: " + JVMMemoryDemo.class.getName());
        
        // Static variable in MetaSpace
        staticCounter++;
        System.out.println("Static counter: " + staticCounter);
        
        // ===== MEMORY INFORMATION =====
        System.out.println("\n=== MEMORY INFORMATION ===");
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();      // Maximum heap (-Xmx)
        long totalMemory = runtime.totalMemory();  // Current heap size
        long freeMemory = runtime.freeMemory();    // Free heap
        long usedMemory = totalMemory - freeMemory;
        
        System.out.println("Max Heap Memory: " + (maxMemory / 1024 / 1024) + " MB");
        System.out.println("Total Heap Memory: " + (totalMemory / 1024 / 1024) + " MB");
        System.out.println("Used Heap Memory: " + (usedMemory / 1024 / 1024) + " MB");
        System.out.println("Free Heap Memory: " + (freeMemory / 1024 / 1024) + " MB");
    }
    
    // Stack frames demonstration
    static void demonstrateStack(int depth) {
        // Each call creates a new frame on the stack
        System.out.println("Stack depth: " + depth + 
                          ", Thread: " + Thread.currentThread().getName());
        
        // Local variables in this frame
        int localVar = depth * 2;      // Stack
        String message = "Frame " + depth;  // Reference on Stack, object in Heap
        
        // Recursive call creates more frames
        if (depth > 0) {
            demonstrateStack(depth - 1);
        }
        
        // When method returns, frame is popped from stack
    }
}

/**
 * Demonstrating Stack Overflow and Heap Overflow
 */
class MemoryErrors {
    
    // Cause StackOverflowError
    public static void causeStackOverflow() {
        causeStackOverflow();  // Infinite recursion
        // Each call adds a frame to stack until it's full
    }
    
    // Cause OutOfMemoryError: Java heap space
    public static void causeHeapOverflow() {
        List<byte[]> list = new ArrayList<>();
        while (true) {
            // Keep allocating memory in heap
            list.add(new byte[1024 * 1024]);  // 1 MB chunks
        }
    }
    
    // Cause OutOfMemoryError: Metaspace (Java 8+)
    public static void causeMetaspaceOverflow() {
        // Dynamically load many classes to fill MetaSpace
        // (Requires bytecode generation library like ASM or Javassist)
    }
    
    public static void main(String[] args) {
        // Uncomment ONE at a time to see different memory errors
        
        // causeStackOverflow();     // StackOverflowError
        // causeHeapOverflow();      // OutOfMemoryError: Java heap space
        // causeMetaspaceOverflow(); // OutOfMemoryError: Metaspace
    }
}

/**
 * Demonstrating where different types are stored
 */
class MemoryLocationDemo {
    
    // METASPACE
    private static int staticField = 100;           // MetaSpace
    private static final String CONSTANT = "ABC";   // MetaSpace
    
    // Will be in HEAP (part of object instance)
    private int instanceField = 200;                // Heap (with object)
    private String instanceString = "Hello";        // Heap (with object)
    
    public void demonstrateLocations() {
        // STACK - Local primitives and references
        int localPrimitive = 300;                   // Stack (value)
        String localString = "World";               // Stack (reference), String in Heap/Pool
        
        // HEAP - Objects
        MemoryLocationDemo obj = new MemoryLocationDemo();  // Stack (reference), Heap (object)
        int[] array = {1, 2, 3};                   // Stack (reference), Heap (array object)
        
        // Method parameter references
        processData(localPrimitive);                // Stack (copy of value)
        processObject(obj);                         // Stack (copy of reference)
    }
    
    void processData(int param) {
        // param is on Stack (copy of value)
        param = param + 10;  // Modifies stack copy, not original
    }
    
    void processObject(MemoryLocationDemo param) {
        // param reference is on Stack (copy of reference)
        // But it points to same Heap object
        param.instanceField = 999;  // Modifies Heap object
    }
    
    public static void main(String[] args) {
        MemoryLocationDemo demo = new MemoryLocationDemo();
        
        System.out.println("Before: " + demo.instanceField);  // 200
        demo.demonstrateLocations();
        
        // Note: instanceField might be modified if processObject was called correctly
    }
}

/**
 * Monitoring memory usage programmatically
 */
class MemoryMonitor {
    public static void main(String[] args) {
        Runtime runtime = Runtime.getRuntime();
        
        System.out.println("=== JVM Memory Statistics ===");
        
        // Heap memory
        long maxHeap = runtime.maxMemory();
        long totalHeap = runtime.totalMemory();
        long freeHeap = runtime.freeMemory();
        long usedHeap = totalHeap - freeHeap;
        
        System.out.println("\nHeap Memory:");
        System.out.println("  Max:   " + formatBytes(maxHeap) + " (-Xmx)");
        System.out.println("  Total: " + formatBytes(totalHeap));
        System.out.println("  Used:  " + formatBytes(usedHeap));
        System.out.println("  Free:  " + formatBytes(freeHeap));
        System.out.println("  Usage: " + (usedHeap * 100 / totalHeap) + "%");
        
        // Thread and stack info
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        System.out.println("\nThread Memory:");
        System.out.println("  Thread Count: " + threadBean.getThreadCount());
        System.out.println("  Peak Threads: " + threadBean.getPeakThreadCount());
        
        // MetaSpace (Java 8+)
        List<MemoryPoolMXBean> memoryPools = ManagementFactory.getMemoryPoolMXBeans();
        for (MemoryPoolMXBean pool : memoryPools) {
            if (pool.getName().contains("Metaspace")) {
                MemoryUsage usage = pool.getUsage();
                System.out.println("\nMetaspace:");
                System.out.println("  Used:      " + formatBytes(usage.getUsed()));
                System.out.println("  Committed: " + formatBytes(usage.getCommitted()));
                System.out.println("  Max:       " + formatBytes(usage.getMax()));
            }
        }
    }
    
    private static String formatBytes(long bytes) {
        if (bytes < 0) return "N/A";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return (bytes / 1024 / 1024) + " MB";
    }
}`,

        codeLanguage: "java",
        
        visualization: `┌────────────────────────────────────────────────────────────────┐
│                     JVM MEMORY ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      HEAP (Shared)                              │
│  -Xms (initial) -Xmx (maximum)                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          YOUNG GENERATION (~1/3)                          │  │
│  │  ┌─────────────┬──────────┬──────────┐                   │  │
│  │  │    Eden     │    S0    │    S1    │                   │  │
│  │  │   (8/10)    │  (1/10)  │  (1/10)  │                   │  │
│  │  │             │ Survivor │ Survivor │                   │  │
│  │  │  new Object│          │          │                   │  │
│  │  │     ↓       │          │          │                   │  │
│  │  │  [Objects]  │ [Alive]  │ [Alive]  │                   │  │
│  │  └─────────────┴──────────┴──────────┘                   │  │
│  │         │  Minor GC             │                         │  │
│  │         └───────────────────────┘                         │  │
│  │                    │                                       │  │
│  │              Promote after 15 GCs                          │  │
│  │                    ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │        OLD GENERATION / TENURED (~2/3)              │  │  │
│  │  │                                                     │  │  │
│  │  │  [Long-lived objects]                              │  │  │
│  │  │  [Objects that survived multiple Minor GCs]        │  │  │
│  │  │                                                     │  │  │
│  │  │         Major GC / Full GC (slower)                 │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ERROR: OutOfMemoryError: Java heap space                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  METASPACE (Native Memory)                      │
│  -XX:MetaspaceSize -XX:MaxMetaspaceSize                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Class Metadata (structure, fields, methods)            │  │
│  │  • Method Bytecode                                        │  │
│  │  • Runtime Constant Pool                                  │  │
│  │  • Static Variables                                       │  │
│  │  • JIT Compiled Code Cache                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Java 7 and earlier: PermGen (part of heap, fixed size)         │
│  Java 8+: MetaSpace (native memory, auto-expands)               │
│  ERROR: OutOfMemoryError: Metaspace                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               STACK (Per Thread, Private)                       │
│  -Xss (size per thread, default ~1MB)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Thread-1 Stack       Thread-2 Stack       Thread-3 Stack │  │
│  │  ┌──────────────┐     ┌──────────────┐    ┌────────────┐ │  │
│  │  │ main() Frame │     │ run() Frame  │    │ call() Fr. │ │  │
│  │  ├──────────────┤     ├──────────────┤    ├────────────┤ │  │
│  │  │ Local Vars:  │     │ Local Vars:  │    │ Local Vars:│ │  │
│  │  │  int x = 10  │     │  int i = 0   │    │  String s  │ │  │
│  │  │  Obj ref     │──┐  │  Obj ref     │─┐  │  int[] arr │ │  │
│  │  ├──────────────┤  │  ├──────────────┤ │  ├────────────┤ │  │
│  │  │ Operand Stack│  │  │ Operand Stack│ │  │ Op. Stack  │ │  │
│  │  ├──────────────┤  │  ├──────────────┤ │  ├────────────┤ │  │
│  │  │ Frame Data   │  │  │ Frame Data   │ │  │ Frame Data │ │  │
│  │  └──────────────┘  │  └──────────────┘ │  └────────────┘ │  │
│  │         │           │         │         │        │        │  │
│  │         ▼  method() │         ▼ method()│        ▼ call() │  │
│  │  ┌──────────────┐  │  ┌──────────────┐ │  ┌────────────┐ │  │
│  │  │ method() Fr. │  │  │ method() Fr. │ │  │ ...        │ │  │
│  │  └──────────────┘  │  └──────────────┘ │  └────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│           │                  │                    │             │
│           └──────references point to Heap─────────┘             │
│                                                                 │
│  ERROR: StackOverflowError (deep recursion)                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│            PC REGISTER (Per Thread, Private)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Thread-1: Address 0x4F2A (current instruction)           │  │
│  │  Thread-2: Address 0x7E18 (current instruction)           │  │
│  │  Thread-3: Undefined (executing native method)            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  • Smallest memory area                                         │
│  • No OutOfMemoryError possible                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           NATIVE METHOD STACK (Per Thread, Private)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Native method frames (C/C++ code called via JNI)         │  │
│  │  Some JVMs (HotSpot) merge with Java Stack                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

OBJECT ALLOCATION FLOW:
new Object() ──► Eden (Young Gen) ──► S0/S1 (survives Minor GC)
                                          │
                               survives 15 Minor GCs
                                          │
                                          ▼
                                  Old Generation

VARIABLE STORAGE:
┌────────────────────┬──────────────────────────────────┐
│ Variable Type      │ Storage Location                 │
├────────────────────┼──────────────────────────────────┤
│ Local primitive    │ Stack (value)                    │
│ Local object ref   │ Stack (reference) → Heap (object)│
│ Instance field     │ Heap (part of object)            │
│ Static field       │ MetaSpace                        │
│ Method parameter   │ Stack (copy of value/reference)  │
│ Array              │ Stack (reference) → Heap (array) │
└────────────────────┴──────────────────────────────────┘`,

        explanation: "Key interview insights: (1) Heap is shared, Stack is per-thread, (2) Objects always in Heap, primitives can be Stack (local) or Heap (instance fields), (3) Young Gen optimizes for short-lived objects (most objects die young), (4) MetaSpace replaced PermGen in Java 8 to avoid fixed-size limits, (5) StackOverflowError = recursion too deep, OutOfMemoryError = Heap/MetaSpace exhausted.",
        
        followUpQuestions: [
          "What is the String Pool and where is it stored? (Heap, special area for interned strings)",
          "Why did Java 8 replace PermGen with MetaSpace? (PermGen had fixed size causing OutOfMemoryError; MetaSpace uses native memory and auto-expands)",
          "Can an object reference be on the Heap? (No, references are on Stack or as instance fields in other Heap objects)",
          "What is the difference between Minor GC and Major GC? (Minor: Young Gen only, fast; Major: Old Gen, slower; Full: entire heap)"
        ]
      }
    ]
  }
];
