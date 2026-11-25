import type { Metadata } from "next";
import { CodingContestSessionView } from "@/features/contest/CodingContestSessionView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: "Coding Contest Session — AlgoGuru",
    description: `Active timed Java coding contest session (${sessionId}).`,
  };
}

export default async function CodingContestSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <CodingContestSessionView sessionId={sessionId} />;
}
