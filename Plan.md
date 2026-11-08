# AlgoGuru UI rollout plan

This guide explains how to bring every page in the app up to the style now used by the home page (`src/pages/Index.tsx`), the app header and the footer. It covers the design rules, the shared building blocks to create first, the order to migrate pages in, and the checks to run on each one.

Read it alongside `Guardrail.md`. The guardrails still apply: presentational changes only, no changes to routes, data fetching, auth, props interfaces, contexts or hooks, and no removing `id`, `name`, `data-testid` or `aria-*` attributes.

---

## 1. What the style is

The goal is a calm, product-first interface in the style of Linear, Vercel or Stripe. Content and real product UI carry the page; decoration does not.

| Rule | In practice |
| --- | --- |
| Neutral surfaces | Gray ramp from the `obsidian-*` tokens. No colored page backgrounds. |
| One accent, used sparingly | Brand blue (`--primary`) only for small labels, links on hover, progress, focus rings and unread markers. |
| High-contrast primary action | Solid `foreground` button with `background` text (white on dark, black on light). |
| Hairlines instead of shadows | 1px `border-obsidian-border`. Shadows only on floating things (product frames, menus, dialogs). |
| One typeface for UI | Inter (`font-sans`) for headings and body. JetBrains Mono only for code, file names and keyboard keys. |
| Plain copy | Say what the feature does. No "crush", "FAANG", "supercharge", "free forever" repeated, or three-part slogans. |
| Motion that explains | Fade or short rise on enter, state changes (tests running → passed). Nothing that loops or follows the cursor. |

---

## 2. Design tokens

Use the existing theme tokens from `src/index.css`. Do not introduce new hex values in components.

### Surfaces and lines

| Role | Tailwind class | Dark value | Light value |
| --- | --- | --- | --- |
| Page background | `bg-obsidian-void` | `#070709` | warm paper |
| Panel, card, alternate section band | `bg-obsidian-pane` | `#0c0c10` | white |
| Raised (window bars, hover on panes) | `bg-obsidian-elevated` | `#111117` | white |
| Lines | `border-obsidian-border` | white 8% | gray 89% |
| Hover fill on ghost controls | `hover:bg-foreground/[0.05]` | | |
| Selected / active fill | `bg-foreground/[0.06]` | | |

Never use `bg-white/[0.0x]` for hover or fills. It is invisible in light mode. Use `bg-foreground/[0.0x]`, which works in both themes.

### Text

| Role | Class |
| --- | --- |
| Primary text, headings | `text-foreground` |
| Secondary text, descriptions, metadata | `text-muted-foreground` |
| Small section label (kicker) | `text-primary text-sm font-medium` (the `.lp-kicker` style) |
| Success | `--lp-success` / `.lp-success` (emerald, tuned per theme) |
| Warning | `text-amber-600 dark:text-amber-400` |
| Danger | `text-red-600 dark:text-red-400` |

### Radius

| Element | Radius |
| --- | --- |
| Buttons, inputs, chips | `rounded-lg` (8px) or `rounded-md` (6px) |
| Cards, panels, product frames | `rounded-[0.875rem]` (14px) |
| Large call-to-action panel | `rounded-2xl` |

Do not use `rounded-3xl` or `rounded-[1.75rem]` and larger.

### Focus

`focus-visible:ring-2 focus-visible:ring-ring/60` on every interactive element, or the `outline` rule already set inside `.landing-page`. Never remove focus styles.

---

## 3. Typography scale

| Use | Size / weight | Class or CSS |
| --- | --- | --- |
| Marketing H1 (home only) | 40–68px, 600, tracking −0.04em | `.lp-h1` |
| Page title (all other pages) | 30–40px, 600, tracking −0.03em | `text-3xl md:text-4xl font-semibold tracking-[-0.03em]` |
| Section heading | 30–44px on marketing, 20–24px inside app pages | `.lp-h2` / `text-xl md:text-2xl font-semibold tracking-[-0.02em]` |
| Card title | 15–17px, 600 | `text-[15px]` to `text-[17px] font-semibold` |
| Body / lead | 15–17px, line-height 1.6–1.7 | `.lp-lead` or `text-[15px] leading-7 text-muted-foreground` |
| Metadata, captions | 12–13.5px | `text-[13px] text-muted-foreground` |
| Numbers in UI | add `tabular-nums` | |

