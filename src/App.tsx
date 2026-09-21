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
import { Sun, Moon, ZoomIn, ZoomOut, Search, X, ChevronRight, Sparkles, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HomeSidebarContext } from "@/contexts/HomeSidebarContext";
import { UserMenu } from "@/components/UserMenu";
import { GuruBot, GURU_PANEL_CONSTANTS } from "@/components/GuruBot";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { SupportModal } from "@/components/SupportModal";
import { Footer } from "@/components/Footer";
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
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ImperativePanelHandle } from "react-resizable-panels";

// Import all content maps for deep search
import { recursionContent } from "@/data/recursionContent";
import { backtrackingContent } from "@/data/backtrackingContent";
import { dpContent } from "@/data/dpContent";
import { graphsContent } from "@/data/graphsContent";
import { bitManipulationContent } from "@/data/bitManipulationContent";
import { heapContent } from "@/data/heapContent";
import { stringsContent } from "@/data/stringsContent";
import { numberTheoryContent } from "@/data/numberTheoryContent";
import { treesContent } from "@/data/treesContent";
import { segmentTreeContent } from "@/data/segmentTreeContent";
import { advancedMathContent } from "@/data/advancedMathContent";
import { advancedTopicsContent } from "@/data/advancedTopicsContent";
import { stackQueueContent } from "@/data/stackQueueContent";
import { arraysContent } from "@/data/arraysContent";
import { javaContentMap } from "@/data/javaContent";
import { practiceContentMap } from "@/data/practiceContent";
import { systemDesignTopics } from "@/data/systemDesignInterviewData";

const allTopics = [...topics, ...javaTopics, ...practiceTopics];

// DS content map
const dsContentMap: Record<string, any[]> = {
  arrays: arraysContent,
  "stack-queue": stackQueueContent,
  recursion: recursionContent,
  backtracking: backtrackingContent,
  dp: dpContent,
  graphs: graphsContent,
  bits: bitManipulationContent,
  heaps: heapContent,
  strings: stringsContent,
  "number-theory": numberTheoryContent,
  trees: treesContent,
  "segment-tree": segmentTreeContent,
  "advanced-math": advancedMathContent,
  "advanced-topics": advancedTopicsContent,
};

const allContentMaps = { ...dsContentMap, ...javaContentMap, ...practiceContentMap };

// Build comprehensive search index: topics + subtopics + individual problems/sections
const allSearchItems = (() => {
  const items: Array<{
    id: string; title: string; icon: string; type: "topic" | "subtopic" | "problem";
    path: string; parent: string | null; subtopicCount: number; difficulty?: string;
  }> = [];

  allTopics.forEach((t) => {
    items.push({ id: t.id, title: t.title, icon: t.icon, type: "topic", path: `/${t.id}`, parent: null, subtopicCount: t.subtopics.length });
    t.subtopics.forEach((s) => {
      items.push({ id: s.id, title: s.title, icon: t.icon, type: "subtopic", path: `/${t.id}#${s.id}`, parent: t.title, subtopicCount: 0 });
    });
    // Add individual content sections (problems, algorithms)
    const content = allContentMaps[t.id];
    if (content) {
      content.forEach((section: any) => {
        if (section.title && section.id) {
          // Skip group headers like "Easy Problems", "Medium Problems" etc.
          const isGroupHeader = /^(Easy|Medium|Hard) Problems$/i.test(section.title);
          if (!isGroupHeader) {
            const alreadyExists = items.some((i) => i.id === section.id && i.path.startsWith(`/${t.id}`));
            if (!alreadyExists) {
              items.push({
                id: section.id, title: section.title, icon: t.icon, type: "problem",
                path: `/${t.id}#${section.id}`, parent: t.title, subtopicCount: 0,
                difficulty: section.difficulty,
              });
            }
          }
        }
      });
    }
  });

  // Add System Design interview questions to global search
  systemDesignTopics.forEach((topic) => {
    topic.questions.forEach((question) => {
      items.push({
        id: question.id,
        title: question.question,
        icon: topic.icon,
        type: "subtopic",
        path: `/interview/java/system-design#${question.id}`,
        parent: `System Design — ${topic.title}`,
        subtopicCount: 0,
      });
    });
  });

  return items;
})();

const difficultyColors: Record<string, string> = {
  Easy: "hsl(var(--success))",
  Medium: "hsl(var(--warning))",
  Hard: "hsl(var(--destructive, 0 84% 60%))",
  Expert: "hsl(var(--info))",
};

