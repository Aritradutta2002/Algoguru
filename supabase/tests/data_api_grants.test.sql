-- =============================================================================
-- Regression guard for explicit Data API grants.
--
-- Runs with: supabase test db   (pgTAP is provisioned by the Supabase CLI)
--
-- Context: from 2026-10-30 Supabase no longer auto-grants Data API access to new
-- tables in `public` (see supabase/migrations/20261020120000_data_api_grants.sql).
-- A table that ships without explicit grants is invisible to supabase-js and
-- PostgREST, and the app breaks with "permission denied" on any rebuilt schema
-- (`supabase db reset`, preview branch, new project).
--
-- This test fails when:
--   * a public table appears whose grants are not listed in the matrix below
--     (i.e. someone added a table and forgot the GRANT statements), or
--   * an existing table's grants drift from the intended least-privilege set, or
--   * RLS is disabled on a table, or
--   * an internal table (problem bank / caches) becomes reachable with the
--     publishable anon key, or
--   * the SECURITY DEFINER helper has_role() becomes callable by anon through
--     /rest/v1/rpc/ (PostgreSQL grants EXECUTE to PUBLIC by default).
--
-- Keep the matrix in sync with the migration — it is the executable version of
-- docs/data-api-grants.md.
-- =============================================================================

begin;

select plan(9);

-- ── The intended privilege matrix ────────────────────────────────────────────
-- Array elements are sorted alphabetically so they can be compared positionally
-- with the catalog snapshot below.
create temp table _expected_data_api_grants (
  tbl            text   primary key,
  anon_privs     text[] not null,
  auth_privs     text[] not null,
  service_privs  text[] not null
) on commit drop;

insert into _expected_data_api_grants (tbl, anon_privs, auth_privs, service_privs) values
  -- Internal / server-only: never reachable from a browser.
  ('coding_problems',                '{}', '{}',                    '{DELETE,INSERT,SELECT,UPDATE}'),
  ('daily_challenge_cache',          '{}', '{}',                    '{DELETE,INSERT,SELECT,UPDATE}'),
  ('leetcode_user_cache',            '{}', '{}',                    '{DELETE,INSERT,SELECT,UPDATE}'),

  -- Public reference data: readable before sign-in.
  ('cp_templates',                   '{SELECT}', '{SELECT}',       '{DELETE,INSERT,SELECT,UPDATE}'),

  -- Authenticated user data, RLS-guarded.
  ('profiles',                       '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('core_java_user_state',           '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('system_design_user_state',       '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('practice_problem_user_state',    '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('daily_challenge_user_code',      '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('playground_user_templates',      '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('playground_template_overrides',  '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('playground_preferences',         '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('playground_workspace',           '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),
  ('guru_chat_sessions',             '{}', '{DELETE,INSERT,SELECT,UPDATE}', '{DELETE,INSERT,SELECT,UPDATE}'),

  -- Restricted verbs: no policy exists for the missing verb, so it is not granted.
  ('user_roles',                     '{}', '{DELETE,INSERT,SELECT}',       '{DELETE,INSERT,SELECT,UPDATE}'),
  ('guru_chat_feedback',             '{}', '{INSERT,SELECT,UPDATE}',       '{DELETE,INSERT,SELECT,UPDATE}'),
  ('contest_coding_sessions',        '{}', '{SELECT,UPDATE}',              '{DELETE,INSERT,SELECT,UPDATE}'),
  ('contest_problem_drafts',         '{}', '{INSERT,SELECT,UPDATE}',       '{DELETE,INSERT,SELECT,UPDATE}');

-- ── What the database actually has ───────────────────────────────────────────
create temp view _actual_data_api_grants as
select
  c.relname::text as tbl,
  coalesce((
    select array_agg(p order by p)
    from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
    where has_table_privilege('anon', c.oid, p)
  ), '{}'::text[]) as anon_privs,
  coalesce((
    select array_agg(p order by p)
    from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
    where has_table_privilege('authenticated', c.oid, p)
  ), '{}'::text[]) as auth_privs,
  coalesce((
    select array_agg(p order by p)
    from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
    where has_table_privilege('service_role', c.oid, p)
  ), '{}'::text[]) as service_privs
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p');

-- ── 1. The matrix itself ─────────────────────────────────────────────────────
select results_eq(
  'select tbl, anon_privs, auth_privs, service_privs from _actual_data_api_grants order by tbl',
  'select tbl, anon_privs, auth_privs, service_privs from _expected_data_api_grants order by tbl',
  'every public table has exactly the intended anon/authenticated/service_role grants'
);

-- ── 2. The SECURITY DEFINER helper is not callable with the anon key ─────────
-- PostgreSQL grants EXECUTE on new functions to PUBLIC, so has_role() would be
-- reachable through /rest/v1/rpc/ and could be used to probe admin user ids.
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_role'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  'anon cannot execute has_role(), so it cannot probe admin ids via rpc'
);

-- ── 3. RLS is enabled everywhere ─────────────────────────────────────────────
select is_empty(
  'select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = ''public'' and c.relkind in (''r'', ''p'') and not c.relrowsecurity'::text,
  'row level security is enabled on every public table'
);

-- ── 4. anon may only read the public reference table ─────────────────────────
select is_empty(
  'select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = ''public'' and c.relkind in (''r'', ''p'')
      and c.relname <> ''cp_templates''
      and has_table_privilege(''anon'', c.oid, ''SELECT'')'::text,
  'the anon key can only SELECT from cp_templates'
);

-- ── 5. Problem bank and caches are not reachable by a signed-in user either ──
select is_empty(
  'select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = ''public'' and c.relkind in (''r'', ''p'')
      and c.relname in (''coding_problems'', ''daily_challenge_cache'', ''leetcode_user_cache'')
      and (has_table_privilege(''authenticated'', c.oid, ''SELECT'')
        or has_table_privilege(''authenticated'', c.oid, ''INSERT'')
        or has_table_privilege(''authenticated'', c.oid, ''UPDATE'')
        or has_table_privilege(''authenticated'', c.oid, ''DELETE''))'::text,
  'coding_problems and the internal caches are not exposed to authenticated users'
);

-- ── 6. Positive control: the one intentional public read still works ─────────
select ok(
  has_table_privilege('anon', 'public.cp_templates', 'SELECT'),
  'cp_templates stays readable by anonymous visitors (useCPTemplates runs before sign-in)'
);

-- ── 7. The Data API roles can use the exposed schema ─────────────────────────
select ok(
  has_schema_privilege('anon', 'public', 'USAGE')
    and has_schema_privilege('authenticated', 'public', 'USAGE')
    and has_schema_privilege('service_role', 'public', 'USAGE'),
  'anon, authenticated and service_role all have USAGE on the public schema'
);

-- ── 8. RLS helper function executed by authenticated inside policies ─────────
select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_role'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'authenticated can execute has_role(), which RLS policies call for user_roles'
);

-- ── 9. health check function used by the health edge function ────────────────
select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'health_ping'
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
  ),
  'service_role can execute health_ping() for the uptime monitor'
);

select * from finish();
rollback;
