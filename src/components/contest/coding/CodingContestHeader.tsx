import type { ReactNode, Ref } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { cn } from "@/lib/utils";
import { ContestClock } from "@/components/contest/coding/ContestClock";

/**
 * Coding contest header.
 *
 * One rounded bar of chrome across the top of the workspace, matching the
 * reference layout: a contest-set dropdown on the left, then the question list,
 * clock and finish controls on the right. The dropdown panel itself is rendered
 * by the caller and handed in as `questionMenu` so it can be anchored to this
 * trigger without prop-drilling every question through here.
 */

export function CodingContestHeader({
  remainingSeconds,
  warningCount,
  localMode,
  onFinish,
  onToggleList,
  listOpen,
  totalProblems,
  activeProblemIndex = 0,
  menuOpen,
  onMenuToggle,
  menuAnchorRef,
  questionMenu,
}: {
  remainingSeconds: number;
  warningCount: number;
  localMode: boolean;
  onFinish: () => void;
  onToggleList: () => void;
  listOpen: boolean;
  totalProblems: number;
  activeProblemIndex?: number;
  menuOpen: boolean;
  onMenuToggle: () => void;
  /** Anchors outside-click dismissal without the header owning that state. */
  menuAnchorRef?: Ref<HTMLDivElement>;
  questionMenu?: ReactNode;
}) {
  return (
    <header className="relative z-40 flex h-[60px] shrink-0 items-center justify-between gap-3 rounded-xl bg-surface-chrome pl-6 pr-5">
      {/* Contest set dropdown — a tab-like trigger with a primary underline. */}
      <div ref={menuAnchorRef} className="relative min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          className={cn(
            "flex h-9 max-w-[16rem] items-center gap-2 rounded-lg border-b-2 bg-surface-panel pl-4 pr-3 text-sm font-medium transition-colors",
            menuOpen
              ? "border-b-primary text-primary"
              : "border-b-primary/70 text-foreground hover:text-primary",
          )}
        >
          <span className="truncate">
            Contest set {activeProblemIndex + 1} / {totalProblems}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              menuOpen ? "rotate-180 text-primary" : "text-muted-foreground",
            )}
          />
        </button>
        {questionMenu}
      </div>

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
          <span
            title={`Focus warnings: ${warningCount} of ${MAX_EXAM_WARNINGS}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive"
          >
            <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
            {warningCount}/{MAX_EXAM_WARNINGS}
          </span>
        ) : null}

        {localMode ? (
          <span className="hidden h-9 items-center rounded-lg border border-amber-500/40 px-3 text-xs font-medium text-amber-700 md:inline-flex dark:text-amber-400">
            Dev Mode
          </span>
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
