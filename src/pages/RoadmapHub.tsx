import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coffee,
  Code2,
  BrainCircuit,
  Map as MapIcon,
  ArrowRight,
  Move,
} from "lucide-react";
import { roadmapList } from "@/data/roadmaps";
import {
  PageShell,
  PageHeader,
  Section,
  Surface,
  Pill,
} from "@/components/layout/PagePrimitives";

const ICONS: Record<string, JSX.Element> = {
  java: <Coffee size={22} />,
  dsa: <Code2 size={22} />,
  "system-design": <BrainCircuit size={22} />,
};

const HINTS = [
  {
    icon: <MapIcon size={12} />,
    label: "Click any node to expand or collapse its children",
  },
  { icon: <Move size={12} />, label: "Drag to reposition · Scroll to zoom" },
];

export default function RoadmapHub() {
  const navigate = useNavigate();

  return (
    <div className="ui-app-canvas">
      <PageShell>
        <PageHeader
          variant="display"
          kicker="Roadmaps"
          title={
            <>
              Pick a <span className="text-primary">roadmap</span>
            </>
          }
          description="Three curated learning paths. Each roadmap is an interactive mind-map you can expand, zoom, and explore at your own pace."
        />

        <Section spacing="compact">
          <div className="ui-grid ui-grid--3">
            {roadmapList.map((rm, i) => (
              <motion.div
                key={rm.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Surface
                  as="article"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/roadmap/${rm.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/roadmap/${rm.id}`);
                    }
                  }}
                  className="group flex h-full min-h-[260px] cursor-pointer flex-col p-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-control border border-border bg-muted/40 text-muted-foreground">
                      {ICONS[rm.id] ?? <MapIcon size={22} />}
                    </span>
                    <span className="ui-meta">Roadmap</span>
                  </div>

                  <div className="mt-7 flex-1">
                    <p className="ui-kicker">Interactive mind-map</p>
                    <h3 className="ui-h3 mt-2">{rm.title}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                      {rm.subtitle}
                    </p>

                    {rm.branches.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {rm.branches.slice(0, 6).map((b) => (
                          <Pill key={b.label} variant="chip">
                            {b.label}
                          </Pill>
                        ))}
                        {rm.branches.length > 6 && (
                          <Pill variant="chip" mono>
                            +{rm.branches.length - 6}
                          </Pill>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ui-rule mt-6" />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="ui-meta">
                      {rm.branches.length} branches
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </div>
                </Surface>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-muted-foreground">
            {HINTS.map((hint) => (
              <span
                key={hint.label}
                className="inline-flex items-center gap-1.5 ui-meta"
              >
                <span className="text-primary">{hint.icon}</span>
                {hint.label}
              </span>
            ))}
          </div>
        </Section>
      </PageShell>
    </div>
  );
}
