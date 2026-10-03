import { shuffleQuestions } from "@/lib/quizBank";
import {
  CODING_CONTEST_MAX_PROBLEMS,
  CODING_CONTEST_MIN_PROBLEMS,
} from "@/lib/contest/config";
import type { PublicCodingProblem } from "@/lib/contest/types";

/**
 * Randomly assign 2 or 3 distinct, published problems to a contest.
 *
 * The `contest-coding` edge function carries an identical copy of this
 * function. That duplication is deliberate: the Deno edge runtime and the
 * browser bundle cannot share a module in this repo, and the function is small
 * and pure. If you change one, change both.
 */
export function assignCodingProblems(
  pool: PublicCodingProblem[],
  random: () => number = Math.random,
): PublicCodingProblem[] {
  const eligible = pool.filter((problem) => problem.isPublished);
  if (eligible.length === 0) return [];

  const span = CODING_CONTEST_MAX_PROBLEMS - CODING_CONTEST_MIN_PROBLEMS + 1;
  const requested =
    CODING_CONTEST_MIN_PROBLEMS +
    Math.min(span - 1, Math.max(0, Math.floor(random() * span)));

  // `shuffleQuestions` is a Fisher-Yates that never repeats, so slicing the
  // shuffle is sufficient to guarantee distinct problems.
  return shuffleQuestions(eligible, random).slice(
    0,
    Math.min(requested, eligible.length),
  );
}
