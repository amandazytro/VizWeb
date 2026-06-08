// Tunable layout for the brochure screen, editable live via ?bcal=1 and saved to
// public/brochure-config.json (read by the brochure on open). Lets the layout be
// dialed in — column widths, paddings, text/image sizes, rotation — without code.

export type BrochureConfig = {
  // columns + frame
  cols: [number, number, number]; // column width ratios (fr)
  gap: number; // px gap between columns
  padX: number; // px horizontal padding
  padTop: number; // px top padding
  padBottom: number; // px bottom padding
  // overview card
  ovTitle: number; // "Overview" title px
  ovText: number; // specs text px
  ovImg: number; // building photo width %
  ovImgRot: number; // building photo rotation deg
  // opcionais card
  opTitle: number; // "Opcionais" title px
  opPlanScale: number; // plan scale %
  opPlanRot: number; // plan rotation deg
  opPill: number; // feature pill text px
  // imagens card
  imgTitle: number; // "Imagens selecionadas" title px
  // qr card
  qrSize: number; // QR px
  qrTitle: number; // "Acesse..." heading px
  price: number; // big price px
  circle: number; // share-circle diameter px
  // free per-block drag offsets (px), keyed by block id (overview, opcionais,
  // imagens, qr, dock). Applied as translate(); {0,0} when untouched.
  pos: Record<string, { x: number; y: number }>;
};

export const DEFAULT_BROCHURE: BrochureConfig = {
  cols: [1.12, 1.02, 0.92],
  gap: 20,
  padX: 40,
  padTop: 92,
  padBottom: 120,
  ovTitle: 22,
  ovText: 13,
  ovImg: 46,
  ovImgRot: 0,
  opTitle: 28,
  opPlanScale: 100,
  opPlanRot: 180,
  opPill: 9,
  imgTitle: 26,
  qrSize: 96,
  qrTitle: 15,
  price: 34,
  circle: 56,
  pos: {},
};

// Merge a partial saved config over the defaults (so new keys keep a default).
export function mergeBrochure(saved: Partial<BrochureConfig> | null | undefined): BrochureConfig {
  if (!saved || typeof saved !== "object") return DEFAULT_BROCHURE;
  return {
    ...DEFAULT_BROCHURE,
    ...saved,
    cols: (saved.cols ?? DEFAULT_BROCHURE.cols) as [number, number, number],
    pos: (saved.pos && typeof saved.pos === "object" ? saved.pos : {}) as Record<string, { x: number; y: number }>,
  };
}
