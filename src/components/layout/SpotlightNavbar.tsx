import {
  forwardRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightNavbarProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/**
 * App header shell with a cursor-following spotlight.
 *
 * Pointer coordinates live in MotionValues and are painted through a
 * MotionTemplate, so moving the mouse never schedules a React render.
 */
export const SpotlightNavbar = forwardRef<HTMLElement, SpotlightNavbarProps>(
  function SpotlightNavbar(
    { children, className, onPointerMove, ...props },
    ref,
  ) {
    const reduceMotion = useReducedMotion();
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const spotlight = useMotionTemplate`radial-gradient(520px circle at ${pointerX}px ${pointerY}px, hsl(var(--obsidian-accent) / 0.16), transparent 46%)`;

    const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
      onPointerMove?.(event);
      if (reduceMotion || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointerX.set(event.clientX - rect.left);
      pointerY.set(event.clientY - rect.top);
    };

    return (
      <header
        ref={ref}
        onPointerMove={handlePointerMove}
        className={cn(
          "group relative isolate border-b border-obsidian-border bg-obsidian-elevated/90 backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: spotlight }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-white/[0.12]" />
        </div>
        <div className="relative z-10 h-full">{children}</div>
      </header>
    );
  },
);

SpotlightNavbar.displayName = "SpotlightNavbar";
