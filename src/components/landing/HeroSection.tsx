import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Code2 } from "lucide-react";
import { HeroWorkspacePreview } from "./HeroWorkspacePreview";
import { useHeroChoreography } from "./useHeroChoreography";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HERO_STATS = [
  { value: "500+", label: "Curated problems" },
  { value: "40+", label: "Deep-dive topics" },
  { value: "6", label: "Learning paths" },
  { value: "Free", label: "No paywall or trial" },
] as const;

interface HeroSectionProps {
  onExplore: () => void;
  onQuiz: () => void;
  onOpenRoadmap: () => void;
}

export function HeroSection({ onExplore, onQuiz, onOpenRoadmap }: HeroSectionProps) {
  const navigate = useNavigate();
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
      <div className="lp-container pb-16 pt-16 sm:pt-24 md:pb-20">
        <div className="max-w-3xl">
          <motion.p {...rise(0)} className="lp-kicker">
            Interview preparation for software engineers
          </motion.p>

          <motion.h1
            id="landing-heading"
            {...rise(0.05)}
            className="lp-h1 mt-4 text-foreground"
          >
            Prepare for coding interviews with a plan.
          </motion.h1>

          <motion.p {...rise(0.1)} className="lp-lead mt-6 max-w-2xl">
            AlgoGuru organizes DSA patterns, system design and Java internals into
            structured paths, with an in-browser editor so you can practice each
            concept as you learn it.
          </motion.p>

          <motion.div
            {...rise(0.15)}
            className="lp-hero-actions mt-9 flex flex-wrap items-center gap-3"
          >
            <button type="button" onClick={onExplore} className="lp-btn landing-primary group">
              Explore learning paths
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => navigate("/playground")}
              className="lp-btn lp-btn-secondary"
            >
              <Code2 size={16} aria-hidden="true" />
              Open playground
            </button>
            <button type="button" onClick={onQuiz} className="lp-link py-2 sm:ml-2">
              Or take a 10-question quiz
            </button>
          </motion.div>
        </div>

        <div className="mt-16 md:mt-20">
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
              <dt className="order-2 text-[13.5px] text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
