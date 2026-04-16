import { ContentSection } from "../recursionContent";

// ═══════════════════════════════════════════════════════
// MATHEMATICS — EASY (CSES Problem Set)
// ═══════════════════════════════════════════════════════

export const mathEasy: ContentSection[] = [
  {
    id: "math-easy-1",
    title: "Exponentiation (CSES)",
    difficulty: "Easy",
    timeComplexity: "O(log b)",
    spaceComplexity: "O(1)",
    theory: [
      "**CSES — Exponentiation** (25566 / 27289 solves)",
      "Given `n` queries, each with integers `a` and `b`, compute `a^b mod (10^9 + 7)` for each query.",
      "**Example 1:** `Input: a=3, b=4` → `Output: 81` — because `3^4 = 81`.",
      "**Example 2:** `Input: a=2, b=10` → `Output: 1024` — because `2^10 = 1024`.",
      "**Approach:** Use binary exponentiation (fast power). Square the base and halve the exponent repeatedly, multiplying into the result when the exponent is odd. This computes `a^b mod m` in O(log b) time.",
    ],
    keyPoints: [
      "Binary exponentiation is fundamental — appears in almost every competitive programming contest",
      "Always take modulo at each multiplication step to prevent overflow",
      "Use `long` in Java since intermediate products can exceed int range",
    ],
    code: [
      {
        title: "Exponentiation — Binary Exponentiation",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class Exponentiation {
    static final long MOD = 1_000_000_007;

    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod;
            exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (n-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long a = Long.parseLong(st.nextToken());
            long b = Long.parseLong(st.nextToken());
            sb.append(power(a, b, MOD)).append("\\n");
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "math-easy-2",
    title: "Exponentiation II (CSES)",
    difficulty: "Easy",
    timeComplexity: "O(log b + log c)",
    spaceComplexity: "O(1)",
    theory: [
      "**CSES — Exponentiation II** (17930 / 21428 solves)",
      "Given `n` queries, each with integers `a`, `b`, `c`, compute `a^(b^c) mod (10^9 + 7)`.",
      "**Example 1:** `Input: a=2, b=3, c=2` → `Output: 512` — because `3^2 = 9`, then `2^9 = 512`.",
      "**Example 2:** `Input: a=3, b=7, c=1` → `Output: 2187` — because `7^1 = 7`, then `3^7 = 2187`.",
      "**Approach:** By Fermat's Little Theorem, `a^(p-1) ≡ 1 (mod p)` for prime `p`. So `a^(b^c) mod p = a^(b^c mod (p-1)) mod p`. First compute `b^c mod (p-1)`, then compute `a^(that result) mod p`.",
    ],
    keyPoints: [
      "Fermat's Little Theorem is the key: reduce the exponent modulo (p-1)",
      "Two-step power: first compute exponent mod (p-1), then compute the final answer",
      "Edge case: if a is divisible by p, result is 0",
    ],
    code: [
      {
        title: "Exponentiation II — Fermat's Little Theorem",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class ExponentiationII {
    static final long MOD = 1_000_000_007;

    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod;
            exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (n-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long a = Long.parseLong(st.nextToken());
            long b = Long.parseLong(st.nextToken());
            long c = Long.parseLong(st.nextToken());
            // By Fermat: a^(b^c) mod p = a^(b^c mod (p-1)) mod p
            long exp = power(b, c, MOD - 1);
            sb.append(power(a, exp, MOD)).append("\\n");
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "math-easy-3",
    title: "Counting Divisors (CSES)",
    difficulty: "Easy",
    timeComplexity: "O(√n)",
    spaceComplexity: "O(1)",
    theory: [
      "**CSES — Counting Divisors** (23351 / 26351 solves)",
      "Given `n` integers, for each integer `x` report the number of its divisors.",
      "**Example 1:** `Input: x = 12` → `Output: 6` — divisors are 1, 2, 3, 4, 6, 12.",
      "**Example 2:** `Input: x = 7` → `Output: 2` — divisors are 1, 7 (prime).",
      "**Approach:** For each number, iterate from 1 to √x. If `i` divides `x`, count both `i` and `x/i` (unless they are equal). This gives O(√n) per query.",
    ],
    keyPoints: [
      "Only iterate up to √n — if i divides n, then n/i also divides n",
      "Be careful not to double-count when i == n/i (perfect square case)",
      "For multiple queries with large n, factorization-based counting using prime factorization formula (product of (exponent+1)) is also viable",
    ],
    code: [
      {
        title: "Counting Divisors — √n approach",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class CountingDivisors {
    static int countDivisors(int x) {
        int count = 0;
        for (int i = 1; (long) i * i <= x; i++) {
            if (x % i == 0) {
                count++;
                if (i != x / i) count++;
            }
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        StringTokenizer st = new StringTokenizer(br.readLine());
        while (n-- > 0) {
            int x = Integer.parseInt(st.nextToken());
            sb.append(countDivisors(x)).append("\\n");
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "math-easy-4",
    title: "Common Divisors (CSES)",
    difficulty: "Easy",
    timeComplexity: "O(n√max)",
    spaceComplexity: "O(max)",
    theory: [
      "**CSES — Common Divisors** (15108 / 17505 solves)",
      "Given a list of `n` integers, find the greatest common divisor that divides at least two of them (i.e., the maximum value `d` such that at least two elements are divisible by `d`).",
      "**Example 1:** `Input: [6, 12, 15]` → `Output: 6` — 6 divides both 6 and 12.",
      "**Example 2:** `Input: [10, 15, 25]` → `Output: 5` — 5 divides all three.",
      "**Approach:** Count the frequency of each divisor across all numbers. For each number, enumerate its divisors in O(√x). Then find the largest divisor that appears in at least 2 numbers.",
    ],
    keyPoints: [
      "Enumerate divisors of each number and count how many numbers each divisor divides",
      "Answer is the largest divisor with count ≥ 2",
      "Alternative O(n·log(max)) approach: for each d from max down to 1, count how many numbers are divisible by d using a frequency array",
    ],
    code: [
      {
        title: "Common Divisors — Divisor Counting",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class CommonDivisors {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[] cnt = new int[1_000_001];
        int max = 0;
        for (int i = 0; i < n; i++) {
            int x = Integer.parseInt(st.nextToken());
            cnt[x]++;
            max = Math.max(max, x);
        }
        // For each d from max down to 1, count how many numbers are divisible by d
        for (int d = max; d >= 1; d--) {
            int total = 0;
            for (int multiple = d; multiple <= max; multiple += d) {
                total += cnt[multiple];
            }
            if (total >= 2) {
                System.out.println(d);
                return;
            }
        }
    }
}`,
      },
    ],
  },
  {
    id: "math-easy-5",
    title: "Binomial Coefficients (CSES)",
    difficulty: "Easy",
    timeComplexity: "O(n + q)",
    spaceComplexity: "O(n)",
    theory: [
      "**CSES — Binomial Coefficients** (10809 / 11979 solves)",
      "Given `q` queries, each with `a` and `b`, compute `C(a, b) mod (10^9 + 7)` — the number of ways to choose `b` items from `a`.",
      "**Example 1:** `Input: a=5, b=2` → `Output: 10` — C(5,2) = 10.",
      "**Example 2:** `Input: a=10, b=3` → `Output: 120` — C(10,3) = 120.",
      "**Approach:** Precompute factorials and inverse factorials up to the max value using Fermat's Little Theorem for modular inverse. Then `C(a,b) = a! * inv(b!) * inv((a-b)!) mod p`.",
    ],
    keyPoints: [
      "Precompute factorial array and inverse factorial array for O(1) per query",
      "Modular inverse via Fermat: inv(x) = x^(p-2) mod p for prime p",
      "If b > a, C(a,b) = 0",
    ],
    code: [
      {
        title: "Binomial Coefficients — Precomputed Factorials",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class BinomialCoefficients {
    static final long MOD = 1_000_000_007;
    static long[] fact, invFact;

    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod;
            exp >>= 1;
        }
        return result;
    }

    static void precompute(int n) {
        fact = new long[n + 1];
        invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[n] = power(fact[n], MOD - 2, MOD);
        for (int i = n - 1; i >= 0; i--) invFact[i] = invFact[i + 1] * (i + 1) % MOD;
    }

    static long nCr(int a, int b) {
        if (b < 0 || b > a) return 0;
        return fact[a] % MOD * invFact[b] % MOD * invFact[a - b] % MOD;
    }

    public static void main(String[] args) throws IOException {
        precompute(1_000_000);
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int q = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            sb.append(nCr(a, b)).append("\\n");
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// MATHEMATICS — MEDIUM (CSES Problem Set)
// ═══════════════════════════════════════════════════════

export const mathMedium: ContentSection[] = [
  {
    id: "math-medium-1",
    title: "Sum of Divisors (CSES)",
    difficulty: "Medium",
    timeComplexity: "O(√n)",
    spaceComplexity: "O(1)",
    theory: [
      "**CSES — Sum of Divisors** (8433 / 12604 solves)",
      "Given `n`, compute the sum `σ(1) + σ(2) + ... + σ(n)` modulo `10^9 + 7`, where `σ(k)` is the sum of divisors of `k`.",
      "**Example 1:** `Input: n = 4` → `Output: 15` — σ(1)=1, σ(2)=3, σ(3)=4, σ(4)=7 → 1+3+4+7 = 15.",
      "**Example 2:** `Input: n = 6` → `Output: 33`.",
      "**Approach:** Each divisor `d` contributes `d` to every multiple of `d`. So the total is `Σ d * floor(n/d)` for d=1..n. Use the standard floor-division block trick: group consecutive values of `d` that give the same `floor(n/d)` and process each block in O(1). Total blocks ≈ O(√n).",
    ],
    keyPoints: [
      "Key identity: total = Σ_{d=1}^{n} d * floor(n/d)",
      "Floor division block decomposition reduces from O(n) to O(√n)",
      "Use sum formula for arithmetic series within each block: sum(lo..hi) = (hi-lo+1)*(lo+hi)/2",
      "All arithmetic must be done modulo 10^9+7 with modular inverse for division by 2",
    ],
    code: [
      {
        title: "Sum of Divisors — Floor Block Decomposition",
        language: "java",
        content: `import java.util.*;

public class SumOfDivisors {
    static final long MOD = 1_000_000_007;
    static final long INV2 = (MOD + 1) / 2; // modular inverse of 2

    public static void main(String[] args) {
        long n = new Scanner(System.in).nextLong();
        long ans = 0;
        long d = 1;
        while (d <= n) {
            long q = n / d;           // floor(n/d)
            long dMax = n / q;        // largest d' with same floor value
            // sum of d from d to dMax
            long sumD = (dMax - d + 1) % MOD * ((d + dMax) % MOD) % MOD * INV2 % MOD;
            ans = (ans + q % MOD * sumD) % MOD;
            d = dMax + 1;
        }
        System.out.println(ans);
    }
}`,
      },
    ],
  },
  {
    id: "math-medium-2",
    title: "Prime Multiples (CSES)",
    difficulty: "Medium",
    timeComplexity: "O(2^k * k)",
    spaceComplexity: "O(k)",
    theory: [
      "**CSES — Prime Multiples** (6717 / 7834 solves)",
      "Given `n` and `k` distinct primes, count how many integers in `[1, n]` are divisible by at least one of the given primes.",
      "**Example 1:** `Input: n=20, primes=[2,5]` → `Output: 12` — multiples of 2 or 5 up to 20: {2,4,5,6,8,10,12,14,15,16,18,20}.",
      "**Example 2:** `Input: n=10, primes=[2,3]` → `Output: 7`.",
      "**Approach:** Use the Inclusion-Exclusion Principle. Iterate over all 2^k non-empty subsets of primes. For each subset, compute `floor(n / product)` and add or subtract based on subset size parity.",
    ],
    keyPoints: [
      "Inclusion-Exclusion: |A₁ ∪ A₂ ∪ ... ∪ Aₖ| = Σ|Aᵢ| - Σ|Aᵢ ∩ Aⱼ| + ...",
      "k ≤ 20, so 2^k subsets is feasible",
      "Watch for product overflow — if product exceeds n, skip that subset",
      "Use bitmask to enumerate subsets efficiently",
    ],
    code: [
      {
        title: "Prime Multiples — Inclusion-Exclusion with Bitmask",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class PrimeMultiples {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        long n = Long.parseLong(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        long[] primes = new long[k];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < k; i++) primes[i] = Long.parseLong(st.nextToken());

        long ans = 0;
        for (int mask = 1; mask < (1 << k); mask++) {
            long product = 1;
            int bits = Integer.bitCount(mask);
            boolean overflow = false;
            for (int i = 0; i < k; i++) {
                if ((mask & (1 << i)) != 0) {
                    product *= primes[i];
                    if (product > n) { overflow = true; break; }
                }
            }
            if (overflow) continue;
            if (bits % 2 == 1) ans += n / product;
            else ans -= n / product;
        }
        System.out.println(ans);
    }
}`,
      },
    ],
  },
  {
    id: "math-medium-3",
    title: "Creating Strings II (CSES)",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**CSES — Creating Strings II** (9060 / 9561 solves)",
      "Given a string of `n` characters, count the number of distinct strings that can be formed using all its characters, modulo `10^9 + 7`.",
      "**Example 1:** `Input: \"aab\"` → `Output: 3` — {aab, aba, baa}.",
      "**Example 2:** `Input: \"abc\"` → `Output: 6` — all 3! permutations are distinct.",
      "**Approach:** The answer is the multinomial coefficient: `n! / (c₁! * c₂! * ... * cₖ!)` where `cᵢ` is the frequency of each character. Use precomputed factorials and modular inverse.",
    ],
    keyPoints: [
      "Multinomial coefficient counts distinct permutations with repeated elements",
      "Precompute factorials and inverse factorials for O(1) lookups",
      "This is a direct application of combinatorics — very common in CP",
    ],
    code: [
      {
        title: "Creating Strings II — Multinomial Coefficient",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class CreatingStringsII {
    static final long MOD = 1_000_000_007;
    static long[] fact, invFact;

    static long power(long base, long exp, long mod) {
        long result = 1; base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod; exp >>= 1;
        }
        return result;
    }

    static void precompute(int n) {
        fact = new long[n + 1]; invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[n] = power(fact[n], MOD - 2, MOD);
        for (int i = n - 1; i >= 0; i--) invFact[i] = invFact[i + 1] * (i + 1) % MOD;
    }

    public static void main(String[] args) throws IOException {
        String s = new BufferedReader(new InputStreamReader(System.in)).readLine().trim();
        int n = s.length();
        precompute(n);
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        long ans = fact[n];
        for (int f : freq) {
            if (f > 0) ans = ans * invFact[f] % MOD;
        }
        System.out.println(ans);
    }
}`,
      },
    ],
  },
  {
    id: "math-medium-4",
    title: "Distributing Apples (CSES)",
    difficulty: "Medium",
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(n + m)",
    theory: [
      "**CSES — Distributing Apples** (8662 / 9310 solves)",
      "Given `n` children and `m` apples, find how many ways you can distribute the apples among the children (each child can get 0 or more), modulo `10^9 + 7`.",
      "**Example 1:** `Input: n=3, m=2` → `Output: 6` — (2,0,0), (0,2,0), (0,0,2), (1,1,0), (1,0,1), (0,1,1).",
      "**Example 2:** `Input: n=2, m=3` → `Output: 4` — (0,3), (1,2), (2,1), (3,0).",
      "**Approach:** This is the classic Stars and Bars problem. The answer is `C(n + m - 1, m)` = `C(n + m - 1, n - 1)`. Use precomputed factorials.",
    ],
    keyPoints: [
      "Stars and Bars: distributing m identical items into n distinct bins = C(n+m-1, m)",
      "One of the most fundamental combinatorics identities",
      "Precompute factorials up to n+m for efficient computation",
    ],
    code: [
      {
        title: "Distributing Apples — Stars and Bars",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class DistributingApples {
    static final long MOD = 1_000_000_007;
    static long[] fact, invFact;

    static long power(long base, long exp, long mod) {
        long result = 1; base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod; exp >>= 1;
        }
        return result;
    }

    static void precompute(int n) {
        fact = new long[n + 1]; invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[n] = power(fact[n], MOD - 2, MOD);
        for (int i = n - 1; i >= 0; i--) invFact[i] = invFact[i + 1] * (i + 1) % MOD;
    }

    static long nCr(int a, int b) {
        if (b < 0 || b > a) return 0;
        return fact[a] % MOD * invFact[b] % MOD * invFact[a - b] % MOD;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        precompute(n + m);
        System.out.println(nCr(n + m - 1, m));
    }
}`,
      },
    ],
  },
  {
    id: "math-medium-5",
    title: "Christmas Party (CSES)",
    difficulty: "Medium",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    theory: [
      "**CSES — Christmas Party** (7049 / 7552 solves)",
      "There are `n` people at a Christmas party. Each person brings a gift. Find the number of ways to distribute gifts so that **no one receives their own gift** (a derangement), modulo `10^9 + 7`.",
      "**Example 1:** `Input: n=2` → `Output: 1` — only (2,1).",
      "**Example 2:** `Input: n=3` → `Output: 2` — (2,3,1) and (3,1,2).",
      "**Approach:** Use the derangement recurrence: `D(n) = (n-1) * (D(n-1) + D(n-2))` with `D(1) = 0, D(2) = 1`. Alternatively, use the inclusion-exclusion formula.",
    ],
    keyPoints: [
      "Derangement = permutation with no fixed points",
      "Recurrence: D(n) = (n-1) * (D(n-1) + D(n-2))",
      "Also expressible as D(n) = n! * Σ(-1)^k / k! for k=0..n via inclusion-exclusion",
      "Very classic combinatorics problem in competitive programming",
    ],
    code: [
      {
        title: "Christmas Party — Derangement",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class ChristmasParty {
    static final long MOD = 1_000_000_007;

    public static void main(String[] args) throws IOException {
        int n = Integer.parseInt(new BufferedReader(new InputStreamReader(System.in)).readLine().trim());
        if (n == 1) { System.out.println(0); return; }
        long[] d = new long[n + 1];
        d[1] = 0; d[2] = 1;
        for (int i = 3; i <= n; i++) {
            d[i] = (i - 1) % MOD * ((d[i - 1] + d[i - 2]) % MOD) % MOD;
        }
        System.out.println(d[n]);
    }
}`,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// MATHEMATICS — HARD (CSES Problem Set)
// ═══════════════════════════════════════════════════════

export const mathHard: ContentSection[] = [
  {
    id: "math-hard-1",
    title: "Josephus Queries (CSES)",
    difficulty: "Hard",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(log n)",
    theory: [
      "**CSES — Josephus Queries** (5042 / 6352 solves)",
      "There are `n` children in a circle numbered 1 to n. Every second child is removed, going clockwise. Given `q` queries, each asks: what is the `k`-th child to be removed?",
      "**Example 1:** `Input: n=7, k=1` → `Output: 2` — first removed is child 2.",
      "**Example 2:** `Input: n=7, k=3` → `Output: 6` — removal order: 2, 4, 6, ...",
      "**Approach:** Use recursive simulation. In the first pass, every 2nd person is removed. If `k` falls in the first half (removed in first pass), the answer is `2k`. Otherwise, recurse on the remaining people. Handle even/odd `n` carefully.",
    ],
    keyPoints: [
      "Classic Josephus problem variant — find the k-th eliminated, not the survivor",
      "Recursive reduction: after removing ⌊n/2⌋ people, remap positions",
      "O(log n) recursion depth since n halves each step",
      "Careful indexing: distinguish between even and odd n for position mapping",
    ],
    code: [
      {
        title: "Josephus Queries — Recursive Simulation",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class JosephusQueries {

    static long solve(long n, long k) {
        if (n == 1) return 1;
        // First round removes floor(n/2) people at positions 2, 4, 6, ...
        if (k <= n / 2) {
            // k-th removed is in the first round
            return 2 * k;
        }
        // After first round, n - n/2 people remain
        // Remap: need (k - n/2)-th removal from remaining
        long res = solve(n - n / 2, k - n / 2);
        // Map result back: remaining people were at odd positions 1, 3, 5, ...
        // but the circle continued from where it stopped
        // After removing 2,4,...,2*floor(n/2), next position depends on n parity
        if (n % 2 == 1) {
            // Last removed was position n-1 (even), circle continues from n+1 = 1
            // Remaining: 1, 3, 5, ..., n — map res-th to 2*res - 1
            // But circle continued from position 1, so first remaining encountered is 1
            return 2 * res + 1;
        } else {
            // Last removed was position n (even), circle continues from 1
            // Remaining: 1, 3, 5, ..., n-1
            return 2 * res - 1;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int q = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long n = Long.parseLong(st.nextToken());
            long k = Long.parseLong(st.nextToken());
            sb.append(solve(n, k)).append("\\n");
        }
        System.out.print(sb);
    }
}`,
      },
    ],
  },
  {
    id: "math-hard-2",
    title: "Divisor Analysis (CSES)",
    difficulty: "Hard",
    timeComplexity: "O(k log max_exp)",
    spaceComplexity: "O(k)",
    theory: [
      "**CSES — Divisor Analysis** (5796 / 7760 solves)",
      "Given the prime factorization of a number `n = p1^a1 * p2^a2 * ... * pk^ak`, compute: (1) the number of divisors, (2) the sum of divisors, and (3) the product of divisors, all modulo `10^9 + 7`.",
      "**Example 1:** `Input: n = 12 = 2^2 * 3^1` → `Output: 6 28 1728` — 6 divisors, sum=28, product=1728.",
      "**Example 2:** `Input: n = 8 = 2^3` → `Output: 4 15 4096`.",
      "**Approach:** Number of divisors = `Π(aᵢ + 1)`. Sum of divisors = `Π(pᵢ^(aᵢ+1) - 1) / (pᵢ - 1)`. Product of divisors = `n^(d(n)/2)` where `d(n)` is the divisor count. Handle the division by 2 in the exponent carefully using modular arithmetic.",
    ],
    keyPoints: [
      "Three classical divisor functions computed from prime factorization",
      "Sum of divisors uses geometric series formula for each prime",
      "Product of divisors requires computing n^(d/2) — handle even/odd d carefully",
      "Need modular inverse for geometric series denominator (p-1)",
    ],
    code: [
      {
        title: "Divisor Analysis — Three Divisor Functions",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class DivisorAnalysis {
    static final long MOD = 1_000_000_007;

    static long power(long base, long exp, long mod) {
        long result = 1; base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod; exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int k = Integer.parseInt(br.readLine().trim());
        long[] p = new long[k], a = new long[k];
        for (int i = 0; i < k; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            p[i] = Long.parseLong(st.nextToken());
            a[i] = Long.parseLong(st.nextToken());
        }

        // 1. Number of divisors: product of (a_i + 1)
        long numDiv = 1;
        for (int i = 0; i < k; i++) numDiv = numDiv % MOD * ((a[i] + 1) % MOD) % MOD;

        // 2. Sum of divisors: product of (p^(a+1) - 1) / (p - 1)
        long sumDiv = 1;
        for (int i = 0; i < k; i++) {
            if (p[i] % MOD == 1) {
                sumDiv = sumDiv * ((a[i] + 1) % MOD) % MOD;
            } else {
                long num = (power(p[i], a[i] + 1, MOD) - 1 + MOD) % MOD;
                long den = power(p[i] - 1, MOD - 2, MOD);
                sumDiv = sumDiv * num % MOD * den % MOD;
            }
        }

        // 3. Product of divisors: n^(d/2)
        // Each prime p_i^a_i contributes p_i^(a_i * d / (a_i + 1) * (a_i + 1) / 2)
        // = p_i^(a_i * numDiv / 2)
        // Compute exponent modulo (MOD - 1) by Fermat
        long prodDiv = 1;
        // We need numDiv / 2 as exponent (mod MOD-1)
        // Compute numDiv over (MOD-1) carefully
        // For each prime, exponent = a_i * (product of (a_j+1) for j!=i) * (a_i+1) / (2*(a_i+1))
        // Simpler: exponent for p_i = a_i/2 * product of (a_j+1) for all j
        // But a_i/2 is tricky. Use: for each p_i, exp = a_i * numDiv_mod / 2
        // where numDiv_mod is numDiv computed mod 2*(MOD-1)
        long M2 = 2 * (MOD - 1);
        long numDivM2 = 1;
        for (int i = 0; i < k; i++) numDivM2 = numDivM2 * ((a[i] + 1) % M2) % M2;
        for (int i = 0; i < k; i++) {
            long exp = a[i] % M2 * numDivM2 % M2;
            // divide by (a_i + 1) then by 2... 
            // Actually simpler approach: exp for p_i = a_i * D / 2
            // where D = numDiv = prod(a_j + 1)
            // Compute a_i * D mod 2*(MOD-1), then divide by 2
        }
        // Cleaner approach for product of divisors:
        prodDiv = 1;
        for (int i = 0; i < k; i++) {
            // For prime p_i with exponent a_i:
            // Contribution = p_i^(a_i * numDiv / 2)
            // numDiv / 2 needs careful handling
            // Compute numDiv without factor (a_i+1), call it rest
            // Then exponent = a_i * rest * (a_i + 1) / 2
            // = rest * a_i * (a_i + 1) / 2
            long rest = 1;
            for (int j = 0; j < k; j++) {
                if (j != i) rest = rest % M2 * ((a[j] + 1) % M2) % M2;
            }
            // exp = rest * a_i * (a_i + 1) / 2 mod (MOD - 1)
            long exp = rest % M2 * (a[i] % M2) % M2 * ((a[i] + 1) % M2) % M2;
            exp /= 2; // guaranteed even since a*(a+1) is always even
            exp %= (MOD - 1);
            prodDiv = prodDiv * power(p[i], exp, MOD) % MOD;
        }

        System.out.println(numDiv + " " + sumDiv + " " + prodDiv);
    }
}`,
      },
    ],
  },
  {
    id: "math-hard-3",
    title: "Counting Coprime Pairs (CSES)",
    difficulty: "Hard",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(max_val)",
    theory: [
      "**CSES — Counting Coprime Pairs** (4416 / 5128 solves)",
      "Given an array of `n` positive integers, count the number of pairs `(i, j)` with `i < j` such that `gcd(a[i], a[j]) = 1`.",
      "**Example 1:** `Input: [2, 3, 4]` → `Output: 2` — pairs (2,3) and (3,4) are coprime.",
      "**Example 2:** `Input: [6, 10, 15]` → `Output: 0` — no coprime pairs.",
      "**Approach:** Use Möbius function and inclusion-exclusion. For each divisor `d`, count how many numbers are divisible by `d` (call it `c[d]`). Then coprime pairs = Σ μ(d) * C(c[d], 2) for all d ≥ 1. Precompute Möbius function using a sieve.",
    ],
    keyPoints: [
      "Möbius inversion is the standard technique for coprimality counting",
      "μ(d) = 0 if d has a squared prime factor, else (-1)^k where k = number of prime factors",
      "Precompute μ via linear sieve, then compute frequency of each divisor",
      "O(n log n) via harmonic series summation for divisor frequencies",
    ],
    code: [
      {
        title: "Counting Coprime Pairs — Möbius Function",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class CountingCoprimePairs {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[] a = new int[n];
        int maxVal = 0;
        for (int i = 0; i < n; i++) {
            a[i] = Integer.parseInt(st.nextToken());
            maxVal = Math.max(maxVal, a[i]);
        }

        // Count frequency of each value
        int[] freq = new int[maxVal + 1];
        for (int x : a) freq[x]++;

        // c[d] = count of numbers divisible by d
        long[] c = new long[maxVal + 1];
        for (int d = 1; d <= maxVal; d++) {
            for (int m = d; m <= maxVal; m += d) {
                c[d] += freq[m];
            }
        }

        // Compute Mobius function
        int[] mu = new int[maxVal + 1];
        mu[1] = 1;
        int[] minPrime = new int[maxVal + 1];
        for (int i = 2; i <= maxVal; i++) {
            if (minPrime[i] == 0) { // i is prime
                for (int j = i; j <= maxVal; j += i) {
                    if (minPrime[j] == 0) minPrime[j] = i;
                }
            }
        }
        for (int i = 2; i <= maxVal; i++) {
            int p = minPrime[i];
            if ((i / p) % p == 0) mu[i] = 0;
            else mu[i] = -mu[i / p];
        }

        // Answer = sum of mu[d] * C(c[d], 2)
        long ans = 0;
        for (int d = 1; d <= maxVal; d++) {
            if (mu[d] != 0) {
                ans += mu[d] * c[d] * (c[d] - 1) / 2;
            }
        }
        System.out.println(ans);
    }
}`,
      },
    ],
  },
  {
    id: "math-hard-4",
    title: "Next Prime (CSES)",
    difficulty: "Hard",
    timeComplexity: "O(√n · log n)",
    spaceComplexity: "O(1)",
    theory: [
      "**CSES — Next Prime** (1934 / 2225 solves)",
      "Given an integer `n`, find the smallest prime that is greater than or equal to `n`.",
      "**Example 1:** `Input: 7` → `Output: 7` — 7 is already prime.",
      "**Example 2:** `Input: 14` → `Output: 17` — 14, 15, 16 are not prime; 17 is.",
      "**Approach:** Starting from `n`, check each number for primality using trial division up to √n or Miller-Rabin for large values. By Bertrand's postulate, a prime always exists between n and 2n, so the search is bounded.",
    ],
    keyPoints: [
      "Miller-Rabin primality test gives deterministic results for n < 3.317×10^24 with specific witness bases",
      "For n up to 10^18, witnesses {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37} suffice",
      "Prime gaps are small relative to n — average gap near n is about ln(n)",
      "Use 128-bit multiplication (or BigInteger in Java) to avoid overflow in modular multiplication",
    ],
    code: [
      {
        title: "Next Prime — Miller-Rabin",
        language: "java",
        content: `import java.util.*;
import java.math.BigInteger;
import java.io.*;

public class NextPrime {
    static final long[] WITNESSES = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};

    static long mulMod(long a, long b, long mod) {
        return BigInteger.valueOf(a).multiply(BigInteger.valueOf(b)).mod(BigInteger.valueOf(mod)).longValue();
    }

    static long powMod(long base, long exp, long mod) {
        long result = 1; base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = mulMod(result, base, mod);
            base = mulMod(base, base, mod); exp >>= 1;
        }
        return result;
    }

    static boolean isPrime(long n) {
        if (n < 2) return false;
        if (n < 4) return true;
        if (n % 2 == 0) return false;
        long d = n - 1; int r = 0;
        while (d % 2 == 0) { d /= 2; r++; }
        for (long a : WITNESSES) {
            if (a >= n) continue;
            long x = powMod(a, d, n);
            if (x == 1 || x == n - 1) continue;
            boolean composite = true;
            for (int i = 0; i < r - 1; i++) {
                x = mulMod(x, x, n);
                if (x == n - 1) { composite = false; break; }
            }
            if (composite) return false;
        }
        return true;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        long n = Long.parseLong(br.readLine().trim());
        while (!isPrime(n)) n++;
        System.out.println(n);
    }
}`,
      },
    ],
  },
  {
    id: "math-hard-5",
    title: "Permutation Order (CSES)",
    difficulty: "Hard",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(n)",
    theory: [
      "**CSES — Permutation Order** (932 / 952 solves)",
      "Given `n`, you need to handle two types of queries: (1) Given a rank `k`, find the k-th lexicographically smallest permutation of [1..n]. (2) Given a permutation, find its rank.",
      "**Example 1:** `Input: n=3, k=3` → `Output: 2 1 3` (the 3rd permutation of {1,2,3} in lex order: 1 2 3, 1 3 2, 2 1 3).",
      "**Example 2:** `Input: n=3, perm=[3,1,2]` → `Output: 5`.",
      "**Approach:** Use the factorial number system (Lehmer code). To find the k-th permutation: for each position, determine which unused element goes there by dividing k-1 by (n-i-1)!. To find rank: for each position, count how many unused elements are smaller.",
    ],
    keyPoints: [
      "Factorial number system (Lehmer code) bijection between permutations and integers",
      "k-th permutation: greedily assign digits using factorials",
      "Rank of permutation: count inversions against unused elements",
      "Can be optimized with a Fenwick tree for O(n log n) but O(n²) suffices for small n",
    ],
    code: [
      {
        title: "Permutation Order — Factorial Number System",
        language: "java",
        content: `import java.util.*;
import java.io.*;

public class PermutationOrder {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int type = Integer.parseInt(st.nextToken());

        // Precompute factorials (may overflow for large n, use BigInteger if needed)
        long[] fact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;

        if (type == 1) {
            // Given rank k, find k-th permutation
            long k = Long.parseLong(br.readLine().trim()) - 1; // 0-indexed
            List<Integer> available = new ArrayList<>();
            for (int i = 1; i <= n; i++) available.add(i);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                long f = fact[n - 1 - i];
                int idx = (int)(k / f);
                sb.append(available.get(idx));
                if (i < n - 1) sb.append(' ');
                available.remove(idx);
                k %= f;
            }
            System.out.println(sb);
        } else {
            // Given permutation, find its rank
            st = new StringTokenizer(br.readLine());
            int[] perm = new int[n];
            for (int i = 0; i < n; i++) perm[i] = Integer.parseInt(st.nextToken());
            List<Integer> available = new ArrayList<>();
            for (int i = 1; i <= n; i++) available.add(i);
            long rank = 0;
            for (int i = 0; i < n; i++) {
                int idx = available.indexOf(perm[i]);
                rank += idx * fact[n - 1 - i];
                available.remove(idx);
            }
            System.out.println(rank + 1); // 1-indexed
        }
    }
}`,
      },
    ],
  },
];
