import { assignCodingProblems } from "@/lib/contest/assignProblems";
import { CODING_CONTEST_CONFIG } from "@/lib/contest/config";
import { ContestServiceError } from "@/lib/contest/sessionService";
import type { ContestSessionService } from "@/lib/contest/sessionService";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import type {
  CodingContestResultData,
  CodingFinalizationReason,
  CodingProblemResult,
  CodingSession,
  CodingSessionBundle,
  CodingSessionStatus,
  FinalizeAck,
  WarningAck,
} from "@/lib/contest/types";

/**
 * DEVELOPMENT-ONLY session adapter.
 *
 * Mirrors every rule of the server contract (absolute 30-minute deadline,
 * 2–3 unique problems, per-problem drafts, warning escalation, idempotent
 * finalization) so the whole contest flow is testable and demonstrable without
 * a deployed `contest-coding` function.
 *
 * It is NOT authoritative. Sessions and scores live in this browser's
 * localStorage and mean nothing beyond this device. The UI must reach the
 * learner only after an explicit opt-in and must show a persistent
 * non-authoritative banner while it is in use.
 *
 * The caller (the JWT of the signed-in user) is trusted here purely so the
 * ownership check has something to compare against. A real backend derives it
 * from the verified token, never from anything the client sends.
 */

const ROW_PREFIX = "algoguru:coding-contest:session:";
const ACTIVE_POINTER = "algoguru:coding-contest:active-session";
const DRAFT_PREFIX = "algoguru:coding-contest:drafts:";

export interface LocalSessionRow {
  session: CodingSession;
  drafts: Record<string, string>;
  results: CodingProblemResult[];
}

export interface DevLocalOptions {
  userId: string;
  /** Injectable for deterministic tests. */
  now?: () => number;
  storage?: Storage;
  random?: () => number;
}

