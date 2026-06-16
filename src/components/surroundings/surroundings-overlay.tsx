"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useExperience } from "@/lib/store";
import { useLang, useT, pick } from "@/lib/i18n";
import { POIS, bgFor, type Poi, type PoiKey } from "@/lib/surroundings";
import { ROUTES } from "@/lib/routes";
import MarkerPill from "@/components/marker-pill";
import { useUiScale } from "@/lib/use-ui-scale";

// Fixed display order for the left detail accordion (matches the Figma states).
const POI_ORDER: PoiKey[] = ["universidade", "academia", "restaurante", "shopping", "supermercado"];

function Marker({ poi, name, active, pos, onClick }: { poi: Poi; name: string; active: boolean; pos: { x: number; y: number }; onClick: () => void }) {
  const uiScale = useUiScale();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      // Inactive pill centres the icon on the marker coord; the active red icon is
      // centred on the route's endpoint (so it lands right at the end of the line).
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: active ? "translate(-50%,-50%)" : "translate(-22px,-50%)",
        zoom: uiScale,
      }}
      className="pointer-events-auto absolute"
    >
      {active ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/poi/${poi.key}-on.svg`}
          alt={name}
          className="poi-pop h-12 w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        />
      ) : (
        <MarkerPill src={`/poi/${poi.key}.svg`} label={name} />
      )}
    </button>
  );
}

export default function SurroundingsOverlay() {
  const panel = useExperience((s) => s.panel);
  const uiCollapsed = useExperience((s) => s.uiCollapsed);
  const open = panel === "surroundings";
  const [sel, setSel] = useState<PoiKey | null>(null);

  useEffect(() => {
    if (!open) setSel(null);
  }, [open]);

  if (!open) return null;
  const selected = POIS.find((p) => p.key === sel) ?? null;
  const route = selected ? ROUTES[selected.key] : null;

  return (
    <SurroundingsView sel={sel} setSel={setSel} selected={selected} route={route} uiCollapsed={uiCollapsed} />
  );
}

// Split out so hooks (useMemo for route points) run cleanly after the early return.
function SurroundingsView({
  sel,
  setSel,
  selected,
  route,
  uiCollapsed,
}: {
  sel: PoiKey | null;
  setSel: React.Dispatch<React.SetStateAction<PoiKey | null>>;
  selected: Poi | null;
  route: (typeof ROUTES)[string] | null;
  uiCollapsed: boolean;
}) {
  const lang = useLang();
  const t = useT();
  const uiScale = useUiScale();
  // Endpoint (at the POI) + midpoint (centre of the line) in viewport %, measured
  // from the RENDERED route path so the red icon lands at the end and the badge at
  // the middle. (Measuring a detached path is unreliable, so we ref the live one.)
  const pathRef = useRef<SVGPathElement>(null);
  const [pts, setPts] = useState<{ end: { x: number; y: number }; mid: { x: number; y: number } } | null>(null);
  useEffect(() => {
    const compute = () => {
      const el = pathRef.current;
      if (!el || !route || !selected) return setPts(null);
      const total = el.getTotalLength();
      if (!total) return setPts(null);
      const rad = (route.rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      // The route SVG (and the aerial) render with object-cover / xMidYMid slice,
      // so map frame(1920×1080) coords through the SAME cover transform — otherwise
      // points far from the vertical centre drift on non-16:9 viewports.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / 1920, vh / 1080);
      const offX = (vw - 1920 * scale) / 2;
      const offY = (vh - 1080 * scale) / 2;
      const toPct = (pt: { x: number; y: number }) => {
        const tx = pt.x - route.vbW / 2;
        const ty = pt.y - route.vbH / 2;
        const rx = tx * cos - ty * sin;
        const ry = tx * sin + ty * cos;
        const fx = rx + route.cx; // frame-space (1920×1080) coords
        const fy = ry + route.cy;
        return { x: ((fx * scale + offX) / vw) * 100, y: ((fy * scale + offY) / vh) * 100 };
      };
      // the line is drawn start→end (dashoffset 100→0), so it "finishes" at the
      // path end — that's exactly where the red icon should land.
      setPts({ end: toPct(el.getPointAtLength(total)), mid: toPct(el.getPointAtLength(total / 2)) });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [route, selected]);

  const iconPos = pts?.end ?? (selected ? selected.marker : null);
  const badgePos = pts?.mid ?? (selected ? selected.badge : null);

  return (
    <div
      className="surround-intro pointer-events-auto fixed inset-0 z-20"
      onClick={() => setSel(null)}
    >
      {/* aerial map (home — no route) as the base */}
      <Image src={bgFor("home")} alt={t("surround.mapAlt")} fill priority sizes="100vw" className="object-cover" />

      {/* neon route — drawn as an inline SVG vector (glow + self-draw + travelling
          pulse) over the route-less aerial. Same 1920×1080 frame as the map. */}
      {route && (
        <svg
          key={selected!.key}
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b34d6" />
              <stop offset="100%" stopColor="#b79bff" />
            </linearGradient>
            <filter id="routeGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <g transform={`translate(${route.cx} ${route.cy}) rotate(${route.rot}) translate(${-route.vbW / 2} ${-route.vbH / 2})`}>
            {/* soft glow underlay */}
            <path d={route.d} pathLength={100} fill="none" stroke="#7c4dff" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} filter="url(#routeGlow)" className="route-line" />
            {/* main neon line */}
            <path ref={pathRef} d={route.d} pathLength={100} fill="none" stroke="url(#routeGrad)" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" className="route-line" />
            {/* travelling bright pulse */}
            <path d={route.d} pathLength={100} fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" strokeDasharray="12 88" filter="url(#routeGlow)" className="route-pulse" />
          </g>
        </svg>
      )}

      {/* POI markers — inactive pills at their coord; the active red icon lands at
          the end of the route line */}
      {POIS.map((p) => {
        const active = sel === p.key;
        let pos = active ? iconPos ?? p.marker : p.marker;
        // universidade ends right at the top edge — nudge its icon down a hair
        if (active && pos && p.key === "universidade") pos = { x: pos.x, y: pos.y + 1.2 };
        return (
          <Marker key={p.key} poi={p} name={pick(lang, p.name)} active={active} pos={pos} onClick={() => setSel((cur) => (cur === p.key ? null : p.key))} />
        );
      })}

      {/* route time badge — centred on the middle of the line; purple glow on hover */}
      {selected && badgePos && (
        <div
          key={`badge-${selected.key}`}
          style={{ left: `${badgePos.x}%`, top: `${badgePos.y}%`, zoom: uiScale }}
          className="pointer-events-auto absolute z-[5] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[26px] border-2 border-white/45 bg-[#5F2EF9] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition duration-300 hover:scale-110 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35),0_0_28px_8px_rgba(134,103,234,0.75)]"
        >
          {selected.minutes} min
        </div>
      )}

      {/* left detail panel — rebuilt 1:1 from Figma (frame 1:588): dark glass card
          rgba(0,0,0,0.26) blur 7.15, rounded only at the bottom (bl 62 / br 55),
          photo on top (tl/tr 63, bl/br 35) over a purple block, Red Hat Regular. */}
      {selected && (
        <aside
          onClick={(e) => e.stopPropagation()}
          style={{ height: 520, aspectRatio: "302 / 603", fontFamily: "var(--font-redhat), system-ui, sans-serif", zoom: uiScale }}
          className={[
            // big frosted white back-holder that ENGLOBES the front elements
            "pointer-events-auto absolute left-8 top-[20%] rounded-[46px] border border-white/15 bg-white/[0.07] shadow-[0_28px_70px_-18px_rgba(0,0,0,0.55)] backdrop-blur-[12px] transition-all duration-300 ease-out",
            uiCollapsed ? "-translate-x-[130%] opacity-0" : "translate-x-0 opacity-100",
          ].join(" ")}
        >
          {/* dark glass card for the list — inset so the white holder peeks around */}
          <div className="absolute bottom-[2%] left-[2.6%] right-[3%] top-[22.8%] rounded-bl-[42px] rounded-br-[38px] bg-[rgba(0,0,0,0.28)] backdrop-blur-[7.15px]" />

          {/* photo (top) over a purple block that peeks below it */}
          <div className="absolute left-[2.6%] top-[2.6%] h-[34.6%] w-[94.4%]">
            {/* purple block — exact same shape/radius as the photo, just 8px lower */}
            <div className="absolute inset-0 translate-y-[8px] rounded-tl-[44px] rounded-tr-[44px] rounded-bl-[26px] rounded-br-[26px] bg-[#612fff] shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/poi-fotos/${selected.key}.webp`}
              alt={pick(lang, selected.name)}
              className="relative h-full w-full rounded-tl-[44px] rounded-tr-[44px] rounded-bl-[26px] rounded-br-[26px] object-cover"
            />
          </div>

          {/* list — selected first (name + km + description, purple accent), others below */}
          <div className="absolute inset-x-0 bottom-[3%] top-[41%] flex flex-col pl-[2.6%] pr-[8%]">
            {/* accordion — fixed order; the selected POI expands its description
                below it while the others collapse */}
            {POI_ORDER.map((key) => {
              const p = POIS.find((x) => x.key === key);
              if (!p) return null;
              const open = selected.key === key;
              return (
                <div key={key} className="relative border-t border-white/15 first:border-t-0">
                  {open && <div className="absolute bottom-2 left-0 top-2 w-[2px] rounded bg-[#a386ff]" />}
                  <button
                    type="button"
                    onClick={() => setSel(key)}
                    className="flex w-full items-baseline justify-between gap-3 py-2 pl-4 text-left transition-colors hover:text-white"
                  >
                    <span className={["text-[17px] transition-colors", open ? "font-bold text-[#c4adff] [text-shadow:0_0_12px_rgba(150,103,234,0.6)]" : "font-normal text-white"].join(" ")}>{pick(lang, p.name)}</span>
                    <span className="shrink-0 text-[12px] font-light text-white/80">{p.km}</span>
                  </button>
                  <div className={["grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"].join(" ")}>
                    <div className={["overflow-hidden transition-opacity duration-300", open ? "opacity-100" : "opacity-0"].join(" ")}>
                      <p className="pb-3 pl-4 text-[12px] font-light leading-snug text-white/65">{pick(lang, p.description)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
