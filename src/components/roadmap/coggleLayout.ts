import type {
  Roadmap,
  RoadmapNodeData,
  NodeStatus,
  CoggleSide,
  CoggleNodeData,
  CoggleEdgeData,
} from "@/types/roadmapGraph";
import type { Node, Edge } from "@xyflow/react";

export interface CoggleLayoutOptions {
  roadmap: Roadmap;
  progress: Record<string, { status: NodeStatus; updatedAt: number }>;
  collapsedNodeIds: Set<string>;
  searchQuery?: string;
  statusFilter?: "all" | "in-progress" | "completed" | "not-started";
  onToggleCollapse: (id: string) => void;
  onSelectNode: (id: string) => void;
}

export interface CoggleLayoutResult {
  nodes: Node<CoggleNodeData>[];
  edges: Edge<CoggleEdgeData>[];
  totalNodes: number;
  completedNodes: number;
  inProgressNodes: number;
  matchedCount: number;
}

// Fixed spacing dimensions for Coggle mind-map
export const COGGLE_DIMENSIONS = {
  ROOT_WIDTH: 260,
  ROOT_HEIGHT: 84,
  CATEGORY_WIDTH: 180,
  CATEGORY_HEIGHT: 46,
  NODE_WIDTH: 204,
  NODE_HEIGHT: 68,
  TIER1_X: 340, // Root -> Category
  TIER2_X: 280, // Category -> Level 1 topic
  TIER3_X: 270, // Topic -> Child topic
  GAP_Y: 20,
  CATEGORY_GAP_Y: 42,
};

/** Category side mapping for known roadmaps to guarantee aesthetic balance */
const ROADMAP_CATEGORY_SIDES: Record<string, Record<string, CoggleSide>> = {
  dsa: {
    Linear: "right",
    "Trees & Heaps": "right",
    Graphs: "right",
    DP: "left",
    Algorithmic: "left",
    "Math & Bits": "left",
  },
  java: {
    Fundamentals: "left",
    OOP: "left",
    Collections: "left",
    "I/O": "left",
    JVM: "left",
    Functional: "right",
    Concurrency: "right",
    Advanced: "right",
    Spring: "right",
    Microservices: "right",
  },
  "system-design": {
    Fundamentals: "left",
    Scaling: "left",
    Data: "left",
    Messaging: "left",
    Distributed: "right",
    Observability: "right",
    Security: "right",
    Problems: "right",
    "Advanced Problems": "right",
  },
};

interface InternalTreeNode {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  branchColor: string;
  resources: number;
  prerequisites: string[];
  recommendedOrder: number;
  tier: number;
  side: CoggleSide;
  isRoot?: boolean;
  isCategory?: boolean;
  rawNode?: RoadmapNodeData;
  children: InternalTreeNode[];
  subtreeHeight: number;
  x: number;
  y: number;
}

