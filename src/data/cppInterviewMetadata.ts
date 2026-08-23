import type { InterviewQuestion, InterviewTopic } from "@/data/coreJavaInterviewData";

export type Difficulty = "easy" | "medium" | "hard";
export type InterviewPriority = "low" | "medium" | "high" | "very-high";

export interface CppQuestionMeta {
  slug?: string;
  difficulty?: Difficulty;
  priority?: InterviewPriority;
  tags?: string[];
  relatedQuestionIds?: string[];
  estimatedReadMinutes?: number;
  cppVersions?: string[];
}

export interface CppQuestionEntry {
  question: InterviewQuestion;
  topic: InterviewTopic;
  index: number;
  slug: string;
  meta: CppQuestionMeta;
}

export const CPP_QUESTION_BASE_PATH = "/interview/cpp/language-questions";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const CPP_SLUG_OVERRIDES: Record<string, string> = {
  cb1: "what-is-cpp-key-features",
  cb2: "cpp-compilation-pipeline",
  cb5: "declaration-vs-definition-odr",
  mm1: "cpp-memory-layout",
  mm3: "raii-explained",
  mm6: "smart-pointers-unique-shared-weak",
  mm7: "move-semantics-rvalue-std-move",
  pr1: "pointer-vs-reference-nullptr",
  oc2: "virtual-functions-polymorphism",
  oc3: "abstract-class-pure-virtual-interface",
  oc4: "inheritance-types-diamond-problem",
  oc5: "object-slicing",
  cd2: "copy-vs-move-deep-copy",
  cd3: "rule-of-three-five-zero",
  cd4: "virtual-destructor",
  stl2: "vector-vs-array-list-deque",
  stl3: "map-vs-unordered-map-set",
  stl4: "iterator-invalidation",
  tp1: "function-class-templates",
  tp5: "cpp20-concepts",
  ex1: "throw-try-catch-unwinding",
  ex2: "noexcept-guarantee",
  cc2: "mutex-lock-guard-unique-scoped",
  cc4: "atomic-memory-ordering",
  mx6: "lambdas-captures-mutable",
  mx7: "constexpr-consteval-constinit",
  tl6: "adl-argument-dependent-lookup",
  mc1: "const-correctness",
  mc2: "operator-overloading-rules",
  mc5: "undefined-behavior-types",
  mc6: "pimpl-idiom",
};

