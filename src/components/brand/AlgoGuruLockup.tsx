import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_A,
  BRAND_BADGE_STOPS,
  BRAND_BLUE,
  BRAND_GLYPH_STOPS,
  BRAND_RAMP,
  BRAND_TILE_PATH,
  LOCKUP_HORIZONTAL,
  LOCKUP_STACKED,
  WORDMARK_FONT,
} from "./brandGeometry";

export interface AlgoGuruLockupProps {
  /** Lockup height in px. Width is derived from the lockup's aspect ratio. */
  size?: number;
  orientation?: "horizontal" | "stacked";
  className?: string;
  /** Accessible name. Pass `null` when a neighbouring text label already names the brand. */
  title?: string | null;
}

/** Top-light sheen on the tile — kept in sync with AlgoGuruMark. */
const SHEEN = "M32 1.5L50 20.5L32 39.5L14 20.5Z";

/**
 * Mark + wordmark, drawn as one SVG so the tile, the baseline and the
 * letter-spacing can never fall out of alignment across breakpoints.
 *
 * "Algo" inherits `currentColor` so the lockup adapts to light/dark surfaces;
 * "Guru" stays on-brand cobalt in both.
 */
export function AlgoGuruLockup({
  size = 40,
  orientation = "horizontal",
  className,
  title = "AlgoGuru",
}: AlgoGuruLockupProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tileId = `ag-lock-tile-${uid}`;
  const inkId = `ag-lock-ink-${uid}`;
  const sheenId = `ag-lock-sheen-${uid}`;
  const rimId = `ag-lock-rim-${uid}`;
  const nodeId = `ag-lock-node-${uid}`;

  const canvas = orientation === "horizontal" ? LOCKUP_HORIZONTAL : LOCKUP_STACKED;
  const width = (size * canvas.w) / canvas.h;

  const mark = (
    <>
      <path d={BRAND_TILE_PATH} fill={`url(#${tileId})`} />
      <path d={SHEEN} fill={`url(#${sheenId})`} />
      <path d={BRAND_TILE_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth="1.3" />
      <path d={BRAND_A.leftStem} fill={`url(#${inkId})`} />
      <path d={BRAND_A.rightStem} fill={`url(#${inkId})`} />
      <path d={BRAND_A.crossbar} fill={`url(#${inkId})`} />
      <circle
        cx={BRAND_A.node.cx}
        cy={BRAND_A.node.cy}
        r={BRAND_A.node.r + 1.7}
        fill={BRAND_RAMP[2].color}
        opacity="0.34"
      />
      <circle
        cx={BRAND_A.node.cx}
        cy={BRAND_A.node.cy}
        r={BRAND_A.node.r}
        fill={`url(#${nodeId})`}
      />
    </>
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${canvas.w} ${canvas.h}`}
      width={width}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={tileId} x1="10" y1="2" x2="56" y2="62" gradientUnits="userSpaceOnUse">
          {BRAND_BADGE_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={inkId} x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          {BRAND_GLYPH_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={rimId} x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={sheenId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={nodeId} cx="0.34" cy="0.3" r="0.78">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="48%" stopColor={BRAND_RAMP[2].color} />
          <stop offset="100%" stopColor={BRAND_RAMP[1].color} />
        </radialGradient>
      </defs>

      {orientation === "horizontal" ? (
        <g>{mark}</g>
      ) : (
        /* A nested <svg> establishes its own 64-space so the gradients still
           resolve against the glyph instead of the outer canvas. */
        <svg x="52" y="14" width="96" height="96" viewBox="0 0 64 64">
          {mark}
        </svg>
      )}

      {orientation === "horizontal" ? (
        <text
          x="80"
          y="43"
          fontFamily={WORDMARK_FONT}
          fontSize={32}
          fontWeight={600}
          letterSpacing="-0.03em"
        >
          <tspan fill="currentColor">Algo</tspan>
          <tspan fill={BRAND_BLUE} dx="0.5">Guru</tspan>
        </text>
      ) : (
        <text
          x="100"
          y="156"
          textAnchor="middle"
          fontFamily={WORDMARK_FONT}
          fontSize={36}
          fontWeight={600}
          letterSpacing="-0.03em"
        >
          <tspan fill="currentColor">Algo</tspan>
          <tspan fill={BRAND_BLUE} dx="0.5">Guru</tspan>
        </text>
      )}
    </svg>
  );
}

export default AlgoGuruLockup;
