-- Create core_java_user_state table for persisting interview question progress and notes per user
CREATE TABLE IF NOT EXISTS public.core_java_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_core_java_user_state_user_id
ON public.core_java_user_state(user_id);

CREATE INDEX IF NOT EXISTS idx_core_java_user_state_user_question
ON public.core_java_user_state(user_id, question_id);

-- Enable Row Level Security
ALTER TABLE public.core_java_user_state ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they already exist
DROP POLICY IF EXISTS "Users can view own core java state" ON public.core_java_user_state;
DROP POLICY IF EXISTS "Users can insert own core java state" ON public.core_java_user_state;
DROP POLICY IF EXISTS "Users can update own core java state" ON public.core_java_user_state;
DROP POLICY IF EXISTS "Users can delete own core java state" ON public.core_java_user_state;

-- Policy: authenticated users can only see and modify their own data
CREATE POLICY "Users can view own core java state"
ON public.core_java_user_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own core java state"
ON public.core_java_user_state
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own core java state"
ON public.core_java_user_state
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own core java state"
ON public.core_java_user_state
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_core_java_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS set_core_java_user_state_updated_at ON public.core_java_user_state;

CREATE TRIGGER set_core_java_user_state_updated_at
BEFORE UPDATE ON public.core_java_user_state
FOR EACH ROW
EXECUTE FUNCTION public.handle_core_java_updated_at();
