// Humanized floorplan images. Add more files to public/plantas/ and list them
// here; each unit gets one deterministically (stable across renders).

// 01/02/04 were landscape renders → rotated to vertical (…v.webp); 03 was already vertical.
export const PLANTAS = [
  "/plantas/01v.webp",
  "/plantas/02v.webp",
  "/plantas/03.webp",
  "/plantas/04v.webp",
];

// Each unit type maps to its own humanized plan: 1 dorm → 01, 2 → 02, 3 → 03.
export function plantaFor(bedrooms: number): string {
  const idx = Math.min(Math.max(bedrooms, 1), PLANTAS.length);
  return PLANTAS[idx - 1];
}

// Landscape (un-rotated) originals — same floorplan per unit as plantaFor, but in
// natural wide orientation for the full-screen expanded view.
export const PLANTAS_WIDE = [
  "/plantas/01.webp",
  "/plantas/02.webp",
  "/plantas/03h.webp", // 03 was portrait → rotated to landscape for the wide view
  "/plantas/04.webp",
];

export function plantaWideFor(bedrooms: number): string {
  const idx = Math.min(Math.max(bedrooms, 1), PLANTAS_WIDE.length);
  return PLANTAS_WIDE[idx - 1];
}
