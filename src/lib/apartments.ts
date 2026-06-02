// Mock apartment inventory for the demo. Deterministic so the unit stack is
// stable across renders. Swap for real data (Supabase) in the production build.

export type UnitStatus = "available" | "reserved" | "sold" | "highlight";
export type Orientation = "N" | "S" | "L" | "O";
export type ViewType = "Cidade" | "Parque" | "Mar" | "Montanha";

export type Unit = {
  id: string;
  label: string; // e.g. "1203"
  floor: number;
  line: string; // A | B | C
  area: number; // m²
  bedrooms: number;
  suites: number;
  parking: number;
  price: number; // BRL
  status: UnitStatus;
  orientation: Orientation;
  view: ViewType;
};

const LINES = ["A", "B"] as const;
const ORIENT: Orientation[] = ["N", "S", "L", "O"];
const VIEWS: ViewType[] = ["Cidade", "Parque", "Mar", "Montanha"];

// Small deterministic PRNG.
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildUnits(): Unit[] {
  const rng = mulberry(20260601);
  const units: Unit[] = [];
  const FLOORS = 15; // floors 2..16
  for (let f = FLOORS + 1; f >= 2; f--) {
    LINES.forEach((line, li) => {
      const r = rng();
      let status: UnitStatus = "available";
      if (r > 0.82) status = "sold";
      else if (r > 0.66) status = "reserved";
      else if (r < 0.08) status = "highlight";

      const bedrooms = 1 + ((f + li) % 4); // 1..4
      const suites = Math.max(1, bedrooms - 1 - (li % 2));
      const area = 48 + bedrooms * 22 + Math.round(rng() * 18);
      const parking = bedrooms >= 3 ? 2 : 1;
      const basePrice = 620_000 + area * 9_800 + f * 26_000;
      const price = Math.round((basePrice + (status === "highlight" ? 180_000 : 0)) / 1000) * 1000;

      units.push({
        id: `${f}${line}`,
        label: `${f}${line === "A" ? "01" : "02"}`,
        floor: f,
        line,
        area,
        bedrooms,
        suites,
        parking,
        price,
        status,
        orientation: ORIENT[(f + li) % ORIENT.length],
        view: VIEWS[(f * 2 + li) % VIEWS.length],
      });
    });
  }
  return units;
}

export const UNITS: Unit[] = buildUnits();

export const STATUS_META: Record<
  UnitStatus,
  { label: string; dot: string; ring: string }
> = {
  available: { label: "Disponível", dot: "#34d399", ring: "ring-emerald-400/60" },
  reserved: { label: "Reservado", dot: "#fbbf24", ring: "ring-amber-400/60" },
  sold: { label: "Vendido", dot: "#6b7280", ring: "ring-gray-400/40" },
  highlight: { label: "Destaque", dot: "#7c5cff", ring: "ring-accent/70" },
};

export type Filters = {
  priceMax: number;
  bedrooms: number | null;
  suites: number | null;
  floorMin: number;
  floorMax: number;
  orientation: Orientation | null;
  view: ViewType | null;
};

export const PRICE_CAP = Math.max(...UNITS.map((u) => u.price));
export const PRICE_FLOOR = Math.min(...UNITS.map((u) => u.price));
export const FLOOR_MIN = Math.min(...UNITS.map((u) => u.floor));
export const FLOOR_MAX = Math.max(...UNITS.map((u) => u.floor));

export const DEFAULT_FILTERS: Filters = {
  priceMax: PRICE_CAP,
  bedrooms: null,
  suites: null,
  floorMin: FLOOR_MIN,
  floorMax: FLOOR_MAX,
  orientation: null,
  view: null,
};

export function matches(u: Unit, f: Filters): boolean {
  if (u.price > f.priceMax) return false;
  if (f.bedrooms != null && u.bedrooms !== f.bedrooms) return false;
  if (f.suites != null && u.suites !== f.suites) return false;
  if (u.floor < f.floorMin || u.floor > f.floorMax) return false;
  if (f.orientation != null && u.orientation !== f.orientation) return false;
  if (f.view != null && u.view !== f.view) return false;
  return true;
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}
