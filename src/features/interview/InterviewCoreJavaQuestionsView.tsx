"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  ChevronUp,
  Code2,
  FileText,
  Network,
  PanelLeftOpen,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { CoreJavaBookmarkButton } from "@/components/interview/CoreJavaActions";
import { CoreJavaQuestionAnswer } from "@/components/interview/CoreJavaQuestionAnswer";
import {
  CoreJavaVisualizationBlock,
  hasCoreJavaVisualization,
} from "@/components/interview/CoreJavaVisualizationBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { getCoreJavaQuestionDetailPath } from "@/data/coreJavaInterviewMetadata";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import {
  getAllCoreJavaQuestions,
  type IndexedCoreJavaQuestion,
} from "@/lib/coreJavaQuestionIndex";
import { exportNotesPdf } from "./exportNotesPdf";
import { InterviewNotesDrawer } from "./InterviewNotesDrawer";
import "@/styles/core-java-interview.css";

type SolutionView = "theory" | "code" | "diagram" | null;
type FilterKind =
  | "all"
  | "most-asked"
  | "easy"
  | "medium"
  | "hard"
  | "bookmarked"
  | "completed";

const FILTER_OPTIONS: { id: FilterKind; label: string; icon?: string }[] = [
  { id: "all", label: "All" },
  { id: "most-asked", label: "Most Asked", icon: "🔥" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "completed", label: "Completed" },
];

interface QuestionCardProps {
  entry: IndexedCoreJavaQuestion;
  ordinal: number;
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
  ordinal,
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
    <article className={`cjq-w3-item ${isDone ? "cjq-w3-item--done" : ""}`}>
      <Button variant="bare" size="bare"
        type="button"
        onClick={() => onToggleDone(question.id)}
        title={isDone ? "Mark undone" : "Mark as learned"}
        aria-pressed={isDone}
        aria-label={isDone ? "Mark as not learned" : "Mark as learned"}
        className="cjq-w3-mark"
      >
        {isDone && <Check size={11} strokeWidth={3.5} />}
      </Button>

      <div className="cjq-w3-qrow">
        <span className="cjq-w3-num">{ordinal}.</span>
        <Link href={detailPath} className="cjq-w3-qlink">
          <h3 className="cjq-w3-q">{question.question}</h3>
        </Link>
      </div>

      <div className="cjq-w3-meta">
        <span className="cjq-w3-meta-id">Q{String(entry.index + 1).padStart(2, "0")}</span>
        <span>
          {topic.icon} {topic.title}
        </span>
        {meta.difficulty && (
          <span className={`cjq-w3-meta--${meta.difficulty}`}>
            <span className="cjq-w3-dot" aria-hidden="true" />
            {meta.difficulty}
          </span>
        )}
        {meta.priority === "very-high" && <span>🔥 Very High Priority</span>}
        {meta.javaVersions?.map((v) => <span key={v}>{v}</span>)}
        {isDone && <span className="cjq-w3-meta--learned">Learned</span>}
        {hasNote && <span className="cjq-w3-meta--note">Note added</span>}
        {hasCoreJavaVisualization(question.id) && (
          <span className="hidden sm:inline-flex items-center gap-1">
            <Network size={10} aria-hidden="true" /> Diagram
          </span>
        )}
      </div>

      {question.explanation && <p className="cjq-w3-blurb">{question.explanation}</p>}

      <div className="cjq-w3-actions">
        <Button variant="bare" size="bare"
          type="button"
          onClick={() => onToggleView(question.id, "theory")}
          aria-expanded={activeView === "theory"}
          className="cjq-w3-action"
        >
          <FileText size={13} aria-hidden="true" />
          Quick Answer
          <ChevronUp
            size={12}
            className="cjq-w3-chev"
            style={{
              transform: activeView === "theory" ? "rotate(0deg)" : "rotate(180deg)",
            }}
            aria-hidden="true"
          />
        </Button>

