import { ContentSection } from "./recursionContent";

export const javaAdvancedContent: ContentSection[] = [
  {
    id: "adv-reflection",
    title: "Reflection API",
    difficulty: "Hard",
    theory: [
      "**Reflection** allows you to inspect and manipulate classes, methods, fields, and constructors **at runtime**",
      "Access class info via `Class<?>` object — obtained with `.class`, `.getClass()`, or `Class.forName(\"...\")`",
      "**getDeclaredMethods()** — all methods in the class. **getMethods()** — all public methods (including inherited)",
      "**getDeclaredFields()** — all fields. **setAccessible(true)** — bypass access modifiers (even private!)",
      "Reflection enables: frameworks (Spring, Hibernate), serialization libraries, testing tools, dependency injection",
      "**Performance cost** — reflection is slower than direct access. Avoid in performance-critical code",
      "**Security risk** — bypassing access modifiers breaks encapsulation. Use carefully"
    ],
    code: [
      {
        title: "Reflection — Inspecting & Invoking at Runtime",
        language: "java",
        content: `import java.lang.reflect.*;

class Secret {
    private String message = "Hidden!";
    private int code = 42;
    
    public String greet(String name) { return "Hello, " + name; }
    private int getCode() { return code; }
}

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // Get Class object
        Class<?> clazz = Secret.class;
        // or: Class.forName("Secret");
        // or: new Secret().getClass();
        
        System.out.println("Class: " + clazz.getName());
        
        // List all declared methods
        System.out.println("\\nMethods:");
        for (Method m : clazz.getDeclaredMethods()) {
            System.out.println("  " + m.getName() + " → " + m.getReturnType().getSimpleName());
        }
        
        // List all declared fields
        System.out.println("\\nFields:");
        for (Field f : clazz.getDeclaredFields()) {
            System.out.println("  " + f.getName() + " : " + f.getType().getSimpleName());
        }
        
        // Create instance via reflection
        Object obj = clazz.getDeclaredConstructor().newInstance();
        
        // Invoke public method
        Method greet = clazz.getMethod("greet", String.class);
        String result = (String) greet.invoke(obj, "Java");
        System.out.println("\\ngreet: " + result); // Hello, Java
        
        // Access private field
        Field msgField = clazz.getDeclaredField("message");
        msgField.setAccessible(true); // bypass private
        System.out.println("Private field: " + msgField.get(obj)); // Hidden!
        msgField.set(obj, "Exposed!");
        System.out.println("Modified: " + msgField.get(obj)); // Exposed!
        
        // Invoke private method
        Method getCode = clazz.getDeclaredMethod("getCode");
        getCode.setAccessible(true);
        int code = (int) getCode.invoke(obj);
        System.out.println("Private method: " + code); // 42
    }
}`
      }
    ],
    warning: "Reflection breaks encapsulation and is slow. Use it only for frameworks, testing, or tooling — never in regular application logic."
  },
  {
    id: "adv-annotations",
    title: "Custom Annotations",
    difficulty: "Medium",
    theory: [
      "**Annotations** are metadata tags that provide information to the compiler, runtime, or tools",
      "Built-in: `@Override`, `@Deprecated`, `@SuppressWarnings`, `@FunctionalInterface`",
      "**Custom annotations** are declared with `@interface` keyword",
      "**@Retention** — when is the annotation available? SOURCE (compile only), CLASS (bytecode), RUNTIME (reflection)",
      "**@Target** — where can it be applied? TYPE, METHOD, FIELD, PARAMETER, CONSTRUCTOR, etc.",
      "Annotations can have **elements** (like methods) with default values",
      "Process runtime annotations with **Reflection** — `method.isAnnotationPresent()`, `method.getAnnotation()`",
      "Frameworks like Spring, JUnit, and Hibernate are built heavily on custom annotations"
    ],
    code: [
      {
        title: "Creating & Processing Custom Annotations",
        language: "java",
        content: `import java.lang.annotation.*;
import java.lang.reflect.*;

// Define custom annotation
@Retention(RetentionPolicy.RUNTIME) // available at runtime
@Target({ElementType.METHOD, ElementType.TYPE}) // for methods and classes
@interface TestCase {
    String name() default "unnamed";
    int priority() default 0;
    String[] tags() default {};
}

// Marker annotation (no elements)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface RunBefore {}

// Use annotations
@TestCase(name = "Calculator Tests", priority = 1)
class Calculator {
    
    @RunBefore
    void setup() { System.out.println("Setting up..."); }
    
    @TestCase(name = "Addition", priority = 1, tags = {"math", "basic"})
    void testAdd() { System.out.println("Testing 2+3=" + (2 + 3)); }
    
    @TestCase(name = "Division", priority = 2, tags = {"math"})
    void testDiv() { System.out.println("Testing 10/2=" + (10 / 2)); }
}

public class AnnotationDemo {
    public static void main(String[] args) throws Exception {
        Class<?> clazz = Calculator.class;
        Object obj = clazz.getDeclaredConstructor().newInstance();
        
        // Read class-level annotation
        if (clazz.isAnnotationPresent(TestCase.class)) {
            TestCase tc = clazz.getAnnotation(TestCase.class);
            System.out.println("Suite: " + tc.name() + " (priority " + tc.priority() + ")");
        }
        
        // Run @RunBefore methods first
        for (Method m : clazz.getDeclaredMethods()) {
            if (m.isAnnotationPresent(RunBefore.class)) {
                m.invoke(obj);
            }
        }
        
        // Run @TestCase methods
        for (Method m : clazz.getDeclaredMethods()) {
            if (m.isAnnotationPresent(TestCase.class)) {
                TestCase tc = m.getAnnotation(TestCase.class);
                System.out.println("\\nRunning: " + tc.name() + " | Tags: " + String.join(", ", tc.tags()));
                m.invoke(obj);
            }
        }
    }
}`
      }
    ],
    tip: "Use `@Retention(RUNTIME)` if you need to read annotations via reflection. Use `@Retention(SOURCE)` for compile-time-only checks."
  },
  {
    id: "adv-jvm",
    title: "JVM Architecture & Memory",
    difficulty: "Hard",
    theory: [
      "The **JVM (Java Virtual Machine)** is the engine that runs Java bytecode on any platform",
      "**JVM components:** Class Loader, Runtime Data Areas (Memory), Execution Engine",
      "**Class Loading:** Bootstrap → Extension → Application class loaders. Follows **delegation model**",
      "**Runtime Memory Areas:**",
      "**Heap** — stores all objects and arrays. Shared across threads. Managed by GC",
      "**Stack** — one per thread. Stores method frames (local variables, operand stack, return address)",
      "**Method Area (Metaspace)** — stores class metadata, static variables, method bytecode",
      "**PC Register** — one per thread, holds address of current instruction",
      "**Native Method Stack** — for native (C/C++) method calls via JNI",
      "**Execution Engine:** Interpreter (line-by-line) + **JIT Compiler** (compiles hot methods to native code for performance)"
    ],
    diagram: {
      type: "layers",
      title: "JVM Architecture",
      data: [
        {
          label: "JVM (Java Virtual Machine)",
          color: "primary",
          children: [
            {
              label: "Class Loader Subsystem",
              color: "info",
              children: [
                { label: "Bootstrap → Extension → Application ClassLoader", color: "info" }
              ]
            },
            {
              label: "Runtime Data Areas (Memory)",
              color: "warning",
              children: [
                { label: "Heap (Objects & Arrays — shared, GC managed)", color: "accent" },
                { label: "Stack (Per thread — local vars, method frames)", color: "success" },
                { label: "Method Area / Metaspace (Class metadata, statics)", color: "heap" },
                { label: "PC Register + Native Method Stack (Per thread)", color: "muted" }
              ]
            },
            {
              label: "Execution Engine",
              color: "primary",
              children: [
                { label: "Interpreter + JIT Compiler + Garbage Collector", color: "primary" }
              ]
            }
          ]
        }
      ]
    },
    code: [
      {
        title: "JVM Memory — Inspecting at Runtime",
        language: "java",
        content: `public class JVMMemoryDemo {
    public static void main(String[] args) {
        Runtime runtime = Runtime.getRuntime();
        
        // Memory info
        long maxMemory = runtime.maxMemory();       // max heap (-Xmx)
        long totalMemory = runtime.totalMemory();   // current heap size
        long freeMemory = runtime.freeMemory();     // free in current heap
        long usedMemory = totalMemory - freeMemory;
        
        System.out.println("=== JVM Memory ===");
        System.out.println("Max Heap:   " + (maxMemory / 1024 / 1024) + " MB");
        System.out.println("Total Heap: " + (totalMemory / 1024 / 1024) + " MB");
        System.out.println("Used:       " + (usedMemory / 1024 / 1024) + " MB");
        System.out.println("Free:       " + (freeMemory / 1024 / 1024) + " MB");
        
        // Available processors
        System.out.println("Processors: " + runtime.availableProcessors());
        
        // System properties
        System.out.println("\\n=== JVM Info ===");
        System.out.println("Java Version: " + System.getProperty("java.version"));
        System.out.println("JVM Name:     " + System.getProperty("java.vm.name"));
        System.out.println("OS:           " + System.getProperty("os.name"));
        
        // Stack vs Heap illustration
        int localVar = 42;        // Stack — primitive in local variable
        String str = "Hello";     // Stack has reference, Heap has String object
        int[] arr = new int[100]; // Stack has reference, Heap has array
        
        // Force GC (hint only — JVM may ignore)
        System.gc();
        System.out.println("\\nAfter GC — Free: " + (runtime.freeMemory() / 1024 / 1024) + " MB");
    }
}`
      }
    ],
    note: "JVM memory flags: **-Xms** (initial heap), **-Xmx** (max heap), **-Xss** (stack size per thread). Example: `java -Xmx512m MyApp`"
  },
  {
    id: "adv-gc",
    title: "Garbage Collection",
    difficulty: "Hard",
    theory: [
      "**Garbage Collection (GC)** automatically frees memory occupied by objects no longer reachable from any live reference",
      "An object is eligible for GC when no live thread can reach it (no references point to it)",
      "**Generational hypothesis:** most objects die young. Heap is divided into **Young Gen** and **Old Gen**",
      "**Young Gen:** Eden + Survivor spaces (S0, S1). New objects are created in Eden. Minor GC collects Young Gen",
      "**Old Gen (Tenured):** Objects that survive multiple minor GCs are promoted here. Major GC collects Old Gen",
      "**GC Algorithms:** Serial GC (single thread), Parallel GC (multiple threads), G1 GC (default since Java 9), ZGC (low latency)",
      "**G1 GC** — divides heap into regions, collects regions with most garbage first. Good balance of throughput and latency",
      "**ZGC** (Java 15+) — ultra-low pause times (<10ms), handles terabytes of heap. Best for latency-sensitive apps",
      "`System.gc()` is just a **hint** — JVM may ignore it. Never rely on it"
    ],
    code: [
      {
        title: "GC Behavior & finalize",
        language: "java",
        content: `public class GCDemo {
    private String name;
    
    GCDemo(String name) {
        this.name = name;
        System.out.println("Created: " + name);
    }
    
    // Called before GC collects this object (deprecated since Java 9)
    @Override
    protected void finalize() {
        System.out.println("Finalized: " + name);
    }
    
    public static void main(String[] args) throws Exception {
        // Create objects
        GCDemo a = new GCDemo("Object-A");
        GCDemo b = new GCDemo("Object-B");
        GCDemo c = new GCDemo("Object-C");
        
        // Make B eligible for GC
        b = null;
        
        // Make C eligible for GC
        c = new GCDemo("Object-D"); // old C is now unreachable
        
        // Request GC (not guaranteed)
        System.gc();
        Thread.sleep(1000); // give GC time to run
        
        System.out.println("\\n'a' is still alive: " + a.name);
        
        // Memory pressure — create many objects
        System.out.println("\\nCreating many objects...");
        for (int i = 0; i < 100_000; i++) {
            new byte[1024]; // 1KB each, quickly becomes garbage
        }
        System.out.println("Done! GC handled the memory automatically.");
    }
}`
      }
    ],
    warning: "**finalize()** is deprecated since Java 9 — use **try-with-resources** or **Cleaner** API instead for cleanup logic."
  },
  {
    id: "adv-classloader",
    title: "ClassLoader & Dynamic Loading",
    difficulty: "Hard",
    theory: [
      "A **ClassLoader** loads .class files (bytecode) into the JVM at runtime",
      "**Three built-in class loaders** (delegation hierarchy):",
      "**Bootstrap ClassLoader** — loads core Java classes (rt.jar / java.base). Written in native code",
      "**Platform (Extension) ClassLoader** — loads platform modules (java.sql, java.xml, etc.)",
      "**Application ClassLoader** — loads classes from classpath (your application code)",
      "**Delegation model:** each loader delegates to its parent first. If parent can't find, the child loads",
      "**Custom ClassLoader** — extend ClassLoader and override `findClass()`. Used for plugins, hot-reloading",
      "A class is uniquely identified by its **fully qualified name + its ClassLoader**"
    ],
    code: [
      {
        title: "ClassLoader — Inspection & Dynamic Loading",
        language: "java",
        content: `public class ClassLoaderDemo {
    public static void main(String[] args) throws Exception {
        // Check classloaders
        System.out.println("=== ClassLoader Hierarchy ===");
        
        // Application ClassLoader — loads your classes
        ClassLoader appLoader = ClassLoaderDemo.class.getClassLoader();
        System.out.println("App class loader: " + appLoader);
        
        // Platform ClassLoader
        ClassLoader platformLoader = appLoader.getParent();
        System.out.println("Platform loader: " + platformLoader);
        
        // Bootstrap ClassLoader (returns null — it's native)
        ClassLoader bootLoader = platformLoader.getParent();
        System.out.println("Bootstrap loader: " + bootLoader); // null
        
        // Core classes are loaded by bootstrap
        System.out.println("\\nString loader: " + String.class.getClassLoader()); // null (bootstrap)
        System.out.println("ArrayList loader: " + java.util.ArrayList.class.getClassLoader()); // null
        
        // Dynamic class loading
        Class<?> clazz = Class.forName("java.util.HashMap");
        Object map = clazz.getDeclaredConstructor().newInstance();
        System.out.println("\\nDynamically loaded: " + clazz.getSimpleName());
        System.out.println("Instance: " + map);
        
        // Check if a class is loaded
        System.out.println("\\nIs Runnable loadable? " + 
            (Class.forName("java.lang.Runnable") != null));
    }
}`
      }
    ],
    note: "Custom ClassLoaders are used in plugin systems (Eclipse), app servers (Tomcat), and hot-reload tools (Spring DevTools)."
  },
  {
    id: "adv-patterns",
    title: "Design Patterns in Java",
    difficulty: "Medium",
    theory: [
      "**Design patterns** are reusable solutions to common software design problems",
      "**Creational patterns:** control object creation",
      "**Singleton** — ensure only one instance exists. Use enum-based singleton in Java (thread-safe, serialization-safe)",
      "**Factory Method** — create objects without specifying exact class. Subclasses decide which class to instantiate",
      "**Builder** — construct complex objects step by step. Useful when constructor has many parameters",
      "**Structural patterns:** organize classes and objects",
      "**Adapter** — make incompatible interfaces work together",
      "**Behavioral patterns:** manage algorithms and responsibilities",
      "**Observer** — notify multiple objects when state changes (event listeners)",
      "**Strategy** — define a family of algorithms, make them interchangeable at runtime"
    ],
    code: [
      {
        title: "Singleton, Builder & Factory Patterns",
        language: "java",
        content: `import java.util.*;

// SINGLETON — enum-based (best approach in Java)
enum DatabaseConnection {
    INSTANCE;
    
    private String url = "jdbc:mysql://localhost:3306/db";
    
    public void query(String sql) {
        System.out.println("Executing: " + sql + " on " + url);
    }
}

// BUILDER — for complex objects
class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    
    private HttpRequest(Builder builder) {
        this.url = builder.url;
        this.method = builder.method;
        this.headers = builder.headers;
        this.body = builder.body;
    }
    
    static class Builder {
        private String url;
        private String method = "GET";
        private Map<String, String> headers = new HashMap<>();
        private String body;
        
        Builder(String url) { this.url = url; }
        Builder method(String m) { this.method = m; return this; }
        Builder header(String k, String v) { headers.put(k, v); return this; }
        Builder body(String b) { this.body = b; return this; }
        HttpRequest build() { return new HttpRequest(this); }
    }
    
    @Override
    public String toString() { return method + " " + url + " headers=" + headers; }
}

// FACTORY — create objects by type
interface Notification { void send(String message); }
class EmailNotification implements Notification {
    public void send(String msg) { System.out.println("Email: " + msg); }
}
class SMSNotification implements Notification {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}
class NotificationFactory {
    static Notification create(String type) {
        return switch (type.toLowerCase()) {
            case "email" -> new EmailNotification();
            case "sms" -> new SMSNotification();
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}

public class DesignPatternsDemo {
    public static void main(String[] args) {
        // Singleton
        DatabaseConnection.INSTANCE.query("SELECT * FROM users");
        
        // Builder
        HttpRequest req = new HttpRequest.Builder("https://api.example.com")
            .method("POST")
            .header("Content-Type", "application/json")
            .body("{\"name\":\"Alice\"}")
            .build();
        System.out.println(req);
        
        // Factory
        Notification n = NotificationFactory.create("email");
        n.send("Hello!");
    }
}`
      },
      {
        title: "Observer & Strategy Patterns",
        language: "java",
        content: `import java.util.*;

// OBSERVER — event notification
interface EventListener { void onEvent(String event); }

class EventBus {
    private Map<String, List<EventListener>> listeners = new HashMap<>();
    
    void subscribe(String eventType, EventListener listener) {
        listeners.computeIfAbsent(eventType, k -> new ArrayList<>()).add(listener);
    }
    
    void publish(String eventType, String data) {
        listeners.getOrDefault(eventType, List.of())
            .forEach(l -> l.onEvent(data));
    }
}

// STRATEGY — interchangeable algorithms
interface SortStrategy { void sort(int[] arr); }

class BubbleSort implements SortStrategy {
    public void sort(int[] arr) {
        for (int i = 0; i < arr.length - 1; i++)
            for (int j = 0; j < arr.length - i - 1; j++)
                if (arr[j] > arr[j + 1]) { int t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t; }
        System.out.println("BubbleSorted: " + Arrays.toString(arr));
    }
}

class QuickSortStrategy implements SortStrategy {
    public void sort(int[] arr) {
        Arrays.sort(arr); // using built-in for brevity
        System.out.println("QuickSorted: " + Arrays.toString(arr));
    }
}

class Sorter {
    private SortStrategy strategy;
    Sorter(SortStrategy strategy) { this.strategy = strategy; }
    void setStrategy(SortStrategy s) { this.strategy = s; }
    void sort(int[] arr) { strategy.sort(arr); }
}

public class BehavioralPatterns {
    public static void main(String[] args) {
        // Observer
        EventBus bus = new EventBus();
        bus.subscribe("login", e -> System.out.println("Logger: " + e));
        bus.subscribe("login", e -> System.out.println("Analytics: " + e));
        bus.publish("login", "User Alice logged in");
        
        // Strategy
        Sorter sorter = new Sorter(new BubbleSort());
        sorter.sort(new int[]{5, 2, 8, 1});
        
        sorter.setStrategy(new QuickSortStrategy());
        sorter.sort(new int[]{9, 3, 7, 4});
    }
}`
      }
    ],
    tip: "In modern Java, **Strategy pattern** is often replaced by simply passing a lambda or method reference."
  },
  {
    id: "adv-records",
    title: "Records & Sealed Classes (Java 17+)",
    difficulty: "Medium",
    theory: [
      "**Records** (Java 16+) are immutable data carriers — the compiler generates constructor, getters, equals, hashCode, toString",
      "Syntax: `record Point(int x, int y) {}` — that's it! No boilerplate",
      "Records are **implicitly final** — cannot be extended. Fields are **private final**",
      "You can add: custom constructors (compact constructor), static methods, instance methods",
      "**Sealed classes** (Java 17) restrict which classes can extend them — `sealed class Shape permits Circle, Square`",
      "Subclasses of sealed class must be **final**, **sealed**, or **non-sealed**",
      "Sealed classes + records + pattern matching = powerful, type-safe domain modeling",
      "Records replace Lombok's @Data for simple DTOs. Sealed classes enable exhaustive switch expressions"
    ],
    code: [
      {
        title: "Records — Immutable Data Classes",
        language: "java",
        content: `// Simple record — compiler generates everything
record Point(int x, int y) {}

// Record with custom constructor and methods
record Person(String name, int age) {
    // Compact constructor — validation
    Person {
        if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
        name = name.trim(); // can modify before assignment
    }
    
    // Custom methods
    String greeting() { return "Hi, I'm " + name + ", age " + age; }
    
    // Static factory
    static Person of(String name, int age) { return new Person(name, age); }
}

// Record implementing interface
interface Printable { void print(); }

record Book(String title, String author, int year) implements Printable {
    public void print() {
        System.out.println(title + " by " + author + " (" + year + ")");
    }
}

public class RecordDemo {
    public static void main(String[] args) {
        Point p = new Point(3, 4);
        System.out.println(p);           // Point[x=3, y=4]
        System.out.println(p.x());       // 3 (accessor, not getX)
        System.out.println(p.y());       // 4
        
        Point p2 = new Point(3, 4);
        System.out.println(p.equals(p2)); // true (value equality)
        
        Person person = Person.of("Alice", 25);
        System.out.println(person.greeting()); // Hi, I'm Alice, age 25
        
        Book book = new Book("Clean Code", "Robert Martin", 2008);
        book.print();
    }
}`
      },
      {
        title: "Sealed Classes & Pattern Matching",
        language: "java",
        content: `// Sealed class — only permitted subclasses can extend
sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
record Triangle(double base, double height) implements Shape {}

public class SealedDemo {
    // Pattern matching with sealed classes — exhaustive!
    static double area(Shape shape) {
        return switch (shape) {
            case Circle c -> Math.PI * c.radius() * c.radius();
            case Rectangle r -> r.width() * r.height();
            case Triangle t -> 0.5 * t.base() * t.height();
            // No default needed — compiler knows all cases are covered!
        };
    }
    
    static String describe(Shape shape) {
        return switch (shape) {
            case Circle c when c.radius() > 10 -> "Large circle";
            case Circle c -> "Small circle (r=" + c.radius() + ")";
            case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
            case Triangle t -> "Triangle (base=" + t.base() + ")";
        };
    }
    
    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(5), new Rectangle(4, 6), new Triangle(3, 8), new Circle(15)
        };
        
        for (Shape s : shapes) {
            System.out.printf("%s → area=%.2f%n", describe(s), area(s));
        }
    }
}`
      }
    ],
    note: "Records + Sealed Classes + Pattern Matching is Java's answer to Kotlin data classes and Rust enums. Use them together for clean domain modeling."
  },
  {
    id: "adv-modules",
    title: "Java Module System (JPMS)",
    difficulty: "Hard",
    theory: [
      "**Java Platform Module System (JPMS)** was introduced in Java 9 — also called Project Jigsaw",
      "A **module** is a named, self-describing collection of packages with explicit dependencies",
      "Defined by `module-info.java` at the root of the module's source tree",
      "**Key directives:** `requires` (dependency), `exports` (make package accessible), `opens` (allow reflection)",
      "**Benefits:** strong encapsulation (hide internal packages), reliable configuration (no classpath hell), smaller runtime images",
      "**requires transitive** — propagates the dependency to modules that require this module",
      "The JDK itself is modularized — `java.base` is automatically required by every module",
      "For most applications, modules are optional — the unnamed module (classpath) still works"
    ],
    code: [
      {
        title: "Module System — module-info.java",
        language: "java",
        content: `// module-info.java for a library module
// File: com.myapp.utils/module-info.java
/*
module com.myapp.utils {
    // Export packages — other modules can access these
    exports com.myapp.utils.math;
    exports com.myapp.utils.string;
    
    // Internal packages — NOT accessible outside
    // com.myapp.utils.internal is hidden
    
    // Dependency on another module
    requires java.logging;
    
    // Transitive dependency — consumers also get java.sql
    requires transitive java.sql;
    
    // Open for reflection (e.g., for frameworks)
    opens com.myapp.utils.model to com.google.gson;
}
*/

// module-info.java for the main application
// File: com.myapp/module-info.java
/*
module com.myapp {
    requires com.myapp.utils;  // depends on our utils module
    requires java.net.http;    // HTTP client (Java 11+)
    
    // Main class
    // exports com.myapp;
}
*/

// Example class in a module
// package com.myapp.utils.math;
class MathUtils {
    public static int gcd(int a, int b) {
        while (b != 0) { int t = b; b = a % b; a = t; }
        return a;
    }
    
    public static long factorial(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) result *= i;
        return result;
    }
    
    public static void main(String[] args) {
        System.out.println("GCD(12,8) = " + gcd(12, 8));      // 4
        System.out.println("10! = " + factorial(10));           // 3628800
    }
}`
      }
    ],
    tip: "For small projects, you don't need modules. They're most valuable for **libraries** and **large applications** that benefit from strong encapsulation."
  },
  {
    id: "adv-performance",
    title: "Performance Tuning & Profiling",
    difficulty: "Hard",
    theory: [
      "**JIT (Just-In-Time) Compiler** — compiles hot methods to native code at runtime. C1 (quick compile) + C2 (optimized)",
      "**Tiered compilation** (default since Java 8) — starts with interpreter, promotes to C1, then C2 for hot code",
      "**String performance:** use StringBuilder for concatenation in loops. String.intern() for deduplication",
      "**Autoboxing cost:** `Integer` is ~16 bytes vs `int` at 4 bytes. Use primitive arrays and streams when possible",
      "**Common optimizations:** avoid creating unnecessary objects, use lazy initialization, prefer arrays over collections for primitives",
      "**Profiling tools:** JVisualVM, JFR (Java Flight Recorder), async-profiler, JMH (microbenchmarks)",
      "**JMH (Java Microbenchmark Harness)** — the standard for benchmarking Java code. Handles warmup, JIT, and GC correctly",
      "**Remember:** premature optimization is the root of all evil. Profile first, optimize bottlenecks"
    ],
    code: [
      {
        title: "Performance Tips & Measurement",
        language: "java",
        content: `import java.util.*;

public class PerformanceTips {
    public static void main(String[] args) {
        int N = 1_000_000;
        
        // ❌ String concatenation in loop — O(n²)
        long start = System.nanoTime();
        String bad = "";
        for (int i = 0; i < 10_000; i++) bad += "a";
        long badTime = System.nanoTime() - start;
        
        // ✅ StringBuilder — O(n)
        start = System.nanoTime();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10_000; i++) sb.append("a");
        String good = sb.toString();
        long goodTime = System.nanoTime() - start;
        
        System.out.println("String concat: " + badTime / 1_000_000 + "ms");
        System.out.println("StringBuilder: " + goodTime / 1_000_000 + "ms");
        System.out.println("Speedup: " + (badTime / goodTime) + "x");
        
        // Primitive vs Boxed arrays
        start = System.nanoTime();
        int[] primitiveArr = new int[N];
        for (int i = 0; i < N; i++) primitiveArr[i] = i;
        long primSum = 0;
        for (int x : primitiveArr) primSum += x;
        long primTime = System.nanoTime() - start;
        
        start = System.nanoTime();
        Integer[] boxedArr = new Integer[N];
        for (int i = 0; i < N; i++) boxedArr[i] = i; // autoboxing
        long boxSum = 0;
        for (int x : boxedArr) boxSum += x; // unboxing
        long boxTime = System.nanoTime() - start;
        
        System.out.println("\\nPrimitive array: " + primTime / 1_000_000 + "ms");
        System.out.println("Boxed array:     " + boxTime / 1_000_000 + "ms");
        
        // HashMap initial capacity — avoid rehashing
        // ✅ Pre-size when you know the count
        Map<Integer, Integer> map = new HashMap<>(N * 4 / 3 + 1); // capacity for N elements
        for (int i = 0; i < N; i++) map.put(i, i);
        
        System.out.println("\\nDone! Map size: " + map.size());
    }
}`
      },
      {
        title: "Competitive Programming — Speed Tips",
        language: "java",
        content: `import java.io.*;
import java.util.*;

public class CPSpeedTips {
    public static void main(String[] args) throws IOException {
        // TIP 1: Fast I/O
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        
        // TIP 2: Use int[] instead of ArrayList<Integer>
        int n = 100_000;
        int[] arr = new int[n]; // ✅ faster than ArrayList
        
        // TIP 3: Use Arrays.sort for primitives (dual-pivot quicksort)
        Arrays.sort(arr); // O(n log n), very fast for primitives
        
        // TIP 4: For objects, Arrays.sort uses merge sort (stable)
        Integer[] boxed = new Integer[n];
        Arrays.sort(boxed); // merge sort, slower due to boxing
        
        // TIP 5: Avoid HashMap when possible — use arrays as maps
        int[] freq = new int[1_000_001]; // if values are 0 to 1M
        // freq[value]++ instead of map.merge(value, 1, Integer::sum)
        
        // TIP 6: Bit operations are faster than arithmetic
        int x = 16;
        int half = x >> 1;     // x / 2
        int doubled = x << 1; // x * 2
        boolean isEven = (x & 1) == 0;
        
        // TIP 7: Pre-compute factorials, powers, etc.
        long[] fact = new long[21];
        fact[0] = 1;
        for (int i = 1; i <= 20; i++) fact[i] = fact[i - 1] * i;
        
        System.out.println("20! = " + fact[20]);
        System.out.print(out);
    }
}`
      }
    ],
    warning: "Never optimize without profiling first. Micro-optimizations rarely matter — focus on **algorithm choice** and **data structure selection**."
  }
];
