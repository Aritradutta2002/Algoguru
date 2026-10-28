import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createId,
  createSessionTitle,
  groupSessions,
  normalizeSession,
  toPersistedSession,
  readLocalSessions,
  sessionFingerprint,
  toApiMessages,
  writeLocalSessions,
} from "@/lib/guru/sessions";
import { GuruChatError, streamGuruChat } from "@/lib/guru/stream";
import { sanitizeGuruReply } from "@/lib/guru/toolCalls";
import { resolvePrompt } from "@/lib/guru/commands";
import type {
  GuruApiMessage,
  GuruChatMessage,
  GuruErrorInfo,
  GuruRunStatus,
  GuruSession,
} from "@/lib/guru/types";

const LOCAL_WRITE_DELAY_MS = 900;
const DB_WRITE_DELAY_MS = 1200;
// Slightly longer than the Undo toast (8s) so a click at the very edge of the
// toast's life still restores the chat instead of racing the commit.
const DELETE_UNDO_MS = 9000;
const DRAFT_PREFIX = "guru-draft";

interface UseGuruChatOptions {
  /** Chat history namespace: per problem or global. */
  scope: string;
  /**
   * Prompt supplied by the host (a selection, a debug CTA). Applied once
   * hydration settles, and never over text the user has already typed.
   */
  initialDraft?: string;
  user: { id: string } | null;
  authLoading: boolean;
  model: string;
  /**
   * Extra system context (coaching mode). Receives the conversation so far so
   * it can decide whether the user has earned a full answer yet.
   */
  buildSystemContext?: (history: GuruChatMessage[]) => string | null;
  onAssistantComplete?: (content: string) => void;
}

interface RunCompletionInput {
  sessionId: string;
  assistantId: string;
  /** Conversation before the assistant placeholder. */
  history: GuruChatMessage[];
}

export interface UseGuruChatResult {
  sessions: GuruSession[];
  groupedSessions: ReturnType<typeof groupSessions>;
  activeSession: GuruSession | undefined;
  messages: GuruChatMessage[];
  currentId: string | null;
  status: GuruRunStatus;
  busy: boolean;
  elapsedMs: number;
  error: GuruErrorInfo | null;
  feedback: Record<string, 1 | -1>;
  draft: string;
  setDraft: (value: string) => void;
  queuedPrompt: string | null;
  send: (text?: string) => void;
  stop: () => void;
  retry: (messageId: string) => void;
  regenerate: (messageId: string) => void;
  editAndResend: (messageId: string, content: string) => void;
  clearError: () => void;
  newChat: () => void;
  selectSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  deleteSession: (id: string) => void;
  restoreSession: (id: string) => void;
  clearActiveChat: () => void;
  rateMessage: (messageId: string, rating: 1 | -1) => void;
  cancelQueued: () => void;
}

function draftKey(userId: string | undefined, scope: string, sessionId: string | null) {
  return `${DRAFT_PREFIX}:${userId ?? "guest"}:${scope}:${sessionId ?? "new"}`;
}

function readDraft(userId: string | undefined, scope: string, sessionId: string | null) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(draftKey(userId, scope, sessionId)) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(
  userId: string | undefined,
  scope: string,
  sessionId: string | null,
  value: string,
) {
  if (typeof window === "undefined") return;
  try {
    const key = draftKey(userId, scope, sessionId);
    if (value.trim()) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Drafts are a convenience; never block typing on storage failures.
  }
}

/** Drop failed turns: they are UI state, never conversation history. */
function liveMessages(messages: GuruChatMessage[]): GuruChatMessage[] {
  return messages.filter((message) => message.status !== "error" && !message.error);
}

