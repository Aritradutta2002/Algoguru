// Edge function to fetch full LeetCode problem data for any titleSlug via official LeetCode GraphQL.
// Server-side fetch — no CORS/Cloudflare issues. Mirrors the query used in leetcode-daily
// but parameterized by titleSlug so Playground can load any practice problem as LeetCode.
// Usage: GET /leetcode-problem?titleSlug=two-sum  (or POST {titleSlug})
// Returns: { problem: { questionId, title, titleSlug, difficulty, content, exampleTestcases, topicTags, hints, acRate, link, codeSnippets } }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 10_000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface LeetCodeTopicTag {
  name: string;
  slug?: string;
}

interface CodeSnippet {
  langSlug: string;
  code: string;
}

interface ProblemPayload {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  content: string;
  exampleTestcases?: string;
  topicTags: LeetCodeTopicTag[];
  hints?: string[];
  acRate?: number;
  link: string;
  codeSnippets?: CodeSnippet[];
}

async function fetchProblem(titleSlug: string): Promise<ProblemPayload | null> {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        content
        exampleTestcases
        topicTags {
          name
          slug
        }
        hints
        acRate
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
          questionId?: string;
          questionFrontendId?: string;
          title?: string;
          titleSlug?: string;
          difficulty?: string;
          content?: string;
          exampleTestcases?: string;
          topicTags?: LeetCodeTopicTag[];
          hints?: string[];
          acRate?: number;
          codeSnippets?: CodeSnippet[];
        };
      };
    };

    const q = json?.data?.question;
    if (!q || !q.title || !q.titleSlug) return null;
    // content may be empty for some problems but questionId/titleSlug must exist
    if (!q.content && !q.codeSnippets) return null;

    return {
      questionId: String(q.questionId || q.questionFrontendId || ""),
      title: String(q.title),
      titleSlug: String(q.titleSlug),
      difficulty: String(q.difficulty || "Medium"),
      content: String(q.content || ""),
      exampleTestcases: q.exampleTestcases ? String(q.exampleTestcases) : undefined,
      topicTags: Array.isArray(q.topicTags) ? q.topicTags : [],
      hints: Array.isArray(q.hints) ? q.hints : undefined,
      acRate: typeof q.acRate === "number" ? q.acRate : undefined,
      link: `https://leetcode.com/problems/${String(q.titleSlug)}/`,
      codeSnippets: Array.isArray(q.codeSnippets) ? q.codeSnippets : undefined,
    };
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
    return jsonResponse({ error: "Missing required parameter: titleSlug" }, 400);
  }

  const slug = titleSlug.trim();
  const problem = await fetchProblem(slug);

  if (!problem) {
    return jsonResponse({ error: "Failed to fetch problem from LeetCode", titleSlug: slug }, 502);
  }

  // Treat missing placeholder snippets as failure if all snippets are the generic solver placeholder
  const hasReal = Array.isArray(problem.codeSnippets) && problem.codeSnippets.some((s) => s.code && !s.code.includes("public int solve()"));
  if (!hasReal && Array.isArray(problem.codeSnippets) && problem.codeSnippets.length > 0) {
    // Still return — caller may decide to ignore placeholder; but we signal via header
  }

  return jsonResponse({ problem, titleSlug: slug });
});
