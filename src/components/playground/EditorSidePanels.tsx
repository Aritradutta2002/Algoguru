import { AlertCircle, Bug } from "lucide-react";
import type { CompilerDiagnostic } from "@/lib/playground/compilerDiagnostics";
import type { DebugFrame } from "@/lib/playground/debugTrace";
import type { JavaSymbol } from "@/lib/playground/javaSymbols";

export function ProblemsList({
  diagnostics,
  onJump,
}: {
  diagnostics: CompilerDiagnostic[];
  onJump: (line: number, column: number) => void;
}) {
  if (!diagnostics.length) {
    return (
      <p className="px-4 py-6 text-[12px]" style={{ color: "var(--lc-faint)" }}>
        No compiler diagnostics. Console output remains the source of truth.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5 p-2">
      {diagnostics.map((d, i) => (
        <li key={`${d.line}:${d.column}:${i}`}>
          <button
            type="button"
            onClick={() => onJump(d.line, d.column)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[12px] lc-hover"
            style={{ color: "var(--lc-text)" }}
          >
            <AlertCircle
              size={13}
              className="mt-0.5 flex-shrink-0"
              style={{ color: d.severity === "warning" ? "var(--lc-yellow)" : "var(--lc-red)" }}
            />
            <span>
              <span className="font-mono text-[11px]" style={{ color: "var(--lc-muted)" }}>
                Ln {d.line}:{d.column}
              </span>{" "}
              {d.message}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function DebuggerPanel({
  frames,
  breakpointCount,
  onJump,
}: {
  frames: DebugFrame[];
  breakpointCount: number;
  onJump: (line: number) => void;
}) {
  const latest = frames[frames.length - 1];
  const vars = latest?.variables ?? [];

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--lc-muted)" }}>
        <Bug size={13} />
        {breakpointCount} breakpoint{breakpointCount === 1 ? "" : "s"}
        {latest ? ` · last hit L${latest.line}` : ""}
      </div>
      {!frames.length ? (
        <p className="text-[12px]" style={{ color: "var(--lc-faint)" }}>
          Run Debug after setting breakpoints to inspect variables.
        </p>
      ) : vars.length === 0 ? (
        <p className="text-[12px]" style={{ color: "var(--lc-faint)" }}>
          Breakpoint reached; no locals were captured on the last hit.
        </p>
      ) : (
        <table className="w-full text-left font-mono text-[12px]">
          <thead>
            <tr style={{ color: "var(--lc-faint)" }}>
              <th className="pb-1 font-medium">Name</th>
              <th className="pb-1 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v) => (
              <tr key={v.name}>
                <td className="py-0.5 pr-3" style={{ color: "var(--lc-accent)" }}>
                  {v.name}
                </td>
                <td className="py-0.5 break-all" style={{ color: "var(--lc-text)" }}>
                  {v.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {frames.length > 1 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--lc-muted)" }}>
            Hits
          </p>
          {frames.map((f, i) => (
            <button
              key={`${f.line}-${i}`}
              type="button"
              onClick={() => onJump(f.line)}
              className="block w-full rounded px-2 py-1 text-left font-mono text-[11px] lc-hover"
              style={{ color: "var(--lc-muted)" }}
            >
              L{f.line}
              {f.reached ? " reached" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentOutline({
  symbols,
  onJump,
}: {
  symbols: JavaSymbol[];
  onJump: (line: number, column: number) => void;
}) {
  if (!symbols.length) {
    return (
      <p className="px-4 py-6 text-[12px]" style={{ color: "var(--lc-faint)" }}>
        No outline symbols yet. Conservative regex parsing only — not a language server.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5 p-2">
      {symbols.map((s, i) => (
        <li key={`${s.kind}-${s.name}-${s.line}-${i}`}>
          <button
            type="button"
            onClick={() => onJump(s.line, s.column)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] lc-hover"
            style={{ color: "var(--lc-text)" }}
          >
            <span className="w-16 flex-shrink-0 font-mono text-[10px] uppercase" style={{ color: "var(--lc-faint)" }}>
              {s.kind}
            </span>
            <span className="truncate">{s.name}</span>
            <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--lc-faint)" }}>
              {s.line}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
