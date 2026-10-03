// contest-coding — server-authoritative lifecycle for the Java coding contest.
//
// WHY THIS EXISTS
// ---------------
// A 30-minute exam with a hidden test set cannot be trusted to the browser. The
// client can freeze its own clock, reset a warning counter with a refresh, and
// (with a publishable anon key) read any table Postgres exposes. So the things
// that decide a result — the deadline, problem assignment, the warning count,
// finalization, and scoring — all live behind this function, which:
//
//   * resolves the caller from their JWT and ignores anything the client claims
//     about who they are;
//   * re-checks session ownership on every session-scoped action;
//   * owns the deadline using the SERVER clock, so a client that lies about
//     `now` gains nothing;
//   * makes session creation and finalization idempotent at the database level;
//   * and projects every problem through `toPublicProblem` so `hidden_test_cases`
//     and `reference_solution` can never be serialised to a browser.
//
// The browser calls THIS function. It never calls a code-execution provider
// directly — see docs/coding-contest-backend.md for the `contest-execute`
// contract that is still to be built.
//
// Actions: create-session, get-session, save-draft, record-warning, finalize,
// get-result.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Mirrors src/lib/examConstants.ts and src/lib/contest/config.ts. */
const MAX_EXAM_WARNINGS = 4;
const DURATION_SECONDS = 30 * 60;
const MIN_PROBLEMS = 2;
const MAX_PROBLEMS = 3;
const MAX_CODE_BYTES = 64 * 1024;

type FinalizationReason =
  | "manual"
  | "expired"
  | "warning_limit"
  | "administrator"
  | "system";

/**
 * The single definition of what a browser may receive from `coding_problems`.
 * Kept field-by-field (never a spread, never a `delete`) so a future column
 * cannot leak by default. The frontend has the identical function in
 * `src/lib/contest/publicProblem.ts`; keep the two in sync.
 */
function toPublicProblem(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    topics: row.topics ?? [],
    constraints: row.constraints ?? [],
    inputFormat: row.input_format,
    outputFormat: row.output_format,
    examples: row.examples ?? [],
    starterCode: row.starter_code,
    functionSignature: row.function_signature,
    visibleTestCases: row.visible_test_cases ?? [],
    timeLimitMs: row.time_limit_ms,
    memoryLimitMb: row.memory_limit_mb,
    isPublished: row.is_published,
  };
}

/** Session row -> the camelCase shape the frontend types expect. */
function toSessionDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    language: row.language,
    problemIds: row.problem_ids ?? [],
    startedAt: Date.parse(String(row.started_at)),
    expiresAt: Date.parse(String(row.expires_at)),
    durationSeconds: row.duration_seconds,
    status: row.status,
    warningCount: row.warning_count,
    submittedAt: row.submitted_at ? Date.parse(String(row.submitted_at)) : null,
    finalizationReason: row.finalization_reason ?? null,
    totalScore: row.total_score ?? null,
    problemsSolved: row.problems_solved ?? null,
    testsPassed: row.tests_passed ?? null,
    testsTotal: row.tests_total ?? null,
    createdAt: Date.parse(String(row.created_at)),
  };
}

/**
 * Randomly assign 2 or 3 distinct published problems.
 *
 * NOTE: `src/lib/contest/assignProblems.ts` carries the same pure function for
 * the browser bundle and its tests. The Deno edge runtime and the Vite bundle
 * cannot share a module in this repo, so the duplication is deliberate. If you
 * change one, change both.
 */
