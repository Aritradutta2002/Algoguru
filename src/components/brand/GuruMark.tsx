import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Guru — the AlgoGuru AI mascot, drawn as vectors.
 *
 * A crisp, friendly AI guide authored on a 64 grid: dimensional violet shell,
 * porcelain face, expressive eyes and a signature golden idea-spark. Vector
 * geometry keeps the identity sharp from a 16px launcher to a 96px empty state,
 * while the surrounding avatar surfaces inherit the app's day/night tokens.
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
  /** Play the idea-spark pulse / blink loop. Default: true for idle + thinking. */
  animated?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when a neighbouring label already names it. */
  title?: string | null;
}

/* ── Geometry (64 grid) ───────────────────────────────────────────
   Broad curves and a generously inset face keep the silhouette readable at
   favicon-like sizes. The spark, rather than a generic antenna, is Guru's
   distinguishing feature. */
const HEAD = { x: 7.5, y: 14, w: 49, h: 43, r: 16 };
const FACE = { x: 14, y: 21, w: 36, h: 28, r: 11 };

const CHEEK = "#FF8FB1";
const INK = "#28234F";
const ORB = "#FFC95C";

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
  const faceGrad = `guru-face-${uid}`;
  const headClip = `guru-clip-${uid}`;

  const showDetail = detail ?? size >= 24;
  const isLine = variant === "knockout";
  const faceFill =
    variant === "mono" || variant === "knockout" ? "none" : `url(#${faceGrad})`;
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
    isLine || variant === "mono" ? "none" : "hsl(var(--guru-accent-2) / 0.42)";
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
        <linearGradient id={headGrad} x1="12" y1="12" x2="53" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9A91FF" />
          <stop offset="42%" stopColor="#7968F2" />
          <stop offset="76%" stopColor="#7352DF" />
          <stop offset="100%" stopColor="#A050D4" />
        </linearGradient>
        <linearGradient id={orbGrad} x1="28" y1="2" x2="36" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="45%" stopColor="#FFDC7E" />
          <stop offset="100%" stopColor={ORB} />
        </linearGradient>
        <linearGradient id={shineGrad} x1="32" y1="14" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={faceGrad} x1="22" y1="20" x2="42" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#F7F6FF" />
          <stop offset="100%" stopColor="#EAE7FA" />
        </linearGradient>
        <clipPath id={headClip}>
          <rect x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} rx={HEAD.r} />
        </clipPath>
      </defs>

      {/* Signature idea-spark + stem */}
      <g opacity={isLine ? 0.9 : 1}>
        <circle
          cx="32"
          cy="6.6"
          r="6"
          fill={isLine ? "none" : `url(#${orbGrad})`}
          opacity={isLine ? 0 : 0.2}
          className={animated && mood !== "happy" ? "animate-guru-orb" : undefined}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <path
          d="M32 1.4c.72 3.45 1.95 4.68 5.4 5.4-3.45.72-4.68 1.95-5.4 5.4-.72-3.45-1.95-4.68-5.4-5.4 3.45-.72 4.68-1.95 5.4-5.4Z"
          fill={isLine ? "currentColor" : `url(#${orbGrad})`}
          stroke={isLine ? "currentColor" : "#FFF4CF"}
          strokeWidth={isLine ? 1.2 : 0.55}
          strokeLinejoin="round"
        />
        <rect
          x="31"
          y="11"
          width="2"
          height="4.5"
          rx="1"
          fill={isLine ? "currentColor" : "hsl(252 70% 66%)"}
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
        <>
          <rect
            x={HEAD.x}
            y={HEAD.y}
            width={HEAD.w}
            height={HEAD.h}
            rx={HEAD.r}
            fill={`url(#${shineGrad})`}
            clipPath={`url(#${headClip})`}
          />
          <path
            d="M12 49.5c10.5 5.2 29.5 5.2 40 0-2.1 4.7-6.2 7-12.5 7h-15c-6.3 0-10.4-2.3-12.5-7Z"
            fill="#382484"
            opacity="0.16"
            clipPath={`url(#${headClip})`}
          />
        </>
      )}

      {/* Face plate */}
      <rect
        x={FACE.x}
        y={FACE.y}
        width={FACE.w}
        height={FACE.h}
        rx={FACE.r}
        fill={faceFill}
        stroke={variant === "mono" ? "none" : isLine ? "currentColor" : "rgba(255,255,255,0.72)"}
        strokeWidth={isLine ? 1.4 : 0.9}
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
  ready: "bg-guru-success",
  // Guru's own accent, not the app's blue CTA — the dot belongs to the mascot.
  busy: "bg-guru-accent",
  error: "bg-guru-danger",
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
          ring && "p-px shadow-[0_5px_16px_-8px_hsl(var(--guru-accent)/0.75)]",
        )}
        style={
          ring
            ? {
                background:
                  "linear-gradient(145deg, hsl(var(--guru-accent) / 0.85), hsl(var(--guru-accent-2) / 0.42) 52%, hsl(var(--guru-line) / 0.9))",
              }
            : undefined
        }
      >
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-[30%]",
            ring && "shadow-[inset_0_1px_0_hsl(var(--guru-text)/0.05)]",
          )}
          style={
            ring
              ? {
                  background:
                    "linear-gradient(155deg, hsl(var(--guru-surface)), hsl(var(--guru-bg)))",
                }
              : undefined
          }
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
