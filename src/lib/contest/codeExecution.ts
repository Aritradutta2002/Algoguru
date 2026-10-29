import {
  executionUnavailableResult,
  type CodeExecutionService,
} from "@/lib/contest/executionService";
import { useEffect, useState } from "react";

/**
 * Resolves the code-execution service.
 *
 * Resolution order:
 *
 *   1. `VITE_CONTEST_EXECUTION_MODE=off`    → explicit "unavailable".
 *   2. `VITE_CONTEST_EXECUTION_MODE=server` → the application backend
 *      (`contest-execute`). Until that function is deployed the resolver falls
 *      back to the practice runner rather than silently pretending to grade.
 *   3. default                              → the practice runner: a real
 *      compile-and-run against the PUBLIC visible cases, ungraded.
 *
 * The practice adapter is loaded dynamically so it stays in its own chunk and
 * the workspace shell does not pay for it on first paint.
 */

const UNAVAILABLE_MESSAGE =
  "Code execution is turned off for this deployment (VITE_CONTEST_EXECUTION_MODE=off).";

export const unavailableExecutionService: CodeExecutionService = {
  supportsCustomInput: false,
  graded: false,
  run: async () => executionUnavailableResult(UNAVAILABLE_MESSAGE),
  submit: async () => executionUnavailableResult(UNAVAILABLE_MESSAGE),
};

const LOAD_FAILED_MESSAGE =
  "The in-browser code runner could not be loaded. Reload the page and try again.";

/**
 * Used when the practice chunk itself fails to load (offline, stale deploy). It
 * must never look like a run: the learner gets an actionable message instead of
 * a console that waits forever.
 */
export const loadFailedExecutionService: CodeExecutionService = {
  supportsCustomInput: false,
  graded: false,
  run: async () => executionUnavailableResult(LOAD_FAILED_MESSAGE),
  submit: async () => executionUnavailableResult(LOAD_FAILED_MESSAGE),
};

let practiceAdapter: CodeExecutionService | null = null;

export async function loadCodeExecutionService(): Promise<CodeExecutionService> {
  const configured = import.meta.env.VITE_CONTEST_EXECUTION_MODE;
  if (configured === "off") return unavailableExecutionService;

  if (configured === "server") {
    // The server-side `contest-execute` function is specified in
    // docs/coding-contest-backend.md and is not part of this repository yet.
    // Fall through to the practice runner so the workspace still executes code,
    // with the UI stating plainly that the run is not graded.
  }

  if (!practiceAdapter) {
    const module = await import("@/lib/contest/practiceExecutionService");
    practiceAdapter = module.practiceExecutionService;
  }
  return practiceAdapter;
}

export interface CodeExecutionServiceState {
  service: CodeExecutionService;
  loading: boolean;
}

export function useCodeExecutionService(): CodeExecutionServiceState {
  const [state, setState] = useState<CodeExecutionServiceState>({
    service: unavailableExecutionService,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void loadCodeExecutionService()
      .then((service) => {
        if (!cancelled) setState({ service, loading: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ service: loadFailedExecutionService, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
