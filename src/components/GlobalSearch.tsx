import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, CornerDownLeft, X } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABELS,
  DEFAULT_QUICK_ACCESS,
  MIN_QUERY_LENGTH,
  SEARCH_TABS,
  STATIC_SEARCH_DOCS,
  buildNoteDocs,
  groupByCategory,
  searchDocs,
  type NoteSource,
  type ScoredDoc,
  type SearchDoc,
  type SearchTab,
} from "@/lib/searchIndex";

/* -------------------------------------------------------------------------- */
/* Brand glyph — the AlgoGuru search mark                                     */
/* -------------------------------------------------------------------------- */

const PRIMARY_FILL = "hsl(var(--primary))";
const INFO_FILL = "hsl(var(--info, 210 80% 52%))";

/**
 * The AlgoGuru search mark: a gradient tile holding a white magnifier with a
 * four-point sparkle breaking out of the top-right of the lens.
 *
 * Drawn rather than taken from lucide so it can carry the brand gradient and
 * stay unique to search. Everything is authored in a 24x24 viewBox and scaled
 * with `size`, so one definition serves the header trigger and the palette.
 */
function SearchMark({ size = 24, className }: { size?: number; className?: string }) {
  // React 18's useId() returns ":r0:" — colons are illegal in a `url(#id)`
  // paint reference, which silently kills the gradient. Strip everything that
  // is not URL-safe.
  const rawId = useId();
  const gradientId = `algoguru-search-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" style={{ stopColor: PRIMARY_FILL }} />
          <stop offset="100%" style={{ stopColor: INFO_FILL }} />
        </linearGradient>
      </defs>

      <rect x="0.5" y="0.5" width="23" height="23" rx="7" fill={`url(#${gradientId})`} />
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="7"
        stroke="hsl(var(--foreground) / 0.14)"
        strokeWidth="1"
      />

      {/* Magnifier */}
      <circle cx="10.6" cy="12.4" r="4.4" stroke="#fff" strokeWidth="1.9" />
      <path d="M13.9 15.7 17.4 19.2" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />

      {/* Sparkle breaking out of the lens */}
      <path
        d="M17.4 3.6Q17.4 7.1 20.9 7.1Q17.4 7.1 17.4 10.6Q17.4 7.1 13.9 7.1Q17.4 7.1 17.4 3.6Z"
        fill="#fff"
        fillOpacity="0.95"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Recents                                                                     */
/* -------------------------------------------------------------------------- */

const RECENTS_KEY = "algoguru:search:recents";
const MAX_RECENTS = 6;

interface RecentEntry {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: string;
  category: SearchDoc["category"];
}

const readRecents = (): RecentEntry[] => {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentEntry =>
        !!item && typeof item.id === "string" && typeof item.path === "string",
    );
  } catch {
    return [];
  }
};

const writeRecents = (entries: RecentEntry[]) => {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(entries));
  } catch {
    /* localStorage may be unavailable in private mode — ignore. */
  }
};

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

