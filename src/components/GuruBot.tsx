import { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Send, Copy, Check, PanelRightClose, Bot, ChevronDown, RotateCcw, MessageSquarePlus, Square, MessageSquare, Trash2, X, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Msg = { role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; messages: Msg[]; model: string; date: number };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guru-chat`;

interface ModelOption {
  key: string;
  label: string;
  tag: string;
}

const MODELS: ModelOption[] = [
  { key: "auto", label: "Auto (Fastest)", tag: "Speed" },
  { key: "nemotron", label: "Nemotron 120B", tag: "NVIDIA" },
  { key: "deepseek", label: "DeepSeek V3.2", tag: "DeepSeek" },
  { key: "qwen", label: "Qwen 3.5 397B", tag: "Alibaba" },
  { key: "kimi", label: "Kimi K2.5", tag: "Moonshot" },
  { key: "minimax", label: "MiniMax M2.7", tag: "MiniMax" },
  { key: "glm", label: "GLM 5.1", tag: "Zhipu" },
];

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

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "text";

  return (
    <div className="my-3 rounded-xl overflow-hidden border bg-[#1E1E1E] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] border-white/10">
      <div className="flex items-center justify-between px-3 py-2 bg-[#2D2D30] border-b border-[#404040]">
        <span className="text-[10.5px] font-medium font-sans uppercase tracking-[0.1em] text-white/50">{lang}</span>
        <button
          onClick={async () => { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all hover:bg-white/10 text-white/80 active:bg-white/20"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="opacity-70" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="text-[13px] leading-[1.7] font-['Fira_Code','Cascadia_Code','JetBrains_Mono',monospace]">
        <SyntaxHighlighter
          language={lang}
          style={dracula}
          customStyle={{ margin: 0, border: 'none', background: 'transparent', padding: '1rem' }}
          wrapLongLines={true}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

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
      setPos({ top: rect.bottom + 6, left: Math.max(rect.right - 230, 8) });
    }
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all shadow-sm bg-muted/60 border border-border/50 hover:bg-muted text-foreground/90"
      >
        <span className="truncate max-w-[100px]">{current.label}</span>
        <ChevronDown size={13} className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed w-[230px] rounded-xl overflow-hidden border shadow-xl bg-card animate-in fade-in zoom-in-95 duration-100"
          style={{ top: pos.top, left: pos.left, zIndex: 9999, borderColor: "hsl(var(--border))" }}
        >
          <div className="px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
            Select Intelligence Model
          </div>
          <div className="p-1">
            {MODELS.map((m) => (
              <button
                key={m.key}
                onClick={() => { onSelect(m.key); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors hover:bg-muted text-foreground hover:text-foreground"
                style={{ background: m.key === selected ? "hsl(var(--primary)/0.08)" : "transparent" }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: m.key === selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-foreground block">{m.label}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm" style={{ color: "hsl(var(--muted-foreground)/0.8)", background: "hsl(var(--muted))" }}>
                  {m.tag}
                </span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface GuruBotProps { open: boolean; onClose: () => void; }

export const GuruBot = forwardRef<HTMLDivElement, GuruBotProps>(function GuruBot({ open, onClose }, ref) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try { const saved = localStorage.getItem("guru-chat-sessions"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  
  const [currentId, setCurrentId] = useState<string | null>(() => {
    try {
      const savedId = sessionStorage.getItem("guru-chat-current-id");
      if (savedId) return savedId;
      const s = localStorage.getItem("guru-chat-sessions");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return null;
  });
  
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(() => {
    try { return localStorage.getItem("guru-chat-model") || "nemotron"; }
    catch { return "nemotron"; }
  });
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeSession = useMemo(() => sessions.find(s => s.id === currentId), [sessions, currentId]);
  const messages = activeSession?.messages || [];

  useEffect(() => { localStorage.setItem("guru-chat-sessions", JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => {
    if (currentId) sessionStorage.setItem("guru-chat-current-id", currentId);
    else sessionStorage.removeItem("guru-chat-current-id");
  }, [currentId]);
  useEffect(() => { localStorage.setItem("guru-chat-model", model); }, [model]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && !showHistory) setTimeout(() => inputRef.current?.focus(), 200); }, [open, showHistory]);

  const saveToSession = (newMessages: Msg[], curModel: string) => {
    setSessions(prev => {
      const now = Date.now();
      if (!currentId) {
        const fallbackTitle = newMessages.find(m => m.role === 'user')?.content.slice(0, 30) + '...';
        const newId = crypto.randomUUID();
        setCurrentId(newId);
        return [{ id: newId, title: fallbackTitle, messages: newMessages, model: curModel, date: now }, ...prev];
      }
      return prev.map(s => s.id === currentId ? { ...s, messages: newMessages, model: curModel, date: now } : s);
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    
    setInput("");
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    saveToSession(newMessages, model);
    setLoading(true);
    
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setSessions(prev => {
        if (!currentId) return prev;
        return prev.map(s => {
          if (s.id === currentId) {
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content: assistantSoFar };
            } else {
              msgs.push({ role: "assistant", content: assistantSoFar });
            }
            return { ...s, messages: msgs };
          }
          return s;
        });
      });
    };

    const controller = new AbortController();
    abortRef.current = controller;
    
    try {
      await streamChat({ 
        messages: newMessages, 
        model, 
        onDelta: upsert, 
        onDone: () => setLoading(false), 
        signal: controller.signal 
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...newMessages, { role: "assistant", content: "⚠️ Error connecting to Guru. Please try again." }] } : s));
      }
      setLoading(false);
    }
  };

  const stopChat = () => { abortRef.current?.abort(); setLoading(false); };
  const startNewChat = () => { setCurrentId(null); setShowHistory(false); };
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(sessions.filter(s => s.id !== id));
    if (currentId === id) setCurrentId(null);
  };
  const handleClose = () => { if (showHistory) { setShowHistory(false); return; } onClose(); };

  if (!open) return null;

  return (
    <div ref={ref} className="flex flex-col h-full bg-background font-sans relative">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background/95 backdrop-blur z-20" style={{ borderColor: 'hsl(var(--border))' }}>
        <button 
          onClick={() => setShowHistory(o => !o)} 
          className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`} 
          title="Chat History"
        >
          {showHistory ? <X size={16} /> : <History size={16} />}
        </button>
        <div className="flex items-center gap-1.5 pl-1">
          <strong className="text-[14px] font-bold text-foreground tracking-tight">Guru</strong>
        </div>
        <div className="flex-1" />
        <ModelSelector selected={model} onSelect={setModel} />
        <button onClick={startNewChat} className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted mx-1" title="New Chat">
          <MessageSquarePlus size={16} />
        </button>
        <button onClick={handleClose} className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted" title="Close">
          <PanelRightClose size={16} />
        </button>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-hidden relative bg-card/10">
        {/* Chat History Sidebar */}
        {showHistory ? (
          <div className="absolute inset-0 z-10 bg-background overflow-y-auto animate-in slide-in-from-left-2 duration-200">
            <div className="p-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-3 px-1">Recent Conversations</h3>
              <div className="space-y-1">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-[12px]">No history yet</div>
                ) : (
                  sessions.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => { setCurrentId(s.id); setShowHistory(false); setModel(s.model || 'nemotron'); }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${s.id === currentId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80 hover:text-foreground'}`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <MessageSquare size={14} className={`flex-shrink-0 ${s.id === currentId ? 'text-primary' : 'opacity-60'}`} />
                        <div className="truncate text-[13px]">{s.title}</div>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-destructive transition-opacity"
                        title="Delete Chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-5" style={{ overscrollBehavior: 'contain' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 shadow-inner">
                  <Bot size={28} className="text-primary" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-foreground mb-1 tracking-tight">Guru Assistant</div>
                  <div className="text-[12px] text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
                    DSA • Java • SQL • Competitive Programming
                  </div>
                </div>
                <div className="flex flex-col w-full max-w-[240px] gap-2 mt-4">
                  {["Explain BFS vs DFS", "What is AlgoGuru?", "Merge sort code in Java"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="text-[12px] font-medium px-4 py-2.5 rounded-xl text-left border bg-card hover:bg-muted/50 transition-all shadow-sm text-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex gap-3 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/10 border border-primary/20 shadow-sm">
                      <Bot size={14} className="text-primary" />
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                     <div className="text-[14px] leading-[1.7] text-foreground prose-sm prose-p:my-1.5 prose-pre:my-0 prose-pre:p-0 max-w-full overflow-hidden">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
                              const isBlock = className?.startsWith('language-') || String(children).includes('\n');
                              if (isBlock) return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded-md text-[13px] font-mono font-bold mx-0.5"
                                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--primary))' }}
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
                  ) : (
                    <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-[14px] leading-[1.5] font-medium shadow-sm bg-primary text-primary-foreground">
                      {m.content}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 items-start animate-in fade-in">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/10 border border-primary/20 shadow-sm">
                  <Bot size={14} className="text-primary" />
                </div>
                <div className="flex gap-1.5 pt-3 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ─── Input ─── */}
      <div className="px-3 py-3 border-t bg-background/95 backdrop-blur z-20" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-end gap-2 px-2.5 py-2 rounded-[14px] bg-muted/40 border border-border/70 focus-within:border-primary/50 focus-within:bg-muted/20 transition-all shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
               setInput(e.target.value);
               e.target.style.height = 'auto';
               e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    if (!loading) send(); 
                } 
            }}
            placeholder="Message Guru..."
            disabled={loading && !input}
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 resize-none min-h-[36px] max-h-[120px] py-1.5 pt-2 font-medium"
            rows={1}
          />
          <button
            onClick={loading ? stopChat : send}
            disabled={(!input.trim() && !loading) || (loading && !input && messages.length === 0)}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center min-w-[40px] min-h-[40px] mb-0.5 shadow-sm active:scale-95 ${loading ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary/90'}`}
            title={loading ? 'Stop generating' : 'Send message'}
          >
            {loading ? <Square fill="currentColor" size={15} className="rounded-sm" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </div>
        <div className="text-center mt-2.5">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
            Powered by AlgoGuru • AI can make mistakes
          </span>
        </div>
      </div>
    </div>
  );
});

GuruBot.displayName = 'GuruBot';
