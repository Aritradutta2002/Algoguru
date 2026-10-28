# AlgoGuru Top Navigation & Workspace Experience — Production Design Specification

**Role:** Senior Staff Product Designer (ex-Linear, Stripe, Notion, Vercel)  
**Target:** Enterprise Developer Workspace (Score: 10/10 Linear, Stripe, Notion, Vercel benchmark)  
**Date:** March 2026  
**Status:** Implemented & Production-Ready  

---

## 1. Executive Summary & Design Philosophy

AlgoGuru is a developer-first platform for algorithmic problem solving, system design architecture, and engineering interview mastery. Developers and interview candidates live in high-focus, high-cognitive-load states. The navigation must never compete for attention with the code, diagram, or problem context.

Drawing from the world-class design systems of **Linear**, **Stripe**, **Notion**, and **Vercel**, this redesign transforms AlgoGuru's top navigation into a premium, unified developer workspace shell:

1. **Linear Precision:** 
   - Micro-borders (`hsl(var(--border) / 0.6)`), floating pill active states with physics-based spring dampening, and high-contrast typography.
   - Elimination of visual clutter: removed redundant zoom clusters and cramped button groups.

2. **Stripe Trust & Polish:** 
   - Strict 8-point spatial rhythm (`72px` header height, `40px` action targets, `8px`/`16px`/`24px` padding scales).
   - Glassmorphic backdrop blur (`blur(20px) saturate(180%)`) with interior light edge reflections (`box-shadow: 0 1px 0 inset`).

3. **Notion Contextual Flexibility:** 
   - Multi-tenant **Workspace Switcher** (`AlgoGuru ▼`) ready for **Personal**, **Team**, and **Enterprise** workspaces with plan indicators, member badges, and fast switcher dropdowns.

4. **Vercel Developer Ergonomics & AI Centricity:** 
   - **Command Palette First-Class Citizen:** Command search input with `"Search problems, topics, roadmaps, AI..."` placeholder and `⌘K` keyboard badge.
   - **Guru AI Command Center:** Embedded live status beacon, gradient pill treatment, and `⌘J` shortcut directly in the navigation.

---

## 2. Information Architecture (IA) Model

### 2.1 Navigation Classification

To eliminate the cognitive fatigue of giving every navigation item identical visual weight, navigation is categorized into three distinct hierarchical tiers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ALGOGURU WORKSPACE                                     │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Tier 1: Platform Context │ Tier 2: Core Engineering    │ Tier 3: Command & Utilities   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ • AlgoGuru Brand         │ • Practice (Core Daily)     │ • Search Palette (⌘K)         │
│ • Workspace Selector     │ • Interview Hub (SysDesign) │ • Guru AI Command Center (⌘J) │
│   - Personal (Free/Pro)  │ • Playground (Live IDE)     │ • Notification Center         │
│   - Team (12 Seats)      │ • Roadmap (Career Tracks)   │ • Theme Toggle                │
│   - Enterprise (SSO)     │ • Contest (Live Compete)    │ • User Profile / Settings     │
│                          │ • Home (Dashboard)          │                               │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 2.2 Navigation Tree

```
Top Navbar (72px)
├── [Left Zone: Context & Tenancy]
│   ├── Collapsed Sidebar Expander (Contextual Alt+B)
│   └── Workspace Switcher (`AlgoGuru ▼`)
│       ├── Workspaces List: Personal (Active) | Team | Enterprise
│       └── Management: Create Workspace | Workspace Settings
├── [Center-Left Zone: Primary Navigation]
│   └── Segmented Pill Group (6 Core Destinations)
│       ├── Home (/)
│       ├── Practice (/practice) [High Priority]
│       ├── Interview (/interview) [High Priority]
│       ├── Roadmap (/roadmap)
│       ├── Playground (/playground)
│       └── Contest (/contest) [Live Beacon]
├── [Center-Right Zone: First-Class Search]
│   └── Command Palette Launcher
│       ├── Icon: AlgoGuru SearchMark
│       ├── Placeholder: "Search problems, topics, roadmaps, AI..."
│       └── Shortcut: ⌘K / Ctrl+K
└── [Right Zone: Utilities & AI Actions]
    ├── Guru AI Command Center (Sparkles / Avatar + "Guru AI" + ⌘J + Status Dot)
    ├── Subtle Hairline Divider (h-5 w-px)
    ├── Notification Center (Bell + Live Unread Dot + Dropdown Tabs)
    ├── Theme Toggle (Sun/Moon Smooth Vector Transform)
    └── User Menu (Avatar / Initials + Dropdown Settings)
```

---

## 3. Detailed UX Decisions

