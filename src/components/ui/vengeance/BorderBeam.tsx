import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion(): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return matches;
}

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  iterations?: number | "infinite";
}

export function BorderBeam({
  className,
  size = 240,
  duration = 12,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#38bdf8",
  colorTo = "#6366f1",
  delay = 0,
  iterations = "infinite",
}: BorderBeamProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] border border-primary/25",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const iterationStyle = iterations === "infinite" ? "infinite" : `${iterations}`;

  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": delay,
          "--iterations": iterationStyle,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "[-webkit-mask-clip:padding-box,border-box] [-webkit-mask-composite:destination-in] [-webkit-mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:[animation:border-beam_calc(var(--duration)*1s)_var(--iterations)_linear] after:[animation-delay:var(--delay)s] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
      aria-hidden="true"
    />
  );
}

export default BorderBeam;
