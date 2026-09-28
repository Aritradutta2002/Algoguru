import { defineBackendChunk } from "./contract";

/**
 * HashMap — complete internal working (b067–b080).
 * The single most-asked deep-dive in Java interviews.
 */
export const chunk05HashMap = defineBackendChunk({
  topic: "hashmap-internals",
  questions: [
    {
      id: "b067",
      question: "Explain how HashMap works internally, end to end.",
      answer:
        "A `HashMap` is an **array of bins**, where each bin holds either a linked list of `Node`s or a red-black `TreeNode`.\n\n" +
        "The fields:\n\n" +
        "- `Node<K,V>[] table` — the bucket array, lazily allocated on the first `put`, always a **power of two** in length.\n" +
        "- Each `Node` holds `final int hash`, `final K key`, `V value`, `Node<K,V> next`.\n" +
        "- `size` (entry count), `threshold` (`capacity * loadFactor`), `loadFactor` (0.75 by default), `modCount` (for fail-fast iteration).\n\n" +
        "put(key, value):\n\n" +
        "1. Compute `h = key.hashCode()`, then **spread** it: `hash = h ^ (h >>> 16)`.\n" +
        "2. Index the bin with `i = (n - 1) & hash` — a bitmask, which is why the capacity must be a power of two.\n" +
        "3. **Empty bin** → create a `Node` and store it.\n" +
        "4. **Occupied bin** → compare the first node: if `node.hash == hash && (node.key == key || key.equals(node.key))`, replace the value and return the old one. The `hash ==` check first is a cheap filter that avoids most `equals` calls.\n" +
        "5. Otherwise walk the chain doing the same comparison. If the bin is a `TreeNode`, do a tree insert instead.\n" +
        "6. Append at the tail (Java 8+; Java 7 inserted at the head). If the chain reaches **`TREEIFY_THRESHOLD = 8`** *and* the table length is at least **`MIN_TREEIFY_CAPACITY = 64`**, convert the bin to a red-black tree; if the table is smaller, **resize instead**.\n" +
        "7. `++size > threshold` → `resize()` to double the capacity.\n\n" +
        "get(key): same hash and index, check the first node, then walk the chain or search the tree. Returns `null` for both 'absent' and 'mapped to null' — use `containsKey` to distinguish.\n\n" +
        "Complexity: **O(1) average**, O(log n) worst case per bin since Java 8 (it was O(n) in Java 7), and the whole structure is **not thread-safe**.",
      code: `import java.util.*;

/** A teaching-sized reimplementation of the real algorithm. */
class MiniHashMap<K, V> {
    static final int DEFAULT_CAPACITY = 16;
    static final float LOAD_FACTOR = 0.75f;

    static final class Node<K, V> {
        final int hash; final K key; V value; Node<K, V> next;
        Node(int hash, K key, V value, Node<K, V> next) {
            this.hash = hash; this.key = key; this.value = value; this.next = next;
        }
    }

    Node<K, V>[] table;
    int size, threshold = (int) (DEFAULT_CAPACITY * LOAD_FACTOR);

    /** Spread the high bits down so they influence the low-bit mask. */
    static int spread(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

    @SuppressWarnings("unchecked")
    public V put(K key, V value) {
        if (table == null) table = new Node[DEFAULT_CAPACITY];
        int hash = spread(key);
        int i = (table.length - 1) & hash;                 // power-of-two bitmask

        for (Node<K, V> e = table[i]; e != null; e = e.next) {
            if (e.hash == hash && (e.key == key || (key != null && key.equals(e.key)))) {
                V old = e.value; e.value = value; return old;   // replace in place
            }
        }
        table[i] = new Node<>(hash, key, value, table[i]);  // real HashMap appends at tail
        if (++size > threshold) resize();
        return null;
    }

    public V get(Object key) {
        if (table == null) return null;
        int hash = spread(key);
        for (Node<K, V> e = table[(table.length - 1) & hash]; e != null; e = e.next) {
            if (e.hash == hash && (e.key == key || (key != null && key.equals(e.key))))
                return e.value;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    void resize() {
        Node<K, V>[] old = table;
        int newCap = old.length << 1;                       // always double
        Node<K, V>[] next = new Node[newCap];
        for (Node<K, V> head : old) {
            for (Node<K, V> e = head; e != null; ) {
                Node<K, V> nx = e.next;
                int i = (newCap - 1) & e.hash;               // recompute index only
                e.next = next[i]; next[i] = e;
                e = nx;
            }
        }
        table = next;
        threshold = (int) (newCap * LOAD_FACTOR);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Array of bins indexed by (n-1) & spreadHash, chains that treeify at 8 with table >= 64, doubling resize at 0.75 load factor.",
      followUps: [
        "Why is the capacity always a power of two?",
        "Why compare hash before calling equals?",
      ],
    },
    {
      id: "b068",
      question: "Why does HashMap use hash ^ (hash >>> 16) instead of the raw hashCode?",
      answer:
        "Because the bucket index is computed with **`(n - 1) & hash`**, and that mask only keeps the **low bits** of the hash.\n\n" +
        "With the default capacity of 16, `n - 1 = 15 = 0b1111`, so **only the bottom four bits** of the hash decide the bin. Any two keys whose hash codes differ solely in the upper 28 bits collide.\n\n" +
        "This is a real problem, not a theoretical one. Many `hashCode` implementations vary mostly in the high bits — the classic example is `Float.hashCode` and hash codes built by multiplying by a large constant. Keys like `0x0000_0001`, `0x0001_0001`, `0x0002_0001` all map to bin 1 with a 16-entry table.\n\n" +
        "**The spread function** `h ^ (h >>> 16)` XORs the top 16 bits down onto the bottom 16. It is deliberately minimal:\n\n" +
        "- **One shift and one XOR** — essentially free, a couple of CPU cycles.\n" +
        "- It mixes high-bit entropy into the masked region without a full avalanche function like MurmurHash, which would cost more than it saves for a general-purpose map.\n" +
        "- The JDK comment is explicit that this is a trade-off between speed, utility and bit-spreading quality; because the map also tolerates collisions by treeifying, it does not need a cryptographic-strength mix.\n\n" +
        "Historical note worth mentioning: **Java 7 used a much more elaborate four-step hash** (`h ^= (h >>> 20) ^ (h >>> 12); h ^ (h >>> 7) ^ (h >>> 4)`). Java 8 simplified it precisely because the treeification safety net makes an expensive spread unnecessary.\n\n" +
        "`ConcurrentHashMap` does the same thing plus `& HASH_BITS` to clear the sign bit, because it reserves negative hashes for special nodes (`MOVED`, `TREEBIN`, `RESERVED`).",
      code: `import java.util.*;

public class SpreadDemo {

    static int index(int hash, int capacity) { return (capacity - 1) & hash; }
    static int spread(int h) { return h ^ (h >>> 16); }

    public static void main(String[] args) {
        int capacity = 16;

        // Keys that differ only in the HIGH bits.
        int[] rawHashes = { 0x0000_0001, 0x0001_0001, 0x0002_0001, 0x00F0_0001 };

        System.out.println("without spreading:");
        for (int h : rawHashes)
            System.out.printf("  %08X -> bin %d%n", h, index(h, capacity));
        // All four land in bin 1 - a single chain.

        System.out.println("with spreading:");
        for (int h : rawHashes)
            System.out.printf("  %08X -> spread %08X -> bin %d%n",
                              h, spread(h), index(spread(h), capacity));
        // Now they scatter across different bins.

        // Same effect with a realistic key whose hash varies in the high bits.
        Map<Integer, Integer> distribution = new TreeMap<>();
        for (int i = 0; i < 1000; i++) {
            int h = i * 0x0001_0000;                 // entropy only in the top half
            distribution.merge(index(spread(h), 64), 1, Integer::sum);
        }
        System.out.println("occupied bins with spreading: " + distribution.size());

        distribution.clear();
        for (int i = 0; i < 1000; i++) {
            int h = i * 0x0001_0000;
            distribution.merge(index(h, 64), 1, Integer::sum);
        }
        System.out.println("occupied bins without spreading: " + distribution.size()); // 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "The index mask keeps only low bits, so one XOR of the top 16 bits downward cheaply recovers high-bit entropy.",
      followUps: [
        "Why did Java 8 simplify Java 7's four-step hash?",
        "What extra masking does ConcurrentHashMap apply and why?",
      ],
    },
    {
      id: "b069",
      question: "Why must HashMap's capacity be a power of two?",
      answer:
        "Because the bucket index is computed as **`(n - 1) & hash`** instead of `hash % n`.\n\n" +
        "When `n` is a power of two, `n - 1` is a mask of all-ones in the low bits (`16 - 1 = 0b1111`), so the AND keeps exactly `log2(n)` low bits of the hash. That is **identical to `hash % n` for non-negative n** but implemented as a single-cycle bitwise AND rather than an integer division, which historically cost 20–40 cycles. On a structure performing billions of lookups, that matters.\n\n" +
        "Three further benefits:\n\n" +
        "1. **Resizing becomes almost free.** Doubling the capacity adds exactly one bit to the mask, so an existing entry either **stays at index `i`** or **moves to `i + oldCapacity`**, depending on a single bit: `(hash & oldCapacity) == 0`. Java 8 exploits this to split each bin into a 'lo' list and a 'hi' list **without recomputing any hash**.\n" +
        "2. **No negative-index problem.** `hash % n` can be negative for a negative hash; masking cannot.\n" +
        "3. Consistent, predictable behaviour across the whole `java.util.concurrent` family, which uses the same trick.\n\n" +
        "**The consequence for `new HashMap<>(n)`:** the constructor does **not** use `n` as the capacity. `tableSizeFor(n)` rounds **up to the next power of two**, so `new HashMap<>(100)` actually allocates 128 buckets with a threshold of 96. If you truly want to hold 100 entries without a resize you need `new HashMap<>((int)(100 / 0.75f) + 1)` = 134 → rounded to 256.\n\n" +
        "**The cost:** a power-of-two table amplifies any weakness in the low bits of `hashCode`, which is exactly why the spread function exists.",
      code: `import java.util.*;

public class PowerOfTwoDemo {

    /** The JDK's tableSizeFor - round up to the next power of two. */
    static int tableSizeFor(int cap) {
        int n = cap - 1;
        n |= n >>> 1;  n |= n >>> 2;  n |= n >>> 4;  n |= n >>> 8;  n |= n >>> 16;
        return (n < 0) ? 1 : (n >= (1 << 30)) ? (1 << 30) : n + 1;
    }

    public static void main(String[] args) {
        for (int requested : new int[]{ 1, 10, 17, 100, 1000 })
            System.out.printf("new HashMap<>(%d) -> capacity %d, threshold %d%n",
                requested, tableSizeFor(requested), (int)(tableSizeFor(requested) * 0.75f));

        // Mask == modulo for powers of two, but far cheaper.
        int hash = 0x5A5A_1234, n = 16;
        System.out.println(((n - 1) & hash) + " == " + Math.floorMod(hash, n));

        // Resize split: an entry either stays at i or moves to i + oldCap.
        int oldCap = 16, newCap = 32;
        for (int h : new int[]{ 0b0000_0101, 0b0001_0101, 0b0010_0101 }) {
            int oldIdx = (oldCap - 1) & h;
            int newIdx = (newCap - 1) & h;
            boolean movesUp = (h & oldCap) != 0;             // ONE bit decides
            System.out.printf("hash %8s: %2d -> %2d (%s)%n",
                Integer.toBinaryString(h), oldIdx, newIdx,
                movesUp ? "i + oldCap" : "stays at i");
        }

        // Sizing for a known entry count WITHOUT a resize.
        int expectedEntries = 100;
        int capacity = (int) (expectedEntries / 0.75f) + 1;   // 134 -> rounds to 256
        Map<String, String> sized = new HashMap<>(capacity);
        System.out.println("allocated capacity: " + tableSizeFor(capacity));
    }
}`,
      codeLanguage: "java",
      explanation:
        "(n-1) & hash replaces modulo with a mask, and doubling means each entry stays at i or moves to i+oldCap based on one bit.",
      followUps: [
        "What capacity does new HashMap<>(100) actually allocate?",
        "How does the lo/hi split avoid rehashing during resize?",
      ],
    },
    {
      id: "b070",
      question: "What is the load factor, what is the threshold, and why 0.75?",
      answer:
        "- **Load factor** = the fraction of the table that may be filled before growing. Default **0.75**.\n" +
        "- **Threshold** = `capacity * loadFactor`. When `size` exceeds it, `resize()` doubles the table.\n" +
        "- Default: capacity 16, threshold 12. The 13th entry triggers a resize to 32 with a threshold of 24.\n\n" +
        "Why 0.75 specifically? The JDK documents the reasoning: assuming a good hash function, the number of entries per bin follows a **Poisson distribution** with λ = 0.5 at that load. The Javadoc even lists the probabilities — a bin with 8 entries has probability about **0.00000006**, which is why the treeify threshold is 8 and treeification is expected to be rare.\n\n" +
        "The trade-off:\n\n" +
        "- **Lower load factor (0.5)** — fewer collisions, faster lookups, but more memory and more frequent resizes.\n" +
        "- **Higher load factor (1.0)** — better memory use, but chains lengthen and both `get` and `put` slow down.\n" +
        "- 0.75 is the empirical sweet spot between **time and space**, and changing it is almost never the right optimisation.\n\n" +
        "What you *should* tune is the **initial capacity**. Every resize rebuilds the entire table: allocate a new array, walk every bin, split every chain. Inserting a million entries into a default `HashMap` triggers about **16 resizes** and moves several million nodes.\n\n" +
        "Sizing formula: `initialCapacity = (int)(expectedEntries / 0.75f) + 1`. Or simply use **`HashMap.newHashMap(expectedEntries)`** (Java 19+), which does the arithmetic for you. `Maps.newHashMapWithExpectedSize` in Guava is the older equivalent.",
      code: `import java.util.*;

public class LoadFactorDemo {
    public static void main(String[] args) {
        // Default: capacity 16, threshold 12 -> resizes on the 13th entry.
        Map<Integer, Integer> def = new HashMap<>();
        for (int i = 0; i < 13; i++) def.put(i, i);        // resize happened at i == 12

        int n = 1_000_000;

        // Unsized: ~16 resizes, millions of node moves, lots of garbage.
        long t0 = System.nanoTime();
        Map<Integer, Integer> unsized = new HashMap<>();
        for (int i = 0; i < n; i++) unsized.put(i, i);
        long unsizedMs = (System.nanoTime() - t0) / 1_000_000;

        // Sized: zero resizes.
        int capacity = (int) (n / 0.75f) + 1;
        t0 = System.nanoTime();
        Map<Integer, Integer> sized = new HashMap<>(capacity);
        for (int i = 0; i < n; i++) sized.put(i, i);
        long sizedMs = (System.nanoTime() - t0) / 1_000_000;

        System.out.printf("unsized=%dms sized=%dms%n", unsizedMs, sizedMs);

        // Java 19+: the arithmetic done for you.
        // Map<Integer,Integer> clean = HashMap.newHashMap(n);

        // Load factor trade-off.
        Map<Integer, Integer> lowLf  = new HashMap<>(16, 0.5f);  // fewer collisions, more RAM
        Map<Integer, Integer> highLf = new HashMap<>(16, 1.0f);  // denser, longer chains

        // Poisson(0.5) - why TREEIFY_THRESHOLD is 8:
        //   0 -> 0.60653066     4 -> 0.00157529
        //   1 -> 0.30326533     5 -> 0.00015754
        //   2 -> 0.07581633     6 -> 0.00001312
        //   3 -> 0.01263606     7 -> 0.00000094
        //                       8 -> 0.00000006   <- effectively never
        System.out.println(lowLf.size() + highLf.size() + sized.size() + def.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Threshold = capacity × 0.75; the value comes from a Poisson analysis that also justifies treeifying at 8 — tune initial capacity, not load factor.",
      followUps: [
        "How many resizes does inserting 1M entries into a default HashMap cause?",
        "Why is changing the load factor rarely the right optimisation?",
      ],
    },
    {
      id: "b071",
      question: "Explain treeification: TREEIFY_THRESHOLD, UNTREEIFY_THRESHOLD and MIN_TREEIFY_CAPACITY.",
      answer:
        "Java 8 added **treeification** to bound the worst case of a hash collision attack or a pathological `hashCode`.\n\n" +
        "The three constants:\n\n" +
        "- **`TREEIFY_THRESHOLD = 8`** — when a bin's chain reaches 8 nodes, consider converting it to a red-black tree. Chosen because Poisson analysis at load factor 0.75 gives a probability of about 6 in 100 million for a bin of 8, so this path is effectively only reached under adversarial or broken hashing.\n" +
        "- **`UNTREEIFY_THRESHOLD = 6`** — during a resize, a tree bin that shrinks to 6 or fewer nodes converts back to a linked list. The gap between 8 and 6 provides **hysteresis**, preventing thrashing back and forth around a single boundary.\n" +
        "- **`MIN_TREEIFY_CAPACITY = 64`** — treeification only happens if the table has at least 64 bins. Below that, a long chain is more likely to mean 'the table is too small' than 'the hashes genuinely collide', so `resize()` is called instead, which is cheaper and usually fixes it.\n\n" +
        "What a tree bin looks like:\n\n" +
        "- Nodes become `TreeNode`s, which extend `LinkedHashMap.Entry` and add `parent`, `left`, `right`, `prev` and a `red` flag. They keep the `next` pointer too, so the bin remains traversable as a list.\n" +
        "- Ordering inside the tree uses the **hash** first; if hashes tie and the keys are `Comparable` of the same class, `compareTo` breaks the tie; otherwise a deterministic tie-breaker based on class name and `System.identityHashCode` keeps the tree balanced.\n" +
        "- Lookup in a tree bin is **O(log n)** instead of O(n).\n\n" +
        "**Why it mattered:** before Java 8, a crafted set of colliding keys (the 2011 hash-collision DoS) could turn every `HashMap` lookup into O(n) and take down a web server through parameter parsing. Treeification caps the damage at O(log n). Mentioning that history is a strong signal.",
      code: `import java.util.*;

/** All instances collide: a constant hashCode forces one bin. */
final class Collider implements Comparable<Collider> {
    final int id;
    Collider(int id) { this.id = id; }
    @Override public int hashCode() { return 42; }               // pathological
    @Override public boolean equals(Object o) {
        return o instanceof Collider c && c.id == id;
    }
    // Being Comparable lets the tree order ties properly instead of
    // falling back to the identity-hash tie-breaker.
    @Override public int compareTo(Collider o) { return Integer.compare(id, o.id); }
    @Override public String toString() { return "C" + id; }
}

public class TreeifyDemo {
    public static void main(String[] args) {
        // Below MIN_TREEIFY_CAPACITY (64) the map RESIZES instead of treeifying.
        Map<Collider, Integer> small = new HashMap<>(16);
        for (int i = 0; i < 10; i++) small.put(new Collider(i), i);
        // table has grown 16 -> 32 -> 64 ... rather than building a tree

        // Above 64 bins, a chain of 8 becomes a red-black tree.
        Map<Collider, Integer> big = new HashMap<>(128);
        for (int i = 0; i < 1000; i++) big.put(new Collider(i), i);

        long t0 = System.nanoTime();
        for (int i = 0; i < 1000; i++) big.get(new Collider(i));   // O(log n) per lookup
        System.out.println("1000 treeified lookups: "
                           + (System.nanoTime() - t0) / 1000 + " us");

        // A correct hashCode keeps everything O(1) with no tree at all.
        record Good(int id) {}
        Map<Good, Integer> good = new HashMap<>(2048);
        for (int i = 0; i < 1000; i++) good.put(new Good(i), i);
        t0 = System.nanoTime();
        for (int i = 0; i < 1000; i++) good.get(new Good(i));
        System.out.println("1000 hashed lookups:    "
                           + (System.nanoTime() - t0) / 1000 + " us");

        // Constants for reference:
        //   TREEIFY_THRESHOLD    = 8   chain -> tree
        //   UNTREEIFY_THRESHOLD  = 6   tree  -> chain (hysteresis)
        //   MIN_TREEIFY_CAPACITY = 64  below this, resize instead
        System.out.println(small.size() + " " + big.size() + " " + good.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Chains treeify at 8 only when the table has 64+ bins, untreeify at 6 for hysteresis — it caps collision-attack damage at O(log n).",
      followUps: [
        "Why is the untreeify threshold 6 rather than 8?",
        "What happens if the colliding keys are not Comparable?",
      ],
    },
    {
      id: "b072",
      question: "How does HashMap resize, and what changed from Java 7 to Java 8?",
      answer:
        "Resize doubles the capacity and redistributes every entry.\n\n" +
        "Java 8 algorithm:\n\n" +
        "1. `newCap = oldCap << 1`, `newThr = oldThr << 1`.\n" +
        "2. Allocate the new array.\n" +
        "3. For each bin, use the key insight: with capacity doubling, the mask gains exactly one bit, so each entry either stays at index `i` or moves to `i + oldCap`. The deciding test is **`(e.hash & oldCap) == 0`**.\n" +
        "4. Split the chain into a **lo list** and a **hi list** in a single pass, preserving relative order, and attach them at `newTab[i]` and `newTab[i + oldCap]`.\n" +
        "5. No hash is recomputed, and **order within a bin is preserved**.\n" +
        "6. Tree bins are split the same way; if either half falls to 6 or fewer nodes it is untreeified.\n\n" +
        "Java 7 algorithm and its famous bug:\n\n" +
        "- Java 7 **rehashed** every key and inserted at the **head** of the new bin, which **reversed** the chain order.\n" +
        "- Under concurrent resizing by two threads, that head insertion could produce a **circular linked list**. A subsequent `get()` would spin forever — a 100% CPU hang with no exception, one of the most notorious production failures in Java history.\n" +
        "- Java 8's tail-preserving lo/hi split makes that specific infinite loop impossible.\n\n" +
        "**But Java 8 `HashMap` is still not thread-safe.** Concurrent writes can still lose updates, corrupt the tree structure, produce a wrong `size`, or throw. The fix is `ConcurrentHashMap`, never 'it's fine now'.\n\n" +
        "Cost: resize is **O(n)** and allocates a whole new array, so repeatedly growing a large map is a real source of latency spikes and GC pressure. Pre-size it.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class ResizeDemo {

    public static void main(String[] args) throws Exception {
        // The lo/hi split: one bit of the hash decides the destination.
        int oldCap = 16;
        System.out.println("hash     oldIdx newIdx  decided by (hash & oldCap)");
        for (int h : new int[]{ 0b0000_0011, 0b0001_0011, 0b0010_0011, 0b0011_0011 }) {
            int oldIdx = (oldCap - 1) & h;
            int newIdx = ((oldCap << 1) - 1) & h;
            System.out.printf("%8s %6d %6d  %s%n", Integer.toBinaryString(h),
                oldIdx, newIdx, (h & oldCap) == 0 ? "lo (stays)" : "hi (i + oldCap)");
        }

        // Resize cost: watch the pauses as a big map grows.
        Map<Integer, Integer> growing = new HashMap<>();
        long worst = 0; int worstAt = 0;
        for (int i = 0; i < 2_000_000; i++) {
            long t0 = System.nanoTime();
            growing.put(i, i);
            long dt = System.nanoTime() - t0;
            if (dt > worst) { worst = dt; worstAt = i; }     // spikes land on resizes
        }
        System.out.printf("worst single put: %d us at entry %d%n", worst / 1000, worstAt);

        // Java 8 HashMap is STILL not thread-safe: lost updates under concurrency.
        Map<Integer, Integer> unsafe = new HashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch done = new CountDownLatch(8);
        for (int t = 0; t < 8; t++) {
            final int base = t * 100_000;
            pool.submit(() -> {
                for (int i = 0; i < 100_000; i++) unsafe.put(base + i, i);
                done.countDown();
            });
        }
        done.await(); pool.shutdown();
        System.out.println("expected 800000, actual " + unsafe.size());  // usually fewer

        Map<Integer, Integer> safe = new ConcurrentHashMap<>();          // the fix
        System.out.println(safe.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Java 8 splits each bin into lo/hi using one hash bit with no rehashing, killing Java 7's head-insertion infinite loop — but writes are still unsafe.",
      followUps: [
        "Walk me through how Java 7's resize created a cycle.",
        "What still goes wrong with a concurrently written Java 8 HashMap?",
      ],
    },
    {
      id: "b073",
      question: "What happens when two keys have the same hashCode but are not equal?",
      answer:
        "They **collide**: both land in the same bin, and the map stores both.\n\n" +
        "Step by step for `put(k2, v2)` when `k2.hashCode() == k1.hashCode()` but `!k1.equals(k2)`:\n\n" +
        "1. Both compute the same spread hash and the same index.\n" +
        "2. `put` walks the bin. For each node it checks `e.hash == hash && (e.key == key || key.equals(e.key))`.\n" +
        "3. The hash check passes, the `equals` check **fails**, so the walk continues.\n" +
        "4. The end of the chain is reached, so a new `Node` is appended. Size grows by one.\n\n" +
        "For `get(k2)`: same index, walk the chain, skip `k1` because `equals` fails, return `v2`. **Both entries coexist and are retrievable.**\n\n" +
        "The costs:\n\n" +
        "- Lookup in that bin degrades from O(1) to **O(k)** where k is the chain length — or O(log k) once the bin treeifies at 8 entries with a table of 64+.\n" +
        "- More `equals` calls, which for long strings or deep objects is not cheap.\n\n" +
        "**The mirror-image case is the dangerous one:** equal objects with **different** hash codes. Then `put` and `get` compute different bins, so `map.get(equalKey)` returns `null` and a `HashSet` holds visible duplicates. That is the real bug, and it comes from overriding `equals` without `hashCode`.\n\n" +
        "**The summary sentence:** 'the same hash code is a performance issue; a different hash code for equal objects is a correctness bug.'",
      code: `import java.util.*;

final class SameHash {
    private final String name;
    SameHash(String name) { this.name = name; }
    @Override public int hashCode() { return 1; }                 // everyone collides
    @Override public boolean equals(Object o) {
        return o instanceof SameHash s && s.name.equals(name);    // but they are distinct
    }
    @Override public String toString() { return name; }
}

final class EqualsWithoutHashCode {
    private final String name;
    EqualsWithoutHashCode(String name) { this.name = name; }
    @Override public boolean equals(Object o) {
        return o instanceof EqualsWithoutHashCode e && e.name.equals(name);
    }
    // hashCode NOT overridden -> identity hash -> different bins for equal objects
}

public class CollisionDemo {
    public static void main(String[] args) {
        // Case 1: same hash, not equal -> BOTH stored, just slower.
        Map<SameHash, String> map = new HashMap<>();
        map.put(new SameHash("a"), "A");
        map.put(new SameHash("b"), "B");
        map.put(new SameHash("c"), "C");
        System.out.println(map.size());                     // 3 - all coexist
        System.out.println(map.get(new SameHash("b")));     // B - correct, chain walked

        // Case 2: equal but different hashes -> the real BUG.
        Map<EqualsWithoutHashCode, String> broken = new HashMap<>();
        EqualsWithoutHashCode k1 = new EqualsWithoutHashCode("x");
        EqualsWithoutHashCode k2 = new EqualsWithoutHashCode("x");
        broken.put(k1, "first");
        System.out.println(k1.equals(k2));                  // true
        System.out.println(broken.get(k2));                 // null (!)
        broken.put(k2, "second");
        System.out.println(broken.size());                  // 2 - duplicate "keys"

        // Cost of collisions at scale.
        Map<SameHash, Integer> colliding = new HashMap<>();
        for (int i = 0; i < 20_000; i++) colliding.put(new SameHash("k" + i), i);
        long t0 = System.nanoTime();
        for (int i = 0; i < 1_000; i++) colliding.get(new SameHash("k" + i));
        System.out.println("colliding lookups us: " + (System.nanoTime() - t0) / 1000);

        Map<String, Integer> healthy = new HashMap<>(32_768);
        for (int i = 0; i < 20_000; i++) healthy.put("k" + i, i);
        t0 = System.nanoTime();
        for (int i = 0; i < 1_000; i++) healthy.get("k" + i);
        System.out.println("healthy   lookups us: " + (System.nanoTime() - t0) / 1000);
    }
}`,
      codeLanguage: "java",
      explanation:
        "Same hash + not equal = both stored, slower; equal + different hash = lookups fail and duplicates appear — that is the actual bug.",
      followUps: [
        "At what point does the colliding bin become a tree?",
        "How would you detect a bad hashCode in production?",
      ],
    },
    {
      id: "b074",
      question: "Can you use a mutable object as a HashMap key? What exactly goes wrong?",
      answer:
        "You *can* — the compiler will not stop you — but it is almost always a bug.\n\n" +
        "What happens:\n\n" +
        "1. `put(key, value)` computes `hash` from the key's current state and stores the entry in bin `i`. **The hash is cached in the `Node`** (`final int hash`).\n" +
        "2. You mutate a field that participates in `hashCode`.\n" +
        "3. `get(key)` now computes a **different** hash, so it looks in bin `j != i` and finds nothing → returns `null`.\n" +
        "4. The entry is still in the map: `size()` counts it, iteration yields it, and it keeps its memory. It is **unreachable by lookup but not removed** — a logical leak.\n" +
        "5. Worse, `remove(key)` also fails, so you cannot even clean it up by key. You must iterate and remove via the iterator.\n" +
        "6. Even restoring the original state does not reliably help if a resize happened in between.\n\n" +
        "The rules:\n\n" +
        "- **Keys should be immutable** — `String`, boxed primitives, `UUID`, `LocalDate`, enums, records with immutable components.\n" +
        "- If the key must be a mutable class, base `equals`/`hashCode` **only on immutable fields** (a final business identifier).\n" +
        "- A JPA entity as a key is the common real-world offender: the generated `@Id` is `null` before persist and set afterwards, so the hash changes mid-lifecycle. Use the business key or a constant `hashCode`.\n" +
        "- If you must key on a mutable object, either remove it before mutating and re-insert afterwards, or key on a snapshot/identifier instead.\n\n" +
        "Note that `TreeMap` has the same problem via `compareTo`, and it is arguably worse: the tree's ordering invariant is broken, so search can walk the wrong subtree entirely.",
      code: `import java.util.*;

class MutablePoint {
    int x, y;
    MutablePoint(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        return o instanceof MutablePoint p && p.x == x && p.y == y;
    }
    @Override public int hashCode() { return Objects.hash(x, y); }
    @Override public String toString() { return "(" + x + "," + y + ")"; }
}

/** Safe: identity is a final field that never changes. */
final class StableKey {
    private final String id;                       // immutable identity
    private String displayName;                    // mutable, NOT part of identity
    StableKey(String id, String displayName) { this.id = id; this.displayName = displayName; }
    void rename(String n) { this.displayName = n; }
    @Override public boolean equals(Object o) {
        return o instanceof StableKey k && k.id.equals(id);
    }
    @Override public int hashCode() { return id.hashCode(); }
}

public class MutableKeyDemo {
    public static void main(String[] args) {
        Map<MutablePoint, String> map = new HashMap<>();
        MutablePoint key = new MutablePoint(1, 1);
        map.put(key, "origin-ish");

        System.out.println(map.get(key));            // origin-ish

        key.x = 99;                                  // mutate a hashed field

        System.out.println(map.get(key));            // null  (!)
        System.out.println(map.containsKey(key));    // false (!)
        System.out.println(map.size());              // 1     - still in there
        System.out.println(map.keySet());            // [(99,1)]
        System.out.println(map.remove(key));         // null  - cannot even remove it

        // The only way out: iterate and remove through the iterator.
        map.entrySet().removeIf(e -> e.getKey().x == 99);
        System.out.println(map.size());              // 0

        // Safe pattern: mutate only non-identity state.
        Map<StableKey, String> safe = new HashMap<>();
        StableKey sk = new StableKey("u-1", "Ada");
        safe.put(sk, "admin");
        sk.rename("Ada L.");                          // hash unchanged
        System.out.println(safe.get(sk));             // admin

        // Or: remove, mutate, re-insert.
        Map<MutablePoint, String> disciplined = new HashMap<>();
        MutablePoint p = new MutablePoint(2, 2);
        disciplined.put(p, "v");
        String v = disciplined.remove(p);
        p.x = 3;
        disciplined.put(p, v);
        System.out.println(disciplined.get(new MutablePoint(3, 2)));   // v
    }
}`,
      codeLanguage: "java",
      explanation:
        "The Node caches the hash, so mutating a hashed field strands the entry: lookup and remove both fail while size and iteration still show it.",
      followUps: [
        "Why is a JPA entity a dangerous map key?",
        "How is the TreeMap version of this bug worse?",
      ],
    },
    {
      id: "b075",
      question: "HashMap vs Hashtable vs ConcurrentHashMap vs LinkedHashMap vs TreeMap — a complete comparison.",
      answer:
        "HashMap:\n\n" +
        "- Not synchronised. **One null key**, many null values. No ordering. O(1) average, O(log n) worst per bin. The default choice single-threaded.\n\n" +
        "Hashtable (legacy, since JDK 1.0):\n\n" +
        "- Every method `synchronized` on the whole object → one operation at a time. **No nulls at all**. Uses `hash % capacity` with a prime-ish capacity rather than a power-of-two mask. `Enumeration` in addition to `Iterator`. **Obsolete** — say so.\n\n" +
        "ConcurrentHashMap:\n\n" +
        "- Thread-safe with **lock-free reads** and per-bin `synchronized` writes (Java 8+; segment locks in Java 7). **No null keys or values** — deliberately, so `get` returning null is unambiguous.\n" +
        "- Atomic `merge`, `compute`, `computeIfAbsent`, `putIfAbsent`. `size()` is an estimate; prefer `mappingCount()`.\n" +
        "- Weakly consistent iterators: never throw `ConcurrentModificationException`.\n\n" +
        "LinkedHashMap:\n\n" +
        "- `HashMap` plus a doubly-linked list of entries: **insertion order** by default, **access order** with the 3-arg constructor. `removeEldestEntry` gives you an LRU cache. Slightly more memory, faster iteration. One null key.\n\n" +
        "TreeMap:\n\n" +
        "- Red-black tree, **O(log n)** for everything, **sorted** by `Comparable`/`Comparator`, `NavigableMap` range operations. **No null key** (it must be comparable). Not synchronised.\n\n" +
        "The selection rule:\n\n" +
        "- Single-threaded, no ordering → `HashMap`.\n" +
        "- Need predictable iteration order or LRU → `LinkedHashMap`.\n" +
        "- Need sorted keys or range queries → `TreeMap`.\n" +
        "- Multi-threaded → `ConcurrentHashMap` (or `ConcurrentSkipListMap` if you also need sorting).\n" +
        "- `Hashtable` → never in new code.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class MapComparison {
    public static void main(String[] args) {
        List<String> keys = List.of("delta", "alpha", "charlie", "bravo");

        Map<String, Integer> hash        = new HashMap<>();
        Map<String, Integer> linked      = new LinkedHashMap<>();
        Map<String, Integer> tree        = new TreeMap<>();
        Map<String, Integer> concurrent  = new ConcurrentHashMap<>();
        Map<String, Integer> legacy      = new Hashtable<>();

        for (int i = 0; i < keys.size(); i++) {
            hash.put(keys.get(i), i); linked.put(keys.get(i), i);
            tree.put(keys.get(i), i); concurrent.put(keys.get(i), i);
            legacy.put(keys.get(i), i);
        }

        System.out.println("HashMap       " + hash);        // arbitrary
        System.out.println("LinkedHashMap " + linked);      // insertion order
        System.out.println("TreeMap       " + tree);        // sorted
        System.out.println("CHM           " + concurrent);  // arbitrary
        System.out.println("Hashtable     " + legacy);      // arbitrary

        // Null tolerance - a real differentiator.
        hash.put(null, 0);   hash.put("k", null);           // both fine
        linked.put(null, 0);                                // fine
        try { tree.put(null, 0); }
        catch (NullPointerException e) { System.out.println("TreeMap: no null key"); }
        try { concurrent.put(null, 0); }
        catch (NullPointerException e) { System.out.println("CHM: no null key"); }
        try { concurrent.put("k", null); }
        catch (NullPointerException e) { System.out.println("CHM: no null value"); }
        try { legacy.put(null, 0); }
        catch (NullPointerException e) { System.out.println("Hashtable: no nulls"); }

        // TreeMap's payoff: navigation.
        NavigableMap<String, Integer> nav = new TreeMap<>(tree);
        System.out.println(nav.firstKey() + " " + nav.ceilingKey("b")
                           + " " + nav.headMap("charlie"));

        // LinkedHashMap's payoff: LRU in one override.
        Map<String, Integer> lru = new LinkedHashMap<>(4, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<String, Integer> e) {
                return size() > 2;
            }
        };
        lru.put("a", 1); lru.put("b", 2); lru.get("a"); lru.put("c", 3);
        System.out.println(lru.keySet());                   // [a, c]

        // CHM's payoff: atomic updates without external locks.
        concurrent.merge("counter", 1, Integer::sum);
        System.out.println(((ConcurrentHashMap<String,Integer>) concurrent).mappingCount());
    }
}`,
      codeLanguage: "java",
      explanation:
        "Differentiate on synchronisation, null policy, ordering and complexity — and say Hashtable is obsolete, replaced by ConcurrentHashMap.",
      followUps: [
        "Why exactly does ConcurrentHashMap forbid null values?",
        "When would you use ConcurrentSkipListMap?",
      ],
    },
    {
      id: "b076",
      question: "Why does HashMap allow one null key while ConcurrentHashMap allows none?",
      answer:
        "HashMap's null key:\n\n" +
        "- `hash(null)` is defined to return **0**, so a null key always lands in **bin 0**. `putForNullKey`/`getForNullKey` logic is folded into the normal path in Java 8 via the `key == null ? 0 : ...` expression.\n" +
        "- Only **one** null key is possible, because a second `put(null, v)` finds the existing entry and replaces its value.\n" +
        "- Any number of null **values** is fine.\n" +
        "- The cost: `map.get(k)` returning `null` is **ambiguous** — it means either 'no mapping' or 'mapped to null'. You must call `containsKey` to distinguish, which is two lookups.\n\n" +
        "ConcurrentHashMap forbids both:\n\n" +
        "- Doug Lea's explanation is about **concurrency, not convenience**. In a single-threaded map you can disambiguate with `containsKey`, because nothing changes between the two calls. In a concurrent map **another thread can insert or remove between `get` and `containsKey`**, so the disambiguation is itself racy and there is no way to make it atomic without an extra lock.\n" +
        "- Banning nulls makes `get() == null` mean exactly one thing: **absent**. That single guarantee is what makes `putIfAbsent`, `computeIfAbsent`, `merge` and `replace` implementable atomically and cheaply.\n" +
        "- Lea has also said that allowing nulls in `Map` at all was arguably a design mistake, and the concurrent collections deliberately did not repeat it.\n\n" +
        "Others: `Hashtable` forbids nulls (a 1.0-era decision). `TreeMap` forbids a null key because it cannot be compared, but allows null values. `List.of`/`Map.of` are entirely null-hostile.\n\n" +
        "**Practical advice:** prefer `Optional` or a sentinel over a null value, and use `getOrDefault` to make the intent explicit.",
      code: `import java.util.*;
import java.util.concurrent.*;

public class NullPolicyDemo {
    public static void main(String[] args) {
        Map<String, String> hashMap = new HashMap<>();
        hashMap.put(null, "null-key-value");           // bin 0
        hashMap.put("k", null);                        // null value
        hashMap.put(null, "replaced");                 // only ONE null key

        System.out.println(hashMap.get(null));         // replaced
        System.out.println(hashMap.size());            // 2

        // The ambiguity that nulls introduce.
        System.out.println(hashMap.get("k"));          // null - mapped to null
        System.out.println(hashMap.get("missing"));    // null - absent
        System.out.println(hashMap.containsKey("k") + " " + hashMap.containsKey("missing"));

        // getOrDefault does NOT rescue you: it returns the stored null.
        System.out.println(hashMap.getOrDefault("k", "fallback"));   // null

        ConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();
        try { chm.put(null, "v"); }
        catch (NullPointerException e) { System.out.println("CHM: null key rejected"); }
        try { chm.put("k", null); }
        catch (NullPointerException e) { System.out.println("CHM: null value rejected"); }

        // Why: in a concurrent map, get-then-containsKey is itself a race.
        //   Thread A: chm.get("k")        -> null
        //   Thread B: chm.put("k", "v")
        //   Thread A: chm.containsKey("k") -> true      <- inconsistent view
        // Banning nulls makes get()==null mean exactly "absent".

        chm.put("k", "v");
        System.out.println(chm.getOrDefault("missing", "fallback")); // fallback, unambiguous

        // Modelling absence explicitly instead of with null.
        Map<String, Optional<String>> explicit = new ConcurrentHashMap<>();
        explicit.put("k", Optional.empty());           // "known to have no value"
        System.out.println(explicit.get("k"));         // Optional.empty
        System.out.println(explicit.get("missing"));   // null -> truly absent
    }
}`,
      codeLanguage: "java",
      explanation:
        "Null makes get()==null ambiguous; in a concurrent map the get-then-containsKey disambiguation is itself racy, so nulls are banned outright.",
      followUps: [
        "Show the race that makes containsKey disambiguation unreliable.",
        "What should you store instead of a null value?",
      ],
    },
    {
      id: "b077",
      question: "How would you implement an LRU cache? Compare LinkedHashMap, a hand-rolled version, and Caffeine.",
      answer:
        "Three levels of answer, and a strong candidate gives all three.\n\n" +
        "1. LinkedHashMap — five lines:\n\n" +
        "- Construct with `new LinkedHashMap<>(capacity, 0.75f, true)`; the `true` enables **access order**, so `get` moves the entry to the tail.\n" +
        "- Override `removeEldestEntry(eldest)` to return `size() > capacity`; the map evicts the head automatically after each insertion.\n" +
        "- Not thread-safe — wrap with `Collections.synchronizedMap` or an explicit lock. Note that even `get` is a **structural mutation** in access-order mode, so reads need the lock too.\n\n" +
        "2. Hand-rolled HashMap + doubly-linked list — the whiteboard version:\n\n" +
        "- `HashMap<K, Node>` for O(1) lookup, plus a doubly-linked list with **sentinel head and tail** nodes for O(1) move-to-front and O(1) eviction from the back.\n" +
        "- `get`: look up, unlink, insert after head, return value.\n" +
        "- `put`: if present update and move; else insert at front, and if over capacity remove the node before tail and delete its key from the map.\n" +
        "- Sentinels remove all the null-checking edge cases — mention that; interviewers notice.\n\n" +
        "3. Caffeine — the production answer:\n\n" +
        "- Uses **W-TinyLFU**, which beats pure LRU on hit rate by admitting entries based on frequency, not just recency, so a one-off scan does not flush the cache.\n" +
        "- Gives you `expireAfterWrite`, `expireAfterAccess`, `refreshAfterWrite`, `maximumWeight`, async loading, and hit/miss statistics.\n" +
        "- Integrates directly with Spring's `@Cacheable` via `CaffeineCacheManager`.\n\n" +
        "**The closing line:** 'I would write the doubly-linked-list version in an interview, use `LinkedHashMap` for a quick in-process cache, and Caffeine in production.'",
      code: `import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

public class LruCaches {

    /** 1. LinkedHashMap - access order + removeEldestEntry. */
    static class LinkedLru<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;
        LinkedLru(int capacity) { super(capacity, 0.75f, true); this.capacity = capacity; }
        @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacity;
        }
    }

    /** 2. HashMap + doubly-linked list with sentinels - the interview version. */
    static class Lru<K, V> {
        private final class Node {
            K key; V value; Node prev, next;
            Node(K k, V v) { key = k; value = v; }
        }
        private final int capacity;
        private final Map<K, Node> index;
        private final Node head = new Node(null, null);     // sentinel: most recent side
        private final Node tail = new Node(null, null);     // sentinel: least recent side

        Lru(int capacity) {
            this.capacity = capacity;
            this.index = new HashMap<>(capacity * 4 / 3 + 1);
            head.next = tail; tail.prev = head;
        }

        private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
        private void pushFront(Node n) {
            n.next = head.next; n.prev = head;
            head.next.prev = n; head.next = n;
        }

        V get(K key) {
            Node n = index.get(key);
            if (n == null) return null;
            unlink(n); pushFront(n);                        // O(1) move to front
            return n.value;
        }

        void put(K key, V value) {
            Node n = index.get(key);
            if (n != null) { n.value = value; unlink(n); pushFront(n); return; }
            if (index.size() == capacity) {
                Node lru = tail.prev;                       // O(1) eviction
                unlink(lru); index.remove(lru.key);
            }
            Node fresh = new Node(key, value);
            index.put(key, fresh); pushFront(fresh);
        }
        int size() { return index.size(); }
    }

    public static void main(String[] args) {
        Lru<String, Integer> lru = new Lru<>(3);
        lru.put("a", 1); lru.put("b", 2); lru.put("c", 3);
        lru.get("a");                                       // a becomes most recent
        lru.put("d", 4);                                    // evicts b
        System.out.println(lru.get("b") + " " + lru.get("a") + " " + lru.size()); // null 1 3

        // Thread safety: even get() mutates in access-order mode.
        Map<String, Integer> shared = Collections.synchronizedMap(new LinkedLru<>(100));
        ReentrantLock lock = new ReentrantLock();
        lock.lock(); try { shared.put("k", 1); } finally { lock.unlock(); }

        // 3. Production:
        // Cache<String,Integer> cache = Caffeine.newBuilder()
        //     .maximumSize(10_000).expireAfterWrite(Duration.ofMinutes(5))
        //     .recordStats().build();
    }
}`,
      codeLanguage: "java",
      explanation:
        "LinkedHashMap access-order for five lines, HashMap + sentinel-based doubly-linked list for the whiteboard, Caffeine's W-TinyLFU for production.",
      followUps: [
        "Why do sentinel nodes simplify the implementation?",
        "How does W-TinyLFU beat LRU on hit rate?",
      ],
    },
    {
      id: "b078",
      question: "What is a hash collision DoS attack and how does Java defend against it?",
      answer:
        "The attack (disclosed at 28C3 in 2011, affecting Java, PHP, Python, Ruby, ASP.NET and others):\n\n" +
        "- Web frameworks parse request parameters, JSON bodies or headers into a `HashMap` keyed by attacker-controlled strings.\n" +
        "- `String.hashCode()` is `s[0]*31^(n-1) + s[1]*31^(n-2) + ...` — a simple, **published, non-randomised** function. It is trivial to generate thousands of distinct strings with the **same** hash (`\"Aa\"` and `\"BB\"` both hash to 2112, and you can concatenate them combinatorially).\n" +
        "- In pre-Java-8 `HashMap`, all of them land in one bin as a linked list. Inserting n colliding keys costs **O(n²)** because each insert walks the whole chain checking `equals`.\n" +
        "- A single POST with ~20,000 crafted parameters could burn **minutes of CPU** on one core. A handful of requests takes the server down — an asymmetric, cheap denial of service.\n\n" +
        "Java's defences:\n\n" +
        "1. **Treeification (Java 8)** — a bin with 8+ entries and a table of 64+ becomes a red-black tree, so the worst case drops from O(n²) to **O(n log n)** for n inserts. Tolerable rather than fatal.\n" +
        "2. **Parameter count limits** in servlet containers — Tomcat's `maxParameterCount` (default 10,000), `maxPostSize`, and header count limits cap how much attacker input reaches the map in the first place. Spring Boot exposes these as `server.tomcat.max-parameter-count`.\n" +
        "3. **Randomised hashing** — Java 7u6 briefly added `jdk.map.althashing.threshold` to seed string hashing per JVM; it was removed in Java 8 because treeification made it unnecessary and `String.hashCode` is specified in the Javadoc and therefore cannot change.\n\n" +
        "**Design lesson to state:** never let untrusted input choose the keys of an unbounded map. Validate counts, bound sizes, and prefer a fixed schema over a free-form map.",
      code: `import java.util.*;

public class HashDosDemo {

    /** Generate distinct strings that all share one String.hashCode(). */
    static List<String> collidingStrings(int count) {
        // "Aa" and "BB" both hash to 2112; concatenations of them also collide.
        List<String> out = new ArrayList<>(List.of(""));
        while (out.size() < count) {
            List<String> next = new ArrayList<>(out.size() * 2);
            for (String s : out) { next.add(s + "Aa"); next.add(s + "BB"); }
            out = next;
        }
        return out.subList(0, count);
    }

    public static void main(String[] args) {
        List<String> evil = collidingStrings(16_384);
        System.out.println("distinct strings: " + new HashSet<>(evil).size());
        System.out.println("distinct hashes:  "
            + evil.stream().map(String::hashCode).distinct().count());   // 1

        long t0 = System.nanoTime();
        Map<String, Integer> attacked = new HashMap<>();
        for (int i = 0; i < evil.size(); i++) attacked.put(evil.get(i), i);
        long attackedMs = (System.nanoTime() - t0) / 1_000_000;

        List<String> benign = new ArrayList<>(evil.size());
        for (int i = 0; i < evil.size(); i++) benign.add("key-" + i);
        t0 = System.nanoTime();
        Map<String, Integer> normal = new HashMap<>();
        for (int i = 0; i < benign.size(); i++) normal.put(benign.get(i), i);
        long normalMs = (System.nanoTime() - t0) / 1_000_000;

        System.out.printf("colliding inserts: %d ms%nnormal inserts:    %d ms%n",
                          attackedMs, normalMs);
        // Pre-Java-8 the ratio was catastrophic (O(n^2) chains).
        // Java 8 treeification keeps it merely slow (O(n log n)).

        // Defence in depth - application level:
        //   server.tomcat.max-parameter-count: 1000
        //   server.tomcat.max-http-form-post-size: 256KB
        //   spring.servlet.multipart.max-request-size: 10MB
        //   validate a fixed DTO schema instead of binding a free-form Map
    }
}`,
      codeLanguage: "java",
      explanation:
        "Attacker-chosen keys with equal hashes made inserts O(n²); treeification plus container parameter limits are the defence.",
      followUps: [
        "Why was randomised string hashing removed again in Java 8?",
        "Which Tomcat settings would you change to cap the blast radius?",
      ],
    },
    {
      id: "b079",
      question: "How do you write a good hashCode? Walk me through the algorithm and the 31 multiplier.",
      answer:
        "The standard recipe (Effective Java, Item 11):\n\n" +
        "1. Pick a non-zero constant, conventionally `int result = 17`.\n" +
        "2. For each **significant** field (every field used in `equals`, and no others):\n" +
        "   - compute a field hash `c`:\n" +
        "     - `boolean` → `b ? 1 : 0`\n" +
        "     - `byte`/`char`/`short`/`int` → `(int) f`\n" +
        "     - `long` → `(int)(f ^ (f >>> 32))`\n" +
        "     - `float` → `Float.floatToIntBits(f)`\n" +
        "     - `double` → `Double.doubleToLongBits(f)` then fold as a long\n" +
        "     - object → `f == null ? 0 : f.hashCode()`\n" +
        "     - array → `Arrays.hashCode(f)` (or `deepHashCode` for nested)\n" +
        "   - combine: `result = 31 * result + c`.\n" +
        "3. Return `result`.\n\n" +
        "**Why 31:**\n\n" +
        "- It is **odd**, so multiplying never loses bits to a shift-out the way an even multiplier would (an even factor discards the high bit each time and quickly zeroes low bits).\n" +
        "- It is **prime**, which historically gave better distribution.\n" +
        "- `31 * i` compiles to **`(i << 5) - i`**, a shift and a subtract, which was a meaningful optimisation on older CPUs and is still emitted by the JIT.\n" +
        "- It is what `String.hashCode` uses, so it is a well-understood convention.\n\n" +
        "In modern code just call **`Objects.hash(a, b, c)`** — but know that it **boxes every argument and allocates a varargs array**, so in a hot loop the hand-written version is measurably faster. `Objects.hashCode(x)` (singular) is null-safe and allocation-free.\n\n" +
        "Rules of thumb: include only fields in `equals`; exclude derived fields; **never include a mutable field** if the object is used as a key; do not return a constant (correct but O(n) lookups); and prefer a `record`, which generates a correct implementation for free.",
      code: `import java.util.*;

final class Trade {
    private final String symbol;
    private final long   quantity;
    private final double price;
    private final boolean settled;
    private final String[] tags;

    Trade(String symbol, long quantity, double price, boolean settled, String[] tags) {
        this.symbol = symbol; this.quantity = quantity; this.price = price;
        this.settled = settled; this.tags = tags;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Trade t = (Trade) o;
        return quantity == t.quantity
            && Double.compare(price, t.price) == 0
            && settled == t.settled
            && Objects.equals(symbol, t.symbol)
            && Arrays.equals(tags, t.tags);
    }

    /** Hand-written: no boxing, no varargs array. Fastest for hot paths. */
    @Override public int hashCode() {
        int result = 17;
        result = 31 * result + Objects.hashCode(symbol);                  // object
        result = 31 * result + (int) (quantity ^ (quantity >>> 32));      // long
        long bits = Double.doubleToLongBits(price);                       // double
        result = 31 * result + (int) (bits ^ (bits >>> 32));
        result = 31 * result + (settled ? 1 : 0);                         // boolean
        result = 31 * result + Arrays.hashCode(tags);                     // array
        return result;
    }

    /** Equivalent, concise, but boxes and allocates. */
    int hashCodeConcise() {
        return Objects.hash(symbol, quantity, price, settled, Arrays.hashCode(tags));
    }
}

public class HashCodeRecipe {
    public static void main(String[] args) {
        // 31 * i == (i << 5) - i
        int i = 12345;
        System.out.println((31 * i) + " == " + ((i << 5) - i));

        // An even multiplier destroys information.
        int oddAcc = 1, evenAcc = 1;
        for (int k = 0; k < 8; k++) { oddAcc = 31 * oddAcc + k; evenAcc = 32 * evenAcc + k; }
        System.out.println(Integer.toBinaryString(oddAcc));
        System.out.println(Integer.toBinaryString(evenAcc));  // low bits collapse

        // Records generate a correct equals/hashCode for you.
        record Point(int x, int y) {}
        System.out.println(new Point(1, 2).hashCode() == new Point(1, 2).hashCode());

        // Distribution check - a quick sanity test for a custom hashCode.
        Set<Integer> hashes = new HashSet<>();
        for (int a = 0; a < 200; a++)
            for (int b = 0; b < 200; b++) hashes.add(new Point(a, b).hashCode());
        System.out.println("unique hashes for 40000 points: " + hashes.size());
    }
}`,
      codeLanguage: "java",
      explanation:
        "result = 31*result + fieldHash over exactly the equals fields; 31 is odd, prime and compiles to (i<<5)-i.",
      followUps: [
        "Why is an even multiplier a bad choice?",
        "When is Objects.hash too slow?",
      ],
    },
    {
      id: "b080",
      question: "Walk me through what happens step by step for map.put(\"key\", \"value\") on a fresh HashMap.",
      answer:
        "A trace-level answer. Assume `Map<String,String> map = new HashMap<>(); map.put(\"key\", \"value\");`\n\n" +
        "1. **Constructor** — `new HashMap<>()` sets `loadFactor = 0.75f` and **nothing else**. `table` is null; no array is allocated yet.\n" +
        "2. **`put` delegates** to `putVal(hash(key), key, value, false, true)`.\n" +
        "3. **`hash(key)`** — `\"key\".hashCode()` is 106079. Spread: `106079 ^ (106079 >>> 16)` = `106079 ^ 1` = 106078.\n" +
        "4. **Lazy table allocation** — `table == null`, so `resize()` runs: it creates `Node[16]` and sets `threshold = 12`.\n" +
        "5. **Index** — `i = (16 - 1) & 106078` = `15 & 106078` = 14.\n" +
        "6. **Bin 14 is empty** → `tab[14] = newNode(106078, \"key\", \"value\", null)`.\n" +
        "7. **Bookkeeping** — `++modCount` (fail-fast), `++size` → 1. `1 > 12` is false, so no resize.\n" +
        "8. **Return** `null` — the previous value for this key, which did not exist.\n\n" +
        "Now `map.put(\"key\", \"other\")`:\n\n" +
        "- Same hash, same bin. The first node matches `e.hash == hash && key.equals(e.key)`, so the value is overwritten, `size` and `modCount` are unchanged, and the **old value `\"value\"` is returned**.\n\n" +
        "And `map.get(\"key\")`: compute the same hash and index, check `tab[14]`, the first node matches, return `\"value\"` — a single array access and one comparison, hence O(1).\n\n" +
        "**Useful extras to volunteer:** `putIfAbsent` sets `onlyIfAbsent = true`; `afterNodeAccess` and `afterNodeInsertion` are no-op hooks in `HashMap` that `LinkedHashMap` overrides to maintain its linked list and LRU eviction. That is how `LinkedHashMap` reuses the whole algorithm with two overrides.",
      code: `import java.util.*;

public class PutTrace {
    static int spread(Object key) {
        int h;
        return key == null ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

    public static void main(String[] args) {
        String key = "key", value = "value";

        int raw = key.hashCode();
        int spread = spread(key);
        int capacity = 16;
        int index = (capacity - 1) & spread;

        System.out.println("1. new HashMap<>()      -> table=null, loadFactor=0.75");
        System.out.println("2. putVal(hash, k, v, false, true)");
        System.out.printf ("3. raw hashCode         = %d (0x%08X)%n", raw, raw);
        System.out.printf ("   spread h ^ (h>>>16)  = %d (0x%08X)%n", spread, spread);
        System.out.println("4. table == null        -> resize(): Node[16], threshold=12");
        System.out.printf ("5. index = (16-1) & %d  = %d%n", spread, index);
        System.out.println("6. tab[" + index + "] == null -> newNode(hash, key, value, null)");
        System.out.println("7. ++modCount; ++size=1; 1 > 12 ? no -> no resize");
        System.out.println("8. return null (no previous mapping)");

        Map<String, String> map = new HashMap<>();
        System.out.println("\\nactual put returns: " + map.put(key, value));   // null
        System.out.println("overwrite returns:  " + map.put(key, "other"));   // value
        System.out.println("size stays:         " + map.size());              // 1
        System.out.println("get returns:        " + map.get(key));            // other

        // putIfAbsent -> onlyIfAbsent = true
        System.out.println("putIfAbsent:        " + map.putIfAbsent(key, "ignored"));
        System.out.println("value unchanged:    " + map.get(key));

        // LinkedHashMap reuses the same algorithm and only overrides the hooks
        // afterNodeAccess / afterNodeInsertion / newNode.
        Map<String, String> linked = new LinkedHashMap<>(16, 0.75f, true);
        linked.put("a", "1"); linked.put("b", "2");
        linked.get("a");                                  // afterNodeAccess -> moves to tail
        System.out.println(linked.keySet());              // [b, a]
    }
}`,
      codeLanguage: "java",
      explanation:
        "Lazy table allocation on first put, spread hash, mask index, empty-bin node creation, modCount/size bookkeeping, return the previous value.",
      followUps: [
        "What do afterNodeAccess and afterNodeInsertion do?",
        "What changes in the trace if the bin is already occupied?",
      ],
    },
  ],
  meta: {
    b067: { difficulty: "medium", priority: "very-high", tags: ["hashmap", "internals", "buckets"], readMinutes: 6 },
    b068: { difficulty: "hard", priority: "very-high", tags: ["hashing", "spread", "bit-manipulation"], readMinutes: 4 },
    b069: { difficulty: "hard", priority: "high", tags: ["capacity", "bitmask", "resize"], readMinutes: 4 },
    b070: { difficulty: "easy", priority: "very-high", tags: ["load-factor", "threshold", "sizing"], readMinutes: 4 },
    b071: { difficulty: "hard", priority: "very-high", tags: ["treeify", "red-black", "java8"], readMinutes: 5, versions: ["Java 8+"] },
    b072: { difficulty: "hard", priority: "very-high", tags: ["resize", "java7", "infinite-loop"], readMinutes: 5 },
    b073: { difficulty: "medium", priority: "very-high", tags: ["collision", "equals", "chain"], readMinutes: 4 },
    b074: { difficulty: "medium", priority: "very-high", tags: ["mutable-key", "hashcode", "bug"], readMinutes: 4 },
    b075: { difficulty: "easy", priority: "very-high", tags: ["comparison", "hashtable", "treemap"], readMinutes: 5 },
    b076: { difficulty: "hard", priority: "high", tags: ["null", "concurrenthashmap", "design"], readMinutes: 4 },
    b077: { difficulty: "medium", priority: "very-high", tags: ["lru", "cache", "linkedhashmap"], readMinutes: 5 },
    b078: { difficulty: "hard", priority: "medium", tags: ["security", "dos", "collisions"], readMinutes: 5 },
    b079: { difficulty: "medium", priority: "very-high", tags: ["hashcode", "recipe", "31"], readMinutes: 5 },
    b080: { difficulty: "medium", priority: "very-high", tags: ["put", "trace", "internals"], readMinutes: 4 },
  },
});
