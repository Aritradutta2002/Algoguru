# AlgoGuru - Application-Wide UI Unification Plan

> **Status:** in progress - Phases 1-4 done (tokens, primitives, marketing/hub routes, interview
> readers); Phase 8 partly done (footer policy, dead palettes, monaco palette, font cleanup).
> See "Execution log" below.
> **Reference surface:** `src/pages/Index.tsx` + `src/styles/landing.css`.
> **Scope:** every route in `src/App.tsx`, the app shell, and shared components.
> **Repo:** `C:\Users\aritr\Desktop\AlgoGuru\Algoguru`
> **Audited:** 2026-10-19

---

## 0. TL;DR

The app currently ships **three parallel styling systems** and one shared primitive file that is
imported by **exactly one route**. The landing page looks different because it is different: it
has its own 1,609-line scoped stylesheet built on design tokens, while product pages use raw
Tailwind utilities, ad-hoc hex values, and page-specific max-widths.

The fix is **not** to copy `landing.css` into every page. It is to:

1. **Promote the landing page's token layer into the app's token layer** (one source of truth).
2. **Grow `PagePrimitives.tsx` into the only page-shell/heading/card/button vocabulary**
   and make the landing page consume it too, so drift cannot return.
3. **Migrate routes in tiers** - marketing/hub pages first, interview readers second,
   editor/canvas workspaces last (chrome only, density preserved).
4. **Guard the result** with a repeatable audit script + route QA matrix.

Estimated shape of the work: **9 phases (0-8)**, one reviewable PR per phase (Phase 5 may split by
language). No new dependencies required.

---

## 1. Goal and success criteria

### Goal

A learner moving from `/` to `/practice`, `/interview`, `/profile`, `/notes`, a question reader,
or the problem solver should feel they never left the same product: same type scale, same
gutters, same surface/border treatment, same button and chip grammar, same light/dark behaviour.

### Measurable success criteria

| # | Criterion | How it is measured |
|---|-----------|--------------------|
| 1 | One token source | No `--lp-*` **colour/surface/type** value is defined independently of an app token; `landing.css` only aliases (composition-only values such as hero shadows may stay local) |
| 2 | One page vocabulary | Every non-workspace route (except the standalone `/auth` and `/reset-password` flows) renders through `PageShell` + `PageHeader`/`Section` |
| 3 | No page-local shell widths | `ui:audit` reports **0** raw `max-w-7xl` / `max-w-[...]` used as a page shell |
| 4 | No new hardcoded colour | `ui:audit` reports **0** new `#hex` / palette classes outside the documented allowlist |
| 5 | Landing is visually unchanged | Manual A/B screenshots at 360 / 768 / 1280 / 1600 px, light + dark |
| 6 | Same rhythm | Section vertical padding and gutters come from shared `--shell`/`--section-y`/`--gutter` tokens on every migrated route |
| 7 | No regressions | `npm run lint`, `npm test`, `npm run build` all pass |

---

## 2. Audit snapshot (measured, not estimated)

### 2.1 Three style systems in parallel

| Layer | File | Lines | Namespace | Consumed by |
|---|---|---|---|---|
| App tokens + legacy components | `src/index.css` | 2,496 | `:root` vars, `neo-*`, `topic-card`, `app-header`, `core-java-theory-*` | Whole app |
| Landing-only layer | `src/styles/landing.css` | 1,609 | `.lp`, 125 unique `lp-*` classes | Only `Index.tsx` (+ `QuizSection`) |
| Interview layer | `src/styles/core-java-interview.css` | 3,488 | `cjh-*`, `cjq-*`, `cjd-*` (260 unique) | Java/C++/Python/Spring Boot hubs + readers |
| Shared primitives | `src/components/layout/PagePrimitives.tsx` | 395 | `PageContainer`, `PageHeader`, `Section`, `Surface`, `StatCard`, `EmptyState`, `SegmentedControl`, `Toolbar`, `Pill`, `Field` | **Only `JavaInterviewHub.tsx`** |

The interview stylesheet is the healthiest of the three - it is token-driven and explicitly
scoped ("Uses existing AlgoGuru design tokens only - no global overrides"). It should be
**re-pointed at shared tokens**, not deleted.

### 2.2 Shell / width drift

| Route | Page shell today | Width |
|---|---|---|
| `/` (landing) | `.lp-shell` | `1240px` + `clamp(20px, 5cqi, 56px)` gutters |
| `/practice` | `mx-auto max-w-7xl px-5 md:px-10 lg:px-16` | `1280px` |
| `/:topicId` | `w-full mx-auto` + responsive padding (no width cap) | **unbounded** |
| `/interview` | `max-w-7xl px-5 md:px-10 lg:px-16` | `1280px` |
| `/practice/solution/:id` | `mx-auto max-w-7xl` x2 | `1280px` |
| `/notes` | `max-w-7xl` | `1280px` |
| `/profile` | `w-full flex-1 px-4 sm:px-6 lg:px-8 2xl:px-14` | **unbounded** |
| `/contest/quiz` | `max-w-[110rem]` | **1760px** |
| `/roadmap` (hub) | `max-w-7xl` | `1280px` |
| `/problem-solver`, `/playground`, `/roadmap/:id` | full-bleed workspace | viewport |

So the "same page" is 1240, 1280, 1760, or unbounded depending on the route.

### 2.3 Typography drift

| Place | Font actually applied |
|---|---|
| Global body (`index.css`) | `Space Grotesk` |
| Global headings `h1-h6` | **`Outfit`** |
| Landing display (`--lp-display`) | **`Space Grotesk`** |
| Landing UI text (`--lp-sans`) | **`Inter`** |
| Landing accent (`--lp-serif`) | `Instrument Serif` |
| Long-form readers | `Source Sans 3` / `Source Code Pro`, Roboto in `.core-java-theory-*` |
| `ProblemSolver.css` | forces `Inter` inside `.solver-workspace` |

A landing `<h2>` and a product `<h2>` are rendered in **different typefaces today**.

### 2.4 Hardcoded colour and one-off values by page

| File | `#hex` count | Notes |
|---|---:|---|
| `src/pages/ProblemSolver.tsx` | 57 (now moved to `src/lib/monacoTheme.ts`) | Almost all are **Monaco editor theme** keys (lines ~206-360) - legitimate, should be centralised not tokenised as UI |
| `src/pages/Playground.tsx` | 52 | Visualiser / editor palettes - same treatment |
| `src/pages/Interview.tsx` | 14 | `color: "#2563EB"`, `"#60A5FA"`, `"#9BE2C3"`, `"#F472B6"` used as inline card accents |
| `src/pages/Profile.tsx` | 9 | chart + badge colours |
| `src/pages/Practice.tsx` | 6 | plus 4 `zinc` and 5 `slate` utility classes (`TOPIC_ACCENTS`) |
| `src/pages/Auth.tsx` | 4 | |
| `src/pages/BuyMeACoffee.tsx` | 3 | |
| `tailwind.config.ts` | 7 | `category.*` and `accentLine.*` hardcoded hex palettes |

### 2.5 Other findings that shape the plan

