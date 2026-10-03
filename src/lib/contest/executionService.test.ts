import { describe, expect, it } from "vitest";
import { devExecutionAdapter } from "@/lib/contest/devExecutionAdapter";
import { unavailableExecutionService } from "@/lib/contest/codeExecution";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import type { ExecutionRequest } from "@/lib/contest/executionService";

const problem = PUBLIC_JAVA_PROBLEMS[0];

function request(code: string, mode: "run" | "submit" = "run"): ExecutionRequest {
  return {
    sessionId: "session-1",
    problemId: problem.id,
    language: "java",
    code,
    mode,
  };
}

const VALID_SOLUTION = `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[] { seen.get(need), i };
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
`;

describe("devExecutionAdapter", () => {
  it("never claims to have executed anything", async () => {
    const result = await devExecutionAdapter.run(request(VALID_SOLUTION));
    expect(result.mode).toBe("development");
    expect(result.verdict).toBe("unavailable");
    expect(result.stdout).toContain("was not executed");
  });

  it("never reports hidden tests as evaluated", async () => {
    for (const code of [VALID_SOLUTION, "", "class Solution {}"]) {
      const run = await devExecutionAdapter.run(request(code));
      const submit = await devExecutionAdapter.submit(request(code, "submit"));
      expect(run.hiddenEvaluated).toBe(false);
      expect(submit.hiddenEvaluated).toBe(false);
    }
  });

  it("never fabricates a pass, for a run or a submission", async () => {
    const run = await devExecutionAdapter.run(request(VALID_SOLUTION));
    const submit = await devExecutionAdapter.submit(request(VALID_SOLUTION, "submit"));
    expect(run.passed).toBe(0);
    expect(submit.passed).toBe(0);
    expect(submit.verdict).not.toBe("accepted");
    for (const outcome of [...run.testOutcomes, ...submit.testOutcomes]) {
      expect(outcome.passed).toBe(false);
      expect(outcome.visible).toBe(true);
    }
  });

  it("reports a compile error for an unclosed brace", async () => {
    const result = await devExecutionAdapter.run(
      request("class Solution { public int f() { return 1; }"),
    );
    expect(result.verdict).toBe("compile_error");
    expect(result.compileDiagnostics.length).toBeGreaterThan(0);
  });

  it("reports a compile error for a stray closing brace", async () => {
    const result = await devExecutionAdapter.run(request("class Solution { } }"));
    expect(result.verdict).toBe("compile_error");
  });

  it("ignores braces inside strings and comments", async () => {
    // Includes a valid twoSum so the shape check is what is under test here,
    // not the signature check.
    const code = `class Solution {
    // a lone } in a line comment
    public int[] twoSum(int[] nums, int target) {
        /* another } in a block comment */
        String noise = "} not a brace { and a \\" quote";
        return new int[0];
    }
}`;
    const result = await devExecutionAdapter.run(request(code));
    expect(result.verdict).not.toBe("compile_error");
  });

  it("reports a compile error when the required signature is absent", async () => {
    const result = await devExecutionAdapter.run(
      request("class Solution { public void unrelated() { } }"),
    );
    expect(result.verdict).toBe("compile_error");
    expect(result.stderr).toContain("twoSum");
    expect(result.compileDiagnostics.length).toBeGreaterThan(0);
  });

  it("surfaces the problem's visible sample tests without inventing outcomes", async () => {
    const result = await devExecutionAdapter.run(request(VALID_SOLUTION));
    expect(result.testOutcomes).toHaveLength(problem.visibleTestCases.length);
    expect(result.total).toBe(problem.visibleTestCases.length);
    for (const outcome of result.testOutcomes) {
      expect(outcome.actualOutput).toBeUndefined();
      expect(outcome.expectedOutput).toBeDefined();
    }
  });

  it("disables custom input because there is no runner", () => {
    expect(devExecutionAdapter.supportsCustomInput).toBe(false);
  });
});

describe("unavailableExecutionService", () => {
  it("reports an actionable unavailability instead of a fake pass", async () => {
    const result = await unavailableExecutionService.submit(request(VALID_SOLUTION, "submit"));
    expect(result.verdict).toBe("unavailable");
    expect(result.hiddenEvaluated).toBe(false);
    expect(result.stderr).toContain("not configured");
    expect(result.testOutcomes).toHaveLength(0);
  });
});
