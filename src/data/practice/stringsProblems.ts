import { ContentSection } from "../recursionContent";

export const stringsEasy: ContentSection[] = [
  {
    id: "strings-easy-1", title: "Valid Palindrome", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Given a string `s`, determine if it is a palindrome considering only alphanumeric characters and ignoring cases.",
      "**Example:** `Input: s = \"A man, a plan, a canal: Panama\"` → `Output: true`.",
      "**Approach:** Two pointers from both ends. Skip non-alphanumeric characters. Compare lowercase versions.",
    ],
    keyPoints: ["Two-pointer is the standard approach for palindrome checking", "Use `Character.isLetterOrDigit()` and `Character.toLowerCase()` for clean comparison"],
    code: [{ title: "Valid Palindrome — Two Pointers", language: "java", content: `public class ValidPalindrome {
    public static boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r)))
                return false;
            l++; r--;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // true
        System.out.println(isPalindrome("race a car")); // false
    }
}` }],
  },
  {
    id: "strings-easy-2", title: "Valid Anagram", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`.",
      "**Example:** `Input: s = \"anagram\", t = \"nagaram\"` → `Output: true`.",
      "**Approach:** Use a frequency array of size 26. Increment for `s`, decrement for `t`. If all zeros at the end, they're anagrams.",
    ],
    keyPoints: ["Frequency array (size 26) is faster than HashMap for lowercase letters"],
    code: [{ title: "Valid Anagram — Frequency Count", language: "java", content: `public class ValidAnagram {
    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] freq = new int[26];
        for (int i = 0; i < s.length(); i++) {
            freq[s.charAt(i) - 'a']++;
            freq[t.charAt(i) - 'a']--;
        }
        for (int f : freq) if (f != 0) return false;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram")); // true
        System.out.println(isAnagram("rat", "car"));         // false
    }
}` }],
  },
  {
    id: "strings-easy-3", title: "Reverse Words in a String", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: [
      "Given a string `s`, reverse the order of words. Words are separated by spaces.",
      "**Example:** `Input: s = \"  hello world  \"` → `Output: \"world hello\"`.",
      "**Approach:** Split by spaces, filter empty strings, reverse the list, join with single space.",
    ],
    keyPoints: ["`String.trim()` and `String.split(\"\\\\s+\")` handle multiple spaces cleanly"],
    code: [{ title: "Reverse Words", language: "java", content: `public class ReverseWords {
    public static String reverseWords(String s) {
        String[] words = s.trim().split("\\\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(" ");
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(reverseWords("  hello world  ")); // "world hello"
    }
}` }],
  },
  {
    id: "strings-easy-4", title: "First Unique Character (LC 387)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Given a string `s`, find the first non-repeating character and return its index. Return -1 if it doesn't exist.",
      "**Example:** `Input: s = \"leetcode\"` → `Output: 0` — 'l' is the first unique character.",
      "**Example:** `Input: s = \"aabb\"` → `Output: -1`.",
      "**Approach:** Two-pass: first pass counts frequencies using an array of size 26. Second pass finds the first character with count 1.",
    ],
    keyPoints: ["Two-pass with frequency array is optimal — O(n) time, O(1) space (fixed 26 chars)"],
    code: [{ title: "First Unique Character", language: "java", content: `public class FirstUnique {
    public static int firstUniqChar(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        for (int i = 0; i < s.length(); i++)
            if (freq[s.charAt(i) - 'a'] == 1) return i;
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(firstUniqChar("leetcode")); // 0
        System.out.println(firstUniqChar("aabb"));     // -1
    }
}` }],
  },
  {
    id: "strings-easy-5", title: "Longest Common Prefix (LC 14)", difficulty: "Easy", timeComplexity: "O(S) where S = sum of all chars", spaceComplexity: "O(1)",
    theory: [
      "Write a function to find the longest common prefix string amongst an array of strings.",
      "**Example:** `Input: strs = [\"flower\",\"flow\",\"flight\"]` → `Output: \"fl\"`.",
      "**Example:** `Input: strs = [\"dog\",\"racecar\",\"car\"]` → `Output: \"\"`.",
      "**Approach:** Compare characters column by column. Stop when a mismatch is found or any string ends.",
    ],
    keyPoints: ["Vertical scanning is simple and efficient", "Sort-based approach: just compare first and last strings after sorting"],
    code: [{ title: "Longest Common Prefix", language: "java", content: `public class LongestCommonPrefix {
    public static String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        for (int i = 0; i < strs[0].length(); i++) {
            char c = strs[0].charAt(i);
            for (int j = 1; j < strs.length; j++) {
                if (i >= strs[j].length() || strs[j].charAt(i) != c)
                    return strs[0].substring(0, i);
            }
        }
        return strs[0];
    }

    public static void main(String[] args) {
        System.out.println(longestCommonPrefix(new String[]{"flower","flow","flight"})); // "fl"
        System.out.println(longestCommonPrefix(new String[]{"dog","racecar","car"}));   // ""
    }
}` }],
  },
  {
    id: "strings-easy-6", title: "Roman to Integer (LC 13)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Convert a Roman numeral string to an integer. Roman numerals: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.",
      "**Example:** `Input: s = \"MCMXCIV\"` → `Output: 1994` — M=1000, CM=900, XC=90, IV=4.",
      "**Approach:** Traverse right to left. If current value < next value, subtract it; otherwise add it.",
    ],
    keyPoints: ["Right-to-left traversal elegantly handles subtraction cases (IV, IX, XL, etc.)"],
    code: [{ title: "Roman to Integer", language: "java", content: `import java.util.*;

public class RomanToInt {
    public static int romanToInt(String s) {
        Map<Character, Integer> map = Map.of('I',1,'V',5,'X',10,'L',50,'C',100,'D',500,'M',1000);
        int result = 0, prev = 0;
        for (int i = s.length() - 1; i >= 0; i--) {
            int val = map.get(s.charAt(i));
            if (val < prev) result -= val;
            else result += val;
            prev = val;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(romanToInt("MCMXCIV")); // 1994
        System.out.println(romanToInt("LVIII"));   // 58
    }
}` }],
  },
  {
    id: "strings-easy-7", title: "Is Subsequence (LC 392)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Given two strings `s` and `t`, return true if `s` is a subsequence of `t` (characters in order, not necessarily contiguous).",
      "**Example:** `Input: s = \"ace\", t = \"abcde\"` → `Output: true`.",
      "**Example:** `Input: s = \"aec\", t = \"abcde\"` → `Output: false`.",
      "**Approach:** Two pointers. Move through `t`, advancing the `s` pointer whenever characters match.",
    ],
    keyPoints: ["Two-pointer greedy scan is optimal for single-query subsequence check"],
    code: [{ title: "Is Subsequence — Two Pointers", language: "java", content: `public class IsSubsequence {
    public static boolean isSubsequence(String s, String t) {
        int si = 0;
        for (int ti = 0; ti < t.length() && si < s.length(); ti++) {
            if (s.charAt(si) == t.charAt(ti)) si++;
        }
        return si == s.length();
    }

    public static void main(String[] args) {
        System.out.println(isSubsequence("ace", "abcde")); // true
        System.out.println(isSubsequence("aec", "abcde")); // false
    }
}` }],
  },
  {
    id: "strings-easy-8", title: "Count and Say (LC 38)", difficulty: "Easy", timeComplexity: "O(2^n)", spaceComplexity: "O(2^n)",
    theory: [
      "The count-and-say sequence: 1, 11, 21, 1211, 111221, ... Each term describes the previous term.",
      "**Example:** `Input: n = 4` → `Output: \"1211\"` — 1→\"1\" (one 1), 11→\"21\" (two 1s), 21→\"1211\" (one 2, one 1).",
      "**Approach:** Iteratively build each term by reading the previous term, counting consecutive identical digits.",
    ],
    keyPoints: ["Pure string simulation — no clever algorithm, just careful iteration"],
    code: [{ title: "Count and Say", language: "java", content: `public class CountAndSay {
    public static String countAndSay(int n) {
        String result = "1";
        for (int i = 2; i <= n; i++) {
            StringBuilder sb = new StringBuilder();
            int count = 1;
            for (int j = 1; j < result.length(); j++) {
                if (result.charAt(j) == result.charAt(j - 1)) count++;
                else { sb.append(count).append(result.charAt(j - 1)); count = 1; }
            }
            sb.append(count).append(result.charAt(result.length() - 1));
            result = sb.toString();
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(countAndSay(4)); // "1211"
        System.out.println(countAndSay(5)); // "111221"
    }
}` }],
  },
];

