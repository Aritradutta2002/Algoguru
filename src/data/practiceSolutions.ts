import { Problem } from "./practiceData";

export interface SolutionCode {
  java: string;
  cpp: string;
  python: string;
}

export interface ProblemSolution {
  problemId: string;
  title: string;
  description: string;
  approach: string[];
  timeComplexity: string;
  spaceComplexity: string;
  difficulty: "Easy" | "Medium" | "Hard";
  solutions: SolutionCode;
  leetcodeLink: string;
  gfgLink: string;
  companies: string[];
  tags: string[];
}

// ============================================
// ARRAY PROBLEMS - EASY
// ============================================

export const arrayEasySolutions: ProblemSolution[] = [
  {
    problemId: "arr-hs-1",
    title: "Contains Duplicate",
    difficulty: "Easy",
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    approach: [
      "Use a HashSet to track seen elements while iterating through the array",
      "For each element, check if it already exists in the set - if yes, return true immediately",
      "If not found, add the element to the set and continue",
      "If loop completes without finding duplicates, return false"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/contains-duplicate/",
    gfgLink: "https://www.geeksforgeeks.org/problems/find-duplicates-in-an-array/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Hash Table", "Sorting"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int num : nums) {
            if (!seen.add(num)) {
                return true; // Duplicate found
            }
        }
        return false;
    }
}`,
      cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int num : nums) {
            if (seen.count(num)) {
                return true; // Duplicate found
            }
            seen.insert(num);
        }
        return false;
    }
};`,
      python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for num in nums:
            if num in seen:
                return True
            seen.add(num)
        return False

# Alternative one-liner:
# return len(nums) != len(set(nums))`
    }
  },
  {
    problemId: "arr-hs-2",
    title: "Valid Anagram",
    difficulty: "Easy",
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram is a word formed by rearranging the letters of another.",
    approach: [
      "Check if lengths are equal - if not, return false immediately",
      "Use a frequency array of size 26 (for lowercase English letters) to count characters in s",
      "Decrement counts for characters in t",
      "If all counts are zero at the end, strings are anagrams"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/valid-anagram/",
    gfgLink: "https://www.geeksforgeeks.org/problems/anagram/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Hash Table", "String", "Sorting"],
    solutions: {
      java: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        
        int[] count = new int[26];
        for (char c : s.toCharArray()) {
            count[c - 'a']++;
        }
        for (char c : t.toCharArray()) {
            count[c - 'a']--;
            if (count[c - 'a'] < 0) return false;
        }
        return true;
    }
}`,
      cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        
        vector<int> count(26, 0);
        for (char c : s) count[c - 'a']++;
        for (char c : t) {
            count[c - 'a']--;
            if (count[c - 'a'] < 0) return false;
        }
        return true;
    }
};`,
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        
        count = [0] * 26
        for c in s:
            count[ord(c) - ord('a')] += 1
        for c in t:
            count[ord(c) - ord('a')] -= 1
            if count[ord(c) - ord('a')] < 0:
                return False
        return True

# Alternative using Counter:
# from collections import Counter
# return Counter(s) == Counter(t)`
    }
  },
  {
    problemId: "arr-hs-3",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.",
    approach: [
      "Use a HashMap to store each number's index as we iterate",
      "For each number, calculate its complement (target - num)",
      "Check if complement exists in the map - if yes, return both indices",
      "If not found, add current number and its index to the map"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/two-sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/two-sum/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Hash Table"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i
        return []`
    }
  },
  {
    problemId: "arr-hs-4",
    title: "Group Anagrams",
    difficulty: "Medium",
    description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    approach: [
      "Create a HashMap where key is the sorted string (or character count signature) and value is list of anagrams",
      "For each string, sort its characters to create a canonical key",
      "Group all strings with the same key together",
      "Return all grouped values as the result"
    ],
    timeComplexity: "O(n * k log k)",
    spaceComplexity: "O(n * k)",
    leetcodeLink: "https://leetcode.com/problems/group-anagrams/",
    gfgLink: "https://www.geeksforgeeks.org/problems/group-anagrams-together/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Hash Table", "String", "Sorting"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> map;
        for (string& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            map[key].push_back(s);
        }
        vector<vector<string>> result;
        for (auto& [key, group] : map) {
            result.push_back(group);
        }
        return result;
    }
};`,
      python: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        from collections import defaultdict
        groups = defaultdict(list)
        for s in strs:
            key = ''.join(sorted(s))
            groups[key].append(s)
        return list(groups.values())`
    }
  },
  {
    problemId: "arr-hs-5",
    title: "Valid Sudoku",
    difficulty: "Medium",
    description: "Determine if a 9x9 Sudoku board is valid. Only the filled cells need to be validated according to Sudoku rules.",
    approach: [
      "Use three sets of HashSets: one for rows, one for columns, one for 3x3 boxes",
      "Iterate through each cell, skip empty cells ('.')",
      "For each filled cell, check if the digit already exists in corresponding row, column, or box",
      "Box index can be calculated as (row / 3) * 3 + col / 3"
    ],
    timeComplexity: "O(1) - fixed 9x9 board",
    spaceComplexity: "O(1) - fixed size sets",
    leetcodeLink: "https://leetcode.com/problems/valid-sudoku/",
    gfgLink: "https://www.geeksforgeeks.org/problems/valid-sudoku/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Hash Table", "Matrix"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char num = board[i][j];
                if (num == '.') continue;
                
                String rowKey = "row" + i + num;
                String colKey = "col" + j + num;
                String boxKey = "box" + (i/3)*3 + j/3 + num;
                
                if (seen.contains(rowKey) || seen.contains(colKey) || seen.contains(boxKey)) {
                    return false;
                }
                seen.add(rowKey);
                seen.add(colKey);
                seen.add(boxKey);
            }
        }
        return true;
    }
}`,
      cpp: `#include <vector>
#include <unordered_set>
#include <string>
using namespace std;

class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        unordered_set<string> seen;
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char num = board[i][j];
                if (num == '.') continue;
                
                string rowKey = "row" + to_string(i) + num;
                string colKey = "col" + to_string(j) + num;
                string boxKey = "box" + to_string((i/3)*3 + j/3) + num;
                
                if (seen.count(rowKey) || seen.count(colKey) || seen.count(boxKey)) {
                    return false;
                }
                seen.insert(rowKey);
                seen.insert(colKey);
                seen.insert(boxKey);
            }
        }
        return true;
    }
};`,
      python: `class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        seen = set()
        for i in range(9):
            for j in range(9):
                num = board[i][j]
                if num == '.':
                    continue
                row_key = f"row{i}{num}"
                col_key = f"col{j}{num}"
                box_key = f"box{(i//3)*3 + j//3}{num}"
                if row_key in seen or col_key in seen or box_key in seen:
                    return False
                seen.add(row_key)
                seen.add(col_key)
                seen.add(box_key)
        return True`
    }
  },
  {
    problemId: "arr-hs-6",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    description: "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
    approach: [
      "Insert all numbers into a HashSet for O(1) lookups",
      "For each number, only start counting if it's the beginning of a sequence (num-1 not in set)",
      "Count consecutive numbers by incrementing while num+1 exists in set",
      "Track the maximum length found"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/longest-consecutive-sequence/",
    gfgLink: "https://www.geeksforgeeks.org/problems/longest-consecutive-subsequence/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Hash Table"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> numSet = new HashSet<>();
        for (int num : nums) numSet.add(num);
        
        int longest = 0;
        for (int num : numSet) {
            if (!numSet.contains(num - 1)) {
                int current = num;
                int streak = 1;
                while (numSet.contains(current + 1)) {
                    current++;
                    streak++;
                }
                longest = Math.max(longest, streak);
            }
        }
        return longest;
    }
}`,
      cpp: `#include <vector>
#include <unordered_set>
#include <algorithm>
using namespace std;

class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> numSet(nums.begin(), nums.end());
        int longest = 0;
        
        for (int num : numSet) {
            if (!numSet.count(num - 1)) {
                int current = num;
                int streak = 1;
                while (numSet.count(current + 1)) {
                    current++;
                    streak++;
                }
                longest = max(longest, streak);
            }
        }
        return longest;
    }
};`,
      python: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        num_set = set(nums)
        longest = 0
        
        for num in num_set:
            if num - 1 not in num_set:
                current = num
                streak = 1
                while current + 1 in num_set:
                    current += 1
                    streak += 1
                longest = max(longest, streak)
        return longest`
    }
  }
];

// ============================================
// ARRAY PROBLEMS - TWO POINTER
// ============================================

