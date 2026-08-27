import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { RoadmapNode, resolveAccent, type RoadmapFlowNode } from "./RoadmapNode";
import { RoadmapEdge } from "./RoadmapEdge";
import { RoadmapBackground } from "./RoadmapBackground";
import { RoadmapControls } from "./RoadmapControls";
import { RoadmapHeader } from "./RoadmapHeader";
import { RoadmapDetailPanel } from "./RoadmapDetailPanel";
import {
  computeCompletion,
  getNodeStatus,
  useRoadmapProgress,
} from "@/services/roadmapProgress";
import type {
  NodeStatus,
  Roadmap,
  RoadmapNodeData,
  RoadmapNode as RoadmapNodeT,
  RoadmapEdge as RoadmapEdgeT,
} from "@/types/roadmapGraph";
import { Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapEngineProps {
  roadmap: Roadmap;
  /** Hide the in-engine top header (used by the chrome-free fullscreen overlay). */
  compact?: boolean;
  /** Bump this number to reset progress + node positions back to the original stage. */
  resetSignal?: number;
}

// ─── Custom node/edge types registry ─────────────────────────────────────
// React Flow's `nodeTypes` / `edgeTypes` must be defined at module scope
// (creating new types on every render breaks memoization).

const NODE_TYPES = { roadmap: RoadmapNode };
const EDGE_TYPES = { roadmap: RoadmapEdge };

/**
 * Places large roadmaps in ranked layers: every topic sits beneath its latest
 * prerequisite, and topics in a layer are ordered by the position of their
 * parents. This keeps long learning paths vertical while related branches stay
 * close together instead of following the arbitrary order in the data file.
 */
function computeRankedLayout(nodes: RoadmapNodeT[], edges: RoadmapEdgeT[]): RoadmapNodeT[] {
  const parents = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of edges) parents.get(edge.target)?.push(edge.source);

  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  const getRank = (id: string): number => {
    const known = rank.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const parentRanks = (parents.get(id) ?? []).map(getRank);
    visiting.delete(id);
    const result = parentRanks.length ? Math.max(...parentRanks) + 1 : 0;
    rank.set(id, result);
    return result;
  };
  nodes.forEach((node) => getRank(node.id));

  const layers = new Map<number, RoadmapNodeT[]>();
  for (const node of nodes) {
    const level = rank.get(node.id) ?? 0;
    const layer = layers.get(level) ?? [];
    layer.push(node);
    layers.set(level, layer);
  }

  const x = new Map<string, number>();
  [...layers.keys()].sort((a, b) => a - b).forEach((level) => {
    const layer = layers.get(level)!;
    layer.sort((a, b) => {
      const centre = (node: RoadmapNodeT) => {
        const parentXs = (parents.get(node.id) ?? [])
          .map((id) => x.get(id))
          .filter((value): value is number => value !== undefined);
        return parentXs.length
          ? parentXs.reduce((sum, value) => sum + value, 0) / parentXs.length
          : 0;
      };
      return centre(a) - centre(b) || a.data.recommendedOrder - b.data.recommendedOrder;
    });
    const start = 640 - ((layer.length - 1) * 175) / 2;
    layer.forEach((node, index) => x.set(node.id, start + index * 175));
  });

  return nodes.map((node) => ({
    ...node,
    position: { x: x.get(node.id) ?? 640, y: 70 + (rank.get(node.id) ?? 0) * 105 },
  }));
}

// ─── Outer wrapper ────────────────────────────────────────────────────────

export function RoadmapEngine({ roadmap, compact, resetSignal }: RoadmapEngineProps) {
  return (
    <ReactFlowProvider>
      <RoadmapEngineInner roadmap={roadmap} compact={compact} resetSignal={resetSignal} />
    </ReactFlowProvider>
  );
}

// ─── Inner component (uses `useReactFlow`) ───────────────────────────────

