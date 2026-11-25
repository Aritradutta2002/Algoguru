"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { AlgoGuruMark } from "./AlgoGuruMark";
import { BRAND_A, BRAND_ACCENT, BRAND_GLYPH_PATH, BRAND_RAMP } from "./brandGeometry";
import "./brand.css";

export type BrandLoaderSize = "sm" | "md" | "lg" | "hero";
export type BrandLoaderVariant = "inline" | "screen";

export interface BrandLoaderProps {
  size?: BrandLoaderSize;
  /**
   * - inline : sits in a button or toolbar row, label is screen-reader only
   * - screen : full-page boot / route transition, label under the mark
   */
  variant?: BrandLoaderVariant;
  /** Human-readable progress text. Pass `null` to omit it entirely. */
  label?: string | null;
  /** Optional secondary telemetry/status line shown beneath `label` on `screen`. */
  sublabel?: string | null;
  /**
   * Determinate progress, 0–100. When omitted the meter runs as an
   * indeterminate shimmer — which is the honest state for a network wait.
   */
  progress?: number;
  /** Display tabular percentage alongside the determinate meter on `screen`. */
  showProgressValue?: boolean;
  className?: string;
}

const SIZES: Record<BrandLoaderSize, { mark: number; stage: number; hairline: number }> = {
  sm: { mark: 22, stage: 38, hairline: 1 },
  md: { mark: 38, stage: 66, hairline: 1 },
  lg: { mark: 66, stage: 116, hairline: 2 },
  hero: { mark: 88, stage: 148, hairline: 2 },
};

/**
 * The branded loading state.
 *
 * One story, told on a 2.4s loop (`--agl-cycle` in brand.css):
 *
 *   1. the two strokes of the "A" trace themselves out from the apex,
 *   2. the junction where they converge ignites with a single bloom,
 *   3. one light band sweeps across the tile from left to right,
 *   4. the frame settles and rests before the next pass.
 *
 * There are no orbiting rings and no endless spin: the only repeated motion is
 * the story itself, which reads as intent rather than as a spinner. Everything
 * animates `transform` / `opacity` / `stroke-dashoffset`, so the loop stays on
 * the compositor and allocates no layout.
 *
 * `prefers-reduced-motion` freezes the finished frame and parks the meter; the
 * label carries the meaning.
 */
export function BrandLoader({
  size = "md",
  variant = "inline",
  label = "Loading",
  sublabel,
  progress,
  showProgressValue = false,
  className,
}: BrandLoaderProps) {
  const geometry = SIZES[size];
  const showLabel = variant !== "inline" && !!label;
  const showSublabel = variant !== "inline" && !!sublabel;
  const showAperture = variant === "screen" || size === "lg" || size === "hero";
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const burstId = `agl-burst-${uid}`;
  const sweepId = `agl-sweep-${uid}`;
  const clipId = `agl-clip-${uid}`;

  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const pct = determinate ? Math.round(Math.min(100, Math.max(0, progress))) : null;
  const pctRaw = determinate ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <span
      className={cn("agl", `agl--${variant}`, className)}
      data-size={size}
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ "--agl-hairline": `${geometry.hairline}px` } as React.CSSProperties}
    >
      <span
        className="agl__stage"
        style={{ width: geometry.stage, height: geometry.stage }}
        aria-hidden="true"
      >
        <span className="agl__wash" />
        {showAperture ? <span className="agl__aperture" /> : null}
        <span className="agl__plate">
          <span className="agl__tile">
            <AlgoGuruMark
              size={geometry.mark}
              title={null}
              showGlyph={false}
              className="agl__mark"
            />
          </span>
          <span className="agl__sweep" />
        </span>
        <svg
          className="agl__glyph"
          width={geometry.mark}
          height={geometry.mark}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id={burstId}>
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="34%" stopColor={BRAND_ACCENT} stopOpacity="0.9" />
              <stop offset="72%" stopColor={BRAND_RAMP[1].color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={BRAND_RAMP[1].color} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={sweepId} x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              {/* One path for the whole letter, so the clip has a single,
                  well-defined region instead of three overlapping ones. */}
              <path d={BRAND_GLYPH_PATH} clipRule="evenodd" />
            </clipPath>
          </defs>

          <circle
            className="agl__burst"
            cx={BRAND_A.node.cx}
            cy={BRAND_A.node.cy}
            r="15"
            fill={`url(#${burstId})`}
          />

          <g className="agl__drawgroup">
            <path className="agl__draw agl__draw--stem" d={BRAND_A.traces.rightStem} />
            <path className="agl__draw agl__draw--bar" d={BRAND_A.traces.bar} />
          </g>

          {/* The finishing pass: the solid letter wipes in across the trace,
              and a light band travels over it. */}
          <g clipPath={`url(#${clipId})`}>
            <path className="agl__fill" d={BRAND_GLYPH_PATH} fill="#FFFFFF" fillRule="evenodd" />
            <rect className="agl__band" x="0" y="0" width="22" height="64" fill={`url(#${sweepId})`} />
          </g>

          <g className="agl__spark">
            <circle
              className="agl__spark-core"
              cx={BRAND_A.node.cx}
              cy={BRAND_A.node.cy}
              r={BRAND_A.node.r}
              fill={BRAND_ACCENT}
            />
            <circle
              className="agl__spark-halo"
              cx={BRAND_A.node.cx}
              cy={BRAND_A.node.cy}
              r={BRAND_A.node.r * 0.45}
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </span>

      {label ? (
        <span className={cn("agl__copy", !showLabel && "sr-only")}>
          <span className={cn("agl__label", !showLabel && "sr-only")}>{label}</span>
          {showSublabel ? <span className="agl__sublabel">{sublabel}</span> : null}
        </span>
      ) : null}

      {variant === "screen" ? (
        <span className="agl__meter-wrap" aria-hidden="true">
          <span
            className={cn("agl__meter", determinate && "agl__meter--determinate")}
            aria-hidden="true"
          >
            <span
              className="agl__meter-bar"
              style={determinate ? { width: `${pctRaw}%` } : undefined}
            />
          </span>
          {showProgressValue && pct !== null ? (
            <span className="agl__telemetry" aria-hidden="true">
              {pct}%
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

export default BrandLoader;
