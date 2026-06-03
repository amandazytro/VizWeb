"use client";

import { useEffect, useState } from "react";
import { useExperience } from "@/lib/store";
import { POIS, bgFor, type Poi, type PoiKey } from "@/lib/surroundings";

function Marker({ poi, active, onClick }: { poi: Poi; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ left: `${poi.marker.x}%`, top: `${poi.marker.y}%` }}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
    >
      {active ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/poi/${poi.key}-on.svg`}
          alt={poi.name}
          className="h-12 w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        />
      ) : (
        <span className="flex items-center gap-3 rounded-3xl border border-white/25 bg-white/15 py-1.5 pl-1.5 pr-5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition hover:bg-white/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/poi/${poi.key}.svg`} alt="" className="h-11 w-11" />
          <span className="text-base font-medium text-white">{poi.name}</span>
        </span>
      )}
    </button>
  );
}

export default function SurroundingsOverlay() {
  const panel = useExperience((s) => s.panel);
  const open = panel === "surroundings";
  const [sel, setSel] = useState<PoiKey | null>(null);

  useEffect(() => {
    if (!open) setSel(null);
  }, [open]);

  if (!open) return null;
  const selected = POIS.find((p) => p.key === sel) ?? null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-20 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]"
      onClick={() => setSel(null)}
    >
      {/* aerial map (home — no route) as the base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bgFor("home")} alt="Mapa dos arredores" className="absolute inset-0 h-full w-full object-cover" />

      {/* selected POI map (route baked) revealed by an expanding clip → draws the route */}
      {selected && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={selected.key}
          src={bgFor(selected.key)}
          alt=""
          aria-hidden="true"
          className="route-draw absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* POI markers */}
      {POIS.map((p) => (
        <Marker key={p.key} poi={p} active={sel === p.key} onClick={() => setSel(p.key)} />
      ))}

      {/* route time badge */}
      {selected && (
        <div
          key={`badge-${selected.key}`}
          style={{ left: `${selected.badge.x}%`, top: `${selected.badge.y}%` }}
          className="pointer-events-none absolute z-[5] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[26px] border-2 border-white/45 bg-[#5F2EF9] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          {selected.minutes} min
        </div>
      )}

      {/* left detail panel — solid dark card (Figma: back #333 +A6A6A6@23%, front #000@26%) */}
      {selected && (
        <aside
          onClick={(e) => e.stopPropagation()}
          style={{
            height: "63%",
            aspectRatio: "302 / 576",
            background: "rgba(150,150,156,0.34)",
            borderColor: "rgba(255,255,255,0.30)",
            backdropFilter: "blur(8px) saturate(150%)",
            WebkitBackdropFilter: "blur(8px) saturate(150%)",
          }}
          className="pointer-events-auto absolute left-8 top-[14%] overflow-hidden rounded-[68px] border shadow-[0_28px_70px_-18px_rgba(0,0,0,0.55)] [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]"
        >
          {/* light sheen overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-[68px]" style={{ background: "rgba(205,205,210,0.20)" }} />
          {/* front card subtle darken, inset ~10px */}
          <div className="pointer-events-none absolute inset-[10px] rounded-[62px]" style={{ background: "rgba(0,0,0,0.06)" }} />

          {/* content */}
          <div className="relative flex h-full flex-col p-3">
            {/* photo with purple element behind */}
            <div className="relative shrink-0">
              <div className="absolute inset-x-[5px] bottom-[-5px] top-5 rounded-[36px] bg-[#5F2EF9]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/poi-fotos/${selected.key}.webp`}
                alt={selected.name}
                className="relative h-44 w-full rounded-t-[63px] rounded-b-[35px] object-cover"
              />
            </div>

            {/* name + km + description (purple left accent) */}
            <div className="mt-5 shrink-0 border-l-2 border-[#5F2EF9] pl-4 pr-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-2xl font-semibold text-white">{selected.name}</h3>
                <span className="shrink-0 text-base text-white/90">{selected.km}</span>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-white/65">{selected.description}</p>
            </div>

            {/* POI list — evenly distributed to fill remaining height */}
            <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
              {POIS.filter((p) => p.key !== selected.key).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSel(p.key)}
                  className="flex flex-1 items-center justify-between border-t border-white/12 text-left"
                >
                  <span className="text-[17px] text-white">{p.name}</span>
                  <span className="text-[15px] text-white/70">{p.km}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
