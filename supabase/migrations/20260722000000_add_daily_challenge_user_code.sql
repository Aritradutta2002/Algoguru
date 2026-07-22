-- Create daily_challenge_user_code table for persisting user solutions
-- to the LeetCode daily challenge. Keyed by (user_id, question_id).
-- Falls back to localStorage for unauthenticated users.
CREATE TABLE IF NOT EXISTS public.daily_challenge_user_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_dcuc_user_question
ON public.daily_challenge_user_code(user_id, question_id);

-- Enable RLS
ALTER TABLE public.daily_challenge_user_code ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "Users can manage their own code"
ON public.daily_challenge_user_code
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