Rules:
- Use `font-sans` for headings. `font-display` (Space Grotesk) is retired from page UI. Leave it only where a test or brand asset depends on it.
- Use `font-semibold` (600) for headings. Avoid `font-black` and `font-extrabold`.
- Sentence case for labels and headings. Avoid `uppercase tracking-[0.2em]` micro-labels. A small `text-[13px] font-medium` label reads better.

---

## 4. Layout

- **Container:** `max-w-7xl` with `px-5 sm:px-6`. This matches the header so the logo, page title and footer share one left edge. The home page uses `.lp-container`, which has the same values.
- **Vertical rhythm:** sections use `py-20 md:py-28` on marketing-style pages (`.lp-section`), and `py-10 md:py-14` on dense app pages.
- **Alternating bands:** to separate sections, alternate `bg-obsidian-void` with a `bg-obsidian-pane` band that has `border-y border-obsidian-border` (`.lp-band`). Don't use gradients or glows to separate sections.
- **Two-column split:** text on the left (5/12) and a product panel on the right (7/12) above about 1000px, stacked below (`.lp-split`).
- **Grids of items:** prefer a shared-border grid (`.lp-grid` + `.lp-cell`) or a divided list (`.lp-list`) over separate floating cards with gaps.

---

## 5. Building blocks (do this first)

Today the new styles live in `src/styles/landing.css`, which only loads with the home route. Before migrating other pages, make them available app-wide.

### Step 5.1 — Shared stylesheet

1. Create `src/styles/ui.css` and import it once from `src/main.tsx` (after `index.css`).
2. Move the generic `lp-*` utilities out of `landing.css` into `ui.css`, keeping the class names:
   `lp-container`, `lp-section`, `lp-band`, `lp-split`, `lp-kicker`, `lp-h2`, `lp-lead`, `lp-btn`, `landing-primary` (alias it as `lp-btn-primary`), `lp-btn-secondary`, `lp-link`, `lp-chip`, `lp-chip-success`, `lp-frame`, `lp-frame-bar`, `lp-dot`, `lp-well`, `lp-grid`, `lp-cell`, `lp-icon`, `lp-list`, `lp-progress`, `lp-tab`, `lp-success`.
3. Move the token block (`--lp-bg`, `--lp-surface`, `--lp-line`, `--lp-accent`, `--lp-success`) from `.landing-page` to `:root` / `.dark` so it applies everywhere.
4. Keep only home-specific rules (`.lp-hero`, `.lp-h1`, `.lp-stats`, hero frame layout, code choreography) in `landing.css`.
5. Keep `Index.test.tsx` passing. It asserts the `landing-primary` class and `.hero-goal-fill`.

The "Shared surface overrides" block at the bottom of `landing.css` (`.premium-card`, `.spotlight-card::before`, `.nav-glass`, `.mobile-dock`) currently changes other pages only after the home page has loaded. Move it to `ui.css` so it applies consistently, then remove each override once no page uses that class.

### Step 5.2 — Update `PagePrimitives.tsx`

`src/components/layout/PagePrimitives.tsx` already has `PageContainer`, `PageHeader`, `Section`, `Surface`, `StatCard`, `EmptyState`, `SegmentedControl` and `Field`, but only `JavaInterviewHub.tsx` uses them. Restyle them without changing their props:

