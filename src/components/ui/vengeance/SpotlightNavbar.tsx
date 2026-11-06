import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavSectionItem {
  id: string;
  label: string;
}

export interface SpotlightNavbarProps {
  items?: NavSectionItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const DEFAULT_SECTIONS: NavSectionItem[] = [
  { id: "modules", label: "Learning Paths" },
  { id: "demo", label: "Workspace Demo" },
  { id: "bento", label: "Curriculum Flow" },
  { id: "quiz", label: "Skill Quiz" },
];

export function SpotlightNavbar({
  items = DEFAULT_SECTIONS,
  activeId,
  onSelect,
  className,
}: SpotlightNavbarProps) {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const spotlightX = useRef(0);

  // Sync activeId if provided
  useEffect(() => {
    if (!activeId) return;
    const idx = items.findIndex((item) => item.id === activeId);
    if (idx !== -1) setActiveIndex(idx);
  }, [activeId, items]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
    };

    const handleMouseLeave = () => {
      setHoverX(null);
      const activeEl = nav.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null;
      if (activeEl) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;

        animate(spotlightX.current, targetX, {
          type: "spring",
          stiffness: 220,
          damping: 24,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty("--spotlight-x", `${v}px`);
          },
        });
      }
    };

    nav.addEventListener("mousemove", handleMouseMove);
    nav.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      nav.removeEventListener("mousemove", handleMouseMove);
      nav.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeIndex, reduceMotion]);

  const handleClick = (item: NavSectionItem, index: number) => {
    setActiveIndex(index);
    if (onSelect) {
      onSelect(item.id);
    } else {
      const target = document.getElementById(item.id);
      if (target) {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }
    }
  };

  return (
    <div className={cn("sticky top-18 z-30 hidden justify-center px-4 py-3 sm:flex", className)}>
      <nav
        ref={navRef}
        aria-label="Page sections navigation"
        className={cn(
          "relative flex items-center gap-1 rounded-full border border-border/80 bg-card/80 p-1.5 backdrop-blur-xl shadow-soft",
          "overflow-hidden transition-all duration-300",
          "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        {/* Cursor Spotlight Glow Layer */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: hoverX !== null && !reduceMotion ? 1 : 0,
            background: `radial-gradient(130px circle at var(--spotlight-x, 50%) 50%, hsl(var(--primary) / 0.18), transparent 65%)`,
          }}
          aria-hidden="true"
        />

        <ul className="relative z-10 flex items-center gap-1">
          {items.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-index={idx}
                  onClick={() => handleClick(item, idx)}
                  className={cn(
                    "relative inline-flex min-h-[36px] items-center justify-center rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-current={isSelected ? "true" : undefined}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default SpotlightNavbar;
