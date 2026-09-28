# Spring Boot & Backend Engineering Interview Track

> **Status:** shipped on branch `arena/01a0e35f-algoguru`
> **Route:** `/interview/java/spring-boot`
> **Audience:** Java / Spring Boot developers with **3–4 years of experience**

This document is the complete record of what was built, why it was built that way, and how to
extend or verify it.

---

## 1. Goal

Turn AlgoGuru into a genuinely complete interview-preparation resource for a mid-level Java
backend engineer. The brief called for **Questions + complete Answers + Practice-with-Problems**,
with explicit coverage of:

1. All Spring Boot and Java annotations — every annotation, **how it works internally**, plus theory
2. **How HashMap works internally**
3. **Full complete theory for Spring Security and JWT**
4. **Java Collection Framework**
5. **Java Multithreading** — full set of questions and answers with theory

A hard requirement was that answers be *complete*, not summaries — long enough that a candidate
can read one and then say it out loud in an interview.

---

## 2. What shipped, in numbers

| Deliverable | Count | Detail |
| --- | --- | --- |
| Interview questions | **138** (`b001`–`b138`) | 8 topics, every one with a full answer |
| Total answer prose | **34,595 words** | avg 251 per answer, min 188, max 345 |
| Code samples | **138** (100%) | 8,846 lines, avg 64 per sample — `java`, `yaml`, `xml` |
| Follow-up questions | **276** | 2–4 per question, the drill-downs an interviewer actually asks |
| Annotation catalogue | **155 entries** | 16 categories, each with runtime internals + a gotcha |
| Practice problems | **41** (`p01`–`p41`) | ~21 hours (1,255 min) of hands-on work |
| Practice content | 164 acceptance criteria, 122 hints, 6,106 solution lines | avg 149-line worked solution |
| Distinct search tags | 338 | powers filtering + the scored search |
| New automated tests | **28** | 17 data-integrity, 11 page render/interaction |

### Topic breakdown

| Topic id | Q | Id range | Easy/Med/Hard | Must-know | Practice |
| --- | --- | --- | --- | --- | --- |
| `java-annotations` | 16 | `b001`–`b016` | 4 / 7 / 5 | 6 | 4 (`p01`–`p04`) |
| `spring-annotations` | 20 | `b017`–`b036` | 8 / 8 / 4 | 9 | 4 (`p05`–`p08`) |
| `spring-boot-core` | 10 | `b037`–`b046` | 0 / 5 / 5 | 3 | 4 (`p09`–`p12`) |
| `collections` | 20 | `b047`–`b066` | 6 / 11 / 3 | 8 | 6 (`p13`–`p18`) |
| `hashmap-internals` | 14 | `b067`–`b080` | 2 / 6 / 6 | 11 | 5 (`p19`–`p23`) |
| `multithreading` | 26 | `b081`–`b106` | 1 / 15 / 10 | 14 | 8 (`p24`–`p31`) |
| `spring-security` | 18 | `b107`–`b124` | 0 / 13 / 5 | 10 | 5 (`p32`–`p36`) |
| `jwt` | 14 | `b125`–`b138` | 1 / 6 / 7 | 10 | 5 (`p37`–`p41`) |
| **Total** | **138** | | **22 / 71 / 45** | **71** | **41** |

Practice difficulty split: 7 easy, 20 medium, 14 hard.

---

## 3. Content coverage

### 3.1 Java Annotations — theory & internals (16 Q)

What an annotation *is* at the bytecode level (`RuntimeVisibleAnnotations` attributes), the three
retention policies and why `CLASS` is the surprising default, `@Target` and `ElementType`, the
meta-annotations (`@Retention`, `@Target`, `@Inherited`, `@Documented`, `@Repeatable`), annotation
attribute rules and defaults, type annotations (JSR-308), repeatable annotations and the generated
container, reading annotations reflectively, annotation processors vs runtime reflection, why
annotations are interfaces, `@Inherited`'s limits, and `AnnotatedElement` traversal.

### 3.2 Spring & Spring Boot annotations (20 Q)

`@Component` vs `@Bean` and when each wins, the stereotype hierarchy and what `@Service` really
adds, component scanning mechanics, `@Autowired` resolution order (type → `@Qualifier` →
`@Primary` → name), constructor vs field injection, `@Transactional` and the **proxy boundary**
(self-invocation, `private` methods, `proxyTargetClass`), propagation and isolation, `@Value` vs
`@ConfigurationProperties`, SpEL, `@Profile`, the `@ConditionalOnX` family, `@Scheduled`,
`@Async` and its proxy caveats, `@ControllerAdvice`, `@Lazy`, `@DependsOn`, `@Order` vs
`@Priority`, and the full `@SpringBootApplication` expansion.

