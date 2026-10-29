import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import type { PublicCodingProblem } from "@/lib/contest/types";

/**
 * Contest code runner.
 *
 * The contest problems read *whole stdin programs* (`Line 1: n`, `Line 2: n
 * ints`, `Line 3: target`), which is not the LeetCode-style "one line per
 * parameter" convention `@/lib/javaHarness` understands. This module owns the
 * contest convention instead:
 *
 *   - one declarative spec per problem (public data only — no answers),
 *   - a generated `Main` driver that parses the declared stdin shape, calls the
 *     learner's method and prints the answer in the problem's output style,
 *   - a machine-readable protocol (`@@CASE <i> OK <base64> <base64>`), so one
 *     JVM run can evaluate every case without the learner's own prints
 *     (captured, not leaked into the protocol) corrupting the result,
 *   - output normalisation used to compare against the expected output.
 *
 * The same module is designed to be copied into the server-side
 * `contest-execute` function later; it has no browser or network dependency.
 */

export type StdinReader =
  | "int" // one line -> int
  | "text" // one line -> String (raw: leading/trailing spaces are data)
  | "intArray" // line n, then n space-separated ints
  | "textLines" // line k, then k lines -> List<String>
  | "textArray" // line k, then k lines -> String[]
  | "textTokens" // line w, then w space-separated tokens -> List<String>
  | "intPairs" // line m, then m lines of space-separated ints -> List<List<Integer>>
  | "linkedList"; // line n, then n space-separated values -> ListNode

export type ReturnFormat =
  | "scalar" // int / boolean / String printed as-is
  | "intArray" // "1 2 3"
  | "stringList" // "a b c"
  | "intGroups" // one line per group: "1 6"
  | "stringGroups" // one line per group: "eat tea ate"
  | "linkedList"; // "5 4 3 2 1"

export interface MethodRunnerSpec {
  kind: "method";
  /** Learner class to instantiate. */
  className: string;
  method: string;
  /**
   * Field reads happen in *input* order; `args` re-orders them for the call.
   * (Some problems read `k` before the array but pass the array first.)
   */
  reads: Array<{ name: string; reader: StdinReader }>;
  args: string[];
  returns: ReturnFormat;
}

export interface MinStackRunnerSpec {
  kind: "min-stack";
  className: string;
}

export type ContestRunnerSpec = MethodRunnerSpec | MinStackRunnerSpec;

/**
 * One spec per seeded slug. Adding a problem means adding a spec here; an
 * unknown slug is surfaced to the learner as "no runner configured", never
 * guessed at.
 */
