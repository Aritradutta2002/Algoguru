# AlgoGuru Enterprise Frontend & UI Refactoring Guardrails

## 1. STRICT NON-REGRESSION RULES (ZERO BUSINESS LOGIC CHANGES)
- **DO NOT** modify business logic, data fetching (`fetch`, `axios`, React Query, SWR, Server Actions), authentication flows, database schemas, or route paths.
- **DO NOT** rename, remove, or alter existing component Props interfaces, Context providers, Redux/Zustand stores, or custom hooks.
- **DO NOT** delete existing `data-testid`, `id`, `name`, or `aria-*` attributes required by forms and automated tests.
- Only refactor the **presentational JSX structure, Tailwind CSS styling, layout primitives, and Framer Motion transitions**.
- Presentation-only React state and event handlers are allowed for workspace UI interactions such as open, minimize, maximize, and close, but must not alter business state, API behavior, routing, authentication, persistence, or existing TypeScript contracts.

## 2. DESIGN SYSTEM & COMPONENT STACK (OBSIDIAN + VENGEANCE UI)
- **Surface Hierarchy (Obsidian Dark Theme):**
  - App Void Background: `#070709`
  - Primary Workspace Pane: `#0c0c10`
  - Elevated Surface / Header / Modal: `#111117`
  - Glass Border: `border-white/[0.08]` with top specular highlight `shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]`
  - Primary Accent: Violet (`violet-500` / `#8b5cf6`) and Emerald (`emerald-500` / `#10b981`) for execution success.
- **Approved Component Registries:**
  - Base accessible primitives: `shadcn/ui` (Radix UI / Base UI)
  - Interactive Hero & Navigation: `@vengeanceui` (`spotlight-navbar`, `glass-dock`, `folder-preview`, `generate-button`)
  - Workspace & Micro-interactions: `framer-motion` (`motion`), `lucide-react`, `react-resizable-panels`, `cmdk`
- Verify that each approved package and component exists in the repository or dependency manifest before importing it. If unavailable, use an existing accessible primitive or a local equivalent rather than inventing an incompatible import.

## 3. PERFORMANCE & ENTERPRISE ENGINEERING CONSTRAINTS
- **Zero React Re-Renders on Pointer Events:** NEVER use `useState` for cursor tracking, hover coordinates, or scroll progress. Always use Framer Motion `useMotionValue` and `useMotionTemplate` or pure CSS variables.
- **GPU-Composited Animations Only:** Only animate `transform` (`x`, `y`, `scale`, `rotate`) and `opacity`. Avoid animating `width`, `height`, `top`, or `left` unless using Framer Motion `layout` projection with `overflow-hidden`.
- **No Heavy Shaders in IDE/Editor Routes:** Never import Three.js, React Three Fiber, or continuous canvas particle loops inside code editor or algorithm visualizer routes.
- **Accessibility:** Always wrap animated views in `<MotionConfig reducedMotion="user">`, preserve full keyboard navigation (`Tab`, `Escape`, `Enter`), keep focus visible, manage focus when dialogs or windows open and close, and provide appropriate labels and live status for state changes.
- **Responsive behavior:** The workspace, navigation, and dock must remain usable across supported viewport sizes without hiding required controls or introducing horizontal overflow.
- **Contrast and fallback:** Text, controls, focus indicators, and status colors must remain legible against every approved surface. Reduced-motion mode must preserve the same functionality without relying on animation.

## 4. INCREMENTAL REFACTORING WORKFLOW
- Establish a clean baseline before editing each component or page, including its current route behavior and relevant automated test selectors.
- Make one focused presentational change at a time; keep diffs reviewable and do not mix unrelated cleanup with UI refactoring.
- Preserve existing loading, error, empty, authenticated, and unauthenticated states while changing their presentation.
- Run the verification gate after every component or page edit. Run the broader UI smoke gate after each related batch and before merging.

## 5. VERIFICATION GATE (MANDATORY AFTER EVERY COMPONENT OR PAGE EDIT)
After editing any component or page, you MUST run:
1. `npx tsc --noEmit` (Verify zero TypeScript errors)
2. `npm run lint` (Verify zero ESLint/React Hook warnings)
If any error occurs, fix it immediately before moving to the next file.

After each related batch, also verify:
1. Keyboard navigation, focus visibility, Escape handling, and reduced-motion behavior.
2. Responsive layouts at supported viewport sizes with no required control hidden or clipped.
3. Visual consistency of surfaces, borders, accents, transitions, loading states, and error states.
4. Existing route smoke behavior, form selectors, and automated tests.
