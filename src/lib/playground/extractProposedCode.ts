/** Pull the first fenced code block from a GuruBot reply. Returns null if empty. */
export function extractProposedCode(text: string): string | null {
  if (!text?.trim()) return null;
  const fenced = text.match(/```(?:[\w+.#-]*)\r?\n([\s\S]*?)```/);
  const body = (fenced?.[1] ?? "").replace(/\r\n/g, "\n").trim();
  return body.length > 0 ? body : null;
}

export function isValidProposedCode(code: string | null | undefined): code is string {
  if (!code) return false;
  const trimmed = code.trim();
  if (trimmed.length < 2) return false;
  if (/^(undefined|null|n\/a)$/i.test(trimmed)) return false;
  return true;
}
