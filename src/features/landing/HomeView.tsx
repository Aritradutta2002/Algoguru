"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import "@/styles/landing.css";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  Code2,
  Coffee,
  Cpu,
  Layers,
  Map as MapIcon,
  PanelLeft,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizSection } from "@/components/quiz/QuizSection";
import { Reveal } from "@/components/motion/Reveal";
import { HeroSection } from "@/components/landing/HeroSection";
import { PlatformBentoSection } from "@/components/landing/PlatformBentoSection";
import { WorkspaceDemoSection } from "@/components/landing/WorkspaceDemoSection";
import { useHomeSidebar } from "@/contexts/HomeSidebarContext";
import { BrandLoader } from "@/components/brand/BrandLoader";

const RoadmapFullscreenOverlay = dynamic(
  () =>
    import("@/components/roadmap/RoadmapFullscreenOverlay").then(
      (module) => module.RoadmapFullscreenOverlay,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-obsidian-border bg-obsidian-elevated/95 px-5 py-2.5 shadow-overlay backdrop-blur-md"
      >
        <BrandLoader variant="inline" size="sm" label="Loading your roadmap…" />
      </div>
    ),
  },
);

const CAPABILITIES = [
  {
    icon: Layers,
    title: "Pattern-indexed DSA",
    detail: "Grouped by reusable invariants",
  },
  {
    icon: Cpu,
    title: "Java 17+ Internals",
    detail: "JVM, GC & concurrency depth",
  },
  {
    icon: BrainCircuit,
    title: "System Design",
    detail: "Sharding, caches & trade-offs",
  },
  {
    icon: Timer,
    title: "Timed Contests",
    detail: "Proctored exam simulation",
  },
  {
    icon: Sparkles,
    title: "Guru AI Tutor",
    detail: "In-context complexity coaching",
  },
] as const;

const SECTIONS = [
  {
    id: "advanced-java",
    title: "Advanced Java",
    desc: "Reflection, JVM internals, garbage collection, design patterns and modern Java 17+ features, written around the questions interviewers ask.",
    icon: Coffee,
    tag: "Java theory",
    topics: "JVM · GC · Reflection",
    route: "/java-advanced",
    stats: "9 deep topics",
  },
  {
    id: "interview",
    title: "DSA Sheets",
    desc: "Curated questions asked at top companies, grouped by topic so you can see your coverage before an interview.",
    icon: Target,
    tag: "Practice",
    topics: "Company & topic filters",
    route: "/practice",
    stats: "500+ questions",
  },
  {
    id: "codechef",
    title: "Data Structures",
    desc: "Essential coding problems organized by pattern and sub-pattern, so each one teaches a technique you can reuse.",
    icon: Code2,
    tag: "Playlist",
    topics: "Sliding window · Graphs · DP",
    route: "/arrays",
    stats: "Pattern-wise problems",
  },
  {
    id: "leetcode",
    title: "System Design",
    desc: "Caching, queues, sharding and the trade-offs behind them, presented as the building blocks of scalable services.",
    icon: BrainCircuit,
    tag: "Architecture",
    topics: "Caches · Queues · Sharding",
    route: "/interview/java/system-design",
    stats: "4 learning paths",
  },
  {
    id: "interview-prep",
    title: "Interview",
    desc: "First-hand accounts from candidates who recently interviewed at top tech companies, so you know what each round looks like.",
    icon: Trophy,
    tag: "Experiences",
    topics: "Round-by-round debriefs",
    route: "/interview",
    stats: "Real interview stories",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    desc: "A new LeetCode problem every day with a built-in Java editor to write and test your solution.",
    icon: CalendarDays,
    tag: "Today",
    topics: "Daily prompt & Java runner",
    route: "/problem-solver",
    stats: "Updated daily",
  },
] as const;

const HOW_IT_WORKS = [
  {
    phase: "Orient",
    title: "Pick a path",
    desc: "Start with DSA, system design, Java or interview prep. Each path is ordered so you always know what comes next.",
    outcome: "Clear weekly milestones",
  },
  {
    phase: "Practice",
    title: "Learn by pattern",
    desc: "Topics are grouped by the patterns interviews test, so a technique learned on one problem carries over to the next.",
    outcome: "Reusable problem intuition",
  },
  {
    phase: "Verify",
    title: "Practice and measure",
    desc: "Solve in the built-in editor, then take a timed contest to see where you stand before the real interview.",
    outcome: "Exam-ready confidence",
  },
] as const;

const CONVERSION_ASSURANCES = [
  "Free access · No paywall",
  "In-browser Java 17 execution",
  "Proctored MCQ & coding contests",
] as const;