export const CONTEST_RUNNER_SPECS: Record<string, ContestRunnerSpec> = {
  "two-sum-indices": {
    kind: "method",
    className: "Solution",
    method: "twoSum",
    reads: [
      { name: "nums", reader: "intArray" },
      { name: "target", reader: "int" },
    ],
    args: ["nums", "target"],
    returns: "intArray",
  },
  "maximum-subarray-sum": {
    kind: "method",
    className: "Solution",
    method: "maxSubArray",
    reads: [{ name: "nums", reader: "intArray" }],
    args: ["nums"],
    returns: "scalar",
  },
  "merge-intervals": {
    kind: "method",
    className: "Solution",
    method: "merge",
    reads: [{ name: "intervals", reader: "intPairs" }],
    args: ["intervals"],
    returns: "intGroups",
  },
  "first-position-of-target": {
    kind: "method",
    className: "Solution",
    method: "search",
    reads: [
      { name: "nums", reader: "intArray" },
      { name: "target", reader: "int" },
    ],
    args: ["nums", "target"],
    returns: "scalar",
  },
  "group-anagrams": {
    kind: "method",
    className: "Solution",
    method: "groupAnagrams",
    reads: [{ name: "strs", reader: "textLines" }],
    args: ["strs"],
    returns: "stringGroups",
  },
  "longest-substring-without-repeating": {
    kind: "method",
    className: "Solution",
    method: "lengthOfLongestSubstring",
    reads: [{ name: "s", reader: "text" }],
    args: ["s"],
    returns: "scalar",
  },
  "valid-parentheses": {
    kind: "method",
    className: "Solution",
    method: "isValid",
    reads: [{ name: "s", reader: "text" }],
    args: ["s"],
    returns: "scalar",
  },
  "min-stack": { kind: "min-stack", className: "MinStack" },
  "reverse-linked-list-recursive": {
    kind: "method",
    className: "Solution",
    method: "reverse",
    reads: [{ name: "head", reader: "linkedList" }],
    args: ["head"],
    returns: "linkedList",
  },
  "remove-nth-from-end": {
    kind: "method",
    className: "Solution",
    method: "removeNthFromEnd",
    // Input is: n, then the list length + values.
    reads: [
      { name: "n", reader: "int" },
      { name: "head", reader: "linkedList" },
    ],
    args: ["head", "n"],
    returns: "linkedList",
  },
  "top-k-frequent-words": {
    kind: "method",
    className: "Solution",
    method: "topKFrequent",
    reads: [
      { name: "k", reader: "int" },
      { name: "words", reader: "textTokens" },
    ],
    args: ["words", "k"],
    returns: "stringList",
  },
  "climbing-stairs": {
    kind: "method",
    className: "Solution",
    method: "climbStairs",
    reads: [{ name: "n", reader: "int" }],
    args: ["n"],
    returns: "scalar",
  },
  "best-time-to-buy-and-sell-stock": {
    kind: "method",
    className: "Solution",
    method: "maxProfit",
    reads: [{ name: "prices", reader: "intArray" }],
    args: ["prices"],
    returns: "scalar",
  },
  "contains-duplicate": {
    kind: "method",
    className: "Solution",
    method: "containsDuplicate",
    reads: [{ name: "nums", reader: "intArray" }],
    args: ["nums"],
    returns: "scalar",
  },
  "valid-anagram": {
    kind: "method",
    className: "Solution",
    method: "isAnagram",
    reads: [
      { name: "s", reader: "text" },
      { name: "t", reader: "text" },
    ],
    args: ["s", "t"],
    returns: "scalar",
  },
  "roman-to-integer": {
    kind: "method",
    className: "Solution",
    method: "romanToInt",
    reads: [{ name: "s", reader: "text" }],
    args: ["s"],
    returns: "scalar",
  },
  "longest-common-prefix": {
    kind: "method",
    className: "Solution",
    method: "longestCommonPrefix",
    reads: [{ name: "strs", reader: "textArray" }],
    args: ["strs"],
    returns: "scalar",
  },
  "majority-element": {
    kind: "method",
    className: "Solution",
    method: "majorityElement",
    reads: [{ name: "nums", reader: "intArray" }],
    args: ["nums"],
    returns: "scalar",
  },
  "move-zeroes": {
    kind: "method",
    className: "Solution",
    method: "moveZeroes",
    reads: [{ name: "nums", reader: "intArray" }],
    args: ["nums"],
    returns: "intArray",
  },
  "house-robber": {
    kind: "method",
    className: "Solution",
    method: "rob",
    reads: [{ name: "nums", reader: "intArray" }],
    args: ["nums"],
    returns: "scalar",
  },
  "coin-change": {
    kind: "method",
    className: "Solution",
    method: "coinChange",
    reads: [
      { name: "coins", reader: "intArray" },
      { name: "amount", reader: "int" },
    ],
    args: ["coins", "amount"],
    returns: "scalar",
  },
  "unique-paths": {
    kind: "method",
    className: "Solution",
    method: "uniquePaths",
    reads: [
      { name: "m", reader: "int" },
      { name: "n", reader: "int" },
    ],
    args: ["m", "n"],
    returns: "scalar",
  },
  "kth-largest-element": {
    kind: "method",
    className: "Solution",
    method: "findKthLargest",
    // Input is: k, then the array length + values.
    reads: [
      { name: "k", reader: "int" },
      { name: "nums", reader: "intArray" },
    ],
    args: ["nums", "k"],
    returns: "scalar",
  },
  "trapping-rain-water": {
    kind: "method",
    className: "Solution",
    method: "trap",
    reads: [{ name: "height", reader: "intArray" }],
    args: ["height"],
    returns: "scalar",
  },
};

