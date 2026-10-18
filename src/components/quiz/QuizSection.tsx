import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Code2,
  Maximize2,
  Shield,
  Shuffle,
} from "lucide-react";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";

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
];

const SPEC = [
  {
    key: "Questions",
    title: `${MCQ_QUESTIONS.length} curated questions`,
    detail: "Shuffled choices, automatic scoring, no repeats within a run.",
  },
  {
    key: "Pacing",
    title: "Your pace or against the clock",
    detail: "Relaxed practice, or a timed challenge that submits itself when time runs out.",
  },
  {
    key: "Environment",
    title: "Mandatory fullscreen lockdown",
    detail: "Exam-style fullscreen with tab-switching detection and focus monitoring.",
  },
  {
    key: "Integrity",
    title: "Strict 3-warning policy",
    detail: "Exit fullscreen, switch tabs or lose focus three times and the attempt is submitted.",
  },
  {
    key: "Review",
    title: "Learn from every attempt",
    detail: "Your score, the correct answers and a written explanation for every question.",
  },
];

export function QuizSection() {
  return (
    <section id="quiz" className="lp-band lp-quiz">
      <div className="lp-shell lp-quiz-grid">
        {/* ── Left: the pitch ── */}
        <div>
          <span className="lp-kicker">
            <Shuffle size={12} />
            Contest · MCQ Quiz
          </span>

          <h2 className="lp-quiz-title">
            Think fast.
            <br />
            Know <span className="lp-serif">where you stand.</span>
          </h2>

          <p className="lp-quiz-copy">
            A random set of MCQs in a real exam environment — fullscreen lockdown, focus
            monitoring and automatic scoring. It is the closest thing to the pressure of the
            round itself.
          </p>

          <div className="lp-lang-row">
            {LANGUAGES.map((item) => (
              <Link
                key={item.id}
                to={`/contest/quiz?language=${item.id}`}
                onClick={openQuizFullscreen}
                className="lp-lang"
              >
                <Code2 size={12} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="lp-quiz-actions">
            <Link
              to="/contest"
              onClick={openQuizFullscreen}
              className="lp-btn lp-btn--solid"
            >
              Open Contest
              <ArrowRight size={17} data-shift="true" />
            </Link>
            <span className="lp-quiz-aside">
              <Check size={12} strokeWidth={3} />
              Scored instantly
            </span>
          </div>
        </div>

        {/* ── Right: the exam spec sheet ── */}
        <div className="lp-spec">
          <div className="lp-spec-head">
            <span>
              Exam spec — <b>MCQ mode</b>
            </span>
            <span>3 languages</span>
          </div>

          {SPEC.map((row) => (
            <div key={row.key} className="lp-spec-row">
              <span className="lp-spec-key">{row.key}</span>
              <span className="lp-spec-val">
                {row.title}
                <small>{row.detail}</small>
              </span>
            </div>
          ))}

          <p className="lp-spec-warn">
            <AlertTriangle size={14} />
            <span>
              <b>Strict exam mode:</b> three warnings before auto-submission. The timer never
              pauses.
            </span>
          </p>

          <div className="lp-spec-icons" aria-hidden="true">
            <Maximize2 size={13} />
            <Shield size={13} />
          </div>
        </div>
      </div>
    </section>
  );
}
