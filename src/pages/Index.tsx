import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import "@/styles/landing.css";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Code2,
  Coffee,
  Map as MapIcon,
  PanelLeft,
  Target,
  Trophy,
} from "lucide-react";
import { QuizSection } from "@/components/quiz/QuizSection";
import { Reveal } from "@/components/motion/Reveal";
import { HeroSection } from "@/components/landing/HeroSection";
import { WorkspaceDemoSection } from "@/components/landing/WorkspaceDemoSection";
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
    desc: "Reflection, JVM internals, garbage collection, design patterns and modern Java 17+ features, written around the questions interviewers ask.",
    icon: Coffee,
    tag: "Java theory",
    route: "/java-advanced",
    stats: "9 deep topics",
  },
  {
    id: "interview",
    title: "DSA Sheets",
    desc: "Curated questions asked at top companies, grouped by topic so you can see your coverage before an interview.",
    icon: Target,
    tag: "Practice",
    route: "/practice",
    stats: "500+ questions",
  },
  {
    id: "codechef",
    title: "Data Structures",
    desc: "Essential coding problems organized by pattern and sub-pattern, so each one teaches a technique you can reuse.",
    icon: Code2,
    tag: "Playlist",
    route: "/arrays",
    stats: "Pattern-wise problems",
  },
  {
    id: "leetcode",
    title: "System Design",
    desc: "Caching, queues, sharding and the trade-offs behind them, presented as the building blocks of scalable services.",
    icon: BrainCircuit,
    tag: "Architecture",
    route: "/interview/java/system-design",
    stats: "4 learning paths",
  },
  {
    id: "interview-prep",
    title: "Interview",
    desc: "First-hand accounts from candidates who recently interviewed at top tech companies, so you know what each round looks like.",
    icon: Trophy,
    tag: "Experiences",
    route: "/interview",
    stats: "Real interview stories",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    desc: "A new LeetCode problem every day with a built-in Java editor to write and test your solution.",
    icon: CalendarDays,
    tag: "Today",
    route: "/problem-solver",
    stats: "Updated daily",
  },
] as const;

const HOW_IT_WORKS = [
  {
    title: "Pick a path",
    desc: "Start with DSA, system design, Java or interview prep. Each path is ordered so you always know what comes next.",
  },
  {
    title: "Learn by pattern",
    desc: "Topics are grouped by the patterns interviews test, so a technique learned on one problem carries over to the next.",
  },
  {
    title: "Practice and measure",
    desc: "Solve in the built-in editor, then take a timed contest to see where you stand before the real interview.",
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
      <main className="landing-page relative min-h-screen overflow-hidden text-foreground selection:bg-primary/20">
        <HeroSection
          onExplore={() => scrollToSection("modules")}
          onQuiz={() => scrollToSection("quiz")}
          onOpenRoadmap={openRoadmap}
        />

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
              <button
                type="button"
                onClick={toggleHomeSidebar}
                aria-expanded={homeSidebarOpen}
                className="lp-btn lp-btn-secondary hidden w-fit lg:inline-flex"
              >
                <PanelLeft size={15} aria-hidden="true" />
                {homeSidebarOpen ? "Hide library panel" : "Open library panel"}
              </button>
            </Reveal>

            <Reveal>
              <ul className="lp-grid">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id} className="lp-cell">
                      <Link
                        to={section.route}
                        className="group flex h-full flex-col p-6 focus-visible:-outline-offset-2 sm:p-7"
                      >
                        <div className="flex items-center justify-between">
                          <span className="lp-icon">
                            <Icon size={17} aria-hidden="true" />
                          </span>
                          <span className="text-[12px] text-muted-foreground">{section.tag}</span>
                        </div>
                        <h3 className="mt-6 text-[17px] tracking-[-0.015em] text-foreground">
                          {section.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[14px] leading-6 text-muted-foreground">
                          {section.desc}
                        </p>
                        <div className="mt-6 flex items-center justify-between text-[13px]">
                          <span className="text-muted-foreground">{section.stats}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
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

        {/* ── INTERACTIVE WORKSPACE DEMO ───────────────────────────────── */}
        <WorkspaceDemoSection />

        {/* ── QUIZ ─────────────────────────────────────────────────────── */}
        <QuizSection />

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section aria-labelledby="how-heading" className="lp-section border-t border-obsidian-border">
          <div className="lp-container">
            <Reveal className="max-w-2xl">
              <p className="lp-kicker">How it works</p>
              <h2 id="how-heading" className="lp-h2 mt-3">
                A clear plan for every session.
              </h2>
            </Reveal>

            <Reveal delay={0.05}>
              <ol className="mt-12 grid gap-10 md:mt-14 md:grid-cols-3 md:gap-8">
                {HOW_IT_WORKS.map((step, index) => (
                  <li key={step.title} className="border-t border-obsidian-border pt-6">
                    <span className="font-mono text-[12.5px] text-muted-foreground">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-[17px] tracking-[-0.015em] text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">
                      {step.desc}
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
              <div className="flex flex-col gap-8 rounded-2xl border border-obsidian-border bg-obsidian-pane px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-14">
                <div className="max-w-xl">
                  <h2 id="cta-heading" className="lp-h2">
                    Make your next session count.
                  </h2>
                  <p className="lp-lead mt-4">
                    Pick a structured path and start building interview-ready skill
                    today. Free to use, no credit card required.
                  </p>
                </div>
                <div className="lp-hero-actions flex shrink-0 flex-wrap items-center gap-3">
                  <button
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
                  </button>
                  <button
                    type="button"
                    onClick={openRoadmap}
                    className="lp-btn lp-btn-secondary"
                  >
                    <MapIcon size={15} aria-hidden="true" />
                    View roadmap
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {roadmapOpen && (
          <Suspense
            fallback={
              <div
                role="status"
                aria-live="polite"
                className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-obsidian-border bg-obsidian-pane px-5 py-3 text-sm shadow-overlay"
              >
                Loading your roadmap…
              </div>
            }
          >
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
