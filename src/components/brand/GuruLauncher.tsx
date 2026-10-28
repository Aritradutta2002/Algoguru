import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GuruMark } from "./GuruMark";

export interface GuruLauncherProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Panel open state — drives the active treatment and `aria-pressed`. */
  open?: boolean;
  /** Accessible name. The tooltip lives outside this component. */
  label?: string;
}

/**
 * The Guru entry point in the app header.
 *
 * A 40px target with the mascot at its centre: a soft indigo halo when idle
 * (alive, but not shouting), a solid ring + tinted plate when open, and a
 * focus-visible outline that matches the rest of the header controls.
 *
 * Kept dependency-free so `App.tsx` doesn't have to load the chat bundle just
 * to render a button — same reason `GURU_PANEL_CONSTANTS` lives in `lib/`.
 */
export const GuruLauncher = forwardRef<HTMLButtonElement, GuruLauncherProps>(
  function GuruLauncher({ open = false, label = "Guru AI", className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={open ? `Close ${label}` : `Open ${label}`}
        aria-pressed={open}
        aria-keyshortcuts="Control+J Meta+J"
        className={cn(
          "group relative isolate flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl",
          "transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:-translate-y-px active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open
            ? "bg-guru-accent/15 shadow-[inset_0_0_0_1px_hsl(var(--guru-accent)/0.45),0_0_22px_-6px_hsl(var(--guru-accent)/0.55)]"
            : "bg-transparent hover:bg-guru-accent/10",
          className,
        )}
        {...props}
      >
        {/* Ambient halo — idle only, so the open state reads as a decision. */}
        {!open && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1 -z-10 rounded-full bg-guru-accent/25 blur-md animate-guru-halo motion-reduce:animate-none group-hover:opacity-90"
          />
        )}
        <GuruMark
          size={30}
          title={null}
          className={cn(
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "scale-95" : "group-hover:scale-105",
          )}
        />
        {/* Expanded hit area stays 40px, but the visual plate is 34px. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-xl ring-1 transition-colors",
            open ? "ring-white/15" : "ring-transparent group-hover:ring-white/10",
          )}
        />
      </button>
    );
  },
);
