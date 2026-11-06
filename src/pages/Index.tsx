import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import "@/styles/landing.css";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  Code2,
  Coffee,
  Layers,
  Map as MapIcon,
  MousePointerClick,
  PanelLeft,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { QuizSection } from "@/components/quiz/QuizSection";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { HeroSection } from "@/components/landing/HeroSection";
import { WorkspaceDemoSection } from "@/components/landing/WorkspaceDemoSection";
import { useHomeSidebar } from "@/contexts/HomeSidebarContext";
import { cn } from "@/lib/utils";

const RoadmapFullscreenOverlay = lazy(() =>
  import("@/components/roadmap/RoadmapFullscreenOverlay").then((module) => ({
    default: module.RoadmapFullscreenOverlay,
  })),
);

const SECTIONS = [
  {
    id: "advanced-java",
    title: "Advanced Java",
    subtitle: "Master the deep end",
    desc: "Reflection, JVM internals, garbage collection, design patterns, and modern Java 17+ features — the theory interviewers actually ask about.",
    icon: Coffee,
    tone: "cobalt",
    tag: "Java Theory",
    route: "/java-advanced",
    stats: "9 Deep Topics",
  },
  {
    id: "interview",
    title: "DSA Sheets",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, system design patterns, and behavioral frameworks to crush technical interviews.",
    icon: Target,
    tone: "cyan",
    tag: "DSA Sheets",
    route: "/practice",
    stats: "500+ Questions",
  },
  {
    id: "codechef",
    title: "Data Structures",
    subtitle: "Pattern-based mastery",
    desc: "A curated collection of essential coding interview problems categorized by sub-patterns and topics.",
    icon: Code2,
    tone: "cyan",
    tag: "Playlist",
    route: "/arrays",
    stats: "Pattern Wise Problems",
  },
  {
    id: "leetcode",
    title: "System Design",
    subtitle: "Scale to millions",
    desc: "Learn system design patterns to build scalable architectures and crush your interviews.",
    icon: BrainCircuit,
    tone: "cobalt",
    tag: "System Design",
    route: "/interview/java/system-design",
    stats: "4 Learning Paths",
  },
  {
    id: "interview-prep",
    title: "Interview",
    subtitle: "Guided preparation",
    desc: "Real insights from candidates who recently interviewed at top tech companies. Learn what to expect.",
    icon: Trophy,
    tone: "cyan",
    tag: "Experiences",
    route: "/interview",
    stats: "Real Stories",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    subtitle: "Solve today's problem",
    desc: "A fresh LeetCode problem every day, with a built-in Java editor to craft and test your solution.",
    icon: CalendarDays,
    tone: "amber",
    tag: "Today",
    route: "/problem-solver",
    stats: "Updated Daily",
  },
] as const;

