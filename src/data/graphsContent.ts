import { ContentSection } from "./recursionContent";

export const graphsContent: ContentSection[] = [
  {
    id: "graph-intro",
    title: "Graph Representation",
    difficulty: "Easy",
    theory: [
      "A Graph G = (V, E) consists of a set of Vertices (nodes) V and a set of Edges E connecting pairs of vertices. Graphs model networks, maps, dependencies, and countless real-world problems. Think of cities connected by roads, friends in a social network, or tasks with dependencies — all are graphs.",
      "Directed Graph (Digraph): Edges have direction — edge (u,v) goes FROM u TO v. Think of one-way streets or Twitter follows. Undirected Graph: Edges have no direction — edge {u,v} connects u and v symmetrically, like Facebook friendships or two-way roads.",
      "Weighted Graph: Edges have associated weights/costs (e.g., distances, travel times, bandwidths). Unweighted: all edges have equal weight (often 1). In competitive programming, always check if the graph is weighted or unweighted — it determines which algorithm to use.",
      "Three primary representations: Adjacency Matrix (O(V²) space, O(1) edge lookup), Adjacency List (O(V+E) space, efficient for sparse graphs), Edge List (O(E) space, simple for edge-centric algorithms like Kruskal's MST).",
      "Key graph terminology: Degree of a vertex = number of edges connected to it. In directed graphs: in-degree (edges coming in) and out-degree (edges going out). A path is a sequence of vertices connected by edges. A cycle is a path that starts and ends at the same vertex.",
      "Connected Graph: Every vertex is reachable from every other (undirected). Strongly Connected: Every vertex reachable from every other via directed paths. A tree is a connected acyclic undirected graph with exactly V-1 edges. A forest is a collection of trees.",
      "In competitive programming, 99% of the time you'll use Adjacency List. Use Adjacency Matrix only when V ≤ 1000 and you need O(1) edge lookups. Use Edge List for Kruskal's MST or when you process edges one by one.",
    ],
    diagram: {
      type: "table-visual",
      title: "Graph Representations Comparison",
      data: [
        {
          label: "Adjacency List",
          color: "success",
          children: [
            { label: "Space: O(V + E)" },
            { label: "Edge lookup: O(degree)" },
            { label: "Best for: sparse graphs (E << V²)" },
            { label: "⭐ Most common in CP" }
          ]
        },
        {
          label: "Adjacency Matrix",
          color: "info",
          children: [
            { label: "Space: O(V²)" },
            { label: "Edge lookup: O(1)" },
            { label: "Best for: dense graphs, V ≤ 1000" },
            { label: "Floyd-Warshall, small graphs" }
          ]
        },
        {
          label: "Edge List",
          color: "accent",
          children: [
            { label: "Space: O(E)" },
            { label: "Edge lookup: O(E)" },
            { label: "Best for: edge-centric algorithms" },
            { label: "Kruskal's MST, Bellman-Ford" }
          ]
        },
        {
          label: "Graph Types",
          color: "warning",
          children: [
            { label: "Directed vs Undirected" },
            { label: "Weighted vs Unweighted" },
            { label: "Cyclic vs Acyclic (DAG)" },
            { label: "Connected vs Disconnected" }
          ]
        }
      ]
    },
    keyPoints: [
      "Always clarify: directed vs undirected, weighted vs unweighted, cyclic vs acyclic",
      "Adjacency List is the default choice — O(V+E) space, efficient iteration",
      "For dense graphs (E ≈ V²), adjacency matrix may be faster due to cache locality",
      "Tree = connected graph with V-1 edges = connected acyclic graph",
      "Self-loops and multi-edges: check if the problem allows them",
    ],
    tip: "When reading graph problems, always ask: (1) Directed or undirected? (2) Weighted? (3) Can there be cycles? (4) Is it connected? These determine your algorithm choice.",
    code: [
      {
        title: "Graph Representations in Java",
        language: "java",
        content: `import java.util.*;

public class GraphRepresentation {
    
    // ==================== ADJACENCY LIST (most common) ====================
    // Space: O(V + E), Best for sparse graphs
    
    static class Graph {
        int vertices;
        List<List<Integer>> adj;      // Unweighted
        List<List<int[]>> adjWeighted; // Weighted: [neighbor, weight]
        
        Graph(int v) {
            vertices = v;
            adj = new ArrayList<>();
            adjWeighted = new ArrayList<>();
            for (int i = 0; i < v; i++) {
                adj.add(new ArrayList<>());
                adjWeighted.add(new ArrayList<>());
            }
        }
        
        // Undirected edge
        void addEdge(int u, int v) {
            adj.get(u).add(v);
            adj.get(v).add(u);
        }
        
        // Directed weighted edge
        void addDirectedWeightedEdge(int u, int v, int w) {
            adjWeighted.get(u).add(new int[]{v, w});
        }
    }
    
    // ==================== ADJACENCY MATRIX ====================
    // Space: O(V²), O(1) edge lookup, good for dense graphs
    
    static class MatrixGraph {
        int[][] matrix;
        int v;
        
        MatrixGraph(int v) {
            this.v = v;
            matrix = new int[v][v];
        }
        
        void addEdge(int u, int v, int w) {
            matrix[u][v] = w;
            matrix[v][u] = w; // Remove for directed
        }
        
        boolean hasEdge(int u, int v) {
            return matrix[u][v] != 0;
        }
    }
    
    public static void main(String[] args) {
        Graph g = new Graph(5);
        g.addEdge(0, 1); g.addEdge(0, 4);
        g.addEdge(1, 2); g.addEdge(1, 3); g.addEdge(1, 4);
        g.addEdge(2, 3); g.addEdge(3, 4);
        
        System.out.println("Adjacency List:");
        for (int i = 0; i < 5; i++)
            System.out.println(i + " → " + g.adj.get(i));
    }
}`,
      },
    ],
    table: {
      headers: ["Representation", "Space", "Add Edge", "Check Edge", "Neighbors", "Best For"],
      rows: [
        ["Adjacency List", "O(V+E)", "O(1)", "O(degree)", "O(degree)", "Sparse graphs"],
        ["Adjacency Matrix", "O(V²)", "O(1)", "O(1)", "O(V)", "Dense graphs"],
        ["Edge List", "O(E)", "O(1)", "O(E)", "O(E)", "Edge-centric algos"],
      ],
    },
  },
  {
    id: "graph-bfs",
    title: "BFS — Breadth First Search",
    difficulty: "Easy",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V) for queue and visited array",
    theory: [
      "BFS explores vertices **level by level** using a queue (FIFO). Think of it as a **fire spreading on a graph**: at step 0 only the source is on fire; at each step, the fire at each vertex spreads to all unvisited neighbors. The 'ring of fire' expands by one unit at each iteration.",
      "BFS guarantees the **shortest path** (in terms of number of edges) in an unweighted graph. This is because it processes vertices in order of their distance from the source. The first time you reach a vertex, it's via the shortest path.",
      "**Path reconstruction**: Maintain a parent array `p[]` where `p[v]` = the vertex from which v was discovered. To reconstruct the shortest path to vertex u, backtrack: `u → p[u] → p[p[u]] → ... → source`, then reverse.",
      "When to use BFS vs DFS: Use BFS when you need shortest path in unweighted graphs, level-by-level processing, or when the solution is close to the root. Use DFS when you need to explore all paths, detect cycles, find connected components, or do topological sorting.",
      "**Multi-source BFS**: Start BFS from multiple sources simultaneously by putting all sources in the queue initially. This gives shortest distance from ANY source. Used in problems like 'minimum distance from any 0', 'rotting oranges', or 'walls and gates'.",
      "**0-1 BFS**: For graphs with edge weights 0 or 1, use a deque instead of a queue. Add 0-weight edges to the front and 1-weight edges to the back. This gives shortest paths in O(V+E) without needing Dijkstra.",
      "**Shortest cycle**: Start BFS from each vertex; as soon as we try to go back to the source, we've found the shortest cycle through that vertex. Take the minimum over all sources.",
      "**Edges on shortest path**: Run BFS from both a and b. Edge (u,v) lies on some shortest a→b path iff `d_a[u] + 1 + d_b[v] = d_a[b]`.",
      "BFS on implicit graphs: Sometimes the graph isn't given explicitly. You generate neighbors on the fly. For example, in Word Ladder, each word is a node, and two words are connected if they differ by one character. BFS finds the shortest transformation sequence.",
      "Time complexity is O(V + E) because each vertex is enqueued and dequeued exactly once, and each edge is examined exactly once (twice for undirected graphs).",
    ],
    keyPoints: [
      "BFS uses a Queue (FIFO) — always process the oldest discovered node first",
      "Mark nodes as visited WHEN ADDING TO QUEUE, not when processing — prevents duplicates",
      "BFS gives shortest path only in unweighted graphs — use Dijkstra for weighted",
      "Multi-source BFS: add ALL sources to queue initially with distance 0",
      "Level-by-level processing: use queue.size() to process one level at a time",
      "0-1 BFS: use deque, push 0-weight to front, 1-weight to back — O(V+E)",
      "Path reconstruction: maintain parent array p[], backtrack from target to source",
      "BFS on grids: use direction arrays dr[] = {0,0,1,-1}, dc[] = {1,-1,0,0}",
    ],
    tip: "A common mistake is marking a node as visited when you PROCESS it (poll from queue) instead of when you ADD it to the queue. This causes the same node to be added multiple times, wasting time and potentially giving wrong answers.",
    warning: "BFS does NOT work for shortest paths in weighted graphs. If edges have different weights, BFS may find a path with fewer edges but higher total weight. Use Dijkstra's algorithm instead. For 0/1 weights, use 0-1 BFS with a deque.",
    code: [
      {
        title: "BFS — Complete with Applications",
        language: "java",
        content: `import java.util.*;

public class BFS {
    
    // ==================== BASIC BFS ====================
    
    public static void bfs(List<List<Integer>> adj, int start, int V) {
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new LinkedList<>();
        
        visited[start] = true;
        queue.offer(start);
        
        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " ");
            
            for (int neighbor : adj.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
    }
    
    // ==================== SHORTEST PATH (unweighted) ====================
    
    public static int[] shortestPath(List<List<Integer>> adj, int start, int V) {
        int[] dist = new int[V];
        Arrays.fill(dist, -1);
        Queue<Integer> queue = new LinkedList<>();
        
        dist[start] = 0;
        queue.offer(start);
        
        while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int neighbor : adj.get(node)) {
                if (dist[neighbor] == -1) {
                    dist[neighbor] = dist[node] + 1;
                    queue.offer(neighbor);
                }
            }
        }
        return dist;
    }
    
    // ==================== BIPARTITE CHECK ====================
    // A graph is bipartite if we can 2-color it with no same-color neighbors
    
    public static boolean isBipartite(List<List<Integer>> adj, int V) {
        int[] color = new int[V];
        Arrays.fill(color, -1);
        
        for (int start = 0; start < V; start++) {
            if (color[start] != -1) continue;
            
            Queue<Integer> queue = new LinkedList<>();
            queue.offer(start);
            color[start] = 0;
            
            while (!queue.isEmpty()) {
                int node = queue.poll();
                for (int neighbor : adj.get(node)) {
                    if (color[neighbor] == -1) {
                        color[neighbor] = 1 - color[node]; // Alternate colors
                        queue.offer(neighbor);
                    } else if (color[neighbor] == color[node]) {
                        return false; // Same color adjacent — not bipartite!
                    }
                }
            }
        }
        return true;
    }
    
    // ==================== MULTI-SOURCE BFS ====================
    // 0-1 Matrix: distance of each cell from nearest 0
    
    public static int[][] zeroOneMatrix(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] dist = new int[m][n];
        Queue<int[]> queue = new LinkedList<>();
        boolean[][] visited = new boolean[m][n];
        
        // Start BFS from ALL 0-cells simultaneously
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (matrix[i][j] == 0) {
                    queue.offer(new int[]{i, j});
                    visited[i][j] = true;
                    dist[i][j] = 0;
                } else {
                    dist[i][j] = Integer.MAX_VALUE;
                }
            }
        }
        
        int[] dr = {0, 0, 1, -1};
        int[] dc = {1, -1, 0, 0};
        
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    dist[nr][nc] = dist[r][c] + 1;
                    visited[nr][nc] = true;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return dist;
    }
    
    // ==================== WORD LADDER (BFS on implicit graph) ====================
    
    public static int wordLadder(String begin, String end, List<String> wordList) {
        Set<String> wordSet = new HashSet<>(wordList);
        if (!wordSet.contains(end)) return 0;
        
        Queue<String> queue = new LinkedList<>();
        queue.offer(begin);
        int steps = 1;
        
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                String word = queue.poll();
                char[] chars = word.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char original = chars[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[j] = c;
                        String next = new String(chars);
                        if (next.equals(end)) return steps + 1;
                        if (wordSet.contains(next)) {
                            queue.offer(next);
                            wordSet.remove(next); // Mark visited
                        }
                    }
                    chars[j] = original;
                }
            }
            steps++;
        }
        return 0;
    }
}`,
      },
      {
        title: "BFS — Path Reconstruction",
        language: "java",
        content: `// Reconstruct shortest path from source to target using parent array
public static List<Integer> reconstructPath(List<List<Integer>> adj, int source, int target, int V) {
    int[] dist = new int[V];
    int[] parent = new int[V];
    Arrays.fill(dist, -1);
    Arrays.fill(parent, -1);
    Queue<Integer> queue = new LinkedList<>();
    
    dist[source] = 0;
    queue.offer(source);
    
    while (!queue.isEmpty()) {
        int v = queue.poll();
        for (int u : adj.get(v)) {
            if (dist[u] == -1) {
                dist[u] = dist[v] + 1;
                parent[u] = v;
                queue.offer(u);
            }
        }
    }
    
    if (dist[target] == -1) return Collections.emptyList(); // No path
    
    // Backtrack from target to source
    List<Integer> path = new ArrayList<>();
    for (int v = target; v != -1; v = parent[v])
        path.add(v);
    Collections.reverse(path);
    return path;
}`
      },
      {
        title: "0-1 BFS — Shortest Path with 0/1 Weights",
        language: "java",
        content: `// For graphs where edge weights are 0 or 1
// Use Deque: push 0-weight edges to FRONT, 1-weight edges to BACK
// Gives shortest path in O(V + E) — no need for Dijkstra!

public static int[] bfs01(List<List<int[]>> adj, int source, int V) {
    // adj.get(u) = list of {neighbor, weight} where weight is 0 or 1
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;
    
    Deque<Integer> deque = new ArrayDeque<>();
    deque.offerFirst(source);
    
    while (!deque.isEmpty()) {
        int v = deque.pollFirst();
        for (int[] edge : adj.get(v)) {
            int u = edge[0], w = edge[1];
            if (dist[v] + w < dist[u]) {
                dist[u] = dist[v] + w;
                if (w == 0) deque.offerFirst(u);  // 0-weight → front
                else deque.offerLast(u);           // 1-weight → back
            }
        }
    }
    return dist;
}
// Common use: grid where some moves are free and others cost 1`
      },
    ],
  },
  {
    id: "graph-dfs",
    title: "DFS — Depth First Search",
    difficulty: "Easy",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V) for recursion stack",
    theory: [
      "DFS explores as **deep as possible** along each branch before backtracking. Uses a stack (implicit via recursion or explicit). Think of navigating a maze: go straight as far as you can, hit a dead end, backtrack to the last junction, try the next path.",
      "DFS finds the **lexicographically first path** from source to each vertex (if adjacency lists are sorted). It finds shortest paths in **trees** (where only one simple path exists), but NOT in general graphs.",
      "**Edge classification**: DFS creates a DFS tree with four edge types: (1) **Tree edges** — edges in the DFS tree. (2) **Back edges** — point to an ancestor, indicate a **CYCLE**. (3) **Forward edges** — point to a descendant (directed graphs only). (4) **Cross edges** — point to a visited non-ancestor (directed graphs only).",
      "**Theorem**: In an undirected graph, DFS classifies every edge as either a tree edge or a back edge. Forward and cross edges **only exist in directed graphs**. This is because in an undirected graph, if u is visited before v, either (u,v) is a tree edge or v is an ancestor of u (back edge).",
      "**Entry/exit times**: Track `tin[v]` (when DFS enters v) and `tout[v]` (when DFS exits v). Vertex u is an ancestor of v iff `tin[u] < tin[v]` AND `tout[u] > tout[v]`. This ancestor check runs in O(1) and is used in LCA, bridges, and many other algorithms.",
      "**3-color DFS**: Color vertices WHITE(0) = unvisited, GRAY(1) = in recursion stack (entered but not exited), BLACK(2) = fully processed. A back edge to a GRAY vertex means cycle in directed graphs. This is the standard cycle detection approach.",
      "Cycle detection differs for directed vs undirected. In **undirected**: cycle exists if we visit an already-visited node that's NOT the parent. In **directed**: use 3-color — back edge to GRAY node means cycle.",
      "**Applications**: Cycle detection, topological sort (vertices in descending order of exit time), connected/strongly connected components (Tarjan's, Kosaraju's), bridges & articulation points, path finding, flood fill, counting islands.",
      "DFS vs BFS: DFS uses O(h) stack space where h = max depth (could be O(V)). DFS is preferred for: detecting cycles, topological sort, finding all paths, solving puzzles with backtracking.",
    ],
    keyPoints: [
      "DFS uses Stack (LIFO) — recursion is an implicit stack",
      "Back edge to an ancestor = cycle detected (undirected: back edge to non-parent)",
      "For directed cycle detection, use 3-color: WHITE/GRAY/BLACK",
      "Entry/exit times: u is ancestor of v iff tin[u] < tin[v] AND tout[u] > tout[v]",
      "DFS tree classifies edges: tree, back (both graphs), forward, cross (directed only)",
      "Topological sort = vertices in descending order of DFS exit time",
      "Time: O(V+E) — each vertex and edge visited once",
      "Grid DFS: mark cell as visited by changing its value (e.g., '1' → '0')",
    ],
    tip: "For grid-based DFS problems (like Number of Islands), you often don't need a separate visited array — just modify the grid itself (e.g., sink '1' to '0'). This saves space and simplifies the code.",
    warning: "Be careful with DFS recursion depth! Java's default stack size is ~512KB, allowing roughly 5000-10000 recursive calls. For large graphs (V > 10000), use iterative DFS with an explicit stack, or increase stack size with -Xss flag.",
    code: [
      {
        title: "DFS — All Key Applications",
        language: "java",
        content: `import java.util.*;

public class DFS {
    
    static int timer = 0;
    
    // ==================== BASIC DFS ====================
    
    public static void dfs(List<List<Integer>> adj, int node, boolean[] visited) {
        visited[node] = true;
        System.out.print(node + " ");
        
        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                dfs(adj, neighbor, visited);
            }
        }
    }
    
    // ==================== CYCLE DETECTION ====================
    
    // Undirected graph — cycle exists if we visit an already-visited node
    // that is NOT the parent (to avoid false positives on tree edges)
    public static boolean hasCycleUndirected(List<List<Integer>> adj, int V) {
        boolean[] visited = new boolean[V];
        for (int i = 0; i < V; i++) {
            if (!visited[i] && dfsCycleUndirected(adj, i, -1, visited))
                return true;
        }
        return false;
    }
    
    private static boolean dfsCycleUndirected(List<List<Integer>> adj, int node,
                                               int parent, boolean[] visited) {
        visited[node] = true;
        for (int neighbor : adj.get(node)) {
            if (!visited[neighbor]) {
                if (dfsCycleUndirected(adj, neighbor, node, visited)) return true;
            } else if (neighbor != parent) {
                return true; // Back edge — cycle found!
            }
        }
        return false;
    }
    
    // Directed graph — uses 3-color: WHITE(0), GRAY(1=in-stack), BLACK(2=done)
    public static boolean hasCycleDirected(List<List<Integer>> adj, int V) {
        int[] color = new int[V]; // 0=unvisited, 1=in stack, 2=done
        for (int i = 0; i < V; i++) {
            if (color[i] == 0 && dfsCycleDirected(adj, i, color))
                return true;
        }
        return false;
    }
    
    private static boolean dfsCycleDirected(List<List<Integer>> adj, int node, int[] color) {
        color[node] = 1; // Mark as being processed (in recursion stack)
        for (int neighbor : adj.get(node)) {
            if (color[neighbor] == 1) return true;   // Back edge — cycle!
            if (color[neighbor] == 0 && dfsCycleDirected(adj, neighbor, color))
                return true;
        }
        color[node] = 2; // Mark as fully processed
        return false;
    }
    
    // ==================== CONNECTED COMPONENTS ====================
    
    public static int countComponents(List<List<Integer>> adj, int V) {
        boolean[] visited = new boolean[V];
        int components = 0;
        for (int i = 0; i < V; i++) {
            if (!visited[i]) {
                dfs(adj, i, visited);
                components++;
            }
        }
        return components;
    }
    
    // ==================== FLOOD FILL ====================
    
    public static int[][] floodFill(int[][] image, int sr, int sc, int color) {
        int orig = image[sr][sc];
        if (orig != color) fill(image, sr, sc, orig, color);
        return image;
    }
    
    private static void fill(int[][] img, int r, int c, int orig, int newColor) {
        if (r < 0 || r >= img.length || c < 0 || c >= img[0].length) return;
        if (img[r][c] != orig) return;
        img[r][c] = newColor;
        fill(img, r+1, c, orig, newColor);
        fill(img, r-1, c, orig, newColor);
        fill(img, r, c+1, orig, newColor);
        fill(img, r, c-1, orig, newColor);
    }
    
    // ==================== NUMBER OF ISLANDS ====================
    
    public static int numIslands(char[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    sinkIsland(grid, i, j);
                    count++;
                }
            }
        }
        return count;
    }
    
    private static void sinkIsland(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0'; // Sink this cell
        sinkIsland(grid, r+1, c); sinkIsland(grid, r-1, c);
        sinkIsland(grid, r, c+1); sinkIsland(grid, r, c-1);
    }
}`,
      },
      {
        title: "DFS with Entry/Exit Times & Edge Classification",
        language: "java",
        content: `// Entry/exit times are fundamental to many advanced graph algorithms
// tin[v] = when DFS enters v, tout[v] = when DFS exits v
// Ancestor check: u is ancestor of v iff tin[u] < tin[v] AND tout[u] > tout[v]

static int timer = 0;
static int[] tin, tout, color;
// color: 0=WHITE(unvisited), 1=GRAY(in stack), 2=BLACK(done)

static void dfsWithTimes(List<List<Integer>> adj, int v) {
    tin[v] = timer++;
    color[v] = 1; // GRAY — currently in recursion stack
    
    for (int u : adj.get(v)) {
        if (color[u] == 0) {
            // Tree edge: v → u (u is unvisited)
            dfsWithTimes(adj, u);
        } else if (color[u] == 1) {
            // Back edge: v → u (u is GRAY = ancestor, means CYCLE)
        } else {
            // u is BLACK (fully processed)
            if (tin[v] < tin[u]) {
                // Forward edge: v → u (u is descendant)
            } else {
                // Cross edge: v → u (u is in different subtree)
            }
        }
    }
    
    color[v] = 2; // BLACK — fully processed
    tout[v] = timer++;
}

static boolean isAncestor(int u, int v) {
    return tin[u] < tin[v] && tout[u] > tout[v]; // O(1) check!
}

// Usage:
// timer = 0;
// tin = new int[V]; tout = new int[V]; color = new int[V];
// for (int i = 0; i < V; i++) if (color[i] == 0) dfsWithTimes(adj, i);`
      },
      {
        title: "Iterative DFS — Avoids Stack Overflow",
        language: "java",
        content: `// For large graphs (V > 10000), recursive DFS may cause StackOverflow
// Use explicit stack instead

public static void dfsIterative(List<List<Integer>> adj, int start, int V) {
    boolean[] visited = new boolean[V];
    Deque<Integer> stack = new ArrayDeque<>();
    
    stack.push(start);
    while (!stack.isEmpty()) {
        int v = stack.pop();
        if (visited[v]) continue;
        visited[v] = true;
        
        // Process vertex v here
        
        // Push neighbors in reverse order for same traversal order as recursive
        List<Integer> neighbors = adj.get(v);
        for (int i = neighbors.size() - 1; i >= 0; i--) {
            if (!visited[neighbors.get(i)]) {
                stack.push(neighbors.get(i));
            }
        }
    }
}
// Safe for graphs with millions of vertices`
      },
    ],
  },
  {
    id: "graph-dijkstra",
    title: "Dijkstra's Algorithm",
    difficulty: "Hard",
    timeComplexity: "O((V + E) log V) with priority queue",
    spaceComplexity: "O(V + E)",
    theory: [
      "Dijkstra finds shortest paths from a single source to all other vertices in a weighted graph with **NON-NEGATIVE** edge weights. Published by Edsger W. Dijkstra in 1959. The most important shortest path algorithm in competitive programming.",
      "**Algorithm**: Maintain d[v] = current shortest distance. Initially d[s]=0, all others ∞. At each step: pick the **unmarked vertex v with smallest d[v]**, mark it (finalize), and **relax** all outgoing edges: d[to] = min(d[to], d[v] + w(v,to)). After n iterations, all vertices are finalized.",
      "**Correctness proof (from cp-algorithms)**: After vertex v is finalized, d[v] is optimal. Proof by induction: Let P be the shortest path to v, split into finalized part (ending at q) and unfinalized part (starting at p). Since p was relaxed from q: d[p] = optimal. Since weights ≥ 0: d[p] ≤ d[v]. But v was chosen as minimum: d[v] ≤ d[p]. Therefore d[v] = d[p] = optimal.",
      "Why it fails with negative weights: If an edge has weight -5, a vertex we already 'finalized' could be reached through this negative edge with a smaller total distance. The greedy assumption breaks. Example: A→B (weight 1), A→C (weight 3), C→B (weight -5). Dijkstra finalizes B with distance 1, but the actual shortest path is A→C→B = -2.",
      "**Two implementations**: (1) **O(n² + m) — dense graphs**: scan all vertices to find minimum, no priority queue needed. Optimal when m ≈ n². (2) **O((n + m) log n) — sparse graphs**: use min-heap (PQ). The 'lazy deletion' trick: instead of decrease-key, push new entries and skip stale ones when polled.",
      "**Path reconstruction**: Maintain predecessor array p[] where p[to] = v whenever d[to] is improved through v. Backtrack from target to source using p[], then reverse.",
      "**Optimization**: Stop early when target is popped from PQ (single-target query). For 0/1 weights only, use **0-1 BFS** with deque instead — O(V+E) without logarithmic overhead.",
      "Dijkstra on grids: Treat each cell as a node with 4 neighbors. Edge weight = cost to enter neighbor. Use PQ with {cost, row, col}. Very common in CP!",
    ],
    keyPoints: [
      "Only works with NON-NEGATIVE edge weights — this is the key constraint",
      "Greedy: once a vertex is finalized (popped from PQ), its distance is optimal",
      "Skip stale entries: if d > dist[u] when we pop, skip (lazy deletion)",
      "Java PQ: use Comparator.comparingInt(a -> a[0]) for min-heap on distance",
      "For dense graphs (E ≈ V²), Dijkstra with adjacency matrix is O(V²) — sometimes better",
      "Common mistake: not skipping stale entries → TLE or wrong answers",
    ],
    tip: "In competitive programming, always use the 'lazy deletion' variant of Dijkstra: push new {dist, vertex} pairs and skip stale ones. Never try to remove old entries from the PQ — it's O(n) per removal.",
    note: "If the problem has edge weights 0 and 1 only, use 0-1 BFS with a deque instead of Dijkstra — it's O(V+E) instead of O((V+E) log V). Push 0-weight edges to front, 1-weight to back.",
    code: [
      {
        title: "Dijkstra — Standard & Optimized",
        language: "java",
        content: `import java.util.*;

public class Dijkstra {
    
    // Standard Dijkstra with Priority Queue
    // adj: adjacency list of [neighbor, weight] pairs
    public static int[] dijkstra(List<List<int[]>> adj, int src, int V) {
        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        
        // Min-heap: [distance, vertex]
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.offer(new int[]{0, src});
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int d = curr[0], u = curr[1];
            
            if (d > dist[u]) continue; // Outdated entry — skip
            
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.offer(new int[]{dist[v], v});
                }
            }
        }
        return dist;
    }
    
    // Dijkstra with path reconstruction
    public static List<Integer> shortestPath(List<List<int[]>> adj, int src, int dst, int V) {
        int[] dist = new int[V];
        int[] prev = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(prev, -1);
        dist[src] = 0;
        
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.offer(new int[]{0, src});
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int d = curr[0], u = curr[1];
            if (d > dist[u]) continue;
            if (u == dst) break; // Found destination
            
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    prev[v] = u;
                    pq.offer(new int[]{dist[v], v});
                }
            }
        }
        
        // Reconstruct path
        List<Integer> path = new ArrayList<>();
        for (int v = dst; v != -1; v = prev[v]) path.add(v);
        Collections.reverse(path);
        return dist[dst] == Integer.MAX_VALUE ? new ArrayList<>() : path;
    }
    
    // Dijkstra on grid — common in competitive programming
    public static int minCostPath(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = grid[0][0];
        
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.offer(new int[]{grid[0][0], 0, 0});
        
        int[] dr = {0,0,1,-1};
        int[] dc = {1,-1,0,0};
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int cost = curr[0], r = curr[1], c = curr[2];
            if (cost > dist[r][c]) continue;
            
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    int newCost = dist[r][c] + grid[nr][nc];
                    if (newCost < dist[nr][nc]) {
                        dist[nr][nc] = newCost;
                        pq.offer(new int[]{newCost, nr, nc});
                    }
                }
            }
        }
        return dist[m-1][n-1];
    }
}`,
      },
    ],
  },
  {
    id: "graph-bellman",
    title: "Bellman-Ford & SPFA",
    difficulty: "Hard",
    timeComplexity: "O(VE) — O(E) average with SPFA",
    spaceComplexity: "O(V + E)",
    theory: [
      "**Bellman-Ford** finds shortest paths from a single source in O(VE), even with **negative edge weights**. Published by Bellman (1958) and Ford (1956). The key advantage over Dijkstra: it handles negative weights and detects negative-weight cycles.",
      "**Algorithm**: Initialize d[s]=0, all others ∞. Perform V-1 **phases**. In each phase, iterate over ALL edges (u,v,w) and relax: if d[u] + w < d[v], update d[v] = d[u] + w. Why V-1 phases? The shortest path has at most V-1 edges (in a graph with no negative cycles). After phase k, all shortest paths using ≤ k edges are correct.",
      "**Negative cycle detection**: After V-1 phases, perform one more phase. If ANY edge can still be relaxed, a negative-weight cycle exists that's reachable from the source. This is because a negative cycle can always be traversed to reduce the total distance infinitely.",
      "**Finding the negative cycle** (from CPHB): Track which vertex x was last relaxed in the V-th phase. Then follow predecessors from x for exactly V steps — this guarantees entering the cycle. From there, trace the cycle by following predecessors until you return to the same vertex.",
      "**Important guard**: Always check `if (d[u] < INF)` before relaxing edge (u,v). Without this, computing ∞ + negative_weight can underflow, producing bogus small values for unreachable vertices.",
      "**Early termination optimization**: Track a boolean `relaxed` per phase. If no relaxation occurs in a phase, all distances are already optimal — terminate early. This dramatically improves average-case performance though worst case remains O(VE).",
      "**SPFA (Shortest Path Faster Algorithm)**: Queue-based optimization. Instead of scanning ALL edges in each phase, only re-process vertices whose distances actually changed. Maintain a queue and an `inQueue[]` boolean array. Average case O(E), worst case still O(VE). Extremely popular in competitive programming, especially on CSES and Codeforces.",
      "**When to use**: (1) Graph has negative edge weights → must use Bellman-Ford, not Dijkstra. (2) Need to detect negative cycles → run V-th phase check. (3) Arbitrage detection (currency exchange) → take negative log of exchange rates, detect negative cycles. (4) Difference constraints → model x_j - x_i ≤ w_ij as edge i→j with weight w_ij.",
    ],
    keyPoints: [
      "V-1 phases guarantee shortest paths (each phase fixes paths with one more edge)",
      "V-th phase detects negative cycles — if anything relaxes, cycle exists",
      "SPFA: queue-based optimization, O(E) average, O(VE) worst case",
      "Always guard: if (d[u] < INF) before relaxation to avoid underflow",
      "Arbitrage detection: negative log of exchange rates → find negative cycle",
      "Difference constraints: x_j - x_i ≤ w_ij maps to graph edge i→j with weight w",
    ],
    tip: "SPFA is banned on some competitive programming judges (e.g., certain Codeforces problems) because its worst case is O(VE). In such cases, use Dijkstra with Johnson's reweighting to handle negative edges.",
    warning: "Bellman-Ford is O(VE) — much slower than Dijkstra's O((V+E) log V). Only use it when the graph has negative weights or you need negative cycle detection.",
    code: [
      {
        title: "Bellman-Ford — Negative Cycle Detection & SPFA",
        language: "java",
        content: `import java.util.*;

public class BellmanFord {
    
    // ==================== STANDARD BELLMAN-FORD ====================
    
    public static int[] bellmanFord(int V, int[][] edges, int src) {
        int[] dist = new int[V];
        int[] parent = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(parent, -1);
        dist[src] = 0;
        
        // V-1 phases
        for (int i = 0; i < V - 1; i++) {
            boolean relaxed = false;
            for (int[] edge : edges) {
                int u = edge[0], v = edge[1], w = edge[2];
                if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    parent[v] = u;
                    relaxed = true;
                }
            }
            if (!relaxed) break; // Early termination — no change means done
        }
        
        // V-th phase: check for negative cycles
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                System.out.println("Negative cycle detected!");
                return null;
            }
        }
        return dist;
    }
    
    // ==================== FIND THE ACTUAL NEGATIVE CYCLE ====================
    
    public static List<Integer> findNegativeCycle(int V, int[][] edges) {
        int[] dist = new int[V];
        int[] parent = new int[V];
        Arrays.fill(parent, -1);
        int x = -1; // Vertex relaxed in V-th phase
        
        for (int i = 0; i < V; i++) {
            x = -1;
            for (int[] edge : edges) {
                int u = edge[0], v = edge[1], w = edge[2];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    parent[v] = u;
                    x = v;
                }
            }
        }
        
        if (x == -1) return Collections.emptyList(); // No negative cycle
        
        // x might not be ON the cycle, but is reachable from it
        // Go back V times to guarantee we're inside the cycle
        int y = x;
        for (int i = 0; i < V; i++) y = parent[y];
        
        // Now y is definitely on the cycle — trace it
        List<Integer> cycle = new ArrayList<>();
        int cur = y;
        do {
            cycle.add(cur);
            cur = parent[cur];
        } while (cur != y);
        cycle.add(y);
        Collections.reverse(cycle);
        return cycle;
    }
    
    // ==================== SPFA (Shortest Path Faster Algorithm) ====================
    // Queue-based Bellman-Ford optimization — O(E) average
    
    public static int[] spfa(List<List<int[]>> adj, int src, int V) {
        int[] dist = new int[V];
        boolean[] inQueue = new boolean[V];
        int[] cnt = new int[V]; // Count times vertex entered queue (for cycle detection)
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(src);
        inQueue[src] = true;
        
        while (!queue.isEmpty()) {
            int u = queue.poll();
            inQueue[u] = false;
            
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (!inQueue[v]) {
                        queue.offer(v);
                        inQueue[v] = true;
                        cnt[v]++;
                        if (cnt[v] >= V) {
                            System.out.println("Negative cycle detected!");
                            return null;
                        }
                    }
                }
            }
        }
        return dist;
    }
    
    public static void main(String[] args) {
        // Graph with negative edges (but no negative cycle)
        int[][] edges = {{0,1,4},{0,2,5},{1,3,-3},{2,1,2},{3,2,1}};
        int[] dist = bellmanFord(4, edges, 0);
        if (dist != null) System.out.println("Distances: " + Arrays.toString(dist));
        // [0, 4, 2, 1]
    }
}`,
      },
    ],
  },
  {
    id: "graph-floyd",
    title: "Bellman-Ford & Floyd-Warshall",
    difficulty: "Hard",
    timeComplexity: "Bellman-Ford: O(VE) | Floyd-Warshall: O(V³)",
    spaceComplexity: "O(V) | O(V²)",
    theory: [
      "**Bellman-Ford** handles negative edge weights and detects negative cycles. Published by Bellman (1958) and Ford (1956). Works by relaxing ALL edges n-1 times. Why n-1? The shortest path has at most n-1 edges, and after iteration k all paths using ≤ k edges are optimal.",
      "**Relaxation**: For each edge (u,v,w): if d[u] + w < d[v], update d[v]. **Important guard**: check `if (d[u] < INF)` before computing — prevents producing incorrect values like ∞-1 for unreachable vertices with negative edges.",
      "**Early termination**: Track whether any relaxation occurred per phase. If no relaxation happens → all distances are optimal, stop early. Doesn't improve worst-case O(VE) but dramatically speeds up average case.",
      "**Negative cycle detection**: After n-1 phases, run one more. If ANY edge can still be relaxed → negative cycle exists. To **find the cycle**: track predecessors, find vertex x relaxed in phase n, follow predecessors n times to enter the cycle, then trace it.",
      "**SPFA (Shortest Path Faster Algorithm)**: Queue-based optimization of Bellman-Ford — only re-relax vertices whose distances actually changed. Uses a queue and a boolean 'in_queue' array. Average O(E), worst-case O(VE). Very popular in competitive programming.",
      "**Floyd-Warshall** finds **ALL-PAIRS** shortest paths in O(n³). The DP: d[i][j] = min(d[i][j], d[i][k] + d[k][j]) for intermediate vertex k. **Critical**: the outer loop MUST be k (intermediate), not i or j — otherwise dependencies aren't satisfied.",
      "**Floyd-Warshall key insight**: Before phase k, d[i][j] stores the shortest path using only vertices {0,...,k-1} as intermediates. At phase k, we consider whether routing through k improves any path. Updates can be done **in-place** — improving through k cannot worsen future phases.",
      "**Negative cycle detection in Floyd-Warshall**: After the algorithm, d[i][i] < 0 for any i means vertex i lies on a negative cycle. **Path reconstruction**: maintain p[i][j] = last intermediate vertex that improved d[i][j], then recursively reconstruct.",
      "**Transitive closure**: Floyd-Warshall variant with boolean OR instead of min+add. reach[i][j] |= (reach[i][k] && reach[k][j]). Determines reachability between all pairs in O(n³).",
    ],
    keyPoints: [
      "Bellman-Ford: O(VE) — slower than Dijkstra but handles negative weights",
      "V-1 iterations suffice because shortest paths have at most V-1 edges",
      "Extra iteration (V-th) detects negative cycles — if anything relaxes, cycle exists",
      "Floyd-Warshall: O(V³) — practical only for small graphs (V ≤ 500)",
      "Floyd-Warshall loop order must be: k (intermediate) → i (source) → j (destination)",
      "Use Floyd-Warshall when you need distances between ALL pairs, V is small",
    ],
    tip: "SPFA (Shortest Path Faster Algorithm) is an optimization of Bellman-Ford using a queue. It's faster in practice (often O(E)) but has the same worst-case O(VE). Very popular in competitive programming.",
    warning: "Floyd-Warshall loop order is critical! The outer loop MUST be the intermediate vertex k. If you put i or j as the outer loop, the algorithm gives wrong answers because dependencies aren't satisfied.",
    code: [
      {
        title: "Bellman-Ford & Floyd-Warshall",
        language: "java",
        content: `import java.util.*;

public class AllPairsShortestPath {
    
    // ==================== BELLMAN-FORD ====================
    
    public static int[] bellmanFord(int V, int[][] edges, int src) {
        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        
        // Relax all edges V-1 times
        for (int i = 0; i < V - 1; i++) {
            for (int[] edge : edges) {
                int u = edge[0], v = edge[1], w = edge[2];
                if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                }
            }
        }
        
        // Check for negative cycles (V-th relaxation)
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                System.out.println("Negative cycle detected!");
                return null;
            }
        }
        return dist;
    }
    
    // ==================== FLOYD-WARSHALL ====================
    
    static final int INF = Integer.MAX_VALUE / 2;
    
    public static int[][] floydWarshall(int[][] graph, int V) {
        int[][] dist = new int[V][V];
        
        // Initialize: dist[i][j] = direct edge weight (or INF if no edge)
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                dist[i][j] = graph[i][j];
            }
        }
        
        // Try each vertex as intermediate node
        for (int k = 0; k < V; k++) {
            for (int i = 0; i < V; i++) {
                for (int j = 0; j < V; j++) {
                    // If path through k is shorter
                    if (dist[i][k] != INF && dist[k][j] != INF
                            && dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
        
        // Detect negative cycles: dist[i][i] < 0 means i is in a negative cycle
        for (int i = 0; i < V; i++) {
            if (dist[i][i] < 0) {
                System.out.println("Negative cycle exists!");
                return null;
            }
        }
        return dist;
    }
    
    public static void main(String[] args) {
        // Bellman-Ford example
        int[][] edges = {{0,1,4},{0,2,5},{1,3,-3},{2,1,2},{3,2,1}};
        int[] dist = bellmanFord(4, edges, 0);
        if (dist != null) System.out.println("Bellman-Ford: " + Arrays.toString(dist));
        
        // Floyd-Warshall example
        int[][] graph = {
            {0,   3,   INF, 5  },
            {2,   0,   INF, 4  },
            {INF, 1,   0,   INF},
            {INF, INF, 2,   0  }
        };
        int[][] all = floydWarshall(graph, 4);
        System.out.println("\nAll-pairs shortest paths:");
        for (int[] row : all) System.out.println(Arrays.toString(row));
    }
}`,
      },
    ],
  },
  {
    id: "graph-mst",
    title: "Minimum Spanning Tree",
    difficulty: "Hard",
    timeComplexity: "Kruskal: O(E log E) | Prim: O((V+E) log V)",
    spaceComplexity: "O(V + E)",
    theory: [
      "A Minimum Spanning Tree (MST) of a weighted undirected graph is a subset of edges that connects ALL vertices with the minimum possible total edge weight. It has exactly V-1 edges and no cycles — it's a tree.",
      "**MST Properties** (from cp-algorithms): (1) If all edge weights are **distinct**, the MST is **unique**. (2) MST is also the tree with **minimum product** of edge weights (proved by replacing weights with logarithms). (3) The **maximum weight edge** in the MST is the minimum possible among all spanning trees. (4) **Maximum spanning tree** can be found by negating all edge weights and running any MST algorithm.",
      "**Cut Property** (why MST algorithms work): For any cut (partition of vertices into two groups), the lightest edge crossing the cut must be in the MST. **Proof**: Suppose the lightest cut edge e is NOT in MST T. Adding e to T creates a cycle, which must cross the cut again via some heavier edge e'. Swapping e' for e gives a lighter tree — contradiction.",
      "**Cycle Property**: The heaviest edge in any cycle does NOT belong to the MST (assuming distinct weights). Kruskal's skips cycle-forming edges; Prim's never adds them.",
      "**Kruskal's Algorithm** (Joseph Kruskal, 1956): Sort all edges by weight. Iterate in ascending order. For each edge, if it connects two different components (checked via Union-Find), add it to the MST. Time: O(M log M + M·α(N)) ≈ O(M log M).",
      "**Prim's Algorithm**: Start from any vertex. Maintain a set of vertices in the MST. At each step, add the minimum weight edge connecting MST to non-MST vertex. Uses a priority queue. Time: O((V+E) log V). Better for dense graphs.",
      "**Borůvka's Algorithm** (O(E log V)): Each component finds its cheapest outgoing edge simultaneously, then merges. Repeat until one component remains. Runs in O(log V) phases (components halve each phase). **Key advantage**: easily parallelizable, and useful for MST with special cost functions.",
      "When to use which: Kruskal's is simplest (90% of CP). Prim's is better for dense graphs (E ≈ V²). Borůvka's for parallel/online settings or when edges have implicit structure.",
      "MST has a special property: the maximum weight edge on the unique path between any two vertices in the MST is minimized. This is the **minimax path** / **bottleneck spanning tree** property.",
      "**Second-best MST** (from cp-algorithms): For each non-MST edge (u,v), adding it creates a cycle. The second-best MST replaces the heaviest MST edge on the u→v path with (u,v). Use **LCA with binary lifting** storing max edge weights — O(n log n) preprocessing, O(log n) per query. Total: O(E log V).",
      "MST applications: Network design, clustering (remove k-1 heaviest edges), second-best MST, bottleneck shortest path, Steiner tree approximation.",
    ],
    keyPoints: [
      "MST has exactly V-1 edges and connects all V vertices",
      "Kruskal's: sort edges + Union-Find — O(E log E)",
      "Prim's: priority queue from a starting vertex — O((V+E) log V)",
      "Borůvka's: O(E log V), each phase halves the number of components",
      "Cut property: the minimum weight edge crossing any cut belongs to the MST",
      "Cycle property: the heaviest edge in any cycle is NOT in the MST",
      "If all edge weights are distinct, the MST is unique",
      "Second-best MST: O(E log V) using LCA with max edge on path",
    ],
    tip: "In competitive programming, always use Kruskal's with Union-Find. It's the simplest to code and handles most MST problems. For second-best MST, precompute max edge on MST paths using binary lifting.",
    code: [
      {
        title: "Kruskal's & Prim's MST",
        language: "java",
        content: `import java.util.*;

public class MinimumSpanningTree {
    
    // ==================== UNION-FIND (DSU) ====================
    
    static int[] parent, rank;
    
    static void init(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // Path compression
        return parent[x];
    }
    
    static boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false; // Same component — would form cycle
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
    
    // ==================== KRUSKAL'S ALGORITHM ====================
    
    public static int kruskal(int V, int[][] edges) {
        // Sort edges by weight
        Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
        init(V);
        
        int mstWeight = 0, edgesUsed = 0;
        List<int[]> mstEdges = new ArrayList<>();
        
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (union(u, v)) {       // Doesn't form cycle
                mstWeight += w;
                mstEdges.add(edge);
                edgesUsed++;
                if (edgesUsed == V - 1) break; // MST has V-1 edges
            }
        }
        
        System.out.println("MST Edges (Kruskal):");
        for (int[] e : mstEdges)
            System.out.printf("  %d -- %d (weight %d)%n", e[0], e[1], e[2]);
        return mstWeight;
    }
    
    // ==================== PRIM'S ALGORITHM ====================
    
    public static int prims(List<List<int[]>> adj, int V) {
        boolean[] inMST = new boolean[V];
        int[] key = new int[V]; // Min weight edge to connect vertex to MST
        Arrays.fill(key, Integer.MAX_VALUE);
        key[0] = 0;
        
        // Min-heap: [weight, vertex]
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.offer(new int[]{0, 0});
        int mstWeight = 0;
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int w = curr[0], u = curr[1];
            
            if (inMST[u]) continue;
            inMST[u] = true;
            mstWeight += w;
            
            for (int[] edge : adj.get(u)) {
                int v = edge[0], weight = edge[1];
                if (!inMST[v] && weight < key[v]) {
                    key[v] = weight;
                    pq.offer(new int[]{key[v], v});
                }
            }
        }
        return mstWeight;
    }
    
    public static void main(String[] args) {
        int[][] edges = {{0,1,10},{0,2,6},{0,3,5},{1,3,15},{2,3,4}};
        System.out.println("MST Weight (Kruskal): " + kruskal(4, edges)); // 19
    }
}`,
      },
    ],
  },
  {
    id: "graph-topo",
    title: "Topological Sort & SCC",
    difficulty: "Hard",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "Topological Sort: Linear ordering of vertices in a DAG (Directed Acyclic Graph) such that for every directed edge u→v, u appears before v in the ordering. Think of it as ordering variables so that constraints like 'a < b' are satisfied.",
      "Topological sort only exists for DAGs (Directed Acyclic Graphs). If the graph has a cycle, no valid ordering exists. **Topological order can be non-unique** — if vertices a, b, c exist where a→b and a→c but no path between b and c, both [a,b,c] and [a,c,b] are valid.",
      "**DFS-based approach** (from cp-algorithms): Run DFS, append vertex v to a list when dfs(v) finishes (post-order). **Proof of correctness**: For any edge v→u, when dfs(v) is called, either (1) u is already visited (u finishes before v), or (2) u is unvisited → dfs(u) is called and finishes before dfs(v). Either way, u appears earlier in post-order, later in reversed order. So v appears before u in the reversed list ✓.",
      "**Kahn's Algorithm (BFS-based)**: Start with all nodes having in-degree 0, process them, reduce in-degrees of neighbors, add new 0-in-degree nodes. If processed count < V → cycle exists. Use a **min-heap** instead of queue for lexicographically smallest order.",
      "**Shortest paths in a DAG** (from cp-algorithms): Relax edges in topological order — O(V+E). For each vertex u in topo order, for each edge u→v with weight w: d[v] = min(d[v], d[u] + w). This works even with **negative edges** (unlike Dijkstra) because there are no cycles. Also works for longest path (negate weights or use max).",
      "**Counting paths in DAG**: Process in topo order. cnt[v] = Σ cnt[u] for all u→v. This counts the number of distinct paths from source to each vertex.",
      "Classic applications: Course scheduling (prerequisites), build systems (Makefile), task scheduling, compilation order, dependency resolution in package managers, shortest/longest paths in DAG, critical path method (CPM) in project management.",
      "**Strongly Connected Components (SCC)**: A subset C ⊆ V is an SCC if: (1) for all u,v ∈ C with u≠v, there's a path from u to v AND from v to u, and (2) C is **maximal** (no vertex can be added). SCCs **partition** the vertex set — every vertex belongs to exactly one SCC.",
      "**Condensation graph**: Replace each SCC with a single node. The result is always a **DAG** (acyclic by definition — if two SCCs had a cycle between them, they'd be one SCC). This lets you solve problems on cyclic directed graphs by reducing to DAG problems. Example: find the minimum number of vertices from which all other vertices are reachable = count nodes with in-degree 0 in the condensation.",
      "**Kosaraju's Algorithm** (O(V+E)): Based on the theorem that if edge C→C' exists in the condensation, then t_out[C] > t_out[C']. Step 1: DFS on original graph, record exit times. Step 2: DFS on transposed graph in decreasing exit time order. Each DFS tree in step 2 is one SCC.",
    ],
    keyPoints: [
      "Topological sort ONLY exists for DAGs — no cycles allowed",
      "Kahn's: BFS with in-degree tracking, naturally detects cycles",
      "DFS topo sort: post-order DFS, then reverse the order",
      "Shortest path in DAG: relax in topo order — O(V+E), works with negative edges",
      "Longest path in DAG: negate weights + shortest path, or use max instead of min",
      "If Kahn's processes fewer than V nodes, the graph has a cycle",
      "Use min-heap in Kahn's for lexicographically smallest topo order",
      "Course Schedule = check if topo sort exists = check if DAG",
      "Condensation: in-degree 0 nodes = minimum sources to reach everything",
    ],
    tip: "For 'Course Schedule' type problems: if you just need to check if valid ordering exists, Kahn's is easiest — just check if the result has all V nodes. If you need the actual ordering, both approaches work.",
    note: "Topological sort is not unique — a DAG can have many valid orderings. For shortest/longest paths in DAGs, topo sort + relaxation is faster than Dijkstra/Bellman-Ford and handles negative weights.",
    code: [
      {
        title: "Topological Sort & Kosaraju's SCC",
        language: "java",
        content: `import java.util.*;

public class TopoSortSCC {
    
    // ==================== KAHN'S ALGORITHM (BFS Topo Sort) ====================
    
    public static List<Integer> kahnTopoSort(List<List<Integer>> adj, int V) {
        int[] inDegree = new int[V];
        for (int u = 0; u < V; u++)
            for (int v : adj.get(u)) inDegree[v]++;
        
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < V; i++)
            if (inDegree[i] == 0) queue.offer(i);
        
        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : adj.get(u)) {
                inDegree[v]--;
                if (inDegree[v] == 0) queue.offer(v);
            }
        }
        
        if (order.size() != V) {
            System.out.println("Cycle detected — no topological order!");
            return new ArrayList<>();
        }
        return order;
    }
    
    // DFS-based Topo Sort
    public static List<Integer> dfsTopoSort(List<List<Integer>> adj, int V) {
        boolean[] visited = new boolean[V];
        Deque<Integer> stack = new ArrayDeque<>();
        
        for (int i = 0; i < V; i++)
            if (!visited[i]) toposDFS(adj, i, visited, stack);
        
        List<Integer> result = new ArrayList<>(stack);
        return result;
    }
    
    private static void toposDFS(List<List<Integer>> adj, int u, boolean[] visited, Deque<Integer> stack) {
        visited[u] = true;
        for (int v : adj.get(u))
            if (!visited[v]) toposDFS(adj, v, visited, stack);
        stack.push(u); // Add AFTER all descendants (post-order)
    }
    
    // ==================== KOSARAJU'S SCC ====================
    
    public static List<List<Integer>> kosarajuSCC(List<List<Integer>> adj, int V) {
        // Step 1: DFS on original graph, push to stack by finish time
        boolean[] visited = new boolean[V];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < V; i++)
            if (!visited[i]) dfsFirst(adj, i, visited, stack);
        
        // Step 2: Build reversed graph
        List<List<Integer>> revAdj = new ArrayList<>();
        for (int i = 0; i < V; i++) revAdj.add(new ArrayList<>());
        for (int u = 0; u < V; u++)
            for (int v : adj.get(u)) revAdj.get(v).add(u);
        
        // Step 3: DFS on reversed graph in stack order
        Arrays.fill(visited, false);
        List<List<Integer>> sccs = new ArrayList<>();
        
        while (!stack.isEmpty()) {
            int node = stack.pop();
            if (!visited[node]) {
                List<Integer> scc = new ArrayList<>();
                dfsSecond(revAdj, node, visited, scc);
                sccs.add(scc);
            }
        }
        return sccs;
    }
    
    private static void dfsFirst(List<List<Integer>> adj, int u, boolean[] visited, Deque<Integer> stack) {
        visited[u] = true;
        for (int v : adj.get(u)) if (!visited[v]) dfsFirst(adj, v, visited, stack);
        stack.push(u);
    }
    
    private static void dfsSecond(List<List<Integer>> adj, int u, boolean[] visited, List<Integer> scc) {
        visited[u] = true;
        scc.add(u);
        for (int v : adj.get(u)) if (!visited[v]) dfsSecond(adj, v, visited, scc);
    }
    
    // Course Schedule (classic topo sort application)
    public static boolean canFinishCourses(int n, int[][] prereqs) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] p : prereqs) adj.get(p[1]).add(p[0]);
        return kahnTopoSort(adj, n).size() == n;
    }
    
    public static void main(String[] args) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 6; i++) adj.add(new ArrayList<>());
        adj.get(5).add(2); adj.get(5).add(0);
        adj.get(4).add(0); adj.get(4).add(1);
        adj.get(2).add(3); adj.get(3).add(1);
        
        System.out.println("Topological Order: " + kahnTopoSort(adj, 6));
        System.out.println("Can finish 2 courses [[1,0]]: " + canFinishCourses(2, new int[][]{{1,0}}));
    }
}`,
      },
    ],
  },
  {
    id: "graph-dsu",
    title: "Union-Find (DSU)",
    difficulty: "Medium",
    timeComplexity: "O(α(n)) per operation — nearly O(1)",
    spaceComplexity: "O(n)",
    theory: [
      "**Disjoint Set Union** (DSU), also called Union-Find, provides three operations: `make_set(v)` — create a singleton set, `find_set(v)` — return the representative (root) of v's set, `union_sets(a, b)` — merge the sets containing a and b. Used whenever we need to dynamically merge groups and query connectivity.",
      "Sets are stored as **trees**: each tree = one set, root = representative. `parent[v]` points to v's parent; root has parent[root] = root. Naive implementation: find walks up to root O(n), union attaches one root to another O(1). Worst case: degenerate chain → O(n) per find.",
      "**Path Compression**: During find(v), make every node on the path point directly to the root. Implementation: `parent[v] = find(parent[v])` — one line! Alone gives amortized O(log n). Visualization: a tall tree gets flattened to a star after one find call.",
      "**Union by Size/Rank**: Always attach the **smaller** tree under the root of the **larger** tree. This limits tree height to O(log n). Implementation: maintain size[] array; on union, compare sizes, attach smaller under larger, update size of new root.",
      "Both optimizations together: amortized **O(α(n))** per operation, where α is the inverse Ackermann function. For all practical n (< 10^80), α(n) ≤ 4. Effectively constant time.",
      "**Advanced applications** (from cp-algorithms): (1) **Storing extra info** — maintain distances to root, edge weights, or parity along paths. (2) **Offline RMQ** — answer range minimum queries using DSU. (3) **Kruskal's MST** — process edges in sorted order, use DSU to check/merge components. (4) **Connected components on grid images** — union adjacent same-color cells. (5) **Painting subarrays offline** — process queries in reverse, use DSU to skip already-painted cells.",
    ],
    keyPoints: [
      "Two operations: find(x) returns root, union(x,y) merges sets",
      "Path compression: parent[x] = find(parent[x]) — one line, huge speedup",
      "Union by rank: attach smaller tree under larger — keeps trees balanced",
      "Both optimizations together: amortized O(α(n)) ≈ O(1) per operation",
      "Track component count: decrement on each successful union",
      "Track component size: size[root] += size[other] during union",
    ],
    tip: "Always implement BOTH path compression AND union by rank. Path compression alone gives amortized O(log n). Union by rank alone gives O(log n). Together they give O(α(n)) ≈ O(1). It's free performance!",
    code: [
      {
        title: "DSU — Full Implementation & Applications",
        language: "java",
        content: `public class DSU {
    int[] parent, rank, size;
    int components;
    
    DSU(int n) {
        parent = new int[n]; rank = new int[n]; size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    
    // Path compression — O(α(n)) amortized
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    
    // Union by rank
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        size[px] += size[py];
        if (rank[px] == rank[py]) rank[px]++;
        components--;
        return true;
    }
    
    boolean connected(int x, int y) { return find(x) == find(y); }
    int getSize(int x) { return size[find(x)]; }
    
    // Application: Number of Provinces
    public static int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        DSU dsu = new DSU(n);
        for (int i = 0; i < n; i++)
            for (int j = i+1; j < n; j++)
                if (isConnected[i][j] == 1) dsu.union(i, j);
        return dsu.components;
    }
    
    // Application: Redundant Connection (detect first cycle-forming edge)
    public static int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        DSU dsu = new DSU(n + 1);
        for (int[] edge : edges)
            if (!dsu.union(edge[0], edge[1])) return edge;
        return new int[]{};
    }
    
    public static void main(String[] args) {
        DSU dsu = new DSU(5);
        dsu.union(0, 1); dsu.union(1, 2); dsu.union(3, 4);
        System.out.println("Components: " + dsu.components); // 2
        System.out.println("0 and 2 connected? " + dsu.connected(0, 2)); // true
        System.out.println("0 and 3 connected? " + dsu.connected(0, 3)); // false
    }
}`,
      },
    ],
  },
  {
    id: "graph-scc",
    title: "Strongly Connected Components",
    difficulty: "Expert",
    timeComplexity: "O(V + E) — Tarjan's / Kosaraju's",
    spaceComplexity: "O(V)",
    theory: [
      "A **Strongly Connected Component** (SCC) is a maximal subset C ⊆ V where every vertex can reach every other vertex via directed paths. SCCs partition the vertex set — SCC(G) = {C₁, C₂, ...} where C_i ∩ C_j = ∅ and ∪C_i = V.",
      "**Kosaraju's Algorithm** (O(V+E)): Based on the key theorem: if there's an edge from SCC C to C' in the condensation graph, then t_out[C] > t_out[C']. This means processing vertices in decreasing exit time on the transposed graph isolates each SCC. Step 1: DFS on G, record exit order. Step 2: DFS on G^T in reverse exit order.",
      "**Tarjan's Algorithm**: Single DFS pass using discovery time (disc) and low-link values. low[u] = minimum disc reachable from u's subtree via back edges. A node u is the **root** of an SCC when low[u] == disc[u]. Maintain an explicit stack; when root is found, pop all nodes down to u — that's the SCC.",
      "**Condensation Graph**: Replace each SCC with a single node — the result is always a **DAG** (if two SCCs formed a cycle, they'd be one SCC). The condensation is the most important property — it converts cyclic directed graph problems into DAG problems solvable with topological sort.",
      "Applications: **2-SAT** (formula with clauses of 2 literals — satisfiable iff no variable and its negation are in the same SCC), finding cycles in dependencies, deadlock detection, compiler optimizations, reachability queries on directed graphs.",
    ],
    keyPoints: [
      "Tarjan's is preferred in competitive programming (single pass, no graph reversal)",
      "The condensation DAG can be processed with topological sort",
      "Every single node in a DAG is its own SCC",
      "2-SAT problem reduces to finding SCCs — solved in O(V+E)",
    ],
    code: [
      {
        title: "Tarjan's SCC — Single Pass O(V+E)",
        language: "java",
        content: `import java.util.*;

public class TarjanSCC {
    
    private int timer = 0;
    private int[] disc, low;
    private boolean[] onStack;
    private Deque<Integer> stack;
    private List<List<Integer>> sccs;
    
    public List<List<Integer>> findSCCs(List<List<Integer>> adj, int V) {
        disc = new int[V];
        low = new int[V];
        onStack = new boolean[V];
        stack = new ArrayDeque<>();
        sccs = new ArrayList<>();
        Arrays.fill(disc, -1); // -1 = unvisited
        
        for (int i = 0; i < V; i++)
            if (disc[i] == -1) dfs(adj, i);
        
        return sccs;
    }
    
    private void dfs(List<List<Integer>> adj, int u) {
        disc[u] = low[u] = timer++;
        stack.push(u);
        onStack[u] = true;
        
        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                dfs(adj, v);
                low[u] = Math.min(low[u], low[v]); // Propagate low-link up
            } else if (onStack[v]) {
                // v is in the current DFS stack — back edge within same SCC
                low[u] = Math.min(low[u], disc[v]);
            }
        }
        
        // u is root of an SCC if low[u] == disc[u]
        if (low[u] == disc[u]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int w = stack.pop();
                onStack[w] = false;
                scc.add(w);
                if (w == u) break;
            }
            sccs.add(scc);
        }
    }
    
    // ==================== CONDENSATION DAG ====================
    // Build DAG of SCCs (each SCC is one node)
    
    public static List<List<Integer>> buildCondensationDAG(
            List<List<Integer>> adj, List<List<Integer>> sccs, int V) {
        
        int[] comp = new int[V]; // comp[v] = SCC index of vertex v
        for (int i = 0; i < sccs.size(); i++)
            for (int v : sccs.get(i)) comp[v] = i;
        
        int n = sccs.size();
        Set<Long> seen = new HashSet<>();
        List<List<Integer>> dag = new ArrayList<>();
        for (int i = 0; i < n; i++) dag.add(new ArrayList<>());
        
        for (int u = 0; u < V; u++) {
            for (int v : adj.get(u)) {
                int cu = comp[u], cv = comp[v];
                if (cu != cv) { // Edge between different SCCs
                    long key = (long) cu * n + cv;
                    if (seen.add(key)) dag.get(cu).add(cv);
                }
            }
        }
        return dag;
    }
    
    // ==================== 2-SAT USING SCC ====================
    // 2-SAT: Boolean formula with clauses of exactly 2 literals (a OR b)
    // Satisfiability check in O(V+E) using Tarjan's SCC
    
    public static boolean twoSAT(int n, int[][] clauses) {
        // 2n nodes: x_i = 2i, NOT x_i = 2i+1
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 2 * n; i++) adj.add(new ArrayList<>());
        
        for (int[] clause : clauses) {
            // Clause: a OR b  → (NOT a → b) AND (NOT b → a)
            int a = clause[0], b = clause[1]; // Positive = 2i, Negative = 2i+1
            adj.get(a ^ 1).add(b);  // NOT a implies b
            adj.get(b ^ 1).add(a);  // NOT b implies a
        }
        
        TarjanSCC tarjan = new TarjanSCC();
        List<List<Integer>> sccs = tarjan.findSCCs(adj, 2 * n);
        
        int[] comp = new int[2 * n];
        for (int i = 0; i < sccs.size(); i++)
            for (int v : sccs.get(i)) comp[v] = i;
        
        // Formula is satisfiable iff no variable and its negation are in the same SCC
        for (int i = 0; i < n; i++) {
            if (comp[2 * i] == comp[2 * i + 1]) return false;
        }
        return true;
    }
    
    public static void main(String[] args) {
        // Graph: 0→1→2→0 (SCC), 1→3→4→3 (SCC: 3,4), 2→4
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 5; i++) adj.add(new ArrayList<>());
        adj.get(0).add(1); adj.get(1).add(2); adj.get(2).add(0); // SCC: {0,1,2}
        adj.get(1).add(3); adj.get(3).add(4); adj.get(4).add(3); // SCC: {3,4}
        adj.get(2).add(4);
        
        TarjanSCC tarjan = new TarjanSCC();
        List<List<Integer>> sccs = tarjan.findSCCs(adj, 5);
        System.out.println("SCCs found: " + sccs.size()); // 3
        for (int i = 0; i < sccs.size(); i++)
            System.out.println("SCC " + i + ": " + sccs.get(i));
    }
}`,
      },
    ],
  },
  {
    id: "graph-bridges",
    title: "Bridges & Articulation Points",
    difficulty: "Expert",
    timeComplexity: "O(V + E) — Tarjan's algorithm",
    spaceComplexity: "O(V)",
    theory: [
      "**Bridge**: An edge whose removal increases the number of connected components. Think of it as an 'important road' — removing it disconnects some pair of cities. Algorithm runs in O(N+M) using a single DFS pass.",
      "**Articulation Point** (Cut Vertex): A vertex whose removal (along with its edges) increases the number of connected components.",
      "**low[v] array** (from cp-algorithms): low[v] = min of: (1) tin[v] itself, (2) tin[p] for every back-edge (v,p), and (3) low[to] for every tree-edge child to. Intuitively, low[v] is the earliest discovery time reachable from v's subtree using at most one back edge.",
      "**Bridge condition**: Tree edge (v, to) is a bridge iff **low[to] > tin[v]** — meaning the subtree of 'to' has no back edge to v or any ancestor of v. Without such a back edge, removing (v, to) disconnects the subtree.",
      "**Articulation point conditions**: (1) If v is the **DFS root**, it's an AP iff it has **2+ children** in the DFS tree. (2) If v is **non-root**, it's an AP iff it has a child 'to' where **low[to] ≥ tin[v]** — the subtree of 'to' can't reach above v.",
      "**Multi-edge handling**: When checking back edges, skip the parent edge only once (use a `parent_skipped` flag). This correctly handles parallel edges: if there are 2 edges between u and v, only one is the tree edge — the other is a back edge making (u,v) NOT a bridge.",
    ],
    code: [
      {
        title: "Bridges & Articulation Points — Tarjan's",
        language: "java",
        content: `import java.util.*;

public class BridgesAPs {
    
    static int timer;
    static int[] disc, low;
    static boolean[] visited, isAP;
    static List<int[]> bridges;
    
    public static void findBridgesAndAPs(List<List<Integer>> adj, int V) {
        timer = 0;
        disc = new int[V]; low = new int[V];
        visited = new boolean[V]; isAP = new boolean[V];
        bridges = new ArrayList<>();
        Arrays.fill(disc, -1);
        
        for (int i = 0; i < V; i++)
            if (!visited[i]) dfs(adj, i, -1);
        
        System.out.println("Bridges:");
        for (int[] b : bridges) System.out.println("  " + b[0] + " -- " + b[1]);
        
        System.out.print("Articulation Points: ");
        for (int i = 0; i < V; i++) if (isAP[i]) System.out.print(i + " ");
        System.out.println();
    }
    
    private static void dfs(List<List<Integer>> adj, int u, int parent) {
        visited[u] = true;
        disc[u] = low[u] = timer++;
        int childCount = 0;
        
        for (int v : adj.get(u)) {
            if (v == parent) continue; // Skip the edge we came from
            
            if (visited[v]) {
                // Back edge: update low[u] (can reach v without tree edge)
                low[u] = Math.min(low[u], disc[v]);
            } else {
                childCount++;
                dfs(adj, v, u);
                low[u] = Math.min(low[u], low[v]);
                
                // BRIDGE condition: low[v] > disc[u]
                if (low[v] > disc[u]) bridges.add(new int[]{u, v});
                
                // ARTICULATION POINT conditions:
                // Case 1: u is root and has 2+ children
                if (parent == -1 && childCount > 1) isAP[u] = true;
                // Case 2: u is non-root and low[v] >= disc[u]
                if (parent != -1 && low[v] >= disc[u]) isAP[u] = true;
            }
        }
    }
    
    // Tarjan's for SCC (single pass)
    static Deque<Integer> sccStack;
    static boolean[] onStack;
    static List<List<Integer>> sccs;
    
    public static List<List<Integer>> tarjanSCC(List<List<Integer>> adj, int V) {
        disc = new int[V]; low = new int[V];
        visited = new boolean[V]; onStack = new boolean[V];
        sccStack = new ArrayDeque<>(); sccs = new ArrayList<>();
        timer = 0;
        Arrays.fill(disc, -1);
        
        for (int i = 0; i < V; i++)
            if (disc[i] == -1) tarjanDFS(adj, i);
        
        return sccs;
    }
    
    private static void tarjanDFS(List<List<Integer>> adj, int u) {
        disc[u] = low[u] = timer++;
        sccStack.push(u); onStack[u] = true;
        
        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                tarjanDFS(adj, v);
                low[u] = Math.min(low[u], low[v]);
            } else if (onStack[v]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
        
        // u is root of an SCC if low[u] == disc[u]
        if (low[u] == disc[u]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int w = sccStack.pop();
                onStack[w] = false;
                scc.add(w);
                if (w == u) break;
            }
            sccs.add(scc);
        }
    }
    
    public static void main(String[] args) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 5; i++) adj.add(new ArrayList<>());
        // Build graph: 0-1-2-0 (triangle), 1-3, 3-4
        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(1).add(2); adj.get(2).add(1);
        adj.get(0).add(2); adj.get(2).add(0);
        adj.get(1).add(3); adj.get(3).add(1);
        adj.get(3).add(4); adj.get(4).add(3);
        
        findBridgesAndAPs(adj, 5);
        // Bridges: 1--3, 3--4
        // APs: 1, 3
    }
}`,
      },
    ],
  },
  {
    id: "graph-euler-tour",
    title: "Euler Tour & DFS Order",
    difficulty: "Hard",
    timeComplexity: "O(V + E) — single DFS pass",
    spaceComplexity: "O(V)",
    theory: [
      "Euler Tour (also called DFS order or tree flattening) linearizes a tree into an array, enabling subtree queries with range data structures (segment trees, BIT).",
      "The tour records each node twice: tin[v] (entry time) and tout[v] (exit time). The subtree of v corresponds to the interval [tin[v], tout[v]] in the tour array.",
      "This allows converting subtree queries into range queries, and path queries (combined with LCA) into a constant number of range queries.",
      "Applications: subtree sum/update queries, LCA via RMQ (Range Minimum Query), offline tree queries, handling tree updates efficiently.",
      "DFS Order variants: (1) Discovery order — just the entry times. (2) Full Euler tour — record on both entry and exit. (3) Edge-based tour — record each edge traversal.",
    ],
    keyPoints: [
      "tin[v] = when DFS first visits v; tout[v] = when DFS leaves v",
      "Subtree of v = indices [tin[v], tout[v]] in the tour",
      "Subtree queries reduce to range queries on the flattened array",
      "LCA(u,v) can be found as RMQ on Euler tour depths",
      "Combined with segment tree for O(log n) subtree updates/queries",
    ],
    code: [
      {
        title: "Euler Tour — Flattening Tree for Range Queries",
        language: "java",
        content: `import java.util.*;

public class EulerTour {
    
    static int timer = 0;
    static int[] tin, tout, flat, depth;
    static List<Integer>[] adj;
    
    // ==================== BUILD EULER TOUR ====================
    
    @SuppressWarnings("unchecked")
    public static void buildTour(int n, int[][] edges, int root) {
        adj = new ArrayList[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
        
        tin = new int[n];
        tout = new int[n];
        flat = new int[n]; // flat[i] = node at position i in the tour
        depth = new int[n];
        timer = 0;
        
        dfs(root, -1, 0);
    }
    
    private static void dfs(int v, int parent, int d) {
        depth[v] = d;
        tin[v] = timer;
        flat[timer] = v;
        timer++;
        
        for (int u : adj[v]) {
            if (u != parent) dfs(u, v, d + 1);
        }
        tout[v] = timer - 1; // Last index in subtree
    }
    
    // ==================== SUBTREE QUERIES USING BIT ====================
    // Support: update value of node v, query sum of subtree of v
    
    static long[] bit;
    static int bitSize;
    
    static void initBIT(int n) {
        bitSize = n;
        bit = new long[n + 1];
    }
    
    static void bitUpdate(int i, long delta) {
        for (i++; i <= bitSize; i += i & (-i)) bit[i] += delta;
    }
    
    static long bitQuery(int i) {
        long sum = 0;
        for (i++; i > 0; i -= i & (-i)) sum += bit[i];
        return sum;
    }
    
    static long bitRangeQuery(int l, int r) {
        return bitQuery(r) - (l > 0 ? bitQuery(l - 1) : 0);
    }
    
    // Update node value
    public static void updateNode(int node, long value) {
        bitUpdate(tin[node], value);
    }
    
    // Query subtree sum
    public static long querySubtree(int node) {
        return bitRangeQuery(tin[node], tout[node]);
    }
    
    public static void main(String[] args) {
        //       0
        //      / \\
        //     1   2
        //    / \\   \\
        //   3   4   5
        int n = 6;
        int[][] edges = {{0,1},{0,2},{1,3},{1,4},{2,5}};
        buildTour(n, edges, 0);
        
        System.out.println("Euler Tour (tin): " + Arrays.toString(tin));
        System.out.println("Euler Tour (tout): " + Arrays.toString(tout));
        System.out.println("Flat array: " + Arrays.toString(flat));
        // tin:  [0, 1, 4, 2, 3, 5]
        // tout: [5, 3, 5, 2, 3, 5]
        // Subtree of node 1 = indices [1, 3] = {1, 3, 4}
        
        // Subtree query demo
        initBIT(n);
        int[] values = {10, 20, 30, 40, 50, 60};
        for (int i = 0; i < n; i++) updateNode(i, values[i]);
        
        System.out.println("Sum subtree(0): " + querySubtree(0)); // 210
        System.out.println("Sum subtree(1): " + querySubtree(1)); // 110 (20+40+50)
        System.out.println("Sum subtree(2): " + querySubtree(2)); // 90 (30+60)
    }
}`,
      },
      {
        title: "LCA via Euler Tour + Sparse Table (RMQ)",
        language: "java",
        content: `import java.util.*;

public class LCAEulerTour {
    
    // ==================== LCA VIA RMQ ON EULER TOUR ====================
    // Build: O(n log n) | Query: O(1)
    // Record (depth, node) for each step of DFS (both entry and backtrack)
    
    static int[] first;     // first[v] = first occurrence of v in euler tour
    static int[] eulerTour; // sequence of nodes visited
    static int[] eulerDepth;// depth at each position in tour
    static int[][] sparse;  // sparse table for RMQ
    static int tourLen;
    
    @SuppressWarnings("unchecked")
    public static void build(int n, int[][] edges, int root) {
        List<Integer>[] adj = new ArrayList[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
        
        first = new int[n];
        eulerTour = new int[2 * n];
        eulerDepth = new int[2 * n];
        Arrays.fill(first, -1);
        tourLen = 0;
        
        dfs(adj, root, -1, 0);
        buildSparseTable();
    }
    
    private static void dfs(List<Integer>[] adj, int v, int parent, int d) {
        eulerTour[tourLen] = v;
        eulerDepth[tourLen] = d;
        if (first[v] == -1) first[v] = tourLen;
        tourLen++;
        
        for (int u : adj[v]) {
            if (u != parent) {
                dfs(adj, u, v, d + 1);
                eulerTour[tourLen] = v; // Record backtrack
                eulerDepth[tourLen] = d;
                tourLen++;
            }
        }
    }
    
    private static void buildSparseTable() {
        int LOG = (int)(Math.log(tourLen) / Math.log(2)) + 1;
        sparse = new int[LOG][tourLen];
        
        for (int i = 0; i < tourLen; i++) sparse[0][i] = i;
        
        for (int k = 1; k < LOG; k++) {
            for (int i = 0; i + (1 << k) <= tourLen; i++) {
                int l = sparse[k-1][i];
                int r = sparse[k-1][i + (1 << (k-1))];
                sparse[k][i] = eulerDepth[l] < eulerDepth[r] ? l : r;
            }
        }
    }
    
    public static int lca(int u, int v) {
        int l = first[u], r = first[v];
        if (l > r) { int t = l; l = r; r = t; }
        
        int k = (int)(Math.log(r - l + 1) / Math.log(2));
        int left = sparse[k][l];
        int right = sparse[k][r - (1 << k) + 1];
        int minIdx = eulerDepth[left] < eulerDepth[right] ? left : right;
        return eulerTour[minIdx];
    }
    
    public static void main(String[] args) {
        int n = 7;
        int[][] edges = {{0,1},{0,2},{1,3},{1,4},{2,5},{2,6}};
        build(n, edges, 0);
        
        System.out.println("LCA(3,4) = " + lca(3, 4)); // 1
        System.out.println("LCA(3,5) = " + lca(3, 5)); // 0
        System.out.println("LCA(5,6) = " + lca(5, 6)); // 2
        System.out.println("LCA(4,6) = " + lca(4, 6)); // 0
    }
}`,
      },
    ],
  },
  {
    id: "graph-hld",
    title: "Heavy-Light Decomposition",
    difficulty: "Expert",
    timeComplexity: "O(n) build | O(log²n) per path query",
    spaceComplexity: "O(n)",
    theory: [
      "**Heavy-Light Decomposition** (HLD) splits a tree into disjoint **heavy paths** so that any root-to-leaf traversal crosses at most **O(log n) paths**. This reduces tree path queries to a logarithmic number of range queries on arrays.",
      "**Heavy edge definition** (from cp-algorithms): Edge (v, c) is heavy iff s(c) ≥ s(v)/2, where s(x) = subtree size. At most **one** heavy edge can go down from any vertex (otherwise s(v) ≥ 1 + 2·s(v)/2 > s(v), contradiction). All other edges are **light**. In practice, heavy child = child with **largest** subtree (simpler, equivalent guarantees).",
      "**Proof of O(log n) chains**: Moving down a **light edge** reduces subtree size to less than half: s(c) < s(v)/2. Therefore we can cross at most log₂(n) light edges from root to any leaf. Since we switch heavy paths only at light edges, we cross ≤ O(log n) heavy paths.",
      "**Combined with segment tree**: Flatten all heavy paths into a single array using DFS order (heavy child visited first). Each path query (u→v) decomposes into O(log n) contiguous segments on this array, each queryable in O(log n) with a segment tree → total **O(log² n)** per query.",
      "**Three typical problems**: (1) **Max/sum on path** — segment tree on HLD chains, O(log² n) per query. (2) **Path updates** — lazy propagation on segment tree. (3) **LCA** — byproduct of HLD: jump chain heads until same chain, return shallower vertex.",
      "**Implementation tip**: Use the 'largest subtree child' definition (not the strict s(c) ≥ s(v)/2 definition). This may combine some heavy paths but keeps all guarantees. Store head[v] (top of v's chain) and pos[v] (position in segment tree array).",
    ],
    keyPoints: [
      "Heavy child = child with largest subtree size",
      "Any root-to-leaf path has ≤ O(log n) light edges",
      "Flatten chains into a segment tree for O(log² n) path queries",
      "head[v] = top node of v's heavy chain (used to 'jump' between chains)",
      "pos[v] = position of v in the segment tree array",
    ],
    code: [
      {
        title: "Heavy-Light Decomposition — Full Implementation",
        language: "java",
        content: `import java.util.*;

public class HLD {
    
    static int[] parent, depth, heavy, head, pos, subSize;
    static List<Integer>[] adj;
    static int curPos;
    
    // Segment tree for path queries
    static long[] seg;
    static int segSize;
    
    @SuppressWarnings("unchecked")
    public static void build(int n, int[][] edges, int root) {
        adj = new ArrayList[n];
        parent = new int[n]; depth = new int[n];
        heavy = new int[n]; head = new int[n];
        pos = new int[n]; subSize = new int[n];
        Arrays.fill(heavy, -1);
        
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
        
        // Step 1: Compute subtree sizes and find heavy children
        computeSize(root, -1, 0);
        
        // Step 2: Decompose into chains
        curPos = 0;
        decompose(root, root);
        
        // Step 3: Build segment tree
        segSize = n;
        seg = new long[4 * n];
    }
    
    private static void computeSize(int v, int par, int d) {
        parent[v] = par;
        depth[v] = d;
        subSize[v] = 1;
        int maxChild = 0;
        
        for (int u : adj[v]) {
            if (u == par) continue;
            computeSize(u, v, d + 1);
            subSize[v] += subSize[u];
            if (subSize[u] > maxChild) {
                maxChild = subSize[u];
                heavy[v] = u; // Heavy child = largest subtree
            }
        }
    }
    
    private static void decompose(int v, int h) {
        head[v] = h;    // Top of current chain
        pos[v] = curPos++; // Position in segment tree
        
        // First, continue the heavy chain
        if (heavy[v] != -1) {
            decompose(heavy[v], h); // Same chain head
        }
        
        // Then, start new chains for light children
        for (int u : adj[v]) {
            if (u != parent[v] && u != heavy[v]) {
                decompose(u, u); // New chain starts at u
            }
        }
    }
    
    // ==================== SEGMENT TREE ====================
    
    static void segUpdate(int node, int lo, int hi, int idx, long val) {
        if (lo == hi) { seg[node] = val; return; }
        int mid = (lo + hi) / 2;
        if (idx <= mid) segUpdate(2*node, lo, mid, idx, val);
        else segUpdate(2*node+1, mid+1, hi, idx, val);
        seg[node] = seg[2*node] + seg[2*node+1];
    }
    
    static long segQuery(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return seg[node];
        int mid = (lo + hi) / 2;
        return segQuery(2*node, lo, mid, l, r)
             + segQuery(2*node+1, mid+1, hi, l, r);
    }
    
    // ==================== PATH OPERATIONS ====================
    
    // Update value of node v
    public static void update(int v, long val) {
        segUpdate(1, 0, segSize - 1, pos[v], val);
    }
    
    // Query sum on path from u to v
    public static long pathQuery(int u, int v) {
        long result = 0;
        
        // Move up chain by chain until u and v are on the same chain
        while (head[u] != head[v]) {
            // Always jump the deeper chain
            if (depth[head[u]] < depth[head[v]]) { int t = u; u = v; v = t; }
            
            // Query from u to top of u's chain
            result += segQuery(1, 0, segSize - 1, pos[head[u]], pos[u]);
            u = parent[head[u]]; // Jump to parent of chain head
        }
        
        // Now u and v are on the same chain — query the range between them
        if (depth[u] > depth[v]) { int t = u; u = v; v = t; }
        result += segQuery(1, 0, segSize - 1, pos[u], pos[v]);
        
        return result;
    }
    
    // LCA as a byproduct of HLD
    public static int lca(int u, int v) {
        while (head[u] != head[v]) {
            if (depth[head[u]] < depth[head[v]]) { int t = u; u = v; v = t; }
            u = parent[head[u]];
        }
        return depth[u] < depth[v] ? u : v;
    }
    
    public static void main(String[] args) {
        //       0
        //      / \\
        //     1   2
        //    / \\   \\
        //   3   4   5
        //  /
        // 6
        int n = 7;
        int[][] edges = {{0,1},{0,2},{1,3},{1,4},{2,5},{3,6}};
        build(n, edges, 0);
        
        // Assign values to nodes
        int[] values = {1, 2, 3, 4, 5, 6, 7};
        for (int i = 0; i < n; i++) update(i, values[i]);
        
        System.out.println("Path sum 6→5: " + pathQuery(6, 5));
        // 6→3→1→0→2→5 = 7+4+2+1+3+6 = 23
        System.out.println("Path sum 3→4: " + pathQuery(3, 4));
        // 3→1→4 = 4+2+5 = 11
        System.out.println("LCA(6,4) = " + lca(6, 4)); // 1
        System.out.println("LCA(6,5) = " + lca(6, 5)); // 0
    }
}`,
      },
    ],
    table: {
      headers: ["Operation", "Time Complexity", "Technique"],
      rows: [
        ["Build HLD", "O(n)", "Two DFS passes"],
        ["Path query (sum/max)", "O(log² n)", "O(log n) chains × O(log n) seg tree"],
        ["Path update", "O(log² n)", "Same as query"],
        ["Subtree query", "O(log n)", "Single range in seg tree"],
        ["LCA", "O(log n)", "Chain jumping"],
      ],
    },
  },
  {
    id: "graph-matching",
    title: "Bipartite Matching",
    difficulty: "Expert",
    timeComplexity: "Hopcroft-Karp: O(E√V) | Hungarian: O(n³)",
    spaceComplexity: "O(V + E)",
    theory: [
      "Bipartite Matching: Given a bipartite graph (two disjoint sets L and R with edges only between them), find a maximum matching — largest set of edges with no shared endpoints.",
      "Hungarian Algorithm: Augmenting path-based method. Start with empty matching, repeatedly find augmenting paths (alternating between unmatched and matched edges). O(VE) for simple version.",
      "Hopcroft-Karp: Finds augmenting paths in phases using BFS (to find shortest augmenting paths) then DFS (to find multiple disjoint augmenting paths). O(E√V).",
      "König's Theorem: In bipartite graphs, max matching = min vertex cover. This connects matching to covering problems.",
      "Applications: job assignment, course scheduling, stable matching, network routing, image segmentation.",
    ],
    keyPoints: [
      "Augmenting path: alternating path from unmatched L to unmatched R",
      "Hopcroft-Karp is fastest: O(E√V) using BFS + DFS phases",
      "Max matching = Min vertex cover in bipartite graphs (König's theorem)",
      "Can reduce to max-flow: add source→L edges, R→sink edges, all capacity 1",
      "Hungarian method for weighted matching (assignment problem) in O(n³)",
    ],
    code: [
      {
        title: "Hopcroft-Karp Maximum Bipartite Matching",
        language: "java",
        content: `import java.util.*;

public class HopcroftKarp {
    
    // ==================== HOPCROFT-KARP ====================
    // O(E√V) — fastest bipartite matching algorithm
    // L = left vertices [0, n), R = right vertices [0, m)
    
    static final int INF = Integer.MAX_VALUE;
    static List<Integer>[] adj; // adj[u] = list of right vertices u can match to
    static int[] matchL, matchR; // matchL[u] = right vertex matched to u (-1 if unmatched)
    static int[] dist; // BFS distance of left vertices
    static int n, m; // n = |L|, m = |R|
    
    @SuppressWarnings("unchecked")
    public static int maxMatching(int leftSize, int rightSize, int[][] edges) {
        n = leftSize;
        m = rightSize;
        adj = new ArrayList[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(e[1]);
        
        matchL = new int[n];
        matchR = new int[m];
        dist = new int[n];
        Arrays.fill(matchL, -1);
        Arrays.fill(matchR, -1);
        
        int matching = 0;
        
        // Repeat: BFS to find shortest augmenting paths, then DFS to augment
        while (bfs()) {
            for (int u = 0; u < n; u++) {
                if (matchL[u] == -1) { // Start from unmatched left vertices
                    if (dfs(u)) matching++;
                }
            }
        }
        return matching;
    }
    
    // BFS: Find shortest augmenting path length
    private static boolean bfs() {
        Queue<Integer> queue = new LinkedList<>();
        
        for (int u = 0; u < n; u++) {
            if (matchL[u] == -1) {
                dist[u] = 0;
                queue.offer(u);
            } else {
                dist[u] = INF;
            }
        }
        
        boolean found = false;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int v : adj[u]) {
                int next = matchR[v]; // Left vertex matched to right vertex v
                if (next == -1) {
                    found = true; // Found augmenting path
                } else if (dist[next] == INF) {
                    dist[next] = dist[u] + 1;
                    queue.offer(next);
                }
            }
        }
        return found;
    }
    
    // DFS: Augment along shortest paths
    private static boolean dfs(int u) {
        for (int v : adj[u]) {
            int next = matchR[v];
            if (next == -1 || (dist[next] == dist[u] + 1 && dfs(next))) {
                matchL[u] = v;
                matchR[v] = u;
                return true;
            }
        }
        dist[u] = INF; // Remove u from layered graph
        return false;
    }
    
    public static void main(String[] args) {
        // Left: 0,1,2,3 (workers)
        // Right: 0,1,2,3 (jobs)
        // Edges: worker -> jobs they can do
        int[][] edges = {
            {0, 0}, {0, 1},
            {1, 0}, {1, 2},
            {2, 1}, {2, 2},
            {3, 2}, {3, 3}
        };
        
        System.out.println("Max Matching: " + maxMatching(4, 4, edges)); // 4
        System.out.println("Matched pairs:");
        for (int i = 0; i < 4; i++) {
            System.out.println("  Worker " + i + " → Job " + matchL[i]);
        }
    }
}`,
      },
      {
        title: "Hungarian Algorithm — Weighted Bipartite Matching",
        language: "java",
        content: `import java.util.*;

public class Hungarian {
    
    // ==================== HUNGARIAN ALGORITHM ====================
    // O(n³) — Minimum cost perfect matching in weighted bipartite graph
    // Also called Kuhn-Munkres algorithm
    
    // cost[i][j] = cost of assigning worker i to job j
    // Returns minimum total cost and the assignment
    
    public static int[] minCostMatching(int[][] cost) {
        int n = cost.length;
        
        // u[i], v[j] = potentials (dual variables)
        int[] u = new int[n + 1], v = new int[n + 1];
        int[] match = new int[n + 1]; // match[j] = worker assigned to job j
        int[] way = new int[n + 1];   // way[j] = previous job in augmenting path
        Arrays.fill(match, 0);
        
        for (int i = 1; i <= n; i++) {
            int[] minv = new int[n + 1];
            boolean[] used = new boolean[n + 1];
            Arrays.fill(minv, Integer.MAX_VALUE);
            
            match[0] = i;
            int j0 = 0; // Virtual "unmatched" job
            
            do {
                used[j0] = true;
                int i0 = match[j0], j1 = 0;
                int delta = Integer.MAX_VALUE;
                
                for (int j = 1; j <= n; j++) {
                    if (used[j]) continue;
                    int cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j;
                    }
                }
                
                // Update potentials
                for (int j = 0; j <= n; j++) {
                    if (used[j]) { u[match[j]] += delta; v[j] -= delta; }
                    else minv[j] -= delta;
                }
                
                j0 = j1;
            } while (match[j0] != 0);
            
            // Update matching along augmenting path
            do {
                int j1 = way[j0];
                match[j0] = match[j1];
                j0 = j1;
            } while (j0 != 0);
        }
        
        // Build result: result[i] = job assigned to worker i (0-indexed)
        int[] result = new int[n];
        for (int j = 1; j <= n; j++) {
            result[match[j] - 1] = j - 1;
        }
        return result;
    }
    
    public static void main(String[] args) {
        int[][] cost = {
            {9, 2, 7, 8},
            {6, 4, 3, 7},
            {5, 8, 1, 8},
            {7, 6, 9, 4}
        };
        
        int[] assignment = minCostMatching(cost);
        int totalCost = 0;
        System.out.println("Optimal Assignment:");
        for (int i = 0; i < assignment.length; i++) {
            System.out.println("  Worker " + i + " → Job " + assignment[i]
                + " (cost " + cost[i][assignment[i]] + ")");
            totalCost += cost[i][assignment[i]];
        }
        System.out.println("Total cost: " + totalCost); // 13
    }
}`,
      },
    ],
  },
  {
    id: "graph-mcmf",
    title: "Min-Cost Max-Flow",
    difficulty: "Expert",
    timeComplexity: "O(V × E × F) with SPFA | O(V²EF) with Bellman-Ford",
    spaceComplexity: "O(V + E)",
    theory: [
      "Min-Cost Max-Flow (MCMF) finds a maximum flow with minimum total cost in a network where each edge has both capacity and cost per unit of flow.",
      "The algorithm repeatedly finds the shortest (cheapest) augmenting path from source to sink using SPFA (Shortest Path Faster Algorithm) or Bellman-Ford, then pushes maximum flow along it.",
      "Unlike plain max-flow, MCMF considers edge costs — useful when we want the cheapest way to route maximum flow.",
      "Negative costs are supported (the graph may have negative cost edges), which is why SPFA/Bellman-Ford is used instead of Dijkstra. With Johnson's reweighting, Dijkstra can be used after the first SPFA pass (potentials eliminate negative edges).",
      "**Max-Flow Min-Cut Theorem** (from cp-algorithms): The maximum flow from s to t equals the minimum cut (minimum total capacity of edges whose removal disconnects s from t). After running max-flow, the min-cut consists of all edges (u,v) where u is reachable from s in the residual graph but v is not. Applications: minimum number of edges to disconnect, maximum bipartite matching, project selection.",
      "**Max-flow applications**: Bipartite matching (source→L, R→sink, capacity 1), minimum vertex cover (via König's theorem), maximum edge-disjoint paths, image segmentation, baseball elimination.",
      "Applications of MCMF: assignment problems (generalizes bipartite matching with costs), transportation problems, project selection, network design optimization.",
    ],
    keyPoints: [
      "Each edge has (capacity, cost): flow ≤ capacity, total cost = Σ flow × cost",
      "Residual edges have negative cost (sending flow back reduces cost)",
      "SPFA finds cheapest augmenting path — push max flow along it",
      "Max-flow = Min-cut — fundamental duality theorem in network flow",
      "Min-cut: after max-flow, find edges from reachable to unreachable in residual graph",
      "Converges when no more augmenting paths exist (max flow reached)",
      "Can solve weighted bipartite matching as a special case",
    ],
    code: [
      {
        title: "Min-Cost Max-Flow — SPFA-based Implementation",
        language: "java",
        content: `import java.util.*;

public class MinCostMaxFlow {
    
    // ==================== MCMF WITH SPFA ====================
    
    static final int INF = Integer.MAX_VALUE;
    
    static class Edge {
        int to, rev;
        int cap, cost;
        Edge(int to, int cap, int cost, int rev) {
            this.to = to; this.cap = cap; this.cost = cost; this.rev = rev;
        }
    }
    
    static List<Edge>[] graph;
    static int N;
    
    @SuppressWarnings("unchecked")
    public static void init(int n) {
        N = n;
        graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
    }
    
    public static void addEdge(int from, int to, int cap, int cost) {
        graph[from].add(new Edge(to, cap, cost, graph[to].size()));
        graph[to].add(new Edge(from, 0, -cost, graph[from].size() - 1)); // Reverse
    }
    
    // Returns {maxFlow, minCost}
    public static int[] mcmf(int source, int sink) {
        int totalFlow = 0, totalCost = 0;
        
        while (true) {
            // SPFA to find shortest (cheapest) path from source to sink
            int[] dist = new int[N];
            boolean[] inQueue = new boolean[N];
            int[] prevNode = new int[N], prevEdge = new int[N];
            Arrays.fill(dist, INF);
            dist[source] = 0;
            
            Queue<Integer> queue = new LinkedList<>();
            queue.offer(source);
            inQueue[source] = true;
            
            while (!queue.isEmpty()) {
                int u = queue.poll();
                inQueue[u] = false;
                
                for (int i = 0; i < graph[u].size(); i++) {
                    Edge e = graph[u].get(i);
                    if (e.cap > 0 && dist[u] + e.cost < dist[e.to]) {
                        dist[e.to] = dist[u] + e.cost;
                        prevNode[e.to] = u;
                        prevEdge[e.to] = i;
                        if (!inQueue[e.to]) {
                            queue.offer(e.to);
                            inQueue[e.to] = true;
                        }
                    }
                }
            }
            
            if (dist[sink] == INF) break; // No more augmenting paths
            
            // Find bottleneck (max flow we can push)
            int flow = INF;
            for (int v = sink; v != source; v = prevNode[v]) {
                flow = Math.min(flow, graph[prevNode[v]].get(prevEdge[v]).cap);
            }
            
            // Push flow along the path
            for (int v = sink; v != source; v = prevNode[v]) {
                Edge e = graph[prevNode[v]].get(prevEdge[v]);
                e.cap -= flow;
                graph[e.to].get(e.rev).cap += flow;
            }
            
            totalFlow += flow;
            totalCost += flow * dist[sink];
        }
        
        return new int[]{totalFlow, totalCost};
    }
    
    public static void main(String[] args) {
        // Example: 4 nodes, source=0, sink=3
        init(4);
        addEdge(0, 1, 3, 1);  // cap=3, cost=1
        addEdge(0, 2, 2, 5);  // cap=2, cost=5
        addEdge(1, 2, 1, 2);  // cap=1, cost=2
        addEdge(1, 3, 2, 3);  // cap=2, cost=3
        addEdge(2, 3, 3, 1);  // cap=3, cost=1
        
        int[] result = mcmf(0, 3);
        System.out.println("Max Flow: " + result[0]); // 4
        System.out.println("Min Cost: " + result[1]); // 18
        
        // Assignment problem as MCMF:
        // source → workers (cap=1, cost=0)
        // workers → jobs (cap=1, cost=assignment_cost)
        // jobs → sink (cap=1, cost=0)
    }
}`,
      },
    ],
  },
  {
    id: "graph-advanced",
    title: "Advanced Graph Algorithms",
    difficulty: "Expert",
    timeComplexity: "Varies by algorithm",
    spaceComplexity: "Varies by algorithm",
    theory: [
      "Advanced graph algorithms form the backbone of competitive programming. These include network flow, Euler paths, shortest path optimizations, and specialized tree algorithms.",
      "**Max-Flow / Ford-Fulkerson method** (from cp-algorithms): A flow network has edges with capacities. A flow satisfies: f(e) ≤ c(e) for all edges, and flow conservation at non-source/sink vertices. The **Ford-Fulkerson method** repeatedly finds **augmenting paths** in the residual graph (where residual capacity = capacity - flow) and pushes flow along them. Key insight: reversed edges in the residual graph allow 'undoing' flow.",
      "**Edmonds-Karp algorithm**: Ford-Fulkerson using **BFS** to find augmenting paths. Complexity: **O(VE²)** — independent of max flow value. Each augmenting path saturates at least one edge, and the distance from source to any vertex in the residual graph never decreases between phases.",
      "**Max-Flow = Min-Cut** (Ford-Fulkerson theorem): The maximum flow equals the minimum capacity of any cut separating source from sink. This duality is used in many optimization problems.",
      "**LCA via Binary Lifting** (from cp-algorithms): Precompute `up[v][j]` = 2^j-th ancestor of v. Build: `up[v][j] = up[up[v][j-1]][j-1]`. Ancestor check: u is ancestor of v iff `tin[u] ≤ tin[v]` and `tout[u] ≥ tout[v]`. Query: if neither is ancestor, jump u up using powers of 2 until just below LCA. O(n log n) build, O(log n) query.",
      "Euler Path & Circuit: An Euler path visits every EDGE exactly once. Euler circuit exists iff all vertices have even degree (undirected) or in-degree == out-degree (directed). Found via Hierholzer's algorithm in O(E).",
      "Centroid Decomposition: Decompose tree into centroids. Each node appears in O(log n) centroid subtrees — enables O(n log n) or O(n log² n) tree path queries.",
    ],
    keyPoints: [
      "Max-Flow = Min-Cut (Ford-Fulkerson theorem) — fundamental duality",
      "Dinic's algorithm: O(V²E) general, O(E√V) for unit capacity graphs",
      "Binary lifting for LCA requires O(n log n) space",
      "0-1 BFS: push weight-0 edges to front, weight-1 to back of deque",
      "Centroid decomposition is key for tree path problems with updates",
    ],
    code: [
      {
        title: "Dinic's Max Flow Algorithm",
        language: "java",
        content: `import java.util.*;

public class MaxFlow {
    
    // ==================== DINIC'S ALGORITHM ====================
    // O(V²E) general | O(E√V) for unit capacity | O(E√E) bipartite matching
    
    static final int INF = Integer.MAX_VALUE;
    
    static class Edge {
        int to, rev;
        long cap;
        Edge(int to, long cap, int rev) {
            this.to = to; this.cap = cap; this.rev = rev;
        }
    }
    
    static List<Edge>[] graph;
    static int[] level, iter;
    static int N;
    
    @SuppressWarnings("unchecked")
    public static void init(int n) {
        N = n;
        graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        level = new int[n];
        iter = new int[n];
    }
    
    public static void addEdge(int from, int to, long cap) {
        graph[from].add(new Edge(to, cap, graph[to].size()));
        graph[to].add(new Edge(from, 0, graph[from].size() - 1)); // Reverse edge (cap=0)
    }
    
    // BFS to build level graph (layered graph)
    private static boolean bfs(int s, int t) {
        Arrays.fill(level, -1);
        Queue<Integer> q = new LinkedList<>();
        level[s] = 0;
        q.offer(s);
        while (!q.isEmpty()) {
            int v = q.poll();
            for (Edge e : graph[v]) {
                if (e.cap > 0 && level[e.to] < 0) {
                    level[e.to] = level[v] + 1;
                    q.offer(e.to);
                }
            }
        }
        return level[t] >= 0; // Return true if sink is reachable
    }
    
    // DFS to send flow along augmenting paths
    private static long dfs(int v, int t, long f) {
        if (v == t) return f;
        for (; iter[v] < graph[v].size(); iter[v]++) {
            Edge e = graph[v].get(iter[v]);
            if (e.cap > 0 && level[v] < level[e.to]) {
                long d = dfs(e.to, t, Math.min(f, e.cap));
                if (d > 0) {
                    e.cap -= d;
                    graph[e.to].get(e.rev).cap += d; // Update reverse edge
                    return d;
                }
            }
        }
        return 0;
    }
    
    public static long maxflow(int s, int t) {
        long flow = 0;
        while (bfs(s, t)) {          // Build level graph
            Arrays.fill(iter, 0);
            long f;
            while ((f = dfs(s, t, INF)) > 0) flow += f; // Push until no augmenting path
        }
        return flow;
    }
    
    public static void main(String[] args) {
        // Example: source=0, sink=5, 6 nodes
        init(6);
        addEdge(0, 1, 10); addEdge(0, 2, 10);
        addEdge(1, 3, 4);  addEdge(1, 4, 8);  addEdge(1, 2, 2);
        addEdge(2, 4, 9);
        addEdge(3, 5, 10); addEdge(4, 3, 6);  addEdge(4, 5, 10);
        
        System.out.println("Max Flow: " + maxflow(0, 5)); // 19
    }
}`,
      },
      {
        title: "LCA with Binary Lifting",
        language: "java",
        content: `import java.util.*;

public class LCA {
    
    // ==================== BINARY LIFTING LCA ====================
    // Build: O(n log n) | Query: O(log n)
    // up[v][k] = 2^k-th ancestor of v
    
    static final int LOG = 20; // Supports trees with up to 2^20 nodes
    static int[][] up;
    static int[] depth;
    static List<Integer>[] adj;
    
    @SuppressWarnings("unchecked")
    public static void build(int n, int root, int[][] edges) {
        adj = new ArrayList[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
        
        up = new int[n][LOG];
        depth = new int[n];
        
        // Initialize: up[v][0] = parent of v (direct parent)
        dfs(root, -1, 0);
        
        // Fill binary lifting table
        for (int k = 1; k < LOG; k++)
            for (int v = 0; v < n; v++)
                up[v][k] = up[up[v][k-1]][k-1]; // 2^k ancestor = 2^(k-1) ancestor of 2^(k-1) ancestor
    }
    
    private static void dfs(int v, int parent, int d) {
        depth[v] = d;
        up[v][0] = (parent == -1) ? v : parent; // Root's parent is itself
        for (int u : adj[v])
            if (u != parent) dfs(u, v, d + 1);
    }
    
    public static int lca(int u, int v) {
        // Bring both nodes to same depth
        if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
        
        int diff = depth[u] - depth[v];
        for (int k = 0; k < LOG; k++)
            if ((diff >> k & 1) == 1) u = up[u][k]; // Jump 2^k levels
        
        if (u == v) return u; // Same node — one is ancestor of other
        
        // Binary search for LCA: highest point where they're still different
        for (int k = LOG - 1; k >= 0; k--)
            if (up[u][k] != up[v][k]) {
                u = up[u][k];
                v = up[v][k];
            }
        
        return up[u][0]; // Parent of u (and v) is the LCA
    }
    
    // ==================== 0-1 BFS ====================
    // Shortest path when edge weights are only 0 or 1
    // Use deque: 0-weight edges → push front | 1-weight edges → push back
    
    public static int[] zeroOneBFS(List<List<int[]>> adj, int src, int V) {
        int[] dist = new int[V];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        
        Deque<Integer> deque = new ArrayDeque<>();
        deque.addFirst(src);
        
        while (!deque.isEmpty()) {
            int u = deque.pollFirst();
            
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) deque.addFirst(v);  // 0-weight: add to front
                    else        deque.addLast(v);   // 1-weight: add to back
                }
            }
        }
        return dist;
    }
    
    public static void main(String[] args) {
        // Tree: 0-1-2-3-4-5 with branching
        int n = 7;
        int[][] edges = {{0,1},{0,2},{1,3},{1,4},{2,5},{2,6}};
        build(n, 0, edges);
        
        System.out.println("LCA(3,4) = " + lca(3, 4)); // 1
        System.out.println("LCA(3,5) = " + lca(3, 5)); // 0
        System.out.println("LCA(4,6) = " + lca(4, 6)); // 0
        System.out.println("depth[3] = " + depth[3]);  // 2
    }
}`,
      },
      {
        title: "Euler Path & Circuit — Hierholzer's Algorithm",
        language: "java",
        content: `import java.util.*;

public class EulerPath {
    
    // ==================== EULER PATH/CIRCUIT (Undirected) ====================
    // Euler Circuit: All vertices have even degree
    // Euler Path: Exactly 2 vertices have odd degree (start and end)
    
    public static List<Integer> eulerPath(int V, List<List<Integer>> adj) {
        int[] degree = new int[V];
        for (int u = 0; u < V; u++) degree[u] = adj.get(u).size();
        
        // Check conditions
        int oddCount = 0, start = 0;
        for (int i = 0; i < V; i++) {
            if (degree[i] % 2 != 0) { oddCount++; start = i; }
        }
        if (oddCount != 0 && oddCount != 2) {
            System.out.println("No Euler path exists");
            return new ArrayList<>();
        }
        
        // Hierholzer's algorithm using iterative DFS
        int[] idx = new int[V]; // Current edge index for each vertex
        List<Integer>[] adjArr = new ArrayList[V];
        for (int i = 0; i < V; i++) adjArr[i] = new ArrayList<>(adj.get(i));
        
        Deque<Integer> stack = new ArrayDeque<>();
        List<Integer> path = new ArrayList<>();
        stack.push(start);
        
        while (!stack.isEmpty()) {
            int u = stack.peek();
            if (idx[u] < adjArr[u].size()) {
                int v = adjArr[u].get(idx[u]++);
                // Remove reverse edge (undirected)
                adjArr[v].remove(Integer.valueOf(u));
                stack.push(v);
            } else {
                path.add(stack.pop()); // Dead end — add to path
            }
        }
        
        Collections.reverse(path);
        return path;
    }
    
    // ==================== DIRECTED EULER PATH ====================
    // Euler Circuit: in-degree == out-degree for all vertices
    // Euler Path: Exactly one vertex has out-degree - in-degree = 1 (start)
    //             Exactly one vertex has in-degree - out-degree = 1 (end)
    
    public static List<Integer> directedEulerPath(int V, List<List<Integer>> adj) {
        int[] inDeg = new int[V], outDeg = new int[V];
        for (int u = 0; u < V; u++) {
            outDeg[u] = adj.get(u).size();
            for (int v : adj.get(u)) inDeg[v]++;
        }
        
        int start = 0;
        for (int i = 0; i < V; i++) {
            if (outDeg[i] - inDeg[i] == 1) { start = i; break; }
            if (outDeg[i] > 0) start = i; // Fallback for circuit
        }
        
        int[] idx = new int[V];
        Deque<Integer> stack = new ArrayDeque<>();
        List<Integer> path = new ArrayList<>();
        stack.push(start);
        
        while (!stack.isEmpty()) {
            int u = stack.peek();
            if (idx[u] < adj.get(u).size()) {
                stack.push(adj.get(u).get(idx[u]++));
            } else {
                path.add(stack.pop());
            }
        }
        
        Collections.reverse(path);
        return path;
    }
    
    // ==================== CENTROID DECOMPOSITION ====================
    // Preprocessing: O(n log n) | Query per centroid: O(log n)
    
    static int[] subtreeSize2, centroid;
    static boolean[] removed;
    static List<Integer>[] tree2;
    
    @SuppressWarnings("unchecked")
    public static void buildCentroidDecomp(int n, int[][] edges) {
        tree2 = new ArrayList[n];
        for (int i = 0; i < n; i++) tree2[i] = new ArrayList<>();
        for (int[] e : edges) { tree2[e[0]].add(e[1]); tree2[e[1]].add(e[0]); }
        subtreeSize2 = new int[n];
        removed = new boolean[n];
        centroid = new int[n]; // centroid[v] = centroid parent of v
        Arrays.fill(centroid, -1);
        
        decompose(0, -1, n);
    }
    
    private static void computeSize(int v, int p) {
        subtreeSize2[v] = 1;
        for (int u : tree2[v])
            if (u != p && !removed[u]) {
                computeSize(u, v);
                subtreeSize2[v] += subtreeSize2[u];
            }
    }
    
    private static int findCentroid(int v, int p, int treeSize) {
        for (int u : tree2[v])
            if (u != p && !removed[u] && subtreeSize2[u] > treeSize / 2)
                return findCentroid(u, v, treeSize);
        return v;
    }
    
    private static void decompose(int v, int parent, int treeSize) {
        computeSize(v, -1);
        int c = findCentroid(v, -1, treeSize);
        centroid[c] = parent;
        removed[c] = true;
        // Process queries centered at c here...
        for (int u : tree2[c])
            if (!removed[u]) decompose(u, c, subtreeSize2[u]);
    }
    
    public static void main(String[] args) {
        // Undirected graph for Euler circuit
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 4; i++) adj.add(new ArrayList<>());
        // 0-1-2-3-0, 0-2 (all even degree)
        adj.get(0).add(1); adj.get(1).add(0);
        adj.get(1).add(2); adj.get(2).add(1);
        adj.get(2).add(3); adj.get(3).add(2);
        adj.get(3).add(0); adj.get(0).add(3);
        adj.get(0).add(2); adj.get(2).add(0);
        
        System.out.println("Euler Circuit: " + eulerPath(4, adj));
    }
}`,
      },
    ],
    table: {
      headers: ["Algorithm", "Time Complexity", "Space", "Use Case"],
      rows: [
        ["Dinic's Max Flow", "O(V²E)", "O(V+E)", "Max flow, bipartite matching"],
        ["Ford-Fulkerson (BFS)", "O(VE²)", "O(V+E)", "Simpler max flow"],
        ["Binary Lifting LCA", "O(n log n) build, O(log n) query", "O(n log n)", "LCA, kth ancestor"],
        ["Euler Path (Hierholzer)", "O(V+E)", "O(V+E)", "Route inspection, DNA assembly"],
        ["0-1 BFS", "O(V+E)", "O(V)", "0/1 weighted shortest paths"],
        ["Centroid Decomposition", "O(n log n)", "O(n log n)", "Tree path queries"],
      ],
    },
  },
  {
    id: "graph-successor",
    title: "Successor Graphs (Functional Graphs)",
    difficulty: "Hard",
    timeComplexity: "O(n log n) preprocessing | O(log n) per query",
    spaceComplexity: "O(n log n)",
    theory: [
      "A **successor graph** (functional graph) is a directed graph where each node has exactly one outgoing edge. The successor of node x is denoted succ(x). Since each node has out-degree 1, the graph consists of **ρ-shaped components**: each component has exactly one cycle, with tails (paths) leading into it.",
      "**Key property**: Starting from any node and following successors, you will eventually enter a cycle. The structure of every connected component looks like the Greek letter ρ — a tail followed by a cycle.",
      "**Finding the k-th successor in O(log k)**: Precompute succ_k(x) = the node reached after following k successors from x. Using binary lifting: succ[x][0] = direct successor, succ[x][j] = succ[succ[x][j-1]][j-1] (the 2^j-th successor = apply 2^(j-1) twice). To find succ_k(x): decompose k in binary, apply the corresponding jumps.",
      "**Floyd's cycle detection** (tortoise and hare): Use two pointers — slow (moves 1 step) and fast (moves 2 steps). They meet inside the cycle. Then reset slow to start and advance both by 1 — they meet at the cycle entry. Cycle length = continue advancing from the meeting point until returning to it.",
      "**Applications**: Permutation cycles (each permutation is a functional graph), iterated function queries (f^k(x)), detecting cycles in linked lists, pseudorandom number generators, functional graph problems on Codeforces.",
    ],
    keyPoints: [
      "Every node has exactly one outgoing edge → ρ-shaped components",
      "Binary lifting for k-th successor: O(n log n) space, O(log k) query",
      "Floyd's algorithm: O(1) space cycle detection using slow/fast pointers",
      "Permutations are functional graphs — cycles = permutation cycles",
      "Common in CP: 'apply operation k times' problems",
    ],
    tip: "When a problem says 'apply function f repeatedly k times' where k can be up to 10^18, think binary lifting on the successor graph immediately.",
    code: [
      {
        title: "Successor Graph — Binary Lifting & Cycle Detection",
        language: "java",
        content: `import java.util.*;

public class SuccessorGraph {
    
    static final int LOG = 30; // Supports k up to ~10^9
    static int[][] succ; // succ[v][j] = 2^j-th successor of v
    
    // ==================== BINARY LIFTING ON SUCCESSOR GRAPH ====================
    
    public static void build(int[] next, int n) {
        succ = new int[n][LOG];
        for (int v = 0; v < n; v++) succ[v][0] = next[v];
        
        for (int j = 1; j < LOG; j++)
            for (int v = 0; v < n; v++)
                succ[v][j] = succ[succ[v][j-1]][j-1];
    }
    
    // Find k-th successor of x in O(log k)
    public static int kthSuccessor(int x, long k) {
        for (int j = 0; j < LOG && k > 0; j++) {
            if ((k >> j & 1) == 1) x = succ[x][j];
        }
        return x;
    }
    
    // ==================== FLOYD'S CYCLE DETECTION ====================
    // O(1) space, O(λ + μ) time where λ=tail, μ=cycle length
    
    public static int[] floydCycleDetection(int[] next, int start) {
        // Phase 1: Find meeting point
        int slow = next[start], fast = next[next[start]];
        while (slow != fast) {
            slow = next[slow];
            fast = next[next[fast]];
        }
        
        // Phase 2: Find cycle entry (tail length λ)
        int mu = 0;
        slow = start;
        while (slow != fast) {
            slow = next[slow];
            fast = next[fast];
            mu++;
        }
        
        // Phase 3: Find cycle length
        int cycleLen = 1;
        fast = next[slow];
        while (fast != slow) {
            fast = next[fast];
            cycleLen++;
        }
        
        return new int[]{slow, mu, cycleLen}; // {cycle_entry, tail_length, cycle_length}
    }
    
    // ==================== PERMUTATION CYCLES ====================
    // Find all cycles in a permutation (which IS a functional graph)
    
    public static List<List<Integer>> permutationCycles(int[] perm) {
        int n = perm.length;
        boolean[] visited = new boolean[n];
        List<List<Integer>> cycles = new ArrayList<>();
        
        for (int i = 0; i < n; i++) {
            if (visited[i]) continue;
            List<Integer> cycle = new ArrayList<>();
            int j = i;
            while (!visited[j]) {
                visited[j] = true;
                cycle.add(j);
                j = perm[j];
            }
            cycles.add(cycle);
        }
        return cycles;
    }
    
    public static void main(String[] args) {
        // Successor graph: 0→1→2→3→1 (tail: 0, cycle: 1→2→3→1)
        int[] next = {1, 2, 3, 1};
        build(next, 4);
        
        System.out.println("5th successor of 0: " + kthSuccessor(0, 5)); // 0→1→2→3→1→2 = 2
        System.out.println("10th successor of 0: " + kthSuccessor(0, 10)); // follows cycle
        
        int[] info = floydCycleDetection(next, 0);
        System.out.println("Cycle entry: " + info[0] + ", Tail: " + info[1] + ", Cycle len: " + info[2]);
        // Entry: 1, Tail: 1, Cycle: 3
        
        // Permutation cycles
        int[] perm = {2, 0, 1, 4, 3}; // 0→2→1→0, 3→4→3
        System.out.println("Permutation cycles: " + permutationCycles(perm));
    }
}`,
      },
    ],
    table: {
      headers: ["Operation", "Time", "Space", "Technique"],
      rows: [
        ["Build binary lifting", "O(n log n)", "O(n log n)", "DP on successors"],
        ["k-th successor query", "O(log k)", "O(1)", "Binary decomposition"],
        ["Cycle detection (Floyd)", "O(λ + μ)", "O(1)", "Slow/fast pointers"],
        ["All permutation cycles", "O(n)", "O(n)", "DFS traversal"],
      ],
    },
  },
];
