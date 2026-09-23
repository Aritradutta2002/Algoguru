/**
 * Chunk aggregator for the Core Java interview question bank.
 *
 * Each `chunk-*.ts` file owns a disjoint range of global question ids.
 * This module concatenates them in chunk order, groups them by topic, and
 * exposes a single merged metadata map. Chunk order — not id order — decides
 * the rendered question numbering.
 *
 * Invariants enforced here (development-time only, zero runtime cost in prod):
 * - ids are unique across all chunks
 * - every question's declared topic exists in `TOPIC_DEFINITIONS`
 * - each topic receives exactly the number of questions its `range` implies
 */
import type { InterviewQuestion } from "@/data/coreJavaInterviewData";
import type { CoreJavaQuestionMeta } from "@/data/coreJavaInterviewMetadata";

import { TOPIC_DEFINITIONS, TOPIC_BY_ID } from "./topics";
import type { QuestionChunk } from "./contract";

import { chunk01Platform } from "./chunk-01-platform";
import { chunk02Wrappers } from "./chunk-02-wrappers";
import { chunk03Strings } from "./chunk-03-strings";
import { chunk04OopBasicsA } from "./chunk-04-oop-basics-a";
import { chunk05OopBasicsB } from "./chunk-05-oop-basics-b";
import { chunk06OopBasicsC } from "./chunk-06-oop-basics-c";
import { chunk07AdvancedOop } from "./chunk-07-advanced-oop";
import { chunk08Modifiers } from "./chunk-08-modifiers";
import { chunk09ConditionsLoops } from "./chunk-09-conditions-loops";
import { chunk10ExceptionsA } from "./chunk-10-exceptions-a";
import { chunk11ExceptionsB } from "./chunk-11-exceptions-b";
import { chunk12MiscA } from "./chunk-12-misc-a";
import { chunk13MiscB } from "./chunk-13-misc-b";
import { chunk14CollectionsA } from "./chunk-14-collections-a";
import { chunk15CollectionsB } from "./chunk-15-collections-b";
import { chunk16CollectionsC } from "./chunk-16-collections-c";
import { chunk17AdvancedCollections } from "./chunk-17-advanced-collections";
import { chunk18Generics } from "./chunk-18-generics";
import { chunk19MultithreadingA } from "./chunk-19-multithreading-a";
import { chunk20MultithreadingB } from "./chunk-20-multithreading-b";
import { chunk21FunctionalStreams } from "./chunk-21-functional-streams";
import { chunk22NewFeatures } from "./chunk-22-new-features";

/** All chunks in global-id order. */
export const QUESTION_CHUNKS: QuestionChunk[] = [
  chunk01Platform,
  chunk02Wrappers,
  chunk03Strings,
  chunk04OopBasicsA,
  chunk05OopBasicsB,
  chunk06OopBasicsC,
  chunk07AdvancedOop,
  chunk08Modifiers,
  chunk09ConditionsLoops,
  chunk10ExceptionsA,
  chunk11ExceptionsB,
  chunk12MiscA,
  chunk13MiscB,
  chunk14CollectionsA,
  chunk15CollectionsB,
  chunk16CollectionsC,
  chunk17AdvancedCollections,
  chunk18Generics,
  chunk19MultithreadingA,
  chunk20MultithreadingB,
  chunk21FunctionalStreams,
  chunk22NewFeatures,
];

/** Every question, in global-id order. */
export const allCoreJavaQuestions: InterviewQuestion[] = QUESTION_CHUNKS.flatMap(
  (chunk) => chunk.questions
);

/** Merged difficulty/priority/tags/related metadata keyed by question id. */
export const coreJavaQuestionMetaMap: Record<string, CoreJavaQuestionMeta> =
  Object.assign({}, ...QUESTION_CHUNKS.map((chunk) => chunk.meta));

/** Questions grouped by topic id, preserving each chunk's internal order. */
export const questionsByTopicId: Record<string, InterviewQuestion[]> = (() => {
  const grouped: Record<string, InterviewQuestion[]> = {};
  for (const topic of TOPIC_DEFINITIONS) grouped[topic.id] = [];
  for (const chunk of QUESTION_CHUNKS) {
    const bucket = grouped[chunk.topic];
    if (!bucket) {
      throw new Error(
        `[coreJavaQuestions] Chunk declares unknown topic "${chunk.topic}".`
      );
    }
    bucket.push(...chunk.questions);
  }
  return grouped;
})();

if (import.meta.env?.DEV) {
  const seen = new Set<string>();
  for (const question of allCoreJavaQuestions) {
    if (seen.has(question.id)) {
      console.warn(`[coreJavaQuestions] Duplicate question id "${question.id}".`);
    }
    seen.add(question.id);
  }
  for (const topic of TOPIC_DEFINITIONS) {
    const [from, to] = topic.range;
    const expected = to - from + 1;
    const actual = questionsByTopicId[topic.id]?.length ?? 0;
    if (actual !== expected) {
      console.warn(
        `[coreJavaQuestions] Topic "${topic.id}" expected ${expected} questions, found ${actual}.`
      );
    }
  }
  if (allCoreJavaQuestions.length !== 226) {
    console.warn(
      `[coreJavaQuestions] Expected 226 questions, found ${allCoreJavaQuestions.length}.`
    );
  }
}

export { TOPIC_BY_ID, TOPIC_DEFINITIONS };