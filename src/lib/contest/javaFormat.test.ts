import { describe, expect, it } from "vitest";
import { formatJava } from "@/lib/contest/javaFormat";

describe("formatJava", () => {
  it("re-indents a class, its members and their bodies", () => {
    const input = [
      "class Solution {",
      "public List<Integer> f(String s) {",
      "if (s.isEmpty()) {",
      "return List.of();",
      "}",
      "return null;",
      "}",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "class Solution {",
        "    public List<Integer> f(String s) {",
        "        if (s.isEmpty()) {",
        "            return List.of();",
        "        }",
        "        return null;",
        "    }",
        "}",
      ].join("\n"),
    );
  });

  it("aligns } else { and closing braces with their block", () => {
    const input = ["if (a) {", "x();", "} else {", "y();", "}"].join("\n");

    expect(formatJava(input)).toBe(
      ["if (a) {", "    x();", "} else {", "    y();", "}"].join("\n"),
    );
  });

  it("indents switch labels one level and their bodies two", () => {
    const input = [
      "switch (n) {",
      "case 1:",
      "a();",
      "break;",
      "default:",
      "b();",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "switch (n) {",
        "    case 1:",
        "        a();",
        "        break;",
        "    default:",
        "        b();",
        "}",
      ].join("\n"),
    );
  });

  it("keeps nested blocks inside a case body at the right depth", () => {
    const input = [
      "switch (n) {",
      "case 1:",
      "if (x) {",
      "a();",
      "}",
      "break;",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "switch (n) {",
        "    case 1:",
        "        if (x) {",
        "            a();",
        "        }",
        "        break;",
        "}",
      ].join("\n"),
    );
  });

  it("indents arrow-style switch cases without opening a body", () => {
    const input = [
      "String s = switch (n) {",
      "case 1 -> \"one\";",
      "default -> \"other\";",
      "};",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "String s = switch (n) {",
        '    case 1 -> "one";',
        '    default -> "other";',
        "};",
      ].join("\n"),
    );
  });

  it("gives continued lines one extra level, aligned back on the closer", () => {
    const input = ["foo(", "a,", "b", ");"].join("\n");

    expect(formatJava(input)).toBe(["foo(", "    a,", "    b", ");"].join("\n"));
  });

  it("ignores braces inside strings, chars and comments", () => {
    const input = [
      "class A {",
      "String s = \"}{\";",
      "char c = '}';",
      "// } not a brace",
      "/* } neither */",
      "int x = 1;",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "class A {",
        "    String s = \"}{\";",
        "    char c = '}';",
        "    // } not a brace",
        "    /* } neither */",
        "    int x = 1;",
        "}",
      ].join("\n"),
    );
  });

  it("keeps a block comment's star column and re-indents it with its code", () => {
    const input = [
      "class A {",
      "/*",
      "* hello",
      "*/",
      "int x = 1;",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "class A {",
        "    /*",
        "     * hello",
        "     */",
        "    int x = 1;",
        "}",
      ].join("\n"),
    );
  });

  it("never touches the contents of a text block", () => {
    const input = [
      "class A {",
      "String s = \"\"\"",
      "  { keep }   ",
      "\"\"\";",
      "}",
    ].join("\n");

    expect(formatJava(input)).toBe(
      [
        "class A {",
        "    String s = \"\"\"",
        "  { keep }   ",
        '"""' + ";",
        "}",
      ].join("\n"),
    );
  });

  it("strips trailing whitespace and normalises blank lines", () => {
    const input = ["class A {   ", "int x = 1;\t", "", "}  "].join("\n");

    expect(formatJava(input)).toBe(
      ["class A {", "    int x = 1;", "", "}"].join("\n"),
    );
  });

  it("is idempotent", () => {
    const messy = [
      "class Solution {",
      "  public int f() {",
      "      if (true) {",
      "return 1;",
      "      }",
      "  return 0;",
      "  }",
      "}",
    ].join("\n");

    const once = formatJava(messy);
    expect(formatJava(once)).toBe(once);
  });

  it("honours a custom indent size", () => {
    expect(formatJava("class A {\nint x;\n}", { indentSize: 2 })).toBe(
      "class A {\n  int x;\n}",
    );
  });

  it("leaves empty and whitespace-only input alone", () => {
    expect(formatJava("")).toBe("");
    expect(formatJava("   \n  ")).toBe("   \n  ");
  });

  it("does not de-indent below column zero on unbalanced input", () => {
    expect(formatJava("}\n}\nint x;")).toBe("}\n}\nint x;");
  });
});
