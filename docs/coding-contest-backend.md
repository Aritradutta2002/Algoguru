# Coding contest backend contract

The Contest module has two backends-worth of responsibility. One of them exists
today; the other is specified here and **does not exist yet**. This document is
explicit about that split so nobody mistakes the current state for a finished
feature.

| Concern | Status | Where |
|---|---|---|
| Session lifecycle, authoritative deadline, warning count, finalization, drafts, results | **Implemented** | `supabase/functions/contest-coding/index.ts` + `20260915000000_add_coding_contest.sql` |
| Hidden-test grading and score computation | **Not implemented** | This document |
| Code execution | **Not implemented** | This document |

Until `contest-execute` exists, the browser runs a development adapter that
executes nothing and labels every result `mode: "development"`,
`hiddenEvaluated: false`. It never reports a pass it did not earn.

---

## 1. The rule that matters most

**A browser cannot securely execute untrusted Java, and a browser must never be
the authority for a contest score.**

- Untrusted code runs in a server-side sandbox only. Never in the application
  process, never via `child_process`, a shell, a Worker, or `eval`.
- The browser calls *this application's backend*. It never calls a third-party
  execution provider directly, and no provider credential is ever placed in a
  `VITE_*` variable.
  - Note: `src/pages/Playground.tsx` still calls `wandbox.org` straight from the
    browser. That is a pre-existing path, unrelated to the Contest module, and
    deliberately not reused here. Do not copy it.

---

## 2. How hidden tests stay hidden

`coding_problems` holds `hidden_test_cases` and `reference_solution`. It differs
from every other table in this schema:

- RLS is enabled and there is **no** `SELECT` policy for `anon`/`authenticated`.
- Table privileges are granted to `service_role` **only** — the usual
  `GRANT ... TO anon, authenticated` line is intentionally absent.

With no grant and no policy, PostgREST and the publishable anon key cannot read
the table at all. The single reader is the service-role client inside
`contest-coding`, which projects every response through `toPublicProblem`
(field-by-field, never a spread).

Two places must stay in sync:

- `supabase/functions/contest-coding/index.ts` → `toPublicProblem`
- `src/lib/contest/publicProblem.ts` → `toPublicProblem`

`src/lib/contest/publicProblem.test.ts` asserts the stripped key set and that
the serialised public bank contains no hidden data.

**The frontend problem bank (`src/lib/codingContest/javaProblemBank.ts`) contains
public fields only.** The authoritative problem set is the migration seed; the
join key is `slug`. A mismatch surfaces as an actionable "contest unavailable"
state, never a crash.

---

## 3. `contest-execute` (to be built)

### Request

`POST` with the caller's JWT.

```jsonc
{
  "action": "run" | "submit",
  "sessionId": "uuid",
  "problemId": "uuid",
  "language": "java",
  "code": "class Solution { ... }"
}
```

`run` evaluates the problem's **visible** cases. `submit` evaluates the hidden
set. Both must verify that `problemId` is one of `session.problem_ids` and that
the session belongs to the caller.

### Response

Normalised to the frontend's `ExecutionResult`
(`src/lib/contest/executionService.ts`):

```jsonc
{
  "verdict": "accepted" | "wrong_answer" | "compile_error" | "runtime_error"
            | "time_limit_exceeded" | "memory_limit_exceeded"
            | "unavailable" | "rate_limited",
  "stdout": "",
  "stderr": "",
  "compileDiagnostics": [
    { "line": 12, "column": 5, "message": "cannot find symbol", "severity": "error" }
  ],
  "runtimeMs": 143,
  "memoryKb": 51200,
  "testOutcomes": [
    // ONLY visible cases. `visible: false` outcomes must not carry
    // expectedOutput, and hidden test inputs are never returned.
    { "caseId": "visible-1", "passed": true, "expectedOutput": "0 1", "visible": true }
  ],
  "passed": 3,
  "total": 3,
  "hiddenEvaluated": true,
  "mode": "production"
}
```

