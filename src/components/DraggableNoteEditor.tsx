"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
import { X, Minus, Maximize2, Loader2, GripHorizontal, StickyNote } from "lucide-react";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface DraggableNoteEditorProps {
  questionTitle: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const PANEL_W = 480;
const PANEL_H_APPROX = 440;
const SIDE_GUTTER = 16;
const VERTICAL_GUTTER = 24;
const PANEL_MAX_WIDTH = `min(${PANEL_W}px, max(0px, calc(100vw - ${SIDE_GUTTER * 2}px)))`;
const PANEL_MAX_HEIGHT = `min(${PANEL_H_APPROX}px, max(0px, calc(100dvh - ${VERTICAL_GUTTER * 2}px)))`;
const openNoteWindows = new Set<string>();

function getPanelBounds(width: number, height: number) {
  const gutter = Math.min(SIDE_GUTTER, Math.max(0, width) / 2);
  const panelWidth = Math.min(PANEL_W, Math.max(0, width - gutter * 2));
  const maxHeight = Math.max(0, height - VERTICAL_GUTTER * 2);
  const panelHeight = Math.min(PANEL_H_APPROX, maxHeight);

  return {
    gutter,
    panelWidth,
    maxHeight,
    maxX: Math.max(gutter, width - panelWidth - gutter),
    maxY: Math.max(0, height - panelHeight - VERTICAL_GUTTER),
  };
}

function clampPanelPosition(pos: { x: number; y: number }, width: number, height: number) {
  const bounds = getPanelBounds(width, height);
  return {
    x: Math.max(bounds.gutter, Math.min(bounds.maxX, pos.x)),
    y: Math.max(0, Math.min(bounds.maxY, pos.y)),
  };
}

function isConnectedAndVisible(element: HTMLElement) {
  if (
    !element.isConnected ||
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  ) {
    return false;
  }

  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    ) {
      return false;
    }
  }

  return true;
}

export function DraggableNoteEditor({
  questionTitle,
  value,
  onChange,
  onClose,
  onSave,
  isSaving,
}: DraggableNoteEditorProps) {
  // Start at a viewport-safe gutter; center after mount without blocking first paint.
  const [pos, setPos] = useState({ x: SIDE_GUTTER, y: 0 });
  const [viewport, setViewport] = useState({ width: 800, height: 680 });
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [returnFocusTo] = useState<HTMLElement | null>(() =>
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const isTouchDraggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  const onCloseRef = useRef(onClose);
  const windowId = useId();
  posRef.current = pos;
  onCloseRef.current = onClose;

  const { panelWidth } = getPanelBounds(viewport.width, viewport.height);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let initialLayout = true;

    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const bounds = getPanelBounds(width, height);
      setViewport({ width, height });

      if (initialLayout) {
        initialLayout = false;
        setPos({
          x: Math.max(bounds.gutter, Math.min(bounds.maxX, width / 2 - bounds.panelWidth / 2)),
          y: Math.max(0, Math.min(bounds.maxY, height / 2 - Math.min(PANEL_H_APPROX, bounds.maxHeight) / 2)),
        });
      } else {
        setPos((current) => clampPanelPosition(current, width, height));
      }
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    openNoteWindows.add(windowId);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const windows = [...openNoteWindows];
      if (windows[windows.length - 1] !== windowId) return;

      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      openNoteWindows.delete(windowId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [windowId]);

  useEffect(() => {
    const opener = returnFocusTo;
    return () => {
      if (opener && isConnectedAndVisible(opener)) {
        opener.focus();
      }
    };
  }, [returnFocusTo]);

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't start drag if clicking a button inside the title bar
      if ((e.target as HTMLElement).closest("button")) return;
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - posRef.current.x,
        y: e.clientY - posRef.current.y,
      };
      e.preventDefault();
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPos(
        clampPanelPosition(
          {
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
          },
          window.innerWidth,
          window.innerHeight,
        ),
      );
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  // Also handle touch drag
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const touch = e.touches[0];
    if (!touch) return;
    isTouchDraggingRef.current = true;
    dragOffset.current = {
      x: touch.clientX - posRef.current.x,
      y: touch.clientY - posRef.current.y,
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchDraggingRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      setPos(
        clampPanelPosition(
          {
            x: touch.clientX - dragOffset.current.x,
            y: touch.clientY - dragOffset.current.y,
          },
          window.innerWidth,
          window.innerHeight,
        ),
      );
      e.preventDefault();
    };
    const onTouchEnd = () => {
      isTouchDraggingRef.current = false;
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={`Note editor: ${questionTitle}`}
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed z-[300] rounded-2xl overflow-hidden shadow-overlay border border-border/60"
      style={{
        left: pos.x,
        top: pos.y,
        width: panelWidth,
        maxWidth: PANEL_MAX_WIDTH,
        maxHeight: PANEL_MAX_HEIGHT,
        display: "flex",
        flexDirection: "column",
        userSelect: isDragging ? "none" : "auto",
        boxShadow: isDragging
          ? "var(--shadow-overlay), 0 0 0 1px hsl(var(--primary)/0.3)"
          : "var(--shadow-overlay), 0 0 0 1px hsl(var(--border))",
      }}
    >
      {/* ── Title / Drag Bar ─────────────────────────── */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b border-border/30 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ background: "hsl(var(--card))", flexShrink: 0 }}
        onMouseDown={handleTitleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Grip + icon */}
        <GripHorizontal size={15} className="text-muted-foreground/40 shrink-0" />
        <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <StickyNote size={12} className="text-primary" />
        </div>

        {/* Title */}
        <span className="text-[13px] font-semibold text-foreground flex-1 truncate leading-tight">
          {questionTitle}
        </span>

        {/* Window controls */}
        <div className="flex items-center gap-1 ml-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? "Expand" : "Minimize"}
            aria-label={minimized ? "Expand" : "Minimize"}
            className="w-6 h-6 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            {minimized ? <Maximize2 size={11} /> : <Minus size={11} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="w-6 h-6 rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          >
            <X size={11} />
          </Button>
        </div>
      </div>

      {/* ── Body (collapsible) ───────────────────────── */}
      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 auto",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Editor */}
            <div
              className="p-3 pt-2"
              style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}
            >
              <RichTextNoteEditor
                value={value}
                onChange={onChange}
                rows={11}
                autoFocus
                placeholder="Write your notes, key insights, or mnemonics… Supports **bold**, *italic*, `code`"
              />
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-3 border-t border-border/20"
              style={{ background: "hsl(var(--muted)/0.15)", flexShrink: 0 }}
            >
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                Drag title bar to move · Ctrl+B bold · Ctrl+I italic
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-4 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8 px-5 text-[13px] font-semibold shadow-soft"
                >
                  {isSaving && <Loader2 size={13} className="animate-spin" />}
                  Save Note
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
