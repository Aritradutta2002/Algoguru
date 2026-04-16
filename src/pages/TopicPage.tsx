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
import { javaContentMap } from "@/data/javaContent";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { practiceContentMap } from "@/data/practiceContent";
import { ContentSection } from "@/data/recursionContent";
import { ChevronRight, ChevronLeft, List, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMode } from "@/contexts/ModeContext";

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

const topicColorVars: Record<string, string> = {
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
    <div className="flex min-h-screen relative" ref={mainRef}>
      <div className="flex-1 min-w-0">
        <motion.div
          className="border-b relative overflow-hidden"
          style={{ borderColor: "hsl(var(--border))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hero-glow w-80 h-80 -top-20 -right-20 opacity-[0.08]" style={{ background: color }} />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-12">
            <div className="flex items-center gap-2 mb-4 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="cursor-pointer hover:underline transition-colors" onClick={() => navigate("/")} style={{ color: "hsl(var(--primary))" }}>
                Home
              </span>
              <ChevronRight size={12} />
              <span style={{ color }}>{topic.title}</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-bold"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}
              >
                {topic.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                  {topic.title}
                </h1>
                <p className="text-sm mt-1.5 font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {topic.description} · {content.length} sections · Java
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-5">
              {content.map((s, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: activeSection === s.id ? color : "hsl(var(--border))",
                    width: activeSection === s.id ? "24px" : "8px",
                  }}
                  onClick={() => navigate(`/${topicId}#${s.id}`)}
                  title={s.title}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="px-6 md:px-12 lg:px-16 py-14">
          {content.map((section) => (
            <ContentRenderer key={section.id} section={section} isPractice={detectedMode === "practice"} />
          ))}

          <div className="flex items-center justify-between mt-10 pt-8" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            {prevTopic ? (
              <motion.button
                whileHover={{ x: -3 }}
                onClick={() => navigate(`/${prevTopic.id}`)}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-shadow"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <ChevronLeft size={16} />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Previous</div>
                  <div className="font-semibold">{prevTopic.title}</div>
                </div>
              </motion.button>
            ) : <div />}

            {nextTopic && (
              <motion.button
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/${nextTopic.id}`)}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-shadow"
                style={{
                  background: "hsl(var(--primary)/0.06)",
                  border: "1px solid hsl(var(--primary)/0.15)",
                  color: "hsl(var(--primary))",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "hsl(var(--primary)/0.6)" }}>Next</div>
                  <div className="font-semibold">{nextTopic.title}</div>
                </div>
                <ChevronRight size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Right TOC */}
      <div className="hidden xl:flex flex-col w-56 flex-shrink-0 border-l sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-5"
        style={{ borderColor: "hsl(var(--border))" }}>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          On this page
        </div>
        <nav className="space-y-0.5">
          {content.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/${topicId}#${s.id}`)}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200"
                style={{
                  background: isActive ? `${color}08` : "transparent",
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
        whileTap={{ scale: 0.95 }}
        onClick={() => setTocOpen(!tocOpen)}
        className="xl:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xl"
        style={{ background: color, color: "hsl(var(--background))", boxShadow: `0 4px 20px ${color}40` }}
      >
        {tocOpen ? <X size={14} /> : <List size={14} />}
        {tocOpen ? "Close" : "Contents"}
      </motion.button>

      <AnimatePresence>
        {tocOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden fixed bottom-20 right-6 z-50 w-72 rounded-2xl shadow-2xl p-5 border glass-panel"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
              Sections
            </div>
            <nav className="space-y-0.5 max-h-72 overflow-y-auto">
              {content.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { navigate(`/${topicId}#${s.id}`); setTocOpen(false); }}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
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
