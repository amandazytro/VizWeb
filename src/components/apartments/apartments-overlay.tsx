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
const FLOORS = Array.from(
  new Set(UNITS.map((u) => u.floor))
).sort((a, b) => b - a);

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

export default function ApartmentsOverlay() {
  const panel = useExperience((s) => s.panel);
  const closePanel = useExperience((s) => s.closePanel);
  const open = panel === "apartments";

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const toggle = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: f[k] === v ? (DEFAULT_FILTERS[k] as Filters[K]) : v }));

  const matched = useMemo(
    () => UNITS.filter((u) => matches(u, filters)),
    [filters]
  );
  const matchedIds = useMemo(() => new Set(matched.map((u) => u.id)), [matched]);

  // Reset transient state and close on Escape.
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setHover(null);
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
    <div className="fixed inset-0 z-40 flex flex-col bg-[#040b15]/95">
      {/* header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm tracking-[0.3em] text-white/90">AVAILABILITY</h2>
          <span className="text-xs text-white/45">
            {matched.length} of {UNITS.length} units
          </span>
        </div>
        <div className="flex items-center gap-5">
          <ul className="hidden items-center gap-4 sm:flex">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <li key={k} className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.dot }} />
                {m.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close availability"
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
          >
            Close ✕
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* filters */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-white/10 px-6 py-5 md:block">
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

        {/* unit stack */}
        <main className="relative flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-fit">
            {FLOORS.map((floor) => {
              const row = UNITS.filter((u) => u.floor === floor);
              return (
                <div key={floor} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-white/35">
                    {floor}
                  </span>
                  <div className="flex gap-2 py-1">
                    {row.map((u) => {
                      const on = matchedIds.has(u.id);
                      const isSel = selected?.id === u.id;
                      const clickable = u.status !== "sold";
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
                            "h-7 w-12 rounded-[3px] text-[9px] font-medium tabular-nums transition",
                            on ? "opacity-100" : "opacity-15",
                            clickable ? "cursor-pointer hover:scale-110" : "cursor-not-allowed",
                            isSel ? "ring-2 ring-white" : "",
                          ].join(" ")}
                          style={{
                            background: STATUS_META[u.status].dot,
                            color: u.status === "sold" ? "#cbd5e1" : "#05101c",
                          }}
                        >
                          {u.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* hover summary */}
          {hover && (
            <div className="pointer-events-none absolute right-6 top-6 rounded-lg border border-white/15 bg-[#0a1628]/95 px-4 py-3 text-sm shadow-xl">
              <p className="font-semibold text-white">Unit {hover.label}</p>
              <p className="text-white/60">
                {hover.area} m² · {hover.bedrooms} bd · {hover.suites} suite
              </p>
              <p className="mt-1 font-medium text-accent">{formatBRL(hover.price)}</p>
              <p className="text-xs text-white/45">{STATUS_META[hover.status].label}</p>
            </div>
          )}
        </main>

        {/* detail drawer */}
        {selected && (
          <aside className="w-full max-w-sm shrink-0 overflow-y-auto border-l border-white/10 bg-[#060f1c] px-6 py-6">
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

            {/* floorplan placeholder */}
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

            {/* gallery placeholder thumbs */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[20, 60, 100].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`/frames/hero/day/${String(n).padStart(4, "0")}.jpg`}
                  alt="Unit preview"
                  className="aspect-square w-full rounded-md object-cover opacity-80"
                />
              ))}
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
    </div>
  );
}
