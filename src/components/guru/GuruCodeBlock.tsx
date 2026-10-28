import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, ArrowRight } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const LANGUAGE_LABEL: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  sh: "shell",
  bash: "bash",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  text: "text",
};

/**
 * A fenced code block in a Guru reply.
 *
 * Syntax colours and the surrounding surface follow the same app theme as
 * the rest of Guru, while keeping code visually distinct from prose.
 */
export const GuruCodeBlock = memo(function GuruCodeBlock({
  code,
  language,
  onInsert,
}: {
  code: string;
  language?: string;
  onInsert?: (code: string) => void;
}) {
  const { theme } = useSettings();
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const insertTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (insertTimer.current) window.clearTimeout(insertTimer.current);
    },
    [],
  );

  const rawLanguage = (language || "text").toLowerCase();
  const label = LANGUAGE_LABEL[rawLanguage] ?? rawLanguage;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied — leave the affordance in its resting state.
    }
  }, [code]);

  return (
    <div
      data-theme={theme}
      className="my-3 overflow-hidden rounded-xl border border-guru-line/80 bg-guru-code"
    >
      <div className="flex items-center justify-between gap-2 border-b border-guru-line/70 bg-guru-raised/60 px-3 py-1.5">
        <span className="rounded border border-guru-line/70 bg-guru-text/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-guru-muted">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {onInsert && (
            <button
              type="button"
              onClick={() => {
                onInsert(code);
                setInserted(true);
                if (insertTimer.current) window.clearTimeout(insertTimer.current);
                insertTimer.current = window.setTimeout(() => setInserted(false), 1800);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                inserted
                  ? "bg-guru-success/15 text-guru-success"
                  : "text-guru-muted hover:bg-guru-text/[0.07] hover:text-guru-text",
              )}
              title="Insert into the editor"
            >
              {inserted ? <Check size={12} /> : <ArrowRight size={12} />}
              {inserted ? "Inserted" : "Use in editor"}
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              copied
                ? "bg-guru-success/15 text-guru-success"
                : "text-guru-muted hover:bg-guru-text/[0.07] hover:text-guru-text",
            )}
            title="Copy code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto" style={{ touchAction: "pan-x" }}>
        <SyntaxHighlighter
          language={label}
          style={theme === "dark" ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            border: "none",
            background: "hsl(var(--guru-code))",
            padding: "0.85rem 1rem",
            fontSize: "12.5px",
            lineHeight: "1.65",
            overflow: "visible",
          }}
          codeTagProps={{
            style: {
              background: "transparent",
              fontFamily: '"JetBrains Mono","Fira Code",Consolas,Menlo,monospace',
              fontSize: "12.5px",
              lineHeight: "1.65",
            },
          }}
          wrapLongLines={false}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
