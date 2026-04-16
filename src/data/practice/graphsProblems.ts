import { ContentSection } from "../recursionContent";

export const graphsEasy: ContentSection[] = [
  { id: "graphs-easy-1", title: "Number of Islands", difficulty: "Easy", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given a 2D grid of `'1'`s (land) and `'0'`s (water), count the number of islands.", "**Example:** `Input: grid = [[\"1\",\"1\",\"0\"],[\"1\",\"0\",\"0\"],[\"0\",\"0\",\"1\"]]` → `Output: 2`.", "**Approach:** DFS/BFS from each unvisited `'1'`. Mark all connected land cells as visited."],
    keyPoints: ["DFS/BFS with in-place marking (change '1' to '0') avoids extra visited array"],
    code: [{ title: "Number of Islands — DFS", language: "java", content: `public class NumIslands {
    public static int numIslands(char[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++)
            for (int j = 0; j < grid[0].length; j++)
                if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
        return count;
    }
    static void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);
    }
    public static void main(String[] args) {
        char[][] grid = {{'1','1','0'},{'1','0','0'},{'0','0','1'}};
        System.out.println(numIslands(grid)); // 2
    }
}` }],
  },
  { id: "graphs-easy-2", title: "Flood Fill", difficulty: "Easy", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given starting pixel `(sr, sc)` and new color, fill all connected same-colored pixels.", "**Example:** `Input: image = [[1,1,1],[1,1,0],[1,0,1]], sr=1, sc=1, color=2` → `Output: [[2,2,2],[2,2,0],[2,0,1]]`.", "**Approach:** DFS from `(sr,sc)`. If current pixel matches original color, change and recurse to 4 neighbors."],
    keyPoints: ["Check if original color equals new color first to avoid infinite recursion"],
    code: [{ title: "Flood Fill — DFS", language: "java", content: `public class FloodFill {
    public static int[][] floodFill(int[][] image, int sr, int sc, int color) {
        int original = image[sr][sc];
        if (original != color) dfs(image, sr, sc, original, color);
        return image;
    }
    static void dfs(int[][] img, int r, int c, int orig, int newColor) {
        if (r < 0 || r >= img.length || c < 0 || c >= img[0].length || img[r][c] != orig) return;
        img[r][c] = newColor;
        dfs(img, r+1, c, orig, newColor); dfs(img, r-1, c, orig, newColor);
        dfs(img, r, c+1, orig, newColor); dfs(img, r, c-1, orig, newColor);
    }
}` }],
  },
  { id: "graphs-easy-3", title: "Find if Path Exists (LC 1971)", difficulty: "Easy", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Given `n` nodes and edges, determine if there's a path between `source` and `destination`.", "**Example:** `Input: n=3, edges=[[0,1],[1,2],[2,0]], source=0, destination=2` → `Output: true`.", "**Approach:** BFS/DFS from source, check if destination is reachable. Alternatively, Union-Find."],
    keyPoints: ["Simple graph traversal — good warmup for harder graph problems"],
    code: [{ title: "Find Path — BFS", language: "java", content: `import java.util.*;

public class FindPath {
    public static boolean validPath(int n, int[][] edges, int source, int destination) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        boolean[] visited = new boolean[n];
        Queue<Integer> q = new LinkedList<>();
        q.add(source); visited[source] = true;
        while (!q.isEmpty()) {
            int cur = q.poll();
            if (cur == destination) return true;
            for (int next : adj.get(cur))
                if (!visited[next]) { visited[next] = true; q.add(next); }
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(validPath(3, new int[][]{{0,1},{1,2},{2,0}}, 0, 2)); // true
    }
}` }],
  },
  { id: "graphs-easy-4", title: "Find the Town Judge (LC 997)", difficulty: "Easy", timeComplexity: "O(V + E)", spaceComplexity: "O(V)",
    theory: ["In a town of `n` people, the judge trusts nobody but is trusted by everyone else. Given trust pairs, find the judge (or -1).", "**Example:** `Input: n=3, trust=[[1,3],[2,3]]` → `Output: 3`.", "**Approach:** Track in-degree and out-degree. The judge has in-degree = n-1 and out-degree = 0."],
    keyPoints: ["Net trust (in-degree - out-degree) = n-1 identifies the judge"],
    code: [{ title: "Find the Town Judge", language: "java", content: `public class TownJudge {
    public static int findJudge(int n, int[][] trust) {
        int[] netTrust = new int[n + 1];
        for (int[] t : trust) { netTrust[t[0]]--; netTrust[t[1]]++; }
        for (int i = 1; i <= n; i++)
            if (netTrust[i] == n - 1) return i;
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(findJudge(3, new int[][]{{1,3},{2,3}}));     // 3
        System.out.println(findJudge(3, new int[][]{{1,3},{2,3},{3,1}})); // -1
    }
}` }],
  },
  { id: "graphs-easy-5", title: "Island Perimeter (LC 463)", difficulty: "Easy", timeComplexity: "O(m * n)", spaceComplexity: "O(1)",
    theory: ["Given a 2D grid where 1 is land and 0 is water, find the perimeter of the island.", "**Example:** `Input: grid = [[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]` → `Output: 16`.", "**Approach:** For each land cell, add 4 edges minus shared edges with neighbors."],
    keyPoints: ["Each land cell contributes 4 - (number of land neighbors) to perimeter"],
    code: [{ title: "Island Perimeter", language: "java", content: `public class IslandPerimeter {
    public static int islandPerimeter(int[][] grid) {
        int perimeter = 0;
        for (int i = 0; i < grid.length; i++)
            for (int j = 0; j < grid[0].length; j++)
                if (grid[i][j] == 1) {
                    perimeter += 4;
                    if (i > 0 && grid[i-1][j] == 1) perimeter -= 2;
                    if (j > 0 && grid[i][j-1] == 1) perimeter -= 2;
                }
        return perimeter;
    }

    public static void main(String[] args) {
        int[][] grid = {{0,1,0,0},{1,1,1,0},{0,1,0,0},{1,1,0,0}};
        System.out.println(islandPerimeter(grid)); // 16
    }
}` }],
  },
  { id: "graphs-easy-6", title: "Find Center of Star Graph (LC 1791)", difficulty: "Easy", timeComplexity: "O(1)", spaceComplexity: "O(1)",
    theory: ["A star graph has one center node connected to every other node. Given edges, find the center.", "**Example:** `Input: edges = [[1,2],[2,3],[4,2]]` → `Output: 2`.", "**Approach:** The center appears in every edge. Just check the first two edges — the common node is the center."],
    keyPoints: ["O(1) solution: the center is the node common to the first two edges"],
    code: [{ title: "Find Center — O(1)", language: "java", content: `public class StarCenter {
    public static int findCenter(int[][] edges) {
        return edges[0][0] == edges[1][0] || edges[0][0] == edges[1][1]
            ? edges[0][0] : edges[0][1];
    }

    public static void main(String[] args) {
        System.out.println(findCenter(new int[][]{{1,2},{2,3},{4,2}})); // 2
    }
}` }],
  },
  { id: "graphs-easy-7", title: "Find if Path Exists — Union Find", difficulty: "Easy", timeComplexity: "O(V + E * α(V))", spaceComplexity: "O(V)",
    theory: ["Alternative approach to LC 1971 using Union-Find (Disjoint Set Union).", "**Example:** `Input: n=6, edges=[[0,1],[0,2],[3,5],[5,4],[4,3]], source=0, dest=5` → `Output: false`.", "**Approach:** Union all edges. Check if source and destination have the same root."],
    keyPoints: ["Union-Find is ideal for connectivity queries — O(α(n)) per operation"],
    code: [{ title: "Path Exists — Union Find", language: "java", content: `public class PathUnionFind {
    static int[] parent, rank;

    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    static void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return;
        if (rank[ra] < rank[rb]) parent[ra] = rb;
        else if (rank[ra] > rank[rb]) parent[rb] = ra;
        else { parent[rb] = ra; rank[ra]++; }
    }

    public static boolean validPath(int n, int[][] edges, int src, int dst) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) union(e[0], e[1]);
        return find(src) == find(dst);
    }

    public static void main(String[] args) {
        System.out.println(validPath(6, new int[][]{{0,1},{0,2},{3,5},{5,4},{4,3}}, 0, 5)); // false
    }
}` }],
  },
  { id: "graphs-easy-8", title: "Detect Cycle in Undirected Graph", difficulty: "Easy", timeComplexity: "O(V + E)", spaceComplexity: "O(V)",
    theory: ["Given an undirected graph, determine if it contains a cycle.", "**Example:** `Input: n=4, edges=[[0,1],[1,2],[2,3],[3,1]]` → `Output: true`.", "**Approach:** BFS/DFS. During traversal, if we visit a node that's already visited and isn't the parent → cycle found. Or use Union-Find."],
    keyPoints: ["Union-Find: if two nodes being connected already share a root → cycle"],
    code: [{ title: "Cycle Detection — Union Find", language: "java", content: `public class CycleDetection {
    static int[] parent;

    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public static boolean hasCycle(int n, int[][] edges) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return true;
            parent[ra] = rb;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(hasCycle(4, new int[][]{{0,1},{1,2},{2,3},{3,1}})); // true
        System.out.println(hasCycle(3, new int[][]{{0,1},{1,2}}));             // false
    }
}` }],
  },
];

