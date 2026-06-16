import HeroSequence from "@/components/hero-sequence";
import Scrims from "@/components/scrims";
import Hud from "@/components/hud";
import ApartmentsOverlay from "@/components/apartments/apartments-overlay";
import SurroundingsOverlay from "@/components/surroundings/surroundings-overlay";
import AmenitiesOverlay from "@/components/amenities/amenities-overlay";
import PanelUrlSync from "@/components/panel-url-sync";
import ZytroWatermark from "@/components/zytro-watermark";

export default function Home() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#05101c]">
      <PanelUrlSync />
      <HeroSequence />
      <Scrims />
      <SurroundingsOverlay />
      <AmenitiesOverlay />
      <Hud />
      <ApartmentsOverlay />
      <ZytroWatermark />
    </main>
  );
}
