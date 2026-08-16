import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Coffee,
  Flame,
  Layers,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { useCoreJavaUserState } from "@/hooks/useCoreJavaUserState";
import { useCoreJavaBookmarks } from "@/hooks/useCoreJavaBookmarks";
import { getAllCoreJavaQuestions, getCoreJavaTopicCount } from "@/lib/coreJavaQuestionIndex";
import { getCoreJavaQuestionDetailPath } from "@/data/coreJavaInterviewMetadata";
import { PriorityBadge, DifficultyBadge } from "@/components/interview/CoreJavaBadges";
import { hasCoreJavaVisualization } from "@/components/interview/CoreJavaVisualizationBlock";
import "@/styles/core-java-interview.css";

function countDifficulty(questions: ReturnType<typeof getAllCoreJavaQuestions>, difficulty: string): number {
  return questions.filter((q) => q.meta.difficulty === difficulty).length;
}

export default function JavaInterviewHub() {
  const navigate = useNavigate();
  const { doneMap } = useCoreJavaUserState();
  const { bookmarkedIds } = useCoreJavaBookmarks();

  const allQuestions = useMemo(() => getAllCoreJavaQuestions(), []);
  const totalQuestions = allQuestions.length;
  const topicCount = getCoreJavaTopicCount();
  const doneCount = allQuestions.filter((q) => doneMap[q.question.id]).length;
  const progressPct = totalQuestions > 0 ? Math.round((doneCount / totalQuestions) * 100) : 0;
  const easyCount = countDifficulty(allQuestions, "easy");
  const mediumCount = countDifficulty(allQuestions, "medium");
  const hardCount = countDifficulty(allQuestions, "hard");
  const bookmarkedCount = bookmarkedIds.length;
  const vizCount = allQuestions.filter((q) => hasCoreJavaVisualization(q.question.id)).length;

  // Most asked: very-high priority, ordered by global index
  const mostAsked = useMemo(
    () =>
      allQuestions
        .filter((q) => q.meta.priority === "very-high")
        .sort((a, b) => a.index - b.index)
        .slice(0, 6),
    [allQuestions]
  );

  // Continue learning: first not-done very-high priority question
  const continueQuestion = useMemo(
    () => allQuestions.find((q) => q.meta.priority === "very-high" && !doneMap[q.question.id]),
    [allQuestions, doneMap]
  );

  // Per-topic progress for roadmap
  const topicStats = useMemo(
    () =>
      coreJavaInterviewTopics.map((topic, i) => {
        const topicQuestions = topic.questions;
        const done = topicQuestions.filter((q) => doneMap[q.id]).length;
        return {
          topic,
          number: i + 1,
          done,
          total: topicQuestions.length,
          pct: topicQuestions.length > 0 ? Math.round((done / topicQuestions.length) * 100) : 0,
        };
      }),
    [doneMap]
  );

  // Reading time estimate: based on word count of answers (200 wpm)
  const totalWords = useMemo(
    () => allQuestions.reduce((sum, q) => sum + (q.question.answer?.split(/\s+/).length ?? 0), 0),
    [allQuestions]
  );
  const fullReadMinutes = Math.max(5, Math.round(totalWords / 200));
  // Quick revision: derived from the high-priority questions' one-line explanations (250 wpm skimming)
  const quickRevisionMinutes = useMemo(() => {
    const words = allQuestions
      .filter((q) => q.meta.priority === "very-high" || q.meta.priority === "high")
      .reduce((sum, q) => sum + (q.question.explanation?.split(/\s+/).length ?? 0), 0);
    return Math.max(10, Math.round(words / 250));
  }, [allQuestions]);

  return (
    <div className="cjh-page min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6 font-mono flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/interview" className="hover:text-primary transition-colors">Interview</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground/80 font-semibold">Java</span>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <header className="cjh-hero relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 md:p-10 mb-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-[10px] font-bold uppercase tracking-widest mb-4 font-mono">
              <Coffee size={12} className="text-primary" />
              <span className="text-muted-foreground">Java Interview Preparation</span>
            </div>
            <h1 className="text-3xl md:text-[42px] font-bold tracking-tight leading-[1.15] mb-4">
              Master Java. Prepare smarter.{" "}
              <span className="text-primary">Crack the interview.</span>
            </h1>
            <p className="text-[15px] md:text-base text-muted-foreground leading-relaxed mb-6 max-w-xl">
              A structured Java interview path covering Core Java, OOP, Collections,
              Multithreading, JVM, Java 8+ and advanced concepts — with visualizations,
              code examples and interview-ready answers.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  continueQuestion
                    ? navigate(getCoreJavaQuestionDetailPath(continueQuestion.question))
                    : navigate("/interview/java/core-java-qa")
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity active:scale-95"
              >
                {progressPct > 0 ? "Continue Learning" : "Start Learning"}
                <ArrowRight size={15} />
              </button>
              <Link
                to="/interview/java/core-java-qa"
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg border border-border/50 bg-card font-semibold text-sm text-foreground hover:bg-muted/60 transition-colors active:scale-95"
              >
                Explore Questions
              </Link>
            </div>
          </div>

          {/* ── Hero stats (derived from data) ───────────────────── */}
          <dl className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 md:mt-10">
            <div className="rounded-xl border border-border/40 bg-background/60 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Questions</dt>
              <dd className="text-2xl font-bold text-foreground">{totalQuestions}+</dd>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/60 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Topics</dt>
              <dd className="text-2xl font-bold text-foreground">{topicCount}</dd>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/60 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Difficulties</dt>
              <dd className="text-sm font-bold text-foreground mt-1.5">
                <span className="text-success">{easyCount} Easy</span> ·{" "}
                <span className="text-warning">{mediumCount} Medium</span> ·{" "}
                <span className="text-destructive">{hardCount} Hard</span>
              </dd>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/60 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">Visual Guides</dt>
              <dd className="text-2xl font-bold text-foreground">{vizCount}</dd>
            </div>
          </dl>
        </header>

        {/* ── Progress card ──────────────────────────────────────── */}
        {doneCount > 0 && (
          <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5 md:p-6 mb-10" aria-label="Your Java interview progress">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Your Java Interview Progress</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label="Progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-primary rounded-full transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-sm font-bold text-primary font-mono">{progressPct}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {doneCount} / {totalQuestions} questions completed
              {bookmarkedCount > 0 && <> · {bookmarkedCount} bookmarked</>}
            </p>
            {continueQuestion && (
              <button
                onClick={() => navigate(getCoreJavaQuestionDetailPath(continueQuestion.question))}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Continue Learning <ArrowRight size={13} />
              </button>
            )}
          </section>
        )}

        {/* ── Learning paths (existing routes preserved) ─────────── */}
        <section className="mb-12" aria-labelledby="learning-paths-heading">
          <h2 id="learning-paths-heading" className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers size={16} className="text-primary" /> Learning Paths
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "core-java-qa", title: "Core Java Q&A", subtitle: `${totalQuestions} interview questions with answers`, icon: <Coffee size={18} />, color: "primary", route: "/interview/java/core-java-qa" },
              { id: "data-structure", title: "Data Structure", subtitle: "DSA patterns used in Java rounds", icon: <Target size={18} />, color: "accent", route: "/interview/java/data-structure" },
              { id: "system-design", title: "System Design", subtitle: "Scalable system thinking", icon: <Layers size={18} />, color: "destructive", route: "/interview/java/system-design" },
              { id: "sql-structure", title: "SQL Questions", subtitle: "Interview SQL concepts & patterns", icon: <Flame size={18} />, color: "info", route: "/interview/java/sql-structure" },
            ].map((path) => (
              <Link
                key={path.id}
                to={path.route}
                className="group rounded-xl border border-border/40 bg-card p-5 hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${
                    path.color === "primary" && "bg-primary/10 border-primary/20 text-primary"
                  } ${path.color === "accent" && "bg-accent/10 border-accent/20 text-accent"} ${
                    path.color === "destructive" && "bg-destructive/10 border-destructive/20 text-destructive"
                  } ${path.color === "info" && "bg-info/10 border-info/20 text-info"}`}
                >
                  {path.icon}
                </div>
                <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{path.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{path.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Roadmap ────────────────────────────────────────────── */}
        <section className="mb-12" aria-labelledby="roadmap-heading">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            <h2 id="roadmap-heading" className="text-lg font-bold flex items-center gap-2">
              <Target size={16} className="text-primary" /> Interview Roadmap
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{topicCount} topics · {totalQuestions} questions</span>
          </div>
          <div className="cjh-roadmap grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topicStats.map(({ topic, number, done, total, pct }) => (
              <Link
                key={topic.id}
                to={`/interview/java/core-java-qa?topic=${topic.id}`}
                className="group rounded-xl border border-border/40 bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="font-mono text-[11px] font-black text-muted-foreground/60 w-6 shrink-0">
                    {String(number).padStart(2, "0")}
                  </span>
                  <span className="text-lg leading-none shrink-0" aria-hidden="true">{topic.icon}</span>
                  <h3 className="text-sm font-bold flex-1 min-w-0 truncate group-hover:text-primary transition-colors">
                    {topic.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label={`${topic.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${pct}%`, background: pct === 100 ? "hsl(var(--success))" : "hsl(var(--primary))" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{done}/{total}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  Explore Questions <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Most Asked ─────────────────────────────────────────── */}
        <section className="mb-12" aria-labelledby="most-asked-heading">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            <h2 id="most-asked-heading" className="text-lg font-bold flex items-center gap-2">
              <Flame size={16} className="text-primary" /> Most Asked Java Questions
            </h2>
            <span className="text-xs text-muted-foreground">High-priority concepts for interviews</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mostAsked.map((entry) => (
              <Link
                key={entry.question.id}
                to={getCoreJavaQuestionDetailPath(entry.question)}
                className="group rounded-xl border border-border/40 bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                    Q{String(entry.index + 1).padStart(2, "0")}
                  </span>
                  {entry.meta.difficulty && <DifficultyBadge difficulty={entry.meta.difficulty} />}
                </div>
                <h3 className="text-sm font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {entry.question.question}
                </h3>
                {entry.meta.priority && <PriorityBadge priority={entry.meta.priority} />}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Quick Revision ─────────────────────────────────────── */}
        <section className="mb-12" aria-labelledby="quick-revision-heading">
          <div className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h2 id="quick-revision-heading" className="text-lg font-bold mb-2 flex items-center gap-2">
                <Timer size={16} className="text-primary" /> Interview Tomorrow?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Revise the most important Java concepts quickly. Start with the highest-priority
                questions, then move through the roadmap.
              </p>
            </div>
            <button
              onClick={() => navigate("/interview/java/core-java-qa?filter=most-asked")}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shrink-0 active:scale-95"
            >
              Start Quick Revision <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* ── Continue learning / stats footer ───────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Study stats">
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={14} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Bookmarks</span>
            </div>
            <p className="text-xl font-bold">{bookmarkedCount}</p>
            <p className="text-[11px] text-muted-foreground">saved questions</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-success" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Completed</span>
            </div>
            <p className="text-xl font-bold">{doneCount}</p>
            <p className="text-[11px] text-muted-foreground">of {totalQuestions} questions</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Timer size={14} className="text-warning" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Full Read</span>
            </div>
            <p className="text-xl font-bold">~{fullReadMinutes} min</p>
            <p className="text-[11px] text-muted-foreground">estimated for all answers</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-destructive" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Quick Revision</span>
            </div>
            <p className="text-xl font-bold">~{quickRevisionMinutes} min</p>
            <p className="text-[11px] text-muted-foreground">high-priority essentials</p>
          </div>
        </section>
      </div>
    </div>
  );
}
