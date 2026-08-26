export type DiagnosticSeverity = "error" | "warning" | "info";

export interface CompilerDiagnostic {
  fileName?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  message: string;
  raw: string;
}

const WANDBOX_PREFIX = /^prog\.(?:java|cpp|cc|c|py|txt):/i;

/**
 * Parse Wandbox / javac / g++ / CPython compiler text into Monaco-ready
 * diagnostics. Returns only rows that include a real line number — never
 * invents locations from unstructured text.
 */
export function parseCompilerDiagnostics(text: string): CompilerDiagnostic[] {
  if (!text?.trim()) return [];

  const diagnostics: CompilerDiagnostic[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed =
      parseJavacStyle(trimmed) ||
      parseGnuStyle(trimmed) ||
      parsePythonStyle(trimmed, lines, i);

    if (!parsed) continue;
    if (parsed.line < 1) continue;

    diagnostics.push(parsed);
  }

  return dedupeDiagnostics(diagnostics);
}

function parseJavacStyle(line: string): CompilerDiagnostic | null {
  // prog.java:12: error: cannot find symbol
  // Main.java:12:13: error: ...
  const match = line.match(
    /^(?:(?:\/?[^\s:]+\/)?([^\s:]+):)?(\d+)(?::(\d+))?:\s*(error|warning|note|info)\s*:\s*(.+)$/i,
  );
  if (!match) return null;

  return {
    fileName: sanitizeFileName(match[1]),
    line: Number(match[2]),
    column: match[3] ? Number(match[3]) : 1,
    severity: toSeverity(match[4]),
    message: match[5].trim(),
    raw: line,
  };
}

function parseGnuStyle(line: string): CompilerDiagnostic | null {
  // prog.cpp:8:5: error: 'x' was not declared in this scope
  const match = line.match(
    /^((?:\/?[^\s:]+\/)?[^\s:]+):(\d+):(\d+):\s*(fatal error|error|warning|note)\s*:\s*(.+)$/i,
  );
  if (!match) return null;

  return {
    fileName: sanitizeFileName(match[1]),
    line: Number(match[2]),
    column: Number(match[3]),
    severity: toSeverity(match[4]),
    message: match[5].trim(),
    raw: line,
  };
}

function parsePythonStyle(
  line: string,
  allLines: string[],
  index: number,
): CompilerDiagnostic | null {
  // File "prog.py", line 4
  const fileMatch = line.match(/^File "([^"]+)", line (\d+)(?:, in .+)?$/i);
  if (!fileMatch) return null;

  let message = "";
  for (let j = index + 1; j < Math.min(index + 6, allLines.length); j++) {
    const candidate = allLines[j].trim();
    if (
      /^(SyntaxError|NameError|TypeError|ValueError|IndexError|KeyError|AttributeError|ZeroDivisionError|IndentationError|TabError|RuntimeError|Exception|Error):/.test(
        candidate,
      )
    ) {
      message = candidate;
      break;
    }
  }
  if (!message) return null;

  return {
    fileName: sanitizeFileName(fileMatch[1]),
    line: Number(fileMatch[2]),
    column: 1,
    severity: "error",
    message,
    raw: `${line}\n${message}`,
  };
}

function toSeverity(value: string): DiagnosticSeverity {
  const lower = value.toLowerCase();
  if (lower.includes("error")) return "error";
  if (lower.includes("warning")) return "warning";
  return "info";
}

function sanitizeFileName(name?: string): string | undefined {
  if (!name) return undefined;
  const cleaned = name.replace(WANDBOX_PREFIX, "").replace(/^prog\./, "");
  return cleaned || undefined;
}

function dedupeDiagnostics(items: CompilerDiagnostic[]): CompilerDiagnostic[] {
  const seen = new Set<string>();
  const out: CompilerDiagnostic[] = [];
  for (const item of items) {
    const key = `${item.line}:${item.column}:${item.severity}:${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function monacoSeverity(monaco: any, severity: DiagnosticSeverity) {
  const MarkerSeverity = monaco.MarkerSeverity;
  if (severity === "error") return MarkerSeverity.Error;
  if (severity === "warning") return MarkerSeverity.Warning;
  return MarkerSeverity.Info;
}
