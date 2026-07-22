// LeetCode Daily Challenge edge function.
//
// Caching strategy (two-tier):
//   1. In-memory cache keyed by UTC YYYY-MM-DD. Fast path within an isolate lifetime.
//   2. Persistent `daily_challenge_cache` table. Durable record across cold starts.
//
// The function is unauthenticated (verify_jwt = false). Upstream is the public
// `alfa-leetcode-api.onrender.com/daily` endpoint, which is the same wrapper the
// existing Profile page already calls (so we inherit its reliability characteristics
// versus leetcode.com/graphql which is blocked by Cloudflare from browsers).
//
// On upstream failure, the function falls back to the DB cache (even if stale) so
// users still see *something* rather than an error. Only when both upstream and
// DB fail do we return a 502.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UPSTREAM_URL = "https://alfa-leetcode-api.onrender.com/daily";
const UPSTREAM_TIMEOUT_MS = 10_000;

interface TopicTag {
  name: string;
  slug?: string;
}

interface DailyProblem {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  content: string; // HTML
  exampleTestcases?: string;
  topicTags: TopicTag[];
  hints?: string[];
  acRate?: number;
  link: string;
  solution?: string | null;
}

interface CachedPayload {
  date: string;
  problem: DailyProblem;
  fetchedAt: string;
  source: "upstream" | "db-cache" | "memory-cache";
  stale?: boolean;
}

// Module-scoped in-memory cache. Resets on cold start; that is intentional —
// tier 2 (DB) handles cold starts. We mutate the fields rather than reassign
// the const.
const memoryCache: { key: string | null; value: CachedPayload | null } = {
  key: null,
  value: null,
};

function utcDateKey(d: Date = new Date()): string {
  // YYYY-MM-DD in UTC.
  return d.toISOString().slice(0, 10);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchUpstream(signal: AbortSignal): Promise<DailyProblem> {
  // Try direct LeetCode GraphQL endpoint first
  try {
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
            solution {
              content
            }
          }
        }
      }
    `;

    const gqlRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (gqlRes.ok) {
      const json = (await gqlRes.json()) as {
        data?: {
          activeDailyCodingChallengeQuestion?: {
            link?: string;
            question?: {
              questionId?: string;
              questionFrontendId?: string;
              title?: string;
              titleSlug?: string;
              difficulty?: string;
              content?: string;
              exampleTestcases?: string;
              topicTags?: TopicTag[];
              hints?: string[];
              acRate?: number;
              solution?: { content?: string };
            };
          };
        };
      };

      const rawData = json?.data?.activeDailyCodingChallengeQuestion;
      if (rawData?.question && rawData.question.titleSlug) {
        const q = rawData.question;
        const link = rawData.link
          ? `https://leetcode.com${rawData.link}`
          : `https://leetcode.com/problems/${q.titleSlug}/`;

        return {
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
          solution: q.solution?.content || null,
        };
      }
    }
  } catch (_e) {
    // Fall back to wrapper
  }

  const res = await fetch(UPSTREAM_URL, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Upstream returned HTTP ${res.status}`);
  }
  const raw = (await res.json()) as Record<string, unknown>;

  const question: Record<string, unknown> | null = (() => {
    if (raw && typeof raw === "object" && "questionId" in raw) return raw;
    const data = (raw as {
      data?: { activeDailyCodingChallenge?: { question?: unknown } };
    })?.data?.activeDailyCodingChallenge?.question;
    return (data as Record<string, unknown>) ?? null;
  })();

  if (!question || !question.questionId || !question.titleSlug) {
    throw new Error("Upstream payload missing required fields");
  }

  const topicTags = Array.isArray(question.topicTags)
    ? (question.topicTags as TopicTag[])
    : [];

  const rawTitle = question.title ?? question.questionTitle;
  const rawContent = question.content ?? question.question;

  let solutionHtml: string | null = null;
  try {
    const solRes = await fetch(`https://alfa-leetcode-api.onrender.com/officialSolution/${question.titleSlug}`, { signal });
    if (solRes.ok) {
      const solRaw = await solRes.json() as { data?: { question?: { solution?: { content?: string } } } };
      solutionHtml = solRaw?.data?.question?.solution?.content || null;
    }
  } catch (e) {
    console.error("Failed to fetch official solution:", e);
  }

  return {
    questionId: String(question.questionId),
    title: String(rawTitle ?? ""),
    titleSlug: String(question.titleSlug),
    difficulty: String(question.difficulty ?? "Unknown"),
    content: String(rawContent ?? ""),
    exampleTestcases: question.exampleTestcases
      ? String(question.exampleTestcases)
      : undefined,
    topicTags,
    hints: Array.isArray(question.hints) ? (question.hints as string[]) : undefined,
    acRate: typeof question.acRate === "number" ? question.acRate : undefined,
    link: `https://leetcode.com/problems/${String(question.titleSlug)}/`,
    solution: solutionHtml,
  };
}