### Decision 1: 72px Glassmorphism Header
- **Rationale:** The previous 64px header felt compressed when housing command palette inputs and multi-tenant workspace indicators. 72px is a precise multiple of 8px (9 × 8px) providing optimal optical breathing room (16px vertical margins for 40px interactive controls).
- **Surface Treatment:** `backdrop-filter: blur(20px) saturate(180%)` with `bg-card/85` and a hairline bottom border (`border-b border-border/60`). On page scroll, opacity increases to `95%` with an elevated elevation shadow.

### Decision 2: Premium Floating Pill Active State (Eliminating Underline)
- **Rationale:** Simple underline borders feel like 2012 web design and suffer from pixel jitter during container resizes.
- **Solution:** A floating pill segment (`motion.span layoutId="primary-nav-pill"`) rendered behind the active route link with spring physics (`stiffness: 420, damping: 34`). In light mode, it uses `bg-background/95 border border-border/80 shadow-xs`; in dark mode, it uses `bg-card/90` with crisp text contrast.

### Decision 3: Multi-Tenant Workspace Selector (`AlgoGuru ▼`)
- **Rationale:** Modern developers switch between individual study ("Personal"), company engineering cohorts ("Team"), and organization-wide enterprise portals ("Enterprise").
- **Solution:** Replaced static brand lockup with an interactive Workspace Switcher. The trigger displays the AlgoGuru gradient mark, "AlgoGuru" wordmark, active workspace name, and `ChevronDown` (▼). The dropdown features instant switching, plan badges ("Pro Member", "12 seats", "SSO"), and localStorage persistence.

### Decision 4: Search as a First-Class Citizen
- **Rationale:** Search was formerly buried as an icon button on small screens and squeezed on desktop.
- **Solution:** Command palette style launcher integrated directly into the top row across Desktop, Tablet, and Mobile. Displays the exact placeholder `"Search problems, topics, roadmaps, AI..."` with elevated `⌘K` badge.

### Decision 5: Dedicated AI Command Center
- **Rationale:** AI is no longer a peripheral novelty; for an interview and coding platform, Guru AI is the primary intelligent partner.
- **Solution:** Elevated Guru AI from a corner button into an AI Command Center trigger with an iridescent gradient ring, live status beacon ("Ready"), text label, and `⌘J` shortcut badge.

### Decision 6: Simplified Right Section & Visual Decluttering
- **Rationale:** Zoom in/out buttons in the navbar added visual noise and broke enterprise design standards (Linear, Stripe, and Vercel never place zoom toggles in headers).
- **Solution:** Streamlined the right utility rail into **Notifications**, **Theme toggle**, and **Profile menu**.

---

## 4. Exact Component Layout & Responsive Architecture

### 4.1 Desktop Viewport (≥ 1024px)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [AlgoGuru ▼]      [ Home  Practice  Interview  Roadmap  Playground  Contest ]     [ Search problems, topics, AI... ⌘K ]  [Guru AI ⌘J] | [🔔] [☀️] [👤] │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Order:** `Logo / Workspace | Navigation | Search | Actions`
- **Spacing:** `gap-4`, `px-6` or `px-8`, `h-[72px]`.
- **Search Width:** Flexible command input (`w-64 xl:w-80`).

### 4.2 Tablet Viewport (768px – 1023px)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [AlgoGuru ▼]                      [ Search problems, topics, roadmaps, AI... ⌘K ]                               [ ☰ ]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Order:** `Logo / Workspace | Search | Menu`
- **Strict Requirement 8 Compliance:** Cluttering desktop utility buttons (Guru AI, Notifications, Theme, Profile) are removed from the tablet header bar and elevated into the Tablet Menu sheet.
- **Search:** Flexible command input (`w-full max-w-sm sm:max-w-md`).
- **Menu Trigger:** Accessible hamburger toggle with `id="header-navigation-toggle"` opening the tablet navigation & utilities sheet.

### 4.3 Mobile Viewport (< 768px)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [AlgoGuru ▼]                               [ Search... ⌘K ]                                             [ ☰ ]          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Order:** `Logo / Workspace (Compact) | Search | Drawer`
- **Strict Requirement 8 Compliance:** Eliminates all horizontal scroll risks on small screens (360px–414px) by dedicating the 72px bar solely to Logo, Search, and Drawer trigger.
- **Drawer:** Slide-in drawer with complete workspace tenancy, Guru AI interactive card, primary routes, learning library, and quick actions.

---

## 5. Tailwind CSS Utility Specifications

### 5.1 Navbar Shell
```html
<header class="sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-5 lg:px-6 bg-card/85 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_0_hsl(var(--card)/0.8)_inset,0_4px_20px_-16px_hsl(var(--foreground)/0.12)] transition-all duration-200">
```

