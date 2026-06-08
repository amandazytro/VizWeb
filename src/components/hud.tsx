"use client";

import { useExperience } from "@/lib/store";
import Dock from "@/components/dock";

/* — orientation compass (replaces the time/mood bar) — */
const CARD: Record<number, string> = {
  0: "N",
  45: "NE",
  90: "L",
  135: "SE",
  180: "S",
  225: "SO",
  270: "O",
  315: "NO",
};

function Compass({ heading }: { heading: number }) {
  const W = 520; // ribbon width (px)
  const SPAN = 90; // degrees visible across the ribbon
  const pxPerDeg = W / SPAN;
  const startDeg = Math.ceil((heading - SPAN / 2) / 15) * 15;
  const marks: { deg: number; x: number; label: string | null; center: boolean }[] = [];
  for (let d = startDeg; d <= heading + SPAN / 2 + 0.001; d += 15) {
    const x = W / 2 + (d - heading) * pxPerDeg;
    const norm = ((d % 360) + 360) % 360;
    const label = norm % 45 === 0 ? CARD[norm] : null;
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

export default function Hud() {
  const heading = useExperience((s) => s.heading);
  const panel = useExperience((s) => s.panel);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* ── Brand ── */}
      <div className="absolute left-6 top-5">
        <span
          style={{ fontFamily: "var(--font-recia), Georgia, serif", fontSize: "17px" }}
          className="font-semibold tracking-[0.18em] text-white drop-shadow"
        >
          THE VERTICAL
        </span>
      </div>

      {/* ── Top-center: orientation compass (Explorar only) ── */}
      {panel === "none" && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2">
          <Compass heading={heading} />
        </div>
      )}

      {/* ── Bottom-center: primary nav ── */}
      <Dock />
    </div>
  );
}
