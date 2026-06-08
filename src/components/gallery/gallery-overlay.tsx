"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useExperience } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, SHOTS, type Category } from "@/lib/gallery";

type Tab = "Todas" | Category;
const TABS: Tab[] = ["Todas", ...CATEGORIES];

export default function GalleryOverlay() {
  const t = useT();
  const panel = useExperience((s) => s.panel);
  const closePanel = useExperience((s) => s.closePanel);
  const open = panel === "gallery";

  const [tab, setTab] = useState<Tab>("Todas");
  const [index, setIndex] = useState<number | null>(null); // lightbox index
  const [zoom, setZoom] = useState(false);

  const shots = useMemo(
    () => (tab === "Todas" ? SHOTS : SHOTS.filter((s) => s.category === tab)),
    [tab]
  );

  const close = useCallback(() => {
    setIndex(null);
    setZoom(false);
  }, []);
  const open_ = (i: number) => {
    setIndex(i);
    setZoom(false);
  };
  const step = useCallback(
    (d: number) => {
      setZoom(false);
      setIndex((i) => (i == null ? i : (i + d + shots.length) % shots.length));
    },
    [shots.length]
  );

  // Reset when closing the panel; clamp lightbox when switching tabs.
  useEffect(() => {
    if (!open) {
      setTab("Todas");
      close();
    }
  }, [open, close]);
  useEffect(() => {
    close();
  }, [tab, close]);

  // Keyboard: lightbox arrows/zoom/esc, else esc closes panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (index != null) {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === " " || e.key === "z") {
          e.preventDefault();
          setZoom((z) => !z);
        }
      } else if (e.key === "Escape") {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, step, close, closePanel]);

  if (!open) return null;

  const current = index != null ? shots[index] : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#040b15]/96">
      {/* header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm tracking-[0.3em] text-white/90">{t("gal.title")}</h2>
          <span className="text-xs text-white/45">{shots.length} {t("gal.images")}</span>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label={t("gal.closeGallery")}
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
        >
          {t("gal.close")} ✕
        </button>
      </header>

      {/* category tabs */}
      <nav className="flex flex-wrap gap-2 px-6 pb-4">
        {TABS.map((tab_) => (
          <button
            key={tab_}
            type="button"
            onClick={() => setTab(tab_)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs transition",
              tab === tab_
                ? "border-transparent bg-accent text-white"
                : "border-white/15 bg-white/5 text-white/70 hover:text-white",
            ].join(" ")}
          >
            {tab_ === "Todas" ? t("gal.all") : tab_}
          </button>
        ))}
      </nav>

      {/* grid */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => open_(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10"
            >
              <Image
                src={s.src}
                alt={s.title}
                fill
                loading="lazy"
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-left text-[11px] text-white/85 opacity-0 transition group-hover:opacity-100">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/92"
          onClick={close}
        >
          <div className="flex items-center justify-between px-6 py-4 text-white/80">
            <span className="text-xs tracking-widest">
              {current.title} · {index! + 1}/{shots.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label={t("gal.closeImage")}
              className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
            >
              {t("gal.close")} ✕
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
            {/* prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label={t("gal.prev")}
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
            >
              ‹
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.title}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => !z);
              }}
              className={[
                "max-h-full max-w-full select-none rounded-lg object-contain transition-transform duration-300",
                zoom ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in",
              ].join(" ")}
            />

            {/* next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label={t("gal.next")}
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
            >
              ›
            </button>
          </div>

          <p className="py-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/35">
            {t("gal.hintPre")} {zoom ? t("gal.zoomOut") : t("gal.zoomIn")} {t("gal.hintPost")}
          </p>
        </div>
      )}
    </div>
  );
}
