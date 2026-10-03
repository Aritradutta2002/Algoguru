import { describe, expect, it } from "vitest";
import { assignCodingProblems } from "@/lib/contest/assignProblems";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import type { PublicCodingProblem } from "@/lib/contest/types";

const ALL_ZERO = () => 0;
const ALL_ONE = () => 0.999999;

function makePool(count: number, published = true): PublicCodingProblem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `java:problem-${index}`,
    slug: `problem-${index}`,
    title: `Problem ${index}`,
    description: "",
    difficulty: "easy" as const,
    topics: [],
    constraints: [],
    inputFormat: "",
    outputFormat: "",
    examples: [],
    starterCode: "",
    functionSignature: "",
    visibleTestCases: [],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    isPublished: published,
  }));
}

describe("assignCodingProblems", () => {
  it("returns between two and three problems under any randomness", () => {
    const pool = makePool(12);
    for (let seed = 0; seed < 20; seed += 1) {
      const random = () => seed / 20;
      const assigned = assignCodingProblems(pool, random);
      expect(assigned.length).toBeGreaterThanOrEqual(2);
      expect(assigned.length).toBeLessThanOrEqual(3);
    }
  });

  it("can ask for two or for three problems depending on the roll", () => {
    const pool = makePool(12);
    expect(assignCodingProblems(pool, ALL_ZERO)).toHaveLength(2);
    expect(assignCodingProblems(pool, ALL_ONE)).toHaveLength(3);
  });

  it("never repeats a problem", () => {
    const assigned = assignCodingProblems(makePool(12), () => 0.42);
    const ids = assigned.map((problem) => problem.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only ever assigns published problems", () => {
    const pool = [
      ...makePool(3, false).map((problem) => ({
        ...problem,
        id: `unpublished-${problem.slug}`,
      })),
      ...makePool(6, true),
    ];
    const assigned = assignCodingProblems(pool, () => 0.9);
    expect(assigned).toHaveLength(3);
    expect(assigned.every((problem) => problem.isPublished)).toBe(true);
  });

  it("is deterministic for a fixed randomness source", () => {
    const pool = makePool(12);
    const first = assignCodingProblems(pool, () => 0.3).map((p) => p.id);
    const second = assignCodingProblems(pool, () => 0.3).map((p) => p.id);
    expect(first).toEqual(second);
  });

  it("degrades to the whole pool when fewer than two problems exist", () => {
    expect(assignCodingProblems(makePool(0))).toEqual([]);
    expect(assignCodingProblems(makePool(1))).toHaveLength(1);
    expect(assignCodingProblems(makePool(2))).toHaveLength(2);
  });

  it("assigns from the real Java bank without repeating or reaching unpublished data", () => {
    const assigned = assignCodingProblems(PUBLIC_JAVA_PROBLEMS, () => 0.77);
    expect(assigned.length).toBeGreaterThanOrEqual(2);
    expect(assigned.length).toBeLessThanOrEqual(3);
    expect(new Set(assigned.map((p) => p.slug)).size).toBe(assigned.length);
    for (const problem of assigned) {
      expect(problem.isPublished).toBe(true);
      // The public type cannot carry hidden data; assert the runtime shape too.
      expect(
        (problem as unknown as Record<string, unknown>).hiddenTestCases,
      ).toBeUndefined();
    }
  });
});
