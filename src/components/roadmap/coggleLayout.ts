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

/** Spacing metrics for the radial Coggle mind-map. */
export const COGGLE_DIMENSIONS = {
  ROOT_HEIGHT: 124,
  PILL_HEIGHT: 62,
  /** Minimum lateral distance from center to a left/right category pill. */
  TIER1_X: 330,
  /** Distance from center to an up/down category pill. */
  TIER1_Y: 250,
  /** Gap between sibling pills along the stack axis. */
  STACK_GAP: 20,
  STACK_GAP_X: 18,
  /** Gap between category branches inside one wing. */
  CATEGORY_GAP: 54,
  /** Extra growth distance parent→child on top of the parent's size. */
  EDGE_GAP_X: 54,
  EDGE_GAP_Y: 54,
  /**
   * How many children of an up/down node share one outward row before
   * wrapping to the next row. Keeps wide categories (e.g. 14 topics) from
   * exploding the canvas width — which would crush far-view text to ~2px.
   */
  WRAP_V: 2,
};

/**
 * Estimate a pill's rendered width from its title so layout anchors and the
 * node component agree on the exact box (keeps edge handles attached).
 *
 * Chrome = pl-4 + pr-4 + status dot + one flex gap; chip adds gap + box.
 * Mirrors CoggleNode at 18px bold.
 */
export function estimatePillWidth(title: string, hasChip = false): number {
  const text = title.length * 10.6;
  const chrome = 16 + 16 + 20 + 10;
  const chip = hasChip ? 10 + 38 : 0;
  return Math.round(Math.min(400, Math.max(150, chrome + chip + text)));
}

/** Width of the white center root box, sized to the roadmap title (30px bold). */
export function estimateRootWidth(title: string): number {
  return Math.round(Math.min(640, Math.max(400, title.length * 18 + 72)));
}

/**
 * Radial direction of each category branch per roadmap.
 * left/right wings grow along ±X (children stack vertically);
 * up/down wings grow along ±Y (children stack horizontally) — the
 * four-way spread of the reference Coggle diagram.
 */
const ROADMAP_CATEGORY_DIRS: Record<string, Record<string, CoggleSide>> = {
  dsa: {
    Linear: "right",
    "Trees & Heaps": "right",
    Graphs: "down",
    DP: "left",
    Algorithmic: "left",
    "Math & Bits": "up",
  },
  java: {
    Fundamentals: "left",
    OOP: "left",
    Collections: "left",
    Functional: "right",
    Concurrency: "right",
    Advanced: "right",
    "I/O": "up",
    JVM: "up",
    Spring: "down",
    Microservices: "down",
  },
  "system-design": {
    Fundamentals: "left",
    Scaling: "left",
    Data: "left",
    Distributed: "right",
    Reliability: "right",
    Architecture: "right",
    Messaging: "up",
    Security: "up",
    Operations: "down",
    Problems: "down",
  },
};

const isHorizontal = (dir: CoggleSide) => dir === "left" || dir === "right";
const dirSign = (dir: CoggleSide) =>
  dir === "right" || dir === "down" ? 1 : -1;

/** Split `n` children into wrapped rows of at most `per` members. */
const groupRows = (n: number, per: number): number[][] => {
  const rows: number[][] = [];
  for (let i = 0; i < n; i += per) {
    const row: number[] = [];
    for (let j = i; j < Math.min(i + per, n); j++) row.push(j);
    rows.push(row);
  }
  return rows;
};

/** Handle ids connecting a parent to a child growing in `dir`. */
const HANDLES_FOR: Record<
  CoggleSide,
  { source: string; target: string; rootSource: string }
