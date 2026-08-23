import { useState, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  title?: string;
  language?: string;
  code: string;
}

export const CodeBlock = memo(function CodeBlock({ title, language = "python", code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language.toLowerCase();

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#2e2e2e] bg-[#1a1a1a]">
      {/* Header — LeetCode / NeetCode style: minimal, no traffic lights */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#232323] border-b border-[#2e2e2e]">
        <div className="flex items-center gap-2 min-w-0">
          {title ? (
            <span className="text-[13px] font-semibold text-zinc-300 tracking-tight truncate">{title}</span>
          ) : null}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide uppercase bg-[#2d2d2d] text-zinc-400 border border-[#3a3a3a]">
            {displayLang}
          </span>
        </div>

        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
            copied
              ? "bg-[#1f3a2a] text-emerald-400"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
          }`}
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code body — dark LeetCode style */}
      <div className="relative bg-[#1a1a1a] overflow-x-auto">
        <SyntaxHighlighter
          language={displayLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            background: "#1a1a1a",
            backgroundColor: "#1a1a1a",
            fontSize: "13.5px",
            lineHeight: "1.65",
            fontFamily: "'JetBrains Mono','Fira Code',Consolas,Menlo,monospace",
            borderRadius: 0,
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono','Fira Code',Consolas,Menlo,monospace",
              fontSize: "13.5px",
              lineHeight: "1.65",
              background: "transparent",
            },
          }}
          showLineNumbers
          lineNumberStyle={{
            color: "#5a5f69",
            fontSize: "12px",
            paddingRight: "1rem",
            minWidth: "2.5rem",
            textAlign: "right",
            userSelect: "none",
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 400,
            borderRight: "1px solid #2e2e2e",
            marginRight: "1rem",
          }}
          wrapLines={false}
          wrapLongLines={false}
          PreTag="div"
        >
          {code.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
