import { describe, expect, it } from "vitest";
import { GURU_COMMANDS, matchCommands, resolvePrompt } from "./commands";

describe("slash commands", () => {
  it("lists every command for a bare slash", () => {
    expect(matchCommands("/")).toHaveLength(GURU_COMMANDS.length);
  });

  it("filters by name prefix", () => {
    expect(matchCommands("/co").map((command) => command.name)).toEqual(["complexity"]);
  });

  it("closes once the user starts writing arguments", () => {
    expect(matchCommands("/hint why")).toEqual([]);
  });

  it("ignores text that is not a command", () => {
    expect(matchCommands("explain this")).toEqual([]);
  });

  it("resolves a command to its prompt", () => {
    expect(resolvePrompt("/complexity")).toContain("time and space complexity");
  });

  it("appends free text after the command prompt", () => {
    const resolved = resolvePrompt("/hint I think the loop is off by one");
    expect(resolved).toContain("focused hint");
    expect(resolved).toContain("I think the loop is off by one");
  });

  it("passes unknown commands through verbatim", () => {
    expect(resolvePrompt("/unknown thing")).toBe("/unknown thing");
  });

  it("leaves normal prompts untouched", () => {
    expect(resolvePrompt("  why is this slow?  ")).toBe("why is this slow?");
  });
});
