import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Sparkles, Coffee, Zap, CreditCard } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

// ── CONFIG — Read from .env file ─────────────────────────────────────────────
const UPI_ID = import.meta.env.VITE_UPI_ID || "your-upi@id";
const RAZORPAY_URL = import.meta.env.VITE_RAZORPAY_URL || "";
const PAYPAL_URL = import.meta.env.VITE_PAYPAL_URL || "";
const BUYMEACOFFEE_URL = import.meta.env.VITE_BUYMEACOFFEE_URL || "";
const CRYPTO_ADDRESS = import.meta.env.VITE_CRYPTO_ADDRESS || "";
// ──────────────────────────────────────────────────────────────────────────────

const AMOUNTS = [49, 99, 199, 499];

const TABS = [
  { id: "upi", label: "UPI", flag: "🇮🇳", subLabel: "India" },
  { id: "web", label: "Web", flag: "🌍", subLabel: "Global" },
  { id: "crypto", label: "Crypto", flag: "₿", subLabel: "Web3", hidden: !CRYPTO_ADDRESS },
] as const;

type Tab = (typeof TABS)[number]["id"];

function UpiQRCode({ upiId, amount }: { upiId: string; amount: number }) {
  // Build a UPI deep-link — apps like GPay/PhonePe parse this QR
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=AlgoGuru%20Support&am=${amount}&cu=INR&tn=Support%20AlgoGuru`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=200x200&bgcolor=ffffff&color=000000&margin=8`;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-3xl border border-border/50 p-3 bg-white shadow-2xl"
      >
        <img
          src={qrApiUrl}
          alt="UPI QR Code"
          width={180}
          height={180}
          className="block rounded-xl max-w-full h-auto"
          style={{ aspectRatio: '1/1' }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Scan with any UPI app
        </p>
        <div className="flex gap-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
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
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <AppTooltip content={copied ? "Copied!" : "Copy"}>
      <button
        onClick={handleCopy}
        aria-label="Copy"
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
          copied 
            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
            : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </AppTooltip>
  );
}

