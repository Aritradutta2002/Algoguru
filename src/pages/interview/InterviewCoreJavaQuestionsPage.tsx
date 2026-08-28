import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  Coffee,
  Code2,
  Download,
  FileText,
  Flame,
  Loader2,
  Network,
  PanelLeftOpen,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { CodeBlock } from "@/components/CodeBlock";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";
import jsPDF from "jspdf";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { CoreJavaQuestionAnswer } from "@/components/interview/CoreJavaQuestionAnswer";
import { CoreJavaBookmarkButton } from "@/components/interview/CoreJavaActions";
import { DifficultyBadge, PriorityBadge, JavaVersionBadge } from "@/components/interview/CoreJavaBadges";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { getAllCoreJavaQuestions, type IndexedCoreJavaQuestion } from "@/lib/coreJavaQuestionIndex";
import { getCoreJavaQuestionDetailPath } from "@/data/coreJavaInterviewMetadata";
import { hasCoreJavaVisualization } from "@/components/interview/CoreJavaVisualizationBlock";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import "@/styles/core-java-interview.css";

type SolutionView = "theory" | "code" | null;
type FilterKind = "all" | "most-asked" | "easy" | "medium" | "hard" | "bookmarked" | "completed";

const FILTER_OPTIONS: { id: FilterKind; label: string; icon?: string }[] = [
  { id: "all", label: "All" },
  { id: "most-asked", label: "Most Asked", icon: "🔥" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "completed", label: "Completed" },
];

// ─────────────────────────────────────────────────────────────────────────
// QuestionCard
// ─────────────────────────────────────────────────────────────────────────
interface QuestionCardProps {
  entry: IndexedCoreJavaQuestion;
  isDone: boolean;
  hasNote: boolean;
  isBookmarked: boolean;
  activeView: SolutionView;
  onToggleDone: (id: string) => void;
  onToggleView: (id: string, view: Exclude<SolutionView, null>) => void;
  onOpenNote: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

const _QuestionCard = ({
  entry,
  isDone,
  hasNote,
  isBookmarked,
  activeView,
  onToggleDone,
  onToggleView,
  onOpenNote,
  onToggleBookmark,
}: QuestionCardProps) => {
  const { question, topic, meta } = entry;
  const detailPath = getCoreJavaQuestionDetailPath(question);

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
      {activeView && !isDone && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" aria-hidden="true" />
      )}

      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          {/* Done toggle */}
          <button
            onClick={() => onToggleDone(question.id)}
            title={isDone ? "Mark undone" : "Mark as learned"}
            aria-pressed={isDone}
            aria-label={isDone ? "Mark as not learned" : "Mark as learned"}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
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
                Q{String(entry.index + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/70 flex items-center gap-1">
                {topic.icon} {topic.title}
              </span>
              {meta.difficulty && <DifficultyBadge difficulty={meta.difficulty} />}
              {meta.priority === "very-high" && <PriorityBadge priority="very-high" />}
              {meta.javaVersions?.map((v) => <JavaVersionBadge key={v} version={v} />)}
              {isDone && (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Learned
                </span>
              )}
              {hasNote && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  Note Added
                </span>
              )}
              {hasCoreJavaVisualization(question.id) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-info bg-info/10 px-2 py-0.5 rounded-full">
                  <Network size={10} /> Visual
                </span>
              )}
            </div>

            {/* Question title — links to detail page */}
            <Link to={detailPath} className="group/title block">
              <h3
                className={`text-[19px] font-bold leading-[1.5] mb-2.5 transition-colors group-hover/title:text-primary ${
                  isDone ? "opacity-40 line-through text-foreground" : "text-foreground"
                }`}
              >
                {question.question}
              </h3>
            </Link>

