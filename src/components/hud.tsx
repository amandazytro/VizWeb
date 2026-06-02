"use client";

import { type ReactNode } from "react";
import { useExperience, type Panel } from "@/lib/store";

/* — orientation compass (replaces the time/mood bar) — */
const CARD: Record<number, string> = {
  0: "N",
  45: "NE",
  90: "L",
  135: "SE",
  180: "S",
  225: "SO",
  270: "O",
  315: "NO",
};

function Compass({ heading }: { heading: number }) {
  const W = 520; // ribbon width (px)
  const SPAN = 90; // degrees visible across the ribbon
  const pxPerDeg = W / SPAN;
  const startDeg = Math.ceil((heading - SPAN / 2) / 15) * 15;
  const marks: { deg: number; x: number; label: string | null; center: boolean }[] = [];
  for (let d = startDeg; d <= heading + SPAN / 2 + 0.001; d += 15) {
    const x = W / 2 + (d - heading) * pxPerDeg;
    const norm = ((d % 360) + 360) % 360;
    const label = norm % 45 === 0 ? CARD[norm] : null;
    marks.push({ deg: d, x, label, center: Math.abs(x - W / 2) < pxPerDeg * 6 });
  }
  return (
    <div
      className="pointer-events-none relative h-7 select-none"
      style={{ width: W, maskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)" }}
    >
      {marks.map((m) => (
        <div key={m.deg} className="absolute top-0 -translate-x-1/2" style={{ left: m.x }}>
          {m.label ? (
            <span
              className={[
                "text-[13px] font-medium tracking-wide drop-shadow",
                m.center ? "text-accent" : "text-white/85",
              ].join(" ")}
            >
              {m.label}
            </span>
          ) : (
            <span className="mt-1.5 block h-2 w-px bg-white/30" />
          )}
        </div>
      ))}
      {/* center caret */}
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent/70" />
    </div>
  );
}

function ExploreIcon({ className = "" }: { className?: string }) {
  // Custom glyph (Refs/explorar.svg), cropped to the icon bounds.
  return (
    <svg viewBox="19 20 28 27" className={className} fill="currentColor">
      <path d="M33.0958 21.0011C33.6315 21 34.3726 21.1502 34.8911 21.3125C36.2879 21.7508 42.1041 26.2567 43.4444 27.4384C44.6992 28.5447 45.834 30.1339 46.0056 31.8334C46.2175 33.9362 46.1976 38.222 46.012 40.3449C45.7566 43.2712 43.0835 45.8213 40.1953 46.2867C35.7318 46.0681 30.746 46.7058 26.3421 46.3291C22.9936 46.0426 20.3861 43.1513 20.1301 39.9119C19.9225 37.2849 19.7988 31.5082 21.0971 29.3194C22.1572 27.5323 27.0101 24.1131 28.9205 22.7616C30.2985 21.7864 31.2645 21.0037 33.0958 21V21.0011Z" />
    </svg>
  );
}
function BuildingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V5l8-2v18M19 21V9l-6-2M8 8h0M8 11h0M8 14h0M16 12h0M16 15h0" />
    </svg>
  );
}
function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.8 6.5 20.2l1.1-6.2L3 9.6l6.3-.9L12 3z" />
    </svg>
  );
}
function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function MediaIcon({ className = "" }: { className?: string }) {
  // Custom glyph (Refs/galeria.svg), cropped to the icon bounds.
  return (
    <svg viewBox="47 46 30 29" className={className} fill="currentColor">
      <path d="M67.2492 54.4438C69.0678 54.2009 70.2035 55.5359 70.9225 56.9833C72.5538 60.2663 73.7693 63.8955 75.3602 67.2124C76.4984 70.5335 74.2582 73.8627 70.7562 74.2188L52.6459 74.2155C48.7819 73.6678 46.8424 70.1212 48.4098 66.5879C49.0163 65.2198 49.8907 63.5246 50.6316 62.2185C51.5018 60.6852 52.551 59.5625 54.5149 59.8244C56.7963 60.1276 57.3264 62.9314 59.3709 63.0273C60.3041 63.071 61.0862 62.4564 61.5927 61.7451C62.9711 59.8087 64.678 54.7883 67.2484 54.4446L67.2492 54.4438Z" />
      <path d="M54.3612 46.9013C59.8363 46.2957 61.5482 53.4962 56.8072 55.4294C53.2633 56.8743 49.6362 53.6532 50.6971 50.0389C51.1541 48.4833 52.7047 47.0847 54.3612 46.9021V46.9013Z" />
    </svg>
  );
}
function CornerButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: (p: { className?: string }) => ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "pointer-events-auto flex flex-col items-center gap-1 transition",
        active ? "text-white" : "text-white/75 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] tracking-[0.18em]">{label}</span>
    </button>
  );
}

const NAV: { label: string; icon: (p: { className?: string }) => ReactNode; panel: Panel }[] = [
  { label: "Explorar", icon: ExploreIcon, panel: "none" },
  { label: "Apartamentos", icon: BuildingIcon, panel: "apartments" },
  { label: "Áreas comuns", icon: StarIcon, panel: "amenities" },
  { label: "Arredores", icon: PinIcon, panel: "surroundings" },
];

export default function Hud() {
  const heading = useExperience((s) => s.heading);
  const panel = useExperience((s) => s.panel);
  const openPanel = useExperience((s) => s.openPanel);
  const closePanel = useExperience((s) => s.closePanel);
  const activePanel: Panel = panel === "gallery" ? "none" : panel;
  const onNav = (p: Panel) => (p === "none" ? closePanel() : openPanel(p));

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* ── Brand ── */}
      <div className="absolute left-6 top-5">
        <span className="text-sm font-semibold tracking-[0.25em] text-white drop-shadow">
          THE VERTICAL
        </span>
      </div>

      {/* ── Top-center: orientation compass ── */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <Compass heading={heading} />
      </div>

      {/* ── Top-right: Galeria ── */}
      <div className="absolute right-6 top-3">
        <CornerButton
          icon={MediaIcon}
          label="Galeria"
          active={panel === "gallery"}
          onClick={() => openPanel("gallery")}
        />
      </div>

      {/* ── Bottom-center: primary nav ── */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <ul className="pointer-events-auto flex items-end gap-7 rounded-3xl border border-[var(--hud-border)] bg-[var(--hud)] px-7 py-2.5 backdrop-blur-md">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.panel;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onNav(item.panel)}
                  aria-pressed={isActive}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-full transition",
                      isActive
                        ? "bg-accent text-white shadow-[0_8px_24px_-6px_rgba(124,92,255,0.7)]"
                        : "bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={[
                      "text-[10px] tracking-[0.14em] transition",
                      isActive ? "text-white" : "text-white/55 group-hover:text-white/80",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* scroll hint only in Explore */}
      {activePanel === "none" && panel !== "gallery" && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/45">
            Role para explorar
          </span>
        </div>
      )}
    </div>
  );
}
