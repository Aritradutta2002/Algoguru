// TanStack Query hook for the LeetCode Daily Challenge.
//
// The lib layer maintains a localStorage cache keyed by UTC date, so the hook
// is responsible for *not* re-fetching on every navigation. The challenge only
// changes once per UTC day, so we use a long staleTime aligned with that
// boundary. On any 429/non-2xx the lib layer falls back to its local cache, so
// retries here are disabled (the lib already handles them with backoff).

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchDailyChallenge } from "@/lib/leetcodeDaily";
import type { DailyChallengeResponse } from "@/types/leetcode";

export const DAILY_CHALLENGE_QUERY_KEY = ["daily-challenge"] as const;

export function useDailyChallenge(): UseQueryResult<DailyChallengeResponse, Error> {
  return useQuery<DailyChallengeResponse, Error>({
    queryKey: DAILY_CHALLENGE_QUERY_KEY,
    queryFn: fetchDailyChallenge,
    // Daily challenge changes once per UTC day; lib layer has a localStorage
    // cache keyed on that boundary. A 6h staleTime keeps the query in sync
    // across day-rollover navigations without re-hitting upstream.
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0, // lib layer handles 429s with its own backoff + local cache.
  });
}
