import { AlertTriangle, Loader2, PlayCircle, Send, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EXECUTION_VERDICT_LABELS } from "@/lib/contest/executionService";
import type {
  ExecutionResult,
  ExecutionVerdict,
} from "@/lib/contest/executionService";
import { cn } from "@/lib/utils";

/**
 * Run / submit results for the active problem.
 *
 * The `hiddenEvaluated` flag is rendered explicitly. A run that never touched
 * the hidden set must never be mistaken for a graded submission, so this
 * surface says so in words rather than leaving the learner to infer it from an
 * empty or green-looking result.
 */

const VERDICT_STYLES: Record<ExecutionVerdict, string> = {
  accepted: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  wrong_answer: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  compile_error: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  runtime_error: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  time_limit_exceeded: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  memory_limit_exceeded: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  unavailable: "border-border bg-muted text-muted-foreground",
  rate_limited: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export function CodingExecutionPanel({
  busy,
  mode,
  onRun,
  onSubmit,
  result,
  disabled,
  supportsCustomInput,
}: {
  busy: boolean;
  mode: "run" | "submit" | null;
  onRun: () => void;
  onSubmit: () => void;
  result: ExecutionResult | null;
  disabled: boolean;
  supportsCustomInput: boolean;
}) {
  return (
    <section
      aria-label="Run and submit"
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Button size="sm" onClick={onRun} disabled={disabled || busy}>
          {busy && mode === "run" ? (
            <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          )}
          {busy && mode === "run" ? "Running…" : "Run code"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onSubmit} disabled={disabled || busy}>
          {busy && mode === "submit" ? (
            <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          )}
          {busy && mode === "submit" ? "Submitting…" : "Submit problem"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {busy ? `${mode === "run" ? "Running" : "Submitting"} in progress` : "Idle"}
        </span>
        {!supportsCustomInput ? (
          <span className="text-xs text-muted-foreground">
            Custom input is unavailable in this environment.
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {busy && !result ? (
          <div role="status" className="space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-muted/60" />
            <span className="sr-only">Waiting for the execution service…</span>
          </div>
        ) : null}

        {!busy && !result ? (
          <p className="text-sm text-muted-foreground">
            Run your code against the visible sample tests, or submit the problem
            to have it graded against the hidden test set.
          </p>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(VERDICT_STYLES[result.verdict])}>
                {EXECUTION_VERDICT_LABELS[result.verdict]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {result.passed} of {result.total} visible tests passed
              </span>
              {result.runtimeMs || result.memoryKb ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer aria-hidden="true" className="h-3 w-3" />
                  {result.runtimeMs} ms
                  {result.memoryKb ? ` · ${Math.round(result.memoryKb / 1024)} MB` : ""}
                </span>
              ) : null}
            </div>

            {result.mode === "development" ? (
              <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  Development execution adapter: your code was <strong>not</strong>{" "}
                  run, and the hidden test set was not evaluated. Nothing on this
                  panel reflects a graded result.
                </span>
              </p>
            ) : null}

            {result.compileDiagnostics.length ? (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compilation problems
                </h5>
                <ul className="mt-2 space-y-1.5">
                  {result.compileDiagnostics.map((diagnostic, index) => (
                    <li
                      key={`${diagnostic.line}-${index}`}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 font-mono text-xs"
                    >
                      <span className="text-muted-foreground">
                        line {diagnostic.line}
                        {diagnostic.column ? `:${diagnostic.column}` : ""}:{" "}
                      </span>
                      {diagnostic.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.stdout ? (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Output
                </h5>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
                  {result.stdout}
                </pre>
              </div>
            ) : null}

            {result.stderr ? (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Errors
                </h5>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs text-destructive">
                  {result.stderr}
                </pre>
              </div>
            ) : null}

            {result.testOutcomes.length ? (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Visible test results
                </h5>
                <ol className="mt-2 space-y-2">
                  {result.testOutcomes.map((outcome, index) => (
                    <li
                      key={outcome.caseId}
                      className="rounded-xl border border-border p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">Sample {index + 1}</span>
                        <Badge
                          variant="outline"
                          className={
                            outcome.passed
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {outcome.passed ? "Passed" : "Not evaluated"}
                        </Badge>
                      </div>
                      {outcome.expectedOutput ? (
                        <p className="mt-1.5 font-mono text-muted-foreground">
                          Expected: {outcome.expectedOutput}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
