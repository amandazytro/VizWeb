"use client";

import Image from "next/image";
import { useExperience } from "@/lib/store";
import { AMENITIES, type Amenity } from "@/lib/amenities";
import MarkerPill from "@/components/marker-pill";

function Marker({ amenity }: { amenity: Amenity }) {
  return (
    <div
      style={{ left: `${amenity.marker.x}%`, top: `${amenity.marker.y}%`, transform: "translate(-22px,-50%)" }}
      className="pointer-events-auto absolute"
    >
      <MarkerPill src={`/areas-comuns/icons/${amenity.icon}.svg`} label={amenity.name} />
    </div>
  );
}

export default function AmenitiesOverlay() {
  const open = useExperience((s) => s.panel) === "amenities";
  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
      {/* aerial render of the amenities */}
      <Image
        src="/areas-comuns/bg.webp"
        alt="Áreas comuns do empreendimento"
        fill
        priority
        sizes="100vw"
        className="zy-fadein object-cover"
      />

      {/* amenity markers */}
      {AMENITIES.map((a) => (
        <Marker key={a.key} amenity={a} />
      ))}
    </div>
  );
}
