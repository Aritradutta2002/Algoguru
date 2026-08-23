import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Coffee, Zap, CreditCard, Sparkles, Shield } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

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
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-3xl bg-white p-3 shadow-xl border border-zinc-200">
        <img src={qrApiUrl} alt="UPI QR" width={180} height={180} className="rounded-2xl block" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-black tracking-widest uppercase text-zinc-500">Scan with any UPI app</p>
        <div className="flex gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest justify-center">
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
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border transition-all ${copied ? "bg-emerald-500 border-emerald-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"}`}
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
      <motion.div key="support-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9998, background: "rgba(10,10,10,0.65)", backdropFilter: "blur(16px)" }} onClick={onClose}>
        <motion.div
          initial={{ scale: 0.96, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[560px] flex flex-col overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_32px_120px_rgba(0,0,0,0.4)]"
          style={{ maxHeight: "92vh" }}
        >
          {/* warm header gradient */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-90" />
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/10 to-transparent" />

          {/* header content over gradient */}
          <div className="relative z-10 flex items-start justify-between p-6 md:p-7 text-white">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
                <Heart size={18} fill="white" className="text-white" />
              </div>
              <div>
                <h2 className="text-[18px] font-black tracking-tight leading-none">Support the Build</h2>
                <p className="text-xs font-bold tracking-widest uppercase opacity-80 mt-1">Keep AlgoGuru polished & free</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/15 hover:bg-black/25 backdrop-blur flex items-center justify-center text-white border border-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* white card overlapping header */}
          <div className="relative z-10 -mt-3 mx-3 md:mx-4 rounded-t-[24px] bg-white dark:bg-zinc-900 flex-1 flex flex-col overflow-hidden">
            {/* tabs */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"}`}
                  >
                    <span>{tab.flag}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
              <AnimatePresence mode="wait">
                {activeTab === "upi" && (
                  <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                    {isPaid ? (
                      <div className="py-10 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">🎉</div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white">Huge Thanks!</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 px-6">Your support fuels new features and high-quality content.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Closing...
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black tracking-widest uppercase text-zinc-500">Select Amount (₹)</span>
                            <span className="text-xs font-bold text-amber-600">{displayAmount} INR</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {AMOUNTS.map((a) => (
                              <button key={a} onClick={() => { setAmount(a); setCustom(""); }} className={`py-2.5 rounded-2xl text-sm font-black border-2 transition-all ${amount === a && !custom ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"}`}>
                                ₹{a}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 focus-within:border-amber-500 focus-within:bg-white dark:focus-within:bg-zinc-900">
                            <span className="font-black text-zinc-500">₹</span>
                            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" className="flex-1 bg-transparent py-2.5 outline-none text-sm font-bold" />
                          </div>
                        </div>

                        <UpiQRCode upiId={UPI_ID} amount={displayAmount} />

                        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          <div className="min-w-0">
                            <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">UPI ID</div>
                            <div className="text-sm font-black truncate text-zinc-900 dark:text-white">{UPI_ID}</div>
                          </div>
                          <CopyButton text={UPI_ID} />
                        </div>

                        <button onClick={() => setIsPaid(true)} className="w-full py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-black flex items-center justify-center gap-2 hover:opacity-90">
                          <Check size={16} /> I have paid via UPI
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === "web" && (
                  <motion.div key="web" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-zinc-500">
                      <Sparkles size={12} className="text-amber-500" /> International Support
                    </div>

                    <a href="/buy-me-a-coffee" className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFDD00] border-2 border-[#FFDD00] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow text-black">
                        <Coffee size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-black">Buy Me a Coffee — Best UI</div>
                        <div className="text-xs font-bold text-black/60">Open full-page experience</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                        <ExternalLink size={14} />
                      </div>
                    </a>

                    <a href={RAZORPAY_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-[#338dfc] hover:shadow-md transition-all group">
                      <div className="w-11 h-11 rounded-2xl bg-[#338dfc] flex items-center justify-center text-white shadow">
                        <CreditCard size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-zinc-900 dark:text-white">Razorpay Checkout</div>
                        <div className="text-xs font-bold text-zinc-500">UPI / Cards / Netbanking</div>
                      </div>
                      <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                    </a>

                    <a href={PAYPAL_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-[#003087] hover:shadow-md transition-all group">
                      <div className="w-11 h-11 rounded-2xl bg-[#003087] flex items-center justify-center text-white font-black italic shadow">P</div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-zinc-900 dark:text-white">PayPal Global</div>
                        <div className="text-xs font-bold text-zinc-500">Any currency · Secure</div>
                      </div>
                      <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                    </a>

                    <p className="text-center text-xs font-medium text-zinc-500 px-4 pt-2">Your contribution funds development, maintenance, and high-quality free content.</p>
                  </motion.div>
                )}

                {activeTab === "crypto" && CRYPTO_ADDRESS && (
                  <motion.div key="crypto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 p-4">
                      <div className="text-xs font-mono break-all text-zinc-700 dark:text-zinc-300">{CRYPTO_ADDRESS}</div>
                      <div className="mt-3 flex justify-end">
                        <CopyButton text={CRYPTO_ADDRESS} />
                      </div>
                    </div>
                    <p className="text-center text-xs text-zinc-500">BTC, ETH, SOL and EVM tokens supported.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase text-zinc-500">
              <Shield size={12} className="text-emerald-500" /> 100% used for platform maintenance
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
