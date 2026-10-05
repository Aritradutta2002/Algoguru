/**
 * Global search index for AlgoGuru.
 *
 * Every piece of searchable content lives in memory (static TypeScript banks in
 * `src/data`) apart from the user's own notes, which come from Supabase. This
 * module turns all of it into one flat, ranked list of `SearchDoc`s so the
 * command palette can filter across content types with a single scorer.
 */
import { topics } from "@/data/topics";
import { javaTopics } from "@/data/javaTopics";
import { practiceTopics } from "@/data/practiceTopics";
import { BACKEND_TOPICS } from "@/data/backendInterview/topics";
import { ANNOTATION_CATALOGUE } from "@/data/backendInterview/annotations";
import { BACKEND_PRACTICE_PROBLEMS } from "@/data/backendInterview/practiceProblems";
import { systemDesignTopics } from "@/data/systemDesignInterviewData";
import { roadmaps } from "@/data/roadmaps";
import { CP_TEMPLATES } from "@/data/cpTemplates";
import { ALL_SNIPPETS } from "@/data/javaSnippets";
import { practiceData } from "@/data/practiceData";
import { backendQuestionIndex } from "@/lib/backendQuestionIndex";
import { coreJavaQuestionIndex } from "@/lib/coreJavaQuestionIndex";
import { pythonQuestionIndex } from "@/lib/pythonQuestionIndex";
import { cppQuestionIndex } from "@/lib/cppQuestionIndex";

import { arraysContent } from "@/data/arraysContent";
import { stackQueueContent } from "@/data/stackQueueContent";
import { recursionContent } from "@/data/recursionContent";
import { backtrackingContent } from "@/data/backtrackingContent";
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

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

export type SearchTab =
  | "all"
  | "topics"
  | "problems"
  | "interviews"
  | "roadmaps"
  | "notes"
  | "templates"
  | "tools";

/** Every non-"all" tab maps 1:1 onto a `SearchDoc["category"]`. */
export type SearchCategory = Exclude<SearchTab, "all">;

export const SEARCH_TABS: ReadonlyArray<{ id: SearchTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "topics", label: "Topics" },
  { id: "problems", label: "Problems" },
  { id: "interviews", label: "Interviews" },
  { id: "roadmaps", label: "Roadmaps" },
  { id: "notes", label: "Notes" },
  { id: "templates", label: "Templates" },
  { id: "tools", label: "Tools" },
];

export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  topics: "Topics",
  problems: "Problems & Algorithms",
  interviews: "Interview Questions",
  roadmaps: "Roadmaps",
  notes: "My Notes",
  templates: "Templates & Snippets",
  tools: "Pages & Tools",
};

/** Tabs are rendered in this order inside the results list. */
const CATEGORY_ORDER: SearchCategory[] = [
  "topics",
  "problems",
  "interviews",
  "roadmaps",
  "notes",
  "templates",
  "tools",
];

/** Below this length we show Quick Access + the empty state instead of results. */
export const MIN_QUERY_LENGTH = 2;

/* -------------------------------------------------------------------------- */
/* Doc shape                                                                   */
/* -------------------------------------------------------------------------- */

export interface SearchDoc {
  /** Stable, unique across the whole index. */
  id: string;
  title: string;
  /** Second line in a result row. */
  subtitle: string;
  category: SearchCategory;
  /** In-app route to navigate to on select. */
  path: string;
  /** Emoji tile shown in the row / quick-access chip. */
  icon: string;
  difficulty?: string;
  /** Extra text folded into the searchable haystack (parents, tags, answers). */
  haystack: string;
}

export interface ScoredDoc extends SearchDoc {
  score: number;
}

/* -------------------------------------------------------------------------- */
/* Content maps                                                                */
/* -------------------------------------------------------------------------- */

