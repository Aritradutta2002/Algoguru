import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";
import {
  BACKEND_ANNOTATIONS_PATH,
  BACKEND_PRACTICE_PATH,
  BACKEND_QUESTIONS_PATH,
  BACKEND_TOTAL_QUESTIONS,
  BACKEND_TOTAL_READ_MINUTES,
  backendQuestionIndex,
  backendTopicStats,
} from "@/lib/backendQuestionIndex";
import { ANNOTATION_CATEGORIES, ANNOTATION_COUNT } from "@/data/backendInterview/annotations";
import {
  PRACTICE_PROBLEM_COUNT,
  PRACTICE_TOTAL_MINUTES,
} from "@/data/backendInterview/practiceProblems";
import { useBackendInterviewProgress } from "@/hooks/useBackendInterviewProgress";
import { scrollPageToTop } from "@/lib/scrollUtils";
import { cn } from "@/lib/utils";
import "@/styles/core-java-interview.css";

interface StudyWeek {
  label: string;
  focus: string;
  topicIds: string[];
  outcome: string;
}

const STUDY_PLAN: StudyWeek[] = [
  {
    label: "Week 1",
    focus: "Annotations, top to bottom",
    topicIds: ["java-annotations", "spring-annotations"],
    outcome:
      "You can explain retention policies, how Spring scans and proxies beans, and why a `@Transactional` self-invocation silently does nothing.",
  },
  {
    label: "Week 2",
    focus: "Boot internals + collections",
    topicIds: ["spring-boot-core", "collections"],
    outcome:
      "You can walk the startup sequence end to end and pick the right collection with a reasoned complexity and concurrency argument.",
  },
  {
    label: "Week 3",
    focus: "HashMap internals + concurrency",
    topicIds: ["hashmap-internals", "multithreading"],
    outcome:
      "You can draw the bucket table on a whiteboard, explain treeification, and reason about the memory model rather than guessing.",
  },
  {
    label: "Week 4",
    focus: "Security, JWT and the practice lab",
    topicIds: ["spring-security", "jwt"],
    outcome:
      "You can design a stateless auth flow, defend it against the classic attacks, and implement a filter under interview time pressure.",
  },
];

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="cjh-stat-card rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-none text-foreground">{value}</div>
          <div className="mt-1 truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function PillarCard({
  to,
  icon,
  eyebrow,
  title,
  description,
  meta,
  accent,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="cjh-path-card group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className="cjh-path-icon flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          {icon}
        </span>
        <ArrowRight className="cjh-path-arrow h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <p className="mt-4 text-xs font-medium" style={{ color: accent }}>
        {meta}
      </p>
    </Link>
  );
}

