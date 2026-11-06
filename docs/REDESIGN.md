# AlgoGuru — UI redesign: the Forge workspace

This document records the redesign that ships on this branch: the audit, the
direction, the tokens, what motion does and does not do, what was borrowed from
Vengeance UI and what was rejected, and the validation results.

---

## 1. Audit of the original interface

The live site (`https://www.algoguru.online/`) serves the sign-in screen to
anyone who is not authenticated, so the audit was done against that screen plus
the source in this repository.

| Area           | What was wrong                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public surface | `/` was gated. A visitor saw a login form before seeing a single lesson, a problem, or an explanation of what the product is.                                                                                                |
| Colour         | Per-topic rainbow accents (`modeMeta`), purple/blue neon gradients, glow blobs, `text-gradient-*` on most headings. Colour carried no meaning: two topics could differ only by hue.                                          |
| Surfaces       | Glassmorphism in navigation and cards, four different shadow recipes, and a near-uniform 16–24 px radius on everything, so nothing read as a container or a control.                                                         |
| Type           | One family at loosely chosen sizes, no scale, no tabular numerals, no code role distinct from UI text. Headings were centred and oversized relative to the content below them.                                               |
| Density        | Cards were padded like marketing tiles in screens used daily for reading and solving. The sidebar's rainbow icon chips consumed attention without adding information.                                                        |
| Motion         | Ad-hoc: framer-motion in some places, CSS transitions in others, some infinite pulse/float loops, no shared duration or easing vocabulary. No reduced-motion story.                                                          |
| Accessibility  | Muted text below AA on several surfaces, hover-only affordances, inconsistent focus rings, no skip link on public pages, decorative elements exposed to screen readers.                                                      |
| Consistency    | Four legacy class families (`glow-*`, `cr-*`, `lc-*`, `hero-*`) coexisted with shadcn utilities; content widths changed from route to route; the app had no shell hierarchy (sidebar, header, main and panel read as peers). |

---

## 2. Visual direction — “Forge”

A graphite workspace with a single ember accent, editorial typography for
emphasis, and hairlines instead of shadows wherever a border can do the job.

- **Palette.** Warm graphite dark / warm paper light, one ember `--primary`,
  one gold `--accent` used only for editorial emphasis, cool violet reserved for
  the Guru assistant so AI surfaces cannot be confused with product actions.
- **Elevation.** A ladder — page < chrome < panel < raised — expressed mostly by
  1 px lines (`--surface-line`, `--surface-line-strong`) and a very short shadow
  ladder for overlays only.
- **Type.** Inter for UI and display, JetBrains Mono for metadata, counts,
  paths, code and keyboard hints, Instrument Serif italic for one emphasised
  phrase per section. Tabular numerals everywhere numbers are compared.
- **Rhythm.** Section index numbers in a gutter (`01`, `02`, …), hairline rules,
  asymmetric two-column headers, no centred-everything.
- **No decoration without a job.** The grain, vignette and bloom are single,
  static layers; no blob shapes, no floating icon confetti, no neon.

---

## 3. Information architecture

- `/` is the public landing page. A signed-in visitor is redirected to `/home`.
- `/home` is the authenticated workspace inside the application shell.
- Landing sections: `#session`, `#workspace`, `#path`, `#numbers` — mirrored by
  the primary navigation and by a “Contents” index in the hero.
- Application shell: primary rail (tracks + workspace pages), route-scoped
  context navigation, top bar (breadcrumbs/route title, command palette, user
  menu), main region, optional right inspector (Guru), tabs where a route has
  sub-views, and a mobile sheet for the rail.

---

## 4. Design tokens

All tokens live in `src/index.css` (values) and `tailwind.config.ts` (utilities).
No component introduces an arbitrary colour, radius, duration or shadow.

**Surfaces / lines** — `--surface-page`, `--surface-chrome`, `--surface-panel`,
`--surface-raised`, `--surface-line`, `--surface-line-strong`, `--grid-line`.

**Text** — `--foreground`, `--muted-foreground`, `--reader-*`, `--code-*`.

**Accent & semantic** — `--primary` (ember), `--accent` (gold), `--success`,
`--warning`, `--info`, `--heap`, `--difficulty-easy|medium|hard`, `--guru-*`.

