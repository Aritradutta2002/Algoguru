import type { ReactNode, Ref } from "react";
import {
  AlarmClock,
  AlertTriangle,
  ChevronDown,
  Clock3,
  List,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTimerUrgency,
  type TimerUrgencyTone,
} from "@/lib/contest/config";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { formatContestClock } from "@/lib/formatTime";
import { cn } from "@/lib/utils";

/**
 * Coding contest header.
 *
 * Three things only, matching the contest reference layout: a contest-set
 * dropdown on the left, and the question list / clock / finish controls on the
 * right. The dropdown panel itself is rendered by the caller and handed in as
 * `questionMenu` so it can be anchored to this trigger without prop-drilling
 * every question through here.
 */

const TONE_PILL_CLASSES: Record<TimerUrgencyTone, string> = {
  normal: "border-border/60 bg-muted/50 text-foreground",
  warn: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "border-destructive/60 bg-destructive/15 text-destructive",
};

const TONE_ICONS: Record<TimerUrgencyTone, typeof Clock3> = {
  normal: Clock3,
  warn: AlertTriangle,
  danger: AlarmClock,
};

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
  const urgency = getTimerUrgency(remainingSeconds);
  const tone: TimerUrgencyTone = urgency?.tone ?? "normal";
  const UrgencyIcon = TONE_ICONS[tone];

  return (
    <header className="relative z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background px-3 py-2.5">
      {/* Contest set dropdown */}
      <div ref={menuAnchorRef} className="relative min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          className={cn(
            "flex h-8 max-w-[16rem] items-center gap-1.5 rounded-lg border border-b-2 bg-card px-3 text-xs font-medium shadow-xs transition-colors",
            menuOpen
              ? "border-primary/70 text-primary"
              : "border-b-primary/70 border-border/70 text-foreground hover:border-primary/40",
          )}
        >
          <span className="truncate">
            Contest set {activeProblemIndex + 1} / {totalProblems}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </button>
        {questionMenu}
      </div>

      {/* Question list, clock, warnings, finish */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onToggleList}
          aria-pressed={listOpen}
          aria-label={listOpen ? "Hide question list" : "Show question list"}
          className={cn(
            "h-8 gap-1.5 rounded-lg px-3 text-xs font-medium",
            listOpen
              ? "bg-primary/15 text-primary hover:bg-primary/20"
              : "bg-muted/70 text-foreground hover:bg-muted",
          )}
        >
          <List aria-hidden="true" className="h-3.5 w-3.5" />
          <span>List</span>
        </Button>

        <div
          className={cn(
            "flex h-8 items-center gap-2 rounded-lg border px-3",
            TONE_PILL_CLASSES[tone],
          )}
        >
          <UrgencyIcon
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0",
              tone === "normal" && "text-primary",
            )}
          />
          <span
            role="timer"
            aria-label="Time remaining"
            className="font-mono text-sm font-bold tabular-nums tracking-wide"
          >
            {formatContestClock(remainingSeconds)}
          </span>
          {/* Urgency is announced in words so it never depends on colour alone. */}
          <span className="sr-only">
            {urgency ? urgency.label : "Time remaining"}
          </span>
        </div>

        {warningCount > 0 ? (
          <span
            title={`Focus warnings: ${warningCount} of ${MAX_EXAM_WARNINGS}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 text-xs font-medium text-destructive"
          >
            <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
            {warningCount}/{MAX_EXAM_WARNINGS}
          </span>
        ) : null}

        {localMode ? (
          <span className="hidden rounded-lg border border-amber-500/40 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 md:inline-flex">
            Dev Mode
          </span>
        ) : null}

        <Button
          type="button"
          size="sm"
          onClick={onFinish}
          aria-label="Finish Contest"
          className="h-8 rounded-lg px-4 text-xs font-semibold"
        >
          Finish
        </Button>
      </div>
    </header>
  );
}
