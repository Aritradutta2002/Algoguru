import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_ACCENT,
  BRAND_ACCENT_DEEP,
  BRAND_BADGE_STOPS,
  BRAND_BADGE_STOPS_COMPACT,
  BRAND_BLUE,
  BRAND_GLYPH,
  BRAND_GLYPH_STOPS,
  BRAND_INK,
  BRAND_TILE_PATH,
  glyphStrokeFor,
  showNodeFor,
  showSurfaceDetailFor,
} from "./brandGeometry";

export type AlgoGuruMarkVariant = "gradient" | "mono" | "reverse" | "knockout";

export interface AlgoGuruMarkProps {
  /** Rendered width/height in px (the mark is square). */
  size?: number;
  /**
   * - gradient : full-colour tile with depth (default) — use on light or dark surfaces
   * - mono     : flat ink tile + white glyph — one-colour printing
   * - reverse  : flat white tile + ink glyph — dark surfaces, one-colour
   * - knockout : no tile, glyph in currentColor — for placing inside a tinted tile
   */
  variant?: AlgoGuruMarkVariant;
  /** Hide the letterform. The loader draws its own animated version. */
  showGlyph?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when the mark is purely decorative. */
  title?: string | null;
}

/**
 * The AlgoGuru symbol.
 *
 * Built in light rather than filled flat: a five-stop gradient across a
 * superellipse tile, a cyan bloom rising from the bottom-right corner, a gloss
 * falling from the top-left, a shade pooling at the base, and a rim that runs
 * bright along the top edge and dark along the bottom. The letter sits above
 * all of it with its own soft cast shadow, so it reads as an object on the tile
 * instead of a decal.
 *
 * Everything past the base gradient is dropped below 28px, and the crossbar
 * node below 32px, so a 16px tab gets a crisp, solid silhouette.
 */
export function AlgoGuruMark({
  size = 32,
  variant = "gradient",
  showGlyph = true,
  className,
  title = "AlgoGuru",
}: AlgoGuruMarkProps) {
  // useId keeps gradient/filter ids unique when several marks render at once.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tileId = `ag-tile-${uid}`;
  const inkId = `ag-ink-${uid}`;
  const bloomId = `ag-bloom-${uid}`;
  const glossId = `ag-gloss-${uid}`;
  const shadeId = `ag-shade-${uid}`;
  const rimId = `ag-rim-${uid}`;
  const nodeId = `ag-node-${uid}`;
  const liftId = `ag-lift-${uid}`;

  const isGradient = variant === "gradient";
  const hasTile = variant !== "knockout";
  const showSurface = isGradient && showSurfaceDetailFor(size);
  const showNode = showGlyph && showNodeFor(size);
  const strokeWidth = glyphStrokeFor(size);
  // Below the detail threshold the tile also switches to the compact ramp;
  // the near-white first stop would swallow the white letter at tab size.
  const tileStops = showSurface ? BRAND_BADGE_STOPS : BRAND_BADGE_STOPS_COMPACT;

  const tileFill = isGradient
    ? `url(#${tileId})`
    : variant === "reverse"
      ? "#FFFFFF"
      : BRAND_INK;

  const glyphStroke = isGradient
    ? `url(#${inkId})`
    : variant === "reverse"
      ? BRAND_INK
      : variant === "knockout"
        ? "currentColor"
        : "#FFFFFF";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      <defs>
        {isGradient && (
          <>
            <linearGradient id={tileId} x1="4" y1="0" x2="60" y2="64" gradientUnits="userSpaceOnUse">
              {tileStops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <linearGradient id={inkId} x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
              {BRAND_GLYPH_STOPS.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </>
        )}
        {showSurface && (
          <>
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
            <filter id={liftId} x="-30%" y="-30%" width="160%" height="180%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="2.6" floodColor="#05132F" floodOpacity="0.3" />
            </filter>
          </>
        )}
        {showNode && (
          <radialGradient id={nodeId} cx="0.34" cy="0.28" r="0.82">
            <stop offset="0%" stopColor="#B7F4FF" />
            <stop offset="52%" stopColor="#4FD8F2" />
            <stop offset="100%" stopColor="#1C9EC4" />
          </radialGradient>
        )}
      </defs>

      {hasTile && (
        <>
          <path d={BRAND_TILE_PATH} fill={tileFill} />
          {showSurface && (
            <>
              <path d={BRAND_TILE_PATH} fill={`url(#${bloomId})`} />
              <path d={BRAND_TILE_PATH} fill={`url(#${glossId})`} />
              <path d={BRAND_TILE_PATH} fill={`url(#${shadeId})`} />
              <path d={BRAND_TILE_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth="1.5" />
            </>
          )}
        </>
      )}

      {showGlyph && (
        <>
          <g
            filter={showSurface ? `url(#${liftId})` : undefined}
            fill="none"
            stroke={glyphStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={BRAND_GLYPH.legs} />
            <path d={BRAND_GLYPH.bar} />
          </g>

          {showNode && (
            <circle
              cx={BRAND_GLYPH.node.cx}
              cy={BRAND_GLYPH.node.cy}
              r={BRAND_GLYPH.node.r}
              fill={variant === "reverse" ? BRAND_BLUE : `url(#${nodeId})`}
            />
          )}
        </>
      )}
    </svg>
  );
}

export default AlgoGuruMark;
