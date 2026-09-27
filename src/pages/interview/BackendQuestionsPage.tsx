import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Dumbbell,
  FileText,
  Filter,
  Flame,
  Search,
  Tag,
  X,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { BackendAnswer } from "@/components/interview/BackendAnswer";
import { DifficultyBadge, PriorityBadge } from "@/components/interview/CoreJavaBadges";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import {
  BACKEND_ANNOTATIONS_PATH,
  BACKEND_BASE_PATH,
  BACKEND_PRACTICE_PATH,
  BACKEND_QUESTIONS_PATH,
  BACKEND_TOTAL_QUESTIONS,
  backendQuestionIndex,
  backendTopicStats,
  searchBackendQuestions,
  type IndexedBackendQuestion,
} from "@/lib/backendQuestionIndex";
import { getPracticeProblemsForTopic } from "@/data/backendInterview/practiceProblems";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

type QuickFilter =
  | "all"
  | "must-know"
  | "easy"
  | "medium"
  | "hard"
  | "bookmarked"
  | "studied"
  | "unstudied";

const QUICK_FILTERS: { id: QuickFilter; label: string; icon?: string }[] = [
  { id: "all", label: "All" },
  { id: "must-know", label: "Must know", icon: "🔥" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "studied", label: "Studied" },
  { id: "unstudied", label: "Not studied" },
];

type InlineView = "answer" | "code" | null;

interface CardProps {
  entry: IndexedBackendQuestion;
  studied: boolean;
  bookmarked: boolean;
  view: InlineView;
  onToggleStudied: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onToggleView: (id: string, view: Exclude<InlineView, null>) => void;
}

