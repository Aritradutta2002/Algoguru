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
import { ChevronDown, Home, Layers, Coffee, Search, X, Code2, LogOut, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
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
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Per-topic color system ─────────────────────────────── */
const topicColors: Record<string, { from: string; to: string; glow: string; text: string }> = {
  recursion:            { from: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.22)",  text: "#818cf8" },
  backtracking:         { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.22)",  text: "#fbbf24" },
  dp:                   { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.22)",  text: "#34d399" },
  graphs:               { from: "#f97316", to: "#ef4444", glow: "rgba(249,115,22,0.22)",  text: "#fb923c" },
  bits:                 { from: "#3b82f6", to: "#6366f1", glow: "rgba(59,130,246,0.22)",  text: "#60a5fa" },
  heaps:                { from: "#ec4899", to: "#8b5cf6", glow: "rgba(236,72,153,0.22)",  text: "#f472b6" },
  strings:              { from: "#14b8a6", to: "#0ea5e9", glow: "rgba(20,184,166,0.22)",  text: "#2dd4bf" },
  "number-theory":      { from: "#22c55e", to: "#16a34a", glow: "rgba(34,197,94,0.22)",  text: "#4ade80" },
  trees:                { from: "#a78bfa", to: "#8b5cf6", glow: "rgba(167,139,250,0.22)", text: "#c4b5fd" },
  "segment-tree":       { from: "#0ea5e9", to: "#6366f1", glow: "rgba(14,165,233,0.22)", text: "#38bdf8" },
  "advanced-math":      { from: "#f59e0b", to: "#eab308", glow: "rgba(245,158,11,0.22)", text: "#fcd34d" },
  "advanced-topics":    { from: "#ec4899", to: "#f97316", glow: "rgba(236,72,153,0.22)", text: "#f9a8d4" },
  "stack-queue":        { from: "#8b5cf6", to: "#6366f1", glow: "rgba(139,92,246,0.22)", text: "#a78bfa" },
  "java-basics":        { from: "#f97316", to: "#ef4444", glow: "rgba(249,115,22,0.22)",  text: "#fb923c" },
  "java-oop":           { from: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.22)",  text: "#818cf8" },
  "java-exceptions":    { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.22)",  text: "#fbbf24" },
  "java-collections":   { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.22)",  text: "#34d399" },
  "java-generics":      { from: "#3b82f6", to: "#6366f1", glow: "rgba(59,130,246,0.22)",  text: "#60a5fa" },
  "java-streams":       { from: "#ec4899", to: "#8b5cf6", glow: "rgba(236,72,153,0.22)",  text: "#f472b6" },
  "java-multithreading":{ from: "#14b8a6", to: "#0ea5e9", glow: "rgba(20,184,166,0.22)",  text: "#2dd4bf" },
  "java-io":            { from: "#a78bfa", to: "#8b5cf6", glow: "rgba(167,139,250,0.22)", text: "#c4b5fd" },
  "java-advanced":      { from: "#f59e0b", to: "#eab308", glow: "rgba(245,158,11,0.22)",  text: "#fcd34d" },
  "practice-arrays":    { from: "#f97316", to: "#ef4444", glow: "rgba(249,115,22,0.22)",  text: "#fb923c" },
  "practice-strings":   { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.22)",  text: "#34d399" },
  "practice-recursion": { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.22)",  text: "#fbbf24" },
  "practice-dp":        { from: "#3b82f6", to: "#6366f1", glow: "rgba(59,130,246,0.22)",  text: "#60a5fa" },
  "practice-graphs":    { from: "#ec4899", to: "#8b5cf6", glow: "rgba(236,72,153,0.22)",  text: "#f472b6" },
  "practice-trees":     { from: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.22)",  text: "#818cf8" },
  "practice-greedy":    { from: "#14b8a6", to: "#0ea5e9", glow: "rgba(20,184,166,0.22)",  text: "#2dd4bf" },
  "practice-stack-queue":{ from: "#8b5cf6", to: "#6366f1", glow: "rgba(139,92,246,0.22)", text: "#a78bfa" },
};

const getTopicColor = (id: string) =>
  topicColors[id] ?? { from: "#6366f1", to: "#8b5cf6", glow: "rgba(99,102,241,0.2)", text: "#818cf8" };

const modeMeta = {
  ds:       { label: "DSA",      icon: <Layers size={11} />,  badge: "bg-violet-500/10 text-violet-400 border-violet-500/20"  },
  lang:     { label: "Java",     icon: <Coffee size={11} />,  badge: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  practice: { label: "Practice", icon: <Trophy size={11} />,  badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"},
} as const;

const DifficultyPill = ({ difficulty }: { difficulty: string }) => {
  const colors: Record<string, string> = {
    Easy:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Hard:   "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={cn("inline-flex items-center text-[9px] font-bold px-1.5 py-px rounded-md border tracking-wide uppercase", colors[difficulty] ?? colors.Hard)}>
      {difficulty}
    </span>
  );
};

export function AppSidebar() {
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
      const topic = allTopicsList.find((t) => t.id === topicId);
      if (!topic || !sections) return;
      sections.forEach((section) => {
        if (!section.title || !section.id) return;
        const isGroupHeader = /^(Easy|Medium|Hard) Problems$/i.test(section.title);
        if (isGroupHeader) return;
        const alreadyExists = items.some((i) => i.id === section.id && i.path.startsWith(`/${topicId}`));
        if (alreadyExists) return;
        items.push({ id: section.id, title: section.title, icon: topic.icon, type: "content", path: `/${topicId}#${section.id}`, parent: topic.title, subtopicCount: 0, difficulty: section.difficulty });
      });
    });

    systemDesignTopics.forEach((topic) => {
      topic.questions.forEach((question) => {
        items.push({ id: question.id, title: question.question, icon: topic.icon, type: "content", path: `/interview/java/system-design#${question.id}`, parent: `System Design — ${topic.title}`, subtopicCount: 0, difficulty: undefined });
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
        const text = `${i.title} ${i.parent || ''} ${i.id}`.toLowerCase();
        return terms.every(t => text.includes(t));
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

  const toggleTopic = (id: string) => setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  const isSubActive   = (topicId: string, subId: string) => currentPath === `/${topicId}` && currentHash === subId;
  const isTopicActive = (topicId: string) => currentPath === `/${topicId}`;
  const meta = modeMeta[currentMode.id as keyof typeof modeMeta] ?? modeMeta.ds;

  const navItems = [
    { label: "Home",       Icon: Home,  path: "/" },
    { label: "Playground", Icon: Code2, path: "/playground" },
  ];

  return (
    <div
      className="flex flex-col h-full w-full border-r border-border/50 overflow-hidden"
      style={{ background: "hsl(var(--card))" }}
    >

      {/* ── Brand Header ──────────────────────────────────── */}
      <Link to="/" className="block flex-shrink-0">
        <div
          className="relative flex items-center gap-3 px-4 py-4 overflow-hidden transition-colors hover:bg-muted/20"
          style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-40"
            style={{ background: "radial-gradient(ellipse at 0% 50%, hsl(var(--primary)/0.12) 0%, transparent 65%)" }} />

          <div
            className="relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.65) 100%)",
              boxShadow: "0 0 16px hsl(var(--primary)/0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <AlgoGuruLogo size={22} showText={false} className="text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[14.5px] font-bold tracking-tight text-foreground leading-tight">AlgoGuru</span>
            <span className={cn(
              "inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit",
              meta.badge
            )}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-0 px-0 py-0 overflow-y-auto overflow-x-hidden flex-1 min-h-0">

        {/* ── Search ─────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-1">
          <div className={cn(
            "relative rounded-xl border transition-all duration-200",
            searchFocused || searchQuery
              ? "border-primary/40 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] bg-background"
              : "border-border/50 bg-muted/40 hover:border-border/80"
          )}>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Search size={13} className={cn("flex-shrink-0 transition-colors", searchFocused ? "text-primary" : "text-muted-foreground/55")} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search topics, problems…"
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/45 text-foreground min-w-0"
              />
              <AnimatePresence>
                {searchQuery ? (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => setSearchQuery("")}
                    className="touch-manipulation flex-shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </motion.button>
                ) : (
                  <kbd className="hidden sm:flex flex-shrink-0 items-center text-[9px] font-mono text-muted-foreground/35 border border-border/35 rounded px-1.5 py-0.5 select-none">
                    ⌘K
                  </kbd>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-border/40 overflow-hidden rounded-b-xl"
                  style={{ background: "hsl(var(--popover))" }}
                >
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-5 text-center">
                        <Search size={16} className="text-muted-foreground/25" />
                        <p className="text-[11.5px] text-muted-foreground/55">No results for "<span className="text-foreground/60">{searchQuery}</span>"</p>
                      </div>
                    ) : (
                      searchResults.slice(0, 18).map((item) => {
                        const topicId = item.path.split("/")[1]?.split("#")[0] ?? "";
                        const color = getTopicColor(topicId);
                        return (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setSearchQuery(""); }}
                            className="touch-manipulation w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] text-left transition-colors hover:bg-muted/50 border-b border-border/25 last:border-0 group"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0 border"
                              style={{ background: `${color.from}12`, borderColor: `${color.from}25`, color: color.text }}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[12px] font-medium truncate text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                                {item.difficulty && <DifficultyPill difficulty={item.difficulty} />}
                              </div>
                              {item.parent && (
                                <div className="text-[10px] text-muted-foreground/55 mt-0.5 truncate">{item.parent}</div>
                              )}
                            </div>
                            <ChevronRight size={11} className="text-muted-foreground/25 group-hover:text-primary/50 flex-shrink-0 transition-colors" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
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
                onClick={() => navigate(path)}
                className={cn(
                  "touch-manipulation flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className={cn("flex items-center justify-center w-5 h-5 transition-all", isActive ? "text-primary" : "text-muted-foreground/65 group-hover:text-foreground")}>
                  <Icon size={15} />
                </span>
                <span className="flex-1 text-left">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ boxShadow: "0 0 6px hsl(var(--primary)/0.8)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Section divider ─────────────────────────────── */}
        <div className="mx-3 mt-3 mb-1.5 flex items-center gap-2">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground/45 select-none">
            {currentMode.id === "ds" ? "Topics" : currentMode.id === "lang" ? "Modules" : "Practice"}
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* ── Topic Tree ─────────────────────────────────── */}
        <div className="px-3 pb-4 space-y-0.5">
          <SidebarMenu className="space-y-0.5">
            {activeTopics.map((topic) => {
              const isOpen   = openTopics[topic.id];
              const isActive = isTopicActive(topic.id);
              const color    = getTopicColor(topic.id);

              return (
                <SidebarMenuItem key={topic.id}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <button
                      onClick={() => { toggleTopic(topic.id); navigate(`/${topic.id}`); }}
                      className={cn(
                        "touch-manipulation flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                        isActive
                          ? "bg-muted/80 text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-[13px] flex-shrink-0 border transition-all duration-200"
                          style={{
                            background: isActive
                              ? `linear-gradient(135deg, ${color.from}20, ${color.to}18)`
                              : `${color.from}0e`,
                            borderColor: isActive ? `${color.from}38` : `${color.from}18`,
                            color: color.text,
                            boxShadow: isActive ? `0 0 10px ${color.glow}` : "none",
                          }}
                        >
                          {topic.icon}
                        </div>
                        <span className={cn("truncate", isActive && "font-semibold text-foreground")}>
                          {topic.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground/35 font-mono tabular-nums">{topic.subtopics.length}</span>
                        <ChevronDown
                          size={13}
                          className={cn("transition-transform duration-200 text-muted-foreground/35", isOpen && "rotate-180")}
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
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <SidebarMenuSub
                          className="ml-3.5 mt-1 pl-3 space-y-0.5"
                          style={{ borderLeft: `1.5px solid ${color.from}28` }}
                        >
                          {topic.subtopics.map((sub) => {
                            const active = isSubActive(topic.id, sub.id);
                            return (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton asChild className="h-auto p-0">
                                  <AppTooltip content={sub.title} side="right">
                                    <button
                                      onClick={() => navigate(`/${topic.id}#${sub.id}`)}
                                      className={cn(
                                        "touch-manipulation flex items-center gap-2.5 w-full px-2.5 py-1.5 min-h-[34px] rounded-lg text-[12px] font-medium transition-all duration-100 text-left group",
                                        active
                                          ? "text-foreground bg-muted/50"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                      )}
                                    >
                                      <span
                                        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200", active ? "scale-110" : "opacity-25 group-hover:opacity-55")}
                                        style={{ background: active ? color.from : "currentColor" }}
                                      />
                                      <span className="truncate leading-snug">{sub.title}</span>
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
        <div className="mx-3 mb-3 mt-2 rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover"
                  style={{ border: "2px solid hsl(var(--primary)/0.28)", boxShadow: "0 0 10px hsl(var(--primary)/0.18)" }}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)/0.85), hsl(var(--primary)/0.45))",
                    border: "2px solid hsl(var(--primary)/0.28)",
                    boxShadow: "0 0 10px hsl(var(--primary)/0.18)",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {userName[0]?.toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card"
                style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <AppTooltip content={userName} side="top" align="start">
                <div className="text-[13px] font-semibold truncate text-foreground leading-tight">{userName}</div>
              </AppTooltip>
              <AppTooltip content={user?.email ?? ""} side="top" align="start">
                <div className="text-[10.5px] text-muted-foreground/65 truncate mt-0.5 leading-tight">
                  {user?.email?.split("@")[0]}
                </div>
              </AppTooltip>
            </div>

            <AppTooltip content="Sign out">
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="touch-manipulation p-2 rounded-lg transition-all duration-150 hover:bg-destructive/10 text-muted-foreground/55 hover:text-destructive group"
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
