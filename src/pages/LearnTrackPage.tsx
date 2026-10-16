import { useParams, Link, useNavigate } from "react-router-dom";
import {
  PageContainer,
  PageHeader,
  DifficultyBadge,
  StatTile,
} from "@/components/layout/PagePrimitives";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Code2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackModule {
  id: string;
  title: string;
  description: string;
  subtopics: Array<{ id: string; title: string }>;
}

export default function LearnTrackPage() {
  const { track = "dsa" } = useParams<{ track: string }>();
  const navigate = useNavigate();

  const isJava = track === "java";
  const isSpring = track === "spring-boot";
  const isSysDesign = track === "system-design";

  const trackTitle = isJava
    ? "Core Java & JVM Internals"
    : isSpring
      ? "Spring Boot & Backend Engineering"
      : isSysDesign
        ? "System Design & Distributed Systems"
        : "Data Structures & Algorithms";

  const trackDescription = isJava
    ? "Master the JVM memory model, garbage collection, thread pools, streams, and collection internals."
    : isSpring
      ? "End-to-end backend development with Spring Boot: IoC, MVC, Security, and JPA."
      : isSysDesign
        ? "Architect scalable, fault-tolerant distributed systems and understand architectural trade-offs."
        : "Fundamental patterns: arrays, two pointers, dynamic programming, graphs, trees, and bit manipulation.";

  const modules: TrackModule[] = isJava
    ? javaTopics
    : isSpring
      ? [
          {
            id: "spring-core",
            title: "Spring Core & Inversion of Control",
            description: "ApplicationContext, Bean lifecycle, dependency injection, and component scanning.",
            subtopics: [
              { id: "ioc-basics", title: "Inversion of Control & Dependency Injection" },
              { id: "bean-scopes", title: "Bean Scopes: Singleton vs Prototype" },
              { id: "bean-lifecycle", title: "Bean Initialization & Destruction Callbacks" },
            ],
          },
          {
            id: "spring-boot-mvc",
            title: "REST APIs & Spring MVC",
            description: "Building production REST services with validation, exception handlers, and DTOs.",
            subtopics: [
              { id: "rest-controllers", title: "RestController, RequestMapping & PathVariables" },
              { id: "global-exception", title: "ControllerAdvice & Standardized API Errors" },
            ],
          },
        ]
      : isSysDesign
        ? [
            {
              id: "fundamentals",
              title: "Distributed Systems Core Concepts",
              description: "CAP theorem, PACELC, latency vs throughput, and horizontal scaling.",
              subtopics: [
                { id: "cap-pacelc", title: "CAP Theorem vs PACELC in Distributed DBs" },
                { id: "load-balancing", title: "Consistent Hashing & Dynamic Load Balancing" },
              ],
            },
          ]
        : topics;

  const totalLessons = modules.reduce((acc, m) => acc + (m.subtopics?.length || 1), 0);
  const firstLessonId = modules[0]?.id || "arrays";

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader
        eyebrow={
          <Link to="/learn" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={11} /> All Tracks
          </Link>
        }
        title={trackTitle}
        description={trackDescription}
        actions={
          <Link
            to={isJava ? `/${firstLessonId}` : isSpring ? "/interview/java/spring-boot" : `/${firstLessonId}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Start first lesson <ArrowRight size={13} />
          </Link>
        }
      />

      <PageContainer className="mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatTile label="Track Modules" value={modules.length} hint="Curated units" />
          <StatTile label="Total Lessons" value={totalLessons} hint="Theory & code" />
          <StatTile label="Estimated Time" value="~30 hrs" hint="At your own pace" />
          <StatTile label="Difficulty" value="Standard" hint="Interview level" />
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Syllabus & Modules</h2>
            <span className="text-xs text-muted-foreground font-mono">{modules.length} modules</span>
          </div>

          <div className="space-y-3">
            {modules.map((mod, index) => (
              <div
                key={mod.id}
                className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-border/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                      {mod.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/${mod.id}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/80 bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    Open module <ChevronRight size={12} />
                  </Link>
                </div>

                {mod.subtopics && mod.subtopics.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {mod.subtopics.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/${mod.id}`}
                          className="flex items-center gap-2 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group"
                        >
                          <Circle size={10} className="shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                          <span className="truncate">{sub.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
