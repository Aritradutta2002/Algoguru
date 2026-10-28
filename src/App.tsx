import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation, Link } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FoldGlyph } from "@/components/FoldGlyph";
import Auth from "./pages/Auth";
import { Sun, Moon, ZoomIn, ZoomOut, Search, X, PanelLeft, Menu } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomeSidebarContext } from "@/contexts/HomeSidebarContext";
import { UserMenu } from "@/components/UserMenu";
import { GURU_PANEL_CONSTANTS } from "@/lib/guruPanel";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { GuruLauncher } from "@/components/brand/GuruLauncher";
import { SupportModal } from "@/components/SupportModal";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  contestAppRoutes,
  contestStandaloneRoutes,
} from "@/components/contest/ContestRoutes";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { GlobalSearchLauncher } from "@/components/layout/GlobalSearchLauncher";
import { AppLoadingScreen, PageSkeleton } from "@/components/layout/RouteFallback";
import { MobileNav } from "@/components/layout/MobileNav";
import { PrimaryNavigation, MobileNavigationMenu, isNavActive } from "@/components/layout/PrimaryNavigation";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

// Route-level code splitting keeps the initial shell small. Auth stays eager:
// it is the first screen for signed-out visitors and gate for everything else.
const AppSidebar = lazy(() =>
  import("@/components/AppSidebar").then((module) => ({
    default: module.AppSidebar,
  })),
);
const Index = lazy(() => import("./pages/Index"));
const TopicPage = lazy(() => import("./pages/TopicPage"));
const Playground = lazy(() => import("./pages/Playground"));
const Practice = lazy(() => import("./pages/Practice"));
const PracticeSolution = lazy(() => import("./pages/PracticeSolution"));
const ProblemSolver = lazy(() => import("./pages/ProblemSolver"));
const Interview = lazy(() => import("./pages/Interview"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const NotesDashboard = lazy(() => import("./pages/NotesDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const BuyMeACoffee = lazy(() => import("./pages/BuyMeACoffee"));
const RoadmapFullscreenRoute = lazy(() =>
  import("./components/roadmap/RoadmapFullscreenRoute").then((module) => ({
    default: module.RoadmapFullscreenRoute,
  })),
);
const GuruBot = lazy(() =>
  import("@/components/GuruBot").then((module) => ({
    default: module.GuruBot,
  })),
);
const InterviewDataStructurePage = lazy(
  () => import("./pages/interview/InterviewDataStructurePage"),
);
const InterviewCoreJavaQuestionsPage = lazy(
  () => import("./pages/interview/InterviewCoreJavaQuestionsPage"),
);
const InterviewCoreJavaQuestionDetailPage = lazy(
  () => import("./pages/interview/InterviewCoreJavaQuestionDetailPage"),
);
const InterviewSystemDesignPage = lazy(
  () => import("./pages/interview/InterviewSystemDesignPage"),
);
const InterviewSqlStructurePage = lazy(
  () => import("./pages/interview/InterviewSqlStructurePage"),
);
const InterviewLanguageQuestionsPage = lazy(
  () => import("./pages/interview/InterviewLanguageQuestionsPage"),
);
const InterviewLanguageQuestionDetailPage = lazy(() =>
  import("./pages/interview/InterviewLanguageQuestionsPage").then((module) => ({
    default: module.InterviewLanguageQuestionDetailPage,
  })),
);
const BackendInterviewHubPage = lazy(
  () => import("./pages/interview/BackendInterviewHubPage"),
);
const BackendQuestionsPage = lazy(
  () => import("./pages/interview/BackendQuestionsPage"),
);
const BackendQuestionDetailPage = lazy(
  () => import("./pages/interview/BackendQuestionDetailPage"),
);
const BackendAnnotationsPage = lazy(
  () => import("./pages/interview/BackendAnnotationsPage"),
);
const BackendPracticePage = lazy(
  () => import("./pages/interview/BackendPracticePage"),
);
const BackendPracticeDetailPage = lazy(
  () => import("./pages/interview/BackendPracticeDetailPage"),
);

const queryClient = new QueryClient();

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

const ZOOM_MAP: Record<string, string> = { sm: "85%", md: "100%", lg: "115%", xl: "125%" };

function HeaderControls() {
  const { theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize } = useSettings();
  const isDark = theme === "dark";
  const isMin = fontSize === "sm";
  const isMax = fontSize === "xl";

  return (
    <div className="flex items-center gap-2">
      {/* Zoom cluster — desktop only */}
      <div className="header-zoom hidden md:flex items-center h-9 rounded-lg border border-border/50 bg-muted/40 p-1 gap-0.5">
        <AppTooltip content="Zoom out text">
          <button
            onClick={decreaseFontSize}
            disabled={isMin}
            aria-label="Zoom out"
            className="touch-manipulation flex items-center justify-center w-7 h-7 rounded-md transition-all disabled:opacity-25 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground active:scale-[0.92]"
          >
            <ZoomOut size={12} />
          </button>
        </AppTooltip>
        <span className="text-[10.5px] font-semibold min-w-[34px] text-center text-muted-foreground/70 font-mono tabular-nums select-none">
          {ZOOM_MAP[fontSize] || "100%"}
        </span>
        <AppTooltip content="Zoom in text">
          <button
            onClick={increaseFontSize}
            disabled={isMax}
            aria-label="Zoom in"
            className="touch-manipulation flex items-center justify-center w-7 h-7 rounded-md transition-all disabled:opacity-25 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground active:scale-[0.92]"
          >
            <ZoomIn size={12} />
          </button>
        </AppTooltip>
      </div>

      {/* Theme toggle */}
      <AppTooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="group touch-manipulation flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/40 hover:bg-muted hover:border-border/80 text-muted-foreground transition-all duration-200 active:scale-[0.93]"
        >
          {isDark ? (
            <Sun size={15} className="transition-transform duration-300 group-hover:rotate-45 text-amber-400/90 group-hover:text-amber-400" />
          ) : (
            <Moon size={15} className="transition-transform duration-300 group-hover:-rotate-12 text-slate-500 dark:text-slate-400" />
          )}
        </button>
      </AppTooltip>
    </div>
  );
}

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // The app shell scrolls a `<main>` element rather than the window, so
    // reset that container too. Without this, navigating to a new page keeps
    // the previous page's scroll offset.
    document.getElementById("main-content")?.scrollTo({ top: 0, left: 0 });
  }, [pathname, search]);

  return null;
}

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

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [guruOpen, setGuruOpen] = useState(false);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const [splitPct, setSplitPct] = useState(() => {
    try {
      const saved = localStorage.getItem("guru-split-pct");
      const parsed = saved ? parseFloat(saved) : MAIN_PANEL_DEFAULT_SIZE;
      return Number.isFinite(parsed)
        ? clamp(parsed, 100 - GURU_PANEL_MAX_SIZE, 100 - GURU_PANEL_MIN_SIZE)
        : MAIN_PANEL_DEFAULT_SIZE;
    } catch {
      return MAIN_PANEL_DEFAULT_SIZE;
    }
  });

  const [guruCollapsed, setGuruCollapsed] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const guruPanelRef = useRef<ImperativePanelHandle>(null);
  const guruPanelSizeRef = useRef(
    clamp(100 - splitPct, GURU_PANEL_MIN_SIZE, GURU_PANEL_MAX_SIZE),
  );

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

  // Detect mobile viewport (< lg breakpoint = 1024px). Declared here because
  // the desktop sidebar panel must not mount at all on phones.
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // On the home page the left sidebar panel is hidden by default (including
  // its fold/unfold handle). It only becomes visible when the user clicks the
  // "Choose where to focus next." heading, which toggles `homeSidebarOpen`.
  const [homeSidebarOpen, setHomeSidebarOpen] = useState(false);
  const isHomeRoute = location.pathname === "/";
  // The contest landing page is a focused entry surface: no sidebar panel and
  // no resize slider, while the header keeps search / account / Guru access.
  const isContestLandingRoute = location.pathname === "/contest";
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
      if (!showSidebarPanel || !event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== "b") return;
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

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileLibraryOpen(false);
  }, [location.pathname]);

  const handleContentScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const scrolled = target.scrollTop > 8;
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
    return () => {
      if (scrollProgressFrame.current !== null) {
        cancelAnimationFrame(scrollProgressFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("guru-split-pct", splitPct.toString());
  }, [splitPct]);
  useEffect(() => {
    contentScrollRef.current?.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  // Derived: how wide is the Guru panel?
  const guruPct = 100 - splitPct;
  // When Guru panel narrower than ~30%, truncate labels inside it
  const isNarrow = guruPct < 30;
  // When Guru panel narrower than ~22%, hide non-essential UI entirely
  const isTiny = guruPct < 22;
  const isPlaygroundRoute = location.pathname === "/playground";
  const isProblemSolverRoute = location.pathname === "/problem-solver";
  // Roadmap pages need to fill the viewport so the React Flow canvas has
  // a real height. Without this, `min-h-full` collapses to 0 and the
  // graph is invisible.
  const isRoadmapRoute =
    location.pathname === "/roadmap" ||
    location.pathname.startsWith("/roadmap/");
  const isContestStageRoute = location.pathname.startsWith("/contest/");
  const isImmersiveRoute =
    isPlaygroundRoute ||
    isProblemSolverRoute ||
    isRoadmapRoute ||
    isContestStageRoute;
  const showMobileNav = isMobile && !guruOpen && !isImmersiveRoute;
  const mobileMoreActive =
    !isImmersiveRoute &&
    !["/", "/practice", "/playground", "/interview"].some((path) =>
      isNavActive(location.pathname, path),
    );

  const contentBottomPaddingClass =
    location.pathname === "/" || isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
      ? "pb-0"
      : "pb-10";
  const contentSurfaceClass = isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
    ? "h-full min-h-0 pb-0"
    : `min-h-full ${contentBottomPaddingClass}`;

  const pageContent = (
    <>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      {location.pathname === "/" && (
        <Footer onSupportClick={() => setSupportOpen(true)} />
      )}
      {showMobileNav && <div aria-hidden="true" className="h-24 lg:hidden" />}
    </>
  );

  const expandGuruPanel = (targetSize?: number) => {
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
  };

  const toggleGuruPanel = () => {
    setGuruOpen((isOpen) => {
      const nextOpen = !isOpen;
      if (nextOpen && !isMobile) {
        requestAnimationFrame(() => {
          expandGuruPanel();
        });
      }
      return nextOpen;
    });
  };

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
  }, [isProblemSolverRoute, isMobile, guruOpen]);

  return (
    <SidebarProvider defaultWidth={340} widthStorageKey="algoguru-sidebar-width">
      <HomeSidebarContext.Provider value={homeSidebarValue}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div
        className="flex h-[100dvh] w-full overflow-hidden"
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
              !isResizingSidebar && "transition-[flex-grow] duration-300 ease-in-out"
            )}
            style={{ maxWidth: 360 }}
          >
            {/* Sidebar content — fades on collapse */}
            <div
              className={cn(
                "h-full w-full overflow-hidden transition-opacity duration-250 ease-out",
                isSidebarCollapsed ? "invisible opacity-0 pointer-events-none" : "opacity-100"
              )}
              aria-hidden={isSidebarCollapsed}
            >
              <Suspense fallback={<SidebarSkeleton />}>
                <AppSidebar onCollapse={foldSidebar} />
              </Suspense>
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
                  : "w-[1px] bg-border/50 group-hover:w-[2px] group-hover:bg-primary/40"
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
          <header
            data-scrolled={headerScrolled ? "true" : undefined}
            data-route={location.pathname === "/" ? "home" : undefined}
            className="app-header sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 px-4 sm:gap-4 sm:px-5 lg:px-6"
          >
            {/* ── Left: menu + sidebar toggle + logo ───────────── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mr-auto">
              <button
                onClick={() => setMobileMenuOpen((open) => !open)}
                id="header-navigation-toggle"
                aria-label="Toggle navigation menu"
                aria-controls={mobileMenuOpen ? "header-navigation-menu" : undefined}
                aria-expanded={mobileMenuOpen}
                className="header-menu-btn touch-manipulation items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.93] transition-all duration-150"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
              <AnimatePresence initial={false}>
                {showSidebarPanel && isSidebarCollapsed && (
                  <motion.div
                    key="unfold-beside-logo"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center overflow-hidden flex-shrink-0"
                  >
                    <button
                      onClick={unfoldSidebar}
                      aria-label="Expand sidebar"
                      aria-keyshortcuts="Alt+B"
                      className={cn(
                        "group relative touch-manipulation w-9 h-9 rounded-lg flex-shrink-0",
                        "flex items-center justify-center",
                        "bg-muted/50 border border-border/60",
                        "hover:bg-primary/[0.08] hover:border-primary/35 hover:text-primary",
                        "active:scale-[0.93] transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                      )}
                    >
                      <PanelLeft
                        size={14}
                        className="absolute text-muted-foreground/70 transition-all duration-200 group-hover:opacity-0 group-hover:scale-50"
                      />
                      <FoldGlyph
                        direction="unfold"
                        size={15}
                        strokeWidth={2.5}
                        className="absolute text-primary opacity-0 scale-50 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
                      />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logo lockup */}
              <AppTooltip content="Go to home">
                <Link
                  to="/"
                  aria-label="AlgoGuru Home"
                  className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 -ml-1 transition-all duration-200 hover:bg-muted/40 active:scale-[0.97] flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md shadow-primary/25 ring-1 ring-inset ring-white/20 transition-[transform,box-shadow] duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/40"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--info)) 100%)" }}
                  >
                    <AlgoGuruLogo size={21} showText={false} className="text-white" />
                  </div>
                  <span className="hidden sm:inline font-display text-[15px] font-bold tracking-tight text-foreground">
                    Algo<span className="text-primary">Guru</span>
                  </span>
                </Link>
              </AppTooltip>
            </div>

            {/* ── Center: primary navigation ───────────────────── */}
            <PrimaryNavigation pathname={location.pathname} />

            {/* ── Right: search + controls + user + Guru AI ────── */}
            <div className="header-actions flex shrink-0 items-center gap-1.5 sm:gap-2 ml-auto">

              {/* Mobile search icon */}
              <AppTooltip content="Search (Ctrl+K)">
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-search-trigger="true"]')?.click()}
                  className="header-search-compact sm:hidden touch-manipulation flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/40 hover:bg-muted hover:border-border/80 text-muted-foreground hover:text-primary transition-all duration-150 active:scale-[0.93]"
                  aria-label="Search"
                >
                  <Search size={15} />
                </button>
              </AppTooltip>

              {/* Desktop search */}
              <div className="header-search-full hidden sm:block">
                <GlobalSearchLauncher />
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-5 w-px bg-border/60 rounded-full mx-1.5" />

              {/* Theme / zoom controls */}
              <HeaderControls />

              {/* Divider */}
              <div className="hidden sm:block h-5 w-px bg-border/60 rounded-full mx-1.5" />

              {/* User avatar menu */}
              <UserMenu />

              {/* Guru AI button */}
              {isProblemSolverRoute ? (
                <span
                  title="Guru AI is in the description panel — open the Guru AI tab."
                  className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:ml-4"
                >
                  <GuruAvatar size={32} ring status="ready" title={null} />
                  <span className="sr-only">Guru AI is available in the description panel</span>
                </span>
              ) : (
                <AppTooltip content={guruOpen ? "Close Guru AI (Ctrl/⌘ J)" : "Open Guru AI (Ctrl/⌘ J)"}>
                  <GuruLauncher
                    open={guruOpen}
                    onClick={toggleGuruPanel}
                    className="ml-2 sm:ml-4"
                  />
                </AppTooltip>
              )}
            </div>

            {/* ── Mobile navigation sheet ──────────────────────── */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <MobileNavigationMenu
                  pathname={location.pathname}
                  onClose={closeMobileMenu}
                  onOpenLibrary={() => setMobileLibraryOpen(true)}
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
                className="route-progress h-full w-full bg-gradient-to-r from-primary via-sky-400 to-accent"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </header>

          {guruOpen ? (
            isMobile ? (
              /* ── Mobile: Full-screen overlay ── */
              <>
                {/* Main content hidden on mobile when GuruBot is open */}
                <main id="main-content" tabIndex={-1} ref={contentScrollRef} className="hidden">
                  <div className={contentSurfaceClass}>{pageContent}</div>
                </main>
                {/* GuruBot full-screen overlay */}
                <Suspense fallback={<AppLoadingScreen label="Opening Guru AI" />}>
                  <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />
                </Suspense>
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

                <ResizableHandle
                  withHandle
                  className="w-[3px] bg-border/20"
                />

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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGuruOpen(false);
                          }}
                          aria-label="Close Guru"
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </AppTooltip>
                  ) : (
                    <div className="h-full min-w-0 overflow-hidden flex flex-col border-l border-border bg-background">
                      <Suspense
                        fallback={
                          <div className="flex h-full flex-col items-center justify-center gap-4 bg-card">
                            <GuruAvatar size={52} ring mood="thinking" glow title={null} />
                            <div className="skeleton-shimmer h-1 w-24 rounded-full" />
                            <span className="sr-only">Loading Guru AI</span>
                          </div>
                        }
                      >
                        <GuruBot
                          open={guruOpen}
                          onClose={() => setGuruOpen(false)}
                          embedded
                          showGuruTitle
                          onToggleFullscreen={() => {
                            const cur = guruPanelSizeRef.current;
                            if (cur >= GURU_PANEL_MAX_SIZE - 1) expandGuruPanel(GURU_PANEL_DEFAULT_SIZE);
                            else expandGuruPanel(GURU_PANEL_MAX_SIZE);
                          }}
                          isFullscreen={guruPanelSizeRef.current >= GURU_PANEL_MAX_SIZE - 1}
                        />
                      </Suspense>
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
            <Suspense fallback={<SidebarSkeleton />}>
              <AppSidebar onCollapse={() => setMobileLibraryOpen(false)} />
            </Suspense>
          </SheetContent>
        </Sheet>
      </div>
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      </HomeSidebarContext.Provider>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <MotionConfig reducedMotion="user">
        <ModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTopOnRouteChange />
            <AuthProvider>
              <Suspense fallback={<AppLoadingScreen />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Contest exam screens are chrome-free, like the old /quiz. */}
                {contestStandaloneRoutes()}
                {/* Chrome-free fullscreen roadmap routes — no AppLayout, no
                    sidebar, no header, no footer. Just the roadmaps. */}
                <Route path="/roadmap" element={
                  <ProtectedRoute><RoadmapFullscreenRoute /></ProtectedRoute>
                } />
                <Route path="/roadmap/:roadmapId" element={
                  <ProtectedRoute><RoadmapFullscreenRoute /></ProtectedRoute>
                } />
                <Route path="/java-roadmap" element={<Navigate to="/roadmap/java" replace />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/buy-me-a-coffee" element={<BuyMeACoffee />} />
                        <Route path="/support" element={<BuyMeACoffee />} />
                        <Route path="/playground" element={<Playground />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/problem-solver" element={<ProblemSolver />} />
                        {/* Contest landing / instructions / result. Declared
                            above the `/:topicId` catch-all below, which would
                            otherwise match `/contest`. */}
                        {contestAppRoutes()}
                        <Route path="/interview" element={<Interview />} />
                        <Route path="/interview/:language" element={<Interview />} />
                        <Route path="/interview/:language/data-structure" element={<InterviewDataStructurePage />} />
                        <Route path="/interview/:language/language-questions" element={<InterviewLanguageQuestionsPage />} />
                        <Route path="/interview/:language/language-questions/:questionSlug" element={<InterviewLanguageQuestionDetailPage />} />
                        <Route path="/interview/:language/core-java-qa" element={<InterviewCoreJavaQuestionsPage />} />
                        <Route path="/interview/:language/core-java-qa/:questionSlug" element={<InterviewCoreJavaQuestionDetailPage />} />
                        <Route path="/interview/:language/spring-boot" element={<BackendInterviewHubPage />} />
                        <Route path="/interview/:language/spring-boot/questions" element={<BackendQuestionsPage />} />
                        <Route path="/interview/:language/spring-boot/questions/:questionSlug" element={<BackendQuestionDetailPage />} />
                        <Route path="/interview/:language/spring-boot/annotations" element={<BackendAnnotationsPage />} />
                        <Route path="/interview/:language/spring-boot/practice" element={<BackendPracticePage />} />
                        <Route path="/interview/:language/spring-boot/practice/:problemId" element={<BackendPracticeDetailPage />} />
                        <Route path="/interview/:language/system-design" element={<InterviewSystemDesignPage />} />
                        <Route path="/interview/:language/sql-structure" element={<InterviewSqlStructurePage />} />
                        <Route path="/practice/solution/:problemId" element={<PracticeSolution />} />
                        <Route path="/practice/solution/:problemId/:problemSlug" element={<PracticeSolution />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/notes" element={<NotesDashboard />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/:topicId" element={<TopicPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                } />
              </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ModeProvider>
        </MotionConfig>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
