import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronRight,
  CircleDot,
  FileCode2,
  FolderTree,
  Play,
  Search,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREVIEW_CODE, PREVIEW_TREE } from "./content";

/**
 * The product window shown in the hero. It renders AlgoGuru's real workspace
 * structure — lesson tree, problem statement, editor, run output, inspector —
 * and reveals in the order the app actually assembles itself: shell, rail,
 * document, inspector.
 *
 * Everything is real content from the shipped product data (Two Sum lives in
 * src/data/practiceData.ts). Nothing here is a fabricated metric.
 */

type TabId = "code" | "approach" | "notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "code", label: "TwoSum.java" },
  { id: "approach", label: "Approach" },
  { id: "notes", label: "Notes" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WorkspacePreview({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<TabId>("code");
  const [testsPassed, setTestsPassed] = useState(Boolean(reduceMotion));
  const tabListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) {
      setTestsPassed(true);
      return;
    }
    const timer = window.setTimeout(() => setTestsPassed(true), 2400);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const reveal = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay, ease: EASE },
        };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = TABS.findIndex((item) => item.id === tab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + TABS.length) % TABS.length
          : event.key === "Home"
            ? 0
            : TABS.length - 1;
    setTab(TABS[nextIndex].id);
    const buttons =
      tabListRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Depth: one offset plane, no blur stack, no glow. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 -bottom-2 h-6 rounded-b-lg border border-t-0 border-line bg-[hsl(var(--surface-chrome))]"
      />

      <motion.section
        {...reveal(0.05)}
        aria-label="AlgoGuru workspace preview"
        className="ws-window relative"
      >
        {/* Window chrome */}
        <div className="ws-window-bar">
          <span className="ws-traffic" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <div className="ml-2 flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <FolderTree size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">algoguru</span>
            <ChevronRight
              size={11}
              aria-hidden="true"
              className="shrink-0 opacity-50"
            />
            <span className="truncate">arrays</span>
            <ChevronRight
              size={11}
              aria-hidden="true"
              className="shrink-0 opacity-50"
            />
            <span className="truncate text-foreground/80">two-sum</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-xs border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
              <Search size={10} aria-hidden="true" />
              ⌘K
            </span>
            <span className="flex items-center gap-1.5 rounded-xs border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
              <CircleDot size={9} aria-hidden="true" />
              Focus
            </span>
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[188px_1fr] xl:grid-cols-[188px_1fr_232px]">
          {/* Rail */}
          <motion.nav
            {...reveal(0.16)}
            aria-label="Lesson tree (preview)"
            className="hidden border-r border-line bg-[hsl(var(--surface-chrome))] p-2.5 md:block"
          >
            <p className="ws-eyebrow px-1.5 pb-2">Track · Arrays</p>
            <ul className="space-y-0.5">
              {PREVIEW_TREE.map((node, index) => (
                <li key={node.label}>
                  <div
                    className={cn(
                      "flex h-7 items-center justify-between rounded-xs px-1.5 text-[12.5px]",
                      index === 0 ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">{node.label}</span>
                    <span className="font-mono text-[10px] tabular-nums opacity-60">
                      {node.meta}
                    </span>
                  </div>
                  {node.children.length > 0 && (
                    <ul className="mb-1 ml-2 border-l border-line pl-2">
                      {node.children.map((child) => (
                        <li key={child.label}>
                          <div
                            className={cn(
                              "flex h-6 items-center gap-1.5 rounded-xs px-1.5 text-[12px]",
                              child.state === "active"
                                ? "bg-primary/10 text-foreground"
                                : child.state === "done"
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/70",
                            )}
                          >
                            {child.state === "done" ? (
                              <Check
                                size={10}
                                aria-hidden="true"
                                className="text-success"
                              />
                            ) : child.state === "active" ? (
                              <span
                                aria-hidden="true"
                                className="h-1 w-1 rounded-full bg-primary"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="h-1 w-1 rounded-full bg-muted-foreground/40"
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
            <div className="mt-3 border-t border-line pt-2.5">
              <div className="flex items-center justify-between px-1.5 font-mono text-[10px] text-muted-foreground">
                <span>Track progress</span>
                <span>56%</span>
              </div>
              <div className="ws-meter mt-1.5 mx-1.5">
                <span style={{ width: "56%" }} />
              </div>
            </div>
          </motion.nav>

          {/* Document */}
          <motion.div
            {...reveal(0.24)}
            className="flex min-w-0 flex-col bg-[hsl(var(--surface-panel))]"
          >
            <div className="border-b border-line px-3.5 py-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em]">
                  Two Sum
                </h3>
                <span className="ws-chip" data-level="easy">
                  Easy
                </span>
                <span className="ws-chip" data-tone="plain">
                  Arrays
                </span>
                <span className="ws-chip" data-tone="plain">
                  Hash map
                </span>
              </div>
              <p className="mt-2 max-w-[46ch] text-[12.5px] leading-5 text-muted-foreground">
                Given an array of integers and a target, return the indices of
                the two numbers that add up to the target. Exactly one solution
                exists.
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-line bg-[hsl(var(--surface-chrome))] pl-1 pr-2">
              <div
                ref={tabListRef}
                role="tablist"
                aria-label="Problem resources"
                onKeyDown={onTabKeyDown}
                className="flex min-w-0 items-center"
              >
                {TABS.map((item) => {
                  const selected = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      id={`preview-tab-${item.id}`}
                      aria-selected={selected}
                      aria-controls={`preview-panel-${item.id}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "relative flex h-9 items-center gap-1.5 px-2.5 font-mono text-[11px] transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        selected
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/80",
                      )}
                    >
                      {item.id === "code" && (
                        <FileCode2 size={11} aria-hidden="true" />
                      )}
                      {item.label}
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-2 bottom-0 h-px bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden items-center gap-1.5 rounded-xs border border-line px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex"
              >
                <Play size={9} />
                Run
              </button>
            </div>

            <div
              role="tabpanel"
              id={`preview-panel-${tab}`}
              aria-labelledby={`preview-tab-${tab}`}
              className="ws-scroll min-h-0 flex-1 overflow-hidden px-0 py-2"
            >
              {tab === "code" && (
                <pre className="overflow-x-auto px-2 font-mono text-[11.5px] leading-[1.65]">
                  <code>
                    {PREVIEW_CODE.map((line, index) => (
                      <span
                        key={index}
                        data-line={index}
                        className={cn(
                          "flex",
                          index === 6 && "bg-primary/[0.07]",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="w-7 shrink-0 select-none pr-2 text-right text-[10px] text-muted-foreground/40"
                        >
                          {index + 1}
                        </span>
                        <span style={{ paddingLeft: `${line.indent * 1.4}em` }}>
                          {line.tokens.map(([kind, text], i) => (
                            <span
                              key={i}
                              className={cn(
                                kind === "k" && "text-primary",
                                kind === "t" && "text-accent",
                                kind === "f" && "text-foreground",
                                kind === "n" && "text-[hsl(var(--info))]",
                                kind === "p" && "text-muted-foreground",
                              )}
                            >
                              {text}
                            </span>
                          ))}
                        </span>
                      </span>
                    ))}
                  </code>
                </pre>
              )}

              {tab === "approach" && (
                <div className="px-3.5 py-2 text-[12.5px] leading-6 text-muted-foreground">
                  <p className="ws-eyebrow mb-2">Approach · one pass</p>
                  <p>
                    Walk the array once. For each value, check whether its
                    complement is already in a hash map; if it is, both indices
                    are known. Otherwise record the value.
                  </p>
                  <table className="mt-3 w-full border-collapse font-mono text-[11px]">
                    <caption className="sr-only">
                      Complexity of the one-pass hash map approach
                    </caption>
                    <tbody>
                      {[
                        ["Time", "O(n)", "one pass, O(1) average lookup"],
                        ["Space", "O(n)", "one entry per element"],
                      ].map(([label, value, note]) => (
                        <tr key={label} className="border-t border-line">
                          <th
                            scope="row"
                            className="py-1.5 pr-3 text-left font-normal text-muted-foreground/70"
                          >
                            {label}
                          </th>
                          <td className="py-1.5 pr-3 text-foreground">
                            {value}
                          </td>
                          <td className="py-1.5 text-muted-foreground/70">
                            {note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "notes" && (
                <div className="px-3.5 py-2 text-[12.5px] leading-6 text-muted-foreground">
                  <p className="ws-eyebrow mb-2">
                    Your note · saved to this problem
                  </p>
                  <p>
                    Remember to mention the brute-force baseline first: O(n²)
                    time, O(1) space. The hash map wins on time and costs space
                    — say that out loud.
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
                    <Check
                      size={11}
                      aria-hidden="true"
                      className="text-success"
                    />
                    saved 4 minutes ago
                  </p>
                </div>
              )}
            </div>

            {/* Run output */}
            <div className="border-t border-line bg-[hsl(var(--surface-chrome))] px-3 py-2">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <SquareTerminal
                  size={12}
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
                <span className="text-muted-foreground">tests</span>
                {testsPassed ? (
                  <motion.span
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex items-center gap-1.5 text-success"
                  >
                    <Check size={11} aria-hidden="true" />2 / 2 passed
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
                    />
                    running sample cases…
                  </span>
                )}
                <span className="ml-auto hidden text-muted-foreground/60 sm:inline">
                  0.08 s
                </span>
              </div>
            </div>
          </motion.div>

          {/* Inspector */}
          <motion.aside
            {...reveal(0.32)}
            aria-label="Inspector (preview)"
            className="hidden border-l border-line bg-[hsl(var(--surface-chrome))] p-3 xl:block"
          >
            <p className="ws-eyebrow">Hints</p>
            <ul className="mt-2 space-y-2 text-[11.5px] leading-5 text-muted-foreground">
              <li className="border-l border-line pl-2">
                What would you need to know at index{" "}
                <span className="font-mono">i</span> to finish in one step?
              </li>
              <li className="border-l border-primary/40 pl-2 text-foreground/80">
                Store the values you have already seen, keyed by value.
              </li>
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <p className="ws-eyebrow">Next up</p>
              <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
                Sliding window · maximum sum subarray of size k
              </p>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <p className="ws-eyebrow flex items-center gap-1.5">
                <Sparkles size={10} aria-hidden="true" />
                Guru AI
              </p>
              <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
                Ask for a hint before the solution — it will not hand you the
                answer.
              </p>
            </div>
          </motion.aside>
        </div>
      </motion.section>
    </div>
  );
}
