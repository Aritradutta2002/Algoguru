import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Play, Shuffle } from "lucide-react";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { HeroWorkspacePreview } from "./HeroWorkspacePreview";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HERO_STATS = [
  { value: 500, suffix: "+", label: "Curated problems" },
  { value: 40, suffix: "+", label: "Deep-dive topics" },
  { value: 6, suffix: "", label: "Learning paths" },
  { value: 100, suffix: "%", label: "Free forever" },
] as const;

const TRUST_ITEMS = [
  "Structured paths",
  "Interview-ready practice",
  "Learn at your pace",
] as const;

interface HeroSectionProps {
  onExplore: () => void;
  onQuiz: () => void;
  onOpenRoadmap: () => void;
}

export function HeroSection({ onExplore, onQuiz, onOpenRoadmap }: HeroSectionProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || reduceMotion) return;

    const el = heroRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--hero-x", `${x}px`);
      el.style.setProperty("--hero-y", `${y}px`);
    });
  };

  const rise = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <section
      ref={heroRef}
      aria-labelledby="landing-heading"
      onPointerMove={handlePointerMove}
      className="landing-hero hero-shell relative overflow-hidden border-b border-border/60"
    >
      <div className="hero-atmosphere pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="hero-mesh absolute inset-0" />
        <div className="hero-grid bg-grid absolute inset-0" />
        <div className="aurora-blob left-[8%] top-[16%] h-72 w-72 bg-primary/10" />
        <div
          className="aurora-blob right-[2%] top-0 h-96 w-96 bg-cyan-400/10"
          style={{ animationDelay: "-7s", animationDuration: "28s" }}
        />
        <div
          className="aurora-blob bottom-[-12%] left-[46%] h-80 w-80 bg-indigo-500/10"
          style={{ animationDelay: "-13s", animationDuration: "32s" }}
        />
        <div className="hero-cursor-glow absolute inset-0" />
        <div className="bg-noise absolute inset-0" />
        <div className="hero-vignette absolute inset-0" />
      </div>

      <div className="landing-hero-layout hero-layout relative mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:items-center lg:gap-12 lg:px-12 xl:gap-16 xl:px-16 xl:py-24">
        <div className="hero-copy min-w-0">
          <motion.div
            {...rise(0.02)}
            className="hero-eyebrow inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-muted-foreground"
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            The focused workspace for engineers
            <span className="hero-eyebrow-divider hidden h-3 w-px bg-border/80 sm:block" aria-hidden="true" />
            <span className="hero-eyebrow-tag hidden text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:inline">
              Free forever
            </span>
          </motion.div>

          <motion.h1
            id="landing-heading"
            {...rise(0.08)}
            className="hero-headline mt-7 max-w-2xl font-display font-bold"
          >
            <span className="hero-headline-line">Build skills.</span>
            <span className="hero-headline-line">Solve smarter.</span>
            <span className="hero-headline-line">
              <span className="hero-gradient-text">Interview ready.</span>
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.14)}
            className="hero-subcopy mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8"
          >
            Turn your next focused session into real progress. Master DSA,
            explore system design, and practice for your next interview — all in
            one workspace.
          </motion.p>

          <motion.div {...rise(0.2)} className="hero-cta-row mt-9 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onExplore}
              className="landing-primary hero-cta-primary button-shine group inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-[15px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99]"
            >
              Explore learning paths
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => navigate("/playground")}
              className="hero-cta-secondary group inline-flex items-center gap-2.5 rounded-xl px-5 py-4 text-[15px] font-semibold text-foreground transition-all duration-300 ease-premium hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99]"
            >
              <span className="hero-play-tile flex h-7 w-7 items-center justify-center rounded-lg">
                <Play size={13} fill="currentColor" aria-hidden="true" />
              </span>
              Open playground
            </button>
          </motion.div>

          <motion.p
            {...rise(0.24)}
            className="hero-cta-note mt-4 text-[11.5px] font-medium text-muted-foreground/80"
          >
            Free forever
            <span className="mx-1.5 text-muted-foreground/40" aria-hidden="true">·</span>
            No credit card
            <span className="mx-1.5 text-muted-foreground/40" aria-hidden="true">·</span>
            Built for focused practice
          </motion.p>

          <motion.div
            {...rise(0.28)}
            className="hero-trust mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] font-medium text-muted-foreground"
          >
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="hero-trust-item inline-flex items-center gap-2">
                <span className="hero-check flex h-5 w-5 items-center justify-center rounded-full">
                  <Check size={11} strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </span>
            ))}
            <button
              type="button"
              onClick={onQuiz}
              className="hero-quiz-link group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold text-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shuffle size={14} className="text-primary" aria-hidden="true" />
              Or take a 10-question quiz
            </button>
          </motion.div>

          <motion.div
            {...rise(0.34)}
            className="hero-stats mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 pt-7 sm:grid-cols-4"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <p className="hero-stat-value font-display font-bold tracking-tight text-foreground">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="hero-stat-label mt-1 text-[12px] font-medium leading-snug text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <HeroWorkspacePreview
          reduceMotion={reduceMotion}
          onOpenRoadmap={onOpenRoadmap}
        />
      </div>
    </section>
  );
}
