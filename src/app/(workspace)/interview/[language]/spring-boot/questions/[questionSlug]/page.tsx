import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackendQuestionDetailView from "@/features/interview/BackendQuestionDetailView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";
import { getBackendQuestionBySlug } from "@/lib/backendQuestionIndex";

interface PageProps {
  params: Promise<{ language: string; questionSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionSlug } = await params;
  const entry = getBackendQuestionBySlug(questionSlug);
  if (!entry) {
    return { title: "Backend Interview Question | AlgoGuru" };
  }
  return {
    title: `${entry.question.question} — Backend Interview | AlgoGuru`,
    description: entry.question.explanation || entry.question.question,
  };
}

export default async function BackendQuestionDetailPage({ params }: PageProps) {
  const { language, questionSlug } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <BackendQuestionDetailView
      language={language}
      questionSlug={questionSlug}
    />
  );
}
