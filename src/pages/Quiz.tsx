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
/* One container for every band on the page. Gutters scale instead of
   capping the width, so the page fills a wide display rather than
   stranding a fixed 80rem column in the middle of it. */
const containerClass =
  "mx-auto w-full max-w-7xl px-5 sm:px-6";
/* 1rem on small screens avoids iOS Safari's focus-zoom, which fires on any
   form control under 16px. */
const fieldClass =
  "mt-2 w-full rounded-lg border border-obsidian-border bg-obsidian-elevated px-3 py-2.5 text-base sm:text-sm text-foreground focus:outline-none focus:border-primary";

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
    <div className="min-h-screen overflow-y-auto bg-obsidian-void text-foreground selection:bg-primary/20">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-20 border-b border-obsidian-border bg-obsidian-void/90 backdrop-blur">
        <div className={cn(containerClass, "flex flex-wrap items-center justify-between gap-3 py-4")}>
          {phase === "running" ? (
            <Button variant="ghost" onClick={() => setConfirmation("leave")}>
              <ArrowLeft size={16} className="mr-2" />
              Leave quiz
            </Button>
          ) : (
            <Link
              to="/contest"
              onClick={() => void exitFullscreen()}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to Contest
            </Link>
          )}
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Shuffle size={18} className="text-primary" />
            Contest · MCQ Quiz
          </span>
          <div className="flex items-center gap-3">
            {/* Warning badge visible during running phase */}
            {phase === "running" && warningCount > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold tabular-nums",
                  warningCount >= 3
                    ? "border-red-500/30 bg-red-500/10 text-red-500"
                    : warningCount >= 2
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-500"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-500",
                )}
              >
                <AlertTriangle size={13} />
                {warningCount}/{MAX_WARNINGS}
              </span>
            )}
            {phase === "running" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                <Maximize2 size={15} />
                Fullscreen required
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void (fullscreen ? exitFullscreen() : enterFullscreen())
                }
              >
                {fullscreen ? (
                  <Minimize2 size={16} className="mr-2" />
                ) : (
                  <Maximize2 size={16} className="mr-2" />
                )}
                {fullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
            )}
          </div>
        </div>
      </header>
      {fullscreenMessage && (
        <p
          role="status"
          className={cn(containerClass, "pt-4 text-sm text-muted-foreground")}
        >
          {fullscreenMessage}
        </p>
      )}

      {/* ─── MAIN ─── */}
      <main className={cn(containerClass, "py-8 sm:py-12")}>
        {/* ═══════════ SETUP PHASE ═══════════ */}
        {phase === "setup" && (
          <>
            {/* ── Hero Section ── */}
            <section
              className="relative mb-8 overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane"
              aria-labelledby="setup-hero-title"
            >
              <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:p-10">
                <div className="flex flex-col justify-center">
                  <p className="lp-kicker mb-3">
                    <Sparkles size={14} className="inline mr-1.5" aria-hidden="true" />
                    Exam-grade MCQ challenge
                  </p>
                  <h1
                    id="setup-hero-title"
                    className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl text-foreground"
                  >
                    Small questions.
                    <br />
                    Big confidence.
                  </h1>
                  <p className="mt-4 max-w-prose text-[15px] leading-7 text-muted-foreground">
                    Test what you know with random multiple-choice questions in a
                    strict, distraction-free exam environment. Practice at your
                    pace, or race the clock under real exam conditions.
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-px self-center overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-border">
                  {[
                    ["Question bank", `${MCQ_QUESTIONS.length}`, "curated MCQs"],
                    ["Languages", `${QUIZ_LANGUAGES.length}`, "Java, C++, Python"],
                    ["Scoring", "1 pt", "per correct answer"],
                  ].map(([label, value, hint]) => (
                    <div key={label} className="bg-obsidian-pane px-3 py-5 text-center sm:px-4">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-3xl text-foreground">
                        {value}
                      </dd>
                      <dd className="mt-0.5 text-xs text-muted-foreground">
                        {hint}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {/* ── Exam Rules Section ── */}
            <section className="mb-8 rounded-[0.875rem] border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500">
                  <Shield size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Strict Exam Rules
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Read carefully before starting. Violations lead to
                    auto-submission.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {EXAM_RULES.map((rule, i) => (
                  <div
                    key={rule.title}
                    className={cn(
                      "flex items-start gap-3.5 rounded-lg border p-4 transition-colors",
                      i === 2
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-obsidian-border bg-obsidian-pane",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        i === 2
                          ? "border-red-500/30 bg-red-500/10 text-red-500"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-500",
                      )}
                    >
                      <rule.icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{rule.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {rule.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Warning escalation visual */}
              <div className="mt-6 rounded-lg border border-obsidian-border bg-obsidian-pane p-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Warning Escalation
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold",
                          step <= 3
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                            : "border-red-500/40 bg-red-500/15 text-red-500",
                        )}
                      >
                        {step <= 3 ? step : "✕"}
                      </div>
                      <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground">
                        {step <= 3 ? `Warning ${step}` : "Auto-submit"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Configuration + Start Panel ── */}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
              <section
                className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 sm:p-8"
                aria-labelledby="setup-title"
              >
                <h2
                  id="setup-title"
                  className="text-xl sm:text-2xl font-semibold text-foreground"
                >
                  Build your challenge
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose your focus. We'll shuffle the questions and choices.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Language
                    <select
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
                  </label>
                  <label className="text-sm font-medium">
                    Difficulty
                    <select
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
                  </label>
                  <label className="text-sm font-medium">
                    Questions
                    <select
                      className={fieldClass}
                      value={size}
                      onChange={(event) => setSize(Number(event.target.value))}
                    >
                      {[5, 10, 15, 20].map((value) => (
                        <option key={value} value={value}>
                          {value} questions
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Time limit
                    <select
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
                  </label>
                </div>
                <fieldset className="mt-7">
                  <legend className="mb-3 text-sm font-medium">
                    Quiz mode
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["practice", "timed"] as const).map((value) => (
                      <label
                        key={value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary",
                          mode === value
                            ? "border-primary bg-primary/10"
                            : "border-obsidian-border bg-obsidian-elevated hover:bg-foreground/[0.05]",
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
                          <span className="block font-medium text-foreground">
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

                {/* Fullscreen notice */}
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <Maximize2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Mandatory fullscreen exam
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      Starting this quiz enters fullscreen. Exiting fullscreen,
                      switching tabs, or minimizing triggers a warning. After{" "}
                      <strong className="text-foreground">{MAX_WARNINGS} violations</strong>,
                      your exam is automatically submitted with whatever answers
                      you have.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── Start Aside ── */}
              <aside className="flex flex-col rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6 lg:sticky lg:top-24 sm:p-8">
                <p className="lp-kicker mb-2">
                  Your next session
                </p>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  Ready, set, challenge yourself.
                </h2>
                <dl className="my-6 grid gap-3 text-sm">
                  {[
                    [
                      "Focus",
                      languages.find((item) => item.value === language)?.label,
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
                      className="flex justify-between gap-4 border-b border-obsidian-border pb-3"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                {size > available && (
                  <p
                    role="status"
                    className="mb-5 rounded-lg border border-obsidian-border bg-obsidian-elevated p-3 text-sm text-muted-foreground"
                  >
                    This selection has {available} questions. Your quiz will
                    include all {count}, without repeats or changing difficulty.
                  </p>
                )}
                <Button
                  className="mt-auto h-11 w-full gap-2 rounded-lg"
                  onClick={() => void start()}
                  disabled={!count || starting}
                >
                  {starting ? "Opening fullscreen…" : "Start quiz"}
                  <ArrowRight size={16} />
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Fullscreen is required. Answers appear after submission.
                </p>
              </aside>
            </div>
          </>
        )}

        {/* ═══════════ RUNNING PHASE ═══════════ */}
        {phase === "running" && session && question && !examWarning && (
          <>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="lp-kicker mb-1">
                  {session.deadline ? "Timed challenge" : "Practice session"}
                </p>
                <h1 className="text-2xl font-semibold sm:text-3xl text-foreground">
                  One question. One step forward.
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Warning indicator during exam */}
                {warningCount > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2",
                      warningCount >= 3
                        ? "border-red-500/30 bg-red-500/10"
                        : warningCount >= 2
                          ? "border-orange-500/30 bg-orange-500/10"
                          : "border-amber-500/30 bg-amber-500/10",
                    )}
                  >
                    {(() => {
                      const Icon = getWarningIcon();
                      return <Icon size={18} className={getWarningColor()} />;
                    })()}
                    <div>
                      <p className={cn("text-[10px] font-medium", getWarningColor())}>
                        Warnings
                      </p>
                      <p className={cn("font-mono text-base font-semibold tabular-nums", getWarningColor())}>
                        {warningCount}/{MAX_WARNINGS}
                      </p>
                    </div>
                  </div>
                )}
                {/* Timer */}
                <div
                  role="timer"
                  aria-label={
                    session.deadline ? "Time remaining" : "Time elapsed"
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-2",
                    session.deadline && remaining <= 60
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-obsidian-border bg-obsidian-pane text-foreground",
                  )}
                >
                  <Clock3 size={18} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      {session.deadline ? "Time remaining" : "Time elapsed"}
                    </p>
                    <p className="font-mono text-xl font-semibold tabular-nums">
                      {formatQuizTime(session.deadline ? remaining : elapsed)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,24rem)]">
              <section className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Question {index + 1} of {questions.length}
                  </span>
                  <span className="lp-chip">
                    {QUIZ_LANGUAGE_LABELLED[question.language].label} ·{" "}
                    {question.difficulty} · {question.topic}
                  </span>
                </div>
                <h2
                  ref={questionRef}
                  tabIndex={-1}
                  className="max-w-[68ch] whitespace-pre-wrap text-xl font-semibold leading-relaxed outline-none sm:text-2xl text-foreground"
                >
                  {question.question}
                </h2>
                <fieldset className="mt-8 grid max-w-[68ch] gap-3">
                  <legend className="sr-only">Choose one answer</legend>
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={optionIndex}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary sm:p-5",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-obsidian-border bg-obsidian-elevated hover:bg-foreground/[0.05]",
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
                            "grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-xs font-semibold transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-obsidian-border bg-obsidian-pane text-muted-foreground",
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-0.5 text-sm leading-6 sm:text-base text-foreground">
                          <span className="sr-only">{String.fromCharCode(65 + optionIndex)}. </span>
                          {option}
                        </span>
                        {selected && (
                          <Check
                            size={18}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-primary"
                          />
                        )}
                      </label>
                    );
                  })}
                </fieldset>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-border pt-5">
                  <Button
                    variant="ghost"
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
                    <Flag size={16} className="mr-2" />
                    {flagged.has(question.id)
                      ? "Flagged for review"
                      : "Flag for review"}
                  </Button>
                  <Button
                    variant="ghost"
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
                    <ArrowLeft size={16} className="mr-2" />
                    Previous
                  </Button>
                  {index < questions.length - 1 ? (
                    <Button onClick={() => setIndex(index + 1)}>
                      Next question
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={() => setConfirmation("submit")}>
                      Review & submit
                    </Button>
                  )}
                </div>
              </section>
              <aside className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-6">
                <h2 className="font-semibold text-foreground">Your progress</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {answered} of {questions.length} answered
                </p>
                <div
                  role="progressbar"
                  aria-label="Answers completed"
                  aria-valuenow={answered}
                  aria-valuemin={0}
                  aria-valuemax={questions.length}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-obsidian-elevated"
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(answered / questions.length) * 100}%` }}
                  />
                </div>
                <nav
                  aria-label="Question navigation"
                  className="mt-6 grid grid-cols-5 gap-2"
                >
                  {questions.map((item, position) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Question ${position + 1}${answers[item.id] !== undefined ? ", answered" : ", unanswered"}${flagged.has(item.id) ? ", flagged" : ""}`}
                      aria-current={index === position ? "step" : undefined}
                      onClick={() => setIndex(position)}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-md border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        answers[item.id] !== undefined
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-obsidian-border bg-obsidian-elevated text-muted-foreground hover:bg-foreground/[0.05]",
                        index === position &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      )}
                    >
                      {position + 1}
                      {flagged.has(item.id) && (
                        <Flag
                          size={9}
                          className="absolute right-0.5 top-0.5 text-amber-500"
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

                {/* Warning status in sidebar */}
                {warningCount > 0 && (
                  <div
                    className={cn(
                      "mt-5 rounded-lg border p-3",
                      warningCount >= 3
                        ? "border-red-500/25 bg-red-500/5"
                        : "border-amber-500/25 bg-amber-500/5",
                    )}
                  >
                    <p className={cn("text-xs font-semibold", warningCount >= 3 ? "text-red-500" : "text-amber-500")}>
                      ⚠ {warningCount} of {MAX_WARNINGS} warnings used
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {warningsRemaining <= 1
                        ? "Next violation will auto-submit your exam!"
                        : `${warningsRemaining} violations remaining before auto-submit.`}
                    </p>
                  </div>
                )}

                <Button
                  className="mt-6 w-full"
                  onClick={() => setConfirmation("submit")}
                >
                  Submit quiz
                </Button>
              </aside>
            </div>
          </>
        )}

        {/* ═══════════ RESULTS PHASE ═══════════ */}
        {phase === "results" && session && (
          <>
            <section className="overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-12 lg:p-10">
                <div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-primary">
                    <Trophy size={24} aria-hidden="true" />
                  </span>
                  <p className="mt-4 lp-kicker">
                    Challenge complete
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-3xl text-foreground">
                    {warningTerminated
                      ? "Exam terminated."
                      : correct === questions.length
                        ? "A perfect finish!"
                        : "Every attempt makes you better."}
                  </h1>
                  <p role="status" className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {warningTerminated
                      ? `Your exam was auto-submitted after ${MAX_WARNINGS} focus violations. Answers given before termination have been recorded.`
                      : timedOut
                        ? "Time’s up! Your answers were submitted automatically."
                        : "Your quiz is submitted. Let’s see how you did."}
                  </p>

                  {/* Warning summary in results */}
                  {warningCount > 0 && (
                    <div
                      className={cn(
                        "mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                        warningTerminated
                          ? "border-red-500/30 bg-red-500/10 text-red-500"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-500",
                      )}
                    >
                      <AlertTriangle size={15} />
                      {warningTerminated
                        ? `Terminated after ${warningCount} focus violations`
                        : `${warningCount} focus warning${warningCount > 1 ? "s" : ""} during exam`}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => void start()} disabled={starting}>
                      <RotateCcw size={16} className="mr-2" />
                      Try another quiz
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Change settings
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-border">
                  {[
                    [
                      "Score",
                      `${Math.round((correct / questions.length) * 100)}%`,
                    ],
                    ["Correct", `${correct} / ${questions.length}`],
                    ["Unanswered", `${questions.length - answered}`],
                    ["Time taken", formatQuizTime(elapsed)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-obsidian-pane px-4 py-5 text-center">
                      <p className="text-xs font-medium text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-3xl text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            {warningCount > 0 && (
              <p className="mt-5 text-sm text-muted-foreground">
                Exam focus warnings: {warningCount}
              </p>
            )}
            {warningCount > 0 && (
              <div className="mt-5 flex items-center gap-3 rounded-[0.875rem] border border-amber-500/30 bg-amber-500/5 p-4">
                <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Exam integrity: {warningCount} warning{warningCount > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {warningTerminated
                      ? "This exam was terminated due to exceeding the maximum allowed focus violations. In a real exam, this would disqualify the attempt."
                      : "Focus violations were recorded during this attempt. In a real exam, these would be flagged for review."}
                  </p>
                </div>
              </div>
            )}
            <section className="mt-10" aria-labelledby="review-title">
              <h2 id="review-title" className="text-xl sm:text-2xl font-semibold text-foreground">
                Answer review
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Understand the why, not just the score.
              </p>
              <div className="mt-6 grid items-start gap-4 xl:grid-cols-2">
                {questions.map((item, position) => {
                  const selected = answers[item.id];
                  const isCorrect = selected === item.correctIndex;
                  return (
                    <article
                      key={item.id}
                      className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-5 sm:p-6"
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2
                            size={20}
                            className="mt-1 shrink-0 text-emerald-500"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="mt-1 shrink-0 text-destructive"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Question {position + 1} ·{" "}
                            {isCorrect
                              ? "Correct"
                              : selected === undefined
                                ? "Unanswered"
                                : "Incorrect"}
                            {flagged.has(item.id) ? " · Flagged" : ""}
                          </p>
                          <h3 className="whitespace-pre-wrap font-semibold leading-7">
                            {item.question}
                          </h3>
                          <p className="mt-4 whitespace-pre-wrap text-sm">
                            <span className="text-muted-foreground">
                              Your answer:{" "}
                            </span>
                            {selected === undefined
                              ? "Not answered"
                              : item.options[selected]}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            <span className="font-semibold text-emerald-500">
                              Correct answer:{" "}
                            </span>
                            {item.options[item.correctIndex]}
                          </p>
                          <p className="mt-4 border-t border-obsidian-border pt-4 text-sm leading-7 text-muted-foreground">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ═══════════ EXAM WARNING DIALOG (escalating) ═══════════ */}
        <AlertDialog open={phase === "running" && examWarning !== null}>
          <AlertDialogContent
            onEscapeKeyDown={(event) => event.preventDefault()}
            className="border-red-500/30"
          >
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
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
            <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
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
                <Button
                  onClick={() => void resumeExam()}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
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
