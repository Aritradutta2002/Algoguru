import { Button } from "@/components/ui/button";
import { CODING_PROBLEM_POINTS } from "@/lib/contest/config";
import { cn } from "@/lib/utils";
import {
  isProblemStarted,
  type ProblemNavEntry,
} from "@/components/contest/coding/problemState";

/**
 * Full-screen question list for the contest set.
 *
 * Covers the workspace area only, so the header — clock and Finish — stays
 * reachable, exactly like the reference layout. Dismissed with the floating
 * close control; the header's "List" button does the same thing.
 */

export function CodingQuestionList({
  entries,
  activeId,
  onSelect,
  disabled,
  isOpen,
  onClose,
}: {
  entries: ProblemNavEntry[];
  activeId: string;
  onSelect: (problemId: string) => void;
  disabled: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "absolute inset-0 z-40 flex flex-col rounded-xl bg-surface-chrome transition-opacity duration-200",
        isOpen ? "opacity-100" : "pointer-events-none invisible opacity-0",
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6">
        {/* Floating dismiss control */}
        <div className="sticky top-0 z-10 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close question list"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised text-foreground shadow-lg ring-1 ring-surface-line transition-colors hover:bg-surface-raised/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav aria-label="Contest question list" className="mx-auto w-full max-w-5xl">
          <ul className="mt-4 space-y-4">
            {entries.map((entry) => {
              const isActive = entry.problem.id === activeId;
              const started = isProblemStarted(entry.state);
              const points = CODING_PROBLEM_POINTS[entry.problem.difficulty];

              return (
                <li key={entry.problem.id}>
                  <article
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-surface-panel px-5 py-6",
                      isActive ? "border-primary/50" : "border-surface-line",
                    )}
                  >
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                        Question {entry.index + 1}
                      </span>
                      <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-foreground">
                        {entry.problem.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-5">
                      <span
                        title={`${points} points`}
                        className="font-mono text-base font-semibold tabular-nums text-amber-500"
                      >
                        {points}
                        <span className="sr-only"> points</span>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          onSelect(entry.problem.id);
                          onClose();
                        }}
                        aria-label={`${started ? "Resume" : "Attempt"} question ${entry.index + 1}: ${entry.problem.title}`}
                        className="h-8 rounded-lg px-4 text-xs font-semibold"
                      >
                        {started ? "Resume" : "Attempt"}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
