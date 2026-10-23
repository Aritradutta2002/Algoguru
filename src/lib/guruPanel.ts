/**
 * Standard sizing limits for the Guru panel / slider across all layouts.
 *
 * Lives outside the GuruBot component so the app shell can read the constants
 * without pulling the chat bundle (syntax highlighting, markdown, Supabase
 * chat state) into the initial download.
 *
 *   • MIN keeps the panel readable without breaking message bubbles or code.
 *   • DEFAULT provides an ergonomic 28% starting size.
 *   • MAX is capped at 38% so the main content / code editor always maintains
 *     at least 62% width and never feels squashed.
 */
export const GURU_PANEL_CONSTANTS = {
  DEFAULT_SIZE: 28,
  MIN_SIZE: 18,
  MAX_SIZE: 38,
  COLLAPSED_SIZE: 3.5,
  EXPAND_TRIGGER_SIZE: 4.25,
} as const;

export type GuruPanelConstants = typeof GURU_PANEL_CONSTANTS;
