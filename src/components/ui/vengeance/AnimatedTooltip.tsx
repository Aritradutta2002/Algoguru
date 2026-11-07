import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface TooltipItem {
  id: number | string;
  name: string;
  designation: string;
  image?: string;
  icon?: React.ReactNode;
}

export interface AnimatedTooltipProps {
  items: TooltipItem[];
  className?: string;
}

export function AnimatedTooltip({ items, className }: AnimatedTooltipProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | string | null>(null);
  const reduceMotion = useReducedMotion();
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  // Rotate tooltip according to pointer x displacement
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-35, 35]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-40, 40]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <div className={cn("flex flex-row items-center gap-1.5", className)}>
      {items.map((item) => (
        <div
          className="group relative -mr-2"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 15, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 15, scale: 0.6 }}
                style={{
                  translateX: reduceMotion ? 0 : translateX,
                  rotate: reduceMotion ? 0 : rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-14 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-primary/30 bg-background/95 px-3 py-1.5 text-xs shadow-xl backdrop-blur-md"
              >
                <div className="font-bold text-foreground">{item.name}</div>
                <div className="font-mono text-[10px] text-primary">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-card p-1 text-foreground shadow-sm transition-transform duration-200 group-hover:z-30 group-hover:scale-105">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : item.icon ? (
              item.icon
            ) : (
              <span className="font-display text-xs font-bold">{item.name[0]}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnimatedTooltip;
