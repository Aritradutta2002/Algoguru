import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Section furniture for the landing page: an editor-style index number in the
 * gutter, a hairline, an editorial headline and a supporting column. Every
 * section uses it so the rhythm of the page is consistent without repeating a
 * card pattern.
 */
export function SectionHead({
  index,
  kicker,
  title,
  description,
  aside,
  align = "split",
  className,
  id,
}: {
  index: string;
  kicker: string;
  title: React.ReactNode;
  description: React.ReactNode;
  aside?: React.ReactNode;
  align?: "split" | "stack";
  className?: string;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div id={id} className={cn("relative scroll-mt-24", className)}>
      <div className="lp-rule" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "grid gap-8 pt-6",
          align === "split"
            ? "md:grid-cols-[64px_minmax(0,1.05fr)_minmax(0,0.72fr)] md:gap-10"
            : "md:grid-cols-[64px_minmax(0,1fr)]",
        )}
      >
        <div className="hidden md:block">
          <span className="lp-index">{index}</span>
        </div>

        <div>
          <p className="lp-kicker">
            <span className="md:hidden">{index} / </span>
            {kicker}
          </p>
          <h2 className="lp-display mt-4 text-[clamp(1.9rem,1.1rem+2.2vw,3rem)] text-foreground">
            {title}
          </h2>
        </div>

        {align === "split" && (
          <div className="flex flex-col gap-5 md:pt-9">
            <p className="max-w-[46ch] text-[13.5px] leading-[1.75] text-muted-foreground">
              {description}
            </p>
            {aside}
          </div>
        )}

        {align === "stack" && (
          <div className="md:col-start-2 md:max-w-[54ch]">
            <p className="text-[13.5px] leading-[1.75] text-muted-foreground">
              {description}
            </p>
            {aside}
          </div>
        )}
      </motion.div>
    </div>
  );
}