const JAVA_TYPE: Record<StdinReader, string> = {
  int: "int",
  text: "String",
  intArray: "int[]",
  textLines: "java.util.List<String>",
  textArray: "String[]",
  textTokens: "java.util.List<String>",
  intPairs: "java.util.List<java.util.List<Integer>>",
  linkedList: "ListNode",
};

const JAVA_READ: Record<StdinReader, string> = {
  int: "__int()",
  text: "__next()",
  intArray: "__intArray()",
  textLines: "__textLines()",
  textArray: "__textArray()",
  textTokens: "__textTokens()",
  intPairs: "__intPairs()",
  linkedList: "__linkedList()",
};

const FORMATTER: Record<ReturnFormat, string> = {
  scalar: "__fmt",
  intArray: "__joinInts",
  stringList: "__joinStrings",
  intGroups: "__joinIntGroups",
  stringGroups: "__joinStringGroups",
  linkedList: "__joinList",
};

const AUTO_IMPORTS = `import java.util.*;
import java.util.stream.*;
import java.io.*;
import java.math.*;
`;

/**
 * Every generated program starts with the auto-imports plus a blank line, so
 * `javac` reports the learner's line 1 as line `CONTEST_PROGRAM_LINE_OFFSET + 1`.
 * Diagnostics are shifted back before they reach the editor.
 */
export const CONTEST_PROGRAM_LINE_OFFSET = AUTO_IMPORTS.split("\n").length;

/** The helper surface the generated driver uses. Fully qualified where it can be. */
const RUNTIME = `
    static String[] __lines = new String[0];
    static int __at = 0;

    static String __next() {
        return __at < __lines.length ? __lines[__at++] : "";
    }

    static int __int() {
        String s = __next().trim();
        return s.isEmpty() ? 0 : Integer.parseInt(s);
    }

    static String[] __tokens() {
        String s = __next().trim();
        return s.isEmpty() ? new String[0] : s.split("\\\\s+");
    }

    static int[] __intArray() {
        int n = __int();
        String[] p = __tokens();
        int[] a = new int[n];
        for (int i = 0; i < n && i < p.length; i++) a[i] = Integer.parseInt(p[i]);
        return a;
    }

    static java.util.List<String> __textLines() {
        int k = __int();
        java.util.List<String> out = new java.util.ArrayList<>();
        for (int i = 0; i < k; i++) out.add(__next());
        return out;
    }

    static String[] __textArray() {
        return __textLines().toArray(new String[0]);
    }

    static java.util.List<String> __textTokens() {
        int w = __int();
        String[] p = __tokens();
        java.util.List<String> out = new java.util.ArrayList<>();
        for (int i = 0; i < w && i < p.length; i++) out.add(p[i]);
        return out;
    }

    static java.util.List<java.util.List<Integer>> __intPairs() {
        int m = __int();
        java.util.List<java.util.List<Integer>> out = new java.util.ArrayList<>();
        for (int i = 0; i < m; i++) {
            String[] p = __tokens();
            java.util.List<Integer> row = new java.util.ArrayList<>();
            for (String t : p) if (!t.isEmpty()) row.add(Integer.parseInt(t));
            out.add(row);
        }
        return out;
    }

    static ListNode __linkedList() {
        int n = __int();
        String[] p = __tokens();
        ListNode head = null;
        ListNode tail = null;
        for (int i = 0; i < n && i < p.length; i++) {
            ListNode node = new ListNode(Integer.parseInt(p[i]));
            if (head == null) { head = node; tail = node; }
            else { tail.next = node; tail = node; }
        }
        return head;
    }

    static String __joinInts(int[] a) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < a.length; i++) {
            if (i > 0) b.append(' ');
            b.append(a[i]);
        }
        return b.toString();
    }

    static String __joinStrings(java.util.List<String> values) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) b.append(' ');
            b.append(values.get(i));
        }
        return b.toString();
    }

    static String __joinIntGroups(java.util.List<java.util.List<Integer>> groups) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < groups.size(); i++) {
            if (i > 0) b.append('\\n');
            java.util.List<Integer> row = groups.get(i);
            for (int j = 0; j < row.size(); j++) {
                if (j > 0) b.append(' ');
                b.append(row.get(j));
            }
        }
        return b.toString();
    }

    static String __joinStringGroups(java.util.List<java.util.List<String>> groups) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < groups.size(); i++) {
            if (i > 0) b.append('\\n');
            java.util.List<String> row = groups.get(i);
            for (int j = 0; j < row.size(); j++) {
                if (j > 0) b.append(' ');
                b.append(row.get(j));
            }
        }
        return b.toString();
    }

    static String __joinList(ListNode head) {
        StringBuilder b = new StringBuilder();
        boolean first = true;
        while (head != null) {
            if (!first) b.append(' ');
            b.append(head.val);
            first = false;
            head = head.next;
        }
        return b.toString();
    }

    static String __fmt(int value) { return String.valueOf(value); }
    static String __fmt(boolean value) { return String.valueOf(value); }
    static String __fmt(String value) { return value == null ? "" : value; }

    /** Base64, with "-" standing in for the empty string (an empty field would
     *  collapse the whitespace-delimited protocol line). */
    static String __enc(String value) {
        if (value == null || value.isEmpty()) return "-";
        return java.util.Base64.getEncoder().encodeToString(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
`;

