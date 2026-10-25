import type { CSSProperties } from "react";

export type CodeToken = {
  text: string;
  className?: string;
};

export function CodeLine({
  tokens,
  index,
}: {
  tokens: CodeToken[];
  index?: number;
}) {
  return (
    <span
      className="hero-code-line"
      style={index === undefined ? undefined : ({ "--i": index } as CSSProperties)}
    >
      {tokens.map((token, tokenIndex) => (
        <span key={tokenIndex} className={token.className}>
          {token.text}
        </span>
      ))}
    </span>
  );
}

/**
 * Hand-tokenised so both landing code surfaces get real syntax colour without
 * shipping a highlighter.
 */
export const TWO_SUM_LINES: CodeToken[][] = [
  [
    { text: "class", className: "tok-k" },
    { text: " " },
    { text: "Solution", className: "tok-t" },
    { text: " {" },
  ],
  [
    { text: "  " },
    { text: "int", className: "tok-t" },
    { text: "[] " },
    { text: "twoSum", className: "tok-f" },
    { text: "(" },
    { text: "int", className: "tok-t" },
    { text: "[] a, " },
    { text: "int", className: "tok-t" },
    { text: " t) {" },
  ],
  [
    { text: "    " },
    { text: "Map", className: "tok-t" },
    { text: "<" },
    { text: "Integer", className: "tok-t" },
    { text: "," },
    { text: "Integer", className: "tok-t" },
    { text: "> m = " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "HashMap", className: "tok-t" },
    { text: "<>();" },
  ],
  [
    { text: "    " },
    { text: "for", className: "tok-k" },
    { text: " (" },
    { text: "int", className: "tok-t" },
    { text: " i = " },
    { text: "0", className: "tok-n" },
    { text: "; i < a.length; i++) {" },
  ],
  [
    { text: "      " },
    { text: "if", className: "tok-k" },
    { text: " (m." },
    { text: "containsKey", className: "tok-f" },
    { text: "(t - a[i]))" },
  ],
  [
    { text: "        " },
    { text: "return", className: "tok-k" },
    { text: " " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "int", className: "tok-t" },
    { text: "[]{m." },
    { text: "get", className: "tok-f" },
    { text: "(t - a[i]), i};" },
  ],
  [
    { text: "      m." },
    { text: "put", className: "tok-f" },
    { text: "(a[i], i);" },
  ],
  [{ text: "    }" }],
  [
    { text: "    " },
    { text: "return", className: "tok-k" },
    { text: " " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "int", className: "tok-t" },
    { text: "[0];" },
  ],
  [{ text: "  }" }],
  [{ text: "}" }],
];

export const VALID_PARENTHESES_LINES: CodeToken[][] = [
  [
    { text: "class", className: "tok-k" },
    { text: " " },
    { text: "Solution", className: "tok-t" },
    { text: " {" },
  ],
  [
    { text: "  " },
    { text: "public", className: "tok-k" },
    { text: " " },
    { text: "boolean", className: "tok-t" },
    { text: " " },
    { text: "isValid", className: "tok-f" },
    { text: "(" },
    { text: "String", className: "tok-t" },
    { text: " s) {" },
  ],
  [
    { text: "    " },
    { text: "Deque", className: "tok-t" },
    { text: "<" },
    { text: "Character", className: "tok-t" },
    { text: "> stack = " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "ArrayDeque", className: "tok-t" },
    { text: "<>();" },
  ],
  [
    { text: "    " },
    { text: "for", className: "tok-k" },
    { text: " (" },
    { text: "char", className: "tok-t" },
    { text: " c : s." },
    { text: "toCharArray", className: "tok-f" },
    { text: "()) {" },
  ],
  [
    { text: "      " },
    { text: "if", className: "tok-k" },
    { text: " (c == " },
    { text: "'('", className: "tok-s" },
    { text: ") stack." },
    { text: "push", className: "tok-f" },
    { text: "(" },
    { text: "')'", className: "tok-s" },
    { text: ");" },
  ],
  [
    { text: "      " },
    { text: "else if", className: "tok-k" },
    { text: " (c == " },
    { text: "'['", className: "tok-s" },
    { text: ") stack." },
    { text: "push", className: "tok-f" },
    { text: "(" },
    { text: "']'", className: "tok-s" },
    { text: ");" },
  ],
  [
    { text: "      " },
    { text: "else if", className: "tok-k" },
    { text: " (c == " },
    { text: "'{'", className: "tok-s" },
    { text: ") stack." },
    { text: "push", className: "tok-f" },
    { text: "(" },
    { text: "'}'", className: "tok-s" },
    { text: ");" },
  ],
  [
    { text: "      " },
    { text: "else if", className: "tok-k" },
    { text: " (stack." },
    { text: "isEmpty", className: "tok-f" },
    { text: "() || stack." },
    { text: "pop", className: "tok-f" },
    { text: "() != c)" },
  ],
  [
    { text: "        " },
    { text: "return", className: "tok-k" },
    { text: " " },
    { text: "false", className: "tok-n" },
    { text: ";" },
  ],
  [{ text: "    }" }],
  [
    { text: "    " },
    { text: "return", className: "tok-k" },
    { text: " stack." },
    { text: "isEmpty", className: "tok-f" },
    { text: "();" },
  ],
  [{ text: "  }" }],
  [{ text: "}" }],
];
