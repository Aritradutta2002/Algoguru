import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { AppSidebar } from "@/components/AppSidebar";
import { FoldGlyph } from "@/components/FoldGlyph";
import Index from "./pages/Index";
import TopicPage from "./pages/TopicPage";
import Playground from "./pages/Playground";
import Practice from "./pages/Practice";
import PracticeSolution from "./pages/PracticeSolution";
import ProblemSolver from "./pages/ProblemSolver";
import Interview from "./pages/Interview";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import MockInterviewPage from "./pages/interview/MockInterviewPage";
import LearnHubPage from "./pages/LearnHubPage";
import LearnTrackPage from "./pages/LearnTrackPage";
import { Sun, Moon, Search, X, Sparkles, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { GuruBot, GURU_PANEL_CONSTANTS } from "@/components/GuruBot";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { SupportModal } from "@/components/SupportModal";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  contestAppRoutes,
  contestStandaloneRoutes,
} from "@/components/contest/ContestRoutes";
import Profile from "./pages/Profile";
import NotesDashboard from "./pages/NotesDashboard";
import Admin from "./pages/Admin";
import BuyMeACoffee from "./pages/BuyMeACoffee";
import { RoadmapFullscreenRoute } from "./components/roadmap/RoadmapFullscreenRoute";
import InterviewDataStructurePage from "./pages/interview/InterviewDataStructurePage";
import InterviewCoreJavaQuestionsPage from "./pages/interview/InterviewCoreJavaQuestionsPage";
import InterviewCoreJavaQuestionDetailPage from "./pages/interview/InterviewCoreJavaQuestionDetailPage";
import InterviewSystemDesignPage from "./pages/interview/InterviewSystemDesignPage";
import InterviewSqlStructurePage from "./pages/interview/InterviewSqlStructurePage";
import InterviewLanguageQuestionsPage, { InterviewLanguageQuestionDetailPage } from "./pages/interview/InterviewLanguageQuestionsPage";
import BackendInterviewHubPage from "./pages/interview/BackendInterviewHubPage";
import BackendQuestionsPage from "./pages/interview/BackendQuestionsPage";
import BackendQuestionDetailPage from "./pages/interview/BackendQuestionDetailPage";
import BackendAnnotationsPage from "./pages/interview/BackendAnnotationsPage";
import BackendPracticePage from "./pages/interview/BackendPracticePage";
import BackendPracticeDetailPage from "./pages/interview/BackendPracticeDetailPage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { GlobalSearch } from "@/components/GlobalSearch";

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
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-1.5">
      {/* Theme toggle */}
      <AppTooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="group touch-manipulation flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-all duration-200 active:scale-[0.93]"
        >
          {isDark ? (
            <Sun size={14} className="transition-transform duration-300 group-hover:rotate-45 text-amber-400" />
          ) : (
            <Moon size={14} className="transition-transform duration-300 group-hover:-rotate-12 text-foreground" />
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
  }, [pathname, search]);

  return null;
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

  const showSidebarPanel = true;

  const foldSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
    sidebarRef.current?.collapse();
  }, []);

  const unfoldSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
    const restoreSize = sidebarSizeRef.current ?? 20;
    sidebarRef.current?.resize(restoreSize);
  }, []);

  useEffect(() => {
    const handleSidebarShortcut = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== "b") return;
      event.preventDefault();
      if (isSidebarCollapsed) unfoldSidebar();
      else foldSidebar();
    };
    window.addEventListener("keydown", handleSidebarShortcut);
    return () => window.removeEventListener("keydown", handleSidebarShortcut);
  }, [isSidebarCollapsed, foldSidebar, unfoldSidebar]);

  // Detect mobile viewport (< lg breakpoint = 1024px)
  const isMobile = useMediaQuery('(max-width: 1023px)');

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
  const contentBottomPaddingClass =
    location.pathname === "/" || isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
      ? "pb-0"
      : "pb-10";
  const contentSurfaceClass = isPlaygroundRoute || isProblemSolverRoute || isRoadmapRoute
    ? "h-full min-h-0 pb-0"
    : `min-h-full ${contentBottomPaddingClass}`;

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

  return (
    <SidebarProvider defaultWidth={340} widthStorageKey="algoguru-sidebar-width">
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
          {/* Top bar — Handcrafted engineering workspace header */}
          <header className="h-[52px] flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 flex-shrink-0 sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
            {/* ── Left: sidebar toggle + logo ──────────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              <AnimatePresence initial={false}>
                {showSidebarPanel && isSidebarCollapsed && (
                  <motion.div
                    key="unfold-beside-logo"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center overflow-hidden flex-shrink-0"
                  >
                    <button
                      onClick={unfoldSidebar}
                      aria-label="Expand sidebar (Alt+B)"
                      aria-keyshortcuts="Alt+B"
                      className="group touch-manipulation w-8 h-8 rounded-control flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.96]"
                    >
                      <PanelLeft size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logo lockup */}
              <Link
                to="/"
                aria-label="AlgoGuru Home"
                className="group flex items-center gap-2 rounded-control px-1.5 py-1 -ml-1 transition-colors hover:bg-muted/60 active:scale-[0.98] flex-shrink-0"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-control bg-primary text-primary-foreground shadow-sm">
                  <AlgoGuruLogo size={16} showText={false} className="text-primary-foreground" />
                </div>
                <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground">
                  Algo<span className="text-primary">Guru</span>
                </span>
              </Link>
            </div>

            {/* ── Center: Search ─────────────────────────────────── */}
            <div className="flex-1 max-w-md mx-auto px-2 flex justify-center">
              <GlobalSearch />
            </div>

            {/* ── Right: controls + user + Guru AI ────── */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <HeaderControls />

              <div className="h-4 w-px bg-border mx-0.5" />

              <UserMenu />

              {/* Guru AI button */}
              {isProblemSolverRoute ? (
                <AppTooltip content="Guru AI is active in the description panel.">
                  <div className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-control border border-primary/20 bg-primary/10 text-primary select-none">
                    <Sparkles size={13} />
                    <span>Guru</span>
                  </div>
                </AppTooltip>
              ) : (
                <AppTooltip content={guruOpen ? "Close Guru AI" : "Open Guru AI"}>
                  <button
                    onClick={toggleGuruPanel}
                    aria-label={guruOpen ? "Close Guru AI" : "Open Guru AI"}
                    className={cn(
                      "touch-manipulation flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-control text-xs font-medium transition-colors select-none active:scale-[0.96]",
                      guruOpen
                        ? "bg-primary text-primary-foreground shadow-elev-1"
                        : "border border-border bg-card text-foreground hover:bg-muted hover:border-line-strong"
                    )}
                  >
                    <Sparkles
                      size={13}
                      className={cn(
                        "transition-transform duration-200",
                        guruOpen ? "text-primary-foreground" : "text-primary"
                      )}
                    />
                    <span className="hidden sm:inline">Guru</span>
                  </button>
                </AppTooltip>
              )}
            </div>
          </header>

          {guruOpen ? (
            isMobile ? (
              /* ── Mobile: Full-screen overlay ── */
              <>
                {/* Main content hidden on mobile when GuruBot is open */}
                <main ref={contentScrollRef} className="hidden">
                  <div className={contentSurfaceClass}>
                    {children}
                    {location.pathname === "/" && (
                      <Footer onSupportClick={() => setSupportOpen(true)} />
                    )}
                  </div>
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
                    ref={contentScrollRef}
                    className="h-full overflow-y-auto"
                    style={{ overscrollBehavior: "contain" }}
                  >
                    <div className={contentSurfaceClass}>
                      {children}
                      {location.pathname === "/" && (
                        <Footer onSupportClick={() => setSupportOpen(true)} />
                      )}
                    </div>
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
                        <Sparkles size={16} className="text-primary" />
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
                    </div>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            )
          ) : (
            <main ref={contentScrollRef} className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
              <div className={contentSurfaceClass}>
                {children}
                {location.pathname === "/" && (
                  <Footer onSupportClick={() => setSupportOpen(true)} />
                )}
              </div>
            </main>
          )}
          </Panel>
        </PanelGroup>
      </div>
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <ModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTopOnRouteChange />
            <AuthProvider>
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
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/learn" element={<LearnHubPage />} />
                        <Route path="/learn/:track" element={<LearnTrackPage />} />
                        <Route path="/learn/:track/:topic" element={<LearnTrackPage />} />
                        <Route path="/buy-me-a-coffee" element={<BuyMeACoffee />} />
                        <Route path="/support" element={<BuyMeACoffee />} />
                        <Route path="/playground" element={<Playground />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/problem-solver" element={<ProblemSolver />} />
                        {/* Contest landing / instructions / result. Declared
                            above the `/:topicId` catch-all below, which would
                            otherwise match `/contest`. */}
                        {contestAppRoutes()}
                        <Route path="/interview/mock" element={<MockInterviewPage />} />
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
            </AuthProvider>
          </BrowserRouter>
        </ModeProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