### 5.2 Workspace Switcher Trigger
```html
<button class="group relative flex items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none transition-all duration-200 hover:bg-muted/60 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/60">
  <!-- Gradient Mark -->
  <div class="h-8 w-8 rounded-lg shadow-sm shadow-primary/20 transition-transform group-hover:scale-105">...</div>
  <!-- Lockup Text -->
  <div class="flex flex-col">
    <span class="font-display text-[15px] font-bold tracking-tight text-foreground">Algo<span class="text-primary">Guru</span></span>
    <span class="text-[10.5px] font-medium text-muted-foreground/80">Personal</span>
  </div>
  <!-- Chevron -->
  <svg class="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180">...</svg>
</button>
```

### 5.3 Primary Navigation Pill Container & Active Item
```html
<nav class="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
  <!-- Active Link -->
  <a class="relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[13px] font-semibold text-foreground">
    <!-- Floating Pill Indicator -->
    <span class="absolute inset-0 rounded-lg bg-background/95 border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:bg-card/90"></span>
    <span class="relative z-10">Practice</span>
  </a>
  <!-- Idle Link -->
  <a class="relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 transition-colors">
    <span class="relative z-10">Interview</span>
  </a>
</nav>
```

### 5.4 Command Palette Search Trigger
```html
<button class="group relative flex h-10 w-full items-center gap-2.5 overflow-hidden rounded-xl border border-border/60 bg-muted/40 px-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-muted/70 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)] active:scale-[0.98]">
  <svg class="h-4 w-4 text-muted-foreground/80 transition-transform group-hover:scale-110">...</svg>
  <span class="min-w-0 flex-1 truncate text-[13px] text-muted-foreground/75 group-hover:text-foreground">Search problems, topics, roadmaps, AI...</span>
  <kbd class="flex shrink-0 items-center gap-0.5 rounded-md border border-border/70 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground/70">⌘K</kbd>
</button>
```

### 5.5 Guru AI Command Center Trigger
```html
<button class="group relative flex h-10 items-center gap-2 rounded-xl px-3 border border-primary/25 bg-primary/[0.04] text-foreground hover:border-primary/40 hover:bg-primary/[0.09] hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)] active:scale-95 transition-all">
  <div class="relative flex items-center justify-center">
    <div class="h-5 w-5 rounded-full">...</div>
    <span class="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-card"></span>
  </div>
  <span class="text-xs font-semibold tracking-tight">Guru AI</span>
  <kbd class="hidden lg:inline-flex rounded border border-primary/20 bg-background/80 px-1 py-0.5 font-mono text-[9.5px] font-semibold text-primary/80">⌘J</kbd>
</button>
```

---

## 6. Motion & Animation Recommendations

### 6.1 Pill Transition Physics (Framer Motion)
```tsx
<motion.span
  layoutId="primary-nav-pill"
  transition={{
    type: "spring",
    stiffness: 420,
    damping: 34,
    mass: 0.8,
  }}
/>
```
- **Rationale:** Spring curves emulate physical mass. 420 stiffness and 34 damping avoids bouncy cartooniness while preserving responsiveness.

### 6.2 Sheet & Menu Flyouts
```tsx
transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
```
- **Rationale:** Linear/Apple standard exponential decel curve (`cubic-bezier(0.16, 1, 0.3, 1)`).

### 6.3 Accessibility / Reduced Motion
- When `useReducedMotion()` is active or `prefers-reduced-motion: reduce`, animations default to immediate opacity fades without spatial translations.

---

## 7. Production Code Deliverables Summary

The following production components have been created and integrated into the repository:

1. **`src/components/layout/WorkspaceSwitcher.tsx`**:
   - Multi-tenant workspace selector supporting Personal, Team, and Enterprise workspaces.
   - Plan tier metadata, member counters, role labels, and persistent local storage.
2. **`src/components/layout/NotificationCenter.tsx`**:
   - Enterprise notification popover with unread indicator badge, tab filters (All / Unread), and real-time read status updates.
3. **`src/components/layout/ThemeToggle.tsx`**:
   - Clean 8px-aligned light/dark mode vector toggle with rotation transition.
4. **`src/components/layout/AiCommandLauncher.tsx`**:
   - First-class AI Command Center entry point in the navbar with `⌘J` shortcut and live engine status indicator.
5. **`src/components/layout/GlobalSearchLauncher.tsx`**:
   - Command palette style search launcher with `"Search problems, topics, roadmaps, AI..."` placeholder and `⌘K` keyboard badge.
6. **`src/components/layout/PrimaryNavigation.tsx`**:
   - Updated with floating premium pill active state, live indicators for active contests, and elevated mobile navigation drawer.
7. **`src/App.tsx`**:
   - Refactored header into 72px enterprise layout supporting Desktop, Tablet, and Mobile responsive states.
8. **`src/index.css`**:
   - 72px height, 20px blur glassmorphic elevation, and removal of underline indicator.
9. **Full Unit Test Suite**:
   - `PrimaryNavigation.test.tsx`, `WorkspaceSwitcher.test.tsx`, `NotificationCenter.test.tsx`, `ThemeToggle.test.tsx`, `AiCommandLauncher.test.tsx`.
