"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink, Coffee, CreditCard, Shield } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UPI_ID = publicEnv.upiId || "your-upi@id";
const RAZORPAY_URL = publicEnv.razorpayUrl || "";
const PAYPAL_URL = publicEnv.paypalUrl || "";
const CRYPTO_ADDRESS = publicEnv.cryptoAddress || "";

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
      <div className="rounded-[0.875rem] bg-white p-3 border border-obsidian-border">
        <img src={qrApiUrl} alt="UPI QR" width={180} height={180} className="rounded-lg block" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={`h-8 gap-1.5 px-3 text-xs ${copied ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/15" : "hover:bg-foreground/[0.05]"}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("upi");
  const [amount, setAmount] = useState(99);
  const [custom, setCustom] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  if (returnFocusRef.current === null && typeof document !== "undefined") {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const visibleTabs = TABS.filter((t) => !("hidden" in t && t.hidden));

  const displayAmount = custom ? parseInt(custom, 10) || amount : amount;

  useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => onCloseRef.current(), 3000);
      return () => clearTimeout(t);
    }
  }, [isPaid]);

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCloseRef.current();
      }}
    >
      <DialogContent
        showClose={false}
        aria-modal="true"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
        className="flex w-full max-w-[560px] flex-col gap-0 overflow-hidden rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-0 shadow-2xl sm:p-0"
        style={{ maxHeight: "92vh" }}
      >
          <div className="relative z-10 flex items-start justify-between border-b border-obsidian-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-foreground">
                <Heart size={16} />
              </div>
              <div>
                <DialogTitle className="leading-none text-foreground">
                  Support the build
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  Keep AlgoGuru polished and free
                </DialogDescription>
              </div>
            </div>
            <Button variant="bare" size="bare" ref={closeButtonRef} onClick={onClose} aria-label="Close support dialog" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X size={16} />
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as Tab)}
            className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="px-5 pt-4 pb-3">
              <TabsList className="w-full h-9 rounded-lg bg-obsidian-elevated border border-obsidian-border p-1">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex-1 h-7 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 data-[state=active]:bg-obsidian-pane data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <span>{tab.flag}</span> {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
              <TabsContent value="upi" className="outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {isPaid ? (
                      <div className="py-10 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-obsidian-elevated border border-obsidian-border flex items-center justify-center text-xl">🎉</div>
                        <h3 className="text-base font-semibold text-foreground">Huge thanks!</h3>
                        <p className="text-sm text-muted-foreground px-6">Your support fuels new features and high-quality content.</p>
                        <Badge variant="outline" className="inline-flex items-center gap-2 px-3 py-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Closing…
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Select amount (₹)</span>
                            <span className="text-xs font-medium text-foreground tabular-nums">{displayAmount} INR</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {AMOUNTS.map((a) => (
                              <Button
                                key={a}
                                type="button"
                                variant={amount === a && !custom ? "default" : "outline"}
                                onClick={() => { setAmount(a); setCustom(""); }}
                                className="h-9 rounded-md text-sm font-medium"
                              >
                                ₹{a}
                              </Button>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2 rounded-md border border-obsidian-border bg-obsidian-elevated px-3 focus-within:border-primary">
                            <span className="text-muted-foreground text-sm">₹</span>
                            <Input
                              value={custom}
                              onChange={(e) => setCustom(e.target.value)}
                              placeholder="Custom amount"
                              className="h-9 flex-1 border-0 bg-transparent px-0 py-2 text-sm shadow-none focus-visible:ring-0"
                            />
                          </div>
                        </div>

                        <UpiQRCode upiId={UPI_ID} amount={displayAmount} />

                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-obsidian-elevated border border-obsidian-border">
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">UPI ID</div>
                            <div className="text-sm font-medium truncate text-foreground">{UPI_ID}</div>
                          </div>
                          <CopyButton text={UPI_ID} />
                        </div>

                        <Button type="button" onClick={() => setIsPaid(true)} className="w-full rounded-md text-sm font-medium">
                          <Check size={14} className="mr-1.5" /> I have paid via UPI
                        </Button>
                      </>
                    )}
                </motion.div>
              </TabsContent>

              <TabsContent value="web" className="outline-none">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">International support</p>

                    <Link href="/buy-me-a-coffee" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-elevated hover:bg-foreground/[0.05] transition-colors">
                      <div className="w-9 h-9 rounded-md bg-obsidian-pane border border-obsidian-border flex items-center justify-center text-foreground">
                        <Coffee size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Buy me a coffee</div>
                        <div className="text-xs text-muted-foreground">Open full-page experience</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </Link>

                    <a href={RAZORPAY_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-elevated hover:bg-foreground/[0.05] transition-colors">
                      <div className="w-9 h-9 rounded-md bg-obsidian-pane border border-obsidian-border flex items-center justify-center text-foreground">
                        <CreditCard size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Razorpay checkout</div>
                        <div className="text-xs text-muted-foreground">UPI / Cards / Netbanking</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>

                    <a href={PAYPAL_URL || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-elevated hover:bg-foreground/[0.05] transition-colors">
                      <div className="w-9 h-9 rounded-md bg-obsidian-pane border border-obsidian-border flex items-center justify-center text-foreground font-semibold text-xs">P</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">PayPal global</div>
                        <div className="text-xs text-muted-foreground">Any currency · Secure</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </a>

                    <p className="text-center text-xs text-muted-foreground pt-2">Your contribution funds development, maintenance, and high-quality free content.</p>
                </motion.div>
              </TabsContent>

              {CRYPTO_ADDRESS && (
                <TabsContent value="crypto" className="outline-none">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="rounded-lg bg-obsidian-elevated border border-obsidian-border p-3">
                      <div className="text-xs font-mono break-all text-foreground">{CRYPTO_ADDRESS}</div>
                      <div className="mt-2 flex justify-end">
                        <CopyButton text={CRYPTO_ADDRESS} />
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">BTC, ETH, SOL and EVM tokens supported.</p>
                  </motion.div>
                </TabsContent>
              )}
            </div>

            <div className="px-5 py-3 bg-obsidian-elevated border-t border-obsidian-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={12} className="text-emerald-500" /> 100% used for platform maintenance
            </div>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
}
