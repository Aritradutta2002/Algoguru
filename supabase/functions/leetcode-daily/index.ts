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
// Overall budget for resolving the playgrounds referenced by one editorial.
const PLAYGROUND_BUDGET_MS = 15_000;

/* ------------------------------------------------------------------ */
/* Editorial playground inlining                                       */
/* ------------------------------------------------------------------ */
//
// LeetCode's official editorial ships each approach's implementation as a
// playground *iframe*, not as a fenced code block:
//
//   #### Implementation
//   <iframe src="https://leetcode.com/playground/ZaDAqWnF/shared" ...></iframe>
//
// That URL is unusable from a browser — it returns 403 + a Cloudflare challenge
// to non-browser clients and sets `X-Frame-Options: SAMEORIGIN`, so it can
// neither be fetched client-side nor embedded. The reader was therefore shown a
// dead "View Implementation on LeetCode" link instead of any code.
//
// We resolve each playground server-side via LeetCode's GraphQL `playground`
// query. A playground holds the same solution in ~9 languages, and the reader
// should be able to switch between them, so rather than baking one language
// into a fenced code block we replace the iframe with a compact placeholder
// token and attach the full language set to `problem.solutionBlocks`:
//
//   <!--solution-block:0-->
//
// The client swaps each token for a language-switching code block. The token
// survives markdown/HTML round-tripping (react-markdown passes comments through
// rehype-raw) and keeps the editorial's prose flow intact.
//
// The pure counterparts of these helpers live in `src/lib/editorialPlayground.ts`
// (unit tested there). Keep the regex + token logic in sync with that file.

const PLAYGROUND_IFRAME_RE =
  /<iframe[^>]*\bsrc\s*=\s*["']https?:\/\/(?:www\.)?leetcode\.com\/playground\/([A-Za-z0-9_-]+)(?:\/[^"']*)?["'][^>]*>\s*<\/iframe>/gi;

/** Placeholder left in the markdown; the client renders the real block. */
const SOLUTION_BLOCK_TOKEN_RE = /<!--\s*solution-block:(\d+)\s*-->/g;

function solutionBlockToken(index: number): string {
  return `\n\n<!--solution-block:${index}-->\n\n`;
}

/** Map a LeetCode language slug onto one the UI's highlighter understands. */
function normalizeLanguageSlug(slug: string | null | undefined): string {
  const s = (slug || "").toLowerCase().trim();
  const map: Record<string, string> = {
    "c++": "cpp",
    cpp: "cpp",
    "c#": "csharp",
    csharp: "csharp",
    cs: "csharp",
    py: "python",
    python3: "python",
    python: "python",
    js: "javascript",
    javascript: "javascript",
    ts: "typescript",
    typescript: "typescript",
    go: "go",
    golang: "go",
    rb: "ruby",
    ruby: "ruby",
    rs: "rust",
    rust: "rust",
    kt: "kotlin",
    kotlin: "kotlin",
  };
  return map[s] || s || "text";
}

/** Display label for a language slug (used by the client's switcher). */
function languageLabel(slug: string): string {
  const labels: Record<string, string> = {
    cpp: "C++",
    java: "Java",
    c: "C",
    csharp: "C#",
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    go: "Go",
    rust: "Rust",
    ruby: "Ruby",
    kotlin: "Kotlin",
    swift: "Swift",
    php: "PHP",
    dart: "Dart",
    scala: "Scala",
    elixir: "Elixir",
    erlang: "Erlang",
    racket: "Racket",
    sql: "SQL",
  };
  return labels[slug] || slug.toUpperCase();
}

/** True when markdown still contains at least one playground iframe. */
function hasPlaygroundIframe(markdown: string | null | undefined): boolean {
  if (!markdown) return false;
  PLAYGROUND_IFRAME_RE.lastIndex = 0;
  return PLAYGROUND_IFRAME_RE.test(markdown);
}

/** A resolved editorial implementation block: one solution, many languages. */
interface SolutionBlock {
  /** Language the editorial author had selected; the client's fallback. */
  defaultLangSlug: string;
  languages: { langSlug: string; label: string; code: string }[];
}

/**
 * Fetch a LeetCode playground and return *every* language it holds, so the
 * reader can switch between them. Returns null on any failure (never throws) so
 * a blocked/empty playground degrades to the old link instead of breaking the
 * whole editorial.
 */
async function fetchPlaygroundCode(uuid: string): Promise<SolutionBlock | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `
          query playground($uuid: String!) {
            playground(uuid: $uuid) {
              selectedLangSlug
              playgroundcodeSet {
                code
                langSlug
              }
            }
          }
        `,
        variables: { uuid },
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        playground?: {
          selectedLangSlug?: string;
          playgroundcodeSet?: { code?: string; langSlug?: string }[];
        };
      };
    };
    const pg = json?.data?.playground;

    // Dedupe by language and drop empty entries; a playground repeats a language
    // once per file, and only the first non-empty variant is useful here.
    const byLang = new Map<string, string>();
    for (const entry of pg?.playgroundcodeSet || []) {
      const code = entry?.code?.trim();
      if (!code) continue;
      const slug = normalizeLanguageSlug(entry.langSlug);
      if (!byLang.has(slug)) byLang.set(slug, String(entry.code));
    }
    if (byLang.size === 0) return null;

    const languages = [...byLang.entries()].map(([langSlug, code]) => ({
      langSlug,
      label: languageLabel(langSlug),
      code,
    }));

    // The language the editorial author had selected, else the first available.
    const preferred = normalizeLanguageSlug(pg?.selectedLangSlug);
    const defaultLangSlug = languages.some((l) => l.langSlug === preferred)
      ? preferred
      : languages[0].langSlug;

    return { defaultLangSlug, languages };
  } catch (_e) {
    return null;
  }
}

