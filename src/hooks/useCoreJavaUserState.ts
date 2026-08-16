import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoreJavaUserState {
  /** question id → true when marked as learned/completed */
  doneMap: Record<string, boolean>;
  /** question id → raw note markdown */
  notesMap: Record<string, string>;
  /** question id → last updated timestamp (from Supabase) */
  updatedAtMap: Record<string, string>;
  /** question id → last reading section (from Supabase) */
  readingSectionMap: Record<string, string>;
  loading: boolean;
  /** id of the question currently being persisted */
  upsertingId: string | null;
  toggleDone: (questionId: string) => Promise<void>;
  saveNote: (questionId: string, note: string) => Promise<boolean>;
  deleteNote: (questionId: string) => Promise<boolean>;
  saveReadingSection: (questionId: string, section: string) => Promise<void>;
  isUpserting: (questionId: string) => boolean;
}

/**
 * Shared Supabase-backed progress/notes state for Core Java questions.
 * Reuses the existing core_java_user_state table (user_id, question_id, notes, is_completed).
 */
export function useCoreJavaUserState(): CoreJavaUserState {
  const { user, loading: authLoading } = useAuth();
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [updatedAtMap, setUpdatedAtMap] = useState<Record<string, string>>({});
  const [readingSectionMap, setReadingSectionMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDoneMap({});
      setNotesMap({});
      setUpdatedAtMap({});
      setReadingSectionMap({});
      setLoading(false);
      return;
    }

    const loadUserState = async () => {
      try {
        const { data, error } = await supabase
          .from("core_java_user_state")
          .select("question_id, notes, is_completed, updated_at, reading_section")
          .eq("user_id", user.id);

        if (error) {
          console.warn("Could not load core_java_user_state:", error.message);
          setLoading(false);
          return;
        }

        const done: Record<string, boolean> = {};
        const notes: Record<string, string> = {};
        const updated: Record<string, string> = {};
        const reading: Record<string, string> = {};
        for (const row of data ?? []) {
          if (row.is_completed) done[row.question_id] = true;
          if (row.notes) notes[row.question_id] = row.notes;
          if (row.updated_at) updated[row.question_id] = row.updated_at;
          if (row.reading_section) reading[row.question_id] = row.reading_section;
        }
        setDoneMap(done);
        setNotesMap(notes);
        setUpdatedAtMap(updated);
        setReadingSectionMap(reading);
      } finally {
        setLoading(false);
      }
    };

    loadUserState();
  }, [authLoading, user]);

  const upsertUserState = useCallback(
    async (questionId: string, patch: Partial<{ notes: string; is_completed: boolean; reading_section: string }>): Promise<boolean> => {
      if (!user) return false;

      setUpsertingId(questionId);
      const { error } = await supabase
        .from("core_java_user_state")
        .upsert(
          {
            user_id: user.id,
            question_id: questionId,
            ...patch,
          },
          { onConflict: "user_id,question_id" }
        );
      setUpsertingId(null);

      if (error) {
        console.warn("Save failed:", error.message);
        return false;
      }
      return true;
    },
    [user]
  );

  const toggleDone = useCallback(
    async (questionId: string) => {
      setDoneMap((prev) => {
        const nextValue = !prev[questionId];
        upsertUserState(questionId, { is_completed: nextValue }).then((ok) => {
          if (!ok) {
            setDoneMap((innerPrev) => ({ ...innerPrev, [questionId]: !nextValue }));
          }
        });
        return { ...prev, [questionId]: nextValue };
      });
    },
    [upsertUserState]
  );

  const saveNote = useCallback(
    async (questionId: string, note: string): Promise<boolean> => {
      const ok = await upsertUserState(questionId, { notes: note });
      if (ok) {
        setNotesMap((prev) => ({ ...prev, [questionId]: note }));
        setUpdatedAtMap((prev) => ({ ...prev, [questionId]: new Date().toISOString() }));
      }
      return ok;
    },
    [upsertUserState]
  );

  const deleteNote = useCallback(
    async (questionId: string): Promise<boolean> => {
      const ok = await upsertUserState(questionId, { notes: "" });
      if (ok) {
        setNotesMap((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      }
      return ok;
    },
    [upsertUserState]
  );

  const saveReadingSection = useCallback(
    async (questionId: string, section: string): Promise<void> => {
      if (!section) return;
      const ok = await upsertUserState(questionId, { reading_section: section });
      if (ok) {
        setReadingSectionMap((prev) => ({ ...prev, [questionId]: section }));
      }
    },
    [upsertUserState]
  );

  const isUpserting = useCallback((questionId: string) => upsertingId === questionId, [upsertingId]);

  return {
    doneMap,
    notesMap,
    updatedAtMap,
    readingSectionMap,
    loading,
    upsertingId,
    toggleDone,
    saveNote,
    deleteNote,
    saveReadingSection,
    isUpserting,
  };
}
