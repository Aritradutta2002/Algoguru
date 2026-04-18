import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coffee, Code2, Trophy, BrainCircuit, Target,
  ArrowRight, Zap, Terminal, ChevronRight, Star
} from "lucide-react";

const SECTIONS = [
  {
    id: "java",
    title: "Core Java",
    subtitle: "From basics to JVM",
    desc: "Complete Java from fundamentals through advanced topics like Multithreading, Streams, and internal JVM architecture.",
    icon: <Coffee size={24} />,
    color: "hsl(var(--primary))",
    tag: "Language",
    route: "/java-basics",
    stats: "9 Full Modules",
  },
  {
    id: "interview",
    title: "Data Structure",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, system design patterns, and behavioral frameworks to crush technical interviews.",
    icon: <Target size={24} />,
    color: "hsl(var(--accent))",
    tag: "Most Popular",
    route: "/stack-queue",
    stats: "500+ Questions",
  },
  {
    id: "codechef",
    title: "Practice",
    subtitle: "DSA Pattern Sheet",
    desc: "A curated collection of essential coding interview problems categorized by sub-patterns and topics.",
    icon: <Trophy size={24} />,
    color: "hsl(var(--info))",
    tag: "Advanced",
    route: "/practice",
    stats: "Pattern Wise Problems",
  },
  {
    id: "leetcode",
    title: "Solutions",
    subtitle: "Pattern-based mastery",
    desc: "Learn the 15 core algorithmic patterns to solve any LeetCode problem without pure memorization.",
    icon: <Code2 size={24} />,
    color: "hsl(var(--destructive))",
    tag: "Trending",
    route: "/practice-arrays",
    stats: "300+ Problems",
  },
  {
    id: "interview-prep",
    title: "Interview",
    subtitle: "Guided preparation",
    desc: "Choose your language and follow a structured interview roadmap across DSA, core concepts, system design, and SQL.",
    icon: <BrainCircuit size={24} />,
    color: "hsl(var(--primary))",
    tag: "Interview Prep",
    route: "/interview",
    stats: "4 Learning Paths",
  },
];

const TICKER_ITEMS = [
  "ALGORITHMS", "INTERVIEW PREP", "LEETCODE PATTERNS", "CODECHEF",
  "CORE JAVA", "COMPETITIVE PROGRAMMING", "DSA MASTERY", "GRAPH THEORY",
  "DYNAMIC PROGRAMMING", "SYSTEM DESIGN", "DATA STRUCTURES", "PROBLEM SOLVING",
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">

      {/* ── MARQUEE TICKER TAPE ─────────────────────────── */}
      <div
        className="w-full overflow-hidden border-b border-border py-2 bg-muted/30"
        aria-hidden="true"
      >
        <motion.div
          className="flex gap-0 whitespace-nowrap"
          animate={{ x: [0, -2400] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mr-12 flex items-center gap-3">
              <Star size={8} className="inline opacity-50" fill="currentColor" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24 max-w-7xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <Zap size={12} className="text-primary" />
              <span className="text-muted-foreground">The ultimate platform for modern developers</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tighter mb-8">
              Master <span className="text-primary">Code</span>.<br />
              Ace <span className="text-accent">Interviews</span>.
            </h1>

            <p className="text-sm md:text-base font-medium text-muted-foreground max-w-xl leading-relaxed mb-10 mx-auto md:mx-0">
              The straight-to-the-point platform built for developers who want
              to crack DSA, ace interviews, and understand Java deeply. No fluff. Just high-quality content.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Start Learning
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/playground")}
                className="bg-card text-foreground border px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:bg-muted"
              >
                Try Playground
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECOND TICKER (Subtle) ────────────── */}
      <div className="w-full overflow-hidden border-y border-border py-2.5 bg-background">
        <motion.div
          className="flex gap-0 whitespace-nowrap"
          animate={{ x: [-2400, 0] }}
          transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em] mr-12 flex items-center gap-3">
              <ChevronRight size={10} className="inline opacity-40" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── MODULES GRID ─────────────────────────────────── */}
      <section id="modules" className="px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center md:text-left"
        >
          <div className="inline-block px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-4">
            Curated Learning Paths
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Select Your <span className="text-primary">Module</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(sec.route)}
              className="group relative bg-card border rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
            >
              {/* Card Accent Glow */}
              <div 
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ background: sec.color }}
              />

              <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Tag */}
                <div className="flex items-center justify-between mb-8">
                  <div 
                    className="p-3.5 rounded-2xl border transition-colors"
                    style={{ background: `${sec.color}10`, borderColor: `${sec.color}20`, color: sec.color }}
                  >
                    {sec.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
                    {sec.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-3 group-hover:text-primary transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                    {sec.desc}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {sec.stats}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    Enter <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
