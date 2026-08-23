import type { InterviewTopic, InterviewQuestion } from "@/data/coreJavaInterviewData";

export type Difficulty = "easy" | "medium" | "hard";
export type InterviewPriority = "low" | "medium" | "high" | "very-high";

export interface PyQuestionMeta {
  slug?: string;
  difficulty?: Difficulty;
  priority?: InterviewPriority;
  tags?: string[];
  relatedQuestionIds?: string[];
  estimatedReadMinutes?: number;
  pythonVersions?: string[];
}

export type { InterviewTopic, InterviewQuestion };

export function slugifyPython(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
