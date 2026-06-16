"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useExperience } from "@/lib/store";
import { useLang, useT, pick, type TKey } from "@/lib/i18n";
import {
  UNITS,
  STATUS_META,
  STATUS_ORDER,
  DEFAULT_FILTERS,
  PRICE_FLOOR,
  PRICE_CAP,
  AREA_FLOOR,
  AREA_CAP,
  FLOOR_MIN,
  FLOOR_MAX,
  matches,
  type Unit,
  type Filters,
  type UnitStatus,
} from "@/lib/apartments";
import { plantaFor, plantaWideFor } from "@/lib/plantas";
import { hotspotsFor, ROOM_LABEL, type Hotspot, type RoomKey } from "@/lib/ambientes";
import { useUiScale } from "@/lib/use-ui-scale";
import Panorama360 from "@/components/Panorama360";
import ShareScreen from "@/components/apartments/share-screen";
import ThankYouScreen from "@/components/apartments/thank-you-screen";

// Hero image natural size + tower facade as a perspective quad per slab.
const IMG_W = 1600;
const IMG_H = 900;
// The frame the Apartamentos view sits on (hero START_FRAME) — rendered inside the
// units layer so mix-blend-mode can blend the status colours into the building.
const APT_BASE_FRAME = "/frames/explore/0048.webp";

type Pt = [number, number];
type Quad = { TL: Pt; TR: Pt; BR: Pt; BL: Pt };

const FACES: { quad: Quad; lines: string[] }[] = [
  // left (front) facade — rough estimate on frame 120; fine-tune via ?fcal=1
  { quad: { TL: [40.5, 22.0], TR: [49.0, 21.5], BR: [49.0, 76.0], BL: [41.0, 76.0] }, lines: ["A"] },
  // right (receding) facade
  { quad: { TL: [49.0, 21.5], TR: [57.5, 22.5], BR: [57.0, 75.0], BL: [49.0, 76.0] }, lines: ["B"] },
];

// Separate facade quads for the SOLAR view (different camera angle). Rough
// estimate; calibrate via ?fcal=1 while in solar mode.
const SOLAR_FACES_DEFAULT: Quad[] = [
  { TL: [44, 18], TR: [52.5, 17.5], BR: [52.5, 70], BL: [44.5, 70] },
  { TL: [52.5, 17.5], TR: [57, 20], BR: [56.5, 67], BL: [52.5, 70] },
];

// The solar video drifts as the day passes, so the solar facade is calibrated at
// several keyframes (by slider position t) and interpolated.
type SolarKey = { t: number; quads: Quad[] };
const lerpPt = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const lerpQuad = (a: Quad, b: Quad, f: number): Quad => ({ TL: lerpPt(a.TL, b.TL, f), TR: lerpPt(a.TR, b.TR, f), BR: lerpPt(a.BR, b.BR, f), BL: lerpPt(a.BL, b.BL, f) });
function interpSolarQuads(keys: SolarKey[], t: number): Quad[] {
  if (keys.length === 0) return SOLAR_FACES_DEFAULT;
  if (keys.length === 1) return keys[0].quads;
  const s = [...keys].sort((a, b) => a.t - b.t);
  if (t <= s[0].t) return s[0].quads;
  if (t >= s[s.length - 1].t) return s[s.length - 1].quads;
  for (let i = 0; i < s.length - 1; i++) {
    if (t >= s[i].t && t <= s[i + 1].t) {
      const f = (t - s[i].t) / (s[i + 1].t - s[i].t || 1);
      return s[i].quads.map((q, qi) => lerpQuad(q, s[i + 1].quads[qi], f));
    }
  }
  return s[s.length - 1].quads;
}

const LINE_FACE: Record<string, { face: number; col: number; cols: number }> = (() => {
  const m: Record<string, { face: number; col: number; cols: number }> = {};
  FACES.forEach((f, fi) =>
    f.lines.forEach((ln, ci) => (m[ln] = { face: fi, col: ci, cols: f.lines.length }))
  );
  return m;
})();

const FLOORS = Array.from(new Set(UNITS.map((u) => u.floor))).sort((a, b) => b - a);
const ROWS = FLOORS.length;

function coverPoint(px: number, py: number, w: number, h: number): Pt {
  const scale = Math.max(w / IMG_W, h / IMG_H);
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  const offX = (w - dispW) / 2;
  const offY = (h - dispH) / 2;
  return [offX + (px / 100) * dispW, offY + (py / 100) * dispH];
}

function makeQuadMap(p0: Pt, p1: Pt, p2: Pt, p3: Pt) {
  const ax = p0[0] - p1[0] + p2[0] - p3[0];
  const ay = p0[1] - p1[1] + p2[1] - p3[1];
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, hh: number;
  if (Math.abs(ax) < 1e-6 && Math.abs(ay) < 1e-6) {
    a = p1[0] - p0[0]; b = p2[0] - p1[0]; c = p0[0];
    d = p1[1] - p0[1]; e = p2[1] - p1[1]; f = p0[1];
    g = 0; hh = 0;
  } else {
    const bx = p1[0] - p2[0], by = p1[1] - p2[1];
    const cx = p3[0] - p2[0], cy = p3[1] - p2[1];
    const det = bx * cy - cx * by;
    g = (ax * cy - ay * cx) / det;
    hh = (bx * ay - by * ax) / det;
    a = p1[0] - p0[0] + g * p1[0];
    b = p3[0] - p0[0] + hh * p3[0];
    c = p0[0];
    d = p1[1] - p0[1] + g * p1[1];
    e = p3[1] - p0[1] + hh * p3[1];
    f = p0[1];
  }
  return (u: number, v: number): Pt => {
    const w = g * u + hh * v + 1;
    return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
  };
}

function insetQuad(pts: Pt[], amt: number): string {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  return pts
    .map(([x, y]) => {
      const dx = cx - x;
      const dy = cy - y;
      const len = Math.hypot(dx, dy) || 1;
      return `${x + (dx / len) * amt},${y + (dy / len) * amt}`;
    })
    .join(" ");
}

function useFaceMaps(quads: Quad[]) {
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return useMemo(() => {
    const { w, h } = vp;
    if (!w || !h) return null;
    const maps = quads.map(({ TL, TR, BR, BL }) =>
      makeQuadMap(
        coverPoint(TL[0], TL[1], w, h),
        coverPoint(TR[0], TR[1], w, h),
        coverPoint(BR[0], BR[1], w, h),
        coverPoint(BL[0], BL[1], w, h)
      )
    );
    return { w, h, maps };
  }, [vp, quads]);
}

/* — small UI atoms — */
function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "pointer-events-auto rounded-[18px] border border-white/10 bg-[rgba(166,166,166,0.20)] px-4 py-2.5 backdrop-blur-xl backdrop-saturate-150",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function RangeSlider({
  label,
  format,
  min,
  max,
  step = 1,
  vmin,
  vmax,
  onMin,
  onMax,
}: {
  label: string;
  format: (v: number) => string;
  min: number;
  max: number;
  step?: number;
  vmin: number;
  vmax: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const jakarta = { fontFamily: "var(--font-jakarta), system-ui, sans-serif" } as const;
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-1.5">
        <span style={jakarta} className="shrink-0 whitespace-nowrap text-[9px] font-medium tracking-[-0.02em] text-[#d1d1d1]">{format(vmin)}</span>
        <span style={jakarta} className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-white">{label}</span>
        <span style={jakarta} className="shrink-0 whitespace-nowrap text-[9px] font-medium tracking-[-0.02em] text-[#d1d1d1]">{format(vmax)}</span>
      </div>
      <div className="relative flex h-3.5 items-center">
        <div className="absolute h-2 w-full rounded-full bg-[#d1d1d1]" />
        <div
          className="absolute h-2 rounded-full bg-[#9e82f7]"
          style={{ left: `${pct(vmin)}%`, right: `${100 - pct(vmax)}%` }}
        />
        <input
          type="range"
          className="zy-dual"
          min={min}
          max={max}
          step={step}
          value={vmin}
          onChange={(e) => onMin(Math.min(Number(e.target.value), vmax - step))}
        />
        <input
          type="range"
          className="zy-dual"
          min={min}
          max={max}
          step={step}
          value={vmax}
          onChange={(e) => onMax(Math.max(Number(e.target.value), vmin + step))}
        />
      </div>
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const numBR = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="border-b border-white/15 pb-1.5"
      style={{ fontFamily: "var(--font-redhat), system-ui, sans-serif" }}
    >
      <p className="text-[11px] font-normal text-white/70">{label}</p>
      <p className="text-[20px] font-extrabold leading-tight text-white">{value}</p>
    </div>
  );
}

