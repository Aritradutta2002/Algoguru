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
