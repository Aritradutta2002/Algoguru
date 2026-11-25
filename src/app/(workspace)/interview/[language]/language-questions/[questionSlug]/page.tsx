import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewLanguageQuestionDetailView from "@/features/interview/InterviewLanguageQuestionDetailView";
import {
  INTERVIEW_LANGUAGE_LABELS,
  isInterviewLanguage,
} from "@/features/interview/interviewLanguage";
import { getCppQuestionBySlug } from "@/lib/cppQuestionIndex";
import { getPythonQuestionBySlug } from "@/lib/pythonQuestionIndex";

interface PageProps {
  params: Promise<{ language: string; questionSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { language, questionSlug } = await params;
  if (!isInterviewLanguage(language)) {
    return { title: "Interview Question | AlgoGuru" };
  }
  const label = INTERVIEW_LANGUAGE_LABELS[language];
  const entry =
    language === "python"
      ? getPythonQuestionBySlug(questionSlug)
      : getCppQuestionBySlug(questionSlug);

  if (!entry) {
    return { title: `${label} Interview Question | AlgoGuru` };
  }

  return {
    title: `${entry.question.question} — ${label} Interview | AlgoGuru`,
    description: entry.question.explanation || entry.question.question,
  };
}

export default async function InterviewLanguageQuestionDetailPage({
  params,
}: PageProps) {
  const { language, questionSlug } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <InterviewLanguageQuestionDetailView
      language={language}
      questionSlug={questionSlug}
    />
  );
}