**Radius** — `--radius-xs` 3 px, `--radius-sm` 4 px, `--radius-md` 6 px,
`--radius-lg` 8 px, `--radius-xl` 10 px, plus a pill only for count chips.

**Type scale** — 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 15 /
16 px body range, display sizes by `clamp()`; `.ws-eyebrow` for uppercase mono
meta, `.ws-display-*` for headings, `.ws-editorial` for serif emphasis.

**Motion** — `--dur-1` 120 ms, `--dur-2` 180 ms, `--dur-3` 240 ms, `--dur-4`
320 ms, `--dur-5` 520 ms; `--ease-standard|out|in-out|spring`.

**Layout** — `--header-height`, `--sidebar-width`, `--sidebar-width-compact`,
`--content-max` 1180 px, `--reading-max` 68 ch, `--inspector-width` 352 px,
breakpoints 640 / 768 / 1024 / 1280 / 1536.

**Z-index** — `raised`, `sticky`, `nav`, `overlay`, `modal`, `toast`, `tooltip`,
`command`.

---

## 5. Motion system

Rules: transform and opacity only; 160–280 ms for anything a user triggers;
longer only for the first-load story; never delay an action to play an
animation; no bounce in serious workflows; every animation is disabled under
`prefers-reduced-motion` (globally in `landing.css`, per-component with
`useReducedMotion`).

| Moment        | Behaviour                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Headline      | Three masked lines rise 110 % → 0 over 950 ms, staggered 110 ms.                                                                      |
| Product stage | Window enters from `rotateX 12° / rotateY -12°` + 46 px, 1.15 s, then leans with the pointer on a spring (stiffness 90 / damping 18). |
| Code          | Lines reveal every 52 ms with a caret; a run fires, the suite goes 12/12 green.                                                       |
| Status cards  | Fly in at 2.1 s / 2.4 s, then drift 6 px on a 7 s loop.                                                                               |
| Sections      | Single 600 ms fade-up on scroll into view, once.                                                                                      |
| Story         | Chapters cross-fade the media panel over 200 ms as each chapter hits the middle of the viewport.                                      |
| Path          | Progress stroke scales from the top on a 500 ms ease; detail panel fades 220 ms.                                                      |
| Counters      | `easeOutExpo` count-up over 1.1 s on first view.                                                                                      |
| Nav           | Height 64 → 48 px and a 1 px progress bar (`transform: scaleX`) driven by one passive scroll listener.                                |

---

## 6. Vengeance UI — considered, used, rejected

| Component                     | Decision                   | Why                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spotlight Navbar              | **Used (reimplemented)**   | The pointer spotlight and spring-anchored active indicator are useful wayfinding. The published version is a Next.js `<style jsx>` decorative pill; this version keeps the spotlight, drops the pseudo-element styling, uses real `<a>` targets with focus rings, and tracks sections with `IntersectionObserver`. |
| Flip Text                     | **Rejected**               | Looping character flips in a study tool are exactly the “continuous distracting motion” the brief rules out.                                                                                                                                                                                                       |
| Glass Dock                    | **Rejected**               | Floating glass dock reduces target reliability and duplicates the primary rail.                                                                                                                                                                                                                                    |
| Animated Rays / Beams         | **Rejected**               | Decorative light shafts behind content compete with code readability.                                                                                                                                                                                                                                              |
| Animated tooltip              | **Used as a pattern only** | The app already ships a Radix tooltip; its timing was tuned to the token durations rather than importing a second tooltip.                                                                                                                                                                                         |
| Scroll cards / staggered grid | **Rejected**               | Requires GSAP + imagesLoaded; neither is in the dependency set and the brief forbids adding a second animation library.                                                                                                                                                                                            |
| Magnetic button               | **Rejected**               | The ember CTA gets a light-sweep and 1 px lift instead; magnetism fights precise clicking.                                                                                                                                                                                                                         |

No Vengeance UI package, registry or runtime dependency is installed — every
adaptation is local code in this repository.

---

## 7. Routes redesigned

