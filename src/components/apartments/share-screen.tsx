"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useExperience } from "@/lib/store";
import { useLang, useT, pick, type TKey } from "@/lib/i18n";
import { STATUS_META, formatBRL, type Unit } from "@/lib/apartments";
import { plantaWideFor } from "@/lib/plantas";
import { DEFAULT_BROCHURE, mergeBrochure, type BrochureConfig } from "@/lib/brochure-config";

const serif = { fontFamily: "var(--font-canela), Georgia, serif" } as const;
const poppins = { fontFamily: "var(--font-poppins), system-ui, sans-serif" } as const;
const jakarta = { fontFamily: "var(--font-jakarta), system-ui, sans-serif" } as const;

// The brochure is laid out on a FIXED 1920×1080 canvas (the 3 columns never
// reflow). Only the canvas is scaled to fit the viewport, so the margin around
// it (the "entorno") adapts — the columns themselves stay static on every screen.
const DESIGN_W = 1920;
const DESIGN_H = 1080;

// Mosaic spans for the saved-images grid (2 cols, auto-rows 1fr, dense flow):
// big landscape → tall → 2 squares → wide. object-cover crops each into shape.
const MOSAIC_SPAN = ["col-span-2 row-span-2", "row-span-2", "", "", "col-span-2"];

const FEATURE_KEYS: TKey[] = ["feat.insulation.title", "feat.glazing.title", "feat.climate.title"];

function Spec({ label, value, size }: { label: string; value: string; size: number }) {
  return (
    <div className="text-left">
      <p style={{ ...poppins, fontSize: size }} className="font-normal text-white">{label}</p>
      <p style={{ ...poppins, fontSize: size }} className="font-normal text-white">{value}</p>
    </div>
  );
}