        {question.code && (
          <Button variant="bare" size="bare"
            type="button"
            onClick={() => onToggleView(question.id, "code")}
            aria-expanded={activeView === "code"}
            className="cjq-w3-action"
          >
            <Code2 size={13} aria-hidden="true" />
            Example
            <ChevronUp
              size={12}
              className="cjq-w3-chev"
              style={{
                transform: activeView === "code" ? "rotate(0deg)" : "rotate(180deg)",
              }}
              aria-hidden="true"
            />
          </Button>
        )}

        {hasCoreJavaVisualization(question.id) && (
          <Button variant="bare" size="bare"
            type="button"
            onClick={() => onToggleView(question.id, "diagram")}
            aria-expanded={activeView === "diagram"}
            className="cjq-w3-action"
          >
            <Network size={13} aria-hidden="true" />
            Diagram
            <ChevronUp
              size={12}
              className="cjq-w3-chev"
              style={{
                transform: activeView === "diagram" ? "rotate(0deg)" : "rotate(180deg)",
              }}
              aria-hidden="true"
            />
          </Button>
        )}

        <Button variant="bare" size="bare"
          type="button"
          onClick={() => onOpenNote(question.id)}
          aria-label={
            hasNote ? "Edit note for this question" : "Add note for this question"
          }
          className={`cjq-w3-action cjq-w3-action--note ${
            hasNote ? "cjq-w3-action--on" : ""
          }`}
        >
          <StickyNote size={13} aria-hidden="true" />
          {hasNote ? "Edit Note" : "Note"}
        </Button>

        <span className="cjq-w3-spacer" />

        <CoreJavaBookmarkButton
          questionId={question.id}
          isBookmarked={isBookmarked}
          onToggle={onToggleBookmark}
          compact
          className="cjq-w3-bookmark"
        />

