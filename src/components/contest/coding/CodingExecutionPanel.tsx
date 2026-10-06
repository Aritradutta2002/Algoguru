import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  Loader2,
  Terminal,
  Timer,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EXECUTION_VERDICT_LABELS } from "@/lib/contest/executionService";
import type {
  ExecutionResult,
  ExecutionVerdict,
} from "@/lib/contest/executionService";
import { cn } from "@/lib/utils";

/**
 * Test-case console for the active question.
 *
 * The `hiddenEvaluated` flag and the `Hidden` tab are rendered explicitly. A run
 * that never touched the hidden set must never be mistaken for a graded
 * submission, so this surface says so in words rather than leaving the learner
 * to infer it from an empty or green-looking result.
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
  result,
  supportsCustomInput,
  collapsed,
  onCollapsedChange,
}: {
  busy: boolean;
  mode: "run" | "submit" | null;
  result: ExecutionResult | null;
  supportsCustomInput: boolean;
  /** Driven by the parent panel, so the drawer and the splitter never disagree. */
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const [scope, setScope] = useState<"sample" | "hidden">("sample");

  return (
    <section
      aria-label="Test cases and results"
      className="flex h-full min-h-0 flex-col bg-surface-panel"
    >
      {/* Console header: Test Case ›  Sample | Hidden */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-surface-line bg-surface-chrome px-4">
        <span className="flex items-center gap-1.5 text-sm text-foreground/70">
          Test Case
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        </span>

        <div role="tablist" aria-label="Result scope" className="flex items-center gap-3">
          {(["sample", "hidden"] as const).map((id, index) => (
            <span key={id} className="flex items-center gap-3">
              {index > 0 ? (
                <span aria-hidden="true" className="h-4 w-px bg-surface-line" />
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={scope === id}
                onClick={() => setScope(id)}
                className={cn(
                  "py-1 text-sm font-medium capitalize transition-colors",
                  scope === id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {id}
              </button>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand results" : "Collapse results"}
          title={collapsed ? "Expand results" : "Collapse results"}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          {collapsed ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>

      {collapsed ? null : (
        <div
          role="tabpanel"
          aria-label={`${scope} results`}
          className="min-h-0 flex-1 overflow-y-auto bg-surface-panel p-4"
        >
          {scope === "hidden" ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <Terminal
                aria-hidden="true"
                className="h-7 w-7 text-muted-foreground/40"
              />
              <p className="text-sm font-medium text-foreground/80">
                Hidden tests are never shown
              </p>
              <p className="max-w-md text-xs text-muted-foreground">
                The hidden test inputs and expected outputs stay on the server so
                they cannot be read out of the page. Submit the question to be
                graded against them.
              </p>
            </div>
          ) : (
            <SampleResults
              busy={busy}
              mode={mode}
              result={result}
              supportsCustomInput={supportsCustomInput}
            />
          )}
        </div>
      )}
    </section>
  );
}

function SampleResults({
  busy,
  mode,
  result,
  supportsCustomInput,
}: {
  busy: boolean;
  mode: "run" | "submit" | null;
  result: ExecutionResult | null;
  supportsCustomInput: boolean;
}) {
  if (busy && !result) {
    return (
      <div role="status" className="space-y-3 p-1">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-foreground">
            {mode === "run"
              ? "Compiling and executing against sample tests…"
              : "Evaluating solution against hidden test suite…"}
          </span>
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-muted/40" />
        <span className="sr-only">Waiting for the execution service…</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
        <Terminal aria-hidden="true" className="mb-2 h-7 w-7 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground/80">Ready to test</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          Run your code against the visible sample tests, or submit the question
          to have it graded against the hidden test set.
          {!supportsCustomInput
            ? " Typing your own input is not available in this contest."
            : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2 py-0.5 text-xs",
              VERDICT_STYLES[result.verdict],
            )}
          >
            {EXECUTION_VERDICT_LABELS[result.verdict]}
          </Badge>
          <span className="font-mono text-xs font-medium text-muted-foreground">
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
                  <Cpu aria-hidden="true" className="h-3 w-3" />
                  {Math.round(result.memoryKb / 1024)} MB
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {result.mode === "development" ? (
        <p className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-300">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <span>
            Development execution adapter: your code was <strong>not</strong>{" "}
            run, and the hidden test set was not evaluated. Nothing on this
            panel reflects a graded result.
          </span>
        </p>
      ) : null}

      {result.compileDiagnostics.length ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
            Compilation problems
          </h4>
          <ul className="mt-2 space-y-1.5">
            {result.compileDiagnostics.map((diagnostic, index) => (
              <li
                key={`${diagnostic.line}-${index}`}
                className="rounded-md border border-rose-500/20 bg-background/80 p-2 font-mono text-xs"
              >
                <span className="font-semibold text-muted-foreground">
                  line {diagnostic.line}
                  {diagnostic.column ? `:${diagnostic.column}` : ""}:{" "}
                </span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {diagnostic.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.stdout ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </h4>
          <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 p-3 font-mono text-xs text-foreground">
            {result.stdout}
          </pre>
        </div>
      ) : null}

      {result.stderr ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Errors
          </h4>
          <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">
            {result.stderr}
          </pre>
        </div>
      ) : null}

      {result.testOutcomes.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sample test results
          </h4>
          <ol className="mt-2 space-y-1.5">
            {result.testOutcomes.map((outcome, index) => (
              <li
                key={outcome.caseId}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  outcome.passed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/70 bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-medium">Sample {index + 1}</span>
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 font-medium",
                      outcome.passed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {outcome.passed ? "Passed" : "Not evaluated"}
                  </span>
                </div>
                {outcome.expectedOutput ? (
                  <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                    Expected: <span className="text-foreground">{outcome.expectedOutput}</span>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
