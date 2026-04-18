import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coffee, Code2, Trophy, BrainCircuit, Target,
  ArrowRight, Zap, Terminal, ChevronRight, Star
} from "lucide-react";

const SECTIONS = [
  {
    id: "java",
    title: "CORE JAVA",
    subtitle: "From basics to JVM",
    desc: "Complete Java from fundamentals through advanced topics like Multithreading, Streams, and internal JVM architecture.",
    icon: <Coffee size={36} />,
    bg: "bg-[#A3E635]",
    textColor: "text-black",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "☕ Language",
    route: "/java-basics",
    stats: "9 Full Modules",
  },
  {
    id: "interview",
    title: "DATA STRUCTURE",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, system design patterns, and behavioral frameworks to crush technical interviews.",
    icon: <Target size={36} />,
    bg: "bg-[#FFD500]",
    textColor: "text-black",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "🏆 Most Popular",
    route: "/stack-queue",
    stats: "500+ Questions",
  },
  {
    id: "codechef",
    title: "PRACTICE",
    subtitle: "DSA Pattern Sheet",
    desc: "A curated collection of essential coding interview problems categorized by sub-patterns and topics.",
    icon: <Trophy size={36} />,
    bg: "bg-[#00D4FF]",
    textColor: "text-black",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "⚡ Advanced",
    route: "/practice",
    stats: "Pattern Wise Problems",
  },
  {
    id: "leetcode",
    title: "SOLUTIONS",
    subtitle: "Pattern-based mastery",
    desc: "Learn the 15 core algorithmic patterns to solve any LeetCode problem without pure memorization.",
    icon: <Code2 size={36} />,
    bg: "bg-[#FF3366]",
    textColor: "text-white",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "🔥 Trending",
    route: "/practice-arrays",
    stats: "300+ Problems",
  },
  {
    id: "interview-prep",
    title: "INTERVIEW",
    subtitle: "Guided preparation",
    desc: "Choose your language and follow a structured interview roadmap across DSA, core concepts, system design, and SQL.",
    icon: <BrainCircuit size={36} />,
    bg: "bg-[#7C3AED]",
    textColor: "text-white",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "🎯 Interview Prep",
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
        className="w-full overflow-hidden border-b-4 border-border py-3 bg-primary"
        aria-hidden="true"
      >
        <motion.div
          className="flex gap-0 whitespace-nowrap"
          animate={{ x: [0, -2400] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-black text-xs font-black uppercase tracking-[0.25em] mr-12 flex items-center gap-4">
              <Star size={10} className="inline" fill="black" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-6 md:px-10 lg:px-16 py-10 md:py-16 max-w-7xl mx-auto relative">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative grid grid-cols-1 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ containerType: "inline-size" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 neo-btn bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-5">
              <Zap size={11} className="text-primary" />
              <span>The Unapologetic Dev Platform</span>
            </div>

            {/* Hero Title */}
            <h1 
              className="font-black uppercase leading-[1.05] tracking-tighter mb-5 flex items-center justify-start whitespace-nowrap" 
              style={{ fontSize: "clamp(0.8rem, 5.5cqw, 3rem)", gap: "0.25em" }}
            >
              <span>MASTER</span>
              <span className="relative inline-block">
                <span 
                  className="relative z-10 bg-primary text-black inline-block"
                  style={{ 
                    padding: "0.15em 0.3em", 
                    border: "0.06em solid hsl(var(--border))", 
                    boxShadow: "0.08em 0.08em 0 0 hsl(var(--border))" 
                  }}
                >
                  CODE.
                </span>
              </span>
              <span>ACE</span>
              <span className="relative inline-block">
                <span 
                  className="relative z-10 bg-[#FF3366] text-white inline-block"
                  style={{ 
                    padding: "0.15em 0.3em", 
                    border: "0.06em solid hsl(var(--border))", 
                    boxShadow: "0.08em 0.08em 0 0 hsl(var(--border))" 
                  }}
                >
                  INTERVIEWS.
                </span>
              </span>
            </h1>

            <p className="text-sm font-semibold text-muted-foreground max-w-xl leading-relaxed mb-7 border-l-[3px] border-primary pl-4">
              The straight-to-the-point platform built for developers who want
              to crack DSA, ace interviews, and understand Java deeply. No fluff. Just code.
            </p>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px 0px hsl(var(--border))" }}
                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                onClick={() => navigate("/recursion")}
                className="neo-btn bg-primary text-black px-5 py-2.5 text-sm uppercase"
                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}
              >
                Start Learning <ArrowRight size={15} />
              </motion.button>
              <motion.button
                whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px 0px hsl(var(--border))" }}
                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                onClick={() => navigate("/playground")}
                className="neo-btn bg-card text-foreground px-5 py-2.5 text-sm uppercase"
                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}
              >
                Try Playground <Terminal size={15} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECOND TICKER (Dark Background) ────────────── */}
      <div className="w-full overflow-hidden border-y-4 border-border py-3 bg-black dark:bg-white">
        <motion.div
          className="flex gap-0 whitespace-nowrap"
          animate={{ x: [-2400, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-white dark:text-black text-xs font-black uppercase tracking-[0.25em] mr-12 flex items-center gap-4">
              <ChevronRight size={10} className="inline" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── MODULES GRID ─────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="inline-block neo-btn bg-black dark:bg-white text-white dark:text-black px-5 py-2 text-xs uppercase font-black tracking-widest mb-4">
            Choose Your Track
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            SELECT MODULE
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 80 }}
              whileHover={{ x: -2, y: -2, boxShadow: "5px 5px 0px 0px hsl(var(--border))" }}
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
              onClick={() => navigate(sec.route)}
              className={`${sec.bg} ${sec.textColor} border-2 border-black dark:border-white p-5 cursor-pointer flex flex-col`}
              style={{ boxShadow: "3px 3px 0px 0px hsl(var(--border))", transition: "all 0.15s ease" }}
            >
              {/* Tag */}
              <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] mb-4 px-1.5 py-0.5 bg-black/15 w-fit">
                {sec.tag}
              </div>

              {/* Icon */}
              <div className="mb-4 p-2.5 bg-black/15 w-fit border-[1.5px] border-black/20">
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                  {sec.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{sec.subtitle}</div>
                <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight mb-2 leading-none">{sec.title}</h3>
                <p className="text-xs font-bold opacity-85 leading-relaxed mb-auto">{sec.desc}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-3 border-t-[1.5px] border-black/25">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-75">{sec.stats}</span>
                <div className="flex items-center gap-1 font-black text-xs uppercase">
                  Enter <ArrowRight size={14} />
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
