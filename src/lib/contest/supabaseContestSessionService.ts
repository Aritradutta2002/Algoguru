import { supabase } from "@/integrations/supabase/client";
import { ContestServiceError } from "@/lib/contest/sessionService";
import type { ContestSessionService } from "@/lib/contest/sessionService";
import type {
  CodingContestResultData,
  CodingFinalizationReason,
  CodingSession,
  CodingSessionBundle,
  FinalizeAck,
  WarningAck,
} from "@/lib/contest/types";

/**
 * Authoritative session service: every call goes to the application's own
 * backend (`contest-coding` edge function), never to a third party.
 *
 * The function owns the deadline, problem assignment, ownership checks and
 * idempotency; this module is a typed transport and deliberately thin.
 */

const FUNCTION_NAME = "contest-coding";
const TIMEOUT_MS = 15_000;

interface Envelope<T> {
  session?: CodingSession;
  problems?: CodingSessionBundle["problems"];
  drafts?: Record<string, string>;
  results?: CodingContestResultData["results"];
  warningCount?: number;
  finalised?: boolean;
  alreadyFinalized?: boolean;
  created?: boolean;
  error?: string;
}

async function invoke<T>(
  body: Record<string, unknown>,
  method: "GET" | "POST",
): Promise<Envelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke<Envelope<T>>(
      FUNCTION_NAME,
      { method, body },
    );
    if (error) {
      // A missing/undeployed function surfaces as a fetch-level failure, which
      // `invoke` wraps; the caller decides whether to offer a local fallback.
      throw new ContestServiceError(
        "unavailable",
        error.message ||
          "The coding contest service is not available right now.",
      );
    }
    if (data?.error) {
      throw new ContestServiceError("unknown", data.error);
    }
    return data ?? {};
  } catch (error) {
    if (error instanceof ContestServiceError) throw error;
    throw new ContestServiceError(
      "unavailable",
      "Could not reach the coding contest service.",
    );
  } finally {
    clearTimeout(timer);
  }
}

function requireSession(envelope: Envelope<unknown>): CodingSession {
  if (!envelope.session) {
    throw new ContestServiceError("not_found", "That contest session was not found.");
  }
  return envelope.session;
}

function toBundle(envelope: Envelope<unknown>): CodingSessionBundle {
  return {
    session: requireSession(envelope),
    problems: envelope.problems ?? [],
    drafts: envelope.drafts ?? {},
    authoritative: true,
  };
}

export const supabaseContestSessionService: ContestSessionService = {
  async createSession(): Promise<CodingSessionBundle> {
    return toBundle(await invoke({ action: "create-session" }, "POST"));
  },

  async getSession(sessionId: string): Promise<CodingSessionBundle> {
    return toBundle(
      await invoke({ action: "get-session", sessionId }, "GET"),
    );
  },

  async saveDraft(
    sessionId: string,
    problemId: string,
    code: string,
  ): Promise<void> {
    await invoke({ action: "save-draft", sessionId, problemId, code }, "POST");
  },

  async recordWarning(
    sessionId: string,
    reason: string,
  ): Promise<WarningAck> {
    const envelope = await invoke(
      { action: "record-warning", sessionId, reason },
      "POST",
    );
    return {
      warningCount: envelope.warningCount ?? 0,
      finalised: envelope.finalised ?? false,
      session: requireSession(envelope),
    };
  },

  async finalize(
    sessionId: string,
    reason: CodingFinalizationReason,
  ): Promise<FinalizeAck> {
    const envelope = await invoke(
      { action: "finalize", sessionId, reason },
      "POST",
    );
    return {
      session: requireSession(envelope),
      alreadyFinalized: envelope.alreadyFinalized ?? false,
    };
  },

  async getResult(sessionId: string): Promise<CodingContestResultData> {
    const envelope = await invoke({ action: "get-result", sessionId }, "GET");
    return {
      session: requireSession(envelope),
      problems: envelope.problems ?? [],
      results: envelope.results ?? [],
      authoritative: true,
    };
  },
};
