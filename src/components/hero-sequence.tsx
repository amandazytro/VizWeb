"use client";

import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/lib/store";

// Explore frame sequence extracted from the client video (Refs/0001-1495.mp4),
// subsampled to webp. Scroll/drag scrubs forward and backward smoothly.
const COUNT = 299;
const PAD = 4;
const BASE = "/frames/explore";
const url = (n: number) =>
  `${BASE}/${String(Math.min(Math.max(n, 1), COUNT)).padStart(PAD, "0")}.webp`;

// Gesture sensitivity: frames advanced per wheel/touch delta.
const WHEEL_SENS = 0.12;
const TOUCH_SENS = 0.25;
const EASE = 0.18; // smoothing toward the scroll target

export default function HeroSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const target = useRef(0); // desired frame (float)
  const current = useRef(0); // eased frame (float)
  const drawn = useRef(-1);
  const raf = useRef(0);
  const touchY = useRef<number | null>(null);
  const locked = useRef(false);

  const panel = useExperience((s) => s.panel);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload the frame sequence.
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    let loaded = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = url(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        loaded++;
        setProgress(loaded / COUNT);
        if (loaded === COUNT) {
          imagesRef.current = imgs;
          setReady(true);
        }
      };
      imgs[i - 1] = img;
    }
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      if (locked.current) useExperience.getState().setAptReady(true);
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

  useEffect(() => {
    if (!ready || reduce) return;
    resize();
    draw(0);

    const advance = (d: number) => {
      if (locked.current) return; // frozen while Apartamentos is open
      target.current = Math.min(COUNT - 1, Math.max(0, target.current + d));
      kick();
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
      advance((touchY.current - y) * TOUCH_SENS);
      touchY.current = y;
    };

    const el = rootRef.current ?? window;
    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    el.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
      el.removeEventListener("touchstart", onTouchStart as EventListener);
      el.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduce]);

  // Apartamentos: animate the hero back to frame 0, then unlock the UI.
  useEffect(() => {
    locked.current = panel === "apartments";
    if (panel !== "apartments") return;
    if (!ready || reduce) {
      target.current = 0;
      current.current = 0;
      useExperience.getState().setAptReady(true);
      return;
    }
    if (current.current <= 0.5) {
      // already at frame 0 — show the UI immediately
      current.current = 0;
      target.current = 0;
      drawn.current = -1;
      draw(0);
      useExperience.getState().setHeading(0);
      useExperience.getState().setAptReady(true);
    } else {
      // ease to frame 0; tick() flags aptReady when it settles
      target.current = 0;
      kick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, ready, reduce]);

  if (reduce) {
    return (
      <section
        className="absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]"
        aria-label="Empreendimento"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url(1)}
          alt="Torre do empreendimento"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      className="absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]"
      aria-label="Empreendimento — role para percorrer o vídeo"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

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
