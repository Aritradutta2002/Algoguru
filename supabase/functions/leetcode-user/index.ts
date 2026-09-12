// LeetCode user-profile stats edge function.
//
// WHY THIS EXISTS
// The Profile page used to call the free third-party wrapper
// `alfa-leetcode-api.onrender.com` directly from the browser. That wrapper is
// shared, unauthenticated and heavily rate-limited: it routinely answers
// HTTP 429 ("Too Many Requests") or cold-starts for ~30s on Render's free
// tier. That is the source of the intermittent
// "LeetCode API Error — The API is currently unavailable" toast.
//
// This function replaces it with a server-side path to LeetCode's own public
// GraphQL API (`leetcode.com/graphql`), which is the authoritative source and
// is NOT rate-limited the way the free wrapper is. The browser cannot call
// that endpoint directly (Cloudflare + CORS), hence the server-side hop.
//
// RELIABILITY MODEL (in order):
//   1. In-memory cache (per isolate) within MEMORY_TTL_MS  -> instant.
//   2. Fresh DB row within FRESH_TTL_MS                    -> instant, no upstream call.
//   3. LeetCode GraphQL (with retries/backoff)             -> writes DB + memory cache.
//   4. Stale DB row (marked stale: true)                   -> still a real answer.
//   5. Legacy wrapper (alfa) as a last-ditch upstream       -> only if GraphQL fails.
//
// The function never returns a "no data" error while a cached row exists, so
// the Profile page keeps rendering the user's real stats even during a
// LeetCode outage. Only a genuinely unknown username yields a 404.
//
// Usage:
//   GET  /leetcode-user?username=someUser
//   POST /leetcode-user   { "username": "someUser", "force": true }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPHQL_URL = "https://leetcode.com/graphql";
const LEGACY_WRAPPER = "https://alfa-leetcode-api.onrender.com";

const UPSTREAM_TIMEOUT_MS = 10_000;
const CALENDAR_TIMEOUT_MS = 10_000;
const MAX_YEARS = 4;
/** Serve an in-memory hit without touching the network. */
const MEMORY_TTL_MS = 15 * 60 * 1000;
/** Serve a DB hit without touching the network (stats move slowly). */
const FRESH_TTL_MS = 30 * 60 * 1000;
/** A stale DB row older than this is still served, but we try upstream first. */
const STALE_MAX_MS = 30 * 24 * 60 * 60 * 1000;

const USERNAME_RE = /^[A-Za-z0-9_-]{1,40}$/;

interface LeetcodeStats {
  username: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number | null;
  submissionCalendar: Record<string, number>;
  activeYears: number[];
}

interface CachedPayload {
  username: string;
  stats: LeetcodeStats;
  fetchedAt: string;
  source: "upstream" | "db-cache" | "memory-cache";
  stale?: boolean;
}

// Module-scoped in-memory cache. Survives warm invocations of the same isolate.
const memoryCache = new Map<string, CachedPayload>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "AlgoGuru/1.0 (+https://www.algoguru.online)",
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json?.data ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
      userCalendar { activeYears }
    }
    allQuestionsCount { difficulty count }
  }
`;

const CALENDAR_QUERY = `
  query userCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) { submissionCalendar }
    }
  }
