import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky scroll story: the left column is a sequence of chapters, the right
 * column is a media panel that swaps as each chapter crosses the middle of the
 * viewport. On small screens the media sits inside each chapter instead of
 * sticking, so nothing is hidden.
 */

type ChapterId = "understand" | "solve" | "review" | "track";

const CHAPTERS: {
  id: ChapterId;
  index: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
}[] = [
  {
    id: "understand",
    index: "01",
    kicker: "Understand",
    title: "A page you revise, not a video you re-watch.",
    body: "Each lesson opens with the idea in one paragraph, then a worked example, then the complexity table, then the mistakes people actually make when the interviewer pushes.",
    bullets: [
      "Prerequisite-ordered",
      "Complexity in the lesson",
      "Common mistakes",
    ],
  },
  {
    id: "solve",
    index: "02",
    kicker: "Solve",
    title: "The editor sits next to the statement.",
    body: "A Monaco editor with Java support opens on the problem you are reading. Run the sample cases before you submit, and read the case that failed instead of a red cross.",
    bullets: [
      "In-browser editor",
      "Sample + hidden cases",
      "Draft saved per problem",
    ],
  },
  {
    id: "review",
    index: "03",
    kicker: "Review",
    title: "Complexity, written down while it is fresh.",
    body: "Every solution carries its time and space cost with the reasoning attached, plus the follow-up question that usually comes next in an interview.",
    bullets: [
      "Time and space logged",
      "Follow-up prompts",
      "Solution approaches",
    ],
  },
  {
    id: "track",
    index: "04",
    kicker: "Track",
    title: "Progress that survives the week.",
    body: "Completion, bookmarks, notes and the problems you have attempted are stored against your account, so the next session starts where the last one ended.",
    bullets: ["Per-problem notes", "Bookmarks", "Practice history"],
  },
];

