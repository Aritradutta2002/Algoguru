import { cppInterviewTopics } from "@/data/cppInterviewData";
import type { InterviewTopic, InterviewQuestion } from "@/data/coreJavaInterviewData";
import { getCppQuestionMeta, getCppQuestionSlug, type CppQuestionMeta } from "@/data/cppInterviewMetadata";

export interface IndexedCppQuestion {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: CppQuestionMeta;
}

const _buildIndex = (): IndexedCppQuestion[] => {
  const index: IndexedCppQuestion[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  let position = 0;
  for (const topic of cppInterviewTopics) {
    for (const question of topic.questions) {
      if (seenIds.has(question.id)) {
        console.warn(`[cppQuestionIndex] Duplicate id "${question.id}" ignored.`);
        continue;
      }
      const slug = getCppQuestionSlug(question);
      if (seenSlugs.has(slug)) console.warn(`[cppQuestionIndex] Duplicate slug "${slug}" for "${question.id}".`);
      seenIds.add(question.id);
      seenSlugs.add(slug);
      index.push({ question, topic, index: position, slug, meta: getCppQuestionMeta(question.id) });
      position += 1;
    }
  }
  return index;
};

export const cppQuestionIndex: IndexedCppQuestion[] = _buildIndex();

const byId = new Map(cppQuestionIndex.map((e) => [e.question.id, e]));
const bySlug = new Map(cppQuestionIndex.map((e) => [e.slug, e]));

export function getAllCppQuestions(): IndexedCppQuestion[] { return cppQuestionIndex; }
export function getCppQuestionById(id: string): IndexedCppQuestion | undefined { return byId.get(id); }
export function getCppQuestionBySlug(slug: string): IndexedCppQuestion | undefined { return bySlug.get(slug); }
export function getCppTopicByQuestionId(id: string): InterviewTopic | undefined { return byId.get(id)?.topic; }
export function getAdjacentCppQuestions(id: string): { previous?: IndexedCppQuestion; next?: IndexedCppQuestion } {
  const entry = byId.get(id);
  if (!entry) return {};
  return { previous: cppQuestionIndex[entry.index - 1], next: cppQuestionIndex[entry.index + 1] };
}
export function getTotalCppQuestionCount(): number { return cppQuestionIndex.length; }
export function getCppTopicCount(): number { return cppInterviewTopics.length; }
