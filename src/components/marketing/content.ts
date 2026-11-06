/**
 * Marketing content for the public landing page.
 *
 * Every number here is derived from the shipped product data, not invented:
 *  - 401 problems / 82 easy / 255 medium / 64 hard  → src/data/practiceData.ts
 *  - 184 lessons across 14 DSA tracks               → src/data/topics.ts
 *  - 12 Java tracks + Spring Boot practice set      → src/data/javaTopics.ts,
 *                                                     src/data/backendInterview
 * Keep this file in sync when the underlying data changes.
 */

export const PRODUCT_FACTS = {
  problems: 401,
  easy: 82,
  medium: 255,
  hard: 64,
  lessons: 184,
  tracks: 14,
  /** Languages the /playground sandbox can run (Piston-backed). */
  playgroundLanguages: ["Java", "Python", "C++"],
} as const;

/** A real lesson tree, trimmed for the hero workspace preview. */
export const PREVIEW_TREE = [
  {
    label: "Arrays",
    meta: "12 / 16",
    children: [
      { label: "Two pointers", state: "done" as const },
      { label: "Sliding window", state: "active" as const },
      { label: "Prefix sums", state: "open" as const },
    ],
  },
  {
    label: "Hashing",
    meta: "6 / 11",
    children: [
      { label: "Hash map internals", state: "done" as const },
      { label: "Frequency counting", state: "open" as const },
    ],
  },
  { label: "Trees", meta: "0 / 14", children: [] },
  { label: "Graphs", meta: "0 / 18", children: [] },
  { label: "Dynamic programming", meta: "0 / 16", children: [] },
] as const;

/** Two Sum — a real problem in src/data/practiceData.ts (Arrays → hashing). */
export const PREVIEW_CODE: { indent: number; tokens: [string, string][] }[] = [
  {
    indent: 0,
    tokens: [
      ["k", "class"],
      ["p", " "],
      ["t", "Solution"],
      ["p", " { "],
    ],
  },
  {
    indent: 1,
    tokens: [
      ["k", "public"],
      ["t", " int"],
      ["p", "[] "],
      ["f", "twoSum"],
      ["p", "("],
      ["k", "int"],
      ["p", "[] "],
      ["n", "nums"],
      ["p", ", "],
      ["k", "int"],
      ["t", " target"],
      ["p", ") {"],
    ],
  },
  {
    indent: 2,
    tokens: [
      ["t", "Map"],
      ["p", "<"],
      ["t", "Integer"],
      ["p", ", "],
      ["t", "Integer"],
      ["p", "> "],
      ["n", "seen"],
      ["p", " = "],
      ["k", "new"],
      ["p", " "],
      ["t", "HashMap"],
      ["p", "<>();"],
    ],
  },
  { indent: 0, tokens: [] },
  {
    indent: 2,
    tokens: [
      ["k", "for"],
      ["p", " ("],
      ["k", "int"],
      ["p", " i = "],
      ["n", "0"],
      ["p", "; i < nums."],
      ["f", "length"],
      ["p", "; i++) {"],
    ],
  },
  {
    indent: 3,
    tokens: [
      ["k", "int"],
      ["p", " need = target - nums[i];"],
    ],
  },
  {
    indent: 3,
    tokens: [
      ["k", "if"],
      ["p", " ("],
      ["n", "seen"],
      ["p", "."],
      ["f", "containsKey"],
      ["p", "(need)) "],
      ["k", "return"],
      ["p", " "],
      ["k", "new"],
      ["p", " "],
      ["k", "int"],
      ["p", "[] { seen."],
      ["f", "get"],
      ["p", "(need), i }"],
    ],
  },
  {
    indent: 3,
    tokens: [
      ["n", "seen"],
      ["p", "."],
      ["f", "put"],
      ["p", "(nums[i], i);"],
    ],
  },
  { indent: 2, tokens: [["p", "}"]] },
  { indent: 2, tokens: [["k", "return"], ["p", " "], ["k", "new"], ["p", " "], ["k", "int"], ["p", "[0];"]] },
  { indent: 1, tokens: [["p", "}"]] },
  { indent: 0, tokens: [["p", "}"]] },
];

/** The five stages an AlgoGuru session moves through. */
export const SESSION_STEPS = [
  {
    id: "discover",
    index: "01",
    title: "Pick the next unfinished lesson",
    body: "The sidebar is a tree, not a feed. Each track knows how far you are and what unlocks next.",
  },
  {
    id: "understand",
    key: "understand",
    index: "02",
    title: "Read a concept built for recall",
    body: "Definitions, a worked example, a complexity table and the mistakes people actually make — on one page.",
  },
  {
    id: "solve",
    index: "03",
    title: "Solve in a real editor",
    body: "Monaco runs in the browser with Java, Python, C++ and JavaScript. Run the sample cases before you submit.",
  },
  {
    id: "review",
    index: "04",
    title: "Check your complexity",
    body: "Every solution records time and space with the reasoning, so you can defend it out loud in an interview.",
  },
  {
    id: "track",
    index: "05",
    title: "Keep the streak honest",
    body: "Completion, bookmarks, notes and practice history are stored per problem in your own account.",
  },
] as const;

export type SessionStepId = (typeof SESSION_STEPS)[number]["id"];

/** Real DSA roadmap nodes, in real prerequisite order. */
export const PATH_NODES = [
  {
    id: "arrays",
    label: "Arrays & memory layout",
    meta: "16 lessons",
    state: "done" as const,
    note: "Contiguous storage, index arithmetic, and why the constant factor beats the asymptotics at small n.",
  },
  {
    id: "two-pointers",
    label: "Two pointers",
    meta: "12 lessons",
    state: "done" as const,
    note: "A sorted array plus one pointer at each end. Motion inwards replaces a nested scan.",
  },
  {
    id: "sliding-window",
    label: "Sliding window",
    meta: "9 lessons",
    state: "active" as const,
    note: "Grow the right edge, shrink the left edge. The invariant is a window that always satisfies the constraint.",
  },
  {
    id: "hashing",
    label: "Hashing & frequency maps",
    meta: "11 lessons",
    state: "next" as const,
    note: "Trade memory for lookup. Good for pair-sum, anagram and duplicate detection problems.",
  },
  {
    id: "trees",
    label: "Trees & recursion",
    meta: "14 lessons",
    state: "locked" as const,
    note: "Unlocks after hashing. Traversals, height, and recursion you can reason about without the stack trace.",
  },
  {
    id: "graphs",
    label: "Graphs & traversal",
    meta: "18 lessons",
    state: "locked" as const,
    note: "BFS and DFS as two views of the same frontier, then shortest paths and topological order.",
  },
] as const;

export const CAPABILITY_FRAGMENTS = [
  {
    id: "editor",
    span: "wide",
    title: "An editor, not a textarea",
    body: "Monaco with language modes, saved drafts per problem, and a test panel that reports the case that failed.",
  },
  {
    id: "complexity",
    span: "tall",
    title: "Complexity with the reasoning",
    body: "Time and space are written next to the code, including what the interviewer will push back on.",
  },
  {
    id: "palette",
    span: "small",
    title: "Keyboard first",
    body: "Command palette for topics, problems and pages. Focus mode for a distraction-free read.",
  },
  {
    id: "notes",
    span: "small",
    title: "Notes that stay attached",
    body: "Write a note on a problem or a lesson and it stays with that problem, not in a separate app.",
  },
] as const;
