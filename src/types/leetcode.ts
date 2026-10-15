// Shared types for the LeetCode Daily Challenge integration.
// Mirrors the payload produced by the `leetcode-daily` Supabase edge function.

export interface LeetCodeTopicTag {
  name: string;
  slug?: string;
}

/** One language variant of an editorial implementation. */
export interface SolutionLanguage {
  langSlug: string;
  label: string;
  code: string;
}

/**
 * A resolved editorial implementation. LeetCode stores each approach's code in
 * a playground that holds the same solution in ~9 languages; `languages` is
 * that full set so the reader can switch between them.
 */
export interface SolutionBlock {
  /** Language the editorial author had selected; the client's fallback. */
  defaultLangSlug: string;
  languages: SolutionLanguage[];
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
  /**
   * Official solution markdown. Implementation code is not inlined here —
   * each playbook referenced by the editorial is replaced with a
   * `<!--solution-block:N-->` token resolved against `solutionBlocks`.
   */
  solution?: string | null;
  /** Multi-language implementation blocks referenced by `solution` tokens. */
  solutionBlocks?: SolutionBlock[];
  codeSnippets?: { langSlug: string; code: string }[];
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
