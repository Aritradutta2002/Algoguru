import type { CompilerDiagnostic } from "@/lib/playground/compilerDiagnostics";

/**
 * Code-execution boundary for the Java coding contest.
 *
 * The browser must call the APPLICATION BACKEND for execution. It must never
 * call a third-party judge directly, and no provider secret may ever appear in
 * a `VITE_*` variable. The production implementation is a server-side
 * `contest-execute` edge function documented in
 * `docs/coding-contest-backend.md`; it does not exist yet.
 *
 * Only a development adapter is wired up here. See
 * `docs/coding-contest-backend.md` for the isolation guarantees a real
 * implementation must provide (process isolation, CPU/memory/wall-clock caps,
 * output-size caps, no network egress, read-only filesystem, rate limiting,
 * authentication and session-ownership checks).
 */

export interface ExecutionRequest {
  sessionId: string;
  problemId: string;
  language: "java";
  code: string;
  mode: "run" | "submit";
  customInput?: string;
}

export type ExecutionVerdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "unavailable"
  | "rate_limited";

export interface TestOutcome {
  caseId: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  runtimeMs?: number;
  memoryKb?: number;
  /** False for a hidden case. The UI must not print a hidden case's data. */
  visible: boolean;
}

export interface ExecutionResult {
  verdict: ExecutionVerdict;
  stdout: string;
  stderr: string;
  compileDiagnostics: CompilerDiagnostic[];
  runtimeMs: number;
  memoryKb: number;
  testOutcomes: TestOutcome[];
  passed: number;
  total: number;
  /**
   * False whenever hidden tests were not evaluated. The UI MUST surface this;
   * a run with `hiddenEvaluated: false` can never justify a score.
   */
  hiddenEvaluated: boolean;
  mode: "development" | "production";
}

export interface CodeExecutionService {
  /** Feature detection for optional UI such as the custom-input box. */
  readonly supportsCustomInput: boolean;
  run(request: ExecutionRequest): Promise<ExecutionResult>;
  submit(request: ExecutionRequest): Promise<ExecutionResult>;
}

export const EXECUTION_VERDICT_LABELS: Record<ExecutionVerdict, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong answer",
  compile_error: "Compile error",
  runtime_error: "Runtime error",
  time_limit_exceeded: "Time limit exceeded",
  memory_limit_exceeded: "Memory limit exceeded",
  unavailable: "Execution unavailable",
  rate_limited: "Too many requests",
};

/**
 * Signals that no execution backend is configured. The workspace turns this
 * into an actionable message rather than an empty console.
 */
export function executionUnavailableResult(
  detail: string,
): ExecutionResult {
  return {
    verdict: "unavailable",
    stdout: "",
    stderr: detail,
    compileDiagnostics: [],
    runtimeMs: 0,
    memoryKb: 0,
    testOutcomes: [],
    passed: 0,
    total: 0,
    hiddenEvaluated: false,
    mode: "production",
  };
}
