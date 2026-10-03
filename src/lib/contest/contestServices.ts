import { createDevLocalContestSessionService } from "@/lib/contest/devLocalContestSessionService";
import { supabaseContestSessionService } from "@/lib/contest/supabaseContestSessionService";
import {
  configuredSessionMode,
  type ContestSessionMode,
  type ContestSessionService,
} from "@/lib/contest/sessionService";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

/**
 * Picks the session service.
 *
 * There is deliberately NO silent downgrade. The default is the authoritative
 * backend; if it is unreachable the instructions screen surfaces an actionable
 * error and the learner has to explicitly choose local practice mode. Making
 * that a deliberate act is what keeps a non-authoritative session from being
 * mistaken for a real one.
 */
export function resolveContestSessionService(
  mode: ContestSessionMode,
  userId: string,
): ContestSessionService {
  return mode === "local"
    ? createDevLocalContestSessionService({ userId })
    : supabaseContestSessionService;
}

/** Session service for the current mode, memoised per user. */
export function useContestSessionService(
  mode: ContestSessionMode,
): ContestSessionService {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  return useMemo(() => resolveContestSessionService(mode, userId), [mode, userId]);
}

export { configuredSessionMode };
export type { ContestSessionMode, ContestSessionService };
