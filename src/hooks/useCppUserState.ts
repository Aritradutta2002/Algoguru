import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CppUserState {
  doneMap: Record<string, boolean>;
  notesMap: Record<string, string>;
  updatedAtMap: Record<string, string>;
  readingSectionMap: Record<string, string>;
  loading: boolean;
  upsertingId: string | null;
  toggleDone: (questionId: string) => Promise<void>;
  saveNote: (questionId: string, note: string) => Promise<boolean>;
  deleteNote: (questionId: string) => Promise<boolean>;
  saveReadingSection: (questionId: string, section: string) => Promise<void>;
  isUpserting: (questionId: string) => boolean;
}

// Separate logical table — reuses core_java_user_state with prefix to avoid migration
// question_id for C++ is prefixed 'cpp:' to avoid collision with Java ids.
function toRowId(id: string){ return `cpp:${id}`; }
function fromRowId(rowId: string){ return rowId.startsWith("cpp:") ? rowId.slice(4) : rowId; }

export function useCppUserState(): CppUserState {
  const { user, loading: authLoading } = useAuth();
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [updatedAtMap, setUpdatedAtMap] = useState<Record<string, string>>({});
  const [readingSectionMap, setReadingSectionMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user){ setDoneMap({}); setNotesMap({}); setUpdatedAtMap({}); setReadingSectionMap({}); setLoading(false); return; }
    const load = async () => {
      try{
        const { data, error } = await supabase.from("core_java_user_state").select("question_id, notes, is_completed, updated_at, reading_section").eq("user_id", user.id).like("question_id","cpp:%");
        if(error){ console.warn("Could not load cpp user state:", error.message); setLoading(false); return; }
        const done: Record<string,boolean>={}; const notes: Record<string,string>={}; const updated: Record<string,string>={}; const reading: Record<string,string>={};
        for(const row of data ?? []){
          const id = fromRowId(row.question_id);
          if(row.is_completed) done[id]=true;
          if(row.notes) notes[id]=row.notes;
          if(row.updated_at) updated[id]=row.updated_at;
          if(row.reading_section) reading[id]=row.reading_section;
        }
        setDoneMap(done); setNotesMap(notes); setUpdatedAtMap(updated); setReadingSectionMap(reading);
      } finally { setLoading(false); }
    };
    load();
  }, [authLoading, user]);

  const upsert = useCallback(async (questionId: string, patch: Partial<{ notes: string; is_completed: boolean; reading_section: string }>): Promise<boolean> => {
    if(!user) return false;
    setUpsertingId(questionId);
    const { error } = await supabase.from("core_java_user_state").upsert({ user_id: user.id, question_id: toRowId(questionId), ...patch }, { onConflict: "user_id,question_id" });
    setUpsertingId(null);
    if(error){ console.warn("Save failed:", error.message); return false; }
    return true;
  }, [user]);

  const toggleDone = useCallback(async (questionId: string) => {
    setDoneMap((prev)=>{
      const nextValue = !prev[questionId];
      upsert(questionId, { is_completed: nextValue }).then((ok)=>{ if(!ok) setDoneMap((p)=>({ ...p, [questionId]: !nextValue })); });
      return { ...prev, [questionId]: nextValue };
    });
  }, [upsert]);

  const saveNote = useCallback(async (questionId: string, note: string): Promise<boolean> => {
    const ok = await upsert(questionId, { notes: note });
    if(ok){ setNotesMap((prev)=>({ ...prev, [questionId]: note })); setUpdatedAtMap((prev)=>({ ...prev, [questionId]: new Date().toISOString() })); }
    return ok;
  }, [upsert]);

  const deleteNote = useCallback(async (questionId: string): Promise<boolean> => {
    const ok = await upsert(questionId, { notes: "" });
    if(ok) setNotesMap((prev)=>{ const next={...prev}; delete next[questionId]; return next; });
    return ok;
  }, [upsert]);

  const saveReadingSection = useCallback(async (questionId: string, section: string): Promise<void> => {
    if(!section) return;
    const ok = await upsert(questionId, { reading_section: section });
    if(ok) setReadingSectionMap((prev)=>({ ...prev, [questionId]: section }));
  }, [upsert]);

  const isUpserting = useCallback((id: string)=> upsertingId===id, [upsertingId]);

  return { doneMap, notesMap, updatedAtMap, readingSectionMap, loading, upsertingId, toggleDone, saveNote, deleteNote, saveReadingSection, isUpserting };
}
