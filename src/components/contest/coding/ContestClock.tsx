import {
  AlarmClock,
  AlertTriangle,
  Clock3,
  type LucideIcon,
} from "lucide-react";
import {
  getTimerUrgency,
  type TimerUrgencyTone,
} from "@/lib/contest/config";
import { formatContestClock } from "@/lib/formatTime";
import { cn } from "@/lib/utils";

/**
 * The contest countdown.
 *
 * Shared by the workspace header and the editor's full-screen strip, so the
 * clock a learner sees when the chrome is hidden is exactly the clock they see
 * when it is not — same urgency tone, same `role="timer"`, and the same spoken
 * urgency label so urgency is never carried by colour alone.
 */

const TONE_PILL_CLASSES: Record<TimerUrgencyTone, string> = {
  normal: "bg-surface-panel text-foreground",
  warn: "bg-surface-panel text-amber-600 ring-1 ring-inset ring-amber-500/40 dark:text-amber-400",
  danger: "bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/50",
};

const TONE_ICON_CLASSES: Record<TimerUrgencyTone, string> = {
  normal: "text-primary",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

const TONE_ICONS: Record<TimerUrgencyTone, LucideIcon> = {
  normal: Clock3,
  warn: AlertTriangle,
  danger: AlarmClock,
};

export function ContestClock({
  remainingSeconds,
  className,
}: {
  remainingSeconds: number;
  className?: string;
}) {
  const urgency = getTimerUrgency(remainingSeconds);
  const tone: TimerUrgencyTone = urgency?.tone ?? "normal";
  const UrgencyIcon = TONE_ICONS[tone];

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg px-4",
        TONE_PILL_CLASSES[tone],
        className,
      )}
    >
      <UrgencyIcon
        aria-hidden="true"
        className={cn("h-4 w-4 shrink-0", TONE_ICON_CLASSES[tone])}
      />
      <span
        role="timer"
        aria-label="Time remaining"
        className="font-mono text-sm font-bold tabular-nums tracking-wide"
      >
        {formatContestClock(remainingSeconds)}
      </span>
      <span className="sr-only">{urgency ? urgency.label : "Time remaining"}</span>
    </div>
  );
}
