"use client";

import type { ReactNode } from "react";
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
  Code2,
  FileText,
  PanelLeftOpen,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppTooltip } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { CodeBlock } from "@/components/CodeBlock";
import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { CppBookmarkButton } from "@/components/interview/CppActions";
import {
  CppDifficultyBadge,
  CppPriorityBadge,
} from "@/components/interview/CppBadges";
import { CppQuestionAnswer } from "@/components/interview/CppQuestionAnswer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import type { InterviewQuestion, InterviewTopic } from "@/data/coreJavaInterviewData";
import type { Difficulty, InterviewPriority } from "@/data/cppInterviewMetadata";
import { exportNotesPdf } from "./exportNotesPdf";
import { InterviewNotesDrawer } from "./InterviewNotesDrawer";
import "@/styles/core-java-interview.css";

type SolutionView = "theory" | "code" | null;
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

export interface LanguageQuestionEntry {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: {
    difficulty?: Difficulty;
    priority?: InterviewPriority;
    tags?: string[];
  };
}

export interface LanguageQuestionsConfig {
  language?: string;
  defaultLanguageSlug: "cpp" | "python";
  languageLabel: string;
  pageTitle: string;
  codeLanguage: string;
  pdfTitle: string;
  pdfFilename: string;
  topics: InterviewTopic[];
  allQuestions: LanguageQuestionEntry[];
  doneMap: Record<string, boolean>;
  notesMap: Record<string, string>;
  upsertingId: string | null;
  toggleDone: (id: string) => void;
  saveNote: (id: string, note: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  getDetailPath: (question: InterviewQuestion) => string;
  renderExtraMeta?: (entry: LanguageQuestionEntry) => ReactNode;
}

interface QuestionCardProps {
  entry: LanguageQuestionEntry;
  codeLanguage: string;
  detailPath: string;
  extraMeta?: ReactNode;
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
  codeLanguage,
  detailPath,
  extraMeta,
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

