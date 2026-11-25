"use client";

import { useRef } from "react";
import { CheckCircle2, ChevronDown, Circle, Rows3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * `aria-label` carries the unabbreviated state so assistive technology is not
 * limited to the two-word chip.
 */

export function CodingQuestionMenu({
  entries,
  activeId,
  activeProblemIndex,
  totalProblems,
  onSelect,
  onOpenList,
  disabled,
}: {
  entries: ProblemNavEntry[];
  activeId: string;
  activeProblemIndex: number;
  totalProblems: number;
  onSelect: (problemId: string) => void;
  onOpenList: () => void;
  disabled: boolean;
}) {
  const focusListOnCloseRef = useRef(false);
  const submittedCount = entries.filter(
    (entry) => entry.state === "Submitted",
  ).length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "group flex h-9 max-w-[16rem] items-center gap-2 rounded-lg border-b-2 bg-surface-panel pl-4 pr-3 text-sm font-medium transition-colors hover:bg-surface-panel",
            "border-b-primary/70 text-foreground hover:text-primary data-[state=open]:border-b-primary data-[state=open]:text-primary",
          )}
        >
          <span className="truncate">
            Contest set {activeProblemIndex + 1} / {totalProblems}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={10}
        aria-label="Assigned problems"
        className="z-50 w-[min(23rem,78vw)] rounded-xl border border-surface-line bg-surface-chrome p-1.5 shadow-2xl"
        onCloseAutoFocus={(event) => {
          if (!focusListOnCloseRef.current) return;
          event.preventDefault();
          focusListOnCloseRef.current = false;
        }}
      >
        {entries.map((entry) => {
          const isActive = entry.problem.id === activeId;
          const StateIcon = isProblemSolved(entry.state)
            ? CheckCircle2
            : Circle;

          return (
            <DropdownMenuItem
              key={entry.problem.id}
              disabled={disabled}
              onSelect={() => onSelect(entry.problem.id)}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Problem ${entry.index + 1}: ${entry.problem.title}. ${entry.state}`}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isActive
                  ? "bg-surface-raised/70 focus:bg-surface-raised/70"
                  : "focus:bg-surface-raised/40 hover:bg-surface-raised/40",
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
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                  PROBLEM_STATE_CHIP_STYLES[entry.state],
                )}
              >
                {PROBLEM_STATE_SHORT_LABELS[entry.state]}
              </Badge>
              <span className="sr-only">
                {PROBLEM_STATE_LABELS[entry.state]}
              </span>
            </DropdownMenuItem>
          );
        })}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-surface-line px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">
            {submittedCount} of {entries.length} submitted
          </span>
          <DropdownMenuItem
            onSelect={() => {
              focusListOnCloseRef.current = true;
              onOpenList();
            }}
            className="h-auto gap-1 rounded-sm p-0 text-[11px] font-medium text-primary focus:bg-transparent focus:text-primary"
          >
            <Rows3 aria-hidden="true" className="h-3 w-3" />
            View all questions
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
