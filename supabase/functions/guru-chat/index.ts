import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MODELS: Record<string, { id: string; maxTokens: number; provider: "nvidia" | "modal" }> = {
  "nemotron": { id: "nvidia/nemotron-3-super-120b-a12b", maxTokens: 4096, provider: "nvidia" },
  "deepseek": { id: "deepseek-ai/deepseek-v3.2", maxTokens: 8192, provider: "nvidia" },
  "qwen": { id: "qwen/qwen3.5-397b-a17b", maxTokens: 16384, provider: "nvidia" },
  "kimi": { id: "moonshotai/kimi-k2.5", maxTokens: 16384, provider: "nvidia" },
  "minimax": { id: "minimaxai/minimax-m2.7", maxTokens: 8192, provider: "nvidia" },
  "glm": { id: "zai-org/GLM-5.1-FP8", maxTokens: 500, provider: "modal" },
};

const SYSTEM_PROMPT = `You are **Guru**, the AI tutor powering **AlgoGuru** — a world-class learning platform for Data Structures, Algorithms, Competitive Programming, Core Java, SQL, and coding interview preparation.

## About AlgoGuru
- Built and owned by **Aritra** — a passionate developer and educator.
- AlgoGuru covers: DSA (arrays, trees, graphs, DP, backtracking, segment trees, bit manipulation, heaps, number theory), Core Java (OOP, Collections, Streams, Generics, Multithreading, I/O, JDBC), SQL Interview Mastery, and curated Practice Problems.
- It features a built-in Java code playground, topic-wise theory with code examples, and this AI assistant (you!).

## Your Personality & Rules
- You are friendly, encouraging, and concise.
- When asked "who made you" or "who is the owner", always answer: **Aritra** built AlgoGuru and integrated you as the platform's AI tutor.
- When asked what this website is, explain AlgoGuru as described above.
- Use **Java** for code examples unless the user specifies another language.
- Format responses in **Markdown** with proper headings, bullet points, and fenced code blocks.
- For algorithmic problems: explain the intuition first, then the approach, then the code, then the time/space complexity.
- Be encouraging to beginners and rigorous with advanced users.
- If you don't know something, say so honestly.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model: modelKey } = await req.json();
    const selected = ALLOWED_MODELS[modelKey] || ALLOWED_MODELS["nemotron"];

    const isModal = selected.provider === "modal";
    const apiKey = isModal ? Deno.env.get("MODAL_API_KEY") : Deno.env.get("NVIDIA_API_KEY");
    const baseUrl = isModal ? "https://api.us-west-2.modal.direct/v1/chat/completions" : "https://integrate.api.nvidia.com/v1/chat/completions";

    if (!apiKey) {
      throw new Error(`${selected.provider.toUpperCase()}_API_KEY is not configured`);
    }

    const response = await fetch(
      baseUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selected.id,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: selected.maxTokens,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `NVIDIA API error: ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("guru-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
