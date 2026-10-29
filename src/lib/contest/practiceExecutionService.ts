import { parseCompilerDiagnostics } from "@/lib/playground/compilerDiagnostics";
import {
  buildContestProgram,
  CONTEST_PROGRAM_LINE_OFFSET,
  getContestRunnerSpec,
  outputsMatch,
  parseRunnerReport,
  resolveProblemForExecution,
} from "@/lib/contest/contestRunner";
import type {
  CodeExecutionService,
  ExecutionRequest,
  ExecutionResult,
  TestOutcome,
} from "@/lib/contest/executionService";

/**
 * Practice runner for the Java coding contest.
 *
 * This is the honest, working middle step between "no runner at all" and the
 * server-side `contest-execute` function described in
 * `docs/coding-contest-backend.md`:
 *
 *   - it really compiles and runs the learner's Java,
 *   - it only ever uses the problem's PUBLIC visible test cases,
 *   - it can never produce a graded score (`hiddenEvaluated: false`,
 *     `graded: false`, `mode: "practice"`), and the UI says so,
 *   - hidden tests are not in the browser bundle at all, so there is nothing to
 *     leak.
 *
 * The transport is Wandbox — the same public compile service the Playground
 * already uses. When `contest-execute` is deployed, `codeExecution.ts` switches
 * to it and this module becomes the local fallback.
 */

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const WANDBOX_COMPILER = "openjdk-jdk-21+35";
const MIN_BUDGET_MS = 12_000;
const MAX_BUDGET_MS = 30_000;

export const PRACTICE_MODE_NOTICE =
  "Practice runner — your code is compiled and executed against the visible sample tests only. This deployment does not grade submissions, so no score is produced.";

interface WandboxReply {
  status?: string;
  /** Set when the sandbox killed the process (usually a timeout). */
  signal?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

interface WandboxRun {
  timedOut: boolean;
  compileError: string;
  programOutput: string;
  programError: string;
  runtimeMs: number;
  unavailable?: string;
}

async function callWandbox(
  code: string,
  budgetMs: number,
): Promise<WandboxRun> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  const startedAt =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const response = await fetch(WANDBOX_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        compiler: WANDBOX_COMPILER,
        code,
        stdin: "",
        "compiler-option-raw": "",
        "runtime-option-raw": "",
        save: false,
      }),
    });

    const runtimeMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        startedAt,
    );

    if (!response.ok) {
      return {
        timedOut: false,
        compileError: "",
        programOutput: "",
        programError: "",
        runtimeMs,
        unavailable: `The execution service answered with HTTP ${response.status}. Try again in a moment.`,
      };
    }

    const data = (await response.json()) as WandboxReply;
    // Wandbox's `compiler_message` is the merge of compiler stdout and stderr,
    // so preferring it would print every error twice.
    const compileText = data.compiler_error?.trim()
      ? data.compiler_error
      : (data.compiler_message ?? "");
    const programOutput = data.program_output ?? "";
    const programError =
      (data.program_error ?? "").trim() ||
      (data.signal ? `Killed by signal ${data.signal}` : "");

    // A non-zero status with no program output is a compilation failure;
    // warnings alone still let the program run.
    const failedToCompile =
      Boolean(data.compiler_error?.trim()) ||
      (data.status !== "0" && !programOutput.trim() && Boolean(compileText));

    return {
      timedOut: false,
      compileError: failedToCompile ? compileText : "",
      programOutput,
      programError,
      runtimeMs,
    };
  } catch (error) {
    const runtimeMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        startedAt,
    );
    if (controller.signal.aborted) {
      return {
        timedOut: true,
        compileError: "",
        programOutput: "",
        programError: "",
        runtimeMs,
      };
    }
    return {
      timedOut: false,
      compileError: "",
      programOutput: "",
      programError: "",
      runtimeMs,
      unavailable:
        "Could not reach the code execution service. Check your connection and try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function baseResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    verdict: "unavailable",
    stdout: "",
    stderr: "",
    compileDiagnostics: [],
    runtimeMs: 0,
    memoryKb: 0,
    testOutcomes: [],
    passed: 0,
    total: 0,
    hiddenEvaluated: false,
    mode: "practice",
    ...overrides,
  };
}

function isTimeoutMessage(message: string): boolean {
  return /timeout|timed out|killed|signal|outofmemory|out of memory/i.test(
    message,
  );
}

