import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldX,
  Shuffle,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  buildMcqQuiz,
  getMcqCount,
  MCQ_QUESTIONS,
  type McqQuestion,
} from "@/lib/mcqQuizBank";
import {
  QUIZ_LANGUAGE_LABELLED,
  type QuizDifficulty,
  type QuizLanguage,
} from "@/lib/quizBank";
import {
  Field,
  PageHeader,
  PageShell,
  Pill,
  Section,
  StatCard,
  Surface,
} from "@/components/layout/PagePrimitives";
import { cn } from "@/lib/utils";
import { MAX_EXAM_WARNINGS as MAX_WARNINGS } from "@/lib/examConstants";
import { formatExamTime } from "@/lib/formatTime";

type Language = QuizLanguage | "mixed";
type Difficulty = QuizDifficulty | "mixed";
type Phase = "setup" | "running" | "results";
interface Session {
  questions: McqQuestion[];
  startedAt: number;
  deadline: number | null;
}

const languages: { value: Language; label: string }[] = [
  { value: "mixed", label: "All languages" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
];
const difficulties: { value: Difficulty; label: string }[] = [
  { value: "mixed", label: "Mixed difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];
/* The languages a learner can actually pick, counted for the hero. Derived
   from the options above so adding one cannot silently leave the stat wrong. */
const QUIZ_LANGUAGES = languages.filter((item) => item.value !== "mixed");
/* The quiz is delivered full-width; bands span the shell rather than the
   standard reading column. */
/* 1rem on small screens avoids iOS Safari's focus-zoom, which fires on any
   form control under 16px. */
const fieldClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

const EXAM_RULES = [
  {
    icon: Maximize2,
    title: "Mandatory Fullscreen",
    desc: "The exam runs in fullscreen mode. Exiting fullscreen triggers a warning.",
  },
  {
    icon: ShieldAlert,
    title: "No Tab Switching",
    desc: "Switching tabs, minimizing, or losing focus triggers a warning. Stay on the exam.",
  },
  {
    icon: AlertTriangle,
    title: "3 Warnings Before Termination",
    desc: "You get 3 chances to return. On the 4th violation, your exam is auto-submitted.",
  },
  {
    icon: Clock3,
    title: "Timer Never Pauses",
    desc: "The countdown keeps running during warnings. Time lost is time gone.",
  },
];

export function formatQuizTime(seconds: number) {
  return formatExamTime(seconds);
}

export default function Quiz() {
  const [params] = useSearchParams();
  const [language, setLanguage] = useState<Language>(
    () =>
      languages.find((item) => item.value === params.get("language"))?.value ??
      "mixed",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () =>
      difficulties.find((item) => item.value === params.get("difficulty"))
        ?.value ?? "mixed",
  );
  const [size, setSize] = useState(10);
  const [mode, setMode] = useState<"practice" | "timed">("timed");
  const [minutes, setMinutes] = useState(10);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const interruptionRef = useRef<string | null>(null);
  const [examWarning, setExamWarning] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [finishedAt, setFinishedAt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [confirmation, setConfirmation] = useState<"submit" | "leave" | null>(
    null,
  );

  const questionRef = useRef<HTMLHeadingElement>(null);
  const available = getMcqCount(language, difficulty);
  const count = Math.min(size, available);
  const questions = session?.questions ?? [];
  const question = questions[index];
  const answered = Object.keys(answers).length;
  const remaining = session?.deadline
    ? Math.max(0, Math.ceil((session.deadline - now) / 1000))
    : 0;
  const elapsed = session
    ? Math.max(
        0,
        Math.floor(
          ((phase === "results" ? finishedAt : now) - session.startedAt) / 1000,
        ),
      )
    : 0;
  const correct = questions.filter(
    (item) => answers[item.id] === item.correctIndex,
  ).length;

  useEffect(() => {
    const sync = () =>
      setFullscreen(document.fullscreenElement === document.documentElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    if (phase !== "running" || !session) return;
    const update = () => {
      const current = Date.now();
      setNow(current);
      if (session.deadline && current >= session.deadline) {
        setFinishedAt(session.deadline);
        setTimedOut(true);
        setConfirmation(null);
        setPhase("results");
      }
    };
    update();
    const interval = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("beforeunload", warn);
    };
  }, [phase, session]);

  useEffect(() => {
    if (phase !== "running") return;
    const interrupt = (reason: string) => {
      if (interruptionRef.current) return;
      interruptionRef.current = reason;
      setExamWarning(reason);
      setWarningCount((current) => {
        const next = current + 1;
        // Auto-submit on the 4th warning — exam terminated
        if (next >= MAX_WARNINGS) {
          setTimeout(() => {
            finish();
          }, 0);
        }
        return next;
      });
      setConfirmation(null);
    };
    const checkFullscreen = () => {
      if (document.fullscreenElement !== document.documentElement)
        interrupt("You left fullscreen.");
    };
    const checkVisibility = () => {
      if (document.hidden)
        interrupt("You switched tabs or minimized the exam.");
    };
    const checkFocus = () => interrupt("The exam window lost focus.");
    checkFullscreen();
    checkVisibility();
    document.addEventListener("fullscreenchange", checkFullscreen);
    document.addEventListener("visibilitychange", checkVisibility);
    window.addEventListener("blur", checkFocus);
    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
      document.removeEventListener("visibilitychange", checkVisibility);
      window.removeEventListener("blur", checkFocus);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "running" && !examWarning) questionRef.current?.focus();
  }, [index, phase, examWarning]);

  async function enterFullscreen(): Promise<boolean> {
    setFullscreenMessage("");
    if (document.fullscreenElement === document.documentElement) return true;
    if (!document.documentElement.requestFullscreen) {
      setFullscreenMessage(
        "Fullscreen is mandatory for this exam. Use a browser that supports fullscreen to start.",
      );
      return false;
    }
    try {
      await document.documentElement.requestFullscreen();
      if (document.fullscreenElement === document.documentElement) return true;
    } catch {
      // A denied fullscreen request must never start or unlock the exam.
    }
    setFullscreenMessage(
      "Fullscreen permission is required. Allow fullscreen and try again to continue the exam.",
    );
    return false;
  }

  async function resumeExam() {
    if (!(await enterFullscreen()) || document.hidden) return;
    if (session?.deadline && Date.now() >= session.deadline) {
      finish();
      return;
    }
    interruptionRef.current = null;
    setExamWarning(null);
  }
  async function exitFullscreen() {
    if (
      document.fullscreenElement === document.documentElement &&
      document.exitFullscreen
    ) {
      try {
        await document.exitFullscreen();
      } catch {
        setFullscreenMessage("Use Escape to exit fullscreen.");
      }
    }
  }
  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    const permitted = await enterFullscreen();
    startingRef.current = false;
    setStarting(false);
    if (!permitted || document.hidden) return;
    const selected = buildMcqQuiz(language, difficulty, count);
    if (!selected.length) return;
    interruptionRef.current = null;
    setExamWarning(null);
    setWarningCount(0);
    const startedAt = Date.now();
    setSession({
      questions: selected,
      startedAt,
      deadline: mode === "timed" ? startedAt + minutes * 60_000 : null,
    });
    setAnswers({});
    setFlagged(new Set());
    setIndex(0);
    setNow(startedAt);
    setTimedOut(false);
    setConfirmation(null);
    setPhase("running");
  }
  function finish() {
    if (!session) return;
    const current = Date.now();
    const expired = session.deadline !== null && current >= session.deadline;
    setFinishedAt(expired ? session.deadline! : current);
    setTimedOut(expired);
    setConfirmation(null);
    setPhase("results");
  }
  function selectAnswer(option: number) {
    if (
      interruptionRef.current ||
      document.hidden ||
      document.fullscreenElement !== document.documentElement
    )
      return;
    if (session?.deadline && Date.now() >= session.deadline) {
      finish();
      return;
    }
    setAnswers((current) => ({ ...current, [question.id]: option }));
  }
  function reset() {
    setConfirmation(null);
    interruptionRef.current = null;
    setExamWarning(null);
    setPhase("setup");
    void exitFullscreen();
  }

  /* ── warning severity helpers ── */
  const warningsRemaining = MAX_WARNINGS - warningCount;
  const warningTerminated = warningCount >= MAX_WARNINGS;

  function getWarningIcon() {
    if (warningCount >= 3) return ShieldX;
    if (warningCount >= 2) return ShieldAlert;
    return Shield;
  }

  function getWarningColor() {
    if (warningCount >= 3) return "text-red-500";
    if (warningCount >= 2) return "text-orange-500";
    return "text-amber-500";
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <PageShell
          width="wide"
          className="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          {phase === "running" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmation("leave")}
            >
              <ArrowLeft aria-hidden="true" />
              Leave quiz
            </Button>
          ) : (
            <Link
              to="/contest"
              onClick={() => void exitFullscreen()}
              className="ui-btn ui-btn--reset ui-btn--sm"
            >
              <ArrowLeft aria-hidden="true" />
              Back to Contest
            </Link>
          )}
          <span className="flex items-center gap-2">
            <Shuffle size={16} className="text-primary" aria-hidden="true" />
            <span className="ui-meta">Contest · MCQ quiz</span>
          </span>
          <div className="flex items-center gap-2">
            {phase === "running" && warningCount > 0 && (
              <Pill tone={warningTerminated ? "danger" : "warning"} mono>
                <AlertTriangle size={12} aria-hidden="true" />
                {warningCount}/{MAX_WARNINGS}
              </Pill>
            )}
            {phase === "running" ? (
              <Pill tone="primary" variant="chip">
                <Maximize2 size={12} aria-hidden="true" />
                Fullscreen required
              </Pill>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void (fullscreen ? exitFullscreen() : enterFullscreen())
                }
              >
                {fullscreen ? (
                  <Minimize2 aria-hidden="true" />
                ) : (
                  <Maximize2 aria-hidden="true" />
                )}
                {fullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
            )}
          </div>
        </PageShell>
      </header>

      <main className="ui-app-canvas">
        {fullscreenMessage && (
          <PageShell width="wide" className="pt-4">
            <p role="status" className="ui-meta">
              {fullscreenMessage}
            </p>
          </PageShell>
        )}

        {/* ═══════════ SETUP PHASE ═══════════ */}
        {phase === "setup" && (
          <PageShell width="wide">
            <PageHeader
              variant="display"
              kicker="Contest"
              title={
                <>
                  Small questions.
                  <br />
                  <span className="text-primary">Big confidence.</span>
                </>
              }
              description="Test what you know with random multiple-choice questions in a strict, distraction-free exam environment. Practice at your pace, or race the clock under real exam conditions."
              meta={
                <Pill tone="primary" variant="chip">
                  <Sparkles size={12} aria-hidden="true" />
                  Exam-grade MCQ challenge
                </Pill>
              }
            />

            <Section spacing="compact">
              <div className="ui-grid ui-grid--3">
                <StatCard
                  label="Question bank"
                  value={MCQ_QUESTIONS.length}
                  hint="Curated MCQs"
                  icon={<BookOpen size={14} aria-hidden="true" />}
                />
                <StatCard
                  label="Languages"
                  value={QUIZ_LANGUAGES.length}
                  hint="Java, C++, Python"
                  icon={<Shuffle size={14} aria-hidden="true" />}
                />
                <StatCard
                  label="Scoring"
                  value="1 pt"
                  hint="Per correct answer"
                  icon={<Trophy size={14} aria-hidden="true" />}
                />
              </div>
            </Section>

            <Section
              band
              kicker="Before you start"
              title="Strict exam rules"
              description="Read carefully before starting. Violations lead to auto-submission."
              spacing="compact"
            >
              <div className="rounded-[var(--radius-surface)] border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.06)] px-4 py-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Shield
                    size={15}
                    className="text-[hsl(var(--warning))]"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    Mandatory fullscreen exam.{" "}
                  </span>
                  <span className="text-muted-foreground">
                    Starting this quiz enters fullscreen. Exiting, switching
                    tabs or minimizing triggers a warning. After{" "}
                    <strong className="font-semibold text-foreground">
                      {MAX_WARNINGS} violations
                    </strong>
                    , your exam is submitted automatically with whatever answers
                    you have.
                  </span>
                </p>
              </div>

              <div className="mt-4 ui-grid ui-grid--2 gap-4">
                {EXAM_RULES.map((rule) => (
                  <Surface
                    as="article"
                    key={rule.title}
                    className="flex items-start gap-4 p-5"
                  >
                    <span className="ui-stat__icon">
                      <rule.icon size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="ui-h3">{rule.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {rule.desc}
                      </p>
                    </div>
                  </Surface>
                ))}
              </div>

              <Surface className="mt-4 p-5">
                <p className="ui-meta">Warning escalation</p>
                <ol className="mt-4 flex items-center gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <li
                      key={step}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full border font-mono text-sm font-semibold tabular-nums",
                          step <= MAX_WARNINGS
                            ? "border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]"
                            : "border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.1)] text-destructive",
                        )}
                      >
                        {step <= MAX_WARNINGS ? step : "✕"}
                      </span>
                      <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground">
                        {step <= MAX_WARNINGS
                          ? `Warning ${step}`
                          : "Auto-submit"}
                      </span>
                    </li>
                  ))}
                </ol>
              </Surface>
            </Section>

            <Section
              band
              kicker="Configuration"
              title="Build your challenge"
              description="Choose your focus. We'll shuffle the questions and choices."
              spacing="compact"
            >
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
                <Surface className="p-5 md:p-6">
                  <div className="ui-grid ui-grid--2 gap-5">
                    <Field label="Language" htmlFor="quiz-language">
                      <select
                        id="quiz-language"
                        className={fieldClass}
                        value={language}
                        onChange={(event) =>
                          setLanguage(event.target.value as Language)
                        }
                      >
                        {languages.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Difficulty" htmlFor="quiz-difficulty">
                      <select
                        id="quiz-difficulty"
                        className={fieldClass}
                        value={difficulty}
                        onChange={(event) =>
                          setDifficulty(event.target.value as Difficulty)
                        }
                      >
                        {difficulties.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Questions" htmlFor="quiz-size">
                      <select
                        id="quiz-size"
                        className={fieldClass}
                        value={size}
                        onChange={(event) =>
                          setSize(Number(event.target.value))
                        }
                      >
                        {[5, 10, 15, 20].map((value) => (
                          <option key={value} value={value}>
                            {value} questions
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Time limit" htmlFor="quiz-minutes">
                      <select
                        id="quiz-minutes"
                        className={fieldClass}
                        disabled={mode === "practice"}
                        value={minutes}
                        onChange={(event) =>
                          setMinutes(Number(event.target.value))
                        }
                      >
                        {[1, 5, 10, 15, 20, 30].map((value) => (
                          <option key={value} value={value}>
                            {value} {value === 1 ? "minute" : "minutes"}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <fieldset className="mt-7">
                    <legend className="ui-field__label mb-3">Quiz mode</legend>
                    <div className="ui-grid ui-grid--2 gap-3">
                      {(["practice", "timed"] as const).map((value) => (
                        <label
                          key={value}
                          className={cn(
                            "ui-surface ui-surface--interactive flex cursor-pointer items-start gap-3 p-4 focus-within:ring-2 focus-within:ring-primary",
                            mode === value && "border-primary",
                          )}
                        >
                          <input
                            type="radio"
                            name="mode"
                            value={value}
                            checked={mode === value}
                            onChange={() => setMode(value)}
                            className="mt-1 accent-primary"
                          />
                          <span>
                            <span className="block font-semibold">
                              {value === "practice"
                                ? "Practice"
                                : "Timed challenge"}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {value === "practice"
                                ? "No deadline. Take time to think."
                                : "Live countdown. Auto-submit at zero."}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </Surface>

                {/* ── Start Aside ── */}
                <aside className="ui-surface--inverse flex flex-col p-5 md:p-6 lg:sticky lg:top-24">
                  <p className="ui-meta text-[hsl(var(--inverse-quiet))]">
                    Your next session
                  </p>
                  <h2 className="mt-3 font-display text-xl font-semibold tracking-tight">
                    Ready, set, challenge yourself.
                  </h2>
                  <dl className="mt-5 grid gap-3 text-sm">
                    {[
                      [
                        "Focus",
                        languages.find((item) => item.value === language)
                          ?.label,
                      ],
                      ["Questions", `${count} random MCQs`],
                      [
                        "Time",
                        mode === "timed"
                          ? `${minutes} minutes`
                          : "At your own pace",
                      ],
                      ["Scoring", "1 point each · no negative marking"],
                      ["Warnings", `${MAX_WARNINGS} max before auto-submit`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 border-b border-[hsl(var(--inverse-border))] pb-3"
                      >
                        <dt className="text-[hsl(var(--inverse-quiet))]">
                          {label}
                        </dt>
                        <dd className="text-right font-medium tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {size > available && (
                    <p
                      role="status"
                      className="mt-4 border-l-2 border-[hsl(var(--inverse-quiet))] pl-3 text-xs leading-5 text-[hsl(var(--inverse-quiet))]"
                    >
                      This selection has {available} questions. Your quiz will
                      include all {count}, without repeats or changing
                      difficulty.
                    </p>
                  )}
                  <Button
                    variant="inverse"
                    className="mt-6 w-full"
                    onClick={() => void start()}
                    disabled={!count || starting}
                  >
                    {starting ? "Opening fullscreen…" : "Start quiz"}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                  <p className="mt-3 text-center text-[11px] leading-5 text-[hsl(var(--inverse-quiet))]">
                    Fullscreen is required. Answers appear after submission.
                  </p>
                </aside>
              </div>
            </Section>
          </PageShell>
        )}

        {/* ═══════════ RUNNING PHASE ═══════════ */}
        {phase === "running" && session && question && !examWarning && (
          <PageShell width="wide" className="py-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="ui-meta">
                  {session.deadline ? "Timed challenge" : "Practice session"}
                </p>
                <h1 className="ui-h3 mt-1.5">
                  One question. One step forward.
                </h1>
              </div>
              <div className="flex items-center gap-2.5">
                {warningCount > 0 && (
                  <div className="ui-surface flex items-center gap-2.5 px-3 py-2">
                    {(() => {
                      const Icon = getWarningIcon();
                      return (
                        <Icon
                          size={16}
                          className={getWarningColor()}
                          aria-hidden="true"
                        />
                      );
                    })()}
                    <div>
                      <p className="ui-meta">Warnings</p>
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          getWarningColor(),
                        )}
                      >
                        {warningCount}/{MAX_WARNINGS}
                      </p>
                    </div>
                  </div>
                )}
                <div
                  role="timer"
                  aria-label={
                    session.deadline ? "Time remaining" : "Time elapsed"
                  }
                  className={cn(
                    "ui-surface flex items-center gap-3 px-4 py-2",
                    session.deadline &&
                      remaining <= 60 &&
                      "border-destructive/50",
                  )}
                >
                  <Clock3
                    size={16}
                    aria-hidden="true"
                    className={cn(
                      session.deadline && remaining <= 60
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="ui-meta">
                      {session.deadline ? "Time remaining" : "Time elapsed"}
                    </p>
                    <p
                      className={cn(
                        "font-mono text-lg font-semibold leading-tight tabular-nums",
                        session.deadline &&
                          remaining <= 60 &&
                          "text-destructive",
                      )}
                    >
                      {formatQuizTime(session.deadline ? remaining : elapsed)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,24rem)]">
              <Surface as="section" className="p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="ui-meta">
                    Question {index + 1} of {questions.length}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <Pill variant="chip">
                      {QUIZ_LANGUAGE_LABELLED[question.language].label}
                    </Pill>
                    <Pill variant="chip">{question.difficulty}</Pill>
                    <Pill variant="chip">{question.topic}</Pill>
                  </span>
                </div>
                <h2
                  ref={questionRef}
                  tabIndex={-1}
                  className="max-w-[68ch] whitespace-pre-wrap font-display text-xl font-semibold leading-relaxed tracking-tight outline-none sm:text-2xl"
                >
                  {question.question}
                </h2>
                <fieldset className="mt-7 grid max-w-[68ch] gap-2.5">
                  <legend className="sr-only">Choose one answer</legend>
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={optionIndex}
                        className={cn(
                          "ui-surface ui-surface--interactive flex cursor-pointer items-start gap-4 p-4 focus-within:ring-2 focus-within:ring-primary sm:p-5",
                          selected &&
                            "border-primary bg-[hsl(var(--primary-soft)/var(--primary-soft-alpha))]",
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={selected}
                          onChange={() => selectAnswer(optionIndex)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-0.5 text-sm leading-6 sm:text-base">
                          <span className="sr-only">
                            {String.fromCharCode(65 + optionIndex)}.{" "}
                          </span>
                          {option}
                        </span>
                        {selected && (
                          <Check
                            size={16}
                            aria-hidden="true"
                            className="mt-1 shrink-0 text-primary"
                          />
                        )}
                      </label>
                    );
                  })}
                </fieldset>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFlagged((current) => {
                        const next = new Set(current);
                        if (next.has(question.id)) next.delete(question.id);
                        else next.add(question.id);
                        return next;
                      })
                    }
                    aria-pressed={flagged.has(question.id)}
                  >
                    <Flag aria-hidden="true" />
                    {flagged.has(question.id)
                      ? "Flagged for review"
                      : "Flag for review"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={answers[question.id] === undefined}
                    onClick={() =>
                      setAnswers((current) => {
                        const next = { ...current };
                        delete next[question.id];
                        return next;
                      })
                    }
                  >
                    Clear answer
                  </Button>
                </div>
                <div className="mt-5 flex justify-between gap-3">
                  <Button
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => setIndex(index - 1)}
                  >
                    <ArrowLeft aria-hidden="true" />
                    Previous
                  </Button>
                  {index < questions.length - 1 ? (
                    <Button onClick={() => setIndex(index + 1)}>
                      Next question
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button onClick={() => setConfirmation("submit")}>
                      Review &amp; submit
                    </Button>
                  )}
                </div>
              </Surface>

              <Surface as="aside" className="p-5">
                <h2 className="ui-meta">Your progress</h2>
                <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                  {answered} of {questions.length} answered
                </p>
                <div
                  role="progressbar"
                  aria-label="Answers completed"
                  aria-valuenow={answered}
                  aria-valuemin={0}
                  aria-valuemax={questions.length}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(answered / questions.length) * 100}%` }}
                  />
                </div>
                <nav
                  aria-label="Question navigation"
                  className="mt-5 grid grid-cols-5 gap-2"
                >
                  {questions.map((item, position) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Question ${position + 1}${answers[item.id] !== undefined ? ", answered" : ", unanswered"}${flagged.has(item.id) ? ", flagged" : ""}`}
                      aria-current={index === position ? "step" : undefined}
                      onClick={() => setIndex(position)}
                      className={cn(
                        "relative flex h-10 items-center justify-center rounded-lg border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        answers[item.id] !== undefined
                          ? "border-primary/30 bg-[hsl(var(--primary-soft)/var(--primary-soft-alpha))] text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                        index === position &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                    >
                      {position + 1}
                      {flagged.has(item.id) && (
                        <Flag
                          size={9}
                          aria-hidden="true"
                          className="absolute right-0.5 top-0.5 text-[hsl(var(--warning))]"
                        />
                      )}
                    </button>
                  ))}
                </nav>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Filled = answered · Flag = review later
                  <br />
                  You can revisit and change any answer.
                </p>

                {warningCount > 0 && (
                  <p
                    className={cn(
                      "mt-5 border-l-2 pl-3 text-xs leading-5",
                      warningTerminated
                        ? "border-destructive"
                        : "border-[hsl(var(--warning))]",
                    )}
                  >
                    <span className="font-semibold text-foreground">
                      {warningCount} of {MAX_WARNINGS} warnings used.
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {warningsRemaining <= 1
                        ? "Next violation will auto-submit your exam!"
                        : `${warningsRemaining} violations remaining before auto-submit.`}
                    </span>
                  </p>
                )}

                <Button
                  className="mt-6 w-full"
                  variant="outline"
                  onClick={() => setConfirmation("submit")}
                >
                  Submit quiz
                </Button>
              </Surface>
            </div>
          </PageShell>
        )}

        {/* ═══════════ RESULTS PHASE ═══════════ */}
        {phase === "results" && session && (
          <PageShell width="wide" className="py-8">
            <PageHeader
              variant="display"
              kicker="Challenge complete"
              title={
                warningTerminated
                  ? "Exam terminated."
                  : correct === questions.length
                    ? "A perfect finish!"
                    : "Every attempt makes you better."
              }
              description={
                warningTerminated
                  ? `Your exam was auto-submitted after ${MAX_WARNINGS} focus violations. Answers given before termination have been recorded.`
                  : timedOut
                    ? "Time’s up! Your answers were submitted automatically."
                    : "Your quiz is submitted. Let’s see how you did."
              }
              meta={
                <>
                  <Pill
                    tone={
                      warningTerminated
                        ? "danger"
                        : correct === questions.length
                          ? "success"
                          : "primary"
                    }
                    variant="chip"
                  >
                    <Trophy size={12} aria-hidden="true" />
                    {Math.round((correct / questions.length) * 100)}% score
                  </Pill>
                  {warningCount > 0 && (
                    <Pill
                      tone={warningTerminated ? "danger" : "warning"}
                      variant="chip"
                    >
                      <AlertTriangle size={12} aria-hidden="true" />
                      {warningTerminated
                        ? `Terminated after ${warningCount} violations`
                        : `${warningCount} focus warning${warningCount > 1 ? "s" : ""}`}
                    </Pill>
                  )}
                </>
              }
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void start()} disabled={starting}>
                    <RotateCcw aria-hidden="true" />
                    Try another quiz
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Change settings
                  </Button>
                </div>
              }
            />

            <Section spacing="compact">
              <div role="status" className="sr-only">
                {warningTerminated
                  ? `Your exam was auto-submitted after ${MAX_WARNINGS} focus violations. Answers given before termination have been recorded.`
                  : timedOut
                    ? "Time’s up! Your answers were submitted automatically."
                    : "Your quiz is submitted. Let’s see how you did."}
              </div>
              <div className="ui-grid ui-grid--2 gap-4">
                <StatCard
                  label="Score"
                  value={`${Math.round((correct / questions.length) * 100)}%`}
                  hint="Of all questions"
                  icon={<Trophy size={14} aria-hidden="true" />}
                />
                <StatCard
                  label="Correct"
                  value={`${correct} / ${questions.length}`}
                  hint="One point each"
                  icon={<CheckCircle2 size={14} aria-hidden="true" />}
                />
                <StatCard
                  label="Unanswered"
                  value={questions.length - answered}
                  hint="No points, no penalty"
                  icon={<XCircle size={14} aria-hidden="true" />}
                />
                <StatCard
                  label="Time taken"
                  value={formatQuizTime(elapsed)}
                  hint={timedOut ? "Auto-submitted" : "Recorded"}
                  icon={<Clock3 size={14} aria-hidden="true" />}
                />
              </div>

              {warningCount > 0 && (
                <div className="mt-4 border-l-2 border-[hsl(var(--warning))] pl-4">
                  <p className="text-sm font-semibold">
                    Exam integrity: {warningCount} warning
                    {warningCount > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    <span className="sr-only">
                      Exam focus warnings: {warningCount}
                    </span>
                    {warningTerminated
                      ? "This exam was terminated due to exceeding the maximum allowed focus violations. In a real exam, this would disqualify the attempt."
                      : "Focus violations were recorded during this attempt. In a real exam, these would be flagged for review."}
                  </p>
                </div>
              )}
            </Section>

            <Section
              band
              kicker="Review"
              title="Answer review"
              description="Understand the why, not just the score."
              spacing="compact"
            >
              <div className="grid items-start gap-4 xl:grid-cols-2">
                {questions.map((item, position) => {
                  const selected = answers[item.id];
                  const isCorrect = selected === item.correctIndex;
                  return (
                    <Surface as="article" key={item.id} className="p-5">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2
                            size={18}
                            aria-hidden="true"
                            className="mt-1 shrink-0 text-[hsl(var(--success))]"
                          />
                        ) : (
                          <XCircle
                            size={18}
                            aria-hidden="true"
                            className="mt-1 shrink-0 text-destructive"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="ui-meta mb-2">
                            Question {position + 1} ·{" "}
                            {isCorrect
                              ? "Correct"
                              : selected === undefined
                                ? "Unanswered"
                                : "Incorrect"}
                            {flagged.has(item.id) ? " · Flagged" : ""}
                          </p>
                          <h3 className="whitespace-pre-wrap font-display text-base font-semibold leading-7">
                            {item.question}
                          </h3>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                            <span className="text-muted-foreground">
                              Your answer:{" "}
                            </span>
                            {selected === undefined
                              ? "Not answered"
                              : item.options[selected]}
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
                            <span className="font-semibold text-[hsl(var(--success))]">
                              Correct answer:{" "}
                            </span>
                            {item.options[item.correctIndex]}
                          </p>
                          <p className="mt-3 border-t border-border pt-3 text-sm leading-7 text-muted-foreground">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    </Surface>
                  );
                })}
              </div>
            </Section>
          </PageShell>
        )}

        {/* ═══════════ EXAM WARNING DIALOG (escalating) ═══════════ */}
        <AlertDialog open={phase === "running" && examWarning !== null}>
          <AlertDialogContent
            onEscapeKeyDown={(event) => event.preventDefault()}
            className="border-red-500/30"
          >
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-surface bg-red-500/15">
                {(() => {
                  const Icon = getWarningIcon();
                  return <Icon size={32} className="text-red-500" />;
                })()}
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Exam fullscreen warning
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {examWarning} Fullscreen and exam focus are mandatory. Your
                questions are locked until you return.{" "}
                {session?.deadline
                  ? "The countdown is still running."
                  : "Your elapsed time is still being recorded."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Warning severity meter */}
            <div className="my-4 rounded-[var(--radius-surface)] border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.06)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-red-500">
                  Warning {warningCount} of {MAX_WARNINGS}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {warningCount >= MAX_WARNINGS
                    ? "EXAM TERMINATED"
                    : `${warningsRemaining} remaining`}
                </span>
              </div>
              {/* Progress bar for warnings */}
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_WARNINGS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      i < warningCount ? "bg-red-500" : "bg-red-500/20",
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {warningCount >= MAX_WARNINGS
                  ? "Maximum violations exceeded. Your answers have been submitted."
                  : warningCount === MAX_WARNINGS - 1
                    ? "⚠ FINAL WARNING — One more violation will auto-submit your exam immediately."
                    : "Fullscreen and focus are mandatory. Your questions are locked until you return."}
              </p>
            </div>

            <p className="text-center text-sm font-medium">
              Warning {warningCount} ·{" "}
              {session?.deadline ? "Time remaining" : "Time elapsed"}:{" "}
              <span className="font-mono text-red-500">
                {formatQuizTime(session?.deadline ? remaining : elapsed)}
              </span>
            </p>

            {fullscreenMessage && (
              <p role="status" className="text-center text-sm text-destructive">
                {fullscreenMessage}
              </p>
            )}
            <AlertDialogFooter className="mt-2">
              <Button variant="outline" onClick={finish}>
                Submit and end exam
              </Button>
              {warningCount < MAX_WARNINGS && (
                <Button onClick={() => void resumeExam()} variant="destructive">
                  <Maximize2 size={16} className="mr-2" />
                  Return to fullscreen
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ═══════════ SUBMIT / LEAVE CONFIRMATION ═══════════ */}
        <AlertDialog
          open={confirmation !== null && !examWarning}
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmation === "leave"
                  ? "Leave this quiz?"
                  : "Submit your answers?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmation === "leave"
                  ? "Your current attempt will be discarded. You can start a new challenge from the setup page."
                  : `${answered} of ${questions.length} questions answered. ${questions.length - answered} unanswered and ${flagged.size} flagged for review. Unanswered questions receive no points.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep solving</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmation === "leave" ? reset : finish}
              >
                {confirmation === "leave" ? "Leave quiz" : "Submit answers"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
