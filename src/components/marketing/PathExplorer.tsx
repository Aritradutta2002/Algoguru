import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PATH_NODES } from "./content";

/**
 * Learning-path explorer. A vertical prerequisite chain on the left, the
 * selected node's detail on the right — the spatial pattern of a file tree
 * beside a note, rather than a folder of cards.
 *
 * Statuses are honest: "done" / "in progress" / "next" / "locked" describe what
 * the app already tracks per lesson.
 */

const STATE_LABEL: Record<(typeof PATH_NODES)[number]["state"], string> = {
  done: "Completed",
  active: "In progress",
  next: "Up next",
  locked: "Unlocks after the previous lesson",
};

export function PathExplorer() {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>("sliding-window");
  const selected =
    PATH_NODES.find((node) => node.id === selectedId) ?? PATH_NODES[2];

  return (
    <div className="grid gap-0 border-y border-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="lg:border-r lg:border-line">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="ws-eyebrow">DSA path · prerequisite order</p>
          <p className="font-mono text-[10.5px] text-muted-foreground">
            {PATH_NODES.filter((node) => node.state === "done").length} /{" "}
            {PATH_NODES.length} complete
          </p>
        </div>
        <ul>
          {PATH_NODES.map((node, index) => {
            const isSelected = node.id === selected.id;
            return (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isSelected ? "bg-raised" : "hover:bg-raised/60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-0 left-0 w-px",
                      isSelected ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border font-mono text-[9.5px]",
                      node.state === "done"
                        ? "border-success/40 bg-success/10 text-success"
                        : node.state === "active"
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : node.state === "next"
                            ? "border-line text-muted-foreground"
                            : "border-line/70 text-muted-foreground/50",
                    )}
                  >
                    {node.state === "done" ? (
                      <Check size={10} strokeWidth={3} aria-hidden="true" />
                    ) : node.state === "locked" ? (
                      <Lock size={9} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-[13.5px]",
                          node.state === "locked"
                            ? "text-muted-foreground/70"
                            : "text-foreground",
                        )}
                      >
                        {node.label}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
                      {node.meta}
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground/40"
                      >
                        ·
                      </span>
                      <span
                        className={cn(
                          node.state === "done" && "text-success",
                          node.state === "active" && "text-primary",
                        )}
                      >
                        {node.state === "done"
                          ? "Completed"
                          : node.state === "active"
                            ? "In progress"
                            : node.state === "next"
                              ? "Up next"
                              : "Locked"}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative bg-[hsl(var(--surface-chrome))] px-5 py-6 sm:px-7">
        <motion.div
          key={selected.id}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="ws-eyebrow">Selected lesson track</p>
          <h3 className="mt-2 font-display text-[22px] font-medium tracking-[-0.025em]">
            {selected.label}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {selected.meta} · {STATE_LABEL[selected.state]}
          </p>
          <p className="mt-4 max-w-[44ch] text-[13.5px] leading-6 text-muted-foreground">
            {selected.note}
          </p>

          <dl className="mt-6 divide-y divide-line/70 border-t border-line">
            {[
              ["Format", "Concept page · worked examples · practice problems"],
              ["Prerequisite", "The previous lesson in this path"],
              ["Language", "Java — editor, tests and solutions"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="grid grid-cols-[100px_1fr] gap-3 py-2.5"
              >
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {term}
                </dt>
                <dd className="text-[12.5px] leading-5 text-foreground/85">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            to="/auth?mode=signup"
            className="group mt-6 inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-raised px-3 text-[12.5px] font-medium text-foreground transition-colors duration-1 hover:border-primary/40 hover:bg-raised/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open this path
            <ArrowUpRight
              size={13}
              className="text-muted-foreground transition-transform duration-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
