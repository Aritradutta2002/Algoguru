import type { Metadata } from "next";
import InterviewHubView from "@/features/interview/InterviewHubView";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Interview Preparation | AlgoGuru",
    description:
      "Select your language and focused interview track across Java, C++, Python, Spring Boot, and System Design.",
  };
}

export default async function InterviewPage() {
  return <InterviewHubView />;
}
