import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code2,
  BrainCircuit,
  Target,
  ArrowRight,
  Sparkles,
  Coffee,
  Play,
  Zap,
  CheckCircle2,
  Circle,
  Calendar,
  Flame,
  X,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Timer,
  Terminal,
  Compass,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatTile, DifficultyBadge, StatusDot } from "@/components/layout/PagePrimitives";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { QuizSection } from "@/components/quiz/QuizSection";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_KEY = "algoguru:onboarding-dismissed";

interface TrackDef {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: typeof Code2;
  href: string;
  itemCount: string;
  badgeText: string;
  colorClass: string;
}

const TRACKS: TrackDef[] = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    category: "Coding Patterns",
    description: "Pattern-oriented problem solving across 14 fundamental interview patterns with Java implementations.",
    icon: Target,
    href: "/practice",
    itemCount: "500+ problems",
    badgeText: "Most popular",
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "java",
    title: "Core Java & JVM Internals",
    category: "Language Mastery",
    description: "Memory model, garbage collection, concurrency utilities, reflection, and modern Java 17/21 patterns.",
    icon: Coffee,
    href: "/learn/java",
    itemCount: "9 core modules",
    badgeText: "Interview essential",
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "spring-boot",
    title: "Spring Boot & Microservices",
    category: "Backend Systems",
    description: "Transaction management, Spring Security, JPA/Hibernate performance, and distributed microservice design.",
    icon: Layers,
    href: "/learn/spring-boot",
    itemCount: "60+ deep Q&A",
    badgeText: "Backend track",
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "system-design",
    title: "System Design & Architecture",
    category: "Scale & Reliability",
    description: "Distributed caching, rate limiting, event-driven pipelines, CAP trade-offs, and database sharding.",
    icon: BrainCircuit,
    href: "/interview/java/system-design",
    itemCount: "12 architectures",
    badgeText: "L5/L6 senior",
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "mock-interview",
    title: "Mock Technical Interview",
    category: "Simulation",
    description: "Timed live coding simulation (DSA, System Design, Java) with evaluation rubrics and debrief scorecards.",
    icon: Timer,
    href: "/interview/mock",
    itemCount: "3 formats",
    badgeText: "Simulation",
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [heatmapMode, setHeatmapMode] = useState<"website" | "leetcode" | "codechef">("website");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadStats() {
      try {
        const { count, error } = await supabase
          .from("practice_problem_user_state")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("is_completed", true);
        if (!error && count !== null && !cancelled) {
          setSolvedCount(count);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {}
  };

  const displayName = useMemo(() => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "Engineer";
  }, [user]);

  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* ── Personal Workspace Hero Header ── */}
      <section className="border-b border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                <Calendar size={13} className="text-muted-foreground" />
                <span>{todayDateStr}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 text-primary font-semibold">
                  <Flame size={13} className="text-amber-500 fill-amber-500" />
                  Active Streak: 3 days
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Ready for today's session? Continue your practice or jump into the daily challenge.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/problem-solver"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-control text-xs font-semibold bg-primary text-primary-foreground hover:bg-accent-hover shadow-elev-1 transition-all active:scale-[0.98]"
              >
                <Zap size={14} />
                <span>Daily Challenge</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/playground"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <Play size={13} className="text-muted-foreground" />
                <span>Playground</span>
              </Link>
            </div>
          </div>

          {/* ── First-Run Onboarding Checklist ── */}
          {!onboardingDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-surface border border-primary/20 bg-primary/[0.03] p-4 sm:p-5 relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles size={13} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Getting Started Checklist
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recommended steps to configure your engineering workspace.
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                  aria-label="Dismiss checklist"
                >
                  <X size={13} />
                  <span>Dismiss</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <Link
                  to="/practice"
                  className="flex items-center gap-3 p-3 rounded-control border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40 transition-colors group"
                >
                  <Circle size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Solve your first DSA problem</p>
                    <p className="text-[11px] text-muted-foreground">Pick from 500+ pattern questions</p>
                  </div>
                </Link>

                <Link
                  to="/learn"
                  className="flex items-center gap-3 p-3 rounded-control border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40 transition-colors group"
                >
                  <Circle size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Explore track syllabi</p>
                    <p className="text-[11px] text-muted-foreground">Java, Spring Boot, System Design</p>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 p-3 rounded-control border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40 transition-colors group"
                >
                  <Circle size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Configure editor & daily goal</p>
                    <p className="text-[11px] text-muted-foreground">Monaco tab size, theme, targets</p>
                  </div>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Key Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <StatTile
              label="Problems Solved"
              value={`${solvedCount}`}
              hint="Target: 75 minimum"
              trend={solvedCount > 0 ? "up" : "neutral"}
              trendLabel={solvedCount > 0 ? "Active progress" : "Start solving"}
            />
            <StatTile
              label="Curated Questions"
              value="500+"
              hint="14 pattern categories"
            />
            <StatTile
              label="Learning Modules"
              value="4"
              hint="DSA · Java · Spring · SysDesign"
            />
            <StatTile
              label="Mock Interview Prep"
              value="3"
              hint="Timed simulations active"
            />
          </div>
        </div>
      </section>

      {/* ── Main Dashboard Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ── Today's Focus Row ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Focus
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Handpicked problem and recommended next lesson for your queue
              </p>
            </div>
            <Link
              to="/practice"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View all problems</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily Challenge Card */}
            <div className="rounded-surface border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-line-strong transition-colors shadow-elev-0">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Daily Challenge
                  </span>
                  <DifficultyBadge difficulty="Medium" />
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Longest Substring Without Repeating Characters
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Sliding Window pattern with HashSet or HashMap tracking last seen indices in O(N) time.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">LeetCode #3</span>
                <Link
                  to="/problem-solver"
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-control text-xs font-medium bg-primary text-primary-foreground hover:bg-accent-hover transition-colors"
                >
                  <span>Solve</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Next Track Lesson Card */}
            <div className="rounded-surface border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-line-strong transition-colors shadow-elev-0">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Recommended Lesson
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">Spring Boot</span>
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  @Transactional Propagation & Rollback Pitfalls
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Master REQUIRED vs REQUIRES_NEW, checked exception rollback rules, and self-invocation proxy bypass.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Theory + Code</span>
                <Link
                  to="/learn/spring-boot"
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-control text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <span>Resume</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Mock Interview Card */}
            <div className="rounded-surface border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-line-strong transition-colors shadow-elev-0">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Simulation
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">45 Min</span>
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  DSA Technical Interview Simulation
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Strict exam timer, Socratic hints without spoilers, and competency evaluation scorecard.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Live Rubric</span>
                <Link
                  to="/interview/mock"
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-control text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <span>Start Mock</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Core Learning Tracks (Compact Engineering Rows) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Core Tracks
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Structured curriculums designed for senior software engineering interviews
              </p>
            </div>
            <Link
              to="/learn"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Browse full syllabus</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="rounded-surface border border-border bg-card divide-y divide-border overflow-hidden shadow-elev-0">
            {TRACKS.map((track) => {
              const IconComp = track.icon;
              return (
                <div
                  key={track.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-control flex items-center justify-center shrink-0 border border-border bg-muted/60 text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                      <IconComp size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {track.title}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border/60 bg-muted/50 text-muted-foreground">
                          {track.category}
                        </span>
                        <span className="text-[10px] font-semibold text-primary">
                          {track.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xl">
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <span className="text-xs font-mono text-muted-foreground">
                      {track.itemCount}
                    </span>
                    <Link
                      to={track.href}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors group-hover:border-line-strong active:scale-[0.98]"
                    >
                      <span>Explore</span>
                      <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Activity Heatmap ── */}
        <section className="rounded-surface border border-border bg-card p-5 sm:p-6 shadow-elev-0">
          <ActivityHeatmap
            dataMode={heatmapMode}
            onModeChange={setHeatmapMode}
          />
        </section>

        {/* ── Quiz Assessment Section ── */}
        <QuizSection />
      </div>
    </div>
  );
}
