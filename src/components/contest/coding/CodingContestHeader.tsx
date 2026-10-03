import {
  AlarmClock,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Columns2,
  Layers,
  LogOut,
  Maximize2,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTimerUrgency,
  type TimerUrgencyTone,
} from "@/lib/contest/config";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { formatExamTime } from "@/lib/formatTime";
import { cn } from "@/lib/utils";

/**
 * Coding contest header.
 *
 * Provides contest time tracking, problem fold/unfold trigger, problem switching,
 * layout toggles (Split/Editor/Problem), autosave state, and integrity warnings.
 */

const TONE_CLASSES: Record<TimerUrgencyTone, string> = {
  normal: "text-foreground",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

const TONE_ICONS: Record<TimerUrgencyTone, typeof Clock3> = {
  normal: Clock3,
  warn: AlertTriangle,
  danger: AlarmClock,
};

export function CodingContestHeader({
  remainingSeconds,
  submittedCount,
  totalProblems,
  saveStatus,
  warningCount,
  localMode,
  onFinish,
  onToggleProblems,
  problemsOpen,
  activeProblemIndex = 0,
  activeProblemTitle,
  onPrevProblem,
  onNextProblem,
  hasPrevProblem = false,
  hasNextProblem = false,
  viewMode = "split",
  onViewModeChange,
}: {
  remainingSeconds: number;
  submittedCount: number;
  totalProblems: number;
  saveStatus: string;
  warningCount: number;
  localMode: boolean;
  onFinish: () => void;
  onToggleProblems?: () => void;
  problemsOpen?: boolean;
  activeProblemIndex?: number;
  activeProblemTitle?: string;
  onPrevProblem?: () => void;
  onNextProblem?: () => void;
  hasPrevProblem?: boolean;
  hasNextProblem?: boolean;
  viewMode?: "split" | "editor" | "problem";
  onViewModeChange?: (mode: "split" | "editor" | "problem") => void;
}) {
  const urgency = getTimerUrgency(remainingSeconds);
  const tone: TimerUrgencyTone = urgency?.tone ?? "normal";
  const UrgencyIcon = TONE_ICONS[tone];

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border/80 bg-card/85 px-4 py-2 backdrop-blur-md">
      {/* Left side: Fold/Unfold Problems slider trigger, problem steppers, and contest title */}
      <div className="flex min-w-0 items-center gap-2">
        {onToggleProblems ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleProblems}
            aria-expanded={problemsOpen}
            aria-label="Toggle problems slider"
            className={cn(
              "h-8 gap-1.5 rounded-xl border-border/80 px-2.5 text-xs font-medium transition-all shadow-xs",
              problemsOpen
                ? "border-primary/50 bg-primary/10 text-primary"
                : "bg-muted/30 hover:border-primary/40 hover:bg-muted/60",
            )}
          >
            <Layers aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            <span>Problems</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {activeProblemIndex + 1}/{totalProblems}
            </span>
            {problemsOpen ? (
              <ChevronLeft aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        ) : null}

        {/* Quick previous/next stepper buttons */}
        {onPrevProblem && onNextProblem ? (
          <div className="hidden sm:flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/20 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              disabled={!hasPrevProblem}
              onClick={onPrevProblem}
              title="Previous problem"
            >
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              disabled={!hasNextProblem}
              onClick={onNextProblem}
              title="Next problem"
            >
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-2 pl-1">
          <h1 className="truncate font-display text-sm font-bold tracking-tight text-foreground">
            Java Coding Contest
          </h1>
          <Badge variant="secondary" className="font-normal text-[11px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
            <Code2 aria-hidden="true" className="mr-1 h-3 w-3" />
            Java
          </Badge>
          {localMode ? (
            <Badge variant="outline" className="hidden md:inline-flex border-amber-500/50 text-[10px] text-amber-700 dark:text-amber-400">
              Dev Mode
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Center: Layout View Mode Switcher (Split, Full Problem, Full Editor) */}
      {onViewModeChange ? (
        <div className="hidden lg:flex items-center gap-1 rounded-xl border border-border/60 bg-muted/25 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("split")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              viewMode === "split"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Split view (Problem statement and Code editor side-by-side)"
          >
            <Columns2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("problem")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              viewMode === "problem"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Expand problem statement to full screen"
          >
            <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Problem Only</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("editor")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              viewMode === "editor"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Expand code editor and test runner to full screen"
          >
            <Code2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Editor Only</span>
          </button>
        </div>
      ) : null}

      {/* Right side: Timer, autosave, focus warnings, and finish button */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* Urgency-styled Timer Pill */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-1 transition-all shadow-xs",
            tone === "danger"
              ? "border-destructive/60 bg-destructive/15 text-destructive animate-pulse"
              : tone === "warn"
              ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "border-border/80 bg-background/80 text-foreground",
          )}
        >
          <UrgencyIcon
            aria-hidden="true"
            className={cn("h-4 w-4 shrink-0", TONE_CLASSES[tone])}
          />
          <span
            role="timer"
            aria-label="Time remaining"
            className={cn(
              "font-mono text-sm font-bold tabular-nums tracking-wide",
              TONE_CLASSES[tone],
            )}
          >
            {formatExamTime(remainingSeconds)}
          </span>
          {urgency ? (
            <span className={cn("text-xs font-medium", TONE_CLASSES[tone])}>
              {urgency.label}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground hidden sm:inline">Time remaining</span>
          )}
        </div>

        {/* Submitted count badge */}
        <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
          {submittedCount} of {totalProblems} submitted
        </span>

        {/* Auto-save status */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
          {saveStatus}
        </span>

        {/* Warning Badge */}
        {warningCount > 0 ? (
          <Badge
            variant="outline"
            className="border-destructive/40 bg-destructive/10 text-destructive text-xs"
          >
            <ShieldAlert aria-hidden="true" className="mr-1 h-3 w-3" />
            Warnings {warningCount}/{MAX_EXAM_WARNINGS}
          </Badge>
        ) : null}

        {/* Finish Contest Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onFinish}
          className="h-8 rounded-xl border-border/80 text-xs font-medium hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors shadow-xs"
        >
          <LogOut aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          Finish Contest
        </Button>
      </div>
    </header>
  );
}
