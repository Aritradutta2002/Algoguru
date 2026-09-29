/**
 * Fullscreen quiz player.
 *
 * One question at a time with a per-question countdown. The learner commits to
 * an answer by revealing the editorial, then self-marks it — the banks are
 * open-ended Q&A, so self-assessment is the honest scoring model. The run ends
 * on a results screen with a per-question review list.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Eye,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { CoreJavaQuestionAnswer } from "@/components/interview/CoreJavaQuestionAnswer";
import {
  buildQuizRun,
  getQuizDifficultyAccent,
  getQuizDifficultyCounts,
  getQuizLanguageAccent,
  QUIZ_DIFFICULTY_LABELLED,
  QUIZ_LANGUAGE_LABELLED,
  QUIZ_SECONDS_PER_QUESTION,
  type QuizDifficulty,
  type QuizLanguage,
  type QuizQuestion,
  type QuizRun,
} from "@/lib/quizBank";

export interface QuizPlayerProps {
  open: boolean;
  language: QuizLanguage;
  difficulty: QuizDifficulty;
  onClose: () => void;
}

type QuizStatus = "answering" | "revealed" | "finished";

interface QuizAnswer {
  question: QuizQuestion;
  correct: boolean;
  timedOut: boolean;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function QuizPlayer({ open, language, difficulty, onClose }: QuizPlayerProps) {
  const navigate = useNavigate();

  const [run, setRun] = useState<QuizRun>(() => buildQuizRun(language, difficulty));
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<QuizStatus>("answering");
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS_PER_QUESTION);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const runId = useMemo(
    () => `${language}:${difficulty}:${run.questions.map((q) => q.id).join(",")}`,
    [language, difficulty, run.questions],
  );
  const commitRef = useRef<((correct: boolean, timedOut?: boolean) => void) | null>(null);
  const advanceRef = useRef<number | null>(null);

  const accent = getQuizLanguageAccent(language);
  const levelAccent = getQuizDifficultyAccent(difficulty);
  const correctCount = answers.filter((answer) => answer?.correct).length;
  const total = run.questions.length;
  const question = run.questions[index];
  const urgent = secondsLeft <= 10;

  const cancelAdvance = useCallback(() => {
    if (advanceRef.current !== null) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  }, []);

  /** Records the verdict for the current question, then advances. */
  const commit = useCallback(
    (correct: boolean, timedOut = false) => {
      // Re-answering a question overwrites its previous verdict rather than
      // appending, so going back never double-counts the score.
      setAnswers((previous) => {
        const next = [...previous];
        next[index] = { question: run.questions[index], correct, timedOut };
        return next;
      });
      setStatus("revealed");
      cancelAdvance();
      advanceRef.current = window.setTimeout(() => {
        advanceRef.current = null;
        if (index + 1 >= total) {
          setStatus("finished");
        } else {
          setIndex((current) => current + 1);
          setSecondsLeft(QUIZ_SECONDS_PER_QUESTION);
          setStatus("answering");
        }
      }, 420);
    },
    [cancelAdvance, index, run.questions, total],
  );

  /** Manual jump between questions — cancels any pending auto-advance. */
  const goTo = useCallback(
    (nextIndex: number) => {
      cancelAdvance();
      setIndex(nextIndex);
      setSecondsLeft(QUIZ_SECONDS_PER_QUESTION);
      setStatus("answering");
    },
    [cancelAdvance],
  );

  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  /** Draws a brand new random set for the same language and difficulty. */
  const startRun = useCallback(() => {
    cancelAdvance();
    setRun(buildQuizRun(language, difficulty));
    setIndex(0);
    setAnswers([]);
    setElapsed(0);
    setSecondsLeft(QUIZ_SECONDS_PER_QUESTION);
    setStatus("answering");
  }, [cancelAdvance, difficulty, language]);

  // Per-question countdown.
  useEffect(() => {
    if (!open || status !== "answering") return;
    const tick = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [open, status, index, runId]);

  // Running out of time auto-marks the question as missed so the learner still
  // gets the editorial they were missing.
  useEffect(() => {
    if (!open || status !== "answering" || secondsLeft > 0) return;
    commitRef.current?.(false, true);
  }, [open, status, secondsLeft]);

  // Wall-clock stopwatch for the results screen.
  useEffect(() => {
    if (!open || status === "finished") return;
    const startedAt = Date.now() - elapsed * 1000;
    const tick = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [open, status]);

  // Esc closes, arrows move between questions once the answer is revealed.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setAnswers([]);
      setElapsed(0);
      setSecondsLeft(QUIZ_SECONDS_PER_QUESTION);
      setStatus("answering");
    }
  }, [open]);

  if (!question && status !== "finished") return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Quiz"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            aria-hidden="true"
          />

          <QuizHeader
            accent={accent}
            levelAccent={levelAccent}
            language={language}
            difficulty={difficulty}
            index={index}
            total={total}
            correctCount={correctCount}
            secondsLeft={secondsLeft}
            urgent={urgent}
            onClose={onClose}
          />

          {/* Progress rail */}
          <div className="relative mx-auto flex w-full max-w-4xl items-center gap-1.5 px-5 pt-5 md:px-8">
            {run.questions.map((item, i) => {
              const answer = answers[i];
              const state = answer
                ? answer.correct
                  ? "correct"
                  : "missed"
                : i === index
                  ? "current"
                  : "todo";
              return (
                <span
                  key={item.id}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    background:
                      state === "correct"
                        ? "hsl(var(--success))"
                        : state === "missed"
                          ? "hsl(var(--destructive))"
                          : state === "current"
                            ? accent
                            : "hsl(var(--border))",
                  }}
                />
              );
            })}
          </div>

          {/* Body */}
          <div className="relative flex-1 overflow-y-auto px-5 py-8 md:px-8">
            {status === "finished" ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <QuizResults
                  answers={answers}
                  elapsed={elapsed}
                  language={language}
                  difficulty={difficulty}
                  onRetry={startRun}
                  onChange={() => onClose()}
                  onOpenQuestion={(detailPath) => {
                    onClose();
                    navigate(detailPath);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-4xl"
              >
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-7 shadow-overlay backdrop-blur-xl md:p-10">
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${levelAccent}, transparent)`,
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        background: `${levelAccent}14`,
                        borderColor: `${levelAccent}33`,
                        color: levelAccent,
                      }}
                    >
                      {QUIZ_DIFFICULTY_LABELLED[difficulty].label}
                    </span>
                    <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                      {question.topicIcon} {question.topic}
                    </span>
                    {question.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="mt-7 font-display text-[1.6rem] font-bold leading-[1.25] tracking-[-0.02em] md:text-[2rem]">
                    {question.question}
                  </h2>

                  {status === "answering" ? (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Lightbulb size={16} className="text-warning" />
                        Commit to an answer first
                      </div>
                      <p className="text-[14.5px] leading-7 text-muted-foreground">
                        Say it out loud the way you would in an interview, then reveal the
                        editorial to check yourself. Be honest — the score is only useful if you
                        are.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="reveal"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-9 space-y-8"
                    >
                      <div>
                        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                          Editorial answer
                        </p>
                        <CoreJavaQuestionAnswer answer={question.answer} />
                      </div>

                      {question.code && (
                        <CodeBlock
                          code={question.code}
                          language={question.codeLanguage ?? "java"}
                          title={question.topic}
                        />
                      )}

                      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                          Why it matters
                        </p>
                        <p className="text-[14.5px] leading-7 text-foreground/85">
                          {question.explanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Controls */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => goTo(Math.max(0, index - 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Previous question"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      disabled={index + 1 >= total}
                      onClick={() => goTo(Math.min(total - 1, index + 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Next question"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(question.detailPath)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <BookOpen size={15} />
                      Full topic
                    </button>

                    {status === "answering" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStatus("revealed");
                          setSecondsLeft(0);
                        }}
                        className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground shadow-accent transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-overlay hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Eye size={17} />
                        Reveal answer
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => commit(false)}
                          className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/[0.08] px-5 py-3.5 text-[15px] font-bold text-destructive transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X size={16} strokeWidth={3} />
                          I missed it
                        </button>
                        <button
                          type="button"
                          onClick={() => commit(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/[0.10] px-5 py-3.5 text-[15px] font-bold text-success transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-success hover:text-success-foreground"
                        >
                          <Check size={16} strokeWidth={3} />
                          Got it right
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Header ────────────────────────────────────────────────────────── */

interface QuizHeaderProps {
  accent: string;
  levelAccent: string;
  language: QuizLanguage;
  difficulty: QuizDifficulty;
  index: number;
  total: number;
  correctCount: number;
  secondsLeft: number;
  urgent: boolean;
  onClose: () => void;
}

function QuizHeader({
  accent,
  levelAccent,
  language,
  difficulty,
  index,
  total,
  correctCount,
  secondsLeft,
  urgent,
  onClose,
}: QuizHeaderProps) {
  const progress = ((index + 1) / total) * 100;
  const meterColor = urgent ? "hsl(var(--destructive))" : accent;
  const ring = 2 * Math.PI * 15;

  return (
    <header className="relative mx-auto flex w-full max-w-4xl items-center gap-4 px-5 pt-5 md:px-8 md:pt-7">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: `${accent}14`,
              borderColor: `${accent}33`,
              color: accent,
            }}
          >
            {QUIZ_LANGUAGE_LABELLED[language].label}
          </span>
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: `${levelAccent}14`,
              borderColor: `${levelAccent}33`,
              color: levelAccent,
            }}
          >
            {QUIZ_DIFFICULTY_LABELLED[difficulty].label}
          </span>
        </div>
        <p className="mt-1.5 font-display text-sm font-semibold text-foreground">
          Question {index + 1} of {total}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {correctCount > 0 && (
          <span className="hidden items-center gap-1.5 rounded-full border border-success/25 bg-success/[0.08] px-3 py-1.5 text-[12px] font-bold text-success sm:inline-flex">
            <Zap size={12} />
            {correctCount} correct
          </span>
        )}

        <div
          className="relative flex h-9 w-9 items-center justify-center"
          title={`${Math.round(progress)}% complete`}
        >
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={meterColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - (secondsLeft / QUIZ_SECONDS_PER_QUESTION))}
              className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
            />
          </svg>
          <span
            className={`font-mono text-[11px] font-bold tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}
          >
            {secondsLeft}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
        >
          <X size={17} />
        </button>
      </div>
    </header>
  );
}

