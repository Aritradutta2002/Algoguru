# Frontend Migration Plan: Pure Next.js 16 App Router Architecture

## 1. Architecture Overview & Guardrails
AlgoGuru is a pure **Next.js 16 App Router + React 19 + shadcn/ui** application backed by Supabase SSR (`@supabase/ssr`), Tailwind CSS v3.4 with HSL semantic CSS variables, and Vitest for unit/component testing.

### Core Guardrails
- **Server Components by Default:** All `page.tsx` and `layout.tsx` files under `src/app/` are Server Components exporting static `metadata` or async `generateMetadata()`. `"use client"` is pushed down to interactive client views (`src/features/*`) and leaf primitives (`src/components/*`).
- **Auth & Request Boundary:** `src/proxy.ts` (Next.js 16 proxy convention) refreshes Supabase auth cookies via `getUser()` and gates authenticated routes; `src/app/auth/callback/route.ts` handles PKCE code exchange; `src/lib/dal.ts` (`import "server-only"`) provides React `cache()`-deduplicated `verifySession()`, `getCurrentUserWithRole()`, and `verifyUserRole()`.
- **Single Design System:** Tailwind CSS v3.4 + HSL CSS custom properties live in `src/app/globals.css`, complemented by `src/styles/*.css` and `src/components/brand/brand.css`, with `next/font/google` (`Inter`, `Space_Grotesk`, `JetBrains_Mono`, `Source_Sans_3`) bound via `--font-sans`, `--font-display`, `--font-mono`, and `--font-reading`.
- **Bundle Splitting:** Heavy client-only libraries (`@monaco-editor/react`, `@xyflow/react` via `RoadmapEngine`/`RoadmapFullscreenRoute`, `GuruBot`, `RoadmapFullscreenOverlay`) are dynamically imported with `next/dynamic(..., { ssr: false })`, and `jspdf` is loaded dynamically inside export handlers.
- **No Legacy Vite / SPA Runtime:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/pages/*`, `react-router-dom`, and `vercel.json` have been removed. Vitest (`vitest.config.ts`) remains configured for unit and component tests using `src/test/nextNavigationMock.ts`.

---

## 2. Directory & Route Structure
*(Matches the complete route inventory in `docs/frontend-inventory.md`)*

```text
src/
├── proxy.ts                                       # Next.js 16 request proxy (Supabase session refresh + auth gate)
├── app/
│   ├── globals.css                                # Canonical Tailwind v3.4 + HSL semantic tokens
│   ├── layout.tsx                                 # Root HTML shell, next/font/google, Metadata/Viewport, theme script
│   ├── providers.tsx                              # Client providers (QueryClient, Tooltip, Settings, Motion, Mode, Auth, Toasters)
│   ├── loading.tsx                                # Global AppLoadingScreen boundary
│   ├── error.tsx                                  # Global client error boundary
│   ├── not-found.tsx                              # App Router 404 page
│   ├── auth/callback/route.ts                     # PKCE ?code= exchange Route Handler
│   ├── (auth)/                                    # Unauthenticated auth route group
│   │   ├── layout.tsx
│   │   ├── auth/page.tsx                          # /auth
│   │   └── reset-password/page.tsx                # /reset-password
│   ├── (standalone)/                              # Chrome-free fullscreen exam & roadmap routes
│   │   ├── layout.tsx
│   │   ├── contest/
│   │   │   ├── quiz/page.tsx                      # /contest/quiz
│   │   │   ├── coding/page.tsx                    # /contest/coding
│   │   │   └── coding/session/[sessionId]/page.tsx # /contest/coding/session/[sessionId]
│   │   ├── quiz/page.tsx                          # /quiz -> redirects to /contest/quiz preserving query params
│   │   ├── roadmap/
│   │   │   ├── page.tsx                           # /roadmap
│   │   │   └── [roadmapId]/page.tsx               # /roadmap/[roadmapId]
│   │   └── java-roadmap/page.tsx                  # /java-roadmap -> redirects to /roadmap/java
│   └── (workspace)/                               # Main application shell (WorkspaceShell)
│       ├── layout.tsx                             # Persistent sidebar, SpotlightNavbar, GuruBot, Obsidian dock
│       ├── page.tsx                               # / (Flagship landing + Footer)
│       ├── buy-me-a-coffee/page.tsx               # /buy-me-a-coffee
│       ├── support/page.tsx                       # /support
│       ├── playground/page.tsx                    # /playground
│       ├── practice/
│       │   ├── page.tsx                           # /practice
│       │   └── solution/[problemId]/[[...slug]]/page.tsx # /practice/solution/[problemId]/...
│       ├── problem-solver/page.tsx                # /problem-solver
│       ├── contest/
│       │   ├── page.tsx                           # /contest
│       │   └── coding/result/[sessionId]/page.tsx # /contest/coding/result/[sessionId]
│       ├── interview/
│       │   ├── page.tsx                           # /interview
│       │   └── [language]/
│       │       ├── page.tsx                       # /interview/[language]
│       │       ├── data-structure/page.tsx        # /interview/[language]/data-structure
│       │       ├── sql-structure/page.tsx         # /interview/[language]/sql-structure
│       │       ├── language-questions/
│       │       │   ├── page.tsx                   # /interview/[language]/language-questions
│       │       │   └── [questionSlug]/page.tsx    # /interview/[language]/language-questions/[questionSlug]
│       │       ├── core-java-qa/
│       │       │   ├── page.tsx                   # /interview/[language]/core-java-qa
│       │       │   └── [questionSlug]/page.tsx    # /interview/[language]/core-java-qa/[questionSlug]
│       │       ├── spring-boot/
│       │       │   ├── page.tsx                   # /interview/[language]/spring-boot
│       │       │   ├── questions/
│       │       │   │   ├── page.tsx               # /interview/[language]/spring-boot/questions
│       │       │   │   └── [questionSlug]/page.tsx # /interview/[language]/spring-boot/questions/[questionSlug]
│       │       │   ├── annotations/page.tsx       # /interview/[language]/spring-boot/annotations
│       │       │   └── practice/
│       │       │       ├── page.tsx               # /interview/[language]/spring-boot/practice
│       │       │       └── [problemId]/page.tsx   # /interview/[language]/spring-boot/practice/[problemId]
│       │       └── system-design/page.tsx         # /interview/[language]/system-design
│       ├── profile/page.tsx                       # /profile
│       ├── notes/page.tsx                         # /notes
│       ├── admin/page.tsx                         # /admin
│       └── [topicId]/page.tsx                     # /[topicId] (static params for 42 topics + notFound())
├── features/                                      # Client view modules organized by domain
│   ├── admin/
│   ├── auth/
│   ├── contest/
│   ├── interview/
│   ├── landing/
│   ├── learning/
│   ├── navigation/
│   ├── notes/
│   ├── playground/
│   ├── practice/
│   ├── profile/
│   ├── roadmap/
│   └── support/
├── components/
│   ├── ui/                                        # shadcn/ui primitives (Tailwind v3.4 + Radix UI)
│   ├── brand/                                     # AlgoGuruMark, AlgoGuruLockup, BrandLoader, brand.css
│   ├── layout/                                    # Header, nav, SpotlightNavbar, PagePrimitives, RouteFallback
│   ├── contest/, editor/, guru/, interview/, landing/, motion/, playground/, quiz/, roadmap/, workspace/
│   └── AppSidebar.tsx, Footer.tsx, UserMenu.tsx, GlobalSearch.tsx, SupportModal.tsx, GuruBot.tsx, ProtectedRoute.tsx, ...
├── contexts/                                      # AuthContext, SettingsContext, ModeContext, HomeSidebarContext
├── hooks/                                         # SSR-safe viewport, media query, progress, timer, integrity hooks
├── lib/                                           # env.ts, dal.ts, supabase/{client,server}.ts, authUrl.ts, contest, guru, playground
├── services/                                      # roadmapProgress.ts
└── test/                                          # setup.ts, nextNavigationMock.ts, unit/integration test suites
```

---

## 3. Migration Execution Status

### Phase 1: Foundation, Tooling & Design System
- [x] **1.1 Full Source Inventory & Plan Adaptation:** Audited all routes, feature areas, hooks, and tests; recorded inventory in `docs/frontend-inventory.md`.
- [x] **1.2 Initialize Next.js 16 + React 19:** Upgraded to `next@16.4.6`, `react@19.3.1`, `react-dom@19.3.1`, `@supabase/ssr@0.12.7`, `server-only`, `next-themes@0.4.6`, `@monaco-editor/react@4.7.0`. Configured `next.config.ts`, `tsconfig.json`, `next-env.d.ts`, `eslint.config.js`, `src/lib/env.ts`, and `NEXT_PUBLIC_*` variables.
- [x] **1.3 Core `shadcn/ui` Primitives:** Configured `components.json` (`rsc: true`, `src/app/globals.css`), added `"use client"` to interactive Radix primitives, hardened `sidebar.tsx` for SSR, and added `card`, `tabs`, `table`, `label`, `avatar`, `switch`, `scroll-area`, `popover`, `alert`, and `collapsible`.
- [x] **1.4 Theme & Typography:** Ported tokens verbatim to `src/app/globals.css`, wired `next/font/google` variables in `src/app/layout.tsx` and `tailwind.config.ts`, and added `src/app/providers.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx`.

### Phase 2: Auth, DAL, Proxy & Navigation Shell
- [x] **2.1 Auth, DAL & Proxy:** Created `src/lib/supabase/{client,server}.ts`, `src/lib/dal.ts`, `src/app/auth/callback/route.ts`, `src/proxy.ts`, and `src/components/ProtectedRoute.tsx`. Migrated `/auth` and `/reset-password` into `src/app/(auth)/` + `src/features/auth/`.
- [x] **2.2 Global Navigation Shell & Workspace Chrome:** Migrated `AppLayout` to `src/features/navigation/WorkspaceShell.tsx`, `src/app/(workspace)/layout.tsx`, and `src/components/layout/*` + `src/components/{AppSidebar,Footer,UserMenu,GlobalSearch,SupportModal,GuruBot,AlgoGuruLogo}.tsx`.

### Phase 3: Landing, Support, Practice & Roadmaps
- [x] **3.1 Public & Support Pages:** Migrated `/` (`src/app/(workspace)/page.tsx` + `HomeView`), `/buy-me-a-coffee`, `/support`, and `SupportModal`.
- [x] **3.2 Practice & Problem Solver:** Migrated `/practice`, `/practice/solution/[problemId]/[[...slug]]`, and `/problem-solver` with dynamic `@monaco-editor/react` and `GuruBot`.
- [x] **3.3 Interactive Roadmap Engine:** Migrated `/roadmap`, `/roadmap/[roadmapId]`, and `/java-roadmap` under `src/app/(standalone)/` with client-only dynamic `@xyflow/react` loading.

### Phase 4: Theory, Contest System, Interview Tracks, Guru, Profile, Notes & Admin
- [x] **4.1 Dynamic Topic Engine:** Migrated `/[topicId]` with `generateStaticParams()`, `generateMetadata()`, `notFound()`, and `TopicView`.
- [~] **4.2 Course & Video Player Module:** Skipped (not present in source).
- [x] **4.3 Contest System:** Migrated `/contest`, `/contest/quiz`, `/quiz` redirect, `/contest/coding`, `/contest/coding/session/[sessionId]`, and `/contest/coding/result/[sessionId]`.
- [~] **4.3b Flashcard Engine:** Skipped (not present in source).
- [x] **4.4 Multi-Language Interview Tracks:** Migrated all 15 routes under `src/app/(workspace)/interview/` and 22 domain views under `src/features/interview/`.
- [x] **4.5 Guru AI Assistant:** Migrated `GuruBot` and `src/components/guru/*` to React 19 and `publicEnv`.
- [x] **4.6 Profile, Notes & Admin:** Migrated `/profile`, `/notes` (dynamic `jspdf`), and `/admin` (`AlertDialog` confirmations).

### Phase 5: Split-Pane Coding Playground IDE
- [x] **5.1–5.3 Playground Workspace:** Migrated `/playground` and `src/features/playground/PlaygroundWorkspace.tsx` with `next/dynamic` Monaco Editor/DiffEditor, `GuruBot`, and Java formatting/diagnostics.

### Phase 6: Legacy Cutover, Hook Audit & Verification
- [x] **6.1 Legacy SPA Removal:** Removed `index.html`, `vite.config.ts`, `vercel.json`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `src/pages/`, and stale build logs.
- [x] **6.2 Hook & Service SSR Audit:** Audited `src/hooks/*`, `src/services/*`, and `src/contexts/*` for deterministic SSR initial state and React 19 types (`useViewport.ts`, `useMediaQuery.ts`, `useFullscreenExam.ts`, `useBackendInterviewProgress.ts`, `roadmapProgress.ts`).
- [ ] **6.3 Final Verification Gate:** Pending independent `@verifier` execution (`npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, and Playwright runtime verification).
