import { describe, it, expect } from "vitest";
import {
  buildQuizRun,
  getQuizDifficulties,
  getQuizLanguageCounts,
  getQuizLanguages,
  QUIZ_DIFFICULTIES,
  QUIZ_LANGUAGES,
  QUIZ_LENGTH,
  shuffleQuestions,
  type QuizDifficulty,
  type QuizLanguage,
} from "@/lib/quizBank";

/** Deterministic RNG so shuffles are reproducible. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("quiz bank metadata", () => {
  it("exposes three languages and three difficulties", () => {
    expect(QUIZ_LANGUAGES).toEqual(["java", "cpp", "python"]);
    expect(QUIZ_DIFFICULTIES).toEqual(["easy", "medium", "hard"]);
  });

  it("every language reports a non-empty bank", () => {
    for (const language of getQuizLanguages()) {
      const counts = getQuizLanguageCounts(language.id);
      expect(language.total).toBe(counts.easy + counts.medium + counts.hard);
      expect(language.total).toBeGreaterThan(0);
      expect(language.label.length).toBeGreaterThan(0);
    }
  });

  it("difficulty availability follows the selected language", () => {
    for (const language of QUIZ_LANGUAGES) {
      const java = getQuizDifficulties("java").find((d) => d.id === "easy")!;
      const javaHard = getQuizDifficulties("java").find((d) => d.id === "hard")!;
      expect(java.count).toBe(getQuizLanguageCounts("java").easy);
      expect(javaHard.topUpNeeded).toBe(javaHard.count < QUIZ_LENGTH);
      expect(getQuizDifficulties(language).every((d) => d.count >= 0)).toBe(true);
    }
  });
});

describe("shuffleQuestions", () => {
  it("is a permutation and does not mutate the source", () => {
    const source = [1, 2, 3, 4, 5, 6];
    const result = shuffleQuestions(source, seeded(7));
    expect(source).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...result].sort((a, b) => a - b)).toEqual(source);
  });

  it("actually reorders for a non-degenerate seed", () => {
    const source = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffleQuestions(source, seeded(42))).not.toEqual(source);
  });
});

describe("buildQuizRun", () => {
  it("serves exactly QUIZ_LENGTH unique questions of the requested language", () => {
    for (const language of QUIZ_LANGUAGES) {
      for (const difficulty of QUIZ_DIFFICULTIES) {
        const run = buildQuizRun(language, difficulty, QUIZ_LENGTH, seeded(11));
        expect(run.questions).toHaveLength(QUIZ_LENGTH);
        expect(new Set(run.questions.map((q) => q.id)).size).toBe(QUIZ_LENGTH);
        expect(run.questions.every((q) => q.language === language)).toBe(true);
      }
    }
  });

  it("keeps the mix in sync with the served questions", () => {
    const run = buildQuizRun("cpp", "hard", QUIZ_LENGTH, seeded(3));
    const sum = run.mix.reduce((total, entry) => total + entry.count, 0);
    expect(sum).toBe(run.questions.length);
    expect(run.mix.every((entry) => entry.count > 0)).toBe(true);
  });

  it("reports exactMatch only when the whole run is the requested difficulty", () => {
    const run = buildQuizRun("java", "easy", QUIZ_LENGTH, seeded(5));
    const exact = run.questions.filter((q) => q.difficulty === "easy").length;
    expect(run.exactCount).toBe(exact);
    expect(run.exactMatch).toBe(exact === run.questions.length);
  });

  it("never mixes in a difficulty outside the fallback ladder", () => {
    // Java's "hard" bank is small, so a hard run is topped up from medium only.
    const run = buildQuizRun("java", "hard", QUIZ_LENGTH, seeded(9));
    const allowed: QuizDifficulty[] = ["hard", "medium"];
    expect(run.questions.every((q) => allowed.includes(q.difficulty))).toBe(true);
  });

  it("produces a different set on a re-run with the same filter", () => {
    const first = buildQuizRun("python", "medium", QUIZ_LENGTH, seeded(1));
    const second = buildQuizRun("python", "medium", QUIZ_LENGTH, seeded(2));
    expect(first.questions.map((q) => q.id)).not.toEqual(second.questions.map((q) => q.id));
  });

  it("every served question is answerable and deep-linkable", () => {
    const run = buildQuizRun("cpp", "medium", QUIZ_LENGTH, seeded(13));
    for (const question of run.questions) {
      expect(question.question.length).toBeGreaterThan(0);
      expect(question.answer.length).toBeGreaterThan(0);
      expect(question.explanation.length).toBeGreaterThan(0);
      expect(question.topic.length).toBeGreaterThan(0);
      expect(question.detailPath).toMatch(/^\/interview\//);
    }
  });

  it("honours a custom run length", () => {
    const language: QuizLanguage = "java";
    const run = buildQuizRun(language, "medium", 3, seeded(17));
    expect(run.questions).toHaveLength(3);
  });
});
