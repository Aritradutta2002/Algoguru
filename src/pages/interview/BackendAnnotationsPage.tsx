import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Cog,
  Search,
  Tag,
  X,
} from "lucide-react";
import {
  ANNOTATION_CATALOGUE,
  ANNOTATION_CATEGORIES,
  ANNOTATION_COUNT,
  ANNOTATIONS_BY_CATEGORY,
  type AnnotationEntry,
} from "@/data/backendInterview/annotations";
import { BackendInline } from "@/components/interview/BackendAnswer";
import { CodeBlock } from "@/components/CodeBlock";
import {
  BACKEND_BASE_PATH,
  BACKEND_QUESTIONS_PATH,
  getBackendQuestionById,
} from "@/lib/backendQuestionIndex";
import { cn } from "@/lib/utils";
import "@/styles/core-java-interview.css";

function AnnotationRow({ entry }: { entry: AnnotationEntry }) {
  const [open, setOpen] = useState(false);
  const related = (entry.relatedQuestionIds ?? [])
    .map((id) => getBackendQuestionById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div
      className={cn(
        "cjq-panel overflow-hidden rounded-xl border transition-colors",
        open ? "border-primary/30 bg-card/80" : "border-border/50 bg-card/60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cjq-panel-toggle flex w-full items-start gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <code className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[13px] font-semibold text-primary">
          {entry.name}
        </code>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">{entry.purpose}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Target: {entry.target}
            {entry.since ? ` · ${entry.since}` : ""}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "cjq-panel-chevron mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/40 px-4 py-4">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Cog className="h-3 w-3" />
                  How it works internally
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  <BackendInline text={entry.howItWorks} />
                </p>
              </div>

              {entry.example && (
                <CodeBlock language="java" code={entry.example} hideHeader />
              )}

              {entry.gotcha && (
                <div className="rounded-lg border border-warning/25 bg-warning/5 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    Gotcha
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    <BackendInline text={entry.gotcha} />
                  </p>
                </div>
              )}

              {related.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {related.map((item) => (
                    <Link
                      key={item.question.id}
                      to={`${BACKEND_QUESTIONS_PATH}/${item.slug}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      Q{item.number}: {item.question.question.slice(0, 54)}
                      {item.question.question.length > 54 ? "…" : ""}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BackendAnnotationsPage() {
  const { language = "java" } = useParams<{ language?: string }>();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    document.title = "Java & Spring Annotation Reference | AlgoGuru";
    return () => {
      document.title = "AlgoGuru";
    };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let entries = ANNOTATION_CATALOGUE;
    if (activeCategory !== "all") {
      entries = entries.filter((entry) => entry.category === activeCategory);
    }
    if (!needle) return entries;
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.purpose.toLowerCase().includes(needle) ||
        entry.howItWorks.toLowerCase().includes(needle) ||
        entry.target.toLowerCase().includes(needle),
    );
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const visible = new Set(results.map((entry) => entry.name));
    return ANNOTATION_CATEGORIES.map((category) => ({
      category,
      entries: (ANNOTATIONS_BY_CATEGORY[category.id] ?? []).filter((entry) =>
        visible.has(entry.name),
      ),
    })).filter((group) => group.entries.length > 0);
  }, [results]);

  return (
    <div className="cjh-page min-h-full w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="cjh-breadcrumb mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to={`/interview/${language}`} className="capitalize transition-colors hover:text-foreground">
            {language}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={BACKEND_BASE_PATH} className="transition-colors hover:text-foreground">
            Spring Boot &amp; Backend
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Annotation Reference</span>
        </nav>

        <header className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
            <Tag className="h-6 w-6 text-primary" />
            Annotation Reference
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {ANNOTATION_COUNT} Java and Spring annotations across {ANNOTATION_CATEGORIES.length} categories.
            Each entry says what it targets, <strong className="text-foreground">how the framework actually
            processes it at runtime</strong>, a minimal example, and the mistake people make with it.
          </p>
        </header>

        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search @Transactional, retention, proxy…"
              className="w-full rounded-xl border border-border/60 bg-card/70 py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="cjq-scrollbar-hide mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                activeCategory === "all"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground",
              )}
            >
              All ({ANNOTATION_COUNT})
            </button>
            {ANNOTATION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  activeCategory === category.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {category.icon} {category.title} ({ANNOTATIONS_BY_CATEGORY[category.id]?.length ?? 0})
              </button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {results.length} annotation{results.length === 1 ? "" : "s"} shown
        </p>

        <div className="space-y-7">
          {grouped.map(({ category, entries }) => (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <div className="cjh-section-header mb-2.5">
                <h2 className="cjh-section-title flex items-center gap-2 text-base font-bold text-foreground">
                  <span aria-hidden="true">{category.icon}</span>
                  {category.title}
                  <span className="text-xs font-normal text-muted-foreground">({entries.length})</span>
                </h2>
                <p className="cjh-section-meta mt-0.5 text-xs text-muted-foreground">{category.blurb}</p>
              </div>
              <div className="space-y-2">
                {entries.map((entry) => (
                  <AnnotationRow key={`${category.id}-${entry.name}`} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {grouped.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <Tag className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No annotation matches “{query}”
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="mt-3 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
