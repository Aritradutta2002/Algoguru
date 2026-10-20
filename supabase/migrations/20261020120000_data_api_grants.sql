-- =============================================================================
-- Explicit Data API grants for every table in the `public` schema.
--
-- WHY THIS EXISTS
-- -----------------------------------------------------------------------------
-- Until 2026-10-30 Supabase automatically granted Data API access (`anon`,
-- `authenticated`, `service_role`) on every new table created in `public`.
-- From 2026-10-30 that auto-grant stops. Existing tables keep the privileges
-- they already have, but every table that is CREATED AFTER that date starts
-- with no privileges at all, so supabase-js / PostgREST / GraphQL fail with
-- "permission denied".
--
-- That includes anything that rebuilds the schema:
--   * `supabase db reset` (local development)
--   * preview branches
--   * a brand-new project created from these migrations
--
-- Several tables in this repo never carried an explicit GRANT and relied on the
-- legacy auto-grant: profiles, user_roles, cp_templates,
-- practice_problem_user_state, core_java_user_state,
-- system_design_user_state, daily_challenge_user_code,
-- daily_challenge_cache, leetcode_user_cache. On a rebuilt schema those would
-- be unreachable. This migration makes the privilege set explicit, complete and
-- identical for every environment.
--
-- GRANTS ARE NOT THE SECURITY BOUNDARY
-- -----------------------------------------------------------------------------
-- Table privileges are only the outer gate that lets a role talk to a table at
-- all. Row access is still decided by RLS policies. Do not weaken or remove a
-- policy because "the grant already restricts it" — it does not.
--
-- `service_role` bypasses RLS but it does NOT bypass table privileges, so it
-- needs explicit grants too. The edge functions that use it would break
-- otherwise:
--   * admin-api      -> profiles, user_roles
--   * contest-coding -> coding_problems, contest_coding_sessions,
--                       contest_problem_drafts
--   * leetcode-daily -> daily_challenge_cache
--   * leetcode-user  -> leetcode_user_cache
--   * health         -> health_ping()
--
-- WHY THE REVOKE COMES FIRST
-- -----------------------------------------------------------------------------
-- A rebuilt schema may still pick up the platform's default privileges (older
-- project settings, or a local stack running an image from before the change),
-- while a project created after 2026-10-30 gets nothing. Revoking the DML
-- privileges this migration does not want first makes the end state the same in
-- both cases, so `supabase/tests/data_api_grants.test.sql` can assert one exact
-- matrix. Without the REVOKE the matrix would differ per environment.
--
-- Idempotent: safe to re-run, safe to run on the already-deployed project.
--
-- RULE GOING FORWARD: a migration that creates a table in `public` must also
-- contain that table's GRANT statements (see docs/data-api-grants.md).
-- =============================================================================

-- The Data API roles need USAGE on the exposed schema itself.
grant usage on schema public to anon, authenticated, service_role;

-- ── 1. Start from a clean, deterministic privilege set ──────────────────────
revoke all on table
  public.profiles,
  public.user_roles,
  public.cp_templates,
  public.practice_problem_user_state,
  public.core_java_user_state,
  public.system_design_user_state,
  public.daily_challenge_user_code,
  public.daily_challenge_cache,
  public.leetcode_user_cache,
  public.playground_user_templates,
  public.playground_template_overrides,
  public.playground_preferences,
  public.playground_workspace,
  public.guru_chat_sessions,
  public.guru_chat_feedback,
  public.coding_problems,
  public.contest_coding_sessions,
  public.contest_problem_drafts
from anon, authenticated;

-- ── 2. Authenticated user data (RLS decides which rows) ─────────────────────
-- profiles: INSERT is granted because the "Users can insert their own profile"
-- policy exists and constrains it to auth.uid() = user_id. For a signed-in user
-- the RLS policy is the real limit, so withholding INSERT would only risk
-- breaking a fallback path that creates a profile when the signup trigger did
-- not fire.
grant select, insert, update, delete on public.profiles to authenticated;

-- user_roles: admins manage roles; there is no UPDATE policy, so no UPDATE
-- grant. Reads are needed by useIsAdmin().
grant select, insert, delete on public.user_roles to authenticated;

