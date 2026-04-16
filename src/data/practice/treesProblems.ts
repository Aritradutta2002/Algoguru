import { ContentSection } from "../recursionContent";

export const treesEasy: ContentSection[] = [
  { id: "trees-easy-1", title: "Maximum Depth of Binary Tree", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Find the maximum depth (height) of a binary tree.", "**Example:** `Input: root = [3,9,20,null,null,15,7]` → `Output: 3`.", "**Approach:** Recursive: `max(left depth, right depth) + 1`."],
    keyPoints: ["One of the simplest tree recursion problems — great warmup"],
    code: [{ title: "Maximum Depth — Recursive", language: "java", content: `public class MaxDepth {
    public static int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}` }],
  },
  { id: "trees-easy-2", title: "Invert Binary Tree", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Mirror a binary tree (swap left and right children at every node).", "**Example:** `Input: [4,2,7,1,3,6,9]` → `Output: [4,7,2,9,6,3,1]`.", "**Approach:** Recursively swap left and right children of each node."],
    keyPoints: ["The famous problem that inspired a tweet about interviews"],
    code: [{ title: "Invert Binary Tree", language: "java", content: `public class InvertTree {
    public static TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode tmp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(tmp);
        return root;
    }
}` }],
  },
  { id: "trees-easy-3", title: "Same Tree", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Check if two binary trees are identical.", "**Example:** `Input: p = [1,2,3], q = [1,2,3]` → `Output: true`.", "**Approach:** Recursively compare: both null → true, one null → false, values differ → false."],
    keyPoints: ["Base cases: both null = true, one null = false"],
    code: [{ title: "Same Tree — Recursive", language: "java", content: `public class SameTree {
    public static boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}` }],
  },
  { id: "trees-easy-4", title: "Symmetric Tree (LC 101)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Check if a binary tree is symmetric (mirror of itself).", "**Example:** `Input: [1,2,2,3,4,4,3]` → `Output: true`.", "**Approach:** Recursively check if left subtree mirrors right subtree: compare left.left with right.right and left.right with right.left."],
    keyPoints: ["Mirror check: left.val == right.val AND left.left mirrors right.right"],
    code: [{ title: "Symmetric Tree", language: "java", content: `public class SymmetricTree {
    public static boolean isSymmetric(TreeNode root) {
        return root == null || isMirror(root.left, root.right);
    }
    static boolean isMirror(TreeNode l, TreeNode r) {
        if (l == null && r == null) return true;
        if (l == null || r == null) return false;
        return l.val == r.val && isMirror(l.left, r.right) && isMirror(l.right, r.left);
    }
}` }],
  },
  { id: "trees-easy-5", title: "Path Sum (LC 112)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Given a binary tree and a target sum, determine if there's a root-to-leaf path that sums to the target.", "**Example:** `Input: root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22` → `Output: true` — path 5→4→11→2.", "**Approach:** Recursively subtract node values. At a leaf, check if remaining target equals the leaf value."],
    keyPoints: ["Must reach a LEAF node — internal nodes don't count"],
    code: [{ title: "Path Sum — Recursive", language: "java", content: `public class PathSum {
    public static boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return root.val == targetSum;
        return hasPathSum(root.left, targetSum - root.val)
            || hasPathSum(root.right, targetSum - root.val);
    }
}` }],
  },
  { id: "trees-easy-6", title: "Diameter of Binary Tree (LC 543)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Find the diameter (longest path between any two nodes, measured in edges) of a binary tree.", "**Example:** `Input: [1,2,3,4,5]` → `Output: 3` — path 4→2→1→3.", "**Approach:** Post-order DFS. At each node, diameter through it = leftHeight + rightHeight. Track global max."],
    keyPoints: ["Diameter might not pass through the root — track global maximum"],
    code: [{ title: "Diameter of Binary Tree", language: "java", content: `public class DiameterBT {
    static int maxDiameter;

    public static int diameterOfBinaryTree(TreeNode root) {
        maxDiameter = 0;
        height(root);
        return maxDiameter;
    }

    static int height(TreeNode node) {
        if (node == null) return 0;
        int left = height(node.left), right = height(node.right);
        maxDiameter = Math.max(maxDiameter, left + right);
        return 1 + Math.max(left, right);
    }
}` }],
  },
  { id: "trees-easy-7", title: "Subtree of Another Tree (LC 572)", difficulty: "Easy", timeComplexity: "O(m * n)", spaceComplexity: "O(h)",
    theory: ["Given roots of two trees, check if `subRoot` is a subtree of `root`.", "**Example:** `Input: root = [3,4,5,1,2], subRoot = [4,1,2]` → `Output: true`.", "**Approach:** For each node in root, check if the subtree rooted there is identical to subRoot using the Same Tree algorithm."],
    keyPoints: ["Combine Same Tree check with tree traversal"],
    code: [{ title: "Subtree of Another Tree", language: "java", content: `public class SubtreeCheck {
    public static boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        if (isSame(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }

    static boolean isSame(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.val == b.val && isSame(a.left, b.left) && isSame(a.right, b.right);
    }
}` }],
  },
  { id: "trees-easy-8", title: "Balanced Binary Tree (LC 110)", difficulty: "Easy", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Determine if a binary tree is height-balanced (heights of left and right subtrees differ by at most 1 at every node).", "**Example:** `Input: [3,9,20,null,null,15,7]` → `Output: true`.", "**Approach:** Post-order DFS. Return -1 if unbalanced, else return height."],
    keyPoints: ["Early termination with -1 sentinel avoids redundant work"],
    code: [{ title: "Balanced Binary Tree", language: "java", content: `public class BalancedTree {
    public static boolean isBalanced(TreeNode root) {
        return checkHeight(root) != -1;
    }

    static int checkHeight(TreeNode node) {
        if (node == null) return 0;
        int left = checkHeight(node.left);
        if (left == -1) return -1;
        int right = checkHeight(node.right);
        if (right == -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }
}` }],
  },
];

