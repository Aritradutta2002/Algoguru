import { AlgoGuruMark, type AlgoGuruMarkVariant } from "@/components/brand/AlgoGuruMark";
import { AlgoGuruLockup } from "@/components/brand/AlgoGuruLockup";

export interface AlgoGuruLogoProps {
  /**
   * showText=false → the square symbol; `size` is its width/height.
   * showText=true  → the horizontal lockup; `size` is its height.
   */
  size?: number;
  showText?: boolean;
  /** Mark treatment — ignored when showText is true. */
  variant?: AlgoGuruMarkVariant;
  className?: string;
}

/**
 * Backwards-compatible entry point for the AlgoGuru brand mark.
 *
 * The old illustration-style mascot has been replaced by the "Pathfinder A"
 * symbol. The prop contract is unchanged, so every existing call site keeps
 * working and picks up the new identity automatically.
 *
 * New code should prefer importing `AlgoGuruMark` / `AlgoGuruLockup` directly.
 */
export function AlgoGuruLogo({
  size = 80,
  showText = true,
  variant = "gradient",
  className = "",
}: AlgoGuruLogoProps) {
  if (showText) {
    return <AlgoGuruLockup size={size} orientation="horizontal" className={className} />;
  }

  return <AlgoGuruMark size={size} variant={variant} className={className} />;
}

export default AlgoGuruLogo;
