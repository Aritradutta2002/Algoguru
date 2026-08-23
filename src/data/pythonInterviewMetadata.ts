import type { InterviewQuestion } from "@/data/coreJavaInterviewData";
import {
  slugifyPython,
  type Difficulty,
  type InterviewPriority,
  type PyQuestionMeta,
} from "./pythonInterviewMetadataBase";
import { pythonMetaPart1, pythonMetaPart2, pythonMetaPart3 } from "./pythonMetaParts123";
import { pythonMetaPart4 } from "./pythonDataOopDecorators";
import { pythonMetaPart5 } from "./pythonDataIoModulesMemory";
import { pythonMetaPart6 } from "./pythonDataConcurrencyAdvanced";

export type { Difficulty, InterviewPriority, PyQuestionMeta };

const PART_METAS: Record<string, PyQuestionMeta>[] = [
  pythonMetaPart1,
  pythonMetaPart2,
  pythonMetaPart3,
  pythonMetaPart4,
  pythonMetaPart5,
  pythonMetaPart6,
];

export const PYTHON_QUESTION_META: Record<string, PyQuestionMeta> = Object.assign(
  {},
  ...PART_METAS
);

export const PYTHON_SLUG_OVERRIDES: Record<string, string> = {};

export const PYTHON_QUESTION_BASE_PATH = "/interview/python/language-questions";

export function getPythonQuestionMeta(id: string): PyQuestionMeta {
  return PYTHON_QUESTION_META[id] ?? {};
}

export function getPythonQuestionSlug(question: InterviewQuestion): string {
  const meta = PYTHON_QUESTION_META[question.id];
  if (meta?.slug) return meta.slug;
  return PYTHON_SLUG_OVERRIDES[question.id] ?? slugifyPython(question.question);
}

export function getPythonQuestionDetailPath(question: InterviewQuestion): string {
  return `${PYTHON_QUESTION_BASE_PATH}/${getPythonQuestionSlug(question)}`;
}
