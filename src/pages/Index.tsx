import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Trophy, BrainCircuit, Target,
  ArrowRight, ArrowUpRight, Check, CalendarDays, Map as MapIcon, Play, Sparkles, Coffee,
  Zap, Layers, MousePointerClick
} from "lucide-react";
import { RoadmapFullscreenOverlay } from "@/components/roadmap/RoadmapFullscreenOverlay";
import { useHomeSidebar } from "@/contexts/HomeSidebarContext";

const SECTIONS = [
  {
    id: "advanced-java",
    title: "Advanced Java",
    subtitle: "Master the deep end",
    desc: "Reflection, JVM internals, garbage collection, design patterns, and modern Java 17+ features — the theory interviewers actually ask about.",
    icon: <Coffee size={24} />,
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
    icon: <Target size={24} />,
    color: "#F4A396",
    tag: "DSA Sheets",
    route: "/practice",
    stats: "500+ Questions",
  },
  {
    id: "codechef",
    title: "Data Structures",
    subtitle: "Pattern-based mastery",
    desc: "A curated collection of essential coding interview problems categorized by sub-patterns and topics.",
    icon: <Code2 size={24} />,
    color: "#FCBA7C",
    tag: "Playlist",
    route: "/arrays",
    stats: "Pattern Wise Problems",
  },
  {
    id: "leetcode",
    title: "System Design",
    subtitle: "Scale to millions",
    desc: "Learn system design patterns to build scalable architectures and crush your interviews.",
    icon: <BrainCircuit size={24} />,
    color: "#99C2F8",
    tag: "System Design",
    route: "/interview/java/system-design",
    stats: "4 Learning Paths",
  },
  {
    id: "interview-prep",
    title: "Interview",
    subtitle: "Guided preparation",
    desc: "Real insights from candidates who recently interviewed at top tech companies. Learn what to expect.",
    icon: <Trophy size={24} />,
    color: "#9BE2C3",
    tag: "Experiences",
    route: "/interview",
    stats: "Real Stories",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    subtitle: "Solve today's problem",
    desc: "A fresh LeetCode problem every day, with a built-in Java editor to craft and test your solution.",
    icon: <CalendarDays size={24} />,
    color: "#F4A396",
    tag: "Today",
    route: "/problem-solver",
    stats: "Updated Daily",
  },
];

const HERO_STATS = [
  { value: "500+", label: "Curated problems" },
  { value: "40+", label: "Deep-dive topics" },
  { value: "6", label: "Learning paths" },
  { value: "100%", label: "Free forever" },
];

