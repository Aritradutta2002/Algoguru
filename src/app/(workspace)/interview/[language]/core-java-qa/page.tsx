import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/layout/RouteFallback";
import InterviewCoreJavaQuestionsView from "@/features/interview/InterviewCoreJavaQuestionsView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Core Java Interview Questions | AlgoGuru",
    description:
      "Most asked Core Java interview questions, answers, diagrams, and runnable code examples.",
  };
}

export default async function InterviewCoreJavaQuestionsPage({
  params,
}: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InterviewCoreJavaQuestionsView language={language} />
    </Suspense>
  );
}
