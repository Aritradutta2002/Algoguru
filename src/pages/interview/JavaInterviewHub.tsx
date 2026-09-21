import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Database,
  Flame,
  Layers,
  ListChecks,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { getAllCoreJavaQuestions, getCoreJavaTopicCount } from "@/lib/coreJavaQuestionIndex";
import {
  getCoreJavaQuestionDetailPath,
  getCoreJavaQuestionMeta,
  type InterviewPriority,
} from "@/data/coreJavaInterviewMetadata";
import { DifficultyBadge } from "@/components/interview/CoreJavaBadges";
import { cn } from "@/lib/utils";
import "@/styles/java-interview-hub.css";

/* ────────────────────────────────────────────────────────────────────
   Motion primitives
   ──────────────────────────────────────────────────────────────────── */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Scroll-reveal preset; pass a delay to offset siblings. */
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.55, ease: EASE, delay },
});

const fadeUp = reveal();

function useInViewOnce<T extends Element>(ref: RefObject<T | null>, rootMargin = "-60px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/** Eased count-up that starts when `start` flips true. */
function useCountUp(target: number, start: boolean, duration = 950): number {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration, reduced]);
  return display;
}

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
  label?: string;
}

/** SVG progress ring with an animated sweep on mount. */
function ProgressRing({ value, size = 120, strokeWidth = 10, className, children, label }: ProgressRingProps) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex flex-shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped)} percent complete`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduced ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduced ? 0 : 1.15, ease: EASE, delay: 0.2 }}
          className="stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  fillClassName?: string;
  className?: string;
  ariaLabel?: string;
  delay?: number;
}

/** Thin progress bar that sweeps in when it scrolls into view. */
function ProgressBar({ value, fillClassName, className, ariaLabel, delay = 0.15 }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn("h-full rounded-full bg-primary", fillClassName)}
        initial={reduced ? { width: `${clamped}%` } : { width: "0%" }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: reduced ? 0 : 0.9, ease: EASE, delay }}
      />
    </div>
  );
}

/** Stacked easy / medium / hard distribution bar. */
function DifficultyBar({ easy, medium, hard, className }: { easy: number; medium: number; hard: number; className?: string }) {
  const total = easy + medium + hard;
  const seg = (n: number) => (total > 0 ? `${(n / total) * 100}%` : "0%");
  return (
    <div className={cn("jvh-diffbar", className)} aria-hidden="true">
      <span className="bg-success" style={{ width: seg(easy) }} />
      <span className="bg-warning" style={{ width: seg(medium) }} />
      <span className="bg-destructive" style={{ width: seg(hard) }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<InterviewPriority, number> = {
  "very-high": 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "tracks", label: "Tracks" },
  { id: "roadmap", label: "Roadmap" },
  { id: "hotlist", label: "Hot list" },
  { id: "revision", label: "Revision" },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

type TrackColor = "primary" | "accent" | "info" | "success";

const TRACK_COLOR_STYLES: Record<TrackColor, { icon: string; track: string }> = {
  primary: { icon: "bg-primary/10 border-primary/25 text-primary", track: "hsl(var(--primary))" },
  accent: { icon: "bg-accent/10 border-accent/30 text-accent", track: "hsl(var(--accent))" },
  info: { icon: "bg-info/10 border-info/25 text-info", track: "hsl(var(--info))" },
  success: { icon: "bg-success/10 border-success/25 text-success", track: "hsl(var(--success))" },
};

const LEARNING_TRACKS: Array<{
  id: string;
  title: string;
  description: string;
  icon: typeof Coffee;
  color: TrackColor;
  route: string;
  meta: string | null;
}> = [
  {
    id: "core-java-qa",
    title: "Core Java Q&A",
    description: "Theory, code and interview-ready answers for the questions that come up in every Java round.",
    icon: Coffee,
    color: "primary",
    route: "/interview/java/core-java-qa",
    meta: null, // filled with the live question count
  },
  {
    id: "data-structure",
    title: "Data Structures",
    description: "The DSA patterns and Java idioms interviewers probe in screening rounds.",
    icon: Target,
    color: "accent",
    route: "/interview/java/data-structure",
    meta: "DSA focus",
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Scalable system thinking — load balancing, caching, data stores and trade-offs.",
    icon: Layers,
    color: "info",
    route: "/interview/java/system-design",
    meta: "Design thinking",
  },
  {
    id: "sql-structure",
    title: "SQL Questions",
    description: "Interview-grade SQL: joins, subqueries, window functions and query tuning.",
    icon: Database,
    color: "success",
    route: "/interview/java/sql-structure",
    meta: "Query mastery",
  },
];

function useActiveSection(): string {
  const [active, setActive] = useState<string>(SECTION_IDS[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 }
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

/* ────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────── */

export default function JavaInterviewHub() {
  const navigate = useNavigate();
  const { doneMap } = useCoreJavaUserState();
  const { bookmarkedIds } = useCoreJavaBookmarks();
  const activeSection = useActiveSection();

  useEffect(() => {
    const previous = document.title;
    document.title = "Java Interview | AlgoGuru";
    return () => {
      document.title = previous;
    };
  }, []);

  /* ── Derived data ─────────────────────────────────────────────── */

  const allQuestions = useMemo(() => getAllCoreJavaQuestions(), []);
  const totalQuestions = allQuestions.length;
  const topicCount = getCoreJavaTopicCount();

  const { easyCount, mediumCount, hardCount, veryHighCount } = useMemo(() => {
    let easy = 0,
      medium = 0,
      hard = 0,
      veryHigh = 0;
    for (const q of allQuestions) {
      const difficulty = q.meta.difficulty;
      if (difficulty === "easy") easy += 1;
      else if (difficulty === "medium") medium += 1;
      else if (difficulty === "hard") hard += 1;
      if (q.meta.priority === "very-high") veryHigh += 1;
    }
    return { easyCount: easy, mediumCount: medium, hardCount: hard, veryHighCount: veryHigh };
  }, [allQuestions]);

  const doneCount = useMemo(() => allQuestions.filter((q) => doneMap[q.question.id]).length, [allQuestions, doneMap]);
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;
  const remainingCount = totalQuestions - doneCount;
  const bookmarkedCount = bookmarkedIds.length;

  const { fullReadMinutes, quickRevisionMinutes } = useMemo(() => {
    const totalWords = allQuestions.reduce(
      (sum, q) => sum + (q.question.answer?.split(/\s+/).length ?? 0),
      0
    );
    const quickWords = allQuestions
      .filter((q) => q.meta.priority === "very-high" || q.meta.priority === "high")
      .reduce((sum, q) => sum + (q.question.explanation?.split(/\s+/).length ?? 0), 0);
    return {
      fullReadMinutes: Math.max(5, Math.round(totalWords / 200)),
      quickRevisionMinutes: Math.max(10, Math.round(quickWords / 250)),
    };
  }, [allQuestions]);

  const topicStats = useMemo(
    () =>
      coreJavaInterviewTopics.map((topic, i) => {
        let done = 0,
          easy = 0,
          medium = 0,
          hard = 0,
          words = 0;
        for (const q of topic.questions) {
          if (doneMap[q.id]) done += 1;
          const difficulty = getCoreJavaQuestionMeta(q.id).difficulty;
          if (difficulty === "easy") easy += 1;
          else if (difficulty === "medium") medium += 1;
          else if (difficulty === "hard") hard += 1;
          words += q.answer?.split(/\s+/).length ?? 0;
        }
        return {
          topic,
          number: i + 1,
          done,
          total: topic.questions.length,
          pct: topic.questions.length > 0 ? Math.round((done / topic.questions.length) * 100) : 0,
          easy,
          medium,
          hard,
          minutes: Math.max(1, Math.round(words / 200)),
        };
      }),
    [doneMap]
  );

  const mostAsked = useMemo(
    () =>
      [...allQuestions]
        .sort(
          (a, b) =>
            PRIORITY_RANK[a.meta.priority ?? "low"] - PRIORITY_RANK[b.meta.priority ?? "low"] ||
            a.index - b.index
        )
        .slice(0, 6),
    [allQuestions]
  );

  const nextQuestion = useMemo(() => {
    const notDone = allQuestions.filter((q) => !doneMap[q.question.id]);
    if (notDone.length === 0) return undefined;
    return notDone.find((q) => q.meta.priority === "very-high") ?? notDone[0];
  }, [allQuestions, doneMap]);

  const goStart = () => {
    if (nextQuestion) navigate(getCoreJavaQuestionDetailPath(nextQuestion.question));
    else navigate("/interview/java/core-java-qa");
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tracks = LEARNING_TRACKS.map((track) =>
    track.id === "core-java-qa"
      ? { ...track, meta: `${totalQuestions} questions` }
      : track
  );

  const startCta = progressPct > 0 ? "Continue learning" : "Start learning";

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="jvh-page min-h-full text-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6 md:py-9">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          aria-label="Breadcrumb"
          className="jvh-breadcrumb mb-5"
        >
          <Link to="/">Home</Link>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <Link to="/interview">Interview</Link>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span className="font-semibold text-foreground">Java</span>
        </motion.nav>

        {/* Sticky section nav */}
        <div className="sticky top-3 z-30 mb-6 flex justify-center lg:justify-start">
          <nav className="jvh-sitenav" aria-label="Page sections">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "jvh-sitenav-link",
                  activeSection === section.id && "jvh-sitenav-link--active"
                )}
              >
                <span className="jvh-sitenav-dot" aria-hidden="true" />
                {section.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px flex-shrink-0 bg-border" aria-hidden="true" />
            <span
              className="flex flex-shrink-0 items-center gap-2 pr-1 pl-0.5 font-mono text-[11px] font-semibold tabular-nums text-muted-foreground"
              aria-label={`Overall progress ${progressPct} percent`}
            >
              <ProgressRing
                value={progressPct}
                size={24}
                strokeWidth={3.5}
                label={`Overall progress ${progressPct} percent`}
              >
                <span className="h-1 w-1 rounded-full bg-primary" />
              </ProgressRing>
              {progressPct}%
            </span>
          </nav>
        </div>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <motion.header
          id="overview"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="jvh-hero scroll-mt-16 p-6 sm:p-8 lg:p-12"
        >
          <div className="jvh-hero-glow-a" aria-hidden="true" />
          <div className="jvh-hero-glow-b" aria-hidden="true" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            {/* Left: headline + CTAs */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-background/80 py-1.5 pr-3.5 pl-1.5 shadow-sm backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Coffee size={13} />
                </span>
                <span className="text-xs font-semibold tracking-tight">Java Interview Track</span>
                <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                  core → advanced
                </span>
              </div>

              <h1 className="font-display text-[2.1rem] leading-[1.06] font-bold tracking-[-0.035em] sm:text-5xl xl:text-[3.4rem]">
                Master Java.
                <br />
                <span className="text-primary">Crack the interview.</span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
                {totalQuestions} expert-curated questions across OOP, Strings, Collections,
                Multithreading, JVM and Java 8+ — with runnable code, diagrams and
                interview-ready answers for every single one.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button type="button" onClick={goStart} className="jvh-btn-primary">
                  {startCta}
                  <ArrowRight size={15} />
                </button>
                <Link to="/interview/java/core-java-qa" className="jvh-btn-secondary">
                  <BookOpen size={15} className="text-muted-foreground" />
                  Browse all questions
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
                <span>{topicCount} topics in order</span>
                <span className="text-border" aria-hidden="true">
                  •
                </span>
                <span>{veryHighCount} must-know questions</span>
                <span className="text-border" aria-hidden="true">
                  •
                </span>
                <span>~{fullReadMinutes} min full read</span>
              </div>
            </div>

            {/* Right: live progress dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
              className="jvh-dashboard jvh-divide-y p-5 sm:p-6"
              aria-label="Your Java interview progress"
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  <h2 className="text-[13px] font-semibold tracking-tight">Your progress</h2>
                </div>
                {progressPct > 0 ? (
                  <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                    {progressPct}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Sparkles size={11} className="text-accent" />
                    Ready when you are
                  </span>
                )}
              </div>

              <div className="flex items-center gap-5 py-4">
                <ProgressRing value={progressPct} size={128} strokeWidth={11}>
                  <span className="font-display text-[1.65rem] leading-none font-bold tracking-tight">
                    {progressPct}
                    <span className="text-sm font-semibold text-muted-foreground">%</span>
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {doneCount}/{totalQuestions}
                  </span>
                </ProgressRing>

                <dl className="grid flex-1 gap-2.5 text-sm">
                  {[
                    { label: "Completed", value: doneCount, dot: "bg-success" },
                    { label: "Remaining", value: remainingCount, dot: "bg-primary" },
                    { label: "Bookmarked", value: bookmarkedCount, dot: "bg-accent" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <span className={cn("h-1.5 w-1.5 rounded-full", row.dot)} aria-hidden="true" />
                        {row.label}
                      </dt>
                      <dd className="font-mono text-[13px] font-semibold tabular-nums">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Difficulty mix
                  </span>
                  <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                    <span className="text-success font-semibold">{easyCount}E</span> ·{" "}
                    <span className="text-warning font-semibold">{mediumCount}M</span> ·{" "}
                    <span className="text-destructive font-semibold">{hardCount}H</span>
                  </span>
                </div>
                <DifficultyBar easy={easyCount} medium={mediumCount} hard={hardCount} />
              </div>

              <div className="pt-4">
                <span className="mb-2 block font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Next up
                </span>
                {nextQuestion ? (
                  <button
                    type="button"
                    onClick={() => navigate(getCoreJavaQuestionDetailPath(nextQuestion.question))}
                    className="group flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10.5px] font-bold text-primary">
                      Q{String(nextQuestion.index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium group-hover:text-primary transition-colors">
                      {nextQuestion.question.question}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="flex-shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </button>
                ) : (
                  <p className="rounded-lg border border-success/30 bg-success/5 px-3.5 py-3 text-[13px] font-medium text-success">
                    <CheckCircle2 size={14} className="mr-1.5 inline -mt-0.5" />
                    Every question completed — review mode unlocked.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* ── Stat strip ─────────────────────────────────────────── */}
        <StatsStrip
          totalQuestions={totalQuestions}
          topicCount={topicCount}
          veryHighCount={veryHighCount}
          fullReadMinutes={fullReadMinutes}
          quickRevisionMinutes={quickRevisionMinutes}
        />

        {/* ── Learning tracks ────────────────────────────────────── */}
        <motion.section
          id="tracks"
          className="mt-14 scroll-mt-16"
          aria-labelledby="tracks-heading"
        >
          <motion.div {...fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="tracks-heading" className="jvh-section-title">
              <span className="jvh-section-icon">
                <ListChecks size={16} />
              </span>
              Choose your track
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              4 tracks · built for the Java hiring loop
            </span>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tracks.map((track, i) => {
              const Icon = track.icon;
              const styles = TRACK_COLOR_STYLES[track.color];
              return (
                <motion.div key={track.id} {...reveal(i * 0.06)}>
                  <Link
                    to={track.route}
                    className="jvh-track-card group"
                    style={{ "--jvh-track": styles.track } as CSSProperties}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className={cn("jvh-track-icon", styles.icon)}>
                        <Icon size={20} />
                      </span>
                      <span className="mt-1 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                        Track 0{i + 1}
                      </span>
                    </div>
                    <h3 className="relative z-10 mb-1.5 text-[15px] font-bold tracking-tight transition-colors group-hover:text-primary">
                      {track.title}
                    </h3>
                    <p className="relative z-10 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {track.description}
                    </p>
                    <span className="relative z-10 mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
                      {track.meta}
                    </span>
                    <span className="jvh-track-arrow relative z-10">
                      Open track <ArrowRight size={12} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Roadmap ────────────────────────────────────────────── */}
        <motion.section
          id="roadmap"
          className="mt-14 scroll-mt-16"
          aria-labelledby="roadmap-heading"
        >
          <motion.div {...fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="roadmap-heading" className="jvh-section-title">
              <span className="jvh-section-icon">
                <Target size={16} />
              </span>
              Interview roadmap
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {topicCount} topics · {totalQuestions} questions · curriculum order
            </span>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
            {/* Sticky overview rail */}
            <motion.aside {...fadeUp} className="hidden lg:block">
              <div className="jvh-rail">
                <div className="jvh-panel p-5">
                  <div className="flex items-center gap-4">
                    <ProgressRing value={progressPct} size={84} strokeWidth={8}>
                      <span className="font-display text-lg leading-none font-bold">
                        {progressPct}
                        <span className="text-[11px] text-muted-foreground">%</span>
                      </span>
                    </ProgressRing>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight">
                        {doneCount}
                        <span className="text-muted-foreground"> / {totalQuestions}</span>
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                        questions completed
                        {bookmarkedCount > 0 && (
                          <span className="block">
                            {bookmarkedCount} bookmarked for later
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      <span>Difficulty mix</span>
                      <span className="tabular-nums normal-case">
                        {easyCount}E · {mediumCount}M · {hardCount}H
                      </span>
                    </div>
                    <DifficultyBar easy={easyCount} medium={mediumCount} hard={hardCount} />
                    <div className="mt-2.5 flex gap-3 text-[10.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Easy
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Medium
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Hard
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <span className="mb-2 block font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Jump to topic
                    </span>
                    <div className="jvh-rail-scroll">
                      {topicStats.map(({ topic, number, done, total }) => (
                        <Link
                          key={topic.id}
                          to={`/interview/java/core-java-qa?topic=${topic.id}`}
                          className="jvh-rail-item"
                          title={`${topic.title} — ${done}/${total} completed`}
                        >
                          <span className="w-5 flex-shrink-0 font-mono text-[10px] font-semibold text-muted-foreground/60">
                            {String(number).padStart(2, "0")}
                          </span>
                          <span className="jvh-rail-item-title flex-1">{topic.title}</span>
                          <span
                            className={cn(
                              "flex-shrink-0 font-mono text-[10px] tabular-nums",
                              done === total && total > 0 ? "text-success font-bold" : "text-muted-foreground"
                            )}
                          >
                            {done}/{total}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Topic cards */}
            <motion.div
              className="grid gap-3.5 sm:grid-cols-2 2xl:grid-cols-3"
            >
              {topicStats.map(({ topic, number, done, total, pct, easy, medium, hard, minutes }, i) => (
                <motion.div key={topic.id} {...reveal(Math.min(i * 0.035, 0.35))}>
                  <Link
                    to={`/interview/java/core-java-qa?topic=${topic.id}`}
                    className={cn("jvh-topic-card group", pct === 100 && "jvh-topic-card--complete")}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className="jvh-topic-emoji" aria-hidden="true">
                        {topic.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="flex items-center gap-1.5 text-[13.5px] leading-tight font-bold tracking-tight transition-colors group-hover:text-primary">
                          <span className="truncate">{topic.title}</span>
                          {pct === 100 && <CheckCircle2 size={13} className="flex-shrink-0 text-success" aria-label="Complete" />}
                        </h3>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          Topic {String(number).padStart(2, "0")} · {total} questions · ~{minutes} min
                        </p>
                      </div>
                    </div>

                    <DifficultyBar easy={easy} medium={medium} hard={hard} className="mb-2.5" />

                    <div className="flex items-center gap-2.5">
                      <ProgressBar
                        value={pct}
                        ariaLabel={`${topic.title} progress`}
                        delay={0.1 + Math.min(i * 0.03, 0.3)}
                        fillClassName={pct === 100 ? "bg-success" : undefined}
                        className="flex-1"
                      />
                      <span className="font-mono text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Hot list ───────────────────────────────────────────── */}
        <motion.section
          id="hotlist"
          className="mt-14 scroll-mt-16"
          aria-labelledby="hotlist-heading"
        >
          <motion.div {...fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 id="hotlist-heading" className="jvh-section-title">
              <span className="jvh-section-icon">
                <Flame size={16} />
              </span>
              Most asked in interviews
            </h2>
            <Link
              to="/interview/java/core-java-qa?filter=most-asked"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View the full bank <ArrowRight size={12} />
            </Link>
          </motion.div>

          <motion.div {...fadeUp} className="jvh-panel jvh-hotlist">
            {mostAsked.map((entry, i) => (
              <Link
                key={entry.question.id}
                to={getCoreJavaQuestionDetailPath(entry.question)}
                className="jvh-hot-row group"
              >
                <span className="jvh-hot-rank" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {entry.question.question}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-muted-foreground">
                      Q{String(entry.index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {entry.topic.title}
                    </span>
                    {entry.meta.difficulty && <DifficultyBadge difficulty={entry.meta.difficulty} />}
                    {entry.meta.priority === "very-high" && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Flame size={9} />
                        Must know
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="flex-shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Quick revision banner ──────────────────────────────── */}
        <motion.section
          id="revision"
          className="mt-14 scroll-mt-16"
          aria-labelledby="revision-heading"
        >
          <motion.div {...fadeUp} className="jvh-revision p-7 sm:p-10">
            <span className="jvh-revision-watermark" aria-hidden="true">
              public class Interview
            </span>
            <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center">
              <div className="flex-1">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-accent uppercase">
                  <Timer size={11} />
                  Last-minute prep
                </span>
                <h2
                  id="revision-heading"
                  className="font-display text-[1.55rem] leading-tight font-bold tracking-[-0.02em] text-white sm:text-3xl"
                >
                  Interview tomorrow?
                </h2>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/65">
                  Skim the {veryHighCount} must-know questions in ~{quickRevisionMinutes} minutes —
                  theory, code and one-line takeaways for a fast, confident run-through.
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/interview/java/core-java-qa?filter=most-asked")}
                  className="jvh-btn-primary"
                >
                  Start quick revision
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <motion.footer
          {...fadeUp}
          className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 pb-4"
        >
          <p className="font-mono text-[11px] text-muted-foreground">
            Java Interview · {totalQuestions} questions · {topicCount} topics
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Jump into a track">
            {tracks.map((track) => (
              <Link key={track.id} to={track.route} className="jvh-footer-link">
                {track.title}
                <ArrowUpRight size={11} />
              </Link>
            ))}
          </nav>
        </motion.footer>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Stat strip (isolated so its count-up hooks stay hook-rule friendly)
   ──────────────────────────────────────────────────────────────────── */

interface StatsStripProps {
  totalQuestions: number;
  topicCount: number;
  veryHighCount: number;
  fullReadMinutes: number;
  quickRevisionMinutes: number;
}

function StatCell({
  value,
  prefix = "",
  suffix = "",
  label,
  sub,
  inView,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sub: string;
  inView: boolean;
}) {
  const display = useCountUp(value, inView);
  return (
    <div className="jvh-stat-cell">
      <p className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-display text-[1.55rem] leading-none font-bold tracking-tight tabular-nums">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function StatsStrip({
  totalQuestions,
  topicCount,
  veryHighCount,
  fullReadMinutes,
  quickRevisionMinutes,
}: StatsStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(stripRef);
  return (
    <motion.div {...fadeUp} className="mt-6" ref={stripRef}>
      <div className="jvh-stat-strip">
        <StatCell value={totalQuestions} label="Questions" sub="expert-curated & tested" inView={inView} />
        <StatCell value={topicCount} label="Topics" sub="in curriculum order" inView={inView} />
        <StatCell value={veryHighCount} label="Must-know" sub="very-high priority" inView={inView} />
        <StatCell value={fullReadMinutes} prefix="~" suffix=" min" label="Full read" sub="every answer, cover to cover" inView={inView} />
        <StatCell value={quickRevisionMinutes} prefix="~" suffix=" min" label="Quick revision" sub="high-priority essentials" inView={inView} />
      </div>
    </motion.div>
  );
}