export const CPP_QUESTION_META: Record<string, CppQuestionMeta> = {
  cb1: { difficulty: "easy", priority: "very-high", tags: ["basics", "features"] },
  cb2: { difficulty: "medium", priority: "very-high", tags: ["tooling", "pipeline"] },
  cb3: { difficulty: "easy", priority: "high", tags: ["headers", "tooling"] },
  cb4: { difficulty: "easy", priority: "medium", tags: ["namespaces"] },
  cb5: { difficulty: "medium", priority: "high", tags: ["odr", "linkage"] },
  cb6: { difficulty: "easy", priority: "medium", tags: ["tooling", "compiler"] },
  cb7: { difficulty: "medium", priority: "medium", tags: ["linking", "tooling"] },
  cb8: { difficulty: "easy", priority: "medium", tags: ["basics", "entry-point"] },

  mm1: { difficulty: "medium", priority: "very-high", tags: ["memory", "layout"] },
  mm2: { difficulty: "medium", priority: "very-high", tags: ["memory", "allocation"] },
  mm3: { difficulty: "medium", priority: "very-high", tags: ["raii", "memory"] },
  mm4: { difficulty: "easy", priority: "high", tags: ["memory", "stack-heap"] },
  mm5: { difficulty: "medium", priority: "very-high", tags: ["memory", "safety"] },
  mm6: { difficulty: "medium", priority: "very-high", tags: ["memory", "smart-pointers"] },
  mm7: { difficulty: "hard", priority: "very-high", tags: ["memory", "move-semantics"] },
  mm8: { difficulty: "hard", priority: "medium", tags: ["memory", "placement-new"] },

  pr1: { difficulty: "easy", priority: "very-high", tags: ["pointers", "references"] },
  pr2: { difficulty: "medium", priority: "very-high", tags: ["pointers", "dangling"] },
  pr3: { difficulty: "easy", priority: "high", tags: ["pointers", "const"] },
  pr4: { difficulty: "medium", priority: "medium", tags: ["pointers", "callable"] },
  pr5: { difficulty: "easy", priority: "medium", tags: ["pointers", "arithmetic"] },
  pr6: { difficulty: "easy", priority: "low", tags: ["pointers", "double-pointer"] },

  oc1: { difficulty: "easy", priority: "high", tags: ["oop", "class-struct"] },
  oc2: { difficulty: "medium", priority: "very-high", tags: ["oop", "polymorphism"] },
  oc3: { difficulty: "easy", priority: "high", tags: ["oop", "abstract"] },
  oc4: { difficulty: "hard", priority: "high", tags: ["oop", "inheritance", "diamond"] },
  oc5: { difficulty: "medium", priority: "very-high", tags: ["oop", "slicing"] },
  oc6: { difficulty: "medium", priority: "medium", tags: ["oop", "static-vs-dynamic"] },
  oc7: { difficulty: "easy", priority: "medium", tags: ["oop", "friend"] },

  cd1: { difficulty: "easy", priority: "high", tags: ["constructors"] },
  cd2: { difficulty: "medium", priority: "very-high", tags: ["copy-move"] },
  cd3: { difficulty: "medium", priority: "very-high", tags: ["rule-3-5-0"] },
  cd4: { difficulty: "easy", priority: "very-high", tags: ["destructor"] },
  cd5: { difficulty: "easy", priority: "high", tags: ["explicit", "delete"] },
  cd6: { difficulty: "medium", priority: "medium", tags: ["elision", "rvo"] },
  cd7: { difficulty: "easy", priority: "medium", tags: ["initialization"] },

  stl1: { difficulty: "easy", priority: "very-high", tags: ["stl", "overview"] },
  stl2: { difficulty: "medium", priority: "very-high", tags: ["stl", "containers"] },
  stl3: { difficulty: "medium", priority: "very-high", tags: ["stl", "maps"] },
  stl4: { difficulty: "medium", priority: "very-high", tags: ["stl", "iterators"] },
  stl5: { difficulty: "easy", priority: "high", tags: ["stl", "algorithms"] },
  stl6: { difficulty: "easy", priority: "high", tags: ["stl", "strings"] },
  stl7: { difficulty: "easy", priority: "medium", tags: ["stl", "adapters"] },
  stl8: { difficulty: "medium", priority: "medium", tags: ["stl", "custom-types"] },

  tp1: { difficulty: "easy", priority: "very-high", tags: ["templates"] },
  tp2: { difficulty: "medium", priority: "medium", tags: ["templates", "specialization"] },
  tp3: { difficulty: "medium", priority: "medium", tags: ["templates", "variadic"] },
  tp4: { difficulty: "hard", priority: "medium", tags: ["templates", "sfinae"] },
  tp5: { difficulty: "medium", priority: "very-high", tags: ["templates", "concepts", "cpp20"], cppVersions: ["C++20+"] },
  tp6: { difficulty: "easy", priority: "medium", tags: ["templates", "macros"] },

  ex1: { difficulty: "easy", priority: "very-high", tags: ["exceptions"] },
  ex2: { difficulty: "medium", priority: "high", tags: ["exceptions", "noexcept"] },
  ex3: { difficulty: "medium", priority: "medium", tags: ["exceptions", "error-handling"] },
  ex4: { difficulty: "easy", priority: "high", tags: ["exceptions", "destructor"] },

  cc1: { difficulty: "easy", priority: "very-high", tags: ["concurrency", "threads"] },
  cc2: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "mutex"] },
  cc3: { difficulty: "medium", priority: "very-high", tags: ["concurrency", "races"] },
  cc4: { difficulty: "hard", priority: "high", tags: ["concurrency", "atomics"] },
  cc5: { difficulty: "medium", priority: "high", tags: ["concurrency", "condition-variable"] },
  cc6: { difficulty: "medium", priority: "medium", tags: ["concurrency", "future-promise"] },

  mx1: { difficulty: "easy", priority: "very-high", tags: ["modern", "cpp11"] },
  mx2: { difficulty: "easy", priority: "medium", tags: ["modern", "cpp14"] },
  mx3: { difficulty: "medium", priority: "very-high", tags: ["modern", "cpp17"] },
  mx4: { difficulty: "medium", priority: "high", tags: ["modern", "cpp20"], cppVersions: ["C++20+"] },
  mx5: { difficulty: "easy", priority: "medium", tags: ["modern", "auto"] },
  mx6: { difficulty: "medium", priority: "very-high", tags: ["modern", "lambda"] },
  mx7: { difficulty: "medium", priority: "high", tags: ["modern", "constexpr"] },
  mx8: { difficulty: "medium", priority: "high", tags: ["modern", "span", "string_view"] },

  tl1: { difficulty: "easy", priority: "medium", tags: ["tooling", "macros"] },
  tl2: { difficulty: "medium", priority: "high", tags: ["tooling", "inline"] },
  tl3: { difficulty: "easy", priority: "medium", tags: ["tooling", "const"] },
  tl4: { difficulty: "medium", priority: "medium", tags: ["tooling", "linkage"] },
  tl5: { difficulty: "medium", priority: "medium", tags: ["tooling", "sfinae"] },
  tl6: { difficulty: "hard", priority: "medium", tags: ["tooling", "adl"] },

  mc1: { difficulty: "easy", priority: "very-high", tags: ["misc", "const"] },
  mc2: { difficulty: "medium", priority: "high", tags: ["misc", "operator"] },
  mc3: { difficulty: "easy", priority: "high", tags: ["misc", "static"] },
  mc4: { difficulty: "medium", priority: "medium", tags: ["misc", "idioms"] },
  mc5: { difficulty: "medium", priority: "very-high", tags: ["misc", "ub"] },
  mc6: { difficulty: "medium", priority: "medium", tags: ["misc", "pimpl"] },
  mc7: { difficulty: "easy", priority: "medium", tags: ["misc", "slicing"] },
  mc8: { difficulty: "easy", priority: "medium", tags: ["misc", "volatile"] },
  mc9: { difficulty: "easy", priority: "medium", tags: ["misc", "performance"] },
  mc10: { difficulty: "easy", priority: "very-high", tags: ["misc", "checklist"] },
