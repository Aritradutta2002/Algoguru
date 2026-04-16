import { ContentSection } from "@/data/recursionContent";

export const stackQueueContent: ContentSection[] = [
  /* ═══════════════════════════════════════════════════════════
     1. STACK FUNDAMENTALS
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-stack-intro",
    title: "Stack — Introduction & LIFO Principle",
    theory: [
      "A **Stack** is a linear data structure that follows the **Last In, First Out (LIFO)** principle.",
      "The element inserted last is the first to be removed — like a stack of plates.",
      "**Core operations**: `push(x)` — add element to top, `pop()` — remove top element, `peek()/top()` — view top without removing, `isEmpty()` — check if stack is empty.",
      "All core operations run in **O(1)** amortized time.",
      "Stacks are used extensively in **function call management** (call stack), **expression evaluation**, **backtracking**, **undo mechanisms**, and **DFS traversal**.",
      "Two common implementations: **Array-based** (fixed or dynamic) and **Linked-list-based** (dynamic).",
    ],
    keyPoints: [
      "LIFO: Last In, First Out — the defining property of a stack.",
      "All operations O(1) — push, pop, peek, isEmpty.",
      "Java provides `Stack<E>` (legacy, synchronized) and `Deque<E>` (preferred, faster).",
      "The JVM call stack itself is a stack — every method call pushes a frame, every return pops one.",
    ],
    code: [
      {
        title: "Stack using Array (Java)",
        language: "java",
        content: `class ArrayStack {
    private int[] arr;
    private int top;
    private int capacity;

    public ArrayStack(int size) {
        arr = new int[size];
        capacity = size;
        top = -1;
    }

    public void push(int x) {
        if (top == capacity - 1)
            throw new RuntimeException("Stack Overflow");
        arr[++top] = x;
    }

    public int pop() {
        if (top == -1)
            throw new RuntimeException("Stack Underflow");
        return arr[top--];
    }

    public int peek() {
        if (top == -1)
            throw new RuntimeException("Stack is empty");
        return arr[top];
    }

    public boolean isEmpty() { return top == -1; }
    public int size() { return top + 1; }
}`,
      },
      {
        title: "Stack using Linked List (Java)",
        language: "java",
        content: `class LinkedStack<T> {
    private static class Node<T> {
        T data;
        Node<T> next;
        Node(T data) { this.data = data; }
    }

    private Node<T> top;
    private int size;

    public void push(T x) {
        Node<T> node = new Node<>(x);
        node.next = top;
        top = node;
        size++;
    }

    public T pop() {
        if (top == null) throw new RuntimeException("Stack Underflow");
        T data = top.data;
        top = top.next;
        size--;
        return data;
    }

    public T peek() {
        if (top == null) throw new RuntimeException("Stack is empty");
        return top.data;
    }

    public boolean isEmpty() { return top == null; }
    public int size() { return size; }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     2. JAVA STACK & DEQUE API
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-java-stack-api",
    title: "Java Stack & Deque API — In-Depth",
    theory: [
      "Java's `java.util.Stack<E>` extends `Vector<E>` — it is **synchronized** (thread-safe but slow).",
      "**Preferred alternative**: `Deque<E>` interface with `ArrayDeque<E>` implementation — **not synchronized**, faster, no legacy overhead.",
      "**Deque as Stack**: `push(e)` → `addFirst(e)`, `pop()` → `removeFirst()`, `peek()` → `peekFirst()`.",
      "`ArrayDeque` uses a **resizable circular array** internally — amortized O(1) for all operations.",
      "**Important**: `ArrayDeque` does **not allow null elements** (unlike `LinkedList`).",
      "`Stack<E>` allows random access via `get(index)` since it extends Vector — this breaks the stack abstraction and should be avoided.",
    ],
    keyPoints: [
      "Use `Deque<Integer> stack = new ArrayDeque<>()` — idiomatic modern Java.",
      "ArrayDeque is ~3x faster than Stack in practice (no synchronization overhead).",
      "For thread-safe stacks, use `ConcurrentLinkedDeque` or explicit synchronization.",
      "ArrayDeque doubles capacity when full — amortized O(1) push.",
    ],
    table: {
      headers: ["Operation", "Stack<E>", "ArrayDeque<E>", "Time"],
      rows: [
        ["Push", "push(e)", "push(e) / addFirst(e)", "O(1)*"],
        ["Pop", "pop()", "pop() / removeFirst()", "O(1)"],
        ["Peek", "peek()", "peek() / peekFirst()", "O(1)"],
        ["Empty check", "isEmpty()", "isEmpty()", "O(1)"],
        ["Search", "search(o) → int", "N/A (use contains)", "O(n)"],
        ["Size", "size()", "size()", "O(1)"],
      ],
    },
    code: [
      {
        title: "Java Deque as Stack (Recommended)",
        language: "java",
        content: `import java.util.*;

public class StackDemo {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();

        // Push elements
        stack.push(10);
        stack.push(20);
        stack.push(30);

        System.out.println("Top: " + stack.peek());    // 30
        System.out.println("Pop: " + stack.pop());      // 30
        System.out.println("Size: " + stack.size());    // 2

        // Iterate (top to bottom)
        for (int val : stack) {
            System.out.print(val + " ");  // 20 10
        }

        // Check if empty
        while (!stack.isEmpty()) {
            System.out.println("Popped: " + stack.pop());
        }
    }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     3. QUEUE FUNDAMENTALS
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-queue-intro",
    title: "Queue — Introduction & FIFO Principle",
    theory: [
      "A **Queue** is a linear data structure following the **First In, First Out (FIFO)** principle.",
      "Elements are added at the **rear** (enqueue) and removed from the **front** (dequeue).",
      "**Core operations**: `enqueue(x)` / `offer(x)` — add to rear, `dequeue()` / `poll()` — remove from front, `front()` / `peek()` — view front element, `isEmpty()`.",
      "All core operations run in **O(1)** time.",
      "Queues are fundamental to **BFS traversal**, **task scheduling**, **buffering**, **producer-consumer patterns**, and **rate limiting**.",
      "Implementations: **Array-based circular queue**, **Linked-list queue**, **Double-ended queue (Deque)**.",
    ],
    keyPoints: [
      "FIFO: First In, First Out — the defining property.",
      "Circular array avoids the shifting problem of linear arrays.",
      "In Java, `Queue<E>` is an interface — `LinkedList` and `ArrayDeque` are common implementations.",
      "BFS on graphs fundamentally relies on queue ordering.",
    ],
    code: [
      {
        title: "Queue using Circular Array (Java)",
        language: "java",
        content: `class CircularQueue {
    private int[] arr;
    private int front, rear, size, capacity;

    public CircularQueue(int cap) {
        capacity = cap;
        arr = new int[cap];
        front = 0;
        rear = -1;
        size = 0;
    }

    public void enqueue(int x) {
        if (size == capacity)
            throw new RuntimeException("Queue Full");
        rear = (rear + 1) % capacity;
        arr[rear] = x;
        size++;
    }

    public int dequeue() {
        if (size == 0)
            throw new RuntimeException("Queue Empty");
        int val = arr[front];
        front = (front + 1) % capacity;
        size--;
        return val;
    }

    public int peek() {
        if (size == 0) throw new RuntimeException("Queue Empty");
        return arr[front];
    }

    public boolean isEmpty() { return size == 0; }
    public int size() { return size; }
}`,
      },
      {
        title: "Queue using Linked List (Java)",
        language: "java",
        content: `class LinkedQueue<T> {
    private static class Node<T> {
        T data;
        Node<T> next;
        Node(T data) { this.data = data; }
    }

    private Node<T> front, rear;
    private int size;

    public void enqueue(T x) {
        Node<T> node = new Node<>(x);
        if (rear != null) rear.next = node;
        rear = node;
        if (front == null) front = node;
        size++;
    }

    public T dequeue() {
        if (front == null) throw new RuntimeException("Queue Empty");
        T data = front.data;
        front = front.next;
        if (front == null) rear = null;
        size--;
        return data;
    }

    public T peek() {
        if (front == null) throw new RuntimeException("Queue Empty");
        return front.data;
    }

    public boolean isEmpty() { return front == null; }
    public int size() { return size; }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     4. JAVA QUEUE API
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-java-queue-api",
    title: "Java Queue & Deque API — In-Depth",
    theory: [
      "`Queue<E>` is an interface in `java.util` — key implementations: `LinkedList<E>`, `ArrayDeque<E>`, `PriorityQueue<E>`.",
      "**Two groups of methods**: throwing (`add`, `remove`, `element`) vs returning special value (`offer`, `poll`, `peek`).",
      "`ArrayDeque<E>` is the **fastest general-purpose queue** — uses circular resizable array.",
      "`LinkedList<E>` implements both `Queue` and `Deque` — allows null elements but has pointer overhead.",
      "`Deque<E>` (Double-Ended Queue) supports insertion/removal from **both ends** — can act as both stack and queue.",
      "For concurrent scenarios: `ConcurrentLinkedQueue`, `LinkedBlockingQueue`, `ArrayBlockingQueue`.",
    ],
    keyPoints: [
      "Use `Queue<Integer> q = new ArrayDeque<>()` for general use.",
      "`offer()` returns false on failure; `add()` throws exception — prefer `offer()`.",
      "`poll()` returns null on empty; `remove()` throws — prefer `poll()`.",
      "ArrayDeque as queue: `offer(e)` → addLast, `poll()` → removeFirst.",
    ],
    table: {
      headers: ["Operation", "Throws Exception", "Returns Special Value", "Time"],
      rows: [
        ["Insert", "add(e)", "offer(e) → boolean", "O(1)"],
        ["Remove", "remove()", "poll() → E or null", "O(1)"],
        ["Examine", "element()", "peek() → E or null", "O(1)"],
      ],
    },
    code: [
      {
        title: "Queue Operations in Java",
        language: "java",
        content: `import java.util.*;

public class QueueDemo {
    public static void main(String[] args) {
        // ArrayDeque as Queue (FIFO)
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(10);
        queue.offer(20);
        queue.offer(30);

        System.out.println("Front: " + queue.peek());   // 10
        System.out.println("Poll: " + queue.poll());     // 10
        System.out.println("Size: " + queue.size());     // 2

        // Deque — both ends
        Deque<String> deque = new ArrayDeque<>();
        deque.offerFirst("A");   // A
        deque.offerLast("B");    // A B
        deque.offerFirst("C");   // C A B

        System.out.println(deque.peekFirst());  // C
        System.out.println(deque.peekLast());   // B
        System.out.println(deque.pollFirst());  // C
        System.out.println(deque.pollLast());   // B

        // LinkedList as Queue
        Queue<Integer> llq = new LinkedList<>();
        llq.offer(1);
        llq.offer(2);
        while (!llq.isEmpty()) {
            System.out.print(llq.poll() + " ");  // 1 2
        }
    }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     5. BALANCED PARENTHESES
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-balanced-parens",
    title: "Balanced Parentheses — Classic Stack Problem",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given a string containing `(`, `)`, `{`, `}`, `[`, `]`, determine if all brackets are **properly matched and nested**.",
      "**Algorithm**: Push every opening bracket onto the stack. For every closing bracket, check if the stack top has the matching opener — if not, return false. At the end, the stack must be empty.",
      "This is the foundational stack application — it extends to **HTML tag matching**, **compiler syntax checking**, and **expression validation**.",
    ],
    keyPoints: [
      "Use a HashMap for O(1) bracket matching lookups.",
      "Edge case: string of odd length → always invalid.",
      "Can be extended to find the minimum additions to make brackets valid.",
    ],
    code: [
      {
        title: "Valid Parentheses (LeetCode #20)",
        language: "java",
        content: `public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> map = Map.of(
        ')', '(', '}', '{', ']', '['
    );

    for (char c : s.toCharArray()) {
        if (map.containsValue(c)) {
            stack.push(c);
        } else if (map.containsKey(c)) {
            if (stack.isEmpty() || stack.pop() != map.get(c))
                return false;
        }
    }
    return stack.isEmpty();
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     6. NEXT GREATER ELEMENT
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-nge",
    title: "Next Greater Element — Monotonic Stack",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "For each element in an array, find the **next element that is strictly greater** (to its right). If none exists, answer is -1.",
      "**Brute force**: O(n^2) — for each element, scan right. **Optimal**: O(n) using a **monotonic decreasing stack**.",
      "**Monotonic Stack Technique (from cp-algorithms)**: Maintain a stack of elements in decreasing order. When a new element `x` is encountered, pop all elements smaller than `x` — for each popped element, `x` is its NGE.",
      "This is one of the most important competitive programming patterns — it generalizes to **Next Smaller Element**, **Previous Greater Element**, **Stock Span**, and many more.",
      "**Circular variant**: Process the array twice (index `i % n`) to handle wrap-around — used in Circular NGE problems.",
    ],
    keyPoints: [
      "Stack stores indices (not values) for flexibility in accessing positions.",
      "Monotonic decreasing stack → finds Next Greater. Monotonic increasing → finds Next Smaller.",
      "Each element is pushed and popped at most once → O(n) total.",
      "The stack technique is the backbone of problems like Largest Rectangle in Histogram, Trapping Rain Water, and Sum of Subarray Minimums.",
    ],
    code: [
      {
        title: "Next Greater Element (Monotonic Stack)",
        language: "java",
        content: `public int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // stores indices

    for (int i = 0; i < n; i++) {
        // Pop all elements smaller than current
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }
    return result;
}

// Circular variant — Next Greater Element II (LeetCode #503)
public int[] nextGreaterElements(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < 2 * n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i % n]) {
            result[stack.pop()] = nums[i % n];
        }
        if (i < n) stack.push(i);
    }
    return result;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     7. LARGEST RECTANGLE IN HISTOGRAM
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an array of bar heights, find the area of the **largest rectangle** that can be formed in the histogram.",
      "**Key insight (cp-algorithms)**: For each bar `i`, find the nearest smaller bar to its left (`L[i]`) and right (`R[i]`). The width of the rectangle with height `h[i]` is `R[i] - L[i] - 1`.",
      "Both `L[]` and `R[]` can be computed in O(n) using a **monotonic increasing stack**.",
      "**Single-pass optimization**: Process bars left to right. Maintain a stack of indices in increasing height order. When a bar shorter than the stack top is found, pop and compute area using the popped bar as height.",
      "This problem is the foundation for **Maximal Rectangle in Binary Matrix** (LeetCode #85).",
    ],
    keyPoints: [
      "The stack maintains indices of bars in non-decreasing height order.",
      "When popping bar `h[j]`, width = `i - stack.peek() - 1` (or `i` if stack is empty).",
      "Each bar is pushed and popped exactly once → O(n).",
      "Sentinel values (height 0) at boundaries simplify edge cases.",
    ],
    code: [
      {
        title: "Largest Rectangle in Histogram (LeetCode #84)",
        language: "java",
        content: `public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i]; // sentinel
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}

// Extension: Maximal Rectangle in Binary Matrix
public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;
    int cols = matrix[0].length;
    int[] heights = new int[cols];
    int maxArea = 0;

    for (char[] row : matrix) {
        for (int j = 0; j < cols; j++) {
            heights[j] = (row[j] == '1') ? heights[j] + 1 : 0;
        }
        maxArea = Math.max(maxArea, largestRectangleArea(heights));
    }
    return maxArea;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     8. TRAPPING RAIN WATER
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) — two pointer / O(n) — stack",
    theory: [
      "Given elevation bars, compute how much water can be trapped after raining.",
      "**Three approaches**: (1) Prefix max arrays O(n) space, (2) Stack-based O(n) space, (3) **Two-pointer O(1) space** (optimal).",
      "**Two-pointer insight**: Water at position `i` = `min(maxLeft, maxRight) - height[i]`. By moving the pointer from the smaller side, we guarantee correctness without knowing the other max.",
      "**Stack-based approach**: Maintain a decreasing stack. When a taller bar appears, pop and compute water layer-by-layer between current bar and new stack top.",
    ],
    keyPoints: [
      "Two-pointer method is the cleanest O(n) time, O(1) space solution.",
      "Stack approach computes water horizontally (layer by layer), two-pointer computes vertically (column by column).",
      "This problem combines prefix max concepts with stack/two-pointer techniques.",
    ],
    code: [
      {
        title: "Trapping Rain Water — All Approaches",
        language: "java",
        content: `// Approach 1: Two Pointers — O(n) time, O(1) space (OPTIMAL)
public int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMax = 0, rightMax = 0, water = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = Math.max(leftMax, height[left]);
            water += leftMax - height[left];
            left++;
        } else {
            rightMax = Math.max(rightMax, height[right]);
            water += rightMax - height[right];
            right--;
        }
    }
    return water;
}

// Approach 2: Stack-based — O(n) time, O(n) space
public int trapStack(int[] height) {
    Deque<Integer> stack = new ArrayDeque<>();
    int water = 0;

    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = stack.pop();
            if (stack.isEmpty()) break;
            int width = i - stack.peek() - 1;
            int h = Math.min(height[i], height[stack.peek()]) - height[bottom];
            water += width * h;
        }
        stack.push(i);
    }
    return water;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     9. MIN STACK
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-min-stack",
    title: "Min Stack — O(1) getMin()",
    difficulty: "Medium",
    timeComplexity: "O(1) all operations",
    spaceComplexity: "O(n)",
    theory: [
      "Design a stack that supports `push`, `pop`, `top`, and **`getMin`** — all in O(1) time.",
      "**Approach 1 — Two stacks**: Maintain an auxiliary stack that tracks the current minimum at each level.",
      "**Approach 2 — Single stack with encoding**: Store `2 * val - min` when `val < min`. On pop, if stored value < current min, decode previous min as `2 * min - stored`.",
      "The two-stack approach is simpler and recommended for interviews. The encoding approach saves space but is tricky with integer overflow.",
    ],
    keyPoints: [
      "The min-stack pattern extends to Max Stack, Min Queue, and Sliding Window problems.",
      "Two-stack approach: push to minStack only when value ≤ current min.",
      "This is a classic design problem — tests understanding of stack invariants.",
    ],
    code: [
      {
        title: "Min Stack (LeetCode #155)",
        language: "java",
        content: `class MinStack {
    private Deque<Integer> stack;
    private Deque<Integer> minStack;

    public MinStack() {
        stack = new ArrayDeque<>();
        minStack = new ArrayDeque<>();
    }

    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        }
    }

    public void pop() {
        int val = stack.pop();
        if (val == minStack.peek()) {
            minStack.pop();
        }
    }

    public int top() {
        return stack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }
}

// O(1) space variant (no extra stack)
class MinStackOptimal {
    private Deque<Long> stack = new ArrayDeque<>();
    private long min;

    public void push(int val) {
        if (stack.isEmpty()) {
            stack.push(0L);
            min = val;
        } else {
            stack.push((long) val - min);  // store difference
            if (val < min) min = val;
        }
    }

    public void pop() {
        long top = stack.pop();
        if (top < 0) min = min - top;  // restore previous min
    }

    public int top() {
        long top = stack.peek();
        return (int) (top < 0 ? min : top + min);
    }

    public int getMin() { return (int) min; }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     10. EXPRESSION EVALUATION — INFIX, POSTFIX, PREFIX
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-expression-eval",
    title: "Expression Evaluation — Infix, Postfix, Prefix",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**Infix**: Operators between operands (`A + B`). Requires precedence rules and parentheses.",
      "**Postfix (Reverse Polish Notation)**: Operators after operands (`A B +`). No parentheses needed — unambiguous evaluation.",
      "**Prefix (Polish Notation)**: Operators before operands (`+ A B`).",
      "**Shunting Yard Algorithm (Dijkstra)**: Converts infix to postfix using an operator stack. Handles precedence and associativity.",
      "**Postfix evaluation**: Scan left to right. Push operands. On operator, pop two operands, compute, push result.",
      "These algorithms are the core of how **compilers parse expressions** and how **calculators** work internally.",
    ],
    keyPoints: [
      "Postfix evaluation uses a single stack — no precedence checking needed.",
      "Shunting Yard: pop operators of higher/equal precedence before pushing current operator.",
      "Left-associative: pop equal precedence. Right-associative (like ^): don't pop equal precedence.",
      "This is fundamental to compiler design — lexer → parser → AST.",
    ],
    code: [
      {
        title: "Postfix Evaluation + Infix to Postfix (Shunting Yard)",
        language: "java",
        content: `// Evaluate Postfix Expression
public int evalPostfix(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String token : tokens) {
        if ("+-*/".contains(token)) {
            int b = stack.pop(), a = stack.pop();
            switch (token) {
                case "+": stack.push(a + b); break;
                case "-": stack.push(a - b); break;
                case "*": stack.push(a * b); break;
                case "/": stack.push(a / b); break;
            }
        } else {
            stack.push(Integer.parseInt(token));
        }
    }
    return stack.pop();
}

