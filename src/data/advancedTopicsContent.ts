import { ContentSection } from "./recursionContent";

export const advancedTopicsContent: ContentSection[] = [
  {
    id: "adv-nim",
    title: "Nim Game",
    difficulty: "Medium",
    theory: [
      "**Nim** is the foundation of combinatorial game theory. You have piles of stones; players take turns removing any number from one pile. The player who takes the last stone wins.",
      "**Key theorem**: First player wins if and only if the **XOR of all pile sizes ≠ 0**. If XOR = 0, second player wins.",
      "This simple XOR rule extends to many game theory problems. If XOR of all piles is non-zero, there always exists a move that makes it zero."
    ],
    code: [
      {
        title: "Nim Game — XOR Solution",
        language: "java",
        content: `// Returns true if first player wins
static boolean nim(int[] piles) {
    int xor = 0;
    for (int p : piles) xor ^= p;
    return xor != 0;
}

// Usage: int[] piles = {3, 4, 5};
// nim(piles) → true (first player wins since 3^4^5 = 2 ≠ 0)`
      }
    ]
  },
  {
    id: "adv-grundy",
    title: "Grundy Numbers & Sprague-Grundy",
    difficulty: "Hard",
    theory: [
      "**Sprague-Grundy theorem** generalizes Nim to ANY impartial game (both players have same moves).",
      "Every game position has a **Grundy number** (or nimber). A position with Grundy number 0 is a **losing position** (for the player whose turn it is).",
      "**Grundy number** = **MEX** (minimum excludant) of Grundy numbers of all positions reachable in one move. MEX of a set = smallest non-negative integer NOT in the set.",
      "For combined games: XOR all individual Grundy numbers. If result ≠ 0, first player wins."
    ],
    code: [
      {
        title: "MEX Function",
        language: "java",
        content: `// MEX = Minimum Excludant
// Smallest non-negative integer NOT in the set
static int mex(Set<Integer> set) {
    int mex = 0;
    while (set.contains(mex)) mex++;
    return mex;
}
// mex({0, 1, 3}) = 2
// mex({1, 2}) = 0
// mex({0, 1, 2}) = 3`
      },
      {
        title: "Grundy Number — Remove 1, 2, or 3 Stones",
        language: "java",
        content: `// Game: pile of n stones, can remove 1, 2, or 3
// Grundy(n) = mex of reachable Grundy values
static int grundyNim123(int n, int[] memo) {
    if (n == 0) return 0; // No moves = losing = Grundy 0
    if (memo[n] != -1) return memo[n];

    Set<Integer> reachable = new HashSet<>();
    if (n >= 1) reachable.add(grundyNim123(n - 1, memo));
    if (n >= 2) reachable.add(grundyNim123(n - 2, memo));
    if (n >= 3) reachable.add(grundyNim123(n - 3, memo));

    return memo[n] = mex(reachable);
}`
      },
      {
        title: "Combined Games — XOR of Grundy Numbers",
        language: "java",
        content: `// For multiple independent games played simultaneously:
// First player wins iff XOR of all Grundy numbers ≠ 0
static boolean combinedGameWinner(int[] grundyValues) {
    int xor = 0;
    for (int g : grundyValues) xor ^= g;
    return xor != 0; // true = first player wins
}`
      }
    ]
  },
  {
    id: "adv-minimax",
    title: "Minimax Algorithm",
    difficulty: "Medium",
    theory: [
      "**Minimax** is for two-player **zero-sum** games (one player's gain = other's loss). Think Tic-Tac-Toe, Chess.",
      "The **maximizing** player picks the move with highest value. The **minimizing** player picks the move with lowest value.",
      "It explores the full game tree, assuming both players play optimally. Time: O(b^d) where b = branching factor, d = depth."
    ],
    code: [
      {
        title: "Minimax — Basic",
        language: "java",
        content: `static int minimax(int depth, boolean isMaximizing, int[] values) {
    if (depth == 0) return values[depth]; // Leaf node

    if (isMaximizing) {
        int best = Integer.MIN_VALUE;
        for (int i = 0; i < values.length; i++) {
            best = Math.max(best, minimax(depth - 1, false, values));
        }
        return best;
    } else {
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < values.length; i++) {
            best = Math.min(best, minimax(depth - 1, true, values));
        }
        return best;
    }
}`
      }
    ]
  },
  {
    id: "adv-alpha-beta",
    title: "Alpha-Beta Pruning",
    difficulty: "Hard",
    theory: [
      "**Alpha-Beta Pruning** optimizes Minimax by skipping branches that can't possibly affect the final decision.",
      "**Alpha** = best value the maximizer can guarantee. **Beta** = best value the minimizer can guarantee.",
      "If at any point **beta ≤ alpha**, we prune (stop exploring that branch). In the best case, this reduces time from O(b^d) to O(b^(d/2)) — effectively doubling the search depth!"
    ],
    code: [
      {
        title: "Alpha-Beta Pruning",
        language: "java",
        content: `static int alphaBeta(int depth, boolean isMax, int alpha, int beta, int[] values) {
    if (depth == 0) return values[depth];

    if (isMax) {
        int best = Integer.MIN_VALUE;
        for (int i = 0; i < values.length; i++) {
            best = Math.max(best, alphaBeta(depth - 1, false, alpha, beta, values));
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break; // β cutoff — minimizer won't allow this
        }
        return best;
    } else {
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < values.length; i++) {
            best = Math.min(best, alphaBeta(depth - 1, true, alpha, beta, values));
            beta = Math.min(beta, best);
            if (beta <= alpha) break; // α cutoff — maximizer won't allow this
        }
        return best;
    }
}

// Initial call: alphaBeta(maxDepth, true, Integer.MIN_VALUE, Integer.MAX_VALUE, values)`
      }
    ]
  },
  {
    id: "adv-game-graph",
    title: "Game on Graphs (DAG)",
    difficulty: "Hard",
    theory: [
      "Many games can be modeled as a **DAG** (directed acyclic graph). Each node is a game state, edges are moves.",
      "A position is **winning** if there exists at least one move to a **losing** position (for the opponent).",
      "A position is **losing** if ALL moves lead to **winning** positions (for the opponent).",
      "Terminal nodes (no outgoing edges) are losing positions — the player who can't move loses."
    ],
    code: [
      {
        title: "Game on DAG — Win/Lose Detection",
        language: "java",
        content: `// Returns true if starting position is a winning position
static boolean gameOnGraph(List<List<Integer>> adj, int start, int[] memo) {
    if (memo[start] != -1) return memo[start] == 1;

    // Check if any move leads to a losing position for opponent
    boolean canWin = false;
    for (int next : adj.get(start)) {
        if (!gameOnGraph(adj, next, memo)) {
            canWin = true; // Found a move that makes opponent lose
            break;
        }
    }

    memo[start] = canWin ? 1 : 0;
    return canWin;
}
// No outgoing edges → canWin = false → losing position`
      }
    ]
  },
  {
    id: "adv-coin-game",
    title: "Coin Game — Pick from Ends",
    difficulty: "Hard",
    theory: [
      "Classic game theory DP: coins in a row, two players take turns picking from either end. Each wants to maximize their own sum.",
      "This is solved with **interval DP**: dp[i][j] = max value the current player can get from coins[i..j].",
      "The insight: when you pick coins[i], your opponent will play optimally on the remaining subarray, so you get the **minimum** of the two future states."
    ],
    code: [
      {
        title: "Optimal Strategy — Interval DP",
        language: "java",
        content: `// Returns maximum value first player can collect
static int optimalStrategy(int[] coins) {
    int n = coins.length;
    int[][] dp = new int[n][n];

    for (int gap = 0; gap < n; gap++) {
        for (int i = 0, j = gap; j < n; i++, j++) {
            // x = dp[i+2][j], y = dp[i+1][j-1], z = dp[i][j-2]
            int x = (i + 2 <= j) ? dp[i + 2][j] : 0;
            int y = (i + 1 <= j - 1) ? dp[i + 1][j - 1] : 0;
            int z = (i <= j - 2) ? dp[i][j - 2] : 0;

            // Pick left: coins[i] + min(future after opponent picks)
            // Pick right: coins[j] + min(future after opponent picks)
            dp[i][j] = Math.max(
                coins[i] + Math.min(x, y),  // Pick left
                coins[j] + Math.min(y, z)   // Pick right
            );
        }
    }
    return dp[0][n - 1];
}`
      }
    ]
  },
  {
    id: "adv-ternary-search",
    title: "Ternary Search",
    difficulty: "Medium",
    theory: [
      "**Ternary Search** finds the maximum or minimum of a **unimodal function** (increases then decreases, or vice versa).",
      "Instead of splitting into 2 (like binary search), we split into 3 parts and eliminate one-third each iteration.",
      "Works for both continuous (double) and discrete (integer) domains. Time: O(log n) iterations."
    ],
    code: [
      {
        title: "Ternary Search — Find Maximum (Continuous)",
        language: "java",
        content: `// Find x in [l, r] that maximizes f(x)
// f must be unimodal (increases then decreases)
static double findMax(DoubleUnaryOperator f, double l, double r) {
    for (int i = 0; i < 100; i++) { // 100 iterations = ~10^-30 precision
        double m1 = l + (r - l) / 3;
        double m2 = r - (r - l) / 3;
        if (f.applyAsDouble(m1) < f.applyAsDouble(m2)) {
            l = m1;
        } else {
            r = m2;
        }
    }
    return l;
}`
      },
      {
        title: "Ternary Search — Integer Domain",
        language: "java",
        content: `static int findMaxInt(IntUnaryOperator f, int l, int r) {
    while (r - l > 2) {
        int m1 = l + (r - l) / 3;
        int m2 = r - (r - l) / 3;
        if (f.applyAsInt(m1) < f.applyAsInt(m2)) {
            l = m1;
        } else {
            r = m2;
        }
    }
    // Check remaining candidates
    int best = l;
    for (int i = l + 1; i <= r; i++) {
        if (f.applyAsInt(i) > f.applyAsInt(best)) best = i;
    }
    return best;
}`
      }
    ]
  },
  {
    id: "adv-quickselect",
    title: "Randomized QuickSelect",
    difficulty: "Medium",
    theory: [
      "**QuickSelect** finds the k-th smallest element in **O(n) average time** — much faster than sorting O(n log n).",
      "It's like QuickSort but only recurses into the half containing the target. Random pivot selection avoids worst-case O(n²).",
      "Used when you need a specific order statistic (median, k-th element) without sorting the entire array."
    ],
    code: [
      {
        title: "QuickSelect — Find k-th Smallest",
        language: "java",
        content: `static Random random = new Random();

static int quickSelect(int[] arr, int k) {
    return quickSelect(arr, 0, arr.length - 1, k);
}

static int quickSelect(int[] arr, int left, int right, int k) {
    if (left == right) return arr[left];

    int pivotIdx = partition(arr, left, right);
    int rank = pivotIdx - left + 1;

    if (k == rank) return arr[pivotIdx];
    else if (k < rank) return quickSelect(arr, left, pivotIdx - 1, k);
    else return quickSelect(arr, pivotIdx + 1, right, k - rank);
}`
      },
      {
        title: "Randomized Partition",
        language: "java",
        content: `static int partition(int[] arr, int left, int right) {
    // Random pivot to avoid worst case
    int pivotIdx = left + random.nextInt(right - left + 1);
    int pivot = arr[pivotIdx];

    swap(arr, pivotIdx, right);
    int storeIdx = left;

    for (int i = left; i < right; i++) {
        if (arr[i] < pivot) {
            swap(arr, i, storeIdx);
            storeIdx++;
        }
    }
    swap(arr, storeIdx, right);
    return storeIdx;
}

static void swap(int[] arr, int i, int j) {
    int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
}`
      }
    ]
  },
  {
    id: "adv-meet-middle",
    title: "Meet in the Middle",
    difficulty: "Hard",
    theory: [
      "**Meet in the Middle** splits a problem into two halves, solves each independently, then combines results.",
      "Classic use: **Subset Sum** for n ≤ 40. Brute force is O(2^n) = 10¹². Split into two halves of 20 each → O(2^(n/2)) = 10⁶. Totally feasible!",
      "Generate all subset sums for the left half, store them. For each right half sum, binary search for the complement in the left set."
    ],
    code: [
      {
        title: "Subset Sum — Meet in the Middle",
        language: "java",
        content: `// Can we find a subset that sums to target?
// Works for n ≤ 40 (too large for normal brute force)
static boolean subsetSum(int[] arr, int target) {
    int n = arr.length;
    int n1 = n / 2;

    // Generate all subset sums of left half
    Set<Integer> leftSums = new HashSet<>();
    generateSums(arr, 0, n1, 0, leftSums);

    // Check if any left sum alone equals target
    if (leftSums.contains(target)) return true;

    // Generate right half sums and check complement
    Set<Integer> rightSums = new HashSet<>();
    generateSums(arr, n1, n, 0, rightSums);

    for (int rSum : rightSums) {
        if (leftSums.contains(target - rSum)) return true;
    }
    return false;
}`
      },
      {
        title: "Generate All Subset Sums",
        language: "java",
        content: `static void generateSums(int[] arr, int start, int end, int sum, Set<Integer> sums) {
    if (start == end) {
        sums.add(sum);
        return;
    }
    generateSums(arr, start + 1, end, sum, sums);            // Skip
    generateSums(arr, start + 1, end, sum + arr[start], sums); // Include
}`
      },
      {
        title: "Closest Subset Sum to Target",
        language: "java",
        content: `static int closestSubsetSum(int[] arr, int target) {
    int n = arr.length, n1 = n / 2;

    List<Integer> leftSums = new ArrayList<>();
    generateSumsList(arr, 0, n1, 0, leftSums);
    Collections.sort(leftSums);

    List<Integer> rightSums = new ArrayList<>();
    generateSumsList(arr, n1, n, 0, rightSums);

    int best = 0;
    for (int rSum : rightSums) {
        int remaining = target - rSum;
        int idx = Collections.binarySearch(leftSums, remaining);
        if (idx >= 0) return target; // Exact match

        idx = -(idx + 1);
        if (idx < leftSums.size())
            best = Math.max(best, rSum + leftSums.get(idx));
        if (idx > 0)
            best = Math.max(best, rSum + leftSums.get(idx - 1));
    }
    return best;
}`
      }
    ]
  },
  {
    id: "adv-mos",
    title: "Mo's Algorithm",
    difficulty: "Hard",
    theory: [
      "**Mo's Algorithm** answers offline range queries in O((n + q) × √n) time. It's surprisingly simple and incredibly useful.",
      "Idea: Sort all queries by `(l / √n, r)`. Then maintain a sliding window [currL, currR] and expand/shrink it one element at a time.",
      "Because of the sorting, the total movement of L and R pointers is O(n√n). You need an `add(element)` and `remove(element)` function for your specific problem.",
      "**Limitation**: Only works for offline queries (you must know all queries beforehand)."
    ],
    code: [
      {
        title: "Mo's Query Structure",
        language: "java",
        content: `static class Query implements Comparable<Query> {
    int l, r, id, block;

    Query(int l, int r, int id, int blockSize) {
        this.l = l;
        this.r = r;
        this.id = id;
        this.block = l / blockSize;
    }

    public int compareTo(Query o) {
        if (block != o.block) return Integer.compare(block, o.block);
        // Zigzag optimization: even blocks sort r ascending, odd descending
        return (block & 1) == 0
            ? Integer.compare(r, o.r)
            : Integer.compare(o.r, r);
    }
}`
      },
      {
        title: "Mo's Algorithm — Main Loop",
        language: "java",
        content: `static int[] solve(int[] arr, int[][] queries) {
    int n = arr.length, q = queries.length;
    int blockSize = (int) Math.sqrt(n);

    Query[] qs = new Query[q];
    for (int i = 0; i < q; i++) {
        qs[i] = new Query(queries[i][0], queries[i][1], i, blockSize);
    }
    Arrays.sort(qs);

    int[] answers = new int[q];
    int currL = 0, currR = -1;
    int[] freq = new int[100001]; // Adjust range

    for (Query query : qs) {
        // Expand/shrink window to match query range
        while (currL > query.l) { currL--; add(arr[currL], freq); }
        while (currR < query.r) { currR++; add(arr[currR], freq); }
        while (currL < query.l) { remove(arr[currL], freq); currL++; }
        while (currR > query.r) { remove(arr[currR], freq); currR--; }

        answers[query.id] = currentAnswer; // Store answer for original query order
    }
    return answers;
}`
      },
      {
        title: "Add / Remove — Example: Count Distinct",
        language: "java",
        content: `static int currentAnswer = 0;

static void add(int val, int[] freq) {
    if (freq[val] == 0) currentAnswer++; // New distinct element
    freq[val]++;
}

static void remove(int val, int[] freq) {
    freq[val]--;
    if (freq[val] == 0) currentAnswer--; // Lost a distinct element
}`
      }
    ]
  },
  {
    id: "adv-simulated-annealing",
    title: "Simulated Annealing",
    difficulty: "Expert",
    theory: [
      "**Simulated Annealing** is a probabilistic optimization technique for finding near-optimal solutions to hard problems (like TSP).",
      "It mimics the cooling of metal: at high temperature, accept worse solutions (to escape local optima). As temperature decreases, become more selective.",
      "The acceptance probability of a worse solution = e^(-(newEnergy - oldEnergy) / temperature). As temp → 0, this → 0.",
      "Useful in CP for optimization problems where exact solutions are too slow (e.g., NP-hard problems with soft constraints)."
    ],
    code: [
      {
        title: "Simulated Annealing — Generic Framework",
        language: "java",
        content: `interface SAStrategy<T> {
    T getInitial();
    T getNeighbor(T current);
    double getEnergy(T solution); // Lower = better
}

static <T> T simulatedAnnealing(SAStrategy<T> strategy,
        double initTemp, double coolingRate, int iterations) {
    T current = strategy.getInitial();
    T best = current;
    double currentEnergy = strategy.getEnergy(current);
    double bestEnergy = currentEnergy;
    double temp = initTemp;

    Random rand = new Random();
    for (int i = 0; i < iterations; i++) {
        T neighbor = strategy.getNeighbor(current);
        double neighborEnergy = strategy.getEnergy(neighbor);

        // Accept better solutions always
        // Accept worse solutions with decreasing probability
        if (neighborEnergy < currentEnergy ||
            rand.nextDouble() < Math.exp(-(neighborEnergy - currentEnergy) / temp)) {
            current = neighbor;
            currentEnergy = neighborEnergy;

            if (neighborEnergy < bestEnergy) {
                best = neighbor;
                bestEnergy = neighborEnergy;
            }
        }
        temp *= coolingRate; // Cool down
    }
    return best;
}`
      },
      {
        title: "TSP with Simulated Annealing",
        language: "java",
        content: `// Example: Traveling Salesman Problem
// Neighbor = swap two random cities in the tour
static double solveTSP(double[][] dist) {
    int n = dist.length;

    SAStrategy<int[]> tsp = new SAStrategy<>() {
        public int[] getInitial() {
            int[] perm = new int[n];
            for (int i = 0; i < n; i++) perm[i] = i;
            // Shuffle for random start
            Random r = new Random();
            for (int i = n - 1; i > 0; i--) {
                int j = r.nextInt(i + 1);
                int tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
            }
            return perm;
        }

        public int[] getNeighbor(int[] current) {
            int[] neighbor = current.clone();
            Random r = new Random();
            int i = r.nextInt(n), j = r.nextInt(n);
            int tmp = neighbor[i]; neighbor[i] = neighbor[j]; neighbor[j] = tmp;
            return neighbor;
        }

        public double getEnergy(int[] tour) {
            double total = 0;
            for (int i = 0; i < n; i++)
                total += dist[tour[i]][tour[(i + 1) % n]];
            return total;
        }
    };

    int[] bestTour = simulatedAnnealing(tsp, 10000, 0.9999, 1000000);
    return tsp.getEnergy(bestTour);
}`
      }
    ]
  }
];
