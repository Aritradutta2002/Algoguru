import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/layout/RouteFallback";
import InterviewLanguageQuestionsView from "@/features/interview/InterviewLanguageQuestionsView";
import {
  INTERVIEW_LANGUAGE_LABELS,
  isInterviewLanguage,
} from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { language } = await params;
  const label = isInterviewLanguage(language)
    ? INTERVIEW_LANGUAGE_LABELS[language]
    : "Language";
  return {
    title: `${label} Interview Questions | AlgoGuru`,
    description: `Curated ${label} interview questions with detailed answers, code examples, and study tracking.`,
  };
}

export default async function InterviewLanguageQuestionsPage({
  params,
}: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <InterviewLanguageQuestionsView language={language} />
    </Suspense>
  );
}
