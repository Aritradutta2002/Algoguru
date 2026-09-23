import { describe, it, expect } from "vitest";
import {
  computeCoggleLayout,
  COGGLE_DIMENSIONS,
} from "@/components/roadmap/coggleLayout";
import { dsaRoadmap } from "@/data/dsaRoadmap";
import { javaRoadmap } from "@/data/javaRoadmap";
import { systemDesignRoadmap } from "@/data/systemDesignRoadmap";

const base = {
  progress: {},
  collapsedNodeIds: new Set<string>(),
  searchQuery: "",
  statusFilter: "all" as const,
  onToggleCollapse: () => {},
  onSelectNode: () => {},
};

describe("Coggle Layout Engine (computeCoggleLayout)", () => {
  it("generates a radial layout for DSA with a centered root and left/right wings", () => {
    const result = computeCoggleLayout({ roadmap: dsaRoadmap, ...base });

    expect(result.nodes.length).toBeGreaterThan(15);
    expect(result.edges.length).toBeGreaterThan(15);

    // Root node verification
    const rootNode = result.nodes.find((n) => n.id === "root");
    expect(rootNode).toBeDefined();
    expect(rootNode?.data.isRoot).toBe(true);

    // Left-wing nodes (side === "left") sit left of center
    const leftNodes = result.nodes.filter((n) => n.data.side === "left");
    const rightNodes = result.nodes.filter((n) => n.data.side === "right");
    expect(leftNodes.length).toBeGreaterThan(0);
    expect(rightNodes.length).toBeGreaterThan(0);

    leftNodes.forEach((node) => {
      expect(node.position.x).toBeLessThan(0);
    });

    rightNodes
      .filter((n) => n.id !== "root")
      .forEach((node) => {
        expect(node.position.x).toBeGreaterThan(0);
      });
  });

  it("places up-wing nodes above center and down-wing nodes below center", () => {
    const result = computeCoggleLayout({ roadmap: dsaRoadmap, ...base });

    const upNodes = result.nodes.filter((n) => n.data.side === "up");
    const downNodes = result.nodes.filter((n) => n.data.side === "down");

    expect(upNodes.length).toBeGreaterThan(0);
    expect(downNodes.length).toBeGreaterThan(0);

    // Up nodes live entirely above the root box (root top edge < 0)
    upNodes.forEach((node) => {
      const bottom = node.position.y + COGGLE_DIMENSIONS.PILL_HEIGHT;
      expect(bottom).toBeLessThanOrEqual(0);
    });

    // Down nodes start below the root box
    downNodes.forEach((node) => {
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    });
  });

  it("collapses category branches and hides child nodes when collapsedNodeIds has the category id", () => {
    const fullResult = computeCoggleLayout({ roadmap: dsaRoadmap, ...base });

    const categoryToCollapse = "cat-Linear";
    const collapsedResult = computeCoggleLayout({
      roadmap: dsaRoadmap,
      ...base,
      collapsedNodeIds: new Set([categoryToCollapse]),
    });

    expect(collapsedResult.nodes.length).toBeLessThan(fullResult.nodes.length);
    const catNode = collapsedResult.nodes.find((n) => n.id === categoryToCollapse);
    expect(catNode?.data.isCollapsed).toBe(true);
    expect(catNode?.data.hasChildren).toBe(true);
  });

  it("highlights search matches and counts matching nodes", () => {
    const result = computeCoggleLayout({
      roadmap: dsaRoadmap,
      ...base,
      searchQuery: "binary search",
    });

    expect(result.matchedCount).toBeGreaterThan(0);
    const matchedNode = result.nodes.find((n) => n.id === "binary-search");
    expect(matchedNode?.data.matchedSearch).toBe(true);
  });

  it("lays out the large Java roadmap (56 topics) across all four directions", () => {
    const result = computeCoggleLayout({ roadmap: javaRoadmap, ...base });

    expect(result.totalNodes).toBe(56);
    expect(result.nodes.length).toBeGreaterThan(50);

    const categories = result.nodes.filter((n) => n.data.isCategory);
    const dirs = new Set(categories.map((n) => n.data.side));

    // Java is configured: 3 left, 3 right, 2 up, 2 down
    expect(dirs.has("left")).toBe(true);
    expect(dirs.has("right")).toBe(true);
    expect(dirs.has("up")).toBe(true);
    expect(dirs.has("down")).toBe(true);

    const countBy = (side: string) =>
      categories.filter((n) => n.data.side === side).length;
    expect(countBy("left")).toBe(3);
    expect(countBy("right")).toBe(3);
    expect(countBy("up")).toBe(2);
    expect(countBy("down")).toBe(2);
  });

  it("lays out the System Design roadmap (56 topics) with balanced wings", () => {
    const result = computeCoggleLayout({ roadmap: systemDesignRoadmap, ...base });

    expect(result.totalNodes).toBe(56);
    expect(result.nodes.length).toBeGreaterThan(50);

    const categories = result.nodes.filter((n) => n.data.isCategory);
    const countBy = (side: string) =>
      categories.filter((n) => n.data.side === side).length;

    expect(countBy("left")).toBeGreaterThanOrEqual(3);
    expect(countBy("right")).toBeGreaterThanOrEqual(3);
    expect(countBy("up")).toBeGreaterThanOrEqual(1);
    expect(countBy("down")).toBeGreaterThanOrEqual(1);
  });

  it("keeps the four wings from overlapping around the root", () => {
    const result = computeCoggleLayout({ roadmap: javaRoadmap, ...base });

    const root = result.nodes.find((n) => n.id === "root")!;
    const rootHalfW = (root.measured?.width ?? root.data.pillWidth ?? 300) / 2;

    // Every left-wing node clears the root's left edge
    result.nodes
      .filter((n) => n.data.side === "left" && n.id !== "root")
      .forEach((n) => {
        expect(n.position.x + (n.data.pillWidth ?? 0)).toBeLessThan(-rootHalfW);
      });

    // Every right-wing node clears the root's right edge
    result.nodes
      .filter((n) => n.data.side === "right" && n.id !== "root")
      .forEach((n) => {
        expect(n.position.x).toBeGreaterThan(rootHalfW);
      });

    // Up-wing nodes never dip below the root's top edge, down-wing never above bottom
    const rootTop = root.position.y;
    const rootBottom = root.position.y + COGGLE_DIMENSIONS.ROOT_HEIGHT;
    result.nodes
      .filter((n) => n.data.side === "up" && n.id !== "root")
      .forEach((n) => {
        expect(n.position.y + COGGLE_DIMENSIONS.PILL_HEIGHT).toBeLessThanOrEqual(
          rootTop + 1
        );
      });
    result.nodes
      .filter((n) => n.data.side === "down")
      .forEach((n) => {
        expect(n.position.y).toBeGreaterThanOrEqual(rootBottom - 1);
      });
  });
});
