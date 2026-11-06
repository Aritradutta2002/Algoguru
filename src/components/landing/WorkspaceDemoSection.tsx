import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Check, Code2, FileText, FlaskConical, Terminal } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CodeLine } from "./codeSnippet";
import { DEMO_SESSION, DEMO_TABS, type DemoTabId } from "./demoSession";

const PANE_TRANSITION = { duration: 0.22, ease: EASE_OUT };
const ROW_TRANSITION = { duration: 0.3, ease: EASE_OUT };

const PANE_VARIANTS: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: 8 * direction }),
  center: { opacity: 1, y: 0 },
  exit: (direction: number) => ({ opacity: 0, y: -8 * direction }),
};

const TAB_ICONS = {
  problem: FileText,
  solution: Code2,
  tests: FlaskConical,
} as const;

export function WorkspaceDemoSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<DemoTabId>("problem");
  const [direction, setDirection] = useState(1);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = DEMO_TABS.findIndex((tab) => tab.id === active);

  const selectTab = (id: DemoTabId, index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActive(id);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = activeIndex;

    switch (event.key) {
      case "ArrowRight":
        next = (activeIndex + 1) % DEMO_TABS.length;
        break;
      case "ArrowLeft":
        next = (activeIndex - 1 + DEMO_TABS.length) % DEMO_TABS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = DEMO_TABS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(DEMO_TABS[next].id, next);
    tabRefs.current[next]?.focus();
  };

  const panel = (
    <div className="space-y-5">
      {active === "problem" && <ProblemPane />}
      {active === "solution" && <SolutionPane reduceMotion={reduceMotion} />}
      {active === "tests" && <TestsPane reduceMotion={reduceMotion} />}
    </div>
  );

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="relative border-y border-border/60 bg-muted/20"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.14]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28 lg:px-16">
        <Reveal className="mb-10 max-w-2xl md:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            See it in action
          </p>
          <h2
            id="demo-heading"
            className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-[3.3rem]"
          >
            The whole loop, in one window.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
            Read the statement, study the annotated solution, then watch the suite
            pass — without leaving the page.
          </p>
        </Reveal>

        <Reveal delay={0.06} from="bottom">
          <div className="demo-shell">
            <div className="demo-window-bar flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="hero-traffic-dot bg-rose-400/80" aria-hidden="true" />
                <span className="hero-traffic-dot bg-amber-400/80" aria-hidden="true" />
                <span className="hero-traffic-dot bg-emerald-400/80" aria-hidden="true" />
                <span className="ml-2.5 flex items-center gap-1.5 truncate font-mono text-[10.5px] tracking-tight text-muted-foreground">
                  <Terminal size={11} aria-hidden="true" />
                  algoguru / demo
                </span>
              </div>
              <span className="hero-status-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="hero-status-dot" aria-hidden="true" />
                Interactive
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Workspace demo views"
              onKeyDown={handleTabKeyDown}
              className="demo-tabs flex items-center gap-1 border-b border-border/50 px-3 py-2.5 sm:px-4"
            >
              {DEMO_TABS.map((tab, index) => {
                const Icon = TAB_ICONS[tab.id];
                const selected = tab.id === active;

                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`demo-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`demo-panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectTab(tab.id, index)}
                    className={cn(
                      "demo-tab relative inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="demo-tab-pill"
                        className="demo-tab-pill"
                        transition={springSoft}
                        aria-hidden="true"
                      />
                    )}
                    <Icon size={13} className="relative z-10" aria-hidden="true" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-6">
              {reduceMotion ? (
                <div
                  role="tabpanel"
                  id={`demo-panel-${active}`}
                  aria-labelledby={`demo-tab-${active}`}
                  tabIndex={0}
                  className="demo-pane focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {panel}
                </div>
              ) : (
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={active}
                    role="tabpanel"
                    id={`demo-panel-${active}`}
                    aria-labelledby={`demo-tab-${active}`}
                    tabIndex={0}
                    custom={direction}
                    variants={PANE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={PANE_TRANSITION}
                    className="demo-pane focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {panel}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProblemPane() {
  const session = DEMO_SESSION;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="hero-difficulty inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
          {session.difficulty}
        </span>
        {session.tags.map((tag) => (
          <span key={tag} className="hero-tag rounded-md px-2 py-0.5 font-mono text-[10px]">
            {tag}
          </span>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{session.index}</span>
      </div>

      <div>
        <h3 className="font-display text-2xl font-bold tracking-tight">{session.title}</h3>
        <p className="mt-2 max-w-2xl text-[14px] leading-7 text-muted-foreground">
          {session.statement}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {session.examples.map((example) => (
          <div key={example.input} className="demo-example">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Input
            </p>
            <p className="mt-1 font-mono text-[12px] text-foreground">{example.input}</p>
            <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Output
            </p>
            <p className="mt-1 font-mono text-[12px] text-emerald-600 dark:text-emerald-400">
              {example.output}
            </p>
          </div>
        ))}
      </div>

      <ul className="space-y-1.5">
        {session.constraints.map((constraint) => (
          <li
            key={constraint}
            className="flex items-start gap-2 text-[12.5px] leading-6 text-muted-foreground"
          >
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
            {constraint}
          </li>
        ))}
      </ul>
    </>
  );
}

function SolutionPane({ reduceMotion }: { reduceMotion: boolean | null }) {
  const session = DEMO_SESSION;

  return (
    <>
      <div className="hero-code-shell overflow-hidden rounded-xl">
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
          aria-label="Annotated Java solution for Valid Parentheses"
          className="landing-code hero-code overflow-x-auto px-3 pb-3 pt-2 font-mono"
        >
          <code>
            {session.code.map((line, index) => (
              <CodeLine key={index} tokens={line} />
            ))}
          </code>
        </pre>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {session.annotations.map((annotation, index) => (
          <motion.div
            key={annotation.line}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ROW_TRANSITION, delay: reduceMotion ? 0 : index * 0.06 }}
            className="demo-annotation"
          >
            <span className="demo-annotation-index">L{annotation.line}</span>
            <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
              {annotation.note}
            </p>
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
        <p className="text-[13px] font-semibold">Test suite</p>
        <span className="hero-status-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="hero-status-dot" aria-hidden="true" />
          {total} / {total} passed
        </span>
      </div>

      <ul className="grid gap-2">
        {session.tests.map((test, index) => (
          <motion.li
            key={test.input}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ROW_TRANSITION, delay: reduceMotion ? 0 : index * 0.06 }}
            className="demo-test-row"
          >
            <span className="demo-test-check">
              <Check size={10} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground">
              {test.input}
            </span>
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
              → {test.result}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {test.runtime}
            </span>
          </motion.li>
        ))}
      </ul>

      <p role="status" className="text-[11.5px] font-medium text-muted-foreground">
        All {total} tests completed. Every bracket closes in the right order.
      </p>
    </>
  );
}
