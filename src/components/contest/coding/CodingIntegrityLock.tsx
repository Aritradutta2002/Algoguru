"use client";

import { useRef } from "react";
import { Loader2, Lock, Maximize, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const returnButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <AlertDialog open>
      <AlertDialogContent
        aria-modal="true"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current = document.activeElement as HTMLElement | null;
          returnButtonRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
          returnFocusRef.current = null;
        }}
        className="grid max-w-lg grid-cols-1 gap-0 rounded-[0.875rem] border-obsidian-border bg-obsidian-pane p-0 shadow-xl"
      >
        <div className="p-6 pb-4 sm:p-7 sm:pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldAlert aria-hidden="true" className="h-5 w-5 text-destructive" />
            </span>
            <div>
              <AlertDialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Exam focus warning
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground">
                Exam focus warnings: {warningCount} of {MAX_EXAM_WARNINGS}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-4 sm:px-7">
          <AlertDialogDescription className="text-sm leading-relaxed text-foreground">
            {reason}
          </AlertDialogDescription>

          <Alert
            role="note"
            className="rounded-lg border-obsidian-border bg-obsidian-elevated p-4 text-sm [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-muted-foreground"
          >
            <Lock aria-hidden="true" className="h-4 w-4" />
            <AlertDescription className="text-sm text-foreground">
              The workspace is locked. Your code for every problem is saved, but
              editing and running are paused. <strong>The timer keeps running.</strong>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            {remaining > 0
              ? `${remaining} more warning${remaining === 1 ? "" : "s"} and the contest will be submitted automatically.`
              : "This was the final warning. The contest is being submitted."}
          </p>
        </div>

        <div className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          <AlertDialogAction asChild>
            <Button
              ref={returnButtonRef}
              size="lg"
              className="w-full"
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
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
