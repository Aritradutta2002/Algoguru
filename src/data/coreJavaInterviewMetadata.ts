import type { InterviewQuestion, InterviewTopic } from "@/data/coreJavaInterviewData";

export type Difficulty = "easy" | "medium" | "hard";
export type InterviewPriority = "low" | "medium" | "high" | "very-high";

export interface CoreJavaQuestionMeta {
  slug?: string;
  difficulty?: Difficulty;
  priority?: InterviewPriority;
  tags?: string[];
  relatedQuestionIds?: string[];
  estimatedReadMinutes?: number;
  javaVersions?: string[];
}

export interface CoreJavaQuestionEntry {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: CoreJavaQuestionMeta;
}

export const JAVA_QUESTION_BASE_PATH = "/interview/java/core-java-qa";

/** Deterministic slug generator for question deep links. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Manual slug overrides for the most-linked questions (stable, shareable URLs). */
export const CORE_JAVA_SLUG_OVERRIDES: Record<string, string> = {
  b2: "jdk-jre-jvm-difference",
  b3: "what-is-bytecode",
  c6: "hashmap-internal-working",
  c7: "concurrenthashmap-thread-safety",
  e1: "checked-vs-unchecked-exceptions",
  e4: "try-with-resources",
  ip3: "diamond-problem",
  m8: "java-records",
  m21: "sealed-classes",
  mem1: "jvm-memory-model",
  mem2: "garbage-collection",
  mem3: "stack-vs-heap-memory",
  mt3: "synchronized-keyword",
  mt4: "wait-vs-sleep",
  mt6: "deadlock-and-prevention",
  mt7: "volatile-keyword",
  mt8: "executor-service-thread-pool",
  s1: "string-pool",
  s2: "string-immutability",
  st1: "java-stream-api",
  st2: "map-vs-flatmap",
  st5: "intermediate-vs-terminal-operations",
  g1: "generics-type-erasure",
  g2: "type-erasure",
  o1: "four-pillars-of-oop",
  o2: "overloading-vs-overriding",
  o3: "encapsulation",
  o4: "inheritance-types",
  o5: "abstract-class-vs-interface",
  o6: "polymorphism",
  b11: "java-pass-by-value",
  c13: "equals-hashcode-contract",
  mt11: "thread-lifecycle-states",
  mt16: "completable-future",
  m22: "immutable-class",
  m23: "singleton-pattern",
  m28: "java-memory-model-happens-before",
  m29: "virtual-threads",
  b17: "nullpointerexception-prevention",
  b18: "string-equals-vs-double-equals",
  c17: "concurrent-modification-exception",
  c18: "list-of-map-of-immutable-collections",
  c19: "linkedhashmap-lru-cache",
  mt18: "atomicinteger-vs-synchronized",
  mt19: "blockingqueue-producer-consumer",
  mt20: "sleep-vs-wait",
  mt22: "virtual-threads-java-21",
  st10: "optional-anti-patterns",
  m32: "record-vs-class",
  m34: "implement-equals-hashcode",
  m36: "sealed-classes-pattern-matching",
  m40: "switch-expressions-java-14",
};