export const arrayTwoPointerSolutions: ProblemSolution[] = [
  {
    problemId: "arr-tp-1",
    title: "Move Zeroes",
    difficulty: "Easy",
    description: "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements. Do this in-place without making a copy of the array.",
    approach: [
      "Use two pointers: 'slow' for the position to place next non-zero, 'fast' for scanning",
      "Iterate with fast pointer, when non-zero found, swap with slow position and increment slow",
      "All elements before slow are non-zero in original order, rest are zeros"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/move-zeroes/",
    gfgLink: "https://www.geeksforgeeks.org/problems/move-all-zeroes-to-end-of-array0751/1",
    companies: ["Amazon", "Google", "Swiggy"],
    tags: ["Array", "Two Pointers"],
    solutions: {
      java: `class Solution {
    public void moveZeroes(int[] nums) {
        int slow = 0;
        for (int fast = 0; fast < nums.length; fast++) {
            if (nums[fast] != 0) {
                int temp = nums[slow];
                nums[slow] = nums[fast];
                nums[fast] = temp;
                slow++;
            }
        }
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int slow = 0;
        for (int fast = 0; fast < nums.size(); fast++) {
            if (nums[fast] != 0) {
                swap(nums[slow], nums[fast]);
                slow++;
            }
        }
    }
};`,
      python: `class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        slow = 0
        for fast in range(len(nums)):
            if nums[fast] != 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1`
    }
  },
  {
    problemId: "arr-tp-2",
    title: "Two Sum II - Input Array Is Sorted",
    difficulty: "Medium",
    description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    approach: [
      "Use two pointers: left at start (0), right at end (n-1)",
      "Calculate sum of numbers[left] + numbers[right]",
      "If sum == target, return [left+1, right+1] (1-indexed)",
      "If sum < target, increment left; if sum > target, decrement right"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    gfgLink: "https://www.geeksforgeeks.org/problems/key-pair1554/1",
    companies: ["Amazon", "Google", "Goldman Sachs"],
    tags: ["Array", "Two Pointers", "Binary Search"],
    solutions: {
      java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return new int[]{left + 1, right + 1};
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int left = 0, right = numbers.size() - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return {left + 1, right + 1};
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        left, right = 0, len(numbers) - 1
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target:
                return [left + 1, right + 1]
            elif total < target:
                left += 1
            else:
                right -= 1
        return []`
    }
  },
  {
    problemId: "arr-tp-3",
    title: "3Sum",
    difficulty: "Medium",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    approach: [
      "Sort the array first",
      "Fix first element nums[i], then use two pointers for remaining two elements",
      "Skip duplicates for first element and during two-pointer search",
      "Move left/right pointers based on sum comparison with target (0)"
    ],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1) or O(n) for sorting",
    leetcodeLink: "https://leetcode.com/problems/3sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/triplet-sum-in-array-1587115621/1",
    companies: ["Facebook", "Microsoft", "Morgan Stanley"],
    tags: ["Array", "Two Pointers", "Sorting"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
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
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.size() - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.push_back({nums[i], nums[left], nums[right]});
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
};`,
      python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        result = []
        
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    result.append([nums[i], nums[left], nums[right]])
                    while left < right and nums[left] == nums[left + 1]:
                        left += 1
                    while left < right and nums[right] == nums[right - 1]:
                        right -= 1
                    left += 1
                    right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1
        return result`
    }
  },
  {
    problemId: "arr-tp-4",
    title: "Sort Colors",
    difficulty: "Medium",
    description: "Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue. Use integers 0, 1, and 2 to represent colors.",
    approach: [
      "Use Dutch National Flag algorithm with three pointers: low, mid, high",
      "low tracks boundary of 0s, mid scans, high tracks boundary of 2s",
      "When nums[mid] == 0: swap with low, increment both",
      "When nums[mid] == 1: just increment mid",
      "When nums[mid] == 2: swap with high, decrement high"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/sort-colors/",
    gfgLink: "https://www.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s4231/1",
    companies: ["Microsoft", "Flipkart", "Adobe"],
    tags: ["Array", "Two Pointers", "Sorting"],
    solutions: {
      java: `class Solution {
    public void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums, low++, mid++);
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums, mid, high--);
            }
        }
    }
    private void swap(int[] nums, int i, int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = nums.size() - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums[low++], nums[mid++]);
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums[mid], nums[high--]);
            }
        }
    }
};`,
      python: `class Solution:
    def sortColors(self, nums: List[int]) -> None:
        low = mid = 0
        high = len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1`
    }
  },
  {
    problemId: "arr-tp-5",
    title: "Container With Most Water",
    difficulty: "Medium",
    description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    approach: [
      "Use two pointers at both ends of the array",
      "Calculate area = min(height[left], height[right]) * (right - left)",
      "Move the pointer pointing to the shorter line inward",
      "Because moving the taller line cannot increase the area (limited by shorter line)"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/container-with-most-water/",
    gfgLink: "https://www.geeksforgeeks.org/problems/container-with-most-water4145/1",
    companies: ["Amazon", "Apple", "DE Shaw"],
    tags: ["Array", "Two Pointers", "Greedy"],
    solutions: {
      java: `class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1;
        int maxArea = 0;
        while (left < right) {
            int area = Math.min(height[left], height[right]) * (right - left);
            maxArea = Math.max(maxArea, area);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxArea;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int maxArea = 0;
        while (left < right) {
            int area = min(height[left], height[right]) * (right - left);
            maxArea = max(maxArea, area);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxArea;
    }
};`,
      python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        max_area = 0
        while left < right:
            area = min(height[left], height[right]) * (right - left)
            max_area = max(max_area, area)
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return max_area`
    }
  },
  {
    problemId: "arr-tp-6",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    approach: [
      "Use two pointers at both ends with leftMax and rightMax tracking highest walls",
      "Water trapped at each position = min(leftMax, rightMax) - height[i]",
      "Move the pointer with the smaller max wall inward",
      "Update max walls as we move pointers"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/trapping-rain-water/",
    gfgLink: "https://www.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1",
    companies: ["Google", "Goldman Sachs", "Sumo Logic"],
    tags: ["Array", "Two Pointers", "Stack", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
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
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
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
};`,
      python: `class Solution:
    def trap(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        left_max, right_max = 0, 0
        water = 0
        
        while left < right:
            if height[left] < height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    water += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    water += right_max - height[right]
                right -= 1
        return water`
    }
  }
];

// ============================================
// ARRAY PROBLEMS - SLIDING WINDOW
// ============================================

export const arraySlidingWindowSolutions: ProblemSolution[] = [
  {
    problemId: "arr-sw-0",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Maximize your profit by choosing a single day to buy and a different day in the future to sell.",
    approach: [
      "Track minimum price seen so far while iterating",
      "For each price, calculate potential profit = price - minPrice",
      "Update maxProfit if current profit is larger",
      "Update minPrice if current price is smaller"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    gfgLink: "https://www.geeksforgeeks.org/problems/buy-and-sell-stock/1",
    companies: ["Amazon", "Microsoft", "Paytm"],
    tags: ["Array", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            maxProfit = Math.max(maxProfit, price - minPrice);
        }
        return maxProfit;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX;
        int maxProfit = 0;
        for (int price : prices) {
            minPrice = min(minPrice, price);
            maxProfit = max(maxProfit, price - minPrice);
        }
        return maxProfit;
    }
};`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_price = float('inf')
        max_profit = 0
        for price in prices:
            min_price = min(min_price, price)
            max_profit = max(max_profit, price - min_price)
        return max_profit`
    }
  },
  {
    problemId: "arr-sw-1",
    title: "Maximum Sum Subarray of Size K",
    difficulty: "Easy",
    description: "Given an array of integers and a number k, find the maximum sum of a subarray of size k.",
    approach: [
      "Calculate sum of first k elements as initial window sum",
      "Slide window by subtracting element going out and adding element coming in",
      "Track maximum sum across all windows"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-sum-subarray-of-size-k/",
    gfgLink: "https://www.geeksforgeeks.org/problems/max-sum-subarray-of-size-k5313/1",
    companies: ["Amazon", "Microsoft"],
    tags: ["Array", "Sliding Window"],
    solutions: {
      java: `class Solution {
    public int maxSumSubarray(int[] arr, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += arr[i];
        }
        int maxSum = windowSum;
        for (int i = k; i < arr.length; i++) {
            windowSum += arr[i] - arr[i - k];
            maxSum = Math.max(maxSum, windowSum);
        }
        return maxSum;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSumSubarray(vector<int>& arr, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += arr[i];
        }
        int maxSum = windowSum;
        for (int i = k; i < arr.size(); i++) {
            windowSum += arr[i] - arr[i - k];
            maxSum = max(maxSum, windowSum);
        }
        return maxSum;
    }
};`,
      python: `class Solution:
    def maxSumSubarray(self, arr: List[int], k: int) -> int:
        window_sum = sum(arr[:k])
        max_sum = window_sum
        for i in range(k, len(arr)):
            window_sum += arr[i] - arr[i - k]
            max_sum = max(max_sum, window_sum)
        return max_sum`
    }
  },
  {
    problemId: "arr-sw-2",
    title: "Max Consecutive Ones",
    difficulty: "Easy",
    description: "Given a binary array nums, return the maximum number of consecutive 1's in the array.",
    approach: [
      "Use sliding window with at most 0 zeros allowed",
      "Expand right pointer, when zero count exceeds limit, shrink from left",
      "Track maximum window size"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/max-consecutive-ones/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximum-consecutive-ones/1",
    companies: ["Amazon", "Google", "Paytm"],
    tags: ["Array", "Sliding Window"],
    solutions: {
      java: `class Solution {
    public int findMaxConsecutiveOnes(int[] nums) {
        int left = 0, maxLen = 0, zeroCount = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeroCount++;
            while (zeroCount > 0) {
                if (nums[left] == 0) zeroCount--;
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int findMaxConsecutiveOnes(vector<int>& nums) {
        int left = 0, maxLen = 0, zeroCount = 0;
        for (int right = 0; right < nums.size(); right++) {
            if (nums[right] == 0) zeroCount++;
            while (zeroCount > 0) {
                if (nums[left] == 0) zeroCount--;
                left++;
            }
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      python: `class Solution:
    def findMaxConsecutiveOnes(self, nums: List[int]) -> int:
        left = max_len = zero_count = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zero_count += 1
            while zero_count > 0:
                if nums[left] == 0:
                    zero_count -= 1
                left += 1
            max_len = max(max_len, right - left + 1)
        return max_len`
    }
  },
  {
    problemId: "arr-sw-3",
    title: "Max Consecutive Ones III",
    difficulty: "Medium",
    description: "Given a binary array nums and an integer k, return the maximum number of consecutive 1's in the array if you can flip at most k 0's.",
    approach: [
      "Sliding window with at most k zeros allowed",
      "Expand right, when zero count > k, shrink from left",
      "Track maximum window size"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/max-consecutive-ones-iii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximum-consecutive-ones-iii/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Sliding Window"],
    solutions: {
      java: `class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0, maxLen = 0, zeroCount = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeroCount++;
            while (zeroCount > k) {
                if (nums[left] == 0) zeroCount--;
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int left = 0, maxLen = 0, zeroCount = 0;
        for (int right = 0; right < nums.size(); right++) {
            if (nums[right] == 0) zeroCount++;
            while (zeroCount > k) {
                if (nums[left] == 0) zeroCount--;
                left++;
            }
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      python: `class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        left = max_len = zero_count = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zero_count += 1
            while zero_count > k:
                if nums[left] == 0:
                    zero_count -= 1
                left += 1
            max_len = max(max_len, right - left + 1)
        return max_len`
    }
  },
  {
    problemId: "arr-sw-4",
    title: "Subarray Product Less Than K",
    difficulty: "Medium",
    description: "Given an array of positive integers nums and an integer k, return the number of contiguous subarrays where the product of all the elements in the subarray is strictly less than k.",
    approach: [
      "Sliding window maintaining product of current window",
      "Expand right, multiply product by nums[right]",
      "While product >= k and left <= right, divide by nums[left] and increment left",
      "Add (right - left + 1) to count for each valid window"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/subarray-product-less-than-k/",
    gfgLink: "https://www.geeksforgeeks.org/problems/count-the-subarrays-having-product-less-than-k1708/1",
    companies: ["Amazon", "Google", "Goldman Sachs"],
    tags: ["Array", "Sliding Window"],
    solutions: {
      java: `class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) return 0;
        int left = 0, product = 1, count = 0;
        for (int right = 0; right < nums.length; right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left++];
            }
            count += right - left + 1;
        }
        return count;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        int left = 0, product = 1, count = 0;
        for (int right = 0; right < nums.size(); right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left++];
            }
            count += right - left + 1;
        }
        return count;
    }
};`,
      python: `class Solution:
    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:
        if k <= 1:
            return 0
        left = product = count = 0
        for right in range(len(nums)):
            product *= nums[right]
            while product >= k:
                product //= nums[left]
                left += 1
            count += right - left + 1
        return count`
    }
  },
  {
    problemId: "arr-sw-5",
    title: "Fruits Into Baskets",
    difficulty: "Medium",
    description: "You are visiting a farm that has a single row of fruit trees. You have two baskets, and each basket can only hold a single type of fruit. What is the maximum number of fruits you can pick?",
    approach: [
      "Sliding window with at most 2 distinct fruit types",
      "Use HashMap to track fruit type counts in current window",
      "Expand right, when distinct types > 2, shrink from left",
      "Track maximum window size"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) - at most 3 entries in map",
    leetcodeLink: "https://leetcode.com/problems/fruit-into-baskets/",
    gfgLink: "https://www.geeksforgeeks.org/problems/fruit-into-baskets-1663137462/1",
    companies: ["Amazon", "Flipkart", "PhonePe"],
    tags: ["Array", "Hash Table", "Sliding Window"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int totalFruit(int[] fruits) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, maxFruits = 0;
        for (int right = 0; right < fruits.length; right++) {
            count.put(fruits[right], count.getOrDefault(fruits[right], 0) + 1);
            while (count.size() > 2) {
                count.put(fruits[left], count.get(fruits[left]) - 1);
                if (count.get(fruits[left]) == 0) {
                    count.remove(fruits[left]);
                }
                left++;
            }
            maxFruits = Math.max(maxFruits, right - left + 1);
        }
        return maxFruits;
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> count;
        int left = 0, maxFruits = 0;
        for (int right = 0; right < fruits.size(); right++) {
            count[fruits[right]]++;
            while (count.size() > 2) {
                count[fruits[left]]--;
                if (count[fruits[left]] == 0) {
                    count.erase(fruits[left]);
                }
                left++;
            }
            maxFruits = max(maxFruits, right - left + 1);
        }
        return maxFruits;
    }
};`,
      python: `class Solution:
    def totalFruit(self, fruits: List[int]) -> int:
        from collections import defaultdict
        count = defaultdict(int)
        left = max_fruits = 0
        for right in range(len(fruits)):
            count[fruits[right]] += 1
            while len(count) > 2:
                count[fruits[left]] -= 1
                if count[fruits[left]] == 0:
                    del count[fruits[left]]
                left += 1
            max_fruits = max(max_fruits, right - left + 1)
        return max_fruits`
    }
  },
  {
    problemId: "arr-sw-6",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    description: "Given an array of positive integers nums and a positive integer target, return the minimal length of a subarray whose sum is greater than or equal to target. If there is no such subarray, return 0.",
    approach: [
      "Sliding window with sum tracking",
      "Expand right, add to sum",
      "While sum >= target, update min length and shrink from left",
      "Return min length or 0 if not found"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/minimum-size-subarray-sum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/minimum-size-subarray-sum/1",
    companies: ["Amazon", "Morgan Stanley", "Adobe"],
    tags: ["Array", "Sliding Window", "Binary Search"],
    solutions: {
      java: `class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                sum -= nums[left++];
            }
        }
        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int left = 0, sum = 0, minLen = INT_MAX;
        for (int right = 0; right < nums.size(); right++) {
            sum += nums[right];
            while (sum >= target) {
                minLen = min(minLen, right - left + 1);
                sum -= nums[left++];
            }
        }
        return minLen == INT_MAX ? 0 : minLen;
    }
};`,
      python: `class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        left = total = 0
        min_len = float('inf')
        for right in range(len(nums)):
            total += nums[right]
            while total >= target:
                min_len = min(min_len, right - left + 1)
                total -= nums[left]
                left += 1
        return 0 if min_len == float('inf') else min_len`
    }
  },
  {
    problemId: "arr-sw-7",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. Return the max sliding window.",
    approach: [
      "Use a deque to store indices of useful elements in current window",
      "Maintain deque in decreasing order of values",
      "Remove indices outside window from front",
      "Remove smaller elements from back before adding new element",
      "Front of deque is always the maximum for current window"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    leetcodeLink: "https://leetcode.com/problems/sliding-window-maximum/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximum-of-all-subarrays-of-size-k3101/1",
    companies: ["Amazon", "Google", "DE Shaw"],
    tags: ["Array", "Queue", "Sliding Window", "Monotonic Queue"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || k <= 0) return new int[0];
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();
        
        for (int i = 0; i < n; i++) {
            // Remove indices outside window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }
            // Remove smaller elements from back
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }
            deque.offerLast(i);
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <deque>
using namespace std;

class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        vector<int> result;
        deque<int> dq;
        
        for (int i = 0; i < nums.size(); i++) {
            while (!dq.empty() && dq.front() < i - k + 1) {
                dq.popleft();
            }
            while (!dq.empty() && nums[dq.back()] < nums[i]) {
                dq.pop();
            }
            dq.push_back(i);
            if (i >= k - 1) {
                result.push_back(nums[dq[0]]);
            }
        }
        return result;
    }
};`,
      python: `from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        if not nums or k <= 0:
            return []
        result = []
        dq = deque()
        
        for i in range(len(nums)):
            while dq and dq[0] < i - k + 1:
                dq.popleft()
            while dq and nums[dq[-1]] < nums[i]:
                dq.pop()
            dq.append(i)
            if i >= k - 1:
                result.append(nums[dq[0]])
        return result`
    }
  },
  {
    problemId: "arr-sw-8",
    title: "Subarrays with K Different Integers",
    difficulty: "Hard",
    description: "Given an integer array nums and an integer k, return the number of good subarrays of nums. A good subarray is an array where the number of different integers in that subarray is exactly k.",
    approach: [
      "Use the formula: exactly(K) = atMost(K) - atMost(K-1)",
      "Implement atMost(k) using sliding window with HashMap",
      "Expand right, when distinct > k, shrink from left",
      "Add (right - left + 1) to count for each valid window"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    leetcodeLink: "https://leetcode.com/problems/subarrays-with-k-different-integers/",
    gfgLink: "https://www.geeksforgeeks.org/problems/subarrays-with-k-distinct-integers/1",
    companies: ["Amazon", "Google", "Goldman Sachs"],
    tags: ["Array", "Hash Table", "Sliding Window"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int subarraysWithKDistinct(int[] nums, int k) {
        return atMostK(nums, k) - atMostK(nums, k - 1);
    }
    
    private int atMostK(int[] nums, int k) {
        if (k == 0) return 0;
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, result = 0;
        for (int right = 0; right < nums.length; right++) {
            count.put(nums[right], count.getOrDefault(nums[right], 0) + 1);
            while (count.size() > k) {
                count.put(nums[left], count.get(nums[left]) - 1);
                if (count.get(nums[left]) == 0) {
                    count.remove(nums[left]);
                }
                left++;
            }
            result += right - left + 1;
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int subarraysWithKDistinct(vector<int>& nums, int k) {
        return atMostK(nums, k) - atMostK(nums, k - 1);
    }
    
private:
    int atMostK(vector<int>& nums, int k) {
        if (k == 0) return 0;
        unordered_map<int, int> count;
        int left = 0, result = 0;
        for (int right = 0; right < nums.size(); right++) {
            count[nums[right]]++;
            while (count.size() > k) {
                count[nums[left]]--;
                if (count[nums[left]] == 0) {
                    count.erase(nums[left]);
                }
                left++;
            }
            result += right - left + 1;
        }
        return result;
    }
};`,
      python: `class Solution:
    def subarraysWithKDistinct(self, nums: List[int], k: int) -> int:
        return self.atMostK(nums, k) - self.atMostK(nums, k - 1)
    
    def atMostK(self, nums: List[int], k: int) -> int:
        if k == 0:
            return 0
        from collections import defaultdict
        count = defaultdict(int)
        left = result = 0
        for right in range(len(nums)):
            count[nums[right]] += 1
            while len(count) > k:
                count[nums[left]] -= 1
                if count[nums[left]] == 0:
                    del count[nums[left]]
                left += 1
            result += right - left + 1
        return result`
    }
  }
];

