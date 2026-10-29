import { afterEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import {
  buildContestProgram,
  getContestRunnerSpec,
} from "@/lib/contest/contestRunner";
import { practiceExecutionService } from "@/lib/contest/practiceExecutionService";
import type { ExecutionRequest } from "@/lib/contest/executionService";

/**
 * The practice runner is the only execution path this deployment can honestly
 * offer: a real compile-and-run against the PUBLIC visible cases. These tests
 * pin its two non-negotiables — it really executes, and it can never pretend to
 * have graded anything.
 */

const problem = PUBLIC_JAVA_PROBLEMS.find(
  (candidate) => candidate.slug === "two-sum-indices",
)!;

const SOLUTION = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[] { 0, 1 };
    }
}`;

function request(overrides: Partial<ExecutionRequest> = {}): ExecutionRequest {
  return {
    sessionId: "session-1",
    problemId: problem.id,
    problemSlug: problem.slug,
    language: "java",
    code: SOLUTION,
    mode: "run",
    ...overrides,
  };
}

const b64 = (value: string): string => {
  if (!value) return "-";
  let binary = "";
  for (const char of new TextEncoder().encode(value))
    binary += String.fromCharCode(char);
  return btoa(binary);
};

function reportLine(index: number, actual: string, captured = ""): string {
  return `@@CASE ${index} OK ${b64(actual)} ${b64(captured)}`;
}

function wandboxReply(overrides: Record<string, unknown> = {}) {
  return {
    status: "0",
    compiler_error: "",
    compiler_message: "",
    program_output: "",
    program_error: "",
    ...overrides,
  };
}

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(
  ...responses: Array<Record<string, unknown> | Error>
): FetchMock {
  const fetchMock = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");
    if (next instanceof Error) throw next;
    return {
      ok: true,
      status: 200,
      json: async () => next,
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock as unknown as FetchMock;
}

function postedBody(
  fetchMock: FetchMock,
  call = 0,
): { compiler: string; code: string } {
  const init = fetchMock.mock.calls[call][1] as RequestInit;
  return JSON.parse(String(init.body));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("practiceExecutionService", () => {
  it("is never graded and never offers custom input", () => {
    expect(practiceExecutionService.graded).toBe(false);
    expect(practiceExecutionService.supportsCustomInput).toBe(false);
  });

  it("really sends the learner code and reports an accepted run", async () => {
    const fetchMock = mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "0 1"),
          reportLine(1, "1 2"),
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.run(request());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(postedBody(fetchMock).code).toContain("return new int[] { 0, 1 };");
    expect(result.verdict).toBe("accepted");
    expect(result.passed).toBe(3);
    expect(result.total).toBe(3);
    expect(result.mode).toBe("practice");
    expect(result.hiddenEvaluated).toBe(false);
    expect(result.testOutcomes.every((outcome) => outcome.visible)).toBe(true);
    expect(result.testOutcomes.map((outcome) => outcome.actualOutput)).toEqual([
      "0 1",
      "1 2",
      "2 3",
    ]);
  });

  it("only ever sends the public visible cases", async () => {
    const fetchMock = mockFetch(
      wandboxReply({ program_output: reportLine(0, "0 1") }),
    );

    await practiceExecutionService.submit(request({ mode: "submit" }));

    const body = postedBody(fetchMock);
    const spec = getContestRunnerSpec(problem.slug)!;
    const expectedProgram = buildContestProgram(
      SOLUTION,
      spec,
      problem.visibleTestCases.map((testCase) => testCase.input),
    );
    expect(body.code).toBe(expectedProgram);
    for (const testCase of problem.visibleTestCases) {
      expect(body.code).not.toContain(JSON.stringify(testCase.expectedOutput));
    }
  });

  it("reports a wrong answer with the learner's output attached", async () => {
    mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "0 1"),
          reportLine(1, "0 0"),
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.run(request());

    expect(result.verdict).toBe("wrong_answer");
    expect(result.passed).toBe(2);
    expect(result.total).toBe(3);
    const failed = result.testOutcomes.filter((outcome) => !outcome.passed);
    expect(failed).toHaveLength(1);
    expect(failed[0].actualOutput).toBe("0 0");
    expect(failed[0].expectedOutput).toBe("1 2");
  });

  it("maps javac output to diagnostics on a compile error", async () => {
    mockFetch(
      wandboxReply({
        status: "1",
        compiler_error:
          "prog.java:9: error: ';' expected\n        return 1\n                ^\n1 error\n",
        compiler_message:
          "prog.java:9: error: ';' expected\n        return 1\n                ^\n1 error\n",
      }),
    );

    const result = await practiceExecutionService.run(
      request({ code: "class Solution {" }),
    );

    expect(result.verdict).toBe("compile_error");
    expect(result.compileDiagnostics.length).toBeGreaterThan(0);
    // The generated program's line 9 is the learner's line 4.
    expect(result.compileDiagnostics[0].line).toBe(4);
    // The merged compiler message is not printed on top of the error.
    expect(result.compileDiagnostics).toHaveLength(1);
    expect(result.testOutcomes).toHaveLength(problem.visibleTestCases.length);
    expect(result.testOutcomes.every((outcome) => !outcome.passed)).toBe(true);
    expect(result.hiddenEvaluated).toBe(false);
  });

  it("still runs when the compiler only emitted warnings", async () => {
    mockFetch(
      wandboxReply({
        status: "0",
        compiler_message: "Note: Solution.java uses unchecked operations",
        program_output: [
          reportLine(0, "0 1"),
          reportLine(1, "1 2"),
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("accepted");
  });

  it("reports a per-case runtime error instead of a score", async () => {
    mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "0 1"),
          `@@CASE 1 ERR ${b64("java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds")}`,
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.run(request());

    expect(result.verdict).toBe("runtime_error");
    expect(result.passed).toBe(2);
    expect(result.stderr).toContain("Case 2");
    expect(result.stderr).toContain("ArrayIndexOutOfBoundsException");
    expect(result.testOutcomes[1].actualOutput).toContain("Runtime error");
  });

  it("surfaces the learner's own prints without treating them as the answer", async () => {
    mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "0 1", "debug 1"),
          reportLine(1, "1 2", ""),
          reportLine(2, "2 3", "debug 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("accepted");
    expect(result.stdout).toContain("[case 1]");
    expect(result.stdout).toContain("debug 1");
  });

  it("reports a runtime error when the driver never produced a report", async () => {
    mockFetch(
      wandboxReply({
        program_error:
          'Exception in thread "main" java.lang.StackOverflowError',
      }),
    );

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("runtime_error");
    expect(result.stderr).toContain("StackOverflowError");
    expect(result.passed).toBe(0);
  });

  it("reports the time limit when the process was killed", async () => {
    mockFetch(
      wandboxReply({ program_output: "", program_error: "Killed (timeout)" }),
    );

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("time_limit_exceeded");
  });

  it("treats a sandbox kill signal as a time limit, not a crash", async () => {
    mockFetch(
      wandboxReply({ program_output: "", program_error: "", signal: "KILL" }),
    );

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("time_limit_exceeded");
    expect(result.hiddenEvaluated).toBe(false);
  });

  it("reports an unreachable service instead of a fake result", async () => {
    mockFetch(new Error("network down"));

    const result = await practiceExecutionService.run(request());
    expect(result.verdict).toBe("unavailable");
    expect(result.stderr).toContain("Could not reach");
    expect(result.hiddenEvaluated).toBe(false);
  });

  it("reports an HTTP failure instead of a fake result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 503,
            json: async () => ({}),
          }) as unknown as Response,
      ),
    );

    const result = await practiceExecutionService.submit(
      request({ mode: "submit" }),
    );
    expect(result.verdict).toBe("unavailable");
    expect(result.stderr).toContain("503");
  });

  it("says plainly that a practice submission is not scored", async () => {
    mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "0 1"),
          reportLine(1, "1 2"),
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.submit(
      request({ mode: "submit" }),
    );

    expect(result.verdict).toBe("accepted");
    expect(result.mode).toBe("practice");
    expect(result.hiddenEvaluated).toBe(false);
    expect(result.stdout).toContain("Practice runner");
    expect(result.stdout).toContain("no score is produced");
  });

  it("cannot grade a submission, so a failing one is still not a score", async () => {
    mockFetch(
      wandboxReply({
        program_output: [
          reportLine(0, "9 9"),
          reportLine(1, "1 2"),
          reportLine(2, "2 3"),
        ].join("\n"),
      }),
    );

    const result = await practiceExecutionService.submit(
      request({ mode: "submit" }),
    );
    expect(result.verdict).toBe("wrong_answer");
    expect(result.hiddenEvaluated).toBe(false);
    expect(result.passed).toBe(2);
  });

  it("refuses to guess a runner for an unknown problem", async () => {
    const fetchMock = mockFetch(wandboxReply());
    const result = await practiceExecutionService.run(
      request({ problemId: "0f0f-uuid", problemSlug: undefined }),
    );
    expect(result.verdict).toBe("unavailable");
    expect(result.stderr).toContain("not in the public problem bank");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves a remote session's UUID problem id from the public slug", async () => {
    const fetchMock = mockFetch(
      wandboxReply({ program_output: reportLine(0, "0 1") }),
    );
    await practiceExecutionService.run(
      request({ problemId: "0f0f-uuid", problemSlug: "two-sum-indices" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