export const treesMedium: ContentSection[] = [
  { id: "trees-medium-1", title: "Validate BST", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Determine if a binary tree is a valid Binary Search Tree.", "**Example:** `Input: [5,1,4,null,null,3,6]` → `Output: false`.", "**Approach:** Pass a valid range `(min, max)` to each node."],
    keyPoints: ["Use Long.MIN_VALUE/MAX_VALUE as initial bounds"],
    code: [{ title: "Validate BST — Range Checking", language: "java", content: `public class ValidateBST {
    public static boolean isValidBST(TreeNode root) { return validate(root, Long.MIN_VALUE, Long.MAX_VALUE); }
    static boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
    }
}` }],
  },
  { id: "trees-medium-2", title: "Lowest Common Ancestor", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Find the LCA of two nodes in a binary tree.", "**Example:** `Input: root = [3,5,1,6,2,0,8], p = 5, q = 1` → `Output: 3`.", "**Approach:** If current node is p or q, return it. Recurse left and right. If both non-null, current is LCA."],
    keyPoints: ["If both subtrees return non-null, the current node is the LCA"],
    code: [{ title: "Lowest Common Ancestor", language: "java", content: `public class LCA {
    public static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}` }],
  },
  { id: "trees-medium-3", title: "Level Order Traversal", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Return the level order traversal of a binary tree (BFS).", "**Example:** `Input: [3,9,20,null,null,15,7]` → `Output: [[3],[9,20],[15,7]]`.", "**Approach:** BFS with a queue. Process one level at a time."],
    keyPoints: ["Track queue size at start of each level to group nodes correctly"],
    code: [{ title: "Level Order Traversal — BFS", language: "java", content: `import java.util.*;

public class LevelOrder {
    public static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> q = new LinkedList<>(); q.add(root);
        while (!q.isEmpty()) {
            int size = q.size(); List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll(); level.add(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            result.add(level);
        }
        return result;
    }
}` }],
  },
  { id: "trees-medium-4", title: "Binary Tree Right Side View (LC 199)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Return values visible from the right side of a binary tree (last node at each level).", "**Example:** `Input: [1,2,3,null,5,null,4]` → `Output: [1,3,4]`.", "**Approach:** BFS level-order, take the last element of each level. Or DFS: visit right subtree first, track depth."],
    keyPoints: ["BFS: last element per level. DFS: first node at each new depth (right-first traversal)"],
    code: [{ title: "Right Side View — BFS", language: "java", content: `import java.util.*;

public class RightSideView {
    public static List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                if (i == size - 1) result.add(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
        }
        return result;
    }
}` }],
  },
  { id: "trees-medium-5", title: "Construct BT from Preorder + Inorder (LC 105)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Build a binary tree from preorder and inorder traversal arrays.", "**Example:** `Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]` → tree with root 3.", "**Approach:** Preorder[0] is root. Find root in inorder → left subtree = inorder left of root, right subtree = right of root. Recurse."],
    keyPoints: ["HashMap for O(1) root index lookup in inorder array"],
    code: [{ title: "Build Tree — Preorder + Inorder", language: "java", content: `import java.util.*;

public class BuildTree {
    static Map<Integer, Integer> inMap = new HashMap<>();
    static int preIdx = 0;

    public static TreeNode buildTree(int[] preorder, int[] inorder) {
        for (int i = 0; i < inorder.length; i++) inMap.put(inorder[i], i);
        preIdx = 0;
        return build(preorder, 0, inorder.length - 1);
    }

    static TreeNode build(int[] pre, int inLeft, int inRight) {
        if (inLeft > inRight) return null;
        TreeNode root = new TreeNode(pre[preIdx++]);
        int inIdx = inMap.get(root.val);
        root.left = build(pre, inLeft, inIdx - 1);
        root.right = build(pre, inIdx + 1, inRight);
        return root;
    }
}` }],
  },
  { id: "trees-medium-6", title: "Kth Smallest in BST (LC 230)", difficulty: "Medium", timeComplexity: "O(h + k)", spaceComplexity: "O(h)",
    theory: ["Given a BST, find the kth smallest element.", "**Example:** `Input: root = [3,1,4,null,2], k = 1` → `Output: 1`.", "**Approach:** Inorder traversal of BST gives sorted order. Return the kth element during traversal."],
    keyPoints: ["Inorder traversal of BST = sorted order — stop at kth element for efficiency"],
    code: [{ title: "Kth Smallest — Inorder", language: "java", content: `public class KthSmallestBST {
    static int count, result;

    public static int kthSmallest(TreeNode root, int k) {
        count = k; result = 0;
        inorder(root);
        return result;
    }

    static void inorder(TreeNode node) {
        if (node == null || count <= 0) return;
        inorder(node.left);
        if (--count == 0) { result = node.val; return; }
        inorder(node.right);
    }
}` }],
  },
  { id: "trees-medium-7", title: "Count Good Nodes (LC 1448)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["A node X is 'good' if no node on the path from root to X has a value greater than X. Count good nodes.", "**Example:** `Input: [3,1,4,3,null,1,5]` → `Output: 4` — Nodes 3, 3, 4, 5 are good.", "**Approach:** DFS passing the maximum value seen so far on the path from root."],
    keyPoints: ["Track max value on path — if node.val >= maxSoFar, it's a good node"],
    code: [{ title: "Count Good Nodes — DFS", language: "java", content: `public class GoodNodes {
    static int count;

    public static int goodNodes(TreeNode root) {
        count = 0;
        dfs(root, Integer.MIN_VALUE);
        return count;
    }

    static void dfs(TreeNode node, int maxSoFar) {
        if (node == null) return;
        if (node.val >= maxSoFar) count++;
        int newMax = Math.max(maxSoFar, node.val);
        dfs(node.left, newMax);
        dfs(node.right, newMax);
    }
}` }],
  },
  { id: "trees-medium-8", title: "Zigzag Level Order Traversal (LC 103)", difficulty: "Medium", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Return zigzag level order traversal (left→right, then right→left, alternating).", "**Example:** `Input: [3,9,20,null,null,15,7]` → `Output: [[3],[20,9],[15,7]]`.", "**Approach:** BFS with a flag. On even levels traverse left→right, odd levels right→left (or use LinkedList addFirst)."],
    keyPoints: ["Use LinkedList and toggle between addLast and addFirst per level"],
    code: [{ title: "Zigzag Level Order", language: "java", content: `import java.util.*;

public class ZigzagOrder {
    public static List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        boolean leftToRight = true;
        while (!q.isEmpty()) {
            int size = q.size();
            LinkedList<Integer> level = new LinkedList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                if (leftToRight) level.addLast(node.val);
                else level.addFirst(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            result.add(level);
            leftToRight = !leftToRight;
        }
        return result;
    }
}` }],
  },
];