### 3.3 Spring Boot internals & auto-configuration (10 Q)

The startup sequence from `SpringApplication.run` to a ready `ApplicationContext`, how
auto-configuration candidates are discovered (`AutoConfiguration.imports`, formerly
`spring.factories`), `@ConditionalOnMissingBean` ordering and why *your* bean wins, starters and
dependency management, the 17-level property precedence chain, profile-specific config and
`spring.config.import`, embedded server selection, Actuator, graceful shutdown, and how to debug
"why did this bean not get created" with the condition evaluation report.

### 3.4 Java Collection Framework (20 Q)

The full interface hierarchy, `ArrayList` vs `LinkedList` with real memory/locality numbers,
growth policy and `ensureCapacity`, `Vector`/`Stack` and why they are legacy, `HashSet` vs
`LinkedHashSet` vs `TreeSet`, `Comparable` vs `Comparator`, `Queue`/`Deque`/`ArrayDeque`,
`PriorityQueue` and heap behaviour, fail-fast vs fail-safe iterators and `ConcurrentModificationException`,
`Collections.unmodifiableX` vs `List.of` vs `Arrays.asList`, `equals`/`hashCode` contract,
`Iterator.remove`, `subList` views, `EnumMap`/`EnumSet`, `NavigableMap`, `IdentityHashMap`,
`WeakHashMap`, `CopyOnWriteArrayList`, and choosing a collection under a stated access pattern.

### 3.5 HashMap internals (14 Q)

End-to-end `put`/`get`/`remove`, the bucket array of `Node`s, hash spreading (`h ^ (h >>> 16)`)
and why it exists, power-of-two capacity and the `(n - 1) & hash` bitmask, collision chaining,
**treeification** at `TREEIFY_THRESHOLD = 8` *and* `MIN_TREEIFY_CAPACITY = 64` (and untreeify at 6),
resize and rehash-splitting into lo/hi lists, load factor trade-offs, the Java 7 → 8 changes
(tail insertion, the infinite-loop race that tail insertion fixed), `hashCode`/`equals` contract
violations and mutable keys, null key/value handling, `HashMap` vs `Hashtable` vs
`ConcurrentHashMap`, `LinkedHashMap` and LRU via `removeEldestEntry`, and memory footprint.

### 3.6 Java Multithreading (26 Q)

*Fundamentals:* thread states and lifecycle, the Java Memory Model and happens-before, `volatile`
semantics and its limits, `synchronized` vs `ReentrantLock`, `wait`/`notify` and the guarded-wait
idiom, deadlock (detection, prevention, lock ordering), CAS / `AtomicX` / `LongAdder`,
interruption as cooperative cancellation, `ThreadLocal` leaks in pooled threads, false sharing and
`@Contended`, `CountDownLatch` / `CyclicBarrier` / `Semaphore` / `Phaser`, thread-safety
strategies, `ReadWriteLock` vs `StampedLock`, and debugging a stuck thread in production.

*Applied:* the exact `ThreadPoolExecutor` core/queue/max algorithm (and why an unbounded queue
means `maximumPoolSize` is dead code), `Future` → `CompletableFuture` composition,
ForkJoinPool and work stealing, **virtual threads** and pinning (Java 21), `BlockingQueue`
producer-consumer, `ConcurrentHashMap` internals (bin-level locking, `computeIfAbsent`),
Spring `@Async` and executor configuration, optimistic vs pessimistic DB locking, Amdahl's law
and Little's law for sizing, testing concurrency (jcstress, Lincheck), scheduling with ShedLock,
and diagnosing pool exhaustion.

### 3.7 Spring Security (18 Q)

The `SecurityFilterChain` and what each filter does, `AuthenticationManager` /
`ProviderManager` / `AuthenticationProvider`, `SecurityContextHolder` and its strategies
(including the `@Async` propagation trap), `UserDetails` / `UserDetailsService`,
`PasswordEncoder` and `DelegatingPasswordEncoder`'s `{bcrypt}` prefix, the Spring Security 6
lambda DSL migration, method security (`@PreAuthorize` / `@PostAuthorize` / `@Secured` / JSR-250),
CSRF — what it is and when you can genuinely disable it, CORS and why it must be ordered before
the security filters, session management and fixation protection, OAuth2 / OIDC roles
(resource server vs client), writing a custom filter correctly, **401 vs 403** and who produces
each, RBAC vs ABAC and `RoleHierarchy`, testing with `@WithMockUser` and
`SecurityMockMvcRequestPostProcessors`, the OWASP Top 10 mapped to Spring defences,
service-to-service auth, and rate limiting / account lockout.

### 3.8 JWT (14 Q)