// ============================================
// ARRAY PROBLEMS - KADANE'S ALGORITHM
// ============================================

export const arrayKadaneSolutions: ProblemSolution[] = [
  {
    problemId: "arr-kd-1",
    title: "Maximum Subarray",
    difficulty: "Medium",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    approach: [
      "Kadane's Algorithm: track max subarray sum ending at each position",
      "At each element, either extend previous subarray or start new",
      "maxEndingHere = max(nums[i], maxEndingHere + nums[i])",
      "Track global maximum across all positions"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-subarray/",
    gfgLink: "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1",
    companies: ["Flipkart", "Paytm", "PhonePe"],
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    solutions: {
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxEndingHere = nums[0];
        int maxSoFar = nums[0];
        for (int i = 1; i < nums.length; i++) {
            maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
            maxSoFar = Math.max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxEndingHere = nums[0];
        int maxSoFar = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            maxEndingHere = max(nums[i], maxEndingHere + nums[i]);
            maxSoFar = max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
};`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        max_ending_here = max_so_far = nums[0]
        for num in nums[1:]:
            max_ending_here = max(num, max_ending_here + num)
            max_so_far = max(max_so_far, max_ending_here)
        return max_so_far`
    }
  },
  {
    problemId: "arr-kd-2",
    title: "Maximum Product Subarray",
    difficulty: "Medium",
    description: "Given an integer array nums, find a subarray that has the largest product, and return the product.",
    approach: [
      "Track both max and min product ending at each position (negative * negative = positive)",
      "At each step, compute new max/min from three candidates: current num, max*num, min*num",
      "Update global maximum with max product seen so far"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-product-subarray/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1",
    companies: ["Google", "Facebook", "Morgan Stanley"],
    tags: ["Array", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int maxProduct(int[] nums) {
        int maxProd = nums[0], minProd = nums[0], result = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int num = nums[i];
            int tempMax = max(num, maxProd * num, minProd * num);
            minProd = min(num, maxProd * num, minProd * num);
            maxProd = tempMax;
            result = Math.max(result, maxProd);
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int maxProd = nums[0], minProd = nums[0], result = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            int num = nums[i];
            int tempMax = max(num, maxProd * num, minProd * num);
            minProd = min(num, maxProd * num, minProd * num);
            maxProd = tempMax;
            result = max(result, maxProd);
        }
        return result;
    }
};`,
      python: `class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        max_prod = min_prod = result = nums[0]
        for num in nums[1:]:
            temp_max = max(num, max_prod * num, min_prod * num)
            min_prod = min(num, max_prod * num, min_prod * num)
            max_prod = temp_max
            result = max(result, max_prod)
        return result`
    }
  },
  {
    problemId: "arr-kd-3",
    title: "Maximum Sum Circular Subarray",
    difficulty: "Medium",
    description: "Given a circular integer array nums, return the maximum possible sum of a non-empty subarray of nums.",
    approach: [
      "Two cases: max subarray is non-wrapping (standard Kadane) or wrapping",
      "Wrapping case = total sum - min subarray sum (Kadane for minimum)",
      "Edge case: if all numbers are negative, return max element (non-wrapping)",
      "Result = max(nonWrappingMax, totalSum - minSubarraySum)"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-sum-circular-subarray/",
    gfgLink: "https://www.geeksforgeeks.org/problems/max-circular-subarray-sum-1587115620/1",
    companies: ["Amazon", "Google", "DE Shaw"],
    tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int totalSum = 0, maxSum = nums[0], minSum = nums[0];
        int curMax = 0, curMin = 0;
        
        for (int num : nums) {
            curMax = Math.max(curMax + num, num);
            maxSum = Math.max(maxSum, curMax);
            curMin = Math.min(curMin + num, num);
            minSum = Math.min(minSum, curMin);
            totalSum += num;
        }
        
        return maxSum > 0 ? Math.max(maxSum, totalSum - minSum) : maxSum;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int totalSum = 0, maxSum = nums[0], minSum = nums[0];
        int curMax = 0, curMin = 0;
        
        for (int num : nums) {
            curMax = max(curMax + num, num);
            maxSum = max(maxSum, curMax);
            curMin = min(curMin + num, num);
            minSum = min(minSum, curMin);
            totalSum += num;
        }
        
        return maxSum > 0 ? max(maxSum, totalSum - minSum) : maxSum;
    }
};`,
      python: `class Solution:
    def maxSubarraySumCircular(self, nums: List[int]) -> int:
        total_sum = 0
        max_sum = min_sum = nums[0]
        cur_max = cur_min = 0
        
        for num in nums:
            cur_max = max(cur_max + num, num)
            max_sum = max(max_sum, cur_max)
            cur_min = min(cur_min + num, num)
            min_sum = min(min_sum, cur_min)
        
        return max(max_sum, total_sum - min_sum) if max_sum > 0 else max_sum`
    }
  },
  {
    problemId: "arr-kd-4",
    title: "Maximum Absolute Sum of Any Subarray",
    difficulty: "Medium",
    description: "You are given an integer array nums. The absolute sum of a subarray is the absolute value of the sum of the subarray. Return the maximum absolute sum of any subarray.",
    approach: [
      "Maximum absolute sum = max(max subarray sum, abs(min subarray sum))",
      "Run Kadane's algorithm for both maximum and minimum subarray sum",
      "Return the maximum of the two absolute values"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximum-absolute-sum-of-any-subarray/1",
    companies: ["Microsoft", "Apple", "Adobe"],
    tags: ["Array", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int maxAbsoluteSum(int[] nums) {
        int maxSum = nums[0], minSum = nums[0];
        int curMax = 0, curMin = 0;
        
        for (int num : nums) {
            curMax = Math.max(curMax + num, num);
            maxSum = Math.max(maxSum, curMax);
            curMin = Math.min(curMin + num, num);
            minSum = Math.min(minSum, curMin);
        }
        
        return Math.max(maxSum, Math.abs(minSum));
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;

class Solution {
public:
    int maxAbsoluteSum(vector<int>& nums) {
        int maxSum = nums[0], minSum = nums[0];
        int curMax = 0, curMin = 0;
        
        for (int num : nums) {
            curMax = max(curMax + num, num);
            maxSum = max(maxSum, curMax);
            curMin = min(curMin + num, num);
            minSum = min(minSum, curMin);
        }
        
        return max(maxSum, abs(minSum));
    }
};`,
      python: `class Solution:
    def maxAbsoluteSum(self, nums: List[int]) -> int:
        max_sum = min_sum = nums[0]
        cur_max = cur_min = 0
        
        for num in nums:
            cur_max = max(cur_max + num, num)
            max_sum = max(max_sum, cur_max)
            cur_min = min(cur_min + num, num)
            min_sum = min(min_sum, cur_min)
        
        return max(max_sum, abs(min_sum))`
    }
  },
  {
    problemId: "arr-kd-5",
    title: "Largest Sum Contiguous Subarray",
    difficulty: "Medium",
    description: "Find the contiguous subarray with the largest sum.",
    approach: [
      "Standard Kadane's Algorithm implementation",
      "Track current max ending at each position and global max",
      "Handle all negative numbers case"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/maximum-subarray/",
    gfgLink: "https://www.geeksforgeeks.org/problems/largest-sum-contiguous-subarray/1",
    companies: ["Amazon", "Flipkart", "Zomato"],
    tags: ["Array", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public int maxSubArraySum(int[] arr) {
        int maxEndingHere = arr[0];
        int maxSoFar = arr[0];
        for (int i = 1; i < arr.length; i++) {
            maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
            maxSoFar = Math.max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
}`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArraySum(vector<int>& arr) {
        int maxEndingHere = arr[0];
        int maxSoFar = arr[0];
        for (int i = 1; i < arr.size(); i++) {
            maxEndingHere = max(arr[i], maxEndingHere + arr[i]);
            maxSoFar = max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
};`,
      python: `class Solution:
    def maxSubArraySum(self, arr: List[int]) -> int:
        max_ending_here = max_so_far = arr[0]
        for num in arr[1:]:
            max_ending_here = max(num, max_ending_here + num)
            max_so_far = max(max_so_far, max_ending_here)
        return max_so_far`
    }
  }
];

// ============================================
// STRING PROBLEMS
// ============================================

export const stringSolutions: ProblemSolution[] = [
  {
    problemId: "str-tp-2",
    title: "Palindrome String",
    difficulty: "Easy",
    description: "Given a string s, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.",
    approach: [
      "Two pointers: left at start, right at end",
      "Skip non-alphanumeric characters",
      "Compare characters case-insensitively",
      "Move pointers inward until they meet"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/valid-palindrome/",
    gfgLink: "https://www.geeksforgeeks.org/problems/palindrome-string0817/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Two Pointers", "String"],
    solutions: {
      java: `class Solution {
    public boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}`,
      cpp: `#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !isalnum(s[left])) left++;
            while (left < right && !isalnum(s[right])) right--;
            if (tolower(s[left]) != tolower(s[right])) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
};`,
      python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        left, right = 0, len(s) - 1
        while left < right:
            while left < right and not s[left].isalnum():
                left += 1
            while left < right and not s[right].isalnum():
                right -= 1
            if s[left].lower() != s[right].lower():
                return False
            left += 1
            right -= 1
        return True`
    }
  },
  {
    problemId: "str-tp-3",
    title: "Valid Palindrome II",
    difficulty: "Easy",
    description: "Given a string s, return true if the s can be palindrome after deleting at most one character from it.",
    approach: [
      "Two pointers from both ends",
      "When mismatch found, try skipping left char OR right char",
      "Check if either resulting substring is palindrome",
      "Helper function to check palindrome in range"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/valid-palindrome-ii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/valid-palindrome-ii/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Two Pointers", "String", "Greedy"],
    solutions: {
      java: `class Solution {
    public boolean validPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return isPalindrome(s, left + 1, right) || isPalindrome(s, left, right - 1);
            }
            left++;
            right--;
        }
        return true;
    }
    
    private boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) return false;
        }
        return true;
    }
}`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool validPalindrome(string s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s[left] != s[right]) {
                return isPalindrome(s, left + 1, right) || isPalindrome(s, left, right - 1);
            }
            left++;
            right--;
        }
        return true;
    }
    
private:
    bool isPalindrome(const string& s, int left, int right) {
        while (left < right) {
            if (s[left++] != s[right--]) return false;
        }
        return true;
    }
};`,
      python: `class Solution:
    def validPalindrome(self, s: str) -> bool:
        def is_palindrome(l: int, r: int) -> bool:
            while l < r:
                if s[l] != s[r]:
                    return False
                l += 1
                r -= 1
            return True
        
        left, right = 0, len(s) - 1
        while left < right:
            if s[left] != s[right]:
                return is_palindrome(left + 1, right) or is_palindrome(left, right - 1)
            left += 1
            right -= 1
        return True`
    }
  },
  {
    problemId: "str-tp-4",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    description: "Given a string s, return the longest palindromic substring in s.",
    approach: [
      "Expand around center: for each position, expand as center of odd and even length palindromes",
      "Track longest palindrome found",
      "Time O(n²), Space O(1)"
    ],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/longest-palindromic-substring/",
    gfgLink: "https://www.geeksforgeeks.org/problems/longest-palindromic-substring0806/1",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["String", "Dynamic Programming"],
    solutions: {
      java: `class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() < 2) return s;
        int start = 0, maxLen = 1;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }
        return s.substring(start, start + maxLen);
    }
    
    private int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }
}`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    string longestPalindrome(string s) {
        if (s.length() < 2) return s;
        int start = 0, maxLen = 1;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = max(len1, len2);
            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }
        return s.substr(start, maxLen);
    }
    
private:
    int expandAroundCenter(const string& s, int left, int right) {
        while (left >= 0 && right < s.length() && s[left] == s[right]) {
            left--;
            right++;
        }
        return right - left - 1;
    }
};`,
      python: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        if len(s) < 2:
            return s
        
        def expand(left: int, right: int) -> int:
            while left >= 0 and right < len(s) and s[left] == s[right]:
                left -= 1
                right += 1
            return right - left - 1
        
        start = 0
        max_len = 1
        for i in range(len(s)):
            len1 = expand(i, i)
            len2 = expand(i, i + 1)
            length = max(len1, len2)
            if length > max_len:
                max_len = length
                start = i - (length - 1) // 2
        return s[start:start + max_len]`
    }
  }
];

// ============================================
// STACK PROBLEMS
// ============================================

export const stackSolutions: ProblemSolution[] = [
  {
    problemId: "st-mo-1",
    title: "Next Greater Element I",
    difficulty: "Easy",
    description: "The next greater element of some element x in an array is the first greater element that is to the right of x in the same array.",
    approach: [
      "Use a monotonic decreasing stack to track elements waiting for their next greater",
      "Iterate through nums2, while stack top < current, pop and record current as next greater",
      "Push current element onto stack",
      "Build result for nums1 using the map"
    ],
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/next-greater-element-i/",
    gfgLink: "https://www.geeksforgeeks.org/problems/next-greater-element/1",
    companies: ["Amazon", "Google", "Goldman Sachs"],
    tags: ["Array", "Stack", "Monotonic Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();
        
        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num) {
                nextGreater.put(stack.pop(), num);
            }
            stack.push(num);
        }
        
        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            result[i] = nextGreater.getOrDefault(nums1[i], -1);
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nextGreater;
        stack<int> st;
        
        for (int num : nums2) {
            while (!st.empty() && st.top() < num) {
                nextGreater[st.top()] = num;
                st.pop();
            }
            st.push(num);
        }
        
        vector<int> result;
        for (int num : nums1) {
            result.push_back(nextGreater.count(num) ? nextGreater[num] : -1);
        }
        return result;
    }
};`,
      python: `class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        next_greater = {}
        stack = []
        
        for num in nums2:
            while stack and stack[-1] < num:
                next_greater[stack.pop()] = num
            stack.append(num)
        
        return [next_greater.get(num, -1) for num in nums1]`
    }
  },
  {
    problemId: "st-mo-2",
    title: "Next Greater Element II",
    difficulty: "Medium",
    description: "Given a circular integer array nums, return the next greater number for every element in nums.",
    approach: [
      "Circular array: iterate 2n times (or use modulo)",
      "Monotonic decreasing stack storing indices",
      "For each element, pop smaller elements and set their next greater",
      "Push current index onto stack"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/next-greater-element-ii/",
    gfgLink: "https://www.geeksforgeeks.org/problems/next-greater-element-ii/1",
    companies: ["Microsoft", "Facebook", "Morgan Stanley"],
    tags: ["Array", "Stack", "Monotonic Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);
        Deque<Integer> stack = new ArrayDeque<>();
        
        for (int i = 0; i < 2 * n; i++) {
            int num = nums[i % n];
            while (!stack.isEmpty() && nums[stack.peek()] < num) {
                result[stack.pop()] = num;
            }
            if (i < n) stack.push(i);
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <stack>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElements(vector<int>& nums) {
        int n = nums.size();
        vector<int> result(n, -1);
        stack<int> st;
        
        for (int i = 0; i < 2 * n; i++) {
            int num = nums[i % n];
            while (!st.empty() && nums[st.top()] < num) {
                result[st.top()] = num;
                st.pop();
            }
            if (i < n) st.push(i);
        }
        return result;
    }
};`,
      python: `class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        n = len(nums)
        result = [-1] * n
        stack = []
        
        for i in range(2 * n):
            num = nums[i % n]
            while stack and nums[stack[-1]] < num:
                result[stack.pop()] = num
            if i < n:
                stack.append(i)
        return result`
    }
  },
  {
    problemId: "st-mo-3",
    title: "Daily Temperatures",
    difficulty: "Medium",
    description: "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
    approach: [
      "Monotonic decreasing stack storing indices",
      "For each temperature, while stack top temperature < current, pop and set result",
      "Push current index onto stack"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/daily-temperatures/",
    gfgLink: "https://www.geeksforgeeks.org/problems/daily-temperatures/1",
    companies: ["Flipkart", "Paytm", "PhonePe"],
    tags: ["Array", "Stack", "Monotonic Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] result = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int idx = stack.pop();
                result[idx] = i - idx;
            }
            stack.push(i);
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> result(n, 0);
        stack<int> st;
        
        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[st.top()] < temperatures[i]) {
                int idx = st.top();
                st.pop();
                result[idx] = i - idx;
            }
            st.push(i);
        }
        return result;
    }
};`,
      python: `class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        n = len(temperatures)
        result = [0] * n
        stack = []
        
        for i in range(n):
            while stack and temperatures[stack[-1]] < temperatures[i]:
                idx = stack.pop()
                result[idx] = i - idx
            stack.append(i)
        return result`
    }
  },
  {
    problemId: "st-mo-4",
    title: "Online Stock Span",
    difficulty: "Medium",
    description: "Design an algorithm that collects daily price quotes for some stock and returns the span of that stock's price for the current day.",
    approach: [
      "Monotonic decreasing stack storing (price, span) pairs",
      "For each new price, pop while stack top price <= current price, accumulate spans",
      "Push (current price, accumulated span + 1) onto stack",
      "Return accumulated span + 1"
    ],
    timeComplexity: "O(1) amortized per call",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/online-stock-span/",
    gfgLink: "https://www.geeksforgeeks.org/problems/online-stock-span/1",
    companies: ["Amazon", "Adobe", "Sumo Logic"],
    tags: ["Stack", "Design", "Monotonic Stack", "Data Stream"],
    solutions: {
      java: `import java.util.*;

class StockSpanner {
    private Deque<int[]> stack; // [price, span]
    
    public StockSpanner() {
        stack = new ArrayDeque<>();
    }
    
    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }
        stack.push(new int[]{price, span});
        return span;
    }
}`,
      cpp: `#include <stack>
#include <utility>
using namespace std;

class StockSpanner {
    stack<pair<int, int>> st; // {price, span}
public:
    StockSpanner() {}
    
    int next(int price) {
        int span = 1;
        while (!st.empty() && st.top().first <= price) {
            span += st.top().second;
            st.pop();
        }
        st.push({price, span});
        return span;
    }
};`,
      python: `class StockSpanner:
    def __init__(self):
        self.stack = []  # (price, span)
    
    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span`
    }
  },
  {
    problemId: "st-mo-5",
    title: "Asteroid Collision",
    difficulty: "Medium",
    description: "We are given an array asteroids of integers representing asteroids in a row. For each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left).",
    approach: [
      "Stack to track surviving asteroids",
      "For each asteroid: if positive, push; if negative, resolve collisions with stack top",
      "While stack not empty and top > 0 and current < 0: compare sizes",
      "If equal, both destroyed; if top larger, current destroyed; if current larger, pop top and continue"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/asteroid-collision/",
    gfgLink: "https://www.geeksforgeeks.org/problems/asteroid-collision/1",
    companies: ["Flipkart", "PhonePe", "Morgan Stanley"],
    tags: ["Array", "Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int asteroid : asteroids) {
            boolean destroyed = false;
            while (!stack.isEmpty() && asteroid < 0 && stack.peek() > 0) {
                int top = stack.peek();
                if (top < -asteroid) {
                    stack.pop();
                } else if (top == -asteroid) {
                    stack.pop();
                    destroyed = true;
                    break;
                } else {
                    destroyed = true;
                    break;
                }
            }
            if (!destroyed) {
                stack.push(asteroid);
            }
        }
        int[] result = new int[stack.size()];
        for (int i = result.length - 1; i >= 0; i--) {
            result[i] = stack.pollLast();
        }
        return result;
    }
}`,
      cpp: `#include <vector>
#include <stack>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stack;
        for (int asteroid : asteroids) {
            bool destroyed = false;
            while (!stack.empty() && asteroid < 0 && stack.back() > 0) {
                int top = stack.back();
                if (top < -asteroid) {
                    stack.pop_back();
                } else if (top == -asteroid) {
                    stack.pop_back();
                    destroyed = true;
                    break;
                } else {
                    destroyed = true;
                    break;
                }
            }
            if (!destroyed) {
                stack.push_back(asteroid);
            }
        }
        return stack;
    }
};`,
      python: `class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        stack = []
        for asteroid in asteroids:
            destroyed = False
            while stack and asteroid < 0 < stack[-1]:
                top = stack[-1]
                if top < -asteroid:
                    stack.pop()
                elif top == -asteroid:
                    stack.pop()
                    destroyed = True
                    break
                else:
                    destroyed = True
                    break
            if not destroyed:
                stack.append(asteroid)
        return stack`
    }
  },
  {
    problemId: "st-mo-6",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    description: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    approach: [
      "Monotonic increasing stack storing indices",
      "For each bar, while stack top height > current height, pop and calculate area",
      "Width = current index - stack top index - 1 (or current index if stack empty)",
      "Push current index, process remaining stack at end"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    gfgLink: "https://www.geeksforgeeks.org/problems/largest-rectangle-in-histogram/1",
    companies: ["Google", "PayPal", "DE Shaw"],
    tags: ["Array", "Stack", "Monotonic Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;
        int n = heights.length;
        
        for (int i = 0; i <= n; i++) {
            int currHeight = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > currHeight) {
                int height = heights[stack.pop()];
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}`,
      cpp: `#include <vector>
#include <stack>
#include <algorithm>
using namespace std;

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        int maxArea = 0;
        int n = heights.size();
        
        for (int i = 0; i <= n; i++) {
            int currHeight = (i == n) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] > currHeight) {
                int height = heights[st.top()];
                st.pop();
                int width = st.empty() ? i : i - st.top() - 1;
                maxArea = max(maxArea, height * width);
            }
            st.push(i);
        }
        return maxArea;
    }
};`,
      python: `class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = []
        max_area = 0
        n = len(heights)
        
        for i in range(n + 1):
            curr_height = 0 if i == n else heights[i]
            while stack and heights[stack[-1]] > curr_height:
                height = heights[stack.pop()]
                width = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)
        return max_area`
    }
  },
  {
    problemId: "st-mo-7",
    title: "Maximal Rectangle",
    difficulty: "Hard",
    description: "Given a rows x cols binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.",
    approach: [
      "Treat each row as base of histogram",
      "Build heights array: if matrix[i][j] == '1', heights[j] += 1, else heights[j] = 0",
      "Apply Largest Rectangle in Histogram for each row",
      "Track maximum area across all rows"
    ],
    timeComplexity: "O(rows * cols)",
    spaceComplexity: "O(cols)",
    leetcodeLink: "https://leetcode.com/problems/maximal-rectangle/",
    gfgLink: "https://www.geeksforgeeks.org/problems/maximal-rectangle/1",
    companies: ["Amazon", "Goldman Sachs", "Zomato"],
    tags: ["Array", "Dynamic Programming", "Stack", "Matrix", "Monotonic Stack"],
    solutions: {
      java: `import java.util.*;

class Solution {
    public int maximalRectangle(char[][] matrix) {
        if (matrix.length == 0) return 0;
        int cols = matrix[0].length;
        int[] heights = new int[cols];
        int maxArea = 0;
        
        for (char[] row : matrix) {
            for (int j = 0; j < cols; j++) {
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = Math.max(maxArea, largestRectangleArea(heights));
        }
        return maxArea;
    }
    
    private int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;
        int n = heights.length;
        
        for (int i = 0; i <= n; i++) {
            int currHeight = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > currHeight) {
                int height = heights[stack.pop()];
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}`,
      cpp: `#include <vector>
#include <stack>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {
        if (matrix.empty()) return 0;
        int cols = matrix[0].size();
        vector<int> heights(cols, 0);
        int maxArea = 0;
        
        for (auto& row : matrix) {
            for (int j = 0; j < cols; j++) {
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = max(maxArea, largestRectangleArea(heights));
        }
        return maxArea;
    }
    
private:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        int maxArea = 0;
        int n = heights.size();
        
        for (int i = 0; i <= n; i++) {
            int currHeight = (i == n) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] > currHeight) {
                int height = heights[st.top()];
                st.pop();
                int width = st.empty() ? i : i - st.top() - 1;
                maxArea = max(maxArea, height * width);
            }
            st.push(i);
        }
        return maxArea;
    }
};`,
      python: `class Solution:
    def maximalRectangle(self, matrix: List[List[str]]) -> int:
        if not matrix:
            return 0
        cols = len(matrix[0])
        heights = [0] * cols
        max_area = 0
        
        for row in matrix:
            for j in range(cols):
                heights[j] = heights[j] + 1 if row[j] == '1' else 0
            max_area = max(max_area, self.largestRectangleArea(heights))
        return max_area
    
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = []
        max_area = 0
        n = len(heights)
        
        for i in range(n + 1):
            curr_height = 0 if i == n else heights[i]
            while stack and heights[stack[-1]] > curr_height:
                height = heights[stack.pop()]
                width = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)
        return max_area`
    }
  }
];

