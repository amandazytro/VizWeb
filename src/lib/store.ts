"use client";

import { create } from "zustand";

/**
 * Shared experience state. `dayNight` is a 0..1 mood value:
 * 0 = full day, 1 = full night. The HUD time-of-day slider writes it;
 * the hero canvas reads it to cross-fade the day/night frame sets in place.
 */
export type Panel = "none" | "apartments";

type ExperienceState = {
  dayNight: number;
  setDayNight: (v: number) => void;
  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  dayNight: 0.12, // open bright (early day)
  setDayNight: (v) => set({ dayNight: Math.min(1, Math.max(0, v)) }),
  panel: "none",
  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: "none" }),
}));

/** Map a 0..1 mood value to a clock label (05:00 .. 21:00). */
export function moodToTime(v: number): string {
  const mins = Math.round((5 + v * 16) * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