function RoadmapEngineInner({ roadmap, compact, resetSignal }: RoadmapEngineProps) {
  const {
    progress,
    positions,
    setStatus,
    setPosition,
    clearAll,
    resetPositions,
  } = useRoadmapProgress(roadmap);

  const reactFlow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Build a category → color lookup for fast accent resolution.
  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of roadmap.categories) map[c.label] = c.color;
    return map;
  }, [roadmap.categories]);

  // The concise DSA roadmap uses its hand-authored NeetCode-style shape. The
  // larger roadmaps are ranked from their prerequisites to prevent grid rows
  // from sending edges sideways and crossing through unrelated topics.
  const layoutedElements = useMemo(
    () => roadmap.id === "dsa" ? roadmap.nodes : computeRankedLayout(roadmap.nodes, roadmap.edges),
    [roadmap.id, roadmap.nodes, roadmap.edges],
  );

  // Convert Roadmap → React Flow nodes (with current status + accent).
  const nodes: RoadmapFlowNode[] =
    useMemo(() => {
      return layoutedElements.map((n) => {
        const offset = positions[n.id];
        const status = getNodeStatus(progress, n.id);
        const accentColor = resolveAccent(n.data, categoryColors);
        const onClick = (id: string) => setSelectedNodeId(id);
        const node: RoadmapFlowNode = {
          id: n.id,
          type: "roadmap",
          position: {
            x: n.position.x + (offset?.x ?? 0),
            y: n.position.y + (offset?.y ?? 0),
          },
          data: { ...n.data, status, accentColor, onClick },
          draggable: true,
          selectable: true,
        };
        return node;
      });
    }, [layoutedElements, progress, positions, categoryColors]);

  // Convert Roadmap → React Flow edges (with target status driving style).
  const edges: Edge[] = useMemo(() => {
    return roadmap.edges.map((e) => {
      const targetStatus = getNodeStatus(progress, e.target);
      const isHovered = e.source === hoveredNodeId || e.target === hoveredNodeId;
      // When the *target* end is hovered, flow from source → target.
      // When the *source* end is hovered, flow from target → source so the
      // stream always points "toward" the focus node.
      const flowDirection: "forward" | "backward" =
        e.target === hoveredNodeId ? "forward" : "backward";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "roadmap",
        data: { targetStatus, isHovered, flowDirection },
      } as Edge;
    });
  }, [roadmap.edges, progress, hoveredNodeId]);

  // Reactive completion stats
  const stats = useMemo(() => computeCompletion(roadmap, progress), [roadmap, progress]);

  // Active node for the detail panel
  const activeNodeData = useMemo<RoadmapNodeData | null>(() => {
    if (!selectedNodeId) return null;
    const found = roadmap.nodes.find((n) => n.id === selectedNodeId);
    return found?.data ?? null;
  }, [selectedNodeId, roadmap.nodes]);

  const activeStatus: NodeStatus = useMemo(
    () => (selectedNodeId ? getNodeStatus(progress, selectedNodeId) : "not-started"),
    [selectedNodeId, progress]
  );

  // ── React Flow change handlers ────────────────────────────────────────

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We use controlled mode: re-derive the position from the source
      // data + offset each render. We only persist user-applied deltas.
      for (const change of changes) {
        if (change.type === "position" && change.dragging === false) {
          // The user just finished dragging this node. Persist the offset
          // relative to its base position.
          const base = roadmap.nodes.find((n) => n.id === change.id);
          if (!base) continue;
          setPosition(change.id, {
            x: change.position!.x - base.position.x,
            y: change.position!.y - base.position.y,
          });
        }
      }
    },
    [roadmap.nodes, setPosition]
  );

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Edges are derived from data; we don't allow editing them.
    // React Flow still wants the handler present in controlled mode.
  }, []);

  const onConnect = useCallback(
    (_connection: Connection) => {
      // Roadmap edges are data-driven. We intentionally don't allow users
      // to add new edges at runtime. This handler exists only to satisfy
      // the controlled-mode contract.
    },
    []
  );

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: RoadmapFlowNode) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  // ── Auto-fit view on first mount of each roadmap ──────────────────────

  useEffect(() => {
    // Run after the layout settles.
    const t = setTimeout(() => {
      try {
        reactFlow.fitView({ padding: 0.18, duration: 500 });
      } catch {
        /* rf not ready yet */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [roadmap.id, reactFlow]);

  // ── When a node is selected, scroll/centre it lightly ─────────────────

  useEffect(() => {
    if (!selectedNodeId || !rfInstance) return;
    const node = rfInstance.getNode(selectedNodeId);
    if (!node) return;
    rfInstance.setCenter(
      node.position.x + (node.measured?.width ?? 200) / 2,
      node.position.y + (node.measured?.height ?? 100) / 2,
      { zoom: rfInstance.getZoom(), duration: 400 }
    );
  }, [selectedNodeId, rfInstance]);

  // ── Memoize the prop objects so React Flow doesn't re-render on parent ticks ──

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance);
  }, []);

  // Stable handlers passed to node data
  const onSelectPrereq = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  const onSetStatus = useCallback(
    (status: NodeStatus) => {
      if (!selectedNodeId) return;
      setStatus(selectedNodeId, status);
    },
    [selectedNodeId, setStatus]
  );

  const onClosePanel = useCallback(() => setSelectedNodeId(null), []);

  // When the overlay bumps `resetSignal`, clear all progress and any user-dragged
  // node positions so the roadmap returns to its original (tree) stage.
  const resetSkipped = useRef(true);
  useEffect(() => {
    if (resetSkipped.current) {
      resetSkipped.current = false;
      return;
    }
    clearAll();
    resetPositions();
  }, [resetSignal, clearAll, resetPositions]);

  // ── Empty state ──
  if (roadmap.nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
          <MapIcon size={26} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight">Coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This roadmap doesn't have any topics yet. Add some nodes to{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
            {`src/data/${roadmap.id}Roadmap.ts`}
          </code>{" "}
          and they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-background text-foreground"
      )}
      ref={wrapperRef}
    >
      <RoadmapHeader
        roadmap={roadmap}
        stats={stats}
        activeId={roadmap.id as RoadmapEngineProps["roadmap"]["id"]}
        compact={compact}
      />

      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onInit={onInit}
          // The roadmap is an authored learning tree, not a diagram editor.
          // Keeping nodes fixed prevents accidental drags from breaking its
          // visual hierarchy; the user can still pan and zoom the canvas.
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          panOnScroll={false}
          zoomOnDoubleClick={false}
          minZoom={0.25}
          maxZoom={1.8}
          defaultEdgeOptions={{ type: "roadmap" }}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          className="!bg-[#19191b]"
        >
          <RoadmapBackground />
          <RoadmapControls />
        </ReactFlow>

        {/* Detail panel */}
        <RoadmapDetailPanel
          roadmap={roadmap}
          node={activeNodeData}
          status={activeStatus}
          onClose={onClosePanel}
          onSelectPrereq={onSelectPrereq}
          onSetStatus={onSetStatus}
        />
      </div>
    </div>
  );
}
