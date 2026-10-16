# AlgoGuru — Product UI/UX Audit & Redesign Plan

**Scope:** Every page, component, workflow, state, and interaction in `Algoguru/`.
**Goal:** Turn a competent but "AI-generated-feeling" app into a premium, handcrafted product on the level of Linear, GitHub, Notion, Stripe, Vercel, Cursor, and LeetCode Premium — with measurably better usability, trust, engagement, retention, and accessibility.
**Evidence base:** Full source review of `src/` (400+ files), `tailwind.config.ts`, `src/index.css` (2,394 lines), all 49 `src/components/ui/*` primitives, every route in `src/App.tsx`, plus quantitative greps for the visual patterns below.

---

## Table of contents

- [Part 0 — Executive diagnosis](#part-0--executive-diagnosis)
- [Part 1 — The 12 tells that make AlgoGuru feel AI-generated](#part-1--the-12-tells-that-make-algoguru-feel-ai-generated)
- [Part 2 — Design principles (the North Star)](#part-2--design-principles-the-north-star)
- [Part 3 — Information architecture redesign](#part-3--information-architecture-redesign)
- [Part 4 — The AlgoGuru Design System](#part-4--the-algoguru-design-system)
- [Part 5 — App shell: navigation, header, search, footer](#part-5--app-shell-navigation-header-search-footer)
- [Part 6 — Page-by-page redesign](#part-6--page-by-page-redesign)
- [Part 7 — Microinteractions & motion catalog](#part-7--microinteractions--motion-catalog)
- [Part 8 — Content, voice & trust](#part-8-content-voice--trust)
- [Part 9 — Implementation roadmap](#part-9--implementation-roadmap)
- [Part 10 — Success metrics & release checklist](#part-10--success-metrics--release-checklist)

---

# Part 0 — Executive diagnosis

AlgoGuru has a genuinely strong core: the contest workspace is among the best exam UIs in its category (real ARIA roles, `role="timer"` with `sr-only` urgency labels, honest "Development mode" banners, draft-recovery with `resolveDraft`), ProblemSolver has proper roving-tabindex tablists and a real editor/test split, and the content depth (DSA + Java + Spring + interview banks) is a moat. The problem is not engineering quality. **The problem is that the product has no single design voice.**

Today the app ships at least **six parallel visual systems**:

1. shadcn/Tailwind tokens (`bg-card`, `text-muted-foreground`) — `src/components/ui/*`
2. `cjh-*` / `cjq-*` / `cjd-*` document CSS — `src/styles/core-java-interview.css` (3,487 lines)
3. `--reader-*` / `--reading-*` prose token families — `src/index.css`
4. `--surface-*` contest chrome ladder — `src/index.css`
5. `lc-*` LeetCode-playground alias layer — `src/index.css:1652–2265`
6. `solver-*` / `cr-*` / `diag-*` bespoke page systems — `ProblemSolver.css`, `index.css`, `DiagramRenderer.tsx`

…plus **380 hardcoded hex literals across 32 files**, **561 arbitrary `text-[NNpx]` sizes across 61 files**, **4 competing difficulty-color systems**, **5 prose stacks**, **3 near-black code surfaces** (`#1a1a1a`, `#0E1016`, `#1B1A18`), and **3 mutually incompatible interview hubs** (a docs site, a bootcamp landing page, and a "Masterclass" sales page). Nothing is broken — but nothing is *one product* either.

The redesign has three mandates:

1. **One design system.** Kill the parallel systems; converge everything on a single token vocabulary and a strict type/radius/shadow scale.
2. **Content-first layouts.** Replace decorative card grids and gradient heroes with dense, scannable, information-dense surfaces (lists, tables, document pages) — the way Linear, GitHub, and LeetCode Premium actually look.
3. **Honest, human product voice.** Remove marketing-speak from inside the product, fix the trust leaks (placeholder URLs, unverifiable stats, "Content Verified" badges on empty pages), and add the missing retention layer (onboarding, settings, streaks done properly).

---

# Part 1 — The 12 tells that make AlgoGuru feel AI-generated

Each tell includes the evidence and the fix direction (full fixes in Part 6).

### 1. The gradient-text hero with a value-prop H1
`Index.tsx:117` renders "Become the engineer **teams fight to hire.**" as `bg-gradient-to-r from-primary via-[#60A5FA] to-accent bg-clip-text text-transparent`, over a radial glow + masked dot grid. The identical recipe is copy-pasted into `Interview.tsx:185–200`, `Practice.tsx`, `Quiz.tsx`, `NotesDashboard`, `Admin.tsx`, `BuyMeACoffee.tsx`. Real products (Linear, Vercel, Stripe) never gradient their headlines; the whole idea of a marketing hero *inside a logged-in app* is the tell. The hardcoded mid-stop `#60A5FA` also bypasses the token system.

**Fix:** Delete gradient text entirely. Inside the product, replace "hero" sections with compact page headers (eyebrow + H1 + one supporting line + primary action). Reserve any hero treatment for a true logged-out landing page.

### 2. The card grid as a default layout
`Index.tsx:255–280` and `Interview.tsx:222–244` use the *same* card recipe: `min-h-[280px] rounded-3xl border … shadow-card`, `whileHover={{ y: -6 }}`, a 3px top gradient bar `scale-x-0 → scale-x-100`, and a radial hover tint. 298 `rounded-xl|2xl|3xl` hits across 60 files. Grids of equal cards with icons are the canonical AI-template layout: they flatten hierarchy and force the user to read every tile.

**Fix:** Default to **lists and tables** (GitHub/LeetCode), **documents** (Notion), and **split panes** (Linear/Cursor). Cards only for genuinely peer, repeated objects (3–6 max), never as page scaffolding.

### 3. Micro-typography noise
A tic of generated UI: `text-[9.5px] font-semibold uppercase tracking-widest` labels everywhere (sidebar dividers, `DifficultyPill` at `text-[9px]`, NotesDashboard buttons at `text-[10px] font-bold uppercase tracking-widest`). 561 arbitrary `text-[NNpx]` values (`text-[15.5px]`, `text-[12.5px]`, `text-[13px]` on tab triggers). Tiny uppercase tracked labels look "designed" at a glance but hurt readability and scream template.

**Fix:** A 7-step type scale (Part 4), minimum 11px for any text, uppercase only for true eyebrows and table headers, `tracking-widest` banned outside eyebrows.

### 4. Gradient + glass + glow decoration without function
Header shimmer strip (`App.tsx:372+`), `backdrop-blur-*` in 49 places across 32 files with **4 different sticky-header recipes** (`bg-background/95 blur-xl`, `bg-background/90 blur-md`, `bg-card/95 blur-md`, `bg-card/90 blur-xl`), logo glow `boxShadow: 0 0 16px hsl(var(--primary)/0.35)`, `blur-[160px]` blobs on the Coming Soon page, `blur-3xl` blobs on `ContestLanding`. `glass-panel` in `index.css` isn't even glass — it's `bg-card + border`.

**Fix:** One sticky-header recipe, one scrim recipe. Elevation via borders and a 4-step shadow ladder (Linear's approach), not blur and glow. Gradients only for data visualization and brand marks.

### 5. Emoji and glyph soup as icons
`data/topics.ts` uses raw unicode `"▦ ☰ ↻ ← ⊞ ◉ ⊕ △ ✦ ∑ ▥ ∫"` **plus literal `🌳` and `⚡`**; `searchIndex.ts` tool docs use `🏠 ⌨️ 🎯 🧠 🏆 🎤 🗺️ 📓 👤 🛡️ 💬 ☕ 🍃 🏗️`; interview topics use emoji (`📚`, `🔥 Very High Priority`); `SupportModal` uses flag emoji as tab labels (`UPI 🇮🇳 | Web 🌍 | Crypto ₿`) while navigation uses lucide. Three icon systems in one sidebar.

**Fix:** One icon set (lucide), consistent stroke/size, small semantic dot markers for difficulty/status. Zero emoji in UI chrome (emoji are acceptable inside content prose only).

### 6. Symmetry and repetition
Every page repeats the same skeleton: radial-glow hero → pill eyebrow → H1 with one `text-primary` word → muted sub → card grid → stat tiles. Notes/Admin/BuyMeACoffee heroes are structurally identical (`My **notes**`, `Platform **control**`, `Buy me a **coffee**`). Stat-tile rows appear on Index, Admin, BuyMeACoffee, Profile, Cpp hub, Backend hub — six hand-rolled variants of the same tile.

**Fix:** Asymmetric, content-driven layouts. One shared `PageHeader` and one shared `StatTile` primitive, and page layouts that follow the content's shape rather than a fixed hero→grid→footer rhythm.

### 7. Buzzword copy inside the product
"teams fight to hire", "Land FAANG roles", "crush technical interviews", "Master C++. Prepare smarter. Crack the interview.", "Interview Masterclass", "100% Free forever", "From first click to offer letter.", "no fluff, just momentum.", "We're meticulously crafting the ultimate interview preparation experience…". Meanwhile the *tool* chrome (ProblemSolver, contest workspace) is restrained and professional — the whiplash reads as generated filler.

**Fix:** Voice guide (Part 8). Marketing claims only on a logged-out landing page; inside the product, concrete and literal copy ("48 of 312 solved", not "Master code. Ace interviews.").

### 8. Trust leaks and template leftovers
- `BUYMEACOFFEE_URL` defaults to `https://buymeacoffee.com/YourName` and `UPI_ID` to `your-upi@id` — placeholders leak to users.
- "12k+ learners" trust chip on BuyMeACoffee is unverifiable.
- `InterviewComingSoonLayout` shows **"Content Verified" and "Expert Reviewed"** chips (at `text-muted-foreground/40`) on a page with no content, plus an H1 where **every second word is colored** (`i % 2 === 1`).
- `index.html` still contains `<!-- TODO: Set the document title… -->` and bare `description: "AlgoGuru"`; `theme-color #2563EB` doesn't match `--primary`.
- `NotFound.tsx` is verbatim template ("Oops! The page you're looking for doesn't exist.") with `console.error` and a full-reload `<a href="/">`.
- localStorage keys `cp-theme` / `cp-fontsize` / `cp-content-width` are leftovers from another product ("CodingPlayground") in a product called AlgoGuru.
- `Profile.tsx` has a **dead "Share" button** (no `onClick`) and placeholder panels ("Edit profile to add skills") that don't correspond to real features.

**Fix:** Delete or complete every placeholder. Rename storage keys to `algoguru:*`. Trust is a design material — fake badges and dead buttons destroy it faster than any visual flaw.

### 9. Dead code rendering as competing concepts
- `QuizPlayer.tsx` (821 lines, orphaned) duplicates the live `Quiz.tsx` concept with a different UX.
- `RoadmapHub.tsx`, `RoadmapPage.tsx`, `JavaTreeBanner.tsx`, `BrandLoader.tsx`, `BrandSplash.tsx` — all imported nowhere. The designed splash never shows; users see "Loading…" + `animate-pulse` bar instead.
- `PagePrimitives.tsx` defines a real layout system used by exactly **one** consumer (`JavaInterviewHub`).
- `ui/chart.tsx` (Recharts wrapper) imported nowhere.
- `contentWidth` setting exists with no consumer.

**Fix:** Delete all dead code in the first implementation phase. Competing concepts that ship (Quiz vs QuizPlayer) are visible debt.

### 10. Inconsistency as a style
- **4 difficulty systems:** `difficulty-*` tokens, `cr-diff-*` (with a phantom "Expert" tier), `solver-difficulty-*`, `lc-difficulty-*`, plus raw `text-red-500 / orange-500 / emerald-500` in Quiz.
- **3 Monaco themes** claimed "identical" in comments but different (`#0E1016` vs `#1B1A18`).
- **2 markdown engines:** react-markdown+KaTeX (editorial) vs a hand-rolled regex mini-parser (`ContentRenderer.renderMarkdown`) vs a third variant in Playground that *strips* `**` instead of rendering it.
- **2 search systems** with the same placeholder ("Search topics, problems…"): header `GlobalSearch` (cmdk) and `AppSidebar`'s inline search.
- **3 theme toggles** (header, TopicPage toolbar, Auth) and **2 font-size controls** showing the same state differently (`85/100/115/125%` vs `SM/MD/LG/XL`).
- **Persistence messaging contradicts itself:** "saved to your AlgoGuru account" (Core Java) vs "Saved in this browser" (Backend) in the same product.
- Radius vocabulary `rounded-md → rounded-3xl` used freely per page; `rounded-lg` (12px) and default `rounded-xl` (12px) **collide** in `tailwind.config.ts`.

**Fix:** Consolidate every one of these (Part 4 defines the single system; Part 9 sequences the migration).

### 11. Accessibility gaps that betray generated UI
Clickable `motion.div` cards with no `role`/`tabIndex`/keyboard handler (Index learning-path cards); modals without `role="dialog"`, focus trap, or Esc (Profile ×2, NotesDashboard); form labels not programmatically bound (Auth `Field`, ResetPassword, Admin role select); icon-only buttons without `aria-label` (Auth password eyes, SupportModal close); hover-only interactions (Profile difficulty legend, heatmap cells); 10px text at `text-muted-foreground/40` contrast; the mobile search trigger works by `document.querySelector('[data-search-trigger="true"]')?.click()`.

**Fix:** WCAG 2.2 AA as a release gate (Part 4.9). Every interactive element reachable, labeled, and visible-focused.

### 12. No onboarding, no settings page, no mock interviews
For a learning product there is **no first-run experience** (no tour, no checklist, no sample problem), **no settings page** (settings are scattered across 3 places, two of them inconsistent), and **no mock interview product** at all despite it being a stated area. Retention-critical surfaces are simply missing while decorative surfaces (blobs, shimmer, glow) are polished.

**Fix:** Part 6 defines the onboarding flow, a real `/settings` page, and the mock-interview product built on the existing contest integrity stack.

---

# Part 2 — Design principles (the North Star)

> **AlgoGuru is a workspace for serious engineers, not a brochure.**
> Every screen should feel like a tool a working engineer keeps open all day: quiet, dense, fast, and legible — with one expressive brand moment per surface, never more.

1. **Content is the interface.** The statement, the code, the question, the answer are the design. Chrome recedes. If an element doesn't help read, write, or decide — remove it.
2. **One hierarchy per screen.** Exactly one dominant element (H1 or the editor), one primary action per view. Everything else is secondary or tertiary. No "two equal columns of equal cards."
3. **Density is a feature.** Learning tools are used daily. Optimize for scanning: rows over cards, tables over tiles, 13–15px UI text, tight-but-rhythmic spacing.
4. **Quiet by default, expressive at moments of progress.** Save the delight for completions, streaks, contest finish — not for hover states on navigation.
5. **Earn trust visibly.** Honest states ("Development mode — results do not count"), consistent persistence messaging ("Saved to your account" everywhere it's true), no fake badges, no placeholder URLs, no unverifiable stats.
6. **One system, enforced.** Every color, size, radius, shadow, and duration comes from tokens. If a value isn't in the system, the system gets a new token — code doesn't get a new literal.
7. **Progressive disclosure over feature walls.** Advanced controls (templates, debug trace, editor settings) hide behind menus/panels until needed. Coming-soon surfaces are removed from nav until real.
8. **Keyboard-first, mouse-friendly.** ⌘K, tab lists with arrows, single-key shortcuts in the solver/roadmap, visible focus everywhere. Power users are the retention core.
9. **Motion communicates state, never decorates.** 120–250ms, ease-out, transform/opacity only, fully disabled under `prefers-reduced-motion`.
10. **Design for the worst day.** Loading, empty, error, offline, expired session, slow API — these states get the same craft as happy paths. They are where trust is won.

---

# Part 3 — Information architecture redesign

## 3.1 Problems with the current IA

- **Everything is login-gated** (`ProtectedRoute` wraps all routes except `/auth`), yet the home page is a marketing landing ("Become the engineer teams fight to hire") — a logged-in user sees sales copy for a product they already use.
- **`/:topicId` is a catch-all route** under the app shell, so unknown URLs render an inline "Topic not found" inside `TopicPage` while multi-segment unknowns render a completely different `NotFound` — two 404s.
- **Interview IA is by *implementation*, not by user intent**: `/interview/:language/language-questions`, `/core-java-qa`, `/spring-boot/questions`, `/spring-boot/annotations`, `/spring-boot/practice`, `/system-design`, `/data-structure` (stub), `/sql-structure` (stub) — with three different hub designs behind them.
- **Dead-ends in primary nav**: hubs advertise Data Structure and SQL tracks that land on a Coming Soon page (2 of 5 Java paths, 2 of 4 C++ paths).
- **Duplicates**: `/support` and `/buy-me-a-coffee`; `/quiz` and `/java-roadmap` redirects; two search entry points.
- **No settings route**; Profile mixes identity, stats, platform linking, and (implicitly) settings.

## 3.2 Target IA

```
/                          → Home (personal dashboard — see 6.3)
/learn                     → Curriculum: tracks (DSA, Java, Spring, System Design)
/learn/:track              → Track overview (syllabus, progress, continue)
/learn/:track/:topic       → Lesson (document page — replaces TopicPage)
/practice                  → Problem set (list/table with filters — see 6.5)
/practice/:problemId       → Problem workspace (solver — see 6.6)
/practice/:problemId/:slug → same route, canonical slug
/playground                → Code playground
/contest                   → Contests hub (landing)
/contest/quiz              → MCQ exam (chrome-free)
/contest/coding            → Coding exam instructions (chrome-free)
/contest/coding/session/:id→ Coding exam session (chrome-free)
/contest/coding/result/:id → Exam report
/interview                 → Interview prep home (ONE hub design — see 6.11)
/interview/:track          → Track (java | cpp | python | backend | system-design)
/interview/:track/:slug    → Question detail
/interview/mock            → Mock interviews (new product — see 6.10)
/roadmap/:id               → Roadmap graph (fullscreen)
/guru                      → AI Guru history/search (panel remains global)
/notes                     → Notes
/profile                   → Profile (identity + stats only)
/settings                  → Settings (new — appearance, editor, account, privacy)
/admin                     → Admin
/404                       → single catch-all 404
```

Rules:
- **Remove `/:topicId` catch-all.** Lessons live under `/learn/:track/:topic`; unknown paths hit the single 404.
- **Collapse interview routes** to `/:track/:slug` with one Q&A renderer (kill the three 1,000-line near-clone pages).
- **Remove stub routes from navigation.** Data Structure / SQL tracks render as "Planned" *list items without links* until shipped; `InterviewComingSoonLayout` is deleted.
- **One search** (⌘K palette) — delete `AppSidebar`'s inline search.
- **One support page** (`/support`), delete `/buy-me-a-coffee` alias.
- **Lazy-load every route** (`React.lazy` + Suspense with the brand skeleton). Today all 400+ files are eagerly imported including ~15 content banks in `AppSidebar` just to build a local search index.

## 3.3 Navigation model

**Global chrome** (all app routes): left sidebar (collapsible, resizable) + 52px sticky header + optional Guru rail.

**Sidebar taxonomy** (single level of grouping, lucide icons only):

```
[Brand + workspace switcher]
[Search field → opens ⌘K]
──
Home
Learn
Practice
Playground
Contests
Interview prep
Roadmaps
──
Notes
──
Profile · Settings · (Admin)
```

Mode switching (DSA / Java / Practice — the current `ModeContext` with `⊞ ☕ 🏆` glyph badges) should become a **filter inside Learn/Practice**, not a global mode that silently swaps the sidebar tree. A global mode that changes navigation context without an obvious mode control is a usability trap (users currently must read tiny glyph badges to know where they are).

---

# Part 4 — The AlgoGuru Design System

This replaces all six parallel systems. Everything below maps to tokens in `tailwind.config.ts` + `src/index.css`; no literals in components.

## 4.1 Color

**Principle:** neutral-first. One brand accent. Semantic colors used only for semantics. Difficulty colors are data, not decoration.

### Neutrals (oklch, both themes)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FCFCFD` | `#0B0D10` | app background (never pure white/black) |
| `--bg-subtle` | `#F7F8FA` | `#111419` | section bands, table headers |
| `--surface` | `#FFFFFF` | `#151920` | cards, panels, popovers |
| `--surface-raised` | `#FFFFFF` | `#1B2029` | menus, hovers, modals |
| `--line` | `#E7E9EE` | `#232932` | default borders |
| `--line-strong` | `#D3D8E0` | `#333B47` | dividers, input borders |
| `--ink` | `#12161D` | `#E9EDF3` | primary text |
| `--ink-muted` | `#5B6472` | `#9AA4B2` | secondary text (AA on surface) |
| `--ink-faint` | `#838D9B` | `#6E7887` | tertiary/meta (AA at ≥12px only) |

### Brand & semantic

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#2E6BE6` | `#5B9CFF` | primary actions, links, focus, active nav |
| `--accent-hover` | `#2559C4` | `#7DB2FF` | hover |
| `--accent-soft` | `#EAF1FE` | `rgba(91,156,255,.14)` | selected rows, active nav bg |
| `--success` | `#12855C` | `#3CCB8F` | accepted, completed |
| `--warning` | `#A96A0B` | `#E8B25A` | warnings, time pressure |
| `--danger` | `#C4322B` | `#F0736B` | errors, destructive |
| `--info` | `#2563A8` | `#6FB2F2` | informational |

`--success`, `--warning`, `--info` **must be redefined in dark mode** (today they silently keep day values on near-black surfaces — a real bug in `index.css`).

### Difficulty (single system, replaces 4)

| | Light text | Dark text | Soft bg (both) | Dot |
|---|---|---|---|---|
| Easy | `#0E7A55` | `#49D69D` | `rgba(18,133,92,.10)` | same |
| Medium | `#96600A` | `#EDB45E` | `rgba(169,106,11,.10)` | same |
| Hard | `#B32D27` | `#F4827B` | `rgba(196,50,43,.10)` | same |

No "Expert" tier (nothing else in the product uses it). Rendered as `dot + word` (never color alone), one component: `<DifficultyBadge level="easy" />`.

### Rules
- **Banned:** `#60A5FA` hero mid-stops, 30 hardcoded per-topic gradient pairs (`AppSidebar.topicColors`), `neutral-800/indigo-500` chat palette, `amber-500/rose-500/emerald-500` raw utilities, `.cr-callout-*` hardcoded HSL triplets, `#0D0D0D` code backgrounds.
- Topic identity: a **single hue per track** (DSA blue, Java amber, Spring green, System Design violet) used at 8–12% tint for icon tiles and left rails — flat tints, not gradients.
- Diagram palette: derive from the same tokens with dedicated `--diag-fill-1..4` (light + dark variants actually applied — today `LayersDiagram` always renders `*Light` pastels even in dark mode).

## 4.2 Typography

**Two families only** (down from 8 loaded):
- **UI:** `Inter` (variable, 400/500/600/650) — body, UI, headings.
- **Mono:** `JetBrains Mono` (400/500) — code, data, timers, IDs.

`Space Grotesk` may remain as the **display/brand** face for the wordmark and rare marketing moments only. `Outfit`, `Roboto`, `Source Sans 3`, `Source Code Pro`, `Fira Code`, `Roboto Mono` are removed.

**Type scale** (rem-based so the user font-size setting works; `text-[NNpx]` banned):

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 40 / 44 (mobile 30/36) | 650 | page titles on top-level pages only |
| `h1` | 28 / 34 | 650 | page titles |
| `h2` | 21 / 28 | 600 | section headings |
| `h3` | 17 / 24 | 600 | sub-sections, card titles |
| `body-lg` | 16 / 26 | 400 | lesson prose |
| `body` | 14 / 22 | 400 | default UI text |
| `ui` | 13 / 18 | 500 | buttons, tabs, inputs, table cells |
| `meta` | 12 / 16 | 500 | timestamps, counts, chips |
| `mono` | 13 / 20 | 400 | code, data readouts |

Rules:
- Minimum rendered size **11px** (only for `meta` inside dense tables).
- Uppercase + letter-spacing only for: eyebrows (`meta`, `tracking-[0.08em]`) and table column headers. Nothing else.
- One prose system for all long-form (lesson, editorial, Q&A answer): max-width **68ch**, `body-lg`, headings `h2/h3`, code inline `mono` on `--bg-subtle`, callouts with a 3px left rule (not filled boxes).
- The user font-size setting rescales the *reading* column only (root `body-lg`/`body`), not the entire chrome — replaces the current global `documentElement.style.fontSize` hack which desyncs px-based utilities.

## 4.3 Spacing & layout

- **4px base grid.** Allowed steps: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Page container: `max-w-[1280px]` for app pages, `max-w-[720px]` for reading columns, `max-w-[880px]` for wide documents. **One `PageContainer` component** (fixes the current 4 competing container recipes).
- Page padding: `px-6` (mobile) → `px-8` (md) → `px-10` (lg). Vertical rhythm: page top `pt-8 pb-12`; section gaps `space-y-8`; within components `gap-3/gap-4`.
- Reading measure for lessons: honor `contentWidth` setting (already exists, currently consumed by one page) across lesson, editorial, and Q&A.
- Delete the "hero band" vertical padding (`py-24 md:py-32`) from all interior pages.

## 4.4 Radius

Fix the current collision (`rounded-lg` and `rounded-xl` are both 12px):

| Token | Value | Use |
|---|---|---|
| `radius-control` | 6px | buttons, inputs, tabs, chips, selects |
| `radius-surface` | 10px | cards, panels, popovers, code blocks |
| `radius-overlay` | 12px | modals, command palette |
| `radius-pill` | 999px | status dots containers, avatars, progress |

`rounded-3xl` (24px) is banned. The oversized `rounded-[32px]` note cards and `rounded-[48px]` Coming Soon card go away with their screens.

## 4.5 Elevation & borders

Linear/Notion model: **borders first, shadows second.** One ladder:

| Token | Value | Use |
|---|---|---|
| `elev-0` | none | default surfaces (border only) |
| `elev-1` | `0 1px 2px rgba(16,24,40,.06)` | cards on hover, dropdown triggers |
| `elev-2` | `0 8px 24px -6px rgba(16,24,40,.12), 0 2px 6px -2px rgba(16,24,40,.06)` | popovers, menus, tooltips |
| `elev-3` | `0 24px 48px -12px rgba(16,24,40,.22)` | modals, palette, drawers |

(Dark: `rgba(0,0,0,…)` equivalents.) Tailwind default shadows (`shadow-sm/md/lg/xl/2xl` — currently 112 hits) are banned; only token shadows. Glow effects (`0 0 10px`, `0 0 16px`) are removed everywhere except the contest clock's danger state.

## 4.6 Motion

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 120ms `cubic-bezier(.2,0,0,1)` | hover, color, opacity |
| `motion-base` | 200ms same | dropdowns, tabs, row expand |
| `motion-slow` | 320ms `cubic-bezier(.22,1,.36,1)` | panels, drawers, page transitions |
| `motion-spring` | spring (damping 26, stiffness 300) | command palette tab pill, completion moments |

Rules: transform/opacity only; framer-motion `whileHover={{ y: -6 }}` card-lift is removed (replace with border/ink change + `elev-1`); all infinite decorative loops (shimmer, glow-pulse, float) removed; `prefers-reduced-motion` reduces everything to 0.01ms (already partially handled in `App.css` — keep and extend). Duplicate keyframe definitions in `index.css` vs `tailwind.config.ts` (with conflicting −8px/−12px geometry) are consolidated to one source.

## 4.7 Icons

- **lucide only**, 16px default (14px in dense rows, 20px in empty states), stroke 1.75.
- Difficulty/status = **8px dot + text label**. Priority = dot + label ("High"), never `🔥`.
- Remove all unicode glyph icons (`▦ ☰ ∑ 🌳`) — topic tiles get a lucide icon from a curated 1:1 map in `data/topics.ts`.

## 4.8 Dark mode

- Keep class strategy (`darkMode: ["class"]`) but run on **one** provider: either wire `next-themes` (already a dependency, currently unmounted — `ui/sonner.tsx` reads `useTheme()` and always falls back to "system", a live bug) or drop the dependency. Recommendation: mount `next-themes` with `attribute="class"`, `defaultTheme="dark"`, and migrate `SettingsContext` to it.
- Token parity audit: every semantic token has a dark value; callout/prose/diagram palettes included.
- Code blocks are **theme-aware** everywhere (the `reader` surface in `CodeBlock.tsx` already does this; `editor` hardcodes `#1a1a1a` in light mode). One Monaco theme pair, shared by ProblemSolver/Playground/Contest (kills the 3 divergent copies).
- Contrast: body text ≥ 7:1, secondary ≥ 4.5:1, borders visible on both surfaces, focus rings ≥ 3:1 against adjacent colors.

## 4.9 Accessibility (release gate)

- **WCAG 2.2 AA** across all routes; verified with axe in CI plus manual keyboard passes.
- Every interactive element: reachable by Tab, visible `:focus-visible` ring (`2px --accent`, 2px offset), correct role. Clickable `motion.div` cards → real `<a>`/`<button>` (Index cards, JavaTreeBanner, hub cards).
- All modals/drawers: `role="dialog"`, `aria-modal`, focus trap, Esc to close, focus restored on unmount (fix Profile ×2, NotesDashboard, SupportModal, DraggableNoteEditor).
- All inputs: `<label for>` bound (Auth `Field`, ResetPassword, Profile modals, Admin role select, quiz config).
- Icon-only buttons: `aria-label` mandatory (lint rule). Tabs: `role="tablist"` + arrow keys everywhere (ProblemSolver pattern is the reference).
- No information by color alone: difficulty = dot+word, contest urgency already has `sr-only` text (keep), heatmap cells get keyboard navigation and `aria-label` per cell.
- Text ≥ 11px, interactive targets ≥ 32px desktop / 44px mobile, `text-muted-foreground/40` copy replaced with `--ink-faint` at AA.

## 4.10 Responsive

- **Three breakpoints** (today there are three *different* notions of "mobile": 768, 1024, 1024 — unify): `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- **Mobile navigation becomes a real drawer** (Sheet from bottom bar or left edge). Today the sidebar mounts as a 14–28% resizable panel on phones — a severe bug.
- Sticky headers: **one recipe** (`bg-[--bg]/85 backdrop-blur-md border-b border-[--line]`).
- Split panes: below `lg`, all `ResizablePanelGroup` surfaces collapse to tabs (ProblemSolver already does `Problem | Editor`; extend to Playground and contest).
- Fixed-width offenders fixed: `DraggableNoteEditor` (480px), contest header (`justify-between gap-3` no-wrap), `JavaTreeBanner` (1400px SVG), `cjq` header cluster.
- Tables: horizontal scroll with sticky first column, or convert to stacked rows on mobile (Admin users table).

## 4.11 Component inventory (shared primitives — kills the duplication)

Promote to `src/components/ui/` or `layout/` and **use everywhere**:

`PageContainer`, `PageHeader` (eyebrow, title, subtitle, actions — the only page top), `Section`, `Toolbar`, `DataTable`, `ListView` (rows with leading status, title, meta, trailing actions), `StatTile` (one design; replaces 6 hand-rolled variants), `DifficultyBadge`, `StatusDot`, `Chip`, `SegmentedControl`, `ProgressBar`, `EmptyState` (icon, title, one line, one action), `ErrorState` (title, cause, Retry), `Skeleton`, `ConfirmDialog` (replaces native `confirm()` in Admin and Playground), `Tooltip`, `Kbd`, `CopyButton`, `NoteEditor`, `CodeBlock` (one component, two themes, one surface behavior), `Prose` (the single prose wrapper).

`PagePrimitives.tsx` already contains a good start — it becomes the system (with `PageHeader` shrunk per 4.3) and **all pages migrate onto it**.

---

# Part 5 — App shell: navigation, header, search, footer

### What's wrong
- Sidebar mixes three icon systems (lucide + unicode glyphs + emoji), per-topic hardcoded gradient maps with glow shadows, a duplicate search input, 9.5px uppercase divider labels, and an online dot with `boxShadow` glow.
- The home route **unmounts the entire sidebar** until the user clicks a heading styled as a button ("Choose where to focus next." with `aria-expanded`) — undiscoverable, semantically wrong.
- Header carries 5 route-conditional special cases (`isHomeRoute`, `isContestLandingRoute`, `isPlaygroundRoute`, `isProblemSolverRoute`, `isRoadmapRoute`), a gradient shimmer strip, zoom cluster with cryptic `ZOOM_MAP` percentages, and a Guru button with an infinite shimmer.
- Footer exists only on `/` and repeats marketing copy; mobile search works by programmatically clicking a hidden desktop button.
- Two 404s; "Loading…" pulse bar instead of the (already built, orphaned) `BrandLoader`/`BrandSplash`.

### Why it feels artificial
Route-conditional chrome, decorative shimmer/glow, emoji/glyph soup, and a hidden-panel home are exactly the compromises a generator makes when it has no product model. Real products have one shell that behaves predictably everywhere.

### Redesign
1. **Sidebar:** flat nav list (3.3), lucide icons at 16px, 32px rows, active state = `--accent-soft` bg + `--ink` text + 2px left accent bar (no glow dot). Collapsed rail = icons only with tooltips; collapse persists (`algoguru:sidebar`). Mobile = slide-over Sheet + bottom tab bar (Home, Learn, Practice, Guru, Menu).
2. **Header (one recipe):** 52px, `bg/--line` per 4.10, contents: breadcrumb/page title · centered ⌘K search · [theme] [guru] [avatar]. Zoom moves to Settings (as "Interface density"); the header keeps a font-size control **only on reading pages**, rendered as one shared `ReadingToolbar`.
3. **Search:** single `GlobalSearch` (⌘K), grouped results (Problems / Topics / Questions / Contests / Actions), recent items, "N items indexed" removed from the footer. Delete `AppSidebar`'s inline search and its module-scope import of ~15 content banks (build the index lazily on first open — also fixes bundle size).
4. **Home shows the sidebar** like everywhere else. Delete `HomeSidebarContext` and the heading-as-toggle.
5. **Loading:** wire `BrandLoader` as the route Suspense fallback (it exists and respects `prefers-reduced-motion`); `ProtectedRoute`'s 180px logo + pulse bar goes away.
6. **404:** one `NotFound` (client-side `Link`, no `console.error`), with search + links to Learn / Practice; `TopicPage`'s inline "Topic not found" is removed with the catch-all route.
7. **Footer:** on Home and top-level index pages only (not in workspaces), reduced to product links, GitHub, support, version. Remove "⚡ Master code. Ace interviews." tagline.
8. **Code-split** all routes with `React.lazy`; content banks load per-track.

---

# Part 6 — Page-by-page redesign

For each surface: **What's wrong → Why it feels artificial → Redesign.**

---

## 6.1 First-run / Onboarding (new)

**What's wrong:** There is none. No tour, no checklist, no sample content. The closest thing is the home hero's "Start here" plan card.

**Why it matters:** First session is where retention is decided; today the user lands on marketing copy with six card choices and no direction.

**Redesign — a 3-step first-run flow after sign-up:**
1. **Intent:** "What are you working toward?" — Interview prep / Learning a track / Practicing contests (segmented choices, not cards). Sets the home dashboard's default tab.
2. **Quick win:** "Solve one problem in 5 minutes" — drop directly into a curated easy problem in the workspace with Guru hint pre-suggested. One-click paths for "I use Java/C++/Python".
3. **Setup (optional):** link LeetCode/CodeChef handles (reuse existing modals), theme preference, remind-me schedule.
Then land on Home with a **"Get started" checklist** (dismissable, persists): Solve your first problem · Complete a lesson · Try a contest · Link your profile · Install nothing (playground). Progress bar in the checklist, celebration on completion (reuse Practice confetti, restrained).

Returning users: Home shows "Continue where you left off" (last problem/lesson + position), not the marketing hero.

## 6.2 Auth (`Auth.tsx`, `ResetPassword.tsx`)

**What's wrong:** Split card with "Why AlgoGuru" sales panel (hidden on mobile), `Field` labels not bound to inputs, unlabeled password-eye buttons, "Sign in to continue your coding journey" copy, a third theme toggle variant, `autoComplete="new-password"` on every field, and a 3-second error cooldown ("Try again shortly…"). ResetPassword is visually plainer than every other screen, has no label/aria, no theme toggle.

**Why it feels artificial:** It's the standard generated "split-panel auth with value props" template; the mismatch between Auth and ResetPassword shows neither was designed as a flow.

**Redesign:** Single centered column (max 380px) on `--bg-subtle`, brand mark above, no sales panel (it's a login). Labels above inputs, correct `autocomplete` tokens (`email`, `current-password`, `new-password`), labeled visibility toggle, inline field errors + one banner max, submit with real loading state (no cooldown copy — instead disable and show progress). Google button as a full-width secondary ("Continue with Google") rather than a lone 48px icon. One shared `AuthLayout` for sign-in, sign-up, reset so they're visually identical. Optional right-side ambient: a very quiet product screenshot or nothing.

## 6.3 Home / Dashboard (`Index.tsx`)

**What's wrong:** Marketing landing for logged-in users: gradient-text H1 ("teams fight to hire"), radial glow + masked dot grid, hero stat row ("500+ Curated problems / 100% Free forever"), 6 identical `min-h-[290px] rounded-3xl` learning-path cards with top gradient bars, "How it works" ghost-numeral cards, a final CTA that loops back to scrolling (`#modules`), and the QuizSection marketing band. The loudest buttons scroll rather than navigate. Six cards are clickable `motion.div`s with no keyboard access. The "Start here" plan card duplicates roadmap content.

**Why it feels artificial:** Every generated SaaS template has exactly this: hero → logos/stats → feature cards → "How it works" → CTA. It's the template's page, not AlgoGuru's. It also ignores that the viewer is already a user.

**Redesign — Home becomes a personal dashboard:**
1. **Top band (compact):** "Good morning, Aritra" + today's date + streak chip (dot + "12-day streak"). One primary CTA: **Continue** (last problem/lesson, with position "Problem 3 of 8 — Two Sum"), secondary: "Daily challenge" (with countdown to reset).
2. **Today row:** Daily challenge card (one card, with difficulty + acceptance) · Next lesson (track progress "Recursion — 4 of 9") · Upcoming contest (or "No contest scheduled — start a practice contest").
3. **Progress strip:** solved-this-week mini bar chart (7 bars), total solved / acceptance, review-due count (spaced-repetition hook). Reuse one `StatTile`.
4. **Activity:** the heatmap (already good) at 8px cells with streak annotations.
5. **Explore row:** a *list* of tracks (Learn / Practice / Interview / Contests) as compact rows with progress — not six big cards.
6. Marketing content (stats like "500+ problems", "How it works", "teams fight to hire") moves to a **logged-out landing page** at `/` when there's no session — with gradient text deleted and real product screenshots instead.

## 6.4 Learn / Courses (tracks & lessons; replaces `TopicPage` + hub sprawl)

**What's wrong:** Topic pages are decent documents but wrapped in hero bands with unicode glyph icons, duplicated theme/font controls, per-topic hardcoded color maps, section progress dots that expand 8→32px, a TOC FAB that can overlap content, and Prev/Next cards. Content rendering is a bespoke mini-markdown with a fragile `classifyTheoryLines()` heuristic that string-matches `approach:`/`Input:` lines. Track "hubs" don't exist as a first-class concept — Index cards deep-link into raw topic routes.

**Why it feels artificial:** Hand-rolled markdown with heuristic line classification is a classic generated shortcut; the glyph icons and colored-dot chrome are decoration around genuinely good content.

**Redesign:**
- **`/learn/:track` track page:** syllabus as a numbered list of units → lessons with status (done/reading/not started), estimated time, and one "Continue" row at top. Sticky left rail with unit navigation. No hero band.
- **Lesson page (`/learn/:track/:topic`):** Notion-style document: breadcrumb, H1, meta line (track · 12 min read · updated), 68ch prose column, right-hand "On this page" TOC (sticky, `xl+`), left rail with lesson list. One `ReadingToolbar` (font size, theme, "mark complete", copy link).
- **Content pipeline unified:** replace the regex mini-parser + `classifyTheoryLines` heuristics with structured fields already present in the data model (`theory`, `keyPoints`, `code`, `diagram`, `table`, `note/tip/warning`) rendered by typed blocks in `ContentRenderer`. Keep the callout shapes but restyle as left-rule blocks. Diagrams get dark-mode-correct palettes.
- Completion: "Mark as complete" button in toolbar + auto-detect on scroll; completion animation (single, restrained) and track progress updates.

## 6.5 Practice / Problem set (`Practice.tsx`)

**What's wrong:** No search, no difficulty filter, no tag filter, no sort — over 100 problems dumped into accordion cards. Each row has ~3 stacked bars: checkbox + strikethrough title + 4 company chips + 3 CTAs (LC/GFG/Solution) + note/save row. 17 hardcoded per-topic accent maps. A confetti layer positions itself via `document.getElementById`. `/practice?tag=` deep-links are broken (route ignores search params).

**Why it feels artificial:** Accordion-of-cards with chip overload is generated density without hierarchy; a problem set without filters is a feature gap no real practice product would ship.

**Redesign — the LeetCode Premium / GitHub issues model:**
- **Toolbar:** search (title/tag/company), segmented difficulty filter, tag multi-select, status filter (All/Todo/Solved/Review), sort (Acceptance/Difficulty/Order), view toggle (List / Grouped by topic).
- **List view (default):** a real table/row list: `status dot · # · Title (link) · Difficulty · Acceptance · Tags · Company (on hover/popover) · [actions menu]`. 40px rows, sticky header, keyboard navigation with `j/k` and `/` to search. Row hover reveals Save/Note/External actions.
- **Grouped view:** topic sections with counts and per-topic progress bars, collapsible — not per-problem cards.
- Deep links work: `?tag=`, `?difficulty=`, `?q=` (and PracticeSolution's `?tag=` links finally function).
- Completion: subtle inline check animation + optional confetti (keep, but anchor to the row element properly and respect reduced-motion).

## 6.6 Problem workspace (`ProblemSolver.tsx`) — daily challenge

**What's wrong:** Actually the second-best surface in the app (good split panes, ARIA tabs, rich results). Issues: no **Submit** (verdicts are local string-compare with opaque "Executed" state), `dangerouslySetInnerHTML` for statements, two code-block systems with different near-blacks (`#1a1a1a` vs `#0E1016`), `debugMode={true}` shipped to GuruBot in production, a 2.5k-line file, "Hints (n)" as raw collapsible HTML, font-size `<select>` 12–20px in the footer, and verdict styling using ad-hoc colors.

**Why it feels artificial:** Local output-comparison dressed as a judge ("Tests passed" without a real judge) is a trust problem; the mixed code surfaces show the page was assembled from parts.

**Redesign:**
- **Verdict language made honest and LeetCode-like:** `Accepted / Wrong Answer / Compile Error / Runtime Error / Time Limit` with a verdict panel: runtime, memory, tests passed `x/y`, and a clear "Local run — not judged against hidden tests" note (or wire the contest execution service for real judging; the infra exists in `lib/contest/executionService.ts`).
- One `CodeBlock` and one Monaco theme (shared constants module `lib/editor/themes.ts`).
- Statement rendering through the unified `Prose` pipeline; sanitize HTML (DOMPurify) instead of raw injection.
- Console: same tab vocabulary as Playground (`Testcase | Result`) — unify the two console patterns.
- Keep the split-pane engineering; add `Submit` as the primary CTA and demote `Run` to secondary, with results sliding into the console.
- Extract modules (`solver/editor`, `solver/console`, `solver/editorial`, `solver/runner`) — file hygiene that directly affects future UI velocity.

## 6.7 Playground (`Playground.tsx`)

**What's wrong:** The most feature-rich surface (4,907 lines): templates, settings dropdown with 11 toggles, 4-tab console, zen mode, outline drawer, Guru panel with selection menu and diff preview. But: settings live in a dropdown instead of the (missing) Settings page; the "Sync with App" theme mode is one of three theme paths; practice-mode theory strips `**` instead of rendering; three panel systems with tuned magic numbers (`IO_EXPACT_TRIGGER_SIZE 4.25`); a 4-tab console vs ProblemSolver's 2.

**Why it feels artificial:** Feature accumulation without a settings hierarchy — everything is exposed at once, which reads as generated "add more features" accretion.

**Redesign:**
- Top bar: language select · file/snippet tabs · Run/Format · right: settings gear (opens the editor section of `/settings` + quick popover), Guru toggle, zen. Remove the inline templates manager to a menu.
- Console: `Testcase | Result | Problems | Debug` kept (it's differentiated) but restyled with the shared console component and shared tab vocabulary.
- Practice-mode statement uses the unified `Prose` renderer (no stripping).
- One panel system with documented default sizes; presets (Focus / Split / Full) replace magic auto-collapse thresholds.

## 6.8 Contests (`ContestLanding`, `CodingContestInstructions`, `CodingContestSession`, `CodingContestResult`)

**What's wrong:** The strongest module — `--surface-*` tokens, ARIA everywhere, honest dev-mode banner, draft recovery. Remaining issues: blurred primary blobs on landing; 11 rule cards in a grid (dense wall); "Contest set 1 / 4" dropdown label that really means "Question 1 of 4"; icon-only view switcher discoverability; `amber-500/rose-500/emerald-500` raw colors breaking the palette; points shown as `text-amber-500` mono with `title` tooltips; the **results "processing" state is a dead end** (skeleton + `sr-only` "This page will not update automatically"); instructions spec pills and rounded-3xl mode cards.

**Why it feels artificial:** Mostly it doesn't — this is the reference quality. The tells are the decorative blobs, raw palette utilities, and the unloved processing state.

**Redesign:**
- Landing: two mode entries as **rows with a spec table** (Duration, Problems, Environment, Monitoring) instead of blob-decorated cards; drop "How both modes work" trio into a collapsible "How it works".
- Instructions: rules as a numbered checklist in 2 columns max, or a single scannable list with severity icons; spec strip stays (it's good).
- Session: rename "Contest set N / 4" → "Question 2 of 4" with prev/next arrows; view switcher becomes a labeled segmented control (Problem | Split | Editor); swap raw color utilities for `--success/--warning/--danger` tokens; keep everything else.
- Results: real polling ("Evaluating…" with auto-refresh every 5s + manual Refresh + "we'll email you" fallback), then verdict rows with per-test breakdown (expandable), submitted code in a `CodeBlock` (not raw `<pre>`), and shareable report.
- Establish this module's patterns as **the house style reference** for the rest of the app.

## 6.9 AI Guru (`GuruBot.tsx` + panel + integrations)

**What's wrong:** Entire chat is hardcoded `neutral-800/700` + `indigo-500/600` and hex code blocks — it ignores light mode and the app palette entirely. "Regenerate" refills the input with the first user message instead of re-requesting. Suggestion chips fill the input but don't send. A vestigial model selector ("OpenRouter Free" with pulsing dot) eats input real estate. Feedback 👍/👎 is local state with no consequence. Collapsed panel is a 3.5% sliver. Streaming uses rotating "thinking phrases" ("Mapping out an answer") with bouncing dots. `debugMode` leaks in production.

**Why it feels artificial:** The off-theme dark chat is the classic "bolted-on AI widget" — it looks like a different product embedded in AlgoGuru. Bouncing-dots + rotating phrases and a fake feedback system are generated-chatbot clichés.

**Redesign:**
- **Re-skin on the token system:** `--surface` bubbles, `--ink` text, one CodeBlock, `--accent` for user messages' affordances. Light mode fully supported. Message layout: compact rows (avatar 24px, name + time meta, body) rather than heavy bubbles — the Linear/Cursor assistant style.
- **Behavior fixes:** Regenerate re-requests (streaming a new answer under the old); chips send immediately; model selector removed from the input row (single model — show it once in the header as quiet meta); 👍/👎 posts to `guru_feedback` table and surfaces "Thanks — noted" with an optional one-line reason.
- **Context transparency (trust):** a "Context" chip showing what's attached (problem, your code, last run result) with the ability to uncheck items before sending — Guru's killer feature made visible.
- **Placement:** keep the resizable rail (good), fix collapsed state to a labeled icon tab; embedded tabs in ProblemSolver/Playground keep `onInsertCode` + diff preview (good — keep and standardize as the only code-apply path).
- Remove rotating think phrases → a single quiet "Thinking…" with the elapsed seconds.

## 6.10 Mock interviews (new product)

**What's wrong:** Nothing exists — no files, no routes, no nav. It's a stated product area with zero surface.

**Redesign — build on existing machinery** (`useFullscreenExam`, `useExamIntegrity`, `useContestTimer`, GuruBot Socratic `debugMode`, the question banks):
- **`/interview/mock`:** choose format (DSA coding 45min · System design 45min · Core Java Q&A 30min), difficulty, and language → a guided session.
- **Session:** timed workspace (reuse contest chrome, minus punitive lockdown — soft focus warnings only), question sequence with a running evaluation rubric, and an optional "interviewer" (Guru in Socratic mode asking one question at a time, no code dumps — the `debugMode` prompt already implements this).
- **Debrief report:** score per rubric dimension (problem solving, code quality, communication via notes, complexity analysis), questions attempted, time distribution, "what to study next" links into Learn/Practice. This report is the retention artifact — shareable, comparable over time.
- **History:** list of past mocks with score trend sparkline on `/profile`.
- Ship the 404-free placeholder honestly: if only one format ships first, the others are listed as "Planned" with no link.

## 6.11 Interview prep (`Interview.tsx` + hubs + Q&A pages)

**What's wrong:** Three incompatible hubs (Java = docs site; C++/Python = bootcamp landing with `2xl:grid-cols-6` question grids and "Crack the interview." copy; Backend = "Interview Masterclass" sales page), three near-identical 1,000-line question-bank pages, two badge systems (`CoreJavaBadges`/`CppBadges`), two answer renderers plus a third `renderTheoryContent`, emoji topic icons and `🔥` priority pills, filter pills with hidden scrollbars and a "🔥 Most Asked" filter, `cjh/cjq/cjd` CSS (3,487 lines) running its own theme, "Content Verified / Expert Reviewed" badges on empty Coming Soon pages with alternating-word colored H1s, contradictory persistence copy ("saved to your account" vs "Saved in this browser"), and 2 of 5 advertised tracks being stubs.

**Why it feels artificial:** Everything about it: per-language copy-paste variants, priority-as-fire-emoji, sales-page heroes inside a logged-in tool, fake trust badges on empty pages.

**Redesign:**
- **One hub design** for all tracks (Java, C++, Python, Backend, System Design): compact header (track icon, name, "128 questions · ~6h"), progress bar, "Continue" row, then **sections as lists** (Must-know first — labeled "Most asked" as a sorted filter, not a `🔥` pill), study-plan timeline kept (it's good), resources row. Delete the marketing heroes.
- **One Q&A list page + one detail page** parameterized by track (replaces three 1,000-line clones): sticky reader bar (already good), filter chips (`All / Unread / Bookmarked / Easy / Medium / Hard` — "Most asked" becomes a sort), topic rail with progress, question rows = `num · title · difficulty dot · priority label · time · status`. Detail: 3-column document (index / prose / TOC) — keep the layout, rebuild on shared `Prose` + `Kbd` + `CopyButton` components and delete `cjd/cjq` CSS in favor of the unified prose system.
- Priority: text labels ("High priority" with a small dot), never `🔥`.
- Persistence consistency: everything syncs to Supabase with one phrasing — "Saved to your account" — and local-first fallback labeled "Saved locally — will sync".
- Coming-soon tracks: listed without links, or removed from nav. `InterviewComingSoonLayout` deleted.

## 6.12 Profile (`Profile.tsx`)

**What's wrong:** 1,166 lines mixing identity, platform stats, and settings; two empty placeholder cards ("Edit profile to add skills" — a feature that doesn't exist), a **dead Share button**, two hand-rolled modals without dialog semantics, hover-only donut legend, LeetCode-colored hardcoded hex (`#00b8a3/#ffc01e/#ef4743`), and the donut/heatmap/empty states each styled differently.

**Why it feels artificial:** Placeholder panels for features that don't exist and a dead button are the tells; so is a profile page that's really three pages crammed together.

**Redesign:**
- **Split into `/profile` and `/settings`.**
- **Profile (public-ish):** avatar + name + role, "Share" (working — copies profile URL), stats strip (solved, acceptance, streak, contests), **solved-by-difficulty bar** (replace the SVG donut with a compact segmented bar — easier to compare, theme-safe), the heatmap (keep), platform cards (LeetCode/CodeChef with real data or a "Link account" state — no empty laptop icons), mock-interview history, and recent activity list.
- Placeholders removed: Subject progress and Skills either ship or vanish.

## 6.13 Settings (new `/settings`)

**What's wrong:** There is no settings page. Theme toggles exist in 3 places with 2 different font-size displays (`85/100/115/125%` vs `SM/MD/LG/XL`); `contentWidth` has no UI; editor settings live in a Playground dropdown with 11 toggles; storage keys are another product's (`cp-*`).

**Redesign — one page, four sections (left rail nav):**
1. **Appearance:** theme (System/Light/Dark — wire `next-themes`), interface density (Compact/Default — replaces the header zoom hack), syntax theme, accent-neutral color-blind-safe toggle.
2. **Editor:** font family/size, tab size, word wrap, minimap, relative line numbers, bracket colorization, format-on-type (all lifted from the Playground dropdown; shared via `editorPrefs`).
3. **Learning:** daily goal, reminder time, difficulty preference, "Socratic hints first" toggle for Guru.
4. **Account:** profile link, connected accounts (LeetCode/CodeChef), password, data export, delete account.
Also: rename all storage keys to `algoguru:*` with a migration map.

## 6.14 Notes (`NotesDashboard.tsx`, `DraggableNoteEditor.tsx`)

**What's wrong:** Hero band ("My **notes**") for a utility page; 5 wrapping action buttons; `text-[10px] font-bold uppercase tracking-widest` everywhere; note cards `rounded-[32px] p-8 md:p-10` in a **single column** wasting desktop width; uppercased note titles (hurts scanability); modal without dialog semantics; `dangerouslySetInnerHTML` rendering; `DraggableNoteEditor` fixed at 480px (overflows 375px phones).

**Why it feels artificial:** Oversized pill buttons with 10px labels, giant rounded cards, and a hero for a CRUD page are generated aesthetics; the uppercase titles actively harm the product.

**Redesign:**
- No hero. `PageHeader` ("Notes", count, search, "New note").
- **List-first** (title, source chip, updated date, excerpt) with a card-grid toggle; two-column masonry on `lg+` for the grid view.
- Toolbar: search + type filter + sort + bulk-select (bulk actions in one menu, not 5 buttons).
- Editor: shared `NoteEditor` — the draggable window becomes a **docked side panel or full modal** with proper dialog semantics, and is `w-full max-w-lg` responsive.
- Markdown via the unified renderer with sanitization.

## 6.15 Roadmaps (`RoadmapEngine`, Coggle graph)

**What's wrong:** Genuinely distinctive (custom bidirectional layout, animated node glides, status model) but lives in a locked always-dark palette (`--coggle-paper: #131513` with amber primary) that ignores app theming; glassy header (`bg-card/90 backdrop-blur-xl`); instruction line ("Click any node to expand…") instead of discoverable affordances; orphaned `RoadmapHub`/`RoadmapPage` duplicate the entry experience.

**Why it feels artificial:** A dark-only island inside a themable product, plus dead sibling pages.

**Redesign:**
- Theme-aware canvas (light mode: paper `--bg-subtle`, nodes in track hue tints) or an explicit "canvas theme" toggle documented as intentional.
- Keep the graph, polish the chrome: header uses the standard toolbar; controls bottom-left stay (good); replace the instruction line with a dismissible one-time hint overlay.
- Detail panel keeps its structure; restyle on `--surface` tokens; prerequisites become inline links.
- Delete `RoadmapHub.tsx`/`RoadmapPage.tsx`; entry via `/roadmap` index listing the 3 graphs as rows with progress ("Java — 24 of 58 completed").

## 6.16 Quiz (`Quiz.tsx`) & MCQ contest

**What's wrong:** 29 `rounded-2xl/3xl` hits, dual radial gradients in the hero, an amber-to-red gradient "Strict Exam Rules" card with a "⚠ FINAL WARNING" stepper, raw `text-red-500/amber-500` utilities, native `<select>`s with `rounded-xl`, and a results screen with a trophy tile and "A perfect finish!". The exam mechanics (fullscreen, 3-warning escalation, timer, answer review) are solid.

**Why it feels artificial:** The gradient-filled drama styling around an otherwise serious exam reads like a game show; raw color utilities betray the token system.

**Redesign:**
- Setup as a **config form with a summary rail** (keep the structure) but neutral styling: rules as a compact numbered list with severity icons, warning policy as a simple "3 warnings → auto-submit" line.
- Running: keep layout; question numbers/grid/flags are good. Timer gets the contest clock treatment (`role="timer"` + `sr-only` urgency — Quiz has `role="timer"` already; align visuals with `ContestClock`).
- Results: score as a big number + segmented bar (not trophy tile), review list as rows with expandable explanations, "Study these topics" links into Learn. Celebration tone is allowed here (one expressive moment) but restrained.
- Replace native selects with the shared `Select`; all colors via tokens.

## 6.17 Admin (`Admin.tsx`)

**What's wrong:** Marketing hero ("Platform **control**") on an admin panel; "analytics" is 3 stat tiles with inline hex tints and zero charts; native `confirm()` dialogs; unlabeled role `<select>`; `AppTooltip` on every row button.

**Redesign:** Dense data table (sticky header, sortable columns, search, role/status filters, pagination), row actions in a `…` menu with `ConfirmDialog`, user detail drawer (activity, contests, notes counts), analytics as real charts — signups over time (line), actives (bar), role distribution (bar) — using one chart theme derived from tokens (the unused `ui/chart.tsx` becomes real). No hero; `PageHeader` ("Admin", environment chip) only.

## 6.18 Support (`BuyMeACoffee.tsx`, `SupportModal.tsx`)

**What's wrong:** ~80% duplicated payment UI across two surfaces; placeholder `buymeacoffee.com/YourName` and `your-upi@id` leaks; unverifiable "12k+ learners" chip; emoji flag tabs; "Live" chip; self-reported "I have paid via UPI" → 🎉 "Huge thanks!".

**Redesign:** One `/support` page + a compact modal entry point. Honest copy ("AlgoGuru is free and independently built"), real numbers only (or none), provider rows as a list with logos, QR on a neutral surface with copy button, confirmation = "Thank you" receipt state (no 🎉, no fake verification). Delete the alias route and the duplicated component.

## 6.19 Mobile experience (cross-cutting)

**What's wrong:** Sidebar is a resizable panel on phones (no drawer); mobile search triggers a `querySelector().click()` on a hidden desktop button; `DraggableNoteEditor` is 480px fixed; contest header doesn't wrap; hub pages use `2xl:grid-cols-6`; heatmap tooltips are hover-only; Guru becomes a full-screen overlay that hides content; `App.css` globally clamps animations to 0.7s on mobile (a hack compensating for over-animated UI).

**Redesign:** Mobile IA = bottom tab bar (Home, Learn, Practice, Guru, Menu) + slide-over drawer for the full nav. All split panes collapse to tabs. All fixed-width components become responsive. Touch targets ≥ 44px. Guru on mobile = a bottom sheet with a drag handle (peek/half/full), keeping context visible. Contest workspace on mobile becomes read-only review ("Contests are best on a larger screen — review your submissions here") rather than a crushed exam chrome — honest and better than the current squeeze.

## 6.20 States (cross-cutting: loading / empty / error / offline)

**What's wrong:** Spinners and skeletons are ad hoc per page (ProblemSolver's `ProblemSkeleton` is good; others use bare `Loader2`), empty states range from good ("No questions found") to bare ("Topic not found") to misleading (Profile's laptop placeholders), errors are toasts or template copy, and there's no offline/session-expired story.

**Redesign — a state kit, applied everywhere:**
- **Loading:** skeletons matching the target layout's shape (list rows, document, table), never bare spinners outside buttons; keep `BrandLoader` for full-screen.
- **Empty:** `EmptyState` = icon + title + one explanatory line + one primary action ("No notes yet — capture insights from any problem" → New note / Go to practice).
- **Error:** `ErrorState` = what happened (plain language), likely cause, Retry, and fallback link (ProblemSolver's pattern is the model). Toasts only for action results, never as the sole error channel.
- **Session:** expired-auth modal with re-login that preserves the current workspace; offline banner ("Offline — drafts saved locally") in workspace surfaces where `resolveDraft` already protects work.

---

# Part 7 — Microinteractions & motion catalog

Purposeful, minimal, consistent — the "handcrafted" layer.

| Moment | Behavior | Notes |
|---|---|---|
| Button hover/press | bg darken 120ms; press `scale(.98)` 80ms | no lift, no glow |
| Row hover | bg → `--bg-subtle`, trailing actions fade in 120ms | lists/tables |
| Checkbox complete | check path draws 200ms + row title settles | Practice/Q&A "learned" |
| Problem solved | inline check + 1s subtle row highlight + optional confetti (respect reduced-motion) | anchor to row element |
| Streak milestone | streak chip pulses once + toast "12 days — your longest yet" | never interruptive |
| Tab switch | indicator slides (`motion-spring`), content cross-fades 120ms | one `layoutId` pattern everywhere |
| Panel resize | 1:1 drag, hairline → pill on hover (already good in contest) | standardize `SPLIT_HANDLE` |
| Drawer/modal | scrim 200ms fade; panel 320ms `motion-slow` from right/bottom | with focus trap |
| Command palette | scale .98→1 + fade 160ms spring; tab pill slides | the one "wow" surface |
| Guru streaming | text streams; "Thinking… Ns" quiet indicator | no bouncing dots |
| Timer urgency | color + `sr-only` text; single soft pulse under 60s | contest clock model |
| Copy success | icon → check 150ms, label "Copied" 1.6s | all copy buttons |
| Save status | icon + word (Saved/Saving/Unsaved) in workspace footers | already in contest; extend to notes |
| Route change | content fade 120ms; skeletons only when >200ms delay | avoid flash |

All disabled/reduced under `prefers-reduced-motion`; no infinite decorative loops anywhere.

---

# Part 8 — Content, voice & trust

**Voice:** precise, calm, encouraging without hype — a senior engineer helping you. "Wrong answer on case 3 — your output is missing the trailing element." not "Almost there, champ!". "48 of 312 solved." not "Master code. Ace interviews."

Rules:
1. **No marketing inside the product.** Claims ("500+ problems", "100% free", "teams fight to hire") live only on the logged-out landing page and must be verifiable.
2. **Sentence case** for all UI labels (buttons, tabs, headings). No Title Case ("Submit Quiz" → "Submit quiz").
3. **Literal labels over clever ones:** "Question 2 of 4" not "Contest set 2 / 4"; "High priority" not "🔥 Very High".
4. **Never fake trust:** delete "Content Verified / Expert Reviewed" on empty pages, "Live" chips, unverifiable user counts. Show real signals instead (last content update date, real authorship, honest "Preview" labels).
5. **One persistence vocabulary:** "Saved to your account" / "Saved locally" / "Saving…" — everywhere, matching the actual backend (fix the Core Java vs Backend contradiction).
6. **Microcopy carries weight:** empty states explain and offer one action; errors say what failed and what to do; destructive confirms name the exact consequence and count ("Delete 3 notes? This can't be undone.").
7. Emoji are allowed only inside educational content prose where they carry meaning, never in chrome, labels, or badges.

---

# Part 9 — Implementation roadmap

Sequenced so each phase ships visible value and reduces risk. (Estimates intentionally omitted — priorities are what matter.)

### Phase 0 — Hygiene (unblocks everything)
- Delete dead code: `QuizPlayer.tsx`, `RoadmapHub.tsx`, `RoadmapPage.tsx`, `JavaTreeBanner.tsx`, `BrandSplash.tsx` (or wire `BrandLoader` as Suspense fallback and delete the rest), `ui/chart.tsx` (or adopt it in Phase 3 Admin), `contentWidth` dead API (or wire it in Settings).
- Fix live bugs: `next-themes`/sonner theme mismatch; `--success/--warning/--info` dark values; `theme-color`/OG tags in `index.html` (remove TODOs); placeholder env leaks (`BUYMEACOFFEE_URL`, `UPI_ID`) → fail closed with "Support link coming soon" instead of fake URLs; `debugMode={true}` in production GuruBot; `NotFound` raw `<a>`/`console.error`; storage key rename map `cp-*` → `algoguru:*`.
- Enforce lint rules: no `text-[NNpx]`, no raw `shadow-md|lg|xl|2xl`, no hex literals in components (allowlist: Monaco theme file, diagram palette file), `jsx-a11y` rules on.

### Phase 1 — Design system foundation
- New token set in `tailwind.config.ts` + `index.css` (4.1–4.8), one type scale, radius/elevation/motion tokens, single sticky-header + scrim recipes.
- Shared primitives (4.11); migrate `PagePrimitives` to the system.
- Icon pass: lucide-only map for topics; strip unicode/emoji icons.
- Fonts: Inter + JetBrains Mono (+ Space Grotesk display); delete the other 5 families and per-surface font stacks.

### Phase 2 — Shell & IA
- New sidebar taxonomy + mobile drawer + bottom tab bar; single search (⌘K) with lazy index; header simplification; `HomeSidebarContext` removal; route restructure (3.2) with `React.lazy` everywhere; single 404; `BrandLoader` Suspense fallback.

### Phase 3 — Core learning surfaces
- Practice list rebuild (filters, table/list) + deep links.
- Problem workspace: verdict language, unified code surfaces, Submit flow honesty, module split.
- Playground console/settings unification.
- Learn pages: track page + lesson document on unified `Prose`; `ContentRenderer` heuristic removal; diagram dark palettes.

### Phase 4 — Product areas
- Home dashboard + first-run onboarding + get-started checklist.
- Interview unification (one hub, one list, one detail; delete `cjh/cjq/cjd` CSS and clone pages).
- Contest polish pass (6.8) — mostly token swaps and label fixes; results polling.
- Guru re-skin + behavior fixes (6.9).
- Profile/Settings split; Notes rebuild; Admin table+charts; Support consolidation.

### Phase 5 — New product
- Mock interviews (6.10) on the contest/Guru stack; debrief reports; profile history.

### Phase 6 — Accessibility & QA hardening
- axe + keyboard passes per route; contrast audit (both themes); reduced-motion audit; responsive QA at 360/390/768/1024/1440/1920; performance pass (route chunks, remove the eager content-bank imports); visual regression snapshots for the shared primitives.

**Dependency note:** Phases 1–2 must land before page rewrites, or pages will re-diverge. Page work in Phases 3–4 should migrate *onto* the new primitives rather than restyling in place.

---

# Part 10 — Success metrics & release checklist

### Metrics
- **Activation:** % of new users who complete the first-run flow and solve 1 problem in session 1 (target: measured baseline → +30%).
- **Retention:** D1/D7/D30 return rates; streak maintenance rate (users with ≥3 active days/week).
- **Engagement:** problems solved per active user/week; lessons completed; Guru accepted-insert rate (code inserted from AI suggestions); mock interviews per active user.
- **Trust:** support conversion; account-linking rate (LeetCode/CodeChef); error-state recovery rate (Retry success after `ErrorState`).
- **Quality:** zero axe criticals; Lighthouse a11y ≥ 95 on all routes; route bundle < 200KB initial; P75 interaction latency < 100ms in workspace surfaces.
- **Consistency audits:** 0 raw hex in components, 0 `text-[NNpx]`, 0 default Tailwind shadows, 1 difficulty system, 1 prose system, 1 markdown engine (CI grep gates).

### Release checklist (every UI PR)
- [ ] Uses only design tokens and shared primitives (no new literals)
- [ ] Light + dark checked; contrast AA verified
- [ ] Keyboard: tab order, focus visible, Esc closes overlays
- [ ] Screen-reader labels on all icon buttons; headings hierarchical
- [ ] Loading / empty / error states designed and implemented
- [ ] Responsive at 390 / 768 / 1024 / 1440
- [ ] `prefers-reduced-motion` respected
- [ ] Copy follows the voice guide (sentence case, literal labels, honest claims)
- [ ] No new dead code; unused variants/components removed

---

## Appendix A — Quick-reference: "AI-generated" pattern → replacement

| Kill | Replace with |
|---|---|
| Gradient text headings | Solid `--ink` headings; `--accent` for one key phrase max |
| Hero + radial glow + dot grid (interior pages) | Compact `PageHeader` (eyebrow/title/subtitle/actions) |
| 6-card `min-h-[280px] rounded-3xl` grids | Lists, tables, docs; cards only for true peers (≤6) |
| `whileHover={{ y: -6 }}` + top gradient bar | Border/ink change + `elev-1` |
| `blur-[160px]`/`blur-3xl` blobs | Nothing; or a single 8% track-hue wash |
| Emoji / unicode glyph icons | lucide + status dots |
| `text-[10px] uppercase tracking-widest` labels | `meta` (12px) sentence case; uppercase only for eyebrows/table headers |
| Stat tiles ×6 variants | One `StatTile` |
| "How it works" ghost numerals | Delete (move to docs/landing) |
| Bouncing dots + rotating think phrases | Quiet "Thinking… Ns" |
| Fake badges ("Content Verified", "Live", "12k+ learners") | Real signals (dates, counts, honest labels) |
| Native `confirm()` | `ConfirmDialog` |
| Glassmorphism everywhere | Borders + elevation ladder; blur only on sticky chrome |
| Per-page bespoke CSS systems | Design tokens + shared primitives |

## Appendix B — File-level hotspots (for Phase 0–2)

| Area | Files |
|---|---|
| Token rebuild | `tailwind.config.ts`, `src/index.css` (2,394 lines → ~600), delete `styles/core-java-interview.css` gradually |
| Shell | `src/App.tsx` (route conditionals → one layout), `AppSidebar.tsx`, `GlobalSearch.tsx`, `Footer.tsx`, `UserMenu.tsx` |
| Duplication to merge | `InterviewCoreJavaQuestionsPage` / `InterviewCppQuestionsPage` / `InterviewPythonQuestionsPage` (~1,000 lines each); `CoreJavaBadges`/`CppBadges`; `CoreJavaQuestionAnswer`/`BackendAnswer`/`renderTheoryContent`; `SupportModal`/`BuyMeACoffee`; `LEETCODE_DARK_THEME` ×3 → `lib/editor/themes.ts` |
| Settings | `SettingsContext.tsx` (keys `cp-*` → `algoguru:*`; adopt `next-themes`; font-size scope fix) |
| Dead code | `QuizPlayer.tsx`, `RoadmapHub.tsx`, `RoadmapPage.tsx`, `JavaTreeBanner.tsx`, `BrandSplash.tsx`, `ui/chart.tsx`, `PagePrimitives` unused exports |
| a11y hotspots | `Index.tsx` (card divs), `Profile.tsx` + `NotesDashboard.tsx` (modals), `Auth.tsx` (`Field` labels), `ActivityHeatmap.tsx` (focusable cells), `App.tsx:478` (synthetic click) |
