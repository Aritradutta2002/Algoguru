# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Application header

The responsive header keeps search, theme, text zoom, account access, and Guru AI
in one keyboard-accessible navigation bar. Guru AI is an icon-only control with
no visible text, border, or background, using the optimized transparent
[`public/brand/guru-ai.png`](public/brand/guru-ai.png) asset. Header controls adapt
to the available panel width, including when the sidebar or assistant is open.
On problem-solving pages, Guru AI remains in
the description panel tab rather than opening a separate assistant panel.
The header uses a raised active tab with a cobalt indicator and consistent
control spacing. Its mobile menu focuses the current destination, closes on
Escape or outside interaction, restores trigger focus on Escape, and closes
when resizing into desktop navigation. Navigation motion respects reduced-motion
preferences. Run `npm test -- src/components/layout/PrimaryNavigation.test.tsx`
for focused navigation checks.

## Home landing page

The home page supports light and dark themes, responsive layouts based on the
available content width, and keyboard-accessible learning, quiz, playground, and
roadmap actions. The example workspace is labeled as a preview, not live account
progress. Landing styles are scoped in `src/styles/landing.css`; primary actions
use an explicit high-contrast gradient background. Entrances, floating accents,
and section scrolling respect `prefers-reduced-motion`. The roadmap is lazy
loaded with a visible loading status.

Run the focused regression checks with
`npm test -- src/pages/Index.test.tsx src/components/quiz/QuizSection.test.tsx`.

## Interview preparation tracks

- **Core Java Q&A** — `/interview/java/core-java-qa` (226 questions, 15 topics)
- **Spring Boot & Backend Engineering** — `/interview/java/spring-boot` (138 questions,
  155 annotations, 41 practice problems). See
  [`docs/SPRING_BOOT_INTERVIEW_TRACK.md`](docs/SPRING_BOOT_INTERVIEW_TRACK.md) for the full
  breakdown and [`src/data/backendInterview/README.md`](src/data/backendInterview/README.md)
  for the authoring guide.

## Database access & Data API grants

Since **2026-10-30** Supabase no longer auto-grants Data API access to new tables
in the `public` schema. Existing tables keep their privileges, but every table
created after that date — including every table recreated by `supabase db reset`,
a preview branch, or a new project — needs an explicit `GRANT` before
supabase-js/PostgREST can reach it, otherwise the API returns
`permission denied`.

**Rule for this repo: a migration that creates a table in `public` must contain
that table's `GRANT` statements in the same file.** Every table already has an
explicit, least-privilege grant; `service_role` grants are included because it
bypasses RLS but not table privileges, so the edge functions depend on them too.

`npx supabase test db` enforces this — `supabase/tests/data_api_grants.test.sql`
fails if a public table ships without an expected grant entry.

Full reference, including the privilege matrix, a copy-paste template for new
tables, the hosted-project audit query, and the `curl` checks for leaked tables:
[`docs/data-api-grants.md`](docs/data-api-grants.md).

> `supabase/full_schema.sql` is a **deprecated**, incomplete bootstrap file. Use
> the migrations (`supabase db push`), not that file.

## Health Check / Monitoring

A lightweight health-check endpoint is available for uptime monitoring services like UptimeRobot.

### Endpoint

```
GET https://<project-ref>.supabase.co/functions/v1/health
```

For this project:
```
GET https://tgzyttzmtsnlxxiywoww.supabase.co/functions/v1/health
```

### What It Checks

1. **Application availability** — the Supabase Edge Function runtime is alive.
2. **Database connectivity** — executes `SELECT 1` via a PostgreSQL function (`health_ping()`) to verify the Supabase PostgreSQL database is reachable.

### Expected Responses

**Healthy (HTTP 200):**
```json
{
  "status": "UP",
  "database": "UP"
}
```

**Unhealthy (HTTP 503):**
```json
{
  "status": "DOWN",
  "database": "DOWN"
}
```

### Security

- No authentication required (`verify_jwt = false`)
- Never exposes credentials, connection strings, stack traces, or SQL errors
- Only returns `UP` / `DOWN` status strings

### UptimeRobot Configuration

| Setting              | Value                                                                   |
|----------------------|-------------------------------------------------------------------------|
| **Monitor Type**     | HTTP(S)                                                                 |
| **URL**              | `https://tgzyttzmtsnlxxiywoww.supabase.co/functions/v1/health`         |
| **Monitoring Interval** | 5 minutes (recommended)                                             |
| **HTTP Method**      | GET                                                                     |
| **Expected Status**  | 200                                                                     |
| **Keyword (optional)** | `"status":"UP"` (type: keyword exists)                               |
| **Timeout**          | 30 seconds                                                              |

### Deployment

1. **Run the SQL migration** against your Supabase project:
   - Via the Supabase Dashboard → SQL Editor, run `supabase/migrations/20260815_add_health_ping_function.sql`
   - Or via CLI: `supabase db push`

   > Before running `supabase db push`, check `supabase migration list` first. If
   > the remote migration history was never populated by the CLI (SQL pasted into
   > the Dashboard instead), `db push` would try to replay every migration against
   > a live database. In that case run the new migration's SQL directly in the SQL
   > editor — the grant migrations are idempotent and additive. See
   > [`docs/data-api-grants.md`](docs/data-api-grants.md).

2. **Deploy the edge function**:
   ```bash
   supabase functions deploy health --no-verify-jwt
   ```

3. **Verify**:
   ```bash
   curl https://tgzyttzmtsnlxxiywoww.supabase.co/functions/v1/health
   ```
