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
} from "lucide-react";
import jsPDF from "jspdf";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { CodeBlock } from "@/components/CodeBlock";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { renderNoteMarkdown, parseNoteSegments } from "@/lib/renderNoteMarkdown";

type SolutionView = "theory" | "code" | null;

export default function InterviewCoreJavaQuestionsPage() {
  const { language } = useParams<{ language?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [solutionViewMap, setSolutionViewMap] = useState<Record<string, SolutionView>>({});
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(true);
  const [upsertingId, setUpsertingId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const requireLogin = useCallback((action: string) => {
    toast({
      title: "Please sign in",
      description: `Login is required to ${action}. Your saved progress and notes are stored per account in the database.`,
      variant: "destructive",
    });
    navigate("/auth");
  }, [navigate]);

  // Load state only from Supabase when user is logged in
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setDoneMap({});
      setNotesMap({});
      setActiveNoteId(null);
      setNoteDraft("");
      setShowNotesPanel(false);
      return;
    }

    let mounted = true;
    const loadUserState = async () => {
      const { data, error } = await supabase
        .from("core_java_user_state")
        .select("question_id, notes, is_completed")
        .eq("user_id", user.id);

      if (!mounted) return;

      if (error) {
        console.warn("Could not load core_java_user_state:", error.message);
        toast({ title: "Load failed", description: error.message, variant: "destructive" });
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
    return () => { mounted = false; };
  }, [authLoading, user]);

  // Persist only to Supabase
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
  }, [requireLogin, user]);

  const totalQuestions = useMemo(
    () => coreJavaInterviewTopics.reduce((s, t) => s + t.questions.length, 0),
    []
  );
  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap]
  );

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim() && !showOnlyUndone) return coreJavaInterviewTopics;
    const q = searchQuery.toLowerCase().trim();
    return coreJavaInterviewTopics
      .map((topic) => {
        const filtered = topic.questions.filter((question) => {
          const matchesSearch = !q || question.question.toLowerCase().includes(q) || question.answer.toLowerCase().includes(q);
          const matchesUndone = !showOnlyUndone || !doneMap[question.id];
          return matchesSearch && matchesUndone;
        });
        return { ...topic, questions: filtered };
      })
      .filter((t) => t.questions.length > 0);
  }, [searchQuery, showOnlyUndone, doneMap]);

  const toggleSolutionView = useCallback((id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({
      ...prev,
      [id]: prev[id] === view ? null : view,
    }));
  }, []);

  const toggleDone = useCallback(async (id: string) => {
    if (!user) {
      requireLogin("save progress");
      return;
    }

    const currentDone = !!doneMap[id];
    const nextDone = !currentDone;

    setDoneMap((prev) => ({ ...prev, [id]: nextDone }));
    const ok = await upsertUserState(id, { is_completed: nextDone });
    if (!ok) {
      setDoneMap((prev) => ({ ...prev, [id]: currentDone }));
    }
  }, [doneMap, requireLogin, upsertUserState, user]);

  const openNote = useCallback((id: string) => {
    if (!user) {
      requireLogin("save notes");
      return;
    }

    setActiveNoteId(id);
    setNoteDraft(notesMap[id] || "");
  }, [notesMap, requireLogin, user]);

  const saveNote = useCallback(async () => {
    if (!activeNoteId) return;

    if (!user) {
      requireLogin("save notes");
      return;
    }

    const trimmed = noteDraft.trim();
    const previousNote = notesMap[activeNoteId];
    const ok = await upsertUserState(activeNoteId, { notes: trimmed });
    if (!ok) return;

    setNotesMap((prev) => {
      const next = { ...prev };
      if (trimmed) next[activeNoteId] = trimmed;
      else if (previousNote) delete next[activeNoteId];
      return next;
    });
    setActiveNoteId(null);
    setNoteDraft("");
  }, [activeNoteId, noteDraft, notesMap, requireLogin, upsertUserState, user]);

  const deleteNoteFromPanel = useCallback(async (questionId: string) => {
    if (!user) {
      requireLogin("delete notes");
      return;
    }

    setDeletingNoteId(questionId);
    const previousNote = notesMap[questionId];
    setNotesMap((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    const ok = await upsertUserState(questionId, { notes: "" });
    if (!ok && previousNote) {
      setNotesMap((prev) => ({ ...prev, [questionId]: previousNote }));
    }
    setDeletingNoteId(null);
  }, [notesMap, requireLogin, upsertUserState, user]);

  const downloadNotesPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const usableWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Core Java Q&A — My Notes", margin, y);
    y += 10;

    // Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 8;
    doc.setTextColor(0, 0, 0);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const allQuestions = coreJavaInterviewTopics.flatMap((t) => t.questions);
    const notesEntries = Object.entries(notesMap).filter(([, v]) => v && v.trim());

    if (notesEntries.length === 0) {
      doc.setFontSize(12);
      doc.text("No notes saved yet.", margin, y);
    } else {
      for (const [qId, note] of notesEntries) {
        const question = allQuestions.find((q) => q.id === qId);
        const topic = coreJavaInterviewTopics.find((t) => t.questions.some((q) => q.id === qId));

        // Check if we need a new page
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Topic label
        if (topic) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 200);
          doc.text(`${topic.icon} ${topic.title}`, margin, y);
          y += 5;
        }

        // Question
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        const qText = question ? question.question : qId;
        const qLines = doc.splitTextToSize(`Q: ${qText}`, usableWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 5 + 2;

        // Note content with formatting
        const segments = parseNoteSegments(note);
        let lineX = margin + 4;
        doc.setTextColor(60, 60, 60);

        for (const seg of segments) {
          if (seg.text === "\n") {
            y += 4.5;
            lineX = margin + 4;
            if (y > 275) { doc.addPage(); y = 20; }
            continue;
          }

          const fontSize = seg.heading ? 11 : 9;
          doc.setFontSize(fontSize);
          const fontStyle = seg.bold ? "bold" : seg.italic ? "italic" : "normal";
          doc.setFont("helvetica", fontStyle);

          // Split long lines
          const availableWidth = pageWidth - margin - lineX;
          const textWidth = doc.getTextWidth(seg.text);

          if (textWidth > availableWidth) {
            // Wrap text
            const words = seg.text.split(" ");
            let currentLine = "";
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = doc.getTextWidth(testLine);
              if (testWidth > availableWidth && currentLine) {
                doc.text(currentLine, lineX, y);
                y += fontSize * 0.5;
                lineX = margin + 4;
                currentLine = word;
                if (y > 275) { doc.addPage(); y = 20; }
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              doc.text(currentLine, lineX, y);
              lineX += doc.getTextWidth(currentLine) + 1;
            }
          } else {
            doc.text(seg.text, lineX, y);
            lineX += textWidth + 1;
          }
        }

        y += 8;

        // Divider
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y - 3, pageWidth - margin, y - 3);
        y += 2;
      }
    }

    doc.save("core-java-notes.pdf");
  }, [notesMap]);

  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 md:px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backRoute)}
                className="group flex items-center justify-center w-10 h-10 rounded-2xl border border-border/30 bg-muted/30 transition-all hover:bg-muted hover:border-primary/30"
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
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    Interview Preparation Guide
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Progress */}
              <div className="flex items-center gap-4 px-5 py-2.5 rounded-[22px] border border-border/30 bg-muted/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-xs font-black tracking-tight">{doneCount}/{totalQuestions}</span>
                </div>
                <div className="w-24 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    className="h-full rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.3)]" 
                  />
                </div>
                <span className="text-[11px] font-black text-success">{progressPct}%</span>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-border/30 bg-muted/20 rounded-[22px] w-48 lg:w-64 outline-none focus:border-primary/30 focus:bg-muted/40 transition-all placeholder:text-muted-foreground/20"
                />
              </div>

              {/* Filter undone */}
              <button
                onClick={() => setShowOnlyUndone((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                  showOnlyUndone 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <BookOpen size={14} />
                {showOnlyUndone ? "All Topics" : "Undone"}
              </button>

              {/* My Notes */}
              <button
                onClick={() => setShowNotesPanel(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                  Object.values(notesMap).some((n) => n && n.trim())
                    ? "bg-warning/10 border-warning/20 text-warning hover:bg-warning/20"
                    : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={14} />
                <span>Notes</span>
                {Object.values(notesMap).filter((n) => n && n.trim()).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-lg bg-warning/20 text-[9px] font-black">
                    {Object.values(notesMap).filter((n) => n && n.trim()).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-100px)]">
        {/* Topic Sidebar */}
        <AnimatePresence>
          {topicSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 border-r border-border/30 bg-card/30 backdrop-blur-sm overflow-y-auto hidden lg:block sticky top-[100px]"
              style={{ height: "calc(100vh - 100px)" }}
            >
              <div className="p-6 space-y-6">
                <div className="px-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 mb-1">
                    Knowledge Base
                  </p>
                  <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80">
                    Topics ({coreJavaInterviewTopics.length})
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {coreJavaInterviewTopics.map((topic) => {
                    const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                    const isActive = selectedTopic === topic.id;
                    const allDone = topicDone === topic.questions.length;

                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(isActive ? null : topic.id)}
                        className={`w-full group text-left px-4 py-3.5 rounded-2xl transition-all duration-300 border ${
                          isActive 
                            ? "bg-primary/10 border-primary/20 text-foreground shadow-xl shadow-primary/5" 
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted group-hover:bg-card border border-border/10"}`}>
                            {topic.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-bold tracking-tight truncate ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                              {topic.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${allDone ? "bg-success" : "bg-primary"}`} style={{ width: `${(topicDone / topic.questions.length) * 100}%` }} />
                              </div>
                              <span className={`text-[9px] font-black ${allDone ? "text-success" : "text-muted-foreground/40"}`}>
                                {topicDone}/{topic.questions.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle sidebar */}
        <button
          onClick={() => setTopicSidebarOpen((v) => !v)}
          className="hidden lg:flex items-center justify-center w-8 flex-shrink-0 border-r border-border/30 hover:bg-muted/30 transition-all group sticky top-[100px]"
          style={{ height: "calc(100vh - 100px)" }}
          title={topicSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <div className="p-1 rounded-lg bg-muted/50 border border-border/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            {topicSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-12 relative">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            {!user && !authLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-[32px] border border-warning/30 bg-warning/5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-warning">
                    <Shield size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">
                      Cloud Sync Disabled
                    </h3>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-lg">
                    Your progress and notes are stored locally. Sign in to sync your interview preparation across all devices and prevent data loss.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-8 py-3.5 rounded-2xl bg-warning text-warning-foreground font-black uppercase tracking-widest text-[11px] shadow-xl shadow-warning/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In Now
                </button>
              </motion.div>
            )}

            {/* Mobile topic selector */}
            <div className="lg:hidden">
              <div className="relative group">
                <select
                  value={selectedTopic || ""}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                  className="w-full appearance-none px-6 py-4 text-sm font-black uppercase tracking-widest border border-border/30 bg-card rounded-[24px] outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                >
                  <option value="">All Knowledge Areas</option>
                  {coreJavaInterviewTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.title} ({t.questions.length})</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none group-focus-within:rotate-180 transition-transform" />
              </div>
            </div>

            {filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                <div className="w-20 h-20 rounded-[32px] bg-muted/30 border border-border/20 flex items-center justify-center text-4xl shadow-xl">
                  🔍
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest text-foreground">
                    No results found
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Try refining your search terms or filters
                  </p>
                </div>
              </div>
            ) : (
              filteredTopics.map((topic) => {
                if (selectedTopic && topic.id !== selectedTopic) return null;
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                const allDone = topicDone === topic.questions.length;

                return (
                  <div key={topic.id} className="space-y-8">
                    {/* Topic Header Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group relative p-8 rounded-[32px] bg-card border border-border/30 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shadow-xl shadow-primary/10">
                            {topic.icon}
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{topic.title}</h2>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                                {topic.questions.length} Essential Questions
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(topicDone / topic.questions.length) * 100}%` }}
                                className={`h-full rounded-full shadow-[0_0_12px_rgba(var(--primary),0.3)] ${allDone ? "bg-success" : "bg-primary"}`} 
                              />
                            </div>
                            <span className={`text-[11px] font-black tracking-widest ${allDone ? "text-success" : "text-muted-foreground/60"}`}>
                              {topicDone}/{topic.questions.length}
                            </span>
                          </div>
                          {allDone && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={10} />
                              Mastered
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Questions Grid */}
                    <div className="space-y-4">
                      {topic.questions.map((question, qIdx) => {
                        const activeSolutionView = solutionViewMap[question.id] ?? null;
                        const isTheoryVisible = activeSolutionView === "theory";
                        const isCodeVisible = activeSolutionView === "code";
                        const isDone = doneMap[question.id] || false;
                        const hasNote = !!notesMap[question.id];

                        return (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: qIdx * 0.05 }}
                            className={`group relative rounded-[32px] border transition-all duration-300 ${
                              isDone 
                                ? "bg-success/5 border-success/30 hover:shadow-2xl hover:shadow-success/5" 
                                : "bg-card border-border/40 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                            }`}
                          >
                            <div className="p-6 md:p-8">
                              <div className="flex items-start gap-6">
                                {/* Done toggle circle */}
                                <button
                                  onClick={() => toggleDone(question.id)}
                                  className={`flex-shrink-0 mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                                    isDone 
                                      ? "bg-success border-success text-success-foreground shadow-lg shadow-success/20 scale-110" 
                                      : "bg-muted/50 border-border/30 text-transparent hover:border-primary/50 hover:bg-muted"
                                  }`}
                                >
                                  <Check size={18} strokeWidth={4} className={isDone ? "scale-100" : "scale-0"} />
                                </button>

                                <div className="flex-1 min-w-0 space-y-4">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                                      isDone ? "bg-success/10 border-success/20 text-success" : "bg-primary/5 border-primary/20 text-primary"
                                    }`}>
                                      Question {qIdx + 1}
                                    </span>
                                    {hasNote && (
                                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-[9px] font-black uppercase tracking-[0.2em]">
                                        <StickyNote size={10} />
                                        Annotated
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    <h3 className={`text-lg md:text-xl font-black tracking-tight leading-tight transition-all ${isDone ? "text-foreground/40 line-through" : "text-foreground"}`}>
                                      {question.question}
                                    </h3>
                                    <p className="text-[13px] font-medium text-muted-foreground/70 leading-relaxed max-w-3xl">
                                      {question.explanation}
                                    </p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap items-center gap-3 pt-4">
                                    <button
                                      onClick={() => toggleSolutionView(question.id, "theory")}
                                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                        isTheoryVisible 
                                          ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20" 
                                          : "bg-muted/50 border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      }`}
                                    >
                                      <BookOpen size={14} />
                                      {isTheoryVisible ? "Hide Theory" : "Theory"}
                                    </button>

                                    {question.code && (
                                      <button
                                        onClick={() => toggleSolutionView(question.id, "code")}
                                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                          isCodeVisible 
                                            ? "bg-accent border-accent text-accent-foreground shadow-xl shadow-accent/20" 
                                            : "bg-muted/50 border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                      >
                                        <Code2 size={14} />
                                        {isCodeVisible ? "Hide Code" : "Example"}
                                      </button>
                                    )}

                                    <button
                                      onClick={() => openNote(question.id)}
                                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                        hasNote 
                                          ? "bg-warning/10 border-warning/20 text-warning" 
                                          : "bg-muted/50 border-border/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      }`}
                                    >
                                      <StickyNote size={14} />
                                      {hasNote ? "Edit Note" : "Add Note"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Content Area */}
                            <AnimatePresence>
                              {activeSolutionView && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 md:px-8 pb-8 pt-2 space-y-6">
                                    <div className="h-px bg-border/20 w-full" />
                                    
                                    {isTheoryVisible && (
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary">
                                          <Sparkles size={14} />
                                          <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                                            Theoretical Breakdown
                                          </span>
                                        </div>
                                        <div className="prose prose-sm prose-invert max-w-none text-[13px] font-medium leading-relaxed text-foreground/80 bg-muted/20 p-6 rounded-[24px] border border-border/10">
                                          {renderTheoryContent(question.answer)}
                                        </div>
                                      </div>
                                    )}

                                    {isCodeVisible && question.code && (
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-accent">
                                          <Code2 size={14} />
                                          <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                                            Implementation Detail
                                          </span>
                                        </div>
                                        <div className="rounded-[24px] overflow-hidden border border-border/10">
                                          <CodeBlock
                                            title={`Q${qIdx + 1} Implementation`}
                                            language={question.codeLanguage || "java"}
                                            code={question.code}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Inline Note */}
                                    {hasNote && notesMap[question.id] && (
                                      <div className="p-6 rounded-[24px] border border-warning/20 bg-warning/5 space-y-3">
                                        <div className="flex items-center gap-2 text-warning">
                                          <StickyNote size={14} />
                                          <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                                            Personal Study Note
                                          </span>
                                        </div>
                                        <div
                                          className="text-[13px] font-medium leading-relaxed text-foreground/80 note-rendered"
                                          dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(notesMap[question.id]) }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {activeNoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[100] p-4"
            onClick={() => setActiveNoteId(null)}
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[40px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-warning/10 blur-[80px] rounded-full pointer-events-none" />

              {/* Modal Header */}
              <div className="relative z-10 flex items-center justify-between px-10 py-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                      <StickyNote size={20} className="text-warning" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Personal Note</h2>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">
                    Context: {coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === activeNoteId)?.question}
                  </p>
                </div>
                <button
                  onClick={() => setActiveNoteId(null)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Editor Body */}
              <div className="relative z-10 px-10 pb-6 flex-1 overflow-y-auto min-h-[300px]">
                <div className="bg-muted/20 border border-border/30 rounded-[32px] p-6 h-full focus-within:border-primary/30 transition-all focus-within:ring-4 focus-within:ring-primary/5">
                  <RichTextNoteEditor
                    value={noteDraft}
                    onChange={setNoteDraft}
                    placeholder="Capture key concepts, tricky bits, or mnemonics..."
                    rows={12}
                    autoFocus
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="relative z-10 flex items-center justify-between px-10 py-8 border-t border-border/30 bg-muted/20">
                <button
                  onClick={async () => {
                    if (!activeNoteId) return;
                    const ok = await upsertUserState(activeNoteId, { notes: "" });
                    if (!ok) return;

                    setNotesMap((prev) => {
                      const next = { ...prev };
                      delete next[activeNoteId];
                      return next;
                    });
                    setActiveNoteId(null);
                    setNoteDraft("");
                  }}
                  className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
                >
                  Discard Note
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveNoteId(null)}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Save size={16} />
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Notes Panel Modal */}
      <AnimatePresence>
        {showNotesPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowNotesPanel(false)}
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-card border border-border/50 rounded-[40px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between px-10 py-8 border-b border-border/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                      <FileText size={20} className="text-warning" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">My Interview Notes</h2>
                  </div>
                  <div className="flex items-center gap-3 ml-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                      {Object.values(notesMap).filter((n) => n && n.trim()).length} Compiled Records
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadNotesPDF}
                    disabled={Object.values(notesMap).filter((n) => n && n.trim()).length === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Download size={14} />
                    Export PDF
                  </button>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-4 min-h-[400px]">
                {Object.entries(notesMap).filter(([, v]) => v && v.trim()).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                    <div className="w-20 h-20 rounded-[32px] bg-muted/30 border border-border/20 flex items-center justify-center text-4xl shadow-xl">
                      📝
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-widest text-foreground">
                        Your notebook is empty
                      </p>
                      <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">
                        Notes you take during your study sessions will appear here for quick review.
                      </p>
                    </div>
                  </div>
                ) : (
                  Object.entries(notesMap)
                    .filter(([, v]) => v && v.trim())
                    .map(([qId, note]) => {
                      const question = coreJavaInterviewTopics.flatMap((t) => t.questions).find((q) => q.id === qId);
                      const topic = coreJavaInterviewTopics.find((t) => t.questions.some((q) => q.id === qId));
                      return (
                        <div
                          key={qId}
                          className="group p-6 rounded-[28px] border border-border/30 bg-muted/10 transition-all hover:bg-muted/20"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="space-y-2 flex-1">
                              {topic && (
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                  {topic.icon} {topic.title}
                                </span>
                              )}
                              <p className="text-sm font-black tracking-tight text-foreground/90 leading-tight">
                                {question ? question.question : qId}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setShowNotesPanel(false);
                                  setTimeout(() => openNote(qId), 200);
                                }}
                                className="w-9 h-9 rounded-xl bg-card border border-border/30 flex items-center justify-center text-warning hover:bg-warning/10 transition-all"
                                title="Edit note"
                              >
                                <StickyNote size={16} />
                              </button>
                              <button
                                onClick={() => deleteNoteFromPanel(qId)}
                                disabled={deletingNoteId === qId}
                                className="w-9 h-9 rounded-xl bg-card border border-border/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
                                title="Delete note"
                              >
                                {deletingNoteId === qId ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div
                            className="text-[13px] font-medium leading-relaxed text-foreground/70 pl-4 border-l-2 border-warning/20 note-rendered"
                            dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }}
                          />
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              <div className="relative z-10 px-10 py-6 border-t border-border/30 bg-muted/20">
                <div className="flex items-center justify-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    Auto-synced to your cloud profile
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronLeft({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function renderTheoryContent(answer: string): ReactNode {
  const sections = answer
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((section, sectionIndex) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const hasTitleLine = lines.length > 1 && /^[A-Z][^:]{1,80}:$/.test(lines[0]);
    const title = hasTitleLine ? lines[0].slice(0, -1) : null;
    const contentLines = hasTitleLine ? lines.slice(1) : lines;
    const isList = contentLines.length > 1 && contentLines.every((line) => /^(\d+\.\s+|- )/.test(line));

    return (
      <section key={`${sectionIndex}-${title ?? "paragraph"}`} className="core-java-theory-section">
        {title && <h4 className="core-java-theory-title">{title}</h4>}
        {isList ? (
          <div className="core-java-theory-list">
            {contentLines.map((line, lineIndex) => renderTheoryListItem(line, `${sectionIndex}-${lineIndex}`))}
          </div>
        ) : (
          contentLines.map((line, lineIndex) => (
            <p key={`${sectionIndex}-${lineIndex}`} className="core-java-theory-paragraph">
              {renderTheoryInlineContent(line)}
            </p>
          ))
        )}
      </section>
    );
  });
}

function renderTheoryListItem(line: string, key: string): ReactNode {
  const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return (
      <div key={key} className="core-java-theory-item">
        <span className="core-java-theory-badge">{numberedMatch[1]}</span>
        <p className="core-java-theory-paragraph mb-0">{renderTheoryInlineContent(numberedMatch[2])}</p>
      </div>
    );
  }

  const bulletMatch = line.match(/^-\s+(.*)$/);
  return (
    <div key={key} className="core-java-theory-item">
      <span className="core-java-theory-dot" />
      <p className="core-java-theory-paragraph mb-0">{renderTheoryInlineContent(bulletMatch ? bulletMatch[1] : line)}</p>
    </div>
  );
}

function renderTheoryInlineContent(text: string): ReactNode {
  const leadMatch = text.match(/^([A-Z][A-Za-z0-9 ()/&,'+-]{1,50}):\s+(.*)$/s);

  if (!leadMatch) {
    return text;
  }

  return (
    <>
      <span className="core-java-theory-lead">{leadMatch[1]}:</span>{" "}
      <span>{leadMatch[2]}</span>
    </>
  );
}
