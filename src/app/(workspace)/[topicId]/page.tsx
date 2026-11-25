import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicView } from "@/features/learning/TopicView";
import { getAllTopicIds, resolveTopicPageData } from "@/features/learning/topicCatalog";

export async function generateStaticParams() {
  return getAllTopicIds().map((topicId) => ({ topicId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicId: string }>;
}): Promise<Metadata> {
  const { topicId } = await params;
  const resolved = resolveTopicPageData(topicId);
  if (!resolved) {
    return { title: "Topic not found — AlgoGuru" };
  }

  return {
    title: `${resolved.topic.title} — AlgoGuru`,
    description: resolved.topic.description,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const resolved = resolveTopicPageData(topicId);

  if (!resolved) {
    notFound();
  }

  return (
    <TopicView
      topicId={resolved.topicId}
      detectedMode={resolved.detectedMode}
      topic={resolved.topic}
      content={resolved.content}
      prevTopic={resolved.prevTopic}
      nextTopic={resolved.nextTopic}
    />
  );
}
