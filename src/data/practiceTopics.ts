import { Topic } from "./topics";

export const practiceTopics: Topic[] = [
  {
    id: "practice-arrays",
    title: "Arrays & Hashing",
    icon: "▦",
    color: "accent",
    description: "Two Sum, subarrays, frequency counting & hashing tricks",
    subtopics: [
      { id: "arrays-easy", title: "Easy Problems" },
      { id: "arrays-medium", title: "Medium Problems" },
      { id: "arrays-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-strings",
    title: "Strings Practice",
    icon: "✎",
    color: "success",
    description: "Palindromes, anagrams, pattern matching & manipulation",
    subtopics: [
      { id: "strings-easy", title: "Easy Problems" },
      { id: "strings-medium", title: "Medium Problems" },
      { id: "strings-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-recursion",
    title: "Recursion & Backtracking",
    icon: "↻",
    color: "warning",
    description: "Subsets, permutations, N-Queens & maze problems",
    subtopics: [
      { id: "recursion-easy", title: "Easy Problems" },
      { id: "recursion-medium", title: "Medium Problems" },
      { id: "recursion-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-dp",
    title: "Dynamic Programming",
    icon: "⊞",
    color: "info",
    description: "Classic DP problems — knapsack, LCS, LIS & more",
    subtopics: [
      { id: "dp-easy", title: "Easy Problems" },
      { id: "dp-medium", title: "Medium Problems" },
      { id: "dp-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-graphs",
    title: "Graph Problems",
    icon: "◉",
    color: "heap",
    description: "BFS, DFS, shortest path, connected components & more",
    subtopics: [
      { id: "graphs-easy", title: "Easy Problems" },
      { id: "graphs-medium", title: "Medium Problems" },
      { id: "graphs-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-trees",
    title: "Trees Practice",
    icon: "🌳",
    color: "primary",
    description: "Traversals, BST operations, LCA & path problems",
    subtopics: [
      { id: "trees-easy", title: "Easy Problems" },
      { id: "trees-medium", title: "Medium Problems" },
      { id: "trees-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-greedy",
    title: "Greedy & Sorting",
    icon: "⚡",
    color: "accent",
    description: "Interval scheduling, activity selection & sorting-based problems",
    subtopics: [
      { id: "greedy-easy", title: "Easy Problems" },
      { id: "greedy-medium", title: "Medium Problems" },
      { id: "greedy-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-stack-queue",
    title: "Stack & Queue",
    icon: "☰",
    color: "primary",
    description: "Monotonic stack, sliding window max, bracket problems",
    subtopics: [
      { id: "stackq-easy", title: "Easy Problems" },
      { id: "stackq-medium", title: "Medium Problems" },
      { id: "stackq-hard", title: "Hard Problems" },
    ],
  },
  {
    id: "practice-math",
    title: "Mathematics",
    icon: "∑",
    color: "success",
    description: "Number theory, combinatorics, modular arithmetic — CSES Mathematics section",
    subtopics: [
      { id: "math-easy", title: "Easy Problems" },
      { id: "math-medium", title: "Medium Problems" },
      { id: "math-hard", title: "Hard Problems" },
    ],
  },
];
