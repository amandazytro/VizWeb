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
function SofaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <path d="M3 13a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" transform="translate(1 -1)" />
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
function InterfaceIcon({ className = "" }: { className?: string }) {
  // Custom glyph (Refs/interface.svg) — eye-off, cropped to bounds.
  return (
    <svg viewBox="17 21 33 24" className={className} fill="currentColor">
      <path d="M48.4857 31.8895V32.6058C48.3449 33.1309 48.0632 33.5054 47.7586 33.9378C46.4636 35.7765 44.7254 37.4449 42.855 38.6863L39.0881 34.9358C41.4498 29.4667 35.9927 24.0019 30.5236 26.3713L27.8398 23.6274C34.8397 21.2079 42.2589 23.8786 46.8731 29.4164C47.4965 30.1655 48.1571 30.9647 48.4857 31.8906V31.8895Z" />
      <path d="M22.3334 22.1772C22.6424 22.1139 23.0595 22.1565 23.3062 22.3705L42.8766 41.8819C43.9401 42.8821 42.8002 44.4686 41.5424 43.7534L38.6107 40.86C33.0095 42.8002 26.9508 41.4987 22.3814 37.8552C21.0352 36.7819 19.1211 34.8635 18.2673 33.3775C17.3261 31.7386 18.8176 30.2286 19.8723 29.0254C20.9522 27.7937 22.2242 26.7434 23.5421 25.7738C23.5421 25.6275 21.6968 24.1371 21.5549 23.6458C21.3845 23.0584 21.699 22.3083 22.3334 22.1783V22.1772ZM35.8342 38.1533C35.8604 38.0495 35.7905 38.0343 35.7446 37.9742C35.3133 37.4119 34.5643 36.8933 34.1014 36.3321C31.1359 36.9348 28.5198 34.3219 29.1225 31.3532C28.5613 30.8902 28.0427 30.1412 27.4804 29.71C27.4203 29.6641 27.405 29.5942 27.3013 29.6204C25.0226 35.0491 30.4076 40.4309 35.8331 38.1522L35.8342 38.1533Z" />
      <path d="M32.8991 28.0893C35.3045 27.8621 37.4369 29.9454 37.3888 32.3398C37.3866 32.4501 37.3146 33.0834 37.2371 33.0823L32.375 28.2203C32.3707 28.1373 32.8118 28.0969 32.8991 28.0893Z" />
    </svg>
  );
}
function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 3l-1.2 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.8L15 3H9Zm3 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
      />
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

const HORIZON = ["Explore", "Apartments", "Decored"] as const;
type Nav = (typeof HORIZON)[number];

const NAV_LABEL: Record<Nav, string> = {
  Explore: "Explorar",
  Apartments: "Apartamentos",
  Decored: "Decorado",
};

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
  const uiHidden = useExperience((s) => s.uiHidden);
  const setUiHidden = useExperience((s) => s.setUiHidden);
  const [active, setActive] = useState<Nav>("Explore");

  // Keep nav highlight in sync when the panel is closed elsewhere (Esc / ✕).
  useEffect(() => {
    if (panel === "none" && active === "Apartments") setActive("Explore");
  }, [panel, active]);

  // Esc restores a hidden interface (photo / clean view).
  useEffect(() => {
    if (!uiHidden) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUiHidden(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uiHidden, setUiHidden]);

  const onNav = (item: Nav) => {
    setActive(item);
    if (item === "Apartments") openPanel("apartments");
    else closePanel();
  };

  // Clean view: hide the whole HUD, leave a single restore affordance.
  if (uiHidden) {
    return (
      <button
        type="button"
        onClick={() => setUiHidden(false)}
        aria-label="Mostrar interface"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-[11px] tracking-widest text-white/80 backdrop-blur-md transition hover:bg-white/10"
      >
        <InterfaceIcon className="h-4 w-4" />
        Interface
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* ── Top: time / mood controller ── */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-[var(--hud-border)] bg-[var(--hud)] px-4 py-2 text-[11px] tracking-wide text-white/85 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-white/70">
            <CompassIcon className="h-3.5 w-3.5" />
            NO
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
              aria-label="Hora do dia"
              className="zy-range h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/25"
            />
            <MoonIcon className="h-4 w-4 text-slate-200/80" />
          </span>
          <span className="text-white/60">Verão</span>
        </div>
      </div>

      {/* ── Bottom-left: Mídia · Interface · Modo Foto ── */}
      <div className="absolute bottom-6 left-6 flex items-end gap-6">
        <CornerButton
          icon={MediaIcon}
          label="Mídia"
          active={panel === "gallery"}
          onClick={() => openPanel("gallery")}
        />
        <CornerButton icon={InterfaceIcon} label="Interface" onClick={() => setUiHidden(true)} />
        <CornerButton icon={CameraIcon} label="Modo Foto" onClick={() => setUiHidden(true)} />
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
                    {NAV_LABEL[item]}
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
          Role para explorar
        </span>
      </div>
    </div>
  );
}
