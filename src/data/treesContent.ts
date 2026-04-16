import { ContentSection } from "./recursionContent";

export const treesContent: ContentSection[] = [
  {
    id: "tree-intro",
    title: "Tree Fundamentals",
    difficulty: "Easy",
    theory: [
      "A **Tree** is a connected, acyclic graph with n nodes and n-1 edges. Every pair of nodes has exactly one path between them.",
      "Key terminology: **Root** (top node), **Parent/Child**, **Leaf** (no children), **Depth** (distance from root), **Height** (longest path to leaf), **Subtree**.",
      "A **Binary Tree** has at most 2 children per node. A **BST** maintains left < root < right ordering."
    ],
    diagram: {
      type: "table-visual",
      title: "Tree Types Comparison",
      data: [
        {
          label: "Binary Tree",
          color: "primary",
          children: [
            { label: "At most 2 children per node" },
            { label: "No ordering constraint" },
            { label: "Used in: Heaps, Expression Trees" }
          ]
        },
        {
          label: "Binary Search Tree (BST)",
          color: "success",
          children: [
            { label: "Left < Root < Right" },
            { label: "O(log n) search/insert (balanced)" },
            { label: "Used in: TreeSet, TreeMap" }
          ]
        },
        {
          label: "Complete Binary Tree",
          color: "info",
          children: [
            { label: "All levels filled except last" },
            { label: "Last level filled left to right" },
            { label: "Used in: Heaps, array representation" }
          ]
        },
        {
          label: "Balanced Tree (AVL / Red-Black)",
          color: "accent",
          children: [
            { label: "Height = O(log n)" },
            { label: "Self-balancing on insert/delete" },
            { label: "Guarantees O(log n) operations" }
          ]
        }
      ]
    },
    code: [
      {
        title: "Binary Tree Node",
        language: "java",
        content: `class TreeNode {
    int val;
    TreeNode left, right;
    
    TreeNode(int val) {
        this.val = val;
        this.left = this.right = null;
    }
}`
      },
      {
        title: "Generic Tree Node (N-ary)",
        language: "java",
        content: `class NaryNode {
    int val;
    List<NaryNode> children;
    
    NaryNode(int val) {
        this.val = val;
        this.children = new ArrayList<>();
    }
}`
      },
      {
        title: "Tree as Adjacency List (CP style)",
        language: "java",
        content: `// Most common tree representation in CP
int n = sc.nextInt();
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());

for (int i = 0; i < n - 1; i++) {
    int u = sc.nextInt(), v = sc.nextInt();
    adj.get(u).add(v);
    adj.get(v).add(u);
}`
      }
    ]
  },
  {
    id: "tree-traversal",
    title: "Tree Traversals",
    difficulty: "Easy",
    theory: [
      "**DFS-based**: Inorder (Left-Root-Right), Preorder (Root-Left-Right), Postorder (Left-Right-Root).",
      "**BFS**: Level-order traversal using a queue.",
      "Inorder of a BST gives sorted order. Preorder uniquely identifies tree structure."
    ],
    code: [
      {
        title: "Inorder Traversal (Recursive)",
        language: "java",
        content: `static void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);
    System.out.print(root.val + " ");
    inorder(root.right);
}`
      },
      {
        title: "Preorder Traversal (Recursive)",
        language: "java",
        content: `static void preorder(TreeNode root) {
    if (root == null) return;
    System.out.print(root.val + " ");
    preorder(root.left);
    preorder(root.right);
}`
      },
      {
        title: "Postorder Traversal (Recursive)",
        language: "java",
        content: `static void postorder(TreeNode root) {
    if (root == null) return;
    postorder(root.left);
    postorder(root.right);
    System.out.print(root.val + " ");
}`
      },
      {
        title: "Inorder Traversal (Iterative — Using Stack)",
        language: "java",
        content: `static List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        result.add(curr.val);
        curr = curr.right;
    }
    return result;
}`
      },
      {
        title: "Level Order Traversal (BFS)",
        language: "java",
        content: `static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.add(node.left);
            if (node.right != null) queue.add(node.right);
        }
        result.add(level);
    }
    return result;
}`
      },
      {
        title: "Morris Inorder Traversal — O(1) Space",
        language: "java",
        content: `static List<Integer> morrisInorder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    TreeNode curr = root;
    
    while (curr != null) {
        if (curr.left == null) {
            result.add(curr.val);
            curr = curr.right;
        } else {
            TreeNode pred = curr.left;
            while (pred.right != null && pred.right != curr)
                pred = pred.right;
            
            if (pred.right == null) {
                pred.right = curr; // Create thread
                curr = curr.left;
            } else {
                pred.right = null; // Remove thread
                result.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return result;
}
// Time: O(n), Space: O(1)`
      }
    ]
  },
  {
    id: "tree-properties",
    title: "Tree Properties — Height, Size, Diameter",
    difficulty: "Easy",
    theory: [
      "Common tree computations: **Height** (max depth), **Size** (total nodes), **Diameter** (longest path between any two nodes).",
      "Most tree properties can be computed with a single DFS pass using recursion."
    ],
    code: [
      {
        title: "Height of Binary Tree",
        language: "java",
        content: `static int height(TreeNode root) {
    if (root == null) return -1; // -1 for edge count, 0 for node count
    return 1 + Math.max(height(root.left), height(root.right));
}
// Time: O(n)`
      },
      {
        title: "Size of Binary Tree",
        language: "java",
        content: `static int size(TreeNode root) {
    if (root == null) return 0;
    return 1 + size(root.left) + size(root.right);
}`
      },
      {
        title: "Diameter of Binary Tree",
        language: "java",
        content: `static int diameter;

static int diameterOfTree(TreeNode root) {
    diameter = 0;
    heightForDiameter(root);
    return diameter;
}

static int heightForDiameter(TreeNode root) {
    if (root == null) return 0;
    int left = heightForDiameter(root.left);
    int right = heightForDiameter(root.right);
    diameter = Math.max(diameter, left + right);
    return 1 + Math.max(left, right);
}
// Time: O(n), Space: O(h)`
      },
      {
        title: "Check if Tree is Balanced",
        language: "java",
        content: `static boolean isBalanced(TreeNode root) {
    return checkBalance(root) != -1;
}

static int checkBalance(TreeNode root) {
    if (root == null) return 0;
    int left = checkBalance(root.left);
    if (left == -1) return -1;
    int right = checkBalance(root.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
}`
      }
    ]
  },
  {
    id: "tree-bst",
    title: "Binary Search Tree (BST)",
    difficulty: "Medium",
    theory: [
      "A **BST** maintains the property: left subtree values < root < right subtree values.",
      "Operations: Search O(h), Insert O(h), Delete O(h). For balanced BST, h = O(log n).",
      "BST validation: inorder must be strictly increasing."
    ],
    code: [
      {
        title: "BST — Search",
        language: "java",
        content: `static TreeNode search(TreeNode root, int target) {
    if (root == null || root.val == target) return root;
    if (target < root.val) return search(root.left, target);
    return search(root.right, target);
}`
      },
      {
        title: "BST — Insert",
        language: "java",
        content: `static TreeNode insert(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insert(root.left, val);
    else if (val > root.val) root.right = insert(root.right, val);
    return root;
}`
      },
      {
        title: "BST — Delete",
        language: "java",
        content: `static TreeNode delete(TreeNode root, int key) {
    if (root == null) return null;
    
    if (key < root.val) root.left = delete(root.left, key);
    else if (key > root.val) root.right = delete(root.right, key);
    else {
        // Node found
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        
        // Two children: replace with inorder successor
        TreeNode successor = root.right;
        while (successor.left != null) successor = successor.left;
        root.val = successor.val;
        root.right = delete(root.right, successor.val);
    }
    return root;
}`
      },
      {
        title: "Validate BST",
        language: "java",
        content: `static boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

static boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val)
        && validate(node.right, node.val, max);
}`
      },
      {
        title: "Kth Smallest Element in BST",
        language: "java",
        content: `static int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        if (--k == 0) return curr.val;
        curr = curr.right;
    }
    return -1;
}
// Time: O(h + k)`
      }
    ]
  },
  {
    id: "tree-lca",
    title: "Lowest Common Ancestor (LCA)",
    difficulty: "Medium",
    theory: [
      "**LCA** of nodes u and v is the deepest node that is an ancestor of both u and v.",
      "**Naive**: O(n) per query. **Binary Lifting**: O(n log n) preprocessing, O(log n) per query.",
      "Binary Lifting: precompute up[v][k] = 2^k-th ancestor of v."
    ],
    code: [
      {
        title: "LCA in Binary Tree — Recursive",
        language: "java",
        content: `static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;
    return left != null ? left : right;
}
// Time: O(n)`
      },
      {
        title: "LCA in BST — O(h)",
        language: "java",
        content: `static TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;
    }
    return null;
}`
      },
      {
        title: "Binary Lifting — Preprocessing",
        language: "java",
        content: `static int LOG = 20;
static int[][] up;
static int[] depth;

static void preprocess(List<List<Integer>> adj, int root, int n) {
    up = new int[n + 1][LOG];
    depth = new int[n + 1];
    Arrays.fill(depth, -1);
    
    Queue<Integer> queue = new LinkedList<>();
    queue.add(root);
    depth[root] = 0;
    up[root][0] = root;
    
    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v : adj.get(u)) {
            if (depth[v] == -1) {
                depth[v] = depth[u] + 1;
                up[v][0] = u;
                for (int k = 1; k < LOG; k++)
                    up[v][k] = up[up[v][k-1]][k-1];
                queue.add(v);
            }
        }
    }
}`
      },
      {
        title: "Binary Lifting — LCA Query O(log n)",
        language: "java",
        content: `static int lca(int u, int v) {
    if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
    
    int diff = depth[u] - depth[v];
    for (int k = 0; k < LOG; k++)
        if (((diff >> k) & 1) == 1) u = up[u][k];
    
    if (u == v) return u;
    
    for (int k = LOG - 1; k >= 0; k--) {
        if (up[u][k] != up[v][k]) {
            u = up[u][k];
            v = up[v][k];
        }
    }
    return up[u][0];
}`
      }
    ],
    note: "Binary Lifting is the standard approach for LCA queries in CP. Preprocess in O(n log n), query in O(log n)."
  },
  {
    id: "tree-dfs-techniques",
    title: "DFS on Trees — Subtree Queries",
    difficulty: "Medium",
    theory: [
      "**DFS on trees** is the backbone of tree algorithms. Key techniques: computing subtree sizes, rerooting, Euler tour for range queries.",
      "**Subtree sum/size**: computed in a single DFS pass bottom-up.",
      "**Path queries**: use LCA + prefix sums or Euler tour + segment tree."
    ],
    code: [
      {
        title: "DFS — Compute Subtree Sizes",
        language: "java",
        content: `static int[] subtreeSize;

static void dfsSize(int u, int parent, List<List<Integer>> adj) {
    subtreeSize[u] = 1;
    for (int v : adj.get(u)) {
        if (v != parent) {
            dfsSize(v, u, adj);
            subtreeSize[u] += subtreeSize[v];
        }
    }
}`
      },
      {
        title: "DFS — Compute Depths",
        language: "java",
        content: `static int[] nodeDepth;

static void dfsDepth(int u, int parent, int d, List<List<Integer>> adj) {
    nodeDepth[u] = d;
    for (int v : adj.get(u)) {
        if (v != parent) {
            dfsDepth(v, u, d + 1, adj);
        }
    }
}`
      },
      {
        title: "DFS — Find Diameter of General Tree",
        language: "java",
        content: `static int[] bfs(int start, List<List<Integer>> adj, int n) {
    int[] dist = new int[n + 1];
    Arrays.fill(dist, -1);
    Queue<Integer> q = new LinkedList<>();
    q.add(start);
    dist[start] = 0;
    int farthest = start;
    
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                if (dist[v] > dist[farthest]) farthest = v;
                q.add(v);
            }
        }
    }
    return new int[]{farthest, dist[farthest]};
}

// Diameter = two BFS passes
// 1. BFS from any node → find farthest node A
// 2. BFS from A → find farthest node B
// Diameter = dist(A, B)`
      },
      {
        title: "Euler Tour — Flatten Tree for Range Queries",
        language: "java",
        content: `static int[] tin, tout, euler;
static int timer = 0;

static void eulerTour(int u, int parent, List<List<Integer>> adj) {
    tin[u] = timer++;
    euler[tin[u]] = u;
    
    for (int v : adj.get(u)) {
        if (v != parent) {
            eulerTour(v, u, adj);
        }
    }
    tout[u] = timer - 1;
}

// After Euler Tour:
// Subtree of u = range [tin[u], tout[u]] in the Euler array
// Use Segment Tree / BIT on this range for subtree queries`
      }
    ]
  },
  {
    id: "tree-construction",
    title: "Tree Construction from Traversals",
    difficulty: "Medium",
    theory: [
      "Reconstruct a binary tree from: **Preorder + Inorder**, or **Postorder + Inorder**.",
      "Preorder + Postorder alone cannot uniquely determine the tree (unless it's a full binary tree)."
    ],
    code: [
      {
        title: "Build Tree from Preorder & Inorder",
        language: "java",
        content: `static Map<Integer, Integer> inorderMap;
static int preIdx;

static TreeNode buildTree(int[] preorder, int[] inorder) {
    inorderMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++)
        inorderMap.put(inorder[i], i);
    preIdx = 0;
    return build(preorder, 0, inorder.length - 1);
}

static TreeNode build(int[] preorder, int left, int right) {
    if (left > right) return null;
    
    int rootVal = preorder[preIdx++];
    TreeNode root = new TreeNode(rootVal);
    int mid = inorderMap.get(rootVal);
    
    root.left = build(preorder, left, mid - 1);
    root.right = build(preorder, mid + 1, right);
    return root;
}
// Time: O(n), Space: O(n)`
      },
      {
        title: "Build Tree from Postorder & Inorder",
        language: "java",
        content: `static int postIdx;

static TreeNode buildFromPostIn(int[] postorder, int[] inorder) {
    inorderMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++)
        inorderMap.put(inorder[i], i);
    postIdx = postorder.length - 1;
    return buildPost(postorder, 0, inorder.length - 1);
}

static TreeNode buildPost(int[] postorder, int left, int right) {
    if (left > right) return null;
    
    int rootVal = postorder[postIdx--];
    TreeNode root = new TreeNode(rootVal);
    int mid = inorderMap.get(rootVal);
    
    root.right = buildPost(postorder, mid + 1, right); // RIGHT first!
    root.left = buildPost(postorder, left, mid - 1);
    return root;
}`
      }
    ]
  },
  {
    id: "tree-views",
    title: "Tree Views — Left, Right, Top, Bottom",
    difficulty: "Medium",
    theory: [
      "**Left View**: First node at each level. **Right View**: Last node at each level.",
      "**Top View**: Nodes visible from top using horizontal distance. **Bottom View**: Last node at each horizontal distance."
    ],
    code: [
      {
        title: "Left View of Binary Tree",
        language: "java",
        content: `static List<Integer> leftView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    dfsLeftView(root, 0, result);
    return result;
}

static void dfsLeftView(TreeNode node, int level, List<Integer> result) {
    if (node == null) return;
    if (level == result.size()) result.add(node.val);
    dfsLeftView(node.left, level + 1, result);
    dfsLeftView(node.right, level + 1, result);
}`
      },
      {
        title: "Right View of Binary Tree",
        language: "java",
        content: `static List<Integer> rightView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    dfsRightView(root, 0, result);
    return result;
}

static void dfsRightView(TreeNode node, int level, List<Integer> result) {
    if (node == null) return;
    if (level == result.size()) result.add(node.val);
    dfsRightView(node.right, level + 1, result);
    dfsRightView(node.left, level + 1, result);
}`
      },
      {
        title: "Top View of Binary Tree",
        language: "java",
        content: `static List<Integer> topView(TreeNode root) {
    if (root == null) return new ArrayList<>();
    TreeMap<Integer, Integer> map = new TreeMap<>();
    Queue<int[]> queue = new LinkedList<>(); // [horizontal dist]
    Queue<TreeNode> nodeQ = new LinkedList<>();
    
    queue.add(new int[]{0});
    nodeQ.add(root);
    
    while (!queue.isEmpty()) {
        int[] info = queue.poll();
        TreeNode node = nodeQ.poll();
        int hd = info[0];
        
        map.putIfAbsent(hd, node.val); // First node at this HD
        
        if (node.left != null) {
            queue.add(new int[]{hd - 1});
            nodeQ.add(node.left);
        }
        if (node.right != null) {
            queue.add(new int[]{hd + 1});
            nodeQ.add(node.right);
        }
    }
    return new ArrayList<>(map.values());
}`
      },
      {
        title: "Vertical Order Traversal",
        language: "java",
        content: `static List<List<Integer>> verticalOrder(TreeNode root) {
    if (root == null) return new ArrayList<>();
    TreeMap<Integer, List<Integer>> map = new TreeMap<>();
    Queue<TreeNode> nodeQ = new LinkedList<>();
    Queue<Integer> hdQ = new LinkedList<>();
    
    nodeQ.add(root); hdQ.add(0);
    
    while (!nodeQ.isEmpty()) {
        TreeNode node = nodeQ.poll();
        int hd = hdQ.poll();
        map.computeIfAbsent(hd, k -> new ArrayList<>()).add(node.val);
        
        if (node.left != null) { nodeQ.add(node.left); hdQ.add(hd - 1); }
        if (node.right != null) { nodeQ.add(node.right); hdQ.add(hd + 1); }
    }
    return new ArrayList<>(map.values());
}`
      }
    ]
  },
  {
    id: "tree-path-sum",
    title: "Path Sum Problems",
    difficulty: "Medium",
    theory: [
      "Path problems: **Root-to-leaf path sum**, **Any-to-any max path sum**, **Path with given sum count**.",
      "Key technique: DFS with running sum, prefix sums on paths using HashMap."
    ],
    code: [
      {
        title: "Has Path Sum (Root to Leaf)",
        language: "java",
        content: `static boolean hasPathSum(TreeNode root, int target) {
    if (root == null) return false;
    if (root.left == null && root.right == null)
        return root.val == target;
    return hasPathSum(root.left, target - root.val)
        || hasPathSum(root.right, target - root.val);
}`
      },
      {
        title: "All Root-to-Leaf Paths with Given Sum",
        language: "java",
        content: `static List<List<Integer>> pathSum(TreeNode root, int target) {
    List<List<Integer>> result = new ArrayList<>();
    dfsPath(root, target, new ArrayList<>(), result);
    return result;
}

static void dfsPath(TreeNode node, int rem, List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);
    
    if (node.left == null && node.right == null && rem == node.val) {
        result.add(new ArrayList<>(path));
    }
    
    dfsPath(node.left, rem - node.val, path, result);
    dfsPath(node.right, rem - node.val, path, result);
    path.remove(path.size() - 1); // Backtrack
}`
      },
      {
        title: "Maximum Path Sum (Any to Any)",
        language: "java",
        content: `static int maxPathSum;

static int maxPathSum(TreeNode root) {
    maxPathSum = Integer.MIN_VALUE;
    maxGain(root);
    return maxPathSum;
}

static int maxGain(TreeNode node) {
    if (node == null) return 0;
    int left = Math.max(0, maxGain(node.left));
    int right = Math.max(0, maxGain(node.right));
    maxPathSum = Math.max(maxPathSum, left + right + node.val);
    return node.val + Math.max(left, right);
}
// Time: O(n)`
      },
      {
        title: "Path Sum Count (Any node to any descendant)",
        language: "java",
        content: `static int pathSumCount(TreeNode root, int target) {
    Map<Long, Integer> prefixSum = new HashMap<>();
    prefixSum.put(0L, 1);
    return dfsCount(root, 0, target, prefixSum);
}

static int dfsCount(TreeNode node, long currSum, int target, Map<Long, Integer> prefix) {
    if (node == null) return 0;
    currSum += node.val;
    int count = prefix.getOrDefault(currSum - target, 0);
    
    prefix.merge(currSum, 1, Integer::sum);
    count += dfsCount(node.left, currSum, target, prefix);
    count += dfsCount(node.right, currSum, target, prefix);
    prefix.merge(currSum, -1, Integer::sum);
    
    return count;
}
// Time: O(n), Space: O(n)`
      }
    ]
  },
  {
    id: "tree-segment",
    title: "Segment Tree",
    difficulty: "Hard",
    theory: [
      "**Segment Tree** supports range queries and point/range updates in O(log n) per operation.",
      "Built on an array of size 4n. Each node stores aggregate (sum, min, max, gcd) of a range.",
      "**Lazy propagation** extends to support range updates in O(log n)."
    ],
    code: [
      {
        title: "Segment Tree — Build",
        language: "java",
        content: `class SegmentTree {
    int[] tree;
    int n;
    
    SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 1, 0, n - 1);
    }
    
    void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // Sum query
    }
}`
      },
      {
        title: "Segment Tree — Point Update",
        language: "java",
        content: `    void update(int idx, int val) {
        update(1, 0, n - 1, idx, val);
    }
    
    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }`
      },
      {
        title: "Segment Tree — Range Query",
        language: "java",
        content: `    int query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }
    
    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0; // Out of range
        if (l <= start && end <= r) return tree[node]; // Fully in range
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r)
             + query(2 * node + 1, mid + 1, end, l, r);
    }
}
// Build: O(n), Update: O(log n), Query: O(log n)`
      },
      {
        title: "Segment Tree with Lazy Propagation — Range Update",
        language: "java",
        content: `class LazySegTree {
    long[] tree, lazy;
    int n;
    
    LazySegTree(int[] arr) {
        n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }
    
    void build(int[] arr, int node, int s, int e) {
        if (s == e) { tree[node] = arr[s]; return; }
        int mid = (s + e) / 2;
        build(arr, 2*node, s, mid);
        build(arr, 2*node+1, mid+1, e);
        tree[node] = tree[2*node] + tree[2*node+1];
    }
    
    void pushDown(int node, int s, int e) {
        if (lazy[node] != 0) {
            int mid = (s + e) / 2;
            tree[2*node] += lazy[node] * (mid - s + 1);
            tree[2*node+1] += lazy[node] * (e - mid);
            lazy[2*node] += lazy[node];
            lazy[2*node+1] += lazy[node];
            lazy[node] = 0;
        }
    }
    
    // Add val to all elements in [l, r]
    void rangeUpdate(int node, int s, int e, int l, int r, long val) {
        if (r < s || e < l) return;
        if (l <= s && e <= r) {
            tree[node] += val * (e - s + 1);
            lazy[node] += val;
            return;
        }
        pushDown(node, s, e);
        int mid = (s + e) / 2;
        rangeUpdate(2*node, s, mid, l, r, val);
        rangeUpdate(2*node+1, mid+1, e, l, r, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }
}`
      }
    ]
  },
  {
    id: "tree-fenwick",
    title: "Fenwick Tree (BIT)",
    difficulty: "Medium",
    theory: [
      "**Fenwick Tree** (Binary Indexed Tree / BIT) supports point update and prefix sum query in O(log n). Invented by Peter Fenwick in 1994. Uses only O(n) memory — same as the original array — and is very cache-friendly.",
      "**Key idea**: Each index i is responsible for a range determined by the **lowest set bit** of i. Index i stores the sum of elements in range [i - lowbit(i) + 1, i], where lowbit(i) = i & (-i). This creates a clever implicit tree structure.",
      "**Operations**: Prefix sum query walks DOWN by clearing the lowest set bit: i -= i & (-i). Point update walks UP by adding the lowest set bit: i += i & (-i). Both visit O(log n) nodes.",
      "**Fenwick vs Segment Tree**: Fenwick has 2-5x smaller constant factor, simpler code (~10 lines), and better cache performance. But it only natively supports prefix queries (not arbitrary range) and requires an **inverse operation** (works for sum, XOR, but NOT for min/max).",
      "**Range update + point query**: Use a Fenwick tree on the difference array. **Range update + range query**: Use two Fenwick trees with the identity: sum(1..x) = B1(x)·x - B2(x), update both on range [l,r]."
    ],
    code: [
      {
        title: "Fenwick Tree — Point Update, Prefix Sum",
        language: "java",
        content: `class FenwickTree {
    int[] bit;
    int n;
    
    FenwickTree(int n) {
        this.n = n;
        bit = new int[n + 1];
    }
    
    void update(int i, int delta) {
        for (; i <= n; i += i & (-i))
            bit[i] += delta;
    }
    
    int prefixSum(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i))
            sum += bit[i];
        return sum;
    }
    
    int rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}
// Update: O(log n), Query: O(log n)`
      },
      {
        title: "Build Fenwick Tree from Array",
        language: "java",
        content: `// Method 1: O(n log n) — simple
static FenwickTree buildFromArray(int[] arr) {
    FenwickTree ft = new FenwickTree(arr.length);
    for (int i = 0; i < arr.length; i++)
        ft.update(i + 1, arr[i]); // 1-indexed
    return ft;
}

// Method 2: O(n) — efficient
static FenwickTree buildFast(int[] arr) {
    int n = arr.length;
    FenwickTree ft = new FenwickTree(n);
    for (int i = 1; i <= n; i++) ft.bit[i] = arr[i - 1];
    for (int i = 1; i <= n; i++) {
        int parent = i + (i & (-i));
        if (parent <= n) ft.bit[parent] += ft.bit[i];
    }
    return ft;
}`
      }
    ]
  },
  {
    id: "tree-advanced",
    title: "Advanced Tree Techniques",
    difficulty: "Expert",
    theory: [
      "**Heavy-Light Decomposition (HLD)**: Decomposes tree into O(log n) chains such that any root-to-leaf path crosses at most O(log n) chains. Each chain is stored contiguously, enabling path queries in O(log²n) with a segment tree on each chain.",
      "**Centroid Decomposition**: Find the centroid (vertex whose removal splits tree into subtrees of size ≤ n/2), make it root, recurse on subtrees. Creates a centroid tree of height O(log n). Enables distance queries, path counting, and nearest marked vertex in O(n log n).",
      "**DSU (Disjoint Set Union / Union-Find)**: Supports union and find in nearly O(1) amortized (inverse Ackermann). Two optimizations: **path compression** (make all nodes point directly to root during find) and **union by rank/size** (attach smaller tree under larger). Both together give O(α(n)) per operation.",
      "**DSU applications**: Kruskal's MST, dynamic connectivity, connected components online, minimum spanning forest. **DSU with rollback**: don't use path compression, use union by rank only — allows undoing unions for offline divide-and-conquer.",
      "**Sparse Table**: Preprocess in O(n log n), answer **idempotent** range queries (min, max, GCD) in O(1). Stores st[k][i] = answer for range [i, i+2^k-1]. Query [l,r]: overlap two precomputed ranges of length 2^k where k = ⌊log₂(r-l+1)⌋. Only works on **immutable** arrays."
    ],
    code: [
      {
        title: "Centroid Decomposition",
        language: "java",
        content: `static int[] subtreeSize, centroidParent;
static boolean[] removed;

static int getCentroid(int u, int par, int treeSize, List<List<Integer>> adj) {
    for (int v : adj.get(u)) {
        if (v != par && !removed[v] && subtreeSize[v] > treeSize / 2)
            return getCentroid(v, u, treeSize, adj);
    }
    return u;
}

static void buildCentroidTree(int u, int par, List<List<Integer>> adj) {
    computeSubtreeSize(u, -1, adj);
    int centroid = getCentroid(u, -1, subtreeSize[u], adj);
    centroidParent[centroid] = par;
    removed[centroid] = true;
    
    for (int v : adj.get(centroid)) {
        if (!removed[v]) {
            buildCentroidTree(v, centroid, adj);
        }
    }
}`
      },
      {
        title: "Compute Subtree Size for Centroid",
        language: "java",
        content: `static void computeSubtreeSize(int u, int par, List<List<Integer>> adj) {
    subtreeSize[u] = 1;
    for (int v : adj.get(u)) {
        if (v != par && !removed[v]) {
            computeSubtreeSize(v, u, adj);
            subtreeSize[u] += subtreeSize[v];
        }
    }
}`
      },
      {
        title: "Tree DP — Independent Set (Max nodes, no two adjacent)",
        language: "java",
        content: `static int[][] dp; // dp[node][0/1] = not-taken/taken

static void treeDPIndependentSet(int u, int par, List<List<Integer>> adj) {
    dp[u][0] = 0; // Don't take u
    dp[u][1] = 1; // Take u
    
    for (int v : adj.get(u)) {
        if (v != par) {
            treeDPIndependentSet(v, u, adj);
            dp[u][0] += Math.max(dp[v][0], dp[v][1]); // Can take or skip child
            dp[u][1] += dp[v][0]; // Must skip child if u is taken
        }
    }
}
// Answer = max(dp[root][0], dp[root][1])`
      }
    ],
    note: "Centroid Decomposition divides any tree into O(log n) levels, enabling efficient distance queries and path-based counting."
  }
];
