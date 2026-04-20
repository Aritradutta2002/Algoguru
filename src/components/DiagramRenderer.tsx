import { Diagram, DiagramBox } from "@/data/recursionContent";
import { motion } from "framer-motion";

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
        {diagram.type === "layers" && <LayersDiagram data={diagram.data} title={diagram.title} />}
        {diagram.type === "hierarchy" && <HierarchyDiagram data={diagram.data} />}
        {diagram.type === "flow" && <FlowDiagram data={diagram.data} direction={diagram.direction} />}
        {diagram.type === "table-visual" && <TableVisualDiagram data={diagram.data} />}
      </div>
    </motion.div>
  );
}
