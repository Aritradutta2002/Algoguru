"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { useMode } from "@/contexts/ModeContext";
import { ContentRenderer } from "@/components/ContentRenderer";
import type { ContentSection } from "@/data/recursionContent";
import type { Topic } from "@/data/topics";
import type { TopicMode } from "@/features/learning/topicCatalog";
import { ChevronRight, ChevronLeft, List, X, Clock, ZoomIn, ZoomOut, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  "java-jdbc": "hsl(var(--info))",
  "java-sql": "hsl(var(--success))",
  // Spring Boot
  "spring-core": "hsl(var(--primary))",
  "spring-boot-basics": "hsl(var(--accent))",
  "spring-boot-rest": "hsl(var(--info))",
  "spring-data-jpa": "hsl(var(--success))",
  "spring-security": "hsl(var(--warning))",
  "spring-boot-testing": "hsl(var(--heap))",
  "spring-boot-microservices": "hsl(var(--primary))",
  "spring-boot-actuator": "hsl(var(--info))",
  // Practice topic colors
  "practice-arrays": "hsl(var(--accent))",
  "practice-strings": "hsl(var(--success))",
  "practice-recursion": "hsl(var(--warning))",
  "practice-dp": "hsl(var(--info))",
  "practice-graphs": "hsl(var(--heap))",
  "practice-trees": "hsl(var(--primary))",
  "practice-greedy": "hsl(var(--accent))",
  "practice-stack-queue": "hsl(var(--primary))",
  "practice-math": "hsl(var(--success))",
};

export interface TopicViewProps {
  topicId: string;
  detectedMode: TopicMode;
  topic: Topic;
  content: ContentSection[];
  prevTopic: Topic | null;
  nextTopic: Topic | null;
}

