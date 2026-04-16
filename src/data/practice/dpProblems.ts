import { ContentSection } from "../recursionContent";

export const dpPracticeEasy: ContentSection[] = [
  { id: "dp-easy-1", title: "Climbing Stairs", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["You are climbing a staircase. It takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways?", "**Example:** `Input: n = 4` → `Output: 5` — 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2.", "**Approach:** Fibonacci DP. `dp[i] = dp[i-1] + dp[i-2]`."],
    keyPoints: ["This is essentially the Fibonacci sequence"],
    code: [{ title: "Climbing Stairs — Space-Optimized DP", language: "java", content: `public class ClimbingStairs {
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }
        return b;
    }
    public static void main(String[] args) { System.out.println(climbStairs(4)); } // 5
}` }],
  },
  { id: "dp-easy-2", title: "Maximum Subarray (Kadane's)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Find the contiguous subarray with the largest sum.", "**Example:** `Input: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]` → `Output: 6` — subarray `[4, -1, 2, 1]`.", "**Approach:** Kadane's Algorithm. Maintain running sum; reset when it goes below the current element."],
    keyPoints: ["Kadane's is a greedy/DP hybrid — one of the most elegant O(n) algorithms"],
    code: [{ title: "Kadane's Algorithm", language: "java", content: `public class MaxSubarray {
    public static int maxSubArray(int[] nums) {
        int maxSum = nums[0], curSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            curSum = Math.max(nums[i], curSum + nums[i]);
            maxSum = Math.max(maxSum, curSum);
        }
        return maxSum;
    }
    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); // 6
    }
}` }],
  },
  { id: "dp-easy-3", title: "House Robber", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given an array representing money in each house, find max money you can rob without robbing two adjacent houses.", "**Example:** `Input: nums = [2, 7, 9, 3, 1]` → `Output: 12`.", "**Approach:** `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`."],
    keyPoints: ["Classic DP with two-variable space optimization"],
    code: [{ title: "House Robber", language: "java", content: `public class HouseRobber {
    public static int rob(int[] nums) {
        int prev2 = 0, prev1 = 0;
        for (int num : nums) { int cur = Math.max(prev1, prev2 + num); prev2 = prev1; prev1 = cur; }
        return prev1;
    }
    public static void main(String[] args) { System.out.println(rob(new int[]{2, 7, 9, 3, 1})); } // 12
}` }],
  },
  { id: "dp-easy-4", title: "Min Cost Climbing Stairs (LC 746)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Given an array `cost` where `cost[i]` is the cost of step `i`, find minimum cost to reach the top. You can start from step 0 or 1.", "**Example:** `Input: cost = [10, 15, 20]` → `Output: 15` — Start at step 1, pay 15, jump to top.", "**Approach:** `dp[i] = cost[i] + min(dp[i-1], dp[i-2])`. Answer is `min(dp[n-1], dp[n-2])`."],
    keyPoints: ["Similar to House Robber — two-variable space optimization works"],
    code: [{ title: "Min Cost Climbing Stairs", language: "java", content: `public class MinCostStairs {
    public static int minCostClimbingStairs(int[] cost) {
        int a = cost[0], b = cost[1];
        for (int i = 2; i < cost.length; i++) {
            int c = cost[i] + Math.min(a, b);
            a = b; b = c;
        }
        return Math.min(a, b);
    }

    public static void main(String[] args) {
        System.out.println(minCostClimbingStairs(new int[]{10, 15, 20})); // 15
        System.out.println(minCostClimbingStairs(new int[]{1,100,1,1,1,100,1,1,100,1})); // 6
    }
}` }],
  },
  { id: "dp-easy-5", title: "Pascal's Triangle (LC 118)", difficulty: "Easy", timeComplexity: "O(n^2)", spaceComplexity: "O(n^2)",
    theory: ["Generate the first `numRows` of Pascal's triangle.", "**Example:** `Input: numRows = 5` → `Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]`.", "**Approach:** Each element = sum of the two elements above it. First and last elements of each row are 1."],
    keyPoints: ["Pascal's triangle is the foundation of binomial coefficients"],
    code: [{ title: "Pascal's Triangle", language: "java", content: `import java.util.*;

public class PascalsTriangle {
    public static List<List<Integer>> generate(int numRows) {
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < numRows; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j <= i; j++)
                row.add(j == 0 || j == i ? 1 : result.get(i-1).get(j-1) + result.get(i-1).get(j));
            result.add(row);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(generate(5));
    }
}` }],
  },
  { id: "dp-easy-6", title: "Counting Bits (LC 338)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given an integer `n`, return an array where `ans[i]` is the number of 1's in the binary representation of `i` for `0 ≤ i ≤ n`.", "**Example:** `Input: n = 5` → `Output: [0,1,1,2,1,2]`.", "**Approach:** DP: `ans[i] = ans[i >> 1] + (i & 1)`. The count for `i` = count for `i/2` plus the last bit."],
    keyPoints: ["Bit-shifting DP: `ans[i] = ans[i >> 1] + (i & 1)` — elegant O(n) solution"],
    code: [{ title: "Counting Bits — DP", language: "java", content: `import java.util.*;

public class CountingBits {
    public static int[] countBits(int n) {
        int[] ans = new int[n + 1];
        for (int i = 1; i <= n; i++)
            ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(countBits(5))); // [0, 1, 1, 2, 1, 2]
    }
}` }],
  },
  { id: "dp-easy-7", title: "Dice Combinations (CSES)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Count the number of ways to form a sum `n` by throwing a dice (faces 1-6). Answer modulo 10^9+7.", "**Example:** `Input: n = 3` → `Output: 4` — {1+1+1, 1+2, 2+1, 3}.", "**Approach:** DP: `dp[i] = sum(dp[i-1] to dp[i-6])`. Like climbing stairs but with 6 options."],
    keyPoints: ["Generalization of climbing stairs — 6 choices instead of 2"],
    code: [{ title: "Dice Combinations — CSES", language: "java", content: `import java.util.*;

public class DiceCombinations {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long MOD = 1_000_000_007;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= 6 && j <= i; j++)
                dp[i] = (dp[i] + dp[i - j]) % MOD;
        System.out.println(dp[n]);
    }
}` }],
  },
  { id: "dp-easy-8", title: "Tribonacci Number (LC 1137)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["T(0)=0, T(1)=1, T(2)=1. For n≥3: T(n) = T(n-1) + T(n-2) + T(n-3). Return T(n).", "**Example:** `Input: n = 4` → `Output: 4` — 0, 1, 1, 2, 4.", "**Approach:** Three-variable iteration, like Fibonacci but with three terms."],
    keyPoints: ["Simple extension of Fibonacci to three terms"],
    code: [{ title: "Tribonacci Number", language: "java", content: `public class Tribonacci {
    public static int tribonacci(int n) {
        if (n == 0) return 0;
        if (n <= 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 3; i <= n; i++) { int d = a + b + c; a = b; b = c; c = d; }
        return c;
    }

    public static void main(String[] args) {
        System.out.println(tribonacci(4));  // 4
        System.out.println(tribonacci(25)); // 1389537
    }
}` }],
  },
];

