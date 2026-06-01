"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Single-RAF-loop integration of Lenis + GSAP (per CLAUDE.md / STACK.md):
 * Lenis runs with autoRaf:false and is driven from gsap.ticker, so there is
 * exactly one rAF loop. ScrollTrigger.update() runs on every Lenis scroll.
 * Disabled entirely for prefers-reduced-motion (native scroll).
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // gsap.ticker time is seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return null;
}
