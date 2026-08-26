// Frontend service for the LeetCode Daily Challenge.
//
// All LeetCode data flows through our Supabase Edge Functions (server-side
// fetches — no browser CORS proxies, no third-party wrapper rate limits):
//   1. LocalStorage Cache (if fresh for today UTC, with a real snippet).
//   2. Supabase Edge Function `leetcode-daily` (server-side: official LeetCode
//      GraphQL -> DB cache auto-healing).
//   3. Supabase Edge Function `leetcode-snippets` (per-problem snippet healing).
//   4. Stale LocalStorage Cache (re-enriched via edge functions).
//   5. Built-in Fallback Challenge (ensures zero user-facing crash).

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

const LS_CACHE_KEY = "leetcode_daily_challenge_cache_v9";
/** Soft cap on cache age before we stop returning it as "fresh". 36h gives
 *  enough slack to cover any timezone oddity while still being bounded. */
const LS_CACHE_FRESH_MS = 1000 * 60 * 60 * 36;

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
    codeSnippets: [
      {
        langSlug: "java",
        code: "class Solution {\n    public int maxActiveSectionsAfterTrade(String s) {\n        \n    }\n}",
      },
    ],
  },
};

export interface CodeSnippet {
  langSlug: string;
  code: string;
}

/** A snippet set is only "real" if it exists and none of the entries are the
 *  generic placeholder template that older broken fetch paths produced. */
function hasRealCodeSnippets(snippets?: CodeSnippet[]): boolean {
  if (!Array.isArray(snippets) || snippets.length === 0) return false;
  return snippets.some(
    (s) => s?.code && !s.code.includes("public int solve()"),
  );
}

/**
 * Heal a response whose codeSnippets are missing or placeholder-only by
 * querying our dedicated `leetcode-snippets` edge function (server-side
 * LeetCode GraphQL — reliable, no CORS/proxy involvement).
 */
async function enrichWithCodeSnippets(resp: DailyChallengeResponse): Promise<DailyChallengeResponse> {
  if (hasRealCodeSnippets(resp.problem.codeSnippets)) return resp;
  const slug = resp.problem.titleSlug;
  if (!slug) return resp;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const { data, error } = await supabase.functions.invoke<{
      codeSnippets?: CodeSnippet[];
    }>("leetcode-snippets", {
      method: "POST",
      body: { titleSlug: slug },
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(t);

    if (hasRealCodeSnippets(data?.codeSnippets)) {
      return {
        ...resp,
        problem: {
          ...resp.problem,
          codeSnippets: data!.codeSnippets,
        },
      };
    }
  } catch (err) {
    console.warn("[leetcodeDaily] leetcode-snippets edge function failed:", (err as Error).message);
  }
  return resp;
}

function purgeStaleSolveCaches(): void {
  try {
    // Purge old LS_CACHE versions and any cached response whose snippet is the generic solve() template
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("leetcode_daily_challenge_cache_v") && k !== LS_CACHE_KEY) {
        localStorage.removeItem(k);
      }
    }
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CachedEntry;
        if (
          !hasRealCodeSnippets(parsed?.response?.problem?.codeSnippets) &&
          parsed?.response?.problem?.titleSlug
        ) {
          localStorage.removeItem(LS_CACHE_KEY);
        }
      } catch {}
    }
  } catch {}
}

export async function fetchDailyChallenge(): Promise<DailyChallengeResponse> {
  purgeStaleSolveCaches();
  const cache = readCache();

  // Tier 0: Return fresh local cache — but only if it has a real snippet
  if (cache && cache.date === utcDateKey() && isFresh(cache)) {
    if (hasRealCodeSnippets(cache.response.problem.codeSnippets)) return cache.response;
    // stale snippet cache -> evict and refetch
    try { localStorage.removeItem(LS_CACHE_KEY); } catch {}
  }

  // Tier 1: Supabase edge function — server-side LeetCode GraphQL with DB
  // cache auto-healing. Includes codeSnippets; no browser CORS involved.
  try {
    const { data, error } = await supabase.functions.invoke<DailyChallengeResponse>(
      "leetcode-daily",
      { method: "GET" },
    );
    if (!error && data && data.problem?.questionId && data.problem?.title && data.problem?.content) {
      const enriched = await enrichWithCodeSnippets(data);
      writeCache({ date: utcDateKey(), response: enriched, cachedAt: Date.now() });
      return enriched;
    }
  } catch (err) {
    console.warn(
      "[leetcodeDaily] edge function threw, trying fallback:",
      (err as Error).message,
    );
  }

  // Tier 2: Serve any cached response (even if stale) — enrich if possible
  if (cache) {
    const enriched = await enrichWithCodeSnippets(cache.response);
    return { ...enriched, stale: true };
  }

  // Tier 3: Built-in fallback challenge object so page NEVER crashes
  return FALLBACK_PROBLEM;
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
