// Hero frame-sequence descriptor. Mirrors public/frames/hero/manifest.json.
// When real renders arrive, regenerate frames per docs and keep this in sync
// (or fetch the manifest at runtime). Kept static here for a zero-fetch demo.

export const HERO = {
  count: 120,
  pad: 4,
  ext: "jpg",
  width: 1600,
  height: 900,
  basePath: "/frames/hero",
} as const;

export function frameUrl(n: number): string {
  const idx = Math.min(Math.max(n, 1), HERO.count);
  return `${HERO.basePath}/${String(idx).padStart(HERO.pad, "0")}.${HERO.ext}`;
}

export function posterUrl(): string {
  return frameUrl(1);
}