- **Container queries vs viewport queries.** Landing uses `container-type: inline-size` and
  `cqi` units, so it reflows correctly inside the resizable Guru split pane. Every other page
  uses `md:`/`lg:` **viewport** breakpoints, so when the Guru panel is expanded the content
  column gets narrower but the page still renders its desktop layout.
- **`PageHeader` and `Section` duplicate the container markup** instead of composing
  `PageContainer`, which is exactly how width drift starts.
- **Tests pin implementation classes.** `JavaInterviewHub.test.tsx:147,149` asserts
  `cjh-btn-primary` / `cjh-btn-secondary`. Any class migration must update those assertions.
- **The footer only renders on `/`.** `App.tsx` gates `<Footer />` behind `location.pathname === "/"`.
- **Landing shadows are not product shadows.** `--lp-shadow: 0 40px 80px ...` is for the hero
  mock-up; product cards should use the restrained `--shadow-card`/`--shadow-soft` ladder.
- **Non-semantic palettes exist in `tailwind.config.ts`**: `category.*` / `accentLine.*` are
  hardcoded hex and encourage colour-by-decoration instead of colour-by-meaning.

---

## 3. The landing design contract

The landing page is not "a theme"; it is a small, explicit design language. These are the rules
that every route must inherit, extracted from `landing.css` (values are current, not invented).

### 3.1 Surfaces and colour roles

| Landing token | Current value (light / dark) | Proposed shared token | Status |
|---|---|---|---|
| `--lp-paper` | `hsl(var(--background))` | `--background` | already shared |
| `--lp-surface` | `hsl(var(--card))` | `--card` | already shared |
| `--lp-ink` | `hsl(var(--foreground))` | `--foreground` | already shared |
| `--lp-quiet` | `220 12% 40%` / `215 14% 64%` | `--quiet` (alias of `--muted-foreground`) | **new**; re-point `--muted-foreground` (46% -> 40% light, 65% -> 64% dark) |
| `--lp-rule` | `220 14% 88%` / `220 14% 17%` | `--border` | align existing |
| `--lp-rule-strong` | `220 14% 80%` / `220 14% 26%` | `--border-strong` | **new** |
| `--lp-editor` | `220 20% 97% / .9` / `222 18% 7% / .92` | `--editor-surface` -> `--code-bg` | alias; re-point existing `--code-bg` (was 210 20% 96% / 220 13% 18%) |
| `--lp-editor-rule` | `220 14% 90%` / `220 14% 18%` | `--editor-border` -> `--code-border` | alias; re-point existing `--code-border` |
| `--lp-accent` | `hsl(var(--primary))` | `--primary` | already shared |
| `--lp-accent-soft` | `primary / .09` / `primary / .14` | `--primary-soft` + `--primary-soft-alpha` | **new** |
| `--lp-warm` | `hsl(var(--accent))` | `--accent` | already shared |
| `--lp-inv`, `--lp-inv-ink`, `--lp-inv-quiet`, `--lp-inv-rule` | light `222 32% 8%`, `40 30% 97%`, `220 12% 72%`, `220 14% 22%`; dark `220 18% 9%`, `40 30% 97%`, `218 12% 66%`, `220 14% 20%` | `--inverse`, `--inverse-foreground`, `--inverse-quiet`, `--inverse-border` | **new** (CTA band) |
| `--tok-key/type/str/com` | 4 values x light/dark | `--syntax-key/type/string/comment` | **new**, shared by landing + readers |

The important finding: landing **already borrows** `background`, `card`, `foreground`, `primary`
and `accent`. What is duplicated is the **missing middle of the scale** (quiet text, rules,
editor surfaces, inverse panel). Those are exactly the tokens product pages fake with
`zinc-*`/`slate-*` and hex values. Add them once, and most drift disappears.

### 3.2 Type

| Role | Landing | App today | Decision |
|---|---|---|---|
| Display / headings | `Space Grotesk` (`--lp-display`) | `Outfit` (`h1-h6`) | **Switch global headings to Space Grotesk** (base rule + six explicit declarations). Biggest perceived alignment win |
| Body | inherits `Space Grotesk` | `Space Grotesk` | No change |
| UI labels / buttons / prose | `Inter` (`--lp-sans`) | inherited | Add `--font-ui` and use for buttons, chips, table headers, form labels |
| Mono / numerals | `JetBrains Mono` | mixed (`font-mono`, Source Code Pro) | Add `--font-mono`; use for stats, counters, diff numbers, code |
| Long-form readers | `Source Sans 3` body | `Source Sans 3` (`--reader-font`), Roboto in legacy `.core-java-theory-*` | Keep Source Sans 3 for prose, headings use `--font-display`; delete the Roboto family |

The switch is broader than the base rule: `index.css` has seven `'Outfit'` declarations besides the
Google Fonts import (the `body` fallback chain at 341, `h1-h6` at 350, and component rules at
580/655/1228/1479/1606) and five `'Roboto'` declarations (426/434/443/1214/1584). Replace **every**
literal with `var(--font-display)` (or `var(--reader-font)` for prose) in Phase 2; otherwise
removing the font import in Phase 8 would silently drop rules to the browser default.

Repo-wide, do not stop at `index.css`: `core-java-interview.css` has five `"Outfit"` declarations
(91, 102, 149, 296, 344) and one `"Roboto Mono"` (170), and both brand components
(`AlgoGuruLockup.tsx:17`, `BrandSplash.tsx:82`) list `Outfit` as a fallback after `Space Grotesk`.
Migrate the reader declarations to `var(--font-display)`/`var(--font-mono)` in Phase 5; the brand
fallbacks can drop `Outfit` safely because `Space Grotesk` is first and `Inter` remains second.
| Editorial accent | `Instrument Serif` | unused | Keep for landing only; do not introduce into product chrome |

### 3.3 Shape, spacing and rhythm

| Property | Landing value | Shared token |
|---|---|---|
| Content width | `max-width: 1240px` | `--shell` |
| Gutters | `clamp(20px, 5cqi, 56px)` | `--gutter` (container-query based) |
| Section rhythm | `padding-block: clamp(56px, 8cqi, 104px)` | `--section-y` |
| Section head | `gap: 1rem; padding-bottom: clamp(28px, 4cqi, 44px)` | `--section-head-gap` |
| Band separator | `border-top: 1px solid var(--lp-rule)` | `.ui-band` |
| Buttons | `min-height: 3rem`, `padding-inline: 1.3rem`, `radius: .7rem`, `15px/600`, `-0.01em` | `--control-h`, `--radius-control` |
| Chips | `padding: .12rem .45rem`, `radius: .3rem`, 1px rule | `--radius-chip` |
| Cards | 1px rule + surface, no gradient | `.ui-surface` |
| Focus | `outline: 2px solid hsl(var(--ring)); outline-offset: 3px` | global rule |
| Motion | 180ms ease; icons translate 3px on hover | `--motion-fast` |
| Elevation | `--lp-shadow` only for hero mock; `--lp-shadow-soft` for cards | keep `--shadow-card` for product cards |

