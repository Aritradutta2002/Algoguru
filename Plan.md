# AlgoGuru — Premium Obsidian Redesign: Master Plan

> **Status:** Approved plan for implementation · **Stack:** React 18 + Vite 5 + TypeScript + Tailwind 3 + shadcn/ui (Radix) + Framer Motion 12 + React Router 6 + Supabase
> **Companion rules:** [`Guardrail.md`](./Guardrail.md) takes precedence on every conflict — this plan never overrides those non-regression rules.
> **Supersedes:** the previous calm-rollout plan in this file (completed in `55254f1` — *"complete Obsidian UI rollout across phases 1-5"*). This plan is the **next generation**: it keeps that foundation and elevates it to a very premium, smoothly animated, enterprise-grade Obsidian experience.

---

## How to use this plan

1. **Read `Guardrail.md` first.** Presentational changes only — no route, data-fetching, auth, schema, prop, context, or hook-contract changes, and never remove `id` / `name` / `data-testid` / `aria-*` attributes.
2. **Implement phase by phase** (Section 9). One focused, reviewable change at a time; run the verification gate after every page (Section 11).
3. **Every page must pass its per-page checklist and Definition of Done** (Section 11) before the next phase starts.
4. If a detail is not specified here, follow the design system (Sections 4–6) and the nearest already-redesigned page as the reference — consistency beats local invention.

---

## 1. Objective & success criteria

Redesign **every single page** of AlgoGuru into one cohesive, premium Obsidian product that feels like a Linear / Vercel / Stripe-grade enterprise workspace — dark-first, glassy, precise, and alive with smooth animation — while remaining excellent in light mode, fast, accessible, and 100% compatible with the existing product.

**Primary necessities (in order):**
1. **Obsidian look & feel** — deep-black surfaces, hairline glass borders, specular top highlights, restrained cobalt/violet accent, real depth hierarchy.
2. **Butter-smooth animation everywhere** — entrances, hovers, panel/panel transitions, page transitions, and state changes at a consistent 60 fps with zero jank and zero layout shift.
3. **Production-ready & enterprise-grade** — one design system across all pages, both themes, all breakpoints, keyboard + screen-reader usable, SEO intact, zero console errors.

**Measurable success criteria:**
- [ ] Every route in the inventory (Section 3) renders in the new system in **dark + light** at **1440px and 390px** with no overflow, clipping, or misalignment.
- [ ] Animations animate **transform/opacity only** (Guardrail §3); INP stays snappy, CLS < 0.1, no long tasks introduced by motion code.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, and `npx vite build` all pass after each phase (Section 11).
- [ ] Full keyboard path (Tab / Shift+Tab / Enter / Escape) works on every redesigned surface; focus is always visible; `prefers-reduced-motion` shows final states with identical functionality.
- [ ] All 57 existing test files continue to pass; any test asserting a class/structure is updated in the same commit with the reason stated (e.g. `Index.test.tsx` asserts `landing-primary` and `.hero-goal-fill`).

**Out of scope:** backend, Supabase schema/edge-function, auth-flow, routing, data-model, copy-voice rewrites, logo/brand-asset changes, new paid services, and any new dependency not already in `package.json` (see §4.6 on `@vengeanceui`).

---

## 2. Current-state audit (the foundation we build on)

### 2.1 What already exists and must be preserved

| Area | Current state | Verdict |
|---|---|---|
| Theme tokens | Dual theme in `src/index.css` (~2,770 lines): warm-paper light, Obsidian dark (`--obsidian-void #070709`, `--obsidian-pane #0c0c10`, `--obsidian-elevated #111117`, hairlines `white 8%` dark / `gray 89%` light), cobalt `--primary`, Guru violet `--guru-*`, reader `--reader-*`, contest `--surface-*`, code `--code-*` | **Keep.** Extend tokens here only — never hard-code hex in components. |
| Shared UI CSS | `src/styles/ui.css` (319 lines): `lp-container / lp-section / lp-band / lp-split / lp-kicker / lp-h2 / lp-lead / lp-btn / landing-primary / lp-frame / lp-chip / lp-grid / lp-cell / lp-icon / lp-list / lp-progress / lp-tab` + `.nav-glass` / `.mobile-dock` overrides; loaded app-wide from `main.tsx` | **Keep & extend** as the shared layer (§5.1). |
| Page primitives | `src/components/layout/PagePrimitives.tsx` (379 lines): `PageContainer`, `PageHeader`, `Section`, `Surface`, `StatCard`, `EmptyState`, `SegmentedControl`, `Toolbar`, `Pill`, `Field` — props are a public contract | **Restyle in place**, props unchanged (§5.2). |
| Motion system | `src/lib/motion.ts` (EASE_OUT / EASE_IN_OUT / EASE_SPRING, DURATION fast/base/slow, STAGGER, HERO_TIMELINE, spring presets, `fadeIn/fadeUp/scaleIn/staggerContainer`) + `src/components/motion/Reveal.tsx` (`whileInView`, `once`, reduced-motion final state) + `<MotionConfig reducedMotion="user">` in `App.tsx` | **Keep & expand** — this is the single motion language (§6). |
| Landing | `src/pages/Index.tsx` (287 lines) + `src/styles/landing.css` + `HeroSection / HeroWorkspacePreview / WorkspaceDemoSection` + `useHeroChoreography` (code → running → pass → done hero session) | **Flagship reference.** Elevate, don't rebuild (§7.1). |
| App chrome | `App.tsx` shell (resizable sidebar + main + Guru panel, `SpotlightNavbar`, `PrimaryNavigation` mega-menus, `WorkspaceSwitcher`, `GlobalSearchLauncher`, `NotificationCenter`, `ThemeToggle`, `UserMenu`, mobile drawer + `MobileNav` dock, `BrandLoader` / `AppLoadingScreen` / `PageSkeleton`, route scroll-progress bar) | **Keep architecture**, premium-polish the surfaces (§7.0). |
| Primitives | shadcn/Radix in `src/components/ui/` (accordion, dialog, dropdown, input, select, progress, sheet, skeleton, sonner, tooltip, etc.); `Button` already aligned (solid `foreground` default, `accent` cobalt variant) | **Keep.** Add premium variants only (§5.3). |
| Guardrails | `Guardrail.md` (Obsidian + Vengeance UI, transform/opacity-only motion, no `useState` cursor tracking, no Three.js/canvas in editor routes, MotionConfig, focus management) | **Binding.** Dependent detail in §4.6 / §6.4. |
| Tests | 57 test files incl. `Index.test`, `PrimaryNavigation.test`, `BrandLoader.test`, contest/quiz/interview suites | **Binding.** Run per phase (§11). |

