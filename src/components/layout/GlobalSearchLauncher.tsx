import { Suspense, lazy, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

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
  compact?: boolean;
}

export function SearchTrigger({
  onClick,
  className,
  placeholder = "Search...",
  compact,
}: SearchTriggerProps) {
  const isCompact = compact === true;
  const isExplicitWide = compact === false;

  return (
    <AppTooltip content="Search (⌘K)">
      <button
        type="button"
        onClick={onClick}
        aria-label="Search AlgoGuru"
        data-search-trigger="true"
        className={cn(
          "group relative inline-flex shrink-0 items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-left text-slate-500 dark:text-slate-400 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400 transition-colors duration-150 ease-out hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:[&_svg]:text-slate-900 dark:hover:[&_svg]:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 touch-manipulation select-none",
          isCompact
            ? "h-9 w-9 justify-center px-0 gap-0"
            : isExplicitWide
              ? "h-9 w-56 justify-start px-3 gap-2"
              : "h-11 w-11 lg:h-9 lg:w-9 xl:w-56 justify-center xl:justify-start px-0 xl:px-3 gap-2",
          className,
        )}
      >
        <NavIcon icon={Search} />

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-normal text-slate-500 dark:text-slate-400 transition-colors duration-150 group-hover:text-slate-700 dark:group-hover:text-slate-200",
            isCompact ? "hidden" : isExplicitWide ? "inline" : "hidden xl:inline",
          )}
        >
          {placeholder}
        </span>

        <kbd
          className={cn(
            "shrink-0 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400",
            isCompact ? "hidden" : isExplicitWide ? "inline-flex" : "hidden xl:inline-flex",
          )}
        >
          <span>⌘</span>K
        </kbd>
      </button>
    </AppTooltip>
  );
}

interface GlobalSearchLauncherProps {
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

export function GlobalSearchLauncher({
  className,
  placeholder = "Search...",
  compact,
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
        compact={compact}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <SearchTrigger
          onClick={() => undefined}
          className={className}
          placeholder={placeholder}
          compact={compact}
        />
      }
    >
      <GlobalSearch initialOpen />
    </Suspense>
  );
}
