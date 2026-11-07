import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Code2,
  Terminal,
  Target,
  BrainCircuit,
  Map as MapIcon,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DockItem {
  icon: React.ElementType;
  title: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
}

export interface GlassDockProps {
  items?: DockItem[];
  className?: string;
  onItemClick?: (item: DockItem) => void;
}

const DEFAULT_DOCK_ITEMS: DockItem[] = [
  { icon: Layers, title: "Paths", href: "#modules" },
  { icon: Target, title: "DSA Practice", href: "/practice", badge: "DSA" },
  { icon: Terminal, title: "Playground", href: "/playground" },
  { icon: Code2, title: "Daily Challenge", href: "/problem-solver" },
  { icon: BrainCircuit, title: "System Design", href: "/interview/java/system-design" },
  { icon: MapIcon, title: "Roadmap", badge: "Live" },
];

export function GlassDock({
  items = DEFAULT_DOCK_ITEMS,
  className,
  onItemClick,
}: GlassDockProps) {
  const reduceMotion = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-5 left-1/2 z-40 -translate-x-1/2 select-none",
        "flex items-center gap-1.5 rounded-2xl border border-border/80 bg-background/85 px-3 py-2",
        "backdrop-blur-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.15)]",
        className
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isHovered = hoveredIdx === idx;
        const isNeighbor =
          hoveredIdx !== null && Math.abs(hoveredIdx - idx) === 1;

        const scale = reduceMotion
          ? 1
          : isHovered
          ? 1.25
          : isNeighbor
          ? 1.1
          : 1;

        const content = (
          <motion.div
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl",
              "border border-transparent transition-colors duration-150",
              isHovered
                ? "border-primary/40 bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon size={19} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 rounded-full border border-primary/40 bg-primary px-1 py-0.2 font-mono text-[8px] font-bold text-primary-foreground shadow-xs">
                {item.badge}
              </span>
            )}
          </motion.div>
        );

        return (
          <div
            key={item.title}
            className="group relative"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Tooltip Label */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="whitespace-nowrap rounded-lg border border-border bg-card px-2 py-0.5 text-[10.5px] font-semibold text-foreground shadow-md">
                {item.title}
              </span>
            </div>

            {item.href?.startsWith("/") ? (
              <Link
                to={item.href}
                onClick={() => onItemClick?.(item)}
                aria-label={item.title}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl inline-block"
              >
                {content}
              </Link>
            ) : item.href?.startsWith("#") ? (
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onItemClick?.(item);
                  const target = document.getElementById(item.href!.slice(1));
                  target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
                }}
                aria-label={item.title}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl inline-block"
              >
                {content}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  item.onClick?.();
                  onItemClick?.(item);
                }}
                aria-label={item.title}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl inline-block"
              >
                {content}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default GlassDock;
