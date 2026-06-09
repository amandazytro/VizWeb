"use client";

import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/lib/store";
import { useT } from "@/lib/i18n";

// Explore frame sequence (hero1.mp4 360 orbit → frames, native 1080p).
// Click-and-hold to orbit the building forward/back smoothly.
const COUNT = 193;
const PAD = 4;
const BASE = "/frames/explore";
// Default frame on load — second 2 of the clip (24fps → frame 48).
const START_FRAME = 48;
const url = (n: number) =>
  `${BASE}/${String(Math.min(Math.max(n, 1), COUNT)).padStart(PAD, "0")}.webp`;

const EASE = 0.18; // smoothing toward the orbit target

// Mouse-driven 360° orbit: cursor offset from center → rotation speed/direction.
const ORBIT_DEADZONE = 0.12; // central fraction of the width where the orbit rests
const ORBIT_MAX_SPEED = 1.3; // frames advanced per animation frame at full deflection
const ORBIT_WHEEL_STEP = 3.5; // frames advanced per wheel notch (scroll up = forward)

export default function HeroSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const target = useRef(START_FRAME); // desired frame (float)
  const current = useRef(START_FRAME); // eased frame (float)
  const drawn = useRef(-1);
  const raf = useRef(0);
  const driveRaf = useRef(0);
  const offsetRef = useRef(0); // cursor X offset from center, -1..1
  const arrowRef = useRef(0); // last-applied arrow dir (avoids redundant renders)
  const locked = useRef(false);
  const pressed = useRef(false); // pointer held down → orbit runs (click-and-hold)

  const panel = useExperience((s) => s.panel);
  const navTick = useExperience((s) => s.navTick);
  const t = useT();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [arrow, setArrow] = useState(0); // -1 left hint, 0 none, +1 right hint
  const [fcal, setFcal] = useState(false); // facade calibration → show the building unzoomed

  useEffect(() => {
    setFcal(new URLSearchParams(window.location.search).get("fcal") === "1");
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload the frame sequence with bounded concurrency, and let the
  // experience start once a leading chunk is in — the rest streams in behind
  // the scrub instead of blocking first paint on all COUNT frames.
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    let loaded = 0;
    const CONCURRENCY = 8;
    const START_AT = Math.min(24, COUNT); // enough leading frames to begin scrubbing
    const imgs: HTMLImageElement[] = new Array(COUNT);
    imagesRef.current = imgs; // expose immediately so draw() can use loaded frames

    // Load starting at the default frame (then wrap) so the first paint isn't blank.
    const order: number[] = [];
    for (let i = 0; i < COUNT; i++) order.push((START_FRAME + i) % COUNT);
    let oi = 0;

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          if (!cancelled) {
            loaded++;
            setProgress(loaded / COUNT);
            if (loaded >= START_AT) setReady(true);
            // draw the default frame as soon as it lands
            if (i === Math.round(current.current) && drawn.current !== i) draw(i);
          }
          resolve();
        };
        img.src = url(i + 1);
        imgs[i] = img;
      });

    const worker = async () => {
      while (!cancelled && oi < order.length) {
        await loadOne(order[oi++]);
      }
    };
    for (let w = 0; w < CONCURRENCY; w++) void worker();

    return () => {
      cancelled = true;
    };
  }, [reduce]);

  const draw = (frame: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[frame];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const ir = img.width / img.height;
    const cr = cw / ch;
    // cover: fill the screen (no letterbox bars on the sides); crops the overflow
    // (a little top/bottom) when the window isn't exactly 16:9.
    let dw = cw;
    let dh = ch;
    if (cr > ir) dh = cw / ir;
    else dw = ch * ir;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    drawn.current = frame;
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Apartamentos CSS-zooms the canvas 1.4×; render at a higher pixel density
    // there so the scale-up stays crisp on high-DPI screens (source caps at 1600px).
    const apt = useExperience.getState().panel === "apartments";
    const dpr = apt
      ? Math.min((window.devicePixelRatio || 1) * 1.6, 3)
      : Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    drawn.current = -1;
    draw(Math.round(current.current));
  };

  // Eased scrub loop — runs only while catching up to the target.
  const tick = () => {
    const diff = target.current - current.current;
    if (Math.abs(diff) < 0.05) {
      current.current = target.current;
      raf.current = 0;
      // Only the Apartamentos flow waits on the hero settling at frame 0.
      if (useExperience.getState().panel === "apartments") {
        useExperience.getState().setAptReady(true);
      }
    } else {
      current.current += diff * EASE;
      raf.current = requestAnimationFrame(tick);
    }
    const f = Math.round(current.current);
    if (f !== drawn.current) {
      draw(f);
      // map frame → orbit heading (full clip ≈ 360°)
      useExperience.getState().setHeading((f / (COUNT - 1)) * 360);
    }
  };
  const kick = () => {
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };

  // Advance the orbit by `delta` frames, CLAMPED to the clip ends (no wrap): the
  // first frame (second 0) and last frame (second 8) are hard stops. Scrolling
  // past 0 stays at 0; past the end stays at the end.
  const advanceOrbit = (delta: number) => {
    if (locked.current) return; // frozen while a panel/overlay is open
    const next = Math.max(0, Math.min(COUNT - 1, target.current + delta));
    target.current = next;
    kick();
  };

  useEffect(() => {
    if (!ready || reduce) return;
    resize();
    draw(START_FRAME);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduce]);

  // Freeze the orbit whenever any panel/overlay is open — the mouse only drives
  // the hero on the Explorar screen (panel === "none").
  useEffect(() => {
    locked.current = panel !== "none";
  }, [panel]);

  // Re-allocate the canvas at the right pixel density when entering/leaving
  // Apartamentos (it CSS-zooms 1.4×, so it needs more backing pixels there).
  useEffect(() => {
    if (ready && !reduce) resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // Click-and-hold 360° orbit (Explorar only): the building orbits ONLY while
  // the pointer is held down. Cursor X relative to center sets direction + speed
  // (right = backward, left = forward); a directional arrow hint fades in on the
  // active side. Release to stop.
  useEffect(() => {
    if (!ready || reduce || panel !== "none") return;
    const setOffsetFromX = (clientX: number) => {
      const half = window.innerWidth / 2;
      offsetRef.current = Math.max(-1, Math.min(1, (clientX - half) / half));
    };
    const onDown = (e: MouseEvent) => {
      pressed.current = true;
      setOffsetFromX(e.clientX);
    };
    const onMove = (e: MouseEvent) => setOffsetFromX(e.clientX);
    const onUp = () => {
      pressed.current = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        pressed.current = true;
        setOffsetFromX(e.touches[0].clientX);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) setOffsetFromX(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      pressed.current = false;
    };
    // Wheel orbit: scroll up (deltaY<0) = forward (like the left button), scroll
    // down = backward (like the right button). No hold required.
    const onWheel = (e: WheelEvent) => {
      if (locked.current) return;
      e.preventDefault();
      advanceOrbit(-(e.deltaY / 100) * ORBIT_WHEEL_STEP);
    };
    const loop = () => {
      const off = offsetRef.current;
      let dir = 0;
      if (!locked.current && pressed.current && Math.abs(off) > ORBIT_DEADZONE) {
        const mag = (Math.abs(off) - ORBIT_DEADZONE) / (1 - ORBIT_DEADZONE);
        advanceOrbit(-Math.sign(off) * mag * ORBIT_MAX_SPEED);
        dir = off > 0 ? 1 : -1;
      }
      if (dir !== arrowRef.current) {
        arrowRef.current = dir;
        setArrow(dir);
      }
      driveRaf.current = requestAnimationFrame(loop);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("wheel", onWheel, { passive: false });
    driveRaf.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      if (driveRaf.current) cancelAnimationFrame(driveRaf.current);
      offsetRef.current = 0;
      pressed.current = false;
      arrowRef.current = 0;
      setArrow(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduce, panel]);

  // Apartamentos: animate the hero to the default frame, then unlock the UI.
  useEffect(() => {
    if (panel !== "apartments") return;
    if (!ready || reduce) {
      target.current = START_FRAME;
      current.current = START_FRAME;
      useExperience.getState().setAptReady(true);
      return;
    }
    if (Math.abs(current.current - START_FRAME) <= 0.5) {
      // already at the default frame — show the UI immediately
      current.current = START_FRAME;
      target.current = START_FRAME;
      drawn.current = -1;
      draw(START_FRAME);
      useExperience.getState().setHeading((START_FRAME / (COUNT - 1)) * 360);
      useExperience.getState().setAptReady(true);
    } else {
      // ease to the default frame; tick() flags aptReady when it settles
      target.current = START_FRAME;
      kick();
    }
    // navTick: re-tapping the Apartamentos dock re-runs this so aptReady is
    // re-asserted even when the panel value didn't change (self-heal).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, ready, reduce, navTick]);

  if (reduce) {
    return (
      <section
        className="absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]"
        aria-label={t("hero.devAlt")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url(1)}
          alt={t("hero.towerAlt")}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </section>
    );
  }

  return (
    <section
      className="absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]"
      aria-label={t("hero.label360")}
      style={{
        transform: panel === "apartments" && !fcal ? "scale(1.4)" : "none",
        transformOrigin: "50% 40%",
        transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <canvas
        ref={canvasRef}
        className={[
          "absolute inset-0 h-full w-full",
          panel === "none" ? "cursor-grab active:cursor-grabbing" : "",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* 360° orbit hints — move the cursor left/right and the building orbits
          automatically; the arrow on that side fades in. */}
      {ready && panel === "none" && (
        <>
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute left-[20%] top-1/2 z-10 -translate-y-1/2 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] transition-opacity duration-300",
              arrow === -1 ? "opacity-90" : "opacity-0",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </div>
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute right-[20%] top-1/2 z-10 -translate-y-1/2 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] transition-opacity duration-300",
              arrow === 1 ? "opacity-90" : "opacity-0",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05101c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url(1)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
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
    </section>
  );
}