export const dpPracticeMedium: ContentSection[] = [
  { id: "dp-medium-1", title: "Coin Change", difficulty: "Medium", timeComplexity: "O(amount * coins)", spaceComplexity: "O(amount)",
    theory: ["Given coins of different denominations and a total amount, find the fewest number of coins that make up that amount.", "**Example:** `Input: coins = [1, 5, 11], amount = 15` → `Output: 3` — 5+5+5.", "**Approach:** Bottom-up DP. `dp[i] = min(dp[i], dp[i-coin] + 1)`."],
    keyPoints: ["Greedy doesn't work here (11+1+1+1+1 = 5 coins vs 5+5+5 = 3 coins)"],
    code: [{ title: "Coin Change — Bottom-Up DP", language: "java", content: `import java.util.Arrays;

public class CoinChange {
    public static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int coin : coins)
            for (int i = coin; i <= amount; i++)
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        return dp[amount] > amount ? -1 : dp[amount];
    }
    public static void main(String[] args) { System.out.println(coinChange(new int[]{1,5,11}, 15)); } // 3
}` }],
  },
  { id: "dp-medium-2", title: "Longest Increasing Subsequence", difficulty: "Medium", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Find the length of the longest strictly increasing subsequence.", "**Example:** `Input: nums = [10, 9, 2, 5, 3, 7, 101, 18]` → `Output: 4` — `[2, 3, 7, 101]`.", "**Approach:** Patience sorting with binary search."],
    keyPoints: ["Binary search on tails array gives O(n log n) vs naive O(n^2) DP"],
    code: [{ title: "LIS — Binary Search", language: "java", content: `import java.util.*;

public class LIS {
    public static int lengthOfLIS(int[] nums) {
        List<Integer> tails = new ArrayList<>();
        for (int num : nums) {
            int pos = Collections.binarySearch(tails, num);
            if (pos < 0) pos = -(pos + 1);
            if (pos == tails.size()) tails.add(num);
            else tails.set(pos, num);
        }
        return tails.size();
    }
    public static void main(String[] args) {
        System.out.println(lengthOfLIS(new int[]{10,9,2,5,3,7,101,18})); // 4
    }
}` }],
  },
  { id: "dp-medium-3", title: "0/1 Knapsack", difficulty: "Medium", timeComplexity: "O(n * W)", spaceComplexity: "O(W)",
    theory: ["Given weights and values of n items, find the maximum value that fits in a knapsack of capacity W.", "**Example:** `Input: weights = [1, 3, 4, 5], values = [1, 4, 5, 7], W = 7` → `Output: 9`.", "**Approach:** 1D DP array. Iterate items, then capacities in REVERSE."],
    keyPoints: ["Reverse iteration on capacity prevents reusing the same item (0/1 constraint)"],
    code: [{ title: "0/1 Knapsack — Space Optimized", language: "java", content: `public class Knapsack {
    public static int knapsack(int[] wt, int[] val, int W) {
        int[] dp = new int[W + 1];
        for (int i = 0; i < wt.length; i++)
            for (int w = W; w >= wt[i]; w--)
                dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
        return dp[W];
    }
    public static void main(String[] args) {
        System.out.println(knapsack(new int[]{1,3,4,5}, new int[]{1,4,5,7}, 7)); // 9
    }
}` }],
  },
  { id: "dp-medium-4", title: "Unique Paths (LC 62)", difficulty: "Medium", timeComplexity: "O(m * n)", spaceComplexity: "O(n)",
    theory: ["A robot is on an m×n grid at top-left corner. It can only move right or down. Count unique paths to bottom-right corner.", "**Example:** `Input: m = 3, n = 7` → `Output: 28`.", "**Approach:** DP: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. Can optimize to 1D array."],
    keyPoints: ["Also solvable with combinatorics: C(m+n-2, m-1)"],
    code: [{ title: "Unique Paths — Space-Optimized DP", language: "java", content: `public class UniquePaths {
    public static int uniquePaths(int m, int n) {
        int[] dp = new int[n];
        java.util.Arrays.fill(dp, 1);
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                dp[j] += dp[j - 1];
        return dp[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(uniquePaths(3, 7)); // 28
        System.out.println(uniquePaths(3, 3)); // 6
    }
}` }],
  },
  { id: "dp-medium-5", title: "Partition Equal Subset Sum (LC 416)", difficulty: "Medium", timeComplexity: "O(n * sum)", spaceComplexity: "O(sum)",
    theory: ["Given an integer array, determine if it can be partitioned into two subsets with equal sum.", "**Example:** `Input: nums = [1, 5, 11, 5]` → `Output: true` — [1, 5, 5] and [11].", "**Approach:** Reduce to 0/1 Knapsack: can we pick a subset summing to totalSum/2? Use boolean DP array."],
    keyPoints: ["If total sum is odd → impossible. Otherwise, it's a 0/1 knapsack problem"],
    code: [{ title: "Partition Equal Subset Sum — DP", language: "java", content: `public class PartitionEqualSubset {
    public static boolean canPartition(int[] nums) {
        int sum = 0;
        for (int n : nums) sum += n;
        if (sum % 2 != 0) return false;
        int target = sum / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int num : nums)
            for (int j = target; j >= num; j--)
                dp[j] = dp[j] || dp[j - num];
        return dp[target];
    }

    public static void main(String[] args) {
        System.out.println(canPartition(new int[]{1, 5, 11, 5})); // true
        System.out.println(canPartition(new int[]{1, 2, 3, 5}));  // false
    }
}` }],
  },
  { id: "dp-medium-6", title: "Longest Common Subsequence (LC 1143)", difficulty: "Medium", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given two strings, find the length of their longest common subsequence.", "**Example:** `Input: text1 = \"abcde\", text2 = \"ace\"` → `Output: 3` — LCS is `\"ace\"`.", "**Approach:** 2D DP. If chars match, `dp[i][j] = dp[i-1][j-1] + 1`, else `max(dp[i-1][j], dp[i][j-1])`."],
    keyPoints: ["Classic 2D DP — the foundation for diff algorithms"],
    code: [{ title: "Longest Common Subsequence — 2D DP", language: "java", content: `public class LCS {
    public static int longestCommonSubsequence(String t1, String t2) {
        int m = t1.length(), n = t2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i][j] = t1.charAt(i-1) == t2.charAt(j-1) ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
        return dp[m][n];
    }
    public static void main(String[] args) { System.out.println(longestCommonSubsequence("abcde", "ace")); } // 3
}` }],
  },
  { id: "dp-medium-7", title: "Grid Paths (CSES)", difficulty: "Medium", timeComplexity: "O(n^2)", spaceComplexity: "O(n^2)",
    theory: ["Count paths in an n×n grid from top-left to bottom-right. Some cells are blocked ('*'). Move right or down only.", "**Example:** A 4×4 grid with traps → count valid paths modulo 10^9+7.", "**Approach:** DP: `dp[i][j] = dp[i-1][j] + dp[i][j-1]` if cell is not blocked."],
    keyPoints: ["CSES classic — same as Unique Paths but with obstacles"],
    code: [{ title: "Grid Paths — CSES", language: "java", content: `import java.util.*;

public class GridPaths {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        char[][] grid = new char[n][n];
        for (int i = 0; i < n; i++) grid[i] = sc.next().toCharArray();

        long MOD = 1_000_000_007;
        long[][] dp = new long[n][n];
        dp[0][0] = grid[0][0] == '.' ? 1 : 0;

        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '*') { dp[i][j] = 0; continue; }
                if (i > 0) dp[i][j] = (dp[i][j] + dp[i-1][j]) % MOD;
                if (j > 0) dp[i][j] = (dp[i][j] + dp[i][j-1]) % MOD;
            }
        System.out.println(dp[n-1][n-1]);
    }
}` }],
  },
  { id: "dp-medium-8", title: "Word Break (LC 139)", difficulty: "Medium", timeComplexity: "O(n^2)", spaceComplexity: "O(n)",
    theory: ["Given a string `s` and a dictionary, determine if `s` can be segmented into dictionary words.", "**Example:** `Input: s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]` → `Output: true`.", "**Approach:** DP. `dp[i]` = true if `s[0..i-1]` can be segmented. Check all partitions."],
    keyPoints: ["DP avoids exponential backtracking"],
    code: [{ title: "Word Break — DP", language: "java", content: `import java.util.*;

public class WordBreakDP {
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
        System.out.println(wordBreak("applepenapple", Arrays.asList("apple", "pen"))); // true
    }
}` }],
  },
];

