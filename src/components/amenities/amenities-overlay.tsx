"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useExperience } from "@/lib/store";
import { AMENITIES, type Amenity } from "@/lib/amenities";
import MarkerPill from "@/components/marker-pill";

function GalleryIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M21 15l-5-5-7 7" />
    </svg>
  );
}

// voltar.svg inlined (white rounded square + purple arrow) — reliable in JSX,
// unlike the raw file via <img> (its foreignObject/blend layers can drop out).
function VoltarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 59 59" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="58.5809" height="58.9663" rx="20.3477" fill="white" />
      <rect x="0.440574" y="0.440574" width="57.6997" height="58.0851" rx="19.9072" stroke="white" strokeOpacity="0.1" strokeWidth="0.881149" />
      <path d="M14.6895 23.3041C14.8393 22.8572 15.0011 22.6897 15.3577 22.4074C17.9422 20.3577 21.0976 18.6666 23.7399 16.6525C24.3744 16.1812 25.4082 16.4509 25.7094 17.1868C25.9184 17.6974 25.83 17.9012 25.6667 18.3895C25.403 19.1787 24.9535 19.9524 24.7085 20.7549L37.3916 20.7527C40.9455 20.9461 43.6949 23.5575 44.0013 27.0722C43.8432 30.2602 44.2148 33.6504 44.0013 36.8147C43.7503 40.5369 40.7545 42.9719 37.1062 43.1342C32.4914 43.3395 27.7621 43.0335 23.1488 43.0609C22.3188 42.8815 21.5509 42.1383 21.4512 41.2846C21.2347 39.4298 21.7801 38.0959 23.8186 37.9744L37.447 37.9773C38.3085 37.8432 38.785 37.1978 38.8517 36.3648C39.0786 33.5074 38.6779 30.358 38.8487 27.4694C38.8352 26.6884 38.08 25.854 37.2755 25.854H24.9378L26.1431 28.4283C26.5185 29.6147 25.3378 30.5996 24.2328 30.0356L15.0543 24.4742L14.6902 23.7576V23.3041H14.6895Z" fill="#8667EA" />
    </svg>
  );
}

function Marker({ amenity, onSelect }: { amenity: Amenity; onSelect: (a: Amenity) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(amenity)}
      style={{ left: `${amenity.marker.x}%`, top: `${amenity.marker.y}%`, transform: "translate(-22px,-50%)" }}
      className="pointer-events-auto absolute"
    >
      <MarkerPill src={`/areas-comuns/icons/${amenity.icon}.svg`} label={amenity.name} />
    </button>
  );
}