const useNoteDocs = (userId: string | undefined) => {
  const [docs, setDocs] = useState<SearchDoc[]>([]);

  useEffect(() => {
    if (!userId) {
      setDocs([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const [coreJava, practice, systemDesign] = await Promise.all([
        supabase
          .from("core_java_user_state")
          .select("question_id, notes, updated_at")
          .eq("user_id", userId)
          .not("notes", "is", null),
        supabase
          .from("practice_problem_user_state")
          .select("problem_id, notes, updated_at")
          .eq("user_id", userId)
          .not("notes", "is", null),
        supabase
          .from("system_design_user_state")
          .select("question_id, notes, updated_at")
          .eq("user_id", userId)
          .not("notes", "is", null),
      ]);

      if (cancelled) return;

      const rows: Array<{
        source: NoteSource;
        questionId: string;
        notes: string;
        updatedAt?: string | null;
      }> = [];
      (coreJava.data ?? []).forEach((row: any) =>
        rows.push({
          source: "core-java",
          questionId: row.question_id,
          notes: row.notes ?? "",
          updatedAt: row.updated_at,
        }),
      );
      (practice.data ?? []).forEach((row: any) =>
        rows.push({
          source: "practice",
          questionId: row.problem_id,
          notes: row.notes ?? "",
          updatedAt: row.updated_at,
        }),
      );
      (systemDesign.data ?? []).forEach((row: any) =>
        rows.push({
          source: "system-design",
          questionId: row.question_id,
          notes: row.notes ?? "",
          updatedAt: row.updated_at,
        }),
      );

      setDocs(buildNoteDocs(rows));
    };

    load().catch(() => {
      if (!cancelled) setDocs([]);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return docs;
};

/* -------------------------------------------------------------------------- */
/* Small presentational bits                                                   */
/* -------------------------------------------------------------------------- */

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "text-[hsl(var(--success))] border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10",
  Medium: "text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10",
  Hard: "text-destructive border-destructive/30 bg-destructive/10",
  Expert: "text-[hsl(var(--info))] border-[hsl(var(--info))]/30 bg-[hsl(var(--info))]/10",
};

/** Highlights every whitespace-separated term of the query inside `text`. */
const Highlight = ({ text, query }: { text: string; query: string }) => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Split on the term pattern, then match parts against a non-global copy:
  // a /g regex carries `lastIndex` between `.test()` calls and mis-highlights.
  const splitter = new RegExp(`(${escaped.join("|")})`, "gi");
  const tester = new RegExp(`^(?:${escaped.join("|")})$`, "i");
  const parts = text.split(splitter);

  return (
    <>
      {parts.map((part, index) =>
        tester.test(part) ? (
          <mark
            key={`${part}-${index}`}
            className="bg-transparent font-semibold text-primary"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
};

const ShortcutKey = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center gap-px rounded-[5px] border border-border/80 bg-background/70 px-1 font-mono text-[10px] font-medium leading-none text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
    {children}
  </span>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div className="px-2 pb-2 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Result row                                                                  */
/* -------------------------------------------------------------------------- */

/*
 * Selection styling below matches the `data-[selected='true']:` quoting used by
 * `CommandItem` in `ui/command.tsx` exactly. tailwind-merge only collapses
 * classes whose variant keys are byte-identical, so the quotes must match or
 * both classes survive and the winner becomes a CSS-order coin flip.
 *
 * The row highlights with a faint primary wash plus an inset ring rather than a
 * solid fill — a full-bleed fill drowns out the title, the subtitle and the
 * difficulty badge, and `--accent` here is a saturated amber brand colour.
 */
const ResultRow = ({ doc, query, onSelect }: { doc: ScoredDoc; query: string; onSelect: () => void }) => (
  <CommandItem
    value={`${doc.category} ${doc.id} ${doc.title} ${doc.subtitle}`}
    onSelect={onSelect}
    className="group cursor-pointer gap-3 rounded-xl px-2.5 py-2.5 transition-colors data-[selected='true']:bg-primary/[0.07] data-[selected='true']:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.28)] data-[selected='true']:hover:bg-primary/[0.11]"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border/80 bg-muted/60 text-base shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] transition-colors group-data-[selected='true']:border-primary/30 group-data-[selected='true']:bg-primary/10">
      {doc.icon}
    </span>

    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-[13.5px] font-medium leading-tight text-foreground">
        <Highlight text={doc.title} query={query} />
      </span>
      <span className="truncate text-[11.5px] leading-tight text-muted-foreground">
        <Highlight text={doc.subtitle} query={query} />
      </span>
    </span>

    {doc.difficulty && (
      <span
        className={cn(
          "shrink-0 rounded-md border px-1.5 py-px text-[10px] font-semibold leading-tight",
          DIFFICULTY_STYLES[doc.difficulty] ??
            "border-border bg-muted text-muted-foreground",
        )}
      >
        {doc.difficulty}
      </span>
    )}

    <span
      aria-hidden="true"
      className="shrink-0 translate-x-1 text-muted-foreground/0 transition-all duration-150 group-data-[selected='true']:translate-x-0 group-data-[selected='true']:text-primary/70"
    >
      <CornerDownLeft size={13} />
    </span>
  </CommandItem>
);

/* -------------------------------------------------------------------------- */
/* Quick access                                                                */
/* -------------------------------------------------------------------------- */

const QuickAccessChip = ({ doc, onSelect }: { doc: SearchDoc; onSelect: () => void }) => (
  <CommandItem
    value={`quick ${doc.id} ${doc.title}`}
    onSelect={onSelect}
    className="group h-auto cursor-pointer gap-2 rounded-full border border-border/80 bg-muted/40 py-[3px] pl-[3px] pr-3.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-colors hover:border-primary/30 hover:bg-muted/70 data-[selected='true']:border-primary/50 data-[selected='true']:bg-primary/10 data-[selected='true']:shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04),0_0_0_3px_hsl(var(--primary)/0.10)]"
  >
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[13px] ring-1 ring-inset ring-primary/15">
      {doc.icon}
    </span>
    <span className="text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground group-data-[selected='true']:text-primary">
      {doc.title}
    </span>
  </CommandItem>
);

/* -------------------------------------------------------------------------- */
/* Palette                                                                     */
/* -------------------------------------------------------------------------- */

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  // Notes live in Supabase, so don't pay for those three queries until the
  // user has actually opened the palette at least once this session.
  const [notesEnabled, setNotesEnabled] = useState(false);
  // cmdk only re-focuses its input when its `value` state changes, never on
  // mount — so without this the palette opens unfocused and typing does nothing.
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const noteDocs = useNoteDocs(notesEnabled ? user?.id : undefined);

  const trimmed = query.trim();
  const showEmptyState = trimmed.length < MIN_QUERY_LENGTH;

  const allDocs = useMemo(
    () => (noteDocs.length ? [...STATIC_SEARCH_DOCS, ...noteDocs] : STATIC_SEARCH_DOCS),
    [noteDocs],
  );

  const results = useMemo(() => {
    if (showEmptyState) return [];
    return searchDocs(trimmed, allDocs, { tab, limit: 80 });
  }, [trimmed, allDocs, tab, showEmptyState]);

  const groups = useMemo(() => groupByCategory(results), [results]);

  const quickAccess = useMemo<SearchDoc[]>(
    () => (recents.length === 0 ? DEFAULT_QUICK_ACCESS : recents.map((entry) => ({ ...entry, haystack: "" }))),
    [recents],
  );

  const remember = useCallback((doc: SearchDoc) => {
    setRecents((previous) => {
      const entry: RecentEntry = {
        id: doc.id,
        title: doc.title,
        subtitle: doc.subtitle,
        path: doc.path,
        icon: doc.icon,
        category: doc.category,
      };
      const next = [entry, ...previous.filter((item) => item.id !== entry.id)].slice(0, MAX_RECENTS);
      writeRecents(next);
      return next;
    });
  }, []);

  const go = useCallback(
    (doc: SearchDoc) => {
      remember(doc);
      setOpen(false);
      setQuery("");
      setTab("all");
      navigate(doc.path);
    },
    [navigate, remember],
  );

  useEffect(() => {
    if (open) {
      setNotesEnabled(true);
      setRecents(readRecents());
      // Focus after the palette has painted, otherwise cmdk's own mount
      // effects run last and clobber the caret position.
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    setQuery("");
    setTab("all");
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <AppTooltip content="Search AlgoGuru (Ctrl+K)">
        <button
          onClick={() => setOpen(true)}
          aria-label="Search AlgoGuru"
          data-search-trigger="true"
          className="group relative flex h-8 w-44 items-center gap-2 overflow-hidden rounded-lg border border-border/60 bg-muted/40 pl-1.5 pr-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-muted/70 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] active:scale-[0.98] sm:w-56 md:w-64 lg:w-72"
        >
          <SearchMark
            size={20}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden min-w-0 flex-1 truncate text-[13px] text-muted-foreground/65 transition-colors group-hover:text-muted-foreground sm:inline">
            Search topics, problems…
          </span>
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border/60 bg-background/70 px-1.5 py-px font-mono text-[10px] font-semibold leading-none text-muted-foreground/55 transition-colors group-hover:border-primary/25 group-hover:text-primary md:inline-flex">
            <span>⌘</span>K
          </kbd>
        </button>
      </AppTooltip>

      {open &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[7vh]"
          >
            {/* Vignette: a radial wash instead of a flat scrim, so the
                spotlight falls on the palette rather than the whole page. */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,hsl(var(--primary)/0.10),transparent_60%)] bg-slate-950/55 backdrop-blur-[6px] dark:bg-slate-950/70" />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[720px]"
            >
              <Command
                shouldFilter={false}
                loop
                className="flex h-[min(620px,80vh)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-[0_32px_80px_-12px_hsl(var(--foreground)/0.35),0_0_0_1px_hsl(var(--foreground)/0.04)] backdrop-blur-xl"
              >
                {/* Input ------------------------------------------------------ */}
                <div className="flex shrink-0 items-center gap-3 px-4 pb-3.5 pt-4">
                  <SearchMark size={30} className="drop-shadow-sm" />

<CommandInput
                      ref={inputRef}
                      icon={null}
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search anything on AlgoGuru..."
                    wrapperClassName="min-w-0 flex-1 border-b-0 p-0"
                    className="h-auto bg-transparent py-0 text-[16px] font-normal tracking-[-0.01em] placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/55"
                  />

                  {trimmed && !showEmptyState && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums text-muted-foreground"
                    >
                      {results.length}
                    </motion.span>
                  )}

                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close search"
                    className="flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-transparent text-muted-foreground/70 transition-all hover:border-border hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Tabs ------------------------------------------------------- */}
                <div className="relative shrink-0 border-y border-border/60 bg-muted/20 px-2 py-1.5">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {SEARCH_TABS.map((entry) => {
                      const active = entry.id === tab;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => setTab(entry.id)}
                          className={cn(
                            "relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                            active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="global-search-tab"
                              className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          <span className="relative">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Body ------------------------------------------------------- */}
                {/* `max-h-none` drops the 300px default from CommandList so the
                    list flexes to fill the panel instead. */}
                <CommandList className="max-h-none flex-1 overflow-y-auto px-2 pb-3 pt-1">
                  {showEmptyState ? (
                    <>
                      <SectionLabel>
                        {recents.length === 0 ? "Quick Access" : "Recent"}
                      </SectionLabel>
                      <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                        {quickAccess.map((doc) => (
                          <QuickAccessChip key={doc.id} doc={doc} onSelect={() => go(doc)} />
                        ))}
                      </div>

                      <div className="flex flex-col items-center justify-center gap-3 px-6 pb-14 pt-10 text-center">
                        <SearchMark size={30} className="opacity-90" />
                        <div>
                          <div className="text-[15px] font-medium text-foreground">
                            Search anything
                          </div>
                        <div className="mt-0.5 text-[13px] text-muted-foreground">
                          Type at least {MIN_QUERY_LENGTH} characters to begin search
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CommandEmpty>
                      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                        <SearchMark size={28} className="opacity-70" />
                        <div>
                          <div className="text-[15px] font-medium text-foreground">
                            No results for “{trimmed}”
                          </div>
                          <div className="mt-1 text-[13px] text-muted-foreground">
                            Try “two sum”, “backtracking” or “@Transactional”
                          </div>
                        </div>
                      </div>
                    </CommandEmpty>

                    {groups.map((group) => (
                      <CommandGroup
                        key={group.category}
                        heading={CATEGORY_LABELS[group.category]}
                        className="p-0 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground/60"
                      >
                        {group.docs.map((doc) => (
                          <ResultRow key={doc.id} doc={doc} query={trimmed} onSelect={() => go(doc)} />
                        ))}
                      </CommandGroup>
                    ))}
                  </>
                )}
              </CommandList>

              {/* Footer ----------------------------------------------------- */}
              <div className="flex shrink-0 items-center gap-4 border-t border-border/60 bg-muted/25 px-4 py-2 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/70">
                <span className="inline-flex items-center gap-1.5">
                  <ShortcutKey>
                    <ArrowUp size={10} />
                    <ArrowDown size={10} />
                  </ShortcutKey>
                  Move
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShortcutKey>
                    <CornerDownLeft size={10} />
                  </ShortcutKey>
                  Select
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShortcutKey>Esc</ShortcutKey>
                  Quit
                </span>
                <span className="ml-auto hidden font-mono normal-case tracking-normal text-muted-foreground/45 sm:inline">
                  {allDocs.length.toLocaleString()} items indexed
                </span>
              </div>
            </Command>
          </motion.div>
        </motion.div>,
        document.body,
      )}
    </>
  );
}