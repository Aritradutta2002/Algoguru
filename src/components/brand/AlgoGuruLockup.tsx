import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_ACCENT,
  BRAND_ACCENT_DEEP,
  BRAND_BADGE_STOPS,
  BRAND_BLUE,
  BRAND_GLYPH,
  BRAND_GLYPH_STOPS,
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
  const bloomId = `ag-lock-bloom-${uid}`;
  const glossId = `ag-lock-gloss-${uid}`;
  const shadeId = `ag-lock-shade-${uid}`;
  const rimId = `ag-lock-rim-${uid}`;
  const nodeId = `ag-lock-node-${uid}`;
  const liftId = `ag-lock-lift-${uid}`;

  const canvas = orientation === "horizontal" ? LOCKUP_HORIZONTAL : LOCKUP_STACKED;
  const width = (size * canvas.w) / canvas.h;

  const mark = (
    <>
      <path d={BRAND_TILE_PATH} fill={`url(#${tileId})`} />
      <path d={BRAND_TILE_PATH} fill={`url(#${bloomId})`} />
      <path d={BRAND_TILE_PATH} fill={`url(#${glossId})`} />
      <path d={BRAND_TILE_PATH} fill={`url(#${shadeId})`} />
      <path d={BRAND_TILE_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth="1.5" />
      <g
        filter={`url(#${liftId})`}
        fill="none"
        stroke={`url(#${inkId})`}
        strokeWidth={BRAND_GLYPH.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={BRAND_GLYPH.legs} />
        <path d={BRAND_GLYPH.bar} />
      </g>
      <circle cx={BRAND_GLYPH.node.cx} cy={BRAND_GLYPH.node.cy} r={BRAND_GLYPH.node.r} fill={`url(#${nodeId})`} />
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
        <linearGradient id={tileId} x1="4" y1="0" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          {BRAND_BADGE_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={inkId} x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          {BRAND_GLYPH_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <radialGradient id={bloomId} cx="0.86" cy="0.92" r="0.8">
          <stop offset="0%" stopColor={BRAND_ACCENT_DEEP} stopOpacity="0.42" />
          <stop offset="42%" stopColor={BRAND_ACCENT_DEEP} stopOpacity="0.13" />
          <stop offset="100%" stopColor={BRAND_ACCENT_DEEP} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={glossId} cx="0.2" cy="0.02" r="0.95">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.17" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={shadeId} x1="32" y1="26" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#04102B" stopOpacity="0" />
          <stop offset="100%" stopColor="#04102B" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={rimId} x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="70%" stopColor="#0A1B45" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0A1B45" stopOpacity="0.38" />
        </linearGradient>
        <radialGradient id={nodeId} cx="0.34" cy="0.28" r="0.82">
          <stop offset="0%" stopColor="#B7F4FF" />
          <stop offset="52%" stopColor="#4FD8F2" />
          <stop offset="100%" stopColor="#1C9EC4" />
        </radialGradient>
        <filter id={liftId} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="2.6" floodColor="#05132F" floodOpacity="0.3" />
        </filter>
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
          x="82"
          y="43.5"
          fontFamily={WORDMARK_FONT}
          fontSize={33}
          fontWeight={600}
          letterSpacing="-0.9"
        >
          <tspan fill="currentColor">Algo</tspan>
          <tspan fill={BRAND_BLUE}>Guru</tspan>
        </text>
      ) : (
        <text
          x="100"
          y="158"
          textAnchor="middle"
          fontFamily={WORDMARK_FONT}
          fontSize={38}
          fontWeight={600}
          letterSpacing="-1"
        >
          <tspan fill="currentColor">Algo</tspan>
          <tspan fill={BRAND_BLUE}>Guru</tspan>
        </text>
      )}
    </svg>
  );
}

export default AlgoGuruLockup;