async function execute(
  request: ExecutionRequest,
  action: "run" | "submit",
): Promise<ExecutionResult> {
  const problem = resolveProblemForExecution({
    problemId: request.problemId,
    problemSlug: request.problemSlug,
  });
  if (!problem) {
    return baseResult({
      stderr:
        "This problem is not in the public problem bank, so the practice runner cannot build a driver for it.",
    });
  }

  const spec = getContestRunnerSpec(problem.slug);
  if (!spec) {
    return baseResult({
      stderr: `No runner is configured for “${problem.slug}” yet.`,
    });
  }

  const cases = problem.visibleTestCases;
  if (cases.length === 0) {
    return baseResult({
      stderr: "This problem has no visible sample tests to run.",
      total: 0,
    });
  }

  const program = buildContestProgram(
    request.code ?? "",
    spec,
    cases.map((test) => test.input),
  );
  const budget = Math.min(
    MAX_BUDGET_MS,
    Math.max(MIN_BUDGET_MS, problem.timeLimitMs * cases.length + 6_000),
  );
  const run = await callWandbox(program, budget);

  if (run.unavailable) {
    return baseResult({ stderr: run.unavailable, runtimeMs: run.runtimeMs });
  }

  if (run.compileError) {
    return baseResult({
      verdict: "compile_error",
      stderr: run.compileError,
      // javac sees the generated program; shift its lines back to the editor.
      compileDiagnostics: parseCompilerDiagnostics(run.compileError).map(
        (diagnostic) => ({
          ...diagnostic,
          line: Math.max(1, diagnostic.line - CONTEST_PROGRAM_LINE_OFFSET),
          ...(diagnostic.endLine
            ? {
                endLine: Math.max(
                  1,
                  diagnostic.endLine - CONTEST_PROGRAM_LINE_OFFSET,
                ),
              }
            : {}),
        }),
      ),
      runtimeMs: run.runtimeMs,
      total: cases.length,
      testOutcomes: cases.map((test) => ({
        caseId: test.id,
        passed: false,
        expectedOutput: test.expectedOutput,
        visible: true,
      })),
    });
  }

  if (run.timedOut) {
    return baseResult({
      verdict: "time_limit_exceeded",
      stderr: `The program did not finish inside the ${Math.round(budget / 1000)}s limit. Look for an unbounded loop or recursion.`,
      runtimeMs: run.runtimeMs,
      total: cases.length,
    });
  }

  const reported = parseRunnerReport(run.programOutput);
  const byIndex = new Map(reported.map((outcome) => [outcome.index, outcome]));

  // The driver never ran at all (JVM killed, main crashed before the loop).
  if (reported.length === 0) {
    const detail = (run.programError || run.programOutput || "").trim();
    const timedOut = isTimeoutMessage(detail);
    return baseResult({
      verdict: timedOut ? "time_limit_exceeded" : "runtime_error",
      stderr: detail
        ? detail
        : "The program stopped before running any test case. Check that your class keeps the required name and method signature.",
      runtimeMs: run.runtimeMs,
      total: cases.length,
    });
  }

  const testOutcomes: TestOutcome[] = cases.map((test, index) => {
    const outcome = byIndex.get(index);
    if (!outcome) {
      return {
        caseId: test.id,
        passed: false,
        expectedOutput: test.expectedOutput,
        visible: true,
      };
    }
    if (!outcome.ok) {
      return {
        caseId: test.id,
        passed: false,
        expectedOutput: test.expectedOutput,
        actualOutput: outcome.error
          ? `Runtime error: ${outcome.error}`
          : undefined,
        visible: true,
      };
    }
    return {
      caseId: test.id,
      passed: outputsMatch(outcome.actual ?? "", test.expectedOutput),
      expectedOutput: test.expectedOutput,
      actualOutput: outcome.actual,
      visible: true,
    };
  });

  const passed = testOutcomes.filter((outcome) => outcome.passed).length;
  const runtimeFailures = reported.filter((outcome) => !outcome.ok);
  const capturedOutput = reported
    .filter((outcome) => (outcome.captured ?? "").trim().length > 0)
    .map((outcome) =>
      `[case ${outcome.index + 1}]\n${outcome.captured}`.trimEnd(),
    )
    .join("\n\n");

  const stderr = runtimeFailures.length
    ? runtimeFailures
        .map(
          (outcome) =>
            `Case ${outcome.index + 1}: ${outcome.error ?? "runtime error"}`,
        )
        .join("\n")
    : "";
  const timedOut =
    runtimeFailures.length > 0 &&
    runtimeFailures.every((outcome) => isTimeoutMessage(outcome.error ?? ""));

  const verdict: ExecutionResult["verdict"] =
    runtimeFailures.length > 0
      ? timedOut
        ? "time_limit_exceeded"
        : "runtime_error"
      : passed === cases.length
        ? "accepted"
        : "wrong_answer";

  const notice = action === "submit" ? PRACTICE_MODE_NOTICE : "";
  return baseResult({
    verdict,
    stdout: [capturedOutput, notice].filter(Boolean).join("\n\n"),
    stderr,
    runtimeMs: run.runtimeMs,
    total: cases.length,
    passed,
    testOutcomes,
    // Submitting in practice mode evaluates visible cases only, so it can never
    // claim a graded result.
    hiddenEvaluated: false,
    mode: "practice",
  });
}

export const practiceExecutionService: CodeExecutionService = {
  // There is no stdin box in the contest workspace; every problem owns its
  // input format.
  supportsCustomInput: false,
  // Practice runs are never scored.
  graded: false,
  run: (request) => execute(request, "run"),
  submit: (request) => execute(request, "submit"),
};
