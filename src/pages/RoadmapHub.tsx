import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Coffee,
  Code2,
  BrainCircuit,
  Map as MapIcon,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { roadmapList } from "@/data/roadmaps";

const ICONS: Record<string, JSX.Element> = {
  java: <Coffee size={26} />,
  dsa: <Code2 size={26} />,
  "system-design": <BrainCircuit size={26} />,
};

export default function RoadmapHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/25">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-20 lg:px-16">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back home
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <Sparkles size={12} className="text-primary" />
              Interactive learning paths
            </div>

            <h1 className="text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-5xl lg:text-6xl">
              Pick a <span className="text-primary">roadmap</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Three curated learning paths. Each roadmap is an interactive mind-map you can expand, zoom, and explore at your own pace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── ROADMAP CARDS ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20 lg:px-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmapList.map((rm, i) => (
            <motion.button
              key={rm.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/roadmap/${rm.id}`)}
              className="group relative flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-black/5"
            >
              <div className="flex h-full flex-col">
                <div className="mb-7 flex items-center justify-between">
                  <div
                    className="rounded-xl border p-3"
                    style={{
                      background: `${rm.accent}10`,
                      borderColor: `${rm.accent}25`,
                      color: rm.accent,
                    }}
                  >
                    {ICONS[rm.id] ?? <MapIcon size={24} />}
                  </div>
                  <span className="text-xs text-muted-foreground">Roadmap</span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {rm.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground mb-6">
                    {rm.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {rm.branches.slice(0, 6).map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: b.color }}
                        />
                        {b.label}
                      </span>
                    ))}
                    {rm.branches.length > 6 && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border">
                        +{rm.branches.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                  <span className="text-xs text-muted-foreground">Interactive mind-map</span>
                  <ChevronRight size={16} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
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
