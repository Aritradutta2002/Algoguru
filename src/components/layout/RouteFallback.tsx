import type { CSSProperties } from "react";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { SurfaceLockup } from "@/components/brand/SurfaceLockup";
import "@/components/brand/brand.css";
import { cn } from "@/lib/utils";

/** Full-viewport fallback for route navigation and session restoration. */
export function AppLoadingScreen({
  label = "Loading your workspace",
  sublabel,
  progress,
  className,
}: {
  label?: string;
  /** Optional quiet status caption rendered beneath the primary label. */
  sublabel?: string;
  /** 0–100 when the wait is measurable. Omit for an indeterminate shimmer. */
  progress?: number;
  className?: string;
}) {
  const percent = typeof progress === "number" && Number.isFinite(progress)
    ? Math.round(Math.min(100, Math.max(0, progress)))
    : null;

  return (
    <div
      className={cn(
        "ag-theme agl-screen min-h-[100dvh]",
        className,
      )}
    >
      <div className="agl-screen__inner">
        <SurfaceLockup />
        <svg viewBox="0 0 248 84" fill="none" aria-hidden="true" focusable="false" className="agl-screen__diagram">
          <path className="agl-screen__track" d="M18 42h46l28-24h64l28 24h46M64 42l28 24h64l28-24" />
          {percent === null && (
            <path className="agl-screen__trace" pathLength="100" d="M18 42h46l28-24h64l28 24h46" />
          )}
          <g className="agl-screen__nodes">
            <circle cx="18" cy="42" r="4" />
            <circle cx="92" cy="66" r="4" />
            <circle cx="156" cy="66" r="4" />
            <circle cx="230" cy="42" r="4" />
          </g>
          <rect x="117" y="11" width="14" height="14" rx="3" className="agl-screen__node" />
        </svg>
        <div role="status" aria-live="polite" aria-busy="true" className="agl-screen__copy">
          <p>{label}</p>
          {sublabel && <p className="agl-screen__caption">{sublabel}</p>}
        </div>
        {percent !== null && (
          <div className="agl-screen__progress">
            <progress aria-label={label} max={100} value={percent} />
            <span aria-hidden="true">{percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonBlock({
  className,
  delayMs = 0,
}: {
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn("agl-skeleton", className)}
      style={{ "--agl-delay": `${delayMs}ms` } as CSSProperties}
    />
  );
}

/**
 * Content-area skeleton used inside the app shell. Mirrors `PageHeader` and
 * `PageContainer` proportions so route transitions keep zero layout shift while
 * a page chunk streams in.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-full", className)}
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* Editorial header band matching PageHeader */}
      <div className="border-b border-obsidian-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-end md:justify-between md:py-14">
          <div className="min-w-0 flex-1 max-w-2xl space-y-3.5">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="h-3.5 w-16 rounded-full" />
              <span className="text-xs text-muted-foreground/40" aria-hidden="true">/</span>
              <SkeletonBlock className="h-3.5 w-24 rounded-full" delayMs={60} />
            </div>
            <SkeletonBlock className="h-5 w-28 rounded-full" delayMs={80} />
            <SkeletonBlock className="h-9 w-3/4 max-w-md rounded-lg" delayMs={120} />
            <div className="space-y-2 pt-0.5">
              <SkeletonBlock className="h-4 w-full max-w-xl rounded-md" delayMs={160} />
              <SkeletonBlock className="h-4 w-4/5 max-w-md rounded-md" delayMs={200} />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-pane px-3 py-1.5 shadow-specular">
              <BrandLoader size="sm" variant="inline" label={null} />
              <span className="text-xs font-medium text-muted-foreground">
                Syncing view
              </span>
            </div>
            <SkeletonBlock className="hidden h-9 w-28 rounded-lg sm:block" delayMs={140} />
          </div>
        </div>
      </div>

      {/* Main workspace body */}
      <div className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 sm:px-6 md:py-10">
        {/* Segmented control & search toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-obsidian-border bg-obsidian-pane p-2 shadow-specular">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-1">
            <SkeletonBlock className="h-7 w-20 rounded-md" delayMs={80} />
            <SkeletonBlock className="h-7 w-24 rounded-md" delayMs={120} />
            <SkeletonBlock className="h-7 w-20 rounded-md" delayMs={160} />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-44 rounded-lg sm:w-56" delayMs={180} />
            <SkeletonBlock className="hidden h-8 w-20 rounded-lg sm:block" delayMs={220} />
          </div>
        </div>

        {/* Summary KPI strip */}
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-4 shadow-specular"
            >
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-3.5 w-20 rounded-md" delayMs={index * 60} />
                <SkeletonBlock className="h-7 w-7 rounded-lg" delayMs={index * 60 + 40} />
              </div>
              <SkeletonBlock className="mt-3.5 h-6 w-16 rounded-md" delayMs={index * 60 + 80} />
              <SkeletonBlock className="mt-3 h-1.5 w-full rounded-full" delayMs={index * 60 + 120} />
            </div>
          ))}
        </div>

        {/* Asymmetric primary tracks + secondary sidebar rail */}
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col justify-between rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5 shadow-specular"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-xl" delayMs={index * 70} />
                    <SkeletonBlock className="h-5 w-20 rounded-full" delayMs={index * 70 + 40} />
                  </div>
                  <SkeletonBlock className="mt-5 h-5 w-3/5 rounded-md" delayMs={index * 70 + 80} />
                  <SkeletonBlock className="mt-2.5 h-4 w-full rounded-md" delayMs={index * 70 + 120} />
                  <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-md" delayMs={index * 70 + 150} />
                </div>
                <div className="mt-6 space-y-2.5">
                  <SkeletonBlock className="h-1.5 w-full rounded-full" delayMs={index * 70 + 180} />
                  <div className="flex items-center justify-between pt-0.5">
                    <SkeletonBlock className="h-3 w-20 rounded-md" delayMs={index * 70 + 210} />
                    <SkeletonBlock className="h-3 w-12 rounded-md" delayMs={index * 70 + 240} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5 shadow-specular">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-5 w-32 rounded-md" delayMs={100} />
                <SkeletonBlock className="h-5 w-14 rounded-full" delayMs={140} />
              </div>
              <div className="mt-5 space-y-3.5">
                {Array.from({ length: 4 }).map((_, row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between gap-3 rounded-lg border border-obsidian-border/60 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" delayMs={row * 65} />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <SkeletonBlock className="h-3.5 w-4/5 rounded-md" delayMs={row * 65 + 40} />
                        <SkeletonBlock className="h-3 w-1/2 rounded-md" delayMs={row * 65 + 80} />
                      </div>
                    </div>
                    <SkeletonBlock className="h-5 w-12 shrink-0 rounded-full" delayMs={row * 65 + 100} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