Token anatomy (header, payload, signature) and base64url, the registered claims (`iss`, `sub`,
`aud`, `exp`, `nbf`, `iat`, `jti`), HS256 vs RS256 vs ES256 and when each is right, the
**`alg: none`** and **key-confusion** attacks, the correct validation order, refresh-token
rotation with reuse detection, where to store tokens in a browser (localStorage vs
`HttpOnly` + `SameSite` cookies), revocation strategies for a stateless token, a complete Spring
Boot resource-server implementation, JWKS and key rotation with `kid`, JWT vs server sessions,
the classic vulnerability list, JWS vs JWE, claim design and `JwtAuthenticationConverter`
authority mapping, and debugging an unexplained 401.

---

## 4. Files added and changed

### 4.1 Data layer — `src/data/backendInterview/` (new, 12 files, 19,691 lines)

| File | Lines | Purpose |
| --- | --- | --- |
| `contract.ts` | 83 | `BackendQuestion` / `BackendQuestionMeta` / `BackendChunk` types, `defineBackendChunk()`, and the authoring rules (markdown-lite dialect, `\${` escaping) |
| `topics.ts` | 118 | `BACKEND_TOPICS` — ordered registry of the 8 topics; order here drives render order and question numbering |
| `chunk-01-java-annotations.ts` | 1,007 | `b001`–`b016` |
| `chunk-02-spring-annotations.ts` | 1,379 | `b017`–`b036` |
| `chunk-03-spring-boot-core.ts` | 726 | `b037`–`b046` |
| `chunk-04-collections.ts` | 1,521 | `b047`–`b066` |
| `chunk-05-hashmap.ts` | 1,098 | `b067`–`b080` |
| `chunk-06-multithreading-a.ts` | 1,306 | `b081`–`b094` — fundamentals |
| `chunk-07-multithreading-b.ts` | 1,236 | `b095`–`b106` — applied / production |
| `chunk-08-spring-security.ts` | 2,345 | `b107`–`b124` |
| `chunk-09-jwt.ts` | 1,944 | `b125`–`b138` |
| `index.ts` | 178 | Aggregator: flat list, per-topic grouping, meta map, topic sections, **DEV-time integrity validation** |
| `annotations.ts` | 1,740 | 155-entry annotation catalogue across 16 categories |
| `practiceProblems.ts` | 7,297 | 41 practice problems |
| `README.md` | — | Contributor guide for the folder |

### 4.2 Library / hooks (new)

| File | Lines | Purpose |
| --- | --- | --- |
| `src/lib/backendQuestionIndex.ts` | 212 | Flat index with stable slugs, id/slug lookup, neighbours, scored search, per-topic stats, route constants |
| `src/hooks/useBackendInterviewProgress.ts` | 171 | localStorage-backed studied / bookmarked / solved state, cross-tab synced |
| `src/components/interview/BackendAnswer.tsx` | 26 | Named renderer for the answer dialect (thin alias over the Core Java renderer so there is only one parser) |

### 4.3 Pages (new, 6 files, 2,503 lines)

| File | Route | What it does |
| --- | --- | --- |
| `BackendInterviewHubPage.tsx` | `/interview/:language/spring-boot` | Hero, 5 live stat tiles, progress ring, 3 pillar cards, 8 topic cards with difficulty split + per-topic progress, and a 4-week study plan |
| `BackendQuestionsPage.tsx` | `…/questions` | Searchable list, 8 quick filters, topic filter driven by `?topic=`, inline answer/code expansion, per-topic practice call-out |
| `BackendQuestionDetailPage.tsx` | `…/questions/:questionSlug` | Quick answer → full explanation → code → "what they're testing" → follow-ups → practice, with a sticky TOC and prev/next |
| `BackendAnnotationsPage.tsx` | `…/annotations` | Searchable catalogue grouped by category; each row expands to internals, example, gotcha and related questions |
| `BackendPracticePage.tsx` | `…/practice` | All 41 problems grouped by topic, with difficulty/topic filters and a solved-progress bar |
| `BackendPracticeDetailPage.tsx` | `…/practice/:problemId` | Scenario, tickable acceptance criteria, starter code, **one-at-a-time hint reveal**, hidden-until-asked solution, interview debrief |

### 4.4 Existing files modified (3)

| File | Change |
| --- | --- |
| `src/App.tsx` | 6 new routes under `/interview/:language/spring-boot`; 138 questions + 155 annotations added to the global Ctrl+K search index |
| `src/pages/interview/JavaInterviewHub.tsx` | New "Spring Boot & Backend" learning-track card (5th track) with a live `138 questions · 41 labs` count; added a `warning` accent to `TrackColor` |
| `src/pages/Interview.tsx` | Added `spring-boot` to `LearningPathOption["id"]` and a matching card in the Java learning-path list |

