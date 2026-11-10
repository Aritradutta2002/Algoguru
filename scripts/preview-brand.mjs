/**
 * Design-review harness (dev only, not shipped).
 *
 * Renders the brand mark at every size it ships at, and freezes the loader at
 * keyframes so each beat of the story can be inspected as a still.
 *
 *   node scripts/preview-brand.mjs [outDir]
 *
 * Uses the same headless-Chrome capture path as generate-brand-assets.mjs.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, "docs/brand/preview"));

/* Resolve the real geometry by stripping the TS types in-process, so the
   preview can never drift from what the app actually renders. */
const geometrySrc = readFileSync(join(ROOT, "src/components/brand/brandGeometry.ts"), "utf8");
// Only the geometry/palette block matters here; the typed helpers below it
// are not used by the preview.
const geometryOnly = geometrySrc.split("export function")[0];
const js = geometryOnly
  .replace(/^import[\s\S]*?;$/gm, "")
  .replace(/^export\s+/gm, "")
  .replace(/\s+as const;/g, ";")
  .replace(/:\s*(readonly\s+)?\[number,\s*number\]\[\]/g, "")
  .replace(/:\s*(readonly\s+)?\[number,\s*number\]/g, "")
  .replace(/:\s*string(?=\s*[,)=])/g, "")
  .replace(/:\s*number(?=\s*[,)=])/g, "");
const sandbox = new Function(`${js}\nreturn { BRAND_TILE_PATH, BRAND_A, BRAND_RAMP, BRAND_GLYPH_STOPS, BRAND_BADGE_STOPS_COMPACT };`);
const { BRAND_TILE_PATH, BRAND_A, BRAND_RAMP, BRAND_GLYPH_STOPS, BRAND_BADGE_STOPS_COMPACT } = sandbox();

const TILE = BRAND_TILE_PATH;
const A = BRAND_A;
const RAMP = BRAND_RAMP;
const GLYPH_STOPS = BRAND_GLYPH_STOPS;
const COMPACT = BRAND_BADGE_STOPS_COMPACT;
const cssSrc = readFileSync(join(ROOT, "src/components/brand/brand.css"), "utf8");const stops = (table) =>
  table.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("");

const SHEEN = "M32 1.5L50 20.5L32 39.5L14 20.5Z";

/** The full mark, parameterised by detail level the way AlgoGuruMark is. */
function markSvg({ id, size, detail = true, node = true, palette = RAMP }) {
  const uid = `m${id}`;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}t" x1="10" y1="2" x2="56" y2="62" gradientUnits="userSpaceOnUse">${stops(palette)}</linearGradient>
    <linearGradient id="${uid}i" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">${stops(GLYPH_STOPS)}</linearGradient>
    <linearGradient id="${uid}r" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}s" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${uid}n" cx="0.34" cy="0.3" r="0.78">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="48%" stop-color="${RAMP[2].color}"/>
      <stop offset="100%" stop-color="${RAMP[1].color}"/>
    </radialGradient>
  </defs>
  <path d="${TILE}" fill="url(#${uid}t)"/>
  ${detail ? `<path d="${SHEEN}" fill="url(#${uid}s)"/><path d="${TILE}" fill="none" stroke="url(#${uid}r)" stroke-width="1.3"/>` : ""}
  <g fill="url(#${uid}i)"><path d="${A.leftStem}"/><path d="${A.crossbar}"/><path d="${A.rightStem}"/></g>
  ${node ? `<circle cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r + 1.7}" fill="${RAMP[2].color}" opacity="0.34"/>
  <circle cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r}" fill="url(#${uid}n)"/>` : ""}
