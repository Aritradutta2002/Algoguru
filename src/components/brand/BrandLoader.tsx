import { useId } from "react";
import { cn } from "@/lib/utils";
import { AlgoGuruMark } from "./AlgoGuruMark";
import { BRAND_ACCENT, BRAND_GLYPH } from "./brandGeometry";
import "./brand.css";

export type BrandLoaderSize = "sm" | "md" | "lg";
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
  className?: string;
}

const SIZES: Record<BrandLoaderSize, { mark: number; stage: number; ring: number }> = {
  sm: { mark: 20, stage: 34, ring: 1.5 },
  md: { mark: 40, stage: 70, ring: 2 },
  lg: { mark: 72, stage: 124, ring: 2.5 },
};

/**
 * The branded loading state.
 *
 * The letter traces itself from the left foot up over the apex and down to the
 * right foot, the crossbar sweeps in, and the node where they meet ignites with
 * a sonar ping — one built-in 3.4s story rather than an endless spinner. Two
 * counter-rotating arcs and a breathing halo keep the shape alive between
 * beats.
 *
 * Everything is transform/opacity/stroke-dashoffset, so the loop stays on the
 * compositor. `prefers-reduced-motion` freezes on the finished frame with the
 * text label carrying the meaning (see brand.css).
 */
export function BrandLoader({
  size = "md",
  variant = "inline",
  label = "Loading",
  className,
}: BrandLoaderProps) {
  const geometry = SIZES[size];
  const showLabel = variant !== "inline" && !!label;
  const burstId = `agl-burst-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <span
      className={cn("agl", `agl--${variant}`, className)}
      role="status"
      aria-live="polite"
      style={{ "--agl-orbit-thickness": `${geometry.ring}px` } as React.CSSProperties}
    >
      <span
        className="agl__stage"
        style={{ width: geometry.stage, height: geometry.stage }}
        aria-hidden="true"
      >
        <span className="agl__halo" />
        <span className="agl__ring agl__ring--track" />
        <span className="agl__ping" />
        <span className="agl__ring agl__ring--outer" />
        <span className="agl__ring agl__ring--inner" />

        <AlgoGuruMark
          size={geometry.mark}
          title={null}
          showGlyph={false}
          className="agl__mark"
        />

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
              <stop offset="0%" stopColor={BRAND_ACCENT} stopOpacity="0.95" />
              <stop offset="45%" stopColor={BRAND_ACCENT} stopOpacity="0.38" />
              <stop offset="100%" stopColor={BRAND_ACCENT} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle
            className="agl__burst"
            cx={BRAND_GLYPH.node.cx}
            cy={BRAND_GLYPH.node.cy}
            r="15"
            fill={`url(#${burstId})`}
          />
          <g className="agl__drawgroup">
            <path className="agl__draw agl__draw--outline" d={BRAND_GLYPH.trace} />
            <path className="agl__draw agl__draw--bar" d={BRAND_GLYPH.bar} />
          </g>
          <circle
            className="agl__spark"
            cx={BRAND_GLYPH.node.cx}
            cy={BRAND_GLYPH.node.cy}
            r={BRAND_GLYPH.node.r + 0.4}
            fill={BRAND_ACCENT}
          />
        </svg>
      </span>

      {label ? (
        <span className={cn("agl__label", !showLabel && "sr-only")}>{label}</span>
      ) : null}
    </span>
  );
}

export default BrandLoader;
