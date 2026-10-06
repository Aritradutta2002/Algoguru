import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Circle,
  Edit3,
  Eye,
  PlayCircle,
} from "lucide-react";
import type { PublicCodingProblem } from "@/lib/contest/types";

/**
 * How far a learner has got with one assigned question.
 *
 * Defined here rather than in a view so the dropdown menu, the full question
 * list, the problem pane and the workspace all describe the same state with the
 * same words. `PROBLEM_STATE_LABELS` is the accessible, unabbreviated form —
 * screen readers and the `aria-label` contract depend on it.
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

/** Compact form for the chip beside a question title. */
export const PROBLEM_STATE_SHORT_LABELS: Record<ProblemState, string> = {
  "Not visited": "Unattempted",
  Viewed: "In progress",
  "Code edited": "In progress",
  "Run attempted": "Tested",
  "Visible tests passed": "Passed",
  Submitted: "Submitted",
};

export const PROBLEM_STATE_CHIP_STYLES: Record<ProblemState, string> = {
  "Not visited": "border-border/70 bg-muted/40 text-muted-foreground",
  Viewed: "border-primary/40 bg-primary/10 text-primary",
  "Code edited": "border-primary/40 bg-primary/10 text-primary",
  "Run attempted": "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "Visible tests passed":
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Submitted:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export const PROBLEM_STATE_ICONS: Record<ProblemState, LucideIcon> = {
  "Not visited": Circle,
  Viewed: Eye,
  "Code edited": Edit3,
  "Run attempted": PlayCircle,
  "Visible tests passed": CheckCircle2,
  Submitted: CheckCircle2,
};

/** States from which the learner has a positive result to show. */
export function isProblemSolved(state: ProblemState): boolean {
  return state === "Visible tests passed" || state === "Submitted";
}

/** True once the learner has opened or edited the question at all. */
export function isProblemStarted(state: ProblemState): boolean {
  return state !== "Not visited";
}

export interface ProblemNavEntry {
  problem: PublicCodingProblem;
  index: number;
  state: ProblemState;
}