</svg>`;
}

/**
 * Loader story captured as *real* frames.
 *
 * Freezing a CSS animation under headless virtual time proved unreliable (every
 * capture landed on the t=0 frame), so instead the page plays the animation
 * live and the capture script seeks it with the Web Animations API before each
 * screenshot. Chrome renders the sought state deterministically.
 */
function loaderFrame({ id, stage = 116, mark = 66 }) {
  const uid = `l${id}`;
  return `<div class="agl agl--screen" id="agl-capture" style="--agl-cycle:2.4s">
    <span class="agl__stage" style="width:${stage}px;height:${stage}px">
      <span class="agl__wash"></span>
      <span class="agl__plate">
        <span class="agl__tile">${markSvg({ id: `${id}tile`, size: mark, detail: mark >= 20, node: false })}</span>
        <span class="agl__sweep"></span>
      </span>
      <svg class="agl__glyph" width="${mark}" height="${mark}" viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id="${uid}b"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="34%" stop-color="#22D3EE" stop-opacity="0.9"/><stop offset="72%" stop-color="#3B82F6" stop-opacity="0.32"/><stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/></radialGradient>
          <linearGradient id="${uid}w" x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.92"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
          <clipPath id="${uid}c"><path d="${A.leftStem}${A.crossbar}${A.rightStem}" clip-rule="evenodd"/></clipPath>
        </defs>
        <circle class="agl__burst" cx="${A.node.cx}" cy="${A.node.cy}" r="15" fill="url(#${uid}b)"/>
        <g class="agl__drawgroup">
          <path class="agl__draw agl__draw--stem" d="${A.traces.rightStem}"/>
          <path class="agl__draw agl__draw--bar" d="${A.traces.bar}"/>
        </g>
        <g clip-path="url(#${uid}c)">
          <path class="agl__fill" d="${A.leftStem}${A.crossbar}${A.rightStem}" fill="#FFFFFF" fill-rule="evenodd"/>
          <rect class="agl__band" x="0" y="0" width="22" height="64" fill="url(#${uid}w)"/>
        </g>
        <g class="agl__spark">
          <circle class="agl__spark-core" cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r}" fill="#22D3EE"/>
          <circle class="agl__spark-halo" cx="${A.node.cx}" cy="${A.node.cy}" r="${A.node.r * 0.45}" fill="#FFFFFF"/>
        </g>
      </svg>
    </span>
    <span class="agl__label">Preparing your workspace</span>
    <span class="agl__meter"><span class="agl__meter-bar"></span></span>
  </div>
  <script>
    // Seek every animation on the capture subtree to  SEek  ms and hold it.
    window.__seekLoader = function (ms) {
      var root = document.getElementById("agl-capture");
      root.getAnimations({ subtree: true }).forEach(function (a) {
        a.pause();
        a.currentTime = ms;
      });
      return root.getAnimations({ subtree: true }).length;
    };
  </script>
  <style>${cssSrc}</style>`;
}

const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find((candidate) => candidate && existsSync(candidate));

if (!browser) throw new Error("No Chrome/Edge found — set CHROME_PATH.");

const work = mkdtempSync(join(tmpdir(), "algoguru-preview-"));
mkdirSync(OUT, { recursive: true });

function capture(name, body, { width, height, dark = true, seekMs = null }) {
  const html = `<!doctype html><html class="${dark ? "dark" : ""}"><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--foreground:222 47% 11%;--muted-foreground:220 10% 46%}
    html.dark{--foreground:210 40% 98%;--muted-foreground:215 20% 65%}
    body{width:${width}px;height:${height}px;display:grid;place-items:center;overflow:hidden;
      background:${dark ? "#070709" : "#fafaf8"};
      font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
      color:${dark ? "#f8fafc" : "#0f172a"}}
  </style></head><body>
    ${body}
    ${seekMs !== null ? `<script>window.__seekLoader(${seekMs});</script>` : ""}
  </body></html>`;

  const page = join(work, `${name}.html`);
  writeFileSync(page, html, "utf8");
  const out = join(OUT, `${name}.png`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      execFileSync(
        browser,
        [
          "--headless=new",
          "--disable-gpu",
          "--hide-scrollbars",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-extensions",
          "--force-device-scale-factor=1",
          `--user-data-dir=${join(work, `p-${name}-${attempt}`)}`,
          "--default-background-color=00000000",
          "--virtual-time-budget=1200",
          `--window-size=${width},${height}`,
          `--screenshot=${out}`,
          `file:///${page.replace(/\\/g, "/")}`,
        ],
        { stdio: "ignore", timeout: 30000 },
      );
      if (existsSync(out)) {
        console.log(`  · ${name}.png`);
        return;
      }
    } catch {
      if (existsSync(out)) return;
    }
  }
  throw new Error(`Render failed: ${name}`);
}

