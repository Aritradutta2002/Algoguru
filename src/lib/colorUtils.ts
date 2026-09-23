/**
 * Contrast helpers for colored roadmap nodes.
 * Picks the text color (white vs near-black ink) that maximizes WCAG
 * contrast against a given branch color, so titles stay readable on
 * both deep colors (purple, blue) and light colors (amber, cyan, pink).
 */

const WHITE = "#ffffff";
const INK = "#101828";

function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);

  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = channel(parseInt(full.slice(0, 2), 16) || 0);
  const g = channel(parseInt(full.slice(2, 4), 16) || 0);
  const b = channel(parseInt(full.slice(4, 6), 16) || 0);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Returns the more readable text color for a given background.
 * Dark ink only wins when clearly better — saturated blues/purples
 * keep the classic white text look.
 */
export function readableInk(hex: string): string {
  try {
    const L = relativeLuminance(hex);
    const whiteRatio = contrast(L, 1);
    const inkRatio = contrast(L, relativeLuminance(INK));

    return inkRatio > whiteRatio * 1.35 ? INK : WHITE;
  } catch {
    return WHITE;
  }
}

/** True when `readableInk` chose the dark ink for this color. */
export function isDarkInk(hex: string): boolean {
  return readableInk(hex).toLowerCase() !== WHITE;
}
