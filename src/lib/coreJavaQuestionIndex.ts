import { coreJavaInterviewTopics, type InterviewQuestion, type InterviewTopic } from "@/data/coreJavaInterviewData";
import {
  getCoreJavaQuestionMeta,
  getCoreJavaQuestionSlug,
  type CoreJavaQuestionMeta,
} from "@/data/coreJavaInterviewMetadata";

export interface IndexedCoreJavaQuestion {
  question: InterviewQuestion;
  topic: InterviewTopic;
  /** 0-based position across the whole flat question list. */
  index: number;
  slug: string;
  meta: CoreJavaQuestionMeta;
}

const _buildIndex = (): IndexedCoreJavaQuestion[] => {
  const index: IndexedCoreJavaQuestion[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  let position = 0;
  for (const topic of coreJavaInterviewTopics) {
    for (const question of topic.questions) {
      if (seenIds.has(question.id)) {
        // Data integrity guard — duplicate ids break progress/bookmarks.
        console.warn(`[coreJavaQuestionIndex] Duplicate question id "${question.id}" ignored.`);
        continue;
      }
      const slug = getCoreJavaQuestionSlug(question);
      if (seenSlugs.has(slug)) {
        console.warn(`[coreJavaQuestionIndex] Duplicate slug "${slug}" for "${question.id}".`);
      }
      seenIds.add(question.id);
      seenSlugs.add(slug);

      index.push({
        question,
        topic,
        index: position,
        slug,
        meta: getCoreJavaQuestionMeta(question.id),
      });
      position += 1;
    }
  }
  return index;
};

export const coreJavaQuestionIndex: IndexedCoreJavaQuestion[] = _buildIndex();

const byId = new Map(coreJavaQuestionIndex.map((entry) => [entry.question.id, entry]));
const bySlug = new Map(coreJavaQuestionIndex.map((entry) => [entry.slug, entry]));

export function getAllCoreJavaQuestions(): IndexedCoreJavaQuestion[] {
  return coreJavaQuestionIndex;
}

export function getCoreJavaQuestionById(id: string): IndexedCoreJavaQuestion | undefined {
  return byId.get(id);
}

export function getCoreJavaQuestionBySlug(slug: string): IndexedCoreJavaQuestion | undefined {
  return bySlug.get(slug);
}

export function getCoreJavaTopicByQuestionId(id: string): InterviewTopic | undefined {
  return byId.get(id)?.topic;
}

export function getAdjacentCoreJavaQuestions(
  id: string
): { previous?: IndexedCoreJavaQuestion; next?: IndexedCoreJavaQuestion } {
  const entry = byId.get(id);
  if (!entry) return {};
  return {
    previous: coreJavaQuestionIndex[entry.index - 1],
    next: coreJavaQuestionIndex[entry.index + 1],
  };
}

export function getCoreJavaQuestionByGlobalNumber(number: number): IndexedCoreJavaQuestion | undefined {
  // 1-based global question number.
  return coreJavaQuestionIndex[number - 1];
}

export function getTotalCoreJavaQuestionCount(): number {
  return coreJavaQuestionIndex.length;
}

export function getCoreJavaTopicCount(): number {
  return coreJavaInterviewTopics.length;
}
