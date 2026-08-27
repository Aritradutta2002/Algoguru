import { useCallback, useEffect, useMemo, useState } from "react";
import type { RoadmapId } from "@/data/roadmaps";
import type {
  CompletionStats,
  NodeProgress,
  NodeStatus,
  Roadmap,
  RoadmapProgress,
} from "@/types/roadmapGraph";

/**
 * Safe localStorage wrapper (mirrors useResponsivePreferences) so the service
 * can be used in both React components and pure functions.
 */
function safeStorage() {
  try {
    const probe = "__rm_probe__";
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return {
      get: (k: string) => {
        try {
          return localStorage.getItem(k);
        } catch {
          return null;
        }
      },
      set: (k: string, v: string) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* ignore */
        }
      },
      del: (k: string) => {
        try {
          localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    const mem = new Map<string, string>();
    return {
      get: (k: string) => mem.get(k) ?? null,
      set: (k: string, v: string) => void mem.set(k, v),
      del: (k: string) => void mem.delete(k),
    };
  }
}

const storage = safeStorage();

const PROGRESS_KEY = (rm: RoadmapId, uid: string | "anon") =>
  `cp-roadmap:${uid}:${rm}`;

const POSITION_KEY = (rm: RoadmapId, uid: string | "anon") =>
  `cp-roadmap-positions:${uid}:${rm}`;

export type PositionMap = Record<string, { x: number; y: number }>;

// ── Progress CRUD (pure functions) ────────────────────────────────────────

export function loadProgress(
  rm: RoadmapId,
  uid: string | "anon" = "anon"
): RoadmapProgress {
  const raw = storage.get(PROGRESS_KEY(rm, uid));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as RoadmapProgress;
  } catch {
    /* ignore corrupt blob */
  }
  return {};
}

export function saveProgress(
  rm: RoadmapId,
  progress: RoadmapProgress,
  uid: string | "anon" = "anon"
): void {
  storage.set(PROGRESS_KEY(rm, uid), JSON.stringify(progress));
}

export function setNodeStatus(
  rm: RoadmapId,
  nodeId: string,
  status: NodeStatus,
  current: RoadmapProgress,
  uid: string | "anon" = "anon"
): RoadmapProgress {
  const next: RoadmapProgress = { ...current };
  if (status === "not-started") {
    delete next[nodeId];
  } else {
    next[nodeId] = { status, updatedAt: Date.now() };
  }
  saveProgress(rm, next, uid);
  return next;
}

export function clearProgress(rm: RoadmapId, uid: string | "anon" = "anon"): void {
  storage.del(PROGRESS_KEY(rm, uid));
}

// ── Position persistence (per-node drag offsets) ──────────────────────────

export function loadPositions(
  rm: RoadmapId,
  uid: string | "anon" = "anon"
): PositionMap {
  const raw = storage.get(POSITION_KEY(rm, uid));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as PositionMap;
  } catch {
    /* ignore */
  }
  return {};
}

export function savePositions(
  rm: RoadmapId,
  positions: PositionMap,
  uid: string | "anon" = "anon"
): void {
  storage.set(POSITION_KEY(rm, uid), JSON.stringify(positions));
}

export function setNodePosition(
  rm: RoadmapId,
  nodeId: string,
  offset: { x: number; y: number } | null,
  uid: string | "anon" = "anon"
): PositionMap {
  const all = loadPositions(rm, uid);
  if (offset === null) {
    delete all[nodeId];
  } else {
    all[nodeId] = offset;
  }
  savePositions(rm, all, uid);
  return all;
}

// ── Pure derivations ──────────────────────────────────────────────────────

export function getNodeStatus(
  progress: RoadmapProgress,
  nodeId: string
): NodeStatus {
  return progress[nodeId]?.status ?? "not-started";
}

export function computeCompletion(
  roadmap: Roadmap,
  progress: RoadmapProgress
): CompletionStats {
  const total = roadmap.nodes.length;
  let completed = 0;
  let inProgress = 0;
  for (const n of roadmap.nodes) {
    const s = getNodeStatus(progress, n.id);
    if (s === "completed") completed += 1;
    else if (s === "in-progress") inProgress += 1;
  }
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, inProgress, total, percent };
}

/** Returns the ids of nodes whose prerequisites are all completed. */
export function getUnlocked(
  roadmap: Roadmap,
  progress: RoadmapProgress
): Set<string> {
  const unlocked = new Set<string>();
  for (const n of roadmap.nodes) {
    if (n.data.prerequisites.length === 0) {
      unlocked.add(n.id);
      continue;
    }
    const allDone = n.data.prerequisites.every(
      (id) => progress[id]?.status === "completed"
    );
    if (allDone) unlocked.add(n.id);
  }
  return unlocked;
}

// ── React hook ────────────────────────────────────────────────────────────

export interface UseRoadmapProgressResult {
  progress: RoadmapProgress;
  positions: PositionMap;
  setStatus: (nodeId: string, status: NodeStatus) => void;
  setPosition: (nodeId: string, offset: { x: number; y: number } | null) => void;
  clearAll: () => void;
  resetPositions: () => void;
}

/**
 * React hook for a single roadmap's progress + saved positions.
 * Reads from localStorage on mount, syncs changes back, and listens for
 * `storage` events so the graph updates if another tab edits the same roadmap.
 */
export function useRoadmapProgress(
  roadmap: Roadmap,
  uid: string | "anon" = "anon"
): UseRoadmapProgressResult {
  const [progress, setProgress] = useState<RoadmapProgress>(() =>
    loadProgress(roadmap.id, uid)
  );
  const [positions, setPositions] = useState<PositionMap>(() =>
    loadPositions(roadmap.id, uid)
  );

  // Reload when the roadmap id changes (e.g. user clicks a different tab).
  useEffect(() => {
    setProgress(loadProgress(roadmap.id, uid));
    setPositions(loadPositions(roadmap.id, uid));
  }, [roadmap.id, uid]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY(roadmap.id, uid)) {
        setProgress(loadProgress(roadmap.id, uid));
      }
      if (e.key === POSITION_KEY(roadmap.id, uid)) {
        setPositions(loadPositions(roadmap.id, uid));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [roadmap.id, uid]);

  const setStatus = useCallback(
    (nodeId: string, status: NodeStatus) => {
      setProgress((cur) => setNodeStatus(roadmap.id, nodeId, status, cur, uid));
    },
    [roadmap.id, uid]
  );

  const setPosition = useCallback(
    (nodeId: string, offset: { x: number; y: number } | null) => {
      setPositions((cur) => {
        const next = { ...cur };
        if (offset === null) {
          delete next[nodeId];
        } else {
          next[nodeId] = offset;
        }
        savePositions(roadmap.id, next, uid);
        return next;
      });
    },
    [roadmap.id, uid]
  );

  const clearAll = useCallback(() => {
    clearProgress(roadmap.id, uid);
    setProgress({});
  }, [roadmap.id, uid]);

  const resetPositions = useCallback(() => {
    storage.del(POSITION_KEY(roadmap.id, uid));
    setPositions({});
  }, [roadmap.id, uid]);

  return useMemo(
    () => ({ progress, positions, setStatus, setPosition, clearAll, resetPositions }),
    [progress, positions, setStatus, setPosition, clearAll, resetPositions]
  );
}
