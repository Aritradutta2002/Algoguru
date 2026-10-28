import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { estimateTokens, exportSessionMarkdown, groupSessions } from "@/lib/guru/sessions";
import type { GuruChatMessage } from "@/lib/guru/types";
import { GuruEmptyState } from "./GuruEmptyState";
import { GuruHeader } from "./GuruHeader";
import { GuruHistoryPanel } from "./GuruHistoryPanel";
import { GuruMessage } from "./GuruMessage";
import { GuruThinking } from "./GuruThinking";
import { GuruComposer } from "./GuruComposer";
import { useGuruChat } from "./useGuruChat";
import "@/styles/guru.css";

export { GURU_PANEL_CONSTANTS } from "@/lib/guruPanel";

export interface GuruBotProps {
  open: boolean;
  onClose: () => void;
  /** Socratic debug coach — hints first, full answer on request. */
  debugMode?: boolean;
  /** Live problem/code/run context injected as system context. */
  initialContext?: string;
  /** Prompt prefilled when opened from a selection or a deep link. */
  initialPrompt?: string;
  /** Render inside a parent drawer instead of a fixed mobile overlay. */
  embedded?: boolean;
  /** Scopes chat history per problem. */
  questionId?: string;
  suggestedPrompts?: string[];
  onInsertCode?: (code: string) => void;
  onAssistantComplete?: (content: string) => void;
  hideHeader?: boolean;
  showGuruTitle?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const SPLIT_HISTORY_MIN_WIDTH = 560;

const DEFAULT_SUGGESTIONS = [
  "Why is my output wrong?",
  "Help me find the bug in this code",
  "Explain the time and space complexity",
  "What edge cases should I test?",
];

const DEBUG_SUGGESTIONS = [
  "Help me find the bug in my code",
  "Why does this fail on the sample test?",
  "What should I check first?",
  "I'm stuck — give me one hint",
];

function buildCoachingContext({
  attachCode,
  initialContext,
  history,
}: {
  attachCode: boolean;
  initialContext: string;
  history: GuruChatMessage[];
}): string {
  const contextSnippet =
    attachCode && initialContext
      ? `\n\nProblem/editor context supplied by the app (may include the problem title, statement, constraints, examples, current code, stdin, test cases, last run output, or a highlighted selection):\n\`\`\`text\n${initialContext.slice(0, 7000)}\n\`\`\``
      : attachCode
        ? `\n\n[The user enabled "attach editor context" but no context was supplied for this turn.]`
        : `\n\n[The user detached editor context — answer without referencing their code; focus on explanation.]`;

  const userTurns = history.filter((message) => message.role === "user").length;
  const allowFull = userTurns >= 2;

  return (
    `You are GuruBot, the AlgoGuru Socratic coach. ` +
    `You have the live problem statement and the user's latest Java 21 code (auto-attached) plus their last test results. ` +
    `Goal: help them discover the solution themselves. ` +
    `Rules: 1) First, always give a SINGLE focused hint or targeted question — reference their code lines/variables and the failing test if any. ` +
    `2) Keep hints concise and actionable; suggest a tiny experiment or edge case to try. ` +
    `3) Do NOT dump the full corrected code on the first 1-2 turns. ` +
    (allowFull
      ? `4) The user has interacted for ${userTurns} turns already. If they now explicitly ask for the full answer ("give code", "show solution", "still stuck", "full answer"), you MAY provide the complete corrected code (Java) and explain the time/time complexity. Otherwise keep hinting. `
      : `4) If the user asks for the full answer now, politely give a stronger hint (not the full code) and explain you can show the full solution if they remain stuck after trying the hint. `) +
    `5) When you do give code, keep it minimal, runnable as Solution.java, and highlight what was fixed vs their version. ` +
    `6) Be encouraging, use simple language, and ask a follow-up check.` +
    contextSnippet
  );
}

export function GuruBot({
  open,
  onClose,
  debugMode = false,
  initialContext = "",
  initialPrompt = "",
  embedded = false,
  questionId,
  suggestedPrompts,
  onInsertCode,
  onAssistantComplete,
  hideHeader = false,
  onToggleFullscreen,
  isFullscreen = false,
}: GuruBotProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const { user, loading: authLoading } = useAuth();

  const chatScope = questionId || "global";
  const [attachCode, setAttachCode] = useState(() => Boolean(questionId));
  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [pinnedToBottom, setPinnedToBottom] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const buildSystemContext = useCallback(
    (history: GuruChatMessage[]) => {
      if (!debugMode) return null;
      return buildCoachingContext({ attachCode, initialContext, history });
    },
    [attachCode, debugMode, initialContext],
  );

  const chat = useGuruChat({
    scope: chatScope,
    initialDraft: open ? initialPrompt : "",
    user,
    authLoading,
    model: "openrouter",
    buildSystemContext,
    onAssistantComplete,
  });

  const {
    messages,
    status,
    busy,
    elapsedMs,
    groupedSessions,
    sessions,
    currentId,
    activeSession,
    feedback,
    draft,
    setDraft,
    queuedPrompt,
    send,
    stop,
    retry,
    regenerate,
    editAndResend,
    newChat,
    selectSession,
    renameSession,
    togglePin,
    deleteSession,
    restoreSession,
    rateMessage,
    cancelQueued,
  } = chat;

  /* ── Overlay behaviour: restore focus, lock the page behind ────── */

  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const node = restoreFocusRef.current;
      if (node && node.isConnected) node.focus({ preventScroll: true });
      restoreFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile || embedded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobile, embedded]);

  /* ── Container width decides whether history splits or overlays ─── */

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const splitHistory = containerWidth >= SPLIT_HISTORY_MIN_WIDTH;
  // The panel can be dragged down to 18% of the viewport. Below ~330px the
  // secondary header/composer copy is what breaks, so drop it first.
  const compactChrome = containerWidth > 0 && containerWidth < 330;

  /* ── Focus (the host prompt is applied by the chat hook) ────────── */

  /* ── Focus ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!open || showHistory) return;
    const timer = window.setTimeout(() => {
      const node = inputRef.current;
      if (!node) return;
      node.focus();
      const end = node.value.length;
      node.setSelectionRange(end, end);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, showHistory, currentId]);

  /* ── Scroll management ──────────────────────────────────────────── */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = scrollRef.current;
    if (!node) return;
    // jsdom (tests) and a few older engines ship no Element.scrollTo.
    if (behavior === "auto" || typeof node.scrollTo !== "function") {
      node.scrollTop = node.scrollHeight;
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setPinnedToBottom(distance < 96);
  }, []);

  useEffect(() => {
    if (!pinnedToBottom) return;
    scrollToBottom(busy ? "auto" : "smooth");
  }, [messages, pinnedToBottom, busy, scrollToBottom]);

  useEffect(() => {
    setPinnedToBottom(true);
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [currentId, showHistory, scrollToBottom]);

  /* ── Composer actions ───────────────────────────────────────────── */

  const handlePick = useCallback(
    (prompt: string) => {
      setDraft(prompt);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [setDraft],
  );

  const recallLastQuestion = useCallback(() => {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return;
    setDraft(lastUser.content);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(lastUser.content.length, lastUser.content.length);
    });
  }, [messages, setDraft]);

  const handleCopy = useCallback((content: string) => {
    void navigator.clipboard.writeText(content).catch(() => undefined);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      const title = sessions.find((session) => session.id === id)?.title ?? "Chat";
      deleteSession(id);
      toast("Chat deleted", {
        description: title,
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => restoreSession(id),
        },
      });
    },
    [deleteSession, restoreSession, sessions],
  );

  const handleExport = useCallback(() => {
    if (!activeSession || activeSession.messages.length === 0) return;
    const markdown = exportSessionMarkdown(activeSession);
    const slug =
      activeSession.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "guru-chat";
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [activeSession]);

  /* ── Keyboard: escape + focus trap on the mobile overlay ───────── */

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        if (busy) {
          stop();
          return;
        }
        if (showHistory) {
          setShowHistory(false);
          return;
        }
        onClose();
        return;
      }

      if (isMobile && !embedded && event.key === "Tab" && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [busy, embedded, isMobile, onClose, showHistory, stop],
  );

  /* ── Derived render data ───────────────────────────────────────── */

  const lastMessage = messages[messages.length - 1];
  const showThinking =
    busy &&
    (!lastMessage ||
      (lastMessage.role === "assistant" &&
        lastMessage.status === "streaming" &&
        !lastMessage.content.trim() &&
        !lastMessage.reasoning));
  const visibleMessages = showThinking ? messages.slice(0, -1) : messages;

  const filteredGroups = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return groupedSessions;
    return groupSessions(
      sessions.filter((session) => session.title.toLowerCase().includes(query)),
    );
  }, [groupedSessions, historyQuery, sessions]);

  const suggestions = useMemo(() => {
    if (suggestedPrompts && suggestedPrompts.length > 0) return suggestedPrompts;
    return debugMode ? DEBUG_SUGGESTIONS : DEFAULT_SUGGESTIONS;
  }, [debugMode, suggestedPrompts]);

  const contextTokens = useMemo(() => estimateTokens(initialContext), [initialContext]);
  const contextLabel = attachCode ? "Editor context attached" : "Attach editor context";

  const userTurns = messages.filter((message) => message.role === "user").length;
  const showEscapeHatch =
    debugMode &&
    !busy &&
    userTurns >= 2 &&
    lastMessage?.role === "assistant" &&
    lastMessage.status === "complete";

  if (!open) return null;

  const useFixedOverlay = isMobile && !embedded;
  const containerClasses = cn(
    "guru-cockpit relative flex h-full flex-col overflow-hidden bg-guru-bg text-guru-text",
    useFixedOverlay &&
      "fixed inset-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200",
  );

  const transcript = (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="guru-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3"
        style={{ overscrollBehavior: "contain" }}
        role="log"
        aria-label="Conversation with Guru"
        aria-live="polite"
        aria-busy={busy}
      >
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
          {messages.length === 0 && !busy && (
            <GuruEmptyState
              debugMode={debugMode}
              suggestions={suggestions}
              onPick={handlePick}
              contextAttached={attachCode && Boolean(initialContext)}
            />
          )}

          {visibleMessages.map((message) => (
            <GuruMessage
              key={message.id}
              message={message}
              isStreaming={busy && message.status === "streaming"}
              rating={feedback[`${currentId}:${message.id}`]}
              onCopy={handleCopy}
              onRegenerate={regenerate}
              onRetry={retry}
              onRate={rateMessage}
              onEditAndResend={editAndResend}
              onInsertCode={onInsertCode}
            />
          ))}

          {showThinking && <GuruThinking elapsedMs={elapsedMs} />}

          {showEscapeHatch && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() =>
                  handlePick("I'm still stuck — give me the full corrected code and explain the fix vs my version.")
                }
                className="rounded-lg border border-guru-line bg-guru-surface/50 px-3 py-1.5 text-[11.5px] font-medium text-guru-muted transition-colors hover:border-guru-accent/35 hover:text-guru-text"
              >
                Still stuck? Ask for the full answer
              </button>
            </div>
          )}

          <div className="h-1" aria-hidden="true" />
        </div>
      </div>

      {!pinnedToBottom && messages.length > 0 && (
        <div className="pointer-events-none relative">
          <button
            type="button"
            onClick={() => {
              setPinnedToBottom(true);
              scrollToBottom("smooth");
            }}
            className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-guru-line bg-guru-surface/95 px-3 py-1.5 text-[11px] font-medium text-guru-text shadow-lg shadow-black/10 backdrop-blur dark:shadow-black/40 transition-colors hover:border-guru-accent/40"
          >
            <ArrowDown size={12} />
            Jump to latest
          </button>
        </div>
      )}

      <GuruComposer
        value={draft}
        onChange={setDraft}
        onSend={() => {
          setPinnedToBottom(true);
          send(draft);
        }}
        onStop={stop}
        busy={busy}
        attachCode={attachCode}
        onToggleAttachCode={() => setAttachCode((value) => !value)}
        contextTokens={contextTokens}
        contextLabel={contextLabel}
        queuedPrompt={queuedPrompt}
        onCancelQueued={cancelQueued}
        onRecallLast={recallLastQuestion}
        placeholder={debugMode ? "Ask about your code, or paste an error…" : "Ask Guru anything…"}
        isMobile={isMobile}
        compact={compactChrome}
        inputRef={inputRef}
      />
    </>
  );

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role={useFixedOverlay ? "dialog" : "region"}
      aria-modal={useFixedOverlay ? true : undefined}
      aria-label="Guru AI"
      onKeyDown={handleKeyDown}
      style={
        useFixedOverlay
          ? {
              // Keep the header clear of the notch and the composer above the
              // iOS home indicator, without a JS viewport listener.
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }
          : undefined
      }
    >
      {!hideHeader && (
        <GuruHeader
          status={status}
          elapsedMs={elapsedMs}
          historyOpen={showHistory}
          onNewChat={() => {
            newChat();
            setShowHistory(false);
          }}
          onToggleHistory={() => setShowHistory((value) => !value)}
          onClose={() => {
            if (showHistory && !splitHistory) {
              setShowHistory(false);
              return;
            }
            onClose();
          }}
          onToggleFullscreen={onToggleFullscreen}
          isFullscreen={isFullscreen}
          compact={compactChrome}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
        {showHistory && splitHistory ? (
          <>
            <GuruHistoryPanel
              split
              groups={filteredGroups}
              totalCount={sessions.length}
              query={historyQuery}
              onQueryChange={setHistoryQuery}
              currentId={currentId}
              onSelect={(id) => {
                selectSession(id);
                setShowHistory(false);
              }}
              onRename={renameSession}
              onTogglePin={togglePin}
              onDelete={handleDelete}
              onClose={() => setShowHistory(false)}
              onExport={handleExport}
              canExport={Boolean(activeSession?.messages.length)}
            />
            <div className="flex min-w-0 flex-1 flex-col">{transcript}</div>
          </>
        ) : showHistory ? (
          <div className="absolute inset-0 z-10 animate-in slide-in-from-left-2 bg-guru-bg duration-200">
            <GuruHistoryPanel
              groups={filteredGroups}
              totalCount={sessions.length}
              query={historyQuery}
              onQueryChange={setHistoryQuery}
              currentId={currentId}
              onSelect={(id) => {
                selectSession(id);
                setShowHistory(false);
              }}
              onRename={renameSession}
              onTogglePin={togglePin}
              onDelete={handleDelete}
              onClose={() => setShowHistory(false)}
              onExport={handleExport}
              canExport={Boolean(activeSession?.messages.length)}
            />
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">{transcript}</div>
        )}
      </div>

    </div>
  );
}
