"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <Card className="cjh-continue shadow-none">
        <p className="cjh-eyebrow">Your next topic</p>
        <p className="cjh-continue-loading">Loading your study progress…</p>
      </Card>
    );
  }

  if (focus.kind === "complete") {
    return (
      <Card className="cjh-continue shadow-none">
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
          <Button asChild className="cjh-btn-primary">
            <Link href={focus.ctaHref}>
              {focus.ctaLabel}
              <ArrowRight size={15} />
            </Link>
          </Button>
          <Link href={MOST_ASKED_HREF} className="cjh-link">
            Review must-know questions
          </Link>
        </div>
      </Card>
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
    <Card className="cjh-continue shadow-none">
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
        <Button asChild className="cjh-btn-primary">
          <Link href={focus.ctaHref}>
            {focus.ctaLabel}
            <ArrowRight size={15} />
          </Link>
        </Button>
        <Link href={topic.href} className="cjh-link">
          Open topic
        </Link>
      </div>
    </Card>
  );
}
