import { describe, expect, it } from "vitest";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import {
  buildContestProgram,
  CONTEST_PROGRAM_LINE_OFFSET,
  CONTEST_RUNNER_SPECS,
  getContestRunnerSpec,
  normalizeOutput,
  outputsMatch,
  parseRunnerReport,
  resolveProblemForExecution,
  type MethodRunnerSpec,
  type ReturnFormat,
  type StdinReader,
} from "@/lib/contest/contestRunner";

/**
 * The runner is the part of the contest workspace that turns a learner's
 * `Solution` class into something a JVM can actually execute. These tests pin
 * the contract that used to fail silently:
 *
 *   - every published problem has a runner spec,
 *   - the spec's Java types match the problem's documented signature,
 *   - the spec's stdin readers match the documented input format exactly, so a
 *     case can never be half-read (the old LeetCode-style line chunking bug),
 *   - the generated program carries the learner code and the protocol, and the
 *     protocol round-trips.
 */

const JAVA_TYPE: Record<StdinReader, string> = {
  int: "int",
  text: "String",
  intArray: "int[]",
  textLines: "List<String>",
  textArray: "String[]",
  textTokens: "List<String>",
  intPairs: "List<List<Integer>>",
  linkedList: "ListNode",
};

const RETURN_TYPE: Record<ReturnFormat, string> = {
  scalar: "scalar",
  intArray: "int[]",
  stringList: "List<String>",
  intGroups: "List<List<Integer>>",
  stringGroups: "List<List<String>>",
  linkedList: "ListNode",
};

function simpleType(type: string): string {
  return type
    .replace(/java\.util\./g, "")
    .replace(/\b(public|private|protected|static|final)\b/g, "")
    .replace(/\s+/g, "");
}

function parseSignature(signature: string): { name: string; params: string[] } {
  const name = signature
    .slice(0, signature.indexOf("("))
    .trim()
    .split(/\s+/)
    .pop()!;
  const inner = signature.slice(
    signature.indexOf("(") + 1,
    signature.lastIndexOf(")"),
  );
  const params: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of inner) {
    if (char === "<") depth += 1;
    if (char === ">") depth -= 1;
    if (char === "," && depth === 0) {
      params.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) params.push(current.trim());
  return {
    name,
    params: params.map((param) =>
      simpleType(param.split(/\s+/).slice(0, -1).join(" ")),
    ),
  };
}

function parseReturnType(signature: string): string {
  const before = signature.slice(0, signature.indexOf("(")).trim();
  const parts = before.split(/\s+/);
  return simpleType(parts.slice(0, -1).join(" "));
}

/**
 * A strict mirror of the generated Java readers. It throws when a case does not
 * match the declared shape, which is what makes the alignment test meaningful.
 */
function readCase(
  spec: MethodRunnerSpec,
  input: string,
): Record<string, unknown> {
  const lines = input.split("\n");
  let at = 0;
  const next = (): string => {
    if (at >= lines.length)
      throw new Error("read past the end of the case input");
    return lines[at++];
  };
  const int = (): number => {
    const raw = next().trim();
    if (!raw) return 0;
    const value = Number(raw);
    if (!Number.isInteger(value))
      throw new Error(`expected an integer, got ${JSON.stringify(raw)}`);
    return value;
  };
  const tokens = (): string[] => {
    const raw = next().trim();
    return raw ? raw.split(/\s+/) : [];
  };
  const count = (values: unknown[], declared: number, what: string) => {
    if (values.length !== declared) {
      throw new Error(
        `${what} declares ${declared} value(s) but lists ${values.length}`,
      );
    }
    return values;
  };

  const values: Record<string, unknown> = {};
  for (const read of spec.reads) {
    switch (read.reader) {
      case "int":
        values[read.name] = int();
        break;
      case "text":
        values[read.name] = next();
        break;
      case "intArray": {
        const n = int();
        values[read.name] = count(tokens(), n, "int array").map(Number);
        break;
      }
      case "textLines":
      case "textArray": {
        const k = int();
        const rows: string[] = [];
        for (let i = 0; i < k; i++) rows.push(next());
        values[read.name] = rows;
        break;
      }
      case "textTokens": {
        const w = int();
        values[read.name] = count(tokens(), w, "token list");
        break;
      }
      case "intPairs": {
        const m = int();
        const rows: number[][] = [];
        for (let i = 0; i < m; i++) {
          const parts = tokens();
          if (parts.length !== 2)
            throw new Error(`interval ${i + 1} must be two integers`);
          rows.push(parts.map(Number));
        }
        values[read.name] = rows;
        break;
      }
      case "linkedList": {
        const n = int();
        values[read.name] = count(tokens(), n, "linked list").map(Number);
        break;
      }
      default: {
        const exhaustive: never = read.reader;
        throw new Error(`unhandled reader ${exhaustive}`);
      }
    }
  }

  if (at !== lines.length) {
    throw new Error(
      `${lines.length - at} input line(s) were never read: ${lines.slice(at).join(" | ")}`,
    );
  }
  return values;
}

