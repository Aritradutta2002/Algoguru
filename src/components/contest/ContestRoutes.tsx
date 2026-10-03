import type { ReactElement } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Quiz from "@/pages/Quiz";
import ContestLanding from "@/pages/contest/ContestLanding";
import CodingContestInstructions from "@/pages/contest/CodingContestInstructions";
import CodingContestSession from "@/pages/contest/CodingContestSession";
import CodingContestResult from "@/pages/contest/CodingContestResult";
import { QuizLegacyRedirect } from "@/components/contest/QuizLegacyRedirect";

/**
 * Route definitions for the Contest module, split by chrome.
 *
 * Kept in its own module (rather than inline in `App.tsx`) so the routing
 * contract — in particular that `/quiz` forwards its query string — is testable
 * without mounting the whole application shell (Supabase client, sidebar, Guru
 * panel).
 *
 * These are FUNCTIONS returning arrays, not components. `createRoutesFromChildren`
 * flattens arrays but does not recurse into a custom component, so a
 * `<ContestStandaloneRoutes />` element placed inside `<Routes>` would be
 * rejected. `App.tsx` therefore calls them inline: `{contestStandaloneRoutes()}`.
 *
 * `App.tsx` spreads `contestStandaloneRoutes()` beside its other chrome-free
 * routes, and `contestAppRoutes()` inside the `AppLayout` `<Routes>` ABOVE the
 * `/:topicId` catch-all, which would otherwise swallow `/contest`.
 */

/**
 * Chrome-free routes: the exam screens and the instructions that precede them.
 *
 * The instructions page sits here (not in `contestAppRoutes`) because it is the
 * run-up to a fullscreen exam and should read as one continuous, focused
 * surface — no sidebar, no Guru panel, nothing to click away to. Only the
 * landing page and the post-exam report keep the normal app shell.
 */
export function contestStandaloneRoutes(): ReactElement[] {
  return [
    <Route
      key="contest-quiz"
      path="/contest/quiz"
      element={
        <ProtectedRoute>
          <Quiz />
        </ProtectedRoute>
      }
    />,
    <Route
      key="contest-coding-instructions"
      path="/contest/coding"
      element={
        <ProtectedRoute>
          <CodingContestInstructions />
        </ProtectedRoute>
      }
    />,
    <Route
      key="contest-coding-session"
      path="/contest/coding/session/:sessionId"
      element={
        <ProtectedRoute>
          <CodingContestSession />
        </ProtectedRoute>
      }
    />,
    <Route
      key="quiz-legacy"
      path="/quiz"
      element={
        <ProtectedRoute>
          <QuizLegacyRedirect />
        </ProtectedRoute>
      }
    />,
  ];
}

/**
 * Landing and the post-exam result report. These keep the normal app shell so
 * a learner can navigate onward without hunting for a back link.
 */
export function contestAppRoutes(): ReactElement[] {
  return [
    <Route key="contest-landing" path="/contest" element={<ContestLanding />} />,
    <Route
      key="contest-coding-result"
      path="/contest/coding/result/:sessionId"
      element={<CodingContestResult />}
    />,
  ];
}
