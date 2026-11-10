import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_A,
  BRAND_BADGE_STOPS,
  BRAND_BLUE,
  BRAND_GLYPH_STOPS,
  BRAND_INK,
  BRAND_RAMP,
  BRAND_TILE_PATH,
  showNodeFor,
  showSurfaceDetailFor,
} from "./brandGeometry";

export type AlgoGuruMarkVariant = "gradient" | "mono" | "reverse" | "knockout";

export interface AlgoGuruMarkProps {
  /** Rendered width/height in px (the mark is square). */
  size?: number;
  /**
   * - gradient : full-colour tile with the lit letter (default)
   * - mono     : flat ink tile + white letter — one-colour printing
   * - reverse  : flat white tile + ink letter — on dark or photographic ground
   * - knockout : no tile, letter in currentColor — placed inside a tinted surface
   */
  variant?: AlgoGuruMarkVariant;
  /** Hide the letterform. The loader draws its own animated version. */
  showGlyph?: boolean;
  className?: string;
  /** Accessible name. Pass `null` when the mark is purely decorative. */
  title?: string | null;
}

/** Sheen: a soft top-light band, only drawn once the tile is large enough to read it. */
const SHEEN = "M32 1.5L50 20.5L32 39.5L14 20.5Z";

/**
 * The AlgoGuru symbol.
 *
 * A built-up geometric "A" in porcelain on a four-stop indigo→cyan tile: two
 * tapered stems meeting at a solid apex, a crossbar braced between them and a
 * single junction node — the point where the algorithm converges.
 *
 * The whole index is one tile, one letter and one rim, so the icon stays
 * legible at every size. The junction detail is dropped below 16px and the
 * top-light sheen below 20px, where they would only add noise.
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
  const sheenId = `ag-sheen-${uid}`;
  const rimId = `ag-rim-${uid}`;
  const nodeId = `ag-node-${uid}`;

  const isGradient = variant === "gradient";
  const hasTile = variant !== "knockout";
  const showSurface = isGradient && showSurfaceDetailFor(size);
  const showNode = showGlyph && showNodeFor(size);
  const showLetter = showGlyph;

  const tileFill =
    variant === "mono"
      ? BRAND_INK
      : variant === "reverse"
        ? "#FFFFFF"
        : `url(#${tileId})`;

  const glyphFill =
    variant === "knockout"
      ? "currentColor"
      : variant === "reverse"
        ? BRAND_INK
        : variant === "mono"
          ? "#FFFFFF"
          : `url(#${inkId})`;

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

      {hasTile ? <path d={BRAND_TILE_PATH} fill={tileFill} /> : null}

      {showSurface ? (
        <>
          <path d={SHEEN} fill={`url(#${sheenId})`} />
          <path d={BRAND_TILE_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth="1.3" />
        </>
      ) : null}

      {showLetter ? (
        <g fill={glyphFill}>
          {/* Three non-overlapping pieces, so the fill is immune to winding. */}
          <path d={BRAND_A.leftStem} />
          <path d={BRAND_A.crossbar} />
          <path d={BRAND_A.rightStem} />
        </g>
      ) : null}

      {showNode ? (
        <>
          <circle
            cx={BRAND_A.node.cx}
            cy={BRAND_A.node.cy}
            r={BRAND_A.node.r + 1.7}
            fill={isGradient ? BRAND_RAMP[2].color : variant === "reverse" ? BRAND_BLUE : "#FFFFFF"}
            opacity={isGradient ? 0.34 : 0.18}
          />
          <circle
            cx={BRAND_A.node.cx}
            cy={BRAND_A.node.cy}
            r={BRAND_A.node.r}
            fill={variant === "reverse" ? BRAND_BLUE : `url(#${nodeId})`}
          />
        </>
      ) : null}
    </svg>
  );
}

export default AlgoGuruMark;
