import SmoothScroll from "@/components/smooth-scroll";
import HeroSequence from "@/components/hero-sequence";
import Hud from "@/components/hud";
import ApartmentsOverlay from "@/components/apartments/apartments-overlay";
import GalleryOverlay from "@/components/gallery/gallery-overlay";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Hud />
      <ApartmentsOverlay />
      <GalleryOverlay />

      <main className="relative">
        <HeroSequence />

        {/* Closing beat after the pinned scrub — gives scroll a natural end. */}
        <section className="relative flex h-[100svh] flex-col items-center justify-center gap-4 bg-[#05101c] px-6 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-accent/80">
            Zytro
          </p>
          <h2 className="max-w-2xl text-balance text-3xl font-light leading-tight text-white sm:text-4xl">
            A living building, explored by scroll.
          </h2>
          <p className="max-w-md text-sm text-white/55">
            Mood control, 360° tour, and unit availability come next. This demo
            proves the cinematic scroll engine.
          </p>
        </section>
      </main>
    </>
  );
}
