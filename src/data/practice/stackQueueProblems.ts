import { ContentSection } from "../recursionContent";

export const stackQueueEasy: ContentSection[] = [
  { id: "stackq-easy-1", title: "Valid Parentheses", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given a string containing just `(){}[]`, determine if the input string is valid.", "**Example:** `Input: s = \"({[]})\"` → `Output: true`. `Input: s = \"([)]\"` → `Output: false`.", "**Approach:** Push opening brackets onto a stack. For closing brackets, check if top matches."],
    keyPoints: ["Push the expected closing bracket instead of the opening bracket for cleaner code"],
    code: [{ title: "Valid Parentheses — Stack", language: "java", content: `import java.util.*;

public class ValidParentheses {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
    public static void main(String[] args) {
        System.out.println(isValid("({[]})")); // true
        System.out.println(isValid("([)]"));   // false
    }
}` }],
  },
  { id: "stackq-easy-2", title: "Implement Queue using Stacks", difficulty: "Easy", timeComplexity: "O(1) amortized", spaceComplexity: "O(n)",
    theory: ["Implement a FIFO queue using only two stacks.", "**Example:** `push(1), push(2), peek() → 1, pop() → 1`.", "**Approach:** Two stacks: input and output. On pop/peek, if output is empty, transfer all from input."],
    keyPoints: ["Amortized O(1) — each element is moved between stacks at most once"],
    code: [{ title: "Queue using Two Stacks", language: "java", content: `import java.util.*;

public class MyQueue {
    Deque<Integer> input = new ArrayDeque<>(), output = new ArrayDeque<>();
    public void push(int x) { input.push(x); }
    public int pop() { if (output.isEmpty()) transfer(); return output.pop(); }
    public int peek() { if (output.isEmpty()) transfer(); return output.peek(); }
    public boolean empty() { return input.isEmpty() && output.isEmpty(); }
    private void transfer() { while (!input.isEmpty()) output.push(input.pop()); }
    public static void main(String[] args) {
        MyQueue q = new MyQueue(); q.push(1); q.push(2);
        System.out.println(q.peek()); // 1
        System.out.println(q.pop());  // 1
    }
}` }],
  },
  { id: "stackq-easy-3", title: "Min Stack (LC 155)", difficulty: "Easy", timeComplexity: "O(1) all operations", spaceComplexity: "O(n)",
    theory: ["Design a stack that supports push, pop, top, and retrieving the minimum in O(1).", "**Example:** `push(-2), push(0), push(-3), getMin()→-3, pop(), getMin()→-2`.", "**Approach:** Two stacks: one for values, one for minimums."],
    keyPoints: ["Auxiliary min stack tracks the minimum at every stack depth"],
    code: [{ title: "Min Stack — O(1) getMin", language: "java", content: `import java.util.*;

public class MinStack {
    Deque<Integer> stack = new ArrayDeque<>(), minStack = new ArrayDeque<>();
    public void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(val, minStack.peek()));
    }
    public void pop() { stack.pop(); minStack.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
    public static void main(String[] args) {
        MinStack ms = new MinStack(); ms.push(-2); ms.push(0); ms.push(-3);
        System.out.println(ms.getMin()); // -3
        ms.pop(); System.out.println(ms.getMin()); // -2
    }
}` }],
  },
  { id: "stackq-easy-4", title: "Baseball Game (LC 682)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given a list of operations: integer (add score), '+' (sum of last two), 'D' (double last), 'C' (invalidate last). Return total.", "**Example:** `Input: ops = [\"5\",\"2\",\"C\",\"D\",\"+\"]` → `Output: 30`.", "**Approach:** Stack-based simulation. Process each operation and maintain the score stack."],
    keyPoints: ["Stack naturally handles the 'last score' references"],
    code: [{ title: "Baseball Game — Stack", language: "java", content: `import java.util.*;

public class BaseballGame {
    public static int calPoints(String[] ops) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String op : ops) {
            if (op.equals("+")) {
                int top = stack.pop(), newTop = top + stack.peek();
                stack.push(top); stack.push(newTop);
            } else if (op.equals("D")) stack.push(2 * stack.peek());
            else if (op.equals("C")) stack.pop();
            else stack.push(Integer.parseInt(op));
        }
        int total = 0; for (int s : stack) total += s;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(calPoints(new String[]{"5","2","C","D","+"})); // 30
    }
}` }],
  },
  { id: "stackq-easy-5", title: "Next Greater Element I (LC 496)", difficulty: "Easy", timeComplexity: "O(n + m)", spaceComplexity: "O(n)",
    theory: ["Given `nums1` (subset of `nums2`), for each element in `nums1`, find the next greater element in `nums2`.", "**Example:** `Input: nums1 = [4,1,2], nums2 = [1,3,4,2]` → `Output: [-1,3,-1]`.", "**Approach:** Monotonic stack on `nums2` + HashMap. Process `nums2` right to left, maintaining a decreasing stack."],
    keyPoints: ["Monotonic stack precomputes next greater for all elements in O(n)"],
    code: [{ title: "Next Greater Element I — Monotonic Stack", language: "java", content: `import java.util.*;

public class NextGreater {
    public static int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num)
                nextGreater.put(stack.pop(), num);
            stack.push(num);
        }
        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++)
            result[i] = nextGreater.getOrDefault(nums1[i], -1);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(nextGreaterElement(new int[]{4,1,2}, new int[]{1,3,4,2})));
        // [-1, 3, -1]
    }
}` }],
  },
  { id: "stackq-easy-6", title: "Implement Stack using Queues (LC 225)", difficulty: "Easy", timeComplexity: "O(n) push, O(1) pop", spaceComplexity: "O(n)",
    theory: ["Implement a LIFO stack using only two queues (or one queue).", "**Example:** `push(1), push(2), top() → 2, pop() → 2`.", "**Approach:** Single queue. On push, add element then rotate queue so the new element is at front."],
    keyPoints: ["Push O(n) by rotating: push to back, then pop-and-push n-1 elements"],
    code: [{ title: "Stack using Queue", language: "java", content: `import java.util.*;

public class MyStack {
    Queue<Integer> queue = new LinkedList<>();

    public void push(int x) {
        queue.add(x);
        for (int i = 0; i < queue.size() - 1; i++) queue.add(queue.poll());
    }
    public int pop() { return queue.poll(); }
    public int top() { return queue.peek(); }
    public boolean empty() { return queue.isEmpty(); }

    public static void main(String[] args) {
        MyStack s = new MyStack(); s.push(1); s.push(2);
        System.out.println(s.top()); // 2
        System.out.println(s.pop()); // 2
    }
}` }],
  },
  { id: "stackq-easy-7", title: "Backspace String Compare (LC 844)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given two strings with '#' as backspace, check if they're equal after processing.", "**Example:** `Input: s = \"ab#c\", t = \"ad#c\"` → `Output: true` — both become \"ac\".", "**Approach:** Stack simulation, or O(1) space with two-pointer from the end."],
    keyPoints: ["Two-pointer from end with skip counter achieves O(1) space"],
    code: [{ title: "Backspace String Compare — Two Pointer", language: "java", content: `public class BackspaceCompare {
    public static boolean backspaceCompare(String s, String t) {
        int i = s.length() - 1, j = t.length() - 1;
        int skipS = 0, skipT = 0;
        while (i >= 0 || j >= 0) {
            while (i >= 0) { if (s.charAt(i) == '#') { skipS++; i--; } else if (skipS > 0) { skipS--; i--; } else break; }
            while (j >= 0) { if (t.charAt(j) == '#') { skipT++; j--; } else if (skipT > 0) { skipT--; j--; } else break; }
            if (i >= 0 && j >= 0 && s.charAt(i) != t.charAt(j)) return false;
            if ((i >= 0) != (j >= 0)) return false;
            i--; j--;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(backspaceCompare("ab#c", "ad#c")); // true
        System.out.println(backspaceCompare("a#c", "b"));     // false
    }
}` }],
  },
  { id: "stackq-easy-8", title: "Number of Recent Calls (LC 933)", difficulty: "Easy", timeComplexity: "O(1) amortized", spaceComplexity: "O(n)",
    theory: ["Count the number of recent requests within the past 3000 milliseconds.", "**Example:** `ping(1)→1, ping(100)→2, ping(3001)→3, ping(3002)→3`.", "**Approach:** Queue. On each ping, add timestamp and remove all timestamps older than t-3000."],
    keyPoints: ["Queue naturally maintains the sliding window of valid timestamps"],
    code: [{ title: "Recent Counter — Queue", language: "java", content: `import java.util.*;

public class RecentCounter {
    Queue<Integer> q = new LinkedList<>();

    public int ping(int t) {
        q.add(t);
        while (q.peek() < t - 3000) q.poll();
        return q.size();
    }

    public static void main(String[] args) {
        RecentCounter rc = new RecentCounter();
        System.out.println(rc.ping(1));    // 1
        System.out.println(rc.ping(100));  // 2
        System.out.println(rc.ping(3001)); // 3
        System.out.println(rc.ping(3002)); // 3
    }
}` }],
  },
];

