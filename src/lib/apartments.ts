// Mock apartment inventory for the demo. Deterministic so the unit grid is
// stable across renders. Swap for real data (Supabase) in the production build.

export type UnitStatus = "available" | "reserved" | "sold";
export type Orientation = "N" | "S" | "L" | "O";
export type ViewType = "Cidade" | "Parque" | "Mar" | "Montanha";

export type Unit = {
  id: string;
  label: string; // e.g. "1203"
  floor: number;
  line: string; // A | B
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
      if (r > 0.8) status = "sold";
      else if (r > 0.62) status = "reserved";

      const bedrooms = 1 + ((f + li) % 3); // 1..3
      const suites = Math.max(1, bedrooms - 1 - (li % 2));
      const area = 48 + bedrooms * 22 + Math.round(rng() * 18);
      const parking = bedrooms >= 3 ? 2 : 1;
      const price = Math.round((620_000 + area * 9_800 + f * 26_000) / 1000) * 1000;

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

// Status palette mirrors the reference: disponível = violet, vendido = red,
// reservado = yellow. `plural` is used in the status filter legend.
export const STATUS_META: Record<
  UnitStatus,
  { label: string; plural: string; dot: string }
> = {
  available: { label: "Disponível", plural: "Disponíveis", dot: "#8b5cf6" },
  reserved: { label: "Reservado", plural: "Reservados", dot: "#f5c518" },
  sold: { label: "Vendido", plural: "Vendidos", dot: "#e5484d" },
};

export const STATUS_ORDER: UnitStatus[] = ["sold", "available", "reserved"];

export type Filters = {
  floorMin: number;
  floorMax: number;
  bedrooms: number | null;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  active: UnitStatus[]; // selected statuses; empty = show all
};

export const PRICE_CAP = Math.max(...UNITS.map((u) => u.price));
export const PRICE_FLOOR = Math.min(...UNITS.map((u) => u.price));
export const FLOOR_MIN = Math.min(...UNITS.map((u) => u.floor));
export const FLOOR_MAX = Math.max(...UNITS.map((u) => u.floor));
export const AREA_CAP = Math.max(...UNITS.map((u) => u.area));
export const AREA_FLOOR = Math.min(...UNITS.map((u) => u.area));

export const DEFAULT_FILTERS: Filters = {
  floorMin: FLOOR_MIN,
  floorMax: FLOOR_MAX,
  bedrooms: null,
  priceMin: PRICE_FLOOR,
  priceMax: PRICE_CAP,
  areaMin: AREA_FLOOR,
  areaMax: AREA_CAP,
  active: [...STATUS_ORDER], // all statuses lit by default
};

export function matches(u: Unit, f: Filters): boolean {
  if (f.active.length > 0 && !f.active.includes(u.status)) return false;
  if (u.floor < f.floorMin || u.floor > f.floorMax) return false;
  if (f.bedrooms != null && u.bedrooms !== f.bedrooms) return false;
  if (u.price < f.priceMin || u.price > f.priceMax) return false;
  if (u.area < f.areaMin || u.area > f.areaMax) return false;
  return true;
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}
