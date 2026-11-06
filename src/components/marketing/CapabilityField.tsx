import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Command,
  CornerDownLeft,
  FileCode2,
  Search,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CAPABILITY_FRAGMENTS } from "./content";

/**
 * Capabilities as interface fragments rather than icon cards: a bento grid of
 * uneven cells, each holding a real sliver of the product. Cells track the
 * pointer with a soft radial highlight (CSS custom properties, no re-render).
 */

function SpotCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        node.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }}
      className={cn(
        "lp-cell group relative flex flex-col justify-between rounded-md border border-line p-5 transition-[transform,border-color] duration-2 hover:-translate-y-0.5 hover:border-[hsl(var(--surface-line-strong))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CellCopy({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative mt-5 border-t border-line/80 pt-3.5">
      <h3 className="text-[13.5px] font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-[42ch] text-[12px] leading-[1.7] text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function EditorFragment() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-[hsl(var(--surface-page))]">
      <div className="flex items-center gap-2 border-b border-line bg-[hsl(var(--surface-chrome))] px-2 py-1.5">
        <FileCode2 size={10} className="text-primary" aria-hidden="true" />
        <span className="font-mono text-[10px] text-foreground/80">
          TwoSum.java
        </span>
        <span className="ml-auto rounded-[2px] border border-line px-1 font-mono text-[9px] text-muted-foreground">
          Java
        </span>
      </div>
      <pre className="overflow-hidden p-2.5 font-mono text-[10.5px] leading-[1.85] text-muted-foreground">
        <code>
          <span className="text-primary">for</span> (
          <span className="text-accent">int</span> i ={" "}
          <span className="text-[hsl(var(--info))]">0</span>; i &lt;
          nums.length; i++) {"{"}
          {"\n  "}
          <span className="text-accent">int</span> need = target - nums[i];
          {"\n  "}
          <span className="text-primary">if</span> (seen.containsKey(need)){" "}
          {"{"}
          {"\n    "}
          <span className="text-primary">return</span>{" "}
          <span className="text-primary">new</span>{" "}
          <span className="text-accent">int</span>[] {"{"} seen.get(need), i{" "}
          {"}"};{"\n  "}
          {"}"}
          {"\n  "}
          seen.put(nums[i], i);
          {"\n"}
          {"}"}
        </code>
      </pre>
      <div className="flex items-center gap-1.5 border-t border-line bg-[hsl(var(--surface-chrome))] px-2 py-1 font-mono text-[9.5px] text-success">
        <Check size={8} strokeWidth={3} aria-hidden="true" />
        12 / 12 passed
        <span className="ml-auto text-muted-foreground">0.09s</span>
      </div>
    </div>
  );
}

function ComplexityFragment() {
  return (
    <div className="relative">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
        Time · Space
      </p>
      <p className="mt-1 font-mono text-[26px] leading-none tracking-[-0.03em] text-foreground">
        O(n) <span className="text-muted-foreground">/</span>{" "}
        <span className="text-accent">O(n)</span>
      </p>
      <div className="mt-3 space-y-2">
        {[
          ["Lookup", 0.24],
          ["Insert", 0.4],
          ["Scan", 1],
        ].map(([label, width]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span className="w-12 shrink-0 font-mono text-[9.5px] text-muted-foreground">
              {label}
            </span>
            <span className="h-[3px] flex-1 rounded-full bg-[hsl(var(--surface-raised))]">
              <span
                className="block h-full rounded-full bg-primary/70 transition-[width] duration-5 group-hover:bg-primary"
                style={{
                  width: `${(width as number) * 100}%`,
                  maxWidth: "100%",
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaletteFragment() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-[hsl(var(--surface-panel))] shadow-card">
      <div className="flex items-center gap-1.5 border-b border-line px-2 py-1.5">
        <Search
          size={10}
          className="text-muted-foreground"
          aria-hidden="true"
        />
        <span className="font-mono text-[10px] text-muted-foreground">
          sliding
        </span>
        <span className="lp-caret !h-[11px] !w-[5px]" aria-hidden="true" />
        <span className="ml-auto flex items-center gap-1">
          <kbd className="lp-kbd !h-[16px] !text-[9px]">
            <Command size={7} aria-hidden="true" />K
          </kbd>
        </span>
      </div>
      <ul className="p-1">
        {[
          { group: "Lessons", label: "Sliding window · max sum", active: true },
          { group: "Problems", label: "Longest substring, no repeats" },
          { group: "Pages", label: "Practice · Arrays" },
        ].map((row) => (
          <li
            key={row.label}
            className={cn(
              "flex items-center gap-2 rounded-[3px] px-1.5 py-1 text-[10.5px]",
              row.active
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground",
            )}
          >
            <span className="w-[46px] shrink-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted-foreground">
              {row.group}
            </span>
            <span className="truncate">{row.label}</span>
            {row.active && (
              <CornerDownLeft
                size={8}
                className="ml-auto text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesFragment() {
  return (
    <div className="relative rounded-sm border border-line bg-[hsl(var(--surface-chrome))] p-2.5">
      <div className="flex items-center gap-1.5">
        <StickyNote size={10} className="text-accent" aria-hidden="true" />
        <span className="font-mono text-[9.5px] text-muted-foreground">
          note · Two Sum
        </span>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          saved
        </span>
      </div>
      <p className="mt-1.5 border-l border-accent/40 pl-2 text-[11.5px] leading-[1.65] text-foreground/85">
        Check the complement{" "}
        <span className="font-mono text-accent">before</span> inserting the
        current value — otherwise an element pairs with itself when{" "}
        <span className="font-mono">2 · nums[i] = target</span>.
      </p>
    </div>
  );
}

const FRAGMENTS: Record<string, () => JSX.Element> = {
  editor: EditorFragment,
  complexity: ComplexityFragment,
  palette: PaletteFragment,
  notes: NotesFragment,
};

export function CapabilityField() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      {CAPABILITY_FRAGMENTS.map((fragment, index) => {
        const Fragment = FRAGMENTS[fragment.id];
        const wide = fragment.id === "editor" || fragment.id === "notes";
        return (
          <motion.div
            key={fragment.id}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: reduceMotion ? 0 : index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "md:col-span-5",
              wide ? "md:col-span-7" : "md:col-span-5",
            )}
          >
            <SpotCell className="h-full">
              <Fragment />
              <CellCopy title={fragment.title} body={fragment.body} />
            </SpotCell>
          </motion.div>
        );
      })}
    </div>
  );
}
