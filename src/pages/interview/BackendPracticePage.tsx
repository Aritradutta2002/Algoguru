import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Search,
  Target,
  X,
} from "lucide-react";
import {
  BACKEND_PRACTICE_PROBLEMS,
  PRACTICE_PROBLEM_COUNT,
  PRACTICE_TOTAL_MINUTES,
  type BackendPracticeProblem,
  type PracticeDifficulty,
} from "@/data/backendInterview/practiceProblems";
import { BACKEND_TOPICS } from "@/data/backendInterview/topics";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import { BACKEND_BASE_PATH, BACKEND_PRACTICE_PATH } from "@/lib/backendQuestionIndex";
import { cn } from "@/lib/utils";
import "@/styles/core-java-interview.css";

const DIFFICULTY_STYLES: Record<PracticeDifficulty, string> = {
  easy: "border-success/25 bg-success/10 text-success",
  medium: "border-warning/25 bg-warning/10 text-warning",
  hard: "border-destructive/25 bg-destructive/10 text-destructive",
};

function ProblemCard({
  problem,
  solved,
  onToggle,
}: {
  problem: BackendPracticeProblem;
  solved: boolean;
  onToggle: (id: string) => void;
}) {
  const firstLine = problem.scenario.split("\n\n")[0];
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        solved ? "border-success/30 bg-success/5" : "border-border/50 bg-card/70 hover:border-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(problem.id)}
          aria-label={solved ? "Mark as unsolved" : "Mark as solved"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            solved
              ? "border-success bg-success text-success-foreground"
              : "border-border/70 text-transparent hover:border-primary/60",
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-mono font-semibold text-primary">{problem.id}</span>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 capitalize",
                DIFFICULTY_STYLES[problem.difficulty],
              )}
            >
              {problem.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {problem.estimatedMinutes} min
            </span>
            <span className="text-muted-foreground">{problem.tasks.length} tasks</span>
          </div>
          <Link
            to={`${BACKEND_PRACTICE_PATH}/${problem.id}`}
            className="block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {problem.title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {firstLine.replace(/`/g, "")}
          </p>
        </div>
      </div>
      <Link
        to={`${BACKEND_PRACTICE_PATH}/${problem.id}`}
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
      >
        Open problem
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function BackendPracticePage() {
  const { language = "java" } = useParams<{ language?: string }>();
  const progress = useBackendInterviewProgress();
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | PracticeDifficulty>("all");

  useEffect(() => {
    document.title = "Backend Practice Lab | AlgoGuru";
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BACKEND_PRACTICE_PROBLEMS.filter((problem) => {
      if (topicFilter !== "all" && problem.topic !== topicFilter) return false;
      if (difficultyFilter !== "all" && problem.difficulty !== difficultyFilter) return false;
      if (!needle) return true;
      return (
        problem.title.toLowerCase().includes(needle) ||
        problem.scenario.toLowerCase().includes(needle) ||
        problem.id.toLowerCase() === needle
      );
    });
  }, [query, topicFilter, difficultyFilter]);

  const grouped = useMemo(() => {
    return BACKEND_TOPICS.map((topic) => ({
      topic,
      problems: filtered.filter((problem) => problem.topic === topic.id),
    })).filter((group) => group.problems.length > 0);
  }, [filtered]);

  const solvedPercent = PRACTICE_PROBLEM_COUNT
    ? Math.round((progress.practiceSolvedCount / PRACTICE_PROBLEM_COUNT) * 100)
    : 0;

  return (
    <div className="cjh-page min-h-full w-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="cjh-breadcrumb mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_BASE_PATH} className="transition-colors hover:text-foreground">
            Spring Boot &amp; Backend
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Practice Lab</span>
        </nav>

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
            <Dumbbell className="h-6 w-6 text-warning" />
            Practice With Problems
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {PRACTICE_PROBLEM_COUNT} exercises you could realistically be handed in a pairing round — a
            scenario, explicit acceptance criteria, progressive hints, a complete worked solution and a
            debrief on what the interviewer is actually grading. About{" "}
            {Math.round(PRACTICE_TOTAL_MINUTES / 60)} hours of hands-on work.
          </p>
        </motion.header>

        <section className="mb-5 rounded-2xl border border-border/50 bg-card/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              {progress.practiceSolvedCount} of {PRACTICE_PROBLEM_COUNT} solved
            </h2>
            <span className="text-lg font-black text-primary">{solvedPercent}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-warning"
              initial={{ width: 0 }}
              animate={{ width: `${solvedPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </section>

        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems…"
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

          <div className="cjq-scrollbar-hide mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {(["all", "easy", "medium", "hard"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyFilter(level)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  difficultyFilter === level
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {level}
              </button>
            ))}
            <span className="mx-1 w-px shrink-0 bg-border/60" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setTopicFilter("all")}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                topicFilter === "all"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground",
              )}
            >
              All topics
            </button>
            {BACKEND_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setTopicFilter(topic.id)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  topicFilter === topic.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {topic.icon} {topic.shortTitle}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {grouped.map(({ topic, problems }) => (
            <section key={topic.id}>
              <div className="cjh-section-header mb-3">
                <h2 className="cjh-section-title flex items-center gap-2 text-base font-bold text-foreground">
                  <span aria-hidden="true">{topic.icon}</span>
                  {topic.shortTitle}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({problems.length})
                  </span>
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {problems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    solved={progress.solvedPracticeIds.has(problem.id)}
                    onToggle={progress.togglePracticeSolved}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {grouped.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No problems match those filters</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTopicFilter("all");
                setDifficultyFilter("all");
              }}
              className="mt-3 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
