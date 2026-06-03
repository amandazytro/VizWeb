"use client";

import { useEffect, useMemo, useState } from "react";
import { useExperience } from "@/lib/store";
import {
  UNITS,
  STATUS_META,
  STATUS_ORDER,
  DEFAULT_FILTERS,
  PRICE_FLOOR,
  PRICE_CAP,
  AREA_FLOOR,
  AREA_CAP,
  FLOOR_MIN,
  FLOOR_MAX,
  matches,
  formatBRL,
  type Unit,
  type Filters,
  type UnitStatus,
} from "@/lib/apartments";
import { plantaFor } from "@/lib/plantas";

// Hero image natural size + tower facade as a perspective quad per slab.
const IMG_W = 1713;
const IMG_H = 960;

type Pt = [number, number];
type Quad = { TL: Pt; TR: Pt; BR: Pt; BL: Pt };

const FACES: { quad: Quad; lines: string[] }[] = [
  { quad: { TL: [38.0, 16.0], TR: [49.4, 16.0], BR: [49.4, 88.0], BL: [38.0, 88.0] }, lines: ["A"] },
  { quad: { TL: [50.2, 16.0], TR: [62.0, 16.0], BR: [62.0, 88.0], BL: [50.2, 88.0] }, lines: ["B"] },
];

const LINE_FACE: Record<string, { face: number; col: number; cols: number }> = (() => {
  const m: Record<string, { face: number; col: number; cols: number }> = {};
  FACES.forEach((f, fi) =>
    f.lines.forEach((ln, ci) => (m[ln] = { face: fi, col: ci, cols: f.lines.length }))
  );
  return m;
})();

const FLOORS = Array.from(new Set(UNITS.map((u) => u.floor))).sort((a, b) => b - a);
const ROWS = FLOORS.length;

function coverPoint(px: number, py: number, w: number, h: number): Pt {
  const scale = Math.max(w / IMG_W, h / IMG_H);
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  const offX = (w - dispW) / 2;
  const offY = (h - dispH) / 2;
  return [offX + (px / 100) * dispW, offY + (py / 100) * dispH];
}

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

