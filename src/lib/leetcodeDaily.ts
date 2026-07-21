// Frontend service for the LeetCode Daily Challenge.
//
// Primary path: the `leetcode-daily` Supabase edge function, which has a
// two-tier cache (in-memory + DB) to keep upstream calls minimal and to survive
// cold starts.
//
// Fallback path: if the edge function is unavailable (cold start race, deploy
// drift, upstream 502 with empty DB cache, etc.), we hit the same upstream
// `alfa-leetcode-api.onrender.com/daily` wrapper directly from the browser.
// This is the same pattern the Profile page already uses for the LeetCode
// heatmap, and the project memory confirms the wrapper is reachable from
// browsers (direct leetcode.com/graphql is blocked by Cloudflare).

import { supabase } from "@/integrations/supabase/client";
import type {
  DailyChallengeResponse,
  DailyProblem,
  LeetCodeTopicTag,
} from "@/types/leetcode";

export type {
  DailyChallengeResponse,
  DailyProblem,
  LeetCodeTopicTag,
} from "@/types/leetcode";

const DIRECT_UPSTREAM_URL = "https://alfa-leetcode-api.onrender.com/daily";
const DIRECT_UPSTREAM_TIMEOUT_MS = 10_000;

/**
 * Fetch the LeetCode Daily Challenge for today (UTC).
 *
 * Tries the cached `leetcode-daily` edge function first, then falls back to a
 * direct browser call against the alfa-leetcode-api wrapper so users still see
 * a challenge even when the edge function is unhealthy.
 *
 * Throws if both paths fail or the network is unreachable.
 */
export async function fetchDailyChallenge(): Promise<DailyChallengeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<DailyChallengeResponse>(
      "leetcode-daily",
      { method: "GET" },
    );
    if (!error && data && data.problem?.questionId) {
      return data;
    }
    if (error) {
      // Surface a warning but try the direct fallback before giving up.
      console.warn(
        "[leetcodeDaily] edge function unavailable, falling back to direct fetch:",
        error.message,
      );
    }
  } catch (err) {
    // supabase.functions.invoke itself can throw (network failure, CORS, etc.)
    console.warn(
      "[leetcodeDaily] edge function threw, falling back to direct fetch:",
      (err as Error).message,
    );
  }

  return fetchDailyChallengeDirect();
}

/**
 * Browser-direct fetch against the alfa-leetcode-api `/daily` endpoint. Used
 * as a fallback when the cached edge function is unhealthy.
 *
 * The upstream returns either:
 *   { questionId, title, titleSlug, ... }                      (newer shape)
 *   { data: { activeDailyCodingChallenge: { question: {...} } } } (legacy)
 *
 * We normalize both into a `DailyChallengeResponse`.
 */
async function fetchDailyChallengeDirect(): Promise<DailyChallengeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DIRECT_UPSTREAM_TIMEOUT_MS,
  );

  try {
    const res = await fetch(DIRECT_UPSTREAM_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Upstream returned HTTP ${res.status}`);
    }
    const raw = (await res.json()) as Record<string, unknown>;
    return buildResponseFromUpstream(raw);
  } finally {
    clearTimeout(timeout);
  }
}

interface UpstreamQuestion {
  questionId?: unknown;
  title?: unknown;
  titleSlug?: unknown;
  difficulty?: unknown;
  content?: unknown;
  exampleTestcases?: unknown;
  topicTags?: unknown;
  hints?: unknown;
  acRate?: unknown;
}

function buildResponseFromUpstream(
  raw: Record<string, unknown>,
): DailyChallengeResponse {
  const question: UpstreamQuestion | null = (() => {
    if (raw && typeof raw === "object" && "questionId" in raw) {
      return raw as UpstreamQuestion;
    }
    const nested = (
      raw as {
        data?: { activeDailyCodingChallenge?: { question?: unknown } };
      }
    )?.data?.activeDailyCodingChallenge?.question;
    return (nested as UpstreamQuestion) ?? null;
  })();

  if (!question || !question.questionId || !question.titleSlug) {
    throw new Error("Upstream payload missing required fields");
  }

  const topicTags: LeetCodeTopicTag[] = Array.isArray(question.topicTags)
    ? (question.topicTags as LeetCodeTopicTag[])
    : [];

  const problem: DailyProblem = {
    questionId: String(question.questionId),
    title: String(question.title ?? ""),
    titleSlug: String(question.titleSlug),
    difficulty: String(question.difficulty ?? "Unknown"),
    content: String(question.content ?? ""),
    exampleTestcases: question.exampleTestcases
      ? String(question.exampleTestcases)
      : undefined,
    topicTags,
    hints: Array.isArray(question.hints)
      ? (question.hints as string[])
      : undefined,
    acRate: typeof question.acRate === "number" ? question.acRate : undefined,
    link: `https://leetcode.com/problems/${String(question.titleSlug)}/`,
  };

  return {
    date: new Date().toISOString().slice(0, 10),
    problem,
    fetchedAt: new Date().toISOString(),
    // Mark direct-fallback responses as stale so the UI can show a badge.
    source: "upstream",
    stale: true,
  };
}
