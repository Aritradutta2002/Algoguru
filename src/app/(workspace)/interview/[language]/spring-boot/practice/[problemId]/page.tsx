import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PRACTICE_PROBLEM_BY_ID } from "@/data/backendInterview/practiceProblems";
import BackendPracticeDetailView from "@/features/interview/BackendPracticeDetailView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string; problemId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { problemId } = await params;
  const problem = PRACTICE_PROBLEM_BY_ID[problemId];
  if (!problem) {
    return { title: "Practice Problem | AlgoGuru" };
  }
  return {
    title: `${problem.title} — Practice | AlgoGuru`,
    description: problem.scenario.split("\n\n")[0]?.slice(0, 160),
  };
}

export default async function BackendPracticeDetailPage({ params }: PageProps) {
  const { language, problemId } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <BackendPracticeDetailView language={language} problemId={problemId} />
  );
}
