// Placeholder hero frame generator for Zytro demo.
// Renders an SVG per frame (cinematic skyline + arcing sun + camera push-in)
// and rasterizes to JPEG via sharp. Proves the scroll-scrub image-sequence
// mechanism with a real frame set until real client renders arrive.
//
// Output: public/frames/hero/0001.jpg ... NNNN.jpg + manifest.json
// Run:    node scripts/gen-frames.mjs

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const N = 120;
const W = 1600;
const H = 900;
const QUALITY = 72;
const OUT = join(process.cwd(), "public", "frames", "hero");

const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n, w = 4) => String(n).padStart(w, "0");

// Deterministic skyline so every frame is consistent (only camera/sun move).
function buildings(seed, count, baseY, color, wMin, wMax, hMin, hMax) {
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const rects = [];
  let x = -40;
  while (x < W + 40) {
    const bw = lerp(wMin, wMax, rng());
    const bh = lerp(hMin, hMax, rng());
    rects.push({ x, y: baseY - bh, w: bw, h: bh + 200 });
    x += bw + lerp(6, 22, rng());
  }
  return rects
    .map(
      (r) =>
        `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(
          1
        )}" height="${r.h.toFixed(1)}" fill="${color}" />`
    )
    .join("");
}

// Window grid for the hero tower.
function towerWindows(tx, ty, tw, th) {
  const cols = 7;
  const rows = 26;
  const gapx = tw / (cols + 1);
  const gapy = th / (rows + 1);
  let out = "";
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const lit = (r * 31 + c * 17) % 5 === 0;
      const wx = tx + gapx * c - 3;
      const wy = ty + gapy * r - 5;
      out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="10" rx="1" fill="${
        lit ? "#ffd9a0" : "#11233a"
      }" opacity="${lit ? 0.85 : 0.5}" />`;
    }
  }
  return out;
}

function frameSVG(t) {
  // Camera push-in: hero tower scales up and the whole scene drifts slightly.
  const push = lerp(1.0, 1.14, t);
  const driftY = lerp(0, 26, t);
  const horizon = 560 + driftY * 0.4;

  // Sun arcs left→right and rises then sets (parabola).
  const sunX = lerp(180, W - 180, t);
  const sunY = lerp(420, 150, Math.sin(t * Math.PI)) + 0 - Math.sin(t * Math.PI) * 90;

  // Hero tower geometry (centered), grows with push-in.
  const towerW = 150 * push;
  const towerH = 470 * push;
  const towerX = W / 2 - towerW / 2;
  const towerY = horizon - towerH + 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16314f"/>
      <stop offset="0.45" stop-color="#34618c"/>
      <stop offset="0.78" stop-color="#9fb6c4"/>
      <stop offset="1" stop-color="#e6cba0"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff4d6" stop-opacity="0.95"/>
      <stop offset="0.35" stop-color="#ffd98f" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffd98f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#05101c" stop-opacity="0.7"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>

  <!-- sun -->
  <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="160" fill="url(#sunGlow)"/>
  <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="34" fill="#fff1cf"/>

  <!-- far mountains -->
  <path d="M0 ${(horizon - 120).toFixed(1)} L260 ${(horizon - 210).toFixed(
    1
  )} L520 ${(horizon - 130).toFixed(1)} L820 ${(horizon - 240).toFixed(
    1
  )} L1180 ${(horizon - 150).toFixed(1)} L${W} ${(horizon - 200).toFixed(
    1
  )} L${W} ${H} L0 ${H} Z" fill="#2b4a66" opacity="0.55"/>

  <!-- back skyline -->
  <g opacity="0.7">${buildings(7, 30, horizon, "#22405b", 26, 70, 60, 230)}</g>
  <!-- mid skyline -->
  <g>${buildings(19, 30, horizon + 18, "#172e44", 34, 96, 90, 300)}</g>

  <!-- hero tower -->
  <rect x="${towerX.toFixed(1)}" y="${towerY.toFixed(1)}" width="${towerW.toFixed(
    1
  )}" height="${towerH.toFixed(1)}" rx="3" fill="#0f2236"/>
  <rect x="${towerX.toFixed(1)}" y="${towerY.toFixed(1)}" width="${(
    towerW * 0.5
  ).toFixed(1)}" height="${towerH.toFixed(1)}" fill="#13283f" opacity="0.7"/>
  ${towerWindows(towerX, towerY, towerW, towerH)}

  <!-- foreground vignette for HUD legibility -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (let i = 1; i <= N; i++) {
    const t = (i - 1) / (N - 1);
    const svg = frameSVG(t);
    const buf = Buffer.from(svg);
    await sharp(buf).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(
      join(OUT, `${pad(i)}.jpg`)
    );
    if (i % 20 === 0 || i === N) process.stdout.write(`  ${i}/${N}\n`);
  }

  const manifest = {
    kind: "hero",
    count: N,
    width: W,
    height: H,
    ext: "jpg",
    pattern: "/frames/hero/{n}.jpg",
    pad: 4,
    note: "Placeholder frames (procedural). Swap for real AVIF renders per docs/asset-encoding-contract.",
  };
  await writeFile(
    join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  process.stdout.write(`Done: ${N} frames + manifest at public/frames/hero/\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
