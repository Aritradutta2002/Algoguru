/**
 * AlgoGuru brand asset generator.
 *
 *   npm run brand:assets
 *
 * Writes every static brand file in `public/`:
 *   - favicon.svg / favicon.ico / favicon-16x16.png / favicon-32x32.png
 *   - apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png
 *   - mask-icon.svg (Safari pinned tab) + site.webmanifest
 *   - brand/*.svg (mark variants, lockups, app icon)
 *   - og-image.png (1200×630 social card)
 *
 * Rasterising is done with a throwaway headless Chrome profile, so there is no
 * image dependency to install or keep patched. The geometry below mirrors
 * `src/components/brand/brandGeometry.ts` — keep the two in sync.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const BRAND = join(PUBLIC, "brand");

/* ── Geometry (mirrors brandGeometry.ts) ─────────────────────────── */

/** Superellipse (n = 4.6) sampled as a closed path — continuous curvature. */
const TILE = (() => {
  const n = 4.6;
  const steps = 128;
  const points = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = 32 + 32 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = 32 + 32 * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
})();

const STROKE = 7;
const STROKE_COMPACT = 8.4;
const LEGS = "M16.88 49.28 L32 14.72 L47.12 49.28";
const BAR = "M21.74 37.4 H42.26";
const NODE = { cx: 38.91, cy: 37.4, r: 2.6 };

const BADGE_STOPS = [
  ["0%", "#A6C2FF"],
  ["24%", "#6E97FB"],
  ["56%", "#3D6DF0"],
  ["80%", "#2249CE"],
  ["100%", "#122F92"],
];
const GLYPH_STOPS = [
  ["0%", "#FFFFFF"],
  ["52%", "#FBFDFF"],
  ["100%", "#EDF3FF"],
];
const BLUE = "#2F6BE8";
const INK = "#0B0F14";
const ACCENT = "#6FE3F8";
const ACCENT_DEEP = "#22D3EE";
const WORDMARK_FONT = "'Space Grotesk','Outfit','Inter',system-ui,sans-serif";

/** Small-size ramp: no near-white first stop, or the white letter vanishes. */
const BADGE_STOPS_COMPACT = [
  ["0%", "#6E9BFF"],
  ["48%", "#3568EA"],
  ["100%", "#17399F"],
];

/* ── SVG builders ────────────────────────────────────────────────── */

const stops = (id, compact = false) => {
  const table = id === "tile" ? (compact ? BADGE_STOPS_COMPACT : BADGE_STOPS) : GLYPH_STOPS;
  return table.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
};

/** The lit tile: gradient, bloom, gloss, shade, rim. */
const tileLayers = `<path d="${TILE}" fill="url(#tile)"/>
    <path d="${TILE}" fill="url(#bloom)"/>
    <path d="${TILE}" fill="url(#gloss)"/>
    <path d="${TILE}" fill="url(#shade)"/>
    <path d="${TILE}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>`;

function tileDefs({ detail = true, mono = false, compact = false } = {}) {
  return `<defs>
    <linearGradient id="tile" x1="4" y1="0" x2="60" y2="64" gradientUnits="userSpaceOnUse">${stops("tile", compact)}</linearGradient>
    ${
      mono
        ? ""
        : `<linearGradient id="ink" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">${stops("ink")}</linearGradient>`
    }
    ${
      detail
        ? `<radialGradient id="bloom" cx="0.86" cy="0.92" r="0.8">
            <stop offset="0%" stop-color="${ACCENT_DEEP}" stop-opacity="0.42"/>
            <stop offset="42%" stop-color="${ACCENT_DEEP}" stop-opacity="0.13"/>
            <stop offset="100%" stop-color="${ACCENT_DEEP}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="gloss" cx="0.2" cy="0.02" r="0.95">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.58"/>
            <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.17"/>
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="shade" x1="32" y1="26" x2="32" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#04102B" stop-opacity="0"/>
            <stop offset="100%" stop-color="#04102B" stop-opacity="0.3"/>
          </linearGradient>
          <linearGradient id="rim" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75"/>
            <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.1"/>
            <stop offset="70%" stop-color="#0A1B45" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#0A1B45" stop-opacity="0.38"/>
          </linearGradient>
          <filter id="lift" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="2.6" flood-color="#05132F" flood-opacity="0.3"/>
          </filter>`
        : ""
    }
    <radialGradient id="node" cx="0.34" cy="0.28" r="0.82">
      <stop offset="0%" stop-color="#B7F4FF"/>
      <stop offset="52%" stop-color="#4FD8F2"/>
      <stop offset="100%" stop-color="#1C9EC4"/>
    </radialGradient>
  </defs>`;
}

const glyph = ({ stroke = STROKE, color = "url(#ink)", lift = true } = {}) =>
  `<g${lift ? ' filter="url(#lift)"' : ""} fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="${LEGS}"/><path d="${BAR}"/></g>`;

const nodeDot = (fill = "url(#node)") =>
  `<circle cx="${NODE.cx}" cy="${NODE.cy}" r="${NODE.r}" fill="${fill}"/>`;

function markSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="t">
  <title id="t">AlgoGuru</title>
  ${tileDefs()}
  ${tileLayers}
  ${glyph()}
  ${nodeDot()}
</svg>
`;
}

