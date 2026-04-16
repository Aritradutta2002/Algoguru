// Java CP Snippets for Monaco Editor Autocomplete
// Templates by Aritra Dutta + common CP algorithms

export interface JavaSnippet {
  label: string;
  detail: string;
  insertText: string;
  documentation: string;
}

// ==================== FULL TEMPLATES ====================

const FASTIO_TEMPLATE = `import java.io.*;
import java.util.*;

public class Main {
\tstatic BufferedReader br;
\tstatic StringTokenizer st;
\tstatic PrintWriter out;
\tstatic final Random random = new Random();
\tstatic final int MOD = 1_000_000_007;
\tstatic final int MOD2 = 998244353;
\tstatic final long INF = (long) 1e18;
\tstatic final double EPS = 1e-9;

\tpublic static void main(String[] args) throws IOException {
\t\tbr = new BufferedReader(new InputStreamReader(System.in));
\t\tout = new PrintWriter(new BufferedOutputStream(System.out));
\t\tint t = nextInt();
\t\twhile (t-- > 0) solve();
\t\tout.flush();
\t\tout.close();
\t}

\tstatic void solve() throws IOException {
\t\tint n = nextInt();
\t\t\${1}
\t}

\t// ========== FAST I/O ==========
\tstatic String next() throws IOException {
\t\twhile (st == null || !st.hasMoreTokens()) {
\t\t\tString line = br.readLine();
\t\t\tif (line == null) return null;
\t\t\tst = new StringTokenizer(line);
\t\t}
\t\treturn st.nextToken();
\t}
\tstatic int nextInt() throws IOException { return Integer.parseInt(next()); }
\tstatic long nextLong() throws IOException { return Long.parseLong(next()); }
\tstatic double nextDouble() throws IOException { return Double.parseDouble(next()); }
\tstatic String nextLine() throws IOException { return br.readLine(); }
\tstatic char nextChar() throws IOException { return next().charAt(0); }
\tstatic int[] nextIntArray(int n) throws IOException {
\t\tint[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = nextInt(); return a;
\t}
\tstatic long[] nextLongArray(int n) throws IOException {
\t\tlong[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nextLong(); return a;
\t}
\tstatic int[][] nextIntMatrix(int n, int m) throws IOException {
\t\tint[][] a = new int[n][m]; for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) a[i][j] = nextInt(); return a;
\t}

\t// ========== OUTPUT ==========
\tstatic void printArray(int[] a) {
\t\tStringBuilder sb = new StringBuilder();
\t\tfor (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }
\t\tout.println(sb);
\t}
\tstatic void printArray(long[] a) {
\t\tStringBuilder sb = new StringBuilder();
\t\tfor (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); }
\t\tout.println(sb);
\t}
\tstatic void yes() { out.println("YES"); }
\tstatic void no() { out.println("NO"); }

\t// ========== MATH ==========
\tstatic long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
\tstatic long lcm(long a, long b) { return a / gcd(a, b) * b; }
\tstatic long modPow(long x, long y, long m) {
\t\tlong res = 1; x %= m;
\t\twhile (y > 0) { if ((y & 1) == 1) res = res * x % m; x = x * x % m; y >>= 1; }
\t\treturn res;
\t}
\tstatic long modInv(long x, long m) { return modPow(x, m - 2, m); }
\tstatic long modAdd(long a, long b, long m) { return ((a % m) + (b % m)) % m; }
\tstatic long modSub(long a, long b, long m) { return ((a % m) - (b % m) + m) % m; }
\tstatic long modMul(long a, long b, long m) { return ((a % m) * (b % m)) % m; }

\t// ========== SORTING (Anti-hack) ==========
\tstatic void shuffleSort(int[] a) {
\t\tfor (int i = a.length - 1; i > 0; i--) {
\t\t\tint j = random.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t;
\t\t}
\t\tArrays.sort(a);
\t}
\tstatic void shuffleSort(long[] a) {
\t\tfor (int i = a.length - 1; i > 0; i--) {
\t\t\tint j = random.nextInt(i + 1); long t = a[i]; a[i] = a[j]; a[j] = t;
\t\t}
\t\tArrays.sort(a);
\t}

\t// ========== ARRAY UTILS ==========
\tstatic void reverse(int[] a) { int i = 0, j = a.length - 1; while (i < j) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; } }
\tstatic void reverse(long[] a) { int i = 0, j = a.length - 1; while (i < j) { long t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; } }
\tstatic int max(int[] a) { int m = a[0]; for (int x : a) m = Math.max(m, x); return m; }
\tstatic long max(long[] a) { long m = a[0]; for (long x : a) m = Math.max(m, x); return m; }
\tstatic int min(int[] a) { int m = a[0]; for (int x : a) m = Math.min(m, x); return m; }
\tstatic long min(long[] a) { long m = a[0]; for (long x : a) m = Math.min(m, x); return m; }
\tstatic long sum(int[] a) { long s = 0; for (int x : a) s += x; return s; }
\tstatic long sum(long[] a) { long s = 0; for (long x : a) s += x; return s; }

\t// ========== BINARY SEARCH ==========
\tstatic int lowerBound(int[] a, int t) { int lo = 0, hi = a.length; while (lo < hi) { int m = (lo + hi) / 2; if (a[m] >= t) hi = m; else lo = m + 1; } return lo; }
\tstatic int upperBound(int[] a, int t) { int lo = 0, hi = a.length; while (lo < hi) { int m = (lo + hi) / 2; if (a[m] > t) hi = m; else lo = m + 1; } return lo; }

\t// ========== PAIR ==========
\tstatic class IntPair implements Comparable<IntPair> {
\t\tint first, second;
\t\tIntPair(int f, int s) { first = f; second = s; }
\t\tpublic int compareTo(IntPair o) { return first != o.first ? Integer.compare(first, o.first) : Integer.compare(second, o.second); }
\t\tpublic String toString() { return "(" + first + ", " + second + ")"; }
\t\tpublic boolean equals(Object o) { if (!(o instanceof IntPair)) return false; IntPair p = (IntPair) o; return first == p.first && second == p.second; }
\t\tpublic int hashCode() { return Objects.hash(first, second); }
\t}
}`;

