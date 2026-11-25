"use client";

import { useParams } from "next/navigation";
import InterviewComingSoonLayout from "./InterviewComingSoonLayout";
import InterviewCppQuestionsView from "./InterviewCppQuestionsView";
import InterviewPythonQuestionsView from "./InterviewPythonQuestionsView";
import InterviewLanguageQuestionDetailView from "./InterviewLanguageQuestionDetailView";
import {
  INTERVIEW_LANGUAGE_LABELS,
  isInterviewLanguage,
} from "./interviewLanguage";

export default function InterviewLanguageQuestionsView({
  language: languageProp,
}: {
  language?: string;
}) {
  const params = useParams<{ language?: string }>();
  const language = languageProp ?? params.language;

  if (language === "cpp") {
    return <InterviewCppQuestionsView language={language} />;
  }
  if (language === "python") {
    return <InterviewPythonQuestionsView language={language} />;
  }

  const title = isInterviewLanguage(language)
    ? `${INTERVIEW_LANGUAGE_LABELS[language]} Questions`
    : "Language Questions";

  return <InterviewComingSoonLayout title={title} language={language} />;
}

export { InterviewLanguageQuestionDetailView };
