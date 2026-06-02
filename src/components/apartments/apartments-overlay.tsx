"use client";

import { useEffect, useMemo, useState } from "react";
import { useExperience } from "@/lib/store";
import {
  UNITS,
  STATUS_META,
  DEFAULT_FILTERS,
  PRICE_FLOOR,
  PRICE_CAP,
  FLOOR_MIN,
  FLOOR_MAX,
  matches,
  formatBRL,
  type Unit,
  type Filters,
  type Orientation,
  type ViewType,
} from "@/lib/apartments";

const ORIENTATIONS: Orientation[] = ["N", "S", "E", "W"];
const VIEWS: ViewType[] = ["City", "Park", "Ocean", "Mountain"];

// Hero image natural size (public/hero/diurno.webp). The tower facade is a
// perspective QUAD (4 corners in image-percent); a uniform floor×line grid is
// mapped through a square→quad homography, so cells become trapezoids that
// follow the building's perspective. Recalibrate by editing FACADE_QUAD
// (TL, TR, BR, BL) — replace with the user's annotated corners for an exact fit.
const IMG_W = 1713;
const IMG_H = 960;

type Pt = [number, number];
type Quad = { TL: Pt; TR: Pt; BR: Pt; BL: Pt };

// The tower shows two faces meeting at a central seam. Each face is a quad
// (image-%) and carries a subset of the unit lines. Floor rows are uniform in
// facade space; the homography handles perspective. Calibrated from the user's
// rainbow-annotated render (same composition as diurno.webp).
const FACES: { quad: Quad; lines: string[] }[] = [
  {
    // left tower slab — one column of units (no internal division)
    quad: { TL: [38.0, 16.0], TR: [49.4, 16.0], BR: [49.4, 88.0], BL: [38.0, 88.0] },
    lines: ["A"],
  },
  {
    // right tower slab — one column, mirrors the left
    quad: { TL: [50.2, 16.0], TR: [62.0, 16.0], BR: [62.0, 88.0], BL: [50.2, 88.0] },
    lines: ["B"],
  },
];

// line → which face + its column within that face
const LINE_FACE: Record<string, { face: number; col: number; cols: number }> = (() => {
  const m: Record<string, { face: number; col: number; cols: number }> = {};
  FACES.forEach((f, fi) =>
    f.lines.forEach((ln, ci) => (m[ln] = { face: fi, col: ci, cols: f.lines.length }))
  );
  return m;
})();

const FLOORS = Array.from(new Set(UNITS.map((u) => u.floor))).sort((a, b) => b - a);
const ROWS = FLOORS.length;

// object-cover mapping: image-% point → screen px (image centered, cover-fit).
function coverPoint(px: number, py: number, w: number, h: number): Pt {
  const scale = Math.max(w / IMG_W, h / IMG_H);
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  const offX = (w - dispW) / 2;
  const offY = (h - dispH) / 2;
  return [offX + (px / 100) * dispW, offY + (py / 100) * dispH];
}

// Unit square (u,v)∈[0,1] → quad (projective). Heckbert square-to-quad.
function makeQuadMap(p0: Pt, p1: Pt, p2: Pt, p3: Pt) {
  const ax = p0[0] - p1[0] + p2[0] - p3[0];
  const ay = p0[1] - p1[1] + p2[1] - p3[1];
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, hh: number;
  if (Math.abs(ax) < 1e-6 && Math.abs(ay) < 1e-6) {
    a = p1[0] - p0[0]; b = p2[0] - p1[0]; c = p0[0];
    d = p1[1] - p0[1]; e = p2[1] - p1[1]; f = p0[1];
    g = 0; hh = 0;
  } else {
    const bx = p1[0] - p2[0], by = p1[1] - p2[1];
    const cx = p3[0] - p2[0], cy = p3[1] - p2[1];
    const det = bx * cy - cx * by;
    g = (ax * cy - ay * cx) / det;
    hh = (bx * ay - by * ax) / det;
    a = p1[0] - p0[0] + g * p1[0];
    b = p3[0] - p0[0] + hh * p3[0];
    c = p0[0];
    d = p1[1] - p0[1] + g * p1[1];
    e = p3[1] - p0[1] + hh * p3[1];
    f = p0[1];
  }
  return (u: number, v: number): Pt => {
    const w = g * u + hh * v + 1;
    return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
  };
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-transparent bg-accent text-white"
          : "border-white/15 bg-white/5 text-white/70 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FieldRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 py-2 text-sm">
      <span className="text-white/50">{k}</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}

