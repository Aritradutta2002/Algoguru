-- GuruBot chat history persistence (replaces localStorage storage).

CREATE TABLE IF NOT EXISTS public.guru_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT 'global',
    session_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    model TEXT NOT NULL DEFAULT 'openrouter',
    session_date BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_guru_chat_sessions_user_scope
ON public.guru_chat_sessions(user_id, scope, session_date DESC);

ALTER TABLE public.guru_chat_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.guru_chat_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view own guru chats" ON public.guru_chat_sessions;
CREATE POLICY "Users can view own guru chats"
ON public.guru_chat_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own guru chats" ON public.guru_chat_sessions;
CREATE POLICY "Users can insert own guru chats"
ON public.guru_chat_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own guru chats" ON public.guru_chat_sessions;
CREATE POLICY "Users can update own guru chats"
ON public.guru_chat_sessions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own guru chats" ON public.guru_chat_sessions;
CREATE POLICY "Users can delete own guru chats"
ON public.guru_chat_sessions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_guru_chat_sessions_updated_at ON public.guru_chat_sessions;
CREATE TRIGGER update_guru_chat_sessions_updated_at
BEFORE UPDATE ON public.guru_chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