interface CacheRow {
  date: string;
  problem_data: DailyProblem;
  fetched_at: string;
  source: string;
}

async function readDbCache(
  admin: ReturnType<typeof createClient>,
  date: string,
): Promise<CachedPayload | null> {
  const { data, error } = await admin
    .from("daily_challenge_cache")
    .select("date, problem_data, fetched_at, source")
    .eq("date", date)
    .maybeSingle<CacheRow>();
  if (error || !data) return null;
  if (!data.problem_data.title || !data.problem_data.content) return null;
  return {
    date: data.date,
    problem: data.problem_data,
    fetchedAt: data.fetched_at,
    source: "db-cache",
  };
}

async function readLatestDbCache(
  admin: ReturnType<typeof createClient>,
): Promise<CachedPayload | null> {
  const { data, error } = await admin
    .from("daily_challenge_cache")
    .select("date, problem_data, fetched_at, source")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle<CacheRow>();
  if (error || !data) return null;
  if (!data.problem_data.title || !data.problem_data.content) return null;
  return {
    date: data.date,
    problem: data.problem_data,
    fetchedAt: data.fetched_at,
    source: "db-cache",
    stale: true,
  };
}

async function writeDbCache(
  admin: ReturnType<typeof createClient>,
  date: string,
  problem: DailyProblem,
): Promise<void> {
  // upsert; on conflict (date already exists) keep the existing row stable and
  // refresh problem_data + fetched_at so the cache reflects the latest upstream.
  const { error } = await admin.from("daily_challenge_cache").upsert(
    {
      date,
      problem_data: problem,
      fetched_at: new Date().toISOString(),
      source: "upstream",
    },
    { onConflict: "date" },
  );
  if (error) {
    console.error("Failed to persist daily challenge cache:", error.message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const dateKey = utcDateKey();

  // Tier 1: in-memory cache. Resets on cold start; tier 2 takes over.
  if (memoryCache.key === dateKey && memoryCache.value) {
    return jsonResponse(memoryCache.value);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Try upstream first.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const problem = await fetchUpstream(controller.signal);
    clearTimeout(timeout);

    // Best-effort persist + in-memory prime.
    await writeDbCache(admin, dateKey, problem);
    const payload: CachedPayload = {
      date: dateKey,
      problem,
      fetchedAt: new Date().toISOString(),
      source: "upstream",
    };
    memoryCache.key = dateKey;
    memoryCache.value = payload;
    return jsonResponse(payload);
  } catch (err) {
    clearTimeout(timeout);
    console.error("Upstream fetch failed:", (err as Error).message);

    // Fall back to today's DB row first, then the most recent row.
    const todays = await readDbCache(admin, dateKey);
    if (todays) return jsonResponse(todays);
    const latest = await readLatestDbCache(admin);
    if (latest) return jsonResponse(latest);

    return jsonResponse(
      {
        error:
          "Upstream LeetCode API is unavailable and no cached challenge exists.",
        detail: (err as Error).message,
      },
      502,
    );
  }
});
