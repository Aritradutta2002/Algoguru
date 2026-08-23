import { pythonInterviewTopics } from "@/data/pythonInterviewData";
import type { InterviewTopic, InterviewQuestion } from "@/data/coreJavaInterviewData";
import {
  getPythonQuestionMeta,
  getPythonQuestionSlug,
  type PyQuestionMeta,
} from "@/data/pythonInterviewMetadata";

export interface IndexedPythonQuestion {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: PyQuestionMeta;
}

const _buildIndex = (): IndexedPythonQuestion[] => {
  const index: IndexedPythonQuestion[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  let position = 0;
  for (const topic of pythonInterviewTopics) {
    for (const question of topic.questions) {
      if (seenIds.has(question.id)) {
        console.warn(`[pythonQuestionIndex] Duplicate id "${question.id}" ignored.`);
        continue;
      }
      const slug = getPythonQuestionSlug(question);
      if (seenSlugs.has(slug)) console.warn(`[pythonQuestionIndex] Duplicate slug "${slug}" for "${question.id}".`);
      seenIds.add(question.id);
      seenSlugs.add(slug);
      index.push({ question, topic, index: position, slug, meta: getPythonQuestionMeta(question.id) });
      position += 1;
    }
  }
  return index;
};

export const pythonQuestionIndex: IndexedPythonQuestion[] = _buildIndex();

const byId = new Map(pythonQuestionIndex.map((e) => [e.question.id, e]));
const bySlug = new Map(pythonQuestionIndex.map((e) => [e.slug, e]));

export function getAllPythonQuestions(): IndexedPythonQuestion[] { return pythonQuestionIndex; }
export function getPythonQuestionById(id: string): IndexedPythonQuestion | undefined { return byId.get(id); }
export function getPythonQuestionBySlug(slug: string): IndexedPythonQuestion | undefined { return bySlug.get(slug); }
export function getAdjacentPythonQuestions(id: string): { previous?: IndexedPythonQuestion; next?: IndexedPythonQuestion } {
  const entry = byId.get(id);
  if (!entry) return {};
  return { previous: pythonQuestionIndex[entry.index - 1], next: pythonQuestionIndex[entry.index + 1] };
}
export function getTotalQuestionCount(): number { return pythonQuestionIndex.length; }
export function getPythonTopicCount(): number { return pythonInterviewTopics.length; }
