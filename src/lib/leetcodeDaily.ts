// Frontend service for the LeetCode Daily Challenge.
// Thin wrapper around `supabase.functions.invoke("leetcode-daily", ...)` so the
// rest of the app can consume a typed `DailyChallengeResponse` without worrying
// about the underlying transport or caching strategy (the edge function handles
// the two-tier cache).

import { supabase } from "@/integrations/supabase/client";
import type { DailyChallengeResponse } from "@/types/leetcode";

export type { DailyChallengeResponse, DailyProblem, LeetCodeTopicTag } from "@/types/leetcode";

/**
 * Fetch the LeetCode Daily Challenge for today (UTC).
 * Throws if the edge function returns a non-2xx response or the network fails.
 */
export async function fetchDailyChallenge(): Promise<DailyChallengeResponse> {
  const { data, error } = await supabase.functions.invoke<DailyChallengeResponse>(
    "leetcode-daily",
    { method: "GET" },
  );
  if (error) {
    throw new Error(error.message || "Failed to fetch daily challenge");
  }
  if (!data) {
    throw new Error("Empty response from daily-challenge service");
  }
  return data;
}