// ============================================
// LINKED LIST PROBLEMS
// ============================================

export const linkedListSolutions: ProblemSolution[] = [
  {
    problemId: "ll-ba-1",
    title: "Search in Linked List",
    difficulty: "Easy",
    description: "Given the head of a linked list and an integer val, return true if val exists in the linked list, otherwise return false.",
    approach: [
      "Traverse the linked list from head",
      "Compare each node's value with target",
      "Return true if found, false if end reached"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/search-in-a-linked-list/",
    gfgLink: "https://www.geeksforgeeks.org/problems/search-in-linked-list/1",
    companies: ["Facebook", "DE Shaw", "Zomato"],
    tags: ["Linked List"],
    solutions: {
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public boolean search(ListNode head, int val) {
        ListNode current = head;
        while (current != null) {
            if (current.val == val) return true;
            current = current.next;
        }
        return false;
    }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val) : val(val), next(nullptr) {}
};

class Solution {
public:
    bool search(ListNode* head, int val) {
        ListNode* current = head;
        while (current) {
            if (current->val == val) return true;
            current = current->next;
        }
        return false;
    }
};`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def search(self, head: ListNode, val: int) -> bool:
        current = head
        while current:
            if current.val == val:
                return True
            current = current.next
        return False`
    }
  },
  {
    problemId: "ll-ba-2",
    title: "Insert at Head / Tail / Nth Position",
    difficulty: "Easy",
    description: "Implement insertion operations in a singly linked list: at head, at tail, and at a given position.",
    approach: [
      "Insert at head: new node's next = head, return new node as head",
      "Insert at tail: traverse to end, set last node's next = new node",
      "Insert at position: traverse to position-1, insert new node after it"
    ],
    timeComplexity: "O(1) for head, O(n) for tail and position",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/insert-into-a-linked-list/",
    gfgLink: "https://www.geeksforgeeks.org/problems/insert-a-node-in-a-linked-list/1",
    companies: ["Amazon", "Paytm", "PayPal"],
    tags: ["Linked List"],
    solutions: {
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode insertAtHead(ListNode head, int val) {
        ListNode newNode = new ListNode(val);
        newNode.next = head;
        return newNode;
    }
    
    public ListNode insertAtTail(ListNode head, int val) {
        ListNode newNode = new ListNode(val);
        if (head == null) return newNode;
        ListNode current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
        return head;
    }
    
    public ListNode insertAtPosition(ListNode head, int val, int pos) {
        if (pos == 0) return insertAtHead(head, val);
        ListNode newNode = new ListNode(val);
        ListNode current = head;
        for (int i = 0; i < pos - 1 && current != null; i++) {
            current = current.next;
        }
        if (current == null) return head;
        newNode.next = current.next;
        current.next = newNode;
        return head;
    }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val) : val(val), next(nullptr) {}
};

