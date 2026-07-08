import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  StickyNote,
  X,
  Search,
  BookOpen,
  FileText,
  Code2,
  Download,
  Trash2,
  PanelLeftOpen,
  Loader2,
  Layers,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { systemDesignTopics } from "@/data/systemDesignInterviewData";
import type { SystemDesignQuestion } from "@/data/systemDesignInterviewData";
import { CodeBlock } from "@/components/CodeBlock";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";
import jsPDF from "jspdf";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";

type SolutionView = "theory" | "code" | "visual" | null;

// ─── QuestionCard ────────────────────────────────────────────────────────────
interface QuestionCardProps {
  question: SystemDesignQuestion;
  idx: number;
  isDone: boolean;
  hasNote: boolean;
  activeView: SolutionView;
  onToggleDone: (id: string) => void;
  onToggleView: (id: string, view: Exclude<SolutionView, null>) => void;
  onOpenNote: (id: string) => void;
}

function renderTheoryContent(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        let k = 0;
        while ((m = regex.exec(line)) !== null) {
          if (m.index > last) parts.push(line.slice(last, m.index));
          parts.push(<strong key={k++} className="font-bold text-foreground">{m[2]}</strong>);
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(line.slice(last));
        const content = parts.length ? parts : line;
        if (line.startsWith("**") && line.endsWith("**") && line.indexOf("**", 2) === line.length - 2) {
          return <p key={i} className="text-[17px] font-bold text-primary mt-5 mb-2">{line.replace(/\*\*/g, "")}</p>;
        }
        return <p key={i} className="text-[16px] leading-[1.9] text-foreground/90">{content}</p>;
      })}
    </div>
  );
}