function monoMarkSvg(reverse = false) {
  const tileFill = reverse ? "#FFFFFF" : INK;
  const inkColor = reverse ? INK : "#FFFFFF";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="t">
  <title id="t">AlgoGuru</title>
  ${tileDefs({ detail: false, mono: true })}
  <path d="${TILE}" fill="${tileFill}"/>
  ${glyph({ color: inkColor, lift: false })}
  ${nodeDot(reverse ? BLUE : ACCENT)}
</svg>
`;
}

/**
 * App icon artwork at native 64-space so every gradient resolves exactly as it
 * does in the app. `bleed` produces the full-bleed square that iOS/Android mask
 * themselves; the default keeps the superellipse tile on transparency.
 */
function appIconSvg({ size = 512, bleed = false } = {}) {
  const body = bleed
    ? `<rect width="64" height="64" fill="url(#tile)"/>
       <rect width="64" height="64" fill="url(#bloom)"/>
       <rect width="64" height="64" fill="url(#gloss)"/>
       <rect width="64" height="64" fill="url(#shade)"/>`
    : tileLayers;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-labelledby="t">
  <title id="t">AlgoGuru</title>
  ${tileDefs()}
  ${body}
  ${bleed ? "" : `<path d="${TILE}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>`}
  ${glyph({ stroke: bleed ? 6.4 : STROKE })}
  ${nodeDot()}
</svg>
`;
}

function faviconSvg() {
  // 16px first: no bloom/gloss/shade/rim and no node — those layers only add
  // mud at tab size. What matters is contrast, so the tile drops to the
  // compact ramp (the near-white first stop washes the apex out) and the
  // letter carries a heavier stroke to keep its counter open.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  ${tileDefs({ detail: false, mono: true, compact: true })}
  <path d="${TILE}" fill="url(#tile)"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="${STROKE_COMPACT}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${LEGS}"/>
    <path d="${BAR}"/>
  </g>
</svg>
`;
}

function maskIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <g fill="none" stroke="#000000" stroke-width="${STROKE_COMPACT}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${LEGS}"/>
    <path d="${BAR}"/>
  </g>
</svg>
`;
}

function lockupSvg(orientation = "horizontal") {
  const horizontal = orientation === "horizontal";
  const w = horizontal ? 268 : 200;
  const h = horizontal ? 64 : 180;
  const markMarkup = `${tileLayers}${glyph()}${nodeDot()}`;
  const badgeGroup = horizontal
    ? markMarkup
    : `<svg x="52" y="14" width="96" height="96" viewBox="0 0 64 64">${markMarkup}</svg>`;
  const text = horizontal
    ? `<text x="82" y="43.5" font-family="${WORDMARK_FONT}" font-size="33" font-weight="600" letter-spacing="-0.9"><tspan fill="${INK}">Algo</tspan><tspan fill="${BLUE}">Guru</tspan></text>`
    : `<text x="100" y="158" text-anchor="middle" font-family="${WORDMARK_FONT}" font-size="38" font-weight="600" letter-spacing="-1"><tspan fill="${INK}">Algo</tspan><tspan fill="${BLUE}">Guru</tspan></text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t">
  <title id="t">AlgoGuru</title>
  ${tileDefs()}
  ${badgeGroup}
  ${text}
