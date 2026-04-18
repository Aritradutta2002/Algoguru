import { motion } from "framer-motion";
import { Heart, Coffee, ExternalLink, Zap, ArrowUpRight, Sparkles, Quote } from "lucide-react";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://portfolio-aritra-pearl.vercel.app/";
const GITHUB_URL = "https://github.com/Aritradutta2002";

const TESTIMONIALS = [
  "The explanations are clean, practical, and genuinely interview-focused.",
  "AlgoGuru makes Java revision feel fast, structured, and less overwhelming.",
  "The note-taking and solution flow feels way better than random tutorials.",
  "Beautiful UI, sharp content, and a platform that actually respects learners.",
  "I can revise theory, code, and notes in one place without getting lost.",
  "Simple, elegant, and useful every single day for interview preparation.",
] as const;

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const buyMeCoffeeUrl = import.meta.env.VITE_BUYMEACOFFEE_URL || "";

  const handleSupportClick = () => {
    if (buyMeCoffeeUrl) {
      window.open(buyMeCoffeeUrl, "_blank", "noopener,noreferrer");
      return;
    }

    onSupportClick();
  };

  const scrollingTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <footer
      className="relative w-full mt-24 overflow-hidden border-t-2"
      style={{
        borderColor: "hsl(var(--border))",
        background:
          "radial-gradient(circle at top left, hsl(var(--primary) / 0.12), transparent 26%), radial-gradient(circle at top right, hsl(var(--accent) / 0.1), transparent 22%), linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))",
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div
          className="rounded-[28px] border-2 p-6 md:p-8 lg:p-10"
          style={{
            borderColor: "hsl(var(--border) / 0.8)",
            background: "linear-gradient(180deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.72))",
            boxShadow: "0 24px 60px hsl(var(--background) / 0.28), 8px 8px 0 0 hsl(var(--border) / 0.55)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]"
                  style={{
                    borderColor: "hsl(var(--primary) / 0.25)",
                    background: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  <Sparkles size={12} />
                  Testimonials
                </span>
                <p className="text-sm font-semibold text-muted-foreground">
                  A clean footer with a moving wall of learner feedback.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl border-2 py-4"
                style={{
                  borderColor: "hsl(var(--border) / 0.75)",
                  background: "linear-gradient(180deg, hsl(var(--card) / 0.95), hsl(var(--muted) / 0.38))",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24"
                  style={{ background: "linear-gradient(90deg, hsl(var(--card)), transparent)" }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24"
                  style={{ background: "linear-gradient(270deg, hsl(var(--card)), transparent)" }}
                />
                <motion.div
                  className="flex gap-4 w-max px-4"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 28, ease: "linear", repeat: Infinity }}
                >
                  {scrollingTestimonials.map((testimonial, index) => (
                    <div
                      key={`${testimonial}-${index}`}
                      className="w-[280px] md:w-[340px] rounded-2xl border px-4 py-4 shrink-0"
                      style={{
                        borderColor: "hsl(var(--border) / 0.75)",
                        background: "hsl(var(--background) / 0.72)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3" style={{ color: "hsl(var(--primary))" }}>
                        <Quote size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em]">Learner Voice</span>
                      </div>
                      <p className="text-sm leading-7 font-medium text-muted-foreground">{testimonial}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 items-stretch">
              <div
                className="rounded-3xl border-2 p-6"
                style={{
                  borderColor: "hsl(var(--border) / 0.75)",
                  background: "linear-gradient(180deg, hsl(var(--card) / 0.95), hsl(var(--muted) / 0.34))",
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]"
                    style={{ background: "hsl(var(--accent) / 0.14)", color: "hsl(var(--accent))" }}
                  >
                    <ArrowUpRight size={12} />
                    Connect
                  </span>
                </div>
                <div className="grid gap-3">
                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border px-4 py-4 text-sm font-bold transition-colors hover:text-primary"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.68)" }}
                  >
                    <span>Portfolio</span>
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border px-4 py-4 text-sm font-bold transition-colors hover:text-primary"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.68)" }}
                  >
                    <span>GitHub</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div
                className="rounded-3xl border-2 p-6 md:p-7"
                style={{
                  borderColor: "hsl(var(--border) / 0.8)",
                  background: "linear-gradient(180deg, hsl(var(--card) / 0.96), hsl(var(--muted) / 0.45))",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]"
                    style={{ background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" }}
                  >
                    <Heart size={12} fill="currentColor" />
                    Community Supported
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <h3 className="text-2xl md:text-[30px] font-black uppercase leading-tight tracking-tight">
                    Buy Me A Coffee
                  </h3>
                  <p className="text-sm md:text-[15px] leading-7 font-medium text-muted-foreground">
                    If you enjoy the platform, you can support the project directly and help keep AlgoGuru polished,
                    free, and improving.
                  </p>
                </div>

                <motion.button
                  onClick={handleSupportClick}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group mt-6 w-full relative overflow-hidden rounded-2xl px-5 py-4 text-left"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    color: "hsl(var(--primary-foreground))",
                    border: "2px solid hsl(var(--border))",
                    boxShadow: "6px 6px 0 0 hsl(var(--border) / 0.85)",
                  }}
                >
                  <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.55) 45%, transparent 100%)",
                      transform: "translateX(-55%)",
                    }}
                  />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-black/10 p-2">
                        <Heart size={18} fill="#ff4d79" className="group-hover:animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-80">Support The Build</p>
                        <p className="text-base md:text-lg font-black uppercase tracking-[0.1em]">Buy Me A Coffee</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coffee size={18} />
                      <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </motion.button>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["Coffee", "Support", "Open Project"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{
                        borderColor: "hsl(var(--border) / 0.7)",
                        background: "hsl(var(--background) / 0.7)",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-10 border-t pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            style={{ borderColor: "hsl(var(--border) / 0.5)" }}
          >
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              © {currentYear} AlgoGuru. Designed with passion for developers who love to learn deeply.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="inline-flex items-center gap-1.5" style={{ color: "hsl(var(--success))" }}>
                <Zap size={12} fill="currentColor" />
                Built By Aritra
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted" />
              <span className="text-muted-foreground">Version 2.1.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted hidden sm:inline-block" />
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Back To Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
