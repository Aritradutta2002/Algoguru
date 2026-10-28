import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeChatMarkdown } from "@/lib/normalizeChatMarkdown";
import { GuruCodeBlock } from "./GuruCodeBlock";

interface GuruMarkdownProps {
  content: string;
  onInsertCode?: (code: string) => void;
  /** Shown when the model produced no prose yet. */
  fallback?: React.ReactNode;
}

/**
 * Markdown renderer for Guru replies.
 *
 * Memoised because a streaming reply re-renders the transcript many times a
 * second; only the message that actually changed should re-parse.
 *
 * GFM for tables/strikethrough, KaTeX for the maths an algorithms tutor needs.
 * Raw HTML is intentionally *not* enabled — model output stays text + maths.
 */
export const GuruMarkdown = memo(function GuruMarkdown({
  content,
  onInsertCode,
  fallback = null,
}: GuruMarkdownProps) {
  if (!content.trim()) return <>{fallback}</>;

  const components: Components = {
    h1: ({ children }) => (
      <h3 className="mb-2 mt-4 text-[15px] font-semibold tracking-tight text-guru-text first:mt-0">
        {children}
      </h3>
    ),
    h2: ({ children }) => (
      <h3 className="mb-2 mt-4 text-[14.5px] font-semibold tracking-tight text-guru-text first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mb-1.5 mt-3.5 text-[13.5px] font-semibold tracking-tight text-guru-text first:mt-0">
        {children}
      </h4>
    ),
    h4: ({ children }) => (
      <h5 className="mb-1.5 mt-3 text-[13px] font-semibold text-guru-text first:mt-0">
        {children}
      </h5>
    ),
    p: ({ children }) => (
      <p className="my-2 text-[13.5px] leading-[1.7] text-guru-text/90 first:mt-0 last:mb-0">
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-guru-text">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-guru-text/95">{children}</em>,
    del: ({ children }) => <del className="text-guru-muted">{children}</del>,
    ul: ({ children }) => (
      <ul className="my-2 list-disc space-y-1 pl-5 text-[13.5px] leading-[1.7] text-guru-text/90 marker:text-guru-muted/70">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-2 list-decimal space-y-1 pl-5 text-[13.5px] leading-[1.7] text-guru-text/90 marker:text-guru-muted/70">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-0.5">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-guru-accent/50 bg-guru-accent/[0.07] py-1 pl-3 pr-2 text-[13px] text-guru-text/85 [&>p]:my-1">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-guru-line/70" />,
    a: ({ href, children }) => {
      const external = Boolean(href && /^https?:/i.test(href));
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer nofollow" : undefined}
          className="font-medium text-guru-accent underline decoration-guru-accent/35 underline-offset-2 transition-colors hover:text-guru-accent-2 hover:decoration-guru-accent-2/60"
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => (
      <img
        src={typeof src === "string" ? src : undefined}
        alt={alt ?? ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="my-3 max-h-80 rounded-lg border border-guru-line/70 object-contain"
      />
    ),
    table: ({ children }) => (
      <div className="my-3 w-full overflow-x-auto rounded-lg border border-guru-line/80">
        <table className="w-full min-w-[420px] border-collapse text-left text-[12.5px] leading-relaxed">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-guru-raised/70 text-guru-text">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-guru-line/60">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-guru-text/[0.03]">{children}</tr>,
    th: ({ children }) => (
      <th className="border-b border-guru-line/70 px-3 py-2 align-top text-[11.5px] font-semibold uppercase tracking-wide text-guru-muted">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 align-top text-guru-text/85">{children}</td>
    ),
    code: ({ className, children, ...props }) => {
      const text = String(children);
      const language = className?.replace("language-", "");
      const isBlock = Boolean(language) || text.includes("\n");

      if (isBlock) {
        return (
          <GuruCodeBlock
            code={text.replace(/\n$/, "")}
            language={language}
            onInsert={onInsertCode}
          />
        );
      }

      return (
        <code
          className="rounded border border-guru-line/70 bg-guru-text/[0.05] px-1.5 py-0.5 font-mono text-[12px] text-guru-text/90"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
  };

  return (
    <div className="guru-markdown max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {normalizeChatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
});