describe("contest runner specs", () => {
  it("covers every published problem", () => {
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      expect(getContestRunnerSpec(problem.slug), problem.slug).not.toBeNull();
    }
  });

  it("has no spec for a problem that is not public", () => {
    const slugs = new Set(PUBLIC_JAVA_PROBLEMS.map((problem) => problem.slug));
    for (const slug of Object.keys(CONTEST_RUNNER_SPECS)) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it("resolves a problem by slug, by public id, or by slug-as-id", () => {
    expect(
      resolveProblemForExecution({ problemSlug: "two-sum-indices" })?.slug,
    ).toBe("two-sum-indices");
    expect(
      resolveProblemForExecution({ problemId: "java:two-sum-indices" })?.slug,
    ).toBe("two-sum-indices");
    // Remote sessions only know a UUID, so an unknown id must not resolve.
    expect(resolveProblemForExecution({ problemId: "0f0f-uuid" })).toBeNull();
    expect(resolveProblemForExecution({})).toBeNull();
  });

  it("passes the declared Java types the problem's signature expects", () => {
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      const spec = getContestRunnerSpec(problem.slug)!;
      if (spec.kind !== "method") continue;

      const signature = parseSignature(problem.functionSignature);
      expect(signature.name, problem.slug).toBe(spec.method);
      expect(signature.params, problem.slug).toEqual(
        spec.args.map((name) => {
          const read = spec.reads.find((candidate) => candidate.name === name);
          if (!read)
            throw new Error(`${problem.slug}: arg ${name} is never read`);
          return simpleType(JAVA_TYPE[read.reader]);
        }),
      );

      const declaredReturn = parseReturnType(problem.functionSignature);
      if (spec.returns === "scalar") {
        expect(["int", "boolean", "String"], problem.slug).toContain(
          declaredReturn,
        );
      } else {
        expect(declaredReturn, problem.slug).toBe(RETURN_TYPE[spec.returns]);
      }
    }
  });

  it("reads every documented input format completely", () => {
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      const spec = getContestRunnerSpec(problem.slug)!;
      for (const testCase of problem.visibleTestCases) {
        if (spec.kind === "min-stack") {
          const lines = testCase.input.split("\n");
          const operations = Number(lines[0]);
          expect(lines.length - 1, `${problem.slug}/${testCase.id}`).toBe(
            operations,
          );
          for (const operation of lines.slice(1)) {
            expect(
              /^(push -?\d+|pop|top|getMin)$/.test(operation.trim()),
              `${problem.slug}/${testCase.id}: ${operation}`,
            ).toBe(true);
          }
          continue;
        }
        expect(
          () => readCase(spec, testCase.input),
          `${problem.slug}/${testCase.id}: ${JSON.stringify(testCase.input)}`,
        ).not.toThrow();
      }
    }
  });
});