function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allSearchItems.filter((i) => i.type === "topic").slice(0, 12);
    const terms = q.split(/\s+/);
    return allSearchItems.filter((i) => {
      const text = `${i.title} ${i.parent || ''} ${i.id}`.toLowerCase();
      return terms.every(t => text.includes(t));
    });
  }, [query]);

  const grouped = useMemo(() => {
    const topics = results.filter((r) => r.type === "topic");
    const subtopics = results.filter((r) => r.type === "subtopic");
    const problems = results.filter((r) => r.type === "problem");
    return { topics, subtopics, problems };
  }, [results]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const totalResults = results.length;

  return (
    <>
      <AppTooltip content="Search topics & problems (Ctrl+K)">
        <button
          onClick={() => setOpen(true)}
          aria-label="Search topics & problems"
          data-search-trigger="true"
          className="group touch-manipulation flex items-center gap-2.5 h-8 px-3 rounded-lg border border-border/55 bg-muted/50 hover:bg-muted hover:border-border/80 text-foreground transition-all duration-150 w-44 sm:w-56 md:w-64 lg:w-72 active:scale-[0.98]"
        >
          <Search size={14} className="text-muted-foreground/70 group-hover:text-muted-foreground transition-colors shrink-0" />
          <span className="hidden sm:inline-block flex-1 text-left text-[13px] text-muted-foreground/65 group-hover:text-muted-foreground transition-colors truncate">
            Search…
          </span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold font-mono text-muted-foreground/50 bg-background/60 border border-border/50 rounded group-hover:border-border/70 transition-colors">
            <span>⌘</span>K
          </kbd>
        </button>
      </AppTooltip>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl overflow-hidden flex flex-col rounded-2xl border border-border bg-card shadow-overlay"
            style={{ maxHeight: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative z-10 flex items-center gap-3 border-b border-border px-4 py-3">
              <Search size={17} className="shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, algorithms, problems..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
              />
              {query && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {totalResults}
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {totalResults === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-sm font-medium text-foreground">No results for “{query}”</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Try “Two Sum”, “DFS”, or “Backtracking”
                  </div>
                </div>
              ) : (
                <>
                  {grouped.topics.length > 0 && (
                    <div>
                      <div className="bg-muted/40 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
                        Topics
                      </div>
                      {grouped.topics.slice(0, 8).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                  {grouped.subtopics.length > 0 && (
                    <div>
                      <div className="bg-muted/40 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
                        Sections
                      </div>
                      {grouped.subtopics.slice(0, 10).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                  {grouped.problems.length > 0 && (
                    <div>
                      <div className="bg-muted/40 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
                        Problems & algorithms · {grouped.problems.length}
                      </div>
                      {grouped.problems.slice(0, 20).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              <span>{allSearchItems.length} items indexed</span>
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1.5 sm:flex">
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">esc</kbd>
                  <span>close</span>
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SearchResultItem({ item, onSelect }: { item: typeof allSearchItems[number]; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="touch-manipulation flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 group"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.type === "topic" ? `${item.subtopicCount} sections` : item.parent}
        </div>
      </div>
      {item.difficulty && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
          style={{
            color: difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))",
            background: `${difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))"}10`,
            borderColor: `${difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))"}25`
          }}
        >
          {item.difficulty}
        </span>
      )}
      <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

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
    <div className="flex items-center gap-1.5">
      {/* Zoom cluster — desktop only */}
      <div className="hidden md:flex items-center h-8 rounded-lg border border-border/55 bg-muted/50 p-0.5 gap-0">
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
        <span className="text-[10.5px] font-semibold min-w-[32px] text-center text-muted-foreground/70 font-mono tabular-nums select-none">
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
          className="group touch-manipulation flex items-center justify-center w-8 h-8 rounded-lg border border-border/55 bg-muted/50 hover:bg-muted hover:border-border/80 text-muted-foreground transition-all duration-200 active:scale-[0.93]"
        >
          {isDark ? (
            <Sun size={14} className="transition-transform duration-300 group-hover:rotate-45 text-amber-400/90 group-hover:text-amber-400" />
          ) : (
            <Moon size={14} className="transition-transform duration-300 group-hover:-rotate-12 text-slate-500 dark:text-slate-400" />
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background"
    >
      <div className="z-10">
        <AlgoGuruLogo size={180} showText={true} className="text-foreground" />
      </div>

      <div className="w-32 h-[2px] mt-6 rounded-full overflow-hidden z-10 bg-muted">
        <div className="h-full rounded-full animate-pulse bg-primary" />
      </div>
      <p className="text-xs text-muted-foreground mt-4 z-10">
        Loading…
      </p>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
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
  // Track hover over the sidebar zone to show the fold tab
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // On the home page the left sidebar panel is hidden by default (including
  // its fold/unfold handle). It only becomes visible when the user clicks the
  // "Choose where to focus next." heading, which toggles `homeSidebarOpen`.
  const [homeSidebarOpen, setHomeSidebarOpen] = useState(false);
  const isHomeRoute = location.pathname === "/";
  // Sidebar panel should only mount on non-home routes, or when the home
  // visitor explicitly opens it via the heading.
  const showSidebarPanel = !isHomeRoute || homeSidebarOpen;
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

  const toggleSidebarFold = useCallback(() => {
    if (isSidebarCollapsed) unfoldSidebar();
    else foldSidebar();
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
      <HomeSidebarContext.Provider value={homeSidebarValue}>
      <div
        className="flex h-[100dvh] w-full overflow-hidden"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* ── Sidebar + Content split ── */}
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Sidebar panel — hidden entirely on the home page until the
              visitor clicks "Choose where to focus next." */}
          {showSidebarPanel && (
          <Panel
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
                isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <AppSidebar />
            </div>

            {/* ── Fold tab — floats on the right edge of the sidebar ─────
                Lives here (not in the drag handle) so click and drag are
                completely separate pointer surfaces. Appears on hover or
                when the sidebar is about to be folded. */}
            {!isSidebarCollapsed && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 right-0 translate-x-full z-50",
                  "transition-opacity duration-200",
                  isResizingSidebar ? "opacity-0 pointer-events-none" : "opacity-0 sidebar-panel-hover:opacity-100"
                )}
                style={{ pointerEvents: isResizingSidebar ? "none" : "auto" }}
              >
                <AppTooltip content="Collapse sidebar" side="right">
                  <button
                    onClick={foldSidebar}
                    aria-label="Collapse sidebar"
                    className={cn(
                      "group flex items-center justify-center",
                      "w-5 h-10 rounded-r-lg",
                      "bg-card border border-l-0 border-border/70",
                      "text-muted-foreground/60 hover:text-foreground",
                      "hover:bg-muted/80",
                      "shadow-[2px_0_8px_hsl(var(--foreground)/0.06)]",
                      "transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <FoldGlyph direction="fold" size={11} strokeWidth={2.5} />
                  </button>
                </AppTooltip>
              </div>
            )}
          </Panel>
          )}

          {/* ── Resize handle — pure drag zone, NO button inside ─────────
              The fold button lives on the sidebar panel above. This element
              is solely responsible for resizing via drag. */}
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


          <Panel defaultSize={80} minSize={50} className="flex flex-col min-h-0">
          {/* Top bar — Premium redesign */}
          <header
            className={cn(
              "relative h-[52px] flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 flex-shrink-0 sticky top-0 z-40",
              "backdrop-blur-2xl transition-all duration-300",
              isHomeRoute
                ? "border-b border-border/30 shadow-[0_1px_0_0_hsl(var(--primary)/0.06),0_4px_24px_-4px_hsl(var(--primary)/0.05)]"
                : "border-b border-border/45 shadow-[0_1px_0_0_hsl(var(--primary)/0.08),0_4px_32px_-4px_hsl(var(--primary)/0.08)]"
            )}
            style={{
              background: isHomeRoute
                ? "linear-gradient(180deg,hsl(var(--background)/0.84) 0%,hsl(var(--background)/0.74) 100%)"
                : "linear-gradient(180deg,hsl(var(--background)/0.93) 0%,hsl(var(--background)/0.86) 100%)",
            }}
          >
            {/* Gradient shimmer accent line at very top */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
              style={{
                background:
                  "linear-gradient(90deg,transparent 0%,hsl(var(--primary)/0.32) 30%,hsl(var(--primary)/0.55) 50%,hsl(var(--primary)/0.32) 70%,transparent 100%)",
              }}
            />

            {/* ── Left: sidebar toggle + logo ──────────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              <AnimatePresence initial={false}>
                {isSidebarCollapsed && (
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
                      aria-label="Unfold sidebar"
                      className={cn(
                        "group relative touch-manipulation w-8 h-8 rounded-lg flex-shrink-0",
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
                  className="group flex items-center gap-2 rounded-xl px-1.5 py-1 -ml-1 transition-all duration-200 hover:bg-muted/40 active:scale-[0.97] flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                >
                  {/* Icon badge with glow */}
                  <div className="relative flex items-center justify-center w-[30px] h-[30px] flex-shrink-0">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[8px]"
                      style={{ background: "linear-gradient(135deg,hsl(var(--primary)/0.5) 0%,hsl(var(--primary)/0.2) 100%)" }}
                    />
                    <div
                      className="relative flex items-center justify-center w-[30px] h-[30px] rounded-lg transition-transform duration-200 group-hover:scale-[1.08]"
                      style={{
                        background: "linear-gradient(135deg,hsl(var(--primary)) 0%,hsl(var(--primary)/0.72) 100%)",
                        boxShadow: "0 0 0 1px hsl(var(--primary)/0.18),0 2px 8px hsl(var(--primary)/0.28),inset 0 1px 0 rgba(255,255,255,0.22)",
                      }}
                    >
                      <AlgoGuruLogo size={18} showText={false} className="text-white" />
                    </div>
                  </div>
                  {/* Brand text */}
                  <span className="hidden sm:inline text-[14.5px] font-bold tracking-tight text-foreground">
                    Algo<span className="text-primary">Guru</span>
                  </span>
                </Link>
              </AppTooltip>
            </div>

            {/* ── Spacer ───────────────────────────────────────── */}
            <div className="flex-1 min-w-0" />

            {/* ── Right: search + controls + user + Guru AI ────── */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

              {/* Mobile search icon */}
              <AppTooltip content="Search (Ctrl+K)">
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-search-trigger="true"]')?.click()}
                  className="sm:hidden touch-manipulation flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 bg-muted/50 hover:bg-primary/[0.08] hover:border-primary/35 text-muted-foreground hover:text-primary transition-all duration-150 active:scale-[0.93]"
                  aria-label="Search"
                >
                  <Search size={15} />
                </button>
              </AppTooltip>

              {/* Desktop search */}
              <div className="hidden sm:block">
                <SearchButton />
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-[18px] w-px bg-border/50 rounded-full mx-0.5" />

              {/* Theme / zoom controls */}
              <HeaderControls />

              {/* Divider */}
              <div className="hidden sm:block h-[18px] w-px bg-border/50 rounded-full mx-0.5" />

              {/* User avatar menu */}
              <UserMenu />

              {/* Guru AI button */}
              {isProblemSolverRoute ? (
                <AppTooltip content="Guru AI is in the description panel — Guru AI tab.">
                  <div
                    className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold rounded-lg select-none"
                    style={{
                      background: "hsl(var(--primary)/0.1)",
                      border: "1px solid hsl(var(--primary)/0.28)",
                      color: "hsl(var(--primary))",
                      boxShadow: "0 0 10px hsl(var(--primary)/0.08)",
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Guru in tab</span>
                  </div>
                </AppTooltip>
              ) : (
                <AppTooltip content={guruOpen ? "Close Guru AI" : "Open Guru AI"}>
                  <button
                    onClick={toggleGuruPanel}
                    aria-label={guruOpen ? "Close Guru AI" : "Open Guru AI"}
                    className={cn(
                      "touch-manipulation relative overflow-hidden flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-lg text-[12.5px] font-semibold transition-all duration-200 select-none active:scale-[0.93]",
                      guruOpen
                        ? "text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.8),0_4px_14px_hsl(var(--primary)/0.35),0_2px_6px_hsl(var(--primary)/0.2)]"
                        : "text-foreground border border-border/60 bg-muted/50 hover:bg-primary/[0.08] hover:border-primary/40 hover:text-primary hover:shadow-[0_0_10px_hsl(var(--primary)/0.1)]"
                    )}
                    style={
                      guruOpen
                        ? { background: "linear-gradient(135deg,hsl(var(--primary)) 0%,hsl(var(--primary)/0.82) 100%)" }
                        : {}
                    }
                  >
                    {guruOpen && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit]"
                        style={{
                          background:
                            "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2.4s ease-in-out infinite",
                        }}
                      />
                    )}
                    <Sparkles
                      size={13}
                      className={cn(
                        "relative flex-shrink-0 transition-transform duration-200",
                        guruOpen ? "text-primary-foreground" : "text-primary"
                      )}
                    />
                    <span className="hidden sm:inline relative">
                      {guruOpen ? "Guru AI" : "Guru"}
                    </span>
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
      </HomeSidebarContext.Provider>
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
          <BrowserRouter>
            <ScrollToTopOnRouteChange />
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                        <Route path="/interview" element={<Interview />} />
                        <Route path="/interview/:language" element={<Interview />} />
                        <Route path="/interview/:language/data-structure" element={<InterviewDataStructurePage />} />
                        <Route path="/interview/:language/language-questions" element={<InterviewLanguageQuestionsPage />} />
                        <Route path="/interview/:language/language-questions/:questionSlug" element={<InterviewLanguageQuestionDetailPage />} />
                        <Route path="/interview/:language/core-java-qa" element={<InterviewCoreJavaQuestionsPage />} />
                        <Route path="/interview/:language/core-java-qa/:questionSlug" element={<InterviewCoreJavaQuestionDetailPage />} />
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
