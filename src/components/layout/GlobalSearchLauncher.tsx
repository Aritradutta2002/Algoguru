import { Suspense, lazy, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { SearchMark } from "@/components/brand/SearchMark";
import { cn } from "@/lib/utils";

/**
 * The header search entry point.
 *
 * `GlobalSearch` owns the palette and imports the full local search index.
 * Rendering it eagerly put all of that in the initial JS bundle. This launcher
 * renders the command palette trigger for zero bundle cost and only fetches the
 * palette when the user actually asks for it — by click or Ctrl/⌘+K.
 */
const GlobalSearch = lazy(() =>
  import("@/components/GlobalSearch").then((module) => ({
    default: module.GlobalSearch,
  })),
);

interface SearchTriggerProps {
  onClick: () => void;
  className?: string;
  placeholder?: string;
}

export function SearchTrigger({
  onClick,
  className,
  placeholder = "Search problems, topics, roadmaps, AI...",
}: SearchTriggerProps) {
  return (
    <AppTooltip content="Search AlgoGuru (⌘K)">
      <button
        type="button"
        onClick={onClick}
        aria-label="Search AlgoGuru"
        data-search-trigger="true"
        className={cn(
          "group relative flex h-10 items-center gap-2.5 overflow-hidden rounded-xl",
          "border border-border/60 bg-muted/40 px-3 text-left",
          "transition-all duration-200 ease-out",
          "hover:border-primary/30 hover:bg-muted/70 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]",
          "active:scale-[0.98] outline-none touch-manipulation select-none",
          "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
          className
        )}
      >
        <SearchMark
          size={18}
          className="shrink-0 transition-transform duration-300 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        />

        <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground/75 transition-colors group-hover:text-foreground">
          {placeholder}
        </span>

        <kbd className="shrink-0 items-center gap-0.5 rounded-md border border-border/70 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground/70 transition-colors group-hover:border-primary/25 group-hover:text-primary flex">
          <span>⌘</span>K
        </kbd>
      </button>
    </AppTooltip>
  );
}

interface GlobalSearchLauncherProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearchLauncher({
  className,
  placeholder = "Search problems, topics, roadmaps, AI...",
}: GlobalSearchLauncherProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;

    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setLoaded(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loaded]);

  if (!loaded) {
    return (
      <SearchTrigger
        onClick={() => setLoaded(true)}
        className={className}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Suspense fallback={<SearchTrigger onClick={() => undefined} className={className} placeholder={placeholder} />}>
      <GlobalSearch initialOpen />
    </Suspense>
  );
}
