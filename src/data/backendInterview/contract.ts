/**
 * Authoring contract for the **Backend / Spring Boot interview** question bank.
 *
 * This bank is aimed squarely at the 3–5 years-experienced Java backend
 * engineer: the questions assume you already know the syntax and instead probe
 * internals, trade-offs, failure modes and production behaviour.
 *
 * Layout
 * ------
 *   src/data/backendInterview/
 *     contract.ts          <- you are here (types + defineBackendChunk)
 *     topics.ts            <- ordered topic registry
 *     chunk-NN-*.ts        <- one file per topic slice, exports ONE chunk
 *     index.ts             <- aggregator (flat list, per-topic grouping, meta)
 *     annotations.ts       <- the annotation reference catalogue
 *     practiceProblems.ts  <- the hands-on practice lab
 *
 * Answer formatting (markdown-lite)
 * ---------------------------------
 * The renderer (`BackendAnswer`) understands exactly five things:
 *   - paragraph breaks written as the two characters `\n\n`
 *   - `- ` bullet lines
 *   - `1. ` numbered lines
 *   - `**bold**` inline
 *   - `` `code` `` inline
 * A single short line (< 70 chars) ending with `:` renders as a section
 * heading. Never use markdown headings (`##`), tables, fenced code blocks,
 * HTML or images inside `answer` — put code in the `code` field instead.
 *
 * Literal safety
 * --------------
 * `code` is normally a backtick template literal. Inside one:
 *   - escape every `${` as `\${`
 *   - never put a raw backtick in the snippet
 * Everything here is real TypeScript that has to compile.
 */

export type BackendDifficulty = "easy" | "medium" | "hard";
export type BackendPriority = "low" | "medium" | "high" | "very-high";

export interface BackendQuestion {
  /** Stable id, e.g. "b001". Bookmarks and progress are keyed by this. */
  id: string;
  /** The interview question, verbatim. */
  question: string;
  /** Long-form answer in the markdown-lite dialect described above. */
  answer: string;
  /** Self-contained snippet that demonstrates the answer. */
  code?: string;
  /** Language hint for the syntax highlighter: java | yaml | xml | bash | properties | sql. */
  codeLanguage?: string;
  /** ONE line: what the interviewer is actually testing. */
  explanation: string;
  /** Natural follow-up questions an interviewer will drill into. */
  followUps?: string[];
}

export interface BackendQuestionMeta {
  /** Optional slug override; otherwise derived from the question text. */
  slug?: string;
  difficulty: BackendDifficulty;
  priority: BackendPriority;
  /** 2–5 short lowercase keywords used by search + filters. */
  tags: string[];
  /** Approximate reading time in minutes. */
  readMinutes?: number;
  /** e.g. ["Java 8+"], ["Spring Boot 3"] — only when version specific. */
  versions?: string[];
}

export interface BackendChunk {
  /** Topic id from `BACKEND_TOPICS` that every question in this chunk belongs to. */
  topic: string;
  /** Questions in ascending id order. */
  questions: BackendQuestion[];
  /** Metadata for the ids owned by this chunk. */
  meta: Record<string, BackendQuestionMeta>;
}

/** Identity helper — keeps every chunk file declared in the same shape. */
export function defineBackendChunk(chunk: BackendChunk): BackendChunk {
  return chunk;
}
