import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackendPracticeView from "@/features/interview/BackendPracticeView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Backend Practice Lab | AlgoGuru",
    description:
      "Scenario-driven backend engineering exercises with acceptance criteria, progressive hints, and worked solutions.",
  };
}

export default async function BackendPracticePage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <BackendPracticeView language={language} />;
}
