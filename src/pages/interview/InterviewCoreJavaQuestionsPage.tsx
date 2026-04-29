import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  StickyNote,
  X,
  Save,
  Search,
  Coffee,
  BookOpen,
  Check,
  Loader2,
  FileText,
  Code2,
  Download,
  Trash2,
  ChevronDown,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { CodeBlock } from "@/components/CodeBlock";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";
import jsPDF from "jspdf";
import { AppTooltip } from "@/components/ui/tooltip";

type SolutionView = "theory" | "code" | null;

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
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(true);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

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
    if (!searchQuery.trim() && !showOnlyUndone) return coreJavaInterviewTopics;
    const q = searchQuery.toLowerCase().trim();
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
  }, [searchQuery, showOnlyUndone, doneMap]);

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


  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 md:px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(backRoute)}
                className="group flex items-center justify-center w-9 h-9 rounded-xl border border-border/30 bg-muted/30 transition-all hover:bg-muted"
              >
                <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Coffee size={16} className="text-primary" />
                </div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">
                  Core Java <span className="text-primary">Q&A</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Progress pill */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border/30 bg-muted/20">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-xs font-bold">{doneCount}/{totalQuestions}</span>
                <div className="w-20 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    className="h-full rounded-full bg-success"
                  />
                </div>
                <span className="text-[11px] font-bold text-success">{progressPct}%</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search questions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs border border-border/30 bg-muted/20 rounded-xl w-44 outline-none focus:border-primary/40 transition-all"
                />
              </div>

              {/* Toggles */}
              <AppTooltip content="Toggle Sidebar">
                <button
                  onClick={() => setTopicSidebarOpen(v => !v)}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold border transition-all ${
                    topicSidebarOpen ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted"
                  }`}
                  aria-label="Toggle Sidebar"
                >
                  <BookOpen size={13} />
                  <span className="hidden sm:inline">Topics</span>
                </button>
              </AppTooltip>

              <button
                onClick={() => setShowOnlyUndone(v => !v)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  showOnlyUndone ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                {showOnlyUndone ? "Show All" : "Undone Only"}
              </button>

              <button
                onClick={() => setShowNotesPanel(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted flex items-center gap-1.5"
              >
                <StickyNote size={13} />
                Notes ({Object.keys(notesMap).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layout: Sidebar + Main ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative">
        {/* Sidebar */}
        {topicSidebarOpen && (
          <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border/30 bg-card/20 lg:sticky top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto p-4 z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3 px-1">Knowledge Areas</p>
            <div className="space-y-1">
              {coreJavaInterviewTopics.map(topic => {
                const topicDone = topic.questions.filter(q => doneMap[q.id]).length;
                const topicTotal = topic.questions.length;
                const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                const isActive = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(isActive ? null : topic.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border ${
                      isActive ? "bg-primary/10 border-primary/20 text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-base leading-none">{topic.icon}</span>
                      <span className="text-[12px] font-semibold truncate flex-1">{topic.title}</span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{topicDone}/{topicTotal}</span>
                    </div>
                    <div className="ml-7 h-[3px] rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: pct === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 relative">
          <div className="max-w-3xl mx-auto space-y-10">

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
                <div key={topic.id} className="space-y-3">
                  {/* Topic header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">{topic.icon}</div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-foreground">{topic.title}</h2>
                      <p className="text-[11px] text-muted-foreground/60">{topic.questions.length} questions</p>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-2.5">
                    {topic.questions.map((question, idx) => {
                      const isDone = doneMap[question.id];
                      const hasNote = !!notesMap[question.id];
                      const activeView = solutionViewMap[question.id];

                      return (
                        <div
                          key={question.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isDone ? "bg-success/5 border-success/20" : "bg-card border-border/40 hover:border-border/60"
                          }`}
                        >
                          {/* Card header */}
                          <div className="p-4 md:p-5">
                            <div className="flex items-start gap-3">
                              {/* Done toggle */}
                              <button
                                onClick={() => toggleDone(question.id)}
                                title={isDone ? "Mark undone" : "Mark as done"}
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isDone ? "bg-success border-success text-white" : "border-border/50 hover:border-success/60"
                                }`}
                              >
                                {isDone && <Check size={10} strokeWidth={3.5} />}
                              </button>

                              <div className="flex-1 min-w-0">
                                {/* Meta row */}
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">Q{idx + 1}</span>
                                  {isDone && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Done</span>}
                                  {hasNote && <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">Note</span>}
                                </div>

                                {/* Question text */}
                                <h3 className={`text-[15px] font-semibold leading-snug mb-2 ${isDone ? "opacity-40 line-through" : "text-foreground"}`}>
                                  {question.question}
                                </h3>

                                {/* Explanation */}
                                {question.explanation && (
                                  <p className={`text-[13px] leading-relaxed mb-3 ${isDone ? "opacity-40" : "text-muted-foreground"}`}>
                                    {question.explanation}
                                  </p>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/20">
                                  <button
                                    onClick={() => toggleSolutionView(question.id, "theory")}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                      activeView === "theory"
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                  >
                                    <FileText size={12} />
                                    Theory
                                  </button>

                                  {question.code && (
                                    <button
                                      onClick={() => toggleSolutionView(question.id, "code")}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                        activeView === "code"
                                          ? "bg-accent text-accent-foreground border-accent"
                                          : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      }`}
                                    >
                                      <Code2 size={12} />
                                      Example
                                    </button>
                                  )}

                                  <button
                                    onClick={() => openNote(question.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                      hasNote
                                        ? "text-warning bg-warning/10 border-warning/30"
                                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
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
                                    <div className="bg-muted/20 rounded-xl p-4 md:p-5 border border-border/20">
                                      {renderTheoryContent(question.answer)}
                                    </div>
                                  )}
                                  {activeView === "code" && question.code && (
                                    <CodeBlock language={question.codeLanguage || "java"} code={question.code} title="Implementation" />
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* ── Note Editor Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {activeNoteId && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setActiveNoteId(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-card border border-border/50 rounded-3xl overflow-hidden p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Study Note</h2>
                <button onClick={() => setActiveNoteId(null)} className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} rows={10} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveNoteId(null)} className="px-5 py-2.5 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                <button onClick={saveNote} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Save Note</button>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-card border border-border/50 rounded-3xl flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-border/30 flex items-center justify-between">
                <h2 className="text-lg font-bold">My Notes</h2>
                <div className="flex items-center gap-2">
                  <button onClick={downloadNotesPDF} className="p-2 rounded-xl border border-border/30 hover:bg-muted"><Download size={16} /></button>
                  <button onClick={() => setShowNotesPanel(false)} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {Object.entries(notesMap).map(([id, note]) => (
                  <div key={id} className="p-4 rounded-xl bg-muted/10 border border-border/30">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <p className="font-semibold text-sm leading-snug">{coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === id)?.question || id}</p>
                      <button onClick={() => deleteNoteFromPanel(id)} className="text-destructive hover:text-destructive/80 shrink-0"><Trash2 size={14} /></button>
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
