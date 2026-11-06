import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavIconProps extends Omit<LucideProps, "size" | "strokeWidth" | "color" | "fill"> {
  /** Lucide icon component to render. */
  icon: LucideIcon;
  /** Render at 16px for small chips/dropdown items instead of the standard 18px. */
  chip?: boolean;
  /** Optional explicit size override (defaults to 18px, or 16px when `chip` is true). */
  size?: 16 | 18 | 20;
}

/**
 * Shared navigation icon wrapper.
 * Enforces a single icon standard across the top navigation bar:
 * - size: 18px (16px inside small chips)
 * - strokeWidth: 1.75
 * - color: currentColor (inherits from parent link/button state)
 * - fill: none (never a hardcoded fill)
 */
export const NavIcon = forwardRef<SVGSVGElement, NavIconProps>(function NavIcon(
  { icon: Icon, chip = false, size, className, "aria-hidden": ariaHidden = true, ...props },
  ref,
) {
  const resolvedSize = size ?? (chip ? 16 : 18);

  return (
    <Icon
      ref={ref}
      size={resolvedSize}
      strokeWidth={1.75}
      color="currentColor"
      fill="none"
      aria-hidden={ariaHidden}
      className={cn("shrink-0 text-current transition-colors duration-150", className)}
      {...props}
    />
  );
});
