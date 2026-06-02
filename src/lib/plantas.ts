// Humanized floorplan images. Add more files to public/plantas/ and list them
// here; each unit gets one deterministically (stable across renders).

export const PLANTAS = [
  "/plantas/01.webp",
  "/plantas/02.webp",
  "/plantas/03.webp",
  "/plantas/04.webp",
];

export function plantaFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLANTAS[h % PLANTAS.length];
}
