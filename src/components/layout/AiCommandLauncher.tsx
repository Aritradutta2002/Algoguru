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
              "inline-flex h-9 items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400",
              compact ? "h-9 w-9 justify-center px-0 gap-0" : "px-3 gap-2",
              className,
            )}
          >
            <span className="relative inline-flex items-center justify-center">
              <NavIcon icon={Sparkles} />
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-50 dark:ring-slate-900"
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
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
            compact ? "w-9 justify-center px-0 gap-0" : "px-3 gap-2",
            open
              ? "border-blue-600/30 bg-blue-50/80 text-slate-900 [&_svg]:text-blue-600 dark:border-blue-500/40 dark:bg-blue-950/50 dark:text-slate-50 dark:[&_svg]:text-blue-400"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:[&_svg]:text-slate-900 dark:hover:[&_svg]:text-slate-100",
            className,
          )}
          {...props}
        >
          <span className="relative inline-flex items-center justify-center">
            <NavIcon icon={Sparkles} />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
            />
          </span>

          {!compact && <span className="leading-none">Ask Guru</span>}
        </button>
      </AppTooltip>
    );
  },
);
