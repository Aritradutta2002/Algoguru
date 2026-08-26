import { DiffEditor } from "@monaco-editor/react";

export function AiEditPreview({
  original,
  modified,
  language,
  theme,
  onAccept,
  onReject,
}: {
  original: string;
  modified: string;
  language: string;
  theme: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[52%] min-h-[220px] flex-col"
      style={{
        background: "var(--lc-panel)",
        borderTop: "1px solid var(--lc-border)",
      }}
      role="dialog"
      aria-label="Proposed GuruBot edit"
    >
      <div
        className="flex flex-shrink-0 items-center justify-between gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid var(--lc-border-soft)" }}
      >
        <p className="text-[12px] font-medium" style={{ color: "var(--lc-text)" }}>
          Proposed edit — review before applying
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onReject} className="lc-pill lc-pill-muted !py-1 !text-[12px]">
            Reject
          </button>
          <button type="button" onClick={onAccept} className="lc-pill lc-pill-green !py-1 !text-[12px]">
            Accept
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <DiffEditor
          original={original}
          modified={modified}
          language={language === "c++" ? "cpp" : language}
          theme={theme}
          options={{
            readOnly: true,
            renderSideBySide: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}
        />
      </div>
    </div>
  );
}
