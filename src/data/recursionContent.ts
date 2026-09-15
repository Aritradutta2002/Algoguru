export interface DiagramBox {
  label: string;
  children?: DiagramBox[];
  color?: string; // CSS var like "primary", "accent", "success"
}

export interface GraphNode {
  id: string;
  label?: string;
  x?: number; // relative position 0-100
  y?: number; // relative position 0-100
  color?: string;
  highlight?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  color?: string;
  directed?: boolean;
  label?: string;
}

export interface GraphDiagramData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
  weighted?: boolean;
  highlightPath?: string[]; // node ids in path
  showLabels?: boolean;
}

export interface Diagram {
  type: "layers" | "hierarchy" | "flow" | "table-visual" | "graph";
  title: string;
  data: DiagramBox[] | GraphDiagramData;
  direction?: "vertical" | "horizontal";
}

export interface ContentSection {
  id: string;
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Expert";
  timeComplexity?: string;
  spaceComplexity?: string;
  theory: string[];
  keyPoints?: string[];
  diagram?: Diagram;
  code?: {
    title: string;
    language: string;
    content: string;
  }[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  note?: string;
  tip?: string;
  warning?: string;
}

export const recursionContent: ContentSection[] = [
  {
    id: "recursion-intro",
    title: "What is Recursion?",
    difficulty: "Easy",
    theory: [
      "Recursion is a programming technique where a function calls itself directly or indirectly to solve a problem by breaking it into smaller subproblems of the same type.",
      "Every recursive solution must have two critical components: a Base Case (the stopping condition that prevents infinite recursion) and a Recursive Case (the part where the function calls itself with a simpler input).",
      "The Call Stack is fundamental to understanding recursion. Each function call is pushed onto the stack, and when the base case is reached, stack frames are popped off as values are returned — this is called the 'unwinding' phase.",
      "Recursion depth refers to how many times a function calls itself. Java's default stack size can handle roughly 1000–8000 recursive calls. Exceeding this causes a StackOverflowError.",
    ],
    diagram: {
      type: "flow",
      title: "Recursion Call Stack — factorial(4)",
      direction: "vertical",
      data: [
        { label: "factorial(4)", color: "primary", children: [{ label: "return 4 × factorial(3)" }] },
        { label: "factorial(3)", color: "info", children: [{ label: "return 3 × factorial(2)" }] },
        { label: "factorial(2)", color: "accent", children: [{ label: "return 2 × factorial(1)" }] },
        { label: "factorial(1)", color: "success", children: [{ label: "BASE CASE → return 1" }] }
      ]
    },
    keyPoints: [
      "Always define the base case first — it is the most critical part",
      "Each recursive call must move toward the base case",
      "Recursion trades time efficiency for code clarity",
      "Every recursive problem can be solved iteratively (and vice versa)",
      "Space complexity includes the call stack — O(n) for depth n",
    ],
    code: [
      {
        title: "Anatomy of a Recursive Function",
        language: "java",
        content: `public class RecursionBasics {
    
    // Template for any recursive function
    public static ReturnType solve(Parameters params) {
        // Step 1: BASE CASE - when to stop
        if (baseCondition) {
            return baseValue;
        }
        
        // Step 2: RECURSIVE CASE - smaller subproblem
        // Process current element
        // Make recursive call with reduced input
        return solve(smallerParams);
    }
    
    // Concrete example: Print 1 to N
    public static void printNumbers(int n) {
        if (n == 0) return;           // Base case
        printNumbers(n - 1);          // Recursive call (goes DOWN first)
        System.out.println(n);        // Print on the way UP (backtrack)
    }
    
    // Print N to 1 (different ordering)
    public static void printReverse(int n) {
        if (n == 0) return;           // Base case
        System.out.println(n);        // Print BEFORE recursive call
        printReverse(n - 1);          // Recursive call
    }
    
    public static void main(String[] args) {
        System.out.println("--- 1 to 5 ---");
        printNumbers(5);     // Output: 1 2 3 4 5
        
        System.out.println("--- 5 to 1 ---");
        printReverse(5);     // Output: 5 4 3 2 1
    }
}`,
      },
      {
        title: "Call Stack Visualization - Sum of N Numbers",
        language: "java",
        content: `public class CallStackDemo {
    
    /**
     * sum(4) 
     *   → 4 + sum(3)
     *         → 3 + sum(2)
     *               → 2 + sum(1)
     *                     → 1 + sum(0)
     *                           → 0  [BASE CASE]
     *                     ← 1 + 0 = 1
     *               ← 2 + 1 = 3
     *         ← 3 + 3 = 6
     *   ← 4 + 6 = 10
     */
    public static int sum(int n) {
        if (n == 0) return 0;        // Base case
        return n + sum(n - 1);       // Recursive case
    }
    
    // With step-by-step trace
    public static int sumWithTrace(int n, int depth) {
        String indent = "  ".repeat(depth);
        System.out.println(indent + "→ sum(" + n + ") called");
        
        if (n == 0) {
            System.out.println(indent + "← Base case: returning 0");
            return 0;
        }
        
        int result = n + sumWithTrace(n - 1, depth + 1);
        System.out.println(indent + "← sum(" + n + ") returning " + result);
        return result;
    }
    
    public static void main(String[] args) {
        System.out.println("Sum of 1 to 5 = " + sum(5)); // 15
        System.out.println("\\n--- Trace ---");
        sumWithTrace(4, 0);
    }
}`,
      },
    ],
    note: "The key insight: recursive calls build up on the stack going DOWN, then results propagate back UP during unwinding. This dual-phase nature (going down + coming back up) is what makes recursion powerful.",
  },
  {
    id: "recursion-types",
    title: "Types of Recursion",
    difficulty: "Easy",
    theory: [
      "Direct Recursion: A function calls itself directly. This is the most common form.",
      "Indirect Recursion: Function A calls Function B, which calls Function A. Creates a cycle through multiple functions.",
      "Tail Recursion: The recursive call is the LAST operation performed. The compiler can optimize this into a loop (Tail Call Optimization — TCO). Java does NOT support TCO by default.",
      "Head Recursion: The recursive call happens BEFORE any processing. All computation happens during unwinding.",
      "Tree Recursion: A function makes MORE than one recursive call per invocation (e.g., Fibonacci makes 2 calls). Exponential time complexity.",
      "Linear Recursion: Makes exactly ONE recursive call per invocation. Problem size reduces by a constant amount.",
    ],
    code: [
      {
        title: "All Recursion Types in Java",
        language: "java",
        content: `public class RecursionTypes {
    
    // 1. TAIL RECURSION — Recursive call is LAST operation
    // Can be optimized by compiler (not by Java JVM)
    public static int factorialTail(int n, int accumulator) {
        if (n == 0) return accumulator;           // Base case
        return factorialTail(n - 1, n * accumulator); // LAST operation
    }
    // Usage: factorialTail(5, 1) → 120
    
    // Compare with HEAD RECURSION — Processing happens LAST (on unwind)
    public static int factorialHead(int n) {
        if (n == 0) return 1;
        int subResult = factorialHead(n - 1); // Call first
        return n * subResult;                 // Process AFTER (on unwind)
    }
    
    // 2. TREE RECURSION — Multiple recursive calls per invocation
    // Fibonacci: fib(n) = fib(n-1) + fib(n-2)  → O(2^n) calls!
    public static int fibTree(int n) {
        if (n <= 1) return n;
        return fibTree(n - 1) + fibTree(n - 2); // TWO recursive calls
    }
    /*
     * fib(5)
     * ├── fib(4)
     * │   ├── fib(3)
     * │   │   ├── fib(2) → fib(1)+fib(0) = 1
     * │   │   └── fib(1) = 1
     * │   └── fib(2) → 1
     * └── fib(3)
     *     ├── fib(2) → 1
     *     └── fib(1) = 1
     * Total calls for fib(5) = 15 calls!
     */
    
    // 3. INDIRECT RECURSION — A calls B, B calls A
    public static boolean isEven(int n) {
        if (n == 0) return true;
        return isOdd(n - 1);     // A calls B
    }
    
    public static boolean isOdd(int n) {
        if (n == 0) return false;
        return isEven(n - 1);    // B calls A
    }
    
    // 4. LINEAR RECURSION — Single call, reducing by 1 each time
    public static int sumLinear(int n) {
        if (n == 0) return 0;
        return n + sumLinear(n - 1); // Exactly ONE recursive call
    }
    
    public static void main(String[] args) {
        System.out.println("Factorial (tail):  " + factorialTail(5, 1)); // 120
        System.out.println("Factorial (head):  " + factorialHead(5));    // 120
        System.out.println("Fibonacci (tree):  " + fibTree(6));          // 8
        System.out.println("isEven(4):         " + isEven(4));           // true
        System.out.println("isOdd(7):          " + isOdd(7));            // true
    }
}`,
      },
    ],
    table: {
      headers: ["Type", "Calls/Step", "Order", "Time Complexity", "Java Optimization"],
      rows: [
        ["Tail", "1", "Process → Recurse", "O(n) stack", "Manual (no TCO)"],
        ["Head", "1", "Recurse → Process", "O(n) stack", "N/A"],
        ["Tree", "2+", "Branch both ways", "O(2^n) typical", "Use Memoization"],
        ["Linear", "1", "Reduces by constant", "O(n) stack", "Often iterative"],
        ["Indirect", "1 (cross-fn)", "Cycles", "O(n) stack", "N/A"],
      ],
    },
  },
  {
    id: "recursion-factorial",
    title: "Factorial & Fibonacci",
    difficulty: "Easy",
    timeComplexity: "O(n) Factorial | O(2^n) Naive Fib | O(n) Memoized Fib",
    spaceComplexity: "O(n) stack depth",
    theory: [
      "Factorial (n!) = n × (n-1) × (n-2) × ... × 1 is the classic recursion example. The recursive formulation: fact(n) = n × fact(n-1), with fact(0) = 1.",
      "Fibonacci sequence (0,1,1,2,3,5,8,13...) is the quintessential tree recursion example. Naive recursion is O(2^n) — extremely slow for large n.",
      "Memoization transforms Fibonacci from O(2^n) to O(n) by caching already-computed results. This is the bridge from pure recursion to Dynamic Programming.",
      "These two problems teach you the most important recursion lesson: identify overlapping subproblems and eliminate redundant computation.",
    ],
    code: [
      {
        title: "Factorial — All Implementations",
        language: "java",
        content: `import java.math.BigInteger;

public class Factorial {
    
    // 1. Classic Recursive — O(n) time, O(n) space
    public static long factorial(int n) {
        if (n < 0) throw new IllegalArgumentException("n must be >= 0");
        if (n <= 1) return 1;           // Base: 0! = 1! = 1
        return n * factorial(n - 1);    // Recursive: n! = n × (n-1)!
    }
    
    // 2. Tail-recursive version (explicit accumulator)
    public static long factTail(int n, long acc) {
        if (n <= 1) return acc;
        return factTail(n - 1, n * acc); // Accumulate going down
    }
    
    // 3. Iterative (what tail recursion becomes after optimization)
    public static long factIterative(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) result *= i;
        return result;
    }
    
    // 4. BigInteger for large factorials (n > 20 overflows long)
    public static BigInteger factBig(int n) {
        if (n <= 1) return BigInteger.ONE;
        return BigInteger.valueOf(n).multiply(factBig(n - 1));
    }
    
    public static void main(String[] args) {
        // Test correctness
        for (int i = 0; i <= 10; i++) {
            System.out.printf("%-3d! = %d%n", i, factorial(i));
        }
        System.out.println("20! = " + factorial(20));     // 2432902008176640000
        System.out.println("25! = " + factBig(25));       // Huge number
    }
}`,
      },
      {
        title: "Fibonacci — Naive vs Memoized vs DP",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

public class Fibonacci {
    
    // 1. NAIVE — O(2^n) time, O(n) space (stack)
    // WARNING: fib(50) takes billions of operations!
    public static long fibNaive(int n) {
        if (n <= 1) return n;
        return fibNaive(n - 1) + fibNaive(n - 2);
    }
    
    // 2. TOP-DOWN MEMOIZATION — O(n) time, O(n) space
    // Cache results to avoid recomputation
    private static Map<Integer, Long> memo = new HashMap<>();
    
    public static long fibMemo(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);  // Cache hit!
        
        long result = fibMemo(n - 1) + fibMemo(n - 2);
        memo.put(n, result);   // Store result before returning
        return result;
    }
    
    // 3. BOTTOM-UP TABULATION — O(n) time, O(n) space
    public static long fibDP(int n) {
        if (n <= 1) return n;
        long[] dp = new long[n + 1];
        dp[0] = 0; dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i-1] + dp[i-2];  // Build up from base cases
        }
        return dp[n];
    }
    
    // 4. SPACE OPTIMIZED DP — O(n) time, O(1) space
    public static long fibOptimal(int n) {
        if (n <= 1) return n;
        long prev2 = 0, prev1 = 1;
        for (int i = 2; i <= n; i++) {
            long curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
    
    // 5. Matrix Exponentiation — O(log n) time
    // For competitive programming with very large n
    public static long fibMatrix(int n) {
        if (n <= 1) return n;
        long[][] matrix = {{1, 1}, {1, 0}};
        long[][] result = matPow(matrix, n - 1);
        return result[0][0];
    }
    
    private static long[][] matMul(long[][] A, long[][] B) {
        return new long[][]{
            {A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]},
            {A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]}
        };
    }
    
    private static long[][] matPow(long[][] M, int p) {
        if (p == 1) return M;
        if (p % 2 == 0) {
            long[][] half = matPow(M, p / 2);
            return matMul(half, half);
        }
        return matMul(M, matPow(M, p - 1));
    }
    
    public static void main(String[] args) {
        // Benchmark comparison
        System.out.println("Fibonacci Sequence (first 15):");
        for (int i = 0; i < 15; i++) {
            System.out.print(fibOptimal(i) + " ");
        }
        System.out.println();
        
        long start, end;
        
        // Naive (only test small n)
        start = System.nanoTime();
        fibNaive(35);
        end = System.nanoTime();
        System.out.println("Naive fib(35):   " + (end-start)/1_000_000 + "ms");
        
        // Memoized
        memo.clear();
        start = System.nanoTime();
        fibMemo(35);
        end = System.nanoTime();
        System.out.println("Memoized fib(35): " + (end-start)/1_000 + "μs");
        
        // Matrix exponentiation
        start = System.nanoTime();
        fibMatrix(35);
        end = System.nanoTime();
        System.out.println("Matrix fib(35):   " + (end-start)/1_000 + "μs");
        
        System.out.println("fib(70) = " + fibOptimal(70)); // Space optimal
    }
}`,
      },
    ],
    tip: "The jump from O(2^n) to O(n) using memoization is the essence of Dynamic Programming. Always ask: 'Are we solving the same subproblem multiple times?' If yes, cache it!",
  },
  {
    id: "recursion-tower",
    title: "Tower of Hanoi",
    difficulty: "Medium",
    timeComplexity: "O(2^n) — exactly 2^n - 1 moves required",
    spaceComplexity: "O(n) for recursion stack",
    theory: [
      "Tower of Hanoi: Move n disks from Source peg to Destination peg using an Auxiliary peg, with the rule that a larger disk can NEVER be placed on a smaller disk.",
      "The key insight: to move n disks from A to C, first move (n-1) disks from A to B (using C as aux), then move the largest disk from A to C, then move (n-1) disks from B to C (using A as aux).",
      "Mathematical proof: The minimum number of moves required for n disks = 2^n - 1. For 64 disks: 2^64 - 1 ≈ 18.4 quintillion moves!",
      "This problem elegantly demonstrates recursive thinking: trust the recursion to handle the subproblem, and focus only on what the current level needs to do.",
    ],
    code: [
      {
        title: "Tower of Hanoi — Complete Implementation",
        language: "java",
        content: `public class TowerOfHanoi {
    
    static int moveCount = 0;
    
    /**
     * Move n disks from 'from' peg to 'to' peg using 'aux' peg
     * 
     * Recursive breakdown:
     * 1. Move (n-1) disks from 'from' to 'aux' (using 'to' as helper)
     * 2. Move disk n from 'from' to 'to'
     * 3. Move (n-1) disks from 'aux' to 'to' (using 'from' as helper)
     */
    public static void hanoi(int n, char from, char to, char aux) {
        if (n == 0) return;                     // Base case: nothing to move
        
        hanoi(n - 1, from, aux, to);           // Step 1: Move n-1 to aux
        
        moveCount++;
        System.out.printf("Move disk %-2d: %c → %c%n", n, from, to);
        
        hanoi(n - 1, aux, to, from);           // Step 3: Move n-1 from aux to dest
    }
    
    // Return just the moves as a list (useful for verification)
    public static void hanoiSilent(int n, char from, char to, char aux,
                                    java.util.List<String> moves) {
        if (n == 0) return;
        hanoiSilent(n - 1, from, aux, to, moves);
        moves.add("Disk " + n + ": " + from + " → " + to);
        hanoiSilent(n - 1, aux, to, from, moves);
    }
    
    // Mathematical formula: minimum moves = 2^n - 1
    public static long minMoves(int n) {
        return (1L << n) - 1;  // 2^n - 1 using bit shift
    }
    
    // ITERATIVE solution using frame simulation
    // Useful when n is large (avoid stack overflow)
    public static void hanoiIterative(int n) {
        // Not commonly used in practice, but shows it CAN be done
        // Complex implementation using explicit stack
        java.util.Deque<int[]> stack = new java.util.ArrayDeque<>();
        // [n, from, to, aux] — encoded as integers
        stack.push(new int[]{n, 0, 2, 1}); // A=0, B=1, C=2
        
        while (!stack.isEmpty()) {
            int[] frame = stack.pop();
            int disk = frame[0];
            int src = frame[1], dst = frame[2], mid = frame[3];
            
            if (disk == 0) continue;
            
            // Push in reverse order (stack is LIFO)
            stack.push(new int[]{disk - 1, mid, dst, src});
            stack.push(new int[]{0, 0, 0, 0}); // placeholder
            // Actually: push move action
            System.out.println("Move disk " + disk + ": " + 
                "ABC".charAt(src) + " → " + "ABC".charAt(dst));
            stack.push(new int[]{disk - 1, src, mid, dst});
        }
    }
    
    public static void main(String[] args) {
        // Solve for n=3 (7 moves)
        System.out.println("=== Tower of Hanoi: n=3 ===");
        moveCount = 0;
        hanoi(3, 'A', 'C', 'B');
        System.out.println("Total moves: " + moveCount);
        System.out.println("Expected: " + minMoves(3));
        
        System.out.println();
        
        // Show move counts for various n
        System.out.println("=== Move Counts ===");
        for (int i = 1; i <= 10; i++) {
            System.out.printf("n=%-2d → %d moves%n", i, minMoves(i));
        }
        
        // 64 disks — the legend
        System.out.println("\\n64 disks: " + minMoves(64) + " moves");
        System.out.println("At 1 move/second = " + (minMoves(64) / 31_536_000L) + " years!");
    }
}
/* Output for n=3:
   Move disk 1 : A → C
   Move disk 2 : A → B
   Move disk 1 : C → B
   Move disk 3 : A → C
   Move disk 1 : B → A
   Move disk 2 : B → C
   Move disk 1 : A → C
   Total moves: 7
*/`,
      },
    ],
    tip: "The 'leap of faith' in Tower of Hanoi: assume the recursive call correctly moves n-1 disks. Your job at each level is only to move the largest disk.",
  },
  {
    id: "recursion-divide",
    title: "Divide & Conquer",
    difficulty: "Medium",
    timeComplexity: "Varies — typically O(n log n)",
    spaceComplexity: "O(log n) to O(n) depending on algorithm",
    theory: [
      "Divide & Conquer is a recursive algorithm design paradigm: Divide the problem into smaller subproblems, Conquer each subproblem recursively, Combine the results.",
      "Master Theorem determines time complexity of D&C algorithms: T(n) = aT(n/b) + f(n), where a = subproblems, b = factor by which input shrinks, f(n) = work to divide/combine.",
      "Classic examples: Merge Sort O(n log n), Quick Sort O(n log n) average, Binary Search O(log n), Closest Pair of Points O(n log n), Karatsuba Multiplication O(n^1.585).",
      "The key advantage over brute force: if we can split into 2 halves and combine in O(n), the overall complexity is O(n log n) instead of O(n²).",
    ],
    code: [
      {
        title: "Merge Sort — Classic D&C",
        language: "java",
        content: `import java.util.Arrays;

public class MergeSort {
    
    /**
     * Merge Sort: T(n) = 2T(n/2) + O(n)
     * By Master Theorem: O(n log n)
     * 
     * Phase 1 (DIVIDE): Split array in half recursively
     * Phase 2 (CONQUER): Each half sorts itself
     * Phase 3 (COMBINE): Merge two sorted halves → O(n)
     */
    public static void mergeSort(int[] arr, int left, int right) {
        if (left >= right) return;          // Base case: single element
        
        int mid = left + (right - left) / 2; // Avoid integer overflow
        
        mergeSort(arr, left, mid);          // Sort left half
        mergeSort(arr, mid + 1, right);     // Sort right half
        merge(arr, left, mid, right);       // Combine sorted halves
    }
    
    // Merge two sorted subarrays [left..mid] and [mid+1..right]
    private static void merge(int[] arr, int left, int mid, int right) {
        // Create temp arrays
        int[] L = Arrays.copyOfRange(arr, left, mid + 1);
        int[] R = Arrays.copyOfRange(arr, mid + 1, right + 1);
        
        int i = 0, j = 0, k = left;
        
        // Pick smaller element from L and R
        while (i < L.length && j < R.length) {
            if (L[i] <= R[j]) arr[k++] = L[i++];
            else               arr[k++] = R[j++];
        }
        
        // Copy remaining elements
        while (i < L.length) arr[k++] = L[i++];
        while (j < R.length) arr[k++] = R[j++];
    }
    
    // Count inversions using modified merge sort
    // Inversion: pair (i,j) where i < j but arr[i] > arr[j]
    static long inversions = 0;
    
    public static void countInversions(int[] arr, int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        countInversions(arr, left, mid);
        countInversions(arr, mid + 1, right);
        mergeAndCount(arr, left, mid, right);
    }
    
    private static void mergeAndCount(int[] arr, int left, int mid, int right) {
        int[] L = Arrays.copyOfRange(arr, left, mid + 1);
        int[] R = Arrays.copyOfRange(arr, mid + 1, right + 1);
        int i = 0, j = 0, k = left;
        
        while (i < L.length && j < R.length) {
            if (L[i] <= R[j]) {
                arr[k++] = L[i++];
            } else {
                inversions += (L.length - i); // KEY: all remaining L elements > R[j]
                arr[k++] = R[j++];
            }
        }
        while (i < L.length) arr[k++] = L[i++];
        while (j < R.length) arr[k++] = R[j++];
    }
    
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        System.out.println("Before: " + Arrays.toString(arr));
        mergeSort(arr, 0, arr.length - 1);
        System.out.println("After:  " + Arrays.toString(arr));
        
        // Count inversions
        int[] arr2 = {3, 1, 2, 5, 4}; // (3,1),(3,2),(5,4) = 3 inversions
        inversions = 0;
        countInversions(arr2, 0, arr2.length - 1);
        System.out.println("Inversions in {3,1,2,5,4}: " + inversions); // 3
    }
}`,
      },
      {
        title: "Quick Sort & Binary Search",
        language: "java",
        content: `import java.util.Random;

public class DivideConquer {
    
