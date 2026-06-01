// Placeholder hero frame generator for Zytro demo.
// Renders TWO mood sets (day + night) with identical camera/geometry — only
// sky, celestial body, window lighting and grade change — so the runtime can
// cross-fade between them in place (no flicker, scroll preserved).
// Rasterizes SVG → JPEG via sharp.
//
// Output: public/frames/hero/<mood>/0001.jpg ... + public/frames/hero/manifest.json
// Run:    node scripts/gen-frames.mjs

import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const N = 120;
const W = 1600;
const H = 900;
const QUALITY = 72;
const ROOT = join(process.cwd(), "public", "frames", "hero");

const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n, w = 4) => String(n).padStart(w, "0");

const MOODS = {
  day: {
    sky: ["#16314f", "#34618c", "#9fb6c4", "#e6cba0"],
    glow: "#ffd98f",
    disc: "#fff1cf",
    discR: 34,
    glowR: 160,
    mtn: "#2b4a66",
    mtnOp: 0.55,
    back: "#22405b",
    mid: "#172e44",
    tower: "#0f2236",
    towerShade: "#13283f",
    litMod: 5,
    litColor: "#ffd9a0",
    unlit: "#11233a",
    horizonGlow: "none",
    vig: 0.7,
  },
  night: {
    sky: ["#01040b", "#061328", "#0b1d33", "#172a40"],
    glow: "#b9c8e6",
    disc: "#eef4ff",
    discR: 28,
    glowR: 120,
    mtn: "#0e1f30",
    mtnOp: 0.6,
    back: "#0d1d30",
    mid: "#0a1726",
    tower: "#070f1b",
    towerShade: "#0b1726",
    litMod: 3,
    litColor: "#ffce8f",
    unlit: "#0a1422",
    horizonGlow: "#3a4a63",
    vig: 0.82,
  },
};

function buildings(seed, baseY, color, wMin, wMax, hMin, hMax) {
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

function towerWindows(tx, ty, tw, th, m) {
  const cols = 7;
  const rows = 26;
  const gapx = tw / (cols + 1);
  const gapy = th / (rows + 1);
  let out = "";
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const lit = (r * 31 + c * 17) % m.litMod === 0;
      const wx = tx + gapx * c - 3;
      const wy = ty + gapy * r - 5;
      out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="10" rx="1" fill="${
        lit ? m.litColor : m.unlit
      }" opacity="${lit ? 0.9 : 0.5}" />`;
    }
  }
  return out;
}

function frameSVG(t, m, isNight) {
  const push = lerp(1.0, 1.14, t);
  const driftY = lerp(0, 26, t);
  const horizon = 560 + driftY * 0.4;

  const sunX = lerp(180, W - 180, t);
  const sunY = lerp(420, 150, Math.sin(t * Math.PI)) - Math.sin(t * Math.PI) * 90;

  const towerW = 150 * push;
  const towerH = 470 * push;
  const towerX = W / 2 - towerW / 2;
  const towerY = horizon - towerH + 40;

  const [s0, s1, s2, s3] = m.sky;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s0}"/>
      <stop offset="0.45" stop-color="${s1}"/>
      <stop offset="0.78" stop-color="${s2}"/>
      <stop offset="1" stop-color="${s3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${m.disc}" stop-opacity="0.95"/>
      <stop offset="0.35" stop-color="${m.glow}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${m.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#03080f" stop-opacity="${m.vig}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${
    isNight
      ? `<rect x="0" y="${(horizon - 90).toFixed(
          1
        )}" width="${W}" height="160" fill="${m.horizonGlow}" opacity="0.25"/>`
      : ""
  }

  <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${m.glowR}" fill="url(#glow)"/>
  <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${m.discR}" fill="${m.disc}"/>

  <path d="M0 ${(horizon - 120).toFixed(1)} L260 ${(horizon - 210).toFixed(
    1
  )} L520 ${(horizon - 130).toFixed(1)} L820 ${(horizon - 240).toFixed(
    1
  )} L1180 ${(horizon - 150).toFixed(1)} L${W} ${(horizon - 200).toFixed(
    1
  )} L${W} ${H} L0 ${H} Z" fill="${m.mtn}" opacity="${m.mtnOp}"/>

  <g opacity="0.7">${buildings(7, horizon, m.back, 26, 70, 60, 230)}</g>
  <g>${buildings(19, horizon + 18, m.mid, 34, 96, 90, 300)}</g>

  <rect x="${towerX.toFixed(1)}" y="${towerY.toFixed(1)}" width="${towerW.toFixed(
    1
  )}" height="${towerH.toFixed(1)}" rx="3" fill="${m.tower}"/>
  <rect x="${towerX.toFixed(1)}" y="${towerY.toFixed(1)}" width="${(
    towerW * 0.5
  ).toFixed(1)}" height="${towerH.toFixed(1)}" fill="${m.towerShade}" opacity="0.7"/>
  ${towerWindows(towerX, towerY, towerW, towerH, m)}

  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

async function genMood(name) {
  const out = join(ROOT, name);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const m = MOODS[name];
  const isNight = name === "night";
  for (let i = 1; i <= N; i++) {
    const t = (i - 1) / (N - 1);
    const svg = frameSVG(t, m, isNight);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(join(out, `${pad(i)}.jpg`));
  }
  process.stdout.write(`  ${name}: ${N} frames\n`);
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  for (const name of Object.keys(MOODS)) await genMood(name);

  const manifest = {
    kind: "hero",
    moods: Object.keys(MOODS),
    count: N,
    width: W,
    height: H,
    ext: "jpg",
    pattern: "/frames/hero/{mood}/{n}.jpg",
    pad: 4,
    note: "Placeholder frames (procedural). Swap for real AVIF renders per docs/asset-encoding-contract; keep day/night aligned (identical camera).",
  };
  await writeFile(
    join(ROOT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  process.stdout.write(`Done: ${Object.keys(MOODS).length} moods × ${N} frames\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
