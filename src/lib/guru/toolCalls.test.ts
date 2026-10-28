import { describe, expect, it } from "vitest";
import { sanitizeGuruReply } from "./toolCalls";

const REPORTED = `_call_start|>
[question(
  question='Your code is currently just a skeleton...',
  hint='Think about what dp[i][j] should represent...',
  query='What should the DP state dp[i][j] represent...?'
)]
<|tool_call_end|>`;

describe("sanitizeGuruReply", () => {
  it("renders the reported mangled question call as readable markdown", () => {
    expect(sanitizeGuruReply(REPORTED)).toBe(
      "Your code is currently just a skeleton...\n\n" +
        "**What should the DP state dp[i][j] represent...?**\n\n" +
        "> **Hint:** Think about what dp[i][j] should represent...",
    );
  });

  it("renders a complete special-token block", () => {
    const raw = `<|tool_call_start|>
[question(question='Lead in', hint='Check the loop bound', query='Why does it crash?')]
<|tool_call_end|>`;

    expect(sanitizeGuruReply(raw)).toBe(
      "Lead in\n\n**Why does it crash?**\n\n> **Hint:** Check the loop bound",
    );
  });

  it("renders DeepSeek-style tool-call tokens wrapping JSON", () => {
    const raw = `<|tool▁calls▁begin|>
{"name":"question","arguments":{"question":"Lead","query":"Ready?","hint":"Try n=1"}}
<|tool▁calls▁end|>`;

    expect(sanitizeGuruReply(raw)).toBe("Lead\n\n**Ready?**\n\n> **Hint:** Try n=1");
  });

  it("renders an XML tool_call payload", () => {
    const raw = `<tool_call>
{"name": "question", "arguments": {"query": "What is the base case?"}}
</tool_call>`;

    expect(sanitizeGuruReply(raw)).toBe("**What is the base case?**");
  });

  it("renders a bare JSON question call", () => {
    const raw = '{"name":"question","arguments":{"hint":"Use a hash map"}}';
    expect(sanitizeGuruReply(raw)).toBe("> **Hint:** Use a hash map");
  });

  it("handles nested parentheses, commas and escaped quotes in arguments", () => {
    const raw =
      "[question(question='Why does solve(i, j) crash?', hint='Check the base case — it\\'s missing.', query='What happens when n = 0?')]";

    expect(sanitizeGuruReply(raw)).toBe(
      "Why does solve(i, j) crash?\n\n" +
        "**What happens when n = 0?**\n\n" +
        "> **Hint:** Check the base case — it's missing.",
    );
  });

  it("does not repeat an identical question and query", () => {
    const raw = "[question(question='What is dp[i][j]?', query='What is dp[i][j]?')]";
    expect(sanitizeGuruReply(raw)).toBe("What is dp[i][j]?");
  });

  it("drops unknown tool payloads instead of rendering raw JSON", () => {
    const raw = '<tool_call>{"name":"code_interpreter","arguments":{"code":"print(1)"}}</tool_call>';
    expect(sanitizeGuruReply(raw)).toBe("");
  });

  it("leaves fenced code blocks untouched", () => {
    const raw = "Example:\n\n```text\n<|tool_call_start|>\n[question(question='x')]\n<|tool_call_end|>\n```";
    expect(sanitizeGuruReply(raw)).toBe(raw);
  });

  it("leaves inline code untouched", () => {
    const raw = "See `<|tool_call_start|>` and `[question(...)]` for the token format.";
    expect(sanitizeGuruReply(raw)).toBe(raw);
  });

  it("does not clip inline code at the end of a reply", () => {
    const raw = "A chat template starts with `<|`";
    expect(sanitizeGuruReply(raw)).toBe(raw);
    expect(sanitizeGuruReply("A template starts with `<|tool", { streaming: true })).toBe(
      "A template starts with `<|tool",
    );
  });

  it("does not treat ordinary prose or code-like calls as tool markup", () => {
    const raw = "The state dp[i][j] matters; question(index) is just a method in this example.";
    expect(sanitizeGuruReply(raw)).toBe(raw);
  });

  it("leaves ordinary JSON untouched", () => {
    const raw = 'Example config: {"name":"Alice","age":30}';
    expect(sanitizeGuruReply(raw)).toBe(raw);
  });

  it("is idempotent", () => {
    const once = sanitizeGuruReply(REPORTED);
    expect(sanitizeGuruReply(once)).toBe(once);
  });

  it("collapses excess blank lines", () => {
    expect(sanitizeGuruReply("A\n\n\n\nB")).toBe("A\n\nB");
  });

  it("hides partial markers while streaming", () => {
    expect(sanitizeGuruReply("Let me ask. <|tool_ca", { streaming: true })).toBe("Let me ask.");
    expect(sanitizeGuruReply("Lead [questio", { streaming: true })).toBe("Lead");
    expect(sanitizeGuruReply("Lead <|", { streaming: true })).toBe("Lead");
  });

  it("drops truncated calls and JSON in both modes", () => {
    expect(sanitizeGuruReply("[question(question='What should dp")).toBe("");
    expect(sanitizeGuruReply("[question(question='What should dp", { streaming: true })).toBe("");
    expect(sanitizeGuruReply('{"name":"question","arguments":{"hint":"Try')).toBe("");
  });

  it("salvages a complete call when the closing token is missing", () => {
    expect(
      sanitizeGuruReply("<|tool_call_start|>\n[question(question='Lead', hint='H')]"),
    ).toBe("Lead\n\n> **Hint:** H");
    expect(sanitizeGuruReply("_call_start|>\n[question(question='Lead')]")).toBe("Lead");
    expect(
      sanitizeGuruReply('<tool_call>{"name":"question","arguments":{"query":"Ready?"}}'),
    ).toBe("**Ready?**");
  });

  it("handles tokens whose <| prefix was swallowed", () => {
    const raw = "tool_call_start|>\n[question(question='Lead', hint='H')]\ntool_call_end|>";
    expect(sanitizeGuruReply(raw)).toBe("Lead\n\n> **Hint:** H");
  });

  it("handles a swallowed prefix on both markers", () => {
    const raw = "_call_start|>\n[question(question='Lead')]\n_call_end|>";
    expect(sanitizeGuruReply(raw)).toBe("Lead");
  });

  it("accepts JSON arguments and whitespace before the closing bracket", () => {
    expect(sanitizeGuruReply('[question({"question": "Lead", "hint": "Check the state"})]')).toBe(
      "Lead\n\n> **Hint:** Check the state",
    );
    expect(sanitizeGuruReply("[question(question='Lead')\n]")).toBe("Lead");
  });

  it("renders Mistral-style TOOL_CALLS arrays", () => {
    expect(
      sanitizeGuruReply('[TOOL_CALLS] [{"name":"question","arguments":{"query":"Ready?"}}]'),
    ).toBe("**Ready?**");
  });

  it("drops a truncated non-question JSON call", () => {
    expect(sanitizeGuruReply('{"name":"search","arguments":{"q":')).toBe("");
  });

  it("hides a partial call inside an unterminated token block while streaming", () => {
    expect(sanitizeGuruReply("<|tool_call_start|>\n[questio", { streaming: true })).toBe("");
  });

  it("hides a swallowed-prefix start marker while streaming", () => {
    expect(sanitizeGuruReply("Lead tool_call_st", { streaming: true })).toBe("Lead");
  });

  it("keeps prose before an unfinished call", () => {
    expect(sanitizeGuruReply("Start here. [question(question='next", { streaming: true })).toBe(
      "Start here.",
    );
  });
});
