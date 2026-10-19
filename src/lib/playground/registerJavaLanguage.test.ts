import { describe, it, expect } from "vitest";
import { escapeRegExp } from "@/lib/playground/registerJavaLanguage";

/**
 * `resolveVariableType` interpolates a variable name into four `RegExp`
 * constructors. The name comes from parsed source text, so a hostile value must
 * become a literal rather than regex syntax. The `.semgrepignore` for
 * `detect-non-literal-regexp` asserts this is safe, so it is pinned here.
 */
describe("escapeRegExp", () => {
  it.each([".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"])(
    "escapes the metacharacter %s",
    (meta) => {
      const escaped = escapeRegExp(meta);
      expect(escaped).toBe(`\\${meta}`);
      // The escaped form must match its own literal text, not act as syntax.
      expect(new RegExp(escaped).test(meta)).toBe(true);
    },
  );

  it("leaves ordinary identifiers untouched", () => {
    expect(escapeRegExp("count")).toBe("count");
    expect(escapeRegExp("_value2")).toBe("_value2");
  });

  it("neutralises a catastrophic-backtracking name", () => {
    const hostile = "(a+)+$";
    const built = new RegExp(`\\s+${escapeRegExp(hostile)}\\s*[=;,)]`);
    expect(built.test(" (a+)+$ = 1")).toBe(true);

    const started = Date.now();
    for (let i = 0; i < 2000; i += 1) built.test(`${"a".repeat(40)}b`);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
