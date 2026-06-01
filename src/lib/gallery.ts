// Mock gallery inventory for the demo. Images are placeholder hero frames
// (day/night) until real renders arrive. Swap `src` for real assets later.

export const CATEGORIES = [
  "Exterior",
  "Interiors",
  "Amenities",
  "Details",
  "Views",
  "Architecture",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Shot = {
  id: string;
  category: Category;
  src: string;
  title: string;
};

function frame(mood: "day" | "night", n: number): string {
  return `/frames/hero/${mood}/${String(n).padStart(4, "0")}.jpg`;
}

// Distinct frame picks per category so the grid looks varied.
const PICKS: Record<Category, Array<["day" | "night", number]>> = {
  Exterior: [["day", 8], ["day", 28], ["day", 50], ["night", 70], ["day", 95], ["night", 112]],
  Interiors: [["night", 14], ["night", 40], ["day", 60], ["night", 88], ["day", 104]],
  Amenities: [["day", 18], ["day", 46], ["night", 64], ["day", 82], ["night", 100]],
  Details: [["night", 22], ["day", 38], ["night", 54], ["day", 78]],
  Views: [["day", 4], ["day", 34], ["night", 58], ["day", 90], ["night", 116]],
  Architecture: [["night", 12], ["day", 44], ["night", 72], ["day", 108]],
};

export const SHOTS: Shot[] = CATEGORIES.flatMap((cat) =>
  PICKS[cat].map(([mood, n], i) => ({
    id: `${cat}-${i + 1}`,
    category: cat,
    src: frame(mood, n),
    title: `${cat} ${String(i + 1).padStart(2, "0")}`,
  }))
);
