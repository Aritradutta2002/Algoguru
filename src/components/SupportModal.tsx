import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Coffee, CreditCard, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl, Surface, Pill } from "@/components/layout/PagePrimitives";

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
      <div className="rounded-surface border border-border bg-white p-3">
        <img src={qrApiUrl} alt="UPI QR" width={180} height={180} className="block rounded-[calc(var(--radius-control)-0.25rem)]" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      </div>
      <div className="space-y-1 text-center">
        <p className="ui-meta">Scan with any UPI app</p>
        <p className="ui-meta">GPay · PhonePe · Paytm</p>
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
    <Button variant="line" size="sm" onClick={handleCopy}>
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </Button>
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
          className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-surface border border-border bg-card shadow-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          style={{ maxHeight: "92vh" }}
        >
          <div className="relative z-10 flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-muted/60 text-primary">
                <Heart size={16} />
              </span>
              <div>
                <h2 id="support-modal-title" className="ui-h3 leading-none">
                  Support the build
                </h2>
                <p className="ui-meta mt-1.5">Keep AlgoGuru polished and free</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close support dialog"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <SegmentedControl<Tab>
                value={activeTab}
                onChange={setActiveTab}
                size="sm"
                fullWidth
                options={visibleTabs.map((tab) => ({
                  value: tab.id,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{tab.flag}</span> {tab.label}
                    </span>
                  ),
                }))}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
              <AnimatePresence mode="wait">
                {activeTab === "upi" && (
                  <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                    {isPaid ? (
                      <div className="space-y-3 py-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-surface border border-border bg-muted/60 text-2xl">
                          🎉
                        </div>
                        <h3 className="ui-h3">Huge thanks!</h3>
                        <p className="ui-lede px-6 text-sm">
                          Your support fuels new features and high-quality
                          content.
                        </p>
                        <Pill tone="primary">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
                          />
                          Closing…
                        </Pill>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="ui-meta">Select amount (₹)</span>
                            <Pill mono className="text-foreground">{displayAmount} INR</Pill>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {AMOUNTS.map((a) => {
                              const active = amount === a && !custom;
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => { setAmount(a); setCustom(""); }}
                                  aria-pressed={active}
                                  className={`rounded-control border py-2 font-mono text-sm font-medium tabular-nums transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-surface-line hover:bg-muted/50"}`}
                                >
                                  ₹{a}
                                </button>
                              );
                            })}
                          </div>
                          <label className="mt-3 flex items-center gap-2 rounded-control border border-border bg-background px-3 focus-within:border-primary">
                            <span className="text-sm text-muted-foreground">₹</span>
                            <input
                              value={custom}
                              onChange={(e) => setCustom(e.target.value)}
                              placeholder="Custom amount"
                              inputMode="numeric"
                              aria-label="Custom amount in rupees"
                              className="h-11 w-full min-w-0 flex-1 bg-transparent font-mono text-sm tabular-nums outline-none"
                            />
                          </label>
                        </div>

                        <UpiQRCode upiId={UPI_ID} amount={displayAmount} />

                        <Surface padding="sm" className="flex items-center justify-between gap-3 bg-muted/40">
                          <div className="min-w-0">
                            <div className="ui-meta">UPI ID</div>
                            <div className="truncate font-mono text-sm text-foreground">{UPI_ID}</div>
                          </div>
                          <CopyButton text={UPI_ID} />
                        </Surface>

                        <Button variant="solid" size="cta" className="w-full" onClick={() => setIsPaid(true)}>
                          <Check size={14} /> I have paid via UPI
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === "web" && (
                  <motion.div key="web" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <p className="ui-meta inline-flex items-center gap-2">
                      <Sparkles size={12} className="text-primary" /> International support
                    </p>

                    <a href="/buy-me-a-coffee" className="group flex items-center gap-3 rounded-control border border-[#FFDD00]/60 bg-[#FFDD00] p-3 transition-[filter] hover:brightness-95">
                      <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-black">
                        <Coffee size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-black">Buy me a coffee</span>
                        <span className="block text-xs text-black/70">Open full-page experience</span>
                      </span>
                      <ExternalLink size={14} className="text-black" />
                    </a>

                    <a href={RAZORPAY_URL || "#"} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-control border border-border bg-card p-3 transition-colors hover:border-surface-line hover:bg-muted/40">
                      <span className="flex h-10 w-10 items-center justify-center rounded-control border border-[#338dfc]/40 bg-[#338dfc] text-white">
                        <CreditCard size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">Razorpay checkout</span>
                        <span className="ui-meta block">UPI / Cards / Netbanking</span>
                      </span>
                      <ExternalLink size={14} className="text-muted-foreground transition-colors group-hover:text-foreground" />
                    </a>

                    <a href={PAYPAL_URL || "#"} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-control border border-border bg-card p-3 transition-colors hover:border-surface-line hover:bg-muted/40">
                      <span className="flex h-10 w-10 items-center justify-center rounded-control border border-[#003087]/40 bg-[#003087] font-semibold text-white">P</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">PayPal global</span>
                        <span className="ui-meta block">Any currency · Secure</span>
                      </span>
                      <ExternalLink size={14} className="text-muted-foreground transition-colors group-hover:text-foreground" />
                    </a>

                    <p className="ui-meta pt-2 text-center">
                      Your contribution funds development, maintenance, and
                      high-quality free content.
                    </p>
                  </motion.div>
                )}

                {activeTab === "crypto" && CRYPTO_ADDRESS && (
                  <motion.div key="crypto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                    <Surface padding="sm" className="bg-muted/40">
                      <div className="break-all font-mono text-xs text-foreground">{CRYPTO_ADDRESS}</div>
                      <div className="mt-2 flex justify-end">
                        <CopyButton text={CRYPTO_ADDRESS} />
                      </div>
                    </Surface>
                    <p className="ui-meta text-center">
                      BTC, ETH, SOL and EVM tokens supported.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/40 px-5 py-3">
              <Shield size={12} className="text-success" />
              <span className="ui-meta">
                100% used for platform maintenance
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
