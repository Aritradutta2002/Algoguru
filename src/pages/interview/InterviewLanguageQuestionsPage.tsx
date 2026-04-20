import { useParams } from "react-router-dom";
import InterviewComingSoonLayout from "./InterviewComingSoonLayout";

type InterviewLanguage = "java" | "cpp" | "python";

const LANGUAGE_LABELS: Record<InterviewLanguage, string> = {
  java: "Java",
  cpp: "C++",
  python: "Python",
};

const isInterviewLanguage = (value: string | undefined): value is InterviewLanguage =>
  value === "java" || value === "cpp" || value === "python";

export default function InterviewLanguageQuestionsPage() {
  const { language } = useParams<{ language?: string }>();
  const title = isInterviewLanguage(language)
    ? `${LANGUAGE_LABELS[language]} Questions`
    : "Language Questions";

  return <InterviewComingSoonLayout title={title} />;
}
