import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import {
  Code2,
  Trophy,
  BrainCircuit,
  Target,
  ArrowRight,
  ArrowUpRight,
  Check,
  CalendarDays,
  Map as MapIcon,
  Play,
  Sparkles,
  ChevronDown,
  Flame,
  Clock3,
  Compass,
} from "lucide-react";
import { RoadmapFullscreenOverlay } from "@/components/roadmap/RoadmapFullscreenOverlay";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { CountUp } from "@/components/landing/CountUp";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import "@/components/landing/landing.css";

/* ── Shared motion ─────────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
} as const;

/* ── Data ──────────────────────────────────────────────────── */

interface Module {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  tag: string;
  route: string;
  stats: string;
}

const SECTIONS: Module[] = [
  {
    id: "roadmaps",
    title: "Roadmaps",
    subtitle: "Interactive mind-maps",
    desc: "Full-screen, distraction-free mind-maps for DSA, Java, and System Design. Pan, zoom, drag, and track your progress.",
    icon: <MapIcon size={22} />,
    color: "#A78BFA",
    tag: "Roadmaps",
    route: "__open_roadmap__",
    stats: "3 Learning Paths",
  },
  {
    id: "interview",
    title: "DSA Sheets",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, organized by pattern and difficulty so every rep compounds.",
    icon: <Target size={22} />,
    color: "#F4A396",
    tag: "DSA Sheets",
    route: "/practice",
    stats: "400+ Questions",
  },
  {
    id: "codechef",
    title: "Data Structures",
    subtitle: "Pattern-based mastery",
    desc: "Essential interview problems grouped by sub-pattern — two pointers, prefix sums, hashing, and more.",
    icon: <Code2 size={22} />,
    color: "#FCBA7C",
    tag: "Playlist",
    route: "/arrays",
    stats: "Pattern-wise Drills",
  },
  {
    id: "leetcode",
    title: "System Design",
    subtitle: "Scale to millions",
    desc: "HLD and LLD patterns that teach you to reason about trade-offs and design systems that scale.",
    icon: <BrainCircuit size={22} />,
    color: "#99C2F8",
    tag: "System Design",
    route: "/interview/java/system-design",
    stats: "60+ Questions",
  },
  {
    id: "interview-prep",
    title: "Interview",
    subtitle: "Guided preparation",
    desc: "Language deep-dives, must-know Q&A, and question banks for Java, Python, and C++ interviews.",
    icon: <Trophy size={22} />,
    color: "#9BE2C3",
    tag: "Experiences",
    route: "/interview",
    stats: "3 Languages",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    subtitle: "Solve today's problem",
    desc: "A fresh LeetCode problem every day, with a built-in Java editor to craft and test your solution.",
    icon: <CalendarDays size={22} />,
    color: "#F4A396",
    tag: "Today",
    route: "/problem-solver",
    stats: "Updated Daily",
  },
];

const MARQUEE_TOPICS = [
  "Two Pointers",
  "Dynamic Programming",
  "Graphs & BFS",
  "System Design",
  "Java OOP",
  "Sliding Window",
  "Tries",
  "Bit Manipulation",
  "Heaps",
  "Backtracking",
  "SQL",
  "Multithreading",
];

const STATS = [
  { value: 400, suffix: "+", label: "Practice problems", sub: "Easy → Hard" },
  { value: 300, suffix: "+", label: "Guided lessons", sub: "DSA + Java" },
  { value: 60, suffix: "+", label: "System design Qs", sub: "HLD & LLD" },
  { value: 3, suffix: "", label: "Visual roadmaps", sub: "DSA · Java · SD" },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a path",
    desc: "Start from a roadmap or jump straight into patterns. Every module tells you exactly what to learn next.",
    link: "Browse roadmaps",
    action: "__open_roadmap__",
  },
  {
    n: "02",
    title: "Learn by solving",
    desc: "Read the editorial, trace the approach, then code it in the playground until the pattern clicks.",
    link: "Open playground",
    action: "/playground",
  },
  {
    n: "03",
    title: "Prove interview-ready",
    desc: "Rep DSA sheets, system design Qs, and the daily challenge until hard feels routine.",
    link: "Practice now",
    action: "/practice",
  },
];

const FAQS = [
  {
    q: "Is AlgoGuru free to use?",
    a: "Yes — every roadmap, DSA pattern, playground feature, and the daily challenge are free after sign-in. AlgoGuru is an independent project; there's an optional Buy Me a Coffee if you'd like to support it.",
  },
  {
    q: "I'm new to DSA. Where do I start?",
    a: "Open the DSA roadmap and begin at Arrays & Hashing — the foundation everything else builds on. Each node unlocks in a sensible order, so you always know what comes next.",
  },
  {
    q: "Do I need to know Java?",
    a: "No. Most editorials use Java because it's the most common interview language, but the patterns transfer directly to Python, C++, or JavaScript. The playground also supports multiple languages.",
  },
  {
    q: "What is Guru AI?",
    a: "Guru is the built-in mentor that lives beside your workspace. Ask for a hint before peeking at solutions, get any editorial line explained differently, or paste code that's failing and debug it together.",
  },
  {
    q: "How is this different from LeetCode?",
    a: "LeetCode is a problem bank; AlgoGuru is a curriculum. Patterns are taught with theory, visuals, and editorials first — then you drill them until they're reflex. Use both: learn here, grind there.",
  },
];

