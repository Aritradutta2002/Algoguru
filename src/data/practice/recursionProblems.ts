import { ContentSection } from "../recursionContent";

export const recursionPracticeEasy: ContentSection[] = [
  { id: "recursion-easy-1", title: "Power of Two", difficulty: "Easy", timeComplexity: "O(log n)", spaceComplexity: "O(log n)",
    theory: ["Given an integer `n`, return `true` if it is a power of two.", "**Example:** `Input: n = 16` → `Output: true` (2^4 = 16).", "**Approach:** Recursively divide by 2. Base case: `n == 1` → true, `n <= 0` or `n` is odd → false."],
    keyPoints: ["Bit trick alternative: `n > 0 && (n & (n-1)) == 0`"],
    code: [{ title: "Power of Two — Recursive", language: "java", content: `public class PowerOfTwo {
    public static boolean isPowerOfTwo(int n) {
        if (n <= 0) return false;
        if (n == 1) return true;
        if (n % 2 != 0) return false;
        return isPowerOfTwo(n / 2);
    }
    public static void main(String[] args) {
        System.out.println(isPowerOfTwo(16)); // true
        System.out.println(isPowerOfTwo(6));  // false
    }
}` }],
  },
  { id: "recursion-easy-2", title: "Generate All Subsets", difficulty: "Easy", timeComplexity: "O(n * 2^n)", spaceComplexity: "O(n)",
    theory: ["Given an integer array `nums` of unique elements, return all possible subsets (the power set).", "**Example:** `Input: nums = [1, 2, 3]` → `Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]`.", "**Approach:** Backtracking. At each index, choose to include or exclude the current element."],
    keyPoints: ["Backtracking with include/exclude at each position generates all 2^n subsets"],
    code: [{ title: "Generate All Subsets — Backtracking", language: "java", content: `import java.util.*;

public class Subsets {
    public static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }
    static void backtrack(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));
        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);
            backtrack(nums, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }
    public static void main(String[] args) {
        System.out.println(subsets(new int[]{1, 2, 3}));
    }
}` }],
  },
  { id: "recursion-easy-3", title: "Reverse String using Recursion", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Reverse a character array in-place using recursion.", "**Example:** `Input: s = ['h','e','l','l','o']` → `Output: ['o','l','l','e','h']`.", "**Approach:** Recursive two-pointer swap. Swap `s[left]` and `s[right]`, then recurse on `(left+1, right-1)`."],
    keyPoints: ["Base case: `left >= right` → stop recursion"],
    code: [{ title: "Reverse String — Recursive", language: "java", content: `public class ReverseString {
    public static void reverseString(char[] s) { reverse(s, 0, s.length - 1); }
    static void reverse(char[] s, int left, int right) {
        if (left >= right) return;
        char tmp = s[left]; s[left] = s[right]; s[right] = tmp;
        reverse(s, left + 1, right - 1);
    }
    public static void main(String[] args) {
        char[] s = {'h','e','l','l','o'};
        reverseString(s);
        System.out.println(java.util.Arrays.toString(s)); // [o, l, l, e, h]
    }
}` }],
  },
  { id: "recursion-easy-4", title: "Fibonacci Number (LC 509)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Calculate the nth Fibonacci number. F(0)=0, F(1)=1, F(n) = F(n-1) + F(n-2).", "**Example:** `Input: n = 6` → `Output: 8` — 0, 1, 1, 2, 3, 5, 8.", "**Approach:** Iterative with two variables. Pure recursion is O(2^n) — use memoization or iteration."],
    keyPoints: ["Naive recursion is O(2^n) — always optimize with DP or iteration", "This is the foundation of many DP problems"],
    code: [{ title: "Fibonacci — Iterative", language: "java", content: `public class Fibonacci {
    public static int fib(int n) {
        if (n <= 1) return n;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
        return b;
    }

    public static void main(String[] args) {
        System.out.println(fib(6));  // 8
        System.out.println(fib(10)); // 55
    }
}` }],
  },
  { id: "recursion-easy-5", title: "Climbing Stairs (LC 70)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["You're climbing stairs. Each time you can climb 1 or 2 steps. How many distinct ways to reach step `n`?", "**Example:** `Input: n = 5` → `Output: 8`.", "**Approach:** Same as Fibonacci. `ways(n) = ways(n-1) + ways(n-2)`."],
    keyPoints: ["Climbing stairs = Fibonacci in disguise"],
    code: [{ title: "Climbing Stairs", language: "java", content: `public class ClimbStairs {
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }
        return b;
    }

    public static void main(String[] args) {
        System.out.println(climbStairs(5)); // 8
    }
}` }],
  },
  { id: "recursion-easy-6", title: "Letter Case Permutation (LC 784)", difficulty: "Easy", timeComplexity: "O(2^n)", spaceComplexity: "O(n)",
    theory: ["Given a string `s`, transform every letter individually to be lowercase or uppercase to create another string. Return all possible strings.", "**Example:** `Input: s = \"a1b2\"` → `Output: [\"a1b2\",\"a1B2\",\"A1b2\",\"A1B2\"]`.", "**Approach:** Backtracking. At each letter, branch into lowercase and uppercase. Digits have no branching."],
    keyPoints: ["Only letters create branches — digits are fixed"],
    code: [{ title: "Letter Case Permutation — Backtracking", language: "java", content: `import java.util.*;

public class LetterCasePerm {
    public static List<String> letterCasePermutation(String s) {
        List<String> result = new ArrayList<>();
        backtrack(s.toCharArray(), 0, result);
        return result;
    }

    static void backtrack(char[] chars, int idx, List<String> result) {
        if (idx == chars.length) { result.add(new String(chars)); return; }
        if (Character.isLetter(chars[idx])) {
            chars[idx] = Character.toLowerCase(chars[idx]);
            backtrack(chars, idx + 1, result);
            chars[idx] = Character.toUpperCase(chars[idx]);
            backtrack(chars, idx + 1, result);
        } else {
            backtrack(chars, idx + 1, result);
        }
    }

    public static void main(String[] args) {
        System.out.println(letterCasePermutation("a1b2")); // [a1b2, a1B2, A1b2, A1B2]
    }
}` }],
  },
  { id: "recursion-easy-7", title: "Count Good Numbers (LC 1922)", difficulty: "Easy", timeComplexity: "O(log n)", spaceComplexity: "O(log n)",
    theory: ["A digit string is good if digits at even indices are even (0,2,4,6,8) and at odd indices are prime (2,3,5,7). Given length `n`, count good strings modulo 10^9+7.", "**Example:** `Input: n = 4` → `Output: 400` — 5 choices × 4 choices × 5 choices × 4 choices = 400.", "**Approach:** Even positions have 5 choices, odd positions have 4 choices. Use fast exponentiation: `5^ceil(n/2) * 4^floor(n/2) mod 10^9+7`."],
    keyPoints: ["Fast modular exponentiation is key for handling large n"],
    code: [{ title: "Count Good Numbers — Fast Exponentiation", language: "java", content: `public class GoodNumbers {
    static final long MOD = 1_000_000_007;

    public static int countGoodNumbers(long n) {
        long evens = (n + 1) / 2;
        long odds = n / 2;
        return (int) (power(5, evens) % MOD * power(4, odds) % MOD);
    }

    static long power(long base, long exp) {
        long result = 1;
        base %= MOD;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % MOD;
            base = base * base % MOD;
            exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(countGoodNumbers(4));  // 400
        System.out.println(countGoodNumbers(50)); // 564908303
    }
}` }],
  },
  { id: "recursion-easy-8", title: "Sum of Digits (Recursive)", difficulty: "Easy", timeComplexity: "O(log n)", spaceComplexity: "O(log n)",
    theory: ["Recursively compute the sum of digits of a non-negative integer.", "**Example:** `Input: n = 1234` → `Output: 10` — 1+2+3+4 = 10.", "**Approach:** Base case: `n < 10` return `n`. Recursive: `n % 10 + sumDigits(n / 10)`."],
    keyPoints: ["Simple recursion practice — foundation for understanding recursive decomposition"],
    code: [{ title: "Sum of Digits — Recursive", language: "java", content: `public class SumDigits {
    public static int sumDigits(int n) {
        if (n < 10) return n;
        return n % 10 + sumDigits(n / 10);
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(1234));  // 10
        System.out.println(sumDigits(9999));  // 36
    }
}` }],
  },
];

