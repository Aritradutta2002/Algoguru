import { describe, expect, it } from "vitest";
import {
  EXECUTION_VERDICT_LABELS,
  executionUnavailableResult,
  type ExecutionVerdict,
} from "@/lib/contest/executionService";
import { unavailableExecutionService } from "@/lib/contest/codeExecution";
import type { ExecutionRequest } from "@/lib/contest/executionService";

function request(mode: "run" | "submit" = "run"): ExecutionRequest {
  return {
    sessionId: "session-1",
    problemId: "java:two-sum-indices",
    problemSlug: "two-sum-indices",
    language: "java",
    code: "class Solution {}",
    mode,
  };
}

const VERDICTS: ExecutionVerdict[] = [
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "unavailable",
  "rate_limited",
];

describe("executionUnavailableResult", () => {
  it("never claims to have executed or graded anything", () => {
    const result = executionUnavailableResult("Execution is off.");
    expect(result.verdict).toBe("unavailable");
    expect(result.hiddenEvaluated).toBe(false);
    expect(result.passed).toBe(0);
    expect(result.total).toBe(0);
    expect(result.testOutcomes).toEqual([]);
    expect(result.stderr).toBe("Execution is off.");
  });
});

describe("unavailableExecutionService", () => {
  it("reports an actionable unavailability instead of a fake pass", async () => {
    const run = await unavailableExecutionService.run(request());
    const submit = await unavailableExecutionService.submit(request("submit"));
    for (const result of [run, submit]) {
      expect(result.verdict).toBe("unavailable");
      expect(result.hiddenEvaluated).toBe(false);
      expect(result.stderr).toContain("turned off");
    }
  });

  it("is never graded and never offers a custom-input box", () => {
    expect(unavailableExecutionService.graded).toBe(false);
    expect(unavailableExecutionService.supportsCustomInput).toBe(false);
  });
});

describe("verdict labels", () => {
  it("labels every verdict, so the console never prints a raw enum", () => {
    for (const verdict of VERDICTS) {
      expect(EXECUTION_VERDICT_LABELS[verdict]?.length).toBeGreaterThan(0);
    }
  });
});
