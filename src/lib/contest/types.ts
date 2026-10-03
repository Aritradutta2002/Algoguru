/**
 * Contest module — shared domain types.
 *
 * These types describe the coding-contest half of the Contest feature. The MCQ
 * half keeps its own long-standing types in `@/lib/quizBank` and
 * `@/lib/mcqQuizBank`; nothing here renames those.
 */

export type CodingDifficulty = "easy" | "medium" | "hard";

/** Why a contest stopped accepting work. */
export type CodingFinalizationReason =
  | "manual"
  | "expired"
  | "warning_limit"
  | "administrator"
  | "system";

export type CodingSessionStatus =
  | "active"
  | "processing"
  | "finalized"
  | "cancelled";

/** A human-readable label for a finalization reason, used by the result page. */
export const CODING_FINALIZATION_LABELS: Record<CodingFinalizationReason, string> = {
  manual: "Submitted by you",
  expired: "Time expired",
  warning_limit: "Ended after too many focus warnings",
  administrator: "Ended by an administrator",
  system: "Ended by the system",
};

export interface CodingExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

/**
 * Everything the browser is allowed to receive for a coding problem.
 *
 * This is the only problem shape the frontend ever imports. Hidden test cases
 * and reference solutions live in `ServerCodingProblem` on the server only.
 */
export interface PublicCodingProblem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: CodingDifficulty;
  topics: string[];
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  examples: CodingExample[];
  starterCode: string;
  functionSignature: string;
  visibleTestCases: CodingTestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
}

/**
 * Server-side only. `hiddenTestCases` and `referenceSolution` must never
 * cross the wire — every backend response is projected through
 * `toPublicProblem` first.
 */
export interface ServerCodingProblem extends PublicCodingProblem {
  hiddenTestCases: CodingTestCase[];
  referenceSolution: string;
}

/** A contest session. `expiresAt` is the authoritative deadline (epoch ms). */
export interface CodingSession {
  id: string;
  userId: string;
  language: string;
  problemIds: string[];
  startedAt: number;
  expiresAt: number;
  durationSeconds: number;
  status: CodingSessionStatus;
  warningCount: number;
  submittedAt: number | null;
  finalizationReason: CodingFinalizationReason | null;
  totalScore: number | null;
  problemsSolved: number | null;
  testsPassed: number | null;
  testsTotal: number | null;
  createdAt: number;
}

/** Everything the workspace needs to (re)hydrate itself. */
export interface CodingSessionBundle {
  session: CodingSession;
  problems: PublicCodingProblem[];
  /** Draft code keyed by problem id. */
  drafts: Record<string, string>;
  /**
   * False when the bundle came from the local development adapter rather than
   * the server. The UI must surface this — a non-authoritative bundle cannot
   * produce a trustworthy score.
   */
  authoritative: boolean;
}

export interface WarningAck {
  warningCount: number;
  /** True once the warning limit has been reached and the contest ended. */
  finalised: boolean;
  session: CodingSession;
}

export interface FinalizeAck {
  session: CodingSession;
  /** True when the session had already been finalized; nothing changed. */
  alreadyFinalized: boolean;
}

/** Per-problem outcome in the result report. */
export interface CodingProblemResult {
  problemId: string;
  title: string;
  difficulty: CodingDifficulty;
  submitted: boolean;
  solved: boolean;
  passed: number;
  total: number;
  submittedCode: string | null;
}

export interface CodingContestResultData {
  session: CodingSession;
  problems: PublicCodingProblem[];
  results: CodingProblemResult[];
  /** False for the local development adapter. */
  authoritative: boolean;
}
