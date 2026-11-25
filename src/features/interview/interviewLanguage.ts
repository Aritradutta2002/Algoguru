export type InterviewLanguage = "java" | "cpp" | "python";

export const INTERVIEW_LANGUAGES: readonly InterviewLanguage[] = [
  "java",
  "cpp",
  "python",
];

export const INTERVIEW_LANGUAGE_LABELS: Record<InterviewLanguage, string> = {
  java: "Java",
  cpp: "C++",
  python: "Python",
};

export function isInterviewLanguage(
  value: string | undefined,
): value is InterviewLanguage {
  return value === "java" || value === "cpp" || value === "python";
}
