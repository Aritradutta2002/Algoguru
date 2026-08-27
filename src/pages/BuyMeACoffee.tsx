import { useState } from "react";
import { Heart, Coffee, Sparkles, Zap, Shield, Gift, Users, Check, Copy, ExternalLink, CreditCard, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const UPI_ID = import.meta.env.VITE_UPI_ID || "your-upi@id";
const BUYMEACOFFEE_URL = import.meta.env.VITE_BUYMEACOFFEE_URL || "https://buymeacoffee.com/YourName";
const RAZORPAY_URL = import.meta.env.VITE_RAZORPAY_URL || "";
const PAYPAL_URL = import.meta.env.VITE_PAYPAL_URL || "";
const CRYPTO_ADDRESS = import.meta.env.VITE_CRYPTO_ADDRESS || "";

const TIERS = [
  { amount: 49, label: "A Coffee", desc: "One warm coffee", popular: false },
  { amount: 99, label: "Fuel", desc: "Keep the server on", popular: true },
  { amount: 199, label: "Boost", desc: "Ship a feature", popular: false },
  { amount: 499, label: "Sponsor", desc: "Sustain the build", popular: false },
];

export default function BuyMeACoffee() {
  const [amount, setAmount] = useState(99);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const displayAmount = custom ? parseInt(custom) || amount : amount;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=AlgoGuru%20Support&am=${displayAmount}&cu=INR&tn=Support%20AlgoGuru`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=220x220&bgcolor=ffffff&color=000000&margin=10`;

  const copy = (t: string, key: string) => {
    navigator.clipboard.writeText(t);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_15%_50%,hsl(var(--accent)/0.06),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                <Heart size={13} className="text-primary" /> Support the build
              </div>
              <h1 className="text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-5xl lg:text-6xl">
                Buy me a <span className="text-primary">coffee</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg max-w-2xl">
                AlgoGuru is free and indie-built. Your coffee keeps servers on, ships features faster, and funds high-quality interview content for everyone.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted border border-border text-xs font-medium text-foreground">
                  <Shield size={12} className="text-success" /> 100% for maintenance
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={12} /> 12k+ learners
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gift size={12} /> Open source
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[360px] shrink-0 rounded-2xl bg-card border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Coffee size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Quick support</div>
                  <div className="text-xs text-muted-foreground">UPI · Card · PayPal · Crypto</div>
                </div>
                <div className="ml-auto px-2 py-0.5 rounded-md bg-success/10 text-success text-xs font-medium">Live</div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.amount}
                    onClick={() => { setAmount(t.amount); setCustom(""); }}
                    className={`relative py-2.5 rounded-lg border text-sm font-medium transition-colors ${amount === t.amount && !custom ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-foreground hover:bg-muted"}`}
                  >
                    {t.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">Popular</span>}
                    ₹{t.amount}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 focus-within:border-primary focus-within:bg-background">
                <span className="text-muted-foreground">₹</span>
                <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" className="flex-1 bg-transparent py-2 outline-none text-sm" />
              </div>
              <a href={BUYMEACOFFEE_URL} target="_blank" rel="noreferrer" className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-95">
                <Coffee size={15} /> Support via Buy Me a Coffee <ExternalLink size={12} />
              </a>
              <p className="mt-2 text-center text-[10px] font-medium text-muted-foreground">Secure · One-time or monthly</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14 lg:px-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center"><QrCode size={18} /></div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Scan & pay — UPI</h2>
                  <p className="text-xs text-muted-foreground">GPay · PhonePe · Paytm · BHIM</p>
                </div>
                <div className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">₹{displayAmount}</div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="rounded-xl bg-white border border-border p-3 shrink-0">
                  <img src={qrUrl} alt="UPI QR" width={180} height={180} className="rounded-lg block" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0 space-y-4 w-full">
                  <div className="rounded-lg bg-muted/40 border border-border p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-muted-foreground">UPI ID</div>
                      <div className="text-sm font-medium text-foreground truncate">{UPI_ID}</div>
                    </div>
                    <button onClick={() => copy(UPI_ID, "upi")} className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${copied === "upi" ? "bg-success/10 border-success/30 text-success" : "bg-card border-border text-foreground hover:bg-muted"}`}>
                      {copied === "upi" ? <Check size={12} /> : <Copy size={12} />} {copied === "upi" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "Fast", v: "Instant" },
                      { k: "Fee", v: "Zero" },
                      { k: "Secure", v: "UPI" },
                    ].map((s) => (
                      <div key={s.k} className="rounded-lg bg-muted border border-border p-2.5">
                        <div className="text-[10px] font-medium text-muted-foreground">{s.k}</div>
                        <div className="text-sm font-semibold text-foreground mt-0.5">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Open any UPI app → Scan → Pay ₹{displayAmount}. Your support appears instantly and 100% goes to infra & content.</p>
                </div>
              </div>
            </div>
            <div className="px-6 md:px-8 py-3 bg-muted/30 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles size={12} className="text-primary" /> Thank you for keeping AlgoGuru free
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><CreditCard size={15} className="text-muted-foreground" /> Other ways</h3>
              <div className="mt-4 space-y-2">
                <a href={BUYMEACOFFEE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[#FFDD00] flex items-center justify-center text-black"><Coffee size={16} /></div>
                  <div className="flex-1"><div className="text-sm font-medium text-foreground">Buy Me a Coffee</div><div className="text-xs text-muted-foreground">Card · Apple Pay · Global</div></div>
                  <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                </a>
                {RAZORPAY_URL && (
                  <a href={RAZORPAY_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-[#338dfc] flex items-center justify-center text-white"><CreditCard size={16} /></div>
                    <div className="flex-1"><div className="text-sm font-medium text-foreground">Razorpay</div><div className="text-xs text-muted-foreground">UPI · Cards · Netbanking</div></div>
                    <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                  </a>
                )}
                {PAYPAL_URL && (
                  <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center text-white font-semibold">P</div>
                    <div className="flex-1"><div className="text-sm font-medium text-foreground">PayPal</div><div className="text-xs text-muted-foreground">Any currency · Global</div></div>
                    <ExternalLink size={13} className="text-muted-foreground group-hover:text-foreground" />
                  </a>
                )}
                {CRYPTO_ADDRESS && (
                  <div className="p-3 rounded-lg border border-border bg-muted/40">
                    <div className="text-[10px] font-medium text-muted-foreground">Crypto</div>
                    <div className="mt-1.5 text-xs font-mono break-all text-foreground">{CRYPTO_ADDRESS}</div>
                    <button onClick={() => copy(CRYPTO_ADDRESS, "crypto")} className={`mt-2 inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border transition-colors ${copied === "crypto" ? "bg-success/10 border-success/30 text-success" : "bg-card border-border text-foreground hover:bg-muted"}`}>
                      {copied === "crypto" ? <Check size={12} /> : <Copy size={12} />} {copied === "crypto" ? "Copied" : "Copy address"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-foreground text-background p-6">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Zap size={13} className="text-primary" /> Why support?</h4>
              <ul className="mt-3 space-y-1.5 text-sm leading-6">
                <li>• Keeps AlgoGuru ad-free & fast</li>
                <li>• Funds new DSA & System Design content</li>
                <li>• Supports open-source & free for students</li>
              </ul>
              <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium opacity-80 hover:opacity-100">Back to home →</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Have questions? <a href="mailto:support@algoguru.online" className="font-medium text-foreground hover:underline">support@algoguru.online</a></span>
          <span className="text-muted-foreground">Made with care in India</span>
        </div>
      </div>
    </div>
  );
}
