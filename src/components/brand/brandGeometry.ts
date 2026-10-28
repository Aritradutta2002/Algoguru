/**
 * AlgoGuru brand geometry — the single source of truth for every rendered
 * surface (mark, lockup, loader, splash, icon exports).
 *
 * The symbol: a bold geometric "A" on a superellipse tile, lit from the
 * top-left with a cyan bloom rising from the bottom-right corner. The only
 * ornament is a single node seated on the crossbar — the "guru" mark on the
 * path — and it is dropped below 32px where it would only add noise.
 *
 * Everything is authored on a 64 grid so the ratios translate directly from a
 * 16px favicon to a 512px app icon. If you change a value here, regenerate the
 * exported files in `public/` with `npm run brand:assets`.
 */

export const BRAND_VIEWBOX = 64;

/**
 * Superellipse (n = 4.6) sampled as a closed path. A rounded rect has a
 * visible curvature break where the corner arc meets the straight edge; this
 * has continuous curvature, which is what makes an app icon read as an object
 * rather than a decorated square.
 */
export const BRAND_TILE_PATH =
  "M64.00 32.00L63.98 40.63L63.93 43.66L63.85 45.89L63.73 47.72L63.58 49.30L63.39 50.69L63.17 51.94L62.92 53.08L62.63 54.12L62.30 55.08L61.93 55.96L61.53 56.78L61.09 57.55L60.61 58.26L60.09 58.91L59.52 59.52L58.91 60.09L58.26 60.61L57.55 61.09L56.78 61.53L55.96 61.93L55.08 62.30L54.12 62.63L53.08 62.92L51.94 63.17L50.69 63.39L49.30 63.58L47.72 63.73L45.89 63.85L43.66 63.93L40.63 63.98L32.00 64.00L23.37 63.98L20.34 63.93L18.11 63.85L16.28 63.73L14.70 63.58L13.31 63.39L12.06 63.17L10.92 62.92L9.88 62.63L8.92 62.30L8.04 61.93L7.22 61.53L6.45 61.09L5.74 60.61L5.09 60.09L4.48 59.52L3.91 58.91L3.39 58.26L2.91 57.55L2.47 56.78L2.07 55.96L1.70 55.08L1.37 54.12L1.08 53.08L0.83 51.94L0.61 50.69L0.42 49.30L0.27 47.72L0.15 45.89L0.07 43.66L0.02 40.63L0.00 32.00L0.02 23.37L0.07 20.34L0.15 18.11L0.27 16.28L0.42 14.70L0.61 13.31L0.83 12.06L1.08 10.92L1.37 9.88L1.70 8.92L2.07 8.04L2.47 7.22L2.91 6.45L3.39 5.74L3.91 5.09L4.48 4.48L5.09 3.91L5.74 3.39L6.45 2.91L7.22 2.47L8.04 2.07L8.92 1.70L9.88 1.37L10.92 1.08L12.06 0.83L13.31 0.61L14.70 0.42L16.28 0.27L18.11 0.15L20.34 0.07L23.37 0.02L32.00 0.00L40.63 0.02L43.66 0.07L45.89 0.15L47.72 0.27L49.30 0.42L50.69 0.61L51.94 0.83L53.08 1.08L54.12 1.37L55.08 1.70L55.96 2.07L56.78 2.47L57.55 2.91L58.26 3.39L58.91 3.91L59.52 4.48L60.09 5.09L60.61 5.74L61.09 6.45L61.53 7.22L61.93 8.04L62.30 8.92L62.63 9.88L62.92 10.92L63.17 12.06L63.39 13.31L63.58 14.70L63.73 16.28L63.85 18.11L63.93 20.34L63.98 23.37Z";

export const BRAND_GLYPH = {
  /** The A as one continuous stroke. */
  legs: "M16.88 49.28 L32 14.72 L47.12 49.28",
  /** Same outline as a single ascend-then-descend trace, for the loader. */
  trace: "M16.88 49.28 L32 14.72 L47.12 49.28",
  /** The crossbar. */
  bar: "M21.74 37.4 H42.26",
  /** Stroke weight at display sizes. */
  stroke: 7,
  /**
   * Heavier stroke below 24px so the glyph survives a 16px tab. The extra
   * 0.4 is what keeps the counter open once the stroke is only ~2 device px.
   */
  strokeCompact: 8.4,
  /** The single node: where the crossbar meets the right leg. */
  node: { cx: 38.91, cy: 37.4, r: 2.6 },
} as const;

/** Tile gradient: periwinkle light falling to deep admiralty blue. */
export const BRAND_BADGE_STOPS = [
  { offset: "0%", color: "#A6C2FF" },
  { offset: "24%", color: "#6E97FB" },
  { offset: "56%", color: "#3D6DF0" },
  { offset: "80%", color: "#2249CE" },
  { offset: "100%", color: "#122F92" },
] as const;

/**
 * Compact ramp for anything rendered under ~28px: the favicon and small inline
 * marks. Dropping the near-white first stop is essential — a white letter on
 * #A6C2FF has nowhere near enough contrast, and at 16px the apex disappears.
 */
export const BRAND_BADGE_STOPS_COMPACT = [
  { offset: "0%", color: "#6E9BFF" },
  { offset: "48%", color: "#3568EA" },
  { offset: "100%", color: "#17399F" },
] as const;

/** Glyph gradient: white warming to a cool porcelain at the baseline. */
export const BRAND_GLYPH_STOPS = [
  { offset: "0%", color: "#FFFFFF" },
  { offset: "52%", color: "#FBFDFF" },
  { offset: "100%", color: "#EDF3FF" },
] as const;

export const BRAND_INK = "#0B0F14";
export const BRAND_BLUE = "#2F6BE8";
export const BRAND_ACCENT = "#6FE3F8";
export const BRAND_ACCENT_DEEP = "#22D3EE";

export const WORDMARK_FONT = "'Space Grotesk','Outfit','Inter',system-ui,sans-serif";

/** Lockup canvases — see public/brand/*.svg for the matching standalone files. */
export const LOCKUP_HORIZONTAL = { w: 268, h: 64 } as const;
export const LOCKUP_STACKED = { w: 200, h: 180 } as const;

/**
 * Thresholds, in rendered px. Below these the layers collapse into a single
 * crisp silhouette instead of turning into mud.
 */
export const BRAND_DETAIL_MIN = 28;
export const BRAND_NODE_MIN = 32;

/** Node knockouts vanish below ~24px, so drop them and thicken the glyph. */
export function glyphStrokeFor(size: number): number {
  return size < 24 ? BRAND_GLYPH.strokeCompact : BRAND_GLYPH.stroke;
}

/** Bloom, gloss, shade, rim and the letter's drop shadow. */
export function showSurfaceDetailFor(size: number): boolean {
  return size >= BRAND_DETAIL_MIN;
}

/** The crossbar node — the one ornament. */
export function showNodeFor(size: number): boolean {
  return size >= BRAND_NODE_MIN;
}