// Infix to Postfix — Shunting Yard Algorithm
public List<String> infixToPostfix(String[] tokens) {
    List<String> output = new ArrayList<>();
    Deque<String> ops = new ArrayDeque<>();
    Map<String, Integer> prec = Map.of("+", 1, "-", 1, "*", 2, "/", 2, "^", 3);

    for (String t : tokens) {
        if (t.matches("\\\\d+")) {
            output.add(t);
        } else if (t.equals("(")) {
            ops.push(t);
        } else if (t.equals(")")) {
            while (!ops.peek().equals("(")) output.add(ops.pop());
            ops.pop(); // remove "("
        } else {
            while (!ops.isEmpty() && !ops.peek().equals("(")
                   && prec.getOrDefault(ops.peek(), 0) >= prec.get(t)) {
                output.add(ops.pop());
            }
            ops.push(t);
        }
    }
    while (!ops.isEmpty()) output.add(ops.pop());
    return output;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     11. STACK USING QUEUES / QUEUE USING STACKS
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-stack-queue-interop",
    title: "Stack Using Queues / Queue Using Stacks",
    difficulty: "Easy",
    timeComplexity: "O(n) push or O(n) pop",
    spaceComplexity: "O(n)",
    theory: [
      "**Stack using 2 Queues**: Make `push` costly — on push, enqueue to q2, then transfer all from q1 to q2, swap q1 and q2. Pop/peek from q1 are O(1).",
      "**Stack using 1 Queue**: On push, enqueue the element, then dequeue and re-enqueue all previous elements (n-1 rotations). Effective and uses less space.",
      "**Queue using 2 Stacks**: Push onto s1. For pop/peek, if s2 is empty, transfer all from s1 to s2 (reverses order). Amortized O(1) per operation.",
      "These are classic interview problems that test your understanding of how these data structures relate to each other.",
    ],
    keyPoints: [
      "Queue using 2 stacks has **amortized O(1)** for all operations — each element is moved at most twice.",
      "Stack using 1 queue — the rotation trick is elegant and memory-efficient.",
      "These problems appear frequently in interviews at FAANG companies.",
    ],
    code: [
      {
        title: "Queue using Two Stacks (Amortized O(1))",
        language: "java",
        content: `class MyQueue {
    private Deque<Integer> pushStack = new ArrayDeque<>();
    private Deque<Integer> popStack = new ArrayDeque<>();

    public void push(int x) {
        pushStack.push(x);
    }

    public int pop() {
        ensurePopStack();
        return popStack.pop();
    }

    public int peek() {
        ensurePopStack();
        return popStack.peek();
    }

    public boolean empty() {
        return pushStack.isEmpty() && popStack.isEmpty();
    }

    private void ensurePopStack() {
        if (popStack.isEmpty()) {
            while (!pushStack.isEmpty()) {
                popStack.push(pushStack.pop());
            }
        }
    }
}

// Stack using Single Queue
class MyStack {
    private Queue<Integer> q = new ArrayDeque<>();

    public void push(int x) {
        q.offer(x);
        // Rotate previous elements behind the new one
        for (int i = 0; i < q.size() - 1; i++) {
            q.offer(q.poll());
        }
    }

    public int pop() { return q.poll(); }
    public int top() { return q.peek(); }
    public boolean empty() { return q.isEmpty(); }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     12. SLIDING WINDOW MAXIMUM — DEQUE
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-sliding-window-max",
    title: "Sliding Window Maximum — Monotonic Deque",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    theory: [
      "Given an array and window size `k`, find the maximum in each window as it slides from left to right.",
      "**Brute force**: O(nk). **Optimal**: O(n) using a **monotonic decreasing deque** (from cp-algorithms).",
      "**Algorithm**: Maintain a deque of indices. The front always holds the index of the current window maximum. Before adding index `i`: (1) Remove front if out of window (`i - k`), (2) Remove all back indices whose values ≤ arr[i] (they can never be max), (3) Add `i` to back.",
      "This is the **Minimum Queue** technique from cp-algorithms — the deque maintains a decreasing sequence of 'useful' candidates.",
      "The same technique solves **Sliding Window Minimum**, **Constrained Subsequence Sum**, and is used in **DP optimizations** (e.g., deque-optimized DP).",
    ],
    keyPoints: [
      "Each element enters and leaves the deque at most once → O(n) total.",
      "The deque stores indices, not values — allows window boundary checking.",
      "This is the canonical monotonic deque problem — master it for competitive programming.",
      "Extension: Minimum Queue with O(1) getMin() uses the same idea.",
    ],
    code: [
      {
        title: "Sliding Window Maximum (LeetCode #239)",
        language: "java",
        content: `public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>(); // stores indices

    for (int i = 0; i < n; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Maintain decreasing order — remove smaller elements
        while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // Window is fully formed
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}

// Minimum Queue — O(1) getMin, amortized O(1) push/pop
class MinQueue {
    Deque<Integer> q = new ArrayDeque<>();
    Deque<Integer> mins = new ArrayDeque<>(); // decreasing deque

    void push(int val) {
        q.offerLast(val);
        while (!mins.isEmpty() && mins.peekLast() > val)
            mins.pollLast();
        mins.offerLast(val);
    }

    int pop() {
        int val = q.pollFirst();
        if (mins.peekFirst() == val) mins.pollFirst();
        return val;
    }

    int getMin() { return mins.peekFirst(); }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     13. STOCK SPAN PROBLEM
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-stock-span",
    title: "Stock Span Problem",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "The **span** of stock price on day `i` is the number of consecutive days (up to and including `i`) where the price was ≤ price on day `i`.",
      "Equivalent to: find the **Previous Greater Element** and compute distance.",
      "**Monotonic stack approach**: Maintain a stack of indices in decreasing price order. For each day, pop all days with price ≤ current price. Span = `i - stack.peek()` (or `i + 1` if stack empty).",
      "This is an online algorithm — can process prices one by one as they arrive.",
    ],
    keyPoints: [
      "Identical to Previous Greater Element with distance calculation.",
      "Each element pushed and popped at most once → O(n).",
      "Online variant (LeetCode #901) processes one price at a time.",
    ],
    code: [
      {
        title: "Stock Span (Online & Batch)",
        language: "java",
        content: `// Batch version
public int[] stockSpan(int[] prices) {
    int n = prices.length;
    int[] span = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && prices[stack.peek()] <= prices[i]) {
            stack.pop();
        }
        span[i] = stack.isEmpty() ? i + 1 : i - stack.peek();
        stack.push(i);
    }
    return span;
}

// Online version (LeetCode #901)
class StockSpanner {
    Deque<int[]> stack = new ArrayDeque<>(); // {price, span}

    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }
        stack.push(new int[]{price, span});
        return span;
    }
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     14. SUM OF SUBARRAY MINIMUMS / MAXIMUMS
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-subarray-min-sum",
    title: "Sum of Subarray Minimums — Monotonic Stack + Contribution",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given array `arr`, find the **sum of min(subarray)** over all contiguous subarrays.",
      "**Brute force**: O(n^2) or O(n^3). **Optimal**: O(n) using **contribution technique** with monotonic stack.",
      "**Key insight**: For each element `arr[i]`, count in how many subarrays it is the minimum. If `arr[i]` is minimum in `L * R` subarrays (where L = distance to Previous Smaller, R = distance to Next Smaller), its contribution is `arr[i] * L * R`.",
      "Use **strictly less** for one side and **less or equal** for the other to handle duplicates correctly.",
      "Total = Σ(arr[i] * left[i] * right[i]) mod 10^9+7.",
    ],
    keyPoints: [
      "Contribution technique + monotonic stack = powerful combo for subarray problems.",
      "Handle duplicates carefully: use `<` for left boundary, `<=` for right (or vice versa) to avoid double-counting.",
      "Same pattern applies to Sum of Subarray Maximums, Sum of Subarray Ranges.",
    ],
    code: [
      {
        title: "Sum of Subarray Minimums (LeetCode #907)",
        language: "java",
        content: `public int sumSubarrayMins(int[] arr) {
    int MOD = 1_000_000_007;
    int n = arr.length;
    int[] left = new int[n];   // distance to Previous Smaller Element
    int[] right = new int[n];  // distance to Next Smaller or Equal Element

    Deque<Integer> stack = new ArrayDeque<>();

    // Previous Smaller Element (strictly less)
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i])
            stack.pop();
        left[i] = stack.isEmpty() ? i + 1 : i - stack.peek();
        stack.push(i);
    }

    stack.clear();

    // Next Smaller or Equal Element
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && arr[stack.peek()] > arr[i])
            stack.pop();
        right[i] = stack.isEmpty() ? n - i : stack.peek() - i;
        stack.push(i);
    }

    long result = 0;
    for (int i = 0; i < n; i++) {
        result = (result + (long) arr[i] * left[i] % MOD * right[i]) % MOD;
    }
    return (int) result;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     15. BFS — QUEUE IN GRAPH TRAVERSAL
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-bfs-queue",
    title: "BFS — Queue in Graph Traversal",
    difficulty: "Medium",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "**Breadth-First Search** is a graph traversal that explores all neighbors at the current depth before moving to the next depth level.",
      "BFS uses a **queue** (FIFO) — enqueue the source, then repeatedly dequeue a node, process it, and enqueue all unvisited neighbors.",
      "**Properties**: BFS finds the **shortest path** in unweighted graphs. It visits nodes in increasing order of distance from the source.",
      "**Level-order traversal** of a tree is BFS on a tree (using queue).",
      "**Multi-source BFS**: Enqueue multiple sources initially — used in problems like 'Rotten Oranges', 'Walls and Gates', '01 Matrix'.",
    ],
    keyPoints: [
      "BFS guarantees shortest path in unweighted graphs.",
      "Queue ensures FIFO ordering → level-by-level exploration.",
      "Time: O(V + E) for adjacency list, O(V^2) for adjacency matrix.",
      "Multi-source BFS is a powerful pattern — think of it as simultaneous BFS from all sources.",
    ],
    code: [
      {
        title: "BFS on Graph + Level-Order Tree Traversal",
        language: "java",
        content: `// BFS on Graph — Shortest Path in Unweighted Graph
public int[] bfs(List<List<Integer>> adj, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> queue = new ArrayDeque<>();

    dist[src] = 0;
    queue.offer(src);

    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v : adj.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                queue.offer(v);
            }
        }
    }
    return dist;
}

// Level-Order Traversal of Binary Tree
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     16. DFS USING STACK (ITERATIVE)
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-dfs-stack",
    title: "Iterative DFS Using Stack",
    difficulty: "Medium",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "**Depth-First Search** explores as deep as possible along each branch before backtracking.",
      "Recursive DFS uses the **call stack** implicitly. Iterative DFS uses an **explicit stack** — avoids stack overflow for large graphs.",
      "**Algorithm**: Push source. While stack not empty: pop, process, push all unvisited neighbors.",
      "**Key difference from BFS**: DFS uses LIFO (stack), BFS uses FIFO (queue). This changes the exploration order from level-by-level to depth-first.",
      "Iterative DFS is essential when recursion depth might exceed JVM limits (default ~10K–50K frames).",
    ],
    keyPoints: [
      "Iterative DFS avoids StackOverflowError for large inputs.",
      "Mark visited when popping (not when pushing) to match recursive DFS behavior.",
      "For tree traversals: iterative inorder, preorder, postorder all use explicit stacks.",
    ],
    code: [
      {
        title: "Iterative DFS on Graph + Iterative Tree Traversals",
        language: "java",
        content: `// Iterative DFS on Graph
public void dfs(List<List<Integer>> adj, int src, int n) {
    boolean[] visited = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(src);

    while (!stack.isEmpty()) {
        int u = stack.pop();
        if (visited[u]) continue;
        visited[u] = true;
        System.out.print(u + " ");

        for (int v : adj.get(u)) {
            if (!visited[v]) stack.push(v);
        }
    }
}

// Iterative Inorder Traversal (Binary Tree)
public List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        result.add(curr.val);
        curr = curr.right;
    }
    return result;
}

