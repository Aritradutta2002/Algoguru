import {
  AlarmClock,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Code2,
  LogOut,
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
 * Urgency is signalled with an icon AND a text label at each level, never with
 * colour alone — a learner who cannot distinguish the red shades still gets the
 * same information from the words.
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
}: {
  remainingSeconds: number;
  submittedCount: number;
  totalProblems: number;
  saveStatus: string;
  warningCount: number;
  localMode: boolean;
  onFinish: () => void;
}) {
  const urgency = getTimerUrgency(remainingSeconds);
  const tone: TimerUrgencyTone = urgency?.tone ?? "normal";
  const UrgencyIcon = TONE_ICONS[tone];

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate font-display text-base font-semibold tracking-tight">
          Java Coding Contest
        </h1>
        <Badge variant="secondary" className="font-normal">
          <Code2 aria-hidden="true" className="mr-1 h-3 w-3" />
          Java
        </Badge>
        {localMode ? (
          <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
            Development mode
          </Badge>
        ) : null}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <UrgencyIcon
            aria-hidden="true"
            className={cn("h-4 w-4", TONE_CLASSES[tone])}
          />
          <span
            role="timer"
            aria-label="Time remaining"
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
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
            <span className="text-xs text-muted-foreground">Time remaining</span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          {submittedCount} of {totalProblems} submitted
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer aria-hidden="true" className="h-3.5 w-3.5" />
          {saveStatus}
        </span>

        {warningCount > 0 ? (
          <Badge
            variant="outline"
            className="border-destructive/40 text-destructive"
          >
            <ShieldAlert aria-hidden="true" className="mr-1 h-3 w-3" />
            Warnings {warningCount}/{MAX_EXAM_WARNINGS}
          </Badge>
        ) : null}

        <Button size="sm" variant="outline" onClick={onFinish}>
          <LogOut aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          Finish Contest
        </Button>
      </div>
    </header>
  );
}