const CARD_TONES = {
  cobalt: {
    tile: "border-primary/25 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  cyan: {
    tile: "border-cyan-500/25 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  amber: {
    tile: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
} as const;

const HOW_IT_WORKS = [
  {
    icon: <MousePointerClick size={20} />,
    title: "Pick a path",
    desc: "Choose a structured track — DSA, System Design, Java, or Interview prep.",
  },
  {
    icon: <Layers size={20} />,
    title: "Learn by pattern",
    desc: "Master concepts grouped by the patterns interviews actually test.",
  },
  {
    icon: <Zap size={20} />,
    title: "Practice & ship",
    desc: "Solve in the built-in editor and walk in ready to perform.",
  },
] as const;

const PROOF_POINTS = [
  {
    icon: Code2,
    label: "Practice in your browser",
    detail: "No setup, no installs",
  },
  {
    icon: Layers,
    label: "Learn patterns, not answers",
    detail: "Deeper intuition, faster recall",
  },
  {
    icon: MapIcon,
    label: "Follow a clear roadmap",
    detail: "Always know what comes next",
  },
] as const;

export default function Index() {
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const openRoadmap = () => setRoadmapOpen(true);
  const { homeSidebarOpen, toggleHomeSidebar } = useHomeSidebar();

  const scrollToSection = (id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="landing-page relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/25">
        <HeroSection
          onExplore={() => scrollToSection("modules")}
          onQuiz={() => scrollToSection("quiz")}
          onOpenRoadmap={openRoadmap}
        />

        <Reveal className="relative border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_140%_at_50%_0%,hsl(var(--primary)/0.09),transparent_74%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 lg:px-16">
            <p className="flex items-center gap-2.5 font-display text-[13.5px] font-semibold tracking-[-0.01em] text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" aria-hidden="true" />
              Less tab switching. More progress.
            </p>
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-0">
              {PROOF_POINTS.map(({ icon: Icon, label, detail }, index) => (
                <div
                  key={label}
                  className={cn(
                    "group flex items-start gap-3",
                    index > 0 && "sm:border-l sm:border-border/70 sm:pl-6",
                    index < PROOF_POINTS.length - 1 && "sm:pr-6",
                  )}
                >
                  <span className="icon-tile h-9 w-9 shrink-0 text-primary transition-all duration-300 ease-premium group-hover:-translate-y-0.5 group-hover:border-primary/35">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold leading-5 text-foreground/90">{label}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── LEARNING PATHS ───────────────────────────────────────────── */}
        <section
          id="modules"
          aria-labelledby="modules-heading"
          className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28 lg:px-16"
        >
          <Reveal className="mb-12 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Learning paths
              </p>
              <h2
                id="modules-heading"
                className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-[3.3rem]"
              >
                Choose where to focus next.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Concise, practical material built around the skills that matter in
                real interviews — no fluff, just momentum.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleHomeSidebar}
              aria-expanded={homeSidebarOpen}
              className="group hidden w-fit items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-4 py-2.5 text-[12.5px] font-semibold text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary/30 hover:bg-card hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
            >
              <PanelLeft
                size={14}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              {homeSidebarOpen ? "Hide library panel" : "Open library panel"}
            </button>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const tone = CARD_TONES[section.tone];
              return (
                <Reveal key={section.id} delay={index * 0.055} from="bottom">
                  <SpotlightCard
                    interactive
                    className="landing-path-card path-card-sweep group h-full min-h-[290px] rounded-3xl focus-within:border-primary/40"
                  >
                    <Link
                      to={section.route}
                      className="relative flex h-full min-h-[290px] flex-col rounded-3xl p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="mb-7 flex items-start justify-between">
                        <div
                          className={cn(
                            "flex h-[52px] w-[52px] items-center justify-center rounded-2xl border shadow-soft transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-105",
                            tone.tile,
                          )}
                        >
                          <Icon size={23} />
                        </div>
                        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          {section.tag}
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                          {section.subtitle}
                        </p>
                        <h3 className="font-display text-[1.45rem] font-bold leading-tight tracking-[-0.025em]">
                          {section.title}
                        </h3>
                        <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
                          {section.desc}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-5">
                        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
                          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/55">
                            0{index + 1}
                          </span>
                          <span className="h-3 w-px bg-border" aria-hidden="true" />
                          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                          {section.stats}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-300 ease-premium group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight
                            size={15}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:rotate-45"
                          />
                        </span>
                      </div>
                    </Link>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── INTERACTIVE WORKSPACE DEMO ───────────────────────────────── */}
        <WorkspaceDemoSection />

        {/* ── QUIZ ─────────────────────────────────────────────────────── */}
        <QuizSection />

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section className="relative border-y border-border/60 bg-muted/25">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.18]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24 lg:px-16">
            <Reveal className="mb-12 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] md:text-4xl">
                From first click to offer letter.
              </h2>
            </Reveal>

            <div className="relative grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.08} className="relative">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-7 shadow-card transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-primary/30 hover:shadow-overlay">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.45),transparent)]"
                    />
                    <div className="mb-5 flex items-start justify-between">
                      <div className="inline-flex rounded-2xl border border-primary/20 bg-primary/[0.08] p-3.5 text-primary shadow-soft">
                        {step.icon}
                      </div>
                      <span
                        aria-hidden="true"
                        className="font-display text-[2.6rem] font-bold leading-none tracking-[-0.06em] text-foreground/[0.05] transition-colors duration-300 group-hover:text-primary/[0.09]"
                      >
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </Reveal>
              ))}

              {[0, 1].map((index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 hidden h-7 w-7 items-center justify-center rounded-full border border-primary/25 bg-card text-primary/80 shadow-soft md:flex"
                  style={{
                    left: `${((index + 1) * 100) / 3}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <ChevronRight size={14} />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.18),transparent_52%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:px-16">
            <Reveal>
              <SpotlightCard
                interactive
                className="cta-card relative overflow-hidden px-6 py-16 text-center backdrop-blur-xl md:px-12 md:py-20"
              >
                <div
                  className="pointer-events-none !absolute inset-0 overflow-hidden rounded-[inherit]"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.55),rgb(103_232_249/0.25),transparent)]" />
                  <div className="aurora-blob absolute left-[12%] top-[-20%] h-64 w-64 bg-primary/10" />
                  <div
                    className="aurora-blob absolute right-[8%] bottom-[-30%] h-64 w-64 bg-accent/10"
                    style={{ animationDelay: "-9s" }}
                  />
                  <div
                    className="aurora-blob absolute left-[46%] bottom-[-24%] h-56 w-56 bg-cyan-400/[0.07]"
                    style={{ animationDelay: "-15s", animationDuration: "30s" }}
                  />
                </div>

                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    <Sparkles size={12} /> Free forever
                  </span>
                  <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-5xl">
                    Make your next session{" "}
                    <span className="landing-gradient">count.</span>
                  </h2>
                  <p className="mx-auto mt-5 max-w-xl text-[16px] leading-7 text-muted-foreground">
                    Stop scrolling tutorials. Start a structured path and build
                    real, interview-ready skill today.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
                    <MagneticButton
                      onClick={() => scrollToSection("modules")}
                      className="landing-primary button-shine group inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-[15px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Start learning free
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </MagneticButton>
                    <button
                      onClick={openRoadmap}
                      className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-8 py-4 text-[15px] font-semibold shadow-card transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <MapIcon size={16} className="text-primary" />
                      View roadmap
                    </button>
                  </div>
                  <p className="mt-6 text-[11.5px] font-medium text-muted-foreground/80">
                    No credit card. No paywall. Cancel nothing.
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          </div>
        </section>

        {roadmapOpen && (
          <Suspense fallback={<div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card px-5 py-3 text-sm shadow-overlay">Loading your roadmap…</div>}>
            <RoadmapFullscreenOverlay
              open={roadmapOpen}
              onClose={() => setRoadmapOpen(false)}
            />
          </Suspense>
        )}
      </main>
    </MotionConfig>
  );
}