| Primitive | Change |
| --- | --- |
| `PageContainer` | `px-5 md:px-10 lg:px-16` → `px-5 sm:px-6` |
| `PageHeader` | Remove the radial wash. Render `eyebrow` as a plain `.lp-kicker` line, not a pill. Title `font-semibold tracking-[-0.03em]`. Padding `py-10 md:py-14`. |
| `Section` | Same container padding as above. |
| `Surface` | `rounded-[0.875rem] border-obsidian-border bg-obsidian-pane`, no `shadow-card`. Interactive hover: `hover:bg-obsidian-elevated`, not a primary-colored border or glow. |
| `StatCard` | Drop the tinted icon tile and `accent` color. Value `text-[1.75rem] font-semibold tabular-nums`, label below in muted text (same as the home stats row). Keep the `accent` and `icon` props so callers still compile; render the icon muted. |
| `EmptyState` | Neutral icon box, `text-[15px]` title. Already close. |

Then use these primitives as each page is migrated, instead of hand-written headers.

### Step 5.3 — Align `Button` with the new style

`src/components/ui/button.tsx` is used across the app, so change it carefully and screenshot the result:

- `default`: `bg-foreground text-background hover:bg-foreground/85`, no `shadow-accent`, `font-medium`.
- `outline`: `border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated`, no primary-colored hover border.
- `ghost`: `hover:bg-foreground/[0.05]`.
- Remove `active:scale-[0.985]`.
- Keep `bg-primary` available as a new `accent` variant for the rare place that needs a colored button.

Search tests for `toHaveClass` on buttons before changing this (`grep -r "toHaveClass" src`).

### Step 5.4 — Shared product frame

The home page's mock app window (frame + bar + dots + chip) is the pattern for any "preview" or "sample" panel. If more pages need it, extract a small `ProductFrame` component from `HeroWorkspacePreview.tsx` / `WorkspaceDemoSection.tsx` into `src/components/layout/`, with `title`, `badge` and `children` props.

---

## 6. Patterns to remove

Search for these on every page you migrate. Replace them with the alternative.

| Pattern | Replace with |
| --- | --- |
| `aurora-blob`, `bg-noise`, `bg-grid`, `bg-dots`, `hero-mesh`, page-level `radial-gradient(...)` washes | Plain `bg-obsidian-void`, or a `.lp-band` |
| `bg-clip-text` + gradient (gradient headline words) | Plain `text-foreground` |
| `bg-gradient-to-*` on buttons, badges, progress bars | Solid fill (`bg-foreground`, `bg-primary`) |
| `SpotlightCard`, `spotlight-card`, cursor-follow glows, `usePointerTilt`, `MagneticButton` | `Surface` / plain bordered panel |
| `button-shine`, sparkle or pulse animations on buttons | Nothing |
| `animate-ping` status dots | A static dot, or nothing. Keep only for a genuinely live state (e.g. a running contest). |
| `AnimatedCounter` for static numbers | Plain text with `tabular-nums` |
| `icon-tile`, colored icon squares (`bg-primary/10 text-primary`) | `.lp-icon` (neutral bordered square) or a bare muted icon |
| `rounded-3xl`, `rounded-[1.75rem]`+ | `rounded-[0.875rem]` |
| `font-display`, `font-black` | `font-sans font-semibold` |
| `uppercase tracking-[0.1em+]` labels | Sentence-case `text-[13px] font-medium` |
| `bg-white/[0.0x]`, `hover:bg-white/[0.0x]` | `bg-foreground/[0.0x]` |
| `obsidian-accent` (violet) for active or selected states | `text-foreground` + `bg-foreground/[0.06]`; brand blue (`primary`) only for small accents |
| `shadow-specular`, `shadow-overlay` on in-flow cards | Hairline border only |
| Heavy `backdrop-blur` on in-flow content | Only on sticky header, menus and dialogs |

A quick way to see what's left on a page:

```powershell
Select-String -Path src\pages\Practice.tsx -Pattern 'aurora-blob|bg-clip-text|bg-gradient-to|radial-gradient|animate-ping|font-display|font-black|rounded-3xl|SpotlightCard|premium-card|button-shine|icon-tile|bg-grid|bg-noise|white/\[0\.|obsidian-accent|uppercase'
```

---

## 7. Migration order

Pages are grouped by how visible they are and how much decoration they carry. The "Decor" column is the number of matches for the patterns above at the time of writing.

