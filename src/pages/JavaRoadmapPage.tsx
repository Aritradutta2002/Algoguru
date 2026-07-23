import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { javaMindMapData } from "@/data/javaMindMapData";
import type { GraphNode, GraphLink } from "@/types/mindMap.types";
import { Play, Pause, RotateCcw, Maximize2, Minimize2, ArrowLeft, Info, Fullscreen } from "lucide-react";

// ─── Node size helpers ──────────────────────────────────────────────────────
function nodeWidth(level: number) {
  if (level === 0) return 130;
  if (level === 1) return 150;
  if (level === 2) return 140;
  return 120;
}
function nodeHeight(level: number) {
  if (level === 0) return 52;
  if (level === 1) return 46;
  return 40;
}
function nodeFontSize(level: number) {
  if (level === 0) return "15px";
  if (level === 1) return "13px";
  return "11px";
}
function nodeOpacity(level: number) {
  if (level === 0) return 1;
  if (level === 1) return 0.9;
  if (level === 2) return 0.75;
  return 0.65;
}

// ─── Build flat nodes + links from nested tree ──────────────────────────────
function flattenTree(root: any): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  function traverse(node: any, parent?: GraphNode) {
    const graphNode: GraphNode = {
      id: node.id,
      name: node.name,
      level: node.level,
      color: node.color,
      children: node.children,
      collapsed: node.collapsed ?? true,
    };
    nodes.push(graphNode);

    if (parent) {
      links.push({ source: parent, target: graphNode, color: node.color });
    }

    if (node.children && !node.collapsed) {
      node.children.forEach((child: any) => traverse(child, graphNode));
    }
  }

  traverse(root);
  return { nodes, links };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function JavaRoadmapPage() {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const floatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Init data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const { nodes: n, links: l } = flattenTree(javaMindMapData);
    setNodes(n);
    setLinks(l);
  }, []);

  // ── Handle node click (expand / collapse) ──────────────────────────────────
  const handleNodeClick = useCallback((clickedNode: GraphNode) => {
    setSelectedNode(clickedNode);
    if (!clickedNode.children || clickedNode.children.length === 0) return;

    // toggle collapsed state on the source data
    function toggleInTree(node: any, targetId: string): boolean {
      if (node.id === targetId) {
        node.collapsed = !node.collapsed;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (toggleInTree(child, targetId)) return true;
        }
      }
      return false;
    }
    toggleInTree(javaMindMapData, clickedNode.id);

    const { nodes: newNodes, links: newLinks } = flattenTree(javaMindMapData);
    setNodes(newNodes);
    setLinks(newLinks);
    simulationRef.current?.alpha(0.5).restart();
  }, []);

  // ── Build / rebuild the D3 graph ───────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !gRef.current || nodes.length === 0) return;

    const svgEl = svgRef.current;
    const svg = d3.select(svgEl);
    const g = d3.select(gRef.current);

    const W = svgEl.clientWidth || 1200;
    const H = svgEl.clientHeight || 800;

    // clear previous render
    g.selectAll("*").remove();
    svg.selectAll("defs").remove();

    // ── Defs: glow filters + gradient defs ──────────────────────────────────
    const defs = svg.append("defs");

    nodes.forEach((node) => {
      const f = defs
        .append("filter")
        .attr("id", `glow-${node.id}`)
        .attr("x", "-60%").attr("y", "-60%")
        .attr("width", "220%").attr("height", "220%");
      f.append("feGaussianBlur").attr("stdDeviation", node.level === 0 ? "6" : "4").attr("result", "blur");
      const merge = f.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // ── Force simulation ─────────────────────────────────────────────────────
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d: any) => {
            const lvl = (d.target as GraphNode).level;
            return lvl === 1 ? 160 : lvl === 2 ? 130 : 110;
          })
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => nodeWidth(d.level) / 2 + 12))
      .velocityDecay(0.35)
      .alphaDecay(0.012);

    simulationRef.current = simulation;

    // ── Links ────────────────────────────────────────────────────────────────
    const linkSel = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGPathElement, GraphLink>("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", (d) => {
        const target = d.target as GraphNode;
        return target.level === 1 ? 2.5 : target.level === 2 ? 2 : 1.5;
      })
      .attr("stroke-opacity", 0.45)
      .attr("stroke-linecap", "round");

    // ── Nodes ────────────────────────────────────────────────────────────────
    const nodeSel = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // pill background
    nodeSel
      .append("rect")
      .attr("width", (d) => nodeWidth(d.level))
      .attr("height", (d) => nodeHeight(d.level))
      .attr("x", (d) => -nodeWidth(d.level) / 2)
      .attr("y", (d) => -nodeHeight(d.level) / 2)
      .attr("rx", (d) => nodeHeight(d.level) / 2)
      .attr("ry", (d) => nodeHeight(d.level) / 2)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", (d) => nodeOpacity(d.level))
      .attr("stroke", (d) => d3.color(d.color)?.brighter(0.8)?.toString() ?? d.color)
      .attr("stroke-width", (d) => (d.level === 0 ? 2.5 : 1.5))
      .attr("filter", (d) => `url(#glow-${d.id})`);

    // label
    nodeSel
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", (d) => nodeFontSize(d.level))
      .attr("font-weight", (d) => (d.level <= 1 ? "700" : "500"))
      .attr("font-family", "Inter, system-ui, sans-serif")
      .attr("pointer-events", "none")
      .attr("user-select", "none")
      // truncate long labels
      .each(function (d) {
        const maxChars = d.level === 0 ? 12 : d.level === 1 ? 16 : 14;
        if (d.name.length > maxChars) {
          d3.select(this).text(d.name.slice(0, maxChars - 1) + "…");
        }
      });

    // expand / collapse badge
    nodeSel
      .filter((d) => !!(d.children && d.children.length > 0))
      .append("circle")
      .attr("r", 9)
      .attr("cx", (d) => nodeWidth(d.level) / 2 - 4)
      .attr("cy", (d) => -nodeHeight(d.level) / 2 + 4)
      .attr("fill", "white")
      .attr("fill-opacity", 0.92)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5);

    nodeSel
      .filter((d) => !!(d.children && d.children.length > 0))
      .append("text")
      .text((d) => (d.collapsed ? "+" : "−"))
      .attr("x", (d) => nodeWidth(d.level) / 2 - 4)
      .attr("y", (d) => -nodeHeight(d.level) / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "900")
      .attr("fill", (d) => d.color)
      .attr("pointer-events", "none");

    // ── Interactions ─────────────────────────────────────────────────────────
    nodeSel
      .on("click", (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on("mouseenter", function (_event, d) {
        d3.select(this)
          .select("rect")
          .transition()
          .duration(180)
          .attr("fill-opacity", 1)
          .attr("stroke-width", d.level === 0 ? 3 : 2);
        d3.select(this)
          .transition()
          .duration(180)
          .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(1.08)`);
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this)
          .select("rect")
          .transition()
          .duration(180)
          .attr("fill-opacity", nodeOpacity(d.level))
          .attr("stroke-width", d.level === 0 ? 2.5 : 1.5);
        d3.select(this)
          .transition()
          .duration(180)
          .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(1)`);
      });

    // ── Tick ─────────────────────────────────────────────────────────────────
    simulation.on("tick", () => {
      linkSel.attr("d", (d: any) => {
        const sx = d.source.x ?? 0;
        const sy = d.source.y ?? 0;
        const tx = d.target.x ?? 0;
        const ty = d.target.y ?? 0;
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        // perpendicular offset for bezier curve
        const ox = (-dy / len) * 35;
        const oy = (dx / len) * 35;
        const cx = (sx + tx) / 2 + ox;
        const cy = (sy + ty) / 2 + oy;
        return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
      });

      nodeSel.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // ── Ambient float ─────────────────────────────────────────────────────────
    if (floatTimerRef.current) clearInterval(floatTimerRef.current);
    floatTimerRef.current = setInterval(() => {
      if (simulationRef.current && simulationRef.current.alpha() < 0.15) {
        nodes.forEach((n) => {
          if (n.fx == null) {
            n.vx = ((n.vx ?? 0) + (Math.random() - 0.5) * 0.6);
            n.vy = ((n.vy ?? 0) + (Math.random() - 0.5) * 0.6);
          }
        });
        simulationRef.current.alpha(0.12).restart();
      }
    }, 2500);

    // ── Zoom / Pan ────────────────────────────────────────────────────────────
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    zoomRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);

    // initial zoom-to-fit after first tick settle
    setTimeout(() => {
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(0.9).translate(-W / 2, -H / 2));
    }, 800);

    return () => {
      simulation.stop();
      if (floatTimerRef.current) clearInterval(floatTimerRef.current);
    };
  }, [nodes, links, handleNodeClick]);

  // ── Control handlers ───────────────────────────────────────────────────────
  const togglePause = () => {
    const sim = simulationRef.current;
    if (!sim) return;
    if (!isPaused) {
      sim.stop();
      if (floatTimerRef.current) clearInterval(floatTimerRef.current);
    } else {
      sim.alpha(0.3).restart();
    }
    setIsPaused((p) => !p);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen change events (e.g., Escape key)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const resetView = () => {
    const svg = d3.select(svgRef.current);
    const W = svgRef.current?.clientWidth ?? 1200;
    const H = svgRef.current?.clientHeight ?? 800;
    if (zoomRef.current) {
      svg.transition().duration(750).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(W / 2, H / 2).scale(0.9).translate(-W / 2, -H / 2)
      );
    }
    simulationRef.current?.alpha(0.8).restart();
  };

  const expandAll = () => {
    function expand(node: any) {
      node.collapsed = false;
      node.children?.forEach(expand);
    }
    expand(javaMindMapData);
    const { nodes: n, links: l } = flattenTree(javaMindMapData);
    setNodes(n);
    setLinks(l);
    simulationRef.current?.alpha(0.6).restart();
  };

  const collapseAll = () => {
    function collapse(node: any) {
      node.collapsed = true;
      node.children?.forEach(collapse);
    }
    javaMindMapData.children?.forEach(collapse);
    const { nodes: n, links: l } = flattenTree(javaMindMapData);
    setNodes(n);
    setLinks(l);
    simulationRef.current?.alpha(0.6).restart();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden select-none">

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-emerald-500/6 blur-[80px]" />
      </div>

      {/* ── Left control panel ──────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-2xl min-w-[160px]">

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-all"
        >
          <ArrowLeft size={14} />
          Back to Home
        </button>

        <div className="border-t border-border/40 my-1" />

        {/* Title */}
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
          Controls
        </div>

        <button
          onClick={togglePause}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-semibold transition-all"
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={resetView}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-semibold transition-all"
        >
          <RotateCcw size={13} />
          Reset View
        </button>

        <button
          onClick={expandAll}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-semibold transition-all"
        >
          <Maximize2 size={13} />
          Expand All
        </button>

        <button
          onClick={collapseAll}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-semibold transition-all"
        >
          <Minimize2 size={13} />
          Collapse All
        </button>

        <div className="border-t border-border/40 my-1" />

        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
          Display
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-semibold transition-all"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Fullscreen size={13} />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>

        <div className="border-t border-border/40 my-1" />

        {/* Stats */}
        <div className="text-[10px] text-muted-foreground px-1 space-y-1">
          <div>Nodes: <span className="text-foreground font-bold">{nodes.length}</span></div>
          {selectedNode && (
            <div>
              <span className="block">Selected:</span>
              <span
                className="font-bold text-[11px]"
                style={{ color: selectedNode.color }}
              >
                {selectedNode.name}
              </span>
            </div>
          )}
        </div>
      </div>


      {/* ── Info panel (top right) ───────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="mb-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card/70 backdrop-blur-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-lg"
        >
          <Info size={13} />
          {showInfo ? "Hide" : "Help"}
        </button>

        {showInfo && (
          <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-2xl w-52">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              How to use
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">▸</span>
                <span><strong className="text-foreground">Click</strong> a node to expand / collapse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">▸</span>
                <span><strong className="text-foreground">Drag</strong> nodes to reposition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">▸</span>
                <span><strong className="text-foreground">Scroll</strong> to zoom in / out</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">▸</span>
                <span><strong className="text-foreground">Drag canvas</strong> to pan around</span>
              </li>
            </ul>

            {/* Branch legend */}
            <div className="border-t border-border/40 mt-3 pt-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Branches
              </div>
              {[
                { color: "#A855F7", label: "Core Java" },
                { color: "#3B82F6", label: "Advance Java" },
                { color: "#10B981", label: "Prerequisites" },
                { color: "#F59E0B", label: "Modules" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                  <span className="text-[11px] text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── D3 SVG canvas ───────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      >
        <g ref={gRef} />
      </svg>
    </div>
  );
}
