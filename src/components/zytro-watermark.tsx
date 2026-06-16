"use client";

import { useUiScale } from "@/lib/use-ui-scale";

// Subtle Zytro watermark, top-right on every screen → opens the site in a new tab.
// The source mark is dark (#141414); rendered white via filter so it reads as a
// faint watermark over any background.
export default function ZytroWatermark() {
  const uiScale = useUiScale();
  return (
    <a
      href="https://zytro.co.uk/en"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Zytro"
      title="Zytro"
      className="pointer-events-auto fixed right-9 top-8 z-[100] opacity-25 transition-opacity duration-300 hover:opacity-70"
      style={{ zoom: uiScale }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Zytro-logo-1.svg"
        alt="Zytro"
        className="h-9 w-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] [filter:brightness(0)_invert(1)]"
      />
    </a>
  );
}
