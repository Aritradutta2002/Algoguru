import { useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Code2,
  GraduationCap,
  Home,
  Map,
  Target,
  Trophy,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GuruAvatar } from "@/components/brand/GuruMark";

export interface NavLinkItem {
  label: string;
  path: string;
  icon: typeof Home;
  priority: "high" | "normal" | "base";
  category?: "core" | "sandbox" | "overview";
  live?: boolean;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: "Home", path: "/", icon: Home, priority: "base", category: "overview" },
  { label: "Practice", path: "/practice", icon: Target, priority: "high", category: "core" },
  { label: "Interview", path: "/interview", icon: GraduationCap, priority: "high", category: "core" },
  { label: "Roadmap", path: "/roadmap", icon: Map, priority: "high", category: "core" },
  { label: "Playground", path: "/playground", icon: Code2, priority: "normal", category: "sandbox" },
  { label: "Contest", path: "/contest", icon: Trophy, priority: "normal", category: "sandbox", live: true },
];

export const isNavActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

export function PrimaryNavigation({ pathname }: { pathname: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className="header-primary-nav flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/30 p-1 select-none"
    >
      {NAV_LINKS.map(({ label, path, icon: Icon, priority, live }, index) => {
        const active = isNavActive(pathname, path);
        const isCorePriority = priority === "high";

        return (
          <div key={path} className="flex items-center">
            {/* Optical grouping divider between Core tracks and Sandbox tools */}
            {index === 4 && (
              <div
                aria-hidden="true"
                className="mx-1.5 h-4 w-px bg-border/50 shrink-0 self-center rounded-full"
              />
            )}

            <Link
              to={path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "header-nav-link group relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[12.5px] transition-colors duration-150 select-none",
                active
                  ? "text-foreground font-semibold"
                  : isCorePriority
                  ? "text-foreground/70 font-medium hover:text-foreground"
                  : "text-muted-foreground/65 font-normal hover:text-foreground"
              )}
            >
              {/* Active pill — springs between links */}
              {active && (
                <motion.span
                  layoutId={reduceMotion ? undefined : "primary-nav-pill"}
                  className="header-nav-indicator absolute inset-0 rounded-lg"
                  transition={{ type: "spring", stiffness: 440, damping: 36 }}
                />
              )}

              {/* Hover background (inactive only) */}
              {!active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-background/60 dark:bg-card/50"
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                {/* Route icon */}
                <Icon
                  size={13}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 transition-colors duration-150",
                    active
                      ? "text-primary"
                      : "text-muted-foreground/60 group-hover:text-foreground/80",
                  )}
                />
                {label}
                {live && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </span>
                )}
              </span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function MobileNavigationMenu({
  pathname,
  onClose,
  onOpenLibrary,
  onToggleGuru,
}: {
  pathname: string;
  onClose: () => void;
  onOpenLibrary: () => void;
  onToggleGuru?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const trigger = document.getElementById("header-navigation-toggle");
    (
      ref.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]') ??
      ref.current?.querySelector<HTMLAnchorElement>("a")
    )?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        trigger?.focus();
      }
    };

    const handlePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target) &&
        !trigger?.contains(event.target)
      ) {
        onClose();
      }
    };

    const header = ref.current?.closest("header");
    const observer = new ResizeObserver(() => {
      if (ref.current && getComputedStyle(ref.current).display === "none") {
        onClose();
      }
    });

    if (header) observer.observe(header);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);

    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [onClose]);

  return (
    <motion.nav
      ref={ref}
      id="header-navigation-menu"
      aria-label="Mobile primary"
      initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="header-menu-sheet absolute inset-x-3 sm:inset-x-6 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-2xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto"
    >
      {/* Workspace Context Header */}
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-b border-border/50">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            AlgoGuru Workspace
          </p>
          <span className="text-xs font-medium text-foreground">Developer Navigation</span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          Enterprise SaaS
        </span>
      </div>

      {/* Guru AI Command Card (Tablet & Mobile Access) */}
      {onToggleGuru && (
        <div className="pt-3 pb-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleGuru();
            }}
            className="group w-full flex items-center justify-between rounded-xl border border-primary/25 bg-primary/[0.04] p-3 text-left transition-all hover:bg-primary/[0.08] hover:border-primary/40 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <GuruAvatar size={20} title={null} ring={false} />
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-card" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Guru AI Coach
                  <span className="text-[10px] font-normal text-emerald-500">• Ready</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Ask problem hints, complexity, or design advice
                </span>
              </div>
            </div>
            <kbd className="hidden sm:inline-flex items-center rounded border border-primary/20 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary/80">
              ⌘J
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation Links Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2.5 pb-2">
        {NAV_LINKS.map(({ label, path, icon: Icon, live, priority }) => {
          const active = isNavActive(pathname, path);
          const isCore = priority === "high";

          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "header-mobile-link flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-semibold transition-all select-none",
                active
                  ? "border-primary/40 bg-primary/10 text-primary shadow-xs"
                  : isCore
                  ? "border-border/70 bg-muted/40 text-foreground hover:bg-muted/70"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon
                size={17}
                aria-hidden="true"
                className={active ? "text-primary" : isCore ? "text-foreground/80" : "text-muted-foreground"}
              />
              <span className="flex-1 truncate">{label}</span>
              {live && (
                <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  Live
                </span>
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenLibrary();
          }}
          className="header-mobile-link col-span-2 flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-2.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-all cursor-pointer"
        >
          <BookOpen size={17} aria-hidden="true" className="text-primary" />
          <span>Browse learning library</span>
        </button>
      </div>
    </motion.nav>
  );
}
