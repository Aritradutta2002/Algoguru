import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  StickyNote,
  X,
  Save,
  Search,
  Coffee,
  BookOpen,
  Check,
} from "lucide-react";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { CodeBlock } from "@/components/CodeBlock";

const STORAGE_KEY_DONE = "corejava-done";
const STORAGE_KEY_NOTES = "corejava-notes";

function loadDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DONE);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveDone(d: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY_DONE, JSON.stringify(d));
}
function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveNotes(d: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(d));
}

export default function InterviewCoreJavaQuestionsPage() {
  const { language } = useParams<{ language?: string }>();
  const navigate = useNavigate();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(loadDone);
  const [notesMap, setNotesMap] = useState<Record<string, string>>(loadNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUndone, setShowOnlyUndone] = useState(false);
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(true);

  useEffect(() => { saveDone(doneMap); }, [doneMap]);
  useEffect(() => { saveNotes(notesMap); }, [notesMap]);

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

  const toggleExpand = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setDoneMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setNoteDraft(notesMap[id] || "");
  }, [notesMap]);

  const saveNote = useCallback(() => {
    if (activeNoteId) {
      setNotesMap((prev) => ({ ...prev, [activeNoteId]: noteDraft }));
      setActiveNoteId(null);
      setNoteDraft("");
    }
  }, [activeNoteId, noteDraft]);

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
                    const isExpanded = expandedQuestions[question.id] || false;
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
                              <div className="flex items-center gap-2 mb-1">
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
                                {question.answer}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3 ml-8">
                            <button
                              onClick={() => toggleExpand(question.id)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-border transition-all hover:border-primary"
                              style={{
                                background: isExpanded ? "hsl(var(--primary))" : "hsl(var(--card))",
                                color: isExpanded ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                                boxShadow: "2px 2px 0px 0px hsl(var(--border))",
                              }}
                            >
                              {isExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                              {isExpanded ? "Hide Solution" : "View Solution"}
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
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t-2 border-border px-4 py-4 space-y-4" style={{ background: "hsl(var(--muted)/0.2)" }}>
                                {/* Code Block */}
                                {question.code && (
                                  <CodeBlock
                                    title={`Q${qIdx + 1} — ${question.codeLanguage || "java"}`}
                                    language={question.codeLanguage || "java"}
                                    code={question.code}
                                  />
                                )}

                                {/* Explanation */}
                                <div className="space-y-2">
                                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1"
                                    style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}>
                                    <BookOpen size={10} />
                                    Explanation
                                  </div>
                                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground))" }}>
                                    {question.explanation}
                                  </div>
                                </div>

                                {/* Existing note display */}
                                {hasNote && notesMap[question.id] && (
                                  <div className="p-3 border-2 border-border bg-card" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2"
                                      style={{ color: "hsl(var(--warning))" }}>
                                      <StickyNote size={10} />
                                      Your Note
                                    </div>
                                    <p className="text-xs leading-relaxed whitespace-pre-line">{notesMap[question.id]}</p>
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

              {/* Textarea */}
              <div className="p-5">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write your notes, key takeaways, or mnemonics here..."
                  rows={8}
                  className="w-full px-3 py-2 text-sm border-2 border-border bg-background resize-y focus:outline-none focus:border-primary"
                  style={{ boxShadow: "inset 2px 2px 0px 0px hsl(var(--border))" }}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border">
                <button
                  onClick={() => {
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
