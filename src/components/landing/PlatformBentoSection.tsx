"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Map as MapIcon,
  ShieldAlert,
  Sparkles,
  TerminalSquare,
  Timer,
} from "lucide-react";
import { CODING_CONTEST_DURATION_SECONDS } from "@/lib/contest/config";
import { formatExamTime } from "@/lib/formatTime";

const ROADMAP_STEPS = [
  { label: "Arrays & Hashing", count: "9 / 9", done: true },
  { label: "Two Pointers & Stack", count: "7 / 9", done: true },
  { label: "Trees, Graphs & DP", count: "In progress", done: false },
  { label: "System Design", count: "4 tracks", done: false },
] as const;

export function PlatformBentoSection() {
  return (
    <section
      id="platform"
      aria-labelledby="platform-heading"
      className="lp-section border-t border-obsidian-border"
    >
      <div className="lp-container">
        <div className="mb-12 max-w-2xl md:mb-14">
          <h2 id="platform-heading" className="lp-h2">
            Everything you need for a focused practice session.
          </h2>
          <p className="lp-lead mt-4 max-w-xl">
            Every surface connects your code editor, AI complexity review, timed
            exam conditions, and personal study notes in a single workflow.
          </p>
        </div>

        <div className="lp-bento-grid">
          {/* 1. Guru AI Tutor */}
          <article className="lp-bento-card lp-bento-wide">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="lp-chip">
                  <Sparkles size={12} className="text-[hsl(var(--guru-accent))]" aria-hidden="true" />
                  Guru AI Tutor
                </span>
                <kbd className="rounded border border-obsidian-border bg-obsidian-pane px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  ⌘J
                </kbd>
              </div>
              <h3 className="mt-5 text-[19px] tracking-[-0.02em] text-foreground">
                Context-aware complexity &amp; edge-case coaching
              </h3>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-muted-foreground">
                Ask Guru AI right inside any topic or problem solver to diagnose
                bottlenecks, trace dry runs, and unblock hints without spoiling
                the whole solution.
              </p>
            </div>

            <div className="lp-well space-y-2.5 p-3.5 font-mono text-[12px]">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Prompt · TwoSum.java</span>
                <span className="text-[11px]">Complexity check</span>
              </div>
              <p className="rounded border border-obsidian-border bg-obsidian-pane px-3 py-2 text-[12.5px] text-foreground/90">
                &ldquo;Why does sorting first break index recovery?&rdquo;
              </p>
              <div className="lp-guru-callout">
                <p className="font-sans text-[12.5px] leading-5 text-foreground/90">
                  Sorting mutates original indices unless you copy value-index pairs{" "}
                  <code className="font-mono text-[11.5px]">O(n log n)</code>. Storing seen values in a{" "}
                  <code className="font-mono text-[11.5px]">HashMap</code> keeps indices intact in{" "}
                  <code className="font-mono text-[11.5px]">O(n)</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-obsidian-border pt-4 text-[13px]">
              <span className="text-muted-foreground">Available across workspace &amp; solver</span>
              <Link
                href="/problem-solver"
                className="group inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-[hsl(var(--lp-accent))]"
              >
                Open problem solver
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>

          {/* 2. Proctored Contests */}
          <article className="lp-bento-card lp-bento-narrow">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="lp-chip">
                  <Timer size={12} aria-hidden="true" />
                  Timed Contests
                </span>
                <span className="lp-chip lp-chip-success">Exam mode</span>
              </div>
              <h3 className="mt-5 text-[19px] tracking-[-0.02em] text-foreground">
                Interview pressure before the real round
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                Practice timed coding rounds and randomized MCQs in Java, C++,
                or Python under strict fullscreen and focus tracking.
              </p>
            </div>

            <div className="lp-well space-y-2.5 p-3.5">
              <div className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-muted-foreground">Session timer</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatExamTime(CODING_CONTEST_DURATION_SECONDS)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-obsidian-border pt-2.5 text-[12.5px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldAlert size={13} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  Focus guard
                </span>
                <span className="font-mono text-[11.5px] text-foreground">3-warning policy</span>
              </div>
              <div className="flex items-center justify-between border-t border-obsidian-border pt-2.5 text-[12.5px]">
                <span className="text-muted-foreground">Languages</span>
                <span className="font-mono text-[11.5px] text-foreground">Java · C++ · Python</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-obsidian-border pt-4 text-[13px]">
              <span className="text-muted-foreground">MCQ &amp; coding tracks</span>
              <Link
                href="/contest"
                className="group inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-[hsl(var(--lp-accent))]"
              >
                Open contest hub
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>

          {/* 3. Zero-Setup Playground */}
          <article className="lp-bento-card lp-bento-narrow">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="lp-chip">
                  <TerminalSquare size={12} aria-hidden="true" />
                  Java Playground
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">Zero setup</span>
              </div>
              <h3 className="mt-5 text-[19px] tracking-[-0.02em] text-foreground">
                Instant compile &amp; run in the browser
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                Prototype algorithms, verify standard library behavior, and inspect
                stdout/stderr immediately without leaving your browser.
              </p>
            </div>

            <div className="lp-well p-3.5 font-mono text-[11.5px]">
              <p className="text-muted-foreground">$ javac Main.java &amp;&amp; java Main</p>
              <p className="mt-2 text-foreground">[0, 1] · Valid: true</p>
              <p className="lp-success mt-1.5 flex items-center gap-1.5 text-[11px]">
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                Sample output · Exit code 0
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-obsidian-border pt-4 text-[13px]">
              <span className="text-muted-foreground">Sandboxed execution</span>
              <Link
                href="/playground"
                className="group inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-[hsl(var(--lp-accent))]"
              >
                Launch playground
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>

          {/* 4. Structured Roadmaps & Notes */}
          <article className="lp-bento-card lp-bento-wide">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="lp-chip">
                  <MapIcon size={12} aria-hidden="true" />
                  Roadmaps &amp; Notes
                </span>
                <span className="lp-chip">
                  <BookOpenCheck size={12} aria-hidden="true" />
                  Progress synced
                </span>
              </div>
              <h3 className="mt-5 text-[19px] tracking-[-0.02em] text-foreground">
                Ordered milestones with persistent study notes
              </h3>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-muted-foreground">
                Track completion across sequential DSA and Java architecture
                milestones while keeping personal revision notes one click away.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {ROADMAP_STEPS.map((step, index) => (
                <div
                  key={step.label}
                  className="lp-well flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      0{index + 1}
                    </span>
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {step.label}
                    </span>
                  </span>
                  <span
                    className={
                      step.done
                        ? "lp-success shrink-0 font-mono text-[11px] font-medium"
                        : "shrink-0 font-mono text-[11px] text-muted-foreground"
                    }
                  >
                    {step.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-border pt-4 text-[13px]">
              <Link
                href="/notes"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                Open study notes
              </Link>
              <Link
                href="/roadmap"
                className="group inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-[hsl(var(--lp-accent))]"
              >
                Explore interactive roadmap
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
