"use client";

import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/lib/store";

const DAY_SRC = "/hero/diurno.webp";
const NIGHT_SRC = "/hero/noturno.webp";

// Gesture sensitivity: wheel delta → mood. ~10 notches spans full day→night.
const WHEEL_SENS = 1 / 1200;
const TOUCH_SENS = 1 / 600;

export default function HeroSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const nightRef = useRef<HTMLImageElement>(null);
  const progress = useRef(0); // 0 = day, 1 = night
  const touchY = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [reduce, setReduce] = useState(false);

  const setDayNight = useExperience((s) => s.setDayNight);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload both stills.
  useEffect(() => {
    let done = 0;
    let cancelled = false;
    const onOne = () => {
      if (cancelled) return;
      if (++done >= 2) setLoaded(true);
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

  // Reflect mood onto the night layer; keep gesture progress in sync with slider.
  useEffect(() => {
    const apply = (v: number) => {
      progress.current = v;
      if (nightRef.current) nightRef.current.style.opacity = String(v);
    };
    apply(useExperience.getState().dayNight);
    return useExperience.subscribe((s) => apply(s.dayNight));
  }, []);

  // Wheel + touch drive day → night without any page scroll.
  useEffect(() => {
    if (reduce) return;
    const advance = (delta: number) => {
      const next = Math.min(1, Math.max(0, progress.current + delta));
      if (next !== progress.current) setDayNight(next);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      advance(e.deltaY * WHEEL_SENS);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY.current == null) return;
      const y = e.touches[0]?.clientY ?? touchY.current;
      const dy = touchY.current - y; // swipe up → toward night
      touchY.current = y;
      advance(dy * TOUCH_SENS);
    };
    const el = rootRef.current ?? window;
    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    el.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
      el.removeEventListener("touchstart", onTouchStart as EventListener);
      el.removeEventListener("touchmove", onTouchMove as EventListener);
    };
  }, [reduce, setDayNight]);

  return (
    <section
      ref={rootRef}
      className="absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]"
      aria-label="Building hero — scroll or drag from day to night"
    >
      {/* day base (LCP) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DAY_SRC}
        alt="Premium tower over the Rio de Janeiro skyline by day"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* night layer, cross-faded by mood/gesture */}
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
          <span className="text-xs tracking-[0.3em] text-white/50">LOADING…</span>
        </div>
      )}
    </section>
  );
}
