import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  Play,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { BackendAnswer, BackendInline } from "@/components/interview/BackendAnswer";
import {
  BACKEND_PRACTICE_PROBLEMS,
  PRACTICE_PROBLEM_BY_ID,
  type PracticeDifficulty,
} from "@/data/backendInterview/practiceProblems";
import { BACKEND_TOPIC_BY_ID } from "@/data/backendInterview/topics";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import {
  BACKEND_BASE_PATH,
  BACKEND_PRACTICE_PATH,
  BACKEND_QUESTIONS_PATH,
  getBackendQuestionById,
} from "@/lib/backendQuestionIndex";
import { cn } from "@/lib/utils";
import { scrollPageToTop } from "@/lib/scrollUtils";
import "@/styles/core-java-interview.css";

const DIFFICULTY_STYLES: Record<PracticeDifficulty, string> = {
  easy: "border-success/25 bg-success/10 text-success",
  medium: "border-warning/25 bg-warning/10 text-warning",
  hard: "border-destructive/25 bg-destructive/10 text-destructive",
};

export default function BackendPracticeDetailPage() {
  const { problemId, language = "java" } = useParams<{ problemId?: string; language?: string }>();
  const navigate = useNavigate();
  const progress = useBackendInterviewProgress();
  const rootRef = useRef<HTMLDivElement>(null);

  const problem = problemId ? PRACTICE_PROBLEM_BY_ID[problemId] : undefined;

  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (problemId && !problem) navigate(BACKEND_PRACTICE_PATH, { replace: true });
  }, [problem, problemId, navigate]);

  useEffect(() => {
    if (!problem) return;
    document.title = `${problem.title} — Practice | AlgoGuru`;
    setCheckedTasks(new Set());
    setRevealedHints(0);
    setShowSolution(false);
    scrollPageToTop(rootRef.current);
    return () => {
      document.title = "AlgoGuru";
    };
  }, [problem]);

  const position = useMemo(
    () => BACKEND_PRACTICE_PROBLEMS.findIndex((item) => item.id === problemId),
    [problemId],
  );
  const previous = position > 0 ? BACKEND_PRACTICE_PROBLEMS[position - 1] : undefined;
  const next =
    position >= 0 && position < BACKEND_PRACTICE_PROBLEMS.length - 1
      ? BACKEND_PRACTICE_PROBLEMS[position + 1]
      : undefined;

  const related = useMemo(
    () =>
      (problem?.relatedQuestionIds ?? [])
        .map((id) => getBackendQuestionById(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [problem],
  );

  if (!problem) return null;

  const topic = BACKEND_TOPIC_BY_ID[problem.topic];
  const solved = progress.solvedPracticeIds.has(problem.id);
  const allTasksChecked = checkedTasks.size === problem.tasks.length;

  const toggleTask = (index: number) => {
    setCheckedTasks((current) => {
      const nextSet = new Set(current);
      if (nextSet.has(index)) nextSet.delete(index);
      else nextSet.add(index);
      return nextSet;
    });
  };

  return (
    <div ref={rootRef} className="cjd-page min-h-full w-full">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="cjh-breadcrumb mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_BASE_PATH} className="transition-colors hover:text-foreground">
            Spring Boot &amp; Backend
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_PRACTICE_PATH} className="transition-colors hover:text-foreground">
            Practice Lab
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{problem.id}</span>
        </nav>

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="cjd-surface rounded-2xl border border-border/50 bg-card/70 p-5 sm:p-6"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-mono font-semibold text-primary">{problem.id}</span>
            {topic && (
              <Link
                to={`${BACKEND_QUESTIONS_PATH}?topic=${topic.id}`}
                className="rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-primary"
              >
                {topic.icon} {topic.shortTitle}
              </Link>
            )}
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
          </div>

          <h1 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">
            {problem.title}
          </h1>

          <button
            type="button"
            onClick={() => progress.togglePracticeSolved(problem.id)}
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              solved
                ? "border-success/40 bg-success/10 text-success"
                : "border-border/60 text-muted-foreground hover:border-success/40 hover:text-success",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {solved ? "Solved" : "Mark as solved"}
          </button>
        </motion.header>

        {/* Scenario */}
        <section className="cjd-section mt-6">
          <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Play className="h-4 w-4" />
            </span>
            The Scenario
          </h2>
          <div className="cjd-surface cjq-reading mt-3 rounded-2xl border border-border/50 bg-card/70 p-5">
            <BackendAnswer answer={problem.scenario} />
          </div>
        </section>

        {/* Tasks */}
        <section className="cjd-section mt-8">
          <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 text-info">
              <ListChecks className="h-4 w-4" />
            </span>
            Acceptance Criteria
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {checkedTasks.size}/{problem.tasks.length}
            </span>
          </h2>
          <ul className="mt-3 space-y-2">
            {problem.tasks.map((task, idx) => {
              const checked = checkedTasks.has(idx);
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => toggleTask(idx)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      checked
                        ? "border-success/30 bg-success/5"
                        : "border-border/50 bg-card/60 hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        checked
                          ? "border-success bg-success text-success-foreground"
                          : "border-border/70 text-transparent",
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-relaxed",
                        checked ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      <BackendInline text={task} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {allTasksChecked && !solved && (
            <p className="mt-3 rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-xs text-success">
              Every criterion ticked — mark the problem as solved at the top.
            </p>
          )}
        </section>

        {/* Starter code */}
        {problem.starterCode && (
          <section className="cjd-section mt-8">
            <h2 className="cjd-section-heading text-lg font-bold text-foreground">Starter Code</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Copy this into your editor and fill in the gaps before looking at anything below.
            </p>
            <div className="mt-3">
              <CodeBlock
                title="Starter"
                language={problem.solutionLanguage || "java"}
                code={problem.starterCode}
              />
            </div>
          </section>
        )}

        {/* Hints */}
        <section className="cjd-section mt-8">
          <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Lightbulb className="h-4 w-4" />
            </span>
            Hints
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {revealedHints}/{problem.hints.length} revealed
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {problem.hints.slice(0, revealedHints).map((hint, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 rounded-xl border border-warning/25 bg-warning/5 p-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-warning/20 text-[11px] font-bold text-warning">
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed text-foreground">
                  <BackendInline text={hint} />
                </span>
              </motion.div>
            ))}
          </div>
          {revealedHints < problem.hints.length && (
            <button
              type="button"
              onClick={() => setRevealedHints((count) => count + 1)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/10"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Reveal hint {revealedHints + 1} of {problem.hints.length}
            </button>
          )}
        </section>

        {/* Solution */}
        <section className="cjd-section mt-8">
          <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
              <Eye className="h-4 w-4" />
            </span>
            Worked Solution
          </h2>
          <button
            type="button"
            onClick={() => setShowSolution((v) => !v)}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              showSolution
                ? "border-border/60 text-muted-foreground hover:text-foreground"
                : "border-success/30 bg-success/5 text-success hover:bg-success/10",
            )}
          >
            {showSolution ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showSolution ? "Hide solution" : "Show solution"}
          </button>
          <AnimatePresence initial={false}>
            {showSolution && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <CodeBlock
                    title={`${problem.id} · solution`}
                    language={problem.solutionLanguage || "java"}
                    code={problem.solution}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Discussion */}
        <section className="cjd-section mt-8">
          <h2 className="cjd-section-heading flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="cjd-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareQuote className="h-4 w-4" />
            </span>
            Interview Debrief
          </h2>
          <div className="cjq-reading mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <BackendAnswer answer={problem.discussion} />
          </div>
        </section>

        {/* Related theory */}
        {related.length > 0 && (
          <section className="cjd-section mt-8">
            <h2 className="cjd-section-heading text-lg font-bold text-foreground">Read the theory</h2>
            <div className="mt-3 space-y-1.5">
              {related.map((item) => (
                <Link
                  key={item.question.id}
                  to={`${BACKEND_QUESTIONS_PATH}/${item.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span className="font-mono text-[11px] text-primary">Q{item.number}</span>
                  <span className="truncate">{item.question.question}</span>
                  <ArrowRight className="ml-auto h-3 w-3 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Prev / next */}
        <nav className="mt-10 grid gap-3 sm:grid-cols-2">
          {previous ? (
            <Link
              to={`${BACKEND_PRACTICE_PATH}/${previous.id}`}
              className="group rounded-xl border border-border/50 bg-card/60 p-4 transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowLeft className="h-3 w-3" />
                Previous
              </span>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                {previous.title}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={`${BACKEND_PRACTICE_PATH}/${next.id}`}
              className="group rounded-xl border border-border/50 bg-card/60 p-4 text-right transition-colors hover:border-primary/40"
            >
              <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Next
                <ArrowRight className="h-3 w-3" />
              </span>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                {next.title}
              </p>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
