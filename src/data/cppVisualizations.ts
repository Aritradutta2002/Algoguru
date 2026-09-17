import type { Diagram } from "./recursionContent";

/* -------------------------------------------------------------------------- */
/*  C++ Interview Visualizations                                              */
/*  Scoped visualization data for C++ interview questions, keyed by            */
/*  question id — mirrors `coreJavaVisualizations`. Rendered by the existing   */
/*  shared DiagramRenderer (layers/hierarchy/flow/table-visual/graph).        */
/* -------------------------------------------------------------------------- */

export const cppVisualizations: Record<string, Diagram> = {
  /* ── C++ Basics & Compilation ── */
  cb2: {
    type: "flow",
    title: "C++ Compilation Pipeline",
    direction: "horizontal",
    data: [
      { label: "Preprocessor\n#include, #define", color: "primary" },
      { label: "Compiler\nC++ → assembly", color: "info" },
      { label: "Assembler\n.s → .o", color: "accent" },
      { label: "Linker\n.o + libs → executable", color: "warning", children: [{ label: "Resolves symbols, enforces ODR" }] },
      { label: "Load & run\nnative binary", color: "success" },
    ],
  },
  cb3: {
    type: "table-visual",
    title: "Include Guards vs #pragma once vs Modules",
    data: [
      {
        label: "#ifndef FOO_H",
        color: "info",
        children: [
          { label: "Standard, portable" },
          { label: "Boilerplate per header" },
        ],
      },
      {
        label: "#pragma once",
        color: "primary",
        children: [
          { label: "One line, universally supported" },
          { label: "Faster, no re-read" },
        ],
      },
      {
        label: "C++20 modules — import std;",
        color: "success",
        children: [
          { label: "No macro leakage" },
          { label: "Faster builds, better isolation" },
        ],
      },
    ],
  },
  cb7: {
    type: "table-visual",
    title: "Static vs Dynamic Linking",
    data: [
      {
        label: "Static linking",
        color: "primary",
        children: [
          { label: "Library code copied into the binary" },
          { label: "Bigger binary, zero runtime deps" },
        ],
      },
      {
        label: "Dynamic linking",
        color: "info",
        children: [
          { label: ".so / .dll loaded at startup" },
          { label: "Smaller binary, shared in RAM" },
          { label: "ABI must match — fragile" },
        ],
      },
    ],
  },
  cb12: {
    type: "flow",
    title: "Static Initialization Order Fiasco — Fix",
    direction: "vertical",
    data: [
      {
        label: "Fiasco: global A uses global B from another TU",
        color: "warning",
        children: [{ label: "Order across TUs is undefined → crash" }],
      },
      {
        label: "Fix: Construct-on-first-use",
        color: "success",
        children: [
          { label: "T& getB() { static T b; return b; }" },
          { label: "Function-local static init is thread-safe (C++11)" },
        ],
      },
      {
        label: "Alternative: constexpr / constinit",
        color: "info",
        children: [{ label: "Constant initialization — no order problem at all" }],
      },
    ],
  },
  /* ── Memory Management & RAII ── */
  mm1: {
    type: "layers",
    title: "C++ Process Memory Layout",
    data: [
      { label: "Code / Text — instructions, read-only", color: "muted" },
      {
        label: "Data — initialized globals/statics",
        color: "info",
        children: [{ label: "BSS — zero-initialized globals (implicit 0)" }],
      },
      {
        label: "Heap — new/malloc, grows up",
        color: "warning",
        children: [{ label: "Managed by allocator • RAII ties lifetime to scope" }],
      },
      {
        label: "Stack — frames, locals, grows down",
        color: "success",
        children: [{ label: "Auto-freed on scope exit • limited (1–8 MB)" }],
      },
    ],
  },
  mm2: {
    type: "table-visual",
    title: "new/delete vs malloc/free",
    data: [
      {
        label: "new / delete — typed C++ operators",
        color: "primary",
        children: [
          { label: "Allocate + construct / destruct" },
          { label: "Throw std::bad_alloc on failure" },
          { label: "new ↔ delete, new[] ↔ delete[] (mixing = UB)" },
        ],
      },
      {
        label: "malloc / free — raw C functions",
        color: "info",
        children: [
          { label: "Bytes only — no construction" },
          { label: "Return nullptr on failure" },
          { label: "Avoid today — use containers / smart pointers" },
        ],
      },
    ],
  },
  mm3: {
    type: "flow",
    title: "RAII — Resource Acquisition Is Initialization",
    direction: "vertical",
    data: [
      { label: "Constructor acquires the resource", color: "primary", children: [{ label: "lock mutex • open file • allocate" }] },
      { label: "Object used normally in scope", color: "info" },
      { label: "Destructor releases — deterministic", color: "success", children: [{ label: "Scope exit OR exception unwinding" }] },
      {
        label: "Examples",
        color: "accent",
        children: [{ label: "std::lock_guard, unique_ptr, vector, fstream" }],
      },
    ],
  },
  mm6: {
    type: "table-visual",
    title: "unique_ptr vs shared_ptr vs weak_ptr",
    data: [
      {
        label: "unique_ptr — default choice",
        color: "success",
        children: [{ label: "Exclusive ownership, zero overhead" }, { label: "Move-only • make_unique (C++14)" }],
      },
      {
        label: "shared_ptr — true sharing only",
        color: "primary",
        children: [{ label: "Atomic ref-count + control block" }, { label: "make_shared preferred • cycles leak" }],
      },
      {
        label: "weak_ptr — non-owning observer",
        color: "info",
        children: [{ label: "Breaks cycles, safe caches" }, { label: "lock() to get a shared_ptr" }],
      },
    ],
  },
  mm7: {
    type: "flow",
    title: "Move Semantics — steal, don't copy",
    direction: "horizontal",
    data: [
      { label: "lvalue — named, has address", color: "info" },
      { label: "rvalue — expiring temporary", color: "warning" },
      { label: "std::move — cast to rvalue ref (T&&)", color: "accent" },
      { label: "Move ctor steals the pointer", color: "primary", children: [{ label: "Source left in valid, empty state" }] },
      { label: "std::forward — preserves category", color: "success", children: [{ label: "Perfect forwarding in templates" }] },
    ],
  },
  /* ── STL — Containers & Algorithms ── */
  stl1: {
    type: "layers",
    title: "STL — Four Pillars, One Philosophy",
    data: [
      {
        label: "Containers — own the data",
        color: "primary",
        children: [{ label: "Sequence: vector, deque, list, array" }, { label: "Associative: map, set • Unordered: unordered_map, unordered_set" }, { label: "Adapters: stack, queue, priority_queue" }],
      },
      {
        label: "Iterators — traverse any container",
        color: "info",
        children: [{ label: "Random-access → bidirectional → forward" }],
      },
      {
        label: "Algorithms — work on iterator ranges",
        color: "accent",
        children: [{ label: "sort, find, transform, accumulate — container-agnostic" }],
      },
      {
        label: "Allocators — memory policy",
        color: "muted",
        children: [{ label: "Rarely customized • pair / tuple / optional helpers" }],
      },
    ],
  },
  stl2: {
    type: "table-visual",
    title: "vector vs array vs list vs deque",
    data: [
      {
        label: "vector<T> — default choice",
        color: "success",
        children: [{ label: "Contiguous, cache-friendly" }, { label: "O(1) random access, amortized push_back" }, { label: "Middle insert O(n) • reserve() to avoid realloc" }],
      },
      {
        label: "array<T,N> — fixed size",
        color: "info",
        children: [{ label: "Stack-allocated, zero heap overhead" }, { label: "No growth — size is compile-time" }],
      },
      {
        label: "list<T> — doubly-linked",
        color: "warning",
        children: [{ label: "O(1) splice / insert with iterator" }, { label: "No random access • cache-unfriendly" }],
      },
      {
        label: "deque<T> — double-ended",
        color: "accent",
        children: [{ label: "O(1) push front + back" }, { label: "Contiguous blocks, moderate random access" }],
      },
    ],
  },
  stl3: {
    type: "table-visual",
    title: "map vs unordered_map vs set",
    data: [
      {
        label: "map — ordered (red-black)",
        color: "primary",
        children: [{ label: "Sorted by key • O(log n)" }, { label: "Range queries • needs operator<" }],
      },
      {
        label: "unordered_map — hash table",
        color: "success",
        children: [{ label: "Avg O(1), worst O(n)" }, { label: "Unordered • needs hash + equality" }],
      },
      {
        label: "set — key is the value",
        color: "info",
        children: [{ label: "Unique sorted elements" }, { label: "multimap / multiset allow duplicates" }],
      },
    ],
  },
  stl4: {
    type: "table-visual",
    title: "Iterator Invalidation Rules",
    data: [
      {
        label: "vector",
        color: "warning",
        children: [{ label: "Reallocation invalidates ALL" }, { label: "Insert/erase voids at/after point" }, { label: "reserve() / pre-size to protect" }],
      },
      {
        label: "deque",
        color: "warning",
        children: [{ label: "Insert/erase invalidates ALL" }, { label: "push front/back only voids iterators" }],
      },
      {
        label: "list / map / set",
        color: "success",
        children: [{ label: "Only the erased element dies" }, { label: "All other iterators stay valid" }],
      },
      {
        label: "unordered_map",
        color: "accent",
        children: [{ label: "Rehash invalidates ALL" }, { label: "reserve() to size buckets up front" }],
      },
    ],
  },
  stl5: {
    type: "table-visual",
    title: "Core <algorithm> Complexities",
    data: [
      {
        label: "sort — O(n log n)",
        color: "primary",
        children: [{ label: "Introsort (quick + heap + insertion)" }, { label: "stable_sort preserves order" }],
      },
      {
        label: "Search — know the requirement",
        color: "info",
        children: [{ label: "find O(n) — unsorted" }, { label: "binary_search O(log n) — sorted only" }, { label: "lower_bound / upper_bound O(log n)" }],
      },
      {
        label: "Transform & fold",
        color: "success",
        children: [{ label: "transform O(n) — map each element" }, { label: "accumulate O(n) — reduce to one value" }, { label: "C++20 ranges: piped lazy views" }],
      },
    ],
  },
  /* ── OOP in C++ ── */
  oc2: {
    type: "flow",
    title: "virtual Dispatch — Runtime Polymorphism",
    direction: "vertical",
    data: [
      { label: "Base* b = new Derived;", color: "primary" },
      { label: "b->draw() — static type Base*", color: "info" },
      { label: "vtable lookup on dynamic type", color: "accent", children: [{ label: "One vptr per object • one vtable per class" }] },
      { label: "Derived::draw() executes", color: "success" },
      {
        label: "Rules",
        color: "warning",
        children: [{ label: "override needs matching signature" }, { label: "Base dtor must be virtual • use override + final" }],
      },
    ],
  },
  oc4: {
    type: "hierarchy",
    title: "Inheritance Access & the Diamond",
    data: [
      {
        label: "public — is-a (the norm)",
        color: "success",
        children: [{ label: "Dog is-an Animal • interface preserved" }],
      },
      {
        label: "protected / private — implemented-in-terms-of",
        color: "warning",
        children: [{ label: "Rare • usually prefer composition" }],
      },
      {
        label: "Diamond — D inherits B and C, both inherit A",
        color: "accent",
        children: [{ label: "Two A subobjects → ambiguity" }, { label: "Fix: virtual inheritance — one shared A" }],
      },
    ],
  },
  /* ── Constructors, Destructors, Copy/Move ── */
  cd2: {
    type: "table-visual",
    title: "Shallow vs Deep Copy",
    data: [
      {
        label: "Shallow copy — danger",
        color: "warning",
        children: [{ label: "Copies the pointer only" }, { label: "Two owners, one buffer" }, { label: "Double free → heap corruption" }],
      },
      {
        label: "Deep copy — safe",
        color: "success",
        children: [{ label: "Allocates new buffer, copies content" }, { label: "Copy ctor + copy assign do this" }],
      },
      {
        label: "Move — steal",
        color: "primary",
        children: [{ label: "Pilfer pointer, null the source" }, { label: "Move ctor + move assign" }],
      },
    ],
  },
  /* ── Exceptions ── */
  ex1: {
    type: "flow",
    title: "throw → unwind → catch",
    direction: "vertical",
    data: [
      { label: "throw expr; — exception object constructed", color: "primary" },
      { label: "Stack unwinds — dtors run (RAII cleanup)", color: "accent", children: [{ label: "Every scope's locals destroyed in order" }] },
      { label: "catch (const E& e) — by const ref", color: "success", children: [{ label: "Throw by value, catch by reference" }, { label: "Bare throw; rethrows, preserves type" }] },
      { label: "No match → std::terminate", color: "warning" },
    ],
  },
  /* ── Concurrency ── */
  cc1: {
    type: "table-visual",
    title: "std::thread vs async vs jthread",
    data: [
      {
        label: "std::thread — raw",
        color: "primary",
        children: [{ label: "std::thread t(fn, args…)" }, { label: "MUST join() or detach() before dtor" }, { label: "Otherwise std::terminate" }],
      },
      {
        label: "std::async — task + future",
        color: "info",
        children: [{ label: "Returns future<T> with result / exception" }, { label: "packaged_task for deferred execution" }],
      },
      {
        label: "std::jthread — C++20, safer",
        color: "success",
        children: [{ label: "Auto-joins in destructor" }, { label: "stop_token for cooperative cancel" }],
      },
    ],
  },
  cc2: {
    type: "table-visual",
    title: "Mutex Wrappers — pick the smallest",
    data: [
      {
        label: "lock_guard — default",
        color: "success",
        children: [{ label: "Scoped RAII lock, minimal" }, { label: "Non-movable, lives till scope end" }],
      },
      {
        label: "unique_lock — flexible",
        color: "primary",
        children: [{ label: "Movable, defer / try / unlock early" }, { label: "Required by condition_variable" }],
      },
      {
        label: "scoped_lock (C++17) — many mutexes",
        color: "accent",
        children: [{ label: "Locks several mutexes atomically" }, { label: "Deadlock-avoidance by construction" }],
      },
    ],
  },
  cc3: {
    type: "table-visual",
    title: "Data Race vs Race Condition vs Deadlock",
    data: [
      {
        label: "Data race — UB",
        color: "warning",
        children: [{ label: "Unsynchronized access, one is a write" }, { label: "Fix: mutex / atomics" }],
      },
      {
        label: "Race condition — logic bug, not UB",
        color: "accent",
        children: [{ label: "Output depends on scheduling" }, { label: "Sync is correct, order is surprising" }],
      },
      {
        label: "Deadlock — cyclic waiting",
        color: "info",
        children: [{ label: "A waits B's lock, B waits A's" }, { label: "Fix: lock ordering, scoped_lock" }],
      },
    ],
  },
  /* __NEXT__ */
};
