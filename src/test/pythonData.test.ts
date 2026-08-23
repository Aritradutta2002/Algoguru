import { describe, it, expect } from "vitest";
import { pythonInterviewTopics } from "@/data/pythonInterviewData";
import { PYTHON_QUESTION_META } from "@/data/pythonInterviewMetadata";
import {
  getAllPythonQuestions,
  getPythonQuestionBySlug,
} from "@/lib/pythonQuestionIndex";

describe("python interview data", () => {
  it("has 200+ questions", () => {
    const total = getAllPythonQuestions().length;
    expect(total).toBeGreaterThanOrEqual(200);
  });

  it("every question has answer/explanation", () => {
    for (const entry of getAllPythonQuestions()) {
      expect(entry.question.answer.length).toBeGreaterThan(50);
      expect(entry.question.explanation?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("slugs resolve uniquely", () => {
    const slugs = getAllPythonQuestions().map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(getPythonQuestionBySlug(slugs[0])?.slug).toBe(slugs[0]);
  });

  it("metadata covers every question", () => {
    for (const topic of pythonInterviewTopics) {
      for (const q of topic.questions) {
        expect(PYTHON_QUESTION_META[q.id]).toBeDefined();
      }
    }
  });
});
