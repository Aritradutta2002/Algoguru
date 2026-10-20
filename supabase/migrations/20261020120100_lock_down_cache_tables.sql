-- =============================================================================
-- Lock down the two internal cache tables.
--
-- SECURITY ISSUE BEING FIXED (this predates the 2026-10-30 Data API change)
-- -----------------------------------------------------------------------------
-- `daily_challenge_cache` and `leetcode_user_cache` were created with:
--   * no RLS enabled, and
--   * no explicit grants — so they inherited the legacy platform default of
--     full read AND write access for `anon` and `authenticated`.
--
-- The publishable/anon key ships in the browser bundle, so until this migration
-- anyone could SELECT, INSERT, UPDATE and DELETE rows in both tables through
-- PostgREST — e.g. overwrite the cached daily challenge served to every user, or
-- corrupt another user's cached LeetCode stats.
--
-- Both tables are an internal cache. Only two server-side callers exist and both
-- use the service-role key:
--   * supabase/functions/leetcode-daily -> daily_challenge_cache
--   * supabase/functions/leetcode-user  -> leetcode_user_cache
-- No runtime code in src/ references either table (the only hit there is a
-- generated row type in src/integrations/supabase/types.ts).
--
-- Two independent layers:
--   1. Table privileges: revoke anon/authenticated entirely.
--   2. RLS enabled with no policies: even if a grant is ever added by mistake,
--      the Data API still returns no rows (and service_role still works because
--      it bypasses RLS).
--
-- Idempotent: safe to re-run, safe to run on the deployed project.
-- =============================================================================

alter table public.daily_challenge_cache enable row level security;
alter table public.leetcode_user_cache enable row level security;

-- Defence in depth: no policy is created on purpose. Do not add one.
revoke all on table public.daily_challenge_cache from anon, authenticated;
revoke all on table public.leetcode_user_cache from anon, authenticated;

-- service_role bypasses RLS but still needs table privileges.
grant select, insert, update, delete on public.daily_challenge_cache to service_role;
grant select, insert, update, delete on public.leetcode_user_cache to service_role;

comment on table public.daily_challenge_cache is
  'Internal cache. Service-role access only: RLS is enabled with no policies and the Data API roles have no privileges. Written by the leetcode-daily edge function.';
comment on table public.leetcode_user_cache is
  'Internal cache. Service-role access only: RLS is enabled with no policies and the Data API roles have no privileges. Written by the leetcode-user edge function.';
