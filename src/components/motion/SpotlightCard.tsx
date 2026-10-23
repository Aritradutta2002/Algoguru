import { useEffect, useRef, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the shared lift-on-hover treatment. */
  interactive?: boolean;
}

/**
 * A card with a soft pointer-following highlight.
 *
 * The highlight is painted by a pseudo-element (`.spotlight-card::before`) and
 * positioned with two CSS variables, so pointer movement never triggers a React
 * render. Disabled automatically on touch and for reduced-motion users.
 */
export function SpotlightCard({
  className,
  interactive = false,
  children,
  onPointerMove,
  ...props
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (event.pointerType !== "mouse") return;

    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
    });
  };

  return (
    <div
      ref={ref}
      className={cn(
        "spotlight-card premium-card",
        interactive && "premium-card-hover",
        className,
      )}
      onPointerMove={handlePointerMove}
      {...props}
    >
      {children}
    </div>
  );
}
