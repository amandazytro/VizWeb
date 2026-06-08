"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useExperience } from "@/lib/store";
import { useLang, useT, pick } from "@/lib/i18n";
import { AMENITIES, type Amenity } from "@/lib/amenities";
import MarkerPill from "@/components/marker-pill";
import Panorama360 from "@/components/Panorama360";
import PanScanVideo from "@/components/pan-scan-video";

// Detail-view dock button — glass squircle + Plus Jakarta label, purple on hover
// or while toggled active. Same language as the apartamentos expanded dock.
function AmenityDockBtn({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="group relative flex flex-col items-center">
      <span
        className={[
          "flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/10 transition",
          active
            ? "bg-accent text-white shadow-[0_0_12px_3px_rgba(134,103,234,0.45)]"
            : "bg-white/10 text-white/85 shadow-[0_0_10px_2px_rgba(0,0,0,0.25)] group-hover:bg-accent group-hover:text-white",
        ].join(" ")}
      >
        {children}
      </span>
      <span
        style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
        className={[
          "absolute top-[calc(100%+6px)] whitespace-nowrap text-[9px] font-semibold leading-none text-[#dcd9d9] transition",
          active ? "opacity-90" : "opacity-50 group-hover:opacity-80",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
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

function Marker({ amenity, name, onSelect }: { amenity: Amenity; name: string; onSelect: (a: Amenity) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(amenity)}
      style={{ left: `${amenity.marker.x}%`, top: `${amenity.marker.y}%`, transform: "translate(-18px,-50%)" }}
      className="pointer-events-auto absolute"
    >
      <MarkerPill src={`/areas-comuns/icons/${amenity.icon}.svg`} label={name} />
    </button>
  );
}

export default function AmenitiesOverlay() {
  const lang = useLang();
  const t = useT();
  const open = useExperience((s) => s.panel) === "amenities";
  const savedList = useExperience((s) => s.saved);
  const toggleSaved = useExperience((s) => s.toggleSaved);
  const setDockMinimized = useExperience((s) => s.setDockMinimized);
  const setHudDockHidden = useExperience((s) => s.setHudDockHidden);
  const setHudBrandHidden = useExperience((s) => s.setHudBrandHidden);
  const [sel, setSel] = useState<Amenity | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [pano360, setPano360] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null); // pan & scan video
  const [intro, setIntro] = useState<string | null>(null); // transition video playing
  const [detailDockHidden, setDetailDockHidden] = useState(false); // detail dock retracted
  const [scrollHint, setScrollHint] = useState(false); // "scroll to explore" hint on gallery open
  const trackRef = useRef<HTMLDivElement>(null);

  const closeDetail = useCallback(() => {
    setSel(null);
    setGalleryOpen(false);
    setPano360(null);
    setVideo(null);
    setIntro(null);
    setDetailDockHidden(false);
    setDockMinimized(false);
    setHudDockHidden(false);
    setHudBrandHidden(false);
  }, [setDockMinimized, setHudDockHidden, setHudBrandHidden]);

  const select = useCallback(
    (a: Amenity) => {
      if (a.video) {
        setVideo(a.video);
        setDockMinimized(true);
        return;
      }
      if (a.pano360) {
        // 360 amenities open the panorama viewer directly
        setPano360(a.pano360);
        setDockMinimized(true);
        setHudDockHidden(true);
        return;
      }
      if (!a.detail) return; // only amenities with a full-screen render open
      setSel(a);
      setGalleryOpen(false);
      setIntro(a.intro ?? null); // play transition first, if any
      setDockMinimized(true);
      setHudDockHidden(true);
    },
    [setDockMinimized, setHudDockHidden]
  );

  // The "THE VERTICAL" brand stays visible when the gallery opens and only fades
  // once the strip is scrolled (handled by the track's onScroll, below).
  useEffect(() => {
    setHudBrandHidden(false);
  }, [galleryOpen, sel, setHudBrandHidden]);

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

  // Wheel → horizontal scroll. Native + non-passive so we preventDefault the
  // browser's own vertical-wheel→horizontal fallback (which otherwise stacks
  // with our manual scroll and makes the strip jitter). First scroll dismisses
  // the hint.
  useEffect(() => {
    if (!galleryOpen) return;
    const el = trackRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
      setScrollHint(false);
      setHudBrandHidden(el.scrollLeft > 20);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [galleryOpen, sel, setHudBrandHidden]);

  // Show the "scroll to explore" hint when the gallery opens; auto-dismiss after
  // a few seconds (it also dismisses on the first scroll, above).
  useEffect(() => {
    if (!galleryOpen) {
      setScrollHint(false);
      return;
    }
    setScrollHint(true);
    const id = setTimeout(() => setScrollHint(false), 5000);
    return () => clearTimeout(id);
  }, [galleryOpen, sel]);

  if (!open) return null;

  const amenitySaved = sel ? savedList.some((x) => x.id === `amenity-${sel.key}`) : false;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
      {/* aerial render of the amenities (looping video) */}
      <video
        src="/areas-comuns/bg2.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="zy-fadein absolute inset-0 h-full w-full object-cover"
      />

      {/* amenity markers (hidden while a detail is open) */}
      {!sel && !pano360 && !video && AMENITIES.map((a) => <Marker key={a.key} amenity={a} name={pick(lang, a.name)} onSelect={select} />)}

      {/* 360 viewer (opened directly from a marker) */}
      {pano360 && (
        <div className="pointer-events-auto absolute inset-0 z-20">
          <Panorama360 src={pano360} onClose={closeDetail} />
        </div>
      )}

      {/* pan & scan video (opened directly from a marker) */}
      {video && (
        <div className="pointer-events-auto absolute inset-0 z-20">
          <PanScanVideo src={video} onClose={closeDetail} />
        </div>
      )}

      {/* transition video — plays once, then reveals the detail */}
      {intro && (
        <video
          src={intro}
          autoPlay
          muted
          playsInline
          onEnded={() => setIntro(null)}
          className="pointer-events-auto absolute inset-0 z-30 h-full w-full bg-black object-cover"
        />
      )}

      {/* full-screen detail render */}
      {sel?.detail && (
        <div key={sel.key} className="amenity-zoom absolute inset-0 z-10">
          {/* detail media — only when NOT in the gallery (the gallery has its own
              backdrop inside the scroll content) */}
          {!galleryOpen &&
            (/\.(mp4|webm)$/i.test(sel.detail) ? (
              <video
                src={sel.detail}
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  e.currentTarget.playbackRate = sel.detailRate ?? 1;
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image src={sel.detail} alt={pick(lang, sel.name)} fill priority sizes="100vw" className="object-cover" />
            ))}

          {/* ── DETAIL state ── */}
          {!galleryOpen && (
            <>
              {/* detail dock — glass squircles + retract tab (buttons not wired yet) */}
              <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
                <div
                  className={[
                    "absolute bottom-8 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out",
                    detailDockHidden ? "translate-y-[120px]" : "",
                  ].join(" ")}
                >
                  <ul className="inline-flex items-center gap-8 rounded-[26px] border border-white/10 bg-[rgba(166,166,166,0.20)] px-8 pt-4 pb-6 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
                    <AmenityDockBtn label={t("apt.back")} onClick={closeDetail}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-4" /></svg>
                    </AmenityDockBtn>
                    <AmenityDockBtn label={t("am.space")} active>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" /></svg>
                    </AmenityDockBtn>
                    <AmenityDockBtn label={t("am.panorama")}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></svg>
                    </AmenityDockBtn>
                    {sel.gallery && (
                      <AmenityDockBtn label={t("am.gallery")} onClick={() => setGalleryOpen(true)}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="M21 15l-5-5-7 7" /></svg>
                      </AmenityDockBtn>
                    )}
                  </ul>
                </div>
                {/* retract tab — stays put so it can un-retract */}
                <button
                  type="button"
                  onClick={() => setDetailDockHidden((v) => !v)}
                  aria-label={detailDockHidden ? t("hud.showMenu") : t("hud.hideMenu")}
                  className="absolute bottom-2 left-1/2 z-10 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-[6px] border border-white/10 bg-[rgba(166,166,166,0.28)] text-white/75 backdrop-blur-md"
                >
                  <svg viewBox="0 0 24 24" className={["h-3.5 w-3.5 transition-transform", detailDockHidden ? "" : "rotate-180"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
                </button>
              </div>
            </>
          )}

          {/* ── GALLERY state (blurred backdrop + horizontal strip) ── */}
          {sel.gallery && galleryOpen && (
            <>
              {/* horizontal scroll — a fixed-ratio canvas (Figma frame 1090px tall →
                  100vh) reproduced 1:1; every element sits at its exact Figma
                  coordinate converted to vh (1px = 100/1090 vh). */}
              <div
                ref={trackRef}
                onScroll={(e) => setHudBrandHidden(e.currentTarget.scrollLeft > 20)}
                className="pointer-events-auto absolute inset-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="relative h-full" style={{ width: "324vh" }}>
                  {/* blurred backdrop — exactly canvas-sized (scrolls 1:1, never extends
                      the scroll past the content); overflow-hidden + a slight scale push
                      the blur fringe off the edges so it covers the whole canvas */}
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <Image src="/areas-comuns/bg-gallery.webp" alt="" fill sizes="330vw" className="scale-110 object-cover blur-[35px]" />
                  </div>

                  {/* back button (top-left) */}
                  <button type="button" onClick={() => setGalleryOpen(false)} aria-label={t("am.backToImage")} className="absolute transition duration-200 hover:scale-110 hover:brightness-110" style={{ left: "16.6vh", top: "16.7vh", width: "5.75vh", height: "5.75vh" }}>
                    <VoltarIcon className="h-full w-full" />
                  </button>

                  {/* vertical title */}
                  <span style={{ fontFamily: "var(--font-canela-condensed), Georgia, serif", writingMode: "vertical-rl", transform: "rotate(180deg)", left: "14.6vh", bottom: "130px", fontSize: "7.5vh" }} className="pointer-events-none absolute whitespace-nowrap font-normal leading-none text-white">
                    {pick(lang, sel.name)}
                  </span>

                  {/* decorative pill */}
                  <div className="absolute rounded-full bg-white/25" style={{ left: "9.5vh", top: "89.5vh", width: "6.3vh", height: "1.3vh" }} />

                  {/* image 1 — big */}
                  <div className="absolute overflow-hidden rounded-[18px] border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]" style={{ left: "25.87vh", top: "16.24vh", width: "127.89vh", height: "67.71vh" }}>
                    <Image src={sel.gallery.images[0]} alt={`${pick(lang, sel.name)} 1`} fill priority sizes="120vw" className="object-cover" />
                  </div>

                  {/* image 2 — cluster top */}
                  <div className="absolute overflow-hidden rounded-[18px] border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]" style={{ left: "158.99vh", top: "16.51vh", width: "79.45vh", height: "39.27vh" }}>
                    <Image src={sel.gallery.images[1]} alt={`${pick(lang, sel.name)} 2`} fill sizes="80vw" className="object-cover" />
                  </div>

                  {/* image 3 — cluster small */}
                  <div className="absolute overflow-hidden rounded-[18px] border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]" style={{ left: "182.48vh", top: "60vh", width: "55.23vh", height: "23.49vh" }}>
                    <Image src={sel.gallery.images[2]} alt={`${pick(lang, sel.name)} 3`} fill sizes="55vw" className="object-cover" />
                  </div>

                  {/* bubble + text 1 (below image 2) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/areas-comuns/icons/galeria-bubble.svg" alt="" aria-hidden="true" className="absolute" style={{ left: "158.53vh", top: "61.47vh", width: "2.9vh", height: "2.9vh" }} />
                  <div className="absolute" style={{ left: "158.99vh", top: "66.15vh", width: "18.5vh" }}>
                    <h3 style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif", fontSize: "2vh" }} className="font-bold leading-tight text-[#A386FF]">{pick(lang, sel.gallery.heading)}</h3>
                    <p style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif", fontSize: "1.05vh" }} className="mt-[0.6vh] text-justify font-medium leading-snug text-white/85">{pick(lang, sel.gallery.description)}</p>
                  </div>

                  {/* image 4 — tall */}
                  <div className="absolute overflow-hidden rounded-[18px] border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]" style={{ left: "242.66vh", top: "16.51vh", width: "53.94vh", height: "67.43vh" }}>
                    <Image src={sel.gallery.images[3]} alt={`${pick(lang, sel.name)} 4`} fill sizes="54vw" className="object-cover" />
                  </div>

                  {/* bubble + text 2 (closing) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/areas-comuns/icons/galeria-bubble.svg" alt="" aria-hidden="true" className="absolute" style={{ left: "302.02vh", top: "19.63vh", width: "2.9vh", height: "2.9vh" }} />
                  <div className="absolute" style={{ left: "302.48vh", top: "24.31vh", width: "18.5vh" }}>
                    <h3 style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif", fontSize: "2vh" }} className="font-bold leading-tight text-[#A386FF]">{pick(lang, sel.gallery.heading)}</h3>
                    <p style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif", fontSize: "1.05vh" }} className="mt-[0.6vh] text-justify font-medium leading-snug text-white/85">{pick(lang, sel.gallery.description)}</p>
                  </div>

                  {/* save + back buttons (right) */}
                  <button
                    type="button"
                    onClick={() => sel.gallery && toggleSaved({ id: `amenity-${sel.key}`, src: sel.gallery.images[0], label: pick(lang, sel.name) })}
                    aria-label={t("apt.save")}
                    aria-pressed={amenitySaved}
                    className="absolute transition duration-200 hover:scale-110 hover:brightness-110"
                    style={{ left: "301.74vh", top: "67.61vh", width: "5.75vh", height: "5.75vh" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/areas-comuns/icons/salvar.svg" alt={t("apt.save")} className="h-full w-full" />
                    {amenitySaved && (
                      <span className="absolute -right-[0.4vh] -top-[0.4vh] flex h-[2.2vh] w-[2.2vh] items-center justify-center rounded-full bg-accent text-white shadow">
                        <svg viewBox="0 0 24 24" className="h-[1.3vh] w-[1.3vh]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>
                      </span>
                    )}
                  </button>
                  <button type="button" onClick={() => setGalleryOpen(false)} aria-label={t("apt.back")} className="absolute transition duration-200 hover:scale-110 hover:brightness-110" style={{ left: "301.74vh", top: "76.06vh", width: "5.75vh", height: "5.75vh" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/areas-comuns/icons/voltar.svg" alt={t("apt.back")} className="h-full w-full" />
                  </button>
                </div>
              </div>

              {/* top + bottom gradient scrims (fixed over the strip, for legibility) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[18%] bg-gradient-to-b from-black/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[22%] bg-gradient-to-t from-black/65 to-transparent" />

              {/* scroll hint — animated mouse icon; rises & fades on first scroll
                  (or after a few seconds). No blur veil. */}
              <div
                className={[
                  "pointer-events-none absolute bottom-[9vh] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5 transition-all duration-700 ease-out",
                  scrollHint ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0",
                ].join(" ")}
              >
                <svg viewBox="0 0 24 40" className="h-10 w-6 text-white/85" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="1" y="1" width="22" height="38" rx="11" />
                  <line className="zy-mouse-dot" x1="12" y1="8" x2="12" y2="13.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                <span
                  style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
                  className="text-[11px] font-medium tracking-wide text-white/80"
                >
                  {t("am.scrollToExplore")}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
