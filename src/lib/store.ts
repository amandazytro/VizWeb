"use client";

import { create } from "zustand";

/**
 * Shared experience state. `dayNight` is a 0..1 mood value:
 * 0 = full day, 1 = full night. The HUD time-of-day slider writes it;
 * the hero canvas reads it to cross-fade the day/night frame sets in place.
 */
export type Panel =
  | "none"
  | "apartments"
  | "gallery"
  | "amenities"
  | "surroundings";

type ExperienceState = {
  dayNight: number;
  setDayNight: (v: number) => void;
  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
  uiHidden: boolean;
  setUiHidden: (v: boolean) => void;
  heading: number; // compass heading in degrees (0 = N), driven by the orbit scrub
  setHeading: (v: number) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  dayNight: 0, // open in full day; scroll drives it toward night
  setDayNight: (v) => set({ dayNight: Math.min(1, Math.max(0, v)) }),
  panel: "none",
  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: "none" }),
  uiHidden: false,
  setUiHidden: (v) => set({ uiHidden: v }),
  heading: 0,
  setHeading: (v) => set({ heading: ((v % 360) + 360) % 360 }),
}));

/** Map a 0..1 mood value to a clock label (05:00 .. 21:00). */
export function moodToTime(v: number): string {
  const mins = Math.round((5 + v * 16) * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