/**
 * Replace every resolvable playground iframe in the editorial markdown with a
 * numbered placeholder token, returning the tokens' language sets alongside.
 * Unresolvable iframes are left alone so the client can show its fallback.
 */
async function extractSolutionBlocks(
  markdown: string | null,
): Promise<{ solution: string | null; solutionBlocks: SolutionBlock[] }> {
  if (!markdown || !hasPlaygroundIframe(markdown)) {
    return { solution: markdown, solutionBlocks: [] };
  }

  // Unique UUIDs, first-seen order.
  const seen = new Set<string>();
  const uuids: string[] = [];
  const scan = new RegExp(PLAYGROUND_IFRAME_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = scan.exec(markdown)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      uuids.push(m[1]);
    }
  }
  if (uuids.length === 0) return { solution: markdown, solutionBlocks: [] };

  // Resolve in parallel under one overall budget so a slow playground cannot
  // stall the whole request.
  const resolved = await Promise.race([
    Promise.allSettled(uuids.map((u) => fetchPlaygroundCode(u))),
    new Promise<(PromiseSettledResult<SolutionBlock | null>)[]>((resolve) =>
      setTimeout(
        () =>
          resolve(
            uuids.map(
              () =>
                ({ status: "fulfilled", value: null }) as PromiseFulfilledResult<SolutionBlock | null>,
            ),
          ),
        PLAYGROUND_BUDGET_MS,
      ),
    ),
  ]);

  const byUuid = new Map<string, SolutionBlock>();
  resolved.forEach((r, i) => {
    // A block with no usable language is as good as missing — leave its iframe
    // in place so the client keeps the external-link fallback.
    if (r.status === "fulfilled" && r.value?.languages.length) byUuid.set(uuids[i], r.value);
  });
  if (byUuid.size === 0) return { solution: markdown, solutionBlocks: [] };

  // Assign one stable index per resolved UUID so a repeated playground shares a
  // single block instead of duplicating code in the payload.
  const indexByUuid = new Map<string, number>();
  for (const uuid of uuids) {
    if (byUuid.has(uuid) && !indexByUuid.has(uuid)) indexByUuid.set(uuid, indexByUuid.size);
  }

  const re = new RegExp(PLAYGROUND_IFRAME_RE.source, "gi");
  const solution = markdown.replace(re, (whole: string, uuid: string) => {
    const index = indexByUuid.get(uuid);
    if (index === undefined) return whole;
    return solutionBlockToken(index);
  });

  const solutionBlocks = [...indexByUuid.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([uuid]) => byUuid.get(uuid)!);

  return { solution, solutionBlocks };
}

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
  /** Multi-language implementation blocks referenced by `solution` tokens. */
  solutionBlocks?: SolutionBlock[];
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
        // Editorials embed implementation code as playground iframes; resolve
        // them into language-switchable blocks the client can render.
        const { solution, solutionBlocks } = await extractSolutionBlocks(solutionContent);

        // Guard against missing/placeholder snippets even on the happy path.
        let snippets = Array.isArray(q.codeSnippets) ? q.codeSnippets : undefined;
        if (!hasRealCodeSnippets(snippets)) {
          const healed = await fetchOfficialCodeSnippets(String(q.titleSlug));
          if (healed) snippets = healed;
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
          solution,
          solutionBlocks,
          codeSnippets: snippets,
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
  const { solution, solutionBlocks } = await extractSolutionBlocks(solutionHtml);

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
    solution,
    solutionBlocks,
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

// A snippet set is only "real" if it exists and none of the entries are the
// generic placeholder template that older broken fetch paths stored.
function hasRealCodeSnippets(
  snippets?: { langSlug: string; code: string }[],
): boolean {
  if (!Array.isArray(snippets) || snippets.length === 0) return false;
  return snippets.some((s) => s?.code && !s.code.includes("public int solve()"));
}

// Cache rows written before the solution fetch was reliable may be missing the
// editorial or codeSnippets (or contain the old generic solve() placeholder).
// Rows cached while editorial code was still trapped in playground iframes also
// need healing, as do rows cached when only a single language was extracted.
// When serving such a row, try to backfill it once and persist the fix so later
// visitors don't repeat the work.
async function backfillMissingData(
  admin: ReturnType<typeof createClient>,
  payload: CachedPayload,
): Promise<void> {
  let updated = false;

  // Needs work when the editorial is missing, still holds raw playground
  // iframes, or predates multi-language blocks (tokens present but no blocks).
  const needsSolution =
    !payload.problem.solution ||
    hasPlaygroundIframe(payload.problem.solution) ||
    (SOLUTION_BLOCK_TOKEN_RE.test(payload.problem.solution) &&
      !payload.problem.solutionBlocks?.length);
  SOLUTION_BLOCK_TOKEN_RE.lastIndex = 0;

  if (needsSolution) {
    try {
      // Always re-fetch the editorial from upstream here rather than reusing a
      // cached `solution`: an old cache may hold single-language fenced blocks,
      // which cannot be upgraded to multi-language blocks without the iframes.
      const fresh = await fetchOfficialSolution(payload.problem.titleSlug);
      const { solution, solutionBlocks } = await extractSolutionBlocks(fresh);
      if (solution && solution !== payload.problem.solution) {
        payload.problem.solution = solution;
        payload.problem.solutionBlocks = solutionBlocks;
        updated = true;
      }
    } catch (e) {
      console.error("Solution backfill failed:", (e as Error).message);
    }
  }

  if (!hasRealCodeSnippets(payload.problem.codeSnippets)) {
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
