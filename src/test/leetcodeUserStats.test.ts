import { describe, it, expect, beforeEach, vi } from "vitest";

// The module under test imports the supabase client (which reads Vite env at
// import time), so stub it before importing.
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import {
  fetchLeetcodeUserStats,
  readLocalCache,
  LeetcodeUserNotFoundError,
  LeetcodeUnavailableError,
} from "@/lib/leetcodeUserStats";

const STATS = {
  username: "demo",
  totalSolved: 250,
  totalQuestions: 4047,
  easySolved: 99,
  totalEasy: 963,
  mediumSolved: 129,
  totalMedium: 2111,
  hardSolved: 22,
  totalHard: 973,
  ranking: 642842,
  submissionCalendar: { "1487059200": 2 },
  activeYears: [2017],
};

beforeEach(() => {
  localStorage.clear();
  invokeMock.mockReset();
});

describe("fetchLeetcodeUserStats", () => {
  it("returns live data from the edge function and caches it locally", async () => {
    invokeMock.mockResolvedValue({
      data: { stats: STATS, source: "upstream", stale: false },
      error: null,
    });

    const result = await fetchLeetcodeUserStats("demo");

    expect(result.stats.totalSolved).toBe(250);
    expect(result.source).toBe("upstream");
    expect(invokeMock).toHaveBeenCalledWith(
      "leetcode-user",
      expect.objectContaining({ method: "POST" }),
    );
    // Cached for the next call.
    expect(readLocalCache("demo")?.stats.totalSolved).toBe(250);
  });

  it("serves a fresh local cache without calling the network", async () => {
    invokeMock.mockResolvedValue({
      data: { stats: STATS, source: "upstream", stale: false },
      error: null,
    });
    await fetchLeetcodeUserStats("demo");
    invokeMock.mockClear();

    const second = await fetchLeetcodeUserStats("demo");

    expect(second.source).toBe("local-cache");
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("falls back to a stale cache instead of erroring when upstream fails", async () => {
    // Seed an old cache entry (older than the fresh window, inside stale max).
    localStorage.setItem(
      "leetcode_user_stats_v1:demo",
      JSON.stringify({ stats: STATS, cachedAt: Date.now() - 24 * 60 * 60 * 1000 }),
    );
    invokeMock.mockResolvedValue({ data: null, error: new Error("network down") });

    const result = await fetchLeetcodeUserStats("demo");

    expect(result.stale).toBe(true);
    expect(result.source).toBe("local-cache-stale");
    expect(result.stats.totalSolved).toBe(250);
  });

  it("surfaces a definitive unknown user as LeetcodeUserNotFoundError", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: "not found", context: { status: 404 } },
    });

    await expect(fetchLeetcodeUserStats("ghost")).rejects.toBeInstanceOf(
      LeetcodeUserNotFoundError,
    );
  });

  it("throws LeetcodeUnavailableError when upstream fails and no cache exists", async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error("network down") });

    await expect(fetchLeetcodeUserStats("demo")).rejects.toBeInstanceOf(
      LeetcodeUnavailableError,
    );
  });

  it("ignores a malformed edge-function payload and falls back to cache", async () => {
    localStorage.setItem(
      "leetcode_user_stats_v1:demo",
      JSON.stringify({ stats: STATS, cachedAt: Date.now() - 24 * 60 * 60 * 1000 }),
    );
    invokeMock.mockResolvedValue({
      data: { stats: { username: "demo" }, source: "upstream" },
      error: null,
    });

    const result = await fetchLeetcodeUserStats("demo");

    expect(result.stale).toBe(true);
  });

  it("force bypasses the fresh cache", async () => {
    invokeMock.mockResolvedValue({
      data: { stats: STATS, source: "upstream", stale: false },
      error: null,
    });
    await fetchLeetcodeUserStats("demo");
    invokeMock.mockClear();

    const forced = await fetchLeetcodeUserStats("demo", { force: true });

    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(forced.source).toBe("upstream");
  });
});
