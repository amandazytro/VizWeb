"use client";

import { useExperience } from "@/lib/store";

/**
 * Cinematic top/bottom darkening for compass + dock + filter legibility.
 * Lives on its own low layer (z-20) — above the hero, below every overlay and
 * the HUD — so it never darkens the glass UI that sits on top of it.
 */
export default function Scrims() {
  const panel = useExperience((s) => s.panel);
  if (panel !== "none" && panel !== "apartments") return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/65 to-transparent" />
    </div>
  );
}
