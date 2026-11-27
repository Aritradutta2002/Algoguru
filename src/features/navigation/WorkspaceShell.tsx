"use client";
import { Button } from "@/components/ui/button";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { X, PanelLeft, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { AppTooltip } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { NavIcon } from "@/components/layout/NavIcon";
import { HomeSidebarContext } from "@/contexts/HomeSidebarContext";
import { UserMenu } from "@/components/UserMenu";
import { GURU_PANEL_CONSTANTS } from "@/lib/guruPanel";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { SurfaceLockup } from "@/components/brand/SurfaceLockup";
import { SupportModal } from "@/components/SupportModal";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSettings } from "@/contexts/SettingsContext";
import { GlobalSearchLauncher } from "@/components/layout/GlobalSearchLauncher";
import { PageSkeleton } from "@/components/layout/RouteFallback";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  HOME_SECTION_LINKS,
  PrimaryNavigation,
  MobileNavigationMenu,
  isNavActive,
} from "@/components/layout/PrimaryNavigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AiCommandLauncher } from "@/components/layout/AiCommandLauncher";
import { SpotlightNavbar } from "@/components/layout/SpotlightNavbar";
import { cn } from "@/lib/utils";

function SidebarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-5 border-r border-border/70 bg-card/60 p-4">
      <div className="flex items-center gap-2.5">
        <div className="skeleton-shimmer h-8 w-8 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton-shimmer h-2.5 w-20 rounded-full" />
          <div className="skeleton-shimmer h-2 w-14 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="skeleton-shimmer h-8 rounded-lg"
            style={{ opacity: 1 - index * 0.08 }}
          />
        ))}
      </div>
      <div className="mt-auto space-y-2">
        <div className="skeleton-shimmer h-9 rounded-lg" />
        <div className="skeleton-shimmer h-9 rounded-lg" />
      </div>
      <span className="sr-only">Loading navigation</span>
    </div>
  );
}

function GuruPanelFallback() {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-4 bg-card p-6">
      <GuruAvatar size={52} ring mood="thinking" glow title={null} />
      <BrandLoader size="sm" label="Opening Guru AI" />
      <span className="sr-only">Loading Guru AI</span>
    </div>
  );
}

const AppSidebar = dynamic(
  () => import("@/components/AppSidebar").then((module) => module.AppSidebar),
  { loading: () => <SidebarSkeleton /> },
);

const GuruBot = dynamic(
  () => import("@/components/GuruBot").then((module) => module.GuruBot),
  { ssr: false, loading: () => <GuruPanelFallback /> },
);

// Standard Guru panel size limits — single source of truth from GuruBot.tsx.
//   • MIN (18%) keeps the panel wide enough to render chat and code comfortably.
//   • DEFAULT (28%) provides an ergonomic starting width.
//   • MAX (38%) standard level so main content / code always keeps at least 62%
//     and never feels crushed when expanding the slider.
const GURU_PANEL_DEFAULT_SIZE = GURU_PANEL_CONSTANTS.DEFAULT_SIZE;
const GURU_PANEL_MIN_SIZE = GURU_PANEL_CONSTANTS.MIN_SIZE;
const GURU_PANEL_MAX_SIZE = GURU_PANEL_CONSTANTS.MAX_SIZE;
const GURU_PANEL_COLLAPSED_SIZE = GURU_PANEL_CONSTANTS.COLLAPSED_SIZE;
const GURU_PANEL_EXPAND_TRIGGER_SIZE = GURU_PANEL_CONSTANTS.EXPAND_TRIGGER_SIZE;