export const graphsMedium: ContentSection[] = [
  { id: "graphs-medium-1", title: "Course Schedule", difficulty: "Medium", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Determine if you can finish all courses given prerequisites (detect cycle in directed graph).", "**Example:** `Input: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]` → `Output: true`.", "**Approach:** Topological Sort using Kahn's BFS."],
    keyPoints: ["If topological sort processes all nodes → no cycle → can finish all courses"],
    code: [{ title: "Course Schedule — Kahn's Topological Sort", language: "java", content: `import java.util.*;

public class CourseSchedule {
    public static boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] inDeg = new int[numCourses];
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) { adj.get(p[1]).add(p[0]); inDeg[p[0]]++; }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.add(i);
        int count = 0;
        while (!q.isEmpty()) { int cur = q.poll(); count++;
            for (int next : adj.get(cur)) if (--inDeg[next] == 0) q.add(next); }
        return count == numCourses;
    }
    public static void main(String[] args) {
        System.out.println(canFinish(4, new int[][]{{1,0},{2,0},{3,1},{3,2}})); // true
    }
}` }],
  },
  { id: "graphs-medium-2", title: "Word Ladder", difficulty: "Medium", timeComplexity: "O(m^2 * n)", spaceComplexity: "O(m * n)",
    theory: ["Find shortest transformation from `beginWord` to `endWord`, changing one letter at a time.", "**Example:** `Input: beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]` → `Output: 5`.", "**Approach:** BFS. Each word is a node. Edges connect words differing by one letter."],
    keyPoints: ["BFS guarantees shortest path in unweighted graphs"],
    code: [{ title: "Word Ladder — BFS", language: "java", content: `import java.util.*;

public class WordLadder {
    public static int ladderLength(String begin, String end, List<String> wordList) {
        Set<String> dict = new HashSet<>(wordList);
        if (!dict.contains(end)) return 0;
        Queue<String> q = new LinkedList<>();
        q.add(begin); int level = 1;
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                char[] word = q.poll().toCharArray();
                for (int j = 0; j < word.length; j++) {
                    char orig = word[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        word[j] = c;
                        String next = new String(word);
                        if (next.equals(end)) return level + 1;
                        if (dict.remove(next)) q.add(next);
                    }
                    word[j] = orig;
                }
            }
            level++;
        }
        return 0;
    }
    public static void main(String[] args) {
        System.out.println(ladderLength("hit", "cog", Arrays.asList("hot","dot","dog","lot","log","cog"))); // 5
    }
}` }],
  },
  { id: "graphs-medium-3", title: "Rotting Oranges (LC 994)", difficulty: "Medium", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Every minute, rotten oranges rot adjacent fresh oranges. Return minutes until no fresh orange remains, or -1 if impossible.", "**Example:** `Input: grid = [[2,1,1],[1,1,0],[0,1,1]]` → `Output: 4`.", "**Approach:** Multi-source BFS. Start from all rotten oranges simultaneously."],
    keyPoints: ["Multi-source BFS is the key — add all initial rotten oranges to queue at once"],
    code: [{ title: "Rotting Oranges — Multi-source BFS", language: "java", content: `import java.util.*;

public class RottingOranges {
    public static int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length, fresh = 0;
        Queue<int[]> q = new LinkedList<>();
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) q.add(new int[]{i, j});
                else if (grid[i][j] == 1) fresh++;
            }
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        int minutes = 0;
        while (!q.isEmpty() && fresh > 0) {
            minutes++;
            int size = q.size();
            for (int i = 0; i < size; i++) {
                int[] cur = q.poll();
                for (int[] d : dirs) {
                    int nr = cur[0] + d[0], nc = cur[1] + d[1];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2; fresh--; q.add(new int[]{nr, nc});
                    }
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }

    public static void main(String[] args) {
        System.out.println(orangesRotting(new int[][]{{2,1,1},{1,1,0},{0,1,1}})); // 4
    }
}` }],
  },
  { id: "graphs-medium-4", title: "Clone Graph (LC 133)", difficulty: "Medium", timeComplexity: "O(V + E)", spaceComplexity: "O(V)",
    theory: ["Given a reference to a node in a connected undirected graph, return a deep copy.", "**Example:** Clone a graph with nodes 1→2→3→4 with various connections.", "**Approach:** BFS/DFS with a HashMap mapping old nodes to clones. For each node, create its clone and connect to cloned neighbors."],
    keyPoints: ["HashMap (old → clone) prevents infinite loops and ensures each node is cloned once"],
    code: [{ title: "Clone Graph — BFS", language: "java", content: `import java.util.*;

// class Node { int val; List<Node> neighbors; }

public class CloneGraph {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Map<Node, Node> map = new HashMap<>();
        Queue<Node> q = new LinkedList<>();
        map.put(node, new Node(node.val));
        q.add(node);
        while (!q.isEmpty()) {
            Node cur = q.poll();
            for (Node neighbor : cur.neighbors) {
                if (!map.containsKey(neighbor)) {
                    map.put(neighbor, new Node(neighbor.val));
                    q.add(neighbor);
                }
                map.get(cur).neighbors.add(map.get(neighbor));
            }
        }
        return map.get(node);
    }
}` }],
  },
  { id: "graphs-medium-5", title: "Pacific Atlantic Water Flow (LC 417)", difficulty: "Medium", timeComplexity: "O(m * n)", spaceComplexity: "O(m * n)",
    theory: ["Given a height matrix, find cells where water can flow to both the Pacific (top/left) and Atlantic (bottom/right) oceans.", "**Example:** `Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]` → `Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]`.", "**Approach:** Reverse thinking. DFS/BFS from ocean borders inward (go uphill). Cells reachable from both oceans are the answer."],
    keyPoints: ["Reverse BFS from borders is more efficient than forward DFS from every cell"],
    code: [{ title: "Pacific Atlantic Water Flow — DFS", language: "java", content: `import java.util.*;

public class PacificAtlantic {
    public static List<List<Integer>> pacificAtlantic(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        boolean[][] pacific = new boolean[m][n], atlantic = new boolean[m][n];
        for (int i = 0; i < m; i++) { dfs(heights, pacific, i, 0); dfs(heights, atlantic, i, n-1); }
        for (int j = 0; j < n; j++) { dfs(heights, pacific, 0, j); dfs(heights, atlantic, m-1, j); }
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (pacific[i][j] && atlantic[i][j])
                    result.add(Arrays.asList(i, j));
        return result;
    }

    static void dfs(int[][] h, boolean[][] visited, int r, int c) {
        visited[r][c] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < h.length && nc >= 0 && nc < h[0].length
                && !visited[nr][nc] && h[nr][nc] >= h[r][c])
                dfs(h, visited, nr, nc);
        }
    }
}` }],
  },
  { id: "graphs-medium-6", title: "Cheapest Flights Within K Stops (LC 787)", difficulty: "Medium", timeComplexity: "O(K * E)", spaceComplexity: "O(V)",
    theory: ["Find cheapest price from `src` to `dst` with at most `k` stops.", "**Example:** `Input: n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1` → `Output: 700`.", "**Approach:** Bellman-Ford with k+1 iterations. Or BFS with priority queue (modified Dijkstra)."],
    keyPoints: ["Bellman-Ford with limited relaxation rounds naturally handles the k-stops constraint"],
    code: [{ title: "Cheapest Flights — Bellman-Ford", language: "java", content: `import java.util.*;

public class CheapestFlights {
    public static int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        int[] prices = new int[n];
        Arrays.fill(prices, Integer.MAX_VALUE);
        prices[src] = 0;
        for (int i = 0; i <= k; i++) {
            int[] temp = prices.clone();
            for (int[] f : flights) {
                if (prices[f[0]] == Integer.MAX_VALUE) continue;
                temp[f[1]] = Math.min(temp[f[1]], prices[f[0]] + f[2]);
            }
            prices = temp;
        }
        return prices[dst] == Integer.MAX_VALUE ? -1 : prices[dst];
    }

    public static void main(String[] args) {
        int[][] flights = {{0,1,100},{1,2,100},{2,0,100},{1,3,600},{2,3,200}};
        System.out.println(findCheapestPrice(4, flights, 0, 3, 1)); // 700
    }
}` }],
  },
  { id: "graphs-medium-7", title: "Building Roads (CSES)", difficulty: "Medium", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Given `n` cities and `m` roads, find the minimum number of new roads needed to connect all cities. Output the roads.", "**Example:** If there are 3 connected components → need 2 new roads.", "**Approach:** Find connected components (BFS/DFS/Union-Find). Connect component representatives with n-1 roads."],
    keyPoints: ["Number of new roads = number of connected components - 1"],
    code: [{ title: "Building Roads — CSES", language: "java", content: `import java.util.*;

public class BuildingRoads {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            adj.get(a).add(b); adj.get(b).add(a);
        }
        boolean[] visited = new boolean[n + 1];
        List<Integer> components = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            if (!visited[i]) {
                components.add(i);
                Queue<Integer> q = new LinkedList<>();
                q.add(i); visited[i] = true;
                while (!q.isEmpty()) {
                    int cur = q.poll();
                    for (int next : adj.get(cur))
                        if (!visited[next]) { visited[next] = true; q.add(next); }
                }
            }
        }
        System.out.println(components.size() - 1);
        for (int i = 1; i < components.size(); i++)
            System.out.println(components.get(i - 1) + " " + components.get(i));
    }
}` }],
  },
  { id: "graphs-medium-8", title: "Message Route (CSES)", difficulty: "Medium", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Find the shortest route (minimum edges) from node 1 to node n, or report IMPOSSIBLE.", "**Example:** BFS from node 1 to node n, tracking parent pointers to reconstruct path.", "**Approach:** Standard BFS with parent tracking for path reconstruction."],
    keyPoints: ["BFS gives shortest path in unweighted graphs — reconstruct via parent array"],
    code: [{ title: "Message Route — CSES BFS", language: "java", content: `import java.util.*;

public class MessageRoute {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            adj.get(a).add(b); adj.get(b).add(a);
        }
        int[] parent = new int[n + 1];
        Arrays.fill(parent, -1);
        parent[1] = 0;
        Queue<Integer> q = new LinkedList<>();
        q.add(1);
        while (!q.isEmpty()) {
            int cur = q.poll();
            if (cur == n) break;
            for (int next : adj.get(cur))
                if (parent[next] == -1) { parent[next] = cur; q.add(next); }
        }
        if (parent[n] == -1) { System.out.println("IMPOSSIBLE"); return; }
        List<Integer> path = new ArrayList<>();
        for (int x = n; x != 0; x = parent[x]) path.add(x);
        Collections.reverse(path);
        System.out.println(path.size());
        StringBuilder sb = new StringBuilder();
        for (int p : path) sb.append(p).append(" ");
        System.out.println(sb.toString().trim());
    }
}` }],
  },
];