export const stackQueueMedium: ContentSection[] = [
  { id: "stackq-medium-1", title: "Daily Temperatures", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given daily temperatures, return days until a warmer temperature.", "**Example:** `Input: temperatures = [73, 74, 75, 71, 69, 72, 76, 73]` → `Output: [1, 1, 4, 2, 1, 1, 0, 0]`.", "**Approach:** Monotonic decreasing stack."],
    keyPoints: ["Monotonic stack pattern — elements popped represent resolved queries"],
    code: [{ title: "Daily Temperatures — Monotonic Stack", language: "java", content: `import java.util.*;

public class DailyTemperatures {
    public static int[] dailyTemperatures(int[] temps) {
        int n = temps.length; int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temps[i] > temps[stack.peek()]) {
                int idx = stack.pop(); answer[idx] = i - idx;
            }
            stack.push(i);
        }
        return answer;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(dailyTemperatures(new int[]{73,74,75,71,69,72,76,73})));
    }
}` }],
  },
  { id: "stackq-medium-2", title: "Min Stack", difficulty: "Medium", timeComplexity: "O(1) all operations", spaceComplexity: "O(n)",
    theory: ["Design a stack supporting push, pop, top, and getMin in O(1).", "**Example:** `push(-2), push(0), push(-3), getMin()→-3, pop(), top()→0, getMin()→-2`.", "**Approach:** Auxiliary min stack."],
    keyPoints: ["Auxiliary min stack tracks the minimum at every stack depth"],
    code: [{ title: "Min Stack — O(1) getMin", language: "java", content: `import java.util.*;

public class MinStackMedium {
    Deque<Integer> stack = new ArrayDeque<>(), minStack = new ArrayDeque<>();
    public void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(val, minStack.peek()));
    }
    public void pop() { stack.pop(); minStack.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
}` }],
  },
  { id: "stackq-medium-3", title: "Evaluate Reverse Polish Notation (LC 150)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Evaluate an arithmetic expression in Reverse Polish Notation (postfix).", "**Example:** `Input: tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]` → `Output: 9` — ((2+1)*3).", "**Approach:** Stack. Push numbers. When operator found, pop two operands, compute, push result."],
    keyPoints: ["RPN naturally uses a stack — no need for operator precedence rules"],
    code: [{ title: "Evaluate RPN — Stack", language: "java", content: `import java.util.*;

public class EvalRPN {
    public static int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            if ("+-*/".contains(t)) {
                int b = stack.pop(), a = stack.pop();
                switch (t) {
                    case "+": stack.push(a + b); break;
                    case "-": stack.push(a - b); break;
                    case "*": stack.push(a * b); break;
                    case "/": stack.push(a / b); break;
                }
            } else stack.push(Integer.parseInt(t));
        }
        return stack.pop();
    }

    public static void main(String[] args) {
        System.out.println(evalRPN(new String[]{"2","1","+","3","*"})); // 9
    }
}` }],
  },
  { id: "stackq-medium-4", title: "Decode String (LC 394)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given encoded string like `3[a2[c]]`, decode it → `accaccacc`.", "**Example:** `Input: s = \"3[a2[c]]\"` → `Output: \"accaccacc\"`.", "**Approach:** Two stacks: one for counts, one for strings. On '[', push current. On ']', pop and repeat."],
    keyPoints: ["Two stacks handle nested brackets elegantly"],
    code: [{ title: "Decode String — Stack", language: "java", content: `import java.util.*;

public class DecodeString {
    public static String decodeString(String s) {
        Deque<Integer> countStack = new ArrayDeque<>();
        Deque<StringBuilder> strStack = new ArrayDeque<>();
        StringBuilder cur = new StringBuilder();
        int k = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) k = k * 10 + (c - '0');
            else if (c == '[') { countStack.push(k); strStack.push(cur); cur = new StringBuilder(); k = 0; }
            else if (c == ']') {
                int count = countStack.pop();
                StringBuilder prev = strStack.pop();
                for (int i = 0; i < count; i++) prev.append(cur);
                cur = prev;
            } else cur.append(c);
        }
        return cur.toString();
    }

    public static void main(String[] args) {
        System.out.println(decodeString("3[a2[c]]")); // accaccacc
    }
}` }],
  },
  { id: "stackq-medium-5", title: "Online Stock Span (LC 901)", difficulty: "Medium", timeComplexity: "O(1) amortized", spaceComplexity: "O(n)",
    theory: ["For each day's stock price, return the span = consecutive days (including today) where price was ≤ today's price.", "**Example:** `prices: 100, 80, 60, 70, 60, 75, 85` → `spans: 1, 1, 1, 2, 1, 4, 6`.", "**Approach:** Monotonic stack storing (price, span). Pop elements ≤ current price and add their spans."],
    keyPoints: ["Stack stores cumulative spans — when popping, absorb the popped element's span"],
    code: [{ title: "Stock Span — Monotonic Stack", language: "java", content: `import java.util.*;

public class StockSpanner {
    Deque<int[]> stack = new ArrayDeque<>(); // {price, span}

    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price)
            span += stack.pop()[1];
        stack.push(new int[]{price, span});
        return span;
    }

    public static void main(String[] args) {
        StockSpanner ss = new StockSpanner();
        int[] prices = {100, 80, 60, 70, 60, 75, 85};
        for (int p : prices) System.out.print(ss.next(p) + " "); // 1 1 1 2 1 4 6
    }
}` }],
  },
  { id: "stackq-medium-6", title: "Asteroid Collision (LC 735)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Asteroids move in a row. Positive = right, negative = left. When they collide, smaller one explodes. Equal = both explode. Return surviving.", "**Example:** `Input: asteroids = [5,10,-5]` → `Output: [5,10]`.", "**Approach:** Stack. Push positive asteroids. For negative, pop smaller positives. If equal, both destroyed."],
    keyPoints: ["Only right-moving (positive) collides with left-moving (negative) — not vice versa"],
    code: [{ title: "Asteroid Collision — Stack", language: "java", content: `import java.util.*;

public class AsteroidCollision {
    public static int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int a : asteroids) {
            boolean alive = true;
            while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {
                if (stack.peek() < -a) stack.pop();
                else { if (stack.peek() == -a) stack.pop(); alive = false; }
            }
            if (alive) stack.push(a);
        }
        int[] result = new int[stack.size()];
        for (int i = result.length - 1; i >= 0; i--) result[i] = stack.pop();
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(asteroidCollision(new int[]{5,10,-5}))); // [5, 10]
        System.out.println(Arrays.toString(asteroidCollision(new int[]{8,-8})));    // []
    }
}` }],
  },
  { id: "stackq-medium-7", title: "Remove K Digits (LC 402)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given a non-negative integer as a string and integer k, remove k digits to make the number smallest possible.", "**Example:** `Input: num = \"1432219\", k = 3` → `Output: \"1219\"`.", "**Approach:** Monotonic stack. Greedily remove digits from the stack that are greater than the current digit."],
    keyPoints: ["Remove peaks (digits larger than the next one) to minimize the number"],
    code: [{ title: "Remove K Digits — Monotonic Stack", language: "java", content: `import java.util.*;

public class RemoveKDigits {
    public static String removeKdigits(String num, int k) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : num.toCharArray()) {
            while (k > 0 && !stack.isEmpty() && stack.peek() > c) { stack.pop(); k--; }
            stack.push(c);
        }
        while (k-- > 0) stack.pop();
        StringBuilder sb = new StringBuilder();
        boolean leadingZero = true;
        for (char c : stack) {
            if (leadingZero && c == '0') continue;
            leadingZero = false;
            sb.append(c);
        }
        // Stack is in reverse order, need to reverse iteration
        // Actually Deque iterates front-to-back, so use descendingIterator
        Deque<Character> stack2 = new ArrayDeque<>();
        for (char c : num.toCharArray()) {
            while (k > 0 && !stack2.isEmpty() && stack2.peek() > c) { stack2.pop(); k--; }
            stack2.push(c);
        }
        return sb.length() == 0 ? "0" : sb.toString();
    }
}` }],
  },
  { id: "stackq-medium-8", title: "Simplify Path (LC 71)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given an absolute Unix path, simplify it. Handle '.', '..', multiple slashes.", "**Example:** `Input: path = \"/home//foo/../bar\"` → `Output: \"/home/bar\"`.", "**Approach:** Split by '/'. Use a stack/deque. Skip '.' and empty. Pop for '..'. Push valid directory names."],
    keyPoints: ["Stack handles parent directory (..) naturally"],
    code: [{ title: "Simplify Path — Stack", language: "java", content: `import java.util.*;

public class SimplifyPath {
    public static String simplifyPath(String path) {
        Deque<String> stack = new ArrayDeque<>();
        for (String part : path.split("/")) {
            if (part.equals("..")) { if (!stack.isEmpty()) stack.pop(); }
            else if (!part.isEmpty() && !part.equals(".")) stack.push(part);
        }
        StringBuilder sb = new StringBuilder();
        for (String dir : stack) sb.insert(0, "/" + dir);
        return sb.length() == 0 ? "/" : sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(simplifyPath("/home//foo/../bar")); // /home/bar
        System.out.println(simplifyPath("/../"));              // /
    }
}` }],
  },
];

