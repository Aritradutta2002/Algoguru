import { supabase } from "@/integrations/supabase/client";
import type { GuruApiMessage, GuruErrorInfo } from "./types";

/**
 * Streaming client for the `guru-chat` edge function.
 *
 * Two layers on purpose:
 *   1. `parseSSEBuffer` is a pure function — no fetch, no React — so the
 *      fragile part (chunk boundaries, CRLF, split UTF-8, `[DONE]`, error
 *      frames) is unit-testable.
 *   2. `streamGuruChat` owns auth, HTTP, retry and abort.
 *
 * OpenRouter interleaves `: OPENROUTER PROCESSING` comments with the SSE
 * frames; those are ignored rather than pushed into the answer.
 */

export type GuruStreamEvent =
  | { type: "text"; value: string }
  | { type: "reasoning"; value: string }
  | { type: "done" }
  | { type: "error"; message: string };

export class GuruChatError extends Error {
  info: GuruErrorInfo;

  constructor(info: GuruErrorInfo) {
    super(info.message);
    this.name = "GuruChatError";
    this.info = info;
  }
}

/** True for errors the user can meaningfully retry. */
export function isRetryable(error: unknown): boolean {
  return error instanceof GuruChatError && error.info.retryable;
}

/* ── SSE parsing ──────────────────────────────────────────────────── */

function pickDelta(payload: any): { text?: string; reasoning?: string } {
  const delta = payload?.choices?.[0]?.delta;
  if (!delta) return {};
  // Some gateways send content as an array of parts instead of a string.
  const text =
    typeof delta.content === "string"
      ? delta.content
      : Array.isArray(delta.content)
        ? delta.content
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .join("")
        : undefined;
  const reasoning =
    typeof delta.reasoning_content === "string"
      ? delta.reasoning_content
      : typeof delta.reasoning === "string"
        ? delta.reasoning
        : undefined;
  return { text, reasoning };
}

/**
 * Consume as much of `buffer` as possible, returning parsed events plus the
 * unfinished tail (a partial line from the next network chunk).
 */
export function parseSSEBuffer(buffer: string): {
  events: GuruStreamEvent[];
  rest: string;
} {
  const events: GuruStreamEvent[] = [];
  const lastBreak = buffer.lastIndexOf("\n");
  if (lastBreak === -1) return { events, rest: buffer };

  const complete = buffer.slice(0, lastBreak);
  const rest = buffer.slice(lastBreak + 1);

  for (const rawLine of complete.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line || line.startsWith(":")) continue;

    if (!line.startsWith("data:")) continue;

    const payload = line.slice(5).trim();
    if (!payload) continue;
    if (payload === "[DONE]") {
      events.push({ type: "done" });
      continue;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // A provider keep-alive or a non-JSON frame — never fatal.
      continue;
    }

    if (parsed?.error) {
      const message =
        typeof parsed.error === "string"
          ? parsed.error
          : parsed.error?.message || "The model returned an error.";
      events.push({ type: "error", message });
      continue;
    }

    const { text, reasoning } = pickDelta(parsed);
    if (reasoning) events.push({ type: "reasoning", value: reasoning });
    if (text) events.push({ type: "text", value: text });
  }

  return { events, rest };
}

/* ── Error mapping ────────────────────────────────────────────────── */

const DEFAULT_ERROR =
  "Guru couldn't finish that reply. Your message is safe — try again.";

