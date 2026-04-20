import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface CodeBlockProps {
  title?: string;
  language?: string;
  code: string;
}

export function CodeBlock({ title, language = "java", code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useSettings();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper my-7" style={{ touchAction: 'pan-x pan-y' }}>
      <div className="code-block-header" style={{ background: "#21222c" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55% / 0.7)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "hsl(45 80% 55% / 0.7)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "hsl(130 60% 45% / 0.7)" }} />
          </div>
          <Code2 size={14} style={{ color: "hsl(var(--primary))" }} />
          {title && (
            <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {title}
            </span>
          )}
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md"
            style={{ background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.12)" }}>
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="touch-manipulation flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 min-h-[36px] rounded-lg transition-all duration-200 active:scale-95"
          style={{
            background: copied ? "hsl(var(--success)/0.1)" : "hsl(var(--muted))",
            color: copied ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
            border: `1px solid ${copied ? "hsl(var(--success)/0.2)" : "hsl(var(--border))"}`,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div style={{ touchAction: 'pan-x', overflowX: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1.5rem 1.75rem",
            background: "#282a36",
            fontSize: "0.85rem",
            lineHeight: "1.75",
            borderRadius: 0,
            fontFamily: "'Roboto Mono', 'JetBrains Mono', 'Fira Code', monospace",
          }}
          showLineNumbers
          lineNumberStyle={{
            color: "hsl(var(--muted-foreground)/0.25)",
            fontSize: "0.7rem",
            paddingRight: "1.5rem",
            minWidth: "2.5rem",
            userSelect: "none",
          }}
        >
          {code.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
