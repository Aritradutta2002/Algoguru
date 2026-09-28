/**
 * Pure derivation layer for the Java Interview Hub (`/interview/java`).
 *
 * Every number shown on the hub is computed here, once, from data the
 * application already owns: the Core Java curriculum (`coreJavaInterviewTopics`),
 * per-question metadata (difficulty / priority) and the progress maps returned
 * by `useCoreJavaUserState` / `useBackendInterviewProgress`. Nothing in this file
 * invents a metric; unknown ids in progress maps are ignored and percentages are
 * clamped so a corrupt value can never render as `NaN` or `>100%`.
 */
import type { InterviewTopic } from "@/data/coreJavaInterviewData";
import {
  JAVA_QUESTION_BASE_PATH,
  getCoreJavaQuestionDetailPath,
  getCoreJavaQuestionMeta,
  type Difficulty,
  type InterviewPriority,
} from "@/data/coreJavaInterviewMetadata";
import type { IndexedCoreJavaQuestion } from "@/lib/coreJavaQuestionIndex";
import { BACKEND_PRACTICE_PATH } from "@/lib/backendQuestionIndex";

/* ────────────────────────────────────────────────────────────────────
   Percent helpers
   ──────────────────────────────────────────────────────────────────── */

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function percentOf(done: number, total: number): number {
  if (!Number.isFinite(done) || total <= 0) return 0;
  return clampPercent((done / total) * 100);
}

/* ────────────────────────────────────────────────────────────────────
   Curriculum
   ──────────────────────────────────────────────────────────────────── */

export type TopicProgressState = "not-started" | "in-progress" | "complete";

export interface TopicQuestionRef {
  id: string;
  title: string;
  /** Deep link to the question detail page. */
  href: string;
  done: boolean;
}

export interface TopicStat {
  id: string;
  /** 1-based position in the curriculum order. */
  number: number;
  title: string;
  description: string;
  questions: TopicQuestionRef[];
  done: number;
  total: number;
  pct: number;
  difficulty: { easy: number; medium: number; hard: number };
  /** Questions whose interview priority is "very-high". */
  mustKnow: number;
  /** Reading-time estimate derived from answer word counts (200 words/min). */
  minutes: number;
  state: TopicProgressState;
  /** Topic-filtered question bank. */
  href: string;
}

/**
 * One-line topic summaries. Written against the questions each topic actually
 * contains (see `src/data/coreJavaQuestions/chunk-*.ts`), not marketing copy.
 */
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  "java-platform": "Platform independence, bytecode, the JDK, JVM and JRE split, and how class loading works.",
  "wrapper-classes": "Wrapper classes and why they exist, autoboxing, and implicit versus explicit casting.",
  strings: "String immutability, the string pool, concatenation cost, and StringBuilder versus StringBuffer.",
  "oop-basics": "Objects and classes, inheritance, constructors, equals and hashCode, and abstract classes versus interfaces.",
  "advanced-oop": "Polymorphism, encapsulation, coupling and cohesion, inner and anonymous classes, and a safe Singleton.",
  modifiers: "Access modifiers and visibility across packages and subclasses, plus final, static and volatile.",
  "conditions-loops": "if and switch behaviour, fall-through and default placement, loop semantics and output puzzles.",
  "exception-handling": "Why exception handling exists, checked versus unchecked exceptions, and try-with-resources.",
  miscellaneous: "Arrays, enums, varargs and asserts, initializer blocks, garbage collection and serialization.",
  collections: "Collection interfaces and implementations, list and set behaviour, and HashMap's internal working.",
  "advanced-collections": "Initial capacity and load factor, fail-fast iterators, and synchronized versus concurrent collections.",
  generics: "Generic classes and methods, type-parameter restrictions, and bounded types with extends and super.",
  multithreading: "Thread lifecycle and synchronization, deadlock, and coordination with join, wait and notify.",
  "functional-streams": "Lambdas and functional interfaces, and stream pipelines from intermediate to terminal operations.",
  "new-features": "The language changes in Java 5, 6, 7 and 8 that come up in interviews.",
};

export function describeTopic(topicId: string): string {
  return TOPIC_DESCRIPTIONS[topicId] ?? "";
}

export function topicHref(topicId: string): string {
  return `${JAVA_QUESTION_BASE_PATH}?topic=${topicId}`;
}

export const MOST_ASKED_HREF = `${JAVA_QUESTION_BASE_PATH}?filter=most-asked`;
export const QUESTION_BANK_PATH = JAVA_QUESTION_BASE_PATH;
export const PRACTICE_PATH = BACKEND_PRACTICE_PATH;
export const ANNOTATIONS_PATH = "/interview/java/spring-boot/annotations";
export const BACKEND_BANK_PATH = "/interview/java/spring-boot/questions";

