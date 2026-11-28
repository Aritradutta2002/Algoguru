"use client";
import { Button } from "@/components/ui/button";

import { forwardRef } from "react";
import { AppTooltip } from "@/components/ui/tooltip";
import { GuruMark } from "@/components/brand/GuruMark";
import { cn } from "@/lib/utils";

export interface AiCommandLauncherProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Guru AI panel open state. */
  open?: boolean;
  /** Whether the current route embeds Guru in a page panel (e.g. problem solver). */
  embedded?: boolean;
  /** Compact icon-only trigger when header width is constrained. */
  compact?: boolean;
}

/** The mascot in its own quiet tile — the launcher's whole identity. */
function GuruGlyph() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.65rem] bg-guru-surface"
    >
      <GuruMark size={24} animated={false} title={null} />
      <span className="absolute -bottom-0.5 -right-0.5 h-[7px] w-[7px] rounded-full bg-guru-success ring-2 ring-background" />
    </span>
  );
}

/**
 * Secondary button for GuruBot ("Ask Guru") in the top navigation bar.
 * The Guru mascot replaces the generic sparkles glyph so the assistant has a
 * face in the header, with the shortcut hint kept in the tooltip and on wide
 * screens.
 */
export const AiCommandLauncher = forwardRef<HTMLButtonElement, AiCommandLauncherProps>(
  function AiCommandLauncher({ open = false, embedded = false, compact = false, className, onClick, ...props }, ref) {
    if (embedded) {
      return (
        <AppTooltip content="Guru AI is embedded in the problem description panel">
          <span
            className={cn(
              "inline-flex h-9 items-center rounded-full border border-guru-line bg-guru-surface/70 text-sm font-medium text-guru-text max-lg:min-h-[44px] max-lg:min-w-[44px]",
              compact ? "min-h-[44px] min-w-[44px] justify-center px-0 gap-0" : "pl-1.5 pr-3 gap-2",
              className,
            )}
          >
            <GuruGlyph />
            {!compact && <span className="hidden leading-none sm:inline">Guru Active</span>}
          </span>
        </AppTooltip>
      );
    }

    return (
      <AppTooltip content={open ? "Close Guru (⌘J)" : "Ask Guru (⌘J)"}>
        <Button variant="bare" size="bare"
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={open ? "Close Guru AI Command Center" : "Open Guru AI Command Center"}
          aria-pressed={open}
          aria-keyshortcuts="Control+J Meta+J"
          className={cn(
            "group relative inline-flex h-9 shrink-0 touch-manipulation select-none items-center rounded-full border text-sm font-medium leading-none",
            "max-lg:min-h-[44px] max-lg:min-w-[44px]",
            "transition-[background-color,border-color,color,box-shadow] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent",
            compact ? "min-h-[44px] min-w-[44px] justify-center px-0 gap-0" : "gap-2 pl-1.5 pr-2",
            open
              ? "border-guru-accent/35 bg-guru-accent/10 text-guru-text shadow-[inset_0_1px_0_hsl(var(--guru-surface)/0.65)]"
              : "border-guru-line bg-guru-surface/65 text-guru-text hover:border-guru-accent/30 hover:bg-guru-surface",
            className,
          )}
          {...props}
        >
          <GuruGlyph />

          {!compact && (
            <>
              <span className="leading-none">Ask Guru</span>
              <kbd className="ml-0.5 hidden items-center rounded border border-guru-line bg-guru-bg px-1.5 py-0.5 font-sans text-[10px] font-medium text-guru-muted lg:inline-flex">
                ⌘J
              </kbd>
            </>
          )}
        </Button>
      </AppTooltip>
    );
  },
);
