import type { RoadmapId } from "@/data/roadmaps";

export type NodeStatus = "not-started" | "in-progress" | "completed";

/**
 * Per-node data rendered inside the custom React Flow node.
 * Everything that's user-facing lives here so a roadmap author can extend
 * roadmaps simply by adding a new entry to a data file.
 *
 * The index signature is required by React Flow's `Node<T>` constraint,
 * which extends `Record<string, unknown>`.
 */
export interface RoadmapNodeData extends Record<string, unknown> {
  id: string;
  title: string;
  /** Small caption under the title, e.g. "5 problems" or "12 topics". */
  subtitle?: string;
  /** Long-form description shown in the detail panel. */
  description: string;
  /** Number of problems / resources / questions for this topic. */
  resources: number;
  /** Category label used to color the node's accent strip. */
  category: string;
  /** Stable ids of nodes that must be learned before this one. */
  prerequisites: string[];
  /** 1-based recommended learning order. */
  recommendedOrder: number;
  /** Optional override of the category color (CSS color string). */
  accent?: string;
}

/**
 * The shape React Flow expects for a node.
 * We extend the basic node with a strict `data` payload and a hand-laid
 * `position` (so the graph flows top → bottom instead of being force-laid).
 */
export interface RoadmapNode {
  id: string;
  type: "roadmap";
  position: { x: number; y: number };
  data: RoadmapNodeData;
  /** Optional saved position offset persisted in localStorage. */
  positionOffset?: { x: number; y: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Full configuration for a single roadmap view.
 * `RoadmapEngine` consumes this and renders the entire graph.
 */
export interface Roadmap {
  id: RoadmapId;
  title: string;
  subtitle: string;
  /** Brand accent used for the active switcher tab and node highlights. */
  accent: string;
  /** Categories with their display color, used by the legend. */
  categories: { label: string; color: string }[];
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

/** Per-node progress record. */
export interface NodeProgress {
  status: NodeStatus;
  updatedAt: number;
}

/** Full progress blob for a single roadmap (keyed by node id). */
export type RoadmapProgress = Record<string, NodeProgress>;

/** Computed completion snapshot used by the header progress bar. */
export interface CompletionStats {
  completed: number;
  inProgress: number;
  total: number;
  percent: number;
}

export type CoggleSide = "left" | "right" | "up" | "down";

/** Extra metadata added to nodes when laid out in the Coggle bidirectional tree */
export interface CoggleNodeData extends RoadmapNodeData {
  side: CoggleSide;
  tier: number; // 0 = root, 1 = category trunk, 2 = topic, 3+ = subtopic
  isRoot?: boolean;
  isCategory?: boolean;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  childCount?: number;
  matchedSearch?: boolean;
  statusHidden?: boolean;
  branchColor: string;
  /** Estimated pill width shared between layout anchors and the rendered node. */
  pillWidth?: number;
  totalTopics?: number;
  completedTopics?: number;
  onToggleCollapse?: (id: string) => void;
  onSelect?: (id: string) => void;
}

/** Coggle edge styling metadata */
export interface CoggleEdgeData extends Record<string, unknown> {
  side: CoggleSide;
  branchColor: string;
  tier: number;
  isHovered?: boolean;
  isActivePath?: boolean;
  flowDirection?: "forward" | "backward";
}
