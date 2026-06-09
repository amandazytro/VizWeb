"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useExperience, type Panel } from "@/lib/store";

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ExploreIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="48 47 25 29" className={className} fill="currentColor">
      <path d="M60.6277 47.878C61.0318 47.9353 61.5809 48.2823 61.7734 48.6527L71.7543 72.587C72.2526 73.8715 70.9859 75.2264 69.6766 74.7766L60.3479 70.24L51.0543 74.7766C49.7615 75.2223 48.5031 73.8998 48.9615 72.6242L58.9775 48.6196C59.172 48.2671 59.7129 47.9332 60.1026 47.8773C60.218 47.8608 60.5129 47.8614 60.6277 47.878Z" />
    </svg>
  );
}
function BuildingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="19 20 28 27" className={className} fill="currentColor">
      <path d="M33.0958 21.0011C33.6315 21 34.3726 21.1502 34.8911 21.3125C36.2879 21.7508 42.1041 26.2567 43.4444 27.4384C44.6992 28.5447 45.834 30.1339 46.0056 31.8334C46.2175 33.9362 46.1976 38.222 46.012 40.3449C45.7566 43.2712 43.0835 45.8213 40.1953 46.2867C35.7318 46.0681 30.746 46.7058 26.3421 46.3291C22.9936 46.0426 20.3861 43.1513 20.1301 39.9119C19.9225 37.2849 19.7988 31.5082 21.0971 29.3194C22.1572 27.5323 27.0101 24.1131 28.9205 22.7616C30.2985 21.7864 31.2645 21.0037 33.0958 21V21.0011Z" />
    </svg>
  );
}
function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="46 47 31 29" className={className} fill="currentColor">
      <path d="M75.5215 58.1859V58.8588L75.106 59.7577L69.9009 64.8855C69.7189 65.0742 69.6376 65.3479 69.6283 65.6071C70.0244 68.1658 70.6303 70.7152 70.8422 73.2916C70.763 73.9365 70.2322 74.5844 69.653 74.8405C68.5925 75.3091 67.8652 74.7731 66.9528 74.3087C65.4005 73.5176 63.8946 72.6177 62.3372 71.8391C61.3291 71.3352 61.3682 71.2689 60.3323 71.7831C58.489 72.6975 56.5108 74.0298 54.6592 74.8125C53.0926 75.474 51.5095 74.3429 51.7183 72.6333L52.9311 65.6081C52.9548 65.0431 52.3869 64.6056 52.0187 64.2417C51.2153 63.4475 50.3677 62.6865 49.5674 61.8893C48.9707 61.2952 47.8886 60.3559 47.4267 59.7286C46.611 58.6214 47.1212 57.0092 48.3978 56.5582C50.7328 56.0346 53.2994 55.987 55.618 55.48C56.085 55.3784 56.1776 55.2768 56.4131 54.8797C57.5477 52.971 58.3244 50.489 59.4765 48.6031C60.0422 47.6763 61.0143 47.2595 62.0584 47.6742C62.8063 47.9717 63.0449 48.5243 63.3864 49.1951C64.303 50.9908 65.1393 53.1846 66.1473 54.8797C66.3839 55.2768 66.4765 55.3784 66.9425 55.48C69.2416 55.9818 71.8029 56.0253 74.1205 56.5437C74.8879 56.7977 75.3251 57.426 75.5226 58.187L75.5215 58.1859Z" />
    </svg>
  );
}
function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="46 43 30 38" className={className} fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M62.2064 43.8652C68.8924 44.3567 74.3452 49.7272 74.7139 56.3941C75.1163 63.6576 67.9281 72.7267 63.0466 77.7237C62.8123 77.9634 61.7051 79.1133 61.5109 79.1751C61.2626 79.2544 61.1179 79.2083 60.9135 79.0681C60.5587 78.8247 59.8885 78.0704 59.5487 77.7237C54.6653 72.7331 47.4799 63.6521 47.8814 56.3941C48.2473 49.7926 53.7122 44.2968 60.3888 43.8652H62.2064ZM60.7249 51.0642C55.9536 51.482 53.5143 56.9667 56.3774 60.7696C59.0548 64.3271 64.7102 63.8651 66.7611 59.9258C68.9904 55.6435 65.5615 50.641 60.7249 51.0642Z" />
    </svg>
  );
}

const NAV: { label: string; icon: (p: { className?: string }) => ReactNode; panel: Panel }[] = [
  { label: "Explorar", icon: ExploreIcon, panel: "none" },
  { label: "Apartamentos", icon: BuildingIcon, panel: "apartments" },
  { label: "Áreas comuns", icon: StarIcon, panel: "amenities" },
  { label: "Aproximidades", icon: PinIcon, panel: "surroundings" },
];

/** Primary bottom navigation dock (shared by the HUD and the share screen). */
export default function Dock({ onNavigate }: { onNavigate?: () => void }) {
  const panel = useExperience((s) => s.panel);
  const openPanel = useExperience((s) => s.openPanel);
  const closePanel = useExperience((s) => s.closePanel);
  const setAptReady = useExperience((s) => s.setAptReady);
  const bumpNav = useExperience((s) => s.bumpNav);
  const dockMinimized = useExperience((s) => s.dockMinimized);
  const [dockHidden, setDockHidden] = useState(false);

  useEffect(() => {
    setDockHidden(dockMinimized);
  }, [dockMinimized]);

  const activePanel: Panel = panel;
  const onNav = (p: Panel) => {
    onNavigate?.();
    bumpNav();
    if (p === "none") return closePanel();
    // Only reset aptReady when actually entering Apartamentos from another panel.
    // Re-tapping while already there would leave aptReady=false forever (the hero
    // only flips it back on a panel change) → frozen bg, dead filters.
    if (p === "apartments" && panel !== "apartments") setAptReady(false);
    openPanel(p);
  };

  return (
    <div
      className={[
        "absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 transition-transform duration-300 ease-out",
        dockHidden ? "translate-y-[68%]" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => setDockHidden((v) => !v)}
        aria-label={dockHidden ? "Mostrar menu" : "Ocultar menu"}
        aria-expanded={!dockHidden}
        className={[
          "pointer-events-auto flex h-5 w-9 items-center justify-center rounded-full text-white/60 transition hover:text-white",
          dockHidden ? "order-first" : "order-last",
        ].join(" ")}
      >
        <ChevronIcon className={["h-3.5 w-3.5 transition-transform", dockHidden ? "rotate-180" : ""].join(" ")} />
      </button>
      <nav>
        <ul className="pointer-events-auto flex items-end gap-7 rounded-3xl border border-white/20 bg-white/15 px-7 py-2.5 backdrop-blur-xl backdrop-saturate-150">
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
                      "flex h-11 w-11 items-center justify-center rounded-2xl transition",
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
    </div>
  );
}
