import { ContentSection } from "./recursionContent";

export const segmentTreeContent: ContentSection[] = [
  {
    id: "segtree-intro",
    title: "What is a Segment Tree?",
    difficulty: "Medium",
    theory: [
      "A **Segment Tree** is a data structure that stores information about array intervals as a tree. It allows answering **range queries** (sum, min, max, GCD) and **modifications** (point update, range update) in **O(log n)** time.",
      "The tree is built using divide-and-conquer: the root stores info about the full array, each node splits its segment into two halves. Leaf nodes correspond to individual elements. Internal nodes store the **merge** of their children (e.g., sum, min).",
      "**Memory**: Requires **4n** vertices. The exact count is 2·2^⌈log₂n⌉ ≤ 4n. The height is O(log n) since segment sizes halve at each level.",
      "**Query complexity proof**: At each level of the tree, we visit at most **4 vertices** (at most 2 partial overlaps per side). Since there are O(log n) levels, total query time is O(log n).",
      "**Generalization**: Any **associative** operation works as the merge function — sum, min, max, GCD, XOR, matrix multiplication, etc. The identity element serves as the 'no overlap' return value (0 for sum, ∞ for min, -∞ for max).",
      "**Advanced variants**: Persistent segment tree (keeps all versions), 2D segment tree (O(log²n) rectangle queries), merge sort tree (stores sorted lists at each node for order-statistic queries), implicit/dynamic segment tree (creates nodes on demand for huge ranges)."
    ],
    diagram: {
      type: "hierarchy",
      title: "Segment Tree — Range Sum for [1, 3, 5, 7]",
      data: [
        {
          label: "[0-3] sum=16",
          color: "primary",
          children: [
            {
              label: "[0-1] sum=4",
              color: "info",
              children: [
                { label: "[0] val=1", color: "success" },
                { label: "[1] val=3", color: "success" }
              ]
            },
            {
              label: "[2-3] sum=12",
              color: "info",
              children: [
                { label: "[2] val=5", color: "accent" },
                { label: "[3] val=7", color: "accent" }
              ]
            }
          ]
        }
      ]
    },
    code: [
      {
        title: "Segment Tree — Array Structure",
        language: "java",
        content: `// Segment Tree uses a flat array of size 4*n
// Node i → left child = 2*i, right child = 2*i+1
// Leaf nodes store individual array elements
// Internal nodes store merged results (sum, min, max, etc.)

int n = arr.length;
long[] tree = new long[4 * n];
// tree[1] = root (covers full array)
// tree[2], tree[3] = root's children
// ... and so on`
      }
    ]
  },
  {
    id: "segtree-build",
    title: "Building the Segment Tree",
    difficulty: "Medium",
    theory: [
      "**Build** fills the tree bottom-up. Each leaf gets an array value. Each internal node merges its two children.",
      "For a sum segment tree, merging means adding children. For min tree, it's `Math.min(left, right)`.",
      "Time: **O(n)** to build. We visit each node exactly once."
    ],
    code: [
      {
        title: "Build — Sum Segment Tree",
        language: "java",
        content: `void build(long[] arr, int node, int start, int end) {
    if (start == end) {
        // Leaf node — store array value
        tree[node] = arr[start];
    } else {
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);        // Build left child
        build(arr, 2 * node + 1, mid + 1, end);  // Build right child
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // Merge
    }
}`
      }
    ]
  },
  {
    id: "segtree-point-update",
    title: "Point Update",
    difficulty: "Medium",
    theory: [
      "**Point Update** changes a single element and updates all ancestors up to the root.",
      "We walk down the tree to the leaf, update it, then merge back up. Only **O(log n)** nodes change.",
      "This is why segment tree is powerful — updating one element automatically fixes all range queries."
    ],
    code: [
      {
        title: "Point Update — Set Value at Index",
        language: "java",
        content: `void update(int node, int start, int end, int idx, long val) {
    if (start == end) {
        // Reached the leaf — update value
        tree[node] = val;
    } else {
        int mid = (start + end) / 2;
        if (idx <= mid)
            update(2 * node, start, mid, idx, val);
        else
            update(2 * node + 1, mid + 1, end, idx, val);
        // Re-merge after child update
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
}`
      },
      {
        title: "Point Update — Wrapper",
        language: "java",
        content: `// Clean wrapper — call this from main
void update(int idx, long val) {
    update(1, 0, n - 1, idx, val);
}`
      }
    ]
  },
  {
    id: "segtree-range-query",
    title: "Range Query",
    difficulty: "Medium",
    theory: [
      "**Range Query** asks: 'What is the sum (or min/max) of elements from index L to R?'",
      "Three cases at each node: (1) Completely outside range → return identity (0 for sum), (2) Completely inside → return node value, (3) Partial overlap → recurse both children and merge.",
      "Time: **O(log n)** per query. At most 4 nodes are visited per level."
    ],
    code: [
      {
        title: "Range Sum Query",
        language: "java",
        content: `long query(int node, int start, int end, int l, int r) {
    if (r < start || end < l) return 0;         // No overlap
    if (l <= start && end <= r) return tree[node]; // Full overlap
    
    int mid = (start + end) / 2;
    return query(2 * node, start, mid, l, r) +
           query(2 * node + 1, mid + 1, end, l, r);
}`
      },
      {
        title: "Range Query — Wrapper",
        language: "java",
        content: `long query(int l, int r) {
    return query(1, 0, n - 1, l, r);
}`
      }
    ]
  },
  {
    id: "segtree-full-sum",
    title: "Complete Sum Segment Tree Class",
    difficulty: "Medium",
    theory: [
      "Here's the full reusable Sum Segment Tree class combining build, update, and query.",
      "Just pass your array to the constructor and you're ready to go. This is the template you'll use in contests."
    ],
    code: [
      {
        title: "Complete Sum Segment Tree",
        language: "java",
        content: `static class SegTree {
    int n;
    long[] tree;

    SegTree(long[] arr) {
        n = arr.length;
        tree = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    void build(long[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node, start, mid);
            build(arr, 2 * node + 1, mid + 1, end);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }

    void update(int idx, long val) {
        update(1, 0, n - 1, idx, val);
    }

    void update(int node, int start, int end, int idx, long val) {
        if (start == end) {
            tree[node] = val;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) update(2 * node, start, mid, idx, val);
            else update(2 * node + 1, mid + 1, end, idx, val);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }

    long query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }

    long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r) +
               query(2 * node + 1, mid + 1, end, l, r);
    }
}`
      }
    ]
  },
  {
    id: "segtree-lazy-intro",
    title: "Lazy Propagation — Concept",
    difficulty: "Hard",
    theory: [
      "What if you need to update an entire **range** instead of one point? E.g., 'add 5 to all elements from index 2 to 8'.",
      "Without lazy propagation, you'd update each element individually — O(n log n). **Lazy propagation** makes it O(log n).",
      "The idea: when updating a range, don't go all the way down. Mark the node as 'pending' using a **lazy array**. When you visit that node later, **push** the pending update to its children.",
      "This is called **lazy** because we delay the work until it's actually needed."
    ],
    code: [
      {
        title: "Lazy Array Setup",
        language: "java",
        content: `int n;
long[] tree, lazy;

// lazy[node] stores the pending addition for that node's range
// When lazy[node] != 0, it means "all elements in this range
// need to be increased by lazy[node], but we haven't done it yet"`
      }
    ]
  },
  {
    id: "segtree-lazy-push",
    title: "Push Down — Propagating Lazy Values",
    difficulty: "Hard",
    theory: [
      "**Push Down** is the key operation. Before accessing a node's children, we first apply any pending lazy value.",
      "Steps: (1) Apply the lazy value to the current node's `tree[node]`, (2) Pass the lazy value to both children, (3) Clear the current node's lazy value.",
      "This ensures data is always correct when we actually read it."
    ],
    code: [
      {
        title: "Push Down Implementation",
        language: "java",
        content: `void push(int node, int start, int end) {
    if (lazy[node] != 0) {
        // Apply pending update: add lazy[node] to each element in range
        // Range has (end - start + 1) elements
        tree[node] += lazy[node] * (end - start + 1);
        
        if (start != end) {
            // Not a leaf — pass lazy to children
            lazy[2 * node] += lazy[node];
            lazy[2 * node + 1] += lazy[node];
        }
        
        lazy[node] = 0; // Clear current lazy
    }
}`
      }
    ]
  },
  {
    id: "segtree-lazy-range-update",
    title: "Range Update with Lazy",
    difficulty: "Hard",
    theory: [
      "Range update works like range query but instead of reading values, we **write** a lazy marker.",
      "If the current node's range is fully inside the update range, we just mark it lazy and return — no need to go deeper.",
      "If partial overlap, we push down first, then recurse into children."
    ],
    code: [
      {
        title: "Range Update — Add Value to Range [l, r]",
        language: "java",
        content: `void updateRange(int node, int start, int end, int l, int r, long val) {
    push(node, start, end);  // Always push before doing anything
    
    if (r < start || end < l) return;  // No overlap
    
    if (l <= start && end <= r) {
        // Full overlap — mark lazy and apply
        lazy[node] += val;
        push(node, start, end);
        return;
    }
    
    int mid = (start + end) / 2;
    updateRange(2 * node, start, mid, l, r, val);
    updateRange(2 * node + 1, mid + 1, end, l, r, val);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
}`
      },
      {
        title: "Range Update — Wrapper",
        language: "java",
        content: `void updateRange(int l, int r, long val) {
    updateRange(1, 0, n - 1, l, r, val);
}`
      }
    ]
  },
  {
    id: "segtree-lazy-query",
    title: "Range Query with Lazy",
    difficulty: "Hard",
    theory: [
      "Range query with lazy is the same as before, but we **push down** before reading any node.",
      "This ensures any pending updates are applied before we read the value."
    ],
    code: [
      {
        title: "Range Query with Lazy Propagation",
        language: "java",
        content: `long query(int node, int start, int end, int l, int r) {
    push(node, start, end);  // Apply pending updates first
    
    if (r < start || end < l) return 0;
    if (l <= start && end <= r) return tree[node];
    
    int mid = (start + end) / 2;
    return query(2 * node, start, mid, l, r) +
           query(2 * node + 1, mid + 1, end, l, r);
}`
      }
    ]
  },
  {
    id: "segtree-lazy-full",
    title: "Complete Lazy Segment Tree Class",
    difficulty: "Hard",
    theory: [
      "Full reusable Lazy Segment Tree with range update and range query. Copy this template for contest use.",
      "Supports: build from array, range add update, range sum query. All operations O(log n)."
    ],
    code: [
      {
        title: "Complete Lazy Segment Tree",
        language: "java",
        content: `static class LazySegTree {
    int n;
    long[] tree, lazy;

    LazySegTree(int n) {
        this.n = n;
        tree = new long[4 * n];
        lazy = new long[4 * n];
    }

    LazySegTree(long[] arr) {
        this(arr.length);
        build(arr, 1, 0, n - 1);
    }

    void build(long[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node, start, mid);
            build(arr, 2 * node + 1, mid + 1, end);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }

    void push(int node, int start, int end) {
        if (lazy[node] != 0) {
            tree[node] += lazy[node] * (end - start + 1);
            if (start != end) {
                lazy[2 * node] += lazy[node];
                lazy[2 * node + 1] += lazy[node];
            }
            lazy[node] = 0;
        }
    }

    void updateRange(int l, int r, long val) {
        updateRange(1, 0, n - 1, l, r, val);
    }

    void updateRange(int node, int start, int end, int l, int r, long val) {
        push(node, start, end);
        if (r < start || end < l) return;
        if (l <= start && end <= r) {
            lazy[node] += val;
            push(node, start, end);
            return;
        }
        int mid = (start + end) / 2;
        updateRange(2 * node, start, mid, l, r, val);
        updateRange(2 * node + 1, mid + 1, end, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    long query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }

    long query(int node, int start, int end, int l, int r) {
        push(node, start, end);
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r) +
               query(2 * node + 1, mid + 1, end, l, r);
    }
}`
      }
    ]
  },
  {
    id: "segtree-min",
    title: "Min Segment Tree",
    difficulty: "Medium",
    theory: [
      "Instead of sum, we can build a segment tree that answers **range minimum queries** (RMQ).",
      "The only change: merge uses `Math.min()` instead of `+`, and identity value is `Long.MAX_VALUE` instead of `0`.",
      "Same O(log n) for build, update, and query. Very commonly used in CP problems."
    ],
    code: [
      {
        title: "Min Segment Tree — Build",
        language: "java",
        content: `static final long INF = Long.MAX_VALUE;

void build(long[] arr, int node, int start, int end) {
    if (start == end) {
        tree[node] = arr[start];
    } else {
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
    }
}`
      },
      {
        title: "Min Segment Tree — Update",
        language: "java",
        content: `void update(int node, int start, int end, int idx, long val) {
    if (start == end) {
        tree[node] = val;
    } else {
        int mid = (start + end) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
    }
}`
      },
      {
        title: "Min Segment Tree — Query",
        language: "java",
        content: `long query(int node, int start, int end, int l, int r) {
    if (r < start || end < l) return INF;  // Identity for min
    if (l <= start && end <= r) return tree[node];
    int mid = (start + end) / 2;
    return Math.min(
        query(2 * node, start, mid, l, r),
        query(2 * node + 1, mid + 1, end, l, r)
    );
}`
      }
    ]
  },
  {
    id: "segtree-usage",
    title: "Using Segment Tree in Problems",
    difficulty: "Medium",
    theory: [
      "Here's how to use segment trees in actual contest problems with optimized I/O.",
      "Pattern: Read input → Build tree → Process queries (update or query based on type) → Output answers.",
      "Always use `StringBuilder` for output in Java to avoid TLE on large outputs."
    ],
    code: [
      {
        title: "Contest Usage — CSES Style",
        language: "java",
        content: `static void solve() throws IOException {
    int n = nextInt(), q = nextInt();
    long[] arr = nextLongArray(n);

    SegTree st = new SegTree(arr);

    StringBuilder sb = new StringBuilder();
    while (q-- > 0) {
        int type = nextInt();
        if (type == 1) {
            // Point update: set arr[idx] = val
            int idx = nextInt() - 1;
            long val = nextLong();
            st.update(idx, val);
        } else {
            // Range query: sum of arr[l..r]
            int l = nextInt() - 1, r = nextInt() - 1;
            sb.append(st.query(l, r)).append('\\n');
        }
    }
    out.print(sb);
}`
      }
    ]
  }
];
