import HeroSequence from "@/components/hero-sequence";
import Hud from "@/components/hud";
import ApartmentsOverlay from "@/components/apartments/apartments-overlay";
import SurroundingsOverlay from "@/components/surroundings/surroundings-overlay";
import AmenitiesOverlay from "@/components/amenities/amenities-overlay";
import PanelUrlSync from "@/components/panel-url-sync";

export default function Home() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden">
      <PanelUrlSync />
      <HeroSequence />
      <SurroundingsOverlay />
      <AmenitiesOverlay />
      <Hud />
      <ApartmentsOverlay />
    </main>
  );
}