export default function BackendInterviewHubPage() {
  const { language = "java" } = useParams<{ language?: string }>();
  const progress = useBackendInterviewProgress();

  useEffect(() => {
    document.title = "Spring Boot & Backend Interview Prep | AlgoGuru";
    scrollPageToTop(document.getElementById("backend-hub-root"));
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  const studiedPercent = progress.percentOf(BACKEND_TOTAL_QUESTIONS);

  const perTopicStudied = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of backendQuestionIndex) {
      if (progress.studiedIds.has(entry.question.id)) {
        counts[entry.topic.id] = (counts[entry.topic.id] ?? 0) + 1;
      }
    }
    return counts;
  }, [progress.studiedIds]);

  const nextUp = useMemo(
    () => backendQuestionIndex.find((entry) => !progress.studiedIds.has(entry.question.id)),
    [progress.studiedIds],
  );

  const veryHighCount = useMemo(
    () => backendQuestionIndex.filter((e) => e.meta.priority === "very-high").length,
    [],
  );

  const readHours = Math.round(BACKEND_TOTAL_READ_MINUTES / 6) / 10;
  const practiceHours = Math.round(PRACTICE_TOTAL_MINUTES / 6) / 10;

  return (
    <div id="backend-hub-root" className="cjh-page min-h-full w-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="cjh-breadcrumb mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/interview" className="transition-colors hover:text-foreground">
            Interview Prep
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Spring Boot &amp; Backend</span>
        </nav>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="cjh-hero relative overflow-hidden rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur sm:p-8"
        >
          <div className="cjh-hero-glow" aria-hidden="true" />
          <div className="relative">
            <span className="cjh-hero-badge inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Built for 3–4 years of experience
            </span>
            <h1 className="cjh-hero-title mt-4 text-3xl font-black leading-tight text-foreground sm:text-4xl">
              Spring Boot &amp; Backend Engineering
              <span className="block text-primary">Interview Masterclass</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every annotation with its internals, the Collections Framework, how <code>HashMap</code> really
              works, the full multithreading and memory-model story, and complete Spring Security + JWT theory —
              each with a long-form answer, runnable code and a hands-on exercise. No summaries, no hand-waving.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={nextUp ? `${BACKEND_QUESTIONS_PATH}/${nextUp.slug}` : BACKEND_QUESTIONS_PATH}
                className="cjh-btn-primary inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" />
                {progress.studiedCount > 0 ? "Resume where you left off" : "Start the question bank"}
              </Link>
              <Link
                to={BACKEND_PRACTICE_PATH}
                className="cjh-btn-secondary inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Dumbbell className="h-4 w-4" />
                Practice with problems
              </Link>
              <Link
                to={BACKEND_ANNOTATIONS_PATH}
                className="cjh-btn-secondary inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Tag className="h-4 w-4" />
                Annotation reference
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            icon={<BookOpen className="h-5 w-5" />}
            value={String(BACKEND_TOTAL_QUESTIONS)}
            label="Full answers"
            accent="hsl(var(--primary))"
          />
          <StatTile
            icon={<Tag className="h-5 w-5" />}
            value={String(ANNOTATION_COUNT)}
            label="Annotations"
            accent="hsl(var(--success))"
          />
          <StatTile
            icon={<Dumbbell className="h-5 w-5" />}
            value={String(PRACTICE_PROBLEM_COUNT)}
            label="Practice problems"
            accent="hsl(var(--warning))"
          />
          <StatTile
            icon={<Flame className="h-5 w-5" />}
            value={String(veryHighCount)}
            label="Must-know"
            accent="hsl(var(--destructive))"
          />
          <StatTile
            icon={<Clock className="h-5 w-5" />}
            value={`${readHours}h`}
            label="Reading time"
            accent="hsl(var(--info))"
          />
        </section>

        {/* Progress */}
        <section className="cjh-progress-card mt-6 rounded-2xl border border-border/50 bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Target className="h-4 w-4 text-primary" />
                Your progress
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saved in this browser — {progress.studiedCount} of {BACKEND_TOTAL_QUESTIONS} questions marked
                studied, {progress.practiceSolvedCount} of {PRACTICE_PROBLEM_COUNT} problems solved,{" "}
                {progress.bookmarkCount} bookmarked.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-primary">{studiedPercent}%</span>
              {(progress.studiedCount > 0 ||
                progress.practiceSolvedCount > 0 ||
                progress.bookmarkCount > 0) && (
                <button
                  type="button"
                  onClick={progress.resetProgress}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="cjh-progress-track mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="cjh-progress-fill h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${studiedPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </section>

        {/* Pillars */}
        <section className="mt-8">
          <div className="cjh-section-header mb-4">
            <h2 className="cjh-section-title flex items-center gap-2 text-lg font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              Three ways to prepare
            </h2>
            <p className="cjh-section-meta mt-1 text-xs text-muted-foreground">
              Read the theory, look up any annotation in seconds, then prove it by building something.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <PillarCard
              to={BACKEND_QUESTIONS_PATH}
              icon={<BookOpen className="h-5 w-5" />}
              eyebrow="Question bank"
              title="138 questions, full answers"
              description="Every answer is 300–500 words of real explanation — internals, trade-offs, failure modes — plus a self-contained code sample and the follow-ups the interviewer will ask next."
              meta={`8 topics · ~${readHours} hours of reading`}
              accent="hsl(var(--primary))"
            />
            <PillarCard
              to={BACKEND_ANNOTATIONS_PATH}
              icon={<Tag className="h-5 w-5" />}
              eyebrow="Reference"
              title="Every annotation, explained"
              description="A searchable catalogue of Java and Spring annotations across 16 categories: what it targets, how the framework processes it at runtime, an example, and the gotcha that bites people."
              meta={`${ANNOTATION_COUNT} entries · ${ANNOTATION_CATEGORIES.length} categories`}
              accent="hsl(var(--success))"
            />
            <PillarCard
              to={BACKEND_PRACTICE_PATH}
              icon={<Dumbbell className="h-5 w-5" />}
              eyebrow="Practice lab"
              title="Build it, don't just read it"
              description="Scenario-driven exercises with starter code, staged hints, a complete worked solution and a discussion of why the naive answer fails in production."
              meta={`${PRACTICE_PROBLEM_COUNT} problems · ~${practiceHours} hours hands-on`}
              accent="hsl(var(--warning))"
            />
          </div>
        </section>

        {/* Topics */}
        <section className="mt-8">
          <div className="cjh-section-header mb-4">
            <h2 className="cjh-section-title flex items-center gap-2 text-lg font-bold text-foreground">
              <Brain className="h-4 w-4 text-primary" />
              Topics
            </h2>
            <p className="cjh-section-meta mt-1 text-xs text-muted-foreground">
              Ordered the way a strong candidate builds the story: language machinery first, framework second,
              concurrency and security last.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {backendTopicStats.map((stat, idx) => {
              const studied = perTopicStudied[stat.topic.id] ?? 0;
              const percent = stat.total ? Math.round((studied / stat.total) * 100) : 0;
              const complete = percent === 100;
              return (
                <motion.div
                  key={stat.topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.24) }}
                >
                  <Link
                    to={`${BACKEND_QUESTIONS_PATH}?topic=${stat.topic.id}`}
                    className={cn(
                      "cjh-topic-card group flex h-full flex-col rounded-2xl border border-border/50 bg-card/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
                      complete && "cjh-topic-card--complete border-success/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="cjh-topic-emoji text-2xl leading-none" aria-hidden="true">
                        {stat.topic.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-bold text-foreground">
                            {stat.topic.shortTitle}
                          </h3>
                          {complete && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {stat.topic.blurb}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-bold text-foreground">
                        {stat.total}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-md border border-success/25 bg-success/10 px-2 py-0.5 text-success">
                        {stat.easy} easy
                      </span>
                      <span className="rounded-md border border-warning/25 bg-warning/10 px-2 py-0.5 text-warning">
                        {stat.medium} medium
                      </span>
                      <span className="rounded-md border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-destructive">
                        {stat.hard} hard
                      </span>
                      {stat.veryHigh > 0 && (
                        <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary">
                          🔥 {stat.veryHigh} must-know
                        </span>
                      )}
                    </div>

                    <p className="mt-3 rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-[11px] italic leading-relaxed text-muted-foreground">
                      “{stat.topic.interviewerIntent}”
                    </p>

                    <div className="mt-auto pt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {studied}/{stat.total} studied
                        </span>
                        <span>~{Math.round(stat.readMinutes / 6) / 10}h</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            background: complete ? "hsl(var(--success))" : stat.topic.accent,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Study plan */}
        <section className="mt-8">
          <div className="cjh-section-header mb-4">
            <h2 className="cjh-section-title flex items-center gap-2 text-lg font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              A four-week plan
            </h2>
            <p className="cjh-section-meta mt-1 text-xs text-muted-foreground">
              Roughly 60–90 minutes a day. Read the topic, then immediately do its practice problems — recall
              beats re-reading.
            </p>
          </div>
          <div className="cjh-roadmap grid gap-3 sm:grid-cols-2">
            {STUDY_PLAN.map((week) => {
              const topics = backendTopicStats.filter((s) => week.topicIds.includes(s.topic.id));
              const total = topics.reduce((sum, s) => sum + s.total, 0);
              const done = topics.reduce((sum, s) => sum + (perTopicStudied[s.topic.id] ?? 0), 0);
              return (
                <div
                  key={week.label}
                  className="rounded-2xl border border-border/50 bg-card/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {week.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {done}/{total} done
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground">{week.focus}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {topics.map((s) => (
                      <Link
                        key={s.topic.id}
                        to={`${BACKEND_QUESTIONS_PATH}?topic=${s.topic.id}`}
                        className="rounded-md border border-border/50 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {s.topic.icon} {s.topic.shortTitle}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{week.outcome}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 rounded-2xl border border-border/50 bg-card/50 p-5 text-center">
          <p className="text-sm font-semibold text-foreground">
            {BACKEND_TOTAL_QUESTIONS} questions · {ANNOTATION_COUNT} annotations ·{" "}
            {PRACTICE_PROBLEM_COUNT} practice problems
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Everything here is written to be said out loud in an interview. If you can explain an answer without
            looking at it and then solve the matching practice problem, that topic is done.
          </p>
        </footer>
      </div>
    </div>
  );
}
