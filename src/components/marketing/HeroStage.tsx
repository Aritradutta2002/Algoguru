import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Check,
  ChevronRight,
  CircleDot,
  FileCode2,
  FolderTree,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREVIEW_CODE, PREVIEW_TREE } from "./content";

/**
 * The hero product stage.
 *
 * A real slice of AlgoGuru's problem workspace — lesson rail, statement,
 * editor and run output — rendered as a physical object: it arrives out of
 * perspective, then leans with the pointer. The code writes itself in, a run
 * fires, and the suite goes green. All of it is content from the shipped app
 * data (Two Sum, from the Arrays track).
 *
 * Motion budget: one entrance (≈1.1s), a pointer spring, a caret loop and two
 * status beats. Everything is skipped for prefers-reduced-motion.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type TabId = "code" | "approach";
type RunState = "idle" | "running" | "passed";

export function HeroStage() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TabId>("code");
  const [lines, setLines] = useState(reduceMotion ? PREVIEW_CODE.length : 0);
  const [run, setRun] = useState<RunState>(reduceMotion ? "passed" : "idle");

  // Pointer lean
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springConfig = { stiffness: 90, damping: 18, mass: 0.6 };
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-7, 7]),
    springConfig,
  );
  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [4.5, -4.5]),
    springConfig,
  );

  useEffect(() => {
    if (reduceMotion) return;
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
    };
    const onLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [pointerX, pointerY, reduceMotion]);

  // Code writes in, then a run fires.
  useEffect(() => {
    if (reduceMotion) return;
    const timers: number[] = [];
    const start = 900;
    PREVIEW_CODE.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => setLines(index + 1), start + index * 52),
      );
    });
    const afterCode = start + PREVIEW_CODE.length * 52;
    timers.push(window.setTimeout(() => setRun("running"), afterCode + 260));
    timers.push(window.setTimeout(() => setRun("passed"), afterCode + 1000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);

  const visible = PREVIEW_CODE.slice(0, lines);
  const caretLine = Math.max(0, visible.length - 1);

  return (
    <div ref={stageRef} className="lp-stage relative z-10">
      <div className="lp-stage-glow" aria-hidden="true" />

      <motion.div
        initial={
          reduceMotion
            ? false
            : { opacity: 0, y: 46, scale: 0.94, rotateX: 12, rotateY: -12 }
        }
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0 }}
        transition={{ duration: 1.15, delay: 0.34, ease: EASE }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
          <section
            aria-label="AlgoGuru workspace preview"
            className="lp-window"
          >
            {/* chrome */}
            <div className="lp-window-bar">
              <span className="lp-traffic" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <div className="ml-1.5 flex min-w-0 items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                <FolderTree size={11} aria-hidden="true" className="shrink-0" />
                <span className="truncate">algoguru</span>
                <ChevronRight
                  size={10}
                  aria-hidden="true"
                  className="shrink-0 opacity-50"
                />
                <span className="truncate">arrays</span>
                <ChevronRight
                  size={10}
                  aria-hidden="true"
                  className="shrink-0 opacity-50"
                />
                <span className="truncate text-foreground/85">two-sum</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="hidden items-center gap-1 rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground sm:flex">
                  <Search size={9} aria-hidden="true" />
                  ⌘K
                </span>
                <span className="flex items-center gap-1 rounded-[3px] border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-primary">
                  <CircleDot size={8} aria-hidden="true" />
                  Focus
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)]">
              {/* lesson rail */}
              <nav
                aria-label="Lesson tree (preview)"
                className="hidden border-r border-line bg-[hsl(var(--surface-chrome))] p-2 sm:block"
              >
                <p className="ws-eyebrow px-1 pb-1.5 text-[9.5px]">
                  Arrays · 16
                </p>
                <ul className="space-y-px">
                  {PREVIEW_TREE.slice(0, 3).map((node, index) => (
                    <li key={node.label}>
                      <div
                        className={cn(
                          "flex h-6 items-center justify-between rounded-[3px] px-1 text-[11.5px]",
                          index === 0
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{node.label}</span>
                        <span className="font-mono text-[9px] tabular-nums opacity-55">
                          {node.meta}
                        </span>
                      </div>
                      {node.children.length > 0 && (
                        <ul className="mb-1 ml-1.5 border-l border-line pl-1.5">
                          {node.children.map((child) => (
                            <li key={child.label}>
                              <div
                                className={cn(
                                  "flex h-[22px] items-center gap-1.5 rounded-[3px] px-1 text-[11px]",
                                  child.state === "active"
                                    ? "bg-primary/10 text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {child.state === "done" ? (
                                  <Check
                                    size={9}
                                    aria-hidden="true"
                                    className="text-success"
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "h-[3px] w-[3px] rounded-full",
                                      child.state === "active"
                                        ? "bg-primary"
                                        : "bg-muted-foreground/40",
                                    )}
                                  />
                                )}
                                <span className="truncate">{child.label}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 border-t border-line pt-2">
                  <div className="flex items-center justify-between px-1 font-mono text-[9px] text-muted-foreground">
                    <span>track</span>
                    <span>56%</span>
                  </div>
                  <div className="ws-meter mx-1 mt-1.5 h-[2px]">
                    <span style={{ width: "56%" }} />
                  </div>
                </div>
              </nav>

              {/* document */}
              <div className="flex min-w-0 flex-col bg-[hsl(var(--surface-panel))]">
                <div className="border-b border-line px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-display text-[13.5px] font-semibold tracking-[-0.01em]">
                      Two Sum
                    </p>
                    <span
                      className="ws-chip h-[17px] text-[9.5px]"
                      data-level="easy"
                    >
                      Easy
                    </span>
                    <span
                      className="ws-chip h-[17px] text-[9.5px]"
                      data-tone="plain"
                    >
                      Hash map
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-[46ch] text-[11.5px] leading-[1.55] text-muted-foreground">
                    Return the indices of the two numbers that add up to{" "}
                    <span className="font-mono text-foreground/80">target</span>
                    . Exactly one solution exists.
                  </p>
                </div>

                {/* tabs */}
                <div className="flex items-center justify-between border-b border-line bg-[hsl(var(--surface-chrome))] pl-0.5 pr-1.5">
                  <div
                    role="tablist"
                    aria-label="Problem resources"
                    className="flex items-center"
                  >
                    {(
                      [
                        { id: "code", label: "TwoSum.java", icon: FileCode2 },
                        { id: "approach", label: "Approach", icon: Sparkles },
                      ] as const
                    ).map((item) => {
                      const selected = tab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => setTab(item.id)}
                          className={cn(
                            "relative flex h-8 items-center gap-1 px-2 font-mono text-[10.5px] transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            selected
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground/80",
                          )}
                        >
                          <item.icon size={10} aria-hidden="true" />
                          {item.label}
                          {selected && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-1.5 bottom-0 h-px bg-primary"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="flex items-center gap-1 rounded-[3px] border border-line px-1.5 py-[3px] font-mono text-[9.5px] text-muted-foreground">
                    <Play size={8} aria-hidden="true" />
                    Run
                  </span>
                </div>

                <div className="min-h-[196px] flex-1">
                  {tab === "code" ? (
                    <pre className="lp-code overflow-x-auto py-2">
                      <code>
                        {visible.map((line, index) => (
                          <span
                            key={index}
                            className={cn(
                              "flex",
                              index === caretLine &&
                                run === "idle" &&
                                "bg-primary/[0.06]",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className="w-6 shrink-0 select-none pr-1.5 text-right text-[9.5px] text-muted-foreground"
                            >
                              {index + 1}
                            </span>
                            <span
                              style={{ paddingLeft: `${line.indent * 1.35}em` }}
                            >
                              {line.tokens.map(([kind, text], tokenIndex) => (
                                <span
                                  key={tokenIndex}
                                  className={`tok-${kind}`}
                                >
                                  {text}
                                </span>
                              ))}
                              {index === caretLine && run === "idle" && (
                                <span
                                  className="lp-caret ml-px"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </span>
                        ))}
                      </code>
                    </pre>
                  ) : (
                    <div className="px-3 py-2.5 text-[11.5px] leading-[1.7] text-muted-foreground">
                      <p className="ws-eyebrow mb-1.5 text-[9.5px]">
                        One pass · hash map
                      </p>
                      <p>
                        Walk the array once. For each value, check whether its
                        complement is already in the map; if it is, both indices
                        are known.
                      </p>
                      <table className="mt-2 w-full border-collapse font-mono text-[10px]">
                        <caption className="sr-only">
                          Complexity of the one-pass approach
                        </caption>
                        <tbody>
                          {[
                            ["Time", "O(n)", "one pass, O(1) lookup"],
                            ["Space", "O(n)", "one entry per value"],
                          ].map(([label, value, note]) => (
                            <tr key={label} className="border-t border-line">
                              <th
                                scope="row"
                                className="py-1 pr-2 text-left font-normal text-muted-foreground"
                              >
                                {label}
                              </th>
                              <td className="py-1 pr-2 text-foreground">
                                {value}
                              </td>
                              <td className="py-1 text-muted-foreground">
                                {note}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* run output */}
                <div className="border-t border-line bg-[hsl(var(--surface-chrome))] px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-muted-foreground">tests</span>
                    {run === "idle" && (
                      <span className="text-muted-foreground">
                        waiting for a run
                      </span>
                    )}
                    {run === "running" && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 animate-pulse rounded-full bg-primary"
                        />
                        running 12 cases…
                      </span>
                    )}
                    {run === "passed" && (
                      <span className="lp-pass-pulse flex items-center gap-1.5 text-success">
                        <Check size={9} aria-hidden="true" strokeWidth={3} />
                        12 / 12 passed
                      </span>
                    )}
                    <span className="ml-auto text-muted-foreground">0.08s</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </motion.div>

      {/* floating status cards */}
      {!reduceMotion && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.1, ease: EASE }}
            className="lp-float-card -top-4 right-3 hidden sm:block"
            style={{ animationDelay: "-2s" }}
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                <Check
                  size={10}
                  className="text-success"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="font-mono text-[10px] font-medium text-foreground">
                  12 / 12 passed
                </p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  Two Sum · Java
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.4, ease: EASE }}
            className="lp-float-card -bottom-5 left-2 hidden sm:block"
            style={{ animationDelay: "-4.5s" }}
          >
            <div className="px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  Complexity
                </p>
                <p className="font-mono text-[9.5px] text-accent">O(n)</p>
              </div>
              <div className="mt-1 flex items-end gap-[3px]" aria-hidden="true">
                {[6, 9, 13, 17, 22, 27, 32].map((height, index) => (
                  <span
                    key={index}
                    className="w-1.5 rounded-[1px] bg-primary/60"
                    style={{ height: `${height * 0.55}px` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
