import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";import { Code2, Trophy, BrainCircuit, Target,
  ArrowRight, Check, CalendarDays, Map as MapIcon, Play, Sparkles
} from "lucide-react";
import { RoadmapFullscreenOverlay } from "@/components/roadmap/RoadmapFullscreenOverlay";

const SECTIONS = [
  {
    id: "roadmaps",
    title: "Roadmaps",
    subtitle: "Interactive mind-maps",
    desc: "Full-screen, distraction-free interactive mind-maps for DSA, Java, and System Design. Pan, zoom, drag, and track your progress.",
    icon: <MapIcon size={24} />,
    color: "#A78BFA",
    tag: "Roadmaps",
    pillClass: "bg-violet-500/10 text-violet-500 border-transparent",
    accentClass: "border-[#A78BFA] group-hover:text-[#A78BFA]",
    route: "__open_roadmap__",
    stats: "3 Learning Paths",
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
    pillClass: "bg-category-playlist text-gray-900 border-transparent",
    accentClass: "border-accentLine-playlist group-hover:text-accentLine-playlist",
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
    pillClass: "bg-category-system text-gray-900 border-transparent",
    accentClass: "border-accentLine-system group-hover:text-accentLine-system",
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

export default function Index() {
  const navigate = useNavigate();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const openRoadmap = () => setRoadmapOpen(true);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/25">
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_15%_30%,hsl(var(--accent)/0.08),transparent_26%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <Sparkles size={14} className="text-primary" /> Built for deliberate practice
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] md:text-6xl lg:text-7xl">
              Become the engineer teams want to hire.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              A focused workspace for mastering data structures, system design, and the interviews that move your career forward.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                Explore learning paths <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate("/playground")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Play size={15} fill="currentColor" /> Open playground
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["Structured paths", "Interview-ready practice", "Learn at your pace"].map((item) => <span key={item} className="flex items-center gap-2"><Check size={15} className="text-primary" />{item}</span>)}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }} className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/5 md:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Start here</p><h2 className="mt-1 text-xl font-bold">Your learning plan</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Curated</span></div>
            <div className="space-y-4 py-6">
              {["Build your DSA foundation", "Learn system design patterns", "Practice under interview conditions"].map((item, index) => <div key={item} className="flex items-center gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">0{index + 1}</span><p className="font-medium">{item}</p></div>)}
            </div>
            <button onClick={openRoadmap} className="flex w-full items-center justify-between rounded-xl bg-muted/60 p-4 text-left transition hover:bg-muted"><span className="flex items-center gap-3 text-sm font-semibold"><MapIcon size={18} className="text-primary" /> Browse the full roadmap</span><ArrowRight size={17} className="text-muted-foreground" /></button>
          </motion.div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-24 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Learning paths</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] md:text-5xl">Choose where to focus next.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">Concise, practical material built around the skills that matter in real interviews.</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                if (sec.route === "__open_roadmap__") {
                  openRoadmap();
                } else {
                  navigate(sec.route);
                }
              }}
              className="group relative flex min-h-[270px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-black/5"
            >
              <div className="flex h-full flex-col">
                <div className="mb-7 flex items-center justify-between">
                  <div className="rounded-xl border p-3"
                    style={{ background: `${sec.color}10`, borderColor: `${sec.color}20`, color: sec.color }}
                  >
                    {sec.icon}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {sec.tag}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{sec.subtitle}</p>
                  <h3 className="text-xl font-bold tracking-[-0.02em]">{sec.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{sec.desc}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                  <span className="text-xs font-medium text-muted-foreground">{sec.stats}</span>
                  <ArrowRight size={17} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <RoadmapFullscreenOverlay
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
      />
    </main>
  );
}
