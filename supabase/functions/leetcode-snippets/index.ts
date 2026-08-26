// Lightweight edge function to fetch LeetCode codeSnippets for a given problem.
//
// This exists because all client-side code snippet fetching paths are broken
// or unreliable (corsproxy rate-limits, alfa-leetcode-api doesn't return
// codeSnippets). This edge function reliably queries LeetCode GraphQL
// directly from server-side — no CORS proxy needed.
//
// Usage:  GET /leetcode-snippets?titleSlug=two-sum
// Returns: { codeSnippets: [{ langSlug: "java", code: "..." }, ...] }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 8_000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchSnippets(
  titleSlug: string,
): Promise<{ langSlug: string; code: string }[] | null> {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        codeSnippets {
          langSlug
          code
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query, variables: { titleSlug } }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        question?: {
          codeSnippets?: { langSlug: string; code: string }[];
        };
      };
    };

    const snippets = json?.data?.question?.codeSnippets;
    return Array.isArray(snippets) && snippets.length > 0 ? snippets : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Accept titleSlug from query parameter or JSON body
  let titleSlug: string | null = null;

  const url = new URL(req.url);
  titleSlug = url.searchParams.get("titleSlug");

  if (!titleSlug && req.method === "POST") {
    try {
      const body = (await req.json()) as { titleSlug?: string };
      titleSlug = body?.titleSlug ?? null;
    } catch {
      // ignore parse errors
    }
  }

  if (!titleSlug || typeof titleSlug !== "string" || !titleSlug.trim()) {
    return jsonResponse(
      { error: "Missing required parameter: titleSlug" },
      400,
    );
  }

  const snippets = await fetchSnippets(titleSlug.trim());

  if (!snippets) {
    return jsonResponse(
      { error: "Failed to fetch code snippets from LeetCode", titleSlug },
      502,
    );
  }

  return jsonResponse({ codeSnippets: snippets, titleSlug });
});