`/` (new public landing) · `/home` · `/auth` · application shell (sidebar, top
bar, context nav, command palette, mobile sheet) · `/practice` ·
`/problem-solver` · `/playground` · `/interview/*` · `/roadmap` · `/notes` ·
`/profile` · `/admin` · 404.

Routes, authentication, Supabase access, forms, state and SEO metadata are
unchanged in behaviour.

---

## 8. Components created

Landing: `HeroStage`, `SectionHead`, `ScrollStory`, `PathExplorer`,
`CapabilityField`, `ProofMarquee`, `LandingNav`, `LandingFooter`, `Counter`.

Shared: `ws-*` primitives in `src/index.css` (rail items, chips, window chrome,
rows, meters, grid texture, focus, overlay, scroll), plus the motion helpers in
`src/lib/motion.ts` and `src/components/motion/*`.

Removed: `WorkspacePreview`, `SessionWalkthrough` (both superseded by
`HeroStage` + `ScrollStory`), and the earlier `SpotlightCard`,
`MagneticButton`, `AnimatedCounter`, `usePointerTilt`, `QuizSection`.

---

## 9. Accessibility

- WCAG 2.2 AA target: muted text raised to ≥ 80 % opacity on all redesigned
  screens; the ember accent is used for text only above 4.5:1.
- Skip link on the landing page; landmarks (`header`, `nav`, `main`, `footer`)
  and one `h1` per route.
- Tabs in the product stage are real `role="tab"` buttons; the workspace
  preview is labelled, decorative layers are `aria-hidden`.
- The marketing marquee repeats content only for the eye and provides a
  screen-reader summary instead.
- Focus rings come from `--ring` and are visible on every interactive element;
  the command palette and sheets manage focus through Radix.
- Target sizes: 32–46 px on controls, 44 px on mobile navigation rows.
- Reduced motion honoured globally and per component; content is visible even
  when animations never run (print media query).

---

## 10. Responsive behaviour

| Breakpoint | Behaviour                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| < 640      | Single column; stage shows the document panel only; hero facts stack; nav collapses to a sheet; bento cells stack. |
| 640–1023   | Stage gains the lesson rail; bento becomes 12-column; chapter media appears inline per chapter.                    |
| 1024–1279  | Hero splits into copy + stage; application rail becomes persistent.                                                |
| ≥ 1280     | Hero “Contents” index appears; story media sticks; inspector panel available in the app shell.                     |

---

## 11. Performance

- No new dependencies. Motion uses the framer-motion build that was already
  shipped; no GSAP, no second UI kit.
- The landing page is CSS-first: all artwork is gradients, hairlines and inline
  code fragments — zero image requests.
- Only transform/opacity animate; scroll handling is a single passive listener
  writing CSS variables, so the header and stage never re-render on scroll.
- Route-level code splitting is unchanged: landing JS 57.7 kB (14.3 kB gzip),
  landing CSS 10.6 kB (2.9 kB gzip).

---

## 12. Remaining limitations

- There is no headless browser available in the build environment, so visual
  verification was done by reading the rendered DOM/CSS and against the live
  dev preview rather than by screenshot diffing.
- Authenticated routes could not be crawled from the public internet (they
  redirect to `/auth`), so the audit of those screens is source-based.
- Legacy pages (`Practice`, `Interview*`, `ProblemSolver`, contests) inherit the
  new tokens and shell but keep some older layout decisions, including ~110
  low-opacity muted labels that still fall short of AA in places.
- 14 pre-existing TypeScript errors remain in unrelated files (`Playground`,
  `NotesDashboard`, roadmap nodes, `LeetCodeEditor`, contest interview pages).
- Landing figures (`401` problems, `184` lessons, `14` tracks, `22` Java topics)
  are constants in `src/components/marketing/content.ts` and must be updated
  when the content data changes.

---

## 13. Validation

| Check                                   | Result                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run lint`                          | clean                                                                                    |
| `npx tsc -p tsconfig.app.json --noEmit` | 14 errors, all pre-existing and unrelated to this branch                                 |
| `npx vitest run`                        | 53 files passed / 2 skipped · 691 tests passed / 2 skipped                               |
| `npm run build`                         | succeeds; largest chunk `javaContent` 1.54 MB (443 kB gzip), entry 1.86 MB (573 kB gzip) |
