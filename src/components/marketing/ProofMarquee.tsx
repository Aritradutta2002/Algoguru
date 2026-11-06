import { topics } from "@/data/topics";

/**
 * A quiet, slow marquee of the real DSA tracks with their lesson counts.
 * It gives the hero a horizontal pulse without inventing logos or partners,
 * pauses on hover, and freezes for reduced-motion users.
 */
export function ProofMarquee() {
  const items = topics.map((topic) => ({
    title: topic.title,
    count: topic.subtopics.length,
    glyph: topic.icon,
  }));

  const row = (
    <div className="flex shrink-0" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.title}
          className="flex items-center gap-2 whitespace-nowrap border-r border-line/70 px-5 py-2.5"
        >
          <span className="font-mono text-[10px] text-muted-foreground">
            {item.glyph}
          </span>
          <span className="text-[12px] text-foreground/80">{item.title}</span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {item.count}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="lp-marquee border-y border-line bg-[hsl(var(--surface-chrome)/0.6)]">
      <div className="lp-marquee-track">
        {row}
        {row}
      </div>
      <p className="sr-only">
        {items.length} data-structure and algorithm tracks, including{" "}
        {items
          .slice(0, 5)
          .map((item) => item.title)
          .join(", ")}
        .
      </p>
    </div>
  );
}
