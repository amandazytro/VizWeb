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
import Panorama360 from "@/components/Panorama360";
import ShareScreen from "@/components/apartments/share-screen";

// Hero image natural size + tower facade as a perspective quad per slab.
const IMG_W = 1600;
const IMG_H = 900;

type Pt = [number, number];
type Quad = { TL: Pt; TR: Pt; BR: Pt; BL: Pt };

const FACES: { quad: Quad; lines: string[] }[] = [
  // left (front) facade
  { quad: { TL: [40.5, 21.5], TR: [50.0, 21.5], BR: [50.0, 78.0], BL: [41.7, 78.5] }, lines: ["A"] },
  // right (receding) facade
  { quad: { TL: [50.0, 21.5], TR: [59.5, 21.7], BR: [58.3, 75.5], BL: [50.0, 77.0] }, lines: ["B"] },
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
        "pointer-events-auto rounded-3xl border border-white/20 bg-[#26344f]/40 px-5 py-2.5 ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function RangeSlider({
  label,
  format,
  min,
  max,
  step = 1,
  vmin,
  vmax,
  onMin,
  onMax,
}: {
  label: string;
  format: (v: number) => string;
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
      <p className="mb-2.5 text-center text-sm font-medium text-white">{label}</p>
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 whitespace-nowrap text-[11px] text-white/55">{format(vmin)}</span>
        <div className="relative flex h-4 flex-1 items-center">
          <div className="absolute h-1.5 w-full rounded-full bg-white/20" />
          <div
            className="absolute h-1.5 rounded-full bg-accent"
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
        <span className="shrink-0 whitespace-nowrap text-[11px] text-white/55">{format(vmax)}</span>
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

// Static feature highlights shown on the expanded floorplan view.
const FEATURES = [
  { title: "Isolamento de Alto Desempenho", desc: "Isolamento térmico e acústico de alto desempenho para mais conforto e silêncio.", on: true },
  { title: "Janelas com Vidro Duplo", desc: "Vidros duplos que ampliam a eficiência energética e reduzem o ruído externo.", on: false },
  { title: "Controle Climático Inteligente", desc: "Climatização inteligente que mantém a temperatura ideal com mais eficiência.", on: false },
];

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
  const [lights, setLights] = useState(false);
  const [pano, setPano] = useState<string | null>(null); // 360 viewer src (null = closed)
  const [share, setShare] = useState(false); // share/summary screen

  useEffect(() => {
    setExpanded(false);
    setPano(null);
    setShare(false);
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
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, closePanel]);

  if (!open || !aptReady) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* click-outside catcher — closes the unit detail. Sits below the hotspots
          (so other units stay clickable) and below the panel/filters. */}
      {selected && (
        <div className="pointer-events-auto absolute inset-0" onClick={() => setSelected(null)} />
      )}

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
                  stroke={lit ? "#fff" : "rgba(255,255,255,0.55)"}
                  strokeWidth={isSel ? 2.2 : lit ? 1.6 : 1}
                  className="cursor-pointer outline-none focus-visible:stroke-white"
                  style={{
                    pointerEvents: on ? "all" : "none",
                    transition: "fill-opacity 120ms ease, stroke 120ms ease",
                    filter: lit ? `drop-shadow(0 0 6px ${STATUS_META[u.status].dot})` : undefined,
                  }}
                  role="button"
                  tabIndex={on ? 0 : -1}
                  onMouseEnter={() => on && setHover(u)}
                  onMouseLeave={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onFocus={() => on && setHover(u)}
                  onBlur={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onClick={() => on && setSelected(u)}
                  onKeyDown={(e) => {
                    if (on && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSelected(u);
                    }
                  }}
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

      {/* bottom-left: Andar (card) + Dormitórios (card) — side by side */}
      <div className="absolute bottom-8 left-6 flex w-[500px] items-stretch gap-3">
        <Card className="flex-1">
          <RangeSlider
            label="Andar"
            format={(v) => `${v}º`}
            min={FLOOR_MIN}
            max={FLOOR_MAX}
            vmin={filters.floorMin}
            vmax={filters.floorMax}
            onMin={(v) => set("floorMin", v)}
            onMax={(v) => set("floorMax", v)}
          />
        </Card>
        <Card className="flex flex-1 items-center">
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Dormitórios</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => {
                const on = filters.bedrooms === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("bedrooms", on ? null : n)}
                    className={[
                      "h-9 w-9 rounded-2xl text-sm font-semibold transition",
                      on
                        ? "bg-gradient-to-b from-[#8b6dff] to-[#5b3fd6] text-white shadow-[0_6px_16px_-4px_rgba(124,92,255,0.7)]"
                        : "bg-white/10 text-white/55 hover:bg-white/20",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* bottom-right: Valor (card) + Metragem (card) — side by side */}
      <div className="absolute bottom-8 right-6 flex w-[680px] items-stretch gap-3">
        <Card className="flex-1">
          <RangeSlider
            label="Valor máx."
            format={(v) => `R$${numBR(v)}`}
            min={PRICE_FLOOR}
            max={PRICE_CAP}
            step={10000}
            vmin={filters.priceMin}
            vmax={filters.priceMax}
            onMin={(v) => set("priceMin", v)}
            onMax={(v) => set("priceMax", v)}
          />
        </Card>
        <Card className="flex-1">
          <RangeSlider
            label="Metragem"
            format={(v) => `${v}m²`}
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
          <aside className="zy-fadein pointer-events-auto absolute bottom-[26%] left-0 top-[22%] flex w-[min(440px,72%)] rounded-r-[1.4rem] border border-white/25 bg-white/10 py-5 pl-8 pr-6 shadow-[0_0_40px_16px_rgba(10,23,38,0.3),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_24px_rgba(255,255,255,0.12)] ring-1 ring-inset ring-white/15 backdrop-blur-2xl backdrop-saturate-150 [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]">
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
                className="pointer-events-none absolute right-0 top-1/2 h-[95%] w-auto max-w-none -translate-y-1/2 translate-x-[50%] object-contain drop-shadow-[0_16px_38px_rgba(0,0,0,0.6)]"
              />
            </div>
          </aside>

          {/* floating actions at the panel's right edge */}
          <div
            className="pointer-events-auto absolute top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3"
            style={{ left: "calc(min(440px, 72%) - 24px)" }}
          >
            <button type="button" onClick={() => setSaved((s) => !s)} aria-label="Salvar" className="transition hover:brightness-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plantas/icons/${saved ? "salvar-clicado" : "salvar"}.svg`} alt="Salvar" className="h-12 w-12" />
            </button>
            <button type="button" onClick={() => setExpanded(true)} aria-label="Expandir planta" className="transition hover:brightness-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/expandir.svg" alt="Expandir" className="h-12 w-12" />
            </button>
            <button type="button" onClick={() => setLights((l) => !l)} aria-label="Iluminação" aria-pressed={lights} className="transition hover:brightness-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/iluminacao.svg" alt="Iluminação" className="h-12 w-12" />
            </button>
            <button type="button" onClick={() => setSelected(null)} aria-label="Voltar" className="transition hover:brightness-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/voltar.svg" alt="Voltar" className="h-12 w-12" />
            </button>
          </div>
        </>
      )}

      {/* expanded floorplan — full detail view */}
      {selected && expanded && (
        <div className="pointer-events-auto absolute inset-0 z-[60] overflow-hidden">
          {/* blurred dark backdrop (no transformed ancestor → blur stays reliable) */}
          <div className="absolute inset-0 bg-[#0a121c]/85 backdrop-blur-2xl" />

          {/* center floorplan (rotated -90°, no background) — above the side cards so they tuck behind it */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-[16vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plantas/humanizada-04.webp"
              alt={`Planta ampliada — unidade ${selected.label}`}
              style={{ transform: "rotate(0deg)" }}
              className="max-h-[90vh] max-w-[64vw] object-contain"
            />
          </div>

          {/* view markers over the floorplan — open the 360 view */}
          {[
            { x: 60, y: 55, img: "/plantas/360/c1.webp" },
            { x: 38, y: 70, img: "/plantas/360/2.webp" },
            { x: 53, y: 63, img: "/plantas/360/3.webp" },
            { x: 38, y: 56, img: "/plantas/360/4.webp" },
            { x: 38, y: 40, img: "/plantas/360/5.webp" },
            { x: 55, y: 73, img: "/plantas/360/6.webp" },
            { x: 63, y: 50, img: "/plantas/360/7.webp" },
            { x: 53, y: 30, img: "/plantas/360/8.webp" },
            { x: 64, y: 30, img: "/plantas/360/9.webp" },
          ].map((m) => (
            <button
              key={`${m.x}-${m.y}`}
              type="button"
              onClick={() => setPano(m.img)}
              aria-label="Ver em 360°"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/ver.svg" alt="" className="h-9 w-9" />
            </button>
          ))}

          {/* left: unit info */}
          <div className="absolute left-[15vw] top-1/2 z-10 w-[290px] -translate-y-1/2">
            <h2 className="mb-6 text-3xl font-semibold text-white">{selected.bedrooms} Dorm.</h2>
            <div className="space-y-3.5">
              <Detail label="Nº" value={selected.label} />
              <Detail label="Área" value={`${selected.area}m²`} />
              <Detail label="Dormitórios" value={pad2(selected.bedrooms)} />
              <Detail label="Banheiros" value={pad2(selected.suites)} />
              <div className="pt-1">
                <p className="text-[15px] text-white/55">Valor R$:</p>
                <p className="text-3xl font-bold leading-tight text-white">{numBR(selected.price)}</p>
              </div>
            </div>
          </div>

          {/* right: feature cards */}
          <div className="absolute right-[9vw] top-1/2 z-30 flex w-[360px] -translate-y-1/2 flex-col gap-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-2xl border border-white/50 bg-white/[0.08] p-4 backdrop-blur-md"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold leading-tight text-white">{f.title}</h4>
                  <p className="mt-3 text-[14px] leading-snug text-white/55">{f.desc}</p>
                </div>
                <span
                  className={[
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    f.on ? "border-transparent bg-accent text-white" : "border-white/30 text-white/60",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    {f.on ? <path d="M5 12l4 4 10-10" /> : <path d="M12 5v14M5 12h14" />}
                  </svg>
                </span>
              </div>
            ))}
          </div>

          {/* bottom dock */}
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-3xl border border-white/12 bg-white/[0.08] px-3 py-2.5 backdrop-blur-xl">
            <DockBtn label="Salvar" active={saved} onClick={() => setSaved((s) => !s)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/plantas/icons/${saved ? "salvar-clicado" : "salvar"}.svg`} alt="" className="h-11 w-11" />
            </DockBtn>
            <DockBtn label="Voltar" onClick={() => setExpanded(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/voltar-clicado.svg" alt="" className="h-11 w-11" />
            </DockBtn>
            <DockBtn label="Compartilhar" onClick={() => setShare(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plantas/icons/compartilhar.svg" alt="" className="h-11 w-11" />
            </DockBtn>
          </div>

          {/* 360° viewer (spherical, three.js) */}
          {pano && (
            <div className="absolute inset-0 z-[70]">
              <Panorama360 src={pano} onClose={() => setPano(null)} />
            </div>
          )}
        </div>
      )}

      {/* share / summary screen */}
      {selected && share && <ShareScreen unit={selected} onClose={() => setShare(false)} />}
    </div>
  );
}

function DockBtn({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-[88px] flex-col items-center gap-1 rounded-2xl px-2 py-2 transition",
        active ? "text-accent" : "text-white/80 hover:text-white",
      ].join(" ")}
    >
      {children}
      <span className="text-[11px] tracking-wide">{label}</span>
    </button>
  );
}
