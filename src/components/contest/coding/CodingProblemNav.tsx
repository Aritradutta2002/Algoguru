import { CheckCircle2, ChevronLeft, Circle, Code2, Edit3, Eye, Layers, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CodingDifficultyBadge } from "@/components/contest/coding/CodingProblemPanel";
import type { PublicCodingProblem } from "@/lib/contest/types";
import { cn } from "@/lib/utils";

/**
 * Per-problem navigation for the coding workspace.
 *
 * Implemented as a fold/unfold sliding drawer so learners get a full-screen view
 * of the problem statement and code editor without side columns stealing width.
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
  "Not visited": "border-border text-muted-foreground bg-muted/20",
  Viewed: "border-border text-foreground bg-muted/40",
  "Code edited": "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Run attempted": "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "Visible tests passed": "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Submitted: "border-primary/50 bg-primary/10 text-primary font-semibold",
};

const STATE_ICONS: Record<ProblemState, typeof Circle> = {
  "Not visited": Circle,
  Viewed: Eye,
  "Code edited": Edit3,
  "Run attempted": PlayCircle,
  "Visible tests passed": CheckCircle2,
  Submitted: CheckCircle2,
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
  isOpen = false,
  onClose,
}: {
  entries: ProblemNavEntry[];
  activeId: string;
  onSelect: (problemId: string) => void;
  disabled: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const solvedCount = entries.filter((e) => e.state === "Submitted").length;
  const progressPercent = entries.length > 0 ? Math.round((solvedCount / entries.length) * 100) : 0;

  return (
    <>
      {/* Dimmed backdrop overlay when slider is open */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Slide-out problem navigation drawer */}
      <aside
        aria-label="Contest problems slider"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 sm:w-96 flex-col border-r border-border bg-card/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/80 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">
                Contest Problems
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {solvedCount} of {entries.length} solved
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            <span>Fold</span>
          </Button>
        </div>

        {/* Progress bar inside slider */}
        <div className="border-b border-border/40 bg-muted/15 px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Overall Progress</span>
            <span className="font-mono font-medium">{progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Accessible Problems Navigation List */}
        <nav aria-label="Assigned problems" className="flex-1 overflow-y-auto p-3.5">
          <ul className="space-y-2.5">
            {entries.map((entry) => {
              const isActive = entry.problem.id === activeId;
              const StateIcon = STATE_ICONS[entry.state];

              return (
                <li key={entry.problem.id}>
                  <button
                    type="button"
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Problem ${entry.index + 1}: ${entry.problem.title}. ${entry.state}`}
                    onClick={() => {
                      onSelect(entry.problem.id);
                      onClose?.();
                    }}
                    disabled={disabled}
                    className={cn(
                      "group relative w-full rounded-2xl border p-3.5 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary"
                      />
                    ) : null}

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        Problem {entry.index + 1}
                      </span>
                      <CodingDifficultyBadge difficulty={entry.problem.difficulty} />
                    </div>

                    <p className="mt-1.5 line-clamp-1 font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {entry.problem.title}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium",
                          PROBLEM_STATE_STYLES[entry.state],
                        )}
                      >
                        <StateIcon aria-hidden="true" className="h-3 w-3 shrink-0" />
                        {entry.state}
                      </span>

                      <span className="text-[11px] text-muted-foreground font-mono">
                        {entry.problem.timeLimitMs}ms
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer inside slider */}
        <div className="border-t border-border/80 bg-muted/15 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Select any problem to load its description & workspace.
          </p>
        </div>
      </aside>
    </>
  );
}
