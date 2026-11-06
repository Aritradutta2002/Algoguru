import { useEffect, useRef } from "react";
import { useReducedMotion, useSpring } from "framer-motion";
import { TILT_SPRING } from "@/lib/motion";

const MAX_TILT = 4;

/**
 * Subtle pointer-following plane tilt for showcase surfaces.
 *
 * Mouse only, disabled under reduced motion and on narrow layouts, and it
 * writes to springs instead of React state so pointer movement never renders.
 */
export function usePointerTilt() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const rotateX = useSpring(0, TILT_SPRING);
  const rotateY = useSpring(0, TILT_SPRING);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    let frame: number | null = null;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || frame !== null) return;
      const rect = el.getBoundingClientRect();
      frame = requestAnimationFrame(() => {
        frame = null;
        const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
        const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
        rotateY.set(offsetX * MAX_TILT * 2);
        rotateX.set(-offsetY * MAX_TILT * 2);
      });
    };

    const reset = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      rotateX.set(0);
      rotateY.set(0);
    };

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);

    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("pointercancel", reset);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reduceMotion, rotateX, rotateY]);

  return { ref, rotateX, rotateY };
}
