import { cn } from "@/lib/utils";

/** Small shared primitives for the Guru surface. */

export function GuruIconButton({
  label,
  active = false,
  danger = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-guru-muted transition-colors duration-150",
        "hover:bg-white/[0.07] hover:text-guru-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent/70 focus-visible:ring-offset-1 focus-visible:ring-offset-guru-bg",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-guru-accent/15 text-guru-accent",
        danger && "hover:bg-red-500/15 hover:text-red-400",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GuruStatusDot({ tone }: { tone: "idle" | "busy" | "error" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        tone === "idle" && "bg-emerald-400",
        tone === "busy" && "bg-guru-accent animate-pulse",
        tone === "error" && "bg-red-400",
      )}
    />
  );
}

export function GuruKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-guru-line bg-guru-raised px-1 py-px font-sans text-[10px] font-medium text-guru-muted">
      {children}
    </kbd>
  );
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  if (!timestamp) return "";
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