`--section-y-compact` is a product-only variant (roughly half the landing rhythm) for readers and
dashboards; it is not a landing value. `--radius-surface` reuses the existing `--radius`
(`0.75rem`) rather than introducing a fourth corner scale.

### 3.4 Composition grammar (what makes it *feel* like the landing page)

1. **Kicker + rule.** Small uppercase mono label with a short leading rule, then the headline.
2. **One display headline per page.** Every route gets exactly one `h1` at display scale;
   everything below steps down through a defined scale (no `text-4xl` ad hoc).
3. **Lede paragraph.** One sentence of context under the headline, max ~62ch, in quiet text.
4. **Rules, not shadows, for structure.** Sections are separated by 1px bands; cards are
   outlined, not elevated and glowing.
5. **Numbers are mono.** Stats, counts, XP, timers, progress values use `--font-mono`.
6. **Accent is a signal.** Primary appears on one CTA and one active state per section.
   Difficulty/status colours are semantic tokens, not decorative per-card rainbows.
7. **Inverted band for the single strongest CTA.** At most one per page.
8. **A colophon footer.** The landing footer pattern becomes the app footer.

### 3.5 What must *not* be copied into product pages

- The hero mock-up window, code "cells", grain/paper texture, and 40px/80px hero shadow.
- Marketing section padding on reading or workspace routes (use `--section-y-compact`).
- Decorative serif italics, large empty hero space, and scroll-reveal animations on data tables.

---

## 4. Target architecture

Four layers, in one direction only:

```
index.css tokens  ->  tailwind.config.ts mapping  ->  ui-* component classes
                                                   ->  PagePrimitives.tsx
                                                        ->  pages
landing.css  --aliases-->  shared tokens (no independent values)
```

### 4.1 Token layer (extend `src/index.css`)

Add the missing semantic slots to the existing `:root` and `.dark` blocks instead of creating a
fourth stylesheet. Values stay as bare HSL triplets so Tailwind's `hsl(var(--x) / <alpha>)`
pattern keeps working.

```css
/* :root additions and re-pointed existing roles */
--quiet: var(--muted-foreground); /* alias: one source of truth */
--muted-foreground: 220 12% 40%;   /* was 220 10% 46% */
--border: 220 14% 88%;             /* was 220 13% 90% */
--border-strong: 220 14% 80%;
--editor-surface: var(--code-bg);      /* alias: code blocks and editors share one surface */
--editor-border: var(--code-border);   /* alias */
--code-bg: 220 20% 97%;                /* was 210 20% 96% - landing editor paper */
--code-border: 220 14% 90%;            /* was 210 20% 88% */
--code-header: 220 20% 95%;            /* derived one step lighter than --code-bg */
--primary-soft: 217 91% 57%;   /* same triplet as --primary */
--primary-soft-alpha: 0.09;
--inverse: 222 32% 8%;
--inverse-foreground: 40 30% 97%;
--inverse-quiet: 220 12% 72%;
--inverse-border: 220 14% 22%;
--syntax-key: 221 83% 45%;
--syntax-type: 178 62% 28%;
--syntax-string: 28 88% 38%;
--syntax-comment: 220 10% 54%;

--shell: 1240px;
--shell-wide: 1760px;
--reading: 38rem;
--reader-grid: 1400px;
--gutter: clamp(20px, 5cqi, 56px);
--section-y: clamp(56px, 8cqi, 104px);
--section-y-compact: clamp(32px, 4cqi, 56px);
--section-head-gap: clamp(28px, 4cqi, 44px);
--control-h: 3rem;
--radius-control: 0.7rem;
--radius-chip: 0.3rem;
--radius-surface: var(--radius);   /* 0.75rem, reuses existing --radius */
--motion-fast: 180ms;

/* type roles */
--font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
--font-body: "Space Grotesk", "Inter", system-ui, sans-serif;
--font-ui: "Inter", "Space Grotesk", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
```

`.dark` overrides mirror the values already proven in `landing.css` (`--lp-quiet`,
`--lp-rule-strong`, `--lp-editor*`, `--lp-inv*`, `--tok-*`), so the dark theme does not change
appearance when the aliases are introduced:

```css
/* .dark overrides */
--quiet: var(--muted-foreground); /* alias */
--muted-foreground: 215 14% 64%;   /* was 215 18% 65% */
--border: 220 14% 17%;             /* was 222 16% 18% */
--border-strong: 220 14% 26%;
--editor-surface: var(--code-bg);      /* alias */
--editor-border: var(--code-border);   /* alias */
--code-bg: 222 18% 7%;                 /* was 220 13% 18% - landing dark editor */
--code-border: 220 14% 18%;            /* was 0 0% 25% */
--code-header: 222 18% 10%;            /* derived one step lighter than --code-bg */
--primary-soft: 217 91% 60%;   /* matches dark --primary */
--primary-soft-alpha: 0.14;

--inverse: 220 18% 9%;
--inverse-foreground: 40 30% 97%;
--inverse-quiet: 218 12% 66%;
--inverse-border: 220 14% 20%;

--syntax-key: 213 94% 72%;
--syntax-type: 172 55% 62%;
--syntax-string: 38 92% 66%;
--syntax-comment: 215 12% 48%;
```

`--editor-surface` stays a bare triplet like every other token; the landing alpha is applied at
the use site (`.ui-editor { background: hsl(var(--editor-surface) / .9) }`, `.92` in dark), which
keeps `hsl(var(--token) / <alpha>)` working in Tailwind.

`--primary-soft` is also a bare triplet (`217 91% 57%` light / `217 91% 60%` dark); the landing
alpha lives in a companion token so light/dark resolve without duplicating CSS:
`hsl(var(--primary-soft) / var(--primary-soft-alpha))` (`.09` light, `.14` dark). Do not bake the
alpha into the colour triplet.

`--editor-*` are aliases, not independent values: they point at the existing `--code-*` tokens,
which Phase 1 re-points to the landing editor values. That includes a deliberate dark-mode change
(`--code-bg` 18% -> 7%, `--code-border` 25% -> 18%), so code blocks and reader snippets get the
same deep surface as the landing mock editor; screenshot them as part of Phase 1 review.

Existing reader tokens are near-duplicates of the shared layer: `--reading-muted`
(`220 10% 40%` / `215 16% 65%`) and `--reading-border` (`220 13% 89%` / `222 16% 18%`). In Phase 5
alias those to `--quiet`/`--border`; keep `--reading-surface` (the warm paper tint) and
`--reader-font` reader-specific, because they are deliberate reading affordances.

Tailwind mapping (`tailwind.config.ts`, via `theme.extend` only):

```ts
colors: {
  quiet: "hsl(var(--quiet))",
  border: { DEFAULT: "hsl(var(--border))", strong: "hsl(var(--border-strong))" },
  editor: { DEFAULT: "hsl(var(--editor-surface))", border: "hsl(var(--editor-border))" },
  inverse: { DEFAULT: "hsl(var(--inverse))", foreground: "hsl(var(--inverse-foreground))", quiet: "hsl(var(--inverse-quiet))", border: "hsl(var(--inverse-border))" },
  syntax: { key: "hsl(var(--syntax-key))", type: "hsl(var(--syntax-type))", string: "hsl(var(--syntax-string))", comment: "hsl(var(--syntax-comment))" },
},
fontFamily: {
  display: ["var(--font-display)"],
  sans: ["var(--font-body)"],
  ui: ["var(--font-ui)"],
  mono: ["var(--font-mono)"],
  /* keep the existing `reading` and `code` entries */
},
maxWidth: { shell: "var(--shell)", wide: "var(--shell-wide)", reading: "var(--reading)", reader: "var(--reader-grid)" },
borderRadius: { control: "var(--radius-control)", chip: "var(--radius-chip)", surface: "var(--radius-surface)" },
```

