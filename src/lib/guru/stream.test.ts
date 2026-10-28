import { describe, expect, it } from "vitest";
import { parseSSEBuffer } from "./stream";

const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;
const delta = (fields: Record<string, unknown>) => frame({ choices: [{ delta: fields }] });

describe("parseSSEBuffer", () => {
  it("keeps an incomplete line for the next chunk", () => {
    const first = 'data: {"choices":[{"delta":{"con';
    const parsed = parseSSEBuffer(first);
    expect(parsed.events).toHaveLength(0);
    expect(parsed.rest).toBe(first);
  });

  it("parses text split across network chunks", () => {
    const a = 'data: {"choices":[{"delta":{"content":"Hel';
    const b = 'lo"}}]}\n\n';

    const first = parseSSEBuffer(a);
    const second = parseSSEBuffer(first.rest + b);

    expect(first.events).toHaveLength(0);
    expect(second.events).toEqual([{ type: "text", value: "Hello" }]);
    expect(second.rest).toBe("");
  });

  it("separates reasoning from the visible answer", () => {
    const buffer =
      delta({ reasoning_content: "Let me think." }) + delta({ content: "Use a hash map." });

    expect(parseSSEBuffer(buffer).events).toEqual([
      { type: "reasoning", value: "Let me think." },
      { type: "text", value: "Use a hash map." },
    ]);
  });

  it("accepts the alternate reasoning field", () => {
    expect(parseSSEBuffer(delta({ reasoning: "step" })).events).toEqual([
      { type: "reasoning", value: "step" },
    ]);
  });

  it("joins content sent as an array of parts", () => {
    const buffer = delta({ content: [{ type: "text", text: "ab" }, { type: "text", text: "cd" }] });
    expect(parseSSEBuffer(buffer).events).toEqual([{ type: "text", value: "abcd" }]);
  });

  it("handles CRLF line endings", () => {
    const buffer = 'data: {"choices":[{"delta":{"content":"ok"}}]}\r\n\r\n';
    expect(parseSSEBuffer(buffer).events).toEqual([{ type: "text", value: "ok" }]);
  });

  it("ignores provider comments and non-data fields", () => {
    const buffer = ": OPENROUTER PROCESSING\n\nevent: message\nid: 1\n\n";
    expect(parseSSEBuffer(buffer).events).toEqual([]);
  });

  it("reports [DONE] exactly once", () => {
    const buffer = "data: [DONE]\n\n";
    expect(parseSSEBuffer(buffer).events).toEqual([{ type: "done" }]);
  });

  it("ignores malformed JSON without dropping the stream", () => {
    const buffer = "data: {not json}\n\n" + delta({ content: "still here" });
    expect(parseSSEBuffer(buffer).events).toEqual([
      { type: "text", value: "still here" },
    ]);
  });

  it("surfaces provider error frames", () => {
    const buffer = frame({ error: { message: "model overloaded" } });
    expect(parseSSEBuffer(buffer).events).toEqual([
      { type: "error", message: "model overloaded" },
    ]);
  });

  it("coalesces multiple complete frames in one chunk", () => {
    const buffer =
      delta({ content: "a" }) + delta({ content: "b" }) + delta({ content: "c" });
    expect(parseSSEBuffer(buffer).events).toHaveLength(3);
  });

  it("ignores frames with no delta", () => {
    expect(parseSSEBuffer(frame({ choices: [{ finish_reason: "stop" }] })).events).toEqual([]);
  });

  it("keeps a trailing partial frame after processing complete ones", () => {
    const buffer = delta({ content: "done" }) + 'data: {"choices":[{"delta":{"con';
    const parsed = parseSSEBuffer(buffer);
    expect(parsed.events).toEqual([{ type: "text", value: "done" }]);
    expect(parsed.rest.startsWith('data: {"choices"')).toBe(true);
  });
});
