import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/layout/RouteFallback";
import BackendQuestionsView from "@/features/interview/BackendQuestionsView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Spring Boot & Backend Interview Questions | AlgoGuru",
    description:
      "In-depth Spring Boot, Java collections, concurrency, Spring Security, and JWT interview questions with full answers and code.",
  };
}

export default async function BackendQuestionsPage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BackendQuestionsView language={language} />
    </Suspense>
  );
}
