/**
 * Quiz bank — a single normalised view over the three language interview banks.
 *
 * The landing page "Take a Quiz" section lets a learner pick a language
 * (Java / C++ / Python) and a difficulty (easy / medium / hard); we then hand
 * back a random, non-repeating set of `QUIZ_LENGTH` questions from that slice.
 *
 * Sources (already indexed, deduplicated and slugged by their own modules):
 *   - `coreJavaQuestionIndex`  → /interview/java/core-java-qa
 *   - `cppQuestionIndex`       → /interview/cpp/language-questions
 *   - `pythonQuestionIndex`    → /interview/python/language-questions
 *
 * Every entry carries a `detailPath` so the player can deep-link a question
 * back into the full reading view when the learner wants more than the gist.
 */
import { coreJavaQuestionIndex } from "@/lib/coreJavaQuestionIndex";
import { cppQuestionIndex } from "@/lib/cppQuestionIndex";
import { pythonQuestionIndex } from "@/lib/pythonQuestionIndex";
import { JAVA_QUESTION_BASE_PATH } from "@/data/coreJavaInterviewMetadata";
import { CPP_QUESTION_BASE_PATH } from "@/data/cppInterviewMetadata";
import { PYTHON_QUESTION_BASE_PATH } from "@/data/pythonInterviewMetadata";
import type { Difficulty } from "@/data/coreJavaInterviewMetadata";

/* ─── Public vocabulary ─────────────────────────────────────────────── */

export type QuizLanguage = "java" | "cpp" | "python";
export type QuizDifficulty = Difficulty;

export const QUIZ_LANGUAGES: QuizLanguage[] = ["java", "cpp", "python"];
export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];

/** Questions served per quiz run. */
export const QUIZ_LENGTH = 10;

/** Seconds allowed per question before it is auto-marked as missed. */
export const QUIZ_SECONDS_PER_QUESTION = 60;

/**
 * When the requested difficulty does not have `QUIZ_LENGTH` questions we top
 * the run up from the nearest difficulties, in this order, so a quiz is always
 * exactly `QUIZ_LENGTH` questions long. `hard` is intentionally absent from the
 * `easy` ladder and vice versa — we never quietly hand a "hard" quiz of basics.
 */
const FALLBACK_LADDER: Record<QuizDifficulty, QuizDifficulty[]> = {
  easy: ["easy", "medium"],
  medium: ["medium", "easy", "hard"],
  hard: ["hard", "medium"],
};

export interface QuizLanguageMeta {
  id: QuizLanguage;
  label: string;
  /** Short blurb shown on the language card. */
  blurb: string;
  /** Per-difficulty question availability. */
  counts: Record<QuizDifficulty, number>;
  total: number;
  /** Deep link into the language's question bank. */
  bankPath: string;
}

export interface QuizDifficultyMeta {
  id: QuizDifficulty;
  label: string;
  blurb: string;
  /** Questions available at this difficulty for the selected language (0 if none). */
  count: number;
  /** True when the pool is too small to fill a full-length run unaided. */
  topUpNeeded: boolean;
}

export interface QuizQuestion {
  /** Namespaced so ids never collide across the three banks. */
  id: string;
  language: QuizLanguage;
  difficulty: QuizDifficulty;
  question: string;
  answer: string;
  explanation: string;
  code?: string;
  codeLanguage?: string;
  topic: string;
  topicIcon: string;
  tags: string[];
  priority?: string;
  detailPath: string;
}

export interface QuizRun {
  questions: QuizQuestion[];
  language: QuizLanguage;
  /** The difficulty the learner asked for. */
  requestedDifficulty: QuizDifficulty;
  /**
   * True when the whole run came from the requested difficulty. When false the
   * run was topped up from `FALLBACK_LADDER` and the UI should say so.
   */
  exactMatch: boolean;
  /** How many questions matched the requested difficulty. */
  exactCount: number;
  /** Per-difficulty composition of this run, in the order they were picked. */
  mix: Array<{ difficulty: QuizDifficulty; count: number }>;
}

/* ─── Accent colours (per language / difficulty) ────────────────────── */

