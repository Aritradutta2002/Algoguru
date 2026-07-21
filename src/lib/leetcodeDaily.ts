// Frontend service for the LeetCode Daily Challenge.
//
// Multi-tier resilient fetching strategy:
//   1. LocalStorage Cache (if fresh for today UTC).
//   2. Direct LeetCode GraphQL API query (`https://leetcode.com/graphql`).
//   3. Supabase Edge Function `leetcode-daily`.
//   4. Fallback wrapper `alfa-leetcode-api.onrender.com/daily`.
//   5. Stale LocalStorage Cache (if network fails).
//   6. Built-in Fallback Challenge (ensures zero user-facing crash/rate limit errors).

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
const DIRECT_UPSTREAM_TIMEOUT_MS = 8_000;

const LS_CACHE_KEY = "leetcode_daily_challenge_cache_v3";
/** Soft cap on cache age before we stop returning it as "fresh". 36h gives
 *  enough slack to cover any timezone oddity while still being bounded. */
const LS_CACHE_FRESH_MS = 1000 * 60 * 60 * 36;
/** 429 backoff before the direct-fallback retry. */
const RATE_LIMIT_BACKOFF_MS = 1500;

function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

interface CachedEntry {
  date: string;
  response: DailyChallengeResponse;
  cachedAt: number;
}

const FALLBACK_PROBLEM: DailyChallengeResponse = {
  date: new Date().toISOString().slice(0, 10),
  fetchedAt: new Date().toISOString(),
  source: "db-cache",
  stale: true,
  problem: {
    questionId: "3805",
    title: "Maximize Active Section with Trade I",
    titleSlug: "maximize-active-section-with-trade-i",
    difficulty: "Medium",
    content: `<p>You are given a binary string <code>s</code> of length <code>n</code>, where:</p>

<ul>
	<li><code>'1'</code> represents an <strong>active</strong> section.</li>
	<li><code>'0'</code> represents an <strong>inactive</strong> section.</li>
</ul>

<p>You can perform <strong>at most one trade</strong> to maximize the number of active sections in <code>s</code>. In a trade, you:</p>

<ul>
	<li>Convert a contiguous block of <code>'1'</code>s that is surrounded by <code>'0'</code>s to all <code>'0'</code>s.</li>
	<li>Afterward, convert a contiguous block of <code>'0'</code>s that is surrounded by <code>'1'</code>s to all <code>'1'</code>s.</li>
</ul>

<p>Return the <strong>maximum</strong> number of active sections in <code>s</code> after making the optimal trade.</p>

<p>&nbsp;</p>
<p><strong class="example">Example 1:</strong></p>

<div class="example-block">
<p><strong>Input:</strong> <span class="example-io">s = "01"</span></p>

<p><strong>Output:</strong> <span class="example-io">1</span></p>

<p><strong>Explanation:</strong></p>

<p>Because there is no block of <code>'1'</code>s surrounded by <code>'0'</code>s, no valid trade is possible. The maximum number of active sections is 1.</p>
</div>

<p><strong class="example">Example 2:</strong></p>

<div class="example-block">
<p><strong>Input:</strong> <span class="example-io">s = "0100"</span></p>

<p><strong>Output:</strong> <span class="example-io">4</span></p>

<p><strong>Explanation:</strong></p>

<ul>
	<li>String <code>"0100"</code> &rarr; Augmented to <code>"101001"</code>.</li>
	<li>Choose <code>"0100"</code>, convert <code>"10<u><strong>1</strong></u>001"</code> &rarr; <code>"1<u><strong>0000</strong></u>1"</code> &rarr; <code>"1<u><strong>1111</strong></u>1"</code>.</li>
	<li>The final string without augmentation is <code>"1111"</code>. The maximum number of active sections is 4.</li>
</ul>
</div>

<p>&nbsp;</p>
<p><strong>Constraints:</strong></p>

<ul>
	<li><code>1 &lt;= n == s.length &lt;= 10<sup>5</sup></code></li>
	<li><code>s[i]</code> is either <code>'0'</code> or <code>'1'</code></li>
</ul>`,
    exampleTestcases: `"01"\n"0100"\n"1000100"\n"01010"`,
    topicTags: [
      { name: "String", slug: "string" },
      { name: "Enumeration", slug: "enumeration" },
    ],
    hints: [
      "Split the string into several zero-one segments.",
      "For each one-segment, if it has two neighbors (i.e., it is surrounded by two zero-segments), the total sum of their lengths is one of the candidates for <code>delta</code>.",
      "Find the maximum <code>delta</code> and add it to the total number of ones in the string.",
    ],
    acRate: 65.4,
    link: "https://leetcode.com/problems/maximize-active-section-with-trade-i/",
  },
};

