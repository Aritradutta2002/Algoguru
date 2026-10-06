/**
 * Fixed rules of the Java coding contest.
 *
 * These are product decisions, not tunables. The instructions screen, the
 * landing page and the workspace all read from here so the numbers a learner is
 * shown before starting are the same numbers the session is actually created
 * with.
 */

import type { CodingDifficulty } from "@/lib/contest/types";

export const CODING_CONTEST_DURATION_SECONDS = 30 * 60; // exactly 30 minutes

export const CODING_CONTEST_MIN_PROBLEMS = 2;
export const CODING_CONTEST_MAX_PROBLEMS = 3;

/**
 * Learner-facing name for each difficulty. The workspace shows the tier, because
 * that is the vocabulary the instruction screen and the landing page teach; the
 * raw `easy`/`medium`/`hard` value stays on the badge as its tooltip.
 */
export const CODING_DIFFICULTY_TIERS = {
  easy: "Basic",
  medium: "Core",
  hard: "Advanced",
} as const satisfies Record<CodingDifficulty, string>;

/**
 * Points each question is worth. The workspace only ever *displays* this — the
 * authoritative score is produced by the backend, never in the browser.
 */
export const CODING_PROBLEM_POINTS = {
  easy: 5,
  medium: 10,
  hard: 15,
} as const satisfies Record<CodingDifficulty, number>;

export type TimerUrgencyTone = "normal" | "warn" | "danger";

export interface TimerUrgencyLevel {
  /** Applies while `remainingSeconds <= atSeconds`. */
  atSeconds: number;
  /** Announced as text so urgency is never conveyed by colour alone. */
  label: string;
  tone: TimerUrgencyTone;
}

export const CODING_CONTEST_CONFIG = {
  language: "java" as const,
  durationSeconds: CODING_CONTEST_DURATION_SECONDS,
  minProblems: CODING_CONTEST_MIN_PROBLEMS,
  maxProblems: CODING_CONTEST_MAX_PROBLEMS,
  /** Same cadence the MCQ timer uses, so both modes feel identical. */
  visibilityChecksMs: 250,
  urgencyLevels: [
    { atSeconds: 600, label: "10 minutes remaining", tone: "warn" },
    { atSeconds: 300, label: "5 minutes remaining", tone: "warn" },
    { atSeconds: 60, label: "1 minute remaining", tone: "danger" },
  ] as TimerUrgencyLevel[],
} as const;

/** Human-readable duration for the landing page and instructions screen. */
export const CODING_CONTEST_DURATION_LABEL = "30 minutes";

/** The highest urgency level that currently applies, or null when normal. */
export function getTimerUrgency(
  remainingSeconds: number,
  levels: readonly TimerUrgencyLevel[] = CODING_CONTEST_CONFIG.urgencyLevels,
): TimerUrgencyLevel | null {
  let match: TimerUrgencyLevel | null = null;
  for (const level of levels) {
    if (remainingSeconds <= level.atSeconds) match = level;
  }
  return match;
}