export const treesHard: ContentSection[] = [
  { id: "trees-hard-1", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(n)",
    theory: ["Design an algorithm to serialize a binary tree to a string and deserialize it back.", "**Example:** `Input: [1,2,3,null,null,4,5]` → `Serialized: \"1,2,null,null,3,4,null,null,5,null,null\"`.", "**Approach:** Preorder traversal with null markers."],
    keyPoints: ["Preorder + null markers uniquely defines a binary tree"],
    code: [{ title: "Serialize & Deserialize — Preorder", language: "java", content: `import java.util.*;

public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder(); buildString(root, sb); return sb.toString();
    }
    void buildString(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("null,"); return; }
        sb.append(node.val).append(","); buildString(node.left, sb); buildString(node.right, sb);
    }
    public TreeNode deserialize(String data) {
        return buildTree(new LinkedList<>(Arrays.asList(data.split(","))));
    }
    TreeNode buildTree(Queue<String> q) {
        String val = q.poll(); if ("null".equals(val)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = buildTree(q); node.right = buildTree(q); return node;
    }
}` }],
  },
  { id: "trees-hard-2", title: "Binary Tree Maximum Path Sum", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Find the maximum path sum in a binary tree. A path can start and end at any node.", "**Example:** `Input: [-10,9,20,null,null,15,7]` → `Output: 42` — Path 15 → 20 → 7.", "**Approach:** Post-order DFS. Update global max with `node.val + leftGain + rightGain`."],
    keyPoints: ["Use `Math.max(0, gain)` to ignore negative subtrees"],
    code: [{ title: "Binary Tree Maximum Path Sum", language: "java", content: `public class MaxPathSum {
    static int maxSum;
    public static int maxPathSum(TreeNode root) { maxSum = Integer.MIN_VALUE; dfs(root); return maxSum; }
    static int dfs(TreeNode node) {
        if (node == null) return 0;
        int leftGain = Math.max(0, dfs(node.left));
        int rightGain = Math.max(0, dfs(node.right));
        maxSum = Math.max(maxSum, node.val + leftGain + rightGain);
        return node.val + Math.max(leftGain, rightGain);
    }
}` }],
  },
  { id: "trees-hard-3", title: "Vertical Order Traversal (LC 987)", difficulty: "Hard", timeComplexity: "O(n log n)", spaceComplexity: "O(n)",
    theory: ["Return the vertical order traversal of a binary tree. Nodes at the same position are sorted by value.", "**Example:** `Input: [3,9,20,null,null,15,7]` → `Output: [[9],[3,15],[20],[7]]`.", "**Approach:** BFS/DFS tracking (col, row, val). Sort by col, then row, then val. Group by column."],
    keyPoints: ["Track (column, row, value) for each node, then sort and group"],
    code: [{ title: "Vertical Order Traversal", language: "java", content: `import java.util.*;

public class VerticalTraversal {
    public static List<List<Integer>> verticalTraversal(TreeNode root) {
        List<int[]> nodes = new ArrayList<>(); // col, row, val
        dfs(root, 0, 0, nodes);
        nodes.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] != b[1] ? a[1] - b[1] : a[2] - b[2]);
        List<List<Integer>> result = new ArrayList<>();
        int prevCol = Integer.MIN_VALUE;
        for (int[] node : nodes) {
            if (node[0] != prevCol) { result.add(new ArrayList<>()); prevCol = node[0]; }
            result.get(result.size() - 1).add(node[2]);
        }
        return result;
    }

    static void dfs(TreeNode node, int col, int row, List<int[]> nodes) {
        if (node == null) return;
        nodes.add(new int[]{col, row, node.val});
        dfs(node.left, col - 1, row + 1, nodes);
        dfs(node.right, col + 1, row + 1, nodes);
    }
}` }],
  },
  { id: "trees-hard-4", title: "Binary Tree Cameras (LC 968)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Install minimum cameras on tree nodes to monitor all nodes. A camera monitors its parent, itself, and its children.", "**Example:** `Input: [0,0,null,0,0]` → `Output: 1`.", "**Approach:** Post-order DFS with 3 states: 0=needs camera, 1=has camera, 2=covered. Greedy: place cameras at parents of leaves."],
    keyPoints: ["Greedy: place cameras as high as possible (at parents of uncovered nodes)"],
    code: [{ title: "Binary Tree Cameras — Greedy DFS", language: "java", content: `public class BTreeCameras {
    static int cameras;
    // 0 = needs coverage, 1 = has camera, 2 = covered
    public static int minCameraCover(TreeNode root) {
        cameras = 0;
        if (dfs(root) == 0) cameras++;
        return cameras;
    }

    static int dfs(TreeNode node) {
        if (node == null) return 2;
        int left = dfs(node.left), right = dfs(node.right);
        if (left == 0 || right == 0) { cameras++; return 1; }
        if (left == 1 || right == 1) return 2;
        return 0;
    }
}` }],
  },
  { id: "trees-hard-5", title: "Count Complete Tree Nodes (LC 222)", difficulty: "Hard", timeComplexity: "O(log^2 n)", spaceComplexity: "O(log n)",
    theory: ["Count nodes in a complete binary tree in better than O(n) time.", "**Example:** `Input: [1,2,3,4,5,6]` → `Output: 6`.", "**Approach:** Compare left and right heights. If equal → perfect tree with 2^h - 1 nodes. Otherwise recurse on both subtrees."],
    keyPoints: ["O(log^2 n): at each level, one subtree is perfect (computed in O(1)), recurse on the other"],
    code: [{ title: "Count Complete Tree Nodes", language: "java", content: `public class CountCompleteNodes {
    public static int countNodes(TreeNode root) {
        if (root == null) return 0;
        int leftH = 0, rightH = 0;
        TreeNode l = root, r = root;
        while (l != null) { leftH++; l = l.left; }
        while (r != null) { rightH++; r = r.right; }
        if (leftH == rightH) return (1 << leftH) - 1;
        return 1 + countNodes(root.left) + countNodes(root.right);
    }
}` }],
  },
  { id: "trees-hard-6", title: "Recover BST (LC 99)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(h)",
    theory: ["Two nodes of a BST are swapped by mistake. Recover the tree without changing its structure.", "**Example:** A BST with nodes 1,3,2 (3 and 2 swapped) → fix to 1,2,3.", "**Approach:** Inorder traversal. In a valid BST, inorder is sorted. Find the two elements that break the sorted order and swap them."],
    keyPoints: ["Track `first` and `second` violations during inorder traversal"],
    code: [{ title: "Recover BST — Morris Inorder", language: "java", content: `public class RecoverBST {
    static TreeNode first, second, prev;

    public static void recoverTree(TreeNode root) {
        first = second = prev = null;
        inorder(root);
        int tmp = first.val; first.val = second.val; second.val = tmp;
    }

    static void inorder(TreeNode node) {
        if (node == null) return;
        inorder(node.left);
        if (prev != null && prev.val > node.val) {
            if (first == null) first = prev;
            second = node;
        }
        prev = node;
        inorder(node.right);
    }
}` }],
  },
  { id: "trees-hard-7", title: "Flatten BT to Linked List (LC 114)", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Flatten a binary tree to a linked list in-place (preorder). Each node's right pointer points to the next node, left is null.", "**Example:** `Input: [1,2,5,3,4,null,6]` → `Output: 1→2→3→4→5→6 (as right pointers)`.", "**Approach:** Reverse preorder (right, left, root). Keep a `prev` pointer. Set each node's right to `prev` and left to null."],
    keyPoints: ["Process right-left-root order and link backwards"],
    code: [{ title: "Flatten Binary Tree", language: "java", content: `public class FlattenBT {
    static TreeNode prev = null;

    public static void flatten(TreeNode root) {
        if (root == null) return;
        flatten(root.right);
        flatten(root.left);
        root.right = prev;
        root.left = null;
        prev = root;
    }
}` }],
  },
  { id: "trees-hard-8", title: "Morris Inorder Traversal", difficulty: "Hard", timeComplexity: "O(n)", spaceComplexity: "O(1)",
    theory: ["Traverse a binary tree inorder without recursion or stack — O(1) extra space.", "**Approach:** Morris Traversal. Use threaded binary tree: for each node, find inorder predecessor and create a temporary link back. Traverse, then restore."],
    keyPoints: ["Threading predecessor's right pointer back to current node enables backtracking without stack"],
    code: [{ title: "Morris Inorder Traversal", language: "java", content: `import java.util.*;

public class MorrisInorder {
    public static List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        TreeNode cur = root;
        while (cur != null) {
            if (cur.left == null) {
                result.add(cur.val);
                cur = cur.right;
            } else {
                TreeNode pred = cur.left;
                while (pred.right != null && pred.right != cur) pred = pred.right;
                if (pred.right == null) {
                    pred.right = cur;
                    cur = cur.left;
                } else {
                    pred.right = null;
                    result.add(cur.val);
                    cur = cur.right;
                }
            }
        }
        return result;
    }
}` }],
  },
];
