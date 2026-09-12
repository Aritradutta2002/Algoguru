// Frontend service for LeetCode user profile stats.
//
// Replaces the old direct browser call to the free public wrapper
// `alfa-leetcode-api.onrender.com`, which is shared, unauthenticated and
// heavily rate-limited (HTTP 429) — the cause of the intermittent
// "LeetCode API Error — The API is currently unavailable" toast on /profile.
//
// Resolution order (all LeetCode-shaped, no third-party wrapper in the happy path):
//   1. Fresh localStorage cache      -> instant, survives reloads and outages.
//   2. Supabase Edge Function `leetcode-user`
//        server-side LeetCode GraphQL -> DB cache auto-healing.
//   3. Stale localStorage cache      -> still show the user's real last-known stats.
//
// Only a genuinely unknown handle (HTTP 404) is reported as a user error.
// A transient outage with cached data never surfaces an error toast.

import { supabase } from "@/integrations/supabase/client";

export interface LeetcodeStats {
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

export interface LeetcodeStatsResult {
  stats: LeetcodeStats;
  /** True when live upstream data could not be reached and a cache was served. */
  stale: boolean;
  /** Where the data came from — useful for diagnostics/tests. */
  source: string;
}

/** Thrown only for a definitive "this username does not exist" answer. */
export class LeetcodeUserNotFoundError extends Error {
  constructor(username: string) {
    super(`LeetCode user "${username}" was not found.`);
    this.name = "LeetcodeUserNotFoundError";
  }
}

/** Thrown when upstream is down AND we have no cached data to serve. */
export class LeetcodeUnavailableError extends Error {
  constructor(message = "LeetCode is temporarily unavailable.") {
    super(message);
    this.name = "LeetcodeUnavailableError";
  }
}

const LS_PREFIX = "leetcode_user_stats_v1:";
/** Serve a local hit without touching the network. Stats move slowly. */
const LS_FRESH_MS = 6 * 60 * 60 * 1000;
/** After this we still serve the cache, but only if the network truly failed. */
const LS_STALE_MAX_MS = 30 * 24 * 60 * 60 * 1000;

const EDGE_FUNCTION_TIMEOUT_MS = 15_000;

interface CacheEntry {
  stats: LeetcodeStats;
  cachedAt: number;
}

function cacheKey(username: string): string {
  return `${LS_PREFIX}${username.toLowerCase()}`;
}

export function readLocalCache(username: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.stats || typeof parsed.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(username: string, stats: LeetcodeStats): void {
  try {
    localStorage.setItem(
      cacheKey(username),
      JSON.stringify({ stats, cachedAt: Date.now() } satisfies CacheEntry),
    );
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

function isShapeValid(value: unknown): value is LeetcodeStats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Partial<LeetcodeStats>;
  return (
    typeof stats.username === "string" &&
    typeof stats.totalSolved === "number" &&
    typeof stats.easySolved === "number" &&
    typeof stats.mediumSolved === "number" &&
    typeof stats.hardSolved === "number"
  );
}

interface EdgeResponse {
  stats?: LeetcodeStats;
  stale?: boolean;
  source?: string;
}

/**
 * Call the `leetcode-user` edge function. Resolves to the stats payload, the
 * string "not-found" for an unknown handle, or null when upstream/transport
 * failed (in which case callers fall back to cache).
 */
async function fetchFromEdgeFunction(
  username: string,
  force = false,
): Promise<LeetcodeStatsResult | "not-found" | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EDGE_FUNCTION_TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke<EdgeResponse>(
      "leetcode-user",
      {
        method: "POST",
        body: { username, force },
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      },
    );

    if (error) {
      // Supabase wraps non-2xx responses; surface a definitive 404 as not-found.
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 404) return "not-found";
      return null;
    }

    if (isShapeValid(data?.stats)) {
      return {
        stats: data!.stats!,
        stale: Boolean(data?.stale),
        source: data?.source ?? "upstream",
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve LeetCode stats for a handle using the cache-first, edge-function
 * backed strategy. Throws only for a definitive unknown user or when there is
 * neither live data nor any cache.
 *
 * @param options.force Bypass fresh caches and force an upstream refresh.
 */
export async function fetchLeetcodeUserStats(
  username: string,
  options: { force?: boolean } = {},
): Promise<LeetcodeStatsResult> {
  const handle = username?.trim();
  if (!handle) throw new LeetcodeUnavailableError("No LeetCode username set.");

  const cached = readLocalCache(handle);
  const cacheAge = cached ? Date.now() - cached.cachedAt : Number.POSITIVE_INFINITY;

  // Tier 1: fresh local cache.
  if (!options.force && cached && cacheAge < LS_FRESH_MS) {
    return { stats: cached.stats, stale: false, source: "local-cache" };
  }

  // Tier 2: server-side edge function (authoritative + shared DB cache).
  const result = await fetchFromEdgeFunction(handle, options.force);
  if (result === "not-found") throw new LeetcodeUserNotFoundError(handle);
  if (result) {
    writeLocalCache(handle, result.stats);
    return result;
  }

  // Tier 3: stale local cache — never blank out real stats on a transient outage.
  if (cached && cacheAge < LS_STALE_MAX_MS) {
    return { stats: cached.stats, stale: true, source: "local-cache-stale" };
  }

  throw new LeetcodeUnavailableError();
}

/** Exposed for tests. */
export const __internals = { LS_FRESH_MS, LS_STALE_MAX_MS, cacheKey };
