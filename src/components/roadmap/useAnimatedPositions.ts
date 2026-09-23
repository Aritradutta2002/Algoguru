import { useEffect, useRef, useState } from "react";
import type { Node } from "@xyflow/react";

interface Position {
  x: number;
  y: number;
}

const DURATION_MS = 380;

/**
 * Eases node positions toward their layout targets so collapse / expand /
 * search filter transitions glide instead of jumping. Edges follow
 * automatically because React Flow derives them from node coordinates.
 *
 * The first layout (mount / roadmap switch) snaps instantly; subsequent
 * changes animate with an ease-out curve over ~380ms.
 */
export function useAnimatedPositions<T extends { id: string; position: Position }>(
  targets: T[],
  resetKey: string,
): T[] {
  const [displayed, setDisplayed] = useState<Map<string, Position>>(() => new Map());
  const currentRef = useRef<Map<string, Position>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastResetKey = useRef(resetKey);
  const isFirst = useRef(true);

  // Detect roadmap switches — snap instead of animating across graphs
  useEffect(() => {
    if (lastResetKey.current !== resetKey) {
      lastResetKey.current = resetKey;
      isFirst.current = true;
      currentRef.current = new Map();
      setDisplayed(new Map());
    }
  }, [resetKey]);

  useEffect(() => {
    const targetsMap = new Map<string, Position>();
    for (const n of targets) targetsMap.set(n.id, { ...n.position });

    // First layout: snap everything into place
    if (isFirst.current) {
      isFirst.current = false;
      currentRef.current = targetsMap;
      setDisplayed(targetsMap);
      return;
    }

    // New nodes appear instantly at their target; existing ones will glide
    let changed = false;
    for (const [id, pos] of targetsMap) {
      const cur = currentRef.current.get(id);
      if (!cur) {
        currentRef.current.set(id, { ...pos });
        changed = true;
      } else if (Math.abs(cur.x - pos.x) > 0.5 || Math.abs(cur.y - pos.y) > 0.5) {
        changed = true;
      }
    }
    // Drop nodes that no longer exist
    for (const id of Array.from(currentRef.current.keys())) {
      if (!targetsMap.has(id)) {
        currentRef.current.delete(id);
        changed = true;
      }
    }
    if (!changed) return;

    const start = performance.now();
    // Snapshot the starting positions for this animation run
    const from = new Map<string, Position>();
    for (const [id, pos] of targetsMap) {
      from.set(id, { ...(currentRef.current.get(id) ?? pos) });
    }

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);

      const next = new Map<string, Position>();
      for (const [id, target] of targetsMap) {
        const f = from.get(id)!;
        next.set(id, {
          x: f.x + (target.x - f.x) * e,
          y: f.y + (target.y - f.y) * e,
        });
      }
      currentRef.current = next;
      setDisplayed(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [targets]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (displayed.size === 0) return targets;

  return targets.map((n) => {
    const pos = displayed.get(n.id);
    if (!pos) return n;
    if (Math.abs(pos.x - n.position.x) < 0.01 && Math.abs(pos.y - n.position.y) < 0.01) {
      return n;
    }
    return { ...n, position: pos };
  });
}
