import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Exception Handling — global questions 101-108.
 * Second half of the exception-handling topic: throwing, checked-exception
 * strategies, custom exceptions, multi-catch, try-with-resources and practices.
 */
export const chunk11ExceptionsB = defineChunk({
  topic: "exception-handling",
  questions: [
    {
      id: "q101",
      question: "How do you throw an exception from a method?",
      answer:
        "Throwing an exception takes two keywords: you construct the object with `new`, then hand it to the runtime with `throw`. `throw new IllegalArgumentException(\"quantity must be positive\")` aborts the current method immediately — no statement after it in that block runs — and the JVM begins unwinding the stack, looking for the nearest matching `catch`.\n\n**The rules that actually matter:**\n\n- **Throwable subtypes only**: the thrown expression must be a subtype of `Throwable`. You cannot throw a `String` or an arbitrary object.\n- **The static type decides the contract**: unchecked types (`RuntimeException`, `Error` subtrees) need no declaration; checked types must be caught or declared with `throws`.\n- **Rethrowing stays precise**: with Java 7+ precise-rethrow analysis, `catch (IOException e) { throw e; }` keeps the specific type, so a method declaring `throws IOException` still compiles even when the try body can throw several subclasses.\n- **Wrapping preserves history**: `throw new ServiceException(\"load failed\", e)` keeps the original exception as the cause, so the root failure never disappears from the stack trace.\n\nA `throws` clause turns failure into an explicit, compiler-verified part of the method signature, which is the entire point — callers cannot pretend the method always succeeds. If you neither catch nor declare, `javac` reports \"unreported exception ...; must be caught or declared to be thrown\". One trap worth naming: static initialisers cannot declare checked exceptions, so a failure there must be caught or wrapped.",
      code: `public class WithdrawService {
    static class InsufficientFundsException extends Exception {  // checked
        InsufficientFundsException(String message) { super(message); }
    }

    /** Declares the checked type, so every caller must now deal with it. */
    static void withdraw(double balance, double amount) throws InsufficientFundsException {
        if (amount <= 0) {
            // Unchecked, so no throws clause is needed for this one
            throw new IllegalArgumentException("amount must be positive: " + amount);
        }
        if (amount > balance) {
            // Construct the object, then hand it to the runtime
            throw new InsufficientFundsException("balance " + balance + " < " + amount);
        }
        System.out.println("withdrew " + amount);
    }

    public static void main(String[] args) {
        try {
            withdraw(100.0, 250.0);
        } catch (InsufficientFundsException e) {
            System.out.println("rejected: " + e.getMessage());
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "They test whether you know throw needs a Throwable subtype and that checked exceptions must be caught or declared in the signature.",
    },
    {
      id: "q102",
      question: "What happens when you throw a checked exception from a method?",
      answer:
        "When a method body throws a checked exception and does not catch it, that failure becomes part of the method's type. The compiler then demands the signature declare it, or the method handle it; there is no third option. If `readConfig()` can throw `IOException` and does not catch it, you must write `String readConfig(String path) throws IOException` or the code simply will not compile.\n\n**What that obligation buys and costs:**\n\n- **The requirement propagates to callers**: every caller must catch the exception or add its own `throws`, which is why a checked exception forces acknowledgement at each frame while an unchecked one can traverse twenty frames unnoticed.\n- **Unchecked exceptions travel silently**: `RuntimeException` and `Error` subtypes need no declaration, so a `NullPointerException` can escape any method with nothing in the signature warning about it. The asymmetry is deliberate — checked types model recoverable conditions, unchecked types model programming errors.\n- **Overriding cannot widen the contract**: an override may declare the same checked types or narrower ones, never new or broader ones. That is why `Runnable.run()` cannot throw a checked exception and why a lambda must catch and wrap instead of declaring.\n\nIn practice `throws` is the strongest documentation a Java method can carry, because the compiler enforces it. The failure mode is overuse: a blanket `throws Exception` on every method forces callers into `catch (Exception e)`, which is exactly where genuine bugs start hiding.",
      code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class CheckedPropagation {
    /** Declared, so the compiler now validates every caller. */
    static String readConfig(String path) throws IOException {
        return Files.readString(Paths.get(path)); // may throw IOException
    }

    static int parsePort(String raw) {
        if (raw == null) {
            // Unchecked: no throws clause, callers get no compiler warning
            throw new NullPointerException("raw port is null");
        }
        return Integer.parseInt(raw);
    }

    public static void main(String[] args) {
        try {
            System.out.println(readConfig("app.properties"));
        } catch (IOException e) {              // the caller must handle it
            System.err.println("config failed: " + e.getMessage());
        }
        System.out.println("port = " + parsePort("8080")); // silent risk
    }
}`,
      codeLanguage: "java",
      explanation:
        "The differentiator is that checked exceptions are compile-time contract obligations, while unchecked ones travel silently up the call stack.",
    },
    {
      id: "q103",
      question:
        "What are the options you have to eliminate compilation errors when handling checked exceptions?",
      answer:
        "There are exactly three legitimate ways to make a checked-exception compile error disappear. All three are valid Java; the right one is decided by what the enclosing layer is responsible for.\n\n- **Catch and handle it**: the method contains a `catch` block that genuinely recovers — returning a default, retrying, or translating to a result object. Do this at the level that actually knows what recovery means.\n- **Declare it with `throws` and let it propagate**: appropriate when the method genuinely cannot decide the outcome, such as a low-level `readBytes()` helper. Push the decision to the caller who has the business context.\n- **Wrap it in an unchecked exception and rethrow**: `catch (IOException e) { throw new UncheckedIOException(e); }` converts a checked failure into a runtime one, which is precisely what the collections, streams and JPA APIs do. Always pass the cause.\n\nThe fourth thing people actually do — an empty `catch` block, or one that only logs — compiles but is not a legitimate option, because it converts a visible failure into silent corruption.\n\n**Choosing by layer is the real answer**: a repository wraps storage failures into a domain runtime exception; a service decides whether to compensate or fail the request; a web boundary maps domain exceptions to HTTP status codes. Narrow `throws` clauses plus precise wrapping keep a call chain readable, whereas blanket `throws Exception` signatures push every caller into `catch (Exception e)`.",
      code: `import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class CheckedOptions {
    // Option 1 - handle it here and recover
    static String loadOrDefault(String file) {
        try {
            return Files.readString(Paths.get(file));
        } catch (IOException e) {
            System.err.println("using defaults: " + e.getMessage());
            return "default=true";
        }
    }

    // Option 2 - declare it and let the caller decide
    static String load(String file) throws IOException {
        return Files.readString(Paths.get(file));
    }

    // Option 3 - wrap it, rethrow unchecked, keep the cause
    static String loadOrFail(String file) {
        try {
            return Files.readString(Paths.get(file));
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + file, e);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name catch, declare, and wrap-as-unchecked, then justify the pick by layer responsibility and call the empty catch the anti-pattern.",
    },
    {
      id: "q104",
      question: "How do you create a custom exception?",
      answer:
        "A custom exception is a subclass of an existing exception, and the parent you pick is the design decision. Extend `Exception` when callers must be forced to handle the condition; extend `RuntimeException` when it is a programming error or when a checked exception would pollute dozens of signatures. Do not extend `Throwable` or `Error` directly: `Throwable` is too generic to be meaningful, and `Error` is reserved for failures the JVM itself cannot recover from, which applications should not catch.\n\n**What a well-built custom exception contains:**\n\n- **A name that reads like a sentence**: `InsufficientFundsException` or `InvalidOrderStateException` tells the reader everything in the `catch` clause. Avoid an `Error` suffix for non-`Error` types.\n- **At least two constructors**: `(String message)` and `(String message, Throwable cause)`. The cause constructor is what preserves the original stack trace when you wrap a lower-level failure.\n- **A declared `serialVersionUID`**: exceptions are `Serializable`, and a stable id prevents `InvalidClassException` when one crosses a serialization or RPC boundary.\n- **An optional domain payload**: a field such as the rejected amount or the order id lets handlers act without parsing the message text. Keep the exception immutable so it is safe to share across threads.\n\nFinally, resist building a hierarchy of near-identical types. One `ValidationException` carrying an error code is usually better than thirty subclasses that nobody catches individually.",
      code: `public class InsufficientFundsException extends Exception {
    private static final long serialVersionUID = 1L;
    private final double shortfall;

    public InsufficientFundsException(String message) {
        super(message);
        this.shortfall = 0.0;
    }

    public InsufficientFundsException(String message, double shortfall, Throwable cause) {
        super(message, cause);            // keeps the original stack trace
        this.shortfall = shortfall;
    }

    public double getShortfall() {
        return shortfall;
    }

    static double parseBalance(String raw) throws InsufficientFundsException {
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            throw new InsufficientFundsException("bad balance: " + raw, 0.0, e);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Check the parent-class choice, both constructors including the cause, serialVersionUID, and that you never extend Throwable or Error directly.",
    },
    {
      id: "q105",
      question:
        "How do you handle multiple exception types with same exception handling block?",
      answer:
        "Java 7 introduced **multi-catch** precisely so that several unrelated exception types could share one handler: `catch (IOException | SQLException e)`. Before that you had to catch their common supertype — usually `Exception` — which widened the handler to types you never intended to handle.\n\n**How multi-catch behaves:**\n\n- **The parameter is implicitly `final`**: you cannot reassign `e`, which prevents the classic bug of replacing the caught exception halfway through the handler. That restriction is also what lets the compiler hold one reference whose static type is the least upper bound of the listed types.\n- **Only common members are callable**: with `IOException | SQLException` you may call `getMessage()`, `printStackTrace()` and `getCause()`, but not `getErrorCode()`. Needing a type-specific call is the compiler telling you the recovery differs and the blocks should be split.\n- **Separate blocks still have their place**: they must be ordered most-specific-first, because an unreachable catch is a **compile error** — `catch (Exception e)` above `catch (IOException e)` fails with \"exception IOException has already been caught\", and catching a checked type the try body cannot throw also fails.\n\nThe rule of thumb: use multi-catch when the handling is genuinely identical, such as translating two transport failures into one retryable service error, and split it when messages, retry policy or status codes differ. Multi-catch removes duplication, never the obligation to handle each subtype sensibly.",
      code: `import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

public class MultiCatchDemo {
    static List<String> readFile(String file) throws IOException {
        return Arrays.asList("file-row:" + file);
    }

    static List<String> queryDatabase(String sql) throws SQLException {
        return Arrays.asList("db-row:" + sql);
    }

    static List<String> fetch(String source) {
        try {
            // Two branches that throw unrelated checked types
            return source.endsWith(".sql")
                    ? queryDatabase(source)
                    : readFile(source);
        } catch (IOException | SQLException e) {   // Java 7+ multi-catch
            // 'e' is implicitly final; type is the common supertype
            System.err.println("fetch failed: " + e);
            return Arrays.asList();
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want Java 7 multi-catch, the implicitly final common-supertype parameter, and that unreachable catch blocks are compile errors.",
    },
    {
      id: "q106",
      question: "Can you explain about try with resources?",
      answer:
        "`try`-with-resources, added in Java 7, is the language idiom for deterministic cleanup. Any resource declared in the try header is closed automatically when the block exits — whether it completes normally, returns from inside, or throws. The canonical case is a stream, socket or JDBC connection that must not leak when the body fails halfway through.\n\n**What interviewers expect you to cover:**\n\n- **The resource must implement `AutoCloseable`**: `Closeable` extends it and narrows `close()` to throw `IOException`. Any class you write that holds a native handle, lock or socket should implement it too.\n- **Resources close in reverse declaration order**, so the most recently opened resource closes first — a buffered wrapper is flushed and closed before the underlying stream is released.\n- **A failing `close()` never masks the real failure**: if the body throws and `close()` also throws, the body's exception propagates and the close exception is attached as suppressed, retrievable via `getSuppressed()`.\n- **Java 9 relaxed the syntax**: an already declared, effectively-final variable may simply be named in the header — `try (existingReader)` — rather than declared there.\n\nThe genuine win is subtle: the compiler emits the nested `try`/`finally` plus null checks that hand-written cleanup usually gets wrong. One caution — the resources do not remove the need to handle failures, because the exception from the body still has to be caught or declared.",
      code: `import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class TryWithResourcesDemo {
    public static void main(String[] args) {
        // Declared in the header: closed automatically, reverse order
        try (FileReader file = new FileReader("data.txt");
             BufferedReader reader = new BufferedReader(file)) {

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            // A close() failure is suppressed here, not allowed to mask
            System.err.println("read failed: " + e.getMessage());
            for (Throwable suppressed : e.getSuppressed()) {
                System.err.println("  suppressed: " + suppressed);
            }
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Expect AutoCloseable, reverse-order closing, and getSuppressed proving a close failure never masks the original exception.",
    },
    {
      id: "q107",
      question: "How does try with resources work?",
      answer:
        "`try`-with-resources is a compiler feature, not a JVM feature. `javac` desugars it into an ordinary nested `try`/`catch`/`finally`; no new bytecode or runtime support exists, which is why the construct is fully backward compatible.\n\n**The generated structure, step by step:**\n\n1. The body executes inside a `try` block, and each declared resource is closed on every exit path, because the resources nest — resource one's cleanup wraps resource two's.\n2. Every `close()` call is guarded by a null check, since the initialiser of a later resource can throw after an earlier one has already been created.\n3. If the body throws, that primary exception is retained; `close()` still runs, and any exception it raises is attached with `addSuppressed` instead of replacing the cause.\n4. If the body finishes normally and `close()` then throws, the close failure becomes the primary exception — which is exactly why the `catch` clause is still required.\n\n**Why this matters:** hand-written `finally` blocks typically (a) forget the null guard, (b) let a failing `close()` discard the real exception, or (c) close in the wrong order. The generated code cannot make those mistakes. Note also that resources are closed before any `catch` of the same statement runs, and that a resource declared in the header is scoped to the try block; only the Java 9 effectively-final form leaves the variable visible afterwards.",
      code: `import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class DesugaredTryWithResources {
    // try (BufferedReader r = open(p)) { ... } compiles to roughly this:
    static String readFirstLine(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        Throwable primary = null;
        try {
            return reader.readLine();
        } catch (Throwable t) {
            primary = t;
            throw t;
        } finally {
            if (reader != null) {                       // null guard
                if (primary != null) {
                    try {
                        reader.close();
                    } catch (Throwable closeFailure) {
                        primary.addSuppressed(closeFailure); // not masked
                    }
                } else {
                    reader.close();
                }
            }
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "The point is that javac desugars it into nested try/finally with null checks and addSuppressed — there is no special JVM support.",
    },
    {
      id: "q108",
      question: "Can you explain a few exception handling best practices?",
      answer:
        "Exception handling separates senior from junior code more than almost any other topic, because every rule here is really about not hiding information.\n\n**The practices worth listing:**\n\n- **Catch only what you can handle.** If the method cannot recover, do not catch — declare. Catching `Exception` defensively turns bugs into silence.\n- **Never swallow.** An empty `catch` block, or one that only uses `e.getMessage()`, destroys both the type and the stack trace. Log the exception object: `log.error(\"transfer failed\", e)`.\n- **Do not use exceptions for control flow.** Parsing an `int` by catching `NumberFormatException` in a loop is far slower and hides genuine errors.\n- **Fail fast at the boundary.** Validate arguments on entry with `Objects.requireNonNull`, `IllegalArgumentException` and `IllegalStateException`, so invalid state never travels deeper.\n- **Preserve the cause when wrapping**, always as `new ServiceException(\"context\", e)`.\n- **Prefer specific types** over generic ones: `InsufficientFundsException` is actionable, `RuntimeException` is not.\n- **Do not catch `Throwable` or `Error`**, because `OutOfMemoryError` and `StackOverflowError` usually mean the JVM cannot guarantee recovery.\n- **Log once, at the layer that handles it.** Logging and rethrowing at every layer prints the same stack trace five times.\n\nApplied together, these rules mean that when something fails in production the log shows one clear cause chain with enough context to reproduce it.",
      code: `public class ExceptionBestPractices {
    static class TransferException extends RuntimeException {
        TransferException(String message, Throwable cause) { super(message, cause); }
    }
    static class InsufficientFundsException extends Exception { }

    static void transfer(String from, String to, String rawAmount) {
        // Fail fast on invalid arguments at the boundary
        java.util.Objects.requireNonNull(from, "from account");
        double amount = parseAmount(rawAmount);
        try {
            debit(from, amount);
            credit(to, amount);
        } catch (InsufficientFundsException e) {
            // Wrap with context, keep the cause so the trace survives
            throw new TransferException("transfer " + amount + " failed", e);
        }
    }
    static double parseAmount(String raw) {
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            // Never swallow: translate to a specific, meaningful type
            throw new IllegalArgumentException("invalid amount: " + raw, e);
        }
    }
    static void debit(String account, double amount) throws InsufficientFundsException { }
    static void credit(String account, double amount) { }
}`,
      codeLanguage: "java",
      explanation:
        "They listen for no-swallow, cause preservation, fail-fast validation and boundary logging — the discipline that separates production-grade code.",
    },
  ],
  meta: {
    q101: {
      difficulty: "easy",
      priority: "high",
      tags: ["throw", "throws", "checked-exceptions"],
      relatedQuestionIds: ["q102", "q103", "q104"],
      estimatedReadMinutes: 2,
      javaVersions: ["Java 1+"],
    },
    q102: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["checked-exceptions", "throws", "compile-time"],
      relatedQuestionIds: ["q101", "q103", "q105"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q103: {
      difficulty: "medium",
      priority: "high",
      tags: ["checked-exceptions", "wrapping", "design"],
      relatedQuestionIds: ["q102", "q104", "q108"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q104: {
      difficulty: "medium",
      priority: "high",
      tags: ["custom-exceptions", "serialization", "api-design"],
      relatedQuestionIds: ["q101", "q102", "q108"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q105: {
      difficulty: "medium",
      priority: "high",
      tags: ["multi-catch", "catch-blocks", "java-7"],
      relatedQuestionIds: ["q102", "q103", "q106"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 7+"],
    },
    q106: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["try-with-resources", "autocloseable", "cleanup"],
      relatedQuestionIds: ["q107", "q105", "q108"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 7+", "Java 9+"],
    },
    q107: {
      difficulty: "hard",
      priority: "high",
      tags: ["try-with-resources", "bytecode", "suppressed"],
      relatedQuestionIds: ["q106", "q108"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 7+", "Java 9+"],
    },
    q108: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["best-practices", "logging", "fail-fast"],
      relatedQuestionIds: ["q104", "q106", "q101"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+"],
    },
  },
});