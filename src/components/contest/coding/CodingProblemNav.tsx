import { cn } from "@/lib/utils";
import { CodingDifficultyBadge } from "@/components/contest/coding/CodingProblemPanel";
import type { PublicCodingProblem } from "@/lib/contest/types";

/**
 * Per-problem navigation for the coding workspace.
 *
 * Every state is carried by a TEXT label as well as a colour, because colour
 * alone is not an accessible signal and the statuses differ in a way the user
 * genuinely needs to read.
 */

export const PROBLEM_STATE_LABELS = [
  "Not visited",
  "Viewed",
  "Code edited",
  "Run attempted",
  "Visible tests passed",
  "Submitted",
] as const;

export type ProblemState = (typeof PROBLEM_STATE_LABELS)[number];

export const PROBLEM_STATE_STYLES: Record<ProblemState, string> = {
  "Not visited": "border-border text-muted-foreground",
  Viewed: "border-border text-foreground",
  "Code edited": "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Run attempted": "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "Visible tests passed": "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Submitted: "border-primary/50 bg-primary/10 text-primary",
};

export interface ProblemNavEntry {
  problem: PublicCodingProblem;
  index: number;
  state: ProblemState;
}

export function CodingProblemNav({
  entries,
  activeId,
  onSelect,
  disabled,
}: {
  entries: ProblemNavEntry[];
  activeId: string;
  onSelect: (problemId: string) => void;
  disabled: boolean;
}) {
  return (
    <nav aria-label="Assigned problems">
      <ul className="space-y-2">
        {entries.map((entry) => {
          const isActive = entry.problem.id === activeId;
          return (
            <li key={entry.problem.id}>
              <button
                type="button"
                aria-current={isActive ? "step" : undefined}
                aria-label={`Problem ${entry.index + 1}: ${entry.problem.title}. ${entry.state}`}
                onClick={() => onSelect(entry.problem.id)}
                disabled={disabled}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Problem {entry.index + 1}
                  </span>
                  <CodingDifficultyBadge difficulty={entry.problem.difficulty} />
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-medium">
                  {entry.problem.title}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                    PROBLEM_STATE_STYLES[entry.state],
                  )}
                >
                  {entry.state}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
