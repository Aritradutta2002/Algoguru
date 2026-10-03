import { AlertTriangle, CheckCircle2, ChevronRight, Cpu, Loader2, PlayCircle, Send, Terminal, Timer, XCircle } from "lucide-react";
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
  accepted: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
  wrong_answer: "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold",
  compile_error: "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold",
  runtime_error: "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold",
  time_limit_exceeded: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",
  memory_limit_exceeded: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",
  unavailable: "border-border bg-muted text-muted-foreground",
  rate_limited: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",
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
      className="flex h-full min-h-0 flex-col bg-background"
    >
      {/* Execution Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/20 px-3.5 py-2">
        <div className="flex items-center gap-2">
          {/* Run Code Button */}
          <Button
            size="sm"
            onClick={onRun}
            disabled={disabled || busy}
            className="h-8 gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-xs font-semibold text-foreground shadow-2xs hover:border-primary/50 hover:bg-muted/80 transition-all"
          >
            {busy && mode === "run" ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <PlayCircle aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{busy && mode === "run" ? "Running…" : "Run code"}</span>
          </Button>

          {/* Submit Problem Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={onSubmit}
            disabled={disabled || busy}
            className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs hover:shadow-primary/10 transition-all"
          >
            {busy && mode === "submit" ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>{busy && mode === "submit" ? "Submitting…" : "Submit problem"}</span>
          </Button>

          <span aria-live="polite" className="sr-only">
            {busy ? `${mode === "run" ? "Running" : "Submitting"} in progress` : "Idle"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!supportsCustomInput ? (
            <span className="hidden md:inline text-[11px]">
              Custom input unavailable.
            </span>
          ) : null}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Terminal className="h-3 w-3" />
            <span>Console</span>
          </div>
        </div>
      </div>

      {/* Execution Output Viewport */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {busy && !result ? (
          <div role="status" className="space-y-3 p-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">
                {mode === "run" ? "Compiling and executing against sample tests…" : "Evaluating solution against hidden test suite…"}
              </span>
            </div>
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-muted/40" />
            <span className="sr-only">Waiting for the execution service…</span>
          </div>
        ) : null}

        {!busy && !result ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Terminal className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground/80">Ready to test</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Run your code against the visible sample tests, or submit the problem
              to have it graded against the hidden test set.
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            {/* Verdict Card */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("text-xs px-2.5 py-0.5 rounded-lg", VERDICT_STYLES[result.verdict])}>
                  {EXECUTION_VERDICT_LABELS[result.verdict]}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground font-medium">
                  {result.passed} of {result.total} visible tests passed
                </span>
              </div>

              {result.runtimeMs || result.memoryKb ? (
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Timer aria-hidden="true" className="h-3 w-3" />
                    {result.runtimeMs} ms
                  </span>
                  {result.memoryKb ? (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {Math.round(result.memoryKb / 1024)} MB
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            {result.mode === "development" ? (
              <p className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-300">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Development execution adapter: your code was <strong>not</strong>{" "}
                  run, and the hidden test set was not evaluated. Nothing on this
                  panel reflects a graded result.
                </span>
              </p>
            ) : null}

            {/* Compilation Diagnostics */}
            {result.compileDiagnostics.length ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
                <h5 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Compilation problems
                </h5>
                <ul className="mt-2.5 space-y-2">
                  {result.compileDiagnostics.map((diagnostic, index) => (
                    <li
                      key={`${diagnostic.line}-${index}`}
                      className="rounded-lg border border-rose-500/20 bg-background/80 p-2.5 font-mono text-xs"
                    >
                      <span className="text-muted-foreground font-semibold">
                        line {diagnostic.line}
                        {diagnostic.column ? `:${diagnostic.column}` : ""}:{" "}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">{diagnostic.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Standard Output */}
            {result.stdout ? (
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Output
                </h5>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background/90 p-3 font-mono text-xs text-foreground">
                  {result.stdout}
                </pre>
              </div>
            ) : null}

            {/* Standard Error */}
            {result.stderr ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Errors
                </h5>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-destructive/30 bg-background/90 p-3 font-mono text-xs text-destructive">
                  {result.stderr}
                </pre>
              </div>
            ) : null}

            {/* Visible Test Case Outcomes */}
            {result.testOutcomes.length ? (
              <div className="rounded-2xl border border-border/80 bg-muted/15 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Visible test results
                </h5>
                <ol className="mt-3 space-y-2">
                  {result.testOutcomes.map((outcome, index) => (
                    <li
                      key={outcome.caseId}
                      className={cn(
                        "rounded-xl border p-3 text-xs transition-colors",
                        outcome.passed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border/80 bg-background/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-medium">Sample {index + 1}</span>
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
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                          Expected: <span className="text-foreground">{outcome.expectedOutput}</span>
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
