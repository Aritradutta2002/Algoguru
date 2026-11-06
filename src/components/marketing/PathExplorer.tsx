import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PATH_NODES } from "./content";

/**
 * Learning-path explorer, drawn as a prerequisite timeline: one vertical rail,
 * a progress stroke that fills to the node you select, and the node's detail
 * beside it. Keyboard operable — every node is a real button.
 */

const STATE_LABEL: Record<(typeof PATH_NODES)[number]["state"], string> = {
  done: "Completed",
  active: "In progress",
  next: "Up next",
  locked: "Locked",
};

export function PathExplorer() {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>("sliding-window");
  const selectedIndex = Math.max(
    0,
    PATH_NODES.findIndex((node) => node.id === selectedId),
  );
  const selected = useMemo(
    () => PATH_NODES.find((node) => node.id === selectedId) ?? PATH_NODES[2],
    [selectedId],
  );
  const progress = (selectedIndex / (PATH_NODES.length - 1)) * 100;
  const completed = PATH_NODES.filter((node) => node.state === "done").length;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-0"
    >
      {/* Rail */}
      <div className="lg:border-r lg:border-line lg:pr-10">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <p className="lp-kicker">DSA path · prerequisite order</p>
          <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {completed} / {PATH_NODES.length} complete
          </p>
        </div>

        <ol className="relative mt-4 pl-[22px]">
          <span
            aria-hidden="true"
            className="absolute left-[6px] top-2 h-[calc(100%-16px)] w-px bg-line"
          />
          <motion.span
            aria-hidden="true"
            className="absolute left-[6px] top-2 h-[calc(100%-16px)] w-px origin-top bg-primary"
            initial={false}
            animate={{ scaleY: progress / 100 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
          />

          {PATH_NODES.map((node, index) => {
            const isSelected = node.id === selected.id;
            return (
              <li key={node.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex w-full items-start gap-3 rounded-sm py-2.5 pl-1 pr-2 text-left transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-[22px] top-[15px] flex h-[13px] w-[13px] items-center justify-center rounded-full border transition-all duration-2",
                      node.state === "done"
                        ? "border-success/50 bg-success/15"
                        : node.state === "active"
                          ? "border-primary bg-primary/20"
                          : isSelected
                            ? "border-primary/60 bg-primary/15"
                            : "border-line bg-[hsl(var(--surface-page))]",
                    )}
                  >
                    {node.state === "done" ? (
                      <Check
                        size={7}
                        strokeWidth={4}
                        className="text-success"
                      />
                    ) : (
                      <span
                        className={cn(
                          "h-[3px] w-[3px] rounded-full",
                          node.state === "active" || isSelected
                            ? "bg-primary"
                            : "bg-muted-foreground/40",
                        )}
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "truncate text-[14px] tracking-[-0.01em]",
                          node.state === "locked" && "text-muted-foreground",
                        )}
                      >
                        {node.label}
                      </span>
                      {isSelected && (
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>{node.meta}</span>
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        ·
                      </span>
                      <span
                        className={cn(
                          node.state === "done" && "text-success",
                          node.state === "active" && "text-primary",
                        )}
                      >
                        {STATE_LABEL[node.state]}
                      </span>
                      {node.state === "locked" && (
                        <Lock
                          size={9}
                          aria-hidden="true"
                          className="text-muted-foreground"
                        />
                      )}
                    </span>
                  </span>

                  <span className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Detail */}
      <div className="relative lg:pl-10">
        <motion.div
          key={selected.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="lp-kicker">Selected node</p>
            <p className="font-mono text-[32px] font-medium leading-none tracking-[-0.04em] text-muted-foreground tabular-nums">
              {String(selectedIndex + 1).padStart(2, "0")}
            </p>
          </div>

          <h3 className="mt-3 font-display text-[clamp(1.4rem,1.1rem+0.9vw,1.9rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {selected.label}
          </h3>
          <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">
            {selected.meta} · {STATE_LABEL[selected.state]}
          </p>

          <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.8] text-muted-foreground">
            {selected.note}
          </p>

          <dl className="mt-7 border-t border-line">
            {[
              ["Format", "Concept page · worked examples · practice problems"],
              ["Unlocks", "The previous lesson in this path"],
              ["Language", "Java — editor, tests and solutions"],
            ].map(([term, value]) => (
              <div
                key={term}
                className="grid grid-cols-[74px_1fr] gap-3 border-b border-line/70 py-2.5"
              >
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {term}
                </dt>
                <dd className="text-[12.5px] leading-[1.6] text-foreground/85">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            to="/auth?mode=signup"
            className="lp-ghost group mt-6 !h-10 !text-[12.5px]"
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
    </motion.div>
  );
}
