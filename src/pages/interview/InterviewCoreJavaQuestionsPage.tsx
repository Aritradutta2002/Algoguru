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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b-2 border-border bg-card/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(backRoute)}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card hover:bg-muted/60"
                style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-2">
                <Coffee size={20} style={{ color: "hsl(var(--primary))" }} />
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  Core Java Q&A
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Progress */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-border bg-card text-xs font-bold"
                style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}>
                <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} />
                <span>{doneCount}/{totalQuestions}</span>
                <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: "hsl(var(--success))" }} />
                </div>
                <span>{progressPct}%</span>
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border-2 border-border bg-card w-44 focus:outline-none focus:border-primary"
                  style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
                />
              </div>
              {/* Filter undone */}
              <button
                onClick={() => setShowOnlyUndone((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border transition-colors"
                style={{
                  background: showOnlyUndone ? "hsl(var(--primary))" : "hsl(var(--card))",
                  color: showOnlyUndone ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                }}
              >
                <BookOpen size={12} />
                {showOnlyUndone ? "Show All" : "Undone Only"}
              </button>
              {/* My Notes */}
              <button
                onClick={() => setShowNotesPanel(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card transition-colors hover:border-primary"
                style={{
                  color: Object.values(notesMap).some((n) => n && n.trim()) ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                  boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                }}
              >
                <FileText size={12} />
                My Notes
                {Object.values(notesMap).filter((n) => n && n.trim()).length > 0 && (
                  <span className="ml-0.5 text-[9px] font-mono">({Object.values(notesMap).filter((n) => n && n.trim()).length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Topic Sidebar */}
        <AnimatePresence>
          {topicSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r-2 border-border overflow-y-auto hidden md:block"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              <div className="p-3 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1.5 mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Topics ({coreJavaInterviewTopics.length})
                </div>
                {coreJavaInterviewTopics.map((topic) => {
                  const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                  const isActive = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(isActive ? null : topic.id)}
                      className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 border-2 ${
                        isActive ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{topic.icon}</span>
                      <span className="flex-1 truncate">{topic.title}</span>
                      <span className="text-[10px] font-mono" style={{ color: topicDone === topic.questions.length ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
                        {topicDone}/{topic.questions.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle sidebar */}
        <button
          onClick={() => setTopicSidebarOpen((v) => !v)}
          className="hidden md:flex items-center justify-center w-6 flex-shrink-0 border-r-2 border-border hover:bg-muted/50 transition-colors"
          style={{ maxHeight: "calc(100vh - 120px)" }}
          title={topicSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {topicSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 space-y-6">
          {!user && !authLoading && (
            <div className="border-2 border-warning/40 bg-warning/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ boxShadow: "3px 3px 0px 0px hsl(var(--border))" }}>
              <div>
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(var(--warning))" }}>
                  Login Required For Saving
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                  Core Java progress and notes are stored only in the database, per user account. Sign in to keep data after browser close or cache clear.
                </p>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black dark:border-white"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile topic selector */}
          <div className="md:hidden">
            <select
              value={selectedTopic || ""}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-border bg-card"
              style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
            >
              <option value="">All Topics</option>
              {coreJavaInterviewTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.title} ({t.questions.length})</option>
              ))}
            </select>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                No questions match your search.
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              if (selectedTopic && topic.id !== selectedTopic) return null;
              const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
              return (
                <div key={topic.id} className="space-y-4">
                  {/* Topic Header */}
                  <div className="border-2 border-black dark:border-white bg-card p-4"
                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{topic.icon}</span>
                        <div>
                          <h2 className="text-base md:text-lg font-black uppercase tracking-tight">{topic.title}</h2>
                          <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {topic.questions.length} questions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{
                            width: `${topic.questions.length > 0 ? (topicDone / topic.questions.length) * 100 : 0}%`,
                            background: topicDone === topic.questions.length ? "hsl(var(--success))" : "hsl(var(--primary))",
                          }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {topicDone}/{topic.questions.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
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
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qIdx * 0.03, duration: 0.2 }}
                        className={`border-2 bg-card transition-colors ${
                          isDone ? "border-success/40" : "border-border"
                        }`}
                        style={{
                          boxShadow: isDone ? "3px 3px 0px 0px hsl(var(--success)/0.3)" : "3px 3px 0px 0px hsl(var(--border))",
                        }}
                      >
                        {/* Question Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Number + Done toggle */}
                            <button
                              onClick={() => toggleDone(question.id)}
                              className="flex-shrink-0 mt-0.5 transition-colors"
                              title={isDone ? "Mark as undone" : "Mark as done"}
                            >
                              {isDone ? (
                                <CheckCircle2 size={20} style={{ color: "hsl(var(--success))" }} />
                              ) : (
                                <Circle size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
                              )}
                            </button>

                            {/* Question text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5"
                                  style={{
                                    background: isDone ? "hsl(var(--success)/0.15)" : "hsl(var(--primary)/0.1)",
                                    color: isDone ? "hsl(var(--success))" : "hsl(var(--primary))",
                                    border: `1px solid ${isDone ? "hsl(var(--success)/0.3)" : "hsl(var(--primary)/0.2)"}`,
                                  }}>
                                  Q{qIdx + 1}
                                </span>
                                {isDone && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                                    style={{ background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))", border: "1px solid hsl(var(--success)/0.2)" }}>
                                    Done
                                  </span>
                                )}
                                {hasNote && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                                    style={{ background: "hsl(var(--warning)/0.1)", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning)/0.2)" }}>
                                    <StickyNote size={9} className="inline mr-0.5" /> Note
                                  </span>
                                )}
                              </div>
                              <h3 className={`text-sm md:text-base font-bold leading-snug ${isDone ? "line-through opacity-60" : ""}`}>
                                {question.question}
                              </h3>
                              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {question.explanation}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3 ml-8">
                            <button
                              onClick={() => toggleSolutionView(question.id, "theory")}
                              className="core-java-solution-toggle inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 transition-all"
                              style={{
                                borderColor: isTheoryVisible ? "hsl(var(--primary))" : "hsl(var(--border))",
                                background: isTheoryVisible ? "hsl(var(--primary))" : "hsl(var(--card))",
                                color: isTheoryVisible ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                              }}
                            >
                              <BookOpen size={12} />
                              {isTheoryVisible ? "Hide Theory" : "View Theory"}
                            </button>
                            <button
                              onClick={() => toggleSolutionView(question.id, "code")}
                              disabled={!question.code}
                              className="core-java-solution-toggle inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                borderColor: isCodeVisible ? "hsl(var(--accent))" : "hsl(var(--border))",
                                background: isCodeVisible ? "hsl(var(--accent))" : "hsl(var(--card))",
                                color: isCodeVisible ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                              }}
                            >
                              <Code2 size={12} />
                              {isCodeVisible ? "Hide Code" : "View Code"}
                            </button>
                            <button
                              onClick={() => toggleDone(question.id)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 transition-all"
                              style={{
                                borderColor: isDone ? "hsl(var(--success))" : "hsl(var(--border))",
                                background: isDone ? "hsl(var(--success)/0.1)" : "hsl(var(--card))",
                                color: isDone ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                              }}
                            >
                              <Check size={12} />
                              {isDone ? "Done" : "Mark as Done"}
                            </button>
                            <button
                              onClick={() => openNote(question.id)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-border bg-card transition-all hover:border-primary"
                              style={{
                                color: hasNote ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                              }}
                            >
                              <StickyNote size={12} />
                              {hasNote ? "Edit Note" : "Add Note"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Solution */}
                        <AnimatePresence>
                          {activeSolutionView && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t-2 border-border px-4 py-4 space-y-4" style={{ background: "hsl(var(--muted)/0.2)" }}>
                                {isTheoryVisible && (
                                  <div className="core-java-theory-card">
                                    <div className="flex items-center gap-2 mb-4">
                                      <BookOpen size={14} style={{ color: "hsl(var(--primary))" }} />
                                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                                        Theory
                                      </span>
                                    </div>
                                    <div className="core-java-theory-copy">
                                      {renderTheoryContent(question.answer)}
                                    </div>
                                  </div>
                                )}

                                {isCodeVisible && question.code && (
                                  <CodeBlock
                                    title={`Q${qIdx + 1} — ${question.codeLanguage || "java"}`}
                                    language={question.codeLanguage || "java"}
                                    code={question.code}
                                  />
                                )}

                                {/* Existing note display */}
                                {hasNote && notesMap[question.id] && (
                                  <div className="p-3 border-2 border-border bg-card" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2"
                                      style={{ color: "hsl(var(--warning))" }}>
                                      <StickyNote size={10} />
                                      Your Note
                                    </div>
                                    <div
                                      className="text-xs leading-relaxed whitespace-pre-line note-rendered"
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
              );
            })
          )}
        </main>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {activeNoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={() => setActiveNoteId(null)}
          >
            <div className="fixed inset-0" style={{ background: "hsl(var(--background)/0.75)", backdropFilter: "blur(8px)" }} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg mx-4 border-4 border-black dark:border-white bg-card"
              style={{ boxShadow: "8px 8px 0px 0px hsl(var(--border))" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border">
                <div className="flex items-center gap-2">
                  <StickyNote size={16} style={{ color: "hsl(var(--warning))" }} />
                  <span className="text-sm font-black uppercase tracking-wider">Your Note</span>
                </div>
                <button onClick={() => setActiveNoteId(null)} className="p-1 hover:bg-muted rounded">
                  <X size={16} />
                </button>
              </div>

              {/* Find the question for context */}
              <div className="px-5 py-2 border-b border-border" style={{ background: "hsl(var(--muted)/0.3)" }}>
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {coreJavaInterviewTopics.flatMap(t => t.questions).find(q => q.id === activeNoteId)?.question}
                </p>
              </div>

              {/* Rich Text Editor */}
              <div className="p-5">
                <RichTextNoteEditor
                  value={noteDraft}
                  onChange={setNoteDraft}
                  placeholder="Write your notes, key takeaways, or mnemonics here... Use **bold**, *italic*, __underline__"
                  rows={8}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border">
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
                  className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 border-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Delete Note
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveNoteId(null)}
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card"
                    style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 border-2 border-black dark:border-white"
                    style={{
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                    }}
                  >
                    <Save size={12} />
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
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={() => setShowNotesPanel(false)}
          >
            <div className="fixed inset-0" style={{ background: "hsl(var(--background)/0.75)", backdropFilter: "blur(8px)" }} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl mx-4 border-4 border-black dark:border-white bg-card max-h-[85vh] flex flex-col"
              style={{ boxShadow: "8px 8px 0px 0px hsl(var(--border))" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={18} style={{ color: "hsl(var(--warning))" }} />
                  <span className="text-sm font-black uppercase tracking-wider">My Notes</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 border border-border" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {Object.values(notesMap).filter((n) => n && n.trim()).length} saved
                  </span>
                  {!user && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-warning/30" style={{ color: "hsl(var(--warning))" }}>
                      DB Login Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadNotesPDF}
                    disabled={Object.values(notesMap).filter((n) => n && n.trim()).length === 0}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card transition-colors hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
                  >
                    <Download size={11} />
                    PDF
                  </button>
                  <button onClick={() => setShowNotesPanel(false)} className="p-1 hover:bg-muted rounded">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.entries(notesMap).filter(([, v]) => v && v.trim()).length === 0 ? (
                  <div className="text-center py-12">
                    <StickyNote size={32} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                      No notes saved yet.
                    </p>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Click "Add Note" on any question to start taking notes.
                    </p>
                    {!user && (
                      <p className="text-xs mt-3 px-4" style={{ color: "hsl(var(--warning))" }}>
                        Login first. Notes are stored only in the database and loaded per account.
                      </p>
                    )}
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
                          className="border-2 border-border p-3 bg-background"
                          style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              {topic && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 mr-1"
                                  style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}>
                                  {topic.icon} {topic.title}
                                </span>
                              )}
                              <p className="text-xs font-bold mt-1 leading-snug">
                                {question ? question.question : qId}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setShowNotesPanel(false);
                                  setTimeout(() => openNote(qId), 200);
                                }}
                                className="p-1 hover:bg-muted rounded text-[10px] font-bold uppercase"
                                title="Edit note"
                              >
                                <StickyNote size={12} style={{ color: "hsl(var(--warning))" }} />
                              </button>
                              <button
                                onClick={() => deleteNoteFromPanel(qId)}
                                disabled={deletingNoteId === qId}
                                className="p-1 hover:bg-destructive/10 rounded"
                                title="Delete note"
                              >
                                {deletingNoteId === qId ? (
                                  <Loader2 size={12} className="animate-spin" style={{ color: "hsl(var(--destructive))" }} />
                                ) : (
                                  <Trash2 size={12} style={{ color: "hsl(var(--destructive))" }} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div
                            className="text-xs leading-relaxed whitespace-pre-line pl-2 border-l-2 border-warning/30 note-rendered"
                            style={{ color: "hsl(var(--foreground))" }}
                            dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }}
                          />
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              {user && Object.values(notesMap).filter((n) => n && n.trim()).length > 0 && (
                <div className="flex-shrink-0 px-5 py-2 border-t-2 border-border" style={{ background: "hsl(var(--muted)/0.2)" }}>
                  <p className="text-[10px] font-semibold text-center" style={{ color: "hsl(var(--success))" }}>
                    ✓ Notes are saved only to your account in the database and load again after browser close or cache clear
                  </p>
                </div>
              )}
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