function ConceptMedia() {
  return (
    <div className="space-y-4">
      <p className="ws-eyebrow">Two pointers · concept</p>
      <p className="text-[13px] leading-[1.75] text-foreground/90">
        With a <span className="font-medium text-foreground">sorted</span>{" "}
        array, one pointer starts at each end. Compare the pair, then move the
        pointer that can only make the sum worse. Each step retires one
        candidate, so the scan is linear.
      </p>
      <div className="rounded-sm border border-line bg-[hsl(var(--surface-chrome))] p-3">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
          Worked example
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-foreground/85">
          nums = [1, 3, 4, 8] · target = 11
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          1 + 8 = 9 &lt; 11 → move left · 3 + 8 = 11 → found
        </p>
      </div>
      <table className="w-full border-collapse font-mono text-[10.5px]">
        <caption className="sr-only">
          Complexity of the two-pointer scan
        </caption>
        <tbody>
          {[
            ["Time", "O(n)"],
            ["Space", "O(1)"],
          ].map(([label, value]) => (
            <tr key={label} className="border-t border-line">
              <th
                scope="row"
                className="py-1.5 pr-3 text-left font-normal text-muted-foreground"
              >
                {label}
              </th>
              <td className="py-1.5 text-foreground">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditorMedia() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ws-eyebrow">Solution.java</p>
        <span className="flex items-center gap-1 rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground">
          <Play size={8} aria-hidden="true" />
          Run
        </span>
      </div>
      <pre className="overflow-x-auto rounded-sm border border-line bg-[hsl(var(--surface-page))] p-3 font-mono text-[11px] leading-[1.75] text-muted-foreground">
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
      <div className="flex items-center gap-2 rounded-sm border border-success/30 bg-success/10 px-2.5 py-1.5 font-mono text-[10.5px] text-success">
        <Check size={10} aria-hidden="true" />
        12 / 12 cases passed · 0.09 s
      </div>
    </div>
  );
}

function ReviewMedia() {
  return (
    <div className="space-y-3">
      <p className="ws-eyebrow">Complexity · recorded with the solution</p>
      <dl className="divide-y divide-line/70">
        {[
          ["Time", "O(n)", "Each element enters and leaves the window once."],
          ["Space", "O(1)", "Two running sums; the input is read in place."],
        ].map(([term, value, note]) => (
          <div
            key={term}
            className="grid grid-cols-[46px_52px_1fr] items-start gap-3 py-2.5"
          >
            <dt className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
              {term}
            </dt>
            <dd className="font-mono text-[11.5px] text-foreground">{value}</dd>
            <dd className="text-[11.5px] leading-[1.6] text-muted-foreground">
              {note}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-l border-primary/50 pl-2.5 text-[11.5px] leading-[1.7] text-muted-foreground">
        <span className="text-foreground/85">Follow-up:</span> what changes if
        the array contains negatives? The fixed-size window still holds; a
        variable window needs a monotonic condition.
      </p>
    </div>
  );
}

function TrackMedia() {
  const bars = [1, 0, 2, 3, 1, 0, 2, 4, 2, 1, 3, 2, 0, 1, 2, 3, 4, 2];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 divide-x divide-line">
        {[
          ["128", "solved"],
          ["19", "bookmarked"],
          ["34", "notes"],
        ].map(([value, label]) => (
          <div key={label} className="px-3 first:pl-0">
            <p
              className="font-display text-[20px] font-semibold leading-none tracking-[-0.02em]"
              data-numeric
            >
              {value}
            </p>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {bars.map((value, index) => (
          <span
            key={index}
            className="w-full rounded-[1px]"
            style={{
              height: `${6 + value * 5}px`,
              background:
                value === 0
                  ? "hsl(var(--surface-line-strong) / 0.75)"
                  : `hsl(var(--primary) / ${0.24 + value * 0.16})`,
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[9.5px] text-muted-foreground">
        Illustration — your own history starts empty.
      </p>
    </div>
  );
}

const MEDIA: Record<ChapterId, () => JSX.Element> = {
  understand: ConceptMedia,
  solve: EditorMedia,
  review: ReviewMedia,
  track: TrackMedia,
};

export function ScrollStory() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<ChapterId>("understand");
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const ActiveMedia = MEDIA[active];

  useEffect(() => {
    const nodes = Object.values(refs.current).filter(
      (node): node is HTMLDivElement => Boolean(node),
    );
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined")
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute(
          "data-chapter",
        ) as ChapterId | null;
        if (id) setActive(id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.25, 0.6, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
      <div>
        {CHAPTERS.map((chapter) => {
          const isActive = active === chapter.id;
          const Media = MEDIA[chapter.id];
          return (
            <div
              key={chapter.id}
              data-chapter={chapter.id}
              ref={(node) => {
                refs.current[chapter.id] = node;
              }}
              className="lp-chapter relative flex flex-col justify-center py-8 lg:min-h-[58vh] lg:py-14"
              data-active={isActive}
            >
              <span className="lp-chapter-rule" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <span className="lp-chapter-index lp-index">
                  {chapter.index}
                </span>
                <span className="lp-index text-[10px] uppercase tracking-[0.16em]">
                  {chapter.kicker}
                </span>
              </div>
              <h3
                className={cn(
                  "mt-3 max-w-[26ch] font-display text-[clamp(1.35rem,1rem+1vw,1.85rem)] font-semibold leading-[1.14] tracking-[-0.028em] transition-colors duration-3",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {chapter.title}
              </h3>
              <p className="mt-3 max-w-[44ch] text-[13px] leading-[1.75] text-muted-foreground">
                {chapter.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {chapter.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="h-[3px] w-[3px] rounded-full bg-primary/70"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>

              {/* Mobile media */}
              <div className="mt-6 lg:hidden">
                <div className="lp-cell rounded-md border border-line p-3.5">
                  <Media />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky media — decorative; the chapter copy above carries the meaning,
          and the per-chapter copies below carry it on small screens. */}
      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-24">
          <div className="lp-cell overflow-hidden rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-[hsl(var(--surface-chrome))] px-3 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="lp-traffic" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="ml-1">algoguru · lesson</span>
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {active}
              </span>
            </div>
            <div className="min-h-[320px] p-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ActiveMedia />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
            <span>
              {CHAPTERS.findIndex((chapter) => chapter.id === active) + 1} /{" "}
              {CHAPTERS.length}
            </span>
            <span>scroll to continue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
