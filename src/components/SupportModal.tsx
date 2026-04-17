import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Sparkles, Coffee, Zap, CreditCard } from "lucide-react";

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
    <div className="flex flex-col items-center gap-3">
      <div
        className="border-4 border-black p-1 bg-white"
        style={{ boxShadow: "4px 4px 0 0 #000" }}
      >
        <img
          src={qrApiUrl}
          alt="UPI QR Code"
          width={160}
          height={160}
          className="block"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        Scan with any UPI app
      </p>
      <div className="flex gap-2 text-xs font-black text-muted-foreground opacity-70">
        <span>GPay</span><span>·</span><span>PhonePe</span><span>·</span><span>Paytm</span><span>·</span><span>BHIM</span>
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
    <button
      onClick={handleCopy}
      title="Copy"
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-150"
      style={{
        border: "2px solid hsl(var(--border))",
        background: copied ? "hsl(var(--primary))" : "hsl(var(--card))",
        color: copied ? "black" : "hsl(var(--foreground))",
        boxShadow: copied ? "0 0 0 0 hsl(var(--border))" : "2px 2px 0 0 hsl(var(--border))",
        transform: copied ? "translate(2px,2px)" : "none",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("upi");
  const [selectedAmount, setSelectedAmount] = useState(99);
  const visibleTabs = TABS.filter((t) => !("hidden" in t && t.hidden));

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="support-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 9998, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mx-4 flex flex-col overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "4px solid hsl(var(--foreground))",
            boxShadow: "8px 8px 0 0 hsl(var(--foreground))",
            maxHeight: "90vh",
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ background: "hsl(var(--primary))", borderBottom: "3px solid hsl(var(--foreground))" }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Heart size={18} fill="black" color="black" />
              <span className="text-sm font-black uppercase tracking-widest text-black">Support AlgoGuru</span>
              <Sparkles size={14} color="black" className="opacity-70" />
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-100"
              style={{
                border: "2px solid black",
                background: "transparent",
                color: "black",
                boxShadow: "2px 2px 0 0 black",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 black";
                (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0 0 black";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* ── Tagline ────────────────────────────────────────── */}
          <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "2px solid hsl(var(--border))" }}>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              AlgoGuru is free for everyone. If it helped you crack an interview or learn something new,
              consider buying me a coffee ☕ — it keeps this project alive!
            </p>
          </div>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <div className="flex flex-shrink-0" style={{ borderBottom: "2px solid hsl(var(--border))" }}>
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-150"
                style={{
                  background: activeTab === tab.id ? "hsl(var(--primary))" : "transparent",
                  color: activeTab === tab.id ? "black" : "hsl(var(--muted-foreground))",
                  borderRight: tab.id !== visibleTabs[visibleTabs.length - 1].id ? "2px solid hsl(var(--border))" : "none",
                  borderBottom: activeTab === tab.id ? "2px solid hsl(var(--primary))" : "none",
                }}
              >
                <span className="text-base leading-none">{tab.flag}</span>
                <span>{tab.label}</span>
                <span className="opacity-60 text-[9px] normal-case font-semibold">{tab.subLabel}</span>
              </button>
            ))}
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait">
              {activeTab === "upi" && (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-5"
                >
                  {/* Amount selector */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Choose Amount (₹)
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setSelectedAmount(amt)}
                          className="py-2 text-sm font-black uppercase tracking-wide transition-all duration-100"
                          style={{
                            border: "2px solid hsl(var(--border))",
                            background: selectedAmount === amt ? "hsl(var(--primary))" : "hsl(var(--card))",
                            color: selectedAmount === amt ? "black" : "hsl(var(--foreground))",
                            boxShadow: selectedAmount === amt ? "0 0 0 0 hsl(var(--border))" : "2px 2px 0 0 hsl(var(--border))",
                            transform: selectedAmount === amt ? "translate(2px,2px)" : "none",
                          }}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR */}
                  <UpiQRCode upiId={UPI_ID} amount={selectedAmount} />

                  {/* UPI ID copy */}
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2"
                    style={{ border: "2px solid hsl(var(--border))", background: "hsl(var(--muted)/0.4)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">UPI ID</p>
                      <p className="text-sm font-black truncate" style={{ color: "hsl(var(--foreground))" }}>{UPI_ID}</p>
                    </div>
                    <CopyButton text={UPI_ID} />
                  </div>

                  <p className="text-[10px] font-bold text-center text-muted-foreground">
                    Any UPI amount is welcome — even ₹10 helps! 🙏
                  </p>
                </motion.div>
              )}

              {activeTab === "web" && (
                <motion.div
                  key="web"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Online Payment Options
                  </p>

                  {/* Razorpay */}
                  <a
                    href={RAZORPAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-4 transition-all duration-150 group"
                    style={{
                      border: "3px solid #338dfce5",
                      background: "#338dfce5",
                      boxShadow: "4px 4px 0 0 #000",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "none";
                    }}
                  >
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white" style={{ border: "2px solid #000", boxShadow: "2px 2px 0 0 #000" }}>
                       <span className="font-extrabold text-[#338dfce5]" style={{ fontSize: "16px" }}>₹</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase text-white">Razorpay Checkout</p>
                      <p className="text-[11px] font-bold text-white/80">UPI / Cards / Netbanking</p>
                    </div>
                    <ExternalLink size={14} color="#fff" className="flex-shrink-0 opacity-60" />
                  </a>

                  {/* Buy Me a Coffee */}
                  <a
                    href={BUYMEACOFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-4 transition-all duration-150 group"
                    style={{
                      border: "3px solid #FFDD00",
                      background: "#FFDD00",
                      boxShadow: "4px 4px 0 0 #000",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "none";
                    }}
                  >
                    <Coffee size={28} color="#000" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase text-black">Buy Me a Coffee</p>
                      <p className="text-[11px] font-bold text-black/70">One-time or monthly support</p>
                    </div>
                    <ExternalLink size={14} color="#000" className="flex-shrink-0 opacity-60" />
                  </a>

                  {/* PayPal */}
                  <a
                    href={PAYPAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-4 transition-all duration-150"
                    style={{
                      border: "3px solid #003087",
                      background: "#003087",
                      color: "white",
                      boxShadow: "4px 4px 0 0 #000",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 0 #000";
                      (e.currentTarget as HTMLElement).style.transform = "none";
                    }}
                  >
                    {/* PayPal "P" wordmark stand-in */}
                    <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#009cde]">
                      <span className="text-xs font-black text-white">P</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase">PayPal</p>
                      <p className="text-[11px] font-bold opacity-70">Pay securely in USD / any currency</p>
                    </div>
                    <ExternalLink size={14} className="flex-shrink-0 opacity-60" />
                  </a>

                  <p className="text-[10px] font-bold text-center text-muted-foreground mt-1">
                    Your support directly funds new content &amp; features. Thank you! 🚀
                  </p>
                </motion.div>
              )}

              {activeTab === "crypto" && CRYPTO_ADDRESS && (
                <motion.div
                  key="crypto"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      BTC / ETH Address
                    </p>
                  </div>
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-3"
                    style={{ border: "2px solid hsl(var(--border))", background: "hsl(var(--muted)/0.4)" }}
                  >
                    <p className="text-[11px] font-mono break-all flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {CRYPTO_ADDRESS}
                    </p>
                    <CopyButton text={CRYPTO_ADDRESS} />
                  </div>
                  <p className="text-[10px] font-bold text-center text-muted-foreground">
                    Accepts BTC, ETH, SOL and most EVM-compatible tokens.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 flex-shrink-0 text-[10px] font-bold text-muted-foreground"
            style={{ borderTop: "2px solid hsl(var(--border))", background: "hsl(var(--muted)/0.2)" }}
          >
            <Heart size={10} fill="currentColor" className="text-[#FF3366]" />
            <span>100% of proceeds go to development &amp; hosting.</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
