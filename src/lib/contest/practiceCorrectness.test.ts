import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import {
  buildContestProgram,
  getContestRunnerSpec,
  outputsMatch,
  parseRunnerReport,
} from "@/lib/contest/contestRunner";
import { supportsJavaToolchain } from "@/test/javaToolchain";

const run = promisify(execFile);

/**
 * Reference solutions, written independently of the seeded expected outputs.
 *
 * The harness compile test proves the generated program is valid Java; this one
 * proves the seeded `expectedOutput` values are actually achievable. A learner
 * who writes a correct solution must be told "passed", so a wrong expectation
 * here is a real bug in the problem bank — the class of bug that let three
 * problems ship with impossible answers before.
 */
const REFERENCE: Record<string, string> = {
  "two-sum-indices": `import java.util.*;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  "maximum-subarray-sum": `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }
        return best;
    }
}`,
  "merge-intervals": `import java.util.*;
class Solution {
    public List<List<Integer>> merge(List<List<Integer>> intervals) {
        List<List<Integer>> sorted = new ArrayList<>(intervals);
        sorted.sort((a, b) -> Integer.compare(a.get(0), b.get(0)));
        List<List<Integer>> out = new ArrayList<>();
        for (List<Integer> cur : sorted) {
            if (!out.isEmpty() && cur.get(0) <= out.get(out.size() - 1).get(1)) {
                List<Integer> last = out.get(out.size() - 1);
                last.set(1, Math.max(last.get(1), cur.get(1)));
            } else {
                out.add(new ArrayList<>(cur));
            }
        }
        return out;
    }
}`,
  "first-position-of-target": `class Solution {
    public int search(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) if (nums[i] == target) return i;
        return -1;
    }
}`,
  "group-anagrams": `import java.util.*;
