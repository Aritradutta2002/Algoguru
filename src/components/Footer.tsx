import { motion } from "framer-motion";
import { Heart, Coffee, ExternalLink, Zap, ArrowUpRight, Sparkles, BookOpen, Code2 } from "lucide-react";
import { AlgoGuruLogo } from "./AlgoGuruLogo";

interface FooterProps {
  onSupportClick: () => void;
}

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

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
          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.8fr] gap-8 xl:gap-10 items-start">
            <div className="space-y-8">
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
                  Crafted For Builders
                </span>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]"
                  style={{
                    borderColor: "hsl(var(--success) / 0.25)",
                    background: "hsl(var(--success) / 0.08)",
                    color: "hsl(var(--success))",
                  }}
                >
                  100% Free Learning
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div
                  className="rounded-3xl border-2 p-6"
                  style={{
                    borderColor: "hsl(var(--border) / 0.75)",
                    background: "linear-gradient(180deg, hsl(var(--card) / 0.96), hsl(var(--muted) / 0.35))",
                  }}
                >
                  <div
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  >
                    <div
                      className="rounded-2xl border-2 p-2.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--background) / 0.8)",
                        boxShadow: "4px 4px 0 0 hsl(var(--border) / 0.5)",
                      }}
                    >
                      <AlgoGuruLogo size={34} showText={false} />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-[28px] font-black uppercase tracking-[0.14em] leading-none">
                        AlgoGuru
                      </h2>
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                        The Unapologetic Dev Platform
                      </span>
                    </div>
                  </div>

                  <p className="mt-6 max-w-xl text-[15px] md:text-base leading-8 font-medium text-muted-foreground">
                    Helping developers master DSA and Java through clarity, pattern recognition, and deep understanding,
                    not blind memorization. Built to feel sharp, focused, and genuinely useful every day.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="/practice"
                      className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors hover:text-primary"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--background) / 0.65)",
                      }}
                    >
                      <Code2 size={13} />
                      Practice
                    </a>
                    <a
                      href="/interview/java/core-java-qa"
                      className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors hover:text-primary"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--background) / 0.65)",
                      }}
                    >
                      <BookOpen size={13} />
                      Core Java
                    </a>
                    <a
                      href="/notes"
                      className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors hover:text-primary"
                      style={{
                        borderColor: "hsl(var(--border))",
                        background: "hsl(var(--background) / 0.65)",
                      }}
                    >
                      <ArrowUpRight size={13} />
                      My Notes
                    </a>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div
                    className="rounded-3xl border-2 p-5"
                    style={{
                      borderColor: "hsl(var(--border) / 0.75)",
                      background: "hsl(var(--background) / 0.55)",
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Connect</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <a
                        href="https://portfolio-aritra-pearl.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors hover:text-primary"
                        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card) / 0.7)" }}
                      >
                        <span>Portfolio</span>
                        <ExternalLink size={14} />
                      </a>
                      <a
                        href="https://github.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors hover:text-primary"
                        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card) / 0.7)" }}
                      >
                        <span>GitHub</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl border-2 p-5"
                    style={{
                      borderColor: "hsl(var(--border) / 0.75)",
                      background: "linear-gradient(180deg, hsl(var(--accent) / 0.12), hsl(var(--background) / 0.45))",
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Why It Matters</p>
                    <p className="mt-3 text-sm leading-7 font-medium text-muted-foreground">
                      Clean explanations, practical code, structured revision, and a platform that stays open for everyone.
                    </p>
                  </div>
                </div>
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
                  Keep AlgoGuru Open, Fast, and Beautiful
                </h3>
                <p className="text-sm md:text-[15px] leading-7 font-medium text-muted-foreground">
                  No paywalls, no clutter, no ads-first design. If AlgoGuru helps you learn better, you can support the
                  project and help us keep the content free for everyone.
                </p>
              </div>

              <motion.button
                onClick={onSupportClick}
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
                      <p className="text-base md:text-lg font-black uppercase tracking-[0.1em]">Fuel The Project</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee size={18} />
                    <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.button>

              <div className="mt-4 flex flex-wrap gap-2">
                {["UPI", "Cards", "Crypto", "Supporters Welcome"].map((item) => (
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
