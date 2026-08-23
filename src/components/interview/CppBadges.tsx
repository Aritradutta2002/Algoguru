import { cn } from "@/lib/utils";
import type { Difficulty, InterviewPriority } from "@/data/cppInterviewMetadata";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-success/10 text-success border-success/25",
  medium: "bg-warning/10 text-warning border-warning/25",
  hard: "bg-destructive/10 text-destructive border-destructive/25",
};

export function CppDifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-mono", DIFFICULTY_STYLES[difficulty], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {difficulty}
    </span>
  );
}

const PRIORITY_STYLES: Record<InterviewPriority, string> = {
  "very-high": "bg-primary/10 text-primary border-primary/25",
  high: "bg-warning/10 text-warning border-warning/25",
  medium: "bg-info/10 text-info border-info/25",
  low: "bg-muted text-muted-foreground border-border/40",
};
const PRIORITY_LABELS: Record<InterviewPriority, string> = {
  "very-high": "Very High Priority",
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};
export function CppPriorityBadge({ priority, className }: { priority: InterviewPriority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-mono", PRIORITY_STYLES[priority], className)}>
      {(priority === "very-high" || priority === "high") && <span aria-hidden="true">🔥</span>}
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
export function CppVersionBadge({ version, className }: { version: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-mono bg-info/10 text-info border-info/25", className)}>
      {version}
    </span>
  );
}
