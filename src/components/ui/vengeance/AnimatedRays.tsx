import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedRaysProps {
  className?: string;
  rayCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  opacity?: number;
}

export function AnimatedRays({
  className,
  rayCount = 7,
  primaryColor = "rgba(56, 189, 248, 0.15)",
  secondaryColor = "rgba(99, 102, 241, 0.12)",
  opacity = 0.8,
}: AnimatedRaysProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden opacity-40",
          className
        )}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[30%] left-1/2 h-[120%] w-[140%] -translate-x-1/2"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${primaryColor}, transparent 65%)`,
          }}
        />
      </div>
    );
  }

  const rays = Array.from({ length: rayCount });

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Central light source emitter */}
      <div
        className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(ellipse at center, ${primaryColor}, transparent 70%)`,
        }}
      />

      {/* Fan of animated perspective beams */}
      <div className="absolute inset-0 flex justify-center">
        {rays.map((_, i) => {
          const angle = ((i - (rayCount - 1) / 2) / ((rayCount - 1) / 2)) * 38;
          const duration = 7 + (i % 3) * 2.5;
          const delay = (i * 0.4) % 3;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.2, rotate: angle }}
              animate={{
                opacity: [0.15, 0.4, 0.18],
                rotate: [angle - 2, angle + 2, angle - 2],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: "-20%",
                width: "140px",
                height: "140%",
                transformOrigin: "top center",
                background: `linear-gradient(180deg, ${
                  i % 2 === 0 ? primaryColor : secondaryColor
                } 0%, rgba(0, 0, 0, 0) 80%)`,
                filter: "blur(28px)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default AnimatedRays;
