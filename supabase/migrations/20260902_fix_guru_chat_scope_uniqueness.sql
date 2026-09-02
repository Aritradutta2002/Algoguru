-- Fix GuruBot chat persistence across scopes.
-- Existing rows were keyed only by (user_id, session_id), but the app stores
-- chats per scope (questionId or global). That caused upserts to overwrite rows
-- from other scopes, so refreshes could appear to lose history.

ALTER TABLE public.guru_chat_sessions
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS idx_guru_chat_sessions_user_scope;
DROP INDEX IF EXISTS idx_guru_chat_sessions_user_scope_pinned;

ALTER TABLE public.guru_chat_sessions
DROP CONSTRAINT IF EXISTS guru_chat_sessions_user_id_session_id_key;

ALTER TABLE public.guru_chat_sessions
ADD CONSTRAINT guru_chat_sessions_user_id_scope_session_id_key UNIQUE (user_id, scope, session_id);

CREATE INDEX IF NOT EXISTS idx_guru_chat_sessions_user_scope
ON public.guru_chat_sessions(user_id, scope, session_date DESC);