/** Editorial metadata per question id. Only facts supported by existing content. */
export const CORE_JAVA_QUESTION_META: Record<string, CoreJavaQuestionMeta> = {
  // ── Java Basics ──
  b1: { difficulty: "easy", priority: "very-high", tags: ["fundamentals", "oop"], relatedQuestionIds: ["b2", "b3", "o1"] },
  b2: { difficulty: "easy", priority: "very-high", tags: ["jvm", "architecture"], relatedQuestionIds: ["b3", "mem1", "mem2"] },
  b3: { difficulty: "easy", priority: "high", tags: ["jvm", "bytecode"], relatedQuestionIds: ["b2", "mem1"] },
  b4: { difficulty: "medium", priority: "medium", tags: ["jvm", "environment"] },
  b5: { difficulty: "easy", priority: "medium", tags: ["fundamentals"], relatedQuestionIds: ["m14"] },
  b6: { difficulty: "easy", priority: "high", tags: ["fundamentals", "primitives"], relatedQuestionIds: ["b8", "m14"] },
  b7: { difficulty: "easy", priority: "high", tags: ["fundamentals", "casting"] },
  b8: { difficulty: "medium", priority: "high", tags: ["wrappers", "autoboxing"], relatedQuestionIds: ["b9", "m14"] },
  b9: { difficulty: "medium", priority: "very-high", tags: ["equality", "strings"], relatedQuestionIds: ["s2", "s5"] },
  b10: { difficulty: "easy", priority: "high", tags: ["fundamentals", "entry-point"] },
  // ── OOP ──
  o1: { difficulty: "easy", priority: "very-high", tags: ["oop"], relatedQuestionIds: ["o3", "o4", "o5", "o6"] },
  o2: { difficulty: "medium", priority: "very-high", tags: ["oop", "polymorphism"], relatedQuestionIds: ["o6", "ip1"] },
  o3: { difficulty: "easy", priority: "very-high", tags: ["oop", "encapsulation"], relatedQuestionIds: ["o9"] },
  o4: { difficulty: "easy", priority: "high", tags: ["oop", "inheritance"], relatedQuestionIds: ["ip3", "ip5", "ip4"] },
  o5: { difficulty: "medium", priority: "very-high", tags: ["oop", "abstraction"], relatedQuestionIds: ["o6", "ic2"] },
  o6: { difficulty: "medium", priority: "very-high", tags: ["oop", "polymorphism"], relatedQuestionIds: ["o2", "ip1"] },
  o7: { difficulty: "easy", priority: "medium", tags: ["oop", "keyword"] },
  o8: { difficulty: "easy", priority: "medium", tags: ["oop", "keyword"], relatedQuestionIds: ["o7"] },
  o9: { difficulty: "easy", priority: "high", tags: ["oop", "access-control"], relatedQuestionIds: ["o3"] },
  o10: { difficulty: "easy", priority: "high", tags: ["oop", "static"], relatedQuestionIds: ["ip1"] },
  // ── Strings ──
  s1: { difficulty: "medium", priority: "very-high", tags: ["strings", "memory"], relatedQuestionIds: ["s2", "b9"] },
  s2: { difficulty: "medium", priority: "very-high", tags: ["strings", "immutability"], relatedQuestionIds: ["s1", "s3"] },
  s3: { difficulty: "easy", priority: "very-high", tags: ["strings", "performance"], relatedQuestionIds: ["s2", "m9"] },
  s4: { difficulty: "easy", priority: "medium", tags: ["strings", "methods"] },
  s5: { difficulty: "medium", priority: "medium", tags: ["strings", "equality"], relatedQuestionIds: ["b9"] },
  // ── Inheritance & Polymorphism ──
  ip1: { difficulty: "medium", priority: "high", tags: ["oop", "static", "polymorphism"], relatedQuestionIds: ["o2", "o6"] },
  ip2: { difficulty: "hard", priority: "low", tags: ["oop", "overriding"], relatedQuestionIds: ["o2"] },
  ip3: { difficulty: "hard", priority: "medium", tags: ["oop", "multiple-inheritance"], relatedQuestionIds: ["o4", "o5"] },
  ip4: { difficulty: "medium", priority: "medium", tags: ["oop", "constructors"], relatedQuestionIds: ["o4", "o8"] },
  ip5: { difficulty: "medium", priority: "high", tags: ["oop", "design"], relatedQuestionIds: ["o4", "m15"] },
  // ── Exception Handling ──
  e1: { difficulty: "medium", priority: "very-high", tags: ["exceptions"], relatedQuestionIds: ["e7", "e2"] },
  e2: { difficulty: "easy", priority: "high", tags: ["exceptions", "keyword"], relatedQuestionIds: ["e1"] },
  e3: { difficulty: "easy", priority: "high", tags: ["exceptions", "cleanup"], relatedQuestionIds: ["e4", "e10"] },
  e4: { difficulty: "medium", priority: "very-high", tags: ["exceptions", "resources"], relatedQuestionIds: ["e3", "e9"] },
  e5: { difficulty: "medium", priority: "medium", tags: ["exceptions"], relatedQuestionIds: ["e3", "e4"] },
  e6: { difficulty: "medium", priority: "medium", tags: ["exceptions", "custom"] },
  e7: { difficulty: "easy", priority: "high", tags: ["exceptions", "hierarchy"], relatedQuestionIds: ["e1"] },
  e8: { difficulty: "medium", priority: "medium", tags: ["exceptions", "call-stack"] },
  e9: { difficulty: "hard", priority: "low", tags: ["exceptions", "try-with-resources"], relatedQuestionIds: ["e4"] },
  e10: { difficulty: "easy", priority: "high", tags: ["keyword"], relatedQuestionIds: ["e3"] },
  // ── Collections ──
  c1: { difficulty: "easy", priority: "high", tags: ["collections", "framework"], relatedQuestionIds: ["c2", "c3"] },
  c2: { difficulty: "easy", priority: "very-high", tags: ["collections", "list"], relatedQuestionIds: ["c1", "m13"] },
  c3: { difficulty: "medium", priority: "high", tags: ["collections", "map"], relatedQuestionIds: ["c6", "c7", "m12"] },
  c4: { difficulty: "medium", priority: "high", tags: ["collections", "set"], relatedQuestionIds: ["c9"] },
  c5: { difficulty: "medium", priority: "high", tags: ["collections", "sorting"], relatedQuestionIds: ["c10"] },
  c6: { difficulty: "hard", priority: "very-high", tags: ["collections", "map", "hashing"], relatedQuestionIds: ["c7", "c3", "b9"] },
  c7: { difficulty: "hard", priority: "very-high", tags: ["collections", "concurrency", "map"], relatedQuestionIds: ["c6", "c8", "m12"] },
  c8: { difficulty: "hard", priority: "medium", tags: ["collections", "iteration"], relatedQuestionIds: ["c7", "c10"] },
  c9: { difficulty: "easy", priority: "high", tags: ["collections"], relatedQuestionIds: ["c2", "c4"] },
  c10: { difficulty: "medium", priority: "medium", tags: ["collections", "iteration"], relatedQuestionIds: ["c8", "m10"] },
  // ── Multithreading ──
  mt1: { difficulty: "easy", priority: "very-high", tags: ["threads"], relatedQuestionIds: ["mt2", "mt8", "mt9"] },
  mt2: { difficulty: "easy", priority: "high", tags: ["threads", "runnable"], relatedQuestionIds: ["mt1"] },
  mt3: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "locks"], relatedQuestionIds: ["mt4", "mt7"] },
  mt4: { difficulty: "medium", priority: "high", tags: ["concurrency", "threads"], relatedQuestionIds: ["mt3", "mt5"] },
  mt5: { difficulty: "medium", priority: "medium", tags: ["concurrency", "threads"], relatedQuestionIds: ["mt4"] },
  mt6: { difficulty: "hard", priority: "very-high", tags: ["concurrency", "deadlock"], relatedQuestionIds: ["mt3", "mt7"] },
  mt7: { difficulty: "hard", priority: "high", tags: ["concurrency", "memory-model"], relatedQuestionIds: ["mt3", "mt6"] },
  mt8: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "executors"], relatedQuestionIds: ["mt1", "mt9", "mt10"] },
  mt9: { difficulty: "medium", priority: "high", tags: ["concurrency", "threads"], relatedQuestionIds: ["mt1", "mt8"] },
  mt10: { difficulty: "hard", priority: "medium", tags: ["concurrency", "latch"], relatedQuestionIds: ["mt8"] },
  // ── Inner Classes & Lambda ──
  ic1: { difficulty: "medium", priority: "medium", tags: ["inner-classes", "oop"] },
  ic2: { difficulty: "medium", priority: "very-high", tags: ["functional", "lambda"], relatedQuestionIds: ["ic3", "ic5", "st1"] },
  ic3: { difficulty: "medium", priority: "very-high", tags: ["lambda", "java8"], relatedQuestionIds: ["ic2", "ic4", "st1"] },
  ic4: { difficulty: "medium", priority: "medium", tags: ["lambda", "method-references"], relatedQuestionIds: ["ic3"] },
  ic5: { difficulty: "medium", priority: "medium", tags: ["functional", "java8"], relatedQuestionIds: ["ic2", "st1"] },
  // ── Generics ──
  g1: { difficulty: "medium", priority: "very-high", tags: ["generics", "type-safety"], relatedQuestionIds: ["g2", "g3"] },
  g2: { difficulty: "hard", priority: "very-high", tags: ["generics", "type-erasure"], relatedQuestionIds: ["g1", "g5"] },
  g3: { difficulty: "medium", priority: "medium", tags: ["generics", "bounds"], relatedQuestionIds: ["g4"] },
  g4: { difficulty: "hard", priority: "high", tags: ["generics", "wildcards"], relatedQuestionIds: ["g3", "g2"] },
  g5: { difficulty: "hard", priority: "low", tags: ["generics", "arrays"], relatedQuestionIds: ["g2"] },
  // ── I/O ──
  io1: { difficulty: "medium", priority: "medium", tags: ["io", "streams"] },
  io2: { difficulty: "easy", priority: "high", tags: ["io", "performance"], relatedQuestionIds: ["io1"] },
  io3: { difficulty: "medium", priority: "medium", tags: ["io", "serialization"], relatedQuestionIds: ["io4", "io5"] },
  io4: { difficulty: "easy", priority: "high", tags: ["serialization", "keyword"], relatedQuestionIds: ["io3"] },
  io5: { difficulty: "hard", priority: "low", tags: ["serialization"], relatedQuestionIds: ["io3"] },
  // ── Memory & JVM ──
  mem1: { difficulty: "medium", priority: "very-high", tags: ["jvm", "memory"], relatedQuestionIds: ["mem3", "b2"] },
  mem2: { difficulty: "medium", priority: "very-high", tags: ["jvm", "gc"], relatedQuestionIds: ["mem4", "mem5"] },
  mem3: { difficulty: "medium", priority: "very-high", tags: ["memory", "jvm"], relatedQuestionIds: ["mem1", "s1"] },
  mem4: { difficulty: "medium", priority: "medium", tags: ["gc"], relatedQuestionIds: ["mem2"] },
  mem5: { difficulty: "hard", priority: "medium", tags: ["gc", "jvm"], relatedQuestionIds: ["mem2"] },
  // ── Stream API ──
  st1: { difficulty: "medium", priority: "very-high", tags: ["streams", "java8"], relatedQuestionIds: ["st5", "ic3"] },
  st2: { difficulty: "medium", priority: "very-high", tags: ["streams", "java8"], relatedQuestionIds: ["st1", "st5"] },
  st3: { difficulty: "medium", priority: "low", tags: ["streams", "parallel"], relatedQuestionIds: ["st1"] },
  st4: { difficulty: "medium", priority: "medium", tags: ["streams", "collectors"], relatedQuestionIds: ["st1", "st5"] },
  st5: { difficulty: "easy", priority: "very-high", tags: ["streams", "lazy-evaluation"], relatedQuestionIds: ["st1", "st2"] },
  // ── Misc ──
  m1: { difficulty: "medium", priority: "medium", tags: ["object-copying"], relatedQuestionIds: ["m17", "m2"] },
  m2: { difficulty: "medium", priority: "medium", tags: ["clone", "marker-interface"], relatedQuestionIds: ["m1", "m17"] },
  m3: { difficulty: "medium", priority: "low", tags: ["comparator", "null-handling"] },
  m4: { difficulty: "medium", priority: "very-high", tags: ["optional", "java8", "null-handling"], relatedQuestionIds: ["st1"] },
  m5: { difficulty: "easy", priority: "medium", tags: ["varargs", "methods"] },
  m6: { difficulty: "hard", priority: "medium", tags: ["jvm", "classloader"], relatedQuestionIds: ["mem1"] },
  m7: { difficulty: "easy", priority: "low", tags: ["equality", "arrays"], relatedQuestionIds: ["b9"] },
  m8: { difficulty: "medium", priority: "high", tags: ["records", "java14", "immutability"], javaVersions: ["Java 14+"], relatedQuestionIds: ["m21", "s2"] },
  m9: { difficulty: "easy", priority: "low", tags: ["strings", "capacity"], relatedQuestionIds: ["s3"] },
  m10: { difficulty: "easy", priority: "low", tags: ["iteration", "legacy"], relatedQuestionIds: ["c10"] },
  m11: { difficulty: "easy", priority: "medium", tags: ["data-structures"], relatedQuestionIds: ["c1"] },
  m12: { difficulty: "easy", priority: "very-high", tags: ["collections", "map", "legacy"], relatedQuestionIds: ["c6", "c7"] },
  m13: { difficulty: "easy", priority: "medium", tags: ["collections", "list", "legacy"], relatedQuestionIds: ["c2"] },
  m14: { difficulty: "easy", priority: "high", tags: ["wrappers", "primitives"], relatedQuestionIds: ["b8", "b5"] },
  m15: { difficulty: "medium", priority: "medium", tags: ["oop", "relationships"], relatedQuestionIds: ["ip5", "o4"] },
  m16: { difficulty: "easy", priority: "high", tags: ["operator", "type-checking"], relatedQuestionIds: ["o6"] },
  m17: { difficulty: "medium", priority: "low", tags: ["clone", "object-copying"], relatedQuestionIds: ["m1", "m2"] },
  m18: { difficulty: "easy", priority: "low", tags: ["strings", "java8"], relatedQuestionIds: ["s3"] },
  m19: { difficulty: "hard", priority: "low", tags: ["modules", "java9"], javaVersions: ["Java 9+"], relatedQuestionIds: ["b2"] },
  m20: { difficulty: "easy", priority: "high", tags: ["keyword"], relatedQuestionIds: ["e3", "e10"] },
  m21: { difficulty: "hard", priority: "medium", tags: ["sealed-classes", "java17"], javaVersions: ["Java 17+"], relatedQuestionIds: ["m8", "o5"] },
  // ── Extra vital questions ──
  b11: { difficulty: "medium", priority: "very-high", tags: ["fundamentals", "parameters"], relatedQuestionIds: ["b9"] },
  b12: { difficulty: "easy", priority: "very-high", tags: ["fundamentals", "object"], relatedQuestionIds: ["b9", "c13"] },
  b13: { difficulty: "easy", priority: "high", tags: ["fundamentals", "constructors"], relatedQuestionIds: ["ip4", "o11"] },
  b14: { difficulty: "medium", priority: "high", tags: ["jvm", "jit"], relatedQuestionIds: ["b2", "b3"] },
  b15: { difficulty: "easy", priority: "medium", tags: ["fundamentals", "packages"], relatedQuestionIds: ["m19"] },
  b16: { difficulty: "easy", priority: "high", tags: ["fundamentals", "exceptions"], relatedQuestionIds: ["e1", "e7"] },
  o11: { difficulty: "easy", priority: "high", tags: ["oop", "constructors"], relatedQuestionIds: ["b13", "o7", "o8"] },
  o12: { difficulty: "medium", priority: "high", tags: ["oop", "interfaces"], relatedQuestionIds: ["io3", "m2"] },
  o13: { difficulty: "medium", priority: "high", tags: ["oop", "overriding"], relatedQuestionIds: ["o2", "ip1"] },
  o14: { difficulty: "medium", priority: "very-high", tags: ["oop", "interfaces", "java8"], relatedQuestionIds: ["o5", "ip3"] },
  o15: { difficulty: "medium", priority: "medium", tags: ["oop", "design"], relatedQuestionIds: ["ip5"] },
  s6: { difficulty: "medium", priority: "high", tags: ["strings", "security"], relatedQuestionIds: ["s2"] },
  s7: { difficulty: "medium", priority: "high", tags: ["strings", "memory"], relatedQuestionIds: ["s1"] },
  s8: { difficulty: "medium", priority: "very-high", tags: ["strings", "memory"], relatedQuestionIds: ["s1", "s7"] },
  s9: { difficulty: "hard", priority: "medium", tags: ["strings", "jvm", "java9"], javaVersions: ["Java 9+"], relatedQuestionIds: ["s2", "mem3"] },
  ip6: { difficulty: "medium", priority: "very-high", tags: ["oop", "polymorphism"], relatedQuestionIds: ["o6", "o2"] },
  ip7: { difficulty: "hard", priority: "medium", tags: ["oop", "design"], relatedQuestionIds: ["o4", "ip5"] },
  ip8: { difficulty: "easy", priority: "high", tags: ["oop", "casting"], relatedQuestionIds: ["b7", "m16"] },
  e11: { difficulty: "easy", priority: "very-high", tags: ["exceptions", "hierarchy"], relatedQuestionIds: ["e1", "e7"] },
  e12: { difficulty: "medium", priority: "medium", tags: ["exceptions", "java7"], relatedQuestionIds: ["e1"] },
  e13: { difficulty: "medium", priority: "medium", tags: ["exceptions", "constructors"], relatedQuestionIds: ["b13"] },
  e14: { difficulty: "medium", priority: "high", tags: ["exceptions", "wrapping"], relatedQuestionIds: ["e6", "e8"] },
  c11: { difficulty: "easy", priority: "very-high", tags: ["collections", "framework"], relatedQuestionIds: ["c1"] },
  c12: { difficulty: "easy", priority: "high", tags: ["collections", "array"], relatedQuestionIds: ["c2"] },
  c13: { difficulty: "medium", priority: "very-high", tags: ["collections", "hashing", "equals"], relatedQuestionIds: ["c6", "b9", "m30"] },
  c14: { difficulty: "easy", priority: "high", tags: ["collections", "map"], relatedQuestionIds: ["c3", "c6"] },
  c15: { difficulty: "medium", priority: "high", tags: ["collections", "concurrency"], relatedQuestionIds: ["c8", "c7"] },
  c16: { difficulty: "medium", priority: "high", tags: ["collections", "queue"], relatedQuestionIds: ["m11"] },
  mt11: { difficulty: "medium", priority: "very-high", tags: ["threads", "lifecycle"], relatedQuestionIds: ["mt1"] },
  mt12: { difficulty: "easy", priority: "high", tags: ["threads"], relatedQuestionIds: ["mt1", "mt11"] },
  mt13: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "races"], relatedQuestionIds: ["mt3", "mt7"] },
  mt14: { difficulty: "hard", priority: "high", tags: ["concurrency", "locks"], relatedQuestionIds: ["mt3"] },
  mt15: { difficulty: "medium", priority: "high", tags: ["concurrency", "threadlocal"], relatedQuestionIds: ["mt1"] },
  mt16: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "futures", "java8"], relatedQuestionIds: ["mt8", "mt9"] },
  mt17: { difficulty: "hard", priority: "high", tags: ["concurrency", "synchronizers"], relatedQuestionIds: ["mt10"] },
  mem6: { difficulty: "medium", priority: "very-high", tags: ["jvm", "classloading"], relatedQuestionIds: ["m6", "b2"] },
  mem7: { difficulty: "hard", priority: "medium", tags: ["gc", "references"], relatedQuestionIds: ["mem2", "mem4"] },
  mem8: { difficulty: "easy", priority: "high", tags: ["memory", "errors"], relatedQuestionIds: ["mem3", "e7"] },
  st6: { difficulty: "medium", priority: "high", tags: ["streams", "parallel"], relatedQuestionIds: ["st1", "st3"] },
  st7: { difficulty: "medium", priority: "high", tags: ["streams", "collectors"], relatedQuestionIds: ["st4", "st5"] },
  st8: { difficulty: "easy", priority: "high", tags: ["streams"], relatedQuestionIds: ["st1", "c1"] },
  st9: { difficulty: "medium", priority: "high", tags: ["streams", "lazy-evaluation"], relatedQuestionIds: ["st3", "st5"] },
  ic6: { difficulty: "medium", priority: "high", tags: ["lambda", "java8"], relatedQuestionIds: ["ic3"] },
  ic7: { difficulty: "medium", priority: "medium", tags: ["lambda", "inner-classes"], relatedQuestionIds: ["ic3", "ic1"] },
  g6: { difficulty: "easy", priority: "high", tags: ["generics"], relatedQuestionIds: ["g1"] },
  g7: { difficulty: "medium", priority: "medium", tags: ["generics", "methods"], relatedQuestionIds: ["g1", "g3"] },
  io6: { difficulty: "medium", priority: "medium", tags: ["io", "nio"], relatedQuestionIds: ["io1"] },
  io7: { difficulty: "medium", priority: "high", tags: ["serialization"], relatedQuestionIds: ["io3"] },
  m22: { difficulty: "medium", priority: "very-high", tags: ["immutability", "design"], relatedQuestionIds: ["s2", "m8"] },
  m23: { difficulty: "medium", priority: "very-high", tags: ["design", "singleton"], relatedQuestionIds: ["o10"] },
  m24: { difficulty: "easy", priority: "high", tags: ["enum"], relatedQuestionIds: ["m23"] },
  m25: { difficulty: "medium", priority: "medium", tags: ["reflection"], relatedQuestionIds: ["m6"] },
  m26: { difficulty: "easy", priority: "high", tags: ["annotations"], relatedQuestionIds: ["o2"] },
  m27: { difficulty: "easy", priority: "high", tags: ["java10", "var"], javaVersions: ["Java 10+"], relatedQuestionIds: ["g6"] },
  m28: { difficulty: "hard", priority: "very-high", tags: ["jmm", "concurrency"], relatedQuestionIds: ["mt7", "mt3"] },
  m29: { difficulty: "medium", priority: "high", tags: ["virtual-threads", "java21"], javaVersions: ["Java 21+"], relatedQuestionIds: ["mt1", "mt8"] },
  m30: { difficulty: "medium", priority: "very-high", tags: ["hashing", "collections"], relatedQuestionIds: ["c13", "c6", "b9"] },
  // ── Must-know pre-interview questions ──
  b17: { difficulty: "easy", priority: "very-high", tags: ["fundamentals", "exceptions", "null-safety"], relatedQuestionIds: ["e1", "st10"] },
  b18: { difficulty: "easy", priority: "very-high", tags: ["fundamentals", "strings", "equals"], relatedQuestionIds: ["b9", "s1", "m30"] },
  b19: { difficulty: "medium", priority: "high", tags: ["fundamentals", "java-versions"], relatedQuestionIds: ["b2", "m29"] },
  b20: { difficulty: "medium", priority: "medium", tags: ["fundamentals", "class-loading"], relatedQuestionIds: ["m6", "mem6"] },
  o16: { difficulty: "easy", priority: "high", tags: ["oop", "interfaces"], relatedQuestionIds: ["o5", "o14"] },
  o17: { difficulty: "medium", priority: "very-high", tags: ["oop", "overriding", "static"], relatedQuestionIds: ["o2", "o13", "ip6"] },
  o18: { difficulty: "easy", priority: "very-high", tags: ["oop", "encapsulation", "abstraction"], relatedQuestionIds: ["o3", "o1"] },
  o19: { difficulty: "medium", priority: "high", tags: ["oop", "inner-classes"], relatedQuestionIds: ["ic1", "ic7"] },
  s10: { difficulty: "easy", priority: "very-high", tags: ["strings", "performance"], relatedQuestionIds: ["s1", "s2"] },
  s11: { difficulty: "medium", priority: "high", tags: ["strings", "regex"], relatedQuestionIds: ["s3"] },
  ip9: { difficulty: "easy", priority: "high", tags: ["oop", "abstract-class"], relatedQuestionIds: ["o5", "o7"] },
  ip10: { difficulty: "medium", priority: "medium", tags: ["oop", "initialization"], relatedQuestionIds: ["b20", "b13"] },
  e15: { difficulty: "medium", priority: "very-high", tags: ["exceptions", "finally"], relatedQuestionIds: ["e3", "e4"] },
  e16: { difficulty: "easy", priority: "very-high", tags: ["exceptions", "best-practices"], relatedQuestionIds: ["e1", "e11"] },
  c17: { difficulty: "medium", priority: "very-high", tags: ["collections", "iterators"], relatedQuestionIds: ["c1", "c15"] },
  c18: { difficulty: "easy", priority: "very-high", tags: ["collections", "immutability", "java9"], javaVersions: ["Java 9+"], relatedQuestionIds: ["c2", "m22"] },
  c19: { difficulty: "medium", priority: "very-high", tags: ["collections", "cache", "linkedhashmap"], relatedQuestionIds: ["c3", "c6"] },
  c20: { difficulty: "hard", priority: "medium", tags: ["collections", "memory", "references"], relatedQuestionIds: ["mem7", "c6"] },
  mt18: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "atomics"], relatedQuestionIds: ["mt3", "mt7", "mt13"] },
  mt19: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "queues"], relatedQuestionIds: ["mt8", "c16"] },
  mt20: { difficulty: "easy", priority: "very-high", tags: ["threads", "wait-notify"], relatedQuestionIds: ["mt4", "mt3"] },
  mt21: { difficulty: "hard", priority: "medium", tags: ["concurrency", "deadlock"], relatedQuestionIds: ["mt6", "mt14"] },
  mt22: { difficulty: "medium", priority: "very-high", tags: ["virtual-threads", "java21"], javaVersions: ["Java 21+"], relatedQuestionIds: ["m29", "mt1"] },
  ic8: { difficulty: "easy", priority: "very-high", tags: ["lambda", "functional-interfaces", "java8"], relatedQuestionIds: ["ic3", "st1"] },
  ic9: { difficulty: "easy", priority: "high", tags: ["lambda", "method-reference", "java8"], relatedQuestionIds: ["ic3", "ic8"] },
  g8: { difficulty: "medium", priority: "very-high", tags: ["generics", "wildcards", "pecs"], relatedQuestionIds: ["g3", "g4"] },
  g9: { difficulty: "hard", priority: "medium", tags: ["generics", "type-erasure"], relatedQuestionIds: ["g1", "g2"] },
  io8: { difficulty: "easy", priority: "very-high", tags: ["io", "try-with-resources"], relatedQuestionIds: ["e4", "io1"] },
  io9: { difficulty: "easy", priority: "high", tags: ["io", "nio"], relatedQuestionIds: ["io1", "io6"] },
  mem9: { difficulty: "medium", priority: "very-high", tags: ["gc", "jvm"], relatedQuestionIds: ["mem2", "mem1"] },
  mem10: { difficulty: "medium", priority: "high", tags: ["jvm", "class-loading", "java8"], relatedQuestionIds: ["mem6", "b2"] },
  mem11: { difficulty: "easy", priority: "very-high", tags: ["jvm", "heap", "tuning"], relatedQuestionIds: ["mem1", "mem3"] },
  st10: { difficulty: "medium", priority: "very-high", tags: ["optional", "java8", "best-practices"], relatedQuestionIds: ["st1", "b17"] },
  st11: { difficulty: "medium", priority: "high", tags: ["streams", "collectors"], relatedQuestionIds: ["st4", "st7"] },
  st12: { difficulty: "medium", priority: "high", tags: ["streams", "parallel"], relatedQuestionIds: ["st6", "st1"] },
  m31: { difficulty: "medium", priority: "high", tags: ["design-patterns", "builder"], relatedQuestionIds: ["m23", "o19"] },
  m32: { difficulty: "easy", priority: "very-high", tags: ["records", "java16"], javaVersions: ["Java 16+"], relatedQuestionIds: ["m8", "m22"] },
  m33: { difficulty: "medium", priority: "high", tags: ["cloning", "design"], relatedQuestionIds: ["m1", "m22"] },
  m34: { difficulty: "medium", priority: "very-high", tags: ["equals", "hashing"], relatedQuestionIds: ["c13", "b9", "m30"] },
  m35: { difficulty: "easy", priority: "high", tags: ["comparator", "collections"], relatedQuestionIds: ["c1", "st1"] },
  m36: { difficulty: "medium", priority: "very-high", tags: ["sealed-classes", "pattern-matching", "java17"], javaVersions: ["Java 17+"], relatedQuestionIds: ["m21", "m40"] },
  m37: { difficulty: "medium", priority: "medium", tags: ["serialization", "io"], relatedQuestionIds: ["io7", "io3"] },
  m38: { difficulty: "easy", priority: "very-high", tags: ["collections", "complexity", "hashmap"], relatedQuestionIds: ["c6", "c13"] },
  m39: { difficulty: "hard", priority: "medium", tags: ["interfaces", "java8"], relatedQuestionIds: ["o14", "o12"] },
  m40: { difficulty: "medium", priority: "very-high", tags: ["switch", "java14"], javaVersions: ["Java 14+"], relatedQuestionIds: ["m36", "m21"] },
};

export function getCoreJavaQuestionMeta(id: string): CoreJavaQuestionMeta {
  return CORE_JAVA_QUESTION_META[id] ?? {};
}

export function getCoreJavaQuestionSlug(question: InterviewQuestion): string {
  const meta = CORE_JAVA_QUESTION_META[question.id];
  if (meta?.slug) return meta.slug;
  return CORE_JAVA_SLUG_OVERRIDES[question.id] ?? slugify(question.question);
}

export function getCoreJavaQuestionDetailPath(question: InterviewQuestion): string {
  return `${JAVA_QUESTION_BASE_PATH}/${getCoreJavaQuestionSlug(question)}`;
}