/** Track viewport + build a square→quad map per tower face (screen px). */
function useFaceMaps() {
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return useMemo(() => {
    const { w, h } = vp;
    if (!w || !h) return null;
    const maps = FACES.map((f) => {
      const { TL, TR, BR, BL } = f.quad;
      return makeQuadMap(
        coverPoint(TL[0], TL[1], w, h),
        coverPoint(TR[0], TR[1], w, h),
        coverPoint(BR[0], BR[1], w, h),
        coverPoint(BL[0], BL[1], w, h)
      );
    });
    return { w, h, maps };
  }, [vp]);
}

/** Inset a quad's 4 corners toward its centroid for a small gap between cells. */
function insetQuad(pts: Pt[], amt: number): string {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  return pts
    .map(([x, y]) => {
      const dx = cx - x;
      const dy = cy - y;
      const len = Math.hypot(dx, dy) || 1;
      return `${x + (dx / len) * amt},${y + (dy / len) * amt}`;
    })
    .join(" ");
}

export default function ApartmentsOverlay() {
  const panel = useExperience((s) => s.panel);
  const closePanel = useExperience((s) => s.closePanel);
  const open = panel === "apartments";

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const facade = useFaceMaps();

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const toggle = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: f[k] === v ? (DEFAULT_FILTERS[k] as Filters[K]) : v }));

  const matched = useMemo(() => UNITS.filter((u) => matches(u, filters)), [filters]);
  const matchedIds = useMemo(() => new Set(matched.map((u) => u.id)), [matched]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setHover(null);
      setShowFilters(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, closePanel]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* subtle top/bottom scrim so controls stay legible over the photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />

      {/* on-image building hotspots — perspective grid (square→quad homography) */}
      {facade && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={facade.w}
          height={facade.h}
          viewBox={`0 0 ${facade.w} ${facade.h}`}
        >
          {FLOORS.map((floor, row) =>
            UNITS.filter((u) => u.floor === floor).map((u) => {
              const lf = LINE_FACE[u.line];
              if (!lf) return null;
              const map = facade.maps[lf.face];
              const on = matchedIds.has(u.id);
              const clickable = u.status !== "sold";
              const isSel = selected?.id === u.id;
              const isHov = hover?.id === u.id;
              const lit = isSel || isHov; // hover/selected "lights up" the unit
              const u0 = lf.col / lf.cols;
              const u1 = (lf.col + 1) / lf.cols;
              const v0 = row / ROWS;
              const v1 = (row + 1) / ROWS;
              const corners: Pt[] = [
                map(u0, v0),
                map(u1, v0),
                map(u1, v1),
                map(u0, v1),
              ];
              const fillOpacity = !on ? 0 : isSel ? 0.95 : isHov ? 0.85 : 0;
              return (
                <polygon
                  key={u.id}
                  points={insetQuad(corners, 1.2)}
                  fill={STATUS_META[u.status].dot}
                  fillOpacity={fillOpacity}
                  stroke={lit ? "#fff" : "transparent"}
                  strokeWidth={isSel ? 2 : 1.2}
                  className={clickable ? "cursor-pointer" : "cursor-not-allowed"}
                  style={{
                    // 'all' hit-tests the geometry even when the fill is invisible,
                    // so hovering an unlit unit still lights it up.
                    pointerEvents: on && clickable ? "all" : "none",
                    transition: "fill-opacity 120ms ease, stroke 120ms ease",
                    filter: lit
                      ? `drop-shadow(0 0 6px ${STATUS_META[u.status].dot})`
                      : undefined,
                  }}
                  onMouseEnter={() => on && setHover(u)}
                  onMouseLeave={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onClick={() => clickable && on && setSelected(u)}
                  aria-label={`Unit ${u.label} — ${STATUS_META[u.status].label}`}
                />
              );
            })
          )}
        </svg>
      )}

      {/* header: legend + count + close + filters toggle */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm tracking-[0.3em] text-white drop-shadow">AVAILABILITY</h2>
          <span className="text-xs text-white/70">{matched.length}/{UNITS.length} units</span>
        </div>
        <div className="flex items-center gap-3">
          <ul className="hidden items-center gap-4 sm:flex">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <li key={k} className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.dot }} />
                {m.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/85 backdrop-blur-sm transition hover:bg-white/10"
          >
            Filters
          </button>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close availability"
            className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/85 backdrop-blur-sm transition hover:bg-white/10"
          >
            Close ✕
          </button>
        </div>
      </header>

      {/* hover summary */}
      {hover && (
        <div className="pointer-events-none absolute left-6 top-20 rounded-lg border border-white/15 bg-[#0a1628]/95 px-4 py-3 text-sm shadow-xl">
          <p className="font-semibold text-white">Unit {hover.label}</p>
          <p className="text-white/60">
            {hover.area} m² · {hover.bedrooms} bd · {hover.suites} suite
          </p>
          <p className="mt-1 font-medium text-accent">{formatBRL(hover.price)}</p>
          <p className="text-xs text-white/45">{STATUS_META[hover.status].label}</p>
        </div>
      )}

      {/* filters drawer (toggled) */}
      {showFilters && (
        <aside className="pointer-events-auto absolute bottom-6 left-6 top-20 w-72 overflow-y-auto rounded-2xl border border-white/12 bg-[#060f1c]/85 px-5 py-5 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs tracking-widest text-white/50">
                MAX PRICE — {formatBRL(filters.priceMax)}
              </label>
              <input
                type="range"
                min={PRICE_FLOOR}
                max={PRICE_CAP}
                step={10000}
                value={filters.priceMax}
                onChange={(e) => set("priceMax", Number(e.target.value))}
                className="zy-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20"
              />
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-white/50">BEDROOMS</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <Chip key={n} active={filters.bedrooms === n} onClick={() => toggle("bedrooms", n)}>
                    {n}{n === 4 ? "+" : ""}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-white/50">SUITES</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((n) => (
                  <Chip key={n} active={filters.suites === n} onClick={() => toggle("suites", n)}>
                    {n}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-white/50">
                FLOORS — {filters.floorMin} to {filters.floorMax}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={FLOOR_MIN}
                  max={FLOOR_MAX}
                  value={filters.floorMin}
                  onChange={(e) => set("floorMin", Math.min(Number(e.target.value), filters.floorMax))}
                  className="zy-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                />
                <input
                  type="range"
                  min={FLOOR_MIN}
                  max={FLOOR_MAX}
                  value={filters.floorMax}
                  onChange={(e) => set("floorMax", Math.max(Number(e.target.value), filters.floorMin))}
                  className="zy-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-white/50">ORIENTATION</p>
              <div className="flex flex-wrap gap-2">
                {ORIENTATIONS.map((o) => (
                  <Chip key={o} active={filters.orientation === o} onClick={() => toggle("orientation", o)}>
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-white/50">VIEW</p>
              <div className="flex flex-wrap gap-2">
                {VIEWS.map((v) => (
                  <Chip key={v} active={filters.view === v} onClick={() => toggle("view", v)}>
                    {v}
                  </Chip>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-white/45 underline-offset-4 hover:text-white hover:underline"
            >
              Reset filters
            </button>
          </div>
        </aside>
      )}

      {/* detail drawer */}
      {selected && (
        <aside className="pointer-events-auto absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto border-l border-white/10 bg-[#060f1c]/95 px-6 py-6 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-widest text-white/45">UNIT</p>
              <h3 className="text-3xl font-light text-white">{selected.label}</h3>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: STATUS_META[selected.status].dot, color: "#05101c" }}
            >
              {STATUS_META[selected.status].label}
            </span>
          </div>

          <div className="mt-5 aspect-[4/3] w-full rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <svg viewBox="0 0 200 150" className="h-full w-full text-white/25">
              <rect x="6" y="6" width="188" height="138" fill="none" stroke="currentColor" />
              <line x1="92" y1="6" x2="92" y2="80" stroke="currentColor" />
              <line x1="92" y1="80" x2="194" y2="80" stroke="currentColor" />
              <line x1="6" y1="96" x2="92" y2="96" stroke="currentColor" />
              <rect x="120" y="100" width="40" height="30" fill="none" stroke="currentColor" />
              <text x="100" y="145" fill="currentColor" fontSize="8" textAnchor="middle">
                Floorplan (placeholder)
              </text>
            </svg>
          </div>

          <div className="mt-5">
            <FieldRow k="Floor" v={String(selected.floor)} />
            <FieldRow k="Area" v={`${selected.area} m²`} />
            <FieldRow k="Bedrooms" v={String(selected.bedrooms)} />
            <FieldRow k="Suites" v={String(selected.suites)} />
            <FieldRow k="Parking" v={String(selected.parking)} />
            <FieldRow k="Orientation" v={selected.orientation} />
            <FieldRow k="View" v={selected.view} />
            <FieldRow k="Price" v={formatBRL(selected.price)} />
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            Request contact
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-2 w-full text-xs text-white/45 hover:text-white"
          >
            Back to availability
          </button>
        </aside>
      )}
    </div>
  );
}
