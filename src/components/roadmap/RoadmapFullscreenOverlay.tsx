"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { hideOthers } from "aria-hidden";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { ROADMAP_DATA } from "@/data/roadmapDataIndex";
import { roadmapList, type RoadmapId } from "@/data/roadmaps";
import { registerEscapeKeyHandler } from "@/lib/escapeKeyStack";

const RoadmapEngine = dynamic(
  () => import("./RoadmapEngine").then((m) => m.RoadmapEngine),
  {
    ssr: false,
    loading: () => <AppLoadingScreen label="Loading roadmap" />,
  },
);

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
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<RoadmapId>(
    initialRoadmapId && TAB_ORDER.includes(initialRoadmapId) ? initialRoadmapId : "dsa",
  );

  const [resetSignal] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the active tab in sync when the deep-link param changes
  useEffect(() => {
    if (initialRoadmapId && TAB_ORDER.includes(initialRoadmapId)) {
      setActiveId(initialRoadmapId);
    }
  }, [initialRoadmapId]);

  // Engine and detail layers get first refusal; inputs keep their own behavior.
  useEffect(() => {
    if (!open) return;
    return registerEscapeKeyHandler((event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return false;
      }
      onClose();
      return true;
    }, 0);
  }, [open, onClose]);

  // Match Radix modal semantics without replacing the specialized studio.
  useEffect(() => {
    if (!open || !mounted) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    return hideOthers(dialog);
  }, [open, mounted]);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  const activeMeta = roadmapList.find((r) => r.id === activeId);
  const activeRoadmap = ROADMAP_DATA[activeId];

  return createPortal(
    <AnimatePresence>
      {open && (
        <FocusScope asChild loop trapped={open}>
          <motion.div
            key="roadmap-overlay"
            ref={dialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="coggle-roadmap-shell fixed inset-0 z-[9999] flex flex-col bg-background text-foreground"
            role="dialog"
            aria-modal="true"
            aria-label="Roadmaps Studio"
          >
            {/* Main Full-Bleed Coggle Canvas Studio */}
            <div className="flex-1 min-h-0 relative">
              {activeMeta && (
                <RoadmapEngine
                  roadmap={activeRoadmap}
                  compact={false}
                  resetSignal={resetSignal}
                  onBack={onClose}
                  onSelectRoadmap={(id) => setActiveId(id)}
                />
              )}
            </div>
          </motion.div>
        </FocusScope>
      )}
    </AnimatePresence>,
    document.body
  );
}