function SavedThumb({ item, onRemove, removeLabel, className = "" }: { item: { id: string; src: string; label: string }; onRemove: (id: string) => void; removeLabel: string; className?: string }) {
  return (
    <div className={`relative min-h-0 overflow-hidden rounded-[14px] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.label} className="absolute inset-0 h-full w-full object-cover" />
      <button type="button" onClick={() => onRemove(item.id)} aria-label={removeLabel} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-red-500/85">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
      </button>
    </div>
  );
}

// One labelled slider+number row in the ?bcal=1 editor.
function Knob({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-[10px] text-white/80">
      <span className="w-[88px] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 accent-[#8667ea]" />
      <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-12 rounded bg-black/50 px-1 py-0.5 text-right text-[10px] text-white outline-none" />
    </label>
  );
}

export default function ShareScreen({ unit, onClose, onShared }: { unit: Unit; onClose: () => void; onShared: () => void }) {
  const lang = useLang();
  const t = useT();
  const saved = useExperience((s) => s.saved);
  const removeSaved = useExperience((s) => s.removeSaved);
  const planFeatures = useExperience((s) => s.planFeatures);
  const [dockHidden, setDockHidden] = useState(false);

  // Editable layout (?bcal=1) — loaded from /api/brochure-config, saved back there.
  const [cfg, setCfg] = useState<BrochureConfig>(DEFAULT_BROCHURE);
  const [bcal, setBcal] = useState(false);
  const [cfgSaved, setCfgSaved] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; px: number; py: number; ox: number; oy: number } | null>(null);
  const panelDrag = useRef<{ dx: number; dy: number } | null>(null);
  const history = useRef<BrochureConfig[]>([]);

  // Scale the fixed 1920×1080 canvas to fit the viewport (contain → never cut).
  const [vp, setVp] = useState({ w: DESIGN_W, h: DESIGN_H });
  useEffect(() => {
    const onR = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const scale = Math.min(vp.w / DESIGN_W, vp.h / DESIGN_H);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    if (typeof window !== "undefined") setBcal(new URLSearchParams(window.location.search).get("bcal") === "1");
    fetch("/api/brochure-config").then((r) => r.json()).then((d) => setCfg(mergeBrochure(d))).catch(() => {});
  }, []);

  const pushHistory = (snapshot: BrochureConfig) => {
    history.current.push(snapshot);
    if (history.current.length > 200) history.current.shift();
  };
  const set = <K extends keyof BrochureConfig>(k: K, v: BrochureConfig[K]) => {
    pushHistory(cfg);
    setCfg((c) => ({ ...c, [k]: v }));
    setCfgSaved(false);
  };
  const setCol = (i: number, v: number) => {
    pushHistory(cfg);
    setCfg((c) => ({ ...c, cols: c.cols.map((x, j) => (j === i ? v : x)) as [number, number, number] }));
    setCfgSaved(false);
  };
  const saveCfg = async () => {
    try {
      await fetch("/api/brochure-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      setCfgSaved(true);
    } catch {
      /* ignore */
    }
  };

  // Free per-element drag + editor-panel drag, active only in ?bcal=1.
  useEffect(() => {
    if (!bcal) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d) {
        const x = Math.round(d.ox + (e.clientX - d.px) / scaleRef.current);
        const y = Math.round(d.oy + (e.clientY - d.py) / scaleRef.current);
        setCfg((c) => ({ ...c, pos: { ...c.pos, [d.id]: { x, y } } }));
        setCfgSaved(false);
      }
      const p = panelDrag.current;
      if (p) setPanelPos({ x: Math.max(0, e.clientX - p.dx), y: Math.max(0, e.clientY - p.dy) });
    };
    const up = () => {
      dragRef.current = null;
      panelDrag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [bcal]);

  // Ctrl/Cmd+Z — undo the last layout change.
  useEffect(() => {
    if (!bcal) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const prev = history.current.pop();
        if (prev) {
          setCfg(prev);
          setCfgSaved(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bcal]);

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    if (!bcal) return;
    e.preventDefault();
    e.stopPropagation(); // innermost element wins; parents don't also drag
    pushHistory(cfg);
    const p = cfg.pos[id] ?? { x: 0, y: 0 };
    dragRef.current = { id, px: e.clientX, py: e.clientY, ox: p.x, oy: p.y };
  };
  const posStyle = (id: string): React.CSSProperties => {
    const p = cfg.pos[id];
    return p && (p.x || p.y) ? { transform: `translate(${p.x}px, ${p.y}px)` } : {};
  };
  // Spreadable drag props for any element (drag handler in edit mode).
  const dh = (id: string) => (bcal ? { onPointerDown: startDrag(id) } : {});
  const ring = bcal ? " cursor-move rounded-[6px] outline-dashed outline-1 outline-accent/50" : "";

  // Light backdrop-blur — the page bg is already blurred, so a heavy backdrop-filter
  // here (×4 cards, inside `zoom`) just janks the whole screen. Slightly higher fill
  // opacity keeps the glass look cheaply.
  const card = "rounded-[14px] border border-white/10 bg-[rgba(166,166,166,0.30)] backdrop-blur-sm";

  return (
    <div className="pointer-events-auto fixed inset-0 z-[70] overflow-hidden text-white">
      <Image src="/frames/explore/0156.webp" alt="" fill priority sizes="100vw" className="scale-105 object-cover blur-md" />
      <div className="absolute inset-0 bg-[#0a121c]/35" />

      {/* fixed-size brochure canvas — columns stay static; only the surrounding
          margin adapts, by scaling the whole canvas to fit the viewport. */}
      <div className="absolute inset-0 flex items-center justify-center">
      {/* `zoom` (not transform: scale) → re-rasterises at the scaled size so it
          stays crisp on big screens, keeps proportions + line breaks, and doesn't
          break the cards' backdrop-blur the way a transformed ancestor does. */}
      <div style={{ width: DESIGN_W, height: DESIGN_H, zoom: scale }} className="relative shrink-0">
      <div
        className="absolute inset-0 grid items-stretch"
        style={{ gridTemplateColumns: `${cfg.cols[0]}fr ${cfg.cols[1]}fr ${cfg.cols[2]}fr`, columnGap: cfg.gap, padding: `${cfg.padTop}px ${cfg.padX}px ${cfg.padBottom}px` }}
      >
        {/* LEFT — Overview + Opcionais */}
        <div className="flex flex-col gap-5">
          {/* Overview */}
          <div {...dh("overview")} style={posStyle("overview")} className={`${card} relative flex h-[53%] gap-5 p-6${ring}`}>
            <div {...dh("ov.img")} style={{ width: `${cfg.ovImg}%`, ...posStyle("ov.img") }} className={`relative shrink-0 overflow-hidden rounded-[14px]${ring}`}>
              <Image src="/frames/explore/0156.webp" alt={t("share.tower")} fill sizes="20vw" style={{ transform: `rotate(${cfg.ovImgRot}deg)` }} className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col">
              <h3 {...dh("ov.title")} style={{ ...serif, fontSize: cfg.ovTitle, ...posStyle("ov.title") }} className={`font-bold leading-none opacity-95${ring}`}>Overview</h3>
              <div {...dh("ov.specs")} style={posStyle("ov.specs")} className={ring}>
                <p style={{ ...poppins, fontSize: cfg.ovText }} className="mb-2.5 mt-1 text-left font-normal text-white">{t("share.apartment")} {unit.label}</p>
                <div className="flex flex-col gap-1.5">
                  <Spec label={t("share.privateArea")} value={`${unit.area} m²`} size={cfg.ovText} />
                  <Spec label={t("share.status")} value={pick(lang, STATUS_META[unit.status].label)} size={cfg.ovText} />
                  <Spec label={t("share.price")} value={formatBRL(unit.price)} size={cfg.ovText} />
                  <Spec label={t("share.layout")} value={`${unit.suites} ${t("share.suites")}`} size={cfg.ovText} />
                </div>
              </div>
            </div>
          </div>

          {/* Opcionais (no overflow clip so the pills can sit on/outside the border) */}
          <div {...dh("opcionais")} style={posStyle("opcionais")} className={`${card} relative flex-1 p-6${ring}`}>
            <div className="absolute inset-x-4 bottom-10 top-4 flex items-center gap-3">
              <h3 {...dh("op.title")} style={{ ...poppins, fontSize: cfg.opTitle, ...posStyle("op.title") }} className={`w-[32%] shrink-0 text-center font-normal leading-tight text-white${ring}`}>{t("share.options")}</h3>
              <div {...dh("op.plan")} style={posStyle("op.plan")} className={`relative h-full flex-1 overflow-hidden rounded-[14px]${ring}`}>
                <Image src={plantaWideFor(unit.bedrooms)} alt={t("apt.planAlt")} fill sizes="34vw" style={{ transform: `rotate(${cfg.opPlanRot}deg) scale(${cfg.opPlanScale / 100})` }} className="object-contain" />
              </div>
            </div>
            <div {...dh("op.pills")} style={posStyle("op.pills")} className={`absolute inset-x-6 bottom-5 z-10 flex items-stretch gap-2${ring}`}>
              {FEATURE_KEYS.map((k, i) => (
                <span key={k} style={{ ...jakarta, fontSize: cfg.opPill }} className={["flex flex-1 items-center justify-center rounded-full px-3 py-2 text-center font-medium leading-tight", planFeatures[i] ? "bg-accent text-white" : "bg-[#8a8893] text-white"].join(" ")}>{t(k)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE — selected images */}
        <div {...dh("imagens")} style={posStyle("imagens")} className={`${card} relative flex flex-col gap-3 overflow-hidden p-6${ring}`}>
          <h3 {...dh("img.title")} style={{ ...serif, fontSize: cfg.imgTitle, ...posStyle("img.title") }} className={`whitespace-pre-line font-bold leading-[1.05] opacity-95${ring}`}>{t("share.selectedImages")}</h3>
          <div {...dh("img.body")} style={posStyle("img.body")} className={`flex min-h-0 flex-1 flex-col gap-3${ring}`}>
            {saved.length === 0 ? (
              <div style={poppins} className="flex min-h-0 flex-1 items-center justify-center rounded-[14px] border border-dashed border-white/15 p-6 text-center text-xs text-white/45">{t("share.noSaved")}</div>
            ) : (
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3" style={{ gridAutoRows: "1fr", gridAutoFlow: "dense" }}>
                {saved.slice(0, 5).map((it, i) => (
                  <SavedThumb key={it.id} item={it} onRemove={removeSaved} removeLabel={t("share.removeImage")} className={MOSAIC_SPAN[i] ?? ""} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — QR + price + share + download */}
        <div {...dh("qr")} style={posStyle("qr")} className={`${card} relative flex flex-col p-6${ring}`}>
          <div {...dh("qr.head")} style={posStyle("qr.head")} className={`flex gap-8${ring}`}>
            <div className="flex shrink-0 flex-col" style={{ width: cfg.qrSize + 20 }}>
              <div className="flex w-full justify-center bg-white p-2.5">
                <QRCodeSVG value={`https://thevertical.app/unidade/${unit.label}`} size={cfg.qrSize} level="M" />
              </div>
              <span style={poppins} className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] border border-white/45 px-3 py-1.5 text-[14px] tracking-widest text-white">
                AB47XQ
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
              </span>
            </div>
            <div className="flex-1">
              <p style={{ ...poppins, fontSize: cfg.qrTitle }} className="font-bold leading-snug">{t("share.accessDetails")}</p>
              <p style={poppins} className="mt-2 text-[14px] leading-snug text-white">{t("share.scanQr")}</p>
            </div>
          </div>

          <div {...dh("qr.price")} style={posStyle("qr.price")} className={`mt-16 pt-2${ring}`}>
            <p style={{ fontFamily: "var(--font-recia), Georgia, serif", fontSize: cfg.price }} className="font-bold leading-none tracking-wide">{formatBRL(unit.price)}</p>
            <p style={poppins} className="mt-1 text-xs text-white">{unit.area} m²</p>
          </div>

          <div {...dh("qr.share")} style={posStyle("qr.share")} className={`mb-6 mt-10 pt-2${ring}`}>
            <p style={poppins} className="text-[15px] font-bold">{t("apt.share")}</p>
            <div className="mt-3 flex gap-3">
              {[
                { label: "Google", icon: <span className="text-sm font-bold">G</span> },
                { label: "WhatsApp", icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z" /></svg> },
                { label: "Email", icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg> },
                { label: t("share.more"), icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> },
              ].map((s) => (
                <button key={s.label} type="button" aria-label={s.label} onClick={onShared} className="flex aspect-square flex-1 items-center justify-center rounded-full border border-white/70 bg-transparent text-white transition hover:border-accent hover:bg-accent hover:text-white">
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button {...dh("qr.save")} type="button" onClick={onShared} style={{ ...poppins, ...posStyle("qr.save") }} className={`w-full rounded-[14px] border border-white/70 bg-transparent py-3.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent${ring}`}>
              {t("share.download")}
            </button>
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* bottom dock — a single "Voltar" */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className={["absolute bottom-8 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out", dockHidden ? "translate-y-[120px]" : ""].join(" ")}>
          <ul {...dh("dock")} style={posStyle("dock")} className={`pointer-events-auto inline-flex items-center rounded-[26px] border border-white/10 bg-[rgba(166,166,166,0.20)] px-8 pt-4 pb-6 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150${ring}`}>
            <button type="button" onClick={onClose} className="group relative flex flex-col items-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/10 bg-white/10 text-white/85 shadow-[0_0_10px_2px_rgba(0,0,0,0.25)] transition group-hover:bg-accent group-hover:text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-4" /></svg>
              </span>
              <span style={jakarta} className="absolute top-[calc(100%+6px)] whitespace-nowrap text-[9px] font-semibold leading-none text-[#dcd9d9] opacity-60 transition group-hover:opacity-90">{t("apt.back")}</span>
            </button>
          </ul>
        </div>
        <button type="button" onClick={() => setDockHidden((v) => !v)} aria-label={dockHidden ? t("hud.showMenu") : t("hud.hideMenu")} className="pointer-events-auto absolute bottom-2 left-1/2 z-10 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-[6px] border border-white/10 bg-[rgba(166,166,166,0.28)] text-white/75 backdrop-blur-md">
          <svg viewBox="0 0 24 24" className={["h-3.5 w-3.5 transition-transform", dockHidden ? "" : "rotate-180"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
        </button>
      </div>

      {/* ── layout editor (?bcal=1) — draggable + collapsible ── */}
      {bcal && (
        <div style={panelPos ? { left: panelPos.x, top: panelPos.y } : { right: 16, top: 16 }} className="pointer-events-auto absolute z-[95] flex max-h-[92vh] w-[270px] flex-col rounded-xl border border-white/20 bg-black/85 text-white shadow-2xl backdrop-blur-md">
          <div
            onPointerDown={(e) => {
              const x = panelPos?.x ?? Math.max(0, window.innerWidth - 270 - 16);
              const y = panelPos?.y ?? 16;
              if (!panelPos) setPanelPos({ x, y });
              panelDrag.current = { dx: e.clientX - x, dy: e.clientY - y };
            }}
            className="flex shrink-0 cursor-move items-center justify-between gap-2 border-b border-white/10 px-3 py-2"
          >
            <span className="text-[11px] font-semibold">Editar · arraste itens · Ctrl+Z</span>
            <button type="button" onClick={() => setPanelOpen((o) => !o)} aria-label="recolher" className="rounded p-1 hover:bg-white/10">
              <svg viewBox="0 0 24 24" className={["h-3.5 w-3.5 transition-transform", panelOpen ? "" : "rotate-180"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
            </button>
          </div>
          {panelOpen && (
            <div className="flex flex-col gap-1 overflow-y-auto p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">Colunas</p>
              <Knob label="Coluna 1" value={cfg.cols[0]} min={0.4} max={2} step={0.01} onChange={(v) => setCol(0, v)} />
              <Knob label="Coluna 2" value={cfg.cols[1]} min={0.4} max={2} step={0.01} onChange={(v) => setCol(1, v)} />
              <Knob label="Coluna 3" value={cfg.cols[2]} min={0.4} max={2} step={0.01} onChange={(v) => setCol(2, v)} />
              <Knob label="Espaço" value={cfg.gap} min={0} max={60} onChange={(v) => set("gap", v)} />
              <Knob label="Margem lat." value={cfg.padX} min={0} max={120} onChange={(v) => set("padX", v)} />
              <Knob label="Margem topo" value={cfg.padTop} min={0} max={200} onChange={(v) => set("padTop", v)} />
              <Knob label="Margem base" value={cfg.padBottom} min={0} max={220} onChange={(v) => set("padBottom", v)} />
              <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">Overview</p>
              <Knob label="Título" value={cfg.ovTitle} min={12} max={48} onChange={(v) => set("ovTitle", v)} />
              <Knob label="Texto" value={cfg.ovText} min={8} max={22} onChange={(v) => set("ovText", v)} />
              <Knob label="Imagem %" value={cfg.ovImg} min={20} max={70} onChange={(v) => set("ovImg", v)} />
              <Knob label="Img rotação" value={cfg.ovImgRot} min={0} max={360} onChange={(v) => set("ovImgRot", v)} />
              <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">Opcionais</p>
              <Knob label="Título" value={cfg.opTitle} min={12} max={48} onChange={(v) => set("opTitle", v)} />
              <Knob label="Planta %" value={cfg.opPlanScale} min={40} max={200} onChange={(v) => set("opPlanScale", v)} />
              <Knob label="Planta rot." value={cfg.opPlanRot} min={0} max={360} onChange={(v) => set("opPlanRot", v)} />
              <Knob label="Pílula txt" value={cfg.opPill} min={6} max={16} onChange={(v) => set("opPill", v)} />
              <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">Imagens</p>
              <Knob label="Título" value={cfg.imgTitle} min={12} max={48} onChange={(v) => set("imgTitle", v)} />
              <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">QR</p>
              <Knob label="QR tam." value={cfg.qrSize} min={60} max={160} onChange={(v) => set("qrSize", v)} />
              <Knob label="Título" value={cfg.qrTitle} min={10} max={28} onChange={(v) => set("qrTitle", v)} />
              <Knob label="Preço" value={cfg.price} min={18} max={56} onChange={(v) => set("price", v)} />
              <Knob label="Círculos" value={cfg.circle} min={36} max={72} onChange={(v) => set("circle", v)} />
              <button type="button" onClick={saveCfg} className="mt-3 w-full rounded bg-accent py-2 text-xs font-semibold transition hover:brightness-110">{cfgSaved ? "✓ Salvo" : "Salvar layout"}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
