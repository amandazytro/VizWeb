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

type ExperienceState = {
  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
  heading: number; // compass heading in degrees (0 = N), driven by the orbit scrub
  setHeading: (v: number) => void;
  aptReady: boolean; // true once the hero has settled at frame 0 for Apartamentos
  setAptReady: (v: boolean) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  panel: "none",
  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: "none" }),
  heading: 0,
  setHeading: (v) => set({ heading: ((v % 360) + 360) % 360 }),
  aptReady: false,
  setAptReady: (v) => set({ aptReady: v }),
}));
