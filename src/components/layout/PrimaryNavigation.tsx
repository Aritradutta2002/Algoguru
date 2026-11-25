"use client";
import { Button } from "@/components/ui/button";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  Compass,
  Cpu,
  Database,
  GitBranch,
  House,
  Layers,
  Network,
  Play,
  Route,
  Server,
  Sparkles,
  SquareTerminal,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

export interface MegaMenuEntry {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export interface NavLinkItem {
  label: string;
  path: string;
  icon: LucideIcon;
  priority: "high" | "normal" | "base";
  category?: "core" | "sandbox" | "overview";
  megaMenu?: MegaMenuEntry[];
}

export const MEGA_MENUS: Record<string, MegaMenuEntry[]> = {
  "/practice": [
    {
      title: "DSA Problem Sheets",
      description: "Curated coding interview problems by topic and difficulty",
      path: "/practice",
      icon: Code2,
    },
    {
      title: "Daily Challenge",
      description: "Solve today's featured algorithmic problem in the IDE",
      path: "/problem-solver",
      icon: SquareTerminal,
    },
    {
      title: "Arrays & Patterns",
      description: "Pattern-wise data structure mastery and guided examples",
      path: "/arrays",
      icon: Layers,
    },
    {
      title: "Interactive Playground",
      description: "Instant multi-language sandbox for testing solutions",
      path: "/playground",
      icon: Play,
    },
  ],
  "/interview": [
    {
      title: "Interview Prep Hub",
      description: "Language tracks, company prep, and structured guides",
      path: "/interview",
      icon: BriefcaseBusiness,
    },
    {
      title: "Core Java Q&A",
      description: "Deep JVM internals, concurrency, and collections",
      path: "/interview/java/core-java-qa",
      icon: Cpu,
    },
    {
      title: "Spring Boot Track",
      description: "Production backend architecture, annotations & practice",
      path: "/interview/java/spring-boot",
      icon: Server,
    },
    {
      title: "System Design",
      description: "Scalable distributed systems and architecture case studies",
      path: "/interview/java/system-design",
      icon: Network,
    },
  ],
  "/roadmap": [
    {
      title: "Interactive Roadmaps",
      description: "Visual skill trees and step-by-step engineering paths",
      path: "/roadmap",
      icon: Route,
    },
    {
      title: "Java Mastery Path",
      description: "End-to-end roadmap from core syntax to backend internals",
      path: "/roadmap/java",
      icon: Compass,
    },
    {
      title: "Data Structures Path",
      description: "Linear, tree, and graph structures for interviews",
      path: "/interview/java/data-structure",
      icon: GitBranch,
    },
    {
      title: "SQL & Databases",
      description: "Relational schema design, indexing, and query tuning",
      path: "/interview/java/sql-structure",
      icon: Database,
    },
  ],
};

export const NAV_LINKS: NavLinkItem[] = [
  { label: "Home", path: "/", icon: House, priority: "base", category: "overview" },
  {
    label: "Practice",
    path: "/practice",
    icon: Code2,
    priority: "high",
    category: "core",
    megaMenu: MEGA_MENUS["/practice"],
  },
  {
    label: "Interview",
    path: "/interview",
    icon: BriefcaseBusiness,
    priority: "high",
    category: "core",
    megaMenu: MEGA_MENUS["/interview"],
  },
  {
    label: "Roadmap",
    path: "/roadmap",
    icon: Route,
    priority: "high",
    category: "core",
    megaMenu: MEGA_MENUS["/roadmap"],
  },
  {
    label: "Playground",
    path: "/playground",
    icon: SquareTerminal,
    priority: "normal",
    category: "sandbox",
  },
  {
    label: "Contest",
    path: "/contest",
    icon: Trophy,
    priority: "normal",
    category: "sandbox",
  },
];

export const isNavActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

/**
 * Checks whether a coding or MCQ contest session is currently active.
 * The pulsing orange Contest dot is only displayed when a contest is actually running.
 */
export function isContestRunning(pathname: string, explicitLive?: boolean): boolean {
  if (typeof explicitLive === "boolean") {
    return explicitLive;
  }
  if (pathname.startsWith("/contest/coding/session") || pathname.startsWith("/contest/mcq")) {
    return true;
  }
  try {
    const activeSessionId = window.localStorage.getItem("algoguru:coding-contest:active-session");
    if (!activeSessionId) return false;
    const raw = window.localStorage.getItem(`algoguru:coding-contest:session:${activeSessionId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      session?: { status?: string; expiresAt?: number };
    };
    return (
      parsed?.session?.status === "active" &&
      typeof parsed?.session?.expiresAt === "number" &&
      parsed.session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export function partitionNavLinks(count: number): {
  visibleLinks: NavLinkItem[];
  overflowLinks: NavLinkItem[];
} {
  const safeCount = Math.max(0, Math.min(NAV_LINKS.length, count));
  if (safeCount >= 6) {
    return { visibleLinks: NAV_LINKS, overflowLinks: [] };
  }
  if (safeCount === 5) {
    return {
      visibleLinks: NAV_LINKS.slice(0, 5),
      overflowLinks: NAV_LINKS.slice(5),
    };
  }
  if (safeCount === 4) {
    return {
      visibleLinks: NAV_LINKS.slice(0, 4),
      overflowLinks: NAV_LINKS.slice(4),
    };
  }
  if (safeCount === 3) {
    const core = NAV_LINKS.filter((l) => l.priority === "high");
    const rest = NAV_LINKS.filter((l) => l.priority !== "high");
    return { visibleLinks: core, overflowLinks: rest };
  }
  const topCore = NAV_LINKS.filter((l) => l.path === "/practice" || l.path === "/interview");
  const others = NAV_LINKS.filter((l) => l.path !== "/practice" && l.path !== "/interview");
  return { visibleLinks: topCore, overflowLinks: others };
}

export function PrimaryNavigation({
  pathname,
  contestLive,
  maxVisibleItems,
}: {
  pathname: string;
  contestLive?: boolean;
  maxVisibleItems?: number;
}) {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const megaContentRef = useRef<HTMLDivElement>(null);
  const suppressMenuFocusOpenRef = useRef<string | null>(null);

  const [contestRunning, setContestRunning] = useState(() =>
    typeof contestLive === "boolean"
      ? contestLive
      : pathname.startsWith("/contest/coding/session") || pathname.startsWith("/contest/mcq"),
  );

  useEffect(() => {
    setContestRunning(isContestRunning(pathname, contestLive));
  }, [pathname, contestLive]);

  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When containerWidth is 0 (tests/SSR/initial), default to all 6 items
  const effectiveCount = maxVisibleItems ?? (
    containerWidth === 0 || containerWidth >= 580 ? 6 :
    containerWidth >= 460 ? 4 :
    containerWidth >= 340 ? 3 : 2
  );

  const { visibleLinks, overflowLinks } = partitionNavLinks(effectiveCount);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (path: string) => {
      clearTimers();
      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null;
        setOpenMenuPath(path);
      }, 200);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpenMenuPath(null);
    }, 150);
  }, [clearTimers]);

  const handleMenuOpenChange = useCallback(
    (path: string, open: boolean) => {
      clearTimers();
      setOpenMenuPath((current) => (open ? path : current === path ? null : current));
    },
    [clearTimers],
  );

  useEffect(() => {
    setOpenMenuPath(null);
    setMoreOpen(false);
    clearTimers();
  }, [pathname, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const isOverflowActive = overflowLinks.some((l) => isNavActive(pathname, l.path));
  const overflowHasLiveContest = overflowLinks.some(
    (l) => l.path === "/contest" && contestRunning,
  );

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="header-primary-nav flex h-16 items-center gap-1 select-none max-w-full overflow-visible"
    >
      {visibleLinks.map(({ label, path, icon, megaMenu }) => {
        const active = isNavActive(pathname, path);
        const showLiveDot = path === "/contest" && contestRunning;
        const isMegaOpen = Boolean(megaMenu && openMenuPath === path);

        const navigationLink = (
          <Link
            href={path}
            aria-current={active ? "page" : undefined}
            onFocus={
              megaMenu
                ? () => {
                    if (suppressMenuFocusOpenRef.current === path) {
                      suppressMenuFocusOpenRef.current = null;
                      return;
                    }
                    scheduleOpen(path);
                  }
                : undefined
            }
            onBlur={
              megaMenu
                ? (event) => {
                    if (!megaContentRef.current?.contains(event.relatedTarget as Node | null)) {
                      scheduleClose();
                    }
                  }
                : undefined
            }
            onClick={megaMenu ? clearTimers : undefined}
            className={cn(
              "header-nav-link group relative inline-flex h-9 items-center gap-2 rounded-md px-3 text-[14px] font-medium leading-none transition-colors duration-150 ease-out select-none whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              active
                ? "text-foreground [&_svg]:text-foreground"
                : "text-muted-foreground [&_svg]:text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground hover:[&_svg]:text-foreground",
            )}
          >
            <span className="leading-none">{label}</span>
            {showLiveDot && (
              <span
                aria-label="Contest live"
                className="relative flex h-2 w-2 shrink-0"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
            )}
          </Link>
        );

        {/* 2px blue-600 indicator along the bottom edge of the navbar */}
        const activeIndicator = active && (
          <motion.span
            layoutId={reduceMotion ? undefined : "navbar-active-indicator"}
            className="header-nav-indicator pointer-events-none absolute inset-x-2 bottom-0 h-px bg-foreground"
            transition={{ type: "spring", stiffness: 460, damping: 36 }}
          />
        );

        return (
          <div
            key={path}
            className="relative flex h-full items-center"
            onMouseEnter={() => {
              if (megaMenu) scheduleOpen(path);
            }}
            onMouseLeave={() => {
              if (megaMenu) scheduleClose();
            }}
          >
            {megaMenu ? (
              <Popover
                open={isMegaOpen}
                onOpenChange={(open) => handleMenuOpenChange(path, open)}
              >
                <PopoverTrigger asChild>{navigationLink}</PopoverTrigger>
                {activeIndicator}

                {/* 2-Column Mega Menu Popover */}
                <PopoverContent
                  ref={megaContentRef}
                  align="start"
                  sideOffset={2}
                  aria-label={`${label} quick links`}
                  className="z-50 w-[480px] rounded-xl border border-obsidian-border bg-obsidian-elevated/95 p-2 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
                  onOpenAutoFocus={clearTimers}
                  onCloseAutoFocus={() => {
                    suppressMenuFocusOpenRef.current = path;
                    queueMicrotask(() => {
                      if (suppressMenuFocusOpenRef.current === path) {
                        suppressMenuFocusOpenRef.current = null;
                      }
                    });
                  }}
                  onMouseEnter={clearTimers}
                  onMouseLeave={scheduleClose}
                >
                  <div className="grid grid-cols-2 gap-1">
                    {megaMenu.map((entry) => (
                      <Link
                        key={entry.path + entry.title}
                        href={entry.path}
                        onClick={() => handleMenuOpenChange(path, false)}
                        className="group/item flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-150 hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-obsidian-border bg-foreground/[0.03] text-muted-foreground transition-colors duration-150 group-hover/item:border-obsidian-border group-hover/item:bg-foreground/[0.06] group-hover/item:text-foreground">
                          <NavIcon icon={entry.icon} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <>
                {navigationLink}
                {activeIndicator}
              </>
            )}
          </div>
        );
      })}

      {/* Dynamic Overflow Dropdown */}
      {overflowLinks.length > 0 && (
        <div className="relative flex h-full items-center">
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="bare" size="bare"
                type="button"
                aria-label="More navigation options"
                aria-expanded={moreOpen}
                className={cn(
                  "header-nav-link group relative inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium leading-none transition-colors duration-150 ease-out select-none whitespace-nowrap cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  isOverflowActive
                    ? "text-foreground [&_svg]:text-foreground"
                    : "text-muted-foreground [&_svg]:text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground hover:[&_svg]:text-foreground",
                )}
              >
                <span className="leading-none">More</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-150",
                    moreOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />

                {overflowHasLiveContest && (
                  <span
                    aria-label="Contest live"
                    className="relative flex h-2 w-2 shrink-0 ml-0.5"
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-xl border border-obsidian-border bg-obsidian-elevated/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="space-y-0.5">
                {overflowLinks.map((item) => {
                  const active = isNavActive(pathname, item.path);
                  const showLiveDot = item.path === "/contest" && contestRunning;

                  return (
                    <DropdownMenuItem asChild key={item.path} onSelect={() => setMoreOpen(false)}>
                      <Link
                        href={item.path}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
                          active
                            ? "bg-foreground/[0.06] text-foreground [&_svg]:text-foreground"
                            : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground [&_svg]:text-muted-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                            active
                              ? "border-obsidian-border bg-foreground/[0.06] text-foreground"
                              : "border-obsidian-border bg-foreground/[0.03] text-muted-foreground",
                          )}
                        >
                          <NavIcon icon={item.icon} chip />
                        </div>
                        <span className="flex-1 truncate">{item.label}</span>
                        {showLiveDot && (
                          <span
                            aria-label="Contest live"
                            className="relative flex h-2 w-2 shrink-0"
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2px blue indicator along the bottom edge when an overflow destination is active */}
          {isOverflowActive && (
            <motion.span
              layoutId={reduceMotion ? undefined : "navbar-active-indicator"}
              className="header-nav-indicator pointer-events-none absolute inset-x-2 bottom-0 h-px bg-foreground"
              transition={{ type: "spring", stiffness: 460, damping: 36 }}
            />
          )}
        </div>
      )}
    </nav>
  );
}

export function MobileNavigationMenu({
  pathname,
  onClose,
  onOpenLibrary,
  onToggleGuru,
  contestLive,
}: {
  pathname: string;
  onClose: () => void;
  onOpenLibrary: () => void;
  onToggleGuru?: () => void;
  contestLive?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contestRunning, setContestRunning] = useState(() =>
    typeof contestLive === "boolean"
      ? contestLive
      : pathname.startsWith("/contest/coding/session") || pathname.startsWith("/contest/mcq"),
  );

  useEffect(() => {
    setContestRunning(isContestRunning(pathname, contestLive));
  }, [pathname, contestLive]);

  useEffect(() => {
    const header = document.getElementById("header-navigation-toggle")?.closest("header");
    if (!header || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (getComputedStyle(header).display === "none") {
        onClose();
      }
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [onClose]);

  return (
    <Sheet
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        ref={contentRef}
        id="header-navigation-menu"
        aria-labelledby="header-navigation-menu-title"
        aria-describedby="header-navigation-menu-description"
        showClose={false}
        className="header-menu-sheet fixed inset-x-0 top-16 bottom-0 z-50 flex h-[calc(100dvh-4rem)] w-full flex-col justify-between overflow-y-auto border-t border-obsidian-border bg-obsidian-elevated p-4 shadow-2xl sm:left-auto sm:w-80 sm:border-l"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (
            contentRef.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]') ??
            contentRef.current?.querySelector<HTMLAnchorElement>("a")
          )?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const activeElement = document.activeElement;
          const focusAlreadyMovedOutside =
            activeElement instanceof HTMLElement &&
            activeElement !== document.body &&
            !contentRef.current?.contains(activeElement);
          if (!focusAlreadyMovedOutside) {
            document.getElementById("header-navigation-toggle")?.focus();
          }
        }}
        onInteractOutside={(event) => {
          const trigger = document.getElementById("header-navigation-toggle");
          if (event.detail.originalEvent.target instanceof Node && trigger?.contains(event.detail.originalEvent.target)) {
            event.preventDefault();
          }
        }}
      >
        <SheetTitle id="header-navigation-menu-title" className="sr-only">
          Mobile primary
        </SheetTitle>
        <SheetDescription id="header-navigation-menu-description" className="sr-only">
          Primary navigation links and actions.
        </SheetDescription>

        <nav aria-label="Mobile primary">
          <div className="space-y-4">
            {/* Primary Links */}
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, path, icon }) => {
                const active = isNavActive(pathname, path);
                const showLiveDot = path === "/contest" && contestRunning;

                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "header-mobile-link flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150 select-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      active
                        ? "bg-foreground/[0.06] text-foreground [&_svg]:text-foreground"
                        : "text-muted-foreground [&_svg]:text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground hover:[&_svg]:text-foreground",
                    )}
                  >
                    <NavIcon icon={icon} />
                    <span className="flex-1 truncate">{label}</span>
                    {showLiveDot && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="h-px bg-obsidian-border" />

            {/* Secondary actions inside mobile drawer */}
            <div className="flex flex-col gap-2">
              {onToggleGuru && (
                <Button variant="bare" size="bare"
                  type="button"
                  aria-label="Ask Guru (Guru AI Coach)"
                  onClick={() => {
                    onClose();
                    onToggleGuru();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-obsidian-border bg-foreground/[0.03] px-3 text-left text-sm font-medium text-foreground/80 [&_svg]:text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className="flex items-center gap-2">
                    <span className="relative inline-flex items-center justify-center">
                      <NavIcon icon={Sparkles} />
                    </span>
                    <span>Ask Guru</span>
                  </span>
                  <kbd className="inline-flex items-center rounded border border-obsidian-border bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                    ⌘J
                  </kbd>
                </Button>
              )}

              <Button variant="bare" size="bare"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLibrary();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-elevated px-3 text-left text-sm font-medium text-foreground/80 [&_svg]:text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 cursor-pointer"
              >
                <NavIcon icon={BookOpen} />
                <span>Browse learning library</span>
              </Button>
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
