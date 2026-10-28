/** Shared types for the Guru assistant. */

export type GuruRole = "user" | "assistant";

export type GuruMessageStatus = "streaming" | "complete" | "error" | "aborted";

export interface GuruErrorInfo {
  /** Human copy shown in the transcript. Never sent to the model. */
  message: string;
  /** Raw provider/HTTP detail, kept for the expandable "Details" line. */
  detail?: string;
  retryable: boolean;
  status?: number;
  requestId?: string;
}

export interface GuruChatMessage {
  id: string;
  role: GuruRole;
  content: string;
  /** Chain-of-thought, rendered in a collapsed "Thought for…" disclosure. */
  reasoning?: string;
  createdAt: number;
  status?: GuruMessageStatus;
  /** Present only while `status === "error"`. Never persisted or sent upstream. */
  error?: GuruErrorInfo;
}

export interface GuruSession {
  id: string;
  title: string;
  messages: GuruChatMessage[];
  model: string;
  date: number;
  pinned: boolean;
}

/** Wire format understood by the `guru-chat` edge function. */
export interface GuruApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type GuruRunStatus = "idle" | "submitting" | "thinking" | "streaming" | "error";