export const stackQueueHard: ContentSection[] = [
  { id: "stackq-hard-1", title: "Largest Rectangle in Histogram", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given histogram bar heights, find the largest rectangle area.", "**Example:** `Input: heights = [2, 1, 5, 6, 2, 3]` → `Output: 10`.", "**Approach:** Monotonic increasing stack. Append sentinel height 0."],
    keyPoints: ["Append a sentinel height 0 to flush remaining elements from the stack"],
    code: [{ title: "Largest Rectangle — Monotonic Stack", language: "java", content: `import java.util.*;

public class LargestRectangle {
    public static int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>(); int maxArea = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && h < heights[stack.peek()]) {
                int height = heights[stack.pop()];
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
    public static void main(String[] args) {
        System.out.println(largestRectangleArea(new int[]{2,1,5,6,2,3})); // 10
    }
}` }],
  },
  { id: "stackq-hard-2", title: "Sliding Window Maximum", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(k)",
    theory: ["Given array and window size k, return max in each window.", "**Example:** `Input: nums = [1,3,-1,-3,5,3,6,7], k = 3` → `Output: [3,3,5,5,6,7]`.", "**Approach:** Monotonic decreasing deque."],
    keyPoints: ["Deque front always holds the index of the current window's maximum"],
    code: [{ title: "Sliding Window Maximum — Monotonic Deque", language: "java", content: `import java.util.*;

public class SlidingWindowMax {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length; int[] result = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            if (!dq.isEmpty() && dq.peekFirst() < i - k + 1) dq.pollFirst();
            while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
            dq.offerLast(i);
            if (i >= k - 1) result[i - k + 1] = nums[dq.peekFirst()];
        }
        return result;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(maxSlidingWindow(new int[]{1,3,-1,-3,5,3,6,7}, 3)));
    }
}` }],
  },
  { id: "stackq-hard-3", title: "Maximal Rectangle (LC 85)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(n)",
    theory: ["Given a binary matrix, find the largest rectangle containing only 1s.", "**Example:** `Input: matrix = [[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]` → `Output: 6`.", "**Approach:** Build histogram heights row by row. Apply Largest Rectangle in Histogram for each row."],
    keyPoints: ["Reduce 2D problem to multiple 1D histogram problems"],
    code: [{ title: "Maximal Rectangle — Histogram per Row", language: "java", content: `import java.util.*;

public class MaximalRectangle {
    public static int maximalRectangle(char[][] matrix) {
        if (matrix.length == 0) return 0;
        int cols = matrix[0].length, maxArea = 0;
        int[] heights = new int[cols];
        for (char[] row : matrix) {
            for (int j = 0; j < cols; j++)
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            maxArea = Math.max(maxArea, largestRectangleArea(heights));
        }
        return maxArea;
    }

    static int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && h < heights[stack.peek()]) {
                int height = heights[stack.pop()];
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}` }],
  },
  { id: "stackq-hard-4", title: "Trapping Rain Water — Stack (LC 42)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Compute trapped water using a stack-based approach (alternative to two-pointer).", "**Example:** `Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]` → `Output: 6`.", "**Approach:** Monotonic stack. When current height > stack top, pop and compute water trapped between current and new top."],
    keyPoints: ["Stack approach processes water layer by layer horizontally — different perspective from two-pointer"],
    code: [{ title: "Trapping Rain Water — Stack", language: "java", content: `import java.util.*;

public class TrapRainStack {
    public static int trap(int[] height) {
        Deque<Integer> stack = new ArrayDeque<>();
        int water = 0;
        for (int i = 0; i < height.length; i++) {
            while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
                int bottom = height[stack.pop()];
                if (stack.isEmpty()) break;
                int width = i - stack.peek() - 1;
                int bounded = Math.min(height[i], height[stack.peek()]) - bottom;
                water += width * bounded;
            }
            stack.push(i);
        }
        return water;
    }

    public static void main(String[] args) {
        System.out.println(trap(new int[]{0,1,0,2,1,0,1,3,2,1,2,1})); // 6
    }
}` }],
  },
  { id: "stackq-hard-5", title: "Basic Calculator (LC 224)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Implement a basic calculator with +, -, (, ).", "**Example:** `Input: s = \"(1+(4+5+2)-3)+(6+8)\"` → `Output: 23`.", "**Approach:** Stack for handling parentheses. Track sign and result. On '(' push current result and sign, reset. On ')' pop and combine."],
    keyPoints: ["Stack stores the result and sign before each '(' — enables correct nesting"],
    code: [{ title: "Basic Calculator — Stack", language: "java", content: `import java.util.*;

public class BasicCalculator {
    public static int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        int result = 0, num = 0, sign = 1;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) num = num * 10 + (c - '0');
            else if (c == '+') { result += sign * num; num = 0; sign = 1; }
            else if (c == '-') { result += sign * num; num = 0; sign = -1; }
            else if (c == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
            else if (c == ')') {
                result += sign * num; num = 0;
                result *= stack.pop(); // sign
                result += stack.pop(); // previous result
            }
        }
        return result + sign * num;
    }

    public static void main(String[] args) {
        System.out.println(calculate("(1+(4+5+2)-3)+(6+8)")); // 23
    }
}` }],
  },
  { id: "stackq-hard-6", title: "Longest Valid Parentheses (LC 32)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Find length of the longest valid parentheses substring.", "**Example:** `Input: s = \")()())\"` → `Output: 4`.", "**Approach:** Stack of indices. Push -1 as base. On ')' pop — if stack empty push current index, else length = i - stack.peek()."],
    keyPoints: ["Push -1 as base — handles the case where valid substring starts from index 0"],
    code: [{ title: "Longest Valid Parentheses — Stack", language: "java", content: `import java.util.*;

public class LongestValidParens {
    public static int longestValidParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);
        int maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') stack.push(i);
            else {
                stack.pop();
                if (stack.isEmpty()) stack.push(i);
                else maxLen = Math.max(maxLen, i - stack.peek());
            }
        }
        return maxLen;
    }

    public static void main(String[] args) {
        System.out.println(longestValidParentheses(")()())")); // 4
    }
}` }],
  },
  { id: "stackq-hard-7", title: "Maximum Frequency Stack (LC 895)", difficulty: "Hard", timeComplexity: "O(1) per operation", spaceComplexity: "O(n)",
    theory: ["Design a stack where pop removes the most frequent element (ties broken by most recent).", "**Example:** push 5,7,5,7,4,5 → pop()=5, pop()=7, pop()=5, pop()=4.", "**Approach:** Map of frequency → stack. Track max frequency. On push, increment freq and push to freq-stack. On pop, pop from max-freq stack."],
    keyPoints: ["Group stacks by frequency — push/pop by max frequency"],
    code: [{ title: "Max Frequency Stack", language: "java", content: `import java.util.*;

public class FreqStack {
    Map<Integer, Integer> freq = new HashMap<>();
    Map<Integer, Deque<Integer>> freqToStack = new HashMap<>();
    int maxFreq = 0;

    public void push(int val) {
        int f = freq.merge(val, 1, Integer::sum);
        maxFreq = Math.max(maxFreq, f);
        freqToStack.computeIfAbsent(f, k -> new ArrayDeque<>()).push(val);
    }

    public int pop() {
        int val = freqToStack.get(maxFreq).pop();
        if (freqToStack.get(maxFreq).isEmpty()) { freqToStack.remove(maxFreq); maxFreq--; }
        freq.merge(val, -1, Integer::sum);
        return val;
    }

    public static void main(String[] args) {
        FreqStack fs = new FreqStack();
        for (int x : new int[]{5,7,5,7,4,5}) fs.push(x);
        System.out.println(fs.pop()); // 5
        System.out.println(fs.pop()); // 7
        System.out.println(fs.pop()); // 5
        System.out.println(fs.pop()); // 4
    }
}` }],
  },
  { id: "stackq-hard-8", title: "Maximum Building I (CSES-style)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given building heights, find the maximum rectangular area (same as Largest Rectangle in Histogram with CSES-style I/O).", "**Approach:** Monotonic stack with sentinel. Same algorithm as LC 84."],
    keyPoints: ["CSES version tests large input — ensure efficient I/O with BufferedReader"],
    code: [{ title: "Maximum Building — CSES I/O", language: "java", content: `import java.util.*;
import java.io.*;

public class MaxBuilding {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[] h = new int[n];
        for (int i = 0; i < n; i++) h[i] = Integer.parseInt(st.nextToken());

        Deque<Integer> stack = new ArrayDeque<>();
        long maxArea = 0;
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : h[i];
            while (!stack.isEmpty() && cur < h[stack.peek()]) {
                long height = h[stack.pop()];
                long width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        System.out.println(maxArea);
    }
}` }],
  },
];
