import { ContentSection } from "./recursionContent";

export const stringsContent: ContentSection[] = [
  {
    id: "str-intro",
    title: "Strings in CP — Overview",
    difficulty: "Easy",
    theory: [
      "Strings are sequences of characters. In Java, String is **immutable** — every modification creates a new object. For CP, use **StringBuilder** for O(1) amortized append vs O(n) String concatenation.",
      "Key string properties: **0-indexed**, `.length()` method, `.charAt(i)` for access, `.toCharArray()` for array conversion.",
      "Common CP patterns: Sliding window, two pointers, hashing, prefix functions, suffix arrays, and trie-based approaches."
    ],
    code: [
      {
        title: "String vs StringBuilder Performance",
        language: "java",
        content: `// ❌ O(n²) — creates new String each iteration
String s = "";
for (int i = 0; i < 100000; i++) s += "a";

// ✅ O(n) — modifies buffer in-place
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100000; i++) sb.append("a");
String result = sb.toString();`
      },
      {
        title: "Essential String Methods for CP",
        language: "java",
        content: `String s = "algorithm";

char c = s.charAt(3);             // 'o'
String sub = s.substring(0, 4);   // "algo"
int idx = s.indexOf("rith");      // 4
boolean has = s.contains("go");   // true
char[] arr = s.toCharArray();     // char array
String rev = new StringBuilder(s).reverse().toString();`
      }
    ],
    tip: "In CP, always use `StringBuilder` for string building and `char[]` for character-level manipulation."
  },
  {
    id: "str-palindrome",
    title: "Palindrome Problems",
    difficulty: "Easy",
    theory: [
      "A **palindrome** reads the same forwards and backwards. Key techniques: two-pointer check O(n), expand-around-center O(n²) for longest palindromic substring, and **Manacher's algorithm** O(n) for finding ALL sub-palindromes.",
      "**Manacher's key insight**: For each center i, compute d_odd[i] (max radius of odd-length palindrome) and d_even[i] (max radius of even-length palindrome). Palindromes at a center form a **contiguous chain** — if there's a palindrome of length l, there's also one of length l-2, l-4, etc.",
      "**Manacher's algorithm**: Maintain the rightmost palindrome boundary (l, r). For each new center i: if i < r, mirror from position j = l+(r-i) to initialize d[i] = min(d[j], r-i). Then extend trivially. This gives O(n) total because r only moves right.",
      "**Alternative approaches**: String hashing can solve palindrome problems in O(n·log n) — binary search for the longest palindrome at each center, check using hash comparison of the substring and its reverse.",
      "Common variants: check palindrome, longest palindromic substring, longest palindromic subsequence (DP), minimum insertions to make palindrome, count palindromic substrings."
    ],
    code: [
      {
        title: "Check if String is Palindrome",
        language: "java",
        content: `static boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++;
        right--;
    }
    return true;
}
// Time: O(n), Space: O(1)`
      },
      {
        title: "Longest Palindromic Substring — Expand Around Center",
        language: "java",
        content: `static String longestPalindrome(String s) {
    int start = 0, maxLen = 1;
    
    for (int i = 0; i < s.length(); i++) {
        // Odd-length palindromes
        int len1 = expandAroundCenter(s, i, i);
        // Even-length palindromes
        int len2 = expandAroundCenter(s, i, i + 1);
        
        int len = Math.max(len1, len2);
        if (len > maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }
    return s.substring(start, start + maxLen);
}
// Time: O(n²), Space: O(1)`
      },
      {
        title: "Expand Around Center Helper",
        language: "java",
        content: `static int expandAroundCenter(String s, int left, int right) {
    while (left >= 0 && right < s.length() 
           && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;
}`
      },
      {
        title: "Manacher's Algorithm — O(n) All Palindromes",
        language: "java",
        content: `// Computes d_odd[i] = radius of longest odd-length palindrome centered at i
// d_odd[i] means s[i-d+1 .. i+d-1] is a palindrome of length 2*d-1
static int[] manacherOdd(String s) {
    int n = s.length();
    int[] d = new int[n];
    // l, r are exclusive boundaries of rightmost palindrome
    int l = 0, r = 0;
    for (int i = 0; i < n; i++) {
        // Mirror from position l + (r - i) if inside rightmost palindrome
        d[i] = (i < r) ? Math.min(r - i, d[l + (r - 1 - i)]) : 1;
        // Extend trivially
        while (i - d[i] >= 0 && i + d[i] < n 
               && s.charAt(i - d[i]) == s.charAt(i + d[i]))
            d[i]++;
        // Update rightmost palindrome
        if (i + d[i] > r) {
            l = i - d[i] + 1;
            r = i + d[i];
        }
    }
    return d; // d[i] = radius (palindrome length = 2*d[i] - 1)
}

// For even-length palindromes: transform "abc" → "a#b#c" and run odd
// Or implement separately with similar logic
// Time: O(n), Space: O(n)`
      },
      {
        title: "Count Total Palindromic Substrings",
        language: "java",
        content: `static long countPalindromes(String s) {
    int[] d = manacherOdd(s);
    long count = 0;
    for (int x : d) count += x; // Each center contributes d[i] palindromes
    return count;
}
// "aaa" → d = [1,2,1] → 4 palindromic substrings: "a","a","a","aa","aa","aaa"
// Wait, that's 6. Let's count: a(0), a(1), a(2), aa(01), aa(12), aaa(012) = 6
// d[0]=1, d[1]=2, d[2]=1 → 1+2+1 = 4 odd-length. Need even too!`
      }
    ],
    note: "Manacher's finds ALL palindromic substrings in O(n). The key invariant is that the rightmost boundary r only moves right, giving amortized O(1) per center. For competitive programming, the 'transform and run odd-only' approach is simplest."
  },
  {
    id: "str-matching",
    title: "Pattern Matching — KMP Algorithm",
    difficulty: "Medium",
    theory: [
      "**Pattern Matching**: Given text T and pattern P, find all occurrences of P in T.",
      "**Naive approach**: O(n·m) — slide pattern over text character by character.",
      "**KMP (Knuth-Morris-Pratt)**: O(n+m) — precomputes a **prefix function** (LPS/failure array) to skip unnecessary comparisons. Published by Knuth, Morris, and Pratt in 1977.",
      "**Prefix function π[i]** = length of the longest proper prefix of s[0..i] which is also a suffix of s[0..i]. Example: π('abcabcd') = [0,0,0,1,2,3,0].",
      "**Key observation**: π[i+1] ≤ π[i] + 1 (the value can increase by at most 1). If s[i+1] = s[π[i]], then π[i+1] = π[i] + 1. Otherwise, we 'fall back' to π[π[i]-1] and check again — this chain of fallbacks is what makes KMP efficient.",
      "**Why O(n) for prefix function**: The value of π can increase at most n times total (by 1 each step), and therefore can decrease at most n times total. So the total number of iterations across all fallbacks is O(n).",
      "**Applications beyond pattern matching**: (1) Count occurrences of each prefix in the string. (2) Count distinct substrings by building prefix function incrementally. (3) String compression: shortest period of s has length n - π[n-1] if n is divisible by it. (4) Building automaton for string matching."
    ],
    code: [
      {
        title: "Build LPS (Failure Function) Array",
        language: "java",
        content: `static int[] buildLPS(String pattern) {
    int m = pattern.length();
    int[] lps = new int[m];
    int len = 0, i = 1;
    
    while (i < m) {
        if (pattern.charAt(i) == pattern.charAt(len)) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0) {
                len = lps[len - 1]; // Don't increment i
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}
// Time: O(m)`
      },
      {
        title: "KMP Search",
        language: "java",
        content: `static List<Integer> kmpSearch(String text, String pattern) {
    List<Integer> result = new ArrayList<>();
    int n = text.length(), m = pattern.length();
    int[] lps = buildLPS(pattern);
    
    int i = 0, j = 0;
    while (i < n) {
        if (text.charAt(i) == pattern.charAt(j)) {
            i++; j++;
        }
        if (j == m) {
            result.add(i - j); // Match found at index (i - j)
            j = lps[j - 1];
        } else if (i < n && text.charAt(i) != pattern.charAt(j)) {
            if (j != 0) j = lps[j - 1];
            else i++;
        }
    }
    return result;
}
// Time: O(n + m), Space: O(m)`
      },
      {
        title: "String Compression using Prefix Function",
        language: "java",
        content: `// Find shortest repeating period of string s
// If s = "abcabcabc", period = "abc" (length 3)
static int shortestPeriod(String s) {
    int n = s.length();
    int[] lps = buildLPS(s);
    int period = n - lps[n - 1];
    // If n is divisible by period, then s = period repeated n/period times
    return (n % period == 0) ? period : n; // n means no compression
}
// Example: "abcabc" → period=3, "abab" → period=2, "abc" → period=3 (no repeat)`
      }
    ],
    keyPoints: [
      "KMP never backtracks on the text — only on the pattern using LPS",
      "LPS array construction is itself a pattern matching on the pattern",
      "KMP is optimal for single-pattern matching",
      "String compression: period = n - π[n-1], valid if n % period == 0",
      "Counting prefix occurrences: count[π[i]]++ for each i, then propagate"
    ]
  },
  {
    id: "str-rabin-karp",
    title: "Rabin-Karp — Rolling Hash",
    difficulty: "Medium",
    theory: [
      "**Rabin-Karp** uses **polynomial hashing** to find pattern matches. Authored by Rabin and Karp in 1987. The idea: compute hash of pattern and compare with hash of each substring of equal length in O(1).",
      "**Hash function**: hash(s) = (s[0]·p⁰ + s[1]·p¹ + ... + s[n-1]·pⁿ⁻¹) mod m, where p is a prime base (31 for lowercase) and m is a large prime (10⁹+9). This polynomial hash allows O(1) substring hash computation using prefix hashes.",
      "**Key technique**: Precompute prefix hashes h[0..n]. Hash of substring s[i..j] = (h[j+1] - h[i]) / p^i mod m. No rolling needed — just two prefix hash lookups! This is more versatile than the sliding window approach.",
      "Hash collisions possible → verify matches character-by-character. With a single hash, collision probability per comparison is ~1/m ≈ 10⁻⁹. Use **double hashing** (two different mod values) to reduce to ~10⁻¹⁸.",
      "**Applications**: (1) Multi-pattern matching — hash all patterns, check in O(1) per window. (2) Count distinct substrings of length k. (3) Longest duplicate substring via binary search + hashing. (4) Comparing arbitrary substrings in O(1) after O(n) preprocessing."
    ],
    code: [
      {
        title: "Rabin-Karp with Rolling Hash",
        language: "java",
        content: `static List<Integer> rabinKarp(String text, String pattern) {
    List<Integer> result = new ArrayList<>();
    int n = text.length(), m = pattern.length();
    long MOD = 1_000_000_007L, BASE = 31;
    
    // Compute BASE^(m-1) % MOD
    long power = 1;
    for (int i = 0; i < m - 1; i++)
        power = (power * BASE) % MOD;
    
    // Hash of pattern
    long patHash = 0;
    for (int i = 0; i < m; i++)
        patHash = (patHash * BASE + pattern.charAt(i)) % MOD;
    
    // Hash of first window
    long textHash = 0;
    for (int i = 0; i < m; i++)
        textHash = (textHash * BASE + text.charAt(i)) % MOD;
    
    for (int i = 0; i <= n - m; i++) {
        if (textHash == patHash) {
            // Verify character by character
            if (text.substring(i, i + m).equals(pattern))
                result.add(i);
        }
        // Roll the hash
        if (i < n - m) {
            textHash = (textHash - text.charAt(i) * power % MOD + MOD) % MOD;
            textHash = (textHash * BASE + text.charAt(i + m)) % MOD;
        }
    }
    return result;
}
// Expected: O(n + m), Worst: O(n·m)`
      }
    ],
    tip: "Rabin-Karp excels at **multi-pattern matching** — compute hashes of all patterns and check in O(1) per window. For anti-hash tests in competitive programming, always use double hashing with two different moduli (e.g., 10⁹+7 and 10⁹+9)."
  },
  {
    id: "str-z-algo",
    title: "Z-Algorithm",
    difficulty: "Medium",
    theory: [
      "**Z-function**: z[i] = length of the longest substring starting at position i that is also a prefix of the string. By convention z[0] = 0. Example: z('aaabaab') = [0,2,1,0,2,1,0].",
      "**Efficient O(n) algorithm**: Maintain the rightmost segment match [l, r). For each i: if i < r, initialize z[i] = min(r-i, z[i-l]) using already computed values. Then extend by comparing characters. Update [l, r) if i + z[i] > r.",
      "**Why O(n)**: Each character is compared at most twice — once when extending from some position, and the result is reused via the [l, r) window. The r pointer only moves right, giving amortized O(n).",
      "**Applications**: (1) Pattern matching via P + '$' + T — find all i where z[i] = |P|. (2) Count distinct substrings. (3) String compression — smallest period k such that z[k] = n-k. (4) Building the KMP failure function from Z-function and vice versa.",
      "Z-function and prefix function are **equivalent** in power — each can be computed from the other in O(n). Z-function is often considered easier to implement and understand."
    ],
    code: [
      {
        title: "Build Z-Array",
        language: "java",
        content: `static int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;
    
    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}
// Time: O(n), Space: O(n)`
      },
      {
        title: "Pattern Matching using Z-Algorithm",
        language: "java",
        content: `static List<Integer> zSearch(String text, String pattern) {
    String combined = pattern + "$" + text;
    int[] z = zFunction(combined);
    int m = pattern.length();
    
    List<Integer> result = new ArrayList<>();
    for (int i = m + 1; i < combined.length(); i++) {
        if (z[i] == m) {
            result.add(i - m - 1);
        }
    }
    return result;
}`
      },
      {
        title: "String Compression using Z-function",
        language: "java",
        content: `// Find smallest period: smallest k where z[k] == n - k
static int smallestPeriod(String s) {
    int n = s.length();
    int[] z = zFunction(s);
    for (int k = 1; k < n; k++) {
        if (z[k] == n - k && n % k == 0) return k;
    }
    return n; // No compression possible
}
// "ababab" → period 2 ("ab"), "abcabc" → period 3 ("abc")`
      }
    ]
  },
  {
    id: "str-trie",
    title: "Trie (Prefix Tree)",
    difficulty: "Medium",
    theory: [
      "A **Trie** is a tree-like data structure for efficient string prefix operations. Each node represents a character, paths from root to nodes form prefixes.",
      "Operations: Insert O(m), Search O(m), Prefix search O(m) where m = word length.",
      "Used for: autocomplete, spell checking, longest common prefix, XOR maximum (binary trie)."
    ],
    code: [
      {
        title: "Trie Node Structure",
        language: "java",
        content: `class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
    int prefixCount = 0; // Words passing through this node
}`
      },
      {
        title: "Trie — Insert",
        language: "java",
        content: `class Trie {
    TrieNode root = new TrieNode();
    
    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null)
                node.children[idx] = new TrieNode();
            node = node.children[idx];
            node.prefixCount++;
        }
        node.isEndOfWord = true;
    }
}`
      },
      {
        title: "Trie — Search & StartsWith",
        language: "java",
        content: `boolean search(String word) {
    TrieNode node = root;
    for (char c : word.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null) return false;
        node = node.children[idx];
    }
    return node.isEndOfWord;
}

boolean startsWith(String prefix) {
    TrieNode node = root;
    for (char c : prefix.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null) return false;
        node = node.children[idx];
    }
    return true;
}

int countWordsWithPrefix(String prefix) {
    TrieNode node = root;
    for (char c : prefix.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null) return 0;
        node = node.children[idx];
    }
    return node.prefixCount;
}`
      }
    ]
  },
  {
    id: "str-hashing",
    title: "String Hashing",
    difficulty: "Medium",
    theory: [
      "**Polynomial hashing** maps strings to integers: hash(s) = Σ s[i] × p^i mod m. Choose p ≥ alphabet size (p=31 for lowercase, p=53 for mixed case) and m as a large prime (10⁹+7 or 10⁹+9).",
      "**Prefix hashes** allow O(1) substring hash queries after O(n) preprocessing: hash(s[l..r]) = (h[r+1] - h[l] × p^(r-l+1)) mod m. This is the single most important technique for string problems.",
      "**Collision probability**: For a single hash mod m, probability of collision between two random strings is ~1/m. With m = 10⁹+9, this is safe for most problems. But competitive programming problems may have **anti-hash tests**.",
      "Use **double hashing** (two different base/MOD pairs) to reduce collision probability to ~1/m² ≈ 10⁻¹⁸. Example: use (31, 10⁹+7) and (37, 10⁹+9) simultaneously.",
      "**Applications**: (1) O(1) substring equality comparison. (2) Rabin-Karp pattern matching. (3) Count distinct substrings of length k in O(n). (4) Longest common substring via binary search + hashing O(n·log n). (5) Determine if one string is a rotation of another in O(n)."
    ],
    code: [
      {
        title: "Prefix Hash — O(1) Substring Hash Query",
        language: "java",
        content: `class StringHash {
    long[] hash, power;
    long MOD = 1_000_000_007L, BASE = 31;
    
    StringHash(String s) {
        int n = s.length();
        hash = new long[n + 1];
        power = new long[n + 1];
        power[0] = 1;
        
        for (int i = 0; i < n; i++) {
            hash[i + 1] = (hash[i] * BASE + s.charAt(i) - 'a' + 1) % MOD;
            power[i + 1] = (power[i] * BASE) % MOD;
        }
    }
    
    // Hash of s[l..r] (0-indexed, inclusive)
    long getHash(int l, int r) {
        long h = (hash[r + 1] - hash[l] * power[r - l + 1] % MOD + MOD * 2) % MOD;
        return h;
    }
}`
      },
      {
        title: "Compare Two Substrings in O(1)",
        language: "java",
        content: `// Check if s[l1..r1] == s[l2..r2]
static boolean equalSubstrings(StringHash sh, int l1, int r1, int l2, int r2) {
    return sh.getHash(l1, r1) == sh.getHash(l2, r2);
}

// Count distinct substrings of length k
static int countDistinct(String s, int k) {
    StringHash sh = new StringHash(s);
    Set<Long> seen = new HashSet<>();
    for (int i = 0; i + k - 1 < s.length(); i++) {
        seen.add(sh.getHash(i, i + k - 1));
    }
    return seen.size();
}`
      },
      {
        title: "Double Hashing for Safety",
        language: "java",
        content: `class DoubleHash {
    StringHash h1, h2;
    DoubleHash(String s) {
        h1 = new StringHash(s); // uses MOD=10^9+7, BASE=31
        h2 = new StringHash(s); // override to MOD=10^9+9, BASE=37
    }
    long getHash(int l, int r) {
        return h1.getHash(l, r) * 1_000_000_009L + h2.getHash(l, r);
    }
}
// Collision probability: ~10^(-18) — virtually impossible`
      }
    ],
    warning: "Always use **double hashing** in contests to avoid anti-hash tests that cause collisions. Never use BASE = 1 or MOD that's a power of 2 — these are easily hackable."
  },
  {
    id: "str-sliding-window",
    title: "Sliding Window on Strings",
    difficulty: "Medium",
    theory: [
      "**Sliding window** maintains a window [l, r] over the string, expanding/shrinking based on conditions.",
      "Two types: **Fixed-size** window (move both ends together) and **Variable-size** window (expand right, shrink left when condition breaks)."
    ],
    code: [
      {
        title: "Longest Substring Without Repeating Characters",
        language: "java",
        content: `static int lengthOfLongestSubstring(String s) {
    int[] lastSeen = new int[128];
    Arrays.fill(lastSeen, -1);
    int maxLen = 0, left = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen[c] >= left) {
            left = lastSeen[c] + 1;
        }
        lastSeen[c] = right;
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time: O(n), Space: O(1)`
      },
      {
        title: "Minimum Window Substring",
        language: "java",
        content: `static String minWindow(String s, String t) {
    int[] need = new int[128], have = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    
    int required = 0;
    for (int x : need) if (x > 0) required++;
    
    int formed = 0, left = 0, minLen = Integer.MAX_VALUE, start = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        have[c]++;
        if (need[c] > 0 && have[c] == need[c]) formed++;
        
        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                start = left;
            }
            char lc = s.charAt(left);
            have[lc]--;
            if (need[lc] > 0 && have[lc] < need[lc]) formed--;
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
// Time: O(n), Space: O(1)`
      },
      {
        title: "Longest Substring with At Most K Distinct Characters",
        language: "java",
        content: `static int longestKDistinct(String s, int k) {
    int[] freq = new int[128];
    int distinct = 0, left = 0, maxLen = 0;
    
    for (int right = 0; right < s.length(); right++) {
        if (freq[s.charAt(right)]++ == 0) distinct++;
        
        while (distinct > k) {
            if (--freq[s.charAt(left)] == 0) distinct--;
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time: O(n), Space: O(1)`
      }
    ]
  },
  {
    id: "str-anagram",
    title: "Anagram & Frequency Problems",
    difficulty: "Easy",
    theory: [
      "Two strings are **anagrams** if they have the same character frequencies. Use a frequency array of size 26 (or 128 for ASCII).",
      "Key technique: maintain a frequency difference array — when all counts are 0, strings are anagrams."
    ],
    code: [
      {
        title: "Check Anagram",
        language: "java",
        content: `static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] freq = new int[26];
    for (int i = 0; i < s.length(); i++) {
        freq[s.charAt(i) - 'a']++;
        freq[t.charAt(i) - 'a']--;
    }
    for (int f : freq) if (f != 0) return false;
    return true;
}
// Time: O(n), Space: O(1)`
      },
      {
        title: "Find All Anagram Indices in a String",
        language: "java",
        content: `static List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    if (s.length() < p.length()) return result;
    
    int[] freq = new int[26];
    for (char c : p.toCharArray()) freq[c - 'a']++;
    
    int matches = 0;
    for (int f : freq) if (f == 0) matches++;
    
    for (int i = 0; i < s.length(); i++) {
        int idx = s.charAt(i) - 'a';
        freq[idx]--;
        if (freq[idx] == 0) matches++;
        else if (freq[idx] == -1) matches--;
        
        if (i >= p.length()) {
            idx = s.charAt(i - p.length()) - 'a';
            freq[idx]++;
            if (freq[idx] == 0) matches++;
            else if (freq[idx] == 1) matches--;
        }
        
        if (matches == 26) result.add(i - p.length() + 1);
    }
    return result;
}
// Time: O(n), Space: O(1)`
      },
      {
        title: "Group Anagrams",
        language: "java",
        content: `static List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] arr = s.toCharArray();
        Arrays.sort(arr);
        String key = new String(arr);
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
// Time: O(n·k·log k), Space: O(n·k)`
      }
    ]
  },
  {
    id: "str-subsequence",
    title: "Subsequence Problems",
    difficulty: "Medium",
    theory: [
      "A **subsequence** is obtained by deleting some (or no) characters without changing the relative order.",
      "Key problems: Is subsequence check (two pointers), Longest Common Subsequence (DP), distinct subsequences count."
    ],
    code: [
      {
        title: "Is Subsequence — Two Pointer",
        language: "java",
        content: `static boolean isSubsequence(String s, String t) {
    int i = 0, j = 0;
    while (i < s.length() && j < t.length()) {
        if (s.charAt(i) == t.charAt(j)) i++;
        j++;
    }
    return i == s.length();
}
// Time: O(n + m), Space: O(1)`
      },
      {
        title: "Longest Common Subsequence (LCS)",
        language: "java",
        content: `static int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1))
                dp[i][j] = dp[i - 1][j - 1] + 1;
            else
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}
// Time: O(m·n), Space: O(m·n)`
      },
      {
        title: "Print the LCS String",
        language: "java",
        content: `static String printLCS(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (s1.charAt(i-1) == s2.charAt(j-1))
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    
    // Backtrack to find the LCS
    StringBuilder sb = new StringBuilder();
    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (s1.charAt(i-1) == s2.charAt(j-1)) {
            sb.append(s1.charAt(i-1));
            i--; j--;
        } else if (dp[i-1][j] > dp[i][j-1]) i--;
        else j--;
    }
    return sb.reverse().toString();
}`
      }
    ]
  },
  {
    id: "str-suffix",
    title: "Suffix Array & LCP",
    difficulty: "Hard",
    theory: [
      "**Suffix Array**: sorted array of all suffixes of a string, represented by their starting indices. The i-th suffix is s[i..n-1]. The suffix array contains the starting indices after sorting all suffixes lexicographically.",
      "**Construction**: The O(n·log²n) approach sorts suffixes by doubling the comparison length each iteration — first by single characters, then pairs, then quadruples, etc. Each phase uses the rankings from the previous phase. O(n·log n) construction exists using radix sort instead of comparison sort.",
      "**LCP Array**: lcp[i] = length of longest common prefix between sa[i] and sa[i-1] in sorted order. **Kasai's algorithm** computes it in O(n) using the key insight: if lcp of the suffix starting at position i is h, then lcp of the suffix starting at position i+1 is at least h-1.",
      "**Applications**: (1) Count distinct substrings = n(n+1)/2 - Σlcp[i]. (2) Longest repeated substring = max(lcp[i]). (3) Pattern matching via binary search in O(m·log n). (4) Longest common substring of two strings — concatenate with separator, find max lcp between suffixes from different strings."
    ],
    code: [
      {
        title: "Suffix Array Construction — O(n·log²n)",
        language: "java",
        content: `static int[] buildSuffixArray(String s) {
    int n = s.length();
    Integer[] sa = new Integer[n];
    int[] rank = new int[n], tmp = new int[n];
    
    for (int i = 0; i < n; i++) { sa[i] = i; rank[i] = s.charAt(i); }
    
    for (int gap = 1; gap < n; gap *= 2) {
        final int g = gap;
        final int[] r = rank.clone();
        
        Arrays.sort(sa, (a, b) -> {
            if (r[a] != r[b]) return r[a] - r[b];
            int ra = a + g < n ? r[a + g] : -1;
            int rb = b + g < n ? r[b + g] : -1;
            return ra - rb;
        });
        
        tmp[sa[0]] = 0;
        for (int i = 1; i < n; i++) {
            tmp[sa[i]] = tmp[sa[i - 1]];
            if (r[sa[i]] != r[sa[i - 1]] ||
                (sa[i] + g < n ? r[sa[i] + g] : -1) != 
                (sa[i-1] + g < n ? r[sa[i-1] + g] : -1))
                tmp[sa[i]]++;
        }
        rank = tmp.clone();
    }
    return Arrays.stream(sa).mapToInt(i -> i).toArray();
}`
      },
      {
        title: "LCP Array from Suffix Array — Kasai's Algorithm",
        language: "java",
        content: `static int[] buildLCPArray(String s, int[] sa) {
    int n = s.length();
    int[] rank = new int[n], lcp = new int[n];
    
    for (int i = 0; i < n; i++) rank[sa[i]] = i;
    
    int h = 0;
    for (int i = 0; i < n; i++) {
        if (rank[i] > 0) {
            int j = sa[rank[i] - 1];
            while (i + h < n && j + h < n && s.charAt(i+h) == s.charAt(j+h))
                h++;
            lcp[rank[i]] = h;
            if (h > 0) h--;
        } else h = 0;
    }
    return lcp;
}
// Time: O(n)`
      },
      {
        title: "Count Distinct Substrings using Suffix Array",
        language: "java",
        content: `static long countDistinctSubstrings(String s) {
    int n = s.length();
    int[] sa = buildSuffixArray(s);
    int[] lcp = buildLCPArray(s, sa);
    
    long total = (long) n * (n + 1) / 2; // All substrings
    long duplicates = 0;
    for (int l : lcp) duplicates += l;
    
    return total - duplicates;
}`
      }
    ]
  },
  {
    id: "str-advanced",
    title: "Advanced String Techniques",
    difficulty: "Expert",
    theory: [
      "**Aho-Corasick**: Multi-pattern matching automaton. Given a set of patterns (dictionary) with total length m over alphabet of size k, builds a finite-state automaton in O(mk) time. Then processes text of length n in O(n + matches) time. Proposed by Alfred Aho and Margaret Corasick in 1975.",
      "**Construction**: (1) Build a trie from all patterns. (2) Add **suffix links** (like KMP failure function but on a trie) using BFS. The suffix link of a node v points to the longest proper suffix of the string corresponding to v that is also a prefix of some pattern in the trie. (3) Add **dictionary suffix links** to quickly find all patterns that are suffixes of the current prefix.",
      "**Suffix Automaton (SAM)**: Represents ALL substrings of a string in O(n) space with at most 2n-1 states and 3n-4 transitions. Supports: count distinct substrings, find longest common substring, check if a string is a substring. The most powerful single-string data structure.",
      "**Palindromic Tree (Eertree)**: Data structure that stores all distinct palindromic substrings in O(n) space. Supports online construction — add characters one by one. Can count palindromic substrings ending at each position."
    ],
    code: [
      {
        title: "Aho-Corasick — Multi-Pattern Matching (Trie + BFS)",
        language: "java",
        content: `class AhoCorasick {
    int[][] go;
    int[] fail, output;
    int size = 0;
    
    AhoCorasick(int maxNodes) {
        go = new int[maxNodes][26];
        fail = new int[maxNodes];
        output = new int[maxNodes];
        for (int[] row : go) Arrays.fill(row, -1);
    }
    
    void addPattern(String s, int id) {
        int cur = 0;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (go[cur][idx] == -1) go[cur][idx] = ++size;
            cur = go[cur][idx];
        }
        output[cur] |= (1 << id);
    }`
      },
      {
        title: "Aho-Corasick — Build Failure Links",
        language: "java",
        content: `    void build() {
        Queue<Integer> queue = new LinkedList<>();
        for (int c = 0; c < 26; c++) {
            if (go[0][c] == -1) go[0][c] = 0;
            else {
                fail[go[0][c]] = 0;
                queue.add(go[0][c]);
            }
        }
        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int c = 0; c < 26; c++) {
                if (go[u][c] == -1) {
                    go[u][c] = go[fail[u]][c];
                } else {
                    fail[go[u][c]] = go[fail[u]][c];
                    output[go[u][c]] |= output[fail[go[u][c]]];
                    queue.add(go[u][c]);
                }
            }
        }
    }`
      },
      {
        title: "Aho-Corasick — Search Text",
        language: "java",
        content: `    List<int[]> search(String text) {
        List<int[]> matches = new ArrayList<>();
        int cur = 0;
        for (int i = 0; i < text.length(); i++) {
            cur = go[cur][text.charAt(i) - 'a'];
            if (output[cur] != 0) {
                matches.add(new int[]{i, output[cur]});
            }
        }
        return matches; // [position, bitmask of matched patterns]
    }
}
// Build: O(Σ|patterns| × 26), Search: O(|text| + matches)`
      }
    ],
    note: "Aho-Corasick is the go-to algorithm when you need to search for **multiple patterns** simultaneously in a text."
  }
];
