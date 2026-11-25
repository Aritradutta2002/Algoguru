"use client";

import { useParams } from "next/navigation";
import InterviewCppQuestionDetailView from "./InterviewCppQuestionDetailView";
import InterviewPythonQuestionDetailView from "./InterviewPythonQuestionDetailView";

export default function InterviewLanguageQuestionDetailView({
  language: languageProp,
  questionSlug,
}: {
  language?: string;
  questionSlug?: string;
}) {
  const params = useParams<{ language?: string; questionSlug?: string }>();
  const language = languageProp ?? params.language;

  if (language === "python") {
    return (
      <InterviewPythonQuestionDetailView
        language={language}
        questionSlug={questionSlug}
      />
    );
  }
  return (
    <InterviewCppQuestionDetailView
      language={language}
      questionSlug={questionSlug}
    />
  );
}
