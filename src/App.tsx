import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import TopicPage from "./pages/TopicPage";
import Playground from "./pages/Playground";
import Practice from "./pages/Practice";
import PracticeSolution from "./pages/PracticeSolution";
import Interview from "./pages/Interview";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Menu, Sun, Moon, ZoomIn, ZoomOut, Search, X, ChevronRight, Sparkles } from "lucide-react";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { GuruBot } from "@/components/GuruBot";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { SupportModal } from "@/components/SupportModal";
import { Footer } from "@/components/Footer";
import Profile from "./pages/Profile";
import NotesDashboard from "./pages/NotesDashboard";
import Admin from "./pages/Admin";
import InterviewDataStructurePage from "./pages/interview/InterviewDataStructurePage";
import InterviewCoreJavaQuestionsPage from "./pages/interview/InterviewCoreJavaQuestionsPage";
import InterviewSystemDesignPage from "./pages/interview/InterviewSystemDesignPage";
import InterviewSqlStructurePage from "./pages/interview/InterviewSqlStructurePage";
import InterviewLanguageQuestionsPage from "./pages/interview/InterviewLanguageQuestionsPage";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
      <button
        onClick={() => setOpen(true)}
        title="Search topics (Ctrl+K)"
        className="touch-manipulation flex items-center gap-2.5 px-4 py-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 border border-border/40 bg-muted/30 text-foreground rounded-[20px] transition-all duration-300 hover:bg-muted/50 hover:border-primary/30 active:scale-95 w-auto sm:w-48 md:w-64 group justify-center sm:justify-start"
      >
        <Search size={14} strokeWidth={2.5} className="text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline-block flex-1 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          <span className="sm:inline md:hidden">Search...</span>
          <span className="hidden md:inline">Search AlgoGuru...</span>
        </span>
        <kbd
          className="hidden md:flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg border border-border/30 bg-background/50 text-muted-foreground/40"
        >
          ⌘K
        </kbd>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }} onClick={() => setOpen(false)}>
          <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} />
          <div
            className="relative w-full max-w-lg mx-4 overflow-hidden flex flex-col rounded-[32px] border border-border/50 bg-card shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]"
            style={{ maxHeight: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Search header */}
            <div className="relative z-10 flex items-center gap-4 px-6 py-5 border-b border-border/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20">
                <Search size={20} strokeWidth={2.5} className="text-primary" />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, algorithms, problems..."
                className="flex-1 bg-transparent text-lg font-bold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground"
              />
              {query && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground/60">
                  {totalResults}
                </span>
              )}
              <button 
                onClick={() => setOpen(false)} 
                className="touch-manipulation w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {totalResults === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>No results for "{query}"</div>
                  <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>Try searching for "Two Sum", "DFS", or "Backtracking"</div>
                </div>
              ) : (
                <>
                  {/* Topics */}
                  {grouped.topics.length > 0 && (
                    <div>
                      <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted)/0.3)" }}>
                        Topics
                      </div>
                      {grouped.topics.slice(0, 8).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                  {/* Subtopics / Sections */}
                  {grouped.subtopics.length > 0 && (
                    <div>
                      <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted)/0.3)" }}>
                        Sections
                      </div>
                      {grouped.subtopics.slice(0, 10).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                  {/* Problems / Algorithms */}
                  {grouped.problems.length > 0 && (
                    <div>
                      <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted)/0.3)" }}>
                        Problems & Algorithms ({grouped.problems.length})
                      </div>
                      {grouped.problems.slice(0, 20).map((item) => (
                        <SearchResultItem key={item.path} item={item} onSelect={() => { navigate(item.path); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/20">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{allSearchItems.length} items indexed</span>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[9px] bg-background border border-border/50 text-muted-foreground/40">↑↓</kbd>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[9px] bg-background border border-border/50 text-muted-foreground/40">esc</kbd>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">close</span>
                </div>
              </div>
              <div className="md:hidden flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[9px] bg-background border border-border/50 text-muted-foreground/40">esc</kbd>
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
      className="touch-manipulation w-full flex items-center gap-4 px-6 py-4 md:py-3 min-h-[44px] text-left transition-all hover:bg-muted/50 active:bg-muted/70 group border-b border-border/10 last:border-0"
    >
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-xl flex-shrink-0 border border-border/20 transition-transform group-hover:scale-110 group-hover:bg-primary/5 group-hover:border-primary/20">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{item.title}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-0.5">
          {item.type === "topic" ? `${item.subtopicCount} sections` : item.parent}
        </div>
      </div>
      {item.difficulty && (
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border"
          style={{ 
            color: difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))", 
            background: `${difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))"}10`,
            borderColor: `${difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))"}20`
          }}
        >
          {item.difficulty}
        </span>
      )}
      <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

const queryClient = new QueryClient();

const ZOOM_MAP: Record<string, string> = { sm: "85%", md: "100%", lg: "115%", xl: "125%" };

function HeaderControls() {
  const { theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize } = useSettings();
  const isDark = theme === "dark";
  const isMin = fontSize === "sm";
  const isMax = fontSize === "xl";

  return (
    <div className="flex items-center gap-1 md:gap-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/20 border border-border/30">
        <button
          onClick={decreaseFontSize}
          disabled={isMin}
          title="Zoom out"
          className="touch-manipulation flex items-center justify-center w-11 h-11 md:w-7 md:h-7 rounded-lg transition-all duration-150 disabled:opacity-25 hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
        >
          <ZoomOut size={14} />
        </button>
        <span className="hidden md:inline-block text-[10px] font-black min-w-[32px] text-center text-foreground/60">
          {ZOOM_MAP[fontSize] || "100%"}
        </span>
        <button
          onClick={increaseFontSize}
          disabled={isMax}
          title="Zoom in"
          className="touch-manipulation flex items-center justify-center w-11 h-11 md:w-7 md:h-7 rounded-lg transition-all duration-150 disabled:opacity-25 hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      <div className="w-px h-4 mx-1.5 bg-border/30" />

      {/* Day/Night Toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className={`touch-manipulation relative flex items-center gap-2 px-3 py-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border active:scale-95 ${
          isDark 
            ? "bg-[#FFD700]/10 border-[#FFD700]/20 text-[#FFD700]" 
            : "bg-[#1a1a1a] border-white/10 text-white shadow-xl shadow-black/20"
        }`}
      >
        {isDark ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.4)] flex items-center justify-center">
              <span className="text-[8px]">☀️</span>
            </div>
            <span className="hidden md:inline">Day</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[8px]">🌙</span>
            </div>
            <span className="hidden md:inline">Night</span>
          </div>
        )}
      </button>
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
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] sm:w-[38rem] sm:h-[38rem] bg-primary/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Logo — SVG includes the Algo / Guru text already */}
      <div className="z-10 drop-shadow-2xl animate-in zoom-in-95 fade-in duration-700 ease-out">
        <AlgoGuruLogo size={320} showText={true} className="text-foreground" />
      </div>

      {/* Animated progress bar */}
      <div className="w-36 h-[3px] mt-6 rounded-full overflow-hidden z-10" style={{ background: "hsl(var(--muted))" }}>
        <div
          className="h-full rounded-full animate-pulse"
          style={{ background: "hsl(var(--primary))" }}
        />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] mt-5 z-10" style={{ color: "hsl(var(--muted-foreground))" }}>
        Initializing…
      </p>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/* ── Custom Drag Handle ──────────────────────────── */
function DragHandle({ onMouseDown, isDragging }: { onMouseDown: (e: React.MouseEvent) => void; isDragging: boolean }) {
  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to resize"
      className="group flex-shrink-0 relative flex flex-col items-center justify-center z-10 select-none"
      style={{
        width: "14px",
        cursor: "col-resize",
        background: isDragging ? "hsl(var(--primary))" : "hsl(var(--muted))",
        borderLeft: "2px solid hsl(var(--border))",
        borderRight: "2px solid hsl(var(--border))",
        transition: "background 0.15s ease",
      }}
    >
      {/* Grip dots */}
      <div className="flex flex-col gap-[5px]">
        {[0,1,2,3,4,5].map(i => (
          <div
            key={i}
            className="rounded-full transition-all duration-150"
            style={{
              width: 4, height: 4,
              background: isDragging
                ? "hsl(var(--primary-foreground))"
                : "hsl(var(--muted-foreground))",
              opacity: isDragging ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      {/* Hover highlight line */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: "hsl(var(--primary))" }}
      />
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
      return saved ? parseFloat(saved) : 75; // Default main panel 75% wide so content isn't squished
    } catch {
      return 75;
    }
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport (< lg breakpoint = 1024px)
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const isSmallMobile = useMediaQuery('(max-width: 767px)');

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
  const contentBottomPaddingClass = location.pathname === "/" ? "pb-0" : "pb-10";

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPct = ((ev.clientX - rect.left) / rect.width) * 100;
      // Constrain: main panel 30%–85% (so Guru panel can be narrow)
      setSplitPct(Math.min(Math.max(rawPct, 30), 85));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <SidebarProvider>
      <div
        className="flex h-[100dvh] w-full overflow-hidden"
        style={{
          background: "hsl(var(--background))",
          cursor: isDragging ? "col-resize" : "auto",
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Top bar */}
          <header
            className="h-16 flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 border-b flex-shrink-0 sticky top-0 z-40 header"
            style={{
              borderColor: "hsl(var(--border) / 0.3)",
              background: "hsl(var(--background) / 0.98)",
            }}
          >
            <SidebarTrigger
              className="flex items-center justify-center w-11 h-11 hover:bg-muted/80 rounded-2xl transition-all duration-300 border border-border/30 flex-shrink-0"
              style={{ color: "hsl(var(--foreground))" }}
              title="Toggle Sidebar (Ctrl+B)"
            >
              <Menu size={18} />
            </SidebarTrigger>
            
            <div className="flex items-center gap-2 group cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 flex-shrink-0"
              onClick={() => window.location.href="/"}
              title="Go to Home"
            >
              <div className="relative flex-shrink-0 w-8 h-8">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <AlgoGuruLogo size={32} showText={false} className="relative z-10 block w-full h-auto" />
              </div>
              <span className="hidden sm:inline text-sm font-black uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-primary" style={{ color: "hsl(var(--foreground))" }}>
                AlgoGuru
              </span>
            </div>
            
            <div className="flex-1 min-w-0" />

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* Mobile: Show search icon button only */}
              <button
                onClick={() => document.querySelector<HTMLButtonElement>('[title="Search topics (Ctrl+K)"]')?.click()}
                className="sm:hidden touch-manipulation flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 border border-border/30 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
                title="Search"
              >
                <Search size={18} />
              </button>
              {/* Desktop: Show full search bar */}
              <div className="hidden sm:block">
                <SearchButton />
              </div>
              <div className="hidden md:block h-6 w-px bg-border/20" />
              <div className="hidden md:block">
                <HeaderControls />
              </div>
              <div className="hidden sm:block h-6 w-px bg-border/20" />
              <UserMenu />
              <div className="h-6 w-px bg-border/20" />
              <button
                onClick={() => setGuruOpen((o) => !o)}
                title={guruOpen ? "Close Guru" : "Open Guru"}
                className={`touch-manipulation flex items-center gap-2 px-3 py-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 border shadow-lg justify-center active:scale-95 flex-shrink-0 ${
                  guruOpen 
                    ? "bg-primary border-primary text-primary-foreground shadow-primary/20" 
                    : "bg-card border-border/50 text-foreground hover:bg-muted shadow-black/5"
                }`}
              >
                <Sparkles size={14} className={guruOpen ? "text-primary-foreground" : "text-primary"} />
                <span className="hidden sm:inline">Guru</span>
              </button>
            </div>
          </header>

          {guruOpen ? (
            isMobile ? (
              /* ── Mobile: Full-screen overlay ── */
              <>
                {/* Main content hidden on mobile when GuruBot is open */}
                <main ref={contentScrollRef} className="hidden">
                  <div className={`min-h-full ${contentBottomPaddingClass}`}>
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
              /* ── Desktop: Custom flex split with mouse-event drag ── */
              <div
                ref={containerRef}
                className="flex-1 flex flex-row min-h-0 overflow-hidden"
              >
                {/* Main content panel */}
                <main
                  ref={contentScrollRef}
                  className="overflow-y-auto flex-shrink-0"
                  style={{
                    width: `${splitPct}%`,
                    overscrollBehavior: "contain",
                    minWidth: "30%",
                  }}
                >
                  <div className={`min-h-full ${contentBottomPaddingClass}`}>
                    {children}
                    {location.pathname === "/" && (
                      <Footer onSupportClick={() => setSupportOpen(true)} />
                    )}
                  </div>
                </main>

                {/* ── Drag handle ── */}
                <DragHandle onMouseDown={handleDragStart} isDragging={isDragging} />

                {/* Guru panel */}
                <div
                  className="flex-1 min-w-0 overflow-hidden flex flex-col"
                  style={{ minWidth: "250px" }}
                >
                  {/* Guru panel title bar — premium minimal style */}
                  {!isTiny && (
                    <div
                      className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm"
                      style={{
                        borderColor: "hsl(var(--border) / 0.3)",
                      }}
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <Sparkles size={14} className="text-primary" />
                      </div>
                      <span
                        className="text-xs font-black uppercase tracking-[0.15em] text-foreground overflow-hidden text-ellipsis white-space-nowrap"
                      >
                        {isNarrow ? "Guru" : "Guru AI Assistant"}
                      </span>
                      <div className="flex-1" />
                      {!isNarrow && (
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary"
                        >
                          AI
                        </span>
                      )}
                      {/* Maximize button - expands Guru panel to full width */}
                      <button
                        onClick={() => setSplitPct(15)}
                        className="touch-manipulation flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                        title="Maximize Guru Panel"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                      {/* Restore button - resets to default 75/25 split */}
                      <button
                        onClick={() => setSplitPct(75)}
                        className="touch-manipulation flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                        title="Restore Default Split"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="4 14 10 14 10 20"></polyline>
                          <polyline points="20 10 14 10 14 4"></polyline>
                          <line x1="14" y1="10" x2="21" y2="3"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                      <button
                        onClick={() => setGuruOpen(false)}
                        className="touch-manipulation flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                        title="Close Guru"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />
                </div>
              </div>
            )
          ) : (
            <main ref={contentScrollRef} className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
              <div className={`min-h-full ${contentBottomPaddingClass}`}>
                {children}
                {location.pathname === "/" && (
                  <Footer onSupportClick={() => setSupportOpen(true)} />
                )}
              </div>
            </main>
          )}
        </div>
      </div>
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      
      {/* Mobile floating menu button (only on small screens where HeaderControls is hidden) */}
      {isSmallMobile && !guruOpen && (
        <>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center transition-all duration-300 active:scale-95 border-2 border-primary/20"
            title="Settings"
          >
            {mobileMenuOpen ? <X size={20} /> : <Sun size={20} />}
          </button>
          
          {mobileMenuOpen && (
            <div 
              className="md:hidden fixed bottom-24 right-6 z-50 bg-card border border-border/50 rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <HeaderControls />
            </div>
          )}
        </>
      )}
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
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/playground" element={<Playground />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/interview" element={<Interview />} />
                        <Route path="/interview/:language" element={<Interview />} />
                        <Route path="/interview/:language/data-structure" element={<InterviewDataStructurePage />} />
                        <Route path="/interview/:language/language-questions" element={<InterviewLanguageQuestionsPage />} />
                        <Route path="/interview/:language/core-java-qa" element={<InterviewCoreJavaQuestionsPage />} />
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
