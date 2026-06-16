"use client";

import { useEffect, type ReactNode } from "react";
import { useExperience, type Lang, type Panel } from "@/lib/store";
import { useT, type TKey } from "@/lib/i18n";
import { useUiScale } from "@/lib/use-ui-scale";

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* — orientation compass (replaces the time/mood bar) — */
const CARD: Record<Lang, Record<number, string>> = {
  pt: { 0: "N", 45: "NE", 90: "L", 135: "SE", 180: "S", 225: "SO", 270: "O", 315: "NO" },
  en: { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" },
};

function Compass({ heading, lang }: { heading: number; lang: Lang }) {
  const W = 520; // ribbon width (px)
  const SPAN = 90; // degrees visible across the ribbon
  const pxPerDeg = W / SPAN;
  const startDeg = Math.ceil((heading - SPAN / 2) / 15) * 15;
  const marks: { deg: number; x: number; label: string | null; center: boolean }[] = [];
  for (let d = startDeg; d <= heading + SPAN / 2 + 0.001; d += 15) {
    const x = W / 2 + (d - heading) * pxPerDeg;
    const norm = ((d % 360) + 360) % 360;
    const label = norm % 45 === 0 ? CARD[lang][norm] : null;
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
  // Refs/icones/explorar.svg glyph, cropped.
  return (
    <svg viewBox="48 47 25 29" className={className} fill="currentColor">
      <path d="M60.6277 47.878C61.0318 47.9353 61.5809 48.2823 61.7734 48.6527L71.7543 72.587C72.2526 73.8715 70.9859 75.2264 69.6766 74.7766L60.3479 70.24L51.0543 74.7766C49.7615 75.2223 48.5031 73.8998 48.9615 72.6242L58.9775 48.6196C59.172 48.2671 59.7129 47.9332 60.1026 47.8773C60.218 47.8608 60.5129 47.8614 60.6277 47.878Z" />
    </svg>
  );
}
function BuildingIcon({ className = "" }: { className?: string }) {
  // Refs/icones/apartamentos.svg glyph, cropped.
  return (
    <svg viewBox="19 20 28 27" className={className} fill="currentColor">
      <path d="M33.0958 21.0011C33.6315 21 34.3726 21.1502 34.8911 21.3125C36.2879 21.7508 42.1041 26.2567 43.4444 27.4384C44.6992 28.5447 45.834 30.1339 46.0056 31.8334C46.2175 33.9362 46.1976 38.222 46.012 40.3449C45.7566 43.2712 43.0835 45.8213 40.1953 46.2867C35.7318 46.0681 30.746 46.7058 26.3421 46.3291C22.9936 46.0426 20.3861 43.1513 20.1301 39.9119C19.9225 37.2849 19.7988 31.5082 21.0971 29.3194C22.1572 27.5323 27.0101 24.1131 28.9205 22.7616C30.2985 21.7864 31.2645 21.0037 33.0958 21V21.0011Z" />
    </svg>
  );
}
function StarIcon({ className = "" }: { className?: string }) {
  // Refs/icones/areas comuns.svg glyph, cropped.
  return (
    <svg viewBox="46 47 31 29" className={className} fill="currentColor">
      <path d="M75.5215 58.1859V58.8588L75.106 59.7577L69.9009 64.8855C69.7189 65.0742 69.6376 65.3479 69.6283 65.6071C70.0244 68.1658 70.6303 70.7152 70.8422 73.2916C70.763 73.9365 70.2322 74.5844 69.653 74.8405C68.5925 75.3091 67.8652 74.7731 66.9528 74.3087C65.4005 73.5176 63.8946 72.6177 62.3372 71.8391C61.3291 71.3352 61.3682 71.2689 60.3323 71.7831C58.489 72.6975 56.5108 74.0298 54.6592 74.8125C53.0926 75.474 51.5095 74.3429 51.7183 72.6333L52.9311 65.6081C52.9548 65.0431 52.3869 64.6056 52.0187 64.2417C51.2153 63.4475 50.3677 62.6865 49.5674 61.8893C48.9707 61.2952 47.8886 60.3559 47.4267 59.7286C46.611 58.6214 47.1212 57.0092 48.3978 56.5582C50.7328 56.0346 53.2994 55.987 55.618 55.48C56.085 55.3784 56.1776 55.2768 56.4131 54.8797C57.5477 52.971 58.3244 50.489 59.4765 48.6031C60.0422 47.6763 61.0143 47.2595 62.0584 47.6742C62.8063 47.9717 63.0449 48.5243 63.3864 49.1951C64.303 50.9908 65.1393 53.1846 66.1473 54.8797C66.3839 55.2768 66.4765 55.3784 66.9425 55.48C69.2416 55.9818 71.8029 56.0253 74.1205 56.5437C74.8879 56.7977 75.3251 57.426 75.5226 58.187L75.5215 58.1859Z" />
    </svg>
  );
}
function PinIcon({ className = "" }: { className?: string }) {
  // Refs/icones/proximidades.svg glyph, cropped.
  return (
    <svg viewBox="46 43 30 38" className={className} fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M62.2064 43.8652C68.8924 44.3567 74.3452 49.7272 74.7139 56.3941C75.1163 63.6576 67.9281 72.7267 63.0466 77.7237C62.8123 77.9634 61.7051 79.1133 61.5109 79.1751C61.2626 79.2544 61.1179 79.2083 60.9135 79.0681C60.5587 78.8247 59.8885 78.0704 59.5487 77.7237C54.6653 72.7331 47.4799 63.6521 47.8814 56.3941C48.2473 49.7926 53.7122 44.2968 60.3888 43.8652H62.2064ZM60.7249 51.0642C55.9536 51.482 53.5143 56.9667 56.3774 60.7696C59.0548 64.3271 64.7102 63.8651 66.7611 59.9258C68.9904 55.6435 65.5615 50.641 60.7249 51.0642Z" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  // Same filled sun glyph used in the solar slider (public/aptos/icons/sol.svg).
  return (
    <svg viewBox="0 0 30 30" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.8384 14.9102C29.8384 15.1034 29.8118 15.298 29.7261 15.4712C29.5152 15.8975 29.1673 16.2527 28.6755 16.342C28.1506 16.4368 26.4599 16.4286 25.9049 16.3684C24.1678 16.1797 24.1678 13.6407 25.9049 13.4519C26.4599 13.3917 28.1506 13.3835 28.6755 13.4784C29.1665 13.5677 29.5149 13.9228 29.726 14.3492C29.8118 14.5224 29.8384 14.717 29.8384 14.9102Z" />
      <path d="M14.9218 29.8384C14.7287 29.8384 14.5342 29.8117 14.3612 29.726C13.9351 29.5149 13.5802 29.1668 13.4909 28.6747C13.3961 28.1494 13.4043 26.4577 13.4645 25.9023C13.6522 24.1686 16.1913 24.1686 16.3791 25.9023C16.4392 26.4577 16.4474 28.1494 16.3527 28.6747C16.2634 29.166 15.9084 29.5147 15.4823 29.7259C15.3093 29.8117 15.1148 29.8384 14.9218 29.8384Z" />
      <path d="M7.47939 15.6808C6.87514 9.04981 14.4861 4.90577 19.6683 9.14009C24.2325 12.8701 22.7798 20.2954 17.1811 22.041C12.719 23.4326 7.90592 20.3593 7.47939 15.6808Z" />
      <path d="M21.3452 23.0314C21.1593 21.8467 22.3897 20.9375 23.4697 21.4883C23.8014 21.6579 25.5012 23.3615 25.6898 23.698C26.3925 24.9511 25.1339 26.3418 23.8151 25.7491C23.4578 25.5886 21.6752 23.8202 21.4938 23.4655C21.4455 23.3706 21.3607 23.1335 21.3452 23.0314Z" />
      <path d="M3.98058 24.7217C3.98058 24.7214 3.98056 24.7211 3.98051 24.7208C3.90863 24.2231 3.99252 23.8849 4.29136 23.4883C4.54017 23.1572 6.01753 21.6825 6.33469 21.5102C7.63068 20.807 9.02784 22.2097 8.32698 23.5038C8.15108 23.8293 6.46866 25.5037 6.13965 25.688C5.29766 26.1603 4.12494 25.7109 3.98064 24.7226C3.9806 24.7223 3.98058 24.722 3.98058 24.7217Z" />
      <path d="M3.97967 5.71379C3.72812 4.23729 5.28386 3.39736 6.44406 4.35585C6.7995 4.64951 8.14015 5.9737 8.32698 6.31934C9.01781 7.59429 7.6644 8.99235 6.37206 8.3339C6.03029 8.15972 4.27222 6.3923 4.10908 6.05031C4.06078 5.94817 3.99789 5.82323 3.97967 5.71379Z" />
      <path d="M21.3457 7.28786C21.3454 7.28786 21.3452 7.28767 21.3452 7.28741C21.2897 6.93555 21.3635 6.59189 21.5394 6.2856C21.7262 5.9582 23.374 4.32028 23.703 4.13515C24.9972 3.40922 26.398 4.77171 25.7126 6.0877C25.5413 6.41692 23.8351 8.13509 23.508 8.31293C22.6341 8.78708 21.5014 8.27205 21.3462 7.28832C21.3462 7.28806 21.346 7.28786 21.3457 7.28786Z" />
      <path d="M13.4781 4.02206C13.3943 3.48126 13.4025 1.85703 13.4636 1.29525C13.6495 -0.42201 16.1549 -0.423836 16.3727 1.24235C16.4465 1.80778 16.4401 3.34446 16.3782 3.91992C16.1932 5.62897 13.7306 5.65177 13.4781 4.02206Z" />
      <path d="M0.0183223 15.1601C0.0180599 15.1601 0.0178362 15.1599 0.0177954 15.1596C-0.112243 14.3335 0.485559 13.5431 1.31477 13.4538C1.86798 13.3936 3.56225 13.3854 4.08539 13.4802C5.67302 13.7693 5.61469 16.1879 3.93774 16.3694C3.38271 16.4295 1.69208 16.4378 1.16713 16.3429C0.642309 16.2481 0.105652 15.7112 0.0188488 15.1605C0.0188079 15.1603 0.0185847 15.1601 0.0183223 15.1601Z" />
    </svg>
  );
}

// `solar: true` is a mode toggle (day/night inside Apartamentos), not a panel —
// clicking it opens Apartamentos if needed and turns solar on.
const NAV: { key: TKey; icon: (p: { className?: string }) => ReactNode; panel?: Panel; solar?: boolean }[] = [
  { key: "nav.apartments", icon: BuildingIcon, panel: "apartments" },
  { key: "nav.amenities", icon: StarIcon, panel: "amenities" },
  { key: "nav.explore", icon: ExploreIcon, panel: "none" },
  { key: "nav.surroundings", icon: PinIcon, panel: "surroundings" },
  { key: "nav.solar", icon: SunIcon, solar: true },
];

/* — PT / EN language toggle (top-right on the Explore screen) — */
function LangToggle() {
  const lang = useExperience((s) => s.lang);
  const setLang = useExperience((s) => s.setLang);
  const uiScale = useUiScale();
  // rehydrate the saved choice after mount (kept out of the store initializer to
  // avoid an SSR/CSR hydration mismatch)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("zy-lang") : null;
    if (saved === "pt" || saved === "en") setLang(saved);
  }, [setLang]);
  return (
    <div
      style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", zoom: uiScale }}
      className="pointer-events-auto absolute right-10 top-10 flex items-center overflow-hidden rounded-full border border-white/15 bg-[rgba(166,166,166,0.20)] text-[11px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-md"
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={[
            "px-3 py-1.5 uppercase tracking-wide transition",
            lang === l ? "bg-accent text-white" : "text-white/70 hover:text-white",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Hud() {
  const heading = useExperience((s) => s.heading);
  const panel = useExperience((s) => s.panel);
  const openPanel = useExperience((s) => s.openPanel);
  const closePanel = useExperience((s) => s.closePanel);
  const setAptReady = useExperience((s) => s.setAptReady);
  const bumpNav = useExperience((s) => s.bumpNav);
  const dockMinimized = useExperience((s) => s.dockMinimized);
  const uiCollapsed = useExperience((s) => s.uiCollapsed);
  const toggleUi = useExperience((s) => s.toggleUi);
  const aptExpanded = useExperience((s) => s.aptExpanded);
  const hudDockHidden = useExperience((s) => s.hudDockHidden);
  const hudBrandHidden = useExperience((s) => s.hudBrandHidden);
  const lang = useExperience((s) => s.lang);
  const solarMode = useExperience((s) => s.solarMode);
  const setSolarMode = useExperience((s) => s.setSolarMode);
  const uiScale = useUiScale();
  const t = useT();
  // Dock hides when the user retracts the UI or an overlay auto-minimizes it.
  const dockHidden = uiCollapsed || dockMinimized;
  const activePanel: Panel = panel;
  const onNav = (p: Panel) => {
    bumpNav(); // reset the target overlay to its base view (even if it's already active)
    if (p === "none") return closePanel();
    if (p === "apartments") setAptReady(false); // gate UI until the hero settles at frame 0
    openPanel(p);
  };
  // Sun button: toggles solar while in Apartamentos; from anywhere else it opens
  // Apartamentos and goes straight into the day/night solar view.
  const onSolar = () => {
    if (panel === "apartments") {
      setSolarMode(!solarMode);
    } else {
      // Go straight to the day/night solar view — skip the apartments intro/gate
      // and don't bump nav (which would reset solar back off).
      openPanel("apartments");
      setAptReady(true);
      setSolarMode(true);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 select-none">
      {/* ── Brand ── (inset from the edge, sitting just below the compass) */}
      {!hudBrandHidden && (
      <div className="absolute left-10 top-10" style={{ zoom: uiScale }}>
        <span
          style={{ fontFamily: "var(--font-recia), Georgia, serif", fontSize: "clamp(26px, 2.05vw, 39px)" }}
          className="font-bold tracking-[0.02em] text-white drop-shadow"
        >
          THE VERTICAL
        </span>
      </div>
      )}

      {/* ── Top-right: PT / EN language toggle (Explore screen) ── */}
      {panel === "none" && !aptExpanded && <LangToggle />}

      {/* ── Top-center: orientation compass (Explorar + Apartamentos; hidden in expanded plan) ── */}
      {(panel === "none" || panel === "apartments") && !aptExpanded && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2" style={{ zoom: uiScale }}>
          <Compass heading={heading} lang={lang} />
        </div>
      )}


      {/* ── Bottom-center: primary nav (slides) + retract tab (stays put) ──
          Figma proportions (r22 container, r14 tiles, own shadow, Plus Jakarta
          labels) at a compact scale; labels are absolute so the tiles stay tight.
          Hidden in the expanded floorplan view (which has its own dock). */}
      {!aptExpanded && !hudDockHidden && (
      <nav className="absolute inset-x-0 bottom-0">
        <div
          className={[
            "absolute bottom-[38px] left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out",
            dockHidden ? "translate-y-[150px]" : "",
          ].join(" ")}
          style={{ transitionDelay: uiCollapsed ? "150ms" : "0ms", zoom: uiScale }}
        >
          <ul className="pointer-events-auto inline-flex items-center gap-9 rounded-[30px] border border-white/10 bg-[rgba(166,166,166,0.20)] px-10 pt-4 pb-7 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.solar ? solarMode : activePanel === item.panel && !solarMode;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => (item.solar ? onSolar() : onNav(item.panel!))}
                    aria-pressed={isActive}
                    className="group relative flex items-center justify-center"
                  >
                    {/* Each tile carries its own shadow so it lifts off the container. */}
                    <span
                      className={[
                        "flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 transition",
                        isActive
                          ? "bg-accent text-white shadow-[0_0_14px_3px_rgba(134,103,234,0.45)]"
                          : "bg-white/10 text-white/85 shadow-[0_0_12px_2px_rgba(0,0,0,0.25)] group-hover:bg-white/15",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
                      className={[
                        "absolute left-1/2 top-full mt-[5px] -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold leading-none text-[#dcd9d9] transition",
                        isActive ? "opacity-90" : "opacity-40 group-hover:opacity-70",
                      ].join(" ")}
                    >
                      {t(item.key)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* retract tab — bottom-center, straddling the dock's lower edge */}
        <button
          type="button"
          onClick={toggleUi}
          aria-label={dockHidden ? t("hud.showMenu") : t("hud.hideMenu")}
          aria-expanded={!dockHidden}
          style={{ zoom: uiScale }}
          className="pointer-events-auto absolute bottom-[24px] left-1/2 z-10 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-[6px] border border-white/10 bg-[rgba(166,166,166,0.28)] backdrop-blur-md"
        >
          <ChevronIcon className={["h-3.5 w-3.5 text-white/80 transition-transform", dockHidden ? "rotate-180" : ""].join(" ")} />
        </button>
      </nav>
      )}

    </div>
  );
}
