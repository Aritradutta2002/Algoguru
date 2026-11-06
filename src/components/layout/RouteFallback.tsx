import { BrandLoader } from "@/components/brand/BrandLoader";
import { cn } from "@/lib/utils";

/**
 * Full-viewport loading state used while a top-level route chunk resolves.
 * The branded wheel replaces the old static mark + shimmer bar so the first
 * paint of the app already looks like the product.
 */
export function AppLoadingScreen({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,hsl(var(--primary)/0.16),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(circle_at_50%_42%,#000_18%,transparent_70%)]"
      />
      <BrandLoader variant="screen" size="lg" label={label} className="relative z-10" />
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
      className={cn("mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-14 lg:px-16", className)}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mb-10 space-y-4">
        <div className="skeleton-shimmer h-5 w-28 rounded-full" />
        <div className="skeleton-shimmer h-11 w-3/5 max-w-lg rounded-xl" />
        <div className="skeleton-shimmer h-4 w-full max-w-2xl rounded-lg" />
        <div className="skeleton-shimmer h-4 w-4/5 max-w-xl rounded-lg" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="skeleton-shimmer h-11 w-11 rounded-xl" />
            <div className="skeleton-shimmer mt-6 h-5 w-2/3 rounded-lg" />
            <div className="skeleton-shimmer mt-3 h-4 w-full rounded-lg" />
            <div className="skeleton-shimmer mt-2 h-4 w-4/5 rounded-lg" />
            <div className="skeleton-shimmer mt-7 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
