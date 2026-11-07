import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LogoItem {
  name: string;
  category: string;
}

export interface LogoSliderProps {
  items?: LogoItem[];
  speed?: number;
  className?: string;
}

const DEFAULT_ITEMS: LogoItem[] = [
  { name: "Java 21", category: "Core Runtime" },
  { name: "Spring Boot", category: "Backend" },
  { name: "Python 3.12", category: "Algorithms" },
  { name: "C++ 20", category: "Competitive" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Redis L2", category: "In-Memory Cache" },
  { name: "Apache Kafka", category: "Event Streaming" },
  { name: "System Design", category: "Architecture" },
  { name: "LeetCode 500+", category: "Interview Curated" },
  { name: "FAANG Patterns", category: "Interview Mastery" },
];

export function LogoSlider({
  items = DEFAULT_ITEMS,
  speed = 28,
  className,
}: LogoSliderProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-4 py-4", className)}>
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-4 py-2 font-mono text-xs"
          >
            <span className="font-bold text-foreground">{item.name}</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">{item.category}</span>
          </div>
        ))}
      </div>
    );
  }

  // Duplicate list to achieve continuous loop without visual seam
  const duplicated = [...items, ...items, ...items];

  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden py-4 select-none",
        "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        className
      )}
    >
      <motion.div
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex shrink-0 items-center gap-4 group-hover:[animation-play-state:paused]"
      >
        {duplicated.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border/70 bg-card/75 px-4 py-2 backdrop-blur-md shadow-xs transition-colors hover:border-primary/40 hover:bg-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
            <span className="font-display text-xs font-bold text-foreground">{item.name}</span>
            <span className="text-muted-foreground/40 font-mono text-[10px]">·</span>
            <span className="font-mono text-[11px] text-muted-foreground">{item.category}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default LogoSlider;