Deprecate `category.*` and `accentLine.*` from `tailwind.config.ts` once no page references them
(inventory first: they may only be used by one or two files).

### 4.2 `ui-*` component classes (in `index.css`, `@layer components`)

A small, documented vocabulary so pages stop re-inventing layouts:

| Class | Purpose |
|---|---|
| `.ui-app-canvas` | routed content wrapper; `container-type: inline-size` so page `cqi` units resolve here |
| `.ui-shell` | 1240px centred container + `--gutter` (must be rendered inside `.ui-app-canvas`) |
| `.ui-shell--wide` / `--reading` / `--full` | 1760px exam shell / 38rem prose column / 100% workspace |
| `.ui-band` | 1px `--border` top separator |
| `.ui-section` / `.ui-section--compact` | `--section-y` / `--section-y-compact` vertical rhythm |
| `.ui-kicker` | mono 10-11px uppercase, rule before text |
| `.ui-display` / `.ui-h2` / `.ui-h3` | display type scale, balanced wrapping |
| `.ui-lede` | quiet 17-19px, max 62ch |
| `.ui-meta` | mono 11-12px quiet, used for counts/labels |
| `.ui-surface` / `.ui-surface--inverse` | outlined card / inverted CTA panel |
| `.ui-chip` + tones | metadata chip and status pill |
| `.ui-btn` + `--solid` / `--line` / `--inv` / `--ghost-inv` | landing button grammar |
| `.ui-rule` | horizontal hairline |
| `.ui-grid` / `.ui-split` | container-query grids used by hubs |

The landing stylesheet then becomes an **alias + composition** file:

```css
.lp {
  --lp-paper: hsl(var(--background));
  --lp-surface: hsl(var(--card));
  --lp-quiet: hsl(var(--quiet));
  --lp-rule: hsl(var(--border));
  --lp-rule-strong: hsl(var(--border-strong));
  --lp-editor: hsl(var(--editor-surface) / 0.9);
  /* ...no independent colour values remain */
}
```

`.lp-hero`, `.lp-window`, `.lp-cell`, `.lp-diagram` etc. stay: they are landing-specific
compositions, not a design system.

### 4.3 React primitives (`src/components/layout/PagePrimitives.tsx`)

Extend without breaking the Java hub: new props are optional, existing exports keep their names.

| Export | Change |
|---|---|
| `PageShell` | **new** - owns `ui-shell` width + gutter and the width variant (`standard`/`wide`/`reading`/`full`); one per page |
| `PageContainer` | keep as thin alias of `PageShell` (deprecated re-export) |
| `PageHeader` | add `variant: "display" \| "standard" \| "compact" \| "bare"`, `kicker`, `breadcrumb`, `aside`; **stop rendering its own max-width wrapper** (assumes a `PageShell` parent) |
| `Section` | add `kicker`/`title`/`description`/`actions`, `spacing`, `band`; no width wrapper, so bands stay inside the page shell like `.lp-band` |
| `SectionHeading` | **new** - the landing section-head grid (title left, lede right at container >= 860px) |
| `Surface` | add `padding` scale, `interactive`, `inverse` |
| `StatCard` | render values in mono, use `--border-strong` hover |
| `EmptyState` | add illustration slot + primary/secondary actions |
| `Pill` | tones `neutral \| primary \| success \| warning \| danger \| inverse`, `mono` option |
| `Toolbar`, `Field`, `SegmentedControl` | visual alignment only, no API change |
| `PageState` | **new** - loading / error / empty skeleton wrapper so every route handles states identically |

**Buttons:** do not add a second button component. Extend `src/components/ui/button.tsx`
(`cva`) with `solid`, `line`, `inverse`, `inverseLine` variants and a `cta` size
(`h-12`, `px-5`), keeping the existing `default`/`outline`/`ghost` names for compatibility.
Tone mapping: `solid` = `--foreground` background / `--background` text (the landing ink button),
`line` = transparent + `--border-strong`, `inverse` = `--inverse` + `--inverse-foreground`,
`inverseLine` = transparent + `--inverse-border` on the inverse panel.
Rule: page-level primary CTA = `variant="solid"`; secondary = `"line"`; in-form submit can stay
`"default"` (primary blue) until the form pass in Phase 6.

### 4.4 Application shell (`App.tsx`, header, sidebar, footer)

- **One background and one top offset.** Remove per-page `min-h-screen bg-background pt-*`
  wrappers; the layout owns page background, header offset, and footer spacing.
- **Shared gutters.** Header inner container uses the same `--gutter` and `--shell` as pages, so
  the logo, page title, and content left edge align at every width.
- **Container context.** Wrap the routed content area in `container-type: inline-size` so
  `cqi` units and `@container` rules work even when the Guru panel squeezes the column.
- **Footer policy.** Render `<Footer />` on all routes except standalone/workspace flows:
  `/auth`, `/reset-password`, `/problem-solver`, `/playground`, `/roadmap` and `/roadmap/*`,
  `/quiz`, and every `/contest/*` route except the `/contest` landing page.
  Implement as one predicate in `App.tsx`, not per-page:

  ```tsx
  const hideFooter =
    /^\/(auth|reset-password|problem-solver|playground)(\/|$)/.test(location.pathname) ||
    location.pathname === "/roadmap" ||
    location.pathname.startsWith("/roadmap/") ||
    location.pathname === "/quiz" ||
    (location.pathname.startsWith("/contest/") && location.pathname !== "/contest");
  ```

  Today the same `location.pathname === "/"` condition is duplicated in three layout branches
  (`App.tsx` ~597, ~650, ~760); collapse those into one shared layout wrapper.
- **Header states.** Active nav item, focus ring, and mobile menu use the same `--border`,
  `--quiet`, `--primary` roles as the landing nav (`.lp-nav`), not separate `slate-*` classes.

### 4.5 Responsive strategy

Landing's use of `cqi` is a feature, not an accident: the product runs inside a resizable split
pane. Adopt it in two steps:

1. **Shell-level container queries** in `index.css` (`@container (min-width: 640px/860px/1100px)`)
   for `ui-shell`, section heads, and hub grids. This fixes the "Guru is open but the page is
   still in desktop layout" bug. Set `container-type` on `.ui-app-canvas`, **never on
   `.ui-shell` itself** - a container cannot query its own width, so `--gutter`/`--section-y`
   must resolve against the canvas (the landing equivalent is `.lp`).
2. **Page internals** keep Tailwind viewport breakpoints until each page is migrated; during
   migration replace `md:grid-cols-2` with `ui-grid`/`ui-split` where the grid is layout-critical.
   No container-query Tailwind plugin is required; the rules live in `index.css`.

