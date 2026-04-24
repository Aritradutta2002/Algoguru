import { ContentSection } from "@/data/recursionContent";

export const arraysContent: ContentSection[] = [
  /* ═══════════════════════════════════════════════════════════
     ARRAYS FUNDAMENTALS
     ═══════════════════════════════════════════════════════════ */
  {
    id: "arr-intro",
    title: "Arrays — Introduction & Memory Layout",
    difficulty: "Easy",
    theory: [
      "An **Array** is a linear data structure that stores elements of the same type in **contiguous memory locations**.",
      "Each element is accessed via an **index** (0-based in Java, C++, Python). Random access is **O(1)** because the memory address of any element can be computed directly: `baseAddress + index × elementSize`.",
      "**Static arrays** have fixed size allocated at compile time (e.g., `int[] arr = new int[10]`). **Dynamic arrays** (like `ArrayList`) resize automatically when full — typically by doubling capacity (amortized O(1) append).",
      "Arrays are the foundation of nearly all algorithmic problem solving. Understanding their memory characteristics is crucial for optimizing solutions.",
      "**Time Complexities**: Access O(1), Search O(n), Insert at end O(1) amortized, Insert at middle O(n), Delete O(n).",
    ],
    keyPoints: [
      "Arrays store elements in contiguous memory — enables O(1) random access.",
      "0-based indexing: first element is at index 0, last at index n-1.",
      "Array size is fixed in Java (`int[]`). Use `ArrayList` for dynamic resizing.",
      "Cache-friendly: contiguous memory gives excellent CPU cache performance.",
      "Space complexity: O(n) for n elements.",
    ],
    code: [
      {
        title: "Array Basics (Java)",
        language: "java",
        content: `public class ArrayBasics {
    public static void main(String[] args) {
        // Declaration & initialization
        int[] arr = new int[5];           // [0, 0, 0, 0, 0]
        int[] nums = {1, 2, 3, 4, 5};     // literal initialization
        
        // Access & modify
        System.out.println(nums[0]);      // 1
        nums[2] = 10;                     // [1, 2, 10, 4, 5]
        
        // Length
        System.out.println(nums.length);  // 5
        
        // Traversal
        for (int i = 0; i < nums.length; i++) {
            System.out.print(nums[i] + " ");
        }
        
        // Enhanced for-loop
        for (int num : nums) {
            System.out.print(num + " ");
        }
    }
}`,
      },
    ],
  },

  {
    id: "arr-vs-list",
    title: "Array vs ArrayList in Java",
    difficulty: "Easy",
    theory: [
      "**Array** (`int[]`) is a fixed-size, low-level data structure built into the language. It can hold primitives or objects and offers the best performance for raw storage.",
      "**ArrayList** is a resizable-array implementation of the `List` interface. It wraps an array internally and automatically grows (typically 1.5x in Java) when capacity is exceeded.",
      "**Key differences**: Arrays have fixed size and can store primitives directly. ArrayList can only store objects (auto-boxing for primitives), grows dynamically, and provides rich API methods.",
      "For competitive programming, prefer `int[]` when the size is known. Use `ArrayList` when you need dynamic additions or rich list operations.",
    ],
    keyPoints: [
      "Array: fixed size, primitive-friendly, fastest, less flexible.",
      "ArrayList: dynamic size, object-only (auto-boxing), rich API, slight overhead.",
      "ArrayList grows by ~50% when full; copying elements takes O(n) but is rare.",
      "Use `arr.length` for arrays, `list.size()` for ArrayList.",
    ],
    code: [
      {
        title: "ArrayList Operations (Java)",
        language: "java",
        content: `import java.util.ArrayList;
import java.util.Collections;

public class ArrayListDemo {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        
        // Add elements
        list.add(10);           // append
        list.add(0, 5);         // insert at index 0
        
        // Access
        int first = list.get(0);  // 5
        
        // Update
        list.set(0, 7);         // [7, 10]
        
        // Remove
        list.remove(0);         // removes element at index 0
        list.remove(Integer.valueOf(10)); // removes object 10
        
        // Check
        boolean hasFive = list.contains(5);
        int idx = list.indexOf(10);
        
        // Size & clear
        System.out.println(list.size());
        list.clear();
        
        // Convert array to ArrayList
        int[] arr = {1, 2, 3};
        ArrayList<Integer> al = new ArrayList<>();
        for (int x : arr) al.add(x);
        
        // Sort
        Collections.sort(list);
    }
}`,
      },
    ],
  },

  {
    id: "arr-complexity",
    title: "Array Time & Space Complexity Cheat Sheet",
    difficulty: "Easy",
    theory: [
      "Understanding the complexity of array operations is fundamental to analyzing algorithm efficiency.",
      "**Access by index**: O(1) — direct memory address calculation.",
      "**Search (unsorted)**: O(n) — linear scan required.",
      "**Search (sorted)**: O(log n) — binary search.",
      "**Insert at end**: O(1) amortized for dynamic arrays, O(1) for static if space exists.",
      "**Insert at beginning/middle**: O(n) — all subsequent elements must shift.",
      "**Delete**: O(n) — elements after the deleted position must shift left.",
    ],
    table: {
      headers: ["Operation", "Static Array", "Dynamic Array", "Notes"],
      rows: [
        ["Access by index", "O(1)", "O(1)", "Direct memory addressing"],
        ["Search (linear)", "O(n)", "O(n)", "Unsorted data"],
        ["Search (binary)", "O(log n)", "O(log n)", "Requires sorted data"],
        ["Insert at end", "O(1)*", "O(1) amortized", "*If pre-allocated space"],
        ["Insert at middle", "O(n)", "O(n)", "Shift elements right"],
        ["Delete", "O(n)", "O(n)", "Shift elements left"],
        ["Space", "O(n)", "O(n)", "Contiguous allocation"],
      ],
    },
    keyPoints: [
      "Arrays excel at O(1) random access but suffer on insertions/deletions.",
      "Binary search requires sorted input — preprocessing cost O(n log n) or O(n) if using counting/radix.",
      "Cache locality makes arrays faster than linked lists in practice despite same Big-O.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     TWO POINTER TECHNIQUE
     ═══════════════════════════════════════════════════════════ */
  {
    id: "tp-theory",
    title: "Two Pointer Technique — Theory & Patterns",
    difficulty: "Easy",
    theory: [
      "The **Two Pointer** technique uses two indices (pointers) that traverse an array to solve problems efficiently, often reducing time complexity from O(n²) to O(n).",
      "**When to use**: Problems involving pairs, triplets, partitioning, or searching in sorted arrays. Works best when the array is sorted or can be sorted.",
      "**Two main patterns**:",
      "1. **Opposite Ends**: One pointer starts at the beginning (`left = 0`), the other at the end (`right = n-1`). They move toward each other based on conditions. Used for: pair sums, container problems, palindrome checks.",
      "2. **Same Direction (Fast & Slow)**: Both pointers start at the beginning, but one moves faster. Used for: removing duplicates, Dutch National Flag, cycle detection (Floyd's).",
      "**Why it works**: By moving pointers intelligently, we eliminate large portions of the search space without nested loops.",
    ],
    keyPoints: [
      "Two pointers usually require O(1) extra space — a space-efficient alternative to hashing.",
      "If the array is unsorted and order doesn't matter, consider sorting first (O(n log n)).",
      "Opposite-end pattern: move the pointer that leads to a better solution.",
      "Same-direction pattern: the slow pointer tracks valid elements, fast pointer scans.",
      "Always check for edge cases: empty array, single element, all same elements.",
    ],
    diagram: {
      type: "flow",
      title: "Two Pointer Patterns",
      direction: "vertical",
      data: [
        { label: "Opposite Ends", color: "primary", children: [{ label: "left=0, right=n-1 → move toward center" }] },
        { label: "Same Direction", color: "accent", children: [{ label: "slow=0, fast=0 → fast leads, slow tracks" }] },
      ],
    },
  },

  {
    id: "tp-two-sum-ii",
    title: "Two Sum II — Input Array Is Sorted",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Given a 1-indexed sorted array, find two numbers that add up to a target. Return their 1-indexed positions.",
      "**Example**: Input: `numbers = [2, 7, 11, 15]`, target = `9`. Output: `[1, 2]` because numbers[0] + numbers[1] = 2 + 7 = 9.",
      "**Approach**: Use two pointers at opposite ends. Calculate `sum = nums[left] + nums[right]`.",
      "- If `sum == target`, we found the answer.",
      "- If `sum < target`, we need a larger sum → move `left++`.",
      "- If `sum > target`, we need a smaller sum → move `right--`.",
      "**Why this works**: The array is sorted. If the sum is too small, increasing the left pointer gives a larger sum. If too large, decreasing the right pointer gives a smaller sum.",
    ],
    keyPoints: [
      "Only works on sorted arrays. If unsorted, sort first (loses original indices) or use HashMap.",
      "Guaranteed exactly one solution — no need for complex exit conditions.",
      "O(n) time, O(1) space — optimal for sorted input.",
    ],
    code: [
      {
        title: "Two Sum II — Two Pointers (Java)",
        language: "java",
        content: `public class TwoSumII {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;
        
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            
            if (sum == target) {
                return new int[]{left + 1, right + 1}; // 1-indexed
            } else if (sum < target) {
                left++;  // need larger sum
            } else {
                right--; // need smaller sum
            }
        }
        
        return new int[]{-1, -1}; // no solution
    }
}`,
      },
    ],
  },

  {
    id: "tp-3sum",
    title: "3Sum — Find All Unique Triplets",
    difficulty: "Medium",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1) or O(n) for sorting",
    theory: [
      "**Problem**: Given an integer array, return all unique triplets `[a, b, c]` such that `a + b + c = 0`.",
      "**Example**: Input: `nums = [-1, 0, 1, 2, -1, -4]`. Output: `[[-1, -1, 2], [-1, 0, 1]]`.",
      "**Approach**: Sort the array first (O(n log n)). Fix one element, then use two pointers on the remaining subarray to find pairs that sum to the negative of the fixed element.",
      "**Skip duplicates**: After sorting, skip duplicate values for the fixed element and both pointers to avoid duplicate triplets in the result.",
      "**Why sorting helps**: Sorting enables the two-pointer technique and makes duplicate skipping trivial.",
    ],
    keyPoints: [
      "Sort first → enables O(n²) instead of O(n³) brute force.",
      "Skip duplicates at all three levels: fixed index, left pointer, right pointer.",
      "When sum == 0, add triplet and move both pointers (skipping duplicates).",
      "If sum < 0, left++. If sum > 0, right--.",
    ],
    code: [
      {
        title: "3Sum — Sort + Two Pointers (Java)",
        language: "java",
        content: `import java.util.*;

public class ThreeSum {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(nums);
        
        for (int i = 0; i < nums.length - 2; i++) {
            // Skip duplicate fixed elements
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            
            // Early termination: if smallest sum > 0, break
            if (nums[i] > 0) break;
            
            int left = i + 1;
            int right = nums.length - 1;
            
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                
                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    
                    // Skip duplicates for left and right
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        
        return result;
    }
}`,
      },
    ],
  },

  {
    id: "tp-container-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Given `n` non-negative integers representing heights of vertical lines, find two lines that together with the x-axis form a container that holds the most water.",
      "**Example**: Input: `height = [1,8,6,2,5,4,8,3,7]`. Output: `49`. The lines at index 1 (height 8) and index 8 (height 7) form area = min(8,7) × (8-1) = 7 × 7 = 49.",
      "**Area formula**: `Area = min(height[left], height[right]) × (right - left)`.",
      "**Approach**: Start with pointers at both ends (widest container). Calculate area. Move the pointer with the smaller height inward — because keeping the larger height and finding a potentially taller line might increase area.",
      "**Why move the shorter pointer?**: The area is limited by the shorter line. Moving the taller pointer inward can only decrease width without guaranteeing a height increase. Moving the shorter pointer gives a chance to find a taller limiting boundary.",
    ],
    keyPoints: [
      "Start with max width (left=0, right=n-1), then greedily shrink.",
      "Always move the pointer at the shorter line — the taller one might still be useful.",
      "Track max area seen during the process.",
      "Greedy proof: any container using the shorter line with a smaller width cannot beat our current best.",
    ],
    code: [
      {
        title: "Container With Most Water (Java)",
        language: "java",
        content: `public class ContainerWithMostWater {
    public int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int maxArea = 0;
        
        while (left < right) {
            int width = right - left;
            int h = Math.min(height[left], height[right]);
            maxArea = Math.max(maxArea, width * h);
            
            // Move the pointer at the shorter line
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        
        return maxArea;
    }
}`,
      },
    ],
  },

  {
    id: "tp-trapping-rain",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Given `n` non-negative integers representing an elevation map, compute how much water it can trap after raining.",
      "**Example**: Input: `height = [0,1,0,2,1,0,1,3,2,1,2,1]`. Output: `6`.",
      "**Key Insight**: Water trapped at any position = `min(maxLeft, maxRight) - height[i]`. Water only traps if bounded by taller bars on both sides.",
      "**Approach — Two Pointers O(1) space**: Use `left` and `right` pointers with `leftMax` and `rightMax` trackers. Move the pointer at the smaller side — the water level is guaranteed by the smaller max.",
      "**Why it works**: If `leftMax < rightMax`, water at `left` is determined by `leftMax` (the right side is guaranteed to be at least `rightMax >= leftMax`). We process `left` and move it right.",
    ],
    keyPoints: [
      "Two-pointer approach uses O(1) space vs O(n) for prefix max arrays.",
      "Only process the side with the smaller max — the other side guarantees a bound.",
      "If current height >= side max, update the max (no water trapped).",
      "Else, trapped water = sideMax - current height.",
    ],
    code: [
      {
        title: "Trapping Rain Water — Two Pointers (Java)",
        language: "java",
        content: `public class TrappingRainWater {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        
        while (left < right) {
            if (height[left] < height[right]) {
                // Process left side
                if (height[left] >= leftMax) {
                    leftMax = height[left]; // new boundary
                } else {
                    water += leftMax - height[left]; // trap water
                }
                left++;
            } else {
                // Process right side
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    water += rightMax - height[right];
                }
                right--;
            }
        }
        
        return water;
    }
}`,
      },
    ],
  },

  {
    id: "tp-remove-dup",
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Given a sorted array, remove duplicates in-place such that each unique element appears only once. Return the number of unique elements.",
      "**Example**: Input: `nums = [0,0,1,1,1,2,2,3,3,4]`. After operation: `nums = [0,1,2,3,4,_,_,_,_,_]`. Return `5`.",
      "**Approach — Fast & Slow Pointers**: `slow` pointer marks the position of the last unique element. `fast` pointer scans ahead. When `nums[fast] != nums[slow]`, we found a new unique element — increment `slow` and copy `nums[fast]` to `nums[slow]`.",
      "**Why in-place?**: The problem requires O(1) extra memory. We overwrite the beginning of the array with unique elements.",
    ],
    keyPoints: [
      "Slow pointer tracks the last position of unique elements.",
      "Fast pointer discovers new unique elements.",
      "Return `slow + 1` as the count (slow is 0-indexed).",
      "Array must be sorted for this approach to work.",
    ],
    code: [
      {
        title: "Remove Duplicates — Fast & Slow (Java)",
        language: "java",
        content: `public class RemoveDuplicates {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        
        int slow = 0;
        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        
        return slow + 1; // number of unique elements
    }
}`,
      },
    ],
  },

  {
    id: "tp-sort-colors",
    title: "Sort Colors — Dutch National Flag",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Given an array with `n` objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent in the order red, white, blue.",
      "**Example**: Input: `nums = [2,0,2,1,1,0]`. Output: `[0,0,1,1,2,2]`.",
      "**Approach — Three Pointers**: `low` marks the boundary of 0s (reds), `mid` scans the array, `high` marks the boundary of 2s (blues).",
      "- `nums[mid] == 0`: swap with `nums[low]`, increment both `low` and `mid`.",
      "- `nums[mid] == 1`: just increment `mid` (white is in correct place).",
      "- `nums[mid] == 2`: swap with `nums[high]`, decrement `high` (don't increment `mid` — need to check the swapped element).",
      "**Named after**: Edsger Dijkstra's Dutch National Flag problem.",
    ],
    keyPoints: [
      "Three-way partitioning — extends two-pointer to three categories.",
      "Invariant: [0..low-1] = 0s, [low..mid-1] = 1s, [high+1..end] = 2s.",
      "When swapping with high, don't advance mid — the swapped element is unknown.",
      "Single pass O(n) with O(1) space — optimal.",
    ],
    code: [
      {
        title: "Sort Colors — Dutch National Flag (Java)",
        language: "java",
        content: `public class SortColors {
    public void sortColors(int[] nums) {
        int low = 0, mid = 0;
        int high = nums.length - 1;
        
        while (mid <= high) {
            if (nums[mid] == 0) {
                // Swap with low boundary
                swap(nums, low, mid);
                low++;
                mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                // nums[mid] == 2, swap with high boundary
                swap(nums, mid, high);
                high--;
                // Don't increment mid — check swapped element
            }
        }
    }
    
    private void swap(int[] nums, int i, int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
}`,
      },
    ],
  },

  {
    id: "tp-summary",
    title: "Two Pointer Pattern Summary",
    difficulty: "Easy",
    theory: [
      "The Two Pointer technique is one of the most important patterns in array problem solving. Here's a quick reference.",
    ],
    table: {
      headers: ["Pattern", "When to Use", "Example Problems", "Complexity"],
      rows: [
        ["Opposite Ends", "Sorted array, pair sums, max/min area", "Two Sum II, Container Water, Trapping Rain", "O(n) time, O(1) space"],
        ["Fast & Slow", "Remove duplicates, in-place modifications", "Remove Dups, Move Zeros, Sorted Squares", "O(n) time, O(1) space"],
        ["Three Pointers", "Three-way partitioning, 3Sum", "Sort Colors, 3Sum, 3Sum Closest", "O(n) time, O(1) space"],
        ["Sliding Window", "Subarrays with constraints", "Max Subarray, Longest Substring", "O(n) time, O(1) space"],
      ],
    },
    keyPoints: [
      "Always consider sorting first if the problem involves comparisons.",
      "Two pointers often eliminate the need for extra space (vs HashMap).",
      "If the array is unsorted and you need original indices, use HashMap instead.",
      "Practice recognizing the pattern: 'find a pair', 'partition', 'in-place sort'.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     PREFIX SUM
     ═══════════════════════════════════════════════════════════ */
  {
    id: "ps-theory",
    title: "Prefix Sum — Theory & Fundamentals",
    difficulty: "Easy",
    theory: [
      "A **Prefix Sum** array stores the cumulative sum of elements up to each index. `prefix[i] = arr[0] + arr[1] + ... + arr[i]`.",
      "**Key Property**: Sum of any subarray `[l..r]` = `prefix[r] - prefix[l-1]` (or `prefix[r+1] - prefix[l]` for 1-indexed). This transforms range sum queries from O(n) to O(1).",
      "**When to use**: Range sum queries, subarray sum problems, finding subarrays with specific sum properties, and problems that can be transformed into 'find two indices with same prefix sum'.",
      "**Difference Array**: The inverse of prefix sum. A difference array `diff` where `diff[i] = arr[i] - arr[i-1]` allows O(1) range updates and O(n) final array reconstruction.",
      "**2D Prefix Sum**: For matrices, `prefix[i][j]` stores the sum of the rectangle from (0,0) to (i,j). Submatrix sum queries become O(1).",
    ],
    keyPoints: [
      "Prefix sum preprocessing: O(n). Each range query: O(1).",
      "Subarray sum [l..r] = prefix[r+1] - prefix[l] (1-indexed prefix).",
      "Difference array enables O(1) range add/update operations.",
      "HashMap + Prefix Sum solves 'subarray sum equals K' problems.",
      "2D prefix sum formula: prefix[i][j] = arr[i][j] + prefix[i-1][j] + prefix[i][j-1] - prefix[i-1][j-1].",
    ],
    code: [
      {
        title: "Prefix Sum Array (Java)",
        language: "java",
        content: `public class PrefixSum {
    // Build prefix sum array (1-indexed for easier range queries)
    public int[] buildPrefix(int[] arr) {
        int n = arr.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + arr[i];
        }
        return prefix;
    }
    
    // Range sum query [l, r] inclusive, 0-indexed
    public int rangeSum(int[] prefix, int l, int r) {
        return prefix[r + 1] - prefix[l];
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        PrefixSum ps = new PrefixSum();
        int[] prefix = ps.buildPrefix(arr);
        
        // Sum of [1..3] = 2 + 3 + 4 = 9
        System.out.println(ps.rangeSum(prefix, 1, 3)); // 9
    }
}`,
      },
    ],
  },

  {
    id: "ps-range-query",
    title: "Range Sum Query — Immutable",
    difficulty: "Easy",
    timeComplexity: "O(1) per query, O(n) preprocess",
    spaceComplexity: "O(n)",
    theory: [
      "**Problem**: Given an integer array, handle multiple sum range queries efficiently.",
      "**Example**: Input: `nums = [-2, 0, 3, -5, 2, -1]`. sumRange(0, 2) → 1, sumRange(2, 5) → -1, sumRange(0, 5) → -3.",
      "**Approach**: Precompute prefix sums in the constructor. Each query becomes a simple subtraction.",
      "**Optimization**: Build prefix array as part of object initialization. Queries are then O(1).",
    ],
    keyPoints: [
      "Classic use case for prefix sums — multiple queries on static data.",
      "If the array changes between queries, use a Segment Tree or Fenwick Tree.",
      "Preprocessing is O(n); each of q queries is O(1); total O(n + q).",
    ],
    code: [
      {
        title: "Range Sum Query — Prefix Sum (Java)",
        language: "java",
        content: `class NumArray {
    private int[] prefix;
    
    public NumArray(int[] nums) {
        int n = nums.length;
        prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }
    
    public int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}

// Usage:
// NumArray obj = new NumArray(new int[]{-2, 0, 3, -5, 2, -1});
// int param1 = obj.sumRange(0, 2); // 1`,
      },
    ],
  },

  {
    id: "ps-subarray-sum-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**Problem**: Given an array and integer k, return the total number of continuous subarrays whose sum equals k.",
      "**Example**: Input: `nums = [1, 1, 1]`, k = `2`. Output: `2` (subarrays: [0,1] and [1,2]).",
      "**Brute Force**: Check all O(n²) subarrays — too slow for large inputs.",
      "**Optimal Approach — HashMap + Prefix Sum**: As we traverse, maintain a running sum. If `currentSum - k` has been seen before at some index, the subarray between that index and current index sums to k.",
      "**Why it works**: `prefix[j] - prefix[i-1] = k` → `prefix[i-1] = prefix[j] - k`. We store prefix sums in a HashMap and count occurrences.",
    ],
    keyPoints: [
      "Use HashMap<prefixSum, count> to store how many times each prefix sum occurs.",
      "Initialize map with `{0: 1}` to handle subarrays starting from index 0.",
      "For each element: currentSum += nums[i]; result += map.getOrDefault(currentSum - k, 0); map.put(currentSum, map.getOrDefault(currentSum, 0) + 1).",
      "Handles negative numbers correctly — a major advantage over sliding window.",
    ],
    code: [
      {
        title: "Subarray Sum Equals K — HashMap + Prefix (Java)",
        language: "java",
        content: `import java.util.HashMap;

public class SubarraySumEqualsK {
    public int subarraySum(int[] nums, int k) {
        HashMap<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // empty subarray has sum 0
        
        int currentSum = 0;
        int count = 0;
        
        for (int num : nums) {
            currentSum += num;
            
            // If currentSum - k exists, those prefix positions form valid subarrays
            count += prefixCount.getOrDefault(currentSum - k, 0);
            
            // Store current prefix sum
            prefixCount.put(currentSum, 
                prefixCount.getOrDefault(currentSum, 0) + 1);
        }
        
        return count;
    }
}`,
      },
    ],
  },

  {
    id: "ps-product-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) excluding output",
    theory: [
      "**Problem**: Given an array, return an array where each element at index i is the product of all elements except nums[i]. Must run in O(n) without using division.",
      "**Example**: Input: `nums = [1, 2, 3, 4]`. Output: `[24, 12, 8, 6]`.",
      "**Approach — Prefix & Suffix Products**: Compute prefix products (product of all elements to the left) and suffix products (product of all elements to the right). Result[i] = prefix[i] × suffix[i].",
      "**Space Optimization**: Use the output array for prefix products, then traverse from right maintaining a running suffix product and multiply in-place.",
    ],
    keyPoints: [
      "First pass (left to right): output[i] = product of all elements before i.",
      "Second pass (right to left): maintain suffix product, multiply into output[i].",
      "No division needed — avoids division-by-zero issues.",
      "O(1) extra space (output array doesn't count per problem statement).",
    ],
    code: [
      {
        title: "Product Except Self — Prefix & Suffix (Java)",
        language: "java",
        content: `public class ProductExceptSelf {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] output = new int[n];
        
        // First pass: prefix products
        output[0] = 1;
        for (int i = 1; i < n; i++) {
            output[i] = output[i - 1] * nums[i - 1];
        }
        
        // Second pass: suffix products multiplied in
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            output[i] *= suffix;
            suffix *= nums[i];
        }
        
        return output;
    }
}`,
      },
    ],
  },

  {
    id: "ps-kadane",
    title: "Maximum Subarray — Kadane's Algorithm",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Problem**: Find the contiguous subarray with the largest sum and return its sum.",
      "**Example**: Input: `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`. Output: `6` (subarray: `[4, -1, 2, 1]`).",
      "**Approach — Kadane's Algorithm**: At each position, decide whether to extend the previous subarray or start fresh. `currentMax = max(nums[i], currentMax + nums[i])`. Track global maximum.",
      "**Why it works**: If the running sum becomes negative, it will only decrease future sums — better to restart from the next element.",
      "**Prefix Sum perspective**: This is equivalent to finding the maximum difference `prefix[j] - prefix[i]` where `i < j`, with `prefix[i]` being the minimum prefix seen so far.",
    ],
    keyPoints: [
      "Kadane's is greedy: at each step, decide to extend or restart.",
      "Handles all-negative arrays correctly (pick the least negative).",
      "For finding the actual subarray indices, track start/end positions.",
      "Variation: Circular subarray maximum (consider wrap-around).",
    ],
    code: [
      {
        title: "Kadane's Algorithm (Java)",
        language: "java",
        content: `public class MaximumSubarray {
    public int maxSubArray(int[] nums) {
        int currentMax = nums[0];
        int globalMax = nums[0];
        
        for (int i = 1; i < nums.length; i++) {
            // Extend or restart
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            globalMax = Math.max(globalMax, currentMax);
        }
        
        return globalMax;
    }
    
    // Variant: also return start and end indices
    public int[] maxSubArrayWithIndices(int[] nums) {
        int currentMax = nums[0], globalMax = nums[0];
        int start = 0, end = 0, tempStart = 0;
        
        for (int i = 1; i < nums.length; i++) {
            if (currentMax + nums[i] < nums[i]) {
                currentMax = nums[i];
                tempStart = i;
            } else {
                currentMax += nums[i];
            }
            
            if (currentMax > globalMax) {
                globalMax = currentMax;
                start = tempStart;
                end = i;
            }
        }
        
        return new int[]{globalMax, start, end};
    }
}`,
      },
    ],
  },

  {
    id: "ps-subarray-divisible",
    title: "Subarray Sums Divisible by K",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    theory: [
      "**Problem**: Given an array and integer K, return the number of subarrays with a sum divisible by K.",
      "**Example**: Input: `nums = [4, 5, 0, -2, -3, 1]`, K = `5`. Output: `7`.",
      "**Key Insight**: `(prefix[j] - prefix[i]) % K == 0` means `prefix[j] % K == prefix[i] % K`. We just need to count pairs of equal remainders.",
      "**Handle negatives**: In Java, `%` can be negative. Use `(prefix % K + K) % K` to get a positive remainder in `[0, K-1]`.",
      "**Approach**: Track remainder frequencies in a HashMap. For each prefix sum, compute remainder and add the count of previous same remainders.",
    ],
    keyPoints: [
      "Remainder equivalence: subarray sum divisible by K ↔ equal remainders.",
      "Normalize negative remainders: `((rem % K) + K) % K`.",
      "If same remainder appears `c` times, valid pairs = `c * (c - 1) / 2`.",
      "Space is O(K) since there are only K possible remainders.",
    ],
    code: [
      {
        title: "Subarrays Divisible by K — Prefix Remainder (Java)",
        language: "java",
        content: `import java.util.HashMap;

public class SubarraysDivisibleByK {
    public int subarraysDivByK(int[] nums, int k) {
        HashMap<Integer, Integer> remainderCount = new HashMap<>();
        remainderCount.put(0, 1); // prefix sum 0 has remainder 0
        
        int prefixSum = 0;
        int count = 0;
        
        for (int num : nums) {
            prefixSum += num;
            int rem = ((prefixSum % k) + k) % k; // handle negatives
            
            count += remainderCount.getOrDefault(rem, 0);
            remainderCount.put(rem, remainderCount.getOrDefault(rem, 0) + 1);
        }
        
        return count;
    }
}`,
      },
    ],
  },

  {
    id: "ps-continuous-subarray",
    title: "Continuous Subarray Sum",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    theory: [
      "**Problem**: Given an array and integer k, check if there exists a subarray of size at least 2 whose sum is divisible by k.",
      "**Example**: Input: `nums = [23, 2, 4, 6, 7]`, k = `6`. Output: `true` (subarray `[2, 4]` sums to 6).",
      "**Key Insight**: Same as Subarray Sums Divisible by K, but with an additional constraint: subarray length must be ≥ 2. This means we need two prefix sums with the same remainder that are at least 2 indices apart.",
      "**Optimization**: Store the first occurrence of each remainder. If the same remainder is seen again at index j, and first occurrence was at index i, subarray length = j - i. We need `j - i >= 2`.",
    ],
    keyPoints: [
      "Store first index of each remainder, not count.",
      "If same remainder appears again, check if `currentIndex - firstIndex >= 2`.",
      "Don't update the stored index if remainder seen again — we want the earliest occurrence for max distance.",
      "Handles edge case: prefix sum itself divisible by k with length >= 2.",
    ],
    code: [
      {
        title: "Continuous Subarray Sum — First Occurrence (Java)",
        language: "java",
        content: `import java.util.HashMap;

public class ContinuousSubarraySum {
    public boolean checkSubarraySum(int[] nums, int k) {
        HashMap<Integer, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0, -1); // prefix sum 0 at index -1
        
        int prefixSum = 0;
        
        for (int i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            int rem = ((prefixSum % k) + k) % k;
            
            if (firstIndex.containsKey(rem)) {
                if (i - firstIndex.get(rem) >= 2) {
                    return true;
                }
            } else {
                firstIndex.put(rem, i); // store first occurrence only
            }
        }
        
        return false;
    }
}`,
      },
    ],
  },

  {
    id: "ps-summary",
    title: "Prefix Sum Pattern Summary",
    difficulty: "Easy",
    theory: [
      "Prefix Sum transforms range queries and subarray problems into simple arithmetic operations.",
    ],
    table: {
      headers: ["Pattern", "When to Use", "Key Formula", "Complexity"],
      rows: [
        ["Standard Prefix", "Multiple range sum queries", "sum[l..r] = prefix[r+1] - prefix[l]", "O(n) preprocess, O(1) query"],
        ["Prefix + HashMap", "Subarray sum equals K", "count += map.get(currentSum - K)", "O(n) time, O(n) space"],
        ["Prefix Remainder", "Divisible subarrays", "same remainder → divisible", "O(n) time, O(k) space"],
        ["Prefix & Suffix", "Product except self", "result = prefix × suffix", "O(n) time, O(1) space"],
        ["2D Prefix", "Matrix range queries", "inclusion-exclusion principle", "O(mn) preprocess, O(1) query"],
      ],
    },
    keyPoints: [
      "Prefix sums shine when you need repeated range queries on static data.",
      "Combining with HashMap unlocks subarray counting problems.",
      "For mutable arrays with range queries, use Segment Tree or Fenwick Tree.",
      "Always normalize negative remainders: `((x % k) + k) % k`.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     HASHMAP & HASHING
     ═══════════════════════════════════════════════════════════ */
  {
    id: "hash-theory",
    title: "Hashing & HashMap — Theory & Internals",
    difficulty: "Easy",
    theory: [
      "**Hashing** is a technique that maps data of arbitrary size to fixed-size values (hash codes) using a hash function. It enables O(1) average-case lookups, insertions, and deletions.",
      "**HashMap** in Java implements the Map interface using an array of buckets. Each bucket is a linked list (or tree for large buckets since Java 8) of entries that hash to the same index.",
      "**How it works**: `hash(key) → index = hash & (capacity - 1)`. The key-value pair is stored at that index. Collisions (different keys, same index) are resolved by chaining.",
      "**Load Factor**: Default is 0.75. When `size / capacity > 0.75`, the HashMap resizes (doubles capacity) and rehashes all entries. This is expensive — initialize with expected size if known.",
      "**Time Complexities**: Get/Put/Remove are O(1) average, O(n) worst case (all keys collide). With good hash distribution, the treeify threshold (8) prevents degradation to O(n).",
      "**Important**: Keys must be immutable and properly implement `hashCode()` and `equals()`. Mutable keys can cause lost entries.",
    ],
    keyPoints: [
      "HashMap provides O(1) average-case for get, put, remove.",
      "Default initial capacity: 16, load factor: 0.75.",
      "Java 8+: buckets switch from linked list to red-black tree when size > 8.",
      "Use `HashMap<>(expectedSize)` to avoid unnecessary resizing.",
      "Keys must be immutable; override `hashCode()` and `equals()` for custom keys.",
    ],
    diagram: {
      type: "layers",
      title: "HashMap Internal Structure",
      direction: "vertical",
      data: [
        { label: "Array of Buckets", color: "primary", children: [{ label: "Index 0 → Entry (K1,V1) → Entry (K2,V2)" }, { label: "Index 1 → null" }, { label: "Index 2 → Entry (K3,V3)" }] },
        { label: "Collision Resolution", color: "accent", children: [{ label: "Linked List (size ≤ 8)" }, { label: "Red-Black Tree (size > 8)" }] },
      ],
    },
    code: [
      {
        title: "HashMap Fundamentals (Java)",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;

public class HashMapDemo {
    public static void main(String[] args) {
        // Initialize with expected capacity
        Map<String, Integer> map = new HashMap<>(100);
        
        // Put & get
        map.put("apple", 10);
        map.put("banana", 20);
        int val = map.get("apple"); // 10
        
        // Check existence
        boolean hasApple = map.containsKey("apple"); // true
        boolean hasValue10 = map.containsValue(10);  // true
        
        // Get with default
        int cherry = map.getOrDefault("cherry", 0); // 0
        
        // Update
        map.put("apple", 15); // overwrite
        map.merge("apple", 5, Integer::sum); // apple = 20
        
        // Remove
        map.remove("banana");
        
        // Iterate
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " = " + entry.getValue());
        }
        
        // Size & clear
        System.out.println(map.size());
        map.clear();
    }
}`,
      },
    ],
  },

  {
    id: "hash-two-sum",
    title: "Two Sum — Unsorted Array",
    difficulty: "Easy",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**Problem**: Given an unsorted array and target, return indices of two numbers that add up to target.",
      "**Example**: Input: `nums = [2, 7, 11, 15]`, target = `9`. Output: `[0, 1]`.",
      "**Brute Force**: Check all pairs O(n²). Too slow.",
      "**Optimal — HashMap**: As we iterate, store each number and its index. For each `nums[i]`, check if `target - nums[i]` exists in the map. If yes, return both indices.",
      "**Why it works**: We look for the complement in O(1) time using the HashMap, trading space for time.",
    ],
    keyPoints: [
      "HashMap approach works on unsorted arrays — no need to sort.",
      "Store value → index mapping as you iterate.",
      "Check for complement before inserting current element to avoid using the same element twice.",
      "O(n) time, O(n) space — optimal for unsorted input.",
    ],
    code: [
      {
        title: "Two Sum — HashMap (Java)",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            
            map.put(nums[i], i);
        }
        
        return new int[]{-1, -1}; // no solution
    }
}`,
      },
    ],
  },

  {
    id: "hash-group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    timeComplexity: "O(n × k log k)",
    spaceComplexity: "O(n × k)",
    theory: [
      "**Problem**: Given an array of strings, group anagrams together.",
      "**Example**: Input: `strs = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']`. Output: `[['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']]`.",
      "**Approach 1 — Sort as Key**: Sort each string alphabetically. All anagrams sort to the same string. Use this sorted string as a HashMap key.",
      "**Approach 2 — Character Count as Key**: Count characters (26 letters) and use the count array as a key (e.g., `#1#0#2...`). Slightly faster for long strings: O(n × k) where k = max string length.",
    ],
    keyPoints: [
      "Anagrams have identical sorted representations.",
      "Character count key is O(k) vs O(k log k) for sorting — better for long strings.",
      "Use `Map<String, List<String>>` to group results.",
      "Edge cases: empty strings, single character, all same strings.",
    ],
    code: [
      {
        title: "Group Anagrams — Sort Key (Java)",
        language: "java",
        content: `import java.util.*;

public class GroupAnagrams {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        
        return new ArrayList<>(groups.values());
    }
    
    // Alternative: Character count key (O(n*k) time)
    public List<List<String>> groupAnagramsCount(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        
        for (String s : strs) {
            int[] count = new int[26];
            for (char c : s.toCharArray()) {
                count[c - 'a']++;
            }
            
            StringBuilder key = new StringBuilder();
            for (int c : count) {
                key.append('#').append(c);
            }
            
            groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
        }
        
        return new ArrayList<>(groups.values());
    }
}`,
      },
    ],
  },

  {
    id: "hash-longest-consecutive",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**Problem**: Given an unsorted array of integers, return the length of the longest consecutive elements sequence.",
      "**Example**: Input: `nums = [100, 4, 200, 1, 3, 2]`. Output: `4` (sequence: `[1, 2, 3, 4]`).",
      "**Brute Force**: Sort then find longest consecutive run: O(n log n).",
      "**Optimal — HashSet**: Insert all numbers into a HashSet. For each number, only start counting if `num - 1` is NOT in the set (meaning it's the start of a sequence). Then count consecutive numbers.",
      "**Why O(n)?**: Each number is visited at most twice — once in the outer loop, once in the sequence counting. The `num - 1` check ensures we only start from sequence beginnings.",
    ],
    keyPoints: [
      "Use HashSet for O(1) lookups.",
      "Only start counting from sequence beginnings (num - 1 not in set).",
      "Each element is part of at most one sequence count — amortized O(n).",
      "Handles duplicates: HashSet automatically deduplicates.",
    ],
    code: [
      {
        title: "Longest Consecutive Sequence — HashSet (Java)",
        language: "java",
        content: `import java.util.HashSet;
import java.util.Set;

public class LongestConsecutiveSequence {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int num : nums) set.add(num);
        
        int longest = 0;
        
        for (int num : set) {
            // Only start from beginning of sequence
            if (!set.contains(num - 1)) {
                int current = num;
                int streak = 1;
                
                while (set.contains(current + 1)) {
                    current++;
                    streak++;
                }
                
                longest = Math.max(longest, streak);
            }
        }
        
        return longest;
    }
}`,
      },
    ],
  },

  {
    id: "hash-top-k",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(n)",
    theory: [
      "**Problem**: Given an integer array and integer k, return the k most frequent elements.",
      "**Example**: Input: `nums = [1, 1, 1, 2, 2, 3]`, k = `2`. Output: `[1, 2]`.",
      "**Approach 1 — HashMap + Min Heap**: Count frequencies with HashMap. Use a min heap of size k to track top k elements. If heap exceeds k, pop the smallest.",
      "**Approach 2 — HashMap + Bucket Sort**: Create buckets where index = frequency. The maximum frequency is at most n. Traverse buckets from high to low to collect k elements — achieves O(n) time.",
    ],
    keyPoints: [
      "Bucket sort approach achieves O(n) time — optimal.",
      "Min heap approach is O(n log k) — good when k is small.",
      "Frequency map: `Map<Integer, Integer>` counting occurrences.",
      "Bucket array: `List<Integer>[] buckets = new List[n + 1]`.",
    ],
    code: [
      {
        title: "Top K Frequent — Bucket Sort (Java)",
        language: "java",
        content: `import java.util.*;

public class TopKFrequent {
    public int[] topKFrequent(int[] nums, int k) {
        // Step 1: Frequency map
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }
        
        // Step 2: Bucket sort by frequency
        List<Integer>[] buckets = new List[nums.length + 1];
        for (int num : freq.keySet()) {
            int count = freq.get(num);
            if (buckets[count] == null) {
                buckets[count] = new ArrayList<>();
            }
            buckets[count].add(num);
        }
        
        // Step 3: Collect from highest frequency
        int[] result = new int[k];
        int idx = 0;
        for (int i = buckets.length - 1; i >= 0 && idx < k; i--) {
            if (buckets[i] != null) {
                for (int num : buckets[i]) {
                    result[idx++] = num;
                    if (idx == k) break;
                }
            }
        }
        
        return result;
    }
}`,
      },
    ],
  },

  {
    id: "hash-lru",
    title: "LRU Cache",
    difficulty: "Medium",
    timeComplexity: "O(1) per operation",
    spaceComplexity: "O(capacity)",
    theory: [
      "**Problem**: Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement `get` and `put` operations in O(1).",
      "**LRU Policy**: When the cache is full and a new item is added, evict the least recently accessed item.",
      "**Approach — HashMap + Doubly Linked List**: HashMap provides O(1) key lookup. Doubly linked list maintains usage order — most recent at head, least recent at tail. On access, move node to head. On eviction, remove from tail.",
      "**Why doubly linked?**: We need O(1) removal from arbitrary positions. With a doubly linked list and a reference to the node (stored in HashMap), we can remove in O(1).",
    ],
    keyPoints: [
      "HashMap: key → node reference for O(1) lookup.",
      "Doubly Linked List: maintains access order, O(1) add/remove.",
      "On get/put: move accessed node to head (most recent).",
      "On overflow: remove tail node (least recent) from both list and map.",
      "Java's `LinkedHashMap` with `accessOrder=true` can implement LRU in ~5 lines.",
    ],
    code: [
      {
        title: "LRU Cache — Custom Implementation (Java)",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;

public class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
    
    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head, tail;
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        addToHead(node);
        return node.value;
    }
    
    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        Node node = new Node(key, value);
        map.put(key, node);
        addToHead(node);
        
        if (map.size() > capacity) {
            Node lru = tail.prev;
            remove(lru);
            map.remove(lru.key);
        }
    }
    
    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void addToHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
}`,
      },
      {
        title: "LRU Cache — LinkedHashMap (Java)",
        language: "java",
        content: `import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCacheLinkedHashMap extends LinkedHashMap<Integer, Integer> {
    private final int capacity;
    
    public LRUCacheLinkedHashMap(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
    
    public int get(int key) {
        return super.getOrDefault(key, -1);
    }
    
    public void put(int key, int value) {
        super.put(key, value);
    }
}`,
      },
    ],
  },

  {
    id: "hash-four-sum-ii",
    title: "4Sum II",
    difficulty: "Medium",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(n²)",
    theory: [
      "**Problem**: Given four integer arrays `A, B, C, D` all of length n, count how many tuples `(i, j, k, l)` satisfy `A[i] + B[j] + C[k] + D[l] = 0`.",
      "**Example**: Input: `A = [1, 2]`, `B = [-2, -1]`, `C = [-1, 2]`, `D = [0, 2]`. Output: `2`.",
      "**Brute Force**: Four nested loops O(n⁴) — too slow.",
      "**Optimal — HashMap**: Split into two pairs. Compute all sums of `A[i] + B[j]` and store counts in HashMap. Then for each `C[k] + D[l]`, check if `-(C[k] + D[l])` exists in the map.",
      "**Why O(n²)?**: We compute n² sums for each pair. Two pairs = 2 × n² computations.",
    ],
    keyPoints: [
      "Split 4-sum into two 2-sum problems.",
      "HashMap stores sum of pair 1 and its frequency.",
      "For each pair 2 sum, look up its negative in the map.",
      "Count all valid combinations by multiplying frequencies.",
    ],
    code: [
      {
        title: "4Sum II — HashMap Split (Java)",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;

public class FourSumII {
    public int fourSumCount(int[] A, int[] B, int[] C, int[] D) {
        Map<Integer, Integer> sumCount = new HashMap<>();
        
        // Store all sums of A + B
        for (int a : A) {
            for (int b : B) {
                int sum = a + b;
                sumCount.put(sum, sumCount.getOrDefault(sum, 0) + 1);
            }
        }
        
        int count = 0;
        
        // Check all sums of C + D
        for (int c : C) {
            for (int d : D) {
                int target = -(c + d);
                count += sumCount.getOrDefault(target, 0);
            }
        }
        
        return count;
    }
}`,
      },
    ],
  },

  {
    id: "hash-summary",
    title: "HashMap & Hashing Pattern Summary",
    difficulty: "Easy",
    theory: [
      "Hashing is one of the most powerful techniques for achieving O(1) lookups and solving frequency-based problems.",
    ],
    table: {
      headers: ["Pattern", "When to Use", "Example Problems", "Complexity"],
      rows: [
        ["Frequency Map", "Count occurrences", "Top K Frequent, Group Anagrams", "O(n) time, O(n) space"],
        ["Complement Lookup", "Find pairs with target sum", "Two Sum, 4Sum II", "O(n) time, O(n) space"],
        ["Set Membership", "Check existence, uniqueness", "Longest Consecutive, Contains Duplicate", "O(n) time, O(n) space"],
        ["Prefix + Hash", "Subarray problems", "Subarray Sum K, Divisible by K", "O(n) time, O(n) space"],
        ["Custom Data Structure", "Ordered/limited access", "LRU Cache, LFU Cache", "O(1) per operation"],
      ],
    },
    keyPoints: [
      "Always choose the right data structure: HashMap for key-value, HashSet for uniqueness.",
      "Consider space trade-offs: Hashing uses O(n) space but often saves time.",
      "Handle collisions implicitly — Java's HashMap handles this automatically.",
      "For ordered data, consider TreeMap (O(log n)) or LinkedHashMap (insertion/access order).",
      "Immutable keys are essential — never use mutable objects as HashMap keys.",
    ],
  },
];
