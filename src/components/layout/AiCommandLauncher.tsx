import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { cn } from "@/lib/utils";

export interface AiCommandLauncherProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Guru AI panel open state. */
  open?: boolean;
  /** Whether the current route embeds Guru in a page panel (e.g. problem solver). */
  embedded?: boolean;
}

/**
 * AI Command Center entry point in the AlgoGuru navbar.
 *
 * Designed to elevate Guru AI as a first-class platform capability (Linear / Notion Q&A / Cursor style):
 * - Distinctive gradient ring and subtle ambient halo
 * - Live status beacon indicating AI engine readiness
 * - Keyboard shortcut badge (⌘J / Ctrl+J)
 * - Seamless desktop and tablet responsive scaling
 */
export const AiCommandLauncher = forwardRef<HTMLButtonElement, AiCommandLauncherProps>(
  function AiCommandLauncher({ open = false, embedded = false, className, onClick, ...props }, ref) {
    if (embedded) {
      return (
        <AppTooltip content="Guru AI is embedded in the problem description panel">
          <span
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1 text-primary text-xs font-medium",
              className
            )}
          >
            <GuruAvatar size={20} ring status="ready" title={null} />
            <span className="hidden sm:inline">Guru Active</span>
          </span>
        </AppTooltip>
      );
    }

    return (
      <AppTooltip content={open ? "Close Guru AI (⌘J)" : "Guru AI Command Center (⌘J)"}>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={open ? "Close Guru AI Command Center" : "Open Guru AI Command Center"}
          aria-pressed={open}
          aria-keyshortcuts="Control+J Meta+J"
          className={cn(
            "group relative flex h-10 items-center gap-2 rounded-xl px-3 outline-none",
            "transition-all duration-200 ease-out active:scale-95 touch-manipulation select-none",
            "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
            open
              ? "border border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
              : "border border-primary/25 bg-primary/[0.04] text-foreground hover:border-primary/40 hover:bg-primary/[0.09] hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
            className
          )}
          {...props}
        >
          {/* Avatar / Icon with ambient halo */}
          <div className="relative flex items-center justify-center">
            <GuruAvatar
              size={22}
              ring={false}
              mood={open ? "happy" : "idle"}
              title={null}
              className="transition-transform duration-200 group-hover:scale-105"
            />
            {/* Live status dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-card" />
          </div>

          <span className="hidden sm:inline text-xs font-semibold tracking-tight">
            Guru AI
          </span>

          {/* ⌘J Shortcut badge */}
          <kbd className="hidden lg:inline-flex items-center rounded border border-primary/20 bg-background/80 px-1 py-0.5 font-mono text-[9.5px] font-semibold text-primary/80">
            ⌘J
          </kbd>
        </button>
      </AppTooltip>
    );
  }
);