    // ==================== QUICK SORT ====================
    // Average: O(n log n), Worst: O(n²), Space: O(log n)
    // In-place sorting, cache-friendly
    
    private static Random rand = new Random();
    
    public static void quickSort(int[] arr, int lo, int hi) {
        if (lo >= hi) return;
        
        int pivotIdx = partition(arr, lo, hi);
        quickSort(arr, lo, pivotIdx - 1);      // Sort left of pivot
        quickSort(arr, pivotIdx + 1, hi);      // Sort right of pivot
    }
    
    // Lomuto partition scheme
    private static int partition(int[] arr, int lo, int hi) {
        // Randomize pivot to avoid worst-case O(n²) on sorted arrays
        int randIdx = lo + rand.nextInt(hi - lo + 1);
        swap(arr, randIdx, hi);
        
        int pivot = arr[hi];
        int i = lo - 1;
        
        for (int j = lo; j < hi; j++) {
            if (arr[j] <= pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, hi);
        return i + 1;
    }
    
    // Hoare's partition (faster in practice)
    private static int partitionHoare(int[] arr, int lo, int hi) {
        int pivot = arr[lo + (hi - lo) / 2];
        int i = lo - 1, j = hi + 1;
        
        while (true) {
            do { i++; } while (arr[i] < pivot);
            do { j--; } while (arr[j] > pivot);
            if (i >= j) return j;
            swap(arr, i, j);
        }
    }
    
    // 3-way partition (optimal for arrays with many duplicates)
    public static void quickSort3Way(int[] arr, int lo, int hi) {
        if (lo >= hi) return;
        
        int pivot = arr[lo];
        int lt = lo, gt = hi, i = lo + 1;
        
        while (i <= gt) {
            if      (arr[i] < pivot) swap(arr, lt++, i++);
            else if (arr[i] > pivot) swap(arr, i, gt--);
            else                     i++;
        }
        // Now arr[lo..lt-1] < pivot, arr[lt..gt] == pivot, arr[gt+1..hi] > pivot
        quickSort3Way(arr, lo, lt - 1);
        quickSort3Way(arr, gt + 1, hi);
    }
    
    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    
    // ==================== BINARY SEARCH ====================
    // O(log n) time, O(1) space (iterative) or O(log n) stack (recursive)
    
    public static int binarySearch(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;  // Avoid overflow!
            if      (arr[mid] == target) return mid;
            else if (arr[mid] < target)  lo = mid + 1;
            else                         hi = mid - 1;
        }
        return -1; // Not found
    }
    
