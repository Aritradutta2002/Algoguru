# Data API grants

How table access works in this project, and the rule you must follow when adding a
table. Supabase is changing the default behaviour on **2026-10-30**; this document
is the project's response to it.

- [What changed](#what-changed)
- [The rule](#the-rule)
- [Template for a new table](#template-for-a-new-table)
- [Current privilege matrix](#current-privilege-matrix)
- [Verifying](#verifying)
- [Rolling back](#rolling-back)
- [Why not ALTER DEFAULT PRIVILEGES](#why-not-alter-default-privileges)
- [Why service_role needs grants](#why-service_role-needs-grants)

## What changed

Until 2026-10-30, Supabase automatically granted Data API access on every new
table created in the `public` schema, so `anon`, `authenticated` and
`service_role` could query it immediately.

From 2026-10-30 that auto-grant stops. Existing tables keep their privileges, but
every table **created from that date onwards** starts with no privileges:
supabase-js, PostgREST and GraphQL return `permission denied` (the error message
even includes the `GRANT` statement to run).

That applies to anything that rebuilds the schema, which is the part that matters
here — all of these create "new" tables even though the project is old:

| Path | Rebuilds the schema? |
| --- | --- |
| `supabase db reset` on local | yes |
| Supabase preview branches | yes |
| A new project / environment created from these migrations | yes |
| The existing hosted project | no — its tables keep current grants |

So a local or preview environment would have quietly drifted from production:
same migrations, but half the tables unreachable. The fix is to stop depending on
the platform's default and always state the grants ourselves.

**Grants are not the security boundary.** A table privilege decides whether a role
can talk to a table at all; RLS policies decide which rows it sees. Both are
required, and neither replaces the other.

## The rule

> A migration that creates a table in `public` must contain that table's `GRANT`
> statements in the same file.

Four things per table: create it, enable RLS, grant the verbs each role actually
needs, then write the policies. If you add a column that a new role needs to read,
that is still covered — grants are per table, not per column.

Run `npx supabase test db` before merging: `supabase/tests/data_api_grants.test.sql`
fails if a public table appears without a matrix entry, so a forgotten `GRANT`
breaks the tests rather than production.

## Template for a new table

```sql
-- 1. Create
create table if not exists public.example_user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, note)
);

alter table public.example_user_notes enable row level security;

-- 2. Grants — the outer gate. Without this the Data API cannot see the table.
grant select, insert, update, delete on public.example_user_notes to authenticated;
grant select, insert, update, delete on public.example_user_notes to service_role;

-- 3. Policies — the actual row-level boundary.
create policy "Users can view own notes" on public.example_user_notes
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.example_user_notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.example_user_notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own notes" on public.example_user_notes
  for delete to authenticated using (auth.uid() = user_id);
```

Notes on the template:

- **Only grant verbs that have a policy.** A grant without a policy is dead
  weight; a policy without a grant is unreachable. Keep them in pairs.
- `authenticated` covers a signed-in user. Do **not** grant `anon` unless the
  table must be readable before sign-in (only `cp_templates` is, because
  `useCPTemplates()` runs on Playground mount).
- Assume `upsert()`: it needs `insert` **and** `update`, plus `select` when it
  returns rows (`Prefer: return=representation`, which supabase-js uses).
- If a table holds secrets, hidden test cases or server-only data, grant it to
  `service_role` only and add no client policy — see `coding_problems` and the
  two cache tables.
- Sequences: all primary keys here are `gen_random_uuid()` or `text`, so no
  sequence grants are needed. A future `bigserial`/`identity` column also needs
  `grant usage, select on sequence ... to <role>`.
- Update the matrix in `supabase/tests/data_api_grants.test.sql` in the same PR,
  or the test fails on purpose.

## Current privilege matrix

Authoritative source: [`supabase/migrations/20261020120000_data_api_grants.sql`](../supabase/migrations/20261020120000_data_api_grants.sql).
`S`/`I`/`U`/`D` = select / insert / update / delete.

| Table | anon | authenticated | service_role | RLS |
| --- | --- | --- | --- | --- |
| `cp_templates` | S | S | SIUD | yes |
| `profiles` | — | SIUD | SIUD | yes |
| `user_roles` | — | SID | SIUD | yes |
| `core_java_user_state` | — | SIUD | SIUD | yes |
| `system_design_user_state` | — | SIUD | SIUD | yes |
| `practice_problem_user_state` | — | SIUD | SIUD | yes |
| `daily_challenge_user_code` | — | SIUD | SIUD | yes |
| `playground_user_templates` | — | SIUD | SIUD | yes |
| `playground_template_overrides` | — | SIUD | SIUD | yes |
| `playground_preferences` | — | SIUD | SIUD | yes |
| `playground_workspace` | — | SIUD | SIUD | yes |
| `guru_chat_sessions` | — | SIUD | SIUD | yes |
| `guru_chat_feedback` | — | SIU | SIUD | yes |
| `contest_problem_drafts` | — | SIU | SIUD | yes |
| `contest_coding_sessions` | — | SU | SIUD | yes |
| `coding_problems` | — | — | SIUD | yes (no policies) |
| `daily_challenge_cache` | — | — | SIUD | yes (no policies) |
| `leetcode_user_cache` | — | — | SIUD | yes (no policies) |

Deliberate omissions:

- `user_roles` has no `UPDATE` and `contest_coding_sessions` has no `INSERT`/`DELETE`
  because no policy exists for those verbs. Contest sessions are created and
  deleted only by the `contest-coding` edge function with the service-role key,
  which also owns the deadline. `contest_problem_drafts` has no `DELETE` for the
  same reason — drafts disappear with their session through `ON DELETE CASCADE`.
- `guru_chat_feedback` has no `DELETE` — ratings are inserted and updated.
- `coding_problems` holds hidden test cases and reference solutions. There is a
  security header in `20260915000000_add_coding_contest.sql`; never add a
  client grant or a `SELECT` policy.
- The two cache tables used to be readable **and writable** with the publishable
  anon key (no RLS, default grants). `20261020120100_lock_down_cache_tables.sql`
  revokes the Data API roles and enables RLS with no policies.

Function privileges are part of the same change. PostgreSQL grants `EXECUTE` on a
new function to `PUBLIC` by default, so `has_role()` (SECURITY DEFINER, reads
`user_roles` with RLS bypassed) and `health_ping()` were callable with the anon key
through `/rest/v1/rpc/`. `has_role()` leaks whether a given user id is an admin, so
the migration revokes the `PUBLIC` grant and re-grants per role: `authenticated`
and `service_role` for `has_role()`, plus `anon` for `health_ping()` (it returns 1
and reads no data).

## Verifying

**Automated (local):**

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

If your CLI version does not discover the file under `supabase/tests/`, point it
at the directory explicitly: `npx supabase test db supabase/tests`.

**Manual audit on the hosted project** — run in the Dashboard SQL editor. Every
row shows what each Data API role can actually do; compare against the matrix
above. Anything unexpected in the `anon` column is a finding.

The Dashboard's *Project Settings → Data API* page tells you which schemas and
tables are exposed; it does not show per-role privileges, so use it together with
the query below rather than instead of it.

```sql
select
  c.relname                                                        as table_name,
  c.relrowsecurity                                                 as rls_enabled,
  string_agg(distinct case when has_table_privilege('anon', c.oid, p) then p end, ', ')
                                                                   as anon_privileges,
  string_agg(distinct case when has_table_privilege('authenticated', c.oid, p) then p end, ', ')
                                                                   as authenticated_privileges,
  string_agg(distinct case when has_table_privilege('service_role', c.oid, p) then p end, ', ')
                                                                   as service_role_privileges
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
group by c.relname, c.relrowsecurity
order by c.relname;
```

**End-to-end check with the publishable key.** These three must be rejected; if
they return JSON rows, the table is leaking:

```bash
curl "$SUPABASE_URL/rest/v1/coding_problems?select=slug&limit=1" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $PUBLISHABLE_KEY"

curl "$SUPABASE_URL/rest/v1/daily_challenge_cache?select=date&limit=1" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $PUBLISHABLE_KEY"

curl "$SUPABASE_URL/rest/v1/leetcode_user_cache?select=username&limit=1" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $PUBLISHABLE_KEY"
```

Then exercise the app while signed in — the flows that touch each table: profile
load/save, practice notes, notes dashboard and global search, playground
preferences/templates/workspace, Guru chat save and rate, admin page, contest
start/submit, daily challenge, and `GET /functions/v1/health` → 200.

`GET /functions/v1/health` returning 503 with `"database":"DOWN"` is the classic
symptom of a missing `service_role` grant on `health_ping()`.

## Rolling back

Grants are additive; the safe rollback is to restore the previous privileges
exactly. To un-expose a table again:

```sql
revoke all on public.example_user_notes from anon, authenticated;
```

To undo the cache lockdown only (not recommended — that re-opens a live security
bug):

```sql
alter table public.daily_challenge_cache disable row level security;
grant select, insert, update, delete on public.daily_challenge_cache to anon, authenticated;
```

## Why not ALTER DEFAULT PRIVILEGES

The tempting shortcut is one statement, e.g.

```sql
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
```

It is rejected here because it silently grants full DML on **every future table**,
including tables that must never be client-reachable. `coding_problems` is exactly
this case: it stores hidden test cases and reference solutions, and a blanket
default privilege would have exposed it the moment it was created. The explicit
per-table rule plus the pgTAP test gives the same convenience with a review gate
in between.

## Why service_role needs grants

`service_role` has `BYPASSRLS`, which skips row-level policies — but it is still an
ordinary role for table privileges. From 2026-10-30 a new table grants it nothing,
so every edge function that uses the service-role key breaks until granted:

| Edge function | Tables / functions it needs |
| --- | --- |
| `admin-api` | `profiles`, `user_roles` |
| `contest-coding` | `coding_problems`, `contest_coding_sessions`, `contest_problem_drafts` |
| `leetcode-daily` | `daily_challenge_cache` |
| `leetcode-user` | `leetcode_user_cache` |
| `health` | `health_ping()` |

These failures are server-side and quiet: the function logs the PostgREST error and
usually degrades to a fallback, so the app "works" but silently stops caching or
returns stale data. `health_ping()` is the exception — it surfaces as a 503.
