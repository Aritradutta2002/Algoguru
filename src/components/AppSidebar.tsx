import { useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import {
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  Home,
  LogOut,
  PanelLeft,
  Search,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppTooltip } from "@/components/ui/tooltip";
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { recursionContent } from "@/data/recursionContent";
import { backtrackingContent } from "@/data/backtrackingContent";
import { stackQueueContent } from "@/data/stackQueueContent";
import { dpContent } from "@/data/dpContent";
import { graphsContent } from "@/data/graphsContent";
import { bitManipulationContent } from "@/data/bitManipulationContent";
import { heapContent } from "@/data/heapContent";
import { stringsContent } from "@/data/stringsContent";
import { numberTheoryContent } from "@/data/numberTheoryContent";
import { treesContent } from "@/data/treesContent";
import { segmentTreeContent } from "@/data/segmentTreeContent";
import { advancedMathContent } from "@/data/advancedMathContent";
import { advancedTopicsContent } from "@/data/advancedTopicsContent";
import { javaContentMap } from "@/data/javaContent";
import { practiceContentMap } from "@/data/practiceContent";
import { systemDesignTopics } from "@/data/systemDesignInterviewData";
import type { ContentSection } from "@/data/recursionContent";

const dsContentMap: Record<string, ContentSection[]> = {
  "stack-queue": stackQueueContent,
  recursion: recursionContent,
  backtracking: backtrackingContent,
  dp: dpContent,
  graphs: graphsContent,
  bits: bitManipulationContent,
  heaps: heapContent,
  strings: stringsContent,
  "number-theory": numberTheoryContent,
  trees: treesContent,
  "segment-tree": segmentTreeContent,
  "advanced-math": advancedMathContent,
  "advanced-topics": advancedTopicsContent,
};

const DifficultyPill = ({ difficulty }: { difficulty: string }) => (
  <span
    className="ws-chip shrink-0"
    data-level={(difficulty || "hard").toLowerCase()}
    data-tone="plain"
  >
    {difficulty}
  </span>
);

export function AppSidebar({ onCollapse }: { onCollapse: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentMode, modes, setMode } = useMode();
  const { user, profile, resolvedAvatar, signOut } = useAuth();
  const currentPath = location.pathname;
  const currentHash = location.hash.replace("#", "");

  const userName =
    profile?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = resolvedAvatar;

  const activeTopics =
    currentMode.id === "ds"
      ? topics
      : currentMode.id === "lang"
        ? javaTopics
        : practiceTopics;

  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeTopics.forEach((t) => {
      initial[t.id] = currentPath === `/${t.id}`;
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allSearchItems = useMemo(() => {
    const allTopicsList = [...topics, ...javaTopics, ...practiceTopics];
    const items: Array<{
      id: string;
      title: string;
      icon: string;
      type: "topic" | "subtopic" | "content";
      path: string;
      parent: string | null;
      subtopicCount: number;
      difficulty?: string;
    }> = [];

    allTopicsList.forEach((t) => {
      items.push({
        id: t.id,
        title: t.title,
        icon: t.icon,
        type: "topic",
        path: `/${t.id}`,
        parent: null,
        subtopicCount: t.subtopics.length,
      });
      t.subtopics.forEach((s) => {
        items.push({
          id: s.id,
          title: s.title,
          icon: t.icon,
          type: "subtopic",
          path: `/${t.id}#${s.id}`,
          parent: t.title,
          subtopicCount: 0,
        });
      });
    });

    const allContentMaps: Record<string, ContentSection[]> = {
      ...dsContentMap,
      ...javaContentMap,
      ...practiceContentMap,
    };
    Object.entries(allContentMaps).forEach(([topicId, sections]) => {
      const topic = allTopicsList.find((t) => t.id === topicId);
      if (!topic || !sections) return;
      sections.forEach((section) => {
        if (!section.title || !section.id) return;
        const isGroupHeader = /^(Easy|Medium|Hard) Problems$/i.test(
          section.title,
        );
        if (isGroupHeader) return;
        const alreadyExists = items.some(
          (i) => i.id === section.id && i.path.startsWith(`/${topicId}`),
        );
        if (alreadyExists) return;
        items.push({
          id: section.id,
          title: section.title,
          icon: topic.icon,
          type: "content",
          path: `/${topicId}#${section.id}`,
          parent: topic.title,
          subtopicCount: 0,
          difficulty: section.difficulty,
        });
      });
    });

    systemDesignTopics.forEach((topic) => {
      topic.questions.forEach((question) => {
        items.push({
          id: question.id,
          title: question.question,
          icon: topic.icon,
          type: "content",
          path: `/interview/java/system-design#${question.id}`,
          parent: `System Design — ${topic.title}`,
          subtopicCount: 0,
          difficulty: undefined,
        });
      });
    });
    return items;
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const terms = q.split(/\s+/);
    return allSearchItems
      .filter((i) => {
        const text = `${i.title} ${i.parent || ""} ${i.id}`.toLowerCase();
        return terms.every((t) => text.includes(t));
      })
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        if (aTitle === q && bTitle !== q) return -1;
        if (bTitle === q && aTitle !== q) return 1;
        const aStarts = aTitle.startsWith(q) ? 0 : 1;
        const bStarts = bTitle.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        const typePriority = { topic: 0, subtopic: 1, content: 2 };
        return (typePriority[a.type] ?? 2) - (typePriority[b.type] ?? 2);
      });
  }, [searchQuery, allSearchItems]);

  const toggleTopic = (id: string) =>
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  const isSubActive = (topicId: string, subId: string) =>
    currentPath === `/${topicId}` && currentHash === subId;
  const isTopicActive = (topicId: string) => currentPath === `/${topicId}`;

  const navItems = [
    { label: "Home", Icon: Home, path: "/home" },
    { label: "Practice", Icon: Target, path: "/practice" },
    { label: "Playground", Icon: Code2, path: "/playground" },
    { label: "Interview", Icon: BriefcaseBusiness, path: "/interview" },
    { label: "Contest", Icon: Trophy, path: "/contest" },
  ];

  const modeLabel =
    currentMode.id === "ds"
      ? "Topics"
      : currentMode.id === "lang"
        ? "Modules"
        : "Sheets";
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-line bg-[hsl(var(--surface-chrome))]">
      {/* ── Panel header ─────────────────────────────────────── */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line px-2.5">
        <span className="ws-eyebrow">Library</span>
        <div className="flex items-center gap-0.5">
          <AppTooltip content="Search the library (⌘K)">
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Focus library search"
              className="inline-flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search size={13} aria-hidden="true" />
            </button>
          </AppTooltip>
          <AppTooltip content="Collapse sidebar (Alt + B)" side="right">
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse sidebar"
              aria-keyshortcuts="Alt+B"
              className="inline-flex h-7 w-7 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PanelLeft size={13} aria-hidden="true" />
            </button>
          </AppTooltip>
        </div>
      </div>

      {/* ── Mode switch (the three libraries) ─────────────────── */}
      <div className="px-2.5 pt-2.5">
        <div
          role="tablist"
          aria-label="Library"
          className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-line bg-line p-px"
        >
          {modes.map((mode) => {
            const selected = mode.id === currentMode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode(mode.id)}
                title={mode.description}
                className={cn(
                  "h-7 truncate px-1 text-[11px] font-medium transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  selected
                    ? "bg-raised text-foreground"
                    : "bg-[hsl(var(--surface-chrome))] text-muted-foreground hover:text-foreground",
                )}
              >
                {mode.id === "ds"
                  ? "DSA"
                  : mode.id === "lang"
                    ? "Java"
                    : "Sheets"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="px-2.5 pt-2">
        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search lessons…"
            aria-label="Search lessons"
            className={cn(
              "h-8 w-full rounded-sm border bg-[hsl(var(--surface-panel))] pl-7 pr-7 text-[12px] text-foreground outline-none transition-colors duration-1 placeholder:text-muted-foreground/60",
              searchFocused
                ? "border-primary/50"
                : "border-line hover:border-[hsl(var(--surface-line-strong))]",
            )}
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={11} aria-hidden="true" />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="mt-1.5 overflow-hidden rounded-sm border border-line bg-popover">
            {searchResults.length === 0 ? (
              <div className="px-2.5 py-4">
                <p className="text-[12px] text-muted-foreground">
                  No lesson matches “{searchQuery}”.
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">
                  Try a pattern name, e.g. “window” or “graph”.
                </p>
              </div>
            ) : (
              <ul className="ws-scroll max-h-64 overflow-y-auto">
                {searchResults.slice(0, 18).map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center gap-2 border-b border-line/50 px-2.5 py-2 text-left transition-colors duration-1 last:border-0 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12px] text-foreground"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                        {item.parent && (
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                            {item.parent}
                          </span>
                        )}
                      </span>
                      {item.difficulty && (
                        <DifficultyPill difficulty={item.difficulty} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Workspace shortcuts ──────────────────────────────── */}
      <nav aria-label="Workspace shortcuts" className="mt-2 space-y-px px-2.5">
        {navItems.map(({ label, Icon, path }) => {
          const isActive = currentPath === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              className="ws-rail-item w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon
                size={14}
                aria-hidden="true"
                className="shrink-0 opacity-70"
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Library tree ─────────────────────────────────────── */}
      <div className="mt-3 flex shrink-0 items-baseline justify-between px-3">
        <h2 className="ws-eyebrow">{modeLabel}</h2>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
          {activeTopics.length}
        </span>
      </div>

      <div className="ws-scroll mt-1 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3">
        <ul className="space-y-px">
          {activeTopics.map((topic) => {
            const isOpen = openTopics[topic.id];
            const isActive = isTopicActive(topic.id);

            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggleTopic(topic.id);
                    navigate(`/${topic.id}`);
                  }}
                  aria-expanded={isOpen}
                  className={cn(
                    "ws-rail-item w-full justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive && "bg-raised text-foreground",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="w-3.5 shrink-0 text-center font-mono text-[10px] text-muted-foreground/60"
                    >
                      {topic.icon}
                    </span>
                    <span className="truncate">{topic.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
                      {topic.subtopics.length}
                    </span>
                    <ChevronDown
                      size={11}
                      aria-hidden="true"
                      className={cn(
                        "text-muted-foreground/60 transition-transform duration-2",
                        isOpen && "rotate-180",
                      )}
                    />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul
                      key="sub"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[0.9rem] border-l border-line pl-2 pt-0.5">
                        {topic.subtopics.map((sub) => {
                          const active = isSubActive(topic.id, sub.id);
                          return (
                            <AppTooltip
                              key={sub.id}
                              content={sub.title}
                              side="right"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/${topic.id}#${sub.id}`)
                                }
                                className={cn(
                                  "flex min-h-[30px] w-full items-center gap-2 rounded-xs px-2 py-1 text-left text-[12px] transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                  active
                                    ? "bg-raised text-foreground"
                                    : "text-muted-foreground hover:bg-raised/60 hover:text-foreground",
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "h-1 w-1 shrink-0 rounded-pill",
                                    active
                                      ? "bg-primary"
                                      : "bg-muted-foreground/35",
                                  )}
                                />
                                <span className="min-w-0 flex-1 truncate leading-snug">
                                  {sub.title}
                                </span>
                              </button>
                            </AppTooltip>
                          );
                        })}
                      </div>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Account ──────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-line px-2.5 py-2">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-[10px] font-semibold text-foreground"
            >
              {userName[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[12px] font-medium leading-tight text-foreground"
              title={userName}
            >
              {userName}
            </p>
            <p className="truncate font-mono text-[10px] leading-tight text-muted-foreground">
              {user?.email?.split("@")[0]}
            </p>
          </div>
          <AppTooltip content="Sign out" side="top">
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors duration-1 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut size={13} aria-hidden="true" />
            </button>
          </AppTooltip>
        </div>
      </div>
    </div>
  );
}
