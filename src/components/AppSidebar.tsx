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
    <Sidebar className="border-r" style={{ borderColor: "hsl(var(--sidebar-border))", background: "hsl(var(--sidebar-background))" }}>
      {/* Logo */}
      <Link to="/" className="block">
        <div className="group flex items-center gap-3.5 px-5 py-4 border-b-4 hover:bg-[hsl(var(--muted)/0.5)] backdrop-blur-sm transition-all duration-500 ease-out" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-[10px] rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <AlgoGuruLogo
              size={44}
              showText={false}
              className="relative z-10 group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-300 block"
            />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-widest" style={{ color: "hsl(var(--foreground))" }}>
              AlgoGuru
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider group-hover:text-foreground/70 transition-colors duration-300" style={{ color: "hsl(var(--muted-foreground))" }}>
              {currentMode.description}
            </div>
          </div>
        </div>
      </Link>
      <SidebarContent className="px-3 py-4">

        {/* Home */}
        <div className="mb-2">
          <button
            onClick={() => navigate("/")}
            className={cn(
              "flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-black uppercase tracking-wide transition-all duration-150",
              currentPath === "/" ? "neo-btn" : "hover:bg-muted/50 border-2 border-transparent"
            )}
            style={{
              color: currentPath === "/" ? "hsl(var(--primary-foreground))" : "hsl(var(--sidebar-foreground))",
              background: currentPath === "/" ? "hsl(var(--primary))" : undefined,
              borderColor: currentPath === "/" ? "hsl(var(--border))" : undefined,
            }}
          >
            <Home size={15} />
            <span>Home</span>
          </button>
          <button
            onClick={() => navigate("/playground")}
            className={cn(
              "flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-black uppercase tracking-wide transition-all duration-150",
              currentPath === "/playground" ? "neo-btn" : "hover:bg-muted/50 border-2 border-transparent"
            )}
            style={{
              color: currentPath === "/playground" ? "hsl(var(--primary-foreground))" : "hsl(var(--sidebar-foreground))",
              background: currentPath === "/playground" ? "hsl(var(--primary))" : undefined,
              borderColor: currentPath === "/playground" ? "hsl(var(--border))" : undefined,
            }}
          >
            <Code2 size={15} />
            <span>Playground</span>
          </button>
        </div>

        <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          {currentMode.id === "ds" ? "Topics" : currentMode.id === "lang" ? "Java Modules" : "Practice Sets"}
        </div>

        <SidebarMenu>
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
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group"
                    style={{
                      background: isActive ? "hsl(var(--sidebar-accent))" : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono"
                        style={{ background: `${color}12`, color }}
                      >
                        {topic.icon}
                      </span>
                      <span
                        className="transition-colors group-hover:text-sidebar-accent-foreground"
                        style={isActive ? { color } : undefined}
                      >
                        {topic.title}
                      </span>
                    </div>
                    <ChevronDown
                      size={13}
                      className={cn(
                        "transition-transform duration-300 group-hover:text-sidebar-accent-foreground",
                        !isActive && "text-muted-foreground"
                      )}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                </SidebarMenuButton>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <SidebarMenuSub className="ml-4 mt-1 border-l pl-3" style={{ borderColor: `${color}20` }}>
                        {topic.subtopics.map((sub) => {
                          const active = isSubActive(topic.id, sub.id);
                          return (
                            <SidebarMenuSubItem key={sub.id}>
                              <SidebarMenuSubButton asChild className="h-auto p-0">
                                <button
                                  onClick={() => navigate(`/${topic.id}#${sub.id}`)}
                                  className={cn(
                                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                                    !active && "text-sidebar-foreground/90 hover:text-sidebar-accent-foreground"
                                  )}
                                  style={{
                                    color: active ? color : undefined,
                                    background: active ? `${color}10` : undefined,
                                    fontWeight: active ? 600 : 500,
                                  }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                                    style={{ background: active ? color : "hsl(var(--muted-foreground)/0.5)" }}
                                  />
                                  {sub.title}
                                </button>
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

        {/* Search Topics */}
        <div className="mt-8 mx-1">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "hsl(var(--muted)/0.4)", border: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Search size={13} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, problems, algorithms..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "hsl(var(--foreground))" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 rounded hover:bg-muted" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <X size={12} />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="max-h-64 overflow-y-auto border-t" style={{ borderColor: "hsl(var(--border))" }}>
                {searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-center" style={{ color: "hsl(var(--muted-foreground))" }}>No results found</div>
                ) : (
                  searchResults.slice(0, 20).map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setSearchQuery(""); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:bg-muted/60"
                      style={{ color: "hsl(var(--foreground))", borderBottom: "1px solid hsl(var(--border)/0.3)" }}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{item.title}</span>
                          {item.difficulty && (
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: item.difficulty === "Easy" ? "hsl(var(--success)/0.15)" : item.difficulty === "Medium" ? "hsl(var(--warning)/0.15)" : "hsl(var(--destructive)/0.15)",
                                color: item.difficulty === "Easy" ? "hsl(var(--success))" : item.difficulty === "Medium" ? "hsl(var(--warning))" : "hsl(var(--destructive))",
                              }}
                            >
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                        {item.parent && (
                          <div className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{item.parent}</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="mt-auto pt-4 mx-1 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))" }}
              >
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>{userName}</div>
              <div className="text-[10px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg transition-colors hover:bg-muted flex-shrink-0"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}
