"use client";

import { create } from "zustand";

/**
 * Shared experience state for the immersive single-viewport UI.
 * `panel` drives which overlay is open; `heading` is the compass heading
 * (0 = N) written by the hero orbit scrub; `aptReady` flips true once the
 * hero has settled at frame 0 so the Apartamentos UI can fade in.
 */
export type Panel =
  | "none"
  | "apartments"
  | "gallery"
  | "amenities"
  | "surroundings";

export type Lang = "pt" | "en";

// An image the user saved (room photo, amenity image, unit plan) — collected
// into the brochure's "Imagens selecionadas".
export type SavedImage = { id: string; src: string; label: string };

type ExperienceState = {
  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
  heading: number; // compass heading in degrees (0 = N), driven by the orbit scrub
  setHeading: (v: number) => void;
  aptReady: boolean; // true once the hero has settled at frame 0 for Apartamentos
  setAptReady: (v: boolean) => void;
  dockMinimized: boolean; // overlays can force the HUD dock into its minimized peek
  setDockMinimized: (v: boolean) => void;
  uiCollapsed: boolean; // user retracted the dock + all on-screen filters
  toggleUi: () => void;
  aptExpanded: boolean; // the apartamentos expanded floorplan view is open
  setAptExpanded: (v: boolean) => void;
  hudDockHidden: boolean; // fully hide the global dock (nav + retract tab), e.g. amenity detail
  setHudDockHidden: (v: boolean) => void;
  hudBrandHidden: boolean; // hide the "THE VERTICAL" brand (e.g. amenity gallery)
  setHudBrandHidden: (v: boolean) => void;
  navTick: number; // bumped on every dock navigation so overlays reset to their base view
  bumpNav: () => void;
  lang: Lang; // UI language (pt default, en toggle) — persisted to localStorage
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  saved: SavedImage[]; // images the user saved → brochure "Imagens selecionadas"
  toggleSaved: (item: SavedImage) => void;
  removeSaved: (id: string) => void;
  clearSaved: () => void;
  planFeatures: boolean[]; // which expanded-plan features are toggled on (→ brochure Opcionais)
  setPlanFeatures: (f: boolean[]) => void;
};

const LANG_KEY = "zy-lang";

export const useExperience = create<ExperienceState>((set) => ({
  panel: "none",
  openPanel: (p) => set({ panel: p, uiCollapsed: false }),
  closePanel: () => set({ panel: "none", uiCollapsed: false }),
  heading: 0,
  setHeading: (v) => set({ heading: ((v % 360) + 360) % 360 }),
  aptReady: false,
  setAptReady: (v) => set({ aptReady: v }),
  dockMinimized: false,
  setDockMinimized: (v) => set({ dockMinimized: v }),
  uiCollapsed: false,
  toggleUi: () => set((s) => ({ uiCollapsed: !s.uiCollapsed })),
  aptExpanded: false,
  setAptExpanded: (v) => set({ aptExpanded: v }),
  hudDockHidden: false,
  setHudDockHidden: (v) => set({ hudDockHidden: v }),
  hudBrandHidden: false,
  setHudBrandHidden: (v) => set({ hudBrandHidden: v }),
  navTick: 0,
  bumpNav: () => set((s) => ({ navTick: s.navTick + 1 })),
  // Default to "pt" on both server and client first render (avoids hydration
  // mismatch); the saved choice is rehydrated in an effect via setLang.
  lang: "pt",
  setLang: (l) => {
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l);
    set({ lang: l });
  },
  toggleLang: () =>
    set((s) => {
      const l: Lang = s.lang === "pt" ? "en" : "pt";
      if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l);
      return { lang: l };
    }),
  saved: [],
  toggleSaved: (item) =>
    set((s) => ({
      saved: s.saved.some((x) => x.id === item.id)
        ? s.saved.filter((x) => x.id !== item.id)
        : [...s.saved, item],
    })),
  removeSaved: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
  clearSaved: () => set({ saved: [] }),
  planFeatures: [true, false, false],
  setPlanFeatures: (f) => set({ planFeatures: f }),
}));