export const dpPracticeHard: ContentSection[] = [
  { id: "dp-hard-1", title: "Longest Common Subsequence", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given two strings, find the length of their longest common subsequence.", "**Example:** `Input: text1 = \"abcde\", text2 = \"ace\"` → `Output: 3`.", "**Approach:** 2D DP."],
    keyPoints: ["Classic 2D DP — the foundation for diff algorithms"],
    code: [{ title: "LCS — 2D DP", language: "java", content: `public class LCSHard {
    public static int longestCommonSubsequence(String t1, String t2) {
        int m = t1.length(), n = t2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i][j] = t1.charAt(i-1) == t2.charAt(j-1) ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
        return dp[m][n];
    }
    public static void main(String[] args) { System.out.println(longestCommonSubsequence("abcde", "ace")); } // 3
}` }],
  },
  { id: "dp-hard-2", title: "Matrix Chain Multiplication", difficulty: "Hard", timeComplexity: "O(n^3)", spaceComplexity: "O(n^2)",
    theory: ["Find the most efficient way to multiply a chain of matrices.", "**Example:** `Input: dimensions = [10, 30, 5, 60]` → `Output: 4500`.", "**Approach:** Interval DP. `dp[i][j]` = minimum cost to multiply matrices i through j."],
    keyPoints: ["Interval DP pattern: iterate by chain length, then start index, then split point"],
    code: [{ title: "Matrix Chain Multiplication — Interval DP", language: "java", content: `public class MatrixChain {
    public static int mcm(int[] p) {
        int n = p.length - 1;
        int[][] dp = new int[n][n];
        for (int len = 2; len <= n; len++)
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i; k < j; k++)
                    dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k+1][j] + p[i]*p[k+1]*p[j+1]);
            }
        return dp[0][n - 1];
    }
    public static void main(String[] args) { System.out.println(mcm(new int[]{10, 30, 5, 60})); } // 4500
}` }],
  },
  { id: "dp-hard-3", title: "Burst Balloons (LC 312)", difficulty: "Hard", timeComplexity: "O(n^3)", spaceComplexity: "O(n^2)",
    theory: ["Given `n` balloons with values, burst them to maximize coins. Bursting balloon `i` gives `nums[i-1] * nums[i] * nums[i+1]` coins.", "**Example:** `Input: nums = [3, 1, 5, 8]` → `Output: 167`.", "**Approach:** Interval DP. Think of the LAST balloon to burst in each subrange. `dp[i][j]` = max coins from bursting all balloons between i and j."],
    keyPoints: ["Think in reverse: which balloon is burst LAST in each subarray"],
    code: [{ title: "Burst Balloons — Interval DP", language: "java", content: `public class BurstBalloons {
    public static int maxCoins(int[] nums) {
        int n = nums.length;
        int[] val = new int[n + 2];
        val[0] = val[n + 1] = 1;
        for (int i = 0; i < n; i++) val[i + 1] = nums[i];

        int[][] dp = new int[n + 2][n + 2];
        for (int len = 1; len <= n; len++)
            for (int left = 1; left + len - 1 <= n; left++) {
                int right = left + len - 1;
                for (int k = left; k <= right; k++)
                    dp[left][right] = Math.max(dp[left][right],
                        dp[left][k-1] + val[left-1]*val[k]*val[right+1] + dp[k+1][right]);
            }
        return dp[1][n];
    }

    public static void main(String[] args) {
        System.out.println(maxCoins(new int[]{3, 1, 5, 8})); // 167
    }
}` }],
  },
  { id: "dp-hard-4", title: "Longest Valid Parentheses (LC 32)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Given a string of '(' and ')', find the length of the longest valid (well-formed) parentheses substring.", "**Example:** `Input: s = \")()())\"` → `Output: 4` — \"()()\".", "**Approach:** Stack-based. Push indices. When a match is found, compute length using the index below the matched pair."],
    keyPoints: ["Push -1 initially as base for length calculation"],
    code: [{ title: "Longest Valid Parentheses — Stack", language: "java", content: `import java.util.*;

public class LongestValidParen {
    public static int longestValidParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);
        int maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') { stack.push(i); }
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
        System.out.println(longestValidParentheses("()(()"));  // 2
    }
}` }],
  },
  { id: "dp-hard-5", title: "Edit Distance (LC 72)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given two strings, return the minimum number of operations (insert, delete, replace) to convert one to the other.", "**Example:** `Input: word1 = \"intention\", word2 = \"execution\"` → `Output: 5`.", "**Approach:** 2D DP. `dp[i][j]` = edit distance for first `i` of word1 and first `j` of word2."],
    keyPoints: ["Foundation of diff algorithms and spell checkers"],
    code: [{ title: "Edit Distance — 2D DP", language: "java", content: `public class EditDistanceDP {
    public static int minDistance(String w1, String w2) {
        int m = w1.length(), n = w2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i][j] = w1.charAt(i-1) == w2.charAt(j-1)
                    ? dp[i-1][j-1]
                    : 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(minDistance("intention", "execution")); // 5
    }
}` }],
  },
  { id: "dp-hard-6", title: "Interleaving String (LC 97)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(n)",
    theory: ["Given strings `s1`, `s2`, and `s3`, determine if `s3` is formed by interleaving `s1` and `s2`.", "**Example:** `Input: s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbcbcac\"` → `Output: true`.", "**Approach:** 2D DP. `dp[i][j]` = whether `s3[0..i+j-1]` can be formed by `s1[0..i-1]` and `s2[0..j-1]`."],
    keyPoints: ["Check if current s3 char matches s1 or s2 and the corresponding dp state is true"],
    code: [{ title: "Interleaving String — DP", language: "java", content: `public class InterleavingString {
    public static boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;
        boolean[] dp = new boolean[n + 1];
        for (int i = 0; i <= m; i++)
            for (int j = 0; j <= n; j++) {
                if (i == 0 && j == 0) dp[j] = true;
                else if (i == 0) dp[j] = dp[j-1] && s2.charAt(j-1) == s3.charAt(j-1);
                else if (j == 0) dp[j] = dp[j] && s1.charAt(i-1) == s3.charAt(i-1);
                else dp[j] = (dp[j] && s1.charAt(i-1) == s3.charAt(i+j-1))
                          || (dp[j-1] && s2.charAt(j-1) == s3.charAt(i+j-1));
            }
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println(isInterleave("aabcc", "dbbca", "aadbbcbcac")); // true
    }
}` }],
  },
  { id: "dp-hard-7", title: "Palindrome Partitioning II (LC 132)", difficulty: "Hard", timeComplexity: "O(n^2)", spaceComplexity: "O(n^2)",
    theory: ["Return the minimum cuts needed to partition `s` into palindromic substrings.", "**Example:** `Input: s = \"aab\"` → `Output: 1`.", "**Approach:** DP with palindrome pre-computation."],
    keyPoints: ["Precompute palindrome table, then use cuts DP"],
    code: [{ title: "Min Cut Palindrome — DP", language: "java", content: `public class PalPartition {
    public static int minCut(String s) {
        int n = s.length();
        boolean[][] isPal = new boolean[n][n];
        int[] cuts = new int[n];
        for (int i = 0; i < n; i++) {
            cuts[i] = i;
            for (int j = 0; j <= i; j++) {
                if (s.charAt(j) == s.charAt(i) && (i - j <= 2 || isPal[j+1][i-1])) {
                    isPal[j][i] = true;
                    cuts[i] = j == 0 ? 0 : Math.min(cuts[i], cuts[j-1] + 1);
                }
            }
        }
        return cuts[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(minCut("aab")); // 1
    }
}` }],
  },
  { id: "dp-hard-8", title: "Elevator Rides (CSES)", difficulty: "Hard", timeComplexity: "O(3^n)", spaceComplexity: "O(2^n)",
    theory: ["Given `n` people with weights and an elevator with max weight `x`, find the minimum number of rides to transport everyone.", "**Example:** `Input: n=4, x=10, weights=[4,8,6,1]` → `Output: 2`.", "**Approach:** Bitmask DP. `dp[mask]` = (min rides, remaining capacity in last ride). Iterate over all subsets."],
    keyPoints: ["Bitmask DP with state = (rides, remaining capacity) — classic CSES problem"],
    code: [{ title: "Elevator Rides — Bitmask DP (CSES)", language: "java", content: `import java.util.*;

public class ElevatorRides {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), x = sc.nextInt();
        int[] w = new int[n];
        for (int i = 0; i < n; i++) w[i] = sc.nextInt();

        int N = 1 << n;
        int[] rides = new int[N], remain = new int[N];
        Arrays.fill(rides, n + 1);
        rides[0] = 1; remain[0] = x;

        for (int mask = 1; mask < N; mask++) {
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) == 0) continue;
                int prev = mask ^ (1 << i);
                if (remain[prev] >= w[i]) {
                    if (rides[prev] < rides[mask] ||
                        (rides[prev] == rides[mask] && remain[prev] - w[i] > remain[mask])) {
                        rides[mask] = rides[prev];
                        remain[mask] = remain[prev] - w[i];
                    }
                } else {
                    if (rides[prev] + 1 < rides[mask] ||
                        (rides[prev] + 1 == rides[mask] && x - w[i] > remain[mask])) {
                        rides[mask] = rides[prev] + 1;
                        remain[mask] = x - w[i];
                    }
                }
            }
        }
        System.out.println(rides[N - 1]);
    }
}` }],
  },
];
