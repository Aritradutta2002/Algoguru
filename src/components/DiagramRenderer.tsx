import React, { useMemo, useState } from "react";
import { Diagram, DiagramBox, GraphDiagramData, GraphNode, GraphEdge } from "@/data/recursionContent";
import { motion } from "framer-motion";
import {
  Layers,
  GitFork,
  Workflow,
  TableProperties,
  Network,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

/* ══════════════════════════════════════════════════════════════
   EXACT PALETTES & THEME SYSTEM (Identical to User Image)
   ══════════════════════════════════════════════════════════════ */
export interface Palette {
  containerLight: string;
  containerDark: string;
  boxLight: string;
  boxDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
}

export const DIAGRAM_PALETTES: Record<string, Palette> = {
  // 1. Sky Blue (e.g. Class Loader / Loading / Linking / Initialization)
  info: {
    containerLight: "#cbe8f8",
    containerDark: "#18334d",
    boxLight: "#9fd1f0",
    boxDark: "#234e75",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
  // 2. Warm Orange / Tan (e.g. Runtime Data Area / Method / Heap / Stack)
  warning: {
    containerLight: "#fde7be",
    containerDark: "#45321a",
    boxLight: "#fbc984",
    boxDark: "#6e4b23",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
  // 3. Soft Lavender / Purple (e.g. Execution Engine / Interpreter / JIT)
  accent: {
    containerLight: "#ded4eb",
    containerDark: "#3a2b52",
    boxLight: "#bfaee0",
    boxDark: "#5c4382",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
  // 4. Sea Green / Mint (e.g. Native Method Interface (JNI) & Native Library)
  success: {
    containerLight: "#52aa90",
    containerDark: "#1d5747",
    boxLight: "#63bfa6",
    boxDark: "#277660",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
  // 5. Warm Amber / Peach
  primary: {
    containerLight: "#fed7aa",
    containerDark: "#43281c",
    boxLight: "#fdba74",
    boxDark: "#7c3e1d",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
  // 6. Neutral Slate
  muted: {
    containerLight: "#e2e8f0",
    containerDark: "#1e293b",
    boxLight: "#cbd5e1",
    boxDark: "#334155",
    borderLight: "#1e293b",
    borderDark: "#cbd5e1",
    textLight: "#0f172a",
    textDark: "#f8fafc",
  },
};

const PALETTE_CYCLE: Palette[] = [
  DIAGRAM_PALETTES.info,
  DIAGRAM_PALETTES.warning,
  DIAGRAM_PALETTES.accent,
  DIAGRAM_PALETTES.success,
  DIAGRAM_PALETTES.primary,
];

function getPalette(key?: string, index: number = 0): Palette {
  if (key && DIAGRAM_PALETTES[key]) return DIAGRAM_PALETTES[key];
  return PALETTE_CYCLE[index % PALETTE_CYCLE.length];
}

/* ══════════════════════════════════════════════════════════════
   SOLID DOUBLE-HEADED & SINGLE-HEADED CONNECTOR ARROWS
   ══════════════════════════════════════════════════════════════ */
function DoubleVerticalArrow({ height = 36, className = "" }: { height?: number; className?: string }) {
  return (
    <svg
      width="22"
      height={height}
      viewBox={`0 0 22 ${height}`}
      className={`shrink-0 text-slate-800 dark:text-slate-200 ${className}`}
    >
      {/* Top arrowhead */}
      <polygon points="11,1 6,8 16,8" fill="currentColor" />
      {/* Central shaft */}
      <line x1="11" y1="7" x2="11" y2={height - 7} stroke="currentColor" strokeWidth="3.5" />
      {/* Bottom arrowhead */}
      <polygon points={`11,${height - 1} 6,${height - 8} 16,${height - 8}`} fill="currentColor" />
    </svg>
  );
}

function DoubleHorizontalArrow({ width = 42, className = "" }: { width?: number; className?: string }) {
  return (
    <svg
      width={width}
      height="22"
      viewBox={`0 0 ${width} 22`}
      className={`shrink-0 text-slate-800 dark:text-slate-200 ${className}`}
    >
      {/* Left arrowhead */}
      <polygon points="1,11 8,6 8,16" fill="currentColor" />
      {/* Central shaft */}
      <line x1="7" y1="11" x2={width - 7} y2="11" stroke="currentColor" strokeWidth="3.5" />
      {/* Right arrowhead */}
      <polygon points={`${width - 1},11 ${width - 8},6 ${width - 8},16`} fill="currentColor" />
    </svg>
  );
}

function SingleHorizontalArrow({ width = 42, className = "" }: { width?: number; className?: string }) {
  return (
    <svg
      width={width}
      height="22"
      viewBox={`0 0 ${width} 22`}
      className={`shrink-0 text-slate-800 dark:text-slate-200 ${className}`}
    >
      <line x1="2" y1="11" x2={width - 7} y2="11" stroke="currentColor" strokeWidth="3.5" />
      <polygon points={`${width - 1},11 ${width - 8},6 ${width - 8},16`} fill="currentColor" />
    </svg>
  );
}

function SingleVerticalArrow({ height = 36, className = "" }: { height?: number; className?: string }) {
  return (
    <svg
      width="22"
      height={height}
      viewBox={`0 0 22 ${height}`}
      className={`shrink-0 text-slate-800 dark:text-slate-200 ${className}`}
    >
      <line x1="11" y1="2" x2="11" y2={height - 7} stroke="currentColor" strokeWidth="3.5" />
      <polygon points={`11,${height - 1} 6,${height - 8} 16,${height - 8}`} fill="currentColor" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   1. PIXEL-PERFECT "JVM ARCHITECTURE" BLUEPRINT (Exact Image)
   ══════════════════════════════════════════════════════════════ */
const JVM_TOOLTIPS: Record<string, string> = {
  "Class Loader": "Subsystem that loads, links, and initializes binary class files (.class) into memory.",
  Loading: "Finds and imports binary data for types (Bootstrap, Extension, Application class loaders).",
  Linking: "Combines class into runtime state: Verification → Preparation → Resolution.",
  Initialization: "Executes static initializers and static variable initial values (<clinit>).",
  "Runtime Data Area": "JVM Memory allocated on host OS for storing data during bytecode execution.",
  "Method Area": "Shared across threads: stores per-class structures, bytecode, constant pool, static variables.",
  "Heap Area": "Shared across threads: runtime memory area for all objects and arrays. Managed by GC.",
  "Stack Area": "One per thread: creates a stack frame per method call storing local variables, operand stack, return address.",
  "PC Register": "One per thread: holds the memory address of the JVM instruction currently being executed.",
  "Native Method Stack": "One per thread: contains state for native methods (C/C++ or assembly) invoked via JNI.",
  "Execution Engine": "Executes bytecode line by line or compiles hot methods to native machine instructions.",
  Interpreter: "Reads and interprets bytecode instructions line-by-line (quick start, slower throughput).",
  "JIT Compiler": "Just-In-Time Compiler: compiles hot bytecode into native machine code executed directly by the CPU.",
  "Garbage Collector": "Automatically reclaims heap memory occupied by unreferenced/unreachable objects.",
  "Native Method Interface (JNI)": "Bridge enabling Java code to interact with native libraries (C, C++, assembly).",
  "Native Method Library": "Collection of platform-specific libraries (.dll, .so, .dylib) required by native operations.",
};

function JVMArchitectureBlueprint() {
  return (
    <div className="p-4 md:p-8 overflow-x-auto select-none">
      <div className="min-w-[760px] max-w-[940px] mx-auto flex flex-col items-center">
        {/* ── 1. TOP CONTAINER: Class Loader Subsystem ── */}
        <AppTooltip content={JVM_TOOLTIPS["Class Loader"]}>
          <div className="w-full max-w-[620px] rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 bg-[#cbe8f8] dark:bg-[#18334d] p-3 shadow-md">
            <div className="text-center font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 mb-2.5 tracking-tight">
              Class Loader
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Loading", "Linking", "Initialization"].map((step) => (
                <AppTooltip key={step} content={JVM_TOOLTIPS[step] || step}>
                  <div className="flex items-center justify-center py-2.5 px-3 rounded-lg border-[2px] border-slate-800 dark:border-slate-300 bg-[#9fd1f0] dark:bg-[#234e75] text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm text-center shadow-xs cursor-default hover:brightness-95 transition-all">
                    {step}
                  </div>
                </AppTooltip>
              ))}
            </div>
          </div>
        </AppTooltip>

        {/* Vertical arrow: Class Loader ↕ Runtime Data Area */}
        <div className="flex justify-center py-1">
          <DoubleVerticalArrow height={38} />
        </div>

        {/* ── 2. MIDDLE CONTAINER: Runtime Data Area ── */}
        <AppTooltip content={JVM_TOOLTIPS["Runtime Data Area"]}>
          <div className="w-full rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 bg-[#fde7be] dark:bg-[#45321a] p-3 shadow-md">
            <div className="text-center font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 mb-2.5 tracking-tight">
              Runtime Data Area
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {[
                "Method Area",
                "Heap Area",
                "Stack Area",
                "PC Register",
                "Native Method Stack",
              ].map((area) => (
                <AppTooltip key={area} content={JVM_TOOLTIPS[area] || area}>
                  <div className="flex items-center justify-center py-3.5 px-2 rounded-lg border-[2px] border-slate-800 dark:border-slate-300 bg-[#fbc984] dark:bg-[#6e4b23] text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm text-center leading-tight shadow-xs cursor-default hover:brightness-95 transition-all">
                    {area}
                  </div>
                </AppTooltip>
              ))}
            </div>
          </div>
        </AppTooltip>

        {/* Connectors row from Runtime Data Area down to Execution Engine & JNI */}
        <div className="w-full flex justify-between px-16 py-1">
          <div className="flex justify-center w-[410px]">
            <DoubleVerticalArrow height={38} />
          </div>
          <div className="flex justify-center w-[130px]">
            <DoubleVerticalArrow height={38} />
          </div>
          <div className="w-[130px]" />
        </div>

        {/* ── 3. BOTTOM ROW: Execution Engine + JNI + Native Method Library ── */}
        <div className="w-full flex items-center justify-between gap-3">
          {/* Execution Engine Box */}
          <AppTooltip content={JVM_TOOLTIPS["Execution Engine"]}>
            <div className="flex-1 max-w-[430px] rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 bg-[#ded4eb] dark:bg-[#3a2b52] p-3 shadow-md">
              <div className="text-center font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 mb-2.5 tracking-tight">
                Execution Engine
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Interpreter", "JIT\nCompiler", "Garbage\nCollector"].map((comp) => {
                  const key = comp.replace("\n", " ");
                  return (
                    <AppTooltip key={comp} content={JVM_TOOLTIPS[key] || comp}>
                      <div className="flex items-center justify-center py-3 px-1.5 rounded-lg border-[2px] border-slate-800 dark:border-slate-300 bg-[#bfaee0] dark:bg-[#5c4382] text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm text-center leading-tight shadow-xs whitespace-pre-line cursor-default hover:brightness-95 transition-all">
                        {comp}
                      </div>
                    </AppTooltip>
                  );
                })}
              </div>
            </div>
          </AppTooltip>

          {/* Horizontal arrow: Execution Engine ↔ JNI */}
          <DoubleHorizontalArrow width={42} />

          {/* Native Method Interface (JNI) */}
          <AppTooltip content={JVM_TOOLTIPS["Native Method Interface (JNI)"]}>
            <div className="w-[130px] h-[104px] flex items-center justify-center p-2 rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 bg-[#52aa90] dark:bg-[#1d5747] text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm text-center leading-tight shadow-md cursor-default hover:brightness-95 transition-all">
              Native<br />Method<br />Interface<br />(JNI)
            </div>
          </AppTooltip>

          {/* Horizontal arrow: JNI ↔ Native Method Library */}
          <DoubleHorizontalArrow width={42} />

          {/* Native Method Library */}
          <AppTooltip content={JVM_TOOLTIPS["Native Method Library"]}>
            <div className="w-[130px] h-[104px] flex items-center justify-center p-2 rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 bg-[#52aa90] dark:bg-[#1d5747] text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm text-center leading-tight shadow-md cursor-default hover:brightness-95 transition-all">
              Native<br />Method<br />Library
            </div>
          </AppTooltip>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. GENERALIZED LAYERS DIAGRAM (Identical Image Style)
   ══════════════════════════════════════════════════════════════ */
function parseLayerLabel(label: string): { title: string; subtitle?: string; chips?: string[] } {
  let title = label;
  let subtitle: string | undefined;
  let chips: string[] | undefined;

  if (label.includes(" — ")) {
    const parts = label.split(" — ");
    title = parts[0].trim();
    subtitle = parts.slice(1).join(" — ").trim();
  } else if (label.includes(" - ")) {
    const parts = label.split(" - ");
    title = parts[0].trim();
    subtitle = parts.slice(1).join(" - ").trim();
  }

  if (subtitle && subtitle.includes(",")) {
    chips = subtitle.split(",").map((s) => s.trim());
    subtitle = undefined;
  } else if (subtitle && subtitle.includes("→")) {
    chips = subtitle.split("→").map((s) => s.trim());
    subtitle = undefined;
  } else if (!subtitle && title.includes("→")) {
    chips = title.split("→").map((s) => s.trim());
    title = "Execution Pipeline";
  }

  return { title, subtitle, chips };
}

function LayersDiagram({ data }: { data: DiagramBox[] }) {
  const renderLayer = (box: DiagramBox, depth: number, index: number): React.ReactNode => {
    const pal = getPalette(box.color, index);
    const { title, subtitle, chips } = parseLayerLabel(box.label);
    const hasChildren = Boolean(box.children && box.children.length > 0);

    // Inner Child Box (e.g. Loading, Linking, Initialization)
    if (!hasChildren) {
      return (
        <div
          key={box.label}
          className="flex-1 min-w-[130px] rounded-lg border-[2px] border-slate-800 dark:border-slate-300 p-2.5 text-center shadow-xs"
          style={{
            backgroundColor: pal.boxLight,
          }}
        >
          <div className="font-bold text-xs md:text-sm text-slate-900 tracking-tight">
            {title}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-800 font-medium mt-1 leading-snug">
              {subtitle}
            </p>
          )}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              {chips.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded border border-slate-800 bg-white text-slate-900 font-mono text-[11px] font-bold shadow-xs"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Outer Container (e.g. Class Loader, Runtime Data Area)
    return (
      <div
        key={box.label}
        className="w-full rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 p-3.5 shadow-md space-y-3"
        style={{
          backgroundColor: pal.containerLight,
        }}
      >
        <div className="text-center font-bold text-sm md:text-base text-slate-900 tracking-tight">
          {title} {subtitle && <span className="font-normal text-xs text-slate-700">({subtitle})</span>}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center items-stretch">
          {box.children!.map((child, cIdx) => renderLayer(child, depth + 1, cIdx))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 p-4 md:p-8 max-w-4xl mx-auto overflow-x-auto">
      <div className="min-w-[500px]">
        {data.map((box, idx) => (
          <React.Fragment key={box.label}>
            {renderLayer(box, 0, idx)}
            {idx < data.length - 1 && (
              <div className="flex justify-center py-1">
                <DoubleVerticalArrow height={36} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. GENERALIZED FLOW DIAGRAM (Pastel Boxes & Solid Arrows)
   ══════════════════════════════════════════════════════════════ */
function FlowDiagram({
  data,
  direction = "horizontal",
}: {
  data: DiagramBox[];
  direction?: "vertical" | "horizontal";
}) {
  const isVert = direction === "vertical";

  return (
    <div className="p-4 md:p-8 overflow-x-auto scrollbar-thin">
      <div
        className={
          isVert
            ? "flex flex-col items-center gap-2 max-w-xl mx-auto min-w-[320px]"
            : "flex flex-row items-center gap-3 min-w-max pb-2"
        }
      >
        {data.map((box, i) => {
          const pal = getPalette(box.color, i);
          const lines = box.label.split("\n");

          return (
            <React.Fragment key={box.label}>
              {/* Process Box (Matching the image style) */}
              <div
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 shadow-sm ${
                  isVert ? "w-full max-w-md" : "min-w-[175px] max-w-[250px]"
                }`}
                style={{
                  backgroundColor: pal.containerLight,
                }}
              >
                <div className="text-center text-xs md:text-sm font-bold text-slate-900 leading-snug space-y-0.5">
                  {lines.map((line, lIdx) => (
                    <div key={lIdx}>{line}</div>
                  ))}
                </div>

                {/* Sub-steps inside (like child boxes in image) */}
                {box.children && box.children.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t-[2px] border-slate-800/30 flex flex-wrap gap-1.5 justify-center">
                    {box.children.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-block text-[11px] font-bold px-2 py-1 rounded-md border-[2px] border-slate-800 bg-white text-slate-900 shadow-xs"
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Connecting Arrow */}
              {i < data.length - 1 && (
                <div className="shrink-0 flex items-center justify-center">
                  {isVert ? (
                    <DoubleVerticalArrow height={32} />
                  ) : (
                    <DoubleHorizontalArrow width={38} />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. GENERALIZED HIERARCHY DIAGRAM (UML / Tree Boxes)
   ══════════════════════════════════════════════════════════════ */
function parseHierarchyLabel(label: string): {
  name: string;
  subtitle?: string;
} {
  let name = label;
  let subtitle: string | undefined;

  if (label.includes(" — ")) {
    const [t, ...rest] = label.split(" — ");
    name = t.trim();
    subtitle = rest.join(" — ").trim();
  } else if (label.includes(" - ")) {
    const [t, ...rest] = label.split(" - ");
    name = t.trim();
    subtitle = rest.join(" - ").trim();
  }

  return { name, subtitle };
}

function HierarchyDiagram({ data }: { data: DiagramBox[] }) {
  const renderNode = (box: DiagramBox, depth: number, index: number): React.ReactNode => {
    const pal = getPalette(box.color, depth + index);
    const { name, subtitle } = parseHierarchyLabel(box.label);
    const hasChildren = Boolean(box.children && box.children.length > 0);

    return (
      <div key={box.label} className="relative flex flex-col items-start min-w-0">
        {/* Node Box */}
        <div
          className="group relative flex flex-col sm:flex-row sm:items-center gap-2 px-3.5 py-2.5 rounded-lg border-[2px] border-slate-800 dark:border-slate-300 shadow-sm"
          style={{
            backgroundColor: pal.boxLight,
          }}
        >
          <span className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
            {name}
          </span>

          {subtitle && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-slate-800 bg-white/80 text-slate-900">
              {subtitle}
            </span>
          )}
        </div>

        {/* Tree Branch Connectors */}
        {hasChildren && (
          <div className="relative ml-4 md:ml-6 pl-5 md:pl-7 border-l-[2.5px] border-slate-800 dark:border-slate-400 mt-2 space-y-3 pt-1">
            {box.children!.map((child, cIdx) => (
              <div key={child.label} className="relative">
                <div className="absolute -left-5 md:-left-7 top-4 w-4 md:w-6 h-[2.5px] bg-slate-800 dark:bg-slate-400" />
                {renderNode(child, depth + 1, cIdx)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 overflow-x-auto">
      <div className="min-w-fit space-y-4">
        {data.map((box, idx) => renderNode(box, 0, idx))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. GENERALIZED TABLE VISUAL (Structured Comparison Cards)
   ══════════════════════════════════════════════════════════════ */
function TableVisualDiagram({ data }: { data: DiagramBox[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-8">
      {data.map((box, idx) => {
        const pal = getPalette(box.color, idx);

        return (
          <div
            key={box.label}
            className="rounded-xl border-[2.5px] border-slate-800 dark:border-slate-300 p-4 flex flex-col justify-between shadow-sm"
            style={{ backgroundColor: pal.containerLight }}
          >
            <div>
              <h4 className="text-sm md:text-base font-bold text-slate-900 mb-3 text-center tracking-tight border-b-[2px] border-slate-800/40 pb-2">
                {box.label}
              </h4>

              {/* Inner Boxes (Same as child cards in image) */}
              {box.children && box.children.length > 0 && (
                <div className="space-y-2">
                  {box.children.map((child, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-2.5 rounded-lg border-[2px] border-slate-800 text-xs md:text-sm font-bold text-slate-900 text-center shadow-xs"
                      style={{ backgroundColor: pal.boxLight }}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. GENERALIZED GRAPH DIAGRAM (Matching Node & Arrow Style)
   ══════════════════════════════════════════════════════════════ */
const SVG_WIDTH = 720;
const SVG_HEIGHT = 440;
const NODE_RADIUS = 24;

function GraphDiagram({ data }: { data: GraphDiagramData }) {
  const { nodes, edges, directed = false, weighted = false, highlightPath = [] } = data;
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const positionedNodes = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const hasCustomCoords = nodes.some((n) => n.x !== undefined && n.y !== undefined);

    if (hasCustomCoords) {
      nodes.forEach((n) => {
        const xPercent = (n.x ?? 50) / 100;
        const yPercent = (n.y ?? 50) / 100;
        map.set(n.id, {
          x: 60 + xPercent * (SVG_WIDTH - 120),
          y: 55 + yPercent * (SVG_HEIGHT - 110),
        });
      });
    } else {
      const count = nodes.length;
      const radius = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.36;
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

  const edgePaths = useMemo(() => {
    return edges
      .map((edge) => {
        const fromPos = positionedNodes.get(edge.from);
        const toPos = positionedNodes.get(edge.to);
        if (!fromPos || !toPos) return null;

        const isInPath = highlightPath.includes(edge.from) && highlightPath.includes(edge.to);
        const pathIndex = highlightPath.indexOf(edge.to);
        const fromIndex = highlightPath.indexOf(edge.from);
        const isForwardPath = pathIndex > -1 && fromIndex > -1 && Math.abs(pathIndex - fromIndex) === 1;

        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        const startX = fromPos.x + Math.cos(angle) * NODE_RADIUS;
        const startY = fromPos.y + Math.sin(angle) * NODE_RADIUS;
        const endX = toPos.x - Math.cos(angle) * (NODE_RADIUS + (directed ? 7 : 0));
        const endY = toPos.y - Math.sin(angle) * (NODE_RADIUS + (directed ? 7 : 0));

        return {
          ...edge,
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          midX: (fromPos.x + toPos.x) / 2,
          midY: (fromPos.y + toPos.y) / 2,
          isHighlighted: isInPath && isForwardPath,
        };
      })
      .filter(Boolean) as (GraphEdge & {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      midX: number;
      midY: number;
      isHighlighted: boolean;
    })[];
  }, [edges, positionedNodes, highlightPath, directed]);

  return (
    <div className="relative w-full p-2 md:p-4">
      {/* Zoom Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white border-[2px] border-slate-800 rounded-lg p-1 shadow-sm">
        <AppTooltip content="Zoom in">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
            className="p-1 rounded text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </AppTooltip>
        <AppTooltip content="Zoom out">
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.75))}
            className="p-1 rounded text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
        </AppTooltip>
        <AppTooltip content="Reset zoom">
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 rounded text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw size={14} />
          </button>
        </AppTooltip>
      </div>

      <div className="relative w-full aspect-[16/10] min-h-[280px] max-h-[520px] overflow-hidden">
        <svg
          className="w-full h-full transition-transform duration-200"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          <defs>
            <marker
              id="img-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1e293b" />
            </marker>

            <marker
              id="img-arrow-highlight"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#16a34a" />
            </marker>
          </defs>

          {/* Edges */}
          {edgePaths.map((edge, i) => {
            const isConnectedToHover =
              hoveredNode === edge.from || hoveredNode === edge.to;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={
                    edge.isHighlighted
                      ? "#16a34a"
                      : isConnectedToHover
                      ? "#ea580c"
                      : "#2d3748"
                  }
                  strokeWidth={edge.isHighlighted || isConnectedToHover ? 4 : 3}
                  markerEnd={
                    directed
                      ? edge.isHighlighted
                        ? "url(#img-arrow-highlight)"
                        : "url(#img-arrow)"
                      : undefined
                  }
                />

                {/* Weight Pill Badge */}
                {weighted && edge.weight !== undefined && (
                  <g>
                    <rect
                      x={edge.midX - 16}
                      y={edge.midY - 11}
                      width={32}
                      height={22}
                      rx={6}
                      fill="#ffffff"
                      stroke="#1e293b"
                      strokeWidth={2}
                    />
                    <text
                      x={edge.midX}
                      y={edge.midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="11"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes (Clean circular nodes with 2.5px dark border) */}
          {nodes.map((node, nIdx) => {
            const pos = positionedNodes.get(node.id);
            if (!pos) return null;
            const pal = getPalette(node.color, nIdx);
            const isInPath = highlightPath.includes(node.id);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? NODE_RADIUS + 3 : NODE_RADIUS}
                  fill={isInPath ? "#52aa90" : pal.boxLight}
                  stroke="#1e293b"
                  strokeWidth={2.5}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {node.label || node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 mt-2 border-t-[2px] border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {directed ? "→ Directed Graph" : "— Undirected Graph"}
          </span>
          {weighted && (
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              • Weighted Edges
            </span>
          )}
          {highlightPath.length > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              Path: {highlightPath.join(" → ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
          <span className="px-2 py-0.5 rounded bg-white border border-slate-800 text-slate-900">
            |V| = {nodes.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-800 text-slate-900">
            |E| = {edges.length}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   7. MASTER DIAGRAM CONTAINER & FRAME
   ══════════════════════════════════════════════════════════════ */
const DIAGRAM_TYPE_CONFIG: Record<
  Diagram["type"],
  { label: string; icon: React.ReactNode }
> = {
  layers: {
    label: "System Architecture",
    icon: <Layers size={15} />,
  },
  hierarchy: {
    label: "Class & Type Hierarchy",
    icon: <GitFork size={15} />,
  },
  flow: {
    label: "Execution Flow & Pipeline",
    icon: <Workflow size={15} />,
  },
  "table-visual": {
    label: "Comparison Matrix",
    icon: <TableProperties size={15} />,
  },
  graph: {
    label: "Network Graph",
    icon: <Network size={15} />,
  },
};

export function DiagramRenderer({ diagram }: { diagram: Diagram }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = DIAGRAM_TYPE_CONFIG[diagram.type] || {
    label: "System Diagram",
    icon: <Sparkles size={15} />,
  };

  // Dedicated check for JVM Architecture
  const isJVMArchitecture =
    diagram.title.toLowerCase().includes("jvm architecture") ||
    (diagram.type === "layers" &&
      Array.isArray(diagram.data) &&
      diagram.data.some(
        (b) =>
          b.label.toLowerCase().includes("class loader") ||
          b.label.toLowerCase().includes("runtime data")
      ));

  return (
    <motion.div
      className={`diag-frame transition-all duration-300 ${
        isExpanded ? "ring-2 ring-primary/40 shadow-2xl" : ""
      }`}
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Technical Header Bar ── */}
      <div className="diag-header-bar">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border-[2px] border-slate-800 bg-white text-slate-900 shadow-xs">
            {typeConfig.icon}
          </div>

          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
            {diagram.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-800 bg-white text-slate-900 shadow-xs">
            {typeConfig.label}
          </span>

          <AppTooltip content={isExpanded ? "Collapse view" : "Expand view"}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-slate-700 hover:text-slate-900 border border-slate-800 bg-white shadow-xs transition-colors"
              aria-label="Toggle diagram size"
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </AppTooltip>
        </div>
      </div>

      {/* ── Diagram Blueprint Canvas (Solid clean canvas) ── */}
      <div className="diag-canvas-bg min-w-0 max-w-full overflow-x-auto">
        {isJVMArchitecture ? (
          <JVMArchitectureBlueprint />
        ) : (
          <>
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
          </>
        )}
      </div>
    </motion.div>
  );
}
