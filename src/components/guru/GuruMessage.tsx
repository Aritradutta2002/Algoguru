import { memo, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Pencil,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { GuruAvatar } from "@/components/brand/GuruMark";
import { cn } from "@/lib/utils";
import type { GuruChatMessage } from "@/lib/guru/types";
import { GuruMarkdown } from "./GuruMarkdown";
import { formatClock, GuruIconButton } from "./ui";

interface GuruMessageProps {
  message: GuruChatMessage;
  isStreaming?: boolean;
  rating?: 1 | -1;
  onCopy: (content: string, messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
  onEditAndResend: (messageId: string, content: string) => void;
  onInsertCode?: (code: string) => void;
}

function ReasoningDisclosure({ reasoning }: { reasoning: string }) {
  return (
    <details className="group/reasoning mb-1.5 rounded-lg border border-guru-line/50 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium text-guru-muted transition-colors hover:text-guru-text [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={12}
          className="transition-transform duration-200 group-open/reasoning:rotate-180"
        />
        Thought process
      </summary>
      <div className="max-h-56 overflow-y-auto border-t border-guru-line/40 px-2.5 py-2 text-[12px] leading-relaxed whitespace-pre-wrap text-guru-muted/90">
        {reasoning}
      </div>
    </details>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: GuruChatMessage;
  onRetry: (id: string) => void;
}) {
  const info = message.error;
  if (!info) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-3"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] leading-relaxed text-guru-text/90">{info.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {info.retryable && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-semibold text-guru-text transition-colors hover:bg-white/[0.12]"
              >
                <RotateCcw size={12} />
                Try again
              </button>
            )}
            <span className="text-[11px] text-guru-muted">
              Nothing was saved to your history.
            </span>
          </div>
          {info.detail && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-guru-muted/80 hover:text-guru-muted">
                Technical details
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 font-mono text-[10.5px] leading-relaxed text-guru-muted">
                {info.detail}
                {info.requestId ? `\nrequest: ${info.requestId}` : ""}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export const GuruMessage = memo(function GuruMessage({
  message,
  isStreaming = false,
  rating,
  onCopy,
  onRegenerate,
  onRetry,
  onRate,
  onEditAndResend,
  onInsertCode,
}: GuruMessageProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const timer = useRef<number | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!editing) return;
    const node = editRef.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(node.value.length, node.value.length);
  }, [editing]);

  const handleCopy = async () => {
    onCopy(message.content, message.id);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  if (message.role === "user") {
    const submitEdit = () => {
      const next = draft.trim();
      if (!next || next === message.content) {
        setEditing(false);
        return;
      }
      setEditing(false);
      onEditAndResend(message.id, next);
    };

    return (
      <article className="group flex flex-col items-end" data-message-id={message.id}>
        {editing ? (
          <div className="w-full max-w-[92%] rounded-xl border border-guru-accent/40 bg-guru-raised/80 p-2">
            <textarea
              ref={editRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submitEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDraft(message.content);
                  setEditing(false);
                }
              }}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className="w-full resize-none rounded-lg bg-transparent px-2 py-1.5 text-[13.5px] leading-relaxed text-guru-text outline-none placeholder:text-guru-muted"
              aria-label="Edit your message"
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(false);
                }}
                className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-guru-muted transition-colors hover:bg-white/[0.06] hover:text-guru-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={!draft.trim()}
                className="rounded-md bg-guru-accent px-2.5 py-1 text-[11.5px] font-semibold text-white transition-colors hover:bg-guru-accent/90 disabled:opacity-40"
              >
                Save &amp; send
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[92%] rounded-2xl rounded-br-md border border-white/[0.06] bg-guru-raised px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-guru-text">
            {message.content}
          </div>
        )}

        <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
          <GuruIconButton
            label={copied ? "Copied" : "Copy message"}
            onClick={handleCopy}
            className="h-7 w-7"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </GuruIconButton>
          <GuruIconButton
            label="Edit and resend"
            onClick={() => {
              setDraft(message.content);
              setEditing(true);
            }}
            className="h-7 w-7"
          >
            <Pencil size={12} />
          </GuruIconButton>
          <span className="ml-1 text-[10.5px] text-guru-muted/70">
            {formatClock(message.createdAt)}
          </span>
        </div>
      </article>
    );
  }

  const isError = message.status === "error";
  const showBubble = Boolean(message.content.trim()) || isStreaming;

  return (
    <article className="group flex items-start gap-2.5" data-message-id={message.id}>
      <GuruAvatar
        size={26}
        mood={isStreaming ? "thinking" : "idle"}
        ring
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-guru-text">GuruBot</span>
          <span className="text-[10.5px] text-guru-muted/70">
            {formatClock(message.createdAt)}
          </span>
          {message.status === "aborted" && (
            <span className="rounded bg-white/[0.06] px-1.5 py-px text-[10px] font-medium text-guru-muted">
              Stopped
            </span>
          )}
        </div>

        {message.reasoning && !isError && (
          <ReasoningDisclosure reasoning={message.reasoning} />
        )}

        {showBubble && (
          <div
            className={cn(
              "rounded-xl rounded-tl-sm border border-guru-line/70 bg-guru-surface/60 px-3.5 py-2.5",
              isStreaming && "border-guru-accent/25",
            )}
          >
            <GuruMarkdown
              content={message.content}
              onInsertCode={onInsertCode}
              fallback={
                isStreaming ? (
                  <p className="text-[13px] text-guru-muted">…</p>
                ) : null
              }
            />
            {isStreaming && (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 rounded-full bg-guru-accent animate-guru-caret"
              />
            )}
          </div>
        )}

        {isError && (
          <div className="mt-1.5">
            <ErrorCard message={message} onRetry={onRetry} />
          </div>
        )}

        {!isStreaming && (
          <div
            className={cn(
              "mt-1 flex items-center gap-0.5 transition-opacity duration-150",
              "opacity-0 focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100",
            )}
          >
            <GuruIconButton
              label={copied ? "Copied" : "Copy reply"}
              onClick={handleCopy}
              className="h-7 w-7"
              disabled={!message.content.trim()}
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </GuruIconButton>
            {!isError && (
              <GuruIconButton
                label="Regenerate reply"
                onClick={() => onRegenerate(message.id)}
                className="h-7 w-7"
              >
                <RotateCcw size={12} />
              </GuruIconButton>
            )}
            <GuruIconButton
              label="Good answer"
              onClick={() => onRate(message.id, 1)}
              active={rating === 1}
              className="h-7 w-7"
            >
              <ThumbsUp size={12} className={rating === 1 ? "fill-current" : undefined} />
            </GuruIconButton>
            <GuruIconButton
              label="Needs improvement"
              onClick={() => onRate(message.id, -1)}
              active={rating === -1}
              className="h-7 w-7"
            >
              <ThumbsDown size={12} className={rating === -1 ? "fill-current" : undefined} />
            </GuruIconButton>
          </div>
        )}
      </div>
    </article>
  );
});