export default function AmenitiesOverlay() {
  const open = useExperience((s) => s.panel) === "amenities";
  const setDockMinimized = useExperience((s) => s.setDockMinimized);
  const [sel, setSel] = useState<Amenity | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const closeDetail = useCallback(() => {
    setSel(null);
    setGalleryOpen(false);
    setDockMinimized(false);
  }, [setDockMinimized]);

  const select = useCallback(
    (a: Amenity) => {
      if (!a.detail) return; // only amenities with a full-screen render open
      setSel(a);
      setGalleryOpen(false);
      setDockMinimized(true);
    },
    [setDockMinimized]
  );

  // Reset selection + restore dock whenever the panel closes.
  useEffect(() => {
    if (!open) closeDetail();
  }, [open, closeDetail]);

  // Any dock navigation (even re-clicking Áreas comuns) returns to the base map.
  const navTick = useExperience((s) => s.navTick);
  useEffect(() => {
    closeDetail();
  }, [navTick, closeDetail]);

  // Esc: from the gallery back to the render; from the render back to the map.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (galleryOpen) setGalleryOpen(false);
      else closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, galleryOpen, closeDetail]);

  // Custom scrollbar state (thumb position + visible ratio).
  const railRef = useRef<HTMLDivElement>(null);
  const dragBar = useRef(false);
  const [bar, setBar] = useState({ ratio: 0, vis: 0.3 });

  const syncBar = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setBar({
      ratio: max > 0 ? el.scrollLeft / max : 0,
      vis: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
    });
  }, []);

  // Wheel → horizontal scroll. Native + non-passive so we preventDefault the
  // browser's own vertical-wheel→horizontal fallback (which otherwise stacks
  // with our manual scroll and makes the strip jitter).
  useEffect(() => {
    if (!galleryOpen) return;
    const el = trackRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
      syncBar();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [galleryOpen, sel, syncBar]);

  // Drag the scrollbar (hold + drag) to move the strip, same as the wheel.
  const barFromX = (clientX: number) => {
    const rail = railRef.current;
    const el = trackRef.current;
    if (!rail || !el) return;
    const r = rail.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
    syncBar();
  };
  const onBarDown = (e: React.PointerEvent) => {
    dragBar.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    barFromX(e.clientX);
  };
  const onBarMove = (e: React.PointerEvent) => {
    if (dragBar.current) barFromX(e.clientX);
  };
  const onBarUp = (e: React.PointerEvent) => {
    dragBar.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Recompute thumb size once the gallery (and its images) lay out.
  useEffect(() => {
    if (!galleryOpen) return;
    const id = requestAnimationFrame(syncBar);
    return () => cancelAnimationFrame(id);
  }, [galleryOpen, sel, syncBar]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
      {/* aerial render of the amenities */}
      <Image
        src="/areas-comuns/bg.webp"
        alt="Áreas comuns do empreendimento"
        fill
        priority
        sizes="100vw"
        className="zy-fadein object-cover"
      />

      {/* amenity markers (hidden while a detail is open) */}
      {!sel && AMENITIES.map((a) => <Marker key={a.key} amenity={a} onSelect={select} />)}

      {/* full-screen detail render */}
      {sel?.detail && (
        <div key={sel.key} className="amenity-zoom absolute inset-0 z-10">
          <Image
            src={sel.detail}
            alt={sel.name}
            fill
            priority
            sizes="100vw"
            className={[
              "object-cover transition duration-500",
              galleryOpen ? "scale-110 blur-2xl" : "",
            ].join(" ")}
          />

          {/* ── DETAIL state ── */}
          {!galleryOpen && (
            <>
              <span className="pointer-events-none absolute bottom-10 left-10 text-3xl font-semibold text-white">
                {sel.name}
              </span>
              {sel.gallery && (
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="pointer-events-auto absolute bottom-8 right-8 flex flex-col items-center gap-1 text-white/85 transition hover:text-white"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                    <GalleryIcon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] tracking-[0.18em]">Galeria</span>
                </button>
              )}
            </>
          )}

          {/* ── GALLERY state (blurred backdrop + horizontal strip) ── */}
          {sel.gallery && galleryOpen && (
            <>
              <div className="absolute inset-0 bg-black/40" />

              {/* scrollable strip — images + text + icons all move together */}
              <div
                ref={trackRef}
                onScroll={syncBar}
                className="pointer-events-auto absolute inset-0 flex items-start gap-10 overflow-x-auto overflow-y-hidden pt-[10vh] pl-[6vw] pr-[10vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* left column — back button + vertical title */}
                <div className="relative h-[117vh] w-[92px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(false)}
                    aria-label="Voltar à imagem"
                    className="pointer-events-auto absolute left-25 top-0 transition hover:brightness-110"
                  >
                    <VoltarIcon className="h-11 w-11" />
                  </button>
                  <span
                    style={{ fontFamily: "var(--font-recia), Georgia, serif", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    className="pointer-events-none absolute left-25 top-128 -translate-y-1/2 text-5xl font-semibold tracking-wide text-white"
                  >
                    {sel.name}
                  </span>
                </div>

                {/* 1 */}
                <div className="relative ml-15 h-[72vh] aspect-[1920/1078] shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                  <Image src={sel.gallery.images[0]} alt={`${sel.name} 1`} fill priority sizes="55vw" className="object-cover" />
                </div>

                {/* 2 (top) + text below, 3 beside */}
                <div className="flex shrink-0 items-start gap-8">
                  <div className="relative h-[72vh] shrink-0">
                    <div className="relative h-[40vh] aspect-[866/428] overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                      <Image src={sel.gallery.images[1]} alt={`${sel.name} 2`} fill sizes="40vw" className="object-cover" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-[300px] max-w-[50vw]">
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: "#FF7A1A", boxShadow: "0 8px 24px -6px rgba(255,122,26,0.7)" }}
                        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </span>
                      <h3 className="text-3xl font-semibold leading-tight text-[#FF7A1A]">{sel.gallery.heading}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/75">{sel.gallery.description}</p>
                    </div>
                  </div>
                  <div className="relative -ml-[25vw] mt-[53vh] h-[20vh] aspect-[602/256] shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                    <Image src={sel.gallery.images[2]} alt={`${sel.name} 3`} fill sizes="40vw" className="object-cover" />
                  </div>
                </div>

                {/* 4 (vertical) */}
                <div className="relative h-[72vh] aspect-[588/735] shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                  <Image src={sel.gallery.images[3]} alt={`${sel.name} 4`} fill sizes="40vw" style={{ transform: "scale(1.1)" }} className="object-cover" />
                </div>

                {/* save + back icons */}
                <div
                  style={{ height: "72vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.75rem", marginLeft: "-0.5rem", flexShrink: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/areas-comuns/icons/salvar.svg" alt="Salvar" className="h-11 w-11" />
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(false)}
                    aria-label="Voltar"
                    className="transition hover:brightness-110"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/areas-comuns/icons/voltar.svg" alt="Voltar" className="h-11 w-11" />
                  </button>
                </div>

                {/* end text (X-aligned with the icons) */}
                <div style={{ marginLeft: "-84px" }} className="flex h-[30vh] w-[300px] shrink-0 flex-col justify-center gap-5">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: "#FF7A1A", boxShadow: "0 8px 24px -6px rgba(255,122,26,0.7)" }}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </span>
                  <h3 className="text-2xl font-semibold leading-tight text-[#FF7A1A]">{sel.gallery.heading}</h3>
                  <p className="text-sm leading-relaxed text-white/75">{sel.gallery.description}</p>
                </div>
              </div>

              {/* drag scrollbar (fixed, below the first image) */}
              <div
                ref={railRef}
                onPointerDown={onBarDown}
                onPointerMove={onBarMove}
                onPointerUp={onBarUp}
                className="pointer-events-auto absolute bottom-[15vh] left-[16vw] z-10 h-1 w-[170px] cursor-pointer rounded-full bg-white/15"
              >
                <div
                  className="absolute top-0 h-full rounded-full bg-white/50"
                  style={{
                    width: `${Math.max(bar.vis * 100, 14)}%`,
                    left: `${bar.ratio * (100 - Math.max(bar.vis * 100, 14))}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