export function TopicView({
  topicId,
  detectedMode,
  topic,
  content,
  prevTopic,
  nextTopic,
}: TopicViewProps) {
  const { currentMode, setMode } = useMode();
  const [tocOpen, setTocOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>(content[0]?.id ?? "");
  const { contentWidth, fontSize, increaseFontSize, decreaseFontSize, theme, toggleTheme } = useSettings();

  // Switch mode if navigating to a topic from a different mode
  useEffect(() => {
    if (detectedMode !== currentMode.id) {
      setMode(detectedMode);
    }
  }, [detectedMode, currentMode.id, setMode]);

  const readingTimeMinutes = useMemo(() => {
    if (!content.length) return 5;
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

  const scrollToSection = useCallback((sectionId: string, updateHash = true) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(sectionId);
    if (updateHash && typeof window !== "undefined") {
      const nextUrl = `${window.location.pathname}${window.location.search}#${sectionId}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        window.setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveSection(hash);
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (content[0]) setActiveSection(content[0].id);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [topicId, content]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
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
    content.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [content]);

  const color = topicColorVars[topic.id] || "hsl(var(--primary))";
  const modeLabel = detectedMode === "lang" ? "Java" : detectedMode === "practice" ? "Practice" : "Data Structure";

  return (
    <div className="flex min-h-screen relative bg-background selection:bg-primary/25" ref={mainRef}>
      <div className="flex-1 min-w-0">
        <motion.div
          className="relative overflow-hidden border-b border-border/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 py-10 md:py-14">
            <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight size={12} className="opacity-40" />
              <span style={{ color }}>{topic.title}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-[0.875rem] text-xl font-semibold border shrink-0"
                style={{ background: `${color}10`, borderColor: `${color}25`, color }}
              >
                {topic.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
                  {topic.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="px-2.5 py-1 text-xs font-medium border border-border">
                      {modeLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {content.length} sections · Comprehensive guide
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} className="opacity-60" />
                      ~{readingTimeMinutes} min read
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-lg border border-obsidian-border bg-obsidian-pane p-0.5">
                      <AppTooltip content="Smaller text">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={decreaseFontSize}
                          disabled={fontSize === "sm"}
                          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground [&_svg]:size-[13px]"
                          aria-label="Decrease font size"
                        >
                          <ZoomOut size={13} />
                        </Button>
                      </AppTooltip>
                      <span className="text-[11px] font-mono font-medium px-1.5 text-muted-foreground select-none">
                        {fontSize.toUpperCase()}
                      </span>
                      <AppTooltip content="Larger text">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={increaseFontSize}
                          disabled={fontSize === "xl"}
                          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground [&_svg]:size-[13px]"
                          aria-label="Increase font size"
                        >
                          <ZoomIn size={13} />
                        </Button>
                      </AppTooltip>
                    </div>

                    <AppTooltip content={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="h-8 w-8 rounded-lg bg-card/70 backdrop-blur-sm text-muted-foreground hover:text-foreground shadow-sm [&_svg]:size-[13px]"
                        aria-label="Toggle theme"
                      >
                        {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                      </Button>
                    </AppTooltip>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-7 flex-wrap">
              {content.map((s) => (
                <AppTooltip key={s.id} content={s.title}>
                  <Button
                    type="button"
                    variant="bare"
                    size="bare"
                    className="h-1 rounded-full transition-all duration-300 cursor-pointer"
                    style={{
                      background: activeSection === s.id ? color : "hsl(var(--muted))",
                      width: activeSection === s.id ? "32px" : "8px",
                    }}
                    onClick={() => scrollToSection(s.id)}
                    aria-label={s.title}
                  />
                </AppTooltip>
              ))}
            </div>
          </div>
        </motion.div>

        <div
          className="px-4 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16 w-full mx-auto"
          style={{ maxWidth: `${Math.min(contentWidth || 1080, 1140)}px` }}
        >
          <div className="space-y-10 md:space-y-15 lg:space-y-20">
            {content.map((section) => (
              <ContentRenderer key={section.id} section={section} isPractice={detectedMode === "practice"} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-16 pt-8 border-t border-border">
            {prevTopic ? (
              <motion.div whileHover={{ x: -3 }}>
                <Link href={`/${prevTopic.id}`} className="block">
                  <Card className="flex items-center gap-3 p-4 rounded-2xl transition-colors hover:bg-muted">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <ChevronLeft size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-muted-foreground">Previous</div>
                      <div className="text-sm font-semibold text-foreground">{prevTopic.title}</div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ) : (
              <div />
            )}

            {nextTopic && (
              <motion.div whileHover={{ x: 3 }}>
                <Link href={`/${nextTopic.id}`} className="block">
                  <Card className="flex items-center gap-3 p-4 rounded-2xl text-right transition-colors hover:bg-muted group">
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-primary">Next</div>
                      <div className="text-sm font-semibold text-foreground">{nextTopic.title}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Right TOC */}
      <aside className="hidden xl:flex flex-col w-56 flex-shrink-0 border-l border-border sticky top-14 h-[calc(100vh-3.5rem)] py-8 px-5">
        <div className="text-[13px] font-medium mb-3 text-muted-foreground">
          On this page
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <nav className="space-y-0.5 pr-2">
            {content.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant="bare"
                  size="bare"
                  onClick={() => scrollToSection(s.id)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors hover:text-foreground whitespace-normal"
                  style={{
                    background: isActive ? `${color}10` : "transparent",
                    color: isActive ? color : "hsl(var(--muted-foreground))",
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                  }}
                >
                  {s.title}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile TOC */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTocOpen(!tocOpen)}
        className="xl:hidden fixed bottom-5 right-5 z-50 h-9 px-3.5 rounded-lg text-xs font-medium shadow-lg bg-card border-border text-foreground [&_svg]:size-3.5"
      >
        {tocOpen ? <X size={14} /> : <List size={14} />}
        {tocOpen ? "Close" : "Contents"}
      </Button>

      <AnimatePresence>
        {tocOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="xl:hidden fixed bottom-16 right-5 z-50 w-72"
          >
            <Card className="p-4 shadow-xl">
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                Sections
              </div>
              <ScrollArea className="max-h-72">
                <nav className="space-y-0.5 pr-2">
                  {content.map((s) => (
                    <Button
                      key={s.id}
                      type="button"
                      variant="bare"
                      size="bare"
                      onClick={() => {
                        scrollToSection(s.id);
                        setTocOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors hover:bg-muted whitespace-normal"
                      style={{ color: activeSection === s.id ? color : "hsl(var(--foreground))" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: activeSection === s.id ? color : "hsl(var(--border))" }}
                      />
                      {s.title}
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TopicView;
