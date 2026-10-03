/**
 * Shared exam-integrity policy for every assessment mode (MCQ quiz and Java
 * coding contest). Single source of truth so the two modes cannot silently
 * drift apart.
 */

/**
 * Number of focus violations allowed before an exam is auto-submitted.
 *
 * NOTE the intentional mismatch with user-facing copy: the UI says
 * "3 warnings before termination" because a learner gets 3 chances to
 * recover, and the 4th violation is the one that terminates. Keep the copy and
 * this number in that relationship — the MCQ suite and the coding contest both
 * count up to this value.
 */
export const MAX_EXAM_WARNINGS = 4;
