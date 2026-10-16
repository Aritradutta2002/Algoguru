import { Link } from "react-router-dom";
import {
  PageContainer,
  PageHeader,
  StatTile,
  DifficultyBadge,
} from "@/components/layout/PagePrimitives";
import {
  BookOpen,
  Code2,
  Coffee,
  Layers,
  Network,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Code2;
  description: string;
  topicCount: number;
  estimatedHours: number;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: Array<{ id: string; title: string }>;
}

export const TRACKS: Track[] = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Patterns & Complexities",
    icon: Code2,
    description: "Arrays, Two Pointers, Dynamic Programming, Graphs, Trees, and essential algorithmic patterns.",
    topicCount: topics.length,
    estimatedHours: 40,
    difficulty: "Medium",
    topics: topics.slice(0, 6).map((t) => ({ id: t.id, title: t.title })),
  },
  {
    id: "java",
    title: "Core Java & JVM Internals",
    subtitle: "Language & Architecture",
    icon: Coffee,
    description: "Deep dive into memory layout, Garbage Collection, Multithreading, Streams, and the Java Collection Framework.",
    topicCount: javaTopics.length,
    estimatedHours: 30,
    difficulty: "Medium",
    topics: javaTopics.slice(0, 6).map((t) => ({ id: t.id, title: t.title })),
  },
  {
    id: "spring-boot",
    title: "Spring Boot & Backend Engineering",
    subtitle: "Enterprise Microservices",
    icon: Layers,
    description: "Dependency injection, Spring MVC, REST architecture, Spring Data JPA, caching, and security.",
    topicCount: 16,
    estimatedHours: 25,
    difficulty: "Medium",
    topics: [
      { id: "core-spring", title: "Inversion of Control & Bean Lifecycle" },
      { id: "spring-mvc", title: "RESTful Controllers & Request Mapping" },
      { id: "spring-data", title: "JPA Repositories & Transaction Management" },
      { id: "spring-security", title: "JWT & Spring Security Filter Chains" },
    ],
  },
  {
    id: "system-design",
    title: "System Design & Distributed Systems",
    subtitle: "Scalability at Scale",
    icon: Network,
    description: "High-level architecture, load balancing, Redis caching, message queues, and database sharding.",
    topicCount: 12,
    estimatedHours: 20,
    difficulty: "Hard",
    topics: [
      { id: "cap-theorem", title: "CAP Theorem & PACELC Trade-offs" },
      { id: "load-balancers", title: "Consistent Hashing & Load Balancers" },
      { id: "caching-strategies", title: "Distributed Caching (Redis/Memcached)" },
      { id: "rate-limiting", title: "Token Bucket & Distributed Rate Limiting" },
    ],
  },
];

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader
        eyebrow="Curriculum"
        title="Learning Tracks"
        description="Handcrafted engineering curricula structured by the patterns and principles tested in technical interviews."
      />

      <PageContainer className="mt-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatTile
            label="Total Tracks"
            value="4"
            hint="Full curricula"
          />
          <StatTile
            label="Comprehensive Lessons"
            value="180+"
            hint="Theory + Diagrams"
          />
          <StatTile
            label="Practice Exercises"
            value="240+"
            hint="Integrated editor"
          />
          <StatTile
            label="Architecture Notes"
            value="48+"
            hint="Real system trade-offs"
          />
        </div>

        {/* Tracks List */}
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-foreground">Available Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.id}
                  className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between transition-colors hover:border-border/80"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {track.subtitle}
                          </span>
                          <h3 className="text-base font-semibold text-foreground leading-tight">
                            {track.title}
                          </h3>
                        </div>
                      </div>
                      <DifficultyBadge level={track.difficulty} />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                      {track.description}
                    </p>

                    {/* Syllabus Preview */}
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-2">Syllabus Highlights:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {track.topics.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-foreground font-mono"
                          >
                            {t.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock size={12} /> ~{track.estimatedHours} hours · {track.topicCount} modules
                    </span>
                    <Link
                      to={`/learn/${track.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Explore track <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
