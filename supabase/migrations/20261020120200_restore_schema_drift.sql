-- =============================================================================
-- Restore schema drift: columns the app uses that no migration ever created.
--
-- These columns exist on the hosted project because they were added out of band
-- (dashboard / SQL editor) instead of through a migration. The migrations
-- therefore do not describe the real schema.
--
-- Why that matters for the 2026-10-30 Data API change: the change is about
-- *rebuilding* a schema (`supabase db reset`, preview branches, new projects).
-- A rebuild from these migrations produced tables that were missing these
-- columns, so the app broke on those environments no matter how the grants were
-- set — and because both call sites cast through `any` and ignore the returned
-- error, the failure was silent. This migration makes the migrations the single
-- source of truth for the column set again.
--
-- Everything below is `if not exists`, so on the hosted project — where the
-- columns already exist — this is a no-op.
-- =============================================================================

-- ── profiles: social handles ────────────────────────────────────────────────
-- Read by src/pages/Profile.tsx (select("*") via AuthContext, `leetcode_username`
-- / `codechef_username` fields) and written at Profile.tsx:383-384, 607, 630.
-- Also typed — but not created — by src/contexts/AuthContext.tsx:16-17.
alter table public.profiles
  add column if not exists leetcode_username text,
  add column if not exists codechef_username text;

comment on column public.profiles.leetcode_username is
  'LeetCode handle used by the Profile page to fetch public stats.';
comment on column public.profiles.codechef_username is
  'CodeChef handle used by the Profile page to fetch public stats.';

-- ── playground_preferences: extra Monaco editor options ─────────────────────
-- Read at src/pages/Playground.tsx:1151 and upserted at :1178 and :1204 as a
-- flat object of booleans (`minimap`, `wordWrap`, `cursorSmooth`,
-- `bracketPairColorization`, `formatOnType` — see
-- src/lib/playground/editorPrefs.ts), i.e. jsonb. Without the column PostgREST
-- rejects the upsert with 42703 and the cloud-editor preferences silently stop
-- saving; the local copy keeps them working, which is what hid the bug.
alter table public.playground_preferences
  add column if not exists editor_options jsonb not null default '{}'::jsonb;

comment on column public.playground_preferences.editor_options is
  'Extra Monaco editor preferences (minimap, wordWrap, cursorSmooth, bracketPairColorization, formatOnType).';