/** Visible row action; the accessible name adds the topic (see `topicActionName`). */
export function topicActionLabel(stat: TopicStat): string {
  if (stat.state === "complete") return "Review";
  if (stat.state === "in-progress") return "Continue";
  return "Open topic";
}

export function topicActionName(stat: TopicStat): string {
  if (stat.state === "complete") return `Review: ${stat.title}`;
  if (stat.state === "in-progress") return `Continue: ${stat.title}`;
  return `Open topic: ${stat.title}`;
}

export function buildTopicStats(
  topics: InterviewTopic[],
  doneMap: Readonly<Record<string, boolean>>
): TopicStat[] {
  return topics.map((topic, index) => {
    let done = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let mustKnow = 0;
    let words = 0;

    const questions: TopicQuestionRef[] = topic.questions.map((question) => {
      const meta = getCoreJavaQuestionMeta(question.id);
      const isDone = doneMap[question.id] === true;
      if (isDone) done += 1;
      if (meta.difficulty === "easy") easy += 1;
      else if (meta.difficulty === "medium") medium += 1;
      else if (meta.difficulty === "hard") hard += 1;
      if (meta.priority === "very-high") mustKnow += 1;
      words += question.answer?.split(/\s+/).length ?? 0;

      return {
        id: question.id,
        title: question.question,
        href: getCoreJavaQuestionDetailPath(question),
        done: isDone,
      };
    });

    const total = questions.length;
    return {
      id: topic.id,
      number: index + 1,
      title: topic.title,
      description: describeTopic(topic.id),
      questions,
      done,
      total,
      pct: percentOf(done, total),
      difficulty: { easy, medium, hard },
      mustKnow,
      minutes: Math.max(1, Math.round(words / 200)),
      state: total > 0 && done >= total ? "complete" : done > 0 ? "in-progress" : "not-started",
      href: topicHref(topic.id),
    };
  });
}

/* ────────────────────────────────────────────────────────────────────
   What to study next
   ──────────────────────────────────────────────────────────────────── */

export type StudyFocus =
  | { kind: "loading" }
  | {
      kind: "start";
      topic: TopicStat;
      /** Data-grounded explanation of why this topic is the right entry point. */
      reason: string;
      ctaLabel: string;
      ctaHref: string;
    }
  | {
      kind: "continue";
      topic: TopicStat;
      ctaLabel: string;
      ctaHref: string;
      /** Questions left in the current topic. */
      remaining: number;
    }
  | { kind: "complete"; ctaLabel: string; ctaHref: string };

function lastTouchedAt(stat: TopicStat, updatedAtMap: Readonly<Record<string, string>>): string | null {
  let latest: string | null = null;
  for (const question of stat.questions) {
    const stamp = updatedAtMap[question.id];
    if (stamp && (latest === null || stamp > latest)) latest = stamp;
  }
  return latest;
}

export function deriveStudyFocus(
  stats: TopicStat[],
  updatedAtMap: Readonly<Record<string, string>> = {}
): StudyFocus {
  const incomplete = stats.filter((stat) => stat.state !== "complete");
  if (incomplete.length === 0) {
    return { kind: "complete", ctaLabel: "Solve the next problem", ctaHref: PRACTICE_PATH };
  }

  // Most recently studied incomplete topic wins; without timestamps fall back to
  // the first incomplete topic in curriculum order.
  let current = incomplete[0];
  let currentStamp = lastTouchedAt(current, updatedAtMap);
  for (const stat of incomplete.slice(1)) {
    const stamp = lastTouchedAt(stat, updatedAtMap);
    if (stamp && (currentStamp === null || stamp > currentStamp)) {
      current = stat;
      currentStamp = stamp;
    }
  }

  const hasAnyProgress = stats.some((stat) => stat.done > 0);
  const nextQuestion = current.questions.find((question) => !question.done) ?? current.questions[0];
  const ctaHref = nextQuestion?.href ?? current.href;

  if (!hasAnyProgress) {
    const scope = [`${current.total} questions`];
    if (current.mustKnow > 0) scope.push(`${current.mustKnow} must-know`);
    return {
      kind: "start",
      topic: current,
      reason: `Topic ${String(current.number).padStart(2, "0")} of ${String(stats.length).padStart(2, "0")} in the curriculum order, with ${scope.join(" and ")}.`,
      ctaLabel: `Start ${current.title}`,
      ctaHref,
    };
  }

  return {
    kind: "continue",
    topic: current,
    ctaLabel: `Continue ${current.title}`,
    ctaHref,
    remaining: Math.max(0, current.total - current.done),
  };
}

/* ────────────────────────────────────────────────────────────────────
   Four-week study plan (recommended order over the real curriculum)
   ──────────────────────────────────────────────────────────────────── */

export interface StudyWeekDefinition {
  id: string;
  label: string;
  focus: string;
  topicIds: string[];
  outcome: string;
}

