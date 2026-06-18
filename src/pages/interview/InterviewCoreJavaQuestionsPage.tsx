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

// Lazy-load the heavy RichTextNoteEditor so it doesn't bloat the initial bundle.
// It is only needed when the note modal opens.
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

function _QuestionCard({
  question,
  idx,
  isDone,
  hasNote,
  activeView,
  onToggleDone,
  onToggleView,
  onOpenNote,
}: QuestionCardProps) {
  return (
    <div className={`qa-card overflow-hidden ${isDone ? "completed" : ""}`}>
      {/* Card header */}
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          {/* Done toggle */}
          <button
            onClick={() => onToggleDone(question.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleDone(question.id);
              }
            }}
            title={isDone ? "Mark undone" : "Mark as done"}
            aria-label={isDone ? "Mark question as incomplete" : "Mark question as complete"}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isDone
                ? "bg-success border-success text-white"
                : "border-border/50 hover:border-success/60"
            }`}
          >
            {isDone && <Check size={10} strokeWidth={3.5} />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                Q{idx + 1}
              </span>
              {isDone && (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
              {hasNote && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  Note
                </span>
              )}
            </div>

            {/* Question text */}
            <h3
              style={{
                fontSize: "var(--qa-question-size)",
                lineHeight: "var(--qa-question-lh)",
                fontWeight: "var(--qa-question-fw)",
                letterSpacing: "var(--qa-question-ls)",
              }}
              className={`mb-2 ${
                isDone ? "opacity-40 line-through text-foreground" : "text-foreground"
              }`}
            >
              {question.question}
            </h3>

            {/* Explanation */}
            {question.explanation && (
              <p
                style={{
                  fontSize: "var(--qa-explanation-size)",
                  lineHeight: "var(--qa-explanation-lh)",
                }}
                className={`mb-3 ${
                  isDone ? "opacity-40" : "text-muted-foreground"
                }`}
              >
                {question.explanation}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/20">
              <button
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={activeView === "theory" ? "qa-btn-primary" : "qa-btn-secondary"}
              >
                <FileText size={12} />
                Theory
              </button>

              {question.code && (
                <button
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={activeView === "code" ? "qa-btn-primary" : "qa-btn-secondary"}
                >
                  <Code2 size={12} />
                  Example
                </button>
              )}

              <button
                onClick={() => onOpenNote(question.id)}
                aria-label={
                  hasNote ? "Edit note for this question" : "Add note for this question"
                }
                className={
                  hasNote
                    ? "qa-btn-secondary border-warning/30 text-warning bg-warning/10"
                    : "qa-btn-secondary"
                }
              >
                <StickyNote size={12} />
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
            <div className="p-4 md:p-5 space-y-4">
              {activeView === "theory" && (
                <div className="qa-expanded-content">
                  {renderTheoryContent(question.answer)}
                </div>
              )}
              {activeView === "code" && question.code && (
                <CodeBlock
                  language={question.codeLanguage || "java"}
                  code={question.code}
                  title="Implementation"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Custom comparator — only re-render when props that affect the output change. */
function areQuestionCardsEqual(
  prev: QuestionCardProps,
  next: QuestionCardProps,
): boolean {
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [solutionViewMap, setSolutionViewMap] = useState<Record<string, SolutionView>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(false);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const { setOpen: setGlobalSidebarOpen } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  // Escape key handler for note editor modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeNoteId) setActiveNoteId(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeNoteId]);

  // Escape key handler for notes panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotesPanel) setShowNotesPanel(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showNotesPanel]);

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
  }, []);

  const requireLogin = useCallback((action: string) => {
    toast({
      title: "Please sign in",
      description: `Login is required to ${action}. Your saved progress and notes are stored per account in the database.`,
      variant: "destructive",
    });
    navigate("/auth");
  }, [navigate, toast]);

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

  // Debounce search input by 300ms before applying to filter
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const upsertUserState = useCallback(async (
    questionId: string,
    patch: Partial<{ notes: string; is_completed: boolean }>,
  ) => {
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
        { onConflict: "user_id,question_id" },
      );

    setUpsertingId(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [requireLogin, user, toast]);

  const toggleDone = async (id: string) => {
    const nextValue = !doneMap[id];
    const ok = await upsertUserState(id, { is_completed: nextValue });
    if (ok) {
      setDoneMap((prev) => ({ ...prev, [id]: nextValue }));
    }
  };

  const openNote = (id: string) => {
    setActiveNoteId(id);
    setNoteDraft(notesMap[id] || "");
  };

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

  const toggleSolutionView = (id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({
      ...prev,
      [id]: prev[id] === view ? null : view,
    }));
  };

  const totalQuestions = useMemo(
    () => coreJavaInterviewTopics.reduce((s, t) => s + t.questions.length, 0),
    []
  );
  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap]
  );
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredTopics = useMemo(() => {
    if (!debouncedSearch.trim() && !showOnlyUndone) return coreJavaInterviewTopics;
    const q = debouncedSearch.toLowerCase().trim();
    return coreJavaInterviewTopics
      .map((topic) => {
        const filtered = topic.questions.filter((question) => {
          const matchesSearch = !q || question.question.toLowerCase().includes(q) || (question.answer && question.answer.toLowerCase().includes(q));
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
      const question = coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === id);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const qText = question?.question || id;
      const splitQ = doc.splitTextToSize(qText, 170);
      doc.text(splitQ, 20, y);
      y += (splitQ.length * 7) + 2;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitNote = doc.splitTextToSize(note, 160);
      doc.text(splitNote, 25, y);
      y += (splitNote.length * 6) + 10;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("Core-Java-Notes.pdf");
  };

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic((prev) => (prev === topicId ? null : topicId));
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 md:px-6 py-3.5 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(backRoute)}
              className="group flex items-center justify-center w-9 h-9 rounded-xl border border-border/30 bg-muted/30 transition-all hover:bg-muted"
            >
              <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Coffee size={16} className="text-primary" />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">
                Core Java <span className="text-primary">Q&A</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Progress pill */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/30 bg-muted/20 shrink-0"
              role="status"
              aria-label={`${doneCount} of ${totalQuestions} questions completed, ${progressPct} percent`}
            >
              <CheckCircle2 size={14} className="text-success" />
              <span className="text-xs font-bold" aria-live="polite">{doneCount}/{totalQuestions}</span>
              <div className="w-16 sm:w-24 h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))` }}
                />
              </div>
              <span className="text-[11px] font-bold text-success">{progressPct}%</span>
            </div>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search questions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-border/30 bg-muted/20 rounded-xl w-44 outline-none focus:border-primary/40 transition-all"
              />
            </div>

            {/* Undone/Show All Toggle */}
            <button
              onClick={() => setShowOnlyUndone(v => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                showOnlyUndone ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              {showOnlyUndone ? "Show All" : "Undone Only"}
            </button>

            {/* Notes button */}
            <button
              onClick={() => setShowNotesPanel(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted flex items-center gap-1.5 shrink-0"
            >
              <StickyNote size={13} />
              <span className="hidden sm:inline">Notes</span>
              {Object.keys(notesMap).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold">
                  {Object.keys(notesMap).length}
                </span>
              )}
            </button>

            {/* Global sidebar toggle */}
            <AppTooltip content="Toggle Global Sidebar">
              <button
                onClick={() => setGlobalSidebarOpen((prev) => !prev)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted flex items-center gap-1.5 shrink-0 transition-all"
                aria-label="Toggle Global Sidebar"
              >
                <PanelLeftOpen size={14} />
              </button>
            </AppTooltip>
          </div>
        </div>
      </div>

      {/* ── Layout: Main Content + Floating Sidebar ──────────────────── */}
      <div className="relative w-full">
        {/* Mobile search */}
        <div className="sm:hidden px-4 pt-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2.5 text-sm border border-border/30 bg-muted/20 rounded-xl w-full outline-none focus:border-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Floating topic sidebar toggle — visible when sidebar is closed */}
        {!topicSidebarOpen && (
          <button
            onClick={() => setTopicSidebarOpen(true)}
            className="fixed left-0 top-[25%] z-20 px-2 py-4 min-w-[44px] rounded-r-xl bg-card border border-border/40 border-l-0 shadow-lg hover:bg-muted transition-all group"
            aria-label="Open Topics"
          >
            <BookOpen size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {/* Main content */}
        <main className="w-full p-4 sm:p-6 xl:p-8 max-w-screen-2xl mx-auto">
          <div className="space-y-10">

            {/* Sign-in nudge */}
            {!user && !authLoading && (
              <div className="p-5 rounded-2xl border border-warning/30 bg-warning/5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-warning mb-0.5">Sync Disabled</h3>
                  <p className="text-xs text-muted-foreground">Sign in to save your progress permanently.</p>
                </div>
                <button onClick={() => navigate("/auth")} className="px-5 py-2 rounded-xl bg-warning text-warning-foreground font-bold text-xs shrink-0">Sign In</button>
              </div>
            )}

            {/* Topic groups */}
            {filteredTopics.map(topic => {
              if (selectedTopic && topic.id !== selectedTopic) return null;
              return (
                <div key={topic.id} id={`topic-${topic.id}`} className="space-y-4 scroll-mt-20">
                  {/* Topic header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">{topic.icon}</div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-foreground">{topic.title}</h2>
                      <p className="text-[11px] text-muted-foreground/60" aria-live="polite">{topic.questions.length} questions</p>
                    </div>
                  </div>

                  {/* Questions grid — responsive */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
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

            {/* Empty state when no questions match the current filters */}
            {filteredTopics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No questions found</h3>
                <p className="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Floating Topic Sidebar Overlay ───────────────────────────── */}
      <AnimatePresence>
        {topicSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setTopicSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-card border-r border-border/50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h2 className="text-sm font-bold tracking-tight">Knowledge Areas</h2>
                </div>
                <button
                  onClick={() => setTopicSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {coreJavaInterviewTopics.map(topic => {
                  const topicDone = topic.questions.filter(q => doneMap[q.id]).length;
                  const topicTotal = topic.questions.length;
                  const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                  const isActive = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        handleTopicClick(topic.id);
                        setTopicSidebarOpen(false);
                        setTimeout(() => {
                          const el = document.getElementById(`topic-${topic.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 350);
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-all border ${
                        isActive ? "bg-primary/10 border-primary/30 border-l-[3px] border-l-primary text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-base leading-none">{topic.icon}</span>
                        <span className="text-[13px] font-semibold truncate flex-1">{topic.title}</span>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">{topicDone}/{topicTotal}</span>
                      </div>
                      <div className="ml-0 h-[4px] rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pct === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
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
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setActiveNoteId(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="relative w-full max-w-2xl bg-card border border-border/50 rounded-3xl overflow-hidden p-8 space-y-5"
              role="dialog"
              aria-labelledby="note-editor-title"
              aria-modal="true"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="note-editor-title" className="text-lg font-bold">Study Note</h2>
                  {activeNoteId && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === activeNoteId)?.question}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setActiveNoteId(null)} 
                  aria-label="Close note editor"
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                {/* Lazy-loaded editor — only fetched when the modal first opens */}
                <Suspense
                  fallback={
                    <div className="h-48 rounded-lg bg-muted/30 animate-pulse flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/60">Loading editor…</span>
                    </div>
                  }
                >
                  <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} rows={10} />
                </Suspense>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActiveNoteId(null)}
                  autoFocus
                  className="px-5 py-2.5 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={upsertingId === activeNoteId}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-70 transition-opacity"
                >
                  {upsertingId === activeNoteId ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
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
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowNotesPanel(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="relative w-full max-w-2xl bg-card border border-border/50 rounded-3xl flex flex-col max-h-[80vh]"
              role="dialog"
              aria-labelledby="notes-panel-title"
              aria-modal="true"
            >
              <div className="p-6 border-b border-border/30 flex items-center justify-between">
                <h2 id="notes-panel-title" className="text-lg font-bold">My Notes</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadNotesPDF} 
                    aria-label="Download notes as PDF"
                    className="p-2 rounded-xl border border-border/30 hover:bg-muted"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => setShowNotesPanel(false)} 
                    aria-label="Close notes panel"
                    className="p-2 rounded-xl hover:bg-muted"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {Object.keys(notesMap).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <StickyNote size={40} className="opacity-30 mb-3" />
                    <p className="text-sm font-medium">No notes yet</p>
                    <p className="text-xs opacity-60 mt-1">Add notes to questions as you study</p>
                  </div>
                )}
                {Object.entries(notesMap).map(([id, note]) => (
                  <div key={id} className="p-4 rounded-xl bg-card border border-border/40 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <p className="font-semibold text-sm leading-snug">{coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === id)?.question || id}</p>
                      <button 
                        onClick={() => deleteNoteFromPanel(id)} 
                        title="Delete note" 
                        aria-label={`Delete note for ${coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === id)?.question || id}`}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground prose prose-invert" dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }} />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Parse inline **bold** and `code` tokens */
function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, k = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={k++} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={k++} className="font-mono text-[0.8em] px-1.5 py-[2px] rounded bg-primary/10 text-primary border border-primary/20 mx-[1px]">{token.slice(1, -1)}</code>);
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
    <div className="space-y-4 font-sans">
      {sections.map((section, idx) => {
        const lines = section.split("\n").filter(Boolean);
        const isBullet = lines.every(l => l.trim().startsWith("- "));
        const isNumbered = lines.every(l => /^\d+\./.test(l.trim()));
        const isHeading =
          lines.length === 1 &&
          (lines[0].startsWith("##") ||
            (lines[0].endsWith(":") && lines[0].length < 70) ||
            (lines[0].length < 55 && !lines[0].endsWith(".") && !lines[0].startsWith("-")));

        if (isHeading) {
          return (
            <div key={idx} className="flex items-center gap-2 pt-1">
              <span className="w-[3px] h-4 rounded-full bg-primary shrink-0" />
              <h4 className="text-[14px] font-bold text-foreground">
                {lines[0].replace(/^#{1,3}\s*/, "").replace(/:$/, "")}
              </h4>
            </div>
          );
        }
        if (isBullet) {
          return (
            <ul key={idx} className="space-y-2">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.8] text-foreground/80">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span>{parseInline(l.replace(/^- /, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={idx} className="space-y-2.5">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] leading-[1.8]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-[2px]">{i + 1}</span>
                  <span className="text-foreground/80">{parseInline(l.replace(/^\d+\.\s*/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="space-y-2">
            {lines.map((l, i) => (
              <p key={i} className="text-[13px] leading-[1.85] text-foreground/80 max-w-[78ch]">{parseInline(l)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