const dsContentMap: Record<string, any[]> = {
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

const allContentMaps: Record<string, any[]> = {
  ...dsContentMap,
  ...javaContentMap,
  ...practiceContentMap,
};

/** Difficulty group headers ("Easy Problems") are structural, not content. */
const GROUP_HEADER = /^(easy|medium|hard|expert) problems$/i;

/* -------------------------------------------------------------------------- */
/* Path resolvers, also used to label the user's notes                         */
/* -------------------------------------------------------------------------- */

export const toProblemSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

interface NoteTarget {
  title: string;
  subtitle: string;
  path: string;
}

const noteTargets = new Map<string, NoteTarget>();

coreJavaQuestionIndex.forEach((entry) => {
  noteTargets.set(`core-java:${entry.question.id}`, {
    title: entry.question.question,
    subtitle: `Core Java — ${entry.topic.title}`,
    path: `/interview/java/core-java-qa/${entry.slug}`,
  });
});

cppQuestionIndex.forEach((entry) => {
  noteTargets.set(`core-java:cpp:${entry.question.id}`, {
    title: entry.question.question,
    subtitle: `C++ — ${entry.topic.title}`,
    path: `/interview/cpp/language-questions/${entry.slug}`,
  });
});

pythonQuestionIndex.forEach((entry) => {
  noteTargets.set(`core-java:py:${entry.question.id}`, {
    title: entry.question.question,
    subtitle: `Python — ${entry.topic.title}`,
    path: `/interview/python/language-questions/${entry.slug}`,
  });
});

backendQuestionIndex.forEach((entry) => {
  noteTargets.set(`core-java:backend:${entry.question.id}`, {
    title: entry.question.question,
    subtitle: `Spring Boot — ${entry.topic.shortTitle}`,
    path: `/interview/java/spring-boot/questions/${entry.slug}`,
  });
});

systemDesignTopics.forEach((topic) => {
  topic.questions.forEach((question) => {
    noteTargets.set(`system-design:${question.id}`, {
      title: question.question,
      subtitle: `System Design — ${topic.title}`,
      path: `/interview/java/system-design#${question.id}`,
    });
  });
});

practiceData.forEach((topic) => {
  topic.subtopics.forEach((subtopic) => {
    subtopic.problems.forEach((problem) => {
      noteTargets.set(`practice:${problem.id}`, {
        title: problem.title,
        subtitle: `Practice — ${topic.title}`,
        path: `/practice/solution/${problem.id}/${toProblemSlug(problem.title)}`,
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Index construction                                                          */
/* -------------------------------------------------------------------------- */

const buildStaticDocs = (): SearchDoc[] => {
  const docs: SearchDoc[] = [];
  const seen = new Set<string>();

  const push = (doc: SearchDoc) => {
    if (seen.has(doc.id)) return;
    seen.add(doc.id);
    docs.push(doc);
  };

  // --- DSA / Java / Practice topic pages + their subtopics -----------------
  [...topics, ...javaTopics, ...practiceTopics].forEach((topic) => {
    push({
      id: `topic:${topic.id}`,
      title: topic.title,
      subtitle: topic.description || `${topic.subtopics.length} sections`,
      category: "topics",
      path: `/${topic.id}`,
      icon: topic.icon,
      haystack: `${topic.title} ${topic.description ?? ""} ${(topic.category ?? "")}`,
    });
    topic.subtopics.forEach((subtopic) => {
      push({
        id: `subtopic:${topic.id}:${subtopic.id}`,
        title: subtopic.title,
        subtitle: `Section in ${topic.title}`,
        category: "topics",
        path: `/${topic.id}#${subtopic.id}`,
        icon: topic.icon,
        haystack: `${subtopic.title} ${topic.title}`,
      });
    });
  });

  // --- Content sections: algorithms, cheat sheets and practice problems ----
  Object.entries(allContentMaps).forEach(([topicId, sections]) => {
    const parentTopic = [...topics, ...javaTopics, ...practiceTopics].find((t) => t.id === topicId);
    sections.forEach((section: any) => {
      if (!section?.id || !section?.title) return;
      if (GROUP_HEADER.test(section.title.trim())) return;
      push({
        id: `section:${topicId}:${section.id}`,
        title: section.title,
        subtitle: parentTopic ? parentTopic.title : topicId,
        category: "problems",
        path: `/${topicId}#${section.id}`,
        icon: parentTopic?.icon ?? "📄",
        difficulty: section.difficulty,
        haystack: [
          section.title,
          section.timeComplexity ?? "",
          section.spaceComplexity ?? "",
          parentTopic?.title ?? topicId,
        ].join(" ").toLowerCase(),
      });
    });
  });

  // --- Interview question banks -------------------------------------------
  coreJavaQuestionIndex.forEach((entry) => {
    push({
      id: `q:core-java:${entry.question.id}`,
      title: entry.question.question,
      subtitle: `Core Java — ${entry.topic.title}`,
      category: "interviews",
      path: `/interview/java/core-java-qa/${entry.slug}`,
      icon: entry.topic.icon,
      difficulty: entry.meta?.difficulty,
      haystack: `${entry.question.question} ${entry.topic.title} ${(entry.meta?.tags ?? []).join(" ")}`.toLowerCase(),
    });
  });

  cppQuestionIndex.forEach((entry) => {
    push({
      id: `q:cpp:${entry.question.id}`,
      title: entry.question.question,
      subtitle: `C++ — ${entry.topic.title}`,
      category: "interviews",
      path: `/interview/cpp/language-questions/${entry.slug}`,
      icon: entry.topic.icon,
      difficulty: entry.meta?.difficulty,
      haystack: `${entry.question.question} ${entry.topic.title} ${(entry.meta?.tags ?? []).join(" ")}`.toLowerCase(),
    });
  });

  pythonQuestionIndex.forEach((entry) => {
    push({
      id: `q:python:${entry.question.id}`,
      title: entry.question.question,
      subtitle: `Python — ${entry.topic.title}`,
      category: "interviews",
      path: `/interview/python/language-questions/${entry.slug}`,
      icon: entry.topic.icon,
      difficulty: entry.meta?.difficulty,
      haystack: `${entry.question.question} ${entry.topic.title} ${(entry.meta?.tags ?? []).join(" ")}`.toLowerCase(),
    });
  });

  backendQuestionIndex.forEach((entry) => {
    push({
      id: `q:backend:${entry.question.id}`,
      title: entry.question.question,
      subtitle: `Spring Boot — ${entry.topic.shortTitle}`,
      category: "interviews",
      path: `/interview/java/spring-boot/questions/${entry.slug}`,
      icon: entry.topic.icon,
      difficulty: entry.meta?.difficulty,
      haystack: `${entry.question.question} ${entry.topic.title} ${(entry.meta?.tags ?? []).join(" ")}`.toLowerCase(),
    });
  });

  systemDesignTopics.forEach((topic) => {
    push({
      id: `topic:sd:${topic.id}`,
      title: topic.title,
      subtitle: `System Design — ${topic.questions.length} questions`,
      category: "topics",
      path: `/interview/java/system-design`,
      icon: topic.icon,
      haystack: `${topic.title} system design`,
    });
    topic.questions.forEach((question) => {
      push({
        id: `q:sd:${question.id}`,
        title: question.question,
        subtitle: `System Design — ${topic.title}`,
        category: "interviews",
        path: `/interview/java/system-design#${question.id}`,
        icon: topic.icon,
        haystack: `${question.question} ${topic.title}`.toLowerCase(),
      });
    });
  });

  // --- Backend interview track: hub, annotations, practice problems --------
  push({
    id: "hub:spring-boot",
    title: "Spring Boot Interview Track",
    subtitle: `${BACKEND_TOPICS.length} topics · ${backendQuestionIndex.length} questions`,
    category: "topics",
    path: "/interview/java/spring-boot",
    icon: "🍃",
    haystack: "spring boot backend java microservices interview track",
  });

  BACKEND_TOPICS.forEach((topic) => {
    push({
      id: `topic:backend:${topic.id}`,
      title: topic.title,
      subtitle: topic.blurb,
      category: "topics",
      path: `/interview/java/spring-boot/questions`,
      icon: topic.icon,
      haystack: `${topic.title} ${topic.shortTitle} ${topic.blurb}`.toLowerCase(),
    });
  });

  ANNOTATION_CATALOGUE.forEach((entry) => {
    push({
      id: `annotation:${entry.name}`,
      title: entry.name,
      subtitle: entry.target,
      category: "interviews",
      path: `/interview/java/spring-boot/annotations#${entry.category}`,
      icon: "🏷️",
      haystack: `${entry.name} ${entry.target} ${entry.category} annotation`.toLowerCase(),
    });
  });

  BACKEND_PRACTICE_PROBLEMS.forEach((problem) => {
    const topic = BACKEND_TOPICS.find((t) => t.id === problem.topic);
    push({
      id: `bp:${problem.id}`,
      title: problem.title,
      subtitle: `Backend Practice — ${topic?.shortTitle ?? problem.topic}`,
      category: "problems",
      path: `/interview/java/spring-boot/practice/${problem.id}`,
      icon: topic?.icon ?? "🧩",
      difficulty: problem.difficulty,
      haystack: `${problem.title} ${topic?.title ?? ""} ${problem.topic}`.toLowerCase(),
    });
  });

  // --- Roadmaps -------------------------------------------------------------
  (Object.keys(roadmaps) as Array<keyof typeof roadmaps>).forEach((id) => {
    const meta = roadmaps[id];
    push({
      id: `roadmap:${id}`,
      title: meta.title,
      subtitle: meta.subtitle,
      category: "roadmaps",
      path: `/roadmap/${id}`,
      icon: id === "java" ? "☕" : id === "dsa" ? "🧠" : "🏗️",
      haystack: `${meta.title} ${meta.subtitle} roadmap`.toLowerCase(),
    });
  });

  // --- Templates & snippets -------------------------------------------------
  CP_TEMPLATES.forEach((template) => {
    push({
      id: `template:${template.prefix}`,
      title: template.name,
      subtitle: template.description,
      category: "templates",
      path: "/playground",
      icon: "📄",
      haystack: `${template.name} ${template.description} template code`.toLowerCase(),
    });
  });

  ALL_SNIPPETS.forEach((snippet) => {
    push({
      id: `snippet:${snippet.label}`,
      title: snippet.label,
      subtitle: snippet.documentation || snippet.detail || "Java snippet",
      category: "templates",
      path: "/playground",
      icon: "⌨️",
      haystack: `${snippet.label} ${snippet.detail ?? ""} ${snippet.documentation ?? ""}`.toLowerCase(),
    });
  });

  // --- Static pages & tools -------------------------------------------------
  const pages: Array<Omit<SearchDoc, "id" | "category" | "haystack">> = [
    { title: "Home", subtitle: "Dashboard and getting started", path: "/", icon: "🏠" },
    { title: "Playground", subtitle: "Monaco editor with snippets and templates", path: "/playground", icon: "⌨️" },
    { title: "Practice", subtitle: "Problem sets across DSA and languages", path: "/practice", icon: "🎯" },
    { title: "Problem Solver", subtitle: "Solve a single problem end to end", path: "/problem-solver", icon: "🧠" },
    { title: "Coding Contest", subtitle: "Timed competitive programming contest", path: "/contest", icon: "🏆" },
    { title: "Interview Hub", subtitle: "Java, C++, Python, backend and system design tracks", path: "/interview", icon: "🎤" },
    { title: "Roadmaps", subtitle: "Visual learning paths for Java, DSA and system design", path: "/roadmap", icon: "🗺️" },
    { title: "My Notes", subtitle: "Every note you have written, in one place", path: "/notes", icon: "📓" },
    { title: "Profile", subtitle: "Your account and preferences", path: "/profile", icon: "👤" },
    { title: "Admin", subtitle: "Moderation and platform administration", path: "/admin", icon: "🛡️" },
    { title: "Support", subtitle: "Report an issue or get help", path: "/support", icon: "💬" },
    { title: "Buy Me a Coffee", subtitle: "Support AlgoGuru development", path: "/buy-me-a-coffee", icon: "☕" },
  ];

  pages.forEach((page) => {
    push({
      id: `page:${page.path}`,
      title: page.title,
      subtitle: page.subtitle,
      category: "tools",
      ...page,
      haystack: `${page.title} ${page.subtitle}`.toLowerCase(),
    });
  });

  return docs;
};

export const STATIC_SEARCH_DOCS: SearchDoc[] = buildStaticDocs();

/* -------------------------------------------------------------------------- */
/* Ranking                                                                     */
/* -------------------------------------------------------------------------- */

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const scoreDoc = (doc: SearchDoc, terms: string[], needle: string): number => {
  const title = normalize(doc.title);
  const subtitle = normalize(doc.subtitle);
  const haystack = `${doc.haystack} ${subtitle}`;

  let score = 0;
  for (const term of terms) {
    let termScore = 0;
    if (title === term) termScore += 40;
    else if (title.startsWith(term)) termScore += 22;
    else if (title.includes(term)) termScore += 12;

    if (subtitle.includes(term)) termScore += 4;
    if (haystack.includes(term)) termScore += 2;

    // AND semantics: a doc only survives when every typed term lands
    // somewhere, so extra words always narrow the result set.
    if (termScore === 0) return 0;
    score += termScore;
  }
  if (title.startsWith(needle)) score += 8;

  return score;
};

export interface SearchOptions {
  tab?: SearchTab;
  limit?: number;
  extraDocs?: SearchDoc[];
}

/** Rank the index against a query. An empty query returns an empty list. */
export function searchDocs(
  query: string,
  docs: SearchDoc[] = STATIC_SEARCH_DOCS,
  { tab = "all", limit = 60 }: SearchOptions = {},
): ScoredDoc[] {
  const needle = normalize(query);
  if (!needle) return [];

  const terms = needle.split(" ").filter(Boolean);
  const pool = tab === "all" ? docs : docs.filter((doc) => doc.category === tab);

  const scored: ScoredDoc[] = [];
  for (const doc of pool) {
    const score = scoreDoc(doc, terms, needle);
    if (score > 0) scored.push({ ...doc, score });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, limit);
}

/** Buckets scored docs by category, preserving `CATEGORY_ORDER`. */
export function groupByCategory(docs: ScoredDoc[]): Array<{ category: SearchCategory; docs: ScoredDoc[] }> {
  const buckets = new Map<SearchCategory, ScoredDoc[]>();
  docs.forEach((doc) => {
    const list = buckets.get(doc.category);
    if (list) list.push(doc);
    else buckets.set(doc.category, [doc]);
  });
  return CATEGORY_ORDER.filter((category) => buckets.has(category)).map((category) => ({
    category,
    docs: buckets.get(category)!,
  }));
}

/* -------------------------------------------------------------------------- */
/* Quick access                                                                */
/* -------------------------------------------------------------------------- */

/** Seed list shown before the user has any search history. */
export const DEFAULT_QUICK_ACCESS: SearchDoc[] = [
  { id: "roadmap:java", title: "Java Roadmap", subtitle: "Core → Advanced → Spring", category: "roadmaps", path: "/roadmap/java", icon: "☕", haystack: "" },
  { id: "roadmap:dsa", title: "DSA Roadmap", subtitle: "Curated problem path", category: "roadmaps", path: "/roadmap/dsa", icon: "🧠", haystack: "" },
  { id: "roadmap:system-design", title: "System Design Roadmap", subtitle: "Scalability to architecture", category: "roadmaps", path: "/roadmap/system-design", icon: "🏗️", haystack: "" },
  { id: "hub:spring-boot", title: "Spring Boot Track", subtitle: "Backend interview questions", category: "topics", path: "/interview/java/spring-boot", icon: "🍃", haystack: "" },
  { id: "page:/playground", title: "Playground", subtitle: "Code editor & snippets", category: "tools", path: "/playground", icon: "⌨️", haystack: "" },
  { id: "page:/contest", title: "Coding Contest", subtitle: "Timed contest mode", category: "tools", path: "/contest", icon: "🏆", haystack: "" },
  { id: "page:/notes", title: "My Notes", subtitle: "Everything you have written", category: "tools", path: "/notes", icon: "📓", haystack: "" },
];

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

const NOTE_EXCERPT_LENGTH = 160;

const excerpt = (notes: string) => {
  const flat = notes.replace(/\s+/g, " ").trim();
  return flat.length > NOTE_EXCERPT_LENGTH ? `${flat.slice(0, NOTE_EXCERPT_LENGTH)}…` : flat;
};

export type NoteSource = "core-java" | "practice" | "system-design";

interface NoteDocInput {
  source: NoteSource;
  questionId: string;
  notes: string;
  updatedAt?: string | null;
}

/**
 * Turn raw `*_user_state` rows into searchable note docs, resolving each row
 * back to the underlying question / problem so the note gets a real title and
 * a real destination. Falls back to the notes dashboard when unresolvable.
 */
export function buildNoteDocs(rows: NoteDocInput[]): SearchDoc[] {
  const docs: SearchDoc[] = [];
  rows.forEach((row) => {
    const notes = (row.notes ?? "").trim();
    if (!notes) return;

    const target = noteTargets.get(`${row.source}:${row.questionId}`);
    docs.push({
      id: `note:${row.source}:${row.questionId}`,
      title: target?.title ?? excerpt(notes),
      subtitle: target ? `${target.subtitle} · ${excerpt(notes)}` : `Note · ${excerpt(notes)}`,
      category: "notes",
      path: target?.path ?? "/notes",
      icon: "📝",
      haystack: `${target?.title ?? ""} ${target?.subtitle ?? ""} ${notes}`.toLowerCase(),
    });
  });
  return docs;
}
