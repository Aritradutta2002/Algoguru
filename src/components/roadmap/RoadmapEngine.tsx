import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CoggleRootNode } from "./CoggleRootNode";
import { CoggleNode } from "./CoggleNode";
import { CoggleEdge } from "./CoggleEdge";
import { RoadmapBackground } from "./RoadmapBackground";
import { RoadmapControls } from "./RoadmapControls";
import { RoadmapHeader } from "./RoadmapHeader";
import { RoadmapDetailPanel } from "./RoadmapDetailPanel";
import { computeCoggleLayout } from "./coggleLayout";
import {
  computeCompletion,
  getNodeStatus,
  useRoadmapProgress,
} from "@/services/roadmapProgress";
import type {
  NodeStatus,
  Roadmap,
  RoadmapNodeData,
  CoggleNodeData,
  CoggleEdgeData,
} from "@/types/roadmapGraph";
import { Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapEngineProps {
  roadmap: Roadmap;
  /** Hide the in-engine top header (used by the chrome-free fullscreen overlay). */
  compact?: boolean;
  /** Bump this number to reset progress + node positions back to the original stage. */
  resetSignal?: number;
  /** Optional callback when back button is pressed */
  onBack?: () => void;
  /** Optional callback when a roadmap tab is selected */
  onSelectRoadmap?: (id: Roadmap["id"]) => void;
}

// ─── Custom node/edge types registry ─────────────────────────────────────
const NODE_TYPES = {
  coggleRoot: CoggleRootNode,
  coggleNode: CoggleNode,
  roadmap: CoggleNode,
};

const EDGE_TYPES = {
  coggleEdge: CoggleEdge,
  roadmap: CoggleEdge,
};

// ─── Outer wrapper ────────────────────────────────────────────────────────

export function RoadmapEngine({
  roadmap,
  compact,
  resetSignal,
  onBack,
  onSelectRoadmap,
}: RoadmapEngineProps) {
  return (
    <ReactFlowProvider>
      <RoadmapEngineInner
        roadmap={roadmap}
        compact={compact}
        resetSignal={resetSignal}
        onBack={onBack}
        onSelectRoadmap={onSelectRoadmap}
      />
    </ReactFlowProvider>
  );
}

// ─── Inner component (uses `useReactFlow`) ───────────────────────────────

function RoadmapEngineInner({
  roadmap,
  compact,
  resetSignal,
  onBack,
  onSelectRoadmap,
}: RoadmapEngineProps) {
  const {
    progress,
    setStatus,
    clearAll,
    resetPositions,
  } = useRoadmapProgress(roadmap);

  const reactFlow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in-progress" | "completed" | "not-started">("all");

  // Reset collapsed nodes when switching roadmaps
  useEffect(() => {
    setCollapsedNodeIds(new Set());
    setSelectedNodeId(null);
    setSearchQuery("");
  }, [roadmap.id]);

  // Toggle single branch collapse
  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all branches
  const handleExpandAll = useCallback(() => {
    setCollapsedNodeIds(new Set());
    try {
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.18, duration: 400 });
      }, 50);
    } catch {}
  }, [reactFlow]);

  // Collapse all category branches
  const handleCollapseAll = useCallback(() => {
    const allCatIds = roadmap.categories.map((c) => `cat-${c.label}`);
    setCollapsedNodeIds(new Set(allCatIds));
    try {
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.22, duration: 400 });
      }, 50);
    } catch {}
  }, [roadmap.categories, reactFlow]);

  // Center on root topic
  const handleCenterRoot = useCallback(() => {
    try {
      reactFlow.setCenter(0, 0, { zoom: 1, duration: 450 });
    } catch {}
  }, [reactFlow]);

  // Compute Coggle bidirectional tree layout
  const layoutResult = useMemo(() => {
    return computeCoggleLayout({
      roadmap,
      progress,
      collapsedNodeIds,
      searchQuery,
      statusFilter,
      onToggleCollapse: handleToggleCollapse,
      onSelectNode: (id) => setSelectedNodeId(id),
    });
  }, [
    roadmap,
    progress,
    collapsedNodeIds,
    searchQuery,
    statusFilter,
    handleToggleCollapse,
  ]);

  // Add status and selected state to node data
  const nodes: Node<CoggleNodeData>[] = useMemo(() => {
    return layoutResult.nodes.map((node) => {
      const nodeStatus = getNodeStatus(progress, node.id);
      return {
        ...node,
        data: {
          ...node.data,
          status: nodeStatus,
        },
        selected: node.id === selectedNodeId,
      };
    });
  }, [layoutResult.nodes, progress, selectedNodeId]);

  // Enrich edges with hover/selection state
  const edges: Edge<CoggleEdgeData>[] = useMemo(() => {
    return layoutResult.edges.map((edge) => {
      const isConnectedToHovered =
        edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      const isConnectedToSelected =
        edge.source === selectedNodeId || edge.target === selectedNodeId;

      return {
        ...edge,
        data: {
          ...edge.data,
          isHovered: isConnectedToHovered,
          isActivePath: isConnectedToSelected,
        } as CoggleEdgeData,
      };
    });
  }, [layoutResult.edges, hoveredNodeId, selectedNodeId]);

  // Overall reactive completion statistics
  const stats = useMemo(() => computeCompletion(roadmap, progress), [roadmap, progress]);

  // Active node data for detail panel
  const activeNodeData = useMemo<RoadmapNodeData | null>(() => {
    if (!selectedNodeId) return null;

    // If Root selected
    if (selectedNodeId === "root") {
      return {
        id: "root",
        title: roadmap.title,
        subtitle: roadmap.subtitle,
        description: `Complete curriculum for ${roadmap.title}. Master ${roadmap.nodes.length} essential topics across ${roadmap.categories.length} core domains.`,
        resources: roadmap.nodes.length,
        category: "Overview",
        prerequisites: [],
        recommendedOrder: 0,
        accent: roadmap.accent,
      };
    }

    // If Category selected
    if (selectedNodeId.startsWith("cat-")) {
      const catName = selectedNodeId.replace("cat-", "");
      const catMeta = roadmap.categories.find((c) => c.label === catName);
      const catTopics = roadmap.nodes.filter((n) => n.data.category === catName);
      return {
        id: selectedNodeId,
        title: `${catName} Domain`,
        subtitle: `${catTopics.length} topics`,
        description: `Topics included in the ${catName} domain: ${catTopics
          .map((t) => t.data.title)
          .join(", ")}.`,
        resources: catTopics.reduce((acc, curr) => acc + (curr.data.resources || 0), 0),
        category: catName,
        prerequisites: [],
        recommendedOrder: 0,
        accent: catMeta?.color ?? roadmap.accent,
      };
    }

    // Regular topic node
    const found = roadmap.nodes.find((n) => n.id === selectedNodeId);
    return found?.data ?? null;
  }, [selectedNodeId, roadmap]);

  const activeStatus: NodeStatus = useMemo(
    () => (selectedNodeId ? getNodeStatus(progress, selectedNodeId) : "not-started"),
    [selectedNodeId, progress]
  );

  // Auto-fit view whenever switching roadmap or initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        reactFlow.fitView({ padding: 0.18, duration: 550 });
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [roadmap.id, reactFlow]);

  // When a node is selected, smoothly center camera on it
  useEffect(() => {
    if (!selectedNodeId || !rfInstance) return;
    const node = rfInstance.getNode(selectedNodeId);
    if (!node) return;

    const targetX = node.position.x + (node.measured?.width ?? 200) / 2;
    const targetY = node.position.y + (node.measured?.height ?? 64) / 2;

    rfInstance.setCenter(targetX, targetY, {
      zoom: Math.max(rfInstance.getZoom(), 0.85),
      duration: 400,
    });
  }, [selectedNodeId, rfInstance]);

  // Keyboard shortcut listeners (Esc to close/clear, 0 to center root, F to fit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          setSearchQuery("");
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSearchQuery("");
      } else if (e.key === "0") {
        handleCenterRoot();
      } else if (e.key === "f" || e.key === "F") {
        try {
          reactFlow.fitView({ padding: 0.18, duration: 400 });
        } catch {}
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCenterRoot, reactFlow]);

  // Node hover handlers
  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance);
  }, []);

  // Jump to prerequisite topic
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

  // Reset signal listener
  const resetSkipped = useRef(true);
  useEffect(() => {
    if (resetSkipped.current) {
      resetSkipped.current = false;
      return;
    }
    clearAll();
    resetPositions();
    setCollapsedNodeIds(new Set());
    handleCenterRoot();
  }, [resetSignal, clearAll, resetPositions, handleCenterRoot]);

  // Empty state
  if (roadmap.nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
          <MapIcon size={26} />
        </div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This roadmap doesn't have any topics yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground",
        "coggle-roadmap-shell"
      )}
      ref={wrapperRef}
    >
      {/* Studio Header */}
      <RoadmapHeader
        roadmap={roadmap}
        stats={stats}
        activeId={roadmap.id}
        compact={compact}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        matchedCount={layoutResult.matchedCount}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onCenterRoot={handleCenterRoot}
        onResetProgress={() => {
          clearAll();
          resetPositions();
          setCollapsedNodeIds(new Set());
        }}
        onBack={onBack}
        onSelectRoadmap={onSelectRoadmap}
      />

      {/* Mind-Map Canvas */}
      <div className="relative flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onInit={onInit}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          panOnScroll={false}
          zoomOnDoubleClick={false}
          minZoom={0.2}
          maxZoom={1.9}
          defaultEdgeOptions={{ type: "coggleEdge" }}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          className="coggle-canvas"
        >
          <RoadmapBackground />
          <RoadmapControls
            onCenterRoot={handleCenterRoot}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </ReactFlow>

        {/* Detail Panel Slide-Over */}
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
