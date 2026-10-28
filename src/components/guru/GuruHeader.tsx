import { History, Maximize, MessageSquarePlus, Minimize, X } from "lucide-react";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { GuruRunStatus } from "@/lib/guru/types";
import { GuruIconButton, GuruStatusDot } from "./ui";

interface GuruHeaderProps {
  status: GuruRunStatus;
  elapsedMs: number;
  historyOpen: boolean;
  onNewChat: () => void;
  onToggleHistory: () => void;
  onClose: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  title?: string;
  /** Panel is narrow: drop the secondary identity copy to protect the status. */
  compact?: boolean;
  className?: string;
}

function statusLabel(status: GuruRunStatus, elapsedMs: number) {
  const seconds = Math.floor(elapsedMs / 1000);
  const suffix = seconds > 0 ? ` · ${seconds}s` : "";
  switch (status) {
    case "submitting":
    case "thinking":
      return `Thinking${suffix}`;
    case "streaming":
      return `Writing${suffix}`;
    case "error":
      return "Needs attention";
    default:
      return "Ready";
  }
}

export function GuruHeader({
  status,
  elapsedMs,
  historyOpen,
  onNewChat,
  onToggleHistory,
  onClose,
  onToggleFullscreen,
  isFullscreen = false,
  title = "GuruBot",
  compact = false,
  className,
}: GuruHeaderProps) {
  const busy = status === "submitting" || status === "thinking" || status === "streaming";

  return (
    <header
      className={cn(
        "relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-guru-line/70 bg-guru-bg/95 px-3 py-2.5 backdrop-blur",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <GuruAvatar
          size={32}
          ring
          glow={busy}
          mood={busy ? "thinking" : "idle"}
          status={busy ? "busy" : status === "error" ? "error" : "ready"}
          title={null}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-guru-text">
              {title}
            </h2>
            {!compact && (
              <span className="rounded border border-guru-accent/25 bg-guru-accent/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-guru-accent">
                AI
              </span>
            )}
          </div>
          <p className="flex items-center gap-1.5 truncate text-[10.5px] text-guru-muted">
            <GuruStatusDot tone={busy ? "busy" : status === "error" ? "error" : "idle"} />
            <span aria-live="polite">{statusLabel(status, elapsedMs)}</span>
            {!compact && (
              <>
                <span aria-hidden="true" className="text-guru-muted/40">
                  ·
                </span>
                <span className="truncate">AlgoGuru tutor</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <AppTooltip content="New chat" side="bottom">
          <GuruIconButton label="New chat" onClick={onNewChat}>
            <MessageSquarePlus size={15} />
          </GuruIconButton>
        </AppTooltip>
        <AppTooltip content={historyOpen ? "Back to chat" : "Chat history"} side="bottom">
          <GuruIconButton
            label={historyOpen ? "Back to chat" : "Chat history"}
            onClick={onToggleHistory}
            active={historyOpen}
            aria-pressed={historyOpen}
          >
            <History size={15} />
          </GuruIconButton>
        </AppTooltip>
        {onToggleFullscreen && (
          <AppTooltip content={isFullscreen ? "Restore panel" : "Expand panel"} side="bottom">
            <GuruIconButton
              label={isFullscreen ? "Restore panel" : "Expand panel"}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </GuruIconButton>
          </AppTooltip>
        )}
        <AppTooltip content="Close Guru" side="bottom">
          <GuruIconButton label="Close Guru" onClick={onClose}>
            <X size={16} />
          </GuruIconButton>
        </AppTooltip>
      </div>
    </header>
  );
}
