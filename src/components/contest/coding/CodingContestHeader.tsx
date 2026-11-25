"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { cn } from "@/lib/utils";
import { ContestClock } from "@/components/contest/coding/ContestClock";

/**
 * Coding contest header.
 *
 * One rounded bar of chrome across the top of the workspace, matching the
 * reference layout: a contest-set dropdown on the left, then the question list,
 * clock and finish controls on the right. The caller renders the dropdown as
 * `questionMenu` so its trigger and portaled panel share one Radix root.
 */

export function CodingContestHeader({
  remainingSeconds,
  warningCount,
  localMode,
  onFinish,
  onToggleList,
  listOpen,
  questionMenu,
}: {
  remainingSeconds: number;
  warningCount: number;
  localMode: boolean;
  onFinish: () => void;
  onToggleList: () => void;
  listOpen: boolean;
  questionMenu?: ReactNode;
}) {
  return (
    <header className="relative z-40 flex h-[60px] shrink-0 items-center justify-between gap-3 rounded-xl bg-surface-chrome pl-6 pr-5">
      {/* Contest set dropdown — a tab-like trigger with a primary underline. */}
      <div className="relative min-w-0">{questionMenu}</div>

      {/* Question list, clock, warnings, finish */}
      <div className="flex shrink-0 items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={onToggleList}
          aria-pressed={listOpen}
          aria-label={listOpen ? "Hide question list" : "Show question list"}
          className={cn(
            "h-9 rounded-lg px-4 text-sm font-medium",
            listOpen
              ? "bg-primary/15 text-primary hover:bg-primary/20"
              : "bg-surface-raised text-foreground hover:bg-surface-raised/80",
          )}
        >
          List
        </Button>

        <ContestClock remainingSeconds={remainingSeconds} />

        {warningCount > 0 ? (
          <Badge
            variant="outline"
            title={`Focus warnings: ${warningCount} of ${MAX_EXAM_WARNINGS}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive"
          >
            <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
            {warningCount}/{MAX_EXAM_WARNINGS}
          </Badge>
        ) : null}

        {localMode ? (
          <Badge
            variant="outline"
            className="hidden h-9 items-center rounded-lg border-amber-500/40 px-3 text-xs font-medium text-amber-700 md:inline-flex dark:text-amber-400"
          >
            Dev Mode
          </Badge>
        ) : null}

        <Button
          type="button"
          size="sm"
          onClick={onFinish}
          aria-label="Finish Contest"
          className="h-9 rounded-lg px-5 text-sm font-semibold"
        >
          Finish
        </Button>
      </div>
    </header>
  );
}
