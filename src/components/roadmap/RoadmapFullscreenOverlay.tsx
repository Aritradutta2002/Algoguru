import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoadmapEngine } from "./RoadmapEngine";
import { ROADMAP_DATA } from "@/data/roadmapDataIndex";
import { roadmapList, type RoadmapId } from "@/data/roadmaps";

const TAB_ORDER: RoadmapId[] = ["dsa", "java", "system-design"];

const TAB_LABEL: Record<RoadmapId, string> = {
  dsa: "DSA",
  java: "Java",
  "system-design": "System Design",
};

interface RoadmapFullscreenOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Optional starting tab (used by deep links like /roadmap/java). */
  initialRoadmapId?: RoadmapId;
}

export function RoadmapFullscreenOverlay({
  open,
  onClose,
  initialRoadmapId,
}: RoadmapFullscreenOverlayProps) {
  const [activeId, setActiveId] = useState<RoadmapId>(
    initialRoadmapId && TAB_ORDER.includes(initialRoadmapId) ? initialRoadmapId : "dsa",
  );

  // Bumped to ask the engine to reset progress + positions back to the original stage.
  const [resetSignal, setResetSignal] = useState(0);

  // Keep the active tab in sync when the deep-link param changes (e.g. user
  // navigates from /roadmap/dsa to /roadmap/java while the overlay is open).
  useEffect(() => {
    if (initialRoadmapId && TAB_ORDER.includes(initialRoadmapId)) {
      setActiveId(initialRoadmapId);
    }
  }, [initialRoadmapId]);

  // ESC closes the overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const activeMeta = roadmapList.find((r) => r.id === activeId);
  const activeRoadmap = ROADMAP_DATA[activeId];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="roadmap-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col bg-background text-foreground"
          role="dialog"
          aria-modal="true"
          aria-label="Roadmaps"
        >
          {/* Minimal top bar: back button + tab switcher (centered) + close */}
          <div
            className={cn(
              "flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 flex-shrink-0",
              "border-b border-border/40 bg-background/95 backdrop-blur-xl"
            )}
          >
            <div className="basis-2/5 flex justify-start">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 px-3 py-1.5",
                  "text-[11px] font-bold uppercase tracking-widest text-muted-foreground",
                  "hover:text-foreground hover:bg-muted transition-all active:scale-95"
                )}
                aria-label="Back to home"
              >
                <ArrowLeft size={12} />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Roadmap"
              className="inline-flex items-center gap-1 rounded-xl border border-border/40 bg-muted/40 p-1"
            >
              {TAB_ORDER.map((id) => {
                const active = id === activeId;
                const meta = roadmapList.find((r) => r.id === id);
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveId(id)}
                    className={cn(
                      "rounded-lg px-4 sm:px-6 py-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-widest transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40",
                      active
                        ? "text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                    style={active ? { background: meta?.accent } : undefined}
                  >
                    {TAB_LABEL[id]}
                  </button>
                );
              })}
            </div>

            <div className="basis-3/5 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setResetSignal((n) => n + 1)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 px-3 py-1.5",
                  "text-[11px] font-bold uppercase tracking-widest text-muted-foreground",
                  "hover:text-foreground hover:bg-muted transition-all active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40"
                )}
                aria-label="Reset roadmap to original stage"
                title="Reset progress and node positions to the original stage"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card/60",
                  "text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
                )}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Canvas — only the active roadmap is mounted so dagre + fitView
              re-run cleanly on every tab switch. */}
          <div className="flex-1 min-h-0 relative">
            {activeMeta && (
              <RoadmapEngine
                key={activeId}
                roadmap={activeRoadmap}
                compact
                resetSignal={resetSignal}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