Breakpoints to standardise: **640 / 860 / 1100 / 1440** (landing uses 860 as its main split).
Retire the ad-hoc `2xl:px-14` and `max-w-[110rem]` shells in favour of `--shell`/`--shell-wide`.

### 4.6 Cascade and specificity rules (important)

`landing.css` is imported from `Index.tsx` **unlayered**, while `index.css` puts base and
components in `@layer`. Unlayered rules win over layered rules, so today `.lp-*` always beats a
Tailwind utility on the same element. To avoid silent visual changes:

- Phase 1 only **replaces variable values** in `landing.css`; no selector moves, no layer moves.
- New `ui-*` classes go in `@layer components`, so utilities can still override them deliberately.
- When `Index.tsx` adopts `ui-*`, do it **class-for-class in one PR** and verify with screenshots;
  never mix `.lp-btn` and `.ui-btn` on the same element. Delete each replaced `.lp-*` rule in the
  same commit - leaving it unlayered would keep overriding the new `ui-*` class.
- Do not raise specificity with `!important` to resolve conflicts. Fix the role/token instead.

### 4.7 CSS ownership after migration

| File | After |
|---|---|
| `src/index.css` | tokens, resets, `ui-*` vocabulary, shell primitives, legacy classes being retired |
| `src/styles/landing.css` | landing compositions only (hero, mock window, diagrams, colophon); all values aliased |
| `src/styles/core-java-interview.css` | interview compositions only (`cjh-*` layout, reader grid); colours aliased to `--syntax-*`, `--editor-*`; dead rules removed |
| `src/pages/ProblemSolver.css` | workspace layout + Monaco host only; colour literals replaced by `--editor-*` where they style app chrome |
| `src/pages/*.tsx` | no raw hex, no palette-family utilities (`zinc/slate/gray`), no shell max-widths |

---

## 5. Route-by-route migration matrix

Ordered as the recommended implementation sequence. `Tier` explains how aggressive the visual
change is allowed to be.

### 5.1 Summary matrix

| # | Route(s) | Primary file(s) | Today | Target shell | Tier |
|---|---|---|---|---|---|
| 1 | `/practice` | `pages/Practice.tsx` | `max-w-7xl` x2, `zinc/slate` topic accents | `PageShell standard` + display header | A - full restyle |
| 2 | `/:topicId`, `/practice/solution/:id` | `TopicPage.tsx`, `PracticeSolution.tsx` | no max-width (unbounded padding) / `max-w-7xl` x2 | `PageShell standard` + breadcrumb | A |
| 3 | `/interview` | `pages/Interview.tsx` | 14 hex inline accents, `max-w-7xl` x2 | `PageShell standard` + display header | A |
| 4 | `/roadmap` | `pages/RoadmapHub.tsx` | `max-w-7xl` x2 | `PageShell standard` | A |
| 5 | `/problem-solver` | `pages/ProblemSolver.tsx` (+ `.css`) | full-bleed, 57 hex (Monaco) | full-bleed, chrome-only | C - workspace |
| 6 | `/profile` | `pages/Profile.tsx` | unbounded padding, 9 hex | `PageShell standard` | B - account |
| 7 | `/notes` | `pages/NotesDashboard.tsx` | `max-w-7xl` x2, 32px radii | `PageShell standard` | B |
| 8 | `/quiz`, `/contest` landing, `/contest/quiz`, `/contest/coding*` | `pages/Quiz.tsx`, `components/contest/*` | exam shell `max-w-[110rem]`; coding session full-bleed | `PageShell wide` for landing/quiz/results; coding session stays full-bleed | B - preserve exam focus |
| 9 | `/playground` | `pages/Playground.tsx` | full-bleed, 52 hex | full-bleed, chrome-only | C - workspace |
| 10 | app-wide | `components/Footer.tsx`, `App.tsx` | landing-only footer | shared colophon + route policy | A |
| 11 | `/interview/:language/*` | `pages/interview/*`, `styles/core-java-interview.css` | `cjh/cjq/cjd`, 1 shared primitive import | `PageShell` + token aliases | B - keep density |
| 12 | `/roadmap/:roadmapId` | roadmap canvas | full-screen canvas | full-screen, tokens only | C |
| 13 | `/auth`, `/reset-password` | `Auth.tsx`, `ResetPassword.tsx` | 4 hex, standalone | `ui` auth split layout | B |
| 14 | `/admin` | `Admin.tsx` | `max-w-7xl` x2 | `PageShell standard` + compact header | B |
| 15 | `/buy-me-a-coffee`, `/support` | `BuyMeACoffee.tsx` | 3 hex, 2 max-w | `PageShell standard` | A |
| 16 | `*` | `NotFound.tsx` | bare | `PageShell` + `EmptyState` | A |

### 5.2 Page notes that need more than a checklist

**Practice (pilot).** The cleanest full-page test of the system: hero, stat row, topic sections,
and cards. Replace `TOPIC_ACCENTS` (`zinc`/`slate` strings) with one neutral `Surface` treatment
plus the topic icon; use `PageHeader variant="display"`, `SectionHeading` per topic, stat values
in `font-mono`, and `Button variant="solid"` for the resume CTA. Keep all routing and progress
logic untouched. This is the page that proves the primitives before 10 others depend on them.

**Interview index.** The 14 hex values are inline `color`/`borderColor` on card metadata. Replace
the colour strings with a `tone` field (`primary | success | warning | danger | neutral`) mapped
to token classes. Do not keep per-language rainbow colours; language identity comes from the
label and icon. `PageHeader` gets the display treatment, path cards become `Surface`.

**Profile.** The only route with literally unbounded width (`2xl:px-14`). Wrap in
`PageShell width="standard"`; the profile header becomes a `Surface` with avatar/meta/actions
following the landing spec-row rhythm. Chart/badge hex values become `--chart-*` or
`--difficulty-*` tokens. Modal chrome uses `--radius-surface`, `--shadow-overlay`, and the shared
focus ring.

**Notes.** 32px card radii and mixed spacing are the main drift. Normalise to
`--radius-surface`; header becomes display; note grid uses `ui-grid`; empty state uses the shared
`EmptyState`; search/filter bar uses `Toolbar`.

**Quiz / contest.** This route legitimately needs more width, so add `--shell-wide: 1760px`
instead of a magic number. Keep the exam layout, timer prominence, and answer-card rhythm.
`QuizSection` is shared with the landing page, so migrate it **once** and verify both surfaces;
the landing quiz must not change.

**Problem solver.** Explicit exception: three-pane IDE density is the product, not marketing.
Only the chrome is unified: page header bar, tab strip, buttons, panel borders, empty/error
states, and typography outside the editor. The 57 hex values are a **Monaco theme**, so move them
into a `monacoTheme.ts` constant (single source) rather than converting them to CSS tokens.
Remove `font-family: Inter` overrides only where they conflict with `--font-ui`.

**Playground.** Same exception as the solver. 52 hex values belong to visualiser/editor palettes;
extract them to a typed palette module, keep the values, and align only the surrounding chrome
(toolbar, panel headers, run/reset buttons, output surface).

