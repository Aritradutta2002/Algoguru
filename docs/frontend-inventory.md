# AlgoGuru Frontend Inventory (Next.js 16 App Router)

This document catalogs the completed Next.js 16 App Router + React 19 + `shadcn/ui` frontend structure in `E:\Algoguru`.

## 1. Platform & Tooling Stack
- **Framework:** Next.js `16.4.6` App Router (`src/app/`, `src/proxy.ts`)
- **UI Runtime:** React `19.3.1`, React DOM `19.3.1`
- **Styling:** Tailwind CSS `3.4.17` with HSL semantic CSS variables (`src/app/globals.css`, `src/styles/*.css`, `src/components/brand/brand.css`) and `shadcn/ui` (`components.json` with `rsc: true`)
- **Fonts:** `next/font/google` (`Inter`, `Space_Grotesk`, `JetBrains_Mono`, `Source_Sans_3`) bound to `--font-sans`, `--font-display`, `--font-mono`, `--font-reading`
- **Auth & Persistence:** `@supabase/ssr@0.12.7` cookie-backed browser/server clients (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`), React `cache()` DAL (`src/lib/dal.ts`), and Next.js 16 request proxy (`src/proxy.ts`)
- **Tests:** Vitest `3.2.4` (`vitest.config.ts`) + `@testing-library/react@16.3.3` + `src/test/nextNavigationMock.ts`

## 2. App Router Route Inventory

### Root & System Files (`src/app/`)
| File | Kind | Purpose |
| --- | --- | --- |
| `src/proxy.ts` | Request Proxy | Refreshes Supabase cookies via `getUser()`, redirects signed-in users away from `/auth`, and redirects unauthenticated requests on protected routes to `/auth?redirect=...` |
| `src/app/layout.tsx` | Server Layout | Loads Google fonts, exports `metadata` and `viewport`, injects pre-paint theme script, wraps `{children}` in `<Providers>` |
| `src/app/providers.tsx` | Client Providers | `QueryClientProvider`, `TooltipProvider`, `SettingsProvider`, `MotionConfig`, `ModeProvider`, `AuthProvider`, `Toaster`, `Sonner` |
| `src/app/loading.tsx` | Loading UI | Renders `AppLoadingScreen` |
| `src/app/error.tsx` | Client Boundary | Error recovery UI using `Card` and `Button` |
| `src/app/not-found.tsx` | Client 404 | 404 route display with `next/link` and `Button` |
| `src/app/auth/callback/route.ts` | Route Handler | Exchanges PKCE `?code=...` via `exchangeCodeForSession` and validates `next`/`redirect` with `sanitizeRedirectPath` |

### Auth Route Group (`src/app/(auth)/`)
| Route | Page File | Feature View | Notes |
| --- | --- | --- | --- |
| `/auth` | `src/app/(auth)/auth/page.tsx` | `src/features/auth/AuthView.tsx` | Public; wrapped in `<Suspense>` for `?redirect=` |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | `src/features/auth/ResetPasswordView.tsx` | Public recovery flow |

### Standalone Route Group (`src/app/(standalone)/`)
| Route | Page File | Feature View / Redirect | Notes |
| --- | --- | --- | --- |
| `/contest/quiz` | `src/app/(standalone)/contest/quiz/page.tsx` | `src/features/contest/QuizView.tsx` | Wrapped in `<Suspense>` |
| `/contest/coding` | `src/app/(standalone)/contest/coding/page.tsx` | `src/features/contest/CodingContestInstructionsView.tsx` | Wrapped in `<Suspense>` |
| `/contest/coding/session/[sessionId]` | `src/app/(standalone)/contest/coding/session/[sessionId]/page.tsx` | `src/features/contest/CodingContestSessionView.tsx` | Async `params`, `generateMetadata()` |
| `/quiz` | `src/app/(standalone)/quiz/page.tsx` | Server `redirect()` | Preserves query params to `/contest/quiz` |
| `/roadmap` | `src/app/(standalone)/roadmap/page.tsx` | `src/features/roadmap/RoadmapRouteView.tsx` | Dynamic XYFlow graph (`ssr: false`) |
| `/roadmap/[roadmapId]` | `src/app/(standalone)/roadmap/[roadmapId]/page.tsx` | `src/features/roadmap/RoadmapRouteView.tsx` | Async `params`, `generateMetadata()` |
| `/java-roadmap` | `src/app/(standalone)/java-roadmap/page.tsx` | Server `redirect("/roadmap/java")` | Legacy roadmap alias |

### Workspace Route Group (`src/app/(workspace)/`)
| Route | Page File | Feature View | Notes |
| --- | --- | --- | --- |
| `/` | `src/app/(workspace)/page.tsx` | `src/features/landing/HomeView.tsx` | Root landing page inside `WorkspaceShell` |
| `/buy-me-a-coffee` | `src/app/(workspace)/buy-me-a-coffee/page.tsx` | `src/features/support/BuyMeACoffeeView.tsx` | Support page |
| `/support` | `src/app/(workspace)/support/page.tsx` | `src/features/support/BuyMeACoffeeView.tsx` | Support alias |
| `/playground` | `src/app/(workspace)/playground/page.tsx` | `src/features/playground/PlaygroundWorkspace.tsx` | Wrapped in `<Suspense>`, dynamic Monaco |
| `/practice` | `src/app/(workspace)/practice/page.tsx` | `src/features/practice/PracticeView.tsx` | DSA sheet index |
| `/practice/solution/[problemId]/[[...slug]]` | `src/app/(workspace)/practice/solution/[problemId]/[[...slug]]/page.tsx` | `src/features/practice/PracticeSolutionView.tsx` | Async `params`, `generateMetadata()` |
| `/problem-solver` | `src/app/(workspace)/problem-solver/page.tsx` | `src/features/practice/ProblemSolverView.tsx` | Daily challenge IDE, dynamic Monaco |
| `/contest` | `src/app/(workspace)/contest/page.tsx` | `src/features/contest/ContestLandingView.tsx` | Contest hub |
| `/contest/coding/result/[sessionId]` | `src/app/(workspace)/contest/coding/result/[sessionId]/page.tsx` | `src/features/contest/CodingContestResultView.tsx` | Async `params`, `generateMetadata()` |
| `/interview` | `src/app/(workspace)/interview/page.tsx` | `src/features/interview/InterviewHubView.tsx` | Interview tracks overview |
| `/interview/[language]` | `src/app/(workspace)/interview/[language]/page.tsx` | Language hub dispatch (`java`, `cpp`, `python`) | Validates language, `generateMetadata()` |
| `/interview/[language]/data-structure` | `src/app/(workspace)/interview/[language]/data-structure/page.tsx` | `InterviewDataStructureView` | Language-scoped DSA track |
| `/interview/[language]/sql-structure` | `src/app/(workspace)/interview/[language]/sql-structure/page.tsx` | `InterviewSqlStructureView` | Language-scoped SQL track |
| `/interview/[language]/language-questions` | `src/app/(workspace)/interview/[language]/language-questions/page.tsx` | `InterviewLanguageQuestionsView` | Wrapped in `<Suspense>` |
| `/interview/[language]/language-questions/[questionSlug]` | `src/app/(workspace)/interview/[language]/language-questions/[questionSlug]/page.tsx` | `InterviewLanguageQuestionDetailView` | Async `params`, `generateMetadata()` |
| `/interview/[language]/core-java-qa` | `src/app/(workspace)/interview/[language]/core-java-qa/page.tsx` | `InterviewCoreJavaQuestionsView` | Wrapped in `<Suspense>` |
| `/interview/[language]/core-java-qa/[questionSlug]` | `src/app/(workspace)/interview/[language]/core-java-qa/[questionSlug]/page.tsx` | `InterviewCoreJavaQuestionDetailView` | Async `params`, `generateMetadata()` |
| `/interview/[language]/spring-boot` | `src/app/(workspace)/interview/[language]/spring-boot/page.tsx` | `BackendInterviewHubView` | Spring Boot hub |
| `/interview/[language]/spring-boot/questions` | `src/app/(workspace)/interview/[language]/spring-boot/questions/page.tsx` | `BackendQuestionsView` | Wrapped in `<Suspense>` |
| `/interview/[language]/spring-boot/questions/[questionSlug]` | `src/app/(workspace)/interview/[language]/spring-boot/questions/[questionSlug]/page.tsx` | `BackendQuestionDetailView` | Async `params`, `generateMetadata()` |
| `/interview/[language]/spring-boot/annotations` | `src/app/(workspace)/interview/[language]/spring-boot/annotations/page.tsx` | `BackendAnnotationsView` | Annotation reference |
| `/interview/[language]/spring-boot/practice` | `src/app/(workspace)/interview/[language]/spring-boot/practice/page.tsx` | `BackendPracticeView` | Spring Boot practice lab |
| `/interview/[language]/spring-boot/practice/[problemId]` | `src/app/(workspace)/interview/[language]/spring-boot/practice/[problemId]/page.tsx` | `BackendPracticeDetailView` | Async `params`, `generateMetadata()` |
| `/interview/[language]/system-design` | `src/app/(workspace)/interview/[language]/system-design/page.tsx` | `InterviewSystemDesignView` | System design guide |
| `/profile` | `src/app/(workspace)/profile/page.tsx` | `src/features/profile/ProfileView.tsx` | Account, activity heatmap, stats |
| `/notes` | `src/app/(workspace)/notes/page.tsx` | `src/features/notes/NotesDashboardView.tsx` | Notes management + dynamic `jspdf` export |
| `/admin` | `src/app/(workspace)/admin/page.tsx` | `src/features/admin/AdminView.tsx` | `force-dynamic`, DAL + client admin checks |
| `/[topicId]` | `src/app/(workspace)/[topicId]/page.tsx` | `src/features/learning/TopicView.tsx` | `generateStaticParams()` (42 topics), `notFound()` fallback |

## 3. UI Primitives (`src/components/ui/`)
35 primitives: `accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `progress`, `progress-ring`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`, `use-toast`.