/* — small UI atoms — */
function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "pointer-events-auto rounded-2xl border border-white/15 bg-[#0a1726]/35 px-5 py-4 ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function brlShort(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0).replace(".", ",")}M`;
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000)} mil`;
  return formatBRL(v);
}

function RangeSlider({
  label,
  display,
  min,
  max,
  step = 1,
  vmin,
  vmax,
  onMin,
  onMax,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step?: number;
  vmin: number;
  vmax: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] tracking-widest text-white/55">{label}</span>
        <span className="text-xs font-medium text-white">{display}</span>
      </div>
      <div className="relative flex h-4 items-center">
        <div className="absolute h-1 w-full rounded-full bg-white/20" />
        <div
          className="absolute h-1 rounded-full bg-accent"
          style={{ left: `${pct(vmin)}%`, right: `${100 - pct(vmax)}%` }}
        />
        <input
          type="range"
          className="zy-dual"
          min={min}
          max={max}
          step={step}
          value={vmin}
          onChange={(e) => onMin(Math.min(Number(e.target.value), vmax - step))}
        />
        <input
          type="range"
          className="zy-dual"
          min={min}
          max={max}
          step={step}
          value={vmax}
          onChange={(e) => onMax(Math.max(Number(e.target.value), vmin + step))}
        />
      </div>
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const numBR = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/15 pb-3">
      <p className="text-[13px] text-white/55">{label}</p>
      <p className="text-2xl font-semibold leading-tight text-white">{value}</p>
    </div>
  );
}

function ActionBtn({
  onClick,
  ariaLabel,
  accent = false,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition hover:brightness-110",
        accent ? "bg-accent text-white" : "bg-white text-[#0a1726]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14l-4-4 4-4" />
    <path d="M5 10h9a5 5 0 0 1 0 10h-1" />
  </svg>
);
const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5h5" />
  </svg>
);
const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
  </svg>
);

export default function ApartmentsOverlay() {
  const panel = useExperience((s) => s.panel);
  const closePanel = useExperience((s) => s.closePanel);
  const aptReady = useExperience((s) => s.aptReady);
  const open = panel === "apartments";

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [selected]);

  const facade = useFaceMaps();
  const matched = useMemo(() => UNITS.filter((u) => matches(u, filters)), [filters]);
  const matchedIds = useMemo(() => new Set(matched.map((u) => u.id)), [matched]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const toggleStatus = (s: UnitStatus) =>
    setFilters((f) => ({
      ...f,
      active: f.active.includes(s) ? f.active.filter((x) => x !== s) : [...f.active, s],
    }));

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setHover(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (selected ? setSelected(null) : closePanel());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, closePanel]);

  if (!open || !aptReady) return null;

  return (
    <div className="zy-fadein pointer-events-none fixed inset-0 z-40">
      {/* on-image hotspots (perspective grid) */}
      {facade && (
        <svg className="pointer-events-none absolute inset-0" width={facade.w} height={facade.h} viewBox={`0 0 ${facade.w} ${facade.h}`}>
          {FLOORS.map((floor, row) =>
            UNITS.filter((u) => u.floor === floor).map((u) => {
              const lf = LINE_FACE[u.line];
              if (!lf) return null;
              const map = facade.maps[lf.face];
              const on = matchedIds.has(u.id);
              const isSel = selected?.id === u.id;
              const isHov = hover?.id === u.id;
              const lit = isSel || isHov;
              const u0 = lf.col / lf.cols;
              const u1 = (lf.col + 1) / lf.cols;
              const v0 = row / ROWS;
              const v1 = (row + 1) / ROWS;
              const corners: Pt[] = [map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)];
              return (
                <polygon
                  key={u.id}
                  points={insetQuad(corners, 1.2)}
                  fill={STATUS_META[u.status].dot}
                  fillOpacity={!on ? 0.05 : isSel ? 0.95 : isHov ? 0.9 : 0.5}
                  stroke={lit ? "#fff" : "rgba(255,255,255,0.22)"}
                  strokeWidth={isSel ? 2 : lit ? 1.4 : 0.6}
                  className="cursor-pointer"
                  style={{
                    pointerEvents: on ? "all" : "none",
                    transition: "fill-opacity 120ms ease, stroke 120ms ease",
                    filter: lit ? `drop-shadow(0 0 6px ${STATUS_META[u.status].dot})` : undefined,
                  }}
                  onMouseEnter={() => on && setHover(u)}
                  onMouseLeave={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onClick={() => on && setSelected(u)}
                  aria-label={`Unidade ${u.label} — ${STATUS_META[u.status].label}`}
                />
              );
            })
          )}
        </svg>
      )}

      {/* hover summary (top-left, under the brand) */}
      {hover && (
        <div className="pointer-events-none absolute left-6 top-16 rounded-lg border border-white/15 bg-[#0a1628]/95 px-4 py-3 text-sm shadow-xl">
          <p className="font-semibold text-white">Unidade {hover.label}</p>
          <p className="text-white/60">{hover.area} m² · {hover.bedrooms} dorm · {hover.suites} suíte</p>
          <p className="mt-1 font-medium text-accent">{formatBRL(hover.price)}</p>
          <p className="text-xs text-white/45">{STATUS_META[hover.status].label}</p>
        </div>
      )}

      {/* status filter legend (center-right). Off by default; click activates. */}
      <div className="pointer-events-auto absolute right-8 top-1/2 flex -translate-y-1/2 flex-col items-start gap-3">
        {STATUS_ORDER.map((s) => {
          const on = filters.active.includes(s);
          const m = STATUS_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={on}
              className={[
                "flex items-center gap-3 rounded-full border px-5 py-2.5 backdrop-blur-md transition duration-200 active:scale-95",
                on
                  ? "border-white/30 bg-[#0a1726]/70 ring-2 ring-white/25"
                  : "border-white/10 bg-[#0a1726]/35 opacity-50 ring-0 hover:opacity-90",
              ].join(" ")}
            >
              <span
                className="h-3.5 w-3.5 rounded-full transition"
                style={{ background: m.dot, boxShadow: on ? `0 0 10px ${m.dot}` : "none" }}
              />
              <span className={on ? "text-sm font-medium text-white" : "text-sm text-white/80"}>
                {m.plural}
              </span>
            </button>
          );
        })}
      </div>

      {/* bottom-left: Andar (card) + Dormitórios (card) */}
      <div className="absolute bottom-6 left-6 flex w-60 flex-col gap-3">
        <Card>
          <RangeSlider
            label="ANDAR"
            display={`${filters.floorMin}º — ${filters.floorMax}º`}
            min={FLOOR_MIN}
            max={FLOOR_MAX}
            vmin={filters.floorMin}
            vmax={filters.floorMax}
            onMin={(v) => set("floorMin", v)}
            onMax={(v) => set("floorMax", v)}
          />
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] tracking-widest text-white/55">DORMITÓRIOS</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("bedrooms", filters.bedrooms === n ? null : n)}
                  className={[
                    "h-8 w-8 rounded-full text-xs font-medium transition",
                    filters.bedrooms === n
                      ? "bg-accent text-white"
                      : "bg-white/8 text-white/70 hover:bg-white/15",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* bottom-right: Valor (card) + Metragem (card) */}
      <div className="absolute bottom-6 right-6 flex w-64 flex-col gap-3">
        <Card>
          <RangeSlider
            label="VALOR"
            display={`${brlShort(filters.priceMin)} — ${brlShort(filters.priceMax)}`}
            min={PRICE_FLOOR}
            max={PRICE_CAP}
            step={10000}
            vmin={filters.priceMin}
            vmax={filters.priceMax}
            onMin={(v) => set("priceMin", v)}
            onMax={(v) => set("priceMax", v)}
          />
        </Card>
        <Card>
          <RangeSlider
            label="METRAGEM"
            display={`${filters.areaMin} — ${filters.areaMax} m²`}
            min={AREA_FLOOR}
            max={AREA_CAP}
            vmin={filters.areaMin}
            vmax={filters.areaMax}
            onMin={(v) => set("areaMin", v)}
            onMax={(v) => set("areaMax", v)}
          />
        </Card>
      </div>

      {/* detail panel (left) */}
      {selected && (
        <>
          <aside className="zy-fadein pointer-events-auto absolute bottom-[16%] left-0 top-[22%] flex w-[min(440px,72%)] rounded-r-[1.4rem] border border-l-0 border-white/25 bg-white/10 py-5 pl-8 pr-6 shadow-[0_8px_60px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/20 backdrop-blur-2xl backdrop-saturate-150 [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]">
            <div className="flex w-36 shrink-0 flex-col justify-center gap-4">
              <Detail label="Nº" value={selected.label} />
              <Detail label="Área" value={`${selected.area}m²`} />
              <Detail label="Dormitórios" value={pad2(selected.bedrooms)} />
              <Detail label="Banheiros" value={pad2(selected.suites)} />
              <div>
                <p className="text-[13px] text-white/55">Valor R$:</p>
                <p className="text-3xl font-bold leading-tight text-white">{numBR(selected.price)}</p>
              </div>
            </div>
            {/* transparent floorplan, overflowing past the panel's right edge */}
            <div className="relative ml-4 flex-1 self-stretch">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plantaFor(selected.id)}
                alt={`Planta — unidade ${selected.label}`}
                className="pointer-events-none absolute right-0 top-1/2 h-[165%] w-auto max-w-none -translate-y-1/2 translate-x-[22%] object-contain drop-shadow-[0_16px_38px_rgba(0,0,0,0.6)]"
              />
            </div>
          </aside>

          {/* floating actions at the panel's right edge */}
          <div
            className="pointer-events-auto absolute top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3"
            style={{ left: "calc(min(440px, 72%) - 24px)" }}
          >
            <ActionBtn onClick={() => setSelected(null)} ariaLabel="Voltar">
              <BackIcon />
            </ActionBtn>
            <ActionBtn onClick={() => setExpanded(true)} ariaLabel="Expandir planta">
              <ExpandIcon />
            </ActionBtn>
            <ActionBtn onClick={() => setSaved((s) => !s)} ariaLabel="Salvar" accent={saved}>
              <BookmarkIcon />
            </ActionBtn>
          </div>
        </>
      )}

      {/* expanded floorplan lightbox */}
      {selected && expanded && (
        <div
          className="zy-fadein pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-10"
          onClick={() => setExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plantaFor(selected.id)} alt="Planta ampliada" className="max-h-full max-w-full rounded-xl bg-white object-contain" />
        </div>
      )}
    </div>
  );
}