export function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("upi");
  const [selectedAmount, setSelectedAmount] = useState(99);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const visibleTabs = TABS.filter((t) => !("hidden" in t && t.hidden));

  // Auto-close modal after user marks as paid
  useEffect(() => {
    if (isPaid) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isPaid, onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="support-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9998, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg flex flex-col overflow-hidden rounded-[40px] border border-border/50 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] bg-card"
          style={{ maxHeight: "90vh" }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="relative z-10 flex items-center justify-between px-8 py-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Heart size={18} className="text-primary" fill="currentColor" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Support the Build</h2>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                Help keep AlgoGuru polished & free
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="px-8 pb-4">
            <div className="flex p-1.5 rounded-[24px] bg-muted/30 border border-border/30">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id 
                      ? "bg-card border border-border/50 text-foreground shadow-xl shadow-black/10" 
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                >
                  <span className="text-sm leading-none">{tab.flag}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <AnimatePresence mode="wait">
              {activeTab === "upi" && (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {isPaid ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                        <div className="relative w-20 h-20 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shadow-2xl shadow-primary/10">
                          🎉
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Huge Thanks!</h3>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                          Your support fuels new features and high-quality interview content.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border bg-muted/30 text-[9px] font-black uppercase tracking-widest text-primary/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        Closing automatically...
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Amount selector */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            Select Amount (₹)
                          </p>
                          {isCustom && (
                            <button onClick={() => { setIsCustom(false); setCustomAmount(""); setSelectedAmount(99); }} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                              Reset
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => {
                                setSelectedAmount(amt);
                                setIsCustom(false);
                                setCustomAmount("");
                              }}
                              className={`py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all duration-300 border ${
                                selectedAmount === amt && !isCustom 
                                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                  : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>

                        {/* Custom Input */}
                        <div className={`flex items-center rounded-[22px] border transition-all duration-300 ${isCustom ? "border-primary/50 bg-muted/50 ring-4 ring-primary/5 shadow-xl shadow-primary/5" : "border-border/30 bg-muted/20"}`}>
                           <div className={`px-5 py-3 font-black text-sm border-r transition-colors ${isCustom ? "border-primary/20 text-primary" : "border-border/10 text-muted-foreground/30"}`}>
                             ₹
                           </div>
                           <input 
                             type="number"
                             min="10"
                             placeholder="Enter custom amount..."
                             value={customAmount}
                             onChange={(e) => {
                                setIsCustom(true);
                                setCustomAmount(e.target.value);
                                const val = parseInt(e.target.value);
                                setSelectedAmount(isNaN(val) || val <= 0 ? 10 : val);
                             }}
                             onFocus={() => setIsCustom(true)}
                             className="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-sm text-foreground placeholder:text-muted-foreground/20"
                           />
                        </div>
                      </div>

                      {/* QR */}
                      <UpiQRCode upiId={UPI_ID} amount={selectedAmount} />

                      {/* UPI ID copy */}
                      <div className="flex items-center justify-between gap-4 p-4 rounded-[24px] border border-border/30 bg-muted/20">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">UPI ID</p>
                          <p className="text-sm font-black tracking-tight text-foreground truncate">{UPI_ID}</p>
                        </div>
                        <CopyButton text={UPI_ID} />
                      </div>

                      {/* Final Mark as Paid Button */}
                      <button
                        onClick={() => setIsPaid(true)}
                        className="w-full py-4 rounded-[22px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest bg-foreground text-background transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/20"
                      >
                        <Check size={18} strokeWidth={3} className="text-primary" />
                        I have paid via UPI
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === "web" && (
                <motion.div
                  key="web"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                      International Support
                    </p>
                  </div>

                  {/* Buy Me a Coffee */}
                  <a
                    href={BUYMEACOFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-[28px] border border-[#FFDD00]/20 bg-[#FFDD00]/5 transition-all duration-300 hover:bg-[#FFDD00]/10 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FFDD00] flex items-center justify-center shadow-xl shadow-[#FFDD00]/20 group-hover:scale-110 transition-transform">
                      <Coffee size={24} className="text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight text-foreground">Buy Me a Coffee</p>
                      <p className="text-[11px] font-bold text-muted-foreground/60">One-time or monthly support</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted group-hover:bg-[#FFDD00] group-hover:text-black transition-all">
                      <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
                    </div>
                  </a>

                  {/* Razorpay */}
                  <a
                    href={RAZORPAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-[28px] border-[#338dfc]/20 bg-[#338dfc]/5 border transition-all duration-300 hover:bg-[#338dfc]/10 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#338dfc] flex items-center justify-center shadow-xl shadow-[#338dfc]/20 group-hover:scale-110 transition-transform">
                       <CreditCard size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight text-foreground">Razorpay Checkout</p>
                      <p className="text-[11px] font-bold text-muted-foreground/60">UPI / Cards / Netbanking</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted group-hover:bg-[#338dfc] group-hover:text-white transition-all">
                      <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
                    </div>
                  </a>

                  {/* PayPal */}
                  <a
                    href={PAYPAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-[28px] border-[#003087]/20 bg-[#003087]/5 border transition-all duration-300 hover:bg-[#003087]/10 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#003087] flex items-center justify-center shadow-xl shadow-[#003087]/20 group-hover:scale-110 transition-transform">
                      <div className="text-white text-lg font-black italic">P</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight text-foreground">PayPal Global</p>
                      <p className="text-[11px] font-bold text-muted-foreground/60">Secure payments in any currency</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted group-hover:bg-[#003087] group-hover:text-white transition-all">
                      <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
                    </div>
                  </a>

                  <div className="pt-6 text-center space-y-4">
                    <p className="text-[11px] font-medium text-muted-foreground/60 leading-relaxed px-4">
                      Your contribution directly funds development, maintenance, and high-quality free content.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "crypto" && CRYPTO_ADDRESS && (
                <motion.div
                  key="crypto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 px-1">
                    <Zap size={14} className="text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                      Crypto Address
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 p-6 rounded-[32px] border border-border/30 bg-muted/20">
                    <p className="text-xs font-mono break-all leading-relaxed text-foreground/80">
                      {CRYPTO_ADDRESS}
                    </p>
                    <div className="flex justify-end pt-2">
                      <CopyButton text={CRYPTO_ADDRESS} />
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-center text-muted-foreground/60 leading-relaxed px-4">
                    Accepts BTC, ETH, SOL and most EVM-compatible tokens. Thank you for supporting the open-web!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="px-8 py-6 border-t border-border/30 bg-muted/20">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
              <Heart size={12} fill="currentColor" className="text-primary" />
              <span>100% used for platform maintenance</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
