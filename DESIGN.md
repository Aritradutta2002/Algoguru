# Algoguru Design System (DESIGN.md)

## 1. Design Philosophy
Algoguru is a tier-1 technical workspace built for engineers mastering algorithms, JVM internals, and FAANG system architecture.
The UI adheres to the **"Rule of One"** for kinetic motion:
- **One active visceral anchor** above the fold: The Hero Workspace IDE with its clean laser border beam.
- **Quiet obsidian surfaces** at rest: Dark, restrained, high-contrast surfaces. No ambient carnival noise.
- **Tactile interaction states**: Micro-bounce on clicks, ambient cursor spotlight across grids, and 1px masked conic rim illumination strictly on `:hover` and `:focus-visible`.

---

## 2. Color System & Tokens

### Light Mode (`:root`)
```css
--card-bg: hsl(0 0% 100% / 0.85);
--card-border: hsl(var(--border) / 0.8);
--card-hover-border: hsl(var(--primary) / 0.4);
--card-hover-ring: rgba(37, 99, 235, 0.12);
--spotlight-color: rgba(37, 99, 235, 0.06);
--laser-from: #2563eb;
--laser-to: #06b6d4;
```

### Dark Mode (`.dark`)
```css
--card-bg: hsl(224 71% 4% / 0.75);
--card-border: hsl(var(--border) / 0.6);
--card-hover-border: hsl(var(--primary) / 0.5);
--card-hover-ring: rgba(59, 130, 246, 0.25);
--spotlight-color: rgba(59, 130, 246, 0.12);
--laser-from: #3b82f6;
--laser-to: #67e8f9;
```

---

## 3. Typography Scale
- **Display Headlines**: `font-display` (tight negative tracking `-0.04em`, font-weight 700/800).
- **Code & Runtime Badges**: `font-mono` (`JetBrains Mono` / `Geist Mono`) with `tabular-nums`.
- **Body & Explanatory**: `font-sans` (`text-[15px] sm:text-[16px] leading-[1.65] text-muted-foreground`).

---

## 4. Component Interaction Standards
1. **Primary Button (`CandyButton`)**:
   - Electric blue radial gradient (`#005FD6` to `#209BFF`).
   - 1px specular top highlight line (`after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent`).
   - Active depression physics: `active:scale-[0.98]`.
   - Minimum touch target: 44px (`px-7 py-3.5`).
2. **Secondary Button (`InteractiveHoverButton` / Ghost)**:
   - Quiet, translucent dark card background with high-contrast text and subtle arrow reveal. Zero competing specular glow.
3. **Laser Orbit (`BorderBeam`)**:
   - 4-second introductory orbit lap on mount, settling into a calm accent rim.
   - Degrades to static 1px border when `prefers-reduced-motion` is active.
4. **Morphing Headline (`MorphText`)**:
   - Encased in a single-cell CSS Grid container (`inline-grid grid-cols-1 grid-rows-1`) to eliminate Cumulative Layout Shift (CLS).
   - Default rendered word: `"Interview ready."` (guarantees semantic test compliance and screen-reader accessibility).
5. **Section Jump Rail (`SpotlightNavbar`)**:
   - Desktop: Floating pill with cursor-following spotlight and spring active indicator.
   - Mobile (<768px): Collapses to compact floating pill or is hidden to prevent header collisions.
6. **Candidate Progression Bento Grid**:
   - 4 progressive phases: Deconstruct -> Implement -> Scale -> Retain.