grant select, insert, update, delete on public.practice_problem_user_state to authenticated;
grant select, insert, update, delete on public.core_java_user_state to authenticated;
grant select, insert, update, delete on public.system_design_user_state to authenticated;
grant select, insert, update, delete on public.daily_challenge_user_code to authenticated;

-- guru_chat_feedback: rated replies are inserted/updated, never deleted.
grant select, insert, update on public.guru_chat_feedback to authenticated;

-- contest_coding_sessions: sessions are created and deleted only by the
-- service-role client inside the `contest-coding` edge function, which also owns
-- the deadline. Clients may read and update their own row only.
grant select, update on public.contest_coding_sessions to authenticated;
-- Drafts: SELECT/INSERT/UPDATE policies exist, no DELETE policy — drafts go away
-- with their session via ON DELETE CASCADE, performed by the service role.
grant select, insert, update on public.contest_problem_drafts to authenticated;

-- Playground + Guru chat history: every call site is behind an auth check
-- (`if (!user) return`), so these are authenticated-only. Older migrations
-- granted `anon` here as well; that is revoked above.
grant select, insert, update, delete on
  public.playground_user_templates,
  public.playground_template_overrides,
  public.playground_preferences,
  public.playground_workspace,
  public.guru_chat_sessions
to authenticated;

-- ── 3. Reference data readable before sign-in ───────────────────────────────
-- cp_templates is read by useCPTemplates() when the Playground mounts, with no
-- session guard, and its RLS policy deliberately targets `anon, authenticated`.
grant select on public.cp_templates to anon, authenticated;

-- ── 4. Server-side tables: service_role only, never the Data API ────────────
-- daily_challenge_cache / leetcode_user_cache: no client code touches these;
-- they are read and written exclusively by the `leetcode-*` edge functions via
-- the service-role key. Migration 20261020120100 additionally enables RLS on
-- them, so an accidental grant in the future still cannot expose rows.
--
-- coding_problems: holds HIDDEN TEST CASES and REFERENCE SOLUTIONS. It must
-- never be readable with the anon/publishable key. See the security header in
-- 20260915000000_add_coding_contest.sql — do not add a client grant or a SELECT
-- policy here.
revoke all on table
  public.daily_challenge_cache,
  public.leetcode_user_cache,
  public.coding_problems
from anon, authenticated;

-- ── 5. service_role: table privileges for the edge functions ────────────────
-- BYPASSRLS does not imply privileges, so grant the DML verbs explicitly.
grant select, insert, update, delete on
  public.profiles,
  public.user_roles,
  public.cp_templates,
  public.practice_problem_user_state,
  public.core_java_user_state,
  public.system_design_user_state,
  public.daily_challenge_user_code,
  public.daily_challenge_cache,
  public.leetcode_user_cache,
  public.playground_user_templates,
  public.playground_template_overrides,
  public.playground_preferences,
  public.playground_workspace,
  public.guru_chat_sessions,
  public.guru_chat_feedback,
  public.coding_problems,
  public.contest_coding_sessions,
  public.contest_problem_drafts
to service_role;

-- ── 6. Functions reachable through the Data API ─────────────────────────────
-- PostgreSQL grants EXECUTE on a new function to PUBLIC, which would let the
-- publishable anon key call it through /rest/v1/rpc/... regardless of anything
-- else in this migration. Revoke that blanket grant first, then grant only the
-- roles that actually need the function — otherwise "explicit least privilege"
-- would be untrue for functions.
--
-- has_role() is SECURITY DEFINER and reads user_roles with RLS bypassed, so an
-- unauthenticated caller could probe whether any given user_id is an
-- admin/moderator. RLS policies call it as the querying role, so `authenticated`
-- must keep EXECUTE. `anon` never evaluates a user_roles policy, so it does not.
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- health_ping() is deliberately callable by anon + authenticated (see
-- 20260815_add_health_ping_function.sql) and is used by the `health` edge
-- function with the service-role key. It returns 1 and reads no data, so the
-- public surface is harmless — but keep the privilege set explicit instead of
-- relying on the PUBLIC default.
revoke execute on function public.health_ping() from public;
grant execute on function public.health_ping() to anon, authenticated, service_role;
