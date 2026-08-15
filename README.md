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

2. **Deploy the edge function**:
   ```bash
   supabase functions deploy health --no-verify-jwt
   ```

3. **Verify**:
   ```bash
   curl https://tgzyttzmtsnlxxiywoww.supabase.co/functions/v1/health
   ```
