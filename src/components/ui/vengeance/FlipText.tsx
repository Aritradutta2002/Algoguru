import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FlipTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  stagger?: number;
}

export function FlipText({
  children,
  className,
  duration = 0.6,
  delay = 0,
  stagger = 0.035,
}: FlipTextProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  const characters = Array.from(children);

  return (
    <span
      className={cn("inline-flex flex-wrap overflow-hidden", className)}
      aria-label={children}
    >
      {characters.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{
            rotateX: 90,
            opacity: 0,
            y: 8,
          }}
          animate={{
            rotateX: 0,
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration,
            delay: delay + index * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
          style={{
            transformOrigin: "50% 50% -12px",
            backfaceVisibility: "hidden",
            whiteSpace: char === " " ? "pre" : "normal",
          }}
          aria-hidden="true"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default FlipText;
