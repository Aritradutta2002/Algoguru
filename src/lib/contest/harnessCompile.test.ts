import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import {
  buildContestProgram,
  getContestRunnerSpec,
  parseRunnerReport,
} from "@/lib/contest/contestRunner";
import { supportsJavaToolchain } from "@/test/javaToolchain";

/**
 * Compiles the generated program for every problem against a real `javac`.
 *
 * This is the regression guard for the bug this harness was written to fix: the
 * console used to report "not executed" because nothing ever produced a
 * compilable program. A starter class is enough to prove the harness itself is
 * valid — the point is that `Main` compiles, every case produces a protocol
 * line, and nothing relies on a problem's expected output.
 *
 * Skipped when no JDK is installed, so CI without Java still runs the suite.
 */

const run = promisify(execFile);

async function compileAndRun(
  code: string,
): Promise<{ stdout: string; stderr: string }> {
  const directory = await mkdtemp(join(tmpdir(), "contest-harness-"));
  try {
    await writeFile(join(directory, "Main.java"), code, "utf8");
    await run("javac", ["-encoding", "UTF-8", "Main.java"], {
      cwd: directory,
      timeout: 60_000,
    });
    const { stdout, stderr } = await run("java", ["Main"], {
      cwd: directory,
      timeout: 30_000,
    });
    return { stdout, stderr };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe.skipIf(!supportsJavaToolchain)(
  "generated contest harness on a real JVM",
  () => {
    it("compiles every problem and reports one protocol line per case", async () => {
      const failures: string[] = [];

      for (const problem of PUBLIC_JAVA_PROBLEMS) {
        const spec = getContestRunnerSpec(problem.slug);
        if (!spec) {
          failures.push(`${problem.slug}: no runner spec`);
          continue;
        }
        const program = buildContestProgram(
          problem.starterCode,
          spec,
          problem.visibleTestCases.map((testCase) => testCase.input),
        );

        let report: { stdout: string; stderr: string };
        try {
          report = await compileAndRun(program);
        } catch (error) {
          const detail = error as {
            stdout?: string;
            stderr?: string;
            message?: string;
          };
          failures.push(
            `${problem.slug}: did not compile\n${detail.stderr ?? detail.stdout ?? detail.message}`,
          );
          continue;
        }

        const outcomes = parseRunnerReport(report.stdout);
        if (outcomes.length !== problem.visibleTestCases.length) {
          failures.push(
            `${problem.slug}: expected ${problem.visibleTestCases.length} protocol line(s), got ${outcomes.length}\nstdout=${JSON.stringify(report.stdout)}\nstderr=${JSON.stringify(report.stderr)}`,
          );
        }
      }

      expect(failures.join("\n\n")).toBe("");
    }, 240_000);
  },
);
