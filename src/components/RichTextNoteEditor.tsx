import { useRef } from "react";
import { Bold, Italic, Underline, Heading2, List, ListOrdered, Code } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

interface RichTextNoteEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}

function wrapSelection(textarea: HTMLTextAreaElement, prefix: string, suffix: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  // If already wrapped, unwrap
  if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length > prefix.length + suffix.length) {
    const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
    return before + unwrapped + after;
  }
  return before + prefix + (selected || "text") + suffix + after;
}

function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const start = textarea.selectionStart;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(start);
  return before + text + after;
}

export default function RichTextNoteEditor({
  value,
  onChange,
  placeholder = "Write your notes here... Use **bold**, *italic*, __underline__, # heading, - list",
  rows = 8,
  autoFocus = false,
}: RichTextNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const newValue = wrapSelection(textarea, prefix, suffix);
    const cursorPos = textarea.selectionStart + prefix.length;
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos + (newValue.length - value.length > prefix.length + suffix.length ? 0 : 4));
    });
  };

  const applyInsert = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const newValue = insertAtCursor(textarea, text);
    const cursorPos = textarea.selectionStart + text.length;
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const toolbarBtnClass =
    "p-1.5 hover:bg-muted rounded transition-colors border border-transparent hover:border-border";

  return (
    <div className="border-2 border-border bg-background" style={{ boxShadow: "inset 2px 2px 0px 0px hsl(var(--border))" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap" style={{ background: "hsl(var(--muted)/0.2)" }}>
        <AppTooltip content="Bold (Ctrl+B)">
          <button
            type="button"
            onClick={() => applyFormat("**", "**")}
            className={toolbarBtnClass}
            aria-label="Bold"
          >
            <Bold size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <AppTooltip content="Italic (Ctrl+I)">
          <button
            type="button"
            onClick={() => applyFormat("*", "*")}
            className={toolbarBtnClass}
            aria-label="Italic"
          >
            <Italic size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <AppTooltip content="Underline">
          <button
            type="button"
            onClick={() => applyFormat("__", "__")}
            className={toolbarBtnClass}
            aria-label="Underline"
          >
            <Underline size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <div className="w-px h-4 mx-1" style={{ background: "hsl(var(--border))" }} />
        <AppTooltip content="Heading">
          <button
            type="button"
            onClick={() => applyInsert("# ")}
            className={toolbarBtnClass}
            aria-label="Heading"
          >
            <Heading2 size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <AppTooltip content="Bullet list">
          <button
            type="button"
            onClick={() => applyInsert("- ")}
            className={toolbarBtnClass}
            aria-label="Bullet list"
          >
            <List size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <AppTooltip content="Numbered list">
          <button
            type="button"
            onClick={() => applyInsert("1. ")}
            className={toolbarBtnClass}
            aria-label="Numbered list"
          >
            <ListOrdered size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <AppTooltip content="Inline code">
          <button
            type="button"
            onClick={() => applyFormat("`", "`")}
            className={toolbarBtnClass}
            aria-label="Inline code"
          >
            <Code size={13} style={{ color: "hsl(var(--foreground))" }} />
          </button>
        </AppTooltip>
        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          **bold** *italic* __underline__ `code`
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:border-primary font-mono"
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            if (e.key === "b") { e.preventDefault(); applyFormat("**", "**"); }
            if (e.key === "i") { e.preventDefault(); applyFormat("*", "*"); }
            if (e.key === "u") { e.preventDefault(); applyFormat("__", "__"); }
          }
        }}
      />
    </div>
  );
}
