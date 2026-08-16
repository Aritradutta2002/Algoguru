// Enhanced Core Java Interview Data - Sample Section
// This demonstrates the enhancement approach for key questions

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  code?: string;
  codeLanguage?: string;
  explanation: string;
  visualization?: string; // New optional field for ASCII diagrams
  followUpQuestions?: string[]; // New optional field for common follow-ups
}

// Sample Enhanced Questions - OOP Concepts Section

export const enhancedOOPQuestions: InterviewQuestion[] = [
  {
    id: "o1-enhanced",
    question: "What are the four pillars of OOP?",
    answer: `The four pillars are fundamental principles that define object-oriented programming. They work together to create maintainable, reusable, and extensible software.

**1. ENCAPSULATION** - Bundling Data with Behavior
Encapsulation combines data (fields) and the methods that operate on that data into a single unit (class), while restricting direct access to internal state. Think of it as a capsule that protects the data inside.

• Implementation: Use private fields + public methods (getters/setters) with validation
• Benefit: Protects invariants (e.g., balance cannot be negative in BankAccount)
• Real-world: ATM card shields your bank balance; you interact only through defined operations

**2. INHERITANCE** - IS-A Relationship & Code Reuse
A subclass acquires properties and behaviors from a superclass, establishing an "is-a" relationship. It enables building specialized classes from general ones.

• Implementation: class Dog extends Animal - Dog inherits eat(), sleep() from Animal
• Java Constraint: Single class inheritance only (one extends), but multiple interface implementation (many implements)
• Benefit: DRY principle - common behavior in parent, specific behavior in children
• Real-world: Electric car IS-A car, inherits drive(), accelerate(), adds charge()

**3. POLYMORPHISM** - One Interface, Many Forms
The same method call produces different behavior depending on the actual object type at runtime.

• Compile-time (Overloading): Multiple methods same name, different parameters
• Runtime (Overriding): Subclass provides specific implementation; JVM dispatches to actual object type
• Real-world: Payment.process() → CreditCard.process(), UPI.process(), Cash.process()
• Interview Follow-up: "How does JVM achieve this?" → Virtual Method Table (vtable)

**4. ABSTRACTION** - Hiding Complexity, Showing Essentials
Focus on WHAT an object does (interface), hide HOW it does it (implementation). Achieved via abstract classes (partial implementation + state) and interfaces (pure contracts).

• Abstract Class: When subclasses share common state/behavior + have mandatory abstract methods
• Interface: When you define a capability/contract across unrelated classes
• Real-world: Car driver interface - start(), stop(), accelerate(). Don't need to know engine internals.

**Anti-Patterns to Avoid:**
❌ Public fields (breaks encapsulation)
❌ God classes (violates single responsibility)
❌ Inheritance for code reuse alone (prefer composition)
❌ Tight coupling between classes (limits flexibility)`,

    code: `// COMPREHENSIVE OOP DEMONSTRATION

// ============================================
// 1. ENCAPSULATION - Protecting Internal State
// ============================================
class BankAccount {
    // Private fields - cannot be accessed directly from outside
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
    
    // Controlled access with validation - deposit
    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        balance += amount;
        System.out.println("Deposited: $" + amount + ", New Balance: $" + balance);
    }
    
    // Controlled access with business logic - withdraw
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
    
    // Read-only access (no setter) - encapsulation at its best
    public double getBalance() {
        return balance;
    }
    
    public String getAccountNumber() {
        return accountNumber;
    }
}

// ============================================
// 2. INHERITANCE - Code Reuse & Specialization
// ============================================
abstract class Animal {
    protected String name;
    protected int age;
    
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Common behavior inherited by all animals
    public void eat() {
        System.out.println(name + " is eating");
    }
    
    public void sleep() {
        System.out.println(name + " is sleeping");
    }
    
    // Abstract method - subclasses MUST implement
    public abstract void makeSound();
    
    // Template method pattern - define algorithm skeleton
    public final void dailyRoutine() {
        System.out.println("\\n--- " + name + "'s Daily Routine ---");
        eat();
        makeSound();
        sleep();
    }
}

class Dog extends Animal {
    private String breed;
    
    public Dog(String name, int age, String breed) {
        super(name, age);  // Initialize parent state
        this.breed = breed;
    }
    
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
    private boolean isIndoor;
    
    public Cat(String name, int age, boolean isIndoor) {
        super(name, age);
        this.isIndoor = isIndoor;
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " meows: Meow!");
    }
    
    // Cat-specific behavior
    public void scratch() {
        System.out.println(name + " is scratching the furniture");
    }
}

// ============================================
// 3. POLYMORPHISM - Runtime Behavior Selection
// ============================================

// Interface defining a contract
interface Payment {
    boolean processPayment(double amount);
    String getPaymentDetails();
}

// Multiple implementations - different behaviors
class CreditCardPayment implements Payment {
    private String cardNumber;
    private String cardHolder;
    private double creditLimit;
    
    public CreditCardPayment(String cardNumber, String cardHolder, double creditLimit) {
        this.cardNumber = maskCardNumber(cardNumber);
        this.cardHolder = cardHolder;
        this.creditLimit = creditLimit;
    }
    
    @Override
    public boolean processPayment(double amount) {
        if (amount > creditLimit) {
            System.out.println("Credit limit exceeded!");
            return false;
        }
        System.out.println("Processing credit card payment: $" + amount);
        creditLimit -= amount;
        return true;
    }
    
    @Override
    public String getPaymentDetails() {
        return "Credit Card: " + cardNumber + " (" + cardHolder + ")";
    }
    
    private String maskCardNumber(String card) {
        return "****-****-****-" + card.substring(card.length() - 4);
    }
}

class UPIPayment implements Payment {
    private String upiId;
    
    public UPIPayment(String upiId) {
        this.upiId = upiId;
    }
    
    @Override
    public boolean processPayment(double amount) {
        System.out.println("Processing UPI payment: $" + amount);
        System.out.println("Sending payment request to UPI ID: " + upiId);
        // Simulate UPI processing
        return true;
    }
    
    @Override
    public String getPaymentDetails() {
        return "UPI ID: " + upiId;
    }
}

class CashPayment implements Payment {
    @Override
    public boolean processPayment(double amount) {
        System.out.println("Processing cash payment: $" + amount);
        return true;
    }
    
    @Override
    public String getPaymentDetails() {
        return "Cash Payment";
    }
}

// ============================================
// 4. ABSTRACTION - Hiding Implementation Details
// ============================================

// Payment processor doesn't know HOW each payment works
// It only knows WHAT operations are available
class PaymentProcessor {
    // Polymorphic method - works with ANY Payment implementation
    public void checkout(Payment paymentMethod, double amount) {
        System.out.println("\\n=== CHECKOUT ===");
        System.out.println("Payment Method: " + paymentMethod.getPaymentDetails());
        System.out.println("Amount: $" + amount);
        
        boolean success = paymentMethod.processPayment(amount);
        
        if (success) {
            System.out.println("✓ Payment successful!");
            generateReceipt(paymentMethod, amount);
        } else {
            System.out.println("✗ Payment failed!");
        }
    }
    
    private void generateReceipt(Payment paymentMethod, double amount) {
        System.out.println("\\n--- RECEIPT ---");
        System.out.println("Paid: $" + amount);
        System.out.println("Via: " + paymentMethod.getPaymentDetails());
        System.out.println("Thank you!");
    }
}

// ============================================
// DEMONSTRATION - All Pillars Working Together
// ============================================
public class OOPDemo {
    public static void main(String[] args) {
        // Encapsulation Demo
        System.out.println("=== ENCAPSULATION DEMO ===");
        BankAccount account = new BankAccount("ACC123", "John Doe", 1000.0);
        account.deposit(500.0);
        account.withdraw(200.0);
        account.withdraw(2000.0);  // Fails - insufficient funds
        
        // Inheritance Demo
        System.out.println("\\n=== INHERITANCE DEMO ===");
        Dog dog = new Dog("Buddy", 3, "Golden Retriever");
        Cat cat = new Cat("Whiskers", 2, true);
        
        dog.dailyRoutine();  // Uses inherited + overridden methods
        dog.fetch();         // Dog-specific method
        
        cat.dailyRoutine();
        cat.scratch();       // Cat-specific method
        
        // Polymorphism Demo
        System.out.println("\\n=== POLYMORPHISM DEMO ===");
        Animal[] animals = {dog, cat};
        for (Animal animal : animals) {
            animal.makeSound();  // Different behavior at runtime
        }
        
        // Abstraction + Polymorphism Demo
        System.out.println("\\n=== ABSTRACTION + POLYMORPHISM DEMO ===");
        PaymentProcessor processor = new PaymentProcessor();
        
        // Same interface, different implementations
        Payment creditCard = new CreditCardPayment("1234567890123456", "John Doe", 5000);
        Payment upi = new UPIPayment("john@upi");
        Payment cash = new CashPayment();
        
        // Processor doesn't know internal details - pure abstraction
        processor.checkout(creditCard, 150.0);
        processor.checkout(upi, 75.0);
        processor.checkout(cash, 50.0);
        
        // Interview Follow-up: Demonstrate method overloading (compile-time polymorphism)
        System.out.println("\\n=== COMPILE-TIME POLYMORPHISM ===");
        printInfo("Text");              // Calls printInfo(String)
        printInfo(42);                  // Calls printInfo(int)
        printInfo(3.14);                // Calls printInfo(double)
        printInfo("Name", 25);          // Calls printInfo(String, int)
    }
    
    // Method Overloading - Compile-time Polymorphism
    static void printInfo(String text) {
        System.out.println("String: " + text);
    }
    
    static void printInfo(int number) {
        System.out.println("Integer: " + number);
    }
    
    static void printInfo(double number) {
        System.out.println("Double: " + number);
    }
    
    static void printInfo(String name, int age) {
        System.out.println("Person: " + name + ", Age: " + age);
    }
}`,

    codeLanguage: "java",
    
    explanation: `This comprehensive example demonstrates all four OOP pillars working together in a production-ready scenario. Key takeaways:

1. **Encapsulation protects invariants** - BankAccount never allows negative balance
2. **Inheritance enables code reuse** - All animals get eat() and sleep() for free
3. **Polymorphism enables flexibility** - PaymentProcessor works with any Payment type without modification
4. **Abstraction hides complexity** - Payment implementations can be complex internally, but expose a simple interface

**Interview Pro Tips:**
• Always mention BOTH compile-time and runtime polymorphism
• Explain that static/final/private methods are NOT polymorphic
• Know the difference: Abstract class (is-a + shared code) vs Interface (can-do capability)
• Composition over inheritance for code reuse when inheritance doesn't fit`,

    visualization: `
┌─────────────────────────────────────────────────────────────────┐
│                    OOP PILLARS RELATIONSHIP                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ ENCAPSULATION│────────▶│ ABSTRACTION  │                     │
│  │   (Data +    │         │ (What not    │                     │
│  │   Behavior)  │         │  How)        │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
│         │  ┌─────────────────────┘                              │
│         │  │                                                     │
│         ▼  ▼                                                     │
│  ┌────────────────┐      ┌──────────────┐                      │
│  │  INHERITANCE   │──────│ POLYMORPHISM │                      │
│  │  (Code Reuse)  │      │ (Many Forms) │                      │
│  └────────────────┘      └──────────────┘                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    POLYMORPHISM IN ACTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Payment payment = ...;  ◀── Reference type         │
│                      ║                                           │
│              ╔═══════╩════════╗                                 │
│              ║                ║                                  │
│         ┌────▼────┐    ┌─────▼─────┐    ┌──────▼──────┐       │
│         │ Credit  │    │    UPI    │    │    Cash     │       │
│         │  Card   │    │  Payment  │    │  Payment    │       │
│         └─────────┘    └───────────┘    └─────────────┘       │
│              ║                ║                  ║              │
│         processPayment()  processPayment()  processPayment()   │
│              ║                ║                  ║              │
│         [Different Implementation Each]                         │
│                                                                  │
│         ▲ Actual object type determines behavior at runtime     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘`,

    followUpQuestions: [
      "How does JVM achieve runtime polymorphism? (Virtual Method Table)",
      "Can you override static methods? (No - method hiding, not overriding)",
      "What's the difference between abstract class and interface? (State + partial implementation vs pure contract)",
      "Why favor composition over inheritance? (Flexibility, loose coupling, avoid fragile base class problem)",
      "What is the diamond problem and how does Java solve it? (Multiple inheritance conflict, solved via single class inheritance + default methods resolution)"
    ]
  },
  
  {
    id: "mem1-enhanced",
    question: "How is memory divided in JVM?",
    answer: `The JVM organizes memory into distinct regions, each serving a specific purpose in program execution. Understanding this layout is crucial for debugging memory issues, optimizing performance, and answering advanced interview questions.

**RUNTIME DATA AREAS (Per JVM Instance)**

**1. HEAP (Shared, GC-Managed)**
The largest memory area where ALL objects and arrays live. Shared across all threads.

• **Young Generation** (Objects born here)
  - Eden Space: New objects allocated here (~80% of young gen)
  - Survivor Space 0 (S0): Objects surviving first GC move here
  - Survivor Space 1 (S1): Objects alternate between S0 and S1
  - Minor GC: Fast, frequent cleanup of young generation
  
• **Old Generation / Tenured** (Long-lived objects)
  - Objects promoted after surviving multiple Minor GCs (default: 8)
  - Major/Full GC: Slower, less frequent cleanup
  
• **MetaSpace** (Java 8+, replaces PermGen)
  - Class metadata, method bytecode, runtime constant pool
  - Uses NATIVE memory (not heap) - can grow automatically
  - Avoids "OutOfMemoryError: PermGen space" issues

**Heap Tuning Flags:**
- \`-Xms512m\` : Initial heap size
- \`-Xmx4g\` : Maximum heap size
- \`-XX:NewRatio=2\` : Old:Young ratio (default 2:1)
- \`-XX:SurvivorRatio=8\` : Eden:Survivor ratio (default 8:1:1)

**2. STACK (Per Thread)**
Each thread has its own stack storing method execution frames.

• **Stack Frame Contents:**
  - Local Variable Array: Method parameters + local variables
  - Operand Stack: Working space for bytecode operations
  - Frame Data: Return address, exception handler info
  
• **What Lives on Stack:**
  - Primitive values (int x = 10)
  - Object references (String s = "hello")
  - Method call chain
  
• **Stack Size:** \`-Xss1m\` (default ~1MB per thread)
• **Error:** StackOverflowError (deep recursion, infinite calls)

**3. METHOD AREA / METASPACE (Shared)**
Stores class-level information.

• **Contents:**
  - Class structure (fields, methods, constructors)
  - Method bytecode
  - Runtime constant pool
  - Static variables
  - JIT compiled code
  
• **Java 7 and Earlier:** PermGen (Permanent Generation)
  - Fixed size: \`-XX:PermSize=64m -XX:MaxPermSize=256m\`
  - Common error: "OutOfMemoryError: PermGen space"
  
• **Java 8+:** MetaSpace
  - Uses native memory (off-heap)
  - Auto-expands (limited by OS memory)
  - Tuning: \`-XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=512m\`

**4. PROGRAM COUNTER (PC) REGISTER (Per Thread)**
Stores address of currently executing JVM instruction.
• Undefined for native methods
• Only memory area that NEVER throws OutOfMemoryError

**5. NATIVE METHOD STACK (Per Thread)**
Separate stack for native (C/C++) methods called via JNI.
• Some JVMs (HotSpot) combine this with Java stack

**MEMORY ERRORS & THEIR CAUSES:**

❌ OutOfMemoryError: Java heap space
  → Too many objects, memory leak, insufficient -Xmx
  
❌ StackOverflowError
  → Infinite recursion, very deep call chain, insufficient -Xss
  
❌ OutOfMemoryError: Metaspace (or PermGen pre-Java 8)
  → Too many classes loaded, classloader leak
  
❌ OutOfMemoryError: unable to create new native thread
  → Too many threads, OS thread limit reached

**REAL-WORLD SCENARIO:**
A web application creates many classes dynamically (Groovy scripts, JSP compilation). Pre-Java 8, this would fill PermGen and crash. Post-Java 8, MetaSpace grows automatically using native memory, preventing this issue.

**Interview Follow-ups:**
Q: "Where do primitives live?" 
A: Stack (if local), heap (if instance field), method area (if static)

Q: "Can stack objects be garbage collected?"
A: No - stack memory is automatically reclaimed when method returns (LIFO)

Q: "Why did Java move from PermGen to MetaSpace?"
A: PermGen had fixed size leading to OOM errors. MetaSpace uses native memory and auto-expands.`,

    code: `// MEMORY LAYOUT DEMONSTRATION

public class MemoryLayoutDemo {
    
    // Static variable - stored in METHOD AREA / METASPACE
    private static int classCounter = 0;
    
    // Instance variables - stored in HEAP (along with object)
    private String name;           // Reference on heap, String object also on heap
    private int age;               // Primitive value on heap (part of object)
    
    public MemoryLayoutDemo(String name, int age) {
        this.name = name;
        this.age = age;
        classCounter++;
    }
    
    public void demonstrateMemoryLayout() {
        // ===============================================
        // STACK MEMORY - Method Frame
        // ===============================================
        
        // Primitive local variable - VALUE on STACK
        int localNumber = 42;
        
        // Object reference - REFERENCE on STACK, object on HEAP
        String localString = "Hello";  // String in pool (heap area)
        
        // Array reference - REFERENCE on STACK, array on HEAP
        int[] numbers = new int[]{1, 2, 3, 4, 5};
        
        // ===============================================
        // HEAP MEMORY - Object Creation
        // ===============================================
        
        // New object - allocated in EDEN space (young generation)
        Person person = new Person("Alice", 30);
        
        // Array of objects - array on heap, objects also on heap
        Person[] team = new Person[3];
        team[0] = new Person("Bob", 25);
        team[1] = new Person("Charlie", 35);
        team[2] = person;  // Reuse existing object reference
        
        // ===============================================
        // METHOD AREA - Class Metadata
        // ===============================================
        
        // Static method call - method bytecode in method area
        String upperName = StringUtils.toUpperCase(localString);
        
        // Accessing static variable - stored in method area
        System.out.println("Total instances created: " + classCounter);
        
        // ===============================================
        // DEMONSTRATION: Stack Frame Lifecycle
        // ===============================================
        
        recursiveMethod(3);  // Watch stack frames grow and shrink
        
    } // localNumber, localString, numbers, person, team, upperName
      // ↑ All stack references are popped here
      // Objects on heap remain until GC collects them
    
    // Recursive method to demonstrate stack growth
    private void recursiveMethod(int depth) {
        System.out.println("Stack depth: " + depth + " - Frame address: " + 
                          Integer.toHexString(System.identityHashCode(this)));
        
        if (depth > 0) {
            // Each call adds a new frame to the stack
            recursiveMethod(depth - 1);
        }
        // Frame is popped when method returns
    }
    
    // Demonstrate StackOverflowError
    public static void causeStackOverflow() {
        // WARNING: This will crash with StackOverflowError
        try {
            causeStackOverflow();  // Infinite recursion
        } catch (StackOverflowError e) {
            System.err.println("StackOverflowError caught!");
            System.err.println("Stack depth exceeded - no more stack space");
        }
    }
    
    // Demonstrate OutOfMemoryError: Heap space
    public static void causeHeapOutOfMemory() {
        try {
            List<byte[]> memoryLeak = new ArrayList<>();
            while (true) {
                // Allocate 1MB arrays until heap is full
                memoryLeak.add(new byte[1024 * 1024]);
                System.out.println("Allocated 1MB, total: " + memoryLeak.size() + "MB");
            }
        } catch (OutOfMemoryError e) {
            System.err.println("OutOfMemoryError: Java heap space");
            System.err.println("Heap is full - cannot allocate more objects");
        }
    }
    
    // Demonstrate MetaSpace (class loading)
    public static void demonstrateMetaspace() {
        System.out.println("\\n=== MetaSpace Demo ===");
        
        // Load class - class metadata goes to MetaSpace
        Class<?> clazz = MemoryLayoutDemo.class;
        
        System.out.println("Class name: " + clazz.getName());
        System.out.println("Methods in class: " + clazz.getDeclaredMethods().length);
        System.out.println("Fields in class: " + clazz.getDeclaredFields().length);
        
        // All this metadata stored in MetaSpace (Java 8+)
        // In Java 7 and earlier, it would be in PermGen
    }
    
    public static void main(String[] args) {
        System.out.println("=== JVM MEMORY LAYOUT DEMONSTRATION ===\\n");
        
        // Stack frame created for main method
        MemoryLayoutDemo demo = new MemoryLayoutDemo("Demo", 1);
        
        // Creates another stack frame
        demo.demonstrateMemoryLayout();
        
        // Display memory information
        System.out.println("\\n=== MEMORY STATISTICS ===");
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();     // -Xmx (maximum heap)
        long allocatedMemory = runtime.totalMemory();  // Currently allocated
        long freeMemory = runtime.freeMemory();   // Free within allocated
        long usedMemory = allocatedMemory - freeMemory;
        
        System.out.println("Max Heap Memory (Xmx): " + (maxMemory / 1024 / 1024) + " MB");
        System.out.println("Allocated Heap: " + (allocatedMemory / 1024 / 1024) + " MB");
        System.out.println("Used Heap: " + (usedMemory / 1024 / 1024) + " MB");
        System.out.println("Free Heap: " + (freeMemory / 1024 / 1024) + " MB");
        
        // Demonstrate MetaSpace
        demonstrateMetaspace();
        
        // Uncomment to see errors (crashes program)
        // causeStackOverflow();
        // causeHeapOutOfMemory();
    }
}

// Helper class for demonstration
class Person {
    String name;
    int age;
    
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// Static utility class
class StringUtils {
    public static String toUpperCase(String input) {
        return input != null ? input.toUpperCase() : null;
    }
}`,

    codeLanguage: "java",
    
    explanation: `This code demonstrates where different types of data live in JVM memory:

**Memory Placement Summary:**
• **Stack**: localNumber (primitive value), localString (reference), numbers (reference)
• **Heap**: Person objects, int[] array, String objects, instance fields
• **Method Area/MetaSpace**: classCounter (static), class bytecode, method definitions

**Key Observations:**
1. Each method call creates a NEW stack frame (see recursiveMethod)
2. Objects survive after method returns (references popped, objects stay on heap until GC)
3. Static members belong to the class (Method Area), not instances
4. Arrays are objects - both array and elements (if objects) live on heap

**Performance Implications:**
• Stack access is faster (LIFO, cache-friendly, no GC overhead)
• Heap access slower but necessary for objects shared across methods
• Large objects in loops cause frequent GC pauses

**Interview Tip:** Explain that primitive local variables are on stack, but primitive instance fields are on heap (part of the object).`,

    visualization: `
┌─────────────────────────────────────────────────────────────────────┐
│                        JVM MEMORY LAYOUT                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          HEAP (Shared)                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Young Generation                            │  │
│  │  ┌──────────────┬─────────────┬─────────────┐                │  │
│  │  │ Eden Space   │ Survivor S0 │ Survivor S1 │                │  │
│  │  │   (~80%)     │    (~10%)   │    (~10%)   │                │  │
│  │  │              │             │             │                │  │
│  │  │ new Person() │ [survived]  │ [survived]  │                │  │
│  │  │ new int[]    │             │             │                │  │
│  │  └──────────────┴─────────────┴─────────────┘                │  │
│  │         │                                                      │  │
│  │         │ After 8 GC cycles (default)                        │  │
│  │         ▼                                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Old Generation / Tenured                          │  │
│  │                                                                 │  │
│  │    [Long-lived objects promoted from Young Gen]                │  │
│  │    Static field objects, cached objects, singletons            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Flags: -Xms (initial) -Xmx (max) -XX:NewRatio=2                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        STACK (Per Thread)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Thread-1 Stack                 Thread-2 Stack                 │  │
│  │  ┌─────────────────────┐       ┌─────────────────────┐        │  │
│  │  │ Frame: method3()    │       │ Frame: run()         │        │  │
│  │  │ - local int x = 5   │       │ - local String s     │        │  │
│  │  │ - Person p (ref)────┼───┐   │ - int counter        │        │  │
│  │  └─────────────────────┘   │   └─────────────────────┘        │  │
│  │  ┌─────────────────────┐   │   ┌─────────────────────┐        │  │
│  │  │ Frame: method2()    │   │   │ Frame: task()        │        │  │
│  │  │ - int y = 10        │   │   │ - data[] (ref)       │        │  │
│  │  └─────────────────────┘   │   └─────────────────────┘        │  │
│  │  ┌─────────────────────┐   │                                   │  │
│  │  │ Frame: method1()    │   │   References point                │  │
│  │  │ - String s (ref)────┼───┼─► to objects on HEAP             │  │
│  │  └─────────────────────┘   │                                   │  │
│  │  ┌─────────────────────┐   │                                   │  │
│  │  │ Frame: main()       │   │                                   │  │
│  │  │ - args[] (ref)──────┼───┘                                   │  │
│  │  └─────────────────────┘                                       │  │
│  │                                                                 │  │
│  │  Flag: -Xss1m (stack size)    Error: StackOverflowError       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   METHOD AREA / METASPACE (Shared)                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Class Metadata                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │ Class: java.lang.String                                   │ │  │
│  │  │  - Field: char[] value                                    │ │  │
│  │  │  - Method: length() { bytecode... }                       │ │  │
│  │  │  - Method: substring(int) { bytecode... }                 │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │ Class: MyClass                                            │ │  │
│  │  │  - static int counter = 0  ◄── Static variables          │ │  │
│  │  │  - Method: myMethod() { bytecode... }                     │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │  Runtime Constant Pool, JIT compiled code                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Java 8+: Uses native memory (off-heap), auto-grows                 │
│  Flag: -XX:MaxMetaspaceSize=512m                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      PC REGISTER (Per Thread)                        │
│                    Stores current instruction address                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  NATIVE METHOD STACK (Per Thread)                    │
│                   For JNI native method calls                        │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

                        OBJECT LIFECYCLE IN MEMORY

1. Object Creation:    new Person("Alice", 30)
                              │
                              ▼
                      [Allocated in Eden Space]
                              │
2. Minor GC #1-7:             │
   Object survives            ▼
                      [Moved to Survivor S0/S1]
                      [Age counter incremented]
                              │
3. Minor GC #8:               │
   Age threshold reached      ▼
                      [Promoted to Old Generation]
                              │
4. No references:             │
   Object unreachable         ▼
                      [Eligible for GC]
                              │
5. Major/Full GC:             │
                              ▼
                      [Memory reclaimed]

═══════════════════════════════════════════════════════════════════════`,

    followUpQuestions: [
      "Where do primitive local variables live? (Stack - as values)",
      "Where do primitive instance fields live? (Heap - part of the object)",
      "What's the difference between PermGen and MetaSpace? (PermGen fixed size, MetaSpace uses native memory)",
      "Can stack memory be garbage collected? (No - auto-managed LIFO)",
      "Why does Java have separate young and old generations? (Generational hypothesis - most objects die young)",
      "What happens when -Xmx is less than -Xms? (JVM error or ignores -Xms)"
    ]
  }
];

// Export for use in the main data file
export { enhancedOOPQuestions };
