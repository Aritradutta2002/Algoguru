import {
  BACKEND_TOPICS,
  BACKEND_TOPIC_BY_ID,
  allBackendQuestions,
  backendQuestionMetaMap,
  backendQuestionsByTopicId,
  backendTopicIdByQuestionId,
  type BackendQuestion,
  type BackendQuestionMeta,
  type BackendTopicDefinition,
} from "@/data/backendInterview";

export const BACKEND_BASE_PATH = "/interview/java/spring-boot";
export const BACKEND_QUESTIONS_PATH = `${BACKEND_BASE_PATH}/questions`;
export const BACKEND_ANNOTATIONS_PATH = `${BACKEND_BASE_PATH}/annotations`;
export const BACKEND_PRACTICE_PATH = `${BACKEND_BASE_PATH}/practice`;

/** Deterministic slug generator, mirroring the Core Java bank. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export interface IndexedBackendQuestion {
  question: BackendQuestion;
  topic: BackendTopicDefinition;
  meta: BackendQuestionMeta;
  /** 0-based position across the whole flat list. */
  index: number;
  /** 1-based display number ("Question 42 of 257"). */
  number: number;
  slug: string;
  /** 1-based position within its own topic. */
  positionInTopic: number;
  topicSize: number;
}

const FALLBACK_TOPIC: BackendTopicDefinition = {
  id: "unknown",
  title: "Uncategorised",
  shortTitle: "Uncategorised",
  icon: "❓",
  blurb: "",
  interviewerIntent: "",
  accent: "hsl(var(--muted-foreground))",
};

const FALLBACK_META: BackendQuestionMeta = {
  difficulty: "medium",
  priority: "medium",
  tags: [],
};

function buildIndex(): IndexedBackendQuestion[] {
  const entries: IndexedBackendQuestion[] = [];
  const seenSlugs = new Map<string, string>();
  let position = 0;

  for (const topic of BACKEND_TOPICS) {
    const questions = backendQuestionsByTopicId[topic.id] ?? [];
    questions.forEach((question, indexInTopic) => {
      const meta = backendQuestionMetaMap[question.id] ?? FALLBACK_META;

      let slug = meta.slug ?? slugify(question.question);
      if (!slug) slug = question.id;
      // Deterministic de-duplication: the later question keeps its id suffix.
      if (seenSlugs.has(slug)) {
        slug = `${slug}-${question.id}`;
      }
      seenSlugs.set(slug, question.id);

      entries.push({
        question,
        topic,
        meta,
        index: position,
        number: position + 1,
        slug,
        positionInTopic: indexInTopic + 1,
        topicSize: questions.length,
      });
      position += 1;
    });
  }
  return entries;
}

export const backendQuestionIndex: IndexedBackendQuestion[] = buildIndex();

const byId = new Map(backendQuestionIndex.map((entry) => [entry.question.id, entry]));
const bySlug = new Map(backendQuestionIndex.map((entry) => [entry.slug, entry]));

export function getAllBackendQuestions(): IndexedBackendQuestion[] {
  return backendQuestionIndex;
}

export function getBackendQuestionById(id: string): IndexedBackendQuestion | undefined {
  return byId.get(id);
}

/** Accepts either the slug or the raw id, so deep links stay forgiving. */
export function getBackendQuestionBySlug(slug: string): IndexedBackendQuestion | undefined {
  return bySlug.get(slug) ?? byId.get(slug);
}

export function getBackendQuestionPath(entry: IndexedBackendQuestion): string {
  return `${BACKEND_QUESTIONS_PATH}/${entry.slug}`;
}

export function getBackendNeighbours(id: string): {
  previous?: IndexedBackendQuestion;
  next?: IndexedBackendQuestion;
} {
  const entry = byId.get(id);
  if (!entry) return {};
  return {
    previous: entry.index > 0 ? backendQuestionIndex[entry.index - 1] : undefined,
    next:
      entry.index < backendQuestionIndex.length - 1
        ? backendQuestionIndex[entry.index + 1]
        : undefined,
  };
}

export function getBackendTopic(topicId: string): BackendTopicDefinition {
  return BACKEND_TOPIC_BY_ID[topicId] ?? FALLBACK_TOPIC;
}

export function getBackendTopicForQuestionId(id: string): BackendTopicDefinition {
  return getBackendTopic(backendTopicIdByQuestionId[id] ?? "unknown");
}

/** All distinct tags, sorted by frequency then alphabetically. */
export const backendAllTags: string[] = (() => {
  const counts = new Map<string, number>();
  for (const entry of backendQuestionIndex) {
    for (const tag of entry.meta.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
})();

export interface BackendTopicStat {
  topic: BackendTopicDefinition;
  total: number;
  easy: number;
  medium: number;
  hard: number;
  veryHigh: number;
  readMinutes: number;
  firstSlug?: string;
}

export const backendTopicStats: BackendTopicStat[] = BACKEND_TOPICS.map((topic) => {
  const entries = backendQuestionIndex.filter((entry) => entry.topic.id === topic.id);
  return {
    topic,
    total: entries.length,
    easy: entries.filter((e) => e.meta.difficulty === "easy").length,
    medium: entries.filter((e) => e.meta.difficulty === "medium").length,
    hard: entries.filter((e) => e.meta.difficulty === "hard").length,
    veryHigh: entries.filter((e) => e.meta.priority === "very-high").length,
    readMinutes: entries.reduce((total, e) => total + (e.meta.readMinutes ?? 4), 0),
    firstSlug: entries[0]?.slug,
  };
});

export const BACKEND_TOTAL_QUESTIONS = allBackendQuestions.length;

export const BACKEND_TOTAL_READ_MINUTES = backendQuestionIndex.reduce(
  (total, entry) => total + (entry.meta.readMinutes ?? 4),
  0,
);

/** Lightweight scoring search over question text, tags and topic. */
export function searchBackendQuestions(
  query: string,
  entries: IndexedBackendQuestion[] = backendQuestionIndex,
): IndexedBackendQuestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  const terms = needle.split(/\s+/).filter(Boolean);

  const scored = entries
    .map((entry) => {
      const question = entry.question.question.toLowerCase();
      const tags = (entry.meta.tags ?? []).join(" ").toLowerCase();
      const topic = entry.topic.title.toLowerCase();
      const answer = entry.question.answer.toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (question.includes(term)) score += 8;
        if (tags.includes(term)) score += 5;
        if (topic.includes(term)) score += 3;
        if (entry.question.id.toLowerCase() === term) score += 20;
        if (answer.includes(term)) score += 1;
      }
      if (question.startsWith(needle)) score += 6;
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.index - b.entry.index);

  return scored.map((row) => row.entry);
}