**Interview readers and hubs.** This is the largest surface area but the least visual change.
Mechanical work: the stylesheet only defines four local variables; `--cjq-reading` is a **colour**
alias (`hsl(var(--reading-surface))`), so leave the variable names as-is. Replace the remaining
`hsl()`/hex literals with shared tokens, replace its five `"Outfit"` declarations with
`var(--font-display)` and the `"Roboto Mono"` declaration with `var(--font-mono)`, and replace
duplicated button/chip CSS with `ui-btn`/`ui-chip` classes while **keeping the existing class names
as aliases** until tests are updated; `PageContainer` -> `PageShell` where a shell is actually
needed. Preserve the measured reader geometry: `1400px` document grid, `38rem` prose column, `72ch`
body measure, and compact vertical rhythm. Do not inflate the reader into landing-style hero
sections.

**Footer.** Extract the landing footer markup into `components/Footer.tsx` variants, or keep the
component and move its styles to `ui-footer`. Render it through a route predicate (see 4.4).
The footer is the cheapest signal that the whole app is one product.

---

## 6. Phased rollout

Each phase is one reviewable PR (Phase 5 may split by language). No phase starts before the
previous gate is green.

| Phase | Name | Deliverable | Visual change | Gate |
|---|---|---|---|---|
| 0 | Baseline + guardrails | Screenshot set, `scripts/audit-ui.mjs`, `npm run ui:audit`, class inventory | none | Script runs, baseline committed |
| 1 | Token foundation | New CSS variables in `:root`/`.dark`, Tailwind `extend` mapping, `landing.css` aliases | landing: zero; product: 1-2% border/quiet alignment | Landing pixel-identical; build green |
| 2 | Primitives + shell + type + pilot | `PageShell`/`SectionHeading`/`PageState`, Button variants, `ui-*` classes, heading font switch, **Practice migrated** | app-wide heading font; Practice restyle | Practice approved; tests/build green |
| 3 | Content hubs | TopicPage, Interview index, RoadmapHub, Support/BuyMeACoffee, NotFound | moderate | 5 routes share shell + header |
| 4 | Landing adoption | `Index.tsx`/`QuizSection` consume shared classes; `landing.css` reduced to compositions | none (frozen) | Before/after diff approved |
| 5 | Interview readers | All `/interview/:language/*` pages + `core-java-interview.css` token aliases; test assertions updated | low | All readers consistent; tests green |
| 6 | Account + content | Profile, Notes, Auth, ResetPassword, Admin | moderate | Forms/tabs/modals aligned |
| 7 | Workspaces (chrome only) | ProblemSolver, Playground, roadmap canvas, Quiz wide shell | low, deliberate | Density preserved; audit allowlist updated |
| 8 | Footer + cleanup | App-wide footer policy, remove dead classes, retire `category`/`accentLine`, CSS size check | small | DoD checklist complete |

### Phase 0 details (do this first, it pays for itself)

1. Capture **reference screenshots** of `/` at 360/768/1280/1600 in light and dark, Guru closed
   and open. These are the contract for "landing unchanged".
2. Add `scripts/audit-ui.mjs` (Node, no dependencies):
   - counts `#hex`, `(bg|text|border|ring)-(zinc|slate|gray|neutral)-\d`, page-level `max-w-*`,
     `rounded-[\d+px]`, `style={{ color` per file;
   - allowlists editor/canvas palettes by file + line range (Monaco theme in `ProblemSolver.tsx`,
     visualiser palettes in `Playground.tsx`, contest/canvas components);
   - compares against `scripts/ui-audit-baseline.json` and exits non-zero on regression.
3. Add `"ui:audit": "node scripts/audit-ui.mjs"` to `package.json`.
4. Inventory `lp-*`, `cjh-*`, `cjq-*`, `cjd-*`, `category.*`, `accentLine.*` usage with counts, so
   Phase 8 deletes only genuinely dead CSS.

### Phase 1 details (tokens only; landing frozen)

- Add tokens and Tailwind mapping exactly as specified in 4.1.
- Set `--border` to the landing rule value (`220 14% 88%` / dark `220 14% 17%`) and
  `--muted-foreground` to `220 12% 40%` / dark `215 14% 64%`. This is a deliberate 1-2%
  lightness alignment on product pages, reviewed with screenshots.
- Rewrite the `--lp-*` block to alias the new tokens. For the landing page the numeric values
  are identical (`88%`, `40%`, etc.), so the rendered page must not change. Verify with a
  screenshot diff, not by eye.
- Do **not** change the global heading font in this phase; that is a visible change and belongs
  with the primitives review.

### Phase 2 details (the pattern-setting PR)

- Build `ui-*` classes and the primitive APIs together; they must agree on the same tokens.
- Migrate **only** `/practice`. Resist the urge to touch other pages in the same PR.
- Switch `h1-h6` and every explicit `'Outfit'` declaration to `var(--font-display)`, and the five
  `'Roboto'` declarations to `var(--font-display)`/`var(--reader-font)` as appropriate; add
  `--font-ui` for labels. Capture before/after for one hub, one reader, and one workspace so
  reviewers can judge the type change in context.
- Update `PageHeader`/`Section` to drop their internal width wrappers and render inside `PageShell`;
  the Java hub must still render identically (its test is the guard).

### Phase 8 cleanup list

- Delete `neo-*` and `topic-card` rules once no page references them.
- Remove `category`/`accentLine` from `tailwind.config.ts` if the inventory shows no live usage.
- Remove duplicate button/chip rules from `core-java-interview.css` now that aliases exist.
- Remove per-page `min-h-screen bg-background` wrappers.
- Drop unused font families from the Google Fonts `@import` (`Outfit`, `Roboto`, `Roboto Mono`) once
  the heading switch, brand fallbacks, and `.core-java-theory-*`/reader cleanup have shipped; a
  repo-wide grep for those family names must return zero `font-family` hits.
- Re-run `ui:audit`; only the documented editor/canvas allowlist should remain.
- Record final CSS sizes (`index.css`, `landing.css`, `core-java-interview.css`) and confirm the
  shared layer did not balloon the bundle.

---

## 6.1 Execution log

