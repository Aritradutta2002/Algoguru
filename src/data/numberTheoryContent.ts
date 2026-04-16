import { ContentSection } from "./recursionContent";

export const numberTheoryContent: ContentSection[] = [
  {
    id: "nt-primes",
    title: "Prime Numbers & Primality Testing",
    difficulty: "Easy",
    theory: [
      "A **prime number** is a natural number greater than 1 that has no positive divisors other than 1 and itself.",
      "**Trial division**: check divisibility up to √n — if no divisor found, n is prime. Optimization: after checking 2 and 3, only check numbers of the form 6k±1 (all primes > 3 have this form).",
      "**Fundamental theorem of arithmetic**: every integer > 1 is either prime or can be uniquely represented as a product of primes (up to order). This is the basis of many number theory algorithms.",
      "**Prime counting**: The number of primes ≤ n is approximately n/ln(n) (Prime Number Theorem). For n = 10⁶, there are ~78,498 primes. For n = 10⁹, there are ~50,847,534 primes.",
      "**Fermat's primality test**: If p is prime and gcd(a,p) = 1, then a^(p-1) ≡ 1 (mod p). The converse is not always true — Carmichael numbers (e.g., 561) pass this test but aren't prime. Use **Miller-Rabin** for deterministic testing."
    ],
    code: [
      {
        title: "Primality Check — O(√n)",
        language: "java",
        content: `static boolean isPrime(long n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}`
      },
      {
        title: "Prime Factorization — O(√n)",
        language: "java",
        content: `static List<long[]> primeFactors(long n) {
    List<long[]> factors = new ArrayList<>(); // [prime, exponent]
    for (long p = 2; p * p <= n; p++) {
        int exp = 0;
        while (n % p == 0) { n /= p; exp++; }
        if (exp > 0) factors.add(new long[]{p, exp});
    }
    if (n > 1) factors.add(new long[]{n, 1});
    return factors;
}`
      },
      {
        title: "Count Divisors from Prime Factorization",
        language: "java",
        content: `static long countDivisors(long n) {
    long count = 1;
    for (long p = 2; p * p <= n; p++) {
        int exp = 0;
        while (n % p == 0) { n /= p; exp++; }
        count *= (exp + 1); // Each prime contributes (exp+1) choices
    }
    if (n > 1) count *= 2;
    return count;
}`
      }
    ]
  },
  {
    id: "nt-sieve",
    title: "Sieve of Eratosthenes",
    difficulty: "Easy",
    theory: [
      "The **Sieve of Eratosthenes** finds all primes up to n in O(n·log(log n)) time. The inner sum of operations is Σ(n/p) for primes p ≤ √n, which equals n·log(log n) by Mertens' theorem.",
      "**Optimization**: Start marking from p² (smaller multiples already marked by smaller primes). Only iterate over odd numbers after handling 2 separately — halves memory and time constant.",
      "**Smallest Prime Factor (SPF) sieve**: Instead of boolean, store the smallest prime factor of each number. This enables O(log n) factorization of any number ≤ n by repeatedly dividing by spf[x].",
      "**Segmented sieve** for ranges [L, R]: When R is large (up to 10¹²) but R-L is small (up to 10⁶), sieve primes up to √R first, then mark composites in [L, R] using those primes. Memory: O(√R + (R-L)).",
      "**Linear sieve** O(n): Each composite is marked exactly once by its smallest prime factor. Additionally produces the list of primes. The key: for each i, iterate primes p ≤ spf[i] and mark i·p. This ensures each composite i·p is marked only when p = spf(i·p)."
    ],
    code: [
      {
        title: "Basic Sieve of Eratosthenes",
        language: "java",
        content: `static boolean[] sieve(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;
    
    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }
    return isPrime;
}
// Time: O(n·log(log n)), Space: O(n)`
      },
      {
        title: "Smallest Prime Factor (SPF) Sieve",
        language: "java",
        content: `static int[] spfSieve(int n) {
    int[] spf = new int[n + 1];
    for (int i = 0; i <= n; i++) spf[i] = i;
    
    for (int i = 2; i * i <= n; i++) {
        if (spf[i] == i) { // i is prime
            for (int j = i * i; j <= n; j += i) {
                if (spf[j] == j) spf[j] = i;
            }
        }
    }
    return spf;
}`
      },
      {
        title: "Fast Factorization using SPF",
        language: "java",
        content: `// After building SPF sieve, factorize any number ≤ n in O(log n)
static List<Integer> factorize(int x, int[] spf) {
    List<Integer> factors = new ArrayList<>();
    while (x > 1) {
        factors.add(spf[x]);
        x /= spf[x];
    }
    return factors;
}
// Example: factorize(60) → [2, 2, 3, 5]`
      },
      {
        title: "Segmented Sieve — Primes in [L, R]",
        language: "java",
        content: `static List<Long> segmentedSieve(long L, long R) {
    int limit = (int) Math.sqrt(R) + 1;
    boolean[] smallPrime = new boolean[limit + 1];
    Arrays.fill(smallPrime, true);
    for (int i = 2; i * i <= limit; i++)
        if (smallPrime[i])
            for (int j = i * i; j <= limit; j += i)
                smallPrime[j] = false;
    
    boolean[] isPrime = new boolean[(int)(R - L + 1)];
    Arrays.fill(isPrime, true);
    
    for (long i = 2; i <= limit; i++) {
        if (!smallPrime[(int)i]) continue;
        long start = Math.max(i * i, ((L + i - 1) / i) * i);
        for (long j = start; j <= R; j += i)
            isPrime[(int)(j - L)] = false;
    }
    
    List<Long> primes = new ArrayList<>();
    for (long i = Math.max(2, L); i <= R; i++)
        if (isPrime[(int)(i - L)]) primes.add(i);
    return primes;
}`
      }
    ]
  },
  {
    id: "nt-gcd",
    title: "GCD, LCM & Extended Euclidean",
    difficulty: "Easy",
    theory: [
      "**GCD** (Greatest Common Divisor): largest number dividing both a and b. **Euclidean algorithm**: gcd(a,b) = gcd(b, a%b). Terminates when b=0, returning a. The number of steps is at most 2·log₂(min(a,b)) — each step reduces the larger number by at least half.",
      "**LCM** = (a × b) / gcd(a, b). Always divide first to avoid overflow: `a / gcd(a,b) * b`. For multiple values: lcm(a,b,c) = lcm(lcm(a,b), c).",
      "**Extended GCD** finds x, y such that a·x + b·y = gcd(a, b). The solution exists by **Bézout's identity**. Found by back-substituting the Euclidean algorithm steps. Used for: modular inverse (a·x ≡ 1 mod m → solve a·x + m·y = 1), solving linear Diophantine equations (a·x + b·y = c has solutions iff gcd(a,b) | c).",
      "**Diophantine equation** a·x + b·y = c: has integer solutions iff g = gcd(a,b) divides c. One solution: (x₀·c/g, y₀·c/g) where a·x₀ + b·y₀ = g. General solution: x = x₀ + k·(b/g), y = y₀ - k·(a/g) for any integer k."
    ],
    code: [
      {
        title: "GCD — Euclidean Algorithm",
        language: "java",
        content: `static long gcd(long a, long b) {
    while (b != 0) {
        long t = b;
        b = a % b;
        a = t;
    }
    return a;
}
// Time: O(log(min(a,b)))`
      },
      {
        title: "LCM — Safe from Overflow",
        language: "java",
        content: `static long lcm(long a, long b) {
    return a / gcd(a, b) * b; // Divide first to avoid overflow
}`
      },
      {
        title: "Extended Euclidean Algorithm",
        language: "java",
        content: `// Returns gcd, and sets x[0], y[0] such that a*x + b*y = gcd
static long extGcd(long a, long b, long[] x, long[] y) {
    if (b == 0) {
        x[0] = 1; y[0] = 0;
        return a;
    }
    long[] x1 = {0}, y1 = {0};
    long g = extGcd(b, a % b, x1, y1);
    x[0] = y1[0];
    y[0] = x1[0] - (a / b) * y1[0];
    return g;
}`
      }
    ]
  },
  {
    id: "nt-binexp",
    title: "Binary Exponentiation",
    difficulty: "Medium",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    theory: [
      "**Binary Exponentiation** (also called exponentiation by squaring) computes `a^n` using only **O(log n)** multiplications instead of O(n) with the naive approach.",
      "The key idea: split the exponent using its **binary representation**. For example: `3^(13) = 3^(1101₂) = 3^8 · 3^4 · 3^1`.",
      "Since n has ⌊log₂n⌋ + 1 binary digits, we only need O(log n) multiplications if we know `a^1, a^2, a^4, a^8, ...` — each is just the **square of the previous**.",
      "**Recursive formulation**: a^n = 1 if n=0; (a^(n/2))^2 if n is even; (a^((n-1)/2))^2 · a if n is odd.",
      "Works with any **associative** operation: modular multiplication, matrix multiplication, permutation composition, and more.",
      "Example: a^(13) = a^(8+4+1) = a^8 · a^4 · a^1. We compute a^1 → a^2 → a^4 → a^8 by repeated squaring, then multiply only those where the corresponding bit is set."
    ],
    keyPoints: [
      "Reduces O(n) multiplications to O(log n) — crucial for large exponents",
      "The iterative version is faster in practice (no recursion overhead)",
      "For modular exponentiation, take mod at every multiplication step to prevent overflow",
      "Applies to any associative operation: matrix power, permutation power, polynomial power",
      "Used in: modular inverse (Fermat's theorem), Fibonacci via matrix exponentiation, RSA encryption",
      "In Java, use `long` type and take `% mod` after each multiply to avoid overflow"
    ],
    code: [
      {
        title: "Binary Exponentiation — Recursive",
        language: "java",
        content: `// Computes a^b using O(log b) multiplications
static long binpow(long a, long b) {
    if (b == 0) return 1;
    long half = binpow(a, b / 2);
    if (b % 2 == 1)
        return half * half * a;
    else
        return half * half;
}`
      },
      {
        title: "Binary Exponentiation — Iterative (Preferred)",
        language: "java",
        content: `// Iterative version — no recursion overhead
static long binpow(long a, long b) {
    long res = 1;
    while (b > 0) {
        if ((b & 1) == 1)  // If current bit is set
            res = res * a;
        a = a * a;          // Square the base
        b >>= 1;            // Move to next bit
    }
    return res;
}
// Example: binpow(3, 13)
// b=13(1101): res*=3, a=9  | b=6(110): a=81  | b=3(11): res*=81, a=6561  | b=1(1): res*=6561
// Result: 3 * 81 * 6561 = 1594323 ✓`
      },
      {
        title: "Modular Exponentiation — a^b mod m",
        language: "java",
        content: `// Most common variant in CP — compute a^b mod m
static long binpow(long a, long b, long m) {
    a %= m;
    long res = 1;
    while (b > 0) {
        if ((b & 1) == 1)
            res = res * a % m;
        a = a * a % m;
        b >>= 1;
    }
    return res;
}
// Usage: binpow(2, 1000000000, 1_000_000_007)
// Computes 2^(10^9) mod 10^9+7 instantly`
      },
      {
        title: "Application — Modular Inverse using Fermat's Theorem",
        language: "java",
        content: `// When m is prime: a^(-1) ≡ a^(m-2) (mod m)
static final long MOD = 1_000_000_007;

static long modInverse(long a) {
    return binpow(a, MOD - 2, MOD);
}

// Modular division: (a / b) mod m = a * b^(-1) mod m
static long modDivide(long a, long b) {
    return a % MOD * modInverse(b) % MOD;
}`
      },
      {
        title: "Application — Fibonacci in O(log n) via Matrix Exponentiation",
        language: "java",
        content: `// Matrix form: |F(n+1)| = |1 1|^n * |F(1)| = |1 1|^n * |1|
//              |F(n)  |   |1 0|    |F(0)|   |1 0|    |0|
static long fibonacci(long n, long mod) {
    if (n <= 1) return n;
    long[][] M = {{1, 1}, {1, 0}};
    long[][] result = matPow(M, n - 1, mod);
    return result[0][0];
}

static long[][] matMul(long[][] A, long[][] B, long mod) {
    int n = A.length;
    long[][] C = new long[n][n];
    for (int i = 0; i < n; i++)
        for (int k = 0; k < n; k++)
            if (A[i][k] != 0)
                for (int j = 0; j < n; j++)
                    C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % mod;
    return C;
}

static long[][] matPow(long[][] M, long p, long mod) {
    int n = M.length;
    long[][] res = new long[n][n];
    for (int i = 0; i < n; i++) res[i][i] = 1; // Identity
    while (p > 0) {
        if ((p & 1) == 1) res = matMul(res, M, mod);
        M = matMul(M, M, mod);
        p >>= 1;
    }
    return res;
}
// fibonacci(10^18, 10^9+7) computes instantly!`
      },
      {
        title: "Application — Applying a Permutation K Times",
        language: "java",
        content: `// Given a permutation P, apply it K times to a sequence
// Uses binary exponentiation on permutation composition
static int[] applyPermutation(int[] seq, int[] perm) {
    int[] result = new int[seq.length];
    for (int i = 0; i < seq.length; i++)
        result[i] = seq[perm[i]];
    return result;
}

static int[] permuteKTimes(int[] seq, int[] perm, long k) {
    while (k > 0) {
        if ((k & 1) == 1)
            seq = applyPermutation(seq, perm);
        // Compose permutation with itself
        perm = applyPermutation(perm, perm);
        k >>= 1;
    }
    return seq;
}
// Time: O(n · log k)`
      },
      {
        title: "Application — Number of Paths of Length K in a Graph",
        language: "java",
        content: `// Given adjacency matrix adj of a directed graph,
// adj^k[i][j] = number of paths of length k from i to j
static long[][] countPaths(int[][] adj, long k, long mod) {
    int n = adj.length;
    long[][] M = new long[n][n];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            M[i][j] = adj[i][j];
    return matPow(M, k, mod);
}
// Time: O(n^3 · log k)`
      }
    ],
    table: {
      headers: ["Application", "Operation", "Complexity"],
      rows: [
        ["a^n mod m", "Modular multiply", "O(log n)"],
        ["Modular inverse (prime m)", "a^(m-2) mod m", "O(log m)"],
        ["Fibonacci F(n)", "2×2 matrix power", "O(log n)"],
        ["Permutation^k", "Permutation composition", "O(n·log k)"],
        ["Graph paths of length k", "Adjacency matrix power", "O(n³·log k)"],
        ["Linear recurrence", "k×k matrix power", "O(k³·log n)"],
      ]
    },
    note: "For very large values where a*a may overflow `long`, use BigInteger or a `mulMod` helper that splits multiplication into additions."
  },
  {
    id: "nt-modular",
    title: "Modular Arithmetic",
    difficulty: "Medium",
    theory: [
      "In CP, results are often asked **modulo 10⁹+7** (a prime). This prime is chosen because: (1) it fits in 32-bit int, (2) two such values fit in 64-bit long when multiplied, (3) being prime means every non-zero element has a modular inverse.",
      "**Key rules**: (a+b) % m = ((a%m) + (b%m)) % m. Same for multiplication. Subtraction: (a-b) % m = ((a%m) - (b%m) + m) % m (add m to handle negatives). **Division is NOT direct** — use modular inverse instead.",
      "**Modular inverse**: a⁻¹ mod m exists iff gcd(a,m) = 1. Two methods: (1) If m is prime: a⁻¹ = a^(m-2) mod m (Fermat's little theorem). (2) For any m with gcd(a,m)=1: use Extended Euclidean algorithm to find x where a·x + m·y = 1, then x mod m is the inverse.",
      "**Modular division**: (a/b) mod m = (a × b⁻¹) mod m. Never do integer division first and then take mod — this gives wrong answers. Always multiply by the modular inverse.",
      "**Precomputing inverse factorials**: Compute fact[n] = n! mod m, then invFact[n] = modInverse(fact[n]), then invFact[i] = invFact[i+1] × (i+1) mod m going backwards. This gives O(n) preprocessing for O(1) nCr queries."
    ],
    code: [
      {
        title: "Modular Exponentiation — Binary Exponentiation",
        language: "java",
        content: `static long power(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1)
            result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}
// Time: O(log exp)`
      },
      {
        title: "Modular Inverse — Fermat's Little Theorem",
        language: "java",
        content: `static final long MOD = 1_000_000_007;

// Works only when MOD is prime
static long modInverse(long a, long mod) {
    return power(a, mod - 2, mod);
}

// Modular division
static long modDivide(long a, long b, long mod) {
    return a % mod * modInverse(b, mod) % mod;
}`
      },
      {
        title: "Modular Inverse using Extended GCD",
        language: "java",
        content: `// Works for any modulus where gcd(a, mod) = 1
static long modInverseExtGcd(long a, long mod) {
    long[] x = {0}, y = {0};
    long g = extGcd(a, mod, x, y);
    if (g != 1) return -1; // Inverse doesn't exist
    return (x[0] % mod + mod) % mod;
}`
      }
    ],
    tip: "Always use `long` in Java for modular arithmetic to avoid overflow during multiplication."
  },
  {
    id: "nt-nCr",
    title: "Combinatorics — nCr mod p",
    difficulty: "Medium",
    theory: [
      "**nCr (Binomial Coefficient)** = n! / (r! × (n-r)!). Computed modulo prime p using precomputed factorials and inverse factorials.",
      "**Pascal's Triangle**: nCr = (n-1)C(r-1) + (n-1)Cr. Good for small n.",
      "**Lucas' Theorem**: For prime p, nCr mod p can be computed digit by digit in base p."
    ],
    code: [
      {
        title: "Precompute Factorials & Inverse Factorials",
        language: "java",
        content: `static final long MOD = 1_000_000_007;
static long[] fact, invFact;

static void precompute(int n) {
    fact = new long[n + 1];
    invFact = new long[n + 1];
    fact[0] = 1;
    for (int i = 1; i <= n; i++)
        fact[i] = fact[i - 1] * i % MOD;
    invFact[n] = power(fact[n], MOD - 2, MOD);
    for (int i = n - 1; i >= 0; i--)
        invFact[i] = invFact[i + 1] * (i + 1) % MOD;
}`
      },
      {
        title: "nCr mod p — O(1) per query",
        language: "java",
        content: `static long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] % MOD * invFact[r] % MOD * invFact[n - r] % MOD;
}

// Usage:
// precompute(200000);
// long answer = nCr(10, 3); // 120`
      },
      {
        title: "nCr using Pascal's Triangle — O(n²)",
        language: "java",
        content: `static long[][] pascalTriangle(int n) {
    long[][] C = new long[n + 1][n + 1];
    for (int i = 0; i <= n; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++)
            C[i][j] = (C[i-1][j-1] + C[i-1][j]) % MOD;
    }
    return C;
}`
      }
    ]
  },
  {
    id: "nt-euler",
    title: "Euler's Totient Function",
    difficulty: "Medium",
    theory: [
      "**Euler's Totient φ(n)** counts integers from 1 to n that are coprime with n. For prime p: φ(p) = p-1. For prime power: φ(p^k) = p^k - p^(k-1). For general n: φ(n) = n × Π(1 - 1/p) for each prime factor p of n.",
      "φ is **multiplicative**: if gcd(a,b) = 1, then φ(a·b) = φ(a)·φ(b). This allows efficient computation from prime factorization.",
      "**Euler's Theorem**: a^φ(n) ≡ 1 (mod n) when gcd(a,n) = 1. This generalizes Fermat's little theorem (where n is prime, φ(n) = n-1). Used for computing a^b mod n when b is very large: a^b ≡ a^(b mod φ(n)) mod n.",
      "**Divisor sum property**: Σ φ(d) for all d dividing n equals n. This identity is useful in Möbius inversion and counting problems.",
      "**Sieve-based computation**: Compute φ for all values 1..n in O(n·log(log n)) — similar to Sieve of Eratosthenes. For each prime p, multiply φ[j] by (1 - 1/p) for all multiples j of p."
    ],
    code: [
      {
        title: "Euler's Totient — Single Value",
        language: "java",
        content: `static long eulerTotient(long n) {
    long result = n;
    for (long p = 2; p * p <= n; p++) {
        if (n % p == 0) {
            while (n % p == 0) n /= p;
            result -= result / p;
        }
    }
    if (n > 1) result -= result / n;
    return result;
}
// Time: O(√n)`
      },
      {
        title: "Euler's Totient Sieve — All Values up to n",
        language: "java",
        content: `static int[] totientSieve(int n) {
    int[] phi = new int[n + 1];
    for (int i = 0; i <= n; i++) phi[i] = i;
    
    for (int i = 2; i <= n; i++) {
        if (phi[i] == i) { // i is prime
            for (int j = i; j <= n; j += i) {
                phi[j] -= phi[j] / i;
            }
        }
    }
    return phi;
}
// Time: O(n·log(log n))`
      }
    ]
  },
  {
    id: "nt-crt",
    title: "Chinese Remainder Theorem",
    difficulty: "Hard",
    theory: [
      "**CRT**: Given x ≡ a₁ (mod m₁), x ≡ a₂ (mod m₂), ..., if all mᵢ are pairwise coprime, there exists a unique solution modulo M = m₁ × m₂ × ... × mₖ.",
      "Used in CP for: combining results from different moduli, solving systems of congruences."
    ],
    code: [
      {
        title: "Chinese Remainder Theorem — Two Congruences",
        language: "java",
        content: `// Solve: x ≡ a1 (mod m1), x ≡ a2 (mod m2)
// Returns {x, lcm(m1,m2)} or {-1,-1} if no solution
static long[] crt(long a1, long m1, long a2, long m2) {
    long[] x = {0}, y = {0};
    long g = extGcd(m1, m2, x, y);
    
    if ((a2 - a1) % g != 0) return new long[]{-1, -1};
    
    long lcm = m1 / g * m2;
    long diff = (a2 - a1) / g;
    long sol = (a1 + m1 * (diff % (m2 / g) * (x[0] % (m2 / g)) % (m2 / g) + m2 / g)) % lcm;
    return new long[]{(sol + lcm) % lcm, lcm};
}`
      }
    ]
  },
  {
    id: "nt-matrix-exp",
    title: "Matrix Exponentiation",
    difficulty: "Hard",
    theory: [
      "**Matrix exponentiation** computes M^n in O(k³ · log n) where k = matrix dimension. Essential for linear recurrences.",
      "Any linear recurrence f(n) = c₁f(n-1) + c₂f(n-2) + ... can be solved in O(k³ · log n) using matrix exponentiation.",
      "Classic application: Fibonacci in O(log n) using 2×2 matrix."
    ],
    code: [
      {
        title: "Matrix Multiplication mod p",
        language: "java",
        content: `static long MOD = 1_000_000_007;

static long[][] matMul(long[][] A, long[][] B) {
    int n = A.length;
    long[][] C = new long[n][n];
    for (int i = 0; i < n; i++)
        for (int k = 0; k < n; k++)
            if (A[i][k] != 0)
                for (int j = 0; j < n; j++)
                    C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
    return C;
}`
      },
      {
        title: "Matrix Exponentiation",
        language: "java",
        content: `static long[][] matPow(long[][] M, long p) {
    int n = M.length;
    long[][] result = new long[n][n];
    for (int i = 0; i < n; i++) result[i][i] = 1; // Identity
    
    while (p > 0) {
        if ((p & 1) == 1) result = matMul(result, M);
        M = matMul(M, M);
        p >>= 1;
    }
    return result;
}`
      },
      {
        title: "Fibonacci in O(log n)",
        language: "java",
        content: `static long fibonacci(long n) {
    if (n <= 1) return n;
    long[][] M = {{1, 1}, {1, 0}};
    long[][] result = matPow(M, n - 1);
    return result[0][0];
}
// F(10^18) mod 10^9+7 in milliseconds!`
      }
    ]
  },
  {
    id: "nt-advanced",
    title: "Advanced Number Theory",
    difficulty: "Expert",
    theory: [
      "**Miller-Rabin primality test**: Probabilistic test based on Fermat's theorem + the fact that x² ≡ 1 (mod p) implies x ≡ ±1 (mod p) for prime p. Write n-1 = d·2^r. For witness a: compute a^d mod n, then square r times. If we never see 1 or n-1 at the right moments, n is composite.",
      "**Deterministic Miller-Rabin**: For n < 3.3×10²⁴, testing witnesses {2,3,5,7,11,13,17,19,23,29,31,37} gives a deterministic answer — no false positives. For n < 10¹⁸, witnesses {2,3,5,7,11,13,17,19,23} suffice.",
      "**Möbius function μ(n)**: μ(1)=1; μ(n)=0 if n has a squared prime factor; μ(n)=(-1)^k if n is product of k distinct primes. Used in **Möbius inversion**: if g(n) = Σf(d) for d|n, then f(n) = Σμ(d)·g(n/d) for d|n.",
      "**Baby-step Giant-step**: Solves the discrete logarithm a^x ≡ b (mod m) in O(√m) time and space. Write x = i·n + j where n = ⌈√m⌉. Precompute a^j for j=0..n-1 (baby steps). Then check b·(a^(-n))^i for i=0..n-1 (giant steps). A meet-in-the-middle approach.",
      "**Primitive roots**: A number g is a primitive root modulo n if every number coprime to n can be represented as g^k mod n for some k. Primitive roots exist for n = 1, 2, 4, p^k, 2p^k (p odd prime). If g is the smallest primitive root mod p, then g = O(p^(1/4)) in practice."
    ],
    code: [
      {
        title: "Miller-Rabin Primality Test",
        language: "java",
        content: `static boolean millerRabin(long n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0) return false;
    
    long d = n - 1;
    int r = 0;
    while (d % 2 == 0) { d /= 2; r++; }
    
    // Deterministic for n < 3.3×10^24
    long[] witnesses = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
    
    for (long a : witnesses) {
        if (a >= n) continue;
        if (!millerTest(a, d, n, r)) return false;
    }
    return true;
}`
      },
      {
        title: "Miller-Rabin Helper — Witness Test",
        language: "java",
        content: `static boolean millerTest(long a, long d, long n, int r) {
    long x = modPow(a, d, n);
    if (x == 1 || x == n - 1) return true;
    
    for (int i = 0; i < r - 1; i++) {
        x = mulMod(x, x, n);
        if (x == n - 1) return true;
    }
    return false;
}

// Modular multiplication safe from overflow
static long mulMod(long a, long b, long mod) {
    return java.math.BigInteger.valueOf(a)
        .multiply(java.math.BigInteger.valueOf(b))
        .mod(java.math.BigInteger.valueOf(mod)).longValue();
}

static long modPow(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = mulMod(result, base, mod);
        base = mulMod(base, base, mod);
        exp >>= 1;
    }
    return result;
}`
      },
      {
        title: "Baby-step Giant-step — Discrete Logarithm",
        language: "java",
        content: `// Find x such that a^x ≡ b (mod m)
static long babyGiantStep(long a, long b, long m) {
    long n = (long) Math.ceil(Math.sqrt(m));
    Map<Long, Long> table = new HashMap<>();
    
    // Baby step: compute a^j for j = 0..n-1
    long val = 1;
    for (long j = 0; j < n; j++) {
        table.put(val, j);
        val = val * a % m;
    }
    
    // Giant step: compute a^(-n)
    long factor = modPow(a, m - 1 - n, m); // a^(-n) mod m
    val = b;
    
    for (long i = 0; i < n; i++) {
        if (table.containsKey(val))
            return i * n + table.get(val);
        val = val * factor % m;
    }
    return -1; // No solution
}
// Time: O(√m), Space: O(√m)`
      }
    ]
  }
];
