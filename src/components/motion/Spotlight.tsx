import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tracks the cursor for `.spotlight-card` (see motion.css). Writes --spot-x /
 * --spot-y straight to the DOM node so hovering never triggers a re-render.
 * Attach to any element carrying the `spotlight-card` class.
 */
export function handleSpotlightMove(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Glow tint, e.g. "#A78BFA2e" or "hsl(var(--primary) / 0.14)". */
  color?: string;
  style?: CSSProperties;
}

/** Drop-in card with a cursor-tracking spotlight sheen on hover. */
export function SpotlightCard({ children, className, color, style }: SpotlightCardProps) {
  return (
    <div
      onMouseMove={handleSpotlightMove}
      style={{ "--spot-color": color, ...style } as CSSProperties}
      className={cn("spotlight-card", className)}
    >
      {children}
    </div>
  );
}
