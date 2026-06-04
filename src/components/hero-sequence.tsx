"use client";

import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/lib/store";

// Explore frame sequence extracted from the client video (Refs/0001-1495.mp4),
// subsampled to webp. Scroll/drag scrubs forward and backward smoothly.
const COUNT = 299;
const PAD = 4;
const BASE = "/frames/explore";
// Default frame on load (~12s @ 13fps); user scrubs forward/back from here.
const START_FRAME = 156;
const url = (n: number) =>
  `${BASE}/${String(Math.min(Math.max(n, 1), COUNT)).padStart(PAD, "0")}.webp`;

// Gesture sensitivity: frames advanced per wheel/touch delta.
const WHEEL_SENS = 0.12;
const TOUCH_SENS = 0.25;
const DRAG_SENS = 0.18; // frames per pixel when click-dragging
const EASE = 0.18; // smoothing toward the scroll target

// Directional drag cursors (white arrow + black outline), hotspot centered.
const arrowCursor = (left: boolean) => {
  const flip = left ? "scale(-1,1) translate(-36,0)" : "";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'>` +
    `<g transform='${flip}' fill='none' stroke-linecap='round' stroke-linejoin='round'>` +
    `<path d='M7 18H29M21 10l8 8-8 8' stroke='black' stroke-width='7'/>` +
    `<path d='M7 18H29M21 10l8 8-8 8' stroke='white' stroke-width='3.5'/>` +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 18 18, auto`;
};
const CURSOR_RIGHT = arrowCursor(false);
const CURSOR_LEFT = arrowCursor(true);

export default function HeroSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const target = useRef(START_FRAME); // desired frame (float)
  const current = useRef(START_FRAME); // eased frame (float)
  const drawn = useRef(-1);
  const raf = useRef(0);
  const touchY = useRef<number | null>(null);
  const dragX = useRef<number | null>(null);
  const locked = useRef(false);

  const panel = useExperience((s) => s.panel);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (!ready || reduce) return;
    resize();
    draw(START_FRAME);

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

    // Click-drag: drag right → forward (like scrolling down), left → back.
    const onMouseDown = (e: MouseEvent) => {
      if (locked.current) return;
      dragX.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (dragX.current == null) return;
      const dx = e.clientX - dragX.current;
      const node = rootRef.current;
      if (node) node.style.cursor = dx > 0 ? CURSOR_RIGHT : dx < 0 ? CURSOR_LEFT : node.style.cursor;
      advance(dx * DRAG_SENS);
      dragX.current = e.clientX;
    };
    const onMouseUp = () => {
      dragX.current = null;
      if (rootRef.current) rootRef.current.style.cursor = "";
    };

    const el = rootRef.current ?? window;
    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    el.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    el.addEventListener("mousedown", onMouseDown as EventListener);
    window.addEventListener("mousemove", onMouseMove as EventListener);
    window.addEventListener("mouseup", onMouseUp as EventListener);
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
      el.removeEventListener("touchstart", onTouchStart as EventListener);
      el.removeEventListener("touchmove", onTouchMove as EventListener);
      el.removeEventListener("mousedown", onMouseDown as EventListener);
      window.removeEventListener("mousemove", onMouseMove as EventListener);
      window.removeEventListener("mouseup", onMouseUp as EventListener);
      window.removeEventListener("resize", resize);
      document.body.style.cursor = "";
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduce]);

  // Freeze the scrub whenever any panel/overlay is open — click-drag and
  // scroll only drive the hero on the Explorar screen (panel === "none").
  useEffect(() => {
    locked.current = panel !== "none";
    if (panel === "none" && rootRef.current) rootRef.current.style.cursor = "";
  }, [panel]);

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
      className={[
        "absolute inset-0 h-[100svh] w-full overflow-hidden bg-[#05101c]",
        panel === "none" ? "cursor-grab active:cursor-grabbing" : "",
      ].join(" ")}
      aria-label="Empreendimento — role ou arraste para percorrer o vídeo"
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
