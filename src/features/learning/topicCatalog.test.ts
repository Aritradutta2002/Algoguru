import { describe, expect, it } from "vitest";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { getAllTopicIds, resolveTopicPageData } from "./topicCatalog";

describe("topicCatalog", () => {
  it("covers all DS, Java, and Practice topic IDs for generateStaticParams", () => {
    const ids = getAllTopicIds();
    const expectedIds = [
      ...topics.map((t) => t.id),
      ...javaTopics.map((t) => t.id),
      ...practiceTopics.map((t) => t.id),
    ];

    expect(ids.length).toBe(expectedIds.length);
    for (const expectedId of expectedIds) {
      expect(ids).toContain(expectedId);
    }
  });

  it("resolves metadata, content, mode, and neighbors for every valid topicId", () => {
    for (const id of getAllTopicIds()) {
      const resolved = resolveTopicPageData(id);
      expect(resolved).not.toBeNull();
      expect(resolved?.topic.id).toBe(id);
      expect(resolved?.content.length).toBeGreaterThan(0);
    }

    expect(resolveTopicPageData("arrays")?.detectedMode).toBe("ds");
    expect(resolveTopicPageData("java-basics")?.detectedMode).toBe("lang");
    expect(resolveTopicPageData("practice-arrays")?.detectedMode).toBe("practice");
  });

  it("returns null for unknown topic IDs so route triggers notFound()", () => {
    expect(resolveTopicPageData("non-existent-topic")).toBeNull();
    expect(resolveTopicPageData("")).toBeNull();
  });
});
