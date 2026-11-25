import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewDataStructureView from "@/features/interview/InterviewDataStructureView";
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
    title: `Data Structure for Interview (${label}) | AlgoGuru`,
    description: `Interview-focused data structures preparation track for ${label}.`,
  };
}

export default async function InterviewDataStructurePage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <InterviewDataStructureView language={language} />;
}
