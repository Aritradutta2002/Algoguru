import { useState, useEffect } from "react";
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
      <div className="rounded-2xl bg-white p-3 border border-border">
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${copied ? "bg-success/10 border-success/30 text-success" : "bg-card border-border text-foreground hover:bg-muted"}`}
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
  const visibleTabs = TABS.filter((t) => !("hidden" in t && t.hidden));

  const displayAmount = custom ? parseInt(custom) || amount : amount;

  useEffect(() => {
    if (isPaid) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [isPaid, onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div key="support-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.96, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[560px] flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-2xl"
          style={{ maxHeight: "92vh" }}
        >
          <div className="relative z-10 flex items-start justify-between p-5 border-b border-border">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Heart size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground leading-none">Support the build</h2>
                <p className="text-xs text-muted-foreground mt-1">Keep AlgoGuru polished and free</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex p-1 rounded-lg bg-muted border border-border">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">🎉</div>
                        <h3 className="text-lg font-semibold text-foreground">Huge thanks!</h3>
                        <p className="text-sm text-muted-foreground px-6">Your support fuels new features and high-quality content.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Closing…
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Select amount (₹)</span>
                            <span className="text-xs font-medium text-primary">{displayAmount} INR</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {AMOUNTS.map((a) => (
                              <button key={a} onClick={() => { setAmount(a); setCustom(""); }} className={`py-2 rounded-lg text-sm font-medium border transition-colors ${amount === a && !custom ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-foreground hover:bg-muted"}`}>
                                ₹{a}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 focus-within:border-primary focus-within:bg-background">
                            <span className="text-muted-foreground">₹</span>
                            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" className="flex-1 bg-transparent py-2.5 outline-none text-sm" />
                          </div>
                        </div>

                        <UpiQRCode upiId={UPI_ID} amount={displayAmount} />

                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-muted-foreground">UPI ID</div>
                            <div className="text-sm font-medium truncate text-foreground">{UPI_ID}</div>
                          </div>
                          <CopyButton text={UPI_ID} />
                        </div>

                        <button onClick={() => setIsPaid(true)} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-95 transition-all">
                          <Check size={14} className="inline mr-1.5" /> I have paid via UPI
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === "web" && (
                  <motion.div key="web" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Sparkles size={12} className="text-primary" /> International support
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

                    <a href={RAZORPAY_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#338dfc] flex items-center justify-center text-white">
                        <CreditCard size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Razorpay checkout</div>
                        <div className="text-xs text-muted-foreground">UPI / Cards / Netbanking</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>

                    <a href={PAYPAL_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
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
                    <div className="rounded-lg bg-muted/40 border border-border p-3">
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

            <div className="px-5 py-3 bg-muted/40 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={12} className="text-success" /> 100% used for platform maintenance
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