const FAST_TEMPLATE = `import java.io.*;
import java.util.*;

public class Main {
\tstatic BufferedReader br;
\tstatic StringTokenizer st;
\tstatic PrintWriter out;
\tstatic final int MOD = 1_000_000_007;
\tstatic final long INF = (long) 1e18;
\tstatic final Random random = new Random();

\tpublic static void main(String[] args) throws IOException {
\t\tbr = new BufferedReader(new InputStreamReader(System.in));
\t\tout = new PrintWriter(new BufferedOutputStream(System.out));
\t\tint t = nextInt();
\t\twhile (t-- > 0) solve();
\t\tout.flush();
\t\tout.close();
\t}

\tstatic void solve() throws IOException {
\t\tint n = nextInt();
\t\t\${1}
\t}

\tstatic String next() throws IOException {
\t\twhile (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine());
\t\treturn st.nextToken();
\t}
\tstatic int nextInt() throws IOException { return Integer.parseInt(next()); }
\tstatic long nextLong() throws IOException { return Long.parseLong(next()); }
\tstatic double nextDouble() throws IOException { return Double.parseDouble(next()); }
\tstatic String nextLine() throws IOException { return br.readLine(); }
\tstatic int[] nextIntArray(int n) throws IOException { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = nextInt(); return a; }
\tstatic long[] nextLongArray(int n) throws IOException { long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nextLong(); return a; }
\tstatic void printArray(int[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
\tstatic void printArray(long[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
\tstatic void yes() { out.println("YES"); }
\tstatic void no() { out.println("NO"); }
\tstatic long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
\tstatic long lcm(long a, long b) { return a / gcd(a, b) * b; }
\tstatic long modPow(long x, long y, long m) { long r = 1; x %= m; while (y > 0) { if ((y & 1) == 1) r = r * x % m; x = x * x % m; y >>= 1; } return r; }
\tstatic void shuffleSort(int[] a) { for (int i = a.length - 1; i > 0; i--) { int j = random.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }
}`;

const JAVA_TEMPLATE_WITH_GRAPH = `import java.io.*;
import java.util.*;

public class Main {
\tstatic BufferedReader br;
\tstatic StringTokenizer st;
\tstatic PrintWriter out;
\tstatic final int MOD = 1_000_000_007;
\tstatic final long INF = (long) 1e18;
\tstatic final Random random = new Random();

\tpublic static void main(String[] args) throws IOException {
\t\tbr = new BufferedReader(new InputStreamReader(System.in));
\t\tout = new PrintWriter(new BufferedOutputStream(System.out));
\t\tint t = nextInt();
\t\twhile (t-- > 0) solve();
\t\tout.flush();
\t\tout.close();
\t}

\tstatic void solve() throws IOException {
\t\tint n = nextInt();
\t\t\${1}
\t}

\t// ========== FAST I/O ==========
\tstatic String next() throws IOException { while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine()); return st.nextToken(); }
\tstatic int nextInt() throws IOException { return Integer.parseInt(next()); }
\tstatic long nextLong() throws IOException { return Long.parseLong(next()); }
\tstatic String nextLine() throws IOException { return br.readLine(); }
\tstatic int[] nextIntArray(int n) throws IOException { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = nextInt(); return a; }
\tstatic long[] nextLongArray(int n) throws IOException { long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nextLong(); return a; }
\tstatic void printArray(int[] a) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(' '); sb.append(a[i]); } out.println(sb); }
\tstatic void yes() { out.println("YES"); }
\tstatic void no() { out.println("NO"); }

\t// ========== MATH ==========
\tstatic long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
\tstatic long lcm(long a, long b) { return a / gcd(a, b) * b; }
\tstatic long modPow(long x, long y, long m) { long r = 1; x %= m; while (y > 0) { if ((y & 1) == 1) r = r * x % m; x = x * x % m; y >>= 1; } return r; }
\tstatic long modInv(long x, long m) { return modPow(x, m - 2, m); }
\tstatic void shuffleSort(int[] a) { for (int i = a.length - 1; i > 0; i--) { int j = random.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; } Arrays.sort(a); }

\t// ========== DSU (Union-Find) ==========
\tstatic class DSU {
\t\tint[] parent, rank;
\t\tint components;
\t\tDSU(int n) { parent = new int[n]; rank = new int[n]; components = n; for (int i = 0; i < n; i++) parent[i] = i; }
\t\tint find(int x) { if (parent[x] != x) parent[x] = find(parent[x]); return parent[x]; }
\t\tboolean unite(int x, int y) { x = find(x); y = find(y); if (x == y) return false; if (rank[x] < rank[y]) { int t = x; x = y; y = t; } parent[y] = x; if (rank[x] == rank[y]) rank[x]++; components--; return true; }
\t\tboolean same(int x, int y) { return find(x) == find(y); }
\t}

\t// ========== BFS ==========
\tstatic int[] bfs(int start, List<List<Integer>> adj) {
\t\tint n = adj.size();
\t\tint[] dist = new int[n];
\t\tArrays.fill(dist, -1);
\t\tArrayDeque<Integer> q = new ArrayDeque<>();
\t\tq.add(start); dist[start] = 0;
\t\twhile (!q.isEmpty()) {
\t\t\tint u = q.poll();
\t\t\tfor (int v : adj.get(u)) { if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); } }
\t\t}
\t\treturn dist;
\t}

\t// ========== Dijkstra ==========
\tstatic long[] dijkstra(int src, List<List<long[]>> adj) {
\t\tint n = adj.size();
\t\tlong[] dist = new long[n];
\t\tArrays.fill(dist, INF);
\t\tdist[src] = 0;
\t\tPriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));
\t\tpq.add(new long[]{src, 0});
\t\twhile (!pq.isEmpty()) {
\t\t\tlong[] node = pq.poll();
\t\t\tint u = (int) node[0]; long d = node[1];
\t\t\tif (d > dist[u]) continue;
\t\t\tfor (long[] e : adj.get(u)) { int v = (int) e[0]; long w = e[1]; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.add(new long[]{v, dist[v]}); } }
\t\t}
\t\treturn dist;
\t}
}`;

