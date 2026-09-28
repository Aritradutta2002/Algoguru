import { describe, expect, it } from "vitest";
import { coreJavaInterviewTopics } from "@/data/coreJavaInterviewData";
import { getAllCoreJavaQuestions } from "@/lib/coreJavaQuestionIndex";
import { BACKEND_PRACTICE_PATH } from "@/lib/backendQuestionIndex";
import {
  STUDY_PLAN_WEEKS,
  buildPreparationSummary,
  buildStudyPlan,
  buildTopicStats,
  clampPercent,
  deriveStudyFocus,
  percentOf,
  pickMostAsked,
  topicActionLabel,
  topicActionName,
} from "./javaHubData";

const emptyDone: Record<string, boolean> = {};

describe("percent helpers", () => {
  it("clamps and rounds instead of leaking NaN or out-of-range values", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(41.6)).toBe(42);
  });

  it("treats an empty denominator as zero progress", () => {
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(1, 4)).toBe(25);
  });
});

describe("buildTopicStats", () => {
  it("derives one stat per curriculum topic in order with real totals", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, emptyDone);
    expect(stats).toHaveLength(coreJavaInterviewTopics.length);
    stats.forEach((stat, index) => {
      expect(stat.number).toBe(index + 1);
      expect(stat.id).toBe(coreJavaInterviewTopics[index].id);
      expect(stat.total).toBe(coreJavaInterviewTopics[index].questions.length);
      expect(stat.total).toBeGreaterThan(0);
      expect(stat.description.length).toBeGreaterThan(0);
    });
    const totalQuestions = stats.reduce((sum, stat) => sum + stat.total, 0);
    expect(totalQuestions).toBe(getAllCoreJavaQuestions().length);
  });

  it("classifies topics as not-started, in-progress and complete", () => {
    const [first, second] = coreJavaInterviewTopics;
    const doneMap = {
      [first.questions[0].id]: true,
      ...Object.fromEntries(second.questions.map((question) => [question.id, true])),
    };
    const stats = buildTopicStats(coreJavaInterviewTopics, doneMap);
    expect(stats[0].state).toBe("in-progress");
    expect(stats[0].done).toBe(1);
    expect(stats[1].state).toBe("complete");
    expect(stats[1].pct).toBe(100);
    expect(stats[2].state).toBe("not-started");
    expect(stats[2].pct).toBe(0);
  });

  it("ignores unknown ids in the progress map", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, { "not-a-question": true });
    expect(stats.every((stat) => stat.done === 0 && stat.pct === 0)).toBe(true);
  });
});

describe("deriveStudyFocus", () => {
  it("starts a new learner at the first curriculum topic", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, emptyDone);
    const focus = deriveStudyFocus(stats);
    expect(focus.kind).toBe("start");
    if (focus.kind !== "start") return;
    expect(focus.topic.id).toBe(coreJavaInterviewTopics[0].id);
    expect(focus.ctaLabel).toBe(`Start ${coreJavaInterviewTopics[0].title}`);
    expect(focus.reason).toContain("01");
  });

  it("continues the most recently touched incomplete topic", () => {
    const [first, , third] = coreJavaInterviewTopics;
    const stats = buildTopicStats(coreJavaInterviewTopics, {
      [first.questions[0].id]: true,
    });
    const focus = deriveStudyFocus(stats, {
      [third.questions[0].id]: "2026-01-01T00:00:00.000Z",
    });
    expect(focus.kind).toBe("continue");
    if (focus.kind !== "continue") return;
    expect(focus.topic.id).toBe(third.id);
    expect(focus.ctaLabel).toBe(`Continue ${third.title}`);
    expect(focus.remaining).toBe(third.questions.length);
  });

  it("falls back to the first incomplete topic without timestamps", () => {
    const [first] = coreJavaInterviewTopics;
    const stats = buildTopicStats(coreJavaInterviewTopics, {
      [first.questions[0].id]: true,
    });
    const focus = deriveStudyFocus(stats, {});
    expect(focus.kind).toBe("continue");
    if (focus.kind !== "continue") return;
    expect(focus.topic.id).toBe(first.id);
    expect(focus.remaining).toBe(first.questions.length - 1);
  });

  it("points a finished curriculum at the practice route", () => {
    const doneMap = Object.fromEntries(
      coreJavaInterviewTopics.flatMap((topic) => topic.questions.map((question) => [question.id, true]))
    );
    const stats = buildTopicStats(coreJavaInterviewTopics, doneMap);
    const focus = deriveStudyFocus(stats);
    expect(focus.kind).toBe("complete");
    if (focus.kind !== "complete") return;
    expect(focus.ctaHref).toBe(BACKEND_PRACTICE_PATH);
    expect(focus.ctaLabel).toBe("Solve the next problem");
  });
});

