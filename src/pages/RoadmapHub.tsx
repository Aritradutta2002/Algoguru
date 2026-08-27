import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Code2,
  BrainCircuit,
  Map as MapIcon,
  Sparkles,
  ChevronRight,
  Star,
} from "lucide-react";
import { roadmapList } from "@/data/roadmaps";

const ICONS: Record<string, JSX.Element> = {
  java: <Coffee size={26} />,
  dsa: <Code2 size={26} />,
  "system-design": <BrainCircuit size={26} />,
};

const TICKER_ITEMS = [
  "JAVA", "DATA STRUCTURES", "SYSTEM DESIGN", "DSA",
  "ROADMAPS", "LEARNING PATHS", "CORE JAVA", "ADVANCE JAVA",
  "ARRAYS", "TREES", "GRAPHS", "DYNAMIC PROGRAMMING",
];

export default function RoadmapHub() {
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
            <span
              key={i}
              className="text-muted-foreground/50 text-[10px] font-black uppercase tracking-[0.3em] mr-16 flex items-center gap-4"
            >
              <Star size={10} className="inline text-primary/30" fill="currentColor" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="px-4 md:px-10 lg:px-16 py-10 md:py-16 max-w-7xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Back link */}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors group mb-8"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <Sparkles size={12} className="text-primary" />
              <span className="text-muted-foreground">Interactive learning paths</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-[1.1] tracking-tighter mb-6">
              Pick a <span className="text-primary">Roadmap</span>
            </h1>

            <p className="text-sm md:text-base font-medium text-muted-foreground max-w-xl leading-relaxed mx-auto md:mx-0">
              Three curated learning paths. Each roadmap is an interactive
              mind-map you can expand, zoom, and explore at your own pace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── ROADMAP CARDS ─────────────────────────────────── */}
      <section className="px-4 md:px-12 lg:px-20 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {roadmapList.map((rm, i) => (
            <motion.button
              key={rm.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/roadmap/${rm.id}`)}
              className="group relative bg-card border rounded-[32px] p-8 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5 text-left"
            >
              {/* Card Accent Glow */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-25 transition-opacity"
                style={{ background: rm.accent }}
              />

              <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Tag */}
                <div className="flex items-center justify-between mb-8">
                  <div
                    className="p-3.5 rounded-2xl border transition-colors"
                    style={{
                      background: `${rm.accent}10`,
                      borderColor: `${rm.accent}30`,
                      color: rm.accent,
                    }}
                  >
                    {ICONS[rm.id] ?? <MapIcon size={26} />}
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                    style={{
                      background: `${rm.accent}10`,
                      borderColor: `${rm.accent}30`,
                      color: rm.accent,
                    }}
                  >
                    Roadmap
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3
                    className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3 border-l-4 pl-3 transition-colors"
                    style={{ borderColor: rm.accent }}
                  >
                    {rm.title}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-6">
                    {rm.subtitle}
                  </p>

                  {/* Branch swatches */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {rm.branches.slice(0, 6).map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/40"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: b.color }}
                        />
                        {b.label}
                      </span>
                    ))}
                    {rm.branches.length > 6 && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/60 border border-border/40">
                        +{rm.branches.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Interactive mind-map
                  </span>
                  <div
                    className="flex items-center gap-1.5 font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                    style={{ color: rm.accent }}
                  >
                    Open <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footnote / hint */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-[11px] font-medium text-muted-foreground/70 flex items-center justify-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5">
            <MapIcon size={12} className="text-primary" />
            Click any node to expand or collapse its children
          </span>
          <span className="opacity-30">·</span>
          <span className="hidden sm:inline">Drag to reposition · Scroll to zoom</span>
        </motion.div>
      </section>

      <div className="h-10" />
    </div>
  );
}