/**
 * Fetch the LeetCode Daily Challenge for today (UTC).
 */
export async function fetchDailyChallenge(): Promise<DailyChallengeResponse> {
  const cache = readCache();

  // Tier 0: Return fresh local cache
  if (cache && cache.date === utcDateKey() && isFresh(cache)) {
    return cache.response;
  }

  // Tier 1: Direct LeetCode GraphQL query (bypasses third-party wrapper rate limits)
  const directGraphQL = await fetchDailyChallengeGraphQL();
  if (directGraphQL) {
    writeCache({ date: utcDateKey(), response: directGraphQL, cachedAt: Date.now() });
    return directGraphQL;
  }

  // Tier 2: Try Supabase edge function
  try {
    const { data, error } = await supabase.functions.invoke<DailyChallengeResponse>(
      "leetcode-daily",
      { method: "GET" },
    );
    if (!error && data && data.problem?.questionId) {
      writeCache({ date: utcDateKey(), response: data, cachedAt: Date.now() });
      return data;
    }
  } catch (err) {
    console.warn(
      "[leetcodeDaily] edge function threw, trying fallback:",
      (err as Error).message,
    );
  }

  // Tier 3: Third-party wrapper API fallback
  const directWrapper = await fetchDailyChallengeDirectWithRetry();
  if (directWrapper) {
    writeCache({ date: utcDateKey(), response: directWrapper, cachedAt: Date.now() });
    return directWrapper;
  }

  // Tier 4: Serve any cached response (even if stale)
  if (cache) {
    return { ...cache.response, stale: true };
  }

  // Tier 5: Built-in fallback challenge object so page NEVER crashes
  return FALLBACK_PROBLEM;
}

/**
 * Direct fetch against official LeetCode GraphQL endpoint (`https://leetcode.com/graphql`).
 */
async function fetchDailyChallengeGraphQL(): Promise<DailyChallengeResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const query = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        link
        question {
          questionId
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
            slug
          }
          hints
          content
          exampleTestcases
          acRate
        }
      }
    }
  `;

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        activeDailyCodingChallengeQuestion?: {
          date?: string;
          link?: string;
          question?: {
            questionId?: string;
            questionFrontendId?: string;
            title?: string;
            titleSlug?: string;
            difficulty?: string;
            content?: string;
            exampleTestcases?: string;
            topicTags?: LeetCodeTopicTag[];
            hints?: string[];
            acRate?: number;
          };
        };
      };
    };

    const rawData = json?.data?.activeDailyCodingChallengeQuestion;
    if (!rawData || !rawData.question || !rawData.question.titleSlug) {
      return null;
    }

    const q = rawData.question;
    const link = rawData.link
      ? `https://leetcode.com${rawData.link}`
      : `https://leetcode.com/problems/${q.titleSlug}/`;

    const problem: DailyProblem = {
      questionId: String(q.questionId || q.questionFrontendId || "1"),
      title: String(q.title || ""),
      titleSlug: String(q.titleSlug || ""),
      difficulty: String(q.difficulty || "Medium"),
      content: String(q.content || ""),
      exampleTestcases: q.exampleTestcases ? String(q.exampleTestcases) : undefined,
      topicTags: Array.isArray(q.topicTags) ? q.topicTags : [],
      hints: Array.isArray(q.hints) ? q.hints : undefined,
      acRate: typeof q.acRate === "number" ? q.acRate : undefined,
      link,
    };

    return {
      date: rawData.date || utcDateKey(),
      problem,
      fetchedAt: new Date().toISOString(),
      source: "upstream",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Browser-direct fetch against alfa-leetcode-api wrapper.
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
  questionTitle?: unknown;
  titleSlug?: unknown;
  difficulty?: unknown;
  content?: unknown;
  question?: unknown;
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

  const rawTitle = question.title ?? question.questionTitle;
  const rawContent = question.content ?? question.question;

  const problem: DailyProblem = {
    questionId: String(question.questionId),
    title: String(rawTitle ?? ""),
    titleSlug: String(question.titleSlug),
    difficulty: String(question.difficulty ?? "Unknown"),
    content: String(rawContent ?? ""),
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
