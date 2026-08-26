-- Editor theme now defaults to "auto": follow the app's light/dark mode.
-- Any other value in playground_preferences.theme is an explicit user override
-- that stays put regardless of the app mode.
--
-- No backfill here: the client reads a stored 'leetcode-dark' (the old
-- hardcoded default) back as 'auto' and rewrites the row on its next save,
-- so existing rows migrate themselves. This migration only stops NEW rows
-- from being born with the old default.

ALTER TABLE public.playground_preferences
    ALTER COLUMN theme SET DEFAULT 'auto';
