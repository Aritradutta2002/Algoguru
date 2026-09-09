import React, { useMemo, useState } from "react";
import { Diagram, DiagramBox, GraphDiagramData, GraphNode, GraphEdge } from "@/data/recursionContent";
import { motion } from "framer-motion";
import {
  Layers,
  GitFork,
  Workflow,
  TableProperties,
  Network,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Activity,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

/* ── Color Palette Helper ── */
const colorMap: Record<string, string> = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  heap: "var(--heap)",
  muted: "var(--muted-foreground)",
  destructive: "var(--destructive)",
};

function getColor(c?: string) {
  const key = c || "primary";
  return colorMap[key] || colorMap.primary;
}

/* ══════════════════════════════════════════════════════════
   1. LAYERS DIAGRAM (Stacked Architectural Blueprints)
   ══════════════════════════════════════════════════════════ */
function LayersDiagram({ data }: { data: DiagramBox[] }) {
  const tierLabels = [
    "Tier 1 / Host Environment",
    "Tier 2 / Runtime Container",
    "Tier 3 / Execution Core",
    "Tier 4 / Internal Subsystem",
  ];

  const renderLayer = (box: DiagramBox, depth: number): React.ReactNode => {
    const col = getColor(box.color);
    const hasChildren = Boolean(box.children && box.children.length > 0);
    const tier = tierLabels[depth] || `Tier ${depth + 1}`;

    return (
      <div
        key={box.label}
        className="rounded-2xl transition-all duration-300 min-w-0"
        style={{
          border: `1.5px solid hsl(${col} / ${0.35 + depth * 0.08})`,
          background: `hsl(${col} / ${0.04 + depth * 0.035})`,
          boxShadow: depth === 0 ? `0 4px 20px -2px hsl(${col} / 0.1)` : undefined,
          padding: `${Math.max(14, 20 - depth * 3)}px`,
        }}
      >
        {/* Layer Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: `hsl(${col})`,
                boxShadow: `0 0 10px hsl(${col} / 0.8)`,
              }}
            />
            <span className="text-xs md:text-sm font-bold font-mono tracking-tight text-foreground truncate">
              {box.label}
            </span>
          </div>

          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider"
            style={{
              background: `hsl(${col} / 0.15)`,
              color: `hsl(${col})`,
              border: `1px solid hsl(${col} / 0.35)`,
            }}
          >
            {tier}
          </span>
        </div>

        {/* Nested Child Layers */}
        {hasChildren && (
          <div className="space-y-3 mt-3">
            {box.children!.map((child) => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      {data.map((box) => renderLayer(box, 0))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   2. HIERARCHY DIAGRAM (Class, Interface & Tree Hierarchies)
   ══════════════════════════════════════════════════════════ */
function parseHierarchyLabel(label: string): { title: string; subtitle?: string } {
  if (label.includes(" — ")) {
    const [title, ...rest] = label.split(" — ");
    return { title: title.trim(), subtitle: rest.join(" — ").trim() };
  }
  if (label.includes(" - ")) {
    const [title, ...rest] = label.split(" - ");
    return { title: title.trim(), subtitle: rest.join(" - ").trim() };
  }
  return { title: label };
}

function HierarchyDiagram({ data }: { data: DiagramBox[] }) {
  const renderNode = (box: DiagramBox, depth: number): React.ReactNode => {
    const col = getColor(box.color);
    const { title, subtitle } = parseHierarchyLabel(box.label);
    const hasChildren = Boolean(box.children && box.children.length > 0);

    return (
      <div key={box.label} className="relative min-w-0">
        <div className="flex items-start gap-2.5">
          {/* Node Card */}
          <div
            className="inline-flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: `hsl(${col} / 0.08)`,
              borderColor: `hsl(${col} / 0.35)`,
              boxShadow: `0 2px 10px -2px hsl(${col} / 0.12)`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: `hsl(${col})`, boxShadow: `0 0 6px hsl(${col} / 0.7)` }}
              />
              <span className="text-xs md:text-sm font-bold font-mono text-foreground tracking-tight">
                {title}
              </span>
              {depth === 0 && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground font-semibold">
                  Root
                </span>
              )}
            </div>

            {subtitle && (
              <span
                className="text-[11px] font-sans px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: `hsl(${col} / 0.12)`,
                  color: `hsl(${col})`,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Children indented with vertical rail */}
        {hasChildren && (
          <div
            className="relative ml-4 md:ml-6 pl-4 md:pl-5 border-l-2 mt-2.5 space-y-2.5"
            style={{ borderColor: `hsl(${col} / 0.3)` }}
          >
            {box.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      {data.map((box) => renderNode(box, 0))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   3. FLOW DIAGRAM (Execution Pipelines & State Transitions)
   ══════════════════════════════════════════════════════════ */
function FlowDiagram({
  data,
  direction = "horizontal",
}: {
  data: DiagramBox[];
  direction?: "vertical" | "horizontal";
}) {
  const isVert = direction === "vertical";

  return (
    <div className="p-3 md:p-6 overflow-x-auto scrollbar-thin">
      <div
        className={
          isVert
            ? "flex flex-col gap-3 max-w-lg mx-auto"
            : "flex flex-row items-center gap-3 min-w-max pb-2"
        }
      >
        {data.map((box, i) => {
          const col = getColor(box.color);
          const stepNum = String(i + 1).padStart(2, "0");

          return (
            <div
              key={box.label}
              className={isVert ? "flex flex-col gap-2" : "flex items-center gap-3 shrink-0"}
            >
              {/* Step Card */}
              <div
                className="relative flex flex-col justify-between p-4 rounded-xl border min-w-[175px] max-w-[250px] transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
                style={{
                  background: `hsl(${col} / 0.07)`,
                  borderColor: `hsl(${col} / 0.35)`,
                  boxShadow: `0 4px 14px -3px hsl(${col} / 0.12)`,
                }}
              >
                {/* Top Accent Strip */}
                <div
                  className="absolute top-0 left-3 right-3 h-[2.5px] rounded-full"
                  style={{ background: `hsl(${col})`, boxShadow: `0 0 8px hsl(${col})` }}
                />

                <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(${col} / 0.2)`,
                      color: `hsl(${col})`,
                      border: `1px solid hsl(${col} / 0.4)`,
                    }}
                  >
                    STEP {stepNum}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${col})` }} />
                </div>

                <div className="text-xs md:text-sm font-bold font-mono text-foreground leading-snug">
                  {box.label}
                </div>

                {box.children && box.children.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                    {box.children.map((c) => (
                      <span
                        key={c.label}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold"
                        style={{
                          background: `hsl(${col} / 0.15)`,
                          color: `hsl(${col})`,
                          border: `1px solid hsl(${col} / 0.3)`,
                        }}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Connector */}
              {i < data.length - 1 && (
                <div
                  className={
                    isVert
                      ? "flex items-center justify-center py-1 text-muted-foreground"
                      : "flex items-center justify-center text-muted-foreground shrink-0 px-1"
                  }
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full border bg-card/90 shadow-sm"
                    style={{ borderColor: `hsl(${col} / 0.4)`, color: `hsl(${col})` }}
                  >
                    {isVert ? <ArrowDown size={14} strokeWidth={2.5} /> : <ArrowRight size={14} strokeWidth={2.5} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   4. TABLE VISUAL (Structured Comparison Matrix Cards)
   ══════════════════════════════════════════════════════════ */
function TableVisualDiagram({ data }: { data: DiagramBox[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-3 md:p-6">
      {data.map((box, idx) => {
        const col = getColor(box.color);

        return (
          <div
            key={box.label}
            className="rounded-2xl border p-4 md:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
            style={{
              background: `hsl(${col} / 0.05)`,
              borderColor: `hsl(${col} / 0.3)`,
              boxShadow: `0 4px 16px -4px hsl(${col} / 0.12)`,
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider"
                  style={{
                    background: `hsl(${col} / 0.16)`,
                    color: `hsl(${col})`,
                    border: `1px solid hsl(${col} / 0.35)`,
                  }}
                >
                  Category {idx + 1}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: `hsl(${col})`, boxShadow: `0 0 8px hsl(${col})` }}
                />
              </div>

              <h4 className="text-sm md:text-base font-bold font-mono text-foreground mb-3 tracking-tight">
                {box.label}
              </h4>

              {box.children && (
                <ul className="space-y-2">
                  {box.children.map((child, cIdx) => (
                    <li
                      key={cIdx}
                      className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed text-foreground/85"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                        style={{ background: `hsl(${col})` }}
                      />
                      <span>{child.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5. GRAPH DIAGRAM (High-Definition Vector Network Graph)
   ══════════════════════════════════════════════════════════ */
const SVG_WIDTH = 700;
const SVG_HEIGHT = 420;
const NODE_RADIUS = 22;

function GraphDiagram({ data }: { data: GraphDiagramData }) {
  const { nodes, edges, directed = false, weighted = false, highlightPath = [] } = data;
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Position nodes with safe margins (40px)
  const positionedNodes = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const hasCustomCoords = nodes.some((n) => n.x !== undefined && n.y !== undefined);

    if (hasCustomCoords) {
      nodes.forEach((n) => {
        const xPercent = (n.x ?? 50) / 100;
        const yPercent = (n.y ?? 50) / 100;
        map.set(n.id, {
          x: 45 + xPercent * (SVG_WIDTH - 90),
          y: 40 + yPercent * (SVG_HEIGHT - 80),
        });
      });
    } else {
      const count = nodes.length;
      const radius = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.35;
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        map.set(n.id, {
          x: SVG_WIDTH / 2 + radius * Math.cos(angle),
          y: SVG_HEIGHT / 2 + radius * Math.sin(angle),
        });
      });
    }
    return map;
  }, [nodes]);

  // Edges calculation
  const edgePaths = useMemo(() => {
    return edges
      .map((edge) => {
        const fromPos = positionedNodes.get(edge.from);
        const toPos = positionedNodes.get(edge.to);
        if (!fromPos || !toPos) return null;

        const isInPath = highlightPath.includes(edge.from) && highlightPath.includes(edge.to);
        const pathIndex = highlightPath.indexOf(edge.to);
        const fromIndex = highlightPath.indexOf(edge.from);
        const isForwardPath = pathIndex > -1 && fromIndex > -1 && pathIndex === fromIndex + 1;

        return {
          ...edge,
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
          isHighlighted: isInPath && isForwardPath,
        };
      })
      .filter(Boolean) as (GraphEdge & {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isHighlighted: boolean;
    })[];
  }, [edges, positionedNodes, highlightPath]);

  const getNodeColor = (node: GraphNode) => {
    if (highlightPath.includes(node.id)) return "var(--success)";
    if (node.highlight) return "var(--accent)";
    return getColor(node.color);
  };

  return (
    <div className="relative w-full p-2 md:p-4">
      <div className="relative w-full aspect-[16/10] min-h-[260px] max-h-[500px]">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Arrow Marker for Directed Edges */}
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX="30"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="hsl(var(--primary))" />
            </marker>

            {/* Highlighted Arrow Marker */}
            <marker
              id="graph-arrow-highlight"
              viewBox="0 0 10 10"
              refX="30"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="hsl(var(--success))" />
            </marker>

            {/* Glow Filter */}
            <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {edgePaths.map((edge, i) => {
            const isConnectedToHover =
              hoveredNode === edge.from || hoveredNode === edge.to;
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={
                    edge.isHighlighted
                      ? "hsl(var(--success))"
                      : isConnectedToHover
                      ? "hsl(var(--primary))"
                      : `hsl(${getColor(edge.color)})`
                  }
                  strokeWidth={edge.isHighlighted || isConnectedToHover ? 3.5 : 2}
                  strokeOpacity={
                    hoveredNode && !isConnectedToHover && !edge.isHighlighted ? 0.25 : 0.85
                  }
                  markerEnd={
                    directed
                      ? edge.isHighlighted
                        ? "url(#graph-arrow-highlight)"
                        : "url(#graph-arrow)"
                      : undefined
                  }
                />

                {/* Weight badge */}
                {weighted && edge.weight !== undefined && (
                  <g>
                    <rect
                      x={midX - 16}
                      y={midY - 11}
                      width={32}
                      height={22}
                      rx={6}
                      fill="hsl(var(--card))"
                      stroke={
                        edge.isHighlighted
                          ? "hsl(var(--success))"
                          : `hsl(${getColor(edge.color)})`
                      }
                      strokeWidth={1.5}
                      className="shadow-sm"
                    />
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="11"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="700"
                      fill="hsl(var(--foreground))"
                    >
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positionedNodes.get(node.id);
            if (!pos) return null;
            const color = getNodeColor(node);
            const isInPath = highlightPath.includes(node.id);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glow ring for active / highlighted node */}
                {(isInPath || node.highlight || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 7}
                    fill="none"
                    stroke={`hsl(${color})`}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    className="animate-pulse"
                  />
                )}

                {/* Node Solid Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? NODE_RADIUS + 3 : NODE_RADIUS}
                  fill={`hsl(${color})`}
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                  style={{
                    filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))",
                    transition: "r 0.15s ease",
                  }}
                />

                {/* Node Label Text */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="700"
                  fill="#ffffff"
                  style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.6))" }}
                >
                  {node.label || node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-border/60 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          {directed && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <span className="text-sm">→</span> Directed
            </span>
          )}
          {weighted && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="w-2 h-2 rounded-full border border-primary bg-primary/20" /> Weighted
            </span>
          )}
          {highlightPath.length > 0 && (
            <span className="flex items-center gap-1 text-success font-semibold">
              <span className="w-2 h-2 rounded-full bg-success" /> Traversed Path
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-muted/60 border border-border">
            V: {nodes.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-muted/60 border border-border">
            E: {edges.length}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MASTER DIAGRAM CONTAINER
   ══════════════════════════════════════════════════════════ */
const DIAGRAM_TYPE_CONFIG: Record<
  Diagram["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  layers: {
    label: "Architecture Layers",
    icon: <Layers size={15} />,
    color: "var(--primary)",
  },
  hierarchy: {
    label: "Class & Type Hierarchy",
    icon: <GitFork size={15} />,
    color: "var(--info)",
  },
  flow: {
    label: "Pipeline & State Flow",
    icon: <Workflow size={15} />,
    color: "var(--warning)",
  },
  "table-visual": {
    label: "Comparison Matrix",
    icon: <TableProperties size={15} />,
    color: "var(--success)",
  },
  graph: {
    label: "Network Graph",
    icon: <Network size={15} />,
    color: "var(--accent)",
  },
};

export function DiagramRenderer({ diagram }: { diagram: Diagram }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = DIAGRAM_TYPE_CONFIG[diagram.type] || {
    label: "System Diagram",
    icon: <Sparkles size={15} />,
    color: "var(--primary)",
  };

  return (
    <motion.div
      className={`diag-frame transition-all duration-300 ${
        isExpanded ? "ring-2 ring-primary/40 shadow-2xl" : ""
      }`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Technical Blueprint Header Bar ── */}
      <div className="diag-header-bar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{
              background: `hsl(${typeConfig.color} / 0.15)`,
              color: `hsl(${typeConfig.color})`,
              border: `1px solid hsl(${typeConfig.color} / 0.3)`,
            }}
          >
            {typeConfig.icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-bold text-foreground truncate tracking-tight font-sans">
              {diagram.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline-flex text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              background: `hsl(${typeConfig.color} / 0.12)`,
              color: `hsl(${typeConfig.color})`,
              border: `1px solid hsl(${typeConfig.color} / 0.25)`,
            }}
          >
            {typeConfig.label}
          </span>

          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-md">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Visualizer</span>
          </span>

          <AppTooltip content={isExpanded ? "Collapse view" : "Expand view"}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle diagram size"
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </AppTooltip>
        </div>
      </div>

      {/* ── Diagram Blueprint Canvas ── */}
      <div className="diag-canvas-bg min-w-0 max-w-full overflow-x-auto">
        {diagram.type === "layers" && (
          <LayersDiagram data={diagram.data as DiagramBox[]} />
        )}
        {diagram.type === "hierarchy" && (
          <HierarchyDiagram data={diagram.data as DiagramBox[]} />
        )}
        {diagram.type === "flow" && (
          <FlowDiagram
            data={diagram.data as DiagramBox[]}
            direction={diagram.direction}
          />
        )}
        {diagram.type === "table-visual" && (
          <TableVisualDiagram data={diagram.data as DiagramBox[]} />
        )}
        {diagram.type === "graph" && (
          <GraphDiagram data={diagram.data as GraphDiagramData} />
        )}
      </div>
    </motion.div>
  );
}
