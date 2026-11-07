import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TrailConfig {
  imageLifespan?: number;
  inDuration?: number;
  outDuration?: number;
  staggerIn?: number;
  staggerOut?: number;
  slideDuration?: number;
  maxActiveItems?: number;
}

export interface PixelatedImageTrailProps {
  images?: string[];
  imageSize?: number;
  slices?: number;
  smoothing?: number;
  spawnThreshold?: number;
  config?: Partial<TrailConfig>;
  className?: string;
  children?: React.ReactNode;
}

interface ActiveTrailItem {
  id: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
}

const DEFAULT_IMAGES = [
  "/trail/binary-search-tree.svg",
  "/trail/dynamic-programming.svg",
  "/trail/graph-dijkstra.svg",
  "/trail/lru-cache-code.svg",
  "/trail/system-design-cluster.svg",
  "/trail/jvm-memory-model.svg",
  "/trail/guru-ai-diagnostics.svg",
  "/trail/concurrency-threadpool.svg",
];

const DEFAULT_CONFIG: Required<TrailConfig> = {
  imageLifespan: 1400,
  inDuration: 280,
  outDuration: 520,
  staggerIn: 18,
  staggerOut: 14,
  slideDuration: 1200,
  maxActiveItems: 8,
};

export function PixelatedImageTrail({
  images = DEFAULT_IMAGES,
  imageSize = 220,
  slices = 5,
  smoothing = 0.32,
  spawnThreshold = 36,
  config: userConfig,
  className,
  children,
}: PixelatedImageTrailProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeItems, setActiveItems] = useState<ActiveTrailItem[]>([]);
  const imageIndexRef = useRef(0);
  const idGenRef = useRef(0);
  const activeTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Pointer smoothing & interpolation coordinates
  const currentPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const lastSpawnPos = useRef({ x: -9999, y: -9999 });
  const isPointerInside = useRef(false);
  const rafId = useRef<number | null>(null);
  const isVisible = useRef(true);
  const [isFinePointer, setIsFinePointer] = useState(false);

  // Mobile fallback auto-reveal cycle state
  const [mobileActiveImage, setMobileActiveImage] = useState<string>(images[0] ?? DEFAULT_IMAGES[0]);

  // Capability detection for (hover: hover) and (pointer: fine)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    try {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!mq) return;
      setIsFinePointer(Boolean(mq.matches));

      const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener?.("change", handler);
      } else if (typeof (mq as any).addListener === "function") {
        (mq as any).addListener(handler);
        return () => (mq as any).removeListener?.(handler);
      }
    } catch {
      // Graceful fallback for non-browser/test environments
    }
  }, []);

  // IntersectionObserver to pause loop when hero is offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible.current = entry.isIntersecting;
          if (!entry.isIntersecting && rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    const timers = activeTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  // Spawn a new trail image with clean lifecycle timer (avoids state updates in RAF loop)
  const spawnItem = useCallback(
    (x: number, y: number) => {
      const src = images[imageIndexRef.current % images.length];
      imageIndexRef.current += 1;
      const id = `trail-${idGenRef.current++}`;
      // Controlled organic tilt (-7deg to 7deg)
      const rotation = ((idGenRef.current % 7) - 3) * 2.1;

      // Clamp coordinates to container bounds to avoid layout overflow
      const rect = containerRef.current?.getBoundingClientRect();
      const halfW = imageSize / 2;
      const halfH = Math.round(imageSize * 0.72) / 2;
      const maxX = (rect?.width ?? 1200) - halfW - 8;
      const maxY = (rect?.height ?? 800) - halfH - 8;
      const clampedX = Math.max(halfW + 8, Math.min(maxX, x));
      const clampedY = Math.max(halfH + 8, Math.min(maxY, y));

      const newItem: ActiveTrailItem = {
        id,
        src,
        x: clampedX,
        y: clampedY,
        rotation,
      };

      setActiveItems((prev) => {
        const trimmed =
          prev.length >= config.maxActiveItems
            ? prev.slice(prev.length - config.maxActiveItems + 1)
            : prev;
        return [...trimmed, newItem];
      });

      // Individual expiration timer triggers AnimatePresence exit transition cleanly
      const timer = setTimeout(() => {
        setActiveItems((prev) => prev.filter((item) => item.id !== id));
        activeTimersRef.current.delete(timer);
      }, config.imageLifespan);
      activeTimersRef.current.add(timer);
    },
    [config.imageLifespan, config.maxActiveItems, imageSize, images]
  );

  // Coordinating RAF loop - runs ONLY when pointer is moving inside the hero
  const startLoop = useCallback(() => {
    if (rafId.current !== null || reduceMotion || !isFinePointer) return;

    const loop = () => {
      if (!isVisible.current || !isPointerInside.current) {
        rafId.current = null;
        return;
      }

      // Linear interpolation smoothing: pos += (target - pos) * smoothing
      const prevX = currentPos.current.x;
      const prevY = currentPos.current.y;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * smoothing;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * smoothing;

      const dx = currentPos.current.x - lastSpawnPos.current.x;
      const dy = currentPos.current.y - lastSpawnPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist >= spawnThreshold) {
        spawnItem(currentPos.current.x, currentPos.current.y);
        lastSpawnPos.current = { x: currentPos.current.x, y: currentPos.current.y };
      }

      // If motion has settled and target is reached, pause loop until next movement
      const remainingDist = Math.hypot(
        targetPos.current.x - currentPos.current.x,
        targetPos.current.y - currentPos.current.y
      );

      if (remainingDist < 0.25 && Math.hypot(currentPos.current.x - prevX, currentPos.current.y - prevY) < 0.1) {
        rafId.current = null;
        return;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
  }, [isFinePointer, reduceMotion, smoothing, spawnItem, spawnThreshold]);

  // Pointer event listeners on parent / container
  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !isFinePointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentPos.current = { x, y };
    targetPos.current = { x, y };
    isPointerInside.current = true;
    startLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !isFinePointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    targetPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isPointerInside.current = true;
    startLoop();
  };

  const handlePointerLeave = () => {
    isPointerInside.current = false;
  };

  // Mobile / tablet alternative: gentle timed rotation without mouse dependency
  useEffect(() => {
    if (isFinePointer || reduceMotion) return;
    const timer = setInterval(() => {
      imageIndexRef.current = (imageIndexRef.current + 1) % images.length;
      setMobileActiveImage(images[imageIndexRef.current]);
    }, 4200);
    return () => clearInterval(timer);
  }, [images, isFinePointer, reduceMotion]);

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("relative w-full overflow-hidden", className)}
    >
      {/* ── Active Trail Canvas Layer (Pointer Events None so CTAs remain clickable) ── */}
      {isFinePointer && !reduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <AnimatePresence>
            {activeItems.map((item) => (
              <TrailItemCard
                key={item.id}
                item={item}
                imageSize={imageSize}
                slices={slices}
                config={config}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Mobile & Reduced-Motion Ambient Treatment ── */}
      {(!isFinePointer || reduceMotion) && (
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-end pr-10 opacity-20 overflow-hidden"
          aria-hidden="true"
        >
          <div className="relative h-[200px] w-[260px] rounded-2xl border border-primary/20 bg-card/30 p-2 backdrop-blur-xs shadow-card">
            <img
              src={mobileActiveImage}
              alt=""
              className="h-full w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* ── Projected Children (Headlines, CTAs, Hero Elements) ── */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface TrailItemCardProps {
  item: ActiveTrailItem;
  imageSize: number;
  slices: number;
  config: Required<TrailConfig>;
}

function TrailItemCard({ item, imageSize, slices, config }: TrailItemCardProps) {
  const halfW = imageSize / 2;
  const halfH = Math.round(imageSize * 0.72) / 2;
  const sliceHeight = 100 / slices;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, rotate: item.rotation - 3 }}
      animate={{ opacity: 1, scale: 1, rotate: item.rotation }}
      exit={{ opacity: 0, scale: 0.94, y: 12, filter: "blur(4px)" }}
      transition={{
        duration: config.inDuration / 1000,
        exit: { duration: config.outDuration / 1000 },
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${item.x - halfW}px, ${item.y - halfH}px, 0)`,
        width: imageSize,
        height: Math.round(imageSize * 0.72),
        willChange: "transform, opacity",
      }}
      className="pointer-events-none select-none rounded-xl border border-primary/30 bg-background/90 p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65),0_0_16px_rgba(56,189,248,0.2)] backdrop-blur-md"
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-black/40">
        {Array.from({ length: slices }).map((_, index) => {
          const topPercent = index * sliceHeight;
          const bottomPercent = 100 - (index + 1) * sliceHeight;

          return (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                clipPath: `inset(${topPercent}% 100% ${bottomPercent}% 0%)`,
              }}
              animate={{
                opacity: 1,
                clipPath: `inset(${topPercent}% 0% ${bottomPercent}% 0%)`,
              }}
              exit={{
                opacity: 0,
                clipPath: `inset(${topPercent}% 0% ${bottomPercent}% 100%)`,
              }}
              transition={{
                duration: config.inDuration / 1000,
                delay: index * (config.staggerIn / 1000),
                exit: {
                  duration: config.outDuration / 1000,
                  delay: (slices - index - 1) * (config.staggerOut / 1000),
                },
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0"
              style={{
                imageRendering: "pixelated",
              }}
            >
              <img
                src={item.src}
                alt=""
                className="h-full w-full object-contain filter contrast-105"
                draggable={false}
              />
            </motion.div>
          );
        })}

        {/* Pixel grid scanline sheen */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:8px_8px] opacity-60"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

export default PixelatedImageTrail;