    // Find first occurrence (lower bound)
    public static int lowerBound(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < target) lo = mid + 1;
            else                   hi = mid;
        }
        return lo; // First index where arr[lo] >= target
    }
    
    // Find last occurrence (upper bound)
    public static int upperBound(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] <= target) lo = mid + 1;
            else                    hi = mid;
        }
        return lo - 1; // Last index where arr[lo] <= target
    }
    
    // Binary search on ANSWER (very common in CP)
    // Example: "Find minimum X such that condition(X) is true"
    public static int binarySearchAnswer(int lo, int hi, java.util.function.IntPredicate condition) {
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (condition.test(mid)) hi = mid;
            else                     lo = mid + 1;
        }
        return lo;
    }
    
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 9, 3, 7, 4, 6};
        quickSort(arr, 0, arr.length - 1);
        System.out.println("Sorted: " + java.util.Arrays.toString(arr));
        System.out.println("Find 7: index " + binarySearch(arr, 7));
        System.out.println("Find 10: index " + binarySearch(arr, 10));
    }
}`,
      },
    ],
    table: {
      headers: ["Algorithm", "Time (Best)", "Time (Avg)", "Time (Worst)", "Space"],
      rows: [
        ["Merge Sort", "O(n log n)", "O(n log n)", "O(n log n)", "O(n)"],
        ["Quick Sort", "O(n log n)", "O(n log n)", "O(n²)", "O(log n)"],
        ["Binary Search", "O(1)", "O(log n)", "O(log n)", "O(1)"],
        ["Quick Select", "O(n)", "O(n)", "O(n²)", "O(log n)"],
      ],
    },
  },
  {
    id: "recursion-tree",
    title: "Tree Recursion",
    difficulty: "Medium",
    timeComplexity: "O(2^n) — exponential branches per call",
    spaceComplexity: "O(n) for recursion stack depth",
    theory: [
      "Tree Recursion occurs when a function makes MORE than one recursive call per invocation. The call tree branches like a tree, resulting in exponential time complexity in the naive form.",
      "The classic example is Fibonacci: fib(n) = fib(n-1) + fib(n-2). Each call spawns two more calls, producing a binary tree of calls with 2^n leaves — enormously wasteful due to repeated subproblems.",
      "Staircase problems, counting paths in a grid, and coin change (counting ways) are all tree recursion problems. The branching factor and depth determine the total nodes explored.",
      "The antidote to tree recursion's exponential blowup is memoization: store computed results in a cache (HashMap or array). This prunes already-visited branches and reduces time to O(n).",
      "Understanding tree recursion deeply is the gateway to Dynamic Programming — every DP problem starts as tree recursion that's optimized with caching.",
    ],
    keyPoints: [
      "Tree recursion makes k≥2 recursive calls per invocation — time is O(k^depth)",
      "The call tree for fib(n) has O(2^n) nodes — exponential without optimization",
      "Memoization converts tree recursion from O(2^n) → O(n) in most cases",
      "Count the number of unique subproblems to gauge memoization benefit",
      "Staircase, path-counting, and partition problems are classic tree recursion patterns",
    ],
    code: [
      {
        title: "Tree Recursion — Visualization & Fibonacci",
        language: "java",
        content: `import java.util.*;

