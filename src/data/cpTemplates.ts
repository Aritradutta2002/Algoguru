export interface CPTemplate {
  name: string;
  prefix: string;
  description: string;
  code: string;
}

export const CP_TEMPLATES: CPTemplate[] = [
  {
    name: "CP Template (Ultimate)",
    prefix: "template",
    description: "General-purpose template with Fast I/O & full utilities — CSES, AtCoder, practice",
    code: `/*
 * Author  : Aritra Dutta
 * Target  : CSES / AtCoder / General CP
 */
import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader br;
    static StringTokenizer st;
    static PrintWriter out;
    static final Random RNG = new Random();

    static final int MOD = 1_000_000_007;
    static final int MOD2 = 998244353;
    static final long INF = (long) 1e18;

    static void solve() throws IOException {
        int n = nextInt();
        // Write your solution here
    }

    public static void main(String[] args) throws IOException {
        br = new BufferedReader(new InputStreamReader(System.in));
        out = new PrintWriter(new BufferedOutputStream(System.out));

        int t = nextInt();
        while (t-- > 0) solve();

        out.flush();
        out.close();
    }

    // ========== FAST I/O ==========
    static String next() throws IOException { while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine()); return st.nextToken(); }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }
    static double nextDouble() throws IOException { return Double.parseDouble(next()); }
    static String nextLine() throws IOException { return br.readLine(); }

    // ========== ARRAY INPUT ==========
    static int[] nextIntArray(int n) throws IOException { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = nextInt(); return a; }
    static long[] nextLongArray(int n) throws IOException { long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nextLong(); return a; }
    static String[] nextStringArray(int n) throws IOException { String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = next(); return a; }
    static double[] nextDoubleArray(int n) throws IOException { double[] a = new double[n]; for (int i = 0; i < n; i++) a[i] = nextDouble(); return a; }
    static int[][] nextInt2DArray(int r, int c) throws IOException { int[][] a = new int[r][c]; for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) a[i][j] = nextInt(); return a; }

    // ========== ARRAY OUTPUT ==========
    static void printArray(int[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
    static void printArray(long[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
    static void yes() { out.println("YES"); }
    static void no() { out.println("NO"); }

    // ========== UTILITY ==========
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
    static long lcm(long a, long b) { return a / gcd(a, b) * b; }
    static long modPow(long x, long y, long mod) { long r = 1; x %= mod; while (y > 0) { if ((y & 1) == 1) r = r * x % mod; x = x * x % mod; y >>= 1; } return r; }
    static long modInv(long a, long mod) { return modPow(a, mod - 2, mod); }
    static void shuffleSort(int[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static void shuffleSort(long[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); long t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static long sumArray(int[] a) { long s = 0; for (int v : a) s += v; return s; }
    static long sumArray(long[] a) { long s = 0; for (long v : a) s += v; return s; }
    static int minArray(int[] a) { int m = Integer.MAX_VALUE; for (int v : a) m = Math.min(m, v); return m; }
    static int maxArray(int[] a) { int m = Integer.MIN_VALUE; for (int v : a) m = Math.max(m, v); return m; }
    static int lowerBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] < key) l = m + 1; else r = m; } return l; }
    static int upperBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] <= key) l = m + 1; else r = m; } return l; }
    static void debug(Object... o) { System.err.println(Arrays.deepToString(o)); }
}`,
  },
  {
    name: "Codeforces",
    prefix: "codeforces",
    description: "Byte-level FastReader for tight TLEs, shuffleSort anti-hack, full utilities",
    code: `/*
 * Author  : Aritra Dutta
 * Platform: Codeforces
 */
import java.io.*;
import java.util.*;

public class Main {
    static final long INF = (long) 1e18;
    static final int MOD = 1_000_000_007;
    static final int MOD2 = 998244353;
    static final Random RNG = new Random();

    static FastReader fr = new FastReader(System.in);
    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));

    static void solve() {
        int n = fr.nextInt();
        // Write your solution here
    }

    public static void main(String[] args) {
        int t = fr.nextInt();
        while (t-- > 0) solve();
        out.flush();
    }

    // ===== Fast Reader (byte-level, TLE-safe) =====
    static class FastReader {
        private final InputStream in;
        private final byte[] buf = new byte[1 << 16];
        private int ptr = 0, len = 0;

        FastReader(InputStream is) { in = is; }

        private int read() {
            if (ptr >= len) { ptr = 0; try { len = in.read(buf); } catch (IOException e) { return -1; } if (len <= 0) return -1; }
            return buf[ptr++];
        }

        int nextInt() {
            int c; do c = read(); while (c <= ' ');
            int s = 1; if (c == '-') { s = -1; c = read(); }
            int v = 0; while (c > ' ') { v = v * 10 + (c - '0'); c = read(); }
            return v * s;
        }

        long nextLong() {
            int c; do c = read(); while (c <= ' ');
            int s = 1; if (c == '-') { s = -1; c = read(); }
            long v = 0; while (c > ' ') { v = v * 10 + (c - '0'); c = read(); }
            return s == 1 ? v : -v;
        }

        String next() {
            int c; do c = read(); while (c <= ' ');
            StringBuilder sb = new StringBuilder();
            while (c > ' ') { sb.append((char) c); c = read(); }
            return sb.toString();
        }
    }

    // ===== Array I/O =====
    static int[] nextIntArray(int n) { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = fr.nextInt(); return a; }
    static long[] nextLongArray(int n) { long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = fr.nextLong(); return a; }
    static void printArray(int[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
    static void printArray(long[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }

    // ===== Utilities =====
    static void yes() { out.println("YES"); }
    static void no() { out.println("NO"); }
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
    static long lcm(long a, long b) { return a / gcd(a, b) * b; }
    static long modPow(long x, long y, long m) { long r = 1; x %= m; while (y > 0) { if ((y & 1) == 1) r = r * x % m; x = x * x % m; y >>= 1; } return r; }
    static long modInv(long a, long m) { return modPow(a, m - 2, m); }
    static void shuffleSort(int[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static void shuffleSort(long[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); long t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static long sumArray(int[] a) { long s = 0; for (int v : a) s += v; return s; }
    static int minArray(int[] a) { int m = Integer.MAX_VALUE; for (int v : a) m = Math.min(m, v); return m; }
    static int maxArray(int[] a) { int m = Integer.MIN_VALUE; for (int v : a) m = Math.max(m, v); return m; }
    static int lowerBound(int[] a, int x) { int l = 0, r = a.length; while (l < r) { int m = (l + r) >>> 1; if (a[m] < x) l = m + 1; else r = m; } return l; }
    static int upperBound(int[] a, int x) { int l = 0, r = a.length; while (l < r) { int m = (l + r) >>> 1; if (a[m] <= x) l = m + 1; else r = m; } return l; }
    static void debug(Object... o) { System.err.println(Arrays.deepToString(o)); }
}`,
  },
  {
    name: "CodeChef",
    prefix: "codechef",
    description: "StringBuilder batch output, BufferedReader I/O, full competitive utilities",
    code: `/*
 * Author  : Aritra Dutta
 * Platform: CodeChef
 */
import java.io.*;
import java.util.*;

class Codechef {
    static final int MOD = 1_000_000_007;
    static final long INF = (long) 1e18;
    static final Random RNG = new Random();
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;
    static StringBuilder sb = new StringBuilder();

    static void solve() throws IOException {
        int n = nextInt();
        // Write your solution here
        // sb.append(ans).append('\\n');
    }

    public static void main(String[] args) throws Exception {
        int t = nextInt();
        while (t-- > 0) solve();
        System.out.print(sb);
    }

    // ===== Fast I/O =====
    static String next() throws IOException { while (st == null || !st.hasMoreElements()) st = new StringTokenizer(br.readLine()); return st.nextToken(); }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }
    static double nextDouble() throws IOException { return Double.parseDouble(next()); }

    // ===== Array Input =====
    static int[] nextIntArray(int n) throws IOException { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = nextInt(); return a; }
    static long[] nextLongArray(int n) throws IOException { long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nextLong(); return a; }
    static String[] nextStringArray(int n) throws IOException { String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = next(); return a; }
    static double[] nextDoubleArray(int n) throws IOException { double[] a = new double[n]; for (int i = 0; i < n; i++) a[i] = nextDouble(); return a; }

    // ===== Array Output =====
    static void printArray(int[] a) { for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } sb.append('\\n'); }
    static void printArray(long[] a) { for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } sb.append('\\n'); }

    // ===== Utilities =====
    static void yes() { sb.append("YES\\n"); }
    static void no() { sb.append("NO\\n"); }
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
    static long lcm(long a, long b) { return a / gcd(a, b) * b; }
    static long modPow(long x, long y, long m) { long r = 1; x %= m; while (y > 0) { if ((y & 1) == 1) r = r * x % m; x = x * x % m; y >>= 1; } return r; }
    static long modInv(long a, long m) { return modPow(a, m - 2, m); }
    static void shuffleSort(int[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static void shuffleSort(long[] a) { for (int i = a.length - 1; i > 0; i--) { int j = RNG.nextInt(i + 1); long t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
    static long sumArray(int[] a) { long s = 0; for (int v : a) s += v; return s; }
    static int minArray(int[] a) { int m = Integer.MAX_VALUE; for (int v : a) m = Math.min(m, v); return m; }
    static int maxArray(int[] a) { int m = Integer.MIN_VALUE; for (int v : a) m = Math.max(m, v); return m; }
    static int lowerBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] < key) l = m + 1; else r = m; } return l; }
    static int upperBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] <= key) l = m + 1; else r = m; } return l; }
    static void debug(Object... o) { System.err.println(Arrays.deepToString(o)); }
}`,
  },
  {
    name: "LeetCode",
    prefix: "leetcode",
    description: "Solution class with Scanner, local test harness & contest helpers",
    code: `import java.util.*;
import java.util.stream.*;

class Solution {

    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        System.out.println(sol.solve(new int[]{1, 2, 3}));
        sc.close();
    }

    // ===== Helpers =====
    long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
    long lcm(long a, long b) { return a / gcd(a, b) * b; }
    long modPow(long x, long y, long mod) {
        long r = 1; x %= mod;
        while (y > 0) { if ((y & 1) == 1) r = r * x % mod; x = x * x % mod; y >>= 1; }
        return r;
    }
    int lowerBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] < key) l = m + 1; else r = m; } return l; }
    int upperBound(int[] a, int key) { int l = 0, r = a.length; while (l < r) { int m = l + (r - l) / 2; if (a[m] <= key) l = m + 1; else r = m; } return l; }
}`,
  },
];
