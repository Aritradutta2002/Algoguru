import { useParams } from "react-router-dom";
import InterviewComingSoonLayout from "./InterviewComingSoonLayout";
import InterviewCppQuestionsPage from "./InterviewCppQuestionsPage";
import InterviewPythonQuestionsPage from "./InterviewPythonQuestionsPage";
import InterviewCppQuestionDetailPage from "./InterviewCppQuestionDetailPage";
import InterviewPythonQuestionDetailPage from "./InterviewPythonQuestionDetailPage";

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
  if (language === "cpp") {
    return <InterviewCppQuestionsPage />;
  }
  if (language === "python") {
    return <InterviewPythonQuestionsPage />;
  }
  const title = isInterviewLanguage(language)
    ? `${LANGUAGE_LABELS[language]} Questions`
    : "Language Questions";

  return <InterviewComingSoonLayout title={title} />;
}

export function InterviewLanguageQuestionDetailPage() {
  const { language } = useParams<{ language?: string }>();
  if (language === "python") {
    return <InterviewPythonQuestionDetailPage />;
  }
  return <InterviewCppQuestionDetailPage />;
}
