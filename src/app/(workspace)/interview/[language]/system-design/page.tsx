import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InterviewSystemDesignView from "@/features/interview/InterviewSystemDesignView";
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
    title: `System Design Interview Questions (${label}) | AlgoGuru`,
    description:
      "Curated high-level and low-level system design interview questions, visual diagrams, and architectural trade-offs.",
  };
}

export default async function InterviewSystemDesignPage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <InterviewSystemDesignView language={language} />;
}
