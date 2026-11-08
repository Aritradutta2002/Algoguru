import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

export interface AiCommandLauncherProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Guru AI panel open state. */
  open?: boolean;
  /** Whether the current route embeds Guru in a page panel (e.g. problem solver). */
  embedded?: boolean;
  /** Compact icon-only trigger when header width is constrained. */
  compact?: boolean;
}

/**
 * Secondary button for GuruBot ("Ask Guru") in the top navigation bar.
 * - Uses shared <NavIcon icon={Sparkles} /> with a small green status dot on the icon
 * - Label: "Ask Guru" (no "READY" subtext, no purple gradient border)
 * - Shortcut hint (⌘J) in tooltip
 */
export const AiCommandLauncher = forwardRef<HTMLButtonElement, AiCommandLauncherProps>(
  function AiCommandLauncher({ open = false, embedded = false, compact = false, className, onClick, ...props }, ref) {
    if (embedded) {
      return (
        <AppTooltip content="Guru AI is embedded in the problem description panel">
          <span
            className={cn(
              "inline-flex h-9 items-center rounded-lg border border-obsidian-border bg-white/[0.04] text-sm font-medium text-foreground/80 [&_svg]:text-obsidian-accent",
              compact ? "h-9 w-9 justify-center px-0 gap-0" : "px-3 gap-2",
              className,
            )}
          >
            <span className="relative inline-flex items-center justify-center">
              <NavIcon icon={Sparkles} />
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-obsidian-elevated"
              />
            </span>
            {!compact && <span className="hidden sm:inline leading-none">Guru Active</span>}
          </span>
        </AppTooltip>
      );
    }

    return (
      <AppTooltip content={open ? "Close Guru (⌘J)" : "Ask Guru (⌘J)"}>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={open ? "Close Guru AI Command Center" : "Open Guru AI Command Center"}
          aria-pressed={open}
          aria-keyshortcuts="Control+J Meta+J"
          className={cn(
            "group relative inline-flex h-9 shrink-0 items-center rounded-lg border text-sm font-medium leading-none",
            "transition-colors duration-150 ease-out touch-manipulation select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/40",
            compact ? "w-9 justify-center px-0 gap-0" : "px-3 gap-2",
            open
              ? "border-obsidian-accent/30 bg-obsidian-accent/10 text-foreground [&_svg]:text-obsidian-accent dark:border-obsidian-accent/40 dark:bg-obsidian-accent/10 dark:text-foreground dark:[&_svg]:text-obsidian-accent"
              : "border-obsidian-border bg-white/[0.04] text-foreground/80 [&_svg]:text-muted-foreground hover:bg-white/[0.06] hover:text-foreground hover:[&_svg]:text-foreground",
            className,
          )}
          {...props}
        >
          <span className="relative inline-flex items-center justify-center">
            <NavIcon icon={Sparkles} />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-obsidian-elevated"
            />
          </span>

          {!compact && <span className="leading-none">Ask Guru</span>}
        </button>
      </AppTooltip>
    );
  },
);
