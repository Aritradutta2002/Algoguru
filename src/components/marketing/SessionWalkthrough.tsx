import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_STEPS, type SessionStepId } from "./content";

/**
 * The session walkthrough: five stages of a real AlgoGuru study session, each
 * paired with an interface fragment from that stage. This replaces the usual
 * "three feature cards" grid with one interactive narrative.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function DiscoverFragment() {
  return (
    <div className="space-y-3">
      <p className="ws-eyebrow">Continue where you stopped</p>
      <div className="rounded-sm border border-line bg-raised/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">
              Sliding window — variable size
            </p>
            <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
              Arrays · lesson 13 of 16
            </p>
          </div>
          <span className="flex h-7 items-center gap-1 rounded-xs bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
            Resume
            <ChevronRight size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="ws-meter mt-3">
          <span style={{ width: "78%" }} />
        </div>
      </div>
      <ul className="divide-y divide-line/70">
        {[
          ["Prefix sums", "lesson 14", "open"],
          ["Hashing & frequency maps", "lesson 15", "open"],
          ["Trees & recursion", "next track", "locked"],
        ].map(([label, meta, state]) => (
          <li
            key={label}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="truncate text-[12.5px] text-muted-foreground">
              {label}
            </span>
            <span className="flex shrink-0 items-center gap-2 font-mono text-[10.5px] text-muted-foreground/70">
              {meta}
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-1 rounded-full",
                  state === "open" ? "bg-muted-foreground/50" : "bg-primary/50",
                )}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnderstandFragment() {
  return (
    <div className="space-y-3">
      <p className="ws-eyebrow">Concept · two pointers</p>
      <p className="text-[13px] leading-6 text-foreground/90">
        With a{" "}
        <em className="not-italic font-medium text-foreground">sorted</em>{" "}
        array, one pointer starts at each end. Compare the pair, then move the
        pointer that can only make the sum worse. Each step retires one
        candidate, so the scan is linear.
      </p>
      <div className="rounded-sm border border-line bg-[hsl(var(--surface-chrome))] p-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
          Worked example
        </p>
        <p className="mt-2 font-mono text-[11.5px] text-foreground/85">
          nums = [1, 3, 4, 8] · target = 11
        </p>
        <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
          1 + 8 = 9 &lt; 11 → move left · 3 + 8 = 11 → found
        </p>
      </div>
      <p className="flex items-start gap-2 text-[12px] leading-5 text-muted-foreground">
        <Sparkles
          size={12}
          className="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        Every concept page ends with the mistakes people actually make in
        interviews.
      </p>
    </div>
  );
}

function SolveFragment() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ws-eyebrow">Editor · Solution.java</p>
        <span className="flex items-center gap-1 rounded-xs border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Play size={9} aria-hidden="true" />
          Run
        </span>
      </div>
      <pre className="overflow-x-auto rounded-sm border border-line bg-[hsl(var(--surface-page))] p-3 font-mono text-[11.5px] leading-[1.7] text-muted-foreground">
        <code>
          <span className="text-primary">public</span>{" "}
          <span className="text-accent">int</span>{" "}
          <span className="text-foreground">maxSum</span>(
          <span className="text-accent">int</span>[] nums,{" "}
          <span className="text-accent">int</span> k) {"{"}
          {"\n  "}
          <span className="text-accent">int</span> sum ={" "}
          <span className="text-[hsl(var(--info))]">0</span>, best ={" "}
          <span className="text-[hsl(var(--info))]">0</span>;{"\n  "}
          <span className="text-primary">for</span> (
          <span className="text-accent">int</span> i ={" "}
          <span className="text-[hsl(var(--info))]">0</span>; i &lt;
          nums.length; i++) {"{"}
          {"\n    "}sum += nums[i];
          {"\n    "}
          <span className="text-primary">if</span> (i &gt;= k) sum -= nums[i -
          k];
          {"\n    "}
          <span className="text-primary">if</span> (i &gt;= k -{" "}
          <span className="text-[hsl(var(--info))]">1</span>) best =
          Math.max(best, sum);
          {"\n  "}
          {"}"}
          {"\n  "}
          <span className="text-primary">return</span> best;
          {"\n"}
          {"}"}
        </code>
      </pre>
      <div className="flex items-center gap-2 rounded-sm border border-success/25 bg-success/10 px-2.5 py-1.5 font-mono text-[11px] text-success">
        <Check size={11} aria-hidden="true" />
        12 / 12 test cases passed · 0.09 s
      </div>
    </div>
  );
}

function ReviewFragment() {
  return (
    <div className="space-y-3">
      <p className="ws-eyebrow">Complexity · recorded with the solution</p>
      <dl className="divide-y divide-line/70">
        {[
          [
            "Time",
            "O(n)",
            "Each element enters and leaves the window at most once.",
          ],
          ["Space", "O(1)", "Two running sums; the input is read in place."],
        ].map(([term, value, note]) => (
          <div
            key={term}
            className="grid grid-cols-[64px_56px_1fr] items-start gap-3 py-2.5"
          >
            <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              {term}
            </dt>
            <dd className="font-mono text-[12.5px] text-foreground">{value}</dd>
            <dd className="text-[12px] leading-5 text-muted-foreground">
              {note}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-l border-primary/40 pl-2.5 text-[12px] leading-5 text-muted-foreground">
        Follow-up they will ask: “What if the array contains negatives?” — the
        fixed-size window still holds; a variable-size window needs a monotonic
        condition.
      </p>
    </div>
  );
}

function TrackFragment() {
  const weeks = [
    1, 0, 2, 3, 1, 0, 2, 4, 2, 1, 3, 2, 0, 1, 2, 3, 4, 2, 1, 0, 2, 3, 1, 2,
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 divide-x divide-line">
        {[
          ["Problems solved", "128"],
          ["Bookmarked", "19"],
          ["Notes written", "34"],
        ].map(([label, value]) => (
          <div key={label} className="px-3 first:pl-0">
            <p className="font-display text-[22px] font-semibold leading-none tracking-[-0.02em]">
              {value}
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <p className="ws-eyebrow">Practice history · last 24 sessions</p>
          <p className="font-mono text-[10.5px] text-muted-foreground">daily</p>
        </div>
        <div className="mt-2 flex items-end gap-1" aria-hidden="true">
          {weeks.map((value, index) => (
            <span
              key={index}
              className="w-full rounded-xs"
              style={{
                height: `${8 + value * 6}px`,
                background:
                  value === 0
                    ? "hsl(var(--surface-line-strong) / 0.7)"
                    : `hsl(var(--primary) / ${0.25 + value * 0.16})`,
              }}
            />
          ))}
        </div>
        <p className="sr-only">
          A bar chart of practice sessions over the last 24 days, ranging from
          zero to four problems per day.
        </p>
      </div>
      <p className="text-[12px] leading-5 text-muted-foreground">
        Progress is stored against your account — completion, bookmarks, notes
        and the problems you have already attempted.
      </p>
      <p className="font-mono text-[10.5px] text-muted-foreground/70">
        Illustration of the practice dashboard. Your own history starts empty.
      </p>
    </div>
  );
}

const FRAGMENTS: Record<SessionStepId, () => JSX.Element> = {
  discover: DiscoverFragment,
  understand: UnderstandFragment,
  solve: SolveFragment,
  review: ReviewFragment,
  track: TrackFragment,
};

export function SessionWalkthrough() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<SessionStepId>("discover");
  const listRef = useRef<HTMLDivElement>(null);
  const activeIndex = SESSION_STEPS.findIndex((step) => step.id === active);
  const Fragment = FRAGMENTS[active];

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? (activeIndex + 1) % SESSION_STEPS.length
        : event.key === "ArrowUp"
          ? (activeIndex - 1 + SESSION_STEPS.length) % SESSION_STEPS.length
          : event.key === "Home"
            ? 0
            : SESSION_STEPS.length - 1;
    setActive(SESSION_STEPS[next].id);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    buttons?.[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      <div>
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="vertical"
          aria-label="Stages of a study session"
          onKeyDown={onKeyDown}
          className="flex flex-col"
        >
          {SESSION_STEPS.map((step) => {
            const selected = step.id === active;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                id={`session-tab-${step.id}`}
                aria-selected={selected}
                aria-controls={`session-panel-${step.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(step.id)}
                className={cn(
                  "group relative border-t border-line px-0 py-4 text-left transition-colors duration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0 h-px w-full origin-left bg-primary transition-transform duration-3",
                    selected ? "scale-x-100" : "scale-x-0",
                  )}
                />
                <span className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      "font-mono text-[10.5px] tabular-nums tracking-[0.08em]",
                      selected ? "text-primary" : "text-muted-foreground/60",
                    )}
                  >
                    {step.index}
                  </span>
                  <span className="font-display text-[15px] font-medium tracking-[-0.015em]">
                    {step.title}
                  </span>
                </span>
                <span className="mt-1 block pl-[2.1rem] text-[12.5px] leading-5 text-muted-foreground">
                  {step.body}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`session-panel-${active}`}
        aria-labelledby={`session-tab-${active}`}
        className="relative min-h-[380px]"
      >
        <div className="ws-panel h-full p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: EASE }}
            >
              <Fragment />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
