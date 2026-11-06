import { VALID_PARENTHESES_LINES, type CodeToken } from "./codeSnippet";

export type DemoTabId = "problem" | "solution" | "tests";

export const DEMO_TABS = [
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "tests", label: "Tests" },
] as const satisfies ReadonlyArray<{ id: DemoTabId; label: string }>;

export interface DemoAnnotation {
  line: number;
  note: string;
}

export interface DemoTest {
  input: string;
  result: string;
  runtime: string;
}

export interface DemoSession {
  title: string;
  index: string;
  difficulty: string;
  tags: string[];
  statement: string;
  examples: Array<{ input: string; output: string }>;
  constraints: string[];
  code: CodeToken[][];
  annotations: DemoAnnotation[];
  tests: DemoTest[];
}

export const DEMO_SESSION: DemoSession = {
  title: "Valid Parentheses",
  index: "#20 / 500",
  difficulty: "Easy",
  tags: ["String", "Stack"],
  statement:
    "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', decide whether the input is valid: open brackets must be closed by the same type, in the correct order.",
  examples: [
    { input: 's = "()[]{}"', output: "true" },
    { input: 's = "([)]"', output: "false" },
  ],
  constraints: [
    "1 ≤ s.length ≤ 10⁴",
    "s contains only bracket characters",
    "Every close must match the most recent open",
  ],
  code: VALID_PARENTHESES_LINES,
  annotations: [
    { line: 3, note: "A stack remembers what has to close next." },
    { line: 5, note: "Push the matching closer, then compare on the way out." },
    { line: 10, note: "Anything left open means the string is unbalanced." },
  ],
  tests: [
    { input: '"()"', result: "true", runtime: "0.2 ms" },
    { input: '"()[]{}"', result: "true", runtime: "0.3 ms" },
    { input: '"(]"', result: "false", runtime: "0.2 ms" },
    { input: '"([)]"', result: "false", runtime: "0.2 ms" },
    { input: '"{[]}"', result: "true", runtime: "0.4 ms" },
    { input: '"(((((((((())))))))))"', result: "true", runtime: "0.6 ms" },
    { input: '"]"', result: "false", runtime: "0.1 ms" },
    { input: '"(){"', result: "false", runtime: "0.3 ms" },
  ],
};