const LANGUAGE_ACCENTS: Record<QuizLanguage, string> = {
  java: "#F59E0B",
  cpp: "#60A5FA",
  python: "#38BDF8",
};

const DIFFICULTY_ACCENTS: Record<QuizDifficulty, string> = {
  easy: "#4ADE80",
  medium: "#FBBF24",
  hard: "#F87171",
};

export function getQuizLanguageAccent(language: QuizLanguage): string {
  return LANGUAGE_ACCENTS[language];
}

export function getQuizDifficultyAccent(difficulty: QuizDifficulty): string {
  return DIFFICULTY_ACCENTS[difficulty];
}

/* ─── Normalised pool ───────────────────────────────────────────────── */

const DEFAULT_DIFFICULTY: QuizDifficulty = "medium";

/** Accepts the union of difficulty types across the three banks. */
function toDifficulty(value: string | undefined): QuizDifficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : DEFAULT_DIFFICULTY;
}

const QUESTION_BANKS: Record<QuizLanguage, QuizQuestion[]> = {
  java: coreJavaQuestionIndex.map((entry) => ({
    id: `java:${entry.question.id}`,
    language: "java" as const,
    difficulty: toDifficulty(entry.meta.difficulty),
    question: entry.question.question,
    answer: entry.question.answer,
    explanation: entry.question.explanation,
    code: entry.question.code,
    codeLanguage: entry.question.codeLanguage ?? "java",
    topic: entry.topic.title,
    topicIcon: entry.topic.icon,
    tags: entry.meta.tags ?? [],
    priority: entry.meta.priority,
    detailPath: `${JAVA_QUESTION_BASE_PATH}/${entry.slug}`,
  })),
  cpp: cppQuestionIndex.map((entry) => ({
    id: `cpp:${entry.question.id}`,
    language: "cpp" as const,
    difficulty: toDifficulty(entry.meta.difficulty),
    question: entry.question.question,
    answer: entry.question.answer,
    explanation: entry.question.explanation,
    code: entry.question.code,
    codeLanguage: entry.question.codeLanguage ?? "cpp",
    topic: entry.topic.title,
    topicIcon: entry.topic.icon,
    tags: entry.meta.tags ?? [],
    priority: entry.meta.priority,
    detailPath: `${CPP_QUESTION_BASE_PATH}/${entry.slug}`,
  })),
  python: pythonQuestionIndex.map((entry) => ({
    id: `python:${entry.question.id}`,
    language: "python" as const,
    difficulty: toDifficulty(entry.meta.difficulty),
    question: entry.question.question,
    answer: entry.question.answer,
    explanation: entry.question.explanation,
    code: entry.question.code,
    codeLanguage: entry.question.codeLanguage ?? "python",
    topic: entry.topic.title,
    topicIcon: entry.topic.icon,
    tags: entry.meta.tags ?? [],
    priority: entry.meta.priority,
    detailPath: `${PYTHON_QUESTION_BASE_PATH}/${entry.slug}`,
  })),
};

const LABELLED: Record<QuizLanguage, { label: string; blurb: string; bankPath: string }> = {
  java: { label: "Java", blurb: "JVM, collections, concurrency & modern Java", bankPath: JAVA_QUESTION_BASE_PATH },
  cpp: { label: "C++", blurb: "Memory, RAII, templates & the STL", bankPath: CPP_QUESTION_BASE_PATH },
  python: {
    label: "Python",
    blurb: "OOP, generators, decorators & concurrency",
    bankPath: PYTHON_QUESTION_BASE_PATH,
  },
};

const DIFFICULTY_LABELLED: Record<QuizDifficulty, { label: string; blurb: string }> = {
  easy: { label: "Easy", blurb: "Warm-up on fundamentals" },
  medium: { label: "Medium", blurb: "The questions that actually screen you" },
  hard: { label: "Hard", blurb: "Deep internals and edge cases" },
};

/* ─── Availability ──────────────────────────────────────────────────── */

function countByDifficulty(questions: QuizQuestion[]): Record<QuizDifficulty, number> {
  const counts: Record<QuizDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const question of questions) counts[question.difficulty] += 1;
  return counts;
}

