import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Maximize2,
  Shield,
  Shuffle,
} from "lucide-react";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";
import { Reveal } from "@/components/motion/Reveal";

function openQuizFullscreen() {
  // Fullscreen needs a user gesture; direct page visits enter it on Start quiz.
  if (document.documentElement.requestFullscreen) {
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}

const LANGUAGES = [
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "python", label: "Python" },
] as const;

export function QuizSection() {
  const rules = [
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
      text: "Exam-style fullscreen with tab-switch detection and focus monitoring.",
    },
    {
      icon: Shield,
      title: "Strict 3-warning policy",
      text: "Leaving fullscreen, switching tabs or losing focus counts as a warning. The third one submits the quiz.",
      highlight: true,
    },
    {
      icon: CheckCircle2,
      title: "Learn from every attempt",
      text: "Review your score, the correct answers and explanations after each quiz.",
    },
  ];

  return (
    <section id="quiz" aria-labelledby="quiz-heading" className="lp-section">
      <div className="lp-container lp-split lp-split--even">
        <Reveal>
          <p className="lp-kicker">Contest · MCQ Quiz</p>
          <h2 id="quiz-heading" className="lp-h2 mt-3">
            Find out where you stand under exam conditions.
          </h2>
          <p className="lp-lead mt-4 max-w-lg">
            A fresh set of random multiple-choice questions in a strict exam
            environment, with fullscreen lockdown, focus monitoring and automatic
            scoring.
          </p>

          <div className="mt-8">
            <p className="text-[13px] text-muted-foreground">Start a quiz in</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGUAGES.map((item) => (
                <Link
                  key={item.id}
                  to={`/contest/quiz?language=${item.id}`}
                  onClick={openQuizFullscreen}
                  className="lp-btn lp-btn-secondary min-h-9 px-3.5 text-[13px]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            to="/contest"
            onClick={openQuizFullscreen}
            className="lp-btn landing-primary group mt-8"
          >
            Open Contest
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane">
            <div className="flex items-center justify-between border-b border-obsidian-border px-6 py-4">
              <p className="text-[14px] font-medium text-foreground">Exam rules</p>
              <span className="lp-chip">MCQ</span>
            </div>
            <ul className="lp-list">
              {rules.map((item) => (
                <li key={item.title} className="flex items-start gap-4 px-6 py-5">
                  <item.icon
                    size={17}
                    aria-hidden="true"
                    className={
                      item.highlight
                        ? "mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                        : "mt-0.5 shrink-0 text-muted-foreground"
                    }
                  />
                  <div>
                    <h3 className="text-[14.5px] text-foreground">{item.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