const LIST_NODE_SHIM = `
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
`;

/** JSON string literals are valid Java string literals for the characters we use. */
function javaString(value: string): string {
  return JSON.stringify(value);
}

function buildMethodCase(spec: MethodRunnerSpec): string {
  const reads = spec.reads
    .map(
      (read) =>
        `        ${JAVA_TYPE[read.reader]} ${read.name} = ${JAVA_READ[read.reader]};`,
    )
    .join("\n");
  const formatter = FORMATTER[spec.returns];
  return `    static String __runCase(String[] lines) throws Exception {
        __lines = lines;
        __at = 0;
${reads}
        ${spec.className} __solution = new ${spec.className}();
        return ${formatter}(__solution.${spec.method}(${spec.args.join(", ")}));
    }`;
}

function buildMinStackCase(): string {
  return `    static String __runCase(String[] lines) throws Exception {
        __lines = lines;
        __at = 0;
        int operations = __int();
        MinStack __stack = new MinStack();
        StringBuilder __out = new StringBuilder();
        for (int i = 0; i < operations; i++) {
            String[] op = __tokens();
            if (op.length == 0) continue;
            if (op[0].equals("push")) {
                __stack.push(Integer.parseInt(op[1]));
            } else if (op[0].equals("pop")) {
                __out.append(__stack.pop()).append('\\n');
            } else if (op[0].equals("top")) {
                __out.append(__stack.top()).append('\\n');
            } else if (op[0].equals("getMin")) {
                __out.append(__stack.getMin()).append('\\n');
            }
        }
        return __out.toString();
    }`;
}

/**
 * Build the full compilable source: learner code + generated `Main`.
 *
 * Every case is executed in the same JVM, and the learner's own stdout is
 * captured per case so it can never be confused with the result protocol.
 */
