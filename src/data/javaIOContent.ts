import { ContentSection } from "./recursionContent";

export const javaIOContent: ContentSection[] = [
  {
    id: "io-streams",
    title: "Byte & Character Streams",
    difficulty: "Easy",
    theory: [
      "Java I/O is based on **streams** — a sequence of data flowing from a source to a destination",
      "**Byte streams** handle raw binary data (images, files). Base classes: **InputStream**, **OutputStream**",
      "**Character streams** handle text data with encoding support. Base classes: **Reader**, **Writer**",
      "**FileInputStream / FileOutputStream** — read/write raw bytes from/to files",
      "**FileReader / FileWriter** — read/write characters (text) from/to files",
      "Character streams automatically handle **character encoding** (UTF-8, etc.) — prefer them for text",
      "Always **close** streams after use — use try-with-resources for automatic closing"
    ],
    diagram: {
      type: "table-visual",
      title: "I/O Streams — Byte vs Character",
      data: [
        {
          label: "Byte Streams (Binary Data)",
          color: "primary",
          children: [
            { label: "InputStream → FileInputStream, BufferedInputStream" },
            { label: "OutputStream → FileOutputStream, BufferedOutputStream" },
            { label: "Use for: images, PDFs, binary files" },
            { label: "Base unit: byte (8 bits)" }
          ]
        },
        {
          label: "Character Streams (Text Data)",
          color: "success",
          children: [
            { label: "Reader → FileReader, BufferedReader" },
            { label: "Writer → FileWriter, BufferedWriter, PrintWriter" },
            { label: "Use for: .txt, .csv, text-based files" },
            { label: "Base unit: char (16-bit Unicode)" }
          ]
        }
      ]
    },
    code: [
      {
        title: "Byte Streams — Reading & Writing Files",
        language: "java",
        content: `import java.io.*;

public class ByteStreamDemo {
    public static void main(String[] args) {
        // Writing bytes to a file
        try (FileOutputStream fos = new FileOutputStream("output.bin")) {
            byte[] data = {72, 101, 108, 108, 111}; // "Hello" in ASCII
            fos.write(data);
            fos.write('!');
            System.out.println("Bytes written!");
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // Reading bytes from a file
        try (FileInputStream fis = new FileInputStream("output.bin")) {
            int byteVal;
            while ((byteVal = fis.read()) != -1) { // -1 = end of file
                System.out.print((char) byteVal);
            }
            System.out.println();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}`
      },
      {
        title: "Character Streams — Reading & Writing Text",
        language: "java",
        content: `import java.io.*;

public class CharStreamDemo {
    public static void main(String[] args) {
        // Writing text
        try (FileWriter fw = new FileWriter("hello.txt")) {
            fw.write("Hello, Java I/O!\\n");
            fw.write("Character streams handle encoding automatically.");
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // Reading text
        try (FileReader fr = new FileReader("hello.txt")) {
            int ch;
            while ((ch = fr.read()) != -1) {
                System.out.print((char) ch);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}`
      }
    ],
    tip: "Use **byte streams** for binary data (images, PDFs). Use **character streams** for text files."
  },
  {
    id: "io-buffered",
    title: "Buffered Streams",
    difficulty: "Easy",
    theory: [
      "**Buffered streams** wrap other streams and add an internal buffer — dramatically improving performance",
      "Without buffering, each read()/write() makes a system call. With buffering, data is read/written in chunks",
      "**BufferedReader** — wraps Reader, provides `readLine()` method for reading text line by line",
      "**BufferedWriter** — wraps Writer, provides `newLine()` method for platform-independent line breaks",
      "**BufferedInputStream / BufferedOutputStream** — buffered byte streams",
      "Default buffer size is 8192 bytes (8 KB). You can specify a custom size",
      "**PrintWriter** — convenience class that combines buffering, formatting, and auto-flushing"
    ],
    code: [
      {
        title: "BufferedReader & BufferedWriter",
        language: "java",
        content: `import java.io.*;

public class BufferedDemo {
    public static void main(String[] args) {
        // Writing with BufferedWriter
        try (BufferedWriter bw = new BufferedWriter(new FileWriter("data.txt"))) {
            bw.write("Line 1: Hello");
            bw.newLine(); // platform-independent newline
            bw.write("Line 2: World");
            bw.newLine();
            bw.write("Line 3: Java I/O");
            System.out.println("Written successfully!");
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // Reading with BufferedReader — line by line
        try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
            String line;
            int lineNum = 1;
            while ((line = br.readLine()) != null) {
                System.out.println(lineNum++ + ": " + line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // PrintWriter — convenient formatted output
        try (PrintWriter pw = new PrintWriter(new BufferedWriter(new FileWriter("log.txt")))) {
            pw.println("Log entry 1");
            pw.printf("Value: %d, Name: %s%n", 42, "Alice");
            pw.println("Done!");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}`
      },
      {
        title: "Fast I/O for Competitive Programming",
        language: "java",
        content: `import java.io.*;
import java.util.*;

public class FastIO {
    public static void main(String[] args) throws IOException {
        // Fast input — BufferedReader + StringTokenizer
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        
        // Read number of test cases
        int t = Integer.parseInt(br.readLine().trim());
        while (t-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int n = Integer.parseInt(st.nextToken());
            int m = Integer.parseInt(st.nextToken());
            
            // Read array
            st = new StringTokenizer(br.readLine());
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = Integer.parseInt(st.nextToken());
            }
            
            // Process and output
            long sum = 0;
            for (int x : arr) sum += x;
            sb.append(sum).append("\\n");
        }
        
        // Fast output — print all at once
        System.out.print(sb);
        br.close();
    }
}`
      }
    ],
    note: "In competitive programming, **BufferedReader + StringTokenizer** is ~5x faster than Scanner for large inputs."
  },
  {
    id: "io-file",
    title: "File & Path Operations",
    difficulty: "Medium",
    theory: [
      "**java.io.File** — legacy class for file/directory operations (exists since Java 1.0)",
      "**java.nio.file.Path** — modern replacement (Java 7+), more powerful and consistent",
      "**java.nio.file.Files** — utility class with static methods for file operations",
      "**Path operations:** resolve, relativize, getParent, getFileName, normalize",
      "**Files operations:** read, write, copy, move, delete, list directory, walk tree, check existence",
      "**Files.readAllLines()** — read entire file into List<String>",
      "**Files.write()** — write lines or bytes to file in one call",
      "**Files.walk()** — recursively traverse directory tree as a Stream<Path>"
    ],
    code: [
      {
        title: "File & Path — Modern Java I/O",
        language: "java",
        content: `import java.io.*;
import java.nio.file.*;
import java.util.*;

public class FilePathDemo {
    public static void main(String[] args) throws IOException {
        // Path creation
        Path path = Path.of("data", "example.txt");
        System.out.println("Path: " + path);           // data/example.txt
        System.out.println("Parent: " + path.getParent()); // data
        System.out.println("Filename: " + path.getFileName()); // example.txt
        System.out.println("Absolute: " + path.toAbsolutePath());
        
        // Create directories
        Files.createDirectories(Path.of("data"));
        
        // Write to file
        List<String> lines = List.of("Line 1", "Line 2", "Line 3");
        Files.write(Path.of("data/example.txt"), lines);
        
        // Read entire file
        List<String> readLines = Files.readAllLines(Path.of("data/example.txt"));
        readLines.forEach(System.out::println);
        
        // Read as string (Java 11+)
        String content = Files.readString(Path.of("data/example.txt"));
        System.out.println("Content: " + content);
        
        // File metadata
        Path p = Path.of("data/example.txt");
        System.out.println("Exists: " + Files.exists(p));
        System.out.println("Size: " + Files.size(p) + " bytes");
        System.out.println("Is directory: " + Files.isDirectory(p));
        
        // Copy & Move
        Files.copy(p, Path.of("data/backup.txt"), StandardCopyOption.REPLACE_EXISTING);
        // Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        
        // List directory
        try (var stream = Files.list(Path.of("data"))) {
            stream.forEach(System.out::println);
        }
        
        // Walk directory tree recursively
        try (var walk = Files.walk(Path.of("data"))) {
            walk.filter(Files::isRegularFile)
                .forEach(System.out::println);
        }
        
        // Clean up
        Files.deleteIfExists(Path.of("data/backup.txt"));
    }
}`
      }
    ],
    tip: "Prefer **java.nio.file.Path** and **Files** over the legacy **java.io.File** — they're more powerful and have better error handling."
  },
  {
    id: "io-nio",
    title: "NIO & NIO.2",
    difficulty: "Hard",
    theory: [
      "**NIO (New I/O)** introduced in Java 1.4 — provides **channels**, **buffers**, and **selectors** for high-performance I/O",
      "**Channel** — a connection to an I/O device. Can read/write, is bidirectional, works with Buffers",
      "**Buffer** — a container for data (ByteBuffer, CharBuffer, etc.). Has position, limit, capacity",
      "**Buffer operations:** put() → flip() → get() → clear()/compact()",
      "**NIO.2** (Java 7) added **Path**, **Files**, **FileSystem**, **WatchService** — modern file I/O",
      "**WatchService** — monitors a directory for file changes (create, modify, delete)",
      "NIO is **non-blocking** — a single thread can manage multiple channels using Selectors",
      "Use NIO for: high-performance servers, large file processing, file monitoring"
    ],
    code: [
      {
        title: "NIO — ByteBuffer & FileChannel",
        language: "java",
        content: `import java.nio.*;
import java.nio.file.*;
import java.nio.channels.*;
import java.io.*;

public class NIODemo {
    public static void main(String[] args) throws Exception {
        // ByteBuffer basics
        ByteBuffer buf = ByteBuffer.allocate(1024);
        
        // Write to buffer
        buf.put("Hello NIO!".getBytes());
        System.out.println("Position after put: " + buf.position()); // 10
        
        // Flip — switch from write mode to read mode
        buf.flip();
        System.out.println("After flip - position: " + buf.position() + ", limit: " + buf.limit());
        
        // Read from buffer
        byte[] data = new byte[buf.remaining()];
        buf.get(data);
        System.out.println(new String(data)); // Hello NIO!
        
        // FileChannel — read/write files
        // Writing
        try (FileChannel fc = FileChannel.open(Path.of("nio.txt"),
                StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
            ByteBuffer writeBuf = ByteBuffer.wrap("NIO File Channel!".getBytes());
            fc.write(writeBuf);
        }
        
        // Reading
        try (FileChannel fc = FileChannel.open(Path.of("nio.txt"), StandardOpenOption.READ)) {
            ByteBuffer readBuf = ByteBuffer.allocate((int) fc.size());
            fc.read(readBuf);
            readBuf.flip();
            System.out.println(new String(readBuf.array(), 0, readBuf.limit()));
        }
        
        Files.deleteIfExists(Path.of("nio.txt"));
    }
}`
      },
      {
        title: "WatchService — File System Monitoring",
        language: "java",
        content: `import java.nio.file.*;

public class WatchServiceDemo {
    public static void main(String[] args) throws Exception {
        Path dir = Path.of("watched-dir");
        Files.createDirectories(dir);
        
        WatchService watcher = FileSystems.getDefault().newWatchService();
        dir.register(watcher,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_MODIFY,
            StandardWatchEventKinds.ENTRY_DELETE);
        
        System.out.println("Watching directory: " + dir.toAbsolutePath());
        System.out.println("Create/modify/delete files in this directory...");
        
        // Watch loop
        while (true) {
            WatchKey key = watcher.take(); // blocks until event
            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();
                Path fileName = (Path) event.context();
                System.out.println(kind.name() + ": " + fileName);
            }
            if (!key.reset()) break; // directory no longer accessible
        }
    }
}`
      }
    ],
    note: "NIO ByteBuffer has two modes: **write mode** (put data in) and **read mode** (get data out). Call **flip()** to switch from write to read."
  },
  {
    id: "io-serial",
    title: "Serialization & Deserialization",
    difficulty: "Medium",
    theory: [
      "**Serialization** converts a Java object into a **byte stream** — for storage or transmission",
      "**Deserialization** reconstructs the object from the byte stream",
      "A class must implement **java.io.Serializable** (marker interface) to be serializable",
      "**serialVersionUID** — a version identifier. If not specified, JVM generates one. Always define it explicitly",
      "**transient** keyword — marks a field to be excluded from serialization (passwords, caches, etc.)",
      "**ObjectOutputStream** writes objects. **ObjectInputStream** reads objects",
      "**static fields** are NOT serialized — they belong to the class, not the instance",
      "Modern alternative: use **JSON** (Jackson/Gson) or **Protocol Buffers** instead of Java serialization"
    ],
    code: [
      {
        title: "Serialization & Deserialization",
        language: "java",
        content: `import java.io.*;

class Person implements Serializable {
    private static final long serialVersionUID = 1L; // always define!
    
    private String name;
    private int age;
    private transient String password; // NOT serialized
    
    public Person(String name, int age, String password) {
        this.name = name;
        this.age = age;
        this.password = password;
    }
    
    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + ", password='" + password + "'}";
    }
}

public class SerializationDemo {
    public static void main(String[] args) throws Exception {
        Person person = new Person("Alice", 25, "secret123");
        
        // Serialize — write object to file
        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream("person.ser"))) {
            oos.writeObject(person);
            System.out.println("Serialized: " + person);
        }
        
        // Deserialize — read object from file
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("person.ser"))) {
            Person loaded = (Person) ois.readObject();
            System.out.println("Deserialized: " + loaded);
            // password will be null (transient)
        }
        
        // Clean up
        new File("person.ser").delete();
    }
}`
      }
    ],
    warning: "Java serialization has **security vulnerabilities** — never deserialize untrusted data. Prefer JSON/Protobuf for data exchange."
  },
  {
    id: "io-properties",
    title: "Properties & Configuration",
    difficulty: "Easy",
    theory: [
      "**Properties** class stores key-value pairs — commonly used for application configuration",
      "Properties files use `.properties` extension with `key=value` syntax, one per line",
      "**load(InputStream)** reads from file. **store(OutputStream, comment)** writes to file",
      "**getProperty(key)** returns value or null. **getProperty(key, default)** returns default if missing",
      "Properties extends Hashtable — but use it only for String key-value config, not as a general map",
      "Comments in .properties files start with `#` or `!`",
      "For complex config, consider **YAML** (SnakeYAML) or **JSON** libraries instead"
    ],
    code: [
      {
        title: "Properties — Reading & Writing Config",
        language: "java",
        content: `import java.io.*;
import java.util.*;

public class PropertiesDemo {
    public static void main(String[] args) throws IOException {
        // Create and save properties
        Properties config = new Properties();
        config.setProperty("db.host", "localhost");
        config.setProperty("db.port", "5432");
        config.setProperty("db.name", "myapp");
        config.setProperty("app.debug", "true");
        
        // Save to file
        try (FileOutputStream fos = new FileOutputStream("config.properties")) {
            config.store(fos, "Application Configuration");
        }
        
        // Load from file
        Properties loaded = new Properties();
        try (FileInputStream fis = new FileInputStream("config.properties")) {
            loaded.load(fis);
        }
        
        // Read values
        String host = loaded.getProperty("db.host");
        String port = loaded.getProperty("db.port");
        String timeout = loaded.getProperty("db.timeout", "30"); // with default
        
        System.out.println("Host: " + host);       // localhost
        System.out.println("Port: " + port);       // 5432
        System.out.println("Timeout: " + timeout); // 30 (default)
        
        // List all properties
        System.out.println("\\nAll properties:");
        loaded.forEach((k, v) -> System.out.println("  " + k + " = " + v));
        
        // Load from classpath (resource)
        // Properties res = new Properties();
        // res.load(PropertiesDemo.class.getResourceAsStream("/app.properties"));
        
        // Clean up
        new File("config.properties").delete();
    }
}`
      }
    ],
    tip: "Store config files in `src/main/resources` and load them using `getClass().getResourceAsStream()` — this works in JARs too."
  }
];