export const QUIZ_TOTAL_QUESTIONS = QUIZ_LANGUAGES.reduce(
  (total, language) => total + QUESTION_BANKS[language].length,
  0,
);

/** How many questions exist for a language, split by difficulty. */
export function getQuizLanguageCounts(language: QuizLanguage): Record<QuizDifficulty, number> {
  return countByDifficulty(QUESTION_BANKS[language]);
}

/** How many questions exist for a difficulty, split by language. */
export function getQuizDifficultyCounts(difficulty: QuizDifficulty): Record<QuizLanguage, number> {
  const counts: Record<QuizLanguage, number> = { java: 0, cpp: 0, python: 0 };
  for (const language of QUIZ_LANGUAGES) {
    counts[language] = QUESTION_BANKS[language].filter((q) => q.difficulty === difficulty).length;
  }
  return counts;
}

/** Metadata for the three language cards, including live counts. */
export function getQuizLanguages(): QuizLanguageMeta[] {
  return QUIZ_LANGUAGES.map((id) => {
    const counts = getQuizLanguageCounts(id);
    return {
      id,
      label: LABELLED[id].label,
      blurb: LABELLED[id].blurb,
      counts,
      total: counts.easy + counts.medium + counts.hard,
      bankPath: LABELLED[id].bankPath,
    };
  });
}

/** Metadata for the three difficulty options, scoped to the chosen language. */
export function getQuizDifficulties(
  language: QuizLanguage | null,
  size: number = QUIZ_LENGTH,
): QuizDifficultyMeta[] {
  const counts = language ? getQuizLanguageCounts(language) : null;
  return QUIZ_DIFFICULTIES.map((id) => {
    const count = counts?.[id] ?? 0;
    return {
      id,
      label: DIFFICULTY_LABELLED[id].label,
      blurb: DIFFICULTY_LABELLED[id].blurb,
      count,
      topUpNeeded: count > 0 && count < size,
    };
  });
}

/* ─── Sampling ──────────────────────────────────────────────────────── */

/** Fisher–Yates using an injectable RNG so runs are testable. */
export function shuffleQuestions<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i];
    result[i] = result[j];
    result[j] = a;
  }
  return result;
}

/**
 * Build a random quiz run.
 *
 * Questions of the requested difficulty are drawn first; if there are not
 * enough, the run is topped up from the fallback ladder so the learner always
 * gets a full-length quiz. `exactMatch` / `exactCount` / `mix` let the UI stay
 * honest about what was actually served.
 */
export function buildQuizRun(
  language: QuizLanguage,
  difficulty: QuizDifficulty,
  size: number = QUIZ_LENGTH,
  random: () => number = Math.random,
): QuizRun {
  const bank = QUESTION_BANKS[language];
  const ladder = FALLBACK_LADDER[difficulty];
  const picked: QuizQuestion[] = [];
  const usedIds = new Set<string>();

  for (const level of ladder) {
    if (picked.length >= size) break;
    const candidates = shuffleQuestions(
      bank.filter((question) => question.difficulty === level && !usedIds.has(question.id)),
      random,
    );
    for (const candidate of candidates) {
      if (picked.length >= size) break;
      usedIds.add(candidate.id);
      picked.push(candidate);
    }
  }

  // Shuffle the assembled run so topped-up questions are not clustered at the end.
  const questions = shuffleQuestions(picked, random);
  const exactCount = questions.filter((question) => question.difficulty === difficulty).length;

  const mixMap = new Map<QuizDifficulty, number>();
  for (const question of questions) {
    mixMap.set(question.difficulty, (mixMap.get(question.difficulty) ?? 0) + 1);
  }
  const mix = QUIZ_DIFFICULTIES.filter((level) => mixMap.has(level)).map((level) => ({
    difficulty: level,
    count: mixMap.get(level) ?? 0,
  }));

  return {
    questions,
    language,
    requestedDifficulty: difficulty,
    exactMatch: exactCount === questions.length && questions.length > 0,
    exactCount,
    mix,
  };
}

export { LABELLED as QUIZ_LANGUAGE_LABELLED, DIFFICULTY_LABELLED as QUIZ_DIFFICULTY_LABELLED };
