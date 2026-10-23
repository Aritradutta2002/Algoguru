import { Suspense, lazy, useEffect, useState } from "react";
import { AppTooltip } from "@/components/ui/tooltip";
import { SearchMark } from "@/components/brand/SearchMark";

/**
 * The header search entry point.
 *
 * `GlobalSearch` owns the palette and imports the full local search index,
 * which pulls in every backend-interview and practice document. Rendering it
 * eagerly put all of that in the initial JS bundle. This launcher renders the
 * same trigger for zero cost and only fetches the palette when the user
 * actually asks for it — by click or Ctrl/⌘+K.
 */
const GlobalSearch = lazy(() =>
  import("@/components/GlobalSearch").then((module) => ({
    default: module.GlobalSearch,
  })),
);

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <AppTooltip content="Search AlgoGuru (Ctrl+K)">
      <button
        type="button"
        onClick={onClick}
        aria-label="Search AlgoGuru"
        data-search-trigger="true"
        className="group relative flex h-8 w-44 items-center gap-2 overflow-hidden rounded-lg border border-border/60 bg-muted/40 pl-1.5 pr-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-muted/70 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] active:scale-[0.98] sm:w-56 md:w-64 lg:w-72"
      >
        <SearchMark
          size={20}
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <span className="hidden min-w-0 flex-1 truncate text-[13px] text-muted-foreground/65 transition-colors group-hover:text-muted-foreground sm:inline">
          Search topics, problems…
        </span>
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border/60 bg-background/70 px-1.5 py-px font-mono text-[10px] font-semibold leading-none text-muted-foreground/55 transition-colors group-hover:border-primary/25 group-hover:text-primary md:inline-flex">
          <span>⌘</span>K
        </kbd>
      </button>
    </AppTooltip>
  );
}

export function GlobalSearchLauncher() {
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
    return <SearchTrigger onClick={() => setLoaded(true)} />;
  }

  return (
    <Suspense fallback={<SearchTrigger onClick={() => undefined} />}>
      <GlobalSearch initialOpen />
    </Suspense>
  );
}
