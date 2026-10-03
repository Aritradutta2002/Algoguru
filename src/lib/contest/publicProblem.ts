import type { PublicCodingProblem, ServerCodingProblem } from "@/lib/contest/types";

/**
 * The single place where a problem is narrowed to what the browser may see.
 *
 * The `contest-coding` edge function runs this same field list server-side
 * before serialising any response, so there is exactly one definition of
 * "public" to keep in sync. Keep it explicit — an object spread or
 * `delete`-based strip would silently leak a future field.
 */
export function toPublicProblem(problem: ServerCodingProblem): PublicCodingProblem {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    topics: [...problem.topics],
    constraints: [...problem.constraints],
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    examples: problem.examples.map((example) => ({ ...example })),
    starterCode: problem.starterCode,
    functionSignature: problem.functionSignature,
    visibleTestCases: problem.visibleTestCases.map((testCase) => ({ ...testCase })),
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    isPublished: problem.isPublished,
  };
}

export function toPublicProblems(problems: ServerCodingProblem[]): PublicCodingProblem[] {
  return problems.map(toPublicProblem);
}