/* ─── Results ───────────────────────────────────────────────────────── */

interface QuizResultsProps {
  answers: QuizAnswer[];
  elapsed: number;
  language: QuizLanguage;
  difficulty: QuizDifficulty;
  onRetry: () => void;
  onChange: () => void;
  onOpenQuestion: (detailPath: string) => void;
}

function getVerdict(score: number): { headline: string; blurb: string; tone: string } {
  if (score >= 0.9) {
    return {
      headline: "Interview ready",
      blurb: "You are answering at the level this bank screens for. Keep the streak honest.",
      tone: "hsl(var(--success))",
    };
  }
  if (score >= 0.7) {
    return {
      headline: "Solid, with gaps",
      blurb: "Most of this is in place. Work through the misses — they are the cheapest points to win.",
      tone: "hsl(var(--primary))",
    };
  }
  if (score >= 0.4) {
    return {
      headline: "Needs another pass",
      blurb: "The fundamentals are thin. Re-read the misses, then retake the same level.",
      tone: "hsl(var(--warning))",
    };
  }
  return {
    headline: "Start from the basics",
    blurb: "Go through the topic pages below first, then come back and retake this level.",
    tone: "hsl(var(--destructive))",
  };
}

function QuizResults({
  answers,
  elapsed,
  language,
  difficulty,
  onRetry,
  onChange,
  onOpenQuestion,
}: QuizResultsProps) {
  const accent = getQuizLanguageAccent(language);
  const total = answers.length;
  const correct = answers.filter((answer) => answer.correct).length;
  const missedAnswers = answers.filter((answer) => !answer.correct);
  const timedOut = answers.filter((answer) => answer.timedOut).length;
  const score = total === 0 ? 0 : correct / total;
  const verdict = getVerdict(score);

  const stats = [
    { label: "Score", value: `${Math.round(score * 100)}%`, icon: Target },
    { label: "Correct", value: `${correct}/${total}`, icon: Check },
    { label: "Missed", value: `${total - correct}`, icon: CircleAlert },
    { label: "Time", value: formatClock(elapsed), icon: Clock },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Score card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-overlay backdrop-blur-xl md:p-10">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${verdict.tone}, transparent)` }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: `${accent}1F` }} />

        <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={verdict.tone}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 52 * (1 - score),
                }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="text-center">
              <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
                {correct}
                <span className="text-muted-foreground">/{total}</span>
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Correct
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center md:text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
              style={{
                background: `${accent}14`,
                borderColor: `${accent}33`,
                color: accent,
              }}
            >
              <Trophy size={13} />
              {QUIZ_LANGUAGE_LABELLED[language].label} · {QUIZ_DIFFICULTY_LABELLED[difficulty].label}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl">
              {verdict.headline}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-muted-foreground md:mx-0">
              {verdict.blurb}
            </p>
            {timedOut > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-warning">
                <Clock size={13} />
                {timedOut} question{timedOut === 1 ? "" : "s"} ran out of time
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-9 grid gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-background/50 px-4 py-3.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <stat.icon size={12} />
                {stat.label}
              </div>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="group inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-bold shadow-accent transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-overlay hover:brightness-105"
            style={{ background: accent, color: "hsl(var(--background))" }}
          >
            <RotateCcw size={16} className="transition-transform duration-500 group-hover-rotate-180" />
            Retake this level
          </button>
          <button
            type="button"
            onClick={onChange}
            className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-6 py-3.5 text-[15px] font-semibold text-foreground shadow-card transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/40"
          >
            <RefreshCw size={16} className="text-primary" />
            Change language or level
          </button>
        </div>
      </div>

      {/* Review */}
      {missedAnswers.length > 0 ? (
        <div className="rounded-3xl border border-border bg-card/60 p-7 shadow-card md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">
                Review what you missed
              </h3>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                {missedAnswers.length} question{missedAnswers.length === 1 ? "" : "s"} to close out.
              </p>
            </div>
            <span className="rounded-full border border-destructive/25 bg-destructive/[0.08] px-3 py-1 text-[12px] font-bold text-destructive">
              {missedAnswers.length} to review
            </span>
          </div>

          <ul className="space-y-2.5">
            {missedAnswers.map((answer, i) => (
              <li key={answer.question.id}>
                <button
                  type="button"
                  onClick={() => onOpenQuestion(answer.question.detailPath)}
                  className="group flex w-full items-start gap-3.5 rounded-2xl border border-border bg-background/50 p-4 text-left transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/[0.08] text-[12px] font-bold text-destructive">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[14.5px] font-semibold leading-6">
                      {answer.question.question}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      <span>
                        {answer.question.topicIcon} {answer.question.topic}
                      </span>
                      {answer.timedOut && (
                        <span className="rounded-full bg-warning/12 px-2 py-0.5 font-semibold text-warning">
                          timed out
                        </span>
                      )}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="mt-1.5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-success/25 bg-success/[0.06] px-7 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
            <Trophy size={22} />
          </span>
          <p className="font-display text-lg font-bold tracking-tight">Flawless run</p>
          <p className="max-w-sm text-[14px] leading-6 text-muted-foreground">
            Every question correct. Push the difficulty up a notch to keep the edge.
          </p>
        </div>
      )}

      <p className="pb-4 text-center text-[12px] text-muted-foreground">
        Pool for this run: {getQuizDifficultyCounts(difficulty)[language]} {difficulty} questions in the{" "}
        {QUIZ_LANGUAGE_LABELLED[language].label} bank.
      </p>
    </div>
  );
}
