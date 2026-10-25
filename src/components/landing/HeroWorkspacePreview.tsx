import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Flame,
  Map as MapIcon,
  Sparkles,
  Terminal,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PLAN_ITEMS = [
  { label: "Build your DSA foundation", meta: "12 min" },
  { label: "Learn system design patterns", meta: "18 min" },
  { label: "Practice under interview conditions", meta: "25 min" },
] as const;

type CodeToken = {
  text: string;
  className?: string;
};

/**
 * Hand-tokenised so the preview gets real syntax colour without shipping a
 * highlighter to the landing page. The snippet is intentionally tiny.
 */
const CODE_LINES: CodeToken[][] = [
  [
    { text: "class", className: "tok-k" },
    { text: " " },
    { text: "Solution", className: "tok-t" },
    { text: " {" },
  ],
  [
    { text: "  " },
    { text: "int", className: "tok-t" },
    { text: "[] " },
    { text: "twoSum", className: "tok-f" },
    { text: "(" },
    { text: "int", className: "tok-t" },
    { text: "[] a, " },
    { text: "int", className: "tok-t" },
    { text: " t) {" },
  ],
  [
    { text: "    " },
    { text: "Map", className: "tok-t" },
    { text: "<" },
    { text: "Integer", className: "tok-t" },
    { text: "," },
    { text: "Integer", className: "tok-t" },
    { text: "> m = " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "HashMap", className: "tok-t" },
    { text: "<>();" },
  ],
  [
    { text: "    " },
    { text: "for", className: "tok-k" },
    { text: " (" },
    { text: "int", className: "tok-t" },
    { text: " i = " },
    { text: "0", className: "tok-n" },
    { text: "; i < a.length; i++) {" },
  ],
  [
    { text: "      " },
    { text: "if", className: "tok-k" },
    { text: " (m." },
    { text: "containsKey", className: "tok-f" },
    { text: "(t - a[i]))" },
  ],
  [
    { text: "        " },
    { text: "return", className: "tok-k" },
    { text: " " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "int", className: "tok-t" },
    { text: "[]{m." },
    { text: "get", className: "tok-f" },
    { text: "(t - a[i]), i};" },
  ],
  [
    { text: "      m." },
    { text: "put", className: "tok-f" },
    { text: "(a[i], i);" },
  ],
  [{ text: "    }" }],
  [
    { text: "    " },
    { text: "return", className: "tok-k" },
    { text: " " },
    { text: "new", className: "tok-k" },
    { text: " " },
    { text: "int", className: "tok-t" },
    { text: "[0];" },
  ],
  [{ text: "  }" }],
  [{ text: "}" }],
];

function CodeLine({ tokens }: { tokens: CodeToken[] }) {
  return (
    <span className="hero-code-line">
      {tokens.map((token, index) => (
        <span key={index} className={token.className}>
          {token.text}
        </span>
      ))}
    </span>
  );
}

interface HeroWorkspacePreviewProps {
  reduceMotion: boolean | null;
  onOpenRoadmap: () => void;
}