export function buildContestProgram(
  code: string,
  spec: ContestRunnerSpec,
  cases: string[],
): string {
  // `public class X` would clash with the generated `class Main` in one file.
  const normalized = (code ?? "").replace(
    /\bpublic\s+((?:final\s+|abstract\s+)?class\s+)/g,
    "$1",
  );

  const casesLiteral = cases
    .map(
      (input) =>
        `new String[] { ${input.split("\n").map(javaString).join(", ")} }`,
    )
    .join(",\n            ");

  const caseBody =
    spec.kind === "min-stack" ? buildMinStackCase() : buildMethodCase(spec);
  // The runtime helpers always mention `ListNode`, so the class has to exist
  // even for problems that never touch a list. A learner-defined class wins.
  const shim = /\bclass\s+ListNode\b/.test(normalized) ? "" : LIST_NODE_SHIM;

  return `${AUTO_IMPORTS}
${normalized}
${shim}
class Main {
${RUNTIME}
${caseBody}

    public static void main(String[] __args) throws Exception {
        String[][] __cases = new String[][] {
            ${casesLiteral}
        };
        StringBuilder __report = new StringBuilder();
        for (int __ci = 0; __ci < __cases.length; __ci++) {
            java.io.PrintStream __real = System.out;
            java.io.PrintStream __realErr = System.err;
            java.io.ByteArrayOutputStream __captured = new java.io.ByteArrayOutputStream();
            try {
                System.setOut(new java.io.PrintStream(__captured, true, java.nio.charset.StandardCharsets.UTF_8));
                System.setErr(new java.io.PrintStream(__captured, true, java.nio.charset.StandardCharsets.UTF_8));
                String __actual;
                try {
                    __actual = __runCase(__cases[__ci]);
                } finally {
                    System.setOut(__real);
                    System.setErr(__realErr);
                }
                __report.append("@@CASE ").append(__ci).append(" OK ")
                    .append(__enc(__actual))
                    .append(' ')
                    .append(__enc(__captured.toString(java.nio.charset.StandardCharsets.UTF_8)))
                    .append('\\n');
            } catch (Throwable __error) {
                System.setOut(__real);
                System.setErr(__realErr);
                String __message = __error.getClass().getName()
                    + (__error.getMessage() == null ? "" : ": " + __error.getMessage());
                __report.append("@@CASE ").append(__ci).append(" ERR ")
                    .append(java.util.Base64.getEncoder().encodeToString(__message.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                    .append('\\n');
            }
        }
        System.out.print(__report);
    }
}
`;
}

export interface RunnerCaseOutcome {
  index: number;
  ok: boolean;
  /** The value printed by the driver, when the case completed. */
  actual?: string;
  /** The exception class + message when it threw. */
  error?: string;
  /** Anything the learner printed to stdout during the case. */
  captured?: string;
}

const CASE_LINE = /^@@CASE (\d+) (OK|ERR) (\S+)(?: (\S+))?$/;

function decodeBase64(value: string): string {
  if (!value || value === "-") return "";
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/** Parse the driver protocol. Unrecognised lines are ignored. */
export function parseRunnerReport(stdout: string): RunnerCaseOutcome[] {
  const outcomes: RunnerCaseOutcome[] = [];
  for (const rawLine of (stdout ?? "").split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("@@CASE ")) continue;
    const match = CASE_LINE.exec(line);
    if (!match) continue;
    const index = Number(match[1]);
    if (match[2] === "OK") {
      outcomes.push({
        index,
        ok: true,
        actual: decodeBase64(match[3]),
        captured: match[4] ? decodeBase64(match[4]) : "",
      });
    } else {
      outcomes.push({ index, ok: false, error: decodeBase64(match[3]) });
    }
  }
  return outcomes;
}

/**
 * Compare two outputs the way a judge does: line by line, ignoring trailing
 * whitespace and runs of spaces. Order is significant — several problems
 * document it explicitly — so nothing is sorted.
 */
export function normalizeOutput(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export function getContestRunnerSpec(
  slug: string | undefined,
): ContestRunnerSpec | null {
  if (!slug) return null;
  return CONTEST_RUNNER_SPECS[slug] ?? null;
}

/** Best-effort lookup so a remote (UUID) problem id can still find its slug. */
export function resolveProblemForExecution(input: {
  problemId?: string;
  problemSlug?: string;
}): PublicCodingProblem | null {
  const { problemId, problemSlug } = input;
  return (
    PUBLIC_JAVA_PROBLEMS.find(
      (problem) =>
        (problemSlug && problem.slug === problemSlug) ||
        (problemId && (problem.id === problemId || problem.slug === problemId)),
    ) ?? null
  );
}