        <Link
          href={detailPath}
          aria-label={`Read full answer: ${question.question}`}
          className="cjq-w3-action"
        >
          Read <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {activeView && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="cjq-w3-answer">
              <span className="cjq-w3-answer-label">
                {activeView === "theory"
                  ? "Answer:"
                  : activeView === "code"
                    ? "Example:"
                    : "Diagram:"}
              </span>
              <div className="cjq-w3-body">
                {activeView === "theory" && (
                  <div className="cjq-doc-box">
                    <CoreJavaQuestionAnswer answer={question.answer} />
                  </div>
                )}
                {activeView === "code" && question.code && (
                  <div className="cjq-w3-code">
                    <CodeBlock
                      surface="reader"
                      language={question.codeLanguage || "java"}
                      code={question.code}
                      title="Implementation"
                    />
                  </div>
                )}
                {activeView === "diagram" &&
                  hasCoreJavaVisualization(question.id) && (
                    <div className="mt-2">
                      <CoreJavaVisualizationBlock questionId={question.id} />
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};

function areQuestionCardsEqual(
  prev: QuestionCardProps,
  next: QuestionCardProps,
): boolean {
  return (
    prev.entry.question.id === next.entry.question.id &&
    prev.ordinal === next.ordinal &&
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.isBookmarked === next.isBookmarked &&
    prev.activeView === next.activeView
  );
}

const QuestionCard = memo(_QuestionCard, areQuestionCardsEqual);

export default function InterviewCoreJavaQuestionsView({
  language: languageProp,
}: {
  language?: string;
}) {
  const params = useParams<{ language?: string }>();
  const language = languageProp ?? params.language;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { doneMap, notesMap, upsertingId, toggleDone, saveNote, deleteNote } =
    useCoreJavaUserState();
  const { isBookmarked, toggleBookmark, bookmarkedIds } = useCoreJavaBookmarks();
  const backRoute = language ? `/interview/${language}` : "/interview";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    searchParams.get("topic"),
  );
  const [activeFilter, setActiveFilter] = useState<FilterKind>(
    (searchParams.get("filter") as FilterKind) || "all",
  );
  const [solutionViewMap, setSolutionViewMap] = useState<
    Record<string, SolutionView>
  >({});
  const [topicSidebarOpen, setTopicSidebarOpen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topicSidebarOpenerRef = useRef<HTMLButtonElement>(null);

  const { setOpen: setGlobalSidebarOpen, toggleSidebar } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  useEffect(() => {
    document.title = "Core Java Interview Questions | AlgoGuru";
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  useEffect(() => {
    setSelectedTopic(searchParams.get("topic"));
    const filter = searchParams.get("filter") as FilterKind | null;
    if (filter && FILTER_OPTIONS.some((f) => f.id === filter)) {
      setActiveFilter(filter);
    } else {
      setActiveFilter("all");
    }
  }, [searchParams]);

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeTopicsOnDesktop = () => {
      if (desktopQuery.matches) setTopicSidebarOpen(false);
    };
    closeTopicsOnDesktop();
    window.addEventListener("resize", closeTopicsOnDesktop);
    return () => window.removeEventListener("resize", closeTopicsOnDesktop);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && !e.defaultPrevented) {
        if (activeNoteId) setActiveNoteId(null);
        if (showNotesPanel) setShowNotesPanel(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeNoteId, showNotesPanel]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      updater(next);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const requireLogin = useCallback(
    (action: string) => {
      toast({
        title: "Please sign in",
        description: `Login is required to ${action}. Your saved progress and notes are stored per account in the database.`,
        variant: "destructive",
      });
      router.push("/auth");
    },
    [router, toast],
  );

  const handleToggleDone = useCallback(
    (id: string) => {
      if (!user && !authLoading) {
        requireLogin("save progress");
        return;
      }
      toggleDone(id);
    },
    [user, authLoading, requireLogin, toggleDone],
  );

  const handleToggleBookmark = useCallback(
    (id: string) => {
      if (!user && !authLoading) {
        requireLogin("save bookmarks");
        return;
      }
      toggleBookmark(id);
    },
    [user, authLoading, requireLogin, toggleBookmark],
  );

  const openNote = useCallback(
    (id: string) => {
      setActiveNoteId(id);
      setNoteDraft(notesMap[id] || "");
    },
    [notesMap],
  );

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

  const toggleSolutionView = useCallback(
    (id: string, view: Exclude<SolutionView, null>) => {
      setSolutionViewMap((prev) => ({
        ...prev,
        [id]: prev[id] === view ? null : view,
      }));
    },
    [],
  );

  const allQuestions = useMemo(() => getAllCoreJavaQuestions(), []);
  const totalQuestions = allQuestions.length;
  const doneCount = useMemo(
    () => allQuestions.filter((q) => doneMap[q.question.id]).length,
    [allQuestions, doneMap],
  );
  const progressPct =
    totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;

  const filteredEntries = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return allQuestions.filter((entry) => {
      const { question, topic, meta } = entry;
      if (selectedTopic && topic.id !== selectedTopic) return false;
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
      switch (activeFilter) {
        case "most-asked":
          if (meta.priority !== "very-high" && meta.priority !== "high")
            return false;
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
  }, [
    allQuestions,
    debouncedSearch,
    selectedTopic,
    activeFilter,
    bookmarkedIds,
    doneMap,
  ]);

  const groupedTopics = useMemo(() => {
    const order = new Map(coreJavaInterviewTopics.map((t) => [t.id, t]));
    const groups = new Map<
      string,
      {
        topic: (typeof coreJavaInterviewTopics)[number];
        entries: IndexedCoreJavaQuestion[];
      }
    >();
    for (const entry of filteredEntries) {
      const g = groups.get(entry.topic.id) ?? {
        topic: entry.topic,
        entries: [],
      };
      g.entries.push(entry);
      groups.set(entry.topic.id, g);
    }
    return Array.from(order.keys())
      .map((id) => groups.get(id))
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
  }, [filteredEntries]);

  const hasActiveFilters =
    Boolean(debouncedSearch.trim()) ||
    Boolean(selectedTopic) ||
    activeFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedTopic(null);
    setActiveFilter("all");
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const handleTopicClick = useCallback(
    (topicId: string | null) => {
      setSelectedTopic(topicId);
      updateSearchParams((next) => {
        if (topicId) next.set("topic", topicId);
        else next.delete("topic");
      });
    },
    [updateSearchParams],
  );

  const handleFilterClick = useCallback(
    (filter: FilterKind) => {
      setActiveFilter(filter);
      updateSearchParams((next) => {
        if (filter === "all") next.delete("filter");
        else next.set("filter", filter);
      });
    },
    [updateSearchParams],
  );

  const handleDownloadPdf = useCallback(() => {
    const items = Object.entries(notesMap)
      .filter(([, note]) => Boolean(note))
      .map(([id, note]) => ({
        title: allQuestions.find((q) => q.question.id === id)?.question.question ?? id,
        note,
      }));
    void exportNotesPdf("Core Java Interview Notes", "Core-Java-Notes.pdf", items);
  }, [allQuestions, notesMap]);

  return (
    <div className="cjq-list-root cjq-w3 cjq-page min-h-screen flex flex-col">
      <header className="cjq-reader-bar shrink-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6">
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <Button variant="bare" size="bare"
                type="button"
                onClick={() => router.push(backRoute)}
                className="cjq-toolbar-btn group flex items-center justify-center w-9 h-9 rounded-full border shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft
                  size={16}
                  className="text-muted-foreground group-hover:text-primary"
                />
              </Button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                    Core Java <span className="text-primary">Q&amp;A</span>
                  </h1>
                </div>
                <nav aria-label="Breadcrumb" className="cjq-crumbs hidden lg:flex">
                  <Link href="/">Home</Link>
                  <ChevronRight
                    size={10}
                    className="cjq-crumbs-sep"
                    aria-hidden="true"
                  />
                  <Link href="/interview/java">Interview</Link>
                  <ChevronRight
                    size={10}
                    className="cjq-crumbs-sep"
                    aria-hidden="true"
                  />
                  <span className="text-[hsl(var(--reader-heading))]">Core Java</span>
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
              <div className="relative hidden md:block">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
                  aria-hidden="true"
                />
                <Input
                  ref={searchInputRef}
                  type="search"
                  role="searchbox"
                  placeholder="Search questions… ( / )"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search Java interview questions"
                  className="cjq-input pl-9 pr-3 py-1.5 h-9 text-sm border rounded-full w-48 lg:w-64"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNotesPanel(true)}
                className="cjq-toolbar-btn px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2 shrink-0 transition-all min-h-[36px] h-auto"
              >
                <StickyNote size={14} />
                <span className="hidden sm:inline">Notes</span>
                {Object.keys(notesMap).length > 0 && (
                  <span className="cjq-filter-count">
                    {Object.keys(notesMap).length}
                  </span>
                )}
              </Button>

              <AppTooltip content="Toggle App Sidebar">
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={toggleSidebar}
                  className="cjq-toolbar-btn w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-all"
                  aria-label="Toggle App Sidebar"
                >
                  <PanelLeftOpen size={16} />
                </Button>
              </AppTooltip>

              <Button variant="bare" size="bare"
                ref={topicSidebarOpenerRef}
                type="button"
                onClick={(event) => {
                  topicSidebarOpenerRef.current = event.currentTarget;
                  setTopicSidebarOpen(true);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 text-muted-foreground hover:text-primary shrink-0 lg:hidden transition-all"
                aria-label="Open Topics"
                aria-haspopup="dialog"
                aria-expanded={topicSidebarOpen}
                aria-controls="core-java-topics-sheet"
              >
                <BookOpen size={16} />
              </Button>
            </div>
          </div>

          <div
            className="cjq-progress"
            role="progressbar"
            aria-label="Overall progress"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full"
              style={{ background: "hsl(var(--reader-accent))" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </header>

      <div className="cjq-toolbar-divider shrink-0 px-4 md:px-6 border-b">
        <div className="relative md:hidden py-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
            aria-hidden="true"
          />
          <Input
            type="search"
            role="searchbox"
            placeholder="Search questions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search Java interview questions"
            className="cjq-input pl-9 pr-3 py-2 text-sm border rounded-full w-full"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-2 cjq-scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <Button variant="bare" size="bare"
              key={filter.id}
              type="button"
              onClick={() => handleFilterClick(filter.id)}
              aria-pressed={activeFilter === filter.id}
              className="cjq-filter-tab"
            >
              {filter.icon && <span aria-hidden="true">{filter.icon} </span>}
              {filter.label}
              {filter.id === "bookmarked" && bookmarkedIds.length > 0 && (
                <span className="cjq-filter-count">({bookmarkedIds.length})</span>
              )}
            </Button>
          ))}
          <span className="cjq-filter-count whitespace-nowrap shrink-0 ml-2">
            {filteredEntries.length} of {totalQuestions} questions
          </span>
          {hasActiveFilters && (
            <Button variant="bare" size="bare"
              type="button"
              onClick={clearFilters}
              className="cjq-filter-reset shrink-0 ml-1"
            >
              <X size={12} aria-hidden="true" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative" style={{ minHeight: 0 }}>
        <aside className="cjq-side cjq-toolbar-divider hidden lg:block w-[240px] xl:w-[268px] shrink-0">
          <ScrollArea className="sticky top-0 h-[calc(100vh-64px)]">
            <div className="p-4 xl:px-5">
              <div className="cjq-side-head">
                <span>Topics</span>
                <span className="cjq-side-count">
                  {doneCount}/{totalQuestions}
                </span>
              </div>

              <Button variant="bare" size="bare"
                type="button"
                onClick={() => handleTopicClick(null)}
                aria-pressed={!selectedTopic}
                className="cjq-side-link"
              >
                <div className="cjq-side-link-row">
                  <span aria-hidden="true">📚</span>
                  <span className="cjq-side-link-title">All Topics</span>
                </div>
              </Button>

              <div>
                {coreJavaInterviewTopics.map((topic) => {
                  const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                  const topicTotal = topic.questions.length;
                  const pct =
                    topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                  const isActive = selectedTopic === topic.id;

                  return (
                    <Button variant="bare" size="bare"
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicClick(isActive ? null : topic.id)}
                      aria-pressed={isActive}
                      className="cjq-side-link"
                    >
                      <div className="cjq-side-link-row">
                        <span className="shrink-0" aria-hidden="true">
                          {topic.icon}
                        </span>
                        <span className="cjq-side-link-title">{topic.title}</span>
                        <span className="cjq-side-link-num">
                          {topicDone}/{topicTotal}
                        </span>
                      </div>
                      <div className="cjq-side-progress">
                        <div
                          className={`cjq-side-progress-fill ${
                            pct === 100 ? "cjq-side-progress-fill--complete" : ""
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="w-full max-w-[1120px] mx-auto px-4 md:px-8 xl:px-10 py-8 pb-24">
            {!user && !authLoading && (
              <Alert className="cjq-w3-signin mb-10 border-warning/30 bg-warning/5">
                <AlertDescription className="cjq-w3-signin-text">
                  <strong>Your progress isn&apos;t being saved.</strong> Sign in to keep
                  completed questions, bookmarks and notes in sync across devices.
                </AlertDescription>
                <Button variant="bare" size="bare"
                  type="button"
                  onClick={() => router.push("/auth")}
                  className="cjq-w3-signin-btn"
                >
                  Sign In
                </Button>
              </Alert>
            )}

            {groupedTopics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="cjq-w3-empty-icon">
                  <Search size={26} aria-hidden="true" />
                </div>
                <h3 className="cjq-w3-empty-title">No questions found</h3>
                <p className="cjq-w3-empty-body">
                  Try a different search or clear your filters.
                </p>
                {hasActiveFilters && (
                  <Button variant="bare" size="bare"
                    type="button"
                    onClick={clearFilters}
                    className="cjq-w3-signin-btn mt-6"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {groupedTopics.map((group) => (
              <section key={group.topic.id} className="cjq-w3-section">
                <div className="cjq-w3-section-head">
                  <span className="cjq-w3-section-icon" aria-hidden="true">
                    {group.topic.icon}
                  </span>
                  <h2 className="cjq-list-topic">{group.topic.title}</h2>
                </div>
                <p className="cjq-w3-section-meta">
                  {group.entries.length} question{group.entries.length !== 1 ? "s" : ""}
                  {selectedTopic && ` · filtered from ${group.topic.questions.length}`}
                </p>

                <div className="cjq-w3-list">
                  {group.entries.map((entry, i) => (
                    <QuestionCard
                      key={entry.question.id}
                      entry={entry}
                      ordinal={i + 1}
                      isDone={Boolean(doneMap[entry.question.id])}
                      hasNote={Boolean(notesMap[entry.question.id])}
                      isBookmarked={isBookmarked(entry.question.id)}
                      activeView={solutionViewMap[entry.question.id] ?? null}
                      onToggleDone={handleToggleDone}
                      onToggleView={toggleSolutionView}
                      onOpenNote={openNote}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <Sheet open={topicSidebarOpen} onOpenChange={setTopicSidebarOpen}>
        <SheetContent
          id="core-java-topics-sheet"
          side="left"
          overlayClassName="z-[40] lg:hidden"
          showClose={false}
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            topicSidebarOpenerRef.current?.focus();
            topicSidebarOpenerRef.current = null;
          }}
          className="z-[40] flex h-full w-[280px] max-w-[85vw] flex-col gap-0 overflow-hidden border-r border-border/50 bg-card p-0 shadow-overlay backdrop-blur-none sm:w-[320px] sm:max-w-[320px] lg:hidden"
        >
          <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <BookOpen size={18} className="text-primary" />
              <div>
                <SheetTitle className="text-[15px] font-bold tracking-tight">
                  Knowledge Areas
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Browse Core Java interview topics and track your progress.
                </SheetDescription>
              </div>
            </div>
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => setTopicSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-muted/80 transition-colors bg-muted/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4">
              <Button variant="bare" size="bare"
                type="button"
                onClick={() => {
                  handleTopicClick(null);
                  setTopicSidebarOpen(false);
                }}
                aria-pressed={!selectedTopic}
                className="cjq-side-link"
              >
                <div className="cjq-side-link-row">
                  <span aria-hidden="true">📚</span>
                  <span className="cjq-side-link-title">All Topics</span>
                </div>
              </Button>

              {coreJavaInterviewTopics.map((topic) => {
                const topicDone = topic.questions.filter((q) => doneMap[q.id]).length;
                const topicTotal = topic.questions.length;
                const pct =
                  topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;
                const isActive = selectedTopic === topic.id;
                return (
                  <Button variant="bare" size="bare"
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      handleTopicClick(topic.id);
                      setTopicSidebarOpen(false);
                    }}
                    aria-pressed={isActive}
                    className="cjq-side-link"
                  >
                    <div className="cjq-side-link-row">
                      <span className="shrink-0" aria-hidden="true">
                        {topic.icon}
                      </span>
                      <span className="cjq-side-link-title">{topic.title}</span>
                      <span className="cjq-side-link-num">
                        {topicDone}/{topicTotal}
                      </span>
                    </div>
                    <div className="cjq-side-progress">
                      <div
                        className={`cjq-side-progress-fill ${
                          pct === 100 ? "cjq-side-progress-fill--complete" : ""
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {activeNoteId && (
          <DraggableNoteEditor
            questionTitle={
              allQuestions.find((q) => q.question.id === activeNoteId)?.question
                .question ?? "Note"
            }
            value={noteDraft}
            onChange={setNoteDraft}
            onClose={() => setActiveNoteId(null)}
            onSave={handleSaveNote}
            isSaving={upsertingId === activeNoteId}
          />
        )}
      </AnimatePresence>

      <InterviewNotesDrawer
        open={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        notesMap={notesMap}
        getQuestionMeta={(id) => {
          const entry = allQuestions.find((q) => q.question.id === id);
          return entry
            ? {
                title: entry.question.question,
                href: getCoreJavaQuestionDetailPath(entry.question),
              }
            : { title: id };
        }}
        deletingNoteId={deletingNoteId}
        onDeleteNote={handleDeleteNoteFromPanel}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}
