import { execFileSync } from "node:child_process";

/**
 * True when a JDK (`javac` + `java`) is on PATH.
 *
 * The contest harness tests compile generated Java for real, but the JDK is not
 * a project dependency — a machine without one should skip those tests rather
 * than fail them.
 */
export const supportsJavaToolchain = (() => {
  try {
    execFileSync("javac", ["-version"], { stdio: "ignore", timeout: 10_000 });
    execFileSync("java", ["-version"], { stdio: "ignore", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
})();