public class TreeRecursion {

    // ===================== FIBONACCI CALL TREE =====================
    // fib(5) spawns a TREE of 15 total calls:
    //
    //                     fib(5)
    //                   /        \\
    //              fib(4)        fib(3)
    //             /     \\        /    \\
    //         fib(3)  fib(2)  fib(2) fib(1)
    //         /   \\   /   \\   /   \\
    //      fib(2)fib(1)fib(1)fib(0)fib(1)fib(0)
    //      /   \\
    //   fib(1) fib(0)
    //
    // Note: fib(2) appears 3 times, fib(3) appears 2 times → OVERLAP!

    static int callCount = 0;

    // NAIVE — O(2^n) time, massive redundant computation
    public static long fibNaive(int n) {
        callCount++;
        if (n <= 1) return n;
        return fibNaive(n - 1) + fibNaive(n - 2);  // TWO recursive calls
    }

    // MEMOIZED — O(n) time, O(n) space
    static Map<Integer, Long> memo = new HashMap<>();

    public static long fibMemo(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);   // Prune branch!
        long result = fibMemo(n - 1) + fibMemo(n - 2);
        memo.put(n, result);
        return result;
    }

    // Count total recursive calls for fib(n) naive
    public static int countCalls(int n) {
        if (n <= 1) return 1;
        return 1 + countCalls(n - 1) + countCalls(n - 2);
    }

    public static void main(String[] args) {
        // Demonstrate call explosion
        for (int n : new int[]{5, 10, 15, 20}) {
            callCount = 0;
            fibNaive(n);
            System.out.printf("fib(%2d): naive calls = %6d, memo calls = %3d%n",
                n, callCount, n + 1);
        }

        System.out.println("\\nFib sequence (memoized):");
        memo.clear();
        for (int i = 0; i <= 10; i++)
            System.out.print(fibMemo(i) + " ");
        System.out.println();
    }
}`,
      },
      {
        title: "Staircase Problem — Tree Recursion Pattern",
        language: "java",
        content: `import java.util.*;