</svg>
`;
}

/* ── Rasterising ─────────────────────────────────────────────────── */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findBrowser() {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      "No Chrome/Edge binary found. Set CHROME_PATH to a Chromium-based browser to regenerate icons.",
    );
  }
  return found;
}

const work = mkdtempSync(join(tmpdir(), "algoguru-brand-"));
let browser;
let renderCount = 0;

/**
 * Chrome occasionally wedges when several headless instances share one profile
 * directory, so every capture gets a throwaway profile and one retry.
 */
function runChrome(args, { out, timeout = 30000 } = {}) {
  const profile = join(work, `profile-${renderCount++}`);
  const finalArgs = [`--user-data-dir=${profile}`, ...args];

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      execFileSync(browser, finalArgs, { stdio: "ignore", timeout });
      if (!out || existsSync(out)) return;
    } catch {
      if (out && existsSync(out)) return;
    }
  }

  throw new Error(`Render failed after 3 attempts: ${out ?? finalArgs.join(" ")}`);
}

function render(svg, { width, height, out, background = "transparent" }) {
  // Pin the SVG to the exact capture size in CSS. Percentage sizing is a trap
  // here: `height:100%` against an auto-height <body> falls back to the SVG's
  // intrinsic ratio, which renders it far larger than the screenshot.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${width}px;height:${height}px;background:${background};overflow:hidden}
    svg{display:block;width:${width}px;height:${height}px}
  </style></head><body>${svg}</body></html>`;

  const page = join(work, `page-${width}x${height}.html`);
  writeFileSync(page, html, "utf8");
  console.log(`  · ${width}×${height} → ${out.split(/[\\/]/).pop()}`);

  runChrome(
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      "--default-background-color=00000000",
      "--virtual-time-budget=2500",
      `--screenshot=${out}`,
      `file:///${page.replace(/\\/g, "/")}`,
    ],
    { out },
  );
}

