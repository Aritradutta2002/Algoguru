import { describe, expect, it } from "vitest";
import { coreJavaQuestionIndex } from "@/lib/coreJavaQuestionIndex";
import {
  CATEGORY_LABELS,
  DEFAULT_QUICK_ACCESS,
  MIN_QUERY_LENGTH,
  SEARCH_TABS,
  STATIC_SEARCH_DOCS,
  buildNoteDocs,
  groupByCategory,
  searchDocs,
  type SearchCategory,
} from "@/lib/searchIndex";

const categoryIds = SEARCH_TABS.filter((tab) => tab.id !== "all").map((tab) => tab.id);

describe("global search index", () => {
  it("indexes every tab except notes, which are user-supplied at runtime", () => {
    const present = new Set(STATIC_SEARCH_DOCS.map((doc) => doc.category));
    for (const category of categoryIds) {
      expect(CATEGORY_LABELS[category as SearchCategory]).toBeTruthy();
      if (category === "notes") continue;
      expect(present.has(category as SearchCategory)).toBe(true);
    }
  });

  it("gives every doc a unique id, a route and a title", () => {
    const ids = new Set<string>();
    for (const doc of STATIC_SEARCH_DOCS) {
      expect(ids.has(doc.id)).toBe(false);
      ids.add(doc.id);
      expect(doc.path.startsWith("/")).toBe(true);
      expect(doc.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns nothing for an empty query", () => {
    expect(searchDocs("")).toEqual([]);
    expect(searchDocs("   ")).toEqual([]);
  });

  it("ranks an exact title match first", () => {
    const [top] = searchDocs("playground");
    expect(top.title).toBe("Playground");
    expect(top.category).toBe("tools");
  });

  it("matches multi-word queries across title, subtitle and tags", () => {
    const results = searchDocs("two sum");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((doc) => doc.title.toLowerCase().includes("two sum"))).toBe(true);
  });

  it("requires every term to match", () => {
    expect(searchDocs("two sum zzzzz")).toEqual([]);
  });

  it("restricts results to the active tab", () => {
    const results = searchDocs("a", STATIC_SEARCH_DOCS, { tab: "roadmaps" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doc) => doc.category === "roadmaps")).toBe(true);
  });

  it("caps the number of returned results", () => {
    expect(searchDocs("a", STATIC_SEARCH_DOCS, { limit: 5 })).toHaveLength(5);
  });

  it("groups results into labelled buckets in tab order", () => {
    const groups = groupByCategory(searchDocs("java"));
    expect(groups.length).toBeGreaterThan(1);
    const labels = groups.map((group) => CATEGORY_LABELS[group.category]);
    expect(labels).toContain("Topics");
    groups.forEach((group) => {
      expect(group.docs.every((doc) => doc.category === group.category)).toBe(true);
    });
  });

  it("exposes quick-access defaults that all resolve", () => {
    expect(DEFAULT_QUICK_ACCESS.length).toBeGreaterThan(0);
    DEFAULT_QUICK_ACCESS.forEach((doc) => {
      expect(doc.path.startsWith("/")).toBe(true);
    });
  });

  it("needs at least two characters before searching", () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
  });
});

describe("note search", () => {
  const coreJavaQuestion = coreJavaQuestionIndex[0];

  it("resolves a core Java note back to its question page", () => {
    const [doc] = buildNoteDocs([
      { source: "core-java", questionId: coreJavaQuestion.question.id, notes: "volatile is not atomic" },
    ]);
    expect(doc?.category).toBe("notes");
    expect(doc?.path).toBe(`/interview/java/core-java-qa/${coreJavaQuestion.slug}`);
    expect(doc?.haystack).toContain("volatile");
  });

  it("falls back to the notes dashboard for unknown ids", () => {
    const [doc] = buildNoteDocs([
      { source: "practice", questionId: "does-not-exist", notes: "scratch pad" },
    ]);
    expect(doc?.path).toBe("/notes");
  });

  it("skips blank notes", () => {
    expect(
      buildNoteDocs([{ source: "core-java", questionId: coreJavaQuestion.question.id, notes: "   " }]),
    ).toEqual([]);
  });

  it("surfaces note bodies through the scorer", () => {
    const docs = buildNoteDocs([
      { source: "core-java", questionId: coreJavaQuestion.question.id, notes: "happens-before relationship" },
    ]);
    expect(searchDocs("happens-before", docs, { tab: "notes" })).toHaveLength(1);
  });
});
