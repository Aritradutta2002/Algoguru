import type { Diagram } from "./recursionContent";

/**
 * Diagram data for DSA content sections — keyed by ContentSection id.
 * Rendered by the shared DiagramRenderer (layers/hierarchy/flow/table-visual/graph).
 * Attached via `attachDiagrams()` in each content file.
 */
export const dsaVisualizations: Record<string, Diagram> = {
  // ── Stack & Queue ──
  "sq-stack-intro": {
    type: "flow",
    title: "Stack — LIFO Operations",
    direction: "vertical",
    data: [
      {
        label: "push(10) → top = 10",
        color: "primary",
        children: [{ label: "O(1) amortised — array or linked-list backed" }],
      },
      { label: "push(20) → top = 20", color: "info" },
      { label: "peek() → returns 20, top stays 20", color: "accent" },
      { label: "pop() → returns 20, new top = 10", color: "warning" },
      {
        label: "isEmpty() → true after both pops",
        color: "success",
        children: [{ label: "Call stack • expression evaluation • backtracking • undo • DFS" }],
      },
    ],
  },
  "sq-java-stack-api": {
    type: "table-visual",
    title: "Java Stack<E> vs Deque<E> as a Stack",
    data: [
      {
        label: "java.util.Stack<E>",
        color: "warning",
        children: [
          { label: "Extends Vector — synchronized: thread-safe but slow" },
          { label: "Allows random get(index) — breaks the stack abstraction" },
          { label: "Allows null elements" },
        ],
      },
      {
        label: "ArrayDeque<E> — preferred",
        color: "success",
        children: [
          { label: "Not synchronized — roughly 3x faster in practice" },
          { label: "push → addFirst • pop → removeFirst • peek → peekFirst" },
          { label: "Resizable circular array; doubles capacity when full" },
          { label: "Does NOT allow null elements" },
        ],
      },
      {
        label: "Thread-safe alternatives",
        color: "info",
        children: [
          { label: "ConcurrentLinkedDeque" },
          { label: "Explicit synchronization around a plain ArrayDeque" },
          { label: "Idiomatic: Deque<Integer> s = new ArrayDeque<>()" },
        ],
      },
    ],
  },
  "sq-queue-intro": {
    type: "flow",
    title: "Queue — FIFO Operations",
    direction: "vertical",
    data: [
      {
        label: "offer(10) → rear = 10, front = 10",
        color: "primary",
        children: [{ label: "All core operations O(1)" }],
      },
      { label: "offer(20) → rear = 20", color: "info" },
      { label: "offer(30) → rear = 30", color: "accent" },
      { label: "poll() → returns 10 (front), front = 20", color: "warning" },
      {
        label: "peek() → 20 without removing",
        color: "success",
        children: [{ label: "Circular array avoids the shifting problem of linear arrays" }],
      },
    ],
  },
  "sq-java-queue-api": {
    type: "table-visual",
    title: "Queue Method Groups in java.util",
    data: [
      {
        label: "Throwing variants",
        color: "warning",
        children: [
          { label: "add(e) — fails with an exception when the queue is full" },
          { label: "remove() / element() — throw when empty" },
        ],
      },
      {
        label: "Special-value variants — preferred",
        color: "success",
        children: [
          { label: "offer(e) — returns false on failure" },
          { label: "poll() — returns null when empty" },
          { label: "peek() — returns null when empty" },
        ],
      },
      {
        label: "Implementations",
        color: "info",
        children: [
          { label: "ArrayDeque — fastest general-purpose queue" },
          { label: "LinkedList — Queue + Deque, null allowed, pointer overhead" },
          { label: "PriorityQueue, ConcurrentLinkedQueue, LinkedBlockingQueue" },
        ],
      },
      {
        label: "Deque acting as a Queue",
        color: "accent",
        children: [
          { label: "offer(e) → addLast" },
          { label: "poll() → removeFirst" },
        ],
      },
    ],
  },
  "sq-balanced-parens": {
    type: "flow",
    title: "Balanced Parentheses — Stack Matching",
    direction: "vertical",
    data: [
      { label: "Scan \"(\" → push the opening bracket", color: "primary" },
      { label: "Scan \"[\" → push; the stack top is now the innermost opener", color: "info" },
      { label: "Scan \"]\" → top is \"[\" ✓ pop", color: "accent" },
      { label: "Scan \")\" → top is \"(\" ✓ pop → stack empty → valid", color: "success" },
      {
        label: "Mismatch or a leftover opener → invalid",
        color: "warning",
        children: [{ label: "HashMap gives O(1) bracket lookup; odd length is always invalid" }],
      },
    ],
  },
  "sq-nge": {
    type: "flow",
    title: "Monotonic Stack — Next Greater Element",
    direction: "vertical",
    data: [
      { label: "arr = [2, 1, 5, 3] • decreasing stack of indices starts empty", color: "muted" },
      { label: "i = 0: push index 0", color: "primary" },
      { label: "i = 1: arr[1] = 1 < 2 → push index 1", color: "info" },
      { label: "i = 2: 5 pops 1 and 0 → NGE(1) = 5, NGE(2) = 5, push 2", color: "accent" },
      { label: "i = 3: 3 < 5 → push index 3", color: "warning" },
      {
        label: "Leftover indices get −1\nEach index pushed/popped once → O(n)",
        color: "success",
        children: [{ label: "Circular variant: iterate over i % n twice" }],
      },
    ],
  },
  "sq-histogram": {
    type: "flow",
    title: "Largest Rectangle in Histogram",
    direction: "vertical",
    data: [
      { label: "heights = [2, 1, 5, 6, 2, 3]", color: "muted" },
      { label: "Increasing stack finds the nearest smaller bar on both sides", color: "primary" },
      { label: "Rectangle with height h[i] spans R[i] − L[i] − 1 bars", color: "info" },
      { label: "h[2] = 5 → L = 1, R = 4 → width 2 → area 10  (maximum)", color: "accent" },
      { label: "h[3] = 6 → width 1 → area 6", color: "warning" },
      {
        label: "Every bar pushed and popped exactly once → O(n)",
        color: "success",
        children: [{ label: "Sentinel bars of height 0 at both ends simplify edge cases" }],
      },
    ],
  },
  "sq-rain-water": {
    type: "table-visual",
    title: "Trapping Rain Water — Three Approaches",
    data: [
      {
        label: "Prefix max arrays",
        color: "info",
        children: [
          { label: "water[i] = min(maxLeft, maxRight) − height[i]" },
          { label: "O(n) time · O(n) space" },
        ],
      },
      {
        label: "Decreasing stack",
        color: "accent",
        children: [
          { label: "When a taller bar appears, pop and fill layer by layer" },
          { label: "Water is computed horizontally" },
          { label: "O(n) time · O(n) space" },
        ],
      },
      {
        label: "Two pointers ⭐ optimal",
        color: "success",
        children: [
          { label: "Always move the pointer on the smaller side" },
          { label: "That side's max is the true min(maxLeft, maxRight)" },
          { label: "Water computed vertically, column by column" },
          { label: "O(n) time · O(1) space" },
        ],
      },
    ],
  },
"sq-min-stack": {
    type: "table-visual",
    title: "Min Stack — O(1) getMin() Designs",
    data: [
      {
        label: "Two stacks — recommended",
        color: "primary",
        children: [
          { label: "mainStack holds every value" },
          { label: "minStack holds the running minimum at each level" },
          { label: "Push to minStack only when value ≤ current min" },
          { label: "getMin() = minStack.peek() → O(1)" },
        ],
      },
      {
        label: "Single stack with encoding",
        color: "accent",
        children: [
          { label: "Store 2·val − min when val < min" },
          { label: "On pop, decode previous min as 2·min − stored" },
          { label: "Saves space but risks integer overflow" },
        ],
      },
      {
        label: "Pattern extensions",
        color: "info",
        children: [
          { label: "Max Stack, Min Queue" },
          { label: "Sliding-window min/max problems" },
          { label: "Tests that you can maintain a stack invariant" },
        ],
      },
    ],
  },
  "sq-expression-eval": {
    type: "flow",
    title: "Expression Evaluation — Shunting Yard Pipeline",
    direction: "vertical",
    data: [
      { label: "Infix: A + B × C — needs precedence and parentheses", color: "primary" },
      { label: "Shunting Yard — operator stack, precedence + associativity", color: "info" },
      {
        label: "Postfix (RPN): A B C × + — no parentheses needed",
        color: "accent",
        children: [{ label: "Prefix (Polish): + A × B C — operators before operands" }],
      },
      { label: "Evaluate: push operands, on an operator pop two and push the result", color: "warning" },
      {
        label: "Result: 7 — single left-to-right pass",
        color: "success",
        children: [{ label: "Left-associative: pop equal precedence; right-associative (^): keep it" }],
      },
    ],
  },
  "sq-stack-queue-interop": {
    type: "table-visual",
    title: "Stack ↔ Queue Interop",
    data: [
      {
        label: "Stack using 2 queues",
        color: "primary",
        children: [
          { label: "push is the costly operation: enqueue to q2" },
          { label: "Move every element of q1 into q2, then swap q1 and q2" },
          { label: "pop/peek from q1 are O(1)" },
        ],
      },
      {
        label: "Stack using 1 queue",
        color: "info",
        children: [
          { label: "Enqueue the new element, then rotate the n−1 older ones" },
          { label: "Elegant and uses less space than the 2-queue version" },
        ],
      },
      {
        label: "Queue using 2 stacks ⭐",
        color: "success",
        children: [
          { label: "Push onto s1" },
          { label: "pop/peek: if s2 is empty, pour s1 into s2 (reverses order)" },
          { label: "Amortised O(1) — each element is moved at most twice" },
        ],
      },
    ],
  },
"sq-sliding-window-max": {
    type: "flow",
    title: "Monotonic Deque — Sliding Window Maximum",
    direction: "vertical",
    data: [
      {
        label: "Deque stores indices; the front is always the window maximum",
        color: "primary",
        children: [{ label: "Window size k, arr scanned left to right" }],
      },
      { label: "1. Drop the front while it is out of the window (index ≤ i − k)", color: "info" },
      { label: "2. Pop from the back while arr[back] ≤ arr[i] — never useful again", color: "accent" },
      { label: "3. Push i at the back → the deque stays decreasing", color: "warning" },
      {
        label: "Output arr[front] per window → O(n) total",
        color: "success",
        children: [{ label: "Also solves Sliding Window Minimum and Constrained Subsequence Sum" }],
      },
    ],
  },
  "sq-stock-span": {
    type: "flow",
    title: "Stock Span — Previous Greater Element",
    direction: "vertical",
    data: [
      { label: "span[i] = consecutive days with price ≤ price[i]", color: "primary" },
      { label: "prices = [100, 80, 60, 70, 60, 75, 85]", color: "muted" },
      { label: "Decreasing stack of indices; pop while price[top] ≤ today", color: "info" },
      { label: "span = i − stack.peek()  (i + 1 when the stack is empty)", color: "accent" },
      {
        label: "spans = [1, 1, 1, 2, 1, 4, 6]",
        color: "success",
        children: [{ label: "Online variant processes one price at a time" }],
      },
    ],
  },
  "sq-subarray-min-sum": {
    type: "flow",
    title: "Sum of Subarray Minimums — Contribution Technique",
    direction: "vertical",
    data: [
      { label: "For each arr[i], count the subarrays in which it is the minimum", color: "primary" },
      { label: "L = distance to the Previous Smaller, R = distance to the Next Smaller", color: "info" },
      { label: "contribution = arr[i] × L × R", color: "accent" },
      {
        label: "arr = [3, 1, 2, 4] → 3·1 + 1·6 + 2·2 + 4·1 = 17",
        color: "warning",
        children: [{ label: "Use < on one side and ≤ on the other so duplicates are not double-counted" }],
      },
      {
        label: "Total = Σ(arr[i] × L × R) mod 10^9 + 7 → O(n)",
        color: "success",
        children: [{ label: "Same pattern gives Sum of Subarray Maximums and Ranges" }],
      },
    ],
  },
  "sq-bfs-queue": {
    type: "graph",
    title: "BFS — Queue Explores Level by Level",
    data: {
      nodes: [
        { id: "1", label: "1", x: 50, y: 8, color: "primary" },
        { id: "2", label: "2", x: 25, y: 40, color: "info" },
        { id: "3", label: "3", x: 75, y: 40, color: "info" },
        { id: "4", label: "4", x: 10, y: 78, color: "success" },
        { id: "5", label: "5", x: 38, y: 78, color: "success" },
        { id: "6", label: "6", x: 78, y: 78, color: "success" },
      ],
      edges: [
        { from: "1", to: "2" },
        { from: "1", to: "3" },
        { from: "2", to: "4" },
        { from: "2", to: "5" },
        { from: "3", to: "6" },
      ],
      directed: false,
      highlightPath: ["1", "2", "5"],
    },
  },
"sq-dfs-stack": {
    type: "flow",
    title: "Iterative DFS — Explicit Stack",
    direction: "vertical",
    data: [
      { label: "push(1) → stack [1]", color: "primary" },
      { label: "pop 1, push its unvisited neighbours 2, 3 → [2, 3]", color: "info" },
      { label: "pop 3, push 6 → [2, 6]", color: "accent" },
      { label: "pop 6 → no new neighbours → [2]", color: "warning" },
      {
        label: "pop 2, push 4, 5 → LIFO dives to 5 first, not level by level",
        color: "success",
        children: [{ label: "Mark visited when popping to match recursive DFS" }],
      },
      {
        label: "Recursion → an explicit stack\nNo StackOverflowError on deep graphs",
        color: "muted",
        children: [{ label: "Inorder / preorder / postorder iterators use the same idea" }],
      },
    ],
  },
  "sq-monotonic-summary": {
    type: "table-visual",
    title: "Monotonic Stack — Four Variants",
    data: [
      {
        label: "Next Greater Element",
        color: "primary",
        children: [
          { label: "Decreasing stack, scan left → right" },
          { label: "Pop while top is smaller; the current element is the popped one's answer" },
        ],
      },
      {
        label: "Next Smaller Element",
        color: "info",
        children: [
          { label: "Increasing stack, scan left → right" },
          { label: "Powers Daily Temperatures-style problems" },
        ],
      },
      {
        label: "Previous Greater Element",
        color: "accent",
        children: [
          { label: "Decreasing stack" },
          { label: "Answer converted to distance → Stock Span" },
        ],
      },
      {
        label: "Previous Smaller Element",
        color: "success",
        children: [
          { label: "Increasing stack" },
          { label: "Left boundary for Largest Rectangle in Histogram" },
        ],
      },
      {
        label: "Why O(n)",
        color: "warning",
        children: [
          { label: "Every element is pushed once and popped at most once" },
          { label: "Store indices, not values — more flexible" },
        ],
      },
    ],
  },
  "sq-deque-dp": {
    type: "flow",
    title: "Deque-Optimised DP",
    direction: "vertical",
    data: [
      { label: "dp[i] = min/max(dp[j] + cost(j, i)) for j in [i − k, i − 1]", color: "primary" },
      { label: "Naive scan of the whole window → O(n·k)", color: "warning" },
      { label: "Keep only the best j in a monotonic deque — pop dominated candidates", color: "info" },
      { label: "Drop j < i − k from the front as the window slides", color: "accent" },
      {
        label: "Transition becomes O(1) → O(n) overall",
        color: "success",
        children: [
          { label: "Jump Game with cost • Constrained Subsequence Sum • Sliding Window Maximum" },
        ],
      },
    ],
  },
"sq-remove-k-digits": {
    type: "flow",
    title: "Remove K Digits — Greedy Monotonic Stack",
    direction: "vertical",
    data: [
      { label: "num = \"1432219\", k = 3", color: "muted" },
      { label: "For each digit: pop while stack top > digit and k > 0", color: "primary" },
      { label: "Each pop removes the leftmost peak — a digit larger than its successor", color: "info" },
      { label: "\"1432219\" → \"1219\" (removed 4, 3, 2)", color: "accent" },
      { label: "If k digits are still left, trim from the end — the stack is non-decreasing", color: "warning" },
      {
        label: "Strip leading zeros; return \"0\" if nothing remains",
        color: "success",
        children: [{ label: "Same greedy shape: Remove Duplicate Letters, Create Maximum Number" }],
      },
    ],
  },
  "sq-comparison": {
    type: "table-visual",
    title: "Stack vs Queue vs Deque vs Priority Queue",
    data: [
      {
        label: "Stack — LIFO",
        color: "primary",
        children: [
          { label: "Process the most recent element first" },
          { label: "Call stack, undo, DFS, expression parsing" },
        ],
      },
      {
        label: "Queue — FIFO",
        color: "info",
        children: [
          { label: "Process in arrival order" },
          { label: "BFS, task scheduling, buffering, sliding window" },
        ],
      },
      {
        label: "Deque — both ends",
        color: "accent",
        children: [
          { label: "Sliding window max/min, palindrome checks, work stealing" },
          { label: "Monotonic deque → range min/max optimisation" },
        ],
      },
      {
        label: "Priority Queue — best element",
        color: "success",
        children: [
          { label: "Not the newest nor the oldest, but the optimal by key" },
          { label: "Dijkstra, k-way merge, median finding" },
        ],
      },
      {
        label: "Problem → structure",
        color: "warning",
        children: [
          { label: "Matching / nesting → Stack" },
          { label: "Level-by-level or shortest path → Queue" },
          { label: "\"Next greater/smaller\" → Monotonic Stack" },
          { label: "DP with range min/max → Monotonic Deque" },
        ],
      },
    ],
  },
  // ── Strings ──
  "str-intro": {
    type: "flow",
    title: "String Building — String vs StringBuilder",
    direction: "horizontal",
    data: [
      {
        label: "String — immutable",
        color: "warning",
        children: [{ label: "Every modification creates a new object" }],
      },
      { label: "Concatenation in a loop → O(n²)", color: "accent" },
      {
        label: "StringBuilder.append",
        color: "primary",
        children: [{ label: "O(1) amortised append" }],
      },
      {
        label: "char[] via toCharArray()",
        color: "success",
        children: [{ label: "Character-level manipulation" }],
      },
    ],
  },
"str-palindrome": {
    type: "flow",
    title: "Manacher — Rightmost Palindrome Boundary",
    direction: "vertical",
    data: [
      { label: "d_odd[i] and d_even[i] = maximum radius of a palindrome centred at i", color: "primary" },
      { label: "Maintain the rightmost palindrome boundary [l, r)", color: "info" },
      { label: "If i < r → mirror j = l + (r − i), start with d[i] = min(d[j], r − i)", color: "accent" },
      { label: "Extend trivially while the characters match", color: "warning" },
      {
        label: "r only moves right → amortised O(1) per centre → O(n) overall",
        color: "success",
        children: [{ label: "Palindromes at one centre form a chain: l, l−2, l−4, …" }],
      },
      {
        label: "Alternative: string hashing + binary search → O(n log n)",
        color: "muted",
        children: [{ label: "Two-pointer check is O(n); expand-around-centre is O(n²)" }],
      },
    ],
  },
  "str-matching": {
    type: "flow",
    title: "KMP — Prefix Function and Fallbacks",
    direction: "vertical",
    data: [
      { label: "π[i] = longest proper prefix of s[0..i] that is also a suffix", color: "primary" },
      { label: "π('abcabcd') = [0, 0, 0, 1, 2, 3, 0]", color: "info" },
      { label: "π[i+1] ≤ π[i] + 1 — it grows by at most one per step", color: "accent" },
      { label: "On a mismatch: fall back to π[π[i] − 1] and compare again", color: "warning" },
      {
        label: "The text is never re-scanned → O(n + m) matching",
        color: "success",
        children: [{ label: "Each fallback lowers π, and π rises at most n times → O(n)" }],
      },
      {
        label: "Shortest period = n − π[n−1] when n is divisible by it",
        color: "muted",
        children: [{ label: "Also counts prefix occurrences and distinct substrings" }],
      },
    ],
  },
  "str-rabin-karp": {
    type: "flow",
    title: "Rabin-Karp — Rolling / Prefix Hash",
    direction: "vertical",
    data: [
      { label: "hash(s) = s[0]·p⁰ + s[1]·p¹ + … + s[n−1]·pⁿ⁻¹ mod m", color: "primary" },
      { label: "p = 31 for lowercase, 53 for mixed case; m = 10^9 + 9", color: "muted" },
      { label: "Precompute prefix hashes → hash(s[l..r]) in O(1)", color: "info" },
      { label: "Compare the pattern hash with every window → O(n + m) average", color: "accent" },
      { label: "A hash hit can be a collision (~1/m) → verify characters", color: "warning" },
      {
        label: "Double hashing → collision ~1/m² ≈ 10⁻¹⁸",
        color: "success",
        children: [{ label: "Multi-pattern matching, distinct substrings of length k, longest duplicate" }],
      },
    ],
  },
"str-z-algo": {
    type: "flow",
    title: "Z-Function — Reuse the Rightmost Match",
    direction: "vertical",
    data: [
      { label: "z[i] = length of the longest prefix of s starting at i (z[0] = 0)", color: "primary" },
      { label: "z('aaabaab') = [0, 2, 1, 0, 2, 1, 0]", color: "info" },
      { label: "Maintain the rightmost matched segment [l, r)", color: "accent" },
      { label: "If i < r → z[i] = min(r − i, z[i − l]), then extend trivially", color: "warning" },
      { label: "Each character is compared at most twice → O(n)", color: "success" },
      {
        label: "Pattern matching: run Z on P + '$' + T; matches where z[i] = |P|",
        color: "muted",
        children: [{ label: "Z-function and the prefix function are equivalent in power" }],
      },
    ],
  },
  "str-trie": {
    type: "hierarchy",
    title: "Trie (Prefix Tree) — cat, car, dog, dot",
    data: [
      {
        label: "root — insert O(m) · search O(m) · prefix search O(m)",
        color: "muted",
        children: [
          {
            label: "c",
            color: "primary",
            children: [
              {
                label: "ca — shared prefix of 2 words",
                color: "info",
                children: [
                  { label: "cat — isEnd = true", color: "success" },
                  { label: "car — isEnd = true", color: "success" },
                ],
              },
            ],
          },
          {
            label: "d",
            color: "accent",
            children: [
              {
                label: "do — shared prefix of 2 words",
                color: "info",
                children: [
                  { label: "dog — isEnd = true", color: "success" },
                  { label: "dot — isEnd = true", color: "success" },
                ],
              },
            ],
          },
        ],
      },
      {
        label: "Uses — autocomplete, spell checking, longest common prefix",
        color: "warning",
        children: [{ label: "Binary trie over bits → maximum XOR pair", color: "primary" }],
      },
    ],
  },
  "str-hashing": {
    type: "flow",
    title: "Polynomial String Hashing",
    direction: "vertical",
    data: [
      { label: "hash(s) = Σ s[i]·pⁱ mod m", color: "primary" },
      { label: "p ≥ alphabet size: 31 for lowercase, 53 for mixed case", color: "info" },
      { label: "m a large prime: 10^9 + 7 or 10^9 + 9", color: "muted" },
      { label: "h[i+1] = (h[i]·p + s[i]) mod m → O(n) preprocessing", color: "accent" },
      { label: "hash(s[l..r]) = (h[r+1] − h[l]·p^(r−l+1)) mod m → O(1) query", color: "warning" },
      {
        label: "Double hashing: (31, 10^9+7) + (37, 10^9+9) → collision ~10⁻¹⁸",
        color: "success",
        children: [{ label: "Never use BASE = 1 or a power-of-two MOD — easily hacked" }],
      },
    ],
  },
"str-sliding-window": {
    type: "table-visual",
    title: "Sliding Window on Strings",
    data: [
      {
        label: "Fixed-size window",
        color: "primary",
        children: [
          { label: "Both ends move together, length k is constant" },
          { label: "Example: find all anagrams of p in s" },
        ],
      },
      {
        label: "Variable-size window",
        color: "accent",
        children: [
          { label: "Expand r, then shrink l while the condition breaks" },
          { label: "Example: longest substring without repeating characters" },
        ],
      },
      {
        label: "Window state",
        color: "info",
        children: [
          { label: "Frequency array of size 26 (128 for full ASCII)" },
          { label: "Adding s[r] and removing s[l] is O(1) each" },
          { label: "Window is valid ⇒ every inner window is valid" },
        ],
      },
    ],
  },
  "str-anagram": {
    type: "table-visual",
    title: "Anagram Detection Techniques",
    data: [
      {
        label: "Frequency count",
        color: "primary",
        children: [
          { label: "count[26] for 'a'..'z'" },
          { label: "Equal arrays → anagrams, O(n) time" },
        ],
      },
      {
        label: "Frequency difference array ⭐",
        color: "accent",
        children: [
          { label: "Increment for the first string, decrement for the second" },
          { label: "All counters 0 → anagrams" },
          { label: "Sliding window: update on entry/exit, track the non-zero count" },
        ],
      },
      {
        label: "Sorting",
        color: "muted",
        children: [
          { label: "Sort both strings and compare — O(n log n)" },
          { label: "Simple, but slower than counting" },
        ],
      },
    ],
  },
  "str-subsequence": {
    type: "flow",
    title: "Subsequence — Two-Pointer Check",
    direction: "vertical",
    data: [
      { label: "A subsequence deletes characters but keeps the relative order", color: "primary" },
      { label: "i walks the string s, j walks the pattern p", color: "info" },
      { label: "Match → advance both; mismatch → advance i only", color: "accent" },
      { label: "j = |p| at the end → p is a subsequence → O(n)", color: "success" },
      {
        label: "Longest Common Subsequence → 2-D DP, O(n·m)",
        color: "warning",
        children: [{ label: "Count distinct subsequences → DP with last-occurrence dedup" }],
      },
    ],
  },
  "str-suffix": {
    type: "flow",
    title: "Suffix Array + LCP (Kasai)",
    direction: "vertical",
    data: [
      { label: "Suffix array = start indices of all suffixes, sorted lexicographically", color: "primary" },
      { label: "Doubling: sort by 1 char, then 2, 4, 8 … reusing previous ranks", color: "info" },
      { label: "O(n log²n) with comparison sort · O(n log n) with radix sort", color: "muted" },
      { label: "lcp[i] = LCP of sa[i] and sa[i−1]", color: "accent" },
      { label: "Kasai: lcp at i+1 is at least h − 1, where h is the lcp at i → O(n)", color: "warning" },
      {
        label: "Distinct substrings = n(n+1)/2 − Σ lcp[i]",
        color: "success",
        children: [{ label: "Longest repeated substring = max(lcp); pattern search O(m log n)" }],
      },
    ],
  },
  "str-advanced": {
    type: "table-visual",
    title: "Advanced String Structures",
    data: [
      {
        label: "Aho-Corasick",
        color: "primary",
        children: [
          { label: "Multi-pattern matching over a trie of all patterns" },
          { label: "Suffix links added by BFS — a KMP failure function on a trie" },
          { label: "Build O(m·k) · text scan O(n + matches)" },
          { label: "Dictionary suffix links report every pattern that ends here" },
        ],
      },
      {
        label: "Suffix Automaton",
        color: "accent",
        children: [
          { label: "Represents ALL substrings in O(n) space" },
          { label: "At most 2n − 1 states and 3n − 4 transitions" },
          { label: "Distinct substrings, longest common substring, substring tests" },
        ],
      },
      {
        label: "Palindromic Tree (Eertree)",
        color: "info",
        children: [
          { label: "All distinct palindromic substrings in O(n) space" },
          { label: "Online construction — add characters one by one" },
          { label: "Counts palindromic substrings ending at each position" },
        ],
      },
    ],
  },
// ── Bit Manipulation ──
  "bits-intro": {
    type: "table-visual",
    title: "Number Representation in Java",
    data: [
      {
        label: "Binary (base 2)",
        color: "primary",
        children: [
          { label: "Each position is a power of 2: 1, 2, 4, 8, 16, 32, …" },
          { label: "1011₂ = 8 + 0 + 2 + 1 = 11" },
          { label: "MSB = leftmost bit · LSB = rightmost bit" },
        ],
      },
      {
        label: "Java type sizes",
        color: "info",
        children: [
          { label: "byte 8 bits · int 32 bits · long 64 bits" },
          { label: "int: −2³¹ to 2³¹−1 · long: −2⁶³ to 2⁶³−1" },
          { label: "Values above ~2×10⁹ need long (1L << 40)" },
        ],
      },
      {
        label: "Two's complement",
        color: "accent",
        children: [
          { label: "MSB is the sign bit: 0 positive, 1 negative" },
          { label: "Negate = flip all bits and add 1" },
          { label: "Unsigned right shift uses >>>" },
        ],
      },
    ],
  },
  "bits-operators": {
    type: "table-visual",
    title: "Bitwise Operators",
    data: [
      {
        label: "AND &",
        color: "primary",
        children: [
          { label: "1 only when both bits are 1" },
          { label: "1010 & 1100 = 1000" },
          { label: "Masking and bit checking" },
        ],
      },
      {
        label: "OR |",
        color: "info",
        children: [
          { label: "1 when at least one bit is 1" },
          { label: "1010 | 1100 = 1110" },
          { label: "Setting bits, combining flags" },
        ],
      },
      {
        label: "XOR ^",
        color: "accent",
        children: [
          { label: "1 when the bits differ" },
          { label: "1010 ^ 1100 = 0110" },
          { label: "Toggling; a ^ a = 0, a ^ 0 = a" },
        ],
      },
      {
        label: "NOT ~",
        color: "warning",
        children: [
          { label: "Inverts every bit" },
          { label: "~n = −(n + 1) in two's complement" },
        ],
      },
      {
        label: "Shifts",
        color: "success",
        children: [
          { label: "<< n multiplies by 2ⁿ — 5 << 2 = 20" },
          { label: ">> n arithmetic divide by 2ⁿ, keeps the sign" },
          { label: ">>> n always fills with 0" },
          { label: "Trap: write (a & b) == 0, not a & b == 0" },
        ],
      },
    ],
  },
"bits-tricks": {
    type: "table-visual",
    title: "Bit Tricks Cheat-Sheet",
    data: [
      {
        label: "Set / clear / toggle / check",
        color: "primary",
        children: [
          { label: "Set bit i: n | (1 << i)" },
          { label: "Clear bit i: n & ~(1 << i)" },
          { label: "Toggle bit i: n ^ (1 << i)" },
          { label: "Check bit i: (n >> i) & 1" },
        ],
      },
      {
        label: "Kernighan's algorithm",
        color: "accent",
        children: [
          { label: "n & (n − 1) clears the lowest set bit" },
          { label: "Repeat until n = 0 → O(k) for k set bits, not O(32)" },
        ],
      },
      {
        label: "Isolate the lowest set bit",
        color: "success",
        children: [
          { label: "n & (−n)" },
          { label: "Navigates Fenwick trees (Binary Indexed Trees)" },
        ],
      },
      {
        label: "Power-of-two test",
        color: "info",
        children: [{ label: "n > 0 && (n & (n − 1)) == 0" }],
      },
    ],
  },
  "bits-masking": {
    type: "table-visual",
    title: "Bitmask as a Set",
    data: [
      {
        label: "Encoding",
        color: "primary",
        children: [
          { label: "Bit i set ⇒ element i is in the subset" },
          { label: "Empty set = 0 · full set = (1 << n) − 1" },
          { label: "int covers n ≤ 30, long covers n ≤ 62" },
        ],
      },
      {
        label: "Set operations",
        color: "info",
        children: [
          { label: "Union: mask1 | mask2" },
          { label: "Intersection: mask1 & mask2" },
          { label: "Difference: mask1 & ~mask2" },
          { label: "Symmetric difference: mask1 ^ mask2" },
          { label: "Complement: ~mask & ((1 << n) − 1)" },
        ],
      },
      {
        label: "Element operations",
        color: "accent",
        children: [
          { label: "Add: mask | (1 << i)" },
          { label: "Remove: mask & ~(1 << i)" },
          { label: "Check: (mask & (1 << i)) != 0" },
          { label: "Size: Integer.bitCount(mask)" },
          { label: "All subsets: for (mask = 0; mask < (1 << n); mask++)" },
        ],
      },
      {
        label: "Why it matters",
        color: "success",
        children: [
          { label: "O(1) set operations instead of O(n)" },
          { label: "DP states: TSP dp[mask][i] = cost to visit mask, ending at i" },
          { label: "Permission flags, feature toggles, compact sets" },
        ],
      },
    ],
  },
"bits-xor": {
    type: "table-visual",
    title: "XOR Properties & Applications",
    data: [
      {
        label: "Algebraic laws",
        color: "primary",
        children: [
          { label: "Self-inverse: a ^ a = 0" },
          { label: "Identity: a ^ 0 = a" },
          { label: "Commutative and associative — order does not matter" },
          { label: "Invertible: a ^ b = c ⇒ b = a ^ c, a = b ^ c" },
        ],
      },
      {
        label: "Killer applications",
        color: "accent",
        children: [
          { label: "XOR all elements → the one appearing once survives" },
          { label: "Two unique values: XOR all, then partition by a distinguishing bit" },
          { label: "No carries → no overflow like addition" },
        ],
      },
      {
        label: "XOR from 1 to N in O(1)",
        color: "info",
        children: [
          { label: "N % 4 == 0 → N" },
          { label: "N % 4 == 1 → 1" },
          { label: "N % 4 == 2 → N + 1" },
          { label: "N % 4 == 3 → 0" },
        ],
      },
    ],
  },
  "bits-counting": {
    type: "table-visual",
    title: "Counting Set Bits (popcount)",
    data: [
      {
        label: "Naive scan",
        color: "muted",
        children: [{ label: "Test all 32 bit positions — O(32)" }],
      },
      {
        label: "Kernighan's algorithm",
        color: "primary",
        children: [
          { label: "n & (n − 1) clears the lowest set bit" },
          { label: "Loop until 0 → O(k), k = number of set bits" },
        ],
      },
      {
        label: "Lookup table",
        color: "info",
        children: [{ label: "O(1) per query after O(2¹⁶) preprocessing" }],
      },
      {
        label: "Integer.bitCount()",
        color: "success",
        children: [{ label: "Bit-parallel algorithm → O(1)" }],
      },
      {
        label: "DP for all 0..n ⭐",
        color: "accent",
        children: [
          { label: "bits[i] = bits[i >> 1] + (i & 1)" },
          { label: "O(n) for the entire range (LeetCode 338)" },
          { label: "Hamming distance = Integer.bitCount(a ^ b)" },
        ],
      },
    ],
  },
"bits-cp": {
    type: "flow",
    title: "Bit Techniques in Competitive Programming",
    direction: "vertical",
    data: [
      { label: "Maximum XOR pair/subarray → binary Trie, MSB → LSB greedy", color: "primary" },
      { label: "prefixXOR[i] = a[0] ^ a[1] ^ … ^ a[i−1]", color: "info" },
      { label: "XOR of [L, R] = prefixXOR[R+1] ^ prefixXOR[L] → O(1) after O(n)", color: "accent" },
      { label: "Range AND = common binary prefix of L and R, remaining bits zeroed", color: "warning" },
      { label: "Range OR keeps bits set in ANY number of the range", color: "muted" },
      {
        label: "Trie of n numbers needs ≤ n × 31 nodes",
        color: "success",
        children: [{ label: "Bit contribution: analyse each of the 32 bits independently" }],
      },
    ],
  },
  "bits-bitmask-dp": {
    type: "flow",
    title: "Bitmask DP — TSP Style",
    direction: "vertical",
    data: [
      { label: "State: dp[mask][i] = min cost to visit the cities in mask, ending at i", color: "primary" },
      { label: "Transition: extend to an unvisited city j and pay cost(i, j)", color: "info" },
      { label: "State space 2ⁿ × n · total complexity O(2ⁿ × n²)", color: "accent" },
      { label: "Enumerate submasks: for (s = m; s > 0; s = (s − 1) & m)", color: "warning" },
      { label: "All submasks of all masks cost O(3ⁿ) in total", color: "success" },
      {
        label: "Feasible for n ≤ 20–22 only",
        color: "muted",
        children: [{ label: "n = 20 → ~20 million states, about one second" }],
      },
    ],
  },
  "bits-advanced": {
    type: "table-visual",
    title: "Advanced Bit Techniques",
    data: [
      {
        label: "Gosper's Hack",
        color: "primary",
        children: [
          { label: "Iterate all masks with exactly k bits set, ascending" },
          { label: "Move the highest bit of the trailing block left, push the rest down" },
          { label: "Visits C(n, k) masks instead of 2ⁿ" },
        ],
      },
      {
        label: "Gray Code",
        color: "accent",
        children: [
          { label: "Consecutive values differ in exactly one bit" },
          { label: "g(i) = i ^ (i >> 1)" },
          { label: "Used in combinatorics and error correction" },
        ],
      },
      {
        label: "Sum over Subsets (SOS) DP",
        color: "info",
        children: [
          { label: "Aggregate over all submasks of every mask" },
          { label: "O(n × 2ⁿ) instead of the naive O(3ⁿ)" },
          { label: "A multi-dimensional prefix sum over bit dimensions" },
        ],
      },
      {
        label: "Bitboards",
        color: "success",
        children: [
          { label: "One 64-bit integer = one square per bit" },
          { label: "Chess / checkers / Othello move generation by bitwise ops" },
          { label: "Bit-parallel: 64 bits processed at once" },
        ],
      },
    ],
  },
"bits-practice": {
    type: "table-visual",
    title: "Bit Problems — Pattern Recognition",
    data: [
      {
        label: "Pick the technique",
        color: "primary",
        children: [
          { label: "'Find unique / missing element' → XOR everything" },
          { label: "'Two unique elements' → XOR all, then partition by a distinguishing bit" },
          { label: "'Enumerate subsets' → bitmask iteration · size k → Gosper's Hack" },
          { label: "'Optimise over subsets' → bitmask DP or SOS DP" },
        ],
      },
      {
        label: "More patterns",
        color: "accent",
        children: [
          { label: "'Maximum XOR' → binary Trie" },
          { label: "'Small n (≤ 20)' → bitmask DP (TSP-style)" },
          { label: "'Range bitwise queries' → common prefix or segment tree" },
          { label: "'Count contributions' → bit-by-bit analysis" },
        ],
      },
      {
        label: "When you get stuck",
        color: "info",
        children: [
          { label: "Can each bit be solved independently?" },
          { label: "Is there an XOR cancellation to exploit?" },
          { label: "Is n small enough for bitmask DP?" },
        ],
      },
    ],
  },
  // ── Backtracking ──
  "bt-intro": {
    type: "flow",
    title: "Backtracking — Choose · Explore · Unchoose",
    direction: "vertical",
    data: [
      { label: "Choose — make a decision", color: "primary" },
      { label: "Explore — recurse deeper into the decision tree", color: "info" },
      { label: "Unchoose — undo the decision (the actual backtrack)", color: "accent" },
      { label: "Dead end → abandon the whole branch", color: "warning" },
      {
        label: "Prune before recursing, never after",
        color: "success",
        children: [{ label: "DFS + constraint checking + state restoration" }],
      },
      {
        label: "Typical cost O(n!) or O(2ⁿ) before pruning",
        color: "muted",
        children: [{ label: "Common bug: state not restored after recursion" }],
      },
    ],
  },
  "bt-nqueens": {
    type: "flow",
    title: "N-Queens — One Queen per Row",
    direction: "vertical",
    data: [
      { label: "Exactly one queen per row → the only decision is the column", color: "primary" },
      { label: "Constraint 1: no two queens share a column", color: "info" },
      { label: "Constraint 2: no main diagonal clash → row − col is constant", color: "accent" },
      { label: "Constraint 3: no anti-diagonal clash → row + col is constant", color: "warning" },
      {
        label: "Bitmasks test all three constraints in O(1)",
        color: "success",
        children: [{ label: "Recurse to the next row on success, undo otherwise" }],
      },
    ],
  },
"bt-sudoku": {
    type: "flow",
    title: "Sudoku Solver — Try, Recurse, Backtrack",
    direction: "vertical",
    data: [
      { label: "Find an empty cell", color: "primary" },
      { label: "Try digits 1–9: valid if absent from its row, column and 3×3 box", color: "info" },
      { label: "Place the digit and recurse", color: "accent" },
      { label: "No digit fits → undo the cell and return false", color: "warning" },
      { label: "Boolean arrays for row / col / box give O(1) validity checks", color: "success" },
      {
        label: "Prune harder: Most Constrained Variable heuristic",
        color: "muted",
        children: [{ label: "Always solve the cell with the fewest candidates first" }],
      },
    ],
  },
  "bt-subsets": {
    type: "table-visual",
    title: "Subsets, Permutations, Combinations",
    data: [
      {
        label: "Subsets (power set)",
        color: "primary",
        children: [
          { label: "Each element: include or exclude" },
          { label: "2ⁿ subsets for n elements" },
        ],
      },
      {
        label: "Permutations",
        color: "accent",
        children: [
          { label: "Fill one position at a time from the unused elements" },
          { label: "n! arrangements" },
        ],
      },
      {
        label: "Combinations C(n, r)",
        color: "info",
        children: [
          { label: "n! / (r! × (n − r)!) — order does not matter" },
          { label: "Choose r from n" },
        ],
      },
      {
        label: "Handling duplicates",
        color: "warning",
        children: [
          { label: "Sort the array first" },
          { label: "Skip an element equal to the previous one at the same recursion level" },
          { label: "…and only when the previous copy was not used" },
        ],
      },
    ],
  },
  "bt-maze": {
    type: "flow",
    title: "Rat in a Maze",
    direction: "vertical",
    data: [
      { label: "Start (0, 0) → target (N−1, N−1)", color: "primary" },
      { label: "1 = passable cell, 0 = blocked", color: "muted" },
      { label: "Try Down / Left / Right / Up and recurse on passable cells", color: "info" },
      { label: "Stuck → backtrack and try the next direction", color: "warning" },
      { label: "A visited array prevents revisiting cells and infinite loops", color: "success" },
      { label: "Unmark on the way back so later paths may reuse the cell", color: "accent" },
    ],
  },
  "bt-coloring": {
    type: "flow",
    title: "Graph Coloring & Hamiltonian Path",
    direction: "vertical",
    data: [
      { label: "Colour every vertex with at most m colours", color: "primary" },
      { label: "No two adjacent vertices may share a colour", color: "info" },
      { label: "Per vertex try each colour, recurse when no neighbour conflicts", color: "accent" },
      { label: "Chromatic number = the smallest feasible m", color: "muted" },
      { label: "Hamiltonian path visits every vertex exactly once", color: "warning" },
      {
        label: "Hamiltonian circuit returns to the start vertex",
        color: "success",
        children: [{ label: "Both are NP-hard → backtracking plus aggressive pruning" }],
      },
    ],
  },
"bt-wordsearch": {
    type: "flow",
    title: "Word Search on a Grid",
    direction: "vertical",
    data: [
      { label: "Start from every cell that matches word[0]", color: "primary" },
      { label: "Explore the 4 adjacent cells (horizontal / vertical)", color: "info" },
      { label: "Each cell may be used at most once per path", color: "muted" },
      { label: "Mark in place (e.g. '#') to avoid a separate visited array", color: "accent" },
      { label: "Restore the character while backtracking", color: "warning" },
      {
        label: "Word Search II: a Trie prunes the moment no dictionary word shares the prefix",
        color: "success",
        children: [{ label: "In-place marking keeps space at O(1) extra" }],
      },
    ],
  },
  "bt-knights-tour": {
    type: "flow",
    title: "Knight's Tour",
    direction: "vertical",
    data: [
      { label: "Visit every square exactly once with L-shaped moves", color: "primary" },
      { label: "2 squares in one direction, 1 in the perpendicular", color: "info" },
      { label: "8 candidate moves from each square", color: "accent" },
      { label: "Brute-force backtracking explodes on an 8×8 board", color: "warning" },
      { label: "Warnsdorff's rule: move to the square with the fewest onward moves", color: "success" },
      {
        label: "Nearly O(N²) in practice — almost no backtracking needed",
        color: "muted",
        children: [{ label: "A closed tour = Hamiltonian circuit on the knight's graph" }],
      },
    ],
  },
  "bt-phone-letter": {
    type: "flow",
    title: "Phone Keypad Letter Combinations",
    direction: "vertical",
    data: [
      { label: "Digits 2–9 map to letters (2 → abc, 3 → def, … 9 → wxyz)", color: "primary" },
      { label: "Depth = number of digits, branching factor 3–4", color: "info" },
      { label: "For each digit, branch into every mapped letter", color: "accent" },
      { label: "At full depth the current string is one combination", color: "success" },
      {
        label: "BFS variant: repeatedly expand a queue of prefixes digit by digit",
        color: "muted",
        children: [{ label: "Backtracking explores the same tree depth-first" }],
      },
    ],
  },
"bt-palindrome-partition": {
    type: "flow",
    title: "Palindrome Partitioning",
    direction: "vertical",
    data: [
      { label: "At each position try every prefix of the remaining suffix", color: "primary" },
      { label: "Prefix is a palindrome → keep it and recurse on the rest", color: "info" },
      { label: "Suffix exhausted → the current partition is a valid answer", color: "success" },
      { label: "Precompute isPalin[i][j] with DP → O(1) palindrome checks", color: "accent" },
      {
        label: "Without the table every check costs O(N)",
        color: "warning",
        children: [{ label: "Classic string manipulation + backtracking combination" }],
      },
    ],
  },
  "bt-generate-parens": {
    type: "flow",
    title: "Generate Parentheses — Two Pruning Rules",
    direction: "vertical",
    data: [
      { label: "Place '(' whenever open < n", color: "primary" },
      { label: "Place ')' only while close < open", color: "info" },
      { label: "open = close = n → the string is well formed", color: "success" },
      {
        label: "The two conditions prune every invalid prefix",
        color: "accent",
        children: [{ label: "They define the shape of the search tree itself" }],
      },
      {
        label: "Count of valid strings = Catalan number",
        color: "muted",
        children: [{ label: "C(n) = (2n)! / ((n+1)! × n!)" }],
      },
    ],
  },
  "bt-word-break": {
    type: "flow",
    title: "Word Break II — Backtracking + Memoisation",
    direction: "vertical",
    data: [
      { label: "At index i, try every dictionary word that matches the prefix", color: "primary" },
      { label: "Match → recurse from i + word.length()", color: "info" },
      { label: "Index reaches the end → the chosen words form one sentence", color: "success" },
      { label: "HashSet dictionary → O(1) word lookup", color: "accent" },
      {
        label: "Memoise the sentences reachable from each index",
        color: "warning",
        children: [{ label: "Avoids recomputing overlapping subproblems" }],
      },
      { label: "Word Break I (existence only) needs DP alone, O(N²)", color: "muted" },
    ],
  },
// ── Trees ──
  "tree-traversal": {
    type: "flow",
    title: "Tree Traversals — Three DFS Orders + BFS",
    direction: "horizontal",
    data: [
      {
        label: "Inorder\nLeft · Root · Right",
        color: "primary",
        children: [{ label: "Sorted order on a BST" }],
      },
      {
        label: "Preorder\nRoot · Left · Right",
        color: "info",
        children: [{ label: "Uniquely identifies the structure" }],
      },
      {
        label: "Postorder\nLeft · Right · Root",
        color: "accent",
        children: [{ label: "Children before parents" }],
      },
      {
        label: "Level-order",
        color: "success",
        children: [{ label: "BFS with a queue, level by level" }],
      },
    ],
  },
  "tree-properties": {
    type: "table-visual",
    title: "Tree Properties from a Single DFS",
    data: [
      {
        label: "Height",
        color: "primary",
        children: [
          { label: "1 + max(height(left), height(right))" },
          { label: "Height of a leaf is 0" },
        ],
      },
      {
        label: "Size",
        color: "info",
        children: [{ label: "1 + size(left) + size(right)" }],
      },
      {
        label: "Diameter",
        color: "accent",
        children: [
          { label: "Longest path between any two nodes" },
          { label: "Per node: leftHeight + rightHeight" },
          { label: "Maximum over all nodes" },
        ],
      },
      {
        label: "One pass is enough",
        color: "success",
        children: [
          { label: "Every node merges its children's results" },
          { label: "O(n) time · O(h) recursion stack" },
        ],
      },
    ],
  },
  "tree-bst": {
    type: "flow",
    title: "Binary Search Tree Operations",
    direction: "vertical",
    data: [
      { label: "Invariant: left subtree < root < right subtree", color: "primary" },
      { label: "Search — go left or right at each node → O(h)", color: "info" },
      { label: "Insert — descend to a null child and attach → O(h)", color: "accent" },
      { label: "Delete — with two children, replace by in-order successor", color: "warning" },
      {
        label: "Balanced h = O(log n) · skewed h = O(n)",
        color: "success",
        children: [{ label: "Validation: the inorder walk must be strictly increasing" }],
      },
    ],
  },
  "tree-lca": {
    type: "graph",
    title: "LCA — Path from 4 to 7 Meets at 1",
    data: {
      nodes: [
        { id: "1", x: 50, y: 6, color: "primary" },
        { id: "2", x: 24, y: 38, color: "info" },
        { id: "3", x: 76, y: 38, color: "info" },
        { id: "4", x: 10, y: 76, color: "accent" },
        { id: "5", x: 38, y: 76, color: "muted" },
        { id: "6", x: 62, y: 76, color: "muted" },
        { id: "7", x: 90, y: 76, color: "accent" },
      ],
      edges: [
        { from: "1", to: "2" },
        { from: "1", to: "3" },
        { from: "2", to: "4" },
        { from: "2", to: "5" },
        { from: "3", to: "6" },
        { from: "3", to: "7" },
      ],
      directed: false,
      highlightPath: ["4", "2", "1", "3", "7"],
    },
  },
"tree-dfs-techniques": {
    type: "flow",
    title: "DFS on Trees — Subtree Queries",
    direction: "vertical",
    data: [
      { label: "Subtree sum / size — merge children bottom-up in one DFS", color: "primary" },
      { label: "Euler tour flattens the tree into an array", color: "info" },
      { label: "A subtree becomes one contiguous range [tin[v], tout[v]]", color: "accent" },
      { label: "Range queries then use a segment tree or Fenwick tree", color: "warning" },
      { label: "Path queries — LCA + prefix sums, or Euler tour + segment tree", color: "success" },
      { label: "Rerooting — recompute the answers when the root changes", color: "muted" },
    ],
  },
  "tree-construction": {
    type: "flow",
    title: "Rebuild a Tree from Traversals",
    direction: "vertical",
    data: [
      { label: "Preorder + Inorder → unique tree", color: "primary" },
      { label: "The first preorder element is the root", color: "info" },
      { label: "Locate the root in inorder → left and right subtree sizes", color: "accent" },
      { label: "Recurse on both halves with the matching preorder slices", color: "warning" },
      { label: "Postorder + Inorder → unique tree (last postorder element is the root)", color: "success" },
      {
        label: "Preorder + Postorder alone cannot uniquely determine the tree",
        color: "muted",
        children: [{ label: "Unless the tree is a full binary tree" }],
      },
    ],
  },
  "tree-views": {
    type: "table-visual",
    title: "Tree Views",
    data: [
      {
        label: "Left view",
        color: "primary",
        children: [
          { label: "First (leftmost) node at each level" },
          { label: "Level-order walk, take the first node per level" },
        ],
      },
      {
        label: "Right view",
        color: "accent",
        children: [
          { label: "Last (rightmost) node at each level" },
          { label: "Level-order walk, take the last node per level" },
        ],
      },
      {
        label: "Top view",
        color: "info",
        children: [
          { label: "First node seen at each horizontal distance from the root" },
          { label: "Track the horizontal distance while traversing" },
        ],
      },
      {
        label: "Bottom view",
        color: "success",
        children: [
          { label: "Last node seen at each horizontal distance" },
          { label: "Later levels overwrite earlier ones" },
        ],
      },
    ],
  },
"tree-path-sum": {
    type: "flow",
    title: "Path Sum Patterns",
    direction: "vertical",
    data: [
      { label: "Root-to-leaf: DFS with a running sum, verify at the leaves", color: "primary" },
      { label: "Any node to any node: return the best downward gain to the parent", color: "info" },
      { label: "Count paths with a target sum: prefix sums of the root path in a HashMap", color: "accent" },
      {
        label: "Seed the map with {0: 1} so root-to-node paths count",
        color: "warning",
        children: [{ label: "Store how many times each prefix sum has occurred" }],
      },
      { label: "Remove the current prefix on the way back up", color: "success" },
    ],
  },
  "tree-segment": {
    type: "flow",
    title: "Segment Tree Basics",
    direction: "vertical",
    data: [
      { label: "Array-backed tree of size 4n", color: "primary" },
      { label: "Root covers the whole array; each node splits its range in half", color: "info" },
      { label: "Every node stores the aggregate (sum, min, max, gcd) of its range", color: "accent" },
      { label: "Range query and point update in O(log n)", color: "warning" },
      {
        label: "Lazy propagation adds range updates in O(log n)",
        color: "success",
        children: [{ label: "Height is O(log n) because ranges halve at each level" }],
      },
    ],
  },
  "tree-fenwick": {
    type: "flow",
    title: "Fenwick Tree — lowbit Navigation",
    direction: "vertical",
    data: [
      { label: "Index i covers the range [i − lowbit(i) + 1, i]", color: "primary" },
      { label: "lowbit(i) = i & (−i) — the lowest set bit", color: "info" },
      { label: "Prefix sum query walks down: i −= i & (−i)", color: "accent" },
      { label: "Point update walks up: i += i & (−i)", color: "warning" },
      {
        label: "Both visit O(log n) nodes using only O(n) memory",
        color: "success",
        children: [
          { label: "2–5x smaller constant factor and simpler code than a segment tree" },
        ],
      },
      {
        label: "Needs an invertible operation — sum and XOR work, min/max do not",
        color: "muted",
        children: [{ label: "Range update + point query: Fenwick on a difference array" }],
      },
    ],
  },
  "tree-advanced": {
    type: "table-visual",
    title: "Advanced Tree Techniques",
    data: [
      {
        label: "Heavy-Light Decomposition",
        color: "primary",
        children: [
          { label: "Any root-to-leaf path crosses O(log n) chains" },
          { label: "Path queries in O(log²n) via a segment tree per chain" },
        ],
      },
      {
        label: "Centroid Decomposition",
        color: "accent",
        children: [
          { label: "The centroid splits the tree into parts of size ≤ n/2" },
          { label: "The centroid tree has height O(log n)" },
          { label: "Distance queries and path counting in O(n log n)" },
        ],
      },
      {
        label: "DSU (Union-Find)",
        color: "info",
        children: [
          { label: "Path compression + union by rank → O(α(n)) amortised" },
          { label: "Kruskal's MST, dynamic connectivity, online components" },
          { label: "With rollback: skip path compression, undo unions by rank" },
        ],
      },
      {
        label: "Sparse Table",
        color: "success",
        children: [
          { label: "O(n log n) build, O(1) idempotent query (min, max, GCD)" },
          { label: "Two overlapping blocks of length 2^k" },
          { label: "Works on immutable arrays only" },
        ],
      },
    ],
  },
// ─ Segment Tree ──
  "segtree-build": {
    type: "flow",
    title: "Building the Segment Tree",
    direction: "vertical",
    data: [
      { label: "Leaves receive the individual array values", color: "primary" },
      { label: "Internal node = merge of its two children", color: "info" },
      { label: "Sum tree adds children; min tree does Math.min(left, right)", color: "accent" },
      {
        label: "Bottom-up build visits every node once → O(n)",
        color: "success",
        children: [{ label: "Children of node i are 2i and 2i + 1; array size 4n" }],
      },
    ],
  },
  "segtree-point-update": {
    type: "flow",
    title: "Point Update",
    direction: "vertical",
    data: [
      { label: "Walk down to the leaf holding the target index", color: "primary" },
      { label: "Replace the leaf value", color: "info" },
      { label: "Merge back up to the root", color: "accent" },
      {
        label: "Only O(log n) nodes change",
        color: "success",
        children: [{ label: "Every range query over this segment stays correct" }],
      },
    ],
  },
  "segtree-range-query": {
    type: "flow",
    title: "Range Query — Three Cases per Node",
    direction: "vertical",
    data: [
      { label: "Fully outside [L, R] → return the identity value", color: "primary" },
      { label: "Fully inside [L, R] → return tree[node]", color: "info" },
      { label: "Partial overlap → recurse into both children and merge", color: "accent" },
      { label: "At most 4 nodes visited per level → O(log n)", color: "success" },
      { label: "Identity: 0 for sum, ∞ for min, −∞ for max", color: "muted" },
    ],
  },
  "segtree-full-sum": {
    type: "layers",
    title: "Sum Segment Tree — Reusable Template",
    data: [
      {
        label: "SumSegmentTree — build once from the array, then answer queries",
        color: "primary",
        children: [
          { label: "Constructor — build(1, 0, n − 1) in O(n)" },
          { label: "update(pos, value) — point update in O(log n)" },
          { label: "query(L, R) — range sum in O(log n)" },
        ],
      },
    ],
  },
};