cb9: { difficulty: "hard", priority: "high", tags: ["tooling", "odr"] },
  cb10: { difficulty: "easy", priority: "medium", tags: ["tooling", "header-only"] },
  cb11: { difficulty: "hard", priority: "medium", tags: ["templates", "lookup"] },
  cb12: { difficulty: "medium", priority: "high", tags: ["tooling", "initialization"] },
  cb13: { difficulty: "medium", priority: "medium", tags: ["tooling", "abi"] },
  cb14: { difficulty: "easy", priority: "medium", tags: ["tooling", "linkage"] },

  mm9: { difficulty: "hard", priority: "very-high", tags: ["memory", "smart-pointers"] },
  mm10: { difficulty: "medium", priority: "high", tags: ["memory", "smart-pointers"] },
  mm11: { difficulty: "medium", priority: "high", tags: ["memory", "alignment"] },
  mm12: { difficulty: "medium", priority: "medium", tags: ["memory", "optimization"] },
  mm13: { difficulty: "medium", priority: "medium", tags: ["memory", "allocator"] },
  mm14: { difficulty: "easy", priority: "medium", tags: ["memory", "tooling"] },

  pr7: { difficulty: "hard", priority: "very-high", tags: ["pointers", "forwarding"] },
  pr8: { difficulty: "medium", priority: "medium", tags: ["pointers", "member-pointer"] },
  pr9: { difficulty: "medium", priority: "very-high", tags: ["pointers", "views"] },
  pr10: { difficulty: "medium", priority: "high", tags: ["memory", "move"] },
  pr11: { difficulty: "easy", priority: "medium", tags: ["pointers", "guidelines"] },
  pr12: { difficulty: "medium", priority: "medium", tags: ["pointers", "decltype"] },

  oc8: { difficulty: "hard", priority: "medium", tags: ["oop", "vtable", "ebo"] },
  oc9: { difficulty: "medium", priority: "very-high", tags: ["oop", "destructor"] },
  oc10: { difficulty: "medium", priority: "medium", tags: ["oop", "covariant"] },
  oc11: { difficulty: "hard", priority: "medium", tags: ["oop", "multiple-inheritance"] },
  oc12: { difficulty: "medium", priority: "medium", tags: ["oop", "crtp"] },
  oc13: { difficulty: "easy", priority: "medium", tags: ["oop", "final"] },

  cd8: { difficulty: "medium", priority: "high", tags: ["constructors", "initialization"] },
  cd9: { difficulty: "hard", priority: "high", tags: ["constructors", "elision"] },
  cd10: { difficulty: "medium", priority: "medium", tags: ["constructors", "inheritance"] },
  cd11: { difficulty: "easy", priority: "medium", tags: ["constructors", "explicit"] },
  cd12: { difficulty: "medium", priority: "high", tags: ["constructors", "exceptions"] },
  cd13: { difficulty: "medium", priority: "medium", tags: ["constructors", "traits"] },
  cd14: { difficulty: "easy", priority: "medium", tags: ["constructors", "initialization"] },

  stl9: { difficulty: "medium", priority: "high", tags: ["stl", "vector"] },
  stl10: { difficulty: "medium", priority: "high", tags: ["stl", "emplace"] },
  stl11: { difficulty: "medium", priority: "medium", tags: ["stl", "iterators"] },
  stl12: { difficulty: "hard", priority: "very-high", tags: ["stl", "hash"] },
  stl13: { difficulty: "medium", priority: "high", tags: ["stl", "ordered"] },
  stl14: { difficulty: "medium", priority: "high", tags: ["stl", "ranges", "cpp20"], cppVersions: ["C++20+"] },
  stl15: { difficulty: "medium", priority: "medium", tags: ["stl", "flat", "cpp23"], cppVersions: ["C++23+"] },
  stl16: { difficulty: "hard", priority: "medium", tags: ["stl", "allocator"] },

  tp7: { difficulty: "hard", priority: "high", tags: ["templates", "forwarding"] },
  tp8: { difficulty: "medium", priority: "medium", tags: ["templates", "nttp"] },
  tp9: { difficulty: "medium", priority: "medium", tags: ["templates", "template-template"] },
  tp10: { difficulty: "hard", priority: "medium", tags: ["templates", "crtp"] },
  tp11: { difficulty: "easy", priority: "medium", tags: ["templates", "alias"] },
  tp12: { difficulty: "medium", priority: "medium", tags: ["templates", "build"] },

  ex5: { difficulty: "medium", priority: "high", tags: ["exceptions", "slicing"] },
  ex6: { difficulty: "medium", priority: "medium", tags: ["exceptions", "constructors"] },
  ex7: { difficulty: "hard", priority: "medium", tags: ["exceptions", "noexcept"] },
  ex8: { difficulty: "hard", priority: "medium", tags: ["exceptions", "nested"] },

  cc7: { difficulty: "hard", priority: "high", tags: ["concurrency", "memory-model"] },
  cc8: { difficulty: "medium", priority: "high", tags: ["concurrency", "queue"] },
  cc9: { difficulty: "medium", priority: "medium", tags: ["concurrency", "rwlock"] },
  cc10: { difficulty: "hard", priority: "medium", tags: ["concurrency", "false-sharing"] },
  cc11: { difficulty: "hard", priority: "high", tags: ["concurrency", "thread-pool"] },
  cc12: { difficulty: "hard", priority: "medium", tags: ["concurrency", "lock-free"] },

  mx9: { difficulty: "medium", priority: "high", tags: ["modern", "variant"] },
  mx10: { difficulty: "medium", priority: "medium", tags: ["modern", "optional"] },
  mx11: { difficulty: "easy", priority: "medium", tags: ["modern", "filesystem"] },
  mx12: { difficulty: "easy", priority: "medium", tags: ["modern", "format"] },
  mx13: { difficulty: "hard", priority: "medium", tags: ["modern", "coroutines", "cpp20"], cppVersions: ["C++20+"] },
  mx14: { difficulty: "hard", priority: "medium", tags: ["modern", "deducing-this", "cpp23"], cppVersions: ["C++23+"] },

  tl7: { difficulty: "easy", priority: "medium", tags: ["tooling", "cmake"] },
  tl8: { difficulty: "easy", priority: "medium", tags: ["tooling", "clang-tidy"] },
  tl9: { difficulty: "hard", priority: "medium", tags: ["tooling", "adl"] },
  tl10: { difficulty: "medium", priority: "medium", tags: ["tooling", "odr"] },
  tl11: { difficulty: "medium", priority: "medium", tags: ["tooling", "visibility"] },
  tl12: { difficulty: "medium", priority: "medium", tags: ["tooling", "diagnostics"] },

  mc11: { difficulty: "medium", priority: "high", tags: ["misc", "spaceship", "cpp20"], cppVersions: ["C++20+"] },
  mc12: { difficulty: "easy", priority: "medium", tags: ["misc", "literals"] },
  mc13: { difficulty: "easy", priority: "medium", tags: ["misc", "any"] },
  mc14: { difficulty: "easy", priority: "medium", tags: ["misc", "bit"] },
  mc15: { difficulty: "medium", priority: "medium", tags: ["misc", "patterns"] },
  mc16: { difficulty: "medium", priority: "high", tags: ["misc", "exception-safety"] },
  mc17: { difficulty: "easy", priority: "medium", tags: ["misc", "const"] },
  mc18: { difficulty: "medium", priority: "medium", tags: ["misc", "pimpl"] },
  mc19: { difficulty: "medium", priority: "medium", tags: ["misc", "vector-bool"] },
  mc20: { difficulty: "easy", priority: "very-high", tags: ["misc", "checklist"] },
};

export function getCppQuestionMeta(id: string): CppQuestionMeta {
  return CPP_QUESTION_META[id] ?? {};
}
export function getCppQuestionSlug(question: InterviewQuestion): string {
  const meta = CPP_QUESTION_META[question.id];
  if (meta?.slug) return meta.slug;
  return CPP_SLUG_OVERRIDES[question.id] ?? slugify(question.question);
}
export function getCppQuestionDetailPath(question: InterviewQuestion): string {
  return `${CPP_QUESTION_BASE_PATH}/${getCppQuestionSlug(question)}`;
}
