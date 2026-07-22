const https = require("https");

https.get("https://alfa-leetcode-api.onrender.com/daily", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("Status:", res.statusCode);
      console.log("Data keys:", Object.keys(json));
      if (json.questionTitle) console.log("Has questionTitle");
      if (json.questionTitleSlug) console.log("Has questionTitleSlug");
      console.log(JSON.stringify(json, null, 2).slice(0, 1000));
    } catch (e) {
      console.log("Not JSON. Status:", res.statusCode);
      console.log(data);
    }
  });
}).on("error", (e) => {
  console.error(e);
});
