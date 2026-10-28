import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUp, Code2, Command, CornerDownLeft, Send, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchCommands, GURU_COMMANDS } from "@/lib/guru/commands";
import { estimateTokens } from "@/lib/guru/sessions";
import { GuruKbd } from "./ui";

interface GuruComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  attachCode: boolean;
  onToggleAttachCode: () => void;
  contextTokens: number;
  contextLabel: string;
  queuedPrompt?: string | null;
  onCancelQueued?: () => void;
  placeholder?: string;
  isMobile?: boolean;
  /** Panel is narrow: drop the keyboard legend so the footer stays one line. */
  compact?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  /** ArrowUp on an empty composer recalls the last question for editing. */
  onRecallLast?: () => void;
}

export function GuruComposer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  attachCode,
  onToggleAttachCode,
  contextTokens,
  contextLabel,
  queuedPrompt,
  onCancelQueued,
  placeholder = "Ask Guru anything…",
  isMobile = false,
  compact = false,
  inputRef,
  onRecallLast,
}: GuruComposerProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? localRef;
  const [commandIndex, setCommandIndex] = useState(0);
  // Two Guru panels can be mounted at once (app panel + Playground), so the
  // input's label target must be unique.
  const uid = useId();
  const inputId = `${uid}-guru-composer`;
  const hintId = `${uid}-guru-composer-hint`;

  const commands = useMemo(() => matchCommands(value), [value]);
  const showCommands = commands.length > 0;

  useEffect(() => {
    setCommandIndex(0);
  }, [value]);

  // Keep the textarea exactly as tall as its content, within a limit.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    const max = isMobile ? 132 : 184;
    node.style.height = `${Math.min(node.scrollHeight, max)}px`;
  }, [value, isMobile, ref]);

  const applyCommand = (index: number) => {
    const command = commands[index] ?? GURU_COMMANDS[0];
    onChange(`/${command.name} `);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const composing = event.nativeEvent.isComposing;

    if (showCommands && !composing) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandIndex((index) => (index + 1) % commands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandIndex((index) => (index - 1 + commands.length) % commands.length);
        return;
      }
      if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
        event.preventDefault();
        applyCommand(commandIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onChange("");
        return;
      }
    }

    if (event.key === "Escape") {
      if (busy) {
        event.preventDefault();
        onStop();
      }
      return;
    }

    if (event.key === "ArrowUp" && !value && !busy && onRecallLast) {
      event.preventDefault();
      onRecallLast();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !composing) {
      event.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="border-t border-guru-line/70 bg-guru-bg/95 px-3 pb-2.5 pt-2.5">
      {queuedPrompt && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-guru-accent/25 bg-guru-accent/[0.08] px-2.5 py-1.5">
          <ArrowUp size={12} className="shrink-0 text-guru-accent" />
          <p className="min-w-0 flex-1 truncate text-[11.5px] text-guru-muted">
            Queued: <span className="text-guru-text/90">{queuedPrompt}</span>
          </p>
          {onCancelQueued && (
            <button
              type="button"
              onClick={onCancelQueued}
              aria-label="Cancel queued message"
              className="rounded p-0.5 text-guru-muted transition-colors hover:text-guru-text"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {showCommands && (
        <div
          role="listbox"
          aria-label="Slash commands"
          className="mb-2 overflow-hidden rounded-xl border border-guru-line bg-guru-surface shadow-lg shadow-black/10 dark:shadow-black/40"
        >
          {commands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === commandIndex}
              onMouseEnter={() => setCommandIndex(index)}
              onClick={() => applyCommand(index)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                index === commandIndex ? "bg-guru-accent/10" : "hover:bg-guru-text/[0.04]",
              )}
            >
              <span className="w-20 shrink-0 font-mono text-[11.5px] text-guru-accent">
                /{command.name}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-guru-text">
                  {command.label}
                </span>
                <span className="block truncate text-[11px] text-guru-muted">
                  {command.hint}
                </span>
              </span>
            </button>
          ))}
          <div className="flex items-center gap-2 border-t border-guru-line/60 px-3 py-1.5 text-[10.5px] text-guru-muted">
            <GuruKbd>↑</GuruKbd>
            <GuruKbd>↓</GuruKbd>
            <span>to navigate</span>
            <GuruKbd>↵</GuruKbd>
            <span>to insert</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative rounded-2xl border bg-guru-surface/70 transition-colors duration-200",
          "border-guru-line focus-within:border-guru-accent/55 focus-within:bg-guru-surface",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Message Guru
        </label>
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-describedby={hintId}
          className={cn(
            "w-full resize-none bg-transparent px-3.5 pb-2 pt-3 pr-14 text-[13.5px] leading-relaxed text-guru-text",
            "outline-none placeholder:text-guru-muted/80",
            "min-h-[48px] max-h-[184px]",
          )}
        />

        <button
          type="button"
          onClick={() => (busy ? onStop() : onSend())}
          disabled={!busy && !canSend}
          aria-label={busy ? "Stop generating" : "Send message"}
          className={cn(
            "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guru-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-guru-bg",
            busy
              ? "bg-guru-danger/15 text-guru-danger hover:bg-guru-danger/25"
              : "bg-gradient-to-br from-guru-accent to-guru-accent-2 text-guru-on-accent shadow-[0_6px_18px_-8px_hsl(var(--guru-accent)/0.9)] hover:brightness-110",
            !busy && !canSend && "opacity-40",
          )}
        >
          {busy ? <Square size={11} fill="currentColor" /> : <Send size={14} />}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <button
          type="button"
          onClick={onToggleAttachCode}
          aria-pressed={attachCode}
          title={
            attachCode
              ? "Editor context is attached to every message — click to detach"
              : "Attach your editor code and last run to the conversation"
          }
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            attachCode
              ? "border-guru-accent/35 bg-guru-accent/10 text-guru-accent"
              : "border-guru-line bg-guru-text/[0.025] text-guru-muted hover:border-guru-line/80 hover:text-guru-text",
          )}
        >
          <Code2 size={11} className="shrink-0" />
          <span className="truncate">
            {attachCode ? contextLabel : "Attach editor context"}
          </span>
          {attachCode && contextTokens > 0 && (
            <span className="shrink-0 rounded bg-guru-accent/15 px-1 text-[10px] tabular-nums">
              ~{contextTokens >= 1000 ? `${(contextTokens / 1000).toFixed(1)}k` : contextTokens}
            </span>
          )}
        </button>

        <div
          id={hintId}
          className="ml-auto flex items-center gap-1.5 text-[10.5px] text-guru-muted/80"
        >
          {value.trim() ? (
            <span className="tabular-nums">~{estimateTokens(value)} tokens</span>
          ) : compact ? (
            <span>/ commands</span>
          ) : (
            <>
              <Command size={10} className="hidden sm:block" />
              <span className="hidden sm:inline">/ for commands</span>
              <span className="sm:hidden">/ commands</span>
            </>
          )}
          {!compact && (
            <span className="hidden items-center gap-1 sm:flex">
              <GuruKbd>
                <CornerDownLeft size={9} className="inline" />
              </GuruKbd>
              send
              <GuruKbd>⇧↵</GuruKbd>
              newline
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