const MAIN_PANEL_DEFAULT_SIZE = 100 - GURU_PANEL_DEFAULT_SIZE;
const MAIN_PANEL_MIN_SIZE = 100 - GURU_PANEL_MAX_SIZE;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function ScrollToTopOnRouteChange({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLElement | null>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";

  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current?.scrollTo(0, 0);
    // The app shell scrolls a `<main>` element rather than the window, so
    // reset that container too. Without this, navigating to a new page keeps
    // the previous page's scroll offset.
    document.getElementById("main-content")?.scrollTo({ top: 0, left: 0 });
  }, [pathname, searchKey, scrollRef]);

  return null;
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [guruOpen, setGuruOpen] = useState(false);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  // Deterministic initial state for SSR hydration; saved preference hydrates on mount.
  const [splitPct, setSplitPct] = useState(MAIN_PANEL_DEFAULT_SIZE);
  const hydratedSplitRef = useRef(false);

  const [guruCollapsed, setGuruCollapsed] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const guruPanelRef = useRef<ImperativePanelHandle>(null);
  const guruPanelSizeRef = useRef(
    clamp(100 - MAIN_PANEL_DEFAULT_SIZE, GURU_PANEL_MIN_SIZE, GURU_PANEL_MAX_SIZE),
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("guru-split-pct");
      if (saved) {
        const parsed = parseFloat(saved);
        if (Number.isFinite(parsed)) {
          const clamped = clamp(
            parsed,
            100 - GURU_PANEL_MAX_SIZE,
            100 - GURU_PANEL_MIN_SIZE,
          );
          setSplitPct(clamped);
          guruPanelSizeRef.current = clamp(
            100 - clamped,
            GURU_PANEL_MIN_SIZE,
            GURU_PANEL_MAX_SIZE,
          );
        }
      }
    } catch {
      // Ignore storage read failures.
    } finally {
      hydratedSplitRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydratedSplitRef.current) return;
    try {
      localStorage.setItem("guru-split-pct", splitPct.toString());
    } catch {
      // Ignore storage write failures.
    }
  }, [splitPct]);

  // ── Sidebar collapse (react-resizable-panels) ──────────────
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Remember the last user-set size so expand() restores to the right width
  // (the default 20% if the user never dragged, otherwise their last drag size).
  const sidebarSizeRef = useRef(20);
  // While the user drags the resize handle we must NOT transition `flex-grow`,
  // otherwise the panel lags behind the cursor. The transition is only enabled
  // for programmatic fold/unfold so those animate smoothly.
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Detect mobile viewport (< lg breakpoint = 1024px) for sidebar/dock,
  // and narrow phone viewport (< md breakpoint = 768px) for top header controls.
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isSmallScreen = useMediaQuery("(max-width: 767px)");
  const { theme, toggleTheme } = useSettings();

  // On the home page the left sidebar panel is hidden by default (including
  // its fold/unfold handle). It only becomes visible when the user clicks the
  // "Choose where to focus next." heading, which toggles `homeSidebarOpen`.
  const [homeSidebarOpen, setHomeSidebarOpen] = useState(false);
  const isHomeRoute = pathname === "/";
  // The contest landing page is a focused entry surface: no sidebar panel and
  // no resize slider, while the header keeps search / account / Guru access.
  const isContestLandingRoute = pathname === "/contest";
  // Sidebar panel should only mount on routes that want it: non-home,
  // non-contest-landing, or when the home visitor explicitly opens it via
  // the heading.
  const showSidebarPanel =
    !isMobile && ((!isHomeRoute && !isContestLandingRoute) || homeSidebarOpen);
  useEffect(() => {
    // The panel unmounts on the home route; reset its state before it remounts.
    if (!showSidebarPanel) setIsSidebarCollapsed(false);
  }, [showSidebarPanel]);
  const toggleHomeSidebar = useCallback(() => {
    setHomeSidebarOpen((open) => {
      const next = !open;
      if (!next) {
        // Reset fold state so a re-opened panel starts unfolded.
        setIsSidebarCollapsed(false);
      }
      return next;
    });
  }, []);
  const homeSidebarValue = useMemo(
    () => ({ homeSidebarOpen, toggleHomeSidebar }),
    [homeSidebarOpen, toggleHomeSidebar],
  );

  const foldSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
    sidebarRef.current?.collapse();
  }, []);

  const unfoldSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
    // Restore to the remembered size (avoids snapping to an unexpected width)
    const restoreSize = sidebarSizeRef.current ?? 20;
    sidebarRef.current?.resize(restoreSize);
  }, []);

  useEffect(() => {
    const handleSidebarShortcut = (event: KeyboardEvent) => {
      if (
        !showSidebarPanel ||
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.key.toLowerCase() !== "b"
      )
        return;
      event.preventDefault();
      if (isSidebarCollapsed) unfoldSidebar();
      else foldSidebar();
    };
    window.addEventListener("keydown", handleSidebarShortcut);
    return () => window.removeEventListener("keydown", handleSidebarShortcut);
  }, [showSidebarPanel, isSidebarCollapsed, foldSidebar, unfoldSidebar]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const scrollProgressRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressFrame = useRef<number | null>(null);

  const headerContainerRef = useRef<HTMLDivElement>(null);
  const [headerWidth, setHeaderWidth] = useState<number>(0);

  useEffect(() => {
    const el = headerContainerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setHeaderWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isHeaderNarrow =
    isSmallScreen || (headerWidth > 0 && headerWidth < (isHomeRoute ? 850 : 680));
  const isHeaderCompact = isSmallScreen || (headerWidth > 0 && headerWidth < 980);
  const isHeaderWide = !isSmallScreen && headerWidth >= 1280;

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileLibraryOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHeaderNarrow && !isMobile) closeMobileMenu();
  }, [closeMobileMenu, isHeaderNarrow, isMobile]);

  const handleContentScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const scrolled = target.scrollTop > 8 || window.scrollY > 8;
    setHeaderScrolled((prev) => (prev === scrolled ? prev : scrolled));

    if (scrollProgressFrame.current !== null) {
      cancelAnimationFrame(scrollProgressFrame.current);
    }
    scrollProgressFrame.current = requestAnimationFrame(() => {
      const maxScroll = target.scrollHeight - target.clientHeight;
      const progress = maxScroll > 0 ? Math.min(1, target.scrollTop / maxScroll) : 0;
      if (scrollProgressRef.current) {
        scrollProgressRef.current.style.transform = `scaleX(${progress})`;
      }
    });
  }, []);

  useEffect(() => {
    const mainEl = contentScrollRef.current;
    const onScroll = () => {
      const scrolled = window.scrollY > 8 || (mainEl ? mainEl.scrollTop > 8 : false);
      setHeaderScrolled((prev) => (prev === scrolled ? prev : scrolled));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    mainEl?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mainEl?.removeEventListener("scroll", onScroll);
    };
  }, [guruOpen]);

  useEffect(() => {
    return () => {
      if (scrollProgressFrame.current !== null) {
        cancelAnimationFrame(scrollProgressFrame.current);
      }
    };
  }, []);

  // Derived: how wide is the Guru panel?
  const guruPct = 100 - splitPct;
  // When Guru panel narrower than ~30%, truncate labels inside it
  const _isNarrow = guruPct < 30;
  // When Guru panel narrower than ~22%, hide non-essential UI entirely
  const _isTiny = guruPct < 22;
  const isPlaygroundRoute = pathname === "/playground";
  const isProblemSolverRoute = pathname === "/problem-solver";
  // Roadmap pages need to fill the viewport so the React Flow canvas has
  // a real height. Without this, `min-h-full` collapses to 0 and the
  // graph is invisible.
  const isRoadmapRoute = pathname === "/roadmap" || pathname.startsWith("/roadmap/");
  const isContestStageRoute = pathname.startsWith("/contest/");
  const isImmersiveRoute =
    isPlaygroundRoute ||
    isProblemSolverRoute ||
    isRoadmapRoute ||
    isContestStageRoute;
  const showMobileNav = isMobile && !guruOpen && !isImmersiveRoute;
  const mobileMoreActive =
    !isImmersiveRoute &&
    !["/", "/practice", "/playground", "/interview"].some((path) =>
      isNavActive(pathname, path),
    );

  const contentBottomPaddingClass =
    pathname === "/" || isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
      ? "pb-0"
      : "pb-10";
  const contentSurfaceClass =
    isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
      ? "h-full min-h-0 pb-0"
      : `min-h-full ${contentBottomPaddingClass}`;

  const pageContent = (
    <>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      {pathname === "/" && <Footer onSupportClick={() => setSupportOpen(true)} />}
      {showMobileNav && <div aria-hidden="true" className="h-24 lg:hidden" />}
    </>
  );

  const expandGuruPanel = useCallback((targetSize?: number) => {
    const expandedSize = clamp(
      targetSize ?? GURU_PANEL_DEFAULT_SIZE,
      GURU_PANEL_MIN_SIZE,
      GURU_PANEL_MAX_SIZE,
    );
    const nextSize =
      expandedSize > GURU_PANEL_EXPAND_TRIGGER_SIZE
        ? expandedSize
        : GURU_PANEL_DEFAULT_SIZE;
    guruPanelSizeRef.current = nextSize;
    setGuruCollapsed(false);
    requestAnimationFrame(() => {
      guruPanelRef.current?.resize(nextSize);
    });
  }, []);

  const toggleGuruPanel = useCallback(() => {
    setGuruOpen((isOpen) => {
      const nextOpen = !isOpen;
      if (nextOpen && !isMobile) {
        requestAnimationFrame(() => {
          expandGuruPanel();
        });
      }
      return nextOpen;
    });
  }, [expandGuruPanel, isMobile]);

  // ⌘/Ctrl+J toggles Guru, matching the tooltip. Ignored while typing or on
  // routes that expose Guru through their own surface (ProblemSolver tab).
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tag = element.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        element.isContentEditable
      );
    };

    const handleGuruShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "j") return;
      if (isProblemSolverRoute || isTypingTarget(event.target)) return;
      event.preventDefault();
      toggleGuruPanel();
    };

    window.addEventListener("keydown", handleGuruShortcut);
    return () => window.removeEventListener("keydown", handleGuruShortcut);
  }, [isProblemSolverRoute, toggleGuruPanel]);

  return (
    <ProtectedRoute>
      <SidebarProvider defaultWidth={340} widthStorageKey="algoguru-sidebar-width">
        <HomeSidebarContext.Provider value={homeSidebarValue}>
          <Suspense fallback={null}>
            <ScrollToTopOnRouteChange scrollRef={contentScrollRef} />
          </Suspense>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div
            className="fixed inset-0 flex h-[100dvh] w-full overflow-clip"
            style={{ background: "hsl(var(--background))" }}
          >
            {/* ── Sidebar + Content split ── */}
            <PanelGroup direction="horizontal" className="h-full w-full">
              {/* Sidebar panel — hidden entirely on the home page until the
                  visitor clicks "Choose where to focus next.", and on the contest
                  landing page so it reads as a focused surface. */}
              {showSidebarPanel && (
                <Panel
                  id="app-sidebar-panel"
                  order={1}
                  ref={sidebarRef}
                  defaultSize={20}
                  minSize={14}
                  maxSize={28}
                  collapsible={true}
                  collapsedSize={0}
                  onCollapse={() => setIsSidebarCollapsed(true)}
                  onExpand={() => setIsSidebarCollapsed(false)}
                  onResize={(size) => {
                    if (size > 0) sidebarSizeRef.current = size;
                  }}
                  className={cn(
                    "relative flex flex-col h-full overflow-visible",
                    !isResizingSidebar && "transition-[flex-grow] duration-300 ease-in-out",
                  )}
                  style={{ maxWidth: 360 }}
                >
                  {/* Sidebar content — fades on collapse */}
                  <div
                    className={cn(
                      "h-full w-full overflow-hidden transition-opacity duration-250 ease-out",
                      isSidebarCollapsed
                        ? "invisible opacity-0 pointer-events-none"
                        : "opacity-100",
                    )}
                    aria-hidden={isSidebarCollapsed}
                  >
                    <AppSidebar onCollapse={foldSidebar} />
                  </div>
                </Panel>
              )}

              {/* Drag zone for resizing the sidebar. */}
              {showSidebarPanel && (
                <PanelResizeHandle
                  onDragging={setIsResizingSidebar}
                  className="group relative flex-shrink-0 w-[16px] cursor-col-resize select-none"
                  style={{ touchAction: "none" }}
                >
                  {/* Visual rail — faint at rest, bright on hover/drag */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-150",
                      isResizingSidebar
                        ? "w-[2px] bg-primary/70 shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                        : "w-[1px] bg-border/50 group-hover:w-[2px] group-hover:bg-primary/40",
                    )}
                  />
                </PanelResizeHandle>
              )}

              <Panel
                id="app-main-panel"
                order={2}
                defaultSize={showSidebarPanel ? 80 : 100}
                minSize={50}
                className="flex flex-col min-h-0"
              >
                <SpotlightNavbar
                  data-narrow={isHeaderNarrow ? "true" : undefined}
                  data-scrolled={headerScrolled ? "true" : undefined}
                  data-route={pathname === "/" ? "home" : undefined}
                  className="ag-theme ag-header app-header sticky top-0 z-50 h-16 shrink-0"
                >
                  <div
                    ref={headerContainerRef}
                      className="ag-header__inner mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-2 sm:gap-3"
                  >
                    {/* ── 1. Brand Block ───── */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <AnimatePresence initial={false}>
                        {showSidebarPanel && isSidebarCollapsed && (
                          <motion.div
                            key="unfold-beside-logo"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex items-center overflow-hidden flex-shrink-0"
                          >
                            <AppTooltip content="Expand sidebar (Alt+B)">
                              <Button
                                variant="bare"
                                size="bare"
                                type="button"
                                onClick={unfoldSidebar}
                                aria-label="Expand sidebar"
                                aria-keyshortcuts="Alt+B"
                                className="group relative touch-manipulation inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-muted-foreground [&_svg]:text-muted-foreground transition-colors duration-150 hover:border-obsidian-border hover:bg-foreground/[0.05] hover:text-foreground hover:[&_svg]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                              >
                                <NavIcon icon={PanelLeft} />
                              </Button>
                            </AppTooltip>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Link href="/" aria-label="AlgoGuru home" className="ag-header__mark">
                        <SurfaceLockup />
                      </Link>
                    </div>

                    {/* ── 2. Primary Navigation (Dynamic responsive with More dropdown) ───── */}
                    {isHomeRoute ? (
                      <nav aria-label="Home navigation" className="ag-header__home-links">
                        {HOME_SECTION_LINKS.map(({ label, path }) => (
                          <a key={path} href={path}>{label}</a>
                        ))}
                        <Link href="/interview">Interview hub</Link>
                      </nav>
                    ) : (
                      <div className="ag-header__workspace-nav flex h-full items-center justify-center min-w-0 flex-1 px-1 sm:px-2">
                        <PrimaryNavigation pathname={pathname} />
                      </div>
                    )}

                    {/* ── 3. Right Side Controls ───── */}
                    <div className="header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
                      <GlobalSearchLauncher compact={isHeaderCompact || !isHeaderWide} />

                      <AiCommandLauncher
                        open={guruOpen}
                        embedded={isProblemSolverRoute}
                        compact={isHeaderCompact}
                        onClick={toggleGuruPanel}
                        className="max-[359px]:hidden"
                      />

                      <div className="ag-header__wide-tools flex items-center gap-1.5 sm:gap-2">
                        <ThemeToggle />
                        <span aria-hidden="true" className="mx-0.5 hidden h-4 w-px bg-obsidian-border sm:block" />
                      </div>
                      <UserMenu onOpenLibrary={() => setMobileLibraryOpen(true)} />

                      {/* ── 4. Mobile / Compact Menu Toggle (When header is narrow or mobile) ───── */}
                        <AppTooltip content={mobileMenuOpen ? "Close menu" : "Open menu"}>
                          <Button
                            variant="bare"
                            size="bare"
                            type="button"
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            id="header-navigation-toggle"
                            aria-label="Toggle navigation menu"
                            aria-controls={mobileMenuOpen ? "header-navigation-menu" : undefined}
                            aria-expanded={mobileMenuOpen}
                            className="ag-header__menu-toggle header-menu-btn touch-manipulation inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-muted-foreground [&_svg]:text-muted-foreground transition-colors duration-150 hover:border-obsidian-border hover:bg-foreground/[0.05] hover:text-foreground hover:[&_svg]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          >
                            <NavIcon icon={mobileMenuOpen ? X : Menu} />
                          </Button>
                        </AppTooltip>
                    </div>
                  </div>

                  {/* ── Mobile Full-Height Drawer (< 1024px) ──────────────────────── */}
                  <AnimatePresence>
                    {mobileMenuOpen && (
                      <MobileNavigationMenu
                        pathname={pathname}
                        onClose={closeMobileMenu}
                        onOpenLibrary={() => setMobileLibraryOpen(true)}
                        onToggleGuru={toggleGuruPanel}
                        onToggleTheme={toggleTheme}
                        isDark={theme === "dark"}
                      />
                    )}
                  </AnimatePresence>

                  {/* Reading progress — transform-only, updated outside React. */}
                  <div
                    aria-hidden="true"
                    className="route-progress-track pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
                  >
                    <div
                      ref={scrollProgressRef}
                      className="ag-header__progress route-progress h-full w-full"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                </SpotlightNavbar>

                {guruOpen ? (
                  isMobile ? (
                    /* ── Mobile: Full-screen overlay ── */
                    <>
                      {/* Main content hidden on mobile when GuruBot is open */}
                      <main id="main-content" tabIndex={-1} ref={contentScrollRef} className="hidden">
                        <div className={contentSurfaceClass}>{pageContent}</div>
                      </main>
                      {/* GuruBot full-screen overlay */}
                      <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />
                    </>
                  ) : (
                    /* ── Desktop: Resizable split with collapsible Guru panel ── */
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                      autoSaveId="app-content-guru-layout"
                      onLayout={(sizes) => {
                        const nextMainSize = sizes[0] ?? MAIN_PANEL_DEFAULT_SIZE;
                        const nextGuruSize = sizes[1] ?? GURU_PANEL_DEFAULT_SIZE;

                        setSplitPct(nextMainSize);

                        if (guruCollapsed && nextGuruSize > GURU_PANEL_EXPAND_TRIGGER_SIZE) {
                          expandGuruPanel();
                          return;
                        }

                        if (nextGuruSize > GURU_PANEL_EXPAND_TRIGGER_SIZE) {
                          guruPanelSizeRef.current = clamp(
                            nextGuruSize,
                            GURU_PANEL_MIN_SIZE,
                            GURU_PANEL_MAX_SIZE,
                          );
                        }

                        const nextCollapsed = nextGuruSize <= GURU_PANEL_EXPAND_TRIGGER_SIZE;
                        if (nextCollapsed !== guruCollapsed) {
                          setGuruCollapsed(nextCollapsed);
                        }
                      }}
                    >
                      <ResizablePanel
                        id="content-main-panel"
                        order={1}
                        defaultSize={splitPct}
                        minSize={MAIN_PANEL_MIN_SIZE}
                      >
                        <main
                          id="main-content"
                          tabIndex={-1}
                          ref={contentScrollRef}
                          onScroll={handleContentScroll}
                          className="h-full overflow-y-auto"
                          style={{ overscrollBehavior: "contain" }}
                        >
                          <div className={contentSurfaceClass}>{pageContent}</div>
                        </main>
                      </ResizablePanel>

                      <ResizableHandle withHandle className="w-[3px] bg-border/20" />

                      <ResizablePanel
                        id="content-guru-panel"
                        order={2}
                        ref={guruPanelRef}
                        defaultSize={clamp(
                          100 - splitPct,
                          GURU_PANEL_MIN_SIZE,
                          GURU_PANEL_MAX_SIZE,
                        )}
                        minSize={GURU_PANEL_MIN_SIZE}
                        maxSize={GURU_PANEL_MAX_SIZE}
                        collapsible
                        collapsedSize={GURU_PANEL_COLLAPSED_SIZE}
                        onResize={(size) => {
                          if (guruCollapsed && size > GURU_PANEL_EXPAND_TRIGGER_SIZE) {
                            expandGuruPanel();
                            return;
                          }

                          if (size > GURU_PANEL_EXPAND_TRIGGER_SIZE) {
                            guruPanelSizeRef.current = clamp(
                              size,
                              GURU_PANEL_MIN_SIZE,
                              GURU_PANEL_MAX_SIZE,
                            );
                          }

                          const nextCollapsed = size <= GURU_PANEL_EXPAND_TRIGGER_SIZE;
                          if (nextCollapsed !== guruCollapsed) {
                            setGuruCollapsed(nextCollapsed);
                          }
                        }}
                        onCollapse={() => {
                          if (!guruCollapsed) {
                            setGuruCollapsed(true);
                          }
                        }}
                        onExpand={() => {
                          if (guruCollapsed) {
                            setGuruCollapsed(false);
                          }
                        }}
                      >
                        {guruCollapsed ? (
                          <AppTooltip content="Expand Guru AI" side="left">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => expandGuruPanel()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  expandGuruPanel();
                                }
                              }}
                              aria-label="Expand Guru AI"
                              className="group h-full w-full cursor-pointer select-none flex flex-col items-center justify-center gap-3 overflow-hidden border-l border-border bg-muted px-0 py-4 transition-colors hover:bg-muted/70"
                            >
                              <GuruAvatar size={20} title={null} />
                              <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-medium text-foreground">
                                Guru AI
                              </span>
                              <Button variant="bare" size="bare"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGuruOpen(false);
                                }}
                                aria-label="Close Guru"
                                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                              >
                                <X size={11} />
                              </Button>
                            </div>
                          </AppTooltip>
                        ) : (
                          <div className="h-full min-w-0 overflow-hidden flex flex-col border-l border-border bg-background">
                            <GuruBot
                              open={guruOpen}
                              onClose={() => setGuruOpen(false)}
                              embedded
                              showGuruTitle
                              onToggleFullscreen={() => {
                                const cur = guruPanelSizeRef.current;
                                if (cur >= GURU_PANEL_MAX_SIZE - 1)
                                  expandGuruPanel(GURU_PANEL_DEFAULT_SIZE);
                                else expandGuruPanel(GURU_PANEL_MAX_SIZE);
                              }}
                              isFullscreen={guruPanelSizeRef.current >= GURU_PANEL_MAX_SIZE - 1}
                            />
                          </div>
                        )}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )
                ) : (
                  <main
                    id="main-content"
                    tabIndex={-1}
                    ref={contentScrollRef}
                    onScroll={handleContentScroll}
                    className="flex-1 overflow-y-auto"
                    style={{ overscrollBehavior: "contain" }}
                  >
                    <div className={contentSurfaceClass}>{pageContent}</div>
                  </main>
                )}
              </Panel>
            </PanelGroup>

            <AnimatePresence>
              {showMobileNav && (
                <MobileNav
                  onMore={() => setMobileMenuOpen(true)}
                  moreActive={mobileMoreActive}
                  moreOpen={mobileMenuOpen}
                />
              )}
            </AnimatePresence>
            <Sheet open={mobileLibraryOpen} onOpenChange={setMobileLibraryOpen}>
              <SheetContent
                side="left"
                className="w-[88vw] max-w-sm border-r border-border p-0 [&>button]:hidden"
              >
                <SheetTitle className="sr-only">Content library</SheetTitle>
                <SheetDescription className="sr-only">
                  Browse topics, problems, and interview guides.
                </SheetDescription>
                <AppSidebar onCollapse={() => setMobileLibraryOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
        </HomeSidebarContext.Provider>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
