import { createClient } from "@supabase/supabase-js";

// Mock global fetch
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.includes("functions/v1/leetcode-daily")) {
    return new Response(JSON.stringify({
      error: "Upstream returned HTTP 429"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  return originalFetch(url, options);
};

const supabase = createClient("https://mock.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.mock");

async function run() {
  const { data, error } = await supabase.functions.invoke("leetcode-daily", { method: "GET" });
  console.log("data:", data);
  console.log("error message:", error?.message);
}
run();