public class StaircaseRecursion {

    // ===================== STAIRCASE PROBLEM =====================
    // Count ways to climb n stairs, taking 1 or 2 steps at a time.
    // Recurrence: ways(n) = ways(n-1) + ways(n-2)
    //   — Same as Fibonacci! This IS tree recursion.
    //
    // Generalized: k distinct step sizes [1, 2, ..., k]
    //   ways(n) = ways(n-1) + ways(n-2) + ... + ways(n-k)
    //   Branching factor = k, depth = n → O(k^n) naive

    // NAIVE (exponential)
    public static int climbNaive(int n) {
        if (n == 0) return 1; // Reached top: count this path
        if (n < 0)  return 0; // Overshot: invalid path
        return climbNaive(n - 1) + climbNaive(n - 2); // 1-step or 2-step
    }

    // MEMOIZED (linear)
    public static int climbMemo(int n, int[] dp) {
        if (n == 0) return 1;
        if (n < 0)  return 0;
        if (dp[n] != -1) return dp[n];   // Already computed
        dp[n] = climbMemo(n-1, dp) + climbMemo(n-2, dp);
        return dp[n];
    }

    // K-step generalization (branching factor = k)
    public static int climbKSteps(int n, int k, Map<Integer, Integer> cache) {
        if (n == 0) return 1;
        if (n < 0)  return 0;
        if (cache.containsKey(n)) return cache.get(n);

        int ways = 0;
        for (int step = 1; step <= k; step++) {
            ways += climbKSteps(n - step, k, cache); // Branch for each step
        }
        cache.put(n, ways);
        return ways;
    }

