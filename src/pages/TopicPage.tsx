import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { ContentRenderer } from "@/components/ContentRenderer";
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
import { arraysContent } from "@/data/arraysContent";
import { javaContentMap } from "@/data/javaContent";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { practiceContentMap } from "@/data/practiceContent";
import { ContentSection } from "@/data/recursionContent";
import { ChevronRight, ChevronLeft, List, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMode } from "@/contexts/ModeContext";
import { AppTooltip } from "@/components/ui/tooltip";

const dsContentMap: Record<string, ContentSection[]> = {
  arrays: arraysContent,
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

const topicColorVars: Record<string, string> = {
  arrays: "hsl(var(--primary))",
  "stack-queue": "hsl(var(--info))",
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

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentMode, setMode } = useMode();
  const [tocOpen, setTocOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const { contentWidth } = useSettings();

  // Auto-detect the correct mode based on topicId
  const detectedMode = useMemo(() => {
    if (topicId && topics.some((t) => t.id === topicId)) return "ds";
    if (topicId && practiceTopics.some((t) => t.id === topicId)) return "practice";
    if (topicId && javaTopics.some((t) => t.id === topicId)) return "lang";
    return currentMode.id;
  }, [topicId, currentMode.id]);

  // Switch mode if navigating to a topic from a different mode
  useEffect(() => {
    if (detectedMode !== currentMode.id) {
      setMode(detectedMode);
    }
  }, [detectedMode, currentMode.id, setMode]);

  const allTopicsForPage = detectedMode === "ds" ? topics : detectedMode === "practice" ? practiceTopics : javaTopics;
  const contentMap = detectedMode === "ds" ? dsContentMap : detectedMode === "practice" ? practiceContentMap : javaContentMap;

  const topic = allTopicsForPage.find((t) => t.id === topicId);
  const content = topicId ? contentMap[topicId] : null;

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(hash);
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (content?.[0]) setActiveSection(content[0].id);
    }
  }, [location.hash, topicId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -60% 0%", threshold: 0 }
    );
    content?.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [content]);

  if (!topic || !content) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "hsl(var(--muted-foreground))" }}>
        Topic not found
      </div>
    );
  }

  const currentIdx = allTopicsForPage.findIndex((t) => t.id === topicId);
  const prevTopic = currentIdx > 0 ? allTopicsForPage[currentIdx - 1] : null;
  const nextTopic = currentIdx < allTopicsForPage.length - 1 ? allTopicsForPage[currentIdx + 1] : null;
  const color = topicColorVars[topic.id] || "hsl(var(--primary))";

  return (
    <div className="flex min-h-screen relative bg-background selection:bg-primary/25" ref={mainRef}>
      <div className="flex-1 min-w-0">
        <motion.div
          className="relative overflow-hidden border-b border-border/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative z-10 px-4 md:px-10 lg:px-16 py-12 md:py-20">
            <div className="flex items-center gap-2 mb-5 text-xs font-medium text-muted-foreground">
              <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/")}>
                Home
              </span>
              <ChevronRight size={12} className="opacity-40" />
              <span style={{ color }}>{topic.title}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-semibold border shrink-0"
                style={{ background: `${color}10`, borderColor: `${color}25`, color: color }}
              >
                {topic.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-foreground">
                  {topic.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                    {detectedMode === "lang" ? "Java" : detectedMode === "practice" ? "Practice" : "Data Structure"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {content.length} sections · Comprehensive guide
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-7">
              {content.map((s, i) => (
                <AppTooltip key={i} content={s.title}>
                  <div
                    className="h-1 rounded-full transition-all duration-300 cursor-pointer"
                    style={{
                      background: activeSection === s.id ? color : "hsl(var(--muted))",
                      width: activeSection === s.id ? "32px" : "8px",
                    }}
                    onClick={() => {
                      const el = document.getElementById(s.id);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setActiveSection(s.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={s.title}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const el = document.getElementById(s.id);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        setActiveSection(s.id);
                      }
                    }}
                  />
                </AppTooltip>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="px-4 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16 w-full max-w-[1400px] mx-auto">
          <div className="space-y-10 md:space-y-15 lg:space-y-20">
            {content.map((section) => (
              <ContentRenderer key={section.id} section={section} isPractice={detectedMode === "practice"} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-16 pt-8 border-t border-border">
            {prevTopic ? (
              <motion.button
                whileHover={{ x: -3 }}
                onClick={() => navigate(`/${prevTopic.id}`)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card text-left transition-colors hover:bg-muted"
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <ChevronLeft size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground">Previous</div>
                  <div className="text-sm font-semibold text-foreground">{prevTopic.title}</div>
                </div>
              </motion.button>
            ) : <div />}

            {nextTopic && (
              <motion.button
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/${nextTopic.id}`)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card text-right transition-colors hover:bg-muted group"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-medium text-primary">Next</div>
                  <div className="text-sm font-semibold text-foreground">{nextTopic.title}</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Right TOC */}
      <div className="hidden xl:flex flex-col w-56 flex-shrink-0 border-l border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
          On this page
        </div>
        <nav className="space-y-0.5">
          {content.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/${topicId}#${s.id}`)}
                className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors"
                style={{
                  background: isActive ? `${color}10` : "transparent",
                  color: isActive ? color : "hsl(var(--muted-foreground))",
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                }}
              >
                {s.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile TOC */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setTocOpen(!tocOpen)}
        className="xl:hidden fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium shadow-lg bg-card border border-border text-foreground"
      >
        {tocOpen ? <X size={14} /> : <List size={14} />}
        {tocOpen ? "Close" : "Contents"}
      </motion.button>

      <AnimatePresence>
        {tocOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="xl:hidden fixed bottom-16 right-5 z-50 w-72 rounded-xl shadow-xl p-4 bg-card border border-border"
          >
            <div className="text-xs font-semibold text-muted-foreground mb-3">
              Sections
            </div>
            <nav className="space-y-0.5 max-h-72 overflow-y-auto">
              {content.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { navigate(`/${topicId}#${s.id}`); setTocOpen(false); }}
                  className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors hover:bg-muted"
                  style={{ color: activeSection === s.id ? color : "hsl(var(--foreground))" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: activeSection === s.id ? color : "hsl(var(--border))" }} />
                  {s.title}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
