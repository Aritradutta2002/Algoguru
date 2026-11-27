"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, Check, Code2, FileText, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CodeLine } from "./codeSnippet";
import { DEMO_SESSION, DEMO_TABS, type DemoTabId } from "./demoSession";

const PANE_TRANSITION = { duration: 0.2, ease: EASE_OUT };
const ROW_TRANSITION = { duration: 0.25, ease: EASE_OUT };

const PANE_VARIANTS: Variants = {
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const TAB_ICONS = {
  problem: FileText,
  solution: Code2,
  tests: FlaskConical,
} as const;

const TAB_NOTES: Record<DemoTabId, string> = {
  problem: "Read the statement, worked examples and constraints.",
  solution: "Study a reference solution with line-by-line notes.",
  tests: "Run the suite and check every edge case.",
};

export function WorkspaceDemoSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<DemoTabId>("problem");

  const panel = (
    <div className="space-y-5">
      {active === "problem" && <ProblemPane />}
      {active === "solution" && <SolutionPane reduceMotion={reduceMotion} />}
      {active === "tests" && <TestsPane reduceMotion={reduceMotion} />}
    </div>
  );

  return (
    <section id="demo" aria-labelledby="demo-heading" className="lp-band lp-section">
      <div className="lp-container lp-split">
        <div className="lg:sticky lg:top-24">
          <h2 id="demo-heading" className="lp-h2">
            From problem to solution, one step at a time.
          </h2>
          <p className="lp-lead mt-4 max-w-md">
            Walk through Valid Parentheses, then inspect the annotated Java solution
            and sample test cases.
          </p>

          <ul className="mt-10 max-w-md border-y border-obsidian-border lp-list">
            {DEMO_TABS.map((tab, index) => {
              const Icon = TAB_ICONS[tab.id];
              const selected = tab.id === active;
              return (
                <li key={tab.id}>
                  <Button
                    variant="bare"
                    size="bare"
                    type="button"
                    onClick={() => setActive(tab.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-start justify-start gap-4 whitespace-normal rounded-none py-4 text-left transition-colors",
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground/85",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 font-mono text-[12px] transition-colors",
                        selected ? "text-[hsl(var(--lp-accent))]" : "text-muted-foreground/70",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex items-center gap-2 text-[14.5px] font-medium transition-colors",
                          selected ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <Icon size={15} aria-hidden="true" />
                        {tab.label}
                      </span>
                      <span className="mt-1 block text-[13.5px] font-normal leading-6 text-muted-foreground">
                        {TAB_NOTES[tab.id]}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lp-frame">
          <div className="lp-frame-bar">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="lp-dot" />
              <span className="lp-dot" />
              <span className="lp-dot" />
            </div>
            <p className="ml-2 min-w-0 truncate text-[12.5px] text-muted-foreground">
              Stack
              <span className="mx-1.5 text-muted-foreground/50" aria-hidden="true">/</span>
              <span className="font-medium text-foreground">{DEMO_SESSION.title}</span>
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                O(n) time · O(n) space
              </span>
              <span className="lp-chip hidden sm:inline-flex">Interactive demo</span>
            </div>
          </div>

          <Tabs
            value={active}
            onValueChange={(value) => setActive(value as DemoTabId)}
            className="contents"
          >
            <div className="flex items-center justify-between border-b border-obsidian-border px-2 sm:px-3">
              <TabsList
                aria-label="Workspace demo views"
                className="h-auto flex items-center justify-start gap-1 rounded-none border-b-0 bg-transparent p-0"
              >
                {DEMO_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.id];

                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      id={`demo-tab-${tab.id}`}
                      aria-controls={`demo-panel-${tab.id}`}
                      className="lp-tab h-auto rounded-none px-3.5 py-0 text-[13px] focus-visible:-outline-offset-2 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none [&_svg]:shrink-0"
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <Link
                href="/problem-solver"
                className="hidden items-center gap-1 px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Try in solver
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="p-5 sm:p-7">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  role="tabpanel"
                  id={`demo-panel-${active}`}
                  aria-labelledby={`demo-tab-${active}`}
                  tabIndex={0}
                  variants={PANE_VARIANTS}
                  initial={false}
                  animate="center"
                  exit="exit"
                  transition={{
                    ...PANE_TRANSITION,
                    duration: reduceMotion ? 0 : PANE_TRANSITION.duration,
                  }}
                  className="demo-pane"
                >
                  {panel}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

function ProblemPane() {
  const session = DEMO_SESSION;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="lp-chip lp-chip-success">{session.difficulty}</span>
        {session.tags.map((tag) => (
          <span key={tag} className="lp-chip">
            {tag}
          </span>
        ))}
        <span className="ml-auto font-mono text-[11.5px] text-muted-foreground">{session.index}</span>
      </div>

      <div>
        <h3 className="text-[1.375rem] tracking-[-0.02em] text-foreground">{session.title}</h3>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-7 text-muted-foreground">
          {session.statement}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {session.examples.map((example, index) => (
          <div key={example.input} className="lp-well px-4 py-3.5">
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
              Example {index + 1}
            </p>
            <p className="mt-2 font-mono text-[12.5px] text-foreground">{example.input}</p>
            <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
              Output: <span className="text-foreground">{example.output}</span>
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[12.5px] font-medium text-foreground">Constraints</p>
        <ul className="mt-2 space-y-1.5">
          {session.constraints.map((constraint) => (
            <li
              key={constraint}
              className="flex items-start gap-2.5 text-[13.5px] leading-6 text-muted-foreground"
            >
              <span className="mt-[0.7rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden="true" />
              {constraint}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function SolutionPane({ reduceMotion }: { reduceMotion: boolean | null }) {
  const session = DEMO_SESSION;

  return (
    <>
      <div className="lp-well overflow-hidden">
        <div className="flex items-center justify-between border-b border-obsidian-border px-4 py-2.5">
          <span className="font-mono text-[12px] text-foreground">Solution.java</span>
          <span className="font-mono text-[11.5px] text-muted-foreground">Java 17 · ArrayDeque</span>
        </div>
        <pre
          tabIndex={0}
          aria-label="Annotated Java solution for Valid Parentheses"
          className="landing-code"
        >
          <code>
            {session.code.map((line, index) => (
              <CodeLine key={index} tokens={line} />
            ))}
          </code>
        </pre>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {session.annotations.map((annotation, index) => (
          <motion.div
            key={annotation.line}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ROW_TRANSITION, delay: reduceMotion ? 0 : index * 0.05 }}
            className="lp-well border-l-2 border-l-[hsl(var(--lp-accent))] px-3.5 py-2.5"
          >
            <span className="font-mono text-[11.5px] text-muted-foreground">Line {annotation.line}</span>
            <p className="mt-1 text-[13px] leading-5 text-foreground/85">{annotation.note}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function TestsPane({ reduceMotion }: { reduceMotion: boolean | null }) {
  const session = DEMO_SESSION;
  const total = session.tests.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[14px] font-medium text-foreground">Test suite</p>
          <span className="hidden font-mono text-[11.5px] text-muted-foreground sm:inline">
            Sample results
          </span>
        </div>
        <span className="lp-chip lp-chip-success">
          <Check size={12} strokeWidth={2.75} aria-hidden="true" />
          {total} / {total} passed
        </span>
      </div>

      <div className="lp-well overflow-hidden">
        <ul className="lp-list">
          {session.tests.map((test, index) => (
            <motion.li
              key={test.input}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...ROW_TRANSITION, delay: reduceMotion ? 0 : index * 0.04 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <Check size={13} strokeWidth={2.75} className="lp-success shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-foreground">
                {test.input}
              </span>
              <span className="hidden font-mono text-[12px] text-muted-foreground sm:inline">
                {test.result}
              </span>
              <span className="w-14 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                {test.runtime}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <p role="status" className="text-[13px] text-muted-foreground">
        All {total} tests completed. Every bracket closes in the right order.
      </p>
    </>
  );
}
