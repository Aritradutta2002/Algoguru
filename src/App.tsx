import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import TopicPage from "./pages/TopicPage";
import Playground from "./pages/Playground";
import Practice from "./pages/Practice";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Menu, Sun, Moon, ZoomIn, ZoomOut, Search, X, ChevronRight, Sparkles } from "lucide-react";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { GuruBot } from "@/components/GuruBot";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";

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
import { javaContentMap } from "@/data/javaContent";
import { practiceContentMap } from "@/data/practiceContent";

const allTopics = [...topics, ...javaTopics, ...practiceTopics];

// DS content map
const dsContentMap: Record<string, any[]> = {
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
        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-border bg-card text-foreground rounded-lg transition-all duration-200 hover:bg-muted/80 w-auto sm:w-64"
        style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
      >
        <Search size={14} strokeWidth={2} className="text-muted-foreground" />
        <span className="hidden sm:inline-block flex-1 text-left text-xs font-medium text-muted-foreground mr-2">Search AlgoGuru...</span>
        <kbd
          className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ml-auto border border-border/50 bg-background"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }} onClick={() => setOpen(false)}>
          <div className="fixed inset-0" style={{ background: "hsl(var(--background)/0.75)", backdropFilter: "blur(8px)" }} />
          <div
            className="relative w-full max-w-md mx-4 overflow-hidden flex flex-col border-4 border-black dark:border-white"
            style={{ background: "hsl(var(--card))", boxShadow: "8px 8px 0px 0px hsl(var(--border))", maxHeight: "65vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "hsl(var(--primary)/0.1)" }}>
                <Search size={20} strokeWidth={2.5} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, algorithms, problems..."
                className="flex-1 bg-transparent text-base font-medium outline-none"
                style={{ color: "hsl(var(--foreground))" }}
              />
              {query && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                  {totalResults}
                </span>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                <X size={16} />
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
            <div className="flex items-center justify-between px-5 py-2.5 border-t text-[10px]" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
              <span className="font-mono">{allSearchItems.length} items indexed</span>
              <div className="flex items-center gap-3">
                <span><kbd className="px-1.5 py-0.5 rounded font-mono text-[9px]" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>↑↓</kbd> navigate</span>
                <span><kbd className="px-1.5 py-0.5 rounded font-mono text-[9px]" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>esc</kbd> close</span>
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
      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[hsl(var(--muted)/0.5)] group"
      style={{ color: "hsl(var(--foreground))", borderBottom: "1px solid hsl(var(--border)/0.3)" }}
    >
      <span className="text-lg flex-shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{item.title}</div>
        <div className="text-[11px] font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
          {item.type === "topic" ? `${item.subtopicCount} sections` : item.parent}
        </div>
      </div>
      {item.difficulty && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))", background: `${difficultyColors[item.difficulty] || "hsl(var(--muted-foreground))"}15` }}
        >
          {item.difficulty}
        </span>
      )}
      <ChevronRight size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--muted-foreground))" }} />
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
    <div className="flex items-center gap-0.5">
      {/* Zoom controls */}
      <button
        onClick={decreaseFontSize}
        disabled={isMin}
        title="Zoom out"
        className="flex items-center justify-center w-6 h-6 rounded transition-all duration-150 disabled:opacity-25 hover:bg-muted"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ZoomOut size={12} />
      </button>
      <span className="text-[10px] font-mono font-bold min-w-[28px] text-center" style={{ color: "hsl(var(--foreground))" }}>
        {ZOOM_MAP[fontSize] || "100%"}
      </span>
      <button
        onClick={increaseFontSize}
        disabled={isMax}
        title="Zoom in"
        className="flex items-center justify-center w-6 h-6 rounded transition-all duration-150 disabled:opacity-25 hover:bg-muted"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ZoomIn size={12} />
      </button>

      <div className="w-px h-4 mx-1.5" style={{ background: "hsl(var(--border))" }} />

      {/* Day/Night Toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-all duration-150 hover:opacity-90 rounded"
        style={{
          background: isDark ? "hsl(43 95% 55%)" : "hsl(25 40% 18%)",
          color: isDark ? "#1a0a00" : "#FAF6EE",
          border: "2px solid hsl(var(--border))",
          boxShadow: "2px 2px 0px 0px hsl(var(--border))",
        }}
      >
        {isDark ? <Sun size={11} /> : <Moon size={11} />}
        <span className="hidden sm:inline">{isDark ? "Day" : "Night"}</span>
      </button>
    </div>
  );
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "hsl(var(--background))" }}>
      <div className="text-4xl font-black uppercase tracking-tighter" style={{ color: "hsl(var(--primary))" }}>AG</div>
      <div className="w-12 h-1 bg-primary animate-pulse" />
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Initializing...</p>
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
  const [guruOpen, setGuruOpen] = useState(false);
  const [splitPct, setSplitPct] = useState(() => {
    try {
      const saved = localStorage.getItem("guru-split-pct");
      return saved ? parseFloat(saved) : 75; // Default main panel 75% wide so content isn't squished
    } catch {
      return 75;
    }
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("guru-split-pct", splitPct.toString());
  }, [splitPct]);

  // Derived: how wide is the Guru panel?
  const guruPct = 100 - splitPct;
  // When Guru panel narrower than ~30%, truncate labels inside it
  const isNarrow = guruPct < 30;
  // When Guru panel narrower than ~22%, hide non-essential UI entirely
  const isTiny = guruPct < 22;

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
            className="h-11 flex items-center gap-2 px-4 border-b-2 flex-shrink-0 sticky top-0 z-40"
            style={{
              borderColor: "hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          >
            <SidebarTrigger
              className="flex items-center justify-center w-7 h-7 hover:bg-muted rounded transition-all duration-150"
              style={{ color: "hsl(var(--foreground))" }}
            >
              <Menu size={15} />
            </SidebarTrigger>
            <div className="h-4 w-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
              AlgoGuru
            </span>
            <div className="flex-1" />

            <SearchButton />
            <div className="h-4 w-px mx-0.5" style={{ background: "hsl(var(--border))" }} />
            <HeaderControls />
            <div className="h-4 w-px mx-0.5" style={{ background: "hsl(var(--border))" }} />
            <UserMenu />
            <div className="h-4 w-px mx-0.5" style={{ background: "hsl(var(--border))" }} />
            <button
              onClick={() => setGuruOpen((o) => !o)}
              title={guruOpen ? "Close Guru" : "Open Guru"}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded transition-all duration-150"
              style={{
                background: guruOpen ? "hsl(var(--primary))" : "hsl(var(--card))",
                color: guruOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                border: "2px solid hsl(var(--border))",
                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
              }}
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Guru</span>
            </button>
          </header>

          {guruOpen ? (
            /* ── Custom flex split with mouse-event drag ── */
            <div
              ref={containerRef}
              className="flex-1 flex flex-row min-h-0 overflow-hidden"
            >
              {/* Main content panel */}
              <main
                className="overflow-y-auto flex-shrink-0"
                style={{
                  width: `${splitPct}%`,
                  overscrollBehavior: "contain",
                  minWidth: "30%",
                }}
              >
                {children}
              </main>

              {/* ── Drag handle ── */}
              <DragHandle onMouseDown={handleDragStart} isDragging={isDragging} />

              {/* Guru panel */}
              <div
                className="flex-1 min-w-0 overflow-hidden flex flex-col"
                style={{ minWidth: "250px" }}
              >
                {/* Guru panel title bar — truncates when narrow */}
                {!isTiny && (
                  <div
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b-2"
                    style={{
                      borderColor: "hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  >
                    <Sparkles size={13} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                    <span
                      className="text-xs font-black uppercase tracking-widest"
                      style={{
                        color: "hsl(var(--foreground))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isNarrow ? "Guru" : "Guru AI Assistant"}
                    </span>
                    <div className="flex-1" />
                    {!isNarrow && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                        style={{
                          background: "hsl(var(--primary) / 0.15)",
                          color: "hsl(var(--primary))",
                          border: "1.5px solid hsl(var(--primary) / 0.4)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        AI
                      </span>
                    )}
                    <button
                      onClick={() => setGuruOpen(false)}
                      className="neo-btn flex-shrink-0 w-6 h-6 flex items-center justify-center bg-card"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                      title="Close Guru"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />
              </div>
            </div>
          ) : (
            <main className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
              {children}
            </main>
          )}
        </div>
      </div>
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
                        <Route path="/profile" element={<Profile />} />
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