export const CP_TEMPLATE_SNIPPETS: JavaSnippet[] = [
  // === Full Templates ===
  { label: "fastio", detail: "⚡ FastIO Full Template (Aritra)", insertText: FASTIO_TEMPLATE, documentation: "Complete FastIO template with I/O, math, sorting, binary search, IntPair" },
  { label: "fasttemplate", detail: "⚡ Fast Template (Compact)", insertText: FAST_TEMPLATE, documentation: "Compact CP template with Fast I/O, math, shuffleSort" },
  { label: "graphtemplate", detail: "⚡ Graph Template (DSU+BFS+Dijkstra)", insertText: JAVA_TEMPLATE_WITH_GRAPH, documentation: "CP template with DSU, BFS, Dijkstra, Fast I/O" },
  { label: "cptemplate", detail: "⚡ Basic CP Template", insertText: `import java.util.*;
import java.io.*;

public class Main {
\tstatic BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
\tstatic PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));

\tpublic static void main(String[] args) throws IOException {
\t\tint t = Integer.parseInt(br.readLine().trim());
\t\twhile (t-- > 0) {
\t\t\tsolve();
\t\t}
\t\tout.flush();
\t\tout.close();
\t}

\tstatic void solve() throws IOException {
\t\tStringTokenizer st = new StringTokenizer(br.readLine());
\t\tint n = Integer.parseInt(st.nextToken());
\t\t\${1}
\t}
}`, documentation: "Basic competitive programming template" },

  // === Data Structures ===
  { label: "dsu", detail: "DSU / Union-Find", insertText: `static class DSU {
\tint[] parent, rank;
\tint components;
\tDSU(int n) { parent = new int[n]; rank = new int[n]; components = n; for (int i = 0; i < n; i++) parent[i] = i; }
\tint find(int x) { if (parent[x] != x) parent[x] = find(parent[x]); return parent[x]; }
\tboolean unite(int x, int y) { x = find(x); y = find(y); if (x == y) return false; if (rank[x] < rank[y]) { int t = x; x = y; y = t; } parent[y] = x; if (rank[x] == rank[y]) rank[x]++; components--; return true; }
\tboolean same(int x, int y) { return find(x) == find(y); }
}`, documentation: "Disjoint Set Union with path compression + union by rank" },

  { label: "segtree", detail: "Segment Tree (sum)", insertText: `static class SegTree {
\tlong[] tree;
\tint n;
\tSegTree(int n) { this.n = n; tree = new long[4 * n]; }
\tSegTree(int[] a) { this(a.length); build(a, 1, 0, n - 1); }
\tvoid build(int[] a, int v, int l, int r) {
\t\tif (l == r) { tree[v] = a[l]; return; }
\t\tint m = (l + r) / 2;
\t\tbuild(a, 2*v, l, m); build(a, 2*v+1, m+1, r);
\t\ttree[v] = tree[2*v] + tree[2*v+1];
\t}
\tvoid update(int v, int l, int r, int pos, long val) {
\t\tif (l == r) { tree[v] = val; return; }
\t\tint m = (l + r) / 2;
\t\tif (pos <= m) update(2*v, l, m, pos, val); else update(2*v+1, m+1, r, pos, val);
\t\ttree[v] = tree[2*v] + tree[2*v+1];
\t}
\tvoid update(int pos, long val) { update(1, 0, n - 1, pos, val); }
\tlong query(int v, int l, int r, int ql, int qr) {
\t\tif (ql > r || qr < l) return 0;
\t\tif (ql <= l && r <= qr) return tree[v];
\t\tint m = (l + r) / 2;
\t\treturn query(2*v, l, m, ql, qr) + query(2*v+1, m+1, r, ql, qr);
\t}
\tlong query(int l, int r) { return query(1, 0, n - 1, l, r); }
}`, documentation: "Segment Tree with point update and range sum query" },

  { label: "bit", detail: "Binary Indexed Tree / Fenwick", insertText: `static class BIT {
\tlong[] tree;
\tint n;
\tBIT(int n) { this.n = n; tree = new long[n + 1]; }
\tvoid update(int i, long delta) { for (i++; i <= n; i += i & (-i)) tree[i] += delta; }
\tlong query(int i) { long s = 0; for (i++; i > 0; i -= i & (-i)) s += tree[i]; return s; }
\tlong query(int l, int r) { return query(r) - (l > 0 ? query(l - 1) : 0); }
}`, documentation: "Fenwick Tree / BIT for prefix sums" },

  { label: "trie", detail: "Trie (String)", insertText: `static class Trie {
\tint[][] children;
\tboolean[] isEnd;
\tint cnt = 0;
\tTrie(int maxNodes) { children = new int[maxNodes][26]; isEnd = new boolean[maxNodes]; for (int[] c : children) Arrays.fill(c, -1); }
\tvoid insert(String s) {
\t\tint cur = 0;
\t\tfor (char c : s.toCharArray()) {
\t\t\tint idx = c - 'a';
\t\t\tif (children[cur][idx] == -1) children[cur][idx] = ++cnt;
\t\t\tcur = children[cur][idx];
\t\t}
\t\tisEnd[cur] = true;
\t}
\tboolean search(String s) {
\t\tint cur = 0;
\t\tfor (char c : s.toCharArray()) {
\t\t\tint idx = c - 'a';
\t\t\tif (children[cur][idx] == -1) return false;
\t\t\tcur = children[cur][idx];
\t\t}
\t\treturn isEnd[cur];
\t}
}`, documentation: "Trie for string operations" },

  // === Graph Algorithms ===
  { label: "bfs", detail: "BFS graph traversal", insertText: `static int[] bfs(int start, List<List<Integer>> adj) {
\tint n = adj.size();
\tint[] dist = new int[n];
\tArrays.fill(dist, -1);
\tArrayDeque<Integer> q = new ArrayDeque<>();
\tq.add(start); dist[start] = 0;
\twhile (!q.isEmpty()) {
\t\tint u = q.poll();
\t\tfor (int v : adj.get(u)) {
\t\t\tif (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }
\t\t}
\t}
\treturn dist;
}`, documentation: "BFS shortest path on unweighted graph" },

  { label: "dfs", detail: "DFS graph traversal", insertText: `static boolean[] visited;
static void dfs(int u, List<List<Integer>> adj) {
\tvisited[u] = true;
\tfor (int v : adj.get(u)) {
\t\tif (!visited[v]) dfs(v, adj);
\t}
}`, documentation: "DFS traversal" },

  { label: "dijkstra", detail: "Dijkstra shortest path", insertText: `static long[] dijkstra(int src, List<List<long[]>> adj) {
\tint n = adj.size();
\tlong[] dist = new long[n];
\tArrays.fill(dist, (long) 1e18);
\tdist[src] = 0;
\tPriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));
\tpq.add(new long[]{src, 0});
\twhile (!pq.isEmpty()) {
\t\tlong[] node = pq.poll();
\t\tint u = (int) node[0]; long d = node[1];
\t\tif (d > dist[u]) continue;
\t\tfor (long[] e : adj.get(u)) {
\t\t\tint v = (int) e[0]; long w = e[1];
\t\t\tif (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.add(new long[]{v, dist[v]}); }
\t\t}
\t}
\treturn dist;
}`, documentation: "Dijkstra's algorithm for weighted graphs" },

  { label: "toposort", detail: "Topological Sort (Kahn's)", insertText: `static int[] topoSort(int n, List<List<Integer>> adj) {
\tint[] indegree = new int[n];
\tfor (int u = 0; u < n; u++) for (int v : adj.get(u)) indegree[v]++;
\tArrayDeque<Integer> q = new ArrayDeque<>();
\tfor (int i = 0; i < n; i++) if (indegree[i] == 0) q.add(i);
\tint[] order = new int[n];
\tint idx = 0;
\twhile (!q.isEmpty()) {
\t\tint u = q.poll();
\t\torder[idx++] = u;
\t\tfor (int v : adj.get(u)) { if (--indegree[v] == 0) q.add(v); }
\t}
\treturn idx == n ? order : new int[0]; // empty if cycle
}`, documentation: "Topological sort using Kahn's algorithm (BFS)" },

  { label: "adjlist", detail: "Adjacency list setup", insertText: `int n = nextInt(), m = nextInt();
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int i = 0; i < m; i++) {
\tint u = nextInt() - 1, v = nextInt() - 1;
\tadj.get(u).add(v);
\tadj.get(v).add(u); // remove for directed
}`, documentation: "Read graph as adjacency list" },

  { label: "wadjlist", detail: "Weighted adjacency list", insertText: `int n = nextInt(), m = nextInt();
List<List<long[]>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int i = 0; i < m; i++) {
\tint u = nextInt() - 1, v = nextInt() - 1;
\tlong w = nextLong();
\tadj.get(u).add(new long[]{v, w});
\tadj.get(v).add(new long[]{u, w}); // remove for directed
}`, documentation: "Read weighted graph as adjacency list" },

  // === Pair & Triple ===
  { label: "pair", detail: "IntPair class", insertText: `static class IntPair implements Comparable<IntPair> {
\tint first, second;
\tIntPair(int f, int s) { first = f; second = s; }
\tpublic int compareTo(IntPair o) { return first != o.first ? Integer.compare(first, o.first) : Integer.compare(second, o.second); }
\tpublic String toString() { return "(" + first + ", " + second + ")"; }
\tpublic boolean equals(Object o) { if (!(o instanceof IntPair)) return false; IntPair p = (IntPair) o; return first == p.first && second == p.second; }
\tpublic int hashCode() { return Objects.hash(first, second); }
}`, documentation: "IntPair with Comparable, equals, hashCode" },

  { label: "triple", detail: "Triple class", insertText: `static class Triple implements Comparable<Triple> {
\tint first, second, third;
\tTriple(int f, int s, int t) { first = f; second = s; third = t; }
\tpublic int compareTo(Triple o) { if (first != o.first) return Integer.compare(first, o.first); if (second != o.second) return Integer.compare(second, o.second); return Integer.compare(third, o.third); }
\tpublic String toString() { return "(" + first + ", " + second + ", " + third + ")"; }
}`, documentation: "Triple class for 3-element tuples" },

  // === Math / Number Theory ===
  { label: "sieve", detail: "Sieve of Eratosthenes", insertText: `static boolean[] sieve(int n) {
\tboolean[] isPrime = new boolean[n + 1];
\tArrays.fill(isPrime, true);
\tisPrime[0] = isPrime[1] = false;
\tfor (int i = 2; i * i <= n; i++) {
\t\tif (isPrime[i]) for (int j = i * i; j <= n; j += i) isPrime[j] = false;
\t}
\treturn isPrime;
}`, documentation: "Sieve of Eratosthenes for primes up to n" },

  { label: "nCr", detail: "nCr with mod", insertText: `static long[] fact, inv;
static void precompute(int n, long mod) {
\tfact = new long[n + 1]; inv = new long[n + 1];
\tfact[0] = 1;
\tfor (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % mod;
\tinv[n] = modPow(fact[n], mod - 2, mod);
\tfor (int i = n - 1; i >= 0; i--) inv[i] = inv[i + 1] * (i + 1) % mod;
}
static long nCr(int n, int r, long mod) {
\tif (r < 0 || r > n) return 0;
\treturn fact[n] % mod * inv[r] % mod * inv[n - r] % mod;
}`, documentation: "Combinatorics nCr with modular inverse" },

  { label: "prefixsum", detail: "Prefix sum array", insertText: `long[] prefix = new long[\${1:n} + 1];
for (int i = 0; i < \${1:n}; i++) prefix[i + 1] = prefix[i] + \${2:arr}[i];
// sum [l, r] = prefix[r+1] - prefix[l]`, documentation: "1D prefix sum" },

  { label: "prefix2d", detail: "2D prefix sum", insertText: `long[][] prefix = new long[\${1:n} + 1][\${2:m} + 1];
for (int i = 1; i <= \${1:n}; i++)
\tfor (int j = 1; j <= \${2:m}; j++)
\t\tprefix[i][j] = grid[i-1][j-1] + prefix[i-1][j] + prefix[i][j-1] - prefix[i-1][j-1];
// sum (r1,c1)-(r2,c2) = prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]`, documentation: "2D prefix sum" },

  // === Common Patterns ===
  { label: "yes", detail: "yes() / no()", insertText: "static void yes() { out.println(\"YES\"); }\nstatic void no() { out.println(\"NO\"); }", documentation: "YES/NO output helpers" },
  { label: "shufflesort", detail: "Anti-hack shuffle sort", insertText: `static void shuffleSort(int[] a) {
\tRandom rng = new Random();
\tfor (int i = a.length - 1; i > 0; i--) { int j = rng.nextInt(i + 1); int t = a[i]; a[i] = a[j]; a[j] = t; }
\tArrays.sort(a);
}`, documentation: "Shuffle before sort to avoid O(n²) hack on Codeforces" },

  { label: "lowerbound", detail: "Lower bound (first >=)", insertText: `static int lowerBound(int[] a, int t) { int lo = 0, hi = a.length; while (lo < hi) { int m = (lo + hi) / 2; if (a[m] >= t) hi = m; else lo = m + 1; } return lo; }`, documentation: "First index where arr[i] >= target" },

  { label: "upperbound", detail: "Upper bound (first >)", insertText: `static int upperBound(int[] a, int t) { int lo = 0, hi = a.length; while (lo < hi) { int m = (lo + hi) / 2; if (a[m] > t) hi = m; else lo = m + 1; } return lo; }`, documentation: "First index where arr[i] > target" },

  { label: "modinv", detail: "Modular inverse", insertText: `static long modInv(long x, long m) { return modPow(x, m - 2, m); }`, documentation: "Modular multiplicative inverse (Fermat)" },

  { label: "readgraph", detail: "Read undirected graph", insertText: `int n = nextInt(), m = nextInt();
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int i = 0; i < m; i++) {
\tint u = nextInt() - 1, v = nextInt() - 1;
\tadj.get(u).add(v);
\tadj.get(v).add(u);
}`, documentation: "Read undirected graph (1-indexed input)" },
];