// Iterative Preorder
public List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }
    return result;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     17. MONOTONIC STACK PATTERNS SUMMARY
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-monotonic-summary",
    title: "Monotonic Stack — Complete Pattern Guide",
    difficulty: "Hard",
    theory: [
      "A **monotonic stack** maintains elements in strictly increasing or decreasing order. It's the most powerful stack technique in competitive programming.",
      "**Four variants**: (1) Next Greater Element — decreasing stack, scan left→right. (2) Next Smaller Element — increasing stack, scan left→right. (3) Previous Greater Element — decreasing stack, scan left→right. (4) Previous Smaller Element — increasing stack, scan left→right.",
      "**Template**: For 'Next Greater', maintain decreasing stack. For each new element, pop all smaller — they found their answer. Push current.",
      "**Applications**: Largest Rectangle in Histogram, Trapping Rain Water, Stock Span, Sum of Subarray Mins/Maxs, Daily Temperatures, Buildings With Ocean View, Remove K Digits, 132 Pattern.",
      "**Complexity**: Each element pushed and popped at most once → O(n) total regardless of inner loop.",
    ],
    keyPoints: [
      "Monotonic stack is O(n) — not O(n^2) — because each element enters/exits stack at most once.",
      "Decreasing stack → finds next/previous greater. Increasing stack → finds next/previous smaller.",
      "Store indices in the stack (not values) for maximum flexibility.",
      "When in doubt about a subarray optimization problem, think: can a monotonic stack help?",
    ],
    table: {
      headers: ["Problem", "Stack Type", "Direction", "Difficulty"],
      rows: [
        ["Next Greater Element", "Decreasing", "Left → Right", "Medium"],
        ["Next Smaller Element", "Increasing", "Left → Right", "Medium"],
        ["Previous Greater Element", "Decreasing", "Left → Right", "Medium"],
        ["Previous Smaller Element", "Increasing", "Left → Right", "Medium"],
        ["Largest Rectangle in Histogram", "Increasing", "Left → Right", "Hard"],
        ["Trapping Rain Water", "Decreasing", "Left → Right", "Hard"],
        ["Daily Temperatures", "Decreasing", "Left → Right", "Medium"],
        ["Stock Span", "Decreasing", "Left → Right", "Medium"],
        ["Sum of Subarray Minimums", "Increasing", "Both", "Hard"],
        ["Remove K Digits", "Increasing", "Left → Right", "Medium"],
        ["132 Pattern", "Decreasing", "Right → Left", "Medium"],
      ],
    },
    code: [
      {
        title: "Monotonic Stack Templates",
        language: "java",
        content: `// Template: Next Greater Element (Decreasing Stack)
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
            ans[stack.pop()] = arr[i];
        stack.push(i);
    }
    return ans;
}

// Template: Next Smaller Element (Increasing Stack)
public int[] nextSmaller(int[] arr) {
    int n = arr.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] > arr[i])
            ans[stack.pop()] = arr[i];
        stack.push(i);
    }
    return ans;
}

// Template: Previous Smaller Element
public int[] prevSmaller(int[] arr) {
    int n = arr.length;
    int[] ans = new int[n];
    Arrays.fill(ans, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i])
            stack.pop();
        if (!stack.isEmpty()) ans[i] = arr[stack.peek()];
        stack.push(i);
    }
    return ans;
}

// Daily Temperatures (LeetCode #739)
public int[] dailyTemperatures(int[] temps) {
    int n = temps.length;
    int[] ans = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {
            int j = stack.pop();
            ans[j] = i - j;
        }
        stack.push(i);
    }
    return ans;
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     18. ADVANCED — QUEUE-BASED DP OPTIMIZATION
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-deque-dp",
    title: "Deque-Optimized DP & Advanced Queue Techniques",
    difficulty: "Expert",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Many DP recurrences of the form `dp[i] = min/max(dp[j] + cost(j,i))` for `j` in a sliding window can be optimized from O(nk) to O(n) using a **monotonic deque**.",
      "**Pattern**: If the DP transition looks at a range `[i-k, i-1]` and you need the min/max of `dp[j]` in that range, maintain a monotonic deque of candidates.",
      "**Example problems**: Jump Game with cost (min cost to reach end with window k), Constrained Subsequence Sum, Sliding Window Maximum DP.",
      "**From cp-algorithms**: The Minimum Queue technique directly applies — maintain a deque that tracks the optimal `dp` values in the current window.",
      "This technique reduces complexity by a factor of k — from O(nk) to O(n).",
    ],
    keyPoints: [
      "Look for DP transitions: dp[i] = f(dp[j]) where j ∈ [i-k, i-1].",
      "Monotonic deque eliminates redundant candidates, keeping only potentially optimal ones.",
      "This is a key competitive programming technique — appears in Codeforces Div 1–2 problems frequently.",
      "Combines the sliding window maximum pattern with DP.",
    ],
    code: [
      {
        title: "Deque-Optimized DP Example",
        language: "java",
        content: `// Constrained Subsequence Sum (LeetCode #1425)
// dp[i] = nums[i] + max(0, max(dp[j])) for j in [i-k, i-1]
public int constrainedSubsetSum(int[] nums, int k) {
    int n = nums.length;
    int[] dp = new int[n];
    Deque<Integer> deque = new ArrayDeque<>(); // decreasing dp values
    int ans = Integer.MIN_VALUE;

    for (int i = 0; i < n; i++) {
        // Remove out-of-window elements
        while (!deque.isEmpty() && deque.peekFirst() < i - k)
            deque.pollFirst();

        dp[i] = nums[i];
        if (!deque.isEmpty())
            dp[i] = Math.max(dp[i], nums[i] + dp[deque.peekFirst()]);

        // Maintain decreasing order of dp values
        while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i])
            deque.pollLast();

        if (dp[i] > 0) deque.offerLast(i);
        ans = Math.max(ans, dp[i]);
    }
    return ans;
}

