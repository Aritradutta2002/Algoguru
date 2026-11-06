import { useEffect, useRef, type ButtonHTMLAttributes, type RefObject } from "react";
import { cn } from "@/lib/utils";

const MAX_PULL = 6;

/**
 * Pulls an element toward the cursor by writing two CSS variables in rAF.
 * The `.magnetic` class consumes them through the standalone `translate`
 * property so it composes with Tailwind's transform-based hover lifts.
 */
export function useMagnetic<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | null = null;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || frame !== null) return;
      const rect = el.getBoundingClientRect();
      frame = requestAnimationFrame(() => {
        frame = null;
        const pullX = ((event.clientX - rect.left) / rect.width - 0.5) * MAX_PULL * 2;
        const pullY = ((event.clientY - rect.top) / rect.height - 0.5) * MAX_PULL;
        el.style.setProperty("--mag-x", `${pullX.toFixed(2)}px`);
        el.style.setProperty("--mag-y", `${pullY.toFixed(2)}px`);
      });
    };

    const reset = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      el.style.setProperty("--mag-x", "0px");
      el.style.setProperty("--mag-y", "0px");
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
  }, []);

  return ref;
}

export function MagneticButton({
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useMagnetic<HTMLButtonElement>();

  return (
    <button ref={ref} type={type} className={cn("magnetic", className)} {...props}>
      {children}
    </button>
  );
}