### 2.2 The gap this plan closes

The previous rollout deliberately removed premium effects (spotlight cards, gradients, magnetic buttons, glows, animated counters) in favour of a calm Linear-style surface. The result is coherent but **flat**: entrances are fade-only, hover feedback is colour-only, there's no page-transition language, no scroll choreography beyond `Reveal`, and signature surfaces (hero frame, Guru panel, roadmaps, contest workspace) don't yet feel *alive*. A grep for the old decor patterns now finds only ~10 matches in 3 files (`CodingProblemPanel`, `GuruComposer`, `GuruThinking`) — the cleanup is done; what is missing is the **premium layer on top**, done strictly within Guardrail §3 (GPU-composited, pointer-safe, editor-safe, reduced-motion-safe).

### 2.3 Heavy & risky surfaces (handle with extra care)

| Surface | Size | Rule |
|---|---|---|
| `src/pages/Playground.tsx` | 4,907 lines | **Chrome only** (toolbars, tabs, panel headers, buttons). No editor-theme, Monaco-option, or panel-resize changes. No heavy effects in the editor route (Guardrail §3). |
| `src/pages/ProblemSolver.tsx` | 2,529 lines | Chrome only; Guru is a tab here, not a panel — keep that contract. |
| `src/pages/Profile.tsx` | 2,157 lines | Section-by-section; preserve all form control names/ids. |
| `src/pages/Practice.tsx` / `Quiz.tsx` / `CodingContestSession.tsx` | 619 / 1,310 / 1,172 lines | Preserve timer, integrity-lock, submit, and scoring behaviour exactly. |
| `src/styles/core-java-interview.css` | 3,321 lines, ~250 `.cjh-*` classes | Restyle tokens + card classes in the CSS file; migrate pages to `PagePrimitives` incrementally; never fork a second card style. |
| Roadmap canvas | `@xyflow/react` | Canvas palette (`.coggle-roadmap-shell`) intentionally locks its own dark theme — **do not restyle** the canvas; only the surrounding chrome/header/controls. |

---

## 3. Complete route inventory — every page this plan covers

Source of truth: `src/App.tsx` + `src/components/contest/ContestRoutes.tsx`. All routes are **preserved**; this is a redesign, not a re-routing.

### 3.1 Chrome-free routes (standalone shells)
| Route | File | Notes |
|---|---|---|
| `/auth` | `src/pages/Auth.tsx` (553) | Eager-loaded (first screen for signed-out visitors). |
| `/reset-password` | `src/pages/ResetPassword.tsx` (93) | Keep email-link flow identical. |
| `/contest/quiz` | `src/pages/Quiz.tsx` (1,310) + `QuizSection` | Fullscreen exam; legacy `/quiz` redirects here with query string preserved (`QuizLegacyRedirect`). |
| `/contest/coding` | `src/pages/contest/CodingContestInstructions.tsx` (505) | Pre-exam instructions; continuous focused surface. |
| `/contest/coding/session/:sessionId` | `src/pages/contest/CodingContestSession.tsx` (1,172) + `components/contest/coding/*` | Fullscreen exam workspace; integrity lock + clock are behaviour, not decoration. |
| `/roadmap`, `/roadmap/:roadmapId` | `RoadmapFullscreenRoute` → `RoadmapEngine` (`@xyflow/react`) | Chrome-free by design; `/java-roadmap` → `/roadmap/java` redirect. |
| `/quiz` | → `QuizLegacyRedirect` → `/contest/quiz` | Redirect only; nothing to design. |

