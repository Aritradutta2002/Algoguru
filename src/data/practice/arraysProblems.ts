import { ContentSection } from "../recursionContent";

export const arraysEasy: ContentSection[] = [
  {
    id: "arrays-easy-1",
    title: "Two Sum",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.",
      "You may assume each input has exactly one solution, and you may not use the same element twice.",
      "**Example:** `Input: nums = [2, 7, 11, 15], target = 9` → `Output: [0, 1]` — because `nums[0] + nums[1] = 2 + 7 = 9`.",
      "**Approach:** Use a HashMap to store each number's index. For every element, check if `target - nums[i]` already exists in the map. If yes, return both indices. This gives O(n) time instead of brute-force O(n^2).",
    ],
    keyPoints: [
      "HashMap lookup is O(1) average — the key insight for this problem",
      "Always check if the complement exists BEFORE inserting current element to avoid using the same index twice",
      "This pattern (complement search via HashMap) appears in dozens of interview problems",
    ],
    code: [
      {
        title: "Two Sum — HashMap",
        language: "java",
        content: `import java.util.*;

public class TwoSum {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{}; // no solution
    }

    public static void main(String[] args) {
        int[] result = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(result)); // [0, 1]

        result = twoSum(new int[]{3, 2, 4}, 6);
        System.out.println(Arrays.toString(result)); // [1, 2]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-2",
    title: "Find All Duplicates in an Array",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an integer array `nums` of length `n` where all integers are in the range `[1, n]`, return all integers that appear twice.",
      "**Example:** `Input: nums = [4, 3, 2, 7, 8, 2, 3, 1]` → `Output: [2, 3]`.",
      "**Approach:** Use index-marking trick. For each value `v`, negate `nums[v-1]`. If it's already negative, `v` is a duplicate. This gives O(n) time and O(1) extra space.",
    ],
    keyPoints: [
      "Index-marking (negation trick) is a powerful O(1) space technique when values are in range [1, n]",
      "Always use `Math.abs(nums[i])` since values may already be negated",
    ],
    code: [
      {
        title: "Find Duplicates — Index Marking",
        language: "java",
        content: `import java.util.*;

public class FindDuplicates {
    public static List<Integer> findDuplicates(int[] nums) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            int idx = Math.abs(nums[i]) - 1;
            if (nums[idx] < 0) {
                result.add(idx + 1);
            } else {
                nums[idx] = -nums[idx];
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(findDuplicates(new int[]{4,3,2,7,8,2,3,1}));
        // Output: [2, 3]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-3",
    title: "Rotate Array by K Positions",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an integer array `nums`, rotate the array to the right by `k` steps in-place with O(1) extra space.",
      "**Example:** `Input: nums = [1, 2, 3, 4, 5, 6, 7], k = 3` → `Output: [5, 6, 7, 1, 2, 3, 4]`.",
      "**Approach:** Three reversals: reverse the entire array, then reverse first `k` elements, then reverse the rest. Three reversals = one rotation.",
    ],
    keyPoints: [
      "Handle `k > n` by taking `k = k % n`",
      "The three-reversal trick is an elegant O(1) space solution",
    ],
    code: [
      {
        title: "Rotate Array — Three Reversals",
        language: "java",
        content: `import java.util.*;

public class RotateArray {
    static void reverse(int[] arr, int l, int r) {
        while (l < r) {
            int tmp = arr[l]; arr[l] = arr[r]; arr[r] = tmp;
            l++; r--;
        }
    }

    public static void rotate(int[] nums, int k) {
        int n = nums.length;
        k = k % n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }

    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5, 6, 7};
        rotate(arr, 3);
        System.out.println(Arrays.toString(arr));
        // Output: [5, 6, 7, 1, 2, 3, 4]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-4",
    title: "Contains Duplicate (LC 217)",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an integer array `nums`, return `true` if any value appears at least twice in the array.",
      "**Example:** `Input: nums = [1, 2, 3, 1]` → `Output: true`.",
      "**Example:** `Input: nums = [1, 2, 3, 4]` → `Output: false`.",
      "**Approach:** Insert elements into a HashSet. If the element already exists, return true.",
    ],
    keyPoints: [
      "HashSet insertion is O(1) — simplest duplicate detection pattern",
      "Alternative: sort first in O(n log n) with O(1) space, then check adjacent elements",
    ],
    code: [
      {
        title: "Contains Duplicate — HashSet",
        language: "java",
        content: `import java.util.*;

public class ContainsDuplicate {
    public static boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int num : nums) {
            if (!seen.add(num)) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(containsDuplicate(new int[]{1,2,3,1})); // true
        System.out.println(containsDuplicate(new int[]{1,2,3,4})); // false
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-5",
    title: "Missing Number (LC 268)",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.",
      "**Example:** `Input: nums = [3, 0, 1]` → `Output: 2`.",
      "**Example:** `Input: nums = [9,6,4,2,3,5,7,0,1]` → `Output: 8`.",
      "**Approach:** Use Gauss formula: expected sum = `n*(n+1)/2`, then subtract the actual sum. Alternatively, XOR all indices and values — duplicates cancel, leaving the missing number.",
    ],
    keyPoints: [
      "XOR approach: `a ^ a = 0` — all paired values cancel out",
      "Gauss formula approach is simpler but can overflow for large n (use long)",
    ],
    code: [
      {
        title: "Missing Number — XOR",
        language: "java",
        content: `public class MissingNumber {
    public static int missingNumber(int[] nums) {
        int xor = nums.length;
        for (int i = 0; i < nums.length; i++) {
            xor ^= i ^ nums[i];
        }
        return xor;
    }

    public static void main(String[] args) {
        System.out.println(missingNumber(new int[]{3, 0, 1}));       // 2
        System.out.println(missingNumber(new int[]{9,6,4,2,3,5,7,0,1})); // 8
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-6",
    title: "Single Number (LC 136)",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given a non-empty array where every element appears twice except one, find that single element.",
      "**Example:** `Input: nums = [4, 1, 2, 1, 2]` → `Output: 4`.",
      "**Approach:** XOR all elements. Since `a ^ a = 0` and `a ^ 0 = a`, all pairs cancel out, leaving the single number.",
    ],
    keyPoints: [
      "XOR is the most elegant O(1) space solution for this classic problem",
      "This pattern extends: if every element appears 3 times except one, use bit counting",
    ],
    code: [
      {
        title: "Single Number — XOR",
        language: "java",
        content: `public class SingleNumber {
    public static int singleNumber(int[] nums) {
        int result = 0;
        for (int num : nums) result ^= num;
        return result;
    }

    public static void main(String[] args) {
        System.out.println(singleNumber(new int[]{4, 1, 2, 1, 2})); // 4
        System.out.println(singleNumber(new int[]{2, 2, 1}));       // 1
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-7",
    title: "Majority Element (LC 169)",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an array `nums` of size `n`, return the majority element (appears more than ⌊n/2⌋ times). The majority element always exists.",
      "**Example:** `Input: nums = [2, 2, 1, 1, 1, 2, 2]` → `Output: 2`.",
      "**Approach:** Boyer-Moore Voting Algorithm. Maintain a candidate and count. If count drops to 0, pick a new candidate. The majority element will survive.",
    ],
    keyPoints: [
      "Boyer-Moore Voting is O(n) time, O(1) space — brilliant for majority element",
      "Works because the majority element appears > n/2 times, so it always outlasts all others combined",
    ],
    code: [
      {
        title: "Majority Element — Boyer-Moore Voting",
        language: "java",
        content: `public class MajorityElement {
    public static int majorityElement(int[] nums) {
        int candidate = nums[0], count = 1;
        for (int i = 1; i < nums.length; i++) {
            if (count == 0) { candidate = nums[i]; count = 1; }
            else if (nums[i] == candidate) count++;
            else count--;
        }
        return candidate;
    }

    public static void main(String[] args) {
        System.out.println(majorityElement(new int[]{2,2,1,1,1,2,2})); // 2
        System.out.println(majorityElement(new int[]{3,3,4}));         // 3
    }
}`,
      },
    ],
  },
  {
    id: "arrays-easy-8",
    title: "Intersection of Two Arrays II (LC 350)",
    difficulty: "Easy",
    timeComplexity: "O(m + n)",
    spaceComplexity: "O(min(m, n))",
    theory: [
      "Given two integer arrays, return an array of their intersection. Each element in the result should appear as many times as it shows in both arrays.",
      "**Example:** `Input: nums1 = [1,2,2,1], nums2 = [2,2]` → `Output: [2,2]`.",
      "**Approach:** Use a HashMap to count frequencies of the smaller array. Then iterate the larger array, collecting matches and decrementing counts.",
    ],
    keyPoints: [
      "HashMap frequency count handles duplicate intersections correctly",
      "Follow-up: if arrays are sorted, use two pointers for O(1) space",
    ],
    code: [
      {
        title: "Intersection of Two Arrays II — HashMap",
        language: "java",
        content: `import java.util.*;

public class IntersectArrays {
    public static int[] intersect(int[] nums1, int[] nums2) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int n : nums1) map.merge(n, 1, Integer::sum);
        List<Integer> result = new ArrayList<>();
        for (int n : nums2) {
            if (map.getOrDefault(n, 0) > 0) {
                result.add(n);
                map.merge(n, -1, Integer::sum);
            }
        }
        return result.stream().mapToInt(Integer::intValue).toArray();
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(intersect(new int[]{1,2,2,1}, new int[]{2,2}))); // [2, 2]
        System.out.println(Arrays.toString(intersect(new int[]{4,9,5}, new int[]{9,4,9,8,4}))); // [4, 9]
    }
}`,
      },
    ],
  },
];

export const arraysMedium: ContentSection[] = [
  {
    id: "arrays-medium-1",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an integer array `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals `k`.",
      "**Example:** `Input: nums = [1, 1, 1], k = 2` → `Output: 2` — Subarrays `[1,1]` starting at index 0 and `[1,1]` starting at index 1 both sum to 2.",
      "**Approach:** Use prefix sum with a HashMap. For each index, compute running prefix sum. If `prefixSum - k` has been seen before, those subarrays end at the current index. Initialize map with `{0: 1}` to handle subarrays starting from index 0.",
    ],
    keyPoints: [
      "Prefix sum + HashMap is one of the most powerful array patterns",
      "Initialize map with `{0: 1}` — this handles subarrays that start from index 0",
    ],
    code: [
      {
        title: "Subarray Sum Equals K — Prefix Sum + HashMap",
        language: "java",
        content: `import java.util.*;

public class SubarraySum {
    public static int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1);
        int sum = 0, count = 0;

        for (int num : nums) {
            sum += num;
            count += prefixCount.getOrDefault(sum - k, 0);
            prefixCount.merge(sum, 1, Integer::sum);
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(subarraySum(new int[]{1,1,1}, 2));    // 2
        System.out.println(subarraySum(new int[]{1,2,3}, 3));    // 2
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-2",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) extra",
    theory: [
      "Given an integer array `nums`, return an array `answer` such that `answer[i]` is the product of all elements except `nums[i]`. You must solve it in O(n) time without using division.",
      "**Example:** `Input: nums = [1, 2, 3, 4]` → `Output: [24, 12, 8, 6]`.",
      "**Approach:** Two-pass approach. First pass: build left prefix products. Second pass: multiply by right suffix products.",
    ],
    keyPoints: [
      "Two-pass (left product → right product) avoids needing division",
      "Output array doesn't count as extra space per the problem definition",
    ],
    code: [
      {
        title: "Product Except Self — Two Pass",
        language: "java",
        content: `public class ProductExceptSelf {
    public static int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];

        result[0] = 1;
        for (int i = 1; i < n; i++)
            result[i] = result[i - 1] * nums[i - 1];

        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= right;
            right *= nums[i];
        }
        return result;
    }

    public static void main(String[] args) {
        int[] res = productExceptSelf(new int[]{1, 2, 3, 4});
        System.out.println(java.util.Arrays.toString(res));
        // Output: [24, 12, 8, 6]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-3",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence. Must run in O(n) time.",
      "**Example:** `Input: nums = [100, 4, 200, 1, 3, 2]` → `Output: 4` — The longest consecutive sequence is `[1, 2, 3, 4]`.",
      "**Approach:** Put all numbers in a HashSet. For each number that is the START of a sequence (i.e., `num - 1` is NOT in the set), count how many consecutive numbers follow.",
    ],
    keyPoints: [
      "HashSet for O(1) lookups transforms O(n^2) brute force into O(n)",
      "Only start counting from sequence beginnings (`num - 1` not in set) to avoid redundant work",
    ],
    code: [
      {
        title: "Longest Consecutive Sequence — HashSet",
        language: "java",
        content: `import java.util.*;

public class LongestConsecutive {
    public static int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);

        int longest = 0;
        for (int num : set) {
            if (!set.contains(num - 1)) {
                int len = 1;
                while (set.contains(num + len)) len++;
                longest = Math.max(longest, len);
            }
        }
        return longest;
    }

    public static void main(String[] args) {
        System.out.println(longestConsecutive(new int[]{100,4,200,1,3,2})); // 4
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-4",
    title: "Sort Colors (LC 75)",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an array `nums` with `n` objects colored red (0), white (1), or blue (2), sort them in-place in a single pass.",
      "**Example:** `Input: nums = [2, 0, 2, 1, 1, 0]` → `Output: [0, 0, 1, 1, 2, 2]`.",
      "**Approach:** Dutch National Flag algorithm. Three pointers: `lo` for 0s boundary, `mid` for current, `hi` for 2s boundary.",
    ],
    keyPoints: [
      "Three-pointer partitioning solves it in a single pass — O(n) time, O(1) space",
      "Don't increment `mid` when swapping with `hi` — the swapped element hasn't been examined yet",
    ],
    code: [
      {
        title: "Sort Colors — Dutch National Flag",
        language: "java",
        content: `import java.util.*;

public class SortColors {
    public static void sortColors(int[] nums) {
        int lo = 0, mid = 0, hi = nums.length - 1;
        while (mid <= hi) {
            if (nums[mid] == 0) swap(nums, lo++, mid++);
            else if (nums[mid] == 1) mid++;
            else swap(nums, mid, hi--);
        }
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }

    public static void main(String[] args) {
        int[] nums = {2, 0, 2, 1, 1, 0};
        sortColors(nums);
        System.out.println(Arrays.toString(nums)); // [0, 0, 1, 1, 2, 2]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-5",
    title: "Merge Intervals (LC 56)",
    difficulty: "Medium",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an array of intervals where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals.",
      "**Example:** `Input: intervals = [[1,3],[2,6],[8,10],[15,18]]` → `Output: [[1,6],[8,10],[15,18]]`.",
      "**Approach:** Sort by start time. Iterate and merge: if current interval overlaps with the last merged one, extend the end. Otherwise, add a new interval.",
    ],
    keyPoints: [
      "Sorting by start time is the key — after sorting, overlaps are always between consecutive intervals",
      "Overlap condition: `current.start <= lastMerged.end`",
    ],
    code: [
      {
        title: "Merge Intervals",
        language: "java",
        content: `import java.util.*;

public class MergeIntervals {
    public static int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> merged = new ArrayList<>();
        for (int[] interval : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < interval[0]) {
                merged.add(interval);
            } else {
                merged.get(merged.size() - 1)[1] =
                    Math.max(merged.get(merged.size() - 1)[1], interval[1]);
            }
        }
        return merged.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        int[][] res = merge(new int[][]{{1,3},{2,6},{8,10},{15,18}});
        for (int[] r : res) System.out.println(Arrays.toString(r));
        // [1, 6]  [8, 10]  [15, 18]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-6",
    title: "Next Permutation (LC 31)",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Rearrange numbers into the lexicographically next greater permutation. If the arrangement is the largest, rearrange to the lowest (sorted ascending).",
      "**Example:** `Input: nums = [1, 2, 3]` → `Output: [1, 3, 2]`.",
      "**Example:** `Input: nums = [3, 2, 1]` → `Output: [1, 2, 3]`.",
      "**Approach:** 1) Find largest index `i` such that `nums[i] < nums[i+1]`. 2) Find largest `j > i` such that `nums[j] > nums[i]`. 3) Swap `nums[i]` and `nums[j]`. 4) Reverse suffix after index `i`.",
    ],
    keyPoints: [
      "This is the standard algorithm for generating permutations in lexicographic order",
      "If no `i` is found (fully descending), just reverse the whole array",
    ],
    code: [
      {
        title: "Next Permutation",
        language: "java",
        content: `import java.util.*;

public class NextPermutation {
    public static void nextPermutation(int[] nums) {
        int n = nums.length, i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            swap(nums, i, j);
        }
        reverse(nums, i + 1, n - 1);
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }

    static void reverse(int[] a, int l, int r) {
        while (l < r) swap(a, l++, r--);
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        nextPermutation(nums);
        System.out.println(Arrays.toString(nums)); // [1, 3, 2]

        nums = new int[]{3, 2, 1};
        nextPermutation(nums);
        System.out.println(Arrays.toString(nums)); // [1, 2, 3]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-7",
    title: "Spiral Matrix (LC 54)",
    difficulty: "Medium",
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an `m x n` matrix, return all elements in spiral order.",
      "**Example:** `Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]` → `Output: [1,2,3,6,9,8,7,4,5]`.",
      "**Approach:** Use four boundaries: top, bottom, left, right. Traverse right, then down, then left, then up, shrinking boundaries after each direction.",
    ],
    keyPoints: [
      "Four-boundary approach is cleaner than direction-based simulation",
      "Check boundary validity after each direction change to handle non-square matrices",
    ],
    code: [
      {
        title: "Spiral Matrix — Four Boundaries",
        language: "java",
        content: `import java.util.*;

public class SpiralMatrix {
    public static List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> result = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;

        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) result.add(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) result.add(matrix[i][right]);
            right--;
            if (top <= bottom) {
                for (int j = right; j >= left; j--) result.add(matrix[bottom][j]);
                bottom--;
            }
            if (left <= right) {
                for (int i = bottom; i >= top; i--) result.add(matrix[i][left]);
                left++;
            }
        }
        return result;
    }

    public static void main(String[] args) {
        int[][] matrix = {{1,2,3},{4,5,6},{7,8,9}};
        System.out.println(spiralOrder(matrix)); // [1,2,3,6,9,8,7,4,5]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-medium-8",
    title: "4Sum (LC 18)",
    difficulty: "Medium",
    timeComplexity: "O(n^3)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an array `nums` and a target, return all unique quadruplets `[nums[a], nums[b], nums[c], nums[d]]` such that `a, b, c, d` are distinct and their sum equals target.",
      "**Example:** `Input: nums = [1,0,-1,0,-2,2], target = 0` → `Output: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]`.",
      "**Approach:** Sort the array. Fix first two elements with two nested loops, then use two pointers for the remaining two. Skip duplicates at every level.",
    ],
    keyPoints: [
      "Generalization of 3Sum — fix k-2 elements, use two pointers for last two",
      "Duplicate skipping at every level is essential to avoid repeated quadruplets",
    ],
    code: [
      {
        title: "4Sum — Sort + Two Pointers",
        language: "java",
        content: `import java.util.*;

public class FourSum {
    public static List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int lo = j + 1, hi = n - 1;
                long need = (long) target - nums[i] - nums[j];
                while (lo < hi) {
                    int sum = nums[lo] + nums[hi];
                    if (sum < need) lo++;
                    else if (sum > need) hi--;
                    else {
                        result.add(Arrays.asList(nums[i], nums[j], nums[lo], nums[hi]));
                        while (lo < hi && nums[lo] == nums[lo + 1]) lo++;
                        while (lo < hi && nums[hi] == nums[hi - 1]) hi--;
                        lo++; hi--;
                    }
                }
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(fourSum(new int[]{1,0,-1,0,-2,2}, 0));
        // [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
    }
}`,
      },
    ],
  },
];

export const arraysHard: ContentSection[] = [
  {
    id: "arrays-hard-1",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      "**Example:** `Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]` → `Output: 6`.",
      "**Approach:** Two-pointer technique. Maintain `leftMax` and `rightMax`. Water at each position = `min(leftMax, rightMax) - height[i]`. Move the pointer with the smaller max inward.",
    ],
    keyPoints: [
      "Two-pointer avoids the O(n) space of prefix arrays",
      "Water at position i = `min(leftMax, rightMax) - height[i]`",
    ],
    code: [
      {
        title: "Trapping Rain Water — Two Pointers",
        language: "java",
        content: `public class TrappingRainWater {
    public static int trap(int[] height) {
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

    public static void main(String[] args) {
        System.out.println(trap(new int[]{0,1,0,2,1,0,1,3,2,1,2,1})); // 6
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-2",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    timeComplexity: "O(log(min(m,n)))",
    spaceComplexity: "O(1)",
    theory: [
      "Given two sorted arrays `nums1` and `nums2`, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).",
      "**Example:** `Input: nums1 = [1, 3], nums2 = [2]` → `Output: 2.0`.",
      "**Approach:** Binary search on the shorter array. Partition both arrays such that all elements on the left ≤ all elements on the right.",
    ],
    keyPoints: [
      "Binary search on the shorter array ensures O(log(min(m,n)))",
      "Use Integer.MIN_VALUE and Integer.MAX_VALUE as sentinels for edge partitions",
    ],
    code: [
      {
        title: "Median of Two Sorted Arrays — Binary Search",
        language: "java",
        content: `public class MedianSortedArrays {
    public static double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length)
            return findMedianSortedArrays(nums2, nums1);

        int m = nums1.length, n = nums2.length;
        int lo = 0, hi = m;

        while (lo <= hi) {
            int i = (lo + hi) / 2;
            int j = (m + n + 1) / 2 - i;

            int maxLeft1  = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRight1 = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeft2  = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRight2 = (j == n) ? Integer.MAX_VALUE : nums2[j];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 0)
                    return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0;
                else
                    return Math.max(maxLeft1, maxLeft2);
            } else if (maxLeft1 > minRight2) {
                hi = i - 1;
            } else {
                lo = i + 1;
            }
        }
        throw new IllegalArgumentException();
    }

    public static void main(String[] args) {
        System.out.println(findMedianSortedArrays(new int[]{1, 3}, new int[]{2})); // 2.0
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-3",
    title: "First Missing Positive",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "Given an unsorted integer array `nums`, return the smallest missing positive integer. Must run in O(n) time and O(1) auxiliary space.",
      "**Example:** `Input: nums = [3, 4, -1, 1]` → `Output: 2`.",
      "**Approach:** Place each number in its correct index (`nums[i]` should be at index `nums[i]-1`). Then scan for the first index where `nums[i] != i+1`.",
    ],
    keyPoints: [
      "Cyclic sort / index-marking is the key to O(1) space for missing positive",
      "Only place values in range `[1, n]` — ignore negatives and values > n",
    ],
    code: [
      {
        title: "First Missing Positive — Cyclic Sort",
        language: "java",
        content: `public class FirstMissingPositive {
    public static int firstMissingPositive(int[] nums) {
        int n = nums.length;

        for (int i = 0; i < n; i++) {
            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int tmp = nums[nums[i] - 1];
                nums[nums[i] - 1] = nums[i];
                nums[i] = tmp;
            }
        }

        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }

    public static void main(String[] args) {
        System.out.println(firstMissingPositive(new int[]{3,4,-1,1})); // 2
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-4",
    title: "Sliding Window Maximum (LC 239)",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    theory: [
      "Given an array `nums` and a sliding window of size `k`, return the max element in each window position.",
      "**Example:** `Input: nums = [1,3,-1,-3,5,3,6,7], k = 3` → `Output: [3,3,5,5,6,7]`.",
      "**Approach:** Monotonic decreasing deque. Front of deque = index of current window max. Remove from front if out of window bounds, remove from back if smaller than current element.",
    ],
    keyPoints: [
      "Deque front always holds the index of the current window's maximum",
      "This pattern also appears in stock span, next greater element problems",
    ],
    code: [
      {
        title: "Sliding Window Maximum — Monotonic Deque",
        language: "java",
        content: `import java.util.*;

public class SlidingWindowMax {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] result = new int[n - k + 1];
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
        // [3, 3, 5, 5, 6, 7]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-5",
    title: "Count of Smaller Numbers After Self (LC 315)",
    difficulty: "Hard",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an integer array `nums`, return a list where `counts[i]` is the number of smaller elements to the right of `nums[i]`.",
      "**Example:** `Input: nums = [5, 2, 6, 1]` → `Output: [2, 1, 1, 0]`.",
      "**Approach:** Modified merge sort. During the merge step, count how many elements from the right half are placed before elements from the left half — these are the smaller elements to the right.",
    ],
    keyPoints: [
      "Merge sort counting is a powerful technique for inversion-related problems",
      "Track original indices alongside values to map counts back correctly",
    ],
    code: [
      {
        title: "Count Smaller — Merge Sort",
        language: "java",
        content: `import java.util.*;

public class CountSmaller {
    static int[] counts;

    public static List<Integer> countSmaller(int[] nums) {
        int n = nums.length;
        counts = new int[n];
        int[][] indexed = new int[n][2]; // {value, original index}
        for (int i = 0; i < n; i++) indexed[i] = new int[]{nums[i], i};
        mergeSort(indexed, 0, n - 1);
        List<Integer> result = new ArrayList<>();
        for (int c : counts) result.add(c);
        return result;
    }

    static void mergeSort(int[][] arr, int lo, int hi) {
        if (lo >= hi) return;
        int mid = (lo + hi) / 2;
        mergeSort(arr, lo, mid);
        mergeSort(arr, mid + 1, hi);
        merge(arr, lo, mid, hi);
    }

    static void merge(int[][] arr, int lo, int mid, int hi) {
        int[][] temp = new int[hi - lo + 1][2];
        int i = lo, j = mid + 1, k = 0, rightCount = 0;
        while (i <= mid && j <= hi) {
            if (arr[j][0] < arr[i][0]) {
                rightCount++;
                temp[k++] = arr[j++];
            } else {
                counts[arr[i][1]] += rightCount;
                temp[k++] = arr[i++];
            }
        }
        while (i <= mid) { counts[arr[i][1]] += rightCount; temp[k++] = arr[i++]; }
        while (j <= hi) temp[k++] = arr[j++];
        System.arraycopy(temp, 0, arr, lo, temp.length);
    }

    public static void main(String[] args) {
        System.out.println(countSmaller(new int[]{5, 2, 6, 1})); // [2, 1, 1, 0]
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-6",
    title: "Candy (LC 135)",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "There are `n` children in a line with ratings. Give candies such that: each child gets ≥1, and children with higher rating than neighbors get more. Minimize total candies.",
      "**Example:** `Input: ratings = [1, 0, 2]` → `Output: 5` — Candies = [2, 1, 2].",
      "**Example:** `Input: ratings = [1, 2, 2]` → `Output: 4` — Candies = [1, 2, 1].",
      "**Approach:** Two passes. Left-to-right: if `rating[i] > rating[i-1]`, `candy[i] = candy[i-1] + 1`. Right-to-left: if `rating[i] > rating[i+1]`, `candy[i] = max(candy[i], candy[i+1] + 1)`.",
    ],
    keyPoints: [
      "Two-pass greedy ensures both left and right neighbor constraints are satisfied",
      "Equal ratings don't need more candies — only strictly higher ratings matter",
    ],
    code: [
      {
        title: "Candy — Two-Pass Greedy",
        language: "java",
        content: `import java.util.*;

public class Candy {
    public static int candy(int[] ratings) {
        int n = ratings.length;
        int[] candies = new int[n];
        Arrays.fill(candies, 1);
        for (int i = 1; i < n; i++)
            if (ratings[i] > ratings[i - 1])
                candies[i] = candies[i - 1] + 1;
        for (int i = n - 2; i >= 0; i--)
            if (ratings[i] > ratings[i + 1])
                candies[i] = Math.max(candies[i], candies[i + 1] + 1);
        int total = 0;
        for (int c : candies) total += c;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(candy(new int[]{1, 0, 2})); // 5
        System.out.println(candy(new int[]{1, 2, 2})); // 4
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-7",
    title: "Max Points on a Line (LC 149)",
    difficulty: "Hard",
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(n)",
    theory: [
      "Given an array of points on a 2D plane, return the maximum number of points that lie on the same straight line.",
      "**Example:** `Input: points = [[1,1],[2,2],[3,3]]` → `Output: 3`.",
      "**Example:** `Input: points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]` → `Output: 4`.",
      "**Approach:** For each point, compute the slope to every other point using a HashMap. Use GCD to represent slopes as reduced fractions (avoid floating point issues).",
    ],
    keyPoints: [
      "Use GCD-reduced `(dy, dx)` pairs as slope key to avoid floating point errors",
      "Handle vertical lines (dx=0) and duplicate points as special cases",
    ],
    code: [
      {
        title: "Max Points on a Line",
        language: "java",
        content: `import java.util.*;

public class MaxPoints {
    public static int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int maxCount = 2;

        for (int i = 0; i < n; i++) {
            Map<String, Integer> slopeMap = new HashMap<>();
            for (int j = i + 1; j < n; j++) {
                int dy = points[j][1] - points[i][1];
                int dx = points[j][0] - points[i][0];
                int g = gcd(Math.abs(dy), Math.abs(dx));
                if (g != 0) { dy /= g; dx /= g; }
                if (dx < 0) { dy = -dy; dx = -dx; }
                String key = dy + "/" + dx;
                slopeMap.merge(key, 1, Integer::sum);
                maxCount = Math.max(maxCount, slopeMap.get(key) + 1);
            }
        }
        return maxCount;
    }

    static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

    public static void main(String[] args) {
        System.out.println(maxPoints(new int[][]{{1,1},{2,2},{3,3}})); // 3
        System.out.println(maxPoints(new int[][]{{1,1},{3,2},{5,3},{4,1},{2,3},{1,4}})); // 4
    }
}`,
      },
    ],
  },
  {
    id: "arrays-hard-8",
    title: "Minimum Number of Arrows to Burst Balloons (LC 452)",
    difficulty: "Hard",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    theory: [
      "Balloons are represented as intervals `[x_start, x_end]`. An arrow shot at x bursts all balloons where `x_start ≤ x ≤ x_end`. Find the minimum number of arrows needed.",
      "**Example:** `Input: points = [[10,16],[2,8],[1,6],[7,12]]` → `Output: 2` — Shoot at x=6 (bursts [2,8] and [1,6]) and x=11 (bursts [10,16] and [7,12]).",
      "**Approach:** Sort by end coordinate. Greedily shoot at the end of the first un-burst balloon. Skip all balloons that this arrow also bursts.",
    ],
    keyPoints: [
      "Sorting by end (not start) is key — it maximizes overlap with subsequent balloons",
      "Classic interval scheduling / greedy problem pattern",
    ],
    code: [
      {
        title: "Minimum Arrows — Greedy",
        language: "java",
        content: `import java.util.*;

public class MinArrows {
    public static int findMinArrowShots(int[][] points) {
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowPos = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }

    public static void main(String[] args) {
        System.out.println(findMinArrowShots(new int[][]{{10,16},{2,8},{1,6},{7,12}})); // 2
        System.out.println(findMinArrowShots(new int[][]{{1,2},{3,4},{5,6},{7,8}}));   // 4
    }
}`,
      },
    ],
  },
];