function pickProblemIds(rows: { id: string }[]): string[] {
  if (rows.length === 0) return [];
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const span = MAX_PROBLEMS - MIN_PROBLEMS + 1;
  const wanted = Math.min(
    rows.length,
    MIN_PROBLEMS + Math.floor(Math.random() * span),
  );
  return shuffled.slice(0, wanted).map((row) => row.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Function is not configured." }, 500);
    }

    // Identity comes from the verified JWT only.
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Not authenticated." }, 401);
    }
    const userId = userData.user.id;

    // All reads/writes use the service-role client. Never expose this key.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const isGet = req.method === "GET";
    const url = new URL(req.url);
    const body = isGet
      ? Object.fromEntries(url.searchParams.entries())
      : await req.json().catch(() => ({}));
    const action = String((body as Record<string, unknown>).action ?? "");

    // ── helpers ──────────────────────────────────────────────────────────
    const loadSession = async (sessionId: string) => {
      if (!sessionId) return null;
      const { data, error } = await admin
        .from("contest_coding_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error || !data) return null;
      // 404 rather than 403 for someone else's session: do not confirm that it
      // exists.
      if (data.user_id !== userId) return null;
      return data as Record<string, unknown>;
    };

    /**
     * Idempotent finalization. The conditional UPDATE is the whole point: a
     * second (or concurrent) call matches zero rows, and we return the already
     * finalized row instead of writing a new reason or timestamp.
     */
    const finalizeRow = async (
      sessionId: string,
      reason: FinalizationReason,
    ): Promise<{ row: Record<string, unknown>; alreadyFinalized: boolean }> => {
      // The server clock outranks whatever the browser claims.
      const existing = await loadSession(sessionId);
      if (!existing) throw new Error("not_found");
      if (existing.status === "finalized" || existing.status === "cancelled") {
        return { row: existing, alreadyFinalized: true };
      }
      const effective =
        new Date().getTime() >= Date.parse(String(existing.expires_at))
          ? "expired"
          : reason;

      const { data, error } = await admin
        .from("contest_coding_sessions")
        .update({
          status: "finalized",
          finalization_reason: effective,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .in("status", ["active", "processing"])
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Lost the race — somebody else finalized first.
        const settled = await loadSession(sessionId);
        return { row: settled ?? existing, alreadyFinalized: true };
      }
      return { row: data as Record<string, unknown>, alreadyFinalized: false };
    };

    /** Close a session whose deadline has passed. Returns the row either way. */
    const expireIfDue = async (row: Record<string, unknown>) => {
      if (row.status !== "active") return row;
      if (new Date().getTime() < Date.parse(String(row.expires_at))) return row;
      return (await finalizeRow(String(row.id), "expired")).row;
    };

    const publicProblemsFor = async (problemIds: string[]) => {
      if (problemIds.length === 0) return [];
      const { data, error } = await admin
        .from("coding_problems")
        .select("*")
        .in("id", problemIds);
      if (error) throw error;
      const byId = new Map(
        ((data ?? []) as Record<string, unknown>[]).map((row) => [
          String(row.id),
          toPublicProblem(row),
        ]),
      );
      // Preserve assignment order.
      return problemIds
        .map((id) => byId.get(id))
        .filter((value): value is NonNullable<typeof value> => Boolean(value));
    };

    const draftsFor = async (sessionId: string) => {
      const { data, error } = await admin
        .from("contest_problem_drafts")
        .select("problem_id, code")
        .eq("session_id", sessionId);
      if (error) throw error;
      const drafts: Record<string, string> = {};
      for (const row of (data ?? []) as { problem_id: string; code: string }[]) {
        drafts[row.problem_id] = row.code;
      }
      return drafts;
    };

    // ── actions ──────────────────────────────────────────────────────────
    switch (action) {
      case "create-session": {
        // Re-read any in-flight session first. The partial unique index makes
        // the race impossible, but checking keeps the common case cheap.
        const { data: activeRows } = await admin
          .from("contest_coding_sessions")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["active", "processing"])
          .maybeSingle();

        if (activeRows) {
          const row = await expireIfDue(activeRows as Record<string, unknown>);
          if (row.status === "active") {
            const problems = await publicProblemsFor(
              (row.problem_ids ?? []) as string[],
            );
            return jsonResponse({
              session: toSessionDto(row),
              problems,
              drafts: await draftsFor(String(row.id)),
              created: false,
            });
          }
        }

        const { data: pool, error: poolError } = await admin
          .from("coding_problems")
          .select("id")
          .eq("is_published", true);
        if (poolError) throw poolError;
        const problemIds = pickProblemIds((pool ?? []) as { id: string }[]);
        if (problemIds.length < MIN_PROBLEMS) {
          return jsonResponse(
            {
              error:
                "The coding contest does not have enough published problems yet.",
            },
            409,
          );
        }

        const startedAt = new Date();
        const expiresAt = new Date(
          startedAt.getTime() + DURATION_SECONDS * 1000,
        );
        const { data: inserted, error: insertError } = await admin
          .from("contest_coding_sessions")
          .insert({
            user_id: userId,
            language: "java",
            problem_ids: problemIds,
            started_at: startedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            duration_seconds: DURATION_SECONDS,
            status: "active",
          })
          .select("*")
          .maybeSingle();

        if (insertError) {
          // 23505 = a concurrent create won the unique-index race. Return the
          // winner rather than starting a parallel contest.
          if (insertError.code === "23505") {
            const { data: winner } = await admin
              .from("contest_coding_sessions")
              .select("*")
              .eq("user_id", userId)
              .in("status", ["active", "processing"])
              .maybeSingle();
            if (winner) {
              const row = await expireIfDue(winner as Record<string, unknown>);
              return jsonResponse({
                session: toSessionDto(row),
                problems: await publicProblemsFor(
                  (row.problem_ids ?? []) as string[],
                ),
                drafts: await draftsFor(String(row.id)),
                created: false,
              });
            }
          }
          throw insertError;
        }

        const row = inserted as Record<string, unknown>;
        return jsonResponse({
          session: toSessionDto(row),
          problems: await publicProblemsFor(problemIds),
          drafts: {},
          created: true,
        });
      }

      case "get-session": {
        const existing = await loadSession(String(body.sessionId ?? ""));
        if (!existing) return jsonResponse({ error: "Session not found." }, 404);
        const row = await expireIfDue(existing);
        return jsonResponse({
          session: toSessionDto(row),
          problems: await publicProblemsFor((row.problem_ids ?? []) as string[]),
          drafts: await draftsFor(String(row.id)),
        });
      }

      case "save-draft": {
        const existing = await loadSession(String(body.sessionId ?? ""));
        if (!existing) return jsonResponse({ error: "Session not found." }, 404);
        const row = await expireIfDue(existing);
        if (row.status !== "active") {
          // A closed contest takes no more draft writes. The client treats this
          // as best-effort and still finalizes.
          return jsonResponse(
            { error: "This contest is closed, so no further drafts can be saved." },
            409,
          );
        }
        const problemId = String(body.problemId ?? "");
        if (!(row.problem_ids ?? []).includes(problemId)) {
          return jsonResponse({ error: "Problem is not part of this contest." }, 400);
        }
        const code = String(body.code ?? "");
        if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) {
          return jsonResponse({ error: "Code payload is too large." }, 413);
        }
        const { error: upsertError } = await admin
          .from("contest_problem_drafts")
          .upsert(
            {
              session_id: String(row.id),
              problem_id: problemId,
              user_id: userId,
              code,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "session_id,problem_id" },
          );
        if (upsertError) throw upsertError;
        return jsonResponse({ ok: true });
      }

      case "record-warning": {
        const existing = await loadSession(String(body.sessionId ?? ""));
        if (!existing) return jsonResponse({ error: "Session not found." }, 404);

        const { data, error } = await admin
          .from("contest_coding_sessions")
          // Atomic increment, so a refresh cannot reset the counter.
          .update({ warning_count: Number(existing.warning_count ?? 0) + 1 })
          .eq("id", String(existing.id))
          .eq("status", "active")
          .select("warning_count")
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          // Not active any more; nothing to escalate.
          const settled = await loadSession(String(existing.id));
          return jsonResponse({
            session: toSessionDto(settled ?? existing),
            warningCount: Number(existing.warning_count ?? 0),
            finalised: false,
          });
        }

        const warningCount = Number(data.warning_count);
        if (warningCount >= MAX_EXAM_WARNINGS) {
          const { row } = await finalizeRow(String(existing.id), "warning_limit");
          return jsonResponse({
            session: toSessionDto(row),
            warningCount,
            finalised: true,
          });
        }
        const { data: current } = await admin
          .from("contest_coding_sessions")
          .select("*")
          .eq("id", String(existing.id))
          .maybeSingle();
        return jsonResponse({
          session: toSessionDto(current ?? existing),
          warningCount,
          finalised: false,
        });
      }

      case "finalize": {
        const requested = String(
          (body as Record<string, unknown>).reason ?? "manual",
        ) as FinalizationReason;
        if (!["manual", "expired", "warning_limit", "administrator", "system"].includes(requested)) {
          return jsonResponse({ error: "Unsupported finalization reason." }, 400);
        }
        const existing = await loadSession(String(body.sessionId ?? ""));
        if (!existing) return jsonResponse({ error: "Session not found." }, 404);
        const { row, alreadyFinalized } = await finalizeRow(
          String(existing.id),
          requested,
        );
        return jsonResponse({
          session: toSessionDto(row),
          alreadyFinalized,
        });
      }

      case "get-result": {
        const existing = await loadSession(String(body.sessionId ?? ""));
        if (!existing) return jsonResponse({ error: "Session not found." }, 404);
        const row = await expireIfDue(existing);
        const problems = await publicProblemsFor(
          (row.problem_ids ?? []) as string[],
        );
        const evaluation = (row.evaluation ?? null) as
          | { results?: unknown[] }
          | null;

        return jsonResponse({
          session: toSessionDto(row),
          problems,
          // `evaluation` holds per-problem aggregates only. It is written
          // server-side by `contest-execute` and must never be allowed to
          // contain hidden test inputs or expected outputs.
          results: evaluation?.results ?? [],
        });
      }

      default:
        return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 500);
  }
});
