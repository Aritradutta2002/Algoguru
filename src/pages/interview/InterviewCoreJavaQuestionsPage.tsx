import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Check,
  FileText,
  Code2,
  Download,
  Trash2,
  ChevronDown,
  ListTree,
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
import { useSidebar } from "@/components/ui/sidebar";

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
  const [solutionViewMap, setSolutionViewMap] = useState<Record<string, SolutionView>>({});
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [tocOpen, setTocOpen] = useState(false);

  const { setOpen: setGlobalSidebarOpen } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      description: `Login is required to ${action}.`,
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
      if (error) return;
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
    if (!user) { requireLogin("save progress"); return false; }
    setUpsertingId(questionId);
    const { error } = await supabase
      .from("core_java_user_state")
      .upsert({ user_id: user.id, question_id: questionId, ...patch }, { onConflict: "user_id,question_id" });
    setUpsertingId(null);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return false; }
    return true;
  }, [requireLogin, user, toast]);

  const toggleDone = async (id: string) => {
    const nextValue = !doneMap[id];
    const ok = await upsertUserState(id, { is_completed: nextValue });
    if (ok) setDoneMap((prev) => ({ ...prev, [id]: nextValue }));
  };

  const openNote = (id: string) => { setActiveNoteId(id); setNoteDraft(notesMap[id] || ""); };

  const saveNote = async () => {
    if (!activeNoteId) return;
    const ok = await upsertUserState(activeNoteId, { notes: noteDraft });
    if (ok) { setNotesMap((prev) => ({ ...prev, [activeNoteId]: noteDraft })); setActiveNoteId(null); setNoteDraft(""); }
  };

  const deleteNoteFromPanel = async (id: string) => {
    setDeletingNoteId(id);
    const ok = await upsertUserState(id, { notes: "" });
    if (ok) { setNotesMap((prev) => { const n = { ...prev }; delete n[id]; return n; }); }
    setDeletingNoteId(null);
  };

  const toggleSolutionView = (id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({ ...prev, [id]: prev[id] === view ? null : view }));
  };

  const totalQuestions = useMemo(() => coreJavaInterviewTopics.reduce((s, t) => s + t.questions.length, 0), []);
  const doneCount = useMemo(() => Object.values(doneMap).filter(Boolean).length, [doneMap]);
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const scrollToTopic = (topicId: string) => {
    sectionRefs.current[topicId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim() && !showOnlyUndone) return coreJavaInterviewTopics;
    const q = searchQuery.toLowerCase().trim();
    return coreJavaInterviewTopics.map((topic) => {
      const filtered = topic.questions.filter((qst) => {
        const ms = !q || qst.question.toLowerCase().includes(q) || (qst.answer && qst.answer.toLowerCase().includes(q));
        return ms && (!showOnlyUndone || !doneMap[qst.id]);
      });
      return { ...topic, questions: filtered };
    }).filter((t) => t.questions.length > 0);
  }, [searchQuery, showOnlyUndone, doneMap]);

  const downloadNotesPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.text("Core Java Interview Notes", 20, y);
    y += 15;
    Object.entries(notesMap).forEach(([id, note]) => {
      if (!note) return;
      const q = coreJavaInterviewTopics.flatMap(t => t.questions).find(qst => qst.id === id);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      const qt = q?.question || id;
      const sq = doc.splitTextToSize(qt, 170);
      doc.text(sq, 20, y); y += (sq.length * 7) + 2;
      doc.setFontSize(11); doc.setFont("helvetica", "normal");
      const sn = doc.splitTextToSize(note, 160);
      doc.text(sn, 25, y); y += (sn.length * 6) + 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("Core-Java-Notes.pdf");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Minimal Top Bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/20 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-14">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(backRoute)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={15} className="text-muted-foreground" />
            </button>
            <Coffee size={18} className="text-primary shrink-0" />
            <h1 className="text-sm font-bold tracking-tight">
              Core Java <span className="text-primary">Q&A</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/20 bg-muted/10">
              <CheckCircle2 size={12} className="text-success" />
              <span className="text-[11px] font-semibold tabular-nums">{doneCount}/{totalQuestions}</span>
              <div className="w-12 h-1 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-border/20 bg-muted/10 rounded-lg w-36 outline-none focus:border-primary/30 focus:w-48 transition-all"
              />
            </div>

            {/* Undone filter */}
            <button
              onClick={() => setShowOnlyUndone(v => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                showOnlyUndone ? "bg-primary text-primary-foreground border-primary" : "border-border/20 text-muted-foreground hover:bg-muted"
              }`}
            >
              {showOnlyUndone ? "Show All" : "Pending"}
            </button>

            {/* TOC toggle */}
            <button
              onClick={() => setTocOpen(v => !v)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border/20 text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"
              aria-label="Table of Contents"
            >
              <ListTree size={13} />
              <span className="hidden md:inline">Topics</span>
            </button>

            {/* Notes */}
            <button
              onClick={() => setShowNotesPanel(true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border/20 text-muted-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"
            >
              <StickyNote size={13} />
              <span className="hidden sm:inline">{Object.keys(notesMap).length}</span>
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-border/20 bg-muted/10 rounded-lg w-full outline-none focus:border-primary/30 transition-all"
            />
          </div>
        </div>
      </header>

      {/* ── Reading Layout ───────────────────────────────────────── */}
      <div className="flex">
        {/* Sticky TOC sidebar — desktop */}
        <aside className="hidden xl:block w-56 shrink-0">
          <nav className="sticky top-14 p-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-3 px-2">On This Page</p>
            <div className="space-y-0.5">
              {coreJavaInterviewTopics.map((topic) => {
                const topicDone = topic.questions.filter(q => doneMap[q.id]).length;
                const topicTotal = topic.questions.length;
                const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                return (
                  <button
                    key={topic.id}
                    onClick={() => scrollToTopic(topic.id)}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-none">{topic.icon}</span>
                      <span className="truncate flex-1">{topic.title}</span>
                      <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">{topicDone}/{topicTotal}</span>
                    </div>
                    {pct > 0 && (
                      <div className="ml-7 mt-1.5 h-0.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main reading column */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-8 py-8 md:py-12">
          <div className="max-w-[65ch] mx-auto">

            {/* Sign-in nudge */}
            {!user && !authLoading && (
              <div className="mb-10 p-4 rounded-xl border border-warning/20 bg-warning/5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-warning">Sign in to save your progress</p>
                  <p className="text-[11px] text-muted-foreground">Track completed questions and notes across sessions.</p>
                </div>
                <button onClick={() => navigate("/auth")} className="px-4 py-1.5 rounded-lg bg-warning text-warning-foreground font-bold text-[11px] shrink-0">Sign In</button>
              </div>
            )}

            {/* Topic sections */}
            {filteredTopics.length === 0 && (
              <div className="text-center py-20">
                <p className="text-sm text-muted-foreground">No questions match your filters.</p>
                <button onClick={() => { setSearchQuery(""); setShowOnlyUndone(false); }} className="mt-2 text-xs text-primary hover:underline">Clear filters</button>
              </div>
            )}

            {filteredTopics.map((topic) => (
              <section
                key={topic.id}
                id={`topic-${topic.id}`}
                ref={(el) => { sectionRefs.current[topic.id] = el; }}
                className="mb-14"
              >
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
                    {topic.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{topic.title}</h2>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{topic.questions.length} questions</p>
                  </div>
                </div>

                {/* Question list — flowing article style */}
                <div className="space-y-6">
                  {topic.questions.map((question, idx) => {
                    const isDone = doneMap[question.id];
                    const hasNote = !!notesMap[question.id];
                    const activeView = solutionViewMap[question.id];

                    return (
                      <article
                        key={question.id}
                        id={`q-${question.id}`}
                        className={`group/q relative pl-8 ${
                          isDone ? "opacity-50 hover:opacity-80 transition-opacity" : ""
                        }`}
                      >
                        {/* Left rail: number + done toggle */}
                        <div className="absolute left-0 top-0 flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => toggleDone(question.id)}
                            title={isDone ? "Mark undone" : "Mark complete"}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isDone
                                ? "bg-success border-success text-white"
                                : "border-border/40 hover:border-success/50 opacity-0 group-hover/q:opacity-100"
                            }`}
                          >
                            {isDone && <Check size={10} strokeWidth={3} />}
                          </button>
                          <span className={`text-[10px] font-mono font-bold ${
                            isDone ? "text-success/60" : "text-muted-foreground/30"
                          }`}>
                            {idx + 1}
                          </span>
                        </div>

                        {/* Question */}
                        <h3 className={`text-[15px] font-semibold leading-relaxed mb-1.5 ${
                          isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                        }`}>
                          {question.question}
                        </h3>

                        {/* Explanation */}
                        {question.explanation && (
                          <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                            {question.explanation}
                          </p>
                        )}

                        {/* Action row */}
                        <div className="flex items-center gap-1 mb-1">
                          <button
                            onClick={() => toggleSolutionView(question.id, "theory")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                              activeView === "theory"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <FileText size={11} />
                            Theory
                          </button>
                          {question.code && (
                            <button
                              onClick={() => toggleSolutionView(question.id, "code")}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                                activeView === "code"
                                  ? "bg-accent text-accent-foreground border-accent"
                                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                            >
                              <Code2 size={11} />
                              Example
                            </button>
                          )}
                          <button
                            onClick={() => openNote(question.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                              hasNote
                                ? "text-warning bg-warning/10 border-warning/20"
                                : "border-transparent text-muted-foreground opacity-0 group-hover/q:opacity-100 hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <StickyNote size={11} />
                            Note
                          </button>
                        </div>

                        {/* Expandable answer */}
                        <AnimatePresence>
                          {activeView && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 ml-0">
                                {activeView === "theory" && (
                                  <div className="bg-muted/30 rounded-xl p-4 md:p-5 border border-border/10">
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
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {/* ── Mobile TOC Overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm xl:hidden" onClick={() => setTocOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-card border-r border-border/50 shadow-2xl flex flex-col xl:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <ListTree size={15} className="text-primary" />
                  <h3 className="text-sm font-bold">Topics</h3>
                </div>
                <button onClick={() => setTocOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                {coreJavaInterviewTopics.map((topic) => {
                  const topicDone = topic.questions.filter(q => doneMap[q.id]).length;
                  const topicTotal = topic.questions.length;
                  const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => scrollToTopic(topic.id)}
                      className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-base">{topic.icon}</span>
                        <span className="truncate flex-1">{topic.title}</span>
                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topicDone}/{topicTotal}</span>
                      </div>
                      <div className="ml-8 h-0.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Note Editor Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {activeNoteId && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setActiveNoteId(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-card border border-border/50 rounded-2xl overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Study Note</h2>
                <button onClick={() => setActiveNoteId(null)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
              </div>
              <div className="bg-muted/20 rounded-xl p-4">
                <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} rows={8} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveNoteId(null)} className="px-4 py-2 rounded-lg border border-border/30 text-xs font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                <button onClick={saveNote} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── All Notes Panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {showNotesPanel && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowNotesPanel(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-card border border-border/50 rounded-2xl flex flex-col max-h-[80vh]">
              <div className="p-5 border-b border-border/20 flex items-center justify-between">
                <h2 className="text-base font-bold">My Notes ({Object.keys(notesMap).length})</h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={downloadNotesPDF} className="p-2 rounded-lg hover:bg-muted" title="Download PDF"><Download size={15} /></button>
                  <button onClick={() => setShowNotesPanel(false)} className="p-2 rounded-lg hover:bg-muted"><X size={15} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {Object.entries(notesMap).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No notes yet. Click "Note" on any question to add one.</p>
                )}
                {Object.entries(notesMap).map(([id, note]) => {
                  const q = coreJavaInterviewTopics.flatMap(t => t.questions).find(qst => qst.id === id);
                  return (
                    <div key={id} className="p-3 rounded-xl bg-muted/10 border border-border/20">
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <p className="font-semibold text-xs leading-snug">{q?.question || id}</p>
                        <button onClick={() => deleteNoteFromPanel(id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><Trash2 size={13} /></button>
                      </div>
                      <div className="text-[11px] text-muted-foreground prose prose-invert max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }} />
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

/* ── Inline parser ────────────────────────────────── */

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
      parts.push(<code key={k++} className="font-mono text-[0.85em] px-1.5 py-px rounded bg-primary/10 text-primary border border-primary/20">{token.slice(1, -1)}</code>);
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
        const isHeading = lines.length === 1 && (
          lines[0].startsWith("##") ||
          (lines[0].endsWith(":") && lines[0].length < 70) ||
          (lines[0].length < 55 && !lines[0].endsWith(".") && !lines[0].startsWith("-"))
        );

        if (isHeading) {
          return (
            <div key={idx} className="flex items-center gap-2 pt-1">
              <span className="w-[3px] h-4 rounded-full bg-primary shrink-0" />
              <h4 className="text-sm font-bold text-foreground">
                {lines[0].replace(/^#{1,3}\s*/, "").replace(/:$/, "")}
              </h4>
            </div>
          );
        }
        if (isBullet) {
          return (
            <ul key={idx} className="space-y-1.5">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-foreground/85">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span>{parseInline(l.replace(/^- /, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (isNumbered) {
          return (
            <ol key={idx} className="space-y-2">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-[1px]">{i + 1}</span>
                  <span className="text-foreground/85">{parseInline(l.replace(/^\d+\.\s*/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((l, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-foreground/85">{parseInline(l)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
