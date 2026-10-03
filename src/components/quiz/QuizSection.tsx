import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  Maximize2,
  Shield,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";

function openQuizFullscreen() {
  // Fullscreen needs a user gesture; direct page visits enter it on Start quiz.
  if (document.documentElement.requestFullscreen) {
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}

export function QuizSection() {
  return (
    <section
      id="quiz"
      className="relative overflow-hidden border-y border-border/60 bg-muted/30"
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--primary)/0.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,hsl(var(--primary)/0.08),transparent_40%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1.2fr_1fr] lg:px-16">
        {/* ── Left: CTA ── */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Shuffle size={14} />
            Quiz Studio
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Think fast.
            <br />
            <span className="text-primary">Know where you stand.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            A fresh set of random MCQs in a strict, exam-grade environment.
            Fullscreen lockdown, focus monitoring, and automatic scoring.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { id: "java", label: "Java" },
              { id: "cpp", label: "C++" },
              { id: "python", label: "Python" },
            ].map((item) => (
              <Link
                key={item.id}
                to={`/quiz?language=${item.id}`}
                onClick={openQuizFullscreen}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Code2 size={14} />
                {item.label}
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
          <Link
            to="/quiz"
            onClick={openQuizFullscreen}
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Open Quiz Studio
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* ── Right: Feature card ── */}
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-6 py-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} className="text-primary" />
              Exam-Grade Challenge
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              MCQ
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              {[
                {
                  icon: Shuffle,
                  title: "Random questions, real answers",
                  text: `${MCQ_QUESTIONS.length} curated questions with shuffled choices and automatic scoring.`,
                },
                {
                  icon: Clock3,
                  title: "Your pace or against the clock",
                  text: "Choose relaxed practice or a timed challenge with automatic submission.",
                },
                {
                  icon: Maximize2,
                  title: "Mandatory fullscreen lockdown",
                  text: "Exam-style fullscreen with tab-switching detection and focus monitoring.",
                },
                {
                  icon: Shield,
                  title: "Strict 3-warning policy",
                  text: "Exit fullscreen, switch tabs, or lose focus — 3 warnings, then auto-submit.",
                  highlight: true,
                },
                {
                  icon: CheckCircle2,
                  title: "Learn from every attempt",
                  text: "Review your score, correct answers, and explanations after each quiz.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      item.highlight
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <item.icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Exam rules mini-banner */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <AlertTriangle size={16} className="shrink-0 text-amber-500" />
              <p className="text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Strict exam mode:</span>{" "}
                3 warnings before auto-submission. Timer never pauses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
