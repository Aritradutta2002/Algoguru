/**
 * Aggregator for the Backend / Spring Boot interview question bank.
 *
 * Everything the pages need is derived here exactly once:
 *   - `allBackendQuestions`  flat list in topic order (display numbering)
 *   - `backendQuestionsByTopicId`
 *   - `backendQuestionMetaMap`
 *   - `backendTopicSections`  topic + its questions, ready to render
 *
 * DEV-only assertions catch the mistakes that are painful in production:
 * duplicate ids, unknown topics, missing metadata and chunk drift.
 */
import { BACKEND_TOPICS, BACKEND_TOPIC_BY_ID, type BackendTopicDefinition } from "./topics";
import type { BackendChunk, BackendQuestion, BackendQuestionMeta } from "./contract";

import { chunk01JavaAnnotations } from "./chunk-01-java-annotations";
import { chunk02SpringAnnotations } from "./chunk-02-spring-annotations";
import { chunk03SpringBootCore } from "./chunk-03-spring-boot-core";
import { chunk04Collections } from "./chunk-04-collections";
import { chunk05HashMap } from "./chunk-05-hashmap";
import { chunk06MultithreadingA } from "./chunk-06-multithreading-a";
import { chunk07MultithreadingB } from "./chunk-07-multithreading-b";
import { chunk08SpringSecurity } from "./chunk-08-spring-security";
import { chunk09Jwt } from "./chunk-09-jwt";
import { chunk10SqlJpa } from "./chunk-10-sql-jpa";
import { chunk11HttpRest } from "./chunk-11-http-rest";
import { chunk12Testing } from "./chunk-12-testing";
import { chunk13MessagingCaching } from "./chunk-13-messaging-caching";
import { chunk14Ops } from "./chunk-14-ops";

export type {
  BackendQuestion,
  BackendQuestionMeta,
  BackendChunk,
  BackendDifficulty,
  BackendPriority,
} from "./contract";
export { BACKEND_TOPICS, BACKEND_TOPIC_BY_ID } from "./topics";
export type { BackendTopicDefinition } from "./topics";

/** Chunks in authoring order. Ids ascend across this list. */
const CHUNKS: BackendChunk[] = [
  chunk01JavaAnnotations,
  chunk02SpringAnnotations,
  chunk03SpringBootCore,
  chunk04Collections,
  chunk05HashMap,
  chunk06MultithreadingA,
  chunk07MultithreadingB,
  chunk08SpringSecurity,
  chunk09Jwt,
  chunk10SqlJpa,
  chunk11HttpRest,
  chunk12Testing,
  chunk13MessagingCaching,
  chunk14Ops,
];

/** Expected question count per topic — a tripwire against accidental deletion. */
const EXPECTED_TOPIC_COUNTS: Record<string, number> = {
  "java-annotations": 16,
  "spring-annotations": 20,
  "spring-boot-core": 10,
  collections: 20,
  "hashmap-internals": 14,
  multithreading: 26,
  "spring-security": 18,
  jwt: 14,
  "sql-jpa": 30,
  "http-rest": 25,
  testing: 13,
  "messaging-caching": 10,
  "production-ops": 5,
};

export const BACKEND_QUESTION_TOTAL = 221;

const questionsByTopic: Record<string, BackendQuestion[]> = {};
const metaMap: Record<string, BackendQuestionMeta> = {};
const topicByQuestionId: Record<string, string> = {};

for (const chunk of CHUNKS) {
  const bucket = (questionsByTopic[chunk.topic] ??= []);
  for (const question of chunk.questions) {
    bucket.push(question);
    topicByQuestionId[question.id] = chunk.topic;
  }
  for (const [id, meta] of Object.entries(chunk.meta)) {
    metaMap[id] = meta;
  }
}

/** Flat list in topic-registry order — this is what drives "Question N of 138". */
export const allBackendQuestions: BackendQuestion[] = BACKEND_TOPICS.flatMap(
  (topic) => questionsByTopic[topic.id] ?? [],
);

export const backendQuestionsByTopicId: Record<string, BackendQuestion[]> = questionsByTopic;
export const backendQuestionMetaMap: Record<string, BackendQuestionMeta> = metaMap;
export const backendTopicIdByQuestionId: Record<string, string> = topicByQuestionId;

export interface BackendTopicSection {
  topic: BackendTopicDefinition;
  questions: BackendQuestion[];
  /** 0-based index of this topic's first question in `allBackendQuestions`. */
  startIndex: number;
}

export const backendTopicSections: BackendTopicSection[] = (() => {
  const sections: BackendTopicSection[] = [];
  let startIndex = 0;
  for (const topic of BACKEND_TOPICS) {
    const questions = questionsByTopic[topic.id] ?? [];
    sections.push({ topic, questions, startIndex });
    startIndex += questions.length;
  }
  return sections;
})();

export function getBackendQuestionMeta(id: string): BackendQuestionMeta {
  return (
    metaMap[id] ?? {
      difficulty: "medium",
      priority: "medium",
      tags: [],
    }
  );
}

export function getBackendTopicForQuestion(id: string): BackendTopicDefinition | undefined {
  const topicId = topicByQuestionId[id];
  return topicId ? BACKEND_TOPIC_BY_ID[topicId] : undefined;
}

/* ------------------------------------------------------------------------ */
/* DEV-only integrity checks                                                 */
/* ------------------------------------------------------------------------ */

if (import.meta.env?.DEV) {
  const problems: string[] = [];
  const seenIds = new Set<string>();

  for (const chunk of CHUNKS) {
    if (!BACKEND_TOPIC_BY_ID[chunk.topic]) {
      problems.push(`Unknown topic "${chunk.topic}" — add it to BACKEND_TOPICS.`);
    }
    for (const question of chunk.questions) {
      if (seenIds.has(question.id)) {
        problems.push(`Duplicate question id "${question.id}".`);
      }
      seenIds.add(question.id);

      if (!metaMap[question.id]) {
        problems.push(`Question "${question.id}" has no meta entry.`);
      }
      if (!question.question?.trim()) {
        problems.push(`Question "${question.id}" has an empty question.`);
      }
      if (!question.answer?.trim()) {
        problems.push(`Question "${question.id}" has an empty answer.`);
      }
      if (!question.explanation?.trim()) {
        problems.push(`Question "${question.id}" has no explanation.`);
      }
      if (question.code && !question.codeLanguage) {
        problems.push(`Question "${question.id}" has code but no codeLanguage.`);
      }
    }
    for (const id of Object.keys(chunk.meta)) {
      if (!chunk.questions.some((question) => question.id === id)) {
        problems.push(`Meta entry "${id}" has no matching question in its chunk.`);
      }
    }
  }

  for (const [topicId, expected] of Object.entries(EXPECTED_TOPIC_COUNTS)) {
    const actual = questionsByTopic[topicId]?.length ?? 0;
    if (actual !== expected) {
      problems.push(`Topic "${topicId}" has ${actual} questions, expected ${expected}.`);
    }
  }

  if (allBackendQuestions.length !== BACKEND_QUESTION_TOTAL) {
    problems.push(
      `Total is ${allBackendQuestions.length}, expected ${BACKEND_QUESTION_TOTAL}. ` +
        `Update BACKEND_QUESTION_TOTAL and EXPECTED_TOPIC_COUNTS together.`,
    );
  }

  if (problems.length > 0) {
    console.error(`[backendInterview] data integrity issues:\n - ${problems.join("\n - ")}`);
  }
}
