import { useEffect } from "react";
import { Check, CircleDot, CircleDashed, X, ArrowRight, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeStatus, Roadmap, RoadmapNodeData } from "@/types/roadmapGraph";

interface RoadmapDetailPanelProps {
  roadmap: Roadmap;
  node: RoadmapNodeData | null;
  status: NodeStatus;
  onClose: () => void;
  onSelectPrereq: (id: string) => void;
  onSetStatus: (status: NodeStatus) => void;
}

/**
 * Right-side slide-in panel showing the full details of a single roadmap node.
 *
 * - Topic name + category + accent strip
 * - Long description
 * - Prerequisites list (clickable to jump to them)
 * - Recommended order + resource count
 * - Mark as Completed / In progress / Not started
 */
export function RoadmapDetailPanel({
  roadmap,
  node,
  status,
  onClose,
  onSelectPrereq,
  onSetStatus,
}: RoadmapDetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, onClose]);

  if (!node) return null;

  const accent =
    node.accent ??
    roadmap.categories.find((c) => c.label === node.category)?.color ??
    "#A855F7";

  // Title lookup for prereqs
  const titleOf = (id: string) =>
    roadmap.nodes.find((n) => n.id === id)?.data.title ?? id;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="rm-detail-title"
      className={cn(
        "pointer-events-auto absolute right-0 top-0 z-30 h-full w-full max-w-md",
        "border-l border-border bg-card shadow-xl",
        "flex flex-col"
      )}
    >
      <div
        className="h-1 w-full shrink-0"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {node.category}
          </div>
          <h2
            id="rm-detail-title"
            className="text-lg font-bold tracking-tight leading-tight mt-0.5"
          >
            {node.title}
          </h2>
          {node.subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {node.subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            About this topic
          </h3>
          <p className="text-sm leading-6 text-foreground/90">
            {node.description}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <StatTile
            label="Resources"
            value={`${node.resources}`}
            sub={node.resources === 1 ? "problem / item" : "problems / items"}
          />
          <StatTile
            label="Recommended order"
            value={`#${node.recommendedOrder}`}
            sub="in this roadmap"
          />
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <ListChecks size={11} />
            Prerequisites
          </h3>
          {node.prerequisites.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No prerequisites — this is a foundational topic.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {node.prerequisites.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelectPrereq(id)}
                    className="w-full flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="flex-1">{titleOf(id)}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      jump
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Status actions */}
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Update status
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <StatusButton
              active={status === "not-started"}
              onClick={() => onSetStatus("not-started")}
              label="Not started"
              icon={<CircleDashed size={12} />}
              tone="muted"
            />
            <StatusButton
              active={status === "in-progress"}
              onClick={() => onSetStatus("in-progress")}
              label="In progress"
              icon={<CircleDot size={12} />}
              tone="amber"
            />
            <StatusButton
              active={status === "completed"}
              onClick={() => onSetStatus("completed")}
              label="Completed"
              icon={<Check size={12} strokeWidth={3} />}
              tone="emerald"
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/40 bg-muted/20 px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
        <span>
          Click a prerequisite to jump • Press Esc to close
        </span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-bold tracking-tight leading-none mt-1">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  label,
  icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone: "muted" | "amber" | "emerald";
}) {
  const toneCls = {
    muted: "border-border text-muted-foreground hover:bg-muted",
    amber: "border-warning/30 text-warning hover:bg-warning/10",
    emerald: "border-success/30 text-success hover:bg-success/10",
  }[tone];
  const activeCls = {
    muted: "bg-muted text-foreground",
    amber: "bg-warning/15 text-warning ring-1 ring-warning/40",
    emerald: "bg-success/15 text-success ring-1 ring-success/40",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-col items-center justify-center gap-1 rounded-lg border bg-card px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        toneCls,
        active && activeCls
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