    // ===================== COUNTING PATHS IN GRID =====================
    // Count paths from (0,0) to (m-1, n-1) moving only RIGHT or DOWN
    // Tree recursion: paths(i,j) = paths(i+1,j) + paths(i,j+1)
    //
    //  (0,0) → → → →
    //    ↓           ↓
    //    ↓     ...   ↓
    //    ↓           ↓
    //              (m-1,n-1)

    static int[][] gridMemo;

    public static int countPaths(int i, int j, int m, int n) {
        if (i == m - 1 && j == n - 1) return 1; // Reached target
        if (i >= m || j >= n)          return 0; // Out of bounds
        if (gridMemo[i][j] != -1)      return gridMemo[i][j];

        gridMemo[i][j] = countPaths(i + 1, j, m, n)   // Move DOWN
                       + countPaths(i, j + 1, m, n);  // Move RIGHT
        return gridMemo[i][j];
    }

    public static void main(String[] args) {
        // Staircase ways
        System.out.println("Staircase (n=5, 1-2 steps):");
        int[] dp = new int[6];
        Arrays.fill(dp, -1);
        for (int i = 1; i <= 5; i++) {
            Arrays.fill(dp, -1);
            System.out.printf("  n=%d → %d ways%n", i, climbMemo(i, dp));
        }

        System.out.println("\\nK-step staircase (n=5, k=3):");
        System.out.println("  ways = " + climbKSteps(5, 3, new HashMap<>()));

        System.out.println("\\nGrid paths (3x3):");
        gridMemo = new int[3][3];
        for (int[] row : gridMemo) Arrays.fill(row, -1);
        System.out.println("  paths = " + countPaths(0, 0, 3, 3)); // 6
    }
}`,
      },
      {
        title: "Coin Change — Counting Ways (Tree Recursion + Memo)",
        language: "java",
        content: `import java.util.*;

