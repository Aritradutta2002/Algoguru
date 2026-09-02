import { ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * FoldGlyph — the "<<" / ">>" indicators used by the sidebar fold/unfold controls.
 *
 * - `fold`   → "<<" (renders as a double left chevron, collapses sidebar to the left)
 * - `unfold` → ">>" (renders as a double right chevron, expands sidebar to the right)
 *
 * Uses lucide's double-chevron icons rather than text glyphs so the indicator
 * stays crisp at every size and colour. The visual semantic ("<<" / ">>") is
 * preserved — both interpretations mean "double arrow pointing in this direction".
 */
export function FoldGlyph({
  direction,
  size = 16,
  strokeWidth = 2.5,
  className,
}: {
  direction: "fold" | "unfold";
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Icon = direction === "fold" ? ChevronsLeft : ChevronsRight;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={className ?? "pointer-events-none"}
    />
  );
}
