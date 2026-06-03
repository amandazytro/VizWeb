"use client";

import { useExperience } from "@/lib/store";
import { AMENITIES, type Amenity } from "@/lib/amenities";

function Marker({ amenity }: { amenity: Amenity }) {
  return (
    <div
      style={{ left: `${amenity.marker.x}%`, top: `${amenity.marker.y}%`, transform: "translate(-22px,-50%)" }}
      className="pointer-events-auto absolute"
    >
      <span className="flex items-center gap-3 rounded-3xl border border-white/25 bg-white/15 py-1.5 pl-1.5 pr-5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition hover:bg-white/25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/areas-comuns/icons/${amenity.icon}.svg`} alt="" className="h-11 w-11" />
        <span className="whitespace-nowrap text-base font-medium text-white">{amenity.name}</span>
      </span>
    </div>
  );
}

export default function AmenitiesOverlay() {
  const open = useExperience((s) => s.panel) === "amenities";
  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
      {/* aerial render of the amenities */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/areas-comuns/bg.webp"
        alt="Áreas comuns do empreendimento"
        className="zy-fadein absolute inset-0 h-full w-full object-cover"
      />

      {/* amenity markers */}
      {AMENITIES.map((a) => (
        <Marker key={a.key} amenity={a} />
      ))}
    </div>
  );
}
