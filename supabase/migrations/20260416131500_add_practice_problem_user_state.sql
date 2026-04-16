CREATE TABLE IF NOT EXISTS public.practice_problem_user_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    is_saved_for_revision BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_problem_user_state_user_id
ON public.practice_problem_user_state(user_id);

CREATE INDEX IF NOT EXISTS idx_practice_problem_user_state_revision
ON public.practice_problem_user_state(user_id, is_saved_for_revision)
WHERE is_saved_for_revision = true;

ALTER TABLE public.practice_problem_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own practice problem state" ON public.practice_problem_user_state;
CREATE POLICY "Users can view their own practice problem state"
ON public.practice_problem_user_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own practice problem state" ON public.practice_problem_user_state;
CREATE POLICY "Users can insert their own practice problem state"
ON public.practice_problem_user_state
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own practice problem state" ON public.practice_problem_user_state;
CREATE POLICY "Users can update their own practice problem state"
ON public.practice_problem_user_state
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own practice problem state" ON public.practice_problem_user_state;
CREATE POLICY "Users can delete their own practice problem state"
ON public.practice_problem_user_state
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_practice_problem_user_state_updated_at ON public.practice_problem_user_state;
CREATE TRIGGER update_practice_problem_user_state_updated_at
BEFORE UPDATE ON public.practice_problem_user_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
