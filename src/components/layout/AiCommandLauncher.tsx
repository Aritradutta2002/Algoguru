import { forwardRef } from "react";
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
 * AI Command Center entry point — enterprise-grade, first-class Guru launcher.
 *
 * Premium visual language:
 * - Multi-layer gradient ring with glow halo: distinguishes it as the platform's
 *   most important action, not just another icon button.
 * - Live emerald presence dot: instant "AI is ready" signal.
 * - Animated shimmer on hover: adds life without being distracting.
 * - ⌘J shortcut badge: power-user affordance inline on desktop.
 * - Scale + shadow micro-interaction: tactile, satisfying click.
 */
export const AiCommandLauncher = forwardRef<HTMLButtonElement, AiCommandLauncherProps>(
  function AiCommandLauncher({ open = false, embedded = false, className, onClick, ...props }, ref) {
    if (embedded) {
      return (
        <AppTooltip content="Guru AI is embedded in the problem description panel">
          <span
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-guru-accent/25 bg-guru-accent/[0.06] px-2.5 py-1 text-[hsl(var(--guru-accent))] text-xs font-semibold",
              className
            )}
          >
            <span className="relative flex items-center justify-center">
              <GuruAvatar size={20} ring status="ready" title={null} />
            </span>
            <span className="hidden sm:inline tracking-tight">Guru Active</span>
          </span>
        </AppTooltip>
      );
    }

    return (
      <AppTooltip content={open ? "Close Guru AI (⌘J)" : "Ask Guru AI (⌘J)"}>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={open ? "Close Guru AI Command Center" : "Open Guru AI Command Center"}
          aria-pressed={open}
          aria-keyshortcuts="Control+J Meta+J"
          className={cn(
            // Layout
            "group relative isolate flex h-10 shrink-0 items-center gap-2 rounded-xl px-2.5 outline-none",
            // Base interaction
            "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.95] touch-manipulation select-none",
            // Focus
            "focus-visible:ring-2 focus-visible:ring-[hsl(var(--guru-accent)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            // Closed state — tempting but restrained
            !open && [
              "border border-[hsl(var(--guru-accent)/0.28)] bg-[hsl(var(--guru-accent)/0.06)]",
              "shadow-[0_0_0_1px_hsl(var(--guru-accent)/0.08),inset_0_1px_0_hsl(255_100%_100%/0.05)]",
              "hover:border-[hsl(var(--guru-accent)/0.45)] hover:bg-[hsl(var(--guru-accent)/0.12)]",
              "hover:shadow-[0_0_0_3px_hsl(var(--guru-accent)/0.12),0_4px_16px_-8px_hsl(var(--guru-accent)/0.5)]",
              "hover:-translate-y-px",
            ],
            // Open state — committed, glowing
            open && [
              "border border-[hsl(var(--guru-accent)/0.55)] bg-[hsl(var(--guru-accent)/0.16)]",
              "shadow-[0_0_0_3px_hsl(var(--guru-accent)/0.16),0_8px_28px_-12px_hsl(var(--guru-accent)/0.65),inset_0_1px_0_hsl(255_100%_100%/0.08)]",
              "text-[hsl(var(--guru-accent))]",
            ],
            className
          )}
          {...props}
        >
          {/* ── Ambient shimmer on hover (CSS-only, no JS) ── */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300",
              "bg-[linear-gradient(135deg,hsl(var(--guru-accent)/0.14)_0%,transparent_55%,hsl(var(--guru-accent-2)/0.08)_100%)]",
              "group-hover:opacity-100",
            )}
          />

          {/* ── Guru avatar with premium ring + live dot ── */}
          <span className="relative flex shrink-0 items-center justify-center">
            {/* Outer glow ring — visible on hover & open */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-[-3px] rounded-[30%] transition-opacity duration-300",
                "bg-[conic-gradient(from_220deg,hsl(var(--guru-accent)/0.7),hsl(var(--guru-accent-2)/0.4)_35%,transparent_60%,hsl(var(--guru-accent)/0.55))]",
                open ? "opacity-100" : "opacity-0 group-hover:opacity-70",
              )}
              style={{ filter: "blur(3px)" }}
            />
            {/* Mark container with subtle inner glow */}
            <span
              className={cn(
                "relative flex items-center justify-center rounded-[28%] p-px transition-all duration-200",
                open
                  ? "shadow-[0_0_10px_hsl(var(--guru-accent)/0.5)]"
                  : "group-hover:shadow-[0_0_8px_hsl(var(--guru-accent)/0.35)]",
              )}
              style={
                open
                  ? {
                      background:
                        "linear-gradient(145deg,hsl(var(--guru-accent)/0.9),hsl(var(--guru-accent-2)/0.5) 52%,hsl(var(--guru-line)/0.85))",
                    }
                  : undefined
              }
            >
              <GuruAvatar
                size={24}
                ring={false}
                glow={open}
                mood={open ? "happy" : "idle"}
                title={null}
                className={cn(
                  "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  open ? "scale-[0.92]" : "group-hover:scale-[1.08]",
                )}
              />
            </span>

            {/* Live presence dot — always visible, pulses when open */}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full border-[1.5px] border-card bg-emerald-500",
                open ? "h-2 w-2 shadow-[0_0_6px_rgb(16_185_129/0.8)]" : "h-[6px] w-[6px]",
              )}
            >
              {open && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
          </span>

          {/* ── Label ── */}
          <span
            className={cn(
              "hidden sm:flex flex-col leading-none",
            )}
          >
            <span className="text-[11.5px] font-bold tracking-tight text-foreground group-hover:text-[hsl(var(--guru-accent))] transition-colors duration-200">
              GuruBot
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-500 leading-none">
              Ready
            </span>
          </span>

          {/* ── ⌘J Shortcut badge ── */}
          <kbd
            className={cn(
              "hidden lg:inline-flex items-center gap-px rounded-md border px-1.5 py-0.5",
              "font-mono text-[9px] font-bold tracking-tight",
              "transition-colors duration-200",
              open
                ? "border-[hsl(var(--guru-accent)/0.35)] bg-[hsl(var(--guru-accent)/0.1)] text-[hsl(var(--guru-accent))]"
                : "border-border/70 bg-background/70 text-muted-foreground/70 group-hover:border-[hsl(var(--guru-accent)/0.25)] group-hover:text-[hsl(var(--guru-accent)/0.8)]",
            )}
          >
            ⌘J
          </kbd>
        </button>
      </AppTooltip>
    );
  }
);
