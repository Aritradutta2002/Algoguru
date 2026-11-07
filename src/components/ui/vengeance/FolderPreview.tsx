import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Folder, FileCode, CheckCircle, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderItem {
  id: string;
  name: string;
  count: string;
  tag: string;
  accent?: string;
  files: {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    pattern: string;
  }[];
}

export interface FolderPreviewProps {
  folders?: FolderItem[];
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onFileSelect?: (folderId: string, fileName: string) => void;
}

const DEFAULT_FOLDERS: FolderItem[] = [
  {
    id: "dsa-patterns",
    name: "DSA Core Patterns",
    count: "14 Patterns",
    tag: "High Frequency",
    accent: "#38bdf8",
    files: [
      { title: "Sliding Window & Substring Invariants", difficulty: "Medium", pattern: "Two Pointers" },
      { title: "Binary Search On Answer Range", difficulty: "Hard", pattern: "Monotonic Space" },
      { title: "Cycle Detection with Floyd's Tortoise", difficulty: "Medium", pattern: "Fast & Slow" },
    ],
  },
  {
    id: "java-internals",
    name: "JVM & Concurrency",
    count: "9 Deep Topics",
    tag: "Staff Eng",
    accent: "#a855f7",
    files: [
      { title: "G1 GC Region Compaction & Young Gen", difficulty: "Hard", pattern: "Memory Model" },
      { title: "AQS & Lock-Free CAS State Machines", difficulty: "Hard", pattern: "Concurrency" },
      { title: "Virtual Threads & Carrier Thread Pinning", difficulty: "Medium", pattern: "Project Loom" },
    ],
  },
  {
    id: "system-design",
    name: "System Design Blueprints",
    count: "6 Frameworks",
    tag: "Scalability",
    accent: "#34d399",
    files: [
      { title: "Distributed Rate Limiter (Token Bucket)", difficulty: "Medium", pattern: "Redis Lua" },
      { title: "Idempotent Payment Webhook Queue", difficulty: "Hard", pattern: "Transactional Outbox" },
      { title: "Geo-Distributed Sharded Leaderboard", difficulty: "Hard", pattern: "Sorted Sets" },
    ],
  },
];

export function FolderPreview({
  folders = DEFAULT_FOLDERS,
  label = "Curriculum Vault",
  className,
  onFileSelect,
}: FolderPreviewProps) {
  const [activeFolderIndex, setActiveFolderIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeFolder = folders[activeFolderIndex] ?? folders[0];

  return (
    <div className={cn("relative flex flex-col rounded-3xl border border-border/80 bg-card/80 p-6 backdrop-blur-xl shadow-soft", className)}>
      {/* Top Folder Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Folder size={18} />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-foreground">{label}</h4>
            <p className="text-[11.5px] text-muted-foreground">Pattern-based learning vault</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
          <Sparkles size={11} className="text-primary" />
          {folders.length} Tracks
        </span>
      </div>

      {/* Stacked Folder Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-3">
        {folders.map((folder, idx) => {
          const isActive = idx === activeFolderIndex;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setActiveFolderIndex(idx)}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{folder.name}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 font-mono text-[9.5px]",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-card text-muted-foreground"
                )}
              >
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Folder Content Preview */}
      <div className="mt-4 flex flex-col gap-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFolder.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? false : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-2"
          >
            {activeFolder.files.map((file, fIdx) => (
              <div
                key={file.title}
                role="button"
                tabIndex={0}
                onClick={() => onFileSelect?.(activeFolder.id, file.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onFileSelect?.(activeFolder.id, file.title);
                  }
                }}
                className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-background hover:shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                    <FileCode size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {file.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                      {file.pattern}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase",
                      file.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : file.difficulty === "Medium"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    )}
                  >
                    {file.difficulty}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FolderPreview;
