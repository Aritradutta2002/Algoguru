import { useState, useEffect, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

/**
 * Theme is read straight off <html> rather than from SettingsContext so the
 * component stays usable anywhere (embedded panels, tests) without a provider.
 */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface CodeBlockProps {
  title?: string;
  language?: string;
  code: string;
  hideHeader?: boolean;
  /**
   * "editor" keeps the original always-dark LeetCode look (default).
   * "reader" follows the active theme with a light paper surface in day
   * mode, for long-form reading surfaces.
   */
  surface?: "editor" | "reader";
}

export const CodeBlock = memo(function CodeBlock({
  title,
  language = "python",
  code,
  hideHeader = false,
  surface = "editor",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const isDark = useIsDark();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard unavailable — leave the button state unchanged.
    }
  };

  const displayLang = language.toLowerCase();
  const reader = surface === "reader";

  /* ── Editor surface: fixed dark, independent of the app theme ────── */
  if (!reader) {
    return (
      <div className={`${hideHeader ? "" : "my-6"} rounded-xl overflow-hidden border border-[#2e2e2e] bg-[#1a1a1a]`}>
        {!hideHeader && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#232323] border-b border-[#2e2e2e]">
            <div className="flex items-center gap-2 min-w-0">
              {title ? <span className="text-[13px] font-semibold text-zinc-300 tracking-tight truncate">{title}</span> : null}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono tracking-wide uppercase bg-[#2d2d2d] text-zinc-400 border border-[#3a3a3a]">
                {displayLang}
              </span>
            </div>

            <button
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy code"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                copied ? "bg-[#1f3a2a] text-emerald-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
              }`}
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}

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
  }

  /* ── Reader surface: theme-aware paper / night panel ─────────────── */
  const bg = isDark ? "hsl(222 22% 10.5%)" : "hsl(0 0% 100%)";
  const headerBg = isDark ? "hsl(222 20% 13.5%)" : "hsl(214 45% 97.5%)";
  const border = isDark ? "hsl(222 16% 22%)" : "hsl(220 14% 87%)";
  const rule = isDark ? "hsl(222 16% 24%)" : "hsl(220 14% 90%)";
  const label = isDark ? "hsl(214 22% 78%)" : "hsl(220 15% 30%)";
  const muted = isDark ? "hsl(215 16% 60%)" : "hsl(220 11% 45%)";
  const lineNo = isDark ? "hsl(215 14% 40%)" : "hsl(220 12% 68%)";

  const theme = { ...(isDark ? oneDark : oneLight) } as Record<string, React.CSSProperties>;
  // Documentation pages read better when comments are clearly a comment
  // colour rather than another foreground tone.
  theme.comment = { color: isDark ? "hsl(145 30% 55%)" : "hsl(145 45% 34%)", fontStyle: "italic" };
  theme.prolog = theme.doctype = theme.cdata = theme.comment;

  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: bg, borderColor: border }}>
      {!hideHeader && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ background: headerBg, borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {title ? (
              <span className="text-[13px] font-semibold tracking-tight truncate" style={{ color: label }}>
                {title}
              </span>
            ) : null}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold font-mono tracking-wider uppercase"
              style={{ color: muted, border: `1px solid ${rule}`, background: isDark ? "hsl(222 20% 18%)" : "hsl(0 0% 100%)" }}
            >
              {displayLang}
            </span>
          </div>

          <button
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0"
            style={{ color: copied ? "hsl(145 55% 42%)" : muted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "hsl(222 20% 20%)" : "hsl(214 40% 93%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto" style={{ background: bg }}>
        <SyntaxHighlighter
          language={displayLang}
          style={theme as never}
          customStyle={{
            margin: 0,
            padding: "1.125rem 1.25rem",
            background: bg,
            backgroundColor: bg,
            fontSize: "13.5px",
            lineHeight: "1.75",
            fontFamily: "'Source Code Pro','JetBrains Mono',Consolas,Menlo,monospace",
            borderRadius: 0,
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Source Code Pro','JetBrains Mono',Consolas,Menlo,monospace",
              fontSize: "13.5px",
              lineHeight: "1.75",
              background: "transparent",
            },
          }}
          showLineNumbers
          lineNumberStyle={{
            color: lineNo,
            fontSize: "11.5px",
            paddingRight: "1rem",
            minWidth: "2.25rem",
            textAlign: "right",
            userSelect: "none",
            fontFamily: "'Source Code Pro',monospace",
            fontWeight: 400,
            borderRight: `1px solid ${rule}`,
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