| Phase | State | Evidence |
|---|---|---|
| 0 - baseline + audit | **not done** (deliberately deferred; no screenshots, no `ui:audit`) | - |
| 4 - hubs + marketing | done | `Interview.tsx`, `RoadmapHub.tsx`, `TopicPage.tsx`, `NotesDashboard.tsx`, `Quiz.tsx` rewritten on `PageShell`/`PageHeader`/`Surface`; `Quiz.test.tsx` helpers updated (`closest(".ui-stat")`, regex for the fullscreen warning) |
| 5 - reader tokens | done | `core-java-interview.css` font literals replaced with role tokens (`--font-display` / `--font-ui` / `--font-mono`); `.cjh-*` classes kept (tests assert them) |
| 8 - cleanup (part) | done | footer policy in `App.tsx` (`hideFooter` predicate, 3 render sites); `category.*`/`accentLine.*` removed from `tailwind.config.ts` (zero class usage); Monaco palettes extracted to `src/lib/monacoTheme.ts`; `Outfit`/`Roboto`/`Roboto Mono` dropped from the Google Fonts import; `ProblemSolver.css` chrome switched to `--font-ui` with prose/headings on `--font-body`/`--font-display` |
| 1 - tokens | done | `src/index.css` token block + `@layer components` `ui-*` layer, `tailwind.config.ts` extend, `landing.css` `.lp-*` aliases |
| 2 - primitives | done | `PagePrimitives.tsx` rewritten, `button.tsx` variants (`solid`/`line`/`ghost`/`reset`), heading font switch to Space Grotesk, `--font-ui` |
| 2 - pilot | done | `src/pages/Practice.tsx` migrated: `PageShell`/`PageHeader variant="display"` + progress `Surface`, per-topic `SectionHeading`, `Surface` subtopic + problem rows, `Pill` counts, `ui-chip` companies, `ui-btn` LC/GFG/Solution/note/save, `TOPIC_ACCENTS` and per-topic hex removed. Routing, Supabase upserts, celebration burst and note editor untouched. |
| 3, 6, 7 | done | all remaining routes migrated to `PageShell`/`PageHeader`/`Surface`/`Pill`/`StatCard`: `Profile`, `Auth`, `ResetPassword`, `NotFound`, `BuyMeACoffee`, `PracticeSolution`, `SupportModal`, `Playground`, `GuruBot` + `AppSidebar` + app header, 11 interview reader files, 4 contest pages + `ContestModeNotice`, `Admin`, `ProblemSolver` chrome; `QuizPlayer.tsx` (last surface) dropped `backdrop-blur`/`shadow-accent`/`shadow-overlay`/float-on-hover/bold-uppercase pills for flat `bg-card`, radius tokens, `font-ui` labels and one top hairline |

Final gate results (2026-10-19): `npm run lint` clean, `tsc -p tsconfig.app.json --noEmit` at the
13-error baseline (RoadmapEngine, registerJavaLanguage, NotesDashboard, Playground x3, four interview
question pages), `npm test` 31 files / 449 passed, `npm run build` exit 0 (`built in 31.20s`).

Browser pass, quiz player (`/quiz?language=java`): start -> 10-question run -> answer -> submit ->
results in both themes; flat cards, hairline borders, one blue accent, legible correct/incorrect tones.
Still unverified: `/admin` with a real admin session, `SupportModal` open state, `GuruBot` open state,
and a contest session under real native fullscreen (guard path only).

Phase-8 (part) gate results (2026-10-19): `tsc --noEmit` 13 errors (all pre-existing, unchanged),
`npm run lint` clean, `npm test` 447/449 (the two pre-existing `ProblemSolver.test.tsx` failures),
`npm run build` green.

Browser pass (2026-10-19, Chromium 1440x1600, synthetic Supabase session, cached daily challenge):
footer present on `/`, `/practice`, `/interview`, `/notes`, `/contest`, `/interview/java/core-java-qa`;
absent on `/auth`, `/reset-password`, `/problem-solver`, `/playground`, `/roadmap`, `/contest/quiz`.
`/problem-solver` renders the real split workspace with the new chrome/prose fonts; the Core Java hub
renders with the role-token fonts. The dark-mode `.code-block-wrapper` separation and the `.cjh-*` question-reader screen were both
captured later and accepted (dark + light). `ProblemSolver.test.tsx` was then fixed (daily panel
`sr-only` heading + `aria-hidden` eyebrow), so the suite is fully green.

Phase-2 gate results (2026-10-19): `tsc --noEmit` 14 errors (baseline was 15 - the one
`Practice.tsx` timer-type error was fixed), `npm run lint` clean, `npm test` 447/449 (only the
pre-existing `ProblemSolver.test.tsx` failures), `npm run build` green, emitted CSS contains every
new `ui-*` class. Not yet verified: browser screenshots of `/practice` and of a hub/reader/
workspace for the heading-font change.

---

## 7. Verification and QA

### 7.1 Automated gates (run in every PR)

```powershell
cd C:\Users\aritr\Desktop\AlgoGuru\Algoguru
npm run lint
npm test
npm run build
npm run ui:audit
```

Current test suite includes `Quiz.test.tsx`, `ProblemSolver.test.tsx`,
`JavaInterviewHub.test.tsx`, and `components/contest/ContestRoutes.test.tsx`. The Java hub test
asserts `cjh-btn-primary` / `cjh-btn-secondary`; update it **in the same PR** that changes those
classes, and prefer role/name assertions over class names going forward.

### 7.2 Route smoke matrix (manual, per phase)

| Route group | Light | Dark | 360px | 768px | 1280px | Guru open | Signed out |
|---|---|---|---|---|---|---|---|
| `/` | yes | yes | yes | yes | yes | yes | yes |
| `/practice`, `/:topicId` | yes | yes | yes | yes | yes | yes | yes |
| `/practice/solution/:id` | yes | yes | yes | yes | yes | yes | yes |
| `/interview` + all `:language` hubs | yes | yes | yes | yes | yes | yes | yes |
| Question detail readers | yes | yes | yes | yes | yes | yes | yes |
| `/roadmap`, `/roadmap/:id` | yes | yes | yes | yes | yes | yes | yes |
| `/profile`, `/notes`, `/admin` | yes | yes | yes | yes | yes | yes | signed-in only |
| `/contest/*` (quiz + session) | yes | yes | yes | yes | yes | n/a | yes |
| `/problem-solver` | yes | yes | n/a (desktop) | yes | yes | n/a | yes |
| `/playground` | yes | yes | n/a | yes | yes | n/a | yes |
| `/auth`, `/reset-password` | yes | yes | yes | yes | yes | n/a | yes |
| `/support`, `/buy-me-a-coffee`, 404 | yes | yes | yes | yes | yes | yes | yes |

For every row check:

1. Header, page title, and first content block share one left edge.
2. Exactly one `h1`; it renders in Space Grotesk.
3. No horizontal scrollbar at 360px.
4. Cards use 1px border + surface, radius from `--radius-surface`, no gradient/glow.
5. Primary action uses the solid button; secondary uses line; focus ring visible on Tab.
6. Numbers and counters use mono.
7. Empty/loading/error states use `PageState`/`EmptyState`, not bespoke markup.
8. Sticky header does not cover anchored content (scroll-margin).
9. Dark mode: quiet text and rules remain distinguishable; no pure-black panels inside cards.
10. Reduced motion: no icon/image animation when `prefers-reduced-motion: reduce`.

### 7.3 Accessibility checks

- Body text contrast >= 4.5:1, large display text >= 3:1, in both themes.
- All interactive targets >= 44x44px (landing buttons are 48px high; icon buttons must not shrink).
- Visible focus on every interactive element (`2px` ring, `3px` offset) - no `outline: none`.
- Heading order is sequential per page after `PageHeader` adoption.
- Quiz/contest keyboard flow unchanged (options, submit, review).
- Monaco/Playground keep their own a11y behaviour; do not restyle focus inside the editor.

### 7.4 Visual verification method

