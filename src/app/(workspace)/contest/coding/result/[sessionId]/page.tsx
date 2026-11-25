import type { Metadata } from "next";
import { CodingContestResultView } from "@/features/contest/CodingContestResultView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: "Coding Contest Result — AlgoGuru",
    description: `Evaluation summary and per-problem results for contest session ${sessionId}.`,
  };
}

export default async function CodingContestResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <CodingContestResultView sessionId={sessionId} />;
}
