/**
 * Lightweight Java symbol extraction for outline, go-to-definition, and
 * user-symbol completions. Intentionally regex-based and conservative —
 * not a substitute for a Java language server.
 */

export type JavaSymbolKind =
  | "class"
  | "interface"
  | "enum"
  | "method"
  | "variable"
  | "parameter"
  | "constant";

export interface JavaSymbol {
  name: string;
  kind: JavaSymbolKind;
  line: number;
  column: number;
  detail?: string;
}

export const JAVA_RESERVED = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "var",
  "record",
  "sealed",
  "permits",
  "yield",
  "true",
  "false",
  "null",
  "String",
  "System",
  "Math",
  "Integer",
  "Long",
  "Double",
  "Boolean",
  "Character",
  "Object",
  "Arrays",
  "Collections",
  "List",
  "Map",
  "Set",
  "HashMap",
  "ArrayList",
  "LinkedList",
  "TreeMap",
  "HashSet",
  "TreeSet",
  "Queue",
  "Stack",
  "Deque",
  "PriorityQueue",
  "Scanner",
  "StringBuilder",
  "BufferedReader",
  "InputStreamReader",
  "PrintWriter",
  "main",
  "args",
  "out",
  "in",
  "err",
]);

const TYPE_KEYWORDS = new Set([
  "class",
  "interface",
  "enum",
  "return",
  "throw",
  "new",
  "import",
  "package",
]);

export function parseJavaSymbols(source: string): JavaSymbol[] {
  const symbols: JavaSymbol[] = [];
  const seen = new Map<string, JavaSymbolKind>();
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*")
    ) {
      continue;
    }

    const classMatch = trimmed.match(/(class|interface|enum)\s+(\w+)/);
    if (classMatch && !JAVA_RESERVED.has(classMatch[2])) {
      pushSymbol(symbols, seen, {
        name: classMatch[2],
        kind: classMatch[1] as JavaSymbolKind,
        line: i + 1,
        column: Math.max(1, raw.indexOf(classMatch[2]) + 1),
        detail: classMatch[1],
      });
    }

    const methodMatch = trimmed.match(
      /(?:(?:public|private|protected|static|final|abstract|synchronized)\s+)*(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*\(/,
    );
    if (
      methodMatch &&
      !JAVA_RESERVED.has(methodMatch[1]) &&
      !["if", "for", "while", "switch", "catch"].includes(methodMatch[1])
    ) {
      pushSymbol(symbols, seen, {
        name: methodMatch[1],
        kind: "method",
        line: i + 1,
        column: Math.max(1, raw.indexOf(methodMatch[1]) + 1),
        detail: "method",
      });
    }

    const varMatches = trimmed.matchAll(
      /(?:(?:final)\s+)?(\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=;,)]/g,
    );
    for (const m of varMatches) {
      const typePart = m[1];
      const varName = m[2];
      if (
        JAVA_RESERVED.has(varName) ||
        JAVA_RESERVED.has(typePart) ||
        TYPE_KEYWORDS.has(typePart)
      ) {
        continue;
      }
      pushSymbol(symbols, seen, {
        name: varName,
        kind: "variable",
        line: i + 1,
        column: Math.max(1, raw.indexOf(varName) + 1),
        detail: typePart,
      });
    }

    const varDecl = trimmed.match(/(?:final\s+)?var\s+(\w+)\s*=/);
    if (varDecl && !JAVA_RESERVED.has(varDecl[1])) {
      pushSymbol(symbols, seen, {
        name: varDecl[1],
        kind: "variable",
        line: i + 1,
        column: Math.max(1, raw.indexOf(varDecl[1]) + 1),
        detail: "var",
      });
    }

    const forMatch = trimmed.match(
      /for\s*\(\s*(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)\s*[=:]/,
    );
    if (forMatch && !JAVA_RESERVED.has(forMatch[1])) {
      pushSymbol(symbols, seen, {
        name: forMatch[1],
        kind: "variable",
        line: i + 1,
        column: Math.max(1, raw.indexOf(forMatch[1]) + 1),
        detail: "loop variable",
      });
    }

    const paramSigMatch = trimmed.match(
      /\w+\s*\(([^)]+)\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{?/,
    );
    if (paramSigMatch) {
      const params = paramSigMatch[1].split(",");
      for (const p of params) {
        const pm = p
          .trim()
          .match(/(?:final\s+)?(?:\w+(?:<[^>]*>)?(?:\[\])*)\s+(\w+)$/);
        if (pm && !JAVA_RESERVED.has(pm[1])) {
          pushSymbol(symbols, seen, {
            name: pm[1],
            kind: "parameter",
            line: i + 1,
            column: Math.max(1, raw.indexOf(pm[1]) + 1),
            detail: "parameter",
          });
        }
      }
    }

    const constMatch = trimmed.match(
      /static\s+final\s+\w+(?:<[^>]*>)?\s+(\w+)\s*=/,
    );
    if (constMatch && !JAVA_RESERVED.has(constMatch[1])) {
      pushSymbol(symbols, seen, {
        name: constMatch[1],
        kind: "constant",
        line: i + 1,
        column: Math.max(1, raw.indexOf(constMatch[1]) + 1),
        detail: "constant",
      });
    }
  }

  return symbols;
}

function pushSymbol(
  symbols: JavaSymbol[],
  seen: Map<string, JavaSymbolKind>,
  symbol: JavaSymbol,
) {
  const existing = seen.get(symbol.name);
  if (existing === "method" && symbol.kind !== "method") return;
  if (existing === "class" || existing === "interface" || existing === "enum") {
    if (symbol.kind !== existing) return;
  }
  if (!existing) seen.set(symbol.name, symbol.kind);
  symbols.push(symbol);
}

/** Safe subset for Python / C++ outline — functions and classes only. */
export function parseSimpleOutline(
  source: string,
  language: string,
): JavaSymbol[] {
  if (language === "java") return parseJavaSymbols(source);

  const symbols: JavaSymbol[] = [];
  const lines = source.split("\n");

  if (language === "python" || language === "py") {
    for (let i = 0; i < lines.length; i++) {
      const classMatch = lines[i].match(/^\s*class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          line: i + 1,
          column: lines[i].indexOf(classMatch[1]) + 1,
        });
      }
      const fnMatch = lines[i].match(/^\s*def\s+(\w+)\s*\(/);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: "method",
          line: i + 1,
          column: lines[i].indexOf(fnMatch[1]) + 1,
        });
      }
    }
    return symbols;
  }

  if (language === "c++" || language === "cpp") {
    for (let i = 0; i < lines.length; i++) {
      const classMatch = lines[i].match(/^\s*(?:class|struct)\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          line: i + 1,
          column: lines[i].indexOf(classMatch[1]) + 1,
        });
      }
      const fnMatch = lines[i].match(
        /^\s*(?:[\w:<>,\s*&]+)\s+(\w+)\s*\([^;]*\)\s*(?:const)?\s*\{?\s*$/,
      );
      if (fnMatch && !["if", "for", "while", "switch", "catch"].includes(fnMatch[1])) {
        symbols.push({
          name: fnMatch[1],
          kind: "method",
          line: i + 1,
          column: lines[i].indexOf(fnMatch[1]) + 1,
        });
      }
    }
  }

  return symbols;
}
