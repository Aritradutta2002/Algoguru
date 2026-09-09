import { motion, useScroll, useSpring } from "framer-motion";
import type { RefObject } from "react";

interface ScrollProgressBarProps {
  /** The scrollable container to track. */
  containerRef: RefObject<HTMLElement>;
}

/**
 * Slim gradient progress bar pinned to the top of a scroll container.
 * Invisible on pages with nothing to scroll (progress stays 0).
 */
export function ScrollProgressBar({ containerRef }: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[2.5px] origin-left bg-gradient-to-r from-primary via-primary to-accent"
    />
  );
}