export const stringsMedium: ContentSection[] = [
  {
    id: "strings-medium-1", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(min(n, charset))",
    theory: [
      "Given a string `s`, find the length of the longest substring without repeating characters.",
      "**Example:** `Input: s = \"abcabcbb\"` → `Output: 3` — The longest substring is `\"abc\"`.",
      "**Approach:** Sliding window. Maintain a HashMap of char→last_index. When a repeat is found, shrink the window from the left past the previous occurrence.",
    ],
    keyPoints: ["Sliding window + HashMap is the O(n) pattern for substring problems"],
    code: [{ title: "Longest Substring — Sliding Window", language: "java", content: `import java.util.*;

public class LongestSubstring {
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c))
                left = Math.max(left, map.get(c) + 1);
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb")); // 3
    }
}` }],
  },
  {
    id: "strings-medium-2", title: "Group Anagrams", difficulty: "Medium", timeComplexity: "O(n * k log k)", spaceComplexity: "O(n * k)",
    theory: [
      "Given an array of strings, group the anagrams together.",
      "**Example:** `Input: strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]` → `Output: [[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]`.",
      "**Approach:** Sort each string to get a canonical form. Use it as HashMap key.",
    ],
    keyPoints: ["Sorted string as HashMap key is elegant for anagram grouping"],
    code: [{ title: "Group Anagrams — Sorted Key", language: "java", content: `import java.util.*;

public class GroupAnagrams {
    public static List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }

    public static void main(String[] args) {
        String[] strs = {"eat","tea","tan","ate","nat","bat"};
        System.out.println(groupAnagrams(strs));
    }
}` }],
  },
  {
    id: "strings-medium-3", title: "Longest Palindromic Substring", difficulty: "Medium", timeComplexity: "O(n^2)", spaceComplexity: "O(1)",
    theory: [
      "Find the longest palindromic substring in a given string.",
      "**Example:** `Input: s = \"babad\"` → `Output: \"bab\"` (or `\"aba\"`).",
      "**Approach:** Expand Around Center. For each character (and each pair), expand outward while characters match.",
    ],
    keyPoints: ["Expand-around-center handles both odd and even length palindromes"],
    code: [{ title: "Longest Palindromic Substring — Expand Around Center", language: "java", content: `public class LongestPalindrome {
    static int start = 0, maxLen = 0;

    static void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            if (r - l + 1 > maxLen) { start = l; maxLen = r - l + 1; }
            l--; r++;
        }
    }

    public static String longestPalindrome(String s) {
        start = 0; maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substring(start, start + maxLen);
    }

    public static void main(String[] args) {
        System.out.println(longestPalindrome("babad")); // "bab" or "aba"
    }
}` }],
  },
  {
    id: "strings-medium-4", title: "String to Integer — atoi (LC 8)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "Implement `atoi` which converts a string to a 32-bit signed integer. Handle whitespace, sign, overflow, and invalid characters.",
      "**Example:** `Input: s = \"   -42\"` → `Output: -42`.",
      "**Example:** `Input: s = \"4193 with words\"` → `Output: 4193`.",
      "**Approach:** Skip whitespace, detect sign, process digits while checking for overflow before each multiplication.",
    ],
    keyPoints: ["Overflow check: `result > (Integer.MAX_VALUE - digit) / 10` before `result = result * 10 + digit`"],
    code: [{ title: "String to Integer (atoi)", language: "java", content: `public class Atoi {
    public static int myAtoi(String s) {
        int i = 0, n = s.length(), sign = 1, result = 0;
        while (i < n && s.charAt(i) == ' ') i++;
        if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-'))
            sign = s.charAt(i++) == '-' ? -1 : 1;
        while (i < n && Character.isDigit(s.charAt(i))) {
            int digit = s.charAt(i++) - '0';
            if (result > (Integer.MAX_VALUE - digit) / 10)
                return sign == 1 ? Integer.MAX_VALUE : Integer.MIN_VALUE;
            result = result * 10 + digit;
        }
        return sign * result;
    }

    public static void main(String[] args) {
        System.out.println(myAtoi("   -42"));          // -42
        System.out.println(myAtoi("4193 with words")); // 4193
    }
}` }],
  },
  {
    id: "strings-medium-5", title: "Decode Ways (LC 91)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: [
      "A message of digits can be decoded: 'A'=1, 'B'=2, ..., 'Z'=26. Given a string of digits, count the total number of ways to decode it.",
      "**Example:** `Input: s = \"226\"` → `Output: 3` — \"BZ\" (2,26), \"VF\" (22,6), \"BBF\" (2,2,6).",
      "**Approach:** DP similar to Fibonacci. `dp[i]` = number of ways to decode `s[0..i-1]`. Check if single digit and two digits form valid codes.",
    ],
    keyPoints: ["'0' cannot be decoded alone — must be part of 10 or 20", "Two-variable space optimization like Fibonacci"],
    code: [{ title: "Decode Ways — DP", language: "java", content: `public class DecodeWays {
    public static int numDecodings(String s) {
        if (s.charAt(0) == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < s.length(); i++) {
            int curr = 0;
            if (s.charAt(i) != '0') curr += prev1;
            int twoDigit = Integer.parseInt(s.substring(i - 1, i + 1));
            if (twoDigit >= 10 && twoDigit <= 26) curr += prev2;
            prev2 = prev1; prev1 = curr;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(numDecodings("226")); // 3
        System.out.println(numDecodings("12"));  // 2
        System.out.println(numDecodings("06"));  // 0
    }
}` }],
  },
  {
    id: "strings-medium-6", title: "Palindrome Partitioning (LC 131)", difficulty: "Medium", timeComplexity: "O(n * 2^n)", spaceComplexity: "O(n)",
    theory: [
      "Given a string `s`, partition it such that every substring of the partition is a palindrome. Return all possible partitions.",
      "**Example:** `Input: s = \"aab\"` → `Output: [[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]`.",
      "**Approach:** Backtracking. At each position, try every possible prefix that is a palindrome, then recurse on the remaining suffix.",
    ],
    keyPoints: ["Check palindrome + backtrack on suffix — classic partition pattern"],
    code: [{ title: "Palindrome Partitioning — Backtracking", language: "java", content: `import java.util.*;

public class PalindromePartition {
    public static List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(String s, int start, List<String> current, List<List<String>> result) {
        if (start == s.length()) { result.add(new ArrayList<>(current)); return; }
        for (int end = start + 1; end <= s.length(); end++) {
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                current.add(sub);
                backtrack(s, end, current, result);
                current.remove(current.size() - 1);
            }
        }
    }

    static boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(partition("aab")); // [[a, a, b], [aa, b]]
    }
}` }],
  },
  {
    id: "strings-medium-7", title: "Repeated DNA Sequences (LC 187)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: [
      "Given a string `s` representing a DNA sequence, return all the 10-letter-long sequences that occur more than once.",
      "**Example:** `Input: s = \"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT\"` → `Output: [\"AAAAACCCCC\",\"CCCCCAAAAA\"]`.",
      "**Approach:** Sliding window of size 10. Use a HashSet to track seen substrings. If seen again, add to result set.",
    ],
    keyPoints: ["Use two sets: one for 'seen', one for 'repeated' to avoid duplicate outputs"],
    code: [{ title: "Repeated DNA Sequences", language: "java", content: `import java.util.*;

public class RepeatedDNA {
    public static List<String> findRepeatedDnaSequences(String s) {
        Set<String> seen = new HashSet<>(), repeated = new HashSet<>();
        for (int i = 0; i <= s.length() - 10; i++) {
            String sub = s.substring(i, i + 10);
            if (!seen.add(sub)) repeated.add(sub);
        }
        return new ArrayList<>(repeated);
    }

    public static void main(String[] args) {
        System.out.println(findRepeatedDnaSequences("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"));
        // [AAAAACCCCC, CCCCCAAAAA]
    }
}` }],
  },
  {
    id: "strings-medium-8", title: "Compare Version Numbers (LC 165)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: [
      "Compare two version strings. Return -1, 0, or 1 depending on whether version1 < version2, ==, or >.",
      "**Example:** `Input: version1 = \"1.01\", version2 = \"1.001\"` → `Output: 0`.",
      "**Example:** `Input: version1 = \"1.0.1\", version2 = \"1\"` → `Output: 1`.",
      "**Approach:** Split by '.', compare each revision as integers. Missing revisions are treated as 0.",
    ],
    keyPoints: ["Split and compare integer values — leading zeros and different lengths are handled naturally"],
    code: [{ title: "Compare Version Numbers", language: "java", content: `public class CompareVersions {
    public static int compareVersion(String v1, String v2) {
        String[] parts1 = v1.split("\\\\.");
        String[] parts2 = v2.split("\\\\.");
        int maxLen = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < maxLen; i++) {
            int num1 = i < parts1.length ? Integer.parseInt(parts1[i]) : 0;
            int num2 = i < parts2.length ? Integer.parseInt(parts2[i]) : 0;
            if (num1 < num2) return -1;
            if (num1 > num2) return 1;
        }
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(compareVersion("1.01", "1.001")); // 0
        System.out.println(compareVersion("1.0.1", "1"));    // 1
        System.out.println(compareVersion("0.1", "1.1"));    // -1
    }
}` }],
  },
];

