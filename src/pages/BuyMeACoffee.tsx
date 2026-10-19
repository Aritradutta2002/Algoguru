import { useState } from "react";
import {
  Heart,
  Coffee,
  Sparkles,
  Zap,
  Shield,
  Gift,
  Users,
  Check,
  Copy,
  ExternalLink,
  CreditCard,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  Section,
  SectionHeading,
  Surface,
  Pill,
} from "@/components/layout/PagePrimitives";

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

/* One UPI QR panel, shared by the hero card and the UPI section. The QR
   encodes the currently selected amount, so both instances stay in sync. */
function UpiQr({ src, size }: { src: string; size: number }) {
  return (
    <div className="shrink-0 rounded-surface border border-border bg-white p-2.5">
      <img
        src={src}
        alt="UPI QR code for the selected amount"
        width={size}
        height={size}
        className="block rounded-[calc(var(--radius-control)-0.25rem)]"
        loading="lazy"
      />
    </div>
  );
}

/* A secondary payment channel — neutral surface, brand-mark tile only. */
function PaymentLink({
  href,
  name,
  detail,
  mark,
  markClassName,
}: {
  href: string;
  name: string;
  detail: string;
  mark: React.ReactNode;
  markClassName: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-control border border-border bg-card p-3 transition-colors hover:border-border-strong hover:bg-muted/40"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control border font-semibold ${markClassName}`}
      >
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{name}</span>
        <span className="ui-meta block">{detail}</span>
      </span>
      <ExternalLink
        size={13}
        className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      />
    </a>
  );
}

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
    <div className="ui-app-canvas">
      <PageShell>
        <PageHeader
          variant="display"
          kicker="Support the build"
          title={
            <>
              Buy me a <span className="text-primary">coffee</span>
            </>
          }
          description="AlgoGuru is free and indie-built. Your coffee keeps servers on, ships features faster, and funds high-quality interview content for everyone."
          meta={
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Pill tone="success">
                <Shield size={12} /> 100% for maintenance
              </Pill>
              <span className="ui-meta inline-flex items-center gap-1.5">
                <Users size={12} /> 12k+ learners
              </span>
              <span className="ui-meta inline-flex items-center gap-1.5">
                <Gift size={12} /> Open source
              </span>
            </div>
          }
          actions={
            <Surface padding="md" className="w-full sm:w-[22rem]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-muted/60 text-primary">
                  <Coffee size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    Quick support
                  </div>
                  <div className="ui-meta">UPI · Card · PayPal · Crypto</div>
                </div>
                <Pill tone="success" className="ml-auto">
                  Live
                </Pill>
              </div>

              <div className="mt-7 grid grid-cols-4 gap-2">
                {TIERS.map((t) => {
                  const active = amount === t.amount && !custom;
                  return (
                    <button
                      key={t.amount}
                      type="button"
                      onClick={() => {
                        setAmount(t.amount);
                        setCustom("");
                      }}
                      aria-pressed={active}
                      className={`relative rounded-control border py-2.5 font-mono text-sm font-medium tabular-nums transition-colors ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:border-border-strong hover:bg-muted/50"
                      }`}
                    >
                      {t.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                          Popular
                        </span>
                      )}
                      ₹{t.amount}
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

              <div className="mt-4 flex items-center gap-4 rounded-control border border-border bg-muted/30 p-3">
                <UpiQr src={qrUrl} size={72} />
                <div className="min-w-0">
                  <div className="ui-meta">Or scan to pay</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    ₹{displayAmount} via UPI
                  </div>
                  <div className="ui-meta mt-0.5">GPay · PhonePe · Paytm</div>
                </div>
              </div>

              <Button variant="solid" size="cta" className="mt-4 w-full" asChild>
                <a href={BUYMEACOFFEE_URL} target="_blank" rel="noreferrer">
                  <Coffee size={15} /> Support via Buy Me a Coffee
                  <ExternalLink size={12} />
                </a>
              </Button>
              <p className="ui-meta mt-2 text-center">
                Secure · One-time or monthly
              </p>
            </Surface>
          }
        />

        <Section spacing="compact">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* ── UPI / QR ───────────────────────────────────────── */}
            <Surface padding="none" className="h-fit overflow-hidden">
              <div className="p-5 md:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-muted/60 text-success">
                    <QrCode size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="ui-h3">Scan &amp; pay — UPI</h2>
                    <p className="ui-meta">GPay · PhonePe · Paytm · BHIM</p>
                  </div>
                  <Pill mono className="ml-auto text-foreground">
                    ₹{displayAmount}
                  </Pill>
                </div>

                <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <UpiQr src={qrUrl} size={180} />
                  <div className="w-full min-w-0 flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-muted/40 p-3.5">
                      <div className="min-w-0">
                        <div className="ui-meta">UPI ID</div>
                        <div className="truncate font-mono text-sm text-foreground">
                          {UPI_ID}
                        </div>
                      </div>
                      <Button
                        variant="line"
                        size="sm"
                        onClick={() => copy(UPI_ID, "upi")}
                        className="shrink-0"
                      >
                        {copied === "upi" ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
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
                          className="rounded-control border border-border p-2.5"
                        >
                          <div className="ui-meta">{s.k}</div>
                          <div className="mt-0.5 text-sm font-medium text-foreground">
                            {s.v}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="ui-meta leading-5">
                      Open any UPI app → Scan → Pay ₹{displayAmount}. Your
                      support appears instantly and 100% goes to infra &amp;
                      content.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/30 px-5 py-3 md:px-7">
                <Sparkles size={12} className="text-primary" />
                <span className="ui-meta">
                  Thank you for keeping AlgoGuru free
                </span>
              </div>
            </Surface>

            {/* ── Other channels + why ───────────────────────────── */}
            <div className="space-y-4">
              <Surface>
                <h3 className="ui-h3 flex items-center gap-2">
                  <CreditCard size={15} className="text-muted-foreground" />
                  Other ways
                </h3>
                <div className="mt-4 space-y-2">
                  <PaymentLink
                    href={BUYMEACOFFEE_URL}
                    name="Buy Me a Coffee"
                    detail="Card · Apple Pay · Global"
                    mark={<Coffee size={16} />}
                    markClassName="border-[#FFDD00]/40 bg-[#FFDD00] text-black"
                  />
                  {RAZORPAY_URL && (
                    <PaymentLink
                      href={RAZORPAY_URL}
                      name="Razorpay"
                      detail="UPI · Cards · Netbanking"
                      mark={<CreditCard size={16} />}
                      markClassName="border-[#338dfc]/40 bg-[#338dfc] text-white"
                    />
                  )}
                  {PAYPAL_URL && (
                    <PaymentLink
                      href={PAYPAL_URL}
                      name="PayPal"
                      detail="Any currency · Global"
                      mark="P"
                      markClassName="border-[#003087]/40 bg-[#003087] text-white"
                    />
                  )}
                  <PaymentLink
                    href={`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=AlgoGuru%20Support`}
                    name="Any UPI app"
                    detail="Direct · Zero fee · India"
                    mark={<QrCode size={16} />}
                    markClassName="bg-muted/60 text-foreground"
                  />
                  {CRYPTO_ADDRESS && (
                    <div className="rounded-control border border-border bg-muted/40 p-3">
                      <div className="ui-meta">Crypto</div>
                      <div className="mt-1.5 break-all font-mono text-xs text-foreground">
                        {CRYPTO_ADDRESS}
                      </div>
                      <Button
                        variant="line"
                        size="sm"
                        onClick={() => copy(CRYPTO_ADDRESS, "crypto")}
                        className="mt-2"
                      >
                        {copied === "crypto" ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copied === "crypto" ? "Copied" : "Copy address"}
                      </Button>
                    </div>
                  )}
                </div>
              </Surface>

              <Surface inverse>
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Zap size={13} className="text-primary" /> Why support?
                </h4>
                <ul className="mt-3 space-y-1.5 text-sm leading-6 opacity-85">
                  <li>Keeps AlgoGuru ad-free &amp; fast</li>
                  <li>Funds new DSA &amp; System Design content</li>
                  <li>Supports open source &amp; free for students</li>
                </ul>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
                >
                  Back to home <ArrowRight size={12} />
                </Link>
              </Surface>
            </div>
          </div>
        </Section>

        <Section spacing="compact">
          <Surface
            padding="sm"
            className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left"
          >
            <span className="ui-meta">
              Have questions?{" "}
              <a
                href="mailto:support@algoguru.online"
                className="font-medium text-foreground hover:underline"
              >
                support@algoguru.online
              </a>
            </span>
            <span className="ui-meta inline-flex items-center gap-1.5">
              <Heart size={11} className="text-primary" /> Made with care in
              India
            </span>
          </Surface>
        </Section>
      </PageShell>
    </div>
  );
}
