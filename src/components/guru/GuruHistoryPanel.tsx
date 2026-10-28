import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  MessageSquare,
  Pencil,
  Pin,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuruSession } from "@/lib/guru/types";
import type { SessionGroup } from "@/lib/guru/sessions";
import { formatRelativeTime, GuruIconButton } from "./ui";

interface GuruHistoryPanelProps {
  groups: SessionGroup[];
  totalCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  currentId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onExport?: () => void;
  canExport?: boolean;
  /** Rendered beside the transcript rather than on top of it. */
  split?: boolean;
}

export function GuruHistoryPanel({
  groups,
  totalCount,
  query,
  onQueryChange,
  currentId,
  onSelect,
  onRename,
  onTogglePin,
  onDelete,
  onClose,
  onExport,
  canExport = false,
  split = false,
}: GuruHistoryPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!renamingId) return;
    renameRef.current?.focus();
    renameRef.current?.select();
  }, [renamingId]);

  const startRename = (session: GuruSession) => {
    setRenamingId(session.id);
    setRenameDraft(session.title);
  };

  const commitRename = () => {
    if (renamingId) onRename(renamingId, renameDraft);
    setRenamingId(null);
  };

  const visibleCount = groups.reduce((total, group) => total + group.sessions.length, 0);

  return (
    <aside
      aria-label="Chat history"
      className={cn(
        "flex h-full min-w-0 flex-col bg-guru-bg",
        split ? "w-[210px] shrink-0 border-r border-guru-line/70" : "w-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-guru-line/70 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {!split && (
            <GuruIconButton label="Back to chat" onClick={onClose} className="h-7 w-7">
              <ArrowLeft size={14} />
            </GuruIconButton>
          )}
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-guru-muted">
            History
          </h3>
          <span className="rounded-full bg-guru-text/[0.06] px-1.5 py-px text-[10px] tabular-nums text-guru-muted">
            {totalCount}
          </span>
        </div>
        <GuruIconButton label="Close history" onClick={onClose} className="h-7 w-7">
          <X size={14} />
        </GuruIconButton>
      </div>

      <div className="px-2.5 py-2.5">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-guru-muted/70"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="h-8 w-full rounded-lg border border-guru-line/80 bg-guru-surface/60 pl-8 pr-2.5 text-[12px] text-guru-text outline-none transition-colors placeholder:text-guru-muted/70 focus:border-guru-accent/50"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {visibleCount === 0 ? (
          <div className="mx-1 mt-6 rounded-xl border border-dashed border-guru-line/70 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-guru-text/[0.04] text-guru-accent">
              <MessageSquare size={16} />
            </div>
            <p className="text-[12.5px] font-medium text-guru-text">
              {totalCount === 0 ? "No conversations yet" : "No matching chats"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-guru-muted">
              {totalCount === 0
                ? "Ask Guru something and it will appear here."
                : "Try a different keyword."}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2.5">
              <p className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-guru-muted/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.sessions.map((session) => {
                  const active = session.id === currentId;
                  return (
                    <li key={session.id}>
                      {renamingId === session.id ? (
                        <div className="flex items-center gap-1 rounded-lg border border-guru-accent/40 bg-guru-surface px-1.5 py-1">
                          <input
                            ref={renameRef}
                            value={renameDraft}
                            onChange={(event) => setRenameDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitRename();
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                setRenamingId(null);
                              }
                            }}
                            aria-label="Chat title"
                            className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-[12px] text-guru-text outline-none"
                          />
                          <button
                            type="button"
                            onClick={commitRename}
                            aria-label="Save title"
                            className="rounded p-1 text-guru-success transition-colors hover:bg-guru-text/[0.06]"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "group flex items-start gap-1 rounded-lg border pr-1 transition-colors",
                            active
                              ? "border-guru-accent/30 bg-guru-accent/[0.1]"
                              : "border-transparent hover:bg-guru-text/[0.04]",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(session.id)}
                            aria-current={active ? "true" : undefined}
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent/60"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                                active
                                  ? "bg-guru-accent/20 text-guru-accent"
                                  : "bg-guru-text/[0.04] text-guru-muted",
                              )}
                            >
                              {session.pinned ? <Pin size={10} /> : <MessageSquare size={10} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  "block truncate text-[12px] font-medium",
                                  active ? "text-guru-text" : "text-guru-text/85",
                                )}
                              >
                                {session.title}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-guru-muted/80">
                                <span>{formatRelativeTime(session.date)}</span>
                                <span aria-hidden="true">·</span>
                                <span>{session.messages.length} msgs</span>
                              </span>
                            </span>
                          </button>
                          <span className="flex shrink-0 items-center gap-0.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
                            <button
                              type="button"
                              onClick={() => onTogglePin(session.id)}
                              aria-label={session.pinned ? "Unpin chat" : "Pin chat"}
                              aria-pressed={session.pinned}
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded transition-colors",
                                session.pinned
                                  ? "text-guru-accent"
                                  : "text-guru-muted hover:bg-guru-text/[0.06] hover:text-guru-text",
                              )}
                            >
                              <Pin size={10} className={session.pinned ? "fill-current" : undefined} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startRename(session)}
                              aria-label="Rename chat"
                              className="flex h-6 w-6 items-center justify-center rounded text-guru-muted transition-colors hover:bg-guru-text/[0.06] hover:text-guru-text"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(session.id)}
                              aria-label="Delete chat"
                              className="flex h-6 w-6 items-center justify-center rounded text-guru-muted transition-colors hover:bg-guru-danger/15 hover:text-guru-danger"
                            >
                              <Trash2 size={10} />
                            </button>
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {onExport && (
        <div className="border-t border-guru-line/70 p-2">
          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-guru-muted transition-colors hover:bg-guru-text/[0.05] hover:text-guru-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={12} />
            Export current chat
          </button>
        </div>
      )}
    </aside>
  );
}
