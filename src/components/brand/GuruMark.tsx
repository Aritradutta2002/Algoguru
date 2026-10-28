import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Guru — the AlgoGuru AI mascot, drawn as vectors.
 *
 * The marketing PNG (`public/brand/guru-ai.png`) is a 144px raster with baked-in
 * sparkles and a drop shadow, which turns to mush at avatar sizes. This module
 * is the same character authored on a 64 grid so it stays crisp from 16px in a
 * message row up to 96px in an empty state.
 *
 * Deliberately dependency-free (no lucide, no framer-motion, no CSS import) so
 * the app shell can render the launcher without pulling the chat bundle in.
 * Animation is transform/opacity only and is disabled under reduced motion via
 * the global `prefers-reduced-motion` rule in index.css.
 */

export type GuruMood = "idle" | "thinking" | "happy";

export type GuruMarkVariant = "gradient" | "flat" | "mono" | "knockout";

export interface GuruMarkProps {
  /** Rendered size in px (the mark is square). */
  size?: number;
  mood?: GuruMood;
  /**
   * - gradient : brand indigo→violet head (default)
   * - flat     : single accent fill — crisper at very small sizes
   * - mono     : currentColor head with a cut-out face
   * - knockout : line art only, no head fill
   */
  variant?: GuruMarkVariant;
  /** Force sparkles/cheeks on or off. Default: auto (off below 24px). */
  detail?: boolean;
  /** Play the idle orb pulse / blink loop. Default: true for idle + thinking. */
  animated?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when a neighbouring label already names it. */
  title?: string | null;
}

/* ── Geometry (64 grid) ───────────────────────────────────────────
   Head 8–56 × 12.5–56.5, optically centred at (32, 33). The face plate is
   inset 7.5 on each side so the badge keeps a confident coloured rim. */
const HEAD = { x: 8, y: 12.5, w: 48, h: 44, r: 17 };
const FACE = { x: 15.5, y: 20.5, w: 33, h: 29, r: 12.5 };

const CHEEK = "#FF8FB1";
const INK = "#232447";
const ORB = "#FFC24B";

