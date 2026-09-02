import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
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
      <AppTooltip content="Search topics (Ctrl+K)">
        <button
          onClick={() => setOpen(true)}
          aria-label="Search topics"
          data-search-trigger="true"
          className="touch-manipulation flex items-center gap-2.5 px-3 py-1.5 h-9 border border-border bg-muted/40 text-foreground rounded-lg transition-colors hover:bg-muted w-44 md:w-64 group"
        >
          <Search size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden sm:inline-block flex-1 text-left text-[13px] text-muted-foreground group-hover:text-foreground transition-colors truncate">
            Search AlgoGuru...
          </span>
          <kbd className="hidden md:flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
            ⌘K
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
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden md:flex items-center rounded-lg border border-border bg-muted/40">
        <AppTooltip content="Zoom out">
          <button
            onClick={decreaseFontSize}
            disabled={isMin}
            aria-label="Zoom out"
            className="touch-manipulation flex items-center justify-center w-8 h-8 rounded-l-lg transition-colors disabled:opacity-30 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ZoomOut size={14} />
          </button>
        </AppTooltip>
        <span className="text-[11px] font-medium min-w-[36px] text-center text-foreground/70 tabular-nums">
          {ZOOM_MAP[fontSize] || "100%"}
        </span>
        <AppTooltip content="Zoom in">
          <button
            onClick={increaseFontSize}
            disabled={isMax}
            aria-label="Zoom in"
            className="touch-manipulation flex items-center justify-center w-8 h-8 rounded-r-lg transition-colors disabled:opacity-30 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ZoomIn size={14} />
          </button>
        </AppTooltip>
      </div>

      <AppTooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="touch-manipulation flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
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
  // While the user drags the resize handle we must NOT transition `flex-grow`,
  // otherwise the panel lags behind the cursor. The transition is only enabled
  // for programmatic fold/unfold so those animate smoothly.
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const foldSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
    sidebarRef.current?.collapse();
  }, []);

  const unfoldSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
    sidebarRef.current?.expand();
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
      <div
        className="flex h-[100dvh] w-full overflow-hidden"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* ── Sidebar + Content split ── */}
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Sidebar panel */}
          <Panel
            ref={sidebarRef}
            defaultSize={20}
            minSize={14}
            maxSize={28}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className={cn(
              "flex flex-col h-full overflow-hidden will-change-[flex-grow]",
              // Animate only programmatic fold/unfold — never while dragging,
              // otherwise the panel visibly trails the cursor.
              !isResizingSidebar && "transition-[flex-grow] duration-300 ease-in-out"
            )}
            style={{ maxWidth: 360 }}
          >
            {/* Content fades out as the panel folds so the squeeze reads as a
                deliberate exit rather than a layout glitch. */}
            <div
              className={cn(
                "h-full w-full overflow-hidden transition-opacity duration-200 ease-out",
                isSidebarCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              <AppSidebar />
            </div>
          </Panel>

          {/* Resize handle with fold / unfold toggle */}
          <PanelResizeHandle
            onDragging={setIsResizingSidebar}
            className="group relative flex items-center justify-center w-[5px] bg-border/30 hover:bg-primary/20 transition-colors duration-200 cursor-col-resize select-none"
          >
            {/* Fold / unfold toggle — visible on hover; when collapsed the rail
                is the only affordance, so keep it permanently visible then. */}
            <button
              onClick={toggleSidebarFold}
              aria-label={isSidebarCollapsed ? "Unfold sidebar" : "Fold sidebar"}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border shadow-md",
                "flex items-center justify-center transition-all duration-200",
                "text-muted-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSidebarCollapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <FoldGlyph direction={isSidebarCollapsed ? "unfold" : "fold"} size={12} />
            </button>
          </PanelResizeHandle>

          {/* Main content panel */}
          <Panel defaultSize={80} minSize={50} className="flex flex-col min-h-0">
          {/* Top bar */}
          <header
            className="h-14 flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 border-b border-border flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur header"
          >

            {/* ── Unfold button — sits beside the AlgoGuru logo ──────────
                In-flow flex child placed immediately BEFORE the logo, so it
                occupies its own layout slot and cannot overlap or interfere
                with the logo's layout. On hover the resting icon crossfades
                into the ">>" indicator. */}
            <AnimatePresence initial={false}>
              {isSidebarCollapsed && (
                <motion.div
                  key="unfold-beside-logo"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center overflow-hidden flex-shrink-0"
                >
                  <button
                    onClick={unfoldSidebar}
                    aria-label="Unfold sidebar"
                    className={cn(
                      "group relative touch-manipulation w-9 h-9 rounded-full flex-shrink-0",
                      "flex items-center justify-center",
                      "bg-card/90 border border-border/60 shadow-lg backdrop-blur-sm",
                      "hover:bg-muted hover:border-primary/40 hover:shadow-primary/10",
                      "active:scale-95 transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {/* Resting icon — crossfades to the ">>" indicator on hover. */}
                    <PanelLeft
                      size={16}
                      className="absolute text-muted-foreground transition-all duration-200 group-hover:opacity-0 group-hover:scale-75"
                    />
                    <FoldGlyph
                      direction="unfold"
                      size={17}
                      strokeWidth={2.5}
                      className="absolute text-primary opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AppTooltip content="Go to home">
              <div className="flex items-center gap-2 group cursor-pointer flex-shrink-0"
                onClick={() => window.location.href = "/"}
                role="button"
                tabIndex={0}
                aria-label="Go to home"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    window.location.href = "/";
                  }
                }}
              >
                <AlgoGuruLogo size={28} showText={false} className="block" />
                <span className="hidden sm:inline text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  AlgoGuru
                </span>
              </div>
            </AppTooltip>

            <div className="flex-1 min-w-0" />

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <AppTooltip content="Search">
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-search-trigger="true"]')?.click()}
                  className="sm:hidden touch-manipulation flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Search"
                >
                  <Search size={17} />
                </button>
              </AppTooltip>
              <div className="hidden sm:block">
                <SearchButton />
              </div>
              <div className="hidden sm:block h-5 w-px bg-border mx-0.5" />
              <HeaderControls />
              <UserMenu />
              {isProblemSolverRoute ? (
                <AppTooltip content="Guru AI is in the description panel — Guru AI tab.">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <Sparkles size={13} />
                    <span>Guru in tab</span>
                  </div>
                </AppTooltip>
              ) : (
                <AppTooltip content={guruOpen ? "Close Guru" : "Open Guru"}>
                  <button
                    onClick={toggleGuruPanel}
                    aria-label={guruOpen ? "Close Guru" : "Open Guru"}
                    className={`touch-manipulation flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${guruOpen
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <Sparkles size={14} className={guruOpen ? "text-primary-foreground" : "text-primary"} />
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
