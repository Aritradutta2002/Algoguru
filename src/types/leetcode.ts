// Shared types for the LeetCode Daily Challenge integration.
// Mirrors the payload produced by the `leetcode-daily` Supabase edge function.

export interface LeetCodeTopicTag {
  name: string;
  slug?: string;
}

export interface DailyProblem {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  /** HTML — render with dangerouslySetInnerHTML. Sourced from the trusted
   *  alfa-leetcode-api.onrender.com wrapper. */
  content: string;
  exampleTestcases?: string;
  topicTags: LeetCodeTopicTag[];
  hints?: string[];
  /** Acceptance rate as a percentage (0-100). */
  acRate?: number;
  link: string;
  /** Official solution HTML, if available. */
  solution?: string | null;
}

export type DailyChallengeSource = "upstream" | "db-cache" | "memory-cache";

export interface DailyChallengeResponse {
  /** UTC date in YYYY-MM-DD format. */
  date: string;
  problem: DailyProblem;
  fetchedAt: string;
  source: DailyChallengeSource;
  /** True when the response was served from a previous day's cache because
   *  the upstream API was unreachable. */
  stale?: boolean;
}