// Jump Game with Minimum Cost — O(n) with deque
public int minCostJump(int[] cost, int k) {
    int n = cost.length;
    int[] dp = new int[n];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = cost[0];
    Deque<Integer> deque = new ArrayDeque<>();
    deque.offerLast(0);

    for (int i = 1; i < n; i++) {
        // Remove out-of-window
        while (!deque.isEmpty() && deque.peekFirst() < i - k)
            deque.pollFirst();

        dp[i] = dp[deque.peekFirst()] + cost[i];

        // Maintain increasing dp values in deque
        while (!deque.isEmpty() && dp[deque.peekLast()] >= dp[i])
            deque.pollLast();
        deque.offerLast(i);
    }
    return dp[n - 1];
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     19. ADVANCED — REMOVE K DIGITS & RELATED
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-remove-k-digits",
    title: "Remove K Digits & Greedy Stack Problems",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given a number string, remove `k` digits to get the **smallest possible number**.",
      "**Greedy + Monotonic Stack**: Scan left to right. If the current digit is smaller than the stack top, pop the top (removes a larger digit from a more significant position). Repeat until `k` removals done.",
      "This greedy principle: **remove peaks** — a digit that is larger than its successor should be removed first.",
      "Same pattern applies to: **Remove Duplicate Letters** (smallest subsequence with all unique chars), **Create Maximum Number** (from two arrays).",
    ],
    keyPoints: [
      "Greedy: always remove the leftmost peak (digit > next digit) first.",
      "After processing, if k > 0, remove from the end (remaining digits are non-decreasing).",
      "Handle leading zeros after removal.",
    ],
    code: [
      {
        title: "Remove K Digits (LeetCode #402) + Remove Duplicate Letters (#316)",
        language: "java",
        content: `// Remove K Digits
public String removeKdigits(String num, int k) {
    Deque<Character> stack = new ArrayDeque<>();

    for (char c : num.toCharArray()) {
        while (k > 0 && !stack.isEmpty() && stack.peek() > c) {
            stack.pop();
            k--;
        }
        stack.push(c);
    }

    // Remove remaining from top
    while (k-- > 0) stack.pop();

    // Build result, skip leading zeros
    StringBuilder sb = new StringBuilder();
    boolean leadingZero = true;
    for (char c : stack) sb.append(c); // note: iterate bottom to top
    // ArrayDeque iterator goes top to bottom, so reverse
    sb.reverse();
    // Actually, let's rebuild properly:
    char[] arr = new char[stack.size()];
    int idx = arr.length - 1;
    while (!stack.isEmpty()) arr[idx--] = stack.pop();
    
    int start = 0;
    while (start < arr.length - 1 && arr[start] == '0') start++;
    return new String(arr, start, arr.length - start);
}

// Remove Duplicate Letters (Smallest Subsequence)
public String removeDuplicateLetters(String s) {
    int[] count = new int[26];
    boolean[] inStack = new boolean[26];
    for (char c : s.toCharArray()) count[c - 'a']++;

    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        count[c - 'a']--;
        if (inStack[c - 'a']) continue;

        while (!stack.isEmpty() && stack.peek() > c 
               && count[stack.peek() - 'a'] > 0) {
            inStack[stack.pop() - 'a'] = false;
        }
        stack.push(c);
        inStack[c - 'a'] = true;
    }

    StringBuilder sb = new StringBuilder();
    for (char c : stack) sb.append(c);
    return sb.reverse().toString();
}`,
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     20. COMPREHENSIVE COMPARISON & WHEN TO USE WHAT
     ═══════════════════════════════════════════════════════════ */
  {
    id: "sq-comparison",
    title: "Stack vs Queue — Comprehensive Comparison & When to Use What",
    theory: [
      "**Stack (LIFO)**: Use when you need to process the **most recent** element first — function calls, undo, DFS, expression parsing, monotonic stack problems.",
      "**Queue (FIFO)**: Use when you need to process in **arrival order** — BFS, scheduling, buffering, sliding window.",
      "**Deque**: Use when you need **both ends** — sliding window max/min, palindrome checking, work-stealing algorithms.",
      "**Priority Queue**: Use when you need the **best** element (not most recent or oldest) — Dijkstra, K-way merge, median finding.",
      "**Monotonic Stack/Deque**: Use for **next/previous greater/smaller** problems, histogram problems, DP optimization.",
    ],
    keyPoints: [
      "If the problem involves matching/nesting → Stack.",
      "If the problem involves level-by-level or shortest path → Queue.",
      "If the problem involves sliding window optimization → Deque.",
      "If the problem says 'next greater/smaller' → Monotonic Stack.",
      "If the problem involves DP with range min/max → Monotonic Deque.",
    ],
    table: {
      headers: ["Pattern", "Data Structure", "Example Problems"],
      rows: [
        ["Bracket matching / Nesting", "Stack", "Valid Parentheses, HTML Validator"],
        ["Expression evaluation", "Stack", "Postfix Eval, Calculator I/II/III"],
        ["Next/Prev Greater/Smaller", "Monotonic Stack", "NGE, Stock Span, Daily Temps"],
        ["Histogram / Area problems", "Monotonic Stack", "Largest Rectangle, Trapping Rain Water"],
        ["BFS / Shortest path (unweighted)", "Queue", "Rotten Oranges, Word Ladder"],
        ["Level-order traversal", "Queue", "Binary Tree Level Order"],
        ["Sliding window max/min", "Monotonic Deque", "Sliding Window Maximum"],
        ["DP range optimization", "Monotonic Deque", "Constrained Subsequence Sum"],
        ["Greedy digit removal", "Monotonic Stack", "Remove K Digits, Remove Duplicates"],
        ["Undo / Backtracking", "Stack", "Browser History, Text Editor"],
      ],
    },
  },
];
