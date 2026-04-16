import { ContentSection } from "./recursionContent";

export const advancedMathContent: ContentSection[] = [
  {
    id: "amath-modular",
    title: "Modular Arithmetic Basics",
    difficulty: "Medium",
    theory: [
      "In competitive programming, answers are often asked **modulo 10⁹+7**. This prevents overflow and keeps numbers manageable.",
      "Key rules: `(a + b) % m = ((a%m) + (b%m)) % m`. Same for subtraction and multiplication. But **division is different** — you need modular inverse.",
      "Always take mod after every operation to prevent overflow. In Java, be careful with negative results in subtraction — add `m` before taking mod."
    ],
    code: [
      {
        title: "Mod Add, Sub, Mul",
        language: "java",
        content: `static final int MOD = 1_000_000_007;

static long modAdd(long a, long b, long m) {
    return ((a % m) + (b % m)) % m;
}

static long modSub(long a, long b, long m) {
    return ((a % m) - (b % m) + m) % m; // +m to handle negatives
}

static long modMul(long a, long b, long m) {
    return ((a % m) * (b % m)) % m;
}`
      },
      {
        title: "Modular Exponentiation — O(log y)",
        language: "java",
        content: `// Calculate x^y % m efficiently using binary exponentiation
// Instead of multiplying y times (O(y)), we square repeatedly (O(log y))
static long modPow(long x, long y, long m) {
    long res = 1;
    x %= m;
    while (y > 0) {
        if ((y & 1) == 1) res = modMul(res, x, m); // If y is odd
        x = modMul(x, x, m);                        // Square x
        y >>= 1;                                     // Halve y
    }
    return res;
}`
      },
      {
        title: "Modular Inverse — Fermat's Little Theorem",
        language: "java",
        content: `// For division: a/b mod m = a * b^(-1) mod m
// If m is prime: b^(-1) = b^(m-2) mod m (Fermat's theorem)
static long modInv(long x, long m) {
    return modPow(x, m - 2, m);
}

static long modDiv(long a, long b, long m) {
    return modMul(a, modInv(b, m), m);
}`
      }
    ]
  },
  {
    id: "amath-ext-gcd",
    title: "Extended Euclidean Algorithm",
    difficulty: "Hard",
    theory: [
      "The **Extended GCD** finds integers x, y such that `ax + by = gcd(a, b)`. This is the foundation for modular inverse when modulus is not prime.",
      "Regular GCD just gives the gcd. Extended GCD also gives the **coefficients** — extremely useful for CRT, modular inverse for non-prime mods, and Diophantine equations.",
      "Time complexity: **O(log(min(a, b)))** — same as regular Euclidean algorithm."
    ],
    code: [
      {
        title: "Extended GCD",
        language: "java",
        content: `// Returns {gcd, x, y} such that a*x + b*y = gcd(a, b)
static long[] extendedGCD(long a, long b) {
    if (b == 0) return new long[]{a, 1, 0};
    long[] res = extendedGCD(b, a % b);
    return new long[]{res[0], res[2], res[1] - (a / b) * res[2]};
}`
      },
      {
        title: "Modular Inverse for Non-Prime Modulus",
        language: "java",
        content: `// When modulus is NOT prime, Fermat's theorem doesn't work
// Use Extended GCD instead — returns -1 if inverse doesn't exist
static long modInvGeneral(long a, long m) {
    long[] res = extendedGCD(a, m);
    if (res[0] != 1) return -1; // No inverse exists
    return ((res[1] % m) + m) % m;
}`
      }
    ]
  },
  {
    id: "amath-crt",
    title: "Chinese Remainder Theorem",
    difficulty: "Hard",
    theory: [
      "**CRT** solves systems of simultaneous congruences: find x such that x ≡ r₁ (mod m₁), x ≡ r₂ (mod m₂), ...",
      "It works when all moduli are **pairwise coprime** (gcd of any two = 1). The solution is unique modulo the product of all moduli.",
      "Common in CP: when you need to combine results computed under different moduli."
    ],
    code: [
      {
        title: "Chinese Remainder Theorem",
        language: "java",
        content: `// Solve: x ≡ rems[i] (mod mods[i]) for all i
// Requires: all mods[i] are pairwise coprime
static long crt(long[] rems, long[] mods) {
    int n = rems.length;
    long product = 1;
    for (long m : mods) product *= m;

    long result = 0;
    for (int i = 0; i < n; i++) {
        long p = product / mods[i];
        long inv = modInvGeneral(p, mods[i]);
        result = modAdd(result, modMul(modMul(rems[i], inv), p, product), product);
    }
    return result;
}`
      }
    ]
  },
  {
    id: "amath-combinatorics",
    title: "Combinatorics — nCr, nPr, Catalan",
    difficulty: "Medium",
    theory: [
      "**nCr (binomial coefficient)** = number of ways to choose r items from n. Formula: n! / (r! × (n-r)!).",
      "For fast nCr mod p: precompute factorials and inverse factorials up to MAXN. Then nCr = fact[n] × invFact[r] × invFact[n-r] in **O(1)** per query.",
      "**Catalan numbers** count: valid parentheses, BST shapes, triangulations. C(n) = C(2n, n) / (n+1).",
      "**Stirling numbers** count ways to partition n items into k non-empty sets."
    ],
    code: [
      {
        title: "Precompute Factorials",
        language: "java",
        content: `static final int MAXN = 2_000_001;
static long[] fact = new long[MAXN];
static long[] invFact = new long[MAXN];

static void precompute() {
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++) {
        fact[i] = fact[i - 1] * i % MOD;
    }
    invFact[MAXN - 1] = modInv(fact[MAXN - 1], MOD);
    for (int i = MAXN - 2; i >= 0; i--) {
        invFact[i] = invFact[i + 1] * (i + 1) % MOD;
    }
}`
      },
      {
        title: "nCr in O(1)",
        language: "java",
        content: `// After precompute(), each nCr call is O(1)
static long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return modMul(fact[n], modMul(invFact[r], invFact[n - r], MOD), MOD);
}

static long nPr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return modMul(fact[n], invFact[n - r], MOD);
}`
      },
      {
        title: "Catalan Number",
        language: "java",
        content: `// C(n) = C(2n, n) / (n+1)
// Counts: valid parentheses, BST shapes, polygon triangulations
static long catalan(int n) {
    return modMul(nCr(2 * n, n), modInv(n + 1, MOD), MOD);
}`
      },
      {
        title: "Lucas Theorem — nCr for Large n, Small p",
        language: "java",
        content: `// When n is very large but p (prime modulus) is small
// nCr(n, r, p) = nCr(n%p, r%p, p) × nCr(n/p, r/p, p)
static long nCrLucas(int n, int r, int p) {
    if (r == 0) return 1;
    return modMul(
        nCrLucas(n / p, r / p, p),
        nCrSmall(n % p, r % p, p), p
    );
}

static long nCrSmall(int n, int r, int p) {
    if (r > n) return 0;
    long num = 1, den = 1;
    for (int i = 0; i < r; i++) {
        num = num * (n - i) % p;
        den = den * (i + 1) % p;
    }
    return num * modInv(den, p) % p;
}`
      }
    ]
  },
  {
    id: "amath-primes",
    title: "Prime Numbers & Factorization",
    difficulty: "Medium",
    theory: [
      "**Sieve of Eratosthenes** finds all primes up to n in O(n log log n). Mark multiples of each prime as composite.",
      "**Smallest Prime Factor (SPF)** sieve: for each number, store its smallest prime factor. Then factorize any number in O(log n) by dividing by SPF repeatedly.",
      "**Trial division** factorizes in O(√n) — check divisors up to √n."
    ],
    code: [
      {
        title: "Sieve of Eratosthenes",
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
}`
      },
      {
        title: "Smallest Prime Factor Sieve",
        language: "java",
        content: `// SPF allows O(log n) factorization of any number ≤ n
static int[] computeSPF(int n) {
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
        title: "Factorize Using SPF — O(log n)",
        language: "java",
        content: `static List<int[]> factorize(int n, int[] spf) {
    List<int[]> factors = new ArrayList<>();
    while (n > 1) {
        int p = spf[n], cnt = 0;
        while (n % p == 0) { n /= p; cnt++; }
        factors.add(new int[]{p, cnt});
    }
    return factors;
}`
      },
      {
        title: "Factorize Without Precomputation — O(√n)",
        language: "java",
        content: `static List<int[]> factorize(int n) {
    List<int[]> factors = new ArrayList<>();
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            int cnt = 0;
            while (n % i == 0) { n /= i; cnt++; }
            factors.add(new int[]{i, cnt});
        }
    }
    if (n > 1) factors.add(new int[]{n, 1});
    return factors;
}`
      }
    ]
  },
  {
    id: "amath-miller-rabin",
    title: "Miller-Rabin Primality Test",
    difficulty: "Hard",
    theory: [
      "**Miller-Rabin** tests if a large number is prime in O(k log³ n) where k = number of witnesses.",
      "It's probabilistic in general, but with specific witnesses {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}, it's **deterministic up to 2⁶⁴**.",
      "Used when n is too large for sieve (up to 10¹⁸). Combined with **Pollard's Rho** for factorization of large numbers."
    ],
    code: [
      {
        title: "Miller-Rabin Test",
        language: "java",
        content: `static boolean isPrimeMillerRabin(long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // Write n-1 as d × 2^s
    long d = n - 1;
    int s = 0;
    while (d % 2 == 0) { d /= 2; s++; }

    // These witnesses make it deterministic up to 2^64
    long[] witnesses = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
    for (long a : witnesses) {
        if (a >= n) break;
        if (!millerRabinTest(a, n, d, s)) return false;
    }
    return true;
}`
      },
      {
        title: "Miller-Rabin Single Witness Test",
        language: "java",
        content: `static boolean millerRabinTest(long a, long n, long d, int s) {
    long x = modPow(a, d, n);
    if (x == 1 || x == n - 1) return true;

    for (int r = 1; r < s; r++) {
        x = modMul(x, x, n);
        if (x == n - 1) return true;
    }
    return false;
}`
      }
    ]
  },
  {
    id: "amath-euler-totient",
    title: "Euler's Totient Function",
    difficulty: "Hard",
    theory: [
      "**φ(n)** = count of numbers from 1 to n that are coprime with n (gcd = 1).",
      "Formula: φ(n) = n × ∏(1 - 1/p) for each prime factor p of n.",
      "Key property: **a^φ(m) ≡ 1 (mod m)** when gcd(a, m) = 1 (Euler's theorem). This generalizes Fermat's little theorem.",
      "Can compute single φ(n) in O(√n), or precompute all φ(1..n) using a sieve in O(n log log n)."
    ],
    code: [
      {
        title: "Euler's Totient — Single Value O(√n)",
        language: "java",
        content: `static long phi(long n) {
    long result = n;
    for (long i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            while (n % i == 0) n /= i;
            result -= result / i;
        }
    }
    if (n > 1) result -= result / n;
    return result;
}`
      },
      {
        title: "Euler's Totient Sieve — All Values up to n",
        language: "java",
        content: `static int[] computePhi(int n) {
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
}`
      }
    ]
  },
  {
    id: "amath-matrix",
    title: "Matrix Exponentiation",
    difficulty: "Hard",
    theory: [
      "**Matrix exponentiation** computes A^n in O(k³ log n) where k is matrix size. This is the key technique for solving linear recurrences in O(log n).",
      "The classic example: Fibonacci. F(n) = F(n-1) + F(n-2) can be written as matrix multiplication: [[1,1],[1,0]]^n gives F(n).",
      "Any linear recurrence `f(n) = c₁f(n-1) + c₂f(n-2) + ... + cₖf(n-k)` can be solved this way."
    ],
    code: [
      {
        title: "Matrix Multiplication",
        language: "java",
        content: `static long[][] multiply(long[][] A, long[][] B, long mod) {
    int n = A.length, m = B[0].length, p = B.length;
    long[][] C = new long[n][m];

    for (int i = 0; i < n; i++) {
        for (int k = 0; k < p; k++) {
            if (A[i][k] == 0) continue; // Optimization
            for (int j = 0; j < m; j++) {
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % mod;
            }
        }
    }
    return C;
}`
      },
      {
        title: "Matrix Power — O(k³ log n)",
        language: "java",
        content: `static long[][] power(long[][] A, long p, long mod) {
    int n = A.length;
    long[][] result = new long[n][n];
    for (int i = 0; i < n; i++) result[i][i] = 1; // Identity matrix

    while (p > 0) {
        if ((p & 1) == 1) result = multiply(result, A, mod);
        A = multiply(A, A, mod);
        p >>= 1;
    }
    return result;
}`
      },
      {
        title: "Fibonacci in O(log n)",
        language: "java",
        content: `static long fibonacci(long n, long mod) {
    if (n <= 1) return n % mod;
    long[][] base = {{1, 1}, {1, 0}};
    long[][] result = power(base, n - 1, mod);
    return result[0][0] % mod;
}`
      },
      {
        title: "Generic Linear Recurrence Solver",
        language: "java",
        content: `// Solve: f(n) = rec[0]*f(n-1) + rec[1]*f(n-2) + ... + rec[k-1]*f(n-k)
// init = first k values [f(0), f(1), ..., f(k-1)]
static long linearRecurrence(long[] rec, long[] init, long n, long mod) {
    int k = rec.length;
    if (n < init.length) return init[(int) n] % mod;

    // Build transition matrix
    long[][] matrix = new long[k][k];
    for (int i = 0; i < k; i++) matrix[0][i] = rec[i];
    for (int i = 1; i < k; i++) matrix[i][i - 1] = 1;

    long[][] result = power(matrix, n - k + 1, mod);

    long ans = 0;
    for (int i = 0; i < k; i++) {
        ans = (ans + result[0][i] * init[k - 1 - i]) % mod;
    }
    return ans;
}`
      }
    ]
  },
  {
    id: "amath-ntt",
    title: "NTT — Number Theoretic Transform",
    difficulty: "Expert",
    theory: [
      "**NTT** is FFT but over integers modulo a prime. It avoids floating-point errors that plague regular FFT.",
      "Used for **polynomial multiplication mod p** in O(n log n). The prime must be NTT-friendly: p = c × 2^k + 1. Common choice: **998244353** = 119 × 2²³ + 1.",
      "Applications: multiplying large numbers, counting problems, convolutions in number theory."
    ],
    code: [
      {
        title: "NTT Implementation",
        language: "java",
        content: `static final int NTT_MOD = 998244353;
static final int G = 3; // Primitive root of NTT_MOD

static void ntt(long[] a, boolean invert) {
    int n = a.length;

    // Bit-reversal permutation
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        for (; (j & bit) != 0; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { long t = a[i]; a[i] = a[j]; a[j] = t; }
    }

    for (int len = 2; len <= n; len <<= 1) {
        long wlen = modPow(G, (NTT_MOD - 1) / len, NTT_MOD);
        if (invert) wlen = modPow(wlen, NTT_MOD - 2, NTT_MOD);

        for (int i = 0; i < n; i += len) {
            long w = 1;
            for (int j = 0; j < len / 2; j++) {
                long u = a[i + j];
                long v = a[i + j + len / 2] * w % NTT_MOD;
                a[i + j] = (u + v) % NTT_MOD;
                a[i + j + len / 2] = (u - v + NTT_MOD) % NTT_MOD;
                w = w * wlen % NTT_MOD;
            }
        }
    }

    if (invert) {
        long nInv = modPow(n, NTT_MOD - 2, NTT_MOD);
        for (int i = 0; i < n; i++) a[i] = a[i] * nInv % NTT_MOD;
    }
}`
      },
      {
        title: "Polynomial Multiplication via NTT",
        language: "java",
        content: `static long[] polyMultiply(long[] A, long[] B) {
    int n = 1;
    while (n < A.length + B.length) n <<= 1;

    long[] fa = Arrays.copyOf(A, n);
    long[] fb = Arrays.copyOf(B, n);

    ntt(fa, false);
    ntt(fb, false);

    for (int i = 0; i < n; i++) fa[i] = fa[i] * fb[i] % NTT_MOD;

    ntt(fa, true);

    return Arrays.copyOf(fa, A.length + B.length - 1);
}`
      }
    ]
  },
  {
    id: "amath-gaussian",
    title: "Gaussian Elimination",
    difficulty: "Expert",
    theory: [
      "**Gaussian Elimination** solves systems of linear equations Ax = b in O(n³).",
      "Steps: (1) Forward elimination — convert to upper triangular form using row operations, (2) Back substitution — solve from bottom up.",
      "Also used to compute **determinants** and **matrix rank**. Partial pivoting prevents numerical instability."
    ],
    code: [
      {
        title: "Solve Linear System Ax = b",
        language: "java",
        content: `static double[] solve(double[][] A, double[] b) {
    int n = A.length;
    double[][] aug = new double[n][n + 1];
    for (int i = 0; i < n; i++) {
        System.arraycopy(A[i], 0, aug[i], 0, n);
        aug[i][n] = b[i];
    }

    // Forward elimination with partial pivoting
    for (int i = 0; i < n; i++) {
        int pivot = i;
        for (int j = i + 1; j < n; j++) {
            if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
        }
        double[] temp = aug[i]; aug[i] = aug[pivot]; aug[pivot] = temp;

        if (Math.abs(aug[i][i]) < 1e-10) return null; // No unique solution

        for (int j = i + 1; j < n; j++) {
            double factor = aug[j][i] / aug[i][i];
            for (int k = i; k <= n; k++) aug[j][k] -= factor * aug[i][k];
        }
    }

    // Back substitution
    double[] x = new double[n];
    for (int i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n];
        for (int j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
        x[i] /= aug[i][i];
    }
    return x;
}`
      },
      {
        title: "Compute Determinant",
        language: "java",
        content: `static double determinant(double[][] A) {
    int n = A.length;
    double[][] mat = new double[n][];
    for (int i = 0; i < n; i++) mat[i] = A[i].clone();

    double det = 1;
    for (int i = 0; i < n; i++) {
        int pivot = i;
        for (int j = i + 1; j < n; j++) {
            if (Math.abs(mat[j][i]) > Math.abs(mat[pivot][i])) pivot = j;
        }
        if (pivot != i) {
            double[] temp = mat[i]; mat[i] = mat[pivot]; mat[pivot] = temp;
            det *= -1;
        }
        if (Math.abs(mat[i][i]) < 1e-10) return 0;
        det *= mat[i][i];

        for (int j = i + 1; j < n; j++) {
            double factor = mat[j][i] / mat[i][i];
            for (int k = i + 1; k < n; k++) mat[j][k] -= factor * mat[i][k];
        }
    }
    return det;
}`
      }
    ]
  }
];
