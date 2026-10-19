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
import {
  ChevronRight,
  ChevronLeft,
  List,
  X,
  Clock,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMode } from "@/contexts/ModeContext";
import { AppTooltip } from "@/components/ui/tooltip";
import {
  PageHeader,
  PageShell,
  Section,
  Surface,
} from "@/components/layout/PagePrimitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentMode, setMode } = useMode();
  const [tocOpen, setTocOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const {
    contentWidth,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    theme,
    toggleTheme,
  } = useSettings();

  // Auto-detect the correct mode based on topicId
  const detectedMode = useMemo(() => {
    if (topicId && topics.some((t) => t.id === topicId)) return "ds";
    if (topicId && practiceTopics.some((t) => t.id === topicId))
      return "practice";
    if (topicId && javaTopics.some((t) => t.id === topicId)) return "lang";
    return currentMode.id;
  }, [topicId, currentMode.id]);

  // Switch mode if navigating to a topic from a different mode
  useEffect(() => {
    if (detectedMode !== currentMode.id) {
      setMode(detectedMode);
    }
  }, [detectedMode, currentMode.id, setMode]);

  const allTopicsForPage =
    detectedMode === "ds"
      ? topics
      : detectedMode === "practice"
        ? practiceTopics
        : javaTopics;
  const contentMap =
    detectedMode === "ds"
      ? dsContentMap
      : detectedMode === "practice"
        ? practiceContentMap
        : javaContentMap;

  const topic = allTopicsForPage.find((t) => t.id === topicId);
  const content = topicId ? contentMap[topicId] : null;

  const readingTimeMinutes = useMemo(() => {
    if (!content) return 5;
    let totalWords = 0;
    content.forEach((sec) => {
      sec.theory?.forEach((t) => {
        totalWords += t.split(/\s+/).length;
      });
      sec.keyPoints?.forEach((k) => {
        totalWords += k.split(/\s+/).length;
      });
    });
    return Math.max(3, Math.ceil(totalWords / 180));
  }, [content]);

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
      { rootMargin: "-20% 0% -60% 0%", threshold: 0 },
    );
    content?.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [content]);

  if (!topic || !content) {
    return (
      <div className="ui-app-canvas">
        <PageShell>
          <Section>
            <p className="ui-meta">Topic not found</p>
          </Section>
        </PageShell>
      </div>
    );
  }

  const currentIdx = allTopicsForPage.findIndex((t) => t.id === topicId);
  const prevTopic = currentIdx > 0 ? allTopicsForPage[currentIdx - 1] : null;
  const nextTopic =
    currentIdx < allTopicsForPage.length - 1
      ? allTopicsForPage[currentIdx + 1]
      : null;
  const modeLabel =
    detectedMode === "lang"
      ? "Java"
      : detectedMode === "practice"
        ? "Practice"
        : "Data Structure";
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <div
      className="flex min-h-screen relative bg-background selection:bg-primary/25"
      ref={mainRef}
    >
      <div className="flex-1 min-w-0 ui-app-canvas">
        <PageShell>
          <PageHeader
            variant="display"
            breadcrumb={
              <nav
                className="flex items-center gap-1.5"
                aria-label="Breadcrumb"
              >
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="transition-colors hover:text-foreground"
                >
                  Home
                </button>
                <ChevronRight
                  size={12}
                  className="opacity-40"
                  aria-hidden="true"
                />
                <span aria-current="page">{topic.title}</span>
              </nav>
            }
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                {topic.icon}
                {modeLabel}
              </span>
            }
            title={topic.title}
            description={
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="ui-meta">
                  {content.length} sections · Comprehensive guide
                </span>
                <span className="inline-flex items-center gap-1.5 ui-meta">
                  <Clock size={12} className="opacity-60" aria-hidden="true" />~
                  {readingTimeMinutes} min read
                </span>
              </span>
            }
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-border p-0.5">
                  <AppTooltip content="Smaller text">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={decreaseFontSize}
                      disabled={fontSize === "sm"}
                      aria-label="Decrease font size"
                    >
                      <ZoomOut size={13} />
                    </Button>
                  </AppTooltip>
                  <span className="ui-meta ui-pill--mono px-1.5 select-none">
                    {fontSize.toUpperCase()}
                  </span>
                  <AppTooltip content="Larger text">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={increaseFontSize}
                      disabled={fontSize === "xl"}
                      aria-label="Increase font size"
                    >
                      <ZoomIn size={13} />
                    </Button>
                  </AppTooltip>
                </div>

                <AppTooltip
                  content={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                >
                  <Button
                    variant="line"
                    size="icon-sm"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                  </Button>
                </AppTooltip>
              </div>
            }
          />

          <div
            className="flex flex-wrap items-center gap-2 pt-6"
            role="tablist"
            aria-label="Sections"
          >
            {content.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <AppTooltip key={s.id} content={s.title}>
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    aria-label={s.title}
                    onClick={() => scrollToSection(s.id)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      isActive
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted hover:bg-muted-foreground/40",
                    )}
                  />
                </AppTooltip>
              );
            })}
          </div>
        </PageShell>

        <div
          className="mx-auto w-full px-5 py-10 md:py-14"
          style={{ maxWidth: `${Math.min(contentWidth || 1080, 1140)}px` }}
        >
          <Section spacing="none">
            <div className="space-y-12 lg:space-y-16">
              {content.map((section) => (
                <ContentRenderer
                  key={section.id}
                  section={section}
                  isPractice={detectedMode === "practice"}
                />
              ))}
            </div>
          </Section>

          <div className="ui-rule mt-16" />
          <nav
            className="mt-6 grid gap-4 sm:grid-cols-2"
            aria-label="Topic navigation"
          >
            {prevTopic ? (
              <Surface
                as="div"
                role="button"
                tabIndex={0}
                interactive
                onClick={() => navigate(`/${prevTopic.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/${prevTopic.id}`);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 p-4 text-left"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground">
                  <ChevronLeft size={15} />
                </span>
                <span className="min-w-0">
                  <span className="ui-meta block">Previous</span>
                  <span className="block truncate text-sm font-medium text-foreground">
                    {prevTopic.title}
                  </span>
                </span>
              </Surface>
            ) : (
              <span aria-hidden="true" />
            )}

            {nextTopic && (
              <Surface
                as="div"
                role="button"
                tabIndex={0}
                interactive
                onClick={() => navigate(`/${nextTopic.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/${nextTopic.id}`);
                  }
                }}
                className="flex cursor-pointer items-center justify-between gap-3 p-4 text-right"
              >
                <span className="min-w-0">
                  <span className="ui-meta block">Next</span>
                  <span className="block truncate text-sm font-medium text-foreground">
                    {nextTopic.title}
                  </span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ArrowRight size={15} />
                </span>
              </Surface>
            )}
          </nav>
        </div>
      </div>

      {/* Right TOC */}
      <aside
        className="hidden xl:flex flex-col w-56 flex-shrink-0 border-l border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-5"
        aria-label="On this page"
      >
        <p className="ui-kicker mb-4">On this page</p>
        <nav className="space-y-0.5">
          {content.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-center border-l-2 py-1.5 pl-3 pr-2 text-left text-xs transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s.title}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile TOC */}
      <button
        type="button"
        onClick={() => setTocOpen(!tocOpen)}
        aria-expanded={tocOpen}
        className="ui-btn ui-btn--line ui-btn--reset fixed bottom-5 right-5 z-50 xl:hidden"
      >
        {tocOpen ? <X size={14} /> : <List size={14} />}
        <span className="text-xs">{tocOpen ? "Close" : "Contents"}</span>
      </button>

      <AnimatePresence>
        {tocOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="ui-surface fixed bottom-20 right-5 z-50 w-72 max-w-[calc(100vw-2.5rem)] p-4 xl:hidden"
          >
            <p className="ui-kicker mb-3">Sections</p>
            <nav className="space-y-0.5 max-h-72 overflow-y-auto">
              {content.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    scrollToSection(s.id);
                    setTocOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                    activeSection === s.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      activeSection === s.id ? "bg-primary" : "bg-border",
                    )}
                  />
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
