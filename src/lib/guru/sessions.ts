import type { GuruApiMessage, GuruChatMessage, GuruSession } from "./types";
import { sanitizeGuruReply } from "./toolCalls";

/**
 * Session repository for Guru.
 *
 * Persists to `localStorage` for instant restore (and for guests), while
 * `guru_chat_sessions` remains the cross-device source of truth for signed-in
 * users. Legacy rows stored `{ role, content }`; every read funnels through
 * `normalizeSession` so older history keeps working without a migration.
 */

export const SESSION_STORAGE_PREFIX = "guru-chat-history";
export const MAX_MODEL_MESSAGES = 14;

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSessionTitle(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 56 ? `${clean.slice(0, 56).trimEnd()}…` : clean;
}

/** ~4 characters per token, the usual English estimate. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.trim().length / 4));
}

export function normalizeMessage(raw: unknown): GuruChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<GuruChatMessage> & { role?: unknown; content?: unknown };
  if (value.role !== "user" && value.role !== "assistant") return null;

  let content = typeof value.content === "string" ? value.content : "";
  if (value.role === "assistant") content = sanitizeGuruReply(content);
  const error =
    value.status === "error" && value.error && typeof value.error === "object"
      ? value.error
      : undefined;

  // A message with neither text nor an error is an interrupted placeholder.
  if (!content.trim() && !error) return null;

  return {
    id: typeof value.id === "string" && value.id ? value.id : createId(),
    role: value.role,
    content,
    reasoning: typeof value.reasoning === "string" && value.reasoning ? value.reasoning : undefined,
    createdAt:
      typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
        ? value.createdAt
        : Date.now(),
    status: error ? "error" : value.status === "streaming" ? "complete" : value.status,
    error,
  };
}

export function normalizeSession(raw: any): GuruSession | null {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string") return null;

  const seen = new Set<string>();
  const messages: GuruChatMessage[] = [];
  for (const item of Array.isArray(raw.messages) ? raw.messages : []) {
    const message = normalizeMessage(item);
    if (!message) continue;
    if (seen.has(message.id)) message.id = createId();
    seen.add(message.id);
    messages.push(message);
  }

  return {
    id: raw.id,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "New chat",
    messages,
    model: typeof raw.model === "string" && raw.model ? raw.model : "openrouter",
    date: Number.isFinite(Number(raw.date)) ? Number(raw.date) : 0,
    pinned: Boolean(raw.pinned),
  };
}

export function sessionStorageKey(scope: string, userId?: string): string {
  return `${SESSION_STORAGE_PREFIX}:${userId ?? "guest"}:${scope}`;
}

export function readLocalSessions(scope: string, userId?: string): GuruSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(sessionStorageKey(scope, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSession)
      .filter((session): session is GuruSession => Boolean(session));
  } catch {
    return [];
  }
}

export function writeLocalSessions(scope: string, sessions: GuruSession[], userId?: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(sessionStorageKey(scope, userId), JSON.stringify(sessions));
  } catch {
    // Private mode or quota exceeded — chat still works, it just won't restore.
  }
}

/**
 * Build the upstream conversation.
 *
 * Compaction keeps the opening question (the problem statement usually lives
 * there) plus the most recent turns. It never starts a transcript with an
 * assistant turn and never includes failed replies — those are UI state.
 */
export function toApiMessages(
  messages: GuruChatMessage[],
  options: { systemContext?: string; maxMessages?: number } = {},
): GuruApiMessage[] {
  const maxMessages = options.maxMessages ?? MAX_MODEL_MESSAGES;

  const clean: GuruApiMessage[] = messages
    .filter((message) => message.status !== "error" && !message.error)
    .map((message) => ({ role: message.role, content: message.content.trim() }))
    .filter((message) => message.content.length > 0);

  let compact = clean;
  if (clean.length > maxMessages) {
    const first = clean.find((message) => message.role === "user");
    const keep = Math.max(1, maxMessages - (first ? 1 : 0));
    const tail = clean.slice(-keep);
    compact = first && tail[0] !== first ? [first, ...tail] : tail;
  }

  while (compact.length > 0 && compact[0].role === "assistant") compact.shift();

  const systemContext = options.systemContext?.trim();
  return systemContext
    ? [{ role: "system", content: systemContext }, ...compact]
    : compact;
}

export interface SessionGroup {
  label: string;
  sessions: GuruSession[];
}

const DAY_MS = 86_400_000;

function startOfDay(date: number): number {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

/** Pinned first, then Today / Yesterday / Previous 7 days / Older. */
export function groupSessions(
  sessions: GuruSession[],
  now = Date.now(),
): SessionGroup[] {
  const sorted = [...sessions].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date - a.date,
  );

  const today = startOfDay(now);
  const groups = new Map<string, GuruSession[]>([
    ["Pinned", []],
    ["Today", []],
    ["Yesterday", []],
    ["Previous 7 days", []],
    ["Older", []],
  ]);

  for (const session of sorted) {
    if (session.pinned) {
      groups.get("Pinned")!.push(session);
      continue;
    }
    const day = startOfDay(session.date || now);
    if (day >= today) groups.get("Today")!.push(session);
    else if (day >= today - DAY_MS) groups.get("Yesterday")!.push(session);
    else if (day >= today - 7 * DAY_MS) groups.get("Previous 7 days")!.push(session);
    else groups.get("Older")!.push(session);
  }

  return [...groups.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, sessions: items }));
}

/** What actually goes to disk / Supabase: no failed turns, no live status. */
export function toPersistedSession(session: GuruSession): GuruSession {
  return {
    ...session,
    messages: session.messages
      .filter((message) => message.status !== "error" && !message.error)
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        reasoning: message.reasoning,
        createdAt: message.createdAt,
        status: message.status === "streaming" ? "complete" : message.status,
      })),
  };
}

export function exportSessionMarkdown(session: GuruSession): string {
  const header = [
    `# ${session.title}`,
    "",
    `_Exported from AlgoGuru · ${new Date(session.date || Date.now()).toLocaleString()}_`,
    "",
  ].join("\n");

  const body = session.messages
    .filter((message) => message.status !== "error" && message.content.trim())
    .map((message) => {
      const who = message.role === "user" ? "You" : "Guru";
      return `### ${who}\n\n${message.content.trim()}\n`;
    })
    .join("\n");

  return `${header}${body}`.trimEnd() + "\n";
}

/** Fingerprint used to decide whether a session needs an upsert. */
export function sessionFingerprint(session: GuruSession): string {
  return JSON.stringify([
    session.title,
    session.model,
    session.date,
    session.pinned,
    session.messages.map((message) => [
      message.id,
      message.role,
      message.content,
      message.reasoning ?? "",
      message.status ?? "",
    ]),
  ]);
}