export const recursionPracticeMedium: ContentSection[] = [
  { id: "recursion-medium-1", title: "Permutations", difficulty: "Medium", timeComplexity: "O(n * n!)", spaceComplexity: "O(n)",
    theory: ["Given an array of distinct integers, return all possible permutations.", "**Example:** `Input: nums = [1, 2, 3]` → `Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`.", "**Approach:** Swap-based backtracking. Fix element at current index by swapping with each subsequent element, recurse, then swap back."],
    keyPoints: ["Swap-based approach avoids the need for a `used` boolean array"],
    code: [{ title: "Permutations — Swap Backtracking", language: "java", content: `import java.util.*;

public class Permutations {
    public static List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, result);
        return result;
    }
    static void backtrack(int[] nums, int idx, List<List<Integer>> result) {
        if (idx == nums.length) {
            List<Integer> perm = new ArrayList<>();
            for (int n : nums) perm.add(n);
            result.add(perm);
            return;
        }
        for (int i = idx; i < nums.length; i++) {
            swap(nums, idx, i);
            backtrack(nums, idx + 1, result);
            swap(nums, idx, i);
        }
    }
    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
    public static void main(String[] args) { System.out.println(permute(new int[]{1, 2, 3})); }
}` }],
  },
  { id: "recursion-medium-2", title: "Combination Sum", difficulty: "Medium", timeComplexity: "O(2^(target/min))", spaceComplexity: "O(target/min)",
    theory: ["Given an array of distinct integers `candidates` and a target, return all unique combinations where the numbers sum to target. Each number may be used unlimited times.", "**Example:** `Input: candidates = [2, 3, 6, 7], target = 7` → `Output: [[2, 2, 3], [7]]`.", "**Approach:** Backtracking with the same start index (allowing reuse). Prune when remaining < 0."],
    keyPoints: ["Using the same start index allows unlimited reuse of elements"],
    code: [{ title: "Combination Sum — Backtracking", language: "java", content: `import java.util.*;

public class CombinationSum {
    public static List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(candidates);
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }
    static void backtrack(int[] c, int remain, int start, List<Integer> cur, List<List<Integer>> res) {
        if (remain == 0) { res.add(new ArrayList<>(cur)); return; }
        for (int i = start; i < c.length && c[i] <= remain; i++) {
            cur.add(c[i]);
            backtrack(c, remain - c[i], i, cur, res);
            cur.remove(cur.size() - 1);
        }
    }
    public static void main(String[] args) {
        System.out.println(combinationSum(new int[]{2,3,6,7}, 7)); // [[2,2,3], [7]]
    }
}` }],
  },
  { id: "recursion-medium-3", title: "Word Search", difficulty: "Medium", timeComplexity: "O(m * n * 4^L)", spaceComplexity: "O(L)",
    theory: ["Given an m×n grid and a word, find if the word exists by following adjacent cells. Same cell can't be used twice.", "**Example:** `Input: board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"` → `Output: true`.", "**Approach:** DFS from each cell. Mark visited cells, explore 4 directions, backtrack by restoring original value."],
    keyPoints: ["Temporarily marking visited cells in-place avoids extra space for a visited array"],
    code: [{ title: "Word Search — DFS Backtracking", language: "java", content: `public class WordSearch {
    public static boolean exist(char[][] board, String word) {
        for (int i = 0; i < board.length; i++)
            for (int j = 0; j < board[0].length; j++)
                if (dfs(board, word, i, j, 0)) return true;
        return false;
    }
    static boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true;
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(idx)) return false;
        char temp = board[r][c];
        board[r][c] = '#';
        boolean found = dfs(board, word, r+1, c, idx+1) || dfs(board, word, r-1, c, idx+1)
                     || dfs(board, word, r, c+1, idx+1) || dfs(board, word, r, c-1, idx+1);
        board[r][c] = temp;
        return found;
    }
    public static void main(String[] args) {
        char[][] board = {{'A','B','C','E'},{'S','F','C','S'},{'A','D','E','E'}};
        System.out.println(exist(board, "ABCCED")); // true
    }
}` }],
  },
  { id: "recursion-medium-4", title: "Letter Combinations of Phone (LC 17)", difficulty: "Medium", timeComplexity: "O(4^n)", spaceComplexity: "O(n)",
    theory: ["Given a string of digits 2-9, return all possible letter combinations (like phone keypad).", "**Example:** `Input: digits = \"23\"` → `Output: [\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]`.", "**Approach:** Backtracking. For each digit, iterate its mapped letters and recurse on remaining digits."],
    keyPoints: ["Phone keypad mapping: each digit maps to 3-4 letters"],
    code: [{ title: "Letter Combinations — Backtracking", language: "java", content: `import java.util.*;

public class LetterCombinations {
    static String[] mapping = {"","","abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};

    public static List<String> letterCombinations(String digits) {
        List<String> result = new ArrayList<>();
        if (digits.isEmpty()) return result;
        backtrack(digits, 0, new StringBuilder(), result);
        return result;
    }

    static void backtrack(String digits, int idx, StringBuilder sb, List<String> result) {
        if (idx == digits.length()) { result.add(sb.toString()); return; }
        for (char c : mapping[digits.charAt(idx) - '0'].toCharArray()) {
            sb.append(c);
            backtrack(digits, idx + 1, sb, result);
            sb.deleteCharAt(sb.length() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(letterCombinations("23"));
        // [ad, ae, af, bd, be, bf, cd, ce, cf]
    }
}` }],
  },
  { id: "recursion-medium-5", title: "Generate Parentheses (LC 22)", difficulty: "Medium", timeComplexity: "O(4^n / sqrt(n))", spaceComplexity: "O(n)",
    theory: ["Given `n` pairs of parentheses, generate all combinations of well-formed parentheses.", "**Example:** `Input: n = 3` → `Output: [\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]`.", "**Approach:** Backtracking. Track open and close counts. Add '(' if open < n. Add ')' if close < open."],
    keyPoints: ["Constraint: close count ≤ open count ≤ n — ensures validity"],
    code: [{ title: "Generate Parentheses — Backtracking", language: "java", content: `import java.util.*;

public class GenerateParentheses {
    public static List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(new char[2 * n], 0, 0, 0, n, result);
        return result;
    }

    static void backtrack(char[] cur, int idx, int open, int close, int n, List<String> result) {
        if (idx == 2 * n) { result.add(new String(cur)); return; }
        if (open < n) { cur[idx] = '('; backtrack(cur, idx + 1, open + 1, close, n, result); }
        if (close < open) { cur[idx] = ')'; backtrack(cur, idx + 1, open, close + 1, n, result); }
    }

    public static void main(String[] args) {
        System.out.println(generateParenthesis(3));
        // [((())), (()()), (())(), ()(()), ()()()]
    }
}` }],
  },
  { id: "recursion-medium-6", title: "Subsets II (LC 90)", difficulty: "Medium", timeComplexity: "O(n * 2^n)", spaceComplexity: "O(n)",
    theory: ["Given an integer array `nums` that may contain duplicates, return all possible subsets. The result must not contain duplicate subsets.", "**Example:** `Input: nums = [1,2,2]` → `Output: [[],[1],[1,2],[1,2,2],[2],[2,2]]`.", "**Approach:** Sort first. In backtracking, skip consecutive duplicates at the same recursion level."],
    keyPoints: ["Sort + skip duplicates (`if (i > start && nums[i] == nums[i-1]) continue`) is the standard dedup pattern"],
    code: [{ title: "Subsets II — Backtracking with Dedup", language: "java", content: `import java.util.*;

public class SubsetsII {
    public static List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(int[] nums, int start, List<Integer> cur, List<List<Integer>> result) {
        result.add(new ArrayList<>(cur));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            cur.add(nums[i]);
            backtrack(nums, i + 1, cur, result);
            cur.remove(cur.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(subsetsWithDup(new int[]{1, 2, 2}));
        // [[], [1], [1,2], [1,2,2], [2], [2,2]]
    }
}` }],
  },
  { id: "recursion-medium-7", title: "Combinations (LC 77)", difficulty: "Medium", timeComplexity: "O(C(n,k) * k)", spaceComplexity: "O(k)",
    theory: ["Given two integers `n` and `k`, return all possible combinations of `k` numbers chosen from `[1, n]`.", "**Example:** `Input: n = 4, k = 2` → `Output: [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]`.", "**Approach:** Backtracking. Start from 1, pick each number, recurse with incremented start. Stop when k elements chosen."],
    keyPoints: ["Pruning: `if (n - i + 1 < k - cur.size()) return` avoids exploring dead branches"],
    code: [{ title: "Combinations — Backtracking", language: "java", content: `import java.util.*;

public class Combinations {
    public static List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(n, k, 1, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(int n, int k, int start, List<Integer> cur, List<List<Integer>> result) {
        if (cur.size() == k) { result.add(new ArrayList<>(cur)); return; }
        for (int i = start; i <= n - (k - cur.size()) + 1; i++) {
            cur.add(i);
            backtrack(n, k, i + 1, cur, result);
            cur.remove(cur.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(combine(4, 2));
        // [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
    }
}` }],
  },
  { id: "recursion-medium-8", title: "Restore IP Addresses (LC 93)", difficulty: "Medium", timeComplexity: "O(1) — bounded", spaceComplexity: "O(1)",
    theory: ["Given a string `s` of digits, return all possible valid IP addresses by inserting dots.", "**Example:** `Input: s = \"25525511135\"` → `Output: [\"255.255.11.135\",\"255.255.111.35\"]`.", "**Approach:** Backtracking with 4 segments. Each segment must be 0-255 with no leading zeros."],
    keyPoints: ["Exactly 4 segments, each 1-3 digits, value 0-255, no leading zeros"],
    code: [{ title: "Restore IP Addresses — Backtracking", language: "java", content: `import java.util.*;

public class RestoreIP {
    public static List<String> restoreIpAddresses(String s) {
        List<String> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(String s, int start, List<String> parts, List<String> result) {
        if (parts.size() == 4) {
            if (start == s.length()) result.add(String.join(".", parts));
            return;
        }
        for (int len = 1; len <= 3 && start + len <= s.length(); len++) {
            String part = s.substring(start, start + len);
            if (part.length() > 1 && part.charAt(0) == '0') break;
            if (Integer.parseInt(part) > 255) break;
            parts.add(part);
            backtrack(s, start + len, parts, result);
            parts.remove(parts.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(restoreIpAddresses("25525511135"));
        // [255.255.11.135, 255.255.111.35]
    }
}` }],
  },
];

