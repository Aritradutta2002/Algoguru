import { useCallback } from "react";
import { useReactFlow, Panel } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapControlsProps {
  /** Whether the user can drag the canvas (pan). Toggleable. */
  panOnDrag: boolean;
  onTogglePan: () => void;
  /** When true, hides the buttons and just renders nothing (used in tests). */
  hidden?: boolean;
}

/**
 * Bottom-left floating controls: zoom in / zoom out / fit view / pan-lock.
 * Pure Tailwind + lucide icons — no extra deps — and matches the rest of
 * the app's card aesthetic.
 */
export function RoadmapControls({
  panOnDrag,
  onTogglePan,
  hidden = false,
}: RoadmapControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 250 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 250 });
  }, [zoomOut]);

  const handleFit = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  if (hidden) return null;

  return (
    <Panel position="bottom-left" className="!m-4">
      <div
        className={cn(
          "flex flex-col gap-1 rounded-xl border border-border/60 bg-card/85 backdrop-blur-xl p-1 shadow-2xl"
        )}
        role="toolbar"
        aria-label="Roadmap viewport controls"
      >
        <CtrlButton onClick={handleZoomIn} label="Zoom in" icon={<ZoomIn size={14} />} />
        <CtrlButton onClick={handleZoomOut} label="Zoom out" icon={<ZoomOut size={14} />} />
        <CtrlButton
          onClick={handleFit}
          label="Fit view"
          icon={<Maximize size={14} />}
        />
        <div className="my-0.5 h-px bg-border/40" />
        <CtrlButton
          onClick={onTogglePan}
          label={panOnDrag ? "Lock canvas panning" : "Unlock canvas panning"}
          icon={panOnDrag ? <Unlock size={14} /> : <Lock size={14} />}
          active={!panOnDrag}
        />
      </div>
    </Panel>
  );
}

interface CtrlButtonProps {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

function CtrlButton({ onClick, label, icon, active = false }: CtrlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "touch-manipulation flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150",
        "text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        active && "bg-primary/15 text-primary"
      )}
    >
      {icon}
    </button>
  );
}