### Phase 1 — Shared foundation

Steps 5.1 to 5.3. Then restyle the app chrome that every page shows:

| File | Decor | Notes |
| --- | --- | --- |
| `components/AppSidebar.tsx` | 24 | Library sidebar on most routes. Neutral list items, `bg-foreground/[0.06]` for the active item, no colored category tiles. |
| `components/layout/MobileNav.tsx` | already neutralized | Check the bottom dock in light mode at 390px. |
| `components/SupportModal.tsx` | 15 | Plain dialog, solid primary button. |
| `components/layout/RouteFallback.tsx` | — | Loading screen: remove glow/grid, keep the logo and a neutral skeleton. |
| `components/brand/BrandLoader.tsx` | — | Keep the mark, drop the halo glow. Has a test. |

Also in this phase, delete the motion helpers the home page no longer uses. As of this writing nothing imports them: `components/motion/SpotlightCard.tsx`, `MagneticButton.tsx`, `AnimatedCounter.tsx`, `usePointerTilt.ts` and `hooks/useElementScrollProgress.ts`. Re-check with a search before deleting. `ContestLanding.tsx` still uses the `spotlight-card` CSS class directly, so remove that class there first (Phase 2) before deleting the `.spotlight-card` rules from `index.css`.

### Phase 2 — High-traffic entry pages

| Route | File | Decor |
| --- | --- | --- |
| `/auth` | `pages/Auth.tsx` | 24 |
| `/practice` | `pages/Practice.tsx` | 19 |
| `/interview` | `pages/Interview.tsx` | 20 |
| `/contest` | `pages/contest/ContestLanding.tsx` | 14 |
| `/contest/quiz` | `pages/Quiz.tsx` | 29 |
| `/profile` | `pages/Profile.tsx` | 8 |
| `/notes` | `pages/NotesDashboard.tsx` | 19 |
| `*` | `pages/NotFound.tsx` | 8 |

`Auth.tsx` is the first page signed-out visitors see, so give it the home page treatment: a plain form panel on the left, and on the right either a quiet product frame or nothing. Remove the gradient "back." / "confidently." words.

### Phase 3 — Interview track

| Route | File | Decor |
| --- | --- | --- |
| `/interview/:language/spring-boot` | `pages/interview/BackendInterviewHubPage.tsx` | 8 |
| `/interview/:language/spring-boot/questions[/:slug]` | `BackendQuestionsPage.tsx`, `BackendQuestionDetailPage.tsx` | 3, 5 |
| `/interview/:language/spring-boot/annotations` | `BackendAnnotationsPage.tsx` | 4 |
| `/interview/:language/spring-boot/practice[/:id]` | `BackendPracticePage.tsx`, `BackendPracticeDetailPage.tsx` | 3, 3 |
| `/interview/:language/core-java-qa[/:slug]` | `InterviewCoreJavaQuestionsPage.tsx`, `InterviewCoreJavaQuestionDetailPage.tsx` | 2, 1 |
| `/interview/:language/language-questions[/:slug]` | `InterviewLanguageQuestionsPage.tsx`, Python/C++ question and detail pages | 5–12 |
| `/interview/:language/system-design` | `InterviewSystemDesignPage.tsx` | 4 |
| Language hubs | `JavaInterviewHub.tsx`, `PythonInterviewHub.tsx`, `CppInterviewHub.tsx`, `InterviewComingSoonLayout.tsx` | 0–6 |

These pages share `src/styles/core-java-interview.css` (about 250 `.cjh-*` classes, 88 KB). Restyle that file's tokens and card classes instead of each page, then remove `.cjh-*` rules as pages move to `PagePrimitives`. The question reader text (`font-reading`, Source Sans 3) can stay, because long-form reading benefits from it.

### Phase 4 — Content and utility pages

`/:topicId` (`TopicPage.tsx`), `/practice/solution/...` (`PracticeSolution.tsx`), `/buy-me-a-coffee` (`BuyMeACoffee.tsx`), `/reset-password` (`ResetPassword.tsx`), `/admin` (`Admin.tsx`), contest instructions and result (`CodingContestInstructions.tsx` 12, `CodingContestResult.tsx` 5).

