import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewCoreJavaQuestionDetailView from "@/features/interview/InterviewCoreJavaQuestionDetailView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";
import { getCoreJavaQuestionBySlug } from "@/lib/coreJavaQuestionIndex";

interface PageProps {
  params: Promise<{ language: string; questionSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionSlug } = await params;
  const entry = getCoreJavaQuestionBySlug(questionSlug);
  if (!entry) {
    return { title: "Core Java Interview Question | AlgoGuru" };
  }
  return {
    title: `${entry.question.question} — Core Java Interview | AlgoGuru`,
    description: entry.question.explanation || entry.question.question,
  };
}

export default async function InterviewCoreJavaQuestionDetailPage({
  params,
}: PageProps) {
  const { language, questionSlug } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <InterviewCoreJavaQuestionDetailView
      language={language}
      questionSlug={questionSlug}
    />
  );
}
