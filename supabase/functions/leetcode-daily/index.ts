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
// The official-solution fetch gets its own budget so a slow problem fetch
// never starves/aborts it (this previously caused editorials to vanish).
const SOLUTION_TIMEOUT_MS = 12_000;

// Fetch the official editorial for a problem. Tries LeetCode GraphQL first
// (returns content only for FREE public editorials), then the alfa wrapper
// endpoint as a fallback. Returns null when neither yields content.
async function fetchOfficialSolution(titleSlug: string): Promise<string | null> {
  // 1) Direct LeetCode GraphQL — highest fidelity, includes full HTML.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOLUTION_TIMEOUT_MS);
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `
          query officialSolution($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              solution {
                content
              }
            }
          }
        `,
        variables: { titleSlug },
      }),
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { question?: { solution?: { content?: string } } };
      };
      const content = json?.data?.question?.solution?.content;
      if (content) return content;
    }
  } catch (_e) {
    // fall through to wrapper
  }

  // 2) alfa wrapper fallback.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOLUTION_TIMEOUT_MS);
    const solRes = await fetch(`https://alfa-leetcode-api.onrender.com/officialSolution/${titleSlug}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (solRes.ok) {
      const solRaw = await solRes.json() as { data?: { question?: { solution?: { content?: string } } } };
      return solRaw?.data?.question?.solution?.content || null;
    }
  } catch (e) {
    console.error("Failed to fetch official solution:", e);
  }

  return null;
}

// Fetch codeSnippets for a problem using direct LeetCode GraphQL.
// This is the most reliable method as client-side wrapper APIs often omit it.
async function fetchOfficialCodeSnippets(titleSlug: string): Promise<{ langSlug: string; code: string }[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOLUTION_TIMEOUT_MS);
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              codeSnippets {
                langSlug
                code
              }
            }
          }
        `,
        variables: { titleSlug },
      }),
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { question?: { codeSnippets?: { langSlug: string; code: string }[] } };
      };
      const snippets = json?.data?.question?.codeSnippets;
      if (Array.isArray(snippets) && snippets.length > 0) return snippets;
    }
  } catch (_e) {
    // Ignore errors
  }
  return null;
}

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
  codeSnippets?: { langSlug: string; code: string }[];
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
            codeSnippets {
              langSlug
              code
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
              codeSnippets?: { langSlug: string; code: string }[];
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

        // GraphQL omits solution content for member-only editorials — retry
        // via the dedicated helper before giving up.
        let solutionContent = q.solution?.content || null;
        if (!solutionContent) {
          solutionContent = await fetchOfficialSolution(String(q.titleSlug));
        }

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
          solution: solutionContent,
          codeSnippets: q.codeSnippets,
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
  solutionHtml = await fetchOfficialSolution(String(question.titleSlug));

  // Ensure codeSnippets is populated even when upstream is alfa wrapper (which omits it)
  let codeSnippets = Array.isArray(question.codeSnippets) ? (question.codeSnippets as any) : undefined;
  if (!codeSnippets) {
    const fetchedSnippets = await fetchOfficialCodeSnippets(String(question.titleSlug));
    if (fetchedSnippets) codeSnippets = fetchedSnippets;
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
    codeSnippets,
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

// Cache rows written before the solution fetch was reliable may be missing the
// editorial or codeSnippets. When serving such a row, try to backfill it once
// and persist the fix so later visitors don't repeat the work.
async function backfillMissingData(
  admin: ReturnType<typeof createClient>,
  payload: CachedPayload,
): Promise<void> {
  let updated = false;

  if (!payload.problem.solution) {
    try {
      const solution = await fetchOfficialSolution(payload.problem.titleSlug);
      if (solution) {
        payload.problem.solution = solution;
        updated = true;
      }
    } catch (e) {
      console.error("Solution backfill failed:", (e as Error).message);
    }
  }

  if (!payload.problem.codeSnippets || payload.problem.codeSnippets.length === 0) {
    try {
      const snippets = await fetchOfficialCodeSnippets(payload.problem.titleSlug);
      if (snippets) {
        payload.problem.codeSnippets = snippets;
        updated = true;
      }
    } catch (e) {
      console.error("Snippets backfill failed:", (e as Error).message);
    }
  }

  if (updated) {
    try {
      await admin
        .from("daily_challenge_cache")
        .update({ problem_data: payload.problem, fetched_at: new Date().toISOString() })
        .eq("date", payload.date);
    } catch (e) {
      console.error("Failed to persist backfilled data:", (e as Error).message);
    }
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
    if (todays) {
      await backfillMissingData(admin, todays);
      return jsonResponse(todays);
    }
    const latest = await readLatestDbCache(admin);
    if (latest) {
      await backfillMissingData(admin, latest);
      return jsonResponse(latest);
    }

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
