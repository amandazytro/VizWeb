"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HERO, MOODS, frameUrl, posterUrl, type Mood } from "@/lib/frames";
import { useExperience } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Scroll distance the pinned hero occupies (× viewport height).
const SCRUB_VH = 4;

type MoodImages = Record<Mood, HTMLImageElement[]>;

export default function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<MoodImages>({ day: [], night: [] });
  const lastFrame = useRef(0);
  const moodRef = useRef(useExperience.getState().dayNight);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload both mood frame sets.
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    let loaded = 0;
    const total = HERO.count * MOODS.length;
    const store: MoodImages = { day: [], night: [] };

    for (const mood of MOODS) {
      for (let i = 1; i <= HERO.count; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(mood, i);
        img.onload = img.onerror = () => {
          if (cancelled) return;
          loaded++;
          setProgress(loaded / total);
          if (loaded === total) {
            imagesRef.current = store;
            setReady(true);
          }
        };
        store[mood][i - 1] = img;
      }
    }
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  // Composite the current frame: day base + night cross-faded by mood (0..1).
  const draw = (frame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dayImg = imagesRef.current.day[frame];
    const nightImg = imagesRef.current.night[frame];
    if (!dayImg) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const ir = dayImg.width / dayImg.height;
    const cr = cw / ch;
    let dw = cw;
    let dh = ch;
    if (cr > ir) dh = cw / ir;
    else dw = ch * ir;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;
    ctx.drawImage(dayImg, dx, dy, dw, dh);
    const mood = moodRef.current;
    if (nightImg && mood > 0.001) {
      ctx.globalAlpha = Math.min(mood, 1);
      ctx.drawImage(nightImg, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    }
    lastFrame.current = frame;
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    draw(lastFrame.current);
  };

  // Redraw in place whenever the mood (day/night) changes.
  useEffect(() => {
    const unsub = useExperience.subscribe((state) => {
      if (state.dayNight !== moodRef.current) {
        moodRef.current = state.dayNight;
        if (ready && !reduce) draw(lastFrame.current);
      }
    });
    return unsub;
  }, [ready, reduce]);

  useGSAP(
    () => {
      if (!ready || reduce) return;
      resize();
      draw(0);

      const state = { frame: 0 };
      const tween = gsap.to(state, {
        frame: HERO.count - 1,
        ease: "none",
        snap: { frame: 1 },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          pin: stickyRef.current,
          anticipatePin: 1,
        },
        onUpdate: () => draw(state.frame),
      });

      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [ready, reduce], scope: sectionRef }
  );

  if (reduce) {
    return (
      <section
        className="relative h-[100svh] w-full overflow-hidden"
        aria-label="Building hero"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl("day")}
          alt="Premium tower over the city skyline"
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
      aria-label="Building hero — scroll to explore"
    >
      <div
        ref={stickyRef}
        className="relative h-[100svh] w-full overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#05101c]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl("day")}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-accent transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="text-xs tracking-[0.3em] text-white/60">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
