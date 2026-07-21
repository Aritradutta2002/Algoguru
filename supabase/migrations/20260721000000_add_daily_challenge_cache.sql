-- Create daily_challenge_cache table for persisting the LeetCode daily challenge
-- keyed by UTC date. The leetcode-daily edge function reads on cold start and
-- writes after a successful upstream fetch. The table has no RLS because the
-- service role is the only writer; the function is unauthenticated for readers.
CREATE TABLE IF NOT EXISTS public.daily_challenge_cache (
  date TEXT PRIMARY KEY,
  problem_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'upstream'
);

-- Helpful index for chronological scans / future admin tooling
CREATE INDEX IF NOT EXISTS idx_daily_challenge_cache_fetched_at
ON public.daily_challenge_cache(fetched_at DESC);
