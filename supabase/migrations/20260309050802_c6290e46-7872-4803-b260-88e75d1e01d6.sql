
CREATE TABLE public.cp_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    prefix text NOT NULL UNIQUE,
    description text NOT NULL DEFAULT '',
    code text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cp_templates"
ON public.cp_templates
FOR SELECT
TO anon, authenticated
USING (true);
