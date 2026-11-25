"use client";

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
          "relative isolate border-b border-obsidian-border/80 bg-obsidian-void/85 supports-[backdrop-filter]:bg-obsidian-void/72 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-200",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent",
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
