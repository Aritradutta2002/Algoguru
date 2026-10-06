import { useEffect } from "react";
import { CheckCircle2, Circle, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROBLEM_STATE_CHIP_STYLES,
  PROBLEM_STATE_SHORT_LABELS,
  isProblemSolved,
  PROBLEM_STATE_LABELS,
  type ProblemNavEntry,
} from "@/components/contest/coding/problemState";

/**
 * Compact question switcher anchored to the "Contest set" trigger.
 *
 * Stays mounted and is hidden with classes rather than unmounted, so the
 * workspace keeps a stable, always-queryable list of the assigned questions.
 * `aria-label` carries the unabbreviated state so assistive technology is not
 * limited to the two-word chip.
 */

export function CodingQuestionMenu({
  entries,
  activeId,
  onSelect,
  onOpenList,
  disabled,
  isOpen,
  onClose,
}: {
  entries: ProblemNavEntry[];
  activeId: string;
  onSelect: (problemId: string) => void;
  onOpenList: () => void;
  disabled: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const submittedCount = entries.filter(
    (entry) => entry.state === "Submitted",
  ).length;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "absolute left-0 top-[calc(100%+10px)] z-50 w-[min(23rem,78vw)] rounded-xl border border-surface-line bg-surface-chrome p-1.5 shadow-2xl transition-all duration-150",
        isOpen
          ? "visible translate-y-0 opacity-100"
          : "invisible pointer-events-none -translate-y-1 opacity-0",
      )}
    >
      <nav aria-label="Assigned problems">
        <ul>
          {entries.map((entry) => {
            const isActive = entry.problem.id === activeId;
            const StateIcon = isProblemSolved(entry.state)
              ? CheckCircle2
              : Circle;

            return (
              <li key={entry.problem.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(entry.problem.id);
                    onClose();
                  }}
                  disabled={disabled}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Problem ${entry.index + 1}: ${entry.problem.title}. ${entry.state}`}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isActive ? "bg-surface-raised/70" : "hover:bg-surface-raised/40",
                  )}
                >
                  <StateIcon
                    aria-hidden="true"
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive
                        ? "fill-primary text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs",
                      isActive
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground/85",
                    )}
                  >
                    {entry.problem.title}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      PROBLEM_STATE_CHIP_STYLES[entry.state],
                    )}
                  >
                    {PROBLEM_STATE_SHORT_LABELS[entry.state]}
                  </span>
                  <span className="sr-only">
                    {PROBLEM_STATE_LABELS[entry.state]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-surface-line px-2.5 py-2">
        <span className="text-[11px] text-muted-foreground">
          {submittedCount} of {entries.length} submitted
        </span>
        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <Rows3 aria-hidden="true" className="h-3 w-3" />
          View all questions
        </button>
      </div>
    </div>
  );
}
