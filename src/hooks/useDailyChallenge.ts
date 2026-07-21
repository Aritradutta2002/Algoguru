// TanStack Query hook for the LeetCode Daily Challenge.
//
// The backend edge function already caches by UTC date, so on the frontend we
// can keep the query very stale (6h) without losing freshness — a single user
// opening the page will at most trigger one upstream call per UTC day.

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchDailyChallenge } from "@/lib/leetcodeDaily";
import type { DailyChallengeResponse } from "@/types/leetcode";

export const DAILY_CHALLENGE_QUERY_KEY = ["daily-challenge"] as const;

export function useDailyChallenge(): UseQueryResult<DailyChallengeResponse, Error> {
  return useQuery<DailyChallengeResponse, Error>({
    queryKey: DAILY_CHALLENGE_QUERY_KEY,
    queryFn: fetchDailyChallenge,
    // The edge function caches by UTC date; this keeps the frontend in sync
    // without refetching on every navigation within the same day.
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
