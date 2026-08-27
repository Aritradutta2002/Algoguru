import type { Roadmap } from "@/types/roadmapGraph";

/**
 * DSA roadmap.
 *
 * Layout: 6 columns × 6 rows of nodes, top-to-bottom dependency graph.
 * Each node is a step in a learning progression; prerequisites are encoded
 * explicitly so the graph can branch where concepts share dependencies
 * (e.g. Trees and Tries both depend on Linked List and Hashing).
 */
const COL_W = 180;
const ROW_H = 100;
const ORIGIN_X = 500;
const ORIGIN_Y = 50;

function pos(col: number, row: number) {
  return { x: ORIGIN_X + col * COL_W, y: ORIGIN_Y + row * ROW_H };
}

const dsaNodes = [
    {
      id: "arrays",
      type: "roadmap",
      position: pos(0, 0),
      data: {
        id: "arrays",
        title: "Arrays & Hashing",
        subtitle: "9 problems",
        description:
          "The foundation of nearly every interview problem. Learn to think in terms of indices, frequencies and hash lookups.",
        resources: 9,
        category: "Linear",
        prerequisites: [],
        recommendedOrder: 1,
      },
    },
    {
      id: "two-pointers",
      type: "roadmap",
      position: pos(-1, 1),
      data: {
        id: "two-pointers",
        title: "Two Pointers",
        subtitle: "5 problems",
        description:
          "Walk two indices through a sequence to find pairs, partitions or palindromes in O(n).",
        resources: 5,
        category: "Linear",
        prerequisites: ['arrays'],
        recommendedOrder: 2,
      },
    },
    {
      id: "sliding-window",
      type: "roadmap",
      position: pos(-1, 2),
      data: {
        id: "sliding-window",
        title: "Sliding Window",
        subtitle: "6 problems",
        description:
          "Maintain a moving window over an array or string to solve subarray / substring problems in linear time.",
        resources: 6,
        category: "Linear",
        prerequisites: ['two-pointers'],
        recommendedOrder: 3,
      },
    },
    {
      id: "stack",
      type: "roadmap",
      position: pos(1, 1),
      data: {
        id: "stack",
        title: "Stack",
        subtitle: "7 problems",
        description:
          "LIFO structure used for matching brackets, monotonic patterns and expression evaluation.",
        resources: 7,
        category: "Linear",
        prerequisites: ['arrays'],
        recommendedOrder: 4,
      },
    },
    {
      id: "binary-search",
      type: "roadmap",
      position: pos(-2, 2),
      data: {
        id: "binary-search",
        title: "Binary Search",
        subtitle: "7 problems",
        description:
          "Halve the search space every step. Master the classic variant and the 'find boundary' pattern.",
        resources: 7,
        category: "Algorithmic",
        prerequisites: ['two-pointers'],
        recommendedOrder: 5,
      },
    },
    {
      id: "linked-list",
      type: "roadmap",
      position: pos(1, 2),
      data: {
        id: "linked-list",
        title: "Linked List",
        subtitle: "8 problems",
        description:
          "Pointer manipulation, fast/slow pointers, reversal and merge — the building blocks of every list problem.",
        resources: 8,
        category: "Linear",
        prerequisites: ['two-pointers'],
        recommendedOrder: 6,
      },
    },

    {
      id: "trees",
      type: "roadmap",
      position: pos(0, 3),
      data: {
        id: "trees",
        title: "Trees",
        subtitle: "12 problems",
        description:
          "BFS, DFS, traversals, BST, LCA, recursion on trees — the biggest topic in any interview prep.",
        resources: 12,
        category: "Trees & Heaps",
        prerequisites: ['binary-search', 'linked-list', 'stack'],
        recommendedOrder: 7,
      },
    },
    {
      id: "tries",
      type: "roadmap",
      position: pos(-1, 4),
      data: {
        id: "tries",
        title: "Tries",
        subtitle: "3 problems",
        description:
          "Prefix trees for O(L) lookup of strings. Used for autocomplete, word search and routing.",
        resources: 3,
        category: "Trees & Heaps",
        prerequisites: ['trees'],
        recommendedOrder: 8,
      },
    },
    {
      id: "heap",
      type: "roadmap",
      position: pos(0, 4),
      data: {
        id: "heap",
        title: "Heap / Priority Queue",
        subtitle: "5 problems",
        description:
          "Maintain the smallest or largest element in O(log n). Underpins Top-K, Dijkstra and scheduling.",
        resources: 5,
        category: "Trees & Heaps",
        prerequisites: ['trees'],
        recommendedOrder: 9,
      },
    },
    {
      id: "backtracking",
      type: "roadmap",
      position: pos(1.5, 3.5),
      data: {
        id: "backtracking",
        title: "Backtracking",
        subtitle: "9 problems",
        description:
          "Enumerate every possible decision tree, prune when constraints are violated. Subsets, permutations, N-Queens.",
        resources: 9,
        category: "Algorithmic",
        prerequisites: ['trees'],
        recommendedOrder: 10,
      },
    },
    {
      id: "graphs",
      type: "roadmap",
      position: pos(1, 4.5),
      data: {
        id: "graphs",
        title: "Graphs",
        subtitle: "11 problems",
        description:
          "BFS, DFS, Union-Find, topological sort. The conceptual jump from linear to network data.",
        resources: 11,
        category: "Graphs",
        prerequisites: ['backtracking'],
        recommendedOrder: 11,
      },
    },
    {
      id: "advanced-graphs",
      type: "roadmap",
      position: pos(0, 5),
      data: {
        id: "advanced-graphs",
        title: "Advanced Graphs",
        subtitle: "7 problems",
        description:
          "Shortest path (Dijkstra / Bellman-Ford), MST, network flow and strongly connected components.",
        resources: 7,
        category: "Graphs",
        prerequisites: ['graphs', 'heap'],
        recommendedOrder: 12,
      },
    },

    {
      id: "greedy",
      type: "roadmap",
      position: pos(-1.25, 5),
      data: {
        id: "greedy",
        title: "Greedy",
        subtitle: "5 problems",
        description:
          "Make the locally optimal choice and trust it to be globally optimal. Interval scheduling, jump game.",
        resources: 5,
        category: "Algorithmic",
        prerequisites: ['heap'],
        recommendedOrder: 13,
      },
    },
    {
      id: "intervals",
      type: "roadmap",
      position: pos(-2.5, 5),
      data: {
        id: "intervals",
        title: "Intervals",
        subtitle: "5 problems",
        description:
          "Sort, sweep, merge. The bread-and-butter of scheduling and range problems.",
        resources: 5,
        category: "Algorithmic",
        prerequisites: ['heap'],
        recommendedOrder: 14,
      },
    },
    {
      id: "1d-dp",
      type: "roadmap",
      position: pos(2.5, 4.5),
      data: {
        id: "1d-dp",
        title: "1-D Dynamic Programming",
        subtitle: "12 problems",
        description:
          "Memoisation on a single index. Climbing stairs, house robber, coin change, LIS.",
        resources: 12,
        category: "DP",
        prerequisites: ['backtracking'],
        recommendedOrder: 15,
      },
    },
    {
      id: "2d-dp",
      type: "roadmap",
      position: pos(2, 5.5),
      data: {
        id: "2d-dp",
        title: "2-D Dynamic Programming",
        subtitle: "11 problems",
        description:
          "Two parameters (i, j). Grid paths, edit distance, knapsack, longest common subsequence.",
        resources: 11,
        category: "DP",
        prerequisites: ['1d-dp', 'graphs'],
        recommendedOrder: 16,
      },
    },
    {
      id: "bit-manipulation",
      type: "roadmap",
      position: pos(3.5, 5.5),
      data: {
        id: "bit-manipulation",
        title: "Bit Manipulation",
        subtitle: "5 problems",
        description:
          "XOR, masks, bit tricks. Concise, fast and surprisingly common in interviews.",
        resources: 5,
        category: "Math & Bits",
        prerequisites: ['1d-dp'],
        recommendedOrder: 17,
      },
    },
    {
      id: "math-geometry",
      type: "roadmap",
      position: pos(3, 6.5),
      data: {
        id: "math-geometry",
        title: "Math & Geometry",
        subtitle: "5 problems",
        description:
          "Primes, GCD/LCM, modular arithmetic, matrices and basic geometry. The 'trick' problems.",
        resources: 5,
        category: "Math & Bits",
        prerequisites: ['2d-dp', 'bit-manipulation'],
        recommendedOrder: 18,
      },
    },
];

export const dsaRoadmap: Roadmap = {
  id: "dsa",
  title: "DSA Roadmap",
  subtitle: "Master the patterns that show up in every coding interview",
  accent: "#A855F7",
  categories: [
    { label: "Linear", color: "#7C3AED" },
    { label: "Trees & Heaps", color: "#10B981" },
    { label: "Graphs", color: "#3B82F6" },
    { label: "Algorithmic", color: "#F59E0B" },
    { label: "DP", color: "#EC4899" },
    { label: "Math & Bits", color: "#06B6D4" },
  ],
  nodes: dsaNodes as Roadmap["nodes"],
  // Edges are derived from the prerequisites declared on each node so the
  // data file stays the single source of truth.
  edges: dsaNodes.flatMap((n) =>
    n.data.prerequisites.map((p) => ({
      id: `${p}->${n.id}`,
      source: p,
      target: n.id,
    }))
  ),
};


