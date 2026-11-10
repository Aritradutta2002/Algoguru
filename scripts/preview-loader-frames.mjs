/**
 * Capture the brand loader's animation as real frames (dev tool, not shipped).
 *
 *   node scripts/preview-loader-frames.mjs
 *
 * Why this exists and why it drives Chrome over the DevTools Protocol:
 *
 *  - Headless Chrome reports `prefers-reduced-motion: reduce` by default. The
 *    loader correctly disables all motion in that mode, so a plain screenshot
 *    always shows the static fallback. `Emulation.setEmulatedMedia` is the only
 *    reliable way to opt out.
 *  - Freezing CSS animations with `animation-delay` is unreliable under
 *    headless virtual time (every capture lands on the first frame). Seeking
 *    through the Web Animations API is deterministic.
 *
 * Frames land in docs/brand/preview/loader-NNpct.png.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/brand/preview");
const PORT = 9444;

const geometrySrc = readFileSync(join(ROOT, "src/components/brand/brandGeometry.ts"), "utf8");
const css = readFileSync(join(ROOT, "src/components/brand/brand.css"), "utf8");

// Strip the TS types so the geometry block can be evaluated as plain JS. The
// preview therefore renders exactly the numbers the app ships.
const block = geometrySrc.split("export function")[0];
const js = block
  .replace(/^import[\s\S]*?;$/gm, "")
  .replace(/^export\s+/gm, "")
  .replace(/\s+as const;/g, ";")
  .replace(/:\s*(readonly\s+)?\[number,\s*number\]\[\]/g, "")
  .replace(/:\s*(readonly\s+)?\[number,\s*number\]/g, "")
  .replace(/:\s*string(?=\s*[,)=])/g, "")
  .replace(/:\s*number(?=\s*[,)=])/g, "");

const G = new Function(
  `${js} return { BRAND_A, BRAND_TILE_PATH, BRAND_RAMP, BRAND_GLYPH_STOPS };`,
)();
const A = G.BRAND_A;

const stops = (t) =>
  t.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("");

function markSvg(id, size) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}"><defs>
  <linearGradient id="${id}t" x1="10" y1="2" x2="56" y2="62" gradientUnits="userSpaceOnUse">${stops(G.BRAND_RAMP)}</linearGradient>
  <linearGradient id="${id}i" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">${stops(G.BRAND_GLYPH_STOPS)}</linearGradient>
  <linearGradient id="${id}r" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></linearGradient>
  <radialGradient id="${id}s" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.34"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>
  <path d="${G.BRAND_TILE_PATH}" fill="url(#${id}t)"/>
  <path d="M32 1.5L50 20.5L32 39.5L14 20.5Z" fill="url(#${id}s)"/>
  <path d="${G.BRAND_TILE_PATH}" fill="none" stroke="url(#${id}r)" stroke-width="1.3"/>
  <g fill="url(#${id}i)"><path d="${A.leftStem}"/><path d="${A.crossbar}"/><path d="${A.rightStem}"/></g></svg>`;
}

const page = `<!doctype html><html class="dark"><head><meta charset="utf-8"><style>
:root{--foreground:210 40% 98%;--muted-foreground:215 20% 65%}
html,body{margin:0;background:#070709;display:grid;place-items:center;height:100vh;overflow:hidden}
${css}
body{--agl-cycle:2.4s;--agl-hairline:1px}
</style></head><body>
<div class="agl agl--screen" id="c">
  <span class="agl__stage" style="width:116px;height:116px">
    <span class="agl__wash"></span>
    <span class="agl__plate"><span class="agl__tile">${markSvg("tile", 66)}</span><span class="agl__sweep"></span></span>
    <svg class="agl__glyph" width="66" height="66" viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="b"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="34%" stop-color="#22D3EE" stop-opacity="0.9"/><stop offset="72%" stop-color="#3B82F6" stop-opacity="0.32"/><stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/></radialGradient>
        <linearGradient id="w" x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.92"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
        <clipPath id="cl"><path d="${A.leftStem}${A.rightStem}${A.crossbar}" clip-rule="evenodd"/></clipPath>
      </defs>
      <circle class="agl__burst" cx="${A.node.cx}" cy="${A.node.cy}" r="15" fill="url(#b)"/>
      <g class="agl__drawgroup"><path class="agl__draw agl__draw--stem" d="${A.traces.rightStem}"/><path class="agl__draw agl__draw--bar" d="${A.traces.bar}"/></g>
      <g clip-path="url(#cl)"><path class="agl__fill" d="${A.leftStem}${A.rightStem}${A.crossbar}" fill="#FFFFFF" fill-rule="evenodd"/>
      <rect class="agl__band" x="0" y="0" width="22" height="64" fill="url(#w)"/></g>
      <g class="agl__spark"><circle cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r}" fill="#22D3EE"/><circle cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r * 0.45}" fill="#FFFFFF"/></g>
    </svg>
  </span>
  <span class="agl__label">Preparing your workspace</span>
  <span class="agl__meter"><span class="agl__meter-bar"></span></span>
</div>
<script>
window.__seek = (ms) => {
  const root = document.getElementById("c");
  const anims = root.getAnimations({ subtree: true });
  anims.forEach((a) => { a.pause(); a.currentTime = ms; });
  return anims.length;
};
</script></body></html>`;

const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((c) => c && existsSync(c));

if (!browser) throw new Error("No Chrome/Edge found — set CHROME_PATH.");

mkdirSync(OUT, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "aglframes-"));
const pagePath = join(work, "loader.html");
writeFileSync(pagePath, page);

const chrome = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--disable-extensions",
    "--force-device-scale-factor=1",
    "--window-size=420,300",
    `--user-data-dir=${join(work, "p")}`,
    `--remote-debugging-port=${PORT}`,
    `file:///${pagePath.replace(/\\/g, "/")}`,
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2500);
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  const target = targets.find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };
  await new Promise((r) => (ws.onopen = r));

  // Opt out of the headless default, otherwise every frame is the static
  // reduced-motion fallback.
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await send("Page.enable");
  await sleep(400);

  const beats = [4, 14, 26, 38, 50, 62, 76, 90];
  for (const pct of beats) {
    const ms = Math.round((2400 * pct) / 100);
    await send("Runtime.evaluate", { expression: `window.__seek(${ms})`, returnByValue: true });
    await sleep(120);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const file = join(OUT, `loader-${String(pct).padStart(2, "0")}pct.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`  · loader-${String(pct).padStart(2, "0")}pct.png (${ms}ms)`);
  }
  console.log(`Frames written to ${OUT}`);
} finally {
  chrome.kill();
}