describe("buildContestProgram", () => {
  const problem = PUBLIC_JAVA_PROBLEMS.find(
    (candidate) => candidate.slug === "two-sum-indices",
  )!;
  const spec = getContestRunnerSpec("two-sum-indices")!;

  it("embeds the learner code, the driver and the protocol, but no answers", () => {
    const code = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[] { 0, 1 };
    }
}`;
    const program = buildContestProgram(
      code,
      spec,
      problem.visibleTestCases.map((testCase) => testCase.input),
    );

    expect(program).toContain(code);
    expect(program).toContain("class Main");
    expect(program).toContain("@@CASE ");
    expect(program).toContain("new Solution()");
    expect(program).toContain(".twoSum(");
    for (const testCase of problem.visibleTestCases) {
      expect(program).toContain(testCase.input.split("\n")[0]);
      // Expected outputs are public, but the generated program has no reason to
      // carry them — the comparison happens in TypeScript, never in the JVM.
      if (testCase.expectedOutput) {
        expect(program).not.toContain(JSON.stringify(testCase.expectedOutput));
      }
    }
  });

  it("reports the learner's line numbers, not the generated file's", () => {
    const code = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[0];
    }
}`;
    const program = buildContestProgram(code, spec, ["4\n2 7 11 15\n9"]);
    // Line 1 of the program is the first auto-import; the learner's first line
    // must land at CONTEST_PROGRAM_LINE_OFFSET + 1.
    expect(program.split("\n")[CONTEST_PROGRAM_LINE_OFFSET]).toBe(
      "class Solution {",
    );
  });

  it("removes `public` from class declarations so one file can hold Main", () => {
    const program = buildContestProgram(
      "public class Solution { public int[] twoSum(int[] n, int t) { return new int[0]; } }",
      spec,
      ["4\n2 7 11 15\n9"],
    );
    expect(program).not.toMatch(/\bpublic\s+class\s+Solution\b/);
    expect(program).toContain("class Solution");
  });

  it("keeps comments and string literals intact", () => {
    const code = `class Solution {
    // a lone } in a line comment
    public int[] twoSum(int[] nums, int target) {
        /* another } in a block comment */
        String noise = "} not a brace { and a \\" quote";
        return new int[0];
    }
}`;
    const program = buildContestProgram(code, spec, ["4\n2 7 11 15\n9"]);
    expect(program).toContain(code);
  });

  it("declares ListNode once when the learner does not", () => {
    const program = buildContestProgram("class Solution {}", spec, ["1\n1"]);
    expect(program.match(/\bclass\s+ListNode\b/g)).toHaveLength(1);
  });

  it("does not redeclare a learner-provided ListNode", () => {
    const code = `class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }
class Solution { public ListNode reverse(ListNode head) { return head; } }`;
    const reverseSpec = getContestRunnerSpec("reverse-linked-list-recursive")!;
    const program = buildContestProgram(code, reverseSpec, ["1\n1"]);
    expect(program.match(/\bclass\s+ListNode\b/g)).toHaveLength(1);
  });
});

const b64 = (value: string): string => {
  if (!value) return "-";
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

describe("parseRunnerReport", () => {
  it("decodes every case, including empty output and captured prints", () => {
    const stdout = [
      "@@CASE 0 OK - " + b64("debug line"),
      "@@CASE 1 OK " + b64("1 2") + " " + b64(""),
      "@@CASE 2 ERR " + b64("java.lang.NullPointerException: boom"),
      "",
    ].join("\n");

    const outcomes = parseRunnerReport(stdout);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]).toEqual({
      index: 0,
      ok: true,
      actual: "",
      captured: "debug line",
    });
    expect(outcomes[1]).toEqual({
      index: 1,
      ok: true,
      actual: "1 2",
      captured: "",
    });
    expect(outcomes[2]).toMatchObject({ index: 2, ok: false });
    expect(outcomes[2].error).toContain("NullPointerException");
  });

  it("ignores learner output that looks like noise", () => {
    const stdout = [
      "hello",
      "@@CASE nope",
      "@@CASE 0 OK " + b64("3") + " -",
      "trailing",
    ].join("\n");
    expect(parseRunnerReport(stdout)).toHaveLength(1);
  });

  it("returns nothing when the driver never ran", () => {
    expect(parseRunnerReport("")).toEqual([]);
    expect(
      parseRunnerReport('Exception in thread "main" java.lang.Error'),
    ).toEqual([]);
  });

  it("decodes multi-byte characters", () => {
    const [outcome] = parseRunnerReport("@@CASE 0 OK " + b64("héllo →") + " -");
    expect(outcome.actual).toBe("héllo →");
  });
});

describe("output comparison", () => {
  it("ignores trailing whitespace and blank lines", () => {
    expect(outputsMatch("1 2\r\n3\n\n", "1 2\n3")).toBe(true);
    expect(normalizeOutput("  a   b  ")).toBe("a b");
  });

  it("keeps line order significant", () => {
    expect(outputsMatch("a\nb", "b\na")).toBe(false);
  });

  it("treats a missing and an empty answer as the same", () => {
    expect(outputsMatch("", "")).toBe(true);
    expect(outputsMatch(undefined as unknown as string, "")).toBe(true);
    expect(outputsMatch("0", "")).toBe(false);
  });
});
