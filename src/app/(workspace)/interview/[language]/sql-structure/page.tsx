import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewSqlStructureView from "@/features/interview/InterviewSqlStructureView";
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
    : "Interview";
  return {
    title: `SQL Structure (${label}) | AlgoGuru`,
    description: `Interview-focused SQL concepts and query patterns for ${label} candidates.`,
  };
}

export default async function InterviewSqlStructurePage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <InterviewSqlStructureView language={language} />;
}