export function computeCoggleLayout(options: CoggleLayoutOptions): CoggleLayoutResult {
  const {
    roadmap,
    progress,
    collapsedNodeIds,
    searchQuery = "",
    statusFilter = "all",
    onToggleCollapse,
    onSelectNode,
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Color lookup
  const categoryColorMap = new Map<string, string>();
  roadmap.categories.forEach((cat) => {
    categoryColorMap.set(cat.label, cat.color);
  });

  // Category side map
  const sideConfig = ROADMAP_CATEGORY_SIDES[roadmap.id] || {};

  // Build raw node map
  const nodeMap = new Map<string, RoadmapNodeData>();
  roadmap.nodes.forEach((n) => nodeMap.set(n.id, n.data));

  // Partition category items
  const categoryBuckets = new Map<string, RoadmapNodeData[]>();
  roadmap.categories.forEach((cat) => categoryBuckets.set(cat.label, []));

  roadmap.nodes.forEach((n) => {
    const list = categoryBuckets.get(n.data.category);
    if (list) {
      list.push(n.data);
    } else {
      // Fallback: create category bucket if unseen
      categoryBuckets.set(n.data.category, [n.data]);
    }
  });

  // Calculate completion counters
  let totalTopics = 0;
  let completedTopics = 0;
  let inProgressTopics = 0;

  roadmap.nodes.forEach((n) => {
    totalTopics++;
    const st = progress[n.id]?.status ?? "not-started";
    if (st === "completed") completedTopics++;
    if (st === "in-progress") inProgressTopics++;
  });

  // Root node representation
  const rootNode: InternalTreeNode = {
    id: "root",
    title: roadmap.title,
    subtitle: roadmap.subtitle,
    description: `Complete learning path for ${roadmap.title}. ${totalTopics} topics across ${roadmap.categories.length} core domains.`,
    category: "Root",
    branchColor: roadmap.accent,
    resources: totalTopics,
    prerequisites: [],
    recommendedOrder: 0,
    tier: 0,
    side: "right",
    isRoot: true,
    children: [],
    subtreeHeight: 0,
    x: 0,
    y: 0,
  };

  // Build Left and Right category branch trees
  const leftBranches: InternalTreeNode[] = [];
  const rightBranches: InternalTreeNode[] = [];

  let catIndex = 0;
  roadmap.categories.forEach((cat) => {
    const rawItems = categoryBuckets.get(cat.label) ?? [];
    if (rawItems.length === 0) return;

    // Determine wing side
    const side: CoggleSide =
      sideConfig[cat.label] ?? (catIndex % 2 === 0 ? "right" : "left");
    catIndex++;

    const branchColor = cat.color || roadmap.accent;

    // Build hierarchy within this category
    // Items are sorted by recommendedOrder
    const sortedItems = [...rawItems].sort(
      (a, b) => a.recommendedOrder - b.recommendedOrder
    );

    // Map intra-category prerequisite tree
    const itemIds = new Set(sortedItems.map((item) => item.id));
    const parentOf = new Map<string, string>();

    sortedItems.forEach((item) => {
      // Find prerequisite in the same category
      const intraPrereq = item.prerequisites.find((p) => itemIds.has(p));
      if (intraPrereq && intraPrereq !== item.id) {
        parentOf.set(item.id, intraPrereq);
      }
    });

    const categoryInternalNode: InternalTreeNode = {
      id: `cat-${cat.label}`,
      title: cat.label,
      subtitle: `${sortedItems.length} topics`,
      description: `Category: ${cat.label} in ${roadmap.title}`,
      category: cat.label,
      branchColor,
      resources: sortedItems.reduce((acc, curr) => acc + (curr.resources || 0), 0),
      prerequisites: [],
      recommendedOrder: 0,
      tier: 1,
      side,
      isCategory: true,
      children: [],
      subtreeHeight: 0,
      x: 0,
      y: 0,
    };

    // Construct topic nodes
    const topicNodeMap = new Map<string, InternalTreeNode>();
    sortedItems.forEach((item) => {
      const topicNode: InternalTreeNode = {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        category: item.category,
        branchColor,
        resources: item.resources,
        prerequisites: item.prerequisites,
        recommendedOrder: item.recommendedOrder,
        tier: 2,
        side,
        rawNode: item,
        children: [],
        subtreeHeight: 0,
        x: 0,
        y: 0,
      };
      topicNodeMap.set(item.id, topicNode);
    });

    // Link parents to children within category
    sortedItems.forEach((item) => {
      const tNode = topicNodeMap.get(item.id)!;
      const parentId = parentOf.get(item.id);
      if (parentId && topicNodeMap.has(parentId)) {
        const parentNode = topicNodeMap.get(parentId)!;
        tNode.tier = Math.min(parentNode.tier + 1, 4);
        parentNode.children.push(tNode);
      } else {
        // Direct child of category trunk
        categoryInternalNode.children.push(tNode);
      }
    });

    if (side === "left") {
      leftBranches.push(categoryInternalNode);
    } else {
      rightBranches.push(categoryInternalNode);
    }
  });

  // Calculate search match helper
  const matchesSearch = (node: InternalTreeNode): boolean => {
    if (!normalizedQuery) return true;
    return (
      node.title.toLowerCase().includes(normalizedQuery) ||
      (node.subtitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
      node.description.toLowerCase().includes(normalizedQuery) ||
      node.category.toLowerCase().includes(normalizedQuery)
    );
  };

  // If search query is active, auto-expand any collapsed ancestors of matching nodes
  if (normalizedQuery) {
    const uncollapseAncestors = (node: InternalTreeNode): boolean => {
      let hasMatchInSubtree = matchesSearch(node);
      for (const child of node.children) {
        const childMatch = uncollapseAncestors(child);
        if (childMatch) hasMatchInSubtree = true;
      }
      if (hasMatchInSubtree && collapsedNodeIds.has(node.id)) {
        collapsedNodeIds.delete(node.id);
      }
      return hasMatchInSubtree;
    };

    leftBranches.forEach(uncollapseAncestors);
    rightBranches.forEach(uncollapseAncestors);
  }

  // Calculate subtree heights recursively
  const computeSubtreeHeight = (node: InternalTreeNode): number => {
    const isCollapsed = collapsedNodeIds.has(node.id);
    const nodeSelfHeight = node.isRoot
      ? COGGLE_DIMENSIONS.ROOT_HEIGHT
      : node.isCategory
      ? COGGLE_DIMENSIONS.CATEGORY_HEIGHT
      : COGGLE_DIMENSIONS.NODE_HEIGHT;

    if (isCollapsed || node.children.length === 0) {
      node.subtreeHeight = nodeSelfHeight + COGGLE_DIMENSIONS.GAP_Y;
      return node.subtreeHeight;
    }

    let childrenHeightSum = 0;
    node.children.forEach((child) => {
      childrenHeightSum += computeSubtreeHeight(child);
    });

    node.subtreeHeight = Math.max(
      nodeSelfHeight + COGGLE_DIMENSIONS.GAP_Y,
      childrenHeightSum
    );
    return node.subtreeHeight;
  };

  leftBranches.forEach(computeSubtreeHeight);
  rightBranches.forEach(computeSubtreeHeight);

  // Position layout for a single wing (left or right)
  const positionWing = (
    branches: InternalTreeNode[],
    side: CoggleSide
  ) => {
    const totalHeight = branches.reduce(
      (sum, b) => sum + b.subtreeHeight + COGGLE_DIMENSIONS.CATEGORY_GAP_Y,
      0
    ) - COGGLE_DIMENSIONS.CATEGORY_GAP_Y;

    let currentY = -totalHeight / 2;

    branches.forEach((branch) => {
      const branchHeight = branch.subtreeHeight;
      const xOffset = side === "right" ? COGGLE_DIMENSIONS.TIER1_X : -COGGLE_DIMENSIONS.TIER1_X;
      branch.x = xOffset;

      // Position children of category recursively
      const positionSubtree = (
        parent: InternalTreeNode,
        parentStartY: number
      ) => {
        const isCollapsed = collapsedNodeIds.has(parent.id);
        if (isCollapsed || parent.children.length === 0) {
          parent.y = parentStartY + parent.subtreeHeight / 2;
          return;
        }

        let childY = parentStartY;
        const childCenters: number[] = [];

        parent.children.forEach((child) => {
          const stepX =
            child.tier === 2
              ? COGGLE_DIMENSIONS.TIER2_X
              : COGGLE_DIMENSIONS.TIER3_X;
          child.x = parent.x + (side === "right" ? stepX : -stepX);

          positionSubtree(child, childY);
          childCenters.push(child.y);
          childY += child.subtreeHeight;
        });

        // Parent Y is centered between the first and last child's center
        if (childCenters.length > 0) {
          parent.y = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
        } else {
          parent.y = parentStartY + parent.subtreeHeight / 2;
        }
      };

      positionSubtree(branch, currentY);
      currentY += branchHeight + COGGLE_DIMENSIONS.CATEGORY_GAP_Y;
    });
  };

  positionWing(leftBranches, "left");
  positionWing(rightBranches, "right");

  // Collect React Flow elements
  const flowNodes: Node<CoggleNodeData>[] = [];
  const flowEdges: Edge<CoggleEdgeData>[] = [];
  let matchedCount = 0;

  // Add root node
  const rootIsMatch = !normalizedQuery || matchesSearch(rootNode);
  if (normalizedQuery && rootIsMatch) matchedCount++;

  flowNodes.push({
    id: "root",
    type: "coggleRoot",
    position: { x: -COGGLE_DIMENSIONS.ROOT_WIDTH / 2, y: -COGGLE_DIMENSIONS.ROOT_HEIGHT / 2 },
    data: {
      id: "root",
      title: rootNode.title,
      subtitle: rootNode.subtitle,
      description: rootNode.description,
      category: "All",
      resources: totalTopics,
      prerequisites: [],
      recommendedOrder: 0,
      tier: 0,
      side: "right",
      isRoot: true,
      branchColor: roadmap.accent,
      totalTopics,
      completedTopics,
      matchedSearch: rootIsMatch,
      statusHidden: false,
    },
    draggable: false,
    selectable: true,
  });

  // Recursive flattener for React Flow nodes and edges
  const flattenTree = (
    node: InternalTreeNode,
    parentId: string | null
  ) => {
    const isCollapsed = collapsedNodeIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isMatch = matchesSearch(node);
    if (normalizedQuery && isMatch) matchedCount++;

    // Check status filter
    const nodeStatus = progress[node.id]?.status ?? "not-started";
    const statusMatches =
      statusFilter === "all" ||
      (statusFilter === "completed" && nodeStatus === "completed") ||
      (statusFilter === "in-progress" && nodeStatus === "in-progress") ||
      (statusFilter === "not-started" && nodeStatus === "not-started");

    // Compute total descendants count
    const countDescendants = (n: InternalTreeNode): number => {
      return n.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
    };
    const childCount = countDescendants(node);

    const nodeWidth = node.isCategory
      ? COGGLE_DIMENSIONS.CATEGORY_WIDTH
      : COGGLE_DIMENSIONS.NODE_WIDTH;
    const nodeHeight = node.isCategory
      ? COGGLE_DIMENSIONS.CATEGORY_HEIGHT
      : COGGLE_DIMENSIONS.NODE_HEIGHT;

    flowNodes.push({
      id: node.id,
      type: "coggleNode",
      position: {
        x: node.x - (node.side === "right" ? 0 : nodeWidth),
        y: node.y - nodeHeight / 2,
      },
      data: {
        id: node.id,
        title: node.title,
        subtitle: node.subtitle,
        description: node.description,
        category: node.category,
        resources: node.resources,
        prerequisites: node.prerequisites,
        recommendedOrder: node.recommendedOrder,
        tier: node.tier,
        side: node.side,
        isCategory: node.isCategory,
        isCollapsed,
        hasChildren,
        childCount,
        branchColor: node.branchColor,
        matchedSearch: isMatch,
        statusHidden: !statusMatches,
        onToggleCollapse,
        onSelect: onSelectNode,
      },
      draggable: false,
      selectable: true,
    });

    // Create edge from parent to this node
    if (parentId) {
      flowEdges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        sourceHandle:
          parentId === "root"
            ? node.side === "right"
              ? "root-right"
              : "root-left"
            : node.side === "right"
            ? "source-right"
            : "source-left",
        targetHandle: node.side === "right" ? "target-left" : "target-right",
        type: "coggleEdge",
        data: {
          side: node.side,
          branchColor: node.branchColor,
          tier: node.tier,
          flowDirection: "forward",
        },
      });
    }

    // Recurse children if not collapsed
    if (!isCollapsed) {
      node.children.forEach((child) => flattenTree(child, node.id));
    }
  };

  // Connect Root to Left and Right Category Branches
  leftBranches.forEach((cat) => flattenTree(cat, "root"));
  rightBranches.forEach((cat) => flattenTree(cat, "root"));

  return {
    nodes: flowNodes,
    edges: flowEdges,
    totalNodes: totalTopics,
    completedNodes: completedTopics,
    inProgressNodes: inProgressTopics,
    matchedCount,
  };
}
