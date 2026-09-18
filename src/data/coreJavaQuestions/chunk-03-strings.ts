import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Strings — global questions 16-22.
 * Covers String immutability, where String values live (pool vs heap), the
 * quadratic cost of '+' inside a loop and how to fix it, the String /
 * StringBuffer / StringBuilder comparison, and the everyday String API.
 */
export const chunk03Strings = defineChunk({
  topic: "strings",
  questions: [
    {
      id: "q016",
      question: "Are all String's immutable?",
      answer:
        "`java.lang.String` is immutable in the strict sense: the class is `final`, its state lives in a `private final byte[] value` (a `private final char[]` before Java 9 compact strings), and no API lets you change those bytes after construction. Every method that looks like a mutation — `toUpperCase`, `substring`, `replace`, `concat` — returns a brand-new String and leaves the receiver untouched. Marking the class `final` also blocks subclassing, which could otherwise have broken the `equals`/`hashCode` contract that `HashMap` keys depend on.\n\n" +
        "So are **all** String objects immutable? The nuance interviewers want is that anything whose runtime type is `java.lang.String` is immutable, while the wider `CharSequence` family is not. `StringBuilder`, `StringBuffer` and `CharBuffer` are mutable text holders, so a method that accepts `CharSequence` and keeps the reference can observe the caller mutating it afterwards. Reflection or `sun.misc.Unsafe` can overwrite the internal array of an existing String, but strong encapsulation of `java.base` since Java 17 makes that attempt fail by default.\n\n" +
        "**Why the design pays off:**\n\n" +
        "- **String pool**: only immutable values can be shared safely, so identical literals are interned once.\n" +
        "- **Security**: file paths, hostnames and SQL fragments are Strings; if they could change after validation, every check would be a race.\n" +
        "- **Thread safety**: no locking is needed to share a String between threads.\n" +
        "- **Cached hashCode**: `hash` is computed once and reused, which makes String an excellent `HashMap` key.",
      code: `public class StringImmutabilityDemo {
    public static void main(String[] args) throws Exception {
        String original = "hello";
        String upper = original.toUpperCase();
        // Immutability: the receiver never changes, a new object comes back
        System.out.println(original + " / " + upper);   // hello / HELLO
        System.out.println(original == upper);          // false

        // hashCode is computed once and cached inside the String instance
        String key = new String("costly-hash");
        System.out.println(key.hashCode() == key.hashCode()); // true

        // CharSequence implementations are NOT immutable
        CharSequence cs = new StringBuilder("mutable");
        ((StringBuilder) cs).append("-changed");
        System.out.println(cs);                         // mutable-changed

        // Reflection into java.base is blocked by strong encapsulation (Java 17+)
        try {
            var valueField = String.class.getDeclaredField("value");
            valueField.setAccessible(true);
            System.out.println("internals reachable: " + valueField.getName());
        } catch (Exception e) {
            System.out.println("blocked: " + e.getClass().getSimpleName());
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "String itself is always immutable; the follow-up tests whether you know other CharSequence types are not and reflection into java.base is blocked.",
    },
    {
      id: "q017",
      question: "Where are String values stored in memory?",
      answer:
        "A String reference variable lives wherever its declaration lives — on the stack for a local, inside the owning object on the heap for a field. The String object itself is always on the heap, because Java has no value-typed objects. That object is small: an object header, a cached `hash` int, a `coder` byte for compact strings, and a reference to the `byte[]` (Java 9+) or `char[]` (Java 8 and earlier) holding the characters.\n\n" +
        "**Literal strings are interned into the string pool.** The compiler records every literal in the class constant pool, and when the class is resolved the JVM keeps one canonical instance per distinct literal, so two occurrences of \"guru\" resolved by the same classloader share a single object. Before Java 7 that pool lived in PermGen, which is why interning large runtime strings could throw `OutOfMemoryError: PermGen space`. Since Java 7 the pool is a hashtable (`StringTable`) whose entries reference ordinary heap objects, and Java 8 removed PermGen entirely in favour of Metaspace. Tune it with `-XX:StringTableSize`, and on G1 use `-XX:+UseStringDeduplication` to fold duplicate character arrays.\n\n" +
        "**What that means for `new String(\"x\")`:**\n\n" +
        "- The literal is pooled, and `new` allocates a second, distinct heap object holding a copy of the same bytes — two objects for one value.\n" +
        "- `==` compares references, so `new String(\"x\") == \"x\"` is false, while `equals` compares characters and returns true.\n" +
        "- `intern()` returns the canonical pooled instance and adds the caller's string to the pool if it is absent. Intern only when you truly need reference identity, because pooled entries are never collected.",
      code: `public class StringPoolDemo {
    public static void main(String[] args) {
        String literal = "guru";                  // interned in the pool
        String literalAgain = "guru";             // same pool entry
        String heapCopy = new String("guru");     // separate heap object

        System.out.println(literal == literalAgain);     // true  - same object
        System.out.println(literal == heapCopy);         // false - different objects
        System.out.println(literal.equals(heapCopy));    // true  - same content

        // intern() returns the canonical pooled instance
        String interned = heapCopy.intern();
        System.out.println(interned == literal);         // true

        // Computed strings are not automatically interned
        String constantFolded = "gu" + "ru";             // compile-time constant
        String built = String.join("", "gu", "ru");      // created on the heap
        System.out.println(constantFolded == literal);   // true
        System.out.println(built == literal);            // false
        System.out.println(built.intern() == literal);   // true

        // Since Java 7 the pool holds references to heap objects (PermGen before)
        // -XX:StringTableSize tunes the pool bucket count under heavy interning
    }
}`,
      codeLanguage: "java",
      explanation:
        "Literal pooling, the Java 7 move of the pool from PermGen to the heap, and new String allocating a second object are the three checkpoints.",
    },
    {
      id: "q018",
      question:
        "Why should you be careful about String concatenation(+) operator in loops?",
      answer:
        "Inside a loop, `+` turns a linear job into a quadratic one. Each iteration evaluates the whole expression `s = s + i`, which allocates a fresh buffer, appends the old contents of `s` and then the new piece, and finally produces a new String holding everything. Iteration k therefore copies a string of length k, so the total characters copied across n iterations is roughly n * n / 2.\n\n" +
        "**Two allocation costs per iteration:**\n\n" +
        "- A new buffer — historically a real `StringBuilder`, and since Java 9 an equivalent internal buffer created by the `invokedynamic` string-concat machinery with a default capacity that may still grow and copy.\n" +
        "- A brand-new String plus its backing array containing the fully accumulated text.\n\n" +
        "That is why the naive loop both slows down super-linearly and hammers the garbage collector: 100,000 iterations create 100,000 throwaway Strings and roughly 5 billion characters of copying. Java 9 replaced the `StringBuilder` desugaring with `StringConcatFactory`, which is faster per call, but the asymptotic behaviour is unchanged because every result is still a new immutable String.\n\n" +
        "**Worth saying out loud**: the compiler shares a single buffer per expression, so `a + b + c` on one line is cheap, whereas a loop body creates a new buffer every pass. Escape analysis can occasionally scalar-replace that buffer for trivial cases, but that is not something to design around — reach for `StringBuilder` or a stream join instead.",
      code: `public class ConcatInLoopDemo {
    public static void main(String[] args) {
        final int iterations = 20_000;

        long start = System.nanoTime();
        String naive = "";
        for (int i = 0; i < iterations; i++) {
            naive += i;          // new buffer + new String + full copy every pass
        }
        long naiveMillis = (System.nanoTime() - start) / 1_000_000;

        start = System.nanoTime();
        StringBuilder builder = new StringBuilder(iterations * 6);
        for (int i = 0; i < iterations; i++) {
            builder.append(i);   // one growing buffer, old text never recopied
        }
        String fast = builder.toString();
        long builderMillis = (System.nanoTime() - start) / 1_000_000;

        System.out.println("same content: " + naive.equals(fast)); // true
        System.out.println("naive +=    : " + naiveMillis + " ms");
        System.out.println("builder     : " + builderMillis + " ms");
        // Total copied characters: n(n+1)/2 for the loop, n for the builder.
    }
}`,
      codeLanguage: "java",
      explanation:
        "They are testing complexity awareness: each + allocates a buffer, a new String and a full copy, which makes the loop quadratic.",
    },
    {
      id: "q019",
      question: "How do you solve above problem?",
      answer:
        "Replace loop-level `+` with one mutable buffer and convert it to a String once at the end. `StringBuilder` keeps a single growable array and appends in amortised O(1), so assembling the text costs O(n) plus one copy inside `toString()`, instead of the O(n * n) of repeated concatenation.\n\n" +
        "**Pick the right tool for the shape of the data:**\n\n" +
        "- **StringBuilder** — the default for single-threaded assembly such as building CSV rows, SQL fragments or log lines inside a method.\n" +
        "- **StringBuffer** — identical API, but every method is `synchronized`; only worth it when one buffer really is shared between threads.\n" +
        "- **String.join(delimiter, values)** — Java 8, ideal when a collection and a separator are all you have and there is no per-element logic.\n" +
        "- **Collectors.joining(delimiter, prefix, suffix)** — Java 8, use it when the data already flows through a stream pipeline.\n" +
        "- **String.format and text blocks** — readable for a handful of substitutions, but each call parses the format string, so never put them in a hot loop.\n\n" +
        "**Always pre-size the buffer.** `new StringBuilder(estimatedLength)` avoids the reallocate-and-copy cycle that starts from the default 16 characters, and `ensureCapacity` has the same effect mid-flight. The other classic fix is to stop building the string at all: if the text is written exactly once to a file, socket or console, stream the pieces straight into the `Writer` and skip the intermediate String entirely.",
      code: `import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class ConcatSolutionsDemo {
    public static void main(String[] args) {
        List<String> ids = Arrays.asList("u1", "u2", "u3", "u4");

        // 1. StringBuilder, pre-sized: one buffer, one final copy
        StringBuilder csv = new StringBuilder(ids.size() * 8);
        for (String id : ids) {
            if (csv.length() > 0) {
                csv.append(',');
            }
            csv.append(id);
        }
        System.out.println(csv);                     // u1,u2,u3,u4

        // 2. String.join when only a delimiter is involved
        System.out.println(String.join(" | ", ids));

        // 3. Collectors.joining when already inside a stream pipeline
        String labelled = IntStream.rangeClosed(1, 5)
                .mapToObj(Integer::toString)
                .collect(Collectors.joining("-", "[", "]"));
        System.out.println(labelled);                // [1-2-3-4-5]

        // 4. If the text is only written once, do not build it at all
        ids.forEach(id -> System.out.print(id + " "));
    }
}`,
      codeLanguage: "java",
      explanation:
        "The answer must name StringBuilder, pre-sizing the buffer, and the Java 8 join alternatives rather than just saying use StringBuilder.",
    },
    {
      id: "q020",
      question: "What are differences between String and StringBuffer?",
      answer:
        "Both hold characters and both implement `CharSequence`, but they differ on mutability, thread safety and equality. `String` is immutable: every operation returns a new object, so a String is safe to share and can be interned. `StringBuffer` is a mutable, growable character sequence whose methods — `append`, `insert`, `delete`, `reverse`, `replace` — modify the same object in place.\n\n" +
        "**The differences interviewers expect you to name:**\n\n" +
        "- **Mutability**: a String cannot change after construction; a StringBuffer changes in place and returns `this` so calls can be chained.\n" +
        "- **Thread safety**: nearly every public StringBuffer method is `synchronized`, so concurrent appends are safe; String needs no locking because it never changes.\n" +
        "- **Performance**: repeated modification is O(n) with a buffer versus quadratic with `+` inside a loop.\n" +
        "- **Equality**: String overrides `equals` and `hashCode` for value comparison; StringBuffer does not, so two buffers with identical text are still not equal — a favourite trick question.\n" +
        "- **Hashing**: String caches its hashCode, which makes it a great `HashMap` key; a StringBuffer inherits identity hashing and must never be used as a mutable key.\n\n" +
        "**Storage and ancestry**: both keep a backing array, which a String marks `final` while a StringBuffer is allowed to grow (it shares the internal `AbstractStringBuilder` core with `StringBuilder`). Because the buffer can change, it can never be interned or pooled, and `toString()` is the only supported way to hand off an immutable snapshot to another thread or API.",
      code: `public class StringVsStringBufferDemo {
    public static void main(String[] args) {
        String s1 = "total";
        String s2 = "total";
        StringBuffer b1 = new StringBuffer("total");
        StringBuffer b2 = new StringBuffer("total");

        // String overrides equals(): value comparison
        System.out.println(s1.equals(s2));      // true
        // StringBuffer does NOT override equals(): identity comparison
        System.out.println(b1.equals(b2));      // false  <- classic trap
        System.out.println(b1.toString().equals(b2.toString())); // true

        // String: every change returns a new object
        String upper = s1.toUpperCase();
        System.out.println(s1 + " vs " + upper);  // total vs TOTAL

        // StringBuffer: mutated in place, and each call is synchronized
        StringBuffer sb = new StringBuffer(16);
        sb.append("order-").append(7).append(" shipped"); // fluent, same object
        sb.insert(0, "[").append(']');
        System.out.println(sb);                   // [order-7 shipped]

        // Identity hash on a buffer, cached value hash on a String
        System.out.println(b1.hashCode() == b2.hashCode()); // false
    }
}`,
      codeLanguage: "java",
      explanation:
        "The differentiator is equality: String compares content while StringBuffer uses identity, so a buffer can never be a reliable HashMap key.",
    },
    {
      id: "q021",
      question: "What are differences between StringBuilder and StringBuffer?",
      answer:
        "`StringBuffer` has existed since Java 1.0 and is thread-safe: virtually every method is declared `synchronized`, so several threads can append to one instance without corrupting it. `StringBuilder` arrived in Java 5 as the unsynchronised counterpart. The two share the same internal `AbstractStringBuilder` implementation, so their APIs — `append`, `insert`, `delete`, `reverse`, `setLength`, `charAt` — are identical and the only meaningful difference is the locking.\n\n" +
        "**How to choose between them:**\n\n" +
        "- **StringBuilder by default**: a buffer used inside a single method is never shared, so the monitor is pure overhead, and benchmarks show it clearly ahead for hot appends.\n" +
        "- **StringBuffer only for genuinely shared state**: for example a buffer that a background thread appends to while the main thread reads it, or legacy third-party APIs that expose the type.\n" +
        "- **Prefer external synchronisation anyway**: a StringBuilder guarded by your own lock gives better control than per-call locking, and it lets you make compound operations — check-then-append — atomic as a whole.\n\n" +
        "**Shared characteristics**: both are mutable `CharSequence` implementations, neither overrides `equals` or `hashCode` (compare with `toString().equals(...)` instead), neither can be interned, and both grow by roughly `oldCapacity * 2 + 2` when they fill, which is why pre-sizing still matters. Also remember that even a StringBuffer is not safely published to another thread on its own: individual operations are atomic, but a sequence of them is not.",
      code: `public class StringBuilderVsStringBufferDemo {
    private static long time(Runnable task) {
        long start = System.nanoTime();
        task.run();
        return (System.nanoTime() - start) / 1_000_000;
    }

    public static void main(String[] args) {
        final int n = 500_000;

        // StringBuffer: every append acquires the monitor on the buffer
        long bufferMillis = time(() -> {
            StringBuffer buffer = new StringBuffer(n * 2);
            for (int i = 0; i < n; i++) {
                buffer.append('x');
            }
        });

        // StringBuilder: same API, no locking, preferred for local work
        long builderMillis = time(() -> {
            StringBuilder builder = new StringBuilder(n * 2);
            for (int i = 0; i < n; i++) {
                builder.append('x');
            }
        });

        System.out.println("StringBuffer : " + bufferMillis + " ms");
        System.out.println("StringBuilder: " + builderMillis + " ms");
        // Identical AbstractStringBuilder core; only synchronization differs.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Same API, one difference: StringBuffer synchronises every call and StringBuilder does not, so default to StringBuilder unless state is shared.",
    },
    {
      id: "q022",
      question:
        "Can you give examples of different utility methods in String class?",
      answer:
        "The String API is easiest to recall as families of methods rather than a flat list, because interviewers usually ask you to pick the right variant for a job.\n\n" +
        "**Core families:**\n\n" +
        "- **Size and access**: `length()`, `charAt(int)`, `isEmpty()`, `toCharArray()`.\n" +
        "- **Search**: `indexOf`, `lastIndexOf`, `contains`, `startsWith`, `endsWith`, `matches(regex)`.\n" +
        "- **Extraction**: `substring(begin, end)`, `split(regex)`, plus the `chars()` and `codePoints()` streams.\n" +
        "- **Replacement**: `replace(char, char)` is literal, while `replaceAll` and `replaceFirst` take regular expressions; those compile a `Pattern` on every call, so precompile in hot paths.\n" +
        "- **Comparison**: `equals`, `equalsIgnoreCase`, `compareTo`, `compareToIgnoreCase`, `regionMatches`.\n" +
        "- **Case conversion**: `toUpperCase(Locale.ROOT)` and `toLowerCase(Locale)` — always pass a locale, otherwise the Turkish dotless-i behaviour changes your output.\n" +
        "- **Whitespace**: `trim()` only strips characters at or below U+0020, whereas `strip()`, `stripLeading()` and `stripTrailing()` from Java 11 are Unicode-aware.\n\n" +
        "**Java 11 additions that earn points**: `isBlank()`, `repeat(int)`, `lines()`, `strip()`, and the statics `String.join` and `String.format`. Later versions add `indent`, `stripIndent` and `transform` (Java 12) and `formatted` (Java 15). Close with the encoding rule: call `getBytes(StandardCharsets.UTF_8)` rather than the no-arg overload, because the platform default charset differs between machines.",
      code: `import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;

public class StringUtilitiesDemo {
    public static void main(String[] args) {
        String raw = "  Core Java Interview  ";

        System.out.println(raw.length());                   // 23
        System.out.println(raw.trim().length());            // 19 (ASCII strip)
        System.out.println(raw.strip().length());           // 19 (Unicode, Java 11)
        System.out.println("   ".isBlank());                // true (Java 11)

        String csv = "alpha,beta,gamma";
        System.out.println(csv.indexOf('b'));               // 6
        System.out.println(csv.substring(6, 10));           // beta
        System.out.println(Arrays.toString(csv.split(","))); // [alpha, beta, gamma]
        System.out.println(csv.replace('a', 'A'));          // AlphA, betA, gAmmA
        System.out.println(csv.toUpperCase(Locale.ROOT));   // ALPHA,BETA,GAMMA

        System.out.println("ha".repeat(3));                 // hahaha (Java 11)
        System.out.println(csv.lines().count());            // 1      (Java 11)

        long upperCount = "JavaDev".chars()
                .filter(Character::isUpperCase)
                .count();
        System.out.println(upperCount);                     // 2 (J, D)

        // Always name a charset: the platform default is not portable
        System.out.println("AlgoGuru".getBytes(StandardCharsets.UTF_8).length);
        System.out.println("guru".equalsIgnoreCase("GURU")); // true
    }
}`,
      codeLanguage: "java",
      explanation:
        "Pick a spread across families and close with the Java 11 additions and the charset rule: strip versus trim, isBlank, repeat, lines.",
    },
  ],
  meta: {
    q016: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["string", "immutability", "string-pool"],
      relatedQuestionIds: ["q017", "q020", "q022"],
      estimatedReadMinutes: 3,
    },
    q017: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["string-pool", "memory", "intern"],
      relatedQuestionIds: ["q016", "q019", "q022"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 7+"],
    },
    q018: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["string", "concatenation", "performance"],
      relatedQuestionIds: ["q019", "q020", "q021"],
      estimatedReadMinutes: 3,
    },
    q019: {
      difficulty: "medium",
      priority: "very-high",
      tags: ["stringbuilder", "performance", "concatenation"],
      relatedQuestionIds: ["q018", "q020", "q021"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 8+"],
    },
    q020: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["string", "stringbuffer", "comparison"],
      relatedQuestionIds: ["q016", "q019", "q021"],
      estimatedReadMinutes: 3,
    },
    q021: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["stringbuilder", "stringbuffer", "concurrency"],
      relatedQuestionIds: ["q019", "q020", "q018"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q022: {
      difficulty: "medium",
      priority: "high",
      tags: ["string-api", "java11", "utility-methods"],
      relatedQuestionIds: ["q016", "q017", "q020"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 11+"],
    },
  },
});