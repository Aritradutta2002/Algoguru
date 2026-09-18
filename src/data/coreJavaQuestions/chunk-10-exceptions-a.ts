import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Exception Handling — global questions 91-100.
 */
export const chunk10ExceptionsA = defineChunk({
  topic: "exception-handling",
  questions: [
    {
      id: "q091",
      question: "Why is exception handling important?",
      answer:
        "Exception handling is the mechanism that lets a program separate the happy path from error recovery, so normal logic stays readable and each failure is dealt with by the layer that actually knows what to do about it. It also guarantees that cleanup happens even when control leaves a method early.\n\n**Why plain return codes fail at scale:**\n\n- **Easy to ignore**: A caller can forget to check a returned status code and nothing forces attention; a thrown exception propagates automatically until some handler accepts it.\n- **Value collisions**: Error codes compete with legitimate return values, so you invent sentinels such as -1 or null that then leak into ordinary logic.\n- **Signature pollution**: Every method on the call path must declare and forward the code even when it cannot act on it.\n- **Poor diagnostics**: A code carries no stack trace, while an exception captures the exact throw site, the call chain and the underlying cause.\n\n**What a well-designed scheme buys you:**\n\n- **Guaranteed cleanup**: `finally` and try-with-resources release files, sockets and locks on every exit path.\n- **One failure boundary**: Validate at the edge, let the error travel up, and map it to a single HTTP status or user message in the outermost handler.\n- **Transactional integrity**: A thrown exception is the signal frameworks use to decide that a unit of work must roll back.\n\nThe trade-off is cost: constructing an exception captures a stack trace and is far more expensive than a branch, so exceptions are for exceptional conditions and never for ordinary control flow. Used deliberately, they turn an unhandled failure into a diagnosable event instead of silently corrupted state.",
      code: `import java.math.BigDecimal;

/** Typed failure: the caller learns exactly which business rule broke. */
class InsufficientFundsException extends Exception {
    InsufficientFundsException(String accountId, BigDecimal shortfall) {
        super("account " + accountId + " is short by " + shortfall);
    }
}

public class TransferService {
    /** Happy path stays linear; failures travel as exceptions. */
    public void transfer(String accountId, BigDecimal balance, BigDecimal amount)
            throws InsufficientFundsException {
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive: " + amount);
        }
        if (balance.compareTo(amount) < 0) {
            throw new InsufficientFundsException(accountId, amount.subtract(balance));
        }
        System.out.println("transferred " + amount + " from " + accountId);
    }

    public static void main(String[] args) {
        try {
            new TransferService().transfer("ACC-1", new BigDecimal("50"), new BigDecimal("80"));
        } catch (InsufficientFundsException e) {
            System.out.println("rejected: " + e.getMessage()); // typed, diagnosable
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Contrast automatic propagation and stack-trace diagnostics against ignorable return codes, then justify cleanup and rollback boundaries.",
    },
    {
      id: "q092",
      question:
        "What design pattern is used to implement exception handling features in most languages?",
      answer:
        "Most languages implement exception handling with the **Chain of Responsibility** pattern, combined with a throw mechanism and a stack-unwinding hook. A `try` block marks a region to watch, each `catch` clause is a concrete handler that declares the exception types it accepts, `throw` starts the walk up the call stack, and `finally` is the hook that runs while the stack unwinds.\n\n**How that chain is assembled at runtime:**\n\n- **Handler**: every `catch` clause is one link, matched against the runtime class of the thrown object using `instanceof` semantics, so a handler for `IOException` also accepts `FileNotFoundException`.\n- **Successor**: there is no explicit next pointer. The successor is simply the caller frame, so the JVM walks the call stack upward from the throw site.\n- **Request**: the thrown `Throwable` is the request travelling through the chain.\n- **Termination**: the first matching handler wins, so order matters — specific types must precede general ones, and the compiler rejects a subclass handler placed after its superclass.\n\n**Two refinements interviewers like to hear**: a handler that cannot fully recover can rethrow the original exception, resuming the walk at the next frame, or wrap it in a new exception while attaching the original as the cause so no context is lost. Java 7 multi-catch (`catch (IOException | SQLException e)`) is syntactic sugar that lets one link handle several types. If nothing matches, the chain reaches the bottom of the stack, the thread's uncaught exception handler prints the stack trace and that thread terminates.",
      code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Each catch clause is a handler; the call stack is the successor chain. */
public class ChainOfResponsibilityDemo {

    // Top of the stack: the only layer that knows how to recover
    public static void main(String[] args) {
        try {
            System.out.println(readConfig(Path.of("app.properties")));
        } catch (IllegalStateException e) {   // typed handler, first match wins
            System.out.println("recovered  : " + e.getMessage());
            System.out.println("root cause : " + e.getCause());
        }
    }

    static String readConfig(Path path) {
        try {
            return Files.readString(path);    // the request enters the chain here
        } catch (IOException e) {
            // Cannot handle it: wrap and rethrow so the chain keeps walking up
            throw new IllegalStateException("config unreadable: " + path, e);
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Name Chain of Responsibility plus throw and stack unwinding, and note first-match wins with subclasses before superclasses.",
    },
    {
      id: "q093",
      question: "What is the need for finally block?",
      answer:
        "`finally` exists to guarantee cleanup: the code inside it runs however the `try` block is left, so file handles, sockets, locks and database connections are released without duplicating release logic in every branch.\n\n**The exit paths it covers:**\n\n- **Normal completion**: the last statement of `try` finishes and control falls into `finally`.\n- **A propagating exception**: the in-flight exception is held while `finally` runs, then continues to the caller.\n- **`return` inside `try`**: the return expression is evaluated, `finally` runs, and only then does the method actually return.\n- **`break` or `continue`** that leaves the `try` block from inside a loop.\n- **A failure inside `catch`** or during resource closing — cleanup still happens first.\n\n**The classic trap:** a `return`, `break` or `throw` inside `finally` overrides whatever `try` or `catch` was doing. A `return` in `finally` silently discards a pending exception and replaces the try's return value, so the caller sees success where a failure occurred. `finally` belongs to cleanup only, never to control flow.\n\n**Modern practice**: since Java 7, try-with-resources replaces most hand-written `finally`-based closing. It closes each resource in reverse declaration order, keeps the primary exception intact, and attaches any close failure as a suppressed exception — behaviour that a naive `finally { resource.close(); }` gets wrong by masking the original error.",
      code: `import java.util.concurrent.atomic.AtomicInteger;

/** finally releases whatever try acquired, on every exit path. */
public class CleanupDemo {
    private static final AtomicInteger openHandles = new AtomicInteger();

    static int readFirstByte(String source, boolean fail) {
        openHandles.incrementAndGet();                 // acquire
        try {
            if (fail) {
                throw new IllegalStateException("stream broken");
            }
            return source.charAt(0);                   // exit path 1: return inside try
        } finally {
            openHandles.decrementAndGet();             // also runs on exit path 2
            System.out.println("finally: open handles = " + openHandles.get());
        }
    }

    public static void main(String[] args) {
        System.out.println("value: " + readFirstByte("AlgoGuru", false));
        try {
            readFirstByte("AlgoGuru", true);
        } catch (IllegalStateException e) {
            System.out.println("caught: " + e.getMessage());
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "List every exit path finally covers, then flag return-in-finally as the trap and try-with-resources as the modern replacement.",
    },
    {
      id: "q094",
      question: "In what scenarios is code in finally not executed?",
      answer:
        "The list is genuinely short: `finally` is skipped only when the thread never completes its unwind, or when the JVM itself stops. A `return`, a `break` or an uncaught exception all still run it.\n\n**The documented cases where `finally` does not run:**\n\n- **JVM termination**: `System.exit(status)` or `Runtime.getRuntime().halt(status)` ends the process immediately; neither unwinds the stack, and `halt` also skips shutdown hooks.\n- **A fatal error mid-unwind**: if the JVM cannot continue — the heap is exhausted again while handling `OutOfMemoryError`, internal state is corrupt — the unwind never reaches your block.\n- **The try block never exits**: an infinite loop or a deadlock inside `try` leaves the frame on the stack forever, so no exit path exists to trigger `finally`.\n- **Daemon thread killed at JVM shutdown**: when the last non-daemon thread finishes, the JVM stops daemon threads without unwinding them.\n- **Process or OS failure**: `SIGKILL`, a container eviction or a power loss bypasses the JVM entirely.\n\n**One nuance worth stating precisely**: since Java 7, try-with-resources runs `close()` before an attached `finally` block. `close()` is skipped only when the resource never finished initialising — for example its own constructor threw — because there is nothing to close; the `finally` block still executes. If you need a guaranteed action at JVM exit, use a shutdown hook, and remember hooks are not a substitute for `finally` in ordinary code.",
      code: `/** finally is skipped only when the JVM stops unwinding the stack. */
public class FinallyNotRunDemo {

    static void run(boolean shutdown) {
        try {
            System.out.println("try: work in progress");
            if (shutdown) {
                System.exit(1);            // no unwinding -> finally never executes
            }
            throw new IllegalStateException("recoverable");
        } finally {
            System.out.println("finally: cleanup");   // runs for the exception path
        }
    }

    public static void main(String[] args) {
        try {
            run(false);                    // prints try, then finally
        } catch (IllegalStateException e) {
            System.out.println("caught: " + e.getMessage());
        }
        // run(true) would print only "try: work in progress" and exit with status 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "Give the narrow list — JVM exit, fatal error, blocked unwind, killed daemon thread, OS kill — not the wrong answer of return or throw.",
    },
    {
      id: "q095",
      question: "Will finally be executed in the program below?",
      answer:
        "**Yes, the `finally` block executes**, and the mildly surprising part is the ordering rather than the fact. A `return` inside `try` does not skip `finally`: the JVM evaluates the return expression, stores the value, runs `finally`, and only then hands control — and that stored value — back to the caller. The only way to avoid the block is to stop the JVM before the unwind completes.\n\n**Exact output order for the snippet below:**\n\n1. `try: 10`\n2. `finally: 10`\n3. `answer: 10`\n4. `swallowed: 2`\n\n**Why `finally` wins over the `return`**: the method call is only half finished when the return statement executes. The value is already computed, but the compiler emits the `finally` code before the actual return instruction, so cleanup still runs with the value in hand. That also means `finally` may mutate a mutable object returned from `try`, although it cannot change an already-evaluated primitive.\n\n**The trap in the second method**: `computeWithFinallyReturn` returns 2, not 1. A `return` inside `finally` overrides the pending return and, worse, discards any exception in flight; static analysis tools flag it as a bug for exactly that reason. Never put `return`, `break` or `throw` inside a `finally` block — correct the value in the `try` block or after the call instead.",
      code: `public class FinallyOrderDemo {

    // Trace carefully: finally runs BEFORE the method returns to main.
    static int compute() {
        int value = 10;
        try {
            System.out.println("try: " + value);
            return value;                              // return expression evaluated...
        } finally {
            System.out.println("finally: " + value);   // ...but finally runs first
        }
    }

    // Anti-pattern: a return inside finally overrides the try's return value
    static int computeWithFinallyReturn() {
        try {
            return 1;
        } finally {
            return 2;                                  // silently discards the first return
        }
    }

    public static void main(String[] args) {
        int answer = compute();                        // prints: try: 10 / finally: 10
        System.out.println("answer: " + answer);       // prints: answer: 10
        System.out.println("swallowed: " + computeWithFinallyReturn()); // prints: 2
    }
}`,
      codeLanguage: "java",
      explanation:
        "Prove finally runs before the method returns and show the return-in-finally anti-pattern that silently overrides the value.",
    },
    {
      id: "q096",
      question: "Is try without a catch is allowed?",
      answer:
        "**Yes — a `try` without a `catch` is perfectly legal**, provided something follows it. The grammar requires a `try` block to be followed by at least one of: a `catch` clause, a `finally` block, or a resource specification (the try-with-resources form added in Java 7). `try { ... } finally { ... }` is therefore valid, and it is a common idiom.\n\n**Why you would deliberately write that:** perhaps you want to release a lock, restore an interrupt flag or reset a counter, yet you cannot recover from the failure in this layer. Catching and rethrowing the same exception would be noise, and catching and wrapping it would change the type the caller expects. A bare `finally` gives you cleanup with zero interference in the propagation path.\n\n**What is not allowed**: a `try` block followed by nothing at all, or followed only by another `try`. `try { }` on its own is a compile-time error. You also cannot place a `finally` before a `catch` — the order is fixed as `try`, then zero or more `catch` clauses, then zero or one `finally`.\n\n**Interview nuance**: try-with-resources counts as a third legal shape and is usually the better answer for resources, because it closes them in reverse order and preserves the primary exception. Keep a plain `try`/`finally` for cleanup that is not `AutoCloseable` — releasing a `ReentrantLock` or clearing a `ThreadLocal`, for example.",
      code: `/** Legal: try must be followed by catch and/or finally, or use resources. */
public class TryWithoutCatch {

    static String loadUser(String id) {
        System.out.println("acquiring lock for " + id);
        try {
            if (id == null || id.isBlank()) {
                throw new IllegalArgumentException("id required");
            }
            return "user-" + id;
        } finally {
            // No catch here: clean up, then let the exception propagate unchanged
            System.out.println("releasing lock for " + id);
        }
    }

    public static void main(String[] args) {
        System.out.println(loadUser("42"));
        try {
            loadUser("");
        } catch (IllegalArgumentException e) {
            System.out.println("propagated: " + e.getMessage());
        }
        // try { } alone is a compile error: 'catch' or 'finally' expected
    }
}`,
      codeLanguage: "java",
      explanation:
        "Saying yes requires naming the try plus finally idiom that cleans up while still letting the original exception propagate untouched.",
    },
    {
      id: "q097",
      question: "Is try without catch and finally allowed?",
      answer:
        "**No — `try` on its own does not compile.** Java requires a `try` block to be followed by a `catch` clause, a `finally` block, or a resource declaration list. A bare `try { }` fails with the compiler error mentioning that a catch or finally is expected, and the same rule means the next statement cannot simply continue the flow.\n\n**The four legal shapes:**\n\n- **`try` + `catch`**: handle the failure locally.\n- **`try` + `catch` + `finally`**: handle it, and always run cleanup.\n- **`try` + `finally`**: cleanup with no handling — the exception keeps propagating.\n- **`try` + resources** (declared as `Resource r = ...`, Java 7+), optionally with `catch` or `finally`.\n\n**Why the language forbids a bare `try`**: it would be dead code with a misleading appearance. The block promises protection or cleanup and would deliver neither, so the compiler rejects it instead of silently ignoring the author's intent. The same reasoning produces the neighbouring error when you `catch` a checked exception the body can never throw — `catch (IOException e)` around code that performs no I/O.\n\n**Practical picture**: a `finally`-only `try` is the smallest legal shape and is idiomatic when cleanup must run before an exception nobody in this layer can handle is allowed to travel upward.",
      code: `import java.io.BufferedReader;
import java.io.StringReader;

/** Every legal try shape; a bare try block is a compile-time error. */
public class TryWithoutCatchOrFinally {

    static void finallyOnly() {
        try {                                   // shape 3: try + finally, no catch
            System.out.println("try + finally");
        } finally {
            System.out.println("cleanup still runs");
        }
    }

    static void withResources() throws Exception {
        // shape 4 (Java 7+): resources close before any optional finally
        try (BufferedReader reader = new BufferedReader(new StringReader("AlgoGuru"))) {
            System.out.println("resource: " + reader.readLine());
        }
    }

    public static void main(String[] args) throws Exception {
        finallyOnly();
        withResources();
        // try { }                                    // error: 'catch' or 'finally' expected
        // try { } catch (java.io.IOException e) { }   // error: IOException is never thrown
    }
}`,
      codeLanguage: "java",
      explanation:
        "Answer no, name the four legal shapes including Java 7 resources, and mention the unreachable-catch rule as the same compile-time discipline.",
    },
    {
      id: "q098",
      question: "Can you explain the hierarchy of exception handling classes?",
      answer:
        "`Throwable` is the root of everything that can be thrown or caught; only its subclasses may appear after `throw` or in a `catch` clause. Directly beneath it sit two branches — `Error` and `Exception` — and the branch you are on decides whether the compiler forces you to handle it.\n\n**The hierarchy, top down:**\n\n- **`Throwable`**: the base class. It carries the message, the cause chain, the stack trace and suppressed exceptions.\n- **`Error`**: fatal conditions originating in the JVM or the environment — `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError`.\n- **`Exception`**: recoverable, application-level conditions. This subtree splits again.\n- **`RuntimeException`**: the unchecked branch — `NullPointerException`, `IllegalArgumentException`, `IndexOutOfBoundsException`, `ClassCastException`.\n- **Everything else under `Exception`**: the checked branch — `IOException`, `SQLException`, `InterruptedException`, `ClassNotFoundException`.\n\n**The rule that classifies them**: the language defines unchecked exception classes as `RuntimeException`, `Error` and all their subclasses; every other `Throwable` subtype is checked. That is why `Error` needs no `throws` clause even though it does not extend `RuntimeException`. Checked-ness is inherited: a subclass of `IOException` is checked unless it also extends `RuntimeException`.\n\n**Details worth mentioning**: exception types follow a `(message, cause, suppression, writableStackTrace)` constructor pattern that frameworks rely on, `Throwable.getCause()` exposes the linked chain, and a `catch` clause matches subtypes, so ordering specific handlers first is a correctness requirement rather than a style preference.",
      code: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Object -> Throwable -> Error | Exception -> RuntimeException. */
public class ThrowableHierarchy {

    static void printChain(Class<?> type) {
        List<String> names = new ArrayList<>();
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            names.add(c.getSimpleName());
        }
        Collections.reverse(names);
        System.out.println(String.join(" -> ", names));
    }

    public static void main(String[] args) {
        printChain(java.io.IOException.class);        // checked branch
        printChain(IllegalStateException.class);      // unchecked branch
        printChain(StackOverflowError.class);         // Error branch

        // Only Throwable subtypes are throwable, and the cause chain is preserved
        Throwable cause = new java.io.IOException("disk gone");
        Throwable wrapped = new IllegalStateException("cannot save", cause);
        System.out.println("cause preserved: " + (wrapped.getCause() == cause));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Draw Throwable splitting into Error and Exception, with RuntimeException as the unchecked branch, and state the exact classifying rule.",
    },
    {
      id: "q099",
      question: "What is the difference between error and exception?",
      answer:
        "**`Error` means the application cannot reasonably continue; `Exception` means it usually can.** Both extend `Throwable` and both are unchecked, but they describe different situations and demand different handling strategies.\n\n**`Error` — signals outside your control:**\n\n- **`OutOfMemoryError`**: the heap is exhausted; retrying the same allocation will fail again.\n- **`StackOverflowError`**: runaway recursion consumed the thread's stack.\n- **`NoClassDefFoundError`** and **`ExceptionInInitializerError`**: a class was present at compile time but missing or broken at run time.\n- **`AssertionError`**: a program invariant was violated with assertions enabled.\n\n**`Exception` — signals a well-written application may handle:** `IOException` when a file is locked, `SQLException` on a deadlock or constraint violation, `InterruptedException` during shutdown, `TimeoutException` from an overloaded downstream service, and the whole `RuntimeException` family that marks programming bugs such as a missing null check or an illegal argument.\n\n**The practical rule**: do not catch `Error`. The JVM may be in an inconsistent state, and continuing often corrupts data further; log at the outermost boundary and let it terminate. The one defensible use is catching `Throwable` in a container's top-level request loop or a test runner so a single failing unit does not take down the process — and even then the error should be rethrown or the process shut down. Remember that a repeated `OutOfMemoryError` recovery problem is usually a leak in the program, not an unlucky allocation.",
      code: `/** Errors signal JVM-level failure; exceptions signal handleable failure. */
public class ErrorVsException {

    static int depth = 0;

    static void recurseForever() {
        depth++;                       // eventually exhausts the thread stack
        recurseForever();
    }

    public static void main(String[] args) {
        // Exception: the application can and should act on it
        try {
            Integer.parseInt("not-a-number");
        } catch (NumberFormatException e) {
            System.out.println("exception handled: " + e.getMessage());
        }

        // Error: observe only at the outermost boundary, then fail fast
        try {
            recurseForever();
        } catch (StackOverflowError e) {
            System.out.println("error observed at call depth " + depth);
            System.out.println("do not continue: JVM state is unreliable");
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "Say Error is unrecoverable and should not be caught, while Exception is handleable — and justify the one boundary-catch exception to the rule.",
    },
    {
      id: "q100",
      question: "What is the difference between checked exceptions and unchecked exceptions?",
      answer:
        "**Checked exceptions are enforced by the compiler; unchecked ones are not.** If a method can throw a checked exception it must either catch it or declare it in a `throws` clause, and that obligation propagates to every caller up the chain. Unchecked exceptions extend `RuntimeException` and need no declaration anywhere.\n\n**What each side represents:**\n\n- **Checked — recoverable, external conditions**: `IOException`, `SQLException`, `ClassNotFoundException`, `InterruptedException`. The caller is assumed to have a sensible recovery path.\n- **Unchecked — programming errors**: `NullPointerException`, `IllegalArgumentException`, `ArrayIndexOutOfBoundsException`, `ClassCastException`, `ArithmeticException`. The right response is to fix the code, not to catch.\n\n**The modern critique of checked exceptions**: they leak abstractions, because a method delegating to a lower layer must either expose that layer's checked type in its own signature or wrap it, coupling callers to implementation details. They interact badly with lambdas and streams, whose functional interfaces declare no checked exceptions, so you wrap into a `RuntimeException` such as `UncheckedIOException` inside every lambda. They also encourage swallowing — the empty `catch (Exception e) {}` or the catch-log-and-continue that hides a real failure.\n\n**Pragmatic guidance**: use unchecked exceptions for programming errors and precondition violations, and reserve checked ones for cases where the caller genuinely has a recovery option and the exception is a documented part of the API contract. Large frameworks such as Spring lean the same way, translating checked platform exceptions into runtime ones at their boundaries.",
      code: `import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Checked exceptions are enforced by javac; unchecked ones are not. */
public class CheckedVsUnchecked {

    // Checked: the compiler forces every caller to handle or declare it
    static String readConfig(Path path) throws IOException {
        return Files.readString(path);
    }

    // Unchecked: a programming error, so no throws clause is needed
    static String firstWord(String text) {
        if (text == null) {
            throw new IllegalArgumentException("text must not be null");
        }
        return text.split(" ")[0];
    }

    public static void main(String[] args) {
        try {
            System.out.println(readConfig(Path.of("missing.properties")));
        } catch (IOException e) {
            System.out.println("checked handled: " + e.getClass().getSimpleName());
        }
        // Lambdas cannot declare checked exceptions, which is why streams
        // push you towards wrapping them in a RuntimeException subtype.
        System.out.println("unchecked demo: " + firstWord("AlgoGuru rocks"));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Separate compile-time enforcement from the programming-error meaning, then mention the leaky-abstraction critique and lambda friction.",
    },
  ],
  meta: {
    q091: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["exceptions", "error-handling", "cleanup"],
      relatedQuestionIds: ["q092", "q093", "q100"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q092: {
      difficulty: "medium",
      priority: "high",
      tags: ["design-patterns", "chain-of-responsibility", "propagation"],
      relatedQuestionIds: ["q091", "q098"],
      estimatedReadMinutes: 3,
    },
    q093: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["finally", "cleanup", "try-with-resources"],
      relatedQuestionIds: ["q094", "q095", "q096"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+", "Java 7+"],
    },
    q094: {
      difficulty: "hard",
      priority: "high",
      tags: ["finally", "jvm-shutdown", "daemon-threads"],
      relatedQuestionIds: ["q093", "q095"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+", "Java 7+"],
    },
    q095: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["finally", "return", "execution-order"],
      relatedQuestionIds: ["q093", "q094", "q097"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q096: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["try-finally", "syntax", "propagation"],
      relatedQuestionIds: ["q097", "q093"],
      estimatedReadMinutes: 2,
      javaVersions: ["Java 1+", "Java 7+"],
    },
    q097: {
      difficulty: "easy",
      priority: "high",
      tags: ["syntax", "try-block", "compile-error"],
      relatedQuestionIds: ["q096", "q093"],
      estimatedReadMinutes: 2,
      javaVersions: ["Java 1+", "Java 7+"],
    },
    q098: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["throwable", "hierarchy", "checked-exceptions"],
      relatedQuestionIds: ["q099", "q100", "q092"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q099: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["error", "exception", "throwable"],
      relatedQuestionIds: ["q098", "q100"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 1+"],
    },
    q100: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["checked-exceptions", "unchecked-exceptions", "runtime-exception"],
      relatedQuestionIds: ["q098", "q099", "q096"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+", "Java 8+"],
    },
  },
});