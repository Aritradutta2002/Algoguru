"use client";

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
 * Animation is transform/opacity only. The app header and Guru panel disable
 * it for reduced motion; static placements can opt out with `animated`.
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
  /** Enable full facial detail and gradient shading. Defaults on above 24 px. */
  detail?: boolean;
  /** Allow the thinking expression to blink. */
  animated?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when a neighbouring label already names it. */
  title?: string | null;
}

// The speech-tail silhouette stays visible even in a 16 px toolbar icon.
const SHELL = "M5 30C5 17 14 10 29 10h6c12 0 22 8 23 21l1 8c1 10-6 16-17 16H25l-11 6 1-8C8 50 4 44 4 37Z";

export function GuruMark({
  size = 32,
  mood = "idle",
  variant = "gradient",
  detail,
  animated = true,
  className,
  title = "Guru",
}: GuruMarkProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const detailed = detail ?? size > 24;
  const outline = variant === "knockout";
  const singleColor = outline || variant === "mono";
  const shaded = detailed && variant === "gradient";
  const shell = outline ? "none" : singleColor ? "currentColor" : shaded ? `url(#guru-shell-${id})` : "#8063D9";
  const ink = outline ? "currentColor" : variant === "mono" ? "hsl(var(--guru-bg))" : "#30254F";

  return (
    <svg width={size} height={size} style={{ width: size, height: size }} viewBox="0 0 64 64" fill="none"
      className={cn("shrink-0", className)} role={title ? "img" : "presentation"}
      aria-label={title ?? undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      {shaded && (
        <defs>
          <linearGradient id={`guru-shell-${id}`} x1="14" y1="10" x2="47" y2="57" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BAA8FF" />
            <stop offset=".48" stopColor="#9170E7" />
            <stop offset="1" stopColor="#6245A7" />
          </linearGradient>
        </defs>
      )}
      <path d={SHELL} fill={shell} stroke={outline ? "currentColor" : "none"} strokeWidth="3" />
      {!singleColor && <path d="M12 32c0-8 6-13 15-13h10c9 0 15 5 15 13v2c0 9-6 14-15 14H27c-9 0-15-5-15-14Z" fill="#FAF6FF" />}
      <g stroke={ink} strokeWidth={detailed ? 4 : 5} strokeLinecap="round"
        className={animated && mood === "thinking" ? "animate-guru-blink" : undefined}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}>
        <path d={detailed && mood === "happy" ? "M20 33q3-5 6 0m10 0q3-5 6 0" : "M24 29v6m15-6v6"} />
        {detailed && <path d="M28 40q4 3 8-1" strokeWidth="2.3" />}
      </g>
      <path d="M51 1q2 9 11 11-9 2-11 11-2-9-11-11 9-2 11-11Z"
        fill={singleColor ? "currentColor" : "#F2BC56"} />
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
