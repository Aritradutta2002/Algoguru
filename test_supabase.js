import { createClient } from "@supabase/supabase-js";

// Mock global fetch to intercept the supabase request
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.includes("functions/v1/leetcode-daily")) {
    return new Response(JSON.stringify({
      error: "Upstream LeetCode API is unavailable and no cached challenge exists.",
      detail: "Upstream returned HTTP 429"
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
  return originalFetch(url, options);
};

const supabase = createClient("https://mock.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.mock");

async function run() {
  const { data, error } = await supabase.functions.invoke("leetcode-daily", { method: "GET" });
  console.log("data:", data);
  console.log("error:", error);
  console.log("error message:", error?.message);
}
run();
