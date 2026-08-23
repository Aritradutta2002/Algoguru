import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Coffee, Sparkles, Zap, Shield, Gift, Users, Check, Copy, ExternalLink, CreditCard, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const UPI_ID = import.meta.env.VITE_UPI_ID || "your-upi@id";
const BUYMEACOFFEE_URL = import.meta.env.VITE_BUYMEACOFFEE_URL || "https://buymeacoffee.com/YourName";
const RAZORPAY_URL = import.meta.env.VITE_RAZORPAY_URL || "";
const PAYPAL_URL = import.meta.env.VITE_PAYPAL_URL || "";
const CRYPTO_ADDRESS = import.meta.env.VITE_CRYPTO_ADDRESS || "";

const TIERS = [
  { amount: 49, label: "A Coffee", desc: "One warm coffee", popular: false, color: "from-amber-400 to-orange-400" },
  { amount: 99, label: "Fuel", desc: "Keep the server on", popular: true, color: "from-orange-500 to-rose-500" },
  { amount: 199, label: "Boost", desc: "Ship a feature", popular: false, color: "from-purple-500 to-indigo-500" },
  { amount: 499, label: "Sponsor", desc: "Sustain the build", popular: false, color: "from-emerald-500 to-teal-500" },
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
    <div className="min-h-screen bg-[#fcfcf8] dark:bg-[#0a0a0a] selection:bg-amber-500/20">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

      {/* HERO — full width, warm, best looking */}
      <div className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-rose-500/[0.07] dark:from-amber-500/[0.10] dark:to-rose-500/[0.08]" />
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-amber-400/10 blur-[90px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-orange-400/10 blur-[90px] rounded-full" />
        <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8 py-10 md:py-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-black tracking-widest uppercase shadow-md">
                <Heart size={12} fill="white" /> Support the Build
              </div>
              <h1 className="mt-4 text-[32px] md:text-[44px] font-black tracking-tight leading-[0.9] text-zinc-900 dark:text-white">
                Buy Me a <span className="text-amber-500">Coffee</span>
              </h1>
              <p className="mt-3 text-[15px] md:text-[16px] leading-7 text-zinc-600 dark:text-zinc-300 max-w-2xl font-medium">
                AlgoGuru is free and indie-built. Your coffee keeps servers on, ships features faster, and funds high-quality interview content for everyone.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">
                  <Shield size={13} /> 100% for maintenance
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <Users size={12} /> 12k+ learners
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <Gift size={12} /> Open source
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[380px] shrink-0 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                  <Coffee size={22} />
                </div>
                <div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white">Quick Support</div>
                  <div className="text-xs font-medium text-zinc-500">UPI · Card · PayPal · Crypto</div>
                </div>
                <div className="ml-auto px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">Live</div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.amount}
                    onClick={() => { setAmount(t.amount); setCustom(""); }}
                    className={`relative py-3 rounded-2xl border text-sm font-black transition-all ${amount === t.amount && !custom ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"}`}
                  >
                    {t.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white">★ Popular</span>}
                    ₹{t.amount}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3">
                <span className="text-sm font-black text-zinc-500">₹</span>
                <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount" className="flex-1 bg-transparent py-2.5 outline-none text-sm font-bold placeholder:text-zinc-400" />
              </div>
              <a href={BUYMEACOFFEE_URL} target="_blank" rel="noreferrer" className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FFDD00] text-black text-sm font-black hover:brightness-95 transition-all">
                <Coffee size={16} /> Support via Buy Me a Coffee <ExternalLink size={13} />
              </a>
              <p className="mt-2 text-center text-[10px] font-bold tracking-widest uppercase text-zinc-400">Secure · One-time or monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT — full width util, 3 columns */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8">
          {/* LEFT — QR + UPI */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center"><QrCode size={18} /></div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white">Scan & Pay — UPI</h2>
                  <p className="text-xs font-medium text-zinc-500">GPay · PhonePe · Paytm · BHIM</p>
                </div>
                <div className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">₹{displayAmount}</div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="rounded-3xl bg-white border border-zinc-200 p-3 shadow-lg shrink-0">
                  <img src={qrUrl} alt="UPI QR" width={190} height={190} className="rounded-xl block" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0 space-y-4 w-full">
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500">UPI ID</div>
                      <div className="text-sm font-black text-zinc-900 dark:text-white truncate">{UPI_ID}</div>
                    </div>
                    <button onClick={() => copy(UPI_ID, "upi")} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${copied === "upi" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"}`}>
                      {copied === "upi" ? <Check size={12} /> : <Copy size={12} />} {copied === "upi" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "Fast", v: "Instant" },
                      { k: "Fee", v: "Zero" },
                      { k: "Secure", v: "UPI" },
                    ].map((s) => (
                      <div key={s.k} className="rounded-2xl bg-amber-500 text-white p-3">
                        <div className="text-[10px] font-black tracking-widest uppercase opacity-90">{s.k}</div>
                        <div className="text-sm font-black">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400 font-medium">Open any UPI app → Scan → Pay ₹{displayAmount}. Your support appears instantly and 100% goes to infra & content.</p>
                </div>
              </div>
            </div>
            <div className="px-6 md:px-8 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-[11px] font-black tracking-widest uppercase text-zinc-500">
              <Sparkles size={12} className="text-amber-500" /> Thank you for keeping AlgoGuru free
            </div>
          </div>

          {/* RIGHT — other gateways */}
          <div className="space-y-4">
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2"><CreditCard size={16} className="text-zinc-500" /> Other ways</h3>
              <div className="mt-4 space-y-3">
                <a href={BUYMEACOFFEE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-[#FFDD00]/30 bg-[#FFDD00]/10 hover:bg-[#FFDD00]/15 transition-colors group">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFDD00] flex items-center justify-center text-black shadow"><Coffee size={18} /></div>
                  <div className="flex-1"><div className="text-sm font-black text-zinc-900 dark:text-white">Buy Me a Coffee</div><div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Card · Apple Pay · Global</div></div>
                  <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                </a>
                {RAZORPAY_URL && (
                  <a href={RAZORPAY_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-[#338dfc]/30 bg-[#338dfc]/10 hover:bg-[#338dfc]/15 transition-colors group">
                    <div className="w-11 h-11 rounded-2xl bg-[#338dfc] flex items-center justify-center text-white shadow"><CreditCard size={18} /></div>
                    <div className="flex-1"><div className="text-sm font-black text-zinc-900 dark:text-white">Razorpay</div><div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">UPI · Cards · Netbanking</div></div>
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                  </a>
                )}
                {PAYPAL_URL && (
                  <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-[#003087]/20 bg-[#003087]/10 hover:bg-[#003087]/15 transition-colors group">
                    <div className="w-11 h-11 rounded-2xl bg-[#003087] flex items-center justify-center text-white font-black italic shadow">P</div>
                    <div className="flex-1"><div className="text-sm font-black text-zinc-900 dark:text-white">PayPal</div><div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Any currency · Global</div></div>
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                  </a>
                )}
                {CRYPTO_ADDRESS && (
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <div className="text-xs font-black tracking-widest uppercase text-zinc-500">Crypto</div>
                    <div className="mt-2 text-xs font-mono break-all text-zinc-700 dark:text-zinc-300">{CRYPTO_ADDRESS}</div>
                    <button onClick={() => copy(CRYPTO_ADDRESS, "crypto")} className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${copied === "crypto" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"}`}>
                      {copied === "crypto" ? <Check size={12} /> : <Copy size={12} />} {copied === "crypto" ? "Copied" : "Copy address"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-6">
              <h4 className="text-sm font-black flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Why support?</h4>
              <ul className="mt-3 space-y-2 text-sm leading-6 font-medium opacity-90">
                <li>• Keeps AlgoGuru ad-free & fast</li>
                <li>• Funds new DSA & System Design content</li>
                <li>• Supports open-source & free for students</li>
              </ul>
              <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-xs font-black tracking-widest uppercase opacity-80 hover:opacity-100">Back to home →</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">Have questions? <a href="mailto:support@algoguru.online" className="font-bold text-zinc-900 dark:text-white hover:underline">support@algoguru.online</a></span>
          <span className="font-black tracking-widest uppercase text-zinc-400">Made with ♥ in India</span>
        </div>
      </div>
    </div>
  );
}
