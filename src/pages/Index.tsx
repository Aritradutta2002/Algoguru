import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import "@/styles/landing.css";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
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
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { HeroSection } from "@/components/landing/HeroSection";
import { useHomeSidebar } from "@/contexts/HomeSidebarContext";

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
    color: "#F472B6",
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
    color: "#60A5FA",
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
    color: "#38BDF8",
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
    color: "#818CF8",
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
    color: "#34D399",
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
    color: "#FBBF24",
    tag: "Today",
    route: "/problem-solver",
    stats: "Updated Daily",
  },
] as const;

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

        <div className="border-b border-border/60 bg-card/60">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-6 text-xs font-semibold text-muted-foreground sm:text-sm">
            <span className="text-foreground">Less tab switching. More progress.</span>
            {[{ icon: Code2, label: "Practice in your browser" }, { icon: Layers, label: "Learn patterns, not answers" }, { icon: MapIcon, label: "Follow a clear roadmap" }].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2"><Icon size={16} className="text-primary" aria-hidden="true" />{label}</span>
            ))}
          </div>
        </div>

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
              return (
                <Reveal key={section.id} delay={index * 0.055} from="bottom">
                  <SpotlightCard
                    interactive
                    className="landing-path-card group h-full min-h-[290px] rounded-3xl focus-within:border-primary/40"
                  >
                    <Link
                      to={section.route}
                      className="flex h-full min-h-[290px] flex-col rounded-3xl p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="mb-7 flex items-start justify-between">
                        <div
                          className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border shadow-soft transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-105"
                          style={{
                            background: `${section.color}14`,
                            borderColor: `${section.color}30`,
                            color: section.color,
                          }}
                        >
                          <Icon size={23} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
                            style={{
                              background: `${section.color}0e`,
                              borderColor: `${section.color}26`,
                            }}
                          >
                            {section.tag}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/50">
                            0{index + 1}
                          </span>
                        </div>
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
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: section.color }}
                          />
                          {section.stats}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-300 ease-premium group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight
                            size={15}
                            className="transition-transform duration-300 group-hover:rotate-45"
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

            <div className="relative grid gap-5 md:grid-cols-3">
              <div
                className="pointer-events-none absolute left-[16%] right-[16%] top-[62px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
                aria-hidden="true"
              />
              {HOW_IT_WORKS.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.08} className="relative">
                  <div className="group relative h-full rounded-2xl border border-border bg-card/80 p-7 shadow-card backdrop-blur-sm transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-primary/30 hover:shadow-overlay">
                    <span className="absolute right-6 top-5 font-display text-4xl font-bold text-foreground/[0.05]">
                      0{index + 1}
                    </span>
                    <div className="mb-5 inline-flex rounded-xl border border-primary/20 bg-primary/[0.08] p-3 text-primary shadow-soft">
                      {step.icon}
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
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.18),transparent_52%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:px-16">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/75 px-6 py-16 text-center shadow-overlay backdrop-blur-xl md:px-12 md:py-20">
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
                <div
                  className="aurora-blob left-[12%] top-[-20%] h-64 w-64 bg-primary/10"
                  aria-hidden="true"
                />
                <div
                  className="aurora-blob right-[8%] bottom-[-30%] h-64 w-64 bg-accent/10"
                  style={{ animationDelay: "-9s" }}
                  aria-hidden="true"
                />

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
                    <button
                      onClick={() => scrollToSection("modules")}
                      className="landing-primary button-shine group inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-[15px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Start learning free
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>
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
              </div>
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
