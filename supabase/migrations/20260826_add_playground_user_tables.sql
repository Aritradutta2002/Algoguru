-- Playground user data: personal templates, built-in template overrides,
-- editor preferences, and workspace (open code tabs) persistence.

CREATE TABLE IF NOT EXISTS public.playground_user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    code TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playground_user_templates_user_id
ON public.playground_user_templates(user_id);

CREATE TABLE IF NOT EXISTS public.playground_template_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prefix TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, prefix)
);

CREATE TABLE IF NOT EXISTS public.playground_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'leetcode-dark',
    font_size INTEGER NOT NULL DEFAULT 14,
    tab_size INTEGER NOT NULL DEFAULT 4,
    relative_lines BOOLEAN NOT NULL DEFAULT false,
    ask_guru_on_selection BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playground_workspace (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_tab_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playground_user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_template_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_workspace ENABLE ROW LEVEL SECURITY;

-- Explicit DML grants (hosted Supabase grants these by default;
-- required for local stacks where default privileges differ).
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.playground_user_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.playground_template_overrides TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.playground_preferences TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.playground_workspace TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view own playground templates" ON public.playground_user_templates;
CREATE POLICY "Users can view own playground templates"
ON public.playground_user_templates FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own playground templates" ON public.playground_user_templates;
CREATE POLICY "Users can insert own playground templates"
ON public.playground_user_templates FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playground templates" ON public.playground_user_templates;
CREATE POLICY "Users can update own playground templates"
ON public.playground_user_templates FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playground templates" ON public.playground_user_templates;
CREATE POLICY "Users can delete own playground templates"
ON public.playground_user_templates FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own playground overrides" ON public.playground_template_overrides;
CREATE POLICY "Users can view own playground overrides"
ON public.playground_template_overrides FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own playground overrides" ON public.playground_template_overrides;
CREATE POLICY "Users can insert own playground overrides"
ON public.playground_template_overrides FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playground overrides" ON public.playground_template_overrides;
CREATE POLICY "Users can update own playground overrides"
ON public.playground_template_overrides FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playground overrides" ON public.playground_template_overrides;
CREATE POLICY "Users can delete own playground overrides"
ON public.playground_template_overrides FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own playground preferences" ON public.playground_preferences;
CREATE POLICY "Users can view own playground preferences"
ON public.playground_preferences FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own playground preferences" ON public.playground_preferences;
CREATE POLICY "Users can insert own playground preferences"
ON public.playground_preferences FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playground preferences" ON public.playground_preferences;
CREATE POLICY "Users can update own playground preferences"
ON public.playground_preferences FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playground preferences" ON public.playground_preferences;
CREATE POLICY "Users can delete own playground preferences"
ON public.playground_preferences FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own playground workspace" ON public.playground_workspace;
CREATE POLICY "Users can view own playground workspace"
ON public.playground_workspace FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own playground workspace" ON public.playground_workspace;
CREATE POLICY "Users can insert own playground workspace"
ON public.playground_workspace FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playground workspace" ON public.playground_workspace;
CREATE POLICY "Users can update own playground workspace"
ON public.playground_workspace FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playground workspace" ON public.playground_workspace;
CREATE POLICY "Users can delete own playground workspace"
ON public.playground_workspace FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Keep updated_at fresh on all four tables.
DROP TRIGGER IF EXISTS update_playground_user_templates_updated_at ON public.playground_user_templates;
CREATE TRIGGER update_playground_user_templates_updated_at
BEFORE UPDATE ON public.playground_user_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_playground_template_overrides_updated_at ON public.playground_template_overrides;
CREATE TRIGGER update_playground_template_overrides_updated_at
BEFORE UPDATE ON public.playground_template_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_playground_preferences_updated_at ON public.playground_preferences;
CREATE TRIGGER update_playground_preferences_updated_at
BEFORE UPDATE ON public.playground_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_playground_workspace_updated_at ON public.playground_workspace;
CREATE TRIGGER update_playground_workspace_updated_at
BEFORE UPDATE ON public.playground_workspace
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