/** Multi-resolution .ico with PNG payloads (valid for every size ≤ 256). */
function writeIco(out, entries) {
  const images = entries.map(({ file, size }) => ({ size, data: readFileSync(file) }));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const directory = Buffer.alloc(images.length * 16);

  images.forEach(({ size, data }, index) => {
    const at = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at);
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  writeFileSync(out, Buffer.concat([header, directory, ...images.map((i) => i.data)]));
}

/* ── Social card ─────────────────────────────────────────────────── */

function ogImageHtml() {
  const mark = `<svg viewBox="0 0 64 64" width="72" height="72">${tileDefs()}${tileLayers}${glyph()}${nodeDot()}</svg>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1200px;height:630px;background:#060A12;overflow:hidden;position:relative;
      font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;color:#F8FAFC}
    .glow{position:absolute;border-radius:9999px;filter:blur(90px)}
    .glow.a{width:620px;height:620px;left:-160px;top:-220px;background:rgba(47,107,232,.40)}
    .glow.b{width:540px;height:540px;right:-140px;bottom:-220px;background:rgba(56,189,248,.20)}
    .grid{position:absolute;inset:0;
      background-image:linear-gradient(to right,rgba(148,163,184,.10) 1px,transparent 1px),
        linear-gradient(to bottom,rgba(148,163,184,.10) 1px,transparent 1px);
      background-size:48px 48px;
      mask-image:radial-gradient(ellipse at 50% 40%,#000 25%,transparent 78%)}
    .frame{position:absolute;inset:40px;border:1px solid rgba(148,163,184,.16);border-radius:28px}
    .content{position:relative;padding:84px 96px 0;height:100%}
    .brand{display:flex;align-items:center;gap:18px}
    .brand svg{filter:drop-shadow(0 14px 30px rgba(10,25,70,.55))}
    .wordmark{font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;font-size:38px;
      letter-spacing:-.02em;line-height:1}
    .wordmark .g{color:#4C8DFF}
    h1{margin-top:48px;font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;
      font-size:68px;line-height:1.05;letter-spacing:-.035em}
    h1 .accent{background:linear-gradient(100deg,#7FB2FF,#4C8DFF 45%,#38BDF8);
      -webkit-background-clip:text;background-clip:text;color:transparent}
    p.sub{margin-top:20px;font-size:21px;line-height:1.45;color:#A7B4C6;max-width:1000px}
    .chips{margin-top:30px;display:flex;gap:12px}
    .chip{padding:11px 19px;border-radius:9999px;border:1px solid rgba(148,163,184,.24);
      background:rgba(148,163,184,.08);font-size:17px;font-weight:500;color:#D7E1EE}
    .foot{position:absolute;left:96px;bottom:52px;display:flex;align-items:center;gap:14px;
      font-size:14px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#7C8CA3}
    .foot .dot{width:5px;height:5px;border-radius:9999px;background:#2F6BE8}
  </style></head><body>
    <div class="glow a"></div>
    <div class="glow b"></div>
    <div class="grid"></div>
    <div class="frame"></div>
    <div class="content">
      <div class="brand">${mark}<div class="wordmark">Algo<span class="g">Guru</span></div></div>
      <h1>Master code.<br><span class="accent">Ace interviews.</span></h1>
      <p class="sub">Structured DSA paths, system design, curated interview questions and an in-browser coding workspace.</p>
      <div class="chips">
        <div class="chip">500+ curated problems</div>
        <div class="chip">40+ deep topics</div>
        <div class="chip">Free forever</div>
      </div>
      <div class="foot">AlgoGuru<span class="dot"></span>Focused practice</div>
    </div>
  </body></html>`;
}

/* ── Run ─────────────────────────────────────────────────────────── */

mkdirSync(BRAND, { recursive: true });
browser = findBrowser();
console.log(`Using ${browser}`);

// Versioned SVGs (public/brand)
console.log("Writing brand SVGs…");
writeFileSync(join(BRAND, "algoguru-mark.svg"), markSvg());
writeFileSync(join(BRAND, "algoguru-mark-mono.svg"), monoMarkSvg(false));
writeFileSync(join(BRAND, "algoguru-mark-reverse.svg"), monoMarkSvg(true));
writeFileSync(join(BRAND, "algoguru-app-icon.svg"), appIconSvg());
writeFileSync(join(BRAND, "algoguru-lockup-horizontal.svg"), lockupSvg("horizontal"));
writeFileSync(join(BRAND, "algoguru-lockup-stacked.svg"), lockupSvg("stacked"));

// Favicons + mask
writeFileSync(join(PUBLIC, "favicon.svg"), faviconSvg());
writeFileSync(join(PUBLIC, "mask-icon.svg"), maskIconSvg());

// PWA manifest — kept beside the icons it references so the two can't drift.
writeFileSync(
  join(PUBLIC, "site.webmanifest"),
  `${JSON.stringify(
    {
      name: "AlgoGuru — Master code. Ace interviews.",
      short_name: "AlgoGuru",
      description:
        "Structured DSA paths, system design, curated interview questions and an in-browser coding workspace.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#07090D",
      theme_color: "#07090D",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    null,
    2,
  )}\n`,
);

// Raster icons
const renderTarget = (name) => join(work, name);

const favicon48 = renderTarget("favicon-48.png");
const favicon32 = renderTarget("favicon-32.png");
const favicon16 = renderTarget("favicon-16.png");
render(faviconSvg(), { width: 48, height: 48, out: favicon48 });
render(faviconSvg(), { width: 32, height: 32, out: favicon32 });
render(faviconSvg(), { width: 16, height: 16, out: favicon16 });

writeFileSync(join(PUBLIC, "favicon-32x32.png"), readFileSync(favicon32));
writeFileSync(join(PUBLIC, "favicon-16x16.png"), readFileSync(favicon16));
writeIco(join(PUBLIC, "favicon.ico"), [
  { file: favicon16, size: 16 },
  { file: favicon32, size: 32 },
  { file: favicon48, size: 48 },
]);

render(appIconSvg({ size: 180, bleed: true }), {
  width: 180,
  height: 180,
  out: join(PUBLIC, "apple-touch-icon.png"),
});
render(appIconSvg({ size: 192 }), { width: 192, height: 192, out: join(PUBLIC, "icon-192.png") });
render(appIconSvg({ size: 512 }), { width: 512, height: 512, out: join(PUBLIC, "icon-512.png") });
render(appIconSvg({ size: 512, bleed: true }), {
  width: 512,
  height: 512,
  out: join(PUBLIC, "icon-maskable-512.png"),
});

// Social card
console.log("Rendering social card…");
const ogPage = join(work, "og.html");
writeFileSync(ogPage, ogImageHtml(), "utf8");
runChrome(
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--virtual-time-budget=4000",
    `--screenshot=${join(PUBLIC, "og-image.png")}`,
    `file:///${ogPage.replace(/\\/g, "/")}`,
  ],
  { out: join(PUBLIC, "og-image.png"), timeout: 45000 },
);

rmSync(work, { recursive: true, force: true });

console.log("Brand assets written to public/ and public/brand/.");
