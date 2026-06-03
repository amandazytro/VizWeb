import HeroSequence from "@/components/hero-sequence";
import Hud from "@/components/hud";
import ApartmentsOverlay from "@/components/apartments/apartments-overlay";
import GalleryOverlay from "@/components/gallery/gallery-overlay";
import SurroundingsOverlay from "@/components/surroundings/surroundings-overlay";
import AmenitiesOverlay from "@/components/amenities/amenities-overlay";

export default function Home() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden">
      <HeroSequence />
      <SurroundingsOverlay />
      <AmenitiesOverlay />
      <Hud />
      <ApartmentsOverlay />
      <GalleryOverlay />
    </main>
  );
}