// Static feature highlights shown on the expanded floorplan view.
const FEATURES: { titleKey: TKey; descKey: TKey; on: boolean }[] = [
  { titleKey: "feat.insulation.title", descKey: "feat.insulation.desc", on: true },
  { titleKey: "feat.glazing.title", descKey: "feat.glazing.desc", on: false },
  { titleKey: "feat.climate.title", descKey: "feat.climate.desc", on: false },
];

// Solar-position frame sequence (scrubbed on a canvas — smooth both ways, unlike
// a <video>). Drop frames in public/aptos/frames/0001.webp…NNNN.webp.
const SOLAR_FRAME_COUNT = 100;
const solarFrameSrc = (i: number) => `/aptos/frames/${String(i + 1).padStart(4, "0")}.webp`;
// Clock range mapped across the slider (frame 1 → frame N). Tune to taste.
const SOLAR_START_MIN = 2 * 60; // bottom / first frame → 02:00 (dark)
const SOLAR_END_MIN = 20 * 60 + 30; // top / last frame → 20:30 (golden dusk)

export default function ApartmentsOverlay() {
  const lang = useLang();
  const t = useT();
  const panel = useExperience((s) => s.panel);
  const navTick = useExperience((s) => s.navTick);
  const closePanel = useExperience((s) => s.closePanel);
  const aptReady = useExperience((s) => s.aptReady);
  const uiCollapsed = useExperience((s) => s.uiCollapsed);
  const setAptExpanded = useExperience((s) => s.setAptExpanded);
  const savedList = useExperience((s) => s.saved);
  const toggleSaved = useExperience((s) => s.toggleSaved);
  const removeSaved = useExperience((s) => s.removeSaved);
  const planFeatures = useExperience((s) => s.planFeatures);
  const setPlanFeatures = useExperience((s) => s.setPlanFeatures);
  const clearSaved = useExperience((s) => s.clearSaved);
  const uiScale = useUiScale();
  // Filters retract before the dock; expand after it (stagger via transition-delay).
  const filterDelay = uiCollapsed ? "0ms" : "150ms";
  const open = panel === "apartments";

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);
  // Facade calibration (?fcal=1): drag the 8 corners onto the tower, then Save.
  const [faceQuads, setFaceQuads] = useState<Quad[]>(() => FACES.map((f) => f.quad));
  const [solarQuads, setSolarQuads] = useState<Quad[]>(SOLAR_FACES_DEFAULT); // fcal working set
  const [solarKeys, setSolarKeys] = useState<SolarKey[]>([]); // calibrated keyframes (interpolated)
  const [fcal, setFcal] = useState(false);
  const [facesSaved, setFacesSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandClosing, setExpandClosing] = useState(false); // play zoom-out before unmount
  // Solar-position mode: clicking the sun hides the status legend and shows a
  // slider that scrubs a day/night (or winter) video of the building.
  const solarMode = useExperience((s) => s.solarMode); // driven from the main dock's sun button
  const setSolarMode = useExperience((s) => s.setSolarMode);
  const [solarT, setSolarT] = useState(0.324); // 0..1 slider → video position (default ≈ 08:00)
  const solarCanvasRef = useRef<HTMLCanvasElement>(null);
  const solarImgsRef = useRef<HTMLImageElement[]>([]);
  const solarTRef = useRef(0.324); // ≈ 08:00 (matches solarT default)
  const solarTrackRef = useRef<HTMLDivElement>(null);
  const [pano, setPano] = useState<string | null>(null); // 360 viewer src (null = closed)
  const [share, setShare] = useState(false); // brochure screen
  const [thanks, setThanks] = useState(false); // "thank you" screen (after sharing)
  const [unitBookmarked, setUnitBookmarked] = useState(false); // cosmetic "saved" for the unit
  const [expDockHidden, setExpDockHidden] = useState(false); // retract the expanded-view dock
  const [roomView, setRoomView] = useState<{ room: RoomKey; src: string } | null>(null); // fullscreen room photo
  // ── hotspot calibration mode (open the plan with ?cal=1): drag the eyes onto
  // the right rooms and copy the generated coords into src/lib/ambientes.ts ──
  const [cal, setCal] = useState(false);
  const [calSpots, setCalSpots] = useState<Hotspot[]>([]);
  const [calSaved, setCalSaved] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Hotspot[]>>({});
  const planRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  // The random image per room is decided ONCE per unit and stays fixed while you
  // click around this plan; it re-rolls when you open a different unit.
  const picksRef = useRef<Partial<Record<RoomKey, string | null>>>({});
  // Saved positions (from ?cal=1) win over the defaults in ambientes.ts.
  const spotsFor = (bedrooms: number): Hotspot[] => overrides[String(bedrooms)] ?? hotspotsFor(bedrooms);

  useEffect(() => {
    setExpanded(false);
    setPano(null);
    setShare(false);
    setThanks(false);
    setUnitBookmarked(false);
    setRoomView(null);
    setSolarMode(false);
    picksRef.current = {}; // re-roll room images for the new unit
  }, [selected, setSolarMode]);

  // Re-tapping the Apartamentos dock item (bumps navTick) returns to the base
  // apartments view — close any open unit detail / expanded / solar / 360.
  useEffect(() => {
    setSelected(null);
    setExpanded(false);
    setExpandClosing(false);
    setSolarMode(false);
    setPano(null);
    setShare(false);
    setThanks(false);
    setRoomView(null);
    setFilters(DEFAULT_FILTERS); // open clean — no status colours until the user picks a filter
  }, [navTick, setSolarMode]);

  // Enable calibration when the URL has ?cal=1; load any saved overrides.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCal(new URLSearchParams(window.location.search).get("cal") === "1");
    fetch("/api/hotspots")
      .then((r) => r.json())
      .then((data) => setOverrides(data && typeof data === "object" ? data : {}))
      .catch(() => {});
  }, []);

  // Seed the draggable copy from the current (saved-or-default) hotspots.
  useEffect(() => {
    if (selected) setCalSpots(spotsFor(selected.bedrooms).map((h) => ({ ...h })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, overrides]);

  // Reset the "saved" badge when switching units.
  useEffect(() => setCalSaved(false), [selected]);

  // Persist the dragged positions for this plan (no manual copy needed).
  const saveCal = async () => {
    if (!selected) return;
    try {
      await fetch("/api/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedrooms: selected.bedrooms, spots: calSpots }),
      });
      setOverrides((o) => ({ ...o, [String(selected.bedrooms)]: calSpots }));
      setCalSaved(true);
    } catch {
      /* ignore */
    }
  };

  // Drag handling for calibration: update the dragged spot's % from the plan box.
  useEffect(() => {
    if (!cal) return;
    const onMove = (e: PointerEvent) => {
      const i = dragIdx.current;
      const el = planRef.current;
      if (i == null || !el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
      setCalSpots((s) => s.map((h, j) => (j === i ? { ...h, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : h)));
    };
    const onUp = () => (dragIdx.current = null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [cal]);

  // Decide (once per unit) which image a room shows, fetching its folder if needed.
  const pickFor = async (room: RoomKey): Promise<string | null> => {
    if (room in picksRef.current) return picksRef.current[room] ?? null;
    try {
      const res = await fetch(`/api/ambientes/${room}`);
      const imgs: string[] = (await res.json()).images ?? [];
      const src = imgs.length ? imgs[Math.floor(Math.random() * imgs.length)] : null;
      picksRef.current[room] = src;
      if (src) {
        const im = new Image();
        im.src = src; // warm the browser cache so the overlay opens instantly
      }
      return src;
    } catch {
      return null;
    }
  };

  // Open a room straight on its (decoded) image — no intermediate screen.
  const openRoom = async (room: RoomKey) => {
    const src = await pickFor(room);
    if (!src) return; // no images in that folder → do nothing
    const im = new Image();
    im.onload = () => setRoomView({ room, src });
    im.src = src; // fires onload immediately if already cached
  };

  // Pre-decide + preload each room's image when the plan opens, so clicking an
  // eye opens instantly on the photo (no black flash).
  useEffect(() => {
    if (!expanded || !selected) return;
    const rooms = Array.from(new Set(spotsFor(selected.bedrooms).map((h) => h.room)));
    rooms.forEach((room) => void pickFor(room));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, selected]);

  // Tell the HUD when the expanded floorplan is open (it hides the compass + dock).
  useEffect(() => {
    setAptExpanded(expanded);
  }, [expanded, setAptExpanded]);

  const facade = useFaceMaps(faceQuads);
  // during solar calibration show the working set; otherwise interpolate keyframes
  const currentSolarQuads = fcal && solarMode ? solarQuads : interpSolarQuads(solarKeys, solarT);
  const solarFacade = useFaceMaps(currentSolarQuads);
  const matched = useMemo(() => UNITS.filter((u) => matches(u, filters)), [filters]);
  const matchedIds = useMemo(() => new Set(matched.map((u) => u.id)), [matched]);

  // Close the expanded floorplan with a zoom-out before unmounting.
  const closeExpand = () => {
    setRoomView(null);
    setExpandClosing(true);
    setTimeout(() => {
      setExpanded(false);
      setExpandClosing(false);
    }, 280);
  };

  // Perspective corners of a unit's facade band (for the highlight bar + label).
  const geomFor = (u: Unit | null) => {
    if (!u || !facade) return null;
    const lf = LINE_FACE[u.line];
    if (!lf) return null;
    const row = FLOORS.indexOf(u.floor);
    if (row < 0) return null;
    const map = facade.maps[lf.face];
    const u0 = lf.col / lf.cols;
    const u1 = (lf.col + 1) / lf.cols;
    const v0 = row / ROWS;
    const v1 = (row + 1) / ROWS;
    return { TL: map(u0, v0), TR: map(u1, v0), BR: map(u1, v1), BL: map(u0, v1) };
  };
  const selGeo = geomFor(selected);
  const hovGeo = hover && hover.id !== selected?.id ? geomFor(hover) : null;

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const toggleStatus = (s: UnitStatus) =>
    setFilters((f) => ({
      ...f,
      active: f.active.includes(s) ? f.active.filter((x) => x !== s) : [...f.active, s],
    }));
  const toggleBedroom = (n: number) =>
    setFilters((f) => ({
      ...f,
      bedrooms: f.bedrooms.includes(n) ? f.bedrooms.filter((x) => x !== n) : [...f.bedrooms, n],
    }));

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setHover(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (roomView) setRoomView(null);
      else if (selected) setSelected(null);
      else closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, closePanel, roomView]);

  // Enable facade calibration via ?fcal=1; load any saved quads.
  useEffect(() => {
    if (typeof window !== "undefined") setFcal(new URLSearchParams(window.location.search).get("fcal") === "1");
    fetch("/api/facade-config")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.quads) && d.quads.length === 2) setFaceQuads(d.quads);
        if (d && Array.isArray(d.solarKeys) && d.solarKeys.length) {
          setSolarKeys(d.solarKeys);
          setSolarQuads(d.solarKeys[0].quads);
        } else if (d && Array.isArray(d.solarQuads) && d.solarQuads.length === 2) {
          // legacy single calibration → one keyframe
          setSolarKeys([{ t: 0.324, quads: d.solarQuads }]);
          setSolarQuads(d.solarQuads);
        }
      })
      .catch(() => {});
  }, []);

  // Draw the slider's current frame to the canvas (cover-fit), reading the live ref.
  const drawSolar = () => {
    const canvas = solarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = Math.min(SOLAR_FRAME_COUNT - 1, Math.max(0, Math.round(solarTRef.current * (SOLAR_FRAME_COUNT - 1))));
    const img = solarImgsRef.current[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let dw = cw;
    let dh = ch;
    if (cr > ir) dh = cw / ir;
    else dw = ch * ir;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  // Preload the frame sequence + size the canvas when solar mode opens.
  useEffect(() => {
    if (!solarMode) return;
    const sizeAndDraw = () => {
      const c = solarCanvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      drawSolar();
    };
    if (!solarImgsRef.current.length) {
      const imgs: HTMLImageElement[] = new Array(SOLAR_FRAME_COUNT);
      for (let i = 0; i < SOLAR_FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = drawSolar; // paint as soon as the needed frame lands
        img.src = solarFrameSrc(i);
        imgs[i] = img;
      }
      solarImgsRef.current = imgs;
    }
    sizeAndDraw();
    window.addEventListener("resize", sizeAndDraw);
    return () => window.removeEventListener("resize", sizeAndDraw);
  }, [solarMode]);

  if (!open || !aptReady) return null;

  // Saving the plan ("Salvar" in the detail menu) sends EVERY room image of this
  // unit to the brochure's "Imagens selecionadas" at once — no per-room saving.
  // Un-saving removes them all again.
  const unitSaved = unitBookmarked;
  const saveUnit = async () => {
    if (!selected) return;
    const next = !unitBookmarked;
    setUnitBookmarked(next);
    const rooms = Array.from(new Set(spotsFor(selected.bedrooms).map((h) => h.room)));
    const picks = await Promise.all(
      rooms.map(async (room) => {
        const src = await pickFor(room);
        return src ? { id: `room-${src}`, src, room } : null;
      })
    );
    picks.forEach((p) => {
      if (!p) return;
      const present = savedList.some((x) => x.id === p.id);
      if (next && !present) toggleSaved({ id: p.id, src: p.src, label: pick(lang, ROOM_LABEL[p.room]) });
      else if (!next && present) removeSaved(p.id);
    });
  };

  // Slider → scrub the frame sequence (forward/back = time of day / sun position).
  const scrubSolar = (v: number) => {
    solarTRef.current = v;
    setSolarT(v);
    drawSolar();
  };
  // Time-of-day label shown in the bubble (mapped across the slider range).
  const solarMinutes = Math.round(SOLAR_START_MIN + solarT * (SOLAR_END_MIN - SOLAR_START_MIN));
  const solarTime = `${String(Math.floor(solarMinutes / 60)).padStart(2, "0")}:${String(solarMinutes % 60).padStart(2, "0")}`;
  // Custom vertical slider: drag anywhere on the track (top = 1, bottom = 0).
  const onSolarPointer = (e: React.PointerEvent) => {
    const read = (cy: number) => {
      const el = solarTrackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      scrubSolar(Math.min(1, Math.max(0, 1 - (cy - r.top) / r.height)));
    };
    e.preventDefault();
    read(e.clientY);
    const move = (ev: PointerEvent) => read(ev.clientY);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Facade calibration: drag a corner; convert screen px → image %. Calibration
  // runs at scale 1 (no zoom), so coverPoint inverse is enough.
  const cornerNames = ["TL", "TR", "BR", "BL"] as const;
  const startFaceDrag = (fi: number, corner: (typeof cornerNames)[number]) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const read = (sx: number, sy: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.max(w / IMG_W, h / IMG_H);
      const dispW = IMG_W * scale;
      const dispH = IMG_H * scale;
      const x = ((sx - (w - dispW) / 2) / dispW) * 100;
      const y = ((sy - (h - dispH) / 2) / dispH) * 100;
      const p: Pt = [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
      const setter = solarMode ? setSolarQuads : setFaceQuads;
      setter((qs) => qs.map((q, i) => (i === fi ? { ...q, [corner]: p } : q)));
      setFacesSaved(false);
    };
    read(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => read(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  // Drag the whole shape (both faces, all 8 corners) by the same offset — handy
  // when only the position shifts (the cut stays the same).
  const startFaceMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let last = { x: e.clientX, y: e.clientY };
    const setter = solarMode ? setSolarQuads : setFaceQuads;
    const move = (ev: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.max(w / IMG_W, h / IMG_H);
      const ddx = ((ev.clientX - last.x) / (IMG_W * scale)) * 100;
      const ddy = ((ev.clientY - last.y) / (IMG_H * scale)) * 100;
      last = { x: ev.clientX, y: ev.clientY };
      const shift = (p: Pt): Pt => [Math.round((p[0] + ddx) * 10) / 10, Math.round((p[1] + ddy) * 10) / 10];
      setter((qs) => qs.map((q) => ({ TL: shift(q.TL), TR: shift(q.TR), BR: shift(q.BR), BL: shift(q.BL) })));
      setFacesSaved(false);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const persistFacade = async (keys: SolarKey[]) => {
    try {
      await fetch("/api/facade-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quads: faceQuads, solarKeys: keys }),
      });
      setFacesSaved(true);
    } catch {
      /* ignore */
    }
  };
  const saveFaces = () => persistFacade(solarKeys); // apartments faces (keeps solar keyframes)
  const saveSolarKey = () => {
    const t = solarTRef.current;
    const next = [...solarKeys.filter((k) => Math.abs(k.t - t) > 0.03), { t, quads: solarQuads }].sort((a, b) => a.t - b.t);
    setSolarKeys(next);
    persistFacade(next);
  };
  const clearSolarKeys = () => {
    setSolarKeys([]);
    persistFacade([]);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* solar-position frame sequence — scrubbed on a canvas; covers the building */}
      {solarMode && (
        <canvas
          ref={solarCanvasRef}
          aria-hidden="true"
          className="zy-solar-zoomout pointer-events-none absolute inset-0 z-[6] h-full w-full"
        />
      )}

      {/* solar is a standalone day/night view now (opened from the dock sun) — no
          per-unit floor marking. */}

      {/* click-outside catcher — closes the unit detail. Sits below the hotspots
          (so other units stay clickable) and below the panel/filters. */}
      {selected && !solarMode && (
        <div className="pointer-events-auto absolute inset-0" onClick={() => setSelected(null)} />
      )}

      {/* building-aligned layer — apartments base is the paused 360 frame (hero
          canvas) zoomed 1.4×; solar mode zooms out to 1×. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `scale(${solarMode || fcal ? 1 : 1.4})`,
          transformOrigin: "50% 40%",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
      {/* paused 360 frame inside this layer — gives mix-blend-mode a backdrop so
          the status colours blend INTO the building (the hero canvas behind is a
          separate layer the blend can't reach). Aligned 1:1 with the hero. */}
      {!solarMode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={APT_BASE_FRAME} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      )}
      {/* on-image hotspots (perspective grid) — hidden in solar mode (the solar
          view draws its own highlight from the solar calibration) */}
      {facade && !solarMode && (
        <svg className="pointer-events-none absolute inset-0" width={facade.w} height={facade.h} viewBox={`0 0 ${facade.w} ${facade.h}`} style={{ mixBlendMode: "hard-light" }}>
          <defs>
            {/* coloured-glass fill — saturated hue, glossy highlight at the top,
                kept translucent so the render reads through it */}
            <linearGradient id="selGrad-available" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#7c3aed" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.66" />
            </linearGradient>
            <linearGradient id="selGrad-sold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c81e1e" stopOpacity="0.66" />
            </linearGradient>
            <linearGradient id="selGrad-reserved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.72" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.68" />
            </linearGradient>
          </defs>
          {FLOORS.map((floor, row) =>
            UNITS.filter((u) => u.floor === floor).map((u) => {
              const lf = LINE_FACE[u.line];
              if (!lf) return null;
              const map = facade.maps[lf.face];
              const on = matchedIds.has(u.id);
              const isSel = selected?.id === u.id;
              const isHov = hover?.id === u.id;
              const u0 = lf.col / lf.cols;
              const u1 = (lf.col + 1) / lf.cols;
              const v0 = row / ROWS;
              const v1 = (row + 1) / ROWS;
              const corners: Pt[] = [map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)];
              return (
                <polygon
                  key={u.id}
                  points={insetQuad(corners, isSel ? 3 : 1.2)}
                  fill={STATUS_META[u.status].dot}
                  fillOpacity={isSel || isHov || on ? 1 : fcal ? 0.5 : 0}
                  stroke={fcal ? "rgba(255,255,255,0.9)" : isSel ? "rgba(255,255,255,0.98)" : isHov ? "rgba(255,255,255,0.85)" : on ? "rgba(255,255,255,0.8)" : "transparent"}
                  strokeWidth={fcal ? 1 : isSel ? 2 : isHov ? 1.25 : on ? 1 : 0}
                  strokeLinejoin="round"
                  className="cursor-pointer outline-none"
                  style={{
                    pointerEvents: "all",
                    transition: "fill-opacity 200ms ease, filter 200ms ease",
                    filter: isSel
                      ? "drop-shadow(0 0 2px rgba(255,255,255,1)) drop-shadow(0 0 9px rgba(255,255,255,0.65))"
                      : isHov
                      ? `drop-shadow(0 0 5px ${STATUS_META[u.status].dot})`
                      : undefined,
                  }}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHover(u)}
                  onMouseLeave={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onFocus={() => setHover(u)}
                  onBlur={() => setHover((h) => (h?.id === u.id ? null : h))}
                  onClick={() => setSelected(isSel ? null : u)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(isSel ? null : u);
                    }
                  }}
                  aria-label={`${t("apt.unit")} ${u.label} — ${pick(lang, STATUS_META[u.status].label)}`}
                />
              );
            })
          )}
        </svg>
      )}

      {/* selected-unit label on the facade — "Ap." + number (Red Hat Black) */}
      {selGeo && selected && !solarMode && (
        <div
          className="pointer-events-none absolute z-[5]"
          style={{
            left: (selGeo.TL[0] + selGeo.BL[0]) / 2 + 10,
            top: (selGeo.TL[1] + selGeo.BL[1]) / 2,
            transform: "translateY(-50%)",
            fontFamily: "var(--font-redhat), system-ui, sans-serif",
          }}
        >
          <p className="text-[8px] font-medium leading-none text-white/85">{t("apt.apShort")}</p>
          <p className="text-[20px] font-black leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            {selected.label}
          </p>
        </div>
      )}

      {/* hover preview label — unit number while hovering the facade */}
      {hovGeo && hover && !solarMode && (
        <div
          className="pointer-events-none absolute z-[5]"
          style={{
            left: (hovGeo.TL[0] + hovGeo.BL[0]) / 2 + 8,
            top: (hovGeo.TL[1] + hovGeo.BL[1]) / 2,
            transform: "translateY(-50%)",
            fontFamily: "var(--font-redhat), system-ui, sans-serif",
          }}
        >
          <p className="text-[13px] font-black leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
            {hover.label}
          </p>
        </div>
      )}
      </div>

      {/* status filter legend (right) — retracts to the right when solar mode opens */}
      <div
        className={[
          "pointer-events-auto absolute right-9 top-[calc(50%-10px)] flex w-[156px] -translate-y-1/2 flex-col items-stretch gap-3 transition-all duration-300 ease-out",
          solarMode ? "pointer-events-none translate-x-[210px] opacity-0" : uiCollapsed ? "translate-x-[210px]" : "translate-x-0",
        ].join(" ")}
        style={{ transitionDelay: filterDelay, zoom: uiScale }}
      >
        {STATUS_ORDER.map((s) => {
          const on = filters.active.includes(s);
          const m = STATUS_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={on}
              className={[
                "flex items-center gap-3.5 rounded-[15px] border px-4 py-3 backdrop-blur-[11px] backdrop-saturate-150 transition active:scale-95",
                on
                  ? "border-white bg-[rgba(166,166,166,0.20)] text-white"
                  : "border-white/10 bg-[rgba(166,166,166,0.20)] text-white hover:bg-[rgba(166,166,166,0.28)]",
              ].join(" ")}
            >
              <span
                className={["h-5 w-5 shrink-0 rounded-full", on ? "ring-1 ring-white" : ""].join(" ")}
                style={{ background: m.dot }}
              />
              <span
                style={{ fontFamily: "var(--font-redhat), system-ui, sans-serif" }}
                className="whitespace-nowrap text-[15px] text-white"
              >
                {pick(lang, m.plural)}
              </span>
            </button>
          );
        })}
      </div>

      {/* solar slider (vertical, right) — rises in when solar mode opens (as the
          status legend retracts). Sun at top, moon at bottom. */}
      <div className="absolute right-9 top-1/2 z-30 -translate-y-1/2" style={{ zoom: uiScale }}>
        <div
          className={[
            "flex w-[56px] flex-col items-center gap-3 transition-all duration-300 ease-out",
            solarMode && !uiCollapsed ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-[210px] opacity-0",
          ].join(" ")}
        >
          {/* time-of-day bubble (top) — fixed width so the slider never shifts;
              same glass as the capsule, a touch taller */}
          <div className="flex w-full items-center justify-center rounded-[16px] border border-white/10 bg-[rgba(166,166,166,0.20)] py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
            <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }} className="text-[11px] font-light text-white">{solarTime}</span>
          </div>
          {/* slider capsule */}
          <div className="flex h-[36vh] w-full flex-col items-center rounded-[18px] border border-white/10 bg-[rgba(166,166,166,0.20)] py-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
            {/* sun (top) — uploaded svg, recoloured grey via mask */}
            <span aria-hidden className="h-[20px] w-[20px] shrink-0 bg-white/55" style={{ WebkitMaskImage: "url(/aptos/icons/sol.svg)", maskImage: "url(/aptos/icons/sol.svg)", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" }} />
            {/* custom vertical track — purple fill grows/shrinks; purple thumb */}
            <div ref={solarTrackRef} onPointerDown={onSolarPointer} className="relative my-3 w-[6px] flex-1 cursor-pointer rounded-full bg-white/25">
              <div className="absolute inset-x-0 bottom-0 rounded-full bg-accent" style={{ height: `${solarT * 100}%` }} />
              <div className="absolute left-1/2 h-[11px] w-[11px] -translate-x-1/2 translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_2px_#d1d1d1,0_1px_2px_rgba(0,0,0,0.4)]" style={{ bottom: `${solarT * 100}%` }} />
            </div>
            {/* moon (bottom) — uploaded svg, recoloured grey via mask */}
            <span aria-hidden className="h-[18px] w-[18px] shrink-0 bg-white/55" style={{ WebkitMaskImage: "url(/aptos/icons/lua.svg)", maskImage: "url(/aptos/icons/lua.svg)", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" }} />
          </div>
        </div>
      </div>

      {/* bottom-left: Andar (card) + Dormitórios (card) — side by side */}
      <div
        className={[
          "absolute bottom-[52px] left-8 flex items-stretch gap-5 transition-all duration-300 ease-out",
          solarMode ? "pointer-events-none opacity-0" : uiCollapsed ? "translate-y-[160px]" : "translate-y-0",
        ].join(" ")}
        style={{ transitionDelay: filterDelay, zoom: uiScale }}
      >
        <Card className="w-[225px]">
          <RangeSlider
            label={t("apt.floor")}
            format={(v) => `${v}º`}
            min={FLOOR_MIN}
            max={FLOOR_MAX}
            vmin={filters.floorMin}
            vmax={filters.floorMax}
            onMin={(v) => set("floorMin", v)}
            onMax={(v) => set("floorMax", v)}
          />
        </Card>
        <Card className="flex w-[225px] items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }} className="whitespace-nowrap text-[11px] font-semibold text-white">{t("apt.bedrooms")}</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => {
                const on = filters.bedrooms.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleBedroom(n)}
                    style={{ fontFamily: "var(--font-redhat), system-ui, sans-serif" }}
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-[11px] border border-white/10 text-[14px] font-medium transition",
                      on
                        ? "bg-accent text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* bottom-right: Valor (card) + Metragem (card) — side by side */}
      <div
        className={[
          "absolute bottom-[52px] right-8 flex items-stretch gap-5 transition-all duration-300 ease-out",
          solarMode ? "pointer-events-none opacity-0" : uiCollapsed ? "translate-y-[160px]" : "translate-y-0",
        ].join(" ")}
        style={{ transitionDelay: filterDelay, zoom: uiScale }}
      >
        <Card className="w-[225px]">
          <RangeSlider
            label={t("apt.maxPrice")}
            format={(v) => `R$${numBR(v)}`}
            min={PRICE_FLOOR}
            max={PRICE_CAP}
            step={10000}
            vmin={filters.priceMin}
            vmax={filters.priceMax}
            onMin={(v) => set("priceMin", v)}
            onMax={(v) => set("priceMax", v)}
          />
        </Card>
        <Card className="w-[225px]">
          <RangeSlider
            label={t("apt.area")}
            format={(v) => `${v}m²`}
            min={AREA_FLOOR}
            max={AREA_CAP}
            vmin={filters.areaMin}
            vmax={filters.areaMax}
            onMin={(v) => set("areaMin", v)}
            onMax={(v) => set("areaMax", v)}
          />
        </Card>
      </div>

      {/* detail panel (left) — hidden while the expanded view is open so its
          back-holder doesn't ghost through the dark backdrop */}
      {selected && !expanded && (
        <>
          {/* back holder — larger card behind; its ~12px peek (top/right/bottom)
              forms the "traçado". Flush-left like the front, so nothing shows on the left. */}
          <div
            className={[
              "pointer-events-none absolute left-0 top-[44%] z-[10] h-[calc(min(360px,50vh)+22px)] w-[calc(min(290px,28vw)+11px)] -translate-y-1/2 rounded-tr-[40px] rounded-br-[48px] bg-white/20 backdrop-blur-[7.15px] transition-all duration-300 ease-out",
              uiCollapsed ? "-translate-x-[200%] opacity-0" : "translate-x-0",
            ].join(" ")}
            style={{ zoom: uiScale }}
          />

          <aside
            className={[
              "zy-fadein pointer-events-auto absolute left-0 top-[44%] z-[10] flex h-[min(360px,50vh)] w-[min(290px,28vw)] -translate-y-1/2 rounded-tr-[30px] rounded-br-[38px] bg-[rgba(0,0,0,0.26)] py-4 pl-[40px] pr-3 backdrop-blur-[7.15px] transition-all duration-300 ease-out",
              uiCollapsed ? "-translate-x-[200%] opacity-0" : "translate-x-0",
            ].join(" ")}
            style={{ fontFamily: "var(--font-redhat), system-ui, sans-serif", zoom: uiScale }}
          >
            {/* specs — full width so the dividers run across, behind the plan */}
            <div className="relative z-10 flex w-full flex-col justify-center">
              <p className="mb-2 text-[19px] font-black leading-none text-white">{selected.bedrooms} {t("apt.bedShort")}</p>
              <Detail label={t("apt.apShort")} value={selected.label} />
              <Detail label={t("apt.areaLabel")} value={`${selected.area}m²`} />
              <Detail label={t("apt.bedrooms")} value={pad2(selected.bedrooms)} />
              <Detail label={t("apt.bathrooms")} value={pad2(selected.suites)} />
              <div className="pt-2">
                <p className="text-[11px] font-normal text-white/70">{t("apt.priceLabel")}</p>
                <p className="text-[20px] font-extrabold leading-none text-white">{numBR(selected.price)}</p>
              </div>
            </div>

            {/* action buttons — horizontal row straddling the card's bottom edge (half in / half out).
                White by default, purple on hover (or while toggled active). */}
            <div className="absolute bottom-0 left-[44px] z-30 flex translate-y-1/2 gap-2.5">
              <PlanActionBtn label={t("apt.save")} white="salvar-branco" purple="salvar" active={unitSaved} pressed={unitSaved} check={unitSaved} onClick={saveUnit} />
              <PlanActionBtn label={t("apt.expandPlan")} white="expandir" purple="expandir-roxo" onClick={() => setExpanded(true)} />
            </div>

            {/* floor plan — vertical asset, on the right, half in / half out */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plantaFor(selected.bedrooms)}
              alt={`${t("apt.planAlt")} — ${t("apt.unit")} ${selected.label}`}
              className="pointer-events-none absolute right-0 top-1/2 z-20 h-[88%] w-auto max-w-none -translate-y-1/2 translate-x-1/2 object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            />
          </aside>
        </>
      )}

      {/* expanded floorplan — full detail view (zoom in on open, zoom out on close).
          NOTE: the dark/blur backdrop, feature cards and dock are kept OUTSIDE the
          zoomed wrapper (opacity-only fade) because a transformed ancestor silently
          kills their backdrop-filter. Only the plan + 360 markers actually zoom. */}
      {selected && expanded && (
        <div className="pointer-events-auto absolute inset-0 z-[60] overflow-hidden">
          {/* heavily blurred + darkened backdrop (no transformed ancestor → blur is reliable) */}
          <div
            className={[
              "absolute inset-0 bg-[#070d16]/40 backdrop-blur-[28px]",
              expandClosing ? "expand-fadeout" : "expand-fadein",
            ].join(" ")}
          />

          {/* right: feature cards — BEHIND the plan (z-10), tucked under its right edge.
              Fade only (no transform) so the card glass keeps its blur. */}
          <div
            className={[
              "absolute right-[4vw] top-[calc(57%-70px)] z-10 flex w-[44vw] -translate-y-1/2 flex-col gap-2",
              expandClosing ? "expand-fadeout" : "expand-fadein",
            ].join(" ")}
          >
            {FEATURES.map((f, i) => {
              const on = planFeatures[i];
              const isLast = i === FEATURES.length - 1;
              return (
                <div
                  key={f.titleKey}
                  className={[
                    "flex items-start gap-3 rounded-2xl rounded-l-none border border-white/50 bg-white/[0.08] py-4 pr-4 backdrop-blur-md",
                    // last card tucks under a plan notch → extend it less so its edge doesn't peek through
                    isLast ? "ml-[12vw] pl-[calc(32vw-340px)]" : "pl-[calc(44vw-340px)]",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold leading-tight text-white">{t(f.titleKey)}</h4>
                    <p className="mt-3 text-[14px] leading-snug text-white/55">{t(f.descKey)}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`${on ? t("apt.remove") : t("apt.add")} ${t(f.titleKey)}`}
                    onClick={() => setPlanFeatures(planFeatures.map((v, j) => (j === i ? !v : v)))}
                    className={[
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition active:scale-90",
                      on ? "border-transparent bg-accent text-white" : "border-white/30 text-white/60 hover:text-white",
                    ].join(" ")}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      {on ? <path d="M5 12l4 4 10-10" /> : <path d="M12 5v14M5 12h14" />}
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* left: unit info (fade only — no backdrop-filter, kept stable above the plan) */}
          <div
            className={[
              "absolute left-[4vw] top-[calc(57%-70px)] z-10 w-[40vw] -translate-y-1/2",
              expandClosing ? "expand-fadeout" : "expand-fadein",
            ].join(" ")}
            style={{ fontFamily: "var(--font-redhat), system-ui, sans-serif" }}
          >
            <h2 className="mb-6 text-3xl font-extrabold text-white">{selected.bedrooms} {t("apt.bedShort")}</h2>
            <div className="space-y-3.5">
              <Detail label={t("apt.numLabel")} value={selected.label} />
              <Detail label={t("apt.areaLabel")} value={`${selected.area}m²`} />
              <Detail label={t("apt.bedrooms")} value={pad2(selected.bedrooms)} />
              <Detail label={t("apt.bathrooms")} value={pad2(selected.suites)} />
              <div className="pt-1">
                <p className="text-[15px] text-white/55">{t("apt.priceLabel")}</p>
                <p className="text-3xl font-bold leading-tight text-white">{numBR(selected.price)}</p>
              </div>
            </div>
          </div>

          {/* zoom scene: the plan (the only layer that scales) — above the cards
              (z-20 > z-10) so the cards tuck behind the plan's right edge */}
          <div
            className={[
              "pointer-events-none absolute inset-0 z-20",
              expandClosing ? "expand-out" : "expand-in",
            ].join(" ")}
          >
            {/* center floorplan + room hotspots ("olhinhos") */}
            <div className="absolute inset-0 flex items-center justify-center px-[16vw]">
              <div ref={planRef} className="relative" style={{ transform: "translateY(calc(7vh - 70px))" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plantaWideFor(selected.bedrooms)}
                  alt={`${t("apt.planExpandedAlt")} — ${t("apt.unit")} ${selected.label}`}
                  className="block max-h-[88vh] max-w-[54vw] object-contain"
                />
                {(cal ? calSpots : spotsFor(selected.bedrooms)).map((h, i) => (
                  <button
                    key={`${h.room}-${i}`}
                    type="button"
                    onClick={cal ? undefined : () => openRoom(h.room)}
                    onPointerDown={cal ? (e) => { e.preventDefault(); dragIdx.current = i; setCalSaved(false); } : undefined}
                    aria-label={pick(lang, ROOM_LABEL[h.room])}
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    className={[
                      "pointer-events-auto group absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-accent/85 text-white shadow-[0_0_14px_3px_rgba(134,103,234,0.6)] backdrop-blur-sm transition",
                      cal ? "cursor-move ring-2 ring-white" : "hover:scale-125 hover:bg-accent",
                    ].join(" ")}
                  >
                    {!cal && <span className="hotspot-ping pointer-events-none absolute inset-0 rounded-full bg-accent/40" />}
                    <EyeIcon className="relative h-5 w-5" />
                    {cal && (
                      <span className="absolute left-1/2 top-[125%] -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1 text-[9px] font-medium leading-tight text-white">
                        {h.room} {h.x},{h.y}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* bottom dock — main-dock glass/squircle style; retract tab stays put to un-retract.
              Fade only (no transform) so the dock glass keeps its blur. */}
          <div
            className={[
              "absolute inset-x-0 bottom-0 z-30",
              expandClosing ? "expand-fadeout" : "expand-fadein",
            ].join(" ")}
          >
            <div
              className={[
                "absolute bottom-8 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out",
                expDockHidden ? "translate-y-[120px]" : "",
              ].join(" ")}
            >
              <ul className="pointer-events-auto inline-flex items-center gap-8 rounded-[26px] border border-white/10 bg-[rgba(166,166,166,0.20)] px-8 pt-4 pb-6 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">
                <DockBtn label={t("apt.save")} active={unitSaved} check={unitSaved} onClick={saveUnit}>
                  <svg viewBox="17 14 25 30" className="h-5 w-5" fill="currentColor"><path d="M29.38 39.6264L22.6399 42.5151C21.57 42.9697 20.5537 42.8831 19.5908 42.2551C18.6279 41.6271 18.1465 40.7375 18.1465 39.5863V18.7643C18.1465 17.8816 18.461 17.1263 19.0901 16.4983C19.7192 15.8703 20.4745 15.5558 21.3561 15.5547H37.4039C38.2865 15.5547 39.0424 15.8692 39.6715 16.4983C40.3005 17.1274 40.6145 17.8827 40.6135 18.7643V39.5863C40.6135 40.7364 40.132 41.626 39.1692 42.2551C38.2063 42.8842 37.1899 42.9708 36.1201 42.5151L29.38 39.6264Z" /></svg>
                </DockBtn>
                <DockBtn label={t("apt.back")} onClick={closeExpand}>
                  <svg viewBox="14 16 31 28" className="h-5 w-5" fill="currentColor"><path d="M14.6895 23.3041C14.8393 22.8572 15.0011 22.6897 15.3577 22.4074C17.9422 20.3577 21.0976 18.6666 23.7399 16.6525C24.3744 16.1812 25.4082 16.4509 25.7094 17.1868C25.9184 17.6974 25.83 17.9012 25.6667 18.3895C25.403 19.1787 24.9535 19.9524 24.7085 20.7549L37.3916 20.7527C40.9455 20.9461 43.6949 23.5575 44.0013 27.0722C43.8432 30.2602 44.2148 33.6504 44.0013 36.8147C43.7503 40.5369 40.7545 42.9719 37.1062 43.1342C32.4914 43.3395 27.7621 43.0335 23.1488 43.0609C22.3188 42.8815 21.5509 42.1383 21.4512 41.2846C21.2347 39.4298 21.7801 38.0959 23.8186 37.9744L37.447 37.9773C38.3085 37.8432 38.785 37.1978 38.8517 36.3648C39.0786 33.5074 38.6779 30.358 38.8487 27.4694C38.8352 26.6884 38.08 25.854 37.2755 25.854H24.9378L26.1431 28.4283C26.5185 29.6147 25.3378 30.5996 24.2328 30.0356L15.0543 24.4742L14.6902 23.7576V23.3041H14.6895Z" /></svg>
                </DockBtn>
                <DockBtn label={t("apt.share")} active={share} onClick={() => setShare(true)}>
                  <svg viewBox="38 37 35 30" className="h-5 w-5" fill="currentColor"><path d="M72.2246 51.056L59.3913 38.2227V45.556C46.5579 47.3893 41.0579 56.556 39.2246 65.7227C43.8079 59.306 50.2246 56.3727 59.3913 56.3727V63.8893L72.2246 51.056Z" /></svg>
                </DockBtn>
              </ul>
            </div>
            {/* retract tab — separate so it stays visible to un-retract */}
            <button
              type="button"
              onClick={() => setExpDockHidden((v) => !v)}
              aria-label={expDockHidden ? t("hud.showMenu") : t("hud.hideMenu")}
              className="pointer-events-auto absolute bottom-[18px] left-1/2 z-10 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-[6px] border border-white/10 bg-[rgba(166,166,166,0.28)] text-white/75 backdrop-blur-md"
            >
              <svg viewBox="0 0 24 24" className={["h-3.5 w-3.5 transition-transform", expDockHidden ? "" : "rotate-180"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
            </button>
          </div>

          {/* 360° viewer (spherical, three.js) */}
          {pano && (
            <div className="absolute inset-0 z-[70]">
              <Panorama360 src={pano} onClose={() => setPano(null)} />
            </div>
          )}

          {/* fullscreen room photo (fixed random pick per plan) */}
          {roomView && (
            <div className="zy-fadein pointer-events-auto absolute inset-0 z-[80] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={roomView.src} alt={pick(lang, ROOM_LABEL[roomView.room])} className="absolute inset-0 h-full w-full object-cover" />

              {/* no per-room save here — saving the plan (left detail menu) sends
                  all room images to the brochure at once. */}

              {/* centered back arrow (same style used elsewhere) */}
              <button
                type="button"
                onClick={() => setRoomView(null)}
                aria-label={t("apt.back")}
                className="absolute bottom-10 left-1/2 z-10 h-14 w-14 -translate-x-1/2 transition duration-200 hover:scale-110 hover:brightness-110"
              >
                <VoltarIcon className="h-full w-full drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]" />
              </button>
            </div>
          )}

          {/* calibration panel (?cal=1) — drag the eyes, then Save (persists to JSON) */}
          {cal && (
            <div className="pointer-events-auto absolute left-6 top-6 z-[85] w-[300px] rounded-xl border border-white/20 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-md">
              <p className="mb-1 text-xs font-semibold">Calibração · {selected.bedrooms} dorm.</p>
              <p className="mb-3 text-[10px] leading-snug text-white/55">Arraste cada olho até o cômodo certo e clique em Salvar.</p>
              <button
                type="button"
                onClick={saveCal}
                className="w-full rounded bg-accent py-2 text-xs font-semibold transition hover:brightness-110"
              >
                {calSaved ? "✓ Salvo" : "Salvar posições"}
              </button>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    `  ${selected.bedrooms}: [\n${calSpots.map((h) => `    { x: ${h.x}, y: ${h.y}, room: "${h.room}" },`).join("\n")}\n  ],`
                  )
                }
                className="mt-2 w-full rounded border border-white/20 py-1.5 text-[11px] font-medium text-white/70 transition hover:bg-white/10"
              >
                Copiar coordenadas (opcional)
              </button>
            </div>
          )}
        </div>
      )}

      {/* facade calibration (?fcal=1) — solar mode calibrates the solar faces,
          otherwise the apartments faces. Drag the 8 corners, then Save. */}
      {fcal && (solarMode ? solarFacade : facade) && (() => {
        const calFacade = (solarMode ? solarFacade : facade)!;
        const calQuads = solarMode ? solarQuads : faceQuads;
        return (
          <>
            <div className="pointer-events-none absolute inset-0 z-[50]">
              <svg className="absolute inset-0" width={calFacade.w} height={calFacade.h} viewBox={`0 0 ${calFacade.w} ${calFacade.h}`}>
                {calQuads.map((q, fi) => (
                  <polygon
                    key={fi}
                    points={cornerNames.map((c) => coverPoint(q[c][0], q[c][1], calFacade.w, calFacade.h).join(",")).join(" ")}
                    fill="none"
                    stroke={fi === 0 ? "#8667ea" : "#22d3ee"}
                    strokeWidth={1.5}
                  />
                ))}
              </svg>
              {calQuads.map((q, fi) =>
                cornerNames.map((c) => {
                  const [px, py] = coverPoint(q[c][0], q[c][1], calFacade.w, calFacade.h);
                  return (
                    <button
                      key={`${fi}-${c}`}
                      type="button"
                      onPointerDown={startFaceDrag(fi, c)}
                      style={{ left: px, top: py }}
                      className="pointer-events-auto absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white shadow"
                      aria-label={`${fi === 0 ? "A" : "B"} ${c}`}
                    >
                      <span className="block h-full w-full rounded-full" style={{ background: fi === 0 ? "#8667ea" : "#22d3ee" }} />
                    </button>
                  );
                })
              )}
              {/* central handle — drag the whole shape (all 8 corners) at once */}
              {(() => {
                const all = calQuads.flatMap((q) => [q.TL, q.TR, q.BR, q.BL]);
                const cx = all.reduce((s, p) => s + p[0], 0) / all.length;
                const cy = all.reduce((s, p) => s + p[1], 0) / all.length;
                const [px, py] = coverPoint(cx, cy, calFacade.w, calFacade.h);
                return (
                  <button
                    type="button"
                    onPointerDown={startFaceMove}
                    style={{ left: px, top: py }}
                    className="pointer-events-auto absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border-2 border-white bg-black/60 text-white shadow backdrop-blur"
                    aria-label="Mover coluna inteira"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /></svg>
                  </button>
                );
              })()}
            </div>
            <div className="pointer-events-auto absolute right-4 top-4 z-[95] w-[240px] rounded-xl border border-white/20 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-md">
              <p className="mb-1 text-xs font-semibold">Calibrar fachada {solarMode ? "(SOLAR)" : "(Apartamentos)"}</p>
              {solarMode ? (
                <>
                  <p className="mb-2 text-[10px] leading-snug text-white/55">Arraste a alça <b>⊕ central</b> pra mover a coluna inteira (as bolinhas só ajustam o formato). Vá num horário, encaixe na torre, <b>Salvar keyframe</b>. Repita em 2–3 horários — interpola e acompanha o movimento.</p>
                  <p className="mb-2 text-[10px] text-white/45">Keyframes: {solarKeys.length} {solarKeys.length ? `(${solarKeys.map((k) => `${String(Math.floor((SOLAR_START_MIN + k.t * (SOLAR_END_MIN - SOLAR_START_MIN)) / 60)).padStart(2, "0")}h`).join(", ")})` : ""}</p>
                  <button type="button" onClick={saveSolarKey} className="w-full rounded bg-accent py-2 text-xs font-semibold transition hover:brightness-110">
                    {facesSaved ? "✓ Salvo" : `Salvar keyframe (${solarTime})`}
                  </button>
                  <button type="button" onClick={clearSolarKeys} className="mt-2 w-full rounded border border-white/20 py-1.5 text-[11px] text-white/70 transition hover:bg-white/10">
                    Limpar keyframes
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-3 text-[10px] leading-snug text-white/55">Arraste a alça <b>⊕ central</b> pra mover tudo, ou os cantos pra ajustar — <span className="text-[#8667ea]">A = frente</span>, <span className="text-[#22d3ee]">B = lateral</span> — até casar com a torre.</p>
                  <button type="button" onClick={saveFaces} className="w-full rounded bg-accent py-2 text-xs font-semibold transition hover:brightness-110">
                    {facesSaved ? "✓ Salvo" : "Salvar fachada"}
                  </button>
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* brochure → thank-you flow */}
      {selected && share && (
        <ShareScreen
          unit={selected}
          onClose={() => setShare(false)}
          onShared={() => {
            setShare(false);
            setThanks(true);
          }}
        />
      )}
      {thanks && (
        <ThankYouScreen
          onDone={() => {
            setThanks(false);
            clearSaved();
            setSelected(null);
            closePanel();
          }}
        />
      )}
    </div>
  );
}

// Room hotspot glyph.
function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Back arrow (white rounded square + purple arrow) — same glyph used elsewhere.
function VoltarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 59 59" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="58.5809" height="58.9663" rx="20.3477" fill="white" />
      <rect x="0.440574" y="0.440574" width="57.6997" height="58.0851" rx="19.9072" stroke="white" strokeOpacity="0.1" strokeWidth="0.881149" />
      <path d="M14.6895 23.3041C14.8393 22.8572 15.0011 22.6897 15.3577 22.4074C17.9422 20.3577 21.0976 18.6666 23.7399 16.6525C24.3744 16.1812 25.4082 16.4509 25.7094 17.1868C25.9184 17.6974 25.83 17.9012 25.6667 18.3895C25.403 19.1787 24.9535 19.9524 24.7085 20.7549L37.3916 20.7527C40.9455 20.9461 43.6949 23.5575 44.0013 27.0722C43.8432 30.2602 44.2148 33.6504 44.0013 36.8147C43.7503 40.5369 40.7545 42.9719 37.1062 43.1342C32.4914 43.3395 27.7621 43.0335 23.1488 43.0609C22.3188 42.8815 21.5509 42.1383 21.4512 41.2846C21.2347 39.4298 21.7801 38.0959 23.8186 37.9744L37.447 37.9773C38.3085 37.8432 38.785 37.1978 38.8517 36.3648C39.0786 33.5074 38.6779 30.358 38.8487 27.4694C38.8352 26.6884 38.08 25.854 37.2755 25.854H24.9378L26.1431 28.4283C26.5185 29.6147 25.3378 30.5996 24.2328 30.0356L15.0543 24.4742L14.6902 23.7576V23.3041H14.6895Z" fill="#8667EA" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

// Detail-panel action button: shows the white icon by default and cross-fades to
// the purple variant on hover (or stays purple while toggled active).
function PlanActionBtn({
  label,
  white,
  purple,
  active = false,
  pressed,
  check = false,
  onClick,
}: {
  label: string;
  white: string;
  purple: string;
  active?: boolean;
  pressed?: boolean;
  check?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="group relative h-[36px] w-[36px] transition active:scale-95"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/plantas/icons/${white}.svg`}
        alt={label}
        className={["h-[36px] w-[36px] transition-opacity", active ? "opacity-0" : "group-hover:opacity-0"].join(" ")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/plantas/icons/${purple}.svg`}
        alt=""
        aria-hidden
        className={["absolute inset-0 h-[36px] w-[36px] transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" ")}
      />
      {check && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white shadow">
          <CheckIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

function DockBtn({
  label,
  active = false,
  check = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  check?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="group relative flex flex-col items-center">
      {/* the squircle alone is what the holder centers on (label is absolute) */}
      <span
        className={[
          "relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/10 transition",
          // default = white/glass, purple on hover (or while toggled active)
          active
            ? "bg-accent text-white shadow-[0_0_12px_3px_rgba(134,103,234,0.45)]"
            : "bg-white/10 text-white/85 shadow-[0_0_10px_2px_rgba(0,0,0,0.25)] group-hover:bg-accent group-hover:text-white",
        ].join(" ")}
      >
        {children}
        {check && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white shadow ring-2 ring-[rgba(166,166,166,0.6)]">
            <CheckIcon className="h-2.5 w-2.5" />
          </span>
        )}
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
