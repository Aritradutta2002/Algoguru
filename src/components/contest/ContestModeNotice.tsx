"use client";

import { AlertTriangle, CloudOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <Alert
      role="status"
      aria-live="polite"
      className="rounded-2xl border-amber-500/40 bg-amber-500/10 text-foreground [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
    >
      <AlertTriangle aria-hidden="true" className="h-4 w-4" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle className="font-medium leading-snug">
            Development mode — not authoritative
          </AlertTitle>
          <AlertDescription className="mt-1 text-muted-foreground">
            {reason ?? "The contest session service is not reachable."} Your
            contest, code and results are stored in this browser only. You can
            compile and run your code against each problem&apos;s visible sample
            tests, but hidden tests do not run, so no score from this session
            counts.
          </AlertDescription>
        </div>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            className="h-8 shrink-0 border-amber-500/50 bg-transparent text-xs font-medium text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
          >
            <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />
            {retrying ? "Checking…" : "Retry backend"}
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
