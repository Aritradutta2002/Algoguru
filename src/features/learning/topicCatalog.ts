import { arraysContent } from "@/data/arraysContent";
import { stackQueueContent } from "@/data/stackQueueContent";
import { recursionContent, type ContentSection } from "@/data/recursionContent";
import { backtrackingContent } from "@/data/backtrackingContent";
import { dpContent } from "@/data/dpContent";
import { graphsContent } from "@/data/graphsContent";
import { bitManipulationContent } from "@/data/bitManipulationContent";
import { heapContent } from "@/data/heapContent";
import { stringsContent } from "@/data/stringsContent";
import { numberTheoryContent } from "@/data/numberTheoryContent";
import { treesContent } from "@/data/treesContent";
import { segmentTreeContent } from "@/data/segmentTreeContent";
import { advancedMathContent } from "@/data/advancedMathContent";
import { advancedTopicsContent } from "@/data/advancedTopicsContent";
import { javaContentMap } from "@/data/javaContent";
import { practiceContentMap } from "@/data/practiceContent";
import { topics, type Topic } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";

export type TopicMode = "ds" | "practice" | "lang";

export const dsContentMap: Record<string, ContentSection[]> = {
  arrays: arraysContent,
  "stack-queue": stackQueueContent,
  recursion: recursionContent,
  backtracking: backtrackingContent,
  dp: dpContent,
  graphs: graphsContent,
  bits: bitManipulationContent,
  heaps: heapContent,
  strings: stringsContent,
  "number-theory": numberTheoryContent,
  trees: treesContent,
  "segment-tree": segmentTreeContent,
  "advanced-math": advancedMathContent,
  "advanced-topics": advancedTopicsContent,
};

export interface ResolvedTopicPageData {
  topicId: string;
  detectedMode: TopicMode;
  topic: Topic;
  content: ContentSection[];
  prevTopic: Topic | null;
  nextTopic: Topic | null;
}

function resolveCollection(
  topicId: string,
): { detectedMode: TopicMode; list: Topic[]; contentMap: Record<string, ContentSection[]> } | null {
  if (topics.some((t) => t.id === topicId)) {
    return { detectedMode: "ds", list: topics, contentMap: dsContentMap };
  }
  if (practiceTopics.some((t) => t.id === topicId)) {
    return { detectedMode: "practice", list: practiceTopics, contentMap: practiceContentMap };
  }
  if (javaTopics.some((t) => t.id === topicId)) {
    return { detectedMode: "lang", list: javaTopics, contentMap: javaContentMap };
  }
  return null;
}

export function getAllTopicIds(): string[] {
  const ids = new Set<string>();

  for (const t of topics) {
    if (dsContentMap[t.id]) ids.add(t.id);
  }
  for (const t of javaTopics) {
    if (javaContentMap[t.id]) ids.add(t.id);
  }
  for (const t of practiceTopics) {
    if (practiceContentMap[t.id]) ids.add(t.id);
  }

  return Array.from(ids);
}

export function resolveTopicPageData(topicId: string): ResolvedTopicPageData | null {
  const collection = resolveCollection(topicId);
  if (!collection) return null;

  const idx = collection.list.findIndex((t) => t.id === topicId);
  const topic = idx >= 0 ? collection.list[idx] : undefined;
  const content = collection.contentMap[topicId];

  if (!topic || !content) return null;

  return {
    topicId,
    detectedMode: collection.detectedMode,
    topic,
    content,
    prevTopic: idx > 0 ? collection.list[idx - 1] : null,
    nextTopic: idx < collection.list.length - 1 ? collection.list[idx + 1] : null,
  };
}
