import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Progress + bookmarks for the Spring Boot / Backend interview track.
 *
 * Deliberately localStorage-only: the track ships without a Supabase migration,
 * so it works for signed-out visitors and never blocks rendering on a network
 * round trip. The shape is a plain string[] of ids so it stays forward
 * compatible if it is later synced to a table.
 */

const STUDIED_KEY = "algoguru:backend-interview:studied";
const BOOKMARK_KEY = "algoguru:backend-interview:bookmarks";
const PRACTICE_KEY = "algoguru:backend-interview:practice-solved";

type Bucket = "studied" | "bookmarks" | "practice";

const STORAGE_KEYS: Record<Bucket, string> = {
  studied: STUDIED_KEY,
  bookmarks: BOOKMARK_KEY,
  practice: PRACTICE_KEY,
};

/** Fired after any local write so every mounted hook instance stays in sync. */
const SYNC_EVENT = "algoguru:backend-interview:sync";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, value: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...value]));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }));
  } catch {
    // Quota or private-mode failures are non-fatal: progress is a convenience.
  }
}

function useStoredSet(bucket: Bucket) {
  const key = STORAGE_KEYS[bucket];
  const [ids, setIds] = useState<Set<string>>(() => readSet(key));

  useEffect(() => {
    const refresh = () => setIds(readSet(key));
    window.addEventListener(SYNC_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SYNC_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [key]);

  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        writeSet(key, next);
        return next;
      });
    },
    [key],
  );

  const add = useCallback(
    (id: string) => {
      setIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        writeSet(key, next);
        return next;
      });
    },
    [key],
  );

  const remove = useCallback(
    (id: string) => {
      setIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        writeSet(key, next);
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    const empty = new Set<string>();
    writeSet(key, empty);
    setIds(empty);
  }, [key]);

  return { ids, toggle, add, remove, clear };
}

export interface BackendProgressApi {
  studiedIds: Set<string>;
  bookmarkedIds: Set<string>;
  solvedPracticeIds: Set<string>;
  isStudied: (id: string) => boolean;
  isBookmarked: (id: string) => boolean;
  isPracticeSolved: (id: string) => boolean;
  toggleStudied: (id: string) => void;
  toggleBookmark: (id: string) => void;
  togglePracticeSolved: (id: string) => void;
  markStudied: (id: string) => void;
  resetProgress: () => void;
  studiedCount: number;
  bookmarkCount: number;
  practiceSolvedCount: number;
  /** 0-100 completion for an arbitrary total. */
  percentOf: (total: number) => number;
}

export function useBackendInterviewProgress(): BackendProgressApi {
  const studied = useStoredSet("studied");
  const bookmarks = useStoredSet("bookmarks");
  const practice = useStoredSet("practice");

  const isStudied = useCallback((id: string) => studied.ids.has(id), [studied.ids]);
  const isBookmarked = useCallback((id: string) => bookmarks.ids.has(id), [bookmarks.ids]);
  const isPracticeSolved = useCallback((id: string) => practice.ids.has(id), [practice.ids]);

  const resetProgress = useCallback(() => {
    studied.clear();
    bookmarks.clear();
    practice.clear();
  }, [studied, bookmarks, practice]);

  const percentOf = useCallback(
    (total: number) => (total <= 0 ? 0 : Math.round((studied.ids.size / total) * 100)),
    [studied.ids],
  );

  return useMemo(
    () => ({
      studiedIds: studied.ids,
      bookmarkedIds: bookmarks.ids,
      solvedPracticeIds: practice.ids,
      isStudied,
      isBookmarked,
      isPracticeSolved,
      toggleStudied: studied.toggle,
      toggleBookmark: bookmarks.toggle,
      togglePracticeSolved: practice.toggle,
      markStudied: studied.add,
      resetProgress,
      studiedCount: studied.ids.size,
      bookmarkCount: bookmarks.ids.size,
      practiceSolvedCount: practice.ids.size,
      percentOf,
    }),
    [studied, bookmarks, practice, isStudied, isBookmarked, isPracticeSolved, resetProgress, percentOf],
  );
}
