import { useState, useRef, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Send, Trash2, Copy, Check, PanelRightClose, Bot, ChevronDown, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guru-chat`;

interface ModelOption {
  key: string;
  label: string;
  tag: string;
}

const MODELS: ModelOption[] = [
  { key: "nemotron", label: "Nemotron 120B", tag: "NVIDIA" },
  { key: "deepseek", label: "DeepSeek V3.2", tag: "DeepSeek" },
  { key: "qwen", label: "Qwen 3.5 397B", tag: "Alibaba" },
  { key: "kimi", label: "Kimi K2.5", tag: "Moonshot" },
  { key: "minimax", label: "MiniMax M2.7", tag: "MiniMax" },
  { key: "glm", label: "GLM-5", tag: "Zhipu" },
];

// ── Streaming helper ────────────────────────────────────────────────
async function streamChat({
  messages, model, onDelta, onDone, signal,
}: {
  messages: Msg[]; model: string;
  onDelta: (text: string) => void; onDone: () => void; signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, model }),
    signal,
  });
  if (!resp.ok || !resp.body) {
    const err = await resp.text();
    throw new Error(err || "Stream failed");
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

// ── Code Block ──────────────────────────────────────────────────────
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "code";

  return (
    <div className="my-2.5 rounded-lg overflow-hidden" style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border)/0.5)" }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "hsl(var(--muted)/0.4)", borderBottom: "1px solid hsl(var(--border)/0.4)" }}>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{lang}</span>
        <button
          onClick={async () => { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all"
          style={{ color: copied ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.7)", background: copied ? "hsl(var(--primary)/0.1)" : "transparent" }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 text-[11.5px] leading-[1.75] font-mono" style={{ color: "hsl(var(--foreground))" }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ── Model Selector ──────────────────────────────────────────────────
function ModelSelector({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const current = MODELS.find((m) => m.key === selected) || MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node) && dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(rect.right - 220, 8) });
    }
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
        style={{ color: "hsl(var(--foreground)/0.8)", background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border)/0.5)" }}
      >
        <span className="truncate max-w-[90px]">{current.label}</span>
        <ChevronDown size={11} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed w-[220px] rounded-lg overflow-hidden border shadow-2xl"
          style={{ top: pos.top, left: pos.left, zIndex: 9999, background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground)/0.5)", borderBottom: "1px solid hsl(var(--border)/0.4)" }}>
            Select Model
          </div>
          {MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => { onSelect(m.key); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/40"
              style={{ background: m.key === selected ? "hsl(var(--primary)/0.08)" : "transparent" }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.key === selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)" }} />
              <div className="flex-1 min-w-0">
                <span className="text-[11.5px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>{m.label}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: "hsl(var(--muted-foreground)/0.6)", background: "hsl(var(--muted)/0.5)" }}>{m.tag}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────
interface GuruBotProps { open: boolean; onClose: () => void; }

export const GuruBot = forwardRef<HTMLDivElement, GuruBotProps>(function GuruBot({ open, onClose }, ref) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("nemotron");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat({ messages: [...messages, userMsg], model, onDelta: upsert, onDone: () => setLoading(false), signal: controller.signal });
    } catch (e: any) {
      if (e.name !== "AbortError") setMessages((p) => [...p, { role: "assistant", content: "⚠️ Error connecting to Guru. Please try again." }]);
      setLoading(false);
    }
  };

  const clearChat = () => { abortRef.current?.abort(); setMessages([]); setLoading(false); };
  const handleClose = () => { abortRef.current?.abort(); onClose(); };

  if (!open) return null;

  return (
    <div ref={ref} className="flex h-full flex-col overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* ─── Header ─── */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary)/0.1)" }}>
          <Bot size={13} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: "hsl(var(--foreground))" }}>Guru</span>
        <div className="flex-1" />
        <ModelSelector selected={model} onSelect={setModel} />
        <button onClick={clearChat} className="p-1 rounded-md transition-colors hover:bg-muted" title="Clear chat" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>
          <RotateCcw size={13} />
        </button>
        <button onClick={handleClose} className="p-1 rounded-md transition-colors hover:bg-muted" title="Close" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ overscrollBehavior: "contain" }}>
        <div className="px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary)/0.08)" }}>
                <Bot size={24} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <div className="text-[13px] font-bold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>Guru Assistant</div>
                <div className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  DSA · Java · SQL · Competitive Programming
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {["Explain BFS vs DFS", "What is AlgoGuru?", "Merge sort code"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-[10px] font-medium px-2.5 py-1.5 rounded-md transition-all hover:bg-muted"
                    style={{ color: "hsl(var(--foreground)/0.7)", background: "hsl(var(--muted)/0.4)", border: "1px solid hsl(var(--border)/0.5)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(var(--primary)/0.1)" }}>
                  <Bot size={11} style={{ color: "hsl(var(--primary))" }} />
                </div>
              )}
              <div className="max-w-[88%] min-w-0" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                {m.role === "assistant" ? (
                  <div className="text-[12.5px] leading-[1.75]" style={{ color: "hsl(var(--foreground))" }}>
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      [&_pre]:p-0 [&_pre]:bg-transparent [&_pre]:m-0
                      [&_code]:text-[10.5px]
                      [&_p]:m-0 [&_p]:mb-1.5 [&_p]:leading-[1.75]
                      [&_ul]:m-0 [&_ul]:mb-1.5 [&_ul]:pl-4
                      [&_ol]:m-0 [&_ol]:mb-1.5 [&_ol]:pl-4
                      [&_li]:m-0 [&_li]:mb-0.5 [&_li]:leading-[1.65]
                      [&_h1]:text-[13px] [&_h1]:font-bold [&_h1]:mb-1.5 [&_h1]:mt-3
                      [&_h2]:text-[12.5px] [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2.5
                      [&_h3]:text-[12px] [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2
                      [&_strong]:font-bold [&_strong]:text-foreground
                      [&_blockquote]:border-l-2 [&_blockquote]:border-primary/20 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
                      [&_hr]:my-3 [&_hr]:border-border/30
                      [&_table]:text-[11px] [&_table]:w-full [&_th]:text-left [&_th]:font-semibold [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1
                      overflow-hidden
                    ">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const isBlock = className?.startsWith("language-") || String(children).includes("\n");
                            if (isBlock) return <CodeBlock className={className}>{String(children).replace(/\n$/, "")}</CodeBlock>;
                            return (
                              <code
                                className="px-1 py-0.5 rounded text-[10.5px] font-mono font-semibold"
                                style={{ background: "hsl(var(--muted)/0.6)", color: "hsl(var(--primary))" }}
                                {...props}
                              >{children}</code>
                            );
                          },
                          pre({ children }) { return <>{children}</>; },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-3 py-2 text-[12.5px] leading-[1.65]"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(var(--primary)/0.1)" }}>
                <Bot size={11} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex gap-1 pt-2">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--primary)/0.5)", animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--primary)/0.5)", animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--primary)/0.5)", animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ─── Input ─── */}
      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: "hsl(var(--border))" }}>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border)/0.5)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Guru anything..."
            disabled={loading}
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            style={{ color: "hsl(var(--foreground))" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-md transition-all disabled:opacity-20"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Send size={12} />
          </button>
        </div>
        <div className="text-center mt-1.5">
          <span className="text-[9px] font-medium" style={{ color: "hsl(var(--muted-foreground)/0.4)" }}>
            Powered by AlgoGuru · Built by Aritra
          </span>
        </div>
      </div>
    </div>
  );
});

GuruBot.displayName = "GuruBot";
