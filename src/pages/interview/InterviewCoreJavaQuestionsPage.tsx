import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense, memo } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  StickyNote,
  X,
  Search,
  Coffee,
  BookOpen,
  Check,
  FileText,
  Code2,
  Download,
  Trash2,
  PanelLeftOpen,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { CodeBlock } from "@/components/CodeBlock";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";
import jsPDF from "jspdf";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

const RichTextNoteEditor = lazy(() => import("@/components/RichTextNoteEditor"));

type SolutionView = "theory" | "code" | null;

// ---------------------------------------------------------------------------
// QuestionCard — memoized to prevent unnecessary re-renders when sibling
// cards, search input, or note drafts change.
// ---------------------------------------------------------------------------
interface QuestionCardProps {
  question: (typeof coreJavaInterviewTopics)[number]["questions"][number];
  idx: number;
  isDone: boolean;
  hasNote: boolean;
  activeView: SolutionView;
  onToggleDone: (id: string) => void;
  onToggleView: (id: string, view: Exclude<SolutionView, null>) => void;
  onOpenNote: (id: string) => void;
}

const _QuestionCard = ({
  question,
  idx,
  isDone,
  hasNote,
  activeView,
  onToggleDone,
  onToggleView,
  onOpenNote,
}: QuestionCardProps) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden relative ${
        isDone
          ? "bg-success/5 border-success/20"
          : activeView 
            ? "bg-card border-primary/30 shadow-sm"
            : "bg-card border-border/40 hover:border-border/60"
      }`}
    >
      {/* Accent bar when expanded */}
      {activeView && !isDone && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
      )}
      
      {/* Card header */}
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          {/* Done toggle */}
          <button
            onClick={() => onToggleDone(question.id)}
            title={isDone ? "Mark undone" : "Mark as done"}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-95 ${
              isDone
                ? "bg-success border-success text-white shadow-sm"
                : "border-border/50 hover:border-success/60 bg-card hover:bg-success/10"
            }`}
          >
            {isDone && <Check size={14} strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-md">
                Q{String(idx + 1).padStart(2, '0')}
              </span>
              {isDone && (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
              {hasNote && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  Note Added
                </span>
              )}
            </div>

            {/* Question text */}
            <h3
              className={`text-[17px] font-[650] leading-[1.65] mb-2.5 ${
                isDone ? "opacity-40 line-through text-foreground" : "text-foreground"
              }`}
            >
              {question.question}
            </h3>

            {/* Explanation */}
            {question.explanation && (
              <p
                className={`text-[14px] leading-[1.75] mb-4 ${
                  isDone ? "opacity-40" : "text-muted-foreground/80"
                }`}
              >
                {question.explanation}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/20">
              <button
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                  activeView === "theory"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={14} />
                Theory
              </button>

              {question.code && (
                <button
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                    activeView === "code"
                      ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Code2 size={14} />
                  Example
                </button>
              )}

              <button
                onClick={() => onOpenNote(question.id)}
                aria-label={hasNote ? "Edit note for this question" : "Add note for this question"}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                  hasNote
                    ? "bg-warning/15 text-warning hover:bg-warning/25"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote size={14} />
                {hasNote ? "Edit Note" : "Add Note"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expand panel */}
      <AnimatePresence>
        {activeView && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/20" />
            <div className="p-5 md:p-6 space-y-4">
              {activeView === "theory" && (
                <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/20 shadow-inner">
                  {renderTheoryContent(question.answer)}
                </div>
              )}
              {activeView === "code" && question.code && (
                <div className="rounded-xl overflow-hidden shadow-lg border border-border/30">
                  <CodeBlock
                    language={question.codeLanguage || "java"}
                    code={question.code}
                    title="Implementation"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Custom comparator — only re-render when props that affect the output change. */
function areQuestionCardsEqual(prev: QuestionCardProps, next: QuestionCardProps): boolean {
  return (
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.activeView === next.activeView &&
    prev.question.id === next.question.id &&
    prev.idx === next.idx
  );
}

const QuestionCard = memo(_QuestionCard, areQuestionCardsEqual);

export default function InterviewCoreJavaQuestionsPage() {
  const { language } = useParams<{ language?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [solutionViewMap, setSolutionViewMap] = useState<Record<string, SolutionView>>({});
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(false);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { setOpen: setGlobalSidebarOpen } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  // Auto-close global sidebar on mount for better reading experience
  useEffect(() => {
    const sidebarEl = document.querySelector('[data-sidebar="sidebar"]');
    const isExpanded = sidebarEl?.closest('[data-state="expanded"]') !== null;
    sidebarWasOpen.current = isExpanded;
    setGlobalSidebarOpen(false);

    return () => {
      if (sidebarWasOpen.current) {
        setGlobalSidebarOpen(true);
      }
    };
  }, [setGlobalSidebarOpen]);

  // Debounce search input by 300ms before applying to filter
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Escape key handler for note editor modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeNoteId) setActiveNoteId(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeNoteId]);

  // Escape key handler for notes panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showNotesPanel) setShowNotesPanel(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showNotesPanel]);

  const requireLogin = useCallback(
    (action: string) => {
      toast({
        title: "Please sign in",
        description: `Login is required to ${action}. Your saved progress and notes are stored per account in the database.`,
        variant: "destructive",
      });
      navigate("/auth");
    },
    [navigate, toast]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDoneMap({});
      setNotesMap({});
      return;
    }

    const loadUserState = async () => {
      const { data, error } = await supabase
        .from("core_java_user_state")
        .select("question_id, notes, is_completed")
        .eq("user_id", user.id);

      if (error) {
        console.warn("Could not load core_java_user_state:", error.message);
        return;
      }

      const done: Record<string, boolean> = {};
      const notes: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.is_completed) done[row.question_id] = true;
        if (row.notes) notes[row.question_id] = row.notes;
      }
      setDoneMap(done);
      setNotesMap(notes);
    };

    loadUserState();
  }, [authLoading, user]);

  const upsertUserState = useCallback(
    async (questionId: string, patch: Partial<{ notes: string; is_completed: boolean }>) => {
      if (!user) {
        requireLogin("save progress");
        return false;
      }

      setUpsertingId(questionId);
      const { error } = await supabase
        .from("core_java_user_state")
        .upsert(
          {
            user_id: user.id,
            question_id: questionId,
            ...patch,
          },
          { onConflict: "user_id,question_id" }
        );

      setUpsertingId(null);
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        return false;
      }
      return true;
    },
    [requireLogin, user, toast]
  );

  const toggleDone = useCallback(async (id: string) => {
    setDoneMap((prev) => {
      const nextValue = !prev[id];
      upsertUserState(id, { is_completed: nextValue }).then((ok) => {
        if (!ok) {
          // Revert if failed
          setDoneMap((innerPrev) => ({ ...innerPrev, [id]: !nextValue }));
        }
      });
      return { ...prev, [id]: nextValue };
    });
  }, [upsertUserState]);

  const openNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setNoteDraft(notesMap[id] || "");
  }, [notesMap]);

  const saveNote = async () => {
    if (!activeNoteId) return;
    const ok = await upsertUserState(activeNoteId, { notes: noteDraft });
    if (ok) {
      setNotesMap((prev) => ({ ...prev, [activeNoteId]: noteDraft }));
      setActiveNoteId(null);
      setNoteDraft("");
    }
  };

  const deleteNoteFromPanel = async (id: string) => {
    setDeletingNoteId(id);
    const ok = await upsertUserState(id, { notes: "" });
    if (ok) {
      setNotesMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setDeletingNoteId(null);
  };

  const toggleSolutionView = useCallback((id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({
      ...prev,
      [id]: prev[id] === view ? null : view,
    }));
  }, []);

  const totalQuestions = useMemo(
    () => coreJavaInterviewTopics.reduce((s, t) => s + t.questions.length, 0),
    []
  );
  const doneCount = useMemo(() => Object.values(doneMap).filter(Boolean).length, [doneMap]);
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredTopics = useMemo(() => {
    if (!debouncedSearch.trim() && !showOnlyUndone) return coreJavaInterviewTopics;
    const q = debouncedSearch.toLowerCase().trim();
    return coreJavaInterviewTopics
      .map((topic) => {
        const filtered = topic.questions.filter((question) => {
          const matchesSearch =
            !q ||
            question.question.toLowerCase().includes(q) ||
            (question.answer && question.answer.toLowerCase().includes(q));
          const matchesUndone = !showOnlyUndone || !doneMap[question.id];
          return matchesSearch && matchesUndone;
        });
        return { ...topic, questions: filtered };
      })
      .filter((t) => t.questions.length > 0);
  }, [debouncedSearch, showOnlyUndone, doneMap]);

  const downloadNotesPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.text("Core Java Interview Notes", 20, y);
    y += 15;

    Object.entries(notesMap).forEach(([id, note]) => {
      if (!note) return;
      const question = coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === id);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const qText = question?.question || id;
      const splitQ = doc.splitTextToSize(qText, 170);
      doc.text(splitQ, 20, y);
      y += splitQ.length * 7 + 2;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitNote = doc.splitTextToSize(note, 160);
      doc.text(splitNote, 25, y);
      y += splitNote.length * 6 + 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("Core-Java-Notes.pdf");
  };

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic((prev) => {
      const next = prev === topicId ? null : topicId;
      if (next) {
        setTimeout(() => {
          const el = document.getElementById(`topic-${next}`);
          if (el) {
            // Scroll taking the header into account
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black overflow-hidden">
      
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="shrink-0 bg-card/90 backdrop-blur-xl border-b border-border/30 relative z-30">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={() => navigate(backRoute)}
              className="group flex items-center justify-center w-9 h-9 rounded-full border border-border/40 bg-card hover:bg-muted/60 transition-all shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0 hidden sm:block">
                <Coffee size={16} className="text-primary" />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                Core Java <span className="text-primary">Q&A</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search questions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-border/40 bg-muted/20 rounded-full w-48 lg:w-64 outline-none focus:border-primary/50 focus:bg-card transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowOnlyUndone((v) => !v)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all shrink-0 hidden sm:block ${
                showOnlyUndone
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {showOnlyUndone ? "Show All" : "Undone Only"}
            </button>

            {/* Notes Modal Trigger */}
            <button
              onClick={() => setShowNotesPanel(true)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 shrink-0 transition-all"
            >
              <StickyNote size={14} />
              <span className="hidden sm:inline">Notes</span>
              {Object.keys(notesMap).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-warning/20 text-warning text-[11px] font-bold">
                  {Object.keys(notesMap).length}
                </span>
              )}
            </button>

            {/* Global sidebar toggle */}
            <AppTooltip content="Toggle App Sidebar">
              <button
                onClick={() => setGlobalSidebarOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-all ml-1"
                aria-label="Toggle App Sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </AppTooltip>

            {/* Mobile Topic Sidebar Toggle */}
            <button
              onClick={() => setTopicSidebarOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 lg:hidden transition-all"
              aria-label="Open Topics"
            >
              <BookOpen size={16} />
            </button>
          </div>
        </div>

        {/* Global Progress Bar under header */}
        <div className="h-[2px] w-full bg-muted/40 relative">
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 py-3 bg-card border-b border-border/20 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search questions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-border/40 bg-muted/20 rounded-full w-full outline-none focus:border-primary/50 focus:bg-card transition-all"
          />
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setShowOnlyUndone((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap shrink-0 ${
              showOnlyUndone
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 border-border/40 text-muted-foreground"
            }`}
          >
            {showOnlyUndone ? "Show All" : "Undone Only"}
          </button>
        </div>
      </div>

      {/* ── Main Layout (Sidebar + Content) ──────────────────────────── */}
      <div className="flex-1 overflow-hidden flex relative">
        
        {/* Permanent Desktop Sidebar */}
        <aside className="hidden lg:flex w-[280px] xl:w-[320px] shrink-0 border-r border-border/40 bg-card/30 flex-col overflow-y-auto">
          <div className="p-5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center justify-between">
              <span>Topics</span>
              <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-foreground/80 lowercase tracking-normal">
                {doneCount}/{totalQuestions} done
              </span>
            </h2>
            
            <button
              onClick={() => handleTopicClick("")} // Pass empty string or null to reset
              className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 border ${
                !selectedTopic
                  ? "bg-primary/10 border-primary/20 text-foreground"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📚</span>
                <span className="text-sm font-semibold">All Topics</span>
              </div>
            </button>
            
            <div className="space-y-1.5">
              {coreJavaInterviewTopics.map((topic) => {
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                const topicTotal = topic.questions.length;
                const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                const isActive = selectedTopic === topic.id;
                
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                      isActive
                        ? "bg-primary/5 border-primary/20 text-foreground shadow-sm"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-lg shrink-0">{topic.icon}</span>
                      <span className="text-[13px] font-semibold truncate flex-1 leading-tight">{topic.title}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">
                        {topicDone}/{topicTotal}
                      </span>
                    </div>
                    <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[800px] mx-auto p-4 md:p-6 lg:p-10 pb-32">
            
            <div className="space-y-12">
              {/* Sign-in nudge */}
              {!user && !authLoading && (
                <div className="p-5 rounded-2xl border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-warning mb-1">Your progress isn't being saved</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Sign in to permanently save your completed questions and personal notes across devices.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/auth")}
                    className="px-6 py-2.5 rounded-full bg-warning text-warning-foreground font-bold text-sm shrink-0 hover:bg-warning/90 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Empty state */}
              {filteredTopics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                    <Search size={28} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No questions found</h3>
                  <p className="text-[15px] text-muted-foreground">
                    Try adjusting your search query or removing the "Undone Only" filter.
                  </p>
                  {(searchQuery || showOnlyUndone) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowOnlyUndone(false);
                        setSelectedTopic(null);
                      }}
                      className="mt-6 px-6 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Topic groups */}
              {filteredTopics.map((topic) => {
                if (selectedTopic && topic.id !== selectedTopic) return null;
                return (
                  <div key={topic.id} id={`topic-${topic.id}`} className="space-y-5 scroll-mt-24">
                    {/* Topic header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-border/40">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                        {topic.icon}
                      </div>
                      <div>
                        <h2 className="text-[20px] font-bold tracking-tight text-foreground leading-tight">
                          {topic.title}
                        </h2>
                        <p className="text-[13px] text-muted-foreground/70 mt-0.5">
                          {topic.questions.length} questions
                        </p>
                      </div>
                    </div>

                    {/* Questions single-column list */}
                    <div className="space-y-4">
                      {topic.questions.map((question, idx) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          idx={idx}
                          isDone={!!doneMap[question.id]}
                          hasNote={!!notesMap[question.id]}
                          activeView={solutionViewMap[question.id] ?? null}
                          onToggleDone={toggleDone}
                          onToggleView={toggleSolutionView}
                          onOpenNote={openNote}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile/Overlay Topic Sidebar ─────────────────────────────── */}
      <AnimatePresence>
        {topicSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setTopicSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px] z-[70] bg-card border-r border-border/50 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-primary" />
                  <h2 className="text-[15px] font-bold tracking-tight">Knowledge Areas</h2>
                </div>
                <button
                  onClick={() => setTopicSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/80 transition-colors bg-muted/40"
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <button
                  onClick={() => {
                    handleTopicClick("");
                    setTopicSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all mb-2 border ${
                    !selectedTopic
                      ? "bg-primary/10 border-primary/20 text-foreground"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span className="text-[15px] font-semibold">All Topics</span>
                  </div>
                </button>

                {coreJavaInterviewTopics.map((topic) => {
                  const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                  const topicTotal = topic.questions.length;
                  const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                  const isActive = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        handleTopicClick(topic.id);
                        setTopicSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all border ${
                        isActive
                          ? "bg-primary/10 border-primary/20 text-foreground"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="text-xl leading-none">{topic.icon}</span>
                        <span className="text-[14px] font-semibold truncate flex-1">{topic.title}</span>
                        <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">
                          {topicDone}/{topicTotal}
                        </span>
                      </div>
                      <div className="ml-[36px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Note Editor Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {activeNoteId && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 sm:p-6">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setActiveNoteId(null)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-card border border-border/60 shadow-2xl rounded-[24px] overflow-hidden flex flex-col max-h-[90vh]"
              role="dialog"
              aria-labelledby="note-editor-title"
              aria-modal="true"
            >
              <div className="p-6 border-b border-border/30 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="note-editor-title" className="text-lg font-bold">
                      Study Note
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug line-clamp-2">
                      {coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === activeNoteId)?.question}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveNoteId(null)}
                    className="p-2 rounded-full hover:bg-muted/80 transition-colors bg-muted/40 shrink-0"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="bg-muted/20 rounded-2xl p-2 border border-border/30">
                  <Suspense
                    fallback={
                      <div className="h-64 rounded-xl bg-muted/30 animate-pulse flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Loading editor…</span>
                      </div>
                    }
                  >
                    <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} rows={12} />
                  </Suspense>
                </div>
              </div>

              <div className="p-6 pt-2 border-t border-border/30 shrink-0 flex items-center justify-end gap-3 bg-muted/10">
                <button
                  onClick={() => setActiveNoteId(null)}
                  className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={upsertingId === activeNoteId}
                  className="px-8 py-2.5 rounded-full bg-primary text-primary-foreground text-[14px] font-bold shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  {upsertingId === activeNoteId ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Note"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── All Notes Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotesPanel && (
          <div className="fixed inset-0 flex justify-end z-[100]">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowNotesPanel(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-card border-l border-border/50 shadow-2xl flex flex-col"
              role="dialog"
              aria-labelledby="notes-panel-title"
              aria-modal="true"
            >
              <div className="p-6 border-b border-border/30 flex items-center justify-between bg-card z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <StickyNote size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 id="notes-panel-title" className="text-lg font-bold leading-none">
                      My Notes
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      {Object.keys(notesMap).length} saved notes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AppTooltip content="Download PDF">
                    <button
                      onClick={downloadNotesPDF}
                      className="p-2.5 rounded-full border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Download notes as PDF"
                    >
                      <Download size={16} />
                    </button>
                  </AppTooltip>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="p-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close notes panel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
                {Object.keys(notesMap).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-6">
                      <StickyNote size={28} className="text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No notes yet</h3>
                    <p className="text-[14.5px] text-muted-foreground max-w-[250px]">
                      Add notes to questions while studying. They will appear here for review.
                    </p>
                  </div>
                )}
                {Object.entries(notesMap).map(([id, note]) => {
                  const questionData = coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === id);
                  return (
                    <div
                      key={id}
                      className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative group transition-all hover:border-border/60"
                    >
                      <div className="pr-8 mb-3">
                        <p className="font-bold text-[14.5px] leading-snug">
                          {questionData?.question || id}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNoteFromPanel(id)}
                        disabled={deletingNoteId === id}
                        className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 disabled:opacity-50"
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        {deletingNoteId === id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      <div className="bg-muted/20 rounded-xl p-4 border border-border/20">
                        <div
                          className="text-[13.5px] text-foreground/90 prose prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------------------
// Helper render functions
// -------------------------------------------------------------------------

/** Parse inline **bold** and `code` tokens */
function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\`[^\`]+\`)/g;
  let last = 0,
    k = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={k++} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={k++}
          className="font-mono text-[0.85em] font-medium px-1.5 py-[2px] rounded-md bg-primary/10 text-primary border border-primary/20 mx-[1px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <>{parts}</>;
}

function renderTheoryContent(answer: string): ReactNode {
  if (!answer) return null;
  const sections = answer.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-5 font-sans">
      {sections.map((section, idx) => {
        const lines = section.split("\n").filter(Boolean);
        const isBullet = lines.every((l) => l.trim().startsWith("- "));
        const isNumbered = lines.every((l) => /^\d+\./.test(l.trim()));
        const isHeading =
          lines.length === 1 &&
          (lines[0].startsWith("##") ||
            (lines[0].endsWith(":") && lines[0].length < 70) ||
            (lines[0].length < 55 && !lines[0].endsWith(".") && !lines[0].startsWith("-")));

        if (isHeading) {
          return (
            <div key={idx} className="flex items-center gap-2.5 pt-2">
              <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
              <h4 className="text-[15.5px] font-bold text-foreground tracking-tight">
                {lines[0].replace(/^#{1,3}\s*/, "").replace(/:$/, "")}
              </h4>
            </div>
          );
        }
        if (isBullet) {
          return (
            <ul key={idx} className="space-y-2.5">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-3 text-[14.5px] leading-[1.8] text-foreground/85">
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                  <span>{parseInline(l.replace(/^- /, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={idx} className="space-y-3">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-3.5 text-[14.5px] leading-[1.8]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold flex items-center justify-center mt-[3px]">
                    {i + 1}
                  </span>
                  <span className="text-foreground/85">{parseInline(l.replace(/^\d+\.\s*/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="space-y-2.5">
            {lines.map((l, i) => (
              <p key={i} className="text-[14.5px] leading-[1.85] text-foreground/85 max-w-[80ch]">
                {parseInline(l)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
