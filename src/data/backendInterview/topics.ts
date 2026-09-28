/**
 * Ordered topic registry for the Backend / Spring Boot interview track.
 *
 * Order here is the order rendered on `/interview/java/spring-boot/questions`
 * and the order of the topic cards on the hub. Question numbers ("Question N")
 * are derived from position in the flat index, so this order is significant.
 */

export interface BackendTopicDefinition {
  /** Stable topic id; also the `topic` value used by chunk files. */
  id: string;
  /** Display title. */
  title: string;
  /** Short display title used in chips and breadcrumbs. */
  shortTitle: string;
  /** Emoji shown in topic chips. */
  icon: string;
  /** One-line description shown on the hub cards. */
  blurb: string;
  /** What an interviewer is really probing with this whole area. */
  interviewerIntent: string;
  /** Design-token colour used for the topic accent. */
  accent: string;
}

export const BACKEND_TOPICS: BackendTopicDefinition[] = [
  {
    id: "java-annotations",
    title: "Java Annotations — Theory & Internals",
    shortTitle: "Java Annotations",
    icon: "🏷️",
    blurb:
      "What an annotation really is, retention policies, targets, meta-annotations, repeatable & type annotations, and how frameworks read them at runtime.",
    interviewerIntent:
      "Can you explain the machinery that every framework you use is built on, not just the annotations you type?",
    accent: "hsl(var(--primary))",
  },
  {
    id: "spring-annotations",
    title: "Spring & Spring Boot Annotations",
    shortTitle: "Spring Annotations",
    icon: "🌱",
    blurb:
      "@Component vs @Bean, stereotypes, @Transactional proxying, @Qualifier resolution, @ConditionalOnX, config binding and the full @SpringBootApplication expansion.",
    interviewerIntent:
      "Do you know what Spring actually does when it sees each annotation, and where the proxy boundaries are?",
    accent: "hsl(var(--success))",
  },
  {
    id: "spring-boot-core",
    title: "Spring Boot Internals & Auto-Configuration",
    shortTitle: "Boot Internals",
    icon: "🚀",
    blurb:
      "Startup sequence, auto-configuration resolution, starters, profiles, property precedence, embedded servers, Actuator and graceful shutdown.",
    interviewerIntent:
      "Can you debug a Boot app that behaves differently in prod, and explain why a bean did or did not get created?",
    accent: "hsl(var(--info))",
  },
  {
    id: "collections",
    title: "Java Collections Framework",
    shortTitle: "Collections",
    icon: "📚",
    blurb:
      "The full hierarchy, List/Set/Map/Queue implementations, fail-fast vs fail-safe, comparators, immutability, and how to pick the right structure under load.",
    interviewerIntent:
      "Can you justify a data-structure choice with complexity, memory and concurrency arguments?",
    accent: "hsl(var(--warning))",
  },
  {
    id: "hashmap-internals",
    title: "HashMap — Complete Internal Working",
    shortTitle: "HashMap Internals",
    icon: "🗺️",
    blurb:
      "Buckets, hash spreading, collisions, treeification, resizing, load factor, the equals/hashCode contract, and why HashMap breaks under concurrency.",
    interviewerIntent:
      "The single most-asked deep-dive in Java interviews — they want the data structure, not the API.",
    accent: "hsl(var(--destructive))",
  },
  {
    id: "multithreading",
    title: "Multithreading & Concurrency",
    shortTitle: "Multithreading",
    icon: "🧵",
    blurb:
      "Thread lifecycle, the Java Memory Model, synchronized vs Lock, volatile, executors, CompletableFuture, atomics, deadlock and virtual threads.",
    interviewerIntent:
      "Can you reason about visibility and atomicity — not just call start() on a Thread?",
    accent: "hsl(var(--accent))",
  },
  {
    id: "spring-security",
    title: "Spring Security — Complete Theory",
    shortTitle: "Spring Security",
    icon: "🔐",
    blurb:
      "The filter chain, AuthenticationManager, providers, SecurityContextHolder, authorization, CSRF, CORS, method security and the Boot 3 lambda DSL.",
    interviewerIntent:
      "Can you draw the request path through the filter chain and say exactly where your code plugs in?",
    accent: "hsl(var(--primary))",
  },
  {
    id: "jwt",
    title: "JWT, Stateless Auth & OAuth2",
    shortTitle: "JWT & OAuth2",
    icon: "🎫",
    blurb:
      "JWS structure, signing algorithms, claims, refresh-token rotation, revocation strategies, storage, and the JWT filter you will be asked to write on a whiteboard.",
    interviewerIntent:
      "Do you understand the security trade-offs, or did you copy a tutorial filter into production?",
    accent: "hsl(var(--info))",
  },
];

export const BACKEND_TOPIC_BY_ID: Record<string, BackendTopicDefinition> =
  Object.fromEntries(BACKEND_TOPICS.map((topic) => [topic.id, topic]));
