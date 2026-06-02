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

// Hero image natural size (public/hero/diurno.webp) + the tower facade region
// within it, in image-percent. Tweak FACADE to recalibrate the grid on the
// building. Rendered with object-cover (centered), matched below.
const IMG_W = 1754;
const IMG_H = 896;
const FACADE = { left: 43.4, right: 55.4, top: 14.0, bottom: 78.5 };

const FLOORS = Array.from(new Set(UNITS.map((u) => u.floor))).sort((a, b) => b - a);
const LINE_INDEX: Record<string, number> = { A: 0, B: 1, C: 2 };

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

/** Map the facade % region to pixel rects using object-cover math. */
function useFacadeRects() {
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
    const scale = Math.max(w / IMG_W, h / IMG_H);
    const dispW = IMG_W * scale;
    const dispH = IMG_H * scale;
    const offX = (w - dispW) / 2;
    const offY = (h - dispH) / 2;
    const fx0 = offX + (FACADE.left / 100) * dispW;
    const fx1 = offX + (FACADE.right / 100) * dispW;
    const fy0 = offY + (FACADE.top / 100) * dispH;
    const fy1 = offY + (FACADE.bottom / 100) * dispH;
    const colW = (fx1 - fx0) / 3;
    const rowH = (fy1 - fy0) / FLOORS.length;
    return { fx0, fy0, colW, rowH };
  }, [vp]);
}

export default function ApartmentsOverlay() {
  const panel = useExperience((s) => s.panel);
  const closePanel = useExperience((s) => s.closePanel);
  const open = panel === "apartments";

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const rects = useFacadeRects();

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

      {/* on-image building hotspots */}
      {rects &&
        FLOORS.map((floor, row) =>
          UNITS.filter((u) => u.floor === floor).map((u) => {
            const col = LINE_INDEX[u.line] ?? 0;
            const on = matchedIds.has(u.id);
            const clickable = u.status !== "sold";
            const isSel = selected?.id === u.id;
            const x = rects.fx0 + col * rects.colW;
            const y = rects.fy0 + row * rects.rowH;
            return (
              <button
                key={u.id}
                type="button"
                disabled={!clickable}
                onMouseEnter={() => setHover(u)}
                onMouseLeave={() => setHover((h) => (h?.id === u.id ? null : h))}
                onClick={() => clickable && setSelected(u)}
                aria-label={`Unit ${u.label} — ${STATUS_META[u.status].label}`}
                className={[
                  "pointer-events-auto absolute rounded-[2px] border transition",
                  on ? "opacity-100" : "opacity-10",
                  clickable ? "cursor-pointer hover:brightness-125" : "cursor-not-allowed",
                  isSel ? "z-10 border-white ring-2 ring-white" : "border-white/25",
                ].join(" ")}
                style={{
                  left: x + 1,
                  top: y + 1,
                  width: Math.max(rects.colW - 2, 2),
                  height: Math.max(rects.rowH - 2, 2),
                  background: STATUS_META[u.status].dot,
                  opacity: on ? (isSel ? 0.92 : 0.62) : 0.1,
                }}
              />
            );
          })
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