class Solution {
    public List<List<String>> groupAnagrams(List<String> strs) {
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String s : strs) {
            char[] c = s.toCharArray();
            Arrays.sort(c);
            groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
  "longest-substring-without-repeating": `import java.util.*;
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int best = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (last.containsKey(c) && last.get(c) >= start) start = last.get(c) + 1;
            last.put(c, i);
            best = Math.max(best, i - start + 1);
        }
        return best;
    }
}`,
  "valid-parentheses": `import java.util.*;
class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') stack.push(c);
            else {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
            }
        }
        return stack.isEmpty();
    }
}`,
  "min-stack": `import java.util.*;
class MinStack {
    private final Deque<Integer> values = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();
    public void push(int value) {
        values.push(value);
        mins.push(mins.isEmpty() ? value : Math.min(value, mins.peek()));
    }
    public int pop() {
        mins.pop();
        return values.pop();
    }
    public int top() { return values.peek(); }
    public int getMin() { return mins.peek(); }
}`,
  "reverse-linked-list-recursive": `class Solution {
    public ListNode reverse(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode rest = reverse(head.next);
        head.next.next = head;
        head.next = null;
        return rest;
    }
}`,
  "remove-nth-from-end": `class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i < n; i++) fast = fast.next;
        while (fast.next != null) { fast = fast.next; slow = slow.next; }
        slow.next = slow.next.next;
        return dummy.next;
    }
}`,
  "top-k-frequent-words": `import java.util.*;
class Solution {
    public List<String> topKFrequent(List<String> words, int k) {
        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);
        List<String> distinct = new ArrayList<>(counts.keySet());
        distinct.sort((a, b) -> {
            int byCount = Integer.compare(counts.get(b), counts.get(a));
            return byCount != 0 ? byCount : a.compareTo(b);
        });
        return distinct.subList(0, Math.min(k, distinct.size()));
    }
}`,
  "climbing-stairs": `class Solution {
    public int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
        return a;
    }
}`,
  "best-time-to-buy-and-sell-stock": `class Solution {
    public int maxProfit(int[] prices) {
        int best = 0, low = Integer.MAX_VALUE;
        for (int p : prices) { low = Math.min(low, p); best = Math.max(best, p - low); }
        return best;
    }
}`,
  "contains-duplicate": `import java.util.*;
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int n : nums) if (!seen.add(n)) return true;
        return false;
    }
}`,
  "valid-anagram": `import java.util.*;
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) { counts[s.charAt(i) - 'a']++; counts[t.charAt(i) - 'a']--; }
        for (int c : counts) if (c != 0) return false;
        return true;
    }
}`,
  "roman-to-integer": `import java.util.*;
class Solution {
    public int romanToInt(String s) {
        Map<Character, Integer> v = new HashMap<>();
        v.put('I', 1); v.put('V', 5); v.put('X', 10); v.put('L', 50);
        v.put('C', 100); v.put('D', 500); v.put('M', 1000);
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int cur = v.get(s.charAt(i));
            if (i + 1 < s.length() && cur < v.get(s.charAt(i + 1))) total -= cur; else total += cur;
        }
        return total;
    }
}`,
  "longest-common-prefix": `class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        String prefix = strs[0];
        for (String s : strs) {
            while (!s.startsWith(prefix)) prefix = prefix.substring(0, prefix.length() - 1);
        }
        return prefix;
    }
}`,
  "majority-element": `class Solution {
    public int majorityElement(int[] nums) {
        int count = 0, candidate = 0;
        for (int n : nums) {
            if (count == 0) candidate = n;
            count += (n == candidate) ? 1 : -1;
        }
        return candidate;
    }
}`,
  "move-zeroes": `class Solution {
    public int[] moveZeroes(int[] nums) {
        int write = 0;
        for (int n : nums) if (n != 0) nums[write++] = n;
        while (write < nums.length) nums[write++] = 0;
        return nums;
    }
}`,
  "house-robber": `class Solution {
    public int rob(int[] nums) {
        int skip = 0, take = 0;
        for (int n : nums) { int next = Math.max(take, skip + n); skip = take; take = next; }
        return take;
    }
}`,
  "coin-change": `import java.util.*;
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++)
            for (int c : coins) if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
  "unique-paths": `class Solution {
    public int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dp[i][j] = (i == 0 || j == 0) ? 1 : dp[i - 1][j] + dp[i][j - 1];
        return dp[m - 1][n - 1];
    }
}`,
  "kth-largest-element": `import java.util.*;
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int n : nums) { heap.offer(n); if (heap.size() > k) heap.poll(); }
        return heap.peek();
    }
}`,
  "trapping-rain-water": `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
          if (height[left] < height[right]) {
            leftMax = Math.max(leftMax, height[left]);
            total += leftMax - height[left];
            left++;
          } else {
            rightMax = Math.max(rightMax, height[right]);
            total += rightMax - height[right];
            right--;
          }
        }
        return total;
    }
}`,
};

async function compileAndRun(
  code: string,
): Promise<{ stdout: string; stderr: string }> {
  const directory = await mkdtemp(join(tmpdir(), "contest-ref-"));
  try {
    await writeFile(join(directory, "Main.java"), code, "utf8");
    await run("javac", ["-encoding", "UTF-8", "Main.java"], {
      cwd: directory,
      timeout: 60_000,
    });
    const { stdout, stderr } = await run("java", ["Main"], {
      cwd: directory,
      timeout: 30_000,
    });
    return { stdout, stderr };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe.skipIf(!supportsJavaToolchain)(
  "reference solutions against the seeded visible cases",
  () => {
    it("every visible expectedOutput is what a correct solution prints", async () => {
      const failures: string[] = [];

      for (const problem of PUBLIC_JAVA_PROBLEMS) {
        const spec = getContestRunnerSpec(problem.slug);
        const reference = REFERENCE[problem.slug];
        if (!spec) {
          failures.push(`${problem.slug}: no runner spec`);
          continue;
        }
        if (!reference) {
          failures.push(`${problem.slug}: no reference solution in this test`);
          continue;
        }

        const program = buildContestProgram(
          reference,
          spec,
          problem.visibleTestCases.map((testCase) => testCase.input),
        );

        let report: { stdout: string; stderr: string };
        try {
          report = await compileAndRun(program);
        } catch (error) {
          const detail = error as {
            stdout?: string;
            stderr?: string;
            message?: string;
          };
          failures.push(
            `${problem.slug}: reference solution did not compile\n${detail.stderr ?? detail.stdout ?? detail.message}`,
          );
          continue;
        }

        const outcomes = parseRunnerReport(report.stdout);
        problem.visibleTestCases.forEach((testCase, index) => {
          const outcome = outcomes.find((o) => o.index === index);
          if (!outcome) {
            failures.push(
              `${problem.slug} ${testCase.id}: no protocol line\nstdout=${JSON.stringify(report.stdout)}\nstderr=${JSON.stringify(report.stderr)}`,
            );
            return;
          }
          if (!outcome.ok) {
            failures.push(
              `${problem.slug} ${testCase.id}: threw ${outcome.error}`,
            );
            return;
          }
          if (!outputsMatch(outcome.actual ?? "", testCase.expectedOutput)) {
            failures.push(
              `${problem.slug} ${testCase.id}: expected ${JSON.stringify(testCase.expectedOutput)}, got ${JSON.stringify(outcome.actual)}`,
            );
          }
        });
      }

      expect(failures.join("\n\n")).toBe("");
    }, 240_000);
  },
);
