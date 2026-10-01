import { describe, expect, it } from "vitest";
import { buildMcqQuiz, getMcqCount, MCQ_QUESTIONS } from "@/lib/mcqQuizBank";
import {
  QUIZ_DIFFICULTIES,
  QUIZ_LANGUAGES,
  type QuizDifficulty,
  type QuizLanguage,
} from "@/lib/quizBank";

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const languages: Array<QuizLanguage | "mixed"> = [...QUIZ_LANGUAGES, "mixed"];
const difficulties: Array<QuizDifficulty | "mixed"> = [
  ...QUIZ_DIFFICULTIES,
  "mixed",
];
const filters = languages.flatMap((language) =>
  difficulties.map((difficulty) => ({ language, difficulty })),
);

function matchingQuestions(
  language: QuizLanguage | "mixed",
  difficulty: QuizDifficulty | "mixed",
) {
  return MCQ_QUESTIONS.filter(
    (question) =>
      (language === "mixed" || question.language === language) &&
      (difficulty === "mixed" || question.difficulty === difficulty),
  );
}

const sourceById = new Map(
  MCQ_QUESTIONS.map((question) => [question.id, question]),
);

describe("MCQ_QUESTIONS", () => {
  it("has at least five questions in each of the nine language/difficulty slices", () => {
    expect(MCQ_QUESTIONS.length).toBeGreaterThanOrEqual(45);
    for (const language of QUIZ_LANGUAGES) {
      for (const difficulty of QUIZ_DIFFICULTIES) {
        expect(
          matchingQuestions(language, difficulty).length,
        ).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("has globally unique IDs and complete, valid question records", () => {
    expect(new Set(MCQ_QUESTIONS.map((question) => question.id)).size).toBe(
      MCQ_QUESTIONS.length,
    );
    expect(
      new Set(MCQ_QUESTIONS.map((question) => question.question)).size,
    ).toBe(MCQ_QUESTIONS.length);
    for (const question of MCQ_QUESTIONS) {
      expect(question.id.trim().length).toBeGreaterThan(0);
      expect(QUIZ_LANGUAGES).toContain(question.language);
      expect(QUIZ_DIFFICULTIES).toContain(question.difficulty);
      expect(question.question.trim().length).toBeGreaterThan(0);
      expect(question.explanation.trim().length).toBeGreaterThan(0);
      expect(question.topic.trim().length).toBeGreaterThan(0);
      expect(question.options).toHaveLength(4);
      expect(question.options.every((option) => option.trim().length > 0)).toBe(
        true,
      );
      expect(
        new Set(question.options.map((option) => option.trim())).size,
      ).toBe(4);
      expect(Number.isInteger(question.correctIndex)).toBe(true);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(question.options.length);
    }
  });

  it.each([
    ["java:easy:integer-division", "3"],
    [
      "java:medium:generic-invariance",
      "List<? extends Number> numbers = integers;",
    ],
    [
      "java:hard:suppressed-exception",
      "A, with B recorded as a suppressed exception",
    ],
    ["cpp:easy:integer-division", "3"],
    ["cpp:medium:unique-ownership", "auto q = std::move(p);"],
    ["cpp:hard:forwarding-reference", "T is int&; the parameter is int&"],
    ["python:easy:floor-division", "-4"],
    ["python:medium:mutable-default", "[1, 2]"],
    ["python:hard:late-binding", "[2, 2, 2]"],
  ])("keeps the curated answer for %s", (id, answer) => {
    const question = sourceById.get(id)!;
    expect(question.options[question.correctIndex]).toBe(answer);
  });
});

describe("getMcqCount", () => {
  it.each(filters)(
    "counts exactly $language / $difficulty",
    ({ language, difficulty }) => {
      expect(getMcqCount(language, difficulty)).toBe(
        matchingQuestions(language, difficulty).length,
      );
    },
  );

  it("reports the full bank for mixed/mixed and additive totals for single-axis filters", () => {
    expect(getMcqCount("mixed", "mixed")).toBe(MCQ_QUESTIONS.length);
    for (const language of QUIZ_LANGUAGES) {
      expect(getMcqCount(language, "mixed")).toBe(
        QUIZ_DIFFICULTIES.reduce(
          (total, difficulty) => total + getMcqCount(language, difficulty),
          0,
        ),
      );
    }
    for (const difficulty of QUIZ_DIFFICULTIES) {
      expect(getMcqCount("mixed", difficulty)).toBe(
        QUIZ_LANGUAGES.reduce(
          (total, language) => total + getMcqCount(language, difficulty),
          0,
        ),
      );
    }
  });
});

describe("buildMcqQuiz", () => {
  it.each(filters)(
    "strictly filters and clips $language / $difficulty without fallback",
    ({ language, difficulty }) => {
      const pool = matchingQuestions(language, difficulty);
      const run = buildMcqQuiz(
        language,
        difficulty,
        pool.length + 10,
        seeded(11),
      );
      expect(run).toHaveLength(pool.length);
      expect(new Set(run.map((question) => question.id)).size).toBe(run.length);
      expect(run.map((question) => question.id).sort()).toEqual(
        pool.map((question) => question.id).sort(),
      );
      if (language !== "mixed") {
        expect(run.every((question) => question.language === language)).toBe(
          true,
        );
      }
      if (difficulty !== "mixed") {
        expect(
          run.every((question) => question.difficulty === difficulty),
        ).toBe(true);
      }
    },
  );

  it.each(filters)(
    "samples the requested size without duplicates for $language / $difficulty",
    ({ language, difficulty }) => {
      const run = buildMcqQuiz(language, difficulty, 3, seeded(17));
      const allowedIds = new Set(
        matchingQuestions(language, difficulty).map((question) => question.id),
      );
      expect(run).toHaveLength(3);
      expect(new Set(run.map((question) => question.id)).size).toBe(3);
      expect(run.every((question) => allowedIds.has(question.id))).toBe(true);
    },
  );

  it("reproduces both question order and answer order for the same seed", () => {
    const first = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(42),
    );
    const second = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(42),
    );
    expect(first).toEqual(second);
    expect(first.map((question) => question.id)).not.toEqual(
      MCQ_QUESTIONS.map((question) => question.id),
    );
    expect(
      first.some(
        (question) =>
          question.options.join("\n") !==
          sourceById.get(question.id)!.options.join("\n"),
      ),
    ).toBe(true);
  });

  it("uses the injected RNG to shuffle questions and remap the correct answer", () => {
    const [question] = buildMcqQuiz("java", "easy", 1, () => 0);
    expect(question.id).toBe("java:easy:integer-division");
    expect(question.options).toEqual(["4", "3", "A compilation error", "3.5"]);
    expect(question.correctIndex).toBe(1);
    expect(question.options[question.correctIndex]).toBe("3");
  });

  it("changes question and option order with different seeds", () => {
    const first = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(1),
    );
    const second = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(2),
    );
    expect(first.map((question) => question.id)).not.toEqual(
      second.map((question) => question.id),
    );
    const secondById = new Map(
      second.map((question) => [question.id, question]),
    );
    expect(
      first.some(
        (question) =>
          question.options.join("\n") !==
          secondById.get(question.id)!.options.join("\n"),
      ),
    ).toBe(true);
  });

  it.each([1, 7, 42, 1234])(
    "preserves every correct answer and option set with seed %s",
    (seed) => {
      const run = buildMcqQuiz(
        "mixed",
        "mixed",
        MCQ_QUESTIONS.length,
        seeded(seed),
      );
      for (const question of run) {
        const source = sourceById.get(question.id)!;
        expect(question.options).toHaveLength(4);
        expect([...question.options].sort()).toEqual(
          [...source.options].sort(),
        );
        expect(Number.isInteger(question.correctIndex)).toBe(true);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
        expect(question.options[question.correctIndex]).toBe(
          source.options[source.correctIndex],
        );
        expect({
          ...question,
          options: source.options,
          correctIndex: source.correctIndex,
        }).toEqual(source);
      }
    },
  );

  it.each([0, -1, -Infinity, NaN])(
    "returns no questions for size %s",
    (size) => {
      expect(buildMcqQuiz("mixed", "mixed", size, seeded(3))).toEqual([]);
    },
  );

  it("rounds fractional sizes down and clips infinite sizes to the matching pool", () => {
    expect(buildMcqQuiz("python", "medium", 2.9, seeded(3))).toHaveLength(2);
    expect(buildMcqQuiz("python", "medium", 0.9, seeded(3))).toEqual([]);
    expect(buildMcqQuiz("cpp", "hard", Infinity, seeded(3))).toHaveLength(
      getMcqCount("cpp", "hard"),
    );
  });

  it("supports the default RNG without repeating questions", () => {
    const run = buildMcqQuiz("mixed", "mixed", 10);
    expect(run).toHaveLength(10);
    expect(new Set(run.map((question) => question.id)).size).toBe(10);
    for (const question of run) {
      const source = sourceById.get(question.id)!;
      expect(question.options[question.correctIndex]).toBe(
        source.options[source.correctIndex],
      );
    }
  });

  it("does not mutate the source or share mutable question records or option arrays", () => {
    const snapshot = MCQ_QUESTIONS.map((question) => ({
      ...question,
      options: [...question.options],
    }));
    const first = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(9),
    );
    const second = buildMcqQuiz(
      "mixed",
      "mixed",
      MCQ_QUESTIONS.length,
      seeded(9),
    );
    expect(MCQ_QUESTIONS).toEqual(snapshot);
    for (const question of first) {
      const source = sourceById.get(question.id)!;
      expect(question).not.toBe(source);
      expect(question.options).not.toBe(source.options);
    }
    expect(first[0]).not.toBe(second[0]);
    expect(first[0].options).not.toBe(second[0].options);
    first[0].question = "Changed by the consumer";
    first[0].options[0] = "Changed option";
    first[0].correctIndex = -1;
    first.reverse();
    expect(MCQ_QUESTIONS).toEqual(snapshot);
    expect(
      buildMcqQuiz("mixed", "mixed", MCQ_QUESTIONS.length, seeded(9)),
    ).toEqual(second);
  });
});
