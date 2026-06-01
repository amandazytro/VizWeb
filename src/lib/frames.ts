// Hero frame-sequence descriptor. Mirrors public/frames/hero/manifest.json.
// Two aligned mood sets (day/night) share identical camera/geometry so the
// runtime can cross-fade between them. Swap for real AVIF renders later and
// keep this in sync (or fetch the manifest at runtime).

export const MOODS = ["day", "night"] as const;
export type Mood = (typeof MOODS)[number];

export const HERO = {
  count: 120,
  pad: 4,
  ext: "jpg",
  width: 1600,
  height: 900,
  basePath: "/frames/hero",
} as const;

export function frameUrl(mood: Mood, n: number): string {
  const idx = Math.min(Math.max(n, 1), HERO.count);
  return `${HERO.basePath}/${mood}/${String(idx).padStart(HERO.pad, "0")}.${HERO.ext}`;
}

export function posterUrl(mood: Mood = "day"): string {
  return frameUrl(mood, 1);
}
