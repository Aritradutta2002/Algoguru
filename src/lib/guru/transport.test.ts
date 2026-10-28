import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

import { GuruChatError, streamGuruChat, toGuruError } from "./stream";

const encoder = new TextEncoder();

function sseResponse(chunks: string[], init: ResponseInit = { status: 200 }) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, init);
}

const frame = (fields: Record<string, unknown>) =>
  `data: ${JSON.stringify({ choices: [{ delta: fields }] })}\n\n`;

describe("streamGuruChat", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams text and reasoning separately across chunk boundaries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        frame({ reasoning_content: "think " }),
        frame({ content: "Use " }),
        frame({ content: "a map." }),
        "data: [DONE]\n\n",
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const text: string[] = [];
    const reasoning: string[] = [];

    await streamGuruChat({
      messages: [{ role: "user", content: "hi" }],
      model: "openrouter",
      onText: (chunk) => text.push(chunk),
      onReasoning: (chunk) => reasoning.push(chunk),
    });

    expect(text.join("")).toBe("Use a map.");
    expect(reasoning.join("")).toBe("think ");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("flushes a final frame that arrives without a trailing newline", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          frame({ content: "first " }),
          `data: ${JSON.stringify({ choices: [{ delta: { content: "last" } }] })}`,
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const text: string[] = [];
    await streamGuruChat({
      messages: [],
      model: "openrouter",
      onText: (chunk) => text.push(chunk),
      onReasoning: () => {},
    });

    expect(text.join("")).toBe("first last");
  });

  it("authenticates with the user session, never the publishable key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(["data: [DONE]\n\n"]));
    vi.stubGlobal("fetch", fetchMock);

    await streamGuruChat({
      messages: [],
      model: "openrouter",
      onText: () => {},
      onReasoning: () => {},
    });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("does not retry an authentication failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Sign in to use Guru AI" }), {
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      streamGuruChat({
        messages: [],
        model: "openrouter",
        onText: () => {},
        onReasoning: () => {},
      }),
    ).rejects.toMatchObject({ info: { retryable: false, status: 401 } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces a mid-stream error frame without retrying over partial output", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        sseResponse([
          frame({ content: "Partial answer" }),
          `data: ${JSON.stringify({ error: { message: "model overloaded" } })}\n\n`,
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const text: string[] = [];
    const error = await streamGuruChat({
      messages: [],
      model: "openrouter",
      onText: (chunk) => text.push(chunk),
      onReasoning: () => {},
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(GuruChatError);
    expect(error.info.message).toBe("model overloaded");
    expect(text.join("")).toBe("Partial answer");
    // Retrying would duplicate the partial answer, so the stream is surfaced.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honours an abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      streamGuruChat({
        messages: [],
        model: "openrouter",
        signal: controller.signal,
        onText: () => {},
        onReasoning: () => {},
      }),
    ).rejects.toThrow();
  });
});

describe("toGuruError", () => {
  it("maps 401 to a sign-in prompt that is not retryable", () => {
    const error = toGuruError(401, "unauthorized");
    expect(error.info.retryable).toBe(false);
    expect(error.info.message).toMatch(/sign in/i);
  });

  it("maps 429 to retryable copy", () => {
    const error = toGuruError(429, "rate limited");
    expect(error.info.retryable).toBe(true);
  });

  it("maps 5xx to retryable copy", () => {
    expect(toGuruError(503, "down").info.retryable).toBe(true);
  });

  it("maps 413 to a non-retryable length warning", () => {
    const error = toGuruError(413, "too large");
    expect(error.info.retryable).toBe(false);
    expect(error.info.message).toMatch(/too long|new chat/i);
  });

  it("keeps provider detail for the expandable technical line", () => {
    expect(toGuruError(500, "upstream exploded").info.detail).toContain("upstream");
  });
});