const _QuestionCard = ({
  question, idx, isDone, hasNote, activeView,
  onToggleDone, onToggleView, onOpenNote,
}: QuestionCardProps) => {
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden relative ${
      isDone ? "bg-success/5 border-success/20"
        : activeView ? "bg-card border-primary/30 shadow-sm"
        : "bg-card border-border/40 hover:border-border/60"
    }`}>
      {activeView && !isDone && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
      )}
      <div className="p-5 md:p-7">
        <div className="flex items-start gap-4">
          <button
            onClick={() => onToggleDone(question.id)}
            title={isDone ? "Mark undone" : "Mark as done"}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-95 ${
              isDone ? "bg-success border-success text-white shadow-sm"
                : "border-border/50 hover:border-success/60 bg-card hover:bg-success/10"
            }`}
          >
            {isDone && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-md">
                Q{String(idx + 1).padStart(2, "0")}
              </span>
              {isDone && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Done</span>}
              {hasNote && <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">Note Added</span>}
              {question.diagram && <span className="text-[10px] font-bold text-info bg-info/10 px-2 py-0.5 rounded-full">Visual</span>}
            </div>
            <h3 className={`text-[20px] font-[700] leading-[1.55] mb-3 ${isDone ? "opacity-40 line-through text-foreground" : "text-foreground"}`}>
              {question.question}
            </h3>
            {question.explanation && (
              <p className={`text-[16px] leading-[1.8] mb-5 ${isDone ? "opacity-40" : "text-muted-foreground"}`}>
                {question.explanation}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-border/20">
              <button
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                  activeView === "theory" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={15} /> Theory
              </button>
              {question.diagram && (
                <button
                  onClick={() => onToggleView(question.id, "visual")}
                  aria-expanded={activeView === "visual"}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                    activeView === "visual" ? "bg-info text-white shadow-md shadow-info/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <BarChart2 size={15} /> Visual
                </button>
              )}
              {question.code && (
                <button
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                    activeView === "code" ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Code2 size={15} /> Code
                </button>
              )}
              <button
                onClick={() => onOpenNote(question.id)}
                aria-label={hasNote ? "Edit note" : "Add note"}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                  hasNote ? "bg-warning/15 text-warning hover:bg-warning/25"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote size={15} /> {hasNote ? "Edit Note" : "Add Note"}
              </button>
            </div>
          </div>
        </div>
      </div>
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
            <div className="p-5 md:p-7 space-y-4">
              {activeView === "theory" && (
                <div className="bg-muted/30 rounded-xl p-6 md:p-8 border border-border/20 shadow-inner">
                  {renderTheoryContent(question.answer)}
                </div>
              )}
              {activeView === "visual" && question.diagram && (
                <div className="overflow-x-auto">
                  <DiagramRenderer diagram={question.diagram} />
                </div>
              )}
              {activeView === "code" && question.code && (
                <div className="rounded-xl overflow-hidden shadow-lg border border-border/30">
                  <CodeBlock language={question.codeLanguage || "java"} code={question.code} title="Example" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function areCardsEqual(prev: QuestionCardProps, next: QuestionCardProps) {
  return (
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.activeView === next.activeView &&
    prev.question.id === next.question.id &&
    prev.idx === next.idx
  );
}

const QuestionCard = memo(_QuestionCard, areCardsEqual);

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function InterviewSystemDesignPage() {
  const { language } = useParams<{ language?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Close global sidebar for better reading
  useEffect(() => {
    const sidebarEl = document.querySelector('[data-sidebar="sidebar"]');
    const isExpanded = sidebarEl?.closest('[data-state="expanded"]') !== null;
    sidebarWasOpen.current = isExpanded;
    setGlobalSidebarOpen(false);
    return () => { if (sidebarWasOpen.current) setGlobalSidebarOpen(true); };
  }, [setGlobalSidebarOpen]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Escape closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeNoteId) setActiveNoteId(null);
        if (showNotesPanel) setShowNotesPanel(false);
        if (topicSidebarOpen) setTopicSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNoteId, showNotesPanel, topicSidebarOpen]);

  // Hash-based deep link: auto-scroll and expand question
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
        setSolutionViewMap((prev) => ({ ...prev, [hash]: "theory" }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [location.hash]);

  // Load user state from Supabase
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setDoneMap({}); setNotesMap({}); return; }
    (async () => {
      const { data, error } = await supabase
        .from("system_design_user_state")
        .select("question_id, notes, is_completed")
        .eq("user_id", user.id);
      if (error) { console.warn("Could not load system_design_user_state:", error.message); return; }
      const done: Record<string, boolean> = {};
      const notes: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.is_completed) done[row.question_id] = true;
        if (row.notes) notes[row.question_id] = row.notes;
      }
      setDoneMap(done);
      setNotesMap(notes);
    })();
  }, [authLoading, user]);

  const requireLogin = useCallback((action: string) => {
    toast({ title: "Please sign in", description: `Login required to ${action}.`, variant: "destructive" });
    navigate("/auth");
  }, [navigate, toast]);

  const upsertUserState = useCallback(async (
    questionId: string,
    patch: Partial<{ notes: string; is_completed: boolean }>
  ) => {
    if (!user) { requireLogin("save progress"); return false; }
    setUpsertingId(questionId);
    const { error } = await supabase
      .from("system_design_user_state")
      .upsert({ user_id: user.id, question_id: questionId, ...patch }, { onConflict: "user_id,question_id" });
    setUpsertingId(null);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return false; }
    return true;
  }, [user, requireLogin, toast]);

  const toggleDone = useCallback(async (id: string) => {
    setDoneMap((prev) => {
      const next = !prev[id];
      upsertUserState(id, { is_completed: next }).then((ok) => {
        if (!ok) setDoneMap((p) => ({ ...p, [id]: !next }));
      });
      return { ...prev, [id]: next };
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
    if (ok) setNotesMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setDeletingNoteId(null);
  };

  const toggleSolutionView = useCallback((id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({ ...prev, [id]: prev[id] === view ? null : view }));
  }, []);

  const totalQuestions = useMemo(
    () => systemDesignTopics.reduce((s, t) => s + t.questions.length, 0), []
  );
  const doneCount = useMemo(() => Object.values(doneMap).filter(Boolean).length, [doneMap]);
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredTopics = useMemo(() => {
    if (!debouncedSearch.trim() && !showOnlyUndone) return systemDesignTopics;
    const q = debouncedSearch.toLowerCase().trim();
    return systemDesignTopics.map((topic) => ({
      ...topic,
      questions: topic.questions.filter((question) => {
        const matchesSearch = !q ||
          question.question.toLowerCase().includes(q) ||
          question.answer.toLowerCase().includes(q);
        const matchesUndone = !showOnlyUndone || !doneMap[question.id];
        return matchesSearch && matchesUndone;
      }),
    })).filter((t) => t.questions.length > 0);
  }, [debouncedSearch, showOnlyUndone, doneMap]);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic((prev) => {
      const next = prev === topicId ? null : topicId;
      if (next) {
        setTimeout(() => {
          const el = document.getElementById(`topic-${next}`);
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return next;
    });
  };

  const downloadNotesPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.text("System Design Interview Notes", 20, y);
    y += 15;
    Object.entries(notesMap).forEach(([id, note]) => {
      if (!note) return;
      const question = systemDesignTopics.flatMap((t) => t.questions).find((q) => q.id === id);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const splitQ = doc.splitTextToSize(question?.question || id, 170);
      doc.text(splitQ, 20, y);
      y += splitQ.length * 7 + 2;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitNote = doc.splitTextToSize(note, 160);
      doc.text(splitNote, 25, y);
      y += splitNote.length * 6 + 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("System-Design-Notes.pdf");
  };

  const allQuestions = useMemo(() => systemDesignTopics.flatMap((t) => t.questions), []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black">

      {/* ── Header ── */}
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
                <Layers size={16} className="text-primary" />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                System <span className="text-primary">Design</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
            {/* Desktop search */}
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

            {/* Undone filter */}
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

            {/* Notes panel */}
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
                aria-label="Toggle Sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </AppTooltip>

            {/* Mobile topic sidebar */}
            <button
              onClick={() => setTopicSidebarOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 lg:hidden transition-all"
              aria-label="Open Topics"
            >
              <BookOpen size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] w-full bg-muted/40 relative">
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      {/* Mobile search */}
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
              showOnlyUndone ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border/40 text-muted-foreground"
            }`}
          >
            {showOnlyUndone ? "Show All" : "Undone Only"}
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex relative" style={{ minHeight: 0 }}>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[260px] xl:w-[300px] shrink-0 border-r border-border/40 bg-card/30 flex-col overflow-y-auto sticky top-0 self-start" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          <div className="p-5 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center justify-between">
              <span>Topics</span>
              <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-foreground/80 lowercase tracking-normal">
                {doneCount}/{totalQuestions} done
              </span>
            </h2>

            <button
              onClick={() => handleTopicClick("")}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 border ${
                !selectedTopic ? "bg-primary/10 border-primary/20 text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏗️</span>
                <span className="text-sm font-semibold">All Topics</span>
              </div>
            </button>

            <div className="space-y-1.5">
              {systemDesignTopics.map((topic) => {
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                const pct = topic.questions.length > 0 ? Math.round((topicDone / topic.questions.length) * 100) : 0;
                const isActive = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                      isActive ? "bg-primary/5 border-primary/20 text-foreground shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-lg shrink-0">{topic.icon}</span>
                      <span className="text-[13px] font-semibold truncate flex-1 leading-tight">{topic.title}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">{topicDone}/{topic.questions.length}</span>
                    </div>
                    <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mobile topic sidebar overlay */}
        <AnimatePresence>
          {topicSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setTopicSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border/40 z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Topics</h2>
                    <button onClick={() => setTopicSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {systemDesignTopics.map((topic) => {
                      const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                      const pct = topic.questions.length > 0 ? Math.round((topicDone / topic.questions.length) * 100) : 0;
                      return (
                        <button
                          key={topic.id}
                          onClick={() => { handleTopicClick(topic.id); setTopicSidebarOpen(false); }}
                          className="w-full text-left px-4 py-3 rounded-xl transition-all border bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg shrink-0">{topic.icon}</span>
                            <span className="text-[13px] font-semibold truncate flex-1">{topic.title}</span>
                            <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">{topicDone}/{topic.questions.length}</span>
                          </div>
                          <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(var(--primary))" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full px-4 md:px-8 lg:px-10 xl:px-14 py-6 pb-24">
            <div className="space-y-10">

              {/* Sign-in nudge */}
              {!user && !authLoading && (
                <div className="p-5 rounded-2xl border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-warning mb-1">Your progress isn't being saved</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Sign in to permanently save your progress and notes across devices.
                    </p>
                  </div>
                  <button onClick={() => navigate("/auth")} className="px-6 py-2.5 rounded-full bg-warning text-warning-foreground font-bold text-sm shrink-0 hover:bg-warning/90 transition-colors">
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
                  <p className="text-[15px] text-muted-foreground">Try adjusting your search or removing filters.</p>
                  {(searchQuery || showOnlyUndone) && (
                    <button
                      onClick={() => { setSearchQuery(""); setShowOnlyUndone(false); setSelectedTopic(null); }}
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
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                return (
                  <div key={topic.id} id={`topic-${topic.id}`} className="space-y-5 scroll-mt-24">
                    {/* Topic header */}
                    <div className="flex items-center gap-4 pb-5 border-b-2 border-border/30">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
                        {topic.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[22px] font-black tracking-tight">{topic.title}</h2>
                        <p className="text-[14px] text-muted-foreground font-medium">
                          {topicDone}/{topic.questions.length} completed
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-32 h-[4px] rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${topic.questions.length > 0 ? Math.round((topicDone / topic.questions.length) * 100) : 0}%`,
                              background: topicDone === topic.questions.length ? "hsl(var(--success))" : "hsl(var(--primary))"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Question cards */}
                    <div className="space-y-4">
                      {topic.questions.map((question, idx) => (
                        <div key={question.id} id={question.id}>
                          <QuestionCard
                            question={question}
                            idx={idx}
                            isDone={!!doneMap[question.id]}
                            hasNote={!!notesMap[question.id]}
                            activeView={solutionViewMap[question.id] ?? null}
                            onToggleDone={toggleDone}
                            onToggleView={toggleSolutionView}
                            onOpenNote={openNote}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* ── Note Editor Modal ── */}
      <AnimatePresence>
        {activeNoteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setActiveNoteId(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <div>
                  <h3 className="font-bold text-base">Add Note</h3>
                  <p className="text-[12px] text-muted-foreground/60 mt-0.5 line-clamp-1">
                    {allQuestions.find((q) => q.id === activeNoteId)?.question}
                  </p>
                </div>
                <button onClick={() => setActiveNoteId(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} placeholder="Write your notes, key insights, or personal mnemonics…" />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-5">
                <button onClick={() => setActiveNoteId(null)} className="px-5 py-2 rounded-full text-sm font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={!!upsertingId}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {upsertingId ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notes Panel ── */}
      <AnimatePresence>
        {showNotesPanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-stretch justify-end"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowNotesPanel(false)}
          >
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-card border-l border-border/40 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
                <div>
                  <h3 className="font-bold text-base">My Notes</h3>
                  <p className="text-[12px] text-muted-foreground/60">{Object.keys(notesMap).length} note{Object.keys(notesMap).length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {Object.keys(notesMap).length > 0 && (
                    <button
                      onClick={downloadNotesPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Download size={12} /> Export PDF
                    </button>
                  )}
                  <button onClick={() => setShowNotesPanel(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {Object.keys(notesMap).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                    <StickyNote size={32} className="text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground/60">No notes yet</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Add notes on individual questions</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {Object.entries(notesMap).map(([id, note]) => {
                      if (!note) return null;
                      const question = allQuestions.find((q) => q.id === id);
                      return (
                        <div key={id} className="rounded-2xl border border-border/30 bg-muted/20 p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2 flex-1">
                              {question?.question || id}
                            </p>
                            <button
                              onClick={() => deleteNoteFromPanel(id)}
                              disabled={deletingNoteId === id}
                              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              aria-label="Delete note"
                            >
                              {deletingNoteId === id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                          <div
                            className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-4 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }}
                          />
                          <button
                            onClick={() => { openNote(id); setShowNotesPanel(false); }}
                            className="mt-2 text-[11px] font-semibold text-primary hover:underline"
                          >
                            Edit note →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
