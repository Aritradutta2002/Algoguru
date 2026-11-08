import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightNavbarProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/**
 * App header shell: a quiet translucent bar with a single hairline.
 *
 * The name is kept for compatibility with existing imports; the cursor
 * spotlight was removed so the header stays still while the pointer moves.
 */
export const SpotlightNavbar = forwardRef<HTMLElement, SpotlightNavbarProps>(
  function SpotlightNavbar({ children, className, ...props }, ref) {
    return (
      <header
        ref={ref}
        className={cn(
          "relative isolate border-b border-obsidian-border bg-obsidian-void/85 backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        <div className="relative z-10 h-full">{children}</div>
      </header>
    );
  },
);

SpotlightNavbar.displayName = "SpotlightNavbar";
