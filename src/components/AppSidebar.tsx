import { useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
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
import { ChevronDown, Home, BookOpen, Layers, Coffee, Search, X, Code2, LogOut, Trophy } from "lucide-react";
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

const topicColorVars: Record<string, string> = {
  recursion: "hsl(var(--primary))",
  backtracking: "hsl(var(--accent))",
  dp: "hsl(var(--success))",
  graphs: "hsl(var(--warning))",
  bits: "hsl(var(--info))",
  heaps: "hsl(var(--heap))",
  strings: "hsl(var(--primary))",
  "number-theory": "hsl(var(--success))",
  trees: "hsl(var(--accent))",
  "segment-tree": "hsl(var(--info))",
  "advanced-math": "hsl(var(--warning))",
  "advanced-topics": "hsl(var(--heap))",
  "java-basics": "hsl(var(--primary))",
  "java-oop": "hsl(var(--accent))",
  "java-exceptions": "hsl(var(--warning))",
  "java-collections": "hsl(var(--success))",
  "java-generics": "hsl(var(--info))",
  "java-streams": "hsl(var(--heap))",
  "java-multithreading": "hsl(var(--primary))",
  "java-io": "hsl(var(--accent))",
  "java-advanced": "hsl(var(--warning))",
  "practice-arrays": "hsl(var(--accent))",
  "practice-strings": "hsl(var(--success))",
  "practice-recursion": "hsl(var(--warning))",
  "practice-dp": "hsl(var(--info))",
  "practice-graphs": "hsl(var(--heap))",
  "practice-trees": "hsl(var(--primary))",
  "practice-greedy": "hsl(var(--accent))",
  "practice-stack-queue": "hsl(var(--primary))",
};

const modeIcons: Record<string, React.ReactNode> = {
  ds: <Layers size={14} />,
  lang: <Coffee size={14} />,
  practice: <Trophy size={14} />,
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
    activeTopics.forEach((t) => {
      initial[t.id] = currentPath === `/${t.id}`;
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState("");
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
        const aPrio = typePriority[a.type] ?? 2;
        const bPrio = typePriority[b.type] ?? 2;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return aTitle.indexOf(q) - bTitle.indexOf(q);
      });
  }, [searchQuery, allSearchItems]);

  const toggleTopic = (id: string) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSubActive = (topicId: string, subId: string) => {
    return currentPath === `/${topicId}` && currentHash === subId;
  };

  const isTopicActive = (topicId: string) => {
    return currentPath === `/${topicId}`;
  };

  return (
    <Sidebar
      className="border-r border-border bg-card"
      style={{ background: "hsl(var(--card))" }}
    >
      <Link to="/" className="block">
        <div className="group flex items-center gap-3 px-5 py-5 border-b transition-colors hover:bg-muted/30" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <AlgoGuruLogo
            size={36}
            showText={false}
            className="relative z-10 transition-transform duration-200 group-"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">
              AlgoGuru
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {currentMode.description}
            </span>
          </div>
        </div>
      </Link>

      <SidebarContent className="px-4 py-5 space-y-6">
        <div className="space-y-1">
          {[
            { label: "Home", icon: <Home size={15} />, path: "/", active: currentPath === "/" },
            { label: "Playground", icon: <Code2 size={15} />, path: "/playground", active: currentPath === "/playground" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "touch-manipulation flex items-center gap-2.5 w-full px-3 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn(item.active ? "text-primary" : "text-muted-foreground")}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {currentMode.id === "ds" ? "Learning Topics" : currentMode.id === "lang" ? "Java Modules" : "Practice Sets"}
          </div>

          <SidebarMenu className="space-y-0.5">
            {activeTopics.map((topic) => {
              const isOpen = openTopics[topic.id];
              const isActive = isTopicActive(topic.id);
              const color = topicColorVars[topic.id] || "hsl(var(--primary))";

              return (
                <SidebarMenuItem key={topic.id}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <button
                      onClick={() => {
                        toggleTopic(topic.id);
                        navigate(`/${topic.id}`);
                      }}
                      className={cn(
                        "touch-manipulation flex items-center justify-between w-full px-3 py-2 min-h-[40px] rounded-lg text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-semibold border"
                          style={{
                            background: `${color}10`,
                            color,
                            borderColor: `${color}25`,
                          }}
                        >
                          {topic.icon}
                        </div>
                        <span className={cn(isActive && "font-semibold")}>
                          {topic.title}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-200 text-muted-foreground/60",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </SidebarMenuButton>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <SidebarMenuSub className="ml-4 mt-1 border-l pl-3 space-y-0.5" style={{ borderColor: `${color}25` }}>
                          {topic.subtopics.map((sub) => {
                            const active = isSubActive(topic.id, sub.id);
                            return (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton asChild className="h-auto p-0">
                                  <AppTooltip content={sub.title} side="right">
                                    <button
                                      onClick={() => navigate(`/${topic.id}#${sub.id}`)}
                                      className={cn(
                                        "touch-manipulation flex items-center gap-2.5 w-full px-2.5 py-1.5 min-h-[36px] rounded-md text-[12px] font-medium transition-colors text-left",
                                        active
                                          ? "text-foreground bg-muted/60"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                      )}
                                    >
                                      <span
                                        className={cn("w-1.5 h-1.5 rounded-full", active ? "" : "opacity-40")}
                                        style={{ background: active ? color : "currentColor" }}
                                      />
                                      <span className="truncate">{sub.title}</span>
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

        <div className="pt-2 border-t border-border/40">
          <div className="rounded-lg overflow-hidden border bg-muted/30 transition-colors focus-within:border-primary/40 focus-within:bg-background">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <Search size={14} className="text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60 text-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="touch-manipulation p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="max-h-72 overflow-y-auto border-t bg-background">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  searchResults.slice(0, 20).map((item) => (
                    <AppTooltip key={item.path} content={item.title} side="right">
                      <button
                        onClick={() => { navigate(item.path); setSearchQuery(""); }}
                        className="touch-manipulation w-full flex items-center gap-3 px-3 py-2.5 min-h-[40px] text-left transition-colors hover:bg-muted/60 border-b border-border/40 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-sm flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium truncate text-foreground">{item.title}</span>
                            {item.difficulty && (
                              <span
                                className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                                  item.difficulty === "Easy" ? "bg-success/10 border-success/20 text-success" :
                                  item.difficulty === "Medium" ? "bg-warning/10 border-warning/20 text-warning" :
                                  "bg-destructive/10 border-destructive/20 text-destructive"
                                )}
                              >
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                          {item.parent && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.parent}</div>
                          )}
                        </div>
                      </button>
                    </AppTooltip>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-2 py-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-border" style={{ aspectRatio: '1/1' }} referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold border border-primary/20 bg-primary/10 text-primary">
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <AppTooltip content={userName} side="top" align="start">
                <div className="text-[13px] font-semibold truncate text-foreground">{userName}</div>
              </AppTooltip>
              <AppTooltip content={user?.email?.split('@')[0]} side="top" align="start">
                <div className="text-[11px] text-muted-foreground truncate">{user?.email?.split('@')[0]}</div>
              </AppTooltip>
            </div>
            <AppTooltip content="Sign out">
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="touch-manipulation p-2 rounded-md transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <LogOut size={15} />
              </button>
            </AppTooltip>
          </div>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}
