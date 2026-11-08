import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Coffee, Zap, CreditCard, Sparkles, Shield } from "lucide-react";

const UPI_ID = import.meta.env.VITE_UPI_ID || "your-upi@id";
const RAZORPAY_URL = import.meta.env.VITE_RAZORPAY_URL || "";
const PAYPAL_URL = import.meta.env.VITE_PAYPAL_URL || "";
const BUYMEACOFFEE_URL = import.meta.env.VITE_BUYMEACOFFEE_URL || "";
const CRYPTO_ADDRESS = import.meta.env.VITE_CRYPTO_ADDRESS || "";

const AMOUNTS = [49, 99, 199, 499];

const TABS = [
  { id: "upi", label: "UPI", flag: "🇮🇳" },
  { id: "web", label: "Web", flag: "🌍" },
  { id: "crypto", label: "Crypto", flag: "₿", hidden: !CRYPTO_ADDRESS },
] as const;
type Tab = (typeof TABS)[number]["id"];

function UpiQRCode({ upiId, amount }: { upiId: string; amount: number }) {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=AlgoGuru%20Support&am=${amount}&cu=INR&tn=Support%20AlgoGuru`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=220x220&bgcolor=ffffff&color=000000&margin=10`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-3 border border-obsidian-border">
        <img src={qrApiUrl} alt="UPI QR" width={180} height={180} className="rounded-xl block" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Scan with any UPI app</p>
        <div className="flex gap-2 text-xs text-muted-foreground justify-center">
          <span>GPay</span><span>·</span><span>PhonePe</span><span>·</span><span>Paytm</span>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${copied ? "bg-obsidian-success/10 border-obsidian-success/30 text-obsidian-success" : "bg-obsidian-pane border-obsidian-border text-foreground hover:bg-white/[0.06]"}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("upi");
  const [amount, setAmount] = useState(99);
  const [custom, setCustom] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const visibleTabs = TABS.filter((t) => !("hidden" in t && t.hidden));

  const displayAmount = custom ? parseInt(custom) || amount : amount;

  useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => onCloseRef.current(), 3000);
      return () => clearTimeout(t);
    }
  }, [isPaid]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      <motion.div key="support-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          aria-describedby="support-modal-description"
          tabIndex={-1}
          initial={{ scale: 0.96, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-elevated shadow-overlay shadow-specular"
          style={{ maxHeight: "92vh" }}
        >
          <div className="relative z-10 flex items-start justify-between border-b border-obsidian-border p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-obsidian-accent/20 bg-obsidian-accent/10">
                <Heart size={16} className="text-obsidian-accent" />
              </div>
              <div>
                <h2 id="support-modal-title" className="text-base font-semibold leading-none text-foreground">Support the build</h2>
                <p id="support-modal-description" className="mt-1 text-xs text-muted-foreground">Keep AlgoGuru polished and free</p>
              </div>
            </div>
            <button ref={closeButtonRef} onClick={onClose} aria-label="Close support dialog" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-accent/50">
              <X size={16} />
            </button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex p-1 rounded-lg bg-white/[0.04] border border-obsidian-border">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id ? "bg-obsidian-pane text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span>{tab.flag}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
              <AnimatePresence mode="wait">
                {activeTab === "upi" && (
                  <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                    {isPaid ? (
                      <div className="py-10 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-obsidian-accent/10 border border-obsidian-accent/20 flex items-center justify-center text-2xl">🎉</div>
                        <h3 className="text-lg font-semibold text-foreground">Huge thanks!</h3>
                        <p className="text-sm text-muted-foreground px-6">Your support fuels new features and high-quality content.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-obsidian-accent/10 text-obsidian-accent text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-obsidian-accent animate-pulse" /> Closing…
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Select amount (₹)</span>
                            <span className="text-xs font-medium text-obsidian-accent">{displayAmount} INR</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {AMOUNTS.map((a) => (
                              <button key={a} onClick={() => { setAmount(a); setCustom(""); }} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${amount === a && !custom ? "bg-obsidian-accent border-obsidian-accent text-white" : "bg-obsidian-pane border-obsidian-border text-foreground hover:bg-white/[0.06]"}`}>
                                ₹{a}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2 rounded-lg border border-obsidian-border bg-white/[0.04] px-3 focus-within:border-obsidian-accent focus-within:bg-obsidian-void">
                            <span className="text-muted-foreground">₹</span>
                            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" className="flex-1 bg-transparent py-2.5 outline-none text-sm" />
                          </div>
                        </div>

                        <UpiQRCode upiId={UPI_ID} amount={displayAmount} />

                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.04] border border-obsidian-border">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-muted-foreground">UPI ID</div>
                            <div className="text-sm font-medium truncate text-foreground">{UPI_ID}</div>
                          </div>
                          <CopyButton text={UPI_ID} />
                        </div>

                        <button onClick={() => setIsPaid(true)} className="w-full py-2.5 rounded-lg bg-obsidian-accent text-sm font-medium text-white transition-all hover:brightness-95">
                          <Check size={14} className="inline mr-1.5" /> I have paid via UPI
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === "web" && (
                  <motion.div key="web" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Sparkles size={12} className="text-obsidian-accent" /> International support
                    </div>

                    <a href="/buy-me-a-coffee" className="flex items-center gap-3 p-3 rounded-lg bg-[#FFDD00] hover:brightness-95 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black">
                        <Coffee size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-black">Buy me a coffee</div>
                        <div className="text-xs text-black/70">Open full-page experience</div>
                      </div>
                      <ExternalLink size={14} className="text-black" />
                    </a>

                    <a href={RAZORPAY_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-obsidian-pane border border-obsidian-border hover:bg-white/[0.06] transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#338dfc] flex items-center justify-center text-white">
                        <CreditCard size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Razorpay checkout</div>
                        <div className="text-xs text-muted-foreground">UPI / Cards / Netbanking</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>

                    <a href={PAYPAL_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-obsidian-pane border border-obsidian-border hover:bg-white/[0.06] transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center text-white font-semibold">P</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">PayPal global</div>
                        <div className="text-xs text-muted-foreground">Any currency · Secure</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>

                    <p className="text-center text-xs text-muted-foreground pt-2">Your contribution funds development, maintenance, and high-quality free content.</p>
                  </motion.div>
                )}

                {activeTab === "crypto" && CRYPTO_ADDRESS && (
                  <motion.div key="crypto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="rounded-lg bg-white/[0.04] border border-obsidian-border p-3">
                      <div className="text-xs font-mono break-all text-foreground">{CRYPTO_ADDRESS}</div>
                      <div className="mt-2 flex justify-end">
                        <CopyButton text={CRYPTO_ADDRESS} />
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">BTC, ETH, SOL and EVM tokens supported.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-5 py-3 bg-white/[0.04] border-t border-obsidian-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={12} className="text-obsidian-success" /> 100% used for platform maintenance
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
