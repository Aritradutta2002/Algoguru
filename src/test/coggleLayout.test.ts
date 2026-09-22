import { describe, it, expect } from "vitest";
import { computeCoggleLayout } from "@/components/roadmap/coggleLayout";
import { dsaRoadmap } from "@/data/dsaRoadmap";
import { javaRoadmap } from "@/data/javaRoadmap";
import { systemDesignRoadmap } from "@/data/systemDesignRoadmap";

describe("Coggle Layout Engine (computeCoggleLayout)", () => {
  it("generates a bidirectional layout for DSA with a centered root and left/right wings", () => {
    const result = computeCoggleLayout({
      roadmap: dsaRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      searchQuery: "",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    expect(result.nodes.length).toBeGreaterThan(15);
    expect(result.edges.length).toBeGreaterThan(15);

    // Root node verification
    const rootNode = result.nodes.find((n) => n.id === "root");
    expect(rootNode).toBeDefined();
    expect(rootNode?.data.isRoot).toBe(true);

    // Verify presence of left-wing and right-wing nodes
    const leftNodes = result.nodes.filter((n) => n.data.side === "left");
    const rightNodes = result.nodes.filter((n) => n.data.side === "right");

    expect(leftNodes.length).toBeGreaterThan(0);
    expect(rightNodes.length).toBeGreaterThan(0);

    // Left nodes should have negative x coordinates (to the left of root)
    leftNodes.forEach((node) => {
      expect(node.position.x).toBeLessThan(0);
    });

    // Right nodes (excluding root itself) should have positive x coordinates
    rightNodes
      .filter((n) => n.id !== "root")
      .forEach((node) => {
        expect(node.position.x).toBeGreaterThan(0);
      });
  });

  it("collapses category branches and hides child nodes when collapsedNodeIds has the category id", () => {
    const fullResult = computeCoggleLayout({
      roadmap: dsaRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      searchQuery: "",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    const categoryToCollapse = "cat-Linear";
    const collapsedResult = computeCoggleLayout({
      roadmap: dsaRoadmap,
      progress: {},
      collapsedNodeIds: new Set([categoryToCollapse]),
      searchQuery: "",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    // Nodes in the collapsed result should be strictly fewer than in the full result
    expect(collapsedResult.nodes.length).toBeLessThan(fullResult.nodes.length);
    const catNode = collapsedResult.nodes.find((n) => n.id === categoryToCollapse);
    expect(catNode?.data.isCollapsed).toBe(true);
    expect(catNode?.data.hasChildren).toBe(true);
  });

  it("highlights search matches and counts matching nodes", () => {
    const result = computeCoggleLayout({
      roadmap: dsaRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      searchQuery: "binary search",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    expect(result.matchedCount).toBeGreaterThan(0);
    const matchedNode = result.nodes.find((n) => n.id === "binary-search");
    expect(matchedNode?.data.matchedSearch).toBe(true);
  });

  it("lays out the large Java roadmap (56 topics) with left and right wings", () => {
    const result = computeCoggleLayout({
      roadmap: javaRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      searchQuery: "",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    expect(result.totalNodes).toBe(56);
    expect(result.nodes.length).toBeGreaterThan(50);

    const leftCategories = result.nodes.filter(
      (n) => n.data.isCategory && n.data.side === "left"
    );
    const rightCategories = result.nodes.filter(
      (n) => n.data.isCategory && n.data.side === "right"
    );

    // Verify 5 categories on the left and 5 on the right for Java
    expect(leftCategories.length).toBe(5);
    expect(rightCategories.length).toBe(5);
  });

  it("lays out the System Design roadmap (56 topics) with balanced wings", () => {
    const result = computeCoggleLayout({
      roadmap: systemDesignRoadmap,
      progress: {},
      collapsedNodeIds: new Set(),
      searchQuery: "",
      statusFilter: "all",
      onToggleCollapse: () => {},
      onSelectNode: () => {},
    });

    expect(result.totalNodes).toBe(56);
    expect(result.nodes.length).toBeGreaterThan(50);

    const leftCategories = result.nodes.filter(
      (n) => n.data.isCategory && n.data.side === "left"
    );
    const rightCategories = result.nodes.filter(
      (n) => n.data.isCategory && n.data.side === "right"
    );

    expect(leftCategories.length).toBeGreaterThanOrEqual(4);
    expect(rightCategories.length).toBeGreaterThanOrEqual(4);
  });
});
