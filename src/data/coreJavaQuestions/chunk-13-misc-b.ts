import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Miscellaneous Topics - global questions 122-133.
 * Initialization blocks, tokenizing, and Java object serialization.
 */
export const chunk13MiscB = defineChunk({
  topic: "miscellaneous",
  questions: [
    {
      id: "q122",
      question: "What are initialization blocks?",
      answer:
        "Initialization blocks are pieces of code declared inside a class but outside any method, constructor or field declaration. They run automatically at construction or class-load time, depending on whether they are marked `static`. Java has two kinds: **static initializers** (run once when the class is loaded) and **instance initializers** (run every time a new object is created).\n\n**Why the language has them**: in most cases fields are initialised inline (`private int count = 0;`) or in the constructor. But initialisation blocks are useful when:\n\n- Several constructors must share the same setup logic without writing a separate private helper.\n- You want to initialise anonymous classes, which cannot have a constructor.\n- You want to initialise `final` fields that need a small computation in code.\n\n**Order of execution** for a `new MyClass(...)`:\n\n1. Static fields and static initialisers of the class — once per class, when the class is first used.\n2. Static initialisers of superclasses (run once each, in declaration order up the hierarchy).\n3. Instance fields and instance initialisers — every time, in declaration order.\n4. The constructor body.\n\n**Common use today**: anonymous-class setup (e.g. an `ArrayList<Integer>(){{ add(1); add(2); }}` double-brace idiom — known as an instance initialiser — which is a fun trick but is generally discouraged because it creates a hidden reference to the enclosing instance).",
      code: `class Trace {
    private static final String INIT;
    private final int index;

    // Static initializer block
    static { INIT = \"class loaded\"; System.out.println(INIT); }

    // Instance initializer block
    { index = (int)(Math.random() * 100); System.out.println(\"init index=\" + index); }

    Trace() { System.out.println(\"constructor done\"); }

    public static void main(String[] args) {
        new Trace();
        new Trace();
        // static block prints once; instance + constructor run per object
    }
}`,
      codeLanguage: "java",
      explanation:
        "Static init runs once at class load; instance init runs per object before the constructor body; both fire in declaration order.",
    },
    {
      id: "q123",
      question: "What is a static initializer?",
      answer:
        "A static initializer is a block of code marked `static` and declared anywhere in a class body. It runs exactly once, when the class is initialised — that is, the first time an active use of the class happens (instantiation, static method call, static field read/write, reflective access).\n\n**What you can use it for:**\n\n- **Initialising complex static fields** that cannot be a single expression.\n- **Loading native libraries** via `System.loadLibrary(\"x\")`.\n- **Registering drivers** with `DriverManager.registerDriver(...)`.\n- **Warming up caches** that should be ready when the rest of the code runs.\n\n**Order matters**: static initialisers run in textual order, intermixed with static-field initialisers in source order. If two classes depend on each other's static state, you may need to control the order explicitly or rely on `Class.forName(...)` to force initialisation.\n\n**Failure handling**: any exception thrown inside a static initializer is wrapped in `ExceptionInInitializerError` and the class is marked as erroneous. Subsequent attempts to use the class fail with `NoClassDefFoundError`.\n\n**Alternative since Java 8**: prefer a `private static final` field whose value is computed by a method or initialised in a `static` block, rather than scattering side effects across multiple blocks. Single static initialiser per class is a cleaner default.",
      code: `import java.util.HashMap;
import java.util.Map;

public class Registry {
    private static final Map<String, String> LOOKUP = new HashMap<>();

    static {
        LOOKUP.put(\"IN\", \"India\");
        LOOKUP.put(\"US\", \"United States\");
        LOOKUP.put(\"GB\", \"United Kingdom\");
    }

    public static String nameOf(String code) {
        return LOOKUP.getOrDefault(code, \"Unknown\");
    }

    public static void main(String[] args) {
        System.out.println(nameOf(\"IN\")); // India
        // Static block ran once when the class was first used.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Static initializer = block of code that runs once when the class is first loaded; failures mark the class as erroneous.",
    },
    {
      id: "q124",
      question: "What is an instance initializer block?",
      answer:
        "An instance initializer is a block of code inside a class body but outside any method or constructor. It runs every time an object is created, after explicit field initialisers and before the constructor body.\n\n**When this is useful**:\n\n- **Anonymous classes** cannot have a constructor, so an instance initializer is the only way to run code at construction.\n- **Sharing setup logic** across multiple constructors without needing a private helper method.\n- **Final field assignment** that needs a small computation.\n\n**What it does not do**:\n\n- Replace a constructor — you still need a constructor (anonymous classes auto-supply one).\n- Override a parent constructor — initialisers run as part of construction, not before it.\n\n**Order of execution** for a `new MyClass()`:\n\n1. Super constructor chain runs (`super(...)` first).\n2. Field declarations and instance initialisers, in source order.\n3. The rest of the constructor body.\n\n**The double-brace idiom**: `new ArrayList<>(){{ add(1); add(2); }}` uses an instance initializer inside an anonymous subclass. The anonymous class implicitly captures the enclosing instance, which is the source of subtle leaks — avoid it in library code or when the resulting object outlives the surrounding method.",
      code: `import java.util.ArrayList;
import java.util.List;

public class InstanceInit {
    private final List<String> tags;

    // Instance initializer: runs before every constructor body.
    {
        tags = new ArrayList<>();
        tags.add(\"init\");
        System.out.println(\"instance init ran\");
    }

    InstanceInit() {
        tags.add(\"ctor\");
    }

    public List<String> tags() { return tags; }

    public static void main(String[] args) {
        InstanceInit a = new InstanceInit();
        InstanceInit b = new InstanceInit();
        System.out.println(a.tags()); // [init, ctor]
        System.out.println(b.tags()); // [init, ctor]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Instance initializer runs per object after field initialisers and before the constructor body; useful for anonymous classes.",
    },
    {
      id: "q125",
      question: "What is tokenizing?",
      answer:
        "Tokenizing is splitting a stream of text into discrete units (tokens) such as words, numbers, or punctuation. Java provides several ways:\n\n- **`StringTokenizer`** (legacy, since Java 1.0): recognises whitespace by default, or a configurable set of delimiters, and produces each token in turn. Fast but limited — no regular expressions, no empty tokens, no stream integration.\n- **`String.split(regex)`**: returns a `String[]` of tokens after splitting by a regular expression. Trailing empty strings are dropped unless you pass a negative limit.\n- **`Scanner`** (`java.util.Scanner`): tokenizer for primitive types and Strings using whitespace by default. Built on `Pattern` and integrates with streams and channels.\n- **`java.util.regex.Pattern` + `Matcher`**: full regular-expression parsing, where the tokens are the matches.\n- **`Stream<String>.useDelimiter(...)`** via `Scanner.tokens()` or `Pattern.splitAsStream(...)`.\n\n**Which to choose?**\n\n- `StringTokenizer` is fast for simple cases but rarely the right answer today.\n- `String.split` is fine for one-shot splits; it always builds an array.\n- `Scanner` is the everyday tool for parsing input streams.\n- `Pattern.splitAsStream` integrates with the rest of the Stream API.\n\n**Common pitfall**: confusing `split(\",\")` with `split(\",\", -1)`. The former drops trailing empty strings, which silently changes the length of the result.",
      code: `import java.util.Arrays;
import java.util.Scanner;
import java.util.StringTokenizer;

public class Tokenizing {
    public static void main(String[] args) {
        String line = \"Ada,Lovelace,,1815\";

        String[] bySplit = line.split(\",\");
        System.out.println(Arrays.toString(bySplit)); // [Ada, Lovelace, , 1815]

        String[] bySplitKeepAll = line.split(\",\", -1);
        System.out.println(Arrays.toString(bySplitKeepAll)); // [Ada, Lovelace, , , 1815]

        StringTokenizer st = new StringTokenizer(line, \",\");
        while (st.hasMoreTokens()) System.out.print(\"[\" + st.nextToken() + \"] \");
        System.out.println();

        try (Scanner sc = new Scanner(line).useDelimiter(\",\")) {
            sc.tokens().forEach(t -> System.out.print(\"{\" + t + \"} \"));
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Tokenizing = splitting text into pieces; pick StringTokenizer for legacy code, split/regex for patterns, Scanner for streams.",
    },
    {
      id: "q126",
      question: "Can you give an example of tokenizing?",
      answer:
        "A worked example: read a comma-separated log line, split on commas, then split each field on `=` to extract a key/value pair. This is the core of small CLI tools and CSV readers.\n\n**Pattern**: outer delimiter (`,`) splits the line into fields; inner delimiter (`=`) splits each field into a key and value. The result is a list of pairs you can put into a `Map`.\n\n**Why `Pattern.splitAsStream` is nice**: it does not allocate an intermediate `String[]`. For huge inputs, that matters.\n\n**Why whitespace tokenizing has caveats**: `StringTokenizer` treats consecutive delimiters as one. If you need to preserve empty fields (e.g. CSV), you must use `String.split` with a negative limit, or write a small parser, or use a library like Apache Commons CSV.\n\n**Number parsing too**: `Scanner` can tokenize and parse to `int`, `double`, etc., in one pass, which is why it is the default for simple input parsing in Java.",
      code: `import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class TokenizeExample {
    static Map<String, String> parse(String line) {
        Map<String, String> out = new HashMap<>();
        Pattern.splitAsStream(line, Pattern.compile(\",\"))
                .map(p -> p.split(\"=\", 2))
                .filter(kv -> kv.length == 2)
                .forEach(kv -> out.put(kv[0], kv[1]));
        return out;
    }

    public static void main(String[] args) {
        String line = \"user=ada,role=admin,level=7,team=core\";
        Map<String, String> kv = parse(line);
        kv.forEach((k, v) -> System.out.println(k + \" -> \" + v));
        // user -> ada
        // role -> admin
        // level -> 7
        // team -> core

        // And the same as a one-liner
        Map<String, String> oneLiner = Pattern.compile(\",\")
                .splitAsStream(line)
                .map(p -> p.split(\"=\", 2))
                .collect(Collectors.toMap(p -> p[0], p -> p[1]));
        System.out.println(oneLiner);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Two-stage split: outer delimiter for fields, inner delimiter for key/value; use splitAsStream to avoid the intermediate array.",
    },
    {
      id: "q127",
      question: "What is serialization?",
      answer:
        "Serialization is the process of converting an object's state into a byte stream that can be stored (file, database, cache) or sent over the network, and later reconstructed back into a live object. Java's built-in mechanism implements `java.io.Serializable`, a marker interface with no methods, and uses `ObjectOutputStream` / `ObjectInputStream`.\n\n**Why use it**:\n\n- **Persistence**: save session state, user preferences, or game state across runs.\n- **Communication**: send objects between JVMs (RMI, JMS, custom protocols).\n- **Caching**: store complex object graphs in disk-based caches.\n- **Deep copy**: cloning a serialised graph is one crude but effective way.\n\n**Mechanics**:\n\n- The JVM walks the object graph, recording the class metadata and the values of every non-`transient` non-`static` field.\n- `serialVersionUID` is used at deserialisation time to verify that sender and receiver agree on the class layout. If they differ, deserialisation throws `InvalidClassException`. You should always declare it explicitly; relying on the auto-generated one makes refactoring break silently.\n- Non-serialisable fields must be marked `transient`; they become `null` / zero on deserialisation unless you provide a custom readObject.\n\n**Alternatives**:\n\n- **JSON / XML / Protobuf**: cross-language, smaller, less Java-specific.\n- **Externalizable**: a `Serializable` alternative that lets you decide exactly what to write.\n- **Records**: if your data is a flat record, you can serialise JSON directly.\n\n**Security warning**: Java's built-in serialisation has had many serious CVEs. Never deserialise untrusted input without first configuring an `ObjectInputFilter`.",
      code: `import java.io.Serializable;

public class Account implements Serializable {
    private static final long serialVersionUID = 1L;        // always declare this
    private final String owner;
    private final double balance;
    private transient String passwordHash;                 // not written to the stream

    public Account(String owner, double balance, String pwHash) {
        this.owner = owner; this.balance = balance; this.passwordHash = pwHash;
    }

    @Override public String toString() {
        return \"Account{\" + owner + \", \" + balance + \", pw=\" + passwordHash + \"}\";
    }
}`,
      codeLanguage: "java",
      explanation:
        "Serialization converts state to a byte stream via Serializable; declare serialVersionUID, mark secrets transient, validate on read.",
    },
    {
      id: "q128",
      question: "How do you serialize an object using serializable interface?",
      answer:
        "Three steps: implement `Serializable`, declare `serialVersionUID`, then write the object to an `ObjectOutputStream`.\n\n**Step 1 — Implement `Serializable`**. This is a marker interface, so you do not implement any methods. Its presence tells the JVM that instances of the class are eligible for default serialisation.\n\n**Step 2 — Declare `serialVersionUID`**. Without an explicit declaration, the compiler generates one based on the class signature. Any change to the class invalidates the UID and breaks deserialisation. Always declare it as `private static final long serialVersionUID = 1L;` so that adding fields or refactoring does not silently break compatibility.\n\n**Step 3 — Write the object**. Wrap the destination in an `ObjectOutputStream` and call `writeObject(obj)`. You can chain streams (e.g. `FileOutputStream` for files, `ByteArrayOutputStream` for in-memory blobs).\n\n**Other useful notes**:\n\n- Every non-transient field is serialised, including `private` ones.\n- `static` fields are not serialised (they belong to the class).\n- If a field references a non-serialisable object, the JVM throws `NotSerializableException` unless the field is `transient`.\n- For a class hierarchy, every non-serialisable superclass is excluded — its fields are reset on deserialisation and its constructor runs.",
      code: `import java.io.*;

public class Serialize {
    public static void main(String[] args) throws IOException {
        Account acc = new Account(\"Ada\", 12_345.67, \"sha256:deadbeef\");

        try (ObjectOutputStream out = new ObjectOutputStream(
                new BufferedOutputStream(new FileOutputStream(\"account.ser\")))) {
            out.writeObject(acc);
        }
        // 'account.ser' now contains the byte stream
        System.out.println(\"serialised to account.ser\");
    }
}

class Account implements Serializable {
    private static final long serialVersionUID = 1L;
    private final String owner;
    private final double balance;
    private transient String passwordHash;
    public Account(String o, double b, String p) { owner = o; balance = b; passwordHash = p; }
    @Override public String toString() { return owner + \"=\" + balance + \"/\" + passwordHash; }
}`,
      codeLanguage: "java",
      explanation:
        "Implement Serializable, declare serialVersionUID, then write via ObjectOutputStream.writeObject; transient fields are skipped.",
    },
    {
      id: "q129",
      question: "How do you de-serialize in Java?",
      answer:
        "Deserialisation is the inverse of serialisation: open an `ObjectInputStream` over the source and call `readObject()`. The JVM reads the class metadata, allocates a new instance (skipping constructors and initialisers), and populates fields from the stream. If the stream's class layout does not match the receiving class, the JVM throws `InvalidClassException`.\n\n**The mechanics**:\n\n- `readObject()` returns `Object`; you cast to the expected type.\n- It throws `ClassNotFoundException` if the class is not on the receiver's classpath.\n- It throws `InvalidClassException` if `serialVersionUID` does not match.\n- Non-serialisable superclasses have their constructors run; serialisable superclasses do not.\n- `transient` fields are zero/null after deserialisation unless you implement a private `readObject` to re-create them.\n\n**Security**: in modern Java (since 9, tightened in 17), every deserialisation goes through an `ObjectInputFilter`. Without a custom filter, untrusted input can trigger gadget chains that execute arbitrary code. Always configure a filter or use a safer format like JSON.\n\n**Defensive coding**:\n\n- Validate the input after deserialisation (lengths, ranges).\n- Use `readResolve()` to swap the deserialised object for a singleton or a validated copy.\n- For deep object graphs, prefer libraries like Jackson or Protobuf over native Java serialisation.",
      code: `import java.io.*;

public class Deserialize {
    public static void main(String[] args) throws Exception {
        try (ObjectInputStream in = new ObjectInputStream(
                new BufferedInputStream(new FileInputStream(\"account.ser\")))) {
            // Always filter at the input boundary to avoid gadget chains.
            in.setObjectInputFilter(ObjectInputFilter.Config.createFilter(\"java.lang.Long!;*\" +
                \"java.lang.String!;*\" + \"Account;!*\"));

            Account acc = (Account) in.readObject();
            // 'passwordHash' is transient -> null after read
            System.out.println(acc);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Read with ObjectInputStream.readObject, cast to the type, configure an ObjectInputFilter, never accept untrusted streams without validation.",
    },
    {
      id: "q130",
      question: "What do you do if only parts of the object have to be serialized?",
      answer:
        "Mark the rest `transient`. The JVM skips transient fields during the default write and sets them to default values on the default read. Use this for sensitive fields (passwords, tokens), computed fields (caches, derived counters) and references to non-serialisable resources (sockets, threads, JDBC connections).\n\n**Two flavours of \"partial\" serialisation:**\n\n- **Just skip**: mark the field `transient` and accept that it is null/zero/false after deserialisation. Use `readResolve` or lazy reinitialisation to fix it up later.\n- **Customise the wire format**: implement private `writeObject` and `readObject` methods on the class. The JVM calls them automatically; they take `ObjectOutputStream` / `ObjectInputStream`. Inside them, call `defaultWriteObject` / `defaultReadObject` to handle the non-transient fields, then write the rest yourself (e.g. encrypt the password before writing).\n\n**When to use which**:\n\n- `transient` alone is fine for fields that do not need to survive at all.\n- Custom `writeObject/readObject` is right when you need a different on-the-wire representation — for example, a `Date` stored as a `long`, or a `BigDecimal` stored in a fixed-precision format.\n- `Externalizable` is the explicit alternative: your class implements `writeExternal`/`readExternal` and is in full control of the format.\n\n**Edge case**: the `transient` keyword interacts with `final` fields. A `final transient` field that has no default value will be `null` after deserialisation; the JVM does not run any constructor to set it.",
      code: `import java.io.*;

public class Profile implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String username;
    private final String email;
    private transient String sessionToken;     // not persisted
    private transient long lastSeen;          // not persisted; rebuilt at use

    public Profile(String username, String email) {
        this.username = username;
        this.email = email;
    }

    private void writeObject(ObjectOutputStream out) throws IOException {
        out.defaultWriteObject();             // username + email
        out.writeObject(hashToken(sessionToken));
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();               // username + email
        String hashed = (String) in.readObject();
        // sessionToken must be re-acquired at runtime
    }

    private static String hashToken(String s) { return s == null ? null : Integer.toHexString(s.hashCode()); }
}`,
      codeLanguage: "java",
      explanation:
        "transient skips a field; writeObject/readObject lets you customise the on-wire format and serialise encrypted or hashed values.",
    },
    {
      id: "q131",
      question: "How do you serialize a hierarchy of objects?",
      answer:
        "Serialisation walks the object graph recursively. If a field references another object, that object is serialised too, transitively. The same applies to fields of type `Collection`, array, or `Map` — the JVM iterates and writes each element.\n\n**Hierarchy rules**:\n\n- If **every** class in the hierarchy implements `Serializable`, then no constructors run on the receiving side. The JVM rebuilds the object directly from the stream, working from the topmost non-serialisable superclass down.\n- If a **superclass does not** implement `Serializable`, the JVM runs the closest non-serialisable superclass's constructor, and any non-default-initialised fields above the serialisable boundary are reset to their default values on read.\n- If any object in the graph is **not serialisable and not marked `transient`**, the JVM throws `NotSerializableException`.\n\n**Repeated references are handled correctly**: a graph with two references to the same object is written once and restored as a single shared instance.\n\n**Common pattern**: an abstract base `Person` (non-serialisable because it holds a `Thread`) and concrete `Employee`/`Contractor` subclasses that are serialisable. The JVM runs `Person`'s constructor on read, but the subclass-specific state is restored from the stream.",
      code: `import java.io.*;

public class Hierarchy implements Serializable {
    private static final long serialVersionUID = 1L;

    public static class Vehicle implements Serializable {
        private static final long serialVersionUID = 1L;
        private final String make;
        public Vehicle(String make) { this.make = make; }
        @Override public String toString() { return \"Vehicle(\" + make + \")\"; }
    }

    public static class Car extends Vehicle {
        private final int doors;
        public Car(String make, int doors) { super(make); this.doors = doors; }
        @Override public String toString() { return super.toString() + \" doors=\" + doors; }
    }

    public static void main(String[] args) throws Exception {
        Car car = new Car(\"Honda\", 4);
        try (ObjectOutputStream out = new ObjectOutputStream(
                new ByteArrayOutputStream())) {
            out.writeObject(car);
        }
        // The full hierarchy (Car -> Vehicle -> Object) is serialised.
        System.out.println(car);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Hierarchy = recursive write of every reachable object; non-serialisable ancestors run their constructors on read.",
    },
    {
      id: "q132",
      question: "Are the constructors in an object invoked when it is de-serialized?",
      answer:
        "Constructors of serializable classes are **not** invoked during deserialisation. The JVM allocates memory for the object, reads the bytes straight into the fields, and bypasses constructors and instance initialisers entirely. This is the surprising part of Java's serialisation model.\n\n**However, constructors of non-serializable superclasses *are* invoked**, because those superclasses cannot be reconstructed from the stream. The JVM runs their constructors in the usual way, then reads the serialisable subclass's fields from the stream on top. If the parent constructor sets fields with non-default values, those fields will be reset to the constructor's values before the subclass state is restored — a behaviour that bites people who try to rely on field initialisers.\n\n**Consequences for design**:\n\n- A `readResolve` hook or a `readObject` method is the right place to put any restoration logic that would normally live in a constructor.\n- `final` fields can be assigned by deserialisation even when they were not assigned in the constructor — the JVM uses a special reflective bypass.\n- Validation in the constructor does NOT run on read; if it is critical, do it again in `readObject` or `readResolve`.\n\n**Practical tip**: write a unit test that round-trips an object and asserts the post-deserialisation invariants. It will catch \"we assumed the constructor ran\" bugs that otherwise hide for months.",
      code: `import java.io.*;

public class NoConstructorOnRead implements Serializable {
    private static final long serialVersionUID = 1L;
    private final int seed;

    public NoConstructorOnRead(int seed) {
        System.out.println(\"constructor ran for seed=\" + seed);
        this.seed = seed;
    }

    public static void main(String[] args) throws Exception {
        var orig = new NoConstructorOnRead(42);

        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(buf)) {
            out.writeObject(orig);
        }
        // Notice the 'constructor ran' line printed exactly once above.

        try (ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(buf.toByteArray()))) {
            var copy = (NoConstructorOnRead) in.readObject();
            // No 'constructor ran' line is printed for the copy.
            System.out.println(\"copy.seed=\" + copy.seed);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Serializable-class constructors are skipped during read; non-serialisable superclass constructors still run; do validation in readObject/readResolve.",
    },
    {
      id: "q133",
      question: "Are the values of static variables stored when an object is serialized?",
      answer:
        "No. Static fields belong to the class, not to any object. The serialisation stream only contains the runtime class metadata and the instance fields; static fields are not part of any object's state.\n\n**What this means in practice**:\n\n- If you change a static field's value between writing and reading, the deserialised object will see the new value (because the class is loaded fresh on the receiver).\n- This is actually a feature: configuration that lives in static fields is naturally portable across serialisation boundaries. The receiver's JVM picks up the local class's static state.\n- It is also a footgun: if you depend on a static field for security or correctness (e.g. a license-check flag), an attacker who controls the receiver's classpath can change that flag at will.\n\n**Practical recommendations**:\n\n- Do not store data in static fields that you expect to round-trip with a serialised object.\n- If you really need \"global\" state to survive serialisation, store it in instance fields and recover it on read.\n- For configuration that should travel with the object, prefer explicit serialised fields over static constants.\n\n**Why is this worth a question?** Because it surprises people who assume the JVM writes \"everything\" about the object. Static state is not part of the object — it is part of the class, and the receiver gets its own copy.",
      code: `import java.io.*;

public class StaticNotSerialized implements Serializable {
    private static final long serialVersionUID = 1L;
    private static int counter = 0;             // not part of any instance
    private final int id;

    StaticNotSerialized() { id = ++counter; }

    public static void main(String[] args) throws Exception {
        var a = new StaticNotSerialized();           // counter=1, id=1
        var b = new StaticNotSerialized();           // counter=2, id=2
        System.out.println(\"before: \" + a.id + \" \" + b.id);

        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(buf)) { out.writeObject(a); }

        StaticNotSerialized.counter = 999;            // change static between write/read

        try (ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(buf.toByteArray()))) {
            var c = (StaticNotSerialized) in.readObject();
            System.out.println(\"after read: \" + c.id + \" (static now=\" + counter + \")\");
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Static fields belong to the class; the stream carries only instance fields; receiver sees its own static state on read.",
    },
  ],
  meta: {
    q122: { difficulty: "medium", priority: "medium", tags: ["initialization", "blocks"], relatedQuestionIds: ["q123", "q124"], estimatedReadMinutes: 3 },
    q123: { difficulty: "medium", priority: "medium", tags: ["static-init", "classload"], relatedQuestionIds: ["q122", "q124"], estimatedReadMinutes: 3 },
    q124: { difficulty: "medium", priority: "medium", tags: ["instance-init", "anonymous"], relatedQuestionIds: ["q122", "q123"], estimatedReadMinutes: 3 },
    q125: { difficulty: "easy", priority: "medium", tags: ["tokenizing", "strings"], relatedQuestionIds: ["q126", "q022"], estimatedReadMinutes: 2 },
    q126: { difficulty: "easy", priority: "medium", tags: ["tokenizing", "regex"], relatedQuestionIds: ["q125", "q126"], estimatedReadMinutes: 2 },
    q127: { difficulty: "medium", priority: "very-high", tags: ["serialization", "io"], relatedQuestionIds: ["q128", "q129"], estimatedReadMinutes: 3 },
    q128: { difficulty: "medium", priority: "very-high", tags: ["serialization", "io"], relatedQuestionIds: ["q127", "q129"], estimatedReadMinutes: 3 },
    q129: { difficulty: "medium", priority: "very-high", tags: ["deserialization", "io"], relatedQuestionIds: ["q127", "q128"], estimatedReadMinutes: 3 },
    q130: { difficulty: "medium", priority: "high", tags: ["transient", "custom"], relatedQuestionIds: ["q128", "q129"], estimatedReadMinutes: 3 },
    q131: { difficulty: "medium", priority: "high", tags: ["serialization", "hierarchy"], relatedQuestionIds: ["q130", "q132"], estimatedReadMinutes: 3 },
    q132: { difficulty: "medium", priority: "high", tags: ["serialization", "constructors"], relatedQuestionIds: ["q131", "q133"], estimatedReadMinutes: 3 },
    q133: { difficulty: "medium", priority: "high", tags: ["serialization", "static"], relatedQuestionIds: ["q132", "q127"], estimatedReadMinutes: 3 },
  },
});