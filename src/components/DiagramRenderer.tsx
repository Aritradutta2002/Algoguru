import { Diagram, DiagramBox, GraphDiagramData, GraphNode, GraphEdge } from "@/data/recursionContent";
import { motion } from "framer-motion";
import { useMemo } from "react";

const colorMap: Record<string, string> = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  heap: "var(--heap)",
  muted: "var(--muted-foreground)",
};

function getColor(c?: string) {
  const key = c || "primary";
  return colorMap[key] || colorMap.primary;
}

/** Nested layers diagram — e.g., JDK > JRE > JVM */
function LayersDiagram({ data, title }: { data: DiagramBox[]; title: string }) {
  const renderLayer = (box: DiagramBox, depth: number): React.ReactNode => {
    const col = getColor(box.color);
    const padding = 12 + depth * 3; // Reduced padding for mobile
    return (
      <div
        key={box.label}
        className="rounded-2xl relative min-w-0"
        style={{
          border: `2px solid hsl(${col} / 0.4)`,
          background: `hsl(${col} / ${0.04 + depth * 0.02})`,
          padding: `${padding}px`,
        }}
      >
        <div
          className="text-[10px] md:text-xs font-bold font-mono px-2 md:px-3 py-1 md:py-1.5 rounded-lg inline-block mb-2 md:mb-3"
          style={{
            background: `hsl(${col} / 0.15)`,
            color: `hsl(${col})`,
            border: `1px solid hsl(${col} / 0.3)`,
          }}
        >
          {box.label}
        </div>
        {box.children && (
          <div className="space-y-2 md:space-y-3">
            {box.children.map((child) => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {data.map((box) => renderLayer(box, 0))}
    </div>
  );
}

/** Hierarchy / tree diagram — e.g., Collections, Exception hierarchy */
function HierarchyDiagram({ data }: { data: DiagramBox[] }) {
  const renderNode = (box: DiagramBox, depth: number, isLast: boolean): React.ReactNode => {
    const col = getColor(box.color);
    return (
      <div key={box.label} className="relative min-w-0">
        <div className="flex items-center gap-1 md:gap-2">
          {depth > 0 && (
            <div className="flex items-center flex-shrink-0">
              {Array.from({ length: depth }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 md:w-5 h-full"
                  style={{ borderLeft: i === depth - 1 ? `2px solid hsl(${col} / 0.3)` : "2px solid transparent" }}
                />
              ))}
              <div className="w-4 md:w-5" style={{ borderBottom: `2px solid hsl(${col} / 0.3)` }} />
            </div>
          )}
          <div
            className="text-[10px] md:text-xs font-semibold font-mono px-2 md:px-3 py-1.5 md:py-2 rounded-lg inline-flex items-center gap-1.5 md:gap-2 min-w-0"
            style={{
              background: `hsl(${col} / 0.1)`,
              color: `hsl(${col})`,
              border: `1px solid hsl(${col} / 0.25)`,
            }}
          >
            <span
              className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0"
              style={{ background: `hsl(${col})` }}
            />
            <span className="truncate">{box.label}</span>
          </div>
        </div>
        {box.children && (
          <div className="ml-1 md:ml-2 mt-1 space-y-1">
            {box.children.map((child, i) =>
              renderNode(child, depth + 1, i === box.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {data.map((box, i) => renderNode(box, 0, i === data.length - 1))}
    </div>
  );
}

/** Flow diagram — e.g., Thread lifecycle, state machines */
function FlowDiagram({ data, direction = "horizontal" }: { data: DiagramBox[]; direction?: "vertical" | "horizontal" }) {
  const isVert = direction === "vertical";
  return (
    <div className={`flex ${isVert ? "flex-col" : "flex-row flex-wrap"} items-center gap-1 min-w-0`}>
      {data.map((box, i) => {
        const col = getColor(box.color);
        return (
          <div key={box.label} className={`flex ${isVert ? "flex-col" : "flex-row"} items-center gap-1 min-w-0`}>
            {i > 0 && (
              <div
                className={`flex items-center justify-center ${isVert ? "h-6" : "w-4 md:w-6"} flex-shrink-0`}
                style={{ color: `hsl(${getColor(data[i - 1].color || box.color)} / 0.5)` }}
              >
                {isVert ? "↓" : "→"}
              </div>
            )}
            <div
              className="text-[10px] md:text-xs font-semibold font-mono px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-center whitespace-nowrap min-w-0"
              style={{
                background: `hsl(${col} / 0.1)`,
                color: `hsl(${col})`,
                border: `1.5px solid hsl(${col} / 0.3)`,
                minWidth: "70px",
              }}
            >
              {box.label}
              {box.children && box.children.length > 0 && (
                <div className="mt-1.5 text-[9px] md:text-[10px] font-normal opacity-70">
                  {box.children.map((c) => c.label).join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Table visual — structured comparison blocks */
function TableVisualDiagram({ data }: { data: DiagramBox[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
      {data.map((box) => {
        const col = getColor(box.color);
        return (
          <div
            key={box.label}
            className="rounded-xl p-3 md:p-4 min-w-0"
            style={{
              background: `hsl(${col} / 0.06)`,
              border: `1px solid hsl(${col} / 0.2)`,
            }}
          >
            <div className="text-[10px] md:text-xs font-bold font-mono mb-1.5 md:mb-2 truncate" style={{ color: `hsl(${col})` }}>
              {box.label}
            </div>
            {box.children && (
              <ul className="space-y-1">
                {box.children.map((child) => (
                  <li key={child.label} className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] min-w-0" style={{ color: "hsl(var(--foreground) / 0.75)" }}>
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full flex-shrink-0" style={{ background: `hsl(${col} / 0.5)` }} />
                    <span className="truncate">{child.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Type guard to check if data is GraphDiagramData */
function isGraphDiagramData(data: DiagramBox[] | GraphDiagramData): data is GraphDiagramData {
  return data && typeof data === 'object' && 'nodes' in data && 'edges' in data;
}

/** Graph diagram — node-edge network visualizations */
function GraphDiagram({ data }: { data: GraphDiagramData }) {
  const { nodes, edges, directed = false, weighted = false, highlightPath = [] } = data;

  // Calculate node positions - use provided positions or auto-layout in a circle
  const positionedNodes = useMemo(() => {
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    if (nodes.some(n => n.x !== undefined && n.y !== undefined)) {
      // Use provided positions (percentage-based)
      nodes.forEach(n => {
        nodePositions.set(n.id, { 
          x: (n.x ?? 50) / 100, 
          y: (n.y ?? 50) / 100 
        });
      });
    } else {
      // Auto-layout: distribute nodes in a circle
      const count = nodes.length;
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        const radius = 0.35; // 35% from center
        nodePositions.set(n.id, {
          x: 0.5 + radius * Math.cos(angle),
          y: 0.5 + radius * Math.sin(angle)
        });
      });
    }
    
    return nodePositions;
  }, [nodes]);

  // Build edge paths
  const edgePaths = useMemo(() => {
    return edges.map(edge => {
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
    }).filter(Boolean) as (GraphEdge & { x1: number; y1: number; x2: number; y2: number; isHighlighted: boolean })[];
  }, [edges, positionedNodes, highlightPath]);

  const getNodeColor = (node: GraphNode) => {
    const baseColor = getColor(node.color);
    if (highlightPath.includes(node.id)) return "var(--success)";
    if (node.highlight) return "var(--accent)";
    return baseColor;
  };

  return (
    <div className="relative w-full aspect-[16/10] min-h-[200px]">
      <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {edgePaths.map((edge, i) => {
          const midX = (edge.x1 + edge.x2) / 2 * 100;
          const midY = (edge.y1 + edge.y2) / 2 * 60;
          
          return (
            <g key={`edge-${i}`}>
              <line
                x1={edge.x1 * 100}
                y1={edge.y1 * 60}
                x2={edge.x2 * 100}
                y2={edge.y2 * 60}
                stroke={edge.isHighlighted ? "hsl(var(--success))" : `hsl(${getColor(edge.color)})`}
                strokeWidth={edge.isHighlighted ? 0.8 : 0.4}
                strokeOpacity={0.8}
              />
              {/* Arrow for directed graphs */}
              {directed && (
                <polygon
                  points={`${edge.x2 * 100 - 2},${edge.y2 * 60 - 1} ${edge.x2 * 100},${edge.y2 * 60} ${edge.x2 * 100 - 2},${edge.y2 * 60 + 1}`}
                  fill={`hsl(${getColor(edge.color)})`}
                  transform={`rotate(${Math.atan2((edge.y2 - edge.y1) * 60, (edge.x2 - edge.x1) * 100) * 180 / Math.PI}, ${edge.x2 * 100}, ${edge.y2 * 60})`}
                />
              )}
              {/* Weight label */}
              {weighted && edge.weight !== undefined && (
                <g>
                  <circle cx={midX} cy={midY} r={2.5} fill="hsl(var(--card))" stroke={`hsl(${getColor(edge.color)})`} strokeWidth={0.2} />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="2.5"
                    fill={`hsl(${getColor(edge.color)})`}
                    fontWeight="bold"
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
          
          return (
            <g key={node.id}>
              <circle
                cx={pos.x * 100}
                cy={pos.y * 60}
                r={isInPath ? 5 : 4}
                fill={`hsl(${color})`}
                stroke="hsl(var(--card))"
                strokeWidth={0.5}
              />
              <text
                x={pos.x * 100}
                y={pos.y * 60}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="3"
                fill="white"
                fontWeight="bold"
              >
                {node.label || node.id}
              </text>
              {/* Node highlight ring */}
              {(isInPath || node.highlight) && (
                <circle
                  cx={pos.x * 100}
                  cy={pos.y * 60}
                  r={6}
                  fill="none"
                  stroke={`hsl(${color})`}
                  strokeWidth={0.5}
                  strokeOpacity={0.5}
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      {(weighted || directed) && (
        <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] font-mono">
          {weighted && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/20 border border-primary" />
              <span className="text-muted-foreground">Weighted</span>
            </div>
          )}
          {directed && (
            <div className="flex items-center gap-1">
              <span className="text-primary">→</span>
              <span className="text-muted-foreground">Directed</span>
            </div>
          )}
          {highlightPath.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Path</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DiagramRenderer({ diagram }: { diagram: Diagram }) {
  return (
    <motion.div
      className="rounded-2xl p-4 md:p-6 mb-8 overflow-x-auto"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-card)",
      }}
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4 md:mb-5 font-mono flex items-center gap-2"
        style={{ color: "hsl(var(--primary))" }}
      >
        <span
          className="w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-[10px] md:text-[11px]"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          📊
        </span>
        {diagram.title}
      </div>

      <div className="min-w-0 max-w-full">
        {diagram.type === "layers" && <LayersDiagram data={diagram.data as DiagramBox[]} title={diagram.title} />}
        {diagram.type === "hierarchy" && <HierarchyDiagram data={diagram.data as DiagramBox[]} />}
        {diagram.type === "flow" && <FlowDiagram data={diagram.data as DiagramBox[]} direction={diagram.direction} />}
        {diagram.type === "table-visual" && <TableVisualDiagram data={diagram.data as DiagramBox[]} />}
        {diagram.type === "graph" && <GraphDiagram data={diagram.data as GraphDiagramData} />}
      </div>
    </motion.div>
  );
}
