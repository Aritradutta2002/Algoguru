/**
 * Ordered topic registry for the Core Java interview question bank.
 *
 * Order here is the order rendered on `/interview/java/core-java-qa`.
 * The displayed question number is derived from array position in
 * `coreJavaQuestionIndex`, so the sequence of `questions` inside each topic —
 * and the order of the topics themselves — is the source of truth for
 * "Question 1 ... Question N".
 */

export interface TopicDefinition {
  /** Stable topic id; also the `topic` value used by chunk files. */
  id: string;
  /** Display title. */
  title: string;
  /** Emoji shown in topic chips. */
  icon: string;
  /** Inclusive 1-based global question numbers covered by this topic. */
  range: [number, number];
}

export const TOPIC_DEFINITIONS: TopicDefinition[] = [
  { id: "java-platform", title: "Java Platform", icon: "☕", range: [1, 6] },
  { id: "wrapper-classes", title: "Wrapper Classes", icon: "📦", range: [7, 15] },
  { id: "strings", title: "Strings", icon: "🔤", range: [16, 22] },
  { id: "oop-basics", title: "Object Oriented Programming Basics", icon: "🧱", range: [23, 54] },
  { id: "advanced-oop", title: "Advanced Object Oriented Concepts", icon: "🧩", range: [55, 63] },
  { id: "modifiers", title: "Modifiers", icon: "🔐", range: [64, 78] },
  { id: "conditions-loops", title: "Conditions & Loops", icon: "🔁", range: [79, 90] },
  { id: "exception-handling", title: "Exception Handling", icon: "⚠️", range: [91, 108] },
  { id: "miscellaneous", title: "Miscellaneous Topics", icon: "🧰", range: [109, 133] },
  { id: "collections", title: "Collections", icon: "📚", range: [134, 166] },
  { id: "advanced-collections", title: "Advanced Collections", icon: "⚙️", range: [167, 177] },
  { id: "generics", title: "Generics", icon: "🧬", range: [178, 184] },
  { id: "multithreading", title: "Multi Threading", icon: "🧵", range: [185, 207] },
  {
    id: "functional-streams",
    title: "Functional Programming — Lambda Expressions and Streams",
    icon: "🌊",
    range: [208, 221],
  },
  { id: "new-features", title: "New Features", icon: "🚀", range: [222, 225] },
];

export const TOPIC_BY_ID: Record<string, TopicDefinition> = Object.fromEntries(
  TOPIC_DEFINITIONS.map((topic) => [topic.id, topic])
);