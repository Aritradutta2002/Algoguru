/**
 * Renders simple markdown in notes to HTML.
 * Supports: **bold**, *italic*, __underline__, `code`, # heading, - list, 1. list
 */
export function renderNoteMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Inline code (must be before bold/italic to avoid conflicts)
  html = html.replace(/`([^`]+)`/g, '<code class="note-code">$1</code>');

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic *text* (but not inside <strong>)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // Underline __text__
  html = html.replace(/__([^_]+)__/g, "<u>$1</u>");

  // Process lines for headings and lists
  const lines = html.split("\n");
  const processedLines = lines.map((line) => {
    // Heading
    if (line.startsWith("# ")) {
      return `<span class="note-heading">${line.substring(2)}</span>`;
    }
    // Bullet list
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return `<span class="note-list-item">• ${line.substring(2)}</span>`;
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      return `<span class="note-list-item">${numMatch[1]}. ${line.substring(numMatch[0].length)}</span>`;
    }
    return line;
  });

  return processedLines.join("\n");
}

/**
 * Strips markdown markers from text for plain-text contexts (like PDF).
 */
export function stripNoteMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^# /gm, "")
    .replace(/^[-•] /gm, "");
}

/**
 * Parses note text into segments with formatting info for PDF rendering.
 */
export interface NoteSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
  heading: boolean;
  listItem: boolean;
}

export function parseNoteSegments(text: string): NoteSegment[] {
  const segments: NoteSegment[] = [];

  for (const line of text.split("\n")) {
    const isHeading = line.startsWith("# ");
    const isBullet = line.startsWith("- ") || line.startsWith("• ");
    const numMatch = line.match(/^(\d+)\.\s/);
    const isNumbered = !!numMatch;

    let processedLine = line;
    if (isHeading) processedLine = line.substring(2);
    if (isBullet) processedLine = line.substring(2);
    if (isNumbered) processedLine = line;

    // Split by inline formatting markers
    const parts = processedLine.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|`[^`]+`)/g);

    for (const part of parts) {
      if (!part) continue;

      if (part.startsWith("**") && part.endsWith("**")) {
        segments.push({ text: part.slice(2, -2), bold: true, italic: false, underline: false, code: false, heading: isHeading, listItem: isBullet || isNumbered });
      } else if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        segments.push({ text: part.slice(1, -1), bold: false, italic: true, underline: false, code: false, heading: isHeading, listItem: isBullet || isNumbered });
      } else if (part.startsWith("__") && part.endsWith("__")) {
        segments.push({ text: part.slice(2, -2), bold: false, italic: false, underline: true, code: false, heading: isHeading, listItem: isBullet || isNumbered });
      } else if (part.startsWith("`") && part.endsWith("`")) {
        segments.push({ text: part.slice(1, -1), bold: false, italic: false, underline: false, code: true, heading: isHeading, listItem: isBullet || isNumbered });
      } else {
        segments.push({ text: part, bold: false, italic: false, underline: false, code: false, heading: isHeading, listItem: isBullet || isNumbered });
      }
    }

    // Add newline segment
    segments.push({ text: "\n", bold: false, italic: false, underline: false, code: false, heading: false, listItem: false });
  }

  return segments;
}
