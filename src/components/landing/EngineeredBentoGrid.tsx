import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Network,
  Repeat,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PATTERNS = [
  {
    id: "sliding-window",
    name: "Sliding Window",
    problem: "Longest Substring Without Repeating Characters",
    complexity: "O(N) Time · O(K) Space",
    tag: "String & Array",
    insight: "Expand right to consume, shrink left when duplicate invariant breaks.",
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    problem: "Container With Most Water",
    complexity: "O(N) Time · O(1) Space",
    tag: "Greedy Shrink",
    insight: "Move the pointer with smaller height inwards to maximize potential area.",
  },
  {
    id: "graph-bfs",
    name: "Graph BFS / DFS",
    problem: "Word Ladder / Shortest Path",
    complexity: "O(V + E) Time · O(V) Space",
    tag: "Level-order Traversal",
    insight: "Queue ensures shortest path in unweighted states; visited set prevents cycles.",
  },
] as const;

export function EngineeredBentoGrid() {
  const reduceMotion = useReducedMotion();
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [drillFlipped, setDrillFlipped] = useState(false);

  const pattern = PATTERNS[selectedPattern];

  return (
    <section
      id="bento"
      aria-labelledby="bento-heading"
      className="relative border-b border-border/60 bg-muted/20 py-24 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 md:px-10 lg:px-16">
        <div className="mb-14 max-w-2xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Curriculum Flow
          </p>
          <h2
            id="bento-heading"
            className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] sm:text-4xl md:text-[2.75rem] md:leading-[1.1]"
          >
            From raw problem to offer letter.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            A 4-phase progression designed to turn unpredictable whiteboard rounds into repeatable, structured wins.
          </p>
        </div>

        {/* 12-Column Responsive Bento Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Card 1: Phase 01 - Deconstruct (7 cols) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-card lg:col-span-7 sm:p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  Phase 01 // Deconstruct
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">Pattern Archetypes</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Classify unseen problems in seconds
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Stop memorizing random solutions. Filter by core pattern and recognize the underlying invariant immediately.
              </p>

              {/* Interactive Pattern Filter Tabs */}
              <div className="mt-6 flex flex-wrap gap-2">
                {PATTERNS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPattern(idx)}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all duration-200",
                      selectedPattern === idx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Inspection Deck */}
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-4 font-mono text-xs backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="flex items-center gap-2 text-foreground font-semibold">
                  <Brain size={15} className="text-primary" />
                  {pattern.problem}
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-bold">
                  {pattern.complexity}
                </span>
              </div>
              <p className="mt-3 text-[12.5px] font-sans leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">Invariant: </strong>
                {pattern.insight}
              </p>
            </div>
          </div>

          {/* Card 2: Phase 02 - Implement (5 cols) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-card lg:col-span-5 sm:p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Phase 02 // Implement
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">In-Browser Java 21</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Benchmarked execution speed
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Compile and test idiomatic solutions directly in your browser with real-time memory and time telemetry.
              </p>
            </div>

            {/* Runtime Telemetry Gauge */}
            <div className="mt-6 space-y-3.5 rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Cpu size={14} className="text-emerald-500" />
                  Runtime Efficiency
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  98.4th Percentile
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                  style={{ width: "98.4%" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-muted-foreground">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground/80">Time</p>
                  <p className="mt-0.5 font-bold text-foreground">1.2ms (Java 21)</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground/80">Memory</p>
                  <p className="mt-0.5 font-bold text-foreground">41.2 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Phase 03 - Scale (5 cols) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-card lg:col-span-5 sm:p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Phase 03 // Scale
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">System Design</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Distributed systems trade-offs
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Move past single-machine logic. Master caching layers, message brokers, and database partitioning patterns.
              </p>
            </div>

            {/* Architecture Node Wire */}
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-xs">
                  <Network size={13} className="text-primary" />
                  <span>API GW</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 font-bold text-primary shadow-xs">
                  <Zap size={13} />
                  <span>Redis Cache</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-xs">
                  <Database size={13} className="text-cyan-500" />
                  <span>Postgres</span>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                Sub-millisecond read path with write-through cache eviction & connection pooling.
              </p>
            </div>
          </div>

          {/* Card 4: Phase 04 - Retain (7 cols) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-card lg:col-span-7 sm:p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Phase 04 // Retain
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">Spaced Recall</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Active recall under interview pressure
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Test your pattern recognition before writing a single line of code. Flip cards to expose blind spots.
              </p>
            </div>

            {/* Interactive Drill Card */}
            <div className="mt-6 flex flex-col justify-between rounded-2xl border border-border/70 bg-background/80 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Scenario Flash Drill #42</span>
                <button
                  type="button"
                  onClick={() => setDrillFlipped((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Repeat size={13} />
                  {drillFlipped ? "Show Question" : "Reveal Invariant"}
                </button>
              </div>

              <div className="mt-3 min-h-[52px]">
                {drillFlipped ? (
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <strong>Optimal Strategy: </strong>
                    Use Fast & Slow pointers (Floyd&apos;s Cycle Finding). 2k - k = nL implies meeting point detects loop in O(1) space.
                  </p>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    &ldquo;Given the head of a linked list, determine if the list has a cycle in it without using auxiliary memory.&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EngineeredBentoGrid;
