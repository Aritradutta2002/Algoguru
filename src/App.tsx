import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import TopicPage from "./pages/TopicPage";
import Playground from "./pages/Playground";
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
    return allSearchItems.filter((i) => i.title.toLowerCase().includes(q));
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
        className="neo-btn flex items-center gap-2.5 px-4 py-2 bg-card text-foreground"
      >
        <Search size={16} strokeWidth={2.5} />
        <span className="hidden sm:inline text-sm font-black uppercase tracking-widest">Search</span>
        <kbd
          className="hidden sm:inline text-[10px] font-mono font-black px-2 py-0.5 border-2 border-border ml-1"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          ⌘K
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
    <div className="flex items-center gap-1">
      {/* Zoom controls */}
      <button
        onClick={decreaseFontSize}
        disabled={isMin}
        title="Zoom out"
        className="flex items-center justify-center w-8 h-8 rounded transition-all duration-150 disabled:opacity-25 neo-btn bg-background"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ZoomOut size={14} />
      </button>
      <span className="text-[11px] font-mono font-bold min-w-[36px] text-center" style={{ color: "hsl(var(--foreground))" }}>
        {ZOOM_MAP[fontSize] || "100%"}
      </span>
      <button
        onClick={increaseFontSize}
        disabled={isMax}
        title="Zoom in"
        className="flex items-center justify-center w-8 h-8 rounded transition-all duration-150 disabled:opacity-25 neo-btn bg-background"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ZoomIn size={14} />
      </button>

      <div className="w-px h-5 mx-2" style={{ background: "hsl(var(--border))" }} />

      {/* Day/Night Toggle - Neo-Brutalist Style */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest neo-btn transition-all duration-150"
        style={{
          background: isDark ? "hsl(43 95% 55%)" : "hsl(25 40% 18%)",
          color: isDark ? "#1a0a00" : "#FAF6EE",
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
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

function AppLayout({ children }: { children: React.ReactNode }) {
  const [guruOpen, setGuruOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "hsl(var(--background))" }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Top bar */}
          <header
            className="h-14 flex items-center gap-3 px-5 border-b-2 flex-shrink-0 sticky top-0 z-40"
            style={{
              borderColor: "hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          >
            <SidebarTrigger
              className="neo-btn flex items-center justify-center w-8 h-8 bg-background"
              style={{ color: "hsl(var(--foreground))" }}
            >
              <Menu size={16} />
            </SidebarTrigger>
            <div className="h-5 w-0.5" style={{ background: "hsl(var(--border))" }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
              AlgoGuru
            </span>
            <div className="flex-1" />

            <SearchButton />
            <div className="h-4 w-px mx-1" style={{ background: "hsl(var(--border))" }} />
            <HeaderControls />
            <div className="h-4 w-px mx-1" style={{ background: "hsl(var(--border))" }} />
            <UserMenu />
            <div className="h-4 w-px mx-1" style={{ background: "hsl(var(--border))" }} />
            <button
              onClick={() => setGuruOpen((o) => !o)}
              title={guruOpen ? "Close Guru" : "Open Guru"}
              className="neo-btn flex items-center gap-1.5 px-3 py-2 transition-all duration-150"
              style={{
                background: guruOpen ? "hsl(var(--primary))" : "hsl(var(--card))",
                color: guruOpen ? "#000" : "hsl(var(--foreground))",
              }}
            >
              <Sparkles size={14} />
              <span className="text-xs font-bold hidden sm:inline">Guru</span>
            </button>
          </header>

          {guruOpen ? (
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={65} minSize={35}>
                <main className="h-full overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                  {children}
                </main>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={35} minSize={22} maxSize={50}>
                <GuruBot open={guruOpen} onClose={() => setGuruOpen(false)} />
              </ResizablePanel>
            </ResizablePanelGroup>
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