export const graphsHard: ContentSection[] = [
  { id: "graphs-hard-1", title: "Dijkstra's Shortest Path", difficulty: "Hard", timeComplexity: "O((V+E) log V)", spaceComplexity: "O(V + E)",
    theory: ["Find shortest path from a source to all vertices in a weighted directed graph.", "**Example:** `Input: n=5, edges=[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3]], source=0` → `Output: [0, 3, 1, 4, 7]`.", "**Approach:** Min-heap (PriorityQueue). Greedily pick the closest unvisited vertex, relax all its edges."],
    keyPoints: ["Skip outdated heap entries with `if (d > dist[u]) continue`"],
    code: [{ title: "Dijkstra's Algorithm — Min Heap", language: "java", content: `import java.util.*;

public class Dijkstra {
    public static int[] shortestPath(int n, int[][] edges, int src) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(new int[]{e[1], e[2]});
        int[] dist = new int[n]; Arrays.fill(dist, Integer.MAX_VALUE); dist[src] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{0, src});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll(); int d = cur[0], u = cur[1];
            if (d > dist[u]) continue;
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.offer(new int[]{dist[v], v}); }
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        int[][] edges = {{0,1,4},{0,2,1},{2,1,2},{1,3,1},{2,3,5},{3,4,3}};
        System.out.println(Arrays.toString(shortestPath(5, edges, 0))); // [0, 3, 1, 4, 7]
    }
}` }],
  },
  { id: "graphs-hard-2", title: "Strongly Connected Components (Kosaraju's)", difficulty: "Hard", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Find all SCCs in a directed graph.", "**Example:** `Input: n=5, edges=[[0,1],[1,2],[2,0],[1,3],[3,4]]` → `Output: [[0,1,2], [3], [4]]`.", "**Approach:** Two-pass DFS. First: finish-order. Second: DFS on reversed graph in reverse finish order."],
    keyPoints: ["Two DFS passes + graph reversal identifies all strongly connected components"],
    code: [{ title: "Kosaraju's SCC Algorithm", language: "java", content: `import java.util.*;

public class KosarajuSCC {
    public static List<List<Integer>> findSCCs(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>(), radj = new ArrayList<>();
        for (int i = 0; i < n; i++) { adj.add(new ArrayList<>()); radj.add(new ArrayList<>()); }
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); radj.get(e[1]).add(e[0]); }
        boolean[] visited = new boolean[n]; Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (!visited[i]) dfs1(i, adj, visited, stack);
        Arrays.fill(visited, false);
        List<List<Integer>> sccs = new ArrayList<>();
        while (!stack.isEmpty()) {
            int node = stack.pop();
            if (!visited[node]) { List<Integer> scc = new ArrayList<>(); dfs2(node, radj, visited, scc); sccs.add(scc); }
        }
        return sccs;
    }
    static void dfs1(int u, List<List<Integer>> adj, boolean[] vis, Deque<Integer> stack) {
        vis[u] = true; for (int v : adj.get(u)) if (!vis[v]) dfs1(v, adj, vis, stack); stack.push(u);
    }
    static void dfs2(int u, List<List<Integer>> radj, boolean[] vis, List<Integer> scc) {
        vis[u] = true; scc.add(u); for (int v : radj.get(u)) if (!vis[v]) dfs2(v, radj, vis, scc);
    }
    public static void main(String[] args) {
        System.out.println(findSCCs(5, new int[][]{{0,1},{1,2},{2,0},{1,3},{3,4}}));
    }
}` }],
  },
  { id: "graphs-hard-3", title: "Word Ladder (LC 127)", difficulty: "Hard", timeComplexity: "O(m^2 * n)", spaceComplexity: "O(m * n)",
    theory: ["Find shortest transformation sequence length from beginWord to endWord.", "**Example:** `Input: beginWord = \"hit\", endWord = \"cog\"` → `Output: 5` — hit→hot→dot→dog→cog.", "**Approach:** Bidirectional BFS for optimization. Start BFS from both ends, meeting in the middle."],
    keyPoints: ["Bidirectional BFS reduces search space from O(b^d) to O(b^(d/2))"],
    code: [{ title: "Word Ladder — Bidirectional BFS", language: "java", content: `import java.util.*;

public class WordLadderBidir {
    public static int ladderLength(String begin, String end, List<String> wordList) {
        Set<String> dict = new HashSet<>(wordList);
        if (!dict.contains(end)) return 0;
        Set<String> front = new HashSet<>(), back = new HashSet<>();
        front.add(begin); back.add(end);
        int level = 1;
        while (!front.isEmpty() && !back.isEmpty()) {
            if (front.size() > back.size()) { Set<String> tmp = front; front = back; back = tmp; }
            Set<String> nextFront = new HashSet<>();
            for (String word : front) {
                char[] chars = word.toCharArray();
                for (int i = 0; i < chars.length; i++) {
                    char orig = chars[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[i] = c;
                        String next = new String(chars);
                        if (back.contains(next)) return level + 1;
                        if (dict.remove(next)) nextFront.add(next);
                    }
                    chars[i] = orig;
                }
            }
            front = nextFront; level++;
        }
        return 0;
    }
}` }],
  },
  { id: "graphs-hard-4", title: "Critical Connections (LC 1192)", difficulty: "Hard", timeComplexity: "O(V + E)", spaceComplexity: "O(V + E)",
    theory: ["Find all bridges (critical connections) in an undirected graph — edges whose removal disconnects the graph.", "**Example:** `Input: n=4, connections=[[0,1],[1,2],[2,0],[1,3]]` → `Output: [[1,3]]`.", "**Approach:** Tarjan's algorithm. DFS with discovery time and low-link values. An edge (u,v) is a bridge if `low[v] > disc[u]`."],
    keyPoints: ["Tarjan's bridge-finding: `low[v] > disc[u]` means no back edge from v's subtree to u or above"],
    code: [{ title: "Critical Connections — Tarjan's", language: "java", content: `import java.util.*;

public class CriticalConnections {
    static int timer = 0;

    public static List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
        List<List<Integer>> adj = new ArrayList<>(), result = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (List<Integer> e : connections) {
            adj.get(e.get(0)).add(e.get(1));
            adj.get(e.get(1)).add(e.get(0));
        }
        int[] disc = new int[n], low = new int[n];
        Arrays.fill(disc, -1);
        timer = 0;
        dfs(0, -1, adj, disc, low, result);
        return result;
    }

    static void dfs(int u, int parent, List<List<Integer>> adj, int[] disc, int[] low, List<List<Integer>> result) {
        disc[u] = low[u] = timer++;
        for (int v : adj.get(u)) {
            if (v == parent) continue;
            if (disc[v] == -1) {
                dfs(v, u, adj, disc, low, result);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) result.add(Arrays.asList(u, v));
            } else {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }
}` }],
  },
  { id: "graphs-hard-5", title: "Network Delay Time (LC 743)", difficulty: "Hard", timeComplexity: "O((V+E) log V)", spaceComplexity: "O(V + E)",
    theory: ["Given a network of `n` nodes and weighted directed edges, find time for signal to reach all nodes from source `k`. Return -1 if impossible.", "**Example:** `Input: times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2` → `Output: 2`.", "**Approach:** Dijkstra from source. Answer = max of all shortest distances."],
    keyPoints: ["Dijkstra + take max of all distances — if any node is unreachable, return -1"],
    code: [{ title: "Network Delay Time — Dijkstra", language: "java", content: `import java.util.*;

public class NetworkDelay {
    public static int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
        int[] dist = new int[n + 1]; Arrays.fill(dist, Integer.MAX_VALUE); dist[k] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{0, k});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            if (cur[0] > dist[cur[1]]) continue;
            for (int[] e : adj.get(cur[1])) {
                if (dist[cur[1]] + e[1] < dist[e[0]]) {
                    dist[e[0]] = dist[cur[1]] + e[1];
                    pq.offer(new int[]{dist[e[0]], e[0]});
                }
            }
        }
        int maxDist = 0;
        for (int i = 1; i <= n; i++) maxDist = Math.max(maxDist, dist[i]);
        return maxDist == Integer.MAX_VALUE ? -1 : maxDist;
    }

    public static void main(String[] args) {
        System.out.println(networkDelayTime(new int[][]{{2,1,1},{2,3,1},{3,4,1}}, 4, 2)); // 2
    }
}` }],
  },
  { id: "graphs-hard-6", title: "Shortest Routes I (CSES)", difficulty: "Hard", timeComplexity: "O((V+E) log V)", spaceComplexity: "O(V + E)",
    theory: ["CSES classic. Given n cities and m directed weighted roads, find shortest distance from city 1 to all other cities.", "**Approach:** Dijkstra's algorithm from node 1 with adjacency list and priority queue."],
    keyPoints: ["Standard Dijkstra — CSES version with 1-indexed nodes"],
    code: [{ title: "Shortest Routes I — CSES Dijkstra", language: "java", content: `import java.util.*;

public class ShortestRoutes {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        List<List<long[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            long w = sc.nextLong();
            adj.get(a).add(new long[]{b, w});
        }
        long[] dist = new long[n + 1];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[1] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.offer(new long[]{0, 1});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0]; int u = (int) cur[1];
            if (d > dist[u]) continue;
            for (long[] e : adj.get(u)) {
                int v = (int) e[0]; long w = e[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.offer(new long[]{dist[v], v});
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= n; i++) sb.append(dist[i]).append(i < n ? " " : "\\n");
        System.out.print(sb);
    }
}` }],
  },
  { id: "graphs-hard-7", title: "Swim in Rising Water (LC 778)", difficulty: "Hard", timeComplexity: "O(n^2 log n)", spaceComplexity: "O(n^2)",
    theory: ["Given an n×n grid of elevations, find minimum time `t` such that you can swim from (0,0) to (n-1,n-1). At time `t`, you can swim through cells with elevation ≤ t.", "**Example:** `Input: grid = [[0,2],[1,3]]` → `Output: 3`.", "**Approach:** Modified Dijkstra / binary search + BFS. Use min-heap where priority = max elevation on path."],
    keyPoints: ["Priority = max elevation on path so far — Dijkstra variant"],
    code: [{ title: "Swim in Rising Water — Dijkstra Variant", language: "java", content: `import java.util.*;

public class SwimInWater {
    public static int swimInWater(int[][] grid) {
        int n = grid.length;
        int[][] dist = new int[n][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = grid[0][0];
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.offer(new int[]{grid[0][0], 0, 0});
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int t = cur[0], r = cur[1], c = cur[2];
            if (r == n-1 && c == n-1) return t;
            if (t > dist[r][c]) continue;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                    int nt = Math.max(t, grid[nr][nc]);
                    if (nt < dist[nr][nc]) { dist[nr][nc] = nt; pq.offer(new int[]{nt, nr, nc}); }
                }
            }
        }
        return dist[n-1][n-1];
    }

    public static void main(String[] args) {
        System.out.println(swimInWater(new int[][]{{0,2},{1,3}})); // 3
    }
}` }],
  },
  { id: "graphs-hard-8", title: "Alien Dictionary (LC 269)", difficulty: "Hard", timeComplexity: "O(C)", spaceComplexity: "O(1)",
    theory: ["Given a sorted list of words in an alien language, determine the order of characters.", "**Example:** `Input: words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]` → `Output: \"wertf\"`.", "**Approach:** Build a directed graph from adjacent word comparisons. Topological sort gives the character order. Empty string if cycle detected."],
    keyPoints: ["Compare adjacent words to find ordering edges, then topological sort"],
    code: [{ title: "Alien Dictionary — Topological Sort", language: "java", content: `import java.util.*;

public class AlienDictionary {
    public static String alienOrder(String[] words) {
        Map<Character, Set<Character>> graph = new HashMap<>();
        Map<Character, Integer> inDeg = new HashMap<>();
        for (String w : words) for (char c : w.toCharArray()) {
            graph.putIfAbsent(c, new HashSet<>());
            inDeg.putIfAbsent(c, 0);
        }
        for (int i = 0; i < words.length - 1; i++) {
            String w1 = words[i], w2 = words[i + 1];
            if (w1.length() > w2.length() && w1.startsWith(w2)) return "";
            for (int j = 0; j < Math.min(w1.length(), w2.length()); j++) {
                if (w1.charAt(j) != w2.charAt(j)) {
                    if (graph.get(w1.charAt(j)).add(w2.charAt(j)))
                        inDeg.merge(w2.charAt(j), 1, Integer::sum);
                    break;
                }
            }
        }
        Queue<Character> q = new LinkedList<>();
        for (var e : inDeg.entrySet()) if (e.getValue() == 0) q.add(e.getKey());
        StringBuilder sb = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll(); sb.append(c);
            for (char next : graph.get(c))
                if (inDeg.merge(next, -1, Integer::sum) == 0) q.add(next);
        }
        return sb.length() == inDeg.size() ? sb.toString() : "";
    }

    public static void main(String[] args) {
        System.out.println(alienOrder(new String[]{"wrt","wrf","er","ett","rftt"})); // "wertf"
    }
}` }],
  },
];
