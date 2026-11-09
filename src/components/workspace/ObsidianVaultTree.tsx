import {
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObsidianPaneId } from "./obsidianTypes";

interface ObsidianVaultTreeProps {
  activePane: ObsidianPaneId;
  onSelectPane: (pane: ObsidianPaneId) => void;
  className?: string;
}

const FILES: Array<{
  pane: ObsidianPaneId;
  name: string;
  kind: "java" | "markdown";
}> = [
  { pane: "solution", name: "TwoSum.java", kind: "java" },
  { pane: "problem", name: "ValidParentheses.java", kind: "java" },
  { pane: "tests", name: "rate-limiter.md", kind: "markdown" },
  { pane: "tests", name: "interview-checklist.md", kind: "markdown" },
];

function FileRow({
  pane,
  name,
  kind,
  activePane,
  onSelectPane,
}: (typeof FILES)[number] & {
  activePane: ObsidianPaneId;
  onSelectPane: (pane: ObsidianPaneId) => void;
}) {
  const active = activePane === pane;
  const Icon = kind === "java" ? FileCode2 : FileText;

  return (
    <button
      type="button"
      onClick={() => onSelectPane(pane)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11.5px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "bg-foreground/[0.08] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
      )}
    >
      <Icon size={13} aria-hidden="true" />
      <span className="truncate">{name}</span>
    </button>
  );
}

export function ObsidianVaultTree({
  activePane,
  onSelectPane,
  className,
}: ObsidianVaultTreeProps) {
  return (
    <aside
      aria-label="Vault file tree"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-b border-obsidian-border bg-obsidian-void/55 lg:border-b-0 lg:border-r",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-obsidian-border px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Vault
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-foreground/80">
            algoguru / practice
          </p>
        </div>
        <span className="rounded-md border border-obsidian-border bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          4 files
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <details open className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold text-foreground/85 [&::-webkit-details-marker]:hidden">
            <ChevronRight
              size={12}
              className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            <FolderOpen size={13} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">practice</span>
          </summary>
          <div className="ml-3 border-l border-obsidian-border pl-1.5">
            {FILES.slice(0, 2).map((file) => (
              <FileRow
                key={file.name}
                {...file}
                activePane={activePane}
                onSelectPane={onSelectPane}
              />
            ))}
          </div>
        </details>

        <details open className="group mt-0.5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold text-foreground/85 [&::-webkit-details-marker]:hidden">
            <ChevronRight
              size={12}
              className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            <Folder size={13} className="shrink-0 text-obsidian-success" aria-hidden="true" />
            <span className="truncate">system-design</span>
          </summary>
          <div className="ml-3 border-l border-obsidian-border pl-1.5">
            {FILES.slice(2).map((file) => (
              <FileRow
                key={file.name}
                {...file}
                activePane={activePane}
                onSelectPane={onSelectPane}
              />
            ))}
          </div>
        </details>
      </div>

      <div className="border-t border-obsidian-border px-3 py-2.5">
        <p className="text-[9.5px] leading-4 text-muted-foreground/70">
          Click a file to switch panes. The tree is presentational only.
        </p>
      </div>
    </aside>
  );
}
