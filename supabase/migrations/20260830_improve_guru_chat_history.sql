-- Server-backed Guru chat enhancements: durable pins and reply feedback.

ALTER TABLE public.guru_chat_sessions
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_guru_chat_sessions_user_scope_pinned
ON public.guru_chat_sessions(user_id, scope, is_pinned DESC, session_date DESC);

CREATE TABLE IF NOT EXISTS public.guru_chat_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    message_index INTEGER NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, session_id, message_index)
);

ALTER TABLE public.guru_chat_feedback ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE
ON public.guru_chat_feedback TO authenticated;

CREATE POLICY "Users can view own Guru feedback"
ON public.guru_chat_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own Guru feedback"
ON public.guru_chat_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Guru feedback"
ON public.guru_chat_feedback FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_guru_chat_feedback_updated_at ON public.guru_chat_feedback;
CREATE TRIGGER update_guru_chat_feedback_updated_at
BEFORE UPDATE ON public.guru_chat_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