export const stringsHard: ContentSection[] = [
  {
    id: "strings-hard-1", title: "Minimum Window Substring", difficulty: "Hard", timeComplexity: "O(|s| + |t|)", spaceComplexity: "O(|s| + |t|)",
    theory: [
      "Given strings `s` and `t`, return the minimum window substring of `s` that contains every character of `t` (including duplicates).",
      "**Example:** `Input: s = \"ADOBECODEBANC\", t = \"ABC\"` → `Output: \"BANC\"`.",
      "**Approach:** Sliding window with two pointers. Expand right to include characters, shrink left when all t's characters are covered.",
    ],
    keyPoints: ["Minimum Window Substring is the hardest sliding window problem — mastering it means you can solve any sliding window"],
    code: [{ title: "Minimum Window Substring — Sliding Window", language: "java", content: `import java.util.*;

public class MinWindowSubstring {
    public static String minWindow(String s, String t) {
        if (s.length() < t.length()) return "";
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        int required = need.size(), formed = 0;
        Map<Character, Integer> window = new HashMap<>();
        int left = 0, minLen = Integer.MAX_VALUE, minStart = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            window.merge(c, 1, Integer::sum);
            if (need.containsKey(c) && window.get(c).intValue() == need.get(c).intValue())
                formed++;
            while (formed == required) {
                if (right - left + 1 < minLen) { minLen = right - left + 1; minStart = left; }
                char lc = s.charAt(left);
                window.merge(lc, -1, Integer::sum);
                if (need.containsKey(lc) && window.get(lc) < need.get(lc)) formed--;
                left++;
            }
        }
        return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
    }

    public static void main(String[] args) {
        System.out.println(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
    }
}` }],
  },
  {
    id: "strings-hard-2", title: "Edit Distance (LC 72)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: [
      "Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) required to convert `word1` to `word2`.",
      "**Example:** `Input: word1 = \"horse\", word2 = \"ros\"` → `Output: 3` — horse → rorse → rose → ros.",
      "**Approach:** 2D DP. `dp[i][j]` = min operations for first i chars of word1 and first j chars of word2.",
    ],
    keyPoints: ["Edit Distance is a classic 2D DP problem that appears in spell checkers and diff algorithms"],
    code: [{ title: "Edit Distance — 2D DP", language: "java", content: `public class EditDistance {
    public static int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i-1) == word2.charAt(j-1))
                    dp[i][j] = dp[i-1][j-1];
                else
                    dp[i][j] = 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(minDistance("horse", "ros")); // 3
    }
}` }],
  },
  {
    id: "strings-hard-3", title: "Wildcard Matching (LC 44)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: [
      "Given a string `s` and pattern `p` with '?' (matches any single char) and '*' (matches any sequence including empty), determine if they match.",
      "**Example:** `Input: s = \"adceb\", p = \"*a*b\"` → `Output: true`.",
      "**Approach:** 2D DP. `dp[i][j]` = whether `s[0..i-1]` matches `p[0..j-1]`. '*' can match empty (`dp[i][j-1]`) or extend (`dp[i-1][j]`).",
    ],
    keyPoints: ["'*' matches empty OR extends: `dp[i][j] = dp[i][j-1] || dp[i-1][j]`"],
    code: [{ title: "Wildcard Matching — DP", language: "java", content: `public class WildcardMatching {
    public static boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 1; j <= n; j++)
            dp[0][j] = p.charAt(j - 1) == '*' && dp[0][j - 1];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j-1) == '*')
                    dp[i][j] = dp[i][j-1] || dp[i-1][j];
                else if (p.charAt(j-1) == '?' || s.charAt(i-1) == p.charAt(j-1))
                    dp[i][j] = dp[i-1][j-1];
            }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(isMatch("adceb", "*a*b"));  // true
        System.out.println(isMatch("acdcb", "a*c?b")); // false
    }
}` }],
  },
  {
    id: "strings-hard-4", title: "Shortest Palindrome (LC 214)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: [
      "Given a string `s`, find the shortest palindrome you can form by adding characters only in front of `s`.",
      "**Example:** `Input: s = \"aacecaaa\"` → `Output: \"aaacecaaa\"`.",
      "**Example:** `Input: s = \"abcd\"` → `Output: \"dcbabcd\"`.",
      "**Approach:** Find the longest palindromic prefix using KMP failure function on `s + '#' + reverse(s)`. Prepend the non-palindromic suffix reversed.",
    ],
    keyPoints: ["KMP failure function elegantly finds the longest palindromic prefix"],
    code: [{ title: "Shortest Palindrome — KMP", language: "java", content: `public class ShortestPalindrome {
    public static String shortestPalindrome(String s) {
        String rev = new StringBuilder(s).reverse().toString();
        String combined = s + "#" + rev;
        int[] lps = new int[combined.length()];
        for (int i = 1; i < combined.length(); i++) {
            int j = lps[i - 1];
            while (j > 0 && combined.charAt(i) != combined.charAt(j)) j = lps[j - 1];
            if (combined.charAt(i) == combined.charAt(j)) j++;
            lps[i] = j;
        }
        int palLen = lps[combined.length() - 1];
        return rev.substring(0, s.length() - palLen) + s;
    }

    public static void main(String[] args) {
        System.out.println(shortestPalindrome("aacecaaa")); // "aaacecaaa"
        System.out.println(shortestPalindrome("abcd"));     // "dcbabcd"
    }
}` }],
  },
  {
    id: "strings-hard-5", title: "Distinct Subsequences (LC 115)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: [
      "Given two strings `s` and `t`, return the number of distinct subsequences of `s` which equal `t`.",
      "**Example:** `Input: s = \"rabbbit\", t = \"rabbit\"` → `Output: 3`.",
      "**Approach:** 2D DP. `dp[i][j]` = number of ways to form `t[0..j-1]` from `s[0..i-1]`. If chars match: `dp[i-1][j-1] + dp[i-1][j]`, else: `dp[i-1][j]`.",
    ],
    keyPoints: ["When chars match, we can either use s[i] to match t[j] or skip it"],
    code: [{ title: "Distinct Subsequences — DP", language: "java", content: `public class DistinctSubseq {
    public static int numDistinct(String s, String t) {
        int m = s.length(), n = t.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = 1;
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++) {
                dp[i][j] = dp[i-1][j];
                if (s.charAt(i-1) == t.charAt(j-1))
                    dp[i][j] += dp[i-1][j-1];
            }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(numDistinct("rabbbit", "rabbit")); // 3
        System.out.println(numDistinct("babgbag", "bag"));    // 5
    }
}` }],
  },
  {
    id: "strings-hard-6", title: "Regular Expression Matching (LC 10)", difficulty: "Hard", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: [
      "Implement regular expression matching with `.` (matches any char) and `*` (zero or more of preceding element).",
      "**Example:** `Input: s = \"aab\", p = \"c*a*b\"` → `Output: true` — c* = empty, a* = aa, b = b.",
      "**Approach:** 2D DP. `dp[i][j]` = whether `s[0..i-1]` matches `p[0..j-1]`. Handle '*' by checking zero occurrences (`dp[i][j-2]`) or one+ occurrences.",
    ],
    keyPoints: ["'*' means zero or more of the PRECEDING element — not like wildcard '*'"],
    code: [{ title: "Regex Matching — DP", language: "java", content: `public class RegexMatch {
    public static boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 2; j <= n; j++)
            if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j-1) == '*') {
                    dp[i][j] = dp[i][j-2]; // zero occurrences
                    if (p.charAt(j-2) == '.' || p.charAt(j-2) == s.charAt(i-1))
                        dp[i][j] |= dp[i-1][j]; // one+ occurrences
                } else if (p.charAt(j-1) == '.' || p.charAt(j-1) == s.charAt(i-1)) {
                    dp[i][j] = dp[i-1][j-1];
                }
            }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(isMatch("aab", "c*a*b"));  // true
        System.out.println(isMatch("ab", ".*"));       // true
        System.out.println(isMatch("mississippi", "mis*is*p*.")); // false
    }
}` }],
  },
  {
    id: "strings-hard-7", title: "Word Break II (LC 140)", difficulty: "Hard", timeComplexity: "O(2^n)", spaceComplexity: "O(2^n)",
    theory: [
      "Given a string `s` and a dictionary `wordDict`, add spaces to construct sentences where each word is in the dictionary. Return all such possible sentences.",
      "**Example:** `Input: s = \"catsanddog\", wordDict = [\"cat\",\"cats\",\"and\",\"sand\",\"dog\"]` → `Output: [\"cats and dog\",\"cat sand dog\"]`.",
      "**Approach:** Backtracking with memoization. At each position, try every dictionary word that matches the prefix, recurse on the suffix.",
    ],
    keyPoints: ["Memoization avoids re-computing the same suffix — exponential to polynomial for many cases"],
    code: [{ title: "Word Break II — Backtracking", language: "java", content: `import java.util.*;

public class WordBreakII {
    public static List<String> wordBreak(String s, List<String> wordDict) {
        return backtrack(s, new HashSet<>(wordDict), new HashMap<>());
    }

    static List<String> backtrack(String s, Set<String> dict, Map<String, List<String>> memo) {
        if (memo.containsKey(s)) return memo.get(s);
        List<String> result = new ArrayList<>();
        if (s.isEmpty()) { result.add(""); return result; }
        for (String word : dict) {
            if (s.startsWith(word)) {
                List<String> sublist = backtrack(s.substring(word.length()), dict, memo);
                for (String sub : sublist)
                    result.add(word + (sub.isEmpty() ? "" : " " + sub));
            }
        }
        memo.put(s, result);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(wordBreak("catsanddog", Arrays.asList("cat","cats","and","sand","dog")));
        // [cats and dog, cat sand dog]
    }
}` }],
  },
  {
    id: "strings-hard-8", title: "Palindrome Pairs (LC 336)", difficulty: "Hard", timeComplexity: "O(n * k^2)", spaceComplexity: "O(n * k)",
    theory: [
      "Given a list of unique words, return all pairs `[i, j]` such that `words[i] + words[j]` forms a palindrome.",
      "**Example:** `Input: words = [\"abcd\",\"dcba\",\"lls\",\"s\",\"sssll\"]` → `Output: [[0,1],[1,0],[3,2],[2,4]]`.",
      "**Approach:** For each word, check all possible splits. If one part is a palindrome, look up the reverse of the other part in a HashMap.",
    ],
    keyPoints: [
      "HashMap of word → index for O(1) reverse lookup",
      "Check both prefix-is-palindrome and suffix-is-palindrome cases for each word",
    ],
    code: [{ title: "Palindrome Pairs", language: "java", content: `import java.util.*;

public class PalindromePairs {
    public static List<List<Integer>> palindromePairs(String[] words) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < words.length; i++) map.put(words[i], i);
        List<List<Integer>> result = new ArrayList<>();

        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            for (int j = 0; j <= word.length(); j++) {
                String left = word.substring(0, j);
                String right = word.substring(j);
                // If left is palindrome, reverse of right + word is palindrome
                if (isPal(left)) {
                    String revRight = new StringBuilder(right).reverse().toString();
                    if (map.containsKey(revRight) && map.get(revRight) != i)
                        result.add(Arrays.asList(map.get(revRight), i));
                }
                // If right is palindrome, word + reverse of left is palindrome
                if (right.length() > 0 && isPal(right)) {
                    String revLeft = new StringBuilder(left).reverse().toString();
                    if (map.containsKey(revLeft) && map.get(revLeft) != i)
                        result.add(Arrays.asList(i, map.get(revLeft)));
                }
            }
        }
        return result;
    }

    static boolean isPal(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(palindromePairs(new String[]{"abcd","dcba","lls","s","sssll"}));
        // [[0,1],[1,0],[3,2],[2,4]]
    }
}` }],
  },
];
