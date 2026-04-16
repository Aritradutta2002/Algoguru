import { ContentSection } from "@/data/recursionContent";

export const heapContent: ContentSection[] = [
  // ─── Section 1: Introduction to Heaps ───
  {
    id: "heap-intro",
    title: "Introduction to Heaps",
    difficulty: "Easy",
    theory: [
      "A Heap is a specialized tree-based data structure that satisfies the heap property. It is a Complete Binary Tree — every level is fully filled except possibly the last, which is filled from left to right.",
      "There are two types of heaps: Max-Heap (parent ≥ children, so the root is the maximum element) and Min-Heap (parent ≤ children, so the root is the minimum element).",
      "Heaps are the backbone of Priority Queues — an abstract data type where every element has a priority and the highest (or lowest) priority element is always served first.",
      "Unlike BSTs, heaps do NOT maintain a sorted order among siblings. The only guarantee is the parent-child relationship defined by the heap property.",
      "Heaps are stored as arrays for efficiency. For a node at index i (0-indexed): Left child = 2*i + 1, Right child = 2*i + 2, Parent = (i - 1) / 2. This eliminates the need for pointers and leverages cache locality.",
      "Key complexities: Insert → O(log n), Extract-Min/Max → O(log n), Peek → O(1), Build Heap → O(n). The O(n) build heap is a non-obvious but crucial result.",
    ],
    diagram: {
      type: "hierarchy",
      title: "Min-Heap Structure — Array: [10, 20, 30, 25, 35, 40, 50]",
      data: [
        {
          label: "10 (root, index 0)",
          color: "primary",
          children: [
            {
              label: "20 (index 1)",
              color: "info",
              children: [
                { label: "25 (index 3)", color: "success" },
                { label: "35 (index 4)", color: "success" }
              ]
            },
            {
              label: "30 (index 2)",
              color: "info",
              children: [
                { label: "40 (index 5)", color: "accent" },
                { label: "50 (index 6)", color: "accent" }
              ]
            }
          ]
        }
      ]
    },
    keyPoints: [
      "Complete Binary Tree stored as an array — no pointers needed",
      "Min-Heap: root is minimum; Max-Heap: root is maximum",
      "Parent-child index formula: parent = (i-1)/2, left = 2i+1, right = 2i+2",
      "Insert and delete are O(log n); peek is O(1)",
      "Build heap from array is O(n), not O(n log n)",
      "Java's PriorityQueue is a Min-Heap by default",
    ],
    code: [
      {
        title: "Heap Array Representation — Index Relationships",
        language: "java",
        content: `// Heap stored as array: [10, 20, 30, 25, 35, 40, 50]
// Visualized as tree:
//           10           <- index 0 (root)
//         /    \\
//       20      30       <- indices 1, 2
//      /  \\    /  \\
//    25   35  40   50    <- indices 3, 4, 5, 6

public class HeapIndexDemo {
    public static void main(String[] args) {
        int[] heap = {10, 20, 30, 25, 35, 40, 50};
        
        for (int i = 0; i < heap.length; i++) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int parent = (i - 1) / 2;
            
            System.out.printf("Index %d (val=%d): ", i, heap[i]);
            System.out.printf("Parent=%s, Left=%s, Right=%s%n",
                i == 0 ? "none" : String.valueOf(heap[parent]),
                left < heap.length ? String.valueOf(heap[left]) : "none",
                right < heap.length ? String.valueOf(heap[right]) : "none");
        }
    }
}
// Output:
// Index 0 (val=10): Parent=none, Left=20, Right=30
// Index 1 (val=20): Parent=10, Left=25, Right=35
// Index 2 (val=30): Parent=10, Left=40, Right=50
// ...`,
      },
      {
        title: "Min-Heap vs Max-Heap — Visual Comparison",
        language: "java",
        content: `// Min-Heap: Every parent ≤ its children
// Root = minimum element
//        1
//       / \\
//      3    5
//     / \\
//    7   9
// Array: [1, 3, 5, 7, 9]

// Max-Heap: Every parent ≥ its children
// Root = maximum element
//        9
//       / \\
//      7    5
//     / \\
//    3   1
// Array: [9, 7, 5, 3, 1]

import java.util.PriorityQueue;
import java.util.Collections;

public class MinMaxHeapDemo {
    public static void main(String[] args) {
        // Min-Heap (default in Java)
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.add(5); minHeap.add(3); minHeap.add(7); minHeap.add(1);
        System.out.println("Min-Heap peek: " + minHeap.peek()); // 1

        // Max-Heap (using reverseOrder comparator)
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        maxHeap.add(5); maxHeap.add(3); maxHeap.add(7); maxHeap.add(1);
        System.out.println("Max-Heap peek: " + maxHeap.peek()); // 7
    }
}`,
      },
    ],
    table: {
      headers: ["Operation", "Time Complexity", "Description"],
      rows: [
        ["Insert (add)", "O(log n)", "Add element at end, bubble up"],
        ["Extract-Min/Max (poll)", "O(log n)", "Remove root, replace with last, heapify down"],
        ["Peek (peek)", "O(1)", "Return root without removing"],
        ["Build Heap", "O(n)", "Bottom-up heapify — tighter than O(n log n)"],
        ["Delete arbitrary", "O(n)", "Find element O(n) + heapify O(log n)"],
        ["Heapify (sift down)", "O(log n)", "Restore heap property for one node"],
      ],
    },
    note: "Java's PriorityQueue does NOT support decrease-key in O(log n). For Dijkstra's algorithm, we typically insert duplicates and skip stale entries instead.",
  },

  // ─── Section 2: Building a Heap from Scratch ───
  {
    id: "heap-build",
    title: "Building a Heap from Scratch",
    difficulty: "Easy",
    theory: [
      "To truly understand heaps, you must implement one from scratch. The two key operations are: Heapify-Up (also called bubble-up or sift-up) used after insertion, and Heapify-Down (also called sift-down or percolate-down) used after extraction.",
      "Insertion: Add the new element at the end of the array (maintaining completeness), then repeatedly swap it with its parent if it violates the heap property — this is heapify-up. Time: O(log n).",
      "Extraction (poll): Remove the root (min or max), replace it with the last element, then repeatedly swap it with its smallest (or largest) child — this is heapify-down. Time: O(log n).",
      "Build Heap (heapify an array): Instead of inserting one by one (O(n log n)), use bottom-up heapify: start from the last non-leaf node (index n/2 - 1) and call heapify-down for each. This runs in O(n) due to the mathematical fact that most nodes are near the bottom and require few swaps.",
      "Why O(n)? At height h, there are at most ⌈n/2^(h+1)⌉ nodes, each needing O(h) work. Sum of h * n/2^(h+1) for h=0 to log(n) converges to O(n).",
    ],
    keyPoints: [
      "Heapify-Up: used after insert — bubble the new element upward",
      "Heapify-Down: used after extract — push the replacement element downward",
      "Build heap bottom-up is O(n), not O(n log n)",
      "Last non-leaf index = n/2 - 1 (0-indexed)",
      "Always swap with the smaller child (min-heap) or larger child (max-heap)",
    ],
    code: [
      {
        title: "Complete Min-Heap Implementation from Scratch",
        language: "java",
        content: `import java.util.Arrays;

public class MinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MinHeap(int capacity) {
        this.capacity = capacity;
        this.size = 0;
        this.heap = new int[capacity];
    }

    // ── Index helpers ──
    private int parent(int i) { return (i - 1) / 2; }
    private int left(int i)   { return 2 * i + 1; }
    private int right(int i)  { return 2 * i + 2; }

    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // ── Heapify Up (after insert) ──
    private void heapifyUp(int i) {
        while (i > 0 && heap[parent(i)] > heap[i]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    // ── Heapify Down (after extract) ──
    private void heapifyDown(int i) {
        int smallest = i;
        int l = left(i), r = right(i);

        if (l < size && heap[l] < heap[smallest]) smallest = l;
        if (r < size && heap[r] < heap[smallest]) smallest = r;

        if (smallest != i) {
            swap(i, smallest);
            heapifyDown(smallest); // recurse
        }
    }

    // ── Insert ──
    public void insert(int val) {
        if (size == capacity) throw new RuntimeException("Heap is full");
        heap[size] = val;
        size++;
        heapifyUp(size - 1);
    }

    // ── Peek (get min without removing) ──
    public int peek() {
        if (size == 0) throw new RuntimeException("Heap is empty");
        return heap[0];
    }

    // ── Extract Min ──
    public int extractMin() {
        if (size == 0) throw new RuntimeException("Heap is empty");
        int min = heap[0];
        heap[0] = heap[size - 1];
        size--;
        heapifyDown(0);
        return min;
    }

    public int size() { return size; }

    public static void main(String[] args) {
        MinHeap h = new MinHeap(10);
        h.insert(35); h.insert(10); h.insert(25);
        h.insert(5);  h.insert(15); h.insert(30);

        System.out.println("Min: " + h.peek());        // 5
        System.out.println("Extract: " + h.extractMin()); // 5
        System.out.println("New Min: " + h.peek());     // 10
    }
}`,
      },
      {
        title: "Build Heap — O(n) Bottom-Up Construction",
        language: "java",
        content: `public class BuildHeapDemo {
    static int[] heap;
    static int n;

    static void heapifyDown(int i) {
        int smallest = i;
        int l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && heap[l] < heap[smallest]) smallest = l;
        if (r < n && heap[r] < heap[smallest]) smallest = r;
        if (smallest != i) {
            int temp = heap[i]; heap[i] = heap[smallest]; heap[smallest] = temp;
            heapifyDown(smallest);
        }
    }

    // Build min-heap in O(n) time
    static void buildHeap(int[] arr) {
        heap = arr;
        n = arr.length;
        // Start from last non-leaf and go up to root
        for (int i = n / 2 - 1; i >= 0; i--) {
            heapifyDown(i);
        }
    }

    public static void main(String[] args) {
        int[] arr = {40, 10, 30, 5, 15, 25, 35};
        System.out.println("Before: " + java.util.Arrays.toString(arr));
        // [40, 10, 30, 5, 15, 25, 35]

        buildHeap(arr);
        System.out.println("After:  " + java.util.Arrays.toString(arr));
        // [5, 10, 25, 40, 15, 30, 35] — valid min-heap
    }
}`,
      },
    ],
    tip: "When implementing heapify-down iteratively (non-recursive), use a while loop — it avoids stack overhead for very large heaps.",
  },

  // ─── Section 2.5: Max Heap, Validation & Conversion ───
  {
    id: "heap-maxheap",
    title: "Max Heap, Heap Validation & Conversion",
    difficulty: "Easy",
    theory: [
      "While Min-Heap gives the smallest element at the root, a Max-Heap gives the largest. The only difference in implementation is the comparison direction — in heapify, we compare for the LARGEST child instead of the smallest.",
      "Implementing a Max-Heap from scratch follows the exact same structure as Min-Heap: heapify-up after insert (swap with parent if current > parent), and heapify-down after extract (swap with the LARGER child if current < child).",
      "Checking if an array represents a valid Min-Heap: For every node at index i, verify that arr[i] ≤ arr[2*i+1] (left child) and arr[i] ≤ arr[2*i+2] (right child). If any violation is found, return false. This runs in O(n).",
      "Similarly, checking for Max-Heap: verify arr[i] ≥ arr[2*i+1] and arr[i] ≥ arr[2*i+2] for all internal nodes.",
      "Converting a Min-Heap to a Max-Heap: You cannot simply reverse the array. Instead, treat the min-heap array as an arbitrary array and build a max-heap from it using bottom-up heapify in O(n). The old min-heap structure is completely discarded — you rebuild from scratch.",
      "The key insight: buildHeap (bottom-up heapify) works on ANY array, regardless of its current state. So converting between heap types is always O(n).",
    ],
    keyPoints: [
      "Max-Heap: parent ≥ children — root is the maximum",
      "Only the comparison operator changes between min and max heap",
      "Validation: check parent-child relationship for all internal nodes — O(n)",
      "Conversion: treat as raw array and rebuild with opposite heapify — O(n)",
      "You CANNOT convert min→max by simply reversing or negating",
    ],
    code: [
      {
        title: "Complete Max-Heap Implementation from Scratch",
        language: "java",
        content: `public class MaxHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MaxHeap(int capacity) {
        this.capacity = capacity;
        this.size = 0;
        this.heap = new int[capacity];
    }

    private int parent(int i) { return (i - 1) / 2; }
    private int left(int i)   { return 2 * i + 1; }
    private int right(int i)  { return 2 * i + 2; }

    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // ── Heapify Up: bubble up if current > parent ──
    private void heapifyUp(int i) {
        while (i > 0 && heap[i] > heap[parent(i)]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    // ── Heapify Down: sink if current < largest child ──
    private void heapifyDown(int i) {
        int largest = i;
        int l = left(i), r = right(i);

        if (l < size && heap[l] > heap[largest]) largest = l;
        if (r < size && heap[r] > heap[largest]) largest = r;

        if (largest != i) {
            swap(i, largest);
            heapifyDown(largest);
        }
    }

    public void insert(int val) {
        if (size == capacity) throw new RuntimeException("Heap is full");
        heap[size] = val;
        size++;
        heapifyUp(size - 1);
    }

    public int peek() {
        if (size == 0) throw new RuntimeException("Heap is empty");
        return heap[0]; // root = maximum element
    }

    public int extractMax() {
        if (size == 0) throw new RuntimeException("Heap is empty");
        int max = heap[0];
        heap[0] = heap[size - 1];
        size--;
        heapifyDown(0);
        return max;
    }

    public int size() { return size; }

    public static void main(String[] args) {
        MaxHeap h = new MaxHeap(10);
        h.insert(10); h.insert(30); h.insert(20);
        h.insert(5);  h.insert(40); h.insert(15);

        System.out.println("Max: " + h.peek());          // 40
        System.out.println("Extract: " + h.extractMax()); // 40
        System.out.println("New Max: " + h.peek());       // 30
        System.out.println("Extract: " + h.extractMax()); // 30
        System.out.println("Extract: " + h.extractMax()); // 20
    }
}`,
      },
      {
        title: "Check if Array Represents a Min-Heap or Max-Heap",
        language: "java",
        content: `public class HeapValidator {

    // Check if array is a valid Min-Heap
    public static boolean isMinHeap(int[] arr, int n) {
        // Only need to check internal nodes (indices 0 to n/2 - 1)
        for (int i = 0; i <= (n - 2) / 2; i++) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;

            // Check left child: parent must be ≤ left child
            if (left < n && arr[i] > arr[left]) {
                System.out.println("Violation at index " + i + 
                    ": parent " + arr[i] + " > left child " + arr[left]);
                return false;
            }

            // Check right child: parent must be ≤ right child
            if (right < n && arr[i] > arr[right]) {
                System.out.println("Violation at index " + i + 
                    ": parent " + arr[i] + " > right child " + arr[right]);
                return false;
            }
        }
        return true;
    }

    // Check if array is a valid Max-Heap
    public static boolean isMaxHeap(int[] arr, int n) {
        for (int i = 0; i <= (n - 2) / 2; i++) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;

            if (left < n && arr[i] < arr[left]) return false;
            if (right < n && arr[i] < arr[right]) return false;
        }
        return true;
    }

    // Recursive approach for Min-Heap validation
    public static boolean isMinHeapRecursive(int[] arr, int i, int n) {
        // Base case: leaf node
        if (i >= (n - 1) / 2) return true;

        int left = 2 * i + 1;
        int right = 2 * i + 2;

        boolean valid = true;
        if (left < n)  valid = valid && (arr[i] <= arr[left]);
        if (right < n) valid = valid && (arr[i] <= arr[right]);

        return valid 
            && isMinHeapRecursive(arr, left, n) 
            && isMinHeapRecursive(arr, right, n);
    }

    public static void main(String[] args) {
        int[] minHeap = {1, 3, 5, 7, 9, 8, 10};
        int[] notHeap = {1, 3, 5, 2, 9, 8, 10};
        int[] maxHeap = {50, 30, 40, 10, 20, 35, 38};

        System.out.println("Is minHeap valid? " + isMinHeap(minHeap, minHeap.length));   // true
        System.out.println("Is notHeap valid? " + isMinHeap(notHeap, notHeap.length));   // false
        System.out.println("Is maxHeap valid? " + isMaxHeap(maxHeap, maxHeap.length));   // true
        System.out.println("Recursive check:  " + isMinHeapRecursive(minHeap, 0, minHeap.length)); // true
    }
}`,
      },
      {
        title: "Convert Min-Heap to Max-Heap (and Vice Versa)",
        language: "java",
        content: `import java.util.Arrays;

public class HeapConversion {

    // ── Convert Min-Heap array to Max-Heap ──
    // Strategy: Ignore old heap structure, rebuild as max-heap using O(n) bottom-up
    public static void convertMinToMax(int[] arr) {
        int n = arr.length;
        // Start from last internal node, apply max-heapify down
        for (int i = n / 2 - 1; i >= 0; i--) {
            maxHeapifyDown(arr, n, i);
        }
    }

    private static void maxHeapifyDown(int[] arr, int n, int i) {
        int largest = i;
        int left = 2 * i + 1;
        int right = 2 * i + 2;

        if (left < n && arr[left] > arr[largest])   largest = left;
        if (right < n && arr[right] > arr[largest]) largest = right;

        if (largest != i) {
            int temp = arr[i]; arr[i] = arr[largest]; arr[largest] = temp;
            maxHeapifyDown(arr, n, largest);
        }
    }

    // ── Convert Max-Heap array to Min-Heap ──
    public static void convertMaxToMin(int[] arr) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) {
            minHeapifyDown(arr, n, i);
        }
    }

    private static void minHeapifyDown(int[] arr, int n, int i) {
        int smallest = i;
        int left = 2 * i + 1;
        int right = 2 * i + 2;

        if (left < n && arr[left] < arr[smallest])   smallest = left;
        if (right < n && arr[right] < arr[smallest]) smallest = right;

        if (smallest != i) {
            int temp = arr[i]; arr[i] = arr[smallest]; arr[smallest] = temp;
            minHeapifyDown(arr, n, smallest);
        }
    }

    public static void main(String[] args) {
        // Start with a valid min-heap
        int[] minHeap = {1, 3, 6, 5, 9, 8};
        System.out.println("Min-Heap: " + Arrays.toString(minHeap));
        // [1, 3, 6, 5, 9, 8]

        convertMinToMax(minHeap);
        System.out.println("Max-Heap: " + Arrays.toString(minHeap));
        // [9, 5, 8, 3, 1, 6] — valid max-heap!

        // Verify: is it a valid max-heap?
        boolean valid = true;
        for (int i = 0; i < minHeap.length / 2; i++) {
            int l = 2 * i + 1, r = 2 * i + 2;
            if (l < minHeap.length && minHeap[i] < minHeap[l]) valid = false;
            if (r < minHeap.length && minHeap[i] < minHeap[r]) valid = false;
        }
        System.out.println("Valid max-heap? " + valid); // true

        // Now convert back to min-heap
        convertMaxToMin(minHeap);
        System.out.println("Back to Min-Heap: " + Arrays.toString(minHeap));
        // Valid min-heap again
    }
}`,
      },
    ],
    warning: "A common mistake is trying to convert min-heap to max-heap by negating all values or reversing the array — this does NOT produce a valid max-heap. Always rebuild using bottom-up heapify.",
    note: "Both validation and conversion are O(n) operations. Validation only checks internal nodes (indices 0 to n/2-1) since leaf nodes have no children to violate the heap property.",
  },

  // ─── Section 3: Java PriorityQueue API ───
  {
    id: "heap-pq",
    title: "Java PriorityQueue — Complete API Guide",
    difficulty: "Easy",
    theory: [
      "Java's PriorityQueue (java.util.PriorityQueue) is the standard heap implementation. By default it's a Min-Heap. For Max-Heap, pass Collections.reverseOrder() or a custom Comparator.",
      "Key methods: add(e)/offer(e) — insert; poll() — extract min/max; peek() — view min/max without removal; remove(obj) — remove specific element (O(n)); contains(obj) — check existence (O(n)); size() and isEmpty().",
      "PriorityQueue does NOT allow null elements. It is NOT thread-safe; use PriorityBlockingQueue for concurrent access.",
      "For custom objects, you must either make the class implement Comparable<T>, or provide a Comparator<T> to the PriorityQueue constructor.",
      "Common pattern in CP: use PriorityQueue with int[] or long[] arrays for multi-field priorities, e.g., new PriorityQueue<>((a, b) -> a[0] - b[0]) for sorting by first element.",
    ],
    keyPoints: [
      "Default is Min-Heap; use Collections.reverseOrder() for Max-Heap",
      "poll() returns null if empty (unlike extractMin which throws)",
      "Iterator does NOT return elements in sorted order",
      "remove(Object) is O(n) — scans the entire array",
      "For CP: prefer int[] arrays with lambda comparators for speed",
    ],
    code: [
      {
        title: "PriorityQueue Basics — Min-Heap and Max-Heap",
        language: "java",
        content: `import java.util.*;

public class PQBasics {
    public static void main(String[] args) {
        // ── Min-Heap (default) ──
        PriorityQueue<Integer> minPQ = new PriorityQueue<>();
        minPQ.offer(30); minPQ.offer(10); minPQ.offer(20);
        System.out.println("Min peek: " + minPQ.peek());   // 10
        System.out.println("Min poll: " + minPQ.poll());    // 10
        System.out.println("Min peek: " + minPQ.peek());   // 20

        // ── Max-Heap ──
        PriorityQueue<Integer> maxPQ = new PriorityQueue<>(Collections.reverseOrder());
        maxPQ.offer(30); maxPQ.offer(10); maxPQ.offer(20);
        System.out.println("Max peek: " + maxPQ.peek());   // 30

        // ── Custom Comparator (sort by absolute value) ──
        PriorityQueue<Integer> absPQ = new PriorityQueue<>(
            (a, b) -> Math.abs(a) - Math.abs(b)
        );
        absPQ.offer(-5); absPQ.offer(3); absPQ.offer(-1);
        System.out.println("Abs min: " + absPQ.peek());    // -1

        // ── All operations ──
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.offer(5);                // insert
        pq.add(3);                  // same as offer
        int min = pq.peek();        // view min (3)
        int extracted = pq.poll();  // remove min (3)
        boolean has = pq.contains(5); // true, but O(n)
        pq.remove(5);              // remove specific, O(n)
        int sz = pq.size();
        boolean empty = pq.isEmpty();
    }
}`,
      },
      {
        title: "PriorityQueue with Custom Objects",
        language: "java",
        content: `import java.util.*;

public class PQCustomObjects {
    // Method 1: Implement Comparable
    static class Task implements Comparable<Task> {
        String name;
        int priority; // lower = higher priority

        Task(String name, int priority) {
            this.name = name;
            this.priority = priority;
        }

        @Override
        public int compareTo(Task other) {
            return this.priority - other.priority; // min-heap by priority
        }

        @Override
        public String toString() {
            return name + "(p=" + priority + ")";
        }
    }

    // Method 2: Use Comparator (preferred in CP)
    static class Event {
        int time;
        String type;
        Event(int time, String type) { this.time = time; this.type = type; }
    }

    public static void main(String[] args) {
        // Method 1: Comparable
        PriorityQueue<Task> taskQ = new PriorityQueue<>();
        taskQ.offer(new Task("Low", 3));
        taskQ.offer(new Task("Critical", 1));
        taskQ.offer(new Task("Medium", 2));
        System.out.println(taskQ.poll()); // Critical(p=1)

        // Method 2: Comparator
        PriorityQueue<Event> eventQ = new PriorityQueue<>(
            (a, b) -> a.time != b.time ? a.time - b.time : a.type.compareTo(b.type)
        );
        eventQ.offer(new Event(5, "end"));
        eventQ.offer(new Event(3, "start"));
        eventQ.offer(new Event(3, "end"));
        System.out.println(eventQ.poll().type); // "end" (time=3, "end" < "start"? No — "e" < "s")
        // Actually: "end" comes before "start" alphabetically

        // Method 3: int[] arrays (fastest for CP)
        // PQ of {cost, node}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{10, 1});
        pq.offer(new int[]{5, 2});
        pq.offer(new int[]{8, 3});
        int[] best = pq.poll(); // {5, 2}
        System.out.println("Cost=" + best[0] + " Node=" + best[1]);
    }
}`,
      },
    ],
    warning: "Never use a - b comparator with Integer.MIN_VALUE or very large values — it can overflow! Use Integer.compare(a, b) for safety.",
  },

  // ─── Section 4: Heap Sort ───
  {
    id: "heap-sort",
    title: "Heap Sort Algorithm",
    difficulty: "Medium",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1) — in-place",
    theory: [
      "Heap Sort is a comparison-based sorting algorithm that uses a binary heap. It has guaranteed O(n log n) time complexity in ALL cases (best, average, worst) — unlike Quick Sort which degrades to O(n²) in the worst case.",
      "Algorithm: Step 1 — Build a max-heap from the input array in O(n). Step 2 — Repeatedly extract the maximum (swap root with last unsorted element, reduce heap size by 1, heapify-down the new root). After n-1 extractions, the array is sorted in ascending order.",
      "Heap Sort is in-place (O(1) extra space) but NOT stable — equal elements may change their relative order. This is because the swap-to-end operation can move equal elements past each other.",
      "In practice, Heap Sort is slower than Quick Sort due to poor cache performance — heap accesses jump around memory. However, it's preferred when worst-case guarantees are needed.",
      "Java's Arrays.sort() uses a dual-pivot Quick Sort for primitives and TimSort for objects. Heap Sort is used as a fallback in introspective sort implementations.",
    ],
    keyPoints: [
      "Always O(n log n) — no worst-case degradation",
      "In-place but NOT stable",
      "Build max-heap first, then repeatedly extract max",
      "Cache-unfriendly compared to Quick Sort",
      "Used as fallback in hybrid sorting (introsort)",
    ],
    code: [
      {
        title: "Heap Sort — Complete Implementation",
        language: "java",
        content: `import java.util.Arrays;

public class HeapSort {

    public static void heapSort(int[] arr) {
        int n = arr.length;

        // Step 1: Build max-heap (O(n))
        for (int i = n / 2 - 1; i >= 0; i--) {
            heapifyDown(arr, n, i);
        }

        // Step 2: Extract elements one by one
        for (int i = n - 1; i > 0; i--) {
            // Move current root (max) to end
            int temp = arr[0];
            arr[0] = arr[i];
            arr[i] = temp;

            // Heapify the reduced heap
            heapifyDown(arr, i, 0);
        }
    }

    // Max-heapify: ensure arr[i] is ≥ its children
    private static void heapifyDown(int[] arr, int n, int i) {
        int largest = i;
        int left = 2 * i + 1;
        int right = 2 * i + 2;

        if (left < n && arr[left] > arr[largest])   largest = left;
        if (right < n && arr[right] > arr[largest]) largest = right;

        if (largest != i) {
            int temp = arr[i];
            arr[i] = arr[largest];
            arr[largest] = temp;
            heapifyDown(arr, n, largest);
        }
    }

    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6, 7};
        System.out.println("Before: " + Arrays.toString(arr));
        heapSort(arr);
        System.out.println("After:  " + Arrays.toString(arr));
        // [5, 6, 7, 11, 12, 13]
    }
}`,
      },
      {
        title: "Sorting Comparison — Heap Sort vs Others",
        language: "java",
        content: `// ┌─────────────────┬─────────────┬───────────┬────────┬────────┐
// │   Algorithm     │   Best      │  Average  │ Worst  │ Stable │
// ├─────────────────┼─────────────┼───────────┼────────┼────────┤
// │ Heap Sort       │ O(n log n)  │ O(n log n)│O(nlogn)│   No   │
// │ Quick Sort      │ O(n log n)  │ O(n log n)│ O(n²)  │   No   │
// │ Merge Sort      │ O(n log n)  │ O(n log n)│O(nlogn)│  Yes   │
// │ Insertion Sort  │ O(n)        │ O(n²)     │ O(n²)  │  Yes   │
// └─────────────────┴─────────────┴───────────┴────────┴────────┘
// 
// When to use Heap Sort:
// 1. Need guaranteed O(n log n) worst case
// 2. Memory is constrained (in-place, O(1) extra)
// 3. Stability is not required
// 4. Embedded systems where worst-case matters`,
      },
    ],
    note: "For sorting in competitive programming, always use Arrays.sort() (primitives) or Collections.sort() (objects). Implement heap sort only when asked or when you need partial sorting (top-K).",
  },

  // ─── Section 5: Top-K Problems ───
  {
    id: "heap-topk",
    title: "Top-K Element Problems",
    difficulty: "Medium",
    theory: [
      "Top-K problems are the most common heap application in interviews and CP. The core idea: use a heap of size K to efficiently track the K largest or K smallest elements from a stream or array.",
      "Pattern for K Largest: Use a Min-Heap of size K. For each element, if it's larger than the heap's minimum, remove the min and insert the new element. The heap always contains the K largest seen so far.",
      "Pattern for K Smallest: Use a Max-Heap of size K. For each element, if it's smaller than the heap's maximum, remove the max and insert. The heap contains the K smallest.",
      "Why opposite heap? To find K largest, we keep a min-heap so we can quickly discard the smallest of our K candidates. The min-heap root is the Kth largest element.",
      "Time complexity: O(n log K) for processing n elements with a heap of size K. When K << n, this is much better than sorting (O(n log n)).",
    ],
    keyPoints: [
      "K largest → use Min-Heap of size K",
      "K smallest → use Max-Heap of size K",
      "The root of the heap = Kth element",
      "O(n log K) time — optimal for streaming data",
      "Works for both static arrays and dynamic streams",
    ],
    code: [
      {
        title: "Kth Largest Element in an Array",
        language: "java",
        content: `import java.util.*;

public class KthLargest {
    // Find the Kth largest element
    // Example: [3,2,1,5,6,4], k=2 → answer is 5
    
    public static int findKthLargest(int[] nums, int k) {
        // Min-heap of size k
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        
        for (int num : nums) {
            minHeap.offer(num);
            if (minHeap.size() > k) {
                minHeap.poll(); // remove smallest
            }
        }
        
        return minHeap.peek(); // root = kth largest
    }

    public static void main(String[] args) {
        int[] nums = {3, 2, 1, 5, 6, 4};
        System.out.println("2nd largest: " + findKthLargest(nums, 2)); // 5
        System.out.println("4th largest: " + findKthLargest(nums, 4)); // 3
    }
}`,
      },
      {
        title: "Top K Frequent Elements",
        language: "java",
        content: `import java.util.*;

public class TopKFrequent {
    // Given array, return k most frequent elements
    // Example: [1,1,1,2,2,3], k=2 → [1,2]
    
    public static int[] topKFrequent(int[] nums, int k) {
        // Step 1: Count frequencies
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);
        
        // Step 2: Min-heap of size k, ordered by frequency
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
        
        for (var entry : freq.entrySet()) {
            pq.offer(new int[]{entry.getKey(), entry.getValue()});
            if (pq.size() > k) pq.poll();
        }
        
        // Step 3: Extract results
        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = pq.poll()[0];
        return result;
    }

    public static void main(String[] args) {
        int[] nums = {1, 1, 1, 2, 2, 3};
        System.out.println(Arrays.toString(topKFrequent(nums, 2))); // [2, 1]
    }
}`,
      },
      {
        title: "K Closest Points to Origin",
        language: "java",
        content: `import java.util.*;

public class KClosestPoints {
    // Return K closest points to origin (0,0)
    // Use MAX-heap of size K (discard farthest among candidates)
    
    public static int[][] kClosest(int[][] points, int k) {
        // Max-heap by distance
        PriorityQueue<int[]> maxHeap = new PriorityQueue<>(
            (a, b) -> (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1])
        );
        
        for (int[] p : points) {
            maxHeap.offer(p);
            if (maxHeap.size() > k) maxHeap.poll();
        }
        
        return maxHeap.toArray(new int[k][]);
    }

    public static void main(String[] args) {
        int[][] points = {{1,3}, {-2,2}, {5,8}, {0,1}};
        int[][] closest = kClosest(points, 2);
        for (int[] p : closest) {
            System.out.println(Arrays.toString(p));
        }
        // {0,1} and {-2,2} (or {1,3}) — the 2 closest
    }
}`,
      },
    ],
    tip: "For 'Kth largest' use min-heap; for 'Kth smallest' use max-heap. This is counterintuitive but remember: the heap root acts as a gatekeeper — it's the threshold for entry into the top-K set.",
  },

  // ─── Section 6: Two-Heap Pattern ───
  {
    id: "heap-two",
    title: "Two-Heap Pattern — Median & Sliding Window",
    difficulty: "Hard",
    theory: [
      "The Two-Heap pattern uses a Max-Heap for the smaller half and a Min-Heap for the larger half of a dataset. This allows O(1) access to the median and O(log n) insertions.",
      "Invariant: maxHeap.size() == minHeap.size() OR maxHeap.size() == minHeap.size() + 1. The median is either maxHeap.peek() (odd count) or average of both peeks (even count).",
      "Balancing: After every insertion, check sizes. If maxHeap has more than 1 extra, move its top to minHeap (and vice versa).",
      "This pattern extends to Sliding Window Median, where you also need to handle removals. Use lazy deletion with a hash map tracking removed elements.",
      "Applications: Find Median from Data Stream (LC 295), Sliding Window Median (LC 480), IPO problem, Maximize Capital.",
    ],
    keyPoints: [
      "Max-Heap stores smaller half; Min-Heap stores larger half",
      "Median = maxHeap.peek() when odd count",
      "Always maintain size balance: differ by at most 1",
      "For sliding window: use lazy deletion",
      "This is a very common interview pattern",
    ],
    code: [
      {
        title: "Find Median from Data Stream",
        language: "java",
        content: `import java.util.*;

public class MedianFinder {
    // Max-heap: stores the SMALLER half
    private PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder());
    // Min-heap: stores the LARGER half
    private PriorityQueue<Integer> hi = new PriorityQueue<>();

    public void addNum(int num) {
        lo.offer(num); // always add to max-heap first
        
        // Ensure every element in lo ≤ every element in hi
        hi.offer(lo.poll());
        
        // Balance sizes: lo can have at most 1 extra
        if (lo.size() < hi.size()) {
            lo.offer(hi.poll());
        }
    }

    public double findMedian() {
        if (lo.size() > hi.size()) {
            return lo.peek();
        }
        return (lo.peek() + hi.peek()) / 2.0;
    }

    public static void main(String[] args) {
        MedianFinder mf = new MedianFinder();
        mf.addNum(1); System.out.println("Median: " + mf.findMedian()); // 1.0
        mf.addNum(2); System.out.println("Median: " + mf.findMedian()); // 1.5
        mf.addNum(3); System.out.println("Median: " + mf.findMedian()); // 2.0
        mf.addNum(4); System.out.println("Median: " + mf.findMedian()); // 2.5
        mf.addNum(5); System.out.println("Median: " + mf.findMedian()); // 3.0
    }
}`,
      },
      {
        title: "Sliding Window Median with Lazy Deletion",
        language: "java",
        content: `import java.util.*;

public class SlidingWindowMedian {
    PriorityQueue<Long> lo = new PriorityQueue<>(Collections.reverseOrder());
    PriorityQueue<Long> hi = new PriorityQueue<>();
    Map<Long, Integer> delayed = new HashMap<>(); // lazy deletion counts
    int loSize = 0, hiSize = 0; // actual sizes (excluding delayed)

    public double[] medianSlidingWindow(int[] nums, int k) {
        double[] result = new double[nums.length - k + 1];

        for (int i = 0; i < nums.length; i++) {
            addNum(nums[i]);

            if (i >= k) {
                // Remove the element leaving the window
                removeNum(nums[i - k]);
            }

            if (i >= k - 1) {
                result[i - k + 1] = getMedian();
            }
        }
        return result;
    }

    private void addNum(long num) {
        if (lo.isEmpty() || num <= lo.peek()) {
            lo.offer(num); loSize++;
        } else {
            hi.offer(num); hiSize++;
        }
        balance();
    }

    private void removeNum(long num) {
        delayed.merge(num, 1, Integer::sum);
        if (num <= lo.peek()) loSize--;
        else hiSize--;
        balance();
    }

    private void balance() {
        while (loSize > hiSize + 1) {
            hi.offer(lo.poll()); loSize--; hiSize++;
            prune(lo);
        }
        while (loSize < hiSize) {
            lo.offer(hi.poll()); hiSize--; loSize++;
            prune(hi);
        }
        prune(lo); prune(hi);
    }

    private void prune(PriorityQueue<Long> pq) {
        while (!pq.isEmpty() && delayed.getOrDefault(pq.peek(), 0) > 0) {
            delayed.merge(pq.poll(), -1, Integer::sum);
        }
    }

    private double getMedian() {
        if (loSize > hiSize) return lo.peek();
        return ((double) lo.peek() + hi.peek()) / 2.0;
    }

    public static void main(String[] args) {
        SlidingWindowMedian swm = new SlidingWindowMedian();
        int[] nums = {1, 3, -1, -3, 5, 3, 6, 7};
        double[] medians = swm.medianSlidingWindow(nums, 3);
        System.out.println(Arrays.toString(medians));
        // [1.0, -1.0, -1.0, 3.0, 5.0, 6.0]
    }
}`,
      },
    ],
    warning: "In the sliding window variant, always prune delayed elements from the heap tops after balancing — stale elements can corrupt the median calculation.",
  },

  // ─── Section 7: Merge K Sorted Structures ───
  {
    id: "heap-merge",
    title: "Merge K Sorted Lists / Arrays",
    difficulty: "Hard",
    theory: [
      "Merging K sorted sequences is a classic heap application. The idea: maintain a min-heap of size K, where each entry represents the current smallest unprocessed element from each sequence.",
      "Algorithm: Insert the first element from each of the K sequences. Repeatedly extract the minimum, add it to the result, and insert the next element from that sequence (if any).",
      "Time: O(N log K) where N is total elements across all sequences. Space: O(K) for the heap.",
      "This is the foundation for external sorting (when data doesn't fit in memory), K-way merge in MapReduce, and merging sorted database results.",
      "Variations: Merge K sorted linked lists (LC 23), Smallest Range Covering Elements from K Lists (LC 632), Kth Smallest Element in a Sorted Matrix (LC 378).",
    ],
    keyPoints: [
      "Heap size is always K (one entry per list)",
      "O(N log K) total — much better than sorting all N elements",
      "Track which list each element came from",
      "Foundation for external sorting and database merges",
    ],
    code: [
      {
        title: "Merge K Sorted Arrays",
        language: "java",
        content: `import java.util.*;

public class MergeKSortedArrays {
    
    public static int[] mergeKSorted(int[][] arrays) {
        // PQ entry: {value, arrayIndex, elementIndex}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        
        int totalSize = 0;
        for (int i = 0; i < arrays.length; i++) {
            if (arrays[i].length > 0) {
                pq.offer(new int[]{arrays[i][0], i, 0});
                totalSize += arrays[i].length;
            }
        }
        
        int[] result = new int[totalSize];
        int idx = 0;
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int val = curr[0], arrIdx = curr[1], eleIdx = curr[2];
            
            result[idx++] = val;
            
            // If there's a next element in this array, add it
            if (eleIdx + 1 < arrays[arrIdx].length) {
                pq.offer(new int[]{arrays[arrIdx][eleIdx + 1], arrIdx, eleIdx + 1});
            }
        }
        
        return result;
    }

    public static void main(String[] args) {
        int[][] arrays = {
            {1, 4, 7},
            {2, 5, 8},
            {3, 6, 9}
        };
        System.out.println(Arrays.toString(mergeKSorted(arrays)));
        // [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
}`,
      },
      {
        title: "Merge K Sorted Linked Lists",
        language: "java",
        content: `import java.util.*;

public class MergeKSortedLists {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> pq = new PriorityQueue<>(
            (a, b) -> a.val - b.val
        );

        // Add head of each list
        for (ListNode head : lists) {
            if (head != null) pq.offer(head);
        }

        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        while (!pq.isEmpty()) {
            ListNode min = pq.poll();
            tail.next = min;
            tail = tail.next;

            if (min.next != null) {
                pq.offer(min.next);
            }
        }

        return dummy.next;
    }

    // Helper to print list
    static void printList(ListNode head) {
        while (head != null) {
            System.out.print(head.val + " → ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        // List 1: 1 → 4 → 5
        ListNode l1 = new ListNode(1); l1.next = new ListNode(4); l1.next.next = new ListNode(5);
        // List 2: 1 → 3 → 4
        ListNode l2 = new ListNode(1); l2.next = new ListNode(3); l2.next.next = new ListNode(4);
        // List 3: 2 → 6
        ListNode l3 = new ListNode(2); l3.next = new ListNode(6);

        ListNode result = mergeKLists(new ListNode[]{l1, l2, l3});
        printList(result);
        // 1 → 1 → 2 → 3 → 4 → 4 → 5 → 6 → null
    }
}`,
      },
      {
        title: "Kth Smallest Element in a Sorted Matrix",
        language: "java",
        content: `import java.util.*;

public class KthSmallestMatrix {
    // Matrix where each row and column is sorted
    // Find kth smallest element
    
    public static int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        // PQ: {value, row, col}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        
        // Add first element of each row
        for (int i = 0; i < Math.min(n, k); i++) {
            pq.offer(new int[]{matrix[i][0], i, 0});
        }
        
        int result = 0;
        for (int i = 0; i < k; i++) {
            int[] curr = pq.poll();
            result = curr[0];
            int row = curr[1], col = curr[2];
            
            if (col + 1 < n) {
                pq.offer(new int[]{matrix[row][col + 1], row, col + 1});
            }
        }
        
        return result;
    }

    public static void main(String[] args) {
        int[][] matrix = {
            {1, 5, 9},
            {10, 11, 13},
            {12, 13, 15}
        };
        System.out.println("8th smallest: " + kthSmallest(matrix, 8)); // 13
    }
}`,
      },
    ],
  },

  // ─── Section 8: Heap in Graph Algorithms ───
  {
    id: "heap-graphs",
    title: "Heaps in Graph Algorithms",
    difficulty: "Hard",
    theory: [
      "Heaps (priority queues) are essential in several graph algorithms. The most important is Dijkstra's Algorithm for shortest paths in graphs with non-negative weights.",
      "Dijkstra's with a min-heap: Extract the node with minimum distance, relax its neighbors, and insert updated distances. Time: O((V + E) log V) with a binary heap.",
      "Prim's MST Algorithm: Similar to Dijkstra — extract the edge with minimum weight connecting the MST to a non-MST vertex. Time: O((V + E) log V).",
      "A* Search: Uses a priority queue ordered by f(n) = g(n) + h(n), where g is actual cost and h is heuristic estimate. This is the foundation of pathfinding in games and navigation.",
      "In Java CP, since PriorityQueue doesn't support decrease-key efficiently, we use the 'lazy deletion' approach: insert duplicate entries and skip already-visited nodes when polled.",
    ],
    keyPoints: [
      "Dijkstra: O((V+E) log V) with binary heap",
      "Prim's MST: same complexity, different relaxation",
      "A*: heap ordered by f = g + h (heuristic search)",
      "Java trick: insert duplicates, skip visited — avoids decrease-key",
      "Fibonacci heap gives O(V log V + E) for Dijkstra but impractical",
    ],
    code: [
      {
        title: "Dijkstra's Algorithm with Min-Heap",
        language: "java",
        content: `import java.util.*;

public class DijkstraHeap {
    
    public static int[] dijkstra(List<int[]>[] graph, int src) {
        int n = graph.length;
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        
        // PQ: {distance, node}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{0, src});
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int d = curr[0], u = curr[1];
            
            // Skip stale entries (lazy deletion)
            if (d > dist[u]) continue;
            
            for (int[] edge : graph[u]) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.offer(new int[]{dist[v], v});
                }
            }
        }
        
        return dist;
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        int n = 5;
        List<int[]>[] graph = new List[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        
        // Add edges: {to, weight}
        graph[0].add(new int[]{1, 4}); graph[0].add(new int[]{2, 1});
        graph[1].add(new int[]{3, 1});
        graph[2].add(new int[]{1, 2}); graph[2].add(new int[]{3, 5});
        graph[3].add(new int[]{4, 3});
        
        int[] dist = dijkstra(graph, 0);
        System.out.println(Arrays.toString(dist));
        // [0, 3, 1, 4, 7]
    }
}`,
      },
      {
        title: "Prim's MST using Min-Heap",
        language: "java",
        content: `import java.util.*;

public class PrimMST {
    
    public static int primMST(List<int[]>[] graph, int n) {
        boolean[] inMST = new boolean[n];
        // PQ: {weight, node}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{0, 0}); // start from node 0
        
        int totalWeight = 0;
        int edgesUsed = 0;
        
        while (!pq.isEmpty() && edgesUsed < n) {
            int[] curr = pq.poll();
            int w = curr[0], u = curr[1];
            
            if (inMST[u]) continue; // skip if already in MST
            
            inMST[u] = true;
            totalWeight += w;
            edgesUsed++;
            
            for (int[] edge : graph[u]) {
                int v = edge[0], weight = edge[1];
                if (!inMST[v]) {
                    pq.offer(new int[]{weight, v});
                }
            }
        }
        
        return totalWeight;
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        int n = 4;
        List<int[]>[] graph = new List[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        
        // Undirected edges
        int[][] edges = {{0,1,10}, {0,2,6}, {0,3,5}, {1,3,15}, {2,3,4}};
        for (int[] e : edges) {
            graph[e[0]].add(new int[]{e[1], e[2]});
            graph[e[1]].add(new int[]{e[0], e[2]});
        }
        
        System.out.println("MST weight: " + primMST(graph, n)); // 19
    }
}`,
      },
    ],
  },

  // ─── Section 9: Advanced Heap Variants ───
  {
    id: "heap-advanced",
    title: "Advanced Heap Variants & Techniques",
    difficulty: "Expert",
    theory: [
      "Beyond binary heaps, several advanced heap variants exist for specialized use cases. Understanding them gives you an edge in competitive programming and system design.",
      "Indexed Priority Queue (IPQ): Supports decrease-key and increase-key in O(log n) by maintaining a position map. Essential for optimal Dijkstra/Prim implementations. Not available in Java standard library — you must implement it yourself.",
      "D-ary Heap: Generalization where each node has D children instead of 2. Decrease-key is faster (O(log_D n)) but extract-min is slower (O(D * log_D n)). Optimal D depends on the operation mix.",
      "Fibonacci Heap: Amortized O(1) insert and decrease-key, O(log n) extract-min. Gives optimal O(V log V + E) Dijkstra. Too complex for CP but important theoretically.",
      "Double-Ended Priority Queue (DEPQ): Supports both min and max extraction. Can be implemented using a min-max heap or two synchronized heaps.",
      "Mergeable Heaps: Leftist Heap and Skew Heap support O(log n) merge operations. Useful when you frequently need to combine priority queues.",
    ],
    keyPoints: [
      "Indexed PQ: decrease-key in O(log n) — implement for optimal graph algos",
      "D-ary heap: tune D based on insert vs extract ratio",
      "Fibonacci heap: theoretical optimum, impractical in CP",
      "Leftist/Skew heaps: O(log n) merge",
      "Min-Max heap: O(1) access to both min and max",
    ],
    code: [
      {
        title: "Indexed Min Priority Queue (Decrease-Key Support)",
        language: "java",
        content: `public class IndexedMinPQ {
    private int maxN;    // max number of elements
    private int n;       // current number of elements
    private int[] pq;    // binary heap using 1-based indexing
    private int[] qp;    // inverse: qp[i] = position of i in pq
    private int[] keys;  // keys[i] = priority of element i

    public IndexedMinPQ(int maxN) {
        this.maxN = maxN;
        n = 0;
        keys = new int[maxN];
        pq = new int[maxN + 1];
        qp = new int[maxN];
        java.util.Arrays.fill(qp, -1);
    }

    public boolean isEmpty() { return n == 0; }
    public boolean contains(int i) { return qp[i] != -1; }
    public int peekMinIndex() { return pq[1]; }
    public int peekMinKey() { return keys[pq[1]]; }

    public void insert(int i, int key) {
        n++;
        qp[i] = n;
        pq[n] = i;
        keys[i] = key;
        swim(n);
    }

    public int pollMinIndex() {
        int min = pq[1];
        swap(1, n--);
        sink(1);
        qp[min] = -1;
        return min;
    }

    // ★ The key operation: decrease key of element i
    public void decreaseKey(int i, int key) {
        keys[i] = key;
        swim(qp[i]);
    }

    private void swim(int k) {
        while (k > 1 && keys[pq[k/2]] > keys[pq[k]]) {
            swap(k, k/2);
            k = k/2;
        }
    }

    private void sink(int k) {
        while (2*k <= n) {
            int j = 2*k;
            if (j < n && keys[pq[j+1]] < keys[pq[j]]) j++;
            if (keys[pq[k]] <= keys[pq[j]]) break;
            swap(k, j);
            k = j;
        }
    }

    private void swap(int i, int j) {
        int temp = pq[i]; pq[i] = pq[j]; pq[j] = temp;
        qp[pq[i]] = i; qp[pq[j]] = j;
    }

    public static void main(String[] args) {
        IndexedMinPQ ipq = new IndexedMinPQ(10);
        ipq.insert(0, 15);
        ipq.insert(1, 10);
        ipq.insert(2, 20);
        
        System.out.println("Min: idx=" + ipq.peekMinIndex() + " key=" + ipq.peekMinKey());
        // Min: idx=1 key=10
        
        ipq.decreaseKey(2, 5); // decrease key of element 2 from 20 to 5
        System.out.println("Min: idx=" + ipq.peekMinIndex() + " key=" + ipq.peekMinKey());
        // Min: idx=2 key=5
    }
}`,
      },
      {
        title: "Leftist Heap — Mergeable Heap",
        language: "java",
        content: `public class LeftistHeap {
    static class Node {
        int val, rank;
        Node left, right;
        Node(int val) { this.val = val; this.rank = 1; }
    }

    Node root;

    // ★ Merge two leftist heaps in O(log n)
    static Node merge(Node a, Node b) {
        if (a == null) return b;
        if (b == null) return a;

        // Ensure a has smaller root
        if (a.val > b.val) { Node t = a; a = b; b = t; }

        // Merge b with right subtree of a
        a.right = merge(a.right, b);

        // Maintain leftist property: rank(left) >= rank(right)
        if (a.left == null || (a.right != null && a.left.rank < a.right.rank)) {
            Node t = a.left; a.left = a.right; a.right = t;
        }

        // Update rank
        a.rank = (a.right == null) ? 1 : a.right.rank + 1;
        return a;
    }

    public void insert(int val) {
        root = merge(root, new Node(val));
    }

    public int extractMin() {
        int min = root.val;
        root = merge(root.left, root.right);
        return min;
    }

    public void mergeWith(LeftistHeap other) {
        root = merge(root, other.root);
    }

    public static void main(String[] args) {
        LeftistHeap h1 = new LeftistHeap();
        h1.insert(3); h1.insert(10); h1.insert(8);

        LeftistHeap h2 = new LeftistHeap();
        h2.insert(1); h2.insert(5); h2.insert(7);

        h1.mergeWith(h2); // O(log n) merge!
        
        while (h1.root != null) {
            System.out.print(h1.extractMin() + " ");
        }
        // 1 3 5 7 8 10
    }
}`,
      },
    ],
    note: "In competitive programming, you'll rarely need Fibonacci or Leftist heaps — the Indexed PQ is the most practically useful advanced variant. Know the others conceptually for interviews.",
  },

  // ─── Section 10: Heap Practice Problems & Patterns ───
  {
    id: "heap-practice",
    title: "Heap Practice Problems & Patterns",
    difficulty: "Expert",
    theory: [
      "Heap problems follow recognizable patterns. Learning to identify these patterns will let you solve any heap problem you encounter.",
      "Pattern 1 — Top-K: Use opposite-type heap of size K. Kth largest → min-heap; Kth smallest → max-heap. Examples: Top K Frequent, K Closest Points.",
      "Pattern 2 — Two Heaps: Maintain max-heap (lower half) + min-heap (upper half) for streaming median or balanced partition problems.",
      "Pattern 3 — K-Way Merge: Heap of size K tracking current position in K sorted sequences. Examples: Merge K Sorted Lists, Smallest Range.",
      "Pattern 4 — Greedy + Heap: Use heap to always pick the optimal next choice. Examples: Task Scheduler, Reorganize String, Huffman Coding.",
      "Pattern 5 — Lazy Deletion: Instead of removing from heap (O(n)), mark as deleted and skip when polled. Essential for sliding window problems.",
      "Pattern 6 — Event/Sweep Line: Process events in order using heap. Examples: Meeting Rooms II, Skyline Problem, Interval scheduling.",
    ],
    keyPoints: [
      "Always identify which pattern a problem follows",
      "Top-K → opposite heap of size K",
      "Streaming stats → two heaps",
      "Multiple sorted sources → K-way merge",
      "Greedy optimal choice → max/min heap",
      "Sliding window + heap → lazy deletion",
    ],
    code: [
      {
        title: "Task Scheduler (Greedy + Heap)",
        language: "java",
        content: `import java.util.*;

public class TaskScheduler {
    // Given tasks and cooldown n, find minimum intervals
    // to execute all tasks. Example: ["A","A","A","B","B","B"], n=2 → 8
    
    public static int leastInterval(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char c : tasks) freq[c - 'A']++;
        
        // Max-heap of frequencies
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        for (int f : freq) if (f > 0) pq.offer(f);
        
        int time = 0;
        
        while (!pq.isEmpty()) {
            List<Integer> temp = new ArrayList<>();
            
            // Process up to n+1 tasks in each cycle
            for (int i = 0; i <= n; i++) {
                if (!pq.isEmpty()) {
                    int count = pq.poll() - 1;
                    if (count > 0) temp.add(count);
                }
                time++;
                
                // If no more tasks to process, stop
                if (pq.isEmpty() && temp.isEmpty()) break;
            }
            
            // Add remaining tasks back
            pq.addAll(temp);
        }
        
        return time;
    }

    public static void main(String[] args) {
        char[] tasks = {'A','A','A','B','B','B'};
        System.out.println(leastInterval(tasks, 2)); // 8
        // Execution: A B _ A B _ A B
    }
}`,
      },
      {
        title: "Reorganize String (Greedy + Heap)",
        language: "java",
        content: `import java.util.*;

public class ReorganizeString {
    // Rearrange string so no two adjacent chars are same
    // Return "" if impossible
    
    public static String reorganizeString(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        
        // Max-heap: {frequency, character}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        for (int i = 0; i < 26; i++) {
            if (freq[i] > 0) pq.offer(new int[]{freq[i], i});
        }
        
        StringBuilder sb = new StringBuilder();
        int[] prev = null; // previously used character (waiting for cooldown)
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            sb.append((char) (curr[1] + 'a'));
            curr[0]--;
            
            // Re-add the previous character (cooldown of 1)
            if (prev != null && prev[0] > 0) pq.offer(prev);
            
            prev = curr;
        }
        
        return sb.length() == s.length() ? sb.toString() : "";
    }

    public static void main(String[] args) {
        System.out.println(reorganizeString("aab"));    // "aba"
        System.out.println(reorganizeString("aaab"));   // ""
        System.out.println(reorganizeString("aabbcc")); // "abcabc"
    }
}`,
      },
      {
        title: "The Skyline Problem (Sweep Line + Heap)",
        language: "java",
        content: `import java.util.*;

public class SkylineProblem {
    // Classic sweep line + max-heap problem
    // Input: buildings as [left, right, height]
    // Output: key points of the skyline
    
    public static List<List<Integer>> getSkyline(int[][] buildings) {
        // Events: (x, height). Negative height = building start
        List<int[]> events = new ArrayList<>();
        for (int[] b : buildings) {
            events.add(new int[]{b[0], -b[2]}); // start: negative height
            events.add(new int[]{b[1],  b[2]}); // end: positive height
        }
        
        // Sort by x; if same x, by height (starts before ends)
        events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        
        // Max-heap of active heights
        TreeMap<Integer, Integer> heights = new TreeMap<>(Collections.reverseOrder());
        heights.put(0, 1); // ground level
        int prevMax = 0;
        
        List<List<Integer>> result = new ArrayList<>();
        
        for (int[] e : events) {
            int x = e[0], h = e[1];
            
            if (h < 0) {
                // Building start
                heights.merge(-h, 1, Integer::sum);
            } else {
                // Building end
                int count = heights.get(h);
                if (count == 1) heights.remove(h);
                else heights.put(h, count - 1);
            }
            
            int currMax = heights.firstKey();
            if (currMax != prevMax) {
                result.add(Arrays.asList(x, currMax));
                prevMax = currMax;
            }
        }
        
        return result;
    }

    public static void main(String[] args) {
        int[][] buildings = {{2,9,10}, {3,7,15}, {5,12,12}, {15,20,10}, {19,24,8}};
        System.out.println(getSkyline(buildings));
        // [[2,10], [3,15], [7,12], [12,0], [15,10], [20,8], [24,0]]
    }
}`,
      },
      {
        title: "Huffman Coding (Greedy + Heap)",
        language: "java",
        content: `import java.util.*;

public class HuffmanCoding {
    static class HuffNode implements Comparable<HuffNode> {
        char ch;
        int freq;
        HuffNode left, right;

        HuffNode(char ch, int freq) { this.ch = ch; this.freq = freq; }

        public int compareTo(HuffNode o) { return this.freq - o.freq; }
    }

    public static HuffNode buildTree(Map<Character, Integer> freqMap) {
        PriorityQueue<HuffNode> pq = new PriorityQueue<>();
        for (var entry : freqMap.entrySet()) {
            pq.offer(new HuffNode(entry.getKey(), entry.getValue()));
        }

        while (pq.size() > 1) {
            HuffNode left = pq.poll();
            HuffNode right = pq.poll();
            HuffNode parent = new HuffNode('\\0', left.freq + right.freq);
            parent.left = left;
            parent.right = right;
            pq.offer(parent);
        }

        return pq.poll();
    }

    static void printCodes(HuffNode root, String code) {
        if (root == null) return;
        if (root.ch != '\\0') {
            System.out.println(root.ch + ": " + code + " (freq=" + root.freq + ")");
        }
        printCodes(root.left, code + "0");
        printCodes(root.right, code + "1");
    }

    public static void main(String[] args) {
        String text = "abracadabra";
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : text.toCharArray()) freq.merge(c, 1, Integer::sum);
        
        HuffNode root = buildTree(freq);
        System.out.println("Huffman Codes:");
        printCodes(root, "");
        // a: 0 (freq=5)
        // b: 10 (freq=2)
        // r: 110 (freq=2)
        // c: 1110 (freq=1)
        // d: 1111 (freq=1)
    }
}`,
      },
    ],
    table: {
      headers: ["Pattern", "Heap Type", "Example Problems"],
      rows: [
        ["Top-K", "Opposite heap, size K", "Kth Largest, Top K Frequent, K Closest Points"],
        ["Two Heaps", "Max-heap + Min-heap", "Find Median, Sliding Window Median, IPO"],
        ["K-Way Merge", "Min-heap, size K", "Merge K Lists, Smallest Range, Kth Smallest in Matrix"],
        ["Greedy + Heap", "Max or Min heap", "Task Scheduler, Reorganize String, Huffman"],
        ["Lazy Deletion", "Heap + HashMap", "Sliding Window Max/Median, Event processing"],
        ["Sweep Line", "Max-heap of active", "Skyline Problem, Meeting Rooms II, Calendar"],
      ],
    },
    tip: "When you see 'K largest/smallest', 'merge sorted', 'schedule optimally', or 'streaming median' — think HEAP immediately. These are the biggest pattern signals.",
  },
];