/* 1 — the mark at every size it actually ships at, on the real dark ground. */
const sizes = [16, 24, 32, 48, 64, 96, 128];
capture(
  "mark-sizes-dark",
  `<div style="display:flex;align-items:flex-end;gap:26px;padding:34px">
    ${sizes.map((s, i) => `<div style="display:grid;justify-items:center;gap:10px">
      <div style="height:128px;display:grid;align-items:end">${markSvg({ id: i, size: s, detail: s >= 20, node: s >= 16 })}</div>
      <span style="font-size:11px;opacity:.55">${s}px</span></div>`).join("")}
  </div>`,
  { width: 900, height: 240 },
);

/* 2 — same, on the light ground. */
capture(
  "mark-sizes-light",
  `<div style="display:flex;align-items:flex-end;gap:26px;padding:34px">
    ${sizes.map((s, i) => `<div style="display:grid;justify-items:center;gap:10px">
      <div style="height:128px;display:grid;align-items:end">${markSvg({ id: `l${i}`, size: s, detail: s >= 20, node: s >= 16 })}</div>
      <span style="font-size:11px;opacity:.45">${s}px</span></div>`).join("")}
  </div>`,
  { width: 900, height: 240, dark: false },
);

/* 3 — swapped glyph weight: compare current stems against a lighter variant. */
capture(
  "mark-hero",
  `<div style="display:flex;align-items:center;gap:48px">
    ${markSvg({ id: "hero", size: 240 })}
    <div style="display:grid;gap:22px">
      ${markSvg({ id: "hero2", size: 88 })}
      ${markSvg({ id: "hero3", size: 32 })}
      ${markSvg({ id: "hero4", size: 16 })}
    </div>
  </div>`,
  { width: 720, height: 340 },
);

/* 4 — the loader story, captured as real seeked frames. */
[8, 22, 38, 50, 62, 76].forEach((pct) => {
  capture(
    `loader-${String(pct).padStart(2, "0")}pct`,
    loaderFrame({ id: `f${pct}` }),
    { width: 420, height: 300, seekMs: Math.round((2400 * pct) / 100) },
  );
});

/* 5 — tab-strip simulation: the favicon at true size in a browser chrome. */
capture(
  "favicon-strip",
  `<div style="width:100%;height:100%;background:#1f2430;display:flex;align-items:flex-start;padding:0">
    <div style="display:flex;gap:0;height:38px;padding:0 8px;align-items:center">
      <div style="display:flex;align-items:center;gap:8px;height:32px;padding:0 14px;border-radius:8px 8px 0 0;background:#3a4150;color:#e6e9ef;font-size:12px">
        ${markSvg({ id: "fav16", size: 16, detail: false, node: false, palette: COMPACT })}
        <span>AlgoGuru — Master code…</span></div>
      <div style="display:flex;align-items:center;gap:8px;height:32px;padding:0 14px;border-radius:8px 8px 0 0;color:#9aa3b2;font-size:12px">
        ${markSvg({ id: "fav16b", size: 16, detail: false, node: false, palette: COMPACT })}
        <span>AlgoGuru</span></div>
    </div>
  </div>`,
  { width: 560, height: 60 },
);

rmSync(work, { recursive: true, force: true });
console.log(`Preview written to ${OUT}`);
