import { AlertTriangle, CloudOff } from "lucide-react";

/**
 * Persistent, non-dismissible banner for a contest that is not backed by the
 * authoritative server session service.
 *
 * This is the honesty surface for the local adapter: the contest still works
 * end to end, but the banner states plainly that the session lives in this
 * browser, that no hidden tests run, and that the score means nothing. It is
 * never auto-dismissed, because a non-authoritative exam that hides its own
 * status would be worse than no exam.
 */
export function ContestModeNotice({
  reason,
  onRetry,
  retrying,
}: {
  /** Why the authoritative backend is not in use, if known. */
  reason?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Development mode — not authoritative</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          {reason ?? "The contest session service is not reachable."} Your
          contest, code and results are stored in this browser only. Hidden
          tests do not run, so no score from this session counts.
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:text-amber-400"
        >
          <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />
          {retrying ? "Checking…" : "Retry backend"}
        </button>
      ) : null}
    </div>
  );
}