### 3.2 App-shell routes (inside `AppLayout`, behind `ProtectedRoute`)
| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/Index.tsx` (287) + `components/landing/*` | Flagship landing; only route that renders `Footer`. |
| `/buy-me-a-coffee`, `/support` (alias) | `src/pages/BuyMeACoffee.tsx` (199) | Single page, two URLs. |
| `/playground` | `src/pages/Playground.tsx` (4,907) | Immersive workspace (Monaco). Chrome-only redesign. |
| `/practice` | `src/pages/Practice.tsx` (619) | DSA problem sheets index. |
| `/problem-solver` | `src/pages/ProblemSolver.tsx` (2,529) + `ProblemSolver.css` | Daily challenge / LeetCode-style solver (Monaco `LeetCodeEditor`). |
| `/contest` | `src/pages/contest/ContestLanding.tsx` (313) | App-shell landing; no sidebar by design. |
| `/contest/coding/result/:sessionId` | `src/pages/contest/CodingContestResult.tsx` (275) | Post-exam report keeps app shell for onward navigation. |
| `/interview`, `/interview/:language` | `src/pages/Interview.tsx` (295) → `JavaInterviewHub` (291) / `PythonInterviewHub` (187) / `CppInterviewHub` (187) | Hub switch by `:language`. |
| `/interview/:language/data-structure` | `InterviewDataStructurePage.tsx` (5) → `InterviewComingSoonLayout` (80) | Thin wrapper — polish the shared "coming soon" layout once, both routes benefit. |
| `/interview/:language/sql-structure` | `InterviewSqlStructurePage.tsx` (5) → `InterviewComingSoonLayout` | Same as above. |
| `/interview/:language/language-questions` | `InterviewLanguageQuestionsPage.tsx` (40) → C++/Python question pages (1,086 / 1,087) | Language dispatch wrapper. |
| `/interview/:language/language-questions/:questionSlug` | `InterviewLanguageQuestionDetailPage` → C++/Python detail pages (528 / 517) | Shared detail chrome (badges, actions, visualization block). |
| `/interview/:language/core-java-qa` | `InterviewCoreJavaQuestionsPage.tsx` (1,046) | 226 questions, 15 topics; list + filters. |
| `/interview/:language/core-java-qa/:questionSlug` | `InterviewCoreJavaQuestionDetailPage.tsx` (540) | Long-form reader (`font-reading`, Source Sans 3) — keep reader typography. |
| `/interview/:language/spring-boot` | `BackendInterviewHubPage.tsx` (548) + `components/interview/java-hub/*` | 138 questions, 155 annotations, 41 practice problems. |
| `/interview/:language/spring-boot/questions` | `BackendQuestionsPage.tsx` (524) | |
| `/interview/:language/spring-boot/questions/:questionSlug` | `BackendQuestionDetailPage.tsx` (440) | |
| `/interview/:language/spring-boot/annotations` | `BackendAnnotationsPage.tsx` (289) | |
| `/interview/:language/spring-boot/practice` | `BackendPracticePage.tsx` (308) | |
| `/interview/:language/spring-boot/practice/:problemId` | `BackendPracticeDetailPage.tsx` (408) | |
| `/interview/:language/system-design` | `InterviewSystemDesignPage.tsx` (838) | Diagrams via `DiagramRenderer` / `CoreJavaVisualizationBlock` family. |
| `/practice/solution/:problemId` (+ `/:problemSlug`) | `src/pages/PracticeSolution.tsx` (225) | |
| `/profile` | `src/pages/Profile.tsx` (2,157) | Account, progress, settings sections. |
| `/notes` | `src/pages/NotesDashboard.tsx` (995) | Notes workspace (`DraggableNoteEditor`, `RichTextNoteEditor`, `ContentRenderer`). |
| `/admin` | `src/pages/Admin.tsx` (365) | Admin-gated (`useIsAdmin`); restyle only. |
| `/:topicId` | `src/pages/TopicPage.tsx` (411) | Catch-all for ~200 DSA/Java topics from `src/data/topics.ts` (`arrays`, `stack-queue`, …). **Must stay last** — it swallows unknown paths, which is also why `*` → `NotFound` ordering matters. |
| `*` | `src/pages/NotFound.tsx` (73) | |

### 3.3 Global chrome (appears across the shell — redesign once, benefits every page)
`SpotlightNavbar` + `PrimaryNavigation` (mega-menus, spring pill indicator, More dropdown) · `AppSidebar / ObsidianVaultTree / ObsidianDock` · `WorkspaceSwitcher` · `GlobalSearch` (`cmdk` command palette, ⌘K) · `AiCommandLauncher` + `GuruBot` panel (⌘J, resizable, collapsible, fullscreen) · `NotificationCenter` · `ThemeToggle` (sun/moon) · `UserMenu` · `MobileNav` dock + `MobileNavigationMenu` drawer · `Footer` · `SupportModal` · `BrandLoader` + `AppLoadingScreen` + `PageSkeleton` + `SidebarSkeleton` · `Toaster`/`Sonner` toasts · reading-progress bar · `ObsidianWindow` workspace windows.

---

## 4. Design system v2 — "Obsidian Premium"

The previous design language is **kept**; this section adds the premium layer **on top of it**, constrained so the product reads as one system in both themes.

### 4.1 Colour & surfaces (extend tokens, never invent hex in components)

| Role | Token | Dark | Light |
|---|---|---|---|
| Page void | `--obsidian-void` / `bg-obsidian-void` | `#070709` | warm paper |
| Pane / card / band | `--obsidian-pane` / `bg-obsidian-pane` | `#0c0c10` | white |
| Elevated (header, menus, dialogs, hover) | `--obsidian-elevated` | `#111117` | white |
| Hairline | `--obsidian-border` | white 8% | gray 89% |
| Specular top edge | `shadow-specular` → `inset 0 1px 0 hsl(var(--obsidian-specular))` | white 12% | subtle | 
| Primary accent (cobalt) | `--primary` | `217 91% 60%` | `217 91% 55%` |
| Guru violet identity | `--guru-accent / --guru-accent-2` | `245/268` | same family, day-tuned |
| Success / warning / danger | `--success / --warning / --destructive` + `--obsidian-success` | emerald-tuned | same hues, day-tuned |
| Difficulty | `--difficulty-easy/medium/hard/expert` | night ramp | day ramp (already tokenised) |

**New tokens to add in `index.css` (dark + light), the only colour additions allowed:**
`--premium-glow` (single shared accent glow, 10–16% cobalt, used only inside `.lp-frame` and the hero), `--premium-sheen` (white 6% at 120°, for button sheen), `--premium-aurora-1/2` (cobalt 8% / violet 7%, hero/CTA ambience only). Everything else reuses existing tokens.

**Accent discipline (the premium rule):** cobalt appears only as (a) primary CTA, (b) active/selected indicator, (c) progress, (d) focus ring, (e) small live/status accents. Violet is reserved for Guru AI identity. Emerald is reserved for success/execution-passed. Never as large background fills.

### 4.2 Typography

- **UI & headings:** `Inter` (`font-sans`), 600 for headings — no `font-black/extrabold`. This stays the product voice.
- **Display use (new, tightly scoped):** `Space Grotesk` (`font-display`, already loaded) may return **only** for the landing H1 and large stat numerals — nowhere else. This gives the flagship a distinctive voice without forking the app type system.
- **Long-form reading:** `Source Sans 3` (`font-reading`) for Q&A readers and topic prose — unchanged; readability beats novelty.
- **Code / keys / filenames:** `JetBrains Mono` (`font-mono` / `font-code`) only.
- **Scale (unchanged):** marketing H1 40–68px / `lp-h1`; page title `text-3xl md:text-4xl font-semibold tracking-[-0.03em]`; section `lp-h2`; card title 15–17px; body 15–17px lh 1.6–1.7; metadata 12–13.5px; `tabular-nums` on all numbers. Sentence case everywhere — no `uppercase tracking-[0.2em]` micro-labels.

### 4.3 Shape, depth, glass

- Radius: buttons/inputs/chips `rounded-lg/md` (8/6px); cards/panels/product frames `rounded-[0.875rem]` (14px); large CTA `rounded-2xl`. **Never** `rounded-3xl`+.
- Depth: hairline border first; shadows only on floating layers (frames, menus, dialogs) via `--shadow-overlay`, plus the specular top edge on elevated glass. In-flow cards get borders, not shadows.
- Glass (sticky header, menus, dialogs, toasts, Guru composer): `bg-obsidian-elevated/85` + `backdrop-blur-xl` + specular inset. **Never** heavy blur on in-flow content, and never `bg-white/[0.0x]` fills (use `bg-foreground/[0.0x]` so light mode works).
- Texture: one faint grid or dot motif maximum per page, at ≤4% opacity, hero and CTA only; otherwise plain void/pane bands (`lp-band`) separate sections. No noise/aurora soup.

### 4.4 Layout rhythm (unchanged, now enforced everywhere)

Container `max-w-7xl px-5 sm:px-6` (matches the header — logo, title, footer share one left edge) · marketing sections `lp-section` (`py-20 md:py-28`), dense app pages `py-10 md:py-14` · grids prefer shared-border `lp-grid`/`lp-cell` or divided `lp-list` over floating card clusters · two-column splits via `lp-split` (5/12 text, 7/12 product) above ~1000px.

### 4.5 Component inventory (shadcn/Radix base — restyle, don't replace)

`button` · `input` / `textarea` / `select` / `checkbox` · `accordion` · `badge` · `breadcrumb` · `dialog` / `alert-dialog` / `sheet` · `dropdown-menu` · `command` (⌘K) · `progress` + `progress-ring` · `skeleton` · `sonner`/`toast`/`toaster` · `tooltip` · `separator` · `resizable` · `sidebar`.
Premium upgrades are **variants + motion**, never new primitives: e.g. `button` gains `premium` (sheen sweep on hover, press-scale via transform, loading spinner slot) and `accent` (already present) while `default/outline/ghost` keep their current aligned look; `Surface` gains an optional spotlight border (pointer-tracked via `useMotionValue` CSS variables — never `useState`, Guardrail §3); `Pill`/`SegmentedControl` gain a spring indicator (Framer Motion `layoutId`); `Skeleton` gains a shimmer sweep; `EmptyState` gains a gentle rise-in. **Search tests for `toHaveClass` before changing any variant.**

### 4.6 Dependency decision (important)

`Guardrail.md` approves `@vengeanceui` (`spotlight-navbar`, `glass-dock`, `folder-preview`, `generate-button`) **only if already in the repo**. It is **not** in `package.json` (verified) — therefore **do not add it**. Build local equivalents from what exists: `SpotlightNavbar` (already local), `MobileNav` dock (already local), `ProductFrame` (already extracted), Framer Motion micro-interactions. This keeps the bundle, licence, and API surface unchanged and is the enterprise-correct call.

---

## 5. Premium foundation (do this first — Phase 1)

### 5.1 Shared stylesheet
1. Extend `src/styles/ui.css` — do not create a parallel system. Add: `.lp-premium-glow` (hero/CTA ambience), `.lp-sheen` (button sweep), `.lp-spotlight` (border-glow card via `--mx/--my` CSS vars set from a `useMotionValue` handler), `.lp-rise` (entrance helper), `.lp-marquee` (logo/testimonial loop, transform-only, paused under reduced-motion), skeleton shimmer keyframes, and the new `--premium-*` tokens (token values themselves live in `index.css` `:root`/`.dark`).
2. Keep class names stable (`lp-*`, `landing-primary`); `Index.test.tsx` depends on `landing-primary` + `.hero-goal-fill`.

### 5.2 `PagePrimitives.tsx` — restyle in place (props frozen)
`PageContainer`/`Section` already use the right padding. `PageHeader`: add an optional premium treatment (eyebrow dot + subtle gradient rule under the title) without changing props. `Surface`: add `spotlight` opt-in via new optional prop (default off, so existing callers are untouched) implemented with motion values. `StatCard`: keep value/label anatomy; add animated count-up **only** where the value is a plain number and motion is allowed (respect reduced-motion; never animate static identifiers). `EmptyState`: neutral icon box + rise-in. `SegmentedControl`/`Pill`: spring indicator + press feedback (transform only).

### 5.3 `Button` — premium variants (additive only)
Add `premium` variant: solid foreground base, specular inset, sheen sweep (pseudo-element translated on hover, transform-only), `active:scale-[0.98]`, loading state showing a spinner with `aria-live` text. Keep `default` exactly as-is for the one-primary-action rule. Never `active:scale` on every button globally — press feedback belongs to the premium/primary CTA only.

### 5.4 Motion primitives (expand `lib/motion.ts` + `Reveal.tsx`)
Add: `riseIn`, `staggerFast` (grids/lists), `springPill` (nav/segmented indicators), `clipReveal` (hero headline, clip-path-free — use overflow + y), `marquee` (CSS, transform-only), `counter` (spring-based count-up via `useSpring`/`useTransform`, tabular-nums, reduced-motion instant). All presets keep the existing easing/duration language; springs only for direct manipulation (tabs, pills, reorder, drag).

---

## 6. Motion & animation system (the "very premium, smooth" layer)

### 6.1 Principles
1. **Motion explains, never decorates for its own sake** — every animation communicates state, hierarchy, or continuity.
2. **GPU only:** `transform` + `opacity` (and `clip-path` via Framer Motion layout projection where needed). Never animate `width/height/top/left` except Framer `layout` with `overflow-hidden`.
3. **Never `useState` for pointer/scroll** — cursor spotlight and scroll progress use `useMotionValue` / rAF-written CSS variables (the header progress bar already sets `style.transform` outside React — follow that pattern).
4. **One rhythm:** entrances slower than feedback (existing `DURATION`); easings from `lib/motion.ts` only.
5. **Reduced motion is a first-class state**, not an afterthought (§6.4).

### 6.2 Signature interactions (approved catalogue — use consistently, not randomly)
| Interaction | Where | Spec |
|---|---|---|
| Page transition | Route change (shell routes) | Content fades + rises 8–12px in 220–300ms; scroll resets (already in `ScrollToTopOnRouteChange`); skeleton cross-fades, never pops. |
| Entrance choreography | Hero, section heads, grids | Staggered `Reveal` (line 45ms / card 55ms / row 60ms); hero headline word-rise; one choreographed `HERO_TIMELINE` session on the landing frame (already exists — keep). |
| Spotlight border | `Surface[spotlight]`, feature cards, contest cards | Radial glow at cursor via `--mx/--my` motion values; border brightens, interior stays calm; disabled on touch/reduced-motion. |
| Sheen sweep | Primary CTAs | Single 600ms translate sweep on hover/focus; transform-only pseudo-element. |
| Magnetic hover | Landing hero CTAs only | Max 4px translate toward cursor via motion values; **not** on app controls. |
| Spring pill | `PrimaryNavigation`, `SegmentedControl`, tabs | `layoutId` pill springs between active items (already partially present in nav — unify it). |
| Scroll layer | Landing sections, topic readers, roadmaps | `Reveal` sections + reading-progress bar + `OnThisPage` scroll-spy; parallax limited to hero orbs at ≤ 24px travel, lerped springs, paused off-screen. |
| Marquee | Social proof / testimonials (landing only) | Transform-only CSS loop, 30–40s, pause on hover/focus, static under reduced-motion. |
| Counters | Landing stats, profile stats | Spring count-up, tabular-nums, instant under reduced-motion. |
| State feedback | Run/pass, submit, save, copy | Check-draw / badge pop (scale + opacity), progress fill `scaleX`, toast slide-in from bottom-right; never colour-only (icon + text + `aria-live`). |
| Panel choreography | Sidebar fold, Guru panel expand/collapse, dialogs, sheets, mobile drawer | Spring/elastic easing, focus trap + restore, Escape closes, backdrop fades (opacity only). |
| Visualizer steps | Topic visual blocks, roadmap nodes | Node/bar transforms with spring; path highlight via opacity; speed control preserved. |

**Explicitly banned** (would violate Guardrails or cheapen the product): continuous canvas particle loops, Three.js/R3F anywhere in editor/visualizer routes, cursor-following glows that use React state, `animate-ping` except a genuinely live contest/busy state, button pulse/sparkle loops, gradient headline text, animated gradients on buttons/badges/progress, scroll-jacking or hijacked wheel handlers.

### 6.3 Performance budget
Route-level lazy loading stays (already in `App.tsx`). Motion code never blocks first paint: `Reveal` uses `whileInView` (no eager observers for below-fold content), parallax/marquee pause when off-screen (`IntersectionObserver` or Framer `useInView`), blur is confined to sticky/floating layers, and long lists use `content-visibility: auto`. Target: no INP regression, CLS < 0.1, no new >200ms long tasks from animation code.

### 6.4 Accessibility of motion
Every animated view sits under the existing `<MotionConfig reducedMotion="user">`. Under reduced motion: reveals render final state, marquee/parallax/magnetic/spotlight/sheen/count-up become instant/static, smooth scrolling becomes `auto` (the landing already does this — replicate the pattern), and **all functionality remains identical** (Guardrail §3). Keyboard: visible focus (`focus-visible:ring-2 ring-ring/60`, never removed), Escape closes every overlay, focus returns to the trigger, live regions announce state changes (toasts, test results, Guru thinking).

---

## 7. Page-by-page premium spec (every route)

Conventions: **Header** = `PageHeader` (kicker, title, description, actions) unless the page needs a custom layout · **Container** = `PageContainer`/`Section` so the title lines up with the app header · **Surfaces** = `Surface` / `lp-grid`+`lp-cell` / `lp-list` · **Actions** = one primary per view, rest `outline`/`ghost` · **States** = loading / empty / error / signed-in / signed-out all restyled, never removed.

### 7.0 Global chrome (Phase 1 — every page benefits)
- **Header (`SpotlightNavbar` + `PrimaryNavigation`):** glass intensifies + hairline + deep soft shadow on scroll (already present — refine the easing); spring pill indicator unified across desktop nav, More dropdown, and mobile drawer; mega-menu panels get elevated glass + staggered item entrance + icon tiles that lift on hover; Guru launcher keeps its violet identity + live status dot; search launcher shows ⌘K kbd chip. Mobile: drawer slides with staggered links, focuses the current destination, closes on Escape/outside/resize (current behaviour — keep, polish motion only).
- **Sidebar (`AppSidebar`/`ObsidianVaultTree`):** neutral list items, `bg-foreground/[0.06]` active fill (no coloured category tiles), spring active indicator, fold/unfold spring (already resizable — keep the drag contract; animate only programmatic fold), section headers with chevron rotate.
- **Guru panel (`GuruBot` + `components/guru/*`):** glass elevated surface, violet thinking halo (existing `guru-*` keyframes — keep), message entrance rise, code-block copy feedback, composer focus ring, collapsed-rail expand affordance. The 18/28/38% size contract and ⌘J shortcut are behaviour — untouched.
- **Overlays:** `GlobalSearch` (⌘K palette — staggered results, kbd hints, `cmdk` keyboard nav), `NotificationCenter` (tabs, unread cobalt dot, rise-in list), `UserMenu`, `ThemeToggle` (sun/moon vector morph, already present — keep), toasts (slide + auto-dismiss + action), `SupportModal`, `Sheet` library drawer.
- **Loading:** `BrandLoader` (keep the mark; halo glow stays restrained), `AppLoadingScreen`, `PageSkeleton`/`SidebarSkeleton` (shimmer sweep, shaped like the real layout to avoid CLS).
- **Footer:** hairline top, 4–5 columns, newsletter with validation state, socials, status dot, back-to-top (transform-only). Only on `/` today — keep that contract.

### 7.1 Flagship — Home `/` (`Index.tsx` + `components/landing/*`)
The reference page. Elevate in place (never rebuild):
1. **Hero:** keep the choreographed session (`useHeroChoreography` → code writes, suite runs, results settle, `.hero-goal-fill` progress). Add: faint grid + aurora ambience (tokens from §4.1, ≤16% opacity), headline word-rise with one cobalt-accented word (flat colour, not gradient text), magnetic primary CTA + sheen, parallax orbs (≤24px, lerped, off-screen paused), stats row with spring count-up. `Space Grotesk` display face permitted here only.
2. **Learning paths (`lp-grid`):** cells gain spotlight border + icon that lifts/rotates 4° on hover + arrow nudges; stagger entrance; "Open library panel" toggle stays.
3. **Workspace demo (`WorkspaceDemoSection`):** product frame gains premium glow + specular edge; tabs spring; the demo session timeline keeps `HERO_TIMELINE` pacing.
4. **Quiz (`QuizSection`):** card gains spotlight; option select springs; result state pops with icon + score count-up.
5. **How it works:** numbered steps with hairline rule that draws (`scaleX`) on enter.
6. **Final CTA:** aurora panel + sheen primary + secondary; scroll-triggered rise; the only place a large gradient-adjacent ambience is allowed.
7. Roadmap overlay (`RoadmapFullscreenOverlay`, lazy) keeps its loading status; overlay entrance becomes a spring scale/fade.

### 7.2 Entry & account
- **`/auth`:** split layout — plain form panel left (floating labels via `Field`, password strength meter, show/hide, Caps-Lock hint, error shake, success check-draw), quiet product frame or aurora panel right. Remove gradient headline words; one primary action; OAuth buttons as `outline`. First impression for signed-out visitors — give it the home treatment.
- **`/reset-password`:** same form language; success state with check-draw + next-step CTA.
- **`/profile` (2,157 lines):** header with avatar + stats row (count-up), section tabs with spring indicator, activity heatmap with staggered cell entrance, settings toggles with spring thumbs, danger zone kept visually quiet. Preserve every form `name`/`id`.
- **`/notes`:** notebook surfaces on `Surface`; editor chrome only (no editor-option changes); note list items stagger; empty state with rise + CTA.

### 7.3 Core learning — Practice, Topics, Problem Solver, Playground
- **`/practice`:** `PageHeader` + sticky `Toolbar` (search, difficulty/tag filters as `Pill`s with FLIP layout animation, sort). Rows/cards: spotlight hover, difficulty dots (token colours), solved state with emerald check pop, bookmark toggle spring. Skeleton grid while loading; empty state with clear-filters action.
- **`/:topicId` (`TopicPage`, ~200 topics):** reader-first — `PageHeader` with breadcrumb, TOC/`OnThisPage` scroll-spy, topic cards with spotlight, visualization blocks spring-stepping, `CodeBlock` with copy feedback, prev/next footer. Keep `font-reading` prose. This page must look identical in structure across all 200 topics (it renders from `topics.ts` data).
- **`/practice/solution/:problemId`:** solution reader with reveal-on-scroll code steps, complexity chips, editorial accordion (spring height via Radix).
- **`/problem-solver` (2,529 lines):** **chrome only** — panel headers, tabs, Run/Submit buttons (premium variant), test-result list with staggered pass/fail rows, Monaco theme/options untouched, Guru tab contract untouched.
- **`/playground` (4,907 lines):** **chrome only** — toolbar, file tabs (spring indicator), problems library drawer, command palette (⌘K), autocomplete panel, console/output panel, save/share buttons. No editor behaviour, theme, or resize changes. Lowest-risk, highest-visibility polish.

### 7.4 Interview tracks (`/interview/*`)
Shared system (`core-java-interview.css` `.cjh-*` + `PagePrimitives` + `interview/*` components):
1. **Hub (`/interview`, `/interview/:language` → Java/Python/C++ hubs):** track cards with spotlight + progress rings (`progress-ring`), `ContinueLearningCard`, curriculum sections, practice resources, study-plan timeline draw-on-scroll. Java hub already uses primitives — extend the pattern to Python/C++.
2. **Question lists** (Core Java 1,046 / Python 1,087 / C++ 1,086 / Spring 524 lines): sticky toolbar, topic chips, bookmark toggles, difficulty dots, list stagger, skeleton rows. The three language lists share one visual template — implement once, apply thrice.
3. **Question details** (517–548 lines each): badges + actions row, answer reveal (spring), theory cards, visualization blocks, related questions. Reader typography preserved. Spring detail page shares the Spring question-detail chrome.
4. **Spring hub + annotations + practice** (289–548 lines): hub stats, annotation cards, practice list/detail with the same list/detail language as §7.3.
5. **System design (838 lines):** diagram frames with drawn-in edges (SVG stroke-dashoffset, transform/opacity-safe), component cards, trade-off table.
6. **Coming-soon routes** (`data-structure`, `sql-structure`, Java language-questions fallback): one premium `InterviewComingSoonLayout` — aurora panel, mark, single CTA. Fix once, both routes benefit.

### 7.5 Contest & exams (fullscreen — focus is the feature)
- **`/contest` (landing):** hero with live-beacon dot (only when a contest is actually running — `isContestRunning` contract), contest cards with spotlight + countdown, spring entrance. Remove any direct `spotlight-card` CSS usage in favour of the shared spotlight primitive.
- **`/contest/quiz` (1,310 lines):** chrome-free exam shell — progress bar `scaleX`, question transition (slide/fade, no layout jump), option select spring + instant feedback, timer, result screen with score count-up + per-question review. Integrity behaviour untouched.
- **`/contest/coding` (instructions, 505):** rules panel, integrity-lock explanation, single "Begin" premium CTA; continuous with the session surface.
- **`/contest/coding/session/:sessionId` (1,172 + `coding/*`):** workspace chrome only — question list, problem panel, editor footer, execution panel, `ContestClock`. Timer/integrity/submit behaviour untouched; only panel headers, tabs, and buttons are restyled.
- **`/contest/coding/result/:sessionId` (275):** report with animated score ring, per-question results stagger, onward navigation in app shell.

### 7.6 Roadmaps (canvas — chrome only)
- **`/roadmap`, `/roadmap/:roadmapId` (fullscreen):** header, controls (`RoadmapControls`), detail panel (`RoadmapDetailPanel`), fullscreen overlay — all premium glass chrome with spring panel transitions. **Canvas palette, node/edge rendering, and layout engine untouched** (`.coggle-roadmap-shell` dark lock is intentional). Node focus/hover states may gain glow via canvas-safe opacity only.

### 7.7 Utility & edge pages
- **`/buy-me-a-coffee` / `/support`:** warm single-panel layout, `lp-frame` with premium glow, one primary action.
- **`/admin`:** dense data tables on `Surface`, stat cards, chart entrance; same tokens, tighter padding. Admin-gating untouched.
- **404 (`NotFound`):** mark + clear headline + primary "Back home" + secondary search; gentle float (transform-only, reduced-motion static).

---

## 8. Component-by-component upgrade list

| Component(s) | Upgrade |
|---|---|
| `ui/button.tsx` | Add `premium` variant (specular + sheen + press-scale + loading slot). `default/outline/ghost/accent` unchanged in look. |
| `ui/badge`, `layout/PagePrimitives Pill` | Difficulty/status dots with token colours; active pill spring fill. |
| `ui/input`, `textarea`, `select`, `checkbox` | Focus ring cobalt + border brighten (transition colours only); floating label via `Field`; error state with icon + text + shake (transform-only). |
| `ui/dialog`, `alert-dialog`, `sheet` | Spring scale/fade entrance, backdrop opacity-only, focus trap + restore, Escape. |
| `ui/dropdown-menu`, `command`, `tooltip` | Elevated glass, staggered item entrance, kbd chips, arrow-key nav (Radix/`cmdk` defaults preserved). |
| `ui/progress`, `progress-ring` | `scaleX` fill / ring stroke-draw on enter; tabular-nums. |
| `ui/skeleton` | Shimmer sweep (transform-only pseudo-element). |
| `ui/sonner`/`toast` | Slide-up entrance, action button, `aria-live` preserved. |
| `CodeBlock` | Header glass, copy-button check feedback, line-highlight fade. |
| `ActivityHeatmap` | Staggered cell entrance, hover tooltip, reduced-motion static. |
| `GuruBot` / `guru/*` | Message rise, thinking halo (existing), composer focus, code copy feedback. |
| `roadmap/*`, `contest/coding/*`, `playground/*`, `editor/LeetCodeEditor` | Chrome-only polish (§7.3/§7.5/§7.6); zero behaviour/theme/canvas changes. |
| `brand/BrandLoader`, `layout/RouteFallback` | Keep the mark; shimmer skeletons shaped like real layouts; cross-fade (no jump — the boot splash and `AppLoadingScreen` already share an ambient wash; keep them matched). |

---

## 9. Implementation phases (order matters)

### Phase 0 — Baseline (half a day)
Re-baseline the known issues from the previous plan (verify, don't assume): `tsc --noEmit` error list, `javaProblemBank.test.ts` failures, contest/backend suite timeouts under load. Capture before-screenshots (dark/light, 1440px + 390px) of every route in §3 using the temporary harness pattern (HTML entry + `src/*-preview.tsx` rendering the page in `MemoryRouter` + providers, served by `npx vite`, **deleted afterwards** — never committed). Record the decor-grep baseline (~10 matches / 3 files).

### Phase 1 — Premium foundation (Section 5)
Tokens (`index.css`) → `ui.css` additions → `PagePrimitives` → `Button premium` → motion presets (`lib/motion.ts`, `Reveal` variants) → app chrome (§7.0: header, sidebar, mobile nav, Guru, search, notifications, toasts, loaders, footer). **Gate:** full test suite + build + screenshot matrix.

### Phase 2 — Flagship & entry (highest traffic)
`/` (landing, §7.1) → `/auth` → `/practice` → `/interview` hub → `/contest` landing. **Gate:** focused tests (`Index.test`, `QuizSection.test`, `PrimaryNavigation.test`) + build + screenshots vs. home reference.

### Phase 3 — Interview tracks
Hubs (Java → Python/C++ → Spring) → question lists → question details → annotations/practice → system design → coming-soon layout. Restyle `core-java-interview.css` tokens/cards in the CSS file first, then migrate pages to primitives. **Gate:** `BackendInterviewPages.test`, `JavaInterviewHub.test` + build.

### Phase 4 — Content & utility
`/:topicId` → `/practice/solution/*` → `/profile` → `/notes` → `/buy-me-a-coffee` → `/admin` → `/reset-password` → 404. **Gate:** full suite + build.

### Phase 5 — Immersive workspaces (chrome only)
`/problem-solver` → `/playground` → `/contest/quiz` → `/contest/coding` → `/contest/coding/session/:sessionId` → `/contest/coding/result/:sessionId` → `/roadmap` (+ overlay). **Gate:** contest + quiz suites (`Quiz.test`, `CodingContest*`, `ProblemSolver.test`) + build + keyboard/reduced-motion pass on the exam surfaces.

### Phase 6 — Polish & hardening
Cross-page consistency sweep (grep §10), light-mode pass, 390px pass, performance pass (bundle chunks already split in `vite.config.ts` — keep Monaco/markdown/PDF lazy), SEO/meta pass (`index.html` has full OG/Twitter/manifest — verify nothing regressed), final screenshot comparison.

Each phase ships as its own commit(s) so any phase can be reverted independently without touching earlier phases (presentational-only = safe rollback).

---

## 10. Patterns to remove / never reintroduce

Search each page with the previous plan's grep and extend it with the new bans:

```powershell
Select-String -Path src\pages\*.tsx,src\pages\**\*.tsx,src\components\**\*.tsx -Pattern 'aurora-blob|bg-clip-text|bg-gradient-to|radial-gradient|animate-ping|font-display|font-black|rounded-3xl|SpotlightCard|premium-card|button-shine|icon-tile|bg-grid|bg-noise|bg-dots|white/\[0\.|obsidian-accent|uppercase|useState.*cursor|useState.*mouse|Three|Canvas'
```

| Pattern | Replace with |
|---|---|
| Gradient headline text, gradient buttons/badges/progress | Flat `text-foreground` / solid fills; ambience only via `--premium-*` tokens in hero/CTA |
| `SpotlightCard`/cursor-glow components with React state | Shared `.lp-spotlight` via motion values (CSS vars), disabled on touch/reduced-motion |
| Magnetic/tilt on app controls | Landing hero CTAs only, ≤4px, motion values |
| `aurora-blob`/`bg-noise`/`bg-grid` page backgrounds | Plain void, or a `.lp-band`; one texture max per page at ≤4% |
| `animate-ping` dots | Static dot; ping only for a genuinely live contest/busy state |
| `AnimatedCounter` via state loops | Spring count-up (`useSpring`) with tabular-nums, instant under reduced-motion |
| `font-display` outside hero H1/stats, `font-black`, uppercase micro-labels | `font-sans font-semibold`, sentence-case 13px labels |
| `rounded-3xl`+, `bg-white/[0.0x]`, heavy in-flow blur | `rounded-[0.875rem]`, `bg-foreground/[0.0x]`, blur on floating layers only |
| Any `width/height/top/left` animation, state-driven cursor tracking, canvas/Three.js in editors | Transform/opacity only; motion values; nothing in editor routes |

---

## 11. Verification (mandatory — Guardrail §5)

**After every component/page edit:**
```powershell
npx tsc --noEmit -p tsconfig.app.json
npm run lint
npx vitest run <tests for that page>   # e.g. src/pages/Quiz.test.tsx
```

**After each phase:**
```powershell
npx vitest run        # whole suite (57 files)
npx vite build        # production build
```

**Visual & interaction checklist (every page):**
1. Screenshots: dark + light at 1440px, dark at 390px; compare against the home page side by side — spacing, border weight, heading style must read as one product.
2. Keyboard: Tab through the whole page — focus visible on every control; Escape closes menus/dialogs/drawers; focus returns to the trigger.
3. Reduced motion (OS setting or DevTools emulation): content in final state, nothing hidden, all functionality identical.
4. No horizontal scrolling at 390px; sidebar/dock/Guru controls never hidden or clipped at any supported width.
5. States: loading, empty, error, signed-in, signed-out all render and look consistent.
6. No console errors; no broken links; `/:topicId` catch-all and `*` ordering verified (e.g. `/contest` still hits the contest landing, `/arrays` still hits the topic page).
7. Performance spot-check: no new long tasks from motion; CLS < 0.1 on the landing and a list page.

**Per-page Definition of Done:** uses shared container/header/surface styles and lines up with the app header · none of the §10 patterns remain (or each has a stated reason) · consistent with the home page in dark/light/mobile screenshots · lint + focused tests + build pass · no routes, data calls, props, ids, or aria attributes changed.

**Rollout Definition of Done:** every route in §3 meets the per-page bar · `core-java-interview.css` legacy rules removed where pages migrated · no new dependencies · screenshot matrix + full suite + build green.

---

## 12. Risks, mitigations & decisions

| Risk | Mitigation |
|---|---|
| Scope: 40+ routes, ~33k lines in pages alone | Phase order (§9) ships value after Phase 1; each phase independently revertable. |
| Heavy files (`Playground` 4.9k, `ProblemSolver` 2.5k, `Profile` 2.2k) | Chrome-only rule (§2.3); section-by-section edits; focused tests per section. |
| Test breakage from class/structure changes (`Index.test`, `BrandLoader.test`, nav tests) | Never change asserted classes/ids; update tests in the same commit with the reason; run focused tests before moving on. |
| Animation jank / CLS | Transform/opacity only, motion values, off-screen pausing, shaped skeletons (§6.3). |
| Light mode regressing (dark has been the focus) | Every phase includes a light-mode screenshot; `bg-foreground/[0.0x]` rule; token-level colours only. |
| Editor/exam behaviour accidentally changed | Explicit chrome-only boundaries (§7.3/§7.5); timer/integrity/submit/Monaco/canvas are frozen contracts. |
| `@vengeanceui` temptation (Guardrail lists it) | Not installed → local equivalents (§4.6). No new dependency without a separate decision. |
| Baselines drift (tsc errors, flaky suites) | Phase 0 re-baseline; distinguish pre-existing failures from regressions in every report. |

**Key decisions locked by this plan:** Obsidian dark-first with first-class light mode · cobalt accent discipline, violet reserved for Guru · Inter as the product voice, Space Grotesk only on the landing hero · `ui.css` + `PagePrimitives` + `lib/motion.ts` remain the single design/motion systems · no new packages · routes, data, auth, and behaviour frozen.

---

## Appendix A — Exact route × file × priority matrix

| # | Route | File | Priority | Phase |
|---|---|---|---|---|
| 1 | `/` | `pages/Index.tsx`, `components/landing/*` | P0 flagship | 2 |
| 2 | `/auth` | `pages/Auth.tsx` | P0 | 2 |
| 3 | `/practice` | `pages/Practice.tsx` | P0 | 2 |
| 4 | `/interview`, `/interview/:language` | `pages/Interview.tsx`, 3 hubs | P0 | 2–3 |
| 5 | `/contest` | `pages/contest/ContestLanding.tsx` | P0 | 2 |
| 6 | `/interview/:language/core-java-qa[/:slug]` | 2 files (1,046/540) | P1 | 3 |
| 7 | `/interview/:language/language-questions[/:slug]` | wrapper + C++/Python (4 files) | P1 | 3 |
| 8 | `/interview/:language/spring-boot[/questions[/:slug]/annotations/practice[/:id]]` | 5 files | P1 | 3 |
| 9 | `/interview/:language/system-design` | 1 file (838) | P1 | 3 |
| 10 | `/interview/:language/data-structure`, `sql-structure` | 2 thin wrappers → shared layout | P1 | 3 |
| 11 | `/:topicId` | `pages/TopicPage.tsx` (~200 topics) | P1 | 4 |
| 12 | `/practice/solution/:problemId[/:slug]` | `pages/PracticeSolution.tsx` | P1 | 4 |
| 13 | `/profile` | `pages/Profile.tsx` | P1 | 4 |
| 14 | `/notes` | `pages/NotesDashboard.tsx` | P1 | 4 |
| 15 | `/playground` | `pages/Playground.tsx` | P1 (chrome) | 5 |
| 16 | `/problem-solver` | `pages/ProblemSolver.tsx` | P1 (chrome) | 5 |
| 17 | `/contest/quiz`, `/quiz` redirect | `pages/Quiz.tsx` | P1 | 5 |
| 18 | `/contest/coding`, `/contest/coding/session/:id`, `/contest/coding/result/:id` | 3 files + `coding/*` | P1 | 5 |
| 19 | `/roadmap`, `/roadmap/:id` | `RoadmapFullscreenRoute` + `roadmap/*` | P1 (chrome) | 5 |
| 20 | `/buy-me-a-coffee`, `/support` | `pages/BuyMeACoffee.tsx` | P2 | 4 |
| 21 | `/admin` | `pages/Admin.tsx` | P2 | 4 |
| 22 | `/reset-password` | `pages/ResetPassword.tsx` | P2 | 4 |
| 23 | `*` | `pages/NotFound.tsx` | P2 | 4 |
| — | Global chrome (header, sidebar, Guru, search, dock, footer, loaders, toasts) | `App.tsx`, `components/layout/*`, `AppSidebar`, `GuruBot`, `Footer` | **P0 foundation** | 1 |

## Appendix B — Commands cheat sheet

```powershell
npm run dev                                   # dev server (port 8080)
npx tsc --noEmit -p tsconfig.app.json         # typecheck (per edit)
npm run lint                                  # lint (per edit)
npx vitest run <file>                         # focused tests (per edit)
npx vitest run                                # full suite (per phase)
npx vite build                                # production build (per phase)
npm test -- src/pages/Index.test.tsx src/components/quiz/QuizSection.test.tsx   # landing regression
npm test -- src/components/layout/PrimaryNavigation.test.tsx                     # nav regression
```

*End of plan. Implementation starts with Phase 0 baseline, then Phase 1 foundation — one page at a time, verified at every step.*
