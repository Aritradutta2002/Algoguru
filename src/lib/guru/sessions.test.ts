import { describe, expect, it } from "vitest";
import {
  createSessionTitle,
  estimateTokens,
  groupSessions,
  normalizeSession,
  sessionFingerprint,
  toApiMessages,
  toPersistedSession,
  exportSessionMarkdown,
} from "./sessions";
import type { GuruChatMessage, GuruSession } from "./types";

const message = (overrides: Partial<GuruChatMessage> = {}): GuruChatMessage => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  role: overrides.role ?? "user",
  content: overrides.content ?? "hello",
  createdAt: overrides.createdAt ?? Date.now(),
  status: overrides.status ?? "complete",
  ...overrides,
});

const session = (overrides: Partial<GuruSession> = {}): GuruSession => ({
  id: overrides.id ?? "s1",
  title: overrides.title ?? "Chat",
  messages: overrides.messages ?? [],
  model: overrides.model ?? "openrouter",
  date: overrides.date ?? Date.now(),
  pinned: overrides.pinned ?? false,
});

describe("session normalisation", () => {
  it("upgrades legacy { role, content } messages with ids", () => {
    const normalized = normalizeSession({
      id: "legacy",
      title: "Old chat",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
      model: "openrouter",
      date: 1,
      pinned: false,
    });

    expect(normalized?.messages).toHaveLength(2);
    expect(normalized?.messages[0].id).toBeTruthy();
    expect(normalized?.messages[1].role).toBe("assistant");
  });

  it("drops empty placeholders and meaningless rows", () => {
    const normalized = normalizeSession({
      id: "x",
      title: "",
      messages: [
        { role: "assistant", content: "   " },
        { role: "system", content: "nope" },
        null,
      ],
      date: 0,
    });

    expect(normalized?.messages).toHaveLength(0);
    expect(normalized?.title).toBe("New chat");
  });

  it("re-issues duplicate ids so React keys and feedback stay stable", () => {
    const normalized = normalizeSession({
      id: "dupe",
      title: "t",
      messages: [
        { id: "same", role: "user", content: "a" },
        { id: "same", role: "assistant", content: "b" },
      ],
    });

    expect(normalized?.messages[0].id).not.toBe(normalized?.messages[1].id);
  });

  it("marks persisted streaming messages as complete", () => {
    const normalized = normalizeSession({
      id: "s",
      title: "t",
      messages: [{ id: "m", role: "assistant", content: "partial", status: "streaming" }],
    });

    expect(normalized?.messages[0].status).toBe("complete");
  });

  it("sanitises stored tool-call markup in assistant replies", () => {
    const normalized = normalizeSession({
      id: "tool",
      title: "t",
      messages: [
        { id: "u", role: "user", content: "help", createdAt: 1 },
        {
          id: "a",
          role: "assistant",
          content:
            "_call_start|>\n[question(question='Your code is a skeleton', hint='Check dp[i][j]')]\n<|tool_call_end|>",
          createdAt: 2,
        },
      ],
    });

    expect(normalized?.messages[1].content).toBe(
      "Your code is a skeleton\n\n> **Hint:** Check dp[i][j]",
    );
  });

  it("never rewrites user content that looks like tool markup", () => {
    const content = "_call_start|>\n[question(question='mine')]\n<|tool_call_end|>";
    const normalized = normalizeSession({
      id: "u",
      title: "t",
      messages: [{ id: "u", role: "user", content }],
    });

    expect(normalized?.messages[0].content).toBe(content);
  });

  it("drops assistant rows that contain only unknown tool markup", () => {
    const normalized = normalizeSession({
      id: "unknown",
      title: "t",
      messages: [
        {
          id: "a",
          role: "assistant",
          content: '<tool_call>{"name":"shell","arguments":{"cmd":"ls"}}</tool_call>',
        },
      ],
    });

    expect(normalized?.messages).toHaveLength(0);
  });
});