public class CoinChangeRecursion {

    // ===================== COIN CHANGE — COUNT WAYS =====================
    // Given coins[] and amount, count number of ways to make the amount.
    // Tree recursion: for each coin, try using it and branch.
    //
    // countWays(amount, idx) = countWays(amount - coins[idx], idx)   // Use coin
    //                        + countWays(amount, idx + 1)             // Skip coin
    //
    // This is TREE recursion with branching at each coin.

    static Map<String, Long> memo = new HashMap<>();

    public static long countWays(int amount, int[] coins, int idx) {
        if (amount == 0) return 1;   // Exact change: valid combination
        if (amount < 0 || idx == coins.length) return 0;

        String key = amount + "," + idx;
        if (memo.containsKey(key)) return memo.get(key);

        long result = countWays(amount - coins[idx], coins, idx)  // Use current coin (can reuse)
                    + countWays(amount, coins, idx + 1);           // Move to next coin
        memo.put(key, result);
        return result;
    }

    // ===================== MINIMUM COINS =====================
    // Find minimum number of coins to make the amount.
    // Each coin can be used unlimited times.
    //
    // minCoins(amount) = 1 + min(minCoins(amount - coin)) for each coin
    // Tree recursion: branching factor = number of coins

    static int[] minMemo;

    public static int minCoins(int amount, int[] coins) {
        if (amount == 0) return 0;
        if (amount < 0)  return Integer.MAX_VALUE / 2; // Sentinel

        if (minMemo[amount] != -1) return minMemo[amount];

        int best = Integer.MAX_VALUE / 2;
        for (int coin : coins) {
            int sub = minCoins(amount - coin, coins);
            if (sub != Integer.MAX_VALUE / 2)
                best = Math.min(best, 1 + sub); // Branch for each coin
        }
        minMemo[amount] = best;
        return best;
    }

    // ===================== PARTITION PROBLEM =====================
    // Count ways to partition n into positive integers (order doesn't matter)
    // partition(n, max) = sum of partition(n-k, k) for k=1..min(n,max)

    static Map<String, Integer> partMemo = new HashMap<>();

    public static int partition(int n, int max) {
        if (n == 0) return 1;
        String key = n + "," + max;
        if (partMemo.containsKey(key)) return partMemo.get(key);

        int count = 0;
        for (int k = 1; k <= Math.min(n, max); k++) {
            count += partition(n - k, k); // Use part k, max future part = k
        }
        partMemo.put(key, count);
        return count;
    }

    public static void main(String[] args) {
        int[] coins = {1, 2, 5};

        System.out.println("Coin Change — Count Ways:");
        for (int amt : new int[]{1, 3, 5, 10}) {
            memo.clear();
            System.out.printf("  amount=%2d → %d ways%n", amt, countWays(amt, coins, 0));
        }

        System.out.println("\\nCoin Change — Min Coins:");
        for (int amt : new int[]{1, 3, 5, 11}) {
            minMemo = new int[amt + 1];
            Arrays.fill(minMemo, -1);
            int res = minCoins(amt, coins);
            System.out.printf("  amount=%2d → %d coins%n", amt,
                res == Integer.MAX_VALUE / 2 ? -1 : res);
        }

        System.out.println("\\nPartitions of n:");
        for (int n = 1; n <= 7; n++) {
            partMemo.clear();
            System.out.printf("  p(%d) = %d%n", n, partition(n, n));
        }
    }
}`,
      },
    ],
    table: {
      headers: ["Problem", "Recurrence", "Naive", "Optimized", "Technique"],
      rows: [
        ["Fibonacci", "f(n)=f(n-1)+f(n-2)", "O(2^n)", "O(n)", "Memoization"],
        ["Staircase (k steps)", "f(n)=Σf(n-i)", "O(k^n)", "O(n·k)", "Memoization"],
        ["Grid Paths", "f(i,j)=f(i+1,j)+f(i,j+1)", "O(2^(m+n))", "O(m·n)", "Memoization"],
        ["Coin Change (ways)", "f(a)=Σf(a-c)", "O(C^A)", "O(A·C)", "DP Table"],
        ["Integer Partition", "f(n,k)=Σf(n-i,i)", "O(n^n)", "O(n²)", "Memoization"],
      ],
    },
    warning: "Never use naive tree recursion in contests. Always memoize or convert to DP. fib(50) with naive recursion performs over 2 trillion operations!",
    tip: "Draw the recursion tree for small inputs (n=4 or n=5). Once you see the repeated nodes, you'll immediately know where to add memoization.",
  },
  {
    id: "recursion-advanced",
    title: "Advanced Recursive Problems",
    difficulty: "Hard",
    theory: [
      "Power Set generation, permutations, and combinations are the foundation of backtracking. These problems enumerate all possibilities systematically.",
      "String problems like reversing, palindrome checking, and pattern matching can elegantly use recursion.",
      "Exponentiation by squaring reduces O(n) multiplications to O(log n) — critical in competitive programming for modular exponentiation.",
      "The recursion-on-choice paradigm: at each step, make a choice (include/exclude, left/right), recurse on both options, and combine results.",
    ],
    code: [
      {
        title: "Power, Permutations & Subsets",
        language: "java",
        content: `import java.util.*;

