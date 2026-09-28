import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MOST_ASKED_HREF, type StudyFocus } from "./javaHubData";

interface ContinueLearningCardProps {
  focus: StudyFocus;
}

/**
 * The single featured surface on the hub: one topic, its real progress and the
 * one action that moves the learner forward.
 */
export function ContinueLearningCard({ focus }: ContinueLearningCardProps) {
  if (focus.kind === "loading") {
    return (
      <div className="cjh-continue">
        <p className="cjh-eyebrow">Your next topic</p>
        <p className="cjh-continue-loading">Loading your study progress…</p>
      </div>
    );
  }

  if (focus.kind === "complete") {
    return (
      <div className="cjh-continue">
        <p className="cjh-eyebrow">
          <CheckCircle2 size={14} aria-hidden="true" />
          Curriculum complete
        </p>
        <h3 className="cjh-continue-title">Every question has been studied</h3>
        <p className="cjh-continue-desc">
          Keep the material warm with practice problems, or run through the must-know questions
          before your interview.
        </p>
        <div className="cjh-continue-actions">
          <Link to={focus.ctaHref} className="cjh-btn-primary">
            {focus.ctaLabel}
            <ArrowRight size={15} />
          </Link>
          <Link to={MOST_ASKED_HREF} className="cjh-link">
            Review must-know questions
          </Link>
        </div>
      </div>
    );
  }

  const topic = focus.topic;
  const note =
    focus.kind === "start"
      ? focus.reason
      : focus.remaining > 0
        ? `${focus.remaining} ${focus.remaining === 1 ? "question" : "questions"} left in this topic`
        : null;

  return (
    <div className="cjh-continue">
      <p className="cjh-eyebrow">{focus.kind === "start" ? "Recommended starting topic" : "Current topic"}</p>
      <h3 className="cjh-continue-title">{topic.title}</h3>
      <p className="cjh-continue-desc">{topic.description}</p>
      {note && <p className="cjh-continue-note">{note}</p>}
      <div className="cjh-continue-progress">
        <Progress
          value={topic.pct}
          className="h-1.5"
          aria-label={`${topic.title}: ${topic.done} of ${topic.total} questions studied`}
        />
        <p className="cjh-continue-count">
          <span className="cjh-num">
            {topic.done} of {topic.total}
          </span>{" "}
          questions studied
        </p>
      </div>
      <div className="cjh-continue-actions">
        <Link to={focus.ctaHref} className="cjh-btn-primary">
          {focus.ctaLabel}
          <ArrowRight size={15} />
        </Link>
        <Link to={topic.href} className="cjh-link">
          Open topic
        </Link>
      </div>
    </div>
  );
}
