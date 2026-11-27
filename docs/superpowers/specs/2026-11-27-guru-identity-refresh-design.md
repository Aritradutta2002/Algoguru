# Guru identity refresh — design

## Intent

Guru is the product's AI tutor, but its entry point is a generic sparkles glyph and
its panel is a plain porcelain chat that no longer matches the warm-paper, pine,
and lime language of the redesigned site. This change gives Guru a recognisable
front door and a panel that feels like a designed study companion.

## Goals

- Replace the sparkles glyph in the header and mobile drawer with the Guru mascot.
- Re-skin the Guru panel, empty state, composer, and messages to the new palette.
- Keep the violet mascot as the single assistant accent inside the new chrome.
- Preserve every existing chat behaviour, shortcut, and accessibility contract.

## Non-goals

- No model, backend, prompt, or persistence changes.
- No new dependencies.
- No change to how the problem solver or playground embed Guru.

## Approach

Retune the existing `--guru-*` tokens to mirror the `ag-theme` paper/pine/lime
palette, then restyle the existing components against those tokens. This keeps
light/dark mode and every Guru host consistent.

Alternatives considered:

- **Scoped overrides in the workspace shell only.** Rejected: the embedded and
  playground panels would drift from the main panel.
- **A separate skin system.** Rejected as unnecessary machinery for one surface.

## Decisions

- **Entry point:** mascot at 20 px inside the existing “Ask Guru” button, with a
  shortcut chip on wide screens and an open/active treatment. Touch height stays
  at least 44 px on mobile.
- **Header:** paper surface, hairline rule, mascot tile, “GuruBot” in the display
  face, and a live status pill.
- **Empty state:** larger mascot on a dotted stage, an eyebrow, the existing
  heading and coaching copy, suggestion cards, and the accuracy note.
- **Composer:** elevated paper card with a pine focus ring, pine send button, and
  a lime-tinted attach-context chip.
- **Messages:** user turns become pine bubbles with cream text; assistant turns
  stay paper cards with a hairline border.
- **Dark mode:** deep forest surface with lime accents, matching the site's dark
  theme.

## Accessibility

- Keep every current aria label, role, shortcut, and focus order.
- Maintain visible focus rings and reduced-motion behaviour.
- Preserve contrast for body copy, muted copy, and the send/stop states.

## Verification

- Component tests for the launcher and Guru panel.
- Full `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Chromium screenshots at 1440×900 and 390×844 in light and dark mode.
