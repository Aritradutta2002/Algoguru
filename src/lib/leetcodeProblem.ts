// Fetch LeetCode problem via official GraphQL through supabase edge function `leetcode-problem`.
// Handles titleSlug derivation from practiceData and caches results.

import { supabase } from "@/integrations/supabase/client";
import type { DailyProblem } from "@/types/leetcode";

export type LeetCodeProblem = DailyProblem;

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const LS_KEY_PREFIX = "lc_problem_cache_v1_";
const MEMORY_CACHE = new Map<string, { problem: LeetCodeProblem; cachedAt: number }>();

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export function deriveTitleSlug(problem: { title: string; slug?: string; leetcodeLink?: string }): string | null {
  if (problem.slug && problem.slug.trim()) return problem.slug.trim();
  if (problem.leetcodeLink) {
    const m = problem.leetcodeLink.match(/leetcode\.com\/problems\/([^/]+)\/?/);
    if (m?.[1]) return m[1].trim();
  }
  const s = slugify(problem.title);
  return s || null;
}

function lsGet(slug: string): LeetCodeProblem | null {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { problem: LeetCodeProblem; cachedAt: number };
    if (!parsed.problem || typeof parsed.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(LS_KEY_PREFIX + slug);
      return null;
    }
    return parsed.problem;
  } catch {
    return null;
  }
}

function lsSet(slug: string, problem: LeetCodeProblem) {
  try {
    localStorage.setItem(LS_KEY_PREFIX + slug, JSON.stringify({ problem, cachedAt: Date.now() }));
  } catch {}
}

function hasRealCodeSnippets(snippets?: { langSlug: string; code: string }[]): boolean {
  if (!Array.isArray(snippets) || snippets.length === 0) return false;
  return snippets.some((s) => s?.code && !s.code.includes("public int solve()"));
}

export async function fetchLeetCodeProblem(titleSlug: string): Promise<LeetCodeProblem | null> {
  const slug = titleSlug.trim();
  if (!slug) return null;

  const mem = MEMORY_CACHE.get(slug);
  if (mem && Date.now() - mem.cachedAt < CACHE_TTL_MS && hasRealCodeSnippets(mem.problem.codeSnippets)) {
    return mem.problem;
  }

  const ls = lsGet(slug);
  if (ls && hasRealCodeSnippets(ls.codeSnippets)) {
    MEMORY_CACHE.set(slug, { problem: ls, cachedAt: Date.now() });
    return ls;
  }

  // Try new edge function first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const { data, error } = await supabase.functions.invoke<{ problem?: LeetCodeProblem }>("leetcode-problem", {
      method: "POST",
      body: { titleSlug: slug },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!error && data?.problem?.questionId && data.problem.title) {
      const prob = data.problem;
      if (hasRealCodeSnippets(prob.codeSnippets) || prob.exampleTestcases || prob.content) {
        MEMORY_CACHE.set(slug, { problem: prob, cachedAt: Date.now() });
        lsSet(slug, prob);
        return prob;
      }
      // still cache even if snippet placeholder? keep for content/testcases
      MEMORY_CACHE.set(slug, { problem: prob, cachedAt: Date.now() });
      lsSet(slug, prob);
      return prob;
    }
  } catch {
    // fall through to snippets fallback
  }

  // Fallback: try leetcode-snippets edge function (only codeSnippets, but better than nothing)
  try {
    const { data } = await supabase.functions.invoke<{ codeSnippets?: { langSlug: string; code: string }[] }>(
      "leetcode-snippets",
      { method: "POST", body: { titleSlug: slug } },
    );
    if (data?.codeSnippets && hasRealCodeSnippets(data.codeSnippets)) {
      const fallback: LeetCodeProblem = {
        questionId: "",
        title: slug.replace(/-/g, " "),
        titleSlug: slug,
        difficulty: "Medium",
        content: "",
        exampleTestcases: undefined,
        topicTags: [],
        link: `https://leetcode.com/problems/${slug}/`,
        codeSnippets: data.codeSnippets,
      };
      MEMORY_CACHE.set(slug, { problem: fallback, cachedAt: Date.now() });
      lsSet(slug, fallback);
      return fallback;
    }
  } catch {}

  return null;
}

export function clearLeetCodeProblemCache(slug?: string) {
  if (slug) {
    MEMORY_CACHE.delete(slug);
    try {
      localStorage.removeItem(LS_KEY_PREFIX + slug);
    } catch {}
  } else {
    MEMORY_CACHE.clear();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(LS_KEY_PREFIX)) localStorage.removeItem(k);
      }
    } catch {}
  }
}
