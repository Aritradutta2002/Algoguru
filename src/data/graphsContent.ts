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
      type: "graph",
      title: "Weighted Undirected Graph Example",
      data: {
        nodes: [
          { id: "1", label: "1", x: 50, y: 15, color: "success" },
          { id: "2", label: "2", x: 85, y: 25, color: "success" },
          { id: "3", label: "3", x: 90, y: 60, color: "success" },
          { id: "4", label: "4", x: 65, y: 80, color: "success" },
          { id: "5", label: "5", x: 35, y: 75, color: "success" },
          { id: "6", label: "6", x: 15, y: 50, color: "success" },
          { id: "7", label: "7", x: 60, y: 45, color: "success" },
        ],
        edges: [
          { from: "1", to: "2", weight: 28 },
          { from: "1", to: "6", weight: 10 },
          { from: "2", to: "3", weight: 16 },
          { from: "2", to: "7", weight: 14 },
          { from: "3", to: "4", weight: 12 },
          { from: "4", to: "5", weight: 22 },
          { from: "5", to: "6", weight: 25 },
          { from: "5", to: "7", weight: 24 },
          { from: "4", to: "7", weight: 18 },
        ],
        weighted: true,
        directed: false,
      },
    },
  },
  {
    id: "graph-types",
    title: "Graph Types Comparison",
    difficulty: "Easy",
    theory: [
      "Different problems require different types of graphs. Understanding these distinctions is crucial for selecting the right algorithm.",
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
    diagram: {
      type: "graph",
      title: "BFS Level-by-Level Traversal Visualization",
      data: {
        nodes: [
          { id: "0", label: "0", x: 50, y: 20, color: "primary" },
          { id: "1", label: "1", x: 30, y: 50, color: "info" },
          { id: "4", label: "4", x: 70, y: 50, color: "info" },
          { id: "2", label: "2", x: 20, y: 80, color: "success" },
          { id: "3", label: "3", x: 40, y: 80, color: "success" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "0", to: "4" },
          { from: "1", to: "2" },
          { from: "1", to: "3" },
          { from: "4", to: "3" },
        ],
        weighted: false,
        directed: false,
        highlightPath: ["0", "1", "2"],
      },
    },
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
    diagram: {
      type: "graph",
      title: "DFS Deep Traversal & Backtracking",
      data: {
        nodes: [
          { id: "0", label: "0", x: 50, y: 15, color: "primary" },
          { id: "1", label: "1", x: 35, y: 40, color: "info" },
          { id: "2", label: "2", x: 25, y: 65, color: "info" },
          { id: "3", label: "3", x: 15, y: 90, color: "accent" },
          { id: "4", label: "4", x: 35, y: 90, color: "warning" },
          { id: "5", label: "5", x: 65, y: 40, color: "warning" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "2" },
          { from: "2", to: "3" },
          { from: "2", to: "4" },
          { from: "0", to: "5" },
        ],
        weighted: false,
        directed: false,
        highlightPath: ["0", "1", "2", "3"],
      },
    },
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
    diagram: {
      type: "graph",
      title: "Dijkstra's Shortest Path Example (A to D)",
      data: {
        nodes: [
          { id: "A", label: "A", x: 15, y: 50, color: "primary" },
          { id: "B", label: "B", x: 50, y: 20, color: "info" },
          { id: "C", label: "C", x: 50, y: 80, color: "info" },
          { id: "D", label: "D", x: 85, y: 50, color: "success" },
        ],
        edges: [
          { from: "A", to: "B", weight: 4, color: "info" },
          { from: "A", to: "C", weight: 1, color: "success" },
          { from: "C", to: "B", weight: 2, color: "success" },
          { from: "B", to: "D", weight: 5, color: "info" },
          { from: "C", to: "D", weight: 5, color: "info" },
        ],
        weighted: true,
        directed: false,
        highlightPath: ["A", "C", "B"],
      },
    },
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
    diagram: {
      type: "flow",
      title: "Bellman-Ford — Edge Relaxation Phases",
      direction: "vertical",
      data: [
        { label: "Init: dist = [0, ∞, ∞, ∞] | All edges unrelaxed", color: "primary" },
        { label: "Phase 1: Relax edges → dist = [0,4,5,1]", color: "info" },
        { label: "Phase 2: Relax edges → dist = [0,4,2,1]", color: "info" },
        { label: "Phase 3 (V-1=3): No change → early stop", color: "success" },
        { label: "V-th phase check: No edge relaxes → No negative cycle", color: "success" },
        { label: "If V-th phase relaxes anything → Negative cycle exists!", color: "warning" },
        { label: "Key: V-1 phases enough (shortest path ≤ V-1 edges)", color: "accent" },
      ],
    },
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
    diagram: {
      type: "flow",
      title: "Floyd-Warshall — All-Pairs Shortest Paths",
      direction: "vertical",
      data: [
        { label: "Init: dist[i][j] = direct edge weight (or ∞)", color: "primary" },
        { label: "k=0: Can we route through vertex 0?", color: "info" },
        { label: "k=1: Can we route through vertices {0,1}?", color: "info" },
        { label: "k=2: Can we route through {0,1,2}?", color: "info" },
        { label: "k=n-1: All intermediates considered → done!", color: "success" },
        { label: "Formula: dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j])", color: "accent" },
        { label: "⚠ Loop order MUST be k → i → j (outer=k!)", color: "warning" },
      ],
    },
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
    id: "graph-mst-intro",
    title: "MST Fundamentals",
    difficulty: "Medium",
    theory: [
      "A Minimum Spanning Tree (MST) of a weighted undirected graph is a subset of edges that connects ALL vertices with the minimum possible total edge weight. It has exactly V-1 edges and no cycles — it's a tree that 'spans' the entire graph at minimum cost.",
      "**Real-world Analogy**: Imagine you are laying down optical fiber cables to connect 10 cities. You want every city to be able to communicate with every other city (directly or indirectly). To minimize cost, you want to use the minimum total length of cable. The optimal layout is an MST.",
      "**Core Properties**: (1) **V-1 Edges**: Any tree with V vertices must have exactly V-1 edges. (2) **Acyclic**: Adding any more edges will create a cycle. (3) **Uniqueness**: If all edge weights are distinct, the MST is unique. If not, multiple MSTs may exist with the same minimum total weight.",
      "**The Cut Property**: This is the 'Greedy' foundation for all MST algorithms. For any partition of vertices into two non-empty sets (a 'cut'), the lightest edge crossing that cut MUST be part of some MST. This is why we can greedily pick the smallest available edges as long as they don't form cycles.",
      "**The Cycle Property**: For any cycle in the graph, the heaviest edge in that cycle cannot be part of the MST. If we included it, we could replace it with a lighter edge from the same cycle and get a smaller tree.",
      "MST is NOT the same as shortest paths! A shortest path tree (from Dijkstra) minimizes distance from a SINGLE source. An MST minimizes the TOTAL weight of the entire tree. A shortest path from A to B in a graph might NOT use edges from the MST.",
    ],
    diagram: {
      type: "table-visual",
      title: "MST vs Shortest Path (Dijkstra)",
      data: [
        {
          label: "Minimum Spanning Tree",
          color: "success",
          children: [
            { label: "Goal: Min total weight of all edges" },
            { label: "Structure: Undirected weighted graph" },
            { label: "Logic: Cut/Cycle property (Greedy)" },
            { label: "Result: One tree for the whole graph" }
          ]
        },
        {
          label: "Shortest Path Tree",
          color: "info",
          children: [
            { label: "Goal: Min distance from source to each node" },
            { label: "Structure: Directed or Undirected" },
            { label: "Logic: Edge relaxation" },
            { label: "Result: Different tree for each source" }
          ]
        }
      ]
    },
    keyPoints: [
      "MST minimizes total edge sum; Dijkstra minimizes individual path costs",
      "MST property: V-1 edges, connected, no cycles",
      "Cut Property: Lightest edge across any cut is in the MST",
      "Cycle Property: Heaviest edge in any cycle is NOT in the MST",
      "If all weights are distinct, the MST is unique",
    ],
    tip: "If a problem asks to 'connect all nodes with minimum cost', it's almost always an MST problem. If it asks for 'minimum cost to reach destination', it's a shortest path problem.",
  },
  {
    id: "graph-kruskal",
    title: "Kruskal's Algorithm",
    difficulty: "Hard",
    timeComplexity: "O(E log E) or O(E log V)",
    spaceComplexity: "O(V + E)",
    theory: [
      "Kruskal's algorithm (1956) is an elegant greedy approach: 'Always pick the cheapest edge that doesn't create a cycle.' It builds the forest of components and merges them until only one tree remains.",
      "**Step-by-Step Logic**: (1) Sort all edges by weight in ascending order. (2) Initialize each vertex as its own component (using Union-Find). (3) Iterate through sorted edges: if the edge (u, v) connects two different components, ADD it to the MST and UNION the components. Otherwise, SKIP it to avoid a cycle.",
      "**Why it works**: Kruskal's essentially processes every possible 'cut' in the graph. Since it picks the lightest edge between components, it satisfies the Cut Property at every step.",
      "**Data Structure Efficiency**: The bottleneck is sorting edges (O(E log E)). The actual merging using Union-Find (DSU) takes almost constant time amortized, making it extremely fast for sparse graphs.",
      "**Optimization**: If edges are already sorted or have a small range of weights (weights ≤ 10^6), we can use Counting Sort/Bucket Sort to achieve O(E).",
      "Example Walkthrough: Edges {(A,B,1), (B,C,4), (A,C,3), (C,D,2)}. Sorted: (A,B,1), (C,D,2), (A,C,3), (B,C,4). (1) Pick (A,B,1). (2) Pick (C,D,2). (3) Pick (A,C,3) — Connects {A,B} and {C,D}. (4) Skip (B,C,4) — forms a cycle A-B-C-A. Result: 1+2+3 = 6.",
    ],
    diagram: {
      type: "graph",
      title: "Kruskal's MST — Final Tree",
      data: {
        nodes: [
          { id: "A", label: "A", x: 20, y: 50, color: "success" },
          { id: "B", label: "B", x: 50, y: 15, color: "success" },
          { id: "C", label: "C", x: 50, y: 85, color: "success" },
          { id: "D", label: "D", x: 80, y: 50, color: "success" },
        ],
        edges: [
          { from: "A", to: "B", weight: 1, color: "success" },
          { from: "C", to: "D", weight: 2, color: "success" },
          { from: "A", to: "C", weight: 3, color: "success" },
          { from: "B", to: "C", weight: 4, color: "warning" },
        ],
        weighted: true,
        directed: false,
        highlightPath: ["A", "B"],
      },
    },
    keyPoints: [
      "Greedy strategy: process lightest edges first",
      "Relies on Union-Find (DSU) for cycle detection — O(α(V))",
      "Best for sparse graphs where sorting is the main cost",
      "Always produces a Minimum Spanning Forest if the graph is disconnected",
      "Highly intuitive and common in competitive programming",
    ],
    code: [
      {
        title: "Kruskal's MST — Complete & Optimized",
        language: "java",
        content: `import java.util.*;

public class KruskalsMST {
    static class Edge implements Comparable<Edge> {
        int u, v, w;
        Edge(int u, int v, int w) { this.u = u; this.v = v; this.w = w; }
        public int compareTo(Edge other) { return Integer.compare(this.w, other.w); }
    }

    static class DSU {
        int[] parent, rank;
        DSU(int n) {
            parent = new int[n]; rank = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int i) {
            if (parent[i] == i) return i;
            return parent[i] = find(parent[i]); // Path compression
        }
        boolean union(int i, int j) {
            int rootI = find(i), rootJ = find(j);
            if (rootI != rootJ) {
                if (rank[rootI] < rank[rootJ]) parent[rootI] = rootJ;
                else if (rank[rootI] > rank[rootJ]) parent[rootJ] = rootI;
                else { parent[rootI] = rootJ; rank[rootJ]++; }
                return true;
            }
            return false;
        }
    }

    public static List<Edge> kruskal(int n, List<Edge> edges) {
        Collections.sort(edges); // O(E log E)
        DSU dsu = new DSU(n);
        List<Edge> mst = new ArrayList<>();
        int mstWeight = 0;

        for (Edge e : edges) {
            if (dsu.union(e.u, e.v)) { // O(α(V))
                mst.add(e);
                mstWeight += e.w;
                if (mst.size() == n - 1) break;
            }
        }
        return mst;
    }
}`
      }
    ]
  },
  {
    id: "graph-prim",
    title: "Prim's Algorithm",
    difficulty: "Hard",
    timeComplexity: "O(E log V) or O(V²) for dense graphs",
    spaceComplexity: "O(V + E)",
    theory: [
      "Prim's algorithm (1930 / 1957) grows the MST from a single starting vertex, one edge at a time. It's essentially Dijkstra's algorithm adapted for MST: instead of minimizing path *from* source, it minimizes weight to connect to the *existing* tree.",
      "**Step-by-Step Logic**: (1) Pick an arbitrary starting vertex. (2) Keep track of two sets: 'In MST' and 'Not yet in MST'. (3) At each step, find the minimum weight edge that connects an 'In MST' vertex to a 'Not yet in MST' vertex. (4) Add that vertex and edge to the tree. Repeat until all vertices are included.",
      "**Algorithm Choice**: (1) **Adjacency List + Priority Queue**: O(E log V). Preferred for sparse graphs. (2) **Adjacency Matrix + Linear Scan**: O(V²). Better for very dense graphs (where E ≈ V²).",
      "**Correctness Proof**: Prim's satisfies the Cut Property at every step. The 'In MST' set vs 'Not In MST' set defines a cut, and Prim's always picks the minimum weight edge across that cut, ensuring it's part of the MST.",
      "**Differences from Dijkstra**: In Dijkstra, `dist[v]` is the distance from source to v. In Prim, `key[v]` is the distance from the ENTIRE growing tree to v. Relaxation in Prim: `if (w(u,v) < key[v]) key[v] = w(u,v)`.",
      "Example Walkthrough: Start at A. Neighbors: (A,B,4), (A,C,1). (1) Pick (A,C,1). Tree: {A,C}. Neighbors of {A,C}: (A,B,4), (C,B,2), (C,D,5). (2) Pick (C,B,2). Tree: {A,B,C}. Neighbors: (C,D,5), (B,D,3). (3) Pick (B,D,3). Total Weight: 1+2+3 = 6.",
    ],
    diagram: {
      type: "graph",
      title: "Prim's MST — Growing from A",
      data: {
        nodes: [
          { id: "A", label: "A", x: 15, y: 50, color: "primary" },
          { id: "B", label: "B", x: 50, y: 20, color: "success" },
          { id: "C", label: "C", x: 50, y: 80, color: "success" },
          { id: "D", label: "D", x: 85, y: 50, color: "success" },
        ],
        edges: [
          { from: "A", to: "B", weight: 4, color: "info" },
          { from: "A", to: "C", weight: 1, color: "success" },
          { from: "C", to: "B", weight: 2, color: "success" },
          { from: "B", to: "D", weight: 3, color: "success" },
          { from: "C", to: "D", weight: 5, color: "info" },
        ],
        weighted: true,
        directed: false,
        highlightPath: ["A", "C", "B", "D"],
      },
    },
    keyPoints: [
      "Greedy strategy: grow tree from a seed vertex",
      "Uses a Priority Queue to pick the next cheapest node",
      "Better for dense graphs (if implemented as O(V²))",
      "Does not require edge sorting upfront",
      "Algorithm logic is very similar to Dijkstra",
    ],
    code: [
      {
        title: "Prim's MST — Sparse & Dense Implementations",
        language: "java",
        content: `import java.util.*;

public class PrimsMST {
    // ==================== O(E log V) Implementation (Sparse) ====================
    static class Node implements Comparable<Node> {
        int id, key;
        Node(int id, int key) { this.id = id; this.key = key; }
        public int compareTo(Node o) { return Integer.compare(this.key, o.key); }
    }

    public static int primSparse(List<List<int[]>> adj, int n) {
        int[] key = new int[n];
        boolean[] inMST = new boolean[n];
        Arrays.fill(key, Integer.MAX_VALUE);
        key[0] = 0;

        PriorityQueue<Node> pq = new PriorityQueue<>();
        pq.offer(new Node(0, 0));
        int totalWeight = 0, count = 0;

        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            if (inMST[curr.id]) continue;
            
            inMST[curr.id] = true;
            totalWeight += curr.key;
            count++;

            for (int[] neighbor : adj.get(curr.id)) {
                int v = neighbor[0], w = neighbor[1];
                if (!inMST[v] && w < key[v]) {
                    key[v] = w;
                    pq.offer(new Node(v, key[v]));
                }
            }
        }
        return count == n ? totalWeight : -1;
    }

    // ==================== O(V²) Implementation (Dense) ====================
    public static int primDense(int[][] matrix, int n) {
        int[] key = new int[n];
        boolean[] inMST = new boolean[n];
        Arrays.fill(key, Integer.MAX_VALUE);
        key[0] = 0;
        int totalWeight = 0;

        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int j = 0; j < n; j++) {
                if (!inMST[j] && (u == -1 || key[j] < key[u])) u = j;
            }
            if (key[u] == Integer.MAX_VALUE) return -1;
            
            inMST[u] = true;
            totalWeight += key[u];
            for (int v = 0; v < n; v++) {
                if (matrix[u][v] != 0 && !inMST[v] && matrix[u][v] < key[v]) {
                    key[v] = matrix[u][v];
                }
            }
        }
        return totalWeight;
    }
}`
      }
    ]
  },
  {
    id: "graph-topo",
    title: "Topological Sort Deep Dive",
    difficulty: "Medium",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "Topological Sort is a linear ordering of vertices in a **Directed Acyclic Graph (DAG)** such that for every directed edge `u → v`, `u` appears before `v`. Think of it as a valid sequence of tasks where prerequisites must be completed first.",
      "**Constraint**: Topological sort ONLY exists for DAGs. If the graph has even one cycle, no valid topological order can exist. This makes it a primary tool for **Cycle Detection** in directed graphs.",
      "**Algorithm 1: Kahn's Algorithm (BFS-based)**: (1) Calculate the 'in-degree' (number of incoming edges) for every node. (2) Put all nodes with in-degree 0 into a queue. (3) While the queue is not empty: pull a node `u`, add it to the result, and 'remove' its outgoing edges by decrementing neighbor in-degrees. If a neighbor's in-degree becomes 0, add it to the queue.",
      "**Lexicographical Smallest Order**: If you need the 'alphabetically first' valid topological order, use a **Priority Queue (Min-Heap)** instead of a standard Queue in Kahn's Algorithm. This ensures that among all available tasks with no prerequisites, we always pick the one with the smallest ID.",
      "**Algorithm 2: DFS-based**: Run a standard DFS. When a node's recursive calls are finished (post-order), push it onto a stack. The final stack (or reversed list) is a topological order. This is often faster to code but slightly harder to adapt for lexicographical order.",
      "**Shortest Path in DAG**: In a DAG, you can find the shortest (or longest) path in O(V + E) by relaxing edges in topological order. This works even with **negative edge weights**, making it superior to Dijkstra for DAGs.",
    ],
    diagram: {
      type: "flow",
      title: "Kahn's Algorithm — Topological Sort (BFS)",
      direction: "vertical",
      data: [
        { label: "Init: Compute in-degree of all nodes", color: "primary" },
        { label: "Queue nodes with in-degree 0 → [A, D]", color: "info" },
        { label: "Process A → decrement B's in-degree", color: "success" },
        { label: "Process D → decrement E's in-degree → E now 0", color: "success" },
        { label: "Process E → decrement C's in-degree", color: "info" },
        { label: "Process B → decrement C's in-degree → C now 0", color: "info" },
        { label: "Result: [A, D, E, B, C] — valid topological order", color: "accent" },
      ],
    },
    keyPoints: [
      "Valid only for Directed Acyclic Graphs (DAGs)",
      "Kahn's Algorithm is usually preferred for cycle detection",
      "Use Priority Queue for Lexicographical Topo Sort",
      "Number of valid topo sorts can be very large (up to V!)",
      "Foundation for path counting and DP on graphs",
    ],
    code: [
      {
        title: "Kahn's Algorithm (BFS) — Standard & Lexicographical",
        language: "java",
        content: `import java.util.*;

public class TopologicalSort {
    // Standard Kahn's Algorithm
    public static List<Integer> kahn(int v, List<List<Integer>> adj) {
        int[] inDegree = new int[v];
        for (int i = 0; i < v; i++) {
            for (int neighbor : adj.get(i)) inDegree[neighbor]++;
        }

        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < v; i++) if (inDegree[i] == 0) q.add(i);

        List<Integer> result = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            result.add(u);
            for (int neighbor : adj.get(u)) {
                if (--inDegree[neighbor] == 0) q.add(neighbor);
            }
        }
        return result.size() == v ? result : new ArrayList<>();
    }

    // Lexicographical Smallest (use PriorityQueue)
    public static List<Integer> lexSmallest(int v, List<List<Integer>> adj) {
        int[] inDegree = new int[v];
        for (int i = 0; i < v; i++) {
            for (int neighbor : adj.get(i)) inDegree[neighbor]++;
        }

        PriorityQueue<Integer> pq = new PriorityQueue<>(); // Min-heap
        for (int i = 0; i < v; i++) if (inDegree[i] == 0) pq.add(i);

        List<Integer> result = new ArrayList<>();
        while (!pq.isEmpty()) {
            int u = pq.poll();
            result.add(u);
            for (int neighbor : adj.get(u)) {
                if (--inDegree[neighbor] == 0) pq.add(neighbor);
            }
        }
        return result.size() == v ? result : new ArrayList<>();
    }
}`
      }
    ],
    tip: "If a problem mentions 'prerequisites' and asks for any valid order, it's a Topo Sort problem. If it asks for the 'smallest' order, use PriorityQueue in Kahn's.",
  },
  {
    id: "graph-scc",
    title: "SCC: Strongly Connected Components",
    difficulty: "Expert",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "A **Strongly Connected Component (SCC)** is a maximal subgroup of nodes in a directed graph where every node can reach every other node in the same group. SCCs help simplify complex cyclic graphs.",
      "**Condensation Graph**: If you shrink every SCC into a single node, the resulting graph is always a **DAG**. This allows us to apply DAG algorithms (like Topo Sort or Longest Path) to any directed graph by first condensing its SCCs.",
      "**Tarjan's Algorithm (Single Pass)**: Tracks discovery time and the 'lowest' node reachable in the DFS tree. A node `u` is the root of an SCC when `low[u] == disc[u]`. Highly efficient as it only requires one DFS pass.",
      "**Kosaraju's Algorithm (Two Passes)**: (1) DFS finish-time stack. (2) Reverse graph edges. (3) DFS in stack order on reversed graph. More intuitive for some but requires more memory for graph reversal.",
      "**2-SAT Solver**: 2-Satisfiability problems can be solved in linear time using SCCs! A 2-SAT formula is unsatisfiable if and only if a variable `x` and its negation `not x` end up in the same SCC.",
    ],
    diagram: {
      type: "flow",
      title: "Tarjan's SCC — Finding Strongly Connected Components",
      direction: "vertical",
      data: [
        { label: "DFS from node 0 → assign disc & low values", color: "primary" },
        { label: "Push nodes onto stack as we enter them", color: "info" },
        { label: "Back edge found? Update low[u] = min(low[u], disc[v])", color: "info" },
        { label: "low[u] == disc[u]? → u is SCC root!", color: "success" },
        { label: "Pop stack until u → that's one SCC", color: "success" },
        { label: "Repeat for all unvisited nodes", color: "info" },
        { label: "Result: Condensation graph is always a DAG", color: "accent" },
      ],
    },
    keyPoints: [
      "SCCs partition a directed graph into reachability clusters",
      "Condensing SCCs always results in a DAG (Directed Acyclic Graph)",
      "Used in connectivity analysis, cycle detection, and 2-SAT solvers",
      "Tarjan's is usually the winner in terms of performance (one pass)",
    ],
    code: [
      {
        title: "Tarjan's SCC — Expert Implementation",
        language: "java",
        content: `import java.util.*;

public class TarjansSCC {
    int time = 0;
    int[] disc, low;
    boolean[] onStack;
    Stack<Integer> st;
    List<List<Integer>> sccs;

    public List<List<Integer>> findSCCs(int n, List<List<Integer>> adj) {
        disc = new int[n]; low = new int[n]; onStack = new boolean[n];
        Arrays.fill(disc, -1);
        st = new Stack<>();
        sccs = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            if (disc[i] == -1) dfs(i, adj);
        }
        return sccs;
    }

    private void dfs(int u, List<List<Integer>> adj) {
        disc[u] = low[u] = time++;
        st.push(u); onStack[u] = true;

        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                dfs(v, adj);
                low[u] = Math.min(low[u], low[v]);
            } else if (onStack[v]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }

        if (low[u] == disc[u]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int node = st.pop();
                onStack[node] = false;
                scc.add(node);
                if (u == node) break;
            }
            sccs.add(scc);
        }
    }
}`
      }
    ],
    tip: "Use SCCs to simplify a messy directed graph with cycles into a clean DAG of components.",
  },

  {
    id: "graph-dsu",
    title: "DSU — Union-Find Deep Dive",
    difficulty: "Medium",
    timeComplexity: "O(α(V)) amortized — nearly O(1)",
    spaceComplexity: "O(V)",
    theory: [
      "**Disjoint Set Union (DSU)**, or Union-Find, maintains a partition of a set into disjoint groups. It's the 'Swiss Army Knife' of connectivity: used for Kruskal's MST, detecting cycles, finding connected components, and solving complex offline queries.",
      "**Sets as Trees**: Each group is represented as a tree where every child points to its parent. The **Root** of the tree is the 'representative' of the group. If `find(u) == find(v)`, they belong to the same group.",
      "**Optimization 1: Path Compression**: During the `find(u)` operation, we make every node on the path from `u` to the root point *directly* to the root. This 'flattens' the tree, ensuring future queries are extremely fast. Logic: `parent[u] = find(parent[u])`.",
      "**Optimization 2: Union by Rank/Size**: When merging two trees, we always attach the **shorter** (or smaller) tree under the root of the **taller** (or larger) one. This prevents the tree from becoming a long chain. Combined with path compression, the time complexity becomes **O(α(V))**, where α is the inverse Ackermann function (≤ 4 for all practical purposes).",
      "**Advanced: DSU with Rollbacks**: In some problems, you need to 'undo' a union (e.g., in persistent connectivity or divide and conquer on edges). To support this, we **cannot use path compression** (as it destroys tree structure). We use only Union by Rank/Size (O(log V)) and maintain a stack of changes to undo them in O(1).",
      "**Advanced: DSU with Path Info**: You can store extra information on edges (e.g., distance to root or weight parity). For example, to check if a graph is **Bipartite** using DSU, we maintain `dist[u]` (parity of path length to root). If we merge `u` and `v` with a new edge and their distances have the same parity, we've found an odd cycle!",
      "**Offline Queries on DSU**: Many problems that seem to require deletions can be solved using DSU by processing queries in reverse. If nodes are removed, start from the final state and 'add' them back by processing edges from the end to the start.",
    ],
    diagram: {
      type: "hierarchy",
      title: "DSU — Path Compression & Union by Rank",
      data: [
        {
          label: "Before Path Compression",
          color: "warning",
          children: [
            { label: "Root", children: [{ label: "A", children: [{ label: "B", children: [{ label: "C" }] }] }] }
          ]
        },
        {
          label: "After Path Compression",
          color: "success",
          children: [
            { label: "Root", children: [{ label: "A" }, { label: "B" }, { label: "C" }] }
          ]
        },
        {
          label: "Union by Rank",
          color: "info",
          children: [
            { label: "Attach shorter tree under taller root" },
            { label: "Prevents long chains" },
            { label: "Combined: O(α(V)) ≈ O(1)" }
          ]
        }
      ],
    },
    keyPoints: [
      "Always use BOTH Path Compression and Union by Rank for O(α(V))",
      "For undo/rollback support: use ONLY Union by rank/size (O(log V))",
      "DSU can track component sizes, counts, and path weights",
      "Great for dynamic connectivity (add edges, query components)",
      "Standard for Kruskal's MST and Cycle Detection in undirected graphs",
    ],
    code: [
      {
        title: "Standard DSU (Alpha Implementation)",
        language: "java",
        content: `public class DSU {
    int[] parent, size, rank;
    int components;

    public DSU(int n) {
        parent = new int[n]; size = new int[n]; rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i; size[i] = 1;
        }
    }

    // Path compression: O(α(V)) amortized
    public int find(int x) {
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]);
    }

    // Union by rank: keeps tree balanced
    public boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false;

        if (rank[rootX] < rank[rootY]) parent[rootX] = rootY;
        else if (rank[rootX] > rank[rootY]) parent[rootY] = rootX;
        else { parent[rootX] = rootY; rank[rootY]++; }
        
        size[find(rootY)] += size[rootX]; // Size tracking
        components--;
        return true;
    }
}`
      },
      {
        title: "Advanced: DSU with Weights (Bipartite Check)",
        language: "java",
        content: `public class WeightedDSU {
    int[] parent, dist; // dist[i] = parity of distance to root
    
    public WeightedDSU(int n) {
        parent = new int[n]; dist = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int[] find(int i) {
        if (parent[i] == i) return new int[]{i, 0};
        int[] res = find(parent[i]);
        parent[i] = res[0];
        dist[i] = (dist[i] + res[1]) % 2; // Propagate parity
        return new int[]{parent[i], dist[i]};
    }

    public boolean addEdge(int i, int j) {
        int[] rootI = find(i), rootY = find(j);
        if (rootI[0] != rootY[0]) {
            parent[rootI[0]] = rootY[0];
            dist[rootI[0]] = (rootI[1] + rootY[1] + 1) % 2;
            return true;
        }
        return rootI[1] != rootY[1]; // False if same parity (odd cycle!)
    }
}`
      }
    ],
    tip: "When you hear 'groups', 'connectivity', or 'merging components', DSU should be your first thought. For problems with deletions, try reversing the operations and using DSU as 'additions'.",
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
    diagram: {
      type: "table-visual",
      title: "SCC Algorithms — Tarjan's vs Kosaraju's",
      data: [
        {
          label: "Tarjan's Algorithm",
          color: "success",
          children: [
            { label: "Single DFS pass — O(V+E)" },
            { label: "Uses disc[] and low[] arrays" },
            { label: "low[u]==disc[u] → SCC root found" },
            { label: "⭐ Preferred in competitive programming" }
          ]
        },
        {
          label: "Kosaraju's Algorithm",
          color: "info",
          children: [
            { label: "Two DFS passes — O(V+E)" },
            { label: "Pass 1: DFS on G, record exit order" },
            { label: "Pass 2: DFS on G^T in reverse exit order" },
            { label: "More intuitive, needs graph reversal" }
          ]
        },
        {
          label: "Condensation Graph",
          color: "accent",
          children: [
            { label: "Shrink each SCC → single node" },
            { label: "Result is always a DAG" },
            { label: "Enables Topo Sort on cyclic graphs" },
            { label: "Foundation for 2-SAT solver" }
          ]
        }
      ],
    },
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
    diagram: {
      type: "flow",
      title: "Bridges & Articulation Points — Detection Logic",
      direction: "vertical",
      data: [
        { label: "DFS assigns disc[u] and low[u] for each node", color: "primary" },
        { label: "low[u] = min(disc[u], disc[back-edges], low[children])", color: "info" },
        { label: "Bridge: edge (u,v) where low[v] > disc[u]", color: "warning" },
        { label: "  → Subtree of v has NO back edge above u", color: "warning" },
        { label: "AP (root): 2+ children in DFS tree", color: "success" },
        { label: "AP (non-root): child v where low[v] ≥ disc[u]", color: "success" },
        { label: "Key: low[] tells us if subtree can reach above", color: "accent" },
      ],
    },
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
    diagram: {
      type: "hierarchy",
      title: "Euler Tour — Flattening Tree to Array",
      data: [
        {
          label: "Tree Structure",
          color: "primary",
          children: [
            { label: "0", children: [{ label: "1", children: [{ label: "3" }, { label: "4" }] }, { label: "2", children: [{ label: "5" }] }] }
          ]
        },
        {
          label: "Flattened Array",
          color: "success",
          children: [
            { label: "Index: [0, 1, 2, 3, 4, 5]" },
            { label: "Node:  [0, 1, 3, 4, 2, 5]" },
            { label: "Subtree(1) = [1,3,4]" }
          ]
        },
        {
          label: "Key Insight",
          color: "accent",
          children: [
            { label: "Subtree of v = range [tin[v], tout[v]]" },
            { label: "Subtree query → range query" },
            { label: "Use Segment Tree / BIT on flat array" }
          ]
        }
      ],
    },
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
    diagram: {
      type: "flow",
      title: "Heavy-Light Decomposition — Chain Splitting",
      direction: "vertical",
      data: [
        { label: "Step 1: Compute subtree sizes via DFS", color: "primary" },
        { label: "Step 2: Heavy child = child with largest subtree", color: "info" },
        { label: "Step 3: Decompose into heavy chains", color: "info" },
        { label: "  Heavy chain: follow heavy edges until leaf", color: "success" },
        { label: "  Light edge: starts a new chain", color: "warning" },
        { label: "Step 4: Flatten chains into segment tree array", color: "info" },
        { label: "Path query: O(log²n) via O(log n) chain jumps", color: "accent" },
      ],
    },
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
    id: "graph-eulerian",
    title: "Eulerian Path & Circuit",
    difficulty: "Hard",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    theory: [
      "An **Eulerian Path** is a trail in a graph which visits every **edge** exactly once. An **Eulerian Circuit** is an Eulerian path which starts and ends on the same vertex.",
      "**Existence (Undirected)**: (1) Connected (all edges in one component). (2) **Circuit**: Every vertex has even degree. (3) **Path**: Exactly zero or two vertices have odd degree.",
      "**Existence (Directed)**: (1) Weakly connected. (2) **Circuit**: For every vertex, `in-degree == out-degree`. (3) **Path**: For all but two vertices `in == out`. For the other two, one has `out - in = 1` (start) and one has `in - out = 1` (end).",
      "**Hierholzer's Algorithm**: The standard O(E) approach. Start at a valid starting vertex. Perform a DFS, but only add a vertex to the result list **after** all its outgoing edges are explored (post-order). The reversed list is the Eulerian circuit/path.",
      "**Implementation Detail**: To achieve O(E), you must ensure each edge is deleted or 'marked' immediately so it's never processed twice. In Java, using an `ArrayList` of `Iterator`s for the adjacency list is a common trick to keep track of current progress.",
    ],
    diagram: {
      type: "flow",
      title: "Eulerian Path & Circuit — Existence Conditions",
      direction: "vertical",
      data: [
        { label: "Undirected Circuit: All vertices have even degree", color: "primary" },
        { label: "Undirected Path: Exactly 0 or 2 odd-degree vertices", color: "info" },
        { label: "Directed Circuit: indegree == outdegree for ALL", color: "success" },
        { label: "Directed Path: One node out-in=1 (start), one in-out=1 (end)", color: "info" },
        { label: "Hierholzer's: DFS post-order → reversed = circuit", color: "accent" },
        { label: "Key: Visit every EDGE exactly once", color: "warning" },
      ],
    },
    keyPoints: [
      "Visits every EDGE exactly once (contrast with Hamiltonian: every Vertex)",
      "Hierholzer's Algorithm runs in linear time O(E)",
      "Zero or two odd-degree vertices for an undirected path",
      "In-degree == Out-degree for all vertices for a directed circuit",
    ],
    code: [
      {
        title: "Hierholzer's Algorithm (Directed Eulerian Circuit)",
        language: "java",
        content: `public List<Integer> getEulerianCircuit(int v, List<List<Integer>> adj) {
    LinkedList<Integer> circuit = new LinkedList<>();
    Stack<Integer> stack = new Stack<>();
    int[] currEdge = new int[v];

    stack.push(0); // Start from any node with an edge
    while (!stack.isEmpty()) {
        int u = stack.peek();
        if (currEdge[u] < adj.get(u).size()) {
            stack.push(adj.get(u).get(currEdge[u]++));
        } else {
            circuit.addFirst(stack.pop());
        }
    }
    return circuit;
}`
      }
    ],
    tip: "If a problem asks to 'trace a path using all lines on a drawing without lifting the pen', it's an Eulerian Path problem.",
  },
  {
    id: "graph-lca",
    title: "LCA: Binary Lifting Deep Dive",
    difficulty: "Expert",
    timeComplexity: "O(V log V) build | O(log V) query",
    spaceComplexity: "O(V log V)",
    theory: [
      "The **Lowest Common Ancestor (LCA)** of nodes `u` and `v` is the deepest node that is an ancestor of both. While RMQ + Euler Tour is O(1) query, **Binary Lifting** is the most flexible and widely used technique in competitive programming.",
      "**The Preprocessing**: Precompute `up[v][i]`, which is the `2^i`-th ancestor of node `v`. This takes O(V log V) using the relation: `up[v][i] = up[up[v][i-1]][i-1]`.",
      "**The Query**: (1) Bring both nodes to the same depth by jumping the deeper node up in powers of 2. (2) If they are now the same, that's the LCA. (3) If not, jump both nodes up simultaneously in decreasing powers of 2, but ONLY if they don't land on the same node. The parent of the final nodes is the LCA.",
      "**Path Queries**: Binary lifting can also precompute path information (like min/max/sum on path) in the same O(V log V) table. For example, `minWeight[v][i]` would store the minimum edge weight on the path from `v` to its `2^i`-th ancestor.",
    ],
    diagram: {
      type: "hierarchy",
      title: "LCA — Binary Lifting Table",
      data: [
        {
          label: "up[v][0] = direct parent",
          color: "primary",
          children: [
            { label: "up[v][1] = grandparent" },
            { label: "up[v][2] = 4th ancestor" },
            { label: "up[v][k] = 2^k-th ancestor" }
          ]
        },
        {
          label: "Query: LCA(u, v)",
          color: "info",
          children: [
            { label: "1. Bring u,v to same depth" },
            { label: "2. If same → that's LCA" },
            { label: "3. Jump both up until parents match" }
          ]
        },
        {
          label: "Distance Formula",
          color: "accent",
          children: [
            { label: "dist(u,v) = depth[u]+depth[v]-2*depth[LCA]" }
          ]
        }
      ],
    },
    keyPoints: [
      "Standard approach for tree path queries",
      "Preprocessing: O(N log N) | Query: O(log N)",
      "Can store path aggregates (sum, min, max) in the sparse table",
      "Extremely robust for tree DP and distance queries",
    ],
    code: [
      {
        title: "LCA — Binary Lifting Implementation",
        language: "java",
        content: `public class LCA {
    int log;
    int[][] up;
    int[] depth;

    public void preprocess(int root, int n, List<List<Integer>> adj) {
        log = (int) (Math.log(n) / Math.log(2)) + 1;
        up = new int[n][log + 1];
        depth = new int[n];
        dfs(root, root, 0, adj);
    }

    private void dfs(int u, int p, int d, List<List<Integer>> adj) {
        depth[u] = d;
        up[u][0] = p;
        for (int i = 1; i <= log; i++) {
            up[u][i] = up[up[u][i - 1]][i - 1];
        }
        for (int v : adj.get(u)) {
            if (v != p) dfs(v, u, d + 1, adj);
        }
    }

    public int getLCA(int u, int v) {
        if (depth[u] < depth[v]) { int tmp = u; u = v; v = tmp; }
        for (int i = log; i >= 0; i--) {
            if (depth[u] - (1 << i) >= depth[v]) u = up[u][i];
        }
        if (u == v) return u;
        for (int i = log; i >= 0; i--) {
            if (up[u][i] != up[v][i]) {
                u = up[u][i];
                v = up[v][i];
            }
        }
        return up[u][0];
    }
}`
      }
    ],
    tip: "LCA is the foundation for finding the distance between two nodes in a tree: `dist(u, v) = depth[u] + depth[v] - 2 * depth[LCA(u, v)]`.",
  },
  {
    id: "graph-flow",
    title: "Flow Networks: Max Flow & Min Cut",
    difficulty: "Expert",
    timeComplexity: "Edmonds-Karp: O(V E²) | Dinic: O(V² E)",
    spaceComplexity: "O(V + E)",
    theory: [
      "A **Flow Network** is a directed graph where each edge has a **Capacity**. We want to find the maximum amount of 'flow' that can be sent from a **Source (S)** to a **Sink (T)**.",
      "**Ford-Fulkerson Method**: Find any 'augmenting path' from S to T in the **Residual Graph** (a graph showing remaining capacities and 'back-flow' edges). Add its bottleneck capacity to the total flow. Repeat until no paths exist.",
      "**Edmonds-Karp**: A specific implementation of Ford-Fulkerson that uses **BFS** to find the shortest augmenting path. This guarantees a polynomial time complexity of O(V E²).",
      "**Max-Flow Min-Cut Theorem**: The maximum flow in a network is exactly equal to the capacity of the **Minimum Cut** (the minimum capacity of edges whose removal disconnects S from T). This is a deep duality used in many partition problems.",
      "**Bipartite Matching via Max Flow**: Create a dummy source S connected to all left nodes with capacity 1, and all right nodes connected to a dummy sink T with capacity 1. Max flow == Max Bipartite Matching.",
    ],
    diagram: {
      type: "flow",
      title: "Max Flow — Edmonds-Karp Algorithm",
      direction: "vertical",
      data: [
        { label: "Source S → push flow toward Sink T", color: "primary" },
        { label: "Find augmenting path via BFS in residual graph", color: "info" },
        { label: "Push bottleneck capacity along the path", color: "success" },
        { label: "Add reverse edges (residual) for flow 'undo'", color: "info" },
        { label: "Repeat until no augmenting path exists", color: "success" },
        { label: "Max Flow = Min Cut (duality theorem)", color: "accent" },
        { label: "Time: O(V × E²) with BFS (Edmonds-Karp)", color: "warning" },
      ],
    },
    keyPoints: [
      "Source (S) produces flow, Sink (T) consumes it",
      "Residual graph handles 'undoing' flow via back-edges",
      "Max Flow is always equal to Min Cut",
      "Edmonds-Karp (BFS) vs Dinic (Level Graph) vs Push-Relabel",
    ],
    code: [
      {
        title: "Edmonds-Karp Algorithm (Max Flow)",
        language: "java",
        content: `public int maxFlow(int s, int t, int n, int[][] capacity) {
    int[][] flow = new int[n][n];
    int totalFlow = 0;
    while (true) {
        int[] parent = new int[n];
        Arrays.fill(parent, -1);
        Queue<Integer> q = new LinkedList<>();
        q.add(s); parent[s] = s;
        while (!q.isEmpty() && parent[t] == -1) {
            int u = q.poll();
            for (int v = 0; v < n; v++) {
                if (parent[v] == -1 && capacity[u][v] - flow[u][v] > 0) {
                    parent[v] = u; q.add(v);
                }
            }
        }
        if (parent[t] == -1) break;
        int push = Integer.MAX_VALUE;
        for (int v = t; v != s; v = parent[v]) {
            push = Math.min(push, capacity[parent[v]][v] - flow[parent[v]][v]);
        }
        for (int v = t; v != s; v = parent[v]) {
            flow[parent[v]][v] += push;
            flow[v][parent[v]] -= push;
        }
        totalFlow += push;
    }
    return totalFlow;
}`
      }
    ],
    tip: "Min-Cut is often the hidden answer to problems asking for the 'minimum cost to disconnect' something.",
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
    diagram: {
      type: "flow",
      title: "Bipartite Matching — Augmenting Path Method",
      direction: "vertical",
      data: [
        { label: "Left set L | Right set R | Edges only between L and R", color: "primary" },
        { label: "Start: Empty matching", color: "info" },
        { label: "Find augmenting path: unmatched L → matched → ... → unmatched R", color: "info" },
        { label: "Flip edges along path: unmatched→matched, matched→unmatched", color: "success" },
        { label: "Matching size increases by 1", color: "success" },
        { label: "Repeat until no augmenting path exists", color: "info" },
        { label: "Hopcroft-Karp: O(E√V) via BFS+DFS phases", color: "accent" },
      ],
    },
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
    diagram: {
      type: "flow",
      title: "Min-Cost Max-Flow — Algorithm Flow",
      direction: "vertical",
      data: [
        { label: "Each edge: (capacity, cost per unit flow)", color: "primary" },
        { label: "Find cheapest augmenting path (SPFA/Bellman-Ford)", color: "info" },
        { label: "Push max possible flow along that path", color: "success" },
        { label: "Total cost += flow × path_cost", color: "info" },
        { label: "Residual edges have NEGATIVE cost (undo flow)", color: "warning" },
        { label: "Repeat until no augmenting path exists", color: "success" },
        { label: "Result: Max flow at minimum total cost", color: "accent" },
      ],
    },
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
    diagram: {
      type: "table-visual",
      title: "Advanced Graph Algorithms — Cheat Sheet",
      data: [
        {
          label: "Max Flow Algorithms",
          color: "primary",
          children: [
            { label: "Edmonds-Karp: O(VE²) — BFS augmenting paths" },
            { label: "Dinic's: O(V²E) — Level graph + blocking flow" },
            { label: "Push-Relabel: O(V²√E) — For large graphs" }
          ]
        },
        {
          label: "Tree Algorithms",
          color: "success",
          children: [
            { label: "Binary Lifting LCA: O(n log n) build, O(log n) query" },
            { label: "Centroid Decomposition: O(n log n) build" },
            { label: "Euler Tour + RMQ: O(n) build, O(1) LCA query" }
          ]
        },
        {
          label: "Special BFS",
          color: "info",
          children: [
            { label: "0-1 BFS: O(V+E) with deque" },
            { label: "Multi-source BFS: All sources in queue" },
            { label: "BFS on implicit graphs: Generate neighbors on-the-fly" }
          ]
        }
      ],
    },
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
    diagram: {
      type: "flow",
      title: "Successor Graph — ρ-Shaped Structure & Binary Lifting",
      direction: "vertical",
      data: [
        { label: "Each node has exactly ONE outgoing edge", color: "primary" },
        { label: "Structure: Tail → Cycle (ρ-shaped)", color: "info" },
        { label: "Example: 0→1→2→3→1 (tail=0, cycle=1-2-3)", color: "info" },
        { label: "Binary Lifting: succ[v][j] = 2^j-th successor", color: "success" },
        { label: "Query k-th successor in O(log k)", color: "success" },
        { label: "Floyd's cycle detection: slow/fast pointers", color: "warning" },
        { label: "Key: Follow successors → always enters a cycle", color: "accent" },
      ],
    },
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