function defaultStorage(): Storage {
  return window.localStorage;
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createDevLocalContestSessionService(
  options: DevLocalOptions,
): ContestSessionService {
  const now = options.now ?? (() => Date.now());
  const storage = options.storage ?? defaultStorage();
  const random = options.random ?? Math.random;
  // Guarantees distinct ids even when the clock and RNG are both injected
  // (tests), where a timestamp+random id would otherwise repeat.
  let sequence = 0;

  const readRow = (sessionId: string): LocalSessionRow | null =>
    readJson<LocalSessionRow>(storage.getItem(ROW_PREFIX + sessionId));

  const writeRow = (row: LocalSessionRow): void => {
    storage.setItem(ROW_PREFIX + row.session.id, JSON.stringify(row));
  };

  const readDrafts = (sessionId: string): Record<string, string> =>
    readJson<Record<string, string>>(storage.getItem(DRAFT_PREFIX + sessionId)) ??
    {};

  const writeDrafts = (sessionId: string, drafts: Record<string, string>): void => {
    storage.setItem(DRAFT_PREFIX + sessionId, JSON.stringify(drafts));
  };

  /** Idempotent transition: a session that is already ended keeps its data. */
  const finalizeRow = (
    row: LocalSessionRow,
    reason: CodingFinalizationReason,
  ): { row: LocalSessionRow; alreadyFinalized: boolean } => {
    if (row.session.status === "finalized" || row.session.status === "cancelled") {
      return { row, alreadyFinalized: true };
    }
    const next: LocalSessionRow = {
      ...row,
      session: {
        ...row.session,
        status: "finalized" as CodingSessionStatus,
        finalizationReason: reason,
        submittedAt: now(),
        problemsSolved: row.results.filter((result) => result.solved).length,
        testsPassed: row.results.reduce((total, result) => total + result.passed, 0),
        testsTotal: row.results.reduce((total, result) => total + result.total, 0),
      },
    };
    writeRow(next);
    return { row: next, alreadyFinalized: false };
  };

  /** Applies the deadline before the caller reads a session. */
  const expireIfDue = (row: LocalSessionRow): LocalSessionRow => {
    if (row.session.status !== "active") return row;
    if (now() < row.session.expiresAt) return row;
    return finalizeRow(row, "expired").row;
  };

  const buildBundle = (row: LocalSessionRow): CodingSessionBundle => {
    const problems = row.session.problemIds
      .map((id) => PUBLIC_JAVA_PROBLEMS.find((problem) => problem.id === id))
      .filter((problem): problem is NonNullable<typeof problem> => Boolean(problem));
    return {
      session: row.session,
      problems,
      drafts: { ...row.drafts, ...readDrafts(row.session.id) },
      authoritative: false,
    };
  };

  return {
    async createSession(): Promise<CodingSessionBundle> {
      const pointerId = storage.getItem(ACTIVE_POINTER);
      if (pointerId) {
        const existing = readRow(pointerId);
        if (existing) {
          const checked = expireIfDue(existing);
          if (checked.session.status === "active") {
            // A second create resolves the in-flight session, it does not
            // start a parallel one.
            return buildBundle(checked);
          }
        }
      }

      const assigned = assignCodingProblems(PUBLIC_JAVA_PROBLEMS, random);
      if (assigned.length < CODING_CONTEST_CONFIG.minProblems) {
        throw new ContestServiceError(
          "unavailable",
          "The coding contest does not have enough published problems yet.",
        );
      }

      const startedAt = now();
      sequence += 1;
      const row: LocalSessionRow = {
        session: {
          id: `local-${startedAt}-${sequence}-${Math.floor(random() * 1e6)}`,
          userId: options.userId,
          language: CODING_CONTEST_CONFIG.language,
          problemIds: assigned.map((problem) => problem.id),
          startedAt,
          expiresAt: startedAt + CODING_CONTEST_CONFIG.durationSeconds * 1000,
          durationSeconds: CODING_CONTEST_CONFIG.durationSeconds,
          status: "active",
          warningCount: 0,
          submittedAt: null,
          finalizationReason: null,
          totalScore: null,
          problemsSolved: null,
          testsPassed: null,
          testsTotal: null,
          createdAt: startedAt,
        },
        drafts: {},
        results: [],
      };
      writeRow(row);
      storage.setItem(ACTIVE_POINTER, row.session.id);
      return buildBundle(row);
    },

    async getSession(sessionId: string): Promise<CodingSessionBundle> {
      const row = readRow(sessionId);
      if (!row) {
        throw new ContestServiceError("not_found", "That contest session was not found.");
      }
      return buildBundle(expireIfDue(row));
    },

    async saveDraft(
      sessionId: string,
      problemId: string,
      code: string,
    ): Promise<void> {
      const row = readRow(sessionId);
      if (!row) {
        throw new ContestServiceError("not_found", "That contest session was not found.");
      }
      const checked = expireIfDue(row);
      if (checked.session.status !== "active") {
        throw new ContestServiceError(
          "conflict",
          "This contest is closed, so no further drafts can be saved.",
        );
      }
      const drafts = readDrafts(sessionId);
      drafts[problemId] = code;
      writeDrafts(sessionId, drafts);
      writeRow({ ...checked, drafts });
    },

    async recordWarning(
      sessionId: string,
      reason: string,
    ): Promise<WarningAck> {
      const row = readRow(sessionId);
      if (!row) {
        throw new ContestServiceError("not_found", "That contest session was not found.");
      }
      const checked = expireIfDue(row);
      const warningCount = checked.session.warningCount + 1;
      if (warningCount >= MAX_EXAM_WARNINGS) {
        const ended = finalizeRow({ ...checked, session: { ...checked.session, warningCount } }, "warning_limit");
        void reason;
        return { warningCount, finalised: true, session: ended.row.session };
      }
      const next: LocalSessionRow = {
        ...checked,
        session: { ...checked.session, warningCount },
      };
      writeRow(next);
      return { warningCount, finalised: false, session: next.session };
    },

    async finalize(
      sessionId: string,
      reason: CodingFinalizationReason,
    ): Promise<FinalizeAck> {
      const row = readRow(sessionId);
      if (!row) {
        throw new ContestServiceError("not_found", "That contest session was not found.");
      }
      // The clock outranks the client: an expired session is recorded as
      // expired no matter which reason the browser claims.
      const checked = expireIfDue(row);
      const effective =
        checked.session.status === "finalized" && checked.session.finalizationReason
          ? checked.session.finalizationReason
          : now() >= checked.session.expiresAt
            ? "expired"
            : reason;
      const { row: ended, alreadyFinalized } = finalizeRow(checked, effective);
      if (ended.session.status === "finalized") {
        storage.removeItem(ACTIVE_POINTER);
      }
      return { session: ended.session, alreadyFinalized };
    },

    async getResult(sessionId: string): Promise<CodingContestResultData> {
      const row = readRow(sessionId);
      if (!row) {
        throw new ContestServiceError("not_found", "That contest session was not found.");
      }
      const problems = row.session.problemIds
        .map((id) => PUBLIC_JAVA_PROBLEMS.find((problem) => problem.id === id))
        .filter((problem): problem is NonNullable<typeof problem> => Boolean(problem));
      return {
        session: expireIfDue(row).session,
        problems,
        results: row.results,
        authoritative: false,
      };
    },
  };
}

/** Records a per-problem outcome. Exposed for the workspace's submit flow. */
export function recordLocalProblemResult(
  storage: Storage,
  sessionId: string,
  result: CodingProblemResult,
): void {
  const raw = storage.getItem(ROW_PREFIX + sessionId);
  const row = readJson<LocalSessionRow>(raw);
  if (!row) return;
  const results = row.results.filter((item) => item.problemId !== result.problemId);
  results.push(result);
  const scored = results.reduce((total, item) => total + (item.solved ? 1 : 0), 0);
  storage.setItem(
    ROW_PREFIX + sessionId,
    JSON.stringify({
      ...row,
      results,
      session: {
        ...row.session,
        totalScore: scored,
        problemsSolved: scored,
      },
    } satisfies LocalSessionRow),
  );
}
