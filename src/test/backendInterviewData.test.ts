import { describe, expect, it } from "vitest";
import {
  BACKEND_QUESTION_TOTAL,
  BACKEND_TOPICS,
  allBackendQuestions,
  backendQuestionMetaMap,
  backendQuestionsByTopicId,
  backendTopicSections,
} from "@/data/backendInterview";
import {
  ANNOTATION_CATALOGUE,
  ANNOTATION_CATEGORIES,
  ANNOTATIONS_BY_CATEGORY,
} from "@/data/backendInterview/annotations";
import {
  BACKEND_PRACTICE_PROBLEMS,
  PRACTICE_PROBLEM_BY_ID,
  getPracticeProblemsForTopic,
} from "@/data/backendInterview/practiceProblems";
import {
  backendQuestionIndex,
  getBackendQuestionById,
  getBackendQuestionBySlug,
  getBackendNeighbours,
  searchBackendQuestions,
} from "@/lib/backendQuestionIndex";

describe("backend interview question bank", () => {
  it("has the expected number of questions", () => {
    expect(allBackendQuestions).toHaveLength(BACKEND_QUESTION_TOTAL);
  });

  it("covers every required interview area", () => {
    const topicIds = BACKEND_TOPICS.map((topic) => topic.id);
    for (const required of [
      "java-annotations",
      "spring-annotations",
      "spring-boot-core",
      "collections",
      "hashmap-internals",
      "multithreading",
      "spring-security",
      "jwt",
    ]) {
      expect(topicIds).toContain(required);
      expect((backendQuestionsByTopicId[required] ?? []).length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = allBackendQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every question complete content", () => {
    for (const question of allBackendQuestions) {
      expect(question.question.trim().length, `${question.id} question`).toBeGreaterThan(10);
      expect(question.explanation.trim().length, `${question.id} explanation`).toBeGreaterThan(10);
      // Answers must be full explanations, not summaries.
      const words = question.answer.trim().split(/\s+/).length;
      expect(words, `${question.id} answer words`).toBeGreaterThanOrEqual(150);
      if (question.code) {
        expect(question.codeLanguage, `${question.id} codeLanguage`).toBeTruthy();
      }
    }
  });

  it("gives every question metadata", () => {
    for (const question of allBackendQuestions) {
      const meta = backendQuestionMetaMap[question.id];
      expect(meta, `${question.id} meta`).toBeDefined();
      expect(["easy", "medium", "hard"]).toContain(meta.difficulty);
      expect(["low", "medium", "high", "very-high"]).toContain(meta.priority);
      expect(meta.tags.length).toBeGreaterThan(0);
    }
  });

  it("groups questions into contiguous topic sections", () => {
    let cursor = 0;
    for (const section of backendTopicSections) {
      expect(section.startIndex).toBe(cursor);
      cursor += section.questions.length;
    }
    expect(cursor).toBe(allBackendQuestions.length);
  });
});

describe("backend question index", () => {
  it("indexes every question with a unique slug", () => {
    expect(backendQuestionIndex).toHaveLength(allBackendQuestions.length);
    const slugs = backendQuestionIndex.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("resolves questions by slug and by id", () => {
    const first = backendQuestionIndex[0];
    expect(getBackendQuestionBySlug(first.slug)?.question.id).toBe(first.question.id);
    expect(getBackendQuestionBySlug(first.question.id)?.slug).toBe(first.slug);
    expect(getBackendQuestionById(first.question.id)?.number).toBe(1);
  });

  it("links neighbours in both directions", () => {
    const second = backendQuestionIndex[1];
    const { previous, next } = getBackendNeighbours(second.question.id);
    expect(previous?.question.id).toBe(backendQuestionIndex[0].question.id);
    expect(next?.question.id).toBe(backendQuestionIndex[2].question.id);
    expect(getBackendNeighbours(backendQuestionIndex[0].question.id).previous).toBeUndefined();
  });

  it("finds the HashMap and JWT questions by search", () => {
    expect(searchBackendQuestions("hashmap").length).toBeGreaterThan(0);
    expect(searchBackendQuestions("jwt").length).toBeGreaterThan(0);
    expect(searchBackendQuestions("zzzznotarealterm")).toHaveLength(0);
  });
});

describe("annotation catalogue", () => {
  it("has unique names within a category and known categories", () => {
    const known = new Set(ANNOTATION_CATEGORIES.map((category) => category.id));
    for (const entry of ANNOTATION_CATALOGUE) {
      expect(known, `${entry.name} category`).toContain(entry.category);
      expect(entry.name.startsWith("@")).toBe(true);
      expect(entry.howItWorks.trim().length).toBeGreaterThan(30);
      expect(entry.purpose.trim().length).toBeGreaterThan(10);
      expect(entry.target.trim().length).toBeGreaterThan(0);
    }
    for (const category of ANNOTATION_CATEGORIES) {
      const names = (ANNOTATIONS_BY_CATEGORY[category.id] ?? []).map((entry) => entry.name);
      expect(new Set(names).size, `${category.id} duplicates`).toBe(names.length);
    }
  });

  it("includes the annotations interviewers always ask about", () => {
    const names = new Set(ANNOTATION_CATALOGUE.map((entry) => entry.name));
    for (const required of [
      "@Override",
      "@FunctionalInterface",
      "@Retention",
      "@Target",
      "@Component",
      "@Bean",
      "@Autowired",
      "@Transactional",
      "@SpringBootApplication",
      "@RestController",
      "@ConditionalOnMissingBean",
      "@ConfigurationProperties",
      "@PreAuthorize",
      "@Entity",
    ]) {
      expect(names, required).toContain(required);
    }
  });

  it("buckets every entry into its category", () => {
    const bucketed = ANNOTATION_CATEGORIES.reduce(
      (total, category) => total + (ANNOTATIONS_BY_CATEGORY[category.id]?.length ?? 0),
      0,
    );
    expect(bucketed).toBe(ANNOTATION_CATALOGUE.length);
  });
});

describe("practice lab", () => {
  it("has unique ids that map back to real topics", () => {
    const topicIds = new Set(BACKEND_TOPICS.map((topic) => topic.id));
    const ids = BACKEND_PRACTICE_PROBLEMS.map((problem) => problem.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const problem of BACKEND_PRACTICE_PROBLEMS) {
      expect(topicIds, `${problem.id} topic`).toContain(problem.topic);
      expect(PRACTICE_PROBLEM_BY_ID[problem.id]).toBe(problem);
    }
  });

  it("gives every problem tasks, hints and a solution", () => {
    for (const problem of BACKEND_PRACTICE_PROBLEMS) {
      expect(problem.tasks.length, `${problem.id} tasks`).toBeGreaterThanOrEqual(3);
      expect(problem.hints.length, `${problem.id} hints`).toBeGreaterThanOrEqual(2);
      expect(problem.solution.trim().length, `${problem.id} solution`).toBeGreaterThan(80);
      expect(problem.discussion.trim().length, `${problem.id} discussion`).toBeGreaterThan(80);
      expect(problem.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it("offers practice for every topic", () => {
    for (const topic of BACKEND_TOPICS) {
      expect(getPracticeProblemsForTopic(topic.id).length, topic.id).toBeGreaterThan(0);
    }
  });

  it("only references questions that exist", () => {
    const ids = new Set(allBackendQuestions.map((question) => question.id));
    for (const problem of BACKEND_PRACTICE_PROBLEMS) {
      for (const related of problem.relatedQuestionIds ?? []) {
        expect(ids, `${problem.id} -> ${related}`).toContain(related);
      }
    }
  });
});
