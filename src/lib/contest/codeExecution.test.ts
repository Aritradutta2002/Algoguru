import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `VITE_CONTEST_EXECUTION_MODE` selects the execution path. The default must be
 * a runner that really executes, and every path must be honest about grading.
 */

const request = {
  sessionId: "session-1",
  problemId: "java:two-sum-indices",
  problemSlug: "two-sum-indices",
  language: "java" as const,
  code: "class Solution {}",
  mode: "run" as const,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("loadCodeExecutionService", () => {
  it("defaults to the ungraded practice runner", async () => {
    const { loadCodeExecutionService } =
      await import("@/lib/contest/codeExecution");
    const service = await loadCodeExecutionService();
    expect(service.graded).toBe(false);
    expect(service.supportsCustomInput).toBe(false);
  });

  it("can be switched off, and then says so instead of faking a run", async () => {
    vi.stubEnv("VITE_CONTEST_EXECUTION_MODE", "off");
    const { loadCodeExecutionService } =
      await import("@/lib/contest/codeExecution");
    const service = await loadCodeExecutionService();
    const result = await service.run(request);
    expect(result.verdict).toBe("unavailable");
    expect(result.stderr).toContain("turned off");
    expect(result.hiddenEvaluated).toBe(false);
  });

  it("falls back to practice when the server judge is not deployed", async () => {
    vi.stubEnv("VITE_CONTEST_EXECUTION_MODE", "server");
    const { loadCodeExecutionService } =
      await import("@/lib/contest/codeExecution");
    const service = await loadCodeExecutionService();
    expect(service).not.toBe(
      (await import("@/lib/contest/codeExecution")).unavailableExecutionService,
    );
    expect(service.graded).toBe(false);
  });
});
