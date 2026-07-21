import { fetchDailyChallenge } from "./src/lib/leetcodeDaily.js";

// Mock fetch globally
global.fetch = async (url) => {
  if (url === "https://alfa-leetcode-api.onrender.com/daily") {
    return {
      ok: false,
      status: 429,
      json: async () => ({})
    };
  }
  throw new Error("Unexpected url");
};

async function run() {
  try {
    await fetchDailyChallenge();
    console.log("Success");
  } catch (err) {
    console.error("Caught in test:", err.message);
  }
}
run();
