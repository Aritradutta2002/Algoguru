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
//
// Resilience: both upstream paths can be rate-limited (HTTP 429). The daily
// challenge only changes once per UTC day, so we persist successful responses
// in localStorage keyed by UTC date. On a 429 we wait briefly and retry once;
// on any other failure (or a 429 with no cached value) we serve the most
// recent cached value as stale-while-revalidate.

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

const LS_CACHE_KEY = "leetcode_daily_challenge_cache_v1";
/** Soft cap on cache age before we stop returning it as "fresh". 36h gives
 *  enough slack to cover any timezone oddity while still being bounded. */
const LS_CACHE_FRESH_MS = 1000 * 60 * 60 * 36;
/** 429 backoff before the direct-fallback retry. The wrapper is rate-limited
 *  per IP; a short sleep usually clears the window. */
const RATE_LIMIT_BACKOFF_MS = 1500;

function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

interface CachedEntry {
  date: string;
  response: DailyChallengeResponse;
  cachedAt: number;
}

/**
 * Fetch the LeetCode Daily Challenge for today (UTC).
 *
 * Tries the cached `leetcode-daily` edge function first, then falls back to a
 * direct browser call against the alfa-leetcode-api wrapper, with a local
 * cache layer that absorbs upstream 429s.
 */
export async function fetchDailyChallenge(): Promise<DailyChallengeResponse> {
  const cache = readCache();

  // Fast path: if the local cache is for today's UTC date and still fresh,
  // return it without hitting any network. This is the primary defense against
  // repeated 429s — the daily challenge only changes once per UTC day, so
  // refetching is wasteful.
  if (cache && cache.date === utcDateKey() && isFresh(cache)) {
    return cache.response;
  }

  // Try the edge function first.
  try {
    const { data, error } = await supabase.functions.invoke<DailyChallengeResponse>(
      "leetcode-daily",
      { method: "GET" },
    );
    if (!error && data && data.problem?.questionId) {
      writeCache({ date: utcDateKey(), response: data, cachedAt: Date.now() });
      return data;
    }
    if (error) {
      console.warn(
        "[leetcodeDaily] edge function unavailable, falling back to direct fetch:",
        error.message,
      );
    }
  } catch (err) {
    console.warn(
      "[leetcodeDaily] edge function threw, falling back to direct fetch:",
      (err as Error).message,
    );
  }

  // Direct browser call, with one retry on 429.
  const direct = await fetchDailyChallengeDirectWithRetry();
  if (direct) {
    writeCache({ date: utcDateKey(), response: direct, cachedAt: Date.now() });
    return direct;
  }

  // Both network paths failed. If we have *any* cached value (even stale),
  // surface it with the `stale` flag set so the UI can show a "cached"
  // badge. The user at least sees *something* meaningful.
  if (cache) {
    return { ...cache.response, stale: true };
  }

  throw new Error(
    "Upstream LeetCode API is rate-limited and no cached challenge is available. Please try again in a few minutes.",
  );
}

/**
 * Browser-direct fetch against the alfa-leetcode-api `/daily` endpoint.
 * Retries once on HTTP 429 after a short backoff.
 */
async function fetchDailyChallengeDirectWithRetry(): Promise<DailyChallengeResponse | null> {
  const attempt = async (): Promise<DailyChallengeResponse | { rateLimited: true } | null> => {
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
      if (res.status === 429) {
        return { rateLimited: true };
      }
      if (!res.ok) {
        throw new Error(`Upstream returned HTTP ${res.status}`);
      }
      const raw = (await res.json()) as Record<string, unknown>;
      return buildResponseFromUpstream(raw);
    } finally {
      clearTimeout(timeout);
    }
  };

  const first = await attempt();
  if (first && "rateLimited" in first) {
    await sleep(RATE_LIMIT_BACKOFF_MS);
    const second = await attempt();
    if (second && !("rateLimited" in second)) {
      return second;
    }
    return null;
  }
  if (first && !("rateLimited" in first)) {
    return first;
  }
  return null;
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
    source: "upstream",
    stale: true,
  };
}

function readCache(): CachedEntry | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (!parsed || typeof parsed.cachedAt !== "number" || !parsed.response) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CachedEntry): void {
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

function isFresh(entry: CachedEntry): boolean {
  return Date.now() - entry.cachedAt < LS_CACHE_FRESH_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