            {/* One-line mental model */}
            {question.explanation && (
              <p className={`text-[14.5px] leading-[1.75] mb-4 ${isDone ? "opacity-40" : "text-muted-foreground"}`}>
                {question.explanation}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/20">
              <button
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[36px] rounded-lg text-[13px] font-semibold transition-all ${
                  activeView === "theory"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={14} />
                Quick Answer
              </button>

              {question.code && (
                <button
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={`inline-flex items-center gap-2 px-4 py-2 min-h-[36px] rounded-lg text-[13px] font-semibold transition-all ${
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
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[36px] rounded-lg text-[13px] font-semibold transition-all ${
                  hasNote
                    ? "bg-warning/15 text-warning hover:bg-warning/25"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote size={14} />
                {hasNote ? "Edit Note" : "Note"}
              </button>

              <div className="flex-1" />

              <CoreJavaBookmarkButton
                questionId={question.id}
                isBookmarked={isBookmarked}
                onToggle={onToggleBookmark}
                compact
              />

              <Link
                to={detailPath}
                aria-label={`Read full answer: ${question.question}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-lg bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground text-[12px] font-semibold transition-all"
              >
                Read <ArrowRight size={13} />
              </Link>
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
                  <CoreJavaQuestionAnswer answer={question.answer} />
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

function areQuestionCardsEqual(prev: QuestionCardProps, next: QuestionCardProps): boolean {
  return (
    prev.entry.question.id === next.entry.question.id &&
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.isBookmarked === next.isBookmarked &&
    prev.activeView === next.activeView
  );
}

const QuestionCard = memo(_QuestionCard, areQuestionCardsEqual);

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────
export default function InterviewCoreJavaQuestionsPage() {
  const { language } = useParams<{ language?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { doneMap, notesMap, upsertingId, toggleDone, saveNote, deleteNote } = useCoreJavaUserState();
  const { isBookmarked, toggleBookmark, bookmarkedIds } = useCoreJavaBookmarks();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(searchParams.get("topic"));
  const [activeFilter, setActiveFilter] = useState<FilterKind>(
    (searchParams.get("filter") as FilterKind) || "all"
  );
  const [solutionViewMap, setSolutionViewMap] = useState<Record<string, SolutionView>>({});
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { setOpen: setGlobalSidebarOpen } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  // SEO title
  useEffect(() => {
    document.title = "Core Java Interview Questions | AlgoGuru";
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  // Sync URL params → state
  useEffect(() => {
    setSelectedTopic(searchParams.get("topic"));
    const filter = searchParams.get("filter") as FilterKind | null;
    if (filter && FILTER_OPTIONS.some((f) => f.id === filter)) setActiveFilter(filter);
  }, [searchParams]);

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

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // "/" keyboard shortcut focuses search (when not typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (activeNoteId) setActiveNoteId(null);
        if (showNotesPanel) setShowNotesPanel(false);
        if (topicSidebarOpen) setTopicSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNoteId, showNotesPanel, topicSidebarOpen]);

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

  const handleToggleDone = useCallback(
    (id: string) => {
      if (!user && !authLoading) {
        requireLogin("save progress");
        return;
      }
      toggleDone(id);
    },
    [user, authLoading, requireLogin, toggleDone]
  );

  const handleToggleBookmark = useCallback(
    (id: string) => {
      if (!user && !authLoading) {
        requireLogin("save bookmarks");
        return;
      }
      toggleBookmark(id);
    },
    [user, authLoading, requireLogin, toggleBookmark]
  );

  const openNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setNoteDraft(notesMap[id] || "");
  }, [notesMap]);

  const handleSaveNote = async () => {
    if (!activeNoteId) return;
    const ok = await saveNote(activeNoteId, noteDraft);
    if (ok) {
      setActiveNoteId(null);
      setNoteDraft("");
    }
  };

  const handleDeleteNoteFromPanel = async (id: string) => {
    setDeletingNoteId(id);
    await deleteNote(id);
    setDeletingNoteId(null);
  };

  const toggleSolutionView = useCallback((id: string, view: Exclude<SolutionView, null>) => {
    setSolutionViewMap((prev) => ({
      ...prev,
      [id]: prev[id] === view ? null : view,
    }));
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────
  const allQuestions = useMemo(() => getAllCoreJavaQuestions(), []);
  const totalQuestions = allQuestions.length;
  const doneCount = useMemo(() => allQuestions.filter((q) => doneMap[q.question.id]).length, [allQuestions, doneMap]);
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredEntries = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return allQuestions.filter((entry) => {
      const { question, topic, meta } = entry;

      // Topic filter
      if (selectedTopic && topic.id !== selectedTopic) return false;

      // Search across title, tags, category, difficulty, priority, keywords
      if (q) {
        const searchable = [
          question.question,
          question.answer,
          question.explanation,
          topic.title,
          ...(meta.tags ?? []),
          meta.difficulty ?? "",
          meta.priority ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Toolbar filters
      switch (activeFilter) {
        case "most-asked":
          if (meta.priority !== "very-high" && meta.priority !== "high") return false;
          break;
        case "easy":
          if (meta.difficulty !== "easy") return false;
          break;
        case "medium":
          if (meta.difficulty !== "medium") return false;
          break;
        case "hard":
          if (meta.difficulty !== "hard") return false;
          break;
        case "bookmarked":
          if (!bookmarkedIds.includes(question.id)) return false;
          break;
        case "completed":
          if (!doneMap[question.id]) return false;
          break;
        default:
          break;
      }
      return true;
    });
  }, [allQuestions, debouncedSearch, selectedTopic, activeFilter, bookmarkedIds, doneMap]);

  // Group filtered entries by topic while preserving roadmap order
  const groupedTopics = useMemo(() => {
    const order = new Map(coreJavaInterviewTopics.map((t) => [t.id, t]));
    const groups = new Map<string, { topic: (typeof coreJavaInterviewTopics)[number]; entries: IndexedCoreJavaQuestion[] }>();
    for (const entry of filteredEntries) {
      const g = groups.get(entry.topic.id) ?? { topic: entry.topic, entries: [] };
      g.entries.push(entry);
      groups.set(entry.topic.id, g);
    }
    // Order by topic order in the data
    return Array.from(order.keys())
      .map((id) => groups.get(id))
      .filter((g): g is NonNullable<typeof g> => !!g);
  }, [filteredEntries]);

  const hasActiveFilters =
    !!debouncedSearch.trim() || !!selectedTopic || activeFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedTopic(null);
    setActiveFilter("all");
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleTopicClick = useCallback((topicId: string | null) => {
    setSelectedTopic(topicId);
    if (topicId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("topic", topicId);
        return next;
      }, { replace: true });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("topic");
        return next;
      }, { replace: true });
    }
  }, [setSearchParams]);

  const handleFilterClick = useCallback((filter: FilterKind) => {
    setActiveFilter(filter);
    if (filter === "all") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("filter");
        return next;
      }, { replace: true });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("filter", filter);
        return next;
      }, { replace: true });
    }
  }, [setSearchParams]);

  const downloadNotesPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.text("Core Java Interview Notes", 20, y);
    y += 15;

    Object.entries(notesMap).forEach(([id, note]) => {
      if (!note) return;
      const question = allQuestions.find((q) => q.question.id === id)?.question;
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

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="cjq-page min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      {/* ── Page Header ──────────────────────────────────────────── */}
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
              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono mb-0.5">
                  <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                  <ChevronRight size={9} aria-hidden="true" />
                  <Link to="/interview/java" className="hover:text-primary transition-colors">Interview</Link>
                  <ChevronRight size={9} aria-hidden="true" />
                  <span className="text-foreground/70">Core Java</span>
                </nav>
                <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                  Core Java <span className="text-primary">Q&A</span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                role="searchbox"
                placeholder="Search questions… ( / )"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Java interview questions"
                className="pl-9 pr-3 py-1.5 text-sm border border-border/40 bg-muted/20 rounded-full w-48 lg:w-64 outline-none focus:border-primary/50 focus:bg-card transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Notes Modal Trigger */}
            <button
              onClick={() => setShowNotesPanel(true)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 shrink-0 transition-all min-h-[36px]"
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
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-all"
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
        <div className="h-[2px] w-full bg-muted/40 relative" role="progressbar" aria-label="Overall progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      {/* ── Search + Filter toolbar (mobile search included) ─────── */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-card border-b border-border/20">
        {/* Mobile search */}
        <div className="relative md:hidden mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            role="searchbox"
            placeholder="Search questions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search Java interview questions"
            className="pl-9 pr-3 py-2 text-sm border border-border/40 bg-muted/20 rounded-full w-full outline-none focus:border-primary/50 focus:bg-card transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 cjq-scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              aria-pressed={activeFilter === filter.id}
              className={`px-3.5 py-1.5 min-h-[34px] rounded-full text-[12.5px] font-semibold border whitespace-nowrap shrink-0 transition-all ${
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {filter.icon && <span aria-hidden="true">{filter.icon} </span>}
              {filter.label}
              {filter.id === "bookmarked" && bookmarkedIds.length > 0 && ` (${bookmarkedIds.length})`}
            </button>
          ))}
          <span className="text-[11px] font-mono text-muted-foreground/60 whitespace-nowrap shrink-0 ml-1">
            {filteredEntries.length} of {totalQuestions} questions
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-full text-[12px] font-semibold text-destructive border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 whitespace-nowrap shrink-0 transition-all"
            >
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Main Layout (Sidebar + Content) ──────────────────────── */}
      <div className="flex-1 flex relative" style={{ minHeight: 0 }}>
        {/* Permanent Desktop Sidebar */}
        <aside className="hidden lg:block w-[240px] xl:w-[270px] shrink-0 border-r border-border/40 bg-card/30">
          <div className="sticky top-0 max-h-[calc(100vh-64px)] overflow-y-auto p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 flex items-center justify-between">
              <span>Topics</span>
              <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-foreground/80 lowercase tracking-normal font-mono">
                {doneCount}/{totalQuestions}
              </span>
            </h2>

            <button
              onClick={() => handleTopicClick(null)}
              aria-pressed={!selectedTopic}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all mb-1.5 border ${
                !selectedTopic
                  ? "bg-primary/10 border-primary/20 text-foreground"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base" aria-hidden="true">📚</span>
                <span className="text-[13px] font-semibold">All Topics</span>
              </div>
            </button>

            <div className="space-y-1">
              {coreJavaInterviewTopics.map((topic) => {
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                const topicTotal = topic.questions.length;
                const pct = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                const isActive = selectedTopic === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(isActive ? null : topic.id)}
                    aria-pressed={isActive}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all border ${
                      isActive
                        ? "bg-primary/5 border-primary/20 text-foreground shadow-sm"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-base shrink-0" aria-hidden="true">{topic.icon}</span>
                      <span className="text-[12.5px] font-semibold truncate flex-1 leading-tight">{topic.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        {topicDone}/{topicTotal}
                      </span>
                    </div>
                    <div className="ml-[30px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
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
        <main className="flex-1 min-w-0">
          <div className="w-full px-4 md:px-8 lg:px-10 xl:px-14 py-6 pb-24">
            <div className="space-y-10">
              {/* Sign-in nudge */}
              {!user && !authLoading && (
                <div className="p-5 rounded-2xl border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-warning mb-1">Your progress isn't being saved</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Sign in to save your completed questions, bookmarks and personal notes across devices.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/auth")}
                    className="px-6 py-2.5 rounded-lg bg-warning text-warning-foreground font-bold text-sm shrink-0 hover:bg-warning/90 transition-colors min-h-[40px]"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Empty state */}
              {groupedTopics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                    <Search size={28} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No questions found</h3>
                  <p className="text-[15px] text-muted-foreground max-w-sm">
                    Try a different search or clear your filters.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-6 px-6 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors min-h-[40px]"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}

              {/* Topic groups */}
              {groupedTopics.map((group) => (
                <div key={group.topic.id} className="space-y-4">
                  {/* Topic header */}
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-border/30">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
                      {group.topic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[20px] font-bold tracking-tight text-foreground leading-tight">
                        {group.topic.title}
                      </h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {group.entries.length} question{group.entries.length !== 1 ? "s" : ""}
                        {selectedTopic && ` · filtered from ${group.topic.questions.length}`}
                      </p>
                    </div>
                  </div>

                  {/* Questions single-column list */}
                  <div className="space-y-4">
                    {group.entries.map((entry) => (
                      <QuestionCard
                        key={entry.question.id}
                        entry={entry}
                        isDone={!!doneMap[entry.question.id]}
                        hasNote={!!notesMap[entry.question.id]}
                        isBookmarked={isBookmarked(entry.question.id)}
                        activeView={solutionViewMap[entry.question.id] ?? null}
                        onToggleDone={handleToggleDone}
                        onToggleView={toggleSolutionView}
                        onOpenNote={openNote}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile/Overlay Topic Sidebar ──────────────────────────── */}
      <AnimatePresence>
        {topicSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setTopicSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px] z-[70] bg-card border-r border-border/50 shadow-overlay flex flex-col lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Topics"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={18} className="text-primary" />
                  <h2 className="text-[15px] font-bold tracking-tight">Knowledge Areas</h2>
                </div>
                <button
                  onClick={() => setTopicSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted/80 transition-colors bg-muted/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <button
                  onClick={() => {
                    handleTopicClick(null);
                    setTopicSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-2 border ${
                    !selectedTopic
                      ? "bg-primary/10 border-primary/20 text-foreground"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">📚</span>
                    <span className="text-[14px] font-semibold">All Topics</span>
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
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                        isActive
                          ? "bg-primary/10 border-primary/20 text-foreground"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl leading-none" aria-hidden="true">{topic.icon}</span>
                        <span className="text-[14px] font-semibold truncate flex-1">{topic.title}</span>
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Draggable Note Editor (floating, same-page) ───────────── */}
      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={
              allQuestions.find((q) => q.question.id === activeNoteId)?.question.question ?? "Note"
            }
            value={noteDraft}
            onChange={setNoteDraft}
            onClose={() => setActiveNoteId(null)}
            onSave={handleSaveNote}
            isSaving={upsertingId === activeNoteId}
          />
        )}
      </AnimatePresence>

      {/* ── All Notes Panel ───────────────────────────────────────── */}
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
              className="relative w-full max-w-lg h-full bg-card border-l border-border/50 shadow-overlay flex flex-col"
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
                  const questionData = allQuestions.find((q) => q.question.id === id);
                  return (
                    <div
                      key={id}
                      className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm relative group transition-all hover:border-border/60"
                    >
                      <div className="pr-8 mb-3">
                        {questionData && (
                          <Link
                            to={getCoreJavaQuestionDetailPath(questionData.question)}
                            className="font-bold text-[14.5px] leading-snug hover:text-primary transition-colors"
                          >
                            {questionData.question.question}
                          </Link>
                        )}
                        {!questionData && <p className="font-bold text-[14.5px] leading-snug">{id}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteNoteFromPanel(id)}
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
