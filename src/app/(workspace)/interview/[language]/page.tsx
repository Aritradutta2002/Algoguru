import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CppInterviewHubView from "@/features/interview/CppInterviewHubView";
import InterviewHubView from "@/features/interview/InterviewHubView";
import JavaInterviewHubView from "@/features/interview/JavaInterviewHubView";
import PythonInterviewHubView from "@/features/interview/PythonInterviewHubView";
import {
  INTERVIEW_LANGUAGE_LABELS,
  isInterviewLanguage,
} from "@/features/interview/interviewLanguage";

interface LanguagePageProps {
  params: Promise<{ language: string }>;
}

const LANGUAGE_DESCRIPTIONS: Record<"java" | "cpp" | "python", string> = {
  java: "Study the questions Java backend interviewers ask, in curriculum order, with full answers, practice labs and a fast revision path.",
  cpp: "Structured path through C++ basics, memory & RAII, pointers, OOP, STL, templates, concurrency and modern C++.",
  python:
    "Structured path through Python basics, strings & collections, functions & generators, OOP & decorators, I/O & memory, and concurrency.",
};

export async function generateMetadata({
  params,
}: LanguagePageProps): Promise<Metadata> {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    return { title: "Interview Preparation | AlgoGuru" };
  }
  if (language === "java") {
    return {
      title: "Java Backend Interview Preparation | AlgoGuru",
      description: LANGUAGE_DESCRIPTIONS.java,
    };
  }
  const label = INTERVIEW_LANGUAGE_LABELS[language];
  return {
    title: `${label} Interview Preparation | AlgoGuru`,
    description: LANGUAGE_DESCRIPTIONS[language],
  };
}

export default async function InterviewLanguagePage({
  params,
}: LanguagePageProps) {
  const { language } = await params;
  if (!isInterviewLanguage(language)) {
    redirect("/interview");
  }

  switch (language) {
    case "java":
      return <JavaInterviewHubView />;
    case "cpp":
      return <CppInterviewHubView />;
    case "python":
      return <PythonInterviewHubView />;
    default:
      return <InterviewHubView language={language} />;
  }
}
