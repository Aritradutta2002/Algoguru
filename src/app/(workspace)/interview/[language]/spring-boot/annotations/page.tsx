import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackendAnnotationsView from "@/features/interview/BackendAnnotationsView";
import { isInterviewLanguage } from "@/features/interview/interviewLanguage";

interface PageProps {
  params: Promise<{ language: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Java & Spring Annotation Reference | AlgoGuru",
    description:
      "Searchable catalogue of Java and Spring annotations: targets, runtime processing, code examples, and common gotchas.",
  };
}

export default async function BackendAnnotationsPage({ params }: PageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }
  return <BackendAnnotationsView language={language} />;
}
