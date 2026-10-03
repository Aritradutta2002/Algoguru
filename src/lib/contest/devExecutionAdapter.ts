import { parseSolutionSignature } from "@/lib/javaHarness";
import { parseCompilerDiagnostics, type CompilerDiagnostic } from "@/lib/playground/compilerDiagnostics";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import type {
  CodeExecutionService,
  ExecutionRequest,
  ExecutionResult,
} from "@/lib/contest/executionService";

/**
 * ============================================================================
 * DEVELOPMENT ONLY. THIS ADAPTER DOES NOT EXECUTE ANY CODE.
 * ============================================================================
 *
 * A browser cannot safely run untrusted Java, and this repository has no
 * production execution service. An adapter that pretended to run the learner's
 * code would be dishonest and could produce a score that means nothing, so
 * this one deliberately refuses to.
 *
 * What it DOES do, honestly:
 *   - reports compilation-style problems it can detect locally (an unbalanced
 *     source file, a missing or unparsable method signature) using the same
 *     `parseCompilerDiagnostics` / `parseSolutionSignature` helpers the
 *     Playground already uses;
 *   - echoes the problem's VISIBLE sample tests and expected outputs, which
 *     are public data anyway, so the result panel has something to render;
 *   - returns `verdict: "unavailable"` and `mode: "development"` so the UI can
 *     show the real state of the feature instead of a fake pass.
 *
 * It never returns `hiddenEvaluated: true` and never claims an `accepted`
 * verdict it did not actually earn.
 *
 * This module is imported only through a resolver guarded by
 * `import.meta.env.DEV`, so Vite drops it — and any reference-solution data it
 * might otherwise carry — from production bundles.
 */

const NOT_RUN =
  "Code was not executed. Production execution runs on the server in an isolated sandbox; it is not available in this environment.";

/** Detects the class of source problem that a real compiler would reject first. */
function checkSourceShape(code: string): string | null {
  let depth = 0;
  let inBlockComment = false;
  let inLineComment = false;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index];
    const next = code[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return "} unexpected before any {";
  }

  if (inString) return 'string literal is not closed (missing ")';
  if (inBlockComment) return "block comment is not closed (missing */)";
  if (depth !== 0) return `{ is opened ${depth} time(s) but never closed`;
  return null;
}

/** The method name a learner must define, taken from the problem's signature. */
function requiredMethodName(functionSignature: string): string | null {
  const match = functionSignature.match(/([A-Za-z_$][\w$]*)\s*\(/);
  return match ? match[1] : null;
}

/** javac-shaped text so `parseCompilerDiagnostics` can place it in the editor. */
function diagnostic(message: string): CompilerDiagnostic[] {
  return parseCompilerDiagnostics(`Solution.java:1: error: ${message}`);
}

function buildResult(
  request: ExecutionRequest,
  overrides: Partial<ExecutionResult> = {},
): ExecutionResult {
  const problem = PUBLIC_JAVA_PROBLEMS.find(
    (candidate) => candidate.id === request.problemId,
  );
  const visibleTestCases = problem?.visibleTestCases ?? [];

  return {
    verdict: "unavailable",
    stdout: NOT_RUN,
    stderr: "",
    compileDiagnostics: [],
    runtimeMs: 0,
    memoryKb: 0,
    testOutcomes: visibleTestCases.map((testCase) => ({
      caseId: testCase.id,
      passed: false,
      expectedOutput: testCase.expectedOutput,
      visible: true,
    })),
    passed: 0,
    total: visibleTestCases.length,
    hiddenEvaluated: false,
    mode: "development",
    ...overrides,
  };
}

export const devExecutionAdapter: CodeExecutionService = {
  // No runner exists, so a custom-input box would be a dead control.
  supportsCustomInput: false,

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    const problem = PUBLIC_JAVA_PROBLEMS.find(
      (candidate) => candidate.id === request.problemId,
    );

    const shapeError = checkSourceShape(request.code ?? "");
    if (shapeError) {
      return buildResult(request, {
        verdict: "compile_error",
        stdout: "",
        stderr: `Source could not be checked: ${shapeError}.`,
        compileDiagnostics: diagnostic(shapeError),
      });
    }

    // `parseSolutionSignature` returns the first public method it finds, which
    // may be any helper. The problem's declared method is what must exist.
    const expected = problem ? requiredMethodName(problem.functionSignature) : null;
    const parsed = parseSolutionSignature(request.code);
    if (expected && (!parsed || parsed.methodName !== expected)) {
      return buildResult(request, {
        verdict: "compile_error",
        stdout: "",
        stderr: `No method named ${expected}() was found in the solution class. This problem asks for: ${problem?.functionSignature}.`,
        compileDiagnostics: diagnostic(
          `cannot find symbol: method ${expected}()`,
        ),
      });
    }

    return buildResult(request);
  },

  async submit(request: ExecutionRequest): Promise<ExecutionResult> {
    // Submission cannot be scored without hidden tests, so it reports the
    // same honest unavailability as a run.
    return buildResult(request, {
      stderr:
        "Submission not evaluated. Hidden tests run on the server only, and no execution backend is configured in this environment.",
    });
  },
};