class Solution {
public:
    ListNode* insertAtHead(ListNode* head, int val) {
        ListNode* newNode = new ListNode(val);
        newNode->next = head;
        return newNode;
    }
    
    ListNode* insertAtTail(ListNode* head, int val) {
        ListNode* newNode = new ListNode(val);
        if (!head) return newNode;
        ListNode* current = head;
        while (current->next) {
            current = current->next;
        }
        current->next = newNode;
        return head;
    }
    
    ListNode* insertAtPosition(ListNode* head, int val, int pos) {
        if (pos == 0) return insertAtHead(head, val);
        ListNode* newNode = new ListNode(val);
        ListNode* current = head;
        for (int i = 0; i < pos - 1 && current; i++) {
            current = current->next;
        }
        if (!current) return head;
        newNode->next = current->next;
        current->next = newNode;
        return head;
    }
};`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def insertAtHead(self, head: ListNode, val: int) -> ListNode:
        new_node = ListNode(val)
        new_node.next = head
        return new_node
    
    def insertAtTail(self, head: ListNode, val: int) -> ListNode:
        new_node = ListNode(val)
        if not head:
            return new_node
        current = head
        while current.next:
            current = current.next
        current.next = new_node
        return head
    
    def insertAtPosition(self, head: ListNode, val: int, pos: int) -> ListNode:
        if pos == 0:
            return self.insertAtHead(head, val)
        new_node = ListNode(val)
        current = head
        for _ in range(pos - 1):
            if not current:
                return head
            current = current.next
        if not current or not current.next:
            return head
        new_node.next = current.next
        current.next = new_node
        return head`
    }
  },
  {
    problemId: "ll-ba-3",
    title: "Delete Head / Tail / Nth Node",
    difficulty: "Easy",
    description: "Implement deletion operations in a singly linked list: delete head, delete tail, and delete node at given position.",
    approach: [
      "Delete head: return head.next",
      "Delete tail: traverse to second-last node, set its next to null",
      "Delete at position: traverse to position-1, skip the next node"
    ],
    timeComplexity: "O(1) for head, O(n) for tail and position",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/delete-node-in-a-linked-list/",
    gfgLink: "https://www.geeksforgeeks.org/problems/delete-a-node-from-linked-list/1",
    companies: ["Google", "Adobe", "Morgan Stanley"],
    tags: ["Linked List"],
    solutions: {
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode deleteHead(ListNode head) {
        return head != null ? head.next : null;
    }
    
    public ListNode deleteTail(ListNode head) {
        if (head == null || head.next == null) return null;
        ListNode current = head;
        while (current.next.next != null) {
            current = current.next;
        }
        current.next = null;
        return head;
    }
    
    public ListNode deleteAtPosition(ListNode head, int pos) {
        if (head == null) return null;
        if (pos == 0) return head.next;
        ListNode current = head;
        for (int i = 0; i < pos - 1 && current != null; i++) {
            current = current.next;
        }
        if (current == null || current.next == null) return head;
        current.next = current.next.next;
        return head;
    }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val) : val(val), next(nullptr) {}
};