No Playwright/Storybook is installed, so keep it lightweight:

1. Commit a small `docs/ui/baseline/` set before Phase 1: `/` at 360/768/1280/1600, light + dark,
   Guru closed + open (16 PNGs, compressed). This is the contract for "landing unchanged".
2. After each phase, capture the same routes/widths into git-ignored `screenshots/phase-N/` and
   compare side by side (or with a local diff tool).
3. The only accepted diff on `/` during Phases 1 and 4 is **zero**.
4. In Phase 8, promote the approved final set to `docs/ui/reference/` and point the QA doc at it.

If the team later wants automated visual regression, add Playwright in a separate, explicitly
approved change. It is not part of this plan.

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Global `h1-h6` font switch (Outfit -> Space Grotesk) shifts every page | High | Isolate in Phase 2 with before/after screenshots of hub, reader, workspace; the change is a small, isolated diff and easy to revert |
| Aligning `--muted-foreground`/`--border` to landing values changes many screens | Medium | Phase 1 changes tokens only (no markup); landing must stay pixel-identical, product shift is <=2% and reviewed on sample tables/readers |
| `landing.css` is unlayered and beats utilities | Medium | Phase 1 changes values only; new classes live in `@layer components`; no mixed `.lp-*`/`.ui-*` elements |
| Container-query adoption breaks viewport-based page internals | Medium | Shell-level first; migrate page grids one at a time; test at 360/768/1280 + Guru open |
| Huge workspace files (ProblemSolver ~2.5k lines, Playground ~4.9k) | Medium | Mechanical, chrome-only replacement; extract palettes to constants; no component refactor |
| Tests assert implementation classes | Medium | Update assertions with the class change; move to role/text queries where touched |
| Interview readers lose their restrained density | Medium | Explicit rule: keep the 1400px doc grid, 38rem prose column, 72ch measure, and compact rhythm; no hero sections |
| Duplicated CSS grows the bundle | Low | Move, do not copy; delete aliases in Phase 8; compare CSS size before/after |
| Dark mode contrast regressions from new tokens | Medium | Tokens mirror `landing.css` dark values; run the dark column of the smoke matrix |
| Re-pointing `--code-bg` dark 18% -> 7% makes code blocks much darker | Medium | Review `.code-block-wrapper` and reader snippets in Phase 1; if the panel loses separation, keep `--code-bg` at a panel tone and let only editors use `--editor-surface` |
| Landing loses its distinctive character | Low | Landing keeps hero/mock/diagram compositions; only primitives and tokens are shared |
| Scope creep into copy/IA/layout | High | Non-goals below are enforced in review; one route per PR |

---

## 9. Non-goals

- No information-architecture, routing, copy, or data changes.
- No new UI libraries, chart libraries, animation libraries, or CSS frameworks.
- No redesign of the Guru panel, roadmap canvas, editor, or terminal interactions.
- No change to reading measure, exam timer behaviour, or code-execution flows.
- No removal of dark mode or introduction of a third theme.
- No component-library rewrite (shadcn primitives stay; only their tokens/variants change).
- No automated visual-regression dependency added by default.
- No touching generated files (`components/ui/*` beyond `button.tsx` class variants is out of scope).

---

## 10. Definition of done

- [ ] Shared tokens exist in `index.css` for quiet text, strong rules, editor surfaces, inverse
      panel, syntax colours, shell widths, gutters, section rhythm, control radius.
- [ ] `tailwind.config.ts` maps those tokens; no new hardcoded hex palettes.
- [ ] `landing.css` contains **zero independent semantic colour values** (hero shadow/grain effects
      may stay local); it aliases shared tokens and keeps only landing-specific compositions.
- [ ] `PageShell`, `PageHeader` (4 variants), `Section`, `SectionHeading`, `Surface`, `PageState`,
      `EmptyState`, `Pill`, `Button` variants are the only page vocabulary.
- [ ] Every non-workspace route (except `/auth`, `/reset-password`) renders through `PageShell`; every page has one display `h1`.
- [ ] `ui:audit` passes with only the documented editor/canvas allowlist.
- [ ] Footer renders app-wide except the documented standalone/workspace routes.
- [ ] Light/dark, 360-1760px, Guru-open, keyboard, and reduced-motion checks pass.
- [ ] `npm run lint`, `npm test`, `npm run build` pass; no skipped tests added.
- [ ] Final screenshots archived; a short "UI contribution rules" note added to the repo
      (where tokens live, which primitive to use, no raw hex, no page-level max-widths).

---

## Appendix A - Per-PR checklist

```text
[ ] Only the routes in this PR's scope are touched
[ ] Page uses PageShell + PageHeader/Section (or documents why it is a workspace exception)
[ ] No #hex / zinc|slate|gray palette classes added
[ ] No new page-shell max-w-* / rounded-[..px] / arbitrary shadow (text measures like max-w-prose are fine)
[ ] Numbers use font-mono; one solid CTA per section
[ ] Light + dark screenshots attached
[ ] 360px and Guru-open widths checked
[ ] lint / test / build / ui:audit green
[ ] Class-assertion tests updated with the class change
```

## Appendix B - Decisions needed before Phase 2

| # | Decision | Recommendation |
|---|---|---|
| 1 | Global headings: switch `Outfit` -> `Space Grotesk`? | **Yes.** It is the single biggest "same product" win and matches every landing display heading |
| 2 | Body face: keep `Space Grotesk` or move to `Inter`? | **Keep Space Grotesk body**, use `Inter` only for UI labels/buttons/prose (`--font-ui`), matching landing's own split |
| 3 | Footer on all product routes? | **Yes**, except auth, workspaces, roadmap canvas, timed exam |
| 4 | Workspaces: full restyle or chrome-only? | **Chrome-only.** Solver/playground density is a feature |
| 5 | Interview readers: landing airiness or compact density? | **Compact density**, shared tokens only |
| 6 | Per-topic colours on Practice/Interview cards? | **Drop the rainbow**; one neutral surface + icon/label, semantic tones only where meaning exists |

## Appendix C - Quick reference (measured)

| Fact | Location |
|---|---|
| Landing tokens and shell | `src/styles/landing.css` lines 8-86 |
| Landing button grammar | `src/styles/landing.css` lines 167-236 |
| Landing chip | `src/styles/landing.css` line 714 |
| Global tokens / dark overrides | `src/index.css` lines ~190-320 |
| Shared primitives | `src/components/layout/PagePrimitives.tsx` (395 lines) |
| Only current consumer | `src/pages/interview/JavaInterviewHub.tsx:13` |
| Button cva variants | `src/components/ui/button.tsx` |
| Monaco theme literals | `src/lib/monacoTheme.ts` (extracted from `ProblemSolver.tsx`) |
| Interview token layer | `src/styles/core-java-interview.css` (3,488 lines) |
| Footer gating | `src/App.tsx` (`hideFooter` predicate) |
| Class-assertion tests | `src/pages/interview/JavaInterviewHub.test.tsx:147,149` |

---

**Next action:** review Appendix B decisions. On approval, start Phase 0 (screenshots + audit
script) and Phase 1 (tokens only; zero visual diff on the landing page).

