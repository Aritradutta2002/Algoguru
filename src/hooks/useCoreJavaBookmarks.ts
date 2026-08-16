import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Per-user bookmark state for Java interview questions.
 * Persisted in the core_java_user_state table (is_bookmarked column),
 * so bookmarks follow the signed-in user across devices.
 */
export function useCoreJavaBookmarks() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBookmarkedIds([]);
      setLoading(false);
      return;
    }

    const loadBookmarks = async () => {
      try {
        const { data, error } = await supabase
          .from("core_java_user_state")
          .select("question_id, is_bookmarked")
          .eq("user_id", user.id)
          .eq("is_bookmarked", true);

        if (error) {
          console.warn("Could not load core java bookmarks:", error.message);
          setLoading(false);
          return;
        }
        setBookmarkedIds((data ?? []).map((row) => row.question_id));
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [authLoading, user]);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.includes(id),
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const prev = bookmarkedIds;
      const nextValue = !prev.includes(id);

      // Optimistic update
      setBookmarkedIds(nextValue ? [...prev, id] : prev.filter((v) => v !== id));
      setTogglingId(id);

      const { error } = await supabase
        .from("core_java_user_state")
        .upsert(
          { user_id: user.id, question_id: id, is_bookmarked: nextValue },
          { onConflict: "user_id,question_id" }
        );

      setTogglingId(null);
      if (error) {
        // Revert on failure
        setBookmarkedIds(prev);
        console.warn("Bookmark save failed:", error.message);
        return false;
      }
      return true;
    },
    [user, bookmarkedIds]
  );

  const isToggling = useCallback((id: string) => togglingId === id, [togglingId]);

  const count = useMemo(() => bookmarkedIds.length, [bookmarkedIds]);

  return { bookmarkedIds, isBookmarked, toggleBookmark, loading, isToggling, count };
}
