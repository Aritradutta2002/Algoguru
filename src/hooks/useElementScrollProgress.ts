import { useEffect, useRef, type RefObject } from "react";
import { useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * Progress (0 → 1) of a landing section as it travels past the app shell.
 *
 * The product scrolls inside `#main-content`, not the window, so a plain
 * `useScroll()` would never update. Layout is measured once and refreshed on
 * resize; the scroll handler only writes to a motion value in rAF.
 */
export function useElementScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
): MotionValue<number> | null {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;

    const target = targetRef.current;
    const container = document.getElementById("main-content");
    if (!target || !container) return;

    let start = 0;
    let span = 1;

    const measure = () => {
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetTop = targetRect.top - containerRect.top + container.scrollTop;
      start = targetTop - containerRect.height * 0.15;
      span = Math.max(target.offsetHeight, 1);
    };

    const update = () => {
      frame.current = null;
      const value = Math.min(1, Math.max(0, (container.scrollTop - start) / span));
      progress.set(value);
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [progress, reduceMotion, targetRef]);

  return reduceMotion ? null : progress;
}
