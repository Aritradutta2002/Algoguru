import { useCallback } from "react";
import { useReactFlow, Panel } from "@xyflow/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Crosshair,
  ChevronsDownUp,
  ChevronsUpDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";

interface RoadmapControlsProps {
  onCenterRoot?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export function RoadmapControls({
  onCenterRoot,
  onExpandAll,
  onCollapseAll,
}: RoadmapControlsProps) {
  const { zoomIn, zoomOut, fitView, setViewport, getZoom } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 250 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 250 });
  }, [zoomOut]);

  const handleFit = useCallback(() => {
    fitView({ padding: 0.18, duration: 400 });
  }, [fitView]);

  const handleResetZoom = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 350 });
  }, [setViewport]);

  return (
    <Panel position="bottom-left" className="!m-4 !mb-6 flex flex-col gap-2 z-20">
      <div
        className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-xl backdrop-blur-xl"
        role="toolbar"
        aria-label="Mind-map viewport controls"
      >
        <AppTooltip content="Zoom in (+)">
          <CtrlButton onClick={handleZoomIn} label="Zoom in" icon={<ZoomIn size={15} />} />
        </AppTooltip>

        <AppTooltip content="Zoom out (-)">
          <CtrlButton onClick={handleZoomOut} label="Zoom out" icon={<ZoomOut size={15} />} />
        </AppTooltip>

        <AppTooltip content="Fit entire mind-map into view (F)">
          <CtrlButton onClick={handleFit} label="Fit view" icon={<Maximize size={14} />} />
        </AppTooltip>

        {onCenterRoot && (
          <AppTooltip content="Center on root topic (0)">
            <CtrlButton
              onClick={onCenterRoot}
              label="Center root"
              icon={<Crosshair size={15} />}
            />
          </AppTooltip>
        )}

        <div className="h-px w-full bg-border/60" />

        {onExpandAll && (
          <AppTooltip content="Expand all branches">
            <CtrlButton
              onClick={onExpandAll}
              label="Expand all"
              icon={<ChevronsUpDown size={15} />}
            />
          </AppTooltip>
        )}

        {onCollapseAll && (
          <AppTooltip content="Collapse all branches">
            <CtrlButton
              onClick={onCollapseAll}
              label="Collapse all"
              icon={<ChevronsDownUp size={15} />}
            />
          </AppTooltip>
        )}
      </div>

      {/* Floating ergonomic navigation hint */}
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-card/75 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground/80 shadow-md backdrop-blur-md">
        <span>Space: Pan</span>
        <span className="opacity-40">•</span>
        <span>Scroll: Zoom</span>
        <span className="opacity-40">•</span>
        <span>Click +/-: Fold</span>
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
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center transition-all border-b border-border/40 last:border-b-0 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active && "bg-primary/15 text-primary"
      )}
    >
      {icon}
    </button>
  );
}
