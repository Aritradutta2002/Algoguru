import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coffee, Code2, Trophy, BrainCircuit, Target,
  ArrowRight, Zap, Terminal, ChevronRight, Star
} from "lucide-react";

const SECTIONS = [
  {
    id: "interview",
    title: "Interview Prep",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, system design patterns, and behavioral frameworks to crush technical interviews.",
    icon: <Target size={36} />,
    bg: "bg-[#FFD500]",
    textColor: "text-black",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "🏆 Most Popular",
    route: "/recursion",
    stats: "500+ Questions",
  },
  {
    id: "leetcode",
    title: "LeetCode Patterns",
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
    id: "codechef",
    title: "CodeChef Contests",
    subtitle: "Competitive edge",
    desc: "Advanced greedy, segment trees, and number theory for Div. 1 and ICPC-level competitive programming.",
    icon: <Trophy size={36} />,
    bg: "bg-[#00D4FF]",
    textColor: "text-black",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "⚡ Advanced",
    route: "/advanced-math",
    stats: "150+ Techniques",
  },
  {
    id: "java",
    title: "Core Java",
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
    id: "math",
    title: "Problem Solving Math",
    subtitle: "The foundation",
    desc: "Number Theory, Combinatorics, Modular Arithmetic, and Geometry — the mathematical backbone of CP.",
    icon: <BrainCircuit size={36} />,
    bg: "bg-[#7C3AED]",
    textColor: "text-white",
    shadowColor: "shadow-[6px_6px_0_0_#000]",
    hoverShadow: "hover:shadow-[0px_0px_0_0_#000]",
    tag: "📐 Mathematics",
    route: "/number-theory",
    stats: "80+ Theorems",
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
      <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32 max-w-7xl mx-auto relative">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 neo-btn bg-card px-4 py-2 text-xs font-black uppercase tracking-widest mb-8">
              <Zap size={14} className="text-primary" />
              <span>The Unapologetic Dev Platform</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[1.0] tracking-tighter mb-8">
              <span className="block">MASTER</span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-primary text-black px-4 py-1 border-4 border-black dark:border-white inline-block shadow-[6px_6px_0_0_hsl(var(--border))]">
                  CODE.
                </span>
              </span>
              <span className="block mt-3">ACE</span>
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-[#FF3366] text-white px-4 py-1 border-4 border-black dark:border-white inline-block shadow-[6px_6px_0_0_hsl(var(--border))]">
                  INTERVIEWS.
                </span>
              </span>
            </h1>

            <p className="text-base md:text-lg font-bold text-muted-foreground max-w-md leading-relaxed mb-10 border-l-4 border-primary pl-5">
              The straight-to-the-point platform built for developers who want
              to crack DSA, ace interviews, and understand Java deeply. No fluff. Just code.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ x: -3, y: -3, boxShadow: "8px 8px 0px 0px hsl(var(--border))" }}
                whileTap={{ x: 3, y: 3, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                onClick={() => navigate("/recursion")}
                className="neo-btn bg-primary text-black px-8 py-4 text-base uppercase"
                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}
              >
                Start Learning <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ x: -3, y: -3, boxShadow: "8px 8px 0px 0px hsl(var(--border))" }}
                whileTap={{ x: 3, y: 3, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
                onClick={() => navigate("/playground")}
                className="neo-btn bg-card text-foreground px-8 py-4 text-base uppercase"
                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}
              >
                Try Playground <Terminal size={18} />
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:grid grid-cols-2 gap-5"
          >
            {[
              { num: "500+", label: "Practice Problems", color: "bg-[#FFD500]" },
              { num: "12", label: "DSA Modules", color: "bg-[#FF3366] text-white" },
              { num: "9", label: "Java Modules", color: "bg-[#A3E635]" },
              { num: "300+", label: "Code Examples", color: "bg-[#7C3AED] text-white" },
            ].map(({ num, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`p-7 border-4 border-black dark:border-white shadow-[6px_6px_0_0_hsl(var(--border))] ${color} ${i % 2 !== 0 ? "mt-6" : ""}`}
              >
                <div className={`text-5xl font-black tracking-tighter mb-1 ${color.includes("text-white") ? "text-white" : "text-black"}`}>{num}</div>
                <div className={`text-xs font-black uppercase tracking-widest ${color.includes("text-white") ? "text-white/80" : "text-black/70"}`}>{label}</div>
              </motion.div>
            ))}
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
      <section className="px-6 md:px-12 lg:px-20 py-20 max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 80 }}
              whileHover={{ x: -5, y: -5, boxShadow: "12px 12px 0px 0px hsl(var(--border))" }}
              whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
              onClick={() => navigate(sec.route)}
              className={`${sec.bg} ${sec.textColor} border-4 border-black dark:border-white p-8 cursor-pointer flex flex-col`}
              style={{ boxShadow: "6px 6px 0px 0px hsl(var(--border))", transition: "all 0.15s ease" }}
            >
              {/* Tag */}
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-2 py-1 bg-black/15 w-fit">
                {sec.tag}
              </div>

              {/* Icon */}
              <div className="mb-8 p-4 bg-black/15 w-fit border-2 border-black/20">
                {sec.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">{sec.subtitle}</div>
                <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-4 leading-none">{sec.title}</h3>
                <p className="text-sm font-bold opacity-85 leading-relaxed mb-auto">{sec.desc}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-8 pt-5 border-t-2 border-black/25">
                <span className="text-xs font-black uppercase tracking-widest opacity-75">{sec.stats}</span>
                <div className="flex items-center gap-1 font-black text-sm uppercase">
                  Enter <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Playground Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
            whileHover={{ x: -5, y: -5, boxShadow: "12px 12px 0px 0px hsl(var(--border))" }}
            whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px 0px hsl(var(--border))" }}
            onClick={() => navigate("/playground")}
            className="border-4 border-black dark:border-white p-8 cursor-pointer flex flex-col bg-card text-foreground"
            style={{ boxShadow: "6px 6px 0px 0px hsl(var(--border))", transition: "all 0.15s ease" }}
          >
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-2 py-1 bg-primary/20 text-primary w-fit border-2 border-primary/30">
              💻 Browser-native
            </div>
            <div className="mb-8 p-4 bg-primary/10 w-fit border-2 border-primary/30">
              <Terminal size={36} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Write & Run Instantly</div>
              <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-4 leading-none">Terminal Playground</h3>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">Run Java natively in the browser with pre-loaded Codeforces, CodeChef, and LeetCode templates.</p>
            </div>
            <div className="flex items-center justify-between mt-8 pt-5 border-t-2 border-border">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Setup Needed</span>
              <div className="flex items-center gap-1 font-black text-sm uppercase text-primary">
                Launch <ArrowRight size={16} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t-4 border-border bg-card px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary border-4 border-black dark:border-white shadow-[4px_4px_0_0_hsl(var(--border))] flex items-center justify-center font-black text-black">
              AG
            </div>
            <span className="font-black uppercase tracking-widest text-sm">AlgoGuru</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Built with ❤️ by{" "}
            <a
              href="https://portfolio-aritra-pearl.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-2 underline-offset-2"
            >
              Aritra
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
