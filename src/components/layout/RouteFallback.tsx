import { BrandLoader } from "@/components/brand/BrandLoader";
import { cn } from "@/lib/utils";

/**
 * Full-viewport loading state used while a top-level route chunk resolves.
 *
 * One ambient wash behind the brand story — the wash is the same gradient the
 * pre-hydration splash (`#boot-splash` in index.html) paints, so a cold load
 * cross-fades without a visible jump.
 */
export function AppLoadingScreen({
  label = "Loading your workspace",
  progress,
}: {
  label?: string;
  /** 0–100 when the wait is measurable. Omit for an indeterminate shimmer. */
  progress?: number;
}) {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-obsidian-void"
      style={{
        backgroundImage:
          "radial-gradient(42rem 30rem at 50% 42%, hsl(239 84% 67% / 0.16), transparent 70%)",
      }}
    >
      <BrandLoader
        variant="screen"
        size="lg"
        label={label}
        progress={progress}
        className="relative z-10"
      />
    </div>
  );
}

/**
 * Content-area skeleton used inside the app shell. Keeps the sidebar and header
 * visible while a page chunk downloads, so navigation never feels like a reload.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 md:py-14", className)}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mb-10 space-y-4">
        <div className="skeleton-shimmer h-4 w-24 rounded-md" />
        <div className="skeleton-shimmer h-9 w-3/5 max-w-lg rounded-lg" />
        <div className="skeleton-shimmer h-4 w-full max-w-2xl rounded-md" />
        <div className="skeleton-shimmer h-4 w-4/5 max-w-xl rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5"
          >
            <div className="skeleton-shimmer h-10 w-10 rounded-lg" />
            <div className="skeleton-shimmer mt-5 h-5 w-2/3 rounded-md" />
            <div className="skeleton-shimmer mt-3 h-4 w-full rounded-md" />
            <div className="skeleton-shimmer mt-2 h-4 w-4/5 rounded-md" />
            <div className="skeleton-shimmer mt-6 h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