export interface StudyPlanWeek extends StudyWeekDefinition {
  topics: TopicStat[];
  done: number;
  total: number;
  pct: number;
  complete: boolean;
  current: boolean;
}

/**
 * Grouping of the 15-topic curriculum into four weeks, in curriculum order.
 * Week totals are always derived from `buildTopicStats`, so they cannot drift
 * from the question bank (see `javaHubData.test.ts`).
 */
export const STUDY_PLAN_WEEKS: StudyWeekDefinition[] = [
  {
    id: "week-1",
    label: "Week 1",
    focus: "Language fundamentals",
    topicIds: ["java-platform", "wrapper-classes", "strings", "oop-basics"],
    outcome:
      "You can explain the platform and the object model, and answer the String, equals and hashCode questions that open most Java rounds.",
  },
  {
    id: "week-2",
    label: "Week 2",
    focus: "Object model and control flow",
    topicIds: ["advanced-oop", "modifiers", "conditions-loops", "exception-handling"],
    outcome:
      "You can reason about polymorphism, modifier visibility and control-flow rules, and handle exception handling under follow-up pressure.",
  },
  {
    id: "week-3",
    label: "Week 3",
    focus: "Everyday APIs and collections",
    topicIds: ["miscellaneous", "collections"],
    outcome:
      "You can pick the right collection with a complexity argument and answer the array, enum, GC and serialization questions that come with it.",
  },
  {
    id: "week-4",
    label: "Week 4",
    focus: "Advanced collections, concurrency and modern Java",
    topicIds: ["advanced-collections", "generics", "multithreading", "functional-streams", "new-features"],
    outcome:
      "You can defend concurrent-collection choices, explain generics bounds and erasure, and talk through threads, lambdas and streams.",
  },
];

export function buildStudyPlan(stats: TopicStat[]): StudyPlanWeek[] {
  const byId = new Map(stats.map((stat) => [stat.id, stat]));
  const weeks = STUDY_PLAN_WEEKS.map((week) => {
    const topics = week.topicIds
      .map((id) => byId.get(id))
      .filter((stat): stat is TopicStat => stat !== undefined);
    const done = topics.reduce((sum, stat) => sum + stat.done, 0);
    const total = topics.reduce((sum, stat) => sum + stat.total, 0);
    return {
      ...week,
      topics,
      done,
      total,
      pct: percentOf(done, total),
      complete: total > 0 && done >= total,
      current: false,
    };
  });

  const currentWeek = weeks.find((week) => !week.complete);
  if (currentWeek) currentWeek.current = true;
  return weeks;
}

/* ────────────────────────────────────────────────────────────────────
   Preparation summary
   ──────────────────────────────────────────────────────────────────── */

export interface PreparationSummary {
  studiedQuestions: number;
  totalQuestions: number;
  overallPct: number;
  completedTopics: number;
  totalTopics: number;
  practiceSolved: number;
  practiceTotal: number;
}

export function buildPreparationSummary(
  stats: TopicStat[],
  practiceSolved: number,
  practiceTotal: number
): PreparationSummary {
  const totalQuestions = stats.reduce((sum, stat) => sum + stat.total, 0);
  const studiedQuestions = stats.reduce((sum, stat) => sum + stat.done, 0);
  return {
    studiedQuestions,
    totalQuestions,
    overallPct: percentOf(studiedQuestions, totalQuestions),
    completedTopics: stats.filter((stat) => stat.state === "complete").length,
    totalTopics: stats.length,
    practiceSolved: Number.isFinite(practiceSolved) ? Math.max(0, Math.round(practiceSolved)) : 0,
    practiceTotal: Number.isFinite(practiceTotal) ? Math.max(0, Math.round(practiceTotal)) : 0,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Most-asked questions (interview priority order)
   ──────────────────────────────────────────────────────────────────── */

export interface HotQuestion {
  id: string;
  /** 1-based position in the flat question list. */
  number: number;
  title: string;
  topicTitle: string;
  href: string;
  difficulty?: Difficulty;
  mustKnow: boolean;
}

const PRIORITY_RANK: Record<InterviewPriority, number> = {
  "very-high": 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function pickMostAsked(
  entries: IndexedCoreJavaQuestion[],
  limit = 6
): HotQuestion[] {
  return [...entries]
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.meta.priority ?? "low"] - PRIORITY_RANK[b.meta.priority ?? "low"] ||
        a.index - b.index
    )
    .slice(0, limit)
    .map((entry) => ({
      id: entry.question.id,
      number: entry.index + 1,
      title: entry.question.question,
      topicTitle: entry.topic.title,
      href: getCoreJavaQuestionDetailPath(entry.question),
      difficulty: entry.meta.difficulty,
      mustKnow: entry.meta.priority === "very-high",
    }));
}
