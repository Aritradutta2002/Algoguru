-- Add per-user bookmarks and reading position to Core Java question state.
-- Run in the Supabase SQL editor.
ALTER TABLE public.core_java_user_state
  ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reading_section TEXT NOT NULL DEFAULT '';
