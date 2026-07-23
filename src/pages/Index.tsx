import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";import { Coffee, Code2, Trophy, BrainCircuit, Target,
  ArrowRight, Zap, Terminal, ChevronRight, Star, CalendarDays, Map as MapIcon
} from "lucide-react";

const SECTIONS = [
  {
    id: "java",
    title: "Core CS Subjects",
    subtitle: "From basics to OS",
    desc: "Complete CS from fundamentals through advanced topics like OS, DBMS, Networks, and Multithreading.",
    icon: <Coffee size={24} />,
    color: "#A8A4F5",
    tag: "Core CS",
    pillClass: "bg-category-core text-gray-900 border-transparent",
    accentClass: "border-accentLine-core group-hover:text-accentLine-core",
    route: "/java-basics",
    stats: "9 Full Modules",
  },
  {
    id: "interview",
    title: "DSA Sheets",
    subtitle: "Land FAANG roles",
    desc: "Curated top-company DSA questions, system design patterns, and behavioral frameworks to crush technical interviews.",
    icon: <Target size={24} />,
    color: "#F4A396",
    tag: "DSA Sheets",
    pillClass: "bg-category-dsa text-gray-900 border-transparent",
    accentClass: "border-[#F4A396] group-hover:text-category-dsa",
    route: "/arrays",
    stats: "500+ Questions",
  },
  {
    id: "codechef",
    title: "DSA Playlist",
    subtitle: "Pattern-based mastery",
    desc: "A curated collection of essential coding interview problems categorized by sub-patterns and topics.",
    icon: <Code2 size={24} />,
    color: "#FCBA7C",
    tag: "Playlist",
    pillClass: "bg-category-playlist text-gray-900 border-transparent",
    accentClass: "border-accentLine-playlist group-hover:text-accentLine-playlist",
    route: "/practice",
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
    pillClass: "bg-category-system text-gray-900 border-transparent",
    accentClass: "border-accentLine-system group-hover:text-accentLine-system",
    route: "/practice-arrays",
    stats: "4 Learning Paths",
  },
  {
    id: "interview-prep",
    title: "Interview Experience",
    subtitle: "Guided preparation",
    desc: "Real insights from candidates who recently interviewed at top tech companies. Learn what to expect.",
    icon: <Trophy size={24} />,
    color: "#9BE2C3",
    tag: "Experiences",
    pillClass: "bg-category-interview text-gray-900 border-transparent",
    accentClass: "border-[#9BE2C3] group-hover:text-category-interview",
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
    pillClass: "bg-primary/10 text-primary border-transparent",
    accentClass: "border-[#F4A396] group-hover:text-[#F4A396]",
    route: "/problem-solver",
    stats: "Updated Daily",
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
        className="w-full overflow-hidden border-b border-border/40 py-3 bg-muted/20 backdrop-blur-sm"
        aria-hidden="true"
      >
        <motion.div
          className="flex gap-0 whitespace-nowrap"
          animate={{ x: [0, -2400] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-muted-foreground/50 text-[10px] font-black uppercase tracking-[0.3em] mr-16 flex items-center gap-4">
              <Star size={10} className="inline text-primary/30" fill="currentColor" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-4 md:px-10 lg:px-16 py-12 md:py-24 max-w-7xl mx-auto relative overflow-hidden">
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-[1.1] tracking-tighter mb-8">
              Master <span className="text-primary">Code</span>.{" "}
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
                className="bg-[#F3F4F6] text-[#111827] px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all hover:bg-[#E5E7EB]"
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

      {/* ── JAVA ROADMAP FLOATING BANNER ────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        onClick={() => navigate("/java-roadmap")}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer group hidden md:block"
      >
        <div className="relative flex items-center">
          {/* Main banner */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 rounded-l-xl py-5 px-3 shadow-2xl shadow-purple-500/25 transition-all duration-300 group-hover:shadow-purple-500/40 group-hover:pr-4">
            <div className="flex flex-col items-center gap-2.5">
              {/* Icon */}
              <div className="text-white/90">
                <MapIcon size={20} />
              </div>
              {/* Vertical text */}
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/80"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                Java Roadmap
              </div>
              {/* Arrow indicator */}
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-white/60"
              >
                <ArrowRight size={14} />
              </motion.div>
            </div>
          </div>

          {/* Hover glow border */}
          <div className="absolute inset-y-0 left-0 w-0.5 bg-white/20 group-hover:bg-white/40 transition-colors" />
        </div>

        {/* Subtle dot indicator on hover */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-purple-500/50" />
      </motion.div>

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
      <section id="modules" className="px-4 md:px-12 lg:px-20 py-18 lg:py-24 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center md:text-left"
        >
          <div className="inline-block px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-4">
            Curated Learning Paths
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-black uppercase tracking-tighter">
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
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${sec.pillClass || "bg-muted text-muted-foreground"}`}>
                    {sec.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tight mb-3 transition-colors ${sec.accentClass ? `border-l-4 pl-3 ${sec.accentClass}` : 'group-hover:text-primary'}`}>
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