describe("toApiMessages", () => {
  it("excludes failed turns — errors are UI state, not history", () => {
    const history = [
      message({ role: "user", content: "q" }),
      message({
        role: "assistant",
        content: "",
        status: "error",
        error: { message: "network", retryable: true },
      }),
      message({ role: "assistant", content: "answer" }),
    ];

    expect(toApiMessages(history)).toEqual([
      { role: "user", content: "q" },
      { role: "assistant", content: "answer" },
    ]);
  });

  it("prepends system context when provided", () => {
    expect(
      toApiMessages([message({ content: "q" })], { systemContext: "be Socratic" }),
    ).toEqual([
      { role: "system", content: "be Socratic" },
      { role: "user", content: "q" },
    ]);
  });

  it("drops whitespace-only messages", () => {
    expect(
      toApiMessages([message({ content: "  " }), message({ content: "real" })]),
    ).toEqual([{ role: "user", content: "real" }]);
  });

  it("compacts long conversations but keeps the opening question", () => {
    const history: GuruChatMessage[] = [];
    for (let index = 0; index < 30; index += 1) {
      history.push(
        message({
          role: index % 2 === 0 ? "user" : "assistant",
          content: `m${index}`,
        }),
      );
    }

    const compact = toApiMessages(history, { maxMessages: 6 });

    expect(compact.length).toBeLessThanOrEqual(6);
    expect(compact[0]).toEqual({ role: "user", content: "m0" });
    expect(compact.at(-1)).toEqual({ role: "assistant", content: "m29" });
  });

  it("never starts a transcript with an assistant turn", () => {
    const history = [
      message({ role: "assistant", content: "orphan" }),
      message({ role: "user", content: "q" }),
    ];

    expect(toApiMessages(history)[0].role).toBe("user");
  });
});

describe("toPersistedSession", () => {
  it("drops failed turns and their error detail", () => {
    const persisted = toPersistedSession(
      session({
        messages: [
          message({ role: "user", content: "q" }),
          message({
            role: "assistant",
            content: "partial",
            status: "error",
            error: {
              message: "network down",
              detail: "fetch failed",
              retryable: true,
            },
          }),
          message({ role: "assistant", content: "answer" }),
        ],
      }),
    );

    expect(persisted.messages).toHaveLength(2);
    expect(persisted.messages.map((item) => item.content)).toEqual(["q", "answer"]);
    expect(persisted.messages.some((item) => item.error)).toBe(false);
  });

  it("downgrades an interrupted stream to complete", () => {
    const persisted = toPersistedSession(
      session({
        messages: [message({ role: "assistant", content: "partial", status: "streaming" })],
      }),
    );

    expect(persisted.messages[0].status).toBe("complete");
  });

  it("does not mutate the live session", () => {
    const live = session({
      messages: [message({ role: "assistant", content: "x", status: "streaming" })],
    });

    toPersistedSession(live);

    expect(live.messages[0].status).toBe("streaming");
  });
});

describe("groupSessions", () => {
  const now = new Date("2026-03-10T12:00:00Z").getTime();
  const day = 86_400_000;

  it("pins first, then buckets by age", () => {
    const groups = groupSessions(
      [
        session({ id: "pinned", pinned: true, date: now - 40 * day }),
        session({ id: "today", date: now - 1000 }),
        session({ id: "yesterday", date: now - day }),
        session({ id: "week", date: now - 4 * day }),
        session({ id: "old", date: now - 30 * day }),
      ],
      now,
    );

    expect(groups.map((group) => group.label)).toEqual([
      "Pinned",
      "Today",
      "Yesterday",
      "Previous 7 days",
      "Older",
    ]);
    expect(groups[0].sessions[0].id).toBe("pinned");
  });

  it("omits empty buckets", () => {
    const groups = groupSessions([session({ id: "a", date: now })], now);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
  });
});

describe("helpers", () => {
  it("creates a bounded title", () => {
    const title = createSessionTitle("  a ".repeat(80));
    expect(title.length).toBeLessThanOrEqual(57);
  });

  it("estimates tokens from characters", () => {
    expect(estimateTokens("abcdefgh")).toBe(2);
    expect(estimateTokens("")).toBe(1);
  });

  it("fingerprints reasoning changes", () => {
    const base = session({
      messages: [message({ role: "assistant", content: "a" })],
    });
    const changed = session({
      messages: [message({ role: "assistant", content: "a", reasoning: "because" })],
    });

    expect(sessionFingerprint(base)).not.toBe(sessionFingerprint(changed));
  });

  it("exports readable markdown without failed turns", () => {
    const markdown = exportSessionMarkdown(
      session({
        title: "Two sum",
        messages: [
          message({ role: "user", content: "help" }),
          message({
            role: "assistant",
            content: "",
            status: "error",
            error: { message: "boom", retryable: true },
          }),
          message({ role: "assistant", content: "**hint**" }),
        ],
      }),
    );

    expect(markdown).toContain("# Two sum");
    expect(markdown).toContain("### You\n\nhelp");
    expect(markdown).toContain("### Guru\n\n**hint**");
    expect(markdown).not.toContain("boom");
  });
});
