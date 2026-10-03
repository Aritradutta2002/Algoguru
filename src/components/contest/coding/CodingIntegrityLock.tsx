import { Loader2, Lock, Maximize, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";

/**
 * Exam-integrity lock.
 *
 * Shown whenever the workspace detects a fullscreen exit, tab switch or window
 * blur. The timer keeps running behind it and the learner's code is preserved
 * — only editing and execution are suspended. Deliberately offers no dismiss
 * or escape action: the only way out is to actually return to fullscreen.
 */
export function CodingIntegrityLock({
  reason,
  warningCount,
  returning,
  onReturnToFullscreen,
}: {
  reason: string;
  warningCount: number;
  returning: boolean;
  onReturnToFullscreen: () => void;
}) {
  const remaining = Math.max(0, MAX_EXAM_WARNINGS - warningCount);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="coding-integrity-title"
      aria-describedby="coding-integrity-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldAlert aria-hidden="true" className="h-5 w-5 text-destructive" />
          </span>
          <div>
            <h2
              id="coding-integrity-title"
              className="font-display text-lg font-semibold tracking-tight"
            >
              Exam focus warning
            </h2>
            <p className="text-xs text-muted-foreground">
              Exam focus warnings: {warningCount} of {MAX_EXAM_WARNINGS}
            </p>
          </div>
        </div>

        <p id="coding-integrity-description" className="mt-5 text-sm leading-relaxed">
          {reason}
        </p>

        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <p className="flex items-start gap-2">
            <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              The workspace is locked. Your code for every problem is saved, but
              editing and running are paused. <strong>The timer keeps running.</strong>
            </span>
          </p>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {remaining > 0
            ? `${remaining} more warning${remaining === 1 ? "" : "s"} and the contest will be submitted automatically.`
            : "This was the final warning. The contest is being submitted."}
        </p>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={onReturnToFullscreen}
          disabled={returning}
        >
          {returning ? (
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Maximize aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          {returning ? "Returning to fullscreen…" : "Return to fullscreen"}
        </Button>
      </div>
    </div>
  );
}
