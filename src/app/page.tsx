import HeroSequence from "@/components/hero-sequence";
import Hud from "@/components/hud";
import ApartmentsOverlay from "@/components/apartments/apartments-overlay";
import GalleryOverlay from "@/components/gallery/gallery-overlay";

export default function Home() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden">
      <HeroSequence />
      <Hud />
      <ApartmentsOverlay />
      <GalleryOverlay />
    </main>
  );
}
