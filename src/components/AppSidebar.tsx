import { useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { ChevronDown, Home, Layers, Coffee, Search, X, Code2, LogOut, Trophy, ChevronRight, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { AppTooltip } from "@/components/ui/tooltip";

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
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

const modeMeta = {
  ds:       { label: "DSA",      icon: <Layers size={11} />,  badge: "border-obsidian-border bg-obsidian-elevated text-muted-foreground" },
  lang:     { label: "Java",     icon: <Coffee size={11} />,  badge: "border-obsidian-border bg-obsidian-elevated text-muted-foreground" },
  practice: { label: "Practice", icon: <Trophy size={11} />,  badge: "border-obsidian-border bg-obsidian-elevated text-muted-foreground" },
} as const;

const DifficultyPill = ({ difficulty }: { difficulty: string }) => {
  const colors: Record<string, string> = {
    Easy:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    Hard:   "border-red-500/30 bg-red-500/10 text-red-500",
  };
  return (
    <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-px rounded border", colors[difficulty] ?? colors.Hard)}>
      {difficulty}
    </span>
  );
};

export function AppSidebar({ onCollapse }: { onCollapse: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentMode } = useMode();
  const { user, profile, resolvedAvatar, signOut } = useAuth();
  const currentPath = location.pathname;
  const currentHash = location.hash.replace("#", "");

  const userName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = resolvedAvatar;

  const activeTopics = currentMode.id === "ds" ? topics : currentMode.id === "lang" ? javaTopics : practiceTopics;

  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeTopics.forEach((t) => { initial[t.id] = currentPath === `/${t.id}`; });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allSearchItems = useMemo(() => {
    const allTopicsList = [...topics, ...javaTopics, ...practiceTopics];
    const items: Array<{
      id: string; title: string; icon: string; type: "topic" | "subtopic" | "content";
      path: string; parent: string | null; subtopicCount: number; difficulty?: string;
    }> = [];

    allTopicsList.forEach((t) => {
      items.push({ id: t.id, title: t.title, icon: t.icon, type: "topic", path: `/${t.id}`, parent: null, subtopicCount: t.subtopics.length });
      t.subtopics.forEach((s) => {
        items.push({ id: s.id, title: s.title, icon: t.icon, type: "subtopic", path: `/${t.id}#${s.id}`, parent: t.title, subtopicCount: 0 });
      });
    });

    const allContentMaps: Record<string, ContentSection[]> = { ...dsContentMap, ...javaContentMap, ...practiceContentMap };
    Object.entries(allContentMaps).forEach(([topicId, sections]) => {
      sections.forEach((sec) => {
        items.push({
          id: `${topicId}-${sec.id}`,
          title: sec.title,
          icon: "📄",
          type: "content",
          path: `/${topicId}#${sec.id}`,
          parent: topicId.replace(/-/g, " "),
          subtopicCount: 0,
        });
      });
    });

    return items;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allSearchItems
      .filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.parent && item.parent.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [searchQuery, allSearchItems]);

  const toggleTopic = (id: string) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isTopicActive = (id: string) => currentPath === `/${id}`;
  const isSubActive = (topicId: string, subId: string) =>
    currentPath === `/${topicId}` && currentHash === subId;

  const meta = modeMeta[currentMode.id as keyof typeof modeMeta] ?? modeMeta.ds;

  const navItems = [
    { label: "Home",       Icon: Home,   path: "/" },
    { label: "Practice",   Icon: Layers, path: "/practice" },
    { label: "Contest",    Icon: Trophy, path: "/contest" },
    { label: "Playground", Icon: Code2,  path: "/playground" },
  ];

  return (
    <div className="flex flex-col h-full w-full border-r border-obsidian-border bg-obsidian-pane overflow-hidden">
      {/* ── Brand Header ──────────────────────────────────── */}
      <div className="relative flex items-center gap-2 px-3 py-3 flex-shrink-0 border-b border-obsidian-border">
        <Link to="/" className="relative flex items-center gap-3 min-w-0 flex-1 rounded-lg p-1 transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <AlgoGuruMark size={30} title={null} className="relative" />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold tracking-tight leading-tight truncate">
              <span className="text-foreground">AlgoGuru</span>
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit",
              meta.badge
            )}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
        </Link>
        <AppTooltip content={<span>Collapse sidebar <kbd className="ml-2 rounded border border-obsidian-border px-1 py-0.5 text-[10px]">Alt + B</kbd></span>} side="right">
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            aria-keyshortcuts="Alt+B"
            className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-obsidian-border bg-obsidian-elevated text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeft size={15} aria-hidden="true" />
          </button>
        </AppTooltip>
      </div>

      <div className="flex flex-col gap-0 px-0 py-0 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        {/* ── Search ─────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-1">
          <div className={cn(
            "relative rounded-lg border transition-all duration-150",
            searchFocused || searchQuery
              ? "border-primary bg-obsidian-void"
              : "border-obsidian-border bg-obsidian-elevated hover:border-obsidian-border"
          )}>
            <div className="flex items-center gap-2 px-3 py-2">
              <Search size={13} className={cn("flex-shrink-0 transition-colors", searchFocused ? "text-primary" : "text-muted-foreground")} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search topics, problems…"
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/60 text-foreground min-w-0"
              />
              <AnimatePresence>
                {searchQuery ? (
                  <button
                    key="clear"
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="touch-manipulation flex-shrink-0 p-1 rounded hover:bg-foreground/[0.05] text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                ) : (
                  <kbd className="hidden sm:flex flex-shrink-0 items-center text-[10px] font-mono text-muted-foreground border border-obsidian-border rounded px-1.5 py-0.5 select-none">
                    ⌘K
                  </kbd>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {searchQuery.trim() && (
                <div
                  className="border-t border-obsidian-border overflow-hidden rounded-b-lg bg-obsidian-elevated"
                >
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-5 text-center">
                        <Search size={16} className="text-muted-foreground/40" />
                        <p className="text-[12px] text-muted-foreground">No results for "{searchQuery}"</p>
                      </div>
                    ) : (
                      searchResults.slice(0, 18).map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => { navigate(item.path); setSearchQuery(""); }}
                          className="touch-manipulation w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] text-left transition-colors hover:bg-foreground/[0.05] border-b border-obsidian-border last:border-0 group"
                        >
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[12px] flex-shrink-0 border border-obsidian-border bg-obsidian-pane text-foreground"
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground group-hover:text-primary transition-colors" title={item.title}>{item.title}</span>
                              {item.difficulty && <DifficultyPill difficulty={item.difficulty} />}
                            </div>
                            {item.parent && (
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate" title={item.parent}>{item.parent}</div>
                            )}
                          </div>
                          <ChevronRight size={11} className="text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Quick Nav ──────────────────────────────────── */}
        <div className="px-3 pt-3 pb-1 space-y-0.5">
          {navItems.map(({ label, Icon, path }) => {
            const isActive = currentPath === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={cn(
                  "touch-manipulation flex items-center gap-2.5 w-full min-w-0 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 group",
                  isActive
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                <span className={cn("flex items-center justify-center w-5 h-5 transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left" title={label}>{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Section divider ─────────────────────────────── */}
        <div className="mx-3 mt-3 mb-1.5 flex items-center gap-2">
          <div className="flex-1 h-px bg-obsidian-border" />
          <span className="text-[11px] font-medium text-muted-foreground select-none">
            {currentMode.id === "ds" ? "Topics" : currentMode.id === "lang" ? "Modules" : "Practice"}
          </span>
          <div className="flex-1 h-px bg-obsidian-border" />
        </div>

        {/* ── Topic Tree ─────────────────────────────────── */}
        <div className="px-3 pb-4 space-y-0.5">
          <SidebarMenu className="space-y-0.5">
            {activeTopics.map((topic) => {
              const isOpen   = openTopics[topic.id];
              const isActive = isTopicActive(topic.id);

              return (
                <SidebarMenuItem key={topic.id}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <button
                      type="button"
                      onClick={() => { toggleTopic(topic.id); navigate(`/${topic.id}`); }}
                      className={cn(
                        "touch-manipulation flex items-center justify-between w-full min-w-0 gap-2 overflow-hidden px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 group",
                        isActive
                          ? "bg-foreground/[0.06] text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2.5 min-w-0">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[13px] flex-shrink-0 border border-obsidian-border bg-obsidian-elevated text-foreground/80 transition-colors"
                        >
                          {topic.icon}
                        </div>
                        <span title={topic.title} className={cn("min-w-0 flex-1 truncate text-left", isActive && "font-semibold text-foreground")}>
                          {topic.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[11px] text-muted-foreground tabular-nums">{topic.subtopics.length}</span>
                        <ChevronDown
                          size={13}
                          className={cn("transition-transform duration-150 text-muted-foreground", isOpen && "rotate-180")}
                        />
                      </div>
                    </button>
                  </SidebarMenuButton>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="sub"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <SidebarMenuSub
                          className="ml-3.5 mt-1 pl-3 space-y-0.5 border-l border-obsidian-border"
                        >
                          {topic.subtopics.map((sub) => {
                            const active = isSubActive(topic.id, sub.id);
                            return (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton asChild className="h-auto p-0">
                                  <AppTooltip content={sub.title} side="right">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/${topic.id}#${sub.id}`)}
                                      className={cn(
                                        "touch-manipulation flex items-center gap-2.5 w-full px-2.5 py-1.5 min-h-[32px] rounded-md text-[12px] font-medium transition-colors text-left group",
                                        active
                                          ? "text-foreground bg-foreground/[0.06]"
                                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                                      )}
                                    >
                                      <span
                                        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors", active ? "bg-foreground" : "bg-muted-foreground/40 group-hover:bg-muted-foreground")}
                                      />
                                      <span className="min-w-0 flex-1 truncate leading-snug">{sub.title}</span>
                                    </button>
                                  </AppTooltip>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        <div className="flex-1" />

        {/* ── User Profile Footer ────────────────────────── */}
        <div className="mx-3 mb-3 mt-2 rounded-lg border border-obsidian-border bg-obsidian-elevated overflow-hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover border border-obsidian-border"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold border border-obsidian-border bg-obsidian-pane text-foreground"
                >
                  {userName[0]?.toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-obsidian-elevated"
              />
            </div>

            <div className="flex-1 min-w-0">
              <AppTooltip content={userName} side="top" align="start">
                <div className="text-[13px] font-medium truncate text-foreground leading-tight">{userName}</div>
              </AppTooltip>
              <AppTooltip content={user?.email ?? ""} side="top" align="start">
                <div className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
                  {user?.email?.split("@")[0]}
                </div>
              </AppTooltip>
            </div>

            <AppTooltip content="Sign out">
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="touch-manipulation p-1.5 rounded-md transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive group"
              >
                <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform duration-150" />
              </button>
            </AppTooltip>
          </div>
        </div>

      </div>
    </div>
  );
}
