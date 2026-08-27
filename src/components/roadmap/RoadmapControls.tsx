import { useCallback } from "react";
import { useReactFlow, Panel } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom-left floating controls: zoom in / zoom out / fit view.
 * Pure Tailwind + lucide icons — no extra deps — and matches the rest of
 * the app's card aesthetic.
 */
export function RoadmapControls() {
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

  return (
    <Panel position="bottom-left" className="!m-4">
      <div
        className="flex flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#1d1d20]/95 p-0 shadow-2xl backdrop-blur-xl"
        role="toolbar"
        aria-label="Roadmap viewport controls"
      >
        <CtrlButton onClick={handleZoomIn} label="Zoom in" icon={<ZoomIn size={18} />} />
        <CtrlButton onClick={handleZoomOut} label="Zoom out" icon={<ZoomOut size={18} />} />
        <CtrlButton
          onClick={handleFit}
          label="Fit view"
          icon={<Maximize size={17} />}
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
        "touch-manipulation flex h-11 w-11 items-center justify-center transition-all duration-150",
        "border-b border-white/8 last:border-b-0 text-slate-200 hover:bg-white/5 hover:text-white active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        active && "bg-primary/15 text-primary"
      )}
    >
      {icon}
    </button>
  );
}