### Phase 5 — Immersive workspaces (chrome only)

`/playground` (`Playground.tsx`), `/problem-solver` (`ProblemSolver.tsx` + `ProblemSolver.css`), `/contest/coding/session/:id` (`CodingContestSession.tsx`), `/roadmap[/:id]`.

Only restyle the toolbars, tabs, panel headers and buttons around the editor or canvas. Do not change Monaco themes, editor options, the roadmap canvas palette (`.coggle-roadmap-shell` locks its own dark palette on purpose) or panel resizing. Follow the guardrail on no heavy effects in editor routes.

---

## 8. Per-page checklist

For each page:

1. **Baseline.** Note the route, run its tests, and take a screenshot in dark mode, light mode and at 390px wide.
2. **Header.** Replace the hand-written hero with `PageHeader` (kicker, title, description, actions), or copy its classes if the page needs a custom layout.
3. **Container.** Wrap content in `PageContainer` / `Section` so it lines up with the app header.
4. **Surfaces.** Replace custom cards with `Surface`, `.lp-grid` / `.lp-cell` or `.lp-list`.
5. **Actions.** One primary button per view (`Button` default or `.lp-btn landing-primary`), the rest `outline` or `ghost`.
6. **Remove patterns** from section 6.
7. **Copy.** Shorten marketing copy and remove hype words. Keep any text a test asserts, or update the test in the same change and say why.
8. **States.** Check loading, empty, error, signed-in and signed-out states still render and look consistent.
9. **Verify** (section 9).
10. **Compare** the new screenshots to the home page side by side. Spacing, border weight and heading style should look like one product.

---

## 9. Verification

After each page, as required by `Guardrail.md`:

```powershell
npx tsc --noEmit -p tsconfig.app.json   # no new errors in the files you touched
npm run lint                             # zero errors and warnings
npx vitest run <tests for that page>     # e.g. src/pages/Quiz.test.tsx
```

After each phase:

```powershell
npx vitest run       # whole suite
npx vite build       # production build
```

Known baseline issues, so they aren't mistaken for regressions:
- `tsc --noEmit` already reports errors in `LeetCodeEditor.tsx`, the roadmap nodes, `Playground.tsx`, `NotesDashboard.tsx`, `Practice.tsx`, `registerJavaLanguage.ts` and four interview question pages. Fix them only if you are editing those files anyway.
- `src/lib/codingContest/javaProblemBank.test.ts` has 3 failing tests on the current branch, unrelated to UI.
- `CodingContestSession.test.tsx` and `BackendInterviewPages.test.tsx` can time out under full-suite load but pass when run on their own.

Visual checks:
- Dark and light mode at 1440px, and dark mode at 390px.
- Keyboard: Tab through the page, check focus is visible on every control, and that Escape closes menus and dialogs.
- Reduced motion (OS setting or DevTools emulation): content appears in its final state with nothing hidden.
- No horizontal scrolling at 390px.

The landing page is behind sign-in. To screenshot pages without signing in, a temporary harness works well: an HTML entry plus a small `src/*-preview.tsx` that renders the page inside `MemoryRouter`, `TooltipProvider`, `SettingsProvider` and `AuthProvider`, served by `npx vite`. Delete both files afterwards.

---

## 10. Definition of done

A page is done when:

- None of the section 6 patterns remain (or each remaining one has a stated reason).
- It uses the shared container, header and surface styles, and lines up with the app header.
- It looks consistent with the home page in dark, light and mobile screenshots.
- Lint passes, its tests pass, and the build succeeds.
- No routes, data calls, props, ids or aria attributes changed.

The rollout is done when every route in section 7 meets that bar, and the "Shared surface overrides" block, the `.spotlight-card` / `.premium-card` / `.button-shine` / `.aurora-blob` rules and the unused `.cjh-*` rules have been deleted.