export const BASIC_SNIPPETS: JavaSnippet[] = [
  // === Imports ===
  { label: "impu", detail: "import java.util.*", insertText: "import java.util.*;", documentation: "Import all java.util" },
  { label: "impio", detail: "import java.io.*", insertText: "import java.io.*;", documentation: "Import all java.io" },
  { label: "impstream", detail: "import java.util.stream.*", insertText: "import java.util.stream.*;", documentation: "Import streams" },
  { label: "impmath", detail: "import java.math.*", insertText: "import java.math.*;", documentation: "Import BigInteger/BigDecimal" },
  { label: "impall", detail: "All CP imports", insertText: "import java.util.*;\nimport java.util.stream.*;\nimport java.io.*;\nimport java.math.*;", documentation: "All competitive programming imports" },

  // === Print ===
  { label: "sout", detail: "System.out.println()", insertText: "System.out.println(${1});", documentation: "Print to console" },
  { label: "souf", detail: "System.out.printf()", insertText: "System.out.printf(${1:\"format\"}, ${2});", documentation: "Formatted print" },
  { label: "serr", detail: "System.err.println()", insertText: "System.err.println(${1});", documentation: "Print to error stream" },
  { label: "soutv", detail: "Print variable", insertText: "System.out.println(\"${1:var} = \" + ${1:var});", documentation: "Print variable with label" },
  { label: "souta", detail: "Print array", insertText: "System.out.println(Arrays.toString(${1:arr}));", documentation: "Print array" },
  { label: "sout2d", detail: "Print 2D array", insertText: "System.out.println(Arrays.deepToString(${1:arr}));", documentation: "Print 2D array" },

  // === Main & Structure ===
  { label: "main", detail: "public static void main", insertText: "public static void main(String[] args) {\n\t${1}\n}", documentation: "Main method" },
  { label: "psvm", detail: "public static void main", insertText: "public static void main(String[] args) {\n\t${1}\n}", documentation: "Main method (alias)" },
  { label: "cls", detail: "Class template", insertText: "public class ${1:ClassName} {\n\t${2}\n}", documentation: "New class" },
  { label: "ctor", detail: "Constructor", insertText: "public ${1:ClassName}(${2}) {\n\t${3}\n}", documentation: "Constructor" },
  { label: "met", detail: "Method template", insertText: "public ${1:void} ${2:methodName}(${3}) {\n\t${4}\n}", documentation: "New method" },
  { label: "smet", detail: "Static method", insertText: "public static ${1:void} ${2:methodName}(${3}) {\n\t${4}\n}", documentation: "Static method" },
  { label: "tostr", detail: "toString override", insertText: "@Override\npublic String toString() {\n\treturn ${1:\"\"};\n}", documentation: "Override toString" },

  // === Loops ===
  { label: "fori", detail: "for (int i = 0; ...)", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}", documentation: "Indexed for loop" },
  { label: "forr", detail: "Reverse for loop", insertText: "for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n\t${3}\n}", documentation: "Reverse for loop" },
  { label: "fore", detail: "for-each loop", insertText: "for (${1:Type} ${2:item} : ${3:collection}) {\n\t${4}\n}", documentation: "Enhanced for loop" },
  { label: "while", detail: "while loop", insertText: "while (${1:condition}) {\n\t${2}\n}", documentation: "While loop" },
  { label: "itar", detail: "Iterate array", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:arr}.length; ${1:i}++) {\n\t${3}\n}", documentation: "Iterate over array" },

  // === Control Flow ===
  { label: "ifelse", detail: "if-else block", insertText: "if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}", documentation: "If-else statement" },
  { label: "trycatch", detail: "try-catch block", insertText: "try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${4:e.printStackTrace();}\n}", documentation: "Try-catch block" },
  { label: "tryf", detail: "try-finally block", insertText: "try {\n\t${1}\n} finally {\n\t${2}\n}", documentation: "Try-finally block" },
  { label: "swtch", detail: "switch statement", insertText: "switch (${1:variable}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n\t\tbreak;\n}", documentation: "Switch statement" },

  // === Collections ===
  { label: "lst", detail: "ArrayList", insertText: "List<${1:Integer}> ${2:list} = new ArrayList<>();", documentation: "New ArrayList" },
  { label: "ArrayList", detail: "ArrayList declaration", insertText: "ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();", documentation: "ArrayList class" },
  { label: "List", detail: "List declaration", insertText: "List<${1:Integer}> ${2:list} = new ArrayList<>();", documentation: "List interface" },
  { label: "ll", detail: "LinkedList", insertText: "LinkedList<${1:Integer}> ${2:list} = new LinkedList<>();", documentation: "New LinkedList" },
  { label: "LinkedList", detail: "LinkedList declaration", insertText: "LinkedList<${1:Integer}> ${2:list} = new LinkedList<>();", documentation: "LinkedList class" },
  { label: "map", detail: "HashMap", insertText: "Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();", documentation: "New HashMap" },
  { label: "HashMap", detail: "HashMap declaration", insertText: "HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();", documentation: "HashMap class" },
  { label: "Map", detail: "Map declaration", insertText: "Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();", documentation: "Map interface" },
  { label: "tmap", detail: "TreeMap", insertText: "TreeMap<${1:Integer}, ${2:Integer}> ${3:map} = new TreeMap<>();", documentation: "New TreeMap (sorted)" },
  { label: "TreeMap", detail: "TreeMap declaration", insertText: "TreeMap<${1:Integer}, ${2:Integer}> ${3:map} = new TreeMap<>();", documentation: "TreeMap class" },
  { label: "lhm", detail: "LinkedHashMap", insertText: "LinkedHashMap<${1:String}, ${2:Integer}> ${3:map} = new LinkedHashMap<>();", documentation: "New LinkedHashMap (insertion order)" },
  { label: "set", detail: "HashSet", insertText: "Set<${1:Integer}> ${2:set} = new HashSet<>();", documentation: "New HashSet" },
  { label: "HashSet", detail: "HashSet declaration", insertText: "HashSet<${1:Integer}> ${2:set} = new HashSet<>();", documentation: "HashSet class" },
  { label: "Set", detail: "Set declaration", insertText: "Set<${1:Integer}> ${2:set} = new HashSet<>();", documentation: "Set interface" },
  { label: "tset", detail: "TreeSet", insertText: "TreeSet<${1:Integer}> ${2:set} = new TreeSet<>();", documentation: "New TreeSet (sorted)" },
  { label: "TreeSet", detail: "TreeSet declaration", insertText: "TreeSet<${1:Integer}> ${2:set} = new TreeSet<>();", documentation: "TreeSet class" },
  { label: "lhs", detail: "LinkedHashSet", insertText: "LinkedHashSet<${1:Integer}> ${2:set} = new LinkedHashSet<>();", documentation: "New LinkedHashSet" },
  { label: "st", detail: "Stack", insertText: "Stack<${1:Integer}> ${2:stack} = new Stack<>();", documentation: "New Stack" },
  { label: "Stack", detail: "Stack declaration", insertText: "Stack<${1:Integer}> ${2:stack} = new Stack<>();", documentation: "Stack class" },
  { label: "que", detail: "Queue (LinkedList)", insertText: "Queue<${1:Integer}> ${2:queue} = new LinkedList<>();", documentation: "New Queue" },
  { label: "Queue", detail: "Queue declaration", insertText: "Queue<${1:Integer}> ${2:queue} = new LinkedList<>();", documentation: "Queue interface" },
  { label: "deq", detail: "Deque (ArrayDeque)", insertText: "Deque<${1:Integer}> ${2:deque} = new ArrayDeque<>();", documentation: "New ArrayDeque" },
  { label: "Deque", detail: "Deque declaration", insertText: "Deque<${1:Integer}> ${2:deque} = new ArrayDeque<>();", documentation: "Deque interface" },
  { label: "pq", detail: "PriorityQueue (min)", insertText: "PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();", documentation: "Min-heap PriorityQueue" },
  { label: "PriorityQueue", detail: "PriorityQueue declaration", insertText: "PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();", documentation: "PriorityQueue class" },
  { label: "pqmax", detail: "PriorityQueue (max)", insertText: "PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Collections.reverseOrder());", documentation: "Max-heap PriorityQueue" },
  { label: "pqcust", detail: "PriorityQueue custom comparator", insertText: "PriorityQueue<${1:int[]}> ${2:pq} = new PriorityQueue<>((a, b) -> ${3:a[0] - b[0]});", documentation: "PriorityQueue with custom comparator" },

  // === Arrays ===
  { label: "arr", detail: "Array declaration", insertText: "${1:int}[] ${2:arr} = new ${1:int}[${3:n}];", documentation: "New array" },
  { label: "arr2d", detail: "2D Array", insertText: "${1:int}[][] ${2:arr} = new ${1:int}[${3:n}][${4:m}];", documentation: "New 2D array" },
  { label: "arrf", detail: "Arrays.fill", insertText: "Arrays.fill(${1:arr}, ${2:value});", documentation: "Fill array" },
  { label: "arrs", detail: "Arrays.sort", insertText: "Arrays.sort(${1:arr});", documentation: "Sort array" },
  { label: "arrsc", detail: "Arrays.sort custom", insertText: "Arrays.sort(${1:arr}, (a, b) -> ${2:a[0] - b[0]});", documentation: "Sort with comparator" },
  { label: "arrcpy", detail: "Arrays.copyOf", insertText: "int[] ${1:copy} = Arrays.copyOf(${2:arr}, ${3:arr.length});", documentation: "Copy array" },
  { label: "arrbs", detail: "Binary search", insertText: "int ${1:idx} = Arrays.binarySearch(${2:arr}, ${3:key});", documentation: "Binary search in sorted array" },

  // === Scanner / IO ===
  { label: "sc", detail: "Scanner", insertText: "Scanner ${1:sc} = new Scanner(System.in);", documentation: "New Scanner" },
  { label: "Scanner", detail: "Scanner declaration", insertText: "Scanner ${1:sc} = new Scanner(System.in);", documentation: "Scanner class" },
  { label: "br", detail: "BufferedReader", insertText: "BufferedReader ${1:br} = new BufferedReader(new InputStreamReader(System.in));", documentation: "BufferedReader for fast input" },
  { label: "pw", detail: "PrintWriter", insertText: "PrintWriter ${1:out} = new PrintWriter(new BufferedOutputStream(System.out));", documentation: "PrintWriter for fast output" },
  { label: "stk", detail: "StringTokenizer", insertText: "StringTokenizer ${1:st} = new StringTokenizer(${2:br.readLine()});", documentation: "StringTokenizer for parsing" },
  { label: "nxi", detail: "nextInt()", insertText: "${1:sc}.nextInt()", documentation: "Read int" },
  { label: "nxl", detail: "nextLong()", insertText: "${1:sc}.nextLong()", documentation: "Read long" },
  { label: "nxd", detail: "nextDouble()", insertText: "${1:sc}.nextDouble()", documentation: "Read double" },
  { label: "nxs", detail: "next()", insertText: "${1:sc}.next()", documentation: "Read string" },
  { label: "nxln", detail: "nextLine()", insertText: "${1:sc}.nextLine()", documentation: "Read line" },

  // === Collections utility ===
  { label: "colsort", detail: "Collections.sort", insertText: "Collections.sort(${1:list});", documentation: "Sort list" },
  { label: "colrev", detail: "Collections.reverse", insertText: "Collections.reverse(${1:list});", documentation: "Reverse list" },
  { label: "colmin", detail: "Collections.min", insertText: "Collections.min(${1:list})", documentation: "Min of collection" },
  { label: "colmax", detail: "Collections.max", insertText: "Collections.max(${1:list})", documentation: "Max of collection" },
  { label: "colfreq", detail: "Collections.frequency", insertText: "Collections.frequency(${1:list}, ${2:element})", documentation: "Count occurrences" },
  { label: "colswap", detail: "Collections.swap", insertText: "Collections.swap(${1:list}, ${2:i}, ${3:j});", documentation: "Swap elements" },

  // === Strings ===
  { label: "sb", detail: "StringBuilder", insertText: "StringBuilder ${1:sb} = new StringBuilder();", documentation: "New StringBuilder" },
  { label: "sba", detail: "sb.append()", insertText: "${1:sb}.append(${2});", documentation: "Append to StringBuilder" },
  { label: "str2arr", detail: "String to char[]", insertText: "char[] ${1:chars} = ${2:str}.toCharArray();", documentation: "String to char array" },
  { label: "str2int", detail: "String to int", insertText: "int ${1:num} = Integer.parseInt(${2:str});", documentation: "Parse string to int" },
  { label: "int2str", detail: "int to String", insertText: "String ${1:str} = String.valueOf(${2:num});", documentation: "Int to string" },

  // === Math ===
  { label: "mathmax", detail: "Math.max", insertText: "Math.max(${1:a}, ${2:b})", documentation: "Maximum of two" },
  { label: "mathmin", detail: "Math.min", insertText: "Math.min(${1:a}, ${2:b})", documentation: "Minimum of two" },
  { label: "mathabs", detail: "Math.abs", insertText: "Math.abs(${1:a})", documentation: "Absolute value" },
  { label: "mathpow", detail: "Math.pow", insertText: "(int) Math.pow(${1:base}, ${2:exp})", documentation: "Power" },
  { label: "mathsqrt", detail: "Math.sqrt", insertText: "Math.sqrt(${1:n})", documentation: "Square root" },
  { label: "intmax", detail: "Integer.MAX_VALUE", insertText: "Integer.MAX_VALUE", documentation: "Int max value" },
  { label: "intmin", detail: "Integer.MIN_VALUE", insertText: "Integer.MIN_VALUE", documentation: "Int min value" },
  { label: "lmax", detail: "Long.MAX_VALUE", insertText: "Long.MAX_VALUE", documentation: "Long max value" },
  { label: "mod", detail: "MOD = 1e9+7", insertText: "static final int MOD = 1_000_000_007;", documentation: "Modular arithmetic constant" },
  { label: "gcd", detail: "GCD function", insertText: "static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }", documentation: "Greatest common divisor" },
  { label: "lcm", detail: "LCM function", insertText: "static long lcm(long a, long b) { return a / gcd(a, b) * b; }", documentation: "Least common multiple" },
  { label: "modpow", detail: "Modular exponentiation", insertText: "static long modPow(long x, long y, long m) {\n\tlong res = 1; x %= m;\n\twhile (y > 0) { if ((y & 1) == 1) res = res * x % m; x = x * x % m; y >>= 1; }\n\treturn res;\n}", documentation: "Fast power with mod" },
  { label: "bsearch", detail: "Binary search template", insertText: "int lo = ${1:0}, hi = ${2:n - 1}, ans = -1;\nwhile (lo <= hi) {\n\tint mid = lo + (hi - lo) / 2;\n\tif (${3:check(mid)}) {\n\t\tans = mid;\n\t\tlo = mid + 1;\n\t} else {\n\t\thi = mid - 1;\n\t}\n}", documentation: "Binary search template" },
];

export const ALL_SNIPPETS = [...BASIC_SNIPPETS, ...CP_TEMPLATE_SNIPPETS];

export const PRIORITY_LABELS = new Set([
  "main", "psvm", "sout", "ArrayList", "HashMap", "List", "Set", "Map", "Scanner", "PriorityQueue",
  "fastio", "fasttemplate", "graphtemplate", "cptemplate", "dsu", "segtree", "bit", "dijkstra", "bfs",
]);
