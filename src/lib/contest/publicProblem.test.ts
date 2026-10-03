import { describe, expect, it } from "vitest";
import { toPublicProblem, toPublicProblems } from "@/lib/contest/publicProblem";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import type { ServerCodingProblem } from "@/lib/contest/types";

const serverProblem: ServerCodingProblem = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "two-sum",
  title: "Two Sum",
  description: "Return the indices of the two numbers that add up to the target.",
  difficulty: "easy",
  topics: ["Arrays"],
  constraints: ["2 <= nums.length <= 10^4"],
  inputFormat: "First line: n, second line: n space separated integers, third line: target",
  outputFormat: "Two space separated indices, 0-based, ascending.",
  examples: [
    { input: "2\n2 7 11 15\n9", output: "0 1", explanation: "2 + 7 = 9" },
  ],
  starterCode: "class Solution { }",
  functionSignature: "public int[] twoSum(int[] nums, int target)",
  visibleTestCases: [{ id: "v1", input: "2\n2 7\n9", expectedOutput: "0 1" }],
  hiddenTestCases: [{ id: "h1", input: "3\n3 2 4\n6", expectedOutput: "1 2" }],
  referenceSolution: "class Solution { public int[] twoSum(int[] n, int t){return new int[]{0,0};} }",
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  isPublished: true,
};

describe("toPublicProblem", () => {
  it("drops hidden test cases and the reference solution", () => {
    const result = toPublicProblem(serverProblem) as unknown as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty("hiddenTestCases");
    expect(result).not.toHaveProperty("referenceSolution");
    expect(Object.keys(result)).not.toContain("hiddenTestCases");
    expect(Object.keys(result)).not.toContain("referenceSolution");
  });

  it("keeps the fields the workspace renders from", () => {
    const result = toPublicProblem(serverProblem);
    expect(result.slug).toBe("two-sum");
    expect(result.functionSignature).toBe(
      "public int[] twoSum(int[] nums, int target)",
    );
    expect(result.visibleTestCases).toHaveLength(1);
    expect(result.starterCode).toBe("class Solution { }");
  });

  it("does not alias the nested arrays of its input", () => {
    const source: ServerCodingProblem = {
      ...serverProblem,
      topics: ["Arrays"],
      constraints: ["a"],
      visibleTestCases: [{ id: "v1", input: "1", expectedOutput: "1" }],
    };
    const result = toPublicProblem(source);
    result.topics.push("Injected");
    result.constraints.push("Injected");
    result.visibleTestCases[0].expectedOutput = "Injected";
    expect(source.topics).toEqual(["Arrays"]);
    expect(source.constraints).toEqual(["a"]);
    expect(source.visibleTestCases[0].expectedOutput).toBe("1");
  });

  it("maps a list without leaking any hidden data", () => {
    const results = toPublicProblems([serverProblem, serverProblem]);
    const serialised = JSON.stringify(results);
    expect(serialised).not.toContain("hiddenTestCases");
    expect(serialised).not.toContain("referenceSolution");
    expect(serialised).not.toContain("class Solution { public int[]");
  });
});

describe("the public Java problem bank", () => {
  it("carries no hidden test data anywhere in its serialised form", () => {
    const serialised = JSON.stringify(PUBLIC_JAVA_PROBLEMS);
    expect(serialised).not.toContain("hiddenTestCases");
    expect(serialised).not.toContain("referenceSolution");
  });

  it("gives every problem a deterministic unique id and slug", () => {
    const ids = PUBLIC_JAVA_PROBLEMS.map((problem) => problem.id);
    const slugs = PUBLIC_JAVA_PROBLEMS.map((problem) => problem.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      expect(problem.id).toBe(`java:${problem.slug}`);
    }
  });

  it("covers the intended Java interview topics", () => {
    const topics = new Set(PUBLIC_JAVA_PROBLEMS.flatMap((p) => p.topics));
    for (const expected of [
      "Arrays",
      "Strings",
      "HashMap",
      "Collections",
      "Stacks & Queues",
      "Sorting & Searching",
      "Recursion",
      "Linked Lists",
      "Java Streams",
      "OOP",
      "Dynamic Programming",
    ]) {
      expect(topics.has(expected)).toBe(true);
    }
  });

  it("keeps every problem complete enough to render a workspace", () => {
    for (const problem of PUBLIC_JAVA_PROBLEMS) {
      expect(problem.title.length).toBeGreaterThan(0);
      expect(problem.description.length).toBeGreaterThan(0);
      expect(problem.constraints.length).toBeGreaterThan(0);
      expect(problem.examples.length).toBeGreaterThan(0);
      expect(problem.visibleTestCases.length).toBeGreaterThanOrEqual(2);
      // Most problems solve a `Solution` class; the design-flavoured ones
      // (e.g. min-stack) ask the learner to name the class themselves. Either
      // way the starter must declare a class and a signature the runner can
      // drive.
      expect(problem.starterCode).toMatch(/class\s+\w+/);
      expect(problem.functionSignature).toContain("(");
      expect(problem.isPublished).toBe(true);
    }
  });
});
