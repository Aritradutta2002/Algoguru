import { useNavigate } from "react-router-dom";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { motion } from "framer-motion";
import { ChevronRight, Zap, GitBranch, LayoutGrid, Terminal, Sparkles, ArrowRight, Coffee, Layers, Code2, BookOpen, Trophy, Flame, Star, Mail, Send, Bug, SlidersHorizontal } from "lucide-react";
import { useMode } from "@/contexts/ModeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Slider } from "@/components/ui/slider";

const topicColors: Record<string, { color: string; bg: string; border: string }> = {
  recursion: { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
  backtracking: { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  dp: { color: "hsl(var(--success))", bg: "hsl(var(--success)/0.06)", border: "hsl(var(--success)/0.15)" },
  graphs: { color: "hsl(var(--warning))", bg: "hsl(var(--warning)/0.06)", border: "hsl(var(--warning)/0.15)" },
  bits: { color: "hsl(var(--info))", bg: "hsl(var(--info)/0.06)", border: "hsl(var(--info)/0.15)" },
  heaps: { color: "hsl(var(--heap))", bg: "hsl(var(--heap)/0.06)", border: "hsl(var(--heap)/0.15)" },
  strings: { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
  "number-theory": { color: "hsl(var(--success))", bg: "hsl(var(--success)/0.06)", border: "hsl(var(--success)/0.15)" },
  trees: { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  "segment-tree": { color: "hsl(var(--info))", bg: "hsl(var(--info)/0.06)", border: "hsl(var(--info)/0.15)" },
  "advanced-math": { color: "hsl(var(--warning))", bg: "hsl(var(--warning)/0.06)", border: "hsl(var(--warning)/0.15)" },
  "advanced-topics": { color: "hsl(var(--heap))", bg: "hsl(var(--heap)/0.06)", border: "hsl(var(--heap)/0.15)" },
  "java-basics": { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
  "java-oop": { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  "java-exceptions": { color: "hsl(var(--warning))", bg: "hsl(var(--warning)/0.06)", border: "hsl(var(--warning)/0.15)" },
  "java-collections": { color: "hsl(var(--success))", bg: "hsl(var(--success)/0.06)", border: "hsl(var(--success)/0.15)" },
  "java-generics": { color: "hsl(var(--info))", bg: "hsl(var(--info)/0.06)", border: "hsl(var(--info)/0.15)" },
  "java-streams": { color: "hsl(var(--heap))", bg: "hsl(var(--heap)/0.06)", border: "hsl(var(--heap)/0.15)" },
  "java-multithreading": { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
  "java-io": { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  "java-advanced": { color: "hsl(var(--warning))", bg: "hsl(var(--warning)/0.06)", border: "hsl(var(--warning)/0.15)" },
  // Practice topic colors
  "practice-arrays": { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  "practice-strings": { color: "hsl(var(--success))", bg: "hsl(var(--success)/0.06)", border: "hsl(var(--success)/0.15)" },
  "practice-recursion": { color: "hsl(var(--warning))", bg: "hsl(var(--warning)/0.06)", border: "hsl(var(--warning)/0.15)" },
  "practice-dp": { color: "hsl(var(--info))", bg: "hsl(var(--info)/0.06)", border: "hsl(var(--info)/0.15)" },
  "practice-graphs": { color: "hsl(var(--heap))", bg: "hsl(var(--heap)/0.06)", border: "hsl(var(--heap)/0.15)" },
  "practice-trees": { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
  "practice-greedy": { color: "hsl(var(--accent))", bg: "hsl(var(--accent)/0.06)", border: "hsl(var(--accent)/0.15)" },
  "practice-stack-queue": { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Index() {
  const navigate = useNavigate();
  const { currentMode, setMode, modes } = useMode();
  const { contentWidth, setContentWidth } = useSettings();
  const isDSMode = currentMode.id === "ds";
  const isPracticeMode = currentMode.id === "practice";
  const activeTopics = isDSMode ? topics : isPracticeMode ? practiceTopics : javaTopics;

  const dsStats = [
    { label: "Topics", value: "12", icon: LayoutGrid },
    { label: "Sections", value: "140+", icon: GitBranch },
    { label: "Code Snippets", value: "300+", icon: Terminal },
    { label: "Algorithms", value: "180+", icon: Zap },
  ];

  const javaStats = [
    { label: "Modules", value: "9", icon: LayoutGrid },
    { label: "Sections", value: "80+", icon: GitBranch },
    { label: "Code Examples", value: "100+", icon: Terminal },
    { label: "Concepts", value: "150+", icon: Zap },
  ];

  const practiceStats = [
    { label: "Categories", value: "8", icon: LayoutGrid },
    { label: "Problems", value: "50+", icon: GitBranch },
    { label: "Solutions", value: "50+", icon: Terminal },
    { label: "Difficulty Levels", value: "3", icon: Zap },
  ];

  const quickStats = isDSMode ? dsStats : isPracticeMode ? practiceStats : javaStats;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 md:px-10 pt-14 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="hero-glow w-[600px] h-[600px] -top-64 left-1/2 -translate-x-1/2 opacity-[0.07]" style={{ background: "hsl(var(--primary))" }} />
        <div className="hero-glow w-80 h-80 bottom-0 -right-20 opacity-[0.04]" style={{ background: "hsl(var(--accent))" }} />
        <div className="hero-glow w-60 h-60 top-20 -left-20 opacity-[0.03]" style={{ background: "hsl(var(--info))" }} />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          key={currentMode.id}
        >
          {/* Badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                background: "hsl(var(--primary)/0.08)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary)/0.15)",
                boxShadow: "0 0 20px hsl(var(--primary)/0.08)",
              }}
            >
              <Sparkles size={12} />
              {isDSMode ? "Competitive Programming · Java Edition" : isPracticeMode ? "Curated Practice Problems · All Levels" : "Core & Advanced Java · Complete Guide"}
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              {isDSMode ? (
                <>
                  Master{" "}
                  <span className="text-primary-glow">Algorithms</span>
                  <br />
                  <span className="text-accent-glow">From Zero to Expert</span>
                </>
              ) : isPracticeMode ? (
                <>
                  Solve{" "}
                  <span className="text-primary-glow">Problems</span>
                  <br />
                  <span className="text-accent-glow">Build Real Skills</span>
                </>
              ) : (
                <>
                  Master{" "}
                  <span className="text-primary-glow">Java</span>
                  <br />
                  <span className="text-accent-glow">Core to Advanced</span>
                </>
              )}
            </h1>
            <p className="text-sm md:text-base leading-7 max-w-lg mx-auto font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
              Your complete learning platform for DSA & Java — pick a track below to begin your journey.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center p-1 rounded-xl"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
            >
              {modes.map((mode) => {
                const isActive = currentMode.id === mode.id;
                const isDS = mode.id === "ds";
                return (
                  <button
                    key={mode.id}
                    onClick={() => setMode(mode.id)}
                    className="relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: isActive ? "hsl(var(--card))" : "transparent",
                      color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      boxShadow: isActive ? "var(--shadow-card)" : "none",
                    }}
                  >
                    {mode.id === "ds" ? <Layers size={15} /> : mode.id === "practice" ? <Trophy size={15} /> : <Coffee size={15} />}
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Learning CTA */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/${activeTopics[0].id}`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: "var(--gradient-primary)",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 20px hsl(var(--primary)/0.3)",
              }}
            >
              Start Learning <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section className="px-6 md:px-10 py-6 border-y" style={{ borderColor: "hsl(var(--border))" }}>
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {quickStats.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              variants={item}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "hsl(var(--muted)/0.3)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `hsl(var(--primary)/0.08)`,
                  border: "1px solid hsl(var(--primary)/0.1)",
                }}
              >
                <Icon size={15} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <div className="text-xl font-bold font-mono tracking-tight" style={{ color: "hsl(var(--foreground))" }}>{value}</div>
                <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Quick Start - Featured Topics */}
      <section className="px-6 md:px-10 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame size={16} style={{ color: "hsl(var(--accent))" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono" style={{ color: "hsl(var(--accent))" }}>
                  Quick Start
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                {isDSMode ? "Begin Your DSA Journey" : isPracticeMode ? "Start Practicing" : "Start Learning Java"}
              </h2>
            </div>
            <button
              onClick={() => navigate(`/${activeTopics[0].id}`)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-muted"
              style={{ color: "hsl(var(--primary))" }}
            >
              View All <ArrowRight size={12} />
            </button>
          </motion.div>

          {/* Featured - first 3 topics as horizontal cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {activeTopics.slice(0, 3).map((topic, idx) => {
              const colors = topicColors[topic.id] || { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" };
              return (
                <motion.div
                  key={topic.id}
                  variants={item}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(`/${topic.id}`)}
                  style={{
                    background: "var(--gradient-card)",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  {/* Subtle glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${colors.color}08, transparent 70%)` }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }}
                      >
                        {topic.icon}
                      </div>
                      <div>
                        <div className="text-[9px] font-mono font-medium uppercase tracking-wider" style={{ color: colors.color }}>
                          Module {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h3 className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>{topic.title}</h3>
                      </div>
                    </div>
                    <p className="text-[11px] font-light leading-relaxed mb-3 line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {topic.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {topic.subtopics.length} sections
                      </span>
                      <ChevronRight
                        size={13}
                        className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                        style={{ color: colors.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* All Topics Grid */}
      <section className="px-6 md:px-10 py-10 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="flex items-center gap-2 mb-8" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <BookOpen size={16} style={{ color: "hsl(var(--primary))" }} />
            <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              All {isDSMode ? "Topics" : isPracticeMode ? "Categories" : "Modules"}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              {activeTopics.length}
            </span>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            key={currentMode.id}
          >
            {activeTopics.map((topic, idx) => {
              const colors = topicColors[topic.id] || { color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.06)", border: "hsl(var(--primary)/0.15)" };
              return (
                <motion.div
                  key={topic.id}
                  variants={item}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/${topic.id}`)}
                  style={{
                    background: "var(--gradient-card)",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px] truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {topic.title}
                    </h3>
                    <div className="text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {topic.subtopics.length} sections
                    </div>
                  </div>
                  <ChevronRight
                    size={13}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
                    style={{ color: colors.color }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Complexity reference — only for DS mode */}
      {isDSMode && (
        <section className="px-6 md:px-10 py-12 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="max-w-3xl mx-auto">
            <motion.div className="flex items-center gap-2 mb-6" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Trophy size={16} style={{ color: "hsl(var(--accent))" }} />
              <h2 className="text-lg font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                Complexity Reference
              </h2>
            </motion.div>
            <motion.div
              className="overflow-x-auto rounded-2xl"
              style={{ border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <table className="table-dark w-full">
                <thead>
                  <tr><th>Algorithm</th><th>Category</th><th>Time</th><th>Space</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Fibonacci (DP)", "DP", "O(n)", "O(1)"],
                    ["Merge Sort", "D&C", "O(n log n)", "O(n)"],
                    ["N-Queens", "Backtracking", "O(n!)", "O(n)"],
                    ["0/1 Knapsack", "DP", "O(nW)", "O(W)"],
                    ["Dijkstra", "Graphs", "O((V+E)logV)", "O(V)"],
                    ["Floyd-Warshall", "Graphs", "O(V³)", "O(V²)"],
                    ["Kruskal MST", "Graphs", "O(E log E)", "O(V)"],
                    ["TSP (Bitmask)", "DP + Graphs", "O(2ⁿ·n²)", "O(2ⁿ·n)"],
                  ].map(([algo, cat, time, space]) => (
                    <tr key={algo}>
                      <td className="font-semibold font-mono text-xs" style={{ color: "hsl(var(--foreground))" }}>{algo}</td>
                      <td className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>{cat}</td>
                      <td className="font-mono text-xs" style={{ color: "hsl(var(--accent))" }}>{time}</td>
                      <td className="font-mono text-xs" style={{ color: "hsl(var(--success))" }}>{space}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>
      )}

      {/* Playground CTA */}
      <section className="px-6 md:px-10 py-10 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="p-8 rounded-2xl relative overflow-hidden"
            style={{
              background: "var(--gradient-card)",
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="hero-glow w-40 h-40 -top-10 -right-10 opacity-[0.08]" style={{ background: "hsl(var(--success))" }} />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Code2 size={20} style={{ color: "hsl(var(--success))" }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
                Java Playground
              </h3>
              <p className="text-xs font-light mb-5 max-w-sm mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
                Write, compile, and run Java code instantly with built-in CP templates for Codeforces, CodeChef & LeetCode.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/playground")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "hsl(var(--success)/0.12)",
                  color: "hsl(var(--success))",
                  border: "1px solid hsl(var(--success)/0.2)",
                }}
              >
                Open Playground <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Reading Width Slider */}
      <section className="px-6 md:px-10 py-10 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="max-w-md mx-auto">
          <motion.div
            className="p-6 rounded-2xl"
            style={{ background: "var(--gradient-card)", border: "1px solid hsl(var(--border))" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Content Width
              </span>
              <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-md" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                {contentWidth}px
              </span>
            </div>
            <Slider
              value={[contentWidth]}
              onValueChange={(v) => setContentWidth(v[0])}
              min={640}
              max={1200}
              step={20}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>Narrow</span>
              <span>Wide</span>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-8 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            Made with <span style={{ color: "hsl(var(--destructive))" }}>❤</span> by{" "}
            <a
              href="https://portfolio-aritra-pearl.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 transition-colors hover:text-[hsl(var(--primary))]"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Aritra
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Bug size={11} /> Report a Bug
            </span>
            <a
              href="mailto:officialjobs.aritra2001@gmail.com?subject=Bug%20Report%20-%20AlgoGuru"
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-muted/50"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <Mail size={12} /> Email
            </a>
            <a
              href="https://t.me/aritra0109"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-muted/50"
              style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <Send size={12} /> Telegram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
