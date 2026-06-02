"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useExperience, moodToTime } from "@/lib/store";

/* — minimal inline icons — */
function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}
function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.2 6.2 0 0 0 10.5 10.5z" />
    </svg>
  );
}
function CompassIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ExploreIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" />
      <path d="M9 4v13M15 7v13" />
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
function SofaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <path d="M3 13a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" transform="translate(1 -1)" />
    </svg>
  );
}
function MediaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="M21 15l-5-4-5 4-3-2-5 4" />
    </svg>
  );
}

const HORIZON = ["Explore", "Apartments", "Decored"] as const;
type Nav = (typeof HORIZON)[number];

const ICONS: Record<Nav, (p: { className?: string }) => ReactNode> = {
  Explore: ExploreIcon,
  Apartments: BuildingIcon,
  Decored: SofaIcon,
};

export default function Hud() {
  const dayNight = useExperience((s) => s.dayNight);
  const setDayNight = useExperience((s) => s.setDayNight);
  const panel = useExperience((s) => s.panel);
  const openPanel = useExperience((s) => s.openPanel);
  const closePanel = useExperience((s) => s.closePanel);
  const [active, setActive] = useState<Nav>("Explore");

  // Keep nav highlight in sync when the panel is closed elsewhere (Esc / ✕).
  useEffect(() => {
    if (panel === "none" && active === "Apartments") setActive("Explore");
  }, [panel, active]);

  const onNav = (item: Nav) => {
    setActive(item);
    if (item === "Apartments") openPanel("apartments");
    else closePanel();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* ── Top: time / mood controller ── */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-[var(--hud-border)] bg-[var(--hud)] px-4 py-2 text-[11px] tracking-wide text-white/85 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-white/70">
            <CompassIcon className="h-3.5 w-3.5" />
            NW
          </span>
          <span className="tabular-nums text-white">{moodToTime(dayNight)}</span>
          <span className="flex items-center gap-2">
            <SunIcon className="h-4 w-4 text-amber-200/90" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(dayNight * 100)}
              onChange={(e) => setDayNight(Number(e.target.value) / 100)}
              aria-label="Time of day"
              className="zy-range h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/25"
            />
            <MoonIcon className="h-4 w-4 text-slate-200/80" />
          </span>
          <span className="text-white/60">Summer</span>
        </div>
      </div>

      {/* ── Bottom-left: Media ── */}
      <div className="absolute bottom-6 left-6">
        <button
          type="button"
          onClick={() => openPanel("gallery")}
          aria-pressed={panel === "gallery"}
          className={[
            "pointer-events-auto flex flex-col items-center gap-1 transition",
            panel === "gallery" ? "text-white" : "text-white/75 hover:text-white",
          ].join(" ")}
        >
          <MediaIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-[0.18em]">Media</span>
        </button>
      </div>

      {/* ── Bottom-center: primary nav ── */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <ul className="pointer-events-auto flex items-end gap-9">
          {HORIZON.map((item) => {
            const Icon = ICONS[item];
            const isActive = active === item;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onNav(item)}
                  aria-pressed={isActive}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-full border transition",
                      isActive
                        ? "border-transparent bg-accent text-white shadow-[0_8px_24px_-6px_rgba(124,92,255,0.7)]"
                        : "border-[var(--hud-border)] bg-[var(--hud)] text-white/80 backdrop-blur-md group-hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={[
                      "text-[10px] tracking-[0.18em] transition",
                      isActive ? "text-white" : "text-white/55 group-hover:text-white/80",
                    ].join(" ")}
                  >
                    {item}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Scroll hint (fades as user scrolls is handled by hero; static here) ── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/45">
          Scroll · day → night
        </span>
      </div>
    </div>
  );
}