public class AdvancedRecursion {
    
    // ==================== FAST EXPONENTIATION ====================
    // O(log n) time using repeated squaring
    // x^8 = x^4 * x^4 = (x^2)^2 * (x^2)^2 = ...
    
    public static long power(long base, long exp) {
        if (exp == 0) return 1;
        if (exp % 2 == 0) {
            long half = power(base, exp / 2);
            return half * half;                 // base^(2k) = (base^k)^2
        }
        return base * power(base, exp - 1);    // base^(2k+1) = base × base^(2k)
    }
    
    // Modular exponentiation (CRITICAL for CP — prevents overflow)
    public static long modPow(long base, long exp, long mod) {
        if (exp == 0) return 1;
        base %= mod;
        if (exp % 2 == 0) {
            long half = modPow(base, exp / 2, mod);
            return (half * half) % mod;
        }
        return (base * modPow(base, exp - 1, mod)) % mod;
    }
    
    // ==================== ALL SUBSETS / POWER SET ====================
    // For n elements, there are 2^n subsets
    // At each element: INCLUDE it or EXCLUDE it
    
    public static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        generateSubsets(nums, 0, new ArrayList<>(), result);
        return result;
    }
    
    private static void generateSubsets(int[] nums, int idx,
                                         List<Integer> current,
                                         List<List<Integer>> result) {
        result.add(new ArrayList<>(current)); // Add current subset (snapshot!)
        
        for (int i = idx; i < nums.length; i++) {
            current.add(nums[i]);             // INCLUDE nums[i]
            generateSubsets(nums, i + 1, current, result);
            current.remove(current.size() - 1); // EXCLUDE (backtrack)
        }
    }
    
    // ==================== ALL PERMUTATIONS ====================
    // n! permutations for n distinct elements
    
    public static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        generatePerms(nums, used, new ArrayList<>(), result);
        return result;
    }
    
    private static void generatePerms(int[] nums, boolean[] used,
                                       List<Integer> current,
                                       List<List<Integer>> result) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }
        
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            
            used[i] = true;
            current.add(nums[i]);
            generatePerms(nums, used, current, result);
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }
    
    // Permutations using SWAP technique (in-place, no extra space)
    public static void permSwap(int[] arr, int start, List<List<Integer>> result) {
        if (start == arr.length) {
            result.add(new ArrayList<>());
            for (int x : arr) result.get(result.size()-1).add(x);
            return;
        }
        for (int i = start; i < arr.length; i++) {
            swap(arr, start, i);                // Choose
            permSwap(arr, start + 1, result);   // Explore
            swap(arr, start, i);                // Unchoose (backtrack)
        }
    }
    
    private static void swap(int[] arr, int i, int j) {
        int t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    
    // ==================== STRING RECURSION ====================
    
    // Reverse a string recursively
    public static String reverse(String s) {
        if (s.length() <= 1) return s;
        return reverse(s.substring(1)) + s.charAt(0);
    }
    
    // Check palindrome recursively
    public static boolean isPalindrome(String s, int lo, int hi) {
        if (lo >= hi) return true;
        if (s.charAt(lo) != s.charAt(hi)) return false;
        return isPalindrome(s, lo + 1, hi - 1);
    }
    
    // Generate all valid parentheses combinations
    public static List<String> generateParentheses(int n) {
        List<String> result = new ArrayList<>();
        generateParens(n, 0, 0, new StringBuilder(), result);
        return result;
    }
    
    private static void generateParens(int n, int open, int close,
                                        StringBuilder sb, List<String> result) {
        if (sb.length() == 2 * n) {
            result.add(sb.toString());
            return;
        }
        if (open < n) {
            sb.append('(');
            generateParens(n, open + 1, close, sb, result);
            sb.deleteCharAt(sb.length() - 1);
        }
        if (close < open) {
            sb.append(')');
            generateParens(n, open, close + 1, sb, result);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
    
    public static void main(String[] args) {
        System.out.println("2^10 = " + power(2, 10));           // 1024
        System.out.println("2^10 mod 1000 = " + modPow(2, 10, 1000)); // 24
        
        System.out.println("\\nSubsets of {1,2,3}:");
        subsets(new int[]{1, 2, 3}).forEach(System.out::println);
        
        System.out.println("\\nPermutations of {1,2,3}:");
        permutations(new int[]{1, 2, 3}).forEach(System.out::println);
        
        System.out.println("\\nValid Parentheses n=3:");
        generateParentheses(3).forEach(System.out::println);
    }
}`,
      },
    ],
    tip: "modPow(base, exp, MOD) is one of the most used functions in competitive programming. Memorize it! Used in combinatorics, hashing, and cryptographic problems.",
  },
];
