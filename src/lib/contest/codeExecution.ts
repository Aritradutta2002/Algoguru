import {
  executionUnavailableResult,
  type CodeExecutionService,
} from "@/lib/contest/executionService";
import { useEffect, useState } from "react";

/**
 * Resolves the code-execution service.
 *
 * Production has no execution backend yet, so asking for one returns an
 * explicit "unavailable" service rather than something that pretends to work.
 *
 * The development adapter is reached through a DYNAMIC import behind
 * `import.meta.env.DEV`. In a production build that branch is statically dead,
 * so Rollup eliminates the module entirely and the adapter never reaches
 * `dist/assets` — which is what keeps any development-only data out of a
 * production bundle. A static or `require()` import would defeat this.
 */

const UNAVAILABLE_MESSAGE =
  "Code execution is not configured for this deployment.";

export const unavailableExecutionService: CodeExecutionService = {
  supportsCustomInput: false,
  run: async () => executionUnavailableResult(UNAVAILABLE_MESSAGE),
  submit: async () => executionUnavailableResult(UNAVAILABLE_MESSAGE),
};

let developmentAdapter: CodeExecutionService | null = null;

export async function loadCodeExecutionService(): Promise<CodeExecutionService> {
  if (!import.meta.env.DEV) return unavailableExecutionService;
  if (!developmentAdapter) {
    const module = await import("@/lib/contest/devExecutionAdapter");
    developmentAdapter = module.devExecutionAdapter;
  }
  return developmentAdapter;
}

/** Synchronous accessor, used by tests that already have the adapter loaded. */
export function resolveCodeExecutionService(
  mode: "development" | "production",
  adapter?: CodeExecutionService,
): CodeExecutionService {
  if (mode === "development" && adapter) return adapter;
  return unavailableExecutionService;
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
    void loadCodeExecutionService().then((service) => {
      if (!cancelled) setState({ service, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