class Solution {
public:
    ListNode* deleteHead(ListNode* head) {
        return head ? head->next : nullptr;
    }
    
    ListNode* deleteTail(ListNode* head) {
        if (!head || !head->next) return nullptr;
        ListNode* current = head;
        while (current->next->next) {
            current = current->next;
        }
        current->next = nullptr;
        return head;
    }
    
    ListNode* deleteAtPosition(ListNode* head, int pos) {
        if (!head) return nullptr;
        if (pos == 0) return head->next;
        ListNode* current = head;
        for (int i = 0; i < pos - 1 && current; i++) {
            current = current->next;
        }
        if (!current || !current->next) return head;
        current->next = current->next->next;
        return head;
    }
};`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def deleteHead(self, head: ListNode) -> ListNode:
        return head.next if head else None
    
    def deleteTail(self, head: ListNode) -> ListNode:
        if not head or not head.next:
            return None
        current = head
        while current.next.next:
            current = current.next
        current.next = None
        return head
    
    def deleteAtPosition(self, head: ListNode, pos: int) -> ListNode:
        if not head:
            return None
        if pos == 0:
            return head.next
        current = head
        for _ in range(pos - 1):
            if not current:
                return head
            current = current.next
        if not current or not current.next:
            return head
        current.next = current.next.next
        return head`
    }
  },
  {
    problemId: "ll-ba-4",
    title: "Design Linked List",
    difficulty: "Medium",
    description: "Design your implementation of the linked list. You can choose to use a singly or doubly linked list.",
    approach: [
      "Maintain head, tail, and size",
      "Implement get(index), addAtHead(val), addAtTail(val), addAtIndex(index, val), deleteAtIndex(index)",
      "Handle edge cases: empty list, index out of bounds"
    ],
    timeComplexity: "O(1) for head/tail, O(min(index, size-index)) for index operations",
    spaceComplexity: "O(n)",
    leetcodeLink: "https://leetcode.com/problems/design-linked-list/",
    gfgLink: "https://www.geeksforgeeks.org/problems/design-linked-list/1",
    companies: ["Amazon", "Facebook", "Goldman Sachs"],
    tags: ["Linked List", "Design"],
    solutions: {
      java: `class MyLinkedList {
    private class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }
    
    private Node head;
    private int size;
    
    public MyLinkedList() {
        head = new Node(0); // dummy head
        size = 0;
    }
    
    public int get(int index) {
        if (index < 0 || index >= size) return -1;
        Node curr = head.next;
        for (int i = 0; i < index; i++) curr = curr.next;
        return curr.val;
    }
    
    public void addAtHead(int val) {
        addAtIndex(0, val);
    }
    
    public void addAtTail(int val) {
        addAtIndex(size, val);
    }
    
    public void addAtIndex(int index, int val) {
        if (index > size) return;
        if (index < 0) index = 0;
        Node pred = head;
        for (int i = 0; i < index; i++) pred = pred.next;
        Node newNode = new Node(val);
        newNode.next = pred.next;
        pred.next = newNode;
        size++;
    }
    
    public void deleteAtIndex(int index) {
        if (index < 0 || index >= size) return;
        Node pred = head;
        for (int i = 0; i < index; i++) pred = pred.next;
        pred.next = pred.next.next;
        size--;
    }
}`,
      cpp: `class MyLinkedList {
    struct Node {
        int val;
        Node* next;
        Node(int val) : val(val), next(nullptr) {}
    };
    
    Node* head;
    int size;
    
public:
    MyLinkedList() {
        head = new Node(0);
        size = 0;
    }
    
    int get(int index) {
        if (index < 0 || index >= size) return -1;
        Node* curr = head->next;
        for (int i = 0; i < index; i++) curr = curr->next;
        return curr->val;
    }
    
    void addAtHead(int val) {
        addAtIndex(0, val);
    }
    
    void addAtTail(int val) {
        addAtIndex(size, val);
    }
    
    void addAtIndex(int index, int val) {
        if (index > size) return;
        if (index < 0) index = 0;
        Node* pred = head;
        for (int i = 0; i < index; i++) pred = pred->next;
        Node* newNode = new Node(val);
        newNode->next = pred->next;
        pred->next = newNode;
        size++;
    }
    
    void deleteAtIndex(int index) {
        if (index < 0 || index >= size) return;
        Node* pred = head;
        for (int i = 0; i < index; i++) pred = pred->next;
        pred->next = pred->next->next;
        size--;
    }
};`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class MyLinkedList:
    def __init__(self):
        self.head = ListNode(0)  # dummy head
        self.size = 0
    
    def get(self, index: int) -> int:
        if index < 0 or index >= self.size:
            return -1
        curr = self.head.next
        for _ in range(index):
            curr = curr.next
        return curr.val
    
    def addAtHead(self, val: int) -> None:
        self.addAtIndex(0, val)
    
    def addAtTail(self, val: int) -> None:
        self.addAtIndex(self.size, val)
    
    def addAtIndex(self, index: int, val: int) -> None:
        if index > self.size:
            return
        if index < 0:
            index = 0
        pred = self.head
        for _ in range(index):
            pred = pred.next
        new_node = ListNode(val)
        new_node.next = pred.next
        pred.next = new_node
        self.size += 1
    
    def deleteAtIndex(self, index: int) -> None:
        if index < 0 or index >= self.size:
            return
        pred = self.head
        for _ in range(index):
            pred = pred.next
        pred.next = pred.next.next
        self.size -= 1`
    }
  },
  {
    problemId: "ll-ba-5",
    title: "Odd-Even Linked List",
    difficulty: "Medium",
    description: "Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list.",
    approach: [
      "Maintain two pointers: odd and even, and evenHead to remember start of even list",
      "Iterate: odd.next = even.next, odd = odd.next; even.next = odd.next, even = even.next",
      "Finally connect odd.next = evenHead"
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    leetcodeLink: "https://leetcode.com/problems/odd-even-linked-list/",
    gfgLink: "https://www.geeksforgeeks.org/problems/odd-even-linked-list/1",
    companies: ["Google", "PayPal", "Zomato"],
    tags: ["Linked List"],
    solutions: {
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode oddEvenList(ListNode head) {
        if (head == null) return null;
        ListNode odd = head;
        ListNode even = head.next;
        ListNode evenHead = even;
        
        while (even != null && even.next != null) {
            odd.next = even.next;
            odd = odd.next;
            even.next = odd.next;
            even = even.next;
        }
        odd.next = evenHead;
        return head;
    }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val) : val(val), next(nullptr) {}
};

class Solution {
public:
    ListNode* oddEvenList(ListNode* head) {
        if (!head) return nullptr;
        ListNode* odd = head;
        ListNode* even = head->next;
        ListNode* evenHead = even;
        
        while (even && even->next) {
            odd->next = even->next;
            odd = odd->next;
            even->next = odd->next;
            even = even->next;
        }
        odd->next = evenHead;
        return head;
    }
};`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def oddEvenList(self, head: ListNode) -> ListNode:
        if not head:
            return None
        odd = head
        even = head.next
        even_head = even
        
        while even and even.next:
            odd.next = even.next
            odd = odd.next
            even.next = odd.next
            even = even.next
        odd.next = even_head
        return head`
    }
  }
];

// ============================================
// BINARY SEARCH PROBLEMS
// ============================================
export const binarySearchSolutions: ProblemSolution[] = [];
// ============================================
// HASH MAP PROBLEMS
// ============================================
export const hashMapSolutions: ProblemSolution[] = [];
// ============================================
// HEAP PROBLEMS
// ============================================
export const heapSolutions: ProblemSolution[] = [];
// ============================================
// RECURSION PROBLEMS
// ============================================
export const recursionSolutions: ProblemSolution[] = [];
// ============================================
// TREE PROBLEMS
// ============================================
export const treeSolutions: ProblemSolution[] = [];
// ============================================
// BST PROBLEMS
// ============================================
export const bstSolutions: ProblemSolution[] = [];
// ============================================
// GRAPH PROBLEMS
// ============================================
export const graphSolutions: ProblemSolution[] = [];
// ============================================
// BACKTRACKING PROBLEMS
// ============================================
export const backtrackingSolutions: ProblemSolution[] = [];
// ============================================
// COMBINE ALL SOLUTIONS
// ============================================

export const allPracticeSolutions: ProblemSolution[] = [
  ...arrayEasySolutions,
  ...arrayTwoPointerSolutions,
  ...arraySlidingWindowSolutions,
  ...arrayKadaneSolutions,
  ...stringSolutions,
  ...stackSolutions,
  ...linkedListSolutions,
  ...binarySearchSolutions,
  ...hashMapSolutions,
  ...heapSolutions,
  ...recursionSolutions,
  ...treeSolutions,
  ...bstSolutions,
  ...graphSolutions,
  ...backtrackingSolutions
];

// Helper function to get solution by problemId
export function getSolutionByProblemId(problemId: string): ProblemSolution | undefined {
  return allPracticeSolutions.find(s => s.problemId === problemId);
}