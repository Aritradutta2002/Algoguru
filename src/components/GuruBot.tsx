/**
 * Stable entry point for the Guru assistant.
 *
 * The implementation lives in `@/components/guru/*` so the chat surface can be
 * split into focused modules (stream, sessions, composer, message, history)
 * without changing the imports used by App, Playground and ProblemSolver.
 */
export { GuruBot, GURU_PANEL_CONSTANTS } from "./guru/GuruBot";
export type { GuruBotProps } from "./guru/GuruBot";
