import { Check, Command, Play, StickyNote } from "lucide-react";

/**
 * Capability field.
 *
 * One hairline grid with unequal cells instead of a row of three identical
 * cards. Each cell carries a fragment of the real interface, so the section
 * reads as evidence rather than as a feature list.
 */

const COMPLEXITY_ROWS = [
  ["Binary search", "O(log n)", "O(1)"],
  ["BFS / DFS", "O(V + E)", "O(V)"],
  ["Merge sort", "O(n log n)", "O(n)"],
  ["0/1 knapsack", "O(n · W)", "O(W)"],
] as const;

export function CapabilityField() {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-12">
      {/* Editor */}
      <article className="bg-[hsl(var(--surface-panel))] p-5 lg:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-[15px] font-medium tracking-[-0.015em]">
            An editor, not a textarea
          </h3>
          <span className="flex items-center gap-1 rounded-xs border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            <Play size={9} aria-hidden="true" />
            Run tests
          </span>
        </div>
        <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-5 text-muted-foreground">
          Monaco runs in the browser with Java language support, a per-problem
          draft that survives a refresh, and output that names the failing case
          instead of just returning a red cross.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-sm border border-line bg-[hsl(var(--surface-page))] p-2.5 font-mono text-[11px] leading-[1.7] text-muted-foreground">
          <code>
            <span className="text-primary">if</span> (seen.
            <span className="text-foreground">containsKey</span>(need)){" "}
            <span className="text-primary">return</span>{" "}
            <span className="text-primary">new</span>{" "}
            <span className="text-accent">int</span>[] {"{"} seen.
            <span className="text-foreground">get</span>(need), i {"}"};
          </code>
        </pre>
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-success">
          <Check size={10} aria-hidden="true" />
          case 3/12 — expected [0,1], got [0,1]
        </p>
      </article>

      {/* Complexity */}
      <article className="bg-[hsl(var(--surface-panel))] p-5 lg:col-span-5 lg:row-span-2">
        <h3 className="font-display text-[15px] font-medium tracking-[-0.015em]">
          Complexity with the reasoning
        </h3>
        <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
          Time and space are recorded next to the implementation, including the
          trade-off an interviewer will push on.
        </p>
        <table className="mt-4 w-full border-collapse text-left">
          <caption className="sr-only">
            Common structures with their time and space cost
          </caption>
          <thead>
            <tr className="border-b border-line">
              {["Structure / technique", "Time", "Space"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="pb-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPLEXITY_ROWS.map(([name, time, space]) => (
              <tr key={name} className="border-b border-line/60 last:border-0">
                <th
                  scope="row"
                  className="py-2 pr-3 text-left text-[12.5px] font-normal text-foreground/90"
                >
                  {name}
                </th>
                <td className="py-2 pr-3 font-mono text-[11.5px] text-accent">
                  {time}
                </td>
                <td className="py-2 font-mono text-[11.5px] text-muted-foreground">
                  {space}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 border-l border-primary/40 pl-2.5 text-[12px] leading-5 text-muted-foreground">
          The follow-up question is written down too: what changes when the
          input is not sorted?
        </p>
      </article>

      {/* Keyboard */}
      <article className="bg-[hsl(var(--surface-panel))] p-5 lg:col-span-3">
        <div className="flex items-center gap-2">
          <Command size={13} className="text-primary" aria-hidden="true" />
          <h3 className="font-display text-[15px] font-medium tracking-[-0.015em]">
            Keyboard first
          </h3>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
          Search topics, problems and pages from one palette.
        </p>
        <div className="mt-3 rounded-sm border border-line bg-[hsl(var(--surface-chrome))] p-1.5">
          <p className="flex items-center justify-between rounded-xs bg-raised px-2 py-1.5 font-mono text-[10.5px] text-foreground/80">
            two sum
            <span className="ws-kbd">↵</span>
          </p>
          {["Two Sum", "Two Sum II — sorted input", "3Sum"].map((row) => (
            <p
              key={row}
              className="flex items-center justify-between px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground"
            >
              {row}
              <span className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground/50">
                problem
              </span>
            </p>
          ))}
        </div>
      </article>

      {/* Notes */}
      <article className="bg-[hsl(var(--surface-panel))] p-5 lg:col-span-4">
        <div className="flex items-center gap-2">
          <StickyNote size={13} className="text-accent" aria-hidden="true" />
          <h3 className="font-display text-[15px] font-medium tracking-[-0.015em]">
            Notes that stay attached
          </h3>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
          A note written on a problem or lesson stays with it — and shows up on
          your notes dashboard.
        </p>
        <div className="mt-3 rounded-sm border border-line bg-[hsl(var(--surface-chrome))] p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Two Sum · note
          </p>
          <p className="mt-1 text-[12px] leading-5 text-foreground/80">
            State the O(n²) baseline first, then the hash-map trade-off.
          </p>
        </div>
      </article>
    </div>
  );
}
