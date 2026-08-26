export interface DebugVariable {
  name: string;
  value: string;
}

export interface DebugFrame {
  line: number;
  variables: DebugVariable[];
  reached: boolean;
  raw: string;
}

const DEBUG_LINE = /\[DEBUG L(\d+)\](.*)$/;

export function parseDebugTrace(output: string): DebugFrame[] {
  if (!output) return [];
  const frames: DebugFrame[] = [];

  for (const line of output.replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(DEBUG_LINE);
    if (!match) continue;
    const rest = match[2].trim();
    const reached = rest === "(reached)" || rest.length === 0;
    frames.push({
      line: Number(match[1]),
      reached,
      raw: line,
      variables: reached ? [] : parseDebugVariables(rest),
    });
  }

  return frames;
}

function parseDebugVariables(rest: string): DebugVariable[] {
  // Instrumented format: ` name=value name2=value2`
  const vars: DebugVariable[] = [];
  const parts = rest.trim().split(/(?<=\S)\s+(?=[A-Za-z_]\w*=)/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    vars.push({
      name: part.slice(0, eq).trim(),
      value: part.slice(eq + 1).trim(),
    });
  }
  return vars;
}
