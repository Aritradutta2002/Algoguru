/**
 * Shared authoring contract for the Core Java interview question bank.
 *
 * Every chunk file under `src/data/coreJavaQuestions/` exports exactly one
 * `chunk` built with `defineChunk(...)`. The chunk aggregator
 * (`coreJavaQuestions/index.ts`) collects them, groups them by `topic`, and
 * `coreJavaInterviewData.ts` exposes the resulting `InterviewTopic[]`.
 * `coreJavaInterviewMetadata.ts` merges the chunk metadata into
 * `CORE_JAVA_QUESTION_META`.
 *
 * ---------------------------------------------------------------------------
 * AUTHORING RULES (must be followed exactly)
 * ---------------------------------------------------------------------------
 * 1. IDs are fixed. Use the global ids given in your brief, in ascending order,
 *    one per question. Never invent or renumber ids — bookmarks and saved
 *    progress are keyed by id, and ids no longer match rendered question
 *    numbers once a question is appended inside an existing topic (q226).
 * 2. `question` text is fixed. Copy it verbatim from your brief.
 * 3. Every question object MUST populate all of these fields:
 *      id, question, answer, code, codeLanguage, explanation
 * 4. `answer` — 180 to 320 words, 2 to 4 paragraphs separated by a blank line
 *    (i.e. the two characters `\n\n` between paragraphs).
 *    - Use `**bold**` for a short lead-in label on key paragraphs/bullets.
 *    - Use `- ` bullet lines for enumerations of facts.
 *    - A single short line under 70 characters that ends with `:` renders as a
 *      heading; use that for section labels instead of markdown `#`.
 *    - Inline `code` with backticks is fine.
 *    - NEVER use: markdown headings (`##`), tables, fenced code blocks, HTML,
 *      images, or links. The renderer only understands `\n\n`, `- `, `1. `,
 *      `**bold**` and `` `code` ``.
 * 5. `code` — a realistic, self-contained Java snippet (10 to 30 lines) that
 *    demonstrates the answer. Use real class/method names, small comments, and
 *    Java 8+ idioms. Never emit placeholders such as `// your code here`.
 * 6. `codeLanguage` — always the string "java".
 * 7. `explanation` — exactly ONE line, 12 to 30 words: the interview tip, i.e.
 *    what the interviewer is really testing and the crisp differentiator.
 * 8. Several questions share identical display text ("Guess the output", "Will
 *    this code compile?"). The snippet in `code` is what distinguishes them —
 *    make each of those snippets different and label the intent in a comment.
 *
 * ---------------------------------------------------------------------------
 * TEMPLATE
 * ---------------------------------------------------------------------------
 *   defineChunk({
 *     topic: "java-platform",
 *     questions: [
 *       {
 *         id: "q001",
 *         question: "Why is Java so popular?",
 *         answer:
 *           "First paragraph ... **Second idea** ...\n\n" +
 *           "Second paragraph with a few points:\n\n" +
 *           "- **Point one**: detail.\n" +
 *           "- **Point two**: detail.",
 *         code: `public class Demo {\n    ...\n}`,
 *         codeLanguage: "java",
 *         explanation: "One crisp line naming what the interviewer is testing.",
 *       },
 *     ],
 *     meta: {
 *       q001: { difficulty: "easy", priority: "high", tags: ["jvm", "platform"] },
 *     },
 *   });
 *
 * ---------------------------------------------------------------------------
 * LITERAL SAFETY (this is real code — the file must compile)
 * ---------------------------------------------------------------------------
 * - Prefer a backtick template literal for `code`, or a normal quoted string
 *   with `\n`. Either is fine.
 * - Inside a backtick template literal, escape every `${` as `\${` and never
 *   put a raw backtick in the Java snippet (use single quotes in Java instead).
 * - Inside a normal double-quoted string, escape every `"` as `\"`.
 * - The `answer` string must contain no raw newlines other than through `\n`.
 *
 * ---------------------------------------------------------------------------
 * METADATA
 * ---------------------------------------------------------------------------
 * `meta` is keyed by question id (only ids in your own chunk) and each entry
 * supports:
 *   difficulty?: "easy" | "medium" | "hard"
 *   priority?: "low" | "medium" | "high" | "very-high"
 *   tags?: string[]               // 2-4 short lowercase keywords
 *   relatedQuestionIds?: string[] // 0-3 ids from the global q001..q225 set
 *   estimatedReadMinutes?: number // integer, usually 2-5
 *   javaVersions?: string[]       // only when version-specific, e.g. ["Java 8+"]
 *
 * Do not set `slug` — slugs are derived centrally in coreJavaInterviewMetadata.ts.
 */
import type { InterviewQuestion } from "@/data/coreJavaInterviewData";
import type { CoreJavaQuestionMeta } from "@/data/coreJavaInterviewMetadata";

export interface QuestionChunk {
  /** Topic id from `TOPIC_DEFINITIONS` that every question in this chunk belongs to. */
  topic: string;
  /** Questions in ascending id order. */
  questions: InterviewQuestion[];
  /** Metadata for the ids owned by this chunk. */
  meta: Record<string, CoreJavaQuestionMeta>;
}

/** Identity helper — keeps chunk files declared in a consistent shape. */
export function defineChunk(chunk: QuestionChunk): QuestionChunk {
  return chunk;
}