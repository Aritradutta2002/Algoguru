# Guru Identity Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Guru a recognisable mascot entry point and re-skin its panel to the site's paper/pine/lime design language.

**Architecture:** Retune the existing `--guru-*` tokens to mirror the `ag-theme` palette, then restyle the existing launcher, header, empty state, composer, and message components against those tokens. No chat behaviour changes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-27-guru-identity-refresh-design.md`

## Global Constraints

- Keep the violet mascot artwork as the single assistant accent.
- Keep every existing aria label, role, shortcut, and focus order.
- Keep touch targets at least 44 px on mobile.
- No new dependencies; no backend or prompt changes.

## Review Focus

- Compact header width: the mascot button must not crowd search or the menu toggle.
- Dark mode: paper/pine tokens must not leave unreadable muted text.
- Narrow panel (under 330 px): header and composer copy must still fit.
- Empty-state suggestion buttons: every suggestion must fill the composer without sending.
- Reduced motion: mascot loops and transitions must still collapse.

---

### Task 1: Mascot launcher in the header and mobile drawer

**Files:**
- Modify: `src/components/layout/AiCommandLauncher.tsx`
- Modify: `src/components/layout/PrimaryNavigation.tsx`
- Test: `src/components/layout/AiCommandLauncher.test.tsx`

**Interfaces:**
- Consumes: `GuruMark` from `@/components/brand/GuruMark`.
- Produces: no new exports; the button keeps `AiCommandLauncherProps` unchanged.

- [ ] **Step 1: Write the failing test**

Add to `AiCommandLauncher.test.tsx`:

```tsx
it("uses the Guru mascot instead of a generic sparkles glyph", () => {
  render(
    <TooltipProvider>
      <AiCommandLauncher open={false} onClick={() => undefined} />
    </TooltipProvider>,
  );

  const button = screen.getByRole("button", { name: /open guru ai command center/i });
  expect(button.querySelector(".lucide-sparkles")).toBeNull();
  expect(button.querySelector("svg[viewBox='0 0 64 64']")).not.toBeNull();
  expect(button).toHaveTextContent("Ask Guru");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/layout/AiCommandLauncher.test.tsx --reporter=dot`
Expected: FAIL because the sparkles glyph is still rendered.

- [ ] **Step 3: Replace the glyph**

In `AiCommandLauncher.tsx`:
- Import `GuruMark` and drop `Sparkles` / `NavIcon`.
- Render a 24 px mascot tile with a status dot and a 18 px `GuruMark`.
- Keep the `Ask Guru` label and add a `⌘J` chip when not compact.
- Use `border-guru-line`, `bg-guru-surface`, `text-guru-text`, and `bg-guru-accent/10` for the open state.
- Keep the embedded branch but swap the icon for the mascot and the label to `Guru Active`.

In `PrimaryNavigation.tsx`, replace the mobile drawer's `<NavIcon icon={Sparkles} />` with a 28 px mascot tile and remove the unused `Sparkles` import.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/layout/AiCommandLauncher.test.tsx --reporter=dot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AiCommandLauncher.tsx src/components/layout/PrimaryNavigation.tsx src/components/layout/AiCommandLauncher.test.tsx
git commit -m "feat(ui): use the Guru mascot in the header launcher"
```

---

### Task 2: Paper/pine/lime tokens and panel chrome

**Files:**
- Modify: `src/app/globals.css` (`--guru-*` light and dark blocks)
- Modify: `src/styles/guru.css`
- Modify: `src/components/guru/GuruHeader.tsx`
- Test: `src/components/guru/GuruBot.test.tsx`

**Interfaces:**
- Consumes: existing `--guru-*` Tailwind aliases.
- Produces: a `.guru-empty-stage` utility used by Task 3.

- [ ] **Step 1: Write the failing test**

Add to `GuruBot.test.tsx`:

```tsx
it("shows a live status pill in the Guru header", () => {
  renderGuru();
  expect(screen.getByRole("status")).toHaveTextContent("Ready");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "live status pill" --reporter=dot`
Expected: FAIL because no element has `role="status"`.

- [ ] **Step 3: Retune the tokens and header**

In `globals.css` set the light tokens to:

```css
--guru-bg: 58 24% 95%;
--guru-surface: 57 33% 98%;
--guru-raised: 60 30% 93%;
--guru-line: 72 16% 82%;
--guru-text: 157 31% 10%;
--guru-muted: 151 13% 33%;
--guru-accent: 152 38% 25%;
--guru-accent-2: 145 44% 32%;
--guru-success: 145 55% 30%;
--guru-danger: 0 62% 45%;
--guru-code: 157 24% 12%;
--guru-on-accent: 60 40% 97%;
```

Set the dark tokens to the existing `ag-theme` dark values:

```css
--guru-bg: 157 23% 11%;
--guru-surface: 153 21% 15%;
--guru-raised: 152 19% 19%;
--guru-line: 151 13% 25%;
--guru-text: 60 31% 94%;
--guru-muted: 81 13% 71%;
--guru-accent: 76 68% 69%;
--guru-accent-2: 145 45% 58%;
--guru-success: 145 55% 62%;
--guru-danger: 0 72% 68%;
--guru-code: 157 24% 8%;
--guru-on-accent: 157 32% 11%;
```

In `guru.css`, add:

```css
.guru-empty-stage {
  background-image: radial-gradient(hsl(var(--guru-accent) / 0.18) 1px, transparent 1px);
  background-size: 10px 10px;
  mask-image: radial-gradient(circle, black 35%, transparent 72%);
}
```

In `GuruHeader.tsx`:
- Raise the header to `px-4 py-3`.
- Use a 36 px mascot, display-face `GuruBot` title, and a lime-tinted `AI` tag.
- Wrap the status line in `<p role="status" aria-live="polite">`.
- Keep every action label and tooltip unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "live status pill" --reporter=dot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/styles/guru.css src/components/guru/GuruHeader.tsx src/components/guru/GuruBot.test.tsx
git commit -m "feat(ui): retune Guru surfaces to the paper and pine palette"
```

---

### Task 3: Empty state and composer

**Files:**
- Modify: `src/components/guru/GuruEmptyState.tsx`
- Modify: `src/components/guru/GuruComposer.tsx`
- Test: `src/components/guru/GuruBot.test.tsx`

**Interfaces:**
- Consumes: `.guru-empty-stage` from Task 2.
- Produces: no new exports; the existing `GuruEmptyStateProps` and `GuruComposerProps` stay unchanged.

- [ ] **Step 1: Write the failing test**

Add to `GuruBot.test.tsx`:

```tsx
it("labels the empty-state suggestions and the composer hint", () => {
  renderGuru();
  expect(screen.getByText("Try asking")).toBeInTheDocument();
  expect(screen.getByText(/AI study partner/i)).toBeInTheDocument();
  expect(screen.getByLabelText("Message Guru")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "labels the empty-state" --reporter=dot`
Expected: FAIL because neither label exists.

- [ ] **Step 3: Rebuild the empty state and composer chrome**

In `GuruEmptyState.tsx`:
- Put the 72 px avatar on a `.guru-empty-stage` layer with a lime glow.
- Add a small `AI study partner` eyebrow with a lime dot.
- Add a left-aligned `Try asking` label above the suggestion cards.
- Keep the heading, coaching copy, suggestion text, and accuracy note.
- Restyle cards with `bg-guru-surface`, `border-guru-line`, and a pine icon tile.

In `GuruComposer.tsx`:
- Make the input card `rounded-2xl border-guru-line bg-guru-surface` with a soft shadow.
- On focus use `border-guru-accent/55` and a 1 px lime ring.
- Make the send button pine (`bg-guru-accent text-guru-on-accent`) and keep the stop state red.
- Keep the attach-context chip, token count, command menu, and every keyboard path unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "labels the empty-state" --reporter=dot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/guru/GuruEmptyState.tsx src/components/guru/GuruComposer.tsx src/components/guru/GuruBot.test.tsx
git commit -m "feat(ui): redesign the Guru empty state and composer"
```

---

### Task 4: Message bubbles and verification

**Files:**
- Modify: `src/components/guru/GuruMessage.tsx`
- Test: `src/components/guru/GuruBot.test.tsx`
- Verify: full suite, lint, typecheck, build, Chromium.

**Interfaces:**
- Consumes: the retuned `--guru-*` tokens from Task 2.
- Produces: no new exports; `GuruMessageProps` is unchanged.

- [ ] **Step 1: Write the failing test**

Add to `GuruBot.test.tsx`:

```tsx
it("keeps the user message readable on the pine bubble", () => {
  const now = Date.now();
  localStorage.setItem(
    "guru-chat-history:guest:global",
    JSON.stringify([
      {
        id: "styled-chat",
        title: "Styled chat",
        messages: [{ id: "u1", role: "user", content: "Explain two pointers", createdAt: now }],
        model: "openrouter",
        date: now,
        pinned: false,
      },
    ]),
  );

  renderGuru();
  const bubble = screen.getByText("Explain two pointers");
  expect(bubble.className).toContain("bg-guru-accent");
  expect(bubble.className).toContain("text-guru-on-accent");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "pine bubble" --reporter=dot`
Expected: FAIL because the user bubble still uses `bg-guru-raised`.

- [ ] **Step 3: Restyle the messages**

In `GuruMessage.tsx`:
- User bubble: `rounded-2xl rounded-br-md border border-guru-accent bg-guru-accent px-3.5 py-2.5 text-guru-on-accent`.
- Assistant bubble: `rounded-xl rounded-tl-sm border-guru-line bg-guru-surface shadow-[0_1px_0_hsl(var(--guru-text)/0.03)]`.
- Keep the edit box, error card, reasoning disclosure, ratings, and all labels unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/guru/GuruBot.test.tsx -t "pine bubble" --reporter=dot`
Expected: PASS.

- [ ] **Step 5: Run the full verification**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 6: Verify in Chromium**

At 1440×900 and 390×844, in light and dark mode:
- The header shows the mascot and `Ask Guru`.
- The panel opens, the empty state and composer render, and no console errors appear.
- Suggestion buttons fill the composer without sending.
- The mobile drawer shows the mascot.

- [ ] **Step 7: Commit**

```bash
git add src/components/guru/GuruMessage.tsx src/components/guru/GuruBot.test.tsx docs/superpowers/specs/2026-11-27-guru-identity-refresh-design.md docs/superpowers/plans/2026-11-27-guru-identity-refresh.md
git commit -m "feat(ui): refresh Guru message styling and document the redesign"
```
