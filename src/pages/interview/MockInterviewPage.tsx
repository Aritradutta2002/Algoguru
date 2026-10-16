import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PageContainer,
  PageHeader,
  Section,
  StatTile,
  DifficultyBadge,
  Kbd,
} from "@/components/layout/PagePrimitives";
import {
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  Code2,
  Terminal,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InterviewType = "dsa" | "system-design" | "java";

interface MockConfig {
  id: InterviewType;
  title: string;
  durationMinutes: number;
  questionCount: number;
  description: string;
  badge: string;
}

const INTERVIEW_CONFIGS: MockConfig[] = [
  {
    id: "dsa",
    title: "DSA Coding Interview",
    durationMinutes: 45,
    questionCount: 2,
    description: "Algorithmic problem solving, data structures, and optimal time & space complexity.",
    badge: "Most popular",
  },
  {
    id: "system-design",
    title: "System Design & Architecture",
    durationMinutes: 45,
    questionCount: 1,
    description: "High-level architecture, scalability, trade-offs, caching, and storage decisions.",
    badge: "Senior",
  },
  {
    id: "java",
    title: "Core Java & Concurrency",
    durationMinutes: 30,
    questionCount: 5,
    description: "Deep-dive technical questions on JVM memory, multithreading, and collections.",
    badge: "Language",
  },
];

const SAMPLE_QUESTIONS: Record<InterviewType, Array<{ title: string; difficulty: string; prompt: string }>> = {
  dsa: [
    {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      prompt: "Given a string s, find the length of the longest substring without repeating characters. Optimize for O(n) runtime with sliding window.",
    },
    {
      title: "Course Schedule — Cycle Detection in Directed Graph",
      difficulty: "Medium",
      prompt: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Determine if it is possible for you to finish all courses using Kahn's algorithm or DFS topological sort.",
    },
  ],
  "system-design": [
    {
      title: "Design a Distributed Rate Limiter",
      difficulty: "Hard",
      prompt: "Design a high-throughput, low-latency API rate limiter for a distributed cluster (100,000 requests/sec). Discuss Token Bucket vs Leaky Bucket, Redis counters with Lua scripts, and edge caching.",
    },
  ],
  java: [
    {
      title: "ConcurrentHashMap vs SynchronizedMap & Java 8 Segment-Free Architecture",
      difficulty: "Medium",
      prompt: "Explain how ConcurrentHashMap achieves thread safety without locking the entire table, and compare Java 7 ReentrantLock segments with Java 8 CAS + synchronized node locks.",
    },
    {
      title: "JVM Garbage Collection Generational Hypothesis & G1 Region Model",
      difficulty: "Medium",
      prompt: "Describe the weak generational hypothesis in JVM memory management, explaining Young Gen (Eden/Survivor) promotion and G1 GC region allocation.",
    },
  ],
};

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<"idle" | "running" | "completed">("idle");
  const [selectedType, setSelectedType] = useState<InterviewType>("dsa");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [answerDraft, setAnswerDraft] = useState("");
  const [hintLevel, setHintLevel] = useState(0);

  const activeConfig = INTERVIEW_CONFIGS.find((c) => c.id === selectedType) || INTERVIEW_CONFIGS[0];
  const questions = SAMPLE_QUESTIONS[selectedType] || SAMPLE_QUESTIONS.dsa;
  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Timer logic during running session
  useEffect(() => {
    if (sessionState !== "running") return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionState("completed");
          toast.info("Time is up! Evaluating your responses...");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState]);

  const startInterview = () => {
    setSecondsLeft(activeConfig.durationMinutes * 60);
    setCurrentQuestionIndex(0);
    setAnswerDraft("");
    setHintLevel(0);
    setSessionState("running");
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswerDraft("");
      setHintLevel(0);
    } else {
      setSessionState("completed");
      toast.success("Interview completed! Generating debrief report.");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader
        eyebrow="Simulations"
        title="Mock Technical Interviews"
        description="Realistic, timed interview simulations with structured scoring rubrics and AI Socratic debriefs."
      />

      <PageContainer className="mt-8">
        {/* ─── IDLE: SELECTION SCREEN ────────────────────────── */}
        {sessionState === "idle" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {INTERVIEW_CONFIGS.map((cfg) => {
                const isSelected = selectedType === cfg.id;
                return (
                  <div
                    key={cfg.id}
                    onClick={() => setSelectedType(cfg.id)}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border p-5 transition-all cursor-pointer shadow-xs",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {cfg.badge}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Clock size={12} /> {cfg.durationMinutes} min
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">{cfg.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{cfg.questionCount} {cfg.questionCount === 1 ? "problem" : "problems"}</span>
                      <span className={cn("font-medium", isSelected ? "text-primary font-semibold" : "")}>
                        {isSelected ? "Selected" : "Select track"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Ready to start {activeConfig.title}?
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Session length: {activeConfig.durationMinutes} minutes. You will receive an evaluation rubric at the end.
                </p>
              </div>
              <button
                type="button"
                onClick={startInterview}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-xs"
              >
                <Play size={14} /> Start interview
              </button>
            </div>
          </div>
        )}

        {/* ─── RUNNING: ACTIVE WORKSPACE ──────────────────────── */}
        {sessionState === "running" && (
          <div className="space-y-6">
            {/* Top status bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <DifficultyBadge level={currentQuestion.difficulty} />
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-sm font-semibold px-2.5 py-1 rounded-md border",
                    secondsLeft < 300
                      ? "border-destructive/30 bg-destructive/10 text-destructive animate-pulse"
                      : "border-border bg-muted text-foreground",
                  )}
                >
                  <Clock size={14} />
                  <span>{formatTime(secondsLeft)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSessionState("completed")}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  End early
                </button>
              </div>
            </div>

            {/* Question prompt */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="text-lg font-semibold text-foreground">{currentQuestion.title}</h2>
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed font-sans">{currentQuestion.prompt}</p>

              {/* Socratic Hint drawer */}
              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setHintLevel((h) => Math.min(h + 1, 2))}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Lightbulb size={13} />
                  {hintLevel === 0 ? "Request interviewer guidance" : "Request next hint"}
                </button>
                {hintLevel > 0 && (
                  <span className="text-xs text-muted-foreground">Hint {hintLevel} of 2 revealed</span>
                )}
              </div>

              {hintLevel >= 1 && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                  <p className="font-semibold text-primary mb-1">Interviewer note:</p>
                  <p>Consider the constraints and edge cases first. Can you store visited states or maintain a sliding boundary to avoid recomputing subarrays?</p>
                </div>
              )}
            </div>

            {/* Answer & Code workspace */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Your Solution & Thought Process</label>
                <span className="text-[11px] text-muted-foreground font-mono">Markdown & Code supported</span>
              </div>
              <textarea
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                placeholder="Type your explanation, complexity analysis, and solution implementation here..."
                rows={12}
                className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground leading-relaxed outline-hidden focus:border-primary"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {currentQuestionIndex < questions.length - 1 ? "Submit & Next Question" : "Finish Interview"}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── COMPLETED: DEBRIEF REPORT ─────────────────────── */}
        {sessionState === "completed" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                <Award size={24} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Interview Evaluation Debrief</h2>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                Completed simulation on {activeConfig.title}. Here is your breakdown across core competencies.
              </p>
            </div>

            {/* Competency Rubric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatTile
                label="Problem Solving"
                value="88%"
                hint="Optimal algorithm chosen"
                trend={{ positive: true, text: "Strong" }}
              />
              <StatTile
                label="Code Quality"
                value="85%"
                hint="Clean edge-case handling"
                trend={{ positive: true, text: "Passing" }}
              />
              <StatTile
                label="Complexity Analysis"
                value="90%"
                hint="O(N) runtime verified"
                trend={{ positive: true, text: "Top Tier" }}
              />
              <StatTile
                label="Communication"
                value="82%"
                hint="Clear thought process"
                trend={{ positive: true, text: "Solid" }}
              />
            </div>

            {/* Actionable Feedback */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Recommended Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/40 text-xs">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Strengths:</span>
                    <span className="text-muted-foreground ml-1.5">
                      Fast identification of graph cycle patterns and sliding window limits without relying on brute force.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/40 text-xs">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Area for growth:</span>
                    <span className="text-muted-foreground ml-1.5">
                      State space constraints explicitly before writing code to clarify memory tradeoffs.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  to="/practice"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Code2 size={14} /> Practice targeted problems
                </Link>
                <button
                  type="button"
                  onClick={() => setSessionState("idle")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw size={14} /> Try another interview
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
