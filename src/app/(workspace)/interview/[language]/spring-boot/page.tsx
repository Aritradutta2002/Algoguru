import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackendInterviewHubView from "@/features/interview/BackendInterviewHubView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Spring Boot & Backend Interview Prep | AlgoGuru",
    description:
      "Every annotation with its internals, Collections Framework, HashMap internals, multithreading, and Spring Security + JWT theory.",
  };
}

export default async function BackendInterviewHubPage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <BackendInterviewHubView language={language} />;
}