const QuestionCard = memo(function QuestionCard({
  entry,
  studied,
  bookmarked,
  view,
  onToggleStudied,
  onToggleBookmark,
  onToggleView,
}: CardProps) {
  const { question, meta, topic, number, slug } = entry;

  return (
    <div
      className={cn(
        "cjq-qcard relative overflow-hidden rounded-2xl border transition-all duration-200",
        studied ? "border-success/25 bg-success/5" : "border-border/50 bg-card/70",
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleStudied(question.id)}
            aria-label={studied ? "Mark as not studied" : "Mark as studied"}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
              studied
                ? "border-success bg-success text-success-foreground"
                : "border-border/70 text-transparent hover:border-primary/60",
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono font-semibold text-primary">Q{number}</span>
              <span className="rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5">
                {topic.icon} {topic.shortTitle}
              </span>
              <DifficultyBadge difficulty={meta.difficulty} />
              {(meta.priority === "very-high" || meta.priority === "high") && (
                <PriorityBadge priority={meta.priority} />
              )}
              {meta.versions?.map((v) => (
                <span
                  key={v}
                  className="rounded-md border border-info/25 bg-info/10 px-1.5 py-0.5 text-info"
                >
                  {v}
                </span>
              ))}
            </div>

            <Link
              to={`${BACKEND_QUESTIONS_PATH}/${slug}`}
              className="cjq-list-title block text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary"
            >
              {question.question}
            </Link>

            {meta.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {meta.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleBookmark(question.id)}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            className={cn(
              "shrink-0 rounded-lg p-1.5 transition-colors",
              bookmarked
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
          <button
            type="button"
            onClick={() => onToggleView(question.id, "answer")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              view === "answer"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            {view === "answer" ? "Hide answer" : "Answer"}
          </button>
          {question.code && (
            <button
              type="button"
              onClick={() => onToggleView(question.id, "code")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                view === "code"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              {view === "code" ? "Hide code" : "Code"}
            </button>
          )}
          <Link
            to={`${BACKEND_QUESTIONS_PATH}/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Full page
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <AnimatePresence initial={false}>
          {view && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="cjq-reading mt-4 border-t border-border/40 pt-4 pl-0 sm:pl-9">
                {view === "answer" ? (
                  <>
                    <BackendAnswer answer={question.answer} />
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Interviewer is testing
                      </p>
                      <p className="mt-1 text-sm text-foreground">{question.explanation}</p>
                    </div>
                  </>
                ) : (
                  <CodeBlock
                    title={`${question.id} · example`}
                    language={question.codeLanguage ?? "java"}
                    code={question.code ?? ""}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default function BackendQuestionsPage() {
  const { language = "java" } = useParams<{ language?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const progress = useBackendInterviewProgress();

  const topicParam = searchParams.get("topic") ?? "all";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [openViews, setOpenViews] = useState<Record<string, InlineView>>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = "Spring Boot & Backend Interview Questions | AlgoGuru";
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  const setTopic = useCallback(
    (topicId: string) => {
      const next = new URLSearchParams(searchParams);
      if (topicId === "all") next.delete("topic");
      else next.set("topic", topicId);
      setSearchParams(next, { replace: true });
      scrollPageToTop(document.getElementById("backend-questions-root"));
    },
    [searchParams, setSearchParams],
  );

  const toggleView = useCallback((id: string, view: Exclude<InlineView, null>) => {
    setOpenViews((current) => ({ ...current, [id]: current[id] === view ? null : view }));
  }, []);

  const filtered = useMemo(() => {
    let entries = backendQuestionIndex;

    if (topicParam !== "all") {
      entries = entries.filter((e) => e.topic.id === topicParam);
    }

    switch (quickFilter) {
      case "must-know":
        entries = entries.filter((e) => e.meta.priority === "very-high");
        break;
      case "easy":
      case "medium":
      case "hard":
        entries = entries.filter((e) => e.meta.difficulty === quickFilter);
        break;
      case "bookmarked":
        entries = entries.filter((e) => progress.bookmarkedIds.has(e.question.id));
        break;
      case "studied":
        entries = entries.filter((e) => progress.studiedIds.has(e.question.id));
        break;
      case "unstudied":
        entries = entries.filter((e) => !progress.studiedIds.has(e.question.id));
        break;
      default:
        break;
    }

    return searchBackendQuestions(query, entries);
  }, [topicParam, quickFilter, query, progress.bookmarkedIds, progress.studiedIds]);

  const activeTopic = backendTopicStats.find((s) => s.topic.id === topicParam);
  const relatedPractice = topicParam !== "all" ? getPracticeProblemsForTopic(topicParam) : [];

  return (
    <div id="backend-questions-root" className="cjh-page min-h-full w-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="cjh-breadcrumb mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/interview" className="transition-colors hover:text-foreground">
            Interview Prep
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_BASE_PATH} className="transition-colors hover:text-foreground">
            Spring Boot &amp; Backend
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Questions</span>
        </nav>

        <header className="mb-5">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {activeTopic ? activeTopic.topic.title : "Backend Interview Question Bank"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {activeTopic
              ? activeTopic.topic.blurb
              : `${BACKEND_TOTAL_QUESTIONS} questions with complete, interview-length answers. Expand one inline or open the full page for the deep dive, code and follow-ups.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to={BACKEND_ANNOTATIONS_PATH}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Tag className="h-3.5 w-3.5" />
              Annotation reference
            </Link>
            <Link
              to={BACKEND_PRACTICE_PATH}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              Practice lab
            </Link>
          </div>
        </header>

        {/* Search + filters */}
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search questions, tags, ids…"
                className="w-full rounded-xl border border-border/60 bg-card/70 py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                showFilters
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Topics
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
            </button>
          </div>

          <div className="cjq-scrollbar-hide mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setQuickFilter(option.id)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  quickFilter === option.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {option.icon && <span className="mr-1">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTopic("all")}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                      topicParam === "all"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All topics ({BACKEND_TOTAL_QUESTIONS})
                  </button>
                  {backendTopicStats.map((stat) => (
                    <button
                      key={stat.topic.id}
                      type="button"
                      onClick={() => setTopic(stat.topic.id)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        topicParam === stat.topic.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {stat.topic.icon} {stat.topic.shortTitle} ({stat.total})
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length} question{filtered.length === 1 ? "" : "s"}
            {topicParam !== "all" && activeTopic ? ` in ${activeTopic.topic.shortTitle}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-primary" />
            {filtered.filter((e) => e.meta.priority === "very-high").length} must-know
          </span>
        </div>

        {/* Question list */}
        <div className="space-y-3">
          {filtered.map((entry) => (
            <QuestionCard
              key={entry.question.id}
              entry={entry}
              studied={progress.studiedIds.has(entry.question.id)}
              bookmarked={progress.bookmarkedIds.has(entry.question.id)}
              view={openViews[entry.question.id] ?? null}
              onToggleStudied={progress.toggleStudied}
              onToggleBookmark={progress.toggleBookmark}
              onToggleView={toggleView}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No questions match those filters</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setQuickFilter("all");
                setTopic("all");
              }}
              className="mt-3 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Matching practice */}
        {relatedPractice.length > 0 && (
          <section className="mt-8 rounded-2xl border border-warning/25 bg-warning/5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Dumbbell className="h-4 w-4 text-warning" />
              Practice this topic
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {relatedPractice.length} hands-on problem{relatedPractice.length === 1 ? "" : "s"} for{" "}
              {activeTopic?.topic.shortTitle}. Reading is not recall — build one.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedPractice.map((problem) => (
                <Link
                  key={problem.id}
                  to={`${BACKEND_PRACTICE_PATH}/${problem.id}`}
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-warning/50 hover:text-warning"
                >
                  {problem.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
