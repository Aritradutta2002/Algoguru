"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Coffee,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  Heart,
  QrCode,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { getSupportConfig } from "@/lib/supportConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TIERS = [
  { amount: 49, label: "A Coffee", desc: "One warm coffee", popular: false },
  { amount: 99, label: "Fuel", desc: "Keep the server on", popular: true },
  { amount: 199, label: "Boost", desc: "Ship a feature", popular: false },
  { amount: 499, label: "Sponsor", desc: "Sustain the build", popular: false },
];

export function BuyMeACoffeeView() {
  const [amount, setAmount] = useState(99);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const {
    upiId,
    buyMeACoffeeUrl,
    razorpayUrl,
    paypalUrl,
    cryptoAddress,
  } = getSupportConfig();

  const hasOtherWays = Boolean(
    buyMeACoffeeUrl || razorpayUrl || paypalUrl || cryptoAddress,
  );
  const availableMethods = [
    upiId && "UPI",
    (razorpayUrl || buyMeACoffeeUrl) && "Card",
    paypalUrl && "PayPal",
    cryptoAddress && "Crypto",
  ].filter((method): method is string => Boolean(method));
  const hasAnyMethod = availableMethods.length > 0;

  const displayAmount = custom ? parseInt(custom, 10) || amount : amount;
  const upiUrl = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=AlgoGuru%20Support&am=${displayAmount}&cu=INR&tn=Support%20AlgoGuru`
    : "";
  const qrUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=220x220&bgcolor=ffffff&color=000000&margin=10`
    : "";

  const copy = (t: string, key: string) => {
    navigator.clipboard.writeText(t);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-obsidian-void text-foreground">
      <section className="relative border-b border-obsidian-border bg-obsidian-void">
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <p className="lp-kicker mb-3">
                <Heart size={12} className="inline mr-1" /> Support the build
              </p>
              <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl text-foreground">
                Buy me a coffee
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-muted-foreground max-w-2xl">
                AlgoGuru is free and indie-built. Your coffee keeps servers on, ships features faster, and funds high-quality interview content for everyone.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="gap-1.5 rounded-md border-obsidian-border bg-obsidian-pane px-2.5 py-1 text-xs font-medium text-foreground">
                  <Shield size={12} className="text-emerald-400" /> 100% for maintenance
                </Badge>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gift size={12} /> Free for learners
                </div>
              </div>
            </div>

            <Card className="w-full lg:w-[360px] shrink-0 rounded-[0.875rem] bg-obsidian-pane border-obsidian-border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-obsidian-elevated border border-obsidian-border text-foreground flex items-center justify-center">
                    <Coffee size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Quick support</div>
                    <div className="text-xs text-muted-foreground">
                      {hasAnyMethod ? availableMethods.join(" · ") : "No payment channels configured"}
                    </div>
                  </div>
                  {hasAnyMethod && (
                    <Badge variant="outline" className="ml-auto px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      Live
                    </Badge>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {TIERS.map((t) => {
                    const active = amount === t.amount && !custom;
                    return (
                      <Button
                        key={t.amount}
                        type="button"
                        variant={active ? "default" : "outline"}
                        onClick={() => {
                          setAmount(t.amount);
                          setCustom("");
                        }}
                        className="relative h-9 rounded-lg text-xs font-medium"
                      >
                        {t.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-medium px-1.5 py-0.5 rounded bg-foreground text-background">
                            Popular
                          </span>
                        )}
                        ₹{t.amount}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-elevated px-3 focus-within:border-foreground/30">
                  <span className="text-muted-foreground">₹</span>
                  <Input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Custom amount"
                    className="h-9 flex-1 border-0 bg-transparent px-0 py-2 text-xs shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 md:text-xs"
                  />
                </div>
                {buyMeACoffeeUrl ? (
                  <Button asChild className="mt-4 h-9 w-full rounded-lg text-xs font-medium">
                    <a href={buyMeACoffeeUrl} target="_blank" rel="noreferrer">
                      <Coffee size={14} /> Support via Buy Me a Coffee <ExternalLink size={12} />
                    </a>
                  </Button>
                ) : razorpayUrl ? (
                  <Button asChild className="mt-4 h-9 w-full rounded-lg text-xs font-medium">
                    <a href={razorpayUrl} target="_blank" rel="noreferrer">
                      <CreditCard size={14} /> Support via Razorpay <ExternalLink size={12} />
                    </a>
                  </Button>
                ) : upiId ? (
                  <Button asChild className="mt-4 h-9 w-full rounded-lg text-xs font-medium">
                    <a href="#upi-support">
                      <QrCode size={14} /> Pay ₹{displayAmount} via UPI
                    </a>
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Payment links are not configured in this environment.
                  </p>
                )}
                {hasAnyMethod && (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
                    Secure · One-time support
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-10">
        <div className={upiId && hasOtherWays ? "grid lg:grid-cols-[1.1fr_0.9fr] gap-6" : "grid gap-6 max-w-2xl"}>
          {upiId && (
            <Card id="upi-support" className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border overflow-hidden shadow-none">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-obsidian-elevated border border-obsidian-border text-emerald-400 flex items-center justify-center">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Scan & pay — UPI</h2>
                    <p className="text-xs text-muted-foreground">GPay · PhonePe · Paytm · BHIM</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs font-semibold px-2 py-0.5 border-obsidian-border bg-obsidian-elevated text-foreground tabular-nums"
                  >
                    ₹{displayAmount}
                  </Badge>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  <div className="rounded-lg bg-white border border-obsidian-border p-3 shrink-0">
                    <img
                      src={qrUrl}
                      alt="UPI QR"
                      width={180}
                      height={180}
                      className="rounded block"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-4 w-full">
                    <div className="rounded-lg bg-obsidian-elevated border border-obsidian-border p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-muted-foreground">UPI ID</div>
                        <div className="text-xs font-medium text-foreground truncate">{upiId}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copy(upiId, "upi")}
                        className={`shrink-0 h-7 gap-1.5 px-3 rounded-md text-xs ${
                          copied === "upi"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15"
                            : ""
                        }`}
                      >
                        {copied === "upi" ? <Check size={12} /> : <Copy size={12} />}{" "}
                        {copied === "upi" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { k: "Fast", v: "Instant" },
                        { k: "Fee", v: "Zero" },
                        { k: "Secure", v: "UPI" },
                      ].map((s) => (
                        <div
                          key={s.k}
                          className="rounded-lg bg-obsidian-elevated border border-obsidian-border p-2"
                        >
                          <div className="text-[10px] font-medium text-muted-foreground">{s.k}</div>
                          <div className="text-xs font-semibold text-foreground mt-0.5">{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Open any UPI app → Scan → Pay ₹{displayAmount}. Your support appears instantly and 100% goes to infra & content.
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 md:px-8 py-3 bg-obsidian-elevated/40 border-t border-obsidian-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Sparkles size={12} className="text-muted-foreground" /> Thank you for keeping AlgoGuru free
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {hasOtherWays && (
              <Card className="rounded-[0.875rem] bg-obsidian-pane border-obsidian-border shadow-none">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard size={15} className="text-muted-foreground" /> Other ways
                  </h3>
                  <div className="mt-4 space-y-2">
                    {buyMeACoffeeUrl && (
                      <a
                        href={buyMeACoffeeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#FFDD00] flex items-center justify-center text-black">
                          <Coffee size={15} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-foreground">Buy Me a Coffee</div>
                          <div className="text-[11px] text-muted-foreground">Card · Apple Pay · Global</div>
                        </div>
                        <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                      </a>
                    )}
                    {razorpayUrl && (
                      <a
                        href={razorpayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#338dfc] flex items-center justify-center text-white">
                          <CreditCard size={15} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-foreground">Razorpay</div>
                          <div className="text-[11px] text-muted-foreground">UPI · Cards · Netbanking</div>
                        </div>
                        <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                      </a>
                    )}
                    {paypalUrl && (
                      <a
                        href={paypalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#003087] flex items-center justify-center text-white font-semibold text-sm">
                          P
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-foreground">PayPal</div>
                          <div className="text-[11px] text-muted-foreground">Any currency · Global</div>
                        </div>
                        <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                      </a>
                    )}
                    {cryptoAddress && (
                      <div className="p-3 rounded-lg border border-obsidian-border bg-obsidian-elevated">
                        <div className="text-[10px] font-medium text-muted-foreground">Crypto</div>
                        <div className="mt-1 text-xs font-mono break-all text-foreground">
                          {cryptoAddress}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copy(cryptoAddress, "crypto")}
                          className={`mt-2 h-7 gap-1.5 px-3 rounded-md text-xs ${
                            copied === "crypto"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15"
                              : ""
                          }`}
                        >
                          {copied === "crypto" ? <Check size={12} /> : <Copy size={12} />}{" "}
                          {copied === "crypto" ? "Copied" : "Copy address"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[0.875rem] border-obsidian-border bg-obsidian-pane shadow-none">
              <CardContent className="p-5">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Zap size={13} className="text-muted-foreground" /> Why support?
                </h4>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground leading-5">
                  <li>• Keeps AlgoGuru ad-free & fast</li>
                  <li>• Funds new DSA & System Design content</li>
                  <li>• Supports open-source & free for students</li>
                </ul>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
                >
                  Back to home →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 rounded-[0.875rem] border-obsidian-border bg-obsidian-pane shadow-none">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Have questions?{" "}
              <a
                href="mailto:support@algoguru.online"
                className="font-medium text-foreground hover:underline"
              >
                support@algoguru.online
              </a>
            </span>
            <span className="text-muted-foreground">Made with care in India</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
