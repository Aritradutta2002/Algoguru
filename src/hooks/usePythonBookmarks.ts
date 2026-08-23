import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function toRowId(id: string){ return `py:${id}`; }
function fromRowId(rowId: string){ return rowId.startsWith("py:") ? rowId.slice(3) : rowId; }

export function usePythonBookmarks(){
  const { user, loading: authLoading } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(()=>{
    if(authLoading) return;
    if(!user){ setBookmarkedIds([]); setLoading(false); return; }
    const load = async ()=>{
      try{
        const { data, error } = await supabase.from("core_java_user_state").select("question_id, is_bookmarked").eq("user_id", user.id).eq("is_bookmarked", true).like("question_id","py:%");
        if(error){ console.warn("Could not load python bookmarks:", error.message); setLoading(false); return; }
        setBookmarkedIds((data ?? []).map((r)=> fromRowId(r.question_id)));
      } finally { setLoading(false); }
    };
    load();
  }, [authLoading, user]);

  const isBookmarked = useCallback((id: string)=> bookmarkedIds.includes(id), [bookmarkedIds]);

  const toggleBookmark = useCallback(async (id: string): Promise<boolean> => {
    if(!user) return false;
    const prev = bookmarkedIds;
    const nextValue = !prev.includes(id);
    setBookmarkedIds(nextValue ? [...prev, id] : prev.filter((v)=> v!==id));
    setTogglingId(id);
    const { error } = await supabase.from("core_java_user_state").upsert({ user_id: user.id, question_id: toRowId(id), is_bookmarked: nextValue }, { onConflict: "user_id,question_id" });
    setTogglingId(null);
    if(error){ setBookmarkedIds(prev); console.warn("Bookmark save failed:", error.message); return false; }
    return true;
  }, [user, bookmarkedIds]);

  const isToggling = useCallback((id: string)=> togglingId===id, [togglingId]);
  const count = useMemo(()=> bookmarkedIds.length, [bookmarkedIds]);
  return { bookmarkedIds, isBookmarked, toggleBookmark, loading, isToggling, count };
}
