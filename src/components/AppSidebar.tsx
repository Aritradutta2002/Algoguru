import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarUrl } from "@/lib/avatarUrl";
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
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlgoGuruLogo } from "@/components/AlgoGuruLogo";
import { useResponsivePreferences } from "@/hooks/useResponsivePreferences";
import { AppTooltip } from "@/components/ui/tooltip";

// Content imports for deep search indexing
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
import { useMode, APP_MODES } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

const topicIcons: Record<string, string> = {
  recursion: "↻",
  backtracking: "←",
  dp: "⊞",
  graphs: "◉",
  bits: "⊕",
  heaps: "△",
};

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
  // Java topic colors
  "java-basics": "hsl(var(--primary))",
  "java-oop": "hsl(var(--accent))",
  "java-exceptions": "hsl(var(--warning))",
  "java-collections": "hsl(var(--success))",
  "java-generics": "hsl(var(--info))",
  "java-streams": "hsl(var(--heap))",
  "java-multithreading": "hsl(var(--primary))",
  "java-io": "hsl(var(--accent))",
  "java-advanced": "hsl(var(--warning))",
  // Practice topic colors
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
  const { currentMode, setMode, modes } = useMode();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const currentHash = location.hash.replace("#", "");

  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single().then(async ({ data }) => {
      if (data) {
        setProfile(data);
        const url = await getAvatarUrl(data.avatar_url);
        setResolvedAvatar(url);
      }
    });
  }, [user]);

  const userName = profile.display_name || user?.email?.split("@")[0] || "User";
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

    // Index topics and subtopics
    allTopicsList.forEach((t) => {
      items.push({ id: t.id, title: t.title, icon: t.icon, type: "topic", path: `/${t.id}`, parent: null, subtopicCount: t.subtopics.length });
      t.subtopics.forEach((s) => {
        items.push({ id: s.id, title: s.title, icon: t.icon, type: "subtopic", path: `/${t.id}#${s.id}`, parent: t.title, subtopicCount: 0 });
      });
    });

    // Index individual content sections (problems, algorithms, concepts)
    const allContentMaps: Record<string, ContentSection[]> = { ...dsContentMap, ...javaContentMap, ...practiceContentMap };
    Object.entries(allContentMaps).forEach(([topicId, sections]) => {
      const topic = allTopicsList.find((t) => t.id === topicId);
      if (!topic || !sections) return;
      sections.forEach((section) => {
        if (!section.title || !section.id) return;
        // Skip group headers like "Easy Problems", "Medium Problems", "Hard Problems"
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
        // Exact match first
        if (aTitle === q && bTitle !== q) return -1;
        if (bTitle === q && aTitle !== q) return 1;
        // Starts with query next
        const aStarts = aTitle.startsWith(q) ? 0 : 1;
        const bStarts = bTitle.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        // Then by type priority: topic > subtopic > content
        const typePriority = { topic: 0, subtopic: 1, content: 2 };
        const aPrio = typePriority[a.type] ?? 2;
        const bPrio = typePriority[b.type] ?? 2;
        if (aPrio !== bPrio) return aPrio - bPrio;
        // Then by position of match
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
      className="border-r shadow-2xl" 
      style={{ 
        borderColor: "hsl(var(--sidebar-border) / 0.5)", 
        background: "hsl(var(--sidebar-background))"
      }}
    >
      {/* Logo */}
      <Link to="/" className="block">
        <div className="group flex items-center gap-4 px-6 py-6 border-b transition-all duration-300 hover:bg-muted/30" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AlgoGuruLogo
              size={42}
              showText={false}
              className="relative z-10 transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
              AlgoGuru
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5 group-hover:text-primary/60 transition-colors">
              {currentMode.description}
            </span>
          </div>
        </div>
      </Link>

      <SidebarContent className="px-4 py-6 space-y-8">
        {/* Navigation */}
        <div className="space-y-1.5">
          {[
            { label: "Home", icon: <Home size={16} />, path: "/", active: currentPath === "/" },
            { label: "Playground", icon: <Code2 size={16} />, path: "/playground", active: currentPath === "/playground" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "touch-manipulation flex items-center gap-3 w-full px-4 py-3 min-h-[44px] rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 group border active:scale-95",
                item.active 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn("transition-transform duration-200 group-hover:scale-110", item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
            {currentMode.id === "ds" ? "Learning Topics" : currentMode.id === "lang" ? "Java Modules" : "Practice Sets"}
          </div>

          <SidebarMenu className="space-y-1">
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
                        "touch-manipulation flex items-center justify-between w-full px-4 py-3 min-h-[44px] rounded-[20px] text-[13px] font-bold tracking-tight transition-all duration-200 group border active:scale-95",
                        isActive 
                          ? "bg-muted/50 border-border/50 text-foreground" 
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                          style={{ 
                            background: isActive ? `${color}20` : `${color}10`, 
                            color,
                            borderColor: `${color}30`,
                            borderWidth: isActive ? '1px' : '0px'
                          }}
                        >
                          {topic.icon}
                        </div>
                        <span className={cn("transition-colors", isActive && "font-black")}>
                          {topic.title}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-300 text-muted-foreground/40 group-hover:text-foreground/60",
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
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <SidebarMenuSub className="ml-7 mt-2 border-l-2 pl-4 space-y-1" style={{ borderColor: `${color}15` }}>
                          {topic.subtopics.map((sub) => {
                            const active = isSubActive(topic.id, sub.id);
                            return (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton asChild className="h-auto p-0">
                                  <AppTooltip content={sub.title} side="right">
                                    <button
                                      onClick={() => navigate(`/${topic.id}#${sub.id}`)}
                                      className={cn(
                                        "touch-manipulation flex items-center gap-3 w-full px-3 py-2 min-h-[44px] rounded-xl text-[12px] font-semibold transition-all duration-200 text-left active:scale-95",
                                        active 
                                          ? "text-foreground bg-muted/30" 
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                                      )}
                                    >
                                      <div
                                        className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", active ? "scale-125" : "opacity-30")}
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

        {/* Search Topics */}
        <div className="pt-4 border-t border-border/30">
          <div
            className="rounded-[20px] overflow-hidden border transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-xl focus-within:shadow-primary/5 bg-muted/20"
            style={{ borderColor: "hsl(var(--border) / 0.5)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Search size={14} className="text-muted-foreground/40" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="flex-1 bg-transparent text-[12px] font-semibold outline-none placeholder:text-muted-foreground/30 text-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="touch-manipulation p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground/40 hover:text-foreground min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95">
                  <X size={14} />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="max-h-72 overflow-y-auto border-t bg-card/50 backdrop-blur-md" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                {searchResults.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">No results found</div>
                  </div>
                ) : (
                  searchResults.slice(0, 20).map((item) => (
                    <AppTooltip key={item.path} content={item.title} side="right">
                      <button
                        onClick={() => { navigate(item.path); setSearchQuery(""); }}
                        className="touch-manipulation w-full flex items-center gap-3 px-4 py-3.5 min-h-[44px] text-left transition-all hover:bg-muted/50 active:bg-muted/70 border-b border-border/10 last:border-0 active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-sm flex-shrink-0 border border-border/20">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold truncate text-foreground">{item.title}</span>
                            {item.difficulty && (
                              <span
                                className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
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
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 mt-0.5">{item.parent}</div>
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

        {/* User Footer */}
        <div className="mt-auto pt-6 border-t border-border/30">
          <div className="flex items-center gap-4 px-2 py-2">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="relative w-10 h-10 rounded-2xl object-cover border border-border/50 shadow-md max-w-full" style={{ aspectRatio: '1/1' }} referrerPolicy="no-referrer" loading="lazy" />
              ) : (
                <div
                  className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black border border-primary/20 bg-primary/10 text-primary shadow-sm"
                >
                  {userName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <AppTooltip content={userName} side="top" align="start">
                <div className="text-[13px] font-black tracking-tight truncate text-foreground">{userName}</div>
              </AppTooltip>
              <AppTooltip content={user?.email?.split('@')[0]} side="top" align="start">
                <div className="text-[10px] font-bold text-muted-foreground/50 truncate uppercase tracking-widest">{user?.email?.split('@')[0]}</div>
              </AppTooltip>
            </div>
            <AppTooltip content="Sign out">
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="touch-manipulation p-2.5 rounded-xl transition-all hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive group min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
              >
                <LogOut size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </AppTooltip>
          </div>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}