export function GuruMark({
  size = 32,
  mood = "idle",
  variant = "gradient",
  detail,
  animated = true,
  className,
  title = "Guru",
}: GuruMarkProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const headGrad = `guru-head-${uid}`;
  const orbGrad = `guru-orb-${uid}`;
  const shineGrad = `guru-shine-${uid}`;
  const headClip = `guru-clip-${uid}`;

  const showDetail = detail ?? size >= 24;
  const isLine = variant === "knockout";
  const faceFill =
    variant === "mono" || variant === "knockout" ? "none" : "#F6F7FF";
  // Mono is a silhouette: the head is one colour and the features are punched
  // out of it with the surrounding cockpit colour.
  const ink = variant === "mono" ? "hsl(var(--guru-bg))" : isLine ? "currentColor" : INK;
  const headFill = isLine
    ? "none"
    : variant === "mono"
      ? "currentColor"
      : variant === "flat"
        ? "hsl(var(--guru-accent))"
        : `url(#${headGrad})`;
  const rimStroke =
    isLine || variant === "mono" ? "none" : "rgba(11,14,24,0.28)";
  const blink = animated && mood !== "happy";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0 overflow-visible", className)}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={headGrad} x1="10" y1="14" x2="54" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(246 82% 68%)" />
          <stop offset="52%" stopColor="hsl(252 76% 62%)" />
          <stop offset="100%" stopColor="hsl(268 78% 58%)" />
        </linearGradient>
        <linearGradient id={orbGrad} x1="29" y1="3" x2="35" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE7A3" />
          <stop offset="100%" stopColor={ORB} />
        </linearGradient>
        <linearGradient id={shineGrad} x1="14" y1="18" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={headClip}>
          <rect x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} rx={HEAD.r} />
        </clipPath>
      </defs>

      {/* Antenna orb + stem */}
      <g opacity={isLine ? 0.9 : 1}>
        <circle
          cx="32"
          cy="6.2"
          r="5.4"
          fill={isLine ? "none" : `url(#${orbGrad})`}
          opacity={isLine ? 0 : 0.22}
          className={animated && mood !== "happy" ? "animate-guru-orb" : undefined}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle
          cx="32"
          cy="6.2"
          r="3.4"
          fill={isLine ? "currentColor" : `url(#${orbGrad})`}
        />
        <rect
          x="31.1"
          y="8.9"
          width="1.8"
          height="5"
          rx="0.9"
          fill={isLine ? "currentColor" : "hsl(252 70% 58%)"}
        />
      </g>

      {/* Ears */}
      <rect
        x="3.2"
        y="29.5"
        width="6.4"
        height="12.5"
        rx="3.2"
        fill={headFill}
        stroke={rimStroke}
        strokeWidth={isLine ? 1.6 : 0.8}
      />
      <rect
        x="54.4"
        y="29.5"
        width="6.4"
        height="12.5"
        rx="3.2"
        fill={headFill}
        stroke={rimStroke}
        strokeWidth={isLine ? 1.6 : 0.8}
      />

      {/* Head */}
      <rect
        x={HEAD.x}
        y={HEAD.y}
        width={HEAD.w}
        height={HEAD.h}
        rx={HEAD.r}
        fill={headFill}
        stroke={rimStroke}
        strokeWidth={isLine ? 1.8 : 0.8}
      />
      {!isLine && variant !== "mono" && (
        <path
          d="M14 45c2-14 9-24 24-27 4-1 8 0 11 2-4-14-15-21-27-16C10 9 3 26 8 38c1 3 3 5 6 7Z"
          fill={`url(#${shineGrad})`}
          opacity="0.55"
          clipPath={`url(#${headClip})`}
        />
      )}

      {/* Face plate */}
      <rect
        x={FACE.x}
        y={FACE.y}
        width={FACE.w}
        height={FACE.h}
        rx={FACE.r}
        fill={faceFill}
        stroke={variant === "mono" ? "none" : isLine ? "currentColor" : "rgba(255,255,255,0.35)"}
        strokeWidth={isLine ? 1.4 : 0.8}
      />

      {/* Eyes — happy uses the classic "^ ^" arc, idle blinks periodically */}
      {mood === "happy" ? (
        <>
          <path d="M21.2 32.6c1.5-2.3 4.3-2.3 5.8 0" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
          <path d="M37 32.6c1.5-2.3 4.3-2.3 5.8 0" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
        </>
      ) : (
        <g
          fill={ink}
          className={blink ? "animate-guru-blink" : undefined}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <ellipse cx="24.2" cy="32.8" rx="2.5" ry="3.4" />
          <ellipse cx="39.8" cy="32.8" rx="2.5" ry="3.4" />
          {!isLine && (
            <>
              <circle cx="25.1" cy="31.6" r="0.95" fill="#FFFFFF" opacity="0.92" />
              <circle cx="40.7" cy="31.6" r="0.95" fill="#FFFFFF" opacity="0.92" />
            </>
          )}
        </g>
      )}

      {/* Smile */}
      <path
        d={mood === "happy" ? "M27.4 38.6c1.7 3.4 7.5 3.4 9.2 0" : "M28 39.2c1.5 2.6 6.5 2.6 8 0"}
        stroke={variant === "mono" ? "hsl(var(--guru-bg))" : isLine ? "currentColor" : INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {showDetail && !isLine && (
        <>
          <ellipse cx="19.4" cy="38.6" rx="3" ry="1.9" fill={CHEEK} opacity="0.42" />
          <ellipse cx="44.6" cy="38.6" rx="3" ry="1.9" fill={CHEEK} opacity="0.42" />
          {/* Four-point sparkles, echoing the PNG's accents */}
          <path d="M6.6 16.4c.6 1.9 1.2 2.5 3.1 3.1-1.9.6-2.5 1.2-3.1 3.1-.6-1.9-1.2-2.5-3.1-3.1 1.9-.6 2.5-1.2 3.1-3.1Z" fill={ORB} opacity="0.9" />
          <path d="M57.6 12.8c.5 1.5.9 2 2.4 2.4-1.5.4-2 .9-2.4 2.4-.5-1.5-.9-2-2.4-2.4 1.5-.4 2-.9 2.4-2.4Z" fill={ORB} opacity="0.7" />
        </>
      )}
    </svg>
  );
}

export interface GuruAvatarProps {
  size?: number;
  mood?: GuruMood;
  variant?: GuruMarkVariant;
  /** Gradient ring + inner glow. Use for the assistant identity. */
  ring?: boolean;
  /** Soft ambient glow behind the mark. */
  glow?: boolean;
  /** Presence dot in the bottom-right corner. */
  status?: "ready" | "busy" | "error" | null;
  className?: string;
  title?: string | null;
}

const STATUS_COLOR: Record<NonNullable<GuruAvatarProps["status"]>, string> = {
  ready: "bg-emerald-400",
  // Guru's own accent, not the app's blue CTA — the dot belongs to the mascot.
  busy: "bg-guru-accent",
  error: "bg-red-400",
};

/**
 * The Guru mark in a tile, with the identity ring. One component for every
 * place the assistant appears — header, message rows, history, empty state.
 */
export function GuruAvatar({
  size = 32,
  mood = "idle",
  variant = "gradient",
  ring = false,
  glow = false,
  status = null,
  className,
  title = null,
}: GuruAvatarProps) {
  const dot = Math.max(6, Math.round(size * 0.26));

  return (
    <span
      className={cn("relative isolate inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-[30%] bg-guru-accent/30 blur-md"
        />
      )}
      <span
        className={cn(
          "flex h-full w-full items-center justify-center rounded-[30%]",
          ring &&
            "bg-gradient-to-br from-guru-accent/25 via-guru-accent-2/15 to-transparent p-[1.5px] ring-1 ring-white/10",
        )}
      >
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-[30%]",
            ring && "bg-guru-bg",
          )}
        >
          <GuruMark size={Math.round(size * (ring ? 0.82 : 1))} mood={mood} variant={variant} title={title} />
        </span>
      </span>
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-guru-bg",
            STATUS_COLOR[status],
          )}
          style={{ width: dot, height: dot }}
        >
          {status === "busy" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-guru-accent/60" />
          )}
        </span>
      )}
    </span>
  );
}
