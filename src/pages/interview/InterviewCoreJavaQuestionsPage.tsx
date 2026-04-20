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
      {/* Page Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 md:px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backRoute)}
                className="group flex items-center justify-center w-10 h-10 rounded-2xl border border-border/30 bg-muted/30 transition-all hover:bg-muted"
              >
                <ArrowLeft size={18} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5" />
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Coffee size={20} className="text-primary" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    Core Java <span className="text-primary">Q&A</span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-4 px-5 py-2.5 rounded-[22px] border border-border/30 bg-muted/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-xs font-black tracking-tight">{doneCount}/{totalQuestions}</span>
                </div>
                <div className="w-24 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    className="h-full rounded-full bg-success" 
                  />
                </div>
                <span className="text-[11px] font-black text-success">{progressPct}%</span>
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-border/30 bg-muted/20 rounded-[22px] w-48 outline-none focus:border-primary/30 transition-all"
                />
              </div>

              <button
                onClick={() => setTopicSidebarOpen(v => !v)}
                className={`px-4 py-2.5 rounded-[22px] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                  topicSidebarOpen ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted"
                }`}
                title="Toggle Sidebar"
              >
                <BookOpen size={14} />
                <span className="hidden sm:inline">Topics</span>
              </button>

              <button
                onClick={() => setShowOnlyUndone(v => !v)}
                className={`px-4 py-2.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest border transition-all ${
                  showOnlyUndone ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border/30 text-muted-foreground"
                }`}
              >
                {showOnlyUndone ? "All" : "Undone"}
              </button>

              <button
                onClick={() => setShowNotesPanel(true)}
                className="px-4 py-2.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest border border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted"
              >
                Notes ({Object.keys(notesMap).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative">
        {/* Sidebar */}
        {topicSidebarOpen && (
          <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border/30 bg-card/30 backdrop-blur-sm lg:sticky top-[100px] lg:h-[calc(100vh-100px)] overflow-y-auto p-6 z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4">Knowledge Areas</p>
              {coreJavaInterviewTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl transition-all border ${
                    selectedTopic === topic.id ? "bg-primary/10 border-primary/20 text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{topic.icon}</span>
                    <span className="text-[13px] font-bold truncate">{topic.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 p-6 md:p-12 relative">
          <div className="max-w-4xl mx-auto space-y-12">
            {!user && !authLoading && (
              <div className="p-8 rounded-[32px] border border-warning/30 bg-warning/5 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-warning">Sync Disabled</h3>
                  <p className="text-xs text-muted-foreground">Sign in to save your progress permanently.</p>
                </div>
                <button onClick={() => navigate("/auth")} className="px-6 py-2.5 rounded-xl bg-warning text-warning-foreground font-black uppercase text-[10px]">Sign In</button>
              </div>
            )}

            {filteredTopics.map(topic => {
              if (selectedTopic && topic.id !== selectedTopic) return null;
              return (
                <div key={topic.id} className="space-y-8">
                  <div className="p-8 rounded-[32px] bg-card border border-border/30">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-4xl">{topic.icon}</div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{topic.title}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{topic.questions.length} Questions</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {topic.questions.map((question, idx) => {
                      const isDone = doneMap[question.id];
                      const hasNote = !!notesMap[question.id];
                      const activeView = solutionViewMap[question.id];
                      
                      return (
                        <div key={question.id} className={`rounded-[32px] border transition-all ${isDone ? "bg-success/5 border-success/30" : "bg-card border-border/40"}`}>
                          <div className="p-6 md:p-8 flex items-start gap-6">
                            <button
                              onClick={() => toggleDone(question.id)}
                              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isDone ? "bg-success border-success text-white" : "border-border/30"}`}
                            >
                              {isDone && <Check size={18} strokeWidth={4} />}
                            </button>
                            <div className="flex-1 space-y-4 md:space-y-5">
                              <h3 className={`text-xl md:text-2xl font-black tracking-tight leading-snug ${isDone ? "opacity-40 line-through" : "text-foreground/90"}`}>
                                {question.question}
                              </h3>
                              {question.explanation && (
                                <p className={`text-[15px] md:text-base leading-relaxed ${isDone ? "opacity-40" : "text-muted-foreground/90 font-medium tracking-wide"}`}>
                                  {question.explanation}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                  onClick={() => toggleSolutionView(question.id, "theory")}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeView === "theory" ? "bg-primary text-primary-foreground" : "bg-muted/50 border-border/30"}`}
                                >Theory</button>
                                {question.code && (
                                  <button
                                    onClick={() => toggleSolutionView(question.id, "code")}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeView === "code" ? "bg-accent text-accent-foreground" : "bg-muted/50 border-border/30"}`}
                                  >Example</button>
                                )}
                                <button onClick={() => openNote(question.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border/30 ${hasNote ? "text-warning bg-warning/5" : ""}`}>
                                  {hasNote ? "Edit Note" : "Add Note"}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {activeView && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/10">
                                <div className="p-8 space-y-6">
                                  {activeView === "theory" && (
                                    <div className="bg-muted/20 p-6 md:p-8 rounded-[24px] prose prose-invert prose-base md:prose-lg leading-relaxed text-foreground/90 max-w-none">
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

      {/* Note Modal */}
      <AnimatePresence>
        {activeNoteId && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setActiveNoteId(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[40px] overflow-hidden p-10 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase">Study Note</h2>
                <button onClick={() => setActiveNoteId(null)}><X /></button>
              </div>
              <div className="bg-muted/20 rounded-[24px] p-4">
                <RichTextNoteEditor value={noteDraft} onChange={setNoteDraft} rows={10} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setActiveNoteId(null)} className="px-6 py-3 rounded-xl uppercase font-black text-[10px]">Cancel</button>
                <button onClick={saveNote} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground uppercase font-black text-[10px]">Save Note</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notes Panel */}
      <AnimatePresence>
        {showNotesPanel && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowNotesPanel(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-3xl bg-card border border-border/50 rounded-[40px] flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-border/30 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase">My Notes</h2>
                <div className="flex items-center gap-3">
                  <button onClick={downloadNotesPDF} className="p-3 rounded-xl border border-border/30"><Download size={18} /></button>
                  <button onClick={() => setShowNotesPanel(false)}><X /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-4">
                {Object.entries(notesMap).map(([id, note]) => (
                  <div key={id} className="p-6 rounded-[24px] bg-muted/10 border border-border/30">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-sm">{coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === id)?.question || id}</p>
                      <button onClick={() => deleteNoteFromPanel(id)} className="text-destructive"><Trash2 size={16} /></button>
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

function renderTheoryContent(answer: string): ReactNode {
  if (!answer) return null;
  const sections = answer.split("\n\n").filter(Boolean);
  return sections.map((section, idx) => {
    const lines = section.split("\n").filter(Boolean);
    const isList = lines.every(l => l.startsWith("- "));
    return (
      <div key={idx} className="mb-6 text-base tracking-wide">
        {isList ? (
          <ul className="list-disc pl-6 space-y-2.5">
            {lines.map((l, i) => <li key={i}>{l.replace("- ", "")}</li>)}
          </ul>
        ) : (
          lines.map((l, i) => <p key={i} className="mb-3 last:mb-0 leading-relaxed">{l}</p>)
        )}
      </div>
    );
  });
}