`hiddenEvaluated` is the honesty switch. A `run` returns `false`. A `submit`
returns `true` only if the hidden set actually ran. The UI renders both.

### Asynchronous evaluation

Compilation and a full hidden set can exceed an edge-function budget. The
supported pattern:

1. `submit` validates, enqueues, and returns `verdict: "unavailable"` with a
   `pending: true` flag plus a job id.
2. The session moves `active -> processing`.
3. A worker runs the job, writes per-problem aggregates into
   `contest_coding_sessions.evaluation`, then sets `status = 'finalized'`.
4. `get-result` serves `processing` as a skeleton until then — which the result
   page already implements.

### Environment variables (server-side only)

| Variable | Purpose |
|---|---|
| `CODE_EXECUTION_PROVIDER` | Normalised provider id, e.g. `judge0`, `piston`. |
| `CODE_EXECUTION_BASE_URL` | Provider base URL. |
| `CODE_EXECUTION_API_KEY` | Provider credential. **Never** a `VITE_*` variable. |
| `CODE_EXECUTION_TIMEOUT_MS` | Wall-clock cap for a single submission. |
| `CODE_EXECUTION_MAX_OUTPUT_BYTES` | stdout/stderr cap. |

The provider is chosen at deploy time. Nothing in the frontend assumes one.

### Isolation requirements

A production implementation must provide all of the following. Anything less and
the "secure exam" claim is unfounded:

- **Process/container isolation per submission.** No reuse between learners, no
  shared JVM or warm process.
- **CPU limit** and a **wall-clock timeout** enforced by the sandbox, not by the
  harness. A timeout must return `time_limit_exceeded`, not a hang.
- **Memory cap**; exceeding it returns `memory_limit_exceeded`.
- **Output-size cap** on stdout and stderr to stop log-flooding.
- **No network egress** from the sandbox.
- **Minimal read-only filesystem**, writable only under a per-submission temp
  directory that is destroyed afterwards.
- **Rate limiting** per user and per session, so one learner cannot exhaust the
  pool for everyone.
- **Authentication** on every call, plus a **session-ownership check** against
  the verified JWT.
- **Payload validation**: `language` allowlisted to `["java"]`, code size capped
  (64 KiB is what the session function already enforces), problem id must belong
  to the session.
- **SQL parameterisation** throughout — `.eq()`/`.rpc()` only, never string
  interpolation.

### Scoring

Score is computed **server-side** and written to
`contest_coding_sessions.evaluation`. The client never posts a score, and never
computes one from raw outcomes. A problem is solved only when every hidden test
passes.

`evaluation` must contain aggregates only. It must not contain hidden test
inputs, hidden expected outputs, or reference solutions — `get-result` returns
it verbatim, so a leak here leaks everywhere.

---

## 4. Idempotency and trust

Two database-level guarantees, both already in the migration:

- **One active contest per user.** A partial unique index on
  `(user_id) WHERE status IN ('active','processing')`. A concurrent
  double-create raises `23505`; `contest-coding` catches it and returns the
  existing session with `created: false` instead of starting a parallel contest.
- **Finalization happens once.** `UPDATE ... WHERE id = $1 AND status IN
  ('active','processing') RETURNING *`. Zero rows means someone already
  finalized, so the existing row and its original reason are returned with
  `alreadyFinalized: true`.

The server clock always wins. If `now() >= expires_at`, the reason is recorded
as `expired` regardless of what the client claims — see `finalizeRow`.

---

## 5. Deploying

The migration and the function in this repo are authored but **not applied**:

```bash
supabase db push                                  # applies the migration
supabase functions deploy contest-coding          # deploys the function
```

Two things must be done after the migration lands, before a contest is usable:

1. Add `hidden_test_cases` and `reference_solution` for each seeded problem.
2. Flip `is_published = TRUE`. The seed ships them unpublished on purpose: a
   problem must never be served as an exam question before its hidden test set
   exists.

Until then the app shows an actionable "coding contest backend is not
reachable" state with an explicit **Continue in local practice mode (not
scored)** button. There is no silent downgrade to a local session.
