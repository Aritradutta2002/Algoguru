import { fetchDailyChallenge } from "./src/lib/leetcodeDaily.ts";
import { supabase } from "./src/integrations/supabase/client.ts";

async function run() {
  try {
    const data = await fetchDailyChallenge();
    console.log("Success:", data);
  } catch (e) {
    console.log("THREW:", e.message);
  }
}

run();