const HOW_IT_WORKS = [
  { icon: <MousePointerClick size={20} />, title: "Pick a path", desc: "Choose a structured track — DSA, System Design, Java, or Interview prep." },
  { icon: <Layers size={20} />, title: "Learn by pattern", desc: "Master concepts grouped by the patterns interviews actually test." },
  { icon: <Zap size={20} />, title: "Practice & ship", desc: "Solve in the built-in editor and walk in ready to perform." },
];
export default function Index() {
  const navigate = useNavigate();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const openRoadmap = () => setRoadmapOpen(true);
  const { homeSidebarOpen, toggleHomeSidebar } = useHomeSidebar();

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/25">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_-10%,hsl(var(--primary)/0.16),transparent_38%),radial-gradient(circle_at_8%_20%,hsl(var(--accent)/0.10),transparent_30%),radial-gradient(circle_at_50%_110%,hsl(var(--primary)/0.06),transparent_40%)]" />
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-8 sm:pt-10 md:px-10 md:pb-28 md:pt-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="max-w-2xl font-display text-[2.75rem] font-bold leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-[4.4rem]">
              Become the engineer{" "}
              <span className="bg-gradient-to-r from-primary via-[#f0a24b] to-accent bg-clip-text text-transparent">
                teams fight to hire.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl md:leading-8">
              A focused workspace for mastering data structures, system design, and the interviews that move your career forward.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-accent transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-overlay hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:translate-y-0"
              >
                Explore learning paths
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/playground")}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-7 py-4 text-base font-semibold text-foreground shadow-card transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:translate-y-0"
              >
                <Play size={17} fill="currentColor" className="text-primary" />
                Open playground
              </button>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[15px] font-medium text-muted-foreground">
              {["Structured paths", "Interview-ready practice", "Learn at your pace"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                    <Check size={12} className="text-primary" strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 border-t border-border/70 pt-8 sm:grid-cols-4">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-bold tracking-tight text-foreground md:text-[1.7rem]">{s.value}</p>
                  <p className="mt-1 text-[13px] font-medium leading-snug text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:w-full lg:max-w-md lg:justify-self-end"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-7 shadow-overlay backdrop-blur-xl md:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              <div className="flex items-center justify-between border-b border-border/80 pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Start here</p>
                  <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight">Your learning plan</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.12] px-3.5 py-1.5 text-xs font-bold text-primary">
                  <Sparkles size={13} /> Curated
                </span>
              </div>

              <div className="space-y-5 py-7">
                {[
                  "Build your DSA foundation",
                  "Learn system design patterns",
                  "Practice under interview conditions",
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-center gap-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-muted to-muted/40 font-display text-sm font-bold text-foreground shadow-soft transition-colors group-hover:border-primary/40 group-hover:text-primary">
                      0{index + 1}
                    </span>
                    <p className="text-[15.5px] font-medium leading-snug text-foreground/90">{item}</p>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={openRoadmap}
                className="group flex w-full items-center justify-between rounded-2xl border border-border/70 bg-muted/50 px-5 py-4 text-left transition-all duration-300 hover:border-primary/40 hover:bg-muted"
              >
                <span className="flex items-center gap-3 text-[15px] font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.12] text-primary">
                    <MapIcon size={17} />
                  </span>
                  Browse the full roadmap
                </span>
                <ArrowRight size={18} className="text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* LEARNING PATHS */}
      <section id="modules" className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Learning paths</p>
            <button
              type="button"
              onClick={toggleHomeSidebar}
              aria-expanded={homeSidebarOpen}
              title={homeSidebarOpen ? "Hide the left panel" : "Show the left panel"}
              className="mt-4 rounded-md text-left font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[3.4rem]"
            >
              Choose where to focus next.
            </button>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-muted-foreground md:text-base">
            Concise, practical material built around the skills that matter in real interviews — no fluff, just momentum.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              onClick={() => {
                if (sec.route === "__open_roadmap__") {
                  openRoadmap();
                } else {
                  navigate(sec.route);
                }
              }}
              className="group relative flex min-h-[290px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 ease-premium hover:border-transparent hover:shadow-overlay"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(130% 100% at 50% 0%, " + sec.color + "16, transparent 55%)" }}
              />
              <div
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-premium group-hover:scale-x-100"
                style={{ background: "linear-gradient(90deg, " + sec.color + ", transparent)" }}
              />

              <div className="relative flex h-full flex-col">
                <div className="mb-7 flex items-start justify-between">
                  <div
                    className="rounded-2xl border p-3.5 shadow-soft transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-110"
                    style={{ background: sec.color + "12", borderColor: sec.color + "26", color: sec.color }}
                  >
                    {sec.icon}
                  </div>
                  <span
                    className="rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: sec.color + "0e", borderColor: sec.color + "22", color: sec.color }}
                  >
                    {sec.tag}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{sec.subtitle}</p>
                  <h3 className="font-display text-[1.55rem] font-bold leading-tight tracking-[-0.02em]">{sec.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-7 text-muted-foreground">{sec.desc}</p>
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-border/70 pt-5">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: sec.color }} />
                    {sec.stats}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      {/* HOW IT WORKS */}
      <section className="relative border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl">
              From first click to offer letter.
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-border bg-card p-7 shadow-card"
              >
                <span className="absolute right-6 top-5 font-display text-4xl font-bold text-foreground/[0.06]">
                  0{i + 1}
                </span>
                <div className="mb-5 inline-flex rounded-xl border border-primary/20 bg-primary/[0.08] p-3 text-primary">
                  {step.icon}
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.16),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl">
              Your next role is one{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                focused session
              </span>{" "}
              away.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Stop scrolling tutorials. Start a structured path and build real, interview-ready skill today.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-accent transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-overlay hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Start learning free
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={openRoadmap}
                className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold shadow-card transition-all duration-300 hover:border-primary/40 hover:bg-muted"
              >
                <MapIcon size={17} className="text-primary" />
                View roadmap
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <RoadmapFullscreenOverlay
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
      />
    </main>
  );
}