export function useGuruChat({
  scope,
  initialDraft,
  user,
  authLoading,
  model,
  buildSystemContext,
  onAssistantComplete,
}: UseGuruChatOptions): UseGuruChatResult {
  const [sessions, setSessions] = useState<GuruSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState<GuruRunStatus>("idle");
  const [error, setError] = useState<GuruErrorInfo | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 1 | -1>>({});
  const [draft, setDraftState] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const userId = user?.id;

  const sessionsRef = useRef<GuruSession[]>([]);
  const currentIdRef = useRef<string | null>(null);
  const statusRef = useRef<GuruRunStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const queuedRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const hydratedRef = useRef(false);
  const syncedRef = useRef<Map<string, string>>(new Map());
  const deletedRef = useRef<Set<string>>(new Set());
  const pendingDeleteRef = useRef<Map<string, { session: GuruSession; timer: number }>>(new Map());
  const runCompletionRef = useRef<(input: RunCompletionInput) => Promise<void>>();
  const sendRef = useRef<(text?: string) => void>();
  const contextRef = useRef(buildSystemContext);
  const completeRef = useRef(onAssistantComplete);

  contextRef.current = buildSystemContext;
  completeRef.current = onAssistantComplete;

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    currentIdRef.current = currentId;
  }, [currentId]);

  const setStatusSafe = useCallback((next: GuruRunStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const patchMessage = useCallback(
    (sessionId: string, messageId: string, patch: Partial<GuruChatMessage>) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: session.messages.map((message) =>
                  message.id === messageId ? { ...message, ...patch } : message,
                ),
              }
            : session,
        ),
      );
    },
    [],
  );

  const removeMessage = useCallback((sessionId: string, messageId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, messages: session.messages.filter((m) => m.id !== messageId) }
          : session,
      ),
    );
  }, []);

  /* ── Hydration: local first, then reconcile with the server ─────── */

  // Reconcile once per (scope, user) context. `authLoading` flips shortly
  // after mount, and a second full hydration at that point used to replace
  // live state — including a message the user sent in the meantime.
  const hydratedForRef = useRef<string | null>(null);
  const scopeRef = useRef(scope);
  const activityRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = `${scope}:${userId ?? "guest"}`;
    const sameKey = hydratedForRef.current === key;
    const scopeChanged = scopeRef.current !== scope;
    scopeRef.current = scope;

    if (sameKey) {
      hydratedRef.current = true;
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    hydratedRef.current = false;

    // A guest→signed-in transition must not throw away a chat that was already
    // started, or a reply that is mid-stream.
    const keepLive = activityRef.current && !scopeChanged;
    const local = keepLive ? [] : readLocalSessions(scope, userId);
    const sortedLocal = [...local].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.date - a.date,
    );

    if (!keepLive) {
      setSessions(sortedLocal);
      setCurrentId(sortedLocal[0]?.id ?? null);
      currentIdRef.current = sortedLocal[0]?.id ?? null;
      syncedRef.current = new Map(
        sortedLocal.map((session) => [session.id, sessionFingerprint(session)]),
      );
    }

    if (authLoading || !userId) {
      hydratedRef.current = true;
      hydratedForRef.current = key;
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    const base = keepLive ? sessionsRef.current : sortedLocal;

    (async () => {
      const { data, error: loadError } = await supabase
        .from("guru_chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("scope", scope)
        .order("is_pinned", { ascending: false })
        .order("session_date", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (loadError) {
        hydratedRef.current = true;
        hydratedForRef.current = key;
        setHydrated(true);
        return;
      }

      const merged = new Map<string, GuruSession>();
      for (const session of base) merged.set(session.id, session);
      for (const row of data ?? []) {
        const session = normalizeSession({
          id: row.session_id,
          title: row.title,
          messages: row.messages,
          model: row.model,
          date: Number(row.session_date) || 0,
          pinned: row.is_pinned,
        });
        if (!session) continue;

        // A reply that is still streaming is newer than anything on the server.
        if (session.id === currentIdRef.current && statusRef.current !== "idle") continue;

        const existing = merged.get(session.id);
        // The server wins unless the local copy is a newer unsynced edit.
        if (!existing || session.date >= existing.date) merged.set(session.id, session);
      }

      const loaded = [...merged.values()].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.date - a.date,
      );

      setSessions(loaded);
      setCurrentId((prev) =>
        prev && loaded.some((session) => session.id === prev) ? prev : loaded[0]?.id ?? null,
      );
      writeLocalSessions(scope, loaded, userId);
      syncedRef.current = new Map(
        loaded.map((session) => [session.id, sessionFingerprint(session)]),
      );

      // Rehydrate thumbs up/down onto stable message ids.
      const { data: ratings } = await supabase
        .from("guru_chat_feedback")
        .select("session_id, message_index, rating")
        .eq("user_id", userId);

      if (cancelled) return;

      if (ratings?.length) {
        const next: Record<string, 1 | -1> = {};
        for (const row of ratings) {
          const session = loaded.find((item) => item.id === row.session_id);
          const message = session?.messages[row.message_index];
          if (!message) continue;
          if (row.rating === 1 || row.rating === -1) {
            next[`${row.session_id}:${message.id}`] = row.rating;
          }
        }
        setFeedback(next);
      }

      hydratedRef.current = true;
      hydratedForRef.current = key;
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [scope, userId, authLoading]);

  /* ── Drafts ─────────────────────────────────────────────────────── */

  // Starts empty on purpose: the mount effect below is what applies the
  // host's prompt, so a panel that mounts already open still gets it.
  const initialDraftRef = useRef("");
  const draftTouchedRef = useRef(false);

  const applyDraft = useCallback(
    (value: string) => {
      setDraftState(value);
      writeDraft(userId, scope, currentIdRef.current, value);
    },
    [scope, userId],
  );

  // A new host prompt replaces the draft immediately…
  useEffect(() => {
    const next = initialDraft?.trim() ?? "";
    if (next === initialDraftRef.current) return;
    initialDraftRef.current = next;
    draftTouchedRef.current = false;
    if (next) applyDraft(next);
  }, [initialDraft, applyDraft]);

  // …and is re-applied once hydration settles on a real session, unless the
  // user has already typed over it.
  useEffect(() => {
    if (!hydrated) return;
    const pending = initialDraftRef.current;
    if (!pending || draftTouchedRef.current) return;
    applyDraft(pending);
  }, [hydrated, applyDraft]);

  // Restore the per-session draft when the user switches chats.
  useEffect(() => {
    if (draftTouchedRef.current) {
      // Something is already being written (or hydration arrived mid-typing):
      // typed text always wins over a stored draft.
      initialDraftRef.current = "";
      return;
    }
    if (initialDraftRef.current) return;
    setDraftState(readDraft(userId, scope, currentId));
  }, [scope, userId, currentId]);

  const setDraft = useCallback(
    (value: string) => {
      draftTouchedRef.current = true;
      setDraftState(value);
      writeDraft(userId, scope, currentId, value);
    },
    [scope, userId, currentId],
  );

  /* ── Local persistence: debounced, so streaming never writes ───── */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeLocalSessions(scope, sessions.map(toPersistedSession), userId);
    }, LOCAL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [scope, sessions, userId]);

  useEffect(() => {
    const flush = () =>
      writeLocalSessions(scope, sessionsRef.current.map(toPersistedSession), userId);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [scope, userId]);

  /* ── Server sync: debounced, and never mid-stream ───────────────── */

  useEffect(() => {
    if (!userId || !hydratedRef.current) return;
    if (status === "submitting" || status === "thinking" || status === "streaming") return;

    const timer = window.setTimeout(() => {
      const previous = syncedRef.current;
      const next = new Map<string, string>();

      for (const session of sessions) {
        const fingerprint = sessionFingerprint(session);
        next.set(session.id, fingerprint);
        if (previous.get(session.id) === fingerprint) continue;

        supabase
          .from("guru_chat_sessions")
          .upsert(
            {
              user_id: userId,
              scope,
              session_id: session.id,
              title: session.title,
              messages: liveMessages(session.messages).map(
                ({ id, role, content, reasoning, createdAt }) => ({
                  id,
                  role,
                  content,
                  reasoning,
                  createdAt,
                }),
              ),
              model: session.model,
              session_date: session.date,
              is_pinned: session.pinned,
            },
            { onConflict: "user_id,scope,session_id" },
          )
          .then(({ error: upsertError }) => {
            if (upsertError) {
              console.error("[Guru] Failed to save chat:", upsertError.message);
            }
          });
      }

      // Explicit deletes only — changing the loaded window must never wipe
      // server-side history that hasn't been fetched yet.
      for (const id of deletedRef.current) {
        supabase
          .from("guru_chat_sessions")
          .delete()
          .eq("user_id", userId)
          .eq("scope", scope)
          .eq("session_id", id)
          .then(({ error: deleteError }) => {
            if (deleteError) console.error("[Guru] Failed to delete chat:", deleteError.message);
          });
      }
      deletedRef.current.clear();

      syncedRef.current = next;
    }, DB_WRITE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [sessions, userId, scope, status]);

  /* ── Elapsed timer for the status line ─────────────────────────── */

  useEffect(() => {
    if (status !== "submitting" && status !== "thinking" && status !== "streaming") {
      setElapsedMs(0);
      return;
    }
    const tick = () => setElapsedMs(Date.now() - startedAtRef.current);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  /* ── Completion runner ─────────────────────────────────────────── */

  const finishRun = useCallback(() => {
    abortRef.current = null;
    setStatusSafe("idle");
    const next = queuedRef.current;
    if (next) {
      queuedRef.current = null;
      setQueuedPrompt(null);
      window.setTimeout(() => sendRef.current?.(next), 0);
    }
  }, [setStatusSafe]);

  const runCompletion = useCallback(
    async ({ sessionId, assistantId, history }: RunCompletionInput) => {
      const controller = new AbortController();
      abortRef.current = controller;
      startedAtRef.current = Date.now();
      setError(null);
      setStatusSafe("submitting");

      const systemContext = contextRef.current?.(history) ?? null;
      const apiMessages: GuruApiMessage[] = toApiMessages(history, { systemContext });
      setStatusSafe("thinking");

      let text = "";
      let reasoning = "";
      let frame: number | null = null;

      const flush = () => {
        frame = null;
        patchMessage(sessionId, assistantId, {
          content: sanitizeGuruReply(text, { streaming: true }),
          reasoning: reasoning || undefined,
        });
      };
      const schedule = () => {
        if (frame !== null) return;
        frame = window.requestAnimationFrame(flush);
      };

      try {
        await streamGuruChat({
          messages: apiMessages,
          model,
          signal: controller.signal,
          onText: (chunk) => {
            text += chunk;
            if (statusRef.current !== "streaming") setStatusSafe("streaming");
            schedule();
          },
          onReasoning: (chunk) => {
            reasoning += chunk;
            schedule();
          },
        });

        if (frame !== null) cancelAnimationFrame(frame);
        const finalText = sanitizeGuruReply(text);
        patchMessage(sessionId, assistantId, {
          content: finalText,
          reasoning: reasoning || undefined,
          status: "complete",
          error: undefined,
        });
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId ? { ...session, date: Date.now() } : session,
          ),
        );
        if (finalText.trim()) completeRef.current?.(finalText);
        finishRun();
      } catch (caught) {
        if (frame !== null) cancelAnimationFrame(frame);

        const aborted =
          controller.signal.aborted || (caught as Error)?.name === "AbortError";
        if (aborted) {
          if (frame !== null) cancelAnimationFrame(frame);
          const finalText = sanitizeGuruReply(text);
          if (!finalText.trim()) {
            removeMessage(sessionId, assistantId);
          } else {
            patchMessage(sessionId, assistantId, {
              content: finalText,
              reasoning: reasoning || undefined,
              status: "aborted",
            });
          }
          abortRef.current = null;
          setStatusSafe("idle");
          return;
        }

        const info: GuruErrorInfo =
          caught instanceof GuruChatError
            ? caught.info
            : {
                message: "Guru couldn't finish that reply. Your message is safe — try again.",
                detail: (caught as Error)?.message,
                retryable: true,
              };

        if (frame !== null) cancelAnimationFrame(frame);
        const finalText = sanitizeGuruReply(text);
        patchMessage(sessionId, assistantId, {
          status: "error",
          error: info,
          content: finalText,
          reasoning: reasoning || undefined,
        });
        setError(info);
        setStatusSafe("error");
        abortRef.current = null;
      }
    },
    [finishRun, model, patchMessage, removeMessage, setStatusSafe],
  );

  runCompletionRef.current = runCompletion;

  /* ── Send ───────────────────────────────────────────────────────── */

  const send = useCallback(
    (rawInput?: string) => {
      const source = rawInput ?? draft;
      const prompt = resolvePrompt(source);
      if (!prompt) return;

      // A second send while streaming is queued, not silently dropped.
      if (statusRef.current !== "idle" && statusRef.current !== "error") {
        queuedRef.current = prompt;
        setQueuedPrompt(prompt);
        return;
      }

      const sessionId = currentIdRef.current;
      const now = Date.now();
      const userMessage: GuruChatMessage = {
        id: createId(),
        role: "user",
        content: prompt,
        createdAt: now,
        status: "complete",
      };
      const assistantMessage: GuruChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        createdAt: now,
        status: "streaming",
      };

      let history: GuruChatMessage[];
      let targetId: string;

      const existing = sessionId
        ? sessionsRef.current.find((item) => item.id === sessionId)
        : undefined;

      if (!existing) {
        targetId = createId();
        const newSession: GuruSession = {
          id: targetId,
          title: createSessionTitle(prompt),
          messages: [userMessage, assistantMessage],
          model,
          date: now,
          pinned: false,
        };
        history = [userMessage];
        currentIdRef.current = targetId;
        setCurrentId(targetId);
        setSessions((prev) => [newSession, ...prev]);
      } else {
        targetId = existing.id;
        history = [...liveMessages(existing.messages), userMessage];
        setSessions((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  messages: [...liveMessages(item.messages), userMessage, assistantMessage],
                  date: now,
                }
              : item,
          ),
        );
      }

      activityRef.current = true;
      initialDraftRef.current = "";
      draftTouchedRef.current = false;
      writeDraft(userId, scope, sessionId, "");
      writeDraft(userId, scope, targetId, "");
      setDraftState("");
      void runCompletion({ sessionId: targetId, assistantId: assistantMessage.id, history });
    },
    [draft, model, runCompletion, scope, userId],
  );

  sendRef.current = send;

  /* ── Stop / retry / regenerate / edit ──────────────────────────── */

  const stop = useCallback(() => {
    queuedRef.current = null;
    setQueuedPrompt(null);
    abortRef.current?.abort();
    abortRef.current = null;
    setStatusSafe("idle");
  }, [setStatusSafe]);

  const retry = useCallback(
    (messageId: string) => {
      if (statusRef.current !== "idle" && statusRef.current !== "error") return;
      const sessionId = currentIdRef.current;
      if (!sessionId) return;
      const session = sessionsRef.current.find((item) => item.id === sessionId);
      if (!session) return;

      const index = session.messages.findIndex((message) => message.id === messageId);
      if (index < 0) return;

      const history = liveMessages(session.messages.slice(0, index));
      const assistantId = session.messages[index].id;

      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                messages: item.messages.slice(0, index + 1).map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: "",
                        reasoning: undefined,
                        status: "streaming",
                        error: undefined,
                      }
                    : message,
                ),
              }
            : item,
        ),
      );

      void runCompletion({ sessionId, assistantId, history });
    },
    [runCompletion],
  );

  const regenerate = useCallback(
    (messageId: string) => {
      if (statusRef.current !== "idle" && statusRef.current !== "error") return;
      const sessionId = currentIdRef.current;
      if (!sessionId) return;
      const session = sessionsRef.current.find((item) => item.id === sessionId);
      if (!session) return;

      const index = session.messages.findIndex((message) => message.id === messageId);
      if (index < 0) return;

      // Keep everything up to the user turn that produced this reply, then
      // grow a fresh assistant message — never re-ask the first question.
      let userIndex = index;
      while (userIndex >= 0 && session.messages[userIndex].role !== "user") userIndex -= 1;
      if (userIndex < 0) return;

      const history = liveMessages(session.messages.slice(0, userIndex + 1));
      const assistantMessage: GuruChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        status: "streaming",
      };

      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, messages: [...history, assistantMessage] } : item,
        ),
      );

      void runCompletion({ sessionId, assistantId: assistantMessage.id, history });
    },
    [runCompletion],
  );

  const editAndResend = useCallback(
    (messageId: string, content: string) => {
      if (statusRef.current !== "idle" && statusRef.current !== "error") return;
      const sessionId = currentIdRef.current;
      if (!sessionId) return;
      const session = sessionsRef.current.find((item) => item.id === sessionId);
      if (!session) return;

      const index = session.messages.findIndex((message) => message.id === messageId);
      if (index < 0) return;
      const original = session.messages[index];
      if (original.role !== "user") return;

      const nextUser: GuruChatMessage = {
        ...original,
        content: content.trim(),
        createdAt: Date.now(),
        status: "complete",
      };
      if (!nextUser.content) return;

      const history = liveMessages(session.messages.slice(0, index));
      const assistantMessage: GuruChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        status: "streaming",
      };

      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                title: index === 0 ? createSessionTitle(nextUser.content) : item.title,
                messages: [...history, nextUser, assistantMessage],
                date: Date.now(),
              }
            : item,
        ),
      );

      void runCompletion({
        sessionId,
        assistantId: assistantMessage.id,
        history: [...history, nextUser],
      });
    },
    [runCompletion],
  );

  /* ── Session actions ───────────────────────────────────────────── */

  const haltActiveRun = useCallback(() => {
    queuedRef.current = null;
    setQueuedPrompt(null);
    abortRef.current?.abort();
    abortRef.current = null;
    setStatusSafe("idle");
  }, [setStatusSafe]);

  const newChat = useCallback(() => {
    haltActiveRun();
    initialDraftRef.current = "";
    draftTouchedRef.current = false;
    setCurrentId(null);
    currentIdRef.current = null;
    setDraftState(readDraft(userId, scope, null));
    setError(null);
  }, [haltActiveRun, scope, userId]);

  const selectSession = useCallback(
    (id: string) => {
      haltActiveRun();
      // The target chat owns its own draft; a pending host prompt does not
      // follow the user into another conversation.
      initialDraftRef.current = "";
      draftTouchedRef.current = false;
      setCurrentId(id);
      currentIdRef.current = id;
      setError(null);
    },
    [haltActiveRun],
  );

  const renameSession = useCallback((id: string, title: string) => {
    const clean = title.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!clean) return;
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? { ...session, title: clean } : session)),
    );
  }, []);

  const togglePin = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, pinned: !session.pinned } : session,
      ),
    );
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      const session = sessionsRef.current.find((item) => item.id === id);
      if (!session) return;

      if (currentIdRef.current === id) {
        haltActiveRun();
        currentIdRef.current = null;
        setCurrentId(null);
      }

      setSessions((prev) => prev.filter((item) => item.id !== id));

      const timer = window.setTimeout(() => {
        pendingDeleteRef.current.delete(id);
        deletedRef.current.add(id);
        // Nudge the sync effect so the delete reaches the server.
        setSessions((prev) => [...prev]);
      }, DELETE_UNDO_MS);

      pendingDeleteRef.current.set(id, { session, timer });
    },
    [haltActiveRun],
  );

  const restoreSession = useCallback((id: string) => {
    const pending = pendingDeleteRef.current.get(id);
    if (!pending) return;
    window.clearTimeout(pending.timer);
    pendingDeleteRef.current.delete(id);
    deletedRef.current.delete(id);
    setSessions((prev) =>
      prev.some((session) => session.id === id)
        ? prev
        : [pending.session, ...prev].sort(
            (a, b) => Number(b.pinned) - Number(a.pinned) || b.date - a.date,
          ),
    );
    // Undoing a delete should put the conversation back in view, not just in
    // the history list.
    if (!currentIdRef.current) {
      currentIdRef.current = id;
      setCurrentId(id);
    }
  }, []);

  const clearActiveChat = useCallback(() => {
    if (currentIdRef.current) deleteSession(currentIdRef.current);
    else newChat();
  }, [deleteSession, newChat]);

  // Undo windows end when the panel unmounts: commit those deletes directly so
  // the server never keeps a conversation the user believes is gone.
  useEffect(() => {
    const pending = pendingDeleteRef.current;
    return () => {
      for (const [id, entry] of pending) {
        window.clearTimeout(entry.timer);
        if (!userId) continue;
        void supabase
          .from("guru_chat_sessions")
          .delete()
          .eq("user_id", userId)
          .eq("scope", scope)
          .eq("session_id", id);
      }
      pending.clear();
    };
  }, [scope, userId]);

  /* ── Feedback ──────────────────────────────────────────────────── */

  const rateMessage = useCallback(
    (messageId: string, rating: 1 | -1) => {
      const sessionId = currentIdRef.current;
      if (!sessionId || !userId) return;
      const session = sessionsRef.current.find((item) => item.id === sessionId);
      if (!session) return;
      const index = session.messages.findIndex((message) => message.id === messageId);
      if (index < 0) return;

      const key = `${sessionId}:${messageId}`;
      const previous = feedback[key];
      setFeedback((prev) => ({ ...prev, [key]: rating }));

      supabase
        .from("guru_chat_feedback")
        .upsert(
          {
            user_id: userId,
            session_id: sessionId,
            message_index: index,
            rating,
          },
          { onConflict: "user_id,session_id,message_index" },
        )
        .then(({ error: rateError }) => {
          if (!rateError) return;
          setFeedback((prev) => {
            const next = { ...prev };
            if (previous) next[key] = previous;
            else delete next[key];
            return next;
          });
        });
    },
    [feedback, userId],
  );

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === currentId),
    [sessions, currentId],
  );

  const groupedSessions = useMemo(() => groupSessions(sessions), [sessions]);

  const clearError = useCallback(() => setError(null), []);
  const cancelQueued = useCallback(() => {
    queuedRef.current = null;
    setQueuedPrompt(null);
  }, []);

  const busy = status === "submitting" || status === "thinking" || status === "streaming";

  return {
    sessions,
    groupedSessions,
    activeSession,
    messages: activeSession?.messages ?? [],
    currentId,
    status,
    busy,
    elapsedMs,
    error,
    feedback,
    draft,
    setDraft,
    queuedPrompt,
    send,
    stop,
    retry,
    regenerate,
    editAndResend,
    clearError,
    newChat,
    selectSession,
    renameSession,
    togglePin,
    deleteSession,
    restoreSession,
    clearActiveChat,
    rateMessage,
    cancelQueued,
  };
}