export const recursionPracticeHard: ContentSection[] = [
  { id: "recursion-hard-1", title: "N-Queens", difficulty: "Hard", timeComplexity: "O(n!)", spaceComplexity: "O(n^2)",
    theory: ["Place N queens on an N×N chessboard such that no two queens threaten each other. Return all distinct solutions.", "**Example:** `Input: n = 4` → `Output: 2 solutions`.", "**Approach:** Place queens row by row. For each row, try every column. Use boolean arrays for O(1) conflict checking."],
    keyPoints: ["Boolean arrays for columns and diagonals give O(1) conflict checking", "Main diagonal: `row - col + n`, anti-diagonal: `row + col`"],
    code: [{ title: "N-Queens — Optimized Backtracking", language: "java", content: `import java.util.*;

public class NQueens {
    public static List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        boolean[] cols = new boolean[n], diag1 = new boolean[2*n], diag2 = new boolean[2*n];
        solve(board, 0, n, cols, diag1, diag2, result);
        return result;
    }
    static void solve(char[][] board, int row, int n, boolean[] cols, boolean[] d1, boolean[] d2, List<List<String>> res) {
        if (row == n) {
            List<String> snap = new ArrayList<>();
            for (char[] r : board) snap.add(new String(r));
            res.add(snap); return;
        }
        for (int col = 0; col < n; col++) {
            int dd1 = row - col + n, dd2 = row + col;
            if (cols[col] || d1[dd1] || d2[dd2]) continue;
            board[row][col] = 'Q'; cols[col] = d1[dd1] = d2[dd2] = true;
            solve(board, row + 1, n, cols, d1, d2, res);
            board[row][col] = '.'; cols[col] = d1[dd1] = d2[dd2] = false;
        }
    }
    public static void main(String[] args) { System.out.println(solveNQueens(4).size()); } // 2
}` }],
  },
  { id: "recursion-hard-2", title: "Sudoku Solver", difficulty: "Hard", timeComplexity: "O(9^(empty cells))", spaceComplexity: "O(81)",
    theory: ["Fill a 9×9 Sudoku board so every row, column, and 3×3 sub-box contains digits 1-9.", "**Approach:** Backtracking. Find the next empty cell, try digits 1-9, validate against row/column/box constraints, recurse."],
    keyPoints: ["Constraint checking: row, column, and 3×3 box must each contain unique digits"],
    code: [{ title: "Sudoku Solver — Backtracking", language: "java", content: `public class SudokuSolver {
    public static void solveSudoku(char[][] board) { solve(board); }
    static boolean solve(char[][] board) {
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++)
                if (board[r][c] == '.') {
                    for (char d = '1'; d <= '9'; d++) {
                        if (isValid(board, r, c, d)) {
                            board[r][c] = d;
                            if (solve(board)) return true;
                            board[r][c] = '.';
                        }
                    }
                    return false;
                }
        return true;
    }
    static boolean isValid(char[][] board, int r, int c, char d) {
        for (int i = 0; i < 9; i++) {
            if (board[r][i] == d) return false;
            if (board[i][c] == d) return false;
            if (board[3*(r/3)+i/3][3*(c/3)+i%3] == d) return false;
        }
        return true;
    }
}` }],
  },
  { id: "recursion-hard-3", title: "Word Break (LC 139)", difficulty: "Hard", timeComplexity: "O(n^2)", spaceComplexity: "O(n)",
    theory: ["Given a string `s` and a dictionary, determine if `s` can be segmented into dictionary words.", "**Example:** `Input: s = \"leetcode\", wordDict = [\"leet\",\"code\"]` → `Output: true`.", "**Approach:** DP. `dp[i]` = true if `s[0..i-1]` can be segmented. For each `i`, check all `j < i`: if `dp[j]` is true and `s[j..i]` is in dict."],
    keyPoints: ["DP avoids exponential backtracking — O(n^2) with HashSet lookups"],
    code: [{ title: "Word Break — DP", language: "java", content: `import java.util.*;

public class WordBreak {
    public static boolean wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++)
            for (int j = 0; j < i; j++)
                if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
        return dp[s.length()];
    }

    public static void main(String[] args) {
        System.out.println(wordBreak("leetcode", Arrays.asList("leet", "code"))); // true
        System.out.println(wordBreak("catsandog", Arrays.asList("cats","dog","sand","and","cat"))); // false
    }
}` }],
  },
  { id: "recursion-hard-4", title: "Expression Add Operators (LC 282)", difficulty: "Hard", timeComplexity: "O(4^n)", spaceComplexity: "O(n)",
    theory: ["Given a string of digits and a target value, add binary operators (+, -, *) between digits to make the expression equal to target.", "**Example:** `Input: num = \"123\", target = 6` → `Output: [\"1+2+3\", \"1*2*3\"]`.", "**Approach:** Backtracking. At each position, try different length numbers and all three operators. Track `prev` operand for multiplication precedence."],
    keyPoints: ["Track `prev` operand for '*' — undo previous addition and apply multiplication"],
    code: [{ title: "Expression Add Operators — Backtracking", language: "java", content: `import java.util.*;

public class ExpressionAddOps {
    public static List<String> addOperators(String num, int target) {
        List<String> result = new ArrayList<>();
        backtrack(num, target, 0, 0, 0, "", result);
        return result;
    }

    static void backtrack(String num, int target, int idx, long eval, long prev, String expr, List<String> result) {
        if (idx == num.length()) {
            if (eval == target) result.add(expr);
            return;
        }
        for (int i = idx; i < num.length(); i++) {
            if (i > idx && num.charAt(idx) == '0') break; // no leading zeros
            long cur = Long.parseLong(num.substring(idx, i + 1));
            if (idx == 0) {
                backtrack(num, target, i + 1, cur, cur, "" + cur, result);
            } else {
                backtrack(num, target, i + 1, eval + cur, cur, expr + "+" + cur, result);
                backtrack(num, target, i + 1, eval - cur, -cur, expr + "-" + cur, result);
                backtrack(num, target, i + 1, eval - prev + prev * cur, prev * cur, expr + "*" + cur, result);
            }
        }
    }

    public static void main(String[] args) {
        System.out.println(addOperators("123", 6));   // [1+2+3, 1*2*3]
        System.out.println(addOperators("232", 8));   // [2+3*2, 2*3+2]
    }
}` }],
  },
  { id: "recursion-hard-5", title: "Palindrome Partitioning II (LC 132)", difficulty: "Hard", timeComplexity: "O(n^2)", spaceComplexity: "O(n^2)",
    theory: ["Given a string `s`, return the minimum cuts needed to partition `s` into palindromic substrings.", "**Example:** `Input: s = \"aab\"` → `Output: 1` — One cut: [\"aa\", \"b\"].", "**Approach:** DP. `cuts[i]` = min cuts for `s[0..i]`. Precompute palindrome table with expand-around-center or 2D DP."],
    keyPoints: ["Precomputing the palindrome table avoids redundant palindrome checks during DP"],
    code: [{ title: "Palindrome Partitioning II — DP", language: "java", content: `public class PalPartitionII {
    public static int minCut(String s) {
        int n = s.length();
        boolean[][] isPal = new boolean[n][n];
        int[] cuts = new int[n];

        for (int i = 0; i < n; i++) {
            cuts[i] = i; // max cuts
            for (int j = 0; j <= i; j++) {
                if (s.charAt(j) == s.charAt(i) && (i - j <= 2 || isPal[j + 1][i - 1])) {
                    isPal[j][i] = true;
                    cuts[i] = j == 0 ? 0 : Math.min(cuts[i], cuts[j - 1] + 1);
                }
            }
        }
        return cuts[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(minCut("aab"));    // 1
        System.out.println(minCut("a"));      // 0
        System.out.println(minCut("abbab"));  // 1
    }
}` }],
  },
  { id: "recursion-hard-6", title: "Stickers to Spell Word (LC 691)", difficulty: "Hard", timeComplexity: "O(2^n * m)", spaceComplexity: "O(2^n)",
    theory: ["Given `n` stickers (each with some letters), find the minimum number of stickers to spell a target string. Each sticker can be used infinitely.", "**Example:** `Input: stickers = [\"with\",\"example\",\"science\"], target = \"thehat\"` → `Output: 3`.", "**Approach:** Bitmask DP. Represent target's remaining characters as a bitmask. For each state, try applying each sticker."],
    keyPoints: ["Bitmask represents which target characters are still needed", "BFS or memoized DFS over bitmask states"],
    code: [{ title: "Stickers to Spell Word — Bitmask DP", language: "java", content: `import java.util.*;

public class StickersToSpell {
    public static int minStickers(String[] stickers, String target) {
        int n = target.length(), N = 1 << n;
        int[] dp = new int[N];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;

        for (int mask = 0; mask < N; mask++) {
            if (dp[mask] == Integer.MAX_VALUE) continue;
            for (String sticker : stickers) {
                int newMask = mask;
                int[] freq = new int[26];
                for (char c : sticker.toCharArray()) freq[c - 'a']++;
                for (int i = 0; i < n; i++) {
                    if ((newMask & (1 << i)) != 0) continue;
                    if (freq[target.charAt(i) - 'a'] > 0) {
                        freq[target.charAt(i) - 'a']--;
                        newMask |= (1 << i);
                    }
                }
                dp[newMask] = Math.min(dp[newMask], dp[mask] + 1);
            }
        }
        return dp[N - 1] == Integer.MAX_VALUE ? -1 : dp[N - 1];
    }

    public static void main(String[] args) {
        System.out.println(minStickers(new String[]{"with","example","science"}, "thehat")); // 3
    }
}` }],
  },
  { id: "recursion-hard-7", title: "Chessboard and Queens (CSES)", difficulty: "Hard", timeComplexity: "O(n!)", spaceComplexity: "O(n)",
    theory: ["Place 8 queens on an 8×8 board with some cells blocked ('*'). Count valid placements where no two queens attack each other.", "**Example:** An 8×8 board with blocked cells → count of valid placements.", "**Approach:** Same as N-Queens but with additional constraint: skip blocked cells. Backtrack row by row."],
    keyPoints: ["Classic CSES problem — N-Queens with additional blocked cell constraints"],
    code: [{ title: "Chessboard and Queens — CSES", language: "java", content: `import java.util.*;

public class ChessboardQueens {
    static int count = 0;
    static char[][] board = new char[8][8];
    static boolean[] cols = new boolean[8], diag1 = new boolean[16], diag2 = new boolean[16];

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        for (int i = 0; i < 8; i++) board[i] = sc.nextLine().toCharArray();
        solve(0);
        System.out.println(count);
    }

    static void solve(int row) {
        if (row == 8) { count++; return; }
        for (int col = 0; col < 8; col++) {
            if (board[row][col] == '*') continue;
            if (cols[col] || diag1[row - col + 7] || diag2[row + col]) continue;
            cols[col] = diag1[row - col + 7] = diag2[row + col] = true;
            solve(row + 1);
            cols[col] = diag1[row - col + 7] = diag2[row + col] = false;
        }
    }
}` }],
  },
  { id: "recursion-hard-8", title: "Permutations II (LC 47)", difficulty: "Hard", timeComplexity: "O(n * n!)", spaceComplexity: "O(n)",
    theory: ["Given an array `nums` that might contain duplicates, return all possible unique permutations.", "**Example:** `Input: nums = [1,1,2]` → `Output: [[1,1,2],[1,2,1],[2,1,1]]`.", "**Approach:** Sort + backtracking with a `used` array. Skip duplicate elements at the same level: `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue`."],
    keyPoints: ["Sorting + skipping unused duplicates prevents repeated permutations"],
    code: [{ title: "Permutations II — Dedup Backtracking", language: "java", content: `import java.util.*;

public class PermutationsII {
    public static List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, new boolean[nums.length], new ArrayList<>(), result);
        return result;
    }

    static void backtrack(int[] nums, boolean[] used, List<Integer> cur, List<List<Integer>> result) {
        if (cur.size() == nums.length) { result.add(new ArrayList<>(cur)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            cur.add(nums[i]);
            backtrack(nums, used, cur, result);
            cur.remove(cur.size() - 1);
            used[i] = false;
        }
    }

    public static void main(String[] args) {
        System.out.println(permuteUnique(new int[]{1, 1, 2}));
        // [[1,1,2],[1,2,1],[2,1,1]]
    }
}` }],
  },
];
