import { fetchDailyChallenge } from "./src/lib/leetcodeDaily.js";

async function main() {
  try {
    console.log("Fetching...");
    await fetchDailyChallenge();
  } catch (e) {
    console.error("Caught error:", e);
  }
}
main();
