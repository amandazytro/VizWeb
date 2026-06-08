"use client";

import { useEffect, useRef } from "react";

// Mouse glyph; `leftActive` shades the left button.
function MouseGlyph({ leftActive = false, className = "" }: { leftActive?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 26 38" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      {leftActive && (
        <path d="M13 3 H9 Q4 3 4 9 V13 H13 Z" fill="currentColor" fillOpacity="0.9" stroke="none" />
      )}
      <rect x="4" y="3" width="18" height="32" rx="9" />
      <line x1="13" y1="3" x2="13" y2="13" />
      <line x1="4" y1="13" x2="22" y2="13" />
    </svg>
  );
}

/**
 * Pan & scan video: the clip is rendered larger than the viewport, gently
 * auto-pans (Ken-Burns), and the user can drag to look around (springs back to
 * centre on release). Bottom controls: scrub timeline, auto-pan speed, zoom.
 * Click pauses, double-click resumes.
 */
export default function PanScanVideo({ src, onClose }: { src: string; onClose?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const speedRef = useRef(9);
  const zoomRef = useRef(114);
  const clickTimer = useRef<number | null>(null);

  const st = useRef({
    currentX: 0,
    currentY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    autoX: 0,
    autoY: 0,
    dragging: false,
    seeking: false,
    lastX: 0,
    lastY: 0,
    dirX: 1,
    dirY: 0.35,
  });

  useEffect(() => {
    const DRAG_LIMIT_X = 80;
    const DRAG_LIMIT_Y = 40;
    const s = st.current;

    const getPoint = (e: MouseEvent | TouchEvent) =>
      "touches" in e ? e.touches[0] : (e as MouseEvent);

    const startDrag = (e: MouseEvent | TouchEvent) => {
      const p = getPoint(e);
      if (!p) return;
      s.dragging = true;
      s.lastX = p.clientX;
      s.lastY = p.clientY;
    };
    const moveDrag = (e: MouseEvent | TouchEvent) => {
      if (!s.dragging) return;
      const p = getPoint(e);
      if (!p) return;
      const dx = p.clientX - s.lastX;
      const dy = p.clientY - s.lastY;
      s.dragOffsetX = Math.max(-DRAG_LIMIT_X, Math.min(DRAG_LIMIT_X, s.dragOffsetX + dx * 0.15));
      s.dragOffsetY = Math.max(-DRAG_LIMIT_Y, Math.min(DRAG_LIMIT_Y, s.dragOffsetY + dy * 0.15));
      s.lastX = p.clientX;
      s.lastY = p.clientY;
    };
    const stopDrag = () => {
      s.dragging = false;
    };

    window.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchstart", startDrag, { passive: true });
    window.addEventListener("touchmove", moveDrag, { passive: true });
    window.addEventListener("touchend", stopDrag);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const video = videoRef.current;
      if (!video) return;

      const speed = Math.max(0, Math.min(100, speedRef.current || 0));
      const zoom = Math.max(100, Math.min(200, zoomRef.current || 110));
      const moveSpeed = speed * 0.005;

      s.autoX += s.dirX * moveSpeed;
      s.autoY += s.dirY * moveSpeed;
      if (s.autoX > 15 || s.autoX < -15) s.dirX *= -1;
      if (s.autoY > 4 || s.autoY < -4) s.dirY *= -1;

      if (!s.dragging) {
        s.dragOffsetX *= 0.97;
        s.dragOffsetY *= 0.97;
      }

      const targetX = s.autoX + s.dragOffsetX;
      const targetY = s.autoY + s.dragOffsetY;
      s.currentX += (targetX - s.currentX) * 0.03;
      s.currentY += (targetY - s.currentY) * 0.03;

      video.style.transform = `translate(${s.currentX}px,${s.currentY}px) scale(${zoom / 100})`;
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousedown", startDrag);
      window.removeEventListener("mousemove", moveDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchstart", startDrag);
      window.removeEventListener("touchmove", moveDrag);
      window.removeEventListener("touchend", stopDrag);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, []);

  const onViewportClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => videoRef.current?.pause(), 250);
  };
  const onViewportDblClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    videoRef.current?.play();
  };

  return (
    <div className="fixed inset-0 z-[70] touch-none overflow-hidden bg-black">
      <div
        onClick={onViewportClick}
        onDoubleClick={onViewportDblClick}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          playsInline
          loop
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar"
          className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* usage hint */}
      <div className="pointer-events-none absolute bottom-6 right-6 z-10 flex flex-col gap-3.5 rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-white/85 backdrop-blur-md [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
        {/* 1 click = pause */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs">Pausar o vídeo</span>
          <div className="relative">
            <MouseGlyph leftActive className="h-9 w-6 text-white" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">1</span>
          </div>
        </div>
        {/* 2 clicks = play */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs">Continuar o vídeo</span>
          <div className="relative">
            <MouseGlyph leftActive className="h-9 w-6 text-white" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">2</span>
          </div>
        </div>
        {/* click + drag = move */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs">Clicar e arrastar move</span>
          <div className="relative flex items-center gap-1">
            <MouseGlyph leftActive className="h-9 w-6 text-white" />
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M5 12l3-3M5 12l3 3M19 12l-3-3M19 12l-3 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