`;

function parseCalendar(raw: unknown): Record<string, number> {
  let source: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      source = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  } else if (raw && typeof raw === "object") {
    source = raw as Record<string, unknown>;
  }
  const out: Record<string, number> = {};
  for (const [dateKey, value] of Object.entries(source)) {
    const count = Number(value);
    if (dateKey && Number.isFinite(count) && count > 0) {
      out[dateKey] = (out[dateKey] ?? 0) + count;
    }
  }
  return out;
}

function mergeCalendars(calendars: Array<Record<string, number>>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const calendar of calendars) {
    for (const [key, count] of Object.entries(calendar)) {
      merged[key] = (merged[key] ?? 0) + count;
    }
  }
  return merged;
}

type SolveCount = { difficulty: string; count: number };

async function fetchStatsFromGraphQL(
  username: string,
): Promise<LeetcodeStats | "not-found" | null> {
  const data = await gql<{
    matchedUser?: {
      username?: string;
      profile?: { ranking?: number };
      submitStatsGlobal?: { acSubmissionNum?: SolveCount[] };
      userCalendar?: { activeYears?: number[] };
    } | null;
    allQuestionsCount?: SolveCount[];
  }>(PROFILE_QUERY, { username });

  // A successful response with matchedUser === null means the handle is real
  // but unknown to LeetCode — that is a definitive "not found", not an outage.
  if (data && data.matchedUser === null) return "not-found";
  if (!data?.matchedUser) return null;

  const user = data.matchedUser;
  const solved = user.submitStatsGlobal?.acSubmissionNum ?? [];
  const totals = data.allQuestionsCount ?? [];

  const countFor = (list: SolveCount[], difficulty: string): number =>
    Number(list.find((entry) => entry.difficulty === difficulty)?.count ?? 0);

  const currentYear = new Date().getUTCFullYear();
  const activeYears = Array.isArray(user.userCalendar?.activeYears)
    ? user.userCalendar!.activeYears!
        .map(Number)
        .filter((year) => Number.isInteger(year) && year <= currentYear)
    : [];

  const yearsToFetch = Array.from(
    new Set(activeYears.length > 0 ? activeYears : [currentYear]),
  )
    .sort((a, b) => b - a)
    .slice(0, MAX_YEARS);

  // Calendar heatmap is secondary data: fetch years in parallel and tolerate
  // partial failures, since solved counts are what the profile card needs most.
  const calendarResults = await Promise.allSettled(
    yearsToFetch.map((year) =>
      gql<{
        matchedUser?: { userCalendar?: { submissionCalendar?: string } } | null;
      }>(CALENDAR_QUERY, { username, year }, CALENDAR_TIMEOUT_MS),
    ),
  );

  const calendars: Array<Record<string, number>> = [];
  for (const result of calendarResults) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const raw = result.value.matchedUser?.userCalendar?.submissionCalendar;
    calendars.push(parseCalendar(raw));
  }

  // The no-year query returns the current year for demo users with cold data;
  // merge it as well so we never show an empty heatmap when data exists.
  const baseData = await gql<{
    matchedUser?: { userCalendar?: { submissionCalendar?: string } } | null;
  }>(CALENDAR_QUERY, { username }, CALENDAR_TIMEOUT_MS);
  const baseCalendar = parseCalendar(
    baseData?.matchedUser?.userCalendar?.submissionCalendar,
  );
  if (Object.keys(baseCalendar).length > 0) calendars.push(baseCalendar);

  const submissionCalendar = mergeCalendars(calendars);

  const derivedYears = Array.from(
    new Set([
      ...activeYears,
      ...Object.keys(submissionCalendar)
        .map((key) => {
          const timestamp = Number(key);
          if (Number.isFinite(timestamp)) {
            return new Date(timestamp * 1000).getUTCFullYear();
          }
          const parsed = new Date(key);
          return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
        })
        .filter((year): year is number => year !== null && year <= currentYear),
    ]),
  ).sort((a, b) => b - a);

  const ranking = user.profile?.ranking;

  return {
    username: user.username ?? username,
    totalSolved: countFor(solved, "All"),
    totalQuestions: countFor(totals, "All") || 3000,
    easySolved: countFor(solved, "Easy"),
    totalEasy: countFor(totals, "Easy"),
    mediumSolved: countFor(solved, "Medium"),
    totalMedium: countFor(totals, "Medium"),
    hardSolved: countFor(solved, "Hard"),
    totalHard: countFor(totals, "Hard"),
    ranking: typeof ranking === "number" && ranking > 0 ? ranking : null,
    submissionCalendar,
    activeYears: derivedYears,
  };
}

/**
 * Last-ditch upstream: the legacy public wrapper. Only used when LeetCode's
 * own GraphQL is unreachable, and reuses the same shape so callers don't care.
 * It is intentionally last because it is the flaky dependency we are replacing.
 */
async function fetchStatsFromLegacyWrapper(
  username: string,
): Promise<LeetcodeStats | "not-found" | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`${LEGACY_WRAPPER}/${encodeURIComponent(username)}/solved`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return "not-found";
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data?.errors || data?.solvedProblem === undefined) return null;

    const totals = Array.isArray(data.totalSubmissionNum)
      ? (data.totalSubmissionNum as SolveCount[])
      : [];
    const countFor = (difficulty: string): number =>
      Number(totals.find((entry) => entry.difficulty === difficulty)?.count ?? 0);

    return {
      username,
      totalSolved: Number(data.solvedProblem ?? 0),
      totalQuestions: countFor("All") || 3000,
      easySolved: Number(data.easySolved ?? 0),
      totalEasy: countFor("Easy"),
      mediumSolved: Number(data.mediumSolved ?? 0),
      totalMedium: countFor("Medium"),
      hardSolved: Number(data.hardSolved ?? 0),
      totalHard: countFor("Hard"),
      ranking: null,
      submissionCalendar: {},
      activeYears: [],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Try LeetCode GraphQL a few times before falling back — 429/5xx are transient. */
async function fetchStatsWithRetry(
  username: string,
): Promise<LeetcodeStats | "not-found" | null> {
  const backoffMs = [0, 600, 1800];
  for (let attempt = 0; attempt < backoffMs.length; attempt++) {
    if (backoffMs[attempt] > 0) await sleep(backoffMs[attempt]);
    const result = await fetchStatsFromGraphQL(username);
    if (result === "not-found") return "not-found";
    if (result) return result;
  }
  return null;
}

interface CacheRow {
  username: string;
  stats_data: LeetcodeStats;
  fetched_at: string;
}

async function readDbCache(
  admin: ReturnType<typeof createClient>,
  username: string,
): Promise<CacheRow | null> {
  const { data, error } = await admin
    .from("leetcode_user_cache")
    .select("username, stats_data, fetched_at")
    .eq("username", username)
    .maybeSingle<CacheRow>();
  if (error || !data || !data.stats_data) return null;
  return data;
}

async function writeDbCache(
  admin: ReturnType<typeof createClient>,
  stats: LeetcodeStats,
): Promise<void> {
  const { error } = await admin.from("leetcode_user_cache").upsert(
    {
      username: stats.username,
      stats_data: stats,
      fetched_at: new Date().toISOString(),
      source: "upstream",
    },
    { onConflict: "username" },
  );
  if (error) {
    console.error("Failed to persist leetcode user cache:", error.message);
  }
}

function ageMs(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? Date.now() - parsed : Number.POSITIVE_INFINITY;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let username: string | null = null;
  let force = false;

  const url = new URL(req.url);
  username = url.searchParams.get("username");
  force = url.searchParams.get("force") === "true";

  if (req.method === "POST") {
    try {
      const body = (await req.json()) as { username?: string; force?: boolean };
      username = body?.username ?? username;
      force = body?.force ?? force;
    } catch {
      // ignore body parse errors; fall back to query params
    }
  }

  username = username?.trim() ?? null;
  if (!username || !USERNAME_RE.test(username)) {
    return jsonResponse(
      { error: "Missing or invalid parameter: username" },
      400,
    );
  }
  const cacheKey = username.toLowerCase();

  // Tier 1: in-memory cache.
  const memoryHit = memoryCache.get(cacheKey);
  if (!force && memoryHit && ageMs(memoryHit.fetchedAt) < MEMORY_TTL_MS) {
    return jsonResponse({ ...memoryHit, source: "memory-cache" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : null;

  const dbRow = admin ? await readDbCache(admin, cacheKey) : null;

  // Tier 2: fresh DB row — no upstream call needed.
  if (!force && dbRow && ageMs(dbRow.fetched_at) < FRESH_TTL_MS) {
    const payload: CachedPayload = {
      username: dbRow.stats_data.username ?? username,
      stats: dbRow.stats_data,
      fetchedAt: dbRow.fetched_at,
      source: "db-cache",
    };
    memoryCache.set(cacheKey, payload);
    return jsonResponse(payload);
  }

  // Tier 3: authoritative upstream.
  let stats = await fetchStatsWithRetry(username);
  if (stats === "not-found") {
    return jsonResponse(
      { error: "not_found", message: `LeetCode user "${username}" was not found.` },
      404,
    );
  }
  if (!stats) {
    // Tier 4: legacy wrapper as a secondary upstream before giving up.
    stats = await fetchStatsFromLegacyWrapper(username);
    if (stats === "not-found") {
      return jsonResponse(
        { error: "not_found", message: `LeetCode user "${username}" was not found.` },
        404,
      );
    }
  }

  if (stats) {
    const payload: CachedPayload = {
      username: stats.username,
      stats,
      fetchedAt: new Date().toISOString(),
      source: "upstream",
    };
    memoryCache.set(cacheKey, payload);
    if (admin) await writeDbCache(admin, stats);
    return jsonResponse(payload);
  }

  // Tier 5: serve a stale DB row rather than surfacing an error.
  if (dbRow && ageMs(dbRow.fetched_at) < STALE_MAX_MS) {
    const payload: CachedPayload = {
      username: dbRow.stats_data.username ?? username,
      stats: dbRow.stats_data,
      fetchedAt: dbRow.fetched_at,
      source: "db-cache",
      stale: true,
    };
    memoryCache.set(cacheKey, payload);
    return jsonResponse(payload);
  }

  return jsonResponse(
    {
      error: "upstream_unavailable",
      message:
        "LeetCode is temporarily unreachable and no cached stats exist yet.",
    },
    502,
  );
});