describe("buildStudyPlan", () => {
  it("covers every topic exactly once and keeps question totals honest", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, emptyDone);
    const weeks = buildStudyPlan(stats);
    const covered = weeks.flatMap((week) => week.topicIds);
    expect(new Set(covered).size).toBe(covered.length);
    expect(new Set(covered)).toEqual(new Set(stats.map((stat) => stat.id)));
    const grandTotal = weeks.reduce((sum, week) => sum + week.total, 0);
    expect(grandTotal).toBe(stats.reduce((sum, stat) => sum + stat.total, 0));
    weeks.forEach((week) => {
      expect(week.outcome.length).toBeGreaterThan(0);
      expect(week.done).toBeLessThanOrEqual(week.total);
    });
  });

  it("marks the first incomplete week as current and none when finished", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, emptyDone);
    const weeks = buildStudyPlan(stats);
    expect(weeks[0].current).toBe(true);
    expect(weeks.filter((week) => week.current)).toHaveLength(1);

    const doneMap = Object.fromEntries(
      coreJavaInterviewTopics.flatMap((topic) => topic.questions.map((question) => [question.id, true]))
    );
    const finished = buildStudyPlan(buildTopicStats(coreJavaInterviewTopics, doneMap));
    expect(finished.every((week) => week.complete)).toBe(true);
    expect(finished.some((week) => week.current)).toBe(false);
  });

  it("defines four weeks", () => {
    expect(STUDY_PLAN_WEEKS).toHaveLength(4);
  });
});

describe("buildPreparationSummary", () => {
  it("sums real question and topic progress", () => {
    const [first] = coreJavaInterviewTopics;
    const doneMap = { [first.questions[0].id]: true };
    const stats = buildTopicStats(coreJavaInterviewTopics, doneMap);
    const summary = buildPreparationSummary(stats, 3, 12);
    expect(summary.studiedQuestions).toBe(1);
    expect(summary.totalQuestions).toBe(getAllCoreJavaQuestions().length);
    expect(summary.totalTopics).toBe(coreJavaInterviewTopics.length);
    expect(summary.completedTopics).toBe(0);
    expect(summary.practiceSolved).toBe(3);
    expect(summary.practiceTotal).toBe(12);
    expect(summary.overallPct).toBe(percentOf(1, summary.totalQuestions));
  });
});

describe("pickMostAsked", () => {
  it("orders by interview priority and respects the limit", () => {
    const hot = pickMostAsked(getAllCoreJavaQuestions(), 6);
    expect(hot).toHaveLength(6);
    expect(hot.every((question) => question.mustKnow)).toBe(true);
    expect(hot[0].href.startsWith("/interview/java/core-java-qa/")).toBe(true);
    expect(pickMostAsked(getAllCoreJavaQuestions(), 3)).toHaveLength(3);
  });
});

describe("topic actions", () => {
  it("uses contextual labels that keep the visible text in the accessible name", () => {
    const stats = buildTopicStats(coreJavaInterviewTopics, emptyDone);
    expect(topicActionLabel(stats[0])).toBe("Open topic");
    expect(topicActionName(stats[0])).toBe(`Open topic: ${stats[0].title}`);
    expect(topicActionName(stats[0]).includes(topicActionLabel(stats[0]))).toBe(true);

    const inProgress = buildTopicStats(coreJavaInterviewTopics, {
      [coreJavaInterviewTopics[0].questions[0].id]: true,
    })[0];
    expect(topicActionLabel(inProgress)).toBe("Continue");
    expect(topicActionName(inProgress)).toBe(`Continue: ${inProgress.title}`);

    const complete = buildTopicStats(
      coreJavaInterviewTopics,
      Object.fromEntries(coreJavaInterviewTopics[0].questions.map((question) => [question.id, true]))
    )[0];
    expect(topicActionLabel(complete)).toBe("Review");
    expect(topicActionName(complete)).toBe(`Review: ${complete.title}`);
  });
});
