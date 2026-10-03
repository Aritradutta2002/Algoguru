import type {
  CodingContestResultData,
  CodingFinalizationReason,
  CodingSession,
  CodingSessionBundle,
  FinalizeAck,
  WarningAck,
} from "@/lib/contest/types";

/**
 * Transport-agnostic contract for the coding-contest session lifecycle.
 *
 * Two implementations exist: `supabaseContestSessionService` (authoritative,
 * talks to the `contest-coding` edge function) and
 * `devLocalContestSessionService` (browser-local, explicitly non-authoritative
 * and only reachable after a deliberate user opt-in).
 *
 * The UI must treat `authoritative: false` as "this score means nothing" and say
 * so on screen.
 */
export interface ContestSessionService {
  /** Idempotent: never creates a second active session. */
  createSession(): Promise<CodingSessionBundle>;
  /** Rehydrates after a refresh; finalizes first if the deadline already passed. */
  getSession(sessionId: string): Promise<CodingSessionBundle>;
  saveDraft(sessionId: string, problemId: string, code: string): Promise<void>;
  recordWarning(sessionId: string, reason: string): Promise<WarningAck>;
  /** Idempotent: a second call resolves with `alreadyFinalized: true`. */
  finalize(
    sessionId: string,
    reason: CodingFinalizationReason,
  ): Promise<FinalizeAck>;
  getResult(sessionId: string): Promise<CodingContestResultData>;
}

export type ContestServiceErrorCode =
  | "unavailable"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unknown";

/** Every service failure carries a code the UI can branch on. */
export class ContestServiceError extends Error {
  readonly code: ContestServiceErrorCode;

  constructor(code: ContestServiceErrorCode, message: string) {
    super(message);
    this.name = "ContestServiceError";
    this.code = code;
  }
}

export function isContestServiceError(
  error: unknown,
): error is ContestServiceError {
  return error instanceof ContestServiceError;
}

/** True when a failure plausibly means "backend not deployed yet". */
export function isBackendUnavailable(error: unknown): boolean {
  if (isContestServiceError(error)) {
    return error.code === "unavailable" || error.code === "unknown";
  }
  return error instanceof TypeError;
}

export type ContestSessionMode = "remote" | "local";

/** Optional dev override; the UI can also switch after an explicit opt-in. */
export function configuredSessionMode(): ContestSessionMode {
  const raw = import.meta.env.VITE_CONTEST_SESSION_MODE;
  return raw === "local" ? "local" : "remote";
}