### 4.5 Tests (new, 2 files, 388 lines)

| File | Tests | Covers |
| --- | --- | --- |
| `src/test/backendInterviewData.test.ts` | 17 | Question total, required topic coverage, unique ids, **answer length floor of 150 words**, `code` ⇒ `codeLanguage`, complete metadata, contiguous topic sections, unique slugs, slug/id resolution, neighbour linking, search behaviour, annotation category validity + must-have annotations, practice ids/tasks/hints/solutions, practice for every topic, and no dangling cross-references |
| `src/pages/interview/BackendInterviewPages.test.tsx` | 11 | All six pages mount and render; hub entry points; list search narrowing; `?topic=` filtering; detail sections; localStorage persistence; annotation expand + filter; practice link coverage; hint reveal; solution hidden by default; acceptance-criteria ticking |

`src/pages/interview/JavaInterviewHub.test.tsx` was updated from four tracks to five.

---

## 5. Design decisions

**Separate bank, not an extension of Core Java.** `src/data/coreJavaQuestions/index.ts` asserts
exactly 226 questions across 15 topics at DEV time. Adding to it would have meant touching those
invariants and the Supabase-backed progress table. The new bank lives in its own folder with its
own contract, so the two evolve independently.

**localStorage progress, no Supabase migration.** Core Java progress uses the
`core_java_user_state` table keyed to a signed-in user. The backend track deliberately uses
localStorage so it works signed-out and never blocks first paint on a network round trip. The
stored shape is a plain `string[]` of ids, so it can be synced to a table later without a data
migration.

**Immutable ids, positional display numbers.** Questions are keyed `b001`–`b138` and practice
problems `p01`–`p41`. Progress and bookmarks reference those ids, so they must never be renumbered.
The "Question 42 of 138" label comes from array position instead.

**One answer renderer.** The backend answer dialect is identical to the Core Java one, so
`BackendAnswer` is a named alias over `CoreJavaQuestionAnswer` rather than a second parser that
would drift.

**Answers sized for speech, not skimming.** The contract asks for 300–500 words; the bank landed
at 188–345 (avg 251) because padding was cut rather than added. The test suite enforces a 150-word
floor so no future question can regress into a summary.

**Deliberately longer than "revision notes".** Every question carries a compilable code sample and
2–4 follow-ups, because the differentiator at 3–4 years is being able to keep going after the
first correct sentence.

---

## 6. Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.app.json` | **0 new errors** (17 pre-existing, all in untouched files: Monaco editor options, React Flow node typing, `NotesDashboard`, `Playground`, `Profile`, and four `setState` call sites) |
| `npm run lint` | **clean**, no warnings |
| `npm run build` | **✓ built in ~24s** |
| `npm run test` | **90/90 passing** across 10 files (was 62 across 8) |
| Dev server | All six routes render; verified via jsdom render tests and a live Vite preview |

Two authoring bugs were caught and fixed during the build:

- Five `\\${` sequences inside template literals in `chunk-02` — in a template literal that is an
  escaped backslash *followed by an interpolation*, which broke the parse. Corrected to `\${`.
- A stray CJK character (`媒`) emitted inside a `chunk-03` code sample. A Unicode allowlist scan now
  covers all 12 data files.

---

## 7. How to extend

1. Read the authoring rules at the top of `src/data/backendInterview/contract.ts`.
2. Append to the relevant chunk with the next free `bNNN` id — **never renumber existing ids**.
3. Add the matching entry to that chunk's `meta` map (`difficulty`, `priority`, `tags`, and
   optionally `readMinutes` / `versions`).
4. Bump the topic count in `EXPECTED_TOPIC_COUNTS` and `BACKEND_QUESTION_TOTAL` in `index.ts`.
5. Run `npm run test` — `backendInterviewData.test.ts` will fail loudly on duplicate ids, short
   answers, missing metadata, unknown topics or dangling cross-references.

To add a topic, append to `BACKEND_TOPICS` in `topics.ts` (order = render order), create a
`chunk-NN-*.ts`, register it in `index.ts`, and add at least one practice problem — a test asserts
every topic has one.

---

## 8. Known gaps / possible follow-ups

- Progress is per-browser. Syncing to Supabase would need a `backend_interview_user_state` table
  mirroring `core_java_user_state`.
- No visualisations yet. Core Java has `CoreJavaVisualizationBlock`; HashMap resize and the
  Spring Security filter chain would both benefit from animated diagrams.
- No PDF export on the backend track (Core Java has one via jsPDF).
- The practice lab is read-and-check, not executable. Wiring selected problems into the existing
  Monaco playground would let candidates actually run their attempt.
