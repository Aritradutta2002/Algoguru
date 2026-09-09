import { motion } from "framer-motion";
import { Check, CheckCircle2, Flame, Play } from "lucide-react";

/* ── Tiny syntax palette (GitHub-dark inspired) ──────────────── */
const C = {
  plain: "#e6edf3",
  muted: "#8b949e",
  keyword: "#ff7b72",
  type: "#ffa657",
  method: "#d2a8ff",
  number: "#79c0ff",
  string: "#a5d6ff",
  punct: "#c9d1d9",
} as const;

type Token = { t: string; c?: keyof typeof C };
type Line = Token[];

const CODE: Line[] = [
  [{ t: "import", c: "keyword" }, { t: " java.util.*;" }],
  [{ t: "" }],
  [{ t: "class", c: "keyword" }, { t: " " }, { t: "Solution", c: "type" }, { t: " {" }],
  [
    { t: "    public", c: "keyword" },
    { t: " " },
    { t: "int", c: "keyword" },
    { t: "[] " },
    { t: "twoSum", c: "method" },
    { t: "(" },
    { t: "int", c: "keyword" },
    { t: "[] nums, " },
    { t: "int", c: "keyword" },
    { t: " target) {" },
  ],
  [
    { t: "        Map", c: "type" },
    { t: "<" },
    { t: "Integer", c: "type" },
    { t: ", " },
    { t: "Integer", c: "type" },
    { t: "> seen = " },
    { t: "new", c: "keyword" },
    { t: " " },
    { t: "HashMap", c: "type" },
    { t: "<>();" },
  ],
  [
    { t: "        for", c: "keyword" },
    { t: " (" },
    { t: "int", c: "keyword" },
    { t: " i = " },
    { t: "0", c: "number" },
    { t: "; i < nums.length; i++) {" },
  ],
  [
    { t: "            int", c: "keyword" },
    { t: " need = target - nums[i];" },
  ],
  [
    { t: "            if", c: "keyword" },
    { t: " (seen." },
    { t: "containsKey", c: "method" },
    { t: "(need))" },
  ],
  [
    { t: "                return", c: "keyword" },
    { t: " " },
    { t: "new", c: "keyword" },
    { t: " " },
    { t: "int", c: "keyword" },
    { t: "[]{seen." },
    { t: "get", c: "method" },
    { t: "(need), i};" },
  ],
  [{ t: "            seen." }, { t: "put", c: "method" }, { t: "(nums[i], i);" }],
  [{ t: "        }" }],
  [{ t: "        return", c: "keyword" }, { t: " " }, { t: "new", c: "keyword" }, { t: " " }, { t: "int", c: "keyword" }, { t: "[]{};" }],
  [{ t: "    }" }],
  [{ t: "}" }],
];

/** 0-based index of the line to spotlight. */
const HIGHLIGHT_LINE = 8;

const WEEK_BARS = [38, 62, 45, 80, 58, 92, 70];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] px-1 pb-12 pt-4 sm:px-6 sm:pb-14">
      {/* Ambient glow behind the window */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-10 bottom-0 rounded-[2rem] bg-[radial-gradient(closest-side,hsl(var(--primary)/0.22),transparent)] blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] text-slate-300">
            <span className="font-bold text-[#f89820]">{"{ }"}</span>
            TwoSum.java
          </div>
          <div className="flex-1" />
          <span className="hidden font-mono text-[11px] text-slate-500 sm:inline">Java 21</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#238636] px-3 py-1 text-[11px] font-semibold text-white">
            <Play size={11} fill="currentColor" /> Run
          </span>
        </div>

        {/* Code */}
        <div className="landing-code-scroll overflow-x-auto px-0 py-4 font-mono text-[12.5px] leading-[1.75] sm:text-[13px]">
          {CODE.map((line, i) => (
            <div
              key={i}
              className={
                i === HIGHLIGHT_LINE
                  ? "flex bg-emerald-400/[0.08] shadow-[inset_2px_0_0_0_#3fb950]"
                  : "flex"
              }
            >
              <span className="w-11 shrink-0 select-none pr-3 text-right text-slate-600">{i + 1}</span>
              <span className="whitespace-pre pr-6">
                {line.length === 1 && line[0].t === "" ? (
                  <span>{"\u00A0"}</span>
                ) : (
                  line.map((tok, j) => (
                    <span key={j} style={{ color: C[tok.c ?? "plain"] }}>
                      {tok.t}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Result footer */}
        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11.5px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#3fb950]">
              <Check size={13} strokeWidth={3} /> 63 / 63 testcases passed
            </span>
            <span className="text-slate-500">
              Runtime <span className="text-slate-300">1 ms</span> · Beats{" "}
              <span className="text-slate-300">98.2%</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-300">
              Accepted
            </span>
          </div>
        </div>
      </motion.div>

      {/* Floating card — verdict */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="landing-float absolute -top-1 right-0 sm:right-2"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-overlay backdrop-blur">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <p className="text-[13px] font-bold leading-tight">Accepted</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              1 ms · Beats 98%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating card — streak */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="landing-float-delayed absolute -bottom-1 left-0 sm:left-2"
      >
        <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-overlay backdrop-blur">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-primary" fill="currentColor" />
            <p className="text-[13px] font-bold">12-day streak</p>
          </div>
          <div className="mt-2.5 flex h-9 items-end gap-1.5" aria-hidden>
            {WEEK_BARS.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={
                  i === WEEK_BARS.length - 1
                    ? "w-2.5 rounded-sm bg-primary"
                    : "w-2.5 rounded-sm bg-primary/30"
                }
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