> = {
  right: { source: "source-right", target: "target-left", rootSource: "root-right" },
  left: { source: "source-left", target: "target-right", rootSource: "root-left" },
  down: { source: "source-bottom", target: "target-top", rootSource: "root-bottom" },
  up: { source: "source-top", target: "target-bottom", rootSource: "root-top" },
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
  /** Estimated pill width — shared with the rendered node. */
  pillWidth: number;
  /** Extent of this subtree along the wing's stack axis (includes trailing gap). */
  subtreeHeight: number;
  /**
   * Vertical wings only: distance from this node's parent-facing edge to the
   * far edge of its outward-growing subtree. Used to reserve room before the
   * next wrapped row starts (prevents row-over-row collisions).
   */
  growthExtent?: number;
  /**
   * Position semantics depend on the wing direction:
   * - horizontal wings: x = parent-facing edge, y = stack center
   * - vertical wings:   y = parent-facing edge, x = stack center
   */
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

  // Direction config (fallback: alternate left/right for unknown roadmaps)
  const dirConfig = ROADMAP_CATEGORY_DIRS[roadmap.id] || {};

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

  const rootWidth = estimateRootWidth(roadmap.title);

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
    pillWidth: rootWidth,
    subtreeHeight: 0,
    x: 0,
    y: 0,
  };

  // Partition categories into the four radial wings
  const wingBranches: Record<CoggleSide, InternalTreeNode[]> = {
    left: [],
    right: [],
    up: [],
    down: [],
  };

  let catIndex = 0;
  roadmap.categories.forEach((cat) => {
    const rawItems = categoryBuckets.get(cat.label) ?? [];
    if (rawItems.length === 0) return;

    // Direction: config first, even/odd left/right fallback
    const dir: CoggleSide =
      dirConfig[cat.label] ?? (catIndex % 2 === 0 ? "right" : "left");
    catIndex++;

    const branchColor = cat.color || roadmap.accent;

    const sortedItems = [...rawItems].sort(
      (a, b) => a.recommendedOrder - b.recommendedOrder
    );

    // Map intra-category prerequisite tree
    const itemIds = new Set(sortedItems.map((item) => item.id));
    const parentOf = new Map<string, string>();

    sortedItems.forEach((item) => {
      const intraPrereq = item.prerequisites.find((p) => itemIds.has(p));
      if (intraPrereq && intraPrereq !== item.id) {
        parentOf.set(item.id, intraPrereq);
      }
    });

    const categoryPillWidth = estimatePillWidth(cat.label, true);

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
      side: dir,
      isCategory: true,
      children: [],
      pillWidth: categoryPillWidth,
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
        side: dir,
        rawNode: item,
        children: [],
        pillWidth: 0, // resolved after the tree is linked (needs hasChildren)
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
        categoryInternalNode.children.push(tNode);
      }
    });

    // Now that hasChildren is known, estimate topic pill widths
    const resolveWidths = (node: InternalTreeNode) => {
      node.pillWidth = estimatePillWidth(node.title, node.children.length > 0);
      node.children.forEach(resolveWidths);
    };
    categoryInternalNode.children.forEach(resolveWidths);

    wingBranches[dir].push(categoryInternalNode);
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

  // If search query is active, auto-expand any collapsed ancestors of matches
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

    (Object.values(wingBranches) as InternalTreeNode[][]).forEach((wing) =>
      wing.forEach(uncollapseAncestors)
    );
  }

  // ── Subtree extents along the wing's stack axis ──────────────────────
  // Horizontal wings stack along Y (extent = height) in a single column;
  // vertical wings wrap children into rows along X (extent = width) and
  // track growthExtent along Y so wrapped rows never collide.
  const computeSubtreeHeight = (
    node: InternalTreeNode,
    dir: CoggleSide
  ): number => {
    const isCollapsed = collapsedNodeIds.has(node.id);
    const horiz = isHorizontal(dir);

    if (isCollapsed || node.children.length === 0) {
      node.subtreeHeight = horiz
        ? COGGLE_DIMENSIONS.PILL_HEIGHT + COGGLE_DIMENSIONS.STACK_GAP
        : node.pillWidth + COGGLE_DIMENSIONS.STACK_GAP_X;
      node.growthExtent = COGGLE_DIMENSIONS.PILL_HEIGHT;
      return node.subtreeHeight;
    }

    if (horiz) {
      const gap = COGGLE_DIMENSIONS.STACK_GAP;
      let childrenExtentSum = 0;
      node.children.forEach((child) => {
        childrenExtentSum += computeSubtreeHeight(child, dir);
      });
      node.subtreeHeight = Math.max(
        COGGLE_DIMENSIONS.PILL_HEIGHT + gap,
        childrenExtentSum
      );
      node.growthExtent = COGGLE_DIMENSIONS.PILL_HEIGHT;
      return node.subtreeHeight;
    }

    // Vertical wing: children live in wrapped rows along X; subtree height
    // is the horizontal box width (max row width, at least the own pill).
    node.children.forEach((child) => computeSubtreeHeight(child, dir));

    const { PILL_HEIGHT, STACK_GAP_X, EDGE_GAP_Y, WRAP_V } =
      COGGLE_DIMENSIONS;
    const stepV = PILL_HEIGHT + EDGE_GAP_Y;
    const rows = groupRows(node.children.length, WRAP_V);
    const slotW = Math.max(...node.children.map((c) => c.subtreeHeight));
    const rowWidth = (len: number) =>
      len * slotW + Math.max(0, len - 1) * STACK_GAP_X;
    const maxRowWidth = Math.max(...rows.map((r) => rowWidth(r.length)));

    node.subtreeHeight = Math.max(
      node.pillWidth + STACK_GAP_X,
      maxRowWidth
    );

    // Growth extent along the wing direction (row advance with reserves).
    let offset = stepV; // row 0 sits one step past the parent's edge
    for (let r = 1; r < rows.length; r++) {
      const prevMaxGe = Math.max(
        ...rows[r - 1].map((i) => node.children[i].growthExtent ?? PILL_HEIGHT)
      );
      offset += Math.max(stepV, prevMaxGe + EDGE_GAP_Y);
    }
    const lastGe = Math.max(
      ...rows[rows.length - 1].map(
        (i) => node.children[i].growthExtent ?? PILL_HEIGHT
      )
    );
    node.growthExtent = offset + lastGe;
    return node.subtreeHeight;
  };

  (Object.keys(wingBranches) as CoggleSide[]).forEach((dir) => {
    wingBranches[dir].forEach((b) => computeSubtreeHeight(b, dir));
  });

  /** Total stack extent of a wing including inter-category gaps. */
  const wingStackExtent = (branches: InternalTreeNode[]): number => {
    if (branches.length === 0) return 0;
    return (
      branches.reduce(
        (sum, b) => sum + b.subtreeHeight + COGGLE_DIMENSIONS.CATEGORY_GAP,
        0
      ) - COGGLE_DIMENSIONS.CATEGORY_GAP
    );
  };

  // Reserve horizontal room: left/right categories must clear the up/down
  // wings' half-width so the four wings never overlap.
  const upDownHalfWidth =
    Math.max(
      wingStackExtent(wingBranches.up),
      wingStackExtent(wingBranches.down)
    ) / 2;
  const lateralTier1 = Math.max(
    COGGLE_DIMENSIONS.TIER1_X,
    upDownHalfWidth + 90
  );

  // ── Position one wing ────────────────────────────────────────────────
  const getStack = (node: InternalTreeNode, dir: CoggleSide): number =>
    isHorizontal(dir) ? node.y : node.x;
  const setStack = (
    node: InternalTreeNode,
    dir: CoggleSide,
    value: number
  ): void => {
    if (isHorizontal(dir)) node.y = value;
    else node.x = value;
  };

  const positionWing = (
    branches: InternalTreeNode[],
    dir: CoggleSide
  ): void => {
    if (branches.length === 0) return;

    const horiz = isHorizontal(dir);
    const catGap = horiz
      ? COGGLE_DIMENSIONS.CATEGORY_GAP
      : COGGLE_DIMENSIONS.CATEGORY_GAP + 10;
    const totalStack = horiz
      ? wingStackExtent(branches)
      : branches.reduce((sum, b) => sum + b.subtreeHeight + catGap, 0) - catGap;

    let cursor = -totalStack / 2;

    const growthEdge =
      dirSign(dir) * (horiz ? lateralTier1 : COGGLE_DIMENSIONS.TIER1_Y);

    branches.forEach((branch) => {
      if (horiz) branch.x = growthEdge;
      else branch.y = growthEdge;
      // Position this category's subtree recursively
      const placeSubtree = (parent: InternalTreeNode, startStack: number) => {
        const isCollapsed = collapsedNodeIds.has(parent.id);
        if (isCollapsed || parent.children.length === 0) {
          setStack(parent, dir, startStack + parent.subtreeHeight / 2);
          return;
        }

        if (!horiz) {
          // ── Vertical wing: wrap children into rows along X, advancing
          // outward along Y with growth reserves so rows never overlap. ──
          const { PILL_HEIGHT, STACK_GAP_X, EDGE_GAP_Y, WRAP_V } =
            COGGLE_DIMENSIONS;
          const stepV = PILL_HEIGHT + EDGE_GAP_Y;
          const rows = groupRows(parent.children.length, WRAP_V);
          const slotW = Math.max(
            ...parent.children.map((c) => c.subtreeHeight)
          );
          const H = parent.subtreeHeight;

          let offset = stepV;
          rows.forEach((row, r) => {
            if (r > 0) {
              const prevMaxGe = Math.max(
                ...rows[r - 1].map(
                  (i) => parent.children[i].growthExtent ?? PILL_HEIGHT
                )
              );
              offset += Math.max(stepV, prevMaxGe + EDGE_GAP_Y);
            }
            const rowW =
              row.length * slotW + Math.max(0, row.length - 1) * STACK_GAP_X;
            const xBase = startStack + (H - rowW) / 2;
            row.forEach((childIdx, j) => {
              const child = parent.children[childIdx];
              child.x = xBase + j * (slotW + STACK_GAP_X) + slotW / 2;
              child.y = parent.y + dirSign(dir) * offset;
            });
          });

          setStack(parent, dir, startStack + H / 2);
          parent.children.forEach((child) => {
            if (!collapsedNodeIds.has(child.id)) {
              placeSubtree(child, child.x - child.subtreeHeight / 2);
            }
          });
          return;
        }

        // ── Horizontal wing: single column along Y, growth along X. ──
        let childCursor = startStack;
        const childCenters: number[] = [];

        parent.children.forEach((child) => {
          // Growth: child's parent-facing edge sits past the parent's far edge
          child.x =
            dir === "right"
              ? parent.x + parent.pillWidth + COGGLE_DIMENSIONS.EDGE_GAP_X
              : parent.x - parent.pillWidth - COGGLE_DIMENSIONS.EDGE_GAP_X;

          placeSubtree(child, childCursor);
          childCursor += child.subtreeHeight;
          childCenters.push(getStack(child, dir));
        });

        // Parent sits centered between the extreme children
        if (childCenters.length > 0) {
          setStack(
            parent,
            dir,
            (Math.min(...childCenters) + Math.max(...childCenters)) / 2
          );
        } else {
          setStack(parent, dir, startStack + parent.subtreeHeight / 2);
        }
      };

      placeSubtree(branch, cursor);
      cursor += branch.subtreeHeight + catGap;
    });
  };

  // Position vertical wings first, then horizontal (lateralTier1 already known)
  positionWing(wingBranches.up, "up");
  positionWing(wingBranches.down, "down");
  positionWing(wingBranches.left, "left");
  positionWing(wingBranches.right, "right");

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
    position: {
      x: -rootWidth / 2,
      y: -COGGLE_DIMENSIONS.ROOT_HEIGHT / 2,
    },
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
      pillWidth: rootWidth,
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

    const width = node.pillWidth;
    const height = COGGLE_DIMENSIONS.PILL_HEIGHT;

    // Parent-facing edge handling differs per direction
    let posX: number;
    let posY: number;
    if (node.side === "right") {
      posX = node.x;
      posY = node.y - height / 2;
    } else if (node.side === "left") {
      posX = node.x - width;
      posY = node.y - height / 2;
    } else if (node.side === "down") {
      posX = node.x - width / 2;
      posY = node.y;
    } else {
      posX = node.x - width / 2;
      posY = node.y - height;
    }

    flowNodes.push({
      id: node.id,
      type: "coggleNode",
      position: { x: posX, y: posY },
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
        pillWidth: width,
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
      const handles = HANDLES_FOR[node.side];
      flowEdges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        sourceHandle:
          parentId === "root" ? handles.rootSource : handles.source,
        targetHandle: handles.target,
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

  // Connect Root to each wing's category branches
  (Object.values(wingBranches) as InternalTreeNode[][]).forEach((wing) =>
    wing.forEach((cat) => flattenTree(cat, "root"))
  );

  return {
    nodes: flowNodes,
    edges: flowEdges,
    totalNodes: totalTopics,
    completedNodes: completedTopics,
    inProgressNodes: inProgressTopics,
    matchedCount,
  };
}