export function toGuruError(
  status: number | undefined,
  raw: string,
  requestId?: string,
): GuruChatError {
  const detail = raw.trim().slice(0, 600) || undefined;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new GuruChatError({
      message: "You're offline. Reconnect and Guru will pick this up.",
      detail,
      retryable: true,
      status,
      requestId,
    });
  }

  if (status === 401) {
    return new GuruChatError({
      message: "Your session expired. Sign in again to keep chatting with Guru.",
      detail,
      retryable: false,
      status,
      requestId,
    });
  }

  if (status === 402 || status === 403) {
    return new GuruChatError({
      message: "Guru isn't available on this account right now.",
      detail,
      retryable: false,
      status,
      requestId,
    });
  }

  if (status === 413) {
    return new GuruChatError({
      message: "This conversation is too long for one request. Start a new chat to continue.",
      detail,
      retryable: false,
      status,
      requestId,
    });
  }

  if (status === 429) {
    return new GuruChatError({
      message: "Guru is busy right now. Retrying in a moment usually works.",
      detail,
      retryable: true,
      status,
      requestId,
    });
  }

  if (status && status >= 500) {
    return new GuruChatError({
      message: "Guru's model is briefly unavailable. Your message is safe — try again.",
      detail,
      retryable: true,
      status,
      requestId,
    });
  }

  if (status === 408) {
    return new GuruChatError({
      message: "That request timed out. Try again — long answers can take a moment.",
      detail,
      retryable: true,
      status,
      requestId,
    });
  }

  const message = raw.trim() && raw.trim().length < 180 ? raw.trim() : DEFAULT_ERROR;

  return new GuruChatError({
    message,
    detail,
    retryable: status === undefined || status >= 500,
    status,
    requestId,
  });
}

/* ── Transport ────────────────────────────────────────────────────── */

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guru-chat`;
const RETRY_DELAYS_MS = [500, 1400];

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export interface StreamGuruChatOptions {
  messages: GuruApiMessage[];
  model: string;
  signal?: AbortSignal;
  onText: (text: string) => void;
  onReasoning: (text: string) => void;
}

/**
 * POST the conversation and stream the reply.
 *
 * Retries are safe only before the first token — a retry after partial output
 * would duplicate text. Aborts are never retried.
 */
export async function streamGuruChat({
  messages,
  model,
  signal,
  onText,
  onReasoning,
}: StreamGuruChatOptions): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new GuruChatError({
      message: "Sign in to use Guru AI.",
      retryable: false,
      status: 401,
    });
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let emitted = 0;

    try {
      await runOnce({ messages, model, signal, onText, onReasoning }, (n) => {
        emitted += n;
      });
      return;
    } catch (error) {
      if (signal?.aborted || (error as Error)?.name === "AbortError") throw error;
      lastError = error;

      const retryable = isRetryable(error) && emitted === 0;
      const hasBudget = attempt < RETRY_DELAYS_MS.length;
      if (!retryable || !hasBudget) throw error;

      await sleep(RETRY_DELAYS_MS[attempt], signal);
    }
  }

  throw lastError;
}

async function runOnce(
  { messages, model, signal, onText, onReasoning }: StreamGuruChatOptions,
  countEmitted: (n: number) => void,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new GuruChatError({ message: "Sign in to use Guru AI.", retryable: false, status: 401 });
  }

  let response: Response;
  try {
    response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages, model }),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw toGuruError(undefined, (error as Error)?.message || "");
  }

  const requestId =
    response.headers.get("x-request-id") ||
    response.headers.get("x-sb-request-id") ||
    undefined;

  if (!response.ok || !response.body) {
    const raw = await response.text().catch(() => "");
    throw toGuruError(response.status, raw, requestId);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const consume = (events: GuruStreamEvent[]) => {
    for (const event of events) {
      if (event.type === "error") {
        throw new GuruChatError({
          message: event.message || DEFAULT_ERROR,
          retryable: true,
          requestId,
        });
      }
      if (event.type === "text") {
        countEmitted(event.value.length);
        onText(event.value);
      }
      if (event.type === "reasoning") {
        onReasoning(event.value);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSSEBuffer(buffer);
      buffer = rest;
      consume(events);
    }

    // A stream may end without its trailing newline (or with a split UTF-8
    // sequence). Flush both so the final token is never dropped.
    buffer += decoder.decode();
    if (buffer.trim()) consume(parseSSEBuffer(`${buffer}\n`).events);
  } finally {
    reader.releaseLock();
  }
}
