import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface KineticTextLoaderProps {
  text?: string;
  subtext?: string;
  className?: string;
}

export function KineticTextLoader({
  text = "ALGOGURU",
  subtext = "Synthesizing algorithm workspace…",
  className,
}: KineticTextLoaderProps) {
  const reduceMotion = useReducedMotion();
  const letters = Array.from(text);

  if (reduceMotion) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 p-6", className)}>
        <p className="font-display text-lg font-bold tracking-wider text-foreground">{text}</p>
        {subtext && <p className="font-mono text-xs text-muted-foreground">{subtext}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-6 select-none", className)}>
      <div className="flex items-center gap-1 font-display text-xl sm:text-2xl font-black tracking-widest text-foreground">
        {letters.map((char, index) => (
          <motion.span
            key={index}
            initial={{ y: 0, opacity: 0.6 }}
            animate={{
              y: [-4, 4, -4],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: index * 0.08,
              ease: "easeInOut",
            }}
            className="inline-block bg-gradient-to-b from-foreground via-primary to-accent bg-clip-text text-transparent drop-shadow-xs"
          >
            {char}
          </motion.span>
        ))}
      </div>

      {subtext && (
        <motion.p
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-xs text-muted-foreground tracking-wide"
        >
          {subtext}
        </motion.p>
      )}
    </div>
  );
}

export default KineticTextLoader;