  return (
    <Card
      className={`rounded-2xl transition-all duration-200 overflow-hidden relative shadow-none ${
        isDone
          ? "bg-success/5 border-success/20"
          : activeView
            ? "bg-card border-primary/30 shadow-sm"
            : "bg-card border-border/40 hover:border-border/60"
      }`}
    >
      {activeView && !isDone && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl"
          aria-hidden="true"
        />
      )}

      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <Button variant="bare" size="bare"
            type="button"
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
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                Q{String(entry.index + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/70 flex items-center gap-1">
                {topic.icon} {topic.title}
              </span>
              {meta.difficulty && <CppDifficultyBadge difficulty={meta.difficulty} />}
              {meta.priority === "very-high" && (
                <CppPriorityBadge priority="very-high" />
              )}
              {extraMeta}
              {isDone && (
                <Badge className="text-[10px] font-bold bg-success/10 text-success rounded-full border-transparent">
                  Learned
                </Badge>
              )}
              {hasNote && (
                <Badge className="text-[10px] font-bold bg-warning/10 text-warning rounded-full border-transparent">
                  Note Added
                </Badge>
              )}
            </div>

            <Link href={detailPath} className="group/title block">
              <h3
                className={`text-[19px] font-bold leading-[1.5] mb-2.5 transition-colors group-hover/title:text-primary ${
                  isDone ? "opacity-40 line-through text-foreground" : "text-foreground"
                }`}
              >
                {question.question}
              </h3>
            </Link>

            {question.explanation && (
              <p
                className={`text-[14.5px] leading-[1.75] mb-4 ${
                  isDone ? "opacity-40" : "text-muted-foreground"
                }`}
              >
                {question.explanation}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/20">
              <Button
                type="button"
                variant={activeView === "theory" ? "accent" : "secondary"}
                size="sm"
                onClick={() => onToggleView(question.id, "theory")}
                aria-expanded={activeView === "theory"}
                className={`h-auto px-4 py-2 min-h-[36px] text-[13px] font-semibold ${
                  activeView === "theory"
                    ? "shadow-md shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText size={14} />
                Quick Answer
              </Button>

              {question.code && (
                <Button
                  type="button"
                  variant={activeView === "code" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onToggleView(question.id, "code")}
                  aria-expanded={activeView === "code"}
                  className={`h-auto px-4 py-2 min-h-[36px] text-[13px] font-semibold ${
                    activeView === "code"
                      ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Code2 size={14} />
                  Example
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenNote(question.id)}
                aria-label={
                  hasNote ? "Edit note for this question" : "Add note for this question"
                }
                className={`h-auto px-4 py-2 min-h-[36px] text-[13px] font-semibold ${
                  hasNote
                    ? "bg-warning/15 text-warning hover:bg-warning/25 hover:text-warning"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote size={14} />
                {hasNote ? "Edit Note" : "Note"}
              </Button>

              <div className="flex-1" />

              <CppBookmarkButton
                questionId={question.id}
                isBookmarked={isBookmarked}
                onToggle={onToggleBookmark}
                compact
              />

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-auto px-3.5 py-2 min-h-[36px] bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground text-[12px] font-semibold"
              >
                <Link
                  href={detailPath}
                  aria-label={`Read full answer: ${question.question}`}
                >
                  Read <ArrowRight size={13} />
                </Link>
              </Button>
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
            <div className="p-5 md:p-6 space-y-4">
              {activeView === "theory" && (
                <div className="bg-muted/30 rounded-xl p-5 md:p-6 border border-border/20 shadow-inner">
                  <CppQuestionAnswer answer={question.answer} />
                </div>
              )}
              {activeView === "code" && question.code && (
                <div className="rounded-xl overflow-hidden shadow-lg border border-border/30">
                  <CodeBlock
                    language={question.codeLanguage || codeLanguage}
                    code={question.code}
                    title="Implementation"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

function areQuestionCardsEqual(
  prev: QuestionCardProps,
  next: QuestionCardProps,
): boolean {
  return (
    prev.entry.question.id === next.entry.question.id &&
    prev.isDone === next.isDone &&
    prev.hasNote === next.hasNote &&
    prev.isBookmarked === next.isBookmarked &&
    prev.activeView === next.activeView
  );
}

const QuestionCard = memo(_QuestionCard, areQuestionCardsEqual);

export function LanguageQuestionsView({
  language: languageProp,
  defaultLanguageSlug,
  languageLabel,
  pageTitle,
  codeLanguage,
  pdfTitle,
  pdfFilename,
  topics,
  allQuestions,
  doneMap,
  notesMap,
  upsertingId,
  toggleDone,
  saveNote,
  deleteNote,
  isBookmarked,
  toggleBookmark,
  bookmarkedIds,
  getDetailPath,
  renderExtraMeta,
}: LanguageQuestionsConfig) {
  const params = useParams<{ language?: string }>();
  const language = languageProp ?? params.language;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
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

  const { setOpen: setGlobalSidebarOpen, toggleSidebar } = useSidebar();
  const sidebarWasOpen = useRef<boolean | null>(null);

  useEffect(() => {
    document.title = pageTitle;
    return () => {
      document.title = "AlgoGuru";
    };
  }, [pageTitle]);

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
    const order = new Map(topics.map((t) => [t.id, t]));
    const groups = new Map<
      string,
      { topic: InterviewTopic; entries: LanguageQuestionEntry[] }
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
  }, [topics, filteredEntries]);

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
    void exportNotesPdf(pdfTitle, pdfFilename, items);
  }, [allQuestions, notesMap, pdfFilename, pdfTitle]);

  return (
    <Sheet open={topicSidebarOpen} onOpenChange={setTopicSidebarOpen}>
      <div className="cjq-page min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      <header className="shrink-0 bg-card/90 backdrop-blur-xl border-b border-border/30 relative z-30">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => router.push(backRoute)}
              className="group flex items-center justify-center w-9 h-9 rounded-full border border-border/40 bg-card hover:bg-muted/60 transition-all shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-0.5"
              />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0 hidden sm:block">
                <Code2 size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <nav
                  aria-label="Breadcrumb"
                  className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono mb-0.5"
                >
                  <Link href="/" className="hover:text-primary transition-colors">
                    Home
                  </Link>
                  <ChevronRight size={9} aria-hidden="true" />
                  <Link
                    href={`/interview/${defaultLanguageSlug}`}
                    className="hover:text-primary transition-colors"
                  >
                    Interview
                  </Link>
                  <ChevronRight size={9} aria-hidden="true" />
                  <span className="text-foreground/70">{languageLabel}</span>
                </nav>
                <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
                  {languageLabel} <span className="text-primary">Q&amp;A</span>
                </h1>
              </div>
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
                aria-label={`Search ${languageLabel} interview questions`}
                className="pl-9 pr-3 py-1.5 h-9 text-sm border-border/40 bg-muted/20 rounded-full w-48 lg:w-64"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNotesPanel(true)}
              className="rounded-full text-sm font-semibold border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground gap-2 min-h-[36px]"
            >
              <StickyNote size={14} />
              <span className="hidden sm:inline">Notes</span>
              {Object.keys(notesMap).length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-warning/20 text-warning text-[11px] font-bold">
                  {Object.keys(notesMap).length}
                </span>
              )}
            </Button>

            <AppTooltip content="Toggle App Sidebar">
              <Button variant="bare" size="bare"
                type="button"
                onClick={toggleSidebar}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-all"
                aria-label="Toggle App Sidebar"
              >
                <PanelLeftOpen size={16} />
              </Button>
            </AppTooltip>

            <SheetTrigger asChild>
              <Button variant="bare" size="bare"
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-border/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 lg:hidden transition-all"
                aria-label="Open Topics"
              >
                <BookOpen size={16} />
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <div
          className="h-[2px] w-full bg-muted/40 relative"
          role="progressbar"
          aria-label="Overall progress"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="absolute left-0 top-0 bottom-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      <div className="shrink-0 px-4 md:px-6 py-3 bg-card border-b border-border/20">
        <div className="relative md:hidden mb-3">
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
            aria-label={`Search ${languageLabel} interview questions`}
            className="pl-9 pr-3 py-2 text-sm border-border/40 bg-muted/20 rounded-full w-full"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 cjq-scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <Button variant="bare" size="bare"
              key={filter.id}
              type="button"
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
              {filter.id === "bookmarked" &&
                bookmarkedIds.length > 0 &&
                ` (${bookmarkedIds.length})`}
            </Button>
          ))}
          <span className="text-[11px] font-mono text-muted-foreground/60 whitespace-nowrap shrink-0 ml-1">
            {filteredEntries.length} of {totalQuestions} questions
          </span>
          {hasActiveFilters && (
            <Button variant="bare" size="bare"
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-full text-[12px] font-semibold text-destructive border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 whitespace-nowrap shrink-0 transition-all"
            >
              <X size={12} /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative" style={{ minHeight: 0 }}>
        <aside className="hidden lg:block w-[240px] xl:w-[270px] shrink-0 border-r border-border/40 bg-card/30">
          <ScrollArea className="sticky top-0 h-[calc(100vh-64px)]">
            <div className="p-4">
              <h2 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center justify-between">
                <span>Topics</span>
                <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-foreground/80 lowercase tracking-normal font-mono">
                  {doneCount}/{totalQuestions}
                </span>
              </h2>

              <Button variant="bare" size="bare"
                type="button"
                onClick={() => handleTopicClick(null)}
                aria-pressed={!selectedTopic}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all mb-1.5 border ${
                  !selectedTopic
                    ? "bg-primary/10 border-primary/20 text-foreground"
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" aria-hidden="true">
                    📚
                  </span>
                  <span className="text-[13px] font-semibold">All Topics</span>
                </div>
              </Button>

              <div className="space-y-1">
                {topics.map((topic) => {
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
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all border ${
                        isActive
                          ? "bg-primary/5 border-primary/20 text-foreground shadow-sm"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-base shrink-0" aria-hidden="true">
                          {topic.icon}
                        </span>
                        <span className="text-[12.5px] font-semibold truncate flex-1 leading-tight">
                          {topic.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                          {topicDone}/{topicTotal}
                        </span>
                      </div>
                      <div className="ml-[30px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))",
                          }}
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
          <div className="w-full px-4 md:px-8 lg:px-10 xl:px-14 py-6 pb-24">
            <div className="space-y-10">
              {!user && !authLoading && (
                <Alert className="rounded-2xl border-warning/30 bg-warning/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <AlertTitle className="text-sm font-bold text-warning mb-1">
                      Your progress isn&apos;t being saved
                    </AlertTitle>
                    <AlertDescription className="text-[13px] text-muted-foreground leading-relaxed">
                      Sign in to save your completed questions, bookmarks and personal notes
                      across devices.
                    </AlertDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push("/auth")}
                    className="rounded-lg bg-warning text-warning-foreground font-bold text-sm shrink-0 hover:bg-warning/90 min-h-[40px] px-6"
                  >
                    Sign In
                  </Button>
                </Alert>
              )}

              {groupedTopics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                    <Search size={28} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No questions found
                  </h3>
                  <p className="text-[15px] text-muted-foreground max-w-sm">
                    Try a different search or clear your filters.
                  </p>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearFilters}
                      className="mt-6 bg-primary/10 text-primary hover:bg-primary/20 min-h-[40px] px-6"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {groupedTopics.map((group) => (
                <div key={group.topic.id} className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-border/30">
                    <div
                      className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shrink-0"
                      aria-hidden="true"
                    >
                      {group.topic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[20px] font-bold tracking-tight text-foreground leading-tight">
                        {group.topic.title}
                      </h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {group.entries.length} question
                        {group.entries.length !== 1 ? "s" : ""}
                        {selectedTopic && ` · filtered from ${group.topic.questions.length}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {group.entries.map((entry) => (
                      <QuestionCard
                        key={entry.question.id}
                        entry={entry}
                        codeLanguage={codeLanguage}
                        detailPath={getDetailPath(entry.question)}
                        extraMeta={renderExtraMeta?.(entry)}
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
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <SheetContent
        side="left"
        overlayClassName="z-[40] lg:hidden"
        showClose={false}
        aria-modal="true"
        className="z-[40] flex h-full w-[280px] flex-col gap-0 overflow-hidden border-r border-border/50 bg-card p-0 shadow-overlay backdrop-blur-none sm:w-[320px] lg:hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-primary" aria-hidden="true" />
            <div>
              <SheetTitle className="text-[15px] font-bold tracking-tight">
                Topics
              </SheetTitle>
              <SheetDescription className="sr-only">
                Browse {languageLabel} interview topics and questions.
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button variant="bare" size="bare"
              type="button"
              className="p-2 rounded-lg hover:bg-muted/80 transition-colors bg-muted/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </Button>
          </SheetClose>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4 space-y-1.5">
            <Button variant="bare" size="bare"
              type="button"
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
                <span className="text-xl" aria-hidden="true">
                  📚
                </span>
                <span className="text-[14px] font-semibold">All Topics</span>
              </div>
            </Button>

            {topics.map((topic) => {
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
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                    isActive
                      ? "bg-primary/10 border-primary/20 text-foreground"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl leading-none" aria-hidden="true">
                      {topic.icon}
                    </span>
                    <span className="text-[14px] font-semibold truncate flex-1">
                      {topic.title}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">
                      {topicDone}/{topicTotal}
                    </span>
                  </div>
                  <div className="ml-[34px] h-[3px] rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct === 100
                            ? "hsl(var(--success))"
                            : "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>

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
                href: getDetailPath(entry.question),
              }
            : { title: id };
        }}
        deletingNoteId={deletingNoteId}
        onDeleteNote={handleDeleteNoteFromPanel}
        onDownloadPdf={handleDownloadPdf}
      />
      </div>
    </Sheet>
  );
}
