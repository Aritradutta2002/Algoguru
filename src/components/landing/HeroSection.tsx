"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Code2, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroWorkspacePreview } from "./HeroWorkspacePreview";
import { useHeroChoreography } from "./useHeroChoreography";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HERO_STATS = [
  { value: "500+", label: "Curated problems", detail: "Company & pattern tagged" },
  { value: "40+", label: "Deep-dive topics", detail: "DSA, Java 17 & architecture" },
  { value: "6", label: "Learning paths", detail: "Sequenced for interviews" },
  { value: "Free", label: "No paywall or trial", detail: "Full workspace access" },
] as const;

const TRUST_SIGNALS = [
  { icon: Terminal, label: "In-browser Java 17 runner" },
  { icon: Sparkles, label: "Context-aware Guru AI tutor" },
  { icon: ShieldCheck, label: "Proctored exam-mode contests" },
] as const;

interface HeroSectionProps {
  onExplore: () => void;
  onQuiz: () => void;
  onOpenRoadmap: () => void;
}

export function HeroSection({ onExplore, onQuiz, onOpenRoadmap }: HeroSectionProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const phase = useHeroChoreography(reduceMotion);

  const rise = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <section
      data-phase={phase}
      aria-labelledby="landing-heading"
      className="lp-hero"
    >
      <div className="lp-container pb-16 pt-12 sm:pt-20 md:pb-20">
        <div className="max-w-3xl">
          <motion.div {...rise(0)} className="flex flex-wrap items-center gap-2.5">
            <span className="lp-eyebrow-pill">
              <span className="lp-status-dot" aria-hidden="true" />
              <span>AlgoGuru Workspace · DSA, Java &amp; System Design</span>
            </span>
          </motion.div>

          <motion.h1
            id="landing-heading"
            {...rise(0.05)}
            className="lp-h1 mt-5 text-foreground"
          >
            Prepare for coding interviews with a plan.
          </motion.h1>

          <motion.p {...rise(0.1)} className="lp-lead mt-6 max-w-2xl">
            AlgoGuru unifies pattern-driven DSA sheets, Java 17 internals, system
            design blueprints, timed contests, and Guru AI into one fast
            engineering workspace—so every session builds reusable interview skill.
          </motion.p>

          <motion.div
            {...rise(0.15)}
            className="lp-hero-actions mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={onExplore}
              className="lp-btn landing-primary group"
            >
              Explore learning paths
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
              onClick={() => router.push("/playground")}
              className="lp-btn lp-btn-secondary"
            >
              <Code2 size={16} aria-hidden="true" />
              Open playground
            </Button>
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={onQuiz}
              className="lp-link py-2 sm:ml-2"
            >
              Or take a 10-question quiz
            </Button>
          </motion.div>

          <motion.div
            {...rise(0.18)}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground"
          >
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon size={13} className="text-foreground/70" aria-hidden="true" />
                {label}
              </span>
            ))}
            <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden="true">·</span>
            <Link href="/auth" className="lp-link text-[12.5px] text-muted-foreground">
              Sign in to sync progress
            </Link>
          </motion.div>
        </div>

        <div className="mt-12 md:mt-16">
          <HeroWorkspacePreview
            phase={phase}
            reduceMotion={reduceMotion}
            onOpenRoadmap={onOpenRoadmap}
          />
        </div>

        <motion.dl
          {...rise(0.3)}
          className="lp-stats mt-14 grid grid-cols-2 gap-y-6 md:grid-cols-4"
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="lp-stat">
              <dt className="order-2 text-[13.5px] font-medium text-foreground/85">{stat.label}</dt>
              <dd className="order-1 font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {stat.value}
              </dd>
              <span className="order-3 text-[12px] text-muted-foreground">{stat.detail}</span>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