export function HeroWorkspacePreview({
  reduceMotion,
  onOpenRoadmap,
}: HeroWorkspacePreviewProps) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.14, duration: 0.7, ease: EASE }}
      className="hero-preview-wrap relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none lg:justify-self-end"
    >
      <div className="hero-preview-aura pointer-events-none absolute" aria-hidden="true" />

      <div className="hero-preview-meta mb-4 flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <Terminal size={14} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">Your next productive session</span>
        <span className="hero-preview-label shrink-0 rounded-full px-2.5 py-1 text-[10px]">
          Workspace preview
        </span>
      </div>

      <div className="hero-preview-frame">
        <SpotlightCard className="hero-preview-card landing-preview relative rounded-[1.75rem] p-0">
          <div className="relative">
            {/* window chrome */}
            <div className="hero-window-bar flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="hero-traffic-dot bg-rose-400/80" aria-hidden="true" />
                <span className="hero-traffic-dot bg-amber-400/80" aria-hidden="true" />
                <span className="hero-traffic-dot bg-emerald-400/80" aria-hidden="true" />
                <span className="ml-2.5 truncate font-mono text-[10.5px] tracking-tight text-muted-foreground">
                  algoguru / practice
                </span>
              </div>

              <div className="hero-window-tabs hidden items-center gap-0.5 rounded-lg p-0.5 sm:flex">
                {["Problem", "Solution", "Tests"].map((tab) => (
                  <span
                    key={tab}
                    className={cn("hero-window-tab", tab === "Solution" && "is-active")}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <span className="hero-status-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="hero-status-dot" aria-hidden="true" />
                Practice
              </span>
            </div>

            <div className="landing-preview-panes hero-preview-panes grid gap-3 p-3 sm:p-4">
              {/* problem pane */}
              <div className="hero-pane rounded-2xl p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="hero-difficulty inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
                    Easy
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">#1 / 500</span>
                </div>

                <h3 className="mt-3 font-display text-[17px] font-bold tracking-tight">Two Sum</h3>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                  Return indices of the two numbers that add up to the target.
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Array", "Hash Map"].map((tag) => (
                    <span key={tag} className="hero-tag rounded-md px-1.5 py-0.5 font-mono text-[9.5px]">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="hero-code-shell mt-4 overflow-hidden rounded-xl">
                  <div className="hero-code-bar flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      <Terminal size={10} aria-hidden="true" />
                      Solution.java
                    </span>
                    <span className="hero-code-lang rounded px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em]">
                      Java
                    </span>
                  </div>
                  <pre
                    tabIndex={0}
                    aria-label="Example Java solution for Two Sum"
                    className="landing-code hero-code overflow-x-auto px-3 pb-3 pt-2 font-mono"
                  >
                    <code>{CODE_LINES.map((line, index) => (
                      <CodeLine key={index} tokens={line} />
                    ))}</code>
                  </pre>
                </div>

                <div className="hero-test-result mt-3 flex items-center justify-between rounded-lg px-2.5 py-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check size={11} strokeWidth={3} aria-hidden="true" />
                    All tests passed
                  </span>
                  <span className="font-mono text-[9.5px] text-muted-foreground">12 / 12</span>
                </div>
              </div>

              {/* study plan pane */}
              <div className="hero-pane hero-plan-pane flex flex-col rounded-2xl p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Today&apos;s focus
                  </p>
                  <span className="hero-flame-tile flex h-6 w-6 items-center justify-center rounded-lg">
                    <Flame size={13} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 font-display text-[17px] font-bold tracking-tight">
                  Your learning plan
                </p>

                <div className="mt-4 space-y-3">
                  {PLAN_ITEMS.map((item, index) => (
                    <div
                      key={item.label}
                      className={cn("hero-plan-item flex items-start gap-2.5", index === 0 && "is-complete")}
                    >
                      <span className="hero-plan-step mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                        {index === 0 ? (
                          <Check size={10} strokeWidth={3} aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="hero-plan-label text-[11.5px] font-medium leading-snug text-foreground/90">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[9.5px] text-muted-foreground">{item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hero-focus-card mt-auto rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Focus mode
                    </span>
                    <span className="hero-focus-status inline-flex items-center gap-1 text-[8.5px] font-semibold">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
                      Ready
                    </span>
                  </div>
                  <div className="hero-focus-chart mt-2.5 flex h-9 items-end gap-1" aria-hidden="true">
                    {[34, 58, 46, 72, 54, 84, 66, 92, 62, 78, 50, 70].map((height, index) => (
                      <span
                        key={index}
                        className="hero-focus-bar"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>Deep work this week</span>
                    <span className="font-mono">4h 20m</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[9.5px] font-medium text-muted-foreground">
                    <span>Weekly goal</span>
                    <span className="font-mono">3 / 5 sessions</span>
                  </div>
                  <div className="hero-goal-track">
                    <motion.div
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
                      className="hero-goal-fill w-3/5 origin-left rounded-full"
                    />
                  </div>
                </div>

                <button
                  onClick={onOpenRoadmap}
                  className="hero-roadmap-btn group mt-4 flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11.5px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <MapIcon size={13} className="text-primary" aria-hidden="true" />
                    Browse full roadmap
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div className="hero-preview-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
          </div>
        </SpotlightCard>
      </div>

      {/* floating product chips */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 14, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5, ease: EASE }}
        className="hero-float-chip hero-float-ai landing-float hidden xl:flex"
      >
        <span className="hero-chip-icon hero-chip-icon-ai flex h-7 w-7 items-center justify-center rounded-xl">
          <Sparkles size={13} aria-hidden="true" />
        </span>
        <div>
          <p className="hero-chip-title text-[10.5px] font-semibold leading-tight">Guru AI</p>
          <p className="hero-chip-sub text-[9.5px] text-muted-foreground">Hint ready</p>
        </div>
        <span className="hero-chip-live ml-0.5" aria-hidden="true" />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -14, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
        className="hero-float-chip hero-float-streak landing-float landing-float-delayed hidden xl:flex"
      >
        <span className="hero-chip-icon hero-chip-icon-streak flex h-8 w-8 items-center justify-center rounded-xl">
          <Flame size={15} aria-hidden="true" />
        </span>
        <div>
          <p className="hero-chip-title text-[11px] font-bold leading-tight">12-day streak</p>
          <p className="hero-chip-sub text-[9.5px] text-muted-foreground">Personal best</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
