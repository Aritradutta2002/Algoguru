-- Persistent cache for LeetCode user profile stats.
--
-- The `leetcode-user` edge function reads this on every profile view and writes
-- after a successful upstream fetch. It exists so a LeetCode/wrapper outage can
-- never blank out a user's stats: when upstream fails we serve the last known
-- good row (marked `stale: true`) instead of showing
-- "LeetCode API Error — The API is currently unavailable".
--
-- No RLS is enabled: the service role is the only writer and the function is
-- unauthenticated for readers (same model as daily_challenge_cache).
CREATE TABLE IF NOT EXISTS public.leetcode_user_cache (
  -- Lowercased LeetCode handle; the natural cache key.
  username TEXT PRIMARY KEY,
  stats_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'upstream'
);

-- Supports "most recently refreshed users" scans / future admin tooling.
CREATE INDEX IF NOT EXISTS idx_leetcode_user_cache_fetched_at
ON public.leetcode_user_cache(fetched_at DESC);
