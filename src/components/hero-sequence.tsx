"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useExperience } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Scroll distance the pinned hero occupies (× viewport height).
const SCRUB_VH = 4;

const DAY_SRC = "/hero/diurno.webp";
const NIGHT_SRC = "/hero/noturno.webp";

export default function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLImageElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [reduce, setReduce] = useState(false);

  const setDayNight = useExperience((s) => s.setDayNight);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload both stills before revealing.
  useEffect(() => {
    let done = 0;
    let cancelled = false;
    const onOne = () => {
      if (cancelled) return;
      done++;
      if (done >= 2) setLoaded(true);
    };
    for (const src of [DAY_SRC, NIGHT_SRC]) {
      const img = new Image();
      img.onload = img.onerror = onOne;
      img.src = src;
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Reflect the mood (slider OR scroll) onto the night layer's opacity.
  useEffect(() => {
    const apply = (v: number) => {
      if (nightRef.current) nightRef.current.style.opacity = String(v);
    };
    apply(useExperience.getState().dayNight);
    return useExperience.subscribe((s) => apply(s.dayNight));
  }, []);

  // Scroll drives day → night.
  useGSAP(
    () => {
      if (reduce) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        pin: stickyRef.current,
        anticipatePin: 1,
        onUpdate: (self) => setDayNight(self.progress),
      });
      return () => st.kill();
    },
    { dependencies: [reduce], scope: sectionRef }
  );

  // Reduced motion: static day still, normal scroll.
  if (reduce) {
    return (
      <section
        className="relative h-[100svh] w-full overflow-hidden"
        aria-label="Building hero"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DAY_SRC}
          alt="Premium tower over the Rio de Janeiro skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: `${SCRUB_VH * 100}svh` }}
      className="relative w-full"
      aria-label="Building hero — scroll from day to night"
    >
      <div
        ref={stickyRef}
        className="relative h-[100svh] w-full overflow-hidden bg-[#05101c]"
      >
        {/* day base (LCP) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DAY_SRC}
          alt="Premium tower over the Rio de Janeiro skyline by day"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* night layer, cross-faded by mood/scroll */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={nightRef}
          src={NIGHT_SRC}
          alt=""
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#05101c]">
            <span className="text-xs tracking-[0.3em] text-white/50">
              LOADING…
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
