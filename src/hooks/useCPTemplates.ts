import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DBTemplate {
  id: string;
  name: string;
  prefix: string;
  description: string;
  code: string;
}

export function useCPTemplates() {
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cp_templates")
      .select("id, name, prefix, description, code")
      .order("name")
      .then(({ data }) => {
        if (data) setTemplates(data as DBTemplate[]);
        setLoading(false);
      });
  }, []);

  return { templates, loading };
}
