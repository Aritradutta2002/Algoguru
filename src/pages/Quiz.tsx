import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Maximize2,
  Minimize2,
  RotateCcw,
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
  "mx-auto w-full max-w-[110rem] px-4 sm:px-6 lg:px-10 2xl:px-14";
/* 1rem on small screens avoids iOS Safari's focus-zoom, which fires on any
   form control under 16px. */
const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary";
export function formatQuizTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
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
      setWarningCount((current) => current + 1);
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

  return (
    <div className="min-h-screen overflow-y-auto bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className={cn(containerClass, "flex flex-wrap items-center justify-between gap-3 py-4")}>
          {phase === "running" ? (
            <Button variant="ghost" onClick={() => setConfirmation("leave")}>
              <ArrowLeft size={16} className="mr-2" />
              Leave quiz
            </Button>
          ) : (
            <Link
              to="/"
              onClick={() => void exitFullscreen()}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>
          )}
          <span className="flex items-center gap-2 font-display font-bold">
            <Shuffle size={20} className="text-primary" />
            Quiz Studio
          </span>
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
      </header>
      {fullscreenMessage && (
        <p
          role="status"
          className={cn(containerClass, "pt-4 text-sm text-muted-foreground")}
        >
          {fullscreenMessage}
        </p>
      )}
      <main className={cn(containerClass, "py-8 sm:py-12")}>
        {phase === "setup" && (
          <>
            <section
              className="mb-9 overflow-hidden rounded-3xl border border-border bg-card"
              aria-labelledby="setup-hero-title"
            >
              {/* Split hero: the promise on the left, the session the user is
                  about to build on the right. The proof (question count,
                  language mix) sits under the promise instead of in a row of
                  floating chips. */}
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:p-10">
                <div className="flex flex-col justify-center">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles size={14} aria-hidden="true" />
                    A fresh challenge, every time
                  </span>
                  <h1
                    id="setup-hero-title"
                    className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl"
                  >
                    Small questions.
                    <br />
                    <span className="text-primary">Big confidence.</span>
                  </h1>
                  <p className="mt-5 max-w-prose text-base leading-7 text-muted-foreground">
                    Test what you know with random multiple-choice questions.
                    Practice at your pace, or race the clock in a focused,
                    fullscreen challenge.
                  </p>
                </div>
                {/* Three cells in one row on wide screens; the gap-px over a
                    bordered background draws the dividers between them. */}
                <dl className="grid grid-cols-3 gap-px self-center overflow-hidden rounded-2xl border border-border bg-border">
                  {[
                    ["Question bank", `${MCQ_QUESTIONS.length}`, "curated MCQs"],
                    ["Languages", `${QUIZ_LANGUAGES.length}`, "Java, C++, Python"],
                    ["Scoring", "1 pt", "per correct answer"],
                  ].map(([label, value, hint]) => (
                    <div key={label} className="bg-card px-3 py-5 text-center sm:px-4">
                      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1.5 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
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
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
              <section
                className="rounded-3xl border border-border bg-card p-6 sm:p-8"
                aria-labelledby="setup-title"
              >
                <h2
                  id="setup-title"
                  className="font-display text-2xl font-bold"
                >
                  Build your challenge
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose your focus. We’ll shuffle the questions and choices.
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
                  {/* The radio input stays in the DOM for its accessible name
                      and keyboard behaviour, but the card itself is the
                      control, so the whole surface is clickable. */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["practice", "timed"] as const).map((value) => (
                      <label
                        key={value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-card",
                          mode === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50",
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
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
                  <Maximize2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
                  <div>
                    <p className="text-sm font-semibold">
                      Mandatory fullscreen exam
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      Starting this quiz enters fullscreen. Exiting fullscreen,
                      switching tabs, or minimizing shows a warning and blocks
                      questions until you return. The exam timer keeps running.
                    </p>
                  </div>
                </div>
              </section>
              <aside className="flex flex-col rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-card p-6 lg:sticky lg:top-24 sm:p-8">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Your next session
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold">
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
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b border-border/70 pb-3"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                {size > available && (
                  <p
                    role="status"
                    className="mb-5 rounded-xl border border-border bg-background/60 p-3 text-sm text-muted-foreground"
                  >
                    This selection has {available} questions. Your quiz will
                    include all {count}, without repeats or changing difficulty.
                  </p>
                )}
                <Button
                  className="mt-auto h-12 w-full gap-2 rounded-xl"
                  onClick={() => void start()}
                  disabled={!count || starting}
                >
                  {starting ? "Opening fullscreen…" : "Start quiz"}
                  <ArrowRight size={17} />
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Fullscreen is required. Answers appear after submission.
                </p>
              </aside>
            </div>
          </>
        )}
        {phase === "running" && session && question && !examWarning && (
          <>
            <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {session.deadline ? "Timed challenge" : "Practice session"}
                </p>
                <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  One question. One step forward.
                </h1>
              </div>
              <div
                role="timer"
                aria-label={
                  session.deadline ? "Time remaining" : "Time elapsed"
                }
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-5 py-3",
                  session.deadline && remaining <= 60
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-card",
                )}
              >
                <Clock3 size={22} />
                <div>
                  <p className="text-[11px] uppercase tracking-wider">
                    {session.deadline ? "Time remaining" : "Time elapsed"}
                  </p>
                  <p className="font-mono text-2xl font-bold tabular-nums">
                    {formatQuizTime(session.deadline ? remaining : elapsed)}
                  </p>
                </div>
              </div>
            </div>
            {/* The rail grows with the viewport; the question keeps a reading
                measure so the options never stretch to full width. */}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,24rem)]">
              <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Question {index + 1} of {questions.length}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {QUIZ_LANGUAGE_LABELLED[question.language].label} ·{" "}
                    {question.difficulty} · {question.topic}
                  </span>
                </div>
                <h2
                  ref={questionRef}
                  tabIndex={-1}
                  className="max-w-[68ch] whitespace-pre-wrap font-display text-xl font-semibold leading-relaxed outline-none sm:text-2xl"
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
                          "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-card sm:p-5",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={selected}
                          onChange={() => selectAnswer(optionIndex)}
                          className="sr-only"
                        />
                        {/* The letter badge doubles as the selection indicator,
                            so state is never carried by colour alone. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-0.5 text-sm leading-6 sm:text-base">
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
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
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
              <aside className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-semibold">Your progress</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {answered} of {questions.length} answered
                </p>
                <div
                  role="progressbar"
                  aria-label="Answers completed"
                  aria-valuenow={answered}
                  aria-valuemin={0}
                  aria-valuemax={questions.length}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
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
                        "relative flex h-10 items-center justify-center rounded-lg border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        answers[item.id] !== undefined
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground",
                        index === position &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-card",
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
        {phase === "results" && session && (
          <>
            <section className="overflow-hidden rounded-3xl border border-primary/20 bg-card">
              {/* The score is the headline, so it gets the left column at
                  display size; the supporting counts sit beside it as a
                  2x2 grid rather than a thin strip below the title. */}
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-12 lg:p-10">
                <div>
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Trophy size={28} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">
                    Challenge complete
                  </p>
                  <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                    {correct === questions.length
                      ? "A perfect finish!"
                      : "Every attempt makes you better."}
                  </h1>
                  <p role="status" className="mt-3 text-muted-foreground">
                    {timedOut
                      ? "Time’s up! Your answers were submitted automatically."
                      : "Your quiz is submitted. Let’s see how you did."}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button onClick={() => void start()} disabled={starting}>
                      <RotateCcw size={16} className="mr-2" />
                      Try a fresh quiz
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Change settings
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
                  {[
                    [
                      "Score",
                      `${Math.round((correct / questions.length) * 100)}%`,
                    ],
                    ["Correct", `${correct} / ${questions.length}`],
                    ["Unanswered", `${questions.length - answered}`],
                    ["Time taken", formatQuizTime(elapsed)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-card px-4 py-5 text-center">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
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
            <section className="mt-10" aria-labelledby="review-title">
              <h2 id="review-title" className="font-display text-2xl font-bold">
                Answer review
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Understand the why, not just the score.
              </p>
              {/* Two columns once there is room: the review is a scannable
                  list, not a narrative to read in one column. */}
              <div className="mt-6 grid items-start gap-4 xl:grid-cols-2">
                {questions.map((item, position) => {
                  const selected = answers[item.id];
                  const isCorrect = selected === item.correctIndex;
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
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
                          <p className="mt-4 border-t border-border pt-4 text-sm leading-7 text-muted-foreground">
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
        <AlertDialog open={phase === "running" && examWarning !== null}>
          <AlertDialogContent
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Exam fullscreen warning</AlertDialogTitle>
              <AlertDialogDescription>
                {examWarning} Fullscreen and exam focus are mandatory. Your
                questions are locked until you return.{" "}
                {session?.deadline
                  ? "The countdown is still running."
                  : "Your elapsed time is still being recorded."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <p className="text-sm font-medium">
              Warning {warningCount} ·{" "}
              {session?.deadline ? "Time remaining" : "Time elapsed"}:{" "}
              <span className="font-mono">
                {formatQuizTime(session?.deadline ? remaining : elapsed)}
              </span>
            </p>
            {fullscreenMessage && (
              <p role="status" className="text-sm text-destructive">
                {fullscreenMessage}
              </p>
            )}
            <AlertDialogFooter>
              <Button variant="outline" onClick={finish}>
                Submit and end exam
              </Button>
              <Button onClick={() => void resumeExam()}>
                <Maximize2 size={16} className="mr-2" />
                Return to fullscreen
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