export function HomeView() {
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
      <main className="landing-page relative min-h-screen overflow-hidden text-foreground selection:bg-primary/20">
        <HeroSection
          onExplore={() => scrollToSection("modules")}
          onQuiz={() => scrollToSection("quiz")}
          onOpenRoadmap={openRoadmap}
        />

        {/* ── CAPABILITY STRIP ─────────────────────────────────────────── */}
        <section aria-label="Platform capabilities" className="lp-capability-band">
          <div className="lp-container">
            <ul className="lp-capability-grid">
              {CAPABILITIES.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="lp-capability-item">
                  <span className="lp-icon h-8 w-8">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground">{title}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── LEARNING PATHS ───────────────────────────────────────────── */}
        <section id="modules" aria-labelledby="modules-heading" className="lp-section">
          <div className="lp-container">
            <Reveal className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="lp-kicker">Learning paths</p>
                <h2 id="modules-heading" className="lp-h2 mt-3">
                  Choose where to focus next.
                </h2>
                <p className="lp-lead mt-4 max-w-xl">
                  Concise, practical material built around the skills real interviews
                  test. Pick one path or work across several.
                </p>
              </div>
              <Button
                variant="bare"
                size="bare"
                type="button"
                onClick={toggleHomeSidebar}
                aria-expanded={homeSidebarOpen}
                className="lp-btn lp-btn-secondary hidden w-fit lg:inline-flex"
              >
                <PanelLeft size={15} aria-hidden="true" />
                {homeSidebarOpen ? "Hide library panel" : "Open library panel"}
              </Button>
            </Reveal>

            <Reveal>
              <ul className="lp-grid">
                {SECTIONS.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id} className="lp-cell">
                      <Link
                        href={section.route}
                        className="group flex h-full flex-col p-6 focus-visible:-outline-offset-2 sm:p-7"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="lp-icon">
                            <Icon size={17} aria-hidden="true" />
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground/70">
                              0{index + 1}
                            </span>
                            <span className="lp-chip">{section.tag}</span>
                          </div>
                        </div>
                        <h3 className="mt-6 text-[17px] tracking-[-0.015em] text-foreground">
                          {section.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[14px] leading-6 text-muted-foreground">
                          {section.desc}
                        </p>
                        <p className="mt-4 font-mono text-[11.5px] text-muted-foreground/85">
                          {section.topics}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-obsidian-border pt-4 text-[13px]">
                          <span className="text-muted-foreground">{section.stats}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                            Open
                            <ArrowRight
                              size={14}
                              className="transition-transform duration-200 group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── PLATFORM ARCHITECTURE BENTO ──────────────────────────────── */}
        <PlatformBentoSection />

        {/* ── INTERACTIVE WORKSPACE DEMO ───────────────────────────────── */}
        <WorkspaceDemoSection />

        {/* ── QUIZ ─────────────────────────────────────────────────────── */}
        <QuizSection />

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section
          id="workflow"
          aria-labelledby="how-heading"
          className="lp-section border-t border-obsidian-border"
        >
          <div className="lp-container">
            <Reveal className="max-w-2xl">
              <p className="lp-kicker">How it works</p>
              <h2 id="how-heading" className="lp-h2 mt-3">
                A clear plan for every session.
              </h2>
              <p className="lp-lead mt-4 max-w-xl">
                Move systematically from structured theory to timed execution without
                guesswork.
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <ol className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3 md:gap-8">
                {HOW_IT_WORKS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex flex-col justify-between rounded-xl border border-obsidian-border bg-obsidian-pane p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[hsl(var(--lp-accent))]">
                          0{index + 1}
                        </span>
                        <span className="lp-chip">{step.phase}</span>
                      </div>
                      <h3 className="mt-5 text-[17px] tracking-[-0.015em] text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                    <p className="mt-6 border-t border-obsidian-border pt-3.5 font-mono text-[11.5px] text-muted-foreground">
                      Outcome: <span className="text-foreground/85">{step.outcome}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section aria-labelledby="cta-heading" className="pb-24 md:pb-32">
          <div className="lp-container">
            <Reveal>
              <div className="lp-cta-panel px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl">
                    <p className="lp-kicker">Ready to start</p>
                    <h2 id="cta-heading" className="lp-h2 mt-2">
                      Make your next session count.
                    </h2>
                    <p className="lp-lead mt-4">
                      Pick a structured path and start building interview-ready skill
                      today. Free to use, no credit card required.
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
                      {CONVERSION_ASSURANCES.map((item) => (
                        <li key={item} className="inline-flex items-center gap-1.5">
                          <Check size={13} strokeWidth={2.5} className="lp-success" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lp-hero-actions flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                      <Button
                        variant="bare"
                        size="bare"
                        type="button"
                        onClick={() => scrollToSection("modules")}
                        className="lp-btn landing-primary group"
                      >
                        Start learning free
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Button>
                      <Button
                        variant="bare"
                        size="bare"
                        type="button"
                        onClick={openRoadmap}
                        className="lp-btn lp-btn-secondary"
                      >
                        <MapIcon size={15} aria-hidden="true" />
                        View roadmap
                      </Button>
                    </div>
                    <Link
                      href="/auth"
                      className="lp-link text-[12.5px] text-muted-foreground"
                    >
                      Already have an account? Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {roadmapOpen && (
          <RoadmapFullscreenOverlay
            open={roadmapOpen}
            onClose={() => setRoadmapOpen(false)}
          />
        )}
      </main>
    </MotionConfig>
  );
}
