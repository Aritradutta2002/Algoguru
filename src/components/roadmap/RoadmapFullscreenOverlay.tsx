import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RoadmapEngine } from "./RoadmapEngine";
import { ROADMAP_DATA } from "@/data/roadmapDataIndex";
import { roadmapList, type RoadmapId } from "@/data/roadmaps";

const TAB_ORDER: RoadmapId[] = ["dsa", "java", "system-design"];

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

  const [resetSignal, setResetSignal] = useState(0);

  // Keep the active tab in sync when the deep-link param changes
  useEffect(() => {
    if (initialRoadmapId && TAB_ORDER.includes(initialRoadmapId)) {
      setActiveId(initialRoadmapId);
    }
  }, [initialRoadmapId]);

  // ESC closes the overlay if no input is focused
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the overlay is open
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
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col bg-background text-foreground"
          role="dialog"
          aria-modal="true"
          aria-label="Roadmaps Studio"
        >
          {/* Main Full-Bleed Coggle Canvas Studio */}
          <div className="flex-1 min-h-0 relative">
            {activeMeta && (
              <RoadmapEngine
                key={activeId}
                roadmap={activeRoadmap}
                compact={false}
                resetSignal={resetSignal}
                onBack={onClose}
                onSelectRoadmap={(id) => setActiveId(id)}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
