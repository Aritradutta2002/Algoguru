import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minus, Maximize2, Loader2, GripHorizontal, StickyNote } from "lucide-react";
import RichTextNoteEditor from "@/components/RichTextNoteEditor";
import { motion, AnimatePresence } from "framer-motion";

interface DraggableNoteEditorProps {
  questionTitle: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function DraggableNoteEditor({
  questionTitle,
  value,
  onChange,
  onClose,
  onSave,
  isSaving,
}: DraggableNoteEditorProps) {
  const PANEL_W = 480;
  const PANEL_H_APPROX = 440;

  const getInitialPos = () => ({
    x: Math.max(0, Math.min(window.innerWidth - PANEL_W - 24, window.innerWidth / 2 - PANEL_W / 2)),
    y: Math.max(0, Math.min(window.innerHeight - PANEL_H_APPROX - 24, window.innerHeight / 2 - PANEL_H_APPROX / 2)),
  });

  const [pos, setPos] = useState(getInitialPos);
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

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
      const x = Math.max(0, Math.min(window.innerWidth - PANEL_W, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
      setPos({ x, y });
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
    dragOffset.current = {
      x: touch.clientX - posRef.current.x,
      y: touch.clientY - posRef.current.y,
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(window.innerWidth - PANEL_W, touch.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 48, touch.clientY - dragOffset.current.y));
      setPos({ x, y });
      e.preventDefault();
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => window.removeEventListener("touchmove", onTouchMove);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed z-[300] rounded-2xl overflow-hidden shadow-2xl border border-border/60"
      style={{
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        userSelect: isDragging ? "none" : "auto",
        boxShadow: isDragging
          ? "0 32px 64px -12px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--primary)/0.3)"
          : "0 20px 48px -12px rgba(0,0,0,0.45), 0 0 0 1px hsl(var(--border)/0.6)",
      }}
    >
      {/* ── Title / Drag Bar ─────────────────────────── */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b border-border/30 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ background: "hsl(var(--card))" }}
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
          <button
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? "Expand" : "Minimize"}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
          >
            {minimized ? <Maximize2 size={11} /> : <Minus size={11} />}
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
          >
            <X size={11} />
          </button>
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
            style={{ background: "hsl(var(--card))" }}
          >
            {/* Editor */}
            <div className="p-3 pt-2">
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
              style={{ background: "hsl(var(--muted)/0.15)" }}
            >
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                Drag title bar to move · Ctrl+B bold · Ctrl+I italic
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-5 py-1.5 rounded-full text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {isSaving && <Loader2 size={13} className="animate-spin" />}
                  Save Note
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