const HERO_CHECKS = ["Structured paths", "Interview-ready practice", "Learn at your pace"];

export default function Index() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const firstName =
    profile?.display_name?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    null;

  const openRoadmap = () => setRoadmapOpen(true);

  const go = (route: string) => {
    if (route === "__open_roadmap__") openRoadmap();
    else navigate(route);
  };

  const scrollToModules = () =>
    document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" });

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary/25">
        {/* ══════════ HERO ══════════ */}
        <section aria-labelledby="hero-heading" className="relative border-b border-border/60">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="landing-grid-bg absolute inset-0" />
            <div className="absolute -top-32 left-1/2 h-72 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute top-48 -left-28 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-16">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 py-1.5 pl-3 pr-4 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
                <span className="landing-ping-dot relative h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                {firstName ? (
                  <span>
                    Welcome back, <span className="text-foreground">{firstName}</span> — let&apos;s keep
                    the streak alive
                  </span>
                ) : (
                  <span>
                    New · Interactive roadmaps <span className="text-foreground">+</span> Guru AI mentor
                  </span>
                )}
              </div>

              <h1
                id="hero-heading"
                className="max-w-3xl text-[2.6rem] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-5xl md:text-6xl xl:text-[4.35rem]"
              >
                Become the engineer teams{" "}
                <span className="text-gradient-brand">want&nbsp;to&nbsp;hire.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                AlgoGuru turns interview prep into a guided workspace — visual roadmaps,
                pattern-wise DSA, real code practice, and Guru AI beside you at every step.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollToModules}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                >
                  Explore learning paths
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/playground")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-6 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                >
                  <Play size={15} fill="currentColor" className="text-primary" />
                  Open playground
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                {HERO_CHECKS.map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <HeroVisual />
          </div>
        </section>

        {/* ══════════ STATS ══════════ */}
        <section aria-label="Platform stats" className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16 lg:px-16">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="rounded-2xl border border-border bg-card px-6 py-7 text-center shadow-card transition-colors hover:border-primary/30"
              >
                <p className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1.5 text-sm font-semibold">{s.label}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {s.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════ MARQUEE ══════════ */}
        <div className="landing-marquee overflow-hidden border-y border-border/60 bg-card/50 py-4">
          <span className="sr-only">Topics include {MARQUEE_TOPICS.join(", ")}</span>
          <div aria-hidden className="landing-marquee-track flex w-max">
            {[...MARQUEE_TOPICS, ...MARQUEE_TOPICS].map((t, i) => (
              <span key={i} className="flex items-center gap-3 px-6 text-sm font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════ MODULES ══════════ */}
        <section
          id="modules"
          aria-labelledby="modules-heading"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 md:px-10 md:py-24 lg:px-16"
        >
          <motion.div
            {...fadeUp}
            className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"
          >
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <Compass size={14} /> Learning paths
              </p>
              <h2
                id="modules-heading"
                className="mt-3 text-3xl font-extrabold tracking-[-0.035em] md:text-5xl"
              >
                Choose where to focus next.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Concise, practical material built around the skills that matter in real interviews.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((sec, i) => (
              <motion.article
                key={sec.id}
                {...fadeUp}
                transition={{ delay: (i % 3) * 0.08, duration: 0.45 }}
                role="button"
                tabIndex={0}
                aria-label={`${sec.title} — ${sec.subtitle}. ${sec.desc}`}
                onClick={() => go(sec.route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(sec.route);
                  }
                }}
                className="group relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 outline-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `${sec.color}33` }}
                />
                <div className="relative mb-6 flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm"
                    style={{
                      background: `${sec.color}14`,
                      borderColor: `${sec.color}35`,
                      color: sec.color,
                    }}
                  >
                    {sec.icon}
                  </div>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {sec.tag}
                  </span>
                </div>
                <div className="relative flex-1">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {sec.subtitle}
                  </p>
                  <h3 className="text-xl font-bold tracking-[-0.02em]">{sec.title}</h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{sec.desc}</p>
                </div>
                <div className="relative mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                  <span className="text-xs font-semibold text-muted-foreground">{sec.stats}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ══════════ WHY / FEATURES ══════════ */}
        <section aria-labelledby="why-heading" className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24 lg:px-16">
            <motion.div {...fadeUp} className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Why AlgoGuru
              </p>
              <h2
                id="why-heading"
                className="mt-3 text-3xl font-extrabold tracking-[-0.035em] md:text-4xl"
              >
                Everything around the problem, not just the problem.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                Problem banks give you questions. AlgoGuru gives you the map, the reps, and the
                mentor to actually finish them.
              </p>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[
                {
                  icon: <MapIcon size={20} />,
                  color: "#A78BFA",
                  title: "Roadmaps you can explore",
                  desc: "Zoomable, trackable mind-maps that turn “learn DSA” into a concrete checklist.",
                  points: ["DSA, Java & System Design paths", "Progress saved per node", "Fullscreen focus mode"],
                  cta: "Open roadmap",
                  action: "__open_roadmap__" as const,
                },
                {
                  icon: <Code2 size={20} />,
                  color: "#FCBA7C",
                  title: "A playground that feels real",
                  desc: "A full editor with runners and testcases — practice inches from where you learn.",
                  points: ["Monaco editor + code runner", "Testcases & complexity hints", "Snippets, notes & history"],
                  cta: "Open playground",
                  action: "/playground" as const,
                },
                {
                  icon: <Sparkles size={20} />,
                  color: "#9BE2C3",
                  title: "Guru AI in your corner",
                  desc: "Stuck at 1am? Guru gives hints first, solutions last — like a patient senior.",
                  points: ["Hints before solutions", "Explains any editorial line", "Debugs your code with you"],
                  cta: "Meet Guru in the solver",
                  action: "/problem-solver" as const,
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-accent"
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      background: `${f.color}14`,
                      borderColor: `${f.color}35`,
                      color: f.color,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-sm">
                        <Check size={14} strokeWidth={3} className="shrink-0 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => go(f.action)}
                    className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-bold text-primary transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {f.cta} <ArrowUpRight size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section aria-labelledby="steps-heading" className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24 lg:px-16">
          <motion.div {...fadeUp} className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">How it works</p>
              <h2 id="steps-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
                Three steps. Zero guesswork.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              A loop designed for consistency — small daily wins that compound into offers.
            </p>
          </motion.div>

          <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            <div aria-hidden className="landing-steps-line absolute left-0 right-0 top-7 hidden h-px md:block" />
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }} className="relative">
                <div className="relative z-10 mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card font-mono text-sm font-bold shadow-sm">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{s.desc}</p>
                <button
                  type="button"
                  onClick={() => go(s.action)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {s.link} <ArrowRight size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════ DAILY SPOTLIGHT ══════════ */}
        <section aria-labelledby="daily-heading" className="mx-auto max-w-7xl px-5 pb-16 md:px-10 md:pb-24 lg:px-16">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-accent md:p-12"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
            </div>
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <CalendarDays size={13} /> Daily Challenge · refreshed every day
                </div>
                <h2 id="daily-heading" className="mt-5 text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">
                  One problem a day keeps the rejection away.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
                  A hand-picked LeetCode problem drops daily with a built-in Java editor, testcases,
                  and Guru hints on standby. Fifteen focused minutes beats a weekend of cramming.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                  <span className="rounded-full border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.1)] px-3 py-1 text-[hsl(var(--warning))]">
                    Medium
                  </span>
                  <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-muted-foreground">
                    Arrays
                  </span>
                  <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-muted-foreground">
                    Two Pointers
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
                    <Clock3 size={13} /> ~20 min
                  </span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/problem-solver")}
                    className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                  >
                    Solve today&apos;s problem
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-6 backdrop-blur">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <Flame size={13} className="text-primary" /> Why it works
                </p>
                <ul className="mt-4 space-y-3.5">
                  {[
                    "Spaced repetition locks patterns into long-term memory",
                    "Streaks turn motivation into a system",
                    "Interviewers notice daily-grind consistency",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm leading-6">
                      <Check size={15} strokeWidth={3} className="mt-1 shrink-0 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════ FAQ ══════════ */}
        <section aria-labelledby="faq-heading" className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
            <motion.div {...fadeUp}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">FAQ</p>
              <h2 id="faq-heading" className="mt-3 text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
                Questions, answered.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                Still curious about something? Open Guru from the header on any page and ask away.
              </p>
              <button
                type="button"
                onClick={() => navigate("/playground")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Sparkles size={15} className="text-primary" /> Try the playground
              </button>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <motion.div
                    key={f.q}
                    {...fadeUp}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-card transition-colors",
                      open ? "border-primary/30 shadow-card" : "border-border"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full touch-manipulation items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="text-[15px] font-bold tracking-tight">{f.q}</span>
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          open
                            ? "rotate-180 border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        <ChevronDown size={15} />
                      </span>
                    </button>
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-7 text-muted-foreground">{f.a}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════ FINAL CTA ══════════ */}
        <section aria-labelledby="cta-heading" className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-64 w-[46rem] max-w-[95vw] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
            <motion.div {...fadeUp}>
              <div className="mb-6 flex justify-center">
                <AlgoGuruMark size={60} />
              </div>
              <h2
                id="cta-heading"
                className="text-3xl font-extrabold tracking-[-0.035em] md:text-5xl md:leading-[1.08]"
              >
                Your next offer starts with <span className="text-gradient-brand">one pattern.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                Join your roadmap, solve today&apos;s challenge, and let Guru keep you unblocked.
                Future-you says thanks.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToModules}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                >
                  Start learning free
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/problem-solver")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                >
                  <Flame size={15} className="text-primary" /> Today&apos;s challenge
                </button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Free after sign-in · No credit card · Learn at your pace
              </p>
            </motion.div>
          </div>
        </section>

        <RoadmapFullscreenOverlay open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
      </main>
    </MotionConfig>
  );
}